# HIU Completion Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the remaining HIU logging, recovery, history, undo, and offline reliability upgrades without changing saved workout calculations.

**Architecture:** Extend the existing helpers and `LogForm` in `src/App.jsx`, add one verifier per slice, and add a minimal Vite-compatible manifest/service worker for the offline shell. All workout state remains in the existing private account data and draft paths.

**Tech Stack:** React, Vite, browser local storage, service workers, Node-based source verifiers.

## Global Constraints

- Preserve existing weekly volume, PR, streak, goal, public sharing, and Supabase behavior.
- Preserve skipped exercise values while excluding skipped exercises from volume.
- Require no Supabase schema changes.
- Complete the focused verifier, full regression suite, mojibake scan, production build, HTTP preview smoke test, and deployment zip refresh after every task.

---

### Task 1: Quick Finish Controls

**Files:**
- Modify: `src/App.jsx`
- Modify: `README.md`
- Create: `scripts/verify-quick-finish-app.cjs`

**Interfaces:**
- Consumes: `buildWorkoutCompletionGuard(dayKey, inputs, customEx)` and existing `skipped` draft cells.
- Produces: `skipRemainingExercises(dayKey)` and `WorkoutCompletionGuard({guard,onSkipRemaining})`.

- [x] Write a failing verifier requiring the new handler, action prop, button copy, and preservation-oriented update shape.
- [x] Run it and confirm failure is caused by the missing feature.
- [x] Implement `skipRemainingExercises` so only `guard.needsAction` IDs receive `skipped:true` and existing values remain untouched.
- [x] Wire `Skip Remaining` into the guard only while unresolved exercises exist.
- [x] Run focused and full checks, build, preview smoke test, and package refresh.

### Task 2: Complete Set And Smart Rest

**Files:**
- Modify: `src/App.jsx`
- Modify: `README.md`
- Create: `scripts/verify-complete-set-rest-app.cjs`

**Interfaces:**
- Consumes: the existing set row, `startRest`, `restPreset`, and draft persistence.
- Produces: `completeSetRow(dayKey, exerciseId, index, exerciseName)` and `autoStartRest` draft preference.

- [x] Write a failing verifier for the toggle, completion marker, explicit action, and timer call.
- [x] Confirm the verifier fails for missing behavior.
- [x] Add a backwards-compatible `completed` marker to set rows and clear it whenever that row is edited.
- [x] Add the `Auto-start rest` toggle and `Complete Set` action; start the selected timer only when enabled.
- [x] Run focused and full checks, build, preview smoke test, and package refresh.

### Task 3: Recent Exercise History

**Files:**
- Modify: `src/App.jsx`
- Modify: `README.md`
- Create: `scripts/verify-active-exercise-history-app.cjs`

**Interfaces:**
- Consumes: `history`, selected exercise ID, and existing lift parsing/formatting helpers.
- Produces: `buildActiveExerciseHistory(history, exerciseId)` and `ActiveExerciseHistory({rows})`.

- [x] Write a failing verifier for the helper, three-row limit, empty state, and Active Exercise Focus integration.
- [x] Confirm failure is due to the missing history panel.
- [x] Build normalized recent rows from saved non-skipped exercise entries.
- [x] Render the panel inside Active Exercise Focus with stable compact dimensions.
- [x] Run focused and full checks, build, preview smoke test, and package refresh.

### Task 4: Draft Undo

**Files:**
- Modify: `src/App.jsx`
- Modify: `README.md`
- Create: `scripts/verify-draft-undo-app.cjs`

**Interfaces:**
- Consumes: current `inputs` and draft-changing handlers.
- Produces: `commitInputChange(updater)`, `undoLastInputEdit()`, and a one-snapshot undo state.

- [x] Write a failing verifier for snapshot capture, undo restoration, disabled state, and button copy.
- [x] Confirm failure is caused by the missing undo control.
- [x] Centralize input mutations through a wrapper that stores one previous snapshot.
- [x] Add `Undo Last Edit` near the Log quick actions and ensure undo itself does not overwrite the snapshot.
- [x] Run focused and full checks, build, preview smoke test, and package refresh.

### Task 5: Installable Offline App Shell

**Files:**
- Modify: `index.html`
- Modify: `src/main.jsx`
- Modify: `src/App.jsx`
- Modify: `README.md`
- Create: `public/manifest.webmanifest`
- Create: `public/sw.js`
- Create: `scripts/verify-offline-shell-app.cjs`

**Interfaces:**
- Consumes: Vite production assets and browser service-worker/online APIs.
- Produces: install metadata, network-first navigation cache, asset caching, and `ConnectionStatus`.

- [x] Write a failing verifier for manifest linkage, registration, online/offline events, cache exclusions, and built artifact requirements.
- [x] Confirm failure is due to absent offline support.
- [x] Add manifest metadata and a service worker that avoids caching Supabase/API requests.
- [x] Register the service worker only in production and render a compact connection status in the app.
- [x] Run focused and full checks, build, HTTP preview smoke test, verify offline artifacts in `dist`, and refresh the deployment zip.

### Task 6: Final Cross-Feature Audit

**Files:**
- Verify: `src/App.jsx`
- Verify: `src/main.jsx`
- Verify: `public/*`
- Verify: `scripts/verify-*.cjs`
- Verify: `lift-tracker-dist.zip`

- [x] Run every verifier with zero failures.
- [x] Run the production build and require exit code 0.
- [x] Run the built app and require HTTP 200.
- [x] Scan source/docs/scripts for mojibake and accidental secrets.
- [x] Inspect the deployment zip for `index.html`, manifest, service worker, and current application bundle.
- [x] Report completed features, exact verification evidence, and any residual browser-specific risk.
