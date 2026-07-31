# Task 4 Independent Review: Deterministic Progression and Exercise Swaps

## Assessment

**Not approved.** No Critical findings were identified, but Task 4 has Important specification and safety gaps that can produce unsupported load increases and swaps that do not honor all member constraints.

The workspace Task 4 files match the supplied `task-4-current` snapshot after line-ending normalization. The baseline/current App delta is 67 insertions and 105 deletions; the five requested implementation, graph, and test files were absent in the baseline.

## Critical

None.

## Important

### 1. Progression evidence is neither deduplicated nor ordered, so stale or duplicate records can authorize a load increase

**References:** `supabase/functions/_shared/coach/progression.ts:108-113`, `supabase/functions/_shared/coach/progression.ts:163-180`, `supabase/functions/_shared/coach/progression.ts:202-212`, `supabase/functions/_shared/coach/progression.ts:238-248`

`toProgressionInput` preserves caller order, does not use `date` to establish chronology, does not deduplicate `periodId`, and ignores `dayKey`. `buildProgressionState` then treats the last two array elements as two independent consecutive exposures.

Adversarial probes reproduced all of the following:

- Two identical rows with `periodId: "dup"` produced `add_weight`, `well_supported`, and `supportingPeriodIds: ["dup", "dup"]`.
- An array containing a newer failed exposure followed by two older successful exposures produced `add_weight`; the actual latest failed set was ignored.
- Two top-range exposures at different loads (`100` then `155`) produced `add_weight`; `topRangeTwice` does not require a stable working load.
- Two `dayKey: "legs"` sessions containing `cb_incline` were accepted when `dayKey: "chestBack"` was requested.

This violates the requirement for two valid, completed, consecutive supporting exposures and can bypass the latest-set safety hold.

**Required fix:** Canonicalize exposures before decision-making: validate dates/period IDs, filter by requested day where applicable, sort deterministically, deduplicate period IDs, and require two distinct consecutive exposures at the same working load for double progression. Add hard-negative tests for each case.

### 2. Low-quality evidence and the fixed-increment strategy can still increase load

**References:** `supabase/functions/_shared/coach/progression.ts:221-241`, `supabase/functions/_shared/coach/progression.ts:249-256`, `tests/coach/progression.test.js:66`, `tests/coach/progression.test.js:118`

Failed quality is an exact four-string allowlist (`failed`, `missed`, `form_breakdown`, `form breakdown`). A latest set marked `low_quality` produced `add_weight`. Other plausible production values such as `poor`, `incomplete`, or an unknown non-good quality also fail open.

The missing-RPE guard applies only to `topRangeTwice`. With `strategy: "fixed_increment"`, two bottom-range exposures with `rpe: null` produced `add_weight`. This contradicts the implementer report's claim that missing RPE cannot be interpreted as acceptable effort evidence.

**Required fix:** Define and normalize the production set-quality vocabulary, treating failed, poor, unknown, and malformed latest quality conservatively. Apply the same explicit evidence-quality and effort requirements to every strategy that can increase load, including `fixed_increment`.

### 3. The 5% cap creates targets that violate the configured increment

**References:** `supabase/functions/_shared/coach/progression.ts:197-200`, `supabase/functions/_shared/coach/progression.ts:244-256`, `tests/coach/progression.test.js:52`

`cappedIncrease` adds `Math.min(increment, weight * 0.05)` without rounding to a loadable increment. At `155 lb` with a configured `10 lb` increment, the result is `162.75 lb`. This is neither the configured increment nor a normal plate increment.

The existing cap test uses `100 lb` and `10 lb`, where 5% happens to equal exactly `5 lb`, so it cannot detect fractional or off-increment outputs.

**Required fix:** Select a realizable increment that does not exceed 5%, using an explicitly documented rounding policy. If no positive configured increment fits beneath the cap, hold rather than emit an arbitrary fractional load. Add boundary tests above and below exact 5% intersections.

### 4. Swap filtering does not enforce skill, limitations, or production member exclusions

**References:** `supabase/functions/_shared/coach/exercise-graph.ts:32-37`, `supabase/functions/_shared/coach/exercise-graph.ts:114-142`, `src/App.jsx:618-625`, `src/App.jsx:1342-1374`

`findExerciseSwaps` has no inputs for member skill or limitations. Skill equality adds only five ranking points, so a beginner source can return a harder candidate. A probe for beginner `cb_smith` returned intermediate `cb_flat_db` and `cb_incline`.

