# Next Set Coach Design

## Goal

Add a private Next Set Coach inside the Log tab so lifters get a simple next-set recommendation while entering their workout.

## Context

The app already supports set-by-set logging, active exercise focus, rest timer presets, warmup guidance, technique coaching, private notes, and Live PR Radar. The next high-impact logging improvement is to reduce mid-workout thinking: after the user logs a set, the app should suggest the next practical set target.

## Chosen Approach

Build a draft-only coach for the active focused exercise. It will read the current set rows, previous history for that exercise, exercise profile, and readiness score. It will not save anything automatically and will not require Supabase changes.

Alternatives considered:

- Full AI workout adjustment: too large and would require paid or server-side AI decisions.
- Post-workout next-session advice only: already partly covered by existing progressive overload tools.
- Per-exercise row hints everywhere: useful, but it would make the Log tab noisy.

The chosen approach is one compact Active Exercise Focus card with an optional `Add Suggested Set` action.

## Functional Requirements

- Show `Next Set Coach` in Active Exercise Focus.
- Use `buildNextSetCoach(history, activeFocusExercise, activeFocusCell, activeFocusProfile, readinessScore)` to produce a private recommendation.
- Display `Suggested Next Set`, `Target`, `Rest`, `Decision`, and `Why This Set`.
- If no set has been logged, suggest a starting set from the last logged lift or exercise default.
- If the latest set drops sharply in reps, recommend reducing load or holding effort.
- If the latest set is strong and readiness is good, recommend adding a rep or making a small load jump.
- Provide an `Add Suggested Set` button that inserts the recommendation into the active exercise draft.
- Keep skipped exercises out of the coach.

## Privacy

The feature is private and draft-only. It reads saved history and the unsaved Log tab draft, but it does not create public records or Supabase schema requirements.

## Testing

Add a verifier script that checks for the helper, component, Active Exercise Focus wiring, action button, labels, README documentation, and no schema dependency.

