import {buildAsciiBarbell,normalizeFrame} from "../forgeAscii.js";
import {SQUAT_FRAMES} from "./squat.js";
import {BENCH_FRAMES} from "./bench.js";
import {DEADLIFT_FRAMES} from "./deadlift.js";

export {SQUAT_FRAMES,BENCH_FRAMES,DEADLIFT_FRAMES};

const FRAME_WIDTH=32;
const outputWidth=tier=>tier==="compact"?30:tier==="wide"?46:38;

function fitLine(line,width){
  const value=String(line||"");
  if(value.length===width) return value;
  if(value.length<width){
    const left=Math.floor((width-value.length)/2);
    return `${" ".repeat(left)}${value}`.padEnd(width);
  }
  const start=Math.max(0,Math.floor((value.length-width)/2));
  return value.slice(start,start+width);
}

function genericFrames(family){
  const label=String(family||"lift").toUpperCase().slice(0,12);
  return [0,1,2,3].map(phase=>normalizeFrame([
    "", "       FORCE PATH", `       ${"↑".repeat(phase+1)}`, "",
    `       [ ${label} ]`, "        O", phase%2?"       /|\\":"      __|__",
    phase%2?"       / \\":"       / \\", "<<BAR.TOP>>", "<<BAR.MID>>",
    "<<BAR.BOT>>", "",
  ],FRAME_WIDTH));
}

export function exerciseFramesFor(family="lift",tier="standard",weight=45){
  const width=outputWidth(tier);
  const source=family==="squat"?SQUAT_FRAMES
    :family==="bench"?BENCH_FRAMES
      :family==="deadlift"?DEADLIFT_FRAMES
        :genericFrames(family);
  const barRows=buildAsciiBarbell(weight,width).split("\n");
  const replacements={
    "<<BAR.TOP>>":barRows[3],
    "<<BAR.MID>>":barRows[4],
    "<<BAR.BOT>>":barRows[5],
  };
  return source.map(frame=>normalizeFrame(frame.split("\n").map(line=>{
    const marker=line.trim();
    return replacements[marker]||fitLine(line,width);
  }),width));
}
