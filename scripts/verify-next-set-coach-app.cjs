const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

const appFragments = [
  "function buildNextSetCoach",
  "function NextSetCoach",
  "buildNextSetCoach(history,activeFocusExercise,activeFocusCell,activeFocusProfile,readinessScore)",
  "Next Set Coach",
  "Suggested Next Set",
  "Add Suggested Set",
  "Why This Set",
  "Decision",
  "Rest",
  "nextSetCoach:true",
  "applyNextSetSuggestion(activeDay,activeFocusExercise,activeFocusNextSetCoach)",
  "<NextSetCoach coach={activeFocusNextSetCoach}",
];

const readmeFragments = [
  "Private Next Set Coach",
  "No Supabase schema changes are required.",
];

const missing = [];
for (const fragment of appFragments) {
  if (!app.includes(fragment)) missing.push(`src/App.jsx missing: ${fragment}`);
}
for (const fragment of readmeFragments) {
  if (!readme.includes(fragment)) missing.push(`README.md missing: ${fragment}`);
}

if (missing.length) {
  console.error("Next Set Coach verification failed:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Next Set Coach verification passed.");
