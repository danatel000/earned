# Achievements And Milestones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add private achievement and milestone tracking to the Volume dashboard.

**Architecture:** Add a pure milestone builder in `src/App.jsx` that derives progress from `history` and `customEx`. Replace the current lightweight badge component with a richer dashboard panel that consumes that helper.

**Tech Stack:** React, Vite, existing private workout history, no new dependencies, no Supabase schema changes.

## Global Constraints

- Do not change saved workout history shape.
- Do not add public feed fields or Supabase tables.
- Keep milestone calculations deterministic and private.
- Verify with `scripts/verify-achievements-milestones-app.cjs` and production build.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-achievements-milestones-app.cjs`

**Interfaces:**
- Produces verifier command: `node scripts/verify-achievements-milestones-app.cjs`

- [x] **Step 1: Write failing verifier**

Check for helper names, component names, dashboard copy, milestone category labels, and README documentation.

- [x] **Step 2: Run verifier**

Expected before implementation: non-zero exit listing missing fragments.

### Task 2: Milestone Helper

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `buildAchievementMilestones(history, customEx)`

- [x] **Step 1: Add deterministic milestone calculations**

Compute workout count, lifetime volume, PR count, current streak, and lifetime muscle-group volume.

- [x] **Step 2: Return sorted milestone metadata**

Return `achievementMilestones`, `unlockedCount`, and `nextMilestone` data through the helper's result object.

### Task 3: Dashboard Panel

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `buildAchievementMilestones(history, customEx)`
- Produces component: `AchievementMilestonesPanel({history, customEx})`

- [x] **Step 1: Replace the old `AchievementBadges` component**

Render the new `Achievements & Milestones` panel with progress bars and compact cards.

- [x] **Step 2: Render it in `TotalVolumeView`**

Place it near the premium coaching cards so it feels like part of HIU analytics.

### Task 4: Docs And Verification

**Files:**
- Modify: `README.md`
- Generate: `dist`
- Generate: `lift-tracker-dist.zip`

- [x] **Step 1: Document private milestone behavior**
- [x] **Step 2: Run all verifier scripts**
- [x] **Step 3: Run production build**
- [x] **Step 4: Refresh deploy zip**
