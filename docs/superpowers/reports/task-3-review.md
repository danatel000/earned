# Task 3 Independent Review

## Spec Compliance

**Issues found.** The baseline contains zero-byte placeholders, and the supplied current snapshot exactly matches the workspace implementation, tests, and implementer report. Session and date-range exclusions run before the 52/12 slices, legacy IDs use the original history index, and the final `MemberContext.sessions` projection is generally minimal. The findings below prevent approval.

## Findings

### Critical

None.

### Important

1. **`filterExcludedData` does not enforce the privacy/category boundary on its exported analytics output.** `supabase/functions/_shared/coach/member-context.ts:213-218` spreads every raw session key into `analyticsSessions` and only replaces `periodId` and the exercise map. Consequently, `filterExcludedData` returns notes when notes permission/category access is disabled, readiness when readiness access is disabled, and arbitrary keys such as `email` and `comments`, contrary to the exact category and no-PII requirements. The exercise values are also retained by reference, so mutating `filtered.analyticsSessions[0].exercises.<id>` mutates the source `appData`. The final `buildMemberContext` projection happens to hide these keys, but `filterExcludedData` is itself a required exported interface and its result is the stated analytics input. Runtime probing confirmed all three denied/raw fields remained present and that mutating a returned exercise changed the source object. **Correction:** make `analyticsSessions` an explicit, deeply detached allowlisted analytics projection and apply notes/readiness category and permission gates to that projection before returning it.

2. **The adapter does not consume Earned's actual persisted draft exercise shape.** `supabase/functions/_shared/coach/member-context.ts:174-184` only reads `draft.exercises`, while production drafts store workout cells under `draft.inputs[activeDay][exerciseId]` (`src/App.jsx:7143`). Thus current weights, reps, sets, set quality, skipped state, and active-workout exercise data are silently absent from `MemberContext.draft`; exercise exclusions are not actually applied to the real draft structure. The test fixture at `tests/coach/member-context.test.js:157-163` invents a flat `draft.exercises` shape, so it cannot detect this integration failure. This also undermines later in-session generation and draft-load/readiness-mismatch logic. **Correction:** project the real versioned draft `inputs` shape, at minimum the relevant active day, through an allowlist while removing excluded exercises and forbidden categories.

3. **Malformed set rows break exact set provenance.** `supabase/functions/_shared/coach/member-context.ts:264-270` removes non-record rows before `buildProvenance` enumerates the projected rows at `:281-290`. If source `setDetails` is `[null, {w: 225, r: 5}]`, the valid source set is index 1 but the emitted provenance says `setIndex: 0`, so the deep link cannot open the exact supporting set. The current test at `tests/coach/member-context.test.js:126-145` uses only two contiguous valid rows and misses index preservation. **Correction:** retain each valid row's original source index for provenance, and do not emit provenance for malformed/non-supporting rows.

4. **Malformed readiness can be converted into a false low-readiness signal.** `supabase/functions/_shared/coach/member-context.ts:95-99` coerces arbitrary values with `Number`, and `:145-152` accepts the result without enforcing the app's 1-5 readiness domain. For example, `{sleep:false, energy:false, soreness:false}` becomes `{sleep:0, energy:0, soreness:0, score:40}` instead of missing. That violates the requirement to treat absent/malformed readiness as missing and can drive safety-sensitive readiness decisions. `tests/coach/member-context.test.js:147-168` covers only an entirely absent readiness object. **Correction:** accept only valid finite domain values (with an explicitly justified legacy numeric-string policy); otherwise return `null`.

5. **The final profile projection is neither strictly allowlisted nor fully detached.** `supabase/functions/_shared/coach/member-context.ts:316-321` spreads the runtime profile object, so unexpected keys such as `email` would enter the model-facing `MemberContext`, and `equipment` remains aliased to `input.settings.profile.equipment`. Only `limitations` is copied. This conflicts with the no-email/unrelated-key rule and permits output mutation to alter caller-owned settings. `tests/coach/member-context.test.js:222-232` checks only the limitations permission. **Correction:** construct the five declared profile fields explicitly and clone both arrays.

### Minor

1. **Boundary tests do not genuinely cover several binding semantics.** `tests/coach/member-context.test.js:77-124` verifies valid inclusive date strings and raw 52/12 counts, but not exclusions at either slice boundary, source-order stability, malformed legacy dates/exclusions, data-category `workouts`/`notes`, or duplicate/missing identifiers. The suite also has no non-mutation assertion and checks PII only on final `MemberContext`, not on `filterExcludedData`. These omissions allowed the Important findings above to pass 9/9. Add focused adversarial tests for each exported interface and for the real production draft shape.

## Code Quality, Security, and Privacy

The final session/draft builders use allowlist-style projections, session exclusions match exact `periodId` values, date-range bounds are inclusive for canonical `YYYY-MM-DD` dates, exercise exclusions run before the limits, and legacy IDs use the required `legacy:<date>:<week>:<original-index>` format. Generation and analytics limits are applied after session/date/workout exclusion. Output session ordering is deterministic for a fixed source array.

