# Earned Cinematic Motion Design

## Intent

Translate the craftsmanship of premium editorial websites into Earned without copying Dragonfly's layouts, assets, typography, code, or animation timing. The result must remain a workout product: the public story leads directly to account entry, and the authenticated experience still prioritizes starting and logging a workout.

## Central Concept

**Training proof in motion.** Earned's visual language treats every logged set as a signal moving through four stages: load, log, learn, earn. Motion follows that directional idea. Content is revealed through controlled vertical masks and lateral signal movement, while quiet sections preserve space around the most important actions.

## Conversion Journey

1. Understand Earned in the first viewport.
2. See practical proof: daily or weekly tracking, offline drafts, private accounts, and progress intelligence.
3. Explore the training system through scroll-led editorial sections.
4. Reach account entry through persistent, obvious calls to action.
5. Inside the app, start or resume a workout in one action.
6. Discover Premium through honest contextual previews, never an obstructive interstitial.

## Motion Language

- First-session intro lasts no more than 1.4 seconds and is skippable.
- Headlines reveal through masks; utility labels and supporting copy enter in a staggered sequence.
- Sections use Intersection Observer, transform, opacity, and clip-path only after JavaScript has initialized.
- Pointer depth is limited to the hero artwork on fine-pointer desktop devices.
- A thin scroll-progress signal provides location without taking control of scrolling.
- Authenticated navigation uses the View Transitions API when available and an immediate state update otherwise.
- Buttons respond immediately; cinematic timing is reserved for major entry and section changes.
- Mobile uses shorter distances, no pointer depth, and simpler reveals.
- `prefers-reduced-motion` disables movement-heavy behavior while preserving all content and navigation.

## Reusable Units

- `MotionOrchestrator`: reveal observation, scroll progress, pointer variables, and cleanup.
- `FirstVisitIntro`: concise session-scoped brand reveal with skip control.
- `LaunchMenu`: accessible full-screen navigation overlay with sequential links and Escape handling.
- `transitionView`: progressive enhancement for authenticated view changes.
- Data attributes (`data-reveal`, `data-motion-section`, `data-magnetic`) define motion intent without coupling content to animation internals.

## Originality

Earned keeps its own black, lime, cyan, and coral system, training terminology, logo, product structure, and conversion journey. No Dragonfly visual asset, source code, layout sequence, proprietary copy, or frame-by-frame animation is reproduced.

## Performance And Accessibility

- Add no animation dependency.
- Never hide content unless the motion orchestrator has initialized.
- Use passive scroll/pointer listeners and `requestAnimationFrame` batching.
- Clean up observers, animation frames, media-query listeners, and document classes on unmount.
- Keep semantic HTML, visible focus states, keyboard access, and conventional cursors.
- Do not use forced scroll snapping, canvas, WebGL, autoplay video, or layout-heavy animation.

## Scope

This phase upgrades Earned's public launch, account entry, primary navigation, Today command center, and workout completion moments. It does not add irrelevant agency pages, fake portfolio content, fake AI, payments, wearables, or social data.
