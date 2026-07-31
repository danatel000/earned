import {describe, expect, it} from "vitest";
import {
  buildMemberContext,
  buildSessionRef,
  filterExcludedData,
} from "../../supabase/functions/_shared/coach/member-context.ts";
import {DEFAULT_COACH_SETTINGS} from "../../supabase/functions/_shared/coach/settings.ts";

const session = (overrides = {}) => ({
  periodId: "day-a",
  periodType: "day",
  dayKey: "legs",
  date: "2026-07-01",
  notes: "private note",
  exercises: {
    squat: {
      w: 225,
      r: 5,
      s: 2,
      volume: 2250,
      setDetails: [
        {w: 225, r: 5, quality: "good"},
        {w: 225, r: 5, quality: "slow"},
      ],
    },
  },
  readiness: {sleep: 4, energy: 3, soreness: 2},
  ...overrides,
});

const input = (overrides = {}) => ({
  userId: "user-1",
  appData: {
    history: [session()],
    goals: {weeklyVolume: 12000},
    customEx: {},
    preferences: {},
  },
  draft: null,
  settings: DEFAULT_COACH_SETTINGS,
  exclusions: [],
  mode: "planning",
  ...overrides,
});

describe("Coach member context", () => {
  it("removes excluded sessions and disabled categories", () => {
    const context = buildMemberContext(input({
      appData: {
        history: [
          session(),
          session({periodId: "day-b", date: "2026-07-08", notes: "keep"}),
        ],
        goals: {weeklyVolume: 12000},
        customEx: {},
        preferences: {},
      },
      settings: {
        ...DEFAULT_COACH_SETTINGS,
        permissions: {...DEFAULT_COACH_SETTINGS.permissions, notes: false},
      },
      exclusions: [{target_type: "session", target_key: "day-a", selector: {}}],
    }));

    expect(context.sessions.map((row) => row.periodId)).toEqual(["day-b"]);
    expect(context.sessions[0]).not.toHaveProperty("notes");
  });

  it("uses periodId as the deep-link provenance key", () => {
    expect(buildSessionRef({periodId: "day-123", date: "2026-07-08"}, 3)).toMatchObject({
      periodId: "day-123",
      date: "2026-07-08",
      type: "session",
    });
  });

  it("applies inclusive date-range, exercise, and data-category exclusions", () => {
    const filtered = filterExcludedData(input({
      appData: {
        history: [
          session({periodId: "before", date: "2026-06-30"}),
          session({periodId: "from", date: "2026-07-01"}),
          session({periodId: "to", date: "2026-07-08"}),
          session({
            periodId: "after",
            date: "2026-07-09",
            exercises: {
              squat: session().exercises.squat,
              row: {w: 100, r: 10, s: 1, volume: 1000},
            },
          }),
        ],
        goals: {weeklyVolume: 12000},
        customEx: {},
        preferences: {},
      },
      exclusions: [
        {target_type: "date_range", target_key: "vacation", selector: {from: "2026-07-01", to: "2026-07-08"}},
        {target_type: "exercise", target_key: "squat", selector: {}},
        {target_type: "data_category", target_key: "goals", selector: {}},
        {target_type: "data_category", target_key: "readiness", selector: {}},
      ],
    }));

    expect(filtered.analyticsSessions.map((row) => row.periodId)).toEqual(["before", "after"]);
    expect(Object.keys(filtered.analyticsSessions[1].exercises)).toEqual(["row"]);
    expect(filtered.goals).toEqual({});
    expect(filtered.readiness).toBeNull();
  });

  it("limits generation to 12 sessions and analytics to 52 sessions", () => {
    const history = Array.from({length: 60}, (_, index) => session({
      periodId: `day-${index}`,
      date: `2026-${String(Math.floor(index / 28) + 1).padStart(2, "0")}-${String((index % 28) + 1).padStart(2, "0")}`,
    }));

    const filtered = filterExcludedData(input({appData: {...input().appData, history}}));
    const context = buildMemberContext(input({appData: {...input().appData, history}}));

    expect(filtered.analyticsSessions).toHaveLength(52);
    expect(context.sessions).toHaveLength(12);
    expect(context.sessions[0].periodId).toBe("day-48");
    expect(context.sessions[11].periodId).toBe("day-59");
  });

  it("creates stable legacy and exact set provenance references", () => {
    const legacy = session({periodId: undefined, date: "2026-07-08", week: 4});
    const context = buildMemberContext(input({appData: {...input().appData, history: [legacy]}}));

    expect(context.sessions[0].periodId).toBe("legacy:2026-07-08:4:0");
    expect(context.provenance).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: "set",
        periodId: "legacy:2026-07-08:4:0",
        exerciseId: "squat",
        setIndex: 0,
      }),
      expect.objectContaining({
        type: "set",
        periodId: "legacy:2026-07-08:4:0",
        exerciseId: "squat",
        setIndex: 1,
      }),
    ]));
  });

  it("treats missing readiness as missing and strips unrelated private data", () => {
    const context = buildMemberContext(input({
      appData: {
        history: [session({readiness: undefined, email: "member@example.com", comments: ["secret"]})],
        goals: {weeklyVolume: 12000},
        customEx: {_social: {posts: ["secret"]}},
        preferences: {username: "private"},
        password: "secret",
        billingState: "active",
      },
      draft: {
        activeDay: "legs",
        inputs: {
          legs: {squat: {w: "225", r: "5", s: "2"}},
          chestBack: {row: {w: "100", r: "10", s: "1"}},
        },
        email: "member@example.com",
        comments: ["secret"],
      },
    }));

    expect(context.readiness).toBeNull();
    expect(context.missingData).toContain("readiness");
    expect(JSON.stringify(context)).not.toMatch(/member@example\.com|secret|billingState|username|comments|password/);
  });

  it("honors disabled workout and note permissions", () => {
    const context = buildMemberContext(input({
      settings: {
        ...DEFAULT_COACH_SETTINGS,
        permissions: {
          ...DEFAULT_COACH_SETTINGS.permissions,
          workouts: false,
          notes: true,
        },
      },
    }));

    expect(context.sessions).toEqual([]);
    expect(context.provenance.filter((ref) => ref.type === "session" || ref.type === "set")).toEqual([]);
    expect(context.missingData).toContain("workout_history");
  });

  it("uses current draft readiness and notes only when permitted", () => {
    const permitted = buildMemberContext(input({
      draft: {
        activeDay: "legs",
        notes: "current private note",
        readiness: {sleep: 5, energy: 5, soreness: 1},
        inputs: {legs: {squat: {w: "225", r: "5", s: "2"}}},
      },
      settings: {
        ...DEFAULT_COACH_SETTINGS,
        permissions: {...DEFAULT_COACH_SETTINGS.permissions, notes: true},
      },
    }));
    const denied = buildMemberContext(input({
      draft: {
        activeDay: "legs",
        notes: "current private note",
        readiness: {sleep: 5, energy: 5, soreness: 1},
        inputs: {legs: {squat: {w: "225", r: "5", s: "2"}}},
      },
      settings: {
        ...DEFAULT_COACH_SETTINGS,
        permissions: {
          ...DEFAULT_COACH_SETTINGS.permissions,
          readiness: false,
          notes: false,
        },
      },
    }));

    expect(permitted.readiness).toEqual({sleep: 5, energy: 5, soreness: 1, score: 100});
    expect(permitted.draft).toMatchObject({notes: "current private note"});
    expect(denied.readiness).toBeNull();
    expect(denied.draft).not.toHaveProperty("notes");
    expect(denied.draft).not.toHaveProperty("readiness");
  });

  it("removes profile limitations without permission", () => {
    const context = buildMemberContext(input({
      settings: {
        ...DEFAULT_COACH_SETTINGS,
        profile: {...DEFAULT_COACH_SETTINGS.profile, limitations: ["private injury"]},
        permissions: {...DEFAULT_COACH_SETTINGS.permissions, limitations: false},
      },
    }));

    expect(context.profile.limitations).toEqual([]);
  });

  it("returns detached allowlisted analytics with category gates", () => {
    const source = input({
      appData: {
        history: [session({
          email: "member@example.com",
          comments: ["secret"],
          exercises: {
            squat: {
              ...session().exercises.squat,
              privateTag: "secret",
            },
          },
        })],
        goals: {weeklyVolume: 12000},
      },
      settings: {
        ...DEFAULT_COACH_SETTINGS,
        permissions: {...DEFAULT_COACH_SETTINGS.permissions, notes: false, readiness: false},
      },
    });

    const filtered = filterExcludedData(source);
    const row = filtered.analyticsSessions[0];
    expect(Object.keys(row).sort()).toEqual([
      "date", "dayKey", "deload", "exercises", "periodId", "periodType", "rating", "rpe", "week",
    ]);
    expect(row).not.toHaveProperty("notes");
    expect(row).not.toHaveProperty("readiness");
    expect(JSON.stringify(filtered)).not.toMatch(/member@example\.com|secret/);
    expect(Object.keys(row.exercises.squat).sort()).toEqual(["r", "s", "setDetails", "volume", "w"]);

    row.exercises.squat.setDetails[0].w = 999;
    row.exercises.squat.w = 999;
    expect(source.appData.history[0].exercises.squat.setDetails[0].w).toBe(225);
    expect(source.appData.history[0].exercises.squat.w).toBe(225);
  });

  it("projects only the active persisted draft inputs and applies exercise exclusions", () => {
    const context = buildMemberContext(input({
      draft: {
        activeDay: "legs",
        trackingMode: "daily",
        completedDays: {legs: true},
        inputs: {
          legs: {
            squat: {
              w: "225",
              r: "5",
              s: "2",
              skipped: false,
              setDetails: [
                {w: "225", r: "5", quality: "good", privateTag: "secret"},
                {w: "220", r: "5", quality: "slow"},
              ],
              email: "member@example.com",
            },
            row: {w: "100", r: "10", s: "1"},
          },
          chestBack: {bench: {w: "185", r: "5", s: "3"}},
        },
      },
      exclusions: [{target_type: "exercise", target_key: "row", selector: {}}],
    }));

    expect(context.draft).toEqual({
      activeDay: "legs",
      trackingMode: "daily",
      inputs: {
        legs: {
          squat: {
            weight: 225,
            reps: 5,
            sets: 2,
            skipped: false,
            setRows: [
              {weight: 225, reps: 5, quality: "good"},
              {weight: 220, reps: 5, quality: "slow"},
            ],
          },
        },
      },
    });
  });

  it("preserves source set indexes when malformed set rows are skipped", () => {
    const malformed = session({
      exercises: {
        squat: {
          w: 225,
          r: 5,
          s: 3,
          volume: 2250,
          setDetails: [
            null,
            {w: 225, r: 5, quality: "good"},
            {w: "bad", r: 5, quality: "bad"},
          ],
        },
      },
    });
    const context = buildMemberContext(input({appData: {...input().appData, history: [malformed]}}));

    expect(context.sessions[0].exercises[0].setRows).toEqual([
      {weight: 225, reps: 5, quality: "good"},
    ]);
    expect(context.provenance.filter((ref) => ref.type === "set")).toEqual([
      expect.objectContaining({periodId: "day-a", exerciseId: "squat", setIndex: 1}),
    ]);
  });

  it.each([
    {sleep: false, energy: false, soreness: false},
    {sleep: 0, energy: 3, soreness: 3},
    {sleep: 6, energy: 3, soreness: 3},
    {sleep: Number.POSITIVE_INFINITY, energy: 3, soreness: 3},
    {sleep: "5", energy: "5", soreness: "1"},
  ])("fails closed for malformed readiness %#", (readiness) => {
    const context = buildMemberContext(input({
      appData: {...input().appData, history: [session({readiness})]},
      draft: {activeDay: "legs", readiness},
    }));

    expect(context.readiness).toBeNull();
    expect(context.missingData).toContain("readiness");
  });

  it("projects and detaches exactly the five profile fields", () => {
    const settings = {
      ...DEFAULT_COACH_SETTINGS,
      permissions: {...DEFAULT_COACH_SETTINGS.permissions, limitations: true},
      profile: {
        primaryGoal: "strength",
        experience: "advanced",
        daysPerWeek: 4,
        equipment: ["barbell"],
        limitations: ["knee"],
        email: "member@example.com",
      },
    };
    const context = buildMemberContext(input({settings}));

    expect(context.profile).toEqual({
      primaryGoal: "strength",
      experience: "advanced",
      daysPerWeek: 4,
      equipment: ["barbell"],
      limitations: ["knee"],
    });
    context.profile.equipment.push("rack");
    context.profile.limitations.push("shoulder");
    expect(settings.profile.equipment).toEqual(["barbell"]);
    expect(settings.profile.limitations).toEqual(["knee"]);
  });

  it("applies workout and note categories to analytics and draft outputs", () => {
    const notesExcluded = filterExcludedData(input({
      settings: {
        ...DEFAULT_COACH_SETTINGS,
        permissions: {...DEFAULT_COACH_SETTINGS.permissions, notes: true},
      },
      draft: {
        activeDay: "legs",
        notes: "draft note",
        inputs: {legs: {squat: {w: "225", r: "5", s: "2"}}},
      },
      exclusions: [{target_type: "data_category", target_key: "notes", selector: {}}],
    }));
    const workoutsExcluded = filterExcludedData(input({
      draft: {
        activeDay: "legs",
        inputs: {legs: {squat: {w: "225", r: "5", s: "2"}}},
      },
      exclusions: [{target_type: "data_category", target_key: "workouts", selector: {}}],
    }));

    expect(notesExcluded.analyticsSessions[0]).not.toHaveProperty("notes");
    expect(notesExcluded.draft).not.toHaveProperty("notes");
    expect(workoutsExcluded.analyticsSessions).toEqual([]);
    expect(workoutsExcluded.draft).toBeNull();
  });

  it("applies exclusions before both slice boundaries without reordering", () => {
    const history = Array.from({length: 55}, (_, index) => session({
      periodId: `day-${index}`,
      date: `2026-07-${String(index + 1).padStart(2, "0")}`,
    }));
    const exclusions = [
      {target_type: "session", target_key: "day-3", selector: {}},
      {target_type: "session", target_key: "day-43", selector: {}},
      {target_type: "session", target_key: "day-54", selector: {}},
    ];
    const filtered = filterExcludedData(input({appData: {...input().appData, history}, exclusions}));
    const context = buildMemberContext(input({appData: {...input().appData, history}, exclusions}));

    expect(filtered.analyticsSessions).toHaveLength(52);
    expect(filtered.analyticsSessions[0].periodId).toBe("day-0");
    expect(filtered.analyticsSessions.at(-1).periodId).toBe("day-53");
    expect(context.sessions.map((row) => row.periodId)).toEqual([
      "day-41", "day-42", "day-44", "day-45", "day-46", "day-47",
      "day-48", "day-49", "day-50", "day-51", "day-52", "day-53",
    ]);
  });

  it("fails closed for ambiguous identifiers and malformed date exclusions", () => {
    const duplicateContext = buildMemberContext(input({
      appData: {
        ...input().appData,
        history: [
          session({periodId: "duplicate", date: "2026-07-01"}),
          session({periodId: "duplicate", date: "2026-07-02"}),
          session({
            periodId: "unique",
            exercises: {
              "": {w: 100, r: 10, s: 1},
              squat: session().exercises.squat,
            },
          }),
        ],
      },
    }));
    const malformedExclusion = buildMemberContext(input({
      exclusions: [{
        target_type: "date_range",
        target_key: "private-range",
        selector: {from: "", to: "not-a-date"},
      }],
    }));

    expect(duplicateContext.sessions.map((row) => row.periodId)).toEqual(["duplicate", "unique"]);
    expect(duplicateContext.sessions[0].date).toBe("2026-07-01");
    expect(duplicateContext.sessions[1].exercises.map((row) => row.exerciseId)).toEqual(["squat"]);
    expect(malformedExclusion.sessions).toEqual([]);
  });
});