The App adapter always passes `excludedExerciseIds: []`, and its local Coach profile has no limitations field. Therefore the function-level exclusion test does not prove production exclusion propagation, and Release 1's member limitations cannot constrain swaps at all.

**Required fix:** Extend the query contract with member experience, limitations/safety exclusions, and actual excluded exercise IDs. Reject candidates that exceed allowed skill or lack reviewed compatibility with a supplied limitation. Wire the filtered MemberContext/profile values through the App/server adapter and test the production call shape.

### 5. Graph and App catalog classifications disagree

**References:** `knowledge/coach/exercise-equivalence.json:2-21`, `src/App.jsx:119-140`, `src/App.jsx:495-507`, `tests/coach/exercise-graph.test.js:20-32`

The graph covers all 19 required IDs plus `cb_flat_db`, but catalog classifications are inconsistent:

- `bs_jm` and `bs_overhead` are classified as `biceps` in `EXERCISE_MUSCLES`, while the graph's primary muscle is `triceps`.
- Assisted pull-up rows are `machine` in the graph but inferred as `bodyweight` by `getExerciseProfile`.
- `bs_shpress` is `dumbbell` in the graph but inferred as `barbell`.
- `cb_smith` and `lg_squat` are `machine` in the graph but inferred as `barbell`.
- `bs_overhead` is `cable`/`beginner` in the graph but inferred as `machine`/`intermediate`.
- `bs_jm` is `advanced` in the graph but inferred as `intermediate`; `lg_lunge` has the reverse mismatch.

The only App agreement test is a source-text regex for `cb_flat_db:"chest"`, so it does not compare the actual catalog against normalized graph rows.

**Required fix:** Make the validated graph the catalog classification source of truth or add a full catalog-to-graph consistency validator covering muscle, equipment, and skill for every reviewed ID.

### 6. Substitution action payloads are not runtime-allowlisted

**References:** `supabase/functions/_shared/coach/exercise-graph.ts:145-163`, `supabase/functions/_shared/coach/contracts.ts:113-158`, `tests/coach/exercise-graph.test.js:99-117`, `tests/coach/contracts.test.js:25-37`

Both Task 4 action factories set `requiresConfirmation: true`, and `validateCoachAnswer` correctly rejects a `selectedActionId` absent from the supplied ID allowlist. However, `substitutionAction` accepts any runtime object as `swap` and does not receive or validate the graph or hard constraints. A probe with `{exerciseId: "evil", reason: "unchecked"}` emitted a confirmation-ready substitution payload for that unreviewed ID.

The selected-ID allowlist does not validate the action object's payload. The existing test only passes a swap returned by `findExerciseSwaps`, so it does not exercise the negative boundary.

**Required fix:** Construct substitution actions only from a validated candidate token/result, or revalidate source ID, replacement ID, graph membership, and hard constraints in the action factory. Add a negative test proving arbitrary and stale candidates cannot become actions.

## Minor

### 1. The exported progression builder is not robust to malformed runtime exposure objects

**References:** `supabase/functions/_shared/coach/progression.ts:202-223`

`buildProgressionState` throws when `periodId` is missing (`row.periodId.length`) or `setQuality` is null (`latest.setQuality.some`). `toProgressionInput` safely drops several malformed history forms, so the production App path is partly protected, but the exported builder itself does not fail closed.

**Required fix:** Runtime-normalize `ProgressionInput` or keep the unsafe builder private behind a validating public entry point. Add malformed object, non-finite number, null quality, and invalid rep-array tests.

### 2. Tests do not cover the hard negative production cases

**References:** `tests/coach/progression.test.js:17-231`, `tests/coach/exercise-graph.test.js:20-117`

The tests cover the brief's basic happy paths, one MemberContext projection, simple malformed graph rows, basic equipment/exclusion filtering, and confirmation flags. They do not cover duplicate/unsorted exposures, day filtering, unequal loads, low-quality aliases, fixed-increment missing effort, off-increment caps, malformed direct inputs, skill/limitations, production exclusion wiring, full catalog agreement, duplicate graph rows, or forged action payloads.

The duration test only checks the serialized progression state for two extra ignored fixture properties. Production inspection confirms this specific safety property nevertheless: Task 4 production code does not read duration and contains no `velocity` terminology. Duration is never labeled or treated as velocity.

## Verification

