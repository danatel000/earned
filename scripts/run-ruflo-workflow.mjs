import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const WORKFLOW_NAMES = new Map([
  ["feature-implementation", "tooling/ruflo/workflows/feature-implementation.md"],
  ["regression-verification", "tooling/ruflo/workflows/regression-verification.md"],
  ["analytics-review", "tooling/ruflo/workflows/analytics-review.md"],
  ["ascii-qa", "tooling/ruflo/workflows/ascii-qa.md"],
  ["pre-merge-confidence", "tooling/ruflo/workflows/pre-merge-confidence.md"],
]);

const WORKFLOW_COMMANDS = new Map([
  [
    "regression-verification",
    [
      "pnpm run test:workout-ui",
      "pnpm run test:ascii",
      "pnpm run test:iop",
      "pnpm run verify",
      "pnpm run build",
    ],
  ],
  [
    "analytics-review",
    [
      "pnpm run test:iop",
      "pnpm run verify",
      "pnpm run build",
    ],
  ],
  [
    "feature-implementation",
    [
      "pnpm run test:workout-ui",
      "pnpm run test:iop",
      "pnpm run verify",
      "pnpm run build",
    ],
  ],
  [
    "ascii-qa",
    [
      "pnpm run test:ascii",
      "pnpm run build",
    ],
  ],
  [
    "pre-merge-confidence",
    [
      "pnpm run test:workout-ui",
      "pnpm run test:ascii",
      "pnpm run test:iop",
      "pnpm run verify",
      "pnpm run build",
    ],
  ],
]);

