# Earned Ruflo Tooling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Ruflo as sidecar development tooling for Earned so project workflows can orchestrate existing verification and QA tasks without adding Ruflo to the shipped browser runtime.

**Architecture:** Ruflo lives in a dedicated repo-local tooling directory with its own setup, workflow definitions, and documentation. Earned remains a standard Vite/React app, and Ruflo interacts with it only through scripts, commands, and workspace files rather than runtime imports from `src/`.

**Tech Stack:** Node.js, pnpm, Vite, React, Ruflo CLI, Markdown docs, PowerShell

## Global Constraints

- Development tooling and automation for the Earned project. This does not change the shipped browser bundle.
- Adopt Ruflo in a way that improves Earned across workout logging, progression logic, analytics work, and the ASCII experience without coupling the product runtime to an agent harness.
- Use Ruflo as a sidecar engineering layer around Earned rather than embedding it into the application itself.
- No Ruflo dependency is added to the browser bundle in the first implementation.
- No user-facing feature in Earned should require a Ruflo daemon, worker, or MCP server to function.
- Prefer the full Ruflo CLI initialization path over the lite plugin-only path because the full path is the one documented to provide the broader server, hooks, memory, and workflow capabilities.
- Keep that installation scoped to the tooling area rather than mixing it into `src`, `public`, or app runtime dependencies.
- Ruflo should orchestrate the current scripts rather than duplicating their logic. Existing checks such as `test:ascii`, `test:workout-ui`, `test:iop`, `verify`, and `build` remain the source of truth for project verification.
- A Ruflo setup failure must not block local app development with `pnpm run dev`.
- If Ruflo is unavailable, Earned still builds, runs, and verifies through its existing scripts.
- Do not create background automation that mutates product files without an explicit user-triggered workflow.
- No direct Ruflo import into the shipped React client.
- No replacement of Earned's existing verification scripts.
- No new backend, daemon, or cloud service required for end users.

---

## File Structure

- Create: `tooling/ruflo/`
Purpose: dedicated sidecar workspace for Ruflo-owned initialization output, workflow config, and project documentation.

- Create: `tooling/ruflo/README.md`
Purpose: explain why Ruflo exists in Earned, how to initialize or refresh it, and how to run the supported project workflows.

- Create: `tooling/ruflo/workflows/`
Purpose: store small, project-scoped workflow definitions for feature execution, verification, analytics review, and ASCII QA.

- Create: `tooling/ruflo/workflows/feature-implementation.md`
Purpose: define the repeatable feature implementation workflow against Earned.

- Create: `tooling/ruflo/workflows/regression-verification.md`
Purpose: define the workflow that runs existing Earned verification and build commands.

- Create: `tooling/ruflo/workflows/analytics-review.md`
Purpose: define the workflow for progression, analytics, readiness, and recommendation review tasks.

- Create: `tooling/ruflo/workflows/ascii-qa.md`
Purpose: define the workflow for ASCII-specific verification and browser QA entrypoints.

- Create: `scripts/run-ruflo-workflow.mjs`
Purpose: provide a stable local command wrapper that validates workflow names, resolves paths, and invokes Ruflo from the sidecar directory without leaking setup details into the rest of the repo.

- Modify: `package.json`
Purpose: add explicit `ruflo:*` scripts that call the wrapper and keep Ruflo usage discoverable without affecting normal app scripts.

- Optional create if needed by Ruflo init: `tooling/ruflo/package.json`
Purpose: isolate tooling-only package metadata from the main app package if the CLI or wrapper benefits from a dedicated package root.

### Task 1: Establish Ruflo Sidecar Workspace

**Files:**
- Create: `tooling/ruflo/README.md`
- Create: `tooling/ruflo/workflows/.gitkeep`
- Optional create: `tooling/ruflo/package.json`

**Interfaces:**
- Consumes: approved design in `docs/superpowers/specs/2026-07-25-earned-ruflo-tooling-design.md`
- Produces: sidecar directory contract rooted at `tooling/ruflo/` for all later Ruflo files

- [ ] **Step 1: Write the failing structure check**

