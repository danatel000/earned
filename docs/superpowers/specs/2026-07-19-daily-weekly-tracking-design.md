# Daily And Weekly Tracking Design

## Goal

Give every Earned account a persistent choice between the existing weekly workflow and a true daily workout workflow, while preserving all saved history and making progress views reflect the selected tracking cadence.

## Selected Approach

Use a compatibility timeline. Existing history entries remain untouched and are interpreted as weekly records. New records explicitly store `periodType: "week"` or `periodType: "day"`. The app derives a daily session history or a weekly aggregate history at runtime, so users can switch modes without migrating, deleting, or duplicating their source data.

This approach was selected over relabeling weekly records, which would produce incorrect comparisons, and over replacing the existing history schema, which would create unnecessary risk for current Supabase accounts.

## Account Preference

- Add `preferences.trackingMode` to the account's existing consolidated data object.
- Allowed values are `weekly` and `daily`; missing or invalid values normalize to `weekly` for backward compatibility.
- Saving a mode change updates local state immediately and persists through the existing local and Supabase retry path.
- Signing out clears the in-memory preference. Signing into another account loads that account's own preference.
- Drafts remain compatible across mode switches because they already store all workout-section inputs. The selected mode is also stored in new drafts for diagnostics and future compatibility.

## Canonical History

The existing `history` array remains the source of truth.

- Legacy records with no `periodType` are treated as weekly records.
- Weekly saves add `periodType: "week"` and continue to contain the three confirmed workout sections.
- Daily saves add `periodType: "day"`, `dayKey`, a stable `periodId`, and only the exercises from the selected workout section.
- Records retain the existing `week` ordinal because public sharing and older helpers rely on it. It is an internal sequence number for daily records, not a user-facing week label.
- Deleting or editing a record operates on the canonical history index, even when the History screen is showing a derived daily or weekly view.

## Derived Histories

Create a focused `src/tracking/trackingPeriods.js` module with pure helpers.

### Daily Derivation

- A canonical daily record becomes one daily history row.
- A legacy or canonical weekly record is split into up to three read-only daily rows, one per workout section containing logged exercises.
- Split rows keep the source record date and carry `sourceIndex`, `sourcePeriodType`, and `dayKey` metadata.
- Old weekly data is never rewritten. The daily screen labels derived rows clearly by workout section.
- Empty and fully skipped sections do not create progress rows.

### Weekly Derivation

- A legacy or canonical weekly record remains one weekly row.
- Canonical daily records are grouped by Monday-based calendar week.
- Exercise volume and set counts are summed. Best weight, reps, and estimated one-rep-max inputs are preserved from the strongest constituent performance.
- Session ratings, RPE, and readiness are averaged when available; notes are preserved as a concise combined value.
- Derived rows retain source indexes so editing and deletion can target the correct canonical records.

## Logging Experience

### Weekly Mode

- Keep the current three-section workflow.
- Each section must be confirmed or skipped.
- Save creates one weekly record after all three sections are resolved.
- Existing Skip, Remove, draft, undo, rest timer, readiness, and coaching behavior remains unchanged.

### Daily Mode

- The user selects Biceps & Shoulders, Chest & Back, or Legs for today's session.
- Only that selected section must be resolved.
- Save creates one daily record immediately; the other two sections are not counted and are not marked skipped.
- Skipped exercises preserve their previous weight, reps, and sets but do not enter saved volume.
- At least one exercise must be logged for a progress entry. A fully skipped section clears safely without manufacturing a zero-volume performance record.
- The save button and helper copy use `Save Today's Workout`, the selected section name, and the current date.

## Progress And Analytics

- Daily mode passes derived daily history into lift charts, PRs, exercise recommendations, History, workout calendar, fatigue, recovery, training-quality, and private analytics.
- Weekly mode passes derived weekly history into those same features.
- User-facing period labels come from entry metadata instead of hardcoded `Week` or `W` strings.
- Daily streaks count consecutive distinct workout dates. Weekly streaks keep the existing progression/recovery-week logic.
- Daily mode's primary summary shows the latest session and day-based trend. It also shows current calendar-week volume so weekly goals visibly update after each daily save.
- Daily mode's Muscle Balance Radar uses the current calendar week's accumulated daily sessions, compared with the preceding calendar week, rather than judging balance from only the latest split day.
- Weekly mode's radar keeps the existing latest-week behavior.
- Weekly goals, weekly challenges, schedule planning, and the public weekly leaderboard remain calendar-week concepts. They consume weekly-derived history even while the account is in Daily mode.
- Premium analytics switch visible copy from `weekly` to `session` where their input is daily history; their formulas continue using the selected period history.

## Editing And History

- History rows show `Day N`, date, and workout section in Daily mode, and `Week N` in Weekly mode.
- Canonical daily rows can be edited directly.
- A daily row derived from an older weekly record opens the original weekly editor, because editing only a virtual split would silently alter the source week.
- A weekly aggregate composed of several daily records is read-only as one aggregate; the UI directs the user to Daily mode to edit its individual sessions.
- Deletion always names the actual scope and requires the existing confirmation.

## Persistence And Sharing

- Extend local backups, cloud data, and restore normalization to include `preferences`.
- Older backups without `preferences` restore in Weekly mode.
- Public workout posts and weekly rankings continue to use weekly-derived history, preventing three daily sessions from occupying three weekly leaderboard slots.
- No Supabase schema migration is required because `preferences` and period metadata live inside the existing JSON data column.

## Error Handling

- Invalid tracking mode values normalize to Weekly.
- Invalid or missing dates use deterministic fallback grouping and never throw.
- A daily record missing `dayKey` infers its section from its saved exercise IDs.
- Duplicate exercises in a weekly rollup sum volume and sets while preserving the strongest performance fields.
- Mode changes use the existing retry queue and sync-status UI.
- Failed saves leave the local UI and draft intact for retry.

## Verification

- Add pure unit tests for normalization, legacy weekly splitting, daily weekly-rollup aggregation, mixed histories, date streaks, and source-index preservation.
- Add a source integration verifier for the mode control, persistence wiring, daily save behavior, mode-aware views, radar aggregation, and backup support.
- Observe both new verifiers fail before implementation.
- Run focused verifiers after each implementation phase.
- Run the complete feature verifier suite and production build.
- Smoke-test both modes in the built app, including switching, saving a daily section, weekly rollup output, and reload persistence.

## Non-Goals

- No destructive migration of existing workout records.
- No new Supabase tables or payment changes.
- No fake wearable or AI data.
- No redesign of the exercise library, community feed, or subscription system beyond cadence-aware labels and inputs.
