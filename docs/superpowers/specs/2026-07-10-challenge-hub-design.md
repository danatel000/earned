# Challenge Hub Design

Approved direction: continue HIU with a better challenge and motivation layer.

## Goals

- Make the existing Feed tab feel more habit-forming with clear weekly challenges.
- Give users a private `Challenge Score` that rewards volume, PRs, streaks, balance, and recovery-aware training.
- Highlight one `Spotlight Challenge` so the user knows what to chase next.
- Keep everything derived from existing workout history.

## Rules

No Supabase schema changes. Challenges are private calculations unless the user already chooses to share normal public workout summaries.

The challenge hub derives:

- `challengeCards`: individual challenges with progress, target, category, and reward copy.
- `completedCount`: completed challenges for the current history state.
- `spotlightChallenge`: the incomplete challenge closest to completion, or the best completed challenge.
- `challengeScore`: a single gamified score from challenge completion and weekly training quality.
- `weeklyQuest`: a short next-action prompt based on the spotlight challenge.

## UI

Replace the plain `Active Challenges` block inside the Feed tab with a `Challenge Hub` panel.

The panel shows:

- Challenge Score.
- Spotlight Challenge.
- Weekly Quest.
- Active challenge cards with progress bars.

## Verification

- Add `scripts/verify-challenge-hub-app.cjs`.
- Run the verifier before implementation and confirm it fails.
- Run all existing verifier scripts plus the new one.
- Run production build and refresh `lift-tracker-dist.zip`.
