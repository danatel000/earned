# Smart Program Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a private Smart Program Builder / Coach Setup that generates explainable weekly lifting programs from the user's schedule, equipment, goals, history, fatigue, and weak muscle groups.

**Architecture:** Keep the feature in the existing React/Vite app structure. Store the coach profile and generated plan under `customEx._coach`, so it travels through the existing local/Supabase sync path without adding a new table. Add deterministic helper functions, one dashboard card, Log draft integration, and verifier coverage.

**Tech Stack:** React, Vite, Supabase-backed existing `lift_tracker_data`, plain Node verifier scripts, inline styles matching the current app.

## Global Constraints

- No paid subscription gate yet.
- No OpenAI, wearable, Apple Health, Google Fit, or smart-equipment integrations in this step.
- No medical or injury diagnosis.
- No automatic deletion or replacement of workout history.
- No nutrition tracking.
- No calendar push notifications.
- No trainer marketplace.
- Store coach data inside `customEx._coach`; do not create a new Supabase table.
- Coach preferences and generated plans are private and must not be written to public sharing tables.
- Generated plans must not alter workout history until the user logs a workout.

---

## File Structure

- Create `scripts/verify-smart-program-builder-app.cjs`: app-fragment verifier for Coach Setup, program generation, and Log integration.
- Modify `src/App.jsx`: add coach constants/helpers, `CoachProgramBuilder`, save/generate/start handlers, `TotalVolumeView` props, and Log draft banner integration.
- Modify `README.md`: document the private Smart Program Builder.
- Regenerate `dist` and `lift-tracker-dist.zip` after verification.

---

### Task 1: Add Failing Smart Program Verifier

**Files:**
- Create: `scripts/verify-smart-program-builder-app.cjs`

**Interfaces:**
- Produces verifier command: `node scripts/verify-smart-program-builder-app.cjs`
- Later tasks must satisfy the exact fragment strings listed below.

- [ ] **Step 1: Create verifier script**

Create `scripts/verify-smart-program-builder-app.cjs`:

```js
const fs = require("fs");
const path = require("path");

const appPath = path.join(__dirname, "..", "src", "App.jsx");
const app = fs.readFileSync(appPath, "utf8");

const required = [
  "const COACH_GOALS",
  "function defaultCoachProfile",
  "function normalizeCoachProfile",
  "function coachState",
  "function withCoachState",
  "function buildSmartProgram",
  "function buildCoachPlanDraft",
  "function CoachProgramBuilder",
  "Coach Setup",
  "Generate Program",
  "Start Workout",
  "onSaveCoachProfile",
  "onGenerateCoachProgram",
  "onStartCoachPlanDay",
  "coachPlan",
  "Smart Program Builder",
];

const missing = required.filter(fragment => !app.includes(fragment));

if (missing.length) {
  console.error("Missing smart program builder app fragments:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Smart program builder app fragments verified.");
```

- [ ] **Step 2: Run verifier and confirm it fails**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-smart-program-builder-app.cjs
```

Expected: non-zero exit with missing Smart Program Builder fragments.

---

### Task 2: Add Coach Data And Program Helpers

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces constant: `COACH_GOALS`
- Produces constant: `COACH_EXPERIENCE`
- Produces constant: `COACH_SPLITS`
- Produces constant: `COACH_INTENSITIES`
- Produces helper: `defaultCoachProfile()`
- Produces helper: `normalizeCoachProfile(profile)`
- Produces helper: `coachState(customEx)`
- Produces helper: `withCoachState(customEx, nextCoach)`
- Produces helper: `buildSmartProgram(history, customEx, goals, profileInput)`
- Produces helper: `buildCoachPlanDraft(planDay, currentDraft)`

- [ ] **Step 1: Insert coach constants and profile helpers**

Add this block after `buildAdaptivePlanDraft` and before `buildWorkoutRecap`:

```js
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
  return {
    ...base,
    ...profile,
    goal:allowed(COACH_GOALS,profile.goal,base.goal),
    experience:allowed(COACH_EXPERIENCE,profile.experience,base.experience),
    daysPerWeek:days,
    sessionLength:minutes,
    equipment:Object.fromEntries(COACH_EQUIPMENT.map(item=>[item.id,!!equipment[item.id]])),
    splitPreference:allowed(COACH_SPLITS,profile.splitPreference,base.splitPreference),
    intensityPreference:allowed(COACH_INTENSITIES,profile.intensityPreference,base.intensityPreference),
    weakMuscleBias:profile.weakMuscleBias!==false,
    updatedAt:profile.updatedAt||base.updatedAt,
  };
}

