# Social Engagement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add comments, richer reactions, and activity notifications to public workout posts without exposing private workout data.

**Architecture:** Extend the existing Supabase public-sharing schema with comments, one-reaction-per-user-per-post, and owner-scoped notifications. Keep app implementation inside the current `src/App.jsx` public community helpers and `CommunityView` to match the app's existing single-file structure. Add verifier scripts so schema and UI fragments fail fast before build/deploy.

**Tech Stack:** React, Vite, Supabase Auth/PostgREST/RLS, plain Node verifier scripts, Netlify zip deployment.

## Global Constraints

- No photos, videos, or media uploads.
- No direct messages.
- No private group challenges.
- No comment threading.
- No moderation/admin dashboard.
- No public access for signed-out visitors.
- No exposure of full workout logs, goals, drafts, emails, or passwords.
- Comment text is capped at 240 characters.
- Empty or whitespace-only comments are rejected.
- Public social failures do not block private workout saving.

---

## File Structure

- Modify `supabase.sql`: add comments, reactions, and notifications tables with RLS policies.
- Modify `scripts/verify-public-sharing-schema.cjs`: require the new social-engagement schema fragments.
- Create `scripts/verify-social-engagement-app.cjs`: verify app helpers/UI fragments are present.
- Modify `src/App.jsx`: add reaction constants, engagement reducers, Supabase helpers, app state, handlers, Feed tab badge, Activity panel, post reactions, and comments.
- Modify `README.md`: document public comments/reactions/notifications privacy.
- Update generated `dist` and `lift-tracker-dist.zip` after verification.

---

### Task 1: Add Social Engagement Schema

**Files:**
- Modify: `supabase.sql`
- Modify: `scripts/verify-public-sharing-schema.cjs`

**Interfaces:**
- Produces table: `public.public_post_comments`
- Produces table: `public.public_post_reactions`
- Produces table: `public.public_notifications`
- Produces policies:
  - `Comments can read public post comments`
  - `Comments owner can create own comments`
  - `Comments owner can update own comments`
  - `Comments owner can delete own comments`
  - `Reactions can read public post reactions`
  - `Reactions owner can upsert own reactions`
  - `Reactions owner can update own reactions`
  - `Reactions owner can delete own reactions`
  - `Notifications owner can read own notifications`
  - `Notifications actor can create notifications`
  - `Notifications owner can update own notifications`
  - `Notifications owner can delete own notifications`

- [ ] **Step 1: Write failing schema verifier fragments**

Update `scripts/verify-public-sharing-schema.cjs` by adding these strings to the `required` array:

```js
"create table if not exists public.public_post_comments",
"create table if not exists public.public_post_reactions",
"create table if not exists public.public_notifications",
"alter table public.public_post_comments enable row level security",
"alter table public.public_post_reactions enable row level security",
"alter table public.public_notifications enable row level security",
"public_post_comments_body_length",
"public_post_reactions_allowed_reaction",
"public_notifications_allowed_type",
"comments can read public post comments",
"comments owner can create own comments",
"comments owner can update own comments",
"comments owner can delete own comments",
"reactions can read public post reactions",
"reactions owner can upsert own reactions",
"reactions owner can update own reactions",
"reactions owner can delete own reactions",
"notifications owner can read own notifications",
"notifications actor can create notifications",
"notifications owner can update own notifications",
"notifications owner can delete own notifications",
```

- [ ] **Step 2: Run schema verifier and confirm it fails**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-public-sharing-schema.cjs
```

Expected: FAIL with missing social engagement schema fragments.

- [ ] **Step 3: Add comments table and policies**

Insert after the existing `public_post_likes` table in `supabase.sql`:

```sql
create table if not exists public.public_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.public_workout_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_post_comments_body_length check (length(trim(body)) between 1 and 240)
);
```

Add indexes:

```sql
create index if not exists public_post_comments_post_idx
on public.public_post_comments (post_id, created_at desc);

