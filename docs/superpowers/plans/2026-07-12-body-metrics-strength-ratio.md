# Body Metrics Strength Ratio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add private bodyweight logging and strength-ratio analytics to the Goals tab.

**Architecture:** Add pure `bodyMetrics(customEx)` and `buildBodyMetricsInsights(history, customEx)` helpers in `src/App.jsx`, render them with `BodyMetricsPanel`, and save entries into `customEx._bodyMetrics` through the existing `saveAll` persistence path.

**Tech Stack:** React, Vite, existing private synced app data, no new dependencies.

## Global Constraints

- No Supabase schema changes.
- Store body metrics privately in `customEx._bodyMetrics`.
- Do not change workout volume calculations.
- Verify with `scripts/verify-body-metrics-strength-ratio-app.cjs` and production build.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-body-metrics-strength-ratio-app.cjs`

**Interfaces:**
- Produces verifier command: `node scripts/verify-body-metrics-strength-ratio-app.cjs`

- [x] **Step 1: Write failing verifier**

Check for body metrics helpers, Goals tab panel, save handler, UI labels, private storage name, and README documentation.

- [x] **Step 2: Run verifier**

Expected before implementation: non-zero exit listing missing fragments.

### Task 2: Body Metrics Helpers

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `bodyMetrics(customEx)`
- Produces: `buildBodyMetricsInsights(history, customEx)`

- [x] **Step 1: Normalize and sort bodyweight entries**
- [x] **Step 2: Calculate latest bodyweight, trend, Volume / lb, and Best 1RM / lb**

### Task 3: Goals Tab UI

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `bodyMetrics`
- Consumes: `buildBodyMetricsInsights(history, customEx)`
- Produces: `BodyMetricsPanel`

- [x] **Step 1: Add bodyweight entry form**
- [x] **Step 2: Add strength-ratio metric cards**
- [x] **Step 3: Show recent entries**

### Task 4: Persistence Wiring

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `handleSaveBodyMetric`
- Produces: `handleDeleteBodyMetric`

- [x] **Step 1: Save bodyweight entries into `customEx._bodyMetrics`**
- [x] **Step 2: Pass handlers into `GoalsView`**

### Task 5: Docs And Verification

**Files:**
- Modify: `README.md`
- Generate: `dist`
- Generate: `lift-tracker-dist.zip`

- [x] **Step 1: Document private body metrics**
- [x] **Step 2: Run all verifier scripts**
- [x] **Step 3: Run production build**
- [x] **Step 4: Refresh deploy zip**
