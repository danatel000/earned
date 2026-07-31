# Earned Regression Improvement Swarm

Read `tooling/ruflo/swarm-playbook.md` first. It is the operating contract for this workflow.

## When To Use

Use this swarm to improve workout logging friction, draft recovery, skipped exercise behavior, daily or weekly tracking clarity, account trust, and cross-feature workout confidence.

## Improvement Loop

1. Inspect save, draft, skip, tracking mode, auth, and sync coupling points.
2. Rank at least three opportunities by user impact, business impact, lower effort, and lower risk.
3. Select one bounded improvement with acceptance criteria and `pnpm run test:workout-ui` coverage.
4. Implement only the selected improvement; defer the next two candidates with their suggested workflow.
5. Run the safety gate before reporting the selected improvement ready.

## Agent Ownership

- Implementer Agent: identifies coupling points and owns the selected improvement.
- Verifier Agent: runs focused-first Earned checks and records the first safety-gate failure clearly.
- Reviewer Agent: checks whether the recommendation protects user trust and whether deferred opportunities overlap.

## Verification Order

1. `pnpm run test:workout-ui`
2. `pnpm run test:ascii`
3. `pnpm run test:iop`
4. `pnpm run verify`
5. `pnpm run build`

## Safety Gate

Do not call an improvement ready when any of these fail:

- workout save or draft behavior
- daily or weekly tracking behavior
- auth or sync isolation
- a touched-area verifier
- production build

## Required Report

Return the full shared output contract, including ranked opportunities, the selected improvement, implementation state, the next two deferred candidates, and final `stop`, `fix`, or `proceed` recommendation.
