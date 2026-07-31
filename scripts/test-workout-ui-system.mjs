import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {buildWorkoutViewSignal} from "../src/components/experience/workout/workoutViewSignals.js";

const root=new URL("../",import.meta.url);
const read=path=>readFileSync(new URL(path,root),"utf8");

const expectedFiles=[
  "src/components/experience/workout/workoutViewSignals.js",
  "src/components/experience/workout/WorkoutEcosystemRail.jsx",
  "src/styles-workout.css",
  "workout-ui-upgrade-log.md",
];

for(const path of expectedFiles){
  assert.ok(existsSync(new URL(path,root)),`${path} must exist`);
}

const signals=read("src/components/experience/workout/workoutViewSignals.js");
const rail=read("src/components/experience/workout/WorkoutEcosystemRail.jsx");
const navigation=read("src/components/experience/AppNavigation.jsx");
const app=read("src/App.jsx");
const main=read("src/main.jsx");
const styles=read("src/styles-workout.css");
const log=read("workout-ui-upgrade-log.md");

for(const view of ["total","log","lifts","prs","history","goals","library","community"]){
  assert.match(signals,new RegExp(`\\b${view}\\s*:`),`signal model must define ${view}`);
}

assert.match(signals,/export function buildWorkoutViewSignal/,
  "signal model must export a pure signal builder");
assert.match(signals,/Math\.(?:min|max)/,
  "signal model must clamp progress values");

const draftTodaySignal=buildWorkoutViewSignal("total",{draft:{activeDay:"legs"}});
assert.equal(draftTodaySignal.primary.label,"Resume workout",
  "Today must turn an existing workout draft into the primary action");
assert.equal(draftTodaySignal.primary.target,"log",
  "Draft recovery must return users to the existing logger");
const freshTodaySignal=buildWorkoutViewSignal("total",{draft:null});
assert.equal(freshTodaySignal.primary.label,"Start training",
  "Today must retain a clear start action when no draft exists");

assert.match(rail,/className="earned-workout-rail"/,
  "shared workout rail must expose its production class");
assert.match(rail,/aria-live|aria-label/,
  "shared workout rail must expose accessible status");
assert.match(app,/import WorkoutEcosystemRail/,
  "App must import the shared workout rail");
assert.match(app,/<WorkoutEcosystemRail/,
  "App must render the shared workout rail");
assert.match(app,/Resume workout/,
  "The cross-tab draft notice must name its resume action");
assert.match(app,/Discard draft/,
  "The cross-tab draft notice must offer an explicit discard action");
assert.match(app,/handleClearDraft/,
  "Discarding a draft must use the existing draft-clear persistence path");

assert.match(navigation,/role="tablist"/,
  "navigation must expose a tablist");
assert.match(navigation,/role="tab"/,
  "navigation items must expose tab semantics");
assert.match(navigation,/ArrowLeft|ArrowRight/,
  "navigation must support arrow-key movement");
assert.match(navigation,/Home|End/,
  "navigation must support Home and End keys");
assert.match(navigation,/aria-label=\{item\.label\}/,
  "decorative tab indices must not change each tab's accessible name");
assert.match(navigation,/scrollTo\(\{\s*left(?:,|:)/,
  "the active mobile tab must scroll into view");
assert.match(navigation,/requestAnimationFrame/,
  "navigation scrolling must wait for the final mobile layout");
assert.match(navigation,/getBoundingClientRect/,
  "navigation scrolling must use the rendered tab geometry");

for(const viewClass of [
  "today","train","progress","records","history","goals","library","feed",
]){
  assert.ok(app.includes(`earned-workout-view--${viewClass}`),
    `App must expose the ${viewClass} view hook`);
}

assert.match(app,/earned-history-toolbar/,
  "History must include a compact filter toolbar");
assert.match(app,/earned-library-grid/,
  "Library must expose a responsive directory grid");
assert.match(app,/earned-feed-challenge-rail/,
  "Feed challenges must expose a horizontal rail");

for(const selector of [
  ".earned-workout-rail",
  ".earned-app-nav__indicator",
  ".earned-history-toolbar",
  ".earned-library-grid",
  ".earned-record-card",
  ".earned-feed-challenge-rail",
]){
  assert.ok(styles.includes(selector),`${selector} must have production styling`);
}

assert.match(styles,/@media \(max-width:\s*760px\)[\s\S]*earned-workout-rail/,
  "Workout UI must include mobile behavior");
assert.match(styles,/@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*earned-workout-rail/,
  "Workout UI must include reduced-motion behavior");
assert.match(main,/styles-workout\.css/,
  "The workout CSS layer must be loaded");

const categories=[
  "Components",
  "Themes",
  "Templates",
  "Cards",
  "Buttons",
  "Carousels",
  "Sign ins",
  "Dashboards",
  "Sidebars",
  "Menus",
  "Galleries",
  "Navigation menus",
  "Features sections",
  "Borders",
  "Texts",
  "Testimonials",
];

for(const category of categories){
  assert.match(log,new RegExp(`^## ${category.replace(/[.*+?^${}()|[\\]\\\\]/g,"\\\\$&")}\\s*$`,"m"),
    `workout-ui-upgrade-log.md must document ${category}`);
}

assert.match(log,/Categories processed:\*\*\s*16/,
  "Workout upgrade summary must report all 16 categories");
assert.doesNotMatch(log,/Sarah|Michael|Jessica|five stars|5 stars/i,
  "Workout social proof must not invent testimonials");

console.log("Earned workout ecosystem UI contract verified.");
