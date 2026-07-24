import assert from "node:assert/strict";
import {
  resolveAsciiViewport,
  normalizeFrame,
  resolveScrambleFrame,
  buildTerminalProgress,
  resolvePlateTier,
  buildAsciiBarbell,
  resolveExerciseFamily,
  buildAnatomyFrame,
  buildHelmetFrame,
  buildPowerGrid,
  buildCountdownFrame,
  buildOneRmMeter,
} from "../src/components/experience/forge/forgeAscii.js";
import {
  SQUAT_FRAMES,
  BENCH_FRAMES,
  DEADLIFT_FRAMES,
  exerciseFramesFor,
} from "../src/components/experience/forge/ascii-frames/index.js";

const rows=frame=>String(frame).split("\n");
const widths=frame=>new Set(rows(frame).map(row=>row.length));
const litCount=frame=>(String(frame).match(/[█▓#@*]/g)||[]).length;

assert.deepEqual(resolveAsciiViewport(390,false),{tier:"compact",columns:44,fps:8});
assert.deepEqual(resolveAsciiViewport(820,false),{tier:"standard",columns:72,fps:10});
assert.deepEqual(resolveAsciiViewport(1440,false),{tier:"wide",columns:104,fps:12});
assert.deepEqual(resolveAsciiViewport(1440,true),{tier:"still",columns:72,fps:0});

const normalized=normalizeFrame(["abc","abcdef",""] ,5);
assert.equal(normalized,"abc  \nabcde\n     ");
assert.deepEqual([...widths(normalized)],[5]);

const scrambledA=resolveScrambleFrame("STATUS: READY [OK]",0.35,19);
const scrambledB=resolveScrambleFrame("STATUS: READY [OK]",0.35,19);
assert.equal(scrambledA,scrambledB,"scrambling must be deterministic");
assert.equal(scrambledA.length,"STATUS: READY [OK]".length);
assert.notEqual(scrambledA,"STATUS: READY [OK]");
assert.equal(resolveScrambleFrame("STATUS: READY [OK]",1,19),"STATUS: READY [OK]");

assert.equal(buildTerminalProgress(0,10,10),"░░░░░░░░░░");
assert.equal(buildTerminalProgress(5,10,10),"█████░░░░░");
assert.equal(buildTerminalProgress(10,10,10),"██████████");
assert.equal(buildTerminalProgress(15,10,10),"██████████");

const plateTiers=[45,135,225,315,405].map(resolvePlateTier);
assert.deepEqual(plateTiers,[0,1,2,3,4]);
const lightBar=buildAsciiBarbell(45,44);
const heavyBar=buildAsciiBarbell(405,44);
assert.deepEqual([...widths(lightBar)],[44]);
assert.deepEqual([...widths(heavyBar)],[44]);
assert.ok(litCount(heavyBar)>litCount(lightBar),"heavier barbells must draw larger plate stacks");

assert.equal(resolveExerciseFamily("Back Squat",{equipment:"barbell"}),"squat");
assert.equal(resolveExerciseFamily("Incline Bench Press",{equipment:"barbell"}),"bench");
assert.equal(resolveExerciseFamily("Romanian Deadlift",{equipment:"barbell"}),"deadlift");
assert.equal(resolveExerciseFamily("Hammer Preacher Curl",{group:"biceps"}),"curl");
assert.equal(resolveExerciseFamily("Lateral Raise",{group:"shoulders"}),"raise");
assert.equal(resolveExerciseFamily("Seated Row",{group:"back"}),"pull");

const chestMap=buildAnatomyFrame("chest","compact");
const legMap=buildAnatomyFrame("legs","compact");
assert.deepEqual([...widths(chestMap)],[24]);
assert.match(chestMap,/CC CC/);
assert.match(legMap,/LL\s+LL/);
assert.notEqual(chestMap,legMap);

const helmets=["spartan","power","iron"].map(style=>buildHelmetFrame(style,"compact"));
assert.equal(new Set(helmets).size,3,"avatar styles must have distinct silhouettes");
helmets.forEach(frame=>assert.deepEqual([...widths(frame)],[24]));

const emptyGrid=buildPowerGrid({sessions:0,streak:0,volume:0,goalProgress:0},"compact");
const chargedGrid=buildPowerGrid({sessions:18,streak:7,volume:48000,goalProgress:92},"compact");
assert.deepEqual([...widths(emptyGrid)],[28]);
assert.deepEqual([...widths(chargedGrid)],[28]);
assert.ok(litCount(chargedGrid)>litCount(emptyGrid),"training must charge more power-grid cells");

const countdown=buildCountdownFrame(63,"compact");
assert.deepEqual([...widths(countdown)],[24]);
assert.equal(rows(countdown).length,7);
assert.match(countdown,/01:03/);

const under=buildOneRmMeter(180,200,8);
const over=buildOneRmMeter(220,200,8);
assert.equal(rows(under).length,8);
assert.equal(rows(over).length,8);
assert.ok(litCount(over)>litCount(under),"an achieved overload must fill more meter cells");

for(const frames of [SQUAT_FRAMES,BENCH_FRAMES,DEADLIFT_FRAMES]){
  assert.ok(frames.length>=4,"each primary exercise needs at least four motion frames");
  frames.forEach(frame=>assert.deepEqual([...widths(frame)],[32]));
}
const compactSquat=exerciseFramesFor("squat","compact",135);
const heavySquat=exerciseFramesFor("squat","compact",405);
const benchFrames=exerciseFramesFor("bench","standard",225);
const deadliftFrames=exerciseFramesFor("deadlift","wide",315);
assert.equal(compactSquat.length,SQUAT_FRAMES.length);
compactSquat.forEach(frame=>assert.deepEqual([...widths(frame)],[30]));
benchFrames.forEach(frame=>assert.deepEqual([...widths(frame)],[38]));
deadliftFrames.forEach(frame=>assert.deepEqual([...widths(frame)],[46]));
assert.ok(litCount(heavySquat[0])>litCount(compactSquat[0]),"exercise plates must scale with working weight");

console.log("FORGE_ASCII pure engine behavior verified.");
