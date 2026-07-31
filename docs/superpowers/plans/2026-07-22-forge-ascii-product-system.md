# FORGE_ASCII Product System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a functional terminal-driven ASCII product system to Earned's boot, Today dashboard, Library, Train logger, PR feedback, and workout-save flow without changing its brand, framework, account data, or workout calculations.

**Architecture:** Pure deterministic ASCII generators live in one focused helper module and feed small React components. Hooks own viewport, animation-frame, scramble, visibility, reduced-motion, and opt-in audio behavior. Existing App state and Supabase persistence remain authoritative; FORGE_ASCII only renders those values and adds one normalized account preference for avatar style.

**Tech Stack:** React, Vite, JavaScript with JSDoc contracts, CSS, Canvas-free DOM ASCII, requestAnimationFrame, Web Audio API, existing Supabase account JSON.

## Global Constraints

- Keep the user-facing product name `Earned`.
- Do not migrate to Next.js, TypeScript, Tailwind, Zustand, or a new router.
- Do not change Supabase schema or workout record shapes.
- Do not fabricate workouts, PRs, database checks, AI, recovery, wearable, social, or payment data.
- Audio must be off by default and begin only after direct user interaction.
- Reduced motion must produce stable final content.
- Every frame must be width-stable and must not cause mobile overflow.
- Preserve all existing daily/weekly, skip, draft, offline, account, Premium, and community behavior.

---

### Task 1: Pure FORGE_ASCII Engine

**Files:**
- Create: `scripts/test-forge-ascii.mjs`
- Create: `src/components/experience/forge/forgeAscii.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `resolveAsciiViewport(width, reducedMotion)`, `normalizeFrame(rows, width)`, `resolveScrambleFrame(target, progress, seed)`, `buildTerminalProgress(current, total, width)`, `resolvePlateTier(weight)`, `buildAsciiBarbell(weight, columns)`, `resolveExerciseFamily(name, profile)`, `buildAnatomyFrame(group, tier)`, `buildHelmetFrame(style, tier)`, `buildPowerGrid(stats, tier)`, `buildCountdownFrame(seconds, tier)`, `buildOneRmMeter(current, previous, height)`.

- [ ] **Step 1: Write the failing behavior test**

Create assertions that require 44/72/104-column viewport tiers, exact frame width, deterministic scramble resolution, partial-block progress output, monotonically larger plate tiers, exact-width barbells, name-to-family mapping for squat/bench/deadlift, one highlighted anatomy group, three helmet styles, data-sensitive power grids, fixed-width countdowns, and increasing 1RM meters.

- [ ] **Step 2: Run the test and confirm RED**

Run:

```powershell
& $NODE scripts/test-forge-ascii.mjs
```

Expected: failure because `forgeAscii.js` does not exist.

- [ ] **Step 3: Implement deterministic helpers**

Use only pure functions. Clamp negative values, avoid division by zero, normalize every line with `slice(0, width).padEnd(width)`, and use seeded integer noise rather than `Math.random()`.

- [ ] **Step 4: Add the suite to `test:ascii` and confirm GREEN**

Set:

```json
"test:ascii": "node scripts/test-ascii-renderer.mjs && node scripts/test-app-ascii-atmosphere.mjs && node scripts/test-forge-ascii.mjs"
```

Run `pnpm run test:ascii`. Expected: all three ASCII suites pass.

---

### Task 2: Hooks and Source Contracts

**Files:**
- Create: `scripts/verify-forge-ascii-product.cjs`
- Create: `src/components/experience/forge/useAsciiViewport.js`
- Create: `src/components/experience/forge/useAsciiFrameLoop.js`
- Create: `src/components/experience/forge/useAsciiTextScramble.js`
- Create: `src/components/experience/forge/useTerminalSound.js`

**Interfaces:**
- `useAsciiViewport()` returns `{tier, columns, fps}`.
- `useAsciiFrameLoop(frames, fps)` returns the active frame string.
- `useAsciiTextScramble(target, options)` returns the displayed string.
- `useTerminalSound()` returns `{enabled, setEnabled, type, tick, success}`.

- [ ] **Step 1: Add failing source requirements**

Require media-query listeners, resize cleanup, `requestAnimationFrame`, `cancelAnimationFrame`, `visibilitychange`, reduced-motion handling, deterministic scramble helper use, opt-in AudioContext creation, local sound preference, oscillator cleanup, and explicit sound methods.

- [ ] **Step 2: Run verifier and confirm RED**

Run `node scripts/verify-forge-ascii-product.cjs`. Expected: missing hook failures.

- [ ] **Step 3: Implement the hooks**

Use lazy state initializers for browser checks, pause loops while hidden, restart on visibility, return frame zero under reduced motion, create AudioContext only from `setEnabled(true)` or an explicit cue, cap gain below `0.035`, and close the context on unmount.

- [ ] **Step 4: Run verifier and behavior tests**

Expected: hook source contracts and `test:ascii` pass.

---

### Task 3: Exercise Frames and Shared Components

**Files:**
- Create: `src/components/experience/forge/ascii-frames/squat.js`
- Create: `src/components/experience/forge/ascii-frames/bench.js`
- Create: `src/components/experience/forge/ascii-frames/deadlift.js`
- Create: `src/components/experience/forge/ascii-frames/index.js`
- Create: `src/components/experience/forge/TerminalProgressBar.jsx`
- Create: `src/components/experience/forge/AsciiExerciseAnimator.jsx`
- Create: `src/components/experience/forge/AsciiAnatomyMap.jsx`
- Create: `src/components/experience/forge/AsciiRestCountdown.jsx`
- Create: `src/components/experience/forge/AsciiOneRmMeter.jsx`

**Interfaces:**
- `exerciseFramesFor(family, tier, weight)` returns exact-width frame strings.
- Components receive real values only and expose `data-forge-*` attributes.

- [ ] **Step 1: Extend tests and verifier before implementation**

Require four or more frames per squat, bench, and deadlift; equal row widths; dynamic plate output at 45, 135, 225, and 405 pounds; reduced-motion support; semantic labels; and shared component exports.

- [ ] **Step 2: Confirm RED**

Run focused behavior and source checks. Expected: missing frame and component failures.

- [ ] **Step 3: Implement assets and components**

Store each frame as padded rows. Compose the dynamic barbell into each rendered frame. Use the hooks from Task 2, keep `pre` output decorative, and provide adjacent accessible labels for exercise, rest time, progress, anatomy, and 1RM state.

- [ ] **Step 4: Confirm GREEN**

Run `pnpm run test:ascii` and the source verifier.

---

### Task 4: Honest Boot and Save Sequences

**Files:**
- Create: `src/components/experience/forge/AsciiBootSequence.jsx`
- Create: `src/components/experience/forge/AsciiSaveSequence.jsx`
- Modify: `src/components/experience/motion/FirstVisitIntro.jsx`
- Modify: `src/components/experience/WorkoutCelebration.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- `AsciiBootSequence({onDone})` checks auth-client availability, storage, Canvas, and network state.
- `AsciiSaveSequence({volume, isPR, onResolved})` resolves to `[SAVED TO BLOCK]` only in the existing successful-save dialog.

