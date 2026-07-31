import { useEffect, useState } from "react";
import { PLAN_IDS, getPlan } from "../../monetization/plans.js";

const freeBenefits=[
  "Unlimited workout logging",
  "PRs, streaks, goals, and recent history",
  "Offline logging, cloud sync, and backup",
  "Community feed and workout sharing",
];

const premiumBenefits=[
  "Fatigue, recovery, and training-quality insights",
  "Smart programs and adaptive workout guidance",
  "All-time analytics and unlimited customization",
  "Future recovery and wearable recommendations",
];

function BenefitList({items}){
  return(
    <ul className="earned-pricing__benefits">
      {items.map(item=><li key={item}>{item}</li>)}
    </ul>
  );
}

export default function PricingView({open,onClose,subscription,onStartPreview}){
  const [cadence,setCadence]=useState("annual");
  useEffect(()=>{
    if(!open) return undefined;
    const handleKeyDown=event=>{ if(event.key==="Escape") onClose?.(); };
    window.addEventListener("keydown",handleKeyDown);
    return()=>window.removeEventListener("keydown",handleKeyDown);
  },[open,onClose]);
  if(!open) return null;

  const free=getPlan(PLAN_IDS.FREE);
  const premium=getPlan(PLAN_IDS.PREMIUM);
  const previewActive=subscription?.status==="preview";
  const price=cadence==="annual"?"$19.99":"$2.99";
  const period=cadence==="annual"?"per year":"per month";

  return(
    <div className="earned-pricing" role="presentation" onMouseDown={event=>{
      if(event.target===event.currentTarget) onClose?.();
    }}>
      <section className="earned-pricing__panel" role="dialog" aria-modal="true" aria-labelledby="pricing-title">
        <header className="earned-pricing__header">
          <div>
            <span>Earned Plans / Premium Preview</span>
            <h2 id="pricing-title">Train with clarity, not guesswork.</h2>
            <p>Keep the logger useful for free. Go deeper when the signal matters.</p>
          </div>
          <button type="button" onClick={onClose} title="Close pricing" aria-label="Close pricing">×</button>
        </header>

        <div className="earned-pricing__body">
          <div className="earned-pricing__cadence" aria-label="Billing period">
            {[{id:"monthly",label:"Monthly"},{id:"annual",label:"Annual"}].map(option=>(
              <button key={option.id} type="button" onClick={()=>setCadence(option.id)}
                aria-pressed={cadence===option.id}>{option.label}</button>
            ))}
          </div>

          <div className="earned-pricing__grid">
            <section className="earned-pricing__plan">
              <span>01 / {free.eyebrow}</span>
              <h3>{free.name}</h3>
              <div className="earned-pricing__price"><strong>$0</strong><small>forever</small></div>
              <BenefitList items={freeBenefits}/>
              <p>Everything needed to keep showing up.</p>
            </section>

            <section className="earned-pricing__plan earned-pricing__plan--premium">
              <span>02 / {premium.name}</span>
              <div className="earned-pricing__plan-title">
                <h3>Premium</h3>
                {cadence==="annual"&&<small>BEST VALUE</small>}
              </div>
              <div className="earned-pricing__price"><strong>{price}</strong><small>{period}</small></div>
              {cadence==="annual"&&<p className="earned-pricing__value">About $1.67/month at the founding price.</p>}
              <BenefitList items={premiumBenefits}/>
              <button className="earned-pricing__preview" type="button" onClick={onStartPreview} disabled={previewActive}>
                {previewActive?"Premium Preview Active":"Use Premium Preview"}<span aria-hidden="true">→</span>
              </button>
            </section>
          </div>

          <aside className="earned-pricing__disclaimer">
            <strong>Payments are not live yet</strong>
            <p>Premium Preview is included. No card is requested and no subscription is created. Secure checkout will appear only after server-verified billing is ready.</p>
          </aside>
        </div>
      </section>
    </div>
  );
}
