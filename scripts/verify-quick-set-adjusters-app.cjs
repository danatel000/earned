const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

const appFragments = [
  "const adjustSetValue=(dk,id,index,field,delta)=>",
  "Quick Adjust",
  "adjustSetValue(activeDay,ex.id,index,\"w\",-5)",
  "adjustSetValue(activeDay,ex.id,index,\"w\",5)",
  "adjustSetValue(activeDay,ex.id,index,\"r\",-1)",
  "adjustSetValue(activeDay,ex.id,index,\"r\",1)",
  "-5 lb",
  "+5 lb",
  "-1 rep",
  "+1 rep",
  "skipped?\"default\":\"pointer\"",
];

const readmeFragments = [
  "Private Quick Set Adjusters",
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
  console.error("Quick Set Adjusters verification failed:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Quick Set Adjusters verification passed.");
