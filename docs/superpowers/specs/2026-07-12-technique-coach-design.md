# Technique Coach Design

Approved direction: continue HIU with trainer-style exercise guidance.

## Goals

- Make Exercise Library Pro feel more like a premium coaching resource.
- Give users quick form guidance during a workout without leaving the Log tab.
- Keep guidance local, private, and generated from the existing exercise catalog.
- Avoid paid video hosting or new database tables.

## Rules

No Supabase schema changes.

The app derives:

- `buildTechniqueCoach`: structured guidance for an exercise and its profile.
- `Technique Coach`: a reusable panel title for trainer-style form help.
- `Setup Checklist`: how to prepare before the first rep.
- `Rep Execution`: what to think through during each rep.
- `Safety Checks`: warning cues and when to reduce load or swap.
- `Progression Tip`: how to advance the movement.

## UI

Add `TechniqueCoachPanel` in two places:

- Expanded Exercise Library Pro cards.
- Active Exercise Focus in the Log tab.

The panel shows compact guidance cards that match the app theme and do not create new saved workout data.

## Verification

- Add `scripts/verify-technique-coach-app.cjs`.
- Run the verifier before implementation and confirm it fails.
- Run all existing verifier scripts plus the new one.
- Run production build and refresh `lift-tracker-dist.zip`.
