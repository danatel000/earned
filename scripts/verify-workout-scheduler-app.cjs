const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "..", "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(__dirname, "..", "README.md"), "utf8");
const combined = `${app}\n${readme}`;

const required = [
  "function buildWorkoutSchedule",
  "function WorkoutSchedulePlanner",
  "buildWorkoutSchedule(history,customEx)",
  "Workout Schedule Planner",
  "7-Day Agenda",
  "Next Scheduled Workout",
  "Recovery Day",
  "Start Scheduled Workout",
  "scheduledWorkouts",
  "No Supabase schema changes",
];

const missing = required.filter(fragment => !combined.includes(fragment));

if (missing.length) {
  console.error("Missing workout scheduler fragments:");
  for (const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

console.log("Workout scheduler app fragments verified.");
