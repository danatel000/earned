import {useEffect,useId,useState} from "react";
import {EarnedKineticButton,EarnedSignalText} from "./EarnedInterfaceKit.jsx";

const proofSignals=[
  {
    code:"TRAINING MEMORY",
    title:"A skipped exercise stays out of volume, not out of memory.",
    body:"Earned keeps the last completed weight and reps ready for the next session while excluding intentional skips from the current total.",
    status:"CONTEXT PRESERVED",
  },
  {
    code:"FLEXIBLE PROGRESSION",
    title:"Daily and weekly modes change the lens, not the record.",
    body:"The same logged work can be reviewed at the cadence that matches the user's training style.",
    status:"ONE SOURCE OF TRUTH",
  },
  {
    code:"PRIVATE BASELINE",
    title:"Every new account starts with a clean slate.",
    body:"Volume, PRs, streaks, goals, and workout values begin at zero and remain isolated to that account.",
    status:"ACCOUNT ISOLATED",
  },
  {
    code:"VISIBLE VALUE",
    title:"Premium is previewed through outcomes, never hidden behind confusion.",
    body:"Free logging stays useful while advanced analytics clearly explain what deeper training context adds.",
    status:"UPGRADE WITH CONTEXT",
  },
];

export default function LaunchProofCarousel(){
  const [index,setIndex]=useState(0);
  const [paused,setPaused]=useState(false);
  const baseId=useId();
  const current=proofSignals[index];

  useEffect(()=>{
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(reduced||paused)return undefined;

    const timer=window.setInterval(()=>{
      if(!document.hidden)setIndex(value=>(value+1)%proofSignals.length);
    },7000);

    return()=>window.clearInterval(timer);
  },[paused]);

  const move=direction=>setIndex(value=>(value+direction+proofSignals.length)%proofSignals.length);

  return(
    <section
      className="earned-proof-carousel"
      aria-labelledby="proof-carousel-title"
      onPointerEnter={()=>setPaused(true)}
      onPointerLeave={()=>setPaused(false)}
      onFocusCapture={()=>setPaused(true)}
      onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setPaused(false);}}
      data-motion-section="proof-carousel"
    >
      <div className="earned-proof-carousel__heading" data-reveal="title">
        <EarnedSignalText>PRODUCT PROOF / 03</EarnedSignalText>
        <h2 id="proof-carousel-title">Small decisions that protect the record.</h2>
      </div>

      <div className="earned-proof-carousel__stage" aria-live="polite" aria-atomic="true" data-reveal="rise">
        <div className="earned-proof-carousel__index" aria-hidden="true">
          <span>{String(index+1).padStart(2,"0")}</span>
          <i/>
          <span>{String(proofSignals.length).padStart(2,"0")}</span>
        </div>
        <article id={`${baseId}-proof-${index}`}>
          <span>{current.code}</span>
          <h3>{current.title}</h3>
          <p>{current.body}</p>
          <strong><i aria-hidden="true"/>{current.status}</strong>
        </article>
      </div>

      <div className="earned-proof-carousel__controls" aria-label="Product proof controls">
        <div role="group" aria-label="Choose a product proof">
          {proofSignals.map((item,itemIndex)=>(
            <button
              key={item.code}
              type="button"
              aria-label={`Show proof ${itemIndex+1}: ${item.code}`}
              aria-pressed={index===itemIndex}
              onClick={()=>setIndex(itemIndex)}
            />
          ))}
        </div>
        <div>
          <EarnedKineticButton variant="icon" arrow={"\u2190"} aria-label="Previous product proof" onClick={()=>move(-1)}>
            <span className="earned-visually-hidden">Previous</span>
          </EarnedKineticButton>
          <EarnedKineticButton variant="icon" arrow={"\u2192"} aria-label="Next product proof" onClick={()=>move(1)}>
            <span className="earned-visually-hidden">Next</span>
          </EarnedKineticButton>
        </div>
      </div>
    </section>
  );
}
