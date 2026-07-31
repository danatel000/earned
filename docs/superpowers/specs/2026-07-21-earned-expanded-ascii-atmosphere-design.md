# Earned Expanded ASCII Atmosphere Design

## Goal

Make Earned's authenticated ASCII atmosphere feel larger, more active, and present across every product view, while enriching the public launch sculpture with floating ASCII dumbbells that occupy negative space without competing with the headline or controls.

## Visual Direction

The signed-in product keeps one lightweight fixed Canvas 2D field behind the interface. Each view retains its own glyph vocabulary and accent, but the field gains a broad ambient layer across the full viewport in addition to its existing page-specific motif. Glyphs become modestly larger, the technical rails expand to the full product canvas, and motion runs approximately 18 percent faster. Opacity remains restrained so text, charts, and workout controls remain dominant.

The launch hero keeps the detailed barbell as its primary sculpture. Three smaller wireframe dumbbells occupy upper-left, upper-right, and lower-center depth lanes. Each dumbbell drifts, rotates, and changes depth independently. The existing GPU ASCII shader converts them into the same glyph language as the barbell, so they feel native rather than pasted on.

## Architecture

- `ambientAscii.js` owns responsive particle budgets, the shared motion-rate constant, deterministic page motifs, full-field point distribution, and glyph scale.
- `AppAsciiAtmosphere.jsx` applies the motion rate and draws wider technical rails without changing application state or interaction.
- `createStrengthSculpture.js` creates reusable floating dumbbell geometry and exposes animation handles.
- `EarnedAsciiScene.jsx` animates those handles using the existing render loop, visibility pause, reduced-motion mode, and resource cleanup.
- Existing CSS layering keeps both systems decorative and pointer-transparent.

## Responsive And Accessibility Rules

- Desktop uses the richest field and all three dumbbells.
- Mobile receives a smaller particle budget and shorter drift distances while retaining the full composition.
- Reduced motion renders one stable frame; no drift or orbit continues.
- No canvas may create horizontal overflow or intercept interaction.
- Existing account, workout, Supabase, and monetization behavior remains untouched.

## Verification

- Pure tests assert deterministic full-field coverage, larger glyph sizing, responsive budgets, and the exact motion multiplier.
- Source contracts require floating dumbbell geometry and animation handles.
- Browser QA checks launch and signed-in canvases on desktop, mobile, and reduced motion, including pixel visibility, animation changes, viewport fit, and console errors.

