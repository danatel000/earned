import assert from "node:assert/strict";
import {
  FEATURE_IDS,
  MONETIZATION_MODES,
  PLAN_IDS,
  getPlan,
} from "../src/monetization/plans.js";
import {
  createFreeSubscription,
  createPreviewSubscription,
  isServerVerifiedPaidSubscription,
  normalizeSubscription,
  resolveFeatureAccess,
} from "../src/monetization/entitlements.js";
import { placeholderBillingProvider } from "../src/monetization/billingProvider.js";
import { buildReferralLink, buildReferralShare } from "../src/monetization/referrals.js";

const freePlan = getPlan(PLAN_IDS.FREE);
const premiumPlan = getPlan(PLAN_IDS.PREMIUM);

assert.equal(freePlan.price.monthly, 0, "Free must remain free");
assert.equal(premiumPlan.price.monthly, 2.99, "Monthly founding price changed unexpectedly");
assert.equal(premiumPlan.price.annual, 19.99, "Annual founding price changed unexpectedly");

const freeSubscription = createFreeSubscription();
assert.equal(
  resolveFeatureAccess(FEATURE_IDS.WORKOUT_LOGGING, freeSubscription, MONETIZATION_MODES.ENFORCED).allowed,
  true,
  "Workout logging must never be paywalled",
);
assert.equal(
  resolveFeatureAccess(FEATURE_IDS.ADVANCED_ANALYTICS, freeSubscription, MONETIZATION_MODES.ENFORCED).allowed,
  false,
  "Enforced Free mode must deny Premium analytics",
);

for (const username of ["danatel", "rafael"]) {
  for (const featureId of premiumPlan.features) {
    if (!freePlan.features.includes(featureId)) {
      const access = resolveFeatureAccess(
        featureId,
        freeSubscription,
        MONETIZATION_MODES.ENFORCED,
        {username},
      );
      assert.equal(access.allowed, true, `${username} must keep Premium access to ${featureId}`);
      assert.equal(access.isPreview, false, `${username} Premium access must not be preview-only`);
      assert.equal(access.reason, "founding_premium", `${username} must receive the founding entitlement`);
    }
  }
}

assert.equal(
  resolveFeatureAccess(
    FEATURE_IDS.ADVANCED_ANALYTICS,
    freeSubscription,
    MONETIZATION_MODES.ENFORCED,
    {username: "another_lifter"},
  ).allowed,
  false,
  "Other Free accounts must retain the normal enforced Premium gate",
);
assert.equal(
  resolveFeatureAccess(
    "future_unregistered_feature",
    freeSubscription,
    MONETIZATION_MODES.ENFORCED,
    {username: "danatel"},
  ).allowed,
  false,
  "Founding access must not unlock unregistered feature IDs",
);

const foundingPreview = resolveFeatureAccess(
  FEATURE_IDS.ADVANCED_ANALYTICS,
  freeSubscription,
  MONETIZATION_MODES.PREVIEW,
);
assert.equal(foundingPreview.allowed, true, "Preview mode must preserve current analytics access");
assert.equal(foundingPreview.isPreview, true, "Preview access must be labeled as preview");
assert.equal(foundingPreview.requiresPremium, true, "Preview access must still identify Premium value");

const previewSubscription = createPreviewSubscription();
assert.equal(previewSubscription.status, "preview");
assert.equal(isServerVerifiedPaidSubscription(previewSubscription), false);

const forgedClientSubscription = normalizeSubscription({
  planId: PLAN_IDS.PREMIUM,
  status: "active",
  source: "local",
  provider: "stripe",
});
assert.equal(
  isServerVerifiedPaidSubscription(forgedClientSubscription),
  false,
  "Client state must not be accepted as paid entitlement truth",
);
assert.equal(
  resolveFeatureAccess(
    FEATURE_IDS.ADVANCED_ANALYTICS,
    forgedClientSubscription,
    MONETIZATION_MODES.ENFORCED,
  ).allowed,
  false,
  "Forged client state must not unlock enforced Premium features",
);

const verifiedSubscription = normalizeSubscription({
  planId: PLAN_IDS.PREMIUM,
  status: "active",
  source: "server",
  provider: "stripe",
  currentPeriodEnd: "2026-08-16T00:00:00.000Z",
});
assert.equal(isServerVerifiedPaidSubscription(verifiedSubscription), true);
assert.equal(
  resolveFeatureAccess(
    FEATURE_IDS.ADVANCED_ANALYTICS,
    verifiedSubscription,
    MONETIZATION_MODES.ENFORCED,
  ).allowed,
  true,
);

assert.equal(getPlan("unknown").id, PLAN_IDS.FREE, "Unknown plans must fall back to Free");

const checkoutResult = await placeholderBillingProvider.startCheckout({
  planId: PLAN_IDS.PREMIUM,
  cadence: "annual",
});
assert.deepEqual(checkoutResult, {
  ok: false,
  code: "not_configured",
  message: "Secure subscriptions are not available yet.",
});

const referralLink = buildReferralLink({
  origin: "https://lift.example/app?old=1",
  username: " Dana Tel!! ",
});
assert.equal(referralLink, "https://lift.example/?ref=danatel");
const referralShare = buildReferralShare({origin: "https://lift.example", username: "Danatel"});
assert.equal(referralShare.url, "https://lift.example/?ref=danatel");
assert.equal(referralShare.title, "Train with me on Earned");
assert.equal(/reward|credit|free premium/i.test(referralShare.text), false,
  "Referral copy must not promise an unimplemented reward");

console.log("Monetization core behavior verified.");
