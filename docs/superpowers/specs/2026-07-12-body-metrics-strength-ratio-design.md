# Body Metrics Strength Ratio Design

Approved direction: continue HIU with private bodyweight and strength-ratio tracking.

## Goals

- Let users track bodyweight inside the app without needing another health app.
- Connect lifting progress to bodyweight through simple strength-ratio analytics.
- Keep all body metrics private and synced under each user's existing account data.
- Avoid Supabase schema changes by storing metrics in the existing synced app data object.

## Rules

No Supabase schema changes. Body metrics are stored privately in `customEx._bodyMetrics`.

The app derives:

- `bodyMetrics`: private bodyweight entries sorted by date.
- `Body Metrics & Strength Ratio`: Goals tab panel for bodyweight logging and ratios.
- `Volume / lb`: latest weekly volume divided by latest bodyweight.
- `Best 1RM / lb`: strongest estimated one-rep max divided by latest bodyweight.
- `Weight Trend`: latest bodyweight change from the prior entry.

## UI

Add `Body Metrics & Strength Ratio` to the Goals tab near goal forecasts.

The panel shows:

- Latest bodyweight.
- Weight Trend.
- Volume / lb.
- Best 1RM / lb.
- Date and bodyweight inputs.
- `Save Bodyweight` button.
- Recent entries.

## Verification

- Add `scripts/verify-body-metrics-strength-ratio-app.cjs`.
- Run the verifier before implementation and confirm it fails.
- Run all existing verifier scripts plus the new one.
- Run production build and refresh `lift-tracker-dist.zip`.
