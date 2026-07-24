const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const read=file=>{
  const target=path.join(root,file);
  return fs.existsSync(target)?fs.readFileSync(target,"utf8"):"";
};

const app=read("src/App.jsx");
const css=read("src/styles.css");
const launch=read("src/components/experience/PublicLaunch.jsx");
const navigation=read("src/components/experience/AppNavigation.jsx");
const command=read("src/components/experience/DashboardCommandCenter.jsx");
const celebration=read("src/components/experience/WorkoutCelebration.jsx");
const orchestrator=read("src/components/experience/motion/MotionOrchestrator.jsx");
const intro=read("src/components/experience/motion/FirstVisitIntro.jsx");
const menu=read("src/components/experience/motion/LaunchMenu.jsx");
const transition=read("src/components/experience/motion/transitionView.js");
const pkg=JSON.parse(read("package.json")||"{}");

const requirements=[
  [orchestrator.includes("export default function MotionOrchestrator"),"MotionOrchestrator must exist"],
  [orchestrator.includes("IntersectionObserver"),"reveals must use IntersectionObserver"],
  [orchestrator.includes("requestAnimationFrame"),"scroll and pointer updates must be frame-batched"],
  [orchestrator.includes("passive:true"),"continuous listeners must be passive"],
  [orchestrator.includes("observer.disconnect()"),"reveal observer must be disconnected during cleanup"],
  [orchestrator.includes("removeEventListener"),"global motion listeners must be cleaned up"],
  [orchestrator.includes("earned-motion-ready"),"hidden reveal states must only activate after motion initialization"],
  [orchestrator.includes("prefers-reduced-motion: reduce"),"orchestrator must detect reduced motion"],
  [intro.includes("export default function FirstVisitIntro"),"FirstVisitIntro must exist"],
  [intro.includes("earned:intro-seen-v1"),"intro must be scoped to the visitor session"],
  [intro.includes("1250"),"normal intro duration must remain concise"],
  [intro.includes("Skip intro"),"intro must provide an immediate skip action"],
  [menu.includes("export default function LaunchMenu"),"LaunchMenu must exist"],
  [menu.includes('role="dialog"')&&menu.includes('aria-modal="true"'),"launch menu must expose modal dialog semantics"],
  [menu.includes('event.key==="Escape"'),"launch menu must close with Escape"],
  [menu.includes("triggerRef?.current?.focus"),"launch menu must restore focus to its trigger"],
  [transition.includes("document.startViewTransition"),"view changes must progressively enhance with the View Transitions API"],
  [transition.includes("prefers-reduced-motion: reduce"),"view transitions must respect reduced motion"],
  [transition.includes("update();"),"view transitions must have an immediate fallback"],
  [launch.includes("<FirstVisitIntro"),"public launch must mount the first-visit intro"],
  [launch.includes("<MotionOrchestrator"),"public launch must mount the motion orchestrator"],
  [launch.includes("<LaunchMenu"),"public launch must mount the accessible menu overlay"],
  [launch.includes("data-reveal="),"public launch must declare sequenced reveal intent"],
  [launch.includes("data-motion-section"),"public launch must expose section progress anchors"],
  [launch.includes("aria-expanded={menuOpen}"),"launch menu trigger must expose expanded state"],
  [launch.includes("SCROLL TO READ"),"hero must retain a clear scroll cue"],
  [app.includes('from "./components/experience/motion/transitionView.js"'),"App must import the native view-transition helper"],
  [app.includes("navigateToView"),"user-initiated app navigation must use a shared transition function"],
  [app.includes('className="earned-view-stage"'),"dynamic app content must use a contextual transition stage"],
  [navigation.includes("data-view-transition"),"app navigation must expose transition intent"],
  [command.includes("data-reveal="),"Today command center must use staged motion intent"],
  [!command.includes('className="earned-command__goalbar" data-reveal'),"thin goal rail must not depend on an intersection threshold"],
  [celebration.includes("data-celebration-step"),"workout completion feedback must be explicitly sequenced"],
  [css.includes(".earned-intro"),"CSS must style the first-session intro"],
  [css.includes(".earned-launch-menu"),"CSS must style the launch navigation overlay"],
  [css.includes(".earned-scroll-progress"),"CSS must style scroll location progress"],
  [css.includes(".earned-motion-ready [data-reveal]"),"CSS must preserve content when JavaScript motion fails"],
  [css.includes('.earned-motion-ready [data-reveal="title"] > span'),"masked title animation must live on a child so the observer can see its parent"],
  [css.includes(".earned-ascii-scene__canvas"),"hero motion artwork must use the Earned scene layer"],
  [orchestrator.includes("safetyTimer"),"reveals must have a delayed visibility safety fallback"],
  [orchestrator.includes("revealInViewport"),"reveals must have an immediate viewport fallback for fast scrolling"],
  [css.includes("::view-transition-old(root)"),"CSS must define a concise native page transition"],
  [css.includes("@media (hover: hover) and (pointer: fine)"),"pointer depth must be desktop-only"],
  [css.includes("@media (prefers-reduced-motion: reduce)"),"CSS must provide reduced-motion fallbacks"],
  [!css.includes("scroll-snap-type"),"motion must not force scroll snapping"],
];

const animationPackages=["gsap","framer-motion","motion","@studio-freight/lenis","lenis"];
for(const name of animationPackages){
  if(pkg.dependencies?.[name]||pkg.devDependencies?.[name]){
    requirements.push([false,`motion system must not add overlapping dependency ${name}`]);
  }
}

const failures=requirements.filter(([ok])=>!ok).map(([,message])=>message);
if(failures.length){
  console.error("Earned motion-system verification failed:");
  failures.forEach(failure=>console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Earned cinematic motion system verified.");
