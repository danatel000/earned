# Earned ASCII Training Engine Design

## Intent

Translate the most defensible qualities of Studio Freight's Dragonfly work into an original Earned experience: custom ASCII processing, a compact single-scroll story, technical depth, and deliberate interaction. This is not a clone. Earned keeps its own logo, black/lime/cyan/coral palette, lifting vocabulary, product hierarchy, account flow, and workout data.

## Evidence And Boundaries

The attached research correctly identifies ASCII as Dragonfly's core motif. The published Awwwards case study confirms a custom WebGL-shader ASCII tool, a 3D-to-browser pipeline, one shared canvas, viewport-aware rendering, a control-panel menu, GSAP/ScrollTrigger, Lenis, Three.js, and react-three-fiber. Earned will reproduce none of their assets, layouts, source, timing, or branded interactions.

Earned already has native reveal choreography, a first-session intro, a quick-draw menu, native scrolling, and View Transitions. Adding GSAP, Lenis, and React Three Fiber would duplicate existing responsibilities. This phase adds only `three`, dynamically imported by the public hero.

This specification supersedes the earlier no-WebGL constraint only for the public launch hero. Workout logging, forms, analytics, and authenticated navigation stay DOM-first and fast.

## Central Concept

**The Training Engine.** A barbell-like kinetic sculpture is assembled from a central shaft, loading plates, progress rings, and particles. It moves through the same four-stage language already used by Earned: LOAD, LIFT, ADAPT, EARN. A custom low-resolution luminance pass converts the rendered scene into a live ASCII field, making training effort feel like measurable signal rather than decoration.

## Public Experience

- The hero scene is full-bleed and unframed behind real HTML copy and calls to action.
- The rendered object remains visually distinct from the headline and never blocks account entry.
- Pointer movement adds shallow camera depth on fine-pointer desktop devices.
- Scroll progress rotates and separates the loading plates to connect the hero to the product story.
- A DOM ASCII layer mirrors the canvas at a throttled cadence; the underlying WebGL remains visible at restrained opacity for depth.
- Utility labels report scene state with honest product language, not fake live metrics.
- Existing proof, system, account, and menu structures remain recognizable and accessible.

## Authenticated Experience

The logged-in app receives no persistent WebGL canvas. The Today command center gets a small deterministic ASCII training signal derived from real goal progress, latest volume, and streak. It is decorative, stable, and hidden on compact mobile layouts. Workout logging controls and calculations do not change.

## Rendering Architecture

- `asciiMath.js` owns pure luminance-to-character conversion and deterministic training-signal generation.
- `EarnedAsciiScene.jsx` owns dynamic Three.js loading, canvas lifecycle, scene construction, readback, observers, media queries, input listeners, and cleanup.
- A single visible WebGL canvas is used.
- An offscreen 2D canvas samples the WebGL frame after render at no more than 14 frames per second.
- Three.js is code-split through `import("three")` and loads only on the unauthenticated launch.
- Device pixel ratio is capped at 1.5 on desktop and 1 on compact/mobile layouts.
- Rendering pauses when the scene is outside the viewport or the document is hidden.
- All geometries, materials, renderer resources, listeners, observers, timers, and animation frames are disposed on unmount.

## Fallbacks

- `prefers-reduced-motion: reduce` renders one stable frame and disables pointer/scroll movement.
- Unsupported WebGL, context loss, import failure, and save-data mode show a designed static ASCII barbell signal.
- Essential content is never inside canvas or the generated ASCII layer.
- Mobile uses fewer geometry segments, fewer ASCII columns, no pointer parallax, and shorter movement.

## Accessibility And Performance

- Canvas and ASCII output are `aria-hidden`; the hero message remains semantic HTML.
- Conventional cursor, focus-visible states, keyboard navigation, and native scrolling remain intact.
- Continuous animation changes transforms and uniforms only; layout is not animated.
- The scene must not create horizontal overflow or layout shift.
- Canvas pixel tests must prove the scene is nonblank and changes across normal-motion frames.
- Reduced-motion tests must prove a stable frame and immediately visible content.

## Originality

No Dragonfly asset, ASCII composition, shader, GUI, palette, page order, copy, or animation sequence is reused. The barbell/loading-plate sculpture, Earned character ramp, training stages, and data-driven authenticated signal are original to this product.

## Non-Goals

- No scroll hijacking or smooth-scroll replacement.
- No fake workout, AI, recovery, wearable, social, or payment data.
- No WebGL inside the logger or analytics views.
- No custom cursor.
- No multiple canvas architecture.

