# Public Follows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add public follows so lifters can discover and follow public users, filter the feed to followed users, and keep private workout data protected.

**Architecture:** Extend the existing public-sharing layer with a `public_follows` table and RLS policies. Keep app changes inside the current `src/App.jsx` community helpers and `CommunityView`, matching the repo's current single-file pattern. Add schema verification fragments so missing Supabase setup is caught before deploy.

**Tech Stack:** React, Vite, Supabase Auth/PostgREST/RLS, plain Node verification script.

## Global Constraints

- Public sharing remains opt-in.
- Private workout data stays in `lift_tracker_data`.
- Public tables only expose safe summaries, profile names, follows, likes, and aggregate counts.
- Users cannot follow themselves.
- Public social failures must not block private workout saving.
- No direct messages, comments, private friend requests, or paid gates in this step.

---

## File Structure

- Modify `supabase.sql`: add `public_follows`, indexes, RLS policies, and policy cleanup statements.
- Modify `scripts/verify-public-sharing-schema.cjs`: require the new follow table and policy fragments.
- Modify `src/App.jsx`: add follow loading/toggling helpers, state, Feed filtering, Discover Lifters UI, and fallback handling for missing schema.
- Modify `README.md`: document optional public follows as part of community sharing.
- Update `lift-tracker-dist.zip`: package the rebuilt `dist` folder after verification.

---

### Task 1: Add Supabase Follow Schema

**Files:**
- Modify: `supabase.sql`
- Modify: `scripts/verify-public-sharing-schema.cjs`

**Interfaces:**
- Produces table: `public.public_follows(follower_id uuid, following_id uuid, created_at timestamptz)`
- Produces policies:
  - `Follows can read public follows`
  - `Follows owner can create own follows`
  - `Follows owner can delete own follows`

- [ ] **Step 1: Write the failing verifier update**

Add these required fragments to `scripts/verify-public-sharing-schema.cjs`:

```js
"create table if not exists public.public_follows",
"alter table public.public_follows enable row level security",
"public_follows_no_self_follow",
"public_follows_follower_idx",
"public_follows_following_idx",
"follows can read public follows",
"follows owner can create own follows",
"follows owner can delete own follows",
```

- [ ] **Step 2: Run verifier to verify it fails**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-public-sharing-schema.cjs
```

Expected: FAIL and list missing follow schema fragments.

- [ ] **Step 3: Add follow schema to `supabase.sql`**

Insert after `public_post_likes`:

```sql
create table if not exists public.public_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references public.public_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint public_follows_no_self_follow check (follower_id <> following_id)
);

create index if not exists public_follows_follower_idx
on public.public_follows (follower_id);

create index if not exists public_follows_following_idx
on public.public_follows (following_id);

alter table public.public_follows enable row level security;

drop policy if exists "Follows can read public follows" on public.public_follows;
drop policy if exists "Follows owner can create own follows" on public.public_follows;
drop policy if exists "Follows owner can delete own follows" on public.public_follows;

create policy "Follows can read public follows"
on public.public_follows for select
to authenticated
using (
  auth.uid() = follower_id
  or exists (
    select 1
    from public.public_profiles profile
    where profile.user_id = public_follows.following_id
      and profile.share_enabled = true
  )
);

create policy "Follows owner can create own follows"
on public.public_follows for insert
to authenticated
with check (
  auth.uid() = follower_id
  and follower_id <> following_id
  and exists (
    select 1
    from public.public_profiles profile
    where profile.user_id = public_follows.following_id
      and profile.share_enabled = true
  )
);

