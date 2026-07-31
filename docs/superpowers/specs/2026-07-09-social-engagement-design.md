# Social Engagement Design

## Status

Approved direction: build lightweight workout comments, richer post reactions, and activity notifications on top of the existing public sharing and follow system.

## Goal

Make the Feed feel alive after public sharing and follows by letting signed-in lifters react to public workout summaries, leave short comments, and see activity notifications when other users interact with them.

## Context

The app already has:

- Supabase authentication.
- Private workout data in `lift_tracker_data`.
- Optional public profiles in `public_profiles`.
- Public workout summaries in `public_workout_posts`.
- Basic likes in `public_post_likes`.
- Public follows in `public_follows`.
- Discover Lifters, Community Leaderboard, and Everyone/Following feed controls.

The next highest-impact upgrade should increase return visits and social accountability without exposing private workout data.

## Goals

- Add comments to public workout posts.
- Add richer post reactions beyond a single Like.
- Add notifications for follows, reactions, and comments.
- Show an unread notification badge on the Feed tab.
- Keep interaction data attached only to public workout summaries.
- Keep the feature small enough to ship and verify quickly.

## Non-Goals

- No photos, videos, or media uploads.
- No direct messages.
- No private group challenges.
- No comment threading.
- No moderation/admin dashboard.
- No public access for signed-out visitors.
- No exposure of full workout logs, goals, drafts, emails, or passwords.

## Data Model

### `public_post_comments`

Stores short comments on public workout summary posts.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `post_id uuid references public.public_workout_posts(id) on delete cascade`
- `user_id uuid references auth.users(id) on delete cascade`
- `body text not null`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Constraints:

- `length(trim(body)) between 1 and 240`

RLS:

- Authenticated users can read comments for posts whose author has Public On, plus their own comments.
- Authenticated users can create comments as themselves on public posts.
- Comment authors can update or delete their own comments.

### `public_post_reactions`

Stores one reaction type per user per post. This replaces the UI meaning of basic likes while staying compatible with existing `public_post_likes` during migration.

Columns:

- `post_id uuid references public.public_workout_posts(id) on delete cascade`
- `user_id uuid references auth.users(id) on delete cascade`
- `reaction text not null`
- `created_at timestamptz default now()`
- primary key: `(post_id, user_id)`

Allowed reactions:

- `strong`
- `pr`
- `respect`
- `motivation`

RLS:

- Authenticated users can read reactions for public posts.
- Authenticated users can create, update, or delete their own reaction on public posts.
- Users cannot create reactions outside the allowed list.

### `public_notifications`

Stores lightweight activity notifications for signed-in users.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid references auth.users(id) on delete cascade`
- `actor_id uuid references auth.users(id) on delete cascade`
- `type text not null`
- `post_id uuid references public.public_workout_posts(id) on delete cascade`
- `comment_id uuid references public.public_post_comments(id) on delete cascade`
- `created_at timestamptz default now()`
- `read_at timestamptz`

Allowed types:

- `follow`
- `reaction`
- `comment`

RLS:

- Users can read, update, and delete their own notifications.
- Users can create notifications only when `actor_id = auth.uid()` and the notification is tied to a real public action.

## Notification Creation

The client creates notifications after successful social actions:

- Follow: notify the followed user.
- Reaction: notify the post owner.
- Comment: notify the post owner.

Rules:

- Do not notify users about their own actions.
- A user can have one reaction per post. Changing `strong` to `respect` updates the reaction row and creates one new notification for the post owner.
- Removing a reaction does not create a notification.
- A notification failure must not roll back the social action.

## App Data Flow

`loadPublicCommunity(user)` expands to load:

- public posts
- profiles
- follows
- likes/reactions
- comments for visible public posts
- unread notifications for the current user

The UI derives:

- reaction counts by post and reaction type
- the current user's selected reactions
- latest comments per post
- unread notification count

Comment submit flow:

1. User types a short comment on a public post.
2. App trims and validates the comment locally.
3. App inserts into `public_post_comments`.
4. App creates a `comment` notification for the post owner unless the commenter owns the post.
5. App refreshes public community data.

Reaction flow:

1. User taps a reaction button.
2. If that reaction is already selected, the app deletes it.
3. If a different reaction is selected, the app upserts the new reaction for `(post_id, user_id)`.
4. App creates a `reaction` notification for the post owner unless the actor owns the post and unless the action was removal.
5. App refreshes reaction counts.

Notification flow:

1. Feed tab shows a small unread badge.
2. Feed includes a compact Activity panel near the top.
3. User can mark notifications read.

## UI

### Feed Tab Badge

The Feed tab shows a small count when unread notifications exist.

### Activity Panel

Add a compact Activity panel near the top of the Feed:

- Shows the latest 5 notifications.
- Has a `Mark read` control.
- Uses short copy like `@rafael commented on W3`.

### Public Post Cards

Public post cards in the Community Leaderboard / public feed gain:

- reaction buttons: `Strong`, `PR`, `Respect`, `Motivation`
- reaction counts
- latest two comments
- small comment input

The personal local Workout Feed can stay unchanged for this pass because it is not a public post surface.

## Privacy And Safety

- Comments and reactions only apply to public workout summary posts.
- Full workout history remains private.
- Emails, passwords, goals, drafts, and internal notes are never shown in public tables.
- Comment text is capped at 240 characters.
- Empty or whitespace-only comments are rejected.
- Deleting a public post removes its comments, reactions, and related notifications through cascading deletes where possible.

## Error Handling

- Missing schema shows the existing setup-pending public community message.
- Failed comment or reaction action shows a short inline error and keeps the app usable.
- Notification creation failure logs an error but does not undo the comment/reaction/follow.
- Public social failures do not block private workout saving.

## Testing

Local checks:

- Schema verifier requires comments, reactions, notifications tables and policies.
- App verifier checks for comments, reaction labels, notification state, and Activity panel text.
- `pnpm run build` passes.
- Browser smoke test confirms Feed renders Activity, reactions, and comment controls without console errors.

Supabase checks:

- Run updated `supabase.sql`.
- Confirm a user can react to another public user's post.
- Confirm a user can comment on another public user's post.
- Confirm post owner sees unread notifications.
- Confirm users cannot comment on posts for profiles that are not public.

## Rollout

1. Add Supabase schema and verifier coverage.
2. Add app helpers for comments, reactions, and notifications.
3. Add Feed state and UI.
4. Build and browser-test locally.
5. Run updated Supabase SQL.
6. Refresh Netlify deploy zip.
