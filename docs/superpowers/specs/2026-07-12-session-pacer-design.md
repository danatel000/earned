# Session Pacer Design

## Goal

Add a private Session Pacer to the Log tab so lifters can see workout duration, logged set count, volume per minute, and a simple pace cue while training.

## Context

The Log tab already has live volume, rest timer, Live PR Radar, Next Set Coach, readiness guidance, and set-by-set logging. The next high-impact upgrade is to help users keep workouts moving without obsessing over the clock.

## Chosen Approach

Create a draft-only session clock that starts when the Log tab draft is created and persists through draft autosave. A pure helper converts elapsed time, live volume, logged exercises, logged sets, and readiness into a compact status card.

Alternatives considered:

- Full per-set timestamp tracking: more precise, but too invasive for the current single-file app.
- Calendar/session scheduling: useful later, but not as immediately helpful during a lift.
- Post-workout duration estimates only: lower friction, but it misses the live coaching moment.

The chosen approach adds live feedback with minimal persistence and no schema changes.

## Functional Requirements

- Show `Session Pacer` in the Log tab near live workout metrics.
- Track `sessionStartedAt` in the private draft so refreshes do not reset the clock.
- Use `buildSessionPacer(sessionStartedAt, sessionTick, previewVol, activeLoggedCount, activeSetCount, readinessScore)`.
- Display `Elapsed`, `Logged Sets`, `Volume / Min`, `Pace Cue`, and `Reset Clock`.
- Update the visible pacer periodically while the Log tab is open.
- Keep the pacer private and do not write public records.
- Do not block saving or change workout volume calculations.

## Privacy

The feature is private and stored only inside the user's existing draft data. No Supabase schema changes are required.

## Testing

Add a verifier script that checks for the helper, component, Log tab wiring, draft persistence, timer reset, required labels, README documentation, and no schema dependency.

