# Training Momentum Coach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a private Training Momentum Coach card to the Volume dashboard.

**Architecture:** Add a pure helper that derives momentum from saved workout dates and reuses the existing schedule helper for the next workout. Add a compact dashboard component that shows momentum metrics and can start the scheduled plan through the existing draft path.

**Tech Stack:** React, Vite, existing workout history state, existing scheduling helpers, Node verifier scripts, README documentation.

## Global Constraints

- No Supabase schema changes.
- No new dependencies.
- Do not persist new fields.
- Reuse existing private `history` and `customEx`.
- Copy should encourage restarting, not shame missed workouts.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-training-momentum-coach-app.cjs`

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
  "function buildTrainingMomentumCoach",
  "function TrainingMomentumCoach",
  "buildTrainingMomentumCoach(history,customEx)",
  "Training Momentum Coach",
  "Days Since Last Lift",
  "Momentum Score",
  "Last 14 Days",
  "Average Gap",
  "Next Best Lift",
  "Comeback Plan",
  "Streak Protection",
  "Start Momentum Plan",
  "trainingMomentumCoach:true",
  "buildWorkoutSchedule(history,customEx)",
  "<TrainingMomentumCoach history={history} customEx={customEx}",
];
const requiredReadme=[
  "Private Training Momentum Coach",
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
console.log("Training Momentum Coach verifier passed.");
```

- [x] **Step 2: Run verifier to verify it fails**

Run: `node scripts/verify-training-momentum-coach-app.cjs`

Expected: FAIL with missing `buildTrainingMomentumCoach`.

### Task 2: Helper

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `history`, `customEx`, `calcStreak`, `buildWorkoutSchedule`
- Produces: `buildTrainingMomentumCoach(history, customEx={})`

- [x] **Step 1: Add helper**

Compute days since last lift, workouts in the last 14 and 30 days, average gap, momentum score, status, comeback plan, streak protection, and next workout.

- [x] **Step 2: Handle edge cases**

Return `null` for no history and handle missing/invalid dates without throwing.

### Task 3: Component And Dashboard Wiring

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `buildTrainingMomentumCoach(history, customEx)`
- Produces: `TrainingMomentumCoach({history, customEx, onStartPlan, hasDraft})`

- [x] **Step 1: Add component**

Render momentum metrics, next best lift, comeback plan, and streak protection.

- [x] **Step 2: Wire start plan button**

If a next workout has a plan, show `Start Momentum Plan` and call `onStartPlan(nextWorkout.plan)`.

- [x] **Step 3: Add to Volume dashboard**

Render the component near the top of `TotalVolumeView`, after the Starter Launchpad.

### Task 4: Documentation And Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-07-12-training-momentum-coach.md`

**Interfaces:**
- Consumes: completed app changes.
- Produces: verified build artifact and updated deployment zip.

- [x] **Step 1: Document the feature**

Add a README note that this is private and requires no Supabase schema changes.

- [x] **Step 2: Run feature verifier**

Run: `node scripts/verify-training-momentum-coach-app.cjs`

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
