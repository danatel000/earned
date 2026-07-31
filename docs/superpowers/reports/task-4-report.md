# Task 4 Report: Deterministic Progression and Exercise Swaps

## Status

Complete. Task 4 was implemented in the shared workspace without Git and without modifying unrelated source files.

## TDD Evidence

### RED 1: Missing Task 4 engines

Requested command attempted:

```powershell
pnpm exec vitest run tests/coach/progression.test.js tests/coach/exercise-graph.test.js
```

The Codex runtime did not expose `vitest` or `node` through the child-process PATH, so the first attempt failed before collection and was not accepted as RED. The equivalent local binary was then run with the bundled Node runtime on PATH:

```powershell
$env:PATH='C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;'+$env:PATH
.\node_modules\.bin\vitest.CMD run tests/coach/progression.test.js tests/coach/exercise-graph.test.js
```

Valid RED result: 2 failed suites because `progression.ts` and `exercise-graph.ts` did not exist.

### RED 2: Task 3 MemberContext compatibility

After the first GREEN pass, security/data-integrity review found that Task 3 projects `sessions[].exercises` as an array. A focused test was added before the fix.

Result: 1 failed test; expected one normalized exposure and received none.

### RED 3: Missing RPE is not supporting evidence

A focused safety test was added to ensure two top-range exposures with missing RPE cannot trigger a load increase.

Result: 1 failed test; expected `hold` and received `add_weight`.

### GREEN

```text
Focused progression and graph tests: 2 files passed, 21 tests passed
Full Coach suite: 5 files passed, 48 tests passed
```

## Implementation

- Added deterministic `toProgressionInput`, `buildProgressionState`, and `progressionAction`.
- Added strict graph normalization, hard-constraint swap filtering, deterministic ranking, and `substitutionAction`.
- Added reviewed graph coverage for all 19 pre-task catalog IDs and the new `cb_flat_db` catalog entry.
- Replaced loose same-muscle substitutions and legacy overload decisions in `src/App.jsx` with small adapters that preserve existing UI shapes.
- Kept duration out of progression analysis; no bar-velocity or velocity-loss inference exists.
- Load increases require two valid top-range exposures with explicit RPE at or below 8, respect readiness and quality holds, and are capped at 5%.
- Unknown custom exercises return no automatic swap with `coverage_missing`.
- Source and member-excluded IDs remain hard exclusions; movement pattern, primary muscle overlap, and equipment are never weakened.
- Both Coach action factories emit only deterministic IDs and `requiresConfirmation: true`.

## Commands And Results

```text
.\node_modules\.bin\vitest.CMD run tests/coach/progression.test.js tests/coach/exercise-graph.test.js
PASS: 2 files, 21 tests

.\node_modules\.bin\vitest.CMD run tests/coach
PASS: 5 files, 48 tests

node scripts/verify-progressive-overload-app.cjs
PASS

node scripts/verify-exercise-substitution-coach-app.cjs
PASS

node scripts/verify-next-set-coach-app.cjs
PASS

node scripts/test-monetization-core.mjs
PASS

node scripts/test-recovery-contracts.mjs
PASS

node scripts/verify-monetization-ui.cjs
PASS

pnpm run build
PASS: 682 modules transformed
```

The passing production build above remains the authoritative build evidence. A later redundant build rerun was interrupted before it produced a result; that interruption does not supersede or invalidate the prior completed pass.

## Security And Data Integrity Review

- No credentials, network calls, persistence changes, or new executable model-controlled behavior were introduced.
- Graph JSON is static reviewed product knowledge and contains no member data.
- Malformed/duplicate graph rows are rejected; malformed progression history is ignored rather than converted into prescriptions.
- MemberContext compatibility is covered directly, and only the supplied filtered history is consumed.
- Equipment, movement pattern, muscle overlap, source exclusion, and member exclusions are conjunctive hard constraints.
- Missing RPE cannot be interpreted as acceptable effort evidence.
- Coach actions require explicit confirmation and carry observed values, recommendation values, rule ID, evidence state, and supporting period IDs.

## Filesystem Delta

Compared against the supplied Task 4 baseline:

- Modified `src/App.jsx` (`526168` baseline bytes to `524862` bytes).
- Created `supabase/functions/_shared/coach/progression.ts`.
- Created `supabase/functions/_shared/coach/exercise-graph.ts`.
- Created `knowledge/coach/exercise-equivalence.json`.
- Created `tests/coach/progression.test.js`.
- Created `tests/coach/exercise-graph.test.js`.
- Created `docs/superpowers/reports/task-4-report.md`.

