export const TRACKING_MODES=Object.freeze({
  WEEKLY:"weekly",
  DAILY:"daily",
});

export const PERIOD_TYPES=Object.freeze({
  WEEK:"week",
  DAY:"day",
});

export function normalizeTrackingMode(value){
  return value===TRACKING_MODES.DAILY?TRACKING_MODES.DAILY:TRACKING_MODES.WEEKLY;
}

function positiveNumber(value){
  const parsed=Number(value);
  return Number.isFinite(parsed)&&parsed>0?parsed:0;
}

function parseDateKey(value){
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||""));
  if(!match) return null;
  const year=Number(match[1]);
  const month=Number(match[2]);
  const day=Number(match[3]);
  const date=new Date(Date.UTC(year,month-1,day));
  if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day) return null;
  return date;
}

function formatDateKey(date){
  return date.toISOString().slice(0,10);
}

export function getCalendarWeekStart(value){
  const date=parseDateKey(value);
  if(!date) return null;
  const day=date.getUTCDay();
  const offset=day===0?-6:1-day;
  date.setUTCDate(date.getUTCDate()+offset);
  return formatDateKey(date);
}

function entryType(entry){
  return entry?.periodType===PERIOD_TYPES.DAY||entry?.periodType===TRACKING_MODES.DAILY
    ? PERIOD_TYPES.DAY
    : PERIOD_TYPES.WEEK;
}

function cloneSetDetails(value){
  return Array.isArray(value)?value.map(row=>({...row})):[];
}

function cloneLift(lift={}){
  return {...lift,setDetails:cloneSetDetails(lift.setDetails)};
}

function liftScore(lift={}){
  const weight=positiveNumber(lift.w);
  const reps=positiveNumber(lift.r);
  return reps===1?weight:weight*(1+(reps/30));
}

function mergeLift(previous,next){
  if(!previous) return cloneLift(next);
  const strongest=liftScore(next)>liftScore(previous)?next:previous;
  const previousSets=positiveNumber(previous.s);
  const nextSets=positiveNumber(next.s);
  const setDetails=[...cloneSetDetails(previous.setDetails),...cloneSetDetails(next.setDetails)];
  return {
    ...cloneLift(strongest),
    volume:positiveNumber(previous.volume)+positiveNumber(next.volume),
    w:positiveNumber(strongest.w),
    r:positiveNumber(strongest.r),
    s:previousSets+nextSets,
    setDetails,
  };
}

function average(values){
  const valid=values.map(Number).filter(Number.isFinite);
  if(!valid.length) return undefined;
  const value=valid.reduce((sum,item)=>sum+item,0)/valid.length;
  return Math.round(value*10)/10;
}

function combineReadiness(entries){
  const rows=entries.map(entry=>entry?.readiness).filter(value=>value&&typeof value==="object");
  if(!rows.length) return undefined;
  const result={};
  for(const key of ["sleep","energy","soreness"]){
    const value=average(rows.map(row=>row[key]));
    if(value!==undefined) result[key]=value;
  }
  return Object.keys(result).length?result:undefined;
}

function collectSourceIndexes(entries,metadata={}){
  const supplied=Array.isArray(metadata.sourceIndexes)?metadata.sourceIndexes:[];
  const inferred=entries.flatMap(entry=>Array.isArray(entry?.sourceIndexes)
    ? entry.sourceIndexes
    : Number.isInteger(entry?.sourceIndex)?[entry.sourceIndex]:[]);
  return [...new Set([...supplied,...inferred])].sort((a,b)=>a-b);
}

