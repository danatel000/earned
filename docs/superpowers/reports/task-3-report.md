# Task 3 Report: Private Data Adapter and Provenance

## Status

Implemented `buildMemberContext`, `buildSessionRef`, and `filterExcludedData` with:

- a versioned, allowlisted member context
- latest-12 generation and latest-52 analytics limits after exclusions
- exact session, inclusive date-range, exercise, and data-category exclusions
- independent workout, goal, readiness, note, and limitation permission gates
- stable legacy session IDs and exact zero-based set provenance
- missing readiness represented as `null` and reported in `missingData`

## TDD Evidence

### RED 1: Adapter Missing

Command:

```powershell
$env:PATH='C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
pnpm exec vitest run tests/coach/member-context.test.js
```

Result: exit 1. Vitest loaded the test file and failed because
`supabase/functions/_shared/coach/member-context.ts` did not exist.

An earlier sandboxed preflight did not count as RED because the runner itself could
not start (`vitest` was not resolved, then Node received `EPERM` through pnpm
junctions). The valid RED above was rerun outside that filesystem restriction.

### GREEN 1: Brief Contract

Same focused command.

Result: exit 0, 1 file passed, 7 tests passed.

### RED 2: Permission Boundary Review

Added focused tests for current draft readiness/notes and profile limitations.

Result: exit 1, 7 passed and 2 failed. Historical readiness incorrectly won over
current draft readiness, permitted draft notes were absent, and limitations remained
visible while their permission was false.

### GREEN 2: Permission Boundary Review

Same focused command.

Result: exit 0, 1 file passed, 9 tests passed.

## Verification

```powershell
pnpm exec vitest run tests/coach
```

Result: exit 0, 3 files passed, 15 tests passed.

```powershell
pnpm run build
```

Result: exit 0, 679 modules transformed. Vite emitted non-blocking plugin timing and
chunk-size warnings.

The pre-task snapshot contained zero-byte placeholders for both Task 3 files. At the
start of this execution, the shared workspace already contained the seven-test
`tests/coach/member-context.test.js`, while the adapter was absent. The shared
workspace now contains the adapter and two additional permission-boundary tests. No
Git commands were used.

## Privacy and Security Review

- Input is projected through allowlists; `customEx`, preferences, usernames, email,
  posts, comments, password data, billing state, and unrelated storage keys are not
  copied.
- Session/date/exercise/workout exclusions run before analytics and generation
  slicing. Exercise exclusions also apply to the active draft.
- Notes, readiness, goals, workouts, and profile limitations have explicit gates.
- Missing readiness remains `null`; no default or low score is synthesized.
- Legacy IDs use the original history index before filtering.
- Set provenance includes only concrete set rows and carries `periodId`,
  `exerciseId`, and zero-based `setIndex`.

## Changed Files

- `tests/coach/member-context.test.js`
- `supabase/functions/_shared/coach/member-context.ts`
- `docs/superpowers/reports/task-3-report.md`

## Concerns

- This repository has no dedicated TypeScript compiler check for the Supabase shared
  module. Vitest transforms and executes the TypeScript adapter, and the application
  build passes, but the Vite client build does not import this server-side file.
- Vitest required execution outside the filesystem sandbox because Node could not
  read pnpm's junctioned dependency files inside the sandbox.

## Fix Round 1 of 5

### Review Findings Addressed

1. `filterExcludedData.analyticsSessions` is now an explicit deeply detached
   allowlisted projection. Notes and readiness are removed at this boundary when
   denied, arbitrary session/exercise keys are stripped, and output mutation does
   not mutate `appData`.
2. Draft projection now consumes Earned's persisted
   `draft.inputs[activeDay][exerciseId]` shape, includes only active-day workout
   cells, projects set quality/skipped state, and applies workout, note, readiness,
   and exercise gates. The old flat `draft.exercises` shape remains a compatibility
   fallback but is normalized into the real active-day `inputs` output.
3. Valid set rows retain an allowlisted source `setIndex` in analytics data.
   Malformed/non-supporting rows are skipped, while final provenance keeps the
   original zero-based `setDetails` index.
4. Readiness accepts only finite numeric values in the inclusive 1–5 domain.
   Booleans, numeric strings, infinities, and out-of-domain values fail closed to
   `null`; numeric strings remain accepted only for persisted workout cells.
5. The model-facing profile is explicitly projected to `primaryGoal`,
   `experience`, `daysPerWeek`, `equipment`, and `limitations`. Both arrays are
   cloned, unexpected runtime keys are stripped, and limitations remain gated.

Minor boundary coverage now includes workout/note categories, filtered-output PII,
source non-mutation, exclusions at the 52/12 slice boundaries, real draft inputs,
malformed set rows, malformed readiness, empty exercise IDs, duplicate session IDs,
and malformed date-range selectors.

### Fail-Closed Decisions

- Duplicate modern session IDs retain the first source record and discard later
  ambiguous records so provenance IDs remain unique and deterministic.
- Empty exercise IDs are omitted.
- A malformed date-range selector suppresses workout history and draft context
  rather than risking disclosure outside the intended private range.
- Malformed legacy dates use `unknown` in the required legacy provenance ID and
  expose no invalid date value.

### TDD Evidence

Focused RED command:

```powershell
$env:PATH='C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
pnpm exec vitest run tests/coach/member-context.test.js
```

Result: exit 1, 10 failed and 11 passed. Failures reproduced analytics PII/reference
leakage, missing persisted draft inputs, shifted set provenance, unsafe readiness
coercion, profile leakage/aliasing, denied notes in analytics, and ambiguous IDs.

Focused GREEN result: exit 0, 1 file passed, 21 tests passed.

Regression command:

```powershell
pnpm exec vitest run tests/coach
```

Result: exit 0, 3 files passed, 27 tests passed.

Build command:

```powershell
pnpm run build
```

Result: exit 0, 679 modules transformed. Vite emitted only its non-blocking
chunk-size warning.

### Privacy and Security Self-Review

- No raw session, exercise, set, draft, or profile object is returned by reference.
- Analytics, final context, draft, readiness, goals, and profile all use explicit
  projection paths; arbitrary PII is not spread into exported model inputs.
- Category and permission checks happen before analytics/generation use.
- Exclusions happen before both session limits and preserve source ordering.
- Exact set provenance is emitted only for valid supporting set rows.
- Safety-sensitive readiness never uses generic JavaScript coercion.

### Fix-Round Changed Files

- `tests/coach/member-context.test.js`
- `supabase/functions/_shared/coach/member-context.ts`
- `docs/superpowers/reports/task-3-report.md`

No Git commands were used and no unrelated source files were changed.
