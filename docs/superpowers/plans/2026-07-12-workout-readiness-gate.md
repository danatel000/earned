# Workout Readiness Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a private readiness recommendation panel inside the Log tab.

**Architecture:** Add a pure helper that turns existing readiness and live volume values into a mode, then render a compact component inside the existing Readiness Check-In card. No new persistence is required.

**Tech Stack:** React, Vite, existing readiness helpers, existing Log tab draft state, Node verifier scripts, README documentation.

## Global Constraints

- No Supabase schema changes.
- No new dependencies.
- Do not block saving workouts.
- Read only existing draft/session state.
- Copy must stay encouraging and avoid medical claims.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-workout-readiness-gate-app.cjs`

**Interfaces:**
- Consumes: `src/App.jsx`, `README.md`
- Produces: a verifier for this HIU slice.

- [x] **Step 1: Write the failing verifier**

```js
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(root,"src","App.jsx"),"utf8");
const readme=fs.readFileSync(path.join(root,"README.md"),"utf8");
const requiredApp=[
  "function buildWorkoutReadinessGate",
  "function WorkoutReadinessGate",
  "buildWorkoutReadinessGate(readinessScore,readiness,previewVol,prevDayVol,activeLoggedCount)",
  "Workout Readiness Gate",
  "Recommended Mode",
  "Push Day",
  "Normal Training",
  "Controlled Session",
  "Recovery Bias",
  "Volume Check",
  "Readiness Mix",
  "Log Guidance",
  "workoutReadinessGate:true",
  "<WorkoutReadinessGate gate={workoutReadinessGate}/>",
];
const requiredReadme=[
  "Private Workout Readiness Gate",
  "No Supabase schema changes are required.",
];
for(const needle of requiredApp){
  if(!app.includes(needle)){
    console.error(`Missing App fragment: ${needle}`);
    process.exit(1);
  }
}
for(const needle of requiredReadme){
  if(!readme.includes(needle)){
    console.error(`Missing README fragment: ${needle}`);
    process.exit(1);
  }
}
console.log("Workout Readiness Gate verifier passed.");
```

- [x] **Step 2: Run verifier to verify it fails**

Run: `node scripts/verify-workout-readiness-gate-app.cjs`

Expected: FAIL with missing `buildWorkoutReadinessGate`.

### Task 2: Helper

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `readinessScore`, `readiness`, `previewVol`, `prevDayVol`, `activeLoggedCount`
- Produces: `buildWorkoutReadinessGate(readinessScore, readiness, previewVol=0, prevDayVol=0, activeLoggedCount=0)`

- [x] **Step 1: Add helper**

Compute mode, status, score, color, volume delta, readiness mix, guidance, and checks.

- [x] **Step 2: Handle empty draft state**

Return guidance even when no lifts have been logged yet.

### Task 3: Component And Log Tab Wiring

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `buildWorkoutReadinessGate(readinessScore, readiness, previewVol, prevDayVol, activeLoggedCount)`
- Produces: `WorkoutReadinessGate({gate})`

- [x] **Step 1: Add component**

Render Recommended Mode, Volume Check, Readiness Mix, Log Guidance, and checks.

- [x] **Step 2: Render inside Readiness Check-In**

Create `workoutReadinessGate` in `LogForm` and render `<WorkoutReadinessGate gate={workoutReadinessGate}/>` below the readiness sliders.

### Task 4: Documentation And Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-07-12-workout-readiness-gate.md`

**Interfaces:**
- Consumes: completed app changes.
- Produces: verified build artifact and updated deployment zip.

- [x] **Step 1: Document the feature**

Add a README note that this is private and requires no Supabase schema changes.

- [x] **Step 2: Run feature verifier**

Run: `node scripts/verify-workout-readiness-gate-app.cjs`

Expected: PASS.

- [x] **Step 3: Run all verifiers**

Run every `scripts/verify-*.cjs` file.

Expected: PASS.

- [x] **Step 4: Run mojibake scan**

Run the project mojibake scan against touched files.

Expected: no matches.

- [x] **Step 5: Build and zip**

Run: `pnpm run build`, then regenerate `lift-tracker-dist.zip`.

Expected: production build exits 0.