- `vitest run tests/coach/progression.test.js tests/coach/exercise-graph.test.js`: **PASS**, 2 files / 21 tests.
- `vitest run tests/coach`: **PASS**, 5 files / 48 tests.
- `node scripts/verify-progressive-overload-app.cjs`: **PASS**.
- `node scripts/verify-exercise-substitution-coach-app.cjs`: **PASS**.
- `node scripts/verify-next-set-coach-app.cjs`: **PASS**.
- Direct Node 24 TypeScript probes reproduced the unsupported progression and action cases described above.

## Approval Gate

Task 4 should be re-reviewed after all Important findings are fixed and covered by deterministic hard-negative tests. Duration/velocity handling, required graph ID coverage, basic movement/primary-muscle/equipment filtering, custom-exercise `coverage_missing`, confirmation flags, and selected-action ID rejection are approved as implemented.

---

## Fix Round 1 Re-Review Addendum

### Assessment

**Not approved.** Of the eight original findings, **4 are addressed and 4 remain open**. No new finding was identified; the reproduced issues are incomplete fixes for original findings 1, 4, 5, and 8.

The reviewed workspace files match the supplied `task-4-fix1-current` snapshot after line-ending normalization.

### Finding Status

1. **Important 1, progression evidence canonicalization: Open.** Explicit day filtering, date sorting, same-load checks, unique supporting IDs, and the basic duplicate-only case are fixed. However, duplicate rows are removed wholesale at `supabase/functions/_shared/coach/progression.ts:165-176`. Two duplicate copies of the newest failed exposure are therefore discarded, allowing two older successful exposures to produce `add_weight`. Also, accepted undated exposures sort before every dated exposure at `supabase/functions/_shared/coach/progression.ts:172-175`; an actual latest undated failed exposure can be demoted behind older dated successes, again producing `add_weight`. Ambiguous chronology or any duplicated period must prevent progression, or duplicates must be reconciled conservatively rather than erased from an otherwise prescriptive history.

2. **Important 2, all-strategy quality and effort gates: Addressed.** Quality aliases and unknown values fail closed at `supabase/functions/_shared/coach/progression.ts:55-68` and `supabase/functions/_shared/coach/progression.ts:122-141`. Load-increase paths share explicit RPE and quality gates at `supabase/functions/_shared/coach/progression.ts:356-386`. Independent probes confirmed `hold` for missing RPE and `low_quality` across all four strategies.

3. **Important 3, realizable 5% increment policy: Addressed.** `supabase/functions/_shared/coach/progression.ts:331-332` permits exactly one configured increment only when it is at most 5%. Independent probes confirmed `155 + 10` holds with `progression.increment_exceeds_cap`, while `200 + 10` produces exactly `210`.

4. **Important 4, experience/limitations/exclusions production wiring: Open.** The graph engine now enforces experience, reviewed limitations, equipment, movement, muscle, and supplied exclusions conjunctively at `supabase/functions/_shared/coach/exercise-graph.ts:122-150`; direct probes passed. The App query now passes local `coachState` values at `src/App.jsx:635-645`. However, the saved exercise-exclusion and limitation sources are not connected to the Release 1 `CoachSettings`, MemberContext, or `coach_data_exclusions` path. `src/App.jsx:1402-1425` only reads/preserves values already present under local `customEx._coach`; no production caller writes `excludedExerciseIds` or `raw.exclusions`, and the profile UI does not capture limitations. The only test at `tests/coach/exercise-graph.test.js:147-151` checks source-text fragments rather than executing persisted production state. Wire the actual filtered settings/exclusion source into the query and test that end-to-end adapter.

5. **Important 5, full graph/App catalog agreement: Open.** Reviewed equipment, skill, and the new `primaryMuscles` field now come from the graph at `src/App.jsx:506-546`. The displayed target/group still disagrees for reviewed triceps exercises: `inferMuscleGroup` maps any `triceps` primary muscle to the `biceps` group at `src/App.jsx:437-445`, so `bs_jm` and `bs_overhead` remain labeled “Biceps” despite graph primary muscle `triceps`. The old `EXERCISE_MUSCLES` entries at `src/App.jsx:122-140` also remain contradictory, although reviewed rows currently bypass them. The parity test at `tests/coach/exercise-graph.test.js:153-158` checks source substrings, not actual profile outputs for every row. Make displayed group/target graph-consistent and compare executed catalog profiles with every normalized graph row.

6. **Important 6, forged/stale substitution actions: Addressed.** `substitutionAction` reruns the current hard-constraint query and rebuilds from the validated candidate at `supabase/functions/_shared/coach/exercise-graph.ts:164-192`. Independent probes confirmed arbitrary IDs and candidates made stale by exclusions return `null`; valid actions remain deterministic and `requiresConfirmation: true`.

