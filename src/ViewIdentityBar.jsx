export const VIEW_PRESENTATION={
  total:{index:"01",eyebrow:"TRAINING COMMAND",title:"Today",description:"Your next action, live momentum, and current training signal.",accent:"lime"},
  log:{index:"02",eyebrow:"SESSION WORKSPACE",title:"Train",description:"Log the work quickly. Every completed set updates the system.",accent:"lime"},
  lifts:{index:"03",eyebrow:"PROGRESSION INTELLIGENCE",title:"Progress",description:"Compare each movement against the standard you already earned.",accent:"cyan"},
  prs:{index:"04",eyebrow:"PERSONAL RECORDS",title:"Records",description:"Your strongest performances, organized by training focus.",accent:"gold"},
  history:{index:"05",eyebrow:"TRAINING LEDGER",title:"History",description:"Every saved session, ready to review, edit, or compare.",accent:"cyan"},
  goals:{index:"06",eyebrow:"TARGET SYSTEM",title:"Goals",description:"Set the next standard and see what remains to earn it.",accent:"lime"},
  library:{index:"07",eyebrow:"MOVEMENT INDEX",title:"Library",description:"Find, understand, and load the right movement quickly.",accent:"cyan"},
  community:{index:"08",eyebrow:"TRAINING CIRCLE",title:"Feed",description:"Share the work and stay accountable to your people.",accent:"coral"},
};

export default function ViewIdentityBar({view,trackingMode,sessionCount=0,streak=0}){
  const presentation=VIEW_PRESENTATION[view]||VIEW_PRESENTATION.total;
  const mode=String(trackingMode||"weekly").toLowerCase()==="daily"?"Daily":"Weekly";
  const statusValue=view==="total"&&streak>0?`${streak} ${mode==="Daily"?"day":"week"}${streak===1?"":"s"}`:`${sessionCount} saved`;

  return(
    <section className="earned-view-identity" data-accent={presentation.accent} aria-labelledby="earned-view-title">
      <div className="earned-view-identity__index" aria-hidden="true">{presentation.index}</div>
      <div className="earned-view-identity__copy">
        <span className="earned-view-identity__eyebrow">{presentation.eyebrow}</span>
        <h1 id="earned-view-title" className="earned-view-identity__title">{presentation.title}</h1>
        <p>{presentation.description}</p>
      </div>
      <div className="earned-view-identity__meta" aria-label="Current training context">
        <div>
          <span>CADENCE</span>
          <strong>{mode}</strong>
        </div>
        <div>
          <span>{view==="total"&&streak>0?"STREAK":"LEDGER"}</span>
          <strong>{statusValue}</strong>
        </div>
        <div className="earned-view-identity__status">
          <i aria-hidden="true"/>
          <span>SYSTEM LIVE</span>
        </div>
      </div>
    </section>
  );
}