const WORKFLOW_IMPROVEMENT_LENSES = new Map([
  [
    "regression-verification",
    {
      productSurfaces: [
        "src/App.jsx workout save, draft restore, skip behavior, and tracking mode",
        "src/tracking/trackingPeriods.js daily and weekly period calculations",
        "src/supabaseClient.js authenticated account sync boundary",
      ],
      improvementFindings: [
        {
          id: "regression-draft-resume",
          category: "Workout trust and friction",
          title: "Make unfinished-workout recovery explicit before users change a live draft",
          evidence: "Earned already preserves active drafts and exposes a continuation path, so a clearer resume/discard decision can prevent accidental draft loss.",
          affectedSurfaces: ["Train", "Today", "workout save and draft state"],
          userImpact: 5,
          businessImpact: 5,
          effort: 2,
          risk: 1,
          suggestedWorkflow: "feature-implementation",
          acceptanceCriteria: [
            "A saved active draft is clearly identified before a new workout starts.",
            "Resume and discard actions remain distinct and reversible where existing state supports it.",
          ],
        },
        {
          id: "regression-skip-prefill",
          category: "Workout trust and friction",
          title: "Explain skipped-set carry-forward values at the point of logging",
          evidence: "Skipped exercises intentionally keep their last successful values while excluding skipped volume, which can be confusing without contextual copy.",
          affectedSurfaces: ["Train", "History", "skip and prefill behavior"],
          userImpact: 5,
          businessImpact: 4,
          effort: 2,
          risk: 1,
          suggestedWorkflow: "feature-implementation",
          acceptanceCriteria: [
            "Skipped exercises retain their last completed values when the user returns.",
            "The UI states that skipped work is excluded from the period volume.",
          ],
        },
        {
          id: "regression-tracking-mode-context",
          category: "Tracking clarity",
          title: "Keep the selected daily or weekly mode visible beside period-sensitive metrics",
          evidence: "Earned supports both tracking modes, so volume, streak, and forecast cards need a persistent period context to avoid misreading trends.",
          affectedSurfaces: ["Today", "Progress", "Goals", "tracking mode"],
          userImpact: 4,
          businessImpact: 4,
          effort: 2,
          risk: 1,
          suggestedWorkflow: "feature-implementation",
          acceptanceCriteria: [
            "Period-sensitive metrics name the active daily or weekly context.",
            "Switching modes updates labels without changing saved workout data.",
          ],
        },
      ],
    },
  ],
  [
    "analytics-review",
    {
      productSurfaces: [
        "src/App.jsx progression, PR, readiness, fatigue, recovery, and goal forecast calculations",
        "src/integrations/recovery.js recovery data normalization",
        "src/components/monetization/RecoveryIntegrationPreview.jsx future recovery integration preview",
      ],
      improvementFindings: [
        {
          id: "analytics-readiness-explanation",
          category: "Training intelligence",
          title: "Show the key inputs behind a readiness recommendation",
          evidence: "Readiness already combines sleep, soreness, stress, and training load signals, but users benefit when the leading factors are visible beside the recommendation.",
          affectedSurfaces: ["Today", "Train", "readiness and recovery insights"],
          userImpact: 5,
          businessImpact: 5,
          effort: 2,
          risk: 2,
          suggestedWorkflow: "analytics-review",
          acceptanceCriteria: [
            "Readiness guidance names its strongest positive and limiting input.",
            "The explanation uses the same values as the existing readiness score.",
          ],
        },
        {
          id: "analytics-goal-eta-confidence",
          category: "Forecast usefulness",
          title: "Pair goal ETAs with confidence and the training signal that drives them",
          evidence: "Goal forecasts are more actionable when users can see whether consistency, load progression, or missing data is moving the estimate.",
          affectedSurfaces: ["Goals", "Progress", "forecast analytics"],
          userImpact: 5,
          businessImpact: 4,
          effort: 3,
          risk: 2,
          suggestedWorkflow: "analytics-review",
          acceptanceCriteria: [
            "Each goal ETA includes a confidence label based on available workout history.",
            "The UI explains one concrete action that can improve the forecast.",
          ],
        },
        {
          id: "analytics-fatigue-trend-contrast",
          category: "Training intelligence",
          title: "Contrast recent fatigue against the user's own baseline",
          evidence: "Raw fatigue is less useful than a comparison to the user's normal training pattern and recent workload.",
          affectedSurfaces: ["Progress", "Today", "fatigue trend analytics"],
          userImpact: 4,
          businessImpact: 4,
          effort: 3,
          risk: 2,
          suggestedWorkflow: "analytics-review",
          acceptanceCriteria: [
            "Fatigue cards state whether the current value is below, near, or above baseline.",
            "No recommendation contradicts the existing readiness guardrails.",
          ],
        },
      ],
    },
  ],
  [
    "feature-implementation",
    {
      productSurfaces: [
        "src/components/experience/workout/WorkoutEcosystemRail.jsx eight-tab navigation",
        "src/components/monetization/PremiumGate.jsx and src/components/monetization/UpgradePrompt.jsx Premium conversion surfaces",
        "src/components/experience/DashboardCommandCenter.jsx Today and Progress experience",
      ],
      improvementFindings: [
        {
          id: "feature-next-action-today",
          category: "Workout ecosystem UX",
          title: "Make Today end with one unmistakable next training action",
          evidence: "Today aggregates schedule, readiness, goals, and metrics; a single prioritized action reduces decision fatigue before training.",
          affectedSurfaces: ["Today", "Train", "workout navigation"],
          userImpact: 5,
          businessImpact: 5,
          effort: 2,
          risk: 1,
          suggestedWorkflow: "feature-implementation",
          acceptanceCriteria: [
            "Today surfaces one primary action based on the current workout state.",
            "The action routes users into the correct existing workout flow.",
          ],
        },
        {
          id: "feature-premium-insight-preview",
          category: "Premium conversion",
          title: "Place one contextual Premium insight preview beside free Progress results",
          evidence: "Earned has Premium gating and advanced analytics; contextual previews demonstrate value more clearly than a generic upgrade prompt.",
          affectedSurfaces: ["Progress", "Premium gate", "Upgrade prompt"],
          userImpact: 4,
          businessImpact: 5,
          effort: 2,
          risk: 1,
          suggestedWorkflow: "feature-implementation",
          acceptanceCriteria: [
            "Free users see a truthful preview without losing access to core tracking.",
            "The upgrade action reuses the existing pricing or entitlement path.",
          ],
        },
        {
          id: "feature-library-return-path",
          category: "Workout ecosystem UX",
          title: "Let Library exercise exploration return directly to a compatible workout draft",
          evidence: "The exercise library is strongest when discovery turns into a low-friction addition to an active or planned session.",
          affectedSurfaces: ["Library", "Train", "exercise selection"],
          userImpact: 4,
          businessImpact: 4,
          effort: 3,
          risk: 2,
          suggestedWorkflow: "feature-implementation",
          acceptanceCriteria: [
            "Users can add a selected library exercise into a compatible existing draft.",
            "The return path preserves the user's current workout context.",
          ],
        },
      ],
    },
  ],
  [
    "ascii-qa",
    {
      productSurfaces: [
        "src/components/experience/ascii/AppAsciiAtmosphere.jsx application-wide ASCII atmosphere",
        "src/components/experience/ascii/EarnedAsciiScene.jsx launch-page art and motion",
        "src/components/experience/forge/useAsciiViewport.js responsive rendering and reduced-motion behavior",
      ],
      improvementFindings: [
        {
          id: "ascii-contextual-density",
          category: "Terminal atmosphere",
          title: "Vary ASCII density by screen purpose so workout controls stay dominant",
          evidence: "Earned uses ASCII on launch and signed-in surfaces; adaptive density can preserve the signature while protecting high-frequency gym actions.",
          affectedSurfaces: ["Today", "Train", "Launch", "reduced-motion settings"],
          userImpact: 5,
          businessImpact: 4,
          effort: 2,
          risk: 1,
          suggestedWorkflow: "ascii-qa",
          acceptanceCriteria: [
            "Train keeps active inputs and rest controls visually dominant over atmosphere layers.",
            "Compact and reduced-motion views use a lower-density variant.",
          ],
        },
        {
          id: "ascii-milestone-restraint",
          category: "Reward feedback",
          title: "Reserve high-energy ASCII bursts for meaningful training milestones",
          evidence: "Milestone effects are most rewarding when they mark a completed set, PR, goal, or streak rather than routine navigation.",
          affectedSurfaces: ["Train", "Records", "Goals", "completion feedback"],
          userImpact: 4,
          businessImpact: 4,
          effort: 2,
          risk: 1,
          suggestedWorkflow: "ascii-qa",
          acceptanceCriteria: [
            "Celebratory ASCII effects only run after a meaningful training event.",
            "The effect never blocks input, navigation, or text readability.",
          ],
        },
        {
          id: "ascii-responsive-legibility",
          category: "Responsive quality",
          title: "Tune line length and contrast per viewport before adding new animation layers",
          evidence: "ASCII composition depends on character alignment, so compact phone layouts need their own legibility thresholds.",
          affectedSurfaces: ["compact", "standard", "wide", "reduced-motion"],
          userImpact: 4,
          businessImpact: 3,
          effort: 2,
          risk: 1,
          suggestedWorkflow: "ascii-qa",
          acceptanceCriteria: [
            "ASCII text does not overlap primary controls at supported viewport sizes.",
            "Contrast remains readable in the active Earned color system.",
          ],
        },
      ],
    },
  ],
  [
    "pre-merge-confidence",
    {
      productSurfaces: [
        "src/App.jsx shared workout behavior and cross-tab composition",
        "src/components/experience and src/components/monetization shared product surfaces",
        "scripts/run-verifiers.cjs production verifier coverage",
      ],
      improvementFindings: [
        {
          id: "premerge-improvement-queue",
          category: "Delivery quality",
          title: "Publish the next improvement queue from overlapping workflow findings",
          evidence: "Multiple specialty swarms can surface adjacent opportunities; a merged queue prevents duplicate work and keeps the next change bounded.",
          affectedSurfaces: ["Ruflo reports", "feature planning", "shared product surfaces"],
          userImpact: 4,
          businessImpact: 5,
          effort: 1,
          risk: 1,
          suggestedWorkflow: "feature-implementation",
          acceptanceCriteria: [
            "The report names one next swarm and one bounded next improvement.",
            "Duplicate or overlapping recommendations are consolidated.",
          ],
        },
        {
          id: "premerge-verifier-gap-map",
          category: "Delivery quality",
          title: "Map improvement candidates to the focused verifier that protects them",
          evidence: "A clear verifier owner makes improvement work faster and reduces unnecessary full-suite runs.",
          affectedSurfaces: ["Ruflo reports", "verifier selection", "production build"],
          userImpact: 4,
          businessImpact: 4,
          effort: 2,
          risk: 1,
          suggestedWorkflow: "regression-verification",
          acceptanceCriteria: [
            "Each selected improvement names its focused verifier before implementation starts.",
            "The broad verifier/build gate remains available for shared-risk changes.",
          ],
        },
        {
          id: "premerge-copy-and-clarity-sweep",
          category: "Product clarity",
          title: "Batch clearly isolated training-copy improvements separately from behavior changes",
          evidence: "Separating copy polish from logic changes keeps product iteration fast without obscuring behavioral risk.",
          affectedSurfaces: ["Today", "Progress", "Goals", "Premium prompts"],
          userImpact: 3,
          businessImpact: 4,
          effort: 1,
          risk: 1,
          suggestedWorkflow: "feature-implementation",
          acceptanceCriteria: [
            "Copy-only items do not alter saved data or calculation behavior.",
            "Behavioral improvements remain independently verifiable.",
          ],
        },
      ],
    },
  ],
]);

