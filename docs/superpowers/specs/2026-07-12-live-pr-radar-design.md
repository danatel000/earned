# Live PR Radar Design

## Goal

Add a private Live PR Radar to the Log tab so a lifter can see, while entering sets, whether the current draft is close to or already beating previous bests.

## Context

The Log tab already shows live volume, previous workout comparison, readiness guidance, rest timer controls, and active exercise focus. The app also already stores full workout history privately per account. This feature should reuse those existing inputs and history helpers.

## Chosen Approach

Build an in-app, private PR radar that derives all output from the current unsaved draft and saved workout history. It should not write new data, change Supabase schema, or alter workout saving behavior.

Alternatives considered:

- A post-save PR summary only: simpler, but less helpful because it arrives after the user has already finished the session.
- A database-backed PR table: useful later, but unnecessary because current history already contains enough data.
- A live radar inside each exercise card: precise, but too noisy for the current Log tab.

The recommended approach is a compact dashboard-level card near Live Volume, plus per-candidate rows for the top draft PR opportunities.

## Functional Requirements

- Show a `Live PR Radar` card in the Log tab after the live volume preview.
- Read the current active workout day and only include exercises with logged, non-skipped draft input.
- Compare draft entries against historical bests for volume, top weight, and estimated one-rep max.
- Highlight up to three draft PR candidates.
- Label candidate types as `Volume PR`, `Weight PR`, and `Estimated 1RM PR`.
- Show a `Best Gap` metric for the top candidate, positive when the draft is above a previous best.
- Show a short `Coach Cue` that explains what the lifter should do next.
- Return no card when there are no logged draft lifts, keeping the Log tab clean at the start of a session.

## Data Flow

`LogForm` calls `buildLivePRRadar(history, customEx, activeDay, inputs)` after live volume calculations. The helper returns a pure object with `livePrRadar:true`, counts, status text, top candidate, and candidate rows. `LivePRRadar` renders that object without mutating state.

## Privacy

The feature is private. It uses saved account history and the unsaved local draft only. No Supabase schema changes are required.

## Testing

Add a verifier script that checks for the helper, component, Log tab wiring, required labels, README documentation, and no schema dependency.

