create table if not exists public.lift_tracker_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  draft jsonb,
  updated_at timestamptz not null default now()
);

alter table public.lift_tracker_data enable row level security;

drop policy if exists "Users can read own lift data" on public.lift_tracker_data;
drop policy if exists "Users can insert own lift data" on public.lift_tracker_data;
drop policy if exists "Users can update own lift data" on public.lift_tracker_data;
drop policy if exists "Users can delete own lift data" on public.lift_tracker_data;

create policy "Users can read own lift data"
on public.lift_tracker_data for select
using (auth.uid() = user_id);

create policy "Users can insert own lift data"
on public.lift_tracker_data for insert
with check (auth.uid() = user_id);

create policy "Users can update own lift data"
on public.lift_tracker_data for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own lift data"
on public.lift_tracker_data for delete
using (auth.uid() = user_id);

create table if not exists public.public_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  share_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_profiles_username_format check (username ~ '^[a-z0-9_-]{3,24}$')
);

create table if not exists public.public_workout_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.public_profiles(user_id) on delete cascade,
  week integer not null check (week > 0),
  workout_date date,
  total_volume integer not null default 0 check (total_volume >= 0),
  pr_count integer not null default 0 check (pr_count >= 0),
  set_count integer not null default 0 check (set_count >= 0),
  trained_muscles text[] not null default '{}'::text[],
  top_lift_name text,
  top_lift_volume integer not null default 0 check (top_lift_volume >= 0),
  leaderboard_score integer not null default 0 check (leaderboard_score >= 0),
  leaderboard_badge text,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week)
);

create table if not exists public.public_post_likes (
  post_id uuid not null references public.public_workout_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.public_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.public_workout_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_post_comments_body_length check (length(trim(body)) between 1 and 240)
);

create table if not exists public.public_post_reactions (
  post_id uuid not null references public.public_workout_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id),
  constraint public_post_reactions_allowed_reaction check (reaction in ('strong','pr','respect','motivation'))
);

create table if not exists public.public_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references public.public_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint public_follows_no_self_follow check (follower_id <> following_id)
);

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

create index if not exists public_profiles_share_enabled_idx
on public.public_profiles (share_enabled);

create index if not exists public_workout_posts_leaderboard_idx
on public.public_workout_posts (leaderboard_score desc, total_volume desc);

create index if not exists public_workout_posts_user_week_idx
on public.public_workout_posts (user_id, week desc);

create index if not exists public_post_comments_post_idx
on public.public_post_comments (post_id, created_at desc);

create index if not exists public_post_comments_user_idx
on public.public_post_comments (user_id, created_at desc);

create index if not exists public_post_reactions_post_idx
on public.public_post_reactions (post_id);

create index if not exists public_post_reactions_user_idx
on public.public_post_reactions (user_id);

create index if not exists public_follows_follower_idx
on public.public_follows (follower_id);

create index if not exists public_follows_following_idx
on public.public_follows (following_id);

create index if not exists public_notifications_user_idx
on public.public_notifications (user_id, read_at, created_at desc);

create index if not exists public_notifications_actor_idx
on public.public_notifications (actor_id, created_at desc);

alter table public.public_profiles enable row level security;
alter table public.public_workout_posts enable row level security;
alter table public.public_post_likes enable row level security;
alter table public.public_post_comments enable row level security;
alter table public.public_post_reactions enable row level security;
alter table public.public_follows enable row level security;
alter table public.public_notifications enable row level security;

drop policy if exists "Profiles can read shared profiles" on public.public_profiles;
drop policy if exists "Profiles owner can upsert own profile" on public.public_profiles;
drop policy if exists "Profiles owner can update own profile" on public.public_profiles;
drop policy if exists "Profiles owner can delete own profile" on public.public_profiles;

create policy "Profiles can read shared profiles"
on public.public_profiles for select
to authenticated
using (share_enabled = true or auth.uid() = user_id);

create policy "Profiles owner can upsert own profile"
on public.public_profiles for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Profiles owner can update own profile"
on public.public_profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Profiles owner can delete own profile"
on public.public_profiles for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Posts can read shared workout summaries" on public.public_workout_posts;
drop policy if exists "Posts owner can upsert own workout summaries" on public.public_workout_posts;
drop policy if exists "Posts owner can update own workout summaries" on public.public_workout_posts;
drop policy if exists "Posts owner can delete own workout summaries" on public.public_workout_posts;

create policy "Posts can read shared workout summaries"
on public.public_workout_posts for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.public_profiles profile
    where profile.user_id = public_workout_posts.user_id
      and profile.share_enabled = true
  )
);

create policy "Posts owner can upsert own workout summaries"
on public.public_workout_posts for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Posts owner can update own workout summaries"
on public.public_workout_posts for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Posts owner can delete own workout summaries"
on public.public_workout_posts for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Likes can read shared post likes" on public.public_post_likes;
drop policy if exists "Likes owner can create own likes" on public.public_post_likes;
drop policy if exists "Likes owner can delete own likes" on public.public_post_likes;

