# Section Skip And Save Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Log page action that skips and confirms an entire workout section while preserving previous lift values and excluding skipped exercises from saved volume.

**Architecture:** Keep the behavior inside `LogForm` because section completion, draft inputs, and save behavior already live there. Add one handler that reuses `liftInputFromLastLogged`, writes `skipped: true` for every active exercise in the current day, and updates `completedDays`. Add a verifier to protect the workflow.

**Tech Stack:** React in `src/App.jsx`, existing Node verifier scripts, Vite build.

## Global Constraints

- Do not reset skipped exercise weights, reps, sets, or set rows to zero.
- Do not count skipped exercises toward saved volume.
- Do not auto-save the entire week after skipping one section.
- Do not remove exercises from routines or history.
- Do not change Supabase schema.
- Use the existing `saveDraft` / `commitInputChange` flow by mutating LogForm input state through `commitInputChange`.

---

### Task 1: Section Skip Verifier

**Files:**
- Create: `scripts/verify-section-skip-save-app.cjs`
- Modify: `scripts/run-verifiers.cjs` indirectly uses this new `verify-*.cjs` file automatically

**Interfaces:**
- Consumes: `src/App.jsx` text and `README.md` text
- Produces: a verifier that fails until section skip/save behavior exists

- [ ] **Step 1: Write the failing verifier**

```js
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

const appFragments = [
  "const skipAndConfirmDay=dk=>",
  "Skip & Save",
  "onClick={()=>skipAndConfirmDay(activeDay)}",
  "for(const ex of allExercises(dk,customEx))",
  "const cell=dayInputs[ex.id]||liftInputFromLastLogged(history,ex)",
  "nextDayInputs[ex.id]={...cell,skipped:true}",
  "setCompleted(prev=>({...prev,[dk]:true}))",
  "No exercises are logged for ${DAYS[dk].label}. Mark this entire section as skipped?",
];

const readmeFragments = [
  "Section Skip & Save",
  "skip an entire workout section",
  "preserves the previous lift values",
  "does not count skipped exercises toward volume",
];

const missing = [];
for (const fragment of appFragments) {
  if (!app.includes(fragment)) missing.push(`src/App.jsx missing: ${fragment}`);
}
for (const fragment of readmeFragments) {
  if (!readme.includes(fragment)) missing.push(`README.md missing: ${fragment}`);
}

if (missing.length) {
  console.error("Section Skip & Save verification failed:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Section Skip & Save verification passed.");
```

- [ ] **Step 2: Run verifier to verify it fails**

Run: `node scripts/verify-section-skip-save-app.cjs`

Expected: FAIL with missing `skipAndConfirmDay` and README fragments.

### Task 2: Implement Section Skip And Save

**Files:**
- Modify: `src/App.jsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: `allExercises(dk, customEx)`, `liftInputFromLastLogged(history, ex)`, `commitInputChange`, `unconfirmDay`, `setCompleted`, `DAYS`
- Produces: `skipAndConfirmDay(dk)` handler and a Log page button wired to `activeDay`

- [ ] **Step 1: Add the handler**

Add this handler near `skipRemainingExercises` in `LogForm`:

```jsx
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
  setCompleted(prev=>({...prev,[dk]:true}));
  const remaining=DAY_KEYS.filter(k=>k!==dk&&!completedDays[k]);
  if(remaining.length) setActiveDay(remaining[0]);
};
```

- [ ] **Step 2: Add the Log page button**

Add a secondary button near the existing `Confirm {DAYS[activeDay].label}` control:

```jsx
<button onClick={()=>skipAndConfirmDay(activeDay)} style={{
  width:"100%",padding:"11px",minHeight:42,borderRadius:10,
  border:`1px solid ${DAYS[activeDay].accent}55`,background:"#07071a",
  color:DAYS[activeDay].accent,fontWeight:900,fontSize:12,
  cursor:"pointer",marginBottom:10}}>
  Skip & Save {DAYS[activeDay].label}
</button>
```

- [ ] **Step 3: Document the feature**

Add a README note:

```md
### Section Skip & Save

The Log page includes a section-level Skip & Save action for full workout sections. It lets users skip an entire workout section, preserves the previous lift values for next time, and does not count skipped exercises toward volume.
```

- [ ] **Step 4: Run targeted verifier**

Run: `node scripts/verify-section-skip-save-app.cjs`

Expected: PASS.

- [ ] **Step 5: Run all verifiers**

Run: `node scripts/run-verifiers.cjs`

Expected: all verifiers pass.

- [ ] **Step 6: Run production build**

Run: `npm run build`

Expected: Vite build succeeds.