7. **Minor 1, malformed public progression builder: Addressed.** Runtime normalization and `emptyState` at `supabase/functions/_shared/coach/progression.ts:267-313` return an insufficient-evidence hold instead of throwing. Independent malformed-object and non-finite-value probes passed.

8. **Minor 2, hard-negative test quality: Open.** Coverage is substantially improved, but it misses duplicate latest failures alongside older valid evidence and mixed dated/undated chronology. App exclusion/limitation wiring and catalog parity tests remain source-regex checks rather than production-shape execution, allowing findings 4 and 5 to pass. Add behavioral tests for these paths.

### Independent Verification

- Focused Task 4 suite: **PASS**, 2 files / 39 tests.
- Full Coach suite: **PASS**, 5 files / 66 tests.
- Progressive overload, exercise substitution, and next-set legacy verifiers: **PASS**. These verifiers only check source fragments and do not supersede the behavioral findings above.
- Explicit wrong-day evidence is filtered; unequal-load top-range evidence holds.
- Missing effort and low-quality latest sets hold across `double_progression`, `fixed_increment`, `rep_range`, and `hold_or_reduce`.
- Beginner experience returns no above-level swaps; an unreviewed limitation returns no swap.
- Forged and stale substitution actions return `null`; a valid action requires confirmation.
- Task 4 production code still does not consume duration or contain velocity terminology. Duration remains unrelated to and is never labeled as velocity.

### Reproduced Open Cases

```text
duplicate newest failed period + two older successes
=> add_weight, supportingPeriodIds ["old-a", "old-b"]

undated newest failed exposure + two older dated successes
=> add_weight, supportingPeriodIds ["old-a", "old-b"]
```

### Approval Gate

Fix round 1 does not clear Task 4. Re-review after ambiguous/duplicate chronology fails closed, real persisted member constraints reach the production swap query, App target/group classifications agree with the graph, and behavioral tests cover those paths.

---

## Fix Round 2 Final Re-Review Addendum

### Assessment

**Not approved.** Of the four findings open after fix round 1, **3 are addressed and 1 remains open**. Across the original review, 7 of 8 findings are now addressed. No new implementation or safety finding was identified; original Minor finding 8 remains open because one new production-adapter assertion uses the wrong return shape.

The reviewed workspace files match the supplied `task-4-fix2-current` snapshot after line-ending normalization.

### Open-Finding Status

1. **Important 1, progression evidence canonicalization: Addressed.** Duplicate periods are conservatively reconciled and recorded as evidence issues at `supabase/functions/_shared/coach/progression.ts:166-211`. Any duplicate-period issue or mixed dated/undated chronology now precedes all progression/reduction decisions and forces a hold at `supabase/functions/_shared/coach/progression.ts:400-407`. Independent exact probes produced:

```text
duplicate newest failed period + two older successes
=> hold, ruleId progression.duplicate_period,
   supportingPeriodIds ["old-b", "new-failed"]

undated newest failed exposure + two older dated successes
=> hold, ruleId progression.ambiguous_chronology,
   supportingPeriodIds ["old-b", "undated-failed"]
```

2. **Important 4, persisted experience/limitations/exclusions production wiring: Addressed.** `buildExerciseSwapQuery` consumes filtered MemberContext or normalized persisted settings and real exercise-exclusion rows at `supabase/functions/_shared/coach/exercise-graph.ts:133-165`. `src/App.jsx:3551` loads `coach_settings` and `coach_data_exclusions`; the bootstrap stores that context and passes it through `LogForm` to `buildExerciseSubstitutions` at `src/App.jsx:642-656` and `src/App.jsx:7456-7462`. Independent Vite-backed execution confirmed the excluded `cb_flat_db` does not appear in `row.ex.id`, and a supplied unreviewed limitation returns no substitutions.

3. **Important 5, executed full graph/App catalog parity: Addressed.** The App now exposes and executes the actual Earned catalog/profile adapter. `inferMuscleGroup` uses the reviewed first primary muscle at `src/App.jsx:440-445`, including a real `triceps` group. Independent execution compared all 20 normalized graph rows against App profiles for ID coverage, primary muscles, displayed group/target, equipment, and skill; failures were empty. `bs_jm` and `bs_overhead` display as Triceps.