The five new implementation/test/knowledge files were zero-byte absence markers in the baseline. `dist/` was refreshed by the required production build and is ignored by `.gitignore`. Pre-existing concurrent changes to the SDD ledger and Task 3 report were observed and left untouched.

## Concerns

- Vite reports the existing large-chunk warning for bundles over 500 kB; the build succeeds.
- A redundant post-review build rerun was interrupted without producing a result; the prior completed production build remains passing evidence.
- In this Codex runtime, `pnpm exec vitest` cannot resolve the local binary through its child PATH. Tests were run with the same locked local Vitest binary through `node_modules/.bin` and the bundled Node runtime.

## Fix Round 1/5

### Review Findings

Addressed: 8. Open: 0.

- Important 1 addressed: progression evidence now validates period IDs and dates, filters explicit mismatched day keys, sorts deterministically, rejects every duplicated period ID, and requires distinct consecutive same-load exposures before double progression.
- Important 2 addressed: set quality uses the production vocabulary with fail-closed normalization, and every load-increase strategy requires explicit acceptable RPE plus safe quality evidence.
- Important 3 addressed: a load increase is exactly one configured increment when that increment is at most 5% of working weight; otherwise the decision holds with `progression.increment_exceeds_cap`.
- Important 4 addressed: swap queries now enforce member experience, reviewed limitation compatibility, available equipment, source/member exclusions, movement pattern, and primary-muscle overlap. The App passes persisted profile limitations and actual saved exercise exclusions.
- Important 5 addressed: the validated graph is now the App source for reviewed primary muscles, equipment, and skill level across every reviewed catalog ID.
- Important 6 addressed: `substitutionAction` reruns the complete current query and builds the payload from the revalidated graph candidate; arbitrary and stale candidate objects return `null`.
- Minor 1 addressed: the exported progression builder runtime-normalizes malformed inputs and returns an insufficient-evidence hold instead of throwing.
- Minor 2 addressed: hard-negative coverage now includes duplicate/unsorted/day-mismatched evidence, unequal loads, quality aliases, fixed-increment effort, cap boundaries, malformed direct inputs, skill, limitations, production exclusions, graph/App parity, duplicate graph rows, and forged/stale actions.

### RED Evidence

Command:

```powershell
$env:PATH='C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;'+$env:PATH
.\node_modules\.bin\vitest.CMD run tests/coach/progression.test.js tests/coach/exercise-graph.test.js
```

Valid RED result:

```text
2 files failed
16 tests failed, 23 tests passed
```

The failures reproduced all six Important findings: five graph/App/action failures and eleven progression failures. They included forged substitution action creation, missing production exclusions/limitations/experience, above-level swaps, duplicate and stale progression evidence, wrong-day evidence, unequal-load progression, unknown quality, fixed-increment missing effort, off-increment targets, and malformed builder exceptions.

### GREEN And Regression Evidence

```text
Focused Task 4 tests:
PASS - 2 files, 39 tests

Full Coach suite:
PASS - 5 files, 66 tests

node scripts/verify-progressive-overload-app.cjs
PASS

node scripts/verify-exercise-substitution-coach-app.cjs
PASS

node scripts/verify-next-set-coach-app.cjs
PASS

node scripts/test-monetization-core.mjs
PASS

node scripts/test-recovery-contracts.mjs
PASS

node scripts/verify-monetization-ui.cjs
PASS

pnpm run build
PASS - 682 modules transformed in 2.73s
```

The production build retains the existing warning for chunks over 500 kB.

### Fix-Round Security And Data Integrity Review

- Task 4 production progression code does not read duration and contains no velocity terminology.
- Duplicate evidence is rejected rather than selected, preventing conflicting records from authorizing progression.
- Unknown/malformed quality is unsafe, missing effort cannot authorize any load increase, and malformed builder inputs fail closed.
- Swap constraints are conjunctive and are rerun before action creation; none are downgraded to ranking preferences.
- Member exclusions are normalized from both saved ID arrays and Task 3-style exercise exclusion rows.
- All generated Coach actions remain deterministic and require explicit confirmation.
- Graph limitation compatibility is intentionally conservative: current reviewed rows declare no compatible limitations, so a member with any limitation receives no automatic swap until a specific compatibility is reviewed and added.

### Fix-Round Files