function coachState(customEx={}){
  const raw=customEx?._coach&&typeof customEx._coach==="object"?customEx._coach:{};
  return {
    profile:normalizeCoachProfile(raw.profile||{}),
    plan:raw.plan&&Array.isArray(raw.plan.days)?raw.plan:null,
  };
}

function withCoachState(customEx={},nextCoach){
  return {
    ...customEx,
    _coach:{
      profile:normalizeCoachProfile(nextCoach?.profile||{}),
      plan:nextCoach?.plan||null,
    },
  };
}
```

- [ ] **Step 2: Insert coach generation helpers**

Add directly below the block from Step 1:

```js
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
      ].join(" · "),
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
    summary:`${goalLabel} plan · ${profile.daysPerWeek} days/week · ${profile.sessionLength} minute sessions`,
    reason:`Built from ${history.length||0} logged week${history.length===1?"":"s"}, fatigue ${fatigue}, quality ${quality?.score||0}, and your equipment choices.`,
    profile,
    weakMuscles:weakMuscles.map(group=>({id:group.id,label:group.label,color:group.color})),
    days,
  };
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
      exercises:(planDay.exercises||[]).slice(0,6),
    },
  };
}
```

- [ ] **Step 3: Run verifier and confirm partial progress**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-smart-program-builder-app.cjs
```

Expected: still fails, but no longer lists helper fragments from this task.

---

### Task 3: Add Coach Setup And Generated Plan UI

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `coachState(customEx)`, `normalizeCoachProfile(profile)`, `buildSmartProgram(...)`
- Produces component: `CoachProgramBuilder({history, goals, customEx, onSaveCoachProfile, onGenerateCoachProgram, onStartCoachPlanDay})`

- [ ] **Step 1: Add compact field helpers**

Add before `function CoachProgramBuilder` in `src/App.jsx`:

