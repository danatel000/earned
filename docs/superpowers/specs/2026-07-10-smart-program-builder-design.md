# Smart Program Builder Design

## Status

Approved direction: build a premium-feeling Coach Setup / Smart Program Builder that creates personalized workout plans inside the existing lift tracker.

## Goal

Help users answer "what should I train next?" with a guided setup and generated program that uses their goals, schedule, equipment, workout history, fatigue, and weak muscle groups. The feature should feel like a lightweight virtual coach while staying free to run and reliable offline after login.

## Context

The app already has:

- Supabase auth and per-account synced private data.
- Weekly progression history.
- Custom exercises and removable/restorable exercises.
- Workout templates.
- Rest timer presets.
- Adaptive Next Workout suggestions.
- Fatigue trend, training quality, strongest/weakest muscle alerts, challenges, and social Feed.

The next highest-impact upgrade should deepen the coaching side of the product rather than adding another social feature immediately.

## Goals

- Add a guided Coach Setup flow.
- Generate a weekly program from user preferences and existing app data.
- Let users start a generated workout directly in the Log tab.
- Save the user's coaching profile and current generated plan with their account.
- Keep the feature free: no paid AI/API dependency for this step.
- Make the plan explain itself with clear reasoning, not just a list of exercises.

## Non-Goals

- No paid subscription gate yet.
- No OpenAI, wearable, Apple Health, Google Fit, or smart-equipment integrations in this step.
- No medical or injury diagnosis.
- No automatic deletion or replacement of workout history.
- No nutrition tracking.
- No calendar push notifications.
- No trainer marketplace.

## Data Model

Store coach data inside the existing synced app data, under `customEx._coach`, so no new Supabase table is required.

```js
customEx._coach = {
  profile: {
    goal: "strength" | "muscle" | "balanced" | "fat_loss",
    experience: "beginner" | "intermediate" | "advanced",
    daysPerWeek: 3 | 4 | 5 | 6,
    sessionLength: 30 | 45 | 60 | 75,
    equipment: {
      dumbbells: boolean,
      barbell: boolean,
      machines: boolean,
      cables: boolean,
      bodyweight: boolean
    },
    splitPreference: "current_rotation" | "push_pull_legs" | "upper_lower" | "full_body",
    intensityPreference: "conservative" | "moderate" | "aggressive",
    weakMuscleBias: boolean,
    updatedAt: string
  },
  plan: {
    id: string,
    createdAt: string,
    summary: string,
    days: [
      {
        id: string,
        label: string,
        dayKey: "bicepsShoulders" | "chestBack" | "legs",
        focus: string,
        reason: string,
        exercises: [
          {
            id: string,
            name: string,
            muscle: string,
            sets: number,
            reps: string,
            weightHint: string,
            progressionHint: string
          }
        ]
      }
    ]
  }
}
```

This keeps plan data private, account-scoped, and included in the existing `lift_tracker_data` sync path.

## Program Generation Logic

The generator is deterministic and explainable.

Inputs:

- Coach profile preferences.
- Existing exercise catalog, including custom exercises.
- Latest workout history.
- Fatigue trend.
- Training quality score.
- Strongest/weakest muscle groups.
- Current goals.
- Existing day structure: Biceps & Shoulders, Chest & Back, Legs.

Rules:

- If the user selects `current_rotation`, preserve the current three-day cycle and repeat it across the selected number of days.
- If the user selects `push_pull_legs`, map:
  - Push to chest, shoulders, triceps-style exercises.
  - Pull to back and biceps.
  - Legs to lower-body exercises.
- If the user selects `upper_lower`, alternate upper-body and leg days.
- If the user selects `full_body`, include 1-2 exercises from each major muscle category per session.
- If fatigue is high, reduce intensity hints and avoid aggressive progression.
- If weak muscle bias is enabled, prioritize the lowest-volume muscle groups from recent history.
- If equipment is disabled, avoid exercises whose names strongly imply that equipment.
- If the app cannot confidently filter an exercise, keep it but label the weight as a suggestion instead of a hard target.

## UI

Add a new coaching section to the app, preferably reachable from the existing `Volume` dashboard and/or a new `Coach` tab if the tab row remains usable on mobile.

### Coach Setup Card

Fields:

- Goal: Strength, Muscle Growth, Balanced, Fat Loss
- Experience: Beginner, Intermediate, Advanced
- Days per week: 3, 4, 5, 6
- Session length: 30, 45, 60, 75 minutes
- Split style: Current Rotation, Push Pull Legs, Upper Lower, Full Body
- Intensity: Conservative, Moderate, Aggressive
- Equipment toggles: Dumbbells, Barbell, Machines, Cables, Bodyweight
- Weak-muscle bias toggle

Primary action:

- `Generate Program`

### Generated Plan Card

Show:

- Program summary.
- Why this plan was chosen.
- Day cards with focus, exercises, set/rep targets, and progression hints.
- `Start Workout` button per day.
- `Regenerate` button.
- `Edit Setup` button.

### Log Integration

When a user starts a generated workout:

- Create or update a draft with `adaptivePlan` / `coachPlan` metadata.
- Set the active log day to the generated day.
- Preload suggested weights/reps when the app has historical data.
- Do not remove exercises from the user's routine.

## Error Handling

- If the user has no workout history, generate a conservative beginner-friendly plan from baseline exercises.
- If equipment filtering removes too many exercises, show a warning and keep the safest matching existing day.
- If saved coach data is malformed, reset only `_coach`, not the user's workouts.
- If saving fails, keep the generated plan in local state and let the existing sync retry system handle persistence.

## Privacy

- Coach preferences and generated plans are private.
- No coach settings are written to public sharing tables.
- Public Feed posts stay summary-only.
- No emails, passwords, private goals, drafts, or notes are exposed.

## Testing

Local verification:

- Add a verifier script that checks for Coach Setup, Generate Program, generated plan helpers, and Start Workout integration.
- Run existing public sharing and social engagement verifiers.
- Run `pnpm run build`.
- Browser smoke test:
  - Coach UI renders.
  - Changing setup options updates saved coach profile.
  - Generate Program creates day cards.
  - Start Workout opens the Log tab with the generated day loaded.
  - Console has no errors.

Manual behavior checks:

- New account with zero workout history can generate a plan.
- Existing `danatel` history generates a plan that reflects fatigue and weak muscle groups.
- Equipment filters do not crash when a user disables most equipment.
- Generated plans do not alter workout history until the user logs a workout.

## Rollout

1. Add verifier coverage for coach/program-builder app fragments.
2. Add coach profile defaults and plan-generation helpers.
3. Add Coach Setup and Generated Plan UI.
4. Wire save/regenerate/start-workout handlers.
5. Build and browser-test locally.
6. Refresh `lift-tracker-dist.zip` for Netlify.

## Future Extensions

- Calendar scheduling.
- Exercise substitution recommendations.
- Wearable/recovery integration.
- Paid AI coach layer.
- Trainer-created program marketplace.
