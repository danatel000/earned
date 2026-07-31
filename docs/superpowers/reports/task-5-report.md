# Task 5 Report: Evidence Calibration, Safety Policy, and Proactive Triggers

## Status

Task 5 is implemented in the shared workspace without Git operations or unrelated source edits.

Implemented:

- `deriveEvidenceState` with grounded retrieval, distinct-session, citation, provenance, malformed-score, and contradiction fail-closed rules.
- `buildGenerationMessages` with explicit untrusted evidence/member delimiters and escaped block content.
- `enforceCoachPolicy` with deterministic medical boundaries, acute-activity stopping, qualified-care routing, emergency non-fabrication, full answer validation, action stripping, and safe fallback.
- `buildProactiveTriggers` with exact material windows, canonical ordering, duplicate suppression, cadence boundaries, readiness/draft validation, stable material keys, and dismissal/mute suppression.

## RED Evidence

Initial focused command:

```powershell
pnpm exec vitest run tests/coach/evidence.test.js tests/coach/policy.test.js tests/coach/triggers.test.js
```

The workspace runtime did not expose `node` to child command shims, so the first invocation stopped before test collection and was not accepted as RED.

Equivalent focused command using the bundled Node runtime:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach/evidence.test.js tests/coach/policy.test.js tests/coach/triggers.test.js
```

Valid initial RED:

- Exit code: `1`
- Test files: `3 failed`
- Tests collected: `0`
- Expected failures: missing `evidence.ts`, `policy.ts`, and `triggers.ts` imports.

Additional TDD RED cycles:

- Trigger canonicalization: `2 failed, 9 passed`; opaque period IDs were unsorted and duplicate evidence authorized fatigue.
- Nested policy/key material: `2 failed, 22 passed`; malformed citation references bypassed fallback and corrected values retained a dismissed key.
- Acute-harm classification: `1 failed, 12 passed`; acute harm without an explicit injury noun bypassed the medical boundary.

## GREEN Evidence

Focused Task 5:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach/evidence.test.js tests/coach/policy.test.js tests/coach/triggers.test.js
```

- Initial implementation GREEN: `3 passed`, `32 passed`.
- Trigger regression GREEN: `1 passed`, `11 passed`.
- Final adversarial policy/trigger GREEN: `2 passed`, `24 passed`.
- Acute-harm policy GREEN: `1 passed`, `13 passed`.

Full Coach suite:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach
```

- Exit code: `0`
- Test files: `8 passed`
- Tests: `110 passed`

Relevant verifiers:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\scripts\run-verifiers.cjs'
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\scripts\verify-earned-coach-schema.cjs'
```

- Repository verifiers: `57 passed`.
- Earned Coach schema verifier: exit code `0`.

Production build:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vite\bin\vite.js' build
```

- Exit code: `0`
- Modules transformed: `683`
- Build completed in `1.26s`.
- Existing Vite warning remains for chunks larger than 500 kB.

## Adversarial Coverage

- Retrieved and member-data prompt injection with closing delimiters.
- Invalid, non-finite, string, negative, and out-of-range retrieval scores.
- Missing citation and provenance references.
- Material unresolved contradictions.
- Obfuscated diagnosis and injury intent.
- Acute harm, relevant-activity stopping, action stripping, and emergency non-fabrication.
- Malformed nested model answer references and deterministic fallback.
- Daily and weekly cadence boundaries.
- Duplicate, unsorted, opaque-ID, and malformed progression evidence.
- Malformed readiness and draft loads.
- Exact three-exposure plateau/fatigue windows and two-exposure PR windows.
- Stable trigger keys across clock changes and key rotation for changed refs or corrected values.
- Dismissed key and muted type suppression.

## Self-Review

- Evidence confidence fails closed for malformed references and recommendation-changing contradictions.
- Medical responses contain no diagnosis, remove all actions, and mention emergency care only for emergency-described input.
- Untrusted blocks serialize and escape `<`, `>`, and `&`, preventing member/retrieved text from closing delimiters.
- Trigger ordering uses member-session dates for opaque period IDs and rejects duplicate material windows.
- Trigger keys hash material evidence, not wall-clock time; evidence refs remain member-visible provenance IDs.
- Invalid top-level trigger input, dates, readiness, drafts, scores, and progression rows return no unsafe trigger rather than throwing.
- No Git commands were run.

## Changed Files

- `supabase/functions/_shared/coach/evidence.ts`
- `supabase/functions/_shared/coach/policy.ts`
- `supabase/functions/_shared/coach/triggers.ts`
- `tests/coach/evidence.test.js`
- `tests/coach/policy.test.js`
- `tests/coach/triggers.test.js`
- `docs/superpowers/reports/task-5-report.md`

## Concerns

- The required subagent implementer/reviewer workflow could not be dispatched: no subagent tool was exposed, and the local `codex.exe` returned OS-level `Access is denied` both sandboxed and after escalation. Implementation used controller-driven strict TDD plus self-review instead.
- The production build emits the existing chunk-size warning for JavaScript bundles over 500 kB; Task 5 does not change client bundling.
- Concurrent unrelated workspace changes were observed in `src/App.jsx`, Task 4 report/progress artifacts, and `tests/coach/exercise-graph.test.js`. They were not touched or reverted.

## Fix Round 1/5

Review source: `docs/superpowers/reports/task-5-review.md`

Disposition:

- Critical addressed: `1/1`
- Important addressed: `8/8`
- Open Critical/Important findings: `0`

### Fix-Round RED

Evidence and policy command:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach/evidence.test.js tests/coach/policy.test.js
```

