const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "..", "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(__dirname, "..", "README.md"), "utf8");
const combined = `${app}\n${readme}`;

const required = [
  "function buildAchievementMilestones",
  "function AchievementMilestonesPanel",
  "buildAchievementMilestones(history,customEx)",
  "Achievements & Milestones",
  "Workout Milestone",
  "Volume Milestone",
  "PR Milestone",
  "Streak Milestone",
  "Muscle Milestone",
  "achievementMilestones",
  "unlockedCount",
  "nextMilestone",
  "Progress",
];

const missing = required.filter(fragment => !combined.includes(fragment));

if (missing.length) {
  console.error("Missing achievements and milestones fragments:");
  for (const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

console.log("Achievements and milestones app fragments verified.");
