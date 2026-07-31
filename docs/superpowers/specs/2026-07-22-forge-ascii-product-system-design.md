# FORGE_ASCII Product System Design

## Intent

FORGE_ASCII is the internal name of an Earned product initiative, not a new public brand. It turns Earned's existing ASCII atmosphere into a functional interface language for loading, saving, training, exercise education, progress, and identity. Earned remains the name shown to users, and all existing accounts, workout history, daily/weekly progression, Supabase synchronization, offline drafts, Premium entitlements, and community behavior remain intact.

## Architecture Decision

Earned remains a Vite and React application. Rewriting the mature product into Next.js, TypeScript, and Tailwind would add migration risk without improving the requested experience. New FORGE_ASCII modules use focused React components, pure JavaScript helpers, JSDoc type contracts, `requestAnimationFrame`, the existing Three.js launch renderer, and the existing CSS token system. No new state-management or animation dependency is added.

The existing Supabase account JSON remains the backend contract. The only new synced preference is `asciiAvatarStyle`, normalized to `spartan`, `power`, or `iron`. Animation frame, sound, rest-display, and selection state remain local UI state and do not alter workout records.

## Product Map

### Command Deck in Today

The existing Today command center becomes a responsive terminal deck:

- The identity panel renders a customizable ASCII lifting helmet inside a power grid. Grid charge is derived from real workout count, streak, volume, and weekly-goal progress.
- The system-log panel renders recent saved sessions and PR-like volume events as timestamped terminal entries. It uses existing history only and never fabricates activity.
- The vitals panel renders ASCII block bars for weekly goal, streak, latest volume, and total sessions.
- The existing Start/Resume Workout and Goals actions remain primary and keyboard accessible.
- Desktop uses a three-column composition. Tablet and mobile stack the panels without horizontal ASCII overflow.

### Armory in Library

The existing Library view keeps all current search, filters, program packs, notes, technique coaching, and Start Workout behavior. Its exercise list adopts a directory-index treatment with row numbers, muscle group, equipment, difficulty, and current working weight.

Selecting an exercise reveals an Armory inspection panel containing:

- `AsciiExerciseAnimator` with an exact-width frame loop.
- Purpose-built squat, bench press, and deadlift frame sets.
- A movement-family fallback for other exercises so every library entry has an honest visualization without pretending to demonstrate a motion it does not know.
- A dynamic barbell renderer whose plate silhouette grows by weight tier.
- An ASCII anatomy panel that highlights only the exercise profile's real muscle group.
- Existing setup, form cues, mistakes, notes, and Start Workout controls below the animation.

Arrow Up and Arrow Down move the active directory row while the list has focus. Enter toggles the inspection panel. Touch and pointer selection continue to work normally.

### Forge in Train

The existing logger remains the source of truth. A new live console sits after Live Volume and before secondary coaching tools:

- Terminal prompts report the selected exercise, working weight, reps, sets, and current volume.
- A dynamic side-view ASCII barbell grows from the active exercise's current working weight.
- A Tension Bar uses `TerminalProgressBar` and completed-set ratio. Incomplete rows do not appear completed.
- The existing rest timer gains a large ASCII countdown generated from fixed-width digit frames. Each tick briefly scrambles before resolving. The final three seconds use a restrained visual alert; sound remains off by default.
- A Sound Off/On control uses a low-volume Web Audio oscillator only after direct user interaction. It stores a device preference and never auto-plays.
- Existing numeric inputs remain visible, touch-friendly, labeled, and editable. Terminal styling does not replace reliable form controls with a command parser.

### Save and PR Feedback

After a workout save succeeds, the existing completion dialog begins with a short ASCII save sequence. A pulsing disk-and-barbell signal resolves to `[SAVED TO BLOCK]`, then exposes the normal completion metrics and actions. Failed saves never show the success sequence.

When the existing Live PR Radar has a candidate, an ASCII one-rep-max meter fills upward and shows `VITALS: OVERLOAD CANDIDATE`. The definitive `OVERLOAD ACHIEVED` copy is reserved for a successfully saved PR in the completion dialog.

## Shared FORGE_ASCII Modules

### Pure helpers

`src/components/experience/forge/forgeAscii.js` owns:

- responsive viewport tiers and character widths;
- fixed-width frame normalization;
- seeded text scrambling;
- ASCII progress-bar generation;
- dynamic plate-tier and barbell rendering;
- helmet, power-grid, anatomy, countdown, and one-rep-max frame generation;
- exercise-family selection from exercise name and profile.

