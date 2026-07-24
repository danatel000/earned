const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "..", "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(__dirname, "..", "README.md"), "utf8");
const combined = `${app}\n${readme}`;

const required = [
  "function defaultReadiness",
  "function normalizeReadiness",
  "function getReadinessScore",
  "function getReadinessLabel",
  "Readiness Check-In",
  "Readiness Score",
  "Sleep",
  "Energy",
  "Soreness",
  "readiness",
  "normalizeReadiness(readiness)",
  "getReadinessScore(entry.readiness)",
  "Private readiness check-ins",
  "No Supabase schema changes",
];

const missing = required.filter(fragment => !combined.includes(fragment));

if (missing.length) {
  console.error("Missing readiness check-in fragments:");
  for (const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

console.log("Readiness check-in app fragments verified.");