Create a quick Node assertion script in a temp file to prove the sidecar paths do not exist yet:

```js
import { existsSync } from "node:fs";

const required = [
  "tooling/ruflo",
  "tooling/ruflo/README.md",
  "tooling/ruflo/workflows",
];

for (const entry of required) {
  if (existsSync(entry)) {
    throw new Error(`Expected ${entry} to be absent before setup`);
  }
}
```

- [ ] **Step 2: Run the structure check to verify it fails**

Run: `@'import { existsSync } from "node:fs"; const required = ["tooling/ruflo","tooling/ruflo/README.md","tooling/ruflo/workflows"]; for (const entry of required) { if (existsSync(entry)) { throw new Error(\`Expected ${entry} to be absent before setup\`); } }'@ | node --input-type=module -`

Expected: PASS with no output, confirming the sidecar has not been created yet.

- [ ] **Step 3: Create the minimal sidecar workspace**

Create `tooling/ruflo/README.md` with:

```md
# Earned Ruflo Tooling

This directory contains Ruflo sidecar tooling for the Earned project.

Ruflo is used here for development workflows only. Nothing in this directory is imported by the shipped React application.
```

Create `tooling/ruflo/workflows/.gitkeep` as an empty file.

If a local package boundary is useful, create `tooling/ruflo/package.json` with:

```json
{
  "name": "earned-ruflo-tooling",
  "private": true,
  "type": "module"
}
```

- [ ] **Step 4: Run the structure check to verify it passes**

Run: `@'import { existsSync } from "node:fs"; const required = ["tooling/ruflo","tooling/ruflo/README.md","tooling/ruflo/workflows"]; for (const entry of required) { if (!existsSync(entry)) { throw new Error(\`Expected ${entry} to exist after setup\`); } }'@ | node --input-type=module -`

Expected: PASS with no output.

- [ ] **Step 5: Commit**

```bash
git add tooling/ruflo
git commit -m "chore: create ruflo sidecar workspace"
```

### Task 2: Initialize Ruflo in the Sidecar Directory

**Files:**
- Modify: `tooling/ruflo/README.md`
- Create or modify: Ruflo-owned init output under `tooling/ruflo/`

**Interfaces:**
- Consumes: sidecar workspace rooted at `tooling/ruflo/`
- Produces: initialized Ruflo workspace confined to `tooling/ruflo/` and documented bootstrap steps in `tooling/ruflo/README.md`

- [ ] **Step 1: Write the failing initialization expectation**

Add a temporary assertion command that expects no Ruflo initialization markers yet:

```js
import { existsSync } from "node:fs";

const markers = [
  "tooling/ruflo/.claude-flow",
  "tooling/ruflo/.claude",
];

if (markers.some((entry) => existsSync(entry))) {
  throw new Error("Expected Ruflo init markers to be absent before initialization");
}
```

- [ ] **Step 2: Run the initialization expectation**

Run: `@'import { existsSync } from "node:fs"; const markers = ["tooling/ruflo/.claude-flow","tooling/ruflo/.claude"]; if (markers.some((entry) => existsSync(entry))) { throw new Error("Expected Ruflo init markers to be absent before initialization"); }'@ | node --input-type=module -`

Expected: PASS with no output.

- [ ] **Step 3: Perform the minimal Ruflo initialization in the sidecar**

From `tooling/ruflo`, run the full-init Ruflo command documented upstream, using the safest non-global path available in the environment. Prefer:

```bash
npx ruflo@latest init wizard
```

If the initializer prompts for workspace-local files, keep every generated file inside `tooling/ruflo/`.

Then expand `tooling/ruflo/README.md` to document:

```md
## Initialization

Initialize or refresh Ruflo from this directory:

```bash
cd tooling/ruflo
npx ruflo@latest init wizard
```

Keep all generated files inside `tooling/ruflo/`. Do not move Ruflo runtime files into `src/`, `public/`, or the top-level app package.
```

- [ ] **Step 4: Verify initialization markers exist**

