const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

const appFragments = [
  "needsActionIds:needsAction.map(ex=>ex.id)",
  "function WorkoutCompletionGuard({guard,onSkipRemaining})",
  "const skipRemainingExercises=dk=>",
  "if(!workoutCompletionGuard.needsActionIds.includes(ex.id)) continue;",
  "{...cell,skipped:true}",
  "Skip Remaining",
  "onSkipRemaining={()=>skipRemainingExercises(activeDay)}",
];

const readmeFragments = [
  "Private Quick Finish",
  "preserves their last-entered weights and sets",
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
  console.error("Quick Finish verification failed:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Quick Finish verification passed.");
