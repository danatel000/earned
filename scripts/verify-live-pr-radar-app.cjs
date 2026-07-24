const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

const appFragments = [
  "function buildLivePRRadar",
  "function LivePRRadar",
  "buildLivePRRadar(history,customEx,activeDay,inputs)",
  "Live PR Radar",
  "Draft PR Candidates",
  "Volume PR",
  "Weight PR",
  "Estimated 1RM PR",
  "PR in Range",
  "Best Gap",
  "Coach Cue",
  "livePrRadar:true",
  "<LivePRRadar radar={livePrRadar}/>",
];

const readmeFragments = [
  "Private Live PR Radar",
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
  console.error("Live PR Radar verification failed:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Live PR Radar verification passed.");
