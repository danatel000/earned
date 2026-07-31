export default function WorkoutEcosystemRail({signal,onNavigate,onOpenPremium}){
  if(!signal) return null;

  const activate=action=>{
    if(!action) return;
    if(action.target==="premium") onOpenPremium?.();
    else onNavigate?.(action.target);
  };

  return(
    <section className="earned-workout-rail" data-accent={signal.accent}
      aria-label={`${signal.eyebrow} workout command rail`} aria-live="polite">
      <div className="earned-workout-rail__signal">
        <span>{signal.index} / {signal.eyebrow}</span>
        <strong>{signal.signal}</strong>
        <div className="earned-workout-rail__track" aria-label={`${signal.progressLabel}: ${signal.progress}%`}>
          <i style={{"--earned-signal-progress":`${signal.progress}%`}}/>
        </div>
        <small>{signal.progressLabel} / {signal.progress}%</small>
      </div>

      <div className="earned-workout-rail__metrics" aria-label="Current view metrics">
        {signal.metrics.map(metric=>(
          <div key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>

      <div className="earned-workout-rail__actions">
        {signal.secondary&&(
          <button type="button" className="earned-workout-rail__secondary"
            onClick={()=>activate(signal.secondary)}>
            {signal.secondary.label}
          </button>
        )}
        {signal.primary&&(
          <button type="button" className="earned-workout-rail__primary"
            onClick={()=>activate(signal.primary)}>
            <span>{signal.primary.label}</span><b aria-hidden="true">+</b>
          </button>
        )}
      </div>
    </section>
  );
}

