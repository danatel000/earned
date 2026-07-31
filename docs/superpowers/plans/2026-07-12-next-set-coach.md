# Next Set Coach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a private Next Set Coach to Active Exercise Focus that suggests and can insert the next set target while logging.

**Architecture:** Add one pure helper in `src/App.jsx`, one compact component near Active Exercise Focus, and one draft action in `LogForm` that inserts the suggested set. Add README docs and a verifier script.

**Tech Stack:** React, Vite, existing local helper functions, Node verifier script.

## Global Constraints

- Do not add Supabase schema requirements.
- Do not save anything automatically.
- Ignore skipped exercises.
- Keep the recommendation compact for in-gym use.
- Use existing `getLoggedSetRows`, `parseLiftCell`, `getLiftHistory`, and `epley1RM` helpers.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-next-set-coach-app.cjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: `src/App.jsx`, `README.md`
- Produces: a verifier that fails until the Next Set Coach feature exists.

- [ ] **Step 1: Write the failing verifier**

Create `scripts/verify-next-set-coach-app.cjs` that checks for:

```js
const appFragments=[
  "function buildNextSetCoach",
  "function NextSetCoach",
  "buildNextSetCoach(history,activeFocusExercise,activeFocusCell,activeFocusProfile,readinessScore)",
  "Next Set Coach",
  "Suggested Next Set",
  "Add Suggested Set",
  "Why This Set",
  "Decision",
  "Rest",
  "nextSetCoach:true",
  "applyNextSetSuggestion(activeDay,activeFocusExercise,activeFocusNextSetCoach)",
  "<NextSetCoach coach={activeFocusNextSetCoach}",
];
```

- [ ] **Step 2: Run verifier to verify it fails**

Run: `node scripts/verify-next-set-coach-app.cjs`

Expected: fail with missing `function buildNextSetCoach`.

### Task 2: Helper And UI

**Files:**
- Modify: `src/App.jsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: `buildNextSetCoach(history, activeFocusExercise, activeFocusCell, activeFocusProfile, readinessScore)`
- Produces: `<NextSetCoach coach={activeFocusNextSetCoach} onApplySuggestion={...}/>`

- [ ] **Step 1: Implement `buildNextSetCoach`**

Add a pure helper that reads active set rows and saved history, then returns `nextSetCoach:true`, target weight, target reps, rest seconds, decision, and reason.

- [ ] **Step 2: Implement `NextSetCoach`**

Add a compact card with `Suggested Next Set`, `Target`, `Rest`, `Decision`, `Why This Set`, and `Add Suggested Set`.

- [ ] **Step 3: Wire into `LogForm`**

Create `activeFocusNextSetCoach`, render the component in Active Exercise Focus, and add `applyNextSetSuggestion` to insert the suggested set into the focused exercise draft.

- [ ] **Step 4: Document the private feature**

Add a README note stating that Private Next Set Coach appears in Active Exercise Focus and requires no Supabase schema changes.

### Task 3: Verification

**Files:**
- Test: `scripts/verify-next-set-coach-app.cjs`

- [ ] **Step 1: Run feature verifier**

Run: `node scripts/verify-next-set-coach-app.cjs`

Expected: pass.

- [ ] **Step 2: Run all app verifiers**

Run every `scripts/verify-*.cjs` file with the bundled Node runtime.

Expected: all pass.

- [ ] **Step 3: Run production build**

Run: `pnpm run build`

Expected: Vite build exits 0.