- Exit code: `1`
- Tests: `11 failed`, `26 passed`
- Failures reproduced exact low-chunk grounding, conflicting duplicate references, schema-valid unsafe output, model-derived action allowlisting, emergency/symptom negation, gave-way, rotator-cuff tear, hurt, and tweak probes.

Trigger command:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach/triggers.test.js
```

- Exit code: `1`
- Tests: `9 failed`, `11 passed`
- Failures reproduced malformed/ambiguous windows, insufficient evidence, empty quality, intermediate progress, unsorted median selection, local-date cadence, input-order output, unresolved evidence refs, and incomplete rest-day key probes.

### Fix-Round GREEN

Focused Task 5:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach/evidence.test.js tests/coach/policy.test.js tests/coach/triggers.test.js
```

- Exit code: `0`
- Test files: `3 passed`
- Tests: `57 passed`

Full Coach:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach
```

- Exit code: `0`
- Test files: `8 passed`
- Tests: `130 passed`

Verifiers and build:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\scripts\run-verifiers.cjs'
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\scripts\verify-earned-coach-schema.cjs'
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vite\bin\vite.js' build
```

- Feature verifiers: `57 passed`
- Coach schema verifier: exit code `0`
- Production build: exit code `0`, `683` modules transformed in `1.29s`
- Existing bundle-size warning remains unchanged.

### Fix-Round Self-Review

1. Policy now validates selected actions against caller-supplied `allowedActionIds`; omission means an empty allowlist. Model-selected IDs never create their own allowlist.
2. Request text and all answer section text are independently classified. Schema-valid diagnoses or train-through-harm content are replaced with the immutable deterministic medical boundary even for a benign request.
3. Emergency wording is based only on non-negated member emergency descriptions. Fully negated pain/injury language does not activate the boundary; gave-way, tear/rotator-cuff, hurt, tweak, and acute activity phrases do.
4. Citations require an explicit `chunkId` resolving to that exact chunk at score `>= 0.72`; source-level matches cannot ground a low-scoring chunk. Conflicting duplicate citation/provenance IDs invalidate confidence.
5. Progression derivation rejects malformed, duplicate, undated, same-day ambiguous, and insufficient-evidence windows. PR success requires non-empty explicit safe quality plus RPE/readiness evidence.
6. Plateau evaluation checks both adjacent transitions, so any intermediate rep or estimated-strength progress blocks the trigger.
7. Sessions are validated, deduplicated, member-timezone normalized, and chronologically sorted once. Streak, median load, material keys, and evidence refs consume that same canonical window.
8. Trigger output is sorted by type then stable scoped key after dismissal/mute filtering, independent of caller progression order.
9. Every emitted `evidenceRef` resolves through `MemberContext.provenance`. Readiness triggers fail closed without readiness provenance, and rest-day keys include schedule plus member-local window identity.
10. Existing escaped untrusted delimiters, deterministic fallbacks, input/answer immutability, dismissal/mute suppression, and action stripping remain covered and passing.

Fix-round changed files remain limited to the Task 5 scope and this report. No Git commands were run.

## Fix Round 2/5

Review source: `docs/superpowers/reports/task-5-review.md`, Fix Round 1 Re-review Addendum.

