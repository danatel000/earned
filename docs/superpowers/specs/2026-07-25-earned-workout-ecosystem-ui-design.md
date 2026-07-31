# Earned Workout Ecosystem UI Design

**Date:** 2026-07-25
**Scope:** Authenticated Workout Page and the Today, Train, Progress, Records, History, Goals, Library, and Feed views.

## Product Intent

Earned should feel fast and rewarding while a lifter is actively training. The interface must remain legible with one hand, expose the next useful action immediately, and make progress feel tangible without turning every screen into a loud animation showcase.

The visual concept is a **training signal matrix**. Each view has its own signal, accent, compact metrics, and next action, while all eight views share one consistent command rail and navigation language.

## Repository Findings

- The project is a Vite + React single-page app, not Next.js.
- Styling is a mature custom CSS token system, not Tailwind or shadcn/ui.
- Auth, Supabase synchronization, offline drafts, workout calculations, charts, goals, social features, monetization, and daily/weekly tracking already exist.
- Most authenticated view logic lives in `src/App.jsx`.
- Shared visual modules live in `src/components/experience`.
- The current eight-tab navigation is functional but visually flat and has limited keyboard behavior.
- Most view cards are inline-styled, which makes global visual cohesion harder.
- The Library already has useful filters and keyboard navigation, but it is presented as one long column.
- History lacks a compact search/range menu.
- Feed already contains real community data, challenges, reactions, and rankings, so fake testimonial content is unnecessary.

## 21st.dev Translation Strategy

The project will not install a second styling framework or copy component source blindly. The strongest 21st.dev patterns will be translated into Earned-native React and CSS:

- Glowing/animated cards become restrained signal borders on records, active training, and selected panels.
- Dashboard/stat patterns become the shared workout command rail.
- Animated buttons become immediate press feedback and directional fills on primary workout actions.
- Carousels become native horizontal snap rails for challenges and social proof on mobile.
- Navigation patterns become an accessible kinetic eight-tab rail with roving keyboard navigation.
- Gallery patterns become a responsive exercise directory where the open exercise spans the full grid.
- Text effects become short numeric/signal reveals, never readability-reducing kinetic text.
- Testimonial patterns are used only for authentic workout/community entries already stored by Earned.

## Shared Architecture

### `workoutViewSignals.js`

A pure configuration/model module owns view labels, accents, metric selection, and action labels. It receives simple account statistics and returns display-ready values. It has no React, storage, or Supabase dependency.

### `WorkoutEcosystemRail.jsx`

A reusable, accessible command rail rendered on every authenticated view. It displays:

- Current view signal and cadence.
- Two compact view-relevant metrics.
- A short next-action statement.
- Primary and secondary actions where useful.
- A small activity visualization that uses CSS transforms only.

### `AppNavigation.jsx`

The existing navigation becomes a semantic tablist with:

- Active-position rail.
- Numeric indices.
- Arrow/Home/End keyboard navigation.
- Focus management.
- Existing unread Feed badge.
- A distinct Train command.

### View Hooks

Each major view receives stable classes rather than a wholesale rewrite. These hooks allow a single CSS module to enhance panels without changing calculation or persistence behavior.

## View-Specific Design

### Today

Keep the existing Command Deck as the primary dashboard. The shared rail adds readiness, weekly load, and direct Train/Goals actions without duplicating the full dashboard.

### Train

Prioritize the active day, logged exercise count, draft status, rest controls, and sticky save dock. Active controls use the strongest accent and fastest feedback. No decorative motion may obscure data entry.

### Progress

Use quieter cyan hierarchy, clearer split grouping, chart surfaces, and scan-friendly metric cards. The rail links to Records and Goals.

### Records

Use gold record accents and a restrained border-beam treatment. Large values remain stable and readable. Muscle-group filtering stays one tap away.

### History

Add a compact filter menu for all/recent/PR-bearing sessions and a text search against period labels, dates, and notes. Preserve edit/delete behavior and source-index safety.

### Goals

Emphasize goal completion, goal gaps, and the next editable target. Avoid turning every exercise into a decorative card; retain the efficient list.

### Library

Convert the directory to a responsive two-column grid on large screens. Open rows span the grid; mobile remains one column. Keep keyboard navigation, filters, notes, technique guidance, and workout loading.

### Feed

Treat genuine workout posts, rankings, and challenges as the social-proof system. Active challenges become a horizontal snap rail where space is constrained. No invented quotes, ratings, or lifters.

## Motion

- Primary interaction duration: 120-220 ms.
- View entrance: one existing 300 ms stage transition.
- Border scans: transform/opacity only and limited to active or record surfaces.
- Numeric signal bars: width/transform only.
- Reduced-motion mode removes scans, translations, and repeated pulses.
- Mobile motion distances are shorter than desktop.

## Accessibility

- Navigation uses `role="tablist"` and `role="tab"`.
- Arrow, Home, and End keys move focus and activate the destination.
- Buttons retain visible focus styles.
- Horizontal rails remain keyboard and touch scrollable.
- Color is never the only active-state indicator.
- No essential text is animation-only.
- Existing edit/delete confirmations remain unchanged.

## Non-Goals

- No new payment processing.
- No fake AI, wearables, social users, or testimonials.
- No backend schema changes.
- No rewrite of workout calculations or persistence.
- No Tailwind, shadcn, GSAP, Framer Motion, or WebGL dependency added.
- No GitHub update or push.

