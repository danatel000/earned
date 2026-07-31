# Daily And Weekly Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an account-scoped Weekly/Daily tracking choice that supports immediate daily workout saves and cadence-aware progress without rewriting existing Earned history.

**Architecture:** Keep `history` as the canonical mixed timeline and add pure selectors that derive daily sessions or weekly rollups. Persist `preferences.trackingMode` inside the existing JSON data object, feed the selected derived history to private progress screens, and always feed weekly-derived history to calendar-week goals and public rankings.

**Tech Stack:** React 19, Vite, JavaScript ES modules, Recharts, Supabase JSON persistence, Node assertion verifiers.

## Global Constraints

- Existing history records must never be rewritten merely because the user switches tracking modes.
- Missing or invalid tracking preferences must default to `weekly`.
- Daily saves contain only the selected workout section and do not count untouched sections as skipped.
- Skipped exercises preserve their previous input values and contribute zero saved volume.
- Weekly goals and public rankings remain calendar-week concepts and update from daily sessions through weekly aggregation.
- No Supabase schema migration or new dependency is allowed.
- Existing Free/Premium entitlements and founding-account behavior must remain unchanged.
- The workspace is not recognized as a Git repository, so verification checkpoints replace commit steps.

---

### Task 1: Pure Tracking Period Model

**Files:**
- Create: `src/tracking/trackingPeriods.js`
- Create: `scripts/test-tracking-periods.mjs`

**Interfaces:**
- Produces: `TRACKING_MODES`, `normalizeTrackingMode(value)`, `buildDailyHistory(history, exerciseDayMap, dayOrder)`, `buildWeeklyHistory(history)`, `buildTrackingHistory(history, mode, exerciseDayMap, dayOrder)`, `getEntryPeriodLabel(entry, index, options)`, `getEntryShortLabel(entry, index)`, `calculateDailyStreak(history)`, `combineHistoryEntries(entries, metadata)`.

- [ ] **Step 1: Write the failing pure-model verifier**

Create assertions covering:

```js
assert.equal(normalizeTrackingMode("daily"), "daily");
assert.equal(normalizeTrackingMode("invalid"), "weekly");

const legacy = [{week:1,date:"2026-07-01",exercises:{curl:{volume:100,w:10,r:10,s:1},bench:{volume:200,w:20,r:10,s:1}}}];
assert.deepEqual(
  buildDailyHistory(legacy,{curl:"arms",bench:"chest"},["arms","chest"]).map(row=>row.dayKey),
  ["arms","chest"],
);

const daily = [
  {periodType:"day",dayKey:"arms",date:"2026-07-06",exercises:{curl:{volume:100,w:10,r:10,s:1}}},
  {periodType:"day",dayKey:"arms",date:"2026-07-08",exercises:{curl:{volume:180,w:15,r:12,s:1}}},
];
const weekly = buildWeeklyHistory(daily);
assert.equal(weekly.length,1);
assert.equal(weekly[0].exercises.curl.volume,280);
assert.equal(weekly[0].exercises.curl.w,15);
assert.deepEqual(weekly[0].sourceIndexes,[0,1]);
```

- [ ] **Step 2: Run it and observe the missing-module failure**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'scripts\test-tracking-periods.mjs'
```

Expected: failure because `src/tracking/trackingPeriods.js` does not exist.

- [ ] **Step 3: Implement normalization and deterministic period helpers**

The module must:

```js
export const TRACKING_MODES=Object.freeze({WEEKLY:"weekly",DAILY:"daily"});

