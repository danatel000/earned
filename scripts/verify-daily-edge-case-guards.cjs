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

const required=[
  "function editableLiftCellFromStored",
  "setDetails:rows",
  "const saved=await onSubmit",
  "if(saved===false)",
  "let localSaved=false",
  "localSaved=true",
  "return localSaved",
  "const previousComparable=getComparableHistory(previousHistory,entry)",
  "const comparableHistory=getComparableHistory(history,latest)",
  "let hasLogged=false",
  "if(hasLogged&&d.volume>bestVol)",
  "{canAct&&(",
  "<WorkoutSchedulePlanner history={history}",
  "preferences:normalizePreferences({})",
];
const missing=required.filter(fragment=>!source.includes(fragment));
if(missing.length){
  console.error("Missing daily edge-case guards:");
  missing.forEach(fragment=>console.error(`- ${fragment}`));
  process.exit(1);
}

const cellStart=source.indexOf("const getLiftSetRows");
const cellEnd=source.indexOf("function allExercises",cellStart);
assert(cellStart>=0&&cellEnd>cellStart,"Missing lift-cell helper block");
const editableBlock=source.slice(cellStart,cellEnd);
const editableSandbox=vm.createContext({
  epley1RM:(weight,reps)=>reps===1?weight:Math.round(weight*(1+reps/30)),
});
vm.runInContext(`${editableBlock}\nthis.editableLiftCellFromStored=editableLiftCellFromStored;this.storedLiftFromCell=storedLiftFromCell;`,editableSandbox);
const originalLift={
  w:120,r:5,s:2,volume:1600,
  setDetails:[{w:100,r:10,quality:"good"},{w:120,r:5,quality:"hard"}],
};
const editable=editableSandbox.editableLiftCellFromStored(originalLift);
assert.deepEqual(JSON.parse(JSON.stringify(editable.setDetails)),[
  {w:"100",r:"10",quality:"good"},
  {w:"120",r:"5",quality:"hard"},
]);
const roundTripped=editableSandbox.storedLiftFromCell(editable);
assert.equal(roundTripped.volume,1600);
assert.deepEqual(JSON.parse(JSON.stringify(roundTripped.setDetails)),[
  {w:100,r:10,quality:"good"},
  {w:120,r:5,quality:"hard"},
]);

const saveAllStart=source.indexOf("const saveAll=async");
const saveAllEnd=source.indexOf("const handleSaveDraft",saveAllStart);
const saveAllBlock=source.slice(saveAllStart,saveAllEnd);
assert(saveAllBlock.indexOf("await setWithRetry(LIFT_DATA_KEY")<saveAllBlock.indexOf("await saveCloudData"));
assert(saveAllBlock.includes("if(localSaved)"));

const newPeriodStart=source.indexOf("const handleNewPeriod=async");
const newPeriodEnd=source.indexOf("const handleDelete",newPeriodStart);
const newPeriodBlock=source.slice(newPeriodStart,newPeriodEnd);
assert(newPeriodBlock.includes("if(!saved) return false"));
assert(!newPeriodBlock.includes("handleClearDraft()"));

const backupBlock=functionBlock("parseLiftTrackerBackup","DataSafetyCenter");
const backupSandbox=vm.createContext({
  normalizePreferences:value=>({trackingMode:value?.trackingMode==="daily"?"daily":"weekly"}),
});
vm.runInContext(`${backupBlock}\nthis.parseLiftTrackerBackup=parseLiftTrackerBackup;`,backupSandbox);
assert.equal(
  backupSandbox.parseLiftTrackerBackup([],{}, {}, {trackingMode:"daily"}).preferences.trackingMode,
  "weekly",
);
assert.equal(
  backupSandbox.parseLiftTrackerBackup({history:[]},{}, {}, {trackingMode:"daily"}).preferences.trackingMode,
  "weekly",
);

console.log("Daily edge-case guards verified.");
