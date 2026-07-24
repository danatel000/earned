const fs = require("fs");
const path = require("path");

const appPath = path.join(__dirname, "..", "src", "App.jsx");
const app = fs.readFileSync(appPath, "utf8");

const required = [
  "const PUBLIC_REACTIONS",
  "function emptyPublicEngagement",
  "function buildPublicEngagement",
  "async function createPublicNotification",
  "async function togglePublicReaction",
  "async function addPublicComment",
  "async function markPublicNotificationsRead",
  "publicEngagement",
  "commentDrafts",
  "Activity",
  "Strong",
  "Respect",
  "Motivation",
  "Comment",
];

const missing = required.filter(fragment => !app.includes(fragment));

if (missing.length) {
  console.error("Missing social engagement app fragments:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Social engagement app fragments verified.");
