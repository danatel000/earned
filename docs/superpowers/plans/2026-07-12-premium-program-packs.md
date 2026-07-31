# Premium Program Packs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add curated Premium Program Packs to the Library tab and let users start a pack day as a private draft workout.

**Architecture:** Add pure `buildProgramPacks(customEx)` and `pickProgramExercise(dayKey, customEx, patterns, fallbackIndex)` helpers in `src/App.jsx`, render the packs with `ProgramPacksPanel`, and reuse `buildCoachPlanDraft` for draft loading. No persisted schema or calculation changes are needed.

**Tech Stack:** React, Vite, existing exercise catalog helpers, existing private draft persistence, no new dependencies.

## Global Constraints

- No Supabase schema changes.
- Do not change workout volume calculations.
- Starting a program day must only update the private draft until the user logs it.
- Keep copy compact enough for mobile cards.
- Verify with `scripts/verify-premium-program-packs-app.cjs` and production build.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-premium-program-packs-app.cjs`

**Interfaces:**
- Produces verifier command: `node scripts/verify-premium-program-packs-app.cjs`

- [x] **Step 1: Write failing verifier**

Check for program pack helper, panel, Library rendering, Start Program Day action, Log banner, and README documentation.

- [x] **Step 2: Run verifier**

Expected before implementation: non-zero exit listing missing fragments.

### Task 2: Program Pack Helpers

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `pickProgramExercise(dayKey, customEx, patterns, fallbackIndex)`
- Produces: `buildProgramPacks(customEx)`

- [x] **Step 1: Pick exercises from current catalog**
- [x] **Step 2: Build three curated packs**
- [x] **Step 3: Mark pack days with `programPack` metadata**

### Task 3: Library UI

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `buildProgramPacks`
- Produces: `ProgramPacksPanel`

- [x] **Step 1: Render curated pack cards**
- [x] **Step 2: Render day cards with exercise counts**
- [x] **Step 3: Add `Start Program Day` buttons**

### Task 4: Draft Wiring

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `handleStartProgramPackDay`

- [x] **Step 1: Preserve pack metadata in `buildCoachPlanDraft`**
- [x] **Step 2: Pass `onStartProgramPackDay` into `ExerciseLibraryView`**
- [x] **Step 3: Show `Program Pack Loaded` in the Log tab banner**

### Task 5: Docs And Verification

**Files:**
- Modify: `README.md`
- Generate: `dist`
- Generate: `lift-tracker-dist.zip`

- [x] **Step 1: Document private premium program packs**
- [x] **Step 2: Run all verifier scripts**
- [x] **Step 3: Run production build**
- [x] **Step 4: Refresh deploy zip**
