const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "..", "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(__dirname, "..", "README.md"), "utf8");
const combined = `${app}\n${readme}`;

const required = [
  "function buildPlateLoad",
  "function buildWarmupPlan",
  "const activeFocusPlateLoad",
  "const activeFocusWarmups",
  "Plate Calculator",
  "Warmup Planner",
  "Bar Load",
  "per side",
  "working weight",
  "No saved workout data changes",
];

const missing = required.filter(fragment => !combined.includes(fragment));

if (missing.length) {
  console.error("Missing plate and warmup fragments:");
  for (const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

console.log("Plate calculator and warmup planner fragments verified.");
