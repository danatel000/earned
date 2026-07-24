const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "..", "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(__dirname, "..", "README.md"), "utf8");
const combined = `${app}\n${readme}`;

const required = [
  "function liftInputFromLastLogged",
  "getLastLiftForExercise(history,ex.id)?.lift",
  "liftInputFromLastLogged(history,ex)",
  "Skipped exercises still prefill from the last logged lift",
];

const forbidden = [
  "const last=history[history.length-1];\r\n    const init={};\r\n    for(const ex of allExercises(dk,customEx)){\r\n      const p=last?.exercises[ex.id];",
  "const last=history[history.length-1]?.exercises[ex.id];\r\n            dayInputs[ex.id]=last",
];

const missing = required.filter(fragment => !combined.includes(fragment));
const presentForbidden = forbidden.filter(fragment => app.includes(fragment));

if (missing.length || presentForbidden.length) {
  if (missing.length) {
    console.error("Missing skip-prefill fragments:");
    for (const fragment of missing) console.error(`- ${fragment}`);
  }
  if (presentForbidden.length) {
    console.error("Found old latest-week-only prefill fragments:");
    for (const fragment of presentForbidden) console.error(`- ${fragment.slice(0, 80)}...`);
  }
  process.exit(1);
}

console.log("Skip prefill app fragments verified.");
