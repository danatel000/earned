# Workout Session UX Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Log tab faster and easier to use during a workout.

**Architecture:** Keep the existing `LogForm` data model and add focused UI helpers around it. Use pure helper functions for suggestions and small stateful handlers for quick actions.

**Tech Stack:** React, Vite, existing local/Supabase synced draft storage, no new dependencies.

## Global Constraints

- Do not change saved workout history shape.
- Do not remove skipped exercise behavior.
- Do not remove rest timer, templates, rating, RPE, notes, or auto-save.
- New UI text must be ASCII.
- Verify with `scripts/verify-workout-session-ux-app.cjs` and production build.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-workout-session-ux-app.cjs`

**Interfaces:**
- Produces verifier command: `node scripts/verify-workout-session-ux-app.cjs`

- [ ] **Step 1: Write failing verifier**

Check for `getExerciseSetSuggestion`, `activeFocusId`, `Active Exercise Focus`, `Copy Last Workout`, `Repeat Last Set`, `Session Dock`, `copyPreviousLiftToExercise`, and `repeatLastSetForExercise`.

- [ ] **Step 2: Run verifier**

Expected before app changes: non-zero exit listing missing fragments.

### Task 2: Helpers and State

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `getExerciseSetSuggestion(history, ex)`
- Produces state: `activeFocusId`
- Produces handler: `copyPreviousLiftToExercise(dayKey, ex)`
- Produces handler: `repeatLastSetForExercise(dayKey, ex)`

- [ ] **Step 1: Add helper and state**
- [ ] **Step 2: Add quick action handlers**

### Task 3: UI

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: helper/state/handlers from Task 2.
- Produces visible copy: `Active Exercise Focus`, `Copy Last Workout`, `Repeat Last Set`, `Session Dock`.

- [ ] **Step 1: Add focus panel above exercise list**
- [ ] **Step 2: Add per-exercise quick action buttons**
- [ ] **Step 3: Add sticky session dock**

### Task 4: Verification and Rollout

**Files:**
- Modify: `README.md`
- Generate: `dist`
- Generate: `lift-tracker-dist.zip`

- [ ] **Step 1: Document the Log UX upgrade**
- [ ] **Step 2: Run all verifier scripts**
- [ ] **Step 3: Run production build**
- [ ] **Step 4: Refresh deploy zip**
