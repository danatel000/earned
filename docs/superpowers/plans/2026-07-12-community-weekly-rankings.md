# Community Weekly Rankings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Feed leaderboard so it ranks lifters by their best visible public workout instead of ranking raw posts.

**Architecture:** Add a pure `buildCommunityLeaderboard(publicPosts, publicProfiles, currentUserId)` helper in `src/App.jsx`, render it with `CommunityLeaderboardPanel`, and reuse existing public reaction/comment handlers. The panel consumes already-loaded public summary rows and does not add Supabase tables.

**Tech Stack:** React, Vite, existing Supabase public workout summary rows, no new dependencies.

## Global Constraints

- No Supabase schema changes.
- Do not expose private workout details beyond existing public summary rows.
- Keep Everyone / Following filtering intact.
- Verify with `scripts/verify-community-weekly-rankings-app.cjs` and production build.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-community-weekly-rankings-app.cjs`

**Interfaces:**
- Produces verifier command: `node scripts/verify-community-weekly-rankings-app.cjs`

- [x] **Step 1: Write failing verifier**

Check for leaderboard helper, panel, one-row-per-lifter wording, summary labels, handler reuse, and README documentation.

- [x] **Step 2: Run verifier**

Expected before implementation: non-zero exit listing missing fragments.

### Task 2: Leaderboard Helper

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `buildCommunityLeaderboard(publicPosts, publicProfiles, currentUserId)`

- [x] **Step 1: Deduplicate visible posts into `topByUser`**
- [x] **Step 2: Sort rows by score, volume, PRs, and week**
- [x] **Step 3: Return `currentUserRank`, `bestScore`, `topVolume`, and `activeLifters`**

### Task 3: Feed UI

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `buildCommunityLeaderboard`
- Produces: `CommunityLeaderboardPanel`

- [x] **Step 1: Move the leaderboard section into a component**
- [x] **Step 2: Add Weekly Rankings summary cards**
- [x] **Step 3: Keep reaction and comment controls on ranked lifter rows**

### Task 4: Docs And Verification

**Files:**
- Modify: `README.md`
- Generate: `dist`
- Generate: `lift-tracker-dist.zip`

- [x] **Step 1: Document community leaderboard upgrades**
- [x] **Step 2: Run all verifier scripts**
- [x] **Step 3: Run production build**
- [x] **Step 4: Refresh deploy zip**
