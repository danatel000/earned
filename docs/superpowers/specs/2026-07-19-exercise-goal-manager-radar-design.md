# Exercise Goal Manager And Goal-Aligned Radar Design

## Goal

Let users build and maintain a deliberate set of per-exercise volume goals from exercises they have previously logged, then make the Muscle Balance Radar accurately measure progress against that selected goal set.

## Current Problem

Per-exercise goals are stored as numeric properties keyed by exercise ID. The Goals view lists every active routine exercise whether it has a goal or not, and provides no explicit remove action. The Muscle Balance Radar aggregates every active exercise and substitutes the latest volume whenever an exercise has no saved goal. That fallback makes an intentionally excluded exercise indistinguishable from an exercise whose goal has not been configured.

## Goal Data Contract

- Existing numeric exercise properties in the `goals` object remain the source of truth and require no migration.
- `weeklyVolume` remains independent and is never treated as an exercise goal.
- An exercise belongs to the active goal set only when `goals[exerciseId]` is a finite number greater than zero.
- Removing an exercise goal deletes only that property from `goals`.
- Removing a goal never changes workout history, routine membership, custom exercises, removed-exercise state, drafts, or exercise notes.
- Setting a goal validates the target as a positive whole-number volume in pounds.

## Historical Exercise Library

The goal picker is built from exercises with at least one saved performance whose volume is greater than zero. It searches the complete exercise catalog, including active base exercises, custom exercises, and exercises later removed from a routine, then matches those definitions against saved history.

Each picker item includes:

- Exercise name
- Muscle group
- Workout-day label
- Most recent logged volume
- Current goal state

Exercises already in the active goal set remain visible but are labeled as added and cannot be added twice. Search filters by exercise name, muscle name, or workout-day label. Selecting an eligible exercise opens the existing target-volume editor.

## Goals Experience

The Per-Exercise Volume Goals section becomes a compact goal manager:

- A header shows active goal count and an `Add Exercise Goal` button.
- Active goals are grouped by workout day and show exercise name, muscle group, target volume, edit action, and remove action.
- Removing a goal uses a clear confirmation explaining that workout history and the routine remain untouched.
- When no exercise goals exist, the section shows a focused empty state and the add action.
- The existing weekly-volume goal, goal forecast, body metrics, and goal editing modal remain available.

## Goal-Aligned Muscle Balance Radar

The radar uses the active exercise goal set as its only exercise scope.

For each of Biceps, Shoulders, Chest, Back, and Legs:

1. `goalVolume` is the sum of explicit targets for goal exercises assigned to that muscle.
2. `currentVolume` is the sum of the latest saved volume for those same exercises.
3. `baselineVolume` is the sum of the first saved volume for those same exercises.
4. `previousVolume` is the sum of the previous saved volume for those same exercises.
5. Chart values are percentages of `goalVolume`: Goal is 100%, Current is current/goal, and Baseline is baseline/goal. Display values are capped at 125% so overachievement remains visible without destroying chart readability; exact pounds and uncapped percentages remain available in details.

A muscle with no explicit exercise goal uses zero for all three chart series and displays `No goal` in its detail row. It is never reported as 100% away.

The detail rows show:

- Current pounds / goal pounds
- Current goal-attainment percentage
- Pounds remaining, or pounds above target
- Change in goal-attainment percentage versus the previous saved workout

The radar header shows the number of exercise goals and muscle groups covered. With no exercise goals, the radar is replaced by a setup state that directs the user to Goals rather than drawing a misleading empty chart.

## Component And Calculation Boundaries

- Pure helpers normalize active exercise goals, build the historical goal-library rows, aggregate goal-scoped muscle volumes, and build radar presentation data.
- `GoalsView` owns only local picker/search UI state and calls app-level save/remove handlers.
- `BalanceRadar` consumes the pure radar model and emits an optional navigation callback for its setup action.
- `App` performs goal mutations through the existing `saveAll` path so local persistence and Supabase synchronization stay unchanged.

## Error Handling And Compatibility

- Invalid, zero, negative, `null`, and nonnumeric exercise targets are excluded from the active goal set.
- Unknown legacy goal keys remain persisted but are omitted from UI and radar calculations until a matching historical exercise definition exists.
- Duplicate exercise IDs are deduplicated in historical-library output.
- Accounts with existing valid goals see those goals automatically in the new manager.
- Accounts with no history cannot add an exercise goal from the historical library and receive a clear first-workout message.

## Testing

Automated verification must cover:

1. Active-goal normalization excludes `weeklyVolume` and invalid targets.
2. Historical picker rows include previously logged removed exercises and exclude never-logged exercises.
3. Removing a goal deletes only the selected goal property.
4. Goal-scoped radar aggregation includes only selected goal exercises.
5. Radar percentages use combined muscle targets and correctly report no-goal muscles.
6. Previous-workout comparison reports closer and farther movement correctly.
7. Existing Goals, radar, save, and cloud-sync wiring remain present.
8. The full verifier suite and production build succeed.
