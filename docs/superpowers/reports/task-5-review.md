# Task 5 Independent Review

## Critical

### 1. Schema-valid unsafe model output and invented actions bypass the policy

`enforceCoachPolicy` applies the medical boundary only when the member message matches `classifyMedicalIntent`; otherwise `isUsableAnswer` performs structural validation and returns the original answer unchanged (`supabase/functions/_shared/coach/policy.ts:79-105`, `:141-176`). Worse, it constructs the action allowlist from the model's own `selectedActionIds`, making the action check tautological (`policy.ts:142-145`). A direct probe with `message: "Review my plan."` and a contract-valid answer containing `recommendation: "You tore a tendon; train through it."` plus `selectedActionIds: ["invented-action"]` returned `policyApplied: "none"` with both values unchanged. The same happened for the missed euphemism `"What did I tweak in my shoulder?"`.

This defeats the model-output safety boundary: a model can emit a diagnosis, unsafe training advice, and an arbitrary plan-changing action whenever the request does not hit the lexical classifier. Existing tests exercise recognized medical messages and structurally malformed answers, but not a schema-valid unsafe answer or a schema-valid unallowlisted action (`tests/coach/policy.test.js:19-31`, `:104-129`). Correct by passing an independently derived action allowlist into policy enforcement and rejecting or replacing unsafe medical/diagnostic answer content regardless of request classification.

## Important

### 1. Citation and provenance validation accepts conflicting or incorrectly grounded references

`groundedCitationIds` accepts a citation when either its `chunkId` is grounded or its `sourceId` matches any grounded chunk (`supabase/functions/_shared/coach/evidence.ts:71-87`). A probe with a `0.10` chunk explicitly named by `chunkId` and a separate `0.90` chunk sharing its `sourceId` returned `well_supported`. `validProvenanceIds` also collapses duplicate IDs without rejecting conflicting rows (`evidence.ts:90-99`); two rows with the same ID and different period IDs likewise returned `well_supported`. This violates claim-per-chunk grounding and valid, unambiguous provenance. Canonicalize unique references, reject conflicting duplicate IDs, and require an explicit `chunkId` to resolve to that exact threshold-qualified chunk.

### 2. Negation, acute wording, and common injury euphemisms are mishandled

The substring classifier has no negation handling and a narrow phrase list (`supabase/functions/_shared/coach/policy.ts:65-105`). `"This is not an emergency, just mild shoulder pain."` produced emergency-care wording, violating emergency non-fabrication. `"I have no pain or injury"` produced a medical boundary, while `"My knee gave way during squats"` and `"Did I tear my rotator cuff?"` bypassed it. `"I just hurt my knee while squatting"` was classified medical but did not receive the required stop-activity wording because `hurt` is not acute (`policy.ts:150-159`). Add negation-aware emergency detection and broader, tested diagnosis/injury and acute-harm phrases without relying on raw substring containment.

### 3. Trigger eligibility silently discards bad evidence and ignores evidence sufficiency

Malformed progression rows are filtered out before grouping, and `progressionTriggers` never checks `evidenceState` (`supabase/functions/_shared/coach/triggers.ts:67-125`, `:170-238`). A malformed newest fourth exposure was discarded and the three older rows generated a plateau; three rows marked `insufficient_evidence` also generated a plateau. In addition, `successful` treats an empty quality array as successful because `every` is vacuously true (`triggers.ts:164-168`), allowing a PR opportunity with no quality evidence. Fail closed for malformed or chronology-ambiguous material windows, require sufficient progression evidence, and require explicit acceptable quality evidence for success.

### 4. Plateau detection does not mean three exposures without progress

The plateau rule compares only the first and last rows in the three-exposure window (`supabase/functions/_shared/coach/triggers.ts:177-191`). The sequence 5 reps, 6 reps, 5 reps generated a plateau even though the middle exposure made rep and estimated-strength progress. Evaluate progress across each adjacent exposure or against the maximum prior result so any progress in the exact window prevents the trigger.

### 5. Recent-load selection is not chronological and can cite evidence different from the median window

Readiness load calculation uses the last five rows in input order, while evidence refs are independently date-sorted (`supabase/functions/_shared/coach/triggers.ts:241-249`, `:342-355`). With five chronologically recent 1000-load sessions placed before five older 100-load sessions, a 500-load draft incorrectly triggered against the old median but cited the five recent high-load session IDs. Sort, validate, and deduplicate sessions once, then use the same exact window for both the median and evidence refs.