create index if not exists public_post_comments_user_idx
on public.public_post_comments (user_id, created_at desc);
```

Add RLS enablement:

```sql
alter table public.public_post_comments enable row level security;
```

Add policies after the existing likes policies:

```sql
drop policy if exists "Comments can read public post comments" on public.public_post_comments;
drop policy if exists "Comments owner can create own comments" on public.public_post_comments;
drop policy if exists "Comments owner can update own comments" on public.public_post_comments;
drop policy if exists "Comments owner can delete own comments" on public.public_post_comments;

create policy "Comments can read public post comments"
on public.public_post_comments for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.public_workout_posts post
    join public.public_profiles profile on profile.user_id = post.user_id
    where post.id = public_post_comments.post_id
      and profile.share_enabled = true
  )
);

create policy "Comments owner can create own comments"
on public.public_post_comments for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.public_workout_posts post
    join public.public_profiles profile on profile.user_id = post.user_id
    where post.id = public_post_comments.post_id
      and profile.share_enabled = true
  )
);

create policy "Comments owner can update own comments"
on public.public_post_comments for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Comments owner can delete own comments"
on public.public_post_comments for delete
to authenticated
using (auth.uid() = user_id);
```

- [ ] **Step 4: Add reactions table and policies**

Insert after `public_post_comments`:

```sql
create table if not exists public.public_post_reactions (
  post_id uuid not null references public.public_workout_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id),
  constraint public_post_reactions_allowed_reaction check (reaction in ('strong','pr','respect','motivation'))
);
```

Add indexes:

```sql
create index if not exists public_post_reactions_post_idx
on public.public_post_reactions (post_id);

create index if not exists public_post_reactions_user_idx
on public.public_post_reactions (user_id);
```

Add RLS enablement:

```sql
alter table public.public_post_reactions enable row level security;
```

Add policies:

```sql
drop policy if exists "Reactions can read public post reactions" on public.public_post_reactions;
drop policy if exists "Reactions owner can upsert own reactions" on public.public_post_reactions;
drop policy if exists "Reactions owner can update own reactions" on public.public_post_reactions;
drop policy if exists "Reactions owner can delete own reactions" on public.public_post_reactions;

create policy "Reactions can read public post reactions"
on public.public_post_reactions for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.public_workout_posts post
    join public.public_profiles profile on profile.user_id = post.user_id
    where post.id = public_post_reactions.post_id
      and profile.share_enabled = true
  )
);

create policy "Reactions owner can upsert own reactions"
on public.public_post_reactions for insert
to authenticated
with check (
  auth.uid() = user_id
  and reaction in ('strong','pr','respect','motivation')
  and exists (
    select 1
    from public.public_workout_posts post
    join public.public_profiles profile on profile.user_id = post.user_id
    where post.id = public_post_reactions.post_id
      and profile.share_enabled = true
  )
);

create policy "Reactions owner can update own reactions"
on public.public_post_reactions for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and reaction in ('strong','pr','respect','motivation')
);

create policy "Reactions owner can delete own reactions"
on public.public_post_reactions for delete
to authenticated
using (auth.uid() = user_id);
```

- [ ] **Step 5: Add notifications table and policies**

Insert after `public_post_reactions`:

```sql
create table if not exists public.public_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  post_id uuid references public.public_workout_posts(id) on delete cascade,
  comment_id uuid references public.public_post_comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint public_notifications_allowed_type check (type in ('follow','reaction','comment'))
);
```

Add indexes:

```sql
create index if not exists public_notifications_user_idx
on public.public_notifications (user_id, read_at, created_at desc);

create index if not exists public_notifications_actor_idx
on public.public_notifications (actor_id, created_at desc);
```

Add RLS enablement:

```sql
alter table public.public_notifications enable row level security;
```

Add policies:

```sql
drop policy if exists "Notifications owner can read own notifications" on public.public_notifications;
drop policy if exists "Notifications actor can create notifications" on public.public_notifications;
drop policy if exists "Notifications owner can update own notifications" on public.public_notifications;
drop policy if exists "Notifications owner can delete own notifications" on public.public_notifications;