export function combineHistoryEntries(entriesInput,metadata={}){
  const entries=Array.isArray(entriesInput)?entriesInput.filter(Boolean):[];
  const exercises={};
  for(const entry of entries){
    for(const [exerciseId,lift] of Object.entries(entry?.exercises||{})){
      if(positiveNumber(lift?.volume)<=0) continue;
      exercises[exerciseId]=mergeLift(exercises[exerciseId],lift);
    }
  }

  const notes=[...new Set(entries.map(entry=>String(entry?.notes||"").trim()).filter(Boolean))];
  const rating=average(entries.map(entry=>entry?.rating));
  const rpe=average(entries.map(entry=>entry?.rpe));
  const readiness=combineReadiness(entries);
  const sourceIndexes=collectSourceIndexes(entries,metadata);
  const result={
    ...metadata,
    exercises,
    sourceIndexes,
  };
  if(notes.length) result.notes=notes.join(" | ").slice(0,500);
  if(rating!==undefined) result.rating=rating;
  if(rpe!==undefined) result.rpe=rpe;
  if(readiness) result.readiness=readiness;
  if(entries.length&&entries.every(entry=>entry?.deload)) result.deload=true;
  return result;
}

function loggedExercises(entry){
  return Object.fromEntries(Object.entries(entry?.exercises||{})
    .filter(([,lift])=>positiveNumber(lift?.volume)>0)
    .map(([id,lift])=>[id,cloneLift(lift)]));
}

function inferDayKey(entry,exerciseDayMap,dayOrder){
  if(dayOrder.includes(entry?.dayKey)) return entry.dayKey;
  for(const exerciseId of Object.keys(entry?.exercises||{})){
    const mapped=exerciseDayMap?.[exerciseId];
    if(dayOrder.includes(mapped)) return mapped;
  }
  return dayOrder[0]||"workout";
}

export function buildDailyHistory(historyInput,exerciseDayMap={},dayOrder=[]){
  const history=Array.isArray(historyInput)?historyInput:[];
  const rows=[];

  history.forEach((entry,sourceIndex)=>{
    if(entryType(entry)===PERIOD_TYPES.DAY){
      const exercises=loggedExercises(entry);
      if(!Object.keys(exercises).length) return;
      const dayKey=inferDayKey(entry,exerciseDayMap,dayOrder);
      rows.push({
        ...entry,
        exercises,
        periodType:PERIOD_TYPES.DAY,
        dayKey,
        periodId:entry.periodId||`day-${entry.date||"undated"}-${sourceIndex}`,
        sourceIndex,
        sourceIndexes:[sourceIndex],
        sourcePeriodType:PERIOD_TYPES.DAY,
        derived:false,
      });
      return;
    }

    for(const dayKey of dayOrder){
      const exercises=Object.fromEntries(Object.entries(entry?.exercises||{})
        .filter(([exerciseId,lift])=>exerciseDayMap?.[exerciseId]===dayKey&&positiveNumber(lift?.volume)>0)
        .map(([id,lift])=>[id,cloneLift(lift)]));
      if(!Object.keys(exercises).length) continue;
      rows.push({
        ...entry,
        exercises,
        periodType:PERIOD_TYPES.DAY,
        dayKey,
        periodId:`legacy-day-${entry.periodId||entry.week||sourceIndex+1}-${dayKey}`,
        sourceIndex,
        sourceIndexes:[sourceIndex],
        sourcePeriodType:PERIOD_TYPES.WEEK,
        derived:true,
      });
    }
  });

  return rows.map((entry,index)=>({...entry,week:index+1,periodNumber:index+1}));
}

function dailyWeekBucket(entry,sourceIndex){
  const weekStart=getCalendarWeekStart(entry?.date);
  return weekStart?`calendar-${weekStart}`:`undated-${sourceIndex}`;
}

