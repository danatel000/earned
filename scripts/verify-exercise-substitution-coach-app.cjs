const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "..", "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(__dirname, "..", "README.md"), "utf8");
const combined = `${app}\n${readme}`;

const required = [
  "function buildExerciseSubstitutions",
  "substitutionCoach",
  "activeFocusSubstitutions",
  "applyExerciseSubstitution",
  "Smart Substitutions",
  "Same muscle",
  "Add Swap",
  "Substitute for",
  "Draft-only swap",
  "Private exercise substitutions",
  "No Supabase schema changes",
];

const missing = required.filter(fragment => !combined.includes(fragment));

if (missing.length) {
  console.error("Missing exercise substitution coach fragments:");
  for (const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

console.log("Exercise substitution coach fragments verified.");
