import {useEffect,useRef,useState} from "react";
import AsciiMilestoneBurst from "./ascii/AsciiMilestoneBurst.jsx";
import AsciiSaveSequence from "./forge/AsciiSaveSequence.jsx";

export default function WorkoutCelebration({
  open,
  workoutLabel,
  volume,
  streak,
  streakUnit,
  isPR,
  onClose,
  onViewProgress,
  onOpenFeed,
}){
  const primaryRef=useRef(null);
  const [saveResolved,setSaveResolved]=useState(false);

  useEffect(()=>{
    if(!open) return undefined;
    setSaveResolved(false);
    const handleKeyDown=event=>{if(event.key==="Escape") onClose?.();};
    window.addEventListener("keydown",handleKeyDown);
    return()=>window.removeEventListener("keydown",handleKeyDown);
  },[open,onClose]);

  useEffect(()=>{
    if(open&&saveResolved) primaryRef.current?.focus();
  },[open,saveResolved]);

  if(!open) return null;
  return(
    <div className="earned-celebration" role="presentation" onMouseDown={event=>{
      if(event.target===event.currentTarget) onClose?.();
    }}>
      <section className="earned-celebration__panel" role="dialog" aria-modal="true"
        aria-labelledby="earned-celebration-title" data-save-resolved={saveResolved}>
        <button className="earned-celebration__close" type="button" onClick={onClose}
          aria-label="Close workout celebration" title="Close">X</button>
        <AsciiSaveSequence volume={volume} isPR={isPR} onResolved={()=>setSaveResolved(true)}/>
        {saveResolved&&(
          <div className="earned-celebration__result">
            <AsciiMilestoneBurst volume={volume} streak={streak} isPR={isPR}/>
            <p className="earned-celebration__eyebrow" data-celebration-step="2">SESSION COMPLETE / {isPR?"NEW RECORD":"WORK SECURED"}</p>
            <h2 id="earned-celebration-title" data-celebration-step="3">{isPR?"You raised the standard.":"That work is yours now."}</h2>
            <p className="earned-celebration__workout" data-celebration-step="4">{workoutLabel}</p>
            <div className="earned-celebration__metrics" data-celebration-step="5">
              <div><span>VOLUME</span><strong>{Number(volume||0).toLocaleString()}</strong><small>lbs</small></div>
              <div><span>STREAK</span><strong>{Number(streak||0)}</strong><small>{streakUnit}</small></div>
              <div><span>RESULT</span><strong>{isPR?"PR":"SAVED"}</strong><small>{isPR?"personal best":"synced"}</small></div>
            </div>
            <p className="earned-celebration__copy" data-celebration-step="6">
              {isPR
                ?"Your new best is in the record. Recover, come back, and give the next session something to chase."
                :"The dashboard has already updated. Review the signal or share the session with your training circle."}
            </p>
            <div className="earned-celebration__actions" data-celebration-step="7">
              <button ref={primaryRef} type="button" onClick={onViewProgress}>View progress <span aria-hidden="true">-&gt;</span></button>
              <button type="button" onClick={onOpenFeed}>Open feed</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
