# Earned Cinematic Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an original, cinematic, accessible motion system to Earned's public launch and authenticated navigation without changing workout data behavior.

**Architecture:** Native React, CSS, Intersection Observer, requestAnimationFrame, matchMedia, and the View Transitions API provide progressive enhancement. Motion intent is declared with data attributes, while focused components own lifecycle, accessibility, and cleanup.

**Tech Stack:** React, Vite, CSS, browser-native animation APIs, existing source verifiers.

## Global Constraints

- Preserve Earned's existing design tokens, components, routes, account flow, and workout calculations.
- Add no animation dependency and do not hijack scrolling.
- Keep first-session loading under 1.4 seconds and provide an immediate skip action.
- Preserve all content and controls under reduced motion or JavaScript animation failure.
- Use transform and opacity for continuous animation; reserve clip-path for one-time reveals.
- Do not add fake AI, wearable, social, or payment behavior.

---

### Task 1: Motion Contracts

**Files:**
- Create: `scripts/verify-earned-motion-system.cjs`

**Interfaces:**
- Consumes: Existing source verifier runner.
- Produces: Contracts for motion orchestration, intro timing, menu accessibility, view-transition fallback, responsive behavior, and reduced motion.

- [ ] Write assertions for the planned components, launch integration, app integration, CSS fallbacks, and dependency constraints.
- [ ] Run `node scripts/verify-earned-motion-system.cjs` and confirm it fails because the motion units do not exist.

### Task 2: Native Motion Foundation

**Files:**
- Create: `src/components/experience/motion/MotionOrchestrator.jsx`
- Create: `src/components/experience/motion/FirstVisitIntro.jsx`
- Create: `src/components/experience/motion/LaunchMenu.jsx`
- Create: `src/components/experience/motion/transitionView.js`

**Interfaces:**
- Consumes: DOM browser APIs and existing Earned markup.
- Produces: `MotionOrchestrator`, `FirstVisitIntro`, `LaunchMenu`, and `transitionView(update)`.

- [ ] Implement reveal observation with a no-IntersectionObserver fallback and cleanup.
- [ ] Implement requestAnimationFrame-batched scroll and fine-pointer tracking with passive listeners.
- [ ] Implement the session-scoped, skippable intro with a 1.25-second maximum normal duration.
- [ ] Implement the keyboard-accessible menu overlay with focus restoration and body-scroll restoration.
- [ ] Implement View Transitions progressive enhancement with reduced-motion and unsupported-browser fallbacks.

### Task 3: Public Launch Choreography

**Files:**
- Modify: `src/components/experience/PublicLaunch.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: Motion foundation components and Earned launch content.
- Produces: Sequenced hero, scroll location signal, editorial section reveals, menu overlay, and responsive motion variants.

- [ ] Add the intro, orchestrator, menu trigger, overlay navigation, and semantic motion attributes.
- [ ] Sequence hero label, masked title, supporting copy, artwork, calls to action, and scroll cue.
- [ ] Give proof items and system rows distinct reveal directions and delays.
- [ ] Add quiet-to-energetic section pacing, sticky desktop composition, and mobile simplification.
- [ ] Add visible hover, focus-visible, active, and disabled states without hiding essential information behind hover.

### Task 4: Authenticated Context Transitions

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/experience/AppNavigation.jsx`
- Modify: `src/components/experience/DashboardCommandCenter.jsx`
- Modify: `src/components/experience/WorkoutCelebration.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `transitionView(update)` and existing view state.
- Produces: Fast contextual navigation, staged Today entry, refined progress feedback, and View Transitions fallback behavior.

- [ ] Route user-initiated navigation through `transitionView` while leaving background state behavior unchanged.
- [ ] Wrap dynamic view content in a keyed stage with accessible focus behavior intact.
- [ ] Add motion intent attributes to the navigation, command center, and celebration sequence.
- [ ] Keep Start Workout immediately responsive and preserve all existing callbacks.

### Task 5: Verification And Visual QA

**Files:**
- Modify only files implicated by failures.

**Interfaces:**
- Consumes: Completed implementation.
- Produces: Verified production build and local preview.

- [ ] Run the new motion verifier and confirm it passes.
- [ ] Run `pnpm run verify` and confirm every source verifier passes.
- [ ] Run `pnpm run test:iop` and confirm monetization/recovery contracts pass.
- [ ] Run `pnpm run build` and fix implementation errors.
- [ ] Run preview smoke tests for HTML, manifest, service worker, and icons.
- [ ] Capture and inspect public/authenticated desktop and mobile screenshots, verify no overflow, and verify zero browser console errors.
