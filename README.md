# Earned

A React/Vite lifting app with daily or weekly progression, muscle-balance radar, PR tracking, goals, recovery insights, achievements, and Supabase account sync.

## Daily or Weekly Tracking

Each Earned user has an account-scoped Weekly or Daily tracking preference. Weekly mode keeps the original three-section workflow and saves one combined week. Daily mode saves the selected Biceps & Shoulders, Chest & Back, or Legs workout immediately, then updates History, lift progression, PRs, fatigue, training quality, and private analytics by workout day.

Switching modes does not rewrite existing history. Older weekly records are split into read-only workout-section rows for Daily views, while new daily sessions become calendar-week rollups for weekly goals, scheduling, the Muscle Balance Radar, and public weekly rankings. Skipped exercises keep their last values for next time and remain excluded from saved volume.

The preference and each record's period metadata live in the existing private account JSON, so this feature requires no Supabase schema changes. Full account backups now include the selected tracking mode, and older backups default safely to Weekly mode.

## FORGE_ASCII Experience

FORGE_ASCII is the internal name for Earned's terminal training experience; the public product name remains Earned. The Today dashboard now includes a Command Deck with a synced selectable ASCII avatar, real-history system ledger, and block-based training vitals. The Library includes a keyboard-accessible Armory with responsive ASCII movement previews and target-muscle signals. The Log workspace includes a live Forge console driven by the selected exercise's actual weight, reps, sets, completed-set state, volume, rest timer, and estimated 1RM comparison.

The first signed-out visit uses a short, skippable startup sequence that reports only client states it can actually observe. Workout save animation appears only after a successful save. Terminal sound is off by default and can be enabled explicitly from the active workout console. ASCII rendering adapts across compact, standard, and wide viewports, pauses in hidden tabs, and honors reduced-motion preferences.

Run the focused behavior and browser checks with:

```bash
pnpm run test:ascii
node scripts/qa-earned-forge-ascii-browser.cjs http://127.0.0.1:4204/
```

## Run Locally

```bash
pnpm install
pnpm run dev
```

## Build

```bash
pnpm run build
```

The production files are generated in `dist`.

## Monetization Preview

The app currently uses a soft-launch Free/Premium structure. Workout logging, drafts, recent history, PRs, goals, community, offline support, cloud sync, and account backup remain Free. Premium identifies advanced analytics, adaptive programming, program packs, unlimited customization, and future recovery integrations.

Premium Preview is not a paid subscription. Payments are not live, no card is requested, and client-created preview state is never treated as server-verified paid access. The default preview mode keeps existing features available while showing where Premium value and upgrade paths will live.

Plan definitions are centralized in `src/monetization/plans.js`. Entitlement decisions live in `src/monetization/entitlements.js`, and the unconfigured billing contract lives in `src/monetization/billingProvider.js`. Workout history, goals, drafts, and custom exercises do not contain subscription status.

A future payment launch must use a server-controlled subscription table populated by verified Stripe, RevenueCat, App Store, or Play Store events. The browser must not be allowed to write active paid entitlements directly.

Recovery integration contracts live in `src/integrations/recovery.js`. The current UI reports Not connected and does not fabricate HRV, sleep, heart-rate, readiness, or adaptive recommendations.

Run the IOP checks and full feature verifier suite with:

```bash
pnpm run test:iop
pnpm run verify
pnpm run build
```

## Free Deployment

### Vercel

- Import this project from GitHub.
- Framework: Vite
- Build command: `pnpm run build`
- Output directory: `dist`

### Netlify

- Either connect the GitHub repo, or drag the `dist` folder into Netlify Drop.
- Build command: `pnpm run build`
- Publish directory: `dist`

## Supabase Setup

The app uses Supabase Auth, one protected table for each user's private workout data, and separate public summary tables for optional community sharing.

1. Open your Supabase project.
2. Go to SQL Editor.
3. Paste and run the contents of `supabase.sql`.
4. Go to Authentication > Providers > Email.
5. Turn off email confirmation if you want username/password-only signup like `danatel / danatel`.

Your existing browser data migrates into the `danatel` account the first time that account opens in the app. New accounts start fresh.

Public sharing is opt-in. The public tables only store safe workout summaries, leaderboard scores, trained muscle labels, PR counts, and top-lift summaries. Full private workout data and drafts stay in `lift_tracker_data` under user-only RLS policies.

Public follows are also opt-in around public profiles. Users can only discover and follow accounts that have Public On enabled. Following never exposes private workout data.

Public comments, reactions, and notifications are tied only to public workout summary posts. Comment text is capped at 240 characters, and private workout logs, goals, drafts, notes, account emails, and passwords remain private.

