const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

const app = read("src/App.jsx");
const html = read("index.html");
const manifest = JSON.parse(read("public/manifest.webmanifest"));
const readme = read("README.md");
const pricing = read("src/components/monetization/PricingView.jsx");
const launch = read("src/components/experience/PublicLaunch.jsx");
const referrals = read("src/monetization/referrals.js");
const sw = read("public/sw.js");

const png192 = fs.statSync(path.join(root, "public", "lift-icon-192.png"));
const png512 = fs.statSync(path.join(root, "public", "lift-icon-512.png"));
const svg = read("public/lift-icon.svg");

const required = [
  [html.includes("<title>Earned</title>"), "index.html title must be Earned"],
  [html.includes('content="Earned turns logged workouts into clear lifting progress, goals, and training insight."'), "index.html description must use Earned"],
  [manifest.name === "Earned", "manifest name must be Earned"],
  [manifest.short_name === "Earned", "manifest short_name must be Earned"],
  [manifest.description === "Earned turns logged workouts into clear lifting progress, goals, and training insight.", "manifest description must use Earned"],
  [readme.startsWith("# Earned"), "README title must be Earned"],
  [app.includes("Earned ${getEntryPeriodLabel(entry"), "workout share title must use Earned"],
  [app.includes("Backup file is not valid Earned JSON."), "backup error must use Earned"],
  [launch.includes(">EARNED<")&&app.includes("earned-app-header__brand"), "launch/header brand must use Earned"],
  [pricing.includes("Earned Plans"), "pricing page must use Earned"],
  [referrals.includes("Train with me on Earned"), "referral title must use Earned"],
  [referrals.includes("on Earned and keep each other accountable"), "referral text must use Earned"],
  [sw.includes("earned-app-shell-v"), "service worker cache must use Earned cache name"],
  [svg.includes("Earned logo") || svg.includes("earned logo"), "SVG icon must describe Earned logo"],
  [png192.size > 10000, "192px logo should be replaced with supplied raster art"],
  [png512.size > 50000, "512px logo should be replaced with supplied raster art"],
];

const forbidden = [
  ["Lift Tracker", app, "src/App.jsx"],
  ["Lift Tracker", html, "index.html"],
  ["Lift Tracker", readme, "README.md"],
  ["Lift Tracker", pricing, "PricingView.jsx"],
  ["Lift Tracker", referrals, "referrals.js"],
];

const failures = [];
for (const [ok, message] of required) {
  if (!ok) failures.push(message);
}
for (const [needle, content, label] of forbidden) {
  if (content.includes(needle)) failures.push(`${label} still contains ${needle}`);
}

if (failures.length) {
  console.error("Earned branding verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Earned branding verification passed.");
