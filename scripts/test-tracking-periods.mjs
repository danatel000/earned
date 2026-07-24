import assert from "node:assert/strict";
import {
  TRACKING_MODES,
  PERIOD_TYPES,
  normalizeTrackingMode,
  buildDailyHistory,
  buildWeeklyHistory,
  buildTrackingHistory,
  getEntryPeriodLabel,
  getEntryShortLabel,
  calculateDailyStreak,
  combineHistoryEntries,
  getComparableHistory,
} from "../src/tracking/trackingPeriods.js";

assert.equal(normalizeTrackingMode("daily"),TRACKING_MODES.DAILY);
assert.equal(normalizeTrackingMode("weekly"),TRACKING_MODES.WEEKLY);
assert.equal(normalizeTrackingMode("invalid"),TRACKING_MODES.WEEKLY);
assert.equal(normalizeTrackingMode(null),TRACKING_MODES.WEEKLY);

const exerciseDayMap={
  curl:"arms",
  press:"arms",
  bench:"chest",
  row:"chest",
  squat:"legs",
};
const dayOrder=["arms","chest","legs"];

const legacyHistory=[{
  week:1,
  date:"2026-07-01",
  notes:"Strong start",
  exercises:{
    curl:{volume:100,w:10,r:10,s:1},
    bench:{volume:200,w:20,r:10,s:1},
    squat:{volume:300,w:30,r:10,s:1},
  },
}];

const splitDaily=buildDailyHistory(legacyHistory,exerciseDayMap,dayOrder);
assert.equal(splitDaily.length,3);
assert.deepEqual(splitDaily.map(row=>row.dayKey),dayOrder);
assert.deepEqual(splitDaily.map(row=>Object.keys(row.exercises)),[["curl"],["bench"],["squat"]]);
assert.deepEqual(splitDaily.map(row=>row.sourceIndex),[0,0,0]);
assert.ok(splitDaily.every(row=>row.periodType===PERIOD_TYPES.DAY));
assert.ok(splitDaily.every(row=>row.sourcePeriodType===PERIOD_TYPES.WEEK));
assert.ok(splitDaily.every(row=>row.derived===true));
assert.deepEqual(legacyHistory[0].exercises.squat,{volume:300,w:30,r:10,s:1});

const canonicalDaily=[
  {
    week:1,
    periodType:"day",
    periodId:"day-a",
    dayKey:"arms",
    date:"2026-07-06",
    rating:4,
    rpe:7,
    readiness:{sleep:4,energy:3,soreness:2},
    exercises:{curl:{volume:100,w:10,r:10,s:1,setDetails:[{w:10,r:10}]}}
  },
  {
    week:2,
    periodType:"day",
    periodId:"day-b",
    dayKey:"arms",
    date:"2026-07-08",
    rating:5,
    rpe:8,
    readiness:{sleep:5,energy:4,soreness:3},
    exercises:{curl:{volume:180,w:15,r:12,s:1,setDetails:[{w:15,r:12}]}}
  },
  {
    week:3,
    periodType:"day",
    periodId:"day-c",
    dayKey:"legs",
    date:"2026-07-13",
    exercises:{squat:{volume:400,w:40,r:10,s:1}}
  },
];

const dailyPassthrough=buildDailyHistory(canonicalDaily,exerciseDayMap,dayOrder);
assert.equal(dailyPassthrough.length,3);
assert.equal(dailyPassthrough[0].periodId,"day-a");
assert.equal(dailyPassthrough[0].sourceIndex,0);
assert.equal(dailyPassthrough[0].derived,false);

