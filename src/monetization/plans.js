export const PLAN_IDS = Object.freeze({
  FREE: "free",
  PREMIUM: "premium",
});

export const MONETIZATION_MODES = Object.freeze({
  PREVIEW: "preview",
  ENFORCED: "enforced",
});

export const FEATURE_IDS = Object.freeze({
  WORKOUT_LOGGING: "workout_logging",
  RECENT_HISTORY: "recent_history",
  BASIC_ANALYTICS: "basic_analytics",
  COMMUNITY: "community",
  OFFLINE_SYNC: "offline_sync",
  BASIC_EXPORT: "basic_export",
  ADVANCED_ANALYTICS: "advanced_analytics",
  ALL_TIME_HISTORY: "all_time_history",
  CUSTOM_PROGRAMS: "custom_programs",
  PROGRAM_PACKS: "program_packs",
  PROGRESS_INSIGHTS: "progress_insights",
  ADVANCED_EXPORT: "advanced_export",
  ADAPTIVE_TRAINING: "adaptive_training",
  RECOVERY_INTEGRATIONS: "recovery_integrations",
  AI_COACH: "ai_coach",
});

const freeFeatures = Object.freeze([
  FEATURE_IDS.WORKOUT_LOGGING,
  FEATURE_IDS.RECENT_HISTORY,
  FEATURE_IDS.BASIC_ANALYTICS,
  FEATURE_IDS.COMMUNITY,
  FEATURE_IDS.OFFLINE_SYNC,
  FEATURE_IDS.BASIC_EXPORT,
]);

const premiumFeatures = Object.freeze([
  ...freeFeatures,
  FEATURE_IDS.ADVANCED_ANALYTICS,
  FEATURE_IDS.ALL_TIME_HISTORY,
  FEATURE_IDS.CUSTOM_PROGRAMS,
  FEATURE_IDS.PROGRAM_PACKS,
  FEATURE_IDS.PROGRESS_INSIGHTS,
  FEATURE_IDS.ADVANCED_EXPORT,
  FEATURE_IDS.ADAPTIVE_TRAINING,
  FEATURE_IDS.RECOVERY_INTEGRATIONS,
  FEATURE_IDS.AI_COACH,
]);

export const PLANS = Object.freeze({
  [PLAN_IDS.FREE]: Object.freeze({
    id: PLAN_IDS.FREE,
    name: "Free",
    eyebrow: "Everything needed to train",
    price: Object.freeze({monthly: 0, annual: 0}),
    limits: Object.freeze({historyWeeks: 12, customPrograms: 2, customExercises: 5}),
    features: freeFeatures,
  }),
  [PLAN_IDS.PREMIUM]: Object.freeze({
    id: PLAN_IDS.PREMIUM,
    name: "Premium",
    eyebrow: "Train with clarity, not guesswork",
    price: Object.freeze({monthly: 2.99, annual: 19.99}),
    limits: Object.freeze({historyWeeks: null, customPrograms: null, customExercises: null}),
    features: premiumFeatures,
  }),
});

export function getPlan(planId) {
  return PLANS[planId] || PLANS[PLAN_IDS.FREE];
}

export function isPremiumFeature(featureId) {
  return premiumFeatures.includes(featureId) && !freeFeatures.includes(featureId);
}

export function isKnownFeature(featureId) {
  return premiumFeatures.includes(featureId);
}