- Modified `supabase/functions/_shared/coach/progression.ts`.
- Modified `supabase/functions/_shared/coach/exercise-graph.ts`.
- Modified `knowledge/coach/exercise-equivalence.json`.
- Modified `src/App.jsx`.
- Modified `tests/coach/progression.test.js`.
- Modified `tests/coach/exercise-graph.test.js`.
- Modified `docs/superpowers/reports/task-4-report.md`.

## Fix Round 2 Recovery

### Finding Status

Addressed: 4. Open: 0.

- Ambiguous chronology now fails closed. Undated mixed histories hold with
  `progression.ambiguous_chronology`, and any duplicate period holds with
  `progression.duplicate_period` before either load increases or reductions can be emitted.
- Authenticated bootstrap now reads `coach_settings.settings` and exercise rows from
  `coach_data_exclusions`. The persisted context is passed through `LogForm` into the
  production swap adapter, where experience, equipment, permitted limitations, and exercise
  exclusions become hard query constraints.
- Reviewed catalog profiles derive their displayed group from the graph row's first primary
  muscle and derive their target from that same primary muscle. Executed parity covers every
  normalized graph row, including triceps, multi-muscle pulls, and lower-body compounds.
- Source-regex checks were replaced with executed behavior for catalog classification,
  production adapter constraints, persisted table loading, duplicate chronology, and
  mixed dated/undated chronology.

### Recovery And RED Evidence

The inherited round-2 patch first passed its existing focused suite:

```text
Focused Task 4 recovery baseline:
PASS - 2 files, 43 tests
```

Self-review then found that duplicate misses could still emit `reduce`, graph profiles could
display a secondary muscle group instead of the graph's primary target, and the live App call
did not receive persisted Coach context. Behavioral tests were added before the recovery fix.

```text
Focused RED:
FAIL - 2 files
4 failed, 42 passed, 46 total

Failures:
- duplicate chronology emitted hold_or_reduce.two_misses / reduce
- executed catalog parity displayed biceps where the graph primary target was back
- production substitution adapter was not exported/executable
- persisted Coach settings/exclusion loader did not exist
```

### GREEN And Final Verification

```text
Focused Task 4:
PASS - 2 files, 46 tests

Full Coach:
PASS - 5 files, 73 tests

node scripts/verify-progressive-overload-app.cjs
PASS - Progressive overload app fragments verified.

node scripts/verify-exercise-substitution-coach-app.cjs
PASS - Exercise substitution coach fragments verified.

node scripts/verify-next-set-coach-app.cjs
PASS - Next Set Coach verification passed.

node scripts/test-monetization-core.mjs
PASS - Monetization core behavior verified.

node scripts/test-recovery-contracts.mjs
PASS - Recovery and adaptive-training contracts verified.

node scripts/verify-monetization-ui.cjs
PASS - Monetization pricing and gate UI verified.

pnpm run build
PASS - 683 modules transformed in 1.06s.
```

The first six script attempts in the recovery shell did not execute because `node` was absent
from child-process `PATH`. They were rerun with the bundled Node runtime prepended and all
passed as recorded above. The production build retains the existing warning for chunks larger
than 500 kB.

### Self-Review And Concerns

- No Critical, Important, or Minor Task 4 finding remains open.
- Persisted Coach table loading is intentionally best-effort. If the Release 1 tables are
  unavailable, the App logs a warning and uses local Coach constraints instead of failing the
  complete account bootstrap.
- No Git command was used.

### Recovery-Changed Files

- Modified `supabase/functions/_shared/coach/progression.ts`.
- Modified `src/App.jsx`.
- Modified `tests/coach/progression.test.js`.
- Modified `tests/coach/exercise-graph.test.js`.
- Modified `docs/superpowers/reports/task-4-report.md`.

## Fix Round 3/5

Corrected the production exclusion assertion to inspect the returned substitution shape via
`row.ex.id` instead of the nonexistent `row.id`.

Mutation RED temporarily neutralized persisted exclusion propagation in the production adapter:

```text
Focused Task 4:
FAIL - 1 file failed, 1 file passed
1 failed, 45 passed
Expected substitutions.map(row => row.ex.id) not to contain cb_flat_db, but it did.
```

The original production implementation was restored unchanged.

```text
Focused Task 4:
PASS - 2 files, 46 tests

Full Coach:
PASS - 5 files, 73 tests
```

Permanent round-3 changes are test/report only. No Git command was used.
