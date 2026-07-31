# Premium Program Packs Design

Approved direction: continue HIU with curated trainer-style program packs.

## Goals

- Make the app feel closer to a premium fitness product with expert-style programs.
- Give users ready-made routines without requiring them to understand programming.
- Reuse existing private draft logging, so starting a pack does not alter saved history.
- Avoid payments, paid content hosting, and database changes.

## Rules

No Supabase schema changes.

The app derives:

- `buildProgramPacks`: curated packs generated from the user's current exercise catalog.
- `Premium Program Packs`: Library tab panel for curated routines.
- `Strength Foundation`, `Hypertrophy Builder`, and `Balanced Athletic` packs.
- `Start Program Day`: action that loads a selected pack day into the Log tab as a draft.
- `Program Pack Loaded`: Log tab banner for a pack day.

## UI

Add `ProgramPacksPanel` above Exercise Library Pro search controls.

The panel shows:

- Three curated program pack cards.
- Pack goal, length, session style, and coaching notes.
- Day cards inside each pack with focus, exercise count, and `Start Program Day`.
- The Log tab shows the loaded pack day using the existing coach-plan banner shape.

## Verification

- Add `scripts/verify-premium-program-packs-app.cjs`.
- Run the verifier before implementation and confirm it fails.
- Run all existing verifier scripts plus the new one.
- Run production build and refresh `lift-tracker-dist.zip`.
