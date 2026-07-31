import {useEffect,useMemo,useState} from "react";
import {buildWorkoutAsciiFrame} from "./ambientAscii.js";

const safeAccent=value=>/^#[0-9a-f]{6}$/i.test(String(value||""))?value:"#9dff00";

export default function WorkoutAsciiReactor({
  volume=0,
  setCount=0,
  loggedCount=0,
  restRemaining=0,
  readiness=0,
  accent="#9dff00",
}){
  const [frame,setFrame]=useState(0);
  const color=safeAccent(accent);
  const isResting=Number(restRemaining)>0;
  const signal=useMemo(()=>buildWorkoutAsciiFrame({
    volume,setCount,loggedCount,restRemaining,readiness,frame,columns:54,rows:7,
  }),[frame,loggedCount,readiness,restRemaining,setCount,volume]);
  const load=Math.min(100,Math.round(
    (Math.log10(Math.max(0,Number(volume)||0)+1)*11)+
    (Math.max(0,Number(setCount)||0)*2.4)+
    (Math.max(0,Number(loggedCount)||0)*4),
  ));

  useEffect(()=>{
    const reducedQuery=window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer=0;
    const stop=()=>{if(timer){window.clearInterval(timer);timer=0;}};
    const start=()=>{
      stop();
      if(reducedQuery.matches||document.hidden) return;
      timer=window.setInterval(()=>setFrame(value=>(value+1)%96),180);
    };
    const handleVisibility=()=>{if(document.hidden) stop();else start();};
    const handleMotionChange=()=>{if(reducedQuery.matches){stop();setFrame(0);}else start();};
    start();
    document.addEventListener("visibilitychange",handleVisibility);
    reducedQuery.addEventListener?.("change",handleMotionChange);
    return()=>{
      stop();
      document.removeEventListener("visibilitychange",handleVisibility);
      reducedQuery.removeEventListener?.("change",handleMotionChange);
    };
  },[]);

  return(
    <section className={`earned-workout-reactor${isResting?" earned-workout-reactor--resting":""}`}
      style={{"--reactor-accent":color,"--reactor-load":`${load}%`}}
      data-reactor-state={isResting?"rest":"active"} aria-hidden="true">
      <div className="earned-workout-reactor__scan"/>
      <div className="earned-workout-reactor__meta">
        <div><span>LIVE REP REACTOR</span><strong>{isResting?"RECOVERY PHASE":"FORCE SIGNAL"}</strong></div>
        <div><span>{Number(setCount)||0} SETS</span><strong>{Math.round(Number(volume)||0).toLocaleString()} LB</strong></div>
      </div>
      <pre>{signal}</pre>
      <div className="earned-workout-reactor__rail">
        <span>LOAD</span><i><b/></i><span>LOCKOUT</span><strong>EARN</strong>
      </div>
    </section>
  );
}
