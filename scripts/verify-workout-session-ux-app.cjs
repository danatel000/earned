const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "..", "src", "App.jsx"), "utf8");

const required = [
  "function getExerciseSetSuggestion",
  "activeFocusId",
  "activeFocusExercise",
  "copyPreviousLiftToExercise",
  "repeatLastSetForExercise",
  "Active Exercise Focus",
  "Copy Last Workout",
  "Repeat Last Set",
  "Session Dock",
  "Quick Actions",
  "sticky",
];

const missing = required.filter(fragment => !app.includes(fragment));

if (missing.length) {
  console.error("Missing workout session UX fragments:");
  for (const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

console.log("Workout session UX app fragments verified.");
