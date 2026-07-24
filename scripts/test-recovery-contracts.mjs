import assert from "node:assert/strict";
import {
  buildAdaptiveTrainingContext,
  createEmptyRecoverySnapshot,
  createUnavailableRecoveryProvider,
  normalizeRecoverySnapshot,
} from "../src/integrations/recovery.js";

assert.deepEqual(createEmptyRecoverySnapshot(), {
  connected: false,
  provider: null,
  collectedAt: null,
  sleepHours: null,
  hrvMs: null,
  restingHeartRate: null,
  readinessScore: null,
});

assert.deepEqual(normalizeRecoverySnapshot({
  connected: true,
  provider: "health_connect",
  collectedAt: "2026-07-16T08:00:00.000Z",
  sleepHours: 7.5,
  hrvMs: 62,
  restingHeartRate: 54,
  readinessScore: 81,
}), {
  connected: true,
  provider: "health_connect",
  collectedAt: "2026-07-16T08:00:00.000Z",
  sleepHours: 7.5,
  hrvMs: 62,
  restingHeartRate: 54,
  readinessScore: 81,
});

const rejectedReadings = normalizeRecoverySnapshot({
  connected: true,
  provider: "made_up_watch",
  sleepHours: 40,
  hrvMs: -3,
  restingHeartRate: 500,
  readinessScore: 104,
});
assert.deepEqual(rejectedReadings, createEmptyRecoverySnapshot());

const unavailableProvider = createUnavailableRecoveryProvider("apple_health");
assert.equal(unavailableProvider.isAvailable, false);
assert.deepEqual(await unavailableProvider.readSnapshot(), createEmptyRecoverySnapshot());
assert.deepEqual(await unavailableProvider.connect(), {
  ok: false,
  code: "not_available",
  message: "Apple Health integration is not available in this web app yet.",
});

const context = buildAdaptiveTrainingContext({
  history: [{date: "2026-07-15"}],
  goals: {bench: 225},
  recovery: createEmptyRecoverySnapshot(),
});
assert.equal(context.historyCount, 1);
assert.equal(context.goalCount, 1);
assert.equal(context.canAdapt, false);
assert.equal(context.recommendation, null, "Architecture must not fabricate an AI recommendation");

console.log("Recovery and adaptive-training contracts verified.");
