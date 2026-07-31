import {useEffect,useRef,useState} from "react";
import {resolveScrambleFrame} from "./forgeAscii.js";

export default function useAsciiTextScramble(target,{duration=360,seed=17}={}){
  const value=String(target??"");
  const [display,setDisplay]=useState(value);
  const frameRef=useRef(0);

  useEffect(()=>{
    const motionQuery=window.matchMedia("(prefers-reduced-motion: reduce)");
    if(motionQuery.matches||duration<=0){
      setDisplay(value);
      return undefined;
    }
    let disposed=false;
    const started=performance.now();
    const draw=timestamp=>{
      if(disposed) return;
      const progress=Math.min(1,(timestamp-started)/duration);
      setDisplay(resolveScrambleFrame(value,progress,seed));
      if(progress<1) frameRef.current=requestAnimationFrame(draw);
    };
    setDisplay(resolveScrambleFrame(value,0,seed));
    frameRef.current=requestAnimationFrame(draw);
    return()=>{
      disposed=true;
      if(frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current=0;
    };
  },[value,duration,seed]);

  return display;
}
