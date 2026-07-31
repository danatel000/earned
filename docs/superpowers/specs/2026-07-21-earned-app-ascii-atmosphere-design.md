# Earned App-Wide ASCII Atmosphere Design

## Goal

Extend Earned's ASCII identity across every authenticated view without obscuring training data, slowing workout entry, or turning the interface into a decorative novelty. The system should reward attention with fine motion, respond to real workout activity, and preserve the public Glyph Forge hero as the highest-intensity visual moment.

## Existing Context

Earned has eight authenticated views: Today, Train, Progress, Records, History, Goals, Library, and Feed. They share `earned-app-shell`, `AppNavigation`, `earned-view-stage`, and `MotionOrchestrator`. The public launch already owns a detailed Three.js glyph scene, Today includes a compact deterministic `TrainingSignal`, Train computes live volume, logged exercises, set count, rest state, and readiness, and workout completion uses `WorkoutCelebration`.

## Chosen Direction

Use a hybrid motion system:

1. A single fixed Canvas 2D atmosphere behind the authenticated shell. It renders a sparse flow field, technical rails, and a view-specific glyph constellation. It changes deterministically with the active tab and never intercepts input.
2. A compact Train-only ASCII reactor driven by live volume, active sets, logged exercises, rest state, and the selected workout accent.
3. A short milestone burst inside `WorkoutCelebration`, driven by saved volume, streak, and PR state.
4. Small navigation glyph traces that reinforce view changes without adding new controls.

This is preferred over card-by-card CSS decoration, which would become repetitive, and over multiple WebGL scenes, which would waste battery and compete with logging.

## Visual Language

- Cyan represents measurement, navigation, and pending work.
- Lime represents completed work and forward progress.
- Coral appears briefly at high intensity and for PR events.
- White is reserved for peak glyphs and lockout moments.
- The background canvas stays between 4% and 14% apparent opacity depending on viewport and activity.
- Today uses a rising chevron field; Train uses a barbell/rep waveform; Progress uses ascending traces; Records uses a peak burst; History uses a timeline; Goals uses target rings; Library uses a catalog grid; Feed uses connected nodes.
- Motion uses slow flow, pulse propagation, and scan sequencing. There is no constant flashing, random glitching, or scroll hijacking.

## Architecture

### Pure Signal Helpers

`src/components/experience/ascii/ambientAscii.js` owns deterministic profiles, seeded point generation, responsive budgets, and workout/milestone text-frame generation. Pure helpers are independently testable and do not access the DOM.

### Global Atmosphere

`src/components/experience/ascii/AppAsciiAtmosphere.jsx` owns one fixed canvas. It selects a profile from the active view, draws at a capped frame rate, responds subtly to pointer position, pauses when the document is hidden, and rebuilds for viewport changes. It exposes `data-ascii-view`, `data-ascii-tier`, and `data-ascii-state` for browser QA.

### Data-Reactive Signals

`src/components/experience/ascii/WorkoutAsciiReactor.jsx` renders a compact real-data signal in Train. It updates when live metrics change and advances a low-frequency glyph phase while visible. `src/components/experience/ascii/AsciiMilestoneBurst.jsx` renders the short completion signal in the existing celebration panel.

### Integration

`App.jsx` mounts the global atmosphere once and keeps header, navigation, dialogs, and the view stage above it. `LogForm` mounts the reactor immediately after day selection and before secondary tools so the live work signal is visible without delaying set entry. `WorkoutCelebration.jsx` mounts the milestone burst before the result headline. `styles.css` supplies layering, responsive sizing, focus-safe nav traces, and reduced-motion behavior.

## Performance And Accessibility

- Desktop atmosphere: maximum 260 glyph particles at 24 FPS.
- Mobile atmosphere: maximum 110 glyph particles at 16 FPS.
- Canvas device pixel ratio is capped at 1.25 desktop and 1 mobile.
- Train and celebration text signals update no faster than every 160 milliseconds.
- `visibilitychange` pauses timers and animation frames.
- `prefers-reduced-motion` draws one stable frame and disables glyph traces.
- Decorative canvases and text fields are `aria-hidden="true"` and `pointer-events:none`.
- Content remains fully available if canvas creation fails.

## Verification

1. Pure helper tests verify deterministic view profiles, budgets, stable frame dimensions, and data sensitivity.
2. Source contracts verify all eight views, lifecycle cleanup, reduced-motion support, Train metrics, celebration metrics, and CSS layering.
3. Production build must pass.
4. Browser QA signs in, visits all eight tabs, confirms the global canvas remains live and nonblank, confirms frames change on normal motion, confirms Train contains a nonblank data-reactive reactor, checks mobile overflow, and confirms reduced-motion frames remain identical.
5. Desktop and mobile screenshots are inspected for overlap, visual noise, and legibility.

## Boundaries

The system does not add fake AI, new workout data, audio, haptics, social events, WebGL inside authenticated views, or a user-facing animation setting. It preserves all account, Supabase, workout, Premium, and tracking behavior.
