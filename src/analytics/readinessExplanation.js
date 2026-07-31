function clampReadiness(value){
  return Math.max(1,Math.min(5,Math.round(Number(value)||3)));
}

export function buildReadinessExplanation({sleep=3,energy=3,soreness=3,volumeDeltaPct=null}={}){
  const cleanSleep=clampReadiness(sleep);
  const cleanEnergy=clampReadiness(energy);
  const cleanSoreness=clampReadiness(soreness);
  const cleanVolumeDelta=Number.isFinite(Number(volumeDeltaPct))?Number(volumeDeltaPct):null;

  const positive=cleanEnergy>=4
    ?"Energy is supporting the planned work."
    :cleanSleep>=4
      ?"Sleep is supporting the planned work."
      :cleanSoreness<=2
        ?"Low soreness supports the planned work."
        :"No strong positive signal is logged yet.";

  const limiting=cleanSoreness>=4
    ?"High soreness is the main reason to protect quality."
    :cleanEnergy<=2
      ?"Low energy is the main reason to protect quality."
      :cleanSleep<=2
        ?"Low sleep is the main reason to protect quality."
        :cleanVolumeDelta!==null&&cleanVolumeDelta>=25
          ?"Live volume is already rising quickly versus your last session."
          :"No major limiter is logged right now.";

  return {
    positive,
    limiting,
    summary:`${positive} ${limiting}`,
  };
}