### 6. Streak cadence is based on elapsed instants, not member-local calendar intervals

`dateTimestamp` discards timezone/calendar semantics and streak gaps are rounded from elapsed 24-hour periods (`supabase/functions/_shared/coach/triggers.ts:55-59`, `:251-272`). Consecutive local session dates with different valid UTC offsets failed to establish a streak in a direct probe. The input has no member timezone, so DST and travel cannot be handled deterministically. Supply a timezone or normalized local date and calculate cadence boundaries in that calendar domain.

### 7. Trigger output ordering depends on caller input order

Exercise groups retain first-insertion order and the final candidate list is never sorted (`supabase/functions/_shared/coach/triggers.ts:98-125`, `:170-176`, `:358-377`). Reversing two otherwise identical exercise groups reversed the returned plateau order. Add a documented final sort, for example by trigger type, scope, and key, after suppression.

### 8. Readiness trigger references and rest-day material keys are not valid or complete provenance

Readiness triggers emit synthetic strings such as `readiness:80` in `evidenceRefs` without resolving them against `memberContext.provenance` (`supabase/functions/_shared/coach/triggers.ts:323-355`). The high-readiness rest-day key is derived only from that score, not the scheduled date or rest-day draft material; the same key was produced a month later (`triggers.ts:128-145`, `:330-337`). A dismissal can therefore suppress a distinct future rest-day event, and consumers receive references that may not identify any provenance row. Require every output ref to resolve to supplied provenance and include the rest-day schedule/window identity in key material.

## Minor

No minor findings. The remaining issues are release-significant correctness or safety defects.

## Assessment

**Changes required; Task 5 is not approved.** The baseline contains empty placeholders, and the task-5-current snapshot exactly matches the reviewed workspace files. The required focused command completed with `3` files and `37` tests passing, but the direct read-only probes above reproduced failures outside the existing coverage. Prompt block escaping resisted closing-tag, control-character, and tag injection probes, and medical-boundary/fallback answers were action-free without mutating the supplied answer; those passing properties do not mitigate the findings above.

## Fix Round 1 Re-review Addendum

### Disposition

- Prior findings fully addressed: **8/9**.
- Prior findings still open: **1/9** (`Important 2`, medical negation).
- New findings: **3 Important**, **0 Critical**, **0 Minor**.
- Total open after fix round 1: **0 Critical, 4 Important, 0 Minor**.

The exact prior probes now pass for schema-valid unsafe output and independent action allowlisting; low-score exact-chunk and conflicting-provenance rejection; the originally named euphemism/acute phrases; malformed, insufficient, and empty-quality progression evidence; the 5/6/5 plateau; chronological median selection and matching refs; DST-local cadence; deterministic ordering; and resolvable readiness refs with rotating rest-day keys. These fixes are supported by `supabase/functions/_shared/coach/evidence.ts:77-137`, `policy.ts:127-228`, and `triggers.ts:263-625`.

### Open Prior Finding

#### Important 2. Medical negation remains incomplete and can under-route emergencies

Negation handling recognizes only narrow `no`, `without`, and adjacent `not/no emergency` forms, then globally disables emergency classification whenever that adjacent phrase occurs (`supabase/functions/_shared/coach/policy.ts:85-115`). A replay of `"I don't have any pain or injury"` still activated the medical boundary. More seriously, `"This is not an emergency, but I have crushing chest pain and cannot breathe."` returned only qualified-care wording, and `"No emergency, but I passed out and cannot breathe."` returned `policyApplied: "none"`. The latter leaves explicit emergency symptoms completely unhandled. `"Use a pain-free range of motion."` also falsely activated the boundary. Euphemism and acute-stop coverage is otherwise fixed: `tweak`, `gave way`, `tear`, and `hurt while squatting` all produced action-free stop/care responses. Use clause-scoped negation and let explicit emergency symptom phrases override the member's own `not/no emergency` characterization.

### New Important Findings

#### 1. Duplicate chunk IDs can still launder a low relevance score

Chunks are filtered but never canonicalized or checked for duplicate IDs (`supabase/functions/_shared/coach/evidence.ts:41-50`). `groundedCitationIds` then creates a set of IDs from threshold-qualified rows (`evidence.ts:77-83`). Two chunks with the same ID at scores `0.10` and `0.90`, followed by a citation to that ID, returned `well_supported`; the low row is indistinguishable from the high row. Reject conflicting duplicate chunk IDs before constructing grounded reference sets.