export function resolveWorkflowPath(name) {
  const relativePath = WORKFLOW_NAMES.get(name);
  if (!relativePath) {
    throw new Error(`Unknown Ruflo workflow: ${name}`);
  }

  return resolve(relativePath);
}

function copyFinding(finding) {
  return {
    ...finding,
    affectedSurfaces: [...finding.affectedSurfaces],
    acceptanceCriteria: [...finding.acceptanceCriteria],
  };
}

export function rankImprovementFindings(findings) {
  return [...findings].sort((left, right) =>
    right.userImpact - left.userImpact ||
    right.businessImpact - left.businessImpact ||
    left.effort - right.effort ||
    left.risk - right.risk ||
    left.id.localeCompare(right.id)
  );
}

export function getWorkflowImprovementLens(workflowName) {
  const lens = WORKFLOW_IMPROVEMENT_LENSES.get(workflowName);
  if (!lens) {
    throw new Error(`Unknown Ruflo workflow: ${workflowName}`);
  }

  return {
    workflowName,
    productSurfaces: [...lens.productSurfaces],
    improvementFindings: rankImprovementFindings(lens.improvementFindings.map(copyFinding)),
  };
}

function formatOutput(value) {
  const trimmed = String(value || "").trim();
  return trimmed.length ? trimmed : "(no output)";
}

