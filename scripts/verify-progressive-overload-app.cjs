const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "..", "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(__dirname, "..", "README.md"), "utf8");
const combined = `${app}\n${readme}`;

const required = [
  "function getExerciseOverloadDecision",
  "function buildProgressiveOverloadAdvice",
  "function ProgressiveOverloadCoach",
  "buildProgressiveOverloadAdvice(history,customEx)",
  "Progressive Overload Coach",
  "Add Weight",
  "Add Reps",
  "Add Set",
  "Repeat",
  "Deload",
  "Next Target",
  "Why",
  "overloadAdvice",
];

const missing = required.filter(fragment => !combined.includes(fragment));

if (missing.length) {
  console.error("Missing progressive overload fragments:");
  for (const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

console.log("Progressive overload app fragments verified.");
