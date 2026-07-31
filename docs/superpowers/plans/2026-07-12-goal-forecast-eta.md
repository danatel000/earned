# Goal Forecast ETA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add private goal ETA forecasting to the Goals tab.

**Architecture:** Add a pure `buildGoalForecasts(history, goals, customEx)` helper in `src/App.jsx`, then render it with a `GoalForecastPanel` inside `GoalsView`. The feature reads existing private history and goal values only and does not alter saved data.

**Tech Stack:** React, Vite, existing private workout history and goals, no new dependencies.

## Global Constraints

- No Supabase schema changes.
- Do not change how goals are saved.
- Do not change workout volume calculations.
- Verify with `scripts/verify-goal-forecast-eta-app.cjs` and production build.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-goal-forecast-eta-app.cjs`

**Interfaces:**
- Produces verifier command: `node scripts/verify-goal-forecast-eta-app.cjs`

- [x] **Step 1: Write failing verifier**

Check for the helper, Goals tab component, UI labels, forecast model naming, and README documentation.

- [x] **Step 2: Run verifier**

Expected before implementation: non-zero exit listing missing fragments.

### Task 2: Forecast Helper

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `buildGoalForecasts(history, goals, customEx)`

- [x] **Step 1: Calculate weekly goal forecast**
- [x] **Step 2: Calculate per-exercise forecast rows**
- [x] **Step 3: Generate pace, weeks-to-goal, and next-target values**

### Task 3: Goals Tab UI

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `goalForecasts`

- [x] **Step 1: Add `GoalForecastPanel` component**
- [x] **Step 2: Render it inside `GoalsView`**
- [x] **Step 3: Pass history into `GoalsView` from the app shell**

### Task 4: Docs And Verification

**Files:**
- Modify: `README.md`
- Generate: `dist`
- Generate: `lift-tracker-dist.zip`

- [x] **Step 1: Document private goal forecasts**
- [x] **Step 2: Run all verifier scripts**
- [x] **Step 3: Run production build**
- [x] **Step 4: Refresh deploy zip**
