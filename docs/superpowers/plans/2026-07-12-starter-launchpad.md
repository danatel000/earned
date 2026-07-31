# Starter Launchpad Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a private Starter Launchpad card that guides new accounts through core setup.

**Architecture:** Add one pure helper in `src/App.jsx` that computes setup progress from existing private state, then render one compact dashboard card that uses the existing `setView` navigation path. No new persisted data is required.

**Tech Stack:** React, Vite, existing app state, Node verifier scripts, README documentation.

## Global Constraints

- No Supabase schema changes.
- No new dependencies.
- Read only existing private `history`, `goals`, and `customEx`.
- Card disappears once all setup items are complete.
- Navigation buttons must use existing app tabs rather than creating new routes.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-starter-launchpad-app.cjs`

**Interfaces:**
- Consumes: `src/App.jsx`, `README.md`
- Produces: a verifier for this onboarding slice.

- [x] **Step 1: Write the failing verifier**

```js
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(root,"src","App.jsx"),"utf8");
const readme=fs.readFileSync(path.join(root,"README.md"),"utf8");
const requiredApp=[
  "function buildStarterLaunchpad",
  "function StarterLaunchpad",
  "buildStarterLaunchpad(history,goals,customEx)",
  "Starter Launchpad",
  "Setup Score",
  "First Workout",
  "Weekly Goal",
  "Bodyweight Entry",
  "Exercise Notes",
  "Routine Customization",
  "Open Log",
  "Open Goals",
  "Open Library",
  "Open Lifts",
  "starterLaunchpad:true",
  "onNavigate",
  "<StarterLaunchpad history={history} goals={goals} customEx={customEx} onNavigate={onNavigate}/>",
  "onNavigate={setView}",
];
const requiredReadme=[
  "Private Starter Launchpad",
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
console.log("Starter Launchpad verifier passed.");
```

- [x] **Step 2: Run verifier to verify it fails**

Run: `node scripts/verify-starter-launchpad-app.cjs`

Expected: FAIL with missing `buildStarterLaunchpad`.

### Task 2: Helper

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `history`, `goals`, `customEx`, `bodyMetrics`, `exerciseNotes`, `workoutTemplates`
- Produces: `buildStarterLaunchpad(history, goals={}, customEx={})`

- [x] **Step 1: Add helper**

Compute five setup items and a setup score. Return `starterLaunchpad:true`, `score`, `completedCount`, `totalCount`, `items`, and `nextItem`.

- [x] **Step 2: Keep it resilient**

Handle empty histories, missing goals, missing custom data, and older accounts without throwing.

### Task 3: Component And Navigation

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `buildStarterLaunchpad(history, goals, customEx)`
- Produces: `StarterLaunchpad({history, goals, customEx, onNavigate})`

- [x] **Step 1: Add component**

Render setup score, next item, and five setup rows with buttons.

- [x] **Step 2: Hide when complete**

Return `null` when all setup items are complete.

- [x] **Step 3: Wire dashboard**

Add `onNavigate` to `TotalVolumeView`, render the launchpad at the top, and pass `onNavigate={setView}` from `App`.

### Task 4: Documentation And Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-07-12-starter-launchpad.md`

**Interfaces:**
- Consumes: completed app changes.
- Produces: verified build artifact and updated deployment zip.

- [x] **Step 1: Document the feature**

Add a README note that the launchpad is private and requires no Supabase schema changes.

- [x] **Step 2: Run feature verifier**

Run: `node scripts/verify-starter-launchpad-app.cjs`

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
