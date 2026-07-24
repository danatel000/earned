const fs = require("fs");
const path = require("path");

const appPath = path.join(__dirname, "..", "src", "App.jsx");
const app = fs.readFileSync(appPath, "utf8");

const required = [
  "const LIBRARY_EQUIPMENT",
  "const LIBRARY_DIFFICULTY",
  "function getExerciseProfile",
  "function buildLibraryWorkoutDraft",
  "Exercise Library Pro",
  "Equipment",
  "Difficulty",
  "Best Use",
  "Rep Range",
  "Start This Workout",
  "Library Exercise Loaded",
  "onStartLibraryWorkout",
  "handleStartLibraryWorkout",
  "libraryFocus",
];

const missing = required.filter(fragment => !app.includes(fragment));

if (missing.length) {
  console.error("Missing exercise library pro fragments:");
  for (const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

console.log("Exercise Library Pro app fragments verified.");
