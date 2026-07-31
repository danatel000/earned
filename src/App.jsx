import { useState, useEffect, useRef, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, ReferenceLine,
} from "recharts";
import { supabase } from "./supabaseClient.js";
import PricingView from "./components/monetization/PricingView.jsx";
import PremiumGate from "./components/monetization/PremiumGate.jsx";
import UpgradePrompt from "./components/monetization/UpgradePrompt.jsx";
import InviteTrainingPartner from "./components/monetization/InviteTrainingPartner.jsx";
import RecoveryIntegrationPreview from "./components/monetization/RecoveryIntegrationPreview.jsx";
import PublicLaunch from "./components/experience/PublicLaunch.jsx";
import AppNavigation from "./components/experience/AppNavigation.jsx";
import DashboardCommandCenter from "./components/experience/DashboardCommandCenter.jsx";
import WorkoutCelebration from "./components/experience/WorkoutCelebration.jsx";
import WorkoutEcosystemRail from "./components/experience/workout/WorkoutEcosystemRail.jsx";
import {buildWorkoutViewSignal} from "./components/experience/workout/workoutViewSignals.js";
import {buildReadinessExplanation} from "./analytics/readinessExplanation.js";
import AppAsciiAtmosphere from "./components/experience/ascii/AppAsciiAtmosphere.jsx";
import WorkoutAsciiReactor from "./components/experience/ascii/WorkoutAsciiReactor.jsx";
import AsciiExerciseAnimator from "./components/experience/forge/AsciiExerciseAnimator.jsx";
import AsciiAnatomyMap from "./components/experience/forge/AsciiAnatomyMap.jsx";
import ForgeLiveConsole from "./components/experience/forge/ForgeLiveConsole.jsx";
import AsciiOneRmMeter from "./components/experience/forge/AsciiOneRmMeter.jsx";
import MotionOrchestrator from "./components/experience/motion/MotionOrchestrator.jsx";
import transitionView from "./components/experience/motion/transitionView.js";
import ViewIdentityBar from "./ViewIdentityBar.jsx";
import {
  FEATURE_IDS,
  MONETIZATION_MODES,
} from "./monetization/plans.js";
import {
  createFreeSubscription,
  createPreviewSubscription,
  resolveFeatureAccess,
} from "./monetization/entitlements.js";
import {
  TRACKING_MODES,
  PERIOD_TYPES,
  normalizeTrackingMode,
  buildTrackingHistory,
  getEntryPeriodLabel,
  getEntryShortLabel,
  calculateDailyStreak,
  combineHistoryEntries,
  getComparableHistory,
} from "./tracking/trackingPeriods.js";
import exerciseEquivalenceData from "../knowledge/coach/exercise-equivalence.json";
import {
  buildExerciseSwapQuery,
  findExerciseSwaps,
  normalizeExerciseGraph,
} from "../supabase/functions/_shared/coach/exercise-graph.ts";
import {
  buildProgressionState,
  toProgressionInput,
} from "../supabase/functions/_shared/coach/progression.ts";

const MONETIZATION_MODE = MONETIZATION_MODES.PREVIEW;
const EXERCISE_EQUIVALENCE = normalizeExerciseGraph(exerciseEquivalenceData);
const EXERCISE_EQUIVALENCE_BY_ID = new Map(
  EXERCISE_EQUIVALENCE.map(row=>[row.exerciseId,row])
);
const LOCAL_VISUAL_QA = typeof window!=="undefined"
  && ["127.0.0.1","localhost"].includes(window.location.hostname)
  && new URLSearchParams(window.location.search).get("visualQA")==="1";
const LOCAL_VISUAL_VIEW = LOCAL_VISUAL_QA
  && ["total","log","lifts","prs","history","goals","library","community"]
    .includes(new URLSearchParams(window.location.search).get("view"))
  ? new URLSearchParams(window.location.search).get("view")
  : "total";

// ─── Data ─────────────────────────────────────────────────────────────────────
const DAYS = {
  bicepsShoulders: {
    label:"Biceps & Shoulders", shortLabel:"Bis & Shldrs",
    accent:"#7C6FFF", dim:"#7C6FFF18", muscleGroup:"Arms",
    exercises:[
      {id:"bs_pullup",   name:"Assisted Chin Ups",             w:70,   r:8,  s:2},
      {id:"bs_hammer",   name:"Hammer Preacher Curl",          w:35,   r:9,  s:2},
      {id:"bs_machine",  name:"Machine Preacher Curl",         w:155,  r:7,  s:2},
      {id:"bs_shpress",  name:"Shoulder Press",                w:55,   r:5,  s:2},
      {id:"bs_seated",   name:"Seated Barbell Shoulder Press", w:45,   r:10, s:2},
      {id:"bs_latraise", name:"Lat Raise",                     w:20,   r:10, s:2},
      {id:"bs_jm",       name:"JM Press",                      w:50,   r:10, s:2},
      {id:"bs_overhead", name:"Overhead Extension",            w:42.5, r:6,  s:2},
    ],
  },
  chestBack:{
    label:"Chest & Back", shortLabel:"Chest & Back",
    accent:"#FF5C87", dim:"#FF5C8718", muscleGroup:"Upper Body",
    exercises:[
      {id:"cb_pullup",  name:"Assisted Pull Up",    w:70,    r:8,  s:2},
      {id:"cb_incline", name:"Incline Bench Press", w:159.6, r:13, s:1, note:"155×10 + 175×3"},
      {id:"cb_smith",   name:"Smith Machine Bench", w:175,   r:6,  s:2, note:"175×5 & ×7"},
      {id:"cb_row",     name:"Seated Machine Row",  w:113,   r:7,  s:2, note:"110×10, 120×4"},
      {id:"cb_pecdeck", name:"Pec Deck Chest Fly",  w:220,   r:8,  s:2, note:"220×7 & ×9"},
      {id:"cb_flat_db", name:"Flat Dumbbell Bench Press", w:50, r:8, s:2},
    ],
  },
  legs:{
    label:"Legs", shortLabel:"Legs",
    accent:"#2DD4A0", dim:"#2DD4A018", muscleGroup:"Lower Body",
    exercises:[
      {id:"lg_pullup",  name:"Assisted Pull Up",              w:70,  r:8,  s:2},
      {id:"lg_hamcurl", name:"Hamstring Curl",                w:205, r:8,  s:2},
      {id:"lg_lunge",   name:"Smith Machine Single Leg Lunge",w:245, r:10, s:2},
      {id:"lg_dead",    name:"Deadlift",                      w:205, r:10, s:2},
      {id:"lg_calf",    name:"Calf Raise",                    w:250, r:10, s:2},
      {id:"lg_squat",   name:"Deep Squat Machine",            w:235, r:10, s:2},
    ],
  },
};
const DAY_KEYS = ["bicepsShoulders","chestBack","legs"];
export const EARNED_EXERCISE_CATALOG = Object.fromEntries(
  DAY_KEYS.map(dayKey=>[dayKey,DAYS[dayKey].exercises.map(ex=>({...ex,dayKey}))])
);
const MUSCLE_GROUPS = [
  {id:"biceps", label:"Biceps", color:"#7C6FFF"},
  {id:"triceps", label:"Triceps", color:"#A78BFA"},
  {id:"shoulders", label:"Shoulders", color:"#38BFFF"},
  {id:"chest", label:"Chest", color:"#FF5C87"},
  {id:"back", label:"Back", color:"#FFB347"},
  {id:"legs", label:"Legs", color:"#2DD4A0"},
];
const EXERCISE_MUSCLES = {
  bs_pullup:"biceps",
  bs_hammer:"biceps",
  bs_machine:"biceps",
  bs_shpress:"shoulders",
  bs_seated:"shoulders",
  bs_latraise:"shoulders",
  cb_pullup:"back",
  cb_incline:"chest",
  cb_smith:"chest",
  cb_row:"back",
  cb_pecdeck:"chest",
  cb_flat_db:"chest",
  lg_pullup:"back",
  lg_hamcurl:"legs",
  lg_lunge:"legs",
  lg_dead:"legs",
  lg_calf:"legs",
  lg_squat:"legs",
};

// ─── Storage ──────────────────────────────────────────────────────────────────
// Everything that changes together (history, goals, custom exercises) now
// lives in ONE record instead of four separate ones. Fewer round-trips means
// fewer chances for any single request to fail, and it matches how this
// storage system is meant to be used for related data.
const LIFT_DATA_KEY        = "liftTrackerDataV6";
const DRAFT_KEY            = "liftTrackerDraftV1";
const ACCOUNT_USERS_KEY    = "liftTrackerAccountsV1";
const ACCOUNT_SESSION_KEY  = "liftTrackerCurrentAccountV1";
const ACCOUNT_PREFIX       = "liftTrackerAccount:";
let activeAccountName      = null;
// Older, pre-consolidation keys. Read-only: used once to recover anything
// saved before this update, then never written to again.
const LEGACY_STORAGE_KEY   = "liftTrackerV5";
const LEGACY_GOALS_KEY     = "liftTrackerGoalsV1";
const LEGACY_CUSTOM_EX_KEY = "liftTrackerCustomExV1";
const ASCII_AVATAR_STYLES  = new Set(["spartan","power","iron"]);

function normalizePreferences(raw={}){
  const asciiAvatarStyle=ASCII_AVATAR_STYLES.has(raw?.asciiAvatarStyle)?raw.asciiAvatarStyle:"spartan";
  return {
    ...(raw&&typeof raw==="object"?raw:{}),
    trackingMode:normalizeTrackingMode(raw?.trackingMode),
    asciiAvatarStyle,
  };
}

function normalizeUsername(name){
  return name.trim().toLowerCase();
}
function validateUsername(name){
  if(!name) return "Enter a username.";
  if(name.length<3) return "Username must be at least 3 characters.";
  if(name.length>24) return "Username must be 24 characters or less.";
  if(!/^[a-z0-9_-]+$/.test(name)) return "Use only letters, numbers, underscores, or dashes.";
  return "";
}
function usernameToEmail(name){
  return `${normalizeUsername(name)}@lift-tracker.local`;
}
function usernameFromUser(user){
  return user?.user_metadata?.username || user?.email?.split("@")[0] || "";
}
function readAccounts(){
  try{ return JSON.parse(localStorage.getItem(ACCOUNT_USERS_KEY)||"{}"); }
  catch{ return {}; }
}
function writeAccounts(accounts){
  localStorage.setItem(ACCOUNT_USERS_KEY,JSON.stringify(accounts));
}
async function hashPassword(password){
  const data=new TextEncoder().encode(password);
  const digest=await crypto.subtle.digest("SHA-256",data);
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
async function ensureDefaultAccount(){
  const accounts=readAccounts();
  if(!accounts.danatel){
    accounts.danatel={
      passwordHash:await hashPassword("danatel"),
      createdAt:new Date().toISOString(),
    };
    writeAccounts(accounts);
  }
}
function accountStorageKey(key,username=activeAccountName){
  return username?`${ACCOUNT_PREFIX}${username}:${key}`:key;
}
function accountPrefix(username=activeAccountName){
  return `${ACCOUNT_PREFIX}${username}:`;
}
async function migrateGlobalDataToAccount(username){
  if(username!=="danatel") return;
  for(const key of [LIFT_DATA_KEY,DRAFT_KEY,LEGACY_STORAGE_KEY,LEGACY_GOALS_KEY,LEGACY_CUSTOM_EX_KEY]){
    const scoped=accountStorageKey(key,username);
    if(localStorage.getItem(scoped)==null&&localStorage.getItem(key)!=null){
      localStorage.setItem(scoped,localStorage.getItem(key));
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const epley1RM = (w,r) => r===1 ? w : Math.round(w*(1+r/30));
const fmtVol   = v => v>=1000 ? `${(v/1000).toFixed(1)}k` : String(v);
const pct      = (a,b) => (!b ? null : (((a-b)/b)*100).toFixed(1));
const fmtTime  = seconds => {
  const safe=Math.max(0,Math.floor(seconds||0));
  const m=Math.floor(safe/60);
  const s=safe%60;
  return `${m}:${String(s).padStart(2,"0")}`;
};
const SET_QUALITY_OPTIONS=[
  {id:"easy",label:"Easy",color:"#38BFFF"},
  {id:"good",label:"Good",color:"#2DD4A0"},
  {id:"hard",label:"Hard",color:"#FFB347"},
  {id:"failed",label:"Failed",color:"#FF5C87"},
];
const roundToNearest=(value,step=5)=>Math.round((Number(value)||0)/step)*step;
function buildPlateLoad(weight,barWeight=45){
  const target=Number(weight)||0;
  const bar=Number(barWeight)||45;
  const plates=[45,35,25,10,5,2.5];
  if(target<bar) return {
    target,bar,loadable:false,perSide:0,plates:[],remainder:0,
    summary:"Below 45 lb bar",
  };
  let perSide=Math.max(0,(target-bar)/2);
  const result=[];
  for(const plate of plates){
    const count=Math.floor((perSide+0.0001)/plate);
    if(count>0){
      result.push({plate,count});
      perSide-=count*plate;
    }
  }
  const remainder=Math.round(perSide*10)/10;
  const summary=result.length
    ? result.map(item=>`${item.count}x${item.plate}`).join(" + ")
    :"Empty bar";
  return {
    target,bar,loadable:remainder<=0.25,perSide:Math.max(0,(target-bar)/2),
    plates:result,remainder,summary,
  };
}
function buildWarmupPlan(weight,reps=5,equipment="barbell"){
  const target=Number(weight)||0;
  if(target<=0) return [];
  const isBarbell=equipment==="barbell";
  const minWeight=isBarbell?45:5;
  const step=isBarbell?5:2.5;
  const stages=[
    {pct:0.4,reps:Math.min(10,Math.max(5,Number(reps)||5)),label:"Easy ramp"},
    {pct:0.55,reps:5,label:"Groove reps"},
    {pct:0.7,reps:3,label:"Build speed"},
    {pct:0.85,reps:1,label:"Primer"},
  ];
  const rows=[];
  for(const stage of stages){
    let warmWeight=roundToNearest(target*stage.pct,step);
    warmWeight=Math.max(minWeight,Math.min(warmWeight,target));
    if(rows.some(row=>row.weight===warmWeight)) continue;
    if(warmWeight>=target&&rows.length>0) continue;
    rows.push({...stage,weight:warmWeight});
  }
  if(!rows.length&&target>0) rows.push({pct:1,reps:Math.max(3,Math.min(8,Number(reps)||5)),label:"Technique set",weight:target});
  return rows.slice(0,4);
}
const getLiftSetRows=cell=>{
  if(Array.isArray(cell?.setDetails)) return cell.setDetails;
  const w=cell?.w??"0",r=cell?.r??"0",s=parseInt(cell?.s);
  const count=!isNaN(s)&&s>0?s:1;
  return Array.from({length:count},()=>({w:String(w),r:String(r)}));
};
const getLoggedSetRows=cell=>getLiftSetRows(cell)
  .map(row=>({w:parseFloat(row?.w),r:parseInt(row?.r),quality:row?.quality||"good"}))
  .filter(row=>!isNaN(row.w)&&!isNaN(row.r)&&row.w>0&&row.r>0);
const parseLiftCell=cell=>{
  const rows=getLoggedSetRows(cell);
  if(rows.length){
    const best=rows.reduce((top,row)=>epley1RM(row.w,row.r)>epley1RM(top.w,top.r)?row:top,rows[0]);
    return {
      w:best.w,
      r:best.r,
      s:rows.length,
      volume:Math.round(rows.reduce((sum,row)=>sum+(row.w*row.r),0)),
      setDetails:rows,
    };
  }
  const w=parseFloat(cell?.w),r=parseInt(cell?.r),s=parseInt(cell?.s);
  const volume=[w,r,s].every(v=>!isNaN(v)&&v>0)?Math.round(w*r*s):0;
  return {w,r,s,volume,setDetails:[]};
};
const isSkippedLiftCell=cell=>cell?.skipped===true;
const isLoggedLiftCell=cell=>{
  if(isSkippedLiftCell(cell)) return false;
  return parseLiftCell(cell).volume>0;
};
const storedLiftFromCell=cell=>{
  const parsed=parseLiftCell(cell);
  return {
    volume:parsed.volume,
    w:parsed.w,
    r:parsed.r,
    s:parsed.s,
    setDetails:parsed.setDetails,
  };
};

function editableLiftCellFromStored(lift={}){
  const sourceRows=Array.isArray(lift?.setDetails)&&lift.setDetails.length
    ?lift.setDetails
    :getLiftSetRows({...lift,setDetails:undefined});
  const rows=sourceRows.map(row=>({...row,w:String(row?.w??"0"),r:String(row?.r??"0")}));
  return {
    w:String(lift?.w??"0"),
    r:String(lift?.r??"0"),
    s:String(lift?.s??(rows.length||1)),
    setDetails:rows,
  };
}

function allExercises(dk, customEx, removedEx){
  const removedIds = new Set([...(removedEx?.[dk] || []), ...((customEx?._removed?.[dk]) || [])]);
  const base = DAYS[dk].exercises.filter(e => !removedIds.has(e.id));
  const custom = (customEx?.[dk] || []).filter(e=>!e.removed);
  return [...base, ...custom];
}
function removedExercises(dk,customEx={}){
  const removedIds=new Set(customEx?._removed?.[dk]||[]);
  const base=DAYS[dk].exercises.filter(e=>removedIds.has(e.id)).map(e=>({...e,isRemovedBase:true}));
  const custom=(customEx?.[dk]||[]).filter(e=>e.removed);
  return [...base,...custom];
}
function exerciseCatalogForDay(dk,customEx={}){
  return [...DAYS[dk].exercises,...(customEx?.[dk]||[])];
}
function workoutTemplates(customEx={}){
  return Array.isArray(customEx?._templates)?customEx._templates:[];
}
function socialState(customEx={}){
  return customEx?._social || {likes:{}};
}
function exerciseNotes(customEx={}){
  return customEx?._exerciseNotes&&typeof customEx._exerciseNotes==="object"
    ? customEx._exerciseNotes
    : {};
}
function exerciseNoteFor(exId,customEx={}){
  const raw=exerciseNotes(customEx)[exId];
  if(!raw) return {note:"",updatedAt:null};
  if(typeof raw==="string") return {note:raw,updatedAt:null};
  return {
    note:String(raw.note||"").slice(0,240),
    updatedAt:raw.updatedAt||null,
  };
}
function bodyMetrics(customEx={}){
  return Array.isArray(customEx?._bodyMetrics)
    ? customEx._bodyMetrics
      .map(item=>({
        id:item.id||`body_${item.date||Date.now()}`,
        date:item.date||new Date().toISOString().slice(0,10),
        weight:Number(item.weight)||0,
      }))
      .filter(item=>item.weight>0)
      .sort((a,b)=>String(a.date).localeCompare(String(b.date)))
    : [];
}

function buildBaseline(customEx={}) {
  const ex={};
  for(const dk of DAY_KEYS)
    for(const e of allExercises(dk, customEx))
      ex[e.id]={volume:Math.round(e.w*e.r*e.s),w:e.w,r:e.r,s:e.s};
  return {week:1,exercises:ex,date:new Date().toISOString().slice(0,10)};
}
function buildVisualQaHistory(){
  const baseline=buildBaseline();
  const today=new Date();
  return Array.from({length:6},(_,index)=>{
    const date=new Date(today);
    date.setDate(today.getDate()-((5-index)*7));
    const exercises={};
    for(const [id,entry] of Object.entries(baseline.exercises)){
      const w=Math.round((entry.w*(1+(index*0.018)))*2)/2;
      const r=entry.r+(index%2);
      const s=entry.s;
      exercises[id]={...entry,w,r,s,volume:Math.round(w*r*s)};
    }
    return{
      week:index+1,
      date:date.toISOString().slice(0,10),
      exercises,
      rating:index===5?5:4,
      rpe:index===5?8:7,
      duration:62+(index*3),
      note:index===5?"Strong finish. Bar speed stayed consistent.":"",
    };
  });
}
function buildVisualQaGoals(history){
  const latest=history[history.length-1];
  const goals={weeklyVolume:Math.round(getTotalVol(latest)*1.08)};
  for(const [id,entry] of Object.entries(latest?.exercises||{})) goals[id]=Math.round(entry.volume*1.12);
  return goals;
}
function getDayVol(entry,dk,customEx={}){
  if(!entry?.exercises) return 0;
  return exerciseCatalogForDay(dk,customEx).reduce((s,ex)=>s+(entry.exercises[ex.id]?.volume||0),0);
}
function getTotalVol(entry,customEx={}){ return DAY_KEYS.reduce((s,dk)=>s+getDayVol(entry,dk,customEx),0); }

function inferMuscleGroup(ex,dayKey){
  const reviewed=EXERCISE_EQUIVALENCE_BY_ID.get(ex.id);
  if(reviewed){
    const primary=reviewed.primaryMuscles[0];
    if(["biceps","triceps","shoulders","chest","back"].includes(primary)) return primary;
    return "legs";
  }
  if(EXERCISE_MUSCLES[ex.id]) return EXERCISE_MUSCLES[ex.id];
  const name=ex.name.toLowerCase();
  if(/curl|chin|bicep|preacher|tricep|jm|extension|pushdown|skull/.test(name)) return "biceps";
  if(/shoulder|press|raise|delt|overhead/.test(name)) return "shoulders";
  if(/bench|chest|pec|fly|incline/.test(name)) return "chest";
  if(/pull|row|lat|back/.test(name)) return "back";
  if(/leg|squat|dead|lunge|calf|ham|quad|glute/.test(name)) return "legs";
  if(dayKey==="chestBack") return "chest";
  if(dayKey==="legs") return "legs";
  return "shoulders";
}

function getExerciseGuide(ex,dayKey){
  const group=inferMuscleGroup(ex,dayKey);
  const guide={
    biceps:{
      setup:"Keep the upper arm controlled and start with a full stretch.",
      cues:["Brace your torso","Curl without swinging","Squeeze hard at the top"],
      mistakes:["Using momentum","Letting elbows drift forward","Cutting the lower stretch"],
    },
    shoulders:{
      setup:"Set your ribs down, brace, and keep the shoulder moving smoothly.",
      cues:["Control the lowering phase","Keep wrists stacked","Stop before pain or pinching"],
      mistakes:["Shrugging every rep","Arching the lower back","Rushing partial reps"],
    },
    chest:{
      setup:"Plant your feet, set your shoulder blades, and keep the chest lifted.",
      cues:["Lower with control","Drive evenly through both arms","Keep tension through the full rep"],
      mistakes:["Bouncing the weight","Letting shoulders roll forward","Uneven lockout"],
    },
    back:{
      setup:"Brace first, then pull through the elbows instead of just the hands.",
      cues:["Lead with elbows","Pause the squeeze","Control the stretch"],
      mistakes:["Yanking with the arms","Rounding hard under load","Skipping the full range"],
    },
    legs:{
      setup:"Set your stance, brace your core, and keep pressure through the foot.",
      cues:["Control depth","Drive through the floor","Keep knees tracking cleanly"],
      mistakes:["Collapsing knees inward","Losing brace","Rushing heavy reps"],
    },
  };
  return {group,...guide[group]};
}

const LIBRARY_EQUIPMENT=[
  {id:"all",label:"All"},
  {id:"barbell",label:"Barbell"},
  {id:"dumbbell",label:"Dumbbell"},
  {id:"machine",label:"Machine"},
  {id:"cable",label:"Cable"},
  {id:"bodyweight",label:"Bodyweight"},
];

const LIBRARY_DIFFICULTY=[
  {id:"all",label:"All"},
  {id:"beginner",label:"Beginner"},
  {id:"intermediate",label:"Intermediate"},
  {id:"advanced",label:"Advanced"},
];

function getExerciseProfile(ex,dayKey){
  const guide=getExerciseGuide(ex,dayKey);
  const muscle=MUSCLE_GROUPS.find(group=>group.id===guide.group);
  const name=ex.name.toLowerCase();
  const reviewed=EXERCISE_EQUIVALENCE_BY_ID.get(ex.id);
  let equipment=reviewed?.equipment[0]||"machine";
  if(!reviewed){
    if(/pull\s?up|chin|dip|push\s?up|bodyweight/.test(name)) equipment="bodyweight";
    else if(/dumbbell|db|hammer/.test(name)) equipment="dumbbell";
    else if(/cable|lat|pushdown|pulldown/.test(name)) equipment="cable";
    else if(/bench|squat|dead|barbell|jm press|press/.test(name)) equipment="barbell";
  }

  let difficulty=reviewed?.skillLevel||"beginner";
  if(!reviewed){
    if(/dead|squat|jm press|overhead|pull\s?up|chin|bench|row/.test(name)) difficulty="intermediate";
    if(/heavy|clean|snatch|single|max/.test(name)) difficulty="advanced";
  }

  const repRange=guide.group==="shoulders"?"10-15 reps"
    : guide.group==="legs"?"6-12 reps"
      : guide.group==="chest"||guide.group==="back"?"6-10 reps"
        :"8-12 reps";
  const bestUse=guide.group==="legs"?"Build lower-body strength and weekly volume."
    : guide.group==="chest"?"Build pressing strength with controlled tension."
      : guide.group==="back"?"Build pulling strength and upper-back thickness."
        : guide.group==="shoulders"?"Build delt size, control, and shoulder stability."
          :"Build arm size and clean elbow-flexion strength.";
  const tempo=guide.group==="shoulders"||guide.group==="biceps"
    ?"2 seconds down, brief squeeze, no swing."
    :"Control the lowering phase and drive up with intent.";

  return {
    ...guide,
    primaryMuscles:reviewed?[...reviewed.primaryMuscles]:[guide.group],
    target:reviewed
      ?reviewed.primaryMuscles[0].replace(/(^|_)([a-z])/g,(_match,_prefix,letter)=>` ${letter.toUpperCase()}`).trim()
      :muscle?.label||"Exercise",
    color:muscle?.color||"#7C6FFF",
    equipment,
    equipmentLabel:LIBRARY_EQUIPMENT.find(item=>item.id===equipment)?.label||"Machine",
    difficulty,
    difficultyLabel:LIBRARY_DIFFICULTY.find(item=>item.id===difficulty)?.label||"Beginner",
    repRange,
    bestUse,
    tempo,
  };
}

export function getEarnedExerciseProfile(ex,dayKey){
  return getExerciseProfile(ex,dayKey);
}

function buildTechniqueCoach(ex,profile,dayKey){
  const name=ex?.name||"Exercise";
  const target=profile?.target||"Target muscle";
  const equipment=profile?.equipmentLabel||"Equipment";
  const group=profile?.group||"general";
  const setupBase=profile?.setup||"Set your position, brace, and move with control.";
  const equipmentCue=profile?.equipment==="barbell"
    ?"Center the bar, set even hand pressure, and brace before unracking."
    : profile?.equipment==="dumbbell"
      ?"Match both sides, keep the path even, and avoid drifting reps."
      : profile?.equipment==="cable"
        ?"Line the cable with the target muscle and keep constant tension."
        : profile?.equipment==="bodyweight"
          ?"Lock in body position before each rep and control the full range."
          :"Adjust the machine so the joint path matches the target muscle.";
  const groupCue=group==="legs"
    ?"Keep pressure through the full foot and drive smoothly through the floor."
    : group==="chest"
      ?"Keep shoulder blades set and press without bouncing."
      : group==="back"
        ?"Start the pull from the back, then finish with the arms."
        : group==="shoulders"
          ?"Keep ribs down and move without shrugging into the neck."
          :"Keep elbows quiet and squeeze without swinging.";
  const setupChecklist=[
    `${equipment}: set the station before loading heavy.`,
    setupBase,
    equipmentCue,
  ];
  const repExecution=[
    "Brace first, then start the rep.",
    ...(profile?.cues||[]).slice(0,3),
    groupCue,
    `Finish each rep when ${target.toLowerCase()} is doing the work, not momentum.`,
  ];
  const safetyChecks=[
    ...(profile?.mistakes||[]).slice(0,3).map(item=>`Avoid ${item.toLowerCase()}.`),
    "Reduce load if form changes before the target reps are done.",
    "Swap exercises if joint discomfort changes your normal path.",
  ];
  const progressionTip=profile?.difficulty==="advanced"
    ?"Progress slowly: add reps first, then small weight jumps once every set stays clean."
    : profile?.difficulty==="intermediate"
      ?"Progress when all working sets stay controlled at the top of the rep range."
      :"Progress by mastering the same tempo and range before adding weight.";
  return {
    techniqueCoach:true,
    title:`${name} Technique Coach`,
    dayLabel:dayKey&&DAYS[dayKey]?DAYS[dayKey].label:"Workout",
    setupChecklist,
    repExecution,
    safetyChecks,
    progressionTip,
  };
}

function buildLibraryWorkoutDraft(dayKey,ex,currentDraft=null){
  if(!dayKey||!ex) return currentDraft;
  const draft=currentDraft||{};
  const profile=getExerciseProfile(ex,dayKey);
  return {
    ...draft,
    activeDay:dayKey,
    completedDays:draft.completedDays||{},
    notes:draft.notes||"",
    rating:draft.rating||0,
    rpe:draft.rpe||0,
    deload:!!draft.deload,
    restPreset:draft.restPreset||90,
    libraryFocus:{
      dayKey,
      exerciseId:ex.id,
      exerciseName:ex.name,
      muscle:profile.target,
      equipment:profile.equipmentLabel,
      difficulty:profile.difficultyLabel,
      repRange:profile.repRange,
      bestUse:profile.bestUse,
    },
  };
}

function buildExerciseSubstitutions(ex,dayKey,customEx={},history=[],persistedCoachContext=null){
  if(!ex||!dayKey) return [];
  const coach=coachState(customEx);
  const fallbackExclusions=coach.excludedExerciseIds.map(targetKey=>({
    target_type:"exercise",target_key:targetKey,selector:{},
  }));
  const query=buildExerciseSwapQuery({
    sourceExerciseId:ex.id,
    graph:EXERCISE_EQUIVALENCE,
    memberContext:persistedCoachContext?.memberContext,
    settings:persistedCoachContext?.settings,
    exclusions:persistedCoachContext?.exclusions||fallbackExclusions,
    fallbackProfile:coach.profile,
  });
  const swaps=findExerciseSwaps(query);
  return swaps.slice(0,4).flatMap(swap=>{
    let match=null;
    let matchDay=null;
    for(const dk of DAY_KEYS){
      const candidate=allExercises(dk,customEx).find(row=>row.id===swap.exerciseId);
      if(candidate){match=candidate;matchDay=dk;break;}
    }
    if(!match||!matchDay) return [];
    const profile=getExerciseProfile(match,matchDay);
    const lastHit=getLastLiftForExercise(history,match.id);
    const lift=lastHit?.lift;
    return [{
      ex:match,
      dayKey:matchDay,
      profile,
      reason:swap.reason,
      score:swap.score,
      suggested:{
        w:Number(lift?.w??match.w??ex.w??0),
        r:Number(lift?.r??match.r??ex.r??0),
        s:Number(lift?.s??match.s??ex.s??1),
      },
      source:lastHit?getEntryPeriodLabel(lastHit.entry,lastHit.index):"Catalog default",
      substitutionCoach:true,
    }];
  });
}

export function buildEarnedExerciseSubstitutions(
  ex,
  dayKey,
  customEx={},
  history=[],
  persistedCoachContext=null,
){
  return buildExerciseSubstitutions(ex,dayKey,customEx,history,persistedCoachContext);
}

function getMuscleVolumes(entry,customEx={}){
  const totals=Object.fromEntries(MUSCLE_GROUPS.map(g=>[g.id,0]));
  if(!entry?.exercises) return totals;
  for(const dk of DAY_KEYS){
    for(const ex of exerciseCatalogForDay(dk,customEx)){
      const group=inferMuscleGroup(ex,dk);
      totals[group]+=(entry.exercises[ex.id]?.volume||0);
    }
  }
  return totals;
}

function getMuscleGoalVolumes(entry,goals={},customEx={}){
  const totals=Object.fromEntries(MUSCLE_GROUPS.map(g=>[g.id,0]));
  if(!entry?.exercises) return totals;
  for(const dk of DAY_KEYS){
    for(const ex of allExercises(dk,customEx)){
      const current=entry.exercises[ex.id]?.volume||0;
      const target=goals?.[ex.id]||current;
      totals[inferMuscleGroup(ex,dk)]+=target;
    }
  }
  return totals;
}

function calcStreak(history,customEx={}){
  if(history.some(entry=>entry?.periodType===PERIOD_TYPES.DAY)) return calculateDailyStreak(history);
  if(history.length<=1) return history.length;
  let streak=1;
  for(let i=history.length-1;i>0;i--){
    if(history[i]?.deload||getTotalVol(history[i],customEx)>=getTotalVol(history[i-1],customEx)) streak++;
    else break;
  }
  return streak;
}

function linearRegression(ys){
  const n=ys.length;
  if(n<2) return null;
  const xs=[...Array(n)].map((_,i)=>i+1);
  const mx=xs.reduce((a,b)=>a+b,0)/n;
  const my=ys.reduce((a,b)=>a+b,0)/n;
  const num=xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0);
  const den=xs.reduce((s,x)=>s+(x-mx)**2,0);
  if(den===0) return null;
  const slope=num/den, intercept=my-slope*mx;
  return {slope, intercept, predict:(x)=>Math.round(slope*x+intercept)};
}

function buildInsights(history,customEx={}){
  const insights=[];
  if(history.length<2) return insights;
  const latest=history[history.length-1];
  const comparableHistory=getComparableHistory(history,latest);
  if(comparableHistory.length<2) return insights;
  const prev=comparableHistory[comparableHistory.length-2];
  const periodNoun=latest?.periodType===PERIOD_TYPES.DAY?"session":"week";
  const win=comparableHistory.slice(-5);
  const first=win[0];

  let bestGrowthEx=null,bestGrowthPct=-Infinity;
  for(const dk of DAY_KEYS){
    for(const ex of allExercises(dk,customEx)){
      const v0=first.exercises[ex.id]?.volume;
      const v1=latest.exercises[ex.id]?.volume;
      if(!v0||!v1) continue;
      const g=((v1-v0)/v0)*100;
      if(g>bestGrowthPct){bestGrowthPct=g;bestGrowthEx=ex;}
    }
  }
  if(bestGrowthEx&&bestGrowthPct>0)
    insights.push({icon:"🚀",color:"#2DD4A0",
      text:`${bestGrowthEx.name} is your fastest-growing lift — up ${bestGrowthPct.toFixed(0)}% over the last ${win.length-1} ${periodNoun}${win.length>2?"s":""}.`});

  let bestDayVol=-Infinity,bestDk=null;
  for(const dk of DAY_KEYS){const v=getDayVol(latest,dk,customEx);if(v>bestDayVol){bestDayVol=v;bestDk=dk;}}
  if(bestDk){
    const d=bestDayVol-getDayVol(prev,bestDk,customEx);
    insights.push({icon:"💥",color:"#7C6FFF",
      text:`${DAYS[bestDk].label} led this ${periodNoun} at ${bestDayVol.toLocaleString()} lbs${d>0?` — ${d.toLocaleString()} more than the last ${periodNoun}`:""}.`});
  }

  for(const dk of DAY_KEYS){
    for(const ex of allExercises(dk,customEx)){
      const cur=latest.exercises[ex.id]?.volume??0;
      const prevMax=Math.max(...history.slice(0,-1).map(e=>e.exercises[ex.id]?.volume??0));
      if(cur>prevMax&&prevMax>0){
        insights.push({icon:"🏆",color:"#FFB347",
          text:`New volume PR on ${ex.name}: ${cur.toLocaleString()} lbs (prev. ${prevMax.toLocaleString()}).`});
        break;
      }
    }
    if(insights.length>=3) break;
  }

  const tot=getTotalVol(latest,customEx),prevTot=getTotalVol(prev,customEx);
  if(latest.deload&&tot<prevTot)
    insights.push({icon:"🛡️",color:"#38BFFF",
      text:`Recovery ${periodNoun} logged: volume was ${Math.abs(pct(tot,prevTot))}% lower, so the drop is treated as intentional load management.`});
  else if(tot<prevTot*0.95)
    insights.push({icon:"⚠️",color:"#FF5C87",
      text:`Volume dipped ${Math.abs(pct(tot,prevTot))}% this ${periodNoun}. If this was intentional, mark it as a recovery ${periodNoun}.`});

  return insights.slice(0,3);
}

function getLiftHistory(history,exId){
  return history.map(entry=>entry.exercises?.[exId]).filter(Boolean);
}

function buildNextWorkoutSuggestions(history,customEx={}){
  if(history.length<1) return [];
  const suggestions=[];
  const latest=history[history.length-1];

  for(const dk of DAY_KEYS){
    for(const ex of allExercises(dk,customEx)){
      const current=latest.exercises?.[ex.id];
      if(!current) continue;
      const past=getLiftHistory(history.slice(0,-1),ex.id);
      const prevLift=getLastLiftForExercise(history.slice(0,-1),ex.id)?.lift;
      const setRows=getLoggedSetRows(current);
      const hitConsistentSets=setRows.length>=2&&setRows.every(row=>row.r>=setRows[0].r);
      const currentRM=epley1RM(current.w,current.r);
      const bestPastRM=past.length?Math.max(...past.map(lift=>epley1RM(lift.w,lift.r))):0;
      const volumeChange=prevLift?pct(current.volume,prevLift.volume):null;
      const isLargeDrop=prevLift&&current.volume<prevLift.volume*0.9;
      const isNewStrength=bestPastRM>0&&currentRM>bestPastRM;
      const increment=/bench|press|row|curl|raise|delt|preacher/i.test(ex.name)?5:10;

      if(isLargeDrop){
        suggestions.push({
          ex,dk,priority:3,color:"#FFB347",
          action:"Repeat next time",
          detail:`Volume fell ${Math.abs(volumeChange)}%. Keep ${current.w} lbs and rebuild clean reps before increasing.`,
        });
      }else if(isNewStrength||hitConsistentSets){
        suggestions.push({
          ex,dk,priority:2,color:"#2DD4A0",
          action:`Try ${current.w+increment} lbs`,
          detail:`You handled ${current.w} lbs for ${current.s} set${current.s!==1?"s":""}. If warmups feel good, move up ${increment} lbs.`,
        });
      }else if(prevLift&&current.w===prevLift.w&&current.r<=prevLift.r){
        suggestions.push({
          ex,dk,priority:1,color:"#38BFFF",
          action:"Add reps first",
          detail:`Stay at ${current.w} lbs and aim for ${current.r+1} reps on your strongest set before adding weight.`,
        });
      }
    }
  }

  return suggestions
    .sort((a,b)=>b.priority-a.priority)
    .slice(0,5);
}

function getDominantDay(entry,customEx={}){
  if(!entry) return null;
  const rows=DAY_KEYS.map(dk=>({dk,volume:getDayVol(entry,dk,customEx)}))
    .sort((a,b)=>b.volume-a.volume);
  return rows[0]?.volume>0?rows[0].dk:null;
}

function getLastLiftForExercise(history,exId){
  for(let i=history.length-1;i>=0;i--){
    const lift=history[i]?.exercises?.[exId];
    if(lift?.volume>0) return {lift,index:i,entry:history[i]};
  }
  return null;
}

function liftInputFromLastLogged(history,ex){
  const last=getLastLiftForExercise(history,ex.id)?.lift;
  if(!last) return {w:"0",r:"0",s:"1",setDetails:[{w:"0",r:"0"}]};
  const rows=getLiftSetRows(last).map(row=>({w:String(row.w),r:String(row.r)}));
  const safeRows=rows.length?rows:[{w:String(last.w||"0"),r:String(last.r||"0")}];
  return {
    w:String(last.w||"0"),
    r:String(last.r||"0"),
    s:String(last.s||safeRows.length||1),
    setDetails:safeRows,
  };
}

function getExerciseSetSuggestion(history,ex){
  const lastHit=getLastLiftForExercise(history,ex.id);
  if(!lastHit?.lift){
    return {
      label:"No previous log",
      detail:`Start around ${ex.w} lbs for ${ex.r} reps.`,
      rows:[{w:String(ex.w||0),r:String(ex.r||0)}],
    };
  }
  const rows=getLoggedSetRows(lastHit.lift);
  const fallbackRows=Array.from({length:lastHit.lift.s||1},()=>({
    w:String(lastHit.lift.w||0),
    r:String(lastHit.lift.r||0),
  }));
  const setRows=(rows.length?rows:fallbackRows).map(row=>({w:String(row.w),r:String(row.r)}));
  return {
    label:getEntryPeriodLabel(lastHit.entry,lastHit.index,{dayLabels:Object.fromEntries(DAY_KEYS.map(key=>[key,DAYS[key].shortLabel]))}),
    detail:`Last: ${lastHit.lift.w} lbs x ${lastHit.lift.r} reps x ${lastHit.lift.s} sets`,
    rows:setRows,
  };
}

function buildActiveExerciseHistory(history,exerciseId){
  return history.map((entry,index)=>{
    const lift=entry.exercises?.[exerciseId];
    if(!lift?.volume) return null;
    const parsed=parseLiftCell(lift);
    const sets=getLoggedSetRows(lift);
    const candidates=sets.length?sets:[{w:lift.w||0,r:lift.r||0}];
    const bestSet=candidates.reduce((best,row)=>
      epley1RM(row.w,row.r)>epley1RM(best.w,best.r)?row:best,candidates[0]);
    return {
      weekLabel:getEntryPeriodLabel(entry,index,{dayLabels:Object.fromEntries(DAY_KEYS.map(key=>[key,DAYS[key].shortLabel]))}),
      date:entry.date||"Saved workout",
      bestSetText:`${bestSet.w} lbs x ${bestSet.r}`,
      setCount:parsed.s||sets.length||1,
      volume:parsed.volume||lift.volume||0,
    };
  }).filter(Boolean).slice(-3).reverse();
}

function buildPerLiftProgressLab(ex,history){
  const chartData=history.map((entry,i)=>{
    const lift=entry.exercises?.[ex.id];
    return {
      week:getEntryShortLabel(entry,i),
      Volume:lift?.volume??null,
      "Est. 1RM":lift?epley1RM(lift.w,lift.r):null,
      Weight:lift?.w??null,
    };
  });
  const loggedRows=history.map((entry,index)=>{
    const lift=entry.exercises?.[ex.id];
    if(!lift?.volume) return null;
    const sets=getLoggedSetRows(lift);
    const bestSet=(sets.length?sets:[{w:lift.w||0,r:lift.r||0}])
      .reduce((best,row)=>epley1RM(row.w,row.r)>epley1RM(best.w,best.r)?row:best,{w:0,r:0});
    const estimatedOneRM=epley1RM(lift.w||0,lift.r||0);
    const bestSetOneRM=epley1RM(bestSet.w||0,bestSet.r||0);
    return {
      week:getEntryShortLabel(entry,index),
      weekNumber:index+1,
      date:entry.date||getEntryPeriodLabel(entry,index),
      lift,
      volume:lift.volume,
      weight:lift.w||0,
      reps:lift.r||0,
      sets:lift.s||sets.length||1,
      estimatedOneRM,
      bestSet,
      bestSetOneRM,
      bestSetText:`${bestSet.w||0} lbs x ${bestSet.r||0}`,
    };
  }).filter(Boolean);
  const latest=loggedRows[loggedRows.length-1]||null;
  const previous=loggedRows[loggedRows.length-2]||null;
  const recentLiftRows=loggedRows.slice(-4).reverse();
  const recentSource=loggedRows.slice(-4);
  const recentAverageVolume=recentSource.length
    ? Math.round(recentSource.reduce((sum,row)=>sum+row.volume,0)/recentSource.length)
    : 0;
  const bestByStrength=loggedRows.reduce((best,row)=>!best||row.bestSetOneRM>best.bestSetOneRM?row:best,null);
  const bestByVolume=loggedRows.reduce((best,row)=>!best||row.volume>best.volume?row:best,null);
  const volumeTrend=latest&&previous?latest.volume-previous.volume:0;
  const volumeTrendPct=latest&&previous&&previous.volume
    ? Math.round((volumeTrend/previous.volume)*100)
    : 0;
  const consistency=loggedRows.length;
  const nextCue=!latest
    ?`Start with ${ex.w||0} lbs for ${ex.r||0} reps and log a clean baseline.`
    : consistency<3
      ?"Log this lift a few more times to unlock a stronger trend signal."
      : volumeTrend>0
        ?"Progress is moving up. Add small weight only if reps stayed clean."
        : volumeTrend<0
          ?"Volume dipped recently. Repeat the last solid setup before pushing load."
          :"Stable trend. Try adding one rep or one small set next time.";
  return {
    chartData,
    loggedRows,
    recentLiftRows,
    latest,
    previous,
    latestEstimatedOneRM:latest?.estimatedOneRM||0,
    bestSet:bestByStrength?.bestSetText||"No logged set",
    bestSetOneRM:bestByStrength?.bestSetOneRM||0,
    bestVolume:bestByVolume?.volume||0,
    recentAverageVolume,
    volumeTrend,
    volumeTrendPct,
    consistency,
    nextCue,
  };
}

function buildAdaptiveWorkoutPlan(history,customEx={}){
  if(!history.length) return null;
  const latest=history[history.length-1];
  const lastDay=getDominantDay(latest,customEx);
  const nextCycleDay=lastDay
    ? DAY_KEYS[(DAY_KEYS.indexOf(lastDay)+1)%DAY_KEYS.length]
    : "bicepsShoulders";
  const quality=getTrainingQuality(history,history.length-1,customEx);
  const fatigueRows=getFatigueTrend(history,customEx);
  const fatigue=fatigueRows[fatigueRows.length-1]?.Fatigue||0;
  const latestMuscles=getMuscleVolumes(latest,customEx);
  const prior=history.slice(Math.max(0,history.length-5),history.length-1);
  const musclePressure=MUSCLE_GROUPS.map(group=>{
    const current=latestMuscles[group.id]||0;
    const avg=prior.length
      ? prior.reduce((sum,entry)=>sum+(getMuscleVolumes(entry,customEx)[group.id]||0),0)/prior.length
      : 0;
    const ratio=avg?current/avg:(current>0?1:0);
    return {...group,current,avg,ratio,need:avg?clamp(1-ratio,0,1):current>0?0:0.75};
  }).sort((a,b)=>b.need-a.need);
  const weakMuscles=musclePressure.filter(group=>group.need>0.22).slice(0,2);
  const dayScores=DAY_KEYS.map(dk=>{
    const groups=new Set(allExercises(dk,customEx).map(ex=>inferMuscleGroup(ex,dk)));
    const weakScore=weakMuscles.reduce((sum,group)=>sum+(groups.has(group.id)?group.need*34:0),0);
    const cycleScore=dk===nextCycleDay?32:0;
    const avoidRepeat=dk===lastDay?18:0;
    const fatiguePenalty=fatigue>=72&&dk===lastDay?18:0;
    const total=Math.round(42+cycleScore+weakScore-avoidRepeat-fatiguePenalty);
    return {dk,total:clamp(total,0,100),groups};
  }).sort((a,b)=>b.total-a.total);
  const chosen=dayScores[0]?.dk||nextCycleDay;
  const mode=fatigue>=72
    ?"Recovery-biased"
    : quality?.score<62
      ?"Technique rebuild"
      : weakMuscles.some(group=>dayScores[0]?.groups.has(group.id))
        ?"Weak-point focus"
        :"Progressive overload";
  const intensity=fatigue>=72
    ?"Repeat loads or reduce 5-10%"
    : quality?.score<62
      ?"Clean reps before load jumps"
      :"Push top sets if warmups move well";
  const reasons=[
    lastDay?`Last trained: ${DAYS[lastDay].shortLabel}`:"No dominant last day",
    `Cycle says: ${DAYS[nextCycleDay].shortLabel}`,
    fatigue>=72?`Fatigue high at ${fatigue}`:`Fatigue ${fatigue}`,
    weakMuscles.length?`Needs: ${weakMuscles.map(g=>g.label).join(", ")}`:"Balance is stable",
  ];

  const prescriptions=allExercises(chosen,customEx).slice(0,6).map(ex=>{
    const latestHit=getLastLiftForExercise(history,ex.id);
    const lift=latestHit?.lift;
    const past=latestHit?getLiftHistory(history.slice(0,latestHit.index),ex.id):[];
    const prevLift=past[past.length-1];
    const base={w:ex.w,r:ex.r,s:ex.s,volume:Math.round(ex.w*ex.r*ex.s)};
    const current=lift||base;
    const rows=getLoggedSetRows(current);
    const consistent=rows.length>=2&&rows.every(row=>row.r>=rows[0].r);
    const rm=epley1RM(current.w,current.r);
    const bestPastRM=past.length?Math.max(...past.map(item=>epley1RM(item.w,item.r))):0;
    const increment=/bench|press|row|curl|raise|delt|preacher/i.test(ex.name)?5:10;
    let action="Repeat baseline";
    let target=`${current.w||ex.w} lbs x ${current.r||ex.r}`;
    let detail=`Aim for ${current.s||ex.s} controlled set${(current.s||ex.s)!==1?"s":""}.`;
    let color="#38BFFF";

    if(fatigue>=72){
      action="Recovery sets";
      target=`${current.w||ex.w} lbs, clean reps`;
      detail="Keep reps smooth and stop before grindy sets.";
      color="#FFB347";
    }else if(prevLift&&current.volume<prevLift.volume*0.9){
      action="Rebuild";
      target=`${current.w} lbs x ${current.r}`;
      detail="Volume recently dipped. Match this before adding load.";
      color="#FFB347";
    }else if((bestPastRM>0&&rm>bestPastRM)||consistent){
      action="Overload";
      target=`${(current.w||ex.w)+increment} lbs`;
      detail=`Try +${increment} lbs if warmups feel strong.`;
      color="#2DD4A0";
    }else if(prevLift&&current.w===prevLift.w&&current.r<=prevLift.r){
      action="Add reps";
      target=`${current.w} lbs x ${(current.r||ex.r)+1}`;
      detail="Beat reps first, then move the weight up.";
      color="#7C6FFF";
    }
    return {ex,action,target,detail,color};
  });

  return {
    dayKey:chosen,
    score:dayScores[0]?.total||0,
    mode,
    intensity,
    quality,
    fatigue,
    reasons,
    weakMuscles,
    prescriptions,
  };
}

function addDays(date,days){
  const next=new Date(date);
  next.setDate(next.getDate()+days);
  return next;
}

function buildScheduleWorkoutPlan(dayKey,score,mode,intensity,reason,customEx={}){
  const day=DAYS[dayKey];
  return {
    dayKey,
    score,
    mode,
    intensity,
    reasons:[reason,`Focus: ${day.label}`],
    prescriptions:allExercises(dayKey,customEx).slice(0,5).map(ex=>({
      ex,
      action:"Scheduled",
      target:`${ex.w} lbs x ${ex.r}`,
      detail:`Use your latest logged numbers as the starting point for ${ex.name}.`,
      color:day.accent,
    })),
  };
}

function buildWorkoutSchedule(history,customEx={}){
  const latest=history[history.length-1]||null;
  const latestDate=latest?.date||new Date().toISOString().slice(0,10);
  const anchor=new Date(`${latestDate}T12:00:00`);
  const lastDay=getDominantDay(latest,customEx);
  let nextDay=lastDay?DAY_KEYS[(DAY_KEYS.indexOf(lastDay)+1)%DAY_KEYS.length]:"bicepsShoulders";
  const fatigueRows=history.length?getFatigueTrend(history,customEx):[];
  const fatigue=fatigueRows[fatigueRows.length-1]?.Fatigue||0;
  const quality=history.length?getTrainingQuality(history,history.length-1,customEx):null;
  const needsEarlyRecovery=fatigue>=72;
  const needsMidWeekRecovery=fatigue>=55||latest?.deload;
  const scheduledWorkouts=[];
  let trainCount=0,recoveryDays=0;

  for(let offset=1;offset<=7;offset++){
    const date=addDays(anchor,offset);
    const dateLabel=date.toLocaleDateString([],{weekday:"short",month:"short",day:"numeric"});
    const isRecovery=(offset===1&&needsEarlyRecovery)||(offset===4&&needsMidWeekRecovery);
    if(isRecovery){
      recoveryDays++;
      scheduledWorkouts.push({
        id:`recovery_${offset}`,
        type:"recovery",
        date:date.toISOString().slice(0,10),
        dateLabel,
        title:"Recovery Day",
        focus:"Mobility, walking, light pump work",
        reason:offset===1
          ?`Fatigue is high at ${fatigue}, so the next day is lighter.`
          :"Mid-week recovery keeps the next hard sessions cleaner.",
        color:"#38BFFF",
      });
      continue;
    }

    const dayKey=nextDay;
    const day=DAYS[dayKey];
    const groups=[...new Set(allExercises(dayKey,customEx).map(ex=>inferMuscleGroup(ex,dayKey)))]
      .map(id=>MUSCLE_GROUPS.find(group=>group.id===id)?.label||id);
    const score=Math.round(Math.max(52,Math.min(96,84-(fatigue>=65?10:0)+(quality?.score>=82?6:0))));
    const intensity=fatigue>=65?"Controlled loads and clean reps":"Progressive overload if warmups feel good";
    const reason=trainCount===0
      ? lastDay?`Next in cycle after ${DAYS[lastDay]?.shortLabel}.`:"Start with your first split day."
      :"Rotates your split to keep muscle groups moving.";
    scheduledWorkouts.push({
      id:`workout_${offset}_${dayKey}`,
      type:"workout",
      dayKey,
      date:date.toISOString().slice(0,10),
      dateLabel,
      title:day.label,
      focus:groups.join(" + "),
      reason,
      intensity,
      score,
      color:day.accent,
      plan:buildScheduleWorkoutPlan(dayKey,score,"Scheduled workout",intensity,reason,customEx),
    });
    trainCount++;
    nextDay=DAY_KEYS[(DAY_KEYS.indexOf(nextDay)+1)%DAY_KEYS.length];
  }

  const nextScheduledWorkout=scheduledWorkouts.find(item=>item.type==="workout")||null;
  const summary=history.length
    ?`${trainCount} scheduled workouts, ${recoveryDays} recovery day${recoveryDays===1?"":"s"}, fatigue ${fatigue}.`
    :"A starter rotation is ready once you log your first workout.";
  return {scheduledWorkouts,nextScheduledWorkout,recoveryDays,summary,fatigue,quality};
}

function buildTrainingMomentumCoach(history,customEx={}){
  if(!history.length) return null;
  const dayMs=24*60*60*1000;
  const today=new Date();
  today.setHours(12,0,0,0);
  const dated=history.map((entry,index)=>{
    const raw=entry.date||new Date().toISOString().slice(0,10);
    const date=new Date(`${raw}T12:00:00`);
    return Number.isNaN(date.getTime())?null:{entry,index,date};
  }).filter(Boolean).sort((a,b)=>a.date-b.date);
  const latest=dated[dated.length-1]||{entry:history[history.length-1],index:history.length-1,date:today};
  const daysSinceLastLift=Math.max(0,Math.floor((today-latest.date)/dayMs));
  const workoutsLast14=dated.filter(row=>(today-row.date)/dayMs<=14).length;
  const workoutsLast30=dated.filter(row=>(today-row.date)/dayMs<=30).length;
  const gaps=dated.slice(1).map((row,index)=>
    Math.max(0,Math.round((row.date-dated[index].date)/dayMs)));
  const averageGap=gaps.length
    ? Number((gaps.reduce((sum,gap)=>sum+gap,0)/gaps.length).toFixed(1))
    : null;
  const isDailyHistory=latest.entry?.periodType===PERIOD_TYPES.DAY;
  const streak=isDailyHistory
    ? calculateDailyStreak(history)
    : calcStreak(history,customEx);
  const streakUnit=isDailyHistory?"day":"week";
  const schedule=buildWorkoutSchedule(history,customEx);
  const nextWorkout=schedule.nextScheduledWorkout;
  const score=Math.round(clamp(
    74+
    Math.min(20,workoutsLast14*5)+
    Math.min(10,streak*2)-
    Math.min(42,daysSinceLastLift*7)-
    (averageGap&&averageGap>4?Math.min(16,(averageGap-4)*3):0),
    0,
    100
  ));
  const status=daysSinceLastLift<=1
    ?"Ready today"
    : score>=82
      ?"Strong rhythm"
      : daysSinceLastLift<=3
        ?"On schedule"
        : daysSinceLastLift<=7
          ?"Comeback window"
          :"Restart gently";
  const color=score>=82?"#2DD4A0":score>=65?"#38BFFF":score>=45?"#FFB347":"#FF5C87";
  const comebackPlan=daysSinceLastLift>=7
    ?"Restart with controlled sets, keep one or two reps in reserve, and let the first session rebuild rhythm."
    : daysSinceLastLift>=4
      ?"Use the next workout as a clean comeback session. Match recent loads before chasing PRs."
      : daysSinceLastLift>=2
        ?"You are due soon. Start the next planned lift and keep warmups honest."
        :"Momentum is fresh. If warmups move well, follow the planned progression.";
  const streakProtection=streak>=4
    ?`Protect your ${streak}-${streakUnit} streak by keeping the next session simple and logged.`
    : streak>=2
      ?`You have ${streak} ${streakUnit}${streak===1?"":"s"} of momentum. A short logged workout keeps it alive.`
      :"Build the habit first. One honest logged session is enough to start momentum.";
  return {
    trainingMomentumCoach:true,
    daysSinceLastLift,
    workoutsLast14,
    workoutsLast30,
    averageGap,
    score,
    status,
    color,
    comebackPlan,
    streakProtection,
    nextWorkout,
  };
}

function getExerciseOverloadDecision(history,ex,dayKey){
  if(!history.length) return null;
  const latestHit=getLastLiftForExercise(history,ex.id);
  const latestEntry=latestHit?.entry;
  const latest=latestHit?.lift;
  if(!latest?.volume) return null;
  const previousHit=getLastLiftForExercise(history.slice(0,latestHit.index),ex.id);
  const previous=previousHit?.lift;
  const volumePct=previous?.volume?pct(latest.volume,previous.volume):null;
  const state=buildProgressionState(toProgressionInput({
    history,exercise:ex,dayKey,graph:EXERCISE_EQUIVALENCE,readiness:null,
  }));
  const presentation={
    add_weight:{action:"Add Weight",color:"#2DD4A0",priority:5},
    add_rep:{action:"Add Reps",color:"#7C6FFF",priority:3},
    add_set:{action:"Add Set",color:"#38BFFF",priority:3},
    reduce:{action:"Deload",color:"#FFB347",priority:5},
    hold:{action:"Repeat",color:"#38BFFF",priority:2},
  }[state.decision];
  const targetReps=Array.isArray(state.targetReps)?state.targetReps.join("/"):state.targetReps;
  const nextTarget=`${state.targetWeight} lbs x ${targetReps} reps`;
  const why=state.decision==="add_weight"
    ?"Two supported exposures reached the top of the rep range at manageable effort."
    :state.decision==="add_rep"
      ?"Load is stable inside the rep range, so add one controlled rep."
      :state.decision==="reduce"
        ?"Two consecutive exposures missed the rep-range minimum, so reduce load conservatively."
        :state.evidenceState==="partially_supported"
          ?"Only one valid exposure exists, so repeat it before adding load."
          :"Readiness, effort, or set quality does not support an increase.";

  return {
    ex,
    dayKey,
    action:presentation.action,
    nextTarget,
    why,
    color:presentation.color,
    priority:presentation.priority,
    latestVolume:latest.volume,
    previousVolume:previous?.volume||0,
    volumePct,
  };
}

function buildProgressiveOverloadAdvice(history,customEx={}){
  if(!history.length) return [];
  const overloadAdvice=[];
  for(const dk of DAY_KEYS){
    for(const ex of allExercises(dk,customEx)){
      const row=getExerciseOverloadDecision(history,ex,dk);
      if(row) overloadAdvice.push(row);
    }
  }
  return overloadAdvice
    .sort((a,b)=>b.priority-a.priority||b.latestVolume-a.latestVolume)
    .slice(0,8);
}

function buildAdaptivePlanDraft(plan,currentDraft=null){
  if(!plan) return currentDraft;
  const draft=currentDraft||{};
  return {
    ...draft,
    activeDay:plan.dayKey,
    completedDays:draft.completedDays||{},
    notes:draft.notes||"",
    rating:draft.rating||0,
    rpe:draft.rpe||0,
    deload:!!draft.deload,
    restPreset:draft.restPreset||90,
    adaptivePlan:{
      dayKey:plan.dayKey,
      score:plan.score,
      mode:plan.mode,
      intensity:plan.intensity,
      reasons:plan.reasons||[],
      prescriptions:(plan.prescriptions||[]).slice(0,4).map(item=>({
        id:item.ex.id,
        name:item.ex.name,
        action:item.action,
        target:item.target,
        detail:item.detail,
        color:item.color,
      })),
    },
  };
}

const COACH_GOALS=[
  {id:"strength",label:"Strength",detail:"Lower reps, heavier top sets."},
  {id:"muscle",label:"Muscle Growth",detail:"More volume and controlled reps."},
  {id:"balanced",label:"Balanced",detail:"Strength, size, and recovery together."},
  {id:"fat_loss",label:"Fat Loss",detail:"Efficient sessions with steady volume."},
];
const COACH_EXPERIENCE=[
  {id:"beginner",label:"Beginner"},
  {id:"intermediate",label:"Intermediate"},
  {id:"advanced",label:"Advanced"},
];
const COACH_SPLITS=[
  {id:"current_rotation",label:"Current Rotation"},
  {id:"push_pull_legs",label:"Push Pull Legs"},
  {id:"upper_lower",label:"Upper Lower"},
  {id:"full_body",label:"Full Body"},
];
const COACH_INTENSITIES=[
  {id:"conservative",label:"Conservative"},
  {id:"moderate",label:"Moderate"},
  {id:"aggressive",label:"Aggressive"},
];
const COACH_EQUIPMENT=[
  {id:"dumbbells",label:"Dumbbells"},
  {id:"barbell",label:"Barbell"},
  {id:"machines",label:"Machines"},
  {id:"cables",label:"Cables"},
  {id:"bodyweight",label:"Bodyweight"},
];

function defaultCoachProfile(){
  return {
    goal:"balanced",
    experience:"intermediate",
    daysPerWeek:3,
    sessionLength:60,
    equipment:{dumbbells:true,barbell:true,machines:true,cables:true,bodyweight:true},
    limitations:[],
    splitPreference:"current_rotation",
    intensityPreference:"moderate",
    weakMuscleBias:true,
    updatedAt:new Date().toISOString(),
  };
}

function normalizeCoachProfile(profile={}){
  const base=defaultCoachProfile();
  const allowed=(rows,value,fallback)=>rows.some(row=>row.id===value)?value:fallback;
  const days=[3,4,5,6].includes(Number(profile.daysPerWeek))?Number(profile.daysPerWeek):base.daysPerWeek;
  const minutes=[30,45,60,75].includes(Number(profile.sessionLength))?Number(profile.sessionLength):base.sessionLength;
  const equipment={...base.equipment,...(profile.equipment||{})};
  const limitations=Array.isArray(profile.limitations)
    ?[...new Set(profile.limitations.filter(item=>typeof item==="string").map(item=>item.trim().toLowerCase()).filter(Boolean))]
    :[];
  return {
    ...base,
    ...profile,
    goal:allowed(COACH_GOALS,profile.goal,base.goal),
    experience:allowed(COACH_EXPERIENCE,profile.experience,base.experience),
    daysPerWeek:days,
    sessionLength:minutes,
    equipment:Object.fromEntries(COACH_EQUIPMENT.map(item=>[item.id,!!equipment[item.id]])),
    limitations,
    splitPreference:allowed(COACH_SPLITS,profile.splitPreference,base.splitPreference),
    intensityPreference:allowed(COACH_INTENSITIES,profile.intensityPreference,base.intensityPreference),
    weakMuscleBias:profile.weakMuscleBias!==false,
    updatedAt:profile.updatedAt||base.updatedAt,
  };
}

function coachState(customEx={}){
  const raw=customEx?._coach&&typeof customEx._coach==="object"?customEx._coach:{};
  const directExclusions=Array.isArray(raw.excludedExerciseIds)?raw.excludedExerciseIds:[];
  const savedExclusions=Array.isArray(raw.exclusions)
    ?raw.exclusions.filter(row=>row?.target_type==="exercise").map(row=>row.target_key)
    :[];
  return {
    profile:normalizeCoachProfile(raw.profile||{}),
    plan:raw.plan&&Array.isArray(raw.plan.days)?raw.plan:null,
    excludedExerciseIds:[...new Set([...directExclusions,...savedExclusions]
      .filter(item=>typeof item==="string").map(item=>item.trim()).filter(Boolean))],
  };
}

function withCoachState(customEx={},nextCoach){
  const current=coachState(customEx);
  return {
    ...customEx,
    _coach:{
      profile:normalizeCoachProfile(nextCoach?.profile||{}),
      plan:nextCoach?.plan||null,
      excludedExerciseIds:Array.isArray(nextCoach?.excludedExerciseIds)
        ?nextCoach.excludedExerciseIds
        :current.excludedExerciseIds,
    },
  };
}

function exerciseMatchesCoachEquipment(ex,equipment){
  const name=ex.name.toLowerCase();
  if(!equipment.barbell&&/barbell|smith|deadlift|squat machine/.test(name)) return false;
  if(!equipment.dumbbells&&/dumbbell|db /.test(name)) return false;
  if(!equipment.machines&&/machine|pec deck|hamstring curl|calf raise|seated/.test(name)) return false;
  if(!equipment.cables&&/cable|pushdown/.test(name)) return false;
  if(!equipment.bodyweight&&/pull up|chin up|bodyweight/.test(name)) return false;
  return true;
}

function coachWeakMuscles(history,customEx={}){
  const latest=history[history.length-1]||null;
  if(!latest) return MUSCLE_GROUPS.slice(0,2);
  const latestVolumes=getMuscleVolumes(latest,customEx);
  const recent=history.slice(Math.max(0,history.length-4),history.length);
  return MUSCLE_GROUPS.map(group=>{
    const avg=recent.length
      ? recent.reduce((sum,entry)=>sum+(getMuscleVolumes(entry,customEx)[group.id]||0),0)/recent.length
      : 0;
    const current=latestVolumes[group.id]||0;
    return {...group,score:avg?current/avg:current>0?1:0};
  }).sort((a,b)=>a.score-b.score).slice(0,2);
}

function coachSplitDayKeys(profile,index){
  if(profile.splitPreference==="upper_lower"){
    return index%2===0?["bicepsShoulders","chestBack"]:["legs"];
  }
  if(profile.splitPreference==="push_pull_legs"){
    return [["chestBack","bicepsShoulders"],["chestBack","bicepsShoulders"],["legs"]][index%3];
  }
  if(profile.splitPreference==="full_body") return DAY_KEYS;
  return [DAY_KEYS[index%DAY_KEYS.length]];
}

function coachExercisePool(dayKeys,profile,customEx,weakMuscles){
  const weakIds=new Set((weakMuscles||[]).map(group=>group.id));
  const rows=[];
  for(const dk of dayKeys){
    for(const ex of allExercises(dk,customEx)){
      const muscle=inferMuscleGroup(ex,dk);
      if(!exerciseMatchesCoachEquipment(ex,profile.equipment)) continue;
      rows.push({ex,dayKey:dk,muscle,priority:weakIds.has(muscle)?2:1});
    }
  }
  const fallback=dayKeys.flatMap(dk=>allExercises(dk,customEx).map(ex=>({
    ex,dayKey:dk,muscle:inferMuscleGroup(ex,dk),priority:1,fallback:true,
  })));
  return rows.length>=3?rows:fallback;
}

function coachRepTarget(profile,fatigue){
  if(fatigue>=72) return profile.goal==="strength"?"4-6 clean reps":"8-10 clean reps";
  if(profile.goal==="strength") return profile.intensityPreference==="aggressive"?"3-5 reps":"4-6 reps";
  if(profile.goal==="muscle") return "8-12 reps";
  if(profile.goal==="fat_loss") return "10-15 reps";
  return "6-10 reps";
}

function coachSetTarget(profile,fatigue){
  const base=profile.sessionLength<=30?2:profile.sessionLength>=75?4:3;
  if(fatigue>=72) return Math.max(2,base-1);
  if(profile.intensityPreference==="aggressive") return Math.min(5,base+1);
  if(profile.intensityPreference==="conservative") return Math.max(2,base-1);
  return base;
}

function coachWeightHint(ex,history,profile,fatigue){
  const latest=getLastLiftForExercise(history,ex.id)?.lift;
  if(!latest) return `Start around ${ex.w} lbs and leave 2 reps in reserve.`;
  const increment=/bench|press|row|curl|raise|delt|preacher/i.test(ex.name)?5:10;
  if(fatigue>=72||profile.intensityPreference==="conservative")
    return `Repeat ${latest.w} lbs and keep every rep smooth.`;
  if(profile.intensityPreference==="aggressive")
    return `Try ${latest.w+increment} lbs if warmups move fast.`;
  return `Use ${latest.w} lbs and add reps before load.`;
}

function buildSmartProgram(history,customEx={},goals={},profileInput={}){
  const profile=normalizeCoachProfile(profileInput);
  const fatigueRows=getFatigueTrend(history,customEx);
  const fatigue=fatigueRows[fatigueRows.length-1]?.Fatigue||0;
  const quality=getTrainingQuality(history,Math.max(0,history.length-1),customEx);
  const weakMuscles=profile.weakMuscleBias?coachWeakMuscles(history,customEx):[];
  const days=Array.from({length:profile.daysPerWeek},(_,index)=>{
    const dayKeys=coachSplitDayKeys(profile,index);
    const pool=coachExercisePool(dayKeys,profile,customEx,weakMuscles)
      .sort((a,b)=>b.priority-a.priority||a.ex.name.localeCompare(b.ex.name));
    const maxExercises=profile.sessionLength<=30?4:profile.sessionLength>=75?7:5;
    const selected=pool.slice(0,maxExercises);
    const primaryDay=selected[0]?.dayKey||dayKeys[0]||"bicepsShoulders";
    const focus=[...new Set(selected.map(item=>MUSCLE_GROUPS.find(group=>group.id===item.muscle)?.label||item.muscle))]
      .slice(0,3).join(" + ");
    return {
      id:`coach_day_${index+1}`,
      label:`Day ${index+1}`,
      dayKey:primaryDay,
      focus:focus||DAYS[primaryDay].label,
      reason:[
        `${COACH_SPLITS.find(item=>item.id===profile.splitPreference)?.label||"Smart split"} structure`,
        fatigue>=72?"recovery-biased fatigue control":"progression-ready fatigue",
        weakMuscles.length?`weak-muscle bias: ${weakMuscles.map(group=>group.label).join(", ")}`:"balanced muscle coverage",
      ].join(" - "),
      exercises:selected.map(item=>({
        id:item.ex.id,
        name:item.ex.name,
        muscle:item.muscle,
        sets:coachSetTarget(profile,fatigue),
        reps:coachRepTarget(profile,fatigue),
        weightHint:coachWeightHint(item.ex,history,profile,fatigue),
        progressionHint:goals?.[item.ex.id]
          ?`Chase your ${Number(goals[item.ex.id]).toLocaleString()} lb volume goal with clean sets.`
          : item.fallback
            ?"Equipment filter was tight, so this is the closest matching exercise."
            :"Add reps first, then increase load when all sets are clean.",
      })),
    };
  });
  const goalLabel=COACH_GOALS.find(item=>item.id===profile.goal)?.label||"Balanced";
  return {
    id:`coach_${Date.now()}`,
    createdAt:new Date().toISOString(),
    summary:`${goalLabel} plan - ${profile.daysPerWeek} days/week - ${profile.sessionLength} minute sessions`,
    reason:`Built from ${history.length||0} logged week${history.length===1?"":"s"}, fatigue ${fatigue}, quality ${quality?.score||0}, and your equipment choices.`,
    profile,
    weakMuscles:weakMuscles.map(group=>({id:group.id,label:group.label,color:group.color})),
    days,
  };
}

function pickProgramExercise(dayKey,customEx={},patterns=[],fallbackIndex=0){
  const pool=allExercises(dayKey,customEx);
  if(!pool.length) return null;
  for(const pattern of patterns){
    const regex=new RegExp(pattern,"i");
    const match=pool.find(ex=>regex.test(ex.name));
    if(match) return match;
  }
  return pool[Math.min(pool.length-1,Math.max(0,fallbackIndex%pool.length))];
}

function buildProgramPackExercise(dayKey,customEx,patterns,fallbackIndex,sets,reps,cue){
  const ex=pickProgramExercise(dayKey,customEx,patterns,fallbackIndex);
  if(!ex) return null;
  const profile=getExerciseProfile(ex,dayKey);
  return {
    id:ex.id,
    name:ex.name,
    muscle:profile.group,
    sets,
    reps,
    weightHint:`Use your last logged ${ex.name} load or start near ${ex.w} lbs.`,
    progressionHint:cue,
  };
}

function buildProgramPacks(customEx={}){
  const makeDay=(packId,packTitle,label,dayKey,focus,reason,rows)=>({
    id:`${packId}_${dayKey}_${label.toLowerCase().replace(/\s+/g,"_")}`,
    label,
    dayKey,
    focus,
    reason,
    programPack:true,
    packTitle,
    exercises:rows.filter(Boolean),
  });
  const strengthTitle="Strength Foundation";
  const hypertrophyTitle="Hypertrophy Builder";
  const athleticTitle="Balanced Athletic";
  return [
    {
      id:"strength_foundation",
      title:strengthTitle,
      goal:"Build reliable strength on the biggest repeatable lifts.",
      length:"3 days/week",
      style:"Heavy basics, longer rests, clean reps",
      color:"#FFB347",
      note:"Best for lifters who want simple progression and clear focus days.",
      days:[
        makeDay("strength_foundation",strengthTitle,"Day 1","chestBack","Press + Pull Strength","Alternate a heavy press with a heavy row or pull.",
          [
            buildProgramPackExercise("chestBack",customEx,["bench"],0,4,"Add 5 lbs when all sets hit the top reps cleanly."),
            buildProgramPackExercise("chestBack",customEx,["row"],1,4,"Add reps before adding load."),
            buildProgramPackExercise("chestBack",customEx,["incline"],2,3,"Keep one rep in reserve."),
            buildProgramPackExercise("chestBack",customEx,["pull|pulldown"],3,3,"Control the stretch on every rep."),
          ]),
        makeDay("strength_foundation",strengthTitle,"Day 2","legs","Lower Strength","Build legs with braced compounds and controlled accessories.",
          [
            buildProgramPackExercise("legs",customEx,["squat|press"],0,4,"Increase load only when depth and brace stay consistent."),
            buildProgramPackExercise("legs",customEx,["hamstring|curl"],1,3,"Pause the squeeze before adding weight."),
            buildProgramPackExercise("legs",customEx,["extension"],2,3,"Add reps first, then load."),
            buildProgramPackExercise("legs",customEx,["calf"],3,4,"Use full range before increasing weight."),
          ]),
        makeDay("strength_foundation",strengthTitle,"Day 3","bicepsShoulders","Shoulder + Arm Strength","Press first, then finish with controlled arm work.",
          [
            buildProgramPackExercise("bicepsShoulders",customEx,["shoulder press|press"],0,4,"Add load when the last rep stays smooth."),
            buildProgramPackExercise("bicepsShoulders",customEx,["chin|pull"],1,4,"Progress by adding reps or reducing assistance."),
            buildProgramPackExercise("bicepsShoulders",customEx,["preacher|curl"],2,3,"Keep elbows pinned before adding weight."),
            buildProgramPackExercise("bicepsShoulders",customEx,["jm press|overhead|extension"],3,3,"Keep elbows comfortable and controlled."),
          ]),
      ],
    },
    {
      id:"hypertrophy_builder",
      title:hypertrophyTitle,
      goal:"Grow muscle with more weekly sets and tighter pump work.",
      length:"3 days/week",
      style:"Moderate reps, short rests, high tension",
      color:"#7C6FFF",
      note:"Best for size, muscle balance, and repeatable volume progression.",
      days:[
        makeDay("hypertrophy_builder",hypertrophyTitle,"Push Pull Pump","chestBack","Chest + Back Volume","Use smooth sets and chase total quality volume.",
          [
            buildProgramPackExercise("chestBack",customEx,["incline"],0,3,"Add reps until all sets reach the top of the range."),
            buildProgramPackExercise("chestBack",customEx,["bench"],1,3,"Use controlled tempo instead of bouncing."),
            buildProgramPackExercise("chestBack",customEx,["row"],2,4,"Pause the squeeze on every rep."),
            buildProgramPackExercise("chestBack",customEx,["pull|pulldown"],3,3,"Keep tension through the full stretch."),
          ]),
        makeDay("hypertrophy_builder",hypertrophyTitle,"Delt Arm Pump","bicepsShoulders","Delts + Arms Volume","Stack shoulder isolation with arm finishers.",
          [
            buildProgramPackExercise("bicepsShoulders",customEx,["lateral|lat raise"],0,4,"Add reps before adding load."),
            buildProgramPackExercise("bicepsShoulders",customEx,["rear"],1,3,"Keep the motion strict and controlled."),
            buildProgramPackExercise("bicepsShoulders",customEx,["hammer|preacher|curl"],2,4,"Squeeze hard without swinging."),
            buildProgramPackExercise("bicepsShoulders",customEx,["jm press|overhead|extension"],3,3,"Use a pain-free elbow path."),
          ]),
        makeDay("hypertrophy_builder",hypertrophyTitle,"Leg Volume","legs","Leg Volume","Drive leg volume without rushing heavy sets.",
          [
            buildProgramPackExercise("legs",customEx,["press|squat"],0,4,"Control depth on every rep."),
            buildProgramPackExercise("legs",customEx,["extension"],1,4,"Hold the top briefly before lowering."),
            buildProgramPackExercise("legs",customEx,["hamstring|curl"],2,4,"Control the lowering phase."),
            buildProgramPackExercise("legs",customEx,["calf"],3,5,"Use a full stretch and full squeeze."),
          ]),
      ],
    },
    {
      id:"balanced_athletic",
      title:athleticTitle,
      goal:"Train every major area while keeping fatigue manageable.",
      length:"3 days/week",
      style:"Balanced work, recovery-aware progression",
      color:"#2DD4A0",
      note:"Best for friends and family who want a clean full-body rhythm.",
      days:[
        makeDay("balanced_athletic",athleticTitle,"Upper Base","chestBack","Upper Base","Pair one press, one pull, and one shoulder pattern.",
          [
            buildProgramPackExercise("chestBack",customEx,["bench|incline"],0,3,"Repeat load until all reps are clean."),
            buildProgramPackExercise("chestBack",customEx,["row|pull"],1,3,"Keep the back doing the work."),
            buildProgramPackExercise("bicepsShoulders",customEx,["shoulder press|press"],0,3,"Stop before form turns into a shrug."),
          ]),
        makeDay("balanced_athletic",athleticTitle,"Lower Base","legs","Lower Base","Train legs hard while leaving room to recover.",
          [
            buildProgramPackExercise("legs",customEx,["squat|press"],0,3,"Add load only when every rep is braced."),
            buildProgramPackExercise("legs",customEx,["hamstring|curl"],1,3,"Control the full range."),
            buildProgramPackExercise("legs",customEx,["calf"],2,3,"Pause at the top and bottom."),
          ]),
        makeDay("balanced_athletic",athleticTitle,"Arms + Finish","bicepsShoulders","Arms + Delts","Build shoulders and arms with lower joint stress.",
          [
            buildProgramPackExercise("bicepsShoulders",customEx,["lateral|lat raise"],0,3,"Stay strict and add reps first."),
            buildProgramPackExercise("bicepsShoulders",customEx,["preacher|curl|hammer"],1,3,"Keep elbows locked in place."),
            buildProgramPackExercise("bicepsShoulders",customEx,["chin|pull"],2,3,"Use smooth reps and stop before swinging."),
          ]),
      ],
    },
  ];
}

function buildCoachPlanDraft(planDay,currentDraft=null){
  if(!planDay) return currentDraft;
  const draft=currentDraft||{};
  return {
    ...draft,
    activeDay:planDay.dayKey,
    completedDays:draft.completedDays||{},
    notes:draft.notes||"",
    rating:draft.rating||0,
    rpe:draft.rpe||0,
    deload:!!draft.deload,
    restPreset:draft.restPreset||90,
    coachPlan:{
      id:planDay.id,
      label:planDay.label,
      dayKey:planDay.dayKey,
      focus:planDay.focus,
      reason:planDay.reason,
      programPack:!!planDay.programPack,
      packTitle:planDay.packTitle,
      exercises:(planDay.exercises||[]).slice(0,6),
    },
  };
}

function defaultReadiness(){
  return {sleep:3,energy:3,soreness:3};
}

function normalizeReadiness(readiness=defaultReadiness()){
  const source=readiness&&typeof readiness==="object"?readiness:defaultReadiness();
  const clampFive=value=>Math.max(1,Math.min(5,Math.round(Number(value)||3)));
  return {
    sleep:clampFive(source.sleep),
    energy:clampFive(source.energy),
    soreness:clampFive(source.soreness),
  };
}

function getReadinessScore(readiness){
  if(!readiness||typeof readiness!=="object") return null;
  const clean=normalizeReadiness(readiness);
  const raw=((clean.sleep+clean.energy+(6-clean.soreness))/15)*100;
  return Math.max(0,Math.min(100,Math.round(raw)));
}

function getReadinessLabel(score){
  if(score===null||score===undefined) return "Not logged";
  return score>=82?"Ready to push"
    :score>=68?"Good to train"
      :score>=52?"Controlled day"
        :score>=36?"Recovery-biased"
          :"Deload signal";
}

function buildWorkoutReadinessGate(readinessScore,readiness,previewVol=0,prevDayVol=0,activeLoggedCount=0){
  const clean=normalizeReadiness(readiness);
  const score=readinessScore??getReadinessScore(clean)??60;
  const volumeDeltaPct=prevDayVol>0?Math.round(((previewVol-prevDayVol)/prevDayVol)*100):null;
  const highSoreness=clean.soreness>=4;
  const lowEnergy=clean.energy<=2;
  const lowSleep=clean.sleep<=2;
  const bigJump=volumeDeltaPct!==null&&volumeDeltaPct>=25;
  let mode="Normal Training";
  let status="Steady";
  let color="#38BFFF";
  let guidance="Train normally and keep reps clean before chasing extra load.";
  if(score>=82&&!highSoreness&&!bigJump&&activeLoggedCount>0){
    mode="Push Day";
    status="Green light";
    color="#2DD4A0";
    guidance="Warmups can decide the ceiling. If they move well, take the planned progression.";
  }else if(score<52||highSoreness||lowEnergy||lowSleep){
    mode=score<38||highSoreness&&lowEnergy?"Recovery Bias":"Controlled Session";
    status=mode==="Recovery Bias"?"Reduce load":"Control work";
    color=mode==="Recovery Bias"?"#FF5C87":"#FFB347";
    guidance=mode==="Recovery Bias"
      ?"Keep the session lighter, skip grindy sets, and use the deload checkbox if this is intentional."
      :"Repeat recent loads, leave reps in reserve, and avoid turning this into a max-effort day.";
  }else if(bigJump){
    mode="Controlled Session";
    status="Volume jump";
    color="#FFB347";
    guidance="Your live volume is jumping fast. Finish the plan cleanly before adding more work.";
  }
  const readinessMix=[
    `Sleep ${clean.sleep}/5`,
    `Energy ${clean.energy}/5`,
    `Soreness ${clean.soreness}/5`,
  ].join(" - ");
  const volumeLabel=volumeDeltaPct===null
    ? activeLoggedCount?`${previewVol.toLocaleString()} lbs logged so far.`:"No live volume yet."
    : `${volumeDeltaPct>=0?"+":""}${volumeDeltaPct}% vs last day volume.`;
  const explanation=buildReadinessExplanation({...clean,volumeDeltaPct});
  return {
    workoutReadinessGate:true,
    mode,
    status,
    score,
    color,
    volumeDeltaPct,
    readinessMix,
    guidance,
    explanation,
    checks:[
      {label:"Volume Check",value:volumeLabel,color:bigJump?"#FFB347":"#38BFFF"},
      {label:"Readiness Mix",value:readinessMix,color:"#2DD4A0"},
      {label:"Log Guidance",value:guidance,color},
    ],
  };
}

function buildLivePRRadar(history,customEx={},activeDay,inputs={}){
  const dayInputs=inputs?.[activeDay]||{};
  const rows=allExercises(activeDay,customEx)
    .map(ex=>{
      const cell=dayInputs[ex.id];
      if(!isLoggedLiftCell(cell)) return null;
      const parsed=parseLiftCell(cell);
      const past=history
        .map(entry=>entry.exercises?.[ex.id])
        .filter(Boolean);
      const bestVolume=Math.max(0,...past.map(lift=>Number(lift.volume)||0));
      const bestWeight=Math.max(0,...past.map(lift=>Number(lift.w)||0));
      const bestOneRM=Math.max(0,...past.map(lift=>epley1RM(Number(lift.w)||0,Number(lift.r)||0)));
      const currentOneRM=epley1RM(Number(parsed.w)||0,Number(parsed.r)||0);
      const prs=[];
      if(bestVolume>0&&parsed.volume>bestVolume){
        prs.push({label:"Volume PR",delta:parsed.volume-bestVolume,color:"#2DD4A0"});
      }
      if(bestWeight>0&&parsed.w>bestWeight){
        prs.push({label:"Weight PR",delta:parsed.w-bestWeight,color:"#FFB347"});
      }
      if(bestOneRM>0&&currentOneRM>bestOneRM){
        prs.push({label:"Estimated 1RM PR",delta:currentOneRM-bestOneRM,color:"#7C6FFF"});
      }
      if(bestVolume===0&&parsed.volume>0){
        prs.push({label:"First Log",delta:parsed.volume,color:"#38BFFF"});
      }
      const bestGap=bestVolume>0?parsed.volume-bestVolume:parsed.volume;
      const isPr=prs.some(item=>item.label!=="First Log");
      return {
        ex,
        parsed,
        prs,
        bestVolume,
        bestWeight,
        bestOneRM,
        currentOneRM,
        bestGap,
        isPr,
        priority:(isPr?1000:0)+(prs.length*100)+Math.max(0,bestGap),
      };
    })
    .filter(Boolean)
    .sort((a,b)=>b.priority-a.priority||a.ex.name.localeCompare(b.ex.name));

  const candidates=rows.filter(row=>row.prs.length);
  const candidateCount=candidates.filter(row=>row.isPr).length;
  const topCandidate=candidates[0]||rows[0]||null;
  const status=!rows.length?"No live lifts yet":candidateCount>0?"PR in Range":"Building";
  const coachCue=!rows.length
    ?"Log a working set and the radar will compare it with your saved bests."
    : candidateCount>0
      ? `${candidateCount} draft PR${candidateCount===1?"":"s"} in range. Keep form clean before adding extra load.`
      : "No draft PR yet. Match your planned sets, then use the rest timer before chasing more.";
  return {
    livePrRadar:true,
    rows,
    candidates,
    topCandidate,
    candidateCount,
    loggedCount:rows.length,
    totalDraftVolume:rows.reduce((sum,row)=>sum+row.parsed.volume,0),
    status,
    coachCue,
  };
}

function buildNextSetCoach(history,ex,cell,profile=null,readinessScore=60){
  if(!ex||isSkippedLiftCell(cell)) return null;
  const rows=getLoggedSetRows(cell);
  const past=getLiftHistory(history,ex.id);
  const lastLift=past[past.length-1]||null;
  const group=profile?.group||"general";
  const equipment=profile?.equipment||"machine";
  const increment=equipment==="dumbbell"?2.5:5;
  const targetSets=Math.max(1,Number(ex.s||lastLift?.s||3));
  const baseWeight=Number(lastLift?.w||ex.w||0);
  const baseReps=Number(lastLift?.r||ex.r||8);
  const latest=rows[rows.length-1]||null;
  const previous=rows[rows.length-2]||null;
  const repDrop=!!(latest&&previous&&latest.r<=previous.r-3);
  const heavyGroup=["legs","chest","back"].includes(group);
  const lowReadiness=Number(readinessScore)<52;
  const highReadiness=Number(readinessScore)>=72;
  let restSeconds=heavyGroup?120:90;
  let decision="Start Set";
  let nextWeight=baseWeight;
  let nextReps=baseReps;
  let color="#38BFFF";
  let reason=lastLift
    ?"Start from the last saved working set, then adjust after the first logged set."
    :"Start from the exercise default and let the coach adjust once sets are logged.";

  if(latest){
    nextWeight=latest.w;
    nextReps=Math.max(1,latest.r);
    if(rows.length>=targetSets){
      decision="Quality Cap";
      color="#7C6FFF";
      reason=`You have logged ${rows.length} set${rows.length===1?"":"s"}. Add more only if form still looks sharp.`;
      restSeconds=heavyGroup?150:120;
    }else if(lowReadiness&&(repDrop||latest.r<baseReps)){
      decision="Reduce Load";
      color="#FFB347";
      nextWeight=Math.max(increment,roundToNearest(latest.w*0.9,increment));
      reason="Readiness is low or reps are fading, so the next set should protect quality.";
      restSeconds=heavyGroup?180:150;
    }else if(repDrop){
      decision="Reduce Load";
      color="#FFB347";
      nextWeight=Math.max(increment,roundToNearest(latest.w*0.92,increment));
      reason="Your last set dropped several reps. Trim the load and keep the next set clean.";
      restSeconds=heavyGroup?180:150;
    }else if(highReadiness&&latest.r>=baseReps+2){
      decision="Small Load Jump";
      color="#2DD4A0";
      nextWeight=roundToNearest(latest.w+increment,increment);
      nextReps=Math.max(baseReps,latest.r-2);
      reason="The last set beat the target reps and readiness is strong enough to test a small jump.";
      restSeconds=heavyGroup?150:120;
    }else if(latest.r>=baseReps){
      decision="Add One Rep";
      color="#2DD4A0";
      nextWeight=latest.w;
      nextReps=latest.r+1;
      reason="Load is moving at or above target. Add one rep before adding more weight.";
      restSeconds=heavyGroup?150:105;
    }else{
      decision="Repeat Clean Set";
      color="#38BFFF";
      nextWeight=latest.w;
      nextReps=latest.r;
      reason="Hold the same target and make the next set cleaner before progressing.";
      restSeconds=heavyGroup?150:105;
    }
  }

  return {
    nextSetCoach:true,
    decision,
    nextWeight,
    nextReps,
    target:`${nextWeight} lbs x ${nextReps}`,
    restSeconds,
    restLabel:fmtTime(restSeconds),
    reason,
    color,
    recentSetLabel:latest?`${latest.w} lbs x ${latest.r}`:"No set logged yet",
    loggedSets:rows.length,
    targetSets,
    canApply:nextWeight>0&&nextReps>0,
  };
}

function buildSessionPacer(sessionStartedAt,sessionTick,previewVol=0,activeLoggedCount=0,activeSetCount=0,readinessScore=60){
  const started=Number(sessionStartedAt)||Date.now();
  const now=Number(sessionTick)||Date.now();
  const elapsedSeconds=Math.max(0,Math.floor((now-started)/1000));
  const elapsedMinutes=Math.max(1,Math.ceil(elapsedSeconds/60));
  const elapsedLabel=fmtTime(elapsedSeconds);
  const volumePerMinute=Math.round((Number(previewVol)||0)/elapsedMinutes);
  const setsPerHour=Math.round((Number(activeSetCount)||0)/(elapsedMinutes/60||1));
  const readiness=Number(readinessScore)||60;
  let status="On Pace";
  let color="#38BFFF";
  let cue="Keep logging sets and let the rest timer control the pace.";
  if(activeSetCount===0){
    status="Warmup Window";
    color="#FFB347";
    cue="Start the first working set when warmups feel clean.";
  }else if(elapsedMinutes>=75&&readiness<60){
    status="Wrap Soon";
    color="#FF5C87";
    cue="Session is running long with lower readiness. Finish priority lifts and avoid extra volume.";
  }else if(elapsedMinutes>=60&&volumePerMinute<450){
    status="Long Session";
    color="#FFB347";
    cue="Pace is drifting. Use focused rests and trim optional work if energy is fading.";
  }else if(activeSetCount>=6&&elapsedMinutes<=20){
    status="Fast Session";
    color="#2DD4A0";
    cue="You are moving fast. Keep form strict and do not rush heavy sets.";
  }else if(volumePerMinute>=900&&activeLoggedCount>0){
    status="High Output";
    color="#2DD4A0";
    cue="Strong output pace. Stay clean, then stop before quality drops.";
  }
  return {
    sessionPacer:true,
    elapsedSeconds,
    elapsedMinutes,
    elapsedLabel,
    activeLoggedCount,
    activeSetCount,
    volumePerMinute,
    setsPerHour,
    status,
    color,
    cue,
  };
}

function buildSetQualitySummary(cell,readinessScore=60){
  const rows=getLoggedSetRows(cell);
  const counts=Object.fromEntries(SET_QUALITY_OPTIONS.map(item=>[item.id,0]));
  for(const row of rows){
    const quality=SET_QUALITY_OPTIONS.some(item=>item.id===row.quality)?row.quality:"good";
    counts[quality]++;
  }
  const hardSets=(counts.hard||0)+(counts.failed||0);
  const easySets=counts.easy||0;
  const total=rows.length;
  const dominant=SET_QUALITY_OPTIONS
    .map(item=>({...item,count:counts[item.id]||0}))
    .sort((a,b)=>b.count-a.count)[0]||SET_QUALITY_OPTIONS[1];
  let status="No Sets Yet";
  let color="#38BFFF";
  let cue="Tag sets after logging them so coaching can separate easy volume from grindy work.";
  if(total>0){
    status=`${dominant.label} Lead`;
    color=dominant.color;
    cue=hardSets>=2
      ?"Several hard or failed sets are logged. Keep the next set clean or stop before form breaks."
      : readinessScore<52&&hardSets>=1
        ?"Readiness is low and a hard set is already logged. Repeat or reduce load."
        : easySets>=2
          ?"Multiple easy sets are logged. If form is sharp, a small progression is reasonable."
          :"Quality looks controlled. Keep tagging each set so the trend stays useful.";
  }
  const qualityMix=SET_QUALITY_OPTIONS
    .map(item=>`${item.label} ${counts[item.id]||0}`)
    .join(" - ");
  return {
    setQualitySummary:true,
    total,
    counts,
    hardSets,
    qualityMix,
    status,
    color,
    cue,
  };
}

function buildWorkoutCompletionGuard(dayKey,inputs={},customEx={}){
  const exercises=allExercises(dayKey,customEx);
  const dayInputs=inputs?.[dayKey]||{};
  const logged=[];
  const skipped=[];
  const needsAction=[];
  for(const ex of exercises){
    const cell=dayInputs[ex.id];
    if(isSkippedLiftCell(cell)){
      skipped.push(ex);
    }else if(isLoggedLiftCell(cell)){
      logged.push(ex);
    }else{
      needsAction.push(ex);
    }
  }
  const removed=removedExercises(dayKey,customEx);
  const handled=logged.length+skipped.length;
  const completionPct=exercises.length?Math.round((handled/exercises.length)*100):100;
  const ready=needsAction.length===0;
  const status=ready?"Ready to confirm":"Needs Action";
  const color=ready?"#2DD4A0":"#FFB347";
  const cue=ready
    ? logged.length
      ?"Every active exercise is logged or intentionally skipped. You can confirm this workout day."
      :"All exercises are skipped. Confirm only if this was an intentional skipped workout day."
    : `Log or skip ${needsAction.length} remaining exercise${needsAction.length===1?"":"s"} before confirming.`;
  return {
    completionGuard:true,
    dayKey,
    dayLabel:DAYS[dayKey]?.label||"Workout",
    total:exercises.length,
    loggedCount:logged.length,
    skippedCount:skipped.length,
    removedCount:removed.length,
    needsActionCount:needsAction.length,
    completionPct,
    ready,
    status,
    color,
    cue,
    needsActionIds:needsAction.map(ex=>ex.id),
    needsActionNames:needsAction.map(ex=>ex.name),
  };
}

function buildWorkoutStory(entry,previousHistory=[],customEx={}){
  const total=getTotalVol(entry,customEx);
  const muscleVolumes=getMuscleVolumes(entry,customEx);
  const trainedMuscles=MUSCLE_GROUPS
    .filter(group=>(muscleVolumes[group.id]||0)>0)
    .sort((a,b)=>(muscleVolumes[b.id]||0)-(muscleVolumes[a.id]||0));
  let bestLift=null,prCount=0,setCount=0;
  for(const dk of DAY_KEYS){
    for(const ex of exerciseCatalogForDay(dk,customEx)){
      const lift=entry.exercises?.[ex.id];
      if(!lift) continue;
      setCount+=lift.s||getLiftSetRows(lift).length||0;
      if(!bestLift||lift.volume>bestLift.volume) bestLift={...lift,ex,dk};
      const prevBest=Math.max(0,...previousHistory.map(e=>e.exercises?.[ex.id]?.volume||0));
      if(prevBest>0&&lift.volume>prevBest) prCount++;
    }
  }
  const previousComparable=getComparableHistory(previousHistory,entry);
  const previousEntry=previousComparable[previousComparable.length-1]||null;
  const previousTotal=previousEntry?getTotalVol(previousEntry,customEx):0;
  const delta=previousTotal?total-previousTotal:0;
  const topMuscles=trainedMuscles.slice(0,3).map(group=>group.label).join(", ");
  const ratingText=entry.rating?`${entry.rating}/5 feel`:"no rating";
  const rpeText=entry.rpe?`RPE ${entry.rpe}`:"RPE not logged";
  const readinessScore=getReadinessScore(entry.readiness);
  const readinessText=readinessScore===null
    ?"readiness not logged"
    :`${readinessScore}/100 ${getReadinessLabel(readinessScore).toLowerCase()}`;
  const note=entry.notes?.trim();
  const periodLabel=getEntryPeriodLabel(entry,Math.max(0,(entry.periodNumber||entry.week||1)-1),{
    dayLabels:Object.fromEntries(DAY_KEYS.map(key=>[key,DAYS[key].label])),
  });
  const storyHeadline=entry.deload
    ?"Smart Recovery Logged"
    : prCount>=3
      ?"PR-Filled Training Day"
      : delta>0&&previousTotal
        ?"Volume Moved Up"
        : trainedMuscles.length>=4
          ?"Balanced Builder Session"
          :"Workout Logged";
  const storyNarrative=[
    `${periodLabel} finished with ${total.toLocaleString()} lbs across ${setCount} set${setCount===1?"":"s"}.`,
    bestLift?`${bestLift.ex.name} led the day at ${bestLift.volume.toLocaleString()} lbs of volume.`:"",
    prCount?`${prCount} lift${prCount===1?"":"s"} beat previous volume highs.`:"No new volume PRs, but the work is banked.",
    topMuscles?`Main focus: ${topMuscles}.`:"",
    entry.deload?`This was marked as a recovery ${entry.periodType===PERIOD_TYPES.DAY?"session":"week"}, so the app treats it as smart load management.`:"",
    `Session feel: ${ratingText}, ${rpeText}.`,
    readinessScore!==null?`Readiness: ${readinessText}.`:"",
    note?`Note: ${note}`:"",
  ].filter(Boolean).join(" ");
  const storyHighlights=[
    {label:"Top lift",value:bestLift?`${bestLift.ex.name} (${bestLift.volume.toLocaleString()} lbs)`:"None yet",color:"#FFB347"},
    {label:"PRs",value:String(prCount),color:"#2DD4A0"},
    {label:"Muscles",value:trainedMuscles.length?trainedMuscles.map(group=>group.label).join(", "):"None",color:"#38BFFF"},
    {label:"Readiness",value:readinessScore===null?"Not logged":`${readinessScore}/100`,color:"#2DD4A0"},
    {label:"Feel",value:`${ratingText} / ${rpeText}`,color:"#7C6FFF"},
  ];
  return {storyHeadline,storyNarrative,storyHighlights,total,trainedMuscles,bestLift,prCount,setCount};
}

function buildWorkoutRecap(entry,previousHistory=[],customEx={}){
  const story=buildWorkoutStory(entry,previousHistory,customEx);
  const {total,trainedMuscles,bestLift,prCount,setCount,storyHeadline,storyNarrative,storyHighlights}=story;
  const shareText=[
    `Earned ${getEntryPeriodLabel(entry,Math.max(0,(entry.periodNumber||entry.week||1)-1),{
      dayLabels:Object.fromEntries(DAY_KEYS.map(key=>[key,DAYS[key].label])),
    })}`,
    storyHeadline,
    storyNarrative,
    `${total.toLocaleString()} lbs total volume`,
    bestLift?`Best lift: ${bestLift.ex.name} (${bestLift.volume.toLocaleString()} lbs)`:"",
    prCount?`${prCount} volume PR${prCount!==1?"s":""}`:"",
    trainedMuscles.length?`Trained: ${trainedMuscles.map(g=>g.label).join(", ")}`:"",
  ].filter(Boolean).join("\n");
  return {total,trainedMuscles,bestLift,prCount,setCount,shareText,storyHeadline,storyNarrative,storyHighlights};
}

const clamp=(value,min=0,max=100)=>Math.max(min,Math.min(max,value));

function getWeekPRCount(entry,previousHistory=[],customEx={}){
  if(!entry?.exercises) return 0;
  let count=0;
  for(const dk of DAY_KEYS){
    for(const ex of exerciseCatalogForDay(dk,customEx)){
      const cur=entry.exercises?.[ex.id]?.volume||0;
      if(!cur) continue;
      const prevBest=Math.max(0,...previousHistory.map(e=>e.exercises?.[ex.id]?.volume||0));
      if(prevBest>0&&cur>prevBest) count++;
    }
  }
  return count;
}

function getTrainingQuality(history,index,customEx={}){
  const entry=history[index];
  if(!entry) return null;
  const periodNoun=entry.periodType===PERIOD_TYPES.DAY?"session":"week";
  const previousHistory=history.slice(0,index);
  const previousComparableHistory=getComparableHistory(history.slice(0,index),entry);
  const prev=previousComparableHistory[previousComparableHistory.length-1]||null;
  const total=getTotalVol(entry,customEx);
  const prevTotal=prev?getTotalVol(prev,customEx):total;
  const changePct=prevTotal?((total-prevTotal)/prevTotal)*100:0;
  const muscleVolumes=getMuscleVolumes(entry,customEx);
  const trained=MUSCLE_GROUPS.filter(group=>(muscleVolumes[group.id]||0)>0);
  const topVolume=Math.max(0,...Object.values(muscleVolumes));
  const topShare=total?topVolume/total:0;
  const prCount=getWeekPRCount(entry,previousHistory,customEx);
  const rpe=Number(entry.rpe)||6;
  const rating=Number(entry.rating)||3;
  const readinessScore=getReadinessScore(entry.readiness);
  const readinessAdjustment=readinessScore===null?0:(readinessScore-67)*0.32;
  const isDeload=!!entry.deload;
  const streakThrough=calcStreak(history.slice(0,index+1),customEx);

  const loadScore=isDeload
    ? 82
    : prev
      ? clamp(88-Math.abs(changePct-8)*2.2-(changePct>28?(changePct-28)*1.3:0))
      : total>0?72:0;
  const balanceScore=total
    ? entry.periodType===PERIOD_TYPES.DAY
      ? clamp(78+Math.max(0,trained.length-1)*6+(1-topShare)*10)
      : clamp((trained.length/MUSCLE_GROUPS.length)*72+(1-topShare)*38)
    : 0;
  const recoveryScore=isDeload
    ? 90
    : clamp(82-(Math.max(0,rpe-7)*11)+(rating-3)*7-(changePct>18?(changePct-18)*1.1:0)+readinessAdjustment);
  const progressionScore=clamp(45+prCount*18+(prev&&total>prevTotal?12:0)+(changePct>0&&changePct<=18?10:0));
  const consistencyScore=clamp(38+Math.min(streakThrough,5)*12+(entry.date?10:0)+(total>0?10:0));
  const score=Math.round(loadScore*0.24+balanceScore*0.2+recoveryScore*0.22+progressionScore*0.2+consistencyScore*0.14);
  const grade=score>=90?"A+":score>=82?"A":score>=74?"B+":score>=66?"B":score>=58?"C+":"C";
  const color=score>=82?"#2DD4A0":score>=70?"#38BFFF":score>=58?"#FFB347":"#FF5C87";
  const summary=isDeload
    ?`Recovery ${periodNoun} counted as smart load management.`
    : score>=82
      ?`High-quality ${periodNoun}: strong load, recovery, and progression signals.`
      : score>=70
        ?`Productive ${periodNoun} with a few areas to sharpen.`
        : score>=58
          ?"Useful work, but balance or recovery needs attention."
          :"Training quality is low; reduce friction and rebuild momentum.";
  return {
    score,grade,color,summary,total,changePct,prCount,trainedCount:trained.length,topShare,
    components:[
      {label:"Load",value:Math.round(loadScore),color:"#7C6FFF"},
      {label:"Balance",value:Math.round(balanceScore),color:"#38BFFF"},
      {label:"Recovery",value:Math.round(recoveryScore),color:"#2DD4A0"},
      {label:"Progress",value:Math.round(progressionScore),color:"#FFB347"},
      {label:"Consistency",value:Math.round(consistencyScore),color:"#FF5C87"},
    ],
  };
}

function buildTrainingQualityBreakdown(history,customEx={}){
  if(!history.length) return null;
  const qualityRows=history.map((entry,index)=>getTrainingQuality(history,index,customEx)).filter(Boolean);
  const latest=qualityRows[qualityRows.length-1];
  const latestEntry=history[history.length-1];
  const previousComparableEntries=getComparableHistory(history.slice(0,-1),latestEntry);
  const previousEntry=previousComparableEntries[previousComparableEntries.length-1]||null;
  const previousIndex=previousEntry?history.lastIndexOf(previousEntry):-1;
  const previous=previousIndex>=0?getTrainingQuality(history,previousIndex,customEx):null;
  const components=latest.components.map(component=>{
    const previousComponent=previous?.components.find(item=>item.label===component.label);
    return {
      ...component,
      delta:previousComponent?component.value-previousComponent.value:null,
    };
  });
  const strongestComponent=[...components].sort((a,b)=>b.value-a.value)[0];
  const priorityComponent=[...components].sort((a,b)=>a.value-b.value)[0];
  const scoreDelta=previous?latest.score-previous.score:null;
  const actionByComponent={
    Load:"Keep the next volume change inside a controlled 5-15% range.",
    Balance:"Give the least-trained muscle group one focused exposure in the next split cycle.",
    Recovery:"Keep hard sets controlled and log readiness before the next workout.",
    Progress:"Beat one clean rep, set, or load target before increasing total stress.",
    Consistency:`Protect the next planned workout and keep the ${latestEntry?.periodType===PERIOD_TYPES.DAY?"daily":"weekly"} rhythm intact.`,
  };
  const coachActions=[
    {
      title:`Improve ${priorityComponent.label}`,
      detail:actionByComponent[priorityComponent.label],
      color:priorityComponent.color,
    },
    {
      title:`Protect ${strongestComponent.label}`,
      detail:scoreDelta!==null&&scoreDelta<0
        ?`Keep ${strongestComponent.label.toLowerCase()} steady while rebuilding the priority score.`
        :`Your strongest driver is working. Maintain it without chasing unnecessary volume.`,
      color:strongestComponent.color,
    },
  ];
  const qualityTrend=qualityRows.map((quality,index)=>({
    week:getEntryShortLabel(history[index],index),
    Quality:quality.score,
    grade:quality.grade,
  })).slice(-6);
  const comparison=scoreDelta===null
    ?`Baseline ${latestEntry?.periodType===PERIOD_TYPES.DAY?"session":"week"}`
    :scoreDelta>0
      ?`Up ${scoreDelta} points`
      :scoreDelta<0
        ?`Down ${Math.abs(scoreDelta)} points`
        :"No score change";
  return {
    score:latest.score,
    grade:latest.grade,
    color:latest.color,
    summary:latest.summary,
    scoreDelta,
    comparison,
    components,
    strongestComponent,
    priorityComponent,
    coachActions,
    qualityTrend,
  };
}

function getFatigueTrend(history,customEx={}){
  return history.map((entry,index)=>{
    const previousComparableHistory=getComparableHistory(history.slice(0,index),entry);
    const prev=previousComparableHistory[previousComparableHistory.length-1]||null;
    const total=getTotalVol(entry,customEx);
    const prevTotal=prev?getTotalVol(prev,customEx):total;
    const jump=prevTotal?((total-prevTotal)/prevTotal)*100:0;
    const rpe=Number(entry.rpe)||6;
    const rating=Number(entry.rating)||3;
    const readinessScore=getReadinessScore(entry.readiness);
    const readinessFatigue=readinessScore===null?0:(67-readinessScore)*0.34;
    const streak=calcStreak(history.slice(0,index+1),customEx);
    const fatigue=entry.deload
      ? clamp(24+(rpe-6)*5-(rating-3)*4+readinessFatigue*0.5)
      : clamp(34+Math.max(0,jump)*0.58+Math.max(0,rpe-6)*8+Math.max(0,streak-3)*4-(rating-3)*5+readinessFatigue);
    const quality=getTrainingQuality(history,index,customEx);
    return {
      week:getEntryShortLabel(entry,index),
      Fatigue:Math.round(fatigue),
      Quality:quality?.score||0,
      Volume:total,
      changePct:jump,
      deload:!!entry.deload,
      periodType:entry.periodType,
      dayKey:entry.dayKey,
    };
  });
}

function buildRecoveryForecast(history,customEx={}){
  if(!history.length) return null;
  const latest=history[history.length-1];
  const fatigueRows=getFatigueTrend(history,customEx);
  const latestFatigue=fatigueRows[fatigueRows.length-1]?.Fatigue||0;
  const comparableFatigueRows=latest.periodType===PERIOD_TYPES.DAY
    ?fatigueRows.filter(row=>row.periodType===PERIOD_TYPES.DAY&&row.dayKey===latest.dayKey)
    :fatigueRows;
  const priorFatigue=comparableFatigueRows[comparableFatigueRows.length-2]?.Fatigue??latestFatigue;
  const quality=getTrainingQuality(history,history.length-1,customEx);
  const recoveryComponent=quality?.components?.find(item=>item.label==="Recovery")?.value??67;
  const readinessScore=getReadinessScore(latest.readiness);
  const readinessSignal=readinessScore===null?67:readinessScore;
  const rpe=Number(latest.rpe)||6;
  const rating=Number(latest.rating)||3;
  const currentScore=Math.round(clamp(
    34+
    (100-latestFatigue)*0.38+
    (quality?.score||60)*0.18+
    recoveryComponent*0.18+
    readinessSignal*0.16-
    Math.max(0,rpe-8)*4+
    Math.max(0,rating-3)*2+
    (latest.deload?6:0)
  ));
  const recommendation=currentScore>=82
    ?"Progression ready"
    :currentScore>=65
      ?"Controlled"
      :"Recovery";
  const status=currentScore>=82
    ?"Strong readiness signal"
    :currentScore>=65
      ?"Train with guardrails"
      :"Recovery-biased signal";
  const color=currentScore>=82?"#2DD4A0":currentScore>=65?"#FFB347":"#FF5C87";
  const recoveryRate=latest.deload?10:currentScore<65?8:5;
  const dayTwoGain=Math.max(4,Math.round((100-currentScore)*0.12));
  const horizons=[
    {label:"Next session",score:currentScore,detail:recommendation},
    {label:"In 24 hours",score:Math.min(96,currentScore+recoveryRate),detail:"Estimated easing"},
    {label:"In 48 hours",score:Math.min(96,currentScore+recoveryRate+dayTwoGain),detail:"Estimated readiness"},
  ];
  const fatigueDiff=latestFatigue-priorFatigue;
  const periodNoun=latest.periodType===PERIOD_TYPES.DAY?"session":"week";
  const factors=[
    {
      label:"Fatigue",
      value:`${latestFatigue}/100`,
      detail:fatigueRows.length<2
        ?"Starting baseline"
        :fatigueDiff>0?`Up ${fatigueDiff} from last ${periodNoun}`:fatigueDiff<0?`Down ${Math.abs(fatigueDiff)} from last ${periodNoun}`:`Steady from last ${periodNoun}`,
      color:latestFatigue>=72?"#FF5C87":latestFatigue>=55?"#FFB347":"#2DD4A0",
    },
    {
      label:"Readiness",
      value:readinessScore===null?"Not logged":`${readinessScore}/100`,
      detail:readinessScore===null?"Add a check-in for a sharper estimate":"Sleep, energy, and soreness",
      color:readinessScore===null?"#98a19c":readinessScore>=75?"#2DD4A0":readinessScore>=58?"#FFB347":"#FF5C87",
    },
    {
      label:"Recovery quality",
      value:`${recoveryComponent}/100`,
      detail:latest.deload?`Recovery ${periodNoun} recognized`:`From ${periodNoun} quality`,
      color:recoveryComponent>=78?"#2DD4A0":recoveryComponent>=60?"#38BFFF":"#FFB347",
    },
  ];
  const confidence=history.length>=6&&readinessScore!==null
    ?"High"
    :history.length>=3
      ?"Moderate"
      :"Building";
  const summary=recommendation==="Progression ready"
    ?"Signals support a normal session; earn any load increase through clean warmups."
    :recommendation==="Controlled"
      ?"Useful training is available, but keep one or two reps in reserve."
      :"Favor lighter work, mobility, or rest until the trend improves.";
  return {currentScore,recommendation,status,color,horizons,factors,confidence,summary};
}

function buildMuscleDriftAlerts(history,customEx={}){
  const recentWindowSize=3;
  const minimumHistory=4;
  const driftThreshold=6;
  if(!history.length) return null;
  const recentEntries=history.slice(-recentWindowSize);
  const recentStart=Math.max(0,history.length-recentWindowSize);
  const baselineEntries=history.slice(Math.max(0,recentStart-recentWindowSize),recentStart);
  const aggregateWindow=entries=>{
    const volumes=Object.fromEntries(MUSCLE_GROUPS.map(group=>[group.id,0]));
    for(const entry of entries){
      const entryVolumes=getMuscleVolumes(entry,customEx);
      for(const group of MUSCLE_GROUPS) volumes[group.id]+=entryVolumes[group.id]||0;
    }
    const total=Object.values(volumes).reduce((sum,value)=>sum+value,0);
    return {volumes,total};
  };
  const recent=aggregateWindow(recentEntries);
  const baseline=aggregateWindow(baselineEntries);
  const rows=MUSCLE_GROUPS.map(group=>{
    const recentShare=recent.total?(recent.volumes[group.id]/recent.total)*100:0;
    const baselineShare=baseline.total?(baseline.volumes[group.id]/baseline.total)*100:0;
    const drift=recentShare-baselineShare;
    return {
      ...group,
      recentShare:Number(recentShare.toFixed(1)),
      baselineShare:Number(baselineShare.toFixed(1)),
      drift:Number(drift.toFixed(1)),
    };
  });
  const hasEnoughHistory=history.length>=minimumHistory&&baselineEntries.length>0&&baseline.total>0;
  const falling=hasEnoughHistory
    ?[...rows].filter(row=>row.drift<=-driftThreshold).sort((a,b)=>a.drift-b.drift)[0]||null
    :null;
  const gaining=hasEnoughHistory
    ?[...rows].filter(row=>row.drift>=driftThreshold).sort((a,b)=>b.drift-a.drift)[0]||null
    :null;
  const alerts=[];
  if(falling){
    alerts.push({
      ...falling,
      state:"Falling behind",
      severity:Math.abs(falling.drift)>=12?"High drift":"Watch",
      color:"#FF5C87",
      cue:`Give ${falling.label} one focused exposure in the next split cycle.`,
    });
  }
  if(gaining){
    alerts.push({
      ...gaining,
      state:"Gaining ground",
      severity:gaining.drift>=12?"Fast gain":"Improving",
      color:"#2DD4A0",
      cue:`Keep ${gaining.label} volume steady while the rest of the split catches up.`,
    });
  }
  if(hasEnoughHistory&&!alerts.length){
    alerts.push({
      id:"stable",
      label:"Training split",
      state:"Stable",
      severity:"Within range",
      color:"#38BFFF",
      recentShare:null,
      baselineShare:null,
      drift:0,
      cue:"No muscle share moved more than 6 points. Keep the current rotation consistent.",
    });
  }
  const status=!hasEnoughHistory
    ?"More history needed"
    :falling
      ?`${falling.label} needs attention`
      :"Muscle balance is stable";
  const summary=!hasEnoughHistory
    ?`Log ${Math.max(0,minimumHistory-history.length)} more workout${minimumHistory-history.length===1?"":"s"} to compare persistent muscle trends.`
    :"Compares the latest three workouts with the prior training window by volume share.";
  return {rows,alerts,hasEnoughHistory,status,summary,recentCount:recentEntries.length,baselineCount:baselineEntries.length};
}

function buildJointStressGuardrails(history,customEx={}){
  if(!history.length) return null;
  const latest=history[history.length-1];
  const comparableHistory=getComparableHistory(history,latest);
  const prev=comparableHistory.length>1?comparableHistory[comparableHistory.length-2]:null;
  const total=getTotalVol(latest,customEx);
  const prevTotal=prev?getTotalVol(prev,customEx):total;
  const volumeJumpPct=prevTotal?Math.round(((total-prevTotal)/prevTotal)*100):0;
  const fatigueRows=getFatigueTrend(history,customEx);
  const fatigue=fatigueRows[fatigueRows.length-1]?.Fatigue||0;
  const readinessScore=getReadinessScore(latest.readiness);
  const readinessPenalty=readinessScore===null?0:Math.max(0,67-readinessScore);
  const recentFatigue=fatigueRows.slice(-3);
  const recentEntries=history.slice(-3);
  const highStressCount=recentEntries.reduce((count,entry,index)=>{
    const row=recentFatigue[index]||{};
    const entryReadiness=getReadinessScore(entry.readiness);
    return count+((row.Fatigue||0)>=72||Number(entry.rpe||0)>=8||(entryReadiness!==null&&entryReadiness<52)?1:0);
  },0);
  const latestVolumes=getMuscleVolumes(latest,customEx);
  const prior=comparableHistory.slice(Math.max(0,comparableHistory.length-5),-1);
  const totalSafe=Math.max(1,total);
  const jointLabels={
    biceps:"Elbow / arm load",
    shoulders:"Shoulder load",
    chest:"Pressing shoulder load",
    back:"Pulling back load",
    legs:"Knee / hip load",
  };
  const pressureZones=MUSCLE_GROUPS.map(group=>{
    const current=latestVolumes[group.id]||0;
    const avg=prior.length
      ? prior.reduce((sum,entry)=>sum+(getMuscleVolumes(entry,customEx)[group.id]||0),0)/prior.length
      : 0;
    const share=current/totalSafe;
    const spikePct=avg?((current-avg)/avg)*100:(current>0?20:0);
    const pressure=clamp(share*58+Math.max(0,spikePct)*0.28+fatigue*0.1+readinessPenalty*0.12);
    return {
      ...group,
      joint:jointLabels[group.id]||`${group.label} load`,
      current,
      avg,
      share,
      spikePct:Math.round(spikePct),
      pressure:Math.round(pressure),
    };
  }).sort((a,b)=>b.pressure-a.pressure);
  const topPressure=pressureZones[0]||null;
  const rawScore=18+
    Math.max(0,volumeJumpPct)*0.45+
    fatigue*0.32+
    highStressCount*7+
    readinessPenalty*0.35+
    (topPressure?.pressure||0)*0.22-
    (latest.deload?18:0);
  const score=Math.round(clamp(rawScore));
  const status=score>=75?"Back-off advised"
    :score>=58?"Manage load"
      :score>=38?"Monitor closely"
        :"Green-light load";
  const color=score>=75?"#FF5C87":score>=58?"#FFB347":score>=38?"#38BFFF":"#2DD4A0";
  const coachCue=score>=75
    ?`Keep the next session lighter and avoid max-effort work around ${topPressure?.joint||"your top pressure zone"}.`
    : score>=58
      ?`Use controlled sets and watch ${topPressure?.joint||"your top pressure zone"} before adding load.`
      : score>=38
        ?`Training load is workable, but keep warmups honest and avoid sudden jumps.`
        :"Load signals look controlled. Progress gradually and keep clean form.";
  return {
    score,
    status,
    color,
    coachCue,
    total,
    prevTotal,
    volumeJumpPct,
    fatigue,
    readinessScore,
    highStressCount,
    pressureZones:pressureZones.slice(0,3),
    jointStressGuardrails:true,
  };
}

function forecastWeeksToGoal(current,goal,trend){
  if(!goal||goal<=0) return null;
  if(current>=goal) return 0;
  if(trend<=0) return null;
  return Math.max(1,Math.ceil((goal-current)/trend));
}

function buildGoalForecasts(history,goals={},customEx={}){
  const latest=history[history.length-1]||null;
  const previous=history.length>1?history[history.length-2]:null;
  const recent=history.slice(-4);
  const weeklyGoal=Number(goals?.weeklyVolume)||0;
  const currentWeekly=latest?getTotalVol(latest,customEx):0;
  const previousWeekly=previous?getTotalVol(previous,customEx):0;
  const recentAverage=recent.length
    ? Math.round(recent.reduce((sum,entry)=>sum+getTotalVol(entry,customEx),0)/recent.length)
    : 0;
  const weeklyTrend=latest&&previous?currentWeekly-previousWeekly:0;
  const weeklyWeeks=forecastWeeksToGoal(currentWeekly,weeklyGoal,weeklyTrend);
  const weeklyPace=currentWeekly>=weeklyGoal?"Goal hit"
    : weeklyTrend>0?"Improving"
      : recentAverage>0&&currentWeekly>=recentAverage?"Stable"
        :"Needs momentum";
  const weeklyNextTarget=weeklyGoal
    ? Math.min(weeklyGoal,Math.max(currentWeekly+Math.max(500,Math.round(Math.max(weeklyTrend,0)*0.5)),currentWeekly))
    : 0;
  const weeklyForecast=weeklyGoal?{
    goal:weeklyGoal,
    current:currentWeekly,
    previous:previousWeekly,
    recentAverage,
    trend:weeklyTrend,
    weeksToGoal:weeklyWeeks,
    pace:weeklyPace,
    nextTarget:weeklyNextTarget,
    progress:Math.round(clamp((currentWeekly/weeklyGoal)*100)),
  }:null;

  const exerciseForecasts=[];
  for(const dk of DAY_KEYS){
    for(const ex of allExercises(dk,customEx)){
      const goal=Number(goals?.[ex.id])||0;
      if(!goal) continue;
      const rows=history.map((entry,index)=>({
        entry,
        index,
        lift:entry.exercises?.[ex.id],
      })).filter(row=>row.lift?.volume>0);
      const latestRow=rows[rows.length-1]||null;
      const prevRow=rows[rows.length-2]||null;
      const current=latestRow?.lift?.volume||0;
      const previousVol=prevRow?.lift?.volume||0;
      const trend=latestRow&&prevRow?current-previousVol:0;
      const weeksToGoal=forecastWeeksToGoal(current,goal,trend);
      const pace=current>=goal?"Goal hit"
        : trend>0?"Improving"
          : rows.length>=2?"Needs momentum"
            :"Needs more logs";
      const nextTarget=Math.min(goal,Math.max(current+Math.max(100,Math.round(Math.max(trend,0)*0.5)),current));
      exerciseForecasts.push({
        id:ex.id,
        ex,
        dayKey:dk,
        goal,
        current,
        trend,
        weeksToGoal,
        pace,
        nextTarget,
        progress:goal?Math.round(clamp((current/goal)*100)):0,
        logCount:rows.length,
        color:DAYS[dk].accent,
      });
    }
  }

  exerciseForecasts.sort((a,b)=>{
    const aDone=a.current>=a.goal,bDone=b.current>=b.goal;
    if(aDone!==bDone) return aDone?1:-1;
    const aw=a.weeksToGoal??999,bw=b.weeksToGoal??999;
    return aw-bw || b.progress-a.progress;
  });

  return {
    goalForecasts:true,
    weeklyForecast,
    exerciseForecasts,
    hasGoals:!!weeklyForecast||exerciseForecasts.length>0,
  };
}

function buildBodyMetricsInsights(history,customEx={}){
  const metrics=bodyMetrics(customEx);
  const latestMetric=metrics[metrics.length-1]||null;
  const previousMetric=metrics.length>1?metrics[metrics.length-2]:null;
  const latestWeight=latestMetric?.weight||0;
  const previousWeight=previousMetric?.weight||0;
  const weightTrend=latestWeight&&previousWeight?Number((latestWeight-previousWeight).toFixed(1)):0;
  const latestWorkout=history[history.length-1]||null;
  const latestVolume=latestWorkout?getTotalVol(latestWorkout,customEx):0;
  let bestOneRM=0,bestLiftName="";
  for(const dk of DAY_KEYS){
    for(const ex of exerciseCatalogForDay(dk,customEx)){
      for(const entry of history){
        const lift=entry.exercises?.[ex.id];
        if(!lift?.volume) continue;
        const rm=epley1RM(lift.w||0,lift.r||0);
        if(rm>bestOneRM){
          bestOneRM=rm;
          bestLiftName=ex.name;
        }
      }
    }
  }
  const volumePerLb=latestWeight?Number((latestVolume/latestWeight).toFixed(1)):0;
  const bestOneRMPerLb=latestWeight?Number((bestOneRM/latestWeight).toFixed(2)):0;
  const trendLabel=!latestMetric
    ?"No bodyweight logged"
    : !previousMetric
      ?"Baseline saved"
      : weightTrend>0
        ?`Up ${Math.abs(weightTrend)} lbs`
        : weightTrend<0
          ?`Down ${Math.abs(weightTrend)} lbs`
          :"Stable";
  const strengthRatioLabel=latestWeight&&bestOneRM
    ?`${bestOneRMPerLb}x bodyweight`
    :"Log bodyweight to unlock ratio";
  return {
    bodyMetrics:metrics,
    latestMetric,
    previousMetric,
    latestWeight,
    weightTrend,
    latestVolume,
    bestOneRM,
    bestLiftName,
    volumePerLb,
    bestOneRMPerLb,
    trendLabel,
    strengthRatioLabel,
  };
}

function buildPerformanceCorrelations(history,customEx={}){
  const metrics=bodyMetrics(customEx);
  const metricForDate=date=>{
    if(!metrics.length) return null;
    const dated=String(date||"");
    let match=null;
    for(const metric of metrics){
      if(!dated||String(metric.date)<=dated) match=metric;
    }
    return match||metrics[metrics.length-1]||null;
  };
  const avg=(rows,key)=>rows.length
    ? rows.reduce((sum,row)=>sum+(Number(row[key])||0),0)/rows.length
    : 0;
  const rows=history.map((entry,index)=>{
    const total=getTotalVol(entry,customEx);
    const metric=metricForDate(entry.date);
    const hasReadiness=!!(entry.readiness&&typeof entry.readiness==="object");
    const readiness=hasReadiness?normalizeReadiness(entry.readiness):null;
    const readinessScore=getReadinessScore(entry.readiness);
    const prCount=getWeekPRCount(entry,history.slice(0,index),customEx);
    return {
      entry,
      index,
      total,
      prCount,
      hasReadiness,
      readiness,
      readinessScore,
      bodyweight:metric?.weight||0,
      volumePerLb:metric?.weight?total/metric.weight:0,
    };
  }).filter(row=>row.total>0);

  const makeSignal=({id,label,favorableLabel,baselineLabel,eligible,condition,color,cue})=>{
    const high=eligible.filter(condition);
    const baseline=eligible.filter(row=>!condition(row));
    if(high.length<1||baseline.length<1){
      return {
        id,label,favorableLabel,baselineLabel,color,locked:true,
        highAvg:0,baselineAvg:0,delta:0,deltaPct:0,prLift:0,
        signalStrength:0,confidence:"Needs more data",
        sampleLabel:`${eligible.length} logged`,
        cue:"Keep logging this signal to unlock a cleaner comparison.",
      };
    }
    const highAvg=avg(high,"total");
    const baselineAvg=avg(baseline,"total");
    const delta=highAvg-baselineAvg;
    const deltaPct=baselineAvg?Math.round((delta/baselineAvg)*100):0;
    const prLift=avg(high,"prCount")-avg(baseline,"prCount");
    const signalStrength=Math.round(clamp(Math.abs(deltaPct)*1.4+Math.min(30,high.length*6)+Math.min(18,Math.abs(prLift)*12)));
    const confidence=eligible.length>=6?"Strong sample":eligible.length>=4?"Growing sample":"Early signal";
    return {
      id,label,favorableLabel,baselineLabel,color,locked:false,
      highAvg:Math.round(highAvg),
      baselineAvg:Math.round(baselineAvg),
      delta:Math.round(delta),
      deltaPct,
      prLift:Number(prLift.toFixed(1)),
      signalStrength,
      confidence,
      sampleLabel:`${high.length} vs ${baseline.length}`,
      cue:cue(deltaPct,prLift),
    };
  };

  const readinessRows=rows.filter(row=>row.hasReadiness&&row.readinessScore!==null);
  const bodyweightRows=rows.filter(row=>row.bodyweight>0);
  const avgVolumePerLb=avg(bodyweightRows,"volumePerLb");
  const signalRows=[
    makeSignal({
      id:"readiness",
      label:"Readiness Signal",
      favorableLabel:"68+ readiness",
      baselineLabel:"Lower readiness",
      eligible:readinessRows,
      condition:row=>row.readinessScore>=68,
      color:"#2DD4A0",
      cue:(deltaPct)=>deltaPct>=0
        ?"Higher readiness is lining up with stronger output. Push planned overload on those days."
        :"Readiness is not leading volume yet. Compare exercise selection and schedule timing.",
    }),
    makeSignal({
      id:"sleep",
      label:"Sleep Impact",
      favorableLabel:"Sleep 4-5",
      baselineLabel:"Sleep 1-3",
      eligible:readinessRows,
      condition:row=>row.readiness.sleep>=4,
      color:"#38BFFF",
      cue:(deltaPct)=>deltaPct>=0
        ?"Better sleep is pairing with better sessions. Protect sleep before heavy days."
        :"Sleep is not showing a lift yet. Look at soreness, energy, or skipped work next.",
    }),
    makeSignal({
      id:"energy",
      label:"Energy Impact",
      favorableLabel:"Energy 4-5",
      baselineLabel:"Energy 1-3",
      eligible:readinessRows,
      condition:row=>row.readiness.energy>=4,
      color:"#FFB347",
      cue:(deltaPct)=>deltaPct>=0
        ?"High-energy days are producing more output. Save tougher sets for those windows."
        :"Energy is not the main driver yet. Your routine may be consistent across energy levels.",
    }),
    makeSignal({
      id:"soreness",
      label:"Soreness Drag",
      favorableLabel:"Soreness 1-2",
      baselineLabel:"Soreness 3-5",
      eligible:readinessRows,
      condition:row=>row.readiness.soreness<=2,
      color:"#FF5C87",
      cue:(deltaPct)=>deltaPct>=0
        ?"Lower soreness is lining up with better output. Keep recovery days intentional."
        :"Soreness is not dragging volume yet. Watch joint stress before forcing extra load.",
    }),
    makeSignal({
      id:"bodyweight",
      label:"Bodyweight Context",
      favorableLabel:"Higher volume/lb",
      baselineLabel:"Lower volume/lb",
      eligible:bodyweightRows,
      condition:row=>row.volumePerLb>=avgVolumePerLb,
      color:"#7C6FFF",
      cue:(deltaPct)=>deltaPct>=0
        ?"Your best volume-per-pound sessions are separating from baseline. Track bodyweight consistently."
        :"Bodyweight context is still noisy. Add more bodyweight entries before changing training from it.",
    }),
  ];
  const availableRows=signalRows.filter(row=>!row.locked);
  const bestSignal=availableRows.sort((a,b)=>b.signalStrength-a.signalStrength)[0]||null;
  const coachCue=bestSignal
    ? `${bestSignal.label}: ${bestSignal.cue}`
    : "Log at least two workouts with readiness check-ins, then add bodyweight entries for deeper context.";
  return {
    correlationLab:true,
    rows:signalRows,
    bestSignal,
    coachCue,
    sampleCount:rows.length,
    readinessSampleCount:readinessRows.length,
    bodyweightSampleCount:bodyweightRows.length,
  };
}

function getMuscleAlertRows(history,customEx={}){
  const latest=history[history.length-1];
  if(!latest) return [];
  const latestVolumes=getMuscleVolumes(latest,customEx);
  const total=getTotalVol(latest,customEx);
  const prior=history.slice(Math.max(0,history.length-5),history.length-1);
  const priorAvg=Object.fromEntries(MUSCLE_GROUPS.map(group=>{
    const avg=prior.length
      ? prior.reduce((sum,entry)=>sum+(getMuscleVolumes(entry,customEx)[group.id]||0),0)/prior.length
      : 0;
    return [group.id,avg];
  }));
  const sorted=[...MUSCLE_GROUPS].sort((a,b)=>(latestVolumes[b.id]||0)-(latestVolumes[a.id]||0));
  const strongest=sorted[0];
  const weakest=[...MUSCLE_GROUPS]
    .sort((a,b)=>{
      const av=(latestVolumes[a.id]||0)/(Math.max(priorAvg[a.id],1));
      const bv=(latestVolumes[b.id]||0)/(Math.max(priorAvg[b.id],1));
      if((latestVolumes[a.id]||0)===0) return -1;
      if((latestVolumes[b.id]||0)===0) return 1;
      return av-bv;
    })[0];
  const dominantShare=strongest&&total?(latestVolumes[strongest.id]||0)/total:0;
  const rows=[];
  if(strongest){
    rows.push({
      title:"Strongest muscle",
      label:strongest.label,
      value:`${fmtVol(latestVolumes[strongest.id]||0)} lbs`,
      detail:total?`${Math.round(dominantShare*100)}% of this week’s volume.`:"Log volume to unlock this.",
      color:strongest.color,
    });
  }
  if(weakest){
    const cur=latestVolumes[weakest.id]||0;
    const avg=priorAvg[weakest.id]||0;
    const gap=avg?Math.round(((cur-avg)/avg)*100):null;
    rows.push({
      title:"Weakest / undertrained",
      label:weakest.label,
      value:cur?`${fmtVol(cur)} lbs`:"0 lbs",
      detail:cur===0
        ?"No logged volume here this week."
        : gap!=null&&gap<0?`${Math.abs(gap)}% below your recent average.`:"Lowest current muscle-group output.",
      color:weakest.color,
    });
  }
  rows.push({
    title:dominantShare>0.58?"Balance alert":"Balance check",
    label:dominantShare>0.58?`${strongest.label} is dominating`:"Spread looks usable",
    value:dominantShare>0.58?`${Math.round(dominantShare*100)}% share`:`${sorted.filter(g=>(latestVolumes[g.id]||0)>0).length}/5 groups`,
    detail:dominantShare>0.58?"Next week, bias work toward the weaker groups.":"No single muscle group is taking over the week.",
    color:dominantShare>0.58?"#FFB347":"#2DD4A0",
  });
  return rows;
}

function buildChallenges(history,customEx={}){
  const latest=history[history.length-1];
  const total=latest?getTotalVol(latest,customEx):0;
  const best=history.length?Math.max(...history.map(entry=>getTotalVol(entry,customEx))):0;
  const streak=calcStreak(history,customEx);
  const prs=latest?buildWorkoutRecap(latest,history.slice(0,-1),customEx).prCount:0;
  const balanced=latest?Object.values(getMuscleVolumes(latest,customEx)).filter(v=>v>0).length:0;
  return [
    {
      id:"volume",
      title:"40k Volume Run",
      detail:"Hit 40,000 lbs in a logged week.",
      progress:Math.min(100,Math.round((total/40000)*100)),
      stat:`${total.toLocaleString()} / 40,000 lbs`,
      color:"#7C6FFF",
    },
    {
      id:"streak",
      title:"4 Week Consistency",
      detail:"Build a 4-week progression streak.",
      progress:Math.min(100,Math.round((streak/4)*100)),
      stat:`${streak} / 4 weeks`,
      color:"#FFB347",
    },
    {
      id:"prs",
      title:"PR Hunter",
      detail:"Score 3 volume PRs in one week.",
      progress:Math.min(100,Math.round((prs/3)*100)),
      stat:`${prs} / 3 PRs`,
      color:"#2DD4A0",
    },
    {
      id:"balanced",
      title:"Balanced Builder",
      detail:"Train all 5 muscle groups in a week.",
      progress:Math.min(100,Math.round((balanced/5)*100)),
      stat:`${balanced} / 5 groups`,
      color:"#38BFFF",
    },
    {
      id:"best",
      title:"All-Time Peak",
      detail:"Beat your best total-volume week.",
      progress:best&&total?Math.min(100,Math.round((total/best)*100)):0,
      stat:best?`${best.toLocaleString()} lbs best`:"No best yet",
      color:"#FF5C87",
    },
  ];
}

function createChallengeCard({id,title,category,detail,current,target,unit="",color,reward}){
  const safeTarget=Math.max(1,Math.round(target||1));
  const safeCurrent=Math.max(0,Math.round(current||0));
  const progress=Math.min(100,Math.round((safeCurrent/safeTarget)*100));
  const remaining=Math.max(0,safeTarget-safeCurrent);
  const format=value=>unit==="lbs"?`${value.toLocaleString()} lbs`:unit?`${value.toLocaleString()} ${unit}`:value.toLocaleString();
  return {
    id,title,category,detail,current:safeCurrent,target:safeTarget,unit,color,reward,
    progress,completed:progress>=100,
    stat:`${format(safeCurrent)} / ${format(safeTarget)}`,
    remainingLabel:remaining?format(remaining):"Complete",
  };
}

function buildChallengeHub(history,customEx={}){
  const latest=history[history.length-1];
  const previous=history.slice(0,-1);
  const total=latest?getTotalVol(latest,customEx):0;
  const best=history.length?Math.max(...history.map(entry=>getTotalVol(entry,customEx))):0;
  const previousBest=previous.length?Math.max(...previous.map(entry=>getTotalVol(entry,customEx))):0;
  const streak=history.length?calcStreak(history,customEx):0;
  const recap=latest?buildWorkoutRecap(latest,previous,customEx):null;
  const prs=recap?.prCount||0;
  const muscleVolumes=latest?getMuscleVolumes(latest,customEx):{};
  const trainedGroups=Object.values(muscleVolumes).filter(value=>value>0).length;
  const quality=history.length?getTrainingQuality(history,history.length-1,customEx):null;
  const latestRpe=Number(latest?.rpe)||0;
  const latestRating=Number(latest?.rating)||0;
  const recoveryCurrent=latest?.deload?1:(quality?.score>=76&&latestRpe>0&&latestRpe<=7&&latestRating>=4?1:0);
  const dynamicVolumeTarget=Math.max(40000,Math.ceil((Math.max(best,total,38000)*1.05)/1000)*1000);
  const peakTarget=previousBest?previousBest+1:Math.max(1,dynamicVolumeTarget);
  const streakTarget=streak>=8?12:streak>=4?8:4;

  const challengeCards=[
    createChallengeCard({
      id:"volume_surge",
      title:"Volume Surge",
      category:"Weekly Quest",
      detail:"Push this week above your current volume ceiling.",
      current:total,
      target:dynamicVolumeTarget,
      unit:"lbs",
      color:"#7C6FFF",
      reward:"+18 challenge score",
    }),
    createChallengeCard({
      id:"peak_breaker",
      title:"Peak Breaker",
      category:"Personal Record",
      detail:"Beat your best previous weekly total.",
      current:total,
      target:peakTarget,
      unit:"lbs",
      color:"#FF5C87",
      reward:"+22 challenge score",
    }),
    createChallengeCard({
      id:"consistency_chain",
      title:"Consistency Chain",
      category:"Streak",
      detail:"Keep progression alive with volume growth or recovery weeks.",
      current:streak,
      target:streakTarget,
      unit:"weeks",
      color:"#FFB347",
      reward:"+16 challenge score",
    }),
    createChallengeCard({
      id:"pr_hunter",
      title:"PR Hunter",
      category:"Strength",
      detail:"Stack three volume PRs in one logged week.",
      current:prs,
      target:3,
      unit:"PRs",
      color:"#2DD4A0",
      reward:"+15 challenge score",
    }),
    createChallengeCard({
      id:"balanced_builder",
      title:"Balanced Builder",
      category:"Muscle Balance",
      detail:"Train all five tracked muscle groups this week.",
      current:trainedGroups,
      target:5,
      unit:"groups",
      color:"#38BFFF",
      reward:"+14 challenge score",
    }),
    createChallengeCard({
      id:"quality_week",
      title:"Quality Week",
      category:"Training Quality",
      detail:"Hit an A-level week with strong load, recovery, and progression.",
      current:quality?.score||0,
      target:82,
      unit:"score",
      color:"#2DD4A0",
      reward:"+20 challenge score",
    }),
    createChallengeCard({
      id:"recovery_pro",
      title:"Recovery Pro",
      category:"Smart Recovery",
      detail:"Log a deload, or finish a high-quality week without overreaching.",
      current:recoveryCurrent,
      target:1,
      unit:"check",
      color:"#38BFFF",
      reward:"+12 challenge score",
    }),
  ];
  const completedCount=challengeCards.filter(card=>card.completed).length;
  const incomplete=challengeCards.filter(card=>!card.completed).sort((a,b)=>b.progress-a.progress||a.target-b.target);
  const complete=challengeCards.filter(card=>card.completed).sort((a,b)=>b.progress-a.progress);
  const spotlightChallenge=incomplete[0]||complete[0]||challengeCards[0]||null;
  const avgProgress=challengeCards.length
    ? challengeCards.reduce((sum,card)=>sum+card.progress,0)/challengeCards.length
    : 0;
  const challengeScore=Math.round(clamp(completedCount*14+avgProgress*0.42+(quality?.score||0)*0.32,0,150));
  const weeklyQuest=spotlightChallenge
    ? spotlightChallenge.completed
      ?`Keep the streak alive. ${spotlightChallenge.title} is already complete.`
      :`Chase ${spotlightChallenge.title}: ${spotlightChallenge.remainingLabel} left.`
    :"Log a workout to unlock your first weekly quest.";

  return {
    challengeCards,
    completedCount,
    spotlightChallenge,
    challengeScore,
    weeklyQuest,
  };
}

function buildWeeklyCompetition(history,customEx={}){
  if(!history.length) return {rows:[],current:null,best:null,toBeat:0};
  const maxVolume=Math.max(1,...history.map(entry=>getTotalVol(entry,customEx)));
  const rows=history.map((entry,index)=>{
    const total=getTotalVol(entry,customEx);
    const quality=getTrainingQuality(history,index,customEx);
    const prCount=getWeekPRCount(entry,history.slice(0,index),customEx);
    const trainedGroups=Object.values(getMuscleVolumes(entry,customEx)).filter(v=>v>0).length;
    const volumeScore=(total/maxVolume)*100;
    const score=Math.round(clamp(
      (quality?.score||0)*0.46+
      volumeScore*0.24+
      prCount*7+
      trainedGroups*4+
      (entry.deload?4:0),
      0,
      140
    ));
    const badge=score>=110?"Elite":score>=92?"Contender":score>=76?"Locked In":score>=58?"Building":"Starter";
    return {
      entry,index,total,quality,prCount,trainedGroups,score,badge,
      color:score>=110?"#FFB347":score>=92?"#2DD4A0":score>=76?"#38BFFF":score>=58?"#7C6FFF":"#FF5C87",
    };
  }).sort((a,b)=>b.score-a.score||b.total-a.total);
  const ranked=rows.map((row,rank)=>({...row,rank:rank+1}));
  const current=ranked.find(row=>row.index===history.length-1)||null;
  const best=ranked[0]||null;
  const nextTarget=ranked.find(row=>row.rank<current?.rank) || best;
  const toBeat=current&&nextTarget&&current.index!==nextTarget.index
    ? Math.max(0,(nextTarget.score-current.score)+1)
    : 0;
  return {rows:ranked,current,best,toBeat};
}

function buildPublicWorkoutRows(userId,history,customEx={}){
  const competition=buildWeeklyCompetition(history,customEx);
  return history.map((entry,index)=>{
    const recap=buildWorkoutRecap(entry,history.slice(0,index),customEx);
    const boardRow=competition.rows.find(row=>row.index===index);
    const topLift=recap.bestLift;
    return {
      user_id:userId,
      week:entry.week,
      workout_date:entry.date||null,
      total_volume:recap.total,
      pr_count:recap.prCount,
      set_count:recap.setCount,
      trained_muscles:recap.trainedMuscles.map(group=>group.label),
      top_lift_name:topLift?.ex?.name||null,
      top_lift_volume:topLift?.volume||0,
      leaderboard_score:boardRow?.score||0,
      leaderboard_badge:boardRow?.badge||"Starter",
      summary:topLift
        ?`Best lift: ${topLift.ex.name} for ${topLift.volume.toLocaleString()} lbs volume.`
        :"Workout logged.",
      updated_at:new Date().toISOString(),
    };
  });
}

function emptyPublicSocialGraph(){
  return {
    followingIds:new Set(),
    followerCounts:{},
    followingCounts:{},
    postCounts:{},
    latestPostByUser:{},
  };
}

function buildPublicSocialGraph(user,posts=[],profiles=[],follows=[]){
  const followingIds=new Set(
    follows.filter(row=>row.follower_id===user.id).map(row=>row.following_id)
  );
  const followerCounts={};
  const followingCounts={};
  for(const row of follows){
    followerCounts[row.following_id]=(followerCounts[row.following_id]||0)+1;
    followingCounts[row.follower_id]=(followingCounts[row.follower_id]||0)+1;
  }
  const postCounts={};
  const latestPostByUser={};
  for(const post of posts){
    postCounts[post.user_id]=(postCounts[post.user_id]||0)+1;
    if(!latestPostByUser[post.user_id]||Number(post.week||0)>Number(latestPostByUser[post.user_id]?.week||0)){
      latestPostByUser[post.user_id]=post;
    }
  }
  return {followingIds,followerCounts,followingCounts,postCounts,latestPostByUser};
}

function buildCommunityLeaderboard(publicPosts=[],publicProfiles=[],currentUserId){
  const profileByUser=Object.fromEntries((publicProfiles||[]).map(profile=>[profile.user_id,profile]));
  const topByUser={};
  for(const post of publicPosts||[]){
    if(!post?.user_id) continue;
    const existing=topByUser[post.user_id];
    const score=Number(post.leaderboard_score||0);
    const total=Number(post.total_volume||0);
    const prCount=Number(post.pr_count||0);
    const week=Number(post.week||0);
    const existingScore=Number(existing?.leaderboard_score||0);
    const existingTotal=Number(existing?.total_volume||0);
    const existingPrs=Number(existing?.pr_count||0);
    const existingWeek=Number(existing?.week||0);
    if(!existing||score>existingScore||
      (score===existingScore&&total>existingTotal)||
      (score===existingScore&&total===existingTotal&&prCount>existingPrs)||
      (score===existingScore&&total===existingTotal&&prCount===existingPrs&&week>existingWeek)){
      topByUser[post.user_id]={
        ...post,
        public_profiles:post.public_profiles||profileByUser[post.user_id]||{},
      };
    }
  }
  const rows=Object.values(topByUser)
    .sort((a,b)=>
      Number(b.leaderboard_score||0)-Number(a.leaderboard_score||0)||
      Number(b.total_volume||0)-Number(a.total_volume||0)||
      Number(b.pr_count||0)-Number(a.pr_count||0)||
      Number(b.week||0)-Number(a.week||0)
    )
    .map((post,index)=>{
      const color=index===0?"#FFB347":index===1?"#38BFFF":index===2?"#7C6FFF":"#2DD4A0";
      return {
        ...post,
        rank:index+1,
        profile:post.public_profiles||profileByUser[post.user_id]||{},
        score:Number(post.leaderboard_score||0),
        totalVolume:Number(post.total_volume||0),
        prCount:Number(post.pr_count||0),
        color,
        isCurrentUser:post.user_id===currentUserId,
      };
    });
  const currentUserRank=rows.find(row=>row.user_id===currentUserId)||null;
  const bestScore=rows[0]?.score||0;
  const topVolume=rows.reduce((best,row)=>Math.max(best,row.totalVolume),0);
  return {
    topByUser,
    rows,
    podium:rows.slice(0,3),
    currentUserRank,
    bestScore,
    topVolume,
    activeLifters:rows.length,
  };
}

const PUBLIC_REACTIONS = [
  {id:"strong",label:"Strong",color:"#2DD4A0"},
  {id:"pr",label:"PR",color:"#FFB347"},
  {id:"respect",label:"Respect",color:"#7C6FFF"},
  {id:"motivation",label:"Motivation",color:"#38BFFF"},
];

function emptyPublicEngagement(){
  return {
    reactionCounts:{},
    myReactions:{},
    commentsByPost:{},
    commentCounts:{},
    notifications:[],
    unreadCount:0,
  };
}

function buildPublicEngagement(user,posts=[],comments=[],reactions=[],notifications=[]){
  const postIds=new Set(posts.map(post=>post.id));
  const reactionCounts={};
  const myReactions={};
  for(const reaction of reactions.filter(row=>postIds.has(row.post_id))){
    reactionCounts[reaction.post_id] ||= {};
    reactionCounts[reaction.post_id][reaction.reaction]=(reactionCounts[reaction.post_id][reaction.reaction]||0)+1;
    if(reaction.user_id===user.id) myReactions[reaction.post_id]=reaction.reaction;
  }
  const commentsByPost={};
  const commentCounts={};
  for(const comment of comments.filter(row=>postIds.has(row.post_id))){
    commentsByPost[comment.post_id] ||= [];
    commentsByPost[comment.post_id].push(comment);
    commentCounts[comment.post_id]=(commentCounts[comment.post_id]||0)+1;
  }
  for(const postId of Object.keys(commentsByPost)){
    commentsByPost[postId].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  }
  const sortedNotifications=[...(notifications||[])]
    .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  return {
    reactionCounts,
    myReactions,
    commentsByPost,
    commentCounts,
    notifications:sortedNotifications,
    unreadCount:sortedNotifications.filter(item=>!item.read_at).length,
  };
}

function isMissingPublicSchemaError(error){
  const text=`${error?.code||""} ${error?.message||""} ${error?.details||""}`.toLowerCase();
  return /public_profiles|public_workout_posts|public_post_likes|public_follows|public_post_comments|public_post_reactions|public_notifications|schema cache|does not exist|could not find/.test(text)
    || ["42p01","pgrst200","pgrst205","pgrst204"].includes(String(error?.code||"").toLowerCase());
}

function getAllTimePRs(history,customEx={}){
  const prs={};
  for(const dk of DAY_KEYS){
    for(const ex of exerciseCatalogForDay(dk,customEx)){
      let bestVol=-Infinity,bestW=-Infinity,bestR=-Infinity,best1RM=-Infinity;
      let bestVolDate="",bestWDate="",best1RMDate="";
      for(const entry of history){
        const d=entry.exercises[ex.id];
        if(!d) continue;
        if(d.volume>bestVol){bestVol=d.volume;bestVolDate=entry.date||`W${entry.week}`;}
        if(d.w>bestW){bestW=d.w;bestWDate=entry.date||`W${entry.week}`;}
        if(d.r>bestR) bestR=d.r;
        const rm=epley1RM(d.w,d.r);
        if(rm>best1RM){best1RM=rm;best1RMDate=entry.date||`W${entry.week}`;}
      }
      if(bestVol>-Infinity) prs[ex.id]={ex,dk,bestVol,bestW,bestR,best1RM,bestVolDate,bestWDate,best1RMDate};
    }
  }
  return prs;
}

// ─── Storage helpers: retry-with-backoff, never guess on failure ─────────────
const sleep=ms=>new Promise(res=>setTimeout(res,ms));

async function listWithRetry(attempts=3){
  let lastErr;
  for(let i=0;i<attempts;i++){
    try{
      const result=await window.storage.list();
      if(!activeAccountName) return result;
      const prefix=accountPrefix();
      const keys=(result?.keys||[])
        .map(k=>typeof k==="string"?k:(k?.key??""))
        .filter(Boolean);
      const scoped=keys
        .filter(k=>k.startsWith(prefix))
        .map(k=>k.slice(prefix.length));
      const globalFallback=activeAccountName==="danatel"
        ? keys.filter(k=>[LIFT_DATA_KEY,DRAFT_KEY,LEGACY_STORAGE_KEY,LEGACY_GOALS_KEY,LEGACY_CUSTOM_EX_KEY].includes(k))
        : [];
      return {keys:[...new Set([...scoped,...globalFallback])]};
    }
    catch(e){ lastErr=e; if(i<attempts-1) await sleep(350*(i+1)); }
  }
  throw lastErr;
}
async function getWithRetry(key,attempts=3){
  let lastErr;
  for(let i=0;i<attempts;i++){
    try{
      const scoped=activeAccountName?accountStorageKey(key):key;
      const r=await window.storage.get(scoped);
      if(r?.value!=null) return {key,value:r.value};
      if(activeAccountName==="danatel"){
        const legacy=await window.storage.get(key);
        if(legacy?.value!=null) return legacy;
      }
      return r;
    }
    catch(e){ lastErr=e; if(i<attempts-1) await sleep(350*(i+1)); }
  }
  throw lastErr;
}
async function setWithRetry(key,value,attempts=3){
  let lastErr;
  for(let i=0;i<attempts;i++){
    try{
      const r=await window.storage.set(activeAccountName?accountStorageKey(key):key,value);
      if(!r) throw new Error("Storage set returned no result");
      return r;
    }catch(e){ lastErr=e; if(i<attempts-1) await sleep(350*(i+1)); }
  }
  throw lastErr;
}
async function deleteWithRetry(key,attempts=2){
  let lastErr;
  for(let i=0;i<attempts;i++){
    try{ return await window.storage.delete(activeAccountName?accountStorageKey(key):key); }
    catch(e){ lastErr=e; if(i<attempts-1) await sleep(250*(i+1)); }
  }
  throw lastErr;
}
function extractKeyNames(listResult){
  const raw=listResult?.keys||[];
  return new Set(raw.map(k=>typeof k==="string"?k:(k?.key??"")));
}

// Resolves the app's starting data under one rule: never fall back to a
// blank baseline unless window.storage.list() has POSITIVELY CONFIRMED
// nothing is saved anywhere — neither the current key nor the older
// per-field keys from before storage was consolidated. Any connectivity
// hiccup throws instead of silently producing an empty dataset, so a flaky
// connection can never again result in real history being saved over.
async function loadInitialData(){
  const listResult=await listWithRetry(3);
  const present=extractKeyNames(listResult);

  if(present.has(LIFT_DATA_KEY)){
    const r=await getWithRetry(LIFT_DATA_KEY,3);
    const parsed=r?.value?JSON.parse(r.value):{};
    return{
      history:Array.isArray(parsed.history)&&parsed.history.length?parsed.history:[buildBaseline(parsed.customEx||{})],
      goals:parsed.goals||{},
      customEx:parsed.customEx||{},
      preferences:normalizePreferences(parsed.preferences),
    };
  }

  // Nothing under the current key — check the old, pre-consolidation keys
  // before assuming this is a first-ever run.
  let legacyHistory=null,legacyGoals={},legacyCustomEx={};
  if(present.has(LEGACY_STORAGE_KEY)){
    const r=await getWithRetry(LEGACY_STORAGE_KEY,3);
    if(r?.value) legacyHistory=JSON.parse(r.value);
  }
  if(present.has(LEGACY_GOALS_KEY)){
    const r=await getWithRetry(LEGACY_GOALS_KEY,3);
    if(r?.value) legacyGoals=JSON.parse(r.value);
  }
  if(present.has(LEGACY_CUSTOM_EX_KEY)){
    const r=await getWithRetry(LEGACY_CUSTOM_EX_KEY,3);
    if(r?.value) legacyCustomEx=JSON.parse(r.value);
  }

  const resolved={
    history:legacyHistory&&legacyHistory.length?legacyHistory:[buildBaseline(legacyCustomEx)],
    goals:legacyGoals,
    customEx:legacyCustomEx,
    preferences:normalizePreferences({}),
  };

  // Best-effort write into the new consolidated key so migration only has to
  // happen once. If this particular write fails, it simply retries next
  // launch — the resolved data above is still used for this session.
  try{ await setWithRetry(LIFT_DATA_KEY,JSON.stringify(resolved),2); }catch{}

  return resolved;
}

function normalizeAppData(raw){
  const parsed=raw&&typeof raw==="object"?raw:{};
  const custom=parsed.customEx||{};
  return{
    history:Array.isArray(parsed.history)?parsed.history:[],
    goals:parsed.goals||{},
    customEx:custom,
    preferences:normalizePreferences(parsed.preferences),
  };
}

function isGeneratedBaselineEntry(entry,customEx={}){
  if(!entry?.exercises) return false;
  const baseline=buildBaseline(customEx);
  const entryIds=Object.keys(entry?.exercises||{}).sort();
  const baselineIds=Object.keys(baseline.exercises).sort();
  if(entryIds.length!==baselineIds.length) return false;
  return baselineIds.every((id,i)=>{
    if(entryIds[i]!==id) return false;
    const a=entry.exercises[id];
    const b=baseline.exercises[id];
    return a?.volume===b.volume&&a?.w===b.w&&a?.r===b.r&&a?.s===b.s;
  });
}
function removeGeneratedBaselineStart(history,customEx={}){
  if(!Array.isArray(history)||!history.length) return {history:[],removed:false};
  if(!isGeneratedBaselineEntry(history[0],customEx)) return {history,removed:false};
  return{
    history:history.slice(1).map((entry,index)=>({...entry,week:index+1})),
    removed:true,
  };
}

async function saveCloudData(user,nextHistory,nextGoals,nextCustomEx,nextPreferences=normalizePreferences({})){
  const {error}=await supabase.from("lift_tracker_data").upsert({
    user_id:user.id,
    data:{history:nextHistory,goals:nextGoals,customEx:nextCustomEx,preferences:nextPreferences},
    updated_at:new Date().toISOString(),
  });
  if(error) throw error;
}

async function saveCloudDraft(user,draftData){
  const {error}=await supabase.from("lift_tracker_data").upsert({
    user_id:user.id,
    draft:draftData,
    updated_at:new Date().toISOString(),
  });
  if(error) throw error;
}

async function clearCloudDraft(user){
  const {error}=await supabase.from("lift_tracker_data")
    .update({draft:null,updated_at:new Date().toISOString()})
    .eq("user_id",user.id);
  if(error) throw error;
}

export async function loadPersistedCoachSwapContext(client,userId){
  const settingsQuery=client.from("coach_settings")
    .select("settings")
    .eq("user_id",userId)
    .maybeSingle();
  const exclusionsQuery=client.from("coach_data_exclusions")
    .select("target_type,target_key,selector")
    .eq("user_id",userId);
  const [settingsResult,exclusionsResult]=await Promise.all([settingsQuery,exclusionsQuery]);
  if(settingsResult.error) throw settingsResult.error;
  if(exclusionsResult.error) throw exclusionsResult.error;
  return{
    settings:settingsResult.data?.settings||null,
    exclusions:Array.isArray(exclusionsResult.data)?exclusionsResult.data:[],
  };
}

async function getOrCreatePublicProfile(user,username){
  const {data,error}=await supabase.from("public_profiles")
    .select("user_id,username,display_name,share_enabled,updated_at")
    .eq("user_id",user.id)
    .maybeSingle();
  if(error) throw error;
  if(data) return data;

  const {data:created,error:createError}=await supabase.from("public_profiles")
    .insert({
      user_id:user.id,
      username,
      display_name:username,
      share_enabled:false,
    })
    .select("user_id,username,display_name,share_enabled,updated_at")
    .single();
  if(createError) throw createError;
  return created;
}

async function savePublicProfile(user,username,shareEnabled){
  const {data,error}=await supabase.from("public_profiles")
    .upsert({
      user_id:user.id,
      username,
      display_name:username,
      share_enabled:shareEnabled,
      updated_at:new Date().toISOString(),
    },{onConflict:"user_id"})
    .select("user_id,username,display_name,share_enabled,updated_at")
    .single();
  if(error) throw error;
  return data;
}

async function syncPublicWorkoutPosts(user,history,customEx={}){
  const rows=buildPublicWorkoutRows(user.id,history,customEx);
  if(!rows.length){
    const {error}=await supabase.from("public_workout_posts")
      .delete()
      .eq("user_id",user.id);
    if(error) throw error;
    return;
  }

  const activeWeeks=rows.map(row=>row.week).join(",");
  const {error:deleteError}=await supabase.from("public_workout_posts")
    .delete()
    .eq("user_id",user.id)
    .not("week","in",`(${activeWeeks})`);
  if(deleteError) throw deleteError;

  const {error}=await supabase.from("public_workout_posts")
    .upsert(rows,{onConflict:"user_id,week"});
  if(error) throw error;
}

async function clearPublicWorkoutPosts(user){
  const {error}=await supabase.from("public_workout_posts")
    .delete()
    .eq("user_id",user.id);
  if(error) throw error;
}

async function loadPublicCommunity(user){
  const {data:posts,error}=await supabase.from("public_workout_posts")
    .select(`
      id,user_id,week,workout_date,total_volume,pr_count,set_count,
      trained_muscles,top_lift_name,top_lift_volume,leaderboard_score,
      leaderboard_badge,summary,created_at,updated_at,
      public_profiles(username,display_name,share_enabled)
    `)
    .order("leaderboard_score",{ascending:false})
    .order("total_volume",{ascending:false})
    .limit(40);
  if(error) throw error;

  const ids=(posts||[]).map(post=>post.id);
  const likes={counts:{},mine:{}};
  if(ids.length){
    const {data:likeRows,error:likesError}=await supabase.from("public_post_likes")
      .select("post_id,user_id")
      .in("post_id",ids);
    if(likesError) throw likesError;
    for(const like of likeRows||[]){
      likes.counts[like.post_id]=(likes.counts[like.post_id]||0)+1;
      if(like.user_id===user.id) likes.mine[like.post_id]=true;
    }
  }

  const {data:profiles,error:profilesError}=await supabase.from("public_profiles")
    .select("user_id,username,display_name,share_enabled,updated_at")
    .eq("share_enabled",true)
    .order("updated_at",{ascending:false})
    .limit(50);
  if(profilesError) throw profilesError;

  const {data:follows,error:followsError}=await supabase.from("public_follows")
    .select("follower_id,following_id,created_at");
  if(followsError) throw followsError;

  const {data:comments,error:commentsError}=ids.length
    ? await supabase.from("public_post_comments")
      .select("id,post_id,user_id,body,created_at,updated_at")
      .in("post_id",ids)
      .order("created_at",{ascending:true})
    : {data:[],error:null};
  if(commentsError) throw commentsError;

  const {data:reactions,error:reactionsError}=ids.length
    ? await supabase.from("public_post_reactions")
      .select("post_id,user_id,reaction,created_at")
      .in("post_id",ids)
    : {data:[],error:null};
  if(reactionsError) throw reactionsError;

  const {data:notifications,error:notificationsError}=await supabase.from("public_notifications")
    .select("id,user_id,actor_id,type,post_id,comment_id,created_at,read_at")
    .eq("user_id",user.id)
    .order("created_at",{ascending:false})
    .limit(30);
  if(notificationsError) throw notificationsError;

  const socialGraph=buildPublicSocialGraph(user,posts||[],profiles||[],follows||[]);
  const engagement=buildPublicEngagement(user,posts||[],comments||[],reactions||[],notifications||[]);
  return {
    posts:posts||[],
    likes,
    profiles:profiles||[],
    follows:follows||[],
    socialGraph,
    engagement,
  };
}

async function togglePublicFollow(user,followingId,isFollowing){
  if(!user?.id||!followingId||user.id===followingId) return;
  if(isFollowing){
    const {error}=await supabase.from("public_follows")
      .delete()
      .eq("follower_id",user.id)
      .eq("following_id",followingId);
    if(error) throw error;
    return;
  }
  const {error}=await supabase.from("public_follows")
    .insert({follower_id:user.id,following_id:followingId});
  if(error&&error.code!=="23505") throw error;
}

async function createPublicNotification({userId,actorId,type,postId=null,commentId=null}){
  if(!userId||!actorId||userId===actorId) return;
  const {error}=await supabase.from("public_notifications").insert({
    user_id:userId,
    actor_id:actorId,
    type,
    post_id:postId,
    comment_id:commentId,
  });
  if(error) console.error(error);
}

async function togglePublicReaction(user,post,selectedReaction,currentReaction){
  if(!user?.id||!post?.id||!selectedReaction) return;
  if(currentReaction===selectedReaction){
    const {error}=await supabase.from("public_post_reactions")
      .delete()
      .eq("post_id",post.id)
      .eq("user_id",user.id);
    if(error) throw error;
    return;
  }
  const {error}=await supabase.from("public_post_reactions")
    .upsert({
      post_id:post.id,
      user_id:user.id,
      reaction:selectedReaction,
      created_at:new Date().toISOString(),
    },{onConflict:"post_id,user_id"});
  if(error) throw error;
  await createPublicNotification({
    userId:post.user_id,
    actorId:user.id,
    type:"reaction",
    postId:post.id,
  });
}

async function addPublicComment(user,post,body){
  const trimmed=String(body||"").trim();
  if(!user?.id||!post?.id||!trimmed) return null;
  if(trimmed.length>240) throw new Error("Comment must be 240 characters or less.");
  const {data,error}=await supabase.from("public_post_comments")
    .insert({post_id:post.id,user_id:user.id,body:trimmed})
    .select("id,post_id,user_id,body,created_at,updated_at")
    .single();
  if(error) throw error;
  await createPublicNotification({
    userId:post.user_id,
    actorId:user.id,
    type:"comment",
    postId:post.id,
    commentId:data.id,
  });
  return data;
}

async function markPublicNotificationsRead(user){
  if(!user?.id) return;
  const {error}=await supabase.from("public_notifications")
    .update({read_at:new Date().toISOString()})
    .eq("user_id",user.id)
    .is("read_at",null);
  if(error) throw error;
}

async function loadCloudInitialData(user,username){
  const {data,error}=await supabase.from("lift_tracker_data")
    .select("data,draft")
    .eq("user_id",user.id)
    .maybeSingle();
  if(error) throw error;
  if(data){
    const cloudData=normalizeAppData(data.data);
    if(username!=="danatel"){
      const cleaned=removeGeneratedBaselineStart(cloudData.history,cloudData.customEx);
      if(cleaned.removed){
        await saveCloudData(user,cleaned.history,cloudData.goals,cloudData.customEx,cloudData.preferences);
        return{...cloudData,history:cleaned.history,draft:data.draft||null};
      }
    }
    return{...cloudData,draft:data.draft||null};
  }

  if(username==="danatel"){
    activeAccountName=username;
    await migrateGlobalDataToAccount(username);
    const localData=await loadInitialData();
    let localDraft=null;
    try{
      const d=await getWithRetry(DRAFT_KEY,2);
      localDraft=d?.value?JSON.parse(d.value):null;
    }catch{}
    await saveCloudData(user,localData.history,localData.goals,localData.customEx,localData.preferences);
    if(localDraft) await saveCloudDraft(user,localDraft);
    return{...localData,draft:localDraft};
  }

  const freshData={history:[],goals:{},customEx:{},preferences:normalizePreferences({})};
  await saveCloudData(user,freshData.history,freshData.goals,freshData.customEx,freshData.preferences);
  return{...freshData,draft:null};
}

// ─── Confetti burst ───────────────────────────────────────────────────────────
function Confetti({active}){
  const canvasRef=useRef(null);
  useEffect(()=>{
    if(!active) return;
    const canvas=canvasRef.current;
    if(!canvas) return;
    const ctx=canvas.getContext("2d");
    canvas.width=canvas.offsetWidth;
    canvas.height=canvas.offsetHeight;
    const pieces=Array.from({length:80},()=>({
      x:Math.random()*canvas.width,
      y:-10-Math.random()*40,
      r:3+Math.random()*4,
      d:Math.random()*80+40,
      color:["#7C6FFF","#FF5C87","#2DD4A0","#FFB347","#38BFFF"][Math.floor(Math.random()*5)],
      tilt:Math.random()*10-10,
      tiltAngle:0,
      tiltAngleInc:0.07+Math.random()*0.05,
    }));
    let frame=0;
    const draw=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pieces.forEach(p=>{
        p.tiltAngle+=p.tiltAngleInc;
        p.y+=Math.cos(frame*0.01+p.d)+1.2;
        p.x+=Math.sin(frame*0.01);
        p.tilt=Math.sin(p.tiltAngle)*15;
        ctx.beginPath();
        ctx.lineWidth=p.r;
        ctx.strokeStyle=p.color;
        ctx.moveTo(p.x+p.tilt+p.r/3,p.y);
        ctx.lineTo(p.x+p.tilt,p.y+p.tilt+p.r/5);
        ctx.stroke();
      });
      frame++;
      if(frame<180) requestAnimationFrame(draw);
      else ctx.clearRect(0,0,canvas.width,canvas.height);
    };
    requestAnimationFrame(draw);
  },[active]);
  if(!active) return null;
  return <canvas ref={canvasRef} style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:999}}/>;
}

// ─── Animated number ──────────────────────────────────────────────────────────
function AnimatedNumber({value,duration=700}){
  const [display,setDisplay]=useState(0);
  const raf=useRef(null);
  useEffect(()=>{
    const start=Date.now(),from=display,to=value;
    const tick=()=>{
      const p=Math.min((Date.now()-start)/duration,1);
      const e=1-Math.pow(1-p,3);
      setDisplay(Math.round(from+(to-from)*e));
      if(p<1) raf.current=requestAnimationFrame(tick);
    };
    raf.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(raf.current);
  },[value]);
  return <>{display.toLocaleString()}</>;
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const CustomTooltip=({active,payload,label})=>{
  if(!active||!payload?.length) return null;
  return(
    <div style={{background:"#0a0d0c",border:"1px solid #3a4640",borderRadius:5,
      padding:"10px 14px",fontSize:12,boxShadow:"0 8px 32px rgba(0,0,0,0.7)"}}>
      <p style={{margin:"0 0 6px",fontWeight:800,color:"#fff",fontSize:13}}>{label}</p>
      {payload.map(p=>(
        <p key={p.name} style={{margin:"2px 0",color:p.stroke||p.color||"#fff"}}>
          {p.name}: <strong style={{color:"#fff"}}>{p.value!=null?p.value.toLocaleString()+" lbs":"—"}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── PR Badge ─────────────────────────────────────────────────────────────────
const PRBadge=()=>(
  <span style={{background:"linear-gradient(135deg,#FFB347,#FF6584)",color:"#fff",
    fontSize:8,fontWeight:900,padding:"2px 5px",borderRadius:4,
    letterSpacing:"0.1em",verticalAlign:"middle",marginLeft:5}}>PR</span>
);

// ─── Goal progress bar ────────────────────────────────────────────────────────
function GoalBar({current,goal,color}){
  if(!goal) return null;
  const p=Math.min((current/goal)*100,100);
  return(
    <div style={{marginTop:6}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#747e79",marginBottom:3}}>
        <span>Goal: {goal.toLocaleString()} lbs</span>
        <span style={{color:p>=100?"#2DD4A0":color}}>{p.toFixed(0)}%</span>
      </div>
      <div style={{height:4,background:"#1e2722",borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${p}%`,borderRadius:2,
          background:p>=100?"#2DD4A0":color,
          transition:"width 0.6s cubic-bezier(0.4,0,0.2,1)"}}/>
      </div>
    </div>
  );
}

// ─── Sync status pill ─────────────────────────────────────────────────────────
function SyncStatus({status,lastSaved,onRetry}){
  const cfg={
    saving:{color:"#FFB347",label:"Saving…",dot:"#FFB347"},
    saved:{color:"#2DD4A0",label:lastSaved?`Saved ${lastSaved}`:"Saved",dot:"#2DD4A0"},
    error:{color:"#FF5C87",label:"↻ Save failed — tap to retry",dot:"#FF5C87"},
    idle:{color:"#66706b",label:"Ready",dot:"#66706b"},
  }[status]||{color:"#66706b",label:"",dot:"#66706b"};
  const clickable=status==="error";
  return(
    <div onClick={clickable?onRetry:undefined} style={{display:"flex",alignItems:"center",gap:5,
      fontSize:9,color:cfg.color,fontWeight:700,cursor:clickable?"pointer":"default",
      padding:clickable?"3px 7px":"3px 0",borderRadius:clickable?6:0,
      background:clickable?"#2a0a12":"transparent",
      border:clickable?"1px solid #4a1522":"1px solid transparent"}}>
      <span style={{width:6,height:6,borderRadius:"50%",background:cfg.dot,flexShrink:0,
        boxShadow:status==="saving"?`0 0 6px ${cfg.dot}`:"none",
        animation:status==="saving"?"pulse 1s infinite":"none"}}/>
      {cfg.label}
    </div>
  );
}

function ConnectionStatus({isOnline,hasDraft}){
  const label=isOnline?"Online":hasDraft?"Offline Draft":"Offline";
  const color=isOnline?"#2DD4A0":"#FFB347";
  return(
    <div title={isOnline?"Cloud sync is available":"Changes stay in the local draft until connection returns"}
      style={{display:"flex",alignItems:"center",gap:5,fontSize:8,color,fontWeight:900,
        whiteSpace:"nowrap"}}>
      <span style={{width:6,height:6,borderRadius:"50%",background:color,flexShrink:0}}/>
      {label}
    </div>
  );
}

function TrackingModeControl({mode,onChange}){
  const options=[
    {id:TRACKING_MODES.WEEKLY,label:"Weekly",detail:"3 sections per save"},
    {id:TRACKING_MODES.DAILY,label:"Daily",detail:"1 workout per save"},
  ];
  return(
    <div className="earned-tracking-mode" aria-label="Progress tracking mode">
      {options.map(option=>{
        const active=mode===option.id;
        return(
          <button key={option.id} type="button" aria-pressed={mode===option.id}
            onClick={()=>onChange(option.id)}
            className={`earned-tracking-mode__option${active?" earned-tracking-mode__option--active":""}`}>
            <span className="earned-tracking-mode__label">
              {option.label}
            </span>
            <span className="earned-tracking-mode__detail">
              {option.detail}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Summary Strip ────────────────────────────────────────────────────────────
function SummaryStrip({history,weeklyHistory=[],trackingMode,goals,customEx}){
  const isDaily=trackingMode===TRACKING_MODES.DAILY;
  if(!history.length){
    return(
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
        {[
          {label:isDaily?"Latest Session":"This Week",value:"0",unit:"lbs",sub:"No workouts logged yet",color:"#7C6FFF",bg:"linear-gradient(140deg,#1d2923,#0a0d0c)",border:"#3a4640"},
          {label:"Streak",value:"0",unit:isDaily?"days":"wks",sub:"Start with your first log",color:"#FFB347",bg:"linear-gradient(140deg,#1a1208,#0a0d0c)",border:"#2a2215"},
          {label:isDaily?"Best Session":"All-Time Best",value:"0",unit:"lbs",sub:`0 ${isDaily?"days":"weeks"} tracked`,color:"#2DD4A0",bg:"linear-gradient(140deg,#0a1a14,#0a0d0c)",border:"#1a3028"},
          {label:isDaily?"Week To Date":"Predicted W1",value:isDaily?"0":"—",unit:isDaily?"lbs":"",sub:isDaily?"Updates after every daily save":"Log 2+ weeks to predict",color:"#38BFFF",bg:"linear-gradient(140deg,#0a1220,#0a0d0c)",border:"#1a2540"},
        ].map(card=>(
          <div key={card.label} style={{background:card.bg,border:`1px solid ${card.border}`,
            borderRadius:6,padding:"14px 14px"}}>
            <div style={{fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",
              color:card.color,fontWeight:700,marginBottom:4}}>{card.label}</div>
            <div style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:0,lineHeight:1}}>
              {card.value}{card.unit&&<span style={{fontSize:10,fontWeight:400,color:"#87918c",marginLeft:3}}>{card.unit}</span>}
            </div>
            <div style={{fontSize:10,color:"#66706b",marginTop:4,fontWeight:600}}>{card.sub}</div>
          </div>
        ))}
      </div>
    );
  }
  const latest=history[history.length-1];
  const prev=isDaily
    ? [...history.slice(0,-1)].reverse().find(entry=>entry.dayKey===latest.dayKey)||null
    : history.length>1?history[history.length-2]:null;
  const totalNow=getTotalVol(latest,customEx);
  const totalPrev=prev?getTotalVol(prev,customEx):null;
  const diff=totalPrev!=null?totalNow-totalPrev:null;
  const change=pct(totalNow,totalPrev);
  const isDeload=!!latest.deload;
  const comparableHistory=getComparableHistory(history,latest);
  const comparableBestVol=Math.max(0,...comparableHistory.map(e=>getTotalVol(e,customEx)));
  const bestVol=Math.max(0,...history.map(e=>getTotalVol(e,customEx)));
  const isPR=totalNow===comparableBestVol&&comparableHistory.length>1;
  const streak=calcStreak(history,customEx);
  const currentWeek=weeklyHistory[weeklyHistory.length-1]||null;
  const currentWeekTotal=currentWeek?getTotalVol(currentWeek,customEx):0;

  const reg=linearRegression(history.map(e=>getTotalVol(e,customEx)));
  const predicted=reg?reg.predict(history.length+1):null;

  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
      <div style={{background:"linear-gradient(140deg,#1d2923,#0a0d0c)",
        border:"1px solid #3a4640",borderRadius:6,padding:"14px 14px",gridColumn:"1/2"}}>
        <div style={{fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",
          color:"#7C6FFF",fontWeight:700,marginBottom:4}}>{isDaily?"Latest Session":"This Week"}</div>
        <div style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:0,lineHeight:1}}>
          <AnimatedNumber value={totalNow}/>
          <span style={{fontSize:10,fontWeight:400,color:"#87918c",marginLeft:3}}>lbs</span>
          {isPR&&<PRBadge/>}
        </div>
        {diff!=null&&(
          <div style={{fontSize:10,color:isDeload?"#38BFFF":diff>=0?"#2DD4A0":"#FF5C87",marginTop:4,fontWeight:700}}>
            {isDeload?"Recovery":diff>=0?"▲":"▼"} {Math.abs(diff).toLocaleString()} ({change}%)
          </div>
        )}
        {diff==null&&<div style={{fontSize:10,color:"#66706b",marginTop:4}}>{isDaily?DAYS[latest.dayKey]?.shortLabel||"First session":"Baseline entry"}</div>}
        {!isDaily&&<GoalBar current={totalNow} goal={goals?.weeklyVolume} color="#7C6FFF"/>}
      </div>

      <div style={{background:"linear-gradient(140deg,#1a1208,#0a0d0c)",
        border:"1px solid #2a2215",borderRadius:6,padding:"14px 14px"}}>
        <div style={{fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",
          color:"#FFB347",fontWeight:700,marginBottom:4}}>Streak 🔥</div>
        <div style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:0,lineHeight:1}}>
          {streak}<span style={{fontSize:10,fontWeight:400,color:"#87918c",marginLeft:3}}>{isDaily?"days":"wks"}</span>
        </div>
        <div style={{fontSize:10,color:"#5a4020",marginTop:4,fontWeight:600}}>
          {isDeload?"Recovery keeps streak alive":streak>=6?"Unstoppable 🔥":streak>=4?"On fire!":streak>=2?"Building momentum":"Keep going"}
        </div>
      </div>

      <div style={{background:"linear-gradient(140deg,#0a1a14,#0a0d0c)",
        border:"1px solid #1a3028",borderRadius:6,padding:"14px 14px"}}>
        <div style={{fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",
          color:"#2DD4A0",fontWeight:700,marginBottom:4}}>{isDaily?"Best Session":"All-Time Best"}</div>
        <div style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:0,lineHeight:1}}>
          {bestVol.toLocaleString()}<span style={{fontSize:10,fontWeight:400,color:"#87918c",marginLeft:3}}>lbs</span>
        </div>
        <div style={{fontSize:10,color:"#2a4035",marginTop:4,fontWeight:600}}>
          {history.length} {isDaily?"day":"week"}{history.length!==1?"s":""} tracked
        </div>
      </div>

      <div style={{background:"linear-gradient(140deg,#0a1220,#0a0d0c)",
        border:"1px solid #1a2540",borderRadius:6,padding:"14px 14px"}}>
        <div style={{fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",
          color:"#38BFFF",fontWeight:700,marginBottom:4}}>
          {isDaily?"Week To Date":`Predicted W${history.length+1}`}
        </div>
        <div style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:0,lineHeight:1}}>
          {isDaily?<><AnimatedNumber value={currentWeekTotal}/><span style={{fontSize:10,fontWeight:400,color:"#87918c",marginLeft:3}}>lbs</span></>
            :predicted!=null?<>{predicted.toLocaleString()}<span style={{fontSize:10,fontWeight:400,color:"#87918c",marginLeft:3}}>lbs</span></>:"—"}
        </div>
        <div style={{fontSize:10,color:"#1a3050",marginTop:4,fontWeight:600}}>
          {isDaily
            ?`${currentWeek?.sourceIndexes?.length||0} session${(currentWeek?.sourceIndexes?.length||0)===1?"":"s"} this calendar week`
            :predicted!=null&&predicted>totalNow
            ?`+${(predicted-totalNow).toLocaleString()} projected`
            :predicted!=null?"Based on your trend":"Log 2+ weeks to predict"}
        </div>
        {isDaily&&<GoalBar current={currentWeekTotal} goal={goals?.weeklyVolume} color="#38BFFF"/>}
      </div>
    </div>
  );
}

function buildStarterLaunchpad(history,goals={},customEx={}){
  const safeHistory=Array.isArray(history)?history:[];
  const safeGoals=goals&&typeof goals==="object"?goals:{};
  const safeCustomEx=customEx&&typeof customEx==="object"?customEx:{};
  const customExerciseCount=DAY_KEYS.reduce((sum,dk)=>
    sum+(safeCustomEx[dk]||[]).filter(ex=>!ex.removed).length,0);
  const removedCount=DAY_KEYS.reduce((sum,dk)=>
    sum+(safeCustomEx._removed?.[dk]?.length||0)+(safeCustomEx[dk]||[]).filter(ex=>ex.removed).length,0);
  const templateCount=workoutTemplates(safeCustomEx).length;
  const hasRoutineCustomization=customExerciseCount>0||removedCount>0||templateCount>0;
  const items=[
    {
      id:"firstWorkout",
      label:"First Workout",
      complete:safeHistory.length>0,
      detail:safeHistory.length>0
        ?`${safeHistory.length} workout${safeHistory.length===1?"":"s"} logged.`
        :"Log your first session so every dashboard has real data.",
      view:"log",
      action:"Open Log",
      color:"#7C6FFF",
    },
    {
      id:"weeklyGoal",
      label:"Weekly Goal",
      complete:Number(safeGoals.weeklyVolume||0)>0,
      detail:Number(safeGoals.weeklyVolume||0)>0
        ?`${Number(safeGoals.weeklyVolume).toLocaleString()} lbs weekly target saved.`
        :"Set a weekly volume target for forecast and goal tracking.",
      view:"goals",
      action:"Open Goals",
      color:"#2DD4A0",
    },
    {
      id:"bodyweight",
      label:"Bodyweight Entry",
      complete:bodyMetrics(safeCustomEx).length>0,
      detail:bodyMetrics(safeCustomEx).length>0
        ?`${bodyMetrics(safeCustomEx).length} body metric entr${bodyMetrics(safeCustomEx).length===1?"y":"ies"} saved.`
        :"Add bodyweight once to unlock strength-ratio context.",
      view:"goals",
      action:"Open Goals",
      color:"#38BFFF",
    },
    {
      id:"exerciseNotes",
      label:"Exercise Notes",
      complete:Object.keys(exerciseNotes(safeCustomEx)).length>0,
      detail:Object.keys(exerciseNotes(safeCustomEx)).length>0
        ?`${Object.keys(exerciseNotes(safeCustomEx)).length} setup note${Object.keys(exerciseNotes(safeCustomEx)).length===1?"":"s"} saved.`
        :"Save one setup cue so machines and grips are easy to repeat.",
      view:"library",
      action:"Open Library",
      color:"#FFB347",
    },
    {
      id:"routineCustomization",
      label:"Routine Customization",
      complete:hasRoutineCustomization,
      detail:hasRoutineCustomization
        ?`${customExerciseCount+removedCount+templateCount} routine change${customExerciseCount+removedCount+templateCount===1?"":"s"} saved.`
        :"Customize, remove, or template one routine so the app matches your gym.",
      view:"lifts",
      action:"Open Lifts",
      color:"#FF5C87",
    },
  ];
  const completedCount=items.filter(item=>item.complete).length;
  const totalCount=items.length;
  const score=Math.round((completedCount/Math.max(1,totalCount))*100);
  return {
    starterLaunchpad:true,
    score,
    completedCount,
    totalCount,
    items,
    nextItem:items.find(item=>!item.complete)||null,
  };
}

function StarterLaunchpad({history,goals,customEx,onNavigate}){
  const launchpad=buildStarterLaunchpad(history,goals,customEx);
  if(launchpad.completedCount>=launchpad.totalCount) return null;
  const next=launchpad.nextItem;
  return(
    <section className="earned-starter" aria-labelledby="earned-starter-title">
      <div className="earned-starter__header">
        <div>
          <span>STARTER PATH / {launchpad.completedCount} OF {launchpad.totalCount}</span>
          <h2 id="earned-starter-title">Make Earned yours.</h2>
        </div>
        <strong>{launchpad.score}%</strong>
      </div>
      <div className="earned-starter__progress" aria-label={`${launchpad.score}% of account setup complete`}>
        <span style={{width:`${launchpad.score}%`}}/>
      </div>
      {next&&(
        <div className="earned-starter__next">
          <div>
            <span>NEXT BEST STEP</span>
            <h3>{next.label}</h3>
            <p>{next.detail}</p>
          </div>
          <button type="button" onClick={()=>onNavigate?.(next.view)}>
            {next.action}<span aria-hidden="true">→</span>
          </button>
        </div>
      )}
      <div className="earned-starter__steps" aria-label="Account setup steps">
        {launchpad.items.map(item=>(
          <div key={item.id} data-complete={item.complete}>
            <i aria-hidden="true"/>
            <span>{item.label}</span>
            <small>{item.complete?"DONE":"OPEN"}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrainingMomentumCoach({history,customEx,onStartPlan,hasDraft}){
  const momentum=buildTrainingMomentumCoach(history,customEx);
  if(!momentum) return null;
  const next=momentum.nextWorkout;
  const statRows=[
    ["Days Since Last Lift",momentum.daysSinceLastLift,"days",momentum.color],
    ["Momentum Score",momentum.score,"/100",momentum.color],
    ["Last 14 Days",momentum.workoutsLast14,"lifts","#38BFFF"],
    ["Average Gap",momentum.averageGap==null?"--":momentum.averageGap,"days","#FFB347"],
  ];
  return(
    <div style={{background:"linear-gradient(145deg,#101512,#070908)",
      border:"1px solid #35423b",borderRadius:6,padding:"14px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:12}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
            color:momentum.color,fontWeight:900,marginBottom:4}}>Training Momentum Coach</div>
          <div style={{fontSize:11,color:"#87918c",lineHeight:1.45}}>
            Uses your saved workout dates to keep the next lift easy to choose.
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:8,color:momentum.color,fontWeight:950,textTransform:"uppercase",
            letterSpacing:"0.08em",marginBottom:4}}>Status</div>
          <div style={{fontSize:13,color:"#fff",fontWeight:950,whiteSpace:"nowrap"}}>
            {momentum.status}
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:10}}>
        {statRows.map(([label,value,unit,color])=>(
          <div key={label} style={{background:"#070908",border:`1px solid ${color}30`,
            borderRadius:9,padding:"8px 7px",minWidth:0}}>
            <div style={{fontSize:7,color:color,fontWeight:950,textTransform:"uppercase",
              letterSpacing:"0.07em",marginBottom:5,whiteSpace:"nowrap",overflow:"hidden",
              textOverflow:"ellipsis"}}>{label}</div>
            <div style={{fontSize:15,color:"#fff",fontWeight:950,lineHeight:1}}>
              {value}<span style={{fontSize:8,color:"#87918c",marginLeft:3}}>{unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div style={{background:"#070908",border:`1px solid ${(next?.color||momentum.color)}44`,
          borderLeft:`3px solid ${next?.color||momentum.color}`,borderRadius:5,padding:"10px",minWidth:0}}>
          <div style={{fontSize:8,color:next?.color||momentum.color,fontWeight:950,
            textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>Next Best Lift</div>
          <div style={{fontSize:14,color:"#fff",fontWeight:950,whiteSpace:"nowrap",
            overflow:"hidden",textOverflow:"ellipsis"}}>{next?.title||"Log a workout"}</div>
          <div style={{fontSize:10,color:"#98a19c",lineHeight:1.4,marginTop:4}}>
            {next?`${next.dateLabel} - ${next.intensity}`:"Your schedule unlocks after your first saved lift."}
          </div>
          {next?.plan&&(
            <button onClick={()=>onStartPlan?.(next.plan)} disabled={hasDraft}
              style={{marginTop:8,width:"100%",border:"none",borderRadius:8,
                background:hasDraft?"#222b26":`linear-gradient(135deg,${next.color},#2DD4A0)`,
                color:hasDraft?"#87918c":"#071000",fontSize:10,fontWeight:950,
                padding:"8px 9px",cursor:hasDraft?"not-allowed":"pointer"}}>
              {hasDraft?"Finish Draft First":"Start Momentum Plan"}
            </button>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{background:"#070908",border:"1px solid #222b26",
            borderRadius:5,padding:"10px",flex:1}}>
            <div style={{fontSize:8,color:"#2DD4A0",fontWeight:950,textTransform:"uppercase",
              letterSpacing:"0.08em",marginBottom:5}}>Comeback Plan</div>
            <div style={{fontSize:10,color:"#aaa",lineHeight:1.45,fontWeight:800}}>
              {momentum.comebackPlan}
            </div>
          </div>
          <div style={{background:"#070908",border:"1px solid #222b26",
            borderRadius:5,padding:"10px",flex:1}}>
            <div style={{fontSize:8,color:"#FFB347",fontWeight:950,textTransform:"uppercase",
              letterSpacing:"0.08em",marginBottom:5}}>Streak Protection</div>
            <div style={{fontSize:10,color:"#aaa",lineHeight:1.45,fontWeight:800}}>
              {momentum.streakProtection}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Insights Panel ───────────────────────────────────────────────────────────
function InsightsPanel({history,customEx}){
  const insights=buildInsights(history,customEx);
  const [vis,setVis]=useState(true);
  if(!insights.length||!vis) return null;
  return(
    <div style={{background:"#0a0d0c",border:"1px solid #2a312e",
      borderRadius:6,padding:"14px 14px 10px",marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
          color:"#7C6FFF",fontWeight:700}}>✦ Insights</div>
        <button onClick={()=>setVis(false)} style={{background:"none",border:"none",
          color:"#66706b",fontSize:16,cursor:"pointer",lineHeight:1,padding:0}}>×</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {insights.map((ins,i)=>(
          <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",
            padding:"8px 10px",background:"#171e1a",borderRadius:9,borderLeft:`2px solid ${ins.color}`}}>
            <span style={{fontSize:14,lineHeight:1.4,flexShrink:0}}>{ins.icon}</span>
            <p style={{margin:0,fontSize:11,color:"#999",lineHeight:1.5}}>{ins.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────
function VolumeHeatmap({history,customEx}){
  if(history.length<2) return null;
  const isDaily=history[history.length-1]?.periodType===PERIOD_TYPES.DAY;
  const vols=history.map(e=>getTotalVol(e,customEx));
  const maxV=Math.max(...vols),minV=Math.min(...vols);
  return(
    <div style={{background:"#0a0d0c",border:"1px solid #2a312e",
      borderRadius:6,padding:"14px 14px",marginBottom:16}}>
      <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
        color:"#7C6FFF",fontWeight:700,marginBottom:3}}>Volume Heatmap</div>
      <p style={{margin:"0 0 10px",fontSize:10,color:"#66706b"}}>
        Each square = one {isDaily?"workout day":"week"}. Darker = higher volume.
      </p>
      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
        {history.map((entry,i)=>{
          const vol=getTotalVol(entry,customEx);
          const previousComparable=getComparableHistory(history.slice(0,i),entry);
          const previousEntry=previousComparable[previousComparable.length-1]||null;
          const previousVolume=previousEntry?getTotalVol(previousEntry,customEx):null;
          const isGain=previousVolume!==null&&vol>previousVolume;
          const isLoss=previousVolume!==null&&vol<previousVolume;
          const intensity=(vol-minV)/Math.max(1,maxV-minV);
          const bg=isGain?`rgba(45,212,160,${0.15+intensity*0.75})`
            :isLoss?`rgba(255,92,135,${0.15+intensity*0.6})`
            :"#2e3933";
          return(
            <div key={i} title={`${getEntryPeriodLabel(entry,i)}: ${vol.toLocaleString()} lbs`}
              style={{width:26,height:26,borderRadius:5,background:bg,
                border:"1px solid rgba(255,255,255,0.04)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:8,fontWeight:800,color:"rgba(255,255,255,0.35)"}}>
              {i+1}
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:12,marginTop:8}}>
        {[["#2DD4A0","Gain"],["#FF5C87","Drop"],["#2e3933","Baseline"]].map(([c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:9,height:9,borderRadius:2,background:c}}/>
            <span style={{fontSize:9,color:"#66706b"}}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NextWorkoutCoach({history,customEx}){
  const suggestions=buildNextWorkoutSuggestions(history,customEx);
  if(history.length<1) return null;
  return(
    <div style={{background:"#0a0d0c",border:"1px solid #2a312e",
      borderRadius:6,padding:"14px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:8}}>
        <div>
          <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
            color:"#2DD4A0",fontWeight:800}}>Next Workout Coach</div>
          <div style={{fontSize:10,color:"#66706b",marginTop:3}}>Simple overload targets based on your latest logged lifts.</div>
        </div>
        <div style={{fontSize:18}}>🎯</div>
      </div>
      {!suggestions.length?(
        <div style={{background:"#070908",border:"1px solid #1b211f",borderRadius:9,
          padding:"10px 11px",fontSize:11,color:"#98a19c",lineHeight:1.5}}>
          Log one more workout to unlock specific next-lift recommendations.
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {suggestions.map(({ex,dk,action,detail,color})=>(
            <div key={`${dk}_${ex.id}_${action}`} style={{background:"#070908",
              border:`1px solid ${color}33`,borderLeft:`3px solid ${color}`,
              borderRadius:5,padding:"10px 11px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:4}}>
                <div style={{fontSize:12,color:"#fff",fontWeight:900,overflow:"hidden",
                  textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ex.name}</div>
                <div style={{fontSize:9,color:DAYS[dk].accent,fontWeight:900,flexShrink:0}}>
                  {DAYS[dk].shortLabel}
                </div>
              </div>
              <div style={{fontSize:11,color:color,fontWeight:900,marginBottom:3}}>{action}</div>
              <div style={{fontSize:10,color:"#98a19c",lineHeight:1.45}}>{detail}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkoutCalendar({history,customEx}){
  const latestDate=history[history.length-1]?.date||new Date().toISOString().slice(0,10);
  const anchor=new Date(`${latestDate}T12:00:00`);
  const year=anchor.getFullYear(),month=anchor.getMonth();
  const first=new Date(year,month,1);
  const daysInMonth=new Date(year,month+1,0).getDate();
  const blanks=first.getDay();
  const monthEntries=history.map((entry,i)=>({entry,i,date:entry.date?new Date(`${entry.date}T12:00:00`):null}))
    .filter(({date})=>date&&date.getFullYear()===year&&date.getMonth()===month);
  const byDay=monthEntries.reduce((result,{entry,i,date})=>{
    const dayNumber=date.getDate();
    const bucket=result[dayNumber]||{entries:[],indexes:[]};
    bucket.entries.push(entry);
    bucket.indexes.push(i);
    result[dayNumber]=bucket;
    return result;
  },{});
  const monthLabel=anchor.toLocaleDateString(undefined,{month:"long",year:"numeric"});

  return(
    <div style={{background:"#0a0d0c",border:"1px solid #2a312e",borderRadius:6,
      padding:"14px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
        <div>
          <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
            color:"#38BFFF",fontWeight:700,marginBottom:3}}>Workout Calendar</div>
          <div style={{fontSize:14,fontWeight:900,color:"#fff"}}>{monthLabel}</div>
        </div>
        <div style={{fontSize:10,color:"#66706b",fontWeight:700}}>{monthEntries.length} logged</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5,marginBottom:5}}>
        {["S","M","T","W","T","F","S"].map((d,i)=>
          <div key={`${d}${i}`} style={{fontSize:8,color:"#66706b",fontWeight:900,textAlign:"center"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5}}>
        {Array.from({length:blanks}).map((_,i)=><div key={`b${i}`} style={{aspectRatio:"1"}}/>)}
        {Array.from({length:daysInMonth}).map((_,i)=>{
          const dayNum=i+1;
          const hit=byDay[dayNum];
          const entry=hit?combineHistoryEntries(hit.entries,{periodType:PERIOD_TYPES.DAY,date:`${year}-${String(month+1).padStart(2,"0")}-${String(dayNum).padStart(2,"0")}`}):null;
          const vols=entry?DAY_KEYS.map(dk=>({dk,vol:getDayVol(entry,dk,customEx)})).filter(v=>v.vol>0):[];
          const dominant=vols.sort((a,b)=>b.vol-a.vol)[0]?.dk;
          const total=entry?getTotalVol(entry,customEx):0;
          const priorDayTotals=Object.entries(byDay)
            .filter(([key])=>Number(key)<dayNum)
            .map(([,bucket])=>getTotalVol(combineHistoryEntries(bucket.entries),customEx));
          const isPR=entry&&priorDayTotals.length>0&&total>Math.max(...priorDayTotals);
          return(
            <div key={dayNum} title={entry?`${hit.entries.length} workout${hit.entries.length===1?"":"s"}: ${total.toLocaleString()} lbs`:""}
              style={{aspectRatio:"1",borderRadius:7,background:entry?"#171e1a":"#070908",
                border:entry?`1px solid ${(dominant?DAYS[dominant].accent:"#7C6FFF")}55`:"1px solid #181e1b",
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
              <span style={{fontSize:10,color:entry?"#fff":"#46514b",fontWeight:800}}>{dayNum}</span>
              {entry&&<span style={{width:5,height:5,borderRadius:"50%",
                background:isPR?"#FFB347":DAYS[dominant]?.accent||"#7C6FFF"}}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecoveryScore({history,customEx}){
  if(history.length<1) return null;
  const latest=history[history.length-1];
  const comparableHistory=getComparableHistory(history,latest);
  const prev=comparableHistory.length>1?comparableHistory[comparableHistory.length-2]:null;
  const total=getTotalVol(latest,customEx);
  const prevTotal=prev?getTotalVol(prev,customEx):total;
  const volumeJump=prevTotal?((total-prevTotal)/prevTotal)*100:0;
  const rpe=latest.rpe||6;
  const rating=latest.rating||3;
  const readinessScore=getReadinessScore(latest.readiness);
  const readinessAdjustment=readinessScore===null?0:(readinessScore-67)*0.28;
  const streak=calcStreak(history,customEx);
  const score=Math.max(0,Math.min(100,Math.round(82-(rpe-6)*7-(Math.max(0,volumeJump)-8)*0.55+(rating-3)*5-(streak>=4?6:0)+readinessAdjustment)));
  const isDeload=!!latest.deload;
  const displayScore=isDeload?Math.max(score,70):score;
  const status=isDeload?`Recovery ${latest.periodType===PERIOD_TYPES.DAY?"session":"week"}`:readinessScore!==null&&readinessScore<45?"Low readiness":score>=75?"Recovered":score>=55?"Productive stress":score>=35?"Watch fatigue":"Deload signal";
  const color=isDeload?"#38BFFF":score>=75?"#2DD4A0":score>=55?"#FFB347":score>=35?"#FF9447":"#FF5C87";
  const note=isDeload
    ?"Intentional lighter volume logged. Good load management."
    : readinessScore!==null&&readinessScore<45
      ?"Sleep, energy, or soreness suggest keeping the next session conservative."
      : score>=75?"You look ready to push again.":score>=55?"Training load looks useful, not reckless.":score>=35?"Keep the next session controlled.":"Strong signal to reduce intensity next time.";

  return(
    <div style={{background:"#0a0d0c",border:"1px solid #2a312e",borderRadius:6,
      padding:"14px",marginBottom:16}}>
      <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
        color:color,fontWeight:700,marginBottom:8}}>Fatigue / Recovery</div>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:74,height:74,borderRadius:"50%",background:`conic-gradient(${color} ${displayScore}%, #1e2722 0)`,
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:"#070908",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#fff"}}>{displayScore}</div>
        </div>
        <div style={{minWidth:0}}>
          <div style={{fontSize:17,fontWeight:900,color:"#fff",marginBottom:4}}>{status}</div>
          <div style={{fontSize:11,color:"#87918c",lineHeight:1.5}}>{note}</div>
          <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
            <span style={{fontSize:9,color:"#747e79"}}>RPE {latest.rpe||"—"}</span>
            <span style={{fontSize:9,color:"#747e79"}}>Rating {latest.rating||"—"}/5</span>
            {readinessScore!==null&&(
              <span style={{fontSize:9,color:readinessScore>=68?"#2DD4A0":readinessScore>=52?"#FFB347":"#FF5C87"}}>
                Readiness {readinessScore}/100
              </span>
            )}
            <span style={{fontSize:9,color:volumeJump>=0?"#2DD4A0":"#FF5C87"}}>{volumeJump>=0?"+":""}{volumeJump.toFixed(1)}% volume</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function JointStressGuardrails({history,customEx}){
  if(history.length<1) return null;
  const jointStressGuardrails=buildJointStressGuardrails(history,customEx);
  if(!jointStressGuardrails) return null;
  const metrics=[
    ["Load Spike",`${jointStressGuardrails.volumeJumpPct>=0?"+":""}${jointStressGuardrails.volumeJumpPct}%`,"#FFB347"],
    ["Fatigue",String(jointStressGuardrails.fatigue),"#FF5C87"],
    ["Readiness",jointStressGuardrails.readinessScore===null?"--":`${jointStressGuardrails.readinessScore}`,"#2DD4A0"],
    ["High Stress",`${jointStressGuardrails.highStressCount}/3`,"#38BFFF"],
  ];
  return(
    <div style={{background:"linear-gradient(145deg,#130a16,#080a09 70%)",
      border:`1px solid ${jointStressGuardrails.color}44`,borderRadius:6,
      padding:"14px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",marginBottom:12}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
            color:jointStressGuardrails.color,fontWeight:900,marginBottom:4}}>Joint Stress Guardrails</div>
          <div style={{fontSize:11,color:"#87918c",lineHeight:1.45}}>
            Training-load caution from volume spikes, fatigue, readiness, and pressure zones. Not medical advice.
          </div>
        </div>
        <div style={{width:78,height:78,borderRadius:"50%",
          background:`conic-gradient(${jointStressGuardrails.color} ${jointStressGuardrails.score}%, #242e29 0)`,
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <div style={{width:58,height:58,borderRadius:"50%",background:"#070908",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontSize:20,color:"#fff",fontWeight:950,lineHeight:1}}>{jointStressGuardrails.score}</div>
            <div style={{fontSize:8,color:jointStressGuardrails.color,fontWeight:950,marginTop:3,
              textTransform:"uppercase",letterSpacing:"0.06em"}}>Guardrail Score</div>
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:6,marginBottom:10}}>
        {metrics.map(([label,value,metricColor])=>(
          <div key={label} style={{background:"#070908",border:`1px solid ${metricColor}22`,
            borderRadius:8,padding:"7px",minWidth:0}}>
            <div style={{fontSize:7,color:metricColor,fontWeight:950,
              textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4,
              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</div>
            <div style={{fontSize:12,color:"#fff",fontWeight:950}}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#070908",border:"1px solid #202923",
        borderRadius:5,padding:"10px",marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"baseline",marginBottom:7}}>
          <div style={{fontSize:8,color:"#FFB347",fontWeight:950,
            textTransform:"uppercase",letterSpacing:"0.08em"}}>Pressure Zones</div>
          <div style={{fontSize:9,color:jointStressGuardrails.color,fontWeight:900}}>
            {jointStressGuardrails.status}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {jointStressGuardrails.pressureZones.map(zone=>(
            <div key={zone.id} style={{display:"grid",gridTemplateColumns:"80px 1fr 34px",gap:8,alignItems:"center"}}>
              <div style={{fontSize:9,color:zone.color,fontWeight:900,
                whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{zone.joint}</div>
              <div style={{height:6,background:"#1e2722",borderRadius:999,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${zone.pressure}%`,background:zone.color,borderRadius:999}}/>
              </div>
              <div style={{fontSize:9,color:"#aaa",fontWeight:900,textAlign:"right"}}>{zone.pressure}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:"#070908",border:"1px solid #202923",
        borderRadius:5,padding:"10px"}}>
        <div style={{fontSize:8,color:"#2DD4A0",fontWeight:950,
          textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Coach Cue</div>
        <div style={{fontSize:11,color:"#aaa",lineHeight:1.45,fontWeight:800}}>
          {jointStressGuardrails.coachCue}
        </div>
      </div>
    </div>
  );
}

function TrainingQualityScore({history,customEx}){
  if(history.length<1) return null;
  const isDaily=history[history.length-1]?.periodType===PERIOD_TYPES.DAY;
  const quality=getTrainingQuality(history,history.length-1,customEx);
  if(!quality) return null;
  return(
    <div style={{background:"linear-gradient(145deg,#101512,#080a09)",border:"1px solid #35423b",
      borderRadius:6,padding:"14px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",marginBottom:12}}>
        <div>
          <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
            color:quality.color,fontWeight:800,marginBottom:4}}>{isDaily?"Session Training Quality":"Weekly Training Quality"}</div>
          <div style={{fontSize:11,color:"#87918c",lineHeight:1.45}}>{quality.summary}</div>
        </div>
        <div style={{width:82,height:82,borderRadius:"50%",
          background:`conic-gradient(${quality.color} ${quality.score}%, #242e29 0)`,
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <div style={{width:62,height:62,borderRadius:"50%",background:"#070908",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontSize:22,color:"#fff",fontWeight:950,lineHeight:1}}>{quality.grade}</div>
            <div style={{fontSize:10,color:quality.color,fontWeight:900,marginTop:2}}>{quality.score}/100</div>
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:7}}>
        {quality.components.map(metric=>(
          <div key={metric.label} style={{background:"#070908",border:`1px solid ${metric.color}25`,
            borderRadius:9,padding:"8px 7px",minWidth:0}}>
            <div style={{fontSize:8,color:metric.color,fontWeight:900,marginBottom:6,
              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{metric.label}</div>
            <div style={{height:5,background:"#1e2722",borderRadius:99,overflow:"hidden",marginBottom:5}}>
              <div style={{height:"100%",width:`${metric.value}%`,background:metric.color,borderRadius:99}}/>
            </div>
            <div style={{fontSize:11,color:"#fff",fontWeight:900}}>{metric.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const AnalyticsTooltip=({active,payload,label})=>{
  if(!active||!payload?.length) return null;
  return(
    <div style={{background:"#0a0d0c",border:"1px solid #3a4640",borderRadius:5,
      padding:"9px 11px",fontSize:11,boxShadow:"0 8px 32px rgba(0,0,0,0.7)"}}>
      <div style={{fontWeight:900,color:"#fff",marginBottom:5}}>{label}</div>
      {payload.map(p=>(
        <div key={p.name} style={{color:p.stroke||p.color||"#aaa",fontWeight:800,marginTop:2}}>
          {p.name}: <span style={{color:"#fff"}}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function TrainingQualityBreakdown({history,customEx}){
  const breakdown=buildTrainingQualityBreakdown(history,customEx);
  if(!breakdown) return null;
  const isDaily=history[history.length-1]?.periodType===PERIOD_TYPES.DAY;
  const deltaColor=breakdown.scoreDelta===null
    ?"#777"
    :breakdown.scoreDelta>=0?"#2DD4A0":"#FF5C87";
  return(
    <div style={{background:"linear-gradient(145deg,#0d0d23,#070908)",
      border:"1px solid #35423b",borderRadius:6,padding:"14px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",
        gap:12,marginBottom:12}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
            color:"#38BFFF",fontWeight:900,marginBottom:4}}>Training Quality Breakdown</div>
          <div style={{fontSize:16,color:"#fff",fontWeight:950,lineHeight:1.1}}>
            Why this {isDaily?"session":"week"} scored {breakdown.grade}
          </div>
          <div style={{fontSize:10,color:"#87918c",fontWeight:800,lineHeight:1.4,marginTop:5}}>
            {breakdown.summary}
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:27,color:"#fff",fontWeight:950,lineHeight:1}}>{breakdown.score}</div>
          <div style={{fontSize:9,color:deltaColor,fontWeight:950,marginTop:4}}>{breakdown.comparison}</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",
        gap:10,marginBottom:11}}>
        <div style={{minWidth:0}}>
          {breakdown.components.map(component=>(
            <div key={component.label} style={{display:"grid",gridTemplateColumns:"72px minmax(60px,1fr) 56px",
              gap:7,alignItems:"center",minHeight:27}}>
              <div style={{fontSize:8,color:component.color,fontWeight:950,
                whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{component.label}</div>
              <div style={{height:5,background:"#15152d",borderRadius:99,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${component.value}%`,background:component.color,
                  borderRadius:99}}/>
              </div>
              <div style={{display:"flex",justifyContent:"flex-end",gap:4,alignItems:"baseline"}}>
                <span style={{fontSize:10,color:"#fff",fontWeight:950}}>{component.value}</span>
                <span style={{fontSize:8,color:component.delta===null?"#747e79":component.delta>=0?"#2DD4A0":"#FF5C87",
                  fontWeight:900}}>
                  {component.delta===null?"base":`${component.delta>0?"+":""}${component.delta}`}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div style={{minWidth:0,height:135,borderLeft:"1px solid #25302a",paddingLeft:8}}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={breakdown.qualityTrend} margin={{top:8,right:5,left:-27,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#212a25"/>
              <XAxis dataKey="week" tick={{fill:"#747e79",fontSize:8}} axisLine={false} tickLine={false}/>
              <YAxis domain={[0,100]} tick={{fill:"#747e79",fontSize:8}} axisLine={false} tickLine={false}/>
              <Tooltip content={<AnalyticsTooltip/>}/>
              <Line type="monotone" dataKey="Quality" stroke="#38BFFF" strokeWidth={2.5}
                dot={{r:3,fill:"#38BFFF",strokeWidth:0}} activeDot={{r:5}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8,marginBottom:10}}>
        {[
          ["Strongest driver",breakdown.strongestComponent],
          ["Priority",breakdown.priorityComponent],
        ].map(([label,component])=>(
          <div key={label} style={{borderTop:`2px solid ${component.color}`,padding:"8px 2px 0",minWidth:0}}>
            <div style={{fontSize:8,color:component.color,fontWeight:950,textTransform:"uppercase",
              letterSpacing:"0.07em"}}>{label}</div>
            <div style={{fontSize:13,color:"#fff",fontWeight:950,marginTop:4}}>
              {component.label} {component.value}
            </div>
          </div>
        ))}
      </div>
      <div style={{fontSize:8,color:"#FFB347",fontWeight:950,textTransform:"uppercase",
        letterSpacing:"0.08em",borderTop:"1px solid #25302a",paddingTop:9,marginBottom:7}}>
        Next Actions
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:7}}>
        {breakdown.coachActions.map(action=>(
          <div key={action.title} style={{display:"grid",gridTemplateColumns:"3px 1fr",gap:8,
            background:"#070908",border:"1px solid #222b26",borderRadius:8,padding:"8px"}}>
            <div style={{background:action.color,borderRadius:99}}/>
            <div style={{minWidth:0}}>
              <div style={{fontSize:9,color:"#fff",fontWeight:950}}>{action.title}</div>
              <div style={{fontSize:8,color:"#98a19c",fontWeight:800,lineHeight:1.4,marginTop:3}}>{action.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FatigueTrendPanel({history,customEx}){
  if(history.length<1) return null;
  const isDaily=history[history.length-1]?.periodType===PERIOD_TYPES.DAY;
  const series=getFatigueTrend(history,customEx);
  const latest=series[series.length-1];
  const prev=series.length>1?series[series.length-2]:null;
  const diff=prev?latest.Fatigue-prev.Fatigue:0;
  const color=latest.Fatigue>=72?"#FF5C87":latest.Fatigue>=55?"#FFB347":"#2DD4A0";
  const status=latest.Fatigue>=72?"High fatigue":latest.Fatigue>=55?"Manageable stress":"Fresh enough";
  return(
    <div style={{background:"#0a0d0c",border:"1px solid #2a312e",borderRadius:6,
      padding:"14px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:10}}>
        <div>
          <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
            color:color,fontWeight:800}}>Fatigue Trend</div>
          <div style={{fontSize:10,color:"#747e79",marginTop:3}}>
            Tracks stress from volume jumps, RPE, rating, streak, and recovery {isDaily?"sessions":"weeks"}.
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:20,color:"#fff",fontWeight:950,lineHeight:1}}>{latest.Fatigue}</div>
          <div style={{fontSize:9,color:diff<=0?"#2DD4A0":"#FFB347",fontWeight:900,marginTop:3}}>
            {diff>0?"+":""}{diff} vs last
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={series} margin={{top:4,right:4,left:-18,bottom:0}}>
          <defs>
            <linearGradient id="fatigueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#212a25"/>
          <XAxis dataKey="week" tick={{fill:"#747e79",fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis domain={[0,100]} tick={{fill:"#747e79",fontSize:10}} axisLine={false} tickLine={false}/>
          <ReferenceLine y={70} stroke="#FF5C87" strokeDasharray="4 4" strokeOpacity={0.45}/>
          <Tooltip content={<AnalyticsTooltip/>}/>
          <Area type="monotone" dataKey="Fatigue" stroke={color} strokeWidth={2.5}
            fill="url(#fatigueGrad)" dot={{r:3,fill:color,strokeWidth:0}} activeDot={{r:5}}/>
          <Line type="monotone" dataKey="Quality" stroke="#38BFFF" strokeWidth={1.5}
            dot={false} strokeDasharray="4 4"/>
        </AreaChart>
      </ResponsiveContainer>
      <div style={{fontSize:11,color:color,fontWeight:900,marginTop:6}}>{status}</div>
    </div>
  );
}

function RecoveryForecastPanel({history,customEx}){
  const forecast=buildRecoveryForecast(history,customEx);
  if(!forecast) return null;
  return(
    <div style={{background:"linear-gradient(145deg,#101512,#070908)",
      border:`1px solid ${forecast.color}40`,borderRadius:6,padding:"14px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",
        gap:12,marginBottom:13}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
            color:forecast.color,fontWeight:900,marginBottom:4}}>Recovery Forecast</div>
          <div style={{fontSize:17,color:"#fff",fontWeight:950,lineHeight:1.1}}>{forecast.status}</div>
          <div style={{fontSize:10,color:"#98a19c",fontWeight:800,lineHeight:1.4,marginTop:5}}>
            {forecast.summary}
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:28,color:"#fff",fontWeight:950,lineHeight:1}}>{forecast.currentScore}</div>
          <div style={{fontSize:8,color:forecast.color,fontWeight:950,textTransform:"uppercase",
            letterSpacing:"0.08em",marginTop:4}}>{forecast.recommendation}</div>
          <div style={{fontSize:8,color:"#87918c",fontWeight:900,marginTop:3}}>
            {forecast.confidence} confidence
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",
        gap:8,marginBottom:11}}>
        {forecast.horizons.map(item=>(
          <div key={item.label} style={{background:"#070908",border:"1px solid #1a1a36",
            borderRadius:9,padding:"9px",minWidth:0}}>
            <div style={{fontSize:8,color:"#777",fontWeight:950,textTransform:"uppercase",
              letterSpacing:"0.07em",whiteSpace:"nowrap",overflow:"hidden",
              textOverflow:"ellipsis"}}>{item.label}</div>
            <div style={{display:"flex",alignItems:"baseline",gap:5,marginTop:5}}>
              <span style={{fontSize:19,color:"#fff",fontWeight:950}}>{item.score}</span>
              <span style={{fontSize:8,color:forecast.color,fontWeight:900}}>/100</span>
            </div>
            <div style={{fontSize:8,color:"#87918c",fontWeight:850,marginTop:3}}>{item.detail}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:7}}>
        {forecast.factors.map(item=>(
          <div key={item.label} style={{borderTop:`2px solid ${item.color}`,padding:"8px 2px 0",minWidth:0}}>
            <div style={{fontSize:8,color:item.color,fontWeight:950,textTransform:"uppercase",
              letterSpacing:"0.07em"}}>{item.label}</div>
            <div style={{fontSize:12,color:"#fff",fontWeight:950,marginTop:4}}>{item.value}</div>
            <div style={{fontSize:8,color:"#87918c",fontWeight:800,lineHeight:1.35,marginTop:3}}>
              {item.detail}
            </div>
          </div>
        ))}
      </div>
      <div style={{fontSize:8,color:"#747e79",fontWeight:800,lineHeight:1.35,
        borderTop:"1px solid #25302a",paddingTop:8,marginTop:10}}>
        Training estimate, not medical advice. Use how you feel and stop if something feels wrong.
      </div>
    </div>
  );
}

function PerformanceCorrelationLab({history,customEx}){
  const lab=buildPerformanceCorrelations(history,customEx);
  if(history.length<1) return null;
  const best=lab.bestSignal;
  const signalColor=best?.color||"#7C6FFF";
  const periodNoun=history[history.length-1]?.periodType===PERIOD_TYPES.DAY?"session":"weekly";
  return(
    <div style={{background:"linear-gradient(145deg,#111126,#070908)",
      border:"1px solid #26264a",borderRadius:6,padding:"14px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",marginBottom:12}}>
        <div>
          <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
            color:"#FF5C87",fontWeight:900,marginBottom:4}}>Performance Correlation Lab</div>
          <div style={{fontSize:10,color:"#87918c",lineHeight:1.45}}>
            Private signals from readiness, bodyweight context, PRs, and {periodNoun} volume.
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:8,color:signalColor,fontWeight:950,textTransform:"uppercase",
            letterSpacing:"0.08em",marginBottom:4}}>Signal Strength</div>
          <div style={{fontSize:22,color:"#fff",fontWeight:950,lineHeight:1}}>
            {best?best.signalStrength:0}
          </div>
        </div>
      </div>

      {lab.sampleCount<2?(
        <div style={{background:"#070908",border:"1px solid #222b26",borderRadius:5,
          padding:"11px",fontSize:11,color:"#777",lineHeight:1.45,fontWeight:700}}>
          Log at least two workouts with readiness check-ins to unlock useful performance signals.
        </div>
      ):(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div style={{background:"#070908",border:`1px solid ${signalColor}44`,
              borderLeft:`3px solid ${signalColor}`,borderRadius:5,padding:"10px",minWidth:0}}>
              <div style={{fontSize:8,color:signalColor,fontWeight:950,textTransform:"uppercase",
                letterSpacing:"0.08em",marginBottom:4}}>Top Signal</div>
              <div style={{fontSize:14,color:"#fff",fontWeight:950,whiteSpace:"nowrap",
                overflow:"hidden",textOverflow:"ellipsis"}}>{best?.label||"Keep Logging"}</div>
              <div style={{fontSize:10,color:"#98a19c",fontWeight:800,marginTop:4}}>
                {best?`${best.sampleLabel} sample`:`${lab.sampleCount} workouts logged`}
              </div>
            </div>
            <div style={{background:"#070908",border:"1px solid #222b26",
              borderRadius:5,padding:"10px",minWidth:0}}>
              <div style={{fontSize:8,color:"#2DD4A0",fontWeight:950,textTransform:"uppercase",
                letterSpacing:"0.08em",marginBottom:4}}>Coach Cue</div>
              <div style={{fontSize:10,color:"#aaa",lineHeight:1.4,fontWeight:800}}>
                {lab.coachCue}
              </div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(136px,1fr))",gap:8}}>
            {lab.rows.map(row=>{
              const up=row.delta>=0;
              return(
                <div key={row.id} style={{background:"#070908",border:`1px solid ${row.color}30`,
                  borderRadius:5,padding:"10px 9px",minWidth:0,opacity:row.locked?0.68:1}}>
                  <div style={{fontSize:8,color:row.color,fontWeight:950,textTransform:"uppercase",
                    letterSpacing:"0.08em",marginBottom:6,whiteSpace:"nowrap",overflow:"hidden",
                    textOverflow:"ellipsis"}}>{row.label}</div>
                  <div style={{display:"flex",justifyContent:"space-between",gap:6,marginBottom:6}}>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:8,color:"#747e79",fontWeight:900,whiteSpace:"nowrap",
                        overflow:"hidden",textOverflow:"ellipsis"}}>{row.favorableLabel}</div>
                      <div style={{fontSize:12,color:"#fff",fontWeight:950}}>
                        {row.locked?"--":fmtVol(row.highAvg)}
                      </div>
                    </div>
                    <div style={{textAlign:"right",minWidth:0}}>
                      <div style={{fontSize:8,color:"#747e79",fontWeight:900,whiteSpace:"nowrap",
                        overflow:"hidden",textOverflow:"ellipsis"}}>{row.baselineLabel}</div>
                      <div style={{fontSize:12,color:"#888",fontWeight:950}}>
                        {row.locked?"--":fmtVol(row.baselineAvg)}
                      </div>
                    </div>
                  </div>
                  <div style={{height:5,background:"#1e2722",borderRadius:99,overflow:"hidden",marginBottom:6}}>
                    <div style={{height:"100%",width:`${row.signalStrength}%`,
                      background:row.color,borderRadius:99}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",gap:6,alignItems:"center"}}>
                    <div style={{fontSize:9,color:row.locked?"#87918c":up?"#2DD4A0":"#FF5C87",
                      fontWeight:950}}>
                      {row.locked?"More data":`${up?"+":""}${row.deltaPct}%`}
                    </div>
                    <div style={{fontSize:8,color:"#87918c",fontWeight:900,whiteSpace:"nowrap"}}>
                      {row.confidence}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function MusclePerformanceAlerts({history,customEx}){
  if(history.length<1) return null;
  const rows=getMuscleAlertRows(history,customEx);
  if(!rows.length) return null;
  return(
    <div style={{background:"#0a0d0c",border:"1px solid #2a312e",borderRadius:6,
      padding:"14px",marginBottom:16}}>
      <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
        color:"#FFB347",fontWeight:800,marginBottom:10}}>Strongest / Weakest Alerts</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {rows.map(row=>(
          <div key={row.title} style={{background:"#070908",border:`1px solid ${row.color}35`,
            borderLeft:`3px solid ${row.color}`,borderRadius:5,padding:"10px 9px",minWidth:0}}>
            <div style={{fontSize:8,color:row.color,fontWeight:900,textTransform:"uppercase",
              letterSpacing:"0.08em",marginBottom:5}}>{row.title}</div>
            <div style={{fontSize:13,color:"#fff",fontWeight:950,whiteSpace:"nowrap",
              overflow:"hidden",textOverflow:"ellipsis"}}>{row.label}</div>
            <div style={{fontSize:11,color:row.color,fontWeight:900,marginTop:4}}>{row.value}</div>
            <div style={{fontSize:9,color:"#87918c",lineHeight:1.35,marginTop:5}}>{row.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MuscleDriftMonitor({history,customEx}){
  const drift=buildMuscleDriftAlerts(history,customEx);
  if(!drift) return null;
  return(
    <div style={{background:"#0a0d0c",border:"1px solid #2a312e",borderRadius:6,
      padding:"14px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",
        gap:12,marginBottom:12}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
            color:"#FFB347",fontWeight:900,marginBottom:4}}>Muscle Drift Monitor</div>
          <div style={{fontSize:16,color:"#fff",fontWeight:950,lineHeight:1.1}}>{drift.status}</div>
          <div style={{fontSize:10,color:"#87918c",fontWeight:800,lineHeight:1.4,marginTop:5}}>
            {drift.summary}
          </div>
        </div>
        <div style={{fontSize:8,color:"#777",fontWeight:950,textAlign:"right",
          textTransform:"uppercase",letterSpacing:"0.07em",flexShrink:0}}>
          <div>{drift.recentCount} recent</div>
          <div style={{color:"#747e79",marginTop:3}}>{drift.baselineCount} baseline</div>
        </div>
      </div>
      {!drift.hasEnoughHistory?(
        <div style={{minHeight:58,display:"flex",alignItems:"center",justifyContent:"center",
          border:"1px dashed #252548",borderRadius:9,padding:"10px",textAlign:"center",
          color:"#98a19c",fontSize:10,fontWeight:850,lineHeight:1.4}}>
          More history needed. One missed split day will not trigger a weakness alert.
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:8}}>
          {drift.alerts.map(alert=>(
            <div key={`${alert.state}_${alert.id}`} style={{background:"#070908",
              border:`1px solid ${alert.color}32`,borderLeft:`3px solid ${alert.color}`,
              borderRadius:9,padding:"10px",minWidth:0}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start"}}>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:8,color:alert.color,fontWeight:950,textTransform:"uppercase",
                    letterSpacing:"0.07em"}}>{alert.state}</div>
                  <div style={{fontSize:14,color:"#fff",fontWeight:950,marginTop:4,
                    whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{alert.label}</div>
                </div>
                <div style={{fontSize:8,color:alert.color,fontWeight:950,whiteSpace:"nowrap"}}>
                  {alert.severity}
                </div>
              </div>
              {alert.recentShare!==null&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:7,
                  alignItems:"end",marginTop:9}}>
                  <div>
                    <div style={{fontSize:7,color:"#747e79",fontWeight:900,textTransform:"uppercase"}}>Recent</div>
                    <div style={{fontSize:12,color:"#fff",fontWeight:950,marginTop:3}}>{alert.recentShare}%</div>
                  </div>
                  <div>
                    <div style={{fontSize:7,color:"#747e79",fontWeight:900,textTransform:"uppercase"}}>Baseline</div>
                    <div style={{fontSize:12,color:"#888",fontWeight:950,marginTop:3}}>{alert.baselineShare}%</div>
                  </div>
                  <div style={{fontSize:11,color:alert.color,fontWeight:950}}>
                    {alert.drift>0?"+":""}{alert.drift} pts
                  </div>
                </div>
              )}
              <div style={{fontSize:9,color:"#98a19c",fontWeight:800,lineHeight:1.4,
                borderTop:"1px solid #222b26",paddingTop:7,marginTop:8}}>{alert.cue}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdaptiveWorkoutPlan({history,customEx,onStartPlan,hasDraft}){
  if(history.length<1) return null;
  const plan=buildAdaptiveWorkoutPlan(history,customEx);
  if(!plan) return null;
  const day=DAYS[plan.dayKey];
  return(
    <div style={{background:`linear-gradient(145deg,${day.dim},#080a09 72%)`,
      border:`1px solid ${day.accent}44`,borderRadius:6,padding:"14px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:12}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
            color:day.accent,fontWeight:900,marginBottom:4}}>Adaptive Next Workout</div>
          <div style={{fontSize:20,color:"#fff",fontWeight:950,lineHeight:1.05}}>{day.label}</div>
          <div style={{fontSize:11,color:"#98a19c",fontWeight:700,marginTop:5}}>
            {plan.mode} · {plan.intensity}
          </div>
        </div>
        <div style={{width:68,height:68,borderRadius:"50%",
          background:`conic-gradient(${day.accent} ${plan.score}%, #17172d 0)`,
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <div style={{width:50,height:50,borderRadius:"50%",background:"#070908",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:18,color:"#fff",fontWeight:950,lineHeight:1}}>{plan.score}</span>
            <span style={{fontSize:8,color:day.accent,fontWeight:900}}>fit</span>
          </div>
        </div>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
        {plan.reasons.map(reason=>(
          <span key={reason} style={{fontSize:9,color:"#888",border:"1px solid #35423b",
            background:"#070908",borderRadius:999,padding:"5px 7px",fontWeight:800}}>
            {reason}
          </span>
        ))}
      </div>
      {!!plan.weakMuscles.length&&(
        <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"}}>
          {plan.weakMuscles.map(group=>(
            <div key={group.id} style={{fontSize:10,color:group.color,
              border:`1px solid ${group.color}33`,background:`${group.color}12`,
              borderRadius:8,padding:"6px 8px",fontWeight:900}}>
              Focus {group.label}
            </div>
          ))}
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {plan.prescriptions.slice(0,4).map(item=>(
          <div key={item.ex.id} style={{background:"#070908",border:`1px solid ${item.color}30`,
            borderLeft:`3px solid ${item.color}`,borderRadius:5,padding:"10px 11px"}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",marginBottom:4}}>
              <div style={{fontSize:12,color:"#fff",fontWeight:900,overflow:"hidden",
                textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.ex.name}</div>
              <div style={{fontSize:9,color:item.color,fontWeight:950,flexShrink:0}}>{item.action}</div>
            </div>
            <div style={{fontSize:11,color:item.color,fontWeight:900,marginBottom:3}}>{item.target}</div>
            <div style={{fontSize:10,color:"#98a19c",lineHeight:1.4}}>{item.detail}</div>
          </div>
        ))}
      </div>
      {onStartPlan&&(
        <div style={{marginTop:12}}>
          <button onClick={()=>onStartPlan(plan)} style={{
            width:"100%",padding:"12px 11px",borderRadius:5,border:"none",
            background:`linear-gradient(135deg,${day.accent},#2DD4A0)`,
            color:"#fff",fontSize:12,fontWeight:950,cursor:"pointer",
            boxShadow:`0 8px 22px ${day.accent}20`}}>
            Start This Workout
          </button>
          <div style={{fontSize:9,color:"#87918c",lineHeight:1.35,marginTop:7,textAlign:"center"}}>
            {hasDraft
              ?"Keeps your unfinished log and switches it to this recommended day."
              :"Opens the log on this day with your latest saved numbers ready."}
          </div>
        </div>
      )}
    </div>
  );
}

function WorkoutSchedulePlanner({history,customEx,onStartPlan,hasDraft}){
  const schedule=buildWorkoutSchedule(history,customEx);
  const {scheduledWorkouts,nextScheduledWorkout}=schedule;
  if(!scheduledWorkouts.length) return null;
  return(
    <div style={{background:"linear-gradient(145deg,#101512,#071622 76%)",
      border:"1px solid #24304f",borderRadius:6,padding:"14px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:12}}>
        <div>
          <div style={{fontSize:9,color:"#38BFFF",fontWeight:950,
            textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4}}>Workout Schedule Planner</div>
          <div style={{fontSize:18,color:"#fff",fontWeight:950,lineHeight:1.1}}>7-Day Agenda</div>
          <div style={{fontSize:11,color:"#87918c",lineHeight:1.45,marginTop:5}}>{schedule.summary}</div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:22,color:"#fff",fontWeight:950,lineHeight:1}}>
            {scheduledWorkouts.filter(item=>item.type==="workout").length}
          </div>
          <div style={{fontSize:9,color:"#38BFFF",fontWeight:950,marginTop:3}}>workouts</div>
        </div>
      </div>

      {nextScheduledWorkout&&(
        <div style={{background:"#070908",border:`1px solid ${nextScheduledWorkout.color}44`,
          borderLeft:`3px solid ${nextScheduledWorkout.color}`,borderRadius:5,padding:"11px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",marginBottom:7}}>
            <div style={{minWidth:0}}>
              <div style={{fontSize:8,color:nextScheduledWorkout.color,fontWeight:950,
                textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Next Scheduled Workout</div>
              <div style={{fontSize:14,color:"#fff",fontWeight:950,whiteSpace:"nowrap",
                overflow:"hidden",textOverflow:"ellipsis"}}>{nextScheduledWorkout.title}</div>
              <div style={{fontSize:10,color:"#98a19c",lineHeight:1.4,marginTop:4}}>
                {nextScheduledWorkout.dateLabel} - {nextScheduledWorkout.intensity}
              </div>
            </div>
            <div style={{fontSize:18,color:nextScheduledWorkout.color,fontWeight:950,lineHeight:1}}>
              {nextScheduledWorkout.score}
            </div>
          </div>
          <button onClick={()=>onStartPlan?.(nextScheduledWorkout.plan)}
            style={{width:"100%",padding:"10px",borderRadius:9,border:"none",
              background:`linear-gradient(135deg,${nextScheduledWorkout.color},#2DD4A0)`,
              color:"#fff",fontSize:11,fontWeight:950,cursor:"pointer"}}>
            Start Scheduled Workout
          </button>
          {hasDraft&&(
            <div style={{fontSize:9,color:"#87918c",lineHeight:1.35,marginTop:7,textAlign:"center"}}>
              Keeps your unfinished log and switches it to the scheduled day.
            </div>
          )}
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {scheduledWorkouts.map(item=>(
          <div key={item.id} style={{display:"grid",gridTemplateColumns:"52px 1fr auto",
            gap:9,alignItems:"center",background:"#070908",border:`1px solid ${item.color}28`,
            borderLeft:`3px solid ${item.color}`,borderRadius:5,padding:"9px 10px"}}>
            <div style={{fontSize:9,color:item.color,fontWeight:950,lineHeight:1.2}}>{item.dateLabel}</div>
            <div style={{minWidth:0}}>
              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}>
                <span style={{fontSize:12,color:"#fff",fontWeight:950,whiteSpace:"nowrap",
                  overflow:"hidden",textOverflow:"ellipsis"}}>{item.title}</span>
                {item.type==="recovery"&&(
                  <span style={{fontSize:8,color:"#38BFFF",border:"1px solid #38BFFF44",
                    borderRadius:999,padding:"2px 5px",fontWeight:900}}>Recovery Day</span>
                )}
              </div>
              <div style={{fontSize:9,color:"#87918c",lineHeight:1.35}}>{item.focus}</div>
              <div style={{fontSize:9,color:"#747e79",lineHeight:1.35,marginTop:2}}>{item.reason}</div>
            </div>
            <div style={{fontSize:9,color:item.color,fontWeight:950,whiteSpace:"nowrap"}}>
              {item.type==="workout"?`${item.score} fit`:"light"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoachPillGroup({label,items,value,onChange}){
  return(
    <div style={{marginBottom:10}}>
      <div style={{fontSize:8,color:"#87918c",fontWeight:900,textTransform:"uppercase",
        letterSpacing:"0.1em",marginBottom:6}}>{label}</div>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${items.length},1fr)`,gap:6}}>
        {items.map(item=>{
          const id=item.id||item;
          const active=value===id;
          return(
            <button key={id} onClick={()=>onChange(id)}
              style={{padding:"8px 5px",borderRadius:8,
                border:`1px solid ${active?"#7C6FFF66":"#252d29"}`,
                background:active?"#15153a":"#070908",
                color:active?"#fff":"#87918c",fontSize:9,fontWeight:950,cursor:"pointer",
                minWidth:0}}>
              {item.label||item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CoachProgramBuilder({history,goals,customEx,onSaveCoachProfile,onGenerateCoachProgram,onStartCoachPlanDay}){
  const coach=coachState(customEx);
  const [draftProfile,setDraftProfile]=useState(coach.profile);
  const [editing,setEditing]=useState(!coach.plan);
  useEffect(()=>{ setDraftProfile(coach.profile); },[customEx]);
  const plan=coach.plan;
  const updateProfile=patch=>{
    const next=normalizeCoachProfile({...draftProfile,...patch,updatedAt:new Date().toISOString()});
    setDraftProfile(next);
    onSaveCoachProfile?.(next);
  };
  const updateEquipment=(id,value)=>{
    updateProfile({equipment:{...draftProfile.equipment,[id]:value}});
  };
  const generate=()=>{
    onGenerateCoachProgram?.(draftProfile);
    setEditing(false);
  };
  return(
    <div style={{background:"linear-gradient(145deg,#111512,#071622 76%)",
      border:"1px solid #24304f",borderRadius:6,padding:"14px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:12}}>
        <div>
          <div style={{fontSize:9,color:"#2DD4A0",fontWeight:950,
            textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4}}>Smart Program Builder</div>
          <div style={{fontSize:18,color:"#fff",fontWeight:950,lineHeight:1.1}}>Coach Setup</div>
          <div style={{fontSize:11,color:"#566",lineHeight:1.45,marginTop:5}}>
            Builds a private plan from your goals, schedule, fatigue, weak muscles, and equipment.
          </div>
        </div>
        {plan&&(
          <button onClick={()=>setEditing(!editing)} style={{border:"1px solid #38BFFF44",
            background:"#071622",color:"#38BFFF",borderRadius:999,padding:"7px 9px",
            fontSize:9,fontWeight:950,cursor:"pointer",whiteSpace:"nowrap"}}>
            {editing?"View Plan":"Edit Setup"}
          </button>
        )}
      </div>

      {editing&&(
        <div style={{background:"#070908",border:"1px solid #17213a",borderRadius:6,padding:"12px",marginBottom:12}}>
          <CoachPillGroup label="Goal" items={COACH_GOALS} value={draftProfile.goal}
            onChange={goal=>updateProfile({goal})}/>
          <CoachPillGroup label="Experience" items={COACH_EXPERIENCE} value={draftProfile.experience}
            onChange={experience=>updateProfile({experience})}/>
          <CoachPillGroup label="Days / Week" items={[3,4,5,6]} value={draftProfile.daysPerWeek}
            onChange={daysPerWeek=>updateProfile({daysPerWeek})}/>
          <CoachPillGroup label="Session Length" items={[30,45,60,75].map(min=>({id:min,label:`${min}m`}))}
            value={draftProfile.sessionLength} onChange={sessionLength=>updateProfile({sessionLength})}/>
          <CoachPillGroup label="Split Style" items={COACH_SPLITS} value={draftProfile.splitPreference}
            onChange={splitPreference=>updateProfile({splitPreference})}/>
          <CoachPillGroup label="Intensity" items={COACH_INTENSITIES} value={draftProfile.intensityPreference}
            onChange={intensityPreference=>updateProfile({intensityPreference})}/>
          <div style={{fontSize:8,color:"#87918c",fontWeight:900,textTransform:"uppercase",
            letterSpacing:"0.1em",marginBottom:6}}>Equipment</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:10}}>
            {COACH_EQUIPMENT.map(item=>(
              <button key={item.id} onClick={()=>updateEquipment(item.id,!draftProfile.equipment[item.id])}
                style={{padding:"8px 4px",borderRadius:8,
                  border:`1px solid ${draftProfile.equipment[item.id]?"#2DD4A066":"#252d29"}`,
                  background:draftProfile.equipment[item.id]?"#061811":"#070908",
                  color:draftProfile.equipment[item.id]?"#2DD4A0":"#87918c",
                  fontSize:8,fontWeight:950,cursor:"pointer",minWidth:0}}>
                {item.label}
              </button>
            ))}
          </div>
          <button onClick={()=>updateProfile({weakMuscleBias:!draftProfile.weakMuscleBias})}
            style={{width:"100%",padding:"10px",borderRadius:9,
              border:`1px solid ${draftProfile.weakMuscleBias?"#FFB34755":"#252d29"}`,
              background:draftProfile.weakMuscleBias?"#160f00":"#070908",
              color:draftProfile.weakMuscleBias?"#FFB347":"#87918c",
              fontSize:10,fontWeight:950,cursor:"pointer",marginBottom:10}}>
            Weak-Muscle Bias {draftProfile.weakMuscleBias?"On":"Off"}
          </button>
          <button onClick={generate} style={{width:"100%",padding:"12px",borderRadius:5,
            border:"none",background:"linear-gradient(135deg,#7C6FFF,#2DD4A0)",
            color:"#fff",fontSize:12,fontWeight:950,cursor:"pointer"}}>
            Generate Program
          </button>
        </div>
      )}

      {plan?(
        <div>
          <div style={{background:"#070908",border:"1px solid #17213a",borderRadius:6,padding:"11px",marginBottom:10}}>
            <div style={{fontSize:13,color:"#fff",fontWeight:950,marginBottom:4}}>{plan.summary}</div>
            <div style={{fontSize:10,color:"#98a19c",lineHeight:1.45}}>{plan.reason}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {plan.days.map(day=>(
              <div key={day.id} style={{background:"#070908",border:`1px solid ${DAYS[day.dayKey]?.accent||"#7C6FFF"}33`,
                borderLeft:`3px solid ${DAYS[day.dayKey]?.accent||"#7C6FFF"}`,borderRadius:5,padding:"11px"}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:10,marginBottom:7}}>
                  <div>
                    <div style={{fontSize:12,color:"#fff",fontWeight:950}}>{day.label}: {day.focus}</div>
                    <div style={{fontSize:9,color:"#87918c",lineHeight:1.4,marginTop:3}}>{day.reason}</div>
                  </div>
                  <button onClick={()=>onStartCoachPlanDay?.(day)}
                    style={{alignSelf:"flex-start",border:"1px solid #2DD4A055",background:"#061811",
                      color:"#2DD4A0",borderRadius:8,padding:"7px 8px",fontSize:9,fontWeight:950,
                      cursor:"pointer",whiteSpace:"nowrap"}}>
                    Start Workout
                  </button>
                </div>
                {(day.exercises||[]).slice(0,5).map(item=>(
                  <div key={item.id} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,
                    padding:"7px 0",borderTop:"1px solid #1b211f"}}>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:11,color:"#ddd",fontWeight:900,whiteSpace:"nowrap",
                        overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</div>
                      <div style={{fontSize:9,color:"#87918c",lineHeight:1.35,marginTop:2}}>{item.weightHint}</div>
                    </div>
                    <div style={{textAlign:"right",fontSize:9,color:"#38BFFF",fontWeight:950}}>
                      {item.sets} x {item.reps}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <button onClick={generate} style={{width:"100%",marginTop:10,padding:"10px",
            borderRadius:9,border:"1px solid #7C6FFF55",background:"#12102a",
            color:"#9b8fff",fontSize:10,fontWeight:950,cursor:"pointer"}}>
            Regenerate
          </button>
        </div>
      ):(
        !editing&&(
          <div style={{background:"#070908",border:"1px solid #1b211f",borderRadius:5,
            padding:"12px",fontSize:11,color:"#87918c",lineHeight:1.45}}>
            Set your coach profile, then generate your first program.
          </div>
        )
      )}
    </div>
  );
}

function ProgressiveOverloadCoach({history,customEx}){
  const overloadAdvice=buildProgressiveOverloadAdvice(history,customEx);
  if(!history.length) return null;
  return(
    <div style={{background:"linear-gradient(145deg,#101512,#071622 76%)",
      border:"1px solid #24304f",borderRadius:6,padding:"14px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:12}}>
        <div>
          <div style={{fontSize:9,color:"#FFB347",fontWeight:950,
            textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4}}>Progressive Overload Coach</div>
          <div style={{fontSize:11,color:"#87918c",lineHeight:1.45}}>
            Per-exercise decisions from your latest saved workout.
          </div>
        </div>
        <div style={{fontSize:10,color:"#FFB347",fontWeight:950,whiteSpace:"nowrap"}}>
          {overloadAdvice.length} calls
        </div>
      </div>
      {!overloadAdvice.length?(
        <div style={{background:"#070908",border:"1px solid #1b211f",borderRadius:5,
          padding:"11px",fontSize:11,color:"#98a19c",lineHeight:1.5}}>
          Log a workout with at least one exercise to unlock overload calls.
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {overloadAdvice.map(item=>(
            <div key={`${item.dayKey}_${item.ex.id}`} style={{background:"#070908",
              border:`1px solid ${item.color}33`,borderLeft:`3px solid ${item.color}`,
              borderRadius:5,padding:"11px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:8}}>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12,color:"#fff",fontWeight:950,overflow:"hidden",
                    textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.ex.name}</div>
                  <div style={{fontSize:9,color:DAYS[item.dayKey].accent,fontWeight:900,marginTop:3}}>
                    {DAYS[item.dayKey].shortLabel}
                  </div>
                </div>
                <div style={{fontSize:10,color:item.color,fontWeight:950,
                  border:`1px solid ${item.color}44`,borderRadius:999,padding:"4px 8px",
                  background:`${item.color}14`,whiteSpace:"nowrap"}}>
                  {item.action}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"0.8fr 1.2fr",gap:8}}>
                <div style={{background:"#0a0d0c",border:"1px solid #1d2421",
                  borderRadius:8,padding:"8px",minWidth:0}}>
                  <div style={{fontSize:8,color:item.color,fontWeight:950,
                    textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>
                    Next Target
                  </div>
                  <div style={{fontSize:11,color:"#fff",fontWeight:900,overflow:"hidden",
                    textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.nextTarget}</div>
                </div>
                <div style={{background:"#0a0d0c",border:"1px solid #1d2421",
                  borderRadius:8,padding:"8px",minWidth:0}}>
                  <div style={{fontSize:8,color:"#777",fontWeight:950,
                    textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>
                    Why
                  </div>
                  <div style={{fontSize:10,color:"#888",lineHeight:1.35}}>{item.why}</div>
                </div>
              </div>
              {item.previousVolume>0&&(
                <div style={{fontSize:9,color:Number(item.volumePct)>=0?"#2DD4A0":"#FF5C87",
                  fontWeight:900,marginTop:8}}>
                  {Number(item.volumePct)>=0?"+":""}{item.volumePct}% volume vs previous logged lift
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MuscleTrendCards({history,customEx}){
  if(history.length<2) return null;
  const latestEntry=history[history.length-1];
  const previousEntry=latestEntry?.periodType===PERIOD_TYPES.DAY
    ?[...history.slice(0,-1)].reverse().find(entry=>entry.dayKey===latestEntry.dayKey)
    :history[history.length-2];
  if(!previousEntry) return null;
  const latest=getMuscleVolumes(latestEntry,customEx);
  const prev=getMuscleVolumes(previousEntry,customEx);
  return(
    <div style={{background:"#0a0d0c",border:"1px solid #2a312e",borderRadius:6,
      padding:"14px",marginBottom:16}}>
      <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
        color:"#7C6FFF",fontWeight:700,marginBottom:10}}>Muscle Group Trends</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
        {MUSCLE_GROUPS.map(group=>{
          const cur=latest[group.id]||0,old=prev[group.id]||0;
          const diff=cur-old;
          const change=pct(cur,old);
          return(
            <div key={group.id} style={{background:"#070908",border:`1px solid ${group.color}22`,
              borderRadius:8,padding:"8px 6px",minWidth:0}}>
              <div style={{fontSize:8,color:group.color,fontWeight:900,whiteSpace:"nowrap",
                overflow:"hidden",textOverflow:"ellipsis",marginBottom:4}}>{group.label}</div>
              <div style={{fontSize:13,color:"#fff",fontWeight:900}}>{fmtVol(cur)}</div>
              <div style={{fontSize:9,color:diff>=0?"#2DD4A0":"#FF5C87",fontWeight:800,marginTop:4}}>
                {diff>=0?"▲":"▼"} {change??"0.0"}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PRTimeline({history,customEx}){
  const events=[];
  for(const dk of DAY_KEYS){
    for(const ex of allExercises(dk,customEx)){
      let bestVol=0,bestWeight=0,bestRM=0;
      let hasLogged=false;
      history.forEach((entry,i)=>{
        const d=entry.exercises[ex.id];
        if(!d) return;
        const rm=epley1RM(d.w,d.r);
        const period=getEntryShortLabel(entry,i);
        if(hasLogged&&d.volume>bestVol) events.push({week:i+1,period,date:entry.date,ex:ex.name,type:"Volume PR",value:`${d.volume.toLocaleString()} lbs`,color:"#7C6FFF"});
        if(hasLogged&&d.w>bestWeight) events.push({week:i+1,period,date:entry.date,ex:ex.name,type:"Weight PR",value:`${d.w} lbs`,color:"#FF5C87"});
        if(hasLogged&&rm>bestRM) events.push({week:i+1,period,date:entry.date,ex:ex.name,type:"1RM PR",value:`${rm} lbs`,color:"#FFB347"});
        bestVol=Math.max(bestVol,d.volume);
        bestWeight=Math.max(bestWeight,d.w);
        bestRM=Math.max(bestRM,rm);
        hasLogged=true;
      });
    }
  }
  const recent=events.sort((a,b)=>b.week-a.week).slice(0,6);
  if(!recent.length) return null;
  return(
    <div style={{background:"#0a0d0c",border:"1px solid #2a312e",borderRadius:6,
      padding:"14px",marginBottom:16}}>
      <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
        color:"#FFB347",fontWeight:700,marginBottom:10}}>PR Timeline</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {recent.map((event,i)=>(
          <div key={`${event.week}${event.ex}${event.type}${i}`} style={{display:"grid",
            gridTemplateColumns:"42px 1fr auto",gap:10,alignItems:"center",background:"#070908",
            border:"1px solid #1b211f",borderRadius:9,padding:"9px 10px"}}>
            <div style={{fontSize:10,color:event.color,fontWeight:900}}>{event.period}</div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:11,color:"#ddd",fontWeight:800,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{event.ex}</div>
              <div style={{fontSize:9,color:"#747e79",marginTop:2}}>{event.type}{event.date?` · ${event.date}`:""}</div>
            </div>
            <div style={{fontSize:11,color:"#fff",fontWeight:900}}>{event.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatMilestoneValue(value,kind){
  const safe=Math.max(0,Math.round(value||0));
  if(kind==="volume") return `${fmtVol(safe)} lbs`;
  return safe.toLocaleString();
}

function createAchievementMilestone({id,category,title,description,current,target,color,icon,kind="count"}){
  const safeTarget=Math.max(1,Math.round(target||1));
  const safeCurrent=Math.max(0,Math.round(current||0));
  const progress=Math.min(100,Math.round((safeCurrent/safeTarget)*100));
  const unlocked=safeCurrent>=safeTarget;
  return {
    id,category,title,description,current:safeCurrent,target:safeTarget,color,icon,kind,
    progress,unlocked,
    currentLabel:formatMilestoneValue(safeCurrent,kind),
    targetLabel:formatMilestoneValue(safeTarget,kind),
  };
}

function buildAchievementMilestones(history,customEx={}){
  const entries=Array.isArray(history)?history:[];
  const isDailyHistory=entries.some(entry=>entry?.periodType===PERIOD_TYPES.DAY);
  const streakUnit=isDailyHistory?"day":"week";
  const muscleTotals=Object.fromEntries(MUSCLE_GROUPS.map(group=>[group.id,0]));
  let lifetimeVolume=0,totalPrs=0;

  entries.forEach((entry,index)=>{
    lifetimeVolume+=getTotalVol(entry,customEx);
    totalPrs+=getWeekPRCount(entry,entries.slice(0,index),customEx);
    const volumes=getMuscleVolumes(entry,customEx);
    for(const group of MUSCLE_GROUPS) muscleTotals[group.id]+=volumes[group.id]||0;
  });

  const workoutCount=entries.length;
  const currentStreak=entries.length?calcStreak(entries,customEx):0;
  const milestoneDefs=[];
  const addMilestone=milestone=>milestoneDefs.push(createAchievementMilestone(milestone));

  [1,5,10,25,50].forEach(target=>addMilestone({
    id:`workout_${target}`,
    category:"Workout Milestone",
    title:target===1?"First Workout":`${target} Workouts`,
    description:target===1?"Save your first logged workout.":`Save ${target} total workouts.`,
    current:workoutCount,target,color:"#38BFFF",icon:"WK",
  }));

  [50000,100000,250000,500000,1000000].forEach(target=>addMilestone({
    id:`volume_${target}`,
    category:"Volume Milestone",
    title:`${fmtVol(target)} Lifetime`,
    description:`Reach ${target.toLocaleString()} lbs in total logged volume.`,
    current:lifetimeVolume,target,color:"#7C6FFF",icon:"VOL",kind:"volume",
  }));

  [1,5,10,25,50].forEach(target=>addMilestone({
    id:`prs_${target}`,
    category:"PR Milestone",
    title:target===1?"First PR":`${target} PRs`,
    description:target===1?"Beat a previous lift volume.":`Stack ${target} volume PRs over time.`,
    current:totalPrs,target,color:"#FF5C87",icon:"PR",
  }));

  [2,4,8,12].forEach(target=>addMilestone({
    id:`streak_${target}`,
    category:"Streak Milestone",
    title:`${target}-${streakUnit[0].toUpperCase()+streakUnit.slice(1)} Streak`,
    description:`Keep training momentum moving or log a recovery ${isDailyHistory?"session":"week"}.`,
    current:currentStreak,target,color:"#FFB347",icon:"STK",
  }));

  MUSCLE_GROUPS.forEach(group=>addMilestone({
    id:`muscle_${group.id}`,
    category:"Muscle Milestone",
    title:`${group.label} Specialist`,
    description:`Reach 50,000 lbs of lifetime ${group.label.toLowerCase()} volume.`,
    current:muscleTotals[group.id],target:50000,color:group.color,icon:"MS",kind:"volume",
  }));

  const achievementMilestones=milestoneDefs;
  const unlocked=achievementMilestones.filter(item=>item.unlocked)
    .sort((a,b)=>b.target-a.target||b.progress-a.progress);
  const locked=achievementMilestones.filter(item=>!item.unlocked)
    .sort((a,b)=>b.progress-a.progress||a.target-b.target);
  const nextMilestone=locked[0]||unlocked[0]||null;
  const unlockedCount=unlocked.length;
  const featuredMilestones=[
    nextMilestone,
    ...unlocked.slice(0,3),
    ...locked.slice(0,6),
  ].filter(Boolean).filter((item,index,self)=>self.findIndex(other=>other.id===item.id)===index).slice(0,8);

  return {
    achievementMilestones,
    featuredMilestones,
    unlockedCount,
    nextMilestone,
    totals:{workoutCount,lifetimeVolume,totalPrs,currentStreak,muscleTotals},
  };
}

function AchievementMilestonesPanel({history,customEx}){
  const {achievementMilestones,featuredMilestones,unlockedCount,nextMilestone}=buildAchievementMilestones(history,customEx);
  const totalCount=achievementMilestones.length;
  return(
    <div style={{background:"linear-gradient(145deg,#101512,#070908 78%)",
      border:"1px solid #35423b",borderRadius:6,padding:"14px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:12}}>
        <div>
          <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
            color:"#2DD4A0",fontWeight:900,marginBottom:4}}>Achievements & Milestones</div>
          <div style={{fontSize:11,color:"#87918c",lineHeight:1.45}}>
            {unlockedCount} of {totalCount} unlocked from your saved lifting history.
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:22,color:"#fff",fontWeight:950,lineHeight:1}}>{unlockedCount}</div>
          <div style={{fontSize:9,color:"#2DD4A0",fontWeight:950,marginTop:3}}>unlocked</div>
        </div>
      </div>

      {nextMilestone&&(
        <div style={{background:"#070908",border:`1px solid ${nextMilestone.color}44`,
          borderLeft:`3px solid ${nextMilestone.color}`,borderRadius:5,padding:"11px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:6}}>
            <div style={{minWidth:0}}>
              <div style={{fontSize:8,color:nextMilestone.color,fontWeight:950,
                textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Next Milestone</div>
              <div style={{fontSize:13,color:"#fff",fontWeight:950,whiteSpace:"nowrap",
                overflow:"hidden",textOverflow:"ellipsis"}}>{nextMilestone.title}</div>
            </div>
            <div style={{fontSize:10,color:nextMilestone.color,fontWeight:950,whiteSpace:"nowrap"}}>
              {nextMilestone.currentLabel} / {nextMilestone.targetLabel}
            </div>
          </div>
          <div style={{height:7,background:"#1e2722",borderRadius:99,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${nextMilestone.progress}%`,
              background:`linear-gradient(90deg,${nextMilestone.color},#2DD4A0)`,borderRadius:99}}/>
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(142px,1fr))",gap:8}}>
        {featuredMilestones.map(item=>(
          <div key={item.id} style={{background:item.unlocked?"#121a16":"#070908",
            border:`1px solid ${item.unlocked?item.color+"66":"#1b211f"}`,
            borderRadius:5,padding:"10px 9px",minWidth:0,opacity:item.unlocked?1:0.74}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:7,marginBottom:7}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:`${item.color}18`,
                border:`1px solid ${item.color}44`,display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:8,color:item.color,fontWeight:950,flexShrink:0}}>
                {item.icon}
              </div>
              <div style={{fontSize:8,color:item.unlocked?"#2DD4A0":"#87918c",fontWeight:950,
                textTransform:"uppercase",letterSpacing:"0.08em",whiteSpace:"nowrap"}}>
                {item.unlocked?"Unlocked":"Locked"}
              </div>
            </div>
            <div style={{fontSize:8,color:item.color,fontWeight:950,textTransform:"uppercase",
              letterSpacing:"0.08em",marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",
              textOverflow:"ellipsis"}}>{item.category}</div>
            <div style={{fontSize:12,color:"#fff",fontWeight:950,whiteSpace:"nowrap",
              overflow:"hidden",textOverflow:"ellipsis",marginBottom:4}}>{item.title}</div>
            <div style={{fontSize:9,color:"#87918c",lineHeight:1.35,minHeight:24}}>{item.description}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:6,marginTop:8}}>
              <div style={{fontSize:8,color:"#777",fontWeight:900}}>Progress</div>
              <div style={{fontSize:9,color:item.color,fontWeight:950}}>
                {item.currentLabel} / {item.targetLabel}
              </div>
            </div>
            <div style={{height:5,background:"#1e2722",borderRadius:99,overflow:"hidden",marginTop:5}}>
              <div style={{height:"100%",width:`${item.progress}%`,background:item.color,borderRadius:99}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Balance Radar ────────────────────────────────────────────────────────────
function BalanceRadar({history,goals,customEx,trackingMode,weeklyHistory}){
  const isDaily=trackingMode===TRACKING_MODES.DAILY;
  const radarHistory=isDaily?weeklyHistory:history;
  const latest=radarHistory[radarHistory.length-1]||null;
  const prev=radarHistory.length>1?radarHistory[radarHistory.length-2]:null;
  const baseline=isDaily?(prev||latest):(radarHistory[0]||null);
  const currentVolumes=getMuscleVolumes(latest,customEx);
  const baselineVolumes=getMuscleVolumes(baseline,customEx);
  const goalVolumes=getMuscleGoalVolumes(latest,goals,customEx);
  const prevVolumes=prev?getMuscleVolumes(prev,customEx):null;
  const goalGapRows=MUSCLE_GROUPS.map(group=>{
    const current=currentVolumes[group.id]||0;
    const goal=Math.max(1,goalVolumes[group.id]||0);
    const gap=Math.max(0,100-(current/goal)*100);
    const prevGap=prevVolumes?Math.max(0,100-((prevVolumes[group.id]||0)/goal)*100):null;
    return {group,current,goal,gap,prevGap,delta:prevGap==null?null:prevGap-gap};
  });

  const data=MUSCLE_GROUPS.map(group=>({
    muscle:group.label,
    Current:radarHistory.length?Math.round((currentVolumes[group.id]/Math.max(1,baselineVolumes[group.id]))*100):0,
    Baseline:radarHistory.length?100:0,
    Goal:radarHistory.length?Math.round((goalVolumes[group.id]/Math.max(1,baselineVolumes[group.id]))*100):0,
  }));

  return(
    <div style={{background:"#0a0d0c",border:"1px solid #2a312e",
      borderRadius:6,padding:"14px 14px",marginBottom:16}}>
      <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
        color:"#38BFFF",fontWeight:700,marginBottom:3}}>Muscle Balance Radar</div>
      <p style={{margin:"0 0 4px",fontSize:10,color:"#66706b"}}>
        {radarHistory.length
          ?isDaily
            ?"Current calendar week by muscle group vs. the previous week (100%). Daily saves update this radar immediately."
            :"Current and goal volume by muscle group vs. your starting baseline (100%)."
          :"No logged workouts yet. Every muscle group starts at 0 until the first lift is saved."}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#2a312e" radialLines={false}/>
          <PolarAngleAxis dataKey="muscle" tick={{fill:"#98a19c",fontSize:11,fontWeight:700}}/>
          <Radar name="Baseline" dataKey="Baseline" stroke="#3a4640" fill="#3a4640" fillOpacity={0.15}/>
          <Radar name="Current" dataKey="Current" stroke="#7C6FFF" fill="#7C6FFF" fillOpacity={0.25}
            dot={{r:4,fill:"#7C6FFF",strokeWidth:0}}/>
          <Radar name="Goals" dataKey="Goal" stroke="#2DD4A0" fill="#2DD4A0" fillOpacity={0.12}
            dot={{r:3,fill:"#2DD4A0",strokeWidth:0}}/>
          <Tooltip formatter={(v,n)=>[`${v}%`,n]}
            contentStyle={{background:"#0a0d0c",border:"1px solid #3a4640",borderRadius:8,fontSize:11}}
            labelStyle={{color:"#fff"}}/>
          <Legend wrapperStyle={{fontSize:10,paddingTop:4}}
            formatter={v=><span style={{color:"#98a19c"}}>{v}</span>}/>
        </RadarChart>
      </ResponsiveContainer>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginTop:6}}>
        {goalGapRows.map(({group,current,goal,gap,delta})=>(
          <div key={group.id} style={{background:"#070908",border:`1px solid ${group.color}22`,
            borderRadius:8,padding:"7px 6px",minWidth:0}}>
            <div style={{fontSize:8,color:group.color,fontWeight:800,marginBottom:3,
              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{group.label}</div>
            <div style={{fontSize:13,color:"#fff",fontWeight:900}}>{gap.toFixed(0)}%</div>
            <div style={{fontSize:8,color:"#747e79",marginTop:1}}>away</div>
            {delta!=null&&(
              <div style={{fontSize:9,fontWeight:800,color:delta>=0?"#2DD4A0":"#FF5C87",marginTop:4}}>
                {delta>=0?"closer":"farther"} {Math.abs(delta).toFixed(0)}%
              </div>
            )}
            {delta==null&&<div style={{fontSize:9,color:"#46514b",marginTop:4}}>new</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 1RM chart ────────────────────────────────────────────────────────────────
function OneRMChart({history,customEx}){
  const tops=DAY_KEYS.map(dk=>{
    const best=exerciseCatalogForDay(dk,customEx).reduce((b,ex)=>{
      const d=getLastLiftForExercise(history,ex.id)?.lift;
      if(!d) return b;
      const rm=epley1RM(d.w,d.r);
      return rm>(b?.rm??0)?{ex,rm}:b;
    },null);
    return best?{ex:best.ex,dk}:null;
  }).filter(Boolean);

  const chartData=history.map((entry,i)=>{
    const row={week:getEntryShortLabel(entry,i)};
    for(const {ex,dk} of tops){
      const d=entry.exercises[ex.id];
      if(d) row[ex.name]=epley1RM(d.w,d.r);
    }
    return row;
  });

  return(
    <div style={{background:"#0a0d0c",border:"1px solid #2a312e",
      borderRadius:6,padding:"14px 14px",marginBottom:16}}>
      <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
        color:"#FFB347",fontWeight:700,marginBottom:3}}>Estimated 1-Rep Max</div>
      <p style={{margin:"0 0 10px",fontSize:10,color:"#66706b"}}>Epley formula. Top lift per day.</p>
      <ResponsiveContainer width="100%" height={170}>
        <LineChart data={chartData} margin={{top:4,right:4,left:0,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#212a25"/>
          <XAxis dataKey="week" tick={{fill:"#747e79",fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis tick={{fill:"#747e79",fontSize:10}} axisLine={false} tickLine={false}
            tickFormatter={v=>`${v}lb`} width={36}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Legend wrapperStyle={{fontSize:10,paddingTop:4}}
            formatter={v=><span style={{color:"#98a19c"}}>{v}</span>}/>
          {tops.map(({ex,dk})=>(
            <Line key={ex.id} type="monotone" dataKey={ex.name}
              stroke={DAYS[dk].accent} strokeWidth={2.5}
              dot={{r:3.5,fill:DAYS[dk].accent,strokeWidth:0}} activeDot={{r:5}} connectNulls/>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Total Volume View ────────────────────────────────────────────────────────
function TotalVolumeView({history,weeklyHistory=[],trackingMode,goals,customEx,onStartAdaptivePlan,onSaveCoachProfile,onGenerateCoachProgram,onStartCoachPlanDay,hasDraft,onNavigate,advancedAnalyticsAccess,onUpgrade}){
  const isDaily=trackingMode===TRACKING_MODES.DAILY;
  const planningHistory=isDaily?weeklyHistory:history;
  const overallData=history.map((entry,i)=>{
    const row={week:getEntryShortLabel(entry,i)};
    for(const dk of DAY_KEYS) row[DAYS[dk].shortLabel]=getDayVol(entry,dk,customEx);
    return row;
  });

  return(
    <div className="earned-workout-view earned-workout-view--today">
      <StarterLaunchpad history={history} goals={goals} customEx={customEx} onNavigate={onNavigate}/>
      <InsightsPanel history={history} customEx={customEx}/>

      <details className="earned-disclosure">
        <summary>
          <span>01 / PREMIUM INTELLIGENCE</span>
          <strong>Performance Lab</strong>
          <small>Plans, progression, fatigue, recovery, quality, and training alerts</small>
          <b aria-hidden="true">+</b>
        </summary>
        <div className="earned-disclosure__content">
          <TrainingMomentumCoach history={history} customEx={customEx}
            onStartPlan={onStartAdaptivePlan} hasDraft={hasDraft}/>
          <PremiumGate access={advancedAnalyticsAccess}
            title="Advanced training intelligence"
            description="Unlock fatigue, recovery, training-quality, correlation, and adaptive-program insights."
            onUpgrade={onUpgrade}>
            <AdaptiveWorkoutPlan history={history} customEx={customEx}
              onStartPlan={onStartAdaptivePlan} hasDraft={hasDraft}/>
            <WorkoutSchedulePlanner history={history} customEx={customEx}
              onStartPlan={onStartAdaptivePlan} hasDraft={hasDraft}/>
            <CoachProgramBuilder history={planningHistory} goals={goals} customEx={customEx}
              onSaveCoachProfile={onSaveCoachProfile}
              onGenerateCoachProgram={onGenerateCoachProgram}
              onStartCoachPlanDay={onStartCoachPlanDay}/>
            <ProgressiveOverloadCoach history={history} customEx={customEx}/>
            <TrainingQualityScore history={history} customEx={customEx}/>
            <TrainingQualityBreakdown history={history} customEx={customEx}/>
            <FatigueTrendPanel history={history} customEx={customEx}/>
            <RecoveryForecastPanel history={history} customEx={customEx}/>
            <PerformanceCorrelationLab history={history} customEx={customEx}/>
            <JointStressGuardrails history={history} customEx={customEx}/>
            <MusclePerformanceAlerts history={planningHistory} customEx={customEx}/>
            <MuscleDriftMonitor history={planningHistory} customEx={customEx}/>
            <NextWorkoutCoach history={history} customEx={customEx}/>
            <RecoveryScore history={history} customEx={customEx}/>
          </PremiumGate>
        </div>
      </details>

      <details className="earned-disclosure">
        <summary>
          <span>02 / MOMENTUM</span>
          <strong>Progress & Rewards</strong>
          <small>Achievements, calendar, consistency, muscle balance, and PR timeline</small>
          <b aria-hidden="true">+</b>
        </summary>
        <div className="earned-disclosure__content">
          <AchievementMilestonesPanel history={history} customEx={customEx}/>
          <WorkoutCalendar history={history} customEx={customEx}/>
          <VolumeHeatmap history={history} customEx={customEx}/>
          <MuscleTrendCards history={history} customEx={customEx}/>
          <BalanceRadar history={history} weeklyHistory={weeklyHistory} trackingMode={trackingMode}
            goals={goals} customEx={customEx}/>
          <PRTimeline history={history} customEx={customEx}/>
        </div>
      </details>

      <details className="earned-disclosure">
        <summary>
          <span>03 / HISTORY</span>
          <strong>Detailed Volume Charts</strong>
          <small>Combined volume, estimated strength, and split-by-split progression</small>
          <b aria-hidden="true">+</b>
        </summary>
        <div className="earned-disclosure__content">

      <div style={{background:"#0a0d0c",borderRadius:6,padding:"16px 14px",
        border:"1px solid #2a312e",marginBottom:16}}>
        <div style={{fontSize:9,letterSpacing:"0.13em",textTransform:"uppercase",
          color:"#7C6FFF",fontWeight:700,marginBottom:3}}>All Days Combined</div>
        <h2 style={{margin:"0 0 12px",fontSize:16,fontWeight:900,color:"#fff"}}>
          {isDaily?"Session Volume Progression":"Weekly Total Volume"}
        </h2>
        <ResponsiveContainer width="100%" height={185}>
          <AreaChart data={overallData} margin={{top:4,right:4,left:0,bottom:0}}>
            <defs>
              {DAY_KEYS.map(dk=>(
                <linearGradient key={dk} id={`grad_${dk}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={DAYS[dk].accent} stopOpacity={0.28}/>
                  <stop offset="95%" stopColor={DAYS[dk].accent} stopOpacity={0.01}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#212a25"/>
            <XAxis dataKey="week" tick={{fill:"#747e79",fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:"#747e79",fontSize:10}} axisLine={false} tickLine={false}
              tickFormatter={v=>`${(v/1000).toFixed(0)}k`} width={32}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:10,paddingTop:6}}
              formatter={v=><span style={{color:"#777"}}>{v}</span>}/>
            {DAY_KEYS.map(dk=>(
              <Area key={dk} type="monotone" dataKey={DAYS[dk].shortLabel}
                stroke={DAYS[dk].accent} strokeWidth={2}
                fill={`url(#grad_${dk})`} connectNulls/>
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {history.length>=2&&<OneRMChart history={history} customEx={customEx}/>}

      {DAY_KEYS.map(dk=>{
        const day=DAYS[dk];
        const dayHistory=history.filter(entry=>getDayVol(entry,dk,customEx)>0);
        const chartData=dayHistory.map(entry=>({
          week:getEntryShortLabel(entry,history.indexOf(entry)),
          Volume:getDayVol(entry,dk,customEx),
        }));
        const latest=getDayVol(dayHistory[dayHistory.length-1],dk,customEx);
        const prev=dayHistory.length>1?getDayVol(dayHistory[dayHistory.length-2],dk,customEx):null;
        const diff=prev!=null?latest-prev:null;
        const bestVol=Math.max(0,...dayHistory.map(e=>getDayVol(e,dk,customEx)));
        const isPR=latest===bestVol&&dayHistory.length>1;
        return(
          <div key={dk} style={{background:"#0a0d0c",borderRadius:6,padding:"14px 14px",
            border:"1px solid #2a312e",borderLeft:`3px solid ${day.accent}`,marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div>
                <div style={{fontSize:8,letterSpacing:"0.12em",textTransform:"uppercase",
                  color:day.accent,fontWeight:700,marginBottom:3}}>Day Volume</div>
                <h3 style={{margin:0,fontSize:14,fontWeight:900,color:"#fff"}}>
                  {day.label}{isPR&&<PRBadge/>}
                </h3>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:0}}>
                  {latest.toLocaleString()}<span style={{fontSize:10,color:"#87918c",marginLeft:3}}>lbs</span>
                </div>
                {diff!=null&&(
                  <div style={{fontSize:10,fontWeight:700,color:diff>=0?"#2DD4A0":"#FF5C87",marginTop:1}}>
                    {diff>=0?"▲":"▼"} {Math.abs(diff).toLocaleString()} ({pct(latest,prev)}%)
                  </div>
                )}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <AreaChart data={chartData} margin={{top:4,right:4,left:0,bottom:0}}>
                <defs>
                  <linearGradient id={`area_${dk}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={day.accent} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={day.accent} stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#212a25"/>
                <XAxis dataKey="week" tick={{fill:"#747e79",fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#747e79",fontSize:10}} axisLine={false} tickLine={false}
                  tickFormatter={v=>`${(v/1000).toFixed(1)}k`} width={32}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area type="monotone" dataKey="Volume" stroke={day.accent} strokeWidth={2.5}
                  fill={`url(#area_${dk})`}
                  dot={{r:3.5,fill:day.accent,strokeWidth:0}} activeDot={{r:5}} connectNulls/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      })}
        </div>
      </details>
    </div>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────
function ExerciseCard({ex,history,dayAccent,goals,onSetGoal,onDeleteCustom}){
  const [expanded,setExpanded]=useState(false);
  const [tab,setTab]=useState("volume");
  const color=dayAccent;
  const progressLab=buildPerLiftProgressLab(ex,history);
  const chartData=progressLab.chartData;
  const recentLiftRows=progressLab.recentLiftRows;

  const loggedHistory=history.filter(entry=>entry?.exercises?.[ex.id]?.volume>0);
  const latest=loggedHistory[loggedHistory.length-1]?.exercises[ex.id];
  const prev=loggedHistory.length>1?loggedHistory[loggedHistory.length-2]?.exercises[ex.id]:null;
  const diff=latest&&prev?latest.volume-prev.volume:null;
  const bestVol=progressLab.bestVolume;
  const isPR=latest&&latest.volume===bestVol&&loggedHistory.length>1;
  const rm=latest?epley1RM(latest.w,latest.r):null;
  const goal=goals?.[ex.id];

  return(
    <div style={{background:"#070908",borderRadius:6,padding:"12px",
      border:"1px solid #1b211f",marginBottom:9,transition:"border-color 0.2s",cursor:"pointer"}}
      onMouseEnter={e=>e.currentTarget.style.borderColor=color+"44"}
      onMouseLeave={e=>e.currentTarget.style.borderColor="#1b211f"}>
      <div onClick={()=>setExpanded(e=>!e)}
        style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",
          marginBottom:expanded?10:0}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:700,color:"#ddd",marginBottom:1}}>
            {ex.name}{isPR&&<PRBadge/>}
            {ex.isCustom&&<span style={{fontSize:8,color:"#38BFFF",marginLeft:5,
              border:"1px solid #38BFFF33",borderRadius:4,padding:"1px 4px"}}>CUSTOM</span>}
          </div>
          {ex.note&&<div style={{fontSize:10,color:"#46514b"}}>{ex.note}</div>}
          {latest&&(
            <div style={{fontSize:10,color:"#66706b",marginTop:2}}>
              {latest.w}lbs × {latest.r}r × {latest.s}s
              {rm&&<span style={{color:"#747e79"}}> · 1RM ~{rm}lbs</span>}
            </div>
          )}
        </div>
        <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
          {latest&&(
            <div style={{fontSize:13,fontWeight:800,color:"#fff"}}>
              {latest.volume.toLocaleString()}<span style={{fontSize:9,color:"#87918c",marginLeft:3}}>lbs vol</span>
            </div>
          )}
          {diff!=null&&(
            <div style={{fontSize:10,fontWeight:700,color:diff>=0?"#2DD4A0":"#FF5C87"}}>
              {diff>=0?"▲":"▼"} {Math.abs(diff).toLocaleString()}
            </div>
          )}
          <div style={{fontSize:9,color:"#252d29",marginTop:3}}>{expanded?"▲ close":"▼ chart"}</div>
        </div>
      </div>

      {latest&&goal&&(
        <GoalBar current={latest.volume} goal={goal} color={color}/>
      )}

      {expanded&&(
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{display:"flex",gap:6}}>
              {[["volume","Volume"],["1rm","Est. 1RM"],["weight","Weight"]].map(([id,lbl])=>(
                <button key={id} onClick={e=>{e.stopPropagation();setTab(id);}} style={{
                  padding:"3px 9px",borderRadius:6,border:"none",
                  background:tab===id?color:"#1b211f",
                  color:tab===id?"#fff":"#66706b",fontSize:10,fontWeight:700,cursor:"pointer"}}>
                  {lbl}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={e=>{e.stopPropagation();onSetGoal(ex.id,ex.name);}} style={{
                background:"none",border:"1px solid #252d29",color:"#747e79",
                borderRadius:6,padding:"3px 8px",fontSize:9,cursor:"pointer"}}>
                {goal?"Edit goal":"+ Goal"}
              </button>
              {ex.isCustom&&onDeleteCustom&&(
                <button onClick={e=>{e.stopPropagation();
                  if(confirm(`Remove "${ex.name}" from your routine? Past logged data for it will be kept in history.`))
                    onDeleteCustom(ex.id);}}
                  style={{background:"none",border:"1px solid #2a1a1a",color:"#5a2a2a",
                    borderRadius:6,padding:"3px 8px",fontSize:9,cursor:"pointer"}}>
                  Remove
                </button>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={chartData} margin={{top:4,right:4,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#181e1b"/>
              <XAxis dataKey="week" tick={{fill:"#66706b",fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#66706b",fontSize:9}} axisLine={false} tickLine={false}
                tickFormatter={v=>v>=1000?`${(v/1000).toFixed(1)}k`:v} width={30}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Line type="monotone"
                dataKey={tab==="volume"?"Volume":tab==="1rm"?"Est. 1RM":"Weight"}
                stroke={color} strokeWidth={2.5}
                dot={{r:3.5,fill:color,strokeWidth:0}} activeDot={{r:5}} connectNulls/>
              {tab==="volume"&&goal&&(
                <ReferenceLine y={goal} stroke={color} strokeDasharray="4 3" strokeOpacity={0.5}
                  label={{value:"Goal",fill:color,fontSize:9,position:"right"}}/>
              )}
            </LineChart>
          </ResponsiveContainer>
          <div style={{background:"#0a0d0c",border:`1px solid ${color}22`,
            borderRadius:5,padding:"10px",marginTop:10}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"baseline",marginBottom:9}}>
              <div>
                <div style={{fontSize:8,color:color,fontWeight:950,
                  textTransform:"uppercase",letterSpacing:"0.1em"}}>Per-Lift Progress Lab</div>
                <div style={{fontSize:9,color:"#87918c",fontWeight:800,marginTop:3}}>
                  Strength signal, recent volume, and next action for this movement.
                </div>
              </div>
              <div style={{fontSize:8,color:"#777",fontWeight:900,whiteSpace:"nowrap"}}>
                {progressLab.consistency} log{progressLab.consistency===1?"":"s"}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:6,marginBottom:9}}>
              {[
                ["Estimated 1RM",progressLab.latestEstimatedOneRM?`${progressLab.latestEstimatedOneRM} lbs`:"--","#FFB347"],
                ["Best Set",progressLab.bestSet,"#2DD4A0"],
                ["Volume Trend",`${progressLab.volumeTrend>=0?"+":""}${progressLab.volumeTrend.toLocaleString()} lbs`,"#38BFFF"],
                ["Recent Avg",progressLab.recentAverageVolume?`${progressLab.recentAverageVolume.toLocaleString()} lbs`:"--","#7C6FFF"],
              ].map(([label,value,metricColor])=>(
                <div key={label} style={{background:"#070908",border:`1px solid ${metricColor}22`,
                  borderRadius:8,padding:"7px",minWidth:0}}>
                  <div style={{fontSize:7,color:metricColor,fontWeight:950,
                    textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4,
                    whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</div>
                  <div style={{fontSize:10,color:"#ddd",fontWeight:900,
                    whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1.1fr",gap:8}}>
              <div style={{background:"#070908",border:"1px solid #202923",
                borderRadius:8,padding:"8px",minWidth:0}}>
                <div style={{fontSize:8,color:"#38BFFF",fontWeight:950,
                  textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Recent Logs</div>
                {recentLiftRows.length?(
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    {recentLiftRows.slice(0,3).map(row=>(
                      <div key={`${ex.id}_${row.week}`} style={{display:"grid",
                        gridTemplateColumns:"34px 1fr auto",gap:6,alignItems:"center"}}>
                        <div style={{fontSize:8,color:"#87918c",fontWeight:950}}>{row.week}</div>
                        <div style={{fontSize:9,color:"#aaa",fontWeight:800,
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {row.weight} x {row.reps} x {row.sets}
                        </div>
                        <div style={{fontSize:8,color:"#777",fontWeight:900,whiteSpace:"nowrap"}}>
                          {row.volume.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ):(
                  <div style={{fontSize:9,color:"#87918c",lineHeight:1.35,fontWeight:800}}>
                    No saved logs for this lift yet.
                  </div>
                )}
              </div>
              <div style={{background:"#070908",border:"1px solid #202923",
                borderRadius:8,padding:"8px",minWidth:0}}>
                <div style={{fontSize:8,color:"#2DD4A0",fontWeight:950,
                  textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Next Cue</div>
                <div style={{fontSize:10,color:"#aaa",lineHeight:1.45,fontWeight:800}}>
                  {progressLab.nextCue}
                </div>
                {progressLab.volumeTrendPct!==0&&(
                  <div style={{fontSize:8,color:progressLab.volumeTrendPct>0?"#2DD4A0":"#FF5C87",
                    fontWeight:900,marginTop:7}}>
                    {progressLab.volumeTrendPct>0?"+":""}{progressLab.volumeTrendPct}% vs previous logged session
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Day Section ──────────────────────────────────────────────────────────────
function DaySection({dayKey,history,goals,onSetGoal,customEx,onDeleteCustom}){
  const day=DAYS[dayKey];
  const [collapsed,setCollapsed]=useState(false);
  const dayHistory=history.filter(entry=>getDayVol(entry,dayKey,customEx)>0);
  const latest=dayHistory[dayHistory.length-1];
  const prev=dayHistory.length>1?dayHistory[dayHistory.length-2]:null;
  const dayVol=getDayVol(latest,dayKey,customEx);
  const prevVol=prev?getDayVol(prev,dayKey,customEx):null;
  const diff=prevVol!=null?dayVol-prevVol:null;
  return(
    <div className="earned-progress-day" data-day={dayKey}
      style={{background:"#0a0d0c",borderRadius:6,padding:"13px",
      border:"1px solid #2a312e",borderLeft:`3px solid ${day.accent}`,marginBottom:12}}>
      <div onClick={()=>setCollapsed(c=>!c)} style={{display:"flex",justifyContent:"space-between",
        alignItems:"center",marginBottom:collapsed?0:12,cursor:"pointer",userSelect:"none"}}>
        <div>
          <div style={{fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",
            color:day.accent,fontWeight:700,marginBottom:2}}>Workout Day</div>
          <h2 style={{margin:0,fontSize:15,fontWeight:900,color:"#fff"}}>{day.label}</h2>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>
              {dayVol.toLocaleString()} <span style={{fontSize:9,color:"#87918c"}}>lbs</span>
            </div>
            {diff!=null&&(
              <div style={{fontSize:10,fontWeight:700,color:diff>=0?"#2DD4A0":"#FF5C87"}}>
                {diff>=0?"▲":"▼"} {Math.abs(diff).toLocaleString()}
              </div>
            )}
          </div>
          <div style={{fontSize:12,color:"#46514b"}}>{collapsed?"▶":"▼"}</div>
        </div>
      </div>
      {!collapsed&&allExercises(dayKey,customEx).map(ex=>(
        <ExerciseCard key={ex.id} ex={ex} history={history} dayAccent={day.accent}
          goals={goals} onSetGoal={onSetGoal} onDeleteCustom={onDeleteCustom}/>
      ))}
    </div>
  );
}

// ─── PR Wall ──────────────────────────────────────────────────────────────────
function PRWall({history,customEx}){
  const prs=getAllTimePRs(history,customEx);
  const [activeDk,setActiveDk]=useState("bicepsShoulders");
  return(
    <div className="earned-workout-view earned-workout-view--records">
      <div className="earned-record-filter" style={{display:"flex",gap:6,marginBottom:14}}>
        {DAY_KEYS.map(dk=>(
          <button key={dk} onClick={()=>setActiveDk(dk)} style={{
            flex:1,padding:"8px 4px",borderRadius:9,border:"none",cursor:"pointer",
            fontSize:10,fontWeight:800,
            background:activeDk===dk?DAYS[dk].accent:"#0a0d0c",
            color:activeDk===dk?"#fff":"#66706b",
            outline:activeDk!==dk?`1px solid ${DAYS[dk].accent}22`:"none",
          }}>{DAYS[dk].shortLabel}</button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {allExercises(activeDk,customEx).map(ex=>{
          const pr=prs[ex.id];
          if(!pr) return null;
          return(
            <div key={ex.id} className="earned-record-card"
              style={{background:"#0a0d0c",borderRadius:6,padding:"14px",
              border:"1px solid #2a312e",borderLeft:`3px solid ${DAYS[activeDk].accent}`}}>
              <div style={{fontSize:12,fontWeight:700,color:"#ddd",marginBottom:10}}>
                {ex.name}
                {ex.isCustom&&<span style={{fontSize:8,color:"#38BFFF",marginLeft:5,
                  border:"1px solid #38BFFF33",borderRadius:4,padding:"1px 4px"}}>CUSTOM</span>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[
                  {label:"Best Volume",value:`${pr.bestVol.toLocaleString()} lbs`,date:pr.bestVolDate,color:"#7C6FFF"},
                  {label:"Best Weight",value:`${pr.bestW} lbs`,date:pr.bestWDate,color:"#FF5C87"},
                  {label:"Best Reps",value:`${pr.bestR} reps`,date:null,color:"#2DD4A0"},
                  {label:"Est. 1RM",value:`${pr.best1RM} lbs`,date:pr.best1RMDate,color:"#FFB347"},
                ].map(({label,value,date,color})=>(
                  <div key={label} className="earned-record-card__metric" style={{background:"#070908",borderRadius:9,
                    padding:"10px 10px",border:`1px solid ${color}18`}}>
                    <div style={{fontSize:8,color:color,textTransform:"uppercase",
                      letterSpacing:"0.1em",fontWeight:700,marginBottom:3}}>{label}</div>
                    <div style={{fontSize:14,fontWeight:900,color:"#fff"}}>{value}</div>
                    {date&&<div style={{fontSize:9,color:"#66706b",marginTop:2}}>{date}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExerciseNotesPanel({ex,noteRecord,onSaveExerciseNote,compact=false}){
  const saved=noteRecord||{note:"",updatedAt:null};
  const [draft,setDraft]=useState(saved.note||"");
  useEffect(()=>{ setDraft(saved.note||""); },[ex?.id,saved.note]);
  const changed=draft.trim()!==(saved.note||"");
  const save=()=>{ if(ex?.id) onSaveExerciseNote?.(ex.id,draft); };
  return(
    <div style={{background:compact?"#070908":"#0b0f0d",border:"1px solid #35423b",
      borderRadius:5,padding:compact?"10px":"11px",marginBottom:compact?0:10}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"baseline",marginBottom:7}}>
        <div>
          <div style={{fontSize:8,color:"#38BFFF",fontWeight:950,
            textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>Private Exercise Notes</div>
          <div style={{fontSize:compact?11:12,color:"#fff",fontWeight:950}}>Setup Memory</div>
        </div>
        {saved.updatedAt&&(
          <div style={{fontSize:8,color:"#87918c",fontWeight:900,whiteSpace:"nowrap"}}>
            Saved {new Date(saved.updatedAt).toLocaleDateString([],{month:"short",day:"numeric"})}
          </div>
        )}
      </div>
      <textarea value={draft} onChange={event=>setDraft(event.target.value.slice(0,240))}
        placeholder="Seat / Grip / Cue"
        rows={compact?2:3}
        style={{width:"100%",boxSizing:"border-box",resize:"vertical",minHeight:compact?48:64,
          background:"#050706",border:"1px solid #252d29",borderRadius:8,color:"#fff",
          padding:"8px 9px",fontSize:10,fontWeight:800,lineHeight:1.4,outline:"none",
          marginBottom:7}}/>
      <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"}}>
        <div style={{fontSize:8,color:"#87918c",fontWeight:800,lineHeight:1.3}}>
          Exercise notes are private and never appear in public sharing.
        </div>
        <button onClick={save} disabled={!changed}
          style={{border:"none",borderRadius:8,padding:"7px 9px",
            background:changed?"#38BFFF":"#1b211f",color:changed?"#06101a":"#747e79",
            fontSize:9,fontWeight:950,cursor:changed?"pointer":"default",whiteSpace:"nowrap"}}>
          Save Note
        </button>
      </div>
    </div>
  );
}

function TechniqueCoachPanel({coach,compact=false}){
  if(!coach) return null;
  const sections=[
    ["Setup Checklist",coach.setupChecklist,"#38BFFF"],
    ["Rep Execution",coach.repExecution,"#2DD4A0"],
    ["Safety Checks",coach.safetyChecks,"#FF5C87"],
  ];
  return(
    <div style={{background:compact?"#070908":"#0b0f0d",border:"1px solid #35423b",
      borderRadius:5,padding:compact?"10px":"11px",marginBottom:compact?0:10}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"baseline",marginBottom:8}}>
        <div>
          <div style={{fontSize:8,color:"#FFB347",fontWeight:950,
            textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>Technique Coach</div>
          <div style={{fontSize:compact?11:12,color:"#fff",fontWeight:950,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{coach.title}</div>
        </div>
        <div style={{fontSize:8,color:"#87918c",fontWeight:900,whiteSpace:"nowrap"}}>{coach.dayLabel}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:compact?"1fr":"repeat(3,minmax(0,1fr))",
        gap:7,marginBottom:7}}>
        {sections.map(([label,items,color])=>(
          <div key={label} style={{background:"#050706",border:`1px solid ${color}22`,
            borderRadius:8,padding:"8px",minWidth:0}}>
            <div style={{fontSize:7,color,fontWeight:950,textTransform:"uppercase",
              letterSpacing:"0.08em",marginBottom:5}}>{label}</div>
            {(items||[]).slice(0,compact?2:3).map(item=>(
              <div key={item} style={{fontSize:9,color:"#aaa",lineHeight:1.35,marginBottom:4}}>
                - {item}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{background:"#050706",border:"1px solid #FFB34722",borderRadius:8,
        padding:"8px"}}>
        <div style={{fontSize:7,color:"#FFB347",fontWeight:950,textTransform:"uppercase",
          letterSpacing:"0.08em",marginBottom:4}}>Progression Tip</div>
        <div style={{fontSize:9,color:"#aaa",lineHeight:1.35}}>{coach.progressionTip}</div>
      </div>
    </div>
  );
}

function ProgramPacksPanel({customEx,onStartProgramPackDay}){
  const programPacks=buildProgramPacks(customEx);
  const [openPack,setOpenPack]=useState(programPacks[0]?.id||"");
  return(
    <div style={{background:"linear-gradient(145deg,#111512,#071622 76%)",
      border:"1px solid #24304f",borderRadius:6,padding:"14px",marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:12}}>
        <div>
          <div style={{fontSize:9,color:"#FFB347",fontWeight:950,
            textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4}}>Premium Program Packs</div>
          <div style={{fontSize:18,color:"#fff",fontWeight:950,lineHeight:1.1}}>Curated training plans</div>
          <div style={{fontSize:11,color:"#566",lineHeight:1.45,marginTop:5}}>
            Trainer-style routines built from your current exercise catalog.
          </div>
        </div>
        <div style={{fontSize:10,color:"#2DD4A0",fontWeight:950,whiteSpace:"nowrap"}}>
          {programPacks.length} packs
        </div>
      </div>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:3,marginBottom:10}}>
        {programPacks.map(pack=>(
          <button key={pack.id} onClick={()=>setOpenPack(pack.id)}
            style={{border:`1px solid ${openPack===pack.id?`${pack.color}77`:"#252d29"}`,
              background:openPack===pack.id?`${pack.color}18`:"#070908",
              color:openPack===pack.id?pack.color:"#87918c",
              borderRadius:999,padding:"8px 10px",fontSize:10,fontWeight:950,
              cursor:"pointer",whiteSpace:"nowrap"}}>
            {pack.title}
          </button>
        ))}
      </div>
      {programPacks.filter(pack=>pack.id===openPack).map(pack=>(
        <div key={pack.id} style={{background:"#070908",border:`1px solid ${pack.color}33`,
          borderRadius:6,padding:"11px"}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",marginBottom:9}}>
            <div style={{minWidth:0}}>
              <div style={{fontSize:14,color:"#fff",fontWeight:950,marginBottom:3}}>{pack.title}</div>
              <div style={{fontSize:10,color:"#777",lineHeight:1.45}}>{pack.goal}</div>
            </div>
            <div style={{fontSize:9,color:pack.color,fontWeight:950,whiteSpace:"nowrap"}}>{pack.length}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10}}>
            {[["Style",pack.style],["Coach Note",pack.note]].map(([label,value])=>(
              <div key={label} style={{background:"#0a0d0c",border:"1px solid #202923",
                borderRadius:8,padding:"8px"}}>
                <div style={{fontSize:7,color:pack.color,fontWeight:950,
                  textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{label}</div>
                <div style={{fontSize:9,color:"#aaa",lineHeight:1.35}}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {pack.days.map(day=>(
              <div key={day.id} style={{display:"grid",gridTemplateColumns:"1fr auto",
                gap:9,alignItems:"center",background:"#0a0d0c",border:"1px solid #222b26",
                borderRadius:9,padding:"9px"}}>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:11,color:"#fff",fontWeight:950,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {day.label}: {day.focus}
                  </div>
                  <div style={{fontSize:8,color:"#87918c",fontWeight:800,marginTop:3,lineHeight:1.35}}>
                    {DAYS[day.dayKey]?.shortLabel||"Day"} - {day.exercises.length} exercises - {day.reason}
                  </div>
                </div>
                <button onClick={()=>onStartProgramPackDay?.(day)}
                  style={{border:"none",borderRadius:8,padding:"8px 9px",
                    background:pack.color,color:"#071000",fontSize:9,
                    fontWeight:950,cursor:"pointer",whiteSpace:"nowrap"}}>
                  Start Program Day
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ExerciseLibraryView({history,customEx,onStartLibraryWorkout,onStartProgramPackDay,onSaveExerciseNote,programPacksAccess,onUpgrade}){
  const [query,setQuery]=useState("");
  const [groupFilter,setGroupFilter]=useState("all");
  const [equipmentFilter,setEquipmentFilter]=useState("all");
  const [difficultyFilter,setDifficultyFilter]=useState("all");
  const [open,setOpen]=useState(null);
  const catalog=DAY_KEYS.flatMap(dk=>
    allExercises(dk,customEx).map(ex=>({ex,dk,profile:getExerciseProfile(ex,dk)}))
  );
  const filtered=catalog.filter(({ex,profile})=>{
    const q=query.trim().toLowerCase();
    return (!q||ex.name.toLowerCase().includes(q)||profile.target.toLowerCase().includes(q))
      &&(groupFilter==="all"||profile.group===groupFilter)
      &&(equipmentFilter==="all"||profile.equipment===equipmentFilter)
      &&(difficultyFilter==="all"||profile.difficulty===difficultyFilter);
  });
  const handleArmoryKeyDown=(event,index,key)=>{
    if(!filtered.length) return;
    if(event.key==="Enter"){
      event.preventDefault();
      setOpen(current=>current===key?null:key);
      return;
    }
    const isArrowDown=event.key==="ArrowDown";
    const isArrowUp=event.key==="ArrowUp";
    if(!isArrowDown&&!isArrowUp) return;
    event.preventDefault();
    const direction=isArrowDown?1:-1;
    const nextIndex=(index+direction+filtered.length)%filtered.length;
    const next=filtered[nextIndex];
    setOpen(`${next.dk}_${next.ex.id}`);
    requestAnimationFrame(()=>document.querySelector(`[data-armory-index="${nextIndex}"]`)?.focus());
  };

  return(
    <div className="earned-workout-view earned-workout-view--library">
      <PremiumGate access={programPacksAccess}
        title="Curated program packs"
        description="Unlock trainer-style routines built around your available exercises."
        onUpgrade={onUpgrade} previewLabel="Premium Programs Preview">
        <ProgramPacksPanel customEx={customEx} onStartProgramPackDay={onStartProgramPackDay}/>
      </PremiumGate>
      <div className="earned-library-toolbar" style={{background:"#0a0d0c",border:"1px solid #2a312e",borderRadius:6,
        padding:"14px",marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:10}}>
          <div>
            <div aria-label="Exercise Library Pro" style={{fontSize:9,color:"#38BFFF",fontWeight:900,
              textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4}}>ARMORY / EXERCISE INDEX</div>
            <div style={{fontSize:11,color:"#87918c",lineHeight:1.4}}>
              $ ls -la /earned/exercises - inspect movement paths, targets, setup, and training history.
            </div>
          </div>
          <div style={{fontSize:10,color:"#2DD4A0",fontWeight:950,whiteSpace:"nowrap"}}>
            {filtered.length}/{catalog.length}
          </div>
        </div>
        <input value={query} onChange={e=>setQuery(e.target.value)}
          placeholder="Search exercises or muscles"
          style={{width:"100%",background:"#070908",border:"1px solid #252d29",
            borderRadius:9,color:"#fff",padding:"11px 12px",fontSize:13,
            fontWeight:700,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
        <div style={{fontSize:8,color:"#87918c",fontWeight:900,textTransform:"uppercase",
          letterSpacing:"0.1em",marginBottom:6}}>Muscle</div>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
          {[{id:"all",label:"All",color:"#7C6FFF"},...MUSCLE_GROUPS].map(group=>(
            <button key={group.id} onClick={()=>setGroupFilter(group.id)} style={{
              border:`1px solid ${groupFilter===group.id?group.color+"77":"#252d29"}`,
              background:groupFilter===group.id?group.color+"22":"#070908",
              color:groupFilter===group.id?group.color:"#87918c",
              borderRadius:999,padding:"7px 10px",fontSize:10,fontWeight:900,
              cursor:"pointer",whiteSpace:"nowrap"}}>
              {group.label}
            </button>
          ))}
        </div>
        <div style={{fontSize:8,color:"#87918c",fontWeight:900,textTransform:"uppercase",
          letterSpacing:"0.1em",margin:"10px 0 6px"}}>Equipment</div>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
          {LIBRARY_EQUIPMENT.map(item=>(
            <button key={item.id} onClick={()=>setEquipmentFilter(item.id)} style={{
              border:`1px solid ${equipmentFilter===item.id?"#38BFFF77":"#252d29"}`,
              background:equipmentFilter===item.id?"#061422":"#070908",
              color:equipmentFilter===item.id?"#38BFFF":"#87918c",
              borderRadius:999,padding:"7px 10px",fontSize:10,fontWeight:900,
              cursor:"pointer",whiteSpace:"nowrap"}}>
              {item.label}
            </button>
          ))}
        </div>
        <div style={{fontSize:8,color:"#87918c",fontWeight:900,textTransform:"uppercase",
          letterSpacing:"0.1em",margin:"10px 0 6px"}}>Difficulty</div>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
          {LIBRARY_DIFFICULTY.map(item=>(
            <button key={item.id} onClick={()=>setDifficultyFilter(item.id)} style={{
              border:`1px solid ${difficultyFilter===item.id?"#FFB34777":"#252d29"}`,
              background:difficultyFilter===item.id?"#160f00":"#070908",
              color:difficultyFilter===item.id?"#FFB347":"#87918c",
              borderRadius:999,padding:"7px 10px",fontSize:10,fontWeight:900,
              cursor:"pointer",whiteSpace:"nowrap"}}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="earned-library-grid" role="list" aria-label={`${filtered.length} matching exercises`}>
        {filtered.map(({ex,dk,profile},index)=>{
          const key=`${dk}_${ex.id}`,isOpen=open===key;
          const techniqueCoach=buildTechniqueCoach(ex,profile,dk);
          const exerciseNote=exerciseNoteFor(ex.id,customEx);
          const lastLift=getLastLiftForExercise(history,ex.id)?.lift;
          const workingWeight=Number(lastLift?.w)||Number(ex.w)||45;
          return(
            <div key={key} role="listitem"
              className={`forge-armory-row${isOpen?" forge-armory-row--open":""}`}
              data-armory-row={key} data-state={isOpen?"open":"closed"} style={{background:"#0a0d0c",
              border:`1px solid ${profile.color}33`,
              borderRadius:6,overflow:"hidden"}}>
              <button data-armory-index={index} aria-expanded={isOpen}
                onKeyDown={event=>handleArmoryKeyDown(event,index,key)}
                onClick={()=>setOpen(isOpen?null:key)} style={{
                width:"100%",background:"none",border:"none",padding:"13px 14px",
                display:"flex",justifyContent:"space-between",alignItems:"center",
                textAlign:"left",cursor:"pointer"}}>
                <div style={{minWidth:0}}>
                  <div className="forge-armory-row__path">
                    {String(index+1).padStart(3,"0")} -rw-r--r-- {profile.equipment} {workingWeight}lb
                  </div>
                  <div style={{fontSize:13,color:"#fff",fontWeight:900,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ex.name}</div>
                  <div style={{fontSize:10,color:profile.color,fontWeight:800,marginTop:3}}>
                    {profile.target} - {DAYS[dk].shortLabel}
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:7}}>
                    {[profile.equipmentLabel,profile.difficultyLabel,profile.repRange].map(label=>(
                      <span key={label} style={{fontSize:8,color:"#777",fontWeight:900,
                        border:"1px solid #252d29",borderRadius:999,padding:"3px 7px"}}>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
                <span style={{color:"#66706b",fontSize:12,marginLeft:8}}>{isOpen?"▲":"▼"}</span>
              </button>
              {isOpen&&(
                <div style={{borderTop:"1px solid #1b211f",padding:"12px 14px"}}>
                  <div className="forge-armory-inspection">
                    <AsciiExerciseAnimator exercise={ex} profile={profile}
                      weight={workingWeight} frameRate={8}/>
                    <AsciiAnatomyMap group={profile.group} label={profile.target}
                      accent={profile.color}/>
                  </div>
                  <div style={{fontSize:10,color:"#777",lineHeight:1.5,marginBottom:10}}>{profile.setup}</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8,marginBottom:10}}>
                    {[
                      ["Best Use",profile.bestUse,"#2DD4A0"],
                      ["Rep Range",profile.repRange,"#38BFFF"],
                      ["Tempo",profile.tempo,"#FFB347"],
                      ["Workout Day",DAYS[dk].label,"#7C6FFF"],
                    ].map(([label,value,color])=>(
                      <div key={label} style={{background:"#070908",border:`1px solid ${color}22`,
                        borderRadius:9,padding:"9px",minWidth:0}}>
                        <div style={{fontSize:8,color:color,fontWeight:950,
                          textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>
                          {label}
                        </div>
                        <div style={{fontSize:10,color:"#aaa",lineHeight:1.35}}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                    <div style={{background:"#070908",border:"1px solid #123022",borderRadius:9,padding:"10px"}}>
                      <div style={{fontSize:9,color:"#2DD4A0",fontWeight:900,
                        textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Form Cues</div>
                      {profile.cues.map(cue=><div key={cue} style={{fontSize:10,color:"#999",marginBottom:5}}>- {cue}</div>)}
                    </div>
                    <div style={{background:"#070908",border:"1px solid #30151f",borderRadius:9,padding:"10px"}}>
                      <div style={{fontSize:9,color:"#FF5C87",fontWeight:900,
                        textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Avoid</div>
                      {profile.mistakes.map(item=><div key={item} style={{fontSize:10,color:"#999",marginBottom:5}}>- {item}</div>)}
                    </div>
                  </div>
                  <TechniqueCoachPanel coach={techniqueCoach}/>
                  <ExerciseNotesPanel ex={ex} noteRecord={exerciseNote}
                    onSaveExerciseNote={onSaveExerciseNote}/>
                  <button onClick={()=>onStartLibraryWorkout?.(dk,ex)}
                    style={{width:"100%",border:"none",borderRadius:5,
                      background:`linear-gradient(135deg,${profile.color},#2DD4A0)`,
                      color:"#fff",fontSize:11,fontWeight:950,padding:"10px",cursor:"pointer"}}>
                    Start This Workout
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!filtered.length&&(
        <div style={{background:"#0a0d0c",border:"1px solid #2a312e",borderRadius:6,
          padding:"28px 16px",textAlign:"center",color:"#87918c",fontSize:12}}>
          No exercises match that search.
        </div>
      )}
    </div>
  );
}

// ─── Goals Modal ──────────────────────────────────────────────────────────────
function GoalModal({exName,exId,current,onSave,onClose}){
  const [val,setVal]=useState(String(current||""));
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"20px"}}>
      <div style={{background:"#111713",border:"1px solid #3a4640",borderRadius:6,
        padding:"24px",width:"100%",maxWidth:340}}>
        <div style={{fontSize:11,color:"#7C6FFF",fontWeight:700,marginBottom:4}}>Set Goal</div>
        <div style={{fontSize:16,fontWeight:900,color:"#fff",marginBottom:16}}>{exName}</div>
        <div style={{fontSize:10,color:"#747e79",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>
          Target Volume (lbs)
        </div>
        <input type="number" value={val} onChange={e=>setVal(e.target.value)}
          placeholder="e.g. 5000"
          style={{width:"100%",background:"#070908",border:"1px solid #46514b",borderRadius:8,
            color:"#fff",padding:"10px 12px",fontSize:16,outline:"none",
            boxSizing:"border-box",fontWeight:700,marginBottom:16}}/>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:"10px",borderRadius:9,border:"1px solid #46514b",
            background:"none",color:"#87918c",fontWeight:700,fontSize:13,cursor:"pointer"}}>
            Cancel
          </button>
          <button onClick={()=>{onSave(exId,val?parseInt(val):null);onClose();}} style={{
            flex:2,padding:"10px",borderRadius:9,border:"none",
            background:"linear-gradient(135deg,#7C6FFF,#5a50dd)",
            color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer"}}>
            Save Goal
          </button>
        </div>
      </div>
    </div>
  );
}

function LivePRRadar({radar}){
  if(!radar?.loggedCount) return null;
  const top=radar.topCandidate;
  const topType=top?.prs?.[0];
  const bestGapLabel=top
    ? top.bestGap>=0
      ? `+${top.bestGap.toLocaleString()} lbs`
      : `${Math.abs(top.bestGap).toLocaleString()} lbs under`
    : "No draft lift";
  return(
    <div style={{background:"linear-gradient(145deg,#0c100e,#070908)",border:"1px solid #35423b",
      borderRadius:6,padding:"11px 12px",margin:"0 0 10px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:9}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:9,color:"#FFB347",fontWeight:950,textTransform:"uppercase",
            letterSpacing:"0.12em",marginBottom:3}}>Live PR Radar</div>
          <div style={{fontSize:13,color:"#fff",fontWeight:950,lineHeight:1.2}}>
            Draft PR Candidates
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:12,color:radar.candidateCount?"#2DD4A0":"#38BFFF",fontWeight:950}}>
            {radar.status}
          </div>
          <div style={{fontSize:8,color:"#87918c",fontWeight:900,marginTop:3}}>
            {radar.loggedCount} logged
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.2fr 0.8fr",gap:8,marginBottom:8}}>
        <div style={{background:"#0a0d0c",border:"1px solid #252d29",
          borderRadius:9,padding:"9px",minWidth:0}}>
          <div style={{fontSize:8,color:"#87918c",fontWeight:950,textTransform:"uppercase",
            letterSpacing:"0.08em",marginBottom:4}}>Top Signal</div>
          <div style={{fontSize:12,color:"#fff",fontWeight:950,overflow:"hidden",
            textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {top?.ex?.name||"Log a lift"}
          </div>
          <div style={{fontSize:9,color:topType?.color||"#87918c",fontWeight:900,marginTop:4}}>
            {topType?.label||"Building"}
          </div>
        </div>
        <div style={{background:"#0a0d0c",border:"1px solid #252d29",
          borderRadius:9,padding:"9px",textAlign:"right"}}>
          <div style={{fontSize:8,color:"#87918c",fontWeight:950,textTransform:"uppercase",
            letterSpacing:"0.08em",marginBottom:4}}>Best Gap</div>
          <div style={{fontSize:14,color:top?.bestGap>=0?"#2DD4A0":"#FFB347",fontWeight:950}}>
            {bestGapLabel}
          </div>
          <div style={{fontSize:8,color:"#747e79",fontWeight:800,marginTop:3}}>
            volume
          </div>
        </div>
      </div>

      {top&&(
        <AsciiOneRmMeter current={top.currentOneRM} previous={top.bestOneRM}
          candidate={top.isPr}/>
      )}

      {radar.candidates.length>0?(
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:8}}>
          {radar.candidates.slice(0,3).map(row=>{
            const badge=row.prs[0];
            return(
              <div key={row.ex.id} style={{display:"grid",gridTemplateColumns:"1fr auto",
                gap:8,alignItems:"center",background:"#070908",border:`1px solid ${badge.color}24`,
                borderRadius:8,padding:"7px 8px"}}>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:10,color:"#ddd",fontWeight:900,overflow:"hidden",
                    textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.ex.name}</div>
                  <div style={{fontSize:8,color:"#87918c",fontWeight:800,marginTop:2}}>
                    {row.parsed.volume.toLocaleString()} lbs draft
                  </div>
                </div>
                <div style={{fontSize:9,color:badge.color,fontWeight:950,whiteSpace:"nowrap"}}>
                  {badge.label}
                </div>
              </div>
            );
          })}
        </div>
      ):(
        <div style={{fontSize:10,color:"#87918c",fontWeight:800,background:"#070908",
          border:"1px solid #1b211f",borderRadius:8,padding:"8px",marginBottom:8}}>
          No draft PRs yet. Keep logging and the radar will update live.
        </div>
      )}

      <div style={{fontSize:9,color:"#777",fontWeight:800,lineHeight:1.35}}>
        <span style={{color:"#FFB347",fontWeight:950}}>Coach Cue:</span> {radar.coachCue}
      </div>
    </div>
  );
}

function NextSetCoach({coach,onApplySuggestion}){
  if(!coach) return null;
  return(
    <div style={{background:"#070908",border:`1px solid ${coach.color}44`,
      borderLeft:`3px solid ${coach.color}`,borderRadius:5,padding:"10px",
      marginTop:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:8}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:8,color:coach.color,fontWeight:950,textTransform:"uppercase",
            letterSpacing:"0.1em",marginBottom:4}}>Next Set Coach</div>
          <div style={{fontSize:13,color:"#fff",fontWeight:950}}>Suggested Next Set</div>
        </div>
        <button onClick={onApplySuggestion} disabled={!coach.canApply} style={{
          flexShrink:0,border:"none",borderRadius:8,padding:"7px 9px",
          background:coach.canApply?coach.color:"#1b211f",
          color:coach.canApply?"#06101a":"#66706b",
          fontSize:9,fontWeight:950,cursor:coach.canApply?"pointer":"default"}}>
          Add Suggested Set
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 0.75fr 0.9fr",gap:6,marginBottom:8}}>
        {[
          ["Target",coach.target,coach.color],
          ["Rest",coach.restLabel,"#FFB347"],
          ["Decision",coach.decision,coach.color],
        ].map(([label,value,color])=>(
          <div key={label} style={{background:"#0a0d0c",border:`1px solid ${color}24`,
            borderRadius:8,padding:"8px",minWidth:0}}>
            <div style={{fontSize:7,color,fontWeight:950,textTransform:"uppercase",
              letterSpacing:"0.07em",marginBottom:5}}>{label}</div>
            <div style={{fontSize:10,color:"#ddd",lineHeight:1.25,fontWeight:900,
              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {value}
            </div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:8,alignItems:"start"}}>
        <div style={{fontSize:8,color:"#87918c",fontWeight:950,textTransform:"uppercase",
          letterSpacing:"0.07em",paddingTop:2}}>Why This Set</div>
        <div style={{fontSize:9,color:"#777",fontWeight:800,lineHeight:1.4}}>
          {coach.reason} Last: {coach.recentSetLabel}. Logged {coach.loggedSets}/{coach.targetSets} planned sets.
        </div>
      </div>
    </div>
  );
}

function SessionPacer({pacer,onResetClock}){
  if(!pacer) return null;
  return(
    <div style={{background:"linear-gradient(145deg,#0c100e,#070908)",border:`1px solid ${pacer.color}40`,
      borderRadius:6,padding:"11px 12px",margin:"0 0 10px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:9}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:9,color:pacer.color,fontWeight:950,textTransform:"uppercase",
            letterSpacing:"0.12em",marginBottom:3}}>Session Pacer</div>
          <div style={{fontSize:13,color:"#fff",fontWeight:950}}>Pace Cue</div>
        </div>
        <button onClick={onResetClock} style={{border:"1px solid #252d29",background:"#0a0d0c",
          color:"#87918c",borderRadius:8,padding:"6px 8px",fontSize:9,fontWeight:900,
          cursor:"pointer",whiteSpace:"nowrap"}}>
          Reset Clock
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:6,marginBottom:8}}>
        {[
          ["Elapsed",pacer.elapsedLabel,pacer.color],
          ["Logged Sets",String(pacer.activeSetCount),"#2DD4A0"],
          ["Volume / Min",`${pacer.volumePerMinute.toLocaleString()} lbs`,"#FFB347"],
        ].map(([label,value,color])=>(
          <div key={label} style={{background:"#0a0d0c",border:`1px solid ${color}24`,
            borderRadius:8,padding:"8px",minWidth:0}}>
            <div style={{fontSize:7,color,fontWeight:950,textTransform:"uppercase",
              letterSpacing:"0.07em",marginBottom:5,whiteSpace:"nowrap",overflow:"hidden",
              textOverflow:"ellipsis"}}>{label}</div>
            <div style={{fontSize:11,color:"#ddd",fontWeight:950,whiteSpace:"nowrap",
              overflow:"hidden",textOverflow:"ellipsis"}}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#070908",border:`1px solid ${pacer.color}24`,
        borderRadius:8,padding:"8px",display:"grid",gridTemplateColumns:"auto 1fr",
        gap:8,alignItems:"start"}}>
        <div style={{fontSize:9,color:pacer.color,fontWeight:950,whiteSpace:"nowrap"}}>
          {pacer.status}
        </div>
        <div style={{fontSize:9,color:"#777",fontWeight:800,lineHeight:1.35}}>
          {pacer.cue} {pacer.activeLoggedCount} exercise{pacer.activeLoggedCount===1?"":"s"} active.
        </div>
      </div>
    </div>
  );
}

function SetQualitySummary({summary}){
  if(!summary) return null;
  return(
    <div style={{background:"#070908",border:`1px solid ${summary.color}40`,
      borderLeft:`3px solid ${summary.color}`,borderRadius:5,padding:"10px",
      marginTop:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:8}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:8,color:summary.color,fontWeight:950,textTransform:"uppercase",
            letterSpacing:"0.1em",marginBottom:4}}>Set Quality Summary</div>
          <div style={{fontSize:13,color:"#fff",fontWeight:950}}>Quality Mix</div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:12,color:summary.color,fontWeight:950}}>{summary.status}</div>
          <div style={{fontSize:8,color:"#87918c",fontWeight:900,marginTop:3}}>
            Hard Sets {summary.hardSets}
          </div>
        </div>
      </div>
      <div style={{fontSize:9,color:"#777",fontWeight:800,lineHeight:1.4,marginBottom:8}}>
        {summary.qualityMix}
      </div>
      <div style={{fontSize:9,color:"#777",fontWeight:800,lineHeight:1.4}}>
        <span style={{color:summary.color,fontWeight:950}}>Coach Cue:</span> {summary.cue}
      </div>
    </div>
  );
}

function ActiveExerciseHistory({rows}){
  const recent=Array.isArray(rows)?rows:[];
  return(
    <div style={{marginTop:10,borderTop:"1px solid #252f2a",paddingTop:10}}>
      <div style={{fontSize:8,color:"#38BFFF",fontWeight:950,textTransform:"uppercase",
        letterSpacing:"0.1em",marginBottom:7}}>Recent Performance</div>
      {recent.length?(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:6}}>
          {recent.map((row,index)=>(
            <div key={`${row.weekLabel}_${row.date}_${index}`} style={{minWidth:0,minHeight:82,
              background:"#070908",border:"1px solid #202923",borderRadius:8,padding:"8px"}}>
              <div style={{fontSize:8,color:"#38BFFF",fontWeight:950,
                whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.weekLabel}</div>
              <div style={{fontSize:8,color:"#747e79",fontWeight:800,marginTop:3,
                whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.date}</div>
              <div style={{fontSize:10,color:"#fff",fontWeight:950,marginTop:7,
                whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.bestSetText}</div>
              <div style={{fontSize:8,color:"#98a19c",fontWeight:850,marginTop:4}}>
                {row.setCount} set{row.setCount===1?"":"s"} - {row.volume.toLocaleString()} lbs
              </div>
            </div>
          ))}
        </div>
      ):(
        <div style={{minHeight:46,display:"flex",alignItems:"center",justifyContent:"center",
          background:"#070908",border:"1px dashed #252d29",borderRadius:8,
          color:"#87918c",fontSize:9,fontWeight:850,textAlign:"center",padding:"8px"}}>
          No saved performances yet. This workout will become your starting point.
        </div>
      )}
    </div>
  );
}

function WorkoutCompletionGuard({guard,onSkipRemaining}){
  if(!guard) return null;
  const stats=[
    ["Logged",guard.loggedCount,"#2DD4A0"],
    ["Skipped",guard.skippedCount,"#38BFFF"],
    ["Removed",guard.removedCount,"#FF5C87"],
    ["Needs Action",guard.needsActionCount,guard.ready?"#2DD4A0":"#FFB347"],
  ];
  return(
    <div style={{background:"linear-gradient(145deg,#0c100e,#070908)",border:`1px solid ${guard.color}44`,
      borderLeft:`3px solid ${guard.color}`,borderRadius:6,padding:"11px 12px",
      margin:"0 0 12px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:9}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:8,color:guard.color,fontWeight:950,textTransform:"uppercase",
            letterSpacing:"0.1em",marginBottom:4}}>Workout Completion Guard</div>
          <div style={{fontSize:13,color:"#fff",fontWeight:950,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {guard.dayLabel}
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:14,color:guard.color,fontWeight:950}}>{guard.completionPct}%</div>
          <div style={{fontSize:8,color:"#87918c",fontWeight:900,marginTop:3}}>{guard.status}</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:6,marginBottom:8}}>
        {stats.map(([label,value,color])=>(
          <div key={label} style={{border:`1px solid ${color}28`,borderRadius:8,
            padding:"7px 6px",background:"#0a0d0c",minWidth:0}}>
            <div style={{fontSize:7,color,fontWeight:950,textTransform:"uppercase",
              letterSpacing:"0.06em",marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",
              textOverflow:"ellipsis"}}>{label}</div>
            <div style={{fontSize:13,color:"#fff",fontWeight:950,lineHeight:1}}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:9,color:"#777",fontWeight:800,lineHeight:1.4}}>
        <span style={{color:guard.color,fontWeight:950}}>{guard.ready?"Ready to confirm":"Needs Action"}:</span>{" "}
        {guard.cue}
      </div>
      {!guard.ready&&guard.needsActionNames.length>0&&(
        <div style={{marginTop:7}}>
          <div style={{fontSize:8,color:"#87918c",fontWeight:850,lineHeight:1.35}}>
            Next: {guard.needsActionNames.slice(0,4).join(", ")}
            {guard.needsActionNames.length>4?` +${guard.needsActionNames.length-4} more`:""}
          </div>
          {onSkipRemaining&&(
            <button onClick={onSkipRemaining} style={{width:"100%",minHeight:38,marginTop:9,
              borderRadius:8,border:"1px solid #38BFFF55",background:"#071622",
              color:"#38BFFF",fontSize:10,fontWeight:900,cursor:"pointer"}}>
              Skip Remaining
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function WorkoutReadinessGate({gate}){
  if(!gate) return null;
  return(
    <div style={{background:"#070908",border:`1px solid ${gate.color}44`,
      borderLeft:`3px solid ${gate.color}`,borderRadius:5,padding:"10px",
      marginTop:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:8}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:8,color:gate.color,fontWeight:950,textTransform:"uppercase",
            letterSpacing:"0.1em",marginBottom:4}}>Workout Readiness Gate</div>
          <div style={{fontSize:13,color:"#fff",fontWeight:950}}>Recommended Mode</div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:13,color:gate.color,fontWeight:950,whiteSpace:"nowrap"}}>{gate.mode}</div>
          <div style={{fontSize:8,color:"#87918c",fontWeight:900,marginTop:3}}>{gate.status}</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:6}}>
        {gate.checks.map(check=>(
          <div key={check.label} style={{background:"#0a0d0c",border:`1px solid ${check.color}26`,
            borderRadius:8,padding:"8px",minWidth:0}}>
            <div style={{fontSize:7,color:check.color,fontWeight:950,textTransform:"uppercase",
              letterSpacing:"0.07em",marginBottom:5,whiteSpace:"nowrap",overflow:"hidden",
              textOverflow:"ellipsis"}}>{check.label}</div>
            <div style={{fontSize:9,color:"#aaa",lineHeight:1.35,fontWeight:800}}>
              {check.value}
            </div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:6,marginTop:6}}>
        <div style={{borderTop:"1px solid #1d2923",paddingTop:7,minWidth:0}}>
          <div style={{fontSize:7,color:"#2DD4A0",fontWeight:950,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>Supports</div>
          <div style={{fontSize:9,color:"#b9c7bf",lineHeight:1.35,fontWeight:800}}>{gate.explanation?.positive}</div>
        </div>
        <div style={{borderTop:"1px solid #1d2923",paddingTop:7,minWidth:0}}>
          <div style={{fontSize:7,color:"#FFB347",fontWeight:950,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>Protect</div>
          <div style={{fontSize:9,color:"#b9c7bf",lineHeight:1.35,fontWeight:800}}>{gate.explanation?.limiting}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Log Form ─────────────────────────────────────────────────────────────────
function LogForm({history,trackingMode,onSubmit,customEx,persistedCoachContext,onAddExercise,onRemoveExercise,onRestoreExercise,onSaveTemplate,onApplyTemplate,onDeleteTemplate,onSaveExerciseNote,initialDraft,saveDraft,onDraftCleared}){
  const isDaily=trackingMode===TRACKING_MODES.DAILY;
  const buildInputsFor=(dk)=>{
    const init={};
    for(const ex of allExercises(dk,customEx)){
      init[ex.id]=liftInputFromLastLogged(history,ex);
    }
    return init;
  };

  const [activeDay,setActiveDay]=useState(initialDraft?.activeDay||"bicepsShoulders");
  const [completedDays,setCompleted]=useState(initialDraft?.completedDays||{});
  const [saved,setSaved]=useState(false);
  const [savedEntry,setSavedEntry]=useState(null);
  const [copiedShare,setCopiedShare]=useState(false);
  const [notes,setNotes]=useState(initialDraft?.notes||"");
  const [rating,setRating]=useState(initialDraft?.rating||0);
  const [rpe,setRpe]=useState(initialDraft?.rpe||0);
  const [deload,setDeload]=useState(!!initialDraft?.deload);
  const [readiness,setReadiness]=useState(normalizeReadiness(initialDraft?.readiness));
  const [showAddEx,setShowAddEx]=useState(false);
  const [newExName,setNewExName]=useState("");
  const [newExW,setNewExW]=useState("");
  const [newExR,setNewExR]=useState("");
  const [newExS,setNewExS]=useState("");
  const [showRestoredNote,setShowRestoredNote]=useState(!!initialDraft);
  const [templateName,setTemplateName]=useState("");
  const [restPreset,setRestPreset]=useState(initialDraft?.restPreset||90);
  const [autoStartRest,setAutoStartRest]=useState(initialDraft?.autoStartRest??false);
  const [customRestMin,setCustomRestMin]=useState(String(Math.floor((initialDraft?.restPreset||90)/60)));
  const [customRestSec,setCustomRestSec]=useState(String((initialDraft?.restPreset||90)%60));
  const [restRemaining,setRestRemaining]=useState(0);
  const [restActive,setRestActive]=useState(false);
  const [restLabel,setRestLabel]=useState("");
  const [activeFocusId,setActiveFocusId]=useState(initialDraft?.libraryFocus?.exerciseId||null);
  const [sessionStartedAt,setSessionStartedAt]=useState(initialDraft?.sessionStartedAt||Date.now());
  const [sessionTick,setSessionTick]=useState(Date.now());
  const loadedAdaptivePlan=initialDraft?.adaptivePlan;
  const loadedCoachPlan=initialDraft?.coachPlan;
  const loadedLibraryFocus=initialDraft?.libraryFocus;

  const [inputs,setInputs]=useState(()=>{
    if(initialDraft?.inputs) return initialDraft.inputs;
    const init={};
    for(const dk of DAY_KEYS) init[dk]=buildInputsFor(dk);
    return init;
  });
  const undoInputsRef=useRef(null);
  const [undoAvailable,setUndoAvailable]=useState(false);

  // Keep inputs in sync if a custom exercise is added/removed mid-session
  useEffect(()=>{
    setInputs(prev=>{
      const updated={...prev};
      for(const dk of DAY_KEYS){
        const exIds=new Set(allExercises(dk,customEx).map(e=>e.id));
        const dayInputs={...updated[dk]};
        for(const ex of allExercises(dk,customEx)){
          if(!dayInputs[ex.id]){
            dayInputs[ex.id]=liftInputFromLastLogged(history,ex);
          }
        }
        for(const id of Object.keys(dayInputs)){
          if(!exIds.has(id)) delete dayInputs[id];
        }
        updated[dk]=dayInputs;
      }
      return updated;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[customEx]);

  // Autosave: every change to in-progress entries gets written to storage
  // (debounced) so nothing is lost if the app closes before final submit.
  const draftTimer=useRef(null);
  const isFirstRender=useRef(true);
  useEffect(()=>{
    if(isFirstRender.current){ isFirstRender.current=false; return; }
    if(!saveDraft) return;
    if(draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current=setTimeout(()=>{
      const nextDraft={activeDay,completedDays,trackingMode,notes,rating,rpe,deload,readiness,autoStartRest,restPreset,sessionStartedAt,inputs};
      if(loadedAdaptivePlan) nextDraft.adaptivePlan=loadedAdaptivePlan;
      if(loadedCoachPlan) nextDraft.coachPlan=loadedCoachPlan;
      if(loadedLibraryFocus) nextDraft.libraryFocus=loadedLibraryFocus;
      saveDraft(nextDraft);
    },500);
    return ()=>{ if(draftTimer.current) clearTimeout(draftTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[activeDay,completedDays,trackingMode,notes,rating,rpe,deload,readiness,autoStartRest,restPreset,sessionStartedAt,inputs,loadedAdaptivePlan,loadedCoachPlan,loadedLibraryFocus]);

  useEffect(()=>{
    if(!restActive||restRemaining<=0) return;
    const timer=setInterval(()=>{
      setRestRemaining(sec=>{
        if(sec<=1){
          setRestActive(false);
          return 0;
        }
        return sec-1;
      });
    },1000);
    return ()=>clearInterval(timer);
  },[restActive,restRemaining]);

  useEffect(()=>{
    const timer=setInterval(()=>setSessionTick(Date.now()),15000);
    return ()=>clearInterval(timer);
  },[]);

  const unconfirmDay=dk=>{
    setCompleted(prev=>{
      if(!prev[dk]) return prev;
      const next={...prev};
      delete next[dk];
      return next;
    });
  };

  const commitInputChange=updater=>{
    setInputs(prev=>{
      const next=typeof updater==="function"?updater(prev):updater;
      if(next===prev) return prev;
      undoInputsRef.current=prev;
      return next;
    });
    setUndoAvailable(true);
  };

  const undoLastInputEdit=()=>{
    const previous=undoInputsRef.current;
    if(!previous) return;
    undoInputsRef.current=null;
    setInputs(previous);
    setUndoAvailable(false);
    setCompleted({});
  };

  const handleChange=(dk,id,field,val)=>{
    commitInputChange(prev=>({...prev,[dk]:{...prev[dk],[id]:{...prev[dk][id],[field]:val,skipped:false}}}));
    unconfirmDay(dk);
  };

  const handleSetChange=(dk,id,index,field,val)=>{
    commitInputChange(prev=>{
      const cell=prev[dk][id]||{setDetails:[{w:"0",r:"0"}]};
      const rows=getLiftSetRows(cell).map((row,i)=>i===index?{...row,[field]:val,completed:false}:row);
      const parsed=parseLiftCell({...cell,setDetails:rows,skipped:false});
      return {...prev,[dk]:{...prev[dk],[id]:{
        ...cell,
        setDetails:rows,
        w:parsed.w?String(parsed.w):"0",
        r:parsed.r?String(parsed.r):"0",
        s:String(rows.length),
        skipped:false,
      }}};
    });
    unconfirmDay(dk);
  };

  const adjustSetValue=(dk,id,index,field,delta)=>{
    commitInputChange(prev=>{
      const cell=prev[dk][id]||{setDetails:[{w:"0",r:"0"}]};
      const rows=getLiftSetRows(cell).map((row,i)=>{
        if(i!==index) return row;
        const current=Number(row?.[field])||0;
        const next=field==="r"
          ? Math.max(0,Math.round(current+delta))
          : Math.max(0,Number((current+delta).toFixed(1)));
        return {...row,[field]:String(next),completed:false};
      });
      const parsed=parseLiftCell({...cell,setDetails:rows,skipped:false});
      return {...prev,[dk]:{...prev[dk],[id]:{
        ...cell,
        setDetails:rows,
        w:parsed.w?String(parsed.w):"0",
        r:parsed.r?String(parsed.r):"0",
        s:String(rows.length),
        skipped:false,
      }}};
    });
    unconfirmDay(dk);
  };

  const handleSetQuality=(dk,id,index,quality)=>{
    commitInputChange(prev=>{
      const cell=prev[dk][id]||{setDetails:[{w:"0",r:"0"}]};
      const rows=getLiftSetRows(cell).map((row,i)=>i===index?{...row,quality,completed:false}:row);
      return {...prev,[dk]:{...prev[dk],[id]:{
        ...cell,
        setDetails:rows,
        skipped:false,
      }}};
    });
    unconfirmDay(dk);
  };

  const addSetRow=(dk,id)=>{
    commitInputChange(prev=>{
      const cell=prev[dk][id]||{setDetails:[{w:"0",r:"0"}]};
      const rows=getLiftSetRows(cell);
      const last=rows[rows.length-1]||{w:"0",r:"0"};
      return {...prev,[dk]:{...prev[dk],[id]:{
        ...cell,
        setDetails:[...rows,{w:String(last.w||"0"),r:String(last.r||"0")}],
        s:String(rows.length+1),
        skipped:false,
      }}};
    });
    unconfirmDay(dk);
  };

  const removeSetRow=(dk,id,index)=>{
    commitInputChange(prev=>{
      const cell=prev[dk][id]||{setDetails:[{w:"0",r:"0"}]};
      const rows=getLiftSetRows(cell).filter((_,i)=>i!==index);
      const safeRows=rows.length?rows:[{w:"0",r:"0"}];
      const parsed=parseLiftCell({...cell,setDetails:safeRows,skipped:false});
      return {...prev,[dk]:{...prev[dk],[id]:{
        ...cell,
        setDetails:safeRows,
        w:parsed.w?String(parsed.w):"0",
        r:parsed.r?String(parsed.r):"0",
        s:String(safeRows.length),
        skipped:false,
      }}};
    });
    unconfirmDay(dk);
  };

  const toggleSkipped=(dk,id)=>{
    commitInputChange(prev=>{
      const cell=prev[dk][id]||{w:"0",r:"0",s:"0"};
      return {...prev,[dk]:{...prev[dk],[id]:{...cell,skipped:!cell.skipped}}};
    });
    unconfirmDay(dk);
  };

  const copyPreviousLiftToExercise=(dk,ex)=>{
    const suggestion=getExerciseSetSuggestion(history,ex);
    const rows=suggestion.rows.length?suggestion.rows:[{w:String(ex.w||0),r:String(ex.r||0)}];
    const parsed=parseLiftCell({setDetails:rows});
    commitInputChange(prev=>({...prev,[dk]:{...prev[dk],[ex.id]:{
      ...(prev[dk][ex.id]||{}),
      w:parsed.w?String(parsed.w):"0",
      r:parsed.r?String(parsed.r):"0",
      s:String(rows.length),
      setDetails:rows,
      skipped:false,
    }}}));
    setActiveFocusId(ex.id);
    unconfirmDay(dk);
  };

  const repeatLastSetForExercise=(dk,ex)=>{
    commitInputChange(prev=>{
      const cell=prev[dk][ex.id]||{setDetails:[{w:"0",r:"0"}]};
      const rows=getLiftSetRows(cell);
      const loggedRows=getLoggedSetRows(cell);
      const suggestion=getExerciseSetSuggestion(history,ex);
      const source=loggedRows[loggedRows.length-1]
        || suggestion.rows[suggestion.rows.length-1]
        || {w:String(ex.w||0),r:String(ex.r||0)};
      const nextRow={w:String(source.w||"0"),r:String(source.r||"0")};
      const nextRows=[...rows,nextRow];
      const parsed=parseLiftCell({...cell,setDetails:nextRows,skipped:false});
      return {...prev,[dk]:{...prev[dk],[ex.id]:{
        ...cell,
        setDetails:nextRows,
        w:parsed.w?String(parsed.w):"0",
        r:parsed.r?String(parsed.r):"0",
        s:String(nextRows.length),
        skipped:false,
      }}};
    });
    setActiveFocusId(ex.id);
    unconfirmDay(dk);
  };

  const clearDayInputs=dk=>{
    const cleared={};
    for(const ex of allExercises(dk,customEx)) cleared[ex.id]={w:"0",r:"0",s:"1",setDetails:[{w:"0",r:"0"}]};
    commitInputChange(prev=>({...prev,[dk]:cleared}));
    unconfirmDay(dk);
  };

  const repeatLastDay=dk=>{
    commitInputChange(prev=>({...prev,[dk]:buildInputsFor(dk)}));
    unconfirmDay(dk);
  };

  const startRest=(label,seconds=restPreset)=>{
    setRestLabel(label);
    setRestRemaining(seconds);
    setRestActive(true);
  };
  const updateCustomRest=(min,sec)=>{
    setCustomRestMin(min);
    setCustomRestSec(sec);
    const minutes=parseInt(min)||0;
    const seconds=parseInt(sec)||0;
    const total=Math.max(1,(minutes*60)+seconds);
    setRestPreset(total);
  };
  const pauseRest=()=>setRestActive(false);
  const resumeRest=()=>{ if(restRemaining>0) setRestActive(true); };
  const clearRest=()=>{ setRestActive(false); setRestRemaining(0); setRestLabel(""); };
  const completeSetRow=(dk,id,index,exerciseName)=>{
    commitInputChange(prev=>{
      const cell=prev[dk][id]||{setDetails:[{w:"0",r:"0"}]};
      const rows=getLiftSetRows(cell).map((row,i)=>i===index?{...row,completed:true}:row);
      return {...prev,[dk]:{...prev[dk],[id]:{...cell,setDetails:rows,skipped:false}}};
    });
    setActiveFocusId(id);
    unconfirmDay(dk);
    if(autoStartRest) startRest(`${exerciseName} rest`,restPreset);
  };
  const resetSessionClock=()=>{
    setSessionStartedAt(Date.now());
    setSessionTick(Date.now());
  };

  const previewVol=allExercises(activeDay,customEx).reduce((sum,ex)=>{
    const cell=inputs[activeDay][ex.id];
    if(!cell) return sum;
    if(!isLoggedLiftCell(cell)) return sum;
    return sum+parseLiftCell(cell).volume;
  },0);
  const previousDayEntry=[...history].reverse()
    .find(entry=>getDayVol(entry,activeDay,customEx)>0);
  const prevDayVol=getDayVol(previousDayEntry,activeDay,customEx);
  const previewDiff=previewVol-prevDayVol;
  const activeLoggedCount=allExercises(activeDay,customEx)
    .filter(ex=>isLoggedLiftCell(inputs[activeDay][ex.id])).length;
  const activeSetCount=allExercises(activeDay,customEx).reduce((sum,ex)=>{
    const cell=inputs[activeDay][ex.id];
    if(!isLoggedLiftCell(cell)) return sum;
    return sum+getLoggedSetRows(cell).length;
  },0);
  const livePrRadar=buildLivePRRadar(history,customEx,activeDay,inputs);
  const activeRemoved=removedExercises(activeDay,customEx);
  const activeTemplates=workoutTemplates(customEx).filter(t=>t.dayKey===activeDay);
  const activeExercises=allExercises(activeDay,customEx);
  const activeFocusExercise=activeExercises.find(ex=>ex.id===activeFocusId)||activeExercises[0];
  const activeFocusCell=activeFocusExercise?inputs[activeDay][activeFocusExercise.id]:null;
  const activeFocusParsed=parseLiftCell(activeFocusCell);
  const activeFocusSetRows=activeFocusCell?getLiftSetRows(activeFocusCell):[];
  const activeFocusCompletedSets=isSkippedLiftCell(activeFocusCell)
    ? 0
    : activeFocusSetRows.filter(row=>row.completed).length;
  const activeFocusSuggestion=activeFocusExercise?getExerciseSetSuggestion(history,activeFocusExercise):null;
  const activeFocusProfile=activeFocusExercise?getExerciseProfile(activeFocusExercise,activeDay):null;
  const activeFocusTechniqueCoach=activeFocusExercise&&activeFocusProfile
    ? buildTechniqueCoach(activeFocusExercise,activeFocusProfile,activeDay)
    : null;
  const activeFocusExerciseNote=activeFocusExercise
    ? exerciseNoteFor(activeFocusExercise.id,customEx)
    : null;
  const activeFocusSubstitutions=activeFocusExercise
    ? buildEarnedExerciseSubstitutions(
      activeFocusExercise,
      activeDay,
      customEx,
      history,
      persistedCoachContext,
    )
    : [];
  const activeFocusWorkingWeight=Number.isFinite(activeFocusParsed.w)&&activeFocusParsed.w>0
    ? activeFocusParsed.w
    : activeFocusExercise?.w||0;
  const activeFocusWorkingReps=Number.isFinite(activeFocusParsed.r)&&activeFocusParsed.r>0
    ? activeFocusParsed.r
    : activeFocusExercise?.r||5;
  const activeFocusPlateLoad=buildPlateLoad(activeFocusWorkingWeight);
  const activeFocusWarmups=buildWarmupPlan(
    activeFocusWorkingWeight,
    activeFocusWorkingReps,
    activeFocusProfile?.equipment||"machine"
  );
  const readinessScore=getReadinessScore(readiness)??60;
  const sessionPacer=buildSessionPacer(sessionStartedAt,sessionTick,previewVol,activeLoggedCount,activeSetCount,readinessScore);
  const activeFocusNextSetCoach=activeFocusExercise?buildNextSetCoach(history,activeFocusExercise,activeFocusCell,activeFocusProfile,readinessScore):null;
  const activeFocusSetQualitySummary=buildSetQualitySummary(activeFocusCell,readinessScore);
  const activeFocusHistory=activeFocusExercise?buildActiveExerciseHistory(history,activeFocusExercise.id):[];
  const readinessLabel=getReadinessLabel(readinessScore);
  const readinessRows=[
    {key:"sleep",label:"Sleep",low:"Poor",high:"Great",color:"#38BFFF"},
    {key:"energy",label:"Energy",low:"Low",high:"High",color:"#2DD4A0"},
    {key:"soreness",label:"Soreness",low:"Fresh",high:"Sore",color:"#FF5C87"},
  ];
  const workoutReadinessGate=buildWorkoutReadinessGate(readinessScore,readiness,previewVol,prevDayVol,activeLoggedCount);
  const workoutCompletionGuard=buildWorkoutCompletionGuard(activeDay,inputs,customEx);
  const skipRemainingExercises=dk=>{
    if(!workoutCompletionGuard.needsActionIds.length) return;
    commitInputChange(prev=>{
      const dayInputs=prev[dk]||{};
      const nextDayInputs={...dayInputs};
      for(const ex of allExercises(dk,customEx)){
        if(!workoutCompletionGuard.needsActionIds.includes(ex.id)) continue;
        const cell=dayInputs[ex.id]||liftInputFromLastLogged(history,ex);
        nextDayInputs[ex.id]={...cell,skipped:true};
      }
      return {...prev,[dk]:nextDayInputs};
    });
    unconfirmDay(dk);
  };
  const skipAndConfirmDay=dk=>{
    if(!confirm(`No exercises are logged for ${DAYS[dk].label}. Mark this entire section as skipped?`)) return;
    commitInputChange(prev=>{
      const dayInputs=prev[dk]||{};
      const nextDayInputs={...dayInputs};
      for(const ex of allExercises(dk,customEx)){
        const cell=dayInputs[ex.id]||liftInputFromLastLogged(history,ex);
        nextDayInputs[ex.id]={...cell,skipped:true};
      }
      return {...prev,[dk]:nextDayInputs};
    });
    unconfirmDay(dk);
    if(isDaily) return;
    setCompleted(prev=>({...prev,[dk]:true}));
    const remaining=DAY_KEYS.filter(k=>k!==dk&&!completedDays[k]);
    if(remaining.length) setActiveDay(remaining[0]);
  };
  const updateReadiness=(key,value)=>{
    setReadiness(prev=>normalizeReadiness({...prev,[key]:value}));
  };

  useEffect(()=>{
    const exercises=allExercises(activeDay,customEx);
    if(!exercises.length) return;
    if(!activeFocusId||!exercises.some(ex=>ex.id===activeFocusId)){
      setActiveFocusId(exercises[0].id);
    }
  },[activeDay,customEx,activeFocusId]);

  const getBeat=(dk,id,field)=>{
    const last=getLastLiftForExercise(history,id)?.lift;
    if(!last) return false;
    const cur=parseFloat(inputs[dk][id]?.[field]);
    if(isNaN(cur)) return false;
    return field==="w"?cur>last.w:field==="r"?cur>last.r:false;
  };

  const markDayDone=(dk)=>{
    let loggedCount=0;
    for(const ex of allExercises(dk,customEx)){
      const cell=inputs[dk][ex.id];
      if(isSkippedLiftCell(cell)) continue;
      if(!isLoggedLiftCell(cell)){
        alert(`Finish "${ex.name}" with positive weight, reps, and sets, or tap Skip for that exercise.`);
        return;
      }
      loggedCount++;
    }
    if(loggedCount===0&&!confirm(`No exercises are logged for ${DAYS[dk].label}. Mark this day as skipped?`)){
      return;
    }
    setCompleted(prev=>({...prev,[dk]:true}));
    const remaining=DAY_KEYS.filter(k=>k!==dk&&!completedDays[k]);
    if(remaining.length) setActiveDay(remaining[0]);
  };

  const handleSave=async()=>{
    if(!isDaily&&Object.keys(completedDays).length<3){alert("Confirm all 3 days first.");return;}
    const saveDayKeys=isDaily?[activeDay]:DAY_KEYS;
    const exercises={};
    for(const dk of saveDayKeys)
      for(const ex of allExercises(dk,customEx)){
        const cell=inputs[dk][ex.id];
        if(isSkippedLiftCell(cell)) continue;
        if(!isLoggedLiftCell(cell)){
          alert(`Finish "${ex.name}" with positive weight, reps, and sets, or tap Skip for that exercise.`);
          return;
        }
        exercises[ex.id]=storedLiftFromCell(cell);
    }
    if(!Object.keys(exercises).length){
      alert(`Log at least one exercise before saving ${isDaily?"today's workout":"the week"}.`);
      return;
    }
    const normalizedReadiness=normalizeReadiness(readiness);
    const periodType=isDaily?PERIOD_TYPES.DAY:PERIOD_TYPES.WEEK;
    const dayKey=isDaily?activeDay:undefined;
    const recapEntry={week:history.length+1,periodType,dayKey,exercises,date:new Date().toISOString().slice(0,10),
      notes:notes.trim()||undefined,rating:rating||undefined,rpe:rpe||undefined,
      deload:deload||undefined,readiness:normalizedReadiness};
    const saved=await onSubmit({
      exercises,
      notes:notes.trim(),
      rating,
      rpe,
      deload,
      readiness:normalizedReadiness,
      periodType:isDaily?PERIOD_TYPES.DAY:PERIOD_TYPES.WEEK,
      dayKey:isDaily?activeDay:undefined,
    });
    if(saved===false){
      alert("Earned could not save this workout locally. Your draft is still here; check storage and try Save again.");
      return;
    }
    if(onDraftCleared) await onDraftCleared();
    setSavedEntry(recapEntry);
    setSaved(true);
  };

  const copyShareText=async()=>{
    if(!savedEntry) return;
    const recap=buildWorkoutRecap(savedEntry,history,customEx);
    try{
      await navigator.clipboard.writeText(recap.shareText);
      setCopiedShare(true);
      setTimeout(()=>setCopiedShare(false),1800);
    }catch{
      alert(recap.shareText);
    }
  };

  const applyExerciseSubstitution=(dk,sourceEx,swap)=>{
    if(!sourceEx||!swap?.ex) return;
    const suggested=swap.suggested||{};
    const w=Math.max(0,Number(suggested.w||swap.ex.w||sourceEx.w||0));
    const r=Math.max(0,Number(suggested.r||swap.ex.r||sourceEx.r||0));
    const s=Math.max(1,Number(suggested.s||swap.ex.s||sourceEx.s||1));
    const id=`custom_${dk}_swap_${Date.now()}`;
    const name=swap.ex.name;
    const newEx={
      id,
      name,
      w,
      r,
      s,
      isCustom:true,
      substituteFor:sourceEx.name,
      sourceId:sourceEx.id,
      substitutionCoach:true,
    };
    onAddExercise(dk,newEx);
    commitInputChange(prev=>({...prev,[dk]:{...prev[dk],[id]:{
      w:String(w),
      r:String(r),
      s:String(s),
      setDetails:Array.from({length:s},()=>({w:String(w),r:String(r)})),
      skipped:false,
    }}}));
    setActiveFocusId(id);
    unconfirmDay(dk);
  };

  const applyNextSetSuggestion=(dk,ex,coach)=>{
    if(!ex||!coach?.canApply) return;
    const nextRow={w:String(coach.nextWeight),r:String(coach.nextReps)};
    commitInputChange(prev=>{
      const cell=prev[dk][ex.id]||{setDetails:[{w:"0",r:"0"}]};
      const rows=getLiftSetRows(cell);
      const emptyIndex=rows.findIndex(row=>!(parseFloat(row?.w)>0&&parseInt(row?.r)>0));
      const nextRows=emptyIndex>=0
        ? rows.map((row,index)=>index===emptyIndex?nextRow:row)
        : [...rows,nextRow];
      const parsed=parseLiftCell({...cell,setDetails:nextRows,skipped:false});
      return {...prev,[dk]:{...prev[dk],[ex.id]:{
        ...cell,
        setDetails:nextRows,
        w:parsed.w?String(parsed.w):"0",
        r:parsed.r?String(parsed.r):"0",
        s:String(nextRows.length),
        skipped:false,
      }}};
    });
    setActiveFocusId(ex.id);
    unconfirmDay(dk);
  };

  const handleAddExercise=()=>{
    const name=newExName.trim();
    const w=parseFloat(newExW),r=parseInt(newExR),s=parseInt(newExS);
    if(!name){alert("Give the exercise a name.");return;}
    if(isNaN(w)||isNaN(r)||isNaN(s)||w<=0||r<=0||s<=0){alert("Fill in a valid starting weight, reps, and sets.");return;}
    const id=`custom_${activeDay}_${Date.now()}`;
    onAddExercise(activeDay,{id,name,w,r,s,isCustom:true});
    commitInputChange(prev=>({...prev,[activeDay]:{...prev[activeDay],[id]:{
      w:String(w),r:String(r),s:String(s),
      setDetails:Array.from({length:s},()=>({w:String(w),r:String(r)})),
    }}}));
    setNewExName("");setNewExW("");setNewExR("");setNewExS("");
    setShowAddEx(false);
  };

  const handleSaveTemplate=()=>{
    const name=templateName.trim()||`${DAYS[activeDay].shortLabel} Template`;
    onSaveTemplate(activeDay,name);
    setTemplateName("");
  };

  if(saved&&savedEntry){
    const recap=buildWorkoutRecap(savedEntry,history,customEx);
    return(
    <div style={{background:"linear-gradient(140deg,#0a1a12,#080a09)",
      border:"1px solid #1a3d2c",borderRadius:6,padding:"18px 16px",textAlign:"left"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:14}}>
        <div>
          <div style={{fontSize:9,color:"#2DD4A0",fontWeight:900,
            textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4}}>Workout Recap</div>
          <div style={{color:"#fff",fontWeight:900,fontSize:22,lineHeight:1.1}}>
            {isDaily?`${DAYS[savedEntry.dayKey]?.label||"Daily workout"} logged`:`Week ${savedEntry.week} logged`}
          </div>
          <div style={{color:"#2a4a35",fontSize:11,marginTop:4}}>Charts updated and saved.</div>
        </div>
        <div style={{fontSize:34,lineHeight:1}}>💪</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        {[
          ["Volume",`${recap.total.toLocaleString()} lbs`,"#7C6FFF"],
          ["Sets",String(recap.setCount),"#38BFFF"],
          ["PRs",String(recap.prCount),"#FFB347"],
          ["Muscles",String(recap.trainedMuscles.length),"#2DD4A0"],
        ].map(([label,value,color])=>(
          <div key={label} style={{background:"#070908",border:`1px solid ${color}33`,
            borderRadius:5,padding:"10px 11px"}}>
            <div style={{fontSize:8,color:color,fontWeight:900,letterSpacing:"0.1em",
              textTransform:"uppercase",marginBottom:4}}>{label}</div>
            <div style={{fontSize:16,color:"#fff",fontWeight:900}}>{value}</div>
          </div>
        ))}
      </div>

      {recap.bestLift&&(
        <div style={{background:"#070908",border:"1px solid #252d29",
          borderRadius:5,padding:"11px 12px",marginBottom:10}}>
          <div style={{fontSize:9,color:"#FFB347",fontWeight:900,
            textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Best Lift</div>
          <div style={{fontSize:14,color:"#fff",fontWeight:900}}>{recap.bestLift.ex.name}</div>
          <div style={{fontSize:11,color:"#98a19c",marginTop:3}}>
            {recap.bestLift.volume.toLocaleString()} lbs volume · {recap.bestLift.w}lbs x {recap.bestLift.r} reps x {recap.bestLift.s} sets
          </div>
        </div>
      )}

      <div style={{background:"#070908",border:"1px solid #24304f",
        borderRadius:5,padding:"11px 12px",marginBottom:10}}>
        <div style={{fontSize:9,color:"#38BFFF",fontWeight:900,
          textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Workout Story</div>
        <div style={{fontSize:14,color:"#fff",fontWeight:950,marginBottom:5}}>
          {recap.storyHeadline}
        </div>
        <div style={{fontSize:11,color:"#777",lineHeight:1.5,marginBottom:9}}>
          {recap.storyNarrative}
        </div>
        <div style={{fontSize:8,color:"#87918c",fontWeight:950,textTransform:"uppercase",
          letterSpacing:"0.08em",marginBottom:6}}>Story Highlights</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:6}}>
          {recap.storyHighlights.map(item=>(
            <div key={item.label} style={{background:"#0a0d0c",border:`1px solid ${item.color}25`,
              borderRadius:8,padding:"8px",minWidth:0}}>
              <div style={{fontSize:8,color:item.color,fontWeight:950,marginBottom:3,
                textTransform:"uppercase",letterSpacing:"0.08em"}}>{item.label}</div>
              <div style={{fontSize:10,color:"#aaa",fontWeight:850,lineHeight:1.35,
                overflow:"hidden",textOverflow:"ellipsis"}}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {recap.trainedMuscles.length>0&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
          {recap.trainedMuscles.map(group=>(
            <span key={group.id} style={{fontSize:10,color:group.color,
              border:`1px solid ${group.color}44`,background:"#070908",
              borderRadius:999,padding:"5px 8px",fontWeight:900}}>
              {group.label} {fmtVol(recap.trainedMuscles.length?getMuscleVolumes(savedEntry,customEx)[group.id]:0)}
            </span>
          ))}
        </div>
      )}

      {rating>0&&<div style={{fontSize:18,marginBottom:10,color:"#FFB347",textAlign:"center"}}>{"★".repeat(rating)}{"☆".repeat(5-rating)}</div>}

      <button onClick={copyShareText} style={{width:"100%",padding:"12px",borderRadius:5,
        border:"none",background:"linear-gradient(135deg,#7C6FFF,#2DD4A0)",
        color:"#fff",fontWeight:900,fontSize:13,cursor:"pointer"}}>
        {copiedShare?"Copied Story":"Copy Story Recap"}
      </button>
    </div>
    );
  }

  return(
    <div className="earned-workout-view earned-workout-view--train">
      {showRestoredNote&&(
        <div style={{background:"#0a1a12",border:"1px solid #1a3d2c",borderRadius:5,
          padding:"9px 12px",marginBottom:12,display:"flex",justifyContent:"space-between",
          alignItems:"center",gap:8}}>
          <span style={{fontSize:11,color:"#2DD4A0"}}>
            {loadedLibraryFocus
              ?`Library workout loaded for ${loadedLibraryFocus.exerciseName}`
              : loadedCoachPlan
              ?`↺ Coach program loaded for ${DAYS[loadedCoachPlan.dayKey]?.label||"your workout"}`
              : loadedAdaptivePlan
                ?`↺ Loaded adaptive plan for ${DAYS[loadedAdaptivePlan.dayKey]?.label||"your next workout"}`
              :"↺ Restored unsaved entries from last session"}
          </span>
          <button onClick={()=>setShowRestoredNote(false)} style={{background:"none",border:"none",
            color:"#2DD4A0",fontSize:14,cursor:"pointer",padding:0,lineHeight:1}}>×</button>
        </div>
      )}

      {loadedLibraryFocus&&(
        <div style={{background:`linear-gradient(145deg,${DAYS[loadedLibraryFocus.dayKey]?.dim||"#38BFFF18"},#070908 72%)`,
          border:`1px solid ${DAYS[loadedLibraryFocus.dayKey]?.accent||"#38BFFF"}44`,
          borderRadius:6,padding:"12px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",marginBottom:8}}>
            <div style={{minWidth:0}}>
              <div style={{fontSize:9,color:DAYS[loadedLibraryFocus.dayKey]?.accent||"#38BFFF",
                fontWeight:950,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:3}}>
                Library Exercise Loaded
              </div>
              <div style={{fontSize:14,color:"#fff",fontWeight:950,overflow:"hidden",
                textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{loadedLibraryFocus.exerciseName}</div>
              <div style={{fontSize:10,color:"#87918c",lineHeight:1.4,marginTop:4}}>{loadedLibraryFocus.bestUse}</div>
            </div>
            <div style={{fontSize:10,color:DAYS[loadedLibraryFocus.dayKey]?.accent||"#38BFFF",
              fontWeight:950,whiteSpace:"nowrap"}}>{DAYS[loadedLibraryFocus.dayKey]?.shortLabel}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:6}}>
            {[
              ["Muscle",loadedLibraryFocus.muscle],
              ["Gear",loadedLibraryFocus.equipment],
              ["Range",loadedLibraryFocus.repRange],
            ].map(([label,value])=>(
              <div key={label} style={{background:"#070908",border:"1px solid #1b211f",
                borderRadius:8,padding:"8px",minWidth:0}}>
                <div style={{fontSize:8,color:"#87918c",fontWeight:950,textTransform:"uppercase",
                  letterSpacing:"0.08em",marginBottom:3}}>{label}</div>
                <div style={{fontSize:10,color:"#aaa",fontWeight:900,overflow:"hidden",
                  textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loadedAdaptivePlan&&(
        <div style={{background:`linear-gradient(145deg,${DAYS[loadedAdaptivePlan.dayKey]?.dim||"#7C6FFF18"},#070908 72%)`,
          border:`1px solid ${DAYS[loadedAdaptivePlan.dayKey]?.accent||"#7C6FFF"}44`,
          borderRadius:6,padding:"11px 12px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:8}}>
            <div style={{minWidth:0}}>
              <div style={{fontSize:9,color:DAYS[loadedAdaptivePlan.dayKey]?.accent||"#7C6FFF",
                fontWeight:900,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>
                Adaptive Plan Loaded
              </div>
              <div style={{fontSize:13,color:"#fff",fontWeight:950,lineHeight:1.2}}>
                {loadedAdaptivePlan.mode} · {loadedAdaptivePlan.intensity}
              </div>
            </div>
            <div style={{fontSize:11,color:DAYS[loadedAdaptivePlan.dayKey]?.accent||"#7C6FFF",
              fontWeight:950,flexShrink:0}}>
              {loadedAdaptivePlan.score} fit
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {(loadedAdaptivePlan.prescriptions||[]).slice(0,3).map(item=>(
              <div key={item.id} style={{display:"grid",gridTemplateColumns:"1fr auto",
                gap:8,alignItems:"center",background:"#070908",border:`1px solid ${item.color||"#7C6FFF"}25`,
                borderRadius:8,padding:"7px 8px"}}>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:10,color:"#ddd",fontWeight:900,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                  <div style={{fontSize:9,color:"#87918c",marginTop:2}}>{item.detail}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:9,color:item.color||"#7C6FFF",fontWeight:950}}>{item.action}</div>
                  <div style={{fontSize:10,color:"#fff",fontWeight:900,marginTop:2}}>{item.target}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loadedCoachPlan&&(
        <div style={{background:`linear-gradient(145deg,${DAYS[loadedCoachPlan.dayKey]?.dim||"#2DD4A018"},#070908 72%)`,
          border:`1px solid ${DAYS[loadedCoachPlan.dayKey]?.accent||"#2DD4A0"}44`,
          borderRadius:6,padding:"12px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",marginBottom:9}}>
            <div>
              <div style={{fontSize:9,color:DAYS[loadedCoachPlan.dayKey]?.accent||"#2DD4A0",
                fontWeight:950,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:3}}>
                {loadedCoachPlan.programPack?"Program Pack Loaded":"Coach Program Loaded"}
              </div>
              <div style={{fontSize:14,color:"#fff",fontWeight:950}}>{loadedCoachPlan.focus}</div>
              <div style={{fontSize:10,color:"#87918c",lineHeight:1.4,marginTop:4}}>{loadedCoachPlan.reason}</div>
            </div>
            <div style={{fontSize:10,color:DAYS[loadedCoachPlan.dayKey]?.accent||"#2DD4A0",
              fontWeight:950,whiteSpace:"nowrap"}}>{loadedCoachPlan.label}</div>
          </div>
          {(loadedCoachPlan.exercises||[]).slice(0,4).map(item=>(
            <div key={item.id} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,
              padding:"7px 0",borderTop:"1px solid #1b211f"}}>
              <div style={{fontSize:10,color:"#ddd",fontWeight:900,overflow:"hidden",
                textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
              <div style={{fontSize:9,color:"#38BFFF",fontWeight:950}}>{item.sets} x {item.reps}</div>
            </div>
          ))}
        </div>
      )}

      {/* Day tabs */}
      {isDaily&&(
        <div style={{background:"#071811",border:"1px solid #1f4a38",borderRadius:5,
          padding:"9px 11px",marginBottom:10,fontSize:10,color:"#2DD4A0",
          fontWeight:850,lineHeight:1.4}}>
          Choose today's workout. Only this section will be saved and counted.
        </div>
      )}
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {DAY_KEYS.map(dk=>{
          const day=DAYS[dk],isActive=activeDay===dk,isDone=!isDaily&&completedDays[dk];
          return(
            <button key={dk} onClick={()=>setActiveDay(dk)} style={{
              flex:1,padding:"11px 4px",minHeight:42,borderRadius:9,border:"none",cursor:"pointer",
              fontSize:10,fontWeight:800,lineHeight:1.4,
              background:isActive?day.accent:isDone?day.dim:"#0a0d0c",
              color:isActive?"#fff":isDone?day.accent:"#66706b",
              outline:isDone&&!isActive?`1px solid ${day.accent}44`:"none",transition:"all 0.15s"}}>
              {isDone?"✓ ":""}{day.shortLabel}
            </button>
          );
        })}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8,marginBottom:10}}>
        <button onClick={()=>repeatLastDay(activeDay)} disabled={!history.length} style={{
          padding:"11px 8px",minHeight:42,borderRadius:9,
          border:`1px solid ${DAYS[activeDay].accent}33`,
          background:history.length?`${DAYS[activeDay].accent}14`:"#070908",
          color:history.length?DAYS[activeDay].accent:"#66706b",
          fontSize:11,fontWeight:800,cursor:history.length?"pointer":"default",
          opacity:history.length?1:0.6}}>
          Repeat Last
        </button>
        <button onClick={()=>clearDayInputs(activeDay)} style={{
          padding:"11px 8px",minHeight:42,borderRadius:9,
          border:"1px solid #252d29",background:"#070908",
          color:"#87918c",fontSize:11,fontWeight:800,cursor:"pointer"}}>
          Clear Day
        </button>
        <button onClick={undoLastInputEdit} disabled={!undoAvailable} style={{
          padding:"11px 6px",minHeight:42,borderRadius:9,
          border:`1px solid ${undoAvailable?"#FFB34755":"#252d29"}`,
          background:undoAvailable?"#1a1207":"#070908",
          color:undoAvailable?"#FFB347":"#66706b",fontSize:10,fontWeight:900,
          cursor:undoAvailable?"pointer":"default"}}>
          Undo Last Edit
        </button>
      </div>

      <div style={{background:"#070908",border:"1px solid #1b211f",
        borderRadius:6,padding:"11px 12px",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:9}}>
          <div>
            <div style={{fontSize:9,color:DAYS[activeDay].accent,fontWeight:900,
              textTransform:"uppercase",letterSpacing:"0.1em"}}>Workout Templates</div>
            <div style={{fontSize:10,color:"#747e79",marginTop:2}}>
              Save and reuse this day's exercise setup.
            </div>
          </div>
          <span style={{fontSize:10,color:"#66706b",fontWeight:800}}>{activeTemplates.length} saved</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:6,marginBottom:8}}>
          <input value={templateName} onChange={e=>setTemplateName(e.target.value)}
            placeholder={`${DAYS[activeDay].shortLabel} Template`}
            style={{background:"#0a0d0c",border:"1px solid #252d29",borderRadius:8,
              color:"#fff",padding:"9px 10px",fontSize:12,fontWeight:700,outline:"none",
              minWidth:0}}/>
          <button onClick={handleSaveTemplate} style={{
            padding:"9px 11px",borderRadius:8,border:"none",
            background:DAYS[activeDay].accent,color:"#fff",
            fontSize:11,fontWeight:900,cursor:"pointer"}}>
            Save
          </button>
        </div>
        {activeTemplates.length>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {activeTemplates.map(template=>(
              <div key={template.id} style={{display:"grid",gridTemplateColumns:"1fr auto auto",
                gap:6,alignItems:"center",background:"#0a0d0c",border:"1px solid #1d2421",
                borderRadius:8,padding:"7px 8px"}}>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:11,color:"#ddd",fontWeight:800,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{template.name}</div>
                  <div style={{fontSize:9,color:"#66706b"}}>{template.exerciseIds?.length||0} exercises</div>
                </div>
                <button onClick={()=>onApplyTemplate(activeDay,template.id)} style={{
                  padding:"6px 8px",borderRadius:7,border:"1px solid #2DD4A044",
                  background:"#061811",color:"#2DD4A0",fontSize:10,fontWeight:900,cursor:"pointer"}}>
                  Apply
                </button>
                <button onClick={()=>onDeleteTemplate(template.id)} style={{
                  padding:"6px 8px",borderRadius:7,border:"1px solid #2a1a1a",
                  background:"none",color:"#6a3030",fontSize:10,fontWeight:900,cursor:"pointer"}}>
                  Del
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live preview */}
      <div style={{background:"#0a0d0c",borderRadius:9,padding:"9px 12px",marginBottom:10,
        border:"1px solid #2a312e",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:10,color:"#66706b"}}>Live Volume · {activeLoggedCount} logged</span>
        <span style={{fontSize:13,fontWeight:800,color:"#fff"}}>
          {previewVol.toLocaleString()} lbs
          {prevDayVol>0&&(
            <span style={{marginLeft:8,fontSize:10,fontWeight:700,
              color:previewDiff>=0?"#2DD4A0":"#FF5C87"}}>
              {previewDiff>=0?"▲":"▼"} {Math.abs(previewDiff).toLocaleString()}
            </span>
          )}
        </span>
      </div>
      <p style={{margin:"-4px 0 10px",fontSize:9,color:"#46514b",lineHeight:1.4}}>
        Tap Skip on exercises you did not do. Skipped exercises stay out of this {isDaily?"session":"week"}'s volume.
      </p>
      <WorkoutAsciiReactor volume={previewVol} setCount={activeSetCount}
        loggedCount={activeLoggedCount} restRemaining={restRemaining}
        readiness={readinessScore} accent={DAYS[activeDay].accent}/>
      <ForgeLiveConsole exercise={activeFocusExercise?.name}
        weight={activeFocusWorkingWeight} reps={activeFocusWorkingReps}
        sets={activeFocusSetRows.length} completedSets={activeFocusCompletedSets}
        volume={isLoggedLiftCell(activeFocusCell)?activeFocusParsed.volume:0}
        restRemaining={restRemaining} restActive={restActive}
        accent={DAYS[activeDay].accent}/>
      <LivePRRadar radar={livePrRadar}/>
      <SessionPacer pacer={sessionPacer} onResetClock={resetSessionClock}/>

      <div style={{background:restRemaining>0?"#071622":"#070908",
        border:`1px solid ${restRemaining>0?"#38BFFF55":"#1b211f"}`,
        borderRadius:6,padding:"11px 12px",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:9}}>
          <div>
            <div style={{fontSize:9,color:"#38BFFF",fontWeight:900,
              textTransform:"uppercase",letterSpacing:"0.1em"}}>Rest Timer</div>
            <div style={{fontSize:10,color:"#747e79",marginTop:2}}>
              {restLabel||"Choose a rest length, then start it after a set."}
            </div>
          </div>
          <div style={{fontSize:26,color:restRemaining>0?"#fff":"#66706b",fontWeight:900,
            fontVariantNumeric:"tabular-nums",lineHeight:1}}>
            {fmtTime(restRemaining||restPreset)}
          </div>
        </div>
        <button type="button" role="switch" aria-checked={autoStartRest}
          onClick={()=>setAutoStartRest(value=>!value)} style={{width:"100%",minHeight:34,
            display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,
            marginBottom:8,padding:"6px 8px",borderRadius:8,
            border:`1px solid ${autoStartRest?"#2DD4A055":"#252d29"}`,
            background:autoStartRest?"#061811":"#0a0d0c",cursor:"pointer"}}>
          <span style={{fontSize:9,color:autoStartRest?"#2DD4A0":"#87918c",fontWeight:900}}>
            Auto-start rest
          </span>
          <span style={{width:30,height:16,borderRadius:8,padding:2,boxSizing:"border-box",
            background:autoStartRest?"#2DD4A0":"#22223b",display:"flex",
            justifyContent:autoStartRest?"flex-end":"flex-start",transition:"all 0.2s"}}>
            <span style={{width:12,height:12,borderRadius:"50%",background:"#fff"}}/>
          </span>
        </button>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:8}}>
          {[60,90,120].map(sec=>(
            <button key={sec} onClick={()=>setRestPreset(sec)} style={{
              padding:"7px 4px",borderRadius:7,
              border:`1px solid ${restPreset===sec?"#38BFFF66":"#252d29"}`,
              background:restPreset===sec?"#0a2233":"#0a0d0c",
              color:restPreset===sec?"#38BFFF":"#87918c",
              fontSize:10,fontWeight:900,cursor:"pointer"}}>
              {fmtTime(sec)}
            </button>
          ))}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,
            border:`1px solid ${![60,90,120].includes(restPreset)?"#38BFFF66":"#252d29"}`,
            background:![60,90,120].includes(restPreset)?"#0a2233":"#0a0d0c",
            borderRadius:7,padding:4}}>
            <input type="number" inputMode="numeric" min="0" value={customRestMin}
              onFocus={e=>e.target.select()}
              onChange={e=>updateCustomRest(e.target.value,customRestSec)}
              aria-label="Custom rest minutes"
              style={{width:"100%",background:"#070908",border:"1px solid #16263d",
                borderRadius:5,color:"#fff",fontSize:11,fontWeight:900,textAlign:"center",
                padding:"5px 2px",boxSizing:"border-box",outline:"none"}}/>
            <input type="number" inputMode="numeric" min="0" max="59" value={customRestSec}
              onFocus={e=>e.target.select()}
              onChange={e=>updateCustomRest(customRestMin,e.target.value)}
              aria-label="Custom rest seconds"
              style={{width:"100%",background:"#070908",border:"1px solid #16263d",
                borderRadius:5,color:"#fff",fontSize:11,fontWeight:900,textAlign:"center",
                padding:"5px 2px",boxSizing:"border-box",outline:"none"}}/>
            <div style={{gridColumn:"1/3",fontSize:8,color:"#38BFFF",fontWeight:900,
              textAlign:"center",lineHeight:1}}>Custom</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr",gap:6}}>
          <button onClick={()=>startRest("Manual rest",restPreset)} style={{
            padding:"8px",borderRadius:8,border:"none",
            background:"#38BFFF",color:"#06101a",fontSize:11,fontWeight:900,cursor:"pointer"}}>
            Start Rest
          </button>
          <button onClick={restActive?pauseRest:resumeRest} disabled={restRemaining<=0} style={{
            padding:"8px",borderRadius:8,border:"1px solid #252d29",
            background:"none",color:restRemaining>0?"#aaa":"#66706b",
            fontSize:11,fontWeight:800,cursor:restRemaining>0?"pointer":"default"}}>
            {restActive?"Pause":"Resume"}
          </button>
          <button onClick={clearRest} disabled={restRemaining<=0} style={{
            padding:"8px",borderRadius:8,border:"1px solid #252d29",
            background:"none",color:restRemaining>0?"#777":"#66706b",
            fontSize:11,fontWeight:800,cursor:restRemaining>0?"pointer":"default"}}>
            Clear
          </button>
        </div>
      </div>

      {activeFocusExercise&&(
        <div style={{background:`linear-gradient(145deg,${DAYS[activeDay].dim},#070908 74%)`,
          border:`1px solid ${DAYS[activeDay].accent}44`,borderRadius:6,
          padding:"12px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",marginBottom:9}}>
            <div style={{minWidth:0}}>
              <div style={{fontSize:9,color:DAYS[activeDay].accent,fontWeight:950,
                textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:3}}>
                Active Exercise Focus
              </div>
              <div style={{fontSize:15,color:"#fff",fontWeight:950,overflow:"hidden",
                textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeFocusExercise.name}</div>
              <div style={{fontSize:10,color:"#87918c",marginTop:4}}>
                {activeFocusSuggestion?.detail}
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:15,color:"#fff",fontWeight:950}}>
                {activeFocusParsed.volume.toLocaleString()}
              </div>
              <div style={{fontSize:9,color:"#87918c",fontWeight:800}}>lbs now</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:6}}>
            {[
              ["Sets",String(activeFocusParsed.s||0)],
              ["Best",activeFocusParsed.w?`${activeFocusParsed.w} lbs`:"0 lbs"],
              ["Source",activeFocusSuggestion?.label||"None"],
            ].map(([label,value])=>(
              <div key={label} style={{background:"#070908",border:"1px solid #1b211f",
                borderRadius:8,padding:"8px",minWidth:0}}>
                <div style={{fontSize:8,color:"#87918c",fontWeight:950,textTransform:"uppercase",
                  letterSpacing:"0.08em",marginBottom:3}}>{label}</div>
                <div style={{fontSize:11,color:"#aaa",fontWeight:900,overflow:"hidden",
                  textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value}</div>
              </div>
            ))}
          </div>
          {activeFocusTechniqueCoach&&(
            <div style={{marginTop:10}}>
              <TechniqueCoachPanel coach={activeFocusTechniqueCoach} compact/>
            </div>
          )}
          <NextSetCoach coach={activeFocusNextSetCoach}
            onApplySuggestion={()=>applyNextSetSuggestion(activeDay,activeFocusExercise,activeFocusNextSetCoach)}/>
          <SetQualitySummary summary={activeFocusSetQualitySummary}/>
          <ActiveExerciseHistory rows={activeFocusHistory}/>
          {activeFocusExercise&&activeFocusExerciseNote&&(
            <div style={{marginTop:10}}>
              <ExerciseNotesPanel ex={activeFocusExercise} noteRecord={activeFocusExerciseNote}
                onSaveExerciseNote={onSaveExerciseNote} compact/>
            </div>
          )}
          {activeFocusSubstitutions.length>0&&(
            <div style={{marginTop:10,borderTop:"1px solid #252f2a",paddingTop:10}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"baseline",marginBottom:8}}>
                <div>
                  <div style={{fontSize:8,color:"#2DD4A0",fontWeight:950,
                    textTransform:"uppercase",letterSpacing:"0.1em"}}>Smart Substitutions</div>
                  <div style={{fontSize:9,color:"#87918c",fontWeight:800,marginTop:3}}>
                    Same muscle swaps when equipment is busy or a movement feels off.
                  </div>
                </div>
                <div style={{fontSize:8,color:"#777",fontWeight:900,whiteSpace:"nowrap"}}>Draft-only swap</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {activeFocusSubstitutions.slice(0,3).map(swap=>(
                  <div key={`${swap.dayKey}_${swap.ex.id}`} style={{display:"grid",
                    gridTemplateColumns:"1fr auto",gap:9,alignItems:"center",
                    border:"1px solid #202923",borderRadius:9,padding:"8px 9px",
                    background:"#070908"}}>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:11,color:"#fff",fontWeight:950,
                        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{swap.ex.name}</div>
                      <div style={{fontSize:8,color:swap.profile.color,fontWeight:900,marginTop:3}}>
                        Same muscle - {swap.profile.target} - {swap.profile.equipmentLabel}
                      </div>
                      <div style={{fontSize:8,color:"#87918c",fontWeight:800,marginTop:3,
                        lineHeight:1.35}}>
                        Substitute for {activeFocusExercise.name}. {swap.reason} Start from {swap.source}.
                      </div>
                    </div>
                    <button onClick={()=>applyExerciseSubstitution(activeDay,activeFocusExercise,swap)}
                      style={{border:"none",borderRadius:8,padding:"8px 9px",
                        background:"#2DD4A0",color:"#061811",fontSize:9,
                        fontWeight:950,cursor:"pointer",whiteSpace:"nowrap"}}>
                      Add Swap
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8,marginTop:10}}>
            <div style={{background:"#070908",border:`1px solid ${DAYS[activeDay].accent}33`,
              borderRadius:5,padding:"10px",minWidth:0}}>
              <div style={{fontSize:8,color:DAYS[activeDay].accent,fontWeight:950,
                textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Plate Calculator</div>
              <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"baseline",marginBottom:5}}>
                <span style={{fontSize:9,color:"#87918c",fontWeight:900}}>working weight</span>
                <span style={{fontSize:13,color:"#fff",fontWeight:950}}>
                  {Math.round(activeFocusWorkingWeight)} lbs
                </span>
              </div>
              {activeFocusProfile?.equipment==="barbell"&&activeFocusPlateLoad.target>=45?(
                <>
                  <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"baseline",marginBottom:5}}>
                    <span style={{fontSize:9,color:"#87918c",fontWeight:900}}>Bar Load</span>
                    <span style={{fontSize:10,color:"#38BFFF",fontWeight:950}}>
                      {activeFocusPlateLoad.summary} per side
                    </span>
                  </div>
                  <div style={{fontSize:8,color:activeFocusPlateLoad.loadable?"#87918c":"#FFB347",
                    lineHeight:1.35,fontWeight:800}}>
                    {activeFocusPlateLoad.loadable
                      ?`45 lb bar - ${activeFocusPlateLoad.perSide.toLocaleString()} lbs per side.`
                      :`Closest common plates leave ${activeFocusPlateLoad.remainder} lb per side.`}
                  </div>
                </>
              ):(
                <div style={{fontSize:9,color:"#87918c",lineHeight:1.4,fontWeight:800}}>
                  Bar Load is only needed for barbell lifts. Use the warmups for machine or dumbbell work.
                </div>
              )}
            </div>

            <div style={{background:"#070908",border:"1px solid #252d29",
              borderRadius:5,padding:"10px",minWidth:0}}>
              <div style={{fontSize:8,color:"#FFB347",fontWeight:950,
                textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Warmup Planner</div>
              {activeFocusWarmups.length>0?(
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {activeFocusWarmups.map((set,index)=>(
                    <div key={`${set.weight}_${index}`} style={{display:"grid",
                      gridTemplateColumns:"34px 1fr auto",gap:7,alignItems:"center",
                      background:"#0a0d0c",border:"1px solid #202923",borderRadius:7,
                      padding:"6px 7px"}}>
                      <div style={{fontSize:8,color:"#87918c",fontWeight:950}}>W{index+1}</div>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:10,color:"#ddd",fontWeight:900,
                          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{set.label}</div>
                        <div style={{fontSize:8,color:"#747e79",fontWeight:800}}>{Math.round(set.pct*100)}%</div>
                      </div>
                      <div style={{fontSize:9,color:"#FFB347",fontWeight:950,whiteSpace:"nowrap"}}>
                        {set.weight} x {set.reps}
                      </div>
                    </div>
                  ))}
                </div>
              ):(
                <div style={{fontSize:9,color:"#87918c",lineHeight:1.4,fontWeight:800}}>
                  Enter a working weight to generate warmup sets.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exercise inputs */}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
        {activeExercises.map(ex=>{
          const cell=inputs[activeDay][ex.id]||{w:"0",r:"0",s:"0"};
          const skipped=isSkippedLiftCell(cell);
          const isFocused=activeFocusExercise?.id===ex.id;
          return(
          <div key={ex.id} style={{background:skipped?"#070907":"#070908",borderRadius:5,padding:"11px",
            border:`1px solid ${isFocused?DAYS[activeDay].accent+"88":skipped?"#263653":"#1b211f"}`,
            boxShadow:isFocused?`0 0 0 1px ${DAYS[activeDay].accent}22`:"none",opacity:skipped?0.82:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
              <div style={{fontSize:12,color:"#bbb",fontWeight:700}}>
                {ex.name}
                {ex.isCustom&&<span style={{fontSize:8,color:"#38BFFF",marginLeft:5,
                  border:"1px solid #38BFFF33",borderRadius:4,padding:"1px 4px"}}>CUSTOM</span>}
                {skipped&&<span style={{fontSize:8,color:"#38BFFF",marginLeft:5,
                  border:"1px solid #38BFFF33",borderRadius:4,padding:"1px 4px"}}>SKIPPED</span>}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <button onClick={()=>startRest(`${ex.name} rest`,restPreset)} disabled={skipped} style={{
                  background:skipped?"none":"#0a2233",
                  border:`1px solid ${skipped?"#252d29":"#38BFFF44"}`,
                  color:skipped?"#66706b":"#38BFFF",
                  borderRadius:6,padding:"4px 8px",fontSize:9,fontWeight:800,
                  cursor:skipped?"default":"pointer"}}>
                  Rest
                </button>
                <button onClick={()=>toggleSkipped(activeDay,ex.id)} style={{
                  background:skipped?"#071622":"none",
                  border:`1px solid ${skipped?"#38BFFF66":"#252d29"}`,
                  color:skipped?"#38BFFF":"#87918c",
                  borderRadius:6,padding:"4px 8px",fontSize:9,fontWeight:800,cursor:"pointer"}}>
                  {skipped?"Log":"Skip"}
                </button>
                <button onClick={()=>{
                  if(confirm(`Remove "${ex.name}" from this workout day? You can restore it later.`)) onRemoveExercise(activeDay,ex.id);
                }} style={{background:"none",border:"1px solid #2a1a1a",color:"#5a2a2a",
                  borderRadius:6,padding:"4px 8px",fontSize:9,fontWeight:800,cursor:"pointer"}}>
                  Remove
                </button>
              </div>
            </div>
            <div style={{marginBottom:8}}>
              <div style={{fontSize:8,color:"#747e79",fontWeight:950,textTransform:"uppercase",
                letterSpacing:"0.08em",marginBottom:5}}>Quick Actions</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:6}}>
                <button onClick={()=>setActiveFocusId(ex.id)} style={{
                  padding:"8px 6px",minHeight:36,borderRadius:8,
                  border:`1px solid ${isFocused?DAYS[activeDay].accent+"77":"#252d29"}`,
                  background:isFocused?DAYS[activeDay].dim:"#0a0d0c",
                  color:isFocused?DAYS[activeDay].accent:"#87918c",
                  fontSize:9,fontWeight:950,cursor:"pointer"}}>
                  Focus
                </button>
                <button onClick={()=>copyPreviousLiftToExercise(activeDay,ex)} disabled={skipped}
                  style={{padding:"8px 6px",minHeight:36,borderRadius:8,
                    border:`1px solid ${skipped?"#16263d":"#2DD4A044"}`,
                    background:skipped?"#070908":"#061811",
                    color:skipped?"#2a4058":"#2DD4A0",
                    fontSize:9,fontWeight:950,cursor:skipped?"default":"pointer"}}>
                  Copy Last Workout
                </button>
                <button onClick={()=>repeatLastSetForExercise(activeDay,ex)} disabled={skipped}
                  style={{padding:"8px 6px",minHeight:36,borderRadius:8,
                    border:`1px solid ${skipped?"#16263d":"#38BFFF44"}`,
                    background:skipped?"#070908":"#071622",
                    color:skipped?"#2a4058":"#38BFFF",
                    fontSize:9,fontWeight:950,cursor:skipped?"default":"pointer"}}>
                  Repeat Last Set
                </button>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {getLiftSetRows(cell).map((row,index)=>{
                const selectedQuality=row?.quality||"good";
                const setLogged=(Number(row?.w)||0)>0&&(Number(row?.r)||0)>0;
                const setCompleted=row?.completed===true;
                return(
                  <div key={index} style={{display:"flex",flexDirection:"column",gap:5}}>
                    <div style={{display:"grid",gridTemplateColumns:"42px 1fr 1fr 34px",gap:6,alignItems:"end"}}>
                      <div style={{fontSize:10,color:"#747e79",fontWeight:900,paddingBottom:11}}>Set {index+1}</div>
                      {[["w","Weight"],["r","Reps"]].map(([field,label])=>{
                        const beat=getBeat(activeDay,ex.id,field);
                        return(
                          <div key={field}>
                            {index===0&&(
                              <div style={{fontSize:9,color:beat?"#2DD4A0":"#46514b",marginBottom:3,
                                textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>
                                {label}{beat?" ↑":""}
                              </div>
                            )}
                            <input type="number" inputMode={field==="w"?"decimal":"numeric"}
                              min="0" step={field==="w"?"0.5":"1"}
                              onFocus={e=>e.target.select()}
                              value={row?.[field]??""}
                              onChange={e=>handleSetChange(activeDay,ex.id,index,field,e.target.value)}
                              disabled={skipped}
                              style={{width:"100%",background:"#0a0d0c",
                                border:`1px solid ${skipped?"#16263d":beat?"#2DD4A0":"#252d29"}`,
                                borderRadius:7,color:skipped?"#2a4058":beat?"#2DD4A0":"#fff",
                                padding:"10px 10px",minHeight:42,fontSize:16,outline:"none",
                                boxSizing:"border-box",fontWeight:700,transition:"all 0.2s",
                                cursor:skipped?"not-allowed":"text"}}/>
                          </div>
                        );
                      })}
                      <button onClick={()=>removeSetRow(activeDay,ex.id,index)} disabled={skipped}
                        style={{height:42,borderRadius:7,border:"1px solid #2a1a1a",
                          background:"none",color:skipped?"#46514b":"#6a3030",
                          fontSize:15,fontWeight:900,cursor:skipped?"default":"pointer"}}>×</button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"42px repeat(4,minmax(0,1fr))",gap:5,alignItems:"center"}}>
                      <div style={{fontSize:8,color:"#747e79",fontWeight:950,textTransform:"uppercase",
                        letterSpacing:"0.06em"}}>Quick Adjust</div>
                      <button onClick={()=>adjustSetValue(activeDay,ex.id,index,"w",-5)} disabled={skipped}
                        style={{border:"1px solid #252d29",background:"#0a0d0c",
                          color:skipped?"#2a4058":"#FFB347",borderRadius:7,padding:"6px 3px",
                          fontSize:8,fontWeight:950,cursor:skipped?"default":"pointer",minHeight:28}}>
                        -5 lb
                      </button>
                      <button onClick={()=>adjustSetValue(activeDay,ex.id,index,"w",5)} disabled={skipped}
                        style={{border:"1px solid #252d29",background:"#0a0d0c",
                          color:skipped?"#2a4058":"#FFB347",borderRadius:7,padding:"6px 3px",
                          fontSize:8,fontWeight:950,cursor:skipped?"default":"pointer",minHeight:28}}>
                        +5 lb
                      </button>
                      <button onClick={()=>adjustSetValue(activeDay,ex.id,index,"r",-1)} disabled={skipped}
                        style={{border:"1px solid #252d29",background:"#0a0d0c",
                          color:skipped?"#2a4058":"#38BFFF",borderRadius:7,padding:"6px 3px",
                          fontSize:8,fontWeight:950,cursor:skipped?"default":"pointer",minHeight:28}}>
                        -1 rep
                      </button>
                      <button onClick={()=>adjustSetValue(activeDay,ex.id,index,"r",1)} disabled={skipped}
                        style={{border:"1px solid #252d29",background:"#0a0d0c",
                          color:skipped?"#2a4058":"#38BFFF",borderRadius:7,padding:"6px 3px",
                          fontSize:8,fontWeight:950,cursor:skipped?"default":"pointer",minHeight:28}}>
                        +1 rep
                      </button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"42px repeat(4,minmax(0,1fr))",gap:5,alignItems:"center"}}>
                      <div style={{fontSize:8,color:"#747e79",fontWeight:950,textTransform:"uppercase",
                        letterSpacing:"0.06em"}}>Set Quality</div>
                      {SET_QUALITY_OPTIONS.map(quality=>{
                        const active=selectedQuality===quality.id;
                        return(
                          <button key={quality.id}
                            onClick={()=>handleSetQuality(activeDay,ex.id,index,quality.id)}
                            disabled={skipped}
                            style={{border:`1px solid ${active?quality.color+"88":"#252d29"}`,
                              background:active?quality.color+"22":"#0a0d0c",
                              color:skipped?"#2a4058":active?quality.color:"#87918c",
                              borderRadius:7,padding:"6px 3px",fontSize:8,
                              fontWeight:950,cursor:skipped?"default":"pointer",
                              minHeight:28}}>
                            {quality.label}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={()=>completeSetRow(activeDay,ex.id,index,ex.name)}
                      disabled={skipped||!setLogged||setCompleted}
                      style={{width:"100%",minHeight:34,borderRadius:8,
                        border:`1px solid ${setCompleted?"#2DD4A077":"#252d29"}`,
                        background:setCompleted?"#061811":"#0a0d0c",
                        color:skipped||!setLogged?"#2a4058":setCompleted?"#2DD4A0":"#aaa",
                        fontSize:9,fontWeight:950,
                        cursor:skipped||!setLogged||setCompleted?"default":"pointer"}}>
                      {setCompleted?"Set Complete":"Complete Set"}
                    </button>
                  </div>
                );
              })}
              <button onClick={()=>addSetRow(activeDay,ex.id)} disabled={skipped}
                style={{marginTop:2,padding:"8px",borderRadius:8,
                  border:`1px dashed ${skipped?"#16263d":DAYS[activeDay].accent+"55"}`,
                  background:"none",color:skipped?"#2a4058":DAYS[activeDay].accent,
                  fontSize:10,fontWeight:900,cursor:skipped?"default":"pointer"}}>
                + Add Set
              </button>
            </div>
          </div>
          );
        })}
      </div>

      {activeRemoved.length>0&&(
        <div style={{background:"#070908",border:"1px solid #16263d",
          borderRadius:5,padding:"10px 11px",marginBottom:12}}>
          <div style={{fontSize:9,color:"#38BFFF",fontWeight:800,
            textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>
            Removed from {DAYS[activeDay].shortLabel}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {activeRemoved.map(ex=>(
              <button key={ex.id} onClick={()=>onRestoreExercise(activeDay,ex.id)} style={{
                border:"1px solid #38BFFF44",background:"#071622",color:"#38BFFF",
                borderRadius:8,padding:"6px 8px",fontSize:10,fontWeight:800,cursor:"pointer"}}>
                + {ex.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add exercise */}
      {!showAddEx?(
        <button onClick={()=>setShowAddEx(true)} style={{
          width:"100%",padding:"10px",borderRadius:5,
          border:`1px dashed ${DAYS[activeDay].accent}55`,
          background:"none",color:DAYS[activeDay].accent,
          fontWeight:700,fontSize:12,cursor:"pointer",marginBottom:12}}>
          + Add Exercise to {DAYS[activeDay].label}
        </button>
      ):(
        <div style={{background:"#070908",border:`1px solid ${DAYS[activeDay].accent}33`,
          borderRadius:5,padding:"12px",marginBottom:12}}>
          <div style={{fontSize:10,color:DAYS[activeDay].accent,fontWeight:700,
            textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>
            New Exercise — {DAYS[activeDay].label}
          </div>
          <input type="text" value={newExName} onChange={e=>setNewExName(e.target.value)}
            placeholder="Exercise name (e.g. Cable Crossover)"
            style={{width:"100%",background:"#0a0d0c",border:"1px solid #252d29",
              borderRadius:7,color:"#fff",padding:"9px 11px",fontSize:13,outline:"none",
              boxSizing:"border-box",fontWeight:600,marginBottom:8}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
            {[["Weight",newExW,setNewExW],["Reps",newExR,setNewExR],["Sets",newExS,setNewExS]].map(([label,val,setter])=>(
              <div key={label}>
                <div style={{fontSize:9,color:"#46514b",marginBottom:3,
                  textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>{label}</div>
                <input type="number" inputMode={label==="Weight"?"decimal":"numeric"}
                  min="0" step={label==="Weight"?"0.5":"1"}
                  value={val} onChange={e=>setter(e.target.value)}
                  onFocus={e=>e.target.select()}
                  placeholder="0"
                  style={{width:"100%",background:"#0a0d0c",border:"1px solid #252d29",
                    borderRadius:7,color:"#fff",padding:"10px 10px",minHeight:42,fontSize:15,outline:"none",
                    boxSizing:"border-box",fontWeight:700}}/>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setShowAddEx(false);setNewExName("");setNewExW("");setNewExR("");setNewExS("");}}
              style={{flex:1,padding:"9px",borderRadius:8,border:"1px solid #252d29",
                background:"none",color:"#87918c",fontWeight:700,fontSize:12,cursor:"pointer"}}>
              Cancel
            </button>
            <button onClick={handleAddExercise} style={{
              flex:2,padding:"9px",borderRadius:8,border:"none",
              background:DAYS[activeDay].accent,color:"#fff",
              fontWeight:800,fontSize:12,cursor:"pointer"}}>
              Add to {DAYS[activeDay].shortLabel}
            </button>
          </div>
        </div>
      )}

      <WorkoutCompletionGuard guard={workoutCompletionGuard}
        onSkipRemaining={()=>skipRemainingExercises(activeDay)}/>

      {isDaily?(
        <>
          <button onClick={()=>skipAndConfirmDay(activeDay)} style={{
            width:"100%",padding:"11px",minHeight:42,borderRadius:5,
            border:`1px solid ${DAYS[activeDay].accent}55`,background:"#070908",
            color:DAYS[activeDay].accent,fontWeight:900,fontSize:12,
            cursor:"pointer",marginBottom:8}}>
            Skip All Exercises
          </button>
          <button onClick={handleSave} style={{
            width:"100%",padding:"13px",minHeight:46,borderRadius:5,border:"none",
            background:"linear-gradient(135deg,#2DD4A0,#168a68)",color:"#04140f",
            fontWeight:950,fontSize:13,cursor:"pointer",marginBottom:10}}>
            Save Today's Workout
          </button>
        </>
      ):!completedDays[activeDay]?(
        <>
          <button onClick={()=>skipAndConfirmDay(activeDay)} style={{
            width:"100%",padding:"11px",minHeight:42,borderRadius:5,
            border:`1px solid ${DAYS[activeDay].accent}55`,background:"#070908",
            color:DAYS[activeDay].accent,fontWeight:900,fontSize:12,
            cursor:"pointer",marginBottom:8}}>
            Skip & Save {DAYS[activeDay].label}
          </button>
          <button onClick={()=>markDayDone(activeDay)} style={{
            width:"100%",padding:"13px",minHeight:46,borderRadius:5,border:"none",
            background:DAYS[activeDay].accent,color:"#fff",
            fontWeight:800,fontSize:13,cursor:"pointer",marginBottom:10}}>
            Confirm {DAYS[activeDay].label} ✓
          </button>
        </>
      ):(
        <div style={{padding:"11px",borderRadius:5,background:"#0a1a12",
          border:"1px solid #1a3d2c",color:"#2DD4A0",fontWeight:700,fontSize:13,
          textAlign:"center",marginBottom:10}}>
          ✓ {DAYS[activeDay].label} confirmed
        </div>
      )}

      {/* Session rating */}
      <div style={{marginBottom:10}}>
        <div style={{fontSize:9,color:"#46514b",marginBottom:5,
          textTransform:"uppercase",letterSpacing:"0.08em"}}>Session Rating</div>
        <div style={{display:"flex",gap:6}}>
          {[1,2,3,4,5].map(n=>(
            <button key={n} onClick={()=>setRating(r=>r===n?0:n)} style={{
              flex:1,padding:"7px",borderRadius:8,border:"none",
              background:n<=rating?"#FFB347":"#0a0d0c",
              color:n<=rating?"#fff":"#46514b",fontSize:16,cursor:"pointer",transition:"all 0.12s"}}>★</button>
          ))}
        </div>
      </div>

      <div style={{background:"linear-gradient(145deg,#0a0d0c,#070908)",border:"1px solid #2a312e",
        borderRadius:6,padding:"12px",marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:10}}>
          <div>
            <div style={{fontSize:9,color:"#2DD4A0",fontWeight:900,
              textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4}}>Readiness Check-In</div>
            <div style={{fontSize:11,color:"#87918c",lineHeight:1.35}}>
              Private recovery signal for fatigue, quality, and next-workout advice.
            </div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:20,color:"#fff",fontWeight:950,lineHeight:1}}>{readinessScore}</div>
            <div style={{fontSize:8,color:"#2DD4A0",fontWeight:900,
              textTransform:"uppercase",letterSpacing:"0.08em",marginTop:3}}>Readiness Score</div>
            <div style={{fontSize:9,color:"#777",fontWeight:800,marginTop:3}}>{readinessLabel}</div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {readinessRows.map(row=>(
            <div key={row.key} style={{display:"grid",gridTemplateColumns:"72px 1fr",gap:8,alignItems:"center"}}>
              <div>
                <div style={{fontSize:10,color:row.color,fontWeight:900}}>{row.label}</div>
                <div style={{fontSize:8,color:"#66706b",fontWeight:800}}>{row.low} - {row.high}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5}}>
                {[1,2,3,4,5].map(n=>{
                  const active=readiness[row.key]===n;
                  return(
                    <button key={n} onClick={()=>updateReadiness(row.key,n)} style={{
                      minHeight:30,borderRadius:7,border:`1px solid ${active?row.color+"88":"#252d29"}`,
                      background:active?row.color:"#0a0d0c",
                      color:active?"#fff":"#747e79",fontSize:10,fontWeight:900,cursor:"pointer"}}>
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <WorkoutReadinessGate gate={workoutReadinessGate}/>
      </div>

      <label style={{display:"flex",alignItems:"center",gap:10,background:deload?"#071622":"#070908",
        border:`1px solid ${deload?"#38BFFF55":"#1b211f"}`,borderRadius:5,
        padding:"11px 12px",marginBottom:10,cursor:"pointer"}}>
        <input type="checkbox" checked={deload} onChange={e=>setDeload(e.target.checked)}
          style={{width:18,height:18,accentColor:"#38BFFF",flexShrink:0}}/>
        <span style={{fontSize:11,color:deload?"#38BFFF":"#87918c",fontWeight:800,lineHeight:1.35}}>
          Recovery / deload {isDaily?"session":"week"}
        </span>
      </label>

      {/* RPE */}
      <div style={{marginBottom:10}}>
        <div style={{fontSize:9,color:"#46514b",marginBottom:5,
          textTransform:"uppercase",letterSpacing:"0.08em"}}>Overall RPE {rpe>0?`· ${rpe}/10`:""}</div>
        <div style={{display:"flex",gap:4}}>
          {[1,2,3,4,5,6,7,8,9,10].map(n=>{
            const c=n<=3?"#2DD4A0":n<=6?"#FFB347":n<=8?"#FF9447":"#FF5C87";
            return(
              <button key={n} onClick={()=>setRpe(r=>r===n?0:n)} style={{
                flex:1,padding:"6px 2px",borderRadius:6,border:"none",
                background:n<=rpe?c:"#0a0d0c",
                color:n<=rpe?"#fff":"#46514b",fontSize:10,fontWeight:700,cursor:"pointer",transition:"all 0.1s"}}>
                {n}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:9,color:"#46514b",marginBottom:5,
          textTransform:"uppercase",letterSpacing:"0.08em"}}>Notes (optional)</div>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)}
          placeholder="PRs? How did you feel? Anything to remember?"
          rows={2} style={{width:"100%",background:"#070908",border:"1px solid #1b211f",
            borderRadius:9,color:"#aaa",padding:"10px 12px",fontSize:12,outline:"none",
            boxSizing:"border-box",resize:"none",fontFamily:"inherit",lineHeight:1.5}}/>
      </div>

      {!isDaily&&Object.keys(completedDays).length===3&&(
        <button onClick={handleSave} style={{
          width:"100%",padding:"13px",borderRadius:5,border:"none",
          background:"linear-gradient(135deg,#7C6FFF 0%,#2DD4A0 100%)",
          color:"#fff",fontWeight:900,fontSize:15,cursor:"pointer",
          letterSpacing:"0.04em",boxShadow:"0 4px 24px rgba(124,111,255,0.25)"}}>
          Save Week {history.length+1} →
        </button>
      )}

      <div className="earned-train-session-dock"
        style={{position:"sticky",bottom:8,zIndex:30,background:"rgba(7,7,26,0.94)",
        border:`1px solid ${DAYS[activeDay].accent}55`,borderRadius:6,padding:"10px",
        marginTop:12,boxShadow:"0 8px 28px rgba(0,0,0,0.35)",backdropFilter:"blur(10px)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:8}}>
          <div>
            <div style={{fontSize:8,color:DAYS[activeDay].accent,fontWeight:950,
              textTransform:"uppercase",letterSpacing:"0.12em"}}>Session Dock</div>
            <div style={{fontSize:11,color:"#888",fontWeight:850,marginTop:2}}>
              {DAYS[activeDay].shortLabel} - {activeLoggedCount} logged - {previewVol.toLocaleString()} lbs
            </div>
          </div>
          <div style={{fontSize:10,color:"#87918c",fontWeight:900,whiteSpace:"nowrap"}}>
            {isDaily?"Today's workout":`${Object.keys(completedDays).length}/3 days`}
          </div>
        </div>
        {isDaily?(
          <button onClick={handleSave} style={{width:"100%",padding:"11px",minHeight:42,
            borderRadius:5,border:"none",background:"linear-gradient(135deg,#2DD4A0,#168a68)",
            color:"#04140f",fontSize:12,fontWeight:950,cursor:"pointer"}}>
            Save Today's Workout
          </button>
        ):Object.keys(completedDays).length===3?(
          <button onClick={handleSave} style={{width:"100%",padding:"11px",minHeight:42,
            borderRadius:5,border:"none",background:"linear-gradient(135deg,#7C6FFF,#2DD4A0)",
            color:"#fff",fontSize:12,fontWeight:950,cursor:"pointer"}}>
            Save Week {history.length+1}
          </button>
        ):completedDays[activeDay]?(
          <button onClick={()=>{
            const next=DAY_KEYS.find(dk=>!completedDays[dk]);
            if(next) setActiveDay(next);
          }} style={{width:"100%",padding:"11px",minHeight:42,borderRadius:5,
            border:"1px solid #2DD4A044",background:"#061811",color:"#2DD4A0",
            fontSize:12,fontWeight:950,cursor:"pointer"}}>
            Jump To Next Day
          </button>
        ):(
          <button onClick={()=>markDayDone(activeDay)} style={{width:"100%",padding:"11px",minHeight:42,
            borderRadius:5,border:"none",background:DAYS[activeDay].accent,
            color:"#fff",fontSize:12,fontWeight:950,cursor:"pointer"}}>
            Confirm {DAYS[activeDay].shortLabel}
          </button>
        )}
      </div>

      <p style={{textAlign:"center",fontSize:9,color:"#252d29",marginTop:10}}>
        Your entries auto-save as you type — safe to close and come back mid-workout.
      </p>
    </div>
  );
}

// ─── Edit Saved Week ──────────────────────────────────────────────────────────
function EditWeekModal({entry,index,customEx,onSave,onClose}){
  const isDaily=entry?.periodType===PERIOD_TYPES.DAY;
  const editDayKeys=isDaily?[entry.dayKey||getDominantDay(entry,customEx)||DAY_KEYS[0]]:DAY_KEYS;
  const buildInputs=()=>{
    const init={};
    for(const dk of DAY_KEYS){
      init[dk]={};
      for(const ex of allExercises(dk,customEx)){
        const d=entry.exercises?.[ex.id];
        init[dk][ex.id]=d
          ? editableLiftCellFromStored(d)
          : {w:"0",r:"0",s:"0",skipped:true};
      }
    }
    return init;
  };

  const [inputs,setInputs]=useState(buildInputs);
  const [activeDay,setActiveDay]=useState(editDayKeys[0]);
  const [notes,setNotes]=useState(entry.notes||"");
  const [rating,setRating]=useState(entry.rating||0);
  const [rpe,setRpe]=useState(entry.rpe||0);
  const [deload,setDeload]=useState(!!entry.deload);
  const [date,setDate]=useState(entry.date||new Date().toISOString().slice(0,10));

  const handleChange=(dk,id,field,val)=>
    setInputs(prev=>({...prev,[dk]:{...prev[dk],[id]:{...prev[dk][id],[field]:val,setDetails:undefined,skipped:false}}}));

  const toggleSkipped=(dk,id)=>
    setInputs(prev=>{
      const cell=prev[dk][id]||{w:"0",r:"0",s:"0"};
      return {...prev,[dk]:{...prev[dk],[id]:{...cell,skipped:!cell.skipped}}};
    });

  const activeVolume=allExercises(activeDay,customEx).reduce((sum,ex)=>{
    const cell=inputs[activeDay][ex.id];
    if(!isLoggedLiftCell(cell)) return sum;
    return sum+parseLiftCell(cell).volume;
  },0);

  const handleSave=()=>{
    const exercises={};
    for(const dk of editDayKeys){
      for(const ex of allExercises(dk,customEx)){
        const cell=inputs[dk][ex.id];
        if(isSkippedLiftCell(cell)) continue;
        if(!isLoggedLiftCell(cell)){
          alert(`Finish "${ex.name}" with positive weight, reps, and sets, or tap Skip for that exercise.`);
          return;
        }
        exercises[ex.id]=storedLiftFromCell(cell);
      }
    }
    if(!Object.keys(exercises).length){
      alert(`Keep at least one logged exercise in this ${isDaily?"workout":"week"}.`);
      return;
    }
    onSave(index,{
      ...entry,
      week:index+1,
      date:date||entry.date,
      exercises,
      notes:notes.trim()||undefined,
      rating:rating||undefined,
      rpe:rpe||undefined,
      deload:deload||undefined,
    });
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",
      zIndex:1000,padding:14,overflowY:"auto"}}>
      <div style={{maxWidth:560,margin:"18px auto",background:"#0a0d0c",
        border:"1px solid #3a4640",borderRadius:6,padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:14}}>
          <div>
            <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
              color:"#7C6FFF",fontWeight:800,marginBottom:4}}>Edit Saved Workout</div>
            <h2 style={{margin:0,fontSize:20,color:"#fff",fontWeight:900}}>
              {isDaily?DAYS[activeDay]?.label||"Daily Workout":`Week ${index+1}`}
            </h2>
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid #252d29",
            color:"#87918c",borderRadius:8,padding:"6px 10px",fontWeight:800,cursor:"pointer"}}>Close</button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:`repeat(${editDayKeys.length},1fr)`,gap:6,marginBottom:12}}>
          {editDayKeys.map(dk=>(
            <button key={dk} onClick={()=>setActiveDay(dk)} style={{
              padding:"9px 4px",borderRadius:9,border:"none",cursor:"pointer",
              fontSize:10,fontWeight:800,
              background:activeDay===dk?DAYS[dk].accent:"#070908",
              color:activeDay===dk?"#fff":"#747e79",
              outline:activeDay!==dk?`1px solid ${DAYS[dk].accent}22`:"none"}}>
              {DAYS[dk].shortLabel}
            </button>
          ))}
        </div>

        <div style={{background:"#070908",border:"1px solid #1b211f",
          borderRadius:5,padding:"9px 12px",marginBottom:10,
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:10,color:"#747e79"}}>{DAYS[activeDay].label} volume</span>
          <span style={{fontSize:13,color:"#fff",fontWeight:900}}>{activeVolume.toLocaleString()} lbs</span>
        </div>

        <p style={{margin:"0 0 10px",fontSize:9,color:"#66706b",lineHeight:1.4}}>
          Tap Skip to remove an exercise from this saved {isDaily?"session's":"week's"} volume.
        </p>

        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
          {allExercises(activeDay,customEx).map(ex=>{
            const cell=inputs[activeDay][ex.id]||{w:"0",r:"0",s:"0"};
            const skipped=isSkippedLiftCell(cell);
            return(
            <div key={ex.id} style={{background:skipped?"#070907":"#070908",
              border:`1px solid ${skipped?"#263653":"#1b211f"}`,
              borderRadius:5,padding:11}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:7}}>
                <div style={{fontSize:12,color:"#bbb",fontWeight:800}}>
                  {ex.name}
                  {skipped&&<span style={{fontSize:8,color:"#38BFFF",marginLeft:5,
                    border:"1px solid #38BFFF33",borderRadius:4,padding:"1px 4px"}}>SKIPPED</span>}
                </div>
                <button onClick={()=>toggleSkipped(activeDay,ex.id)} style={{
                  background:skipped?"#071622":"none",
                  border:`1px solid ${skipped?"#38BFFF66":"#252d29"}`,
                  color:skipped?"#38BFFF":"#87918c",
                  borderRadius:6,padding:"4px 8px",fontSize:9,fontWeight:800,cursor:"pointer"}}>
                  {skipped?"Log":"Skip"}
                </button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {[["w","Weight"],["r","Reps"],["s","Sets"]].map(([field,label])=>(
                  <div key={field}>
                    <div style={{fontSize:9,color:"#46514b",marginBottom:3,
                      textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>{label}</div>
                    <input type="number" inputMode={field==="w"?"decimal":"numeric"}
                      min="0" step={field==="w"?"0.5":"1"}
                      onFocus={e=>e.target.select()}
                      value={inputs[activeDay][ex.id]?.[field]??"0"}
                      onChange={e=>handleChange(activeDay,ex.id,field,e.target.value)}
                      disabled={skipped}
                      style={{width:"100%",background:"#0a0d0c",
                        border:`1px solid ${skipped?"#16263d":"#252d29"}`,
                        borderRadius:7,color:skipped?"#2a4058":"#fff",padding:"10px 10px",minHeight:42,fontSize:16,
                        outline:"none",boxSizing:"border-box",fontWeight:700,
                        cursor:skipped?"not-allowed":"text"}}/>
                  </div>
                ))}
              </div>
            </div>
            );
          })}
        </div>

        <div style={{marginBottom:10}}>
          <div style={{fontSize:9,color:"#46514b",marginBottom:5,
            textTransform:"uppercase",letterSpacing:"0.08em"}}>Date</div>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{width:"100%",background:"#070908",border:"1px solid #1b211f",
              borderRadius:9,color:"#aaa",padding:"10px 12px",fontSize:12,outline:"none",
              boxSizing:"border-box",fontFamily:"inherit"}}/>
        </div>

        <div style={{marginBottom:10}}>
          <div style={{fontSize:9,color:"#46514b",marginBottom:5,
            textTransform:"uppercase",letterSpacing:"0.08em"}}>Session Rating</div>
          <div style={{display:"flex",gap:6}}>
            {[1,2,3,4,5].map(n=>(
              <button key={n} onClick={()=>setRating(r=>r===n?0:n)} style={{
                flex:1,padding:"7px",borderRadius:8,border:"none",
                background:n<=rating?"#FFB347":"#070908",
                color:n<=rating?"#fff":"#46514b",fontSize:16,cursor:"pointer"}}>★</button>
            ))}
          </div>
        </div>

        <label style={{display:"flex",alignItems:"center",gap:10,background:deload?"#071622":"#070908",
          border:`1px solid ${deload?"#38BFFF55":"#1b211f"}`,borderRadius:5,
          padding:"11px 12px",marginBottom:10,cursor:"pointer"}}>
          <input type="checkbox" checked={deload} onChange={e=>setDeload(e.target.checked)}
            style={{width:18,height:18,accentColor:"#38BFFF",flexShrink:0}}/>
          <span style={{fontSize:11,color:deload?"#38BFFF":"#87918c",fontWeight:800,lineHeight:1.35}}>
            Recovery / deload {isDaily?"session":"week"}
          </span>
        </label>

        <div style={{marginBottom:10}}>
          <div style={{fontSize:9,color:"#46514b",marginBottom:5,
            textTransform:"uppercase",letterSpacing:"0.08em"}}>Overall RPE {rpe>0?`· ${rpe}/10`:""}</div>
          <div style={{display:"flex",gap:4}}>
            {[1,2,3,4,5,6,7,8,9,10].map(n=>(
              <button key={n} onClick={()=>setRpe(r=>r===n?0:n)} style={{
                flex:1,padding:"6px 2px",borderRadius:6,border:"none",
                background:n<=rpe?"#FFB347":"#070908",
                color:n<=rpe?"#fff":"#46514b",fontSize:10,fontWeight:800,cursor:"pointer"}}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:9,color:"#46514b",marginBottom:5,
            textTransform:"uppercase",letterSpacing:"0.08em"}}>Notes</div>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)}
            rows={2} style={{width:"100%",background:"#070908",border:"1px solid #1b211f",
              borderRadius:9,color:"#aaa",padding:"10px 12px",fontSize:12,outline:"none",
              boxSizing:"border-box",resize:"none",fontFamily:"inherit",lineHeight:1.5}}/>
        </div>

        <button onClick={handleSave} style={{width:"100%",padding:"13px",
          borderRadius:5,border:"none",background:"linear-gradient(135deg,#7C6FFF,#2DD4A0)",
          color:"#fff",fontWeight:900,fontSize:14,cursor:"pointer"}}>
          Save Edited {isDaily?"Workout":"Week"}
        </button>
      </div>
    </div>
  );
}

// ─── History View ─────────────────────────────────────────────────────────────
function HistoryView({history,trackingMode,onDelete,onEdit,customEx}){
  const isDaily=trackingMode===TRACKING_MODES.DAILY;
  const [expanded,setExpanded]=useState(null);
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("all");
  if(history.length<1) return(
    <div className="earned-workout-view earned-workout-view--history earned-workout-empty"
      style={{background:"#0a0d0c",border:"1px solid #2a312e",borderRadius:6,
      padding:"40px 20px",textAlign:"center"}}>
      <div style={{fontSize:32,marginBottom:10}}>📋</div>
      <div style={{color:"#fff",fontWeight:800,fontSize:16,marginBottom:6}}>No history yet</div>
      <div style={{color:"#66706b",fontSize:13}}>Log your first {isDaily?"workout day":"week"} to start tracking.</div>
    </div>
  );
  const rpeColor=n=>n<=3?"#2DD4A0":n<=6?"#FFB347":n<=8?"#FF9447":"#FF5C87";
  const dayLabels=Object.fromEntries(DAY_KEYS.map(key=>[key,DAYS[key].label]));
  const normalizedQuery=query.trim().toLowerCase();
  const visibleRows=[...history].map((entry,i)=>({
    entry,
    i,
    periodLabel:getEntryPeriodLabel(entry,i,{dayLabels}),
    prCount:getWeekPRCount(entry,history.slice(0,i),customEx),
  })).reverse().filter((row,reverseIndex)=>{
    if(filter==="recent"&&reverseIndex>=8) return false;
    if(filter==="records"&&row.prCount<1) return false;
    if(!normalizedQuery) return true;
    const searchText=[
      row.periodLabel,
      row.entry.date,
      row.entry.notes,
      row.entry.deload?"recovery":"",
    ].filter(Boolean).join(" ").toLowerCase();
    return searchText.includes(normalizedQuery);
  });
  return(
    <div className="earned-workout-view earned-workout-view--history">
      <div className="earned-history-toolbar" aria-label="History filters">
        <label>
          <span>SEARCH LEDGER</span>
          <input value={query} onChange={event=>setQuery(event.target.value)}
            placeholder="Date, note, or workout" aria-label="Search workout history"/>
        </label>
        <div className="earned-history-toolbar__filters" role="group" aria-label="History range">
          {[
            ["all","All"],
            ["recent","Recent 8"],
            ["records","PR workouts"],
          ].map(([id,label])=>(
            <button key={id} type="button" aria-pressed={filter===id}
              onClick={()=>setFilter(id)}>
              {label}
            </button>
          ))}
        </div>
        <div className="earned-history-toolbar__count" aria-live="polite">
          <strong>{visibleRows.length}</strong><span>shown</span>
        </div>
      </div>

      {!visibleRows.length&&(
        <div className="earned-history-empty">
          <strong>No sessions match.</strong>
          <span>Clear the search or choose another ledger filter.</span>
        </div>
      )}

      {visibleRows.map(({entry,i,periodLabel,prCount})=>{
        const prev=isDaily
          ? [...history.slice(0,i)].reverse().find(row=>row.dayKey===entry.dayKey)||null
          : i>0?history[i-1]:null;
        const total=getTotalVol(entry,customEx);
        const prevTot=prev?getTotalVol(prev,customEx):null;
        const diff=prevTot!=null?total-prevTot:null;
        const isOpen=expanded===i;
        const sourceIndex=Number.isInteger(entry.sourceIndex)
          ?entry.sourceIndex
          :entry.sourceIndexes?.length===1?entry.sourceIndexes[0]:null;
        const readOnlyAggregate=!isDaily&&entry.sourcePeriodType===PERIOD_TYPES.DAY&&entry.derived;
        const canAct=sourceIndex!=null&&!readOnlyAggregate;
        return(
          <div key={entry.periodId||`${entry.date}_${i}`} className="earned-history-entry"
            data-expanded={isOpen?"true":"false"}
            style={{background:"#0a0d0c",border:"1px solid #2a312e",
            borderRadius:6,marginBottom:9,overflow:"hidden"}}>
            <div onClick={()=>setExpanded(isOpen?null:i)} style={{padding:"13px 14px",cursor:"pointer",
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:9,color:"#46514b",textTransform:"uppercase",
                  letterSpacing:"0.1em",fontWeight:700,marginBottom:2}}>
                  {periodLabel}{entry.date?` · ${entry.date}`:""}
                  {entry.rating&&<span style={{marginLeft:8,color:"#FFB347"}}>{"★".repeat(entry.rating)}</span>}
                  {entry.rpe&&<span style={{marginLeft:8,fontSize:9,color:rpeColor(entry.rpe),fontWeight:700}}>RPE {entry.rpe}</span>}
                  {entry.deload&&<span style={{marginLeft:8,fontSize:9,color:"#38BFFF",fontWeight:800}}>RECOVERY</span>}
                  {prCount>0&&<span className="earned-history-entry__pr">PR x{prCount}</span>}
                </div>
                <div style={{fontSize:15,fontWeight:900,color:"#fff"}}>
                  {total.toLocaleString()} lbs
                  {diff!=null&&(
                    <span style={{fontSize:10,fontWeight:700,marginLeft:8,
                      color:diff>=0?"#2DD4A0":"#FF5C87"}}>
                      {diff>=0?"▲":"▼"}{Math.abs(diff).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {canAct?(
                  <button onClick={e=>{e.stopPropagation();onEdit(sourceIndex);}}
                    style={{background:"none",border:"1px solid #252d29",color:"#87918c",
                      borderRadius:6,padding:"4px 8px",fontSize:10,cursor:"pointer"}}>Edit</button>
                ):(
                  <span title="Switch to Daily to edit the individual sessions" style={{fontSize:8,
                    color:"#38BFFF",fontWeight:850,maxWidth:74,textAlign:"right",lineHeight:1.2}}>
                    Edit in Daily
                  </span>
                )}
                {canAct&&(
                  <button onClick={e=>{e.stopPropagation();if(confirm(`Delete this ${entry.sourcePeriodType===PERIOD_TYPES.WEEK?"source week":"workout session"}?`))onDelete(sourceIndex);}}
                    style={{background:"none",border:"1px solid #2a1a1a",color:"#4a2a2a",
                      borderRadius:6,padding:"4px 8px",fontSize:10,cursor:"pointer"}}>Del</button>
                )}
                <span style={{color:"#46514b",fontSize:12}}>{isOpen?"▲":"▼"}</span>
              </div>
            </div>
            {isOpen&&(
              <div style={{borderTop:"1px solid #1b211f",padding:"12px 14px"}}>
                {entry.notes&&(
                  <div style={{background:"#070908",borderRadius:8,padding:"9px 12px",
                    marginBottom:10,fontSize:11,color:"#87918c",fontStyle:"italic",
                    lineHeight:1.5,borderLeft:"2px solid #46514b"}}>
                    "{entry.notes}"
                  </div>
                )}
                {DAY_KEYS.map(dk=>{
                  const vol=getDayVol(entry,dk,customEx);
                  const prevVol=prev?getDayVol(prev,dk,customEx):null;
                  const d=prevVol!=null?vol-prevVol:null;
                  return(
                    <div key={dk} style={{display:"flex",justifyContent:"space-between",
                      alignItems:"center",padding:"6px 0",borderBottom:"1px solid #181e1b"}}>
                      <span style={{fontSize:11,color:"#747e79"}}>
                        <span style={{display:"inline-block",width:7,height:7,borderRadius:2,
                          background:DAYS[dk].accent,marginRight:7,verticalAlign:"middle"}}/>
                        {DAYS[dk].label}
                      </span>
                      <span style={{fontSize:11,fontWeight:700,color:"#ccc"}}>
                        {vol.toLocaleString()} lbs
                        {d!=null&&(
                          <span style={{fontSize:9,marginLeft:6,color:d>=0?"#2DD4A0":"#FF5C87"}}>
                            {d>=0?"▲":"▼"}{Math.abs(d).toLocaleString()}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CommunityLeaderboardPanel({
  visiblePublicPosts,publicProfiles,currentUserId,feedScope,onFeedScopeChange,
  publicEngagement,commentDrafts,onCommentDraftChange,publicReady,publicStatus,
  onTogglePublicReaction,onSubmitPublicComment,
}){
  const communityLeaderboard=buildCommunityLeaderboard(visiblePublicPosts,publicProfiles,currentUserId);
  return(
    <div style={{background:"#0a0d0c",border:"1px solid #24304f",
      borderRadius:6,padding:"14px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:12}}>
        <div>
          <div style={{fontSize:9,color:"#2DD4A0",fontWeight:900,
            textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4}}>Weekly Rankings</div>
          <div style={{fontSize:11,color:"#87918c",lineHeight:1.4}}>
            One best public workout per lifter from safe shared summary scores.
          </div>
        </div>
        <div style={{fontSize:10,color:"#66706b",fontWeight:800}}>
          {communityLeaderboard.activeLifters} lifters
        </div>
      </div>

      <div style={{display:"flex",gap:6,margin:"0 0 10px"}}>
        {["everyone","following"].map(scope=>(
          <button key={scope} onClick={()=>onFeedScopeChange(scope)}
            style={{border:"1px solid #252d29",borderRadius:999,padding:"7px 10px",
              background:feedScope===scope?"#15153a":"#070908",
              color:feedScope===scope?"#fff":"#87918c",fontSize:10,fontWeight:950,
              cursor:"pointer"}}>
            {scope==="everyone"?"Everyone":"Following"}
          </button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",
        gap:6,marginBottom:11}}>
        {[
          ["Your Rank",communityLeaderboard.currentUserRank?`#${communityLeaderboard.currentUserRank.rank}`:"--",
            communityLeaderboard.currentUserRank?.color||"#777"],
          ["Best Score",String(communityLeaderboard.bestScore),"#FFB347"],
          ["Top Volume",communityLeaderboard.topVolume?`${communityLeaderboard.topVolume.toLocaleString()} lbs`:"--","#38BFFF"],
          ["Active Lifters",String(communityLeaderboard.activeLifters),"#2DD4A0"],
        ].map(([label,value,color])=>(
          <div key={label} style={{background:"#070908",border:"1px solid #222b26",
            borderRadius:9,padding:"8px 6px",minWidth:0}}>
            <div style={{fontSize:7,color:"#87918c",fontWeight:950,textTransform:"uppercase",
              letterSpacing:"0.06em",marginBottom:5,whiteSpace:"nowrap",overflow:"hidden",
              textOverflow:"ellipsis"}}>{label}</div>
            <div style={{fontSize:11,color,fontWeight:950,whiteSpace:"nowrap",overflow:"hidden",
              textOverflow:"ellipsis"}}>{value}</div>
          </div>
        ))}
      </div>

      {communityLeaderboard.rows.length>0?(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {communityLeaderboard.rows.slice(0,6).map(row=>(
            <div key={`${row.user_id}_${row.id}`} style={{background:row.isCurrentUser?"#101512":"#070908",
              border:`1px solid ${row.color}30`,borderLeft:`3px solid ${row.color}`,
              borderRadius:5,padding:"10px"}}>
              <div style={{display:"grid",gridTemplateColumns:"34px 1fr auto",
                gap:9,alignItems:"center",marginBottom:10}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:row.color,
                  color:"#071000",display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:12,fontWeight:950}}>#{row.rank}</div>
                <div style={{minWidth:0}}>
                  <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3,
                    flexWrap:"wrap"}}>
                    <span style={{fontSize:12,color:"#fff",fontWeight:950}}>
                      @{row.profile?.username||"lifter"}
                    </span>
                    {row.isCurrentUser&&(
                      <span style={{fontSize:8,color:"#2DD4A0",border:"1px solid #2DD4A044",
                        borderRadius:999,padding:"2px 5px",fontWeight:900}}>YOU</span>
                    )}
                    <span style={{fontSize:8,color:row.color,border:`1px solid ${row.color}44`,
                      borderRadius:999,padding:"2px 5px",fontWeight:900}}>
                      {row.leaderboard_badge||"Starter"}
                    </span>
                  </div>
                  <div style={{fontSize:9,color:"#87918c",lineHeight:1.35}}>
                    Best W{row.week} · {row.totalVolume.toLocaleString()} lbs · PR x{row.prCount}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:15,color:row.color,fontWeight:950,lineHeight:1}}>
                    {row.score}
                  </div>
                  <div style={{fontSize:8,color:"#87918c",fontWeight:900,marginTop:4}}>
                    Score
                  </div>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:9}}>
                {PUBLIC_REACTIONS.map(reaction=>{
                  const active=publicEngagement.myReactions?.[row.id]===reaction.id;
                  const count=publicEngagement.reactionCounts?.[row.id]?.[reaction.id]||0;
                  return(
                    <button key={reaction.id} onClick={()=>onTogglePublicReaction(row,reaction.id)}
                      disabled={!publicReady||publicStatus==="saving"}
                      style={{padding:"7px 4px",borderRadius:8,
                        border:`1px solid ${active?`${reaction.color}66`:"#252d29"}`,
                        background:active?`${reaction.color}18`:"transparent",
                        color:active?reaction.color:"#87918c",fontSize:8,fontWeight:950,
                        cursor:publicReady?"pointer":"default",minWidth:0}}>
                      {reaction.label} {count>0?count:""}
                    </button>
                  );
                })}
              </div>

              {(publicEngagement.commentsByPost?.[row.id]||[]).slice(-2).map(comment=>{
                const commenter=publicProfiles.find(item=>item.user_id===comment.user_id)?.username||"lifter";
                return(
                  <div key={comment.id} style={{background:"#0a0d0c",border:"1px solid #202923",
                    borderRadius:8,padding:"7px 8px",marginBottom:6}}>
                    <div style={{fontSize:9,color:"#777",fontWeight:900,marginBottom:2}}>
                      @{commenter}
                    </div>
                    <div style={{fontSize:10,color:"#ddd",lineHeight:1.35}}>{comment.body}</div>
                  </div>
                );
              })}

              <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:7,marginTop:8}}>
                <input value={commentDrafts[row.id]||""}
                  onChange={event=>onCommentDraftChange(drafts=>({...drafts,[row.id]:event.target.value.slice(0,240)}))}
                  placeholder="Add a comment"
                  disabled={!publicReady||publicStatus==="saving"}
                  style={{minWidth:0,background:"#050706",border:"1px solid #252d29",
                    borderRadius:8,color:"#fff",padding:"8px 9px",fontSize:11,
                    outline:"none"}}/>
                <button onClick={()=>onSubmitPublicComment(row)}
                  disabled={!publicReady||publicStatus==="saving"||!(commentDrafts[row.id]||"").trim()}
                  style={{padding:"8px 10px",borderRadius:8,border:"1px solid #38BFFF44",
                    background:"#071622",color:"#38BFFF",fontSize:10,fontWeight:950,
                    cursor:publicReady?"pointer":"default",
                    opacity:(commentDrafts[row.id]||"").trim()?1:0.55}}>
                  Comment
                </button>
              </div>
            </div>
          ))}
        </div>
      ):(
        <div style={{background:"#070908",border:"1px solid #1b211f",borderRadius:5,
          padding:"12px",fontSize:11,color:"#87918c",lineHeight:1.45}}>
          {publicStatus==="unavailable"
            ?"Paste the updated SQL in Supabase, then refresh this page."
            :feedScope==="following"
              ?"Follow lifters to build your feed."
              :"No shared posts yet. Turn sharing on to publish safe summaries."}
        </div>
      )}
    </div>
  );
}

function CommunityView({
  history,customEx,username,onToggleLike,
  publicProfile,publicPosts,publicLikes,publicProfiles,publicFollows,publicSocialGraph,
  publicEngagement,commentDrafts,onCommentDraftChange,
  publicStatus,publicError,feedScope,onFeedScopeChange,currentUserId,
  onTogglePublicSharing,onTogglePublicLike,onTogglePublicFollow,onRefreshPublic,
  onTogglePublicReaction,onSubmitPublicComment,onMarkNotificationsRead,
}){
  const social=socialState(customEx);
  const totalVolume=history.reduce((sum,entry)=>sum+getTotalVol(entry,customEx),0);
  const bestWeek=history.length?Math.max(...history.map(entry=>getTotalVol(entry,customEx))):0;
  const recent=[...history].reverse().slice(0,8);
  const challengeHub=buildChallengeHub(history,customEx);
  const challenges=challengeHub.challengeCards;
  const competition=buildWeeklyCompetition(history,customEx);
  const sharingOn=!!publicProfile?.share_enabled;
  const publicReady=publicStatus==="ready"||publicStatus==="saving";
  const visiblePublicPosts=feedScope==="following"
    ? publicPosts.filter(post=>post.user_id===currentUserId||publicSocialGraph.followingIds?.has(post.user_id))
    : publicPosts;
  const discoverProfiles=publicProfiles.filter(profile=>profile.user_id!==currentUserId);

  const copyPost=async(entry)=>{
    const recap=buildWorkoutRecap(entry,history.filter(e=>e.week<entry.week),customEx);
    try{ await navigator.clipboard.writeText(recap.shareText); }
    catch{ alert(recap.shareText); }
  };

  const notificationLabel=item=>{
    const actor=publicProfiles.find(profile=>profile.user_id===item.actor_id)?.username||"Someone";
    const post=publicPosts.find(row=>row.id===item.post_id);
    const week=post?.week?` W${post.week}`:"";
    if(item.type==="follow") return `@${actor} followed you`;
    if(item.type==="comment") return `@${actor} commented on${week}`;
    if(item.type==="reaction") return `@${actor} reacted to${week}`;
    return `@${actor} interacted with you`;
  };

  return(
    <div className="earned-workout-view earned-workout-view--feed">
      <div style={{background:"linear-gradient(140deg,#111512,#071622)",
        border:"1px solid #24304f",borderRadius:6,padding:"16px",marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:14}}>
          <div>
            <div style={{fontSize:9,color:"#38BFFF",fontWeight:900,
              textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4}}>Lifter Profile</div>
            <div style={{fontSize:22,color:"#fff",fontWeight:900,lineHeight:1.1}}>@{username}</div>
            <div style={{fontSize:11,color:"#456",marginTop:4}}>Workout posts and progress highlights</div>
          </div>
          <div style={{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#7C6FFF,#2DD4A0)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#fff",
            flexShrink:0}}>
            {username?.slice(0,2).toUpperCase()}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[["Posts",history.length],["Best",`${fmtVol(bestWeek)} lbs`],["Total",`${fmtVol(totalVolume)} lbs`]].map(([label,value])=>(
            <div key={label} style={{background:"#070908",border:"1px solid #16263d",
              borderRadius:5,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:15,color:"#fff",fontWeight:900}}>{value}</div>
              <div style={{fontSize:8,color:"#38BFFF",fontWeight:900,textTransform:"uppercase",
                letterSpacing:"0.1em",marginTop:3}}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <InviteTrainingPartner username={username}/>

      <div style={{background:"#0a0d0c",border:"1px solid #24304f",
        borderRadius:6,padding:"14px",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:10}}>
          <div>
            <div style={{fontSize:9,color:"#FF5C87",fontWeight:900,
              textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4}}>Activity</div>
            <div style={{fontSize:11,color:"#87918c",lineHeight:1.4}}>
              Reactions, comments, and follows from other lifters.
            </div>
          </div>
          {publicEngagement.unreadCount>0&&(
            <button onClick={onMarkNotificationsRead}
              disabled={publicStatus==="saving"}
              style={{border:"1px solid #FF5C8755",borderRadius:999,padding:"7px 9px",
                background:"#1a0710",color:"#FF5C87",fontSize:9,fontWeight:950,
                cursor:"pointer",whiteSpace:"nowrap"}}>
              Mark read {publicEngagement.unreadCount}
            </button>
          )}
        </div>
        {publicEngagement.notifications.length>0?(
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {publicEngagement.notifications.slice(0,5).map(item=>(
              <div key={item.id} style={{display:"flex",justifyContent:"space-between",gap:8,
                alignItems:"center",background:item.read_at?"#070908":"#120919",
                border:`1px solid ${item.read_at?"#1b211f":"#FF5C8740"}`,
                borderRadius:9,padding:"8px 9px"}}>
                <div style={{fontSize:10,color:item.read_at?"#87918c":"#fff",fontWeight:800}}>
                  {notificationLabel(item)}
                </div>
                <div style={{fontSize:8,color:"#747e79",fontWeight:800,whiteSpace:"nowrap"}}>
                  {new Date(item.created_at).toLocaleDateString([],{month:"short",day:"numeric"})}
                </div>
              </div>
            ))}
          </div>
        ):(
          <div style={{background:"#070908",border:"1px solid #1b211f",borderRadius:5,
            padding:"12px",fontSize:11,color:"#87918c",lineHeight:1.45}}>
            No activity yet. Reactions and comments will show here.
          </div>
        )}
      </div>

      <div style={{background:"#0a0d0c",border:"1px solid #24304f",
        borderRadius:6,padding:"14px",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:12}}>
          <div>
            <div style={{fontSize:9,color:"#FFB347",fontWeight:900,
              textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4}}>Discover Lifters</div>
            <div style={{fontSize:11,color:"#87918c",lineHeight:1.4}}>
              Follow public lifters to build a more personal feed.
            </div>
          </div>
          <div style={{fontSize:10,color:"#66706b",fontWeight:800}}>
            {publicProfiles.length} public · {publicFollows.length} follows
          </div>
        </div>
        {discoverProfiles.length>0?(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {discoverProfiles.slice(0,6).map(profile=>{
              const isFollowing=!!publicSocialGraph.followingIds?.has(profile.user_id);
              const latest=publicSocialGraph.latestPostByUser?.[profile.user_id];
              return(
                <div key={profile.user_id} style={{display:"grid",gridTemplateColumns:"1fr auto",
                  gap:10,alignItems:"center",background:"#070908",border:"1px solid #222b26",
                  borderRadius:5,padding:"10px"}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:12,color:"#fff",fontWeight:950}}>@{profile.username}</div>
                    <div style={{fontSize:9,color:"#87918c",marginTop:3,lineHeight:1.35}}>
                      {(publicSocialGraph.followerCounts?.[profile.user_id]||0)} followers · {(publicSocialGraph.followingCounts?.[profile.user_id]||0)} following · {(publicSocialGraph.postCounts?.[profile.user_id]||0)} posts
                      {latest?` · latest W${latest.week} ${Number(latest.total_volume||0).toLocaleString()} lbs`:""}
                    </div>
                  </div>
                  <button onClick={()=>onTogglePublicFollow(profile.user_id,isFollowing)}
                    disabled={!publicReady||publicStatus==="saving"}
                    style={{padding:"7px 10px",borderRadius:999,
                      border:`1px solid ${isFollowing?"#2DD4A055":"#252d29"}`,
                      background:isFollowing?"#061811":"transparent",
                      color:isFollowing?"#2DD4A0":"#777",
                      fontSize:10,fontWeight:950,cursor:publicReady?"pointer":"default",
                      opacity:publicStatus==="saving"?0.7:1}}>
                    {isFollowing?"Following":"Follow"}
                  </button>
                </div>
              );
            })}
          </div>
        ):(
          <div style={{background:"#070908",border:"1px solid #1b211f",borderRadius:5,
            padding:"12px",fontSize:11,color:"#87918c",lineHeight:1.45}}>
            {publicStatus==="unavailable"
              ?"Paste the updated SQL in Supabase, then refresh this page."
              :"No public lifters yet. When friends turn Public On, they will show here."}
          </div>
        )}
      </div>

      <div style={{background:"#0a0d0c",border:"1px solid #24304f",
        borderRadius:6,padding:"14px",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:10}}>
          <div>
            <div style={{fontSize:9,color:"#38BFFF",fontWeight:900,
              textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4}}>Community Sharing</div>
            <div style={{fontSize:11,color:"#87918c",lineHeight:1.45}}>
              {publicStatus==="unavailable"
                ?"Run the updated Supabase SQL to unlock friend leaderboards."
                :sharingOn
                  ?"Your safe workout summaries are visible to signed-in lifters."
                  :"Sharing is off. Your private workout data stays private."}
            </div>
          </div>
          <button onClick={onTogglePublicSharing}
            disabled={publicStatus==="saving"||publicStatus==="loading"||publicStatus==="unavailable"}
            style={{border:"none",borderRadius:999,padding:"8px 11px",flexShrink:0,
              background:sharingOn?"#061811":"#070908",
              color:sharingOn?"#2DD4A0":"#87918c",
              outline:`1px solid ${sharingOn?"#2DD4A055":"#252d29"}`,
              fontSize:10,fontWeight:950,cursor:publicStatus==="saving"?"default":"pointer",
              opacity:publicStatus==="unavailable"?0.55:1}}>
            {publicStatus==="saving"?"Saving":sharingOn?"Public On":"Public Off"}
          </button>
        </div>
        {publicError&&(
          <div style={{fontSize:9,color:"#FFB347",lineHeight:1.4,marginBottom:8}}>
            {publicError}
          </div>
        )}
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={onRefreshPublic}
            disabled={publicStatus==="loading"||publicStatus==="unavailable"}
            style={{padding:"7px 9px",borderRadius:8,border:"1px solid #252d29",
              background:"#070908",color:"#98a19c",fontSize:10,fontWeight:900,
              cursor:publicStatus==="unavailable"?"default":"pointer"}}>
            Refresh Community
          </button>
          <span style={{fontSize:9,color:"#66706b"}}>
            {publicReady?`${publicPosts.length} shared post${publicPosts.length!==1?"s":""}`:"Setup pending"}
          </span>
        </div>
      </div>

      <CommunityLeaderboardPanel visiblePublicPosts={visiblePublicPosts}
        publicProfiles={publicProfiles} currentUserId={currentUserId}
        feedScope={feedScope} onFeedScopeChange={onFeedScopeChange}
        publicEngagement={publicEngagement} commentDrafts={commentDrafts}
        onCommentDraftChange={onCommentDraftChange}
        publicReady={publicReady} publicStatus={publicStatus}
        onTogglePublicReaction={onTogglePublicReaction}
        onSubmitPublicComment={onSubmitPublicComment}/>

      <div style={{background:"#0a0d0c",border:"1px solid #24304f",
        borderRadius:6,padding:"14px",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:12}}>
          <div>
            <div style={{fontSize:9,color:"#FFB347",fontWeight:900,
              textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4}}>Personal Weekly Leaderboard</div>
            <div style={{fontSize:11,color:"#87918c",lineHeight:1.4}}>
              {competition.current
                ?`Current week ranks #${competition.current.rank} with a ${competition.current.score} score.`
                :"Log a week to enter the board."}
            </div>
          </div>
          {competition.current&&(
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:20,color:"#fff",fontWeight:950,lineHeight:1}}>{competition.current.score}</div>
              <div style={{fontSize:9,color:competition.current.color,fontWeight:900,marginTop:3}}>
                {competition.toBeat?`+${competition.toBeat} to climb`:"Leader"}
              </div>
            </div>
          )}
        </div>

        {competition.rows.length>0?(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {competition.rows.slice(0,3).map(row=>(
              <div key={row.entry.week} style={{display:"grid",
                gridTemplateColumns:"34px 1fr auto",gap:9,alignItems:"center",
                background:row.index===history.length-1?"#101512":"#070908",
                border:`1px solid ${row.color}30`,
                borderLeft:`3px solid ${row.color}`,borderRadius:5,padding:"9px 10px"}}>
                <div style={{width:28,height:28,borderRadius:"50%",
                  background:row.rank===1?"#FFB347":row.rank===2?"#38BFFF":row.rank===3?"#7C6FFF":"#1b211f",
                  color:"#071000",display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:12,fontWeight:950}}>
                  #{row.rank}
                </div>
                <div style={{minWidth:0}}>
                  <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}>
                    <span style={{fontSize:12,color:"#fff",fontWeight:950}}>Week {row.entry.week}</span>
                    {row.index===history.length-1&&(
                      <span style={{fontSize:8,color:"#2DD4A0",border:"1px solid #2DD4A044",
                        borderRadius:999,padding:"2px 5px",fontWeight:900}}>CURRENT</span>
                    )}
                    {row.entry.deload&&(
                      <span style={{fontSize:8,color:"#38BFFF",border:"1px solid #38BFFF44",
                        borderRadius:999,padding:"2px 5px",fontWeight:900}}>RECOVERY</span>
                    )}
                  </div>
                  <div style={{fontSize:9,color:"#87918c",lineHeight:1.35}}>
                    {row.total.toLocaleString()} lbs · Q{row.quality?.score||0} · PR x{row.prCount} · {row.trainedGroups}/5 groups
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:15,color:row.color,fontWeight:950,lineHeight:1}}>{row.score}</div>
                  <div style={{fontSize:8,color:"#87918c",fontWeight:900,marginTop:4}}>{row.badge}</div>
                </div>
              </div>
            ))}
          </div>
        ):(
          <div style={{background:"#070908",border:"1px solid #1b211f",borderRadius:5,
            padding:"12px",fontSize:11,color:"#87918c",lineHeight:1.45}}>
            Your first logged week will create the opening score.
          </div>
        )}
      </div>

      <div className="earned-feed-challenges" style={{background:"linear-gradient(145deg,#101512,#071622 76%)",
        border:"1px solid #24304f",borderRadius:6,padding:"14px",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:12}}>
          <div>
            <div style={{fontSize:9,color:"#2DD4A0",fontWeight:950,
              textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4}}>Challenge Hub</div>
            <div style={{fontSize:11,color:"#87918c",lineHeight:1.45}}>
              Weekly goals built from volume, PRs, streaks, balance, and recovery.
            </div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:22,color:"#fff",fontWeight:950,lineHeight:1}}>
              {challengeHub.challengeScore}
            </div>
            <div style={{fontSize:9,color:"#2DD4A0",fontWeight:950,marginTop:3}}>Challenge Score</div>
          </div>
        </div>

        {challengeHub.spotlightChallenge&&(
          <div style={{background:"#070908",border:`1px solid ${challengeHub.spotlightChallenge.color}44`,
            borderLeft:`3px solid ${challengeHub.spotlightChallenge.color}`,borderRadius:5,
            padding:"11px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:6}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:8,color:challengeHub.spotlightChallenge.color,fontWeight:950,
                  textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Spotlight Challenge</div>
                <div style={{fontSize:13,color:"#fff",fontWeight:950,whiteSpace:"nowrap",
                  overflow:"hidden",textOverflow:"ellipsis"}}>{challengeHub.spotlightChallenge.title}</div>
              </div>
              <div style={{fontSize:10,color:challengeHub.spotlightChallenge.color,fontWeight:950,
                whiteSpace:"nowrap"}}>
                {challengeHub.spotlightChallenge.completed?"Complete":`${challengeHub.spotlightChallenge.progress}%`}
              </div>
            </div>
            <div style={{fontSize:10,color:"#98a19c",lineHeight:1.4,marginBottom:8}}>
              {challengeHub.spotlightChallenge.detail}
            </div>
            <div style={{height:7,background:"#1e2722",borderRadius:99,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${challengeHub.spotlightChallenge.progress}%`,
                background:`linear-gradient(90deg,${challengeHub.spotlightChallenge.color},#2DD4A0)`,
                borderRadius:99}}/>
            </div>
          </div>
        )}

        <div style={{background:"#070908",border:"1px solid #222b26",borderRadius:5,
          padding:"10px 11px",marginBottom:10}}>
          <div style={{fontSize:8,color:"#FFB347",fontWeight:950,
            textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Weekly Quest</div>
          <div style={{fontSize:11,color:"#ddd",lineHeight:1.4,fontWeight:800}}>
            {challengeHub.weeklyQuest}
          </div>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:9,color:"#777",fontWeight:950,
            textTransform:"uppercase",letterSpacing:"0.12em"}}>Active Challenges</div>
          <div style={{fontSize:10,color:"#87918c",fontWeight:900}}>
            {challengeHub.completedCount} complete
          </div>
        </div>
        <div className="earned-feed-challenge-rail" aria-label="Active community challenges">
          {challenges.map(challenge=>(
            <div key={challenge.id} className="earned-feed-challenge-card"
              style={{background:challenge.completed?"#121a16":"#070908",
              border:`1px solid ${challenge.completed?challenge.color+"55":challenge.color+"25"}`,
              borderRadius:5,padding:"10px 9px",minWidth:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:6}}>
                <div style={{fontSize:8,color:challenge.color,fontWeight:950,
                  textTransform:"uppercase",letterSpacing:"0.08em",whiteSpace:"nowrap",
                  overflow:"hidden",textOverflow:"ellipsis"}}>{challenge.category}</div>
                <div style={{fontSize:8,color:challenge.completed?"#2DD4A0":"#87918c",fontWeight:950,
                  textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap"}}>
                  {challenge.completed?"Done":"Open"}
                </div>
              </div>
              <div style={{fontSize:12,color:"#fff",fontWeight:950,whiteSpace:"nowrap",
                overflow:"hidden",textOverflow:"ellipsis",marginBottom:4}}>{challenge.title}</div>
              <div style={{fontSize:9,color:"#87918c",lineHeight:1.35,minHeight:24}}>{challenge.detail}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginTop:8}}>
                <div style={{fontSize:8,color:"#777",fontWeight:900}}>{challenge.reward}</div>
                <div style={{fontSize:9,color:challenge.color,fontWeight:950,whiteSpace:"nowrap"}}>
                  {challenge.completed?"Complete":`${challenge.progress}%`}
                </div>
              </div>
              <div style={{height:5,background:"#1e2722",borderRadius:99,overflow:"hidden",marginTop:5}}>
                <div style={{height:"100%",width:`${challenge.progress}%`,background:challenge.color,
                  borderRadius:99,transition:"width 0.25s"}}/>
              </div>
              <div style={{fontSize:8,color:"#747e79",fontWeight:800,marginTop:5}}>{challenge.stat}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:9,color:"#7C6FFF",fontWeight:900,
          textTransform:"uppercase",letterSpacing:"0.14em"}}>Workout Feed</div>
        <div style={{fontSize:10,color:"#66706b"}}>{recent.length} recent</div>
      </div>

      {!recent.length&&(
        <div style={{background:"#0a0d0c",border:"1px solid #2a312e",borderRadius:6,
          padding:"34px 18px",textAlign:"center"}}>
          <div style={{fontSize:30,marginBottom:8}}>👥</div>
          <div style={{fontSize:15,color:"#fff",fontWeight:900,marginBottom:5}}>No posts yet</div>
          <div style={{fontSize:12,color:"#747e79",lineHeight:1.5}}>Log a workout and it will appear here as your first feed post.</div>
        </div>
      )}

      <div className="earned-feed-posts">
        {recent.map(entry=>{
          const recap=buildWorkoutRecap(entry,history.filter(e=>e.week<entry.week),customEx);
          const liked=!!social.likes?.[entry.week];
          return(
            <div key={entry.week} className="earned-feed-post" style={{background:"#0a0d0c",border:"1px solid #2a312e",
              borderRadius:6,padding:"13px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:10}}>
                <div>
                  <div style={{fontSize:12,color:"#fff",fontWeight:900}}>@{username}</div>
                  <div style={{fontSize:10,color:"#747e79",marginTop:2}}>
                    Week {entry.week}{entry.date?` · ${entry.date}`:""}
                  </div>
                </div>
                {recap.prCount>0&&<span style={{fontSize:9,color:"#FFB347",border:"1px solid #FFB34744",
                  borderRadius:999,padding:"4px 7px",fontWeight:900}}>PR x{recap.prCount}</span>}
              </div>

              <div style={{fontSize:20,color:"#fff",fontWeight:900,marginBottom:4}}>
                {recap.total.toLocaleString()} lbs
              </div>
              <div style={{fontSize:11,color:"#98a19c",lineHeight:1.45,marginBottom:10}}>
                {recap.bestLift
                  ?`Best lift: ${recap.bestLift.ex.name} for ${recap.bestLift.volume.toLocaleString()} lbs volume.`
                  :"Workout logged."}
              </div>

              <div style={{background:"#070908",border:"1px solid #222b26",
                borderRadius:5,padding:"10px 11px",marginBottom:10}}>
                <div style={{fontSize:8,color:"#38BFFF",fontWeight:950,
                  textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Story</div>
                <div style={{fontSize:12,color:"#fff",fontWeight:950,marginBottom:4}}>
                  {recap.storyHeadline}
                </div>
                <div style={{fontSize:10,color:"#98a19c",lineHeight:1.45}}>
                  {recap.storyNarrative}
                </div>
              </div>

              {recap.trainedMuscles.length>0&&(
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
                  {recap.trainedMuscles.slice(0,5).map(group=>(
                    <span key={group.id} style={{fontSize:9,color:group.color,
                      border:`1px solid ${group.color}33`,borderRadius:999,padding:"4px 7px",
                      fontWeight:800}}>
                      {group.label}
                    </span>
                  ))}
                </div>
              )}

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <button onClick={()=>onToggleLike(entry.week)} style={{
                  padding:"9px",borderRadius:9,border:`1px solid ${liked?"#FF5C8755":"#252d29"}`,
                  background:liked?"#1a0710":"#070908",color:liked?"#FF5C87":"#87918c",
                  fontSize:11,fontWeight:900,cursor:"pointer"}}>
                  {liked?"Liked":"Like"}
                </button>
                <button onClick={()=>copyPost(entry)} style={{
                  padding:"9px",borderRadius:9,border:"1px solid #2DD4A044",
                  background:"#061811",color:"#2DD4A0",fontSize:11,fontWeight:900,cursor:"pointer"}}>
                  Copy Post
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Data Safety Center ───────────────────────────────────────────────────────
function buildDataSafetySnapshot(history=[],goals={},customEx={},preferences={}){
  const safeHistory=Array.isArray(history)?history:[];
  const safeGoals=goals&&typeof goals==="object"?goals:{};
  const safeCustomEx=customEx&&typeof customEx==="object"?customEx:{};
  const savedGoals=Object.entries(safeGoals)
    .filter(([key,value])=>key&&value!==undefined&&value!==null&&value!=="").length;
  const customExerciseCount=DAY_KEYS.reduce((sum,dk)=>
    sum+(safeCustomEx[dk]||[]).filter(ex=>!ex.removed).length,0);
  const removedCount=DAY_KEYS.reduce((sum,dk)=>
    sum+(safeCustomEx._removed?.[dk]?.length||0)+(safeCustomEx[dk]||[]).filter(ex=>ex.removed).length,0);
  const noteCount=Object.keys(exerciseNotes(safeCustomEx)).length;
  const metricCount=bodyMetrics(safeCustomEx).length;
  const templateCount=workoutTemplates(safeCustomEx).length;
  const programCount=coachState(safeCustomEx).plan?.days?.length||0;
  const customRoutineData=customExerciseCount+removedCount+noteCount+metricCount+templateCount+programCount;
  return {
    version:8,
    kind:"lift_tracker_full_backup",
    exportedAt:new Date().toISOString(),
    summary:{
      weeks:safeHistory.length,
      workouts:safeHistory.length,
      goals:savedGoals,
      customRoutineData,
      customExercises:customExerciseCount,
      removedExercises:removedCount,
      exerciseNotes:noteCount,
      bodyMetrics:metricCount,
      templates:templateCount,
      programDays:programCount,
    },
    history:safeHistory,
    goals:safeGoals,
    customEx:safeCustomEx,
    preferences:normalizePreferences(preferences),
  };
}

function parseLiftTrackerBackup(parsed,currentGoals={},currentCustomEx={},currentPreferences={}){
  if(Array.isArray(parsed)){
    return {history:parsed,goals:currentGoals,customEx:currentCustomEx,
      preferences:normalizePreferences({}),mode:"Legacy history file"};
  }
  if(!parsed||typeof parsed!=="object") throw new Error("Backup file is not valid Earned JSON.");
  if(!Array.isArray(parsed.history)) throw new Error("Backup file does not include workout history.");
  if(parsed.kind==="lift_tracker_full_backup"){
    return {
      history:parsed.history,
      goals:parsed.goals&&typeof parsed.goals==="object"?parsed.goals:{},
      customEx:parsed.customEx&&typeof parsed.customEx==="object"?parsed.customEx:{},
      preferences:normalizePreferences(parsed.preferences),
      mode:"Full Account Backup",
    };
  }
  return {
    history:parsed.history,
    goals:currentGoals,
    customEx:currentCustomEx,
    preferences:normalizePreferences({}),
    mode:"Legacy history file",
  };
}

function DataSafetyCenter({history,goals,customEx,preferences,onImport,onImportPreferences}){
  const fileRef=useRef(null);
  const snapshot=buildDataSafetySnapshot(history,goals,customEx,preferences);
  const doExport=()=>{
    const blob=new Blob([JSON.stringify(snapshot,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`earned-full-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const doImport=e=>{
    const file=e.target.files?.[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try{
        const parsed=parseLiftTrackerBackup(JSON.parse(ev.target.result),goals,customEx,preferences);
        const restoreGoals=Object.keys(parsed.goals||{}).length;
        const restoreCustom=buildDataSafetySnapshot(parsed.history,parsed.goals,parsed.customEx,parsed.preferences).summary.customRoutineData;
        if(confirm(`Restore ${parsed.mode} with ${parsed.history.length} workouts, ${restoreGoals} goals, and ${restoreCustom} custom data items? This will replace your current account data.`)){
          onImportPreferences?.(parsed.preferences);
          onImport({history:parsed.history,goals:parsed.goals,customEx:parsed.customEx,preferences:parsed.preferences});
        }
      }catch(err){ alert(err?.message||"Could not import that file."); }
      e.target.value="";
    };
    reader.readAsText(file);
  };
  const backupRows=[
    ["Saved Workouts",snapshot.summary.workouts,"Workout entries included in a full backup.","#7C6FFF"],
    ["Saved Goals",snapshot.summary.goals,"Weekly and per-exercise targets.","#2DD4A0"],
    ["Custom Routine Data",snapshot.summary.customRoutineData,"Exercises, notes, body metrics, templates, and programs.","#FFB347"],
  ];
  return(
    <div style={{background:"#0a0d0c",border:"1px solid #2a312e",borderRadius:6,
      padding:"16px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:12}}>
        <div>
          <div style={{fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
            color:"#7C6FFF",fontWeight:900,marginBottom:4}}>Data Safety Center</div>
          <div style={{fontSize:11,color:"#87918c",lineHeight:1.45}}>
            Full Account Backup for private history, goals, notes, body metrics, programs, and custom routine data.
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:8,color:"#2DD4A0",fontWeight:950,textTransform:"uppercase",
            letterSpacing:"0.08em",marginBottom:4}}>Backup Health</div>
          <div style={{fontSize:20,color:"#fff",fontWeight:950,lineHeight:1}}>
            {snapshot.summary.weeks||snapshot.summary.customRoutineData?"Ready":"New"}
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:11}}>
        {backupRows.map(([label,value,detail,color])=>(
          <div key={label} style={{background:"#070908",border:`1px solid ${color}30`,
            borderRadius:5,padding:"9px",minWidth:0}}>
            <div style={{fontSize:8,color:color,fontWeight:950,textTransform:"uppercase",
              letterSpacing:"0.08em",marginBottom:5,whiteSpace:"nowrap",overflow:"hidden",
              textOverflow:"ellipsis"}}>{label}</div>
            <div style={{fontSize:17,color:"#fff",fontWeight:950,lineHeight:1}}>{value}</div>
            <div style={{fontSize:8,color:"#87918c",lineHeight:1.35,marginTop:5}}>{detail}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#070908",border:"1px solid #202923",borderRadius:5,
        padding:"10px",marginBottom:10}}>
        <div style={{fontSize:8,color:"#38BFFF",fontWeight:950,textTransform:"uppercase",
          letterSpacing:"0.08em",marginBottom:5}}>Full Account Backup</div>
        <div style={{fontSize:10,color:"#777",lineHeight:1.45,fontWeight:700}}>
          Export before big changes or Netlify releases. Import supports new full backups and older history-only files.
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={doExport} style={{flex:1,padding:"10px",borderRadius:9,
          background:"#7C6FFF",color:"#fff",fontWeight:900,fontSize:11,cursor:"pointer",
          border:"none"}}>
          Export Full Backup
        </button>
        <button onClick={()=>fileRef.current.click()} style={{flex:1,padding:"10px",borderRadius:9,
          border:"1px solid #252d29",background:"#070908",
          color:"#aaa",fontWeight:900,fontSize:11,cursor:"pointer"}}>
          Import Full Backup
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" onChange={doImport} style={{display:"none"}}/>
      </div>
    </div>
  );
}

// ─── Goals Settings View ──────────────────────────────────────────────────────
function GoalForecastPanel({history,goals,customEx}){
  const goalForecasts=buildGoalForecasts(history,goals,customEx);
  const weekly=goalForecasts.weeklyForecast;
  const exerciseRows=goalForecasts.exerciseForecasts.slice(0,5);
  const fmtWeeks=value=>value===0?"Hit":value==null?"Needs trend":`${value} wk${value===1?"":"s"}`;
  return(
    <div style={{background:"linear-gradient(145deg,#101512,#070908)",border:"1px solid #35423b",
      borderRadius:6,padding:"14px",marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:12}}>
        <div>
          <div style={{fontSize:9,color:"#2DD4A0",fontWeight:900,
            textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4}}>Goal Forecast & ETA</div>
          <div style={{fontSize:11,color:"#87918c",lineHeight:1.45}}>
            Private pace estimates from your saved history and current goals.
          </div>
        </div>
        <div style={{fontSize:10,color:"#777",fontWeight:900,whiteSpace:"nowrap"}}>
          {goalForecasts.hasGoals?"Forecasting":"Set goals"}
        </div>
      </div>
      {!goalForecasts.hasGoals?(
        <div style={{background:"#070908",border:"1px solid #1b211f",borderRadius:5,
          padding:"12px",fontSize:11,color:"#87918c",lineHeight:1.45}}>
          Set a weekly goal or exercise goal to unlock Weeks to Goal, Pace, Exercise ETA, and Next Target guidance.
        </div>
      ):(
        <>
          {weekly&&(
            <div style={{background:"#070908",border:"1px solid #7C6FFF33",
              borderRadius:5,padding:"10px",marginBottom:10}}>
              <div style={{fontSize:8,color:"#7C6FFF",fontWeight:950,
                textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Weekly Goal Forecast</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:6,marginBottom:8}}>
                {[
                  ["Current",`${weekly.current.toLocaleString()} lbs`,"#fff"],
                  ["Weeks to Goal",fmtWeeks(weekly.weeksToGoal),"#2DD4A0"],
                  ["Pace",weekly.pace,"#38BFFF"],
                  ["Next Target",`${weekly.nextTarget.toLocaleString()} lbs`,"#FFB347"],
                ].map(([label,value,color])=>(
                  <div key={label} style={{background:"#0a0d0c",border:"1px solid #202923",
                    borderRadius:8,padding:"7px",minWidth:0}}>
                    <div style={{fontSize:7,color:"#87918c",fontWeight:950,
                      textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4,
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</div>
                    <div style={{fontSize:10,color:color,fontWeight:950,
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{height:6,background:"#1e2722",borderRadius:999,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${weekly.progress}%`,background:"#7C6FFF",borderRadius:999}}/>
              </div>
            </div>
          )}
          <div style={{fontSize:8,color:"#FFB347",fontWeight:950,
            textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:7}}>Exercise ETA</div>
          {exerciseRows.length?(
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {exerciseRows.map(row=>(
                <div key={row.id} style={{background:"#070908",border:`1px solid ${row.color}2f`,
                  borderRadius:9,padding:"9px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"baseline",marginBottom:6}}>
                    <div style={{fontSize:11,color:"#fff",fontWeight:950,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.ex.name}</div>
                    <div style={{fontSize:9,color:row.color,fontWeight:950,whiteSpace:"nowrap"}}>
                      {fmtWeeks(row.weeksToGoal)}
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"center"}}>
                    <div style={{height:6,background:"#1e2722",borderRadius:999,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${row.progress}%`,background:row.color,borderRadius:999}}/>
                    </div>
                    <div style={{fontSize:8,color:"#777",fontWeight:900,whiteSpace:"nowrap"}}>
                      {row.current.toLocaleString()} / {row.goal.toLocaleString()}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:6}}>
                    <span style={{fontSize:8,color:"#38BFFF",fontWeight:900}}>Pace: {row.pace}</span>
                    <span style={{fontSize:8,color:"#FFB347",fontWeight:900}}>Next Target: {row.nextTarget.toLocaleString()} lbs</span>
                  </div>
                </div>
              ))}
            </div>
          ):(
            <div style={{background:"#070908",border:"1px solid #1b211f",borderRadius:5,
              padding:"10px",fontSize:10,color:"#87918c",lineHeight:1.4}}>
              Set exercise goals to see per-lift ETA forecasts.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BodyMetricsPanel({history,customEx,onSaveBodyMetric,onDeleteBodyMetric}){
  const insights=buildBodyMetricsInsights(history,customEx);
  const today=new Date().toISOString().slice(0,10);
  const [date,setDate]=useState(today);
  const [weight,setWeight]=useState("");
  const recent=insights.bodyMetrics.slice(-5).reverse();
  const save=()=>{
    const parsed=parseFloat(weight);
    if(!date){alert("Choose a date.");return;}
    if(isNaN(parsed)||parsed<=0){alert("Enter a valid bodyweight.");return;}
    onSaveBodyMetric({date,weight:parsed});
    setWeight("");
  };
  return(
    <div style={{background:"linear-gradient(145deg,#101512,#070908)",border:"1px solid #35423b",
      borderRadius:6,padding:"14px",marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:12}}>
        <div>
          <div style={{fontSize:9,color:"#FF5C87",fontWeight:900,
            textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4}}>Body Metrics & Strength Ratio</div>
          <div style={{fontSize:11,color:"#87918c",lineHeight:1.45}}>
            Private body metrics for bodyweight, trend, and strength compared to bodyweight.
          </div>
        </div>
        <div style={{fontSize:10,color:"#777",fontWeight:900,whiteSpace:"nowrap"}}>
          {insights.latestWeight?`${insights.latestWeight} lbs`:"No weight"}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8,marginBottom:12}}>
        {[
          ["Bodyweight",insights.latestWeight?`${insights.latestWeight} lbs`:"--","#fff"],
          ["Weight Trend",insights.trendLabel,insights.weightTrend<0?"#2DD4A0":insights.weightTrend>0?"#FFB347":"#38BFFF"],
          ["Volume / lb",insights.volumePerLb?String(insights.volumePerLb):"--","#7C6FFF"],
          ["Best 1RM / lb",insights.bestOneRMPerLb?`${insights.bestOneRMPerLb}x`:"--","#2DD4A0"],
        ].map(([label,value,color])=>(
          <div key={label} style={{background:"#070908",border:"1px solid #202923",
            borderRadius:5,padding:"10px",minWidth:0}}>
            <div style={{fontSize:8,color:"#87918c",fontWeight:950,textTransform:"uppercase",
              letterSpacing:"0.08em",marginBottom:5,whiteSpace:"nowrap",overflow:"hidden",
              textOverflow:"ellipsis"}}>{label}</div>
            <div style={{fontSize:13,color,fontWeight:950,whiteSpace:"nowrap",
              overflow:"hidden",textOverflow:"ellipsis"}}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{background:"#070908",border:"1px solid #202923",borderRadius:5,
        padding:"10px",marginBottom:10}}>
        <div style={{fontSize:8,color:"#38BFFF",fontWeight:950,textTransform:"uppercase",
          letterSpacing:"0.08em",marginBottom:8}}>Strength Ratio</div>
        <div style={{fontSize:11,color:"#777",lineHeight:1.45,marginBottom:9}}>
          {insights.strengthRatioLabel}
          {insights.bestLiftName&&` from ${insights.bestLiftName}`}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:7,alignItems:"center"}}>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{minWidth:0,background:"#0a0d0c",border:"1px solid #35423b",borderRadius:8,
              color:"#fff",padding:"9px 8px",fontSize:11,fontWeight:800,outline:"none"}}/>
          <input type="number" value={weight} onChange={e=>setWeight(e.target.value)}
            placeholder={insights.latestWeight?`${insights.latestWeight}`:"lbs"}
            style={{minWidth:0,background:"#0a0d0c",border:"1px solid #35423b",borderRadius:8,
              color:"#fff",padding:"9px 8px",fontSize:11,fontWeight:800,outline:"none"}}/>
          <button onClick={save} style={{border:"none",borderRadius:8,background:"#FF5C87",
            color:"#fff",fontSize:10,fontWeight:950,padding:"10px 9px",cursor:"pointer",
            whiteSpace:"nowrap"}}>Save Bodyweight</button>
        </div>
      </div>

      {recent.length?(
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {recent.map(item=>(
            <div key={item.id} style={{display:"flex",justifyContent:"space-between",
              alignItems:"center",gap:8,background:"#070908",border:"1px solid #1b211f",
              borderRadius:8,padding:"8px 9px"}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:10,color:"#fff",fontWeight:900}}>{item.weight} lbs</div>
                <div style={{fontSize:8,color:"#87918c",fontWeight:800}}>{item.date}</div>
              </div>
              <button onClick={()=>onDeleteBodyMetric(item.id)} style={{background:"none",
                border:"1px solid #2a1a2a",color:"#FF5C87",borderRadius:7,padding:"4px 7px",
                fontSize:9,fontWeight:900,cursor:"pointer"}}>Remove</button>
            </div>
          ))}
        </div>
      ):(
        <div style={{background:"#070908",border:"1px solid #1b211f",borderRadius:5,
          padding:"10px",fontSize:10,color:"#87918c",lineHeight:1.45}}>
          Add your first bodyweight entry to unlock bodyweight trend and ratio tracking.
        </div>
      )}
    </div>
  );
}

function GoalsView({history,weeklyHistory=[],trackingMode,goals,onSetGoal,onSetWeeklyGoal,customEx,onSaveBodyMetric,onDeleteBodyMetric}){
  const goalHistory=trackingMode===TRACKING_MODES.DAILY?weeklyHistory:history;
  const [wval,setWval]=useState(String(goals?.weeklyVolume||""));
  return(
    <div className="earned-workout-view earned-workout-view--goals">
      <div className="earned-goals-target" style={{background:"#0a0d0c",border:"1px solid #2a312e",borderRadius:6,
        padding:"16px",marginBottom:14}}>
        <div style={{fontSize:9,color:"#7C6FFF",textTransform:"uppercase",
          letterSpacing:"0.12em",fontWeight:700,marginBottom:8}}>Weekly Total Volume Goal</div>
        <div style={{display:"flex",gap:8}}>
          <input type="number" value={wval} onChange={e=>setWval(e.target.value)}
            placeholder="e.g. 30000"
            style={{flex:1,background:"#070908",border:"1px solid #46514b",borderRadius:8,
              color:"#fff",padding:"10px 12px",fontSize:15,outline:"none",fontWeight:700}}/>
          <button onClick={()=>onSetWeeklyGoal(wval?parseInt(wval):null)} style={{
            padding:"10px 16px",borderRadius:9,border:"none",
            background:"#7C6FFF",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>Set</button>
        </div>
        {goals?.weeklyVolume&&(
          <div style={{fontSize:10,color:"#445049",marginTop:8}}>
            Current goal: {goals.weeklyVolume.toLocaleString()} lbs/week
          </div>
        )}
        {trackingMode===TRACKING_MODES.DAILY&&(
          <div style={{fontSize:9,color:"#38BFFF",marginTop:7,fontWeight:800}}>
            Every daily workout updates this calendar-week goal automatically.
          </div>
        )}
      </div>

      <GoalForecastPanel history={goalHistory} goals={goals} customEx={customEx}/>
      <BodyMetricsPanel history={history} customEx={customEx}
        onSaveBodyMetric={onSaveBodyMetric} onDeleteBodyMetric={onDeleteBodyMetric}/>

      <div style={{fontSize:9,color:"#87918c",textTransform:"uppercase",
        letterSpacing:"0.12em",fontWeight:700,marginBottom:10}}>Per-Exercise Volume Goals</div>
      {DAY_KEYS.map(dk=>(
        <div key={dk} style={{marginBottom:14}}>
          <div style={{fontSize:10,color:DAYS[dk].accent,fontWeight:700,marginBottom:8}}>
            {DAYS[dk].label}
          </div>
          {allExercises(dk,customEx).map(ex=>{
            const goal=goals?.[ex.id];
            return(
              <div key={ex.id} style={{display:"flex",justifyContent:"space-between",
                alignItems:"center",padding:"8px 0",borderBottom:"1px solid #181e1b"}}>
                <span style={{fontSize:11,color:"#98a19c"}}>
                  {ex.name}
                  {ex.isCustom&&<span style={{fontSize:8,color:"#38BFFF",marginLeft:5,
                    border:"1px solid #38BFFF33",borderRadius:4,padding:"1px 4px"}}>CUSTOM</span>}
                </span>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {goal&&<span style={{fontSize:11,color:"#7C6FFF",fontWeight:700}}>{goal.toLocaleString()} lbs</span>}
                  <button onClick={()=>onSetGoal(ex.id,ex.name)} style={{
                    background:"none",border:"1px solid #252d29",color:"#747e79",
                    borderRadius:6,padding:"3px 8px",fontSize:9,cursor:"pointer"}}>
                    {goal?"Edit":"+ Set"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Account Screens ─────────────────────────────────────────────────────────
function AuthScreen({onAuthed}){
  const [mode,setMode]=useState("login");
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  const finishAuth=(user,name)=>{
    activeAccountName=name;
    onAuthed({user,username:name});
  };

  const createAccount=async(name)=>{
    const {data,error:signUpError}=await supabase.auth.signUp({
      email:usernameToEmail(name),
      password,
      options:{data:{username:name}},
    });
    if(signUpError) throw signUpError;
    if(data.session?.user) finishAuth(data.session.user,name);
    else if(data.user) setError("Account created, but Supabase is asking for email confirmation. Turn off Confirm Email in Supabase Auth settings for username-only login.");
    else setError("Account created. Try logging in now.");
  };

  const submit=async()=>{
    const name=normalizeUsername(username);
    setError("");
    const usernameError=validateUsername(name);
    if(usernameError){setError(usernameError);return;}
    if(!password){setError("Enter a password.");return;}
    setBusy(true);
    try{
      if(mode==="signup"){
        await createAccount(name);
      }else{
        const {data,error:signInError}=await supabase.auth.signInWithPassword({
          email:usernameToEmail(name),
          password,
        });
        if(signInError){
          if(name==="danatel"&&/invalid login/i.test(signInError.message)){
            await createAccount(name);
          }else{
            setError("Username or password is incorrect.");
          }
          return;
        }
        finishAuth(data.user,name);
      }
    }catch(e){
      console.error(e);
      setError(e.message||"Something went wrong signing in.");
    }finally{
      setBusy(false);
    }
  };

  return <PublicLaunch
    mode={mode}
    username={username}
    password={password}
    error={error}
    busy={busy}
    onModeChange={nextMode=>{setMode(nextMode);setError("");}}
    onUsernameChange={setUsername}
    onPasswordChange={setPassword}
    onSubmit={submit}/>;
}

// ─── Load state screens ───────────────────────────────────────────────────────
function LoadingScreen(){
  return(
    <div className="earned-system-state">
      <div className="earned-system-state__panel">
        <img src="/lift-icon-192.png" alt=""/>
        <span>SYNC / ACCOUNT</span>
        <h1>Loading your work.</h1>
        <p>Your saved training record is being prepared.</p>
        <div className="earned-system-state__loader" aria-label="Loading"><i/><i/><i/><i/></div>
      </div>
    </div>
  );
}

function LoadFailedScreen({onRetry}){
  const [retrying,setRetrying]=useState(false);
  const handleClick=async()=>{
    setRetrying(true);
    await onRetry();
    setRetrying(false);
  };
  return(
    <div className="earned-system-state">
      <div className="earned-system-state__panel earned-system-state__panel--error">
        <img src="/lift-icon-192.png" alt=""/>
        <span>SYNC / INTERRUPTED</span>
        <h1>Your data is still safe.</h1>
        <p>Earned could not reach saved workouts yet. Nothing was changed or deleted; reconnect and try the account sync again.</p>
        <button type="button" onClick={handleClick} disabled={retrying}>
          {retrying?"Retrying...":"Try again"}<span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App(){
  const visualQaHistory=useMemo(()=>LOCAL_VISUAL_QA?buildVisualQaHistory():[],[]);
  const [authUser,setAuthUser]   = useState(()=>LOCAL_VISUAL_QA?{user:{id:"local-visual-qa"},username:"danatel"}:null);
  const [authReady,setAuthReady] = useState(LOCAL_VISUAL_QA);
  const [history,setHistory]     = useState(()=>visualQaHistory);
  const [goals,setGoals]         = useState(()=>LOCAL_VISUAL_QA?buildVisualQaGoals(visualQaHistory):{});
  const [customEx,setCustomEx]   = useState({});
  const [preferences,setPreferences] = useState(()=>normalizePreferences({}));
  const [draft,setDraft]         = useState(null);
  const [persistedCoachContext,setPersistedCoachContext] = useState(null);
  const [loadState,setLoadState] = useState(LOCAL_VISUAL_QA?"ready":"loading"); // loading | ready | failed
  const [view,setView]           = useState(LOCAL_VISUAL_VIEW);
  const [goalModal,setGoalModal] = useState(null);
  const [editWeekIndex,setEditWeekIndex] = useState(null);
  const [confetti,setConfetti]   = useState(false);
  const [syncStatus,setSyncStatus] = useState("idle"); // idle|saving|saved|error
  const [lastSavedLabel,setLastSavedLabel] = useState("");
  const [publicProfile,setPublicProfile] = useState(null);
  const [publicPosts,setPublicPosts] = useState([]);
  const [publicLikes,setPublicLikes] = useState({counts:{},mine:{}});
  const [publicProfiles,setPublicProfiles] = useState([]);
  const [publicFollows,setPublicFollows] = useState([]);
  const [publicSocialGraph,setPublicSocialGraph] = useState(emptyPublicSocialGraph());
  const [publicEngagement,setPublicEngagement] = useState(emptyPublicEngagement());
  const [commentDrafts,setCommentDrafts] = useState({});
  const [feedScope,setFeedScope] = useState("everyone");
  const [publicStatus,setPublicStatus] = useState("idle"); // idle|loading|ready|saving|unavailable|error
  const [publicError,setPublicError] = useState("");
  const [isOnline,setIsOnline]=useState(()=>navigator.onLine);
  const [pricingOpen,setPricingOpen]=useState(false);
  const [subscription,setSubscription]=useState(()=>createFreeSubscription());
  const [showPostWorkoutUpgrade,setShowPostWorkoutUpgrade]=useState(false);
  const [workoutCelebration,setWorkoutCelebration]=useState(null);

  const trackingMode=normalizeTrackingMode(preferences?.trackingMode);
  const exerciseDayMap=useMemo(()=>{
    const map={};
    for(const dayKey of DAY_KEYS){
      for(const exercise of exerciseCatalogForDay(dayKey,customEx)) map[exercise.id]=dayKey;
    }
    return map;
  },[customEx]);
  const dailyHistory=useMemo(
    ()=>buildTrackingHistory(history,TRACKING_MODES.DAILY,exerciseDayMap,DAY_KEYS),
    [history,exerciseDayMap],
  );
  const weeklyHistory=useMemo(
    ()=>buildTrackingHistory(history,TRACKING_MODES.WEEKLY,exerciseDayMap,DAY_KEYS),
    [history,exerciseDayMap],
  );
  const progressHistory=trackingMode===TRACKING_MODES.DAILY?dailyHistory:weeklyHistory;

  const pendingRetryRef   = useRef(null); // whichever save last failed, re-runnable
  const autoRetryTimerRef = useRef(null);
  const autoRetryDelayRef = useRef(5000);

  useEffect(()=>{
    const handleOnline=()=>setIsOnline(true);
    const handleOffline=()=>setIsOnline(false);
    window.addEventListener("online",handleOnline);
    window.addEventListener("offline",handleOffline);
    return()=>{
      window.removeEventListener("online",handleOnline);
      window.removeEventListener("offline",handleOffline);
    };
  },[]);

  const markSaved=()=>{
    setSyncStatus("saved");
    setLastSavedLabel(new Date().toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}));
    autoRetryDelayRef.current=5000;
    if(autoRetryTimerRef.current){clearTimeout(autoRetryTimerRef.current);autoRetryTimerRef.current=null;}
  };

  const scheduleAutoRetry=()=>{
    if(autoRetryTimerRef.current) clearTimeout(autoRetryTimerRef.current);
    const delay=autoRetryDelayRef.current;
    autoRetryTimerRef.current=setTimeout(()=>{
      autoRetryDelayRef.current=Math.min(autoRetryDelayRef.current*2,30000);
      pendingRetryRef.current?.();
    },delay);
  };

  const setPublicUnavailable=()=>{
    setPublicProfile(null);
    setPublicPosts([]);
    setPublicLikes({counts:{},mine:{}});
    setPublicProfiles([]);
    setPublicFollows([]);
    setPublicSocialGraph(emptyPublicSocialGraph());
    setPublicEngagement(emptyPublicEngagement());
    setCommentDrafts({});
    setPublicStatus("unavailable");
    setPublicError("Public sharing tables are not installed yet. Run the updated Supabase SQL, then refresh.");
  };

  const applyPublicCommunity=community=>{
    setPublicPosts(community.posts||[]);
    setPublicLikes(community.likes||{counts:{},mine:{}});
    setPublicProfiles(community.profiles||[]);
    setPublicFollows(community.follows||[]);
    setPublicSocialGraph(community.socialGraph||emptyPublicSocialGraph());
    setPublicEngagement(community.engagement||emptyPublicEngagement());
  };

  const refreshPublicSharing=async(
    user=authUser?.user,
    username=authUser?.username,
    nextHistory=history,
    nextCustomEx=customEx,
    options={}
  )=>{
    if(!user||LOCAL_VISUAL_QA) return;
    setPublicStatus(prev=>prev==="saving"?"saving":"loading");
    try{
      const profile=await getOrCreatePublicProfile(user,username);
      setPublicProfile(profile);
      if(profile.share_enabled&&options.sync){
        await syncPublicWorkoutPosts(user,buildTrackingHistory(nextHistory,TRACKING_MODES.WEEKLY),nextCustomEx);
      }
      const community=await loadPublicCommunity(user);
      applyPublicCommunity(community);
      setPublicError("");
      setPublicStatus("ready");
    }catch(e){
      if(isMissingPublicSchemaError(e)){
        setPublicUnavailable();
      }else{
        setPublicStatus("error");
        setPublicError(e?.message||"Public sharing could not be refreshed.");
      }
    }
  };

  useEffect(()=>{
    if(LOCAL_VISUAL_QA) return undefined;
    let mounted=true;
    (async()=>{
      const {data}=await supabase.auth.getSession();
      const user=data.session?.user;
      if(user){
        const username=usernameFromUser(user);
        activeAccountName=username;
        if(mounted) setAuthUser({user,username});
      }
      if(mounted) setAuthReady(true);
    })();
    const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{
      const user=session?.user;
      if(!mounted) return;
      if(user){
        const username=usernameFromUser(user);
        activeAccountName=username;
        setAuthUser({user,username});
      }else{
        activeAccountName=null;
        setAuthUser(null);
      }
    });
    return()=>{
      mounted=false;
      listener.subscription.unsubscribe();
    };
  },[]);

  const bootstrap=async()=>{
    if(!authUser) return;
    activeAccountName=authUser.username;
    setLoadState("loading");
    try{
      const [data,coachContext]=await Promise.all([
        loadCloudInitialData(authUser.user,authUser.username),
        loadPersistedCoachSwapContext(supabase,authUser.user.id).catch(error=>{
          console.warn("Persisted Coach constraints unavailable.",error);
          return null;
        }),
      ]);
      setHistory(data.history);
      setGoals(data.goals);
      setCustomEx(data.customEx);
      setPreferences(normalizePreferences(data.preferences));
      setDraft(data.draft||null);
      setPersistedCoachContext(coachContext);
      setLoadState("ready");
      markSaved();
      refreshPublicSharing(authUser.user,authUser.username,data.history,data.customEx,{sync:true});
    }catch(e){
      console.error(e);
      setLoadState("failed");
    }
  };

  useEffect(()=>{ if(authUser&&!LOCAL_VISUAL_QA) bootstrap(); },[authUser]);

  // Single path for persisting account data together. It writes the local
  // snapshot before committing UI state, then syncs the same snapshot to
  // the cloud. Cloud failures retry in the background; local failures leave
  // the workout draft intact instead of displaying a false success.
  const saveAll=async(nextHistory,nextGoals,nextCustomEx,nextPreferences=preferences,options={})=>{
    const normalizedPreferences=normalizePreferences(nextPreferences);
    if(LOCAL_VISUAL_QA){
      setHistory(nextHistory);
      setGoals(nextGoals);
      setCustomEx(nextCustomEx);
      setPreferences(normalizedPreferences);
      setDraft(options.clearCloudDraft?null:draft);
      markSaved();
      return true;
    }
    setSyncStatus("saving");
    let localSaved=false;
    try{
      await setWithRetry(LIFT_DATA_KEY,JSON.stringify({history:nextHistory,goals:nextGoals,customEx:nextCustomEx,preferences:normalizedPreferences}),3);
      localSaved=true;
      setHistory(nextHistory);
      setGoals(nextGoals);
      setCustomEx(nextCustomEx);
      setPreferences(normalizedPreferences);
      if(authUser?.user){
        await saveCloudData(authUser.user,nextHistory,nextGoals,nextCustomEx,normalizedPreferences);
        if(options.clearCloudDraft) await clearCloudDraft(authUser.user);
      }
      markSaved();
      pendingRetryRef.current=null;
      if(authUser?.user&&publicStatus!=="unavailable"){
        refreshPublicSharing(authUser.user,authUser.username,nextHistory,nextCustomEx,{sync:true});
      }
      return true;
    }catch(e){
      console.error(e);
      setSyncStatus("error");
      if(localSaved){
        pendingRetryRef.current=()=>saveAll(nextHistory,nextGoals,nextCustomEx,normalizedPreferences,options);
        scheduleAutoRetry();
      }else{
        pendingRetryRef.current=null;
      }
      return localSaved;
    }
  };

  const handleSaveDraft=async(draftData)=>{
    if(LOCAL_VISUAL_QA){
      setDraft(draftData);
      markSaved();
      return true;
    }
    setSyncStatus("saving");
    let localSaved=false;
    try{
      await setWithRetry(DRAFT_KEY,JSON.stringify(draftData),2);
      localSaved=true;
      setDraft(draftData);
      if(authUser?.user) await saveCloudDraft(authUser.user,draftData);
      markSaved();
      pendingRetryRef.current=null;
      return true;
    }catch(e){
      console.error(e);
      setSyncStatus("error");
      if(localSaved){
        pendingRetryRef.current=()=>handleSaveDraft(draftData);
        scheduleAutoRetry();
      }
      return localSaved;
    }
  };
  const handleClearDraft=async()=>{
    if(LOCAL_VISUAL_QA){
      setDraft(null);
      markSaved();
      return true;
    }
    let localCleared=false;
    try{
      await deleteWithRetry(DRAFT_KEY);
      localCleared=true;
      setDraft(null);
      if(authUser?.user) await clearCloudDraft(authUser.user);
    }catch{}
    return localCleared;
  };

  const handleLogout=async()=>{
    await supabase.auth.signOut();
    activeAccountName=null;
    setAuthUser(null);
    setHistory([]);
    setGoals({});
    setCustomEx({});
    setPreferences(normalizePreferences({}));
    setDraft(null);
    setPersistedCoachContext(null);
    setPublicProfile(null);
    setPublicPosts([]);
    setPublicLikes({counts:{},mine:{}});
    setPublicProfiles([]);
    setPublicFollows([]);
    setPublicSocialGraph(emptyPublicSocialGraph());
    setPublicEngagement(emptyPublicEngagement());
    setCommentDrafts({});
    setFeedScope("everyone");
    setPublicStatus("idle");
    setPublicError("");
    setPricingOpen(false);
    setSubscription(createFreeSubscription());
    setShowPostWorkoutUpgrade(false);
    setWorkoutCelebration(null);
    setLoadState("loading");
    setView("total");
  };

  const handleManualRetry=()=>{ pendingRetryRef.current?.(); };

  const handleTrackingModeChange=async mode=>{
    const nextPreferences={...preferences,trackingMode:normalizeTrackingMode(mode)};
    if(nextPreferences.trackingMode===trackingMode) return;
    await saveAll(history,goals,customEx,nextPreferences);
  };
  const handleAsciiAvatarStyleChange=async asciiAvatarStyle=>{
    if(!ASCII_AVATAR_STYLES.has(asciiAvatarStyle)||asciiAvatarStyle===preferences.asciiAvatarStyle) return;
    await saveAll(history,goals,customEx,{...preferences,asciiAvatarStyle});
  };

  const handleNewPeriod=async payload=>{
    const normalizedReadiness=normalizeReadiness(payload.readiness);
    const periodType=payload.periodType===PERIOD_TYPES.DAY?PERIOD_TYPES.DAY:PERIOD_TYPES.WEEK;
    const dayKey=periodType===PERIOD_TYPES.DAY&&DAY_KEYS.includes(payload.dayKey)?payload.dayKey:undefined;
    const now=Date.now();
    const entry={
      week:history.length+1,
      periodId:payload.periodId||`${periodType}-${now}-${Math.random().toString(36).slice(2,8)}`,
      periodType,
      dayKey,
      exercises:payload.exercises,
      date:payload.date||new Date().toISOString().slice(0,10),
      notes:payload.notes||undefined,
      rating:payload.rating||undefined,
      rpe:payload.rpe||undefined,
      deload:payload.deload||undefined,
      readiness:normalizedReadiness,
    };
    const updated=[...history,entry];

    const newTotal=getTotalVol(entry,customEx);
    const previousBestHistory=periodType===PERIOD_TYPES.DAY
      ?progressHistory.filter(row=>row.periodType===PERIOD_TYPES.DAY&&row.dayKey===dayKey)
      :progressHistory;
    const prevBest=previousBestHistory.length
      ?Math.max(...previousBestHistory.map(e=>getTotalVol(e,customEx)))
      :0;
    const saved=await saveAll(updated,goals,customEx,preferences,{clearCloudDraft:true});
    if(!saved) return false;
    const isPR=newTotal>prevBest;
    if(isPR){
      setConfetti(true);
      setTimeout(()=>setConfetti(false),4000);
    }
    setWorkoutCelebration({
      workoutLabel:periodType===PERIOD_TYPES.DAY
        ?DAYS[dayKey]?.label||"Workout"
        :"Weekly training",
      volume:newTotal,
      streak:calcStreak(updated,customEx),
      streakUnit:trackingMode===TRACKING_MODES.DAILY?"days":"weeks",
      isPR,
    });
    setShowPostWorkoutUpgrade(true);
    setView("total");
    return true;
  };

  const handleDelete=async index=>{
    const updated=history.filter((_,i)=>i!==index).map((e,i)=>({...e,week:i+1}));
    await saveAll(updated,goals,customEx);
  };

  const handleEditWeek=async(index,updatedEntry)=>{
    const updated=history.map((entry,i)=>i===index?{...updatedEntry,week:i+1}:entry);
    await saveAll(updated,goals,customEx);
    setEditWeekIndex(null);
    setView("history");
  };

  const handleReset=async()=>{
    if(!confirm("Reset all workout history to zero? This cannot be undone.")) return;
    await saveAll([],goals,customEx);
    await handleClearDraft();
    setView("total");
  };

  const handleSetGoal=(exId,val)=>{ saveAll(history,{...goals,[exId]:val},customEx); };
  const handleSetWeeklyGoal=val=>{ saveAll(history,{...goals,weeklyVolume:val},customEx); };
  const handleSaveBodyMetric=async metric=>{
    const weight=Number(metric.weight);
    if(!metric.date||!weight||weight<=0) return;
    const nextEntry={
      id:`body_${metric.date}`,
      date:metric.date,
      weight:Number(weight.toFixed(1)),
    };
    const next=[
      ...bodyMetrics(customEx).filter(item=>item.date!==metric.date),
      nextEntry,
    ].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    await saveAll(history,goals,{...customEx,_bodyMetrics:next});
  };
  const handleDeleteBodyMetric=async id=>{
    const next=bodyMetrics(customEx).filter(item=>item.id!==id);
    await saveAll(history,goals,{...customEx,_bodyMetrics:next});
  };
  const handleSaveExerciseNote=async(exId,note)=>{
    if(!exId) return;
    const next={...exerciseNotes(customEx)};
    const clean=String(note||"").trim().slice(0,240);
    if(clean){
      next[exId]={note:clean,updatedAt:new Date().toISOString()};
    }else{
      delete next[exId];
    }
    await saveAll(history,goals,{...customEx,_exerciseNotes:next});
  };
  const handleImport=async payload=>{
    const nextHistory=Array.isArray(payload)?payload:(Array.isArray(payload?.history)?payload.history:[]);
    const nextGoals=Array.isArray(payload)?goals:(payload?.goals&&typeof payload.goals==="object"?payload.goals:goals);
    const nextCustomEx=Array.isArray(payload)?customEx:(payload?.customEx&&typeof payload.customEx==="object"?payload.customEx:customEx);
    const nextPreferences=Array.isArray(payload)?preferences:normalizePreferences(payload?.preferences||preferences);
    await saveAll(nextHistory,nextGoals,nextCustomEx,nextPreferences);
    setView("total");
  };

  const handleAddExercise=async(dk,newEx)=>{
    const updatedCustom={...customEx,[dk]:[...(customEx[dk]||[]),newEx]};
    const updatedHistory=history.map(entry=>({
      ...entry,
      exercises:{
        ...entry.exercises,
        [newEx.id]:entry.exercises[newEx.id]||{volume:0,w:newEx.w,r:newEx.r,s:newEx.s},
      },
    }));
    await saveAll(updatedHistory,goals,updatedCustom);
  };

  const handleRemoveExercise=async(dk,exId)=>{
    const isCustom=(customEx[dk]||[]).some(e=>e.id===exId);
    let updatedCustom;
    if(isCustom){
      updatedCustom={...customEx,[dk]:(customEx[dk]||[]).map(e=>e.id===exId?{...e,removed:true}:e)};
    }else{
      const nextRemoved={...(customEx._removed||{})};
      nextRemoved[dk]=[...new Set([...(nextRemoved[dk]||[]),exId])];
      updatedCustom={...customEx,_removed:nextRemoved};
    }
    await saveAll(history,goals,updatedCustom);
  };

  const handleRestoreExercise=async(dk,exId)=>{
    const isCustom=(customEx[dk]||[]).some(e=>e.id===exId);
    let updatedCustom;
    if(isCustom){
      updatedCustom={...customEx,[dk]:(customEx[dk]||[]).map(e=>e.id===exId?{...e,removed:false}:e)};
    }else{
      const nextRemoved={...(customEx._removed||{})};
      nextRemoved[dk]=(nextRemoved[dk]||[]).filter(id=>id!==exId);
      updatedCustom={...customEx,_removed:nextRemoved};
    }
    await saveAll(history,goals,updatedCustom);
  };

  const handleSaveTemplate=async(dk,name)=>{
    const template={
      id:`template_${Date.now()}`,
      dayKey:dk,
      name,
      exerciseIds:allExercises(dk,customEx).map(ex=>ex.id),
      createdAt:new Date().toISOString(),
    };
    await saveAll(history,goals,{
      ...customEx,
      _templates:[...workoutTemplates(customEx),template],
    });
  };

  const handleApplyTemplate=async(dk,templateId)=>{
    const template=workoutTemplates(customEx).find(t=>t.id===templateId);
    if(!template) return;
    const keepIds=new Set(template.exerciseIds||[]);
    const baseRemoved=DAYS[dk].exercises.filter(ex=>!keepIds.has(ex.id)).map(ex=>ex.id);
    const nextRemoved={...(customEx._removed||{}),[dk]:baseRemoved};
    const nextCustomDay=(customEx[dk]||[]).map(ex=>({...ex,removed:!keepIds.has(ex.id)}));
    await saveAll(history,goals,{...customEx,_removed:nextRemoved,[dk]:nextCustomDay});
  };

  const handleDeleteTemplate=async(templateId)=>{
    await saveAll(history,goals,{
      ...customEx,
      _templates:workoutTemplates(customEx).filter(t=>t.id!==templateId),
    });
  };

  const handleToggleLike=async(week)=>{
    const social=socialState(customEx);
    const likes={...(social.likes||{})};
    if(likes[week]) delete likes[week];
    else likes[week]=true;
    await saveAll(history,goals,{...customEx,_social:{...social,likes}});
  };

  const handleRefreshPublic=()=>refreshPublicSharing(authUser?.user,authUser?.username,history,customEx,{sync:true});

  const reloadPublicCommunity=async()=>{
    if(!authUser?.user) return;
    const community=await loadPublicCommunity(authUser.user);
    applyPublicCommunity(community);
    setPublicError("");
    setPublicStatus("ready");
  };

  const handleTogglePublicSharing=async()=>{
    if(!authUser?.user) return;
    const nextShare=!publicProfile?.share_enabled;
    setPublicStatus("saving");
    try{
      const profile=await savePublicProfile(authUser.user,authUser.username,nextShare);
      setPublicProfile(profile);
      if(nextShare) await syncPublicWorkoutPosts(
        authUser.user,
        buildTrackingHistory(history,TRACKING_MODES.WEEKLY),
        customEx,
      );
      else await clearPublicWorkoutPosts(authUser.user);
      const community=await loadPublicCommunity(authUser.user);
      applyPublicCommunity(community);
      setPublicError("");
      setPublicStatus("ready");
    }catch(e){
      if(isMissingPublicSchemaError(e)){
        setPublicUnavailable();
      }else{
        setPublicStatus("error");
        setPublicError(e?.message||"Could not update public sharing.");
      }
    }
  };

  const handleTogglePublicLike=async(postId,liked)=>{
    if(!authUser?.user||!postId) return;
    try{
      if(liked){
        const {error}=await supabase.from("public_post_likes")
          .delete()
          .eq("post_id",postId)
          .eq("user_id",authUser.user.id);
        if(error) throw error;
      }else{
        const {error}=await supabase.from("public_post_likes")
          .insert({post_id:postId,user_id:authUser.user.id});
        if(error) throw error;
      }
      const community=await loadPublicCommunity(authUser.user);
      applyPublicCommunity(community);
      setPublicError("");
      setPublicStatus("ready");
    }catch(e){
      if(isMissingPublicSchemaError(e)){
        setPublicUnavailable();
      }else{
        setPublicStatus("error");
        setPublicError(e?.message||"Could not update the like.");
      }
    }
  };

  const handleTogglePublicFollow=async(followingId,isFollowing)=>{
    if(!authUser?.user||!followingId) return;
    setPublicStatus("saving");
    setPublicError("");
    try{
      await togglePublicFollow(authUser.user,followingId,isFollowing);
      if(!isFollowing){
        await createPublicNotification({
          userId:followingId,
          actorId:authUser.user.id,
          type:"follow",
        });
      }
      await reloadPublicCommunity();
    }catch(e){
      if(isMissingPublicSchemaError(e)){
        setPublicUnavailable();
      }else{
        console.error(e);
        setPublicError("Could not update follow. Try refreshing community.");
        setPublicStatus("ready");
      }
    }
  };

  const handleTogglePublicReaction=async(post,reactionId)=>{
    if(!authUser?.user||!post?.id) return;
    setPublicStatus("saving");
    setPublicError("");
    try{
      await togglePublicReaction(authUser.user,post,reactionId,publicEngagement.myReactions?.[post.id]);
      await reloadPublicCommunity();
    }catch(e){
      if(isMissingPublicSchemaError(e)){
        setPublicUnavailable();
      }else{
        console.error(e);
        setPublicError(e?.message||"Could not update reaction.");
        setPublicStatus("ready");
      }
    }
  };

  const handleSubmitPublicComment=async(post)=>{
    if(!authUser?.user||!post?.id) return;
    const body=commentDrafts[post.id]||"";
    setPublicStatus("saving");
    setPublicError("");
    try{
      await addPublicComment(authUser.user,post,body);
      setCommentDrafts(drafts=>({...drafts,[post.id]:""}));
      await reloadPublicCommunity();
    }catch(e){
      if(isMissingPublicSchemaError(e)){
        setPublicUnavailable();
      }else{
        console.error(e);
        setPublicError(e?.message||"Could not post comment.");
        setPublicStatus("ready");
      }
    }
  };

  const handleMarkNotificationsRead=async()=>{
    if(!authUser?.user) return;
    setPublicStatus("saving");
    try{
      await markPublicNotificationsRead(authUser.user);
      await reloadPublicCommunity();
    }catch(e){
      if(isMissingPublicSchemaError(e)){
        setPublicUnavailable();
      }else{
        console.error(e);
        setPublicError(e?.message||"Could not mark activity read.");
        setPublicStatus("ready");
      }
    }
  };

  const handleStartAdaptivePlan=async(plan)=>{
    const nextDraft=buildAdaptivePlanDraft(plan,draft);
    if(nextDraft) await handleSaveDraft(nextDraft);
    setView("log");
  };

  const handleSaveCoachProfile=async(profile)=>{
    const current=coachState(customEx);
    const nextProfile=normalizeCoachProfile({...profile,updatedAt:new Date().toISOString()});
    await saveAll(history,goals,withCoachState(customEx,{...current,profile:nextProfile}));
  };

  const handleGenerateCoachProgram=async(profileInput)=>{
    const current=coachState(customEx);
    const profile=normalizeCoachProfile(profileInput||current.profile);
    const programHistory=trackingMode===TRACKING_MODES.DAILY?weeklyHistory:progressHistory;
    const plan=buildSmartProgram(programHistory,customEx,goals,profile);
    await saveAll(history,goals,withCoachState(customEx,{profile,plan}));
  };

  const handleStartCoachPlanDay=async(planDay)=>{
    const nextDraft=buildCoachPlanDraft(planDay,draft);
    if(nextDraft) await handleSaveDraft(nextDraft);
    setView("log");
  };

  const handleStartProgramPackDay=async(planDay)=>{
    const nextDraft=buildCoachPlanDraft(planDay,draft);
    if(nextDraft) await handleSaveDraft(nextDraft);
    setView("log");
  };

  const handleStartLibraryWorkout=async(dayKey,ex)=>{
    const nextDraft=buildLibraryWorkoutDraft(dayKey,ex,draft);
    if(nextDraft) await handleSaveDraft(nextDraft);
    setView("log");
  };

  const handleStartPremiumPreview=()=>{
    setSubscription(createPreviewSubscription());
    setPricingOpen(false);
    setShowPostWorkoutUpgrade(false);
  };

  if(!authReady) return <LoadingScreen/>;
  if(!authUser) return <AuthScreen onAuthed={setAuthUser}/>;
  if(loadState==="loading") return <LoadingScreen/>;
  if(loadState==="failed")  return <LoadFailedScreen onRetry={bootstrap}/>;

  const streak=calcStreak(history,customEx);
  const accountContext={username:authUser.username};
  const advancedAnalyticsAccess=resolveFeatureAccess(
    FEATURE_IDS.ADVANCED_ANALYTICS,
    subscription,
    MONETIZATION_MODE,
    accountContext,
  );
  const programPacksAccess=resolveFeatureAccess(
    FEATURE_IDS.PROGRAM_PACKS,
    subscription,
    MONETIZATION_MODE,
    accountContext,
  );
  const recoveryIntegrationAccess=resolveFeatureAccess(
    FEATURE_IDS.RECOVERY_INTEGRATIONS,
    subscription,
    MONETIZATION_MODE,
    accountContext,
  );

  const tabs=[
    {id:"total",label:"Today"},
    {id:"log",label:"Train"},
    {id:"lifts",label:"Progress"},
    {id:"prs",label:"Records"},
    {id:"history",label:"History"},
    {id:"goals",label:"Goals"},
    {id:"library",label:"Library"},
    {id:"community",label:"Feed"},
  ];
  const dashboardMomentum=buildTrainingMomentumCoach(progressHistory,customEx);
  const fallbackDayKey=DAY_KEYS[progressHistory.length%DAY_KEYS.length];
  const dashboardDayKey=DAY_KEYS.includes(draft?.activeDay)
    ?draft.activeDay
    :dashboardMomentum?.nextWorkout?.dayKey||fallbackDayKey;
  const dashboardLatest=progressHistory[progressHistory.length-1]||null;
  const dashboardWeek=weeklyHistory[weeklyHistory.length-1]||null;
  const dashboardLatestVolume=dashboardLatest?getTotalVol(dashboardLatest,customEx):0;
  const dashboardWeekVolume=dashboardWeek?getTotalVol(dashboardWeek,customEx):0;
  const dashboardRecordCount=Object.keys(getAllTimePRs(progressHistory,customEx)).length;
  const dashboardGoalCount=Object.entries(goals||{})
    .filter(([key,value])=>key!=="weeklyVolume"&&Number(value)>0).length+(Number(goals?.weeklyVolume)>0?1:0);
  const dashboardExerciseCount=DAY_KEYS.reduce((sum,dayKey)=>sum+allExercises(dayKey,customEx).length,0);
  const workoutViewSignal=buildWorkoutViewSignal(view,{
    trackingMode,
    sessionCount:progressHistory.length,
    streak,
    latestVolume:dashboardLatestVolume,
    weekVolume:dashboardWeekVolume,
    weeklyGoal:goals?.weeklyVolume,
    draft,
    unreadCount:publicEngagement.unreadCount,
    recordCount:dashboardRecordCount,
    goalCount:dashboardGoalCount,
    exerciseCount:dashboardExerciseCount,
  });
  const navigateToView=nextView=>{
    if(!nextView||nextView===view) return;
    transitionView(()=>setView(nextView));
  };

  return(
    <div className="earned-app-shell">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      <MotionOrchestrator key={view} showProgress={false}/>
      <AppAsciiAtmosphere view={view} trackingMode={trackingMode} activity={progressHistory.length}/>
      <Confetti active={confetti}/>

      <PricingView open={pricingOpen} onClose={()=>setPricingOpen(false)}
        subscription={subscription} onStartPreview={handleStartPremiumPreview}/>

      <WorkoutCelebration
        open={!!workoutCelebration}
        workoutLabel={workoutCelebration?.workoutLabel}
        volume={workoutCelebration?.volume}
        streak={workoutCelebration?.streak}
        streakUnit={workoutCelebration?.streakUnit}
        isPR={!!workoutCelebration?.isPR}
        onClose={()=>setWorkoutCelebration(null)}
        onViewProgress={()=>{setWorkoutCelebration(null);navigateToView("total");}}
        onOpenFeed={()=>{setWorkoutCelebration(null);navigateToView("community");}}/>

      {goalModal&&(
        <GoalModal
          exId={goalModal.exId}
          exName={goalModal.exName}
          current={goals?.[goalModal.exId]}
          onSave={handleSetGoal}
          onClose={()=>setGoalModal(null)}/>
      )}

      {editWeekIndex!=null&&history[editWeekIndex]&&(
        <EditWeekModal
          entry={history[editWeekIndex]}
          index={editWeekIndex}
          customEx={customEx}
          onSave={handleEditWeek}
          onClose={()=>setEditWeekIndex(null)}/>
      )}

      <header className="earned-app-header">
        <div className="earned-app-header__top">
          <button className="earned-app-header__brand" type="button" onClick={()=>navigateToView("total")} aria-label="Open Earned Today">
            <img src="/lift-icon-192.png" alt=""/>
            <span>EARNED</span>
          </button>
          <div className="earned-app-header__account">
            <ConnectionStatus isOnline={isOnline} hasDraft={!!draft}/>
            <SyncStatus status={syncStatus} lastSaved={lastSavedLabel} onRetry={handleManualRetry}/>
            <button type="button" className="earned-app-header__premium" onClick={()=>setPricingOpen(true)}>
              {subscription.status==="preview"?"Premium Preview":"Premium"}
            </button>
            <span>@{authUser.username}</span>
            <button type="button" className="earned-app-header__logout" onClick={handleLogout} title="Log out" aria-label="Log out">↗</button>
          </div>
        </div>
        <div className="earned-app-header__mode">
          <div>
            <span>PROGRESSION MODE</span>
            <strong>{trackingMode===TRACKING_MODES.DAILY?"Daily":"Weekly"}</strong>
          </div>
          <TrackingModeControl mode={trackingMode} onChange={handleTrackingModeChange}/>
        </div>
      </header>

      <AppNavigation items={tabs} activeView={view}
        unreadCount={publicEngagement.unreadCount} onNavigate={navigateToView}/>

      <main id="earned-workout-view" role="tabpanel" aria-labelledby={`earned-tab-${view}`}
        className="earned-view-stage" key={`${view}-${trackingMode}`} data-view={view}>

      <ViewIdentityBar
        view={view}
        trackingMode={trackingMode}
        sessionCount={progressHistory.length}
        streak={streak}/>

      <WorkoutEcosystemRail signal={workoutViewSignal}
        onNavigate={navigateToView} onOpenPremium={()=>setPricingOpen(true)}/>

      <div className={`earned-page earned-page--${view}`}>

      {/* Unsaved draft banner, shown outside the Log tab so it's never missed */}
      {draft&&view!=="log"&&(
        <section aria-label="Unfinished workout" style={{background:"#1a1208",border:"1px solid #2a2010",
          borderRadius:6,padding:"11px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",
          alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:"#FFB347",fontWeight:700}}>
            ⏱ You have an unfinished workout log — tap to continue
          </span>
          <span style={{fontSize:14,color:"#FFB347"}}>→</span>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button type="button" onClick={()=>navigateToView("log")} style={{border:"1px solid #FFB347",
              background:"#FFB347",color:"#111",borderRadius:4,padding:"7px 10px",fontSize:10,fontWeight:800,cursor:"pointer"}}>
              Resume workout
            </button>
            <button type="button" onClick={async()=>{
              if(confirm("Discard this unfinished workout? Saved workout history will stay unchanged.")) await handleClearDraft();
            }} style={{border:"1px solid #5a4630",background:"transparent",color:"#f4d9ac",borderRadius:4,padding:"7px 10px",fontSize:10,fontWeight:700,cursor:"pointer"}}>
              Discard draft
            </button>
          </div>
        </section>
      )}

      {showPostWorkoutUpgrade&&view==="total"&&subscription.status==="free"&&(
        <UpgradePrompt
          title="Turn this workout into next-session guidance"
          description="See fatigue, recovery, and training-quality signals while Premium Preview is included."
          onUpgrade={()=>setPricingOpen(true)}
          onDismiss={()=>setShowPostWorkoutUpgrade(false)}/>
      )}

      {view==="total"&&(
        <DashboardCommandCenter
          trackingLabel={trackingMode===TRACKING_MODES.DAILY?"DAILY":"WEEKLY"}
          nextWorkoutLabel={DAYS[dashboardDayKey]?.label||"Your workout"}
          hasDraft={!!draft}
          streak={streak}
          streakUnit={trackingMode===TRACKING_MODES.DAILY?"days":"weeks"}
          latestVolume={dashboardLatestVolume}
          weekVolume={dashboardWeekVolume}
          weeklyGoal={goals?.weeklyVolume}
          sessionsTracked={progressHistory.length}
          history={progressHistory}
          username={authUser.username}
          avatarStyle={preferences.asciiAvatarStyle}
          onAvatarStyleChange={handleAsciiAvatarStyleChange}
          onStartWorkout={()=>navigateToView("log")}
          onOpenGoals={()=>navigateToView("goals")}/>
      )}

      {view==="lifts"&&(
        <SummaryStrip history={progressHistory} weeklyHistory={weeklyHistory} trackingMode={trackingMode}
          goals={goals} customEx={customEx}/>
      )}

      {view==="total"   &&<TotalVolumeView history={progressHistory} weeklyHistory={weeklyHistory}
        trackingMode={trackingMode} goals={goals} customEx={customEx}
        onStartAdaptivePlan={handleStartAdaptivePlan}
        onSaveCoachProfile={handleSaveCoachProfile}
        onGenerateCoachProgram={handleGenerateCoachProgram}
        onStartCoachPlanDay={handleStartCoachPlanDay}
        advancedAnalyticsAccess={advancedAnalyticsAccess}
        onUpgrade={()=>setPricingOpen(true)}
        onNavigate={navigateToView}
        hasDraft={!!draft}/>}
      {view==="lifts"   &&(
        <div className="earned-workout-view earned-workout-view--progress">
          {DAY_KEYS.map(dk=>(
            <DaySection key={dk} dayKey={dk} history={progressHistory} goals={goals} customEx={customEx}
              onSetGoal={(id,name)=>setGoalModal({exId:id,exName:name})}
              onDeleteCustom={(exId)=>{
                if(confirm("Remove this exercise from your routine? Past logged data will be kept in history."))
                  handleRemoveExercise(dk,exId);
              }}/>
          ))}
        </div>
      )}
      {view==="prs"     &&<PRWall history={progressHistory} customEx={customEx}/>}
      {view==="library" &&<ExerciseLibraryView history={progressHistory} customEx={customEx}
        onStartLibraryWorkout={handleStartLibraryWorkout}
        onStartProgramPackDay={handleStartProgramPackDay}
        onSaveExerciseNote={handleSaveExerciseNote}
        programPacksAccess={programPacksAccess}
        onUpgrade={()=>setPricingOpen(true)}/>}
      {view==="community"&&<CommunityView history={weeklyHistory} customEx={customEx}
        username={authUser.username} onToggleLike={handleToggleLike}
        publicProfile={publicProfile} publicPosts={publicPosts}
        publicLikes={publicLikes} publicProfiles={publicProfiles}
        publicFollows={publicFollows} publicSocialGraph={publicSocialGraph}
        publicEngagement={publicEngagement}
        commentDrafts={commentDrafts}
        publicStatus={publicStatus} publicError={publicError}
        feedScope={feedScope} onFeedScopeChange={setFeedScope}
        currentUserId={authUser.user.id}
        onTogglePublicSharing={handleTogglePublicSharing}
        onTogglePublicLike={handleTogglePublicLike}
        onTogglePublicFollow={handleTogglePublicFollow}
        onCommentDraftChange={setCommentDrafts}
        onTogglePublicReaction={handleTogglePublicReaction}
        onSubmitPublicComment={handleSubmitPublicComment}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        onRefreshPublic={handleRefreshPublic}/>}
      {view==="history" &&<HistoryView history={progressHistory} trackingMode={trackingMode}
        onDelete={handleDelete} onEdit={setEditWeekIndex} customEx={customEx}/>}
      {view==="log"     &&<LogForm key={trackingMode} history={progressHistory} trackingMode={trackingMode}
        onSubmit={handleNewPeriod} customEx={customEx}
        persistedCoachContext={persistedCoachContext}
        onAddExercise={handleAddExercise} onRemoveExercise={handleRemoveExercise}
        onRestoreExercise={handleRestoreExercise}
        onSaveExerciseNote={handleSaveExerciseNote}
        onSaveTemplate={handleSaveTemplate} onApplyTemplate={handleApplyTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        initialDraft={draft} saveDraft={handleSaveDraft} onDraftCleared={handleClearDraft}/>}
      {view==="goals"   &&(
        <>
          <GoalsView history={progressHistory} weeklyHistory={weeklyHistory} trackingMode={trackingMode}
            goals={goals} onSetGoal={(id,name)=>setGoalModal({exId:id,exName:name})}
            onSetWeeklyGoal={handleSetWeeklyGoal} customEx={customEx}
            onSaveBodyMetric={handleSaveBodyMetric}
            onDeleteBodyMetric={handleDeleteBodyMetric}/>
          <PremiumGate access={recoveryIntegrationAccess}
            title="Recovery-aware recommendations"
            description="Prepare workouts around optional sleep, HRV, heart-rate, and readiness inputs."
            onUpgrade={()=>setPricingOpen(true)} previewLabel="Future Premium Integration">
            <RecoveryIntegrationPreview onUpgrade={()=>setPricingOpen(true)}/>
          </PremiumGate>
          <DataSafetyCenter history={history} goals={goals} customEx={customEx}
            preferences={preferences} onImportPreferences={setPreferences} onImport={handleImport}/>
          <div style={{textAlign:"center",marginTop:8}}>
            <button onClick={handleReset} style={{background:"none",border:"1px solid #1a1a2a",
              color:"#46514b",borderRadius:8,padding:"7px 16px",fontSize:10,cursor:"pointer"}}>
              Reset workout history to zero
            </button>
          </div>
        </>
      )}
      </div>
      </main>
    </div>
  );
}

