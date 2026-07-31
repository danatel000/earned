export default function PremiumGate({access,title,description,onUpgrade,children,previewLabel="Premium Preview"}){
  if(access?.allowed){
    return(
      <div className="earned-premium-gate earned-premium-gate--open">
        {access.isPreview&&(
          <button className="earned-premium-gate__label" type="button" onClick={onUpgrade} title="View Premium plans">
            {previewLabel}
          </button>
        )}
        {children}
      </div>
    );
  }

  return(
    <section className="earned-premium-gate earned-premium-gate--locked">
      <span>PREMIUM / GO DEEPER</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <button type="button" onClick={onUpgrade}>Explore Premium <span aria-hidden="true">→</span></button>
    </section>
  );
}