Run: `@'import { existsSync } from "node:fs"; const markers = ["tooling/ruflo/.claude-flow","tooling/ruflo/.claude"]; if (!markers.some((entry) => existsSync(entry))) { throw new Error("Expected at least one Ruflo init marker after initialization"); }'@ | node --input-type=module -`

Expected: PASS with no output.

- [ ] **Step 5: Commit**

```bash
git add tooling/ruflo
git commit -m "chore: initialize ruflo tooling"
```

### Task 3: Add Project Workflow Definitions

**Files:**
- Create: `tooling/ruflo/workflows/feature-implementation.md`
- Create: `tooling/ruflo/workflows/regression-verification.md`
- Create: `tooling/ruflo/workflows/analytics-review.md`
- Create: `tooling/ruflo/workflows/ascii-qa.md`

**Interfaces:**
- Consumes: initialized sidecar workspace in `tooling/ruflo/`
- Produces: four named workflow documents referenced by the wrapper and package scripts

- [ ] **Step 1: Write the failing workflow inventory check**

Prepare a quick check that fails when the workflow files are missing:

```js
import { existsSync } from "node:fs";

const required = [
  "tooling/ruflo/workflows/feature-implementation.md",
  "tooling/ruflo/workflows/regression-verification.md",
  "tooling/ruflo/workflows/analytics-review.md",
  "tooling/ruflo/workflows/ascii-qa.md",
];

for (const entry of required) {
  if (!existsSync(entry)) {
    throw new Error(`Missing workflow file: ${entry}`);
  }
}
```

- [ ] **Step 2: Run the workflow inventory check to verify it fails**

Run: `@'import { existsSync } from "node:fs"; const required = ["tooling/ruflo/workflows/feature-implementation.md","tooling/ruflo/workflows/regression-verification.md","tooling/ruflo/workflows/analytics-review.md","tooling/ruflo/workflows/ascii-qa.md"]; for (const entry of required) { if (!existsSync(entry)) { throw new Error(\`Missing workflow file: ${entry}\`); } }'@ | node --input-type=module -`

Expected: FAIL with `Missing workflow file`.

- [ ] **Step 3: Write the workflow definitions**

Create `tooling/ruflo/workflows/feature-implementation.md`:

```md
# Earned Feature Implementation Workflow

1. Read the relevant design spec and implementation plan in `docs/superpowers/`.
2. Identify the exact product files that will change.
3. Prefer existing verification scripts over ad hoc checks.
4. Make the smallest testable change.
5. Run the narrowest relevant verification command.
6. Summarize the changed files, verification result, and remaining risks.
```

Create `tooling/ruflo/workflows/regression-verification.md`:

```md
# Earned Regression Verification Workflow

Run the existing project verification commands in this order when relevant:

1. `pnpm run test:workout-ui`
2. `pnpm run test:ascii`
3. `pnpm run test:iop`
4. `pnpm run verify`
5. `pnpm run build`

Stop on first failure and report the exact failing command.
```

Create `tooling/ruflo/workflows/analytics-review.md`:

```md
# Earned Analytics Review Workflow

Focus review on:

1. progression and overload logic
2. readiness and recovery interactions
3. fatigue and training-quality signals
4. goal forecast consistency

When code changes are proposed, run `pnpm run test:iop` and any narrower verifier tied to the touched feature.
```

Create `tooling/ruflo/workflows/ascii-qa.md`:

```md
# Earned ASCII QA Workflow

Use these commands for ASCII-oriented work:

1. `pnpm run test:ascii`
2. `node scripts/qa-earned-ascii-browser.cjs <preview-url>`
3. `node scripts/qa-earned-forge-ascii-browser.cjs <preview-url>`

Check compact, standard, and wide layouts, and report motion or rendering regressions explicitly.
```

- [ ] **Step 4: Run the workflow inventory check to verify it passes**

Run: `@'import { existsSync } from "node:fs"; const required = ["tooling/ruflo/workflows/feature-implementation.md","tooling/ruflo/workflows/regression-verification.md","tooling/ruflo/workflows/analytics-review.md","tooling/ruflo/workflows/ascii-qa.md"]; for (const entry of required) { if (!existsSync(entry)) { throw new Error(\`Missing workflow file: ${entry}\`); } }'@ | node --input-type=module -`

