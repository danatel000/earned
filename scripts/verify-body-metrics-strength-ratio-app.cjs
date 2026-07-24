const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "..", "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(__dirname, "..", "README.md"), "utf8");
const combined = `${app}\n${readme}`;

const required = [
  "function bodyMetrics",
  "function buildBodyMetricsInsights",
  "function BodyMetricsPanel",
  "bodyMetrics(customEx)",
  "buildBodyMetricsInsights(history,customEx)",
  "_bodyMetrics",
  "Body Metrics & Strength Ratio",
  "Save Bodyweight",
  "Strength Ratio",
  "Volume / lb",
  "Best 1RM / lb",
  "Weight Trend",
  "handleSaveBodyMetric",
  "onSaveBodyMetric",
  "Private body metrics",
  "No Supabase schema changes",
];

const missing = required.filter(fragment => !combined.includes(fragment));

if (missing.length) {
  console.error("Missing body metrics strength ratio fragments:");
  for (const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

console.log("Body metrics strength ratio fragments verified.");