create policy "Notifications owner can read own notifications"
on public.public_notifications for select
to authenticated
using (auth.uid() = user_id);

create policy "Notifications actor can create notifications"
on public.public_notifications for insert
to authenticated
with check (
  auth.uid() = actor_id
  and user_id <> actor_id
  and (
    (
      type = 'follow'
      and post_id is null
      and comment_id is null
      and exists (
        select 1
        from public.public_follows follow
        where follow.follower_id = public_notifications.actor_id
          and follow.following_id = public_notifications.user_id
      )
    )
    or (
      type = 'reaction'
      and post_id is not null
      and comment_id is null
      and exists (
        select 1
        from public.public_post_reactions reaction
        join public.public_workout_posts post on post.id = reaction.post_id
        where reaction.post_id = public_notifications.post_id
          and reaction.user_id = public_notifications.actor_id
          and post.user_id = public_notifications.user_id
      )
    )
    or (
      type = 'comment'
      and post_id is not null
      and comment_id is not null
      and exists (
        select 1
        from public.public_post_comments comment
        join public.public_workout_posts post on post.id = comment.post_id
        where comment.id = public_notifications.comment_id
          and comment.post_id = public_notifications.post_id
          and comment.user_id = public_notifications.actor_id
          and post.user_id = public_notifications.user_id
      )
    )
  )
);

create policy "Notifications owner can update own notifications"
on public.public_notifications for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Notifications owner can delete own notifications"
on public.public_notifications for delete
to authenticated
using (auth.uid() = user_id);
```

- [ ] **Step 6: Run schema verifier and confirm it passes**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-public-sharing-schema.cjs
```

Expected: `Public sharing schema fragments verified.`

---

### Task 2: Add App Verifier And Engagement Helpers

**Files:**
- Create: `scripts/verify-social-engagement-app.cjs`
- Modify: `src/App.jsx`

**Interfaces:**
- Produces constant: `PUBLIC_REACTIONS`
- Produces helper: `emptyPublicEngagement()`
- Produces helper: `buildPublicEngagement(user, posts, comments, reactions, notifications)`
- Produces Supabase helper: `createPublicNotification({userId, actorId, type, postId, commentId})`
- Produces Supabase helper: `togglePublicReaction(user, post, selectedReaction, currentReaction)`
- Produces Supabase helper: `addPublicComment(user, post, body)`
- Produces Supabase helper: `markPublicNotificationsRead(user)`

- [ ] **Step 1: Create failing app verifier**

Create `scripts/verify-social-engagement-app.cjs`:

```js
const fs = require("fs");
const path = require("path");

const appPath = path.join(__dirname, "..", "src", "App.jsx");
const app = fs.readFileSync(appPath, "utf8");

const required = [
  "const PUBLIC_REACTIONS",
  "function emptyPublicEngagement",
  "function buildPublicEngagement",
  "async function createPublicNotification",
  "async function togglePublicReaction",
  "async function addPublicComment",
  "async function markPublicNotificationsRead",
  "publicEngagement",
  "commentDrafts",
  "Activity",
  "Strong",
  "Respect",
  "Motivation",
  "Comment",
];

const missing = required.filter(fragment => !app.includes(fragment));

if (missing.length) {
  console.error("Missing social engagement app fragments:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Social engagement app fragments verified.");
```

- [ ] **Step 2: Run app verifier and confirm it fails**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-social-engagement-app.cjs
```

Expected: FAIL with missing app fragments.

- [ ] **Step 3: Add reaction constants and empty engagement helper**

Add near `buildPublicSocialGraph` in `src/App.jsx`:

```js
const PUBLIC_REACTIONS = [
  {id:"strong",label:"Strong",color:"#2DD4A0"},
  {id:"pr",label:"PR",color:"#FFB347"},
  {id:"respect",label:"Respect",color:"#7C6FFF"},
  {id:"motivation",label:"Motivation",color:"#38BFFF"},
];

