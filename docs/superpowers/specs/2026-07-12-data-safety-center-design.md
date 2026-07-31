# Data Safety Center Design

## Goal
Upgrade the simple history-only export/import into a private Data Safety Center that protects the user's full lift tracker account data.

## Why This Matters
Workout history is high-trust data. If users believe their logs, goals, custom routine, body metrics, notes, or programs can disappear, they will not treat the app as a serious gym companion. A full backup flow makes the app feel more durable and premium.

## Scope
- Replace the Goals tab export/import card with a `Data Safety Center`.
- Export a complete private JSON backup containing history, goals, and `customEx`.
- Import both new full backups and older history-only exports.
- Keep all backup work client-side and private.
- Do not add Supabase schema changes, public records, or new dependencies.

## User Experience
The Goals tab will show:
- `Data Safety Center` title.
- `Backup Health` summary with saved weeks, goals, custom routine data, and backup coverage.
- `Export Full Backup` button that downloads a JSON file.
- `Import Full Backup` button that accepts full account backups and legacy history-only files.
- Safety copy explaining that the full backup includes private goals, notes, body metrics, saved programs, and custom routine data.

Before import, the app confirms exactly what will be restored and warns that the current account data will be replaced.

## Data Format
New export shape:

```json
{
  "version": 7,
  "kind": "lift_tracker_full_backup",
  "exportedAt": "2026-07-12T00:00:00.000Z",
  "summary": {
    "weeks": 0,
    "goals": 0,
    "customRoutineData": 0
  },
  "history": [],
  "goals": {},
  "customEx": {}
}
```

Legacy import support:
- If the parsed file is an array, import it as `history`.
- If the parsed file has `history` but no full backup fields, import history and preserve current goals/custom routine data.
- If the parsed file has `kind: "lift_tracker_full_backup"`, import history, goals, and customEx together.

## Testing
Add a verifier script that checks the helper, parser, component, labels, app wiring, and README documentation.

## Risks
Import replaces account data, so the confirmation copy must be explicit. The feature must not export passwords, auth tokens, public community state from Supabase, or anything outside the user's private app data object.