Expected: PASS with no output.

- [ ] **Step 5: Commit**

```bash
git add tooling/ruflo/workflows
git commit -m "feat: add earned ruflo workflows"
```

### Task 4: Add a Stable Ruflo Workflow Runner

**Files:**
- Create: `scripts/run-ruflo-workflow.mjs`

**Interfaces:**
- Consumes: workflow names `feature-implementation | regression-verification | analytics-review | ascii-qa`
- Produces: CLI entrypoint `node scripts/run-ruflo-workflow.mjs <workflow-name>` with exit code `0 | 1`

- [ ] **Step 1: Write the failing runner test**

Create a new inline test case that describes the required interface:

```js
import assert from "node:assert/strict";
import { resolveWorkflowPath } from "./scripts/run-ruflo-workflow.mjs";

assert.equal(
  resolveWorkflowPath("ascii-qa").endsWith("tooling/ruflo/workflows/ascii-qa.md"),
  true,
);

assert.throws(() => resolveWorkflowPath("missing"), /Unknown Ruflo workflow/);
```

- [ ] **Step 2: Run the runner test to verify it fails**

Run: `@'import assert from "node:assert/strict"; const { resolveWorkflowPath } = await import("./scripts/run-ruflo-workflow.mjs"); assert.equal(resolveWorkflowPath("ascii-qa").endsWith("tooling/ruflo/workflows/ascii-qa.md"), true); assert.throws(() => resolveWorkflowPath("missing"), /Unknown Ruflo workflow/);'@ | node --input-type=module -`

Expected: FAIL because `scripts/run-ruflo-workflow.mjs` does not exist yet.

- [ ] **Step 3: Write the minimal runner implementation**

Create `scripts/run-ruflo-workflow.mjs` with:

```js
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const WORKFLOW_NAMES = new Map([
  ["feature-implementation", "tooling/ruflo/workflows/feature-implementation.md"],
  ["regression-verification", "tooling/ruflo/workflows/regression-verification.md"],
  ["analytics-review", "tooling/ruflo/workflows/analytics-review.md"],
  ["ascii-qa", "tooling/ruflo/workflows/ascii-qa.md"],
]);

export function resolveWorkflowPath(name) {
  const relative = WORKFLOW_NAMES.get(name);
  if (!relative) {
    throw new Error(`Unknown Ruflo workflow: ${name}`);
  }

  return resolve(relative);
}

function main() {
  const workflowName = process.argv[2];

  if (!workflowName) {
    console.error("Usage: node scripts/run-ruflo-workflow.mjs <workflow-name>");
    process.exit(1);
  }

  const workflowPath = resolveWorkflowPath(workflowName);
  if (!existsSync(workflowPath)) {
    console.error(`Workflow file not found: ${workflowPath}`);
    process.exit(1);
  }

  const result = spawnSync(
    "npx",
    ["ruflo@latest", "run", workflowPath],
    {
      cwd: resolve("tooling/ruflo"),
      stdio: "inherit",
      shell: true,
    },
  );

  process.exit(result.status ?? 1);
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  main();
}
```

- [ ] **Step 4: Run the runner test to verify it passes**

Run: `@'import assert from "node:assert/strict"; const { resolveWorkflowPath } = await import("./scripts/run-ruflo-workflow.mjs"); assert.equal(resolveWorkflowPath("ascii-qa").endsWith("tooling\\ruflo\\workflows\\ascii-qa.md") || resolveWorkflowPath("ascii-qa").endsWith("tooling/ruflo/workflows/ascii-qa.md"), true); assert.throws(() => resolveWorkflowPath("missing"), /Unknown Ruflo workflow/);'@ | node --input-type=module -`

Expected: PASS with no output.

- [ ] **Step 5: Commit**

```bash
git add scripts/run-ruflo-workflow.mjs
git commit -m "feat: add ruflo workflow runner"
```

