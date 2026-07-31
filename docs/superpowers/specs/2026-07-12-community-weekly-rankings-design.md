# Community Weekly Rankings Design

Approved direction: continue HIU with a stronger social leaderboard in the Feed tab.

## Goals

- Make public sharing feel more competitive and social.
- Rank lifters, not individual posts, so one user cannot fill the whole board with older weeks.
- Highlight the signed-in user's current public rank when they appear in the shared data.
- Keep the upgrade on the existing public workout summary schema.

## Rules

No Supabase schema changes.

The app derives:

- `buildCommunityLeaderboard`: a ranked leaderboard from visible public workout posts.
- `topByUser`: the best visible public workout for each lifter.
- `currentUserRank`: the signed-in user's row when they appear on the board.
- `Weekly Rankings`: Feed tab panel that shows one best public workout per lifter.
- `Your Rank`, `Best Score`, `Top Volume`, and `Active Lifters` summary cards.

## UI

Replace the raw post leaderboard in the Feed tab with `CommunityLeaderboardPanel`.

The panel shows:

- Everyone / Following filter controls.
- Weekly Rankings title and public-safe leaderboard description.
- Summary cards for Your Rank, Best Score, Top Volume, and Active Lifters.
- One ranked card per lifter using their best visible public workout.
- Existing reaction and comment controls on each ranked row.

## Verification

- Add `scripts/verify-community-weekly-rankings-app.cjs`.
- Run the verifier before implementation and confirm it fails.
- Run all existing verifier scripts plus the new one.
- Run production build and refresh `lift-tracker-dist.zip`.
