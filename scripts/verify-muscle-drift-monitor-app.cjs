const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(root,"src","App.jsx"),"utf8");
const readme=fs.readFileSync(path.join(root,"README.md"),"utf8");
const combined=`${app}\n${readme}`;

const required=[
  "function buildMuscleDriftAlerts",
  "function MuscleDriftMonitor",
  "buildMuscleDriftAlerts(history,customEx)",
  "<MuscleDriftMonitor history={planningHistory} customEx={customEx}/>",
  "const recentWindowSize=3",
  "const minimumHistory=4",
  "const driftThreshold=6",
  "getMuscleVolumes(entry,customEx)",
  "recentShare",
  "baselineShare",
  "Falling behind",
  "Gaining ground",
  "Stable",
  "Muscle Drift Monitor",
  "More history needed",
  "Private Muscle Drift Monitor",
  "No Supabase schema changes are required.",
];

const missing=required.filter(fragment=>!combined.includes(fragment));
if(missing.length){
  console.error("Missing Muscle Drift Monitor fragments:");
  for(const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

console.log("Muscle Drift Monitor verifier passed.");
