# Earned App-Wide ASCII Atmosphere Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a subtle, data-reactive ASCII motion system to every authenticated Earned view, including the live workout and completion flows.

**Architecture:** Pure helpers generate deterministic view profiles and text frames. A single lifecycle-safe Canvas 2D renderer provides the global atmosphere, while compact React text-signal components visualize live workout and milestone data. App integration remains presentation-only and does not alter persistence or calculations.

**Tech Stack:** React, Canvas 2D, CSS animations, Node source verifiers, Playwright browser QA.

## Global Constraints

- Preserve all account, Supabase, workout, Premium, and tracking behavior.
- No new runtime dependency.
- Decorative animation must never intercept input.
- Desktop is capped at 260 particles and 24 FPS; mobile at 110 particles and 16 FPS.
- Reduced motion renders a stable frame.
- Every new behavior follows a failing-test-first cycle.

---

### Task 1: Deterministic ASCII Signal Helpers

**Files:**
- Create: `src/components/experience/ascii/ambientAscii.js`
- Create: `scripts/test-app-ascii-atmosphere.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `ASCII_VIEW_PROFILES`, `resolveAmbientAsciiBudget({compact,reducedMotion})`, `buildAmbientGlyphs({view,width,height,count,seed})`, `buildWorkoutAsciiFrame({...})`, and `buildMilestoneAsciiFrame({...})`.

- [ ] Write tests asserting all eight profile IDs, exact desktop/mobile/reduced budgets, deterministic glyph coordinates, fixed workout frame dimensions, and frame changes when volume or set count changes.
- [ ] Run `node scripts/test-app-ascii-atmosphere.mjs` and confirm it fails because `ambientAscii.js` does not exist.
- [ ] Implement the pure helpers with bounded numeric input and deterministic seeded output.
- [ ] Run the helper test and confirm it passes.

### Task 2: Global Canvas Atmosphere

**Files:**
- Create: `src/components/experience/ascii/AppAsciiAtmosphere.jsx`
- Create: `scripts/verify-earned-app-ascii-atmosphere.cjs`
- Modify: `src/App.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: Task 1 profiles, budgets, and glyph points.
- Produces: `<AppAsciiAtmosphere view trackingMode activity />` with `data-ascii-view`, `data-ascii-tier`, and `data-ascii-state`.

- [ ] Write source contracts for all eight view profiles, Canvas 2D, animation-frame cleanup, resize cleanup, visibility pausing, reduced motion, DPR caps, app mounting, and noninteractive CSS layering.
- [ ] Run `node scripts/verify-earned-app-ascii-atmosphere.cjs` and confirm it fails because the component and integration are absent.
- [ ] Implement the renderer with deterministic glyph motion, technical rails, view signatures, pointer response, capped FPS, and stable reduced motion.
- [ ] Mount it once inside `earned-app-shell` and establish explicit content layering.
- [ ] Run helper and source tests and confirm both pass.

### Task 3: Live Workout Reactor

**Files:**
- Create: `src/components/experience/ascii/WorkoutAsciiReactor.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles.css`
- Modify: `scripts/verify-earned-app-ascii-atmosphere.cjs`

**Interfaces:**
- Consumes: `previewVol`, `activeSetCount`, `activeLoggedCount`, `restRemaining`, `readinessScore`, and active day accent.
- Produces: a fixed-height `earned-workout-reactor` signal that never changes surrounding layout dimensions.

- [ ] Add failing contracts that require every live workout metric and the reactor immediately before Live PR Radar.
- [ ] Run the source verifier and confirm the Train contracts fail.
- [ ] Implement the compact frame component with visibility and reduced-motion lifecycle handling.
- [ ] Integrate it into `LogForm` using existing computed values without changing calculations.
- [ ] Run helper, source, and all existing feature verifiers.

### Task 4: Completion Milestone Burst

**Files:**
- Create: `src/components/experience/ascii/AsciiMilestoneBurst.jsx`
- Modify: `src/components/experience/WorkoutCelebration.jsx`
- Modify: `src/styles.css`
- Modify: `scripts/verify-earned-app-ascii-atmosphere.cjs`

**Interfaces:**
- Consumes: `volume`, `streak`, and `isPR`.
- Produces: a bounded decorative milestone frame inside the existing dialog.

- [ ] Add failing contracts for real completion metrics, PR-specific coloring, fixed dimensions, and decorative accessibility.
- [ ] Run the source verifier and confirm milestone contracts fail.
- [ ] Implement and integrate the burst before the existing completion result.
- [ ] Run all helper and source tests.

### Task 5: Browser And Regression QA

**Files:**
- Create: `scripts/qa-earned-app-ascii-browser.cjs`
- Modify: `scripts/run-verifiers.cjs` only if its file discovery does not already include the new source verifier.

**Interfaces:**
- Consumes: local production preview and optional `EARNED_QA_USERNAME` / `EARNED_QA_PASSWORD`.
- Produces: desktop Train and mobile Today screenshots plus assertion output.

- [ ] Add browser assertions for nonblank and changing desktop canvas frames, all eight tab profiles, Train reactor content, no mobile overflow, and identical reduced-motion frames.
- [ ] Run the browser QA against the current implementation and fix each reproducible failure at its source.
- [ ] Run `pnpm run test:ascii`, `pnpm run test:iop`, `pnpm run verify`, and `pnpm run build`.
- [ ] Inspect desktop and mobile screenshots and tune only opacity, spacing, and frame density if content competes with decoration.
- [ ] Confirm the current local preview returns `200` for HTML and built assets.
