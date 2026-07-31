# Achievements And Milestones Design

Approved direction: add HIU step 4, a premium-feeling achievement system derived from private workout history.

## Goals

- Reward long-term consistency without changing saved workout data.
- Show both unlocked achievements and the next milestone the lifter is closest to earning.
- Cover the training behaviors that matter most: workout count, lifetime volume, PRs, streaks, and muscle-group consistency.
- Keep all calculations private and local to the user's synced workout history.

## Rules

The app builds milestone progress from existing history:

- `Workout Milestone`: total saved workout entries.
- `Volume Milestone`: lifetime volume across all saved entries.
- `PR Milestone`: total volume PRs across saved workouts.
- `Streak Milestone`: current non-decreasing/recovery streak.
- `Muscle Milestone`: lifetime volume per muscle group.

Milestones can be locked or unlocked. Locked milestones show progress toward the target. The nearest locked milestone becomes the `nextMilestone`.

## UI

Replace the lightweight `AchievementBadges` dashboard block with `Achievements & Milestones`.

The panel shows:

- Unlocked count out of total milestones.
- Next milestone callout.
- Compact achievement cards with category, title, current progress, target, and progress bar.

## Verification

- Add `scripts/verify-achievements-milestones-app.cjs`.
- Run the new verifier first and confirm it fails before implementation.
- Run all existing verifier scripts plus the new one.
- Run production build and refresh `lift-tracker-dist.zip`.
