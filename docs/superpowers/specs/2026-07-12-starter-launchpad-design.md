# Starter Launchpad Design

## Goal
Add a private onboarding card that helps new and incomplete accounts know exactly what to do next.

## Why This Matters
Fresh accounts currently start clean, which is good, but a blank tracker can feel unclear for friends and family trying the app for the first time. A launchpad improves activation by giving obvious next steps and direct tab jumps.

## Scope
- Add one pure helper: `buildStarterLaunchpad(history, goals, customEx)`.
- Add one dashboard component: `StarterLaunchpad`.
- Render it at the top of the Volume dashboard.
- Add navigation buttons that jump to existing tabs through `setView`.
- Do not add Supabase schema changes, new persistence fields, or dependencies.

## User Experience
The card appears when the account has not completed the core setup steps. It shows:
- `Starter Launchpad`
- `Setup Score`
- `First Workout`
- `Weekly Goal`
- `Bodyweight Entry`
- `Exercise Notes`
- `Routine Customization`

Each item has a completion state and a button:
- First Workout opens Log.
- Weekly Goal and Bodyweight Entry open Goals.
- Exercise Notes opens Library.
- Routine Customization opens Lifts.

When all setup tasks are done, the card returns `null` so established users do not lose dashboard space.

## Data Flow
`buildStarterLaunchpad(history, goals, customEx)` reads only existing private state:
- `history.length`
- `goals.weeklyVolume` and per-exercise goals
- `bodyMetrics(customEx)`
- `exerciseNotes(customEx)`
- `workoutTemplates(customEx)`, custom exercises, and removed/restored exercise state

The helper returns:
- `starterLaunchpad: true`
- `score`
- `completedCount`
- `totalCount`
- `items`
- `nextItem`

## Testing
Add a verifier script that checks the helper, component, labels, navigation wiring, and README note.

## Risks
This should not feel like a marketing page or tutorial wall. The card must be compact and action-oriented, and it should disappear once the account is fully set up.
