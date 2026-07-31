import type {CoachAction} from "./contracts.ts";
import {normalizeCoachSettings} from "./settings.ts";

const MOVEMENT_PATTERNS = new Set([
  "vertical_pull", "horizontal_pull", "horizontal_press", "vertical_press",
  "squat", "hinge", "lunge", "elbow_flexion", "elbow_extension",
  "shoulder_abduction", "knee_flexion", "plantar_flexion",
]);
const SKILL_LEVELS = new Set(["beginner", "intermediate", "advanced"]);
const LATERALITY = new Set(["bilateral", "unilateral"]);

export type ExerciseGraphRow = {
  exerciseId: string;
  name: string;
  movementPattern:
    | "vertical_pull" | "horizontal_pull" | "horizontal_press" | "vertical_press"
    | "squat" | "hinge" | "lunge" | "elbow_flexion" | "elbow_extension"
    | "shoulder_abduction" | "knee_flexion" | "plantar_flexion";
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  skillLevel: "beginner" | "intermediate" | "advanced";
  laterality: "bilateral" | "unilateral";
  repRange: [number, number];
  increment: number;
  compatibleLimitations: string[];
};

export type ExerciseSwap = ExerciseGraphRow & {score: number; reason: string};
export type ExerciseSwapList = ExerciseSwap[] & {
  reason?: "coverage_missing" | "no_hard_constraint_match";
};

export type FindExerciseSwapsInput = {
  sourceExerciseId: string;
  graph: ExerciseGraphRow[];
  availableEquipment: string[] | Record<string, boolean>;
  excludedExerciseIds: string[];
  experience?: "beginner" | "intermediate" | "advanced";
  limitations?: string[];
};

type ExerciseSwapContextInput = {
  sourceExerciseId: string;
  graph: ExerciseGraphRow[];
  memberContext?: unknown;
  settings?: unknown;
  exclusions?: unknown;
  fallbackProfile?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringList(value: unknown, allowEmpty = false): string[] | null {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) return null;
  const rows = value
    .filter((row): row is string => typeof row === "string")
    .map((row) => row.trim().toLowerCase())
    .filter(Boolean);
  return rows.length === value.length ? [...new Set(rows)] : null;
}

function validRange(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const minimum = Number(value[0]);
  const maximum = Number(value[1]);
  return Number.isFinite(minimum) && Number.isFinite(maximum)
    && minimum > 0 && minimum <= maximum ? [minimum, maximum] : null;
}

export function normalizeExerciseGraph(value: unknown): ExerciseGraphRow[] {
  if (!Array.isArray(value)) return [];
  const normalized: ExerciseGraphRow[] = [];
  const seen = new Set<string>();
  for (const candidate of value) {
    if (!isRecord(candidate)) continue;
    const exerciseId = typeof candidate.exerciseId === "string" ? candidate.exerciseId.trim() : "";
    const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
    const movementPattern = typeof candidate.movementPattern === "string"
      ? candidate.movementPattern : "";
    const primaryMuscles = stringList(candidate.primaryMuscles);
    const secondaryMuscles = stringList(candidate.secondaryMuscles, true);
    const equipment = stringList(candidate.equipment);
    const skillLevel = typeof candidate.skillLevel === "string" ? candidate.skillLevel : "";
    const laterality = typeof candidate.laterality === "string" ? candidate.laterality : "";
    const repRange = validRange(candidate.repRange);
    const increment = Number(candidate.increment);
    const compatibleLimitations = stringList(candidate.compatibleLimitations ?? [], true);
    if (!exerciseId || seen.has(exerciseId) || !name || !MOVEMENT_PATTERNS.has(movementPattern)
      || !primaryMuscles || !secondaryMuscles || !equipment || !SKILL_LEVELS.has(skillLevel)
      || !LATERALITY.has(laterality) || !repRange
      || !Number.isFinite(increment) || increment <= 0 || !compatibleLimitations) continue;
    seen.add(exerciseId);
    normalized.push({
      exerciseId,
      name,
      movementPattern: movementPattern as ExerciseGraphRow["movementPattern"],
      primaryMuscles,
      secondaryMuscles,
      equipment,
      skillLevel: skillLevel as ExerciseGraphRow["skillLevel"],
      laterality: laterality as ExerciseGraphRow["laterality"],
      repRange,
      increment,
      compatibleLimitations,
    });
  }
  return normalized;
}

function normalizeEquipment(value: FindExerciseSwapsInput["availableEquipment"]): Set<string> {
  const aliases: Record<string, string> = {
    dumbbells: "dumbbell",
    machines: "machine",
    cables: "cable",
  };
  const rows = Array.isArray(value)
    ? value
    : Object.entries(value).filter(([, enabled]) => enabled).map(([equipment]) => equipment);
  return new Set(rows.map((row) => aliases[row] ?? row).filter(Boolean));
}

function normalizedStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .filter((row): row is string => typeof row === "string")
    .map((row) => row.trim().toLowerCase())
    .filter(Boolean))];
}

