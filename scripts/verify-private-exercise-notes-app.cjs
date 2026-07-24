const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "..", "src", "App.jsx"), "utf8");
const readme = fs.readFileSync(path.join(__dirname, "..", "README.md"), "utf8");
const combined = `${app}\n${readme}`;

const required = [
  "function exerciseNotes",
  "function exerciseNoteFor",
  "function ExerciseNotesPanel",
  "exerciseNotes(customEx)",
  "exerciseNoteFor(ex.id,customEx)",
  "exerciseNoteFor(activeFocusExercise.id,customEx)",
  "_exerciseNotes",
  "Private Exercise Notes",
  "Setup Memory",
  "Seat / Grip / Cue",
  "Save Note",
  "handleSaveExerciseNote",
  "onSaveExerciseNote",
  "Exercise notes are private",
  "No Supabase schema changes",
];

const missing = required.filter(fragment => !combined.includes(fragment));

if (missing.length) {
  console.error("Missing private exercise notes fragments:");
  for (const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

console.log("Private exercise notes fragments verified.");
