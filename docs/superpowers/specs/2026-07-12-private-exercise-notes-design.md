# Private Exercise Notes Design

Approved direction: continue HIU with private per-exercise setup notes.

## Goals

- Let users remember gym-specific setup details for each lift.
- Reduce friction during workouts by showing notes inside Active Exercise Focus.
- Make Exercise Library Pro feel more personal and premium.
- Keep notes private and synced with the existing user data object.

## Rules

No Supabase schema changes.

The app derives:

- `exerciseNotes`: private note records stored in `customEx._exerciseNotes`.
- `exerciseNoteFor`: normalized note lookup for a single exercise.
- `Private Exercise Notes`: UI panel for saving setup notes.
- `Setup Memory`: short description for remembered seat, grip, cable, or cue details.
- `Seat / Grip / Cue`: placeholder prompt.
- `Save Note`: action that writes to the existing private data path.

## UI

Add `ExerciseNotesPanel` in two places:

- Expanded Exercise Library Pro cards.
- Active Exercise Focus in the Log tab.

The panel lets users save, update, or clear a short note. Notes are private, never shown in the public feed, and do not change workout volume.

## Verification

- Add `scripts/verify-private-exercise-notes-app.cjs`.
- Run the verifier before implementation and confirm it fails.
- Run all existing verifier scripts plus the new one.
- Run production build and refresh `lift-tracker-dist.zip`.
