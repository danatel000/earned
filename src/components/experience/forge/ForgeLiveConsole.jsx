import {useEffect,useMemo,useRef} from "react";
import {buildAsciiBarbell} from "./forgeAscii.js";
import AsciiRestCountdown from "./AsciiRestCountdown.jsx";
import TerminalProgressBar from "./TerminalProgressBar.jsx";
import useAsciiViewport from "./useAsciiViewport.js";
import useTerminalSound from "./useTerminalSound.js";

const safeNumber=value=>Math.max(0,Number(value)||0);

export default function ForgeLiveConsole({
  exercise="Working set",
  weight=0,
  reps=0,
  sets=0,
  completedSets=0,
  volume=0,
  restRemaining=0,
  restActive=false,
  accent="#2DD4A0",
}){
  const {tier}=useAsciiViewport();
  const {enabled,setEnabled,tick}=useTerminalSound();
  const lastAlertRef=useRef(null);
  const safeWeight=safeNumber(weight);
  const safeReps=Math.floor(safeNumber(reps));
  const safeSets=Math.floor(safeNumber(sets));
  const safeCompleted=Math.min(safeSets,Math.floor(safeNumber(completedSets)));
  const safeRest=Math.floor(safeNumber(restRemaining));
  const barWidth=tier==="compact"?28:tier==="wide"?48:38;
  const barbell=useMemo(()=>buildAsciiBarbell(safeWeight,barWidth),[safeWeight,barWidth]);

  useEffect(()=>{
    if(!enabled||!restActive||safeRest<=0||safeRest>3){
      lastAlertRef.current=null;
      return;
    }
    if(lastAlertRef.current===safeRest) return;
    lastAlertRef.current=safeRest;
    tick();
  },[enabled,restActive,safeRest,tick]);

  return(
    <section className="forge-live-console" data-forge-console
      data-forge-weight={safeWeight} data-forge-rest={restActive?"active":"idle"}
      style={{"--forge-accent":accent}} aria-label="Live workout terminal">
      <header className="forge-live-console__header">
        <div>
          <span>THE FORGE / ACTIVE LIFT</span>
          <h3>{exercise||"Working set"}</h3>
        </div>
        <button type="button" aria-pressed={enabled} onClick={()=>setEnabled(!enabled)}>
          {enabled?"Sound On":"Sound Off"}
        </button>
      </header>

      <div className="forge-live-console__grid">
        <div className="forge-live-console__input" aria-label="Current lift inputs">
          <code>{"> ENTER WEIGHT:"} <b>{safeWeight}</b> LB</code>
          <code>{"> ENTER REPS:"} <b>{safeReps}</b></code>
          <code>{"> ENTER SETS:"} <b>{safeSets}</b></code>
          <code>{"> LIVE VOLUME:"} <b>{Math.round(safeNumber(volume)).toLocaleString()}</b> LB</code>
          <div className="forge-live-console__tension">
            <span>TENSION BAR / COMPLETED SETS</span>
            <TerminalProgressBar current={safeCompleted} total={safeSets}
              width={tier==="compact"?14:22} label="Completed sets" accent="lime"/>
          </div>
        </div>

        <pre className="forge-live-console__barbell" aria-label={`ASCII barbell loaded to ${safeWeight} pounds`}>
          {barbell}
        </pre>

        <AsciiRestCountdown seconds={safeRest} active={restActive&&safeRest>0}/>
      </div>
    </section>
  );
}
