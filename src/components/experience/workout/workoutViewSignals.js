const clamp=(value,min=0,max=100)=>Math.min(max,Math.max(min,Number(value)||0));
const formatVolume=value=>`${Math.round(Number(value)||0).toLocaleString()} lb`;

export const WORKOUT_VIEW_SIGNALS={
  total:{
    index:"01",
    eyebrow:"TODAY SIGNAL",
    accent:"lime",
    signal:"Your next useful action is ready.",
    primary:{label:"Start training",target:"log"},
    secondary:{label:"Review goals",target:"goals"},
  },
  log:{
    index:"02",
    eyebrow:"LIVE SESSION",
    accent:"lime",
    signal:"Fast inputs. Clean sets. Nothing lost.",
    primary:{label:"Open library",target:"library"},
    secondary:{label:"View history",target:"history"},
  },
  lifts:{
    index:"03",
    eyebrow:"PROGRESS SIGNAL",
    accent:"cyan",
    signal:"Compare the work, then choose the next standard.",
    primary:{label:"View records",target:"prs"},
    secondary:{label:"Adjust goals",target:"goals"},
  },
  prs:{
    index:"04",
    eyebrow:"RECORD SIGNAL",
    accent:"gold",
    signal:"Every number here was earned under load.",
    primary:{label:"Review progress",target:"lifts"},
    secondary:{label:"Train again",target:"log"},
  },
  history:{
    index:"05",
    eyebrow:"LEDGER SIGNAL",
    accent:"cyan",
    signal:"Search the record without losing the story.",
    primary:{label:"Start training",target:"log"},
    secondary:{label:"Open progress",target:"lifts"},
  },
  goals:{
    index:"06",
    eyebrow:"TARGET SIGNAL",
    accent:"lime",
    signal:"Turn the next milestone into a visible target.",
    primary:{label:"Start training",target:"log"},
    secondary:{label:"Review progress",target:"lifts"},
  },
  library:{
    index:"07",
    eyebrow:"MOVEMENT SIGNAL",
    accent:"cyan",
    signal:"Find the movement, inspect it, then load it.",
    primary:{label:"Open trainer",target:"log"},
    secondary:{label:"Adjust goals",target:"goals"},
  },
  community:{
    index:"08",
    eyebrow:"COMMUNITY SIGNAL",
    accent:"coral",
    signal:"Accountability works best when the work is real.",
    primary:{label:"Start training",target:"log"},
    secondary:{label:"View history",target:"history"},
  },
};

export function buildWorkoutViewSignal(view,context={}){
  const config=WORKOUT_VIEW_SIGNALS[view]||WORKOUT_VIEW_SIGNALS.total;
  const cadence=String(context.trackingMode||"weekly").toLowerCase()==="daily"?"Daily":"Weekly";
  const sessions=Math.max(0,Number(context.sessionCount)||0);
  const streak=Math.max(0,Number(context.streak)||0);
  const latestVolume=Math.max(0,Number(context.latestVolume)||0);
  const weekVolume=Math.max(0,Number(context.weekVolume)||0);
  const weeklyGoal=Math.max(0,Number(context.weeklyGoal)||0);
  const recordCount=Math.max(0,Number(context.recordCount)||0);
  const goalCount=Math.max(0,Number(context.goalCount)||0);
  const exerciseCount=Math.max(0,Number(context.exerciseCount)||0);
  const unreadCount=Math.max(0,Number(context.unreadCount)||0);
  const hasDraft=!!context.draft;
  const goalProgress=weeklyGoal>0?clamp(Math.round((weekVolume/weeklyGoal)*100)):clamp(sessions*10);
  const primary=view==="total"&&hasDraft
    ?{label:"Resume workout",target:"log"}
    :config.primary;

  const viewMetrics={
    total:[
      {label:"Week load",value:formatVolume(weekVolume)},
      {label:"Streak",value:`${streak} ${cadence==="Daily"?"days":"weeks"}`},
    ],
    log:[
      {label:"Draft",value:hasDraft?"Preserved":"Ready"},
      {label:"Cadence",value:cadence},
    ],
    lifts:[
      {label:"Latest",value:formatVolume(latestVolume)},
      {label:"Sessions",value:String(sessions)},
    ],
    prs:[
      {label:"Records",value:String(recordCount)},
      {label:"Latest",value:formatVolume(latestVolume)},
    ],
    history:[
      {label:"Saved",value:String(sessions)},
      {label:"Cadence",value:cadence},
    ],
    goals:[
      {label:"Active",value:String(goalCount)},
      {label:"Week target",value:weeklyGoal?formatVolume(weeklyGoal):"Not set"},
    ],
    library:[
      {label:"Movements",value:String(exerciseCount)},
      {label:"Logged",value:String(sessions)},
    ],
    community:[
      {label:"Unread",value:String(unreadCount)},
      {label:"Shared weeks",value:String(sessions)},
    ],
  };

  const progressByView={
    total:goalProgress,
    log:hasDraft?68:12,
    lifts:clamp(sessions*12),
    prs:clamp(recordCount*8),
    history:clamp(sessions*10),
    goals:clamp(goalCount*14),
    library:clamp(exerciseCount*2),
    community:clamp(sessions*8+unreadCount*10),
  };

  const progressLabels={
    total:weeklyGoal>0?"WEEKLY GOAL":"TRAINING DEPTH",
    log:hasDraft?"DRAFT PRESERVED":"LOGGER READY",
    lifts:"LEDGER DEPTH",
    prs:"RECORD INDEX",
    history:"HISTORY DEPTH",
    goals:"TARGET COVERAGE",
    library:"MOVEMENT INDEX",
    community:"CIRCLE ACTIVITY",
  };

  return{
    ...config,
    primary,
    cadence,
    metrics:viewMetrics[view]||viewMetrics.total,
    progress:progressByView[view]??goalProgress,
    progressLabel:progressLabels[view]||progressLabels.total,
  };
}
