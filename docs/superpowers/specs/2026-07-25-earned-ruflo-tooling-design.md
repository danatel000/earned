# Earned Ruflo Tooling Design

**Date:** 2026-07-25
**Scope:** Development tooling and automation for the Earned project. This does not change the shipped browser bundle.

## Goal

Adopt Ruflo in a way that improves Earned across workout logging, progression logic, analytics work, and the ASCII experience without coupling the product runtime to an agent harness.

## Repository Findings

- Earned is a Vite + React application with a direct browser-focused dependency graph.
- The app already has focused verification scripts for launch, ASCII behavior, workout UI, monetization, and broader verification.
- The project structure is product-code centric rather than infrastructure heavy.
- Ruflo is documented upstream as an agent meta-harness with orchestration, memory, workers, hooks, and MCP tooling rather than a frontend runtime library.
- The upstream project exposes a lighter plugin path and a fuller CLI path; the fuller path is the one documented for full production capability.

## Chosen Direction

Use Ruflo as a sidecar engineering layer around Earned rather than embedding it into the application itself.

Ruflo should live in a dedicated tooling workspace inside this repository, with its own configuration and workflow files. It may inspect, analyze, and automate work against Earned, but no Ruflo runtime code should be imported into the shipped React bundle unless a later design explicitly justifies it.

This keeps the browser app stable while still allowing Ruflo to coordinate repeatable engineering workflows.

## Architecture

### Tooling Boundary

- Create a repo-local tooling area dedicated to Ruflo.
- Treat that area as automation infrastructure, not product code.
- Keep all app-facing integration through files, scripts, and workflow entrypoints rather than runtime imports in `src/`.

### Earned as Target Project

Ruflo should target the existing Earned workspace for:

- feature-task orchestration
- regression workflow execution
- project memory and design recall
- multi-step review flows
- repeatable QA tasks

### Product Runtime Boundary

- No Ruflo dependency is added to the browser bundle in the first implementation.
- No user-facing feature in Earned should require a Ruflo daemon, worker, or MCP server to function.
- If future product features want harness-backed services, that must be handled as a separate backend or tooling design, not folded into this adoption by default.

## Primary Workflow Targets

### Workout Logging Workflow

Use Ruflo to coordinate feature work and regression checks around:

- draft state behavior
- set editing and quick adjustments
- section skip and save behavior
- completion guard and save flows
- recent-history and active-exercise UX checks

### Progression and Recommendation Workflow

Use Ruflo to structure analysis and change review around:

- overload recommendation logic
- readiness and recovery interactions
- fatigue and training-quality signals
- goal forecasting consistency
- regression checks when recommendation rules change

### Analytics and Product Planning Workflow

Use Ruflo memory and reusable workflows for:

- preserving product decisions across sessions
- comparing planned analytics surfaces
- coordinating dashboard-oriented implementation tasks
- detecting verification gaps before broader UI changes land

### ASCII Experience Workflow

Use Ruflo to support:

- ASCII rendering QA tasks
- focused regression runs for command-deck and console behavior
- responsive review across compact, standard, and wide layouts
- reusable investigation workflows when visual or behavioral regressions appear

## Implementation Shape

### Installation Strategy

- Prefer the full Ruflo CLI initialization path over the lite plugin-only path because the full path is the one documented to provide the broader server, hooks, memory, and workflow capabilities.
- Keep that installation scoped to the tooling area rather than mixing it into `src`, `public`, or app runtime dependencies.

### Project-Specific Setup

Create project-facing Ruflo workflows that map to Earned's real engineering needs:

- feature implementation workflow
- regression and verification workflow
- analytics and recommendation review workflow
- ASCII QA workflow

Each workflow should call existing repo scripts where possible instead of replacing them.

### Existing Script Reuse

Ruflo should orchestrate the current scripts rather than duplicating their logic. Existing checks such as `test:ascii`, `test:workout-ui`, `test:iop`, `verify`, and `build` remain the source of truth for project verification.

## File Strategy

The first implementation should aim for:

- one tooling directory for Ruflo-owned files
- one project readme describing how Earned uses Ruflo
- a small set of project-specific workflow definitions
- optional thin wrapper scripts only where they simplify repeatable invocation

No application state, Supabase schema, or client persistence format changes are part of this design.

## Error Handling and Safety

- A Ruflo setup failure must not block local app development with `pnpm run dev`.
- If Ruflo is unavailable, Earned still builds, runs, and verifies through its existing scripts.
- Workflow files should fail loudly and point back to the underlying project script or command that failed.
- Do not create background automation that mutates product files without an explicit user-triggered workflow.

## Testing and Verification

The implementation should be verified by:

- confirming Ruflo installs cleanly in the tooling area
- confirming the intended project workflows can locate and operate on the Earned workspace
- running at least one focused workflow against existing verification scripts
- confirming the normal app build still succeeds without requiring Ruflo at runtime

## Non-Goals

- No direct Ruflo import into the shipped React client
- No replacement of Earned's existing verification scripts
- No new backend, daemon, or cloud service required for end users
- No automatic expansion into every possible Ruflo plugin on day one
- No product-feature promise that depends on autonomous background agents

## Open Constraint

The current workspace shell does not recognize this directory as a valid git repository even though a `.git` entry is present. The design document can be written locally, but committing it may require repository-state repair or confirmation of the intended git root before implementation begins.
