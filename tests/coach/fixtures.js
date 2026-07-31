export const exposure = (overrides = {}) => ({
  periodId: "session-a",
  date: "2026-07-20",
  weight: 155,
  reps: 8,
  sets: 3,
  rpe: 8,
  readinessScore: 70,
  setQuality: [],
  ...overrides,
});

export const chunk = (overrides = {}) => ({
  id: "chunk-1",
  sourceId: "hhs-pag-2e",
  sourceVersion: "2026-07-27.1",
  title: "Physical Activity Guidelines for Americans",
  url: "https://health.gov/",
  text: "Progressive muscle-strengthening activity can improve strength.",
  score: 0.8,
  lastReviewedAt: "2026-07-27",
  ...overrides,
});

export const minimalContext = () => ({
  schemaVersion: 1,
  userId: "user-1",
  mode: "planning",
  goals: {},
  readiness: null,
  sessions: [],
  draft: null,
  profile: {},
  provenance: [],
  missingData: ["workout_history"],
});

export const answerFixture = (overrides = {}) => ({
  schemaVersion: 1,
  requestId: "00000000-0000-0000-0000-000000000001",
  threadId: "00000000-0000-0000-0000-000000000002",
  sections: {
    groundedGuidance: [{text: "Progress gradually.", citationIds: ["citation-1"]}],
    userPattern: [],
    recommendation: "Hold the current load.",
    whyThisFits: [],
  },
  evidence: {
    state: "partially_supported",
    reasons: ["One source"],
    missingData: ["second exposure"],
  },
  citations: [{
    id: "citation-1",
    sourceId: "hhs-pag-2e",
    title: "Physical Activity Guidelines",
    url: "https://health.gov/",
    snippet: "Progressive muscle-strengthening activity.",
    publishedAt: "2018-01-01",
    lastReviewedAt: "2026-07-27",
  }],
  provenance: [],
  selectedActionIds: [],
  ...overrides,
});

export const progressionAction = (overrides = {}) => ({
  id: "progression:cb_incline:hold",
  type: "progression",
  label: "Use this target",
  explanation: "Repeat the current target.",
  payload: {exerciseId: "cb_incline", weight: 155, reps: 8, sets: 3},
  requiresConfirmation: true,
  ...overrides,
});

export const plateauTrigger = (overrides = {}) => ({
  key: "plateau:cb_incline:2026-07-27",
  type: "plateau",
  title: "Review plateau",
  summary: "Three stable exposures.",
  prompt: "Review my incline bench plateau",
  evidenceRefs: ["session-a", "session-b", "session-c"],
  deepLinkMode: "planning",
  ...overrides,
});
