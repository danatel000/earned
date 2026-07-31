# Joint Stress Guardrails Design

Approved direction: continue HIU with a private training-load guardrail.

## Goals

- Help users notice risky training-load patterns before the next hard workout.
- Combine volume spikes, fatigue, readiness, RPE, and muscle concentration into one simple signal.
- Give practical load-management cues without presenting medical diagnosis.
- Keep all calculations private and derived from existing workout history.

## Rules

No Supabase schema changes. Joint stress guardrails are generated from saved private workout history.

The app derives:

- `jointStressGuardrails`: a private dashboard model.
- `Guardrail Score`: 0 to 100 score where higher means more caution is suggested.
- `Load Spike`: recent total-volume jump from the previous logged workout.
- `Pressure Zones`: muscle groups carrying the most current load pressure.
- `Coach Cue`: concise guidance for the next workout.

## UI

Add `Joint Stress Guardrails` to the Volume dashboard near fatigue, recovery, and training quality.

The panel shows:

- Guardrail Score.
- Status label.
- Load Spike.
- Fatigue.
- Readiness.
- Pressure Zones.
- Coach Cue.

## Verification

- Add `scripts/verify-joint-stress-guardrails-app.cjs`.
- Run the verifier before implementation and confirm it fails.
- Run all existing verifier scripts plus the new one.
- Run production build and refresh `lift-tracker-dist.zip`.
