import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  buildWorkflowRunPlan,
  createWorkflowReport,
  getWorkflowImprovementLens,
  rankImprovementFindings,
  resolveWorkflowPath,
  writeWorkflowReport,
} from "./run-ruflo-workflow.mjs";

const workflowName = "regression-verification";
const workflowPath = resolveWorkflowPath(workflowName);
const runPlan = buildWorkflowRunPlan(workflowName);

assert.equal(runPlan.workflowName, workflowName);
assert.equal(runPlan.workflowPath, workflowPath);
assert.ok(runPlan.filesInspected.includes("tooling/ruflo/swarm-playbook.md"));
assert.ok(runPlan.filesInspected.includes("tooling/ruflo/workflows/regression-verification.md"));
assert.ok(runPlan.commands.some((command) => command.label === "ruflo sidecar"));
assert.ok(runPlan.commands.some((command) => command.command === "pnpm run test:workout-ui"));
assert.ok(runPlan.commands.some((command) => command.command === "pnpm run build"));

for (const expectedWorkflow of [
  "regression-verification",
  "analytics-review",
  "feature-implementation",
  "ascii-qa",
  "pre-merge-confidence",
]) {
  const lens = getWorkflowImprovementLens(expectedWorkflow);
  assert.equal(lens.workflowName, expectedWorkflow);
  assert.ok(lens.productSurfaces.length > 0);
  assert.ok(lens.improvementFindings.length >= 3);
}

const rankingFixture = [
  {
    id: "higher-effort",
    userImpact: 5,
    businessImpact: 5,
    effort: 3,
    risk: 1,
  },
  {
    id: "lower-risk",
    userImpact: 5,
    businessImpact: 5,
    effort: 2,
    risk: 1,
  },
  {
    id: "higher-risk",
    userImpact: 5,
    businessImpact: 5,
    effort: 2,
    risk: 2,
  },
  {
    id: "lower-business-impact",
    userImpact: 5,
    businessImpact: 4,
    effort: 1,
    risk: 1,
  },
];
assert.deepEqual(
  rankImprovementFindings(rankingFixture).map((finding) => finding.id),
  ["lower-risk", "higher-risk", "higher-effort", "lower-business-impact"]
);

const fakeResults = runPlan.commands.map((command, index) => ({
  ...command,
  status: index === 2 ? 1 : 0,
  stdout: index === 2 ? "" : "ok",
  stderr: index === 2 ? "simulated verifier failure" : "",
}));

const failedReport = createWorkflowReport({
  workflowName,
  workflowPath,
  filesInspected: runPlan.filesInspected,
  commandResults: fakeResults,
  startedAt: "2026-07-26T00:00:00.000Z",
  finishedAt: "2026-07-26T00:00:01.000Z",
});

assert.equal(failedReport.finalRecommendation, "stop");
assert.equal(failedReport.blockingFindings.length, 1);
assert.match(failedReport.blockingFindings[0], /pnpm run test:ascii/);
assert.equal(failedReport.safetyGate.status, "blocked");
assert.ok(
  failedReport.deferredNonBlockingFindings.some((finding) =>
    finding.includes("No deferred non-blocking findings")
  )
);
assert.ok(failedReport.verifierResults.some((result) => result.status === "failed"));

const passingReport = createWorkflowReport({
  workflowName,
  workflowPath,
  filesInspected: runPlan.filesInspected,
  commandResults: runPlan.commands.map((command) => ({
    ...command,
    status: 0,
    stdout: "ok",
    stderr: "",
  })),
  startedAt: "2026-07-26T00:00:00.000Z",
  finishedAt: "2026-07-26T00:00:01.000Z",
});

assert.equal(passingReport.finalRecommendation, "proceed");
assert.equal(passingReport.blockingFindings.length, 0);
assert.equal(passingReport.safetyGate.status, "passed");
assert.equal(passingReport.selectedImprovement.id, "regression-draft-resume");
assert.equal(passingReport.deferredOpportunities.length, 2);
assert.equal(passingReport.implementationResult.status, "ready-for-implementation");
assert.ok(
  passingReport.deferredNonBlockingFindings.some((finding) =>
    finding.includes("No deferred non-blocking findings")
  )
);

const refinementReport = createWorkflowReport({
  workflowName,
  workflowPath,
  filesInspected: runPlan.filesInspected,
  commandResults: runPlan.commands.map((command) => ({
    ...command,
    status: 0,
    stdout: "ok",
    stderr: "",
  })),
  reviewerRecommendation: "fix",
  implementationResult: {
    status: "needs-refinement",
    summary: "The selected improvement needs a smaller acceptance boundary.",
  },
  startedAt: "2026-07-26T00:00:00.000Z",
  finishedAt: "2026-07-26T00:00:01.000Z",
});

assert.equal(refinementReport.finalRecommendation, "fix");
assert.equal(refinementReport.safetyGate.status, "passed");

const reportDir = resolve("tooling/ruflo/reports/.test-output");
rmSync(reportDir, { recursive: true, force: true });
mkdirSync(dirname(reportDir), { recursive: true });

const reportPaths = writeWorkflowReport(passingReport, reportDir);
assert.ok(existsSync(reportPaths.jsonPath));
assert.ok(existsSync(reportPaths.markdownPath));

const markdown = readFileSync(reportPaths.markdownPath, "utf8");
assert.match(markdown, /## Files Inspected/);
assert.match(markdown, /## Commands Run/);
assert.match(markdown, /## Verifier Results/);
assert.match(markdown, /## Product Surfaces Inspected/);
assert.match(markdown, /## Improvement Opportunities/);
assert.match(markdown, /## Selected Improvement/);
assert.match(markdown, /## Implementation and Verification Result/);
assert.match(markdown, /## Deferred Opportunities/);
assert.match(markdown, /## Safety Gate/);
assert.match(markdown, /## Blocking Findings/);
assert.match(markdown, /## Deferred Non-Blocking Findings/);
assert.match(markdown, /## Final Recommendation/);

rmSync(reportDir, { recursive: true, force: true });

const missingWorkflow = spawnSync(process.execPath, ["scripts/run-ruflo-workflow.mjs", "missing"], {
  cwd: resolve("."),
  encoding: "utf8",
});
assert.notEqual(missingWorkflow.status, 0);
assert.match(`${missingWorkflow.stdout}${missingWorkflow.stderr}`, /Unknown Ruflo workflow: missing/);

console.log("Ruflo reporting contract verified.");
