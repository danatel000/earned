# Earned Glyph Forge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Earned's public hero into a detailed, GPU-native ASCII training visualization while preserving product clarity, mobile performance, accessibility, and all workout behavior.

**Architecture:** Split scene construction and shader composition into focused modules. Render detailed Three.js geometry to one offscreen render target, then composite it through a custom glyph-atlas shader into the existing visible canvas. Keep CPU ASCII and static art as fallbacks.

**Tech Stack:** React, Three.js, WebGL render targets, GLSL shaders, CanvasTexture glyph atlas, CSS, Node tests, Playwright/Chrome visual QA.

## Global Constraints

- Keep one visible canvas and one dynamically imported Three.js dependency.
- Add no GSAP, Lenis, React Three Fiber, post-processing package, or custom cursor.
- Keep all essential copy and controls in semantic HTML.
- Preserve account, workout, goal, Supabase, analytics, and tracking-mode behavior.
- Cap desktop DPR at 1.5 and mobile DPR at 1.
- Pause offscreen/hidden rendering and dispose every geometry, material, texture, render target, listener, observer, and animation frame.
- Reduced motion must render one stable frame.

---

### Task 1: Quality Contracts

**Files:**
- Modify: `scripts/test-ascii-renderer.mjs`
- Modify: `scripts/verify-earned-ascii-training-engine.cjs`
- Modify: `scripts/qa-earned-ascii-browser.cjs`

**Interfaces:**
- Consumes: pure render-tier helpers and source files.
- Produces: failing contracts for GPU glyph composition, detailed geometry, resource cleanup, responsive budgets, and browser edge/color density.

- [ ] Add unit assertions for `resolveGlyphForgeBudget({compact,reducedMotion})` covering DPR, particle count, cell size, spoke count, and ghost count.
- [ ] Add source assertions for `WebGLRenderTarget`, `CanvasTexture`, `ShaderMaterial`, two render calls, shader uniforms, detailed scene handles, and texture/render-target disposal.
- [ ] Add browser image metrics for edge transitions and quantized color bands.
- [ ] Run tests and confirm failure because the Glyph Forge modules do not exist.

### Task 2: Glyph Forge Shader Pipeline

**Files:**
- Create: `src/components/experience/ascii/glyphForgeShaders.js`
- Modify: `src/components/experience/ascii/asciiMath.js`

**Interfaces:**
- Produces: `GLYPH_FORGE_RAMP`, `resolveGlyphForgeBudget(options)`, `createGlyphAtlas(THREE)`, `GLYPH_VERTEX_SHADER`, `GLYPH_FRAGMENT_SHADER`, and `createGlyphComposer(THREE,renderer,budget)`.

- [ ] Implement deterministic render-tier budgets.
- [ ] Generate a horizontal glyph atlas with measured centered characters and nearest filtering.
- [ ] Implement luminance-based glyph selection, source-color retention, edge emphasis, alpha suppression, scan modulation, and source-image blending.
- [ ] Return explicit `render(scene,camera,time)`, `resize(width,height,dpr)`, and `dispose()` methods.
- [ ] Run helper and source tests until the shader pipeline contracts pass.

### Task 3: Detailed Strength Sculpture

**Files:**
- Create: `src/components/experience/ascii/createStrengthSculpture.js`

**Interfaces:**
- Consumes: `THREE` and a Glyph Forge budget.
- Produces: `{root, handles, geometries, materials}` where handles expose plate stacks, rings, pulses, paths, ghosts, and particles.

- [ ] Build shaft, knurl rings, sleeves, collars, plate bodies, rims, hubs, spokes, edge marks, and center lock.
- [ ] Build three curved load paths, traveling pulses, orbital rings, deterministic particles, depth stars, ghost positions, and measurement brackets.
- [ ] Reuse geometry/material instances where possible and register every resource for cleanup.
- [ ] Run source contracts and production build.

### Task 4: Multi-Pass Scene Integration

**Files:**
- Modify: `src/components/experience/ascii/EarnedAsciiScene.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `createGlyphComposer()` and `createStrengthSculpture()`.
- Produces: responsive multi-pass animation, richer telemetry, and all existing fallbacks.

- [ ] Replace inline geometry with the sculpture module.
- [ ] Render the 3D scene through the glyph composer and keep the CPU `<pre>` as a secondary layer.
- [ ] Animate plate expansion, force pulses, ghost positions, path intensity, rings, pointer depth, and scroll choreography.
- [ ] Add phase and vector telemetry without fake user metrics.
- [ ] Tune CSS hierarchy so ASCII feels integrated but never harms headline/CTA contrast.
- [ ] Keep mobile and reduced-motion paths explicit.

### Task 5: Verification And Iteration

**Files:**
- Modify only files implicated by failures.

**Interfaces:**
- Consumes: production build served at the stable local preview.
- Produces: verified screenshots and test evidence.

- [ ] Run ASCII unit tests and all feature verifiers.
- [ ] Run monetization and recovery contracts.
- [ ] Run the production build and HTTP asset smoke tests.
- [ ] Run desktop/mobile/reduced-motion/authenticated browser QA.
- [ ] Inspect hero screenshots for object framing, ASCII legibility, text contrast, visual balance, and out-of-place decoration.
- [ ] Iterate and rerun until all quantitative and visual checks pass.