### Task 5: Expose Ruflo Workflows Through Package Scripts

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: `node scripts/run-ruflo-workflow.mjs <workflow-name>`
- Produces: npm scripts `ruflo:feature`, `ruflo:verify`, `ruflo:analytics`, `ruflo:ascii`

- [ ] **Step 1: Write the failing package script test**

Create an inline assertion for the script contract:

```js
import assert from "node:assert/strict";
import pkg from "./package.json" with { type: "json" };

assert.equal(pkg.scripts["ruflo:feature"], "node scripts/run-ruflo-workflow.mjs feature-implementation");
assert.equal(pkg.scripts["ruflo:verify"], "node scripts/run-ruflo-workflow.mjs regression-verification");
assert.equal(pkg.scripts["ruflo:analytics"], "node scripts/run-ruflo-workflow.mjs analytics-review");
assert.equal(pkg.scripts["ruflo:ascii"], "node scripts/run-ruflo-workflow.mjs ascii-qa");
```

- [ ] **Step 2: Run the package script test to verify it fails**

Run: `@'import assert from "node:assert/strict"; const pkg = JSON.parse(await (await import("node:fs/promises")).readFile("package.json", "utf8")); assert.equal(pkg.scripts["ruflo:feature"], "node scripts/run-ruflo-workflow.mjs feature-implementation"); assert.equal(pkg.scripts["ruflo:verify"], "node scripts/run-ruflo-workflow.mjs regression-verification"); assert.equal(pkg.scripts["ruflo:analytics"], "node scripts/run-ruflo-workflow.mjs analytics-review"); assert.equal(pkg.scripts["ruflo:ascii"], "node scripts/run-ruflo-workflow.mjs ascii-qa");'@ | node --input-type=module -`

Expected: FAIL because the scripts are not defined yet.

- [ ] **Step 3: Add the minimal package scripts**

Modify `package.json` to add:

```json
{
  "scripts": {
    "ruflo:feature": "node scripts/run-ruflo-workflow.mjs feature-implementation",
    "ruflo:verify": "node scripts/run-ruflo-workflow.mjs regression-verification",
    "ruflo:analytics": "node scripts/run-ruflo-workflow.mjs analytics-review",
    "ruflo:ascii": "node scripts/run-ruflo-workflow.mjs ascii-qa"
  }
}
```

Keep all existing scripts unchanged.

- [ ] **Step 4: Run the package script test to verify it passes**

Run: `@'import assert from "node:assert/strict"; const pkg = JSON.parse(await (await import("node:fs/promises")).readFile("package.json", "utf8")); assert.equal(pkg.scripts["ruflo:feature"], "node scripts/run-ruflo-workflow.mjs feature-implementation"); assert.equal(pkg.scripts["ruflo:verify"], "node scripts/run-ruflo-workflow.mjs regression-verification"); assert.equal(pkg.scripts["ruflo:analytics"], "node scripts/run-ruflo-workflow.mjs analytics-review"); assert.equal(pkg.scripts["ruflo:ascii"], "node scripts/run-ruflo-workflow.mjs ascii-qa");'@ | node --input-type=module -`

Expected: PASS with no output.

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "chore: add ruflo package scripts"
```

### Task 6: Document Supported Earned Usage

**Files:**
- Modify: `tooling/ruflo/README.md`

**Interfaces:**
- Consumes: package scripts `ruflo:feature | ruflo:verify | ruflo:analytics | ruflo:ascii`
- Produces: documented usage examples and safety rules for engineers using Ruflo in this repo

- [ ] **Step 1: Write the failing documentation content test**

Define the required README sections:

```js
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const readme = readFileSync("tooling/ruflo/README.md", "utf8");

