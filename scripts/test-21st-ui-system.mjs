import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";

const root=new URL("../",import.meta.url);
const read=path=>readFileSync(new URL(path,root),"utf8");

const expectedFiles=[
  "src/components/experience/EarnedInterfaceKit.jsx",
  "src/components/experience/LaunchFeatureMatrix.jsx",
  "src/components/experience/LaunchProductGallery.jsx",
  "src/components/experience/LaunchProofCarousel.jsx",
  "src/styles-21st.css",
  "ui-upgrade-log.md",
];

for(const path of expectedFiles){
  assert.ok(existsSync(new URL(path,root)),`${path} must exist`);
}

const kit=read("src/components/experience/EarnedInterfaceKit.jsx");
const launch=read("src/components/experience/PublicLaunch.jsx");
const features=read("src/components/experience/LaunchFeatureMatrix.jsx");
const gallery=read("src/components/experience/LaunchProductGallery.jsx");
const proof=read("src/components/experience/LaunchProofCarousel.jsx");
const motion=read("src/components/experience/motion/MotionOrchestrator.jsx");
const styles=`${read("src/styles.css")}\n${read("src/styles-21st.css")}`;
const log=read("ui-upgrade-log.md");

for(const component of ["EarnedSignalCard","EarnedKineticButton","EarnedMetricBars","EarnedSignalText"]){
  assert.match(kit,new RegExp(`(?:function|const|export function)\\s+${component}|export\\s*\\{[^}]*${component}`),
    `${component} must be implemented in the shared interface kit`);
}

for(const component of ["LaunchFeatureMatrix","LaunchProductGallery","LaunchProofCarousel"]){
  assert.match(launch,new RegExp(`<${component}`),`${component} must be rendered on the launch page`);
}

assert.match(features,/TRAINING SYSTEM|TRAINING SIGNAL/i,
  "Feature matrix must explain real Earned training value");
assert.match(gallery,/aria-(?:label|pressed|controls)/,
  "Product gallery must expose accessible control semantics");
assert.match(proof,/aria-live|aria-label/,
  "Proof carousel must expose accessible status or labels");
assert.doesNotMatch(proof,/Sarah|Michael|Jessica|five stars|5 stars/i,
  "Proof carousel must not fabricate customer testimonials");
assert.doesNotMatch(proof,/arrow="\\u\d{4}"/,
  "JSX arrow props must not render unicode escape text literally");
assert.match(motion,/const updateScroll=\(\)=>\{\s*revealInViewport\(\);\s*if\(scrollFrame\)/,
  "Every scroll position must check reveals before frame-throttling progress updates");

for(const selector of [
  ".earned-signal-card",
  ".earned-feature-matrix",
  ".earned-product-gallery",
  ".earned-proof-carousel",
]){
  assert.ok(styles.includes(selector),`${selector} must have production styling`);
}

assert.match(styles,/@media \(max-width:\s*640px\)[\s\S]*earned-feature-matrix/,
  "New launch sections must include mobile layout rules");
assert.match(styles,/@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*earned-signal-card/,
  "New interaction primitives must include reduced-motion fallbacks");

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
    `ui-upgrade-log.md must document ${category}`);
}

assert.match(log,/Categories processed:\*\*\s*16/,
  "Upgrade summary must report all 16 processed categories");

console.log("Earned 21st.dev UI enhancement contract verified.");