function parseWorkflowVerificationCommands(workflowPath) {
  const text = readFileSync(workflowPath, "utf8");
  const matches = [...text.matchAll(/`([^`]*(?:pnpm run|node scripts\/)[^`]*)`/g)];
  return [...new Set(matches.map((match) => match[1]).filter((command) => !command.includes("<preview-url>")))];
}

export function buildWorkflowRunPlan(workflowName) {
  const workflowPath = resolveWorkflowPath(workflowName);
  const improvementLens = getWorkflowImprovementLens(workflowName);
  const configuredCommands = WORKFLOW_COMMANDS.get(workflowName) || parseWorkflowVerificationCommands(workflowPath);
  const verificationCommands = configuredCommands.length ? configuredCommands : parseWorkflowVerificationCommands(workflowPath);

  return {
    workflowName,
    workflowPath,
    filesInspected: [
      "tooling/ruflo/swarm-playbook.md",
      `tooling/ruflo/workflows/${basename(workflowPath)}`,
      "scripts/run-ruflo-workflow.mjs",
      "package.json",
      ...improvementLens.productSurfaces,
    ],
    productSurfacesInspected: improvementLens.productSurfaces,
    improvementFindings: improvementLens.improvementFindings,
    commands: [
      {
        label: "ruflo sidecar",
        command: `pnpm dlx ruflo@latest run ${workflowPath}`,
        cwd: "tooling/ruflo",
        continueOnFailure: true,
      },
      ...verificationCommands.map((command) => ({
        label: "verifier",
        command,
        cwd: ".",
        continueOnFailure: false,
      })),
    ],
  };
}

