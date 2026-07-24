const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "..", "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(__dirname, "..", "README.md"), "utf8");
const combined = `${app}\n${readme}`;

const required = [
  "function buildCommunityLeaderboard",
  "function CommunityLeaderboardPanel",
  "buildCommunityLeaderboard(visiblePublicPosts,publicProfiles,currentUserId)",
  "topByUser",
  "currentUserRank",
  "Weekly Rankings",
  "One best public workout per lifter",
  "Your Rank",
  "Best Score",
  "Top Volume",
  "Active Lifters",
  "onTogglePublicReaction",
  "onSubmitPublicComment",
  "No Supabase schema changes",
  "Community leaderboard upgrades",
];

const missing = required.filter(fragment => !combined.includes(fragment));

if (missing.length) {
  console.error("Missing community weekly rankings fragments:");
  for (const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

console.log("Community weekly rankings fragments verified.");