export function buildExerciseSwapQuery(input: ExerciseSwapContextInput): FindExerciseSwapsInput {
  const memberProfile = isRecord(input.memberContext) && isRecord(input.memberContext.profile)
    ? input.memberContext.profile
    : null;
  const hasPersistedSettings = isRecord(input.settings);
  const settings = normalizeCoachSettings(input.settings);
  const fallbackProfile = isRecord(input.fallbackProfile) ? input.fallbackProfile : {};
  const profile = memberProfile ?? (hasPersistedSettings ? settings.profile : fallbackProfile);
  const experience = profile.experience === "beginner" || profile.experience === "advanced"
    ? profile.experience
    : "intermediate";
  const equipment = Array.isArray(profile.equipment) || isRecord(profile.equipment)
    ? profile.equipment as string[] | Record<string, boolean>
    : [];
  const limitations = memberProfile
    ? normalizedStringArray(profile.limitations)
    : hasPersistedSettings
      ? settings.permissions.limitations ? normalizedStringArray(settings.profile.limitations) : []
      : normalizedStringArray(profile.limitations);
  const exclusionRows = Array.isArray(input.exclusions) ? input.exclusions : [];
  const excludedExerciseIds = [...new Set(exclusionRows
    .filter((row) => isRecord(row) && row.target_type === "exercise")
    .map((row) => isRecord(row) ? row.target_key : null)
    .filter((row): row is string => typeof row === "string" && row.trim())
    .map((row) => row.trim()))];
  return {
    sourceExerciseId: input.sourceExerciseId,
    graph: input.graph,
    availableEquipment: equipment,
    excludedExerciseIds,
    experience,
    limitations,
  };
}

function setEmptyReason(result: ExerciseSwapList, reason: ExerciseSwapList["reason"]): void {
  Object.defineProperty(result, "reason", {value: reason, enumerable: false});
}

export function findExerciseSwaps(input: FindExerciseSwapsInput): ExerciseSwapList {
  const result = [] as ExerciseSwapList;
  const source = input.graph.find((row) => row.exerciseId === input.sourceExerciseId);
  if (!source) {
    setEmptyReason(result, "coverage_missing");
    return result;
  }
  const excluded = new Set([input.sourceExerciseId, ...input.excludedExerciseIds]);
  const availableEquipment = normalizeEquipment(input.availableEquipment);
  const skillRank = {beginner: 0, intermediate: 1, advanced: 2};
  const experience = input.experience && input.experience in skillRank
    ? input.experience
    : source.skillLevel;
  const limitations = input.limitations === undefined
    ? []
    : Array.isArray(input.limitations)
      && input.limitations.every((row) => typeof row === "string" && row.trim())
      ? [...new Set(input.limitations.map((row) => row.trim().toLowerCase()))]
      : null;
  if (limitations === null) {
    setEmptyReason(result, "no_hard_constraint_match");
    return result;
  }
  const sourceMuscles = new Set(source.primaryMuscles);
  for (const candidate of input.graph) {
    if (excluded.has(candidate.exerciseId)) continue;
    if (candidate.movementPattern !== source.movementPattern) continue;
    if (!candidate.primaryMuscles.some((muscle) => sourceMuscles.has(muscle))) continue;
    if (!candidate.equipment.every((equipment) => availableEquipment.has(equipment))) continue;
    if (skillRank[candidate.skillLevel] > skillRank[experience]) continue;
    if (!limitations.every((limitation) => candidate.compatibleLimitations.includes(limitation))) continue;
    const sharedMuscles = candidate.primaryMuscles.filter((muscle) => sourceMuscles.has(muscle)).length;
    const score = sharedMuscles * 100
      + (candidate.laterality === source.laterality ? 10 : 0)
      + (candidate.skillLevel === source.skillLevel ? 5 : 0)
      + (candidate.equipment.some((equipment) => source.equipment.includes(equipment)) ? 2 : 0);
    result.push({
      ...candidate,
      score,
      reason: `Same muscle and ${candidate.movementPattern.replaceAll("_", " ")} pattern with available equipment.`,
    });
  }
  result.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  if (result.length === 0) setEmptyReason(result, "no_hard_constraint_match");
  return result;
}

export function substitutionAction(input: {
  sourceExerciseId: string;
  graph: ExerciseGraphRow[];
  availableEquipment: string[] | Record<string, boolean>;
  excludedExerciseIds: string[];
  experience?: "beginner" | "intermediate" | "advanced";
  limitations?: string[];
  swap: ExerciseSwap | Record<string, unknown> | null | undefined;
}): CoachAction | null {
  if (!input.sourceExerciseId || !isRecord(input.swap)
    || typeof input.swap.exerciseId !== "string") return null;
  const validated = findExerciseSwaps(input)
    .find((candidate) => candidate.exerciseId === input.swap!.exerciseId);
  if (!validated) return null;
  return {
    id: `substitution:${input.sourceExerciseId}:${validated.exerciseId}`,
    type: "substitution",
    label: "Use this swap",
    explanation: validated.reason,
    payload: {
      sourceExerciseId: input.sourceExerciseId,
      replacementExerciseId: validated.exerciseId,
    },
    requiresConfirmation: true,
  };
}
