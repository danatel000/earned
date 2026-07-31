import {describe, expect, it} from "vitest";
import {exposure} from "./fixtures.js";
import {
  buildProgressionState,
  progressionAction,
  toProgressionInput,
} from "../../supabase/functions/_shared/coach/progression.ts";

const incline = {
  id: "cb_incline",
  name: "Incline Bench Press",
  increment: 5,
  repRange: [6, 10],
};

describe("Coach progression", () => {
  it("holds after one exposure instead of prescribing unsupported load", () => {
    const state = buildProgressionState({
      exercise: incline,
      exposures: [exposure({periodId: "a", weight: 155, reps: 8, sets: 3, rpe: 8})],
      readiness: null,
      strategy: "double_progression",
    });

    expect(state.decision).toBe("hold");
    expect(state.evidenceState).toBe("partially_supported");
    expect(state.supportingPeriodIds).toEqual(["a"]);
    expect(state.recommendation.weight).toBe(155);
  });

  it("adds a conservative increment only after the top of the rep range is met", () => {
    const state = buildProgressionState({
      exercise: incline,
      exposures: [
        exposure({periodId: "a", weight: 155, reps: 10, sets: 3, rpe: 8}),
        exposure({periodId: "b", weight: 155, reps: 10, sets: 3, rpe: 8}),
      ],
      readiness: {score: 74},
      strategy: "double_progression",
    });

    expect(state).toMatchObject({
      decision: "add_weight",
      targetWeight: 160,
      targetReps: 6,
      ruleId: "double_progression.top_range_twice",
      evidenceState: "well_supported",
      supportingPeriodIds: ["a", "b"],
    });
  });

  it("does not synthesize a partial increment to fit the five-percent cap", () => {
    const state = buildProgressionState({
      exercise: {...incline, increment: 10},
      exposures: [
        exposure({periodId: "a", weight: 100, reps: 10, rpe: 8}),
        exposure({periodId: "b", weight: 100, reps: 10, rpe: 8}),
      ],
      readiness: {score: 80},
      strategy: "double_progression",
    });

    expect(state).toMatchObject({
      decision: "hold",
      targetWeight: 100,
      ruleId: "progression.increment_exceeds_cap",
    });
  });

  it("does not increase load when top-range exposures have no RPE evidence", () => {
    const state = buildProgressionState({
      exercise: incline,
      exposures: [
        exposure({periodId: "a", weight: 155, reps: 10, rpe: null}),
        exposure({periodId: "b", weight: 155, reps: 10, rpe: null}),
      ],
      readiness: {score: 80},
      strategy: "double_progression",
    });

    expect(state.decision).toBe("hold");
    expect(state.targetWeight).toBe(155);
  });

  it("adds one rep to the lowest completed work set at stable load", () => {
    const state = buildProgressionState({
      exercise: incline,
      exposures: [
        exposure({periodId: "a", weight: 155, reps: [8, 8, 7], sets: 3}),
        exposure({periodId: "b", weight: 155, reps: [9, 8, 8], sets: 3}),
      ],
      readiness: {score: 70},
      strategy: "rep_range",
    });

    expect(state).toMatchObject({
      decision: "add_rep",
      targetWeight: 155,
      targetReps: [9, 9, 8],
      ruleId: "rep_range.stable_load",
    });
  });

  it("reduces two consecutive misses by five percent rounded to the increment", () => {
    const state = buildProgressionState({
      exercise: {id: "lg_dead", name: "Deadlift", increment: 10, repRange: [3, 8]},
      exposures: [
        exposure({periodId: "a", weight: 205, reps: 2, rpe: 9}),
        exposure({periodId: "b", weight: 205, reps: 2, rpe: 9}),
      ],
      readiness: {score: 68},
      strategy: "double_progression",
    });

    expect(state).toMatchObject({
      decision: "reduce",
      targetWeight: 190,
      ruleId: "double_progression.two_misses",
    });
  });

  it.each([
    ["failed set quality", {setQuality: ["failed"]}, {score: 70}],
    ["session RPE 9+", {rpe: 9}, {score: 70}],
    ["low readiness", {rpe: 7}, {score: 51}],
  ])("never increases load with %s", (_label, latestOverrides, readiness) => {
    const state = buildProgressionState({
      exercise: incline,
      exposures: [
        exposure({periodId: "a", weight: 155, reps: 10, rpe: 8}),
        exposure({periodId: "b", weight: 155, reps: 10, ...latestOverrides}),
      ],
      readiness,
      strategy: "double_progression",
    });

    expect(["hold", "reduce"]).toContain(state.decision);
    expect(state.targetWeight).toBeLessThanOrEqual(155);
  });

  it("does not call set duration bar velocity", () => {
    const state = buildProgressionState({
      exercise: {id: "lg_dead", name: "Deadlift", increment: 10, repRange: [3, 8]},
      exposures: [
        exposure({periodId: "a", weight: 205, reps: 6, sets: 3, durationMs: 48000}),
        exposure({periodId: "b", weight: 205, reps: 6, sets: 3, durationMs: 52000}),
      ],
      readiness: {score: 70},
      strategy: "double_progression",
    });

    expect(JSON.stringify(state)).not.toMatch(/bar velocity|velocity loss/i);
  });

  it("projects valid history into deterministic exposures and ignores excluded exercise data", () => {
    const history = [
      {
        periodId: "week-a",
        rpe: 8,
        exercises: {
          cb_incline: {w: 155, r: 8, s: 3, volume: 3720},
          cb_smith: {w: 175, r: 6, s: 2, volume: 2100},
        },
      },
    ];
    const input = toProgressionInput({
      history,
      exercise: incline,
      dayKey: "chestBack",
      graph: [{exerciseId: "cb_incline", name: incline.name, movementPattern: "horizontal_press",
        primaryMuscles: ["chest"], secondaryMuscles: ["triceps"], equipment: ["barbell"],
        skillLevel: "intermediate", laterality: "bilateral", repRange: [6, 10], increment: 5}],
      readiness: null,
    });

    expect(input.exposures).toEqual([
      expect.objectContaining({periodId: "week-a", weight: 155, reps: 8, sets: 3}),
    ]);
    expect(input.exercise).toMatchObject({id: "cb_incline", increment: 5, repRange: [6, 10]});
  });

  it("consumes the normalized Task 3 MemberContext session shape", () => {
    const input = toProgressionInput({
      history: [{
        periodId: "context-a",
        rpe: 7,
        exercises: [{
          exerciseId: "cb_incline",
          weight: 155,
          reps: 9,
          sets: 3,
          volume: 4185,
          setRows: [
            {weight: 155, reps: 9, quality: "good"},
            {weight: 155, reps: 9, quality: "good"},
            {weight: 155, reps: 9, quality: "good"},
          ],
        }],
      }],
      exercise: incline,
      dayKey: "chestBack",
      graph: [],
      readiness: {score: 72},
    });

    expect(input.exposures).toEqual([expect.objectContaining({
      periodId: "context-a",
      weight: 155,
      reps: [9, 9, 9],
      sets: 3,
      setQuality: ["good", "good", "good"],
    })]);
  });

  it("emits only a confirmation-required deterministic action", () => {
    const state = buildProgressionState({
      exercise: incline,
      exposures: [
        exposure({periodId: "a", weight: 155, reps: 8}),
        exposure({periodId: "b", weight: 155, reps: 9}),
      ],
      readiness: {score: 70},
      strategy: "double_progression",
    });
    const action = progressionAction(state);

    expect(action).toMatchObject({
      id: `progression:cb_incline:${state.decision}`,
      type: "progression",
      requiresConfirmation: true,
      payload: expect.objectContaining({exerciseId: "cb_incline", ruleId: state.ruleId}),
    });
  });

  it("does not count a duplicate period ID as two supporting exposures", () => {
    const duplicate = exposure({
      periodId: "dup",
      date: "2026-07-20",
      weight: 155,
      reps: 10,
      rpe: 8,
    });
    const state = buildProgressionState({
      exercise: incline,
      exposures: [duplicate, {...duplicate}],
      readiness: {score: 75},
      strategy: "double_progression",
    });

    expect(state.decision).toBe("hold");
    expect(state.supportingPeriodIds).not.toEqual(["dup", "dup"]);
    expect(new Set(state.supportingPeriodIds).size).toBe(state.supportingPeriodIds.length);
  });

  it("sorts evidence chronologically so the newest failed exposure controls safety", () => {
    const state = buildProgressionState({
      exercise: incline,
      exposures: [
        exposure({periodId: "new", date: "2026-07-22", weight: 155, reps: 10, rpe: 8,
          setQuality: ["failed"]}),
        exposure({periodId: "old-a", date: "2026-07-18", weight: 155, reps: 10, rpe: 8}),
        exposure({periodId: "old-b", date: "2026-07-20", weight: 155, reps: 10, rpe: 8}),
      ],
      readiness: {score: 75},
      strategy: "double_progression",
    });

    expect(state.decision).toBe("hold");
    expect(state.ruleId).toBe("safety.failed_set_quality");
    expect(state.supportingPeriodIds.at(-1)).toBe("new");
  });

  it("filters requested day, invalid dates, and blank period IDs before progression", () => {
    const history = [
      {periodId: "wrong-day", date: "2026-07-18", dayKey: "legs", rpe: 8,
        exercises: {cb_incline: {w: 155, r: 10, s: 3}}},
      {periodId: "bad-date", date: "not-a-date", dayKey: "chestBack", rpe: 8,
        exercises: {cb_incline: {w: 155, r: 10, s: 3}}},
      {periodId: "", date: "2026-07-19", dayKey: "chestBack", rpe: 8,
        exercises: {cb_incline: {w: 155, r: 10, s: 3}}},
      {periodId: "valid", date: "2026-07-20", dayKey: "chestBack", rpe: 8,
        exercises: {cb_incline: {w: 155, r: 10, s: 3}}},
    ];
    const input = toProgressionInput({
      history,
      exercise: incline,
      dayKey: "chestBack",
      graph: [],
      readiness: null,
    });

    expect(input.exposures.map((row) => row.periodId)).toEqual(["valid"]);
  });

  it("requires distinct consecutive top-range exposures at the same working load", () => {
    const state = buildProgressionState({
      exercise: incline,
      exposures: [
        exposure({periodId: "a", date: "2026-07-18", weight: 100, reps: 10, rpe: 8}),
        exposure({periodId: "b", date: "2026-07-20", weight: 155, reps: 10, rpe: 8}),
      ],
      readiness: {score: 75},
      strategy: "double_progression",
    });

    expect(state.decision).toBe("hold");
    expect(state.targetWeight).toBe(155);
  });

  it.each(["low_quality", "poor", "incomplete", "unknown_label"])(
    "fails closed for latest quality value %s",
    (quality) => {
      const state = buildProgressionState({
        exercise: incline,
        exposures: [
          exposure({periodId: "a", weight: 155, reps: 10, rpe: 8}),
          exposure({periodId: "b", weight: 155, reps: 10, rpe: 8, setQuality: [quality]}),
        ],
        readiness: {score: 75},
        strategy: "double_progression",
      });

      expect(state.decision).toBe("hold");
      expect(state.ruleId).toBe("safety.failed_set_quality");
    },
  );

  it("requires explicit effort evidence for fixed increments", () => {
    const state = buildProgressionState({
      exercise: {...incline, increment: 5},
      exposures: [
        exposure({periodId: "a", weight: 155, reps: 6, rpe: null}),
        exposure({periodId: "b", weight: 155, reps: 6, rpe: null}),
      ],
      readiness: {score: 75},
      strategy: "fixed_increment",
    });

    expect(state.decision).toBe("hold");
    expect(state.targetWeight).toBe(155);
  });

  it("holds when the configured increment exceeds the five-percent cap", () => {
    const state = buildProgressionState({
      exercise: {...incline, increment: 10},
      exposures: [
        exposure({periodId: "a", weight: 155, reps: 10, rpe: 8}),
        exposure({periodId: "b", weight: 155, reps: 10, rpe: 8}),
      ],
      readiness: {score: 75},
      strategy: "double_progression",
    });

    expect(state.decision).toBe("hold");
    expect(state.targetWeight).toBe(155);
    expect(state.ruleId).toBe("progression.increment_exceeds_cap");
  });

  it("uses one configured increment when it is exactly five percent", () => {
    const state = buildProgressionState({
      exercise: {...incline, increment: 10},
      exposures: [
        exposure({periodId: "a", weight: 200, reps: 10, rpe: 8}),
        exposure({periodId: "b", weight: 200, reps: 10, rpe: 8}),
      ],
      readiness: {score: 75},
      strategy: "double_progression",
    });

    expect(state).toMatchObject({decision: "add_weight", targetWeight: 210});
  });

  it("fails closed instead of throwing on malformed direct progression input", () => {
    expect(() => buildProgressionState({
      exercise: {id: "cb_incline", name: "Incline", increment: Number.NaN, repRange: [10, 6]},
      exposures: [
        null,
        {periodId: null, weight: Number.POSITIVE_INFINITY, reps: [], sets: 0, setQuality: null},
      ],
      readiness: {score: Number.NaN},
      strategy: "invented",
    })).not.toThrow();

    const state = buildProgressionState({
      exercise: incline,
      exposures: [
        {...exposure({periodId: "a", weight: 155, reps: 10, rpe: 8}), setQuality: null},
        exposure({periodId: "b", weight: 155, reps: [10, Number.NaN], rpe: 8}),
      ],
      readiness: {score: 75},
      strategy: "double_progression",
    });
    expect(state).toMatchObject({decision: "hold", evidenceState: "partially_supported"});
  });

  it("reconciles duplicate newest failures conservatively instead of erasing them", () => {
    const newestFailure = exposure({
      periodId: "new-failed",
      date: "2026-07-22",
      weight: 155,
      reps: 10,
      rpe: 8,
      setQuality: ["failed"],
    });
    const state = buildProgressionState({
      exercise: incline,
      exposures: [
        exposure({periodId: "old-a", date: "2026-07-18", weight: 155, reps: 10, rpe: 8}),
        exposure({periodId: "old-b", date: "2026-07-20", weight: 155, reps: 10, rpe: 8}),
        newestFailure,
        {...newestFailure},
      ],
      readiness: {score: 75},
      strategy: "double_progression",
    });

    expect(state.decision).toBe("hold");
    expect(state.supportingPeriodIds.at(-1)).toBe("new-failed");
    expect(state.supportingPeriodIds).not.toEqual(["old-a", "old-b"]);
  });

  it("blocks progression when undated evidence makes newest chronology ambiguous", () => {
    const state = buildProgressionState({
      exercise: incline,
      exposures: [
        exposure({periodId: "old-a", date: "2026-07-18", weight: 155, reps: 10, rpe: 8}),
        exposure({periodId: "old-b", date: "2026-07-20", weight: 155, reps: 10, rpe: 8}),
        exposure({periodId: "undated-failed", date: null, weight: 155, reps: 10, rpe: 8,
          setQuality: ["failed"]}),
      ],
      readiness: {score: 75},
      strategy: "double_progression",
    });

    expect(state).toMatchObject({
      decision: "hold",
      ruleId: "progression.ambiguous_chronology",
    });
    expect(state.supportingPeriodIds).toContain("undated-failed");
  });

  it("fails closed when duplicate chronology could otherwise authorize a reduction", () => {
    const duplicatedMiss = exposure({
      periodId: "new-miss",
      date: "2026-07-22",
      weight: 155,
      reps: 5,
      rpe: 9,
      setQuality: ["failed"],
    });
    const state = buildProgressionState({
      exercise: incline,
      exposures: [
        exposure({periodId: "old-miss", date: "2026-07-20", weight: 155, reps: 5, rpe: 9,
          setQuality: ["failed"]}),
        duplicatedMiss,
        {...duplicatedMiss},
      ],
      readiness: {score: 75},
      strategy: "hold_or_reduce",
    });

    expect(state).toMatchObject({
      decision: "hold",
      ruleId: "progression.duplicate_period",
    });
  });
});
