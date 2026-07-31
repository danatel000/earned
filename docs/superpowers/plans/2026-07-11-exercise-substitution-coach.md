# Exercise Substitution Coach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add private same-muscle exercise swap suggestions to the active workout logger.

**Architecture:** Add a pure `buildExerciseSubstitutions(ex, dayKey, customEx, history)` helper in `src/App.jsx`, render suggested swaps inside Active Exercise Focus, and use the existing custom-exercise path to add a selected swap to the current workout draft.

**Tech Stack:** React, Vite, existing exercise catalog and private workout draft, no new dependencies.

## Global Constraints

- No Supabase schema changes.
- Do not change saved workout volume calculations.
- Do not remove or skip the original exercise automatically.
- Verify with `scripts/verify-exercise-substitution-coach-app.cjs` and production build.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-exercise-substitution-coach-app.cjs`

**Interfaces:**
- Produces verifier command: `node scripts/verify-exercise-substitution-coach-app.cjs`

- [x] **Step 1: Write failing verifier**

Check for the substitution helper, Active Exercise Focus UI labels, Add Swap action, draft-only data naming, and README documentation.

- [x] **Step 2: Run verifier**

Expected before implementation: non-zero exit listing missing fragments.

### Task 2: Substitution Helper

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `buildExerciseSubstitutions(ex, dayKey, customEx, history)`

- [x] **Step 1: Rank same-muscle alternatives**
- [x] **Step 2: Include equipment, reason, and suggested starting lift values**

### Task 3: Log Form UI

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `activeFocusSubstitutions`
- Produces action: `applyExerciseSubstitution(activeDay, activeFocusExercise, swap)`

- [x] **Step 1: Derive active focus substitutions**
- [x] **Step 2: Add Smart Substitutions UI inside Active Exercise Focus**
- [x] **Step 3: Add selected swap as a current-day custom exercise draft**

### Task 4: Docs And Verification

**Files:**
- Modify: `README.md`
- Generate: `dist`
- Generate: `lift-tracker-dist.zip`

- [x] **Step 1: Document private exercise substitutions**
- [x] **Step 2: Run all verifier scripts**
- [x] **Step 3: Run production build**
- [x] **Step 4: Refresh deploy zip**