Disposition:

- Important addressed: `4/4`
- Open Critical findings: `0`
- Open Important findings: `0`
- Previously closed findings preserved: `8/8`

### Round-2 RED

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach/evidence.test.js tests/coach/policy.test.js tests/coach/triggers.test.js
```

- Exit code: `1`
- Test files: `3 failed`
- Tests: `8 failed`, `58 passed`
- Exact failures: pain-free and contraction-based clause negation; explicit emergency symptoms hidden by a negated emergency label; duplicate chunk-ID relevance laundering; session provenance date contradiction; stale sole readiness provenance fallback; omitted-timezone brief incompatibility.

### Round-2 GREEN

Focused Task 5:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach/evidence.test.js tests/coach/policy.test.js tests/coach/triggers.test.js
```

- Exit code: `0`
- Test files: `3 passed`
- Tests: `66 passed`

Full Coach:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach
```

- Exit code: `0`
- Test files: `8 passed`
- Tests: `139 passed`

Verifiers and build:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\scripts\run-verifiers.cjs'
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\scripts\verify-earned-coach-schema.cjs'
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vite\bin\vite.js' build
```

- Feature verifiers: `57 passed`
- Coach schema verifier: exit code `0`
- Production build: exit code `0`, `683` modules transformed in `1.32s`
- Existing bundle-size warning remains unchanged.

### Round-2 Self-Review

1. Medical negation is clause-scoped for `no/without`, `do not/don't have`, and `pain-free` forms. These ordinary statements preserve safe schema-valid answers.
2. Explicit emergency symptom phrases (`crushing chest pain`, `cannot breathe`, `passed out`, `unconscious`) override a member's `not/no emergency` label. Emergency fallback remains deterministic, immutable, and action-free.
3. Retrieved chunks are canonicalized by ID before threshold qualification. Conflicting duplicate IDs are removed and invalidate citation confidence, preventing low-score rows from sharing a high-score identity.
4. Session provenance dates are normalized in the same member-local calendar domain and must equal canonical session dates. Contradictory provenance invalidates trigger derivation.
5. Readiness provenance must match the exact current local date. The prior sole-ID fallback is removed, so stale readiness evidence cannot authorize PR or readiness triggers.
6. `TriggerInput.timeZone` is optional. `DEFAULT_TRIGGER_TIME_ZONE` documents deterministic UTC behavior for the brief-compatible interface; explicit IANA timezone behavior remains unchanged.
7. All round-1 adversarial tests remain in the focused suite, including unsafe answer content, independent action allowlisting, exact chunk grounding, conflicting references, trigger evidence sufficiency, exact windows, canonical medians, local cadence, deterministic ordering, and provenance-resolved refs.

Round-2 changed files remain limited to the Task 5 implementations, tests, and this report. No Git commands were run.

## Fix Round 3/5

Disposition:

- Important addressed: `1/1`
- Open Critical findings: `0`
- Open Important findings: `0`
- Previously closed findings preserved by the full focused suite.

### Round-3 RED

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach/policy.test.js
```

- Exit code: `1`
- Test file: `1 failed`
- Tests: `2 failed`, `27 passed`
- Exact failures: `I have no crushing chest pain and can breathe normally.` and `I am not unconscious; I feel fine.` both fabricated emergency routing.
- Positive emergency controls remained passing: negated emergency labels followed by either crushing chest pain plus inability to breathe or passing out plus inability to breathe still routed emergency and stripped actions.

### Round-3 GREEN

Policy:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach/policy.test.js
```

- Exit code: `0`
- Tests: `29 passed`

Focused Task 5:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach/evidence.test.js tests/coach/policy.test.js tests/coach/triggers.test.js
```

- Exit code: `0`
- Test files: `3 passed`
- Tests: `68 passed`

Full Coach:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach
```

- Exit code: `0`
- Test files: `8 passed`
- Tests: `141 passed`

### Round-3 Self-Review

- Explicit emergency symptom detection now consumes text after clause-scoped removal of `no crushing chest pain`, `not unconscious`, and negated passed-out phrases.
- Medical and acute classifiers consume the same clause-scoped text, preventing a negated symptom from activating a lower-severity medical boundary after emergency routing is suppressed.
- Positive explicit emergency symptoms still override only the member's `not/no emergency` label; emergency fallback remains deterministic, immutable, and action-free.
- Injection escaping, independent action allowlisting, unsafe answer-content replacement, evidence calibration, trigger safety, provenance validation, timezone compatibility, and all prior adversarial cases remain passing.

