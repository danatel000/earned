import {useId,useState} from "react";
import {EarnedMetricBars,EarnedSignalCard,EarnedSignalText} from "./EarnedInterfaceKit.jsx";

const views=[
  {
    id:"log",
    index:"01",
    label:"LOG",
    title:"The next set is already in reach.",
    body:"Prior numbers stay visible. Weight, reps, skip, remove, and rest timing live in one focused surface.",
  },
  {
    id:"progress",
    index:"02",
    label:"PROGRESS",
    title:"See the work compound.",
    body:"Daily or weekly totals, strength records, muscle balance, and goals share one readable history.",
  },
  {
    id:"recover",
    index:"03",
    label:"RECOVER",
    title:"Train with context, not guesswork.",
    body:"Fatigue and training-quality signals organize the history you already log without pretending to replace a coach.",
  },
];

function ProductPanel({view,panelId,tabId}){
  if(view.id==="log"){
    return(
      <div className="earned-product-screen earned-product-screen--log">
        <div className="earned-product-screen__header">
          <span>CHEST + BACK</span><strong>ACTIVE / 42:18</strong>
        </div>
        <div className="earned-product-screen__exercise">
          <div><span>BENCH PRESS</span><b>SET 04 / 04</b></div>
          <div className="earned-product-screen__fields">
            <span><small>LAST</small><strong>180 x 6</strong></span>
            <span><small>WEIGHT</small><strong>185</strong></span>
            <span><small>REPS</small><strong>06</strong></span>
          </div>
          <div className="earned-product-screen__completion"><i/><span>3 SETS LOGGED</span></div>
        </div>
        <div className="earned-product-screen__commands" aria-hidden="true">
          <span>[LOG SET]</span><span>[SKIP]</span><span>[REST 01:30]</span>
        </div>
      </div>
    );
  }

  if(view.id==="progress"){
    return(
      <div className="earned-product-screen earned-product-screen--progress">
        <div className="earned-product-screen__header">
          <span>8-WEEK SIGNAL</span><strong>UPWARD</strong>
        </div>
        <div className="earned-product-screen__metric">
          <span>TRAINING VOLUME</span><b>47,720 <small>LBS</small></b>
          <em>+12.4% FROM BASELINE</em>
        </div>
        <EarnedMetricBars values={[31,44,38,55,61,57,72,76,88,84,96,100]} label="Eight week volume progression" accent="cyan"/>
        <div className="earned-product-screen__split">
          <span><small>STREAK</small><b>08 WKS</b></span>
          <span><small>QUALITY</small><b>91 / 100</b></span>
          <span><small>NEW PRS</small><b>04</b></span>
        </div>
      </div>
    );
  }

  return(
    <div className="earned-product-screen earned-product-screen--recover">
      <div className="earned-product-screen__header">
        <span>TRAINING READINESS</span><strong>CONTEXTUAL</strong>
      </div>
      <div className="earned-product-screen__readiness">
        <div><b>78</b><span>READY</span></div>
        <p>Recent volume is productive. Shoulders carry the highest local fatigue signal.</p>
      </div>
      <div className="earned-product-screen__signals">
        <span><small>LOAD TREND</small><b>STABLE</b><i style={{"--signal":"74%"}}/></span>
        <span><small>CONSISTENCY</small><b>HIGH</b><i style={{"--signal":"89%"}}/></span>
        <span><small>RECOVERY</small><b>MODERATE</b><i style={{"--signal":"63%"}}/></span>
      </div>
      <small className="earned-product-screen__note">Based on logged training only. Wearable sync is not active.</small>
    </div>
  );
}

export default function LaunchProductGallery(){
  const [active,setActive]=useState(views[0].id);
  const baseId=useId();
  const view=views.find(item=>item.id===active)||views[0];
  const tabId=`${baseId}-${view.id}-tab`;
  const panelId=`${baseId}-${view.id}-panel`;

  return(
    <section className="earned-product-gallery" aria-labelledby="product-gallery-title" data-motion-section="gallery">
      <div className="earned-product-gallery__heading" data-reveal="from-left">
        <EarnedSignalText>PRODUCT FIELD TEST / 02</EarnedSignalText>
        <h2 id="product-gallery-title">One record. Three useful views.</h2>
        <p>{view.body}</p>
      </div>

      <div className="earned-product-gallery__tabs" role="tablist" aria-label="Earned product views" data-reveal="rise">
        {views.map(item=>(
          <button
            key={item.id}
            id={`${baseId}-${item.id}-tab`}
            type="button"
            role="tab"
            aria-selected={active===item.id}
            aria-controls={`${baseId}-${item.id}-panel`}
            tabIndex={active===item.id?0:-1}
            onClick={()=>setActive(item.id)}
          >
            <span>{item.index}</span>
            <strong>{item.label}</strong>
          </button>
        ))}
      </div>

      <EarnedSignalCard
        as="div"
        tone={view.id==="recover"?"coral":view.id==="progress"?"cyan":"lime"}
        className="earned-product-gallery__stage"
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId}
        tabIndex={0}
        data-reveal="from-right"
      >
        <div className="earned-product-gallery__stage-copy">
          <span>{view.index} / {view.label}</span>
          <h3>{view.title}</h3>
        </div>
        <ProductPanel view={view} panelId={panelId} tabId={tabId}/>
      </EarnedSignalCard>
    </section>
  );
}

