const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "..", "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(__dirname, "..", "README.md"), "utf8");
const combined = `${app}\n${readme}`;

const required = [
  "function buildTechniqueCoach",
  "function TechniqueCoachPanel",
  "buildTechniqueCoach(ex,profile,dk)",
  "buildTechniqueCoach(activeFocusExercise,activeFocusProfile,activeDay)",
  "Technique Coach",
  "Setup Checklist",
  "Rep Execution",
  "Safety Checks",
  "Progression Tip",
  "techniqueCoach",
  "Private Technique Coach",
  "No Supabase schema changes",
];

const missing = required.filter(fragment => !combined.includes(fragment));

if (missing.length) {
  console.error("Missing technique coach fragments:");
  for (const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

console.log("Technique coach fragments verified.");
