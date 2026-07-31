# Task 1 Implementation Report

Status: DONE

## Files changed

- `.gitignore`
- `package.json`
- `pnpm-lock.yaml`
- `src/monetization/plans.js`
- `supabase/functions/_shared/coach/contracts.ts`
- `supabase/functions/_shared/coach/settings.ts`
- `tests/coach/contracts.test.js`
- `tests/coach/entitlement.test.js`
- `tests/coach/fixtures.js`
- `docs/superpowers/reports/task-1-report.md`

## TDD RED evidence

Tests were written before the production contract modules and AI Coach entitlement registration.

Command:

```powershell
$env:Path='C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;'+$env:Path; & 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd' test:coach
```

Result: exit code 1, as expected before implementation.

- `tests/coach/contracts.test.js` failed with `Cannot find module '../../supabase/functions/_shared/coach/contracts.ts'` at the import on line 2.
- `tests/coach/entitlement.test.js > registers AI Coach as a premium feature` failed because `FEATURE_IDS.AI_COACH` was `undefined` rather than `"ai_coach"`.
- Vitest also discovered archived empty baseline files under `.superpowers/sdd/2026-07-27-earned-nvidia-coach-release-1/task-1-baseline/tests/coach/`, producing unrelated `No test suite found` failures. This is separate from the intended RED failures.

## TDD GREEN evidence

Command:

```powershell
$env:Path='C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;'+$env:Path; & 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd' exec vitest run tests/coach/contracts.test.js tests/coach/entitlement.test.js
```

Result: all six new Task 1 tests passed.

```text
Test Files  2 failed | 2 passed (4)
Tests  6 passed (6)
```

The two failures were the archived, empty `.superpowers` baseline files described above. The implemented contract and entitlement test files both passed.

## Implementation summary

- Installed Vitest, Testing Library React, Testing Library user-event, and jsdom. Added the four required coach scripts and coach-specific ignore rules.
- Added versioned Coach request, answer, action, mode, and evidence contracts. Runtime validators reject unknown request actions, blank or oversized ask messages, invalid modes, non-object payloads, unknown answer execution keys, invalid HTTP URLs, unresolved citation/provenance references, and action IDs outside the supplied allowlist.
- Added the exact conservative Coach settings defaults and a defensive normalizer for partial or malformed settings.
- Added reusable contract-valid fixture factories for later Coach tasks.
- Registered `FEATURE_IDS.AI_COACH` as `"ai_coach"` and included it in premium features without changing `MONETIZATION_MODES` or preview behavior.

## Self-review findings and corrections

- The first draft of the invalid-URL test had a closing-brace syntax error. The premature implementation was removed, the test syntax was fixed, and the corrected RED run was captured before restoring implementation.
- A temporary Vitest package configuration experiment was removed because it did not change Vitest discovery and was not part of the required harness contract.
- No Git commands were run and no commit was created because Git metadata is unavailable.

## Concerns and remaining risks

- The archived-baseline discovery issue recorded above was resolved externally when the controller moved those files out of the project tree. The exact required `test:coach` script now passes without an exclusion or configuration change.
- `pnpm add` regenerated the permitted lockfile and refreshed the resolved `recharts` package from 3.10.0 to 3.10.1 because the existing dependency uses `"latest"`; no application source behavior was changed.

## Final required verification

The controller moved the archived baseline files out of the project tree. The exact required command was rerun without code or configuration changes.

Command:

```powershell
$env:Path='C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;'+$env:Path; & 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd' test:coach
```

Pristine result:

```text

 RUN  v4.1.10 C:/Users/danat/Documents/LIft Tracker


 Test Files  2 passed (2)
      Tests  6 passed (6)
   Start at  16:40:02
   Duration  1.20s (transform 287ms, setup 0ms, import 670ms, tests 18ms, environment 0ms)

$ vitest run tests/coach
```

## Fix round 1

Changed files:

- `pnpm-lock.yaml`
- `docs/superpowers/reports/task-1-report.md`

The production dependency ranges in `package.json` remain `latest`, exactly as before this fix. The lockfile importer and all affected peer-resolution snapshots now match the baseline production graph while retaining the Task 1 test-harness dependencies and transitive entries.

Resolved production versions:

- `@vitejs/plugin-react`: `6.0.4` -> `6.0.3`
- `react`: `19.2.8` -> `19.2.7`
- `react-dom`: `19.2.8` -> `19.2.7`
- `recharts`: `3.10.1` -> `3.9.2`

The frozen install synchronized `node_modules` to the restored lockfile and reported:

```text
dependencies:
- @vitejs/plugin-react 6.0.4
+ @vitejs/plugin-react 6.0.3
- react 19.2.8
+ react 19.2.7
- react-dom 19.2.8
+ react-dom 19.2.7
- recharts 3.10.1
+ recharts 3.9.2
```

Command:

```powershell
$env:Path='C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;'+$env:Path; & 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd' test:coach
```

Output:

```text

 RUN  v4.1.10 C:/Users/danat/Documents/LIft Tracker


 Test Files  2 passed (2)
      Tests  6 passed (6)
   Start at  16:47:03
   Duration  1.53s (transform 277ms, setup 0ms, import 703ms, tests 20ms, environment 0ms)

$ vitest run tests/coach
```

Command:

```powershell
$env:Path='C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;'+$env:Path; & 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd' test:iop
```

Output:

```text
Monetization core behavior verified.
Recovery and adaptive-training contracts verified.
Monetization pricing and gate UI verified.
$ node scripts/test-monetization-core.mjs && node scripts/test-recovery-contracts.mjs && node scripts/verify-monetization-ui.cjs
```

No Minor test suggestion was addressed in this fix round. No Git operations were run and no commit was created.
