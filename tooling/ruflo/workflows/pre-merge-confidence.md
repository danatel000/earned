# Earned Pre-Merge Improvement Swarm

Read `tooling/ruflo/swarm-playbook.md` first. It is the operating contract for this workflow.

## When To Use

Use this swarm after a batch of changes lands to consolidate duplicate findings, inspect delivery quality, and recommend the next bounded improvement before more work builds on top of the branch.

## Improvement Loop

1. Inspect touched areas, earlier swarm reports, unresolved risks, and available focused verifiers.
2. Rank at least three delivery or product opportunities by user impact, business value, lower effort, and lower risk.
3. Select one next bounded improvement and its owning workflow; do not make unrelated product edits in this confidence pass.
4. Defer the next two candidates and collapse duplicates or overlaps.
5. Run touched-area checks, broad verification, and the production build before reporting confidence.

## Agent Ownership

- Implementer Agent: summarizes touched areas, selected improvements, and unresolved risks.
- Verifier Agent: runs focused checks first, then `pnpm run verify`, then `pnpm run build`.
- Reviewer Agent: consolidates opportunity overlap and recommends the highest-value next workflow.

## Safety Gate

Do not recommend building on the batch when a touched-area verifier, production build, workout save, draft, tracking, or auth/sync behavior regresses.

## Required Report

Return the full shared output contract, including ranked opportunities, the selected next improvement, deferred candidates, safety-gate status, and final `stop`, `fix`, or `proceed` recommendation.
