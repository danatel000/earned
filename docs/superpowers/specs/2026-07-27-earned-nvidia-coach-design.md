# Earned NVIDIA Coach Design

## Status

Revised after product review. Awaiting final user approval before implementation planning.

## Goal

Build `Earned Coach` as a premium, source-grounded training assistant that combines approved public fitness knowledge with transparent analysis of a member's private training data. The Coach should prescribe useful next actions, explain its evidence, act proactively when meaningful patterns appear, and clearly communicate its limits.

The Coach is the first of three major Earned updates:

1. `Earned Coach`: member-facing coaching and the shared AI platform.
2. `Earned Ops Assistant`: internal support, content, and administration tools built on the same ingestion and retrieval stack.
3. `Earned Personalization Engine`: learned correlations, deeper periodization, and hybrid human-coach capabilities.

## Release Sequence

### Release 1: Core Coach

Release 1 includes:

- text-based `Ask Coach`, `Coach Review`, and `Coach Actions`
- first-use onboarding and a useful low-data empty state
- approved-source retrieval with inline citations and source previews
- provenance links for claims derived from private training data
- a deterministic progressive-overload recommendation engine
- a structured exercise equivalence graph for safe substitutions
- proactive in-app Coach triggers
- evidence-calibrated answer states
- limited Coach conversation memory with member controls
- a Coach Policy and Trust Center
- structured export of Coach analyses and recommendations

### Release 1.x: Form Check

Release 1.x adds asynchronous photo and video form review. It reuses the Release 1 Coach API, knowledge, policy, provenance, and evaluation layers.

### Release 2: Ops Assistant

Release 2 adds the internal support, content, and administration assistant. Form Check remains a member-facing Coach capability and is not duplicated in the Ops Assistant release.

### Release 3: Personalization and Hybrid Coaching

Release 3 adds learned readiness-to-performance correlations, adaptive Coach voice, periodization phase awareness, comparison insights, human-coach handoff, and deeper personalized planning.

Post-workout recap and the `Today` planner remain the next member-facing Coach surfaces after the core Coach. They must reuse the same APIs and evidence model.

## Existing Context

Earned already has workout history, readiness check-ins, PR tracking, goals, exercise library content, coaching-style analytics, and social features. The product can surface deterministic patterns but cannot yet answer high-quality freeform questions, prescribe progression consistently, or replace weak library guidance with verified external knowledge.

Release 1 should use a member's permitted training data by default. This behavior must not launch before Earned has an in-product explanation, usable data controls, and counsel-reviewed privacy, terms, and fitness-disclaimer language. Final project-wide legal pages may be polished later, but the Coach-specific disclosures and controls are a Release 1 gate.

## Architecture

Release 1 adds a server-side coaching platform with focused components:

- `Coach UI`: conversation, guided reviews, proactive cards, citations, evidence links, actions, onboarding, and trust controls.
- `Coach API`: authenticates the member, assembles permitted context, invokes retrieval and structured analyzers, applies policy, calls generation, and validates the response schema.
- `Private Data Adapter`: converts workouts, readiness, goals, PRs, notes, preferences, and exclusions into a versioned `member_context` payload.
- `Progression Engine`: deterministically produces a `progression_state` from recent performance, adherence, effort, readiness, and configured progression rules.
- `Exercise Equivalence Graph`: stores movement pattern, primary muscles, equipment, constraints, skill level, and substitution compatibility. The model selects from eligible graph results and cannot invent a replacement.
- `Knowledge Ingestion Pipeline`: fetches approved public sources, normalizes and chunks content, records provenance, embeds it, and refreshes the index on a schedule.
- `NVIDIA Retrieval and Generation Layer`: uses NVIDIA retrieval and generation capabilities, centered on the selected RAG blueprint and evaluated through `rag-eval`.
- `Coach Policy Layer`: controls permissible claims, citation requirements, safety behavior, evidence calibration, privacy rules, and fallback behavior.
- `Coach Memory Store`: retains short, member-visible conversation summaries and unresolved follow-ups. It is separate from raw chat history and respects deletion and exclusion controls.
- `Trigger Evaluator`: detects configured events such as a plateau, streak risk, possible PR opportunity, readiness mismatch, or accumulated-fatigue signal.
- `Trust and Audit Store`: records source versions, private-data references, response evidence, recommendation versions, and member data-control actions.