export function buildWeeklyHistory(historyInput){
  const history=Array.isArray(historyInput)?historyInput:[];
  const units=[];
  const buckets=new Map();

  history.forEach((entry,sourceIndex)=>{
    if(entryType(entry)!==PERIOD_TYPES.DAY){
      units.push({
        firstIndex:sourceIndex,
        lastIndex:sourceIndex,
        entries:[{...entry,sourceIndex,sourceIndexes:[sourceIndex]}],
        metadata:{
          periodType:PERIOD_TYPES.WEEK,
          periodId:entry.periodId||`week-${entry.week||sourceIndex+1}`,
          date:entry.date,
          sourceIndex,
          sourceIndexes:[sourceIndex],
          sourcePeriodType:PERIOD_TYPES.WEEK,
          derived:false,
          aggregate:false,
          latestDate:entry.date,
        },
      });
      return;
    }

    const key=dailyWeekBucket(entry,sourceIndex);
    if(!buckets.has(key)){
      const weekStart=getCalendarWeekStart(entry?.date);
      const bucket={
        firstIndex:sourceIndex,
        lastIndex:sourceIndex,
        entries:[],
        sourceIndexes:[],
        dayKeys:[],
        periodId:`week-${weekStart||`undated-${sourceIndex}`}`,
        date:weekStart||entry?.date,
        latestDate:entry?.date,
      };
      buckets.set(key,bucket);
      units.push(bucket);
    }
    const bucket=buckets.get(key);
    bucket.entries.push({...entry,sourceIndex,sourceIndexes:[sourceIndex]});
    bucket.sourceIndexes.push(sourceIndex);
    bucket.lastIndex=sourceIndex;
    bucket.latestDate=entry?.date||bucket.latestDate;
    if(entry?.dayKey&&!bucket.dayKeys.includes(entry.dayKey)) bucket.dayKeys.push(entry.dayKey);
  });

  units.sort((a,b)=>(a.lastIndex??a.firstIndex)-(b.lastIndex??b.firstIndex));
  return units.map((unit,index)=>{
    const isDailyBucket=Array.isArray(unit.sourceIndexes);
    const metadata=isDailyBucket?{
      periodType:PERIOD_TYPES.WEEK,
      periodId:unit.periodId,
      date:unit.date,
      sourceIndexes:unit.sourceIndexes,
      sourcePeriodType:PERIOD_TYPES.DAY,
      derived:true,
      aggregate:true,
      dayKeys:unit.dayKeys,
      latestDate:unit.latestDate,
    }:unit.metadata;
    return {
      ...combineHistoryEntries(unit.entries,metadata),
      week:index+1,
      periodNumber:index+1,
    };
  });
}

export function buildTrackingHistory(history,mode,exerciseDayMap={},dayOrder=[]){
  return normalizeTrackingMode(mode)===TRACKING_MODES.DAILY
    ? buildDailyHistory(history,exerciseDayMap,dayOrder)
    : buildWeeklyHistory(history);
}

export function getComparableHistory(historyInput,targetEntry){
  const history=Array.isArray(historyInput)?historyInput:[];
  const target=targetEntry||history[history.length-1];
  if(!target) return [];
  const targetType=entryType(target);
  if(targetType===PERIOD_TYPES.DAY){
    return history.filter(entry=>entryType(entry)===PERIOD_TYPES.DAY&&entry?.dayKey===target?.dayKey);
  }
  return history.filter(entry=>entryType(entry)===PERIOD_TYPES.WEEK);
}

export function getEntryPeriodLabel(entry,index=0,options={}){
  const number=Number(entry?.periodNumber)||index+1;
  if(entryType(entry)===PERIOD_TYPES.DAY){
    const dayLabel=options?.dayLabels?.[entry?.dayKey]||entry?.dayLabel||entry?.dayKey;
    return `Day ${number}${dayLabel?` - ${dayLabel}`:""}`;
  }
  return `Week ${number}`;
}

export function getEntryShortLabel(entry,index=0){
  const number=Number(entry?.periodNumber)||index+1;
  return `${entryType(entry)===PERIOD_TYPES.DAY?"D":"W"}${number}`;
}

export function calculateDailyStreak(historyInput){
  const dateKeys=[...new Set((Array.isArray(historyInput)?historyInput:[])
    .map(entry=>parseDateKey(entry?.date))
    .filter(Boolean)
    .map(formatDateKey))]
    .sort();
  if(!dateKeys.length) return 0;
  let streak=1;
  for(let index=dateKeys.length-1;index>0;index--){
    const current=parseDateKey(dateKeys[index]);
    const previous=parseDateKey(dateKeys[index-1]);
    const difference=Math.round((current-previous)/86400000);
    if(difference!==1) break;
    streak++;
  }
  return streak;
}