Round-3 changes are limited to `policy.ts`, `policy.test.js`, and this report. No Git commands were run.

## Fix Round 4/5

Disposition:

- Important addressed: `1/1`
- Open Critical findings: `0`
- Open Important findings: `0`
- Previously closed findings preserved by the focused and full Coach suites.

### Round-4 RED

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach/policy.test.js
```

- Exit code: `1`
- Test file: `1 failed`
- Tests: `4 failed`, `29 passed`
- Exact failures: curly- and ASCII-apostrophe forms of `wasn't unconscious` and `don't have crushing chest pain` fabricated emergency routing.
- Existing positive emergency controls remained among the passing tests.

The first GREEN attempt made the four new probes pass but exposed a preserved-behavior regression for `I don't have any pain or injury.` (`1 failed`, `32 passed`). The compact negation pattern was corrected before accepting GREEN.

### Round-4 GREEN

Policy:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach/policy.test.js
```

- Exit code: `0`
- Test file: `1 passed`
- Tests: `33 passed`

Focused Task 5:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach/evidence.test.js tests/coach/policy.test.js tests/coach/triggers.test.js
```

- Exit code: `0`
- Test files: `3 passed`
- Tests: `72 passed`

Full Coach:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach
```

- Exit code: `0`
- Test files: `8 passed`
- Tests: `145 passed`

### Round-4 Self-Review

- Curly apostrophes are normalized to ASCII before a bounded set of common negative contractions is expanded.
- Clause-scoped symptom negation recognizes the expanded forms without suppressing positive emergency phrases.
- The prior pain/injury contraction behavior is explicitly covered and remains passing after the intermediate regression fix.
- Positive emergency controls, action-free emergency fallback, immutability, injection escaping, evidence grounding, and trigger behavior remain passing through the full Coach suite.

Round-4 changes are limited to `policy.ts`, `policy.test.js`, and this report. No Git commands were run.

## Fix Round 5/5

Disposition:

- Important addressed: `1/1`
- Open Critical findings: `0`
- Open Important findings: `0`
- This was the final allowed fix round for the finding.

### Round-5 RED

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach/policy.test.js
```

- Exit code: `1`
- Test file: `1 failed`
- Tests: `23 failed`, `42 passed`
- The table-driven matrix covered `did not have`, `do not have`, `does not have`, `never had`, `denies`, and `denied` across crushing chest pain, inability to breathe, passing out, and unconsciousness.
- Existing ASCII/Unicode contraction probes remained in the same policy suite.
- All new positive controls passed during RED: negated emergency labels did not hide asserted symptoms, and negating one symptom did not hide a different asserted emergency symptom.

### Round-5 GREEN

Policy:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach/policy.test.js
```

- Exit code: `0`
- Test file: `1 passed`
- Tests: `65 passed`

Focused Task 5:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach/evidence.test.js tests/coach/policy.test.js tests/coach/triggers.test.js
```

- Exit code: `0`
- Test files: `3 passed`
- Tests: `104 passed`

Full Coach:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run tests/coach
```

- Exit code: `0`
- Test files: `8 passed`
- Tests: `177 passed`

### Round-5 Self-Review

- Emergency symptoms are represented as token sequences and evaluated per clause rather than removed by one regex per sentence.
- Common negative contractions and curly apostrophes are normalized before clause analysis.
- A bounded token lookback recognizes auxiliary denial, `never had`, `denies/denied`, and direct negative forms.
- Scope resets at contrast boundaries and after each symptom occurrence. This preserves emergency routing when an emergency label is negated, when another clause asserts a symptom, or when a later symptom remains asserted.
- Only denied symptom tokens are removed before downstream medical and acute classification, preventing negated chest-pain text from reactivating a lower-severity medical fallback.
- Emergency fallback remains deterministic, immutable, and action-free. All prior policy, evidence, provenance, trigger, and injection tests remain passing.

Residual risk: deterministic token analysis cannot resolve every possible ambiguous or highly novel natural-language construction. The implementation intentionally uses bounded, auditable denial cues and fails toward emergency routing when a recognized symptom remains asserted or its denial scope is ambiguous.

Round-5 changes are limited to `policy.ts`, `policy.test.js`, and this report. No Git commands were run.
