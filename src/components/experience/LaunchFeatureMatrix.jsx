import {
  EarnedKineticButton,
  EarnedMetricBars,
  EarnedSignalCard,
  EarnedSignalText,
} from "./EarnedInterfaceKit.jsx";

const featureCards=[
  {
    number:"01",
    label:"FAST INPUT",
    title:"Log the set while the rest clock runs.",
    body:"Previous values stay close, changes take a few taps, and intentional skips never erase the last lift you completed.",
    tone:"lime",
    className:"earned-feature-card--primary",
    visual:"logger",
  },
  {
    number:"02",
    label:"FLEXIBLE CADENCE",
    title:"Daily or weekly.",
    body:"Choose the progression rhythm that matches how you train.",
    tone:"cyan",
    visual:"cadence",
  },
  {
    number:"03",
    label:"RESILIENT RECORD",
    title:"Weak signal. Strong draft.",
    body:"Workout drafts remain available when gym Wi-Fi does not.",
    tone:"gold",
    visual:"draft",
  },
  {
    number:"04",
    label:"VISIBLE PROOF",
    title:"Effort becomes evidence.",
    body:"Volume, PRs, goals, balance, and quality scores stay connected.",
    tone:"coral",
    className:"earned-feature-card--wide",
    visual:"progress",
  },
];

function FeatureVisual({type}){
  if(type==="logger"){
    return(
      <div className="earned-feature-console" aria-label="Workout logging preview">
        <div><span>BENCH PRESS</span><b>SET 04</b></div>
        <div className="earned-feature-console__input">
          <span>WEIGHT <strong>185</strong> LB</span>
          <span>REPS <strong>06</strong></span>
        </div>
        <div className="earned-feature-console__status">
          <i aria-hidden="true"/><span>READY TO LOG</span>
        </div>
      </div>
    );
  }

  if(type==="cadence"){
    return(
      <div className="earned-feature-cadence" aria-hidden="true">
        <span className="is-active">DAY</span>
        <i/>
        <span>WEEK</span>
      </div>
    );
  }

  if(type==="draft"){
    return(
      <div className="earned-feature-draft" aria-label="Offline draft status">
        <span>LOCAL DRAFT</span>
        <strong>SAVED</strong>
        <div aria-hidden="true"><i/><i/><i/><i/></div>
      </div>
    );
  }

  return(
    <div className="earned-feature-progress">
      <div><span>WEEK 08</span><strong>+12.4%</strong></div>
      <EarnedMetricBars values={[24,38,34,52,49,68,63,84,78,96]} label="Progressing weekly training volume"/>
    </div>
  );
}

export default function LaunchFeatureMatrix(){
  return(
    <section className="earned-feature-matrix" aria-labelledby="feature-matrix-title" data-motion-section="features">
      <div className="earned-feature-matrix__heading" data-reveal="title">
        <EarnedSignalText>TRAINING SYSTEM / 01</EarnedSignalText>
        <h2 id="feature-matrix-title">Built around the moment effort becomes data.</h2>
        <p>Earned keeps the workout fast in the gym, then makes the result useful everywhere else.</p>
      </div>

      <div className="earned-feature-matrix__grid">
        {featureCards.map((feature,index)=>(
          <EarnedSignalCard
            key={feature.number}
            tone={feature.tone}
            className={`earned-feature-card ${feature.className||""}`}
            data-reveal="rise"
            style={{"--reveal-delay":`${index*55}ms`}}
          >
            <div className="earned-feature-card__topline">
              <span>{feature.number}</span>
              <b>{feature.label}</b>
            </div>
            <FeatureVisual type={feature.visual}/>
            <div className="earned-feature-card__copy">
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </div>
          </EarnedSignalCard>
        ))}
      </div>

      <EarnedKineticButton as="a" href="#account" variant="quiet">
        Build your training record
      </EarnedKineticButton>
    </section>
  );
}

