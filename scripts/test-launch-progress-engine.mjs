import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(new URL("../src/components/experience/PublicLaunch.jsx",import.meta.url),"utf8");
const styles=readFileSync(new URL("../src/styles.css",import.meta.url),"utf8");

assert.doesNotMatch(source,/earned-launch__hero-telemetry/,
  "Launch hero must not crowd the barbell scene with telemetry");
assert.doesNotMatch(source,/EARNED PROGRESS ENGINE/,
  "Launch hero must not show the removed progress-engine label");
assert.match(source,/earned-launch__preview/,
  "Launch page must connect its promise to an in-product preview");
assert.match(source,/href="#account"/,
  "Launch experience must keep a direct account entry destination");
assert.match(source,/earned-system__field/,
  "System section must expose a decorative background field");
assert.match(source,/earned-account__field/,
  "Account section must expose a quieter conversion background field");
assert.match(styles,/earned-system__field/,
  "System field needs launch styling");
assert.match(styles,/earned-account__field/,
  "Account field needs launch styling");

console.log("Earned Progress Engine launch contract verified.");