export function createWorkflowReport({
  workflowName,
  workflowPath,
  filesInspected,
  commandResults,
  improvementFindings = getWorkflowImprovementLens(workflowName).improvementFindings,
  implementationResult,
  reviewerRecommendation,
  startedAt,
  finishedAt,
}) {
  const rankedImprovementFindings = rankImprovementFindings(improvementFindings);
  const selectedImprovement = rankedImprovementFindings[0] || null;
  const deferredOpportunities = rankedImprovementFindings.slice(1, 3).map((finding) => ({
    ...finding,
    deferredReason: "A higher-ranked bounded improvement was selected for this run.",
  }));
  const verifierResults = commandResults
    .filter((result) => result.label === "verifier")
    .map((result) => ({
      command: result.command,
      status: result.status === 0 ? "passed" : "failed",
      exitCode: result.status,
    }));

  const failedRequiredCommands = commandResults.filter(
    (result) => result.status !== 0 && !result.continueOnFailure
  );
  const failedSidecarCommands = commandResults.filter(
    (result) => result.status !== 0 && result.continueOnFailure
  );

  const blockingFindings = failedRequiredCommands.map(
    (result) =>
      `${result.command} failed with exit code ${result.status}: ${formatOutput(result.stderr || result.stdout)}`
  );
  const deferredNonBlockingFindings = failedSidecarCommands.length
    ? failedSidecarCommands.map(
        (result) =>
          `${result.command} did not complete cleanly, but local Earned verifiers still ran: ${formatOutput(
            result.stderr || result.stdout
          )}`
      )
    : ["No deferred non-blocking findings."];
  const safetyGate = {
    status: blockingFindings.length ? "blocked" : "passed",
    requiredChecks: verifierResults,
    blockingReason: blockingFindings[0] || null,
  };
  const normalizedImplementationResult = implementationResult || {
    status: "ready-for-implementation",
    summary:
      "This sidecar run selected the next bounded improvement. The implementation phase belongs to the next explicit Ruflo feature, analytics, or ASCII swarm.",
  };
  const finalRecommendation = blockingFindings.length
    ? "stop"
    : reviewerRecommendation === "fix" || normalizedImplementationResult.status === "needs-refinement"
      ? "fix"
      : "proceed";

  return {
    workflowName,
    workflowPath,
    startedAt,
    finishedAt,
    filesInspected,
    productSurfacesInspected: getWorkflowImprovementLens(workflowName).productSurfaces,
    improvementFindings: rankedImprovementFindings,
    selectedImprovement,
    implementationResult: normalizedImplementationResult,
    deferredOpportunities,
    commandsRun: commandResults.map((result) => ({
      label: result.label,
      command: result.command,
      cwd: result.cwd,
      exitCode: result.status,
    })),
    verifierResults,
    blockingFindings,
    deferredNonBlockingFindings,
    safetyGate,
    finalRecommendation,
  };
}

