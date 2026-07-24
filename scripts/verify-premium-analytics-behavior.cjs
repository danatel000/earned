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

const clamp=(value,min=0,max=100)=>Math.max(min,Math.min(max,value));
const recoveryBlock=functionBlock("buildRecoveryForecast","buildMuscleDriftAlerts");
const buildRecoveryForecast=loadFunction(recoveryBlock,"buildRecoveryForecast",{
  clamp,
  PERIOD_TYPES:{DAY:"day",WEEK:"week"},
  getFatigueTrend:()=>[{Fatigue:68},{Fatigue:80}],
  getTrainingQuality:()=>({score:55,components:[{label:"Recovery",value:45}]}),
  getReadinessScore:readiness=>readiness?.score??null,
});
const recoveryHistory=[
  {rpe:7,rating:3,readiness:{score:60}},
  {rpe:9,rating:2,readiness:{score:45}},
];
const recovery=buildRecoveryForecast(recoveryHistory,{});
assert.strictEqual(recovery.recommendation,"Recovery");
assert.strictEqual(recovery.horizons.length,3);
assert(recovery.horizons[1].score>=recovery.horizons[0].score);
assert(recovery.horizons[2].score>=recovery.horizons[1].score);
assert(recovery.horizons.every(item=>item.score>=0&&item.score<=96));

const groups=[
  {id:"biceps",label:"Biceps",color:"#1"},
  {id:"shoulders",label:"Shoulders",color:"#2"},
  {id:"chest",label:"Chest",color:"#3"},
  {id:"back",label:"Back",color:"#4"},
  {id:"legs",label:"Legs",color:"#5"},
];
const driftBlock=functionBlock("buildMuscleDriftAlerts","buildJointStressGuardrails");
const buildMuscleDriftAlerts=loadFunction(driftBlock,"buildMuscleDriftAlerts",{
  MUSCLE_GROUPS:groups,
  getMuscleVolumes:entry=>entry.muscles,
});
const baseline={biceps:800,shoulders:50,chest:50,back:50,legs:50};
const recent={biceps:100,shoulders:50,chest:750,back:50,legs:50};
const driftHistory=[
  {muscles:baseline},{muscles:baseline},{muscles:baseline},
  {muscles:recent},{muscles:recent},{muscles:recent},
];
const drift=buildMuscleDriftAlerts(driftHistory,{});
assert.strictEqual(drift.hasEnoughHistory,true);
assert(drift.alerts.some(item=>item.state==="Falling behind"&&item.id==="biceps"));
assert(drift.alerts.some(item=>item.state==="Gaining ground"&&item.id==="chest"));
const stable=buildMuscleDriftAlerts(Array.from({length:6},()=>({muscles:baseline})),{});
assert(stable.alerts.some(item=>item.state==="Stable"));

const qualityBlock=functionBlock("buildTrainingQualityBreakdown","getFatigueTrend");
const qualityRows=[
  {score:70,grade:"B+",color:"#a",summary:"First",components:[
    {label:"Load",value:60,color:"#1"},{label:"Balance",value:65,color:"#2"},
    {label:"Recovery",value:70,color:"#3"},{label:"Progress",value:75,color:"#4"},
    {label:"Consistency",value:80,color:"#5"},
  ]},
  {score:78,grade:"B+",color:"#b",summary:"Second",components:[
    {label:"Load",value:72,color:"#1"},{label:"Balance",value:62,color:"#2"},
    {label:"Recovery",value:76,color:"#3"},{label:"Progress",value:82,color:"#4"},
    {label:"Consistency",value:84,color:"#5"},
  ]},
];
const buildTrainingQualityBreakdown=loadFunction(qualityBlock,"buildTrainingQualityBreakdown",{
  getTrainingQuality:(history,index)=>qualityRows[index],
  getEntryShortLabel:(_entry,index)=>`W${index+1}`,
  getComparableHistory:history=>history,
  PERIOD_TYPES:{DAY:"day",WEEK:"week"},
});
const breakdown=buildTrainingQualityBreakdown([{},{}],{});
assert.strictEqual(breakdown.scoreDelta,8);
assert.strictEqual(breakdown.priorityComponent.label,"Balance");
assert.strictEqual(breakdown.strongestComponent.label,"Consistency");
assert.strictEqual(breakdown.coachActions.length,2);
assert.strictEqual(breakdown.qualityTrend.length,2);

console.log("Premium analytics behavior verifier passed.");
