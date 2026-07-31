# Earned Expanded ASCII Atmosphere Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the authenticated ASCII field and add animated floating dumbbells to the launch sculpture without harming readability, performance, or accessibility.

**Architecture:** Extend the existing deterministic Canvas 2D point builder for product pages and the existing Three.js strength sculpture for the public hero. Preserve the current responsive budgets, render-loop cleanup, and reduced-motion pathways.

**Tech Stack:** React, Canvas 2D, Three.js, Vite, Node source verifiers, Playwright browser QA.

## Global Constraints

- Add no dependencies.
- Keep every ASCII layer decorative and pointer-transparent.
- Preserve all account, cloud-sync, workout, analytics, and subscription behavior.
- Mobile must remain within the viewport and use DPR 1.
- Reduced-motion output must remain static.

---

### Task 1: Expand Authenticated Atmosphere

**Files:**
- Modify: `scripts/test-app-ascii-atmosphere.mjs`
- Modify: `src/components/experience/ascii/ambientAscii.js`
- Modify: `src/components/experience/ascii/AppAsciiAtmosphere.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `AMBIENT_MOTION_RATE` numeric export and deterministic `buildAmbientGlyphs()` points covering the viewport.
- Consumes: existing `ASCII_VIEW_PROFILES` and responsive budget API.

- [ ] Add failing assertions for the 1.18 motion multiplier, increased responsive budgets, larger glyphs, and three-by-three viewport coverage.
- [ ] Run `node scripts/test-app-ascii-atmosphere.mjs` and confirm the new assertions fail against the old field.
- [ ] Add a deterministic full-field point layer while preserving each view's motif.
- [ ] Apply the shared motion multiplier in the canvas render loop and widen the technical rails.
- [ ] Run the focused test until it passes.

### Task 2: Add Floating Launch Dumbbells

**Files:**
- Modify: `scripts/verify-earned-ascii-training-engine.cjs`
- Modify: `src/components/experience/ascii/createStrengthSculpture.js`
- Modify: `src/components/experience/ascii/EarnedAsciiScene.jsx`

**Interfaces:**
- Produces: `handles.floatingDumbbells`, an array of `{group, basePosition, baseRotation, phase, speed}` animation records.
- Consumes: the existing sculpture materials, geometry registry, render loop, and disposal path.

- [ ] Add failing source contracts requiring dumbbell geometry, floating handles, and render-loop animation.
- [ ] Run the focused verifier and confirm it fails because the geometry is absent.
- [ ] Create three detailed wireframe dumbbell groups using shared registered geometry and materials.
- [ ] Animate independent drift and rotation from immutable base transforms.
- [ ] Expose the live dumbbell count as a QA data attribute and rerun the focused verifier.

### Task 3: Browser And Production Verification

**Files:**
- Modify: `scripts/qa-earned-ascii-browser.cjs`
- Modify: `scripts/qa-earned-app-ascii-browser.cjs`

**Interfaces:**
- Consumes: live launch and authenticated canvas DOM states.
- Produces: desktop/mobile screenshots and measurable pixel/motion evidence.

- [ ] Assert the launch scene reports three floating dumbbells.
- [ ] Assert authenticated canvas coverage and motion remain visible on desktop and mobile.
- [ ] Run `pnpm run verify`, `pnpm run test:ascii`, and `pnpm run test:iop`.
- [ ] Run `pnpm run build` and serve the production `dist` output.
- [ ] Run both ASCII Playwright suites plus the eight-view product UI suite.
- [ ] Inspect launch, Today, Train, Progress, Records, Goals, Library, Feed, and mobile screenshots for readability and overlap.

