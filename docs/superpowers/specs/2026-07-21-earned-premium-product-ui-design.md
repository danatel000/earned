# Earned Premium Product UI Design

## Purpose

Raise every signed-in Earned screen to the visual and interaction quality of the public experience without changing workout calculations, account isolation, Supabase persistence, subscription state, or existing feature behavior.

The redesign treats Earned as a focused training instrument: fast enough for the gym floor, expressive enough to reward progress, and calm enough to scan between sets.

## Design Direction

### Visual concept

Earned becomes a graphite training console with a precise editorial hierarchy. The interface uses black and neutral green-gray surfaces for structure, while lime, cyan, coral, and gold appear only as purposeful signals. Existing muscle-group colors remain available for workout and chart semantics, but no longer dominate the product chrome.

### Emotional rhythm

- Quiet surfaces support scanning and repeat use.
- Bright status signals reward completion, momentum, records, and progress.
- The existing ASCII atmosphere supplies motion and identity without competing with data entry.
- Every view opens with a concise identity band so users always know where they are and what the screen is for.

### Product principles

1. The next useful action must be obvious within one glance.
2. Workout entry controls must remain large, stable, and readable on mobile.
3. Data color must communicate meaning rather than decorate containers.
4. Surface hierarchy must use contrast, spacing, and border weight before adding more cards.
5. Motion must support status and navigation and respect reduced-motion preferences.
6. Existing user data and feature behavior are immutable during this visual pass.

## Information Architecture

The signed-in product keeps its eight existing destinations:

| View | Product role | Identity accent |
| --- | --- | --- |
| Today | Command center and next action | Lime |
| Train | Live session workspace | Lime |
| Progress | Progression intelligence | Cyan |
| Records | Personal records archive | Gold |
| History | Saved training ledger | Cyan |
| Goals | Targets and gap-to-goal feedback | Lime |
| Library | Exercise reference and routine inputs | Cyan |
| Feed | Accountability and community | Coral |

No route, navigation key, saved state, or feature ownership changes.

## Shared Product Shell

### Width and layout

- Increase the signed-in shell from 920px to a maximum of 1180px.
- Keep a centered single application canvas with responsive gutters.
- Preserve the sticky command header and compact horizontal navigation.
- Add a shared view identity band at the beginning of the main content area.
- Wrap each view in a stable page-level class for consistent control and surface styling.

### Header

The header remains compact and operational. It contains the Earned mark, current training mode, save/cloud signal, settings, and account actions. Background blur, border contrast, and spacing are refined so it reads as a durable toolbar rather than a floating marketing header.

### Navigation

- Keep all eight destinations directly accessible.
- Use a stronger active state with a narrow accent edge and high-contrast label.
- Preserve horizontal scrolling on small screens without wrapping or layout jumps.
- Maintain visible focus states and stable hit targets.

### View identity band

Each view receives:

- two-digit section index;
- operational eyebrow;
- clear view title;
- one-sentence purpose;
- current Daily or Weekly mode;
- relevant live status such as saved sessions or current streak.

The band is full-width and unframed so it establishes hierarchy without introducing another card.

## Design Tokens

### Structural palette

- Canvas: `#050605`
- Deep surface: `#090c0a`
- Raised surface: `#101512`
- Interactive surface: `#171d19`
- Soft border: `#232b27`
- Strong border: `#37423c`
- Primary text: `#f4f7f5`
- Secondary text: `#a5aea9`
- Tertiary text: `#737d77`

### Signal palette

- Earned lime: `#9dff00`
- Signal cyan: `#54d8ff`
- Record gold: `#ffca58`
- Alert coral: `#ff625f`

### Geometry

- Page and major tool radius: 6px
- Controls and nested surfaces: 4px
- Pills, toggles, avatars: retain fully rounded geometry
- Border widths remain 1px except active and progress indicators

### Type

- Preserve the existing type stack.
- Use uppercase mono/utility labels for system state.
- Use strong display type only for view titles, major metrics, and celebrations.
- Keep compact panels and controls at practical product scale.
- Letter spacing remains zero for body and command text; existing utility-label tracking may remain restrained.

## Component Treatment

### Surfaces

- Replace blue-purple structural panels with graphite surface tiers.
- Retain semantic accent borders and chart colors.
- Remove oversized rounding from operational panels.
- Avoid nested floating-card composition; inner content uses dividers, rows, or subtle inset surfaces.

### Controls

- Inputs, selects, and textareas receive consistent dark fills, visible borders, and focus rings.
- Primary commands use lime with dark text.
- Secondary commands use graphite fills with high-contrast labels.
- Destructive controls use coral only when the action is truly destructive.
- Hover, active, disabled, and focus-visible states are explicit.

### Metrics and charts

- Major numbers gain breathing room and stronger numeral contrast.
- Recharts grids, axes, tooltips, and legends use the product token system.
- Muscle-group colors remain meaningful in radar and progression data.
- Empty states use direct next-action copy and one clear command.

### Workout workspace

- Session and day groups become clearer bands with stable controls.
- Weight, set, and rep entry remains fast and thumb-friendly.
- Skip, remove, save, and completion states retain their existing behavior.
- Live ASCII reaction remains atmospheric and never covers inputs.

### Modals and overlays

- Dialogs use the same graphite surface system and 6px geometry.
- Primary actions remain visually dominant.
- Focus management and escape behavior remain unchanged.

## Responsive Behavior

### Desktop

- Use the wider canvas for data comparison and clearer group spacing.
- View identity metadata sits opposite the title block.
- Dense views may use existing grids when the content supports comparison.

### Mobile

- The view identity band stacks vertically.
- Header and navigation remain compact and horizontally stable.
- Motion distances reduce and background ASCII density remains restrained.
- Inputs and commands retain at least practical touch-height targets.
- No horizontal page overflow is permitted; only intentional navigation rails may scroll.

## Accessibility and Performance

- Preserve semantic HTML and existing keyboard behavior.
- Maintain visible `:focus-visible` treatment on every interactive control.
- Respect `prefers-reduced-motion` for all existing and new transitions.
- Animate only transforms and opacity for new interaction polish.
- Do not add a runtime dependency for this redesign.
- Keep the public launch, authentication, and Three.js hero behavior intact.

## Data and Behavior Safety

This pass must not alter:

- workout volume formulas;
- daily or weekly progression logic;
- skipped exercise carry-forward behavior;
- goal membership or radar calculations;
- Supabase schema or persistence;
- account-specific data;
- premium entitlement rules;
- feed, challenge, analytics, or exercise-library business logic.

## Acceptance Criteria

1. All eight signed-in views display the shared identity band with correct content.
2. The desktop app canvas uses the wider product shell and remains responsive.
3. Operational panels use graphite structural colors and radii no greater than 8px.
4. Inputs and commands have consistent, accessible states.
5. Semantic workout and muscle colors remain intact.
6. Mobile pages do not overflow horizontally.
7. Reduced-motion users receive equivalent content without heavy movement.
8. Existing feature verifiers, ASCII tests, IOP tests, and production build pass.
9. Browser QA can navigate and render all eight views without console or page errors.

