# Public Follows Design

## Status

Approved direction: start with public follows now, then add private friend groups later.

## Context

The app already has Supabase authentication, private per-user workout storage, optional public profile sharing, public workout summary posts, post likes, and a community leaderboard. Public sharing only exposes safe workout summaries. Full workout data stays private in `lift_tracker_data`.

The next social upgrade should make the Feed feel more personal without forcing a full friend-request system yet.

## Goals

- Let signed-in users follow public lifters.
- Let users unfollow lifters they already follow.
- Show follower and following counts.
- Add a Discover Lifters section to the Feed.
- Add a feed filter for Everyone and Following.
- Keep all private workout data private.
- Leave a clean path for future friend groups and private challenges.

## Non-Goals

- No private friend requests in this step.
- No direct messages.
- No public comments yet.
- No exposing full workout logs, goals, drafts, or account emails.
- No paid subscription gates in this step.

## Data Model

Add a `public_follows` table:

```sql
create table if not exists public.public_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references public.public_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint public_follows_no_self_follow check (follower_id <> following_id)
);
```

Indexes:

- `public_follows_follower_idx` on `follower_id`
- `public_follows_following_idx` on `following_id`

RLS:

- Authenticated users can read follow rows when the followed profile is public or when they are the follower.
- Authenticated users can insert rows where `auth.uid() = follower_id`.
- Authenticated users can delete their own follow rows.
- Users cannot follow themselves.

The existing `public_profiles` table remains the source of truth for visible lifters. Only `share_enabled = true` profiles should appear in Discover.

## App Data Flow

On Feed load or Refresh Community:

1. Ensure the current user's public profile exists.
2. Load public workout posts and likes as the app does today.
3. Load public profiles with `share_enabled = true`.
4. Load follow rows for the signed-in user.
5. Build follower and following counts from public follow rows.

Follow button:

1. Insert `{ follower_id: currentUser.id, following_id: targetUserId }`.
2. Reload community data.
3. Update Discover and Following feed state.

Unfollow button:

1. Delete the matching follow row.
2. Reload community data.

Following filter:

- Everyone: show all shared public workout posts.
- Following: show only posts where `post.user_id` is in the current user's following set. The current user's own posts may also stay visible so the feed does not feel empty.

## UI

Feed gets three social sections:

- Community Sharing: existing public on/off control stays at the top.
- Discover Lifters: shows public lifters with username, follower count, following count, latest volume or post count, and Follow/Following button.
- Community Leaderboard: remains global for now, because global ranking is more exciting early.

The workout feed gets a small segmented filter:

- Everyone
- Following

Empty states:

- If no one else is public yet, show a quiet "No public lifters yet" state.
- If Following is selected and the user follows no one, show "Follow lifters to build your feed."
- If the public follows schema is missing, show the same setup-pending style already used for public sharing.

## Error Handling

- Public social failures must not block private workout saving.
- Missing schema errors should set public community status to unavailable/setup pending.
- Follow/unfollow failures should show a short inline error in the Feed.
- Duplicate follow inserts should be treated as already following.

## Privacy

- Following someone does not reveal private workout data.
- Discover only lists users who turned Public On.
- Public posts continue to contain summaries only: week, volume, PR count, trained muscle labels, score, badge, and top lift summary.
- Emails and passwords are never shown or stored in public tables.

## Testing

Local verification:

- Schema verifier checks `public_follows`, indexes, RLS, and policies.
- Build passes with `pnpm run build`.
- Browser test confirms Feed renders Discover Lifters and the Everyone/Following filter.
- Test follow and unfollow using the local app.

Supabase verification:

- Run updated `supabase.sql`.
- Confirm `danatel` can follow another public test account.
- Confirm a new/private account does not appear in Discover until Public On is enabled.
- Confirm private workout data still loads only for its owner.

## Rollout

1. Implement schema and verifier.
2. Implement app helpers for public profiles and follows.
3. Add Discover Lifters UI.
4. Add Everyone/Following filter.
5. Build and local browser-test.
6. Run updated Supabase SQL.
7. Deploy the refreshed `dist` build to Netlify.