function emptyPublicEngagement(){
  return {
    reactionCounts:{},
    myReactions:{},
    commentsByPost:{},
    commentCounts:{},
    notifications:[],
    unreadCount:0,
  };
}
```

- [ ] **Step 4: Add `buildPublicEngagement`**

Add after `emptyPublicEngagement`:

```js
function buildPublicEngagement(user,posts=[],comments=[],reactions=[],notifications=[]){
  const postIds=new Set(posts.map(post=>post.id));
  const reactionCounts={};
  const myReactions={};
  for(const reaction of reactions.filter(row=>postIds.has(row.post_id))){
    reactionCounts[reaction.post_id] ||= {};
    reactionCounts[reaction.post_id][reaction.reaction]=(reactionCounts[reaction.post_id][reaction.reaction]||0)+1;
    if(reaction.user_id===user.id) myReactions[reaction.post_id]=reaction.reaction;
  }
  const commentsByPost={};
  const commentCounts={};
  for(const comment of comments.filter(row=>postIds.has(row.post_id))){
    commentsByPost[comment.post_id] ||= [];
    commentsByPost[comment.post_id].push(comment);
    commentCounts[comment.post_id]=(commentCounts[comment.post_id]||0)+1;
  }
  for(const postId of Object.keys(commentsByPost)){
    commentsByPost[postId].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  }
  const sortedNotifications=[...(notifications||[])]
    .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  return {
    reactionCounts,
    myReactions,
    commentsByPost,
    commentCounts,
    notifications:sortedNotifications,
    unreadCount:sortedNotifications.filter(item=>!item.read_at).length,
  };
}
```

- [ ] **Step 5: Extend missing-schema detector**

Update `isMissingPublicSchemaError` regex to include:

```js
public_post_comments|public_post_reactions|public_notifications
```

- [ ] **Step 6: Extend `loadPublicCommunity`**

Inside `loadPublicCommunity(user)`, after loading `follows`, add:

```js
const {data:comments,error:commentsError}=ids.length
  ? await supabase.from("public_post_comments")
      .select("id,post_id,user_id,body,created_at,updated_at")
      .in("post_id",ids)
      .order("created_at",{ascending:true})
  : {data:[],error:null};
if(commentsError) throw commentsError;

const {data:reactions,error:reactionsError}=ids.length
  ? await supabase.from("public_post_reactions")
      .select("post_id,user_id,reaction,created_at")
      .in("post_id",ids)
  : {data:[],error:null};
if(reactionsError) throw reactionsError;

const {data:notifications,error:notificationsError}=await supabase.from("public_notifications")
  .select("id,user_id,actor_id,type,post_id,comment_id,created_at,read_at")
  .eq("user_id",user.id)
  .order("created_at",{ascending:false})
  .limit(30);
if(notificationsError) throw notificationsError;

const engagement=buildPublicEngagement(user,posts||[],comments||[],reactions||[],notifications||[]);
```

Change the return to:

```js
return {
  posts:posts||[],
  likes,
  profiles:profiles||[],
  follows:follows||[],
  socialGraph,
  engagement,
};
```

- [ ] **Step 7: Add notification helper**

Add after `togglePublicFollow`:

```js
async function createPublicNotification({userId,actorId,type,postId=null,commentId=null}){
  if(!userId||!actorId||userId===actorId) return;
  const {error}=await supabase.from("public_notifications").insert({
    user_id:userId,
    actor_id:actorId,
    type,
    post_id:postId,
    comment_id:commentId,
  });
  if(error) console.error(error);
}
```

- [ ] **Step 8: Add reaction/comment/read helpers**

Add after `createPublicNotification`:

```js
async function togglePublicReaction(user,post,selectedReaction,currentReaction){
  if(!user?.id||!post?.id||!selectedReaction) return;
  if(currentReaction===selectedReaction){
    const {error}=await supabase.from("public_post_reactions")
      .delete()
      .eq("post_id",post.id)
      .eq("user_id",user.id);
    if(error) throw error;
    return;
  }
  const {error}=await supabase.from("public_post_reactions")
    .upsert({
      post_id:post.id,
      user_id:user.id,
      reaction:selectedReaction,
      created_at:new Date().toISOString(),
    },{onConflict:"post_id,user_id"});
  if(error) throw error;
  await createPublicNotification({
    userId:post.user_id,
    actorId:user.id,
    type:"reaction",
    postId:post.id,
  });
}

