import assert from "node:assert/strict";
import * as ambientAscii from "../src/components/experience/ascii/ambientAscii.js";

const {
  AMBIENT_MOTION_RATE,
  ASCII_VIEW_PROFILES,
  resolveAmbientAsciiBudget,
  buildAmbientGlyphs,
  buildWorkoutAsciiFrame,
  buildMilestoneAsciiFrame,
}=ambientAscii;

assert.deepEqual(Object.keys(ASCII_VIEW_PROFILES),[
  "total","log","lifts","prs","history","goals","library","community",
],"Every authenticated Earned view needs a distinct ASCII profile");

assert.deepEqual(resolveAmbientAsciiBudget(),{
  tier:"cinematic",particles:360,targetFps:30,dpr:1.25,
},"Desktop atmosphere must fill the product canvas with the cinematic budget");
assert.deepEqual(resolveAmbientAsciiBudget({compact:true}),{
  tier:"compact",particles:150,targetFps:20,dpr:1,
},"Mobile atmosphere must use a compact budget");
assert.deepEqual(resolveAmbientAsciiBudget({reducedMotion:true}),{
  tier:"still",particles:180,targetFps:0,dpr:1,
},"Reduced motion must render a stable frame");
assert.equal(AMBIENT_MOTION_RATE,1.18,"Authenticated ASCII motion must run at the approved faster tempo");

const glyphOptions={view:"log",width:900,height:700,count:180,seed:73};
const firstGlyphs=buildAmbientGlyphs(glyphOptions);
const secondGlyphs=buildAmbientGlyphs(glyphOptions);
assert.equal(firstGlyphs.length,180,"Ambient builder must honor the bounded glyph count");
assert.deepEqual(firstGlyphs,secondGlyphs,"Ambient glyph geometry must be deterministic");
assert.equal(firstGlyphs.every(point=>point.x>=0&&point.x<=900&&point.y>=0&&point.y<=700),true,
  "Ambient glyphs must remain within their canvas bounds");
assert.notDeepEqual(firstGlyphs,buildAmbientGlyphs({...glyphOptions,view:"goals"}),
  "Each view profile must produce a distinct constellation");
const occupiedRegions=new Set(firstGlyphs.map(point=>{
  const column=Math.min(2,Math.floor(point.x/(900/3)));
  const row=Math.min(2,Math.floor(point.y/(700/3)));
  return `${column}:${row}`;
}));
assert.ok(occupiedRegions.size>=8,
  `Authenticated atmosphere must fill at least eight viewport regions; found ${occupiedRegions.size}`);
assert.ok(Math.max(...firstGlyphs.map(point=>point.size))>=17,
  "Authenticated atmosphere must include larger foreground ASCII glyphs");

const workoutBase={volume:4200,setCount:8,loggedCount:3,restRemaining:0,readiness:76,frame:2,columns:48,rows:7};
const workoutFrame=buildWorkoutAsciiFrame(workoutBase);
const workoutRows=workoutFrame.split("\n");
assert.equal(workoutRows.length,7,"Workout reactor must keep a fixed row count");
assert.equal(workoutRows.every(row=>row.length===48),true,"Workout reactor must keep a fixed column count");
assert.notEqual(workoutFrame,buildWorkoutAsciiFrame({...workoutBase,volume:8800,setCount:14}),
  "Workout reactor must respond to real logged work");
assert.notEqual(workoutFrame,buildWorkoutAsciiFrame({...workoutBase,restRemaining:45}),
  "Workout reactor must visibly enter its rest phase");

const milestone=buildMilestoneAsciiFrame({volume:12600,streak:7,isPR:true,frame:3,columns:52,rows:8});
const milestoneRows=milestone.split("\n");
assert.equal(milestoneRows.length,8,"Milestone burst must keep a stable row count");
assert.equal(milestoneRows.every(row=>row.length===52),true,"Milestone burst must keep a stable column count");
assert.notEqual(milestone,buildMilestoneAsciiFrame({volume:12600,streak:7,isPR:false,frame:3,columns:52,rows:8}),
  "PR milestones must have a distinct signal");

console.log("App-wide ASCII atmosphere behavior verified.");
