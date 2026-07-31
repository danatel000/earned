import {useMemo} from "react";
import {resolveExerciseFamily} from "./forgeAscii.js";
import {exerciseFramesFor} from "./ascii-frames/index.js";
import useAsciiFrameLoop from "./useAsciiFrameLoop.js";
import useAsciiViewport from "./useAsciiViewport.js";

export default function AsciiExerciseAnimator({exercise,profile={},weight=45,frameRate=8}){
  const {tier,fps}=useAsciiViewport();
  const name=typeof exercise==="string"?exercise:exercise?.name||"Exercise";
  const family=resolveExerciseFamily(name,profile);
  const frames=useMemo(()=>exerciseFramesFor(family,tier,weight),[family,tier,weight]);
  const frame=useAsciiFrameLoop(frames,Math.min(frameRate,fps||frameRate));
  return(
    <figure className="forge-exercise" data-forge-exercise={family} data-forge-tier={tier}
      aria-label={`${name} ASCII movement preview at ${Number(weight)||0} pounds`}>
      <figcaption><span>MOTION PATH</span><strong>{name}</strong><small>{Number(weight)||0} LB LOAD</small></figcaption>
      <pre aria-hidden="true">{frame}</pre>
      <p>ASCII path preview. Use the setup and technique guidance below for execution details.</p>
    </figure>
  );
}
