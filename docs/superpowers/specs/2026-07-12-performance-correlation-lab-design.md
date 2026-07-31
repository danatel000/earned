# Performance Correlation Lab Design

## Goal
Add a private premium analytics panel that helps users notice which readiness and bodyweight signals line up with better lifting output.

## Scope
- Add one new derived analytics helper in `src/App.jsx`.
- Add one new dashboard panel in the Volume view.
- Use only existing private data: workout history, readiness check-ins, training quality, PR counts, and body metrics.
- Do not add Supabase tables, public fields, paid AI services, or new dependencies.

## User Experience
The Volume dashboard will show a `Performance Correlation Lab` card near Fatigue Trend and Joint Stress Guardrails. It will summarize signals such as:
- `Readiness Signal`
- `Sleep Impact`
- `Energy Impact`
- `Soreness Drag`
- `Bodyweight Context`

Each signal compares average volume and PR output when the condition is favorable versus the rest of the user's logged history. Copy must frame results as signals, not medical or scientific certainty. The card includes `Signal Strength` and a `Coach Cue` that tells the user what to watch next.

## Data Flow
`buildPerformanceCorrelations(history, customEx)` reads:
- `getTotalVol(entry, customEx)` for weekly output.
- `getWeekPRCount(entry, previousHistory, customEx)` for PR context.
- `getReadinessScore(entry.readiness)` and `normalizeReadiness(entry.readiness)` for readiness factors.
- `bodyMetrics(customEx)` for optional bodyweight context.

The helper returns a stable object:
- `correlationLab: true`
- `rows`: signal cards for readiness, sleep, energy, soreness, and bodyweight.
- `bestSignal`: strongest available signal.
- `coachCue`: short recommendation.
- `sampleCount`: number of usable workouts.

## Empty State
If the user has fewer than two saved workouts, show a compact empty state asking them to log more workouts with readiness check-ins. If bodyweight has not been logged, show bodyweight context as locked or low-confidence instead of hiding the whole panel.

## Testing
Add a verifier script that checks:
- helper and component names exist.
- required labels render in source.
- the helper uses readiness score and body metrics.
- README documents that the feature is private and requires no Supabase schema changes.

## Risks
Correlation can be misunderstood as causation, so the UI must use language like `signal`, `context`, and `trend`. It must not diagnose recovery, injury, sleep quality, or nutrition.
