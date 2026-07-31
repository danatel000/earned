import TrainingSignal from "./ascii/TrainingSignal.jsx";
import AsciiAvatarGrid from "./forge/AsciiAvatarGrid.jsx";
import AsciiSystemLog from "./forge/AsciiSystemLog.jsx";
import TerminalProgressBar from "./forge/TerminalProgressBar.jsx";

const entryVolume=entry=>Object.values(entry?.exercises||{}).reduce((sum,lift)=>sum+(Number(lift?.volume)||0),0);

export default function DashboardCommandCenter({
  trackingLabel,
  nextWorkoutLabel,
  hasDraft,
  streak,
  streakUnit,
  latestVolume,
  weekVolume,
  weeklyGoal,
  sessionsTracked,
  history=[],
  username="lifter",
  avatarStyle="spartan",
  onAvatarStyleChange,
  onStartWorkout,
  onOpenGoals,
}){
  const goal=Number(weeklyGoal)||0;
  const goalProgress=goal>0?Math.min(100,Math.round((Number(weekVolume||0)/goal)*100)):0;
  const historyBest=Math.max(1,...history.map(entryVolume));
  const nextSessionMilestone=Math.max(10,Math.ceil(Math.max(1,sessionsTracked)/10)*10);
  const streakScale=Math.max(7,Math.ceil(Math.max(1,streak)/7)*7);
  const avatarStats={sessions:sessionsTracked,streak,volume:weekVolume,goalProgress};

  return(
    <section className="earned-command forge-command-deck" aria-labelledby="earned-command-title"
      data-motion-section="today" data-forge-command-deck="ready">
      <div className="forge-command-deck__masthead" data-reveal="label" style={{"--reveal-delay":"20ms"}}>
        <div><span>00 / COMMAND DECK</span><strong>TODAY / {trackingLabel}</strong></div>
        <span className={hasDraft?"earned-command__state earned-command__state--live":"earned-command__state"}>
          {hasDraft?"SESSION IN PROGRESS":"READY TO TRAIN"}
        </span>
      </div>

      <TrainingSignal goalProgress={goalProgress} latestVolume={latestVolume} streak={streak}/>

      <div className="forge-command-deck__grid">
        <AsciiAvatarGrid username={username} style={avatarStyle} stats={avatarStats}
          onStyleChange={onAvatarStyleChange}/>

        <div className="earned-command__content forge-command-deck__center">
          <div className="earned-command__eyebrow" data-reveal="label" style={{"--reveal-delay":"70ms"}}>
            <span>NEXT TRAINING FOCUS</span>
          </div>
          <h2 id="earned-command-title" data-reveal="title" style={{"--reveal-delay":"110ms"}}>
            {hasDraft?"Finish what you started.":`${nextWorkoutLabel} is next.`}
          </h2>
          <p className="earned-command__copy" data-reveal="copy" style={{"--reveal-delay":"170ms"}}>
            {hasDraft
              ?"Your set entries are still here. Pick up exactly where you left off."
              :"Your previous numbers are ready. Open the logger, make the next set count, and let the progress update itself."}
          </p>
          <div className="earned-command__actions" data-reveal="actions" style={{"--reveal-delay":"220ms"}}>
            <button className="earned-command__start" type="button" onClick={onStartWorkout}>
              <span aria-hidden="true">+</span>{hasDraft?"Resume workout":"Start workout"}
            </button>
            <button className="earned-command__goal" type="button" onClick={onOpenGoals}>
              {goal>0?`${goalProgress}% of weekly goal`:"Set weekly goal"}
            </button>
          </div>
          <AsciiSystemLog history={history}/>
        </div>

        <aside className="forge-vitals" aria-label="ASCII training vitals" data-reveal="rise"
          style={{"--reveal-delay":"270ms"}}>
          <header><span>VITALS</span><strong>LIVE TRAINING POWER</strong></header>
          <div><label>WEEKLY LOAD <b>{Number(weekVolume||0).toLocaleString()} LB</b></label>
            <TerminalProgressBar current={weekVolume} total={goal||Math.max(weekVolume,1)} width={18} label="Weekly volume goal"/></div>
          <div><label>STREAK <b>{streak} {streakUnit}</b></label>
            <TerminalProgressBar current={streak} total={streakScale} width={18} label="Streak seven-block scale" accent="cyan"/></div>
          <div><label>LATEST <b>{Number(latestVolume||0).toLocaleString()} LB</b></label>
            <TerminalProgressBar current={latestVolume} total={historyBest} width={18} label="Latest volume versus all-time best" accent="coral"/></div>
          <div><label>TRACKED <b>{sessionsTracked} SESSIONS</b></label>
            <TerminalProgressBar current={sessionsTracked} total={nextSessionMilestone} width={18} label="Sessions to next ten-session milestone"/></div>
        </aside>
      </div>

      <div className="earned-command__metrics" aria-label="Current training summary">
        <div><span>STREAK</span><strong>{streak}</strong><small>{streakUnit}</small></div>
        <div><span>LATEST</span><strong>{Number(latestVolume||0).toLocaleString()}</strong><small>lbs</small></div>
        <div><span>THIS WEEK</span><strong>{Number(weekVolume||0).toLocaleString()}</strong><small>lbs</small></div>
        <div><span>TRACKED</span><strong>{sessionsTracked}</strong><small>sessions</small></div>
      </div>
      <div className="earned-command__goalbar"
        aria-label={goal>0?`${goalProgress}% of weekly volume goal`:"No weekly volume goal set"}>
        <span style={{width:`${goalProgress}%`}}/>
      </div>
    </section>
  );
}
