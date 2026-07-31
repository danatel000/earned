# IOP Monetization MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an honest Free/Premium product structure, clean upgrade experience, reusable feature gates, retention hooks, and future recovery-integration contracts without changing workout data or pretending payments are active.

**Architecture:** Pure monetization modules define plans, entitlements, billing-provider behavior, and referrals. React presentation components consume those modules while `App.jsx` owns only transient pricing/preview state and passes access decisions into existing views. The default `preview` mode preserves all current access; a future server-verified subscription can switch the same gates to enforced mode.

**Tech Stack:** React 19, Vite, Supabase Auth, Node built-in assertions, existing source-fragment verifiers.

## Global Constraints

- Workout logging, drafts, offline support, cloud sync, and basic backup remain Free.
- Existing workout history is never deleted or rewritten by monetization code.
- A client-created subscription may only have `free` or explicitly labeled `preview` status.
- `active` or `trialing` paid access is valid only when its source is `server` and a provider is present.
- No payment, AI recommendation, wearable data, discount, or referral reward may be fabricated.
- Upgrade UI must not interrupt active workout logging.
- Production defaults to `preview` mode until secure billing and server entitlements exist.

---

### Task 1: Monetization Domain Core

**Files:**
- Create: `src/monetization/plans.js`
- Create: `src/monetization/entitlements.js`
- Create: `src/monetization/billingProvider.js`
- Test: `scripts/test-monetization-core.mjs`

**Interfaces:**
- Produces `PLAN_IDS`, `FEATURE_IDS`, `PLANS`, `MONETIZATION_MODES`, and `getPlan`.
- Produces `createFreeSubscription`, `createPreviewSubscription`, `normalizeSubscription`, `isServerVerifiedPaidSubscription`, and `resolveFeatureAccess`.
- Produces `placeholderBillingProvider` whose checkout and portal methods resolve to `{ok:false, code:"not_configured"}`.

- [ ] Write assertions for plan prices, Free logging access, Premium-only analytics, preview-mode preservation, enforced-mode denial, server-paid access, and the unconfigured billing result.
- [ ] Run `node scripts/test-monetization-core.mjs` and confirm it fails because the modules do not exist.
- [ ] Implement the three pure modules with no React, browser, or Supabase dependencies.
- [ ] Run the test again and confirm all assertions pass.

### Task 2: Pricing Experience and Feature Gates

**Files:**
- Create: `src/components/monetization/PricingView.jsx`
- Create: `src/components/monetization/PremiumGate.jsx`
- Create: `src/components/monetization/UpgradePrompt.jsx`
- Modify: `src/App.jsx`
- Test: `scripts/verify-monetization-ui.cjs`

**Interfaces:**
- `PricingView({open, onClose, subscription, onStartPreview})` renders Free/Premium comparison, monthly/annual controls, honest preview copy, and no payment claim.
- `PremiumGate({access, title, description, onUpgrade, children})` renders children in preview/paid access and a compact upgrade card only in enforced Free mode.
- `UpgradePrompt({title, description, onUpgrade, onDismiss, compact})` renders a contextual, dismissible CTA.

- [ ] Add a source verifier for imports, pricing state, header CTA, analytics gate, program-pack gate, and post-workout prompt; confirm it fails.
- [ ] Implement the three components using the app's existing dark theme and compact card conventions.
- [ ] Add transient subscription/preview/pricing state to `App.jsx`; do not persist paid status in workout data.
- [ ] Gate the advanced analytics cluster and Premium Program Packs while preserving access in preview mode.
- [ ] Add a header `Explore Premium` badge and a dismissible post-workout insight prompt.
- [ ] Run the UI verifier, monetization core test, all existing verifiers, and `pnpm run build`.

### Task 3: Social Retention and Referral Path

**Files:**
- Create: `src/monetization/referrals.js`
- Create: `src/components/monetization/InviteTrainingPartner.jsx`
- Modify: `src/App.jsx`
- Test: `scripts/test-monetization-core.mjs`
- Test: `scripts/verify-monetization-ui.cjs`

**Interfaces:**
- `buildReferralLink({origin, username})` returns a same-origin URL containing a sanitized `ref` query parameter.
- `buildReferralShare({origin, username})` returns `{title,text,url}` and never promises a reward.
- `InviteTrainingPartner({username})` uses native sharing when available and clipboard copy otherwise.

- [ ] Add failing referral-link assertions and UI source checks.
- [ ] Implement the pure referral helpers and compact Feed invitation component.
- [ ] Render the invitation near the top of Community without altering existing public-feed data.
- [ ] Run the focused tests, all verifiers, and production build.

### Task 4: Future Recovery and Adaptive-Training Contracts

**Files:**
- Create: `src/integrations/recovery.js`
- Create: `src/components/monetization/RecoveryIntegrationPreview.jsx`
- Modify: `src/App.jsx`
- Test: `scripts/test-recovery-contracts.mjs`
- Test: `scripts/verify-monetization-ui.cjs`

**Interfaces:**
- `createEmptyRecoverySnapshot()` returns null metrics and `connected:false`.
- `normalizeRecoverySnapshot(value)` accepts only finite, physiologically plausible optional values.
- `createUnavailableRecoveryProvider(kind)` reports unavailable status and never returns invented readings.
- `buildAdaptiveTrainingContext({history, goals, recovery})` packages real app inputs without generating a recommendation.
- `RecoveryIntegrationPreview()` explains HRV, sleep, readiness, and recovery plans with `Not connected` status.

- [ ] Add failing contract tests for empty data, normalization, unavailable providers, and non-generated recommendations.
- [ ] Implement the pure recovery integration boundary.
- [ ] Add one restrained Goals-screen preview card; do not add fake Connect controls.
- [ ] Run focused tests, all verifiers, and production build.

### Task 5: Final Regression and Browser Verification

**Files:**
- Modify: `package.json`
- Modify: `README.md`

**Interfaces:**
- `pnpm run test:iop` runs both behavior tests and the UI verifier.
- `pnpm run verify` runs every `verify-*.cjs` script.

- [ ] Add deterministic IOP and full-verifier scripts to `package.json`.
- [ ] Document preview mode, plan truth, and the future secure-billing handoff in `README.md`.
- [ ] Run `pnpm run test:iop`, `pnpm run verify`, and `pnpm run build` from a clean process.
- [ ] Start a persistent Vite preview on an unused localhost port and confirm HTTP 200.
- [ ] Inspect desktop and mobile layouts in the browser, check console errors, and verify pricing open/close, annual/monthly switching, Premium Preview, contextual gates, referral sharing fallback, and recovery placeholder copy.
