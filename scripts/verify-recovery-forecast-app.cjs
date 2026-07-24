const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(root,"src","App.jsx"),"utf8");
const readme=fs.readFileSync(path.join(root,"README.md"),"utf8");
const combined=`${app}\n${readme}`;

const required=[
  "function buildRecoveryForecast",
  "function RecoveryForecastPanel",
  "buildRecoveryForecast(history,customEx)",
  "<RecoveryForecastPanel history={history} customEx={customEx}/>",
  "Recovery Forecast",
  "Next session",
  "In 24 hours",
  "In 48 hours",
  "Progression ready",
  "Controlled",
  "Recovery",
  "Training estimate, not medical advice",
  "getFatigueTrend(history,customEx)",
  "getTrainingQuality(history,history.length-1,customEx)",
  "getReadinessScore(latest.readiness)",
  "Private Recovery Forecast",
  "No Supabase schema changes are required.",
];

const missing=required.filter(fragment=>!combined.includes(fragment));
if(missing.length){
  console.error("Missing Recovery Forecast fragments:");
  for(const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

console.log("Recovery Forecast verifier passed.");
