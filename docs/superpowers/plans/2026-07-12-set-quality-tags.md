# Set Quality Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add private set quality tags to the Log tab and Active Exercise Focus.

**Architecture:** Preserve a `quality` field in each set row, add one pure summary helper, one compact summary component, and per-set buttons that update the private draft. Add README and verifier coverage.

**Tech Stack:** React, Vite, existing local helper functions, Node verifier script.

## Global Constraints

- Do not add Supabase schema requirements.
- Do not change volume math.
- Do not change skip behavior.
- Keep controls compact for mobile gym use.
- Store quality in existing private `setDetails`.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-set-quality-tags-app.cjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: `src/App.jsx`, `README.md`
- Produces: a verifier that fails until Set Quality Tags exist.

- [ ] **Step 1: Write the failing verifier**

Create `scripts/verify-set-quality-tags-app.cjs` that checks for:

```js
const appFragments=[
  "const SET_QUALITY_OPTIONS",
  "function buildSetQualitySummary",
  "function SetQualitySummary",
  "handleSetQuality(activeDay,ex.id,index,quality.id)",
  "Set Quality",
  "Set Quality Summary",
  "Quality Mix",
  "Hard Sets",
  "Coach Cue",
  "Easy",
  "Good",
  "Hard",
  "Failed",
  "setQualitySummary:true",
  "<SetQualitySummary summary={activeFocusSetQualitySummary}/>",
];
```

- [ ] **Step 2: Run verifier to verify it fails**

Run: `node scripts/verify-set-quality-tags-app.cjs`

Expected: fail with missing `const SET_QUALITY_OPTIONS`.

### Task 2: Helper And UI

**Files:**
- Modify: `src/App.jsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: `buildSetQualitySummary(activeFocusCell, readinessScore)`
- Produces: `<SetQualitySummary summary={activeFocusSetQualitySummary}/>`

- [ ] **Step 1: Preserve quality in set parsing**

Update `getLoggedSetRows` so each parsed row keeps `quality: row.quality || "good"` while leaving volume math unchanged.

- [ ] **Step 2: Add summary helper and component**

Add `SET_QUALITY_OPTIONS`, `buildSetQualitySummary`, and `SetQualitySummary`.

- [ ] **Step 3: Wire controls into LogForm**

Add `handleSetQuality`, compute `activeFocusSetQualitySummary`, render the focus summary, and render quality buttons under each set row.

- [ ] **Step 4: Document the private feature**

Add a README note stating that Private Set Quality Tags appear in the Log tab and require no Supabase schema changes.

### Task 3: Verification

**Files:**
- Test: `scripts/verify-set-quality-tags-app.cjs`

- [ ] **Step 1: Run feature verifier**

Run: `node scripts/verify-set-quality-tags-app.cjs`

Expected: pass.

- [ ] **Step 2: Run all app verifiers**

Run every `scripts/verify-*.cjs` file with the bundled Node runtime.

Expected: all pass.

- [ ] **Step 3: Run production build**

Run: `pnpm run build`

Expected: Vite build exits 0.