export function normalizeTrackingMode(value){
  return value===TRACKING_MODES.DAILY?TRACKING_MODES.DAILY:TRACKING_MODES.WEEKLY;
}
```

Use UTC-safe `YYYY-MM-DD` parsing and Monday week starts. Invalid dates receive a stable `undated-<sourceIndex>` grouping key.

- [ ] **Step 4: Implement legacy splitting and daily passthrough**

Each output row must include `periodType:"day"`, `dayKey`, `sourceIndex`, `sourceIndexes`, `sourcePeriodType`, `derived`, `periodNumber`, and filtered exercises. Daily source records pass through without changing their saved exercise object.

- [ ] **Step 5: Implement weekly aggregation**

For duplicate exercises, sum `volume`, sum `s`, concatenate `setDetails`, retain the strongest weight and estimated-one-rep-max performance, and average optional session metrics. Weekly source records remain standalone; adjacent daily records group by Monday calendar week.

- [ ] **Step 6: Run the pure-model verifier**

Expected: `Tracking period model tests passed.`

---

### Task 2: Persistence And App Integration Contract

**Files:**
- Create: `scripts/verify-tracking-mode-app.cjs`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: tracking-period exports from Task 1.
- Produces: app state `preferences`, `trackingMode`, `dailyHistory`, `weeklyHistory`, and `progressHistory`; persistence functions accepting preferences.

- [ ] **Step 1: Write the failing source integration verifier**

Require source fragments proving:

```js
"const [preferences,setPreferences]"
"normalizeTrackingMode(preferences?.trackingMode)"
"data:{history:nextHistory,goals:nextGoals,customEx:nextCustomEx,preferences:nextPreferences}"
"preferences:normalizePreferences(parsed.preferences)"
"const dailyHistory=buildTrackingHistory(history,TRACKING_MODES.DAILY"
"const weeklyHistory=buildTrackingHistory(history,TRACKING_MODES.WEEKLY"
"const progressHistory=trackingMode===TRACKING_MODES.DAILY?dailyHistory:weeklyHistory"
```

- [ ] **Step 2: Run it and observe failure for missing preference wiring**

Run the verifier with bundled Node and confirm it fails for the first absent fragment.

- [ ] **Step 3: Add mode imports and preference normalization**

Add:

```js
function normalizePreferences(raw={}){
  return {...raw,trackingMode:normalizeTrackingMode(raw?.trackingMode)};
}
```

Every load path returns normalized preferences. Fresh accounts use `{trackingMode:"weekly"}`.

- [ ] **Step 4: Extend persistence without changing Supabase schema**

Change `saveCloudData` and `saveAll` to include preferences in the JSON `data` payload and local consolidated record. Existing three-argument `saveAll` callers retain the current preference through a default fourth argument.

- [ ] **Step 5: Create memoized derived histories**

Build an exercise-ID-to-day map from the current routine and derive:

```js
const dailyHistory=useMemo(
  ()=>buildTrackingHistory(history,TRACKING_MODES.DAILY,exerciseDayMap,DAY_KEYS),
  [history,exerciseDayMap],
);
const weeklyHistory=useMemo(
  ()=>buildTrackingHistory(history,TRACKING_MODES.WEEKLY,exerciseDayMap,DAY_KEYS),
  [history,exerciseDayMap],
);
const progressHistory=trackingMode===TRACKING_MODES.DAILY?dailyHistory:weeklyHistory;
```

- [ ] **Step 6: Run the integration verifier and pure-model tests**

Both must pass before changing logging behavior.

---

### Task 3: Tracking Mode Control And Daily Save Flow

**Files:**
- Modify: `src/App.jsx`
- Modify: `scripts/verify-tracking-mode-app.cjs`

**Interfaces:**
- Produces: `TrackingModeControl`, `handleTrackingModeChange(mode)`, mode-aware `LogForm`, and `handleNewPeriod(payload)`.

- [ ] **Step 1: Extend the failing verifier**

Assert the app contains a two-option segmented control, a mode-change persistence handler, daily save copy, `periodType`, `dayKey`, and daily exercise collection limited to `activeDay`.

- [ ] **Step 2: Run and confirm failure for the missing UI/control**

- [ ] **Step 3: Add the header segmented control**

Use two compact buttons labeled `Weekly` and `Daily`. The active button uses the app's green accent and `aria-pressed`. Supporting copy explains `3 sections per save` or `1 workout per save` without creating a new page.

- [ ] **Step 4: Persist mode changes**

`handleTrackingModeChange` normalizes the value and calls `saveAll(history,goals,customEx,nextPreferences)`. It does not modify history or clear drafts.

- [ ] **Step 5: Make `LogForm` mode-aware**

Weekly mode retains the current completion guard and all-three-sections requirement. Daily mode validates only `activeDay`, collects only that section's logged exercises, and calls `onSubmit` with:

```js
{
  exercises,
  notes,
  rating,
  rpe,
  deload,
  readiness,
  periodType:"day",
  dayKey:activeDay,
}
```

Weekly mode sends `periodType:"week"`. Save buttons and status copy reflect the selected mode.

- [ ] **Step 6: Save canonical records safely**

Replace `handleNewWeek` with a payload-based handler that appends a record containing a stable `periodId`, normalized metadata, and internal sequence ordinal. PR celebration compares against the selected progress cadence, not against unrelated raw records.

- [ ] **Step 7: Verify focused behavior**

Run both new verifiers. Confirm existing section Skip & Save verifier still passes.

---

### Task 4: Cadence-Aware Dashboard, Analytics, Radar, And Labels

**Files:**
- Modify: `src/App.jsx`
- Modify: `scripts/verify-tracking-mode-app.cjs`

**Interfaces:**
- Consumes: `progressHistory`, `weeklyHistory`, `trackingMode`.
- Produces: mode-aware summary, charts, streaks, quality/fatigue copy, and radar windows.

- [ ] **Step 1: Add failing assertions for cadence-aware views**

Require `progressHistory` in Summary, Volume, Lifts, PRs, Library recommendations, and private History; require `weeklyHistory` for community, challenges, schedule, weekly goal forecast, and public sync; require daily radar week-to-date aggregation.

- [ ] **Step 2: Run and confirm the focused verifier fails**

- [ ] **Step 3: Centralize entry labels**

Replace user-facing hardcoded period labels in charts, recent exercise history, PR timeline, recap, and History with `getEntryPeriodLabel` or `getEntryShortLabel`. Keep explicit calendar-week features labeled Weekly.

- [ ] **Step 4: Add daily streak behavior**

Make `calcStreak` detect daily entries and call `calculateDailyStreak`; retain the existing weekly algorithm otherwise. Header units become `day`/`d` or `week`/`wk`.

- [ ] **Step 5: Curate the summary strip**

Daily mode shows latest session volume, consecutive-day streak, best session, and current calendar-week volume/goal. Weekly mode keeps current summary semantics.

- [ ] **Step 6: Curate Muscle Balance Radar**

In Daily mode, combine the current calendar week's daily rows for Current and the preceding calendar week's rows for Baseline. Goal values continue to use the user's enabled exercise goals with current values as fallback. Explain the rolling week-to-date window under the chart.

- [ ] **Step 7: Feed each feature the correct cadence**

Use `progressHistory` for private per-period progression and `weeklyHistory` for inherently weekly features. Update visible headings such as `Session Training Quality`, `Session Volume`, and `Day N` when daily mode is active.

- [ ] **Step 8: Run focused and full verifier suites**

Correct regressions before moving to history editing.

---

### Task 5: History Editing, Backup, Restore, And Public Sharing

**Files:**
- Modify: `src/App.jsx`
- Modify: `README.md`
- Modify: `scripts/verify-tracking-mode-app.cjs`

**Interfaces:**
- Produces: source-aware History actions and preference-complete backup/restore.

- [ ] **Step 1: Add failing assertions for safety boundaries**

Require `sourceIndex`, `sourceIndexes`, derived aggregate read-only handling, preferences in backup export/import, and weekly-derived public synchronization.

- [ ] **Step 2: Run and confirm failure**

- [ ] **Step 3: Make History source-aware**

Pass canonical indexes through derived rows. A single-source row can edit/delete its canonical record. A weekly aggregate built from multiple daily records shows `Switch to Daily to edit sessions` and disables aggregate edit/delete actions.

- [ ] **Step 4: Make the editor cadence-aware**

Daily canonical entries expose only their saved `dayKey`; weekly entries retain the three-section editor. Save preserves `periodType`, `dayKey`, `periodId`, and original canonical index.

- [ ] **Step 5: Extend backup and restore**

Export `preferences`. Normalize older backups to Weekly and accept both legacy history-only files and the current complete account format. Restore confirmation uses generic `workouts` rather than assuming every row is a week.

- [ ] **Step 6: Keep public sharing weekly**

Call `syncPublicWorkoutPosts` with weekly-derived history from every sharing path and render personal/public weekly competitions from `weeklyHistory`.

- [ ] **Step 7: Document the feature**

Add a README section explaining account-scoped mode choice, non-destructive switching, daily save behavior, weekly rollups, and no-schema-change persistence.

- [ ] **Step 8: Run all focused verifiers**

Expected: period tests, tracking-mode verifier, backup verifier, public-sharing verifier, and section-skip verifier all pass.

---

### Task 6: Full Regression, Build, And Browser Smoke Test

**Files:**
- Modify only if verification reveals a defect.

**Interfaces:**
- Produces: verified production build and persistent local preview URL.

- [ ] **Step 1: Run every feature verifier**

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'scripts\run-verifiers.cjs'
```