These boundaries allow the later Ops Assistant and Personalization Engine to reuse retrieval, evaluation, audit, and policy infrastructure without sharing member-facing business logic.

## Structured Context

The `member_context` payload should include only data the member has permitted:

- current goals and training experience
- current workout state: pre-workout, in-session, post-workout, or planning
- recent sessions, sets, reps, load, effort, completion, and PRs
- readiness inputs such as sleep, soreness, energy, and stress
- current plan and available equipment
- relevant member notes and limitations
- excluded dates, sessions, exercises, or other data points
- provenance identifiers that can deep-link back to the supporting Earned records

The `progression_state` should include:

- recent performance trend for the target exercise
- estimated strength trend when enough valid data exists
- adherence and completion trend
- readiness-adjusted next-session target
- recommended load, reps, sets, or hold decision
- the deterministic rule and supporting sessions used
- an evidence state explaining whether the recommendation is well supported

Release 1 uses transparent rules and rolling statistics rather than claiming to have trained a personalized model. Learned member-specific readiness correlations are deferred until enough consented, reliable data exists in Release 3.

## Request Flow

1. The member opens Coach, follows a proactive trigger, or starts a guided review.
2. The API authenticates the member and loads only permitted private context.
3. Structured analyzers produce progression, substitution, and pattern evidence.
4. Retrieval searches the approved external knowledge base for relevant guidance.
5. The policy layer decides which claims require citations, checks safety constraints, and assigns an evidence state.
6. The NVIDIA-backed generation step synthesizes the retrieved knowledge and structured member evidence into the required response schema.
7. The API validates citations, provenance identifiers, actions, and safety fields before returning the response.
8. The UI renders sourced guidance, member-specific patterns, recommendations, evidence limits, and actionable next steps.
9. The audit store records the evidence and source versions used, not hidden chain-of-thought.

If validation fails, Earned returns a limited safe response or a clear unavailable state. It does not display an unsupported generated answer.

## Product Behavior

### Context-Aware Entry

Coach suggestions adapt to the member's current mode:

- `Pre-workout`: review readiness, adjust today's target, or preview the plan.
- `In-session`: setup cues, load decisions, and eligible exercise swaps.
- `Post-workout`: Coach Review, recovery actions, and next-session implications.
- `Planning`: goals, schedule constraints, and longer-term plan questions.

The first screen shows a concise Coach summary, four to six relevant prompts, a `What I am using` data summary, recent proactive alerts, and a clear link to Coach trust and data controls.

### First-Use Onboarding

Members without enough history receive a short setup flow covering:

- primary goal
- training frequency and experience
- equipment access
- known limitations the member chooses to share
- advice preference, including a conservative default
- permission and data-use explanation

Members can skip onboarding. The Coach can then provide generic, source-grounded guidance, marks personalization as limited, and explains what data would improve the answer.

### Core Jobs

- `Ask Coach`: questions about form, plateaus, recovery, programming, substitutions, and goals.
- `Coach Review`: one-tap analysis of recent training, readiness, PRs, consistency, progression, and notable changes.
- `Coach Actions`: specific, reviewable actions such as update next-session load, keep the plan, choose an eligible substitution, lower intensity, or emphasize recovery.

Coach Actions that change a workout or plan require member confirmation. Suggestions never silently rewrite the plan.

### Answer Structure

Each answer uses the relevant parts of this schema:

- `Grounded Guidance`: approved-source claims with inline citation markers.
- `Your Pattern`: private-data findings with links to the supporting sessions and sets.
- `Recommendation`: a specific next action, including weight and reps when supported.
- `Why This Fits`: the relationship between the guidance, member evidence, and current training state.
- `Evidence and Limits`: a calibrated state and any missing or conflicting data.
- `Coach Actions`: optional confirmation-based updates that Earned can apply.

