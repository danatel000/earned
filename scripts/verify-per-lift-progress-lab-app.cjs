const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "..", "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(__dirname, "..", "README.md"), "utf8");
const combined = `${app}\n${readme}`;

const required = [
  "function buildPerLiftProgressLab",
  "buildPerLiftProgressLab(ex,history)",
  "progressLab",
  "recentLiftRows",
  "Per-Lift Progress Lab",
  "Estimated 1RM",
  "Best Set",
  "Volume Trend",
  "Recent Logs",
  "Next Cue",
  "Private per-lift progress labs",
  "No Supabase schema changes",
];

const missing = required.filter(fragment => !combined.includes(fragment));

if (missing.length) {
  console.error("Missing per-lift progress lab fragments:");
  for (const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

console.log("Per-lift progress lab fragments verified.");
