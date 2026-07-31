# Workout Readiness Gate Design

## Goal
Add a private Log tab readiness gate that converts the user's sleep, energy, soreness, and live workout volume into a clear training mode before they save the workout.

## Why This Matters
Top workout apps reduce decision fatigue inside the gym. The app already collects readiness and live volume, but the user still has to interpret those signals manually. A readiness gate gives an immediate, practical recommendation: push, train normally, keep it controlled, or bias recovery.

## Scope
- Add one pure helper: `buildWorkoutReadinessGate(readinessScore, readiness, previewVol, prevDayVol, activeLoggedCount)`.
- Add one Log tab component: `WorkoutReadinessGate`.
- Render it inside the existing `Readiness Check-In` card.
- Use only draft/session state and existing helper data.
- Do not add Supabase schema changes, new persistence fields, or dependencies.

## User Experience
The Readiness Check-In card will show:
- `Workout Readiness Gate`
- `Recommended Mode`
- `Push Day`
- `Normal Training`
- `Controlled Session`
- `Recovery Bias`
- `Volume Check`
- `Readiness Mix`
- `Log Guidance`

The panel changes as readiness sliders and logged volume change. It should encourage smart load management without sounding like medical advice.

## Data Flow
`buildWorkoutReadinessGate` uses:
- `readinessScore`
- normalized readiness values
- `previewVol`
- `prevDayVol`
- `activeLoggedCount`

It returns:
- `workoutReadinessGate: true`
- `mode`
- `status`
- `score`
- `color`
- `volumeDeltaPct`
- `readinessMix`
- `guidance`
- `checks`

## Testing
Add a verifier script that checks the helper, component, required labels, Log tab rendering, and README note.

## Risks
The gate must not block saving workouts. It is guidance only. It should not diagnose recovery, injury, sleep quality, or health status.
