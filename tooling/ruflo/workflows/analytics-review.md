# Earned Analytics Improvement Swarm

Read `tooling/ruflo/swarm-playbook.md` first. It is the operating contract for this workflow.

## When To Use

Use this swarm to improve progression, overload, PR visibility, readiness, fatigue, recovery, training quality, and goal forecast usefulness.

## Improvement Loop

1. Inspect analytics calculations, their source data, and every screen that exposes the same signal.
2. Rank at least three opportunities by training usefulness, business value, lower effort, and lower risk.
3. Select one bounded insight improvement with acceptance criteria and focused analytics verifier coverage.
4. Implement only the selected improvement; preserve the next two candidates for later analytics or feature work.
5. Run the safety gate before reporting the selected improvement ready.

## Agent Ownership

- Implementer Agent: owns the selected calculation, rules, or insight presentation improvement.
- Verifier Agent: runs `pnpm run test:iop` plus the narrow analytics, progression, readiness, or recovery verifiers tied to the change.
- Reviewer Agent: compares training-signal consistency and ranks the next best opportunities.

## Review Focus

Check:

1. progression and overload usefulness
2. readiness and recovery explanations
3. fatigue and training-quality context
4. goal forecast confidence and actionability
5. verifier coverage for changed calculations or rules

## Safety Gate

Stop readiness claims for the selected improvement when a touched-area verifier fails, two surfaces produce contradictory user guidance, or the production build fails.

## Required Report

Return the full shared output contract, including ranked opportunities, the selected improvement, implementation state, the next two deferred candidates, and final `stop`, `fix`, or `proceed` recommendation.
