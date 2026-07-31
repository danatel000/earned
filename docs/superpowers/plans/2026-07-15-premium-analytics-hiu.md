# Premium Analytics HIU Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a private Recovery Forecast, rolling Muscle Drift Monitor, and explanatory Training Quality Breakdown to the Volume dashboard.

**Architecture:** Extend the existing pure analytics helpers and compact dashboard-card pattern in `src/App.jsx`. Each feature derives read-only output from saved account history, receives its own source verifier, and is integrated only after its helper behavior and UI contract are verified.

**Tech Stack:** React, Vite, Recharts, Node source verifiers, browser-local and Supabase-synced private account data.

## Global Constraints

- Preserve existing weekly volume, PR, streak, goal, skip, removal, account, public sharing, and Supabase behavior.
- Keep all new analytics private and read-only.
- Require no new dependency, paid service, or Supabase schema change.
- Treat recovery and drift output as estimates and training signals, not medical advice.
- Run the focused verifier, all source verifiers, and `npm run build` before advancing from each task.

---

### Task 1: Recovery Forecast

**Files:**
- Modify: `src/App.jsx`
- Modify: `README.md`
- Create: `scripts/verify-recovery-forecast-app.cjs`

**Interfaces:**
- Consumes: `getFatigueTrend(history, customEx)`, `getTrainingQuality(history, index, customEx)`, `getReadinessScore(readiness)`, latest `rpe`, `rating`, and `deload`.
- Produces: `buildRecoveryForecast(history, customEx)` and `RecoveryForecastPanel({history,customEx})`.

- [x] **Step 1: Write the failing verifier**

Require the helper/component names, all three forecast labels, the three recommendation modes, conservative forecast language, existing fatigue/quality/readiness dependencies, Volume dashboard integration, and README documentation.

- [x] **Step 2: Run the verifier and confirm RED**

Run: `node scripts/verify-recovery-forecast-app.cjs`

Expected: exit 1 because `buildRecoveryForecast` is missing.

- [x] **Step 3: Implement the forecast helper**

Compute a bounded current readiness score from latest fatigue, quality recovery component, optional readiness score, RPE, rating, and recovery-week state. Return stable `horizons`, `factors`, `recommendation`, `confidence`, `status`, `summary`, and color fields. Project 24-hour and 48-hour scores with bounded improvement and no guaranteed-recovery claims.

- [x] **Step 4: Render and document the panel**

Add a responsive `Recovery Forecast` card near the existing Fatigue Trend and Training Quality cards. Include an explicit `Training estimate, not medical advice` footer and document privacy/schema behavior in `README.md`.

- [x] **Step 5: Verify GREEN and regressions**

Run the focused verifier, every `scripts/verify-*.cjs`, and `npm run build`. Fix failures before Task 2.

### Task 2: Muscle Drift Monitor

**Files:**
- Modify: `src/App.jsx`
- Modify: `README.md`
- Create: `scripts/verify-muscle-drift-monitor-app.cjs`

**Interfaces:**
- Consumes: `MUSCLE_GROUPS`, `getMuscleVolumes(entry, customEx)`, and saved history.
- Produces: `buildMuscleDriftAlerts(history, customEx)` and `MuscleDriftMonitor({history,customEx})`.

- [x] **Step 1: Write the failing verifier**

Require rolling recent/baseline windows, volume-share comparison, a four-workout minimum, a six-percentage-point threshold, `Falling behind`, `Gaining ground`, and `Stable` states, helper/component integration, and README documentation.

- [x] **Step 2: Run the verifier and confirm RED**

Run: `node scripts/verify-muscle-drift-monitor-app.cjs`

Expected: exit 1 because `buildMuscleDriftAlerts` is missing.

- [x] **Step 3: Implement rolling-window drift analysis**

Aggregate muscle volumes across the latest three workouts and up to three preceding workouts. Convert each muscle to a share of total window volume, calculate percentage-point drift, sort by absolute movement, and return persistent alerts only when history and threshold requirements are met.

- [x] **Step 4: Render and document the monitor**

Add a compact responsive monitor with the leading decline, leading gain, stability state, recent/baseline shares, and coaching cue. Keep the existing Strongest / Weakest Alerts unchanged because it represents a different latest-week snapshot.

- [x] **Step 5: Verify GREEN and regressions**

Run the focused verifier, every `scripts/verify-*.cjs`, and `npm run build`. Fix failures before Task 3.

### Task 3: Training Quality Breakdown

**Files:**
- Modify: `src/App.jsx`
- Modify: `README.md`
- Create: `scripts/verify-training-quality-breakdown-app.cjs`

**Interfaces:**
- Consumes: `getTrainingQuality(history, index, customEx)` as the single quality source of truth.
- Produces: `buildTrainingQualityBreakdown(history, customEx)` and `TrainingQualityBreakdown({history,customEx})`.

- [x] **Step 1: Write the failing verifier**

Require the helper/component names, existing five component labels, prior-week deltas, strongest/priority components, two coach actions, six-workout trend, baseline copy, dashboard integration, and README documentation.

- [x] **Step 2: Run the verifier and confirm RED**

Run: `node scripts/verify-training-quality-breakdown-app.cjs`

Expected: exit 1 because `buildTrainingQualityBreakdown` is missing.

- [x] **Step 3: Implement the explanatory model**

Map the latest `getTrainingQuality` components to matching prior components, derive deltas without altering the quality formula, identify strongest and lowest components, generate two deterministic coaching actions, and return up to six quality trend points.

- [x] **Step 4: Render and document the breakdown**

Add score/grade change, component progress bars, per-component deltas, strongest/priority callouts, and two action rows. Show `Baseline week` when no prior result exists.

- [x] **Step 5: Verify GREEN and regressions**

Run the focused verifier, every `scripts/verify-*.cjs`, and `npm run build`. Fix failures before final audit.

### Task 4: Final Cross-Feature Audit And Test Launch

**Files:**
- Verify: `src/App.jsx`
- Verify: `README.md`
- Verify: `scripts/verify-*.cjs`
- Refresh: `dist/`, `lift-tracker-dist/`, and `lift-tracker-dist.zip`

- [x] Run all source verifiers and require zero failures.
- [x] Run `npm run build` and require exit 0.
- [x] Run `node scripts/smoke-preview.cjs` and require all expected HTTP 200 responses.
- [x] Scan source, docs, and scripts for malformed encoding sequences and accidental secret values.
- [x] Review the combined implementation against the design requirements and correct important issues.
- [x] Refresh the Netlify deployment folder and zip from the verified production build.
- [x] Start a durable local server on an unused loopback port and confirm HTTP 200 independently. Browser navigation was attempted but deferred after active user input and an unavailable Chrome extension made further automation unsafe.
