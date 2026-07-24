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
