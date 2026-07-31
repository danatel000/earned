import {describe, expect, it} from "vitest";
import {
  COACH_SCHEMA_VERSION,
  validateCoachAnswer,
  validateCoachRequest,
} from "../../supabase/functions/_shared/coach/contracts.ts";
import {
  DEFAULT_COACH_SETTINGS,
  normalizeCoachSettings,
} from "../../supabase/functions/_shared/coach/settings.ts";
import {answerFixture} from "./fixtures.js";

describe("Coach contracts", () => {
  it("rejects a blank or oversized request", () => {
    expect(validateCoachRequest({action: "ask", message: ""}).ok).toBe(false);
    expect(validateCoachRequest({action: "ask", message: "x".repeat(2001)}).ok).toBe(false);
  });

  it("rejects unknown request actions, modes, and payload shapes", () => {
    expect(validateCoachRequest({action: "invent"}).ok).toBe(false);
    expect(validateCoachRequest({action: "ask", message: "Help", mode: "tomorrow"}).ok).toBe(false);
    expect(validateCoachRequest({action: "ask", message: "Help", payload: []}).ok).toBe(false);
  });

  it("rejects invented executable action ids", () => {
    const result = validateCoachAnswer({
      schemaVersion: COACH_SCHEMA_VERSION,
      requestId: "req-1",
      threadId: "thread-1",
      sections: {groundedGuidance: [], userPattern: [], recommendation: "Hold the load.", whyThisFits: []},
      evidence: {state: "partially_supported", reasons: ["Two sessions available"], missingData: []},
      citations: [],
      provenance: [],
      selectedActionIds: ["model-invented-action"],
    }, new Set(["progression:bench:hold"]));
    expect(result.ok).toBe(false);
  });

  it("rejects invalid citation URLs and unresolved evidence references", () => {
    expect(validateCoachAnswer(answerFixture({citations: [{
      ...answerFixture().citations[0],
      url: "not-a-url",
    }]}), new Set()).ok).toBe(false);

    expect(validateCoachAnswer(answerFixture({sections: {
      ...answerFixture().sections,
      groundedGuidance: [{text: "Progress gradually.", citationIds: ["missing-citation"]}],
    }}), new Set()).ok).toBe(false);

    expect(validateCoachAnswer(answerFixture({sections: {
      ...answerFixture().sections,
      userPattern: [{text: "Your sessions are stable.", provenanceIds: ["missing-provenance"]}],
    }}), new Set()).ok).toBe(false);
  });

  it("defaults to conservative advice and explicit data permissions", () => {
    expect(normalizeCoachSettings({})).toEqual(DEFAULT_COACH_SETTINGS);
    expect(DEFAULT_COACH_SETTINGS.conservativeAdvice).toBe(true);
    expect(DEFAULT_COACH_SETTINGS.permissions.workouts).toBe(true);
    expect(DEFAULT_COACH_SETTINGS.permissions.notes).toBe(false);
  });
});
