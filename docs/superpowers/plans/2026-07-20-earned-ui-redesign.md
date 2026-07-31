# Earned UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Dragonfly-inspired but original Earned launch experience and a workout-first authenticated dashboard without changing account data or training calculations.

**Architecture:** Add four focused presentation components and a CSS design system, then wire them to the existing auth, view, history, goal, draft, and save callbacks in `src/App.jsx`. Existing feature components stay intact and move behind clearer progressive disclosure.

**Tech Stack:** React, Vite, Recharts, Supabase, plain CSS, Node source verifiers.

## Global Constraints

- Preserve every storage key, Supabase contract, tracking transform, and existing account's workout data.
- Add no dependency and no fake payment, AI, wearable, or social behavior.
- Use the existing Earned logo assets.
- Support 320 px mobile through wide desktop and `prefers-reduced-motion`.
- Keep the primary workout action one tap from the dashboard.

---

### Task 1: UI Contract Verifier

**Files:**
- Create: `scripts/verify-earned-ui-redesign.cjs`
- Test: `scripts/verify-earned-ui-redesign.cjs`

**Interfaces:**
- Consumes: source files and CSS as UTF-8 strings.
- Produces: a nonzero exit code when launch, command center, navigation, celebration, accessibility, or responsive contracts are absent.

- [ ] Write assertions for the four component files, `Start training`, `Start workout`, semantic dialog/form labels, `prefers-reduced-motion`, mobile breakpoints, and App wiring.
- [ ] Run `node scripts/verify-earned-ui-redesign.cjs` and confirm it fails because the components do not exist.

### Task 2: Public Launch And Authentication

**Files:**
- Create: `src/components/experience/PublicLaunch.jsx`
- Modify: `src/App.jsx` in `AuthScreen`
- Modify: `src/styles.css`
- Modify: `index.html`

**Interfaces:**
- Consumes: `{mode, username, password, error, busy, onModeChange, onUsernameChange, onPasswordChange, onSubmit}`.
- Produces: the unauthenticated Earned launch page and the same Supabase login/signup submission path.

- [ ] Implement the full-bleed hero, proof strip, numbered product sections, pricing preview, and account form.
- [ ] Replace `AuthScreen`'s inline card with `PublicLaunch` while retaining all current validation and auth handlers.
- [ ] Add launch design tokens, ASCII signal motion, focus states, and responsive rules.
- [ ] Run the UI verifier and build; fix syntax, accessibility, and overflow failures.

### Task 3: Workout-First App Shell

**Files:**
- Create: `src/components/experience/AppNavigation.jsx`
- Create: `src/components/experience/DashboardCommandCenter.jsx`
- Modify: `src/App.jsx` in the authenticated return tree
- Modify: `src/styles.css`

**Interfaces:**
- `AppNavigation` consumes `{items, activeView, unreadCount, onNavigate}`.
- `DashboardCommandCenter` consumes real derived values and `{onStartWorkout, onOpenGoals}` callbacks.
- Both produce presentation only and never persist data.

- [ ] Add a sticky app header and route-compatible control rail.
- [ ] Add the `Today` command center with Start/Resume, next split, streak, volume, and weekly goal progress.
- [ ] Move Daily/Weekly control into the compact shell and preserve its existing save handler.
- [ ] Keep all eight views reachable while making Log the primary command.
- [ ] Fix `SummaryStrip` by defining `bestVol` from history before render.
- [ ] Run all existing verifiers and the production build.

### Task 4: Dashboard Progressive Disclosure

**Files:**
- Modify: `src/App.jsx` in `TotalVolumeView`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: existing dashboard component props.
- Produces: essential insights first and expandable analytics/progress collections with no calculation changes.

- [ ] Keep onboarding launchpad only while incomplete.
- [ ] Group Premium intelligence, achievements/progress, and detailed charts into labeled disclosure regions.
- [ ] Remove duplicate momentum presentation from the first viewport while keeping the underlying feature available.
- [ ] Verify keyboard operation and mobile sizing of disclosure controls.
- [ ] Run the source verifiers and build.

### Task 5: Workout Completion Reward

**Files:**
- Create: `src/components/experience/WorkoutCelebration.jsx`
- Modify: `src/App.jsx` in `handleNewPeriod` and the authenticated return tree
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `{open, workoutLabel, volume, streak, isPR, onClose, onViewProgress, onOpenFeed}`.
- Produces: an ephemeral dialog after a successful save.

- [ ] Derive celebration data from the successfully saved payload and updated history.
- [ ] Implement dialog semantics, Escape close, restrained animation, and actual workout metrics.
- [ ] Keep the existing contextual Premium prompt after dismissal.
- [ ] Run the UI verifier and build.

### Task 6: Premium And State Polish

**Files:**
- Modify: `src/components/monetization/PricingView.jsx`
- Modify: `src/components/monetization/PremiumGate.jsx`
- Modify: `src/components/monetization/UpgradePrompt.jsx`
- Modify: `src/App.jsx` loading/failure states
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: current subscription/access props.
- Produces: restyled, honest Premium Preview and action-led system states.

- [ ] Apply Earned classes and benefit-led copy without changing plan or entitlement behavior.
- [ ] Add useful retry/login/loading visuals using the existing handlers.
- [ ] Confirm no UI says payment, AI, or wearable sync is live.
- [ ] Run `npm run test:iop` and `npm run build`.

### Task 7: Full Verification And Browser QA

**Files:**
- Modify only files required by findings.

**Interfaces:**
- Consumes: production build.
- Produces: verified desktop/mobile output and a persistent local preview.

- [ ] Run `npm run verify` and require all verifiers to pass.
- [ ] Run `npm run test:iop` and require all monetization/recovery contracts to pass.
- [ ] Run `npm run build` and inspect emitted assets.
- [ ] Start a persistent local server on an available port and confirm HTTP 200.
- [ ] Capture desktop and mobile screenshots, inspect overflow and console errors, and fix any findings.
- [ ] Re-run the complete verification suite after visual fixes.

