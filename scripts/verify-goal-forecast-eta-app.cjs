const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "..", "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(__dirname, "..", "README.md"), "utf8");
const combined = `${app}\n${readme}`;

const required = [
  "function buildGoalForecasts",
  "function GoalForecastPanel",
  "buildGoalForecasts(history,goals,customEx)",
  "goalForecasts",
  "Goal Forecast & ETA",
  "Weekly Goal Forecast",
  "Weeks to Goal",
  "Exercise ETA",
  "Next Target",
  "Pace",
  "Private goal forecasts",
  "No Supabase schema changes",
];

const missing = required.filter(fragment => !combined.includes(fragment));

if (missing.length) {
  console.error("Missing goal forecast ETA fragments:");
  for (const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

console.log("Goal forecast ETA fragments verified.");
