import assert from "node:assert/strict";
import {existsSync} from "node:fs";

const helperUrl=new URL("../src/components/experience/ascii/asciiMath.js",import.meta.url);
assert.equal(existsSync(helperUrl),true,"ASCII renderer helpers must exist");
const forgeUrl=new URL("../src/components/experience/ascii/glyphForgeShaders.js",import.meta.url);
assert.equal(existsSync(forgeUrl),true,"Glyph Forge shader helpers must exist");

const {
  ASCII_RAMP,
  luminanceToGlyph,
  imageDataToAscii,
  buildTrainingSignal,
}=await import(helperUrl.href);
const {GLYPH_FORGE_RAMP,resolveGlyphForgeBudget}=await import(forgeUrl.href);

assert.equal(ASCII_RAMP.startsWith("@"),true,"ASCII ramp must start with its densest glyph");
assert.equal(ASCII_RAMP.endsWith(" "),true,"ASCII ramp must end with a space");
assert.equal(luminanceToGlyph(0,0,0,255),ASCII_RAMP[0],"Black must map to the densest glyph");
assert.equal(luminanceToGlyph(255,255,255,255)," ","White must map to a space");
assert.equal(luminanceToGlyph(0,0,0,0)," ","Transparent pixels must map to a space");
assert.equal(luminanceToGlyph(-20,400,30,255).length,1,"Out-of-range color channels must be clamped");

const pixels=new Uint8ClampedArray([
  0,0,0,255, 255,255,255,255,
  255,255,255,255, 0,0,0,255,
]);
const ascii=imageDataToAscii(pixels,2,2,{columns:2,rows:2,aspectCorrection:false});
assert.deepEqual(ascii.split("\n"),[`${ASCII_RAMP[0]} `,` ${ASCII_RAMP[0]}`],
  "Image conversion must preserve luminance positions and requested dimensions");

const signalInput={goalProgress:64,latestVolume:12450,streak:7,rows:5,columns:18};
const firstSignal=buildTrainingSignal(signalInput);
const secondSignal=buildTrainingSignal(signalInput);
assert.equal(firstSignal,secondSignal,"Training signal must be deterministic for the same real data");
const signalRows=firstSignal.split("\n");
assert.equal(signalRows.length,5,"Training signal must honor its row count");
assert.equal(signalRows.every(row=>row.length===18),true,"Training signal rows must have stable width");
assert.notEqual(buildTrainingSignal({...signalInput,goalProgress:5}),firstSignal,
  "Training signal must respond to goal progress");
const activeWithoutGoal=buildTrainingSignal({goalProgress:0,latestVolume:4940,streak:7,rows:5,columns:18});
assert.match(activeWithoutGoal,/[^\s]/,"Real volume or streak data must create a signal even when no volume goal is set");
const emptySignal=buildTrainingSignal({goalProgress:0,latestVolume:0,streak:0,rows:5,columns:18});
assert.equal(emptySignal.replace(/\n/g,"").trim(),"","A truly fresh account must keep an empty training signal");

assert.ok(GLYPH_FORGE_RAMP.length>=16,"GPU glyph ramp must provide enough density levels for detailed shading");
const desktopBudget=resolveGlyphForgeBudget({compact:false,reducedMotion:false});
assert.deepEqual(desktopBudget,{
      tier:"cinematic",
      dpr:1.5,
      cellSize:5,
  particles:520,
  spokeCount:24,
  ghostCount:4,
  targetFps:60,
},"Desktop Glyph Forge budget must preserve cinematic detail");
const mobileBudget=resolveGlyphForgeBudget({compact:true,reducedMotion:false});
assert.deepEqual(mobileBudget,{
      tier:"compact",
      dpr:1,
      cellSize:6,
  particles:180,
  spokeCount:12,
  ghostCount:1,
  targetFps:30,
},"Mobile Glyph Forge budget must remain detailed without using desktop cost");
const reducedBudget=resolveGlyphForgeBudget({compact:false,reducedMotion:true});
assert.equal(reducedBudget.tier,"still","Reduced motion must use a stable still tier");
assert.equal(reducedBudget.targetFps,0,"Reduced motion must not schedule continuous frames");

console.log("ASCII renderer behavior verified.");
