const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

const appFragments = [
  "function buildWorkoutCompletionGuard",
  "function WorkoutCompletionGuard",
  "completionGuard:true",
  "Workout Completion Guard",
  "Needs Action",
  "Ready to confirm",
  "Logged",
  "Skipped",
  "Removed",
  "const workoutCompletionGuard=buildWorkoutCompletionGuard(activeDay,inputs,customEx);",
  "<WorkoutCompletionGuard guard={workoutCompletionGuard}",
];

const readmeFragments = [
  "Private Workout Completion Guard",
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
  console.error("Workout Completion Guard verification failed:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Workout Completion Guard verification passed.");
