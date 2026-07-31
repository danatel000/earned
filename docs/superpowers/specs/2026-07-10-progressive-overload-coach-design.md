# Progressive Overload Coach Design

Approved direction: add HIU step 2, a smarter per-exercise overload coach.

## Goals

- After each saved workout, recommend a next action per recently logged exercise.
- Actions must include `Add Weight`, `Add Reps`, `Add Set`, `Repeat`, and `Deload`.
- Explain why each recommendation was made.
- Keep recommendations private and derived from the user's own saved history.
- Do not change saved workout history, draft shape, public feed data, or Supabase schema.

## Rules

The coach compares the latest saved workout against the previous logged lift for each exercise:

- If the latest week is marked deload or has very high RPE, recommend `Deload` or controlled repeat.
- If there is no prior logged lift, recommend `Repeat` to establish a baseline.
- If volume dropped sharply, recommend `Repeat`.
- If reps or estimated 1RM moved up cleanly, recommend `Add Weight`.
- If load stayed flat and reps did not progress, recommend `Add Reps`.
- If volume is stable but sets are low, recommend `Add Set`.

## UI

Add a `Progressive Overload Coach` panel to the Volume dashboard near the other premium analytics cards.

Each recommendation card shows:

- Exercise name
- Workout day
- Action
- Next target
- Why
- Latest volume change when a previous lift exists

## Verification

- Add `scripts/verify-progressive-overload-app.cjs`.
- Run all existing verifier scripts plus the new one.
- Run production build and refresh `lift-tracker-dist.zip`.
