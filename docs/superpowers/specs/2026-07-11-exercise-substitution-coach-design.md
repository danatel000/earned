# Exercise Substitution Coach Design

Approved direction: continue HIU with a private in-workout substitution feature.

## Goals

- Help users keep training when a machine is taken, an exercise feels uncomfortable, or readiness is low.
- Suggest same-muscle alternatives from the existing exercise library and custom routine.
- Let users add a suggested swap to the current workout draft without changing saved history.
- Keep volume calculations honest: the user can skip the original lift, and only logged swap volume is counted.

## Rules

No Supabase schema changes. Substitutions are draft-only until the user saves the workout.

The app derives:

- `substitutionCoach`: a private set of suggested swaps for the active exercise.
- `buildExerciseSubstitutions`: a helper that ranks alternatives by muscle match, equipment difference, workout-day fit, and previous use.
- `Add Swap`: a draft action that adds the chosen substitute as a custom exercise on the current workout day.

## UI

Add `Smart Substitutions` inside Active Exercise Focus.

The panel shows:

- Same-muscle suggested alternatives.
- Equipment and rep-range tags.
- A short reason for each swap.
- `Add Swap` button that inserts the movement into the current day.

## Data Flow

Adding a swap creates a custom exercise in the current day and pre-fills draft inputs from the swap's prior logged values or catalog defaults. The original exercise stays in place, so the user can either log both or tap Skip on the original exercise.

## Verification

- Add `scripts/verify-exercise-substitution-coach-app.cjs`.
- Run the verifier before implementation and confirm it fails.
- Run all existing verifier scripts plus the new one.
- Run production build and refresh `lift-tracker-dist.zip`.
