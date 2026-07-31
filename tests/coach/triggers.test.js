import {describe, expect, it} from "vitest";
import {minimalContext} from "./fixtures.js";
import {buildProactiveTriggers} from "../../supabase/functions/_shared/coach/triggers.ts";

const state = (overrides = {}) => ({
  exerciseId: "cb_incline",
  exerciseName: "Incline Bench Press",
  strategy: "double_progression",
  decision: "hold",
  targetWeight: 155,
  targetReps: 8,
  targetSets: 3,
  observed: {
    weight: 155,
    reps: 8,
    sets: 3,
    rpe: 8,
    readinessScore: 70,
    setQuality: ["good"],
  },
  recommendation: {weight: 155, reps: 8, sets: 3},
  ruleId: "double_progression.hold",
  evidenceState: "well_supported",
  supportingPeriodIds: ["session-a"],
  ...overrides,
});

const session = (periodId, date, volume = 1000) => ({
  periodId,
  date,
  exercises: [{exerciseId: "cb_incline", volume}],
});

const sessionProvenance = (periodId, date) => ({
  id: `session:${periodId}`,
  type: "session",
  label: `Session ${periodId}`,
  periodId,
  exerciseId: null,
  setIndex: null,
  date,
});

const readinessProvenance = (date = "2026-07-27") => ({
  id: `readiness:${date}`,
  type: "readiness",
  label: `Readiness ${date}`,
  periodId: null,
  exerciseId: null,
  setIndex: null,
  date,
});

const contextWithEvidence = ({
  sessions = [],
  readiness = null,
  includeReadinessProvenance = false,
} = {}) => {
  const context = minimalContext();
  context.sessions = sessions;
  context.readiness = readiness;
  context.provenance = [
    ...sessions.map((row) => sessionProvenance(row.periodId, row.date)),
    ...(includeReadinessProvenance ? [readinessProvenance()] : []),
  ];
  return context;
};

const contextForStates = (states, overrides = {}) => {
  const rows = states.map((row, index) => {
    const periodId = row.supportingPeriodIds.at(-1);
    const date = /^\d{4}-\d{2}-\d{2}/.test(periodId)
      ? periodId
      : `2026-07-${String(20 + index).padStart(2, "0")}`;
    return session(periodId, date);
  });
  return contextWithEvidence({sessions: rows, ...overrides});
};

const input = (overrides = {}) => ({
  now: "2026-07-27T12:00:00.000Z",
  cadence: "daily",
  timeZone: "UTC",
  memberContext: minimalContext(),
  progressionStates: [],
  currentDraft: null,
  dismissedKeys: new Set(),
  mutedTypes: new Set(),
  ...overrides,
});

const plateauContext = (overrides = {}) => {
  const progressionStates = overrides.progressionStates ?? [
    state({supportingPeriodIds: ["session-a"]}),
    state({supportingPeriodIds: ["session-b"]}),
    state({supportingPeriodIds: ["session-c"]}),
  ];
  return input({
    ...overrides,
    progressionStates,
    memberContext: overrides.memberContext ?? contextForStates(progressionStates),
  });
};

const prOpportunityContext = () => {
  const progressionStates = [
    state({
      observed: {...state().observed, reps: 10},
      targetReps: 10,
      supportingPeriodIds: ["session-a"],
    }),
    state({
      observed: {...state().observed, reps: 10},
      targetReps: 10,
      supportingPeriodIds: ["session-b"],
    }),
  ];
  return input({
    memberContext: contextForStates(progressionStates, {
      readiness: {sleep: 4, energy: 4, soreness: 2, score: 78},
      includeReadinessProvenance: true,
    }),
    progressionStates,
  });
};

const lowReadinessHeavyDraft = () => {
  const context = contextWithEvidence({
    readiness: {sleep: 2, energy: 2, soreness: 5, score: 40},
    includeReadinessProvenance: true,
    sessions: [
      {periodId: "a", date: "2026-07-23", exercises: [{exerciseId: "squat", volume: 1000}]},
      {periodId: "b", date: "2026-07-25", exercises: [{exerciseId: "squat", volume: 1200}]},
    ],
  });
  return input({
    memberContext: context,
    currentDraft: {exercises: [{exerciseId: "squat", volume: 1800}]},
  });
};

