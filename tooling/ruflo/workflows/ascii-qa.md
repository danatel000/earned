# Earned ASCII Improvement Swarm

Read `tooling/ruflo/swarm-playbook.md` first. It is the operating contract for this workflow.

## When To Use

Use this swarm to improve the terminal-style experience, command-deck surfaces, launch motion, background density, responsive ASCII rendering, legibility, and reduced-motion behavior.

## Improvement Loop

1. Inspect the target ASCII surface across compact, standard, wide, and reduced-motion experiences.
2. Rank at least three candidates by training readability, visual value, lower effort, and lower risk.
3. Select one bounded visual improvement with explicit acceptance criteria and `pnpm run test:ascii` coverage.
4. Implement only the selected improvement; defer the next two candidates with their suggested swarm.
5. Run source and browser QA before reporting the selected improvement ready.

## Agent Ownership

- Implementer Agent: owns the selected ASCII or presentation change.
- Verifier Agent: runs `pnpm run test:ascii` before broader checks.
- Reviewer Agent: checks browser QA across compact, standard, and wide layouts and confirms animation never competes with active training controls.

## Verification Order

1. `pnpm run test:ascii`
2. `node scripts/qa-earned-ascii-browser.cjs <preview-url>`
3. `node scripts/qa-earned-forge-ascii-browser.cjs <preview-url>`

## Safety Gate

Do not call an ASCII improvement ready when it breaks a touched-area verifier, training-state readability, supported viewport layout, reduced-motion behavior, or the build.

## Required Report

Return the full shared output contract, including ranked opportunities, the selected improvement, implementation state, the next two deferred candidates, and final `stop`, `fix`, or `proceed` recommendation.
