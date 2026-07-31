import {describe, expect, it} from "vitest";
import {FEATURE_IDS, isPremiumFeature} from "../../src/monetization/plans.js";

describe("Coach entitlement", () => {
  it("registers AI Coach as a premium feature", () => {
    expect(FEATURE_IDS.AI_COACH).toBe("ai_coach");
    expect(isPremiumFeature(FEATURE_IDS.AI_COACH)).toBe(true);
  });
});
