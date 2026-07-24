const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const read=file=>{
  const target=path.join(root,file);
  return fs.existsSync(target)?fs.readFileSync(target,"utf8"):"";
};

const pkg=JSON.parse(read("package.json")||"{}");
const engine=read("src/components/experience/forge/forgeAscii.js");
const viewport=read("src/components/experience/forge/useAsciiViewport.js");
const frameLoop=read("src/components/experience/forge/useAsciiFrameLoop.js");
const scramble=read("src/components/experience/forge/useAsciiTextScramble.js");
const sound=read("src/components/experience/forge/useTerminalSound.js");
const frameIndex=read("src/components/experience/forge/ascii-frames/index.js");
const squatFrames=read("src/components/experience/forge/ascii-frames/squat.js");
const benchFrames=read("src/components/experience/forge/ascii-frames/bench.js");
const deadliftFrames=read("src/components/experience/forge/ascii-frames/deadlift.js");
const progress=read("src/components/experience/forge/TerminalProgressBar.jsx");
const exerciseAnimator=read("src/components/experience/forge/AsciiExerciseAnimator.jsx");
const anatomy=read("src/components/experience/forge/AsciiAnatomyMap.jsx");
const countdown=read("src/components/experience/forge/AsciiRestCountdown.jsx");
const oneRm=read("src/components/experience/forge/AsciiOneRmMeter.jsx");
const boot=read("src/components/experience/forge/AsciiBootSequence.jsx");
const save=read("src/components/experience/forge/AsciiSaveSequence.jsx");
const intro=read("src/components/experience/motion/FirstVisitIntro.jsx");
const celebration=read("src/components/experience/WorkoutCelebration.jsx");
const avatar=read("src/components/experience/forge/AsciiAvatarGrid.jsx");
const systemLog=read("src/components/experience/forge/AsciiSystemLog.jsx");
const liveConsole=read("src/components/experience/forge/ForgeLiveConsole.jsx");
const command=read("src/components/experience/DashboardCommandCenter.jsx");
const app=read("src/App.jsx");
const styles=read("src/styles.css");

