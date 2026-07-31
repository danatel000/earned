# Challenge Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing Feed tab challenge block into a richer Challenge Hub.

**Architecture:** Add a pure `buildChallengeHub(history, customEx)` helper in `src/App.jsx`, then update `CommunityView` to render score, spotlight, weekly quest, and challenge cards from that helper.

**Tech Stack:** React, Vite, existing private workout history, no new dependencies.

## Global Constraints

- Do not change saved workout history shape.
- No Supabase schema changes.
- Keep challenges deterministic and private.
- Verify with `scripts/verify-challenge-hub-app.cjs` and production build.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-challenge-hub-app.cjs`

**Interfaces:**
- Produces verifier command: `node scripts/verify-challenge-hub-app.cjs`

- [x] **Step 1: Write failing verifier**

Check for helper names, Challenge Hub UI labels, returned property names, and README documentation.

- [x] **Step 2: Run verifier**

Expected before implementation: non-zero exit listing missing fragments.

### Task 2: Challenge Helper

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `buildChallengeHub(history, customEx)`

- [x] **Step 1: Add derived challenge calculations**

Use existing helpers for volume, streak, PR count, muscle balance, recovery week, and training quality.

- [x] **Step 2: Return hub metadata**

Return `challengeCards`, `completedCount`, `spotlightChallenge`, `challengeScore`, and `weeklyQuest`.

### Task 3: Feed UI

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `buildChallengeHub(history, customEx)`

- [x] **Step 1: Replace the plain Active Challenges block**

Render `Challenge Hub`, `Challenge Score`, `Spotlight Challenge`, `Weekly Quest`, and progress cards.

### Task 4: Docs And Verification

**Files:**
- Modify: `README.md`
- Generate: `dist`
- Generate: `lift-tracker-dist.zip`

- [x] **Step 1: Document private Challenge Hub behavior**
- [x] **Step 2: Run all verifier scripts**
- [x] **Step 3: Run production build**
- [x] **Step 4: Refresh deploy zip**