Citation markers open a source preview containing source name, relevant excerpt, publication or update date when available, and an external `Read more` link. Private-data provenance opens the relevant Earned record.

### Evidence-Calibrated UI

Earned does not show a model-generated confidence percentage. It derives one of these evidence states from observable conditions:

- `Well supported`: strong approved retrieval and sufficient consistent member data.
- `Partially supported`: useful evidence exists but member data or source coverage is incomplete.
- `Insufficient evidence`: the Coach cannot responsibly make a personalized recommendation.

Evidence state changes the card treatment, icon, and explanatory text. Color is never the only indicator, and no state tells a member to follow advice without judgment.

### Proactive Coach

Release 1 supports in-app triggers for:

- a likely plateau based on configured performance rules
- a streak at risk
- a possible PR opportunity
- readiness that conflicts with the scheduled workload
- an accumulated-fatigue or deload signal

Each trigger records the rule and evidence that fired it, deep-links into a preloaded Coach thread, and can be dismissed or muted. Push notifications require separate member opt-in and can follow after in-app behavior is validated.

### Coach Memory

Release 1 stores a concise summary of Coach decisions, member preferences, and unresolved follow-ups so later conversations have continuity. Members can inspect, edit, or delete this memory. Sensitive health inferences are not added automatically, and deleted or excluded source data must no longer influence future summaries.

### Comparison View

The data contract should support period-over-period comparisons, but the full comparison interface is deferred to Release 3. Release 1 may link provenance records for recent trend claims without building a separate analytics surface.

## Knowledge Strategy

The Coach uses approved public sources that are periodically refreshed and re-indexed. A source registry records:

- source owner and canonical URL
- approved topics and prohibited uses
- trust tier
- review owner
- refresh cadence
- content version and last successful ingest
- licensing or reuse notes

Failed refreshes retain the last known good index. Material source changes should enter review before replacing production content.

The Coach follows a hybrid reasoning model:

- approved retrieved sources support exercise, form, recovery, and training-principle claims
- deterministic Earned analyzers support progression, substitution, and private-data pattern claims
- model reasoning personalizes, summarizes, and connects those supplied facts
- missing or conflicting evidence is stated plainly

The model does not invent exercises, citations, user records, diagnoses, or progression evidence.

## Exercise Swap Intelligence

Substitution begins with a filtered graph query, not freeform generation. Candidates must satisfy required movement pattern, equipment availability, member exclusions, and safety constraints. They are ranked by intended stimulus, primary muscles, skill compatibility, and plan context.

The Coach explains what the swap preserves and what changes. If no acceptable candidate exists, it says so instead of returning a weak substitute.

## Progressive Overload

Release 1 prescribes specific next-session targets only when the progression rules have enough valid evidence. The initial engine should support configurable strategies such as:

- rep-range progression
- double progression
- fixed-increment load progression
- hold or reduce after missed targets
- readiness-adjusted hold or reduction

The engine must distinguish recommendations from observed facts, show the supporting sessions, cap changes conservatively, and let the member reject or edit the action. Velocity-based claims require actual velocity data; set duration or estimated tempo must not be mislabeled as bar velocity.

## Coach Policy and Trust Center

The Trust Center is a Release 1 launch requirement. It includes:

- what private data the Coach can use
- why each data category is used
- what the Coach can and cannot do
- approved knowledge sources, topic coverage, trust tier, and last refresh
- current Coach memory and recent evidence usage
- controls to exclude or re-include specific sessions, date ranges, exercises, and data categories
- deletion controls for Coach conversations, summaries, and generated analyses
- export of Coach analyses, recommendations, citations, and private-data provenance in a structured, human-readable report
- preference for conservative guidance

Experimental source tiers remain disabled in Release 1. Enabling them later requires a separate design and explicit opt-in; it cannot be represented as equivalent to approved guidance.

Coach entry and onboarding show concise, counsel-reviewed disclosures. The Trust Center provides the detailed explanation. Product copy must not claim medical expertise, injury diagnosis, guaranteed outcomes, or error-free recommendations.

