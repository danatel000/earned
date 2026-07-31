# Task 1 Review: Earned NVIDIA Coach Release 1

## Spec Compliance

**Issues found.**

- `pnpm-lock.yaml:14,17,20,23` refreshes existing production resolutions while adding the test harness: `@vitejs/plugin-react` 6.0.3 to 6.0.4, `react` and `react-dom` 19.2.7 to 19.2.8, and `recharts` 3.9.2 to 3.10.1. These are unrelated runtime changes and mean the binding requirement that existing monetization preview behavior remain unchanged is not established. The implementer report also inaccurately describes this as only a Recharts 3.10.0 to 3.10.1 refresh.

The remaining contract requirements are implemented as specified: the exact request-action and evidence-state unions are defined in `supabase/functions/_shared/coach/contracts.ts:3-10`; request validation rejects unknown keys/actions, invalid modes, non-object payloads, and invalid `ask` messages in `supabase/functions/_shared/coach/contracts.ts:92-111`; answer validation strictly checks its object graph, URL syntax, reference resolution, and supplied action allowlist in `supabase/functions/_shared/coach/contracts.ts:113-159`. Coach is registered as premium without a source change to monetization-mode logic in `src/monetization/plans.js:26,48`. Settings defaults match the brief in `supabase/functions/_shared/coach/settings.ts:15-21`.

**Cannot verify from diff:**

- Actual monetization preview behavior cannot be verified from this snapshot diff. Although no monetization-mode source change is shown, the production dependency refreshes can affect application behavior.
- The reported final `pnpm test:coach` result was not independently rerun, per review instructions.

## Strengths

- The implementation uses closed allowlists and strict key checks throughout the model-facing request and answer contracts, reducing schema-smuggling and action-injection risk.
- Citation and provenance IDs are deduplicated and every guidance/pattern reference is resolved before acceptance in `supabase/functions/_shared/coach/contracts.ts:131-155`.
- `normalizeCoachSettings` safely defaults malformed partial input while preserving the conservative, opt-in data-permission defaults in `supabase/functions/_shared/coach/settings.ts:49-61`.
- The fixtures are contract-valid and reusable, and entitlement coverage verifies the new premium capability in `tests/coach/entitlement.test.js:4-8`.

## Issues

### Critical

None.

### Important

- `pnpm-lock.yaml:14,17,20,23` contains unrelated production dependency upgrades. **Impact:** the task is no longer confined to adding the coach harness/contracts and cannot demonstrate that existing monetization preview behavior is unchanged; it also makes the implementation report's lockfile claim inaccurate. **Correction:** restore the Base resolutions for existing production dependencies and retain only the required new dev dependencies and their transitive lockfile entries; then rerun the required focused command.

### Minor

- `tests/coach/contracts.test.js:21-35` does not directly cover rejection of unknown answer keys or invalid evidence-state values, despite both being binding contract constraints. **Impact:** the current implementation enforces these cases, but future regressions in the strict-schema boundary would not be caught by the Task 1 suite. **Correction:** add focused negative tests for an extra answer key and for an evidence state outside the three allowed values.

## Assessment

**Task quality: Needs fixes.** The coach contracts and entitlement registration are well-scoped and correctly defensive, but the lockfile refreshes unrelated production dependencies and leaves the unchanged-preview constraint unproven. Remove that dependency drift and add the two boundary-regression tests.

## Test Evidence

Not rerun during this read-only review. The implementer report's final required-command evidence states `vitest run tests/coach` under Vitest 4.1.10 completed with `Test Files 2 passed (2)` and `Tests 6 passed (6)` in 1.20s, with no warnings or noise in that final output. The same report records earlier unrelated noise from archived `.superpowers` baseline files (`No test suite found`); it says those files were moved before the final clean run. This evidence is report-provided, not independently verified.
