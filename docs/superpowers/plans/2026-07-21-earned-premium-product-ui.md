# Earned Premium Product UI Implementation Plan

## Goal

Implement a cohesive premium visual system across the signed-in Earned application while preserving all existing training, account, persistence, and monetization behavior.

## Task 1: Add UI contracts

**Files**
- Create: `scripts/verify-earned-premium-product-ui.cjs`

**Steps**
1. Assert that the shared view identity component exists.
2. Assert that all eight view IDs have presentation metadata.
3. Assert that `App.jsx` mounts the component and a page-level view wrapper.
4. Assert that the CSS exposes the new surface, border, geometry, and text tokens.
5. Assert desktop shell width, responsive identity rules, and shared control styling.
6. Assert that legacy structural blue panels and large inline operational radii are removed.
7. Run the verifier and confirm it fails before implementation.

## Task 2: Build the shared view identity

**Files**
- Create: `src/ViewIdentityBar.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles.css`

**Steps**
1. Define presentation metadata for Today, Train, Progress, Records, History, Goals, Library, and Feed.
2. Build an accessible, data-driven view identity band.
3. Mount it once in the signed-in main stage.
4. Pass current tracking mode, saved-session count, and streak context.
5. Wrap rendered view content in `earned-page earned-page--<view>`.
6. Run the UI contract verifier.

## Task 3: Modernize the product shell

**Files**
- Modify: `src/styles.css`

**Steps**
1. Add graphite surface, border, text, geometry, and shadow tokens.
2. Increase the signed-in canvas maximum width to 1180px.
3. Refine the sticky header, account actions, save state, and tracking-mode control.
4. Refine navigation spacing, active indicators, hover, focus, and mobile overflow.
5. Add the full view identity desktop and mobile layouts.
6. Verify no public-launch or authentication regression.

## Task 4: Normalize operational surfaces and controls

**Files**
- Modify: `src/App.jsx`
- Modify: `src/styles.css`

**Steps**
1. Replace structural blue-purple hard-coded backgrounds and borders with graphite equivalents.
2. Normalize operational panel radii to 6px and nested controls to 4px while preserving pills, toggles, and avatars.
3. Add page-scoped surface normalization for legacy inline panels.
4. Normalize input, select, textarea, and button visual states.
5. Improve disabled, hover, active, and focus-visible feedback.
6. Re-run all feature verifiers after the mechanical cleanup.

## Task 5: Refine data-rich views

**Files**
- Modify: `src/styles.css`
- Modify targeted markup in: `src/App.jsx`

**Steps**
1. Improve Today metric hierarchy and action priority.
2. Improve Train section grouping and preserve stable entry controls.
3. Improve Progress charts, radar, comparison rows, and premium analytics readability.
4. Improve Records and History scanning with clearer dividers and labels.
5. Improve Goals target hierarchy and exercise membership controls.
6. Improve Library filters, movement rows, and empty states.
7. Improve Feed post hierarchy and engagement controls.
8. Keep semantic muscle-group colors confined to data and training context.

## Task 6: Refine overlays, charts, and feedback states

**Files**
- Modify: `src/styles.css`
- Modify targeted markup in: `src/App.jsx`

**Steps**
1. Apply the shared dialog surface and geometry treatment.
2. Refine Recharts axes, grids, legends, and tooltip surfaces.
3. Align completion, achievement, premium, error, loading, and empty states with the new system.
4. Confirm ASCII atmosphere and milestone reactions remain legible and non-blocking.

## Task 7: Automated verification

**Files**
- Create: `scripts/qa-earned-premium-product-ui-browser.cjs`

**Steps**
1. Run `pnpm run test:ascii`.
2. Run `pnpm run test:iop`.
3. Run `pnpm run verify`.
4. Run `pnpm run build`.
5. Start or refresh the production preview on port 4204.
6. Use Playwright to sign in and navigate all eight views.
7. Assert view identity content, shell width, control geometry, and absence of page overflow.
8. Capture representative desktop and mobile screenshots.
9. Confirm no page errors or failed local asset requests.

## Task 8: Visual correction pass

**Files**
- Modify as required: `src/styles.css`, `src/App.jsx`, `src/ViewIdentityBar.jsx`

**Steps**
1. Inspect Today, Train, Progress, Goals, Library, and Feed screenshots at desktop size.
2. Inspect Today and Train at mobile size.
3. Correct contrast, hierarchy, clipping, overlap, control sizing, or excessive decoration.
4. Rebuild and repeat browser QA after every correction.
5. Leave the verified local preview running at `http://127.0.0.1:4204/`.

