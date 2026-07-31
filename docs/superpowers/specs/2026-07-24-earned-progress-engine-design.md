# Earned Progress Engine Launch Design

## Goal

Turn the existing Earned launch page into a more cinematic, conversion-focused entrance that makes the product feel premium while keeping the first action obvious: create an account or sign in and start training.

## Chosen Direction

Create an original hybrid informed by three interaction patterns reviewed on 21st: directional background paths, a dithered media frame, and scroll-driven media expansion. The implementation will not copy third-party assets or source. It will use Earned's existing dark, graphite, lime, cyan, and coral design system plus its current ASCII barbell scene.

## Experience

The hero remains a full-height product introduction. It gains a restrained trajectory grid behind the ASCII scene, a compact live-training telemetry module, and a dithered "proof frame" that reads as workout data rather than a generic visual card. As visitors scroll, the hero composition transitions into a product-preview band that connects the promise of earned progress to actual train, progress, and records workflows.

The existing primary CTA continues to scroll to the account form. The secondary CTA continues to lead to the system explanation. No sign-in, account, workout, premium, or Supabase behavior changes.

## Motion and Accessibility

CSS handles the new noncritical shimmer, path drift, and reveal details. The existing MotionOrchestrator remains responsible for reveal timing. `prefers-reduced-motion` disables path drift and transforms while retaining all visual content. The hero stays usable if canvas rendering is unavailable.

## Files

- `src/components/experience/PublicLaunch.jsx`: add the hero telemetry/proof presentation and the product-preview band.
- `src/styles.css`: add responsive presentation rules and reduced-motion fallbacks.
- `scripts/test-launch-progress-engine.mjs`: assert the public launch source maintains the expected CTA, telemetry, and product-preview contracts.
- `package.json`: register the focused verifier.

## Verification

Run the focused launch verifier, ASCII verifier, production build, and the existing full verification suite. Inspect the launch page at desktop and mobile widths after the build.
