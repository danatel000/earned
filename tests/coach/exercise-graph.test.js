import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {describe, expect, it} from "vitest";
import {
  findExerciseSwaps,
  normalizeExerciseGraph,
  substitutionAction,
} from "../../supabase/functions/_shared/coach/exercise-graph.ts";
import * as exerciseGraphApi from "../../supabase/functions/_shared/coach/exercise-graph.ts";
import * as appCatalogApi from "../../src/App.jsx";

const graphPath = fileURLToPath(
  new URL("../../knowledge/coach/exercise-equivalence.json", import.meta.url),
);
const graph = normalizeExerciseGraph(JSON.parse(readFileSync(graphPath, "utf8")));
describe("Coach exercise graph", () => {
  it("covers every existing Earned exercise ID", () => {
    const requiredIds = [
      "bs_pullup", "bs_hammer", "bs_machine", "bs_shpress", "bs_seated", "bs_latraise",
      "bs_jm", "bs_overhead", "cb_pullup", "cb_incline", "cb_smith", "cb_row",
      "cb_pecdeck", "lg_pullup", "lg_hamcurl", "lg_lunge", "lg_dead", "lg_calf", "lg_squat",
    ];

    expect(requiredIds.filter((id) => !graph.some((row) => row.exerciseId === id))).toEqual([]);
  });

  it("keeps the added dumbbell bench catalog entry classified as chest", () => {
    const exercise = appCatalogApi.EARNED_EXERCISE_CATALOG.chestBack
      .find((row) => row.id === "cb_flat_db");
    expect(appCatalogApi.getEarnedExerciseProfile(exercise, exercise.dayKey)).toMatchObject({
      group: "chest",
      target: "Chest",
    });
  });

  it("preserves movement, primary muscle, equipment, and all exclusions", () => {
    const swaps = findExerciseSwaps({
      sourceExerciseId: "cb_incline",
      graph,
      availableEquipment: ["barbell", "dumbbell"],
      excludedExerciseIds: ["cb_smith"],
    });
    const source = graph.find((row) => row.exerciseId === "cb_incline");

    expect(swaps.length).toBeGreaterThan(0);
    for (const swap of swaps) {
      expect(swap.movementPattern).toBe(source.movementPattern);
      expect(swap.primaryMuscles.some((muscle) => source.primaryMuscles.includes(muscle))).toBe(true);
      expect(swap.equipment.every((item) => ["barbell", "dumbbell"].includes(item))).toBe(true);
      expect(["cb_incline", "cb_smith"]).not.toContain(swap.exerciseId);
    }
  });

  it("returns no candidate instead of weakening a hard constraint", () => {
    expect(findExerciseSwaps({
      sourceExerciseId: "lg_dead",
      graph,
      availableEquipment: ["bodyweight"],
      excludedExerciseIds: [],
    })).toEqual([]);
  });

  it("keeps member-excluded IDs excluded even when they are the top match", () => {
    const withoutExclusion = findExerciseSwaps({
      sourceExerciseId: "cb_incline",
      graph,
      availableEquipment: ["barbell", "dumbbell"],
      excludedExerciseIds: [],
    });
    expect(withoutExclusion.length).toBeGreaterThan(0);

    const swaps = findExerciseSwaps({
      sourceExerciseId: "cb_incline",
      graph,
      availableEquipment: ["barbell", "dumbbell"],
      excludedExerciseIds: [withoutExclusion[0].exerciseId],
    });
    expect(swaps.map((row) => row.exerciseId)).not.toContain(withoutExclusion[0].exerciseId);
  });

  it("reports missing coverage for an unreviewed custom exercise", () => {
    const result = findExerciseSwaps({
      sourceExerciseId: "custom_unreviewed",
      graph,
      availableEquipment: ["dumbbell"],
      excludedExerciseIds: [],
    });

    expect(result).toEqual([]);
    expect(result.reason).toBe("coverage_missing");
  });

  it("drops malformed rows instead of weakening graph validation", () => {
    expect(normalizeExerciseGraph([
      graph[0],
      {...graph[0], exerciseId: "bad-pattern", movementPattern: "rotation"},
      {...graph[0], exerciseId: "bad-range", repRange: [10, 3]},
    ])).toEqual([graph[0]]);
  });

  it("drops duplicate reviewed graph IDs deterministically", () => {
    expect(normalizeExerciseGraph([graph[0], {...graph[0], name: "Duplicate"}])).toEqual([graph[0]]);
  });

  it("never recommends an exercise above the member experience level", () => {
    const swaps = findExerciseSwaps({
      sourceExerciseId: "cb_smith",
      graph,
      availableEquipment: ["barbell", "dumbbell", "machine"],
      excludedExerciseIds: [],
      experience: "beginner",
      limitations: [],
    });

    expect(swaps.length).toBeGreaterThan(0);
    expect(swaps.every((row) => row.skillLevel === "beginner")).toBe(true);
  });

  it("requires reviewed compatibility for every supplied limitation", () => {
    const source = {
      ...graph.find((row) => row.exerciseId === "cb_incline"),
      exerciseId: "source",
      compatibleLimitations: ["shoulder_sensitive"],
    };
    const compatible = {
      ...source,
      exerciseId: "compatible",
      name: "Compatible Press",
    };
    const unreviewed = {
      ...source,
      exerciseId: "unreviewed",
      name: "Unreviewed Press",
      compatibleLimitations: [],
    };
    const limitedGraph = normalizeExerciseGraph([source, compatible, unreviewed]);
    const swaps = findExerciseSwaps({
      sourceExerciseId: "source",
      graph: limitedGraph,
      availableEquipment: ["barbell"],
      excludedExerciseIds: [],
      experience: "intermediate",
      limitations: ["shoulder_sensitive"],
    });

    expect(swaps.map((row) => row.exerciseId)).toEqual(["compatible"]);
  });

  it("builds the production swap query from persisted settings and exclusion rows", () => {
    const query = exerciseGraphApi.buildExerciseSwapQuery({
      sourceExerciseId: "cb_incline",
      graph,
      settings: {
        schemaVersion: 1,
        permissions: {limitations: true},
        profile: {
          experience: "beginner",
          equipment: ["machine", "dumbbell"],
          limitations: ["shoulder_sensitive"],
        },
      },
      exclusions: [
        {target_type: "exercise", target_key: "cb_smith", selector: {}},
        {target_type: "session", target_key: "session-a", selector: {}},
      ],
    });

    expect(query).toMatchObject({
      experience: "beginner",
      availableEquipment: ["machine", "dumbbell"],
      limitations: ["shoulder_sensitive"],
      excludedExerciseIds: ["cb_smith"],
    });
  });

  it("prefers filtered MemberContext profile values over unfiltered settings", () => {
    const query = exerciseGraphApi.buildExerciseSwapQuery({
      sourceExerciseId: "cb_incline",
      graph,
      memberContext: {
        profile: {
          experience: "advanced",
          equipment: ["barbell"],
          limitations: [],
        },
      },
      settings: {
        permissions: {limitations: true},
        profile: {
          experience: "beginner",
          equipment: ["machine"],
          limitations: ["unfiltered"],
        },
      },
      exclusions: [],
    });

    expect(query).toMatchObject({
      experience: "advanced",
      availableEquipment: ["barbell"],
      limitations: [],
    });
  });

  it("executes catalog profile parity for every normalized graph row", () => {
    const catalog = Object.values(appCatalogApi.EARNED_EXERCISE_CATALOG).flat();
    expect(catalog.map((row) => row.id).sort()).toEqual(graph.map((row) => row.exerciseId).sort());
    const expectedGroup = (primaryMuscle) => ({
      biceps: "biceps",
      triceps: "triceps",
      shoulders: "shoulders",
      chest: "chest",
      back: "back",
    })[primaryMuscle] ?? "legs";

    for (const row of graph) {
      const exercise = catalog.find((candidate) => candidate.id === row.exerciseId);
      const profile = appCatalogApi.getEarnedExerciseProfile(exercise, exercise.dayKey);
      expect(profile.primaryMuscles).toEqual(row.primaryMuscles);
      expect(profile.group).toBe(expectedGroup(row.primaryMuscles[0]));
      expect(profile.equipment).toBe(row.equipment[0]);
      expect(profile.difficulty).toBe(row.skillLevel);
      expect(profile.target.toLowerCase()).toBe(row.primaryMuscles[0]);
    }
  });

  it("displays reviewed triceps rows as triceps rather than biceps", () => {
    for (const exerciseId of ["bs_jm", "bs_overhead"]) {
      const exercise = appCatalogApi.EARNED_EXERCISE_CATALOG.bicepsShoulders
        .find((row) => row.id === exerciseId);
      const profile = appCatalogApi.getEarnedExerciseProfile(exercise, "bicepsShoulders");
      expect(profile.group).toBe("triceps");
      expect(profile.target).toBe("Triceps");
    }
  });

  it("executes the production adapter with persisted settings and exclusions", () => {
    const buildSubstitutions = appCatalogApi.buildEarnedExerciseSubstitutions;
    expect(buildSubstitutions).toBeTypeOf("function");
    const substitutions = buildSubstitutions(
      appCatalogApi.EARNED_EXERCISE_CATALOG.chestBack
        .find((row) => row.id === "cb_incline"),
      "chestBack",
      {},
      [],
      {
        settings: {
          schemaVersion: 1,
          permissions: {limitations: true},
          profile: {
            experience: "intermediate",
            equipment: ["barbell", "dumbbell", "machine"],
            limitations: [],
          },
        },
        exclusions: [
          {target_type: "exercise", target_key: "cb_flat_db", selector: {}},
        ],
      },
    );

    expect(substitutions.map((row) => row.ex.id)).not.toContain("cb_flat_db");
    expect(buildSubstitutions(
      appCatalogApi.EARNED_EXERCISE_CATALOG.chestBack
        .find((row) => row.id === "cb_incline"),
      "chestBack",
      {},
      [],
      {
        settings: {
          schemaVersion: 1,
          permissions: {limitations: true},
          profile: {
            experience: "intermediate",
            equipment: ["barbell", "dumbbell", "machine"],
            limitations: ["shoulder_sensitive"],
          },
        },
        exclusions: [],
      },
    )).toEqual([]);
  });

  it("loads persisted Coach settings and exclusion rows for the production adapter", async () => {
    const calls = [];
    const client = {
      from(table) {
        return {
          select(columns) {
            calls.push([table, columns]);
            return {
              eq(column, value) {
                calls.push([table, column, value]);
                if (table === "coach_settings") {
                  return {
                    maybeSingle: async () => ({
                      data: {
                        settings: {
                          permissions: {limitations: true},
                          profile: {limitations: ["shoulder_sensitive"]},
                        },
                      },
                      error: null,
                    }),
                  };
                }
                return Promise.resolve({
                  data: [{target_type: "exercise", target_key: "cb_flat_db", selector: {}}],
                  error: null,
                });
              },
            };
          },
        };
      },
    };

    expect(appCatalogApi.loadPersistedCoachSwapContext).toBeTypeOf("function");
    await expect(appCatalogApi.loadPersistedCoachSwapContext(client, "member-1")).resolves.toEqual({
      settings: {
        permissions: {limitations: true},
        profile: {limitations: ["shoulder_sensitive"]},
      },
      exclusions: [{target_type: "exercise", target_key: "cb_flat_db", selector: {}}],
    });
    expect(calls).toContainEqual(["coach_settings", "user_id", "member-1"]);
    expect(calls).toContainEqual(["coach_data_exclusions", "user_id", "member-1"]);
  });

  it("emits a confirmation-required substitution action from a validated swap", () => {
    const query = {
      sourceExerciseId: "cb_incline",
      graph,
      availableEquipment: ["barbell", "dumbbell"],
      excludedExerciseIds: [],
      experience: "intermediate",
      limitations: [],
    };
    const swap = findExerciseSwaps(query)[0];
    const action = substitutionAction({...query, swap});

    expect(action).toMatchObject({
      id: `substitution:cb_incline:${swap.exerciseId}`,
      type: "substitution",
      requiresConfirmation: true,
      payload: {
        sourceExerciseId: "cb_incline",
        replacementExerciseId: swap.exerciseId,
      },
    });
  });

  it("rejects arbitrary and stale substitution candidates", () => {
    const query = {
      sourceExerciseId: "cb_incline",
      graph,
      availableEquipment: ["barbell", "dumbbell"],
      excludedExerciseIds: [],
      experience: "intermediate",
      limitations: [],
    };
    const swap = findExerciseSwaps(query)[0];

    expect(substitutionAction({...query, swap: {exerciseId: "evil", reason: "unchecked"}})).toBeNull();
    expect(substitutionAction({
      ...query,
      excludedExerciseIds: [swap.exerciseId],
      swap,
    })).toBeNull();
  });
});
