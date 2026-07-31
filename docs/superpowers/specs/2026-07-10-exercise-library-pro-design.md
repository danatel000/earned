# Exercise Library Pro Design

Approved direction: upgrade the existing Library tab into a premium exercise reference and quick-start surface.

## Goals

- Keep the existing Library tab and improve it instead of adding another tab.
- Add richer exercise profiles with target muscle, equipment, difficulty, rep range, best use case, setup, form cues, and avoid cues.
- Add filters for muscle group, equipment, and difficulty.
- Add a `Start This Workout` action that opens Log on the exercise's workout day.
- Keep all data private in the user's existing synced app data. No new Supabase schema is required.

## Data Model

Exercise profile data is derived from the current exercise catalog and naming rules. It does not need a new database table.

Generated library-start drafts may store a small `libraryFocus` object inside the existing local/synced draft:

- `dayKey`
- `exerciseId`
- `exerciseName`
- `muscle`
- `equipment`
- `difficulty`
- `repRange`
- `bestUse`

## UI

The Library header becomes `Exercise Library Pro`. It keeps search and muscle filters, then adds compact equipment and difficulty filter controls.

Each exercise card shows compact metadata chips while collapsed. When opened, the card shows a two-column profile: use case and rep range, then form cues and avoid cues. A `Start This Workout` button loads the related workout day in Log.

## Error Handling

If a profile cannot infer equipment or difficulty, it falls back to `Machine` and `Beginner`.

If a user starts a library workout while a draft already exists, the app preserves the existing draft inputs and only changes the active day plus `libraryFocus`.

## Verification

- `scripts/verify-exercise-library-pro-app.cjs` confirms the app contains the feature fragments.
- Production build must pass.
- The refreshed deploy zip must come from the latest `dist` output.