Expected: all feature verifiers pass with zero failures.

- [ ] **Step 2: Run monetization and tracking pure tests**

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'scripts\test-monetization-core.mjs'
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'scripts\test-tracking-periods.mjs'
```

- [ ] **Step 3: Build production assets**

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'node_modules\vite\bin\vite.js' build
```

Expected: exit code 0. Existing bundle-size warnings are acceptable; compile errors are not.

- [ ] **Step 4: Start a persistent local preview on a free port**

Launch `local-test-server.cjs` with bundled Node through `Start-Process`, redirect logs to port-specific files, and verify the URL returns HTTP 200 after the launching shell exits.

- [ ] **Step 5: Browser smoke test**

Verify:

1. Weekly mode opens with all existing data and current three-section Log flow.
2. Switching to Daily changes labels without changing history count in storage.
3. Daily Log saves only the selected section.
4. Daily History shows the new session and legacy split rows.
5. Weekly mode rolls the saved daily session into the correct calendar week.
6. Mode preference survives reload and remains account-scoped.
7. No overlapping controls, clipped labels, console exceptions, or failed network requests appear at desktop and narrow mobile widths.

- [ ] **Step 6: Final requirements audit**

Re-read the design, map every requirement to passing evidence, and report any limitation explicitly before calling the work complete.