async function addPublicComment(user,post,body){
  const trimmed=String(body||"").trim();
  if(!user?.id||!post?.id||!trimmed) return null;
  if(trimmed.length>240) throw new Error("Comment must be 240 characters or less.");
  const {data,error}=await supabase.from("public_post_comments")
    .insert({post_id:post.id,user_id:user.id,body:trimmed})
    .select("id,post_id,user_id,body,created_at,updated_at")
    .single();
  if(error) throw error;
  await createPublicNotification({
    userId:post.user_id,
    actorId:user.id,
    type:"comment",
    postId:post.id,
    commentId:data.id,
  });
  return data;
}

async function markPublicNotificationsRead(user){
  if(!user?.id) return;
  const {error}=await supabase.from("public_notifications")
    .update({read_at:new Date().toISOString()})
    .eq("user_id",user.id)
    .is("read_at",null);
  if(error) throw error;
}
```

- [ ] **Step 9: Run app verifier and confirm it still fails for UI/state**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-social-engagement-app.cjs
```

Expected: FAIL until Task 3 adds state and UI fragments.

---

### Task 3: Wire State And Event Handlers

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `emptyPublicEngagement`, `togglePublicReaction`, `addPublicComment`, `markPublicNotificationsRead`
- Produces state: `publicEngagement`
- Produces state: `commentDrafts`
- Produces handler: `handleTogglePublicReaction(post, reactionId)`
- Produces handler: `handleSubmitPublicComment(post)`
- Produces handler: `handleMarkNotificationsRead()`

- [ ] **Step 1: Add state**

Inside `App`, near the public community state, add:

```js
const [publicEngagement,setPublicEngagement] = useState(emptyPublicEngagement());
const [commentDrafts,setCommentDrafts] = useState({});
```

- [ ] **Step 2: Reset engagement state on unavailable/logout**

In `setPublicUnavailable`, add:

```js
setPublicEngagement(emptyPublicEngagement());
setCommentDrafts({});
```

In `handleLogout`, add:

```js
setPublicEngagement(emptyPublicEngagement());
setCommentDrafts({});
```

- [ ] **Step 3: Apply engagement data**

In `applyPublicCommunity`, add:

```js
setPublicEngagement(community.engagement||emptyPublicEngagement());
```

- [ ] **Step 4: Create refresh helper**

Add inside `App` after `handleRefreshPublic`:

```js
const reloadPublicCommunity=async()=>{
  if(!authUser?.user) return;
  const community=await loadPublicCommunity(authUser.user);
  applyPublicCommunity(community);
  setPublicError("");
  setPublicStatus("ready");
};
```

- [ ] **Step 5: Notify on follows**

In `handleTogglePublicFollow`, after `await togglePublicFollow(...)`, add:

```js
if(!isFollowing){
  await createPublicNotification({
    userId:followingId,
    actorId:authUser.user.id,
    type:"follow",
  });
}
```

Then replace the manual `loadPublicCommunity` block in that handler with:

```js
await reloadPublicCommunity();
```

- [ ] **Step 6: Add reaction handler**

Add after `handleTogglePublicFollow`:

```js
const handleTogglePublicReaction=async(post,reactionId)=>{
  if(!authUser?.user||!post?.id) return;
  setPublicStatus("saving");
  setPublicError("");
  try{
    await togglePublicReaction(authUser.user,post,reactionId,publicEngagement.myReactions?.[post.id]);
    await reloadPublicCommunity();
  }catch(e){
    if(isMissingPublicSchemaError(e)) setPublicUnavailable();
    else{
      console.error(e);
      setPublicError(e?.message||"Could not update reaction.");
      setPublicStatus("ready");
    }
  }
};
```

- [ ] **Step 7: Add comment handler**

Add after `handleTogglePublicReaction`:

