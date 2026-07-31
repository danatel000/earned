import {useEffect,useMemo,useRef,useState} from "react";
import {buildAsciiBarbell,normalizeFrame} from "./forgeAscii.js";
import useAsciiFrameLoop from "./useAsciiFrameLoop.js";
import useAsciiTextScramble from "./useAsciiTextScramble.js";
import useAsciiViewport from "./useAsciiViewport.js";

export default function AsciiSaveSequence({volume=0,isPR=false,onResolved}){
  const {tier,fps}=useAsciiViewport();
  const [resolved,setResolved]=useState(false);
  const resolvedRef=useRef(false);
  const frames=useMemo(()=>{
    const width=tier==="compact"?34:46;
    const bar=buildAsciiBarbell(Math.max(45,Math.min(405,(Number(volume)||0)/18)),width);
    return ["[·] WRITE", "[■] WRITE", "[□] VERIFY", "[■] LOCK"].map((label,index)=>normalizeFrame([
      label, "", ...bar.split("\n").slice(index%2?2:3,index%2?8:7), "", "COMMIT TRAINING BLOCK",
    ],width));
  },[tier,volume]);
  const activeFrame=useAsciiFrameLoop(frames,Math.min(9,fps||9));
  const message=useAsciiTextScramble(resolved?"[SAVED TO BLOCK]":"[WRITING TRAINING BLOCK]",{
    duration:resolved?220:0,seed:73,
  });

  useEffect(()=>{
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer=window.setTimeout(()=>{
      if(resolvedRef.current) return;
      resolvedRef.current=true;
      setResolved(true);
      onResolved?.();
    },reduced?40:680);
    return()=>window.clearTimeout(timer);
  },[onResolved]);

  return(
    <div className="forge-save" data-forge-save-state={resolved?"resolved":"writing"}
      role="status" aria-live="polite">
      <pre aria-hidden="true">{activeFrame}</pre>
      <strong>{message}</strong>
      {resolved&&isPR&&<span>VITALS: OVERLOAD ACHIEVED</span>}
    </div>
  );
}