```js
function CoachPillGroup({label,items,value,onChange}){
  return(
    <div style={{marginBottom:10}}>
      <div style={{fontSize:8,color:"#555",fontWeight:900,textTransform:"uppercase",
        letterSpacing:"0.1em",marginBottom:6}}>{label}</div>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${items.length},1fr)`,gap:6}}>
        {items.map(item=>{
          const active=value===item.id||value===item;
          return(
            <button key={item.id||item} onClick={()=>onChange(item.id||item)}
              style={{padding:"8px 5px",borderRadius:8,
                border:`1px solid ${active?"#7C6FFF66":"#1e1e38"}`,
                background:active?"#15153a":"#07071a",
                color:active?"#fff":"#555",fontSize:9,fontWeight:950,cursor:"pointer"}}>
              {item.label||item}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add `CoachProgramBuilder` component**

Add after `AdaptiveWorkoutPlan` and before `MuscleTrendCards`:

```js
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
  const generate=()=>onGenerateCoachProgram?.(draftProfile);
  return(
    <div style={{background:"linear-gradient(145deg,#101032,#071622 76%)",
      border:"1px solid #24304f",borderRadius:14,padding:"14px",marginBottom:16}}>
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
        <div style={{background:"#07071a",border:"1px solid #17213a",borderRadius:12,padding:"12px",marginBottom:12}}>
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
          <div style={{fontSize:8,color:"#555",fontWeight:900,textTransform:"uppercase",
            letterSpacing:"0.1em",marginBottom:6}}>Equipment</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:10}}>
            {COACH_EQUIPMENT.map(item=>(
              <button key={item.id} onClick={()=>updateEquipment(item.id,!draftProfile.equipment[item.id])}
                style={{padding:"8px 4px",borderRadius:8,
                  border:`1px solid ${draftProfile.equipment[item.id]?"#2DD4A066":"#1e1e38"}`,
                  background:draftProfile.equipment[item.id]?"#061811":"#07071a",
                  color:draftProfile.equipment[item.id]?"#2DD4A0":"#555",
                  fontSize:8,fontWeight:950,cursor:"pointer"}}>
                {item.label}
              </button>
            ))}
          </div>
          <button onClick={()=>updateProfile({weakMuscleBias:!draftProfile.weakMuscleBias})}
            style={{width:"100%",padding:"10px",borderRadius:9,
              border:`1px solid ${draftProfile.weakMuscleBias?"#FFB34755":"#1e1e38"}`,
              background:draftProfile.weakMuscleBias?"#160f00":"#07071a",
              color:draftProfile.weakMuscleBias?"#FFB347":"#555",
              fontSize:10,fontWeight:950,cursor:"pointer",marginBottom:10}}>
            Weak-Muscle Bias {draftProfile.weakMuscleBias?"On":"Off"}
          </button>
          <button onClick={generate} style={{width:"100%",padding:"12px",borderRadius:10,
            border:"none",background:"linear-gradient(135deg,#7C6FFF,#2DD4A0)",
            color:"#fff",fontSize:12,fontWeight:950,cursor:"pointer"}}>
            Generate Program
          </button>
        </div>
      )}

      {plan?(
        <div>
          <div style={{background:"#07071a",border:"1px solid #17213a",borderRadius:12,padding:"11px",marginBottom:10}}>
            <div style={{fontSize:13,color:"#fff",fontWeight:950,marginBottom:4}}>{plan.summary}</div>
            <div style={{fontSize:10,color:"#666",lineHeight:1.45}}>{plan.reason}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {plan.days.map(day=>(
              <div key={day.id} style={{background:"#07071a",border:`1px solid ${DAYS[day.dayKey]?.accent||"#7C6FFF"}33`,
                borderLeft:`3px solid ${DAYS[day.dayKey]?.accent||"#7C6FFF"}`,borderRadius:11,padding:"11px"}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:10,marginBottom:7}}>
                  <div>
                    <div style={{fontSize:12,color:"#fff",fontWeight:950}}>{day.label}: {day.focus}</div>
                    <div style={{fontSize:9,color:"#555",lineHeight:1.4,marginTop:3}}>{day.reason}</div>
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
                    padding:"7px 0",borderTop:"1px solid #12122a"}}>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:11,color:"#ddd",fontWeight:900,whiteSpace:"nowrap",
                        overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</div>
                      <div style={{fontSize:9,color:"#555",lineHeight:1.35,marginTop:2}}>{item.weightHint}</div>
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
          <div style={{background:"#07071a",border:"1px solid #12122a",borderRadius:10,
            padding:"12px",fontSize:11,color:"#555",lineHeight:1.45}}>
            Set your coach profile, then generate your first program.
          </div>
        )
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add Coach card to `TotalVolumeView`**

Change the function signature:

```js
function TotalVolumeView({history,goals,customEx,onStartAdaptivePlan,onSaveCoachProfile,onGenerateCoachProgram,onStartCoachPlanDay,hasDraft}){
```

Then render the coach card directly after `AdaptiveWorkoutPlan`:

```jsx
<CoachProgramBuilder history={history} goals={goals} customEx={customEx}
  onSaveCoachProfile={onSaveCoachProfile}
  onGenerateCoachProgram={onGenerateCoachProgram}
  onStartCoachPlanDay={onStartCoachPlanDay}/>
```

- [ ] **Step 4: Run verifier and confirm UI fragments are present**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-smart-program-builder-app.cjs
```

Expected: still fails only if app-level handlers or `coachPlan` integration are not present.

---

### Task 4: Wire Coach Save, Generate, And Start Handlers

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `withCoachState(customEx, nextCoach)`, `coachState(customEx)`, `buildSmartProgram(...)`, `buildCoachPlanDraft(...)`
- Produces handlers:
  - `handleSaveCoachProfile(profile)`
  - `handleGenerateCoachProgram(profileInput)`
  - `handleStartCoachPlanDay(planDay)`

- [ ] **Step 1: Add handlers inside `App`**

Add these after `handleStartAdaptivePlan`:

```js
const handleSaveCoachProfile=async(profile)=>{
  const current=coachState(customEx);
  const nextProfile=normalizeCoachProfile({...profile,updatedAt:new Date().toISOString()});
  await saveAll(history,goals,withCoachState(customEx,{...current,profile:nextProfile}));
};

const handleGenerateCoachProgram=async(profileInput)=>{
  const current=coachState(customEx);
  const profile=normalizeCoachProfile(profileInput||current.profile);
  const plan=buildSmartProgram(history,customEx,goals,profile);
  await saveAll(history,goals,withCoachState(customEx,{profile,plan}));
};

const handleStartCoachPlanDay=async(planDay)=>{
  const nextDraft=buildCoachPlanDraft(planDay,draft);
  if(nextDraft) await handleSaveDraft(nextDraft);
  setView("log");
};
```

- [ ] **Step 2: Pass handlers into `TotalVolumeView`**

Change the existing `TotalVolumeView` usage:

```jsx
{view==="total"   &&<TotalVolumeView history={history} goals={goals} customEx={customEx}
  onStartAdaptivePlan={handleStartAdaptivePlan}
  onSaveCoachProfile={handleSaveCoachProfile}
  onGenerateCoachProgram={handleGenerateCoachProgram}
  onStartCoachPlanDay={handleStartCoachPlanDay}
  hasDraft={!!draft}/>}
```

- [ ] **Step 3: Run verifier**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-smart-program-builder-app.cjs
```

Expected: still fails only if Log `coachPlan` integration is not present.

---

### Task 5: Add Coach Plan Log Integration

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes draft property: `initialDraft.coachPlan`
- Preserves draft property: `coachPlan`
- Produces visible text: `Coach Program Loaded`

- [ ] **Step 1: Capture loaded coach plan in `LogForm`**

Inside `LogForm`, near `loadedAdaptivePlan`, add:

```js
const loadedCoachPlan=initialDraft?.coachPlan;
```

- [ ] **Step 2: Preserve `coachPlan` during draft autosave**

In the draft save effect, after the existing adaptive plan preservation, add:

```js
if(loadedCoachPlan) nextDraft.coachPlan=loadedCoachPlan;
```

Update the dependency array so it includes `loadedCoachPlan`:

```js
},[activeDay,completedDays,notes,rating,rpe,deload,restPreset,inputs,loadedAdaptivePlan,loadedCoachPlan]);
```

- [ ] **Step 3: Update restored-session banner copy**

Replace the restored note message expression with:

```jsx
{loadedCoachPlan
  ?`↺ Coach program loaded for ${DAYS[loadedCoachPlan.dayKey]?.label||"your workout"}`
  : loadedAdaptivePlan
    ?`↺ Loaded adaptive plan for ${DAYS[loadedAdaptivePlan.dayKey]?.label||"your next workout"}`
    :"↺ Restored unsaved entries from last session"}
```

- [ ] **Step 4: Add coach plan preview below adaptive preview**

Add below the existing adaptive preview block:

```jsx
{loadedCoachPlan&&(
  <div style={{background:`linear-gradient(145deg,${DAYS[loadedCoachPlan.dayKey]?.dim||"#2DD4A018"},#07071a 72%)`,
    border:`1px solid ${DAYS[loadedCoachPlan.dayKey]?.accent||"#2DD4A0"}44`,
    borderRadius:12,padding:"12px",marginBottom:12}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",marginBottom:9}}>
      <div>
        <div style={{fontSize:9,color:DAYS[loadedCoachPlan.dayKey]?.accent||"#2DD4A0",
          fontWeight:950,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:3}}>
          Coach Program Loaded
        </div>
        <div style={{fontSize:14,color:"#fff",fontWeight:950}}>{loadedCoachPlan.focus}</div>
        <div style={{fontSize:10,color:"#555",lineHeight:1.4,marginTop:4}}>{loadedCoachPlan.reason}</div>
      </div>
      <div style={{fontSize:10,color:DAYS[loadedCoachPlan.dayKey]?.accent||"#2DD4A0",
        fontWeight:950,whiteSpace:"nowrap"}}>{loadedCoachPlan.label}</div>
    </div>
    {(loadedCoachPlan.exercises||[]).slice(0,4).map(item=>(
      <div key={item.id} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,
        padding:"7px 0",borderTop:"1px solid #12122a"}}>
        <div style={{fontSize:10,color:"#ddd",fontWeight:900,overflow:"hidden",
          textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
        <div style={{fontSize:9,color:"#38BFFF",fontWeight:950}}>{item.sets} x {item.reps}</div>
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 5: Run verifier and confirm it passes**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-smart-program-builder-app.cjs
```

Expected: `Smart program builder app fragments verified.`

---

### Task 6: Docs, Verification, Build, Browser Smoke Test, Package

**Files:**
- Modify: `README.md`
- Generated: `dist`
- Generated: `lift-tracker-dist.zip`

**Interfaces:**
- Consumes all completed app changes.
- Produces deployable Netlify zip.

- [ ] **Step 1: Update README**

Append this paragraph after the public sharing notes:

```md
The Smart Program Builder stores coach preferences and generated plans privately inside each user's synced lift data. It does not use a paid AI service, does not create public coach records, and does not alter workout history until the user logs a workout.
```

- [ ] **Step 2: Run all verifier scripts**

Run:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-public-sharing-schema.cjs
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-public-follows-app.cjs
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-social-engagement-app.cjs
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-smart-program-builder-app.cjs
```

Expected:

```text
Public sharing schema fragments verified.
Public follows app fragments verified.
Social engagement app fragments verified.
Smart program builder app fragments verified.
```

- [ ] **Step 3: Run production build**

Run:

```powershell
$env:PATH='C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin;' + $env:PATH
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd' run build
```

Expected: Vite exits 0. The existing large chunk warning is acceptable.

- [ ] **Step 4: Browser smoke test**

Open or refresh `http://127.0.0.1:4186/`, go to Volume, and confirm:

- `Smart Program Builder` renders.
- `Coach Setup` renders.
- Changing Goal, Days / Week, Split Style, Intensity, Equipment, and Weak-Muscle Bias does not crash.
- `Generate Program` creates program day cards.
- `Start Workout` opens the Log tab.
- The Log tab shows `Coach Program Loaded`.
- Console has no errors.

- [ ] **Step 5: Package Netlify zip**

Run:

```powershell
Compress-Archive -Path .\dist\* -DestinationPath .\lift-tracker-dist.zip -Force
Get-Item .\lift-tracker-dist.zip | Select-Object FullName,Length,LastWriteTime
```

Expected: zip exists at `C:\Users\danat\Documents\LIft Tracker\lift-tracker-dist.zip` with a fresh timestamp.

---

## Self-Review

- Spec coverage: Coach Setup, deterministic program generation, private `customEx._coach` storage, equipment filters, fatigue and weak-muscle logic, Start Workout draft integration, docs, local checks, browser checks, and zip rollout are covered.
- Scope check: one feature path, no new Supabase table, no paid service, no calendar, no wearable integration, no marketplace.
- Type consistency: `defaultCoachProfile`, `normalizeCoachProfile`, `coachState`, `withCoachState`, `buildSmartProgram`, `buildCoachPlanDraft`, `CoachProgramBuilder`, `onSaveCoachProfile`, `onGenerateCoachProgram`, `onStartCoachPlanDay`, and `coachPlan` are named consistently across tasks.