const rolledWeekly=buildWeeklyHistory(canonicalDaily);
assert.equal(rolledWeekly.length,2);
assert.equal(rolledWeekly[0].periodType,PERIOD_TYPES.WEEK);
assert.equal(rolledWeekly[0].exercises.curl.volume,280);
assert.equal(rolledWeekly[0].exercises.curl.w,15);
assert.equal(rolledWeekly[0].exercises.curl.s,2);
assert.equal(rolledWeekly[0].exercises.curl.setDetails.length,2);
assert.deepEqual(rolledWeekly[0].sourceIndexes,[0,1]);
assert.equal(rolledWeekly[0].rating,4.5);
assert.equal(rolledWeekly[0].rpe,7.5);
assert.deepEqual(rolledWeekly[0].readiness,{sleep:4.5,energy:3.5,soreness:2.5});
assert.equal(rolledWeekly[1].week,2);
assert.deepEqual(rolledWeekly[1].sourceIndexes,[2]);

const mixedHistory=[legacyHistory[0],...canonicalDaily];
const mixedWeekly=buildTrackingHistory(mixedHistory,"weekly",exerciseDayMap,dayOrder);
assert.equal(mixedWeekly.length,3);
assert.equal(mixedWeekly[0].sourcePeriodType,PERIOD_TYPES.WEEK);
assert.deepEqual(mixedWeekly[0].sourceIndexes,[0]);
assert.deepEqual(mixedWeekly[1].sourceIndexes,[1,2]);
assert.deepEqual(mixedWeekly[2].sourceIndexes,[3]);

const mixedDaily=buildTrackingHistory(mixedHistory,"daily",exerciseDayMap,dayOrder);
assert.equal(mixedDaily.length,6);
assert.equal(getEntryPeriodLabel(mixedDaily[0],0,{dayLabels:{arms:"Arms"}}),"Day 1 - Arms");
assert.equal(getEntryShortLabel(mixedDaily[0],0),"D1");
assert.equal(getEntryPeriodLabel(mixedWeekly[0],0),"Week 1");
assert.equal(getEntryShortLabel(mixedWeekly[0],0),"W1");

const alternatingModes=[
  {periodType:"day",dayKey:"arms",date:"2026-07-06",exercises:{curl:{volume:100,w:10,r:10,s:1}}},
  {periodType:"week",date:"2026-07-08",exercises:{bench:{volume:200,w:20,r:10,s:1}}},
  {periodType:"day",dayKey:"legs",date:"2026-07-09",exercises:{squat:{volume:300,w:30,r:10,s:1}}},
];
const alternatingWeekly=buildWeeklyHistory(alternatingModes);
assert.deepEqual(alternatingWeekly.map(entry=>entry.sourceIndexes),[[1],[0,2]]);
assert.equal(alternatingWeekly[1].latestDate,"2026-07-09");

assert.equal(calculateDailyStreak([
  {periodType:"day",date:"2026-07-15"},
  {periodType:"day",date:"2026-07-16"},
  {periodType:"day",date:"2026-07-16"},
  {periodType:"day",date:"2026-07-17"},
]),3);
assert.equal(calculateDailyStreak([
  {periodType:"day",date:"2026-07-14"},
  {periodType:"day",date:"2026-07-16"},
]),1);
assert.equal(calculateDailyStreak([]),0);

const interleavedDaily=[
  {periodType:"day",dayKey:"arms",date:"2026-07-14"},
  {periodType:"day",dayKey:"chest",date:"2026-07-15"},
  {periodType:"day",dayKey:"legs",date:"2026-07-16"},
  {periodType:"day",dayKey:"arms",date:"2026-07-17"},
];
assert.deepEqual(
  getComparableHistory(interleavedDaily,interleavedDaily[3]).map(entry=>entry.date),
  ["2026-07-14","2026-07-17"],
);
assert.deepEqual(
  getComparableHistory(mixedWeekly,mixedWeekly[2]).map(entry=>entry.periodType),
  [PERIOD_TYPES.WEEK,PERIOD_TYPES.WEEK,PERIOD_TYPES.WEEK],
);

const combined=combineHistoryEntries(canonicalDaily.slice(0,2),{
  periodType:"week",
  periodId:"week-2026-07-06",
  date:"2026-07-06",
  sourceIndexes:[0,1],
});
assert.equal(combined.exercises.curl.volume,280);
assert.equal(combined.exercises.curl.w,15);
assert.equal(combined.periodId,"week-2026-07-06");

console.log("Tracking period model tests passed.");
