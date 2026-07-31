# Workout Story Recap Design

Approved direction: continue HIU with post-workout storytelling inspired by social-first workout apps.

## Goals

- Make each saved workout feel more memorable than a raw number dump.
- Turn logged data into a concise story users can read, copy, or share.
- Improve the local Workout Feed so it feels more like a real fitness timeline.
- Keep the feature private and derived from existing workout data.

## Rules

No Supabase schema changes. Story text is generated in the app from saved history and public posts keep using the same safe summary fields.

The app derives:

- `storyHeadline`: short headline based on PRs, recovery, balance, or volume.
- `storyNarrative`: one readable paragraph from volume, best lift, muscles trained, rating, RPE, deload, and notes.
- `storyHighlights`: compact bullets such as top lift, PR count, trained muscles, rating, and RPE.
- `shareText`: upgraded copy text that includes the story.

## UI

Add a `Workout Story` card to the saved-workout recap screen. Add a smaller `Story` section to local Workout Feed cards. Rename the copy button to `Copy Story Recap`.

## Verification

- Add `scripts/verify-workout-story-recap-app.cjs`.
- Run the verifier before implementation and confirm it fails.
- Run all existing verifier scripts plus the new one.
- Run production build and refresh `lift-tracker-dist.zip`.