create policy "Likes can read shared post likes"
on public.public_post_likes for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.public_workout_posts post
    join public.public_profiles profile on profile.user_id = post.user_id
    where post.id = public_post_likes.post_id
      and profile.share_enabled = true
  )
);

create policy "Likes owner can create own likes"
on public.public_post_likes for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.public_workout_posts post
    join public.public_profiles profile on profile.user_id = post.user_id
    where post.id = public_post_likes.post_id
      and (profile.share_enabled = true or post.user_id = auth.uid())
  )
);

create policy "Likes owner can delete own likes"
on public.public_post_likes for delete
to authenticated
using (auth.uid() = user_id);

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
        from public.public_follows f
        where f.follower_id = public_notifications.actor_id
          and f.following_id = public_notifications.user_id
      )
    )
    or (
      type = 'reaction'
      and post_id is not null
      and comment_id is null
      and exists (
        select 1
        from public.public_post_reactions r
        join public.public_workout_posts post on post.id = r.post_id
        where r.post_id = public_notifications.post_id
          and r.user_id = public_notifications.actor_id
          and post.user_id = public_notifications.user_id
      )
    )
    or (
      type = 'comment'
      and post_id is not null
      and comment_id is not null
      and exists (
        select 1
        from public.public_post_comments c
        join public.public_workout_posts post on post.id = c.post_id
        where c.id = public_notifications.comment_id
          and c.post_id = public_notifications.post_id
          and c.user_id = public_notifications.actor_id
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

create table if not exists public.coach_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  disclosure_version text,
  disclosure_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Coach conversation',
  mode text not null check (mode in ('pre_workout','in_session','post_workout','planning')),
  summary text not null default '',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.coach_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) between 1 and 12000),
  structured_answer jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.coach_memory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid references public.coach_threads(id) on delete cascade,
  kind text not null check (kind in ('decision','preference','follow_up')),
  content text not null check (char_length(content) between 1 and 1000),
  source_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_data_exclusions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('session','date_range','exercise','data_category')),
  target_key text not null,
  selector jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id,target_type,target_key)
);

create table if not exists public.coach_trigger_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  trigger_key text not null,
  trigger_type text not null,
  status text not null check (status in ('active','dismissed','muted')),
  evidence jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key(user_id,trigger_key)
);

