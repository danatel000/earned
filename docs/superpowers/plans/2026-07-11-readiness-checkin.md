# Readiness Check-In Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add private sleep, energy, and soreness readiness logging that improves fatigue, recovery, and training quality.

**Architecture:** Add pure readiness helpers in `src/App.jsx`, save normalized readiness with workout entries, and render a compact check-in inside `LogForm`. Existing analytics helpers consume the score when present; old entries without readiness remain neutral.

**Tech Stack:** React, Vite, existing saved workout history, no new dependencies.

## Global Constraints

- No Supabase schema changes.
- Do not change workout volume calculations.
- Do not expose readiness data in public sharing tables.
- Verify with `scripts/verify-readiness-checkin-app.cjs` and production build.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-readiness-checkin-app.cjs`

**Interfaces:**
- Produces verifier command: `node scripts/verify-readiness-checkin-app.cjs`

- [x] **Step 1: Write failing verifier**

Check for readiness helpers, saved workout payload, UI labels, analytics references, and README documentation.

- [x] **Step 2: Run verifier**

Expected before implementation: non-zero exit listing missing fragments.

### Task 2: Readiness Helpers

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `defaultReadiness()`
- Produces: `normalizeReadiness(readiness)`
- Produces: `getReadinessScore(readiness)`
- Produces: `getReadinessLabel(score)`

- [x] **Step 1: Add pure helper functions**
- [x] **Step 2: Keep missing readiness as `null` for old history entries**

### Task 3: Log Form

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `normalizeReadiness(readiness)`
- Produces saved entry property: `readiness`

- [x] **Step 1: Add readiness state to `LogForm`**
- [x] **Step 2: Autosave readiness inside unfinished drafts**
- [x] **Step 3: Add `Readiness Check-In` UI with Sleep, Energy, Soreness, and Readiness Score**
- [x] **Step 4: Save normalized readiness with the workout entry**

### Task 4: Analytics Integration

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `getReadinessScore(entry.readiness)`

- [x] **Step 1: Let readiness adjust training quality recovery score**
- [x] **Step 2: Let readiness adjust fatigue trend**
- [x] **Step 3: Show latest readiness in the recovery card**
- [x] **Step 4: Include private readiness context in workout recap story**

### Task 5: Docs And Verification

**Files:**
- Modify: `README.md`
- Generate: `dist`
- Generate: `lift-tracker-dist.zip`

- [x] **Step 1: Document private readiness check-ins**
- [x] **Step 2: Run all verifier scripts**
- [x] **Step 3: Run production build**
- [x] **Step 4: Refresh deploy zip**
