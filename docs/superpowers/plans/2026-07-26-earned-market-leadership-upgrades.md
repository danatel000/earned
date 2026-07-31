# Earned Market Leadership Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Earned faster to trust, easier to act on, clearer about training readiness, calmer during active workouts, and lighter at initial load.

**Architecture:** Reuse existing draft persistence, command-deck, readiness, Premium, ASCII, and Vite systems. Add only small presentation and pure-calculation layers; do not alter workout history, tracking-mode calculations, auth/sync behavior, or entitlement rules.

**Tech Stack:** React, Vite, existing Earned CSS, existing verifier scripts, Ruflo sidecar workflows.

## Global Constraints

- Preserve workout save, draft restore, skipped-exercise, daily/weekly tracking, auth/sync, and Premium entitlement behavior.
- Keep Ruflo under `tooling/ruflo/`; do not update GitHub.
- Use ASCII as a supporting layer; active Train controls remain visually dominant.
- Do not fabricate wearable data, AI recommendations, or payment state.

---

### Task 1: Workout Trust And Next Action

**Files:**
- Modify: `src/components/experience/workout/workoutViewSignals.js`
- Modify: `src/App.jsx`
- Modify: `scripts/test-workout-ui-system.mjs`

- [ ] Add a failing UI contract for a draft-aware Today primary action and explicit draft recovery controls.
- [ ] Make the Today signal say `Resume workout` when a draft exists and keep the standard start path when it does not.
- [ ] Replace the click-anywhere draft banner with distinct Resume and Discard actions; Discard must call the existing cloud/local draft clear path only after confirmation.
- [ ] Run `pnpm run test:workout-ui`.

### Task 2: Explain Existing Readiness Guidance

**Files:**
- Create: `src/analytics/readinessExplanation.js`
- Modify: `src/App.jsx`
- Create: `scripts/test-readiness-explanation.mjs`
- Modify: `package.json`

- [ ] Add failing pure tests for positive and limiting readiness factors and volume-jump context.
- [ ] Create a pure explanation builder using only existing sleep, energy, soreness, and live-volume values.
- [ ] Feed the explanation into the existing Workout Readiness Gate and render positive and limiting drivers beside the existing recommendation.
- [ ] Run the new focused test and `pnpm run test:iop`.

### Task 3: Calm, Context-Aware ASCII

**Files:**
- Modify: `src/components/experience/ascii/ambientAscii.js`
- Modify: `src/components/experience/ascii/AppAsciiAtmosphere.jsx`
- Modify: `scripts/test-app-ascii-atmosphere.mjs`

- [ ] Add a failing ASCII test that requires a lower active-logger particle budget while preserving immersive Today/Progress density.
- [ ] Add a Train-specific `focused` budget tier with fewer particles and a slower motion rate.
- [ ] Keep reduced-motion static and compact behavior intact.
- [ ] Run `pnpm run test:ascii`.

### Task 4: Production Bundle Boundaries

**Files:**
- Create: `vite.config.js`

- [ ] Add Vite manual chunk boundaries for charts, Supabase, and Three.js without changing app behavior.
- [ ] Run `pnpm run build` and confirm the output emits separate vendor chunks.

### Task 5: Ruflo Safety And Final Review

**Files:**
- No shipped-app files required.

- [ ] Run `pnpm run ruflo:feature` after Tasks 1 and 2.
- [ ] Run `pnpm run ruflo:ascii` after Task 3.
- [ ] Run `pnpm run ruflo:premerge`, `pnpm run verify`, and `pnpm run build` after Task 4.
