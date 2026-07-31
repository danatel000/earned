# Workout Session UX Upgrade Design

Approved direction: improve the Log tab for real in-gym use before moving to the next HIU feature.

## Goals

- Make logging faster while lifting.
- Keep the existing weekly progression data model unchanged.
- Preserve auto-save drafts, skipped exercises, removed exercises, templates, rest timer, rating, RPE, and notes.
- Add active exercise focus so the user can see which movement they are working on.
- Add quick actions for copying the previous workout's lift and repeating the last set.
- Add a sticky session dock with active-day volume, logged count, and the next primary action.

## UI

The Log tab gets three additions:

1. `Active Exercise Focus`: a compact panel above the exercise list showing the selected exercise, logged volume, set count, and last workout values.
2. Per-exercise quick actions: `Focus`, `Copy Last Workout`, and `Repeat Last Set`.
3. `Session Dock`: a sticky bottom bar that keeps live volume and confirm/save actions reachable on mobile.

## Data Flow

All changes stay inside the current draft input structure:

- `activeFocusId` is local UI state only.
- `copyPreviousLiftToExercise` writes rows into `inputs[activeDay][exerciseId]`.
- `repeatLastSetForExercise` appends one copied set row.
- Existing autosave persists updated `inputs`.

## Verification

- Add `scripts/verify-workout-session-ux-app.cjs`.
- Run all existing verifier scripts plus the new script.
- Run production build and refresh `lift-tracker-dist.zip`.
