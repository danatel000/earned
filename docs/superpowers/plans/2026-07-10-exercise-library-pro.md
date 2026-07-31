# Exercise Library Pro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing Library tab into a premium exercise reference with metadata filters and a Log quick-start action.

**Architecture:** Keep the feature inside `src/App.jsx` to match the current single-file app pattern. Add small pure helper functions for profile inference and draft creation, then wire the Library component to App-level draft/save handlers.

**Tech Stack:** React, Vite, local/Supabase synced app data, existing no-new-dependency verifier scripts.

## Global Constraints

- Keep all library profile data private and derived locally.
- Do not add a Supabase table or public sharing record for library profiles.
- Preserve existing workout history, goals, custom exercises, and drafts.
- Use the existing Log tab and draft system for `Start This Workout`.
- Avoid non-ASCII UI copy in new app strings.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-exercise-library-pro-app.cjs`

**Interfaces:**
- Produces verifier command: `node scripts/verify-exercise-library-pro-app.cjs`

- [x] **Step 1: Write the failing verifier**

Create a script that checks `src/App.jsx` for `getExerciseProfile`, `buildLibraryWorkoutDraft`, `Exercise Library Pro`, `Start This Workout`, `Library Exercise Loaded`, and handler wiring.

- [x] **Step 2: Run verifier and confirm RED**

Run:

```bash
node scripts/verify-exercise-library-pro-app.cjs
```

Expected before implementation: non-zero exit with missing fragments.

### Task 2: Profile Helpers

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `LIBRARY_EQUIPMENT`
- Produces: `LIBRARY_DIFFICULTY`
- Produces: `getExerciseProfile(ex, dayKey)`
- Produces: `buildLibraryWorkoutDraft(dayKey, ex, currentDraft)`

- [ ] **Step 1: Add metadata constants and helper functions**

Add equipment/difficulty option constants and deterministic profile inference based on exercise name, muscle group, and day.

- [ ] **Step 2: Verify helper fragments**

Run:

```bash
node scripts/verify-exercise-library-pro-app.cjs
```

Expected mid-task: still fails on UI/handler fragments, not helper fragments.

### Task 3: Library UI

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `getExerciseProfile(ex, dayKey)`
- Produces component signature: `ExerciseLibraryView({history, customEx, onStartLibraryWorkout})`

- [ ] **Step 1: Add equipment and difficulty filters**

Extend the current Library search/muscle controls with compact equipment and difficulty controls.

- [ ] **Step 2: Add rich exercise profile cards**

Show target muscle, equipment, difficulty, best use, rep range, form cues, avoid cues, and `Start This Workout`.

### Task 4: Log Integration

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `buildLibraryWorkoutDraft(dayKey, ex, currentDraft)`
- Produces: `handleStartLibraryWorkout(dayKey, ex)`
- Stores: `libraryFocus` in draft

- [ ] **Step 1: Preserve library focus in Log autosave**

Read `initialDraft?.libraryFocus`, preserve it during draft autosave, and show `Library Exercise Loaded`.

- [ ] **Step 2: Wire App handler and Library props**

Add `handleStartLibraryWorkout`, pass it to `ExerciseLibraryView`, and set `view` to `log`.

### Task 5: Verification and Rollout

**Files:**
- Modify: `README.md`
- Generate: `dist`
- Generate: `lift-tracker-dist.zip`

- [ ] **Step 1: Document private library behavior**

Add a README sentence that Exercise Library Pro is private and local/synced.

- [ ] **Step 2: Run verifiers**

Run existing verifiers plus `verify-exercise-library-pro-app.cjs`.

- [ ] **Step 3: Build and zip**

Run production build and refresh `lift-tracker-dist.zip`.
