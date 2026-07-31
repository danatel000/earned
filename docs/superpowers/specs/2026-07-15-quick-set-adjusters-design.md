# Quick Set Adjusters Design

## Goal
Add fast per-set adjustment buttons in the Log tab so users can update copied or suggested set values without retyping while training.

## User Value
- Reduces friction during rest periods.
- Makes Copy Last Workout and Add Suggested Set more useful because values can be nudged quickly.
- Keeps the app closer to Strong/Hevy-style few-tap workout logging.

## Requirements
- Add a handler named `adjustSetValue`.
- Each set row must show a "Quick Adjust" row.
- The quick controls must include:
  - "-5 lb"
  - "+5 lb"
  - "-1 rep"
  - "+1 rep"
- Controls must be disabled when the exercise is skipped.
- Adjusting a value must:
  - update only the chosen set row
  - preserve set quality tags
  - never reduce values below zero
  - clear skipped state for the exercise
  - unconfirm the day
- Do not change volume math, saved payload shape, Supabase schema, or history migration logic.

## Non-Goals
- No custom increment settings in this slice.
- No plate-specific increment detection.
- No changes to edit-saved-workout controls.
