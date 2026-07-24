const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(root,"src","App.jsx"),"utf8");
const readme=fs.readFileSync(path.join(root,"README.md"),"utf8");

const requiredApp=[
  "function buildWorkoutReadinessGate",
  "function WorkoutReadinessGate",
  "buildWorkoutReadinessGate(readinessScore,readiness,previewVol,prevDayVol,activeLoggedCount)",
  "Workout Readiness Gate",
  "Recommended Mode",
  "Push Day",
  "Normal Training",
  "Controlled Session",
  "Recovery Bias",
  "Volume Check",
  "Readiness Mix",
  "Log Guidance",
  "workoutReadinessGate:true",
  "<WorkoutReadinessGate gate={workoutReadinessGate}/>",
];

const requiredReadme=[
  "Private Workout Readiness Gate",
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

console.log("Workout Readiness Gate verifier passed.");
