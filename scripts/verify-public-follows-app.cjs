const fs = require("fs");
const path = require("path");

const appPath = path.join(__dirname, "..", "src", "App.jsx");
const app = fs.readFileSync(appPath, "utf8");

const required = [
  "function buildPublicSocialGraph",
  "async function togglePublicFollow",
  "publicProfiles",
  "publicFollows",
  "feedScope",
  "Discover Lifters",
  "Following",
];

const missing = required.filter(fragment => !app.includes(fragment));

if (missing.length) {
  console.error("Missing public follows app fragments:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Public follows app fragments verified.");