#### 2. Provenance can resolve by ID while contradicting the evidence date

Session provenance is indexed by period ID without validating its date against the canonical session, and a single readiness provenance ID is reused even when it does not match the current local date (`supabase/functions/_shared/coach/triggers.ts:123-167`, `:209-248`, `:379-385`). A plateau was emitted when all session provenance dates were in January but the referenced sessions were in July. A rest-day trigger on `2026-08-03` likewise emitted `evidenceRefs: ["readiness:2026-07-27"]`. This is resolvable but not valid supporting provenance. Require session date consistency and an exact current-window readiness provenance match; do not fall back to the sole readiness ID.

#### 3. The required timezone field breaks the brief's explicit trigger interface

The Task 5 brief defines one explicit `TriggerInput` without `timeZone`, but fix round 1 makes `timeZone` required and returns no triggers when it is omitted (`supabase/functions/_shared/coach/triggers.ts:23-32`, `:577-584`). Replaying the brief-compatible plateau input returned `[]`. Preserve compatibility by making the timezone optional with a documented deterministic default, or revise the owning contract and every caller as an explicit specification change.

### Regression Verification

The required focused command completed with `3` files and `57` tests passing. Direct probes confirmed the unsafe input answer was not mutated, medical and fallback replacements stripped all actions, and retrieved/member/request closing tags plus control characters could not escape their delimiters. Workspace hashes for the three implementations, three tests, and implementer report exactly matched `task-5-fix1-current` before this addendum.

### Fix Round 1 Assessment

**Changes still required; Task 5 is not approved after fix round 1.** The original Critical finding is resolved, but one prior Important finding remains open and three new Important findings affect emergency routing, evidence grounding, provenance validity, and interface compliance.

## Fix Round 2 Final Re-review Addendum

### Disposition

- Fix-round-1 open findings addressed: **4/4**.
- Previously closed exact probes preserved: **8/8**.
- New findings: **1 Important**, **0 Critical**, **0 Minor**.
- Total open after fix round 2: **0 Critical, 1 Important, 0 Minor**.

The four requested probes now pass. Negated emergency labels no longer suppress positive explicit emergency symptoms; conflicting duplicate chunk IDs produce `insufficient_evidence`; contradictory session dates and stale readiness provenance suppress their triggers; and omitting `timeZone` produces the same deterministic result as explicit UTC. The relevant fixes are in `supabase/functions/_shared/coach/evidence.ts:66-98`, `policy.ts:85-124`, and `triggers.ts:23-35`, `:220-245`, `:385-395`, `:588-612`.

### New Important Finding

#### 1. Negated emergency symptoms still fabricate emergency wording

`explicitEmergencySymptoms` runs against the original normalized message rather than negation-cleaned clauses (`supabase/functions/_shared/coach/policy.ts:120-124`). As a result, `"I have no crushing chest pain and can breathe normally."` and `"I am not unconscious; I feel fine."` both produced `"seek emergency medical care now."` This violates the binding requirement to preserve emergency wording only when the member describes an emergency. The positive override probes remain correct: `"This is not an emergency, but I have crushing chest pain and cannot breathe."` and `"No emergency, but I passed out and cannot breathe."` both route to emergency care. Apply clause-scoped negation to emergency symptom phrases while retaining positive symptoms as an override to a negated emergency label.

### Closed-Probe Verification

Independent replay confirmed the prior unsafe schema-valid answer is replaced without mutating the supplied object; invented actions are rejected by the independent allowlist; exact low-score citations and conflicting provenance fail closed; acute/euphemistic injury phrases strip actions and use stop/care wording; malformed and insufficient progression evidence produces no trigger; 5/6/5 is not a plateau; median refs use the chronological window; DST-local cadence and output ordering remain deterministic; and closing-tag/control-character injection cannot escape request, retrieved-evidence, or member-data delimiters.

The focused Task 5 suite completed with `3` files and `66` tests passing. The full Coach suite completed with `8` files and `139` tests passing. Before this addendum, workspace hashes for the three implementations, three tests, and implementer report exactly matched `task-5-fix2-current`.

### Final Assessment

**Changes still required; Task 5 is not approved after fix round 2.** All four carried findings are addressed and no Critical findings remain, but the newly reproduced emergency non-fabrication defect leaves one Important finding open.

