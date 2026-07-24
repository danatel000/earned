const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(root,"src","App.jsx"),"utf8");
const readme=fs.readFileSync(path.join(root,"README.md"),"utf8");

const requiredApp=[
  "function buildDataSafetySnapshot",
  "function parseLiftTrackerBackup",
  "function DataSafetyCenter",
  "Data Safety Center",
  "Backup Health",
  "Full Account Backup",
  "Export Full Backup",
  "Import Full Backup",
  "Saved Goals",
  "Custom Routine Data",
  "lift_tracker_full_backup",
  "preferences:normalizePreferences(preferences)",
  "onImport({history:parsed.history,goals:parsed.goals,customEx:parsed.customEx,preferences:parsed.preferences})",
  "<DataSafetyCenter history={history} goals={goals} customEx={customEx}",
];

const requiredReadme=[
  "Private Data Safety Center",
  "No Supabase schema changes are required.",
];

for(const needle of requiredApp){
  if(!app.includes(needle)){
    console.error(`Missing App fragment: ${needle}`);
    process.exit(1);
  }
}

for(const needle of requiredReadme){
  if(!readme.includes(needle)){
    console.error(`Missing README fragment: ${needle}`);
    process.exit(1);
  }
}

console.log("Data Safety Center verifier passed.");
