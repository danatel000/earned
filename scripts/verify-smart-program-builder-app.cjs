const fs = require("fs");
const path = require("path");

const appPath = path.join(__dirname, "..", "src", "App.jsx");
const app = fs.readFileSync(appPath, "utf8");

const required = [
  "const COACH_GOALS",
  "function defaultCoachProfile",
  "function normalizeCoachProfile",
  "function coachState",
  "function withCoachState",
  "function buildSmartProgram",
  "function buildCoachPlanDraft",
  "function CoachProgramBuilder",
  "Coach Setup",
  "Generate Program",
  "Start Workout",
  "onSaveCoachProfile",
  "onGenerateCoachProgram",
  "onStartCoachPlanDay",
  "coachPlan",
  "Smart Program Builder",
];

const missing = required.filter(fragment => !app.includes(fragment));

if (missing.length) {
  console.error("Missing smart program builder app fragments:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Smart program builder app fragments verified.");