Residual risks after the listed fixes include defining what "latest" means for imported or unsorted history, handling duplicate modern `periodId` values without duplicate provenance IDs, and deciding fail-closed behavior for malformed persisted exclusion selectors. The brief does not define those cases precisely enough to classify the current behavior as a separate defect.

## Test Evidence

The focused command was independently rerun outside the filesystem sandbox because pnpm junction reads fail with `EPERM` inside it:

```text
vitest run tests/coach/member-context.test.js
Test Files  1 passed (1)
Tests       9 passed (9)
```

Read-only runtime probes additionally reproduced raw notes/readiness/email leakage from `filterExcludedData`, source mutation through an aliased exercise, profile-equipment aliasing, shifted set provenance after a malformed row, and malformed readiness becoming score 40.

## Assessment

**Task quality: Needs fixes.** No Critical issue was found in the currently used `buildMemberContext` path, but the exported filtered-data boundary leaks denied/unrelated session data, the real draft workout shape is not consumed, exact set provenance can point to the wrong set, and malformed readiness can become a false coaching signal. Task 3 is not approved until the Important findings are corrected and covered by realistic boundary tests.

## Fix Round 1 Re-review Addendum

### Finding Disposition

- **Addressed: 6 of 6** original findings (5 Important, 1 Minor).
- **Open: 0 of 6.**
- **New findings: 0 Critical, 0 Important, 0 Minor.**

1. **Addressed: analytics privacy, category gates, and detachment.** `supabase/functions/_shared/coach/member-context.ts:204-265` now constructs set, exercise, and session analytics through explicit field projections. `:336-365` applies workout, notes, readiness, session, date-range, and exercise gates before the 52-session slice. No raw session/exercise/set object is spread into `analyticsSessions`. The expanded test at `tests/coach/member-context.test.js:239-274` verifies exact keys, denied notes/readiness, PII removal, and nested non-aliasing. Independent mutation probes also left the source session, exercise, and set unchanged.

2. **Addressed: real persisted draft shape and exclusions.** `supabase/functions/_shared/coach/member-context.ts:267-325` projects `draft.inputs[activeDay]`, returns only the active day, allowlists workout-cell/set fields, applies exercise exclusions, and gates workout, notes, and readiness data. The flat `draft.exercises` path is retained only as a normalized compatibility fallback. `tests/coach/member-context.test.js:276-321` uses the actual production draft shape and verifies active-day selection, unrelated-key removal, and exercise exclusion. Independent probes additionally confirmed the projected draft is deeply detached.

3. **Addressed: exact source set indexes.** `supabase/functions/_shared/coach/member-context.ts:204-219` captures the original `setDetails` index before malformed rows are skipped, and `:411-429` uses that retained index in provenance IDs and `setIndex`. `tests/coach/member-context.test.js:323-347` verifies that a valid row after a malformed row retains source index 1. The independent probe reproduced the same result.

4. **Addressed: readiness fails closed.** `supabase/functions/_shared/coach/member-context.ts:193-202` accepts only finite numeric values in the inclusive 1-5 domain; booleans, numeric strings, infinities, and out-of-range values return `null`. `tests/coach/member-context.test.js:349-363` covers those malformed classes. Independent assertions also verified boolean, string, zero, six, and `NaN` inputs remain missing rather than becoming low scores.

5. **Addressed: profile allowlisting and detachment.** `supabase/functions/_shared/coach/member-context.ts:449-457` explicitly emits only the five declared profile fields and clones both arrays while retaining the limitations permission gate. `tests/coach/member-context.test.js:365-391` verifies unexpected-key removal and mutation isolation. Independent probes confirmed both source arrays remain unchanged.

6. **Addressed: meaningful boundary coverage.** The suite now directly covers exported filtered-data privacy/non-mutation, the real draft structure, all data-category classes across existing and new cases, exclusions before both 52/12 boundaries without reordering, malformed set rows, malformed readiness, duplicate session IDs, empty exercise IDs, and malformed date selectors (`tests/coach/member-context.test.js:239-471`). These assertions target observable outputs and source immutability rather than implementation details.

### Independent Verification

The supplied `task-3-fix1-current` snapshot hashes exactly match the workspace implementation, test, and implementer-report files.

Fresh focused result:

```text
vitest run tests/coach/member-context.test.js
Test Files  1 passed (1)
Tests       21 passed (21)
```

A separate read-only Node probe ran 24 adversarial assertions covering analytics allowlisting/category gates, historical and draft exercise exclusion, nested source non-mutation, active-day-only draft projection, original malformed-row set indexes, malformed readiness classes, and profile key/array isolation. All 24 assertions passed.

### Final Assessment

**Task quality: Approved after Fix Round 1.** All six original findings are addressed, the expanded tests materially cover the required boundaries, and independent adversarial verification found no new scoped defect. The earlier "Needs fixes" assessment is superseded by this addendum. Residual specification ambiguities remain around defining "latest" for externally reordered history and product behavior for malformed exclusions, but the implementation now handles the reviewed cases deterministically and fail-closed.
