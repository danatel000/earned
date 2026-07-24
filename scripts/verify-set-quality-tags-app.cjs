const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

const appFragments = [
  "const SET_QUALITY_OPTIONS",
  "function buildSetQualitySummary",
  "function SetQualitySummary",
  "handleSetQuality(activeDay,ex.id,index,quality.id)",
  "Set Quality",
  "Set Quality Summary",
  "Quality Mix",
  "Hard Sets",
  "Coach Cue",
  "Easy",
  "Good",
  "Hard",
  "Failed",
  "setQualitySummary:true",
  "<SetQualitySummary summary={activeFocusSetQualitySummary}/>",
];

const readmeFragments = [
  "Private Set Quality Tags",
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
  console.error("Set Quality Tags verification failed:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Set Quality Tags verification passed.");
