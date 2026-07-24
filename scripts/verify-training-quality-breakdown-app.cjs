const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(root,"src","App.jsx"),"utf8");
const readme=fs.readFileSync(path.join(root,"README.md"),"utf8");
const combined=`${app}\n${readme}`;

const required=[
  "function buildTrainingQualityBreakdown",
  "function TrainingQualityBreakdown",
  "buildTrainingQualityBreakdown(history,customEx)",
  "<TrainingQualityBreakdown history={history} customEx={customEx}/>",
  "getTrainingQuality(history,index,customEx)",
  ".slice(-6)",
  "scoreDelta",
  "strongestComponent",
  "priorityComponent",
  "coachActions",
  "qualityTrend",
  "Training Quality Breakdown",
  "Strongest driver",
  "Priority",
  "Next Actions",
  "Baseline ${latestEntry?.periodType===PERIOD_TYPES.DAY?\"session\":\"week\"}",
  "Load",
  "Balance",
  "Recovery",
  "Progress",
  "Consistency",
  "Private Training Quality Breakdown",
  "No Supabase schema changes are required.",
];

const missing=required.filter(fragment=>!combined.includes(fragment));
if(missing.length){
  console.error("Missing Training Quality Breakdown fragments:");
  for(const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

console.log("Training Quality Breakdown verifier passed.");