const requirements=[
  [pkg.scripts?.["test:ascii"]?.includes("test-forge-ascii.mjs"),"ASCII test command must include FORGE_ASCII behavior"],
  [engine.includes("export function resolveAsciiViewport"),"pure viewport resolver must exist"],
  [engine.includes("export function normalizeFrame"),"pure frame normalizer must exist"],
  [engine.includes("export function buildAsciiBarbell"),"pure dynamic barbell renderer must exist"],
  [engine.includes("export function buildCountdownFrame"),"pure countdown renderer must exist"],
  [viewport.includes("export default function useAsciiViewport"),"responsive ASCII viewport hook must exist"],
  [viewport.includes("matchMedia")&&viewport.includes("resize"),"viewport hook must react to motion and resize changes"],
  [viewport.includes("removeEventListener"),"viewport hook must clean up listeners"],
  [frameLoop.includes("export default function useAsciiFrameLoop"),"ASCII frame-loop hook must exist"],
  [frameLoop.includes("requestAnimationFrame")&&frameLoop.includes("cancelAnimationFrame"),"frame loop must use and cancel animation frames"],
  [frameLoop.includes("visibilitychange"),"frame loop must pause for hidden documents"],
  [frameLoop.includes("prefers-reduced-motion: reduce"),"frame loop must honor reduced motion"],
  [scramble.includes("export default function useAsciiTextScramble"),"ASCII text-scramble hook must exist"],
  [scramble.includes("resolveScrambleFrame"),"scramble hook must use the deterministic pure helper"],
  [scramble.includes("requestAnimationFrame")&&scramble.includes("cancelAnimationFrame"),"scramble hook must own frame lifecycle"],
  [scramble.includes("prefers-reduced-motion: reduce"),"scramble hook must resolve immediately for reduced motion"],
  [sound.includes("export default function useTerminalSound"),"terminal sound hook must exist"],
  [sound.includes("earned:terminal-sound-v1"),"sound preference must be local and explicit"],
  [sound.includes("AudioContext")&&sound.includes("createOscillator")&&sound.includes("createGain"),"sound hook must synthesize low-volume cues"],
  [sound.includes("0.035"),"sound gain must remain capped at a restrained level"],
  [sound.includes("close()")&&sound.includes("stop"),"sound resources must be stopped and closed"],
  [sound.includes("timersRef")&&sound.includes("clearTimeout"),"delayed sound cues must be owned and cleared on unmount"],
  [frameIndex.includes("export function exerciseFramesFor"),"exercise frame composer must exist"],
  [squatFrames.includes("SQUAT_FRAMES")&&squatFrames.includes("<<BAR.MID>>"),"squat motion frames must include a dynamic bar path"],
  [benchFrames.includes("BENCH_FRAMES")&&benchFrames.includes("<<BAR.MID>>"),"bench motion frames must include a dynamic bar path"],
  [deadliftFrames.includes("DEADLIFT_FRAMES")&&deadliftFrames.includes("<<BAR.MID>>"),"deadlift motion frames must include a dynamic bar path"],
  [progress.includes("export default function TerminalProgressBar")&&progress.includes("buildTerminalProgress"),"terminal progress component must use pure block output"],
  [exerciseAnimator.includes("export default function AsciiExerciseAnimator")&&exerciseAnimator.includes("useAsciiFrameLoop"),"exercise animator must use the shared frame loop"],
  [exerciseAnimator.includes("data-forge-exercise"),"exercise animator must expose browser QA state"],
  [anatomy.includes("export default function AsciiAnatomyMap")&&anatomy.includes("buildAnatomyFrame"),"ASCII anatomy component must use targeted pure output"],
  [countdown.includes("export default function AsciiRestCountdown")&&countdown.includes("useAsciiTextScramble"),"rest countdown must scramble between fixed-width states"],
  [countdown.includes("data-forge-alert"),"rest countdown must expose final-three alert state"],
  [oneRm.includes("export default function AsciiOneRmMeter")&&oneRm.includes("buildOneRmMeter"),"1RM meter must use pure vertical output"],
  [oneRm.includes("VITALS: OVERLOAD CANDIDATE"),"live 1RM meter must use honest candidate language"],
  [boot.includes("export default function AsciiBootSequence"),"honest ASCII boot component must exist"],
  [boot.includes("AUTH CLIENT")&&boot.includes("LOCAL CACHE")&&boot.includes("GLYPH CORE")&&boot.includes("NETWORK LINK"),
    "boot sequence must report only observable client subsystems"],
  [boot.includes("STATUS: READY [OK]")&&boot.includes("1450"),"boot sequence must resolve ready within 1.5 seconds"],
  [boot.includes("requestAnimationFrame")&&boot.includes("cancelAnimationFrame"),"boot typing loop must own its frame lifecycle"],
  [boot.includes("Skip boot"),"boot sequence must remain immediately skippable"],
  [save.includes("export default function AsciiSaveSequence"),"successful workout ASCII save component must exist"],
  [save.includes("[SAVED TO BLOCK]"),"save sequence must resolve to its terminal success message"],
  [save.includes("VITALS: OVERLOAD ACHIEVED"),"saved PR sequence must reserve definitive overload language"],
  [save.includes("clearTimeout"),"save sequence must clean up its completion timer"],
  [intro.includes("<AsciiBootSequence")&&intro.includes("earned:intro-seen-v1"),"first-session intro must use the new boot sequence"],
  [celebration.includes("<AsciiSaveSequence")&&celebration.includes("saveResolved"),"successful workout dialog must gate details behind ASCII save resolution"],
  [avatar.includes("export default function AsciiAvatarGrid"),"Command Deck ASCII avatar component must exist"],
  [["spartan","power","iron"].every(style=>avatar.includes(`"${style}"`)),"avatar component must expose all three user-selectable styles"],
  [avatar.includes("buildHelmetFrame")&&avatar.includes("buildPowerGrid"),"avatar must combine helmet and real-stat power-grid output"],
  [avatar.includes("data-forge-avatar"),"avatar must expose its style for browser QA"],
  [systemLog.includes("export default function AsciiSystemLog"),"real-history system log component must exist"],
  [systemLog.includes("entry.exercises")&&systemLog.includes("NO TRAINING BLOCKS"),"system log must derive entries from real history and handle empty accounts"],
  [command.includes("COMMAND DECK")&&command.includes("<AsciiAvatarGrid")&&command.includes("<AsciiSystemLog"),"Today command center must render the complete Command Deck"],
  [command.includes("onStartWorkout")&&command.includes("onOpenGoals"),"Command Deck must preserve primary workout and goal actions"],
  [app.includes("asciiAvatarStyle")&&app.includes("handleAsciiAvatarStyleChange"),"App must normalize and handle the synced avatar preference"],
  [app.includes("onAvatarStyleChange={handleAsciiAvatarStyleChange}"),"App must wire account preference changes into the Command Deck"],
  [app.includes('import AsciiExerciseAnimator from "./components/experience/forge/AsciiExerciseAnimator.jsx"')&&
    app.includes('import AsciiAnatomyMap from "./components/experience/forge/AsciiAnatomyMap.jsx"'),
    "App must import the Armory animation and anatomy components"],
  [app.includes("ARMORY / EXERCISE INDEX"),"Library must expose the Armory directory identity"],
  [app.includes("handleArmoryKeyDown")&&app.includes('event.key==="ArrowDown"')&&app.includes('event.key==="ArrowUp"')&&app.includes('event.key==="Enter"'),
    "Armory directory must support arrow and Enter keyboard navigation"],
  [app.includes("data-armory-row")&&app.includes("data-armory-index"),"Armory rows must expose stable keyboard and browser-QA targets"],
  [app.includes("<AsciiExerciseAnimator")&&app.includes("<AsciiAnatomyMap"),"expanded Armory rows must render movement and muscle ASCII"],
  [app.includes("Start This Workout")&&app.includes("<TechniqueCoachPanel")&&app.includes("<ExerciseNotesPanel"),
    "Armory integration must preserve workout start, technique, and notes controls"],
  [liveConsole.includes("export default function ForgeLiveConsole"),"active workout terminal console must exist"],
  [liveConsole.includes("buildAsciiBarbell")&&liveConsole.includes("<TerminalProgressBar")&&liveConsole.includes("<AsciiRestCountdown"),
    "Forge console must combine live plate, set-progress, and rest output"],
  [liveConsole.includes("> ENTER WEIGHT:")&&liveConsole.includes("> ENTER REPS:")&&liveConsole.includes("> ENTER SETS:"),
    "Forge console must echo real logger values through terminal prompts"],
  [liveConsole.includes("useTerminalSound")&&liveConsole.includes("Sound Off")&&liveConsole.includes("Sound On"),
    "Forge console sound must remain an explicit user preference"],
  [liveConsole.includes("data-forge-console")&&liveConsole.includes("data-forge-weight"),
    "Forge console must expose stable browser-QA state"],
  [app.includes('import ForgeLiveConsole from "./components/experience/forge/ForgeLiveConsole.jsx"')&&
    app.includes('import AsciiOneRmMeter from "./components/experience/forge/AsciiOneRmMeter.jsx"'),
    "App must import the live console and ASCII 1RM meter"],
  [app.includes("activeFocusCompletedSets")&&app.includes("filter(row=>row.completed).length"),
    "live set progress must derive only from explicitly completed set rows"],
  [app.includes("<ForgeLiveConsole")&&app.includes("completedSets={activeFocusCompletedSets}")&&app.includes("restActive={restActive}"),
    "active workout must wire real focus and rest state into the Forge console"],
  [app.includes("<AsciiOneRmMeter")&&app.includes("current={top.currentOneRM}")&&app.includes("previous={top.bestOneRM}"),
    "live PR radar must render the honest ASCII one-rep-max signal"],
  [[".forge-command-deck__grid",".forge-avatar",".forge-system-log",".forge-vitals"].every(selector=>styles.includes(selector)),
    "Command Deck terminal regions must have a complete visual system"],
  [[".forge-armory-row__path",".forge-armory-inspection",".forge-exercise",".forge-anatomy"].every(selector=>styles.includes(selector)),
    "Armory directory, motion, and anatomy output must be styled"],
  [[".forge-live-console",".forge-countdown",".forge-one-rm",".forge-progress"].every(selector=>styles.includes(selector)),
    "active Forge console and stat primitives must be styled"],
  [styles.includes('.forge-countdown[data-forge-alert="final-three"]')&&styles.includes("#ff0000"),
    "the final-three rest alert must use the reserved bright-red signal"],
  [styles.includes("@media (max-width: 980px)")&&styles.includes("@media (max-width: 560px)"),
    "FORGE_ASCII layout must provide tablet and compact mobile variants"],
  [styles.includes("@media (prefers-reduced-motion: reduce)")&&styles.includes(".forge-boot::before"),
    "FORGE_ASCII styling must integrate with the reduced-motion fallback"],
];

const failures=requirements.filter(([ok])=>!ok).map(([,message])=>message);
if(failures.length){
  console.error("FORGE_ASCII product verification failed:");
  failures.forEach(failure=>console.error(`- ${failure}`));
  process.exit(1);
}

console.log("FORGE_ASCII product source contracts verified.");
