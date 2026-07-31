# Earned ASCII Training Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an original, accessible ASCII-3D training engine for Earned's public launch and a lightweight real-data ASCII signal for its Today view.

**Architecture:** Pure rendering helpers remain testable without a browser. A dynamically imported Three.js component owns one hero canvas and a throttled DOM ASCII readback, while the authenticated app uses deterministic text output only. Existing native motion, scrolling, account, and workout behavior remain unchanged.

**Tech Stack:** React, Vite, Three.js, browser Canvas/WebGL APIs, CSS, Node source verifiers, Playwright browser QA.

## Global Constraints

- Add only `three`; do not add GSAP, Lenis, React Three Fiber, or another animation library.
- Keep one visible WebGL canvas, public-launch only.
- Dynamically import Three.js so authenticated users do not load it.
- Preserve all account, Supabase, tracking-period, workout, goal, and analytics behavior.
- Use real HTML for all essential content and controls.
- Respect reduced motion, save-data, compact/mobile layouts, and WebGL failure.
- Pause rendering when offscreen or hidden and release every browser/Three.js resource on cleanup.
- Do not hijack scrolling, add fake data, or reproduce Dragonfly assets or animation sequences.

---

### Task 1: Rendering Contracts

**Files:**
- Create: `scripts/test-ascii-renderer.mjs`
- Create: `scripts/verify-earned-ascii-training-engine.cjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: source files as UTF-8 text and pure exports from `asciiMath.js`.
- Produces: failing contracts for character mapping, deterministic signals, dynamic Three.js loading, fallbacks, cleanup, and integration.

- [ ] Create tests asserting `luminanceToGlyph(0)` maps to the densest glyph, `luminanceToGlyph(255)` maps to a space, transparent pixels map to a space, and `buildTrainingSignal()` returns fixed-width deterministic rows.
- [ ] Create source assertions for one dynamic `import("three")`, canvas/readback refs, reduced-motion/save-data guards, observer cleanup, renderer disposal, public integration, and authenticated signal integration.
- [ ] Add `test:ascii` to `package.json`.
- [ ] Run `pnpm run test:ascii` and the source verifier; expect failures because implementation files do not exist.

### Task 2: Pure ASCII Engine

**Files:**
- Create: `src/components/experience/ascii/asciiMath.js`
- Test: `scripts/test-ascii-renderer.mjs`

**Interfaces:**
- Produces: `ASCII_RAMP`, `luminanceToGlyph(red, green, blue, alpha, ramp)`, `imageDataToAscii(imageData, width, height, options)`, and `buildTrainingSignal({ goalProgress, latestVolume, streak, rows, columns })`.

- [ ] Implement weighted luminance conversion with clamping and transparent-pixel handling.
- [ ] Implement bounded row/column sampling and a two-character horizontal aspect correction.
- [ ] Implement deterministic real-data training signal rows with no random values.
- [ ] Run `pnpm run test:ascii`; expect all helper tests to pass.

### Task 3: Public Three.js/ASCII Scene

**Files:**
- Create: `src/components/experience/ascii/EarnedAsciiScene.jsx`
- Modify: `src/components/experience/PublicLaunch.jsx`
- Modify: `src/styles.css`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: `imageDataToAscii()` and existing hero motion variables.
- Produces: `EarnedAsciiScene`, one full-bleed canvas, one ASCII `<pre>`, status labels, and static fallback.

- [ ] Install `three` as the only new dependency.
- [ ] Build a shaft, plate stacks, progress rings, and particle field with original geometry and Earned materials.
- [ ] Render through one canvas and sample it through an offscreen 2D canvas at a maximum of 14 fps.
- [ ] Add fine-pointer movement and native-scroll progress without controlling scroll.
- [ ] Add IntersectionObserver/document-visibility pausing, resize handling, context-loss fallback, reduced-motion one-frame rendering, save-data fallback, and complete disposal.
- [ ] Replace the hero's static logo artwork with the full-bleed scene while retaining the logo in the header, intro, and footer.
- [ ] Add dedicated desktop, mobile, reduced-motion, and high-contrast styles with no overlap over the primary CTA.
- [ ] Run `pnpm run test:ascii`, the new source verifier, `pnpm run verify`, and `pnpm run build`; fix failures before continuing.

### Task 4: Authenticated Training Signal

**Files:**
- Create: `src/components/experience/ascii/TrainingSignal.jsx`
- Modify: `src/components/experience/DashboardCommandCenter.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: actual `goalProgress`, `latestVolume`, and `streak` already available to the command center.
- Produces: decorative deterministic ASCII output with an honest `aria-hidden` presentation.

- [ ] Build `TrainingSignal` using `buildTrainingSignal()` with no timers, canvas, or network access.
- [ ] Replace the fixed LOAD/LOG/LEARN/EARN stack with the data-driven signal and a compact stage legend.
- [ ] Hide the signal on narrow screens where it would compete with workout actions.
- [ ] Run helper tests, the source verifier, all feature verifiers, IOP tests, and the production build.

### Task 5: Browser And Performance Verification

**Files:**
- Modify only implementation files implicated by failures.

**Interfaces:**
- Consumes: production build served locally.
- Produces: verified desktop/mobile/reduced-motion behavior and screenshots.

- [ ] Start the production preview on an available stable port and confirm HTTP 200.
- [ ] Capture desktop and mobile launch screenshots after the intro and inspect typography, scene framing, CTA visibility, and overflow.
- [ ] Assert one WebGL canvas, positive dimensions, nonuniform/nontransparent sampled pixels, and frame changes under normal motion.
- [ ] Assert reduced motion keeps content visible and the scene frame stable.
- [ ] Assert mobile has no horizontal overflow, no pointer-only behavior, and a lower rendering budget.
- [ ] Exercise keyboard menu/account navigation and assert zero browser console errors.
- [ ] Capture an authenticated Today screenshot and confirm the text signal does not alter workout controls or calculations.
- [ ] Run `pnpm run test:ascii`, `pnpm run verify`, `pnpm run test:iop`, `pnpm run build`, and the preview smoke test one final time.

