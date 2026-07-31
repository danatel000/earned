# Workout Completion Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private Log tab completion guard that shows whether the active day is ready to confirm.

**Architecture:** Add a pure helper near the other Log tab analytics helpers, then render a compact card near the active day confirmation controls. The helper derives all state from existing `inputs`, `activeDay`, and `customEx`, so no persistence or Supabase changes are required.

**Tech Stack:** React, Vite, existing single-file `src/App.jsx`, Node verifier script.

## Global Constraints

- No Supabase schema changes.
- Do not change workout volume math.
- Keep skipped exercises excluded from saved volume.
- Keep removed exercises restorable through existing restore controls.
- Use existing inline style conventions.

---

### Task 1: Add Workout Completion Guard

**Files:**
- Create: `scripts/verify-workout-completion-guard-app.cjs`
- Modify: `src/App.jsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: `allExercises(dayKey, customEx)`, `removedExercises(dayKey, customEx)`, `isLoggedLiftCell(cell)`, `isSkippedLiftCell(cell)`, `DAYS`
- Produces: `buildWorkoutCompletionGuard(dayKey, inputs, customEx)` and `WorkoutCompletionGuard({guard})`

- [ ] **Step 1: Write the failing verifier**

```js
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

const appFragments = [
  "function buildWorkoutCompletionGuard",
  "function WorkoutCompletionGuard",
  "completionGuard:true",
  "Workout Completion Guard",
  "Needs Action",
  "Ready to confirm",
  "Logged",
  "Skipped",
  "Removed",
  "const workoutCompletionGuard=buildWorkoutCompletionGuard(activeDay,inputs,customEx);",
  "<WorkoutCompletionGuard guard={workoutCompletionGuard}/>",
];

const readmeFragments = [
  "Private Workout Completion Guard",
  "No Supabase schema changes are required.",
];

const missing = [];
for (const fragment of appFragments) {
  if (!app.includes(fragment)) missing.push(`src/App.jsx missing: ${fragment}`);
}
for (const fragment of readmeFragments) {
  if (!readme.includes(fragment)) missing.push(`README.md missing: ${fragment}`);
}

if (missing.length) {
  console.error("Workout Completion Guard verification failed:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Workout Completion Guard verification passed.");
```

- [ ] **Step 2: Run verifier to verify it fails**

Run: `node scripts/verify-workout-completion-guard-app.cjs`
Expected: FAIL with missing `buildWorkoutCompletionGuard`, `WorkoutCompletionGuard`, and README fragments.

- [ ] **Step 3: Implement helper and UI**

Add `buildWorkoutCompletionGuard(dayKey, inputs, customEx)` near the other Log tab helper builders. Add `WorkoutCompletionGuard({guard})` near nearby Log tab components. Compute `workoutCompletionGuard` inside `LogForm` and render the component above the Confirm button.

- [ ] **Step 4: Document**

Add a README line explaining the private guard and that it does not require Supabase schema changes.

- [ ] **Step 5: Run verifier to verify it passes**

Run: `node scripts/verify-workout-completion-guard-app.cjs`
Expected: PASS.

- [ ] **Step 6: Run project verification**

Run the full `scripts/verify-*.cjs` suite, mojibake scan, and production build.
Expected: all verifiers and build pass; mojibake scan returns no matches.
