# Live PR Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a private Live PR Radar to the Log tab that detects draft PR candidates before the workout is saved.

**Architecture:** Use one pure helper in `src/App.jsx` to compare current draft inputs against saved history, and one React component to render a compact Log tab card. Documentation and a verifier script guard the feature.

**Tech Stack:** React, Vite, existing local helper functions, Node verifier script.

## Global Constraints

- Do not add Supabase schema requirements.
- Do not change save behavior or workout volume calculations.
- Ignore skipped exercises.
- Keep the UI compact for in-gym use.
- Use existing `parseLiftCell`, `isLoggedLiftCell`, `allExercises`, and `epley1RM` helpers.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-live-pr-radar-app.cjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: `src/App.jsx`, `README.md`
- Produces: a verifier that fails until the Live PR Radar feature exists.

- [ ] **Step 1: Write the failing verifier**

Create `scripts/verify-live-pr-radar-app.cjs` that checks for:

```js
const appFragments=[
  "function buildLivePRRadar",
  "function LivePRRadar",
  "buildLivePRRadar(history,customEx,activeDay,inputs)",
  "Live PR Radar",
  "Draft PR Candidates",
  "Volume PR",
  "Weight PR",
  "Estimated 1RM PR",
  "PR in Range",
  "Best Gap",
  "Coach Cue",
  "livePrRadar:true",
  "<LivePRRadar radar={livePrRadar}/>",
];
```

- [ ] **Step 2: Run verifier to verify it fails**

Run: `node scripts/verify-live-pr-radar-app.cjs`

Expected: fail with a missing `function buildLivePRRadar` fragment.

### Task 2: Helper And UI

**Files:**
- Modify: `src/App.jsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: `buildLivePRRadar(history, customEx, activeDay, inputs)`
- Produces: `<LivePRRadar radar={livePrRadar}/>`

- [ ] **Step 1: Implement `buildLivePRRadar`**

Add a pure helper that iterates over the active day, ignores skipped or empty draft lifts, compares draft volume, top weight, and estimated 1RM to previous history, and returns a sorted list of candidates.

- [ ] **Step 2: Implement `LivePRRadar`**

Add a compact card with status, top candidate, candidate rows, `Best Gap`, and `Coach Cue`.

- [ ] **Step 3: Wire it into `LogForm`**

Create `const livePrRadar=buildLivePRRadar(history,customEx,activeDay,inputs);` and render `<LivePRRadar radar={livePrRadar}/>` after Live Volume.

- [ ] **Step 4: Document the private feature**

Add a README note stating that Private Live PR Radar appears in the Log tab and requires no Supabase schema changes.

### Task 3: Verification

**Files:**
- Test: `scripts/verify-live-pr-radar-app.cjs`

- [ ] **Step 1: Run feature verifier**

Run: `node scripts/verify-live-pr-radar-app.cjs`

Expected: pass.

- [ ] **Step 2: Run all app verifiers**

Run every `scripts/verify-*.cjs` file with the bundled Node runtime.

Expected: all pass.

- [ ] **Step 3: Run production build**

Run: `pnpm run build`

Expected: Vite build exits 0.