create policy "Follows owner can delete own follows"
on public.public_follows for delete
to authenticated
using (auth.uid() = follower_id);
```

- [ ] **Step 4: Run verifier to verify it passes**

Run the same Node command.

Expected: `Public sharing schema fragments verified.`

---

### Task 2: Add Follow Data Helpers

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces helper: `buildPublicSocialGraph(user, posts, profiles, follows)`
- Produces Supabase helper: `loadPublicCommunity(user)` returning `{posts, likes, profiles, follows, socialGraph}`
- Produces Supabase helper: `togglePublicFollow(user, followingId, isFollowing)`

- [ ] **Step 1: Add a failing verifier for helper names**

Create `scripts/verify-public-follows-app.cjs`:

```js
const fs = require("fs");
const path = require("path");

const appPath = path.join(__dirname, "..", "src", "App.jsx");
const app = fs.readFileSync(appPath, "utf8");

const required = [
  "function buildPublicSocialGraph",
  "async function togglePublicFollow",
  "publicProfiles",
  "publicFollows",
  "feedScope",
  "Discover Lifters",
  "Following",
];

const missing = required.filter(fragment => !app.includes(fragment));

if (missing.length) {
  console.error("Missing public follows app fragments:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Public follows app fragments verified.");
```

- [ ] **Step 2: Run verifier to verify it fails**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-public-follows-app.cjs
```

Expected: FAIL with missing app fragments.

- [ ] **Step 3: Add social graph helper**

Add near the public workout helpers:

```js
function buildPublicSocialGraph(user,posts=[],profiles=[],follows=[]){
  const followingIds=new Set(
    follows.filter(row=>row.follower_id===user.id).map(row=>row.following_id)
  );
  const followerCounts={};
  const followingCounts={};
  for(const row of follows){
    followerCounts[row.following_id]=(followerCounts[row.following_id]||0)+1;
    followingCounts[row.follower_id]=(followingCounts[row.follower_id]||0)+1;
  }
  const postCounts={};
  const latestPostByUser={};
  for(const post of posts){
    postCounts[post.user_id]=(postCounts[post.user_id]||0)+1;
    if(!latestPostByUser[post.user_id]||Number(post.week||0)>Number(latestPostByUser[post.user_id]?.week||0)){
      latestPostByUser[post.user_id]=post;
    }
  }
  return {followingIds,followerCounts,followingCounts,postCounts,latestPostByUser};
}
```

- [ ] **Step 4: Extend `loadPublicCommunity`**

After posts/likes load, query:

```js
const {data:profiles,error:profilesError}=await supabase.from("public_profiles")
  .select("user_id,username,display_name,share_enabled,updated_at")
  .eq("share_enabled",true)
  .order("updated_at",{ascending:false})
  .limit(50);
if(profilesError) throw profilesError;

const {data:follows,error:followsError}=await supabase.from("public_follows")
  .select("follower_id,following_id,created_at");
if(followsError) throw followsError;

const socialGraph=buildPublicSocialGraph(user,posts||[],profiles||[],follows||[]);
return {posts:posts||[],likes,profiles:profiles||[],follows:follows||[],socialGraph};
```

- [ ] **Step 5: Add follow toggle helper**

Add:

```js
async function togglePublicFollow(user,followingId,isFollowing){
  if(!user?.id||!followingId||user.id===followingId) return;
  if(isFollowing){
    const {error}=await supabase.from("public_follows")
      .delete()
      .eq("follower_id",user.id)
      .eq("following_id",followingId);
    if(error) throw error;
    return;
  }
  const {error}=await supabase.from("public_follows")
    .insert({follower_id:user.id,following_id:followingId});
  if(error&&error.code!=="23505") throw error;
}
```

- [ ] **Step 6: Run app verifier to verify it passes after Task 3 UI**

This verifier may still fail until Task 3 adds UI fragments.

---

### Task 3: Add Discover Lifters and Following Feed

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes `publicProfiles`, `publicFollows`, `publicSocialGraph`, `feedScope`
- Produces UI controls:
  - `Discover Lifters`
  - `Follow`
  - `Following`
  - `Everyone`

- [ ] **Step 1: Add App state**

Add near public state:

```js
const [publicProfiles,setPublicProfiles] = useState([]);
const [publicFollows,setPublicFollows] = useState([]);
const [publicSocialGraph,setPublicSocialGraph] = useState({
  followingIds:new Set(),
  followerCounts:{},
  followingCounts:{},
  postCounts:{},
  latestPostByUser:{},
});
const [feedScope,setFeedScope] = useState("everyone");
```

- [ ] **Step 2: Store community response**

Where `loadPublicCommunity` is called, set:

```js
setPublicProfiles(community.profiles||[]);
setPublicFollows(community.follows||[]);
setPublicSocialGraph(community.socialGraph||{
  followingIds:new Set(),
  followerCounts:{},
  followingCounts:{},
  postCounts:{},
  latestPostByUser:{},
});
```

- [ ] **Step 3: Add handler**

Add:

```js
const handleTogglePublicFollow=async(followingId,isFollowing)=>{
  if(!authUser?.user||!followingId) return;
  setPublicStatus("saving");
  setPublicError("");
  try{
    await togglePublicFollow(authUser.user,followingId,isFollowing);
    const community=await loadPublicCommunity(authUser.user);
    setPublicPosts(community.posts);
    setPublicLikes(community.likes);
    setPublicProfiles(community.profiles||[]);
    setPublicFollows(community.follows||[]);
    setPublicSocialGraph(community.socialGraph);
    setPublicStatus("ready");
  }catch(error){
    if(isMissingPublicSchemaError(error)) setPublicUnavailable();
    else{
      console.error(error);
      setPublicError("Could not update follow. Try refreshing community.");
      setPublicStatus("ready");
    }
  }
};
```

- [ ] **Step 4: Pass props to `CommunityView`**

Pass:

```jsx
publicProfiles={publicProfiles}
publicFollows={publicFollows}
publicSocialGraph={publicSocialGraph}
feedScope={feedScope}
onFeedScopeChange={setFeedScope}
onTogglePublicFollow={handleTogglePublicFollow}
currentUserId={authUser.user.id}
```

- [ ] **Step 5: Update `CommunityView` signature**

Add the same prop names to the parameter list.

- [ ] **Step 6: Add Discover Lifters section**

Render between Community Sharing and Community Leaderboard:

```jsx
<div style={{background:"#0a0a1e",border:"1px solid #24304f",
  borderRadius:14,padding:"14px",marginBottom:16}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:12}}>
    <div>
      <div style={{fontSize:9,color:"#FFB347",fontWeight:900,
        textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4}}>Discover Lifters</div>
      <div style={{fontSize:11,color:"#555",lineHeight:1.4}}>
        Follow public lifters to build a more personal feed.
      </div>
    </div>
    <div style={{fontSize:10,color:"#333",fontWeight:800}}>
      {publicProfiles.length} public
    </div>
  </div>
  {publicProfiles.filter(profile=>profile.user_id!==currentUserId).length>0?(
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {publicProfiles.filter(profile=>profile.user_id!==currentUserId).slice(0,6).map(profile=>{
        const isFollowing=publicSocialGraph.followingIds?.has(profile.user_id);
        const latest=publicSocialGraph.latestPostByUser?.[profile.user_id];
        return(
          <div key={profile.user_id} style={{display:"grid",gridTemplateColumns:"1fr auto",
            gap:10,alignItems:"center",background:"#07071a",border:"1px solid #151531",
            borderRadius:10,padding:"10px"}}>
            <div style={{minWidth:0}}>
              <div style={{fontSize:12,color:"#fff",fontWeight:950}}>@{profile.username}</div>
              <div style={{fontSize:9,color:"#555",marginTop:3}}>
                {(publicSocialGraph.followerCounts?.[profile.user_id]||0)} followers · {(publicSocialGraph.postCounts?.[profile.user_id]||0)} posts
                {latest?` · latest W${latest.week} ${Number(latest.total_volume||0).toLocaleString()} lbs`:""}
              </div>
            </div>
            <button onClick={()=>onTogglePublicFollow(profile.user_id,isFollowing)}
              disabled={!publicReady||publicStatus==="saving"}
              style={{padding:"7px 10px",borderRadius:999,border:`1px solid ${isFollowing?"#2DD4A055":"#1e1e38"}`,
                background:isFollowing?"#061811":"transparent",color:isFollowing?"#2DD4A0":"#777",
                fontSize:10,fontWeight:950,cursor:publicReady?"pointer":"default"}}>
              {isFollowing?"Following":"Follow"}
            </button>
          </div>
        );
      })}
    </div>
  ):(
    <div style={{background:"#07071a",border:"1px solid #12122a",borderRadius:10,
      padding:"12px",fontSize:11,color:"#555",lineHeight:1.45}}>
      No public lifters yet. When friends turn Public On, they will show here.
    </div>
  )}
</div>
```

- [ ] **Step 7: Add feed filter**

Before the workout feed list, add:

```jsx
<div style={{display:"flex",gap:6,margin:"0 0 10px"}}>
  {["everyone","following"].map(scope=>(
    <button key={scope} onClick={()=>onFeedScopeChange(scope)}
      style={{border:"1px solid #1e1e38",borderRadius:999,padding:"7px 10px",
        background:feedScope===scope?"#15153a":"#07071a",
        color:feedScope===scope?"#fff":"#555",fontSize:10,fontWeight:950}}>
      {scope==="everyone"?"Everyone":"Following"}
    </button>
  ))}
</div>
```

Use:

```js
const visiblePublicPosts=feedScope==="following"
  ? publicPosts.filter(post=>post.user_id===currentUserId||publicSocialGraph.followingIds?.has(post.user_id))
  : publicPosts;
```

for public feed/leaderboard snippets where appropriate.

- [ ] **Step 8: Run app verifier**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-public-follows-app.cjs
```

Expected: `Public follows app fragments verified.`

---

### Task 4: Docs, Build, Browser Verification, Package

**Files:**
- Modify: `README.md`
- Update generated: `dist`
- Update generated: `lift-tracker-dist.zip`

**Interfaces:**
- Consumes completed app and schema changes.
- Produces deployable zip for Netlify.

- [ ] **Step 1: Update README**

Add:

```md
Public follows are also opt-in around public profiles. Users can only discover and follow accounts that have Public On enabled. Following never exposes private workout data.
```

- [ ] **Step 2: Run schema verifier**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-public-sharing-schema.cjs
```

Expected: `Public sharing schema fragments verified.`

- [ ] **Step 3: Run app verifier**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-public-follows-app.cjs
```

Expected: `Public follows app fragments verified.`

- [ ] **Step 4: Run production build**

Run:

```powershell
$env:PATH='C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin;' + $env:PATH
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd' run build
```

Expected: Vite build exits 0. Existing chunk-size warning is acceptable.

- [ ] **Step 5: Browser verify local Feed**

Open `http://127.0.0.1:4186/`, reload, go to Feed, and confirm:

- `Discover Lifters` appears.
- `Everyone` and `Following` controls appear.
- `Public On` still works for `danatel`.
- Console has no errors.

- [ ] **Step 6: Package Netlify zip**

Run:

```powershell
Compress-Archive -Path .\dist\* -DestinationPath .\lift-tracker-dist.zip -Force
```

Expected: `C:\Users\danat\Documents\LIft Tracker\lift-tracker-dist.zip` has a new timestamp.

---

## Self-Review

- Spec coverage: schema, follows, discover UI, following filter, privacy, error handling, verification, and rollout are covered.
- Placeholder scan: no TBD/TODO/fill-in-later instructions are present.
- Type consistency: `publicProfiles`, `publicFollows`, `publicSocialGraph`, `feedScope`, `togglePublicFollow`, and `buildPublicSocialGraph` are named consistently across tasks.
