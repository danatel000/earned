import {useEffect,useMemo,useState} from "react";
import {buildMilestoneAsciiFrame} from "./ambientAscii.js";

export default function AsciiMilestoneBurst({volume=0,streak=0,isPR=false}){
  const [frame,setFrame]=useState(0);
  const signal=useMemo(()=>buildMilestoneAsciiFrame({
    volume,streak,isPR,frame,columns:52,rows:8,
  }),[frame,isPR,streak,volume]);

  useEffect(()=>{
    const reducedQuery=window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer=0;
    let current=0;
    const stop=()=>{if(timer){window.clearInterval(timer);timer=0;}};
    const start=()=>{
      stop();
      if(reducedQuery.matches||document.hidden||current>=18) return;
      timer=window.setInterval(()=>{
        current+=1;
        setFrame(current);
        if(current>=18) stop();
      },95);
    };
    const handleVisibility=()=>{if(document.hidden) stop();else start();};
    const handleMotionChange=()=>{
      if(reducedQuery.matches){stop();current=9;setFrame(9);}
      else start();
    };
    if(reducedQuery.matches){current=9;setFrame(9);}else start();
    document.addEventListener("visibilitychange",handleVisibility);
    reducedQuery.addEventListener?.("change",handleMotionChange);
    return()=>{
      stop();
      document.removeEventListener("visibilitychange",handleVisibility);
      reducedQuery.removeEventListener?.("change",handleMotionChange);
    };
  },[]);

  return(
    <div className="earned-milestone-burst" data-pr={isPR?"true":"false"}
      data-celebration-step="1" aria-hidden="true">
      <div className="earned-milestone-burst__meta">
        <span>{isPR?"RECORD EVENT":"SESSION EVENT"}</span>
        <strong>{isPR?"STANDARD RAISED":"WORK SECURED"}</strong>
        <small>{Math.round(Number(volume)||0).toLocaleString()} LB / {Number(streak)||0} STREAK</small>
      </div>
      <pre>{signal}</pre>
      <div className="earned-milestone-burst__rail">
        <span>LOAD</span><i/><span>LOCK</span><i/><strong>EARN</strong>
      </div>
    </div>
  );
}
