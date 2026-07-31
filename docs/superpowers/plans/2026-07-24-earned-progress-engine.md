# Earned Progress Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an original, cinematic launch-page hero for Earned that turns the existing ASCII barbell scene into a clear product and conversion story.

**Architecture:** Keep the launch page in `PublicLaunch.jsx`, introduce only semantic presentation markup, and add responsive CSS to layer the trajectory grid, telemetry, and product-preview band. A small source-contract verifier protects the critical labels, CTA destinations, and accessibility fallback from accidental regressions.

**Tech Stack:** React, Vite, CSS, existing Earned motion and ASCII components, Node source-contract scripts.

## Global Constraints

- Preserve existing authentication and workout behavior.
- Keep the work local; do not push or update the GitHub repository.
- Do not add dependencies or copy third-party source/assets.
- Respect `prefers-reduced-motion` and keep the content readable without animation.

---

### Task 1: Launch-page contract test

**Files:**
- Create: `scripts/test-launch-progress-engine.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `src/components/experience/PublicLaunch.jsx`
- Produces: `pnpm test:launch` verification command

- [ ] **Step 1: Write the failing test**

```js
assert.match(source, /earned-launch__hero-telemetry/);
assert.match(source, /EARNED PROGRESS ENGINE/);
assert.match(source, /earned-launch__preview/);
assert.match(source, /href="#account"/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:launch`

Expected: the command fails because the verifier and hero elements do not yet exist.

- [ ] **Step 3: Add the script registration**

```json
"test:launch": "node scripts/test-launch-progress-engine.mjs"
```

- [ ] **Step 4: Run test to verify the missing launch contract fails**

Run: `pnpm test:launch`

Expected: FAIL with a missing telemetry or preview assertion.

### Task 2: Hero telemetry and product-preview story

**Files:**
- Modify: `src/components/experience/PublicLaunch.jsx`

**Interfaces:**
- Consumes: `EarnedAsciiScene`, `scrollToAccount`, existing `#system` and `#account` targets
- Produces: `.earned-launch__hero-telemetry` and `.earned-launch__preview` semantic elements

- [ ] **Step 1: Implement the minimal semantic hero content**

```jsx
<aside className="earned-launch__hero-telemetry" aria-label="Earned training signal">
  <span>LIVE TRAINING SIGNAL</span>
  <strong>EARNED PROGRESS ENGINE</strong>
  <p>Track the work. See the proof.</p>
</aside>
```

- [ ] **Step 2: Add a product-preview band after the proof section**

```jsx
<section className="earned-launch__preview" aria-labelledby="preview-title">
  <span>01 / TRAIN. 02 / PROGRESS. 03 / PROOF.</span>
  <h2 id="preview-title">A record that gets stronger with you.</h2>
</section>
```

- [ ] **Step 3: Run focused test**

Run: `pnpm test:launch`

Expected: PASS.

### Task 3: Responsive visual system and reduced-motion fallback

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `.earned-launch__hero`, `.earned-ascii-scene`, `.earned-launch__hero-telemetry`, `.earned-launch__preview`
- Produces: trajectory-grid background, dithered preview frame, responsive desktop/mobile layouts, reduced-motion rules

- [ ] **Step 1: Add the desktop visual treatment**

```css
.earned-launch__hero::before { content: ""; pointer-events: none; }
.earned-launch__hero-telemetry { position: absolute; }
.earned-launch__preview { position: relative; overflow: clip; }
```

- [ ] **Step 2: Add compact viewport rules**

```css
@media (max-width: 720px) {
  .earned-launch__hero-telemetry { position: relative; }
  .earned-launch__preview { min-height: auto; }
}
```

- [ ] **Step 3: Add reduced-motion fallback**

```css
@media (prefers-reduced-motion: reduce) {
  .earned-launch__hero::before,
  .earned-launch__preview::before { animation: none; }
}
```

- [ ] **Step 4: Run focused and ASCII verification**

Run: `pnpm test:launch; pnpm test:ascii`

Expected: PASS.

### Task 4: Build and visual verification

**Files:**
- Verify: `dist/index.html`

**Interfaces:**
- Consumes: Vite production build
- Produces: deployable launch page output

- [ ] **Step 1: Build production output**

Run: `pnpm build`

Expected: Vite completes successfully.

- [ ] **Step 2: Run full application verification**

Run: `pnpm verify`

Expected: all existing verifiers pass.

- [ ] **Step 3: Check desktop and mobile launch composition**

Run local preview and inspect the public launch page at desktop and compact widths. Confirm headline, CTA, telemetry, preview content, and account section remain readable and interactive.
