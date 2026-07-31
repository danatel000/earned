# Training Momentum Coach Design

## Goal
Add a private dashboard card that turns workout dates into a simple momentum score, comeback plan, and next-session cue.

## Why This Matters
Gym apps retain users when they help people restart quickly after gaps. The app already tracks workout dates and has schedule/adaptive-plan helpers, so it can tell the user whether they are in rhythm, due for a lift, or should ease back in.

## Scope
- Add one pure helper: `buildTrainingMomentumCoach(history, customEx)`.
- Add one Volume dashboard card: `TrainingMomentumCoach`.
- Reuse `buildWorkoutSchedule(history, customEx)` for the next best lift.
- Allow the user to start the momentum plan through the existing draft/start-plan flow.
- Do not add Supabase schema changes, new persistence, new dependencies, or public data.

## User Experience
The card appears on the Volume dashboard after at least one workout is logged. It shows:
- `Training Momentum Coach`
- `Days Since Last Lift`
- `Momentum Score`
- `Last 14 Days`
- `Average Gap`
- `Next Best Lift`
- `Comeback Plan`
- `Streak Protection`

If a next scheduled workout exists, a `Start Momentum Plan` button loads it into the private Log draft using the existing start-plan path.

## Data Flow
`buildTrainingMomentumCoach(history, customEx)` reads:
- `entry.date` from saved history
- `calcStreak(history, customEx)`
- `buildWorkoutSchedule(history, customEx)`

It returns:
- `trainingMomentumCoach: true`
- `daysSinceLastLift`
- `workoutsLast14`
- `workoutsLast30`
- `averageGap`
- `score`
- `status`
- `comebackPlan`
- `streakProtection`
- `nextWorkout`

## Testing
Add a verifier script that checks the helper, component, labels, dashboard wiring, and README note.

## Risks
The feature should not shame users for missing days. Copy must frame gaps as restart guidance, not failure.
