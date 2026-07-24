const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(root,"src","App.jsx"),"utf8");
const readme=fs.readFileSync(path.join(root,"README.md"),"utf8");

const requiredApp=[
  "function buildTrainingMomentumCoach",
  "function TrainingMomentumCoach",
  "buildTrainingMomentumCoach(history,customEx)",
  "Training Momentum Coach",
  "Days Since Last Lift",
  "Momentum Score",
  "Last 14 Days",
  "Average Gap",
  "Next Best Lift",
  "Comeback Plan",
  "Streak Protection",
  "Start Momentum Plan",
  "trainingMomentumCoach:true",
  "buildWorkoutSchedule(history,customEx)",
  "<TrainingMomentumCoach history={history} customEx={customEx}",
];

const requiredReadme=[
  "Private Training Momentum Coach",
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

console.log("Training Momentum Coach verifier passed.");
