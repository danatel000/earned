# Technique Coach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add trainer-style Technique Coach guidance to Exercise Library Pro and Active Exercise Focus.

**Architecture:** Add a pure `buildTechniqueCoach(ex, profile, dayKey)` helper in `src/App.jsx`, render it with `TechniqueCoachPanel`, and reuse existing `getExerciseProfile` data. The feature creates no new persisted state and does not alter workout calculations.

**Tech Stack:** React, Vite, existing exercise catalog/profile helpers, no new dependencies.

## Global Constraints

- No Supabase schema changes.
- Do not change workout volume calculations.
- Do not save new private or public data.
- Keep text compact enough for mobile cards.
- Verify with `scripts/verify-technique-coach-app.cjs` and production build.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-technique-coach-app.cjs`

**Interfaces:**
- Produces verifier command: `node scripts/verify-technique-coach-app.cjs`

- [x] **Step 1: Write failing verifier**

Check for the technique helper, panel, Library rendering, Log rendering, UI labels, and README documentation.

- [x] **Step 2: Run verifier**

Expected before implementation: non-zero exit listing missing fragments.

### Task 2: Technique Helper

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `buildTechniqueCoach(ex, profile, dayKey)`

- [x] **Step 1: Generate setup checklist**
- [x] **Step 2: Generate rep execution steps**
- [x] **Step 3: Generate safety checks and progression tip**

### Task 3: Technique Coach UI

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `buildTechniqueCoach`
- Produces: `TechniqueCoachPanel`

- [x] **Step 1: Add reusable panel component**
- [x] **Step 2: Render panel in expanded Exercise Library Pro cards**
- [x] **Step 3: Render panel in Active Exercise Focus**

### Task 4: Docs And Verification

**Files:**
- Modify: `README.md`
- Generate: `dist`
- Generate: `lift-tracker-dist.zip`

- [x] **Step 1: Document private technique coach**
- [x] **Step 2: Run all verifier scripts**
- [x] **Step 3: Run production build**
- [x] **Step 4: Refresh deploy zip**
