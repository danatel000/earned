# Workout Scheduler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a generated 7-day workout schedule planner to the Volume dashboard.

**Architecture:** Add a pure `buildWorkoutSchedule(history, customEx)` helper in `src/App.jsx`, then render it with a new `WorkoutSchedulePlanner` component. Reuse the existing adaptive plan start flow for the next scheduled workout.

**Tech Stack:** React, Vite, existing private workout history, no new dependencies.

## Global Constraints

- No Supabase schema changes.
- Do not change saved workout history shape.
- Do not alter workout volume calculations.
- Verify with `scripts/verify-workout-scheduler-app.cjs` and production build.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-workout-scheduler-app.cjs`

**Interfaces:**
- Produces verifier command: `node scripts/verify-workout-scheduler-app.cjs`

- [x] **Step 1: Write failing verifier**

Check for scheduler helper, component, UI labels, returned property names, and README documentation.

- [x] **Step 2: Run verifier**

Expected before implementation: non-zero exit listing missing fragments.

### Task 2: Scheduler Helper

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `buildWorkoutSchedule(history, customEx)`

- [x] **Step 1: Add seven-day schedule generation**
- [x] **Step 2: Include next scheduled workout and recovery-day metadata**

### Task 3: Dashboard UI

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `buildWorkoutSchedule(history, customEx)`
- Produces component: `WorkoutSchedulePlanner({history, customEx, onStartPlan, hasDraft})`

- [x] **Step 1: Add schedule planner component**
- [x] **Step 2: Render it in `TotalVolumeView`**
- [x] **Step 3: Wire `Start Scheduled Workout` to existing adaptive draft flow**

### Task 4: Docs And Verification

**Files:**
- Modify: `README.md`
- Generate: `dist`
- Generate: `lift-tracker-dist.zip`

- [x] **Step 1: Document private scheduler behavior**
- [x] **Step 2: Run all verifier scripts**
- [x] **Step 3: Run production build**
- [x] **Step 4: Refresh deploy zip**
