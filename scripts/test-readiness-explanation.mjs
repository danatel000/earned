import assert from "node:assert/strict";
import { buildReadinessExplanation } from "../src/analytics/readinessExplanation.js";

const prepared=buildReadinessExplanation({sleep:4,energy:5,soreness:1,volumeDeltaPct:8});
assert.equal(prepared.positive,"Energy is supporting the planned work.","high energy should explain the strongest readiness support");
assert.equal(prepared.limiting,"No major limiter is logged right now.","a stable session should not invent a limiter");

const constrained=buildReadinessExplanation({sleep:2,energy:2,soreness:4,volumeDeltaPct:35});
assert.equal(constrained.limiting,"High soreness is the main reason to protect quality.","soreness should take priority over a volume warning");
assert.match(constrained.summary,/High soreness/,"the summary should name the decision-driving input");

const volumeJump=buildReadinessExplanation({sleep:3,energy:3,soreness:3,volumeDeltaPct:30});
assert.equal(volumeJump.limiting,"Live volume is already rising quickly versus your last session.","a large volume jump should be visible before a user adds more work");

console.log("Earned readiness explanation contract verified.");
