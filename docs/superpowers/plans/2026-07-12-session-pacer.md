# Session Pacer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a private Session Pacer to the Log tab that tracks elapsed workout time and live pace metrics.

**Architecture:** Add a pure `buildSessionPacer` helper, a compact `SessionPacer` component, Log tab state for `sessionStartedAt` and `sessionTick`, draft autosave persistence, and README/verifier coverage.

**Tech Stack:** React, Vite, existing local helper functions, Node verifier script.

## Global Constraints

- Do not add Supabase schema requirements.
- Do not change save behavior or workout volume calculations.
- Keep the UI compact for in-gym use.
- Persist only `sessionStartedAt` in the private draft.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-session-pacer-app.cjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: `src/App.jsx`, `README.md`
- Produces: a verifier that fails until the Session Pacer feature exists.

- [ ] **Step 1: Write the failing verifier**

Create `scripts/verify-session-pacer-app.cjs` that checks for:

```js
const appFragments=[
  "function buildSessionPacer",
  "function SessionPacer",
  "buildSessionPacer(sessionStartedAt,sessionTick,previewVol,activeLoggedCount,activeSetCount,readinessScore)",
  "Session Pacer",
  "Pace Cue",
  "Volume / Min",
  "Logged Sets",
  "Reset Clock",
  "sessionPacer:true",
  "sessionStartedAt",
  "setSessionStartedAt(Date.now())",
  "<SessionPacer pacer={sessionPacer}",
];
```

- [ ] **Step 2: Run verifier to verify it fails**

Run: `node scripts/verify-session-pacer-app.cjs`

Expected: fail with missing `function buildSessionPacer`.

### Task 2: Helper And UI

**Files:**
- Modify: `src/App.jsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: `buildSessionPacer(sessionStartedAt, sessionTick, previewVol, activeLoggedCount, activeSetCount, readinessScore)`
- Produces: `<SessionPacer pacer={sessionPacer} onResetClock={...}/>`

- [ ] **Step 1: Implement `buildSessionPacer`**

Add a pure helper that returns `sessionPacer:true`, elapsed minutes, elapsed label, volume per minute, set count, status, color, and cue.

- [ ] **Step 2: Implement `SessionPacer`**

Add a compact card with `Elapsed`, `Logged Sets`, `Volume / Min`, `Pace Cue`, and `Reset Clock`.

- [ ] **Step 3: Wire into `LogForm`**

Add `sessionStartedAt` and `sessionTick` state, persist `sessionStartedAt` into drafts, compute active logged set count, and render the Session Pacer below Live PR Radar.

- [ ] **Step 4: Document the private feature**

Add a README note stating that Private Session Pacer appears in the Log tab and requires no Supabase schema changes.

### Task 3: Verification

**Files:**
- Test: `scripts/verify-session-pacer-app.cjs`

- [ ] **Step 1: Run feature verifier**

Run: `node scripts/verify-session-pacer-app.cjs`

Expected: pass.

- [ ] **Step 2: Run all app verifiers**

Run every `scripts/verify-*.cjs` file with the bundled Node runtime.

Expected: all pass.

- [ ] **Step 3: Run production build**

Run: `pnpm run build`

Expected: Vite build exits 0.