## Fix Round 3 Final Re-review Addendum

### Disposition

- Required round-3 probes passing: **4/4**.
- Previously closed findings remaining closed: **12/12**.
- Round-2 open finding fully addressed: **0/1**.
- New findings: **0 Critical, 0 Important, 0 Minor**.
- Total open after fix round 3: **0 Critical, 1 Important, 0 Minor**.

The two exact negated-symptom probes now preserve the original safe answer without emergency wording, and both positive emergency controls still return immutable, action-free emergency responses. The focused Task 5 suite completed with `3` files and `68` tests passing; the full Coach suite completed with `8` files and `141` tests passing.

### Remaining Important Finding

#### Negated emergency-symptom handling remains pattern-specific

Round 3 removes only enumerated forms before emergency detection (`supabase/functions/_shared/coach/policy.ts:87-112`, `:126-130`). Equivalent ordinary negations still fabricate emergency care:

- `"I don't have crushing chest pain and can breathe normally."`
- `"I wasn't unconscious; I feel fine."`
- `"I did not have crushing chest pain and can breathe normally."`

Each returned `policyApplied: "medical_boundary"` with `"seek emergency medical care now."` The exact fixed forms, `"I have no crushing chest pain..."` and `"I am not unconscious..."`, now pass, but the underlying emergency non-fabrication requirement is not closed. Replace phrase enumeration with clause-scoped symptom negation that supports auxiliary verbs and contractions while preserving truly positive symptoms as overrides to a member's `not/no emergency` label.

### Prior-Finding Verification

Independent replay confirmed duplicate chunk conflicts, exact low-score citations, and conflicting provenance fail closed; unsafe schema-valid output and invented actions are replaced; acute/euphemistic injury intent remains action-free; malformed and insufficient progression evidence produces no trigger; intermediate progress blocks plateau; session/readiness provenance dates fail closed; omitted timezone remains brief-compatible; DST cadence and output ordering remain deterministic; and delimiter/control-character injection plus answer immutability remain protected. Evidence and trigger implementations/tests are unchanged from the independently reviewed fix-round-2 snapshot.

Before this addendum, workspace hashes for the three implementations, three tests, and implementer report exactly matched `task-5-fix3-current`.

### Round 3 Assessment

**Changes still required; Task 5 is not approved after fix round 3.** The four requested exact probes pass and there are no new finding categories, but the existing Important emergency non-fabrication finding remains open for equivalent negated symptom phrasing.

## Fix Round 4 Re-review Addendum

### Disposition

- ASCII contracted negation probes passing: **2/2**.
- Unicode contracted negation probes passing: **2/2**.
- Non-contracted negation probes passing: **3/4**.
- Genuine positive emergency controls passing: **4/4**.
- Previously closed findings remaining closed: **12/12**.
- Prior open finding fully addressed: **0/1**.
- New findings: **0 Critical, 0 Important, 0 Minor**.
- Total open after fix round 4: **0 Critical, 1 Important, 0 Minor**.

Round 4 correctly normalizes ASCII and U+2019 apostrophes, expands the tested `wasn't`/`don't` forms, preserves `was not`, `do not have`, and `did not pass out` negatives, and retains emergency routing for positive crushing-chest-pain, cannot-breathe, passed-out, and unconscious controls (`supabase/functions/_shared/coach/policy.ts:65-100`, `:108-153`).

### Remaining Important Finding

#### Non-contracted crushing-chest-pain negation remains incomplete

`"I did not have crushing chest pain and can breathe normally."` still returned `policyApplied: "medical_boundary"` with `"seek emergency medical care now."` The cleaning rule accepts `no` and `do not have` but not `did not have` before raw emergency symptom matching (`supabase/functions/_shared/coach/policy.ts:110-128`, `:149-153`). This exact form was already recorded in the round-3 addendum, so it is the same unresolved emergency non-fabrication finding, not a new category. Generalize the auxiliary-tense negation rule rather than enumerating only present-tense phrasing.

### Verification

Independent probes confirmed:

- `"I wasn't unconscious"` and `"I don't have crushing chest pain"` are non-medical with ASCII apostrophes.
- The equivalent U+2019 forms are non-medical.
- `"I was not unconscious"`, `"I do not have crushing chest pain"`, and `"I did not pass out"` are non-medical.
- Negated emergency labels followed by actual crushing chest pain/cannot breathe or passed out/cannot breathe still receive immutable, action-free emergency responses.
- Direct positive `"I am unconscious"` and `"I have crushing chest pain"` controls still receive emergency responses.

