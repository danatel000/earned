const assert=require("assert");
const fs=require("fs");
const path=require("path");
const vm=require("vm");

const source=fs.readFileSync(path.join(__dirname,"..","src","App.jsx"),"utf8");

function functionBlock(name,nextName){
  const start=source.indexOf(`function ${name}`);
  const end=source.indexOf(`function ${nextName}`,start);
  assert(start>=0,`Missing ${name}`);
  assert(end>start,`Missing boundary after ${name}`);
  return source.slice(start,end);
}

function loadFunction(block,name,context){
  const sandbox=vm.createContext({...context});
  vm.runInContext(`${block}\nthis.__result=${name};`,sandbox);
  return sandbox.__result;
}

const PERIOD_TYPES={DAY:"day",WEEK:"week"};
const getComparableHistory=(history,target)=>target?.periodType===PERIOD_TYPES.DAY
  ?history.filter(entry=>entry.periodType===PERIOD_TYPES.DAY&&entry.dayKey===target.dayKey)
  :history.filter(entry=>entry.periodType!==PERIOD_TYPES.DAY);

const momentum=loadFunction(
  functionBlock("buildTrainingMomentumCoach","getExerciseOverloadDecision"),
  "buildTrainingMomentumCoach",
  {
    PERIOD_TYPES,
    calculateDailyStreak:()=>4,
    calcStreak:()=>2,
    clamp:(value,min,max)=>Math.max(min,Math.min(max,value)),
    buildWorkoutSchedule:()=>({nextScheduledWorkout:null}),
  },
)([
  {periodType:"day",dayKey:"arms",date:"2026-07-16"},
  {periodType:"day",dayKey:"legs",date:"2026-07-17"},
  {periodType:"day",dayKey:"arms",date:"2026-07-18"},
  {periodType:"day",dayKey:"chest",date:"2026-07-19"},
],{});
assert(momentum);
assert.match(momentum.streakProtection,/4-day streak/);

const quality=loadFunction(
  functionBlock("getTrainingQuality","buildTrainingQualityBreakdown"),
  "getTrainingQuality",
  {
    PERIOD_TYPES,
    getComparableHistory,
    getTotalVol:entry=>entry?.total||0,
    getMuscleVolumes:entry=>entry?.muscles||{},
    MUSCLE_GROUPS:[
      {id:"biceps"},{id:"shoulders"},{id:"chest"},{id:"back"},{id:"legs"},
    ],
    getWeekPRCount:()=>0,
    getReadinessScore:()=>null,
    calcStreak:()=>3,
    clamp:(value,min=0,max=100)=>Math.max(min,Math.min(max,value)),
  },
)([
  {periodType:"day",dayKey:"arms",total:100,muscles:{biceps:100}},
  {periodType:"day",dayKey:"legs",total:1000,muscles:{legs:1000}},
  {periodType:"day",dayKey:"arms",total:120,muscles:{biceps:120}},
],2,{});
assert.equal(quality.changePct,20);
assert(quality.components.find(component=>component.label==="Balance").value>=78);

const insights=loadFunction(
  functionBlock("buildInsights","getLiftHistory"),
  "buildInsights",
  {
    PERIOD_TYPES,
    getComparableHistory,
    DAY_KEYS:["arms"],
    DAYS:{arms:{label:"Arms"}},
    allExercises:()=>[{id:"curl",name:"Curl"}],
    getDayVol:entry=>entry?.total||0,
    getTotalVol:entry=>entry?.total||0,
    pct:(value,base)=>base?Math.round(((value-base)/base)*100):0,
  },
)([
  {periodType:"day",dayKey:"arms",total:100,exercises:{curl:{volume:100}}},
  {periodType:"day",dayKey:"legs",total:1000,exercises:{}},
  {periodType:"day",dayKey:"arms",total:120,exercises:{curl:{volume:120}}},
],{});
assert(insights.some(item=>/20 more than the last session/.test(item.text)));

console.log("Daily analytics comparison behavior verified.");
