# Workout Scheduler Design

Approved direction: continue HIU with a private calendar-style planning feature.

## Goals

- Give users a clear next-week training agenda instead of only showing past logged workouts.
- Respect the user's usual rotating split while still adjusting for fatigue and recovery weeks.
- Let the user start the next scheduled workout from the Volume dashboard.
- Avoid database changes or external calendar integrations for this pass.

## Rules

No Supabase schema changes. The scheduler is generated from local synced workout history and current app helpers.

The app derives:

- `scheduledWorkouts`: seven upcoming agenda rows.
- `nextScheduledWorkout`: first upcoming training day.
- `recoveryDays`: generated recovery rows when fatigue is high or the week needs a lighter day.
- `summary`: concise explanation of the schedule.

Training days rotate through Biceps & Shoulders, Chest & Back, and Legs based on the dominant day from the latest saved workout. High fatigue inserts a recovery day before the next hard session.

## UI

Add `Workout Schedule Planner` to the Volume dashboard near the existing adaptive workout and calendar cards.

The panel shows:

- `7-Day Agenda`
- `Next Scheduled Workout`
- Recovery/training rows with dates, focus, and reason.
- `Start Scheduled Workout` button for the next training day.

## Verification

- Add `scripts/verify-workout-scheduler-app.cjs`.
- Run the verifier before implementation and confirm it fails.
- Run all existing verifier scripts plus the new one.
- Run production build and refresh `lift-tracker-dist.zip`.
