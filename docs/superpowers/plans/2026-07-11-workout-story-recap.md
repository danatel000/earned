# Workout Story Recap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add generated workout storytelling to the post-save recap and local Workout Feed.

**Architecture:** Add a pure `buildWorkoutStory(entry, previousHistory, customEx)` helper, then have `buildWorkoutRecap` include story fields and upgraded share text. Render the story in the saved recap and feed card surfaces.

**Tech Stack:** React, Vite, existing private workout history, no new dependencies.

## Global Constraints

- No Supabase schema changes.
- Do not change saved workout history shape.
- Do not alter volume calculations.
- Verify with `scripts/verify-workout-story-recap-app.cjs` and production build.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-workout-story-recap-app.cjs`

**Interfaces:**
- Produces verifier command: `node scripts/verify-workout-story-recap-app.cjs`

- [x] **Step 1: Write failing verifier**

Check for helper name, story field names, UI labels, copy button text, and README documentation.

- [x] **Step 2: Run verifier**

Expected before implementation: non-zero exit listing missing fragments.

### Task 2: Story Helper

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `buildWorkoutStory(entry, previousHistory, customEx)`
- Extends: `buildWorkoutRecap(entry, previousHistory, customEx)`

- [x] **Step 1: Add story generation helper**
- [x] **Step 2: Include story fields in workout recap and share text**

### Task 3: Recap And Feed UI

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `recap.storyHeadline`, `recap.storyNarrative`, `recap.storyHighlights`

- [x] **Step 1: Add saved recap `Workout Story` card**
- [x] **Step 2: Add local feed `Story` section**
- [x] **Step 3: Rename copy button to `Copy Story Recap`**

### Task 4: Docs And Verification

**Files:**
- Modify: `README.md`
- Generate: `dist`
- Generate: `lift-tracker-dist.zip`

- [x] **Step 1: Document post-workout storytelling**
- [x] **Step 2: Run all verifier scripts**
- [x] **Step 3: Run production build**
- [x] **Step 4: Refresh deploy zip**
