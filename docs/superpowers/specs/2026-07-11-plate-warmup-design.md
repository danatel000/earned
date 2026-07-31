# Plate Calculator And Warmup Planner Design

Approved direction: continue HIU with a Strong-style speed feature for the Log tab.

## Goals

- Help lifters load barbell exercises faster during a workout.
- Suggest a simple warmup ramp from the active exercise working weight.
- Keep the feature instant, private, and derived from the current draft inputs.
- Avoid changing saved workout history, Supabase schema, or public feed data.

## Rules

No saved workout data changes. The feature reads the active exercise only.

The app derives:

- `buildPlateLoad(weight, barWeight)`: barbell plate counts per side using common plates.
- `buildWarmupPlan(weight, reps, equipment)`: warmup sets based on percentages of the working weight.
- Active Exercise Focus shows the plate load and warmups for the currently focused exercise.

Plate loading uses a 45 lb bar and common plates: 45, 35, 25, 10, 5, and 2.5 lb. Non-barbell lifts still show warmups, but the plate section explains that a bar load is not needed.

## UI

Add two compact sections inside `Active Exercise Focus`:

- `Plate Calculator`: shows working weight, bar load, and plates per side.
- `Warmup Planner`: shows several ramp sets before the working set.

## Verification

- Add `scripts/verify-plate-warmup-app.cjs`.
- Run the verifier before implementation and confirm it fails.
- Run all existing verifier scripts plus the new one.
- Run production build and refresh `lift-tracker-dist.zip`.
