const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(root,"src","App.jsx"),"utf8");
const readme=fs.readFileSync(path.join(root,"README.md"),"utf8");

const requiredApp=[
  "function buildStarterLaunchpad",
  "function StarterLaunchpad",
  "buildStarterLaunchpad(history,goals,customEx)",
  "<section className=\"earned-starter\"",
  "STARTER PATH /",
  "Make Earned yours.",
  "NEXT BEST STEP",
  "earned-starter__progress",
  "aria-label=\"Account setup steps\"",
  "First Workout",
  "Weekly Goal",
  "Bodyweight Entry",
  "Exercise Notes",
  "Routine Customization",
  "Open Log",
  "Open Goals",
  "Open Library",
  "Open Lifts",
  "starterLaunchpad:true",
  "onNavigate",
  "<StarterLaunchpad history={history} goals={goals} customEx={customEx} onNavigate={onNavigate}/>",
  "onNavigate={navigateToView}",
];

const requiredReadme=[
  "Private Starter Launchpad",
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

console.log("Starter Launchpad verifier passed.");
