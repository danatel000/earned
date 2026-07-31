# Progressive Overload Coach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-exercise progression decisions after each saved workout.

**Architecture:** Add pure overload decision helpers in `src/App.jsx`, then render a focused dashboard panel. Keep all recommendations derived from existing private workout history.

**Tech Stack:** React, Vite, existing local/Supabase synced workout data, no new dependencies.

## Global Constraints

- Do not change saved workout history shape.
- Do not add Supabase schema.
- Do not write overload recommendations to public feed tables.
- Include the actions `Add Weight`, `Add Reps`, `Add Set`, `Repeat`, and `Deload`.
- Verify with `scripts/verify-progressive-overload-app.cjs` and production build.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-progressive-overload-app.cjs`

**Interfaces:**
- Produces verifier command: `node scripts/verify-progressive-overload-app.cjs`

- [ ] **Step 1: Write failing verifier**

Check for helper names, panel component, required action strings, and dashboard render.

- [ ] **Step 2: Run verifier**

Expected before implementation: non-zero exit listing missing fragments.

### Task 2: Overload Helpers

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `getExerciseOverloadDecision(history, ex, dayKey)`
- Produces: `buildProgressiveOverloadAdvice(history, customEx)`

- [ ] **Step 1: Add deterministic progression rules**
- [ ] **Step 2: Run verifier and confirm helper fragments are present**

### Task 3: Dashboard UI

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `buildProgressiveOverloadAdvice(history, customEx)`
- Produces component: `ProgressiveOverloadCoach({history, customEx})`

- [ ] **Step 1: Add panel component**
- [ ] **Step 2: Render it in `TotalVolumeView`**

### Task 4: Verification and Rollout

**Files:**
- Modify: `README.md`
- Generate: `dist`
- Generate: `lift-tracker-dist.zip`

- [ ] **Step 1: Document private overload coach behavior**
- [ ] **Step 2: Run all verifier scripts**
- [ ] **Step 3: Run production build**
- [ ] **Step 4: Refresh deploy zip**
