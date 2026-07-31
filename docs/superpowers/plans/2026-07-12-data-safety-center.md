# Data Safety Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the history-only export/import card with a full private account backup center.

**Architecture:** Add two pure helpers in `src/App.jsx`: `buildDataSafetySnapshot(history, goals, customEx)` for summary/export shape and `parseLiftTrackerBackup(parsed, currentGoals, currentCustomEx)` for full and legacy imports. Add a `DataSafetyCenter` component in the Goals tab and route imports through `handleImport`.

**Tech Stack:** React, Vite, browser Blob/FileReader APIs, Node verifier scripts, local README documentation.

## Global Constraints

- No Supabase schema changes.
- No new runtime dependencies.
- Export only private app data already stored in `history`, `goals`, and `customEx`.
- Preserve legacy history-only import support.
- Import confirmation must clearly warn that current account data will be replaced.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-data-safety-center-app.cjs`

**Interfaces:**
- Consumes: `src/App.jsx`, `README.md`
- Produces: a verifier for the Data Safety Center slice.

- [x] **Step 1: Write the failing verifier**

```js
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(root,"src","App.jsx"),"utf8");
const readme=fs.readFileSync(path.join(root,"README.md"),"utf8");
const requiredApp=[
  "function buildDataSafetySnapshot",
  "function parseLiftTrackerBackup",
  "function DataSafetyCenter",
  "Data Safety Center",
  "Backup Health",
  "Full Account Backup",
  "Export Full Backup",
  "Import Full Backup",
  "Saved Goals",
  "Custom Routine Data",
  "lift_tracker_full_backup",
  "onImport({history:parsed.history,goals:parsed.goals,customEx:parsed.customEx})",
  "<DataSafetyCenter history={history} goals={goals} customEx={customEx} onImport={handleImport}/>",
];
const requiredReadme=[
  "Private Data Safety Center",
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
console.log("Data Safety Center verifier passed.");
```

- [x] **Step 2: Run verifier to verify it fails**

Run: `node scripts/verify-data-safety-center-app.cjs`

Expected: FAIL with a missing `buildDataSafetySnapshot` fragment.

### Task 2: Helpers

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `history`, `goals`, `customEx`
- Produces: `buildDataSafetySnapshot(history, goals, customEx={})` and `parseLiftTrackerBackup(parsed, currentGoals={}, currentCustomEx={})`

- [x] **Step 1: Add snapshot helper**

Return a stable full backup object with `version`, `kind`, `exportedAt`, `summary`, `history`, `goals`, and `customEx`.

- [x] **Step 2: Add parser helper**

Support full backups, `{history}` legacy exports, and array legacy exports. Preserve current goals/customEx for legacy history-only imports.

### Task 3: Component And Import Flow

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `buildDataSafetySnapshot`, `parseLiftTrackerBackup`, `onImport`
- Produces: `DataSafetyCenter({history, goals, customEx, onImport})`

- [x] **Step 1: Replace history-only card**

Render Data Safety Center in the Goals tab instead of `ExportImport`.

- [x] **Step 2: Export full backup**

Download `lifttracker-full-backup-YYYY-MM-DD.json` with the new backup shape.

- [x] **Step 3: Import full and legacy backups**

Read JSON, parse it, show a confirm dialog with restore counts, then call `onImport({history:parsed.history,goals:parsed.goals,customEx:parsed.customEx})`.

- [x] **Step 4: Update `handleImport`**

Accept either an array of history entries or a full `{history, goals, customEx}` payload, then save all three through `saveAll`.

### Task 4: Documentation And Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-07-12-data-safety-center.md`

**Interfaces:**
- Consumes: completed app changes.
- Produces: verified build artifact and updated deployment zip.

- [x] **Step 1: Document the feature**

Add a README note that the Data Safety Center is private, exports account data, supports restore, and needs no Supabase schema changes.

- [x] **Step 2: Run feature verifier**

Run: `node scripts/verify-data-safety-center-app.cjs`

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
