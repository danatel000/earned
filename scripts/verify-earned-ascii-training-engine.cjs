const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const read=file=>{
  const target=path.join(root,file);
  return fs.existsSync(target)?fs.readFileSync(target,"utf8"):"";
};

const pkg=JSON.parse(read("package.json")||"{}");
const math=read("src/components/experience/ascii/asciiMath.js");
const shaders=read("src/components/experience/ascii/glyphForgeShaders.js");
const sculpture=read("src/components/experience/ascii/createStrengthSculpture.js");
const scene=read("src/components/experience/ascii/EarnedAsciiScene.jsx");
const signal=read("src/components/experience/ascii/TrainingSignal.jsx");
const launch=read("src/components/experience/PublicLaunch.jsx");
const command=read("src/components/experience/DashboardCommandCenter.jsx");
const css=read("src/styles.css");

const requirements=[
  [pkg.dependencies?.three,"Three.js must be the rendering dependency"],
  [!pkg.dependencies?.gsap&&!pkg.dependencies?.lenis&&!pkg.dependencies?.["@react-three/fiber"],
    "ASCII engine must not add overlapping motion or React Three Fiber dependencies"],
  [pkg.scripts?.["test:ascii"]?.includes("test-ascii-renderer.mjs")&&
    pkg.scripts?.["test:ascii"]?.includes("test-app-ascii-atmosphere.mjs"),
    "package must expose both public and authenticated ASCII behavior tests"],
  [math.includes("export const ASCII_RAMP"),"ASCII ramp must be a public pure helper"],
  [math.includes("export function luminanceToGlyph"),"luminance mapping must be testable"],
  [math.includes("export function imageDataToAscii"),"image conversion must be testable"],
  [math.includes("export function buildTrainingSignal"),"training signal generation must be testable"],
  [shaders.includes("export const GLYPH_FORGE_RAMP"),"GPU ASCII must define an Earned glyph ramp"],
  [shaders.includes("export function resolveGlyphForgeBudget"),"responsive render budgets must be testable"],
  [shaders.includes("CanvasTexture"),"GPU ASCII must generate a runtime glyph atlas"],
  [shaders.includes("WebGLRenderTarget"),"GPU ASCII must render the detailed scene offscreen"],
  [shaders.includes("ShaderMaterial"),"GPU ASCII must composite through a custom shader"],
  [shaders.includes("uGlyphAtlas")&&shaders.includes("uCellSize")&&shaders.includes("uResolution")&&shaders.includes("uTime"),
    "glyph shader must expose atlas, cell, resolution, and time uniforms"],
  [shaders.includes("edge")&&shaders.includes("glyphLuma"),"glyph shader must preserve detailed luminance edges"],
  [shaders.includes("renderTarget.dispose()"),"Glyph Forge render target must be disposed"],
  [shaders.includes("glyphTexture.dispose()"),"Glyph Forge atlas texture must be disposed"],
  [sculpture.includes("export function createStrengthSculpture"),"detailed strength sculpture module must exist"],
  [sculpture.includes("knurl")&&sculpture.includes("spoke")&&sculpture.includes("plateRims"),
    "barbell must include knurling, spokes, and plate rims"],
  [sculpture.includes("plateGrooves")&&sculpture.includes("hubBolts")&&sculpture.includes("collarRidges"),
    "barbell must include plate grooves, hub bolts, and collar ridges"],
  [sculpture.includes("TubeGeometry")&&sculpture.includes("loadPaths"),"scene must include curved load paths"],
  [sculpture.includes("forcePulses")&&sculpture.includes("ghosts"),"scene must include force pulses and progression ghosts"],
  [sculpture.includes("floatingDumbbells")&&sculpture.includes("dumbbellHeadGeometry")&&
    sculpture.includes("dumbbellHandleGeometry"),
    "launch sculpture must include reusable floating dumbbell geometry and animation handles"],
  [sculpture.includes("measurementBrackets"),"scene must include technical measurement brackets"],
  [scene.includes("export default function EarnedAsciiScene"),"public ASCII scene component must exist"],
  [scene.includes('import("three")'),"Three.js must be loaded dynamically"],
  [scene.includes("requestAnimationFrame"),"scene must use the browser animation frame"],
  [scene.includes("cancelAnimationFrame"),"scene animation frame must be cancelled"],
  [scene.includes("IntersectionObserver"),"offscreen rendering must be paused"],
  [scene.includes("visibilitychange"),"hidden-document rendering must be paused"],
  [scene.includes("prefers-reduced-motion: reduce"),"scene must detect reduced motion"],
  [scene.includes("saveData"),"scene must provide a save-data fallback"],
  [scene.includes("webglcontextlost"),"scene must provide a context-loss fallback"],
  [scene.includes("renderer.dispose()"),"Three.js renderer must be disposed"],
  [scene.includes("geometry.dispose()"),"Three.js geometries must be disposed"],
  [scene.includes("material.dispose()"),"Three.js materials must be disposed"],
  [scene.includes("removeEventListener"),"scene listeners must be cleaned up"],
  [scene.includes("aria-hidden=\"true\""),"scene must be decorative to assistive technology"],
  [scene.includes("imageDataToAscii"),"scene must use the custom ASCII conversion pass"],
  [scene.includes('from "./glyphForgeShaders.js"'),"scene must use the Glyph Forge shader pipeline"],
  [scene.includes('from "./createStrengthSculpture.js"'),"scene must use the detailed sculpture module"],
  [scene.includes("composer.render(scene,camera"),"scene must use multi-pass GPU composition"],
  [scene.includes("handles.floatingDumbbells")&&scene.includes("data-floating-dumbbells"),
    "scene render loop must animate and expose the floating dumbbells for browser QA"],
  [scene.includes("composer.dispose()"),"scene must dispose GPU composition resources"],
  [scene.includes("data-render-tier"),"scene must expose its responsive quality tier for QA"],
  [launch.includes('from "./ascii/EarnedAsciiScene.jsx"'),"public launch must import the ASCII scene"],
  [launch.includes("<EarnedAsciiScene"),"public hero must render the ASCII scene"],
  [!launch.includes("earned-launch__hero-logo"),"static hero logo must no longer compete with the training scene"],
  [signal.includes("export default function TrainingSignal"),"authenticated text signal component must exist"],
  [signal.includes("buildTrainingSignal"),"authenticated signal must use deterministic real-data helpers"],
  [command.includes("<TrainingSignal"),"Today command center must render the training signal"],
  [css.includes(".earned-ascii-scene"),"public ASCII scene must be styled"],
  [css.includes(".earned-ascii-scene__telemetry"),"public scene must include integrated telemetry styling"],
  [css.includes(".earned-training-signal"),"authenticated training signal must be styled"],
  [css.includes("@media (prefers-reduced-motion: reduce)"),"reduced-motion CSS fallback must remain present"],
];

const failures=requirements.filter(([ok])=>!ok).map(([,message])=>message);
if(failures.length){
  console.error("Earned ASCII training engine verification failed:");
  failures.forEach(failure=>console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Earned ASCII training engine source contracts verified.");
