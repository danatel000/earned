# Per-Lift Progress Lab Design

Approved direction: continue HIU with richer per-exercise analytics in the Lifts tab.

## Goals

- Make each exercise card feel like a premium mini analytics page.
- Translate raw workout history into clear strength metrics users can act on.
- Keep all calculations private and derived from existing workout history.
- Avoid database changes and avoid changing workout volume calculations.

## Rules

No Supabase schema changes. Progress labs are generated from saved private workout history.

The app derives:

- `progressLab`: per-exercise analytics for the selected lift.
- `Estimated 1RM`: latest and best estimated one-rep-max from logged sets.
- `Best Set`: highest estimated strength set logged for that lift.
- `Volume Trend`: change from recent logged history.
- `Next Cue`: a concise action cue based on progression, consistency, and recent volume.

## UI

Add `Per-Lift Progress Lab` inside each expanded exercise card in the Lifts tab.

The panel shows:

- Estimated 1RM.
- Best Set.
- Volume Trend.
- Recent average volume.
- Recent Logs.
- Next Cue.

## Verification

- Add `scripts/verify-per-lift-progress-lab-app.cjs`.
- Run the verifier before implementation and confirm it fails.
- Run all existing verifier scripts plus the new one.
- Run production build and refresh `lift-tracker-dist.zip`.