describe("Coach proactive triggers", () => {
  it("creates the required evidence-backed trigger types", () => {
    expect(buildProactiveTriggers(plateauContext()).map((row) => row.type)).toContain("plateau");
    expect(buildProactiveTriggers(prOpportunityContext()).map((row) => row.type)).toContain("pr_opportunity");
    expect(buildProactiveTriggers(lowReadinessHeavyDraft()).map((row) => row.type))
      .toContain("readiness_mismatch");
    expect(buildProactiveTriggers(input())).toEqual([]);
  });

  it("requires exactly three distinct valid exposures for a plateau", () => {
    const duplicate = plateauContext({
      progressionStates: [
        state({supportingPeriodIds: ["session-a"]}),
        state({supportingPeriodIds: ["session-b"]}),
        state({supportingPeriodIds: ["session-b"]}),
      ],
    });
    const malformed = plateauContext({
      progressionStates: [
        state({supportingPeriodIds: ["session-a"]}),
        state({observed: {...state().observed, weight: Number.NaN}, supportingPeriodIds: ["session-b"]}),
        state({supportingPeriodIds: ["session-c"]}),
      ],
    });

    expect(buildProactiveTriggers(duplicate).map((row) => row.type)).not.toContain("plateau");
    expect(buildProactiveTriggers(malformed).map((row) => row.type)).not.toContain("plateau");
  });

  it("sorts progression evidence and does not let older rows replace the latest window", () => {
    const rows = [
      state({supportingPeriodIds: ["2026-07-26"], observed: {...state().observed, reps: 9}}),
      state({supportingPeriodIds: ["2026-07-20"]}),
      state({supportingPeriodIds: ["2026-07-25"], observed: {...state().observed, reps: 9}}),
      state({supportingPeriodIds: ["2026-07-24"], observed: {...state().observed, reps: 7}}),
    ];

    expect(buildProactiveTriggers(plateauContext({progressionStates: rows}))
      .map((row) => row.type)).not.toContain("plateau");
  });

  it("uses member session dates to sort opaque progression period IDs", () => {
    const memberContext = contextWithEvidence({sessions: [
      {periodId: "oldest", date: "2026-07-20", exercises: []},
      {periodId: "old", date: "2026-07-24", exercises: []},
      {periodId: "middle", date: "2026-07-25", exercises: []},
      {periodId: "new", date: "2026-07-26", exercises: []},
    ]});
    const rows = [
      state({supportingPeriodIds: ["new"], observed: {...state().observed, reps: 9}}),
      state({supportingPeriodIds: ["old"]}),
      state({supportingPeriodIds: ["middle"], observed: {...state().observed, reps: 9}}),
      state({supportingPeriodIds: ["oldest"], observed: {...state().observed, reps: 7}}),
    ];

    expect(buildProactiveTriggers(plateauContext({memberContext, progressionStates: rows}))
      .map((row) => row.type)).not.toContain("plateau");
  });

  it("does not count duplicate period evidence toward fatigue", () => {
    const rows = [
      state({supportingPeriodIds: ["session-a"], observed: {...state().observed, rpe: 9}}),
      state({supportingPeriodIds: ["session-b"], observed: {...state().observed, rpe: 9}}),
      state({supportingPeriodIds: ["session-b"], observed: {...state().observed, rpe: 9}}),
    ];

    expect(buildProactiveTriggers(input({
      progressionStates: rows,
      memberContext: contextForStates(rows),
    })).map((row) => row.type))
      .not.toContain("fatigue_deload");
  });

  it("keeps a material key stable across clock changes and changes it with the evidence window", () => {
    const first = buildProactiveTriggers(plateauContext())[0];
    const later = buildProactiveTriggers(plateauContext({
      now: "2026-07-27T23:59:59.000Z",
    }))[0];
    const changed = buildProactiveTriggers(plateauContext({
      progressionStates: [
        state({supportingPeriodIds: ["session-b"]}),
        state({supportingPeriodIds: ["session-c"]}),
        state({supportingPeriodIds: ["session-d"]}),
      ],
    }))[0];

    expect(later.key).toBe(first.key);
    expect(changed.key).not.toBe(first.key);
  });

  it("changes the material key when corrected evidence keeps the same period IDs", () => {
    const first = buildProactiveTriggers(plateauContext())[0];
    const corrected = buildProactiveTriggers(plateauContext({
      progressionStates: [
        state({
          observed: {...state().observed, weight: 150},
          supportingPeriodIds: ["session-a"],
        }),
        state({
          observed: {...state().observed, weight: 150},
          supportingPeriodIds: ["session-b"],
        }),
        state({
          observed: {...state().observed, weight: 150},
          supportingPeriodIds: ["session-c"],
        }),
      ],
    }))[0];

    expect(corrected.key).not.toBe(first.key);
  });

  it("suppresses dismissed material keys and muted trigger types", () => {
    const trigger = buildProactiveTriggers(plateauContext())[0];

    expect(buildProactiveTriggers(plateauContext({
      dismissedKeys: new Set([trigger.key]),
    }))).toEqual([]);
    expect(buildProactiveTriggers(plateauContext({
      mutedTypes: new Set(["plateau"]),
    }))).toEqual([]);
  });

  it("uses exact daily and weekly cadence boundaries for streak risk", () => {
    const context = contextWithEvidence({sessions: [
      {periodId: "previous", date: "2026-07-25", exercises: []},
      {periodId: "latest", date: "2026-07-26", exercises: []},
    ]});
    context.profile.daysPerWeek = 7;

    expect(buildProactiveTriggers(input({
      now: "2026-07-27T23:59:59.000Z",
      cadence: "daily",
      memberContext: context,
    })).map((row) => row.type)).toContain("streak_risk");
    expect(buildProactiveTriggers(input({
      now: "2026-07-28T00:00:00.000Z",
      cadence: "daily",
      memberContext: context,
    })).map((row) => row.type)).not.toContain("streak_risk");

    const weekly = contextWithEvidence({sessions: [
        {periodId: "previous", date: "2026-07-13", exercises: []},
        {periodId: "latest", date: "2026-07-20", exercises: []},
    ]});
    expect(buildProactiveTriggers(input({
      now: "2026-07-27T23:59:59.000Z",
      cadence: "weekly",
      memberContext: weekly,
    })).map((row) => row.type)).toContain("streak_risk");
    expect(buildProactiveTriggers(input({
      now: "2026-07-28T00:00:00.000Z",
      cadence: "weekly",
      memberContext: weekly,
    })).map((row) => row.type)).not.toContain("streak_risk");
  });

  it("does not create PR or readiness triggers from malformed readiness or draft load", () => {
    const malformedPr = prOpportunityContext();
    malformedPr.memberContext.readiness.score = Number.NaN;
    const malformedDraft = lowReadinessHeavyDraft();
    malformedDraft.currentDraft = {exercises: [{exerciseId: "squat", volume: "very heavy"}]};

    expect(buildProactiveTriggers(malformedPr).map((row) => row.type))
      .not.toContain("pr_opportunity");
    expect(buildProactiveTriggers(malformedDraft).map((row) => row.type))
      .not.toContain("readiness_mismatch");
  });

  it("detects fatigue only within the latest three-exposure window", () => {
    const rows = [
      state({supportingPeriodIds: ["2026-07-20"], observed: {...state().observed, rpe: 9.5}}),
      state({supportingPeriodIds: ["2026-07-24"], observed: {...state().observed, rpe: 7}}),
      state({supportingPeriodIds: ["2026-07-25"], observed: {...state().observed, rpe: 7}}),
      state({supportingPeriodIds: ["2026-07-26"], observed: {...state().observed, rpe: 9.5}}),
    ];
    expect(buildProactiveTriggers(input({
      progressionStates: rows,
      memberContext: contextForStates(rows),
    })).map((row) => row.type))
      .not.toContain("fatigue_deload");

    rows[2] = state({
      supportingPeriodIds: ["2026-07-25"],
      observed: {...state().observed, rpe: 9},
    });
    expect(buildProactiveTriggers(input({
      progressionStates: rows,
      memberContext: contextForStates(rows),
    })).map((row) => row.type))
      .toContain("fatigue_deload");
  });

  it("fails closed when the newest progression row is malformed or chronology is ambiguous", () => {
    const malformedRows = [
      state({supportingPeriodIds: ["session-a"]}),
      state({supportingPeriodIds: ["session-b"]}),
      state({supportingPeriodIds: ["session-c"]}),
      state({
        supportingPeriodIds: ["session-d"],
        observed: {...state().observed, weight: Number.NaN},
      }),
    ];
    const ambiguousRows = [
      state({supportingPeriodIds: ["session-a"]}),
      state({supportingPeriodIds: ["session-b"]}),
      state({supportingPeriodIds: ["opaque-newest"]}),
    ];
    const ambiguousContext = contextWithEvidence({
      sessions: [
        session("session-a", "2026-07-20"),
        session("session-b", "2026-07-21"),
      ],
    });
    ambiguousContext.provenance.push(sessionProvenance("opaque-newest", null));

    expect(buildProactiveTriggers(plateauContext({
      progressionStates: malformedRows,
    })).map((row) => row.type)).not.toContain("plateau");
    expect(buildProactiveTriggers(plateauContext({
      progressionStates: ambiguousRows,
      memberContext: ambiguousContext,
    })).map((row) => row.type)).not.toContain("plateau");
  });

  it("requires sufficient progression evidence and explicit acceptable quality", () => {
    const insufficientRows = [
      state({supportingPeriodIds: ["session-a"], evidenceState: "insufficient_evidence"}),
      state({supportingPeriodIds: ["session-b"], evidenceState: "insufficient_evidence"}),
      state({supportingPeriodIds: ["session-c"], evidenceState: "insufficient_evidence"}),
    ];
    const noQuality = prOpportunityContext();
    noQuality.progressionStates = noQuality.progressionStates.map((row) => ({
      ...row,
      observed: {...row.observed, setQuality: []},
    }));

    expect(buildProactiveTriggers(plateauContext({
      progressionStates: insufficientRows,
    })).map((row) => row.type)).not.toContain("plateau");
    expect(buildProactiveTriggers(noQuality).map((row) => row.type))
      .not.toContain("pr_opportunity");
  });

  it("does not call a 5, 6, 5 rep window a plateau", () => {
    const rows = [5, 6, 5].map((reps, index) => state({
      observed: {...state().observed, reps},
      targetReps: 8,
      supportingPeriodIds: [`session-${index}`],
    }));

    expect(buildProactiveTriggers(plateauContext({
      progressionStates: rows,
    })).map((row) => row.type)).not.toContain("plateau");
  });

  it("uses one chronological deduplicated session window for load median and evidence", () => {
    const recent = Array.from({length: 5}, (_, index) =>
      session(`recent-${index}`, `2026-07-${String(20 + index).padStart(2, "0")}`, 1000));
    const old = Array.from({length: 5}, (_, index) =>
      session(`old-${index}`, `2026-07-${String(1 + index).padStart(2, "0")}`, 100));
    const memberContext = contextWithEvidence({
      sessions: [...recent, ...old],
      readiness: {sleep: 2, energy: 2, soreness: 5, score: 40},
      includeReadinessProvenance: true,
    });

    expect(buildProactiveTriggers(input({
      memberContext,
      currentDraft: {exercises: [{exerciseId: "squat", volume: 500}]},
    })).map((row) => row.type)).not.toContain("readiness_mismatch");
  });

  it("uses member-local calendar dates across offset changes", () => {
    const memberContext = contextWithEvidence({sessions: [
      session("previous", "2026-10-31T12:00:00-04:00"),
      session("latest", "2026-11-01T12:00:00-05:00"),
    ]});

    expect(buildProactiveTriggers(input({
      now: "2026-11-02T23:59:00-05:00",
      timeZone: "America/New_York",
      memberContext,
    })).map((row) => row.type)).toContain("streak_risk");
    expect(buildProactiveTriggers(input({
      now: "2026-11-03T00:00:00-05:00",
      timeZone: "America/New_York",
      memberContext,
    })).map((row) => row.type)).not.toContain("streak_risk");
  });

  it("sorts final triggers deterministically regardless of progression input order", () => {
    const rows = ["b", "a"].flatMap((exerciseId) =>
      [1, 2, 3].map((index) => state({
        exerciseId,
        exerciseName: exerciseId.toUpperCase(),
        supportingPeriodIds: [`${exerciseId}-${index}`],
      })));
    const memberContext = contextForStates(rows);
    const forward = buildProactiveTriggers(input({memberContext, progressionStates: rows}));
    const reverse = buildProactiveTriggers(input({
      memberContext,
      progressionStates: [...rows].reverse(),
    }));

    expect(reverse.map((row) => row.key)).toEqual(forward.map((row) => row.key));
    expect(forward.map((row) => row.key)).toEqual(
      [...forward.map((row) => row.key)].sort(),
    );
  });

  it("emits only resolvable provenance IDs and suppresses missing provenance", () => {
    const withProvenance = lowReadinessHeavyDraft();
    const triggers = buildProactiveTriggers(withProvenance);
    const provenanceIds = new Set(withProvenance.memberContext.provenance.map((row) => row.id));
    expect(triggers.flatMap((row) => row.evidenceRefs)
      .every((ref) => provenanceIds.has(ref))).toBe(true);

    const withoutReadinessProvenance = lowReadinessHeavyDraft();
    withoutReadinessProvenance.memberContext.provenance =
      withoutReadinessProvenance.memberContext.provenance
        .filter((row) => row.type !== "readiness");
    expect(buildProactiveTriggers(withoutReadinessProvenance).map((row) => row.type))
      .not.toContain("readiness_mismatch");
  });

  it("rejects session provenance whose local date contradicts the canonical session", () => {
    const context = plateauContext();
    context.memberContext.provenance = context.memberContext.provenance.map((row) => ({
      ...row,
      date: "2026-01-01",
    }));

    expect(buildProactiveTriggers(context).map((row) => row.type))
      .not.toContain("plateau");
  });

  it("requires readiness provenance from the exact current local window", () => {
    const memberContext = contextWithEvidence({
      readiness: {sleep: 5, energy: 5, soreness: 1, score: 80},
    });
    memberContext.provenance = [readinessProvenance("2026-07-27")];

    expect(buildProactiveTriggers(input({
      now: "2026-08-03T12:00:00Z",
      memberContext,
      currentDraft: {restDay: true, scheduledDate: "2026-08-03"},
    })).map((row) => row.type)).not.toContain("readiness_mismatch");
  });

  it("defaults omitted timezone deterministically without breaking the brief input", () => {
    const explicitUtc = plateauContext();
    const briefCompatible = plateauContext();
    delete briefCompatible.timeZone;

    expect(buildProactiveTriggers(briefCompatible).map((row) => row.type)).toContain("plateau");
    expect(buildProactiveTriggers(briefCompatible)).toEqual(
      buildProactiveTriggers(explicitUtc),
    );
  });

  it("includes rest-day schedule and local window identity in material keys", () => {
    const julyContext = contextWithEvidence({
      readiness: {sleep: 5, energy: 5, soreness: 1, score: 80},
      includeReadinessProvenance: true,
    });
    const augustContext = contextWithEvidence({
      readiness: {sleep: 5, energy: 5, soreness: 1, score: 80},
    });
    augustContext.provenance = [readinessProvenance("2026-08-03")];
    const july = buildProactiveTriggers(input({
      now: "2026-07-27T12:00:00Z",
      memberContext: julyContext,
      currentDraft: {restDay: true, scheduledDate: "2026-07-27"},
    })).find((row) => row.type === "readiness_mismatch");
    const august = buildProactiveTriggers(input({
      now: "2026-08-03T12:00:00Z",
      memberContext: augustContext,
      currentDraft: {restDay: true, scheduledDate: "2026-08-03"},
    })).find((row) => row.type === "readiness_mismatch");

    expect(july.evidenceRefs).toEqual(["readiness:2026-07-27"]);
    expect(august.evidenceRefs).toEqual(["readiness:2026-08-03"]);
    expect(august.key).not.toBe(july.key);
  });

  it("returns complete deterministic trigger metadata", () => {
    const trigger = buildProactiveTriggers(plateauContext())[0];
    expect(trigger).toMatchObject({
      type: "plateau",
      ruleId: "plateau.three_exposures_no_progress",
      deepLinkMode: "planning",
    });
    expect(trigger.evidenceRefs).toEqual([
      "session:session-a",
      "session:session-b",
      "session:session-c",
    ]);
    expect(trigger.title).toBeTruthy();
    expect(trigger.summary).toBeTruthy();
    expect(trigger.prompt).toBeTruthy();
  });
});
