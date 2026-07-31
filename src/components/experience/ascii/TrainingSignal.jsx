import {useMemo} from "react";
import {buildTrainingSignal} from "./asciiMath.js";

export default function TrainingSignal({goalProgress=0,latestVolume=0,streak=0}){
  const progress=Math.round(Number(goalProgress)||0);
  const volume=Math.max(0,Number(latestVolume)||0);
  const signal=useMemo(()=>buildTrainingSignal({
    goalProgress,
    latestVolume,
    streak,
    rows:6,
    columns:24,
  }),[goalProgress,latestVolume,streak]);

  return(
    <div className="earned-training-signal" aria-hidden="true">
      <div className="earned-training-signal__meta">
        <span>TRAINING SIGNAL</span>
        <strong>{progress>0?`${progress}%`:volume>0?`${Math.round(volume).toLocaleString()} LB`:"READY"}</strong>
      </div>
      <pre>{signal}</pre>
      <div className="earned-training-signal__stages">
        <span>LOAD</span><span>LOG</span><span>LEARN</span><strong>EARN</strong>
      </div>
    </div>
  );
}
