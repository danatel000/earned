# Premium Analytics HIU Design

## Goal

Add three private, recovery-aware analytics upgrades that turn saved workout history into clearer next-session decisions without changing workout volume, PR, streak, goal, skip, or account calculations.

## Scope

- Add a `Recovery Forecast` for the next session, 24 hours, and 48 hours.
- Add a `Muscle Drift Monitor` for persistent strongest/weakest muscle changes.
- Add a `Training Quality Breakdown` that explains the existing weekly score and compares it with the previous week.
- Render all three upgrades in the existing Volume analytics view.
- Use only existing private account data and existing derived helpers.
- Require no new dependencies, paid AI service, or Supabase schema changes.

## Considered Approaches

### 1. Integrated derived analytics (selected)

Extend the established helper-and-card pattern in `src/App.jsx`. This keeps calculations local, works offline, preserves current storage behavior, and minimizes risk to account synchronization.

### 2. Extract analytics into new modules

Move existing and new analytics into separate files before building the features. This would improve long-term maintainability, but it would turn a focused feature release into a broad refactor of a large, stable file and increase regression risk.

### 3. Server-side analytics snapshots

Store computed forecasts and alerts in Supabase. This could support future notifications and longitudinal reporting, but it would add schema, synchronization, and stale-cache concerns without improving the current on-device experience.

## Recovery Forecast

`buildRecoveryForecast(history, customEx)` returns a conservative training-readiness estimate based on data the app already has:

- Latest and recent fatigue scores from `getFatigueTrend`.
- Latest weekly quality score and recovery component from `getTrainingQuality`.
- Latest readiness check-in from `getReadinessScore`.
- Latest session RPE, rating, recovery-week marker, and volume change.

The result includes:

- `currentScore`: a 0-100 readiness estimate.
- `status`, `color`, and a short summary.
- Three forecast horizons: `Next session`, `In 24 hours`, and `In 48 hours`.
- An intensity recommendation: `Recovery`, `Controlled`, or `Progression ready`.
- Up to three plain-language factors explaining the score.

Forecast improvement over time is deliberately bounded. It may project fatigue easing, but never guarantees physiological recovery. The UI must use `estimate`, `signal`, and `forecast` language and must not diagnose injury, illness, overtraining, or sleep disorders.

With fewer than two saved workouts, the panel shows a useful low-confidence state based on the available workout and tells the user that more logged sessions and readiness check-ins improve the forecast.

## Muscle Drift Monitor

`buildMuscleDriftAlerts(history, customEx)` compares each of the five muscle groups across rolling windows:

- Recent window: the latest three saved workouts.
- Baseline window: up to the preceding three saved workouts.
- Each muscle uses its share of total window volume, not raw volume alone, so overall load changes do not automatically create imbalance alerts.
- Skipped and removed exercises remain excluded because the calculation uses the existing saved muscle-volume helpers.

An alert is considered persistent only when the app has at least four saved workouts and the muscle's recent share changes meaningfully from baseline. This prevents a single missed split day from being labeled a weakness.

The result includes:

- One `Falling behind` muscle when its share drops by at least 6 percentage points.
- One `Gaining ground` muscle when its share rises by at least 6 percentage points.
- A `Stable` state when no meaningful drift exists.
- Recent share, baseline share, direction, severity, and a specific next-step cue.

The monitor complements the existing strongest/weakest snapshot by explaining movement over time rather than duplicating the latest-week ranking.

## Training Quality Breakdown

`buildTrainingQualityBreakdown(history, customEx)` uses the existing `getTrainingQuality` result as the source of truth. It must not create a competing quality formula.

The result includes:

- Current score, grade, summary, and score change from the previous saved workout.
- The five existing components: Load, Balance, Recovery, Progress, and Consistency.
- Per-component change from the prior week when available.
- Strongest component, priority component, and two coaching actions.
- A compact quality trend for up to six saved workouts.

The panel explains why a score changed and how to improve it. A first workout receives a baseline state with no fabricated comparison.

## UI Placement And Behavior

The Volume view adds a `Premium Analytics` band after the current fatigue and quality summary area. The three panels use the app's restrained dark theme, existing status colors, compact typography, and responsive grids. Cards must remain readable on narrow phones without horizontal scrolling or nested cards.

The panels are read-only. They do not mutate history, drafts, goals, profile settings, Supabase rows, or public feed data.

## Error And Edge-Case Handling

- Empty history: panels do not render where no meaningful output exists.
- One saved workout: Recovery Forecast and Quality Breakdown show baseline states; Muscle Drift Monitor asks for more history.
- Missing readiness data: readiness is treated as unavailable, not as zero.
- Zero-volume or recovery weeks: use existing recovery-week semantics and avoid division by zero.
- Invalid dates: no date arithmetic is required for the three core scores.
- Custom exercises: continue using existing muscle inference and custom exercise catalogs.

## Verification

Each feature receives a focused Node verifier written before implementation and observed failing for the missing feature. After each feature turns green:

- Run its focused verifier.
- Run all `scripts/verify-*.cjs` regression verifiers.
- Run `npm run build`.
- Correct any regression before proceeding.

Final verification also includes the production preview smoke test, a source scan for malformed characters, deployment bundle refresh, and a browser launch on a confirmed responding local port.

## Assumptions

- Premium analytics remain available to the current app experience; this release does not add billing or feature entitlements.
- Analytics remain private to the signed-in account.
- No Supabase migration is required.
- Existing weekly workout history remains the time unit because the application was intentionally restored from daily progression to weekly progression.
