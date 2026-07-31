# Earned Feature Improvement Swarm

Read `tooling/ruflo/swarm-playbook.md` first. It is the operating contract for this workflow.

## When To Use

Use this swarm to improve Today, Train, Progress, Records, History, Goals, Library, Feed, Premium conversion, or retention behavior through one bounded product change.

## Improvement Loop

1. Inspect the relevant workout tabs, shared navigation, existing UI patterns, and behavior coupling.
2. Rank at least three candidates by user impact, retention/Premium value, lower effort, and lower risk.
3. Select one bounded feature improvement with explicit acceptance criteria and a focused verifier.
4. Implement only the selected improvement; defer the next two candidates with their suggested swarm.
5. Run the safety gate before reporting the selected improvement ready.

## Agent Ownership

- Implementer Agent: owns the selected product change and names the exact files touched.
- Verifier Agent: runs the narrowest touched-area verifier first and expands to `pnpm run test:workout-ui`, `pnpm run test:ascii`, or `pnpm run test:iop` when the feature crosses those systems.
- Reviewer Agent: validates context, retention value, Premium fit, and adjacent-system consistency.

## Verification Order

1. Start with the focused verifier named by the selected improvement.
2. Add the relevant workout, ASCII, or IOP verifier for shared behavior.
3. Escalate to `pnpm run verify` for cross-feature coupling.
4. Escalate to `pnpm run build` for production confidence.

## Safety Gate

Do not call a feature ready when it regresses workout save, draft state, daily or weekly tracking, auth or sync, a touched-area verifier, or the build.

## Required Report

Return the full shared output contract, including ranked opportunities, the selected improvement, implementation state, the next two deferred candidates, and final `stop`, `fix`, or `proceed` recommendation.
