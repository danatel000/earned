const fs=require("fs");
const path=require("path");

const source=fs.readFileSync(path.join(__dirname,"smoke-preview.cjs"),"utf8");
const required=[
  "let stopping = false",
  "preview.once(\"close\"",
  "process.exitCode = code",
  "if (stopping) return",
];

const missing=required.filter(fragment=>!source.includes(fragment));
if(missing.length){
  console.error("Missing safe preview shutdown fragments:");
  for(const fragment of missing) console.error(`- ${fragment}`);
  process.exit(1);
}

if(source.includes("setTimeout(() => process.exit(code)")){
  console.error("Preview smoke test still forces process exit while handles may be closing.");
  process.exit(1);
}

console.log("Preview smoke shutdown verifier passed.");