The Smart Program Builder stores coach preferences and generated plans privately inside each user's synced lift data. It does not use a paid AI service, does not create public coach records, and does not alter workout history until the user logs a workout.

Exercise Library Pro is also private. Exercise profiles are generated inside the app from the user's routine, and starting a workout from the library only updates the user's private draft until they choose to log it.

The Log tab includes workout-session quick actions for faster in-gym tracking: active exercise focus, copy last workout, repeat last set, and a sticky session dock. These only update the private draft until the week is saved.

Skipped exercises still prefill from the last logged lift next time. Skipping keeps that exercise out of saved weekly volume, but it no longer erases the weight, reps, and sets the user last performed.

The Progressive Overload Coach recommends whether to add weight, add reps, add a set, repeat, or deload for recently logged exercises. These recommendations are private and generated from saved workout history inside the app.

Achievements & Milestones are private and generated from saved history. They track workout count, lifetime volume, PR count, streak progress, and muscle-group specialist milestones without writing extra public data.

Challenge Hub is private and generated from saved workout history. It creates weekly quests, a challenge score, a spotlight challenge, and progress cards from volume, PRs, streaks, muscle balance, and recovery signals. No Supabase schema changes are required.

The Log tab also includes a private Plate Calculator and Warmup Planner inside Active Exercise Focus. It reads the current draft working weight, suggests barbell plates per side for barbell lifts, and creates warmup ramp sets. No saved workout data changes are made by the calculator.

Post-workout storytelling is private and generated from saved workout data. The recap screen and local Workout Feed show a Workout Story with headline, narrative, highlights, and copyable story text. No Supabase schema changes are required.

Workout Schedule Planner is private and generated from saved history. It creates a 7-day agenda, next scheduled workout, and recovery days from the user's split cycle, fatigue, and training quality. No Supabase schema changes are required.

Private readiness check-ins save sleep, energy, and soreness with each logged workout. The Readiness Score adjusts fatigue, recovery, and training quality inside the user's private analytics only. No Supabase schema changes are required.

Private exercise substitutions appear inside Active Exercise Focus. Smart Substitutions suggest same-muscle alternatives, and Add Swap inserts the movement into the current private draft as a custom exercise without changing saved volume until the user logs it. No Supabase schema changes are required.

Private per-lift progress labs appear inside expanded exercise cards in the Lifts tab. They show Estimated 1RM, Best Set, Volume Trend, recent average volume, Recent Logs, and a Next Cue generated from the user's saved workout history. No Supabase schema changes are required.

Private joint stress guardrails appear on the Volume dashboard. They combine load spike, fatigue, readiness, recent high-stress weeks, and pressure zones into a Guardrail Score with a Coach Cue. This is training-load guidance, not medical advice. No Supabase schema changes are required.

Private goal forecasts appear in the Goals tab. Goal Forecast & ETA estimates Weeks to Goal, Pace, Exercise ETA, and Next Target from the user's saved workout history and private goals. No Supabase schema changes are required.

Private body metrics appear in the Goals tab. Body Metrics & Strength Ratio lets users save bodyweight entries, view Weight Trend, compare latest Volume / lb, and track Best 1RM / lb from saved lifting history. No Supabase schema changes are required.

Community leaderboard upgrades appear in the Feed tab. Weekly Rankings shows one best public workout per lifter, Your Rank, Best Score, Top Volume, and Active Lifters while reusing existing public workout summaries, reactions, and comments. No Supabase schema changes are required.

Private Technique Coach appears in Exercise Library Pro and Active Exercise Focus. It shows Setup Checklist, Rep Execution, Safety Checks, and Progression Tip guidance generated from each exercise profile without saving extra data. No Supabase schema changes are required.

Private Premium Program Packs appear in the Library tab. Strength Foundation, Hypertrophy Builder, and Balanced Athletic provide curated program days that load into the private Log draft with Start Program Day and do not affect history until the workout is saved. No Supabase schema changes are required.

Private Exercise Notes appear in Exercise Library Pro and Active Exercise Focus. Users can save Setup Memory details like seat height, grip, machine pin, or a personal cue for each exercise. Exercise notes are private, synced with the user's account data, and require no Supabase schema changes.

Private Performance Correlation Lab appears on the Volume dashboard. It compares readiness, sleep, energy, soreness, bodyweight context, PRs, and weekly volume to show helpful training signals without claiming medical certainty. No Supabase schema changes are required.

Private Data Safety Center appears in the Goals tab. Users can export a full account backup containing workout history, goals, custom routine data, private notes, body metrics, saved programs, and templates, then restore it later while still supporting older history-only export files. No Supabase schema changes are required.

