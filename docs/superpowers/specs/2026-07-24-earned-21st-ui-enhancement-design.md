# Earned 21st.dev UI Enhancement Design

**Date:** 2026-07-24

## Central Concept

Earned should feel like a live training instrument: precise, rewarding, and visibly responsive to effort. The launch page keeps its existing black, white, lime, cyan, and coral system, then gains a more refined layer of signal borders, kinetic controls, editorial data surfaces, and product-first storytelling.

The 21st.dev survey is used as design research. Components are adapted into Earned-native React and CSS instead of importing a parallel Tailwind/shadcn stack into the existing Vite application.

## Motion Language

- Directional light passes communicate progression.
- Borders react before surfaces, so interaction feedback stays crisp.
- Text reveals use short line masks and signal changes, not generic fade-up repetition.
- Product cards use restrained depth and pointer tracking on capable desktop devices.
- Carousels move only on explicit controls or a slow, pauseable timer.
- Reduced-motion users receive immediate content with no parallax or looping movement.

## Conversion Journey

1. The ASCII hero establishes Earned's identity and the primary "Start training" action.
2. A concise proof rail explains daily/weekly tracking, offline drafts, private accounts, and progress intelligence.
3. A feature matrix shows the product's actual training value.
4. A product gallery previews logging, progression, and recovery surfaces.
5. A proof carousel reinforces concrete product principles without inventing customer testimonials.
6. The account section closes the journey with a focused sign-in/create-account experience.

## Reusable Interface Kit

- `EarnedSignalCard`: luminous border and data-surface primitive.
- `EarnedKineticButton`: directional fill, arrow response, and accessible interaction states.
- `EarnedMetricBars`: compact product-data visualization.
- `LaunchFeatureMatrix`: bento-style feature section grounded in real Earned capabilities.
- `LaunchProductGallery`: controlled product showcase with keyboard-friendly selection.
- `LaunchProofCarousel`: pauseable, reduced-motion-safe proof carousel.

## 21st.dev Pattern Mapping

1. Components: popular interaction primitives become the shared interface kit.
2. Themes: Modern Minimal and Lime Frost inform token refinement, without replacing Earned's theme.
3. Templates: Folio and Cypon Analytics inform editorial pacing and product-data composition.
4. Cards: Glowing Effect and animated chart cards inform `EarnedSignalCard`.
5. Buttons: Magic UI-style shine and directional button feedback inform `EarnedKineticButton`.
6. Carousels: lightweight controlled carousel behavior informs `LaunchProofCarousel`.
7. Sign ins: focused split-context auth patterns refine the account section.
8. Dashboards: System Monitor and analytics dashboards inform product previews.
9. Sidebars: no launch-page sidebar is installed; the existing compact app navigation remains the better fit.
10. Menus: kinetic menu feedback refines the existing launch overlay.
11. Galleries: interactive bento and frame layouts inform `LaunchProductGallery`.
12. Navigation menus: kinetic navigation patterns refine active and hover states.
13. Features sections: bento feature patterns inform `LaunchFeatureMatrix`.
14. Borders: animated/glowing borders inform signal surfaces and focus states.
15. Texts: shimmer and text-effect patterns inform restrained signal-copy emphasis.
16. Testimonials: testimonial carousel mechanics are repurposed for factual product proof, avoiding fabricated endorsements.

## Originality And Scope

No proprietary 21st.dev source or visual is copied verbatim. No fake reviews, fake AI, fake payments, or fake usage statistics are added. Existing auth, workout data, navigation, ASCII rendering, and application state remain authoritative.

## Performance And Accessibility

- No new runtime dependency.
- No WebGL or shader addition.
- Pointer effects are disabled on touch and reduced-motion environments.
- Controls retain native buttons, links, labels, focus-visible states, and keyboard operation.
- Auto-rotation pauses on hover, focus, reduced motion, and hidden documents.
- Layout dimensions remain stable across content changes.

