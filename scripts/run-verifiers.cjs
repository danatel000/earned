const { readdirSync } = require("fs");
const { join } = require("path");
const { spawnSync } = require("child_process");

const scriptsDir=__dirname;
const verifiers=readdirSync(scriptsDir)
  .filter(name=>name.startsWith("verify-")&&name.endsWith(".cjs"))
  .sort();

for(const verifier of verifiers){
  const result=spawnSync(process.execPath,[join(scriptsDir,verifier)],{stdio:"inherit"});
  if(result.status!==0){
    console.error(`Verifier failed: ${verifier}`);
    process.exit(result.status||1);
  }
}

console.log(`All ${verifiers.length} feature verifiers passed.`);
