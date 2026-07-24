const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(root,"src","App.jsx"),"utf8");
const tracking=fs.readFileSync(path.join(root,"src","tracking","trackingPeriods.js"),"utf8");
const readme=fs.readFileSync(path.join(root,"README.md"),"utf8");

const requiredTracking=[
  "export const TRACKING_MODES",
  "export const PERIOD_TYPES",
  "export function normalizeTrackingMode",
  "export function buildDailyHistory",
  "export function buildWeeklyHistory",
  "export function buildTrackingHistory",
  "export function getEntryPeriodLabel",
  "export function calculateDailyStreak",
  "export function combineHistoryEntries",
  "export function getComparableHistory",
];

const requiredApp=[
  "from \"./tracking/trackingPeriods.js\"",
  "function normalizePreferences(raw={})",
  "trackingMode:normalizeTrackingMode(raw?.trackingMode)",
  "const [preferences,setPreferences]",
  "const trackingMode=normalizeTrackingMode(preferences?.trackingMode)",
  "preferences:normalizePreferences(parsed.preferences)",
  "preferences:normalizePreferences({})",
  "data:{history:nextHistory,goals:nextGoals,customEx:nextCustomEx,preferences:nextPreferences}",
  "JSON.stringify({history:nextHistory,goals:nextGoals,customEx:nextCustomEx,preferences:normalizedPreferences})",
  "const exerciseDayMap=useMemo",
  "const dailyHistory=useMemo",
  "buildTrackingHistory(history,TRACKING_MODES.DAILY,exerciseDayMap,DAY_KEYS)",
  "const weeklyHistory=useMemo",
  "buildTrackingHistory(history,TRACKING_MODES.WEEKLY,exerciseDayMap,DAY_KEYS)",
  "const progressHistory=trackingMode===TRACKING_MODES.DAILY?dailyHistory:weeklyHistory",
  "function TrackingModeControl({mode,onChange})",
  "aria-pressed={mode===option.id}",
  "const handleTrackingModeChange=async mode=>",
  "trackingMode:normalizeTrackingMode(mode)",
  "<TrackingModeControl mode={trackingMode} onChange={handleTrackingModeChange}/>",
  "function LogForm({history,trackingMode,onSubmit",
  "const isDaily=trackingMode===TRACKING_MODES.DAILY",
  "const saveDayKeys=isDaily?[activeDay]:DAY_KEYS",
  "periodType:isDaily?PERIOD_TYPES.DAY:PERIOD_TYPES.WEEK",
  "dayKey:isDaily?activeDay:undefined",
  "Save Today's Workout",
  "Save Week",
  "const handleNewPeriod=async payload=>",
  "periodId:payload.periodId||",
  "periodType,",
  "dayKey,",
  "<SummaryStrip history={progressHistory}",
  "<TotalVolumeView history={progressHistory}",
  "<DaySection key={dk} dayKey={dk} history={progressHistory}",
  "<PRWall history={progressHistory}",
  "<HistoryView history={progressHistory}",
  "<LogForm key={trackingMode} history={progressHistory} trackingMode={trackingMode}",
  "<CommunityView history={weeklyHistory}",
  "syncPublicWorkoutPosts(user,buildTrackingHistory(nextHistory,TRACKING_MODES.WEEKLY",
  "function BalanceRadar({history,goals,customEx,trackingMode,weeklyHistory})",
  "trackingMode===TRACKING_MODES.DAILY",
  "calculateDailyStreak(history)",
  "preferences:normalizePreferences(preferences)",
  "onImportPreferences",
  "getComparableHistory(history.slice(0,index),entry)",
  "getLastLiftForExercise(history,ex.id)",
  "const dayHistory=history.filter(entry=>getDayVol(entry,dk,customEx)>0)",
  "const loggedHistory=history.filter(entry=>entry?.exercises?.[ex.id]?.volume>0)",
  "const comparableHistory=getComparableHistory(history,latest)",
  "const streakUnit=isDailyHistory?\"day\":\"week\"",
  "const previousBestHistory=periodType===PERIOD_TYPES.DAY",
];

const requiredReadme=[
  "Daily or Weekly Tracking",
  "account-scoped",
  "does not rewrite existing history",
  "calendar-week rollups",
];

const failures=[];
for(const fragment of requiredTracking){
  if(!tracking.includes(fragment)) failures.push(`trackingPeriods.js missing: ${fragment}`);
}
for(const fragment of requiredApp){
  if(!app.includes(fragment)) failures.push(`src/App.jsx missing: ${fragment}`);
}
for(const fragment of requiredReadme){
  if(!readme.includes(fragment)) failures.push(`README.md missing: ${fragment}`);
}

if(failures.length){
  console.error("Daily/Weekly tracking integration verification failed:");
  failures.forEach(item=>console.error(`- ${item}`));
  process.exit(1);
}

console.log("Daily/Weekly tracking integration verification passed.");
