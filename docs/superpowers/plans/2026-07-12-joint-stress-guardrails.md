# Joint Stress Guardrails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a private dashboard guardrail that flags training-load patterns that deserve caution.

**Architecture:** Add a pure `buildJointStressGuardrails(history, customEx)` helper in `src/App.jsx`, then render it with a `JointStressGuardrails` dashboard card near existing fatigue and recovery widgets. The feature reads existing private history only and does not alter saved data.

**Tech Stack:** React, Vite, existing private workout history, no new dependencies.

## Global Constraints

- No Supabase schema changes.
- Do not change saved workout volume calculations.
- Do not present medical diagnosis or injury prediction certainty.
- Verify with `scripts/verify-joint-stress-guardrails-app.cjs` and production build.

---

### Task 1: Verifier

**Files:**
- Create: `scripts/verify-joint-stress-guardrails-app.cjs`

**Interfaces:**
- Produces verifier command: `node scripts/verify-joint-stress-guardrails-app.cjs`

- [x] **Step 1: Write failing verifier**

Check for the helper, dashboard component, UI labels, coach cue, pressure zones, and README documentation.

- [x] **Step 2: Run verifier**

Expected before implementation: non-zero exit listing missing fragments.

### Task 2: Guardrail Helper

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `buildJointStressGuardrails(history, customEx)`

- [x] **Step 1: Calculate total-volume jump, fatigue, readiness, and recent high-stress count**
- [x] **Step 2: Calculate muscle pressure zones from latest volume and recent averages**
- [x] **Step 3: Generate status, score, and coach cue**

### Task 3: Dashboard UI

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `jointStressGuardrails`

- [x] **Step 1: Add `JointStressGuardrails` component**
- [x] **Step 2: Render it in `TotalVolumeView` near fatigue and recovery widgets**
- [x] **Step 3: Show Guardrail Score, Load Spike, Pressure Zones, and Coach Cue**

### Task 4: Docs And Verification

**Files:**
- Modify: `README.md`
- Generate: `dist`
- Generate: `lift-tracker-dist.zip`

- [x] **Step 1: Document private joint stress guardrails**
- [x] **Step 2: Run all verifier scripts**
- [x] **Step 3: Run production build**
- [x] **Step 4: Refresh deploy zip**