Private Starter Launchpad appears on the Volume dashboard for new or incomplete accounts. It shows setup progress for first workout, weekly goal, bodyweight entry, exercise notes, and routine customization, with buttons that jump to the right app tabs. No Supabase schema changes are required.

Private Training Momentum Coach appears on the Volume dashboard after a workout is logged. It uses saved workout dates to show days since last lift, momentum score, next best lift, comeback plan, and streak protection, with an option to start the next private plan. No Supabase schema changes are required.

Private Workout Readiness Gate appears inside the Log tab readiness check-in. It turns sleep, energy, soreness, and live workout volume into a Push Day, Normal Training, Controlled Session, or Recovery Bias recommendation without blocking the workout save flow. No Supabase schema changes are required.

Private Live PR Radar appears in the Log tab after Live Volume. It compares unsaved draft lifts with saved history for Volume PR, Weight PR, and Estimated 1RM PR candidates, then gives a quick Coach Cue before the workout is saved. No Supabase schema changes are required.

Private Next Set Coach appears inside Active Exercise Focus in the Log tab. It reads the current set rows, previous history, exercise profile, and readiness score to suggest the next target, rest time, and decision, with an Add Suggested Set button that only updates the private draft. No Supabase schema changes are required.

Private Session Pacer appears in the Log tab near live workout metrics. It tracks elapsed session time, logged sets, volume per minute, and a pace cue from the private draft, with a Reset Clock action for restarting the timer. No Supabase schema changes are required.

Private Set Quality Tags appear under each logged set in the Log tab. Users can mark sets as Easy, Good, Hard, or Failed, and Active Exercise Focus shows a Set Quality Summary with a Coach Cue while keeping volume math unchanged. No Supabase schema changes are required.

Private Workout Completion Guard appears in the Log tab before confirming a day. It separates Logged, Skipped, Removed, and Needs Action exercises so users can confirm only after every active exercise is either logged or intentionally skipped. No Supabase schema changes are required.

Private Quick Set Adjusters appear under each set in the Log tab. Users can tap -5 lb, +5 lb, -1 rep, or +1 rep to tune copied or suggested sets without retyping, while skipped exercises stay disabled and volume math remains unchanged. No Supabase schema changes are required.

Private Quick Finish appears in the Workout Completion Guard when exercises still need a decision. Skip Remaining intentionally skips only those unresolved exercises, preserves their last-entered weights and sets for the next workout, and keeps them out of saved volume. No Supabase schema changes are required.

Private Section Skip & Save appears in the Log tab for full workout sections. It lets users skip an entire workout section, preserves the previous lift values for next time, and does not count skipped exercises toward volume. No Supabase schema changes are required.

Private Complete Set & Smart Rest appears on every active set row. Completing a set adds a draft-only completion marker, and the optional Auto-start rest toggle starts the selected 1:00, 1:30, 2:00, or custom timer without changing saved volume. Editing that set clears its completion state. No Supabase schema changes are required.

Private Recent Exercise History appears inside Active Exercise Focus in the Log tab. It shows the last three saved performances for the selected exercise, including the best set, set count, date, and volume, with a first-workout empty state. No Supabase schema changes are required.

Private Draft Undo keeps one previous workout-input snapshot while logging. Undo Last Edit can restore an accidental weight, rep, set, quality, skip, quick-adjust, copy, or clear change without touching saved history. No Supabase schema changes are required.

Installable Offline App Shell support lets a previously opened production build reopen when gym connectivity drops. Navigation and static assets use a network-first cache, Supabase traffic is never cached, and the header shows Online, Offline, or Offline Draft status so local work is not mistaken for cloud sync. No Supabase schema changes are required.

Private Recovery Forecast appears on the Volume dashboard. It combines fatigue, weekly quality, readiness check-ins, RPE, rating, and recovery-week signals into conservative next-session, 24-hour, and 48-hour training estimates with an explicit confidence level. It is training guidance, not medical advice. No Supabase schema changes are required.

Private Muscle Drift Monitor appears on the Volume dashboard. It compares each muscle group's share of volume across the latest three workouts and the prior training window, then flags only persistent changes of at least six percentage points so one missed split day does not create a false weakness alert. No Supabase schema changes are required.

Private Training Quality Breakdown appears on the Volume dashboard. It explains the existing weekly quality score through Load, Balance, Recovery, Progress, and Consistency deltas, identifies the strongest and priority drivers, shows a six-workout trend, and gives two focused next actions. No Supabase schema changes are required.
