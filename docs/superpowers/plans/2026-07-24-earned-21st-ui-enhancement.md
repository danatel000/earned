# Earned 21st.dev UI Enhancement Implementation Plan

**Date:** 2026-07-24

## Goal

Process all 16 requested 21st.dev categories and integrate the highest-value patterns into Earned as a cohesive, production-ready enhancement.

## Constraints

- Preserve the current Vite/React architecture.
- Preserve Earned's existing design tokens and ASCII identity.
- Do not add Tailwind/shadcn solely to consume copied blocks.
- Do not invent testimonials or product capabilities.
- Do not push to GitHub unless explicitly requested.

## Step 1: Verification Contract

Create `scripts/test-21st-ui-system.mjs` before implementation. It will verify:

- Shared UI primitives exist and are used.
- Launch feature, gallery, and proof sections exist.
- Auth and navigation retain semantic controls.
- All 16 categories appear in `ui-upgrade-log.md`.
- Responsive and reduced-motion styles cover new components.

Add `test:ui21` to `package.json` and run it once to establish the expected failing state.

## Step 2: Shared UI Primitives

Create `src/components/experience/EarnedInterfaceKit.jsx` with:

- `EarnedSignalCard`
- `EarnedKineticButton`
- `EarnedMetricBars`
- `EarnedSignalText`

Add low-cost pointer-light behavior with cleanup and reduced-motion checks.

## Step 3: Launch Product Story

Create:

- `src/components/experience/LaunchFeatureMatrix.jsx`
- `src/components/experience/LaunchProductGallery.jsx`
- `src/components/experience/LaunchProofCarousel.jsx`

Integrate them into `PublicLaunch.jsx` between the existing proof rail, product preview, system explanation, and account conversion section.

## Step 4: Auth, Menu, And Dashboard Polish

- Refine the existing launch auth surface with trust and status details.
- Improve launch navigation and menu interaction states through shared styling.
- Reuse signal-surface styling in the signed-in command center where it improves hierarchy.
- Keep the existing mobile horizontal app navigation instead of adding a space-heavy sidebar.

## Step 5: Category Log

Create `ui-upgrade-log.md` with:

- Summary at the top.
- Five-candidate shortlist or an explicit no-fit note for each category.
- Rubric scores and scenario matrices where useful.
- Decision rationale and exact files changed.
- Install method notes adapted to Earned's no-new-dependency architecture.

## Step 6: Verification

Run:

1. `npm run test:ui21`
2. `npm run test:launch`
3. `npm run test:ascii`
4. `npm run verify`
5. `npm run build`

Then inspect desktop and mobile launch views in the browser, check the console, test interactive controls, and verify reduced-motion behavior.

