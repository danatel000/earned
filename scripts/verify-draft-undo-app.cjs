const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

const appFragments = [
  "const undoInputsRef=useRef(null);",
  "const [undoAvailable,setUndoAvailable]=useState(false);",
  "const commitInputChange=updater=>{",
  "undoInputsRef.current=prev;",
  "const undoLastInputEdit=()=>{",
  "setInputs(previous);",
  "setUndoAvailable(false);",
  "Undo Last Edit",
  "disabled={!undoAvailable}",
];

const missing = [];
for (const fragment of appFragments) {
  if (!app.includes(fragment)) missing.push(`src/App.jsx missing: ${fragment}`);
}

const handlerStart = app.indexOf("  const handleChange=");
const handlerEnd = app.indexOf("  if(saved&&savedEntry)");
if (handlerStart < 0 || handlerEnd < handlerStart) {
  missing.push("Could not locate LogForm mutation handler region.");
} else {
  const handlerRegion = app.slice(handlerStart, handlerEnd);
  if (handlerRegion.includes("setInputs(")) {
    missing.push("LogForm user mutation handlers must use commitInputChange instead of direct setInputs.");
  }
  if ((handlerRegion.match(/commitInputChange\(/g) || []).length < 12) {
    missing.push("Expected at least 12 user mutation paths to use commitInputChange.");
  }
}

const readmeFragments = [
  "Private Draft Undo",
  "one previous workout-input snapshot",
  "No Supabase schema changes are required.",
];
for (const fragment of readmeFragments) {
  if (!readme.includes(fragment)) missing.push(`README.md missing: ${fragment}`);
}

if (missing.length) {
  console.error("Draft Undo verification failed:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Draft Undo verification passed.");
