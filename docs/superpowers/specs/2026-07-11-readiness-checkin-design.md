# Readiness Check-In Design

Approved direction: continue HIU with private recovery-aware logging.

## Goals

- Let users record how ready they feel before saving a workout.
- Use sleep, energy, and soreness to improve fatigue, recovery, and training quality calculations.
- Keep readiness private and avoid public sharing or Supabase schema changes.
- Preserve old workout history without changing existing volume calculations.

## Rules

No Supabase schema changes. Readiness is saved inside each workout history entry already stored for the user.

The app derives:

- `readiness`: saved workout metadata with `sleep`, `energy`, and `soreness` values from 1 to 5.
- `Readiness Score`: a 0 to 100 score where sleep and energy increase readiness and soreness decreases readiness.
- `Readiness` story/analytics context for private recap, fatigue, recovery, and training quality.

Old entries without readiness remain neutral. They should not be treated as bad recovery data.

## UI

Add `Readiness Check-In` to the workout log near the existing session feel controls.

The panel shows:

- `Sleep`
- `Energy`
- `Soreness`
- `Readiness Score`
- A short label such as `Ready to push`, `Good to train`, or `Deload signal`.

## Analytics

Readiness affects private analytics only:

- Higher readiness improves recovery and training quality.
- Lower readiness increases fatigue and softens the next-workout recommendations.
- Recovery score shows the latest readiness score when available.

## Verification

- Add `scripts/verify-readiness-checkin-app.cjs`.
- Run the verifier before implementation and confirm it fails.
- Run all existing verifier scripts plus the new one.
- Run production build and refresh `lift-tracker-dist.zip`.
