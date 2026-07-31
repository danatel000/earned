# Performance Correlation Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a private Performance Correlation Lab panel to the Volume dashboard.

**Architecture:** Keep the feature inside the existing single-file React app pattern. Add one pure analytics helper that turns private workout/readiness/body metric history into signal rows, then render those rows in one dashboard component.

**Tech Stack:** React, Vite, Recharts already present, Node verifier scripts, local README documentation.

## Global Constraints

- No Supabase schema changes.
- No new runtime dependencies.
- Use existing private history, readiness, body metrics, PR, and volume helpers.
- Use signal/context wording rather than claiming medical or causal certainty.
- Keep the card compact and consistent with existing premium analytics panels.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-performance-correlation-lab-app.cjs`

**Interfaces:**
- Consumes: `src/App.jsx`, `README.md`
- Produces: a Node verifier command for this HIU slice.

- [x] **Step 1: Write the failing verifier**

```js
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(root,"src","App.jsx"),"utf8");
const readme=fs.readFileSync(path.join(root,"README.md"),"utf8");
const requiredApp=[
  "function buildPerformanceCorrelations",
  "function PerformanceCorrelationLab",
  "buildPerformanceCorrelations(history,customEx)",
  "Performance Correlation Lab",
  "Readiness Signal",
  "Sleep Impact",
  "Energy Impact",
  "Soreness Drag",
  "Bodyweight Context",
  "Signal Strength",
  "Coach Cue",
  "correlationLab",
  "bodyMetrics(customEx)",
  "getReadinessScore",
];
const requiredReadme=[
  "Private Performance Correlation Lab",
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
console.log("Performance Correlation Lab verifier passed.");
```

- [x] **Step 2: Run verifier to verify it fails**

Run: `node scripts/verify-performance-correlation-lab-app.cjs`

Expected: FAIL with a missing `buildPerformanceCorrelations` fragment.

### Task 2: Helper

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `history`, `customEx`, `bodyMetrics(customEx)`, `getTotalVol`, `getWeekPRCount`, `normalizeReadiness`, `getReadinessScore`
- Produces: `buildPerformanceCorrelations(history, customEx={})`

- [x] **Step 1: Add the helper**

Add a pure function that returns rows for readiness, sleep, energy, soreness, and bodyweight context. It should calculate average volume and PRs for favorable workouts versus baseline workouts, assign a signal strength, and produce a concise coach cue.

- [x] **Step 2: Keep the helper resilient**

Handle empty history, missing readiness, missing bodyweight, and zero-volume weeks without throwing.

### Task 3: UI Panel

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `buildPerformanceCorrelations(history, customEx)`
- Produces: `PerformanceCorrelationLab({history, customEx})`

- [x] **Step 1: Render the panel**

Show the title, subtitle, best signal, `Signal Strength`, `Coach Cue`, and all signal rows.

- [x] **Step 2: Add empty state**

If fewer than two usable workouts exist, show a compact message asking for more logged workouts with readiness check-ins.

- [x] **Step 3: Insert the panel**

Render `<PerformanceCorrelationLab history={history} customEx={customEx}/>` after `<FatigueTrendPanel/>` in `TotalVolumeView`.

### Task 4: Documentation And Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-07-12-performance-correlation-lab.md`

**Interfaces:**
- Consumes: completed app changes.
- Produces: verified build artifact and updated deployment zip.

- [x] **Step 1: Document the feature**

Add a README sentence explaining that the Performance Correlation Lab is private and requires no Supabase schema changes.

- [x] **Step 2: Run the feature verifier**

Run: `node scripts/verify-performance-correlation-lab-app.cjs`

Expected: PASS.

- [x] **Step 3: Run all verifiers**

Run every `scripts/verify-*.cjs` file.

Expected: PASS.

- [x] **Step 4: Run mojibake scan**

Run the project mojibake scan against the touched app, docs, and verifier files.

Expected: no matches.

- [x] **Step 5: Build and zip**

Run: `pnpm run build`

Expected: production build exits 0. Then regenerate `lift-tracker-dist.zip`.