4. **Minor 2, hard-negative test quality: Open.** Chronology and full catalog parity tests now execute production behavior, and the persisted loader/query tests are substantive. However, the App-level persisted exclusion assertion at `tests/coach/exercise-graph.test.js:262` checks `substitutions.map((row) => row.id)`. The legacy adapter's production return shape stores the exercise ID at `row.ex.id`, so every mapped value is `undefined`; the assertion passes even if `cb_flat_db` is incorrectly returned. The independent probe used `row.ex.id` and confirmed current implementation behavior is correct, but the committed test is not valid regression protection.

**Required fix:** Change the assertion to inspect the production shape, for example `substitutions.map((row) => row.ex.id)`, and verify the test fails if exclusion propagation is removed.

### Previously Closed Findings

- Quality normalization and explicit effort gates remain closed: missing RPE and `low_quality` held in independent probes.
- Realizable increment policy remains closed: `155 + 10` held and exact-cap `200 + 10` produced `210`.
- Forged/stale action rejection remains closed: both returned `null`; a valid action remained deterministic and required confirmation.
- Malformed public progression input remained fail-closed with `progression.malformed_input` and insufficient evidence.
- Experience, limitation, movement, primary-muscle, equipment, source, and exclusion constraints remain conjunctive.
- Duration remains unrelated to progression evidence and is never labeled or treated as velocity. Task 4 production modules contain no duration/velocity inference.

### Independent Verification

- Focused Task 4 suite: **PASS**, 2 files / 46 tests.
- Full Coach suite: **PASS**, 5 files / 73 tests.
- Progressive overload, exercise substitution, and next-set legacy verifiers: **PASS**.
- Exact duplicate-newest-failure probe: **PASS**, conservative hold.
- Exact undated-newest-failure probe: **PASS**, ambiguous-chronology hold.
- Persisted settings/exclusions loader and production App adapter probe: **PASS**.
- Executed full graph/catalog parity probe: **PASS**, 20 graph rows / 20 catalog rows / 0 failures.
- Correct-shape App exclusion probe: **PASS**, returned IDs `cb_pecdeck`, `cb_smith`; excluded `cb_flat_db` absent.

### Final Approval Gate

Fix round 2 clears all implementation, data-quality, and safety findings, but Task 4 is not finally approved until the vacuous persisted-exclusion integration assertion is corrected and its red/green behavior is demonstrated. No implementation change is required for the reproduced behavior.

---

## Fix Round 3 Final Approval Addendum

### Assessment

**Approved.** The sole finding open after fix round 2 is addressed. **Addressed: 1. Open: 0.** Across the original review, all 8 findings are addressed. No new findings were identified.

The workspace matches the supplied `task-4-fix3-current` snapshot after line-ending normalization. The only fix-2-to-fix-3 snapshot changes are `tests/coach/exercise-graph.test.js` and `docs/superpowers/reports/task-4-report.md`; production implementation is unchanged.

### Final Finding

**Minor 2, hard-negative test quality: Addressed.** The persisted-exclusion production-adapter assertion now inspects the real legacy return shape at `tests/coach/exercise-graph.test.js:262`:

```js
substitutions.map((row) => row.ex.id)
```

The mutation RED evidence is credible. The implementer temporarily neutralized persisted exclusion propagation and reported one focused failure with 45 passing tests because `cb_flat_db` appeared in that exact mapped list. Independent mutation-sensitivity execution, without modifying files, confirmed:

```text
without persisted exclusion: cb_flat_db, cb_pecdeck, cb_smith
with persisted exclusion:    cb_pecdeck, cb_smith
would mutation fail:         true
```

The restored test therefore exercises the production shape and would detect the claimed regression.

### Regression Verification

- Focused Task 4 suite: **PASS**, 2 files / 46 tests.
- Full Coach suite: **PASS**, 5 files / 73 tests.
- Duplicate newest failure: **hold**, `progression.duplicate_period`.
- Undated newest failure: **hold**, `progression.ambiguous_chronology`.
- Executed graph/App catalog parity: **PASS**, 20 graph rows / 20 catalog rows / 0 failures.
- Persisted constraint adapter: excluded exercise absent; unreviewed limitation returns no swap.
- Fixed-increment missing RPE: **hold**.
- Latest low-quality set: **hold**.
- Configured increment above 5%: **hold**.
- Malformed public progression input: fail-closed `progression.malformed_input`.
- Forged and stale substitution actions: `null`.
- Valid substitution action: `requiresConfirmation: true`.
- Duration remains unrelated to progression and is never labeled or treated as velocity.

### Final Decision

Task 4 is approved for Earned NVIDIA Coach Release 1. No Critical, Important, or Minor finding remains open.