The focused Task 5 suite completed with `3` files and `72` tests passing. The full Coach suite completed with `8` files and `145` tests passing. Evidence and trigger files/tests are byte-identical to the reviewed fix-round-3 snapshot, and their focused/full regression coverage plus the prior independent probes keep all 12 closed findings closed.

Before this addendum, workspace hashes for the three implementations, three tests, and implementer report exactly matched `task-5-fix4-current`.

### Round 4 Assessment

**Changes still required; Task 5 is not approved after fix round 4.** Contracted negations and genuine positive controls are correct and no new finding category was introduced, but one previously reported non-contracted symptom negation still fabricates emergency wording.

## Fix Round 5 Final-Cap Re-review Addendum

### Disposition

- Focused committed tests passing: **104/104**.
- Full Coach tests passing: **177/177**.
- Broad denied-symptom matrix passing: **41/46**.
- Broad genuine/mixed positive controls passing: **14/18**.
- Ambiguous safe-default controls passing: **1/4**.
- Previously closed findings remaining closed: **12/12**.
- Prior open finding fully addressed: **0/1**.
- New findings: **0 Critical, 1 Important, 0 Minor**.
- Total open at the five-round cap: **0 Critical, 2 Important, 0 Minor**.

ASCII and U+2019 forms of `wasn't`, `don't`, `didn't`, and `haven't` behave consistently. Positive ASCII and Unicode `"can't breathe"` controls route to emergency care. The committed auxiliary, `never had`, `denies/denied`, contrast-clause, and separate-symptom cases also pass. However, the generalized bounded-negation behavior fails outside those committed constructions.

### Open Important Findings

#### 1. Ordinary bare-`never` symptom denials still fabricate emergencies

`hasSymptomNegation` recognizes `never had` but not other ordinary `never` constructions (`supabase/functions/_shared/coach/policy.ts:118-125`). These independent probes all returned emergency-care wording:

- `"I never feel like I cannot breathe."`
- `"I never passed out."`
- `"I have never passed out."`
- `"I was never unconscious."`
- `"I have never been unconscious."`

This is the existing emergency non-fabrication finding from prior rounds, not a new category. The implementation is generalized structurally, but its denial-cue model remains incomplete for a required negation family.

#### 2. Broad lookback negation suppresses genuine or uncertain emergency symptoms

The analyzer treats any `no`, `not`, or `without` token within the 12-token prefix as negating the next recognized symptom, regardless of what that negative actually modifies (`supabase/functions/_shared/coach/policy.ts:118-125`, `:148-160`). It under-routed genuine positive symptoms:

- `"I did not pass out and I have crushing chest pain."` returned `policyApplied: "none"`.
- `"I do not have nausea and I have crushing chest pain."` returned `policyApplied: "none"`.
- `"I have no shoulder pain and I cannot breathe."` returned only non-emergency qualified-care wording.
- `"I do not have a headache and I passed out."` returned only non-emergency qualified-care wording.

It also treated uncertainty as denial: `"I do not know whether I passed out."`, `"I am not sure whether I was unconscious."`, and `"I don't remember whether I passed out."` all returned `policyApplied: "none"`, contrary to the implementer report's stated fail-toward-emergency behavior for ambiguous scope. This is a new Important safety finding. Negation must bind to the symptom assertion it actually modifies; unrelated negatives and epistemic uncertainty cannot suppress a recognized emergency symptom.

### Preserved Findings

Independent replay and unchanged-file hashes confirmed the 12 previously closed findings remain closed: duplicate and low-relevance grounding conflicts fail closed; provenance conflicts and date mismatches fail closed; schema-valid unsafe output and invented actions are replaced without mutating input; acute/euphemistic injury intent strips actions; delimiter/control-character injection remains escaped; malformed or insufficient progression evidence emits no trigger; plateau, chronology, median, timezone, ordering, readiness provenance, material-key, and brief-compatible input behavior remain deterministic.

Before this addendum, workspace hashes for the three implementations, three tests, and implementer report exactly matched `task-5-fix5-current`.

### Five-Round Decision

**Five-round cap failure; Task 5 is not approved.** The committed test suites are green and all earlier non-negation findings remain closed, but one existing Important emergency-fabrication finding and one new Important emergency-under-routing finding remain reproducible. No further fix round is available under the requested cap.
