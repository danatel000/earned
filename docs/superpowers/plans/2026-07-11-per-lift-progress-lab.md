# Per-Lift Progress Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-exercise progress labs to expanded exercise cards in the Lifts tab.

**Architecture:** Add a pure `buildPerLiftProgressLab(ex, history)` helper in `src/App.jsx`, then render the returned metrics inside `ExerciseCard` under the existing chart. The feature reads existing private history only and does not alter saved data.

**Tech Stack:** React, Vite, Recharts, existing private workout history, no new dependencies.

## Global Constraints

- No Supabase schema changes.
- Do not change saved workout volume calculations.
- Do not change how exercise goals are saved.
- Verify with `scripts/verify-per-lift-progress-lab-app.cjs` and production build.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-per-lift-progress-lab-app.cjs`

**Interfaces:**
- Produces verifier command: `node scripts/verify-per-lift-progress-lab-app.cjs`

- [x] **Step 1: Write failing verifier**

Check for the helper, expanded card UI labels, recent log rows, next cue text, and README documentation.

- [x] **Step 2: Run verifier**

Expected before implementation: non-zero exit listing missing fragments.

### Task 2: Progress Helper

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `buildPerLiftProgressLab(ex, history)`

- [x] **Step 1: Build per-exercise logged rows**
- [x] **Step 2: Calculate latest estimated 1RM, best set, recent average, and trend**
- [x] **Step 3: Generate a Next Cue string**

### Task 3: Exercise Card UI

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `progressLab`

- [x] **Step 1: Use `buildPerLiftProgressLab(ex, history)` in `ExerciseCard`**
- [x] **Step 2: Render `Per-Lift Progress Lab` below the chart**
- [x] **Step 3: Show recent logged rows and Next Cue**

### Task 4: Docs And Verification

**Files:**
- Modify: `README.md`
- Generate: `dist`
- Generate: `lift-tracker-dist.zip`

- [x] **Step 1: Document private per-lift progress labs**
- [x] **Step 2: Run all verifier scripts**
- [x] **Step 3: Run production build**
- [x] **Step 4: Refresh deploy zip**
