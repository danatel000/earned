import {
  FEATURE_IDS,
  MONETIZATION_MODES,
  PLAN_IDS,
  getPlan,
  isKnownFeature,
  isPremiumFeature,
} from "./plans.js";

const VALID_STATUSES = new Set(["free", "preview", "trialing", "active", "past_due", "canceled"]);
const VALID_SOURCES = new Set(["default", "local_preview", "server"]);
const VALID_PROVIDERS = new Set(["stripe", "revenuecat", "app_store", "play_store"]);
const FOUNDING_PREMIUM_USERNAMES = new Set(["danatel", "rafael"]);

export function isFoundingPremiumAccount(username) {
  return FOUNDING_PREMIUM_USERNAMES.has(String(username || "").trim().toLowerCase());
}

export function createFreeSubscription() {
  return Object.freeze({
    planId: PLAN_IDS.FREE,
    status: "free",
    source: "default",
    provider: null,
    currentPeriodEnd: null,
  });
}

export function createPreviewSubscription() {
  return Object.freeze({
    planId: PLAN_IDS.PREMIUM,
    status: "preview",
    source: "local_preview",
    provider: null,
    currentPeriodEnd: null,
  });
}

export function normalizeSubscription(value) {
  if (!value || typeof value !== "object") return createFreeSubscription();
  const planId = value.planId === PLAN_IDS.PREMIUM ? PLAN_IDS.PREMIUM : PLAN_IDS.FREE;
  const status = VALID_STATUSES.has(value.status) ? value.status : "free";
  const source = VALID_SOURCES.has(value.source) ? value.source : "default";
  const provider = VALID_PROVIDERS.has(value.provider) ? value.provider : null;
  const currentPeriodEnd = typeof value.currentPeriodEnd === "string" ? value.currentPeriodEnd : null;
  return {planId, status, source, provider, currentPeriodEnd};
}

export function isServerVerifiedPaidSubscription(value) {
  const subscription = normalizeSubscription(value);
  return subscription.planId === PLAN_IDS.PREMIUM
    && subscription.source === "server"
    && subscription.provider !== null
    && (subscription.status === "active" || subscription.status === "trialing");
}

export function resolveFeatureAccess(
  featureId,
  value,
  mode = MONETIZATION_MODES.PREVIEW,
  accountContext = {},
) {
  if (!isKnownFeature(featureId)) {
    return {allowed: false, requiresPremium: false, isPreview: false, reason: "unknown_feature"};
  }

  const subscription = normalizeSubscription(value);
  const requiresPremium = isPremiumFeature(featureId);
  if (!requiresPremium && getPlan(PLAN_IDS.FREE).features.includes(featureId)) {
    return {allowed: true, requiresPremium: false, isPreview: false, reason: "included_free"};
  }
  if (requiresPremium && isFoundingPremiumAccount(accountContext.username)) {
    return {allowed: true, requiresPremium: true, isPreview: false, reason: "founding_premium"};
  }
  if (isServerVerifiedPaidSubscription(subscription)) {
    return {allowed: true, requiresPremium: true, isPreview: false, reason: "server_verified"};
  }
  if (subscription.planId === PLAN_IDS.PREMIUM
      && subscription.status === "preview"
      && subscription.source === "local_preview") {
    return {allowed: true, requiresPremium: true, isPreview: true, reason: "local_preview"};
  }
  if (mode === MONETIZATION_MODES.PREVIEW) {
    return {allowed: true, requiresPremium: true, isPreview: true, reason: "founding_preview"};
  }
  return {allowed: false, requiresPremium: true, isPreview: false, reason: "premium_required"};
}

export function coreLoggingAccess(value, mode) {
  return resolveFeatureAccess(FEATURE_IDS.WORKOUT_LOGGING, value, mode);
}
