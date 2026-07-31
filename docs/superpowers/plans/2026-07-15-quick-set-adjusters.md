# Quick Set Adjusters Implementation Plan

**Goal:** Add per-set quick adjustment controls for faster Log tab workout entry.

**Architecture:** Add an `adjustSetValue` handler inside `LogForm` beside `handleSetChange`, then render a compact "Quick Adjust" button row for every editable set row. Reuse existing parsing helpers so volume math and saved payloads stay unchanged.

**Tech Stack:** React, Vite, existing single-file `src/App.jsx`, Node verifier script.

## Global Constraints

- No Supabase schema changes.
- Do not change saved workout payload shape.
- Do not change volume math.
- Keep skipped exercises excluded from saved volume.
- Preserve existing set quality values.

---

### Task 1: Add Quick Set Adjusters

**Files:**
- Create: `scripts/verify-quick-set-adjusters-app.cjs`
- Modify: `src/App.jsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: `getLiftSetRows(cell)`, `parseLiftCell(cell)`, `unconfirmDay(dayKey)`, `setInputs`
- Produces: `adjustSetValue(dayKey, exerciseId, setIndex, field, delta)` and per-set "Quick Adjust" controls

- [ ] **Step 1: Write the failing verifier**

```js
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

const appFragments = [
  "const adjustSetValue=(dk,id,index,field,delta)=>",
  "Quick Adjust",
  "adjustSetValue(activeDay,ex.id,index,\"w\",-5)",
  "adjustSetValue(activeDay,ex.id,index,\"w\",5)",
  "adjustSetValue(activeDay,ex.id,index,\"r\",-1)",
  "adjustSetValue(activeDay,ex.id,index,\"r\",1)",
  "-5 lb",
  "+5 lb",
  "-1 rep",
  "+1 rep",
  "skipped?\"default\":\"pointer\"",
];

const readmeFragments = [
  "Private Quick Set Adjusters",
  "No Supabase schema changes are required.",
];

const missing = [];
for (const fragment of appFragments) {
  if (!app.includes(fragment)) missing.push(`src/App.jsx missing: ${fragment}`);
}
for (const fragment of readmeFragments) {
  if (!readme.includes(fragment)) missing.push(`README.md missing: ${fragment}`);
}

if (missing.length) {
  console.error("Quick Set Adjusters verification failed:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Quick Set Adjusters verification passed.");
```

- [ ] **Step 2: Run verifier to verify it fails**

Run: `node scripts/verify-quick-set-adjusters-app.cjs`
Expected: FAIL with missing app and README fragments.

- [ ] **Step 3: Implement handler and controls**

Add `adjustSetValue` inside `LogForm`. Render the "Quick Adjust" row below each weight/reps input row and above Set Quality.

- [ ] **Step 4: Document**

Add a README line describing Private Quick Set Adjusters and schema impact.

- [ ] **Step 5: Run verifier to verify it passes**

Run: `node scripts/verify-quick-set-adjusters-app.cjs`
Expected: PASS.
