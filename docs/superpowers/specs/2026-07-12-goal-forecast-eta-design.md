# Goal Forecast ETA Design

Approved direction: continue HIU with private goal forecasting in the Goals tab.

## Goals

- Help users understand whether their current training pace is moving toward their goals.
- Estimate weeks remaining for weekly total-volume goals and per-exercise volume goals.
- Give a practical next target based on current volume, recent average, and trend.
- Keep all calculations private and derived from existing workout history and existing goals.

## Rules

No Supabase schema changes. Goal forecasts are generated from saved private workout history and private goals.

The app derives:

- `goalForecasts`: private forecast model for weekly and exercise goals.
- `Weeks to Goal`: estimated number of logged weeks needed if current pace continues.
- `Pace`: improving, stable, or needs momentum.
- `Next Target`: a realistic next volume target.
- `Exercise ETA`: per-exercise target timeline for the most relevant exercise goals.

## UI

Add `Goal Forecast & ETA` to the Goals tab under the weekly goal setter.

The panel shows:

- Weekly Goal Forecast.
- Weeks to Goal.
- Pace.
- Next Target.
- Exercise ETA rows.
- Empty state when no goals exist.

## Verification

- Add `scripts/verify-goal-forecast-eta-app.cjs`.
- Run the verifier before implementation and confirm it fails.
- Run all existing verifier scripts plus the new one.
- Run production build and refresh `lift-tracker-dist.zip`.
