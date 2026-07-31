# Earned Workout Ecosystem UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one cohesive, high-quality post-authentication UI system across Earned's eight workout views using production-suitable patterns surveyed on 21st.dev.

**Architecture:** Add a pure view-signal model and one shared command-rail component, then expose stable classes from the existing view functions so a dedicated CSS layer can improve each surface without touching workout persistence or calculations. Enhance the existing navigation and add only two functional workflow changes: History filtering and a responsive Library directory.

**Tech Stack:** React, Vite, custom CSS design tokens, Recharts, Node assertion verifiers.

## Global Constraints

- Preserve Supabase auth, synchronization, local drafts, and account data behavior.
- Preserve daily and weekly tracking calculations.
- Do not add Tailwind, shadcn/ui, or another animation dependency.
- Do not add fake testimonials, AI, wearable data, or payment processing.
- Keep mobile workout logging fast and readable.
- Respect `prefers-reduced-motion`.
- Do not push or update GitHub.

---

### Task 1: Contract Verifier

**Files:**
- Create: `scripts/test-workout-ui-system.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: repository source files as UTF-8 text.
- Produces: `npm run test:workout-ui`.

- [ ] **Step 1: Write the failing verifier**

Assert that the shared signal model, command rail, view classes, navigation semantics, responsive CSS, reduced-motion CSS, and 16-category log exist.

- [ ] **Step 2: Run the verifier**

Run the bundled Node executable against `scripts/test-workout-ui-system.mjs`.

Expected: FAIL because the workout UI files do not exist.

- [ ] **Step 3: Add the package script**

Add `"test:workout-ui": "node scripts/test-workout-ui-system.mjs"`.

### Task 2: View Signal Model

**Files:**
- Create: `src/components/experience/workout/workoutViewSignals.js`
- Test: `scripts/test-workout-ui-system.mjs`

**Interfaces:**
- Produces: `WORKOUT_VIEW_SIGNALS` and `buildWorkoutViewSignal(view, context)`.
- Context fields: `trackingMode`, `sessionCount`, `streak`, `latestVolume`, `weekVolume`, `weeklyGoal`, `draft`, `unreadCount`, `recordCount`, `goalCount`, `exerciseCount`.

- [ ] **Step 1: Define all eight view records**

Each record includes `index`, `eyebrow`, `accent`, `signal`, `primary`, and `secondary`.

- [ ] **Step 2: Build display metrics**

Return two compact metric objects and a goal/activity percentage clamped to 0-100.

- [ ] **Step 3: Run the focused verifier**

Expected: model assertions pass while later component assertions still fail.

### Task 3: Shared Workout Command Rail

**Files:**
- Create: `src/components/experience/workout/WorkoutEcosystemRail.jsx`
- Modify: `src/App.jsx`
- Test: `scripts/test-workout-ui-system.mjs`

**Interfaces:**
- Consumes: `signal`, `onNavigate`, and `onOpenPremium`.
- Produces: `.earned-workout-rail` rendered once above every view.

- [ ] **Step 1: Implement semantic markup**

Render signal copy, two metrics, progress track, and primary/secondary buttons. Omit unavailable actions rather than rendering disabled placeholders.

- [ ] **Step 2: Compute rail context in App**

Use existing history/goals/exercise helpers and pass only display-ready values to the model.

- [ ] **Step 3: Wire actions**

Map view actions to existing navigation or Premium pricing callbacks.

- [ ] **Step 4: Run the focused verifier**

Expected: rail integration assertions pass.

### Task 4: Kinetic Eight-Tab Navigation

**Files:**
- Modify: `src/components/experience/AppNavigation.jsx`
- Modify: `src/styles-workout.css`
- Test: `scripts/test-workout-ui-system.mjs`

**Interfaces:**
- Consumes: existing `items`, `activeView`, `unreadCount`, and `onNavigate`.
- Produces: semantic keyboard-operable tab navigation.

- [ ] **Step 1: Add semantic tab behavior**

Add tablist/tab roles, `aria-selected`, `tabIndex`, `aria-controls`, and stable `data-tab-index` values.

- [ ] **Step 2: Add roving keyboard navigation**

ArrowLeft/ArrowRight/Home/End focus and activate the intended tab.

- [ ] **Step 3: Add active rail styling**

Use a CSS custom property derived from the active index and keep Train visually distinct.

- [ ] **Step 4: Run the focused verifier**

Expected: navigation behavior assertions pass.

### Task 5: View Hooks and Workflow Improvements

**Files:**
- Modify: `src/App.jsx`
- Create: `src/styles-workout.css`
- Modify: `src/main.jsx`
- Test: `scripts/test-workout-ui-system.mjs`

**Interfaces:**
- Produces: `.earned-workout-view--today`, `--train`, `--progress`, `--records`, `--history`, `--goals`, `--library`, and `--feed`.

- [ ] **Step 1: Add stable root classes**

Add classes to the eight view roots and important repeated cards without changing their data props.

- [ ] **Step 2: Add History filters**

Add text search and all/recent/PR filters. Filter display entries only; retain original source indices for edit/delete callbacks.

- [ ] **Step 3: Add Library directory hooks**

Add grid/list semantics, open-state classes, and an accessible results announcement.

- [ ] **Step 4: Add Feed challenge rail hooks**

Use existing real challenge data and posts; do not create testimonial content.

- [ ] **Step 5: Implement responsive view CSS**

Style shared panels, active training surfaces, records, history, goals, Library grid, and Feed rail. Include 760 px and 520 px mobile rules.

- [ ] **Step 6: Implement reduced-motion CSS**

Disable repeated scans, glows, and transforms while preserving state visibility.

- [ ] **Step 7: Run the focused verifier**

Expected: all workout UI contract assertions pass.

### Task 6: 21st.dev Decision Log

**Files:**
- Create: `workout-ui-upgrade-log.md`
- Test: `scripts/test-workout-ui-system.mjs`

**Interfaces:**
- Produces: 16 category entries and one summary.

- [ ] **Step 1: Document candidate shortlists**

Record candidate names, authors/libraries, visual behavior, dependency considerations, scoring, and install/adaptation method.

- [ ] **Step 2: Add tab-specific scenario matrices**

Map each chosen pattern to the views where it improves the workflow.

- [ ] **Step 3: Record deliberate non-installs**

Explain why a full sidebar, fake testimonial wall, or full-page template was not installed.

- [ ] **Step 4: Run the focused verifier**

Expected: log completeness assertions pass.

### Task 7: Full Verification and Visual QA

**Files:**
- Modify only if verification reveals defects.

**Interfaces:**
- Consumes: completed implementation.
- Produces: verified production build and browser-tested views.

- [ ] **Step 1: Run focused UI verifier**

Run `test-workout-ui-system.mjs`.

- [ ] **Step 2: Run all existing feature verifiers**

Run `scripts/run-verifiers.cjs`.

- [ ] **Step 3: Run launch, ASCII, monetization, and existing 21st.dev tests**

Run all package-level focused suites.

- [ ] **Step 4: Build production assets**

Run Vite build with the bundled Node executable.

- [ ] **Step 5: Browser-test all eight views**

Use `?visualQA=1&view=<id>` on desktop and mobile. Check overflow, view rail content, tab navigation, Library expansion, History filters, console errors, and reduced-motion behavior.

- [ ] **Step 6: Fix and repeat**

Any discovered defect receives a focused failing assertion before the fix, followed by fresh full verification.