```js
const handleSubmitPublicComment=async(post)=>{
  if(!authUser?.user||!post?.id) return;
  const body=commentDrafts[post.id]||"";
  setPublicStatus("saving");
  setPublicError("");
  try{
    await addPublicComment(authUser.user,post,body);
    setCommentDrafts(drafts=>({...drafts,[post.id]:""}));
    await reloadPublicCommunity();
  }catch(e){
    if(isMissingPublicSchemaError(e)) setPublicUnavailable();
    else{
      console.error(e);
      setPublicError(e?.message||"Could not post comment.");
      setPublicStatus("ready");
    }
  }
};
```

- [ ] **Step 8: Add mark-read handler**

Add after `handleSubmitPublicComment`:

```js
const handleMarkNotificationsRead=async()=>{
  if(!authUser?.user) return;
  setPublicStatus("saving");
  try{
    await markPublicNotificationsRead(authUser.user);
    await reloadPublicCommunity();
  }catch(e){
    if(isMissingPublicSchemaError(e)) setPublicUnavailable();
    else{
      console.error(e);
      setPublicError(e?.message||"Could not mark activity read.");
      setPublicStatus("ready");
    }
  }
};
```

- [ ] **Step 9: Pass new props to `CommunityView`**

Add to the `CommunityView` props:

```jsx
publicEngagement={publicEngagement}
commentDrafts={commentDrafts}
onCommentDraftChange={setCommentDrafts}
onTogglePublicReaction={handleTogglePublicReaction}
onSubmitPublicComment={handleSubmitPublicComment}
onMarkNotificationsRead={handleMarkNotificationsRead}
```

- [ ] **Step 10: Add unread badge to Feed tab**

Inside the `tabs.map` button rendering, replace `{label}` with:

```jsx
<span style={{position:"relative",display:"inline-block"}}>
  {label}
  {id==="community"&&publicEngagement.unreadCount>0&&(
    <span style={{position:"absolute",top:-20,right:-10,minWidth:14,height:14,
      borderRadius:999,background:"#FF5C87",color:"#fff",fontSize:8,
      display:"flex",alignItems:"center",justifyContent:"center",
      fontWeight:950,border:"1px solid #06061a"}}>
      {Math.min(publicEngagement.unreadCount,9)}
    </span>
  )}
</span>
```

- [ ] **Step 11: Run app verifier and confirm it still fails only if UI text is missing**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-social-engagement-app.cjs
```

Expected: likely FAIL until Task 4 adds Activity/comments text.

---

### Task 4: Add Activity, Reactions, And Comments UI

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes props from Task 3.
- Produces visible text: `Activity`, `Strong`, `PR`, `Respect`, `Motivation`, `Comment`.

- [ ] **Step 1: Extend `CommunityView` signature**

Add these props:

```js
publicEngagement,commentDrafts,onCommentDraftChange,
onTogglePublicReaction,onSubmitPublicComment,onMarkNotificationsRead,
```

- [ ] **Step 2: Add notification label helper inside `CommunityView`**

Add below `copyPost`:

```js
const notificationLabel=item=>{
  const actor=publicProfiles.find(profile=>profile.user_id===item.actor_id)?.username||"Someone";
  const post=publicPosts.find(row=>row.id===item.post_id);
  const week=post?.week?` W${post.week}`:"";
  if(item.type==="follow") return `@${actor} followed you`;
  if(item.type==="comment") return `@${actor} commented on${week}`;
  if(item.type==="reaction") return `@${actor} reacted to${week}`;
  return `@${actor} interacted with you`;
};
```

- [ ] **Step 3: Add Activity panel**

Render after the Lifter Profile card and before Discover Lifters:

```jsx
<div style={{background:"#0a0a1e",border:"1px solid #24304f",
  borderRadius:14,padding:"14px",marginBottom:16}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:10}}>
    <div>
      <div style={{fontSize:9,color:"#FF5C87",fontWeight:900,
        textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4}}>Activity</div>
      <div style={{fontSize:11,color:"#555",lineHeight:1.4}}>
        Reactions, comments, and follows from other lifters.
      </div>
    </div>
    {publicEngagement.unreadCount>0&&(
      <button onClick={onMarkNotificationsRead}
        disabled={publicStatus==="saving"}
        style={{border:"1px solid #FF5C8755",borderRadius:999,padding:"7px 9px",
          background:"#1a0710",color:"#FF5C87",fontSize:9,fontWeight:950,
          cursor:"pointer"}}>
        Mark read {publicEngagement.unreadCount}
      </button>
    )}
  </div>
  {publicEngagement.notifications.length>0?(
    <div style={{display:"flex",flexDirection:"column",gap:7}}>
      {publicEngagement.notifications.slice(0,5).map(item=>(
        <div key={item.id} style={{display:"flex",justifyContent:"space-between",gap:8,
          alignItems:"center",background:item.read_at?"#07071a":"#120919",
          border:`1px solid ${item.read_at?"#12122a":"#FF5C8740"}`,
          borderRadius:9,padding:"8px 9px"}}>
          <div style={{fontSize:10,color:item.read_at?"#555":"#fff",fontWeight:800}}>
            {notificationLabel(item)}
          </div>
          <div style={{fontSize:8,color:"#444",fontWeight:800}}>
            {new Date(item.created_at).toLocaleDateString([],{month:"short",day:"numeric"})}
          </div>
        </div>
      ))}
    </div>
  ):(
    <div style={{background:"#07071a",border:"1px solid #12122a",borderRadius:10,
      padding:"12px",fontSize:11,color:"#555",lineHeight:1.45}}>
      No activity yet. Reactions and comments will show here.
    </div>
  )}
