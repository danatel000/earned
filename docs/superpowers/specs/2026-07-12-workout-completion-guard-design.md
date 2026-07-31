# Workout Completion Guard Design

## Goal
Add a private Log tab checklist that tells the user whether the active workout day is ready to confirm by separating logged, skipped, removed, and still-unhandled exercises.

## User Value
- Prevents accidental saves with missing exercises.
- Makes skipped exercises feel intentional instead of like broken or zeroed data.
- Helps users understand why a day cannot be confirmed yet.
- Keeps the app fast during a workout by showing exactly what still needs attention.

## Requirements
- Add a helper named `buildWorkoutCompletionGuard`.
- Add a component named `WorkoutCompletionGuard`.
- The guard must show:
  - "Workout Completion Guard"
  - "Logged"
  - "Skipped"
  - "Removed"
  - "Needs Action"
  - "Ready to confirm"
- The guard must use current `inputs`, `activeDay`, and `customEx`.
- Logged means `isLoggedLiftCell(cell)` is true.
- Skipped means `isSkippedLiftCell(cell)` is true.
- Remaining means active exercises that are neither logged nor skipped.
- Removed count comes from `removedExercises(activeDay, customEx)`.
- The feature must not change volume math, save payloads, or Supabase schema.
- The feature must be private and draft-only until the workout is saved.

## Non-Goals
- No social sharing changes.
- No Supabase SQL changes.
- No new dependencies.
- No blocking modal beyond existing confirmation behavior.