## Safety and Guardrails

- Do not diagnose injuries, medical conditions, or causes of pain.
- Recommend stopping the relevant activity and seeking qualified care when user-reported symptoms indicate possible acute harm.
- Prefer conservative actions when fatigue, readiness, evidence quality, or source agreement is poor.
- Do not use absent data as if it were a negative response.
- Do not override strong member-specific evidence with generic guidance without explaining the conflict.
- Do not provide precise load prescriptions when history is insufficient or unreliable.
- Require confirmation before changing a workout, plan, goal, or stored preference.
- Gracefully degrade when NVIDIA, retrieval, or source services are unavailable.
- Treat uploaded media, readiness data, notes, and Coach memory according to the same access, deletion, and audit controls as other private member data.

## Release 1.x Form Check

Form Check adds a camera and file-upload path for supported exercises. A pose-estimation pipeline extracts observable features such as approximate joint positions, range of motion, rep timing, and movement consistency. The structured observations are sent to the Coach API alongside retrieved form guidance.

Form Check must:

- limit launch to exercises and camera angles that have passed validation
- run pose extraction on-device where practical
- disclose when media is uploaded or retained
- distinguish observable movement features from biomechanical or injury conclusions
- provide evidence overlays or frame references for cues
- allow users to delete uploaded media and derived observations
- return `unable to assess` when angle, visibility, lighting, or model quality is inadequate

The initial feature is post-set asynchronous review. Real-time audio cues are deferred until latency, device performance, privacy, exercise coverage, and false-cue safety have been separately validated. A single-camera estimate must not be described as exact joint loading, force, or bar velocity unless the required sensor data exists.

## Release 3 Extension Points

The Release 1 contracts should leave room for, but not implement:

- learned member-specific readiness and performance correlations
- goal-aware periodization phases such as base, build, peak, taper, and deload
- adaptive Coach voice based on explicit preference and current context
- period-over-period comparison narratives
- real-time on-device form cues
- human-coach accounts, handoff queues, review notes, and a marketplace

Human-coach handoff should use the same structured export and provenance model. A human reviewer must be able to distinguish member data, deterministic findings, retrieved knowledge, AI recommendations, and their own notes.

## Evaluation

`rag-eval` is part of the release gate, but retrieval quality alone is not enough. The evaluation suite should cover:

- source correctness and citation entailment
- private-data provenance correctness
- progression-rule correctness and conservative caps
- exercise-graph constraint compliance
- safety behavior and medical-boundary adherence
- evidence-state calibration
- actionability without unsupported precision
- onboarding and low-data behavior
- proactive-trigger precision and dismissal handling
- deletion and exclusion propagation
- outage and partial-failure behavior

The test set should include form, recovery, progression, plateaus, substitutions, goal planning, conflicting evidence, missing data, adversarial prompts, and known unsafe recommendations. Release thresholds must be defined in the implementation plan and measured before launch.

## Testing

Verification should include:

- UI state and accessibility checks for onboarding, answers, citations, provenance, evidence states, triggers, and Trust Center controls
- API authentication, authorization, schema, and failure-path tests
- deterministic unit tests for progression and exercise substitution
- retrieval and prompt-assembly tests
- source refresh, review, and last-known-good fallback tests
- memory, deletion, exclusion, and export tests
- trigger evaluator tests with false-positive and false-negative cases
- `rag-eval` benchmark runs against the approved evaluation set
- manual smoke tests for low-data, normal, conflicting-data, and service-unavailable journeys

Form Check adds device, camera-angle, exercise-coverage, pose-quality, deletion, and unsafe-cue evaluation before Release 1.x.

## Non-Goals for Release 1

Release 1 does not include:

- photo or video form analysis
- real-time form cues
- a learned per-member recovery model
- automated periodization
- experimental or open-web knowledge sources
- automatic plan changes without confirmation
- medical assessment
- human-coach marketplace or handoff
- push notifications before explicit opt-in and trigger validation

These exclusions keep the first release trustworthy and shippable while preserving clear interfaces for the premium capabilities that follow.
