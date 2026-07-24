const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const read=file=>{
  const target=path.join(root,file);
  return fs.existsSync(target)?fs.readFileSync(target,"utf8"):"";
};

const ambient=read("src/components/experience/ascii/ambientAscii.js");
const component=read("src/components/experience/ascii/AppAsciiAtmosphere.jsx");
const reactor=read("src/components/experience/ascii/WorkoutAsciiReactor.jsx");
const milestone=read("src/components/experience/ascii/AsciiMilestoneBurst.jsx");
const celebration=read("src/components/experience/WorkoutCelebration.jsx");
const app=read("src/App.jsx");
const css=read("src/styles.css");

const requirements=[
  [["total","log","lifts","prs","history","goals","library","community"].every(id=>ambient.includes(`${id}:{`)),
    "all eight authenticated views must define an ASCII profile"],
  [component.includes("export default function AppAsciiAtmosphere"),"global ASCII atmosphere component must exist"],
  [component.includes('getContext("2d"'),"global atmosphere must use a lightweight Canvas 2D renderer"],
  [component.includes("buildAmbientGlyphs")&&component.includes("resolveAmbientAsciiBudget"),
    "global atmosphere must use the deterministic helpers and responsive budgets"],
  [component.includes("requestAnimationFrame")&&component.includes("cancelAnimationFrame"),
    "global atmosphere must start and clean up animation frames"],
  [component.includes("visibilitychange"),"global atmosphere must pause while the document is hidden"],
  [component.includes("prefers-reduced-motion: reduce"),"global atmosphere must respect reduced motion"],
  [component.includes("max-width: 640px"),"global atmosphere must use a mobile render budget"],
  [component.includes("pointermove")&&component.includes("removeEventListener"),
    "global atmosphere must clean up pointer and viewport listeners"],
  [component.includes("data-ascii-view")&&component.includes("data-ascii-tier")&&component.includes("data-ascii-state"),
    "global atmosphere must expose its view, tier, and state for browser QA"],
  [component.includes('aria-hidden="true"'),"global atmosphere must be decorative to assistive technology"],
  [app.includes('import AppAsciiAtmosphere from "./components/experience/ascii/AppAsciiAtmosphere.jsx"'),
    "App must import the global atmosphere"],
  [app.includes("<AppAsciiAtmosphere")&&app.includes("view={view}"),
    "App must mount one atmosphere driven by the active view"],
  [css.includes(".earned-app-ascii"),"global atmosphere must be styled"],
  [css.includes("pointer-events: none")&&css.includes(".earned-app-shell > :not(.earned-app-ascii)"),
    "global atmosphere must remain behind noninteractive app content"],
  [css.includes(".earned-app-ascii__canvas")&&css.includes("mix-blend-mode: screen"),
    "global canvas must use the restrained Earned compositing treatment"],
  [css.includes(".earned-app-nav__item::before")&&css.includes('content: "//"'),
    "navigation items must expose a subtle shared ASCII trace"],
  [reactor.includes("export default function WorkoutAsciiReactor"),"live workout ASCII reactor must exist"],
  [["volume","setCount","loggedCount","restRemaining","readiness","accent"].every(prop=>reactor.includes(prop)),
    "workout reactor must consume all existing live training metrics"],
  [reactor.includes("buildWorkoutAsciiFrame"),"workout reactor must use the tested pure signal builder"],
  [reactor.includes("visibilitychange")&&reactor.includes("prefers-reduced-motion: reduce"),
    "workout reactor must pause while hidden and respect reduced motion"],
  [reactor.includes("clearInterval")&&reactor.includes("removeEventListener"),
    "workout reactor must clean up timers and listeners"],
  [reactor.includes('aria-hidden="true"'),"workout reactor must remain decorative"],
  [app.includes('import WorkoutAsciiReactor from "./components/experience/ascii/WorkoutAsciiReactor.jsx"'),
    "App must import the workout reactor"],
  [app.includes("volume={previewVol}")&&app.includes("setCount={activeSetCount}")&&
    app.includes("loggedCount={activeLoggedCount}")&&app.includes("restRemaining={restRemaining}")&&
    app.includes("readiness={readinessScore}"),
    "LogForm must wire every existing live workout metric into the reactor"],
  [app.indexOf("<WorkoutAsciiReactor")>-1&&app.indexOf("<WorkoutAsciiReactor")<app.indexOf("<LivePRRadar"),
    "workout reactor must appear before the secondary live coaching tools"],
  [css.includes(".earned-workout-reactor")&&css.includes(".earned-workout-reactor pre"),
    "workout reactor must have stable component and signal styling"],
  [css.includes("@keyframes earned-reactor-scan"),"workout reactor must define its restrained scan motion"],
  [milestone.includes("export default function AsciiMilestoneBurst"),"ASCII milestone burst must exist"],
  [["volume","streak","isPR"].every(prop=>milestone.includes(prop)),
    "milestone burst must consume the real completion metrics"],
  [milestone.includes("buildMilestoneAsciiFrame"),"milestone burst must use the tested pure signal builder"],
  [milestone.includes("prefers-reduced-motion: reduce")&&milestone.includes("visibilitychange"),
    "milestone burst must respect reduced motion and document visibility"],
  [milestone.includes("clearInterval")&&milestone.includes('aria-hidden="true"'),
    "milestone burst must clean up and remain decorative"],
  [celebration.includes('import AsciiMilestoneBurst from "./ascii/AsciiMilestoneBurst.jsx"'),
    "workout celebration must import the milestone burst"],
  [celebration.includes("<AsciiMilestoneBurst")&&celebration.includes("volume={volume}")&&
    celebration.includes("streak={streak}")&&celebration.includes("isPR={isPR}"),
    "workout celebration must pass the saved volume, streak, and PR result"],
  [css.includes(".earned-milestone-burst")&&css.includes('.earned-milestone-burst[data-pr="true"]'),
    "milestone burst must define standard and PR visual states"],
];

const failed=requirements.filter(([passed])=>!passed).map(([,message])=>message);
if(failed.length){
  console.error("Earned app-wide ASCII atmosphere verification failed:");
  failed.forEach(message=>console.error(`- ${message}`));
  process.exit(1);
}
console.log("Earned app-wide ASCII atmosphere source contracts verified.");
