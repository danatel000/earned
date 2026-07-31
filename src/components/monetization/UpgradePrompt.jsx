export default function UpgradePrompt({title,description,onUpgrade,onDismiss,compact=false}){
  return(
    <section className={`earned-upgrade${compact?" earned-upgrade--compact":""}`}>
      <div>
        <span>PREMIUM SIGNAL</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="earned-upgrade__actions">
        <button type="button" onClick={onUpgrade}>Explore Premium <span aria-hidden="true">→</span></button>
        {onDismiss&&(
          <button type="button" onClick={onDismiss} title="Dismiss" aria-label="Dismiss upgrade prompt">×</button>
        )}
      </div>
    </section>
  );
}
