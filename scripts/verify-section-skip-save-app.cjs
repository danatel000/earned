const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

const appFragments = [
  "const skipAndConfirmDay=dk=>",
  "Skip & Save",
  "onClick={()=>skipAndConfirmDay(activeDay)}",
  "for(const ex of allExercises(dk,customEx))",
  "const cell=dayInputs[ex.id]||liftInputFromLastLogged(history,ex)",
  "nextDayInputs[ex.id]={...cell,skipped:true}",
  "setCompleted(prev=>({...prev,[dk]:true}))",
  "No exercises are logged for ${DAYS[dk].label}. Mark this entire section as skipped?",
];

const readmeFragments = [
  "Section Skip & Save",
  "skip an entire workout section",
  "preserves the previous lift values",
  "does not count skipped exercises toward volume",
];

const missing = [];
for (const fragment of appFragments) {
  if (!app.includes(fragment)) missing.push(`src/App.jsx missing: ${fragment}`);
}
for (const fragment of readmeFragments) {
  if (!readme.includes(fragment)) missing.push(`README.md missing: ${fragment}`);
}

if (missing.length) {
  console.error("Section Skip & Save verification failed:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Section Skip & Save verification passed.");
