const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "..", "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(__dirname, "..", "README.md"), "utf8");
const combined = `${app}\n${readme}`;

const required = [
  "function buildWorkoutStory",
  "storyHeadline",
  "storyNarrative",
  "storyHighlights",
  "Workout Story",
  "Story Highlights",
  "Copy Story Recap",
  "Story",
  "Post-workout storytelling",
  "No Supabase schema changes",
];

const missing = required.filter(fragment => !combined.includes(fragment));

if (missing.length) {
  console.error("Missing workout story recap fragments:");
  for (const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

console.log("Workout story recap fragments verified.");
