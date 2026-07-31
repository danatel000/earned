# Earned Ruflo Swarm Playbook Design

**Date:** 2026-07-26
**Scope:** Repo-local operating guidance for using Ruflo swarms to develop, verify, and review Earned safely.

## Goal

Define the default way Earned should use Ruflo swarms so multi-agent work improves delivery speed, regression safety, and depth of feature development without allowing uncontrolled parallel changes.

## Product Context

- Earned already has layered behavior across workout logging, daily/weekly tracking, progression systems, analytics surfaces, ASCII experiences, monetization UI, and account sync.
- The project already relies on a broad verifier surface, including focused scripts for ASCII, workout UI, monetization, and a larger repository-wide verification pass.
- The cost of a late regression is high because many user-facing systems share draft state, saved history, and computed training signals.
- Ruflo has already been installed as sidecar tooling under `tooling/ruflo/` rather than as part of the shipped browser runtime.

## Chosen Direction

Create a repo-local swarm playbook that defines:

- when Earned should use a swarm instead of a single-agent workflow
- which swarm modes are supported
- how work should be split between agents
- which findings must stop the run immediately
- what every swarm run must report before work is considered ready

The playbook is an operating guide, not a runtime dependency. It should shape how Ruflo is used around Earned rather than alter the product bundle.

## Supported Swarm Modes

### Regression Swarm

This is the highest-priority swarm mode for Earned.

Use it after medium or large changes that may affect:

- workout logging behavior
- draft state
- save and completion flows
- tracking mode behavior
- monetization and entitlement surfaces
- broader app verification confidence

The swarm should split implementation-adjacent checks, verifier coverage review, and regression classification so Earned catches breaking changes early.

### Feature Implementation Swarm

Use it for planned feature work that touches multiple files or systems and already has an approved design or implementation plan.

The swarm should separate:

- implementation
- verification selection and execution
- consistency review against adjacent Earned systems

This mode is for bounded product work, not open-ended invention.

### Analytics Consistency Swarm

Use it when changes touch progression, readiness, fatigue, recovery, goal forecasting, or other training-signal logic that can drift across screens or features.

The swarm should check:

- logic consistency
- UI consistency
- verifier coverage for changed calculations or rules

### ASCII QA Swarm

Use it when changes affect the terminal-style experience, command-deck surfaces, animation contracts, or responsive ASCII rendering.

The swarm should compare:

- source-level ASCII contracts
- browser QA observations
- layout behavior across compact, standard, and wide views

## When Not To Use A Swarm

- tiny one-file changes
- work blocked on a single unresolved product decision
- tightly coupled edits inside one file that have not been decomposed
- cleanup tasks where review overhead would exceed implementation effort

In those cases, a single-agent or direct workflow is more efficient and less noisy.

## Default Agent Roles

Each Earned swarm should use a small, disciplined split rather than a large cluster.

### Implementer Agent

Responsible for the bounded code or workflow change.

Owns:

- product file edits
- the minimum necessary implementation
- the first-pass targeted checks tied directly to the changed area

### Verifier Agent

Responsible for choosing and running the narrowest relevant Earned verification commands first, then escalating to broader repo checks when needed.

Owns:

- verifier selection
- command execution
- failure capture
- identifying whether a failure is new, pre-existing, or environment-induced

### Reviewer Agent

Responsible for consistency and regression review, especially across adjacent Earned systems.

Owns:

- checking neighboring product behavior
- identifying hidden coupling risks
- classifying findings as blocking or non-blocking

## Hard-Stop Policy

Earned swarms should stop by default when a likely regression appears in any load-bearing area.

### Immediate Stop Conditions

- workout save regressions
- draft-state regressions
- daily/weekly tracking regressions
- auth or sync regressions
- build regressions
- verifier failures tied to touched areas

If any of these appear, the swarm should stop forward progress, surface the exact failing area, and switch into fix-or-revert mode rather than continuing feature expansion.

### Continue Conditions

The swarm may continue parallel work only when findings are clearly non-blocking, such as:

- cosmetic presentation issues
- copy cleanup
- isolated follow-up improvements with no behavior change

These findings still need to be reported, but they should not stop a valid feature pass.

## Output Contract

Every Earned Ruflo swarm run should report the same minimum output:

- files changed or inspected
- commands run
- verifier results
- blocking findings
- deferred non-blocking findings
- final recommendation: stop, fix, or proceed

This report should be compact, consistent, and good enough for the next session to understand what happened without replaying the whole swarm.

## File Strategy

The playbook should live under `tooling/ruflo/` and become the reference for future workflow refinement.

The first implementation should likely add:

- one playbook document that defines the supported swarm modes and stop rules
- optional updates to the existing workflow documents so they reference the playbook
- optional README updates if the playbook becomes part of the normal operating entrypoint

## Non-Goals

- No Ruflo runtime code added to the shipped React client
- No autonomous background editing without an explicit user-triggered run
- No attempt to run large, uncontrolled agent clusters
- No replacement of Earned's existing verifier scripts
- No weakening of existing regression standards to increase swarm throughput

## Testing And Verification

The playbook implementation should be verified by:

- confirming the playbook file exists in the Ruflo tooling area
- confirming supported workflow docs reference the playbook where appropriate
- confirming the guidance matches the existing Earned verifier surface and sidecar-tooling boundary

## Open Constraint

The shell environment in this workspace still has two execution constraints:

- git is not currently resolving this directory as a valid repository
- `node` is not on `PATH` by default for repo scripts unless the bundled Codex runtime path is injected

The playbook should reflect Earned workflow reality, but implementation must remain compatible with those current environment limits until they are repaired.