</div>
```

- [ ] **Step 4: Convert public post card layout for engagement UI**

Inside `visiblePublicPosts.slice(0,5).map`, replace the outer card grid style with a stacked card:

```jsx
<div key={post.id} style={{background:"#07071a",
  border:`1px solid ${color}30`,borderLeft:`3px solid ${color}`,
  borderRadius:10,padding:"10px"}}>
```

Keep the existing rank/profile/score row as a nested grid at the top:

```jsx
<div style={{display:"grid",gridTemplateColumns:"34px 1fr auto",
  gap:9,alignItems:"center",marginBottom:10}}>
  ...existing rank/profile/score markup...
</div>
```

- [ ] **Step 5: Add reaction buttons to each public post**

Inside the public post card, after the top grid:

```jsx
<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:9}}>
  {PUBLIC_REACTIONS.map(reaction=>{
    const active=publicEngagement.myReactions?.[post.id]===reaction.id;
    const count=publicEngagement.reactionCounts?.[post.id]?.[reaction.id]||0;
    return(
      <button key={reaction.id} onClick={()=>onTogglePublicReaction(post,reaction.id)}
        disabled={!publicReady}
        style={{padding:"7px 4px",borderRadius:8,
          border:`1px solid ${active?`${reaction.color}66`:"#1e1e38"}`,
          background:active?`${reaction.color}18`:"transparent",
          color:active?reaction.color:"#555",fontSize:8,fontWeight:950,
          cursor:publicReady?"pointer":"default"}}>
        {reaction.label} {count>0?count:""}
      </button>
    );
  })}
</div>
```

- [ ] **Step 6: Add comments list and input**

Below reactions:

```jsx
{(publicEngagement.commentsByPost?.[post.id]||[]).slice(-2).map(comment=>{
  const commenter=publicProfiles.find(profile=>profile.user_id===comment.user_id)?.username||"lifter";
  return(
    <div key={comment.id} style={{background:"#0a0a1e",border:"1px solid #14142e",
      borderRadius:8,padding:"7px 8px",marginBottom:6}}>
      <div style={{fontSize:9,color:"#777",fontWeight:900,marginBottom:2}}>
        @{commenter}
      </div>
      <div style={{fontSize:10,color:"#ddd",lineHeight:1.35}}>{comment.body}</div>
    </div>
  );
})}
<div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:7,marginTop:8}}>
  <input value={commentDrafts[post.id]||""}
    onChange={event=>onCommentDraftChange(drafts=>({...drafts,[post.id]:event.target.value.slice(0,240)}))}
    placeholder="Add a comment"
    disabled={!publicReady}
    style={{minWidth:0,background:"#050515",border:"1px solid #1e1e38",
      borderRadius:8,color:"#fff",padding:"8px 9px",fontSize:11,
      outline:"none"}}/>
  <button onClick={()=>onSubmitPublicComment(post)}
    disabled={!publicReady||!(commentDrafts[post.id]||"").trim()}
    style={{padding:"8px 10px",borderRadius:8,border:"1px solid #38BFFF44",
      background:"#071622",color:"#38BFFF",fontSize:10,fontWeight:950,
      cursor:publicReady?"pointer":"default",opacity:(commentDrafts[post.id]||"").trim()?1:0.55}}>
    Comment
  </button>