- [ ] **Step 1: Add failing contracts**

Require the four honest boot labels, a 1500 ms maximum, Skip control, session-only display, reduced-motion ready state, `[SAVED TO BLOCK]`, `OVERLOAD ACHIEVED` only for saved PRs, dialog focus behavior, and timer cleanup.

- [ ] **Step 2: Confirm RED**

Run the source verifier. Expected: missing sequence failures.

- [ ] **Step 3: Implement and integrate**

Replace the old wordmark loader internally while preserving `FirstVisitIntro`'s public interface. Gate celebration details until the save sequence resolves, but keep the close action available immediately and restore primary focus afterward.

- [ ] **Step 4: Confirm GREEN**

Run source checks and existing motion/ASCII verifiers.

---

### Task 5: Command Deck and Synced Avatar Preference

**Files:**
- Create: `src/components/experience/forge/AsciiAvatarGrid.jsx`
- Create: `src/components/experience/forge/AsciiSystemLog.jsx`
- Modify: `src/components/experience/DashboardCommandCenter.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- `DashboardCommandCenter` additionally consumes `history`, `username`, `avatarStyle`, and `onAvatarStyleChange`.
- `normalizePreferences` returns `asciiAvatarStyle` in the allowed set.

- [ ] **Step 1: Add failing preference and UI contracts**

Require style normalization, account save through `saveAll`, three avatar selectors, real-history system logs, four ASCII vitals, existing Start/Resume and Goals actions, and mobile stacking.

- [ ] **Step 2: Confirm RED**

Run the source verifier and full verifier suite. Expected: FORGE-specific failures only.

- [ ] **Step 3: Implement Command Deck**

Derive all values from existing props. Keep the current action callbacks. Save avatar changes through a new `handleAsciiAvatarStyleChange` that copies `preferences` and calls `saveAll`.

- [ ] **Step 4: Confirm GREEN**

Run the focused verifier and all existing verifiers.

---

### Task 6: Armory Library Integration

**Files:**
- Modify: `src/App.jsx` inside `ExerciseLibraryView`
- Modify: `src/styles.css`
- Modify: `scripts/verify-forge-ascii-product.cjs`

**Interfaces:**
- Existing library callbacks and data shapes remain unchanged.
- Expanded exercise rows pass `profile`, last working weight, and family to shared ASCII components.

- [ ] **Step 1: Add failing Armory contracts**

Require `ARMORY / EXERCISE INDEX`, directory metadata, keyboard Arrow Up/Down and Enter behavior, exercise animator, anatomy map, dynamic weight, and unchanged Start Workout/notes/technique controls.

- [ ] **Step 2: Confirm RED**

Run the source verifier. Expected: missing Armory integration failures.

- [ ] **Step 3: Implement keyboard-safe directory behavior**

Track active row by existing `open` key, focus rows through stable `data-armory-row` selectors after state changes, and use native buttons. Add the animator and anatomy panel above existing coaching content.

- [ ] **Step 4: Confirm GREEN**

Run focused and full verifiers.

---

### Task 7: Forge Logger, Countdown, and PR Meter

**Files:**
- Create: `src/components/experience/forge/ForgeLiveConsole.jsx`
- Modify: `src/App.jsx` inside `LogForm` and `LivePRRadar`
- Modify: `src/styles.css`
- Modify: `scripts/verify-forge-ascii-product.cjs`

**Interfaces:**
- `ForgeLiveConsole` consumes selected exercise name, weight, reps, sets, completed sets, volume, rest time, and accent.
- Existing save, set completion, rest, draft, and volume calculations remain unchanged.

- [ ] **Step 1: Add failing logger contracts**

Require terminal prompt labels, dynamic barbell, completed-set tension bar, large rest countdown, final-three visual alert, opt-in sound control, and candidate 1RM meter.

- [ ] **Step 2: Confirm RED**

Run the focused verifier. Expected: missing logger integration failures.

- [ ] **Step 3: Implement the console and meter**

Compute completed set count from existing `getLiftSetRows(activeFocusCell)`. Mount the console after `WorkoutAsciiReactor`. Render `AsciiOneRmMeter` only when Live PR Radar has a top candidate. Do not change `handleSave`, `completeSetRow`, `startRest`, or volume functions.

- [ ] **Step 4: Confirm GREEN**

Run focused, ASCII, and full feature suites.

---

### Task 8: Responsive Styling, Browser QA, and Documentation

**Files:**
- Modify: `src/styles.css`
- Create: `scripts/qa-earned-forge-ascii-browser.cjs`
- Modify: `README.md`

**Interfaces:**
- Browser QA uses local `visualQA=1` and makes no Supabase writes.

- [ ] **Step 1: Add browser assertions before final styling**

Assert boot completion, no console errors, exact-width visible ASCII, three Command Deck columns on desktop, stacked mobile composition, Library keyboard navigation, Train console values, reduced-motion stable frames, no horizontal overflow, and successful save-sequence source state.

- [ ] **Step 2: Run QA and record RED failures**

Run the production preview QA. Expected: styling/layout assertions fail until the final responsive rules exist.

- [ ] **Step 3: Finish styling and docs**

Add scoped `.forge-*` styles, scanlines below content, monospace alignment, compact variants, focus states, `#ff0000` final-three alert, and reduced-motion rules. Document FORGE_ASCII as an Earned experience system and list its offline/audio behavior.

- [ ] **Step 4: Run complete verification**

Run:

```powershell
pnpm run test:ascii
pnpm run test:iop
pnpm run verify
pnpm run build
node scripts/qa-earned-ascii-browser.cjs http://127.0.0.1:4204/
node scripts/qa-earned-app-ascii-browser.cjs http://127.0.0.1:4204/
node scripts/qa-earned-premium-product-ui-browser.cjs http://127.0.0.1:4204/
node scripts/qa-earned-forge-ascii-browser.cjs http://127.0.0.1:4204/
```

Expected: all commands pass, production responds with HTTP 200, and screenshots show no clipping or overlap on desktop or mobile.
