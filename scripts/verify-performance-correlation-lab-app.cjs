const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(root,"src","App.jsx"),"utf8");
const readme=fs.readFileSync(path.join(root,"README.md"),"utf8");

const requiredApp=[
  "function buildPerformanceCorrelations",
  "function PerformanceCorrelationLab",
  "buildPerformanceCorrelations(history,customEx)",
  "Performance Correlation Lab",
  "Readiness Signal",
  "Sleep Impact",
  "Energy Impact",
  "Soreness Drag",
  "Bodyweight Context",
  "Signal Strength",
  "Coach Cue",
  "correlationLab",
  "bodyMetrics(customEx)",
  "getReadinessScore",
];

const requiredReadme=[
  "Private Performance Correlation Lab",
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

console.log("Performance Correlation Lab verifier passed.");
