# Set Quality Tags Design

## Goal

Add private Set Quality Tags to the Log tab so lifters can quickly mark each set as Easy, Good, Hard, or Failed while logging.

## Context

The app now has set-by-set logging, Next Set Coach, Session Pacer, Live PR Radar, readiness check-ins, and training quality analytics. The next high-impact upgrade is to capture the user's subjective set quality without slowing down gym-floor logging.

## Chosen Approach

Store a lightweight `quality` field inside each set row in the existing private draft and saved `setDetails`. Add compact quality buttons below every set row and a small Active Exercise Focus summary that converts those tags into a cue.

Alternatives considered:

- Add a separate per-set RPE input: more precise, but slower to tap between sets.
- Add only one exercise-level quality selector: easier, but it loses the useful difference between early and late sets.
- Save quality in a new Supabase table: unnecessary because `setDetails` already syncs privately.

The chosen approach keeps data private, fast, and compatible with current volume calculations.

## Functional Requirements

- Preserve `quality` on logged set rows through parsing and saving.
- Add quality options: `Easy`, `Good`, `Hard`, and `Failed`.
- Add `handleSetQuality(activeDay, exerciseId, setIndex, quality)` in `LogForm`.
- Render `Set Quality` controls under every set row.
- Add `buildSetQualitySummary(activeFocusCell, readinessScore)` for the active focused exercise.
- Render a `Set Quality Summary` card in Active Exercise Focus with `Quality Mix`, `Hard Sets`, and `Coach Cue`.
- Do not count quality tags toward volume and do not change existing skip behavior.

## Privacy

Set quality is private account data stored in the existing draft/history object. No Supabase schema changes are required.

## Testing

Add a verifier script that checks for helper functions, UI labels, quality options, Log tab wiring, README documentation, and no schema dependency.

