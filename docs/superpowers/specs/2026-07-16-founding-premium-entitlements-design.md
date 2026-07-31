# Founding Premium Entitlements Design

## Goal

Give the authenticated accounts `danatel` and `rafael` permanent Premium access now and for every Premium feature added later, without modifying their training data or pretending that a payment has been processed.

## Scope

This change affects client-side feature authorization only. The application currently runs its monetization experience in preview mode, but this entitlement must also work after the app changes to enforced billing mode.

## Chosen Approach

Add a dedicated `founding_premium` entitlement source in the monetization layer. A case-insensitive username allowlist resolves `danatel` and `rafael` to this entitlement. `resolveFeatureAccess` receives account identity as an optional context value and grants every known Premium feature to a valid founding account before evaluating preview or paid-subscription access.

This centralizes the exception in one place. Premium gates already call `resolveFeatureAccess`, so future Premium features become available to both accounts as soon as they are added to the Premium plan configuration.

## Data And Security Boundaries

- The existing subscription state remains untouched; it still represents only free, preview, or future billing-provider states.
- Existing local and Supabase workout history, goals, drafts, custom exercises, and social data are not changed.
- Usernames are normalized before comparison to avoid casing or whitespace differences.
- Unknown feature identifiers stay denied. The entitlement unlocks only features explicitly registered as Premium in `plans.js`.
- This is a client-side founding entitlement suitable for the current preview architecture. Before charging real users, the same entitlement should be enforced from a server-owned Supabase profile or entitlement record, because client code cannot protect paid content by itself.

## Acceptance Criteria

1. `danatel` and `rafael` receive `allowed: true`, `requiresPremium: true`, `isPreview: false`, and `reason: "founding_premium"` for every known Premium feature in both preview and enforced modes.
2. Other usernames retain the current free, preview, and server-verified subscription behavior.
3. Free features remain available to all accounts.
4. The React app passes the authenticated username into feature-access resolution.
5. Automated monetization verification covers the entitlement behavior and the production build succeeds.
