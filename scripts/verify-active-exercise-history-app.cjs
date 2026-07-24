const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

const appFragments = [
  "function buildActiveExerciseHistory(history,exerciseId){",
  ".filter(Boolean).slice(-3).reverse()",
  "bestSetText:`${bestSet.w} lbs x ${bestSet.r}`",
  "function ActiveExerciseHistory({rows})",
  "Recent Performance",
  "No saved performances yet",
  "const activeFocusHistory=activeFocusExercise?buildActiveExerciseHistory(history,activeFocusExercise.id):[];",
  "<ActiveExerciseHistory rows={activeFocusHistory}/>",
];

const readmeFragments = [
  "Private Recent Exercise History",
  "last three saved performances",
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
  console.error("Active Exercise History verification failed:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Active Exercise History verification passed.");
