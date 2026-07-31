import {useEffect,useRef,useState} from "react";

export default function useAsciiFrameLoop(frames=[],fps=8){
  const [frameIndex,setFrameIndex]=useState(0);
  const frameIdRef=useRef(0);
  const lastFrameRef=useRef(0);

  useEffect(()=>{
    const motionQuery=window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed=false;
    let visible=!document.hidden;
    const frameCount=Math.max(1,frames.length);
    const interval=1000/Math.max(1,Number(fps)||8);

    const cancel=()=>{
      if(frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current=0;
    };
    const draw=timestamp=>{
      frameIdRef.current=0;
      if(disposed||!visible||motionQuery.matches||fps<=0) return;
      if(timestamp-lastFrameRef.current>=interval){
        lastFrameRef.current=timestamp;
        setFrameIndex(index=>(index+1)%frameCount);
      }
      frameIdRef.current=requestAnimationFrame(draw);
    };
    const start=()=>{
      cancel();
      if(!disposed&&visible&&!motionQuery.matches&&fps>0&&frameCount>1){
        frameIdRef.current=requestAnimationFrame(draw);
      }else{
        setFrameIndex(0);
      }
    };
    const handleVisibility=()=>{
      visible=!document.hidden;
      if(visible) start();
      else cancel();
    };
    const handleMotion=()=>start();

    document.addEventListener("visibilitychange",handleVisibility);
    motionQuery.addEventListener?.("change",handleMotion);
    start();
    return()=>{
      disposed=true;
      cancel();
      document.removeEventListener("visibilitychange",handleVisibility);
      motionQuery.removeEventListener?.("change",handleMotion);
    };
  },[frames,fps]);

  return frames.length?frames[frameIndex%frames.length]:"";
}