Every helper is deterministic for the same inputs and has no DOM access.

### Hooks

- `useAsciiViewport` returns `compact`, `standard`, or `wide`, plus 44, 72, or 104 character columns.
- `useAsciiFrameLoop` advances frames with `requestAnimationFrame`, pauses in hidden documents, and returns frame zero for reduced motion.
- `useAsciiTextScramble` resolves a target string through deterministic glyph noise and returns the target immediately for reduced motion.
- `useTerminalSound` exposes an enabled toggle and explicit `type`, `tick`, and `success` cues. It creates AudioContext only after a user action and cleans up nodes and context.

### Components

- `AsciiBootSequence`
- `AsciiSaveSequence`
- `AsciiExerciseAnimator`
- `AsciiAnatomyMap`
- `AsciiAvatarGrid`
- `AsciiSystemLog`
- `TerminalProgressBar`
- `ForgeLiveConsole`
- `AsciiRestCountdown`
- `AsciiOneRmMeter`

Components expose stable `data-forge-*` attributes for browser verification. Decorative output is `aria-hidden`; meaningful values have adjacent semantic text or an accessible label.

## Boot Sequence

The existing first-session intro becomes an honest boot readout lasting no more than 1.5 seconds under normal conditions. It reports only checks the browser can actually perform:

1. `AUTH CLIENT` means the Supabase client bundle is available.
2. `LOCAL CACHE` means browser storage is available.
3. `GLYPH CORE` means Canvas rendering is available.
4. `NETWORK LINK` reports online or offline without claiming a database connection.

Lines print in sequence while a compact ASCII barbell loads beneath them. The final line reads `STATUS: READY [OK]`. The sequence runs once per browser session, has an immediate Skip control, never blocks sign-in for more than 1.5 seconds, and is replaced by a static ready state under reduced motion.

## Visual System

- The app remains black with Earned lime, cyan, coral, and white signal colors.
- Critical terminal alerts use `#ff0000` sparingly; coral remains the normal warning and PR accent.
- New FORGE_ASCII surfaces use the local monospace stack `Cascadia Mono`, `JetBrains Mono`, `Fira Code`, and `Courier New`. No remote font request is added because Earned must remain offline friendly.
- ASCII output uses `white-space: pre`, `font-variant-ligatures: none`, `letter-spacing: 0`, and controlled line heights between `0.92` and `1.05`.
- A subtle fixed scanline layer uses low-opacity repeating gradients and never sits above dialogs or focus outlines.
- New FORGE_ASCII feedback uses frame swaps, step timing, and character scrambles. Existing product transitions are not globally removed because doing so would regress the established navigation system.

## Responsive Behavior

- Wide: 104 columns and full Command Deck composition.
- Standard: 72 columns with reduced frame detail.
- Compact: 44 columns, stacked panels, simplified anatomy, and shorter exercise frames.
- ASCII output uses `max-width: 100%` and never forces horizontal scrolling.
- Mobile animation runs at a lower frame rate and omits nonessential grid noise.

## Accessibility and Performance

- `prefers-reduced-motion` stops frame loops, skips scrambling, and displays stable final content.
- `visibilitychange` pauses all requestAnimationFrame loops.
- Audio is opt-in, low volume, and never required to understand state.
- All terminal controls retain visible focus states, labels, and minimum touch sizes.
- No critical copy is available only inside an ASCII image.
- The feature adds no continuously running WebGL scene to authenticated pages.

## Verification

1. Pure behavior tests prove frame width, tier selection, progress bars, plate scaling, exercise-family selection, text-scramble completion, anatomy targeting, countdown stability, and reduced-motion behavior.
2. A source verifier requires each hook, component, frame asset, lifecycle cleanup, App integration point, responsive style, and account preference normalization.
3. The full existing verifier suite must stay green.
4. The production build must succeed.
5. Browser QA covers boot, Today, Train, Library, workout save feedback, desktop, mobile, keyboard selection, reduced motion, overflow, and console errors.
6. Screenshots are inspected for ASCII alignment, legibility, clipping, and control overlap.

## Boundaries

- Earned is not renamed.
- There is no Next.js, Tailwind, Zustand, or TypeScript migration in this initiative.
- Supabase schema and workout record shapes do not change.
- No fake database check, AI coaching, wearable metric, social event, workout, PR, or payment state is introduced.
- Exercise ASCII is educational orientation, not a substitute for qualified coaching or a safety guarantee.
- Existing charts remain charts; ASCII supplements the highest-value training moments instead of making dense analytics harder to read.
