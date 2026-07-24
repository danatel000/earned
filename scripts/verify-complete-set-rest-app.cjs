const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

const appFragments = [
  "const [autoStartRest,setAutoStartRest]=useState(initialDraft?.autoStartRest??false);",
  "autoStartRest,restPreset,sessionStartedAt,inputs",
  "const completeSetRow=(dk,id,index,exerciseName)=>{",
  "i===index?{...row,completed:true}:row",
  "if(autoStartRest) startRest(`${exerciseName} rest`,restPreset);",
  "completed:false",
  "Auto-start rest",
  "Complete Set",
  "Set Complete",
];

const readmeFragments = [
  "Private Complete Set & Smart Rest",
  "draft-only completion marker",
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
  console.error("Complete Set & Smart Rest verification failed:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Complete Set & Smart Rest verification passed.");
