const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const read=file=>{
  const target=path.join(root,file);
  return fs.existsSync(target)?fs.readFileSync(target,"utf8"):"";
};

const identity=read("src/ViewIdentityBar.jsx");
const app=read("src/App.jsx");
const css=read("src/styles.css");
const authenticatedViews=["total","log","lifts","prs","history","goals","library","community"];

const largeInlineRadii=[...app.matchAll(/borderRadius:\s*(?:1[0-9]|[2-9][0-9])\b/g)]
  .filter(match=>!match[0].includes("99"));
const legacyStructuralColors=["#0a0a1e","#07071a","#1e1e40","#1e1e38","#12122a","#10102a","#151530"];
const remainingLegacyChrome=[
  "#08081d","#171735","#10102b","#2a2a50","#14142a","#16143a","#101024",
  "#242447","#15152e","#12122e","#1a1a35","#08081a","#181832","#14142e",
  "#17172f","#141430","#050515","#06061a","#09091f","#09091d","#161632",
];

const requirements=[
  [identity.includes("export const VIEW_PRESENTATION"),"shared view-presentation configuration must exist"],
  [authenticatedViews.every(view=>identity.includes(`${view}:`)),"all eight signed-in views must have identity metadata"],
  [identity.includes("export default function ViewIdentityBar"),"shared view identity component must exist"],
  [identity.includes("earned-view-identity__title")&&identity.includes("earned-view-identity__status"),
    "view identity must expose title and live status regions"],
  [app.includes('import ViewIdentityBar from "./ViewIdentityBar.jsx"'),"App must import the shared view identity"],
  [app.includes("<ViewIdentityBar")&&app.includes("trackingMode={trackingMode}")&&app.includes("sessionCount={progressHistory.length}"),
    "App must wire live training context into the view identity"],
  [app.includes('className={`earned-page earned-page--${view}`}'),"every signed-in view must render inside the shared page wrapper"],
  [["--earned-surface-0","--earned-surface-1","--earned-surface-2","--earned-line-soft","--earned-line-strong","--earned-radius-panel","--earned-radius-control"].every(token=>css.includes(token)),
    "premium product surface and geometry tokens must exist"],
  [/\.earned-app-shell\s*\{[\s\S]*?width:\s*min\(100%,\s*1180px\)/.test(css),
    "signed-in product shell must use the wider 1180px canvas"],
  [css.includes(".earned-view-identity")&&css.includes(".earned-view-identity__meta"),
    "view identity must define its desktop composition"],
  [css.includes(".earned-page input")&&css.includes(".earned-page select")&&css.includes(".earned-page textarea"),
    "page-scoped form controls must share the premium control system"],
  [css.includes('.earned-page div[style*="background"][style*="border"]'),
    "legacy inline operational surfaces must be normalized inside signed-in pages"],
  [css.includes(".recharts-cartesian-grid")&&css.includes(".recharts-tooltip-wrapper"),
    "chart grid and tooltip treatments must match the product system"],
  [/max-width:\s*720px[\s\S]*?\.earned-view-identity/.test(css),
    "view identity must define a dedicated mobile composition"],
  [legacyStructuralColors.every(color=>!app.toLowerCase().includes(color)),
    "legacy blue-purple structural colors must be removed from App.jsx"],
  [remainingLegacyChrome.every(color=>!app.toLowerCase().includes(color)),
    "tracking chrome must not use the retired purple structural palette"],
  [app.includes('className="earned-tracking-mode"')&&css.includes(".earned-tracking-mode__option--active"),
    "weekly and daily tracking must use the shared Earned segmented-control treatment"],
  [app.includes("if(!user||LOCAL_VISUAL_QA) return;")&&app.includes("if(LOCAL_VISUAL_QA){\n      setHistory(nextHistory);"),
    "localhost visual QA must remain isolated from cloud reads and writes"],
  [largeInlineRadii.length===0,"operational inline radii above 8px must be normalized"],
];

const failed=requirements.filter(([passed])=>!passed).map(([,message])=>message);
if(failed.length){
  console.error("Earned premium product UI verification failed:");
  failed.forEach(message=>console.error(`- ${message}`));
  process.exit(1);
}

console.log("Earned premium product UI source contracts verified.");
