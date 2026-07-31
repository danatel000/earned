# Earned Glyph Forge Design

## Intent

Replace Earned's simple transparent barbell plus DOM-character overlay with an authored GPU ASCII experience that feels native to the brand. The result should communicate loading, force, progression, and recorded work before it communicates technology.

## Chosen Direction

Use a two-pass Three.js renderer. The first pass renders a detailed strength sculpture into a WebGL render target. The second pass uses a custom glyph-atlas shader to reconstruct that frame as colored ASCII cells, preserving silhouettes, depth, motion, and object color. A restrained amount of the source render is mixed back beneath the glyphs for dimensional clarity.

No Dragonfly asset, shader, composition, typography, color system, or motion sequence is copied. Earned's visual is an original barbell-and-training-data machine in black, lime, cyan, coral, and white.

## Scene Composition

### Barbell Assembly

- Precision shaft with center and grip knurl bands.
- Sleeves, collars, inner hubs, and six loaded plates.
- Plate rims, inset hubs, radial spokes, and repeating edge marks.
- Independent plate-stack expansion tied to page scroll.
- Controlled breathing rotation and pointer-based camera parallax.

### Training Signal

- Traveling force pulses move from the center toward each plate stack.
- Three curved load-path trails describe acceleration and bar path.
- Orbital progress rings rotate on separate axes.
- A deterministic particle field and depth stars create spatial scale.
- Ghosted prior positions communicate progression without motion blur.
- Vector ticks and measurement brackets reinforce the technical training language.

### Telemetry Layer

DOM readouts remain decorative and truthful: `LOAD PATH`, `FORCE VECTOR`, `REP SIGNAL`, and `PROGRESSION MODEL`. They describe the visualization rather than claiming live user data on the public page. A small phase indicator cycles through `LOAD`, `DRIVE`, `LOCKOUT`, and `EARN` with the scene choreography.

## ASCII Post-Processing

- Generate a runtime glyph atlas from an Earned-specific ramp using a monospace system font.
- Quantize the scene into 8-12 pixel cells depending on viewport and render tier.
- Select glyph density from scene luminance.
- Preserve source hues so lime plates, cyan trajectories, coral load edges, and white steel remain distinguishable.
- Add restrained scanline modulation, depth flicker, and edge emphasis in the shader.
- Keep the background transparent and suppress glyphs where source alpha is empty.
- Retain the DOM ASCII readback at low opacity as a fallback and texture layer, not the primary image.

## Motion Choreography

- Idle motion is slow and mechanical, not floaty.
- A force pulse crosses the shaft on a repeating four-second cycle.
- Plates separate slightly and rings fold as the hero scrolls away.
- Fine-pointer movement changes yaw, pitch, and shallow camera offset.
- Motion is deterministic enough for visual comparison and never changes layout.
- The CTA, headline, and account journey remain outside the renderer and immediately interactive.

## Rendering Tiers

### Desktop

- Pixel ratio capped at 1.5.
- 220-280 particles, detailed plate spokes, three load paths, ghost positions, 60 fps target.
- Glyph cells around 9 pixels.

### Mobile

- Pixel ratio capped at 1.
- 100-140 particles, fewer spoke segments and ghost layers, 30 fps target.
- Glyph cells around 8 pixels.
- Entire barbell remains framed above and behind the copy without obscuring buttons.

### Reduced Motion And Save Data

- Reduced motion renders one detailed stable frame.
- Save-data and WebGL failure use a designed static high-density ASCII barbell.
- Content remains readable and usable when every visual enhancement fails.

## Architecture

- `glyphForgeShaders.js`: glyph ramp, atlas construction, vertex shader, fragment shader, and render-target factory.
- `createStrengthSculpture.js`: creates the detailed scene and returns explicit animated handles plus disposable resources.
- `EarnedAsciiScene.jsx`: owns browser lifecycle, rendering passes, responsive budgets, motion inputs, fallback state, and cleanup.
- `asciiMath.js`: retains pure CPU conversion and authenticated deterministic signals.

## Quality Gates

- Source contracts prove an actual `WebGLRenderTarget`, `ShaderMaterial`, glyph atlas, multi-pass render, and disposal path exist.
- Unit tests validate glyph-grid configuration and deterministic budgets.
- Browser QA verifies a nonblank frame, at least four visible color/luminance bands, substantially higher edge density than the current scene, frame changes under normal motion, pixel-identical reduced-motion frames, mobile framing, zero overflow, and zero console errors.
- Screenshots are inspected at desktop, mobile, and authenticated Today sizes.

## Non-Goals

- No custom cursor, scroll hijacking, audio, fake metrics, fake AI, or additional animation library.
- No WebGL in the authenticated logger.
- No visual effect may delay or cover account access or Start Training.