export function writeWorkflowReport(report, reportDir = resolve("tooling/ruflo/reports")) {
  mkdirSync(reportDir, { recursive: true });
  const stamp = report.finishedAt.replace(/[:.]/g, "-");
  const baseName = `${report.workflowName}-${stamp}`;
  const jsonPath = resolve(reportDir, `${baseName}.json`);
  const markdownPath = resolve(reportDir, `${baseName}.md`);

  const markdown = [
    `# Earned Ruflo Report: ${report.workflowName}`,
    "",
    `**Started:** ${report.startedAt}`,
    `**Finished:** ${report.finishedAt}`,
    "",
    "## Files Inspected",
    ...report.filesInspected.map((file) => `- ${file}`),
    "",
    "## Product Surfaces Inspected",
    ...report.productSurfacesInspected.map((surface) => `- ${surface}`),
    "",
    "## Improvement Opportunities",
    ...report.improvementFindings.map(
      (finding, index) =>
        `${index + 1}. **${finding.title}** (${finding.category}) - User impact ${finding.userImpact}/5, business impact ${finding.businessImpact}/5, effort ${finding.effort}/5, risk ${finding.risk}/5. Evidence: ${finding.evidence}`
    ),
    ...(report.improvementFindings.length ? [] : ["- None identified."]),
    "",
    "## Selected Improvement",
    report.selectedImprovement
      ? `- **${report.selectedImprovement.title}** via ${report.selectedImprovement.suggestedWorkflow}
- Acceptance: ${report.selectedImprovement.acceptanceCriteria.join(" ")}`
      : "- None identified.",
    "",
    "## Implementation and Verification Result",
    `- ${report.implementationResult.status}: ${report.implementationResult.summary}`,
    "",
    "## Deferred Opportunities",
    ...report.deferredOpportunities.map(
      (finding) => `- **${finding.title}** via ${finding.suggestedWorkflow}: ${finding.deferredReason}`
    ),
    ...(report.deferredOpportunities.length ? [] : ["- None."]),
    "",
    "## Commands Run",
    ...report.commandsRun.map((command) => `- [${command.exitCode}] ${command.command}`),
    "",
    "## Verifier Results",
    ...report.verifierResults.map((result) => `- ${result.status}: ${result.command}`),
    "",
    "## Blocking Findings",
    ...report.blockingFindings.map((finding) => `- ${finding}`),
    ...(report.blockingFindings.length ? [] : ["- None."]),
    "",
    "## Deferred Non-Blocking Findings",
    ...report.deferredNonBlockingFindings.map((finding) => `- ${finding}`),
    "",
    "## Safety Gate",
    `- ${report.safetyGate.status}`,
    ...(report.safetyGate.blockingReason ? [`- ${report.safetyGate.blockingReason}`] : ["- All required completed checks passed."]),
    "",
    "## Final Recommendation",
    report.finalRecommendation,
    "",
  ].join("\n");

  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(markdownPath, markdown);

  return { jsonPath, markdownPath };
}

function runCommand(command, options) {
  const result = spawnSync(command.command, {
    cwd: resolve(command.cwd),
    encoding: "utf8",
    shell: true,
  });

  if (options.printOutput) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }

  return {
    ...command,
    status: result.status ?? 1,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
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

  const startedAt = new Date().toISOString();
  const runPlan = buildWorkflowRunPlan(workflowName);
  const commandResults = [];

  for (const command of runPlan.commands) {
    console.log(`\n[Ruflo:${workflowName}] ${command.command}`);
    const result = runCommand(command, { printOutput: true });
    commandResults.push(result);

    if (result.status !== 0 && !command.continueOnFailure) {
      break;
    }
  }

  const finishedAt = new Date().toISOString();
  const report = createWorkflowReport({
    workflowName,
    workflowPath,
    filesInspected: runPlan.filesInspected,
    commandResults,
    startedAt,
    finishedAt,
  });
  const reportPaths = writeWorkflowReport(report);

  console.log(`\n[Ruflo:${workflowName}] Report written: ${reportPaths.markdownPath}`);
  console.log(`[Ruflo:${workflowName}] Final recommendation: ${report.finalRecommendation}`);

  process.exit(report.finalRecommendation === "proceed" ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
