const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

const appFragments = [
  "function buildSessionPacer",
  "function SessionPacer",
  "buildSessionPacer(sessionStartedAt,sessionTick,previewVol,activeLoggedCount,activeSetCount,readinessScore)",
  "Session Pacer",
  "Pace Cue",
  "Volume / Min",
  "Logged Sets",
  "Reset Clock",
  "sessionPacer:true",
  "sessionStartedAt",
  "setSessionStartedAt(Date.now())",
  "<SessionPacer pacer={sessionPacer}",
];

const readmeFragments = [
  "Private Session Pacer",
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
  console.error("Session Pacer verification failed:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Session Pacer verification passed.");
