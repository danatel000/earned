# Private Exercise Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add private per-exercise notes that appear in Exercise Library Pro and Active Exercise Focus.

**Architecture:** Add `exerciseNotes(customEx)` and `exerciseNoteFor(exId, customEx)` helpers in `src/App.jsx`, render notes with `ExerciseNotesPanel`, and save notes into `customEx._exerciseNotes` through existing `saveAll`. This reuses current private account sync and does not alter workout history.

**Tech Stack:** React, Vite, existing private synced app data, no new dependencies.

## Global Constraints

- No Supabase schema changes.
- Store notes privately in `customEx._exerciseNotes`.
- Do not change workout volume calculations.
- Do not expose notes in public workout summaries.
- Verify with `scripts/verify-private-exercise-notes-app.cjs` and production build.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-private-exercise-notes-app.cjs`

**Interfaces:**
- Produces verifier command: `node scripts/verify-private-exercise-notes-app.cjs`

- [x] **Step 1: Write failing verifier**

Check for note helpers, panel, storage key, save handler, Library rendering, Log rendering, and README documentation.

- [x] **Step 2: Run verifier**

Expected before implementation: non-zero exit listing missing fragments.

### Task 2: Private Note Helpers

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `exerciseNotes(customEx)`
- Produces: `exerciseNoteFor(exId, customEx)`

- [x] **Step 1: Normalize note storage**
- [x] **Step 2: Add save handler for `customEx._exerciseNotes`**

### Task 3: Notes UI

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `exerciseNoteFor`
- Produces: `ExerciseNotesPanel`

- [x] **Step 1: Add reusable notes panel**
- [x] **Step 2: Render panel in expanded Exercise Library Pro cards**
- [x] **Step 3: Render panel in Active Exercise Focus**

### Task 4: Docs And Verification

**Files:**
- Modify: `README.md`
- Generate: `dist`
- Generate: `lift-tracker-dist.zip`

- [x] **Step 1: Document private exercise notes**
- [x] **Step 2: Run all verifier scripts**
- [x] **Step 3: Run production build**
- [x] **Step 4: Refresh deploy zip**
