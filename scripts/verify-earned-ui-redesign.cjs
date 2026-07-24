const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const read=file=>{
  const absolute=path.join(root,file);
  return fs.existsSync(absolute)?fs.readFileSync(absolute,"utf8"):"";
};

const app=read("src/App.jsx");
const css=read("src/styles.css");
const launch=read("src/components/experience/PublicLaunch.jsx");
const command=read("src/components/experience/DashboardCommandCenter.jsx");
const navigation=read("src/components/experience/AppNavigation.jsx");
const celebration=read("src/components/experience/WorkoutCelebration.jsx");
const pricing=read("src/components/monetization/PricingView.jsx");
const gate=read("src/components/monetization/PremiumGate.jsx");
const upgrade=read("src/components/monetization/UpgradePrompt.jsx");

const required=[
  [launch.includes("export default function PublicLaunch"),"PublicLaunch component must exist"],
  [launch.includes(">EARNED<"),"public launch must use EARNED as its literal H1"],
  [launch.includes("Start training"),"public launch must provide a Start training CTA"],
  [launch.includes('id="account"'),"public launch must provide an account destination"],
  [launch.includes('aria-label="Username"'),"username field must have an accessible label"],
  [launch.includes('aria-label="Password"'),"password field must have an accessible label"],
  [command.includes("export default function DashboardCommandCenter"),"dashboard command center must exist"],
  [command.includes("Start workout"),"dashboard must provide a one-tap Start workout action"],
  [command.includes("Resume workout"),"dashboard must provide a draft Resume workout action"],
  [navigation.includes("export default function AppNavigation"),"app navigation component must exist"],
  [navigation.includes("aria-current"),"active navigation must expose aria-current"],
  [celebration.includes("export default function WorkoutCelebration"),"workout celebration must exist"],
  [celebration.includes('role="dialog"'),"workout celebration must use dialog semantics"],
  [celebration.includes("isPR"),"workout celebration must support real PR feedback"],
  [pricing.includes('className="earned-pricing"'),"pricing must use the Earned presentation system"],
  [pricing.includes("Payments are not live yet"),"pricing must keep the honest payment disclaimer"],
  [gate.includes("earned-premium-gate"),"premium gates must use the Earned presentation system"],
  [upgrade.includes("earned-upgrade"),"upgrade prompts must use the Earned presentation system"],
  [app.includes('from "./components/experience/PublicLaunch.jsx"'),"App must import PublicLaunch"],
  [app.includes("<DashboardCommandCenter"),"App must render DashboardCommandCenter"],
  [app.includes("<AppNavigation"),"App must render AppNavigation"],
  [app.includes("<WorkoutCelebration"),"App must render WorkoutCelebration"],
  [app.includes('className="earned-system-state"'),"loading and failure views must use action-led system states"],
  [app.includes('className="earned-app-shell"'),"authenticated app must use the Earned shell"],
  [app.includes("const bestVol=Math.max(0,...history.map"),"SummaryStrip must define bestVol from history"],
  [app.includes('<details className="earned-disclosure"'),"dashboard must group depth behind progressive disclosure"],
  [app.includes("Performance Lab"),"dashboard must label the Premium performance lab"],
  [app.includes("Progress & Rewards"),"dashboard must label progress and reward details"],
  [app.includes("Detailed Volume Charts"),"dashboard must label detailed chart history"],
  [app.includes('{view==="lifts"&&('),"summary cards must stay off the workout-first Today view"],
  [app.includes('className="earned-starter"'),"starter onboarding must use the compact Earned path"],
  [css.includes(":root"),"CSS must define Earned design tokens"],
  [css.includes(".earned-launch"),"CSS must style the public launch"],
  [css.includes(".earned-command"),"CSS must style the workout command center"],
  [css.includes(".earned-disclosure"),"CSS must style dashboard disclosures"],
  [css.includes(".earned-pricing"),"CSS must style Premium pricing"],
  [css.includes(".earned-system-state"),"CSS must style loading and failure states"],
  [css.includes(".earned-starter"),"CSS must style compact starter onboarding"],
  [css.includes("@media (max-width: 640px)"),"CSS must provide a mobile breakpoint"],
  [css.includes("prefers-reduced-motion"),"CSS must respect reduced-motion preferences"],
];

const failures=required.filter(([ok])=>!ok).map(([,message])=>message);
if(app.includes('letterSpacing:"-')) failures.push("App text must not use negative letter spacing");
if(failures.length){
  console.error("Earned UI redesign verification failed:");
  failures.forEach(failure=>console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Earned UI redesign verification passed.");
