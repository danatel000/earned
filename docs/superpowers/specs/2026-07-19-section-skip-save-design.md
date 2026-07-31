# Section Skip And Save Design

## Goal

Add a Log page action that lets a user skip an entire workout section, such as Biceps & Shoulders, Chest & Back, or Legs, without resetting exercise values and without counting skipped exercises toward workout volume.

## Approved Behavior

- The Log page shows a section-level skip action for the currently selected workout day.
- Activating the action asks for confirmation before changing the section.
- Confirming marks every active exercise in that section as `skipped: true`.
- The action preserves each exercise's last known weight, reps, sets, and set rows by using the same prefill behavior as individual skipped exercises.
- The section is marked complete after all its exercises are skipped.
- Skipped exercises are ignored by the existing save-volume calculation.
- The weekly save flow is unchanged: the user still saves the week after all three workout days are complete.
- Existing individual `Skip` buttons and `Skip Remaining` remain available.

## UI Placement

The section-level action belongs near the existing section confirmation controls and sticky session dock because it is a workflow-level action, not an exercise-card action.

## Data Flow

- Reuse `liftInputFromLastLogged(history, ex)` to preserve the latest remembered lift values.
- Store skipped section entries in `inputs[dayKey][exerciseId]`.
- Call `unconfirmDay(dayKey)` before marking the section complete so the completion state is not stale.
- Call `setCompleted(prev => ({ ...prev, [dayKey]: true }))` once the section has been skipped.
- Do not write separate skipped-volume records; the existing save loop already excludes skipped cells.

## Testing

Add a verifier that checks the app contains:

- a section-level `skipAndConfirmDay` handler,
- full-day iteration across `allExercises(dk, customEx)`,
- prefill through `liftInputFromLastLogged(history, ex)`,
- `skipped: true` writes,
- completion update for the selected day,
- UI copy for `Skip & Save`,
- a button wired to the current `activeDay`,
- README documentation for the feature.

## Non-Goals

- Do not auto-save the full week immediately after skipping one section.
- Do not remove exercises from the routine.
- Do not reset skipped exercise values to zero.
- Do not change Supabase schema.
