# Plate Calculator And Warmup Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-gym plate calculator and warmup planner to the Log tab's active exercise focus.

**Architecture:** Add pure helper functions in `src/App.jsx`, then render their output inside the existing `Active Exercise Focus` card. Keep all values derived from draft inputs.

**Tech Stack:** React, Vite, existing private draft state, no new dependencies.

## Global Constraints

- No saved workout data changes.
- No Supabase schema changes.
- Do not alter workout volume calculations.
- Verify with `scripts/verify-plate-warmup-app.cjs` and production build.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-plate-warmup-app.cjs`

**Interfaces:**
- Produces verifier command: `node scripts/verify-plate-warmup-app.cjs`

- [x] **Step 1: Write failing verifier**

Check for helper names, Active Exercise Focus derived constants, UI labels, and README documentation.

- [x] **Step 2: Run verifier**

Expected before implementation: non-zero exit listing missing fragments.

### Task 2: Helpers

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `buildPlateLoad(weight, barWeight)`
- Produces: `buildWarmupPlan(weight, reps, equipment)`

- [x] **Step 1: Add plate loading helper**
- [x] **Step 2: Add warmup planner helper**

### Task 3: Log UI

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `activeFocusPlateLoad`
- Consumes: `activeFocusWarmups`

- [x] **Step 1: Derive plate and warmup values for the active exercise**
- [x] **Step 2: Render `Plate Calculator` and `Warmup Planner` inside Active Exercise Focus**

### Task 4: Docs And Verification

**Files:**
- Modify: `README.md`
- Generate: `dist`
- Generate: `lift-tracker-dist.zip`

- [x] **Step 1: Document private plate and warmup behavior**
- [x] **Step 2: Run all verifier scripts**
- [x] **Step 3: Run production build**
- [x] **Step 4: Refresh deploy zip**