create table if not exists public.coach_audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid references public.coach_threads(id) on delete set null,
  request_id uuid not null,
  event_type text not null,
  provider text,
  model text,
  evidence jsonb not null default '{}'::jsonb,
  source_versions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.coach_source_registry (
  source_id text primary key,
  title text not null,
  canonical_url text not null,
  topics text[] not null default '{}',
  trust_tier integer not null check (trust_tier between 1 and 3),
  license_status text not null check (license_status in ('public_domain','licensed','earned_authored','metadata_only')),
  status text not null check (status in ('draft','review_required','approved','retired')),
  refresh_days integer not null check (refresh_days between 1 and 3650),
  last_reviewed_at timestamptz,
  last_successful_ingest_at timestamptz,
  current_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_source_versions (
  source_id text not null references public.coach_source_registry(source_id) on delete cascade,
  version text not null,
  content_hash text not null,
  content text not null,
  status text not null check (status in ('review_required','approved','ingesting','active','failed','superseded')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  ingested_at timestamptz,
  primary key(source_id,version)
);

create index if not exists coach_threads_user_updated_idx
on public.coach_threads(user_id,updated_at desc);

create index if not exists coach_messages_thread_created_idx
on public.coach_messages(thread_id,created_at);

create index if not exists coach_audit_user_created_idx
on public.coach_audit_events(user_id,created_at desc);

create index if not exists coach_source_status_idx
on public.coach_source_registry(status,trust_tier);

alter table public.coach_settings enable row level security;
alter table public.coach_threads enable row level security;
alter table public.coach_messages enable row level security;
alter table public.coach_memory_items enable row level security;
alter table public.coach_data_exclusions enable row level security;
alter table public.coach_trigger_states enable row level security;
alter table public.coach_audit_events enable row level security;
alter table public.coach_source_registry enable row level security;
alter table public.coach_source_versions enable row level security;

drop policy if exists "Coach settings owner can read" on public.coach_settings;
drop policy if exists "Coach settings owner can insert" on public.coach_settings;
drop policy if exists "Coach settings owner can update" on public.coach_settings;
drop policy if exists "Coach settings owner can delete" on public.coach_settings;

create policy "Coach settings owner can read"
on public.coach_settings for select
to authenticated
using (auth.uid() = user_id);

create policy "Coach settings owner can insert"
on public.coach_settings for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Coach settings owner can update"
on public.coach_settings for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Coach settings owner can delete"
on public.coach_settings for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Coach threads owner can read" on public.coach_threads;
drop policy if exists "Coach threads owner can insert" on public.coach_threads;
drop policy if exists "Coach threads owner can update" on public.coach_threads;
drop policy if exists "Coach threads owner can delete" on public.coach_threads;

create policy "Coach threads owner can read"
on public.coach_threads for select
to authenticated
using (auth.uid() = user_id);

create policy "Coach threads owner can insert"
on public.coach_threads for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Coach threads owner can update"
on public.coach_threads for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Coach threads owner can delete"
on public.coach_threads for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Coach messages owner can read" on public.coach_messages;
drop policy if exists "Coach members can insert their own user messages" on public.coach_messages;

create policy "Coach messages owner can read"
on public.coach_messages for select
to authenticated
using (
  auth.uid() = user_id and exists (
    select 1 from public.coach_threads t
    where t.id = thread_id and t.user_id = auth.uid()
  )
);

create policy "Coach members can insert their own user messages"
on public.coach_messages for insert
to authenticated
with check (
  auth.uid() = user_id and role = 'user' and exists (
    select 1 from public.coach_threads t
    where t.id = thread_id and t.user_id = auth.uid()
  )
);

drop policy if exists "Coach memory owner can read" on public.coach_memory_items;
drop policy if exists "Coach memory owner can insert" on public.coach_memory_items;
drop policy if exists "Coach memory owner can update" on public.coach_memory_items;
drop policy if exists "Coach memory owner can delete" on public.coach_memory_items;

create policy "Coach memory owner can read"
on public.coach_memory_items for select
to authenticated
using (
  auth.uid() = user_id and (
    thread_id is null or exists (
      select 1 from public.coach_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  )
);

create policy "Coach memory owner can insert"
on public.coach_memory_items for insert
to authenticated
with check (
  auth.uid() = user_id and (
    thread_id is null or exists (
      select 1 from public.coach_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  )
);

create policy "Coach memory owner can update"
on public.coach_memory_items for update
to authenticated
using (
  auth.uid() = user_id and (
    thread_id is null or exists (
      select 1 from public.coach_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  )
)
with check (
  auth.uid() = user_id and (
    thread_id is null or exists (
      select 1 from public.coach_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  )
);

create policy "Coach memory owner can delete"
on public.coach_memory_items for delete
to authenticated
using (
  auth.uid() = user_id and (
    thread_id is null or exists (
      select 1 from public.coach_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  )
);

drop policy if exists "Coach exclusions owner can read" on public.coach_data_exclusions;
drop policy if exists "Coach exclusions owner can insert" on public.coach_data_exclusions;
drop policy if exists "Coach exclusions owner can update" on public.coach_data_exclusions;
drop policy if exists "Coach exclusions owner can delete" on public.coach_data_exclusions;

create policy "Coach exclusions owner can read"
on public.coach_data_exclusions for select
to authenticated
using (auth.uid() = user_id);

create policy "Coach exclusions owner can insert"
on public.coach_data_exclusions for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Coach exclusions owner can update"
on public.coach_data_exclusions for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Coach exclusions owner can delete"
on public.coach_data_exclusions for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Coach triggers owner can read" on public.coach_trigger_states;
drop policy if exists "Coach triggers owner can insert" on public.coach_trigger_states;
drop policy if exists "Coach triggers owner can update" on public.coach_trigger_states;
drop policy if exists "Coach triggers owner can delete" on public.coach_trigger_states;

create policy "Coach triggers owner can read"
on public.coach_trigger_states for select
to authenticated
using (auth.uid() = user_id);

create policy "Coach triggers owner can insert"
on public.coach_trigger_states for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Coach triggers owner can update"
on public.coach_trigger_states for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Coach triggers owner can delete"
on public.coach_trigger_states for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Coach audits owner can read" on public.coach_audit_events;

create policy "Coach audits owner can read"
on public.coach_audit_events for select
to authenticated
using (
  auth.uid() = user_id and (
    thread_id is null or exists (
      select 1 from public.coach_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  )
);

drop policy if exists "Coach approved registry can be read" on public.coach_source_registry;

create policy "Coach approved registry can be read"
on public.coach_source_registry for select
to authenticated
using (status = 'approved');

revoke all on public.coach_settings,
  public.coach_threads,public.coach_messages,
  public.coach_memory_items,public.coach_data_exclusions,
  public.coach_trigger_states,public.coach_audit_events,
  public.coach_source_registry,public.coach_source_versions
from anon,authenticated;

grant select,insert,update,delete on public.coach_settings,
  public.coach_threads,public.coach_memory_items,
  public.coach_data_exclusions,public.coach_trigger_states to authenticated;

grant select on public.coach_messages,public.coach_audit_events,
  public.coach_source_registry to authenticated;

grant insert on public.coach_messages to authenticated;

revoke all on public.coach_source_versions from anon,authenticated;
