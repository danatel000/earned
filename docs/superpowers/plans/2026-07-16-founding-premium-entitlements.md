# Founding Premium Entitlements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permanently unlock every configured Premium feature for `danatel` and `rafael` while retaining normal access behavior for everyone else.

**Architecture:** Add an account-aware founding-entitlement resolver to `src/monetization/entitlements.js`, then pass the authenticated username from `src/App.jsx` into the existing feature access calls. The resolver runs before preview and paid-subscription logic; its result is limited to known Premium features from `plans.js`.

**Tech Stack:** React, JavaScript ES modules, Vite, existing Node verification scripts.

## Global Constraints

- Preserve all existing workout, account, and subscription data.
- Do not represent this entitlement as a completed payment or server-verified subscription.
- Grant only registered Premium features; unknown feature IDs remain denied.
- Normalize usernames before matching.

---

### Task 1: Add And Verify The Founding Entitlement Resolver

**Files:**
- Modify: `src/monetization/entitlements.js`
- Modify: `scripts/test-monetization-core.mjs`

**Interfaces:**
- Produces: `isFoundingPremiumAccount(username): boolean`
- Produces: `resolveFeatureAccess(featureId, subscription, mode, accountContext): AccessResult`
- Consumes: `FEATURE_IDS`, `isKnownFeature`, and `isPremiumFeature` from `src/monetization/plans.js`

- [ ] **Step 1: Write failing entitlement assertions**

Add tests that call:

```js
resolveFeatureAccess(
  FEATURE_IDS.ADVANCED_ANALYTICS,
  createFreeSubscription(),
  MONETIZATION_MODES.ENFORCED,
  {username: "danatel"},
)
```

and assert `{allowed: true, isPreview: false, reason: "founding_premium"}`. Repeat for `rafael`, verify `other_user` remains blocked in enforced mode, and verify an unknown feature remains denied for `danatel`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm run test:iop`

Expected: the new founding entitlement assertions fail because the resolver has no account context support.

- [ ] **Step 3: Implement the minimum resolver**

Add a frozen normalized username allowlist and:

```js
export function isFoundingPremiumAccount(username) {
  return FOUNDING_PREMIUM_USERNAMES.has(String(username || "").trim().toLowerCase());
}
```

Extend `resolveFeatureAccess` with a fourth `accountContext = {}` parameter. After the known-feature check and before subscription checks, return the `founding_premium` access result when the feature requires Premium and `isFoundingPremiumAccount(accountContext.username)` is true.

- [ ] **Step 4: Run entitlement tests**

Run: `pnpm run test:iop`

Expected: monetization core and recovery contract verification pass.

### Task 2: Wire Authenticated Identity Into The App And Verify The Build

**Files:**
- Modify: `src/App.jsx`
- Modify: `scripts/verify-monetization-ui.cjs`

**Interfaces:**
- Consumes: `resolveFeatureAccess(featureId, subscription, mode, {username})`
- Produces: account-aware access props for Premium UI gates.

- [ ] **Step 1: Add a UI verifier assertion**

Check that `src/App.jsx` passes the active authenticated username as `{username: authUser.username}` to the access resolver calls.

- [ ] **Step 2: Run the verifier to verify it fails**

Run: `pnpm run verify`

Expected: UI verification fails until the access calls include username context.

- [ ] **Step 3: Wire feature access context**

Update each `resolveFeatureAccess` call in `App` to pass a shared account-context object based on `authUser?.username`. Keep existing subscription and monetization mode arguments unchanged.

- [ ] **Step 4: Run complete verification**

Run: `pnpm run verify`

Expected: all feature verifiers pass.

- [ ] **Step 5: Build production output**

Run: `pnpm run build`

Expected: Vite completes successfully. A bundle-size warning is acceptable if the build succeeds.
