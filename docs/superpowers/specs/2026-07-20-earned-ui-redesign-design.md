# Earned UI/UX Redesign Design

## Goal

Turn Earned from a feature-dense tracker into a recognizable training product: a bold public launch experience, a workout-first authenticated shell, and a calmer hierarchy that makes progress, rewards, and Premium value easy to find without changing workout data or calculations.

## Current UI/UX Audit

### What already works

- Account-scoped Supabase authentication, cloud sync, offline drafts, backup, and daily/weekly tracking are already production-oriented foundations.
- The app already has meaningful retention systems: streaks, achievements, milestones, challenges, PRs, goals, workout recaps, readiness, scheduling, a community feed, and premium analytics.
- Logging supports the gym-floor details users need: previous values, skips that preserve prior values, section-level skip/save, rest timers, quick set adjustments, completion guards, notes, and templates.
- Free/Premium definitions, entitlement checks, a pricing modal, and honest payment placeholders already exist.

### What is holding the experience back

- The unauthenticated experience is a small centered login card. It does not communicate the brand, demonstrate value, or create a strong reason to start.
- Eight equally weighted navigation buttons, four summary cards, and a long vertical stack of advanced panels compete for attention before the user reaches the workout action.
- Starting a workout is not the dominant first-screen action even though it is the most common job.
- Most visual styling is inline inside `src/App.jsx`, which makes the interface inconsistent and difficult to refine responsively.
- The current navy/purple gradient-heavy palette does not strongly express the new Earned logo or name.
- Premium value exists, but it is presented among many other panels instead of as a concise, benefit-led preview.
- Empty and loading states explain status but do not consistently give users a clear next action.
- `SummaryStrip` references an undefined `bestVol` variable when history exists, a latent runtime bug that must be fixed during the pass.

## Research Comparison

The supplied report prioritizes one-tap workout starts, personalized goals, visible progress, immediate completion feedback, short onboarding, streaks, achievements, challenges, community, and restrained premium previews. Earned already has most of the underlying capabilities. The redesign therefore emphasizes discoverability and feedback rather than inventing more systems.

Dragonfly's useful principles are its dramatic identity, oversized typography, technical control-panel details, section numbering, single-scroll storytelling, and layered ASCII-inspired motion. Earned will translate those principles into its own black, acid-lime, white, cyan, and coral training identity. It will not reuse Dragonfly branding, assets, copy, or exact layouts.

## Considered Approaches

### 1. CSS repaint

Fastest and lowest risk, but it leaves navigation overload and dashboard hierarchy unchanged.

### 2. Near Dragonfly clone

Highest visual similarity, but a portfolio-style experience is inefficient while logging sets and would over-copy another brand's distinctive presentation.

### 3. Earned Performance System (selected)

Use a Dragonfly-inspired public story and technical visual language, then switch to a focused training console after authentication. This gives Earned a launch-worthy identity without sacrificing gym-floor speed.

## Experience Architecture

### Public Launch

- Full-viewport black hero with a large Earned wordmark, oversized logo image, and original ASCII training signal.
- Literal H1: `EARNED`; support line: progress is proof of work.
- Primary `Start training` action scrolls to the account form; secondary action previews the product system.
- A compact proof strip communicates real capabilities: daily/weekly tracking, offline drafts, private accounts, and progress intelligence.
- Three numbered full-width sections explain logging, progress, and Premium Preview without card-heavy marketing composition.
- Login and signup remain on the same page and use the existing Supabase handlers. Username defaults to empty for a cleaner multi-user entry.

### Authenticated Shell

- A compact sticky header carries the Earned mark, sync state, account identity, tracking mode, Premium entry, and logout.
- Navigation remains route-compatible but becomes a horizontally scrollable control rail with a strong active state.
- A `Today` command surface becomes the first dashboard object. It derives the next workout, streak, current volume, and goal progress from real account data.
- `Start workout` or `Resume workout` is always the dominant action and routes directly to the existing Log view.
- The dashboard uses progressive disclosure: the essential command and progress summary appear first; analytics collections sit in clearly labeled expandable sections.

### Rewards And Retention

- Every successful save opens a short completion celebration using actual workout label, volume, streak, and PR status.
- Existing achievements, challenges, milestones, and community systems remain the source of truth.
- Motion is brief, functional, and disabled by `prefers-reduced-motion`.

### Monetization

- Pricing keeps the existing honest Preview architecture and $19.99 annual placeholder.
- Premium presentation adopts the new visual system and focuses on outcomes: smarter progression, recovery context, and deeper history.
- Upgrade prompts remain contextual and dismissible. No payment, AI, wearable, or subscription claims are added.

## Component Boundaries

- `src/components/experience/PublicLaunch.jsx`: public story and account form presentation only.
- `src/components/experience/DashboardCommandCenter.jsx`: real-data dashboard hero and primary workout action.
- `src/components/experience/AppNavigation.jsx`: route-compatible desktop/mobile navigation.
- `src/components/experience/WorkoutCelebration.jsx`: post-save reward overlay.
- `src/styles.css`: Earned tokens, layouts, interactions, responsive rules, and reduced-motion behavior.
- `src/App.jsx`: auth and save handlers, view state, component wiring, and progressive-disclosure grouping.
- Monetization components: visual classes and copy polish only; billing contracts remain unchanged.

## Data And Safety

- No storage keys, Supabase tables, account migration logic, history records, goal calculations, or tracking period transforms change.
- New components receive derived values and callbacks; they do not write storage directly.
- Workout celebration state is ephemeral and disappears on refresh.
- All new-account and existing-account behavior uses the current authentication and bootstrap path.

## Responsive And Accessibility Requirements

- Support 320 px mobile through wide desktop without text overlap.
- Keep touch targets at least 42 px for primary controls.
- Preserve visible focus states, semantic headings, labeled form inputs, dialog semantics, Escape-to-close behavior, and reduced motion.
- The hero leaves the next section visible on common desktop and mobile viewports.

## Verification

- Add a source contract verifier for the new components, accessibility hooks, responsive CSS, and App wiring.
- Run `npm run verify`, `npm run test:iop`, `npm run build`, and the preview smoke test.
- Capture unauthenticated desktop and mobile screenshots and inspect overflow, hierarchy, text fit, focus, and browser console errors.
- Exercise an authenticated fixture path without changing real user data, then confirm Start/Resume navigation and the dashboard's empty state.

## Scope Boundaries

- No real payments, AI, wearable sync, new social backend, exercise video library, or broad rewrite of all legacy panels.
- The initial pass modernizes the public launch, shell, dashboard entry, completion feedback, and Premium presentation. Deep per-view visual normalization can follow after user testing.