</div>
```

- [ ] **Step 7: Remove old Like button from public post cards**

Delete only the public leaderboard card's old `Like` button that calls `onTogglePublicLike(post.id,liked)`. Do not change the personal local Workout Feed Like button.

- [ ] **Step 8: Run app verifier and confirm it passes**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-social-engagement-app.cjs
```

Expected: `Social engagement app fragments verified.`

---

### Task 5: Docs, Build, Browser Verification, Package

**Files:**
- Modify: `README.md`
- Generated: `dist`
- Generated: `lift-tracker-dist.zip`

**Interfaces:**
- Consumes completed schema and app changes.
- Produces deployable Netlify zip.

- [ ] **Step 1: Update README**

Append this paragraph to the Supabase/public-sharing section:

```md
Public comments, reactions, and notifications are tied only to public workout summary posts. Comment text is capped at 240 characters, and private workout logs, goals, drafts, notes, account emails, and passwords remain private.
```

- [ ] **Step 2: Run schema verifier**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-public-sharing-schema.cjs
```

Expected: `Public sharing schema fragments verified.`

- [ ] **Step 3: Run app verifiers**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-public-follows-app.cjs
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-social-engagement-app.cjs
```

Expected:

```text
Public follows app fragments verified.
Social engagement app fragments verified.
```

- [ ] **Step 4: Run production build**

Run:

```powershell
$env:PATH='C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin;' + $env:PATH
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd' run build
```

Expected: Vite exits 0. Existing large-chunk warning is acceptable.

- [ ] **Step 5: Browser smoke test local Feed**

Open `http://127.0.0.1:4186/`, reload, go to Feed, and confirm:

- `Activity` panel renders.
- `Strong`, `PR`, `Respect`, and `Motivation` reaction buttons render.
- comment input and `Comment` button render on public posts.
- Feed tab can show notification badge when `publicEngagement.unreadCount > 0`.
- Console has no errors.

- [ ] **Step 6: Package Netlify zip**

Run:

```powershell
Compress-Archive -Path .\dist\* -DestinationPath .\lift-tracker-dist.zip -Force
Get-Item .\lift-tracker-dist.zip | Select-Object FullName,Length,LastWriteTime
```

Expected: zip exists at `C:\Users\danat\Documents\LIft Tracker\lift-tracker-dist.zip` with a fresh timestamp.

- [ ] **Step 7: Supabase rollout**

Run the updated `supabase.sql` in the Supabase SQL Editor before testing live comments/reactions/notifications.

Expected after SQL:

- public Feed no longer shows setup pending.
- comments can be added to public posts.
- reaction buttons can be toggled.
- post owner receives unread activity notifications.

---

## Self-Review

- Spec coverage: schema, comments, reactions, notifications, Feed badge, Activity panel, public post engagement UI, privacy, error handling, local checks, Supabase checks, and rollout are covered.
- Placeholder scan: no unfinished placeholder markers or unspecified test commands are present.
- Type consistency: `PUBLIC_REACTIONS`, `publicEngagement`, `commentDrafts`, `buildPublicEngagement`, `togglePublicReaction`, `addPublicComment`, and `markPublicNotificationsRead` are used consistently across tasks.