assert.match(readme, /## Initialization/);
assert.match(readme, /## Workflows/);
assert.match(readme, /pnpm run ruflo:verify/);
assert.match(readme, /Nothing in this directory is imported by the shipped React application/);
```

- [ ] **Step 2: Run the documentation content test to verify it fails**

Run: `@'import { readFileSync } from "node:fs"; import assert from "node:assert/strict"; const readme = readFileSync("tooling/ruflo/README.md", "utf8"); assert.match(readme, /## Initialization/); assert.match(readme, /## Workflows/); assert.match(readme, /pnpm run ruflo:verify/); assert.match(readme, /Nothing in this directory is imported by the shipped React application/);'@ | node --input-type=module -`

Expected: FAIL until the README is expanded.

- [ ] **Step 3: Expand the README with project usage**

Append these sections to `tooling/ruflo/README.md`:

```md
## Initialization

From this directory:

```bash
cd tooling/ruflo
npx ruflo@latest init wizard
```

Keep all generated Ruflo files inside `tooling/ruflo/`.

## Workflows

- `pnpm run ruflo:feature`
- `pnpm run ruflo:verify`
- `pnpm run ruflo:analytics`
- `pnpm run ruflo:ascii`

## Safety Rules

- Nothing in this directory is imported by the shipped React application.
- Earned must still run with `pnpm run dev`, `pnpm run verify`, and `pnpm run build` even if Ruflo is unavailable.
- Use existing project scripts as the verification source of truth.
```

- [ ] **Step 4: Run the documentation content test to verify it passes**

Run: `@'import { readFileSync } from "node:fs"; import assert from "node:assert/strict"; const readme = readFileSync("tooling/ruflo/README.md", "utf8"); assert.match(readme, /## Initialization/); assert.match(readme, /## Workflows/); assert.match(readme, /pnpm run ruflo:verify/); assert.match(readme, /Nothing in this directory is imported by the shipped React application/);'@ | node --input-type=module -`

Expected: PASS with no output.

- [ ] **Step 5: Commit**

```bash
git add tooling/ruflo/README.md
git commit -m "docs: document earned ruflo usage"
```

### Task 7: Verify Earned Still Works Without Ruflo Runtime Coupling

**Files:**
- Test: `package.json`
- Test: `scripts/run-ruflo-workflow.mjs`
- Test: `tooling/ruflo/workflows/*.md`

**Interfaces:**
- Consumes: existing project scripts `test:ascii | test:workout-ui | verify | build`
- Produces: evidence that core Earned commands still work and Ruflo-specific commands stay isolated

- [ ] **Step 1: Write the failing verification checklist**

Record the exact command matrix to run:

```text
pnpm run test:workout-ui
pnpm run test:ascii
pnpm run verify
pnpm run build
```

The task fails if any command depends on importing Ruflo into the browser app or if any command breaks because Ruflo is not running.

- [ ] **Step 2: Run the narrow product verification**

Run: `pnpm run test:workout-ui`

Expected: PASS.

- [ ] **Step 3: Run the ASCII verification**

Run: `pnpm run test:ascii`

Expected: PASS.

- [ ] **Step 4: Run the broad product verification**

Run: `pnpm run verify`

Expected: PASS.

- [ ] **Step 5: Run the production build**

Run: `pnpm run build`

Expected: PASS and emit the production `dist` output without any Ruflo runtime import errors.

- [ ] **Step 6: Commit**

```bash
git add package.json scripts/run-ruflo-workflow.mjs tooling/ruflo
git commit -m "test: verify earned ruflo tooling isolation"
```

## Self-Review

### Spec Coverage

- Sidecar tooling boundary: covered by Tasks 1 and 2.
- Full Ruflo CLI path in tooling scope: covered by Task 2.
- Project-specific workflows: covered by Task 3.
- Existing script reuse: covered by Tasks 3, 5, and 7.
- Documentation and safety rules: covered by Task 6.
- Verification that Earned still works independently: covered by Task 7.

No uncovered spec requirements remain.

### Placeholder Scan

- No `TODO`, `TBD`, or deferred implementation markers remain.
- Each task includes explicit file targets, commands, and expected outcomes.

### Type Consistency

- Workflow names are consistent across Tasks 3, 4, 5, and 6:
  - `feature-implementation`
  - `regression-verification`
  - `analytics-review`
  - `ascii-qa`
- Package scripts consistently map to the runner entrypoint:
  - `ruflo:feature`
  - `ruflo:verify`
  - `ruflo:analytics`
  - `ruflo:ascii`

