const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "..", "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(__dirname, "..", "README.md"), "utf8");
const combined = `${app}\n${readme}`;

const required = [
  "function buildJointStressGuardrails",
  "function JointStressGuardrails",
  "buildJointStressGuardrails(history,customEx)",
  "jointStressGuardrails",
  "Joint Stress Guardrails",
  "Guardrail Score",
  "Load Spike",
  "Pressure Zones",
  "Coach Cue",
  "Not medical advice",
  "Private joint stress guardrails",
  "No Supabase schema changes",
];

const missing = required.filter(fragment => !combined.includes(fragment));

if (missing.length) {
  console.error("Missing joint stress guardrails fragments:");
  for (const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

console.log("Joint stress guardrails fragments verified.");
