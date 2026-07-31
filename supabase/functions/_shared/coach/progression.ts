import type {CoachAction, EvidenceState} from "./contracts.ts";
import type {ExerciseGraphRow} from "./exercise-graph.ts";

export type ProgressionStrategy =
  | "rep_range" | "double_progression" | "fixed_increment" | "hold_or_reduce";
type RepTarget = number | number[];

export type ProgressionExposure = {
  periodId: string;
  date?: string | null;
  weight: number;
  reps: RepTarget;
  sets: number;
  rpe: number | null;
  readinessScore: number | null;
  setQuality: string[];
};

export type ProgressionInput = {
  exercise: {id: string; name: string; increment: number; repRange: [number, number]};
  exposures: ProgressionExposure[];
  readiness: {score: number} | null;
  strategy: ProgressionStrategy;
  evidenceIssues?: string[];
};

export type ProgressionState = {
  exerciseId: string;
  exerciseName: string;
  strategy: ProgressionStrategy;
  decision: "hold" | "add_weight" | "add_rep" | "reduce";
  targetWeight: number;
  targetReps: RepTarget;
  targetSets: number;
  observed: {
    weight: number; reps: RepTarget; sets: number; rpe: number | null;
    readinessScore: number | null; setQuality: string[];
  };
  recommendation: {weight: number; reps: RepTarget; sets: number};
  ruleId: string;
  evidenceState: EvidenceState;
  supportingPeriodIds: string[];
};

type ProgressionSourceInput = {
  history: unknown[];
  exercise: Record<string, unknown>;
  dayKey: string;
  graph: ExerciseGraphRow[];
  readiness: {score: number} | null;
};

const STRATEGIES = new Set<ProgressionStrategy>([
  "rep_range", "double_progression", "fixed_increment", "hold_or_reduce",
]);
const SAFE_QUALITIES = new Set(["easy", "good"]);
const QUALITY_ALIASES: Record<string, string> = {
  easy: "easy",
  good: "good",
  hard: "hard",
  failed: "failed",
  missed: "failed",
  poor: "failed",
  incomplete: "failed",
  low_quality: "failed",
  "low quality": "failed",
  form_breakdown: "failed",
  "form breakdown": "failed",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function boundedNumber(value: unknown, minimum: number, maximum: number): number | null {
  const number = finiteNumber(value);
  return number !== null && number >= minimum && number <= maximum ? number : null;
}

function positiveNumber(value: unknown): number | null {
  const number = finiteNumber(value);
  return number !== null && number > 0 ? number : null;
}

function normalizedReps(value: unknown): RepTarget | null {
  if (Array.isArray(value)) {
    const reps = value.map(positiveNumber).filter((row): row is number => row !== null);
    return reps.length === value.length && reps.length > 0 ? reps : null;
  }
  return positiveNumber(value);
}

function normalizedDate(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || !value.trim()) return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
}

function validPeriodId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= 128 ? normalized : null;
}

function periodIdFromEntry(entry: Record<string, unknown>): string | null {
  if (Object.hasOwn(entry, "periodId")) return validPeriodId(entry.periodId);
  const id = validPeriodId(entry.id);
  if (id) return id;
  const date = normalizedDate(entry.date);
  if (typeof date === "string") return date.slice(0, 10);
  const week = finiteNumber(entry.week);
  return week !== null && week >= 0 ? `week:${week}` : null;
}

function normalizeQuality(value: unknown): string {
  if (typeof value !== "string") return "unknown";
  const normalized = value.trim().toLowerCase();
  return QUALITY_ALIASES[normalized] ?? "unknown";
}

function normalizeSetQuality(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return ["unknown"];
  return value.map(normalizeQuality);
}

const repValues = (value: RepTarget): number[] => Array.isArray(value) ? value : [value];
const minimumRep = (value: RepTarget): number => Math.min(...repValues(value));
const allSetsAtLeast = (value: RepTarget, target: number): boolean =>
  repValues(value).every((rep) => rep >= target);
const qualitySupportsIncrease = (exposure: ProgressionExposure): boolean =>
  exposure.setQuality.every((quality) => SAFE_QUALITIES.has(quality));
const hasUnsafeQuality = (exposure: ProgressionExposure): boolean =>
  exposure.setQuality.some((quality) => !SAFE_QUALITIES.has(quality));

function normalizeExposure(value: unknown): ProgressionExposure | null {
  if (!isRecord(value)) return null;
  const periodId = validPeriodId(value.periodId);
  const date = normalizedDate(value.date);
  const weight = positiveNumber(value.weight);
  const reps = normalizedReps(value.reps);
  const sets = positiveNumber(value.sets);
  if (!periodId || date === undefined || weight === null || reps === null || sets === null) return null;
  return {
    periodId,
    date,
    weight,
    reps,
    sets,
    rpe: value.rpe === null || value.rpe === undefined ? null : boundedNumber(value.rpe, 0, 10),
    readinessScore: value.readinessScore === null || value.readinessScore === undefined
      ? null
      : boundedNumber(value.readinessScore, 0, 100),
    setQuality: normalizeSetQuality(value.setQuality),
  };
}

function reconcileDuplicatePeriod(rows: ProgressionExposure[]): ProgressionExposure {
  const ordered = [...rows].sort((left, right) => {
    const leftTime = left.date ? Date.parse(left.date) : Number.POSITIVE_INFINITY;
    const rightTime = right.date ? Date.parse(right.date) : Number.POSITIVE_INFINITY;
    return leftTime - rightTime;
  });
  const latest = ordered.at(-1)!;
  const rpes = rows.map((row) => row.rpe).filter((row): row is number => row !== null);
  const readiness = rows
    .map((row) => row.readinessScore)
    .filter((row): row is number => row !== null);
  return {
    ...latest,
    weight: Math.max(...rows.map((row) => row.weight)),
    reps: Math.min(...rows.flatMap((row) => repValues(row.reps))),
    sets: Math.min(...rows.map((row) => row.sets)),
    rpe: rpes.length === rows.length ? Math.max(...rpes) : null,
    readinessScore: readiness.length === rows.length ? Math.min(...readiness) : null,
    setQuality: ["unknown"],
  };
}

function canonicalizeExposures(value: unknown): {
  exposures: ProgressionExposure[];
  evidenceIssues: string[];
} {
  if (!Array.isArray(value)) return {exposures: [], evidenceIssues: []};
  const normalized = value.map(normalizeExposure).filter((row): row is ProgressionExposure => row !== null);
  const grouped = new Map<string, ProgressionExposure[]>();
  for (const row of normalized) grouped.set(row.periodId, [...(grouped.get(row.periodId) ?? []), row]);
  const evidenceIssues: string[] = [];
  const reconciled = [...grouped.values()].map((rows) => {
    if (rows.length === 1) return rows[0];
    evidenceIssues.push(`duplicate_period_reconciled:${rows[0].periodId}`);
    return reconcileDuplicatePeriod(rows);
  });
  if (reconciled.length >= 2 && reconciled.some((row) => row.date === null)) {
    evidenceIssues.push("ambiguous_chronology");
  }
  const exposures = reconciled
    .sort((left, right) => {
      const leftTime = left.date ? Date.parse(left.date) : Number.POSITIVE_INFINITY;
      const rightTime = right.date ? Date.parse(right.date) : Number.POSITIVE_INFINITY;
      return leftTime - rightTime || left.periodId.localeCompare(right.periodId);
    });
  return {exposures, evidenceIssues};
}

function defaultIncrement(exercise: Record<string, unknown>, graphRow?: ExerciseGraphRow): number {
  const configured = positiveNumber(exercise.increment) ?? graphRow?.increment;
  if (configured) return configured;
  return ["squat", "hinge", "lunge"].includes(graphRow?.movementPattern ?? "") ? 10 : 5;
}

function defaultRepRange(
  exercise: Record<string, unknown>,
  graphRow?: ExerciseGraphRow,
): [number, number] {
  const range = exercise.repRange;
  if (Array.isArray(range) && range.length === 2) {
    const minimum = positiveNumber(range[0]);
    const maximum = positiveNumber(range[1]);
    if (minimum !== null && maximum !== null && minimum <= maximum) return [minimum, maximum];
  }
  return graphRow?.repRange ?? [6, 10];
}

function liftFromEntry(entry: Record<string, unknown>, exerciseId: string): Record<string, unknown> | null {
  if (Array.isArray(entry.exercises)) {
    const projected = entry.exercises.find((row) =>
      isRecord(row) && row.exerciseId === exerciseId);
    if (isRecord(projected)) return projected;
  }
  const exercises = isRecord(entry.exercises) ? entry.exercises : null;
  if (exercises && isRecord(exercises[exerciseId])) return exercises[exerciseId];
  return null;
}

function exposureFromHistory(entry: unknown, exerciseId: string): ProgressionExposure | null {
  if (!isRecord(entry)) return null;
  const periodId = periodIdFromEntry(entry);
  const date = normalizedDate(entry.date);
  const lift = liftFromEntry(entry, exerciseId);
  if (!periodId || date === undefined || !lift) return null;
  const rows = Array.isArray(lift.setRows)
    ? lift.setRows
    : Array.isArray(lift.setDetails) ? lift.setDetails : [];
  const validRows = rows.filter(isRecord);
  const rowReps = validRows.length
    ? normalizedReps(validRows.map((row) => row.r ?? row.reps))
    : null;
  const weight = positiveNumber(lift.weight ?? lift.w)
    ?? (validRows.length ? positiveNumber(validRows[0].weight ?? validRows[0].w) : null);
  const reps = rowReps ?? normalizedReps(lift.reps ?? lift.r);
  const sets = positiveNumber(lift.sets ?? lift.s) ?? validRows.length;
  if (weight === null || reps === null || sets <= 0) return null;
  const readiness = isRecord(entry.readiness) ? boundedNumber(entry.readiness.score, 0, 100) : null;
  return normalizeExposure({
    periodId,
    date,
    weight,
    reps,
    sets,
    rpe: entry.rpe ?? lift.rpe ?? null,
    readinessScore: readiness,
    setQuality: validRows.length
      ? validRows.map((row) => row.quality)
      : lift.setQuality,
  });
}

export function toProgressionInput(input: ProgressionSourceInput): ProgressionInput {
  const exerciseId = typeof input.exercise.id === "string" ? input.exercise.id.trim() : "";
  const graphRow = input.graph.find((row) => row.exerciseId === exerciseId);
  const requestedDay = typeof input.dayKey === "string" ? input.dayKey.trim() : "";
  const exposures = input.history
    .filter((entry) => !isRecord(entry)
      || typeof entry.dayKey !== "string"
      || !entry.dayKey.trim()
      || entry.dayKey === requestedDay)
    .map((entry) => exposureFromHistory(entry, exerciseId));
  const canonical = canonicalizeExposures(exposures);
  return {
    exercise: {
      id: exerciseId,
      name: typeof input.exercise.name === "string" ? input.exercise.name : graphRow?.name ?? exerciseId,
      increment: defaultIncrement(input.exercise, graphRow),
      repRange: defaultRepRange(input.exercise, graphRow),
    },
    exposures: canonical.exposures,
    readiness: input.readiness && boundedNumber(input.readiness.score, 0, 100) !== null
      ? {score: Number(input.readiness.score)}
      : null,
    strategy: "double_progression",
    evidenceIssues: canonical.evidenceIssues,
  };
}

function normalizeProgressionInput(value: unknown): ProgressionInput | null {
  if (!isRecord(value) || !isRecord(value.exercise)) return null;
  const id = validPeriodId(value.exercise.id);
  const name = typeof value.exercise.name === "string" && value.exercise.name.trim()
    ? value.exercise.name.trim()
    : id;
  const increment = positiveNumber(value.exercise.increment);
  const range = value.exercise.repRange;
  const minimum = Array.isArray(range) ? positiveNumber(range[0]) : null;
  const maximum = Array.isArray(range) ? positiveNumber(range[1]) : null;
  const strategy = typeof value.strategy === "string" && STRATEGIES.has(value.strategy as ProgressionStrategy)
    ? value.strategy as ProgressionStrategy
    : null;
  if (!id || !name || !increment || minimum === null || maximum === null
    || minimum > maximum || !strategy) return null;
  const readinessScore = isRecord(value.readiness)
    ? boundedNumber(value.readiness.score, 0, 100)
    : null;
  const canonical = canonicalizeExposures(value.exposures);
  return {
    exercise: {id, name, increment, repRange: [minimum, maximum]},
    exposures: canonical.exposures,
    readiness: readinessScore === null ? null : {score: readinessScore},
    strategy,
    evidenceIssues: canonical.evidenceIssues,
  };
}

function emptyState(input: unknown): ProgressionState {
  const exercise = isRecord(input) && isRecord(input.exercise) ? input.exercise : {};
  const id = typeof exercise.id === "string" ? exercise.id.trim() : "";
  const name = typeof exercise.name === "string" ? exercise.name.trim() : id;
  return {
    exerciseId: id,
    exerciseName: name,
    strategy: "hold_or_reduce",
    decision: "hold",
    targetWeight: 0,
    targetReps: 0,
    targetSets: 0,
    observed: {
      weight: 0, reps: 0, sets: 0, rpe: null, readinessScore: null, setQuality: [],
    },
    recommendation: {weight: 0, reps: 0, sets: 0},
    ruleId: "progression.malformed_input",
    evidenceState: "insufficient_evidence",
    supportingPeriodIds: [],
  };
}

function evidenceState(exposures: ProgressionExposure[]): EvidenceState {
  if (exposures.length === 0) return "insufficient_evidence";
  return exposures.length === 1 ? "partially_supported" : "well_supported";
}

function incrementLowestRep(reps: RepTarget, maximum: number): RepTarget {
  if (!Array.isArray(reps)) return Math.min(maximum, reps + 1);
  const next = [...reps];
  const minimum = Math.min(...next);
  const index = next.findIndex((rep) => rep === minimum);
  next[index] = Math.min(maximum, next[index] + 1);
  return next;
}

const roundedReduction = (weight: number, increment: number): number =>
  Math.max(0, Math.round((weight * 0.95) / increment) * increment);
const canAddConfiguredIncrement = (weight: number, increment: number): boolean =>
  increment <= weight * 0.05 + Number.EPSILON;

export function buildProgressionState(value: ProgressionInput | unknown): ProgressionState {
  const input = normalizeProgressionInput(value);
  if (!input) return emptyState(value);
  const valid = input.exposures;
  const latest = valid.at(-1) ?? {
    periodId: "", weight: 0, reps: input.exercise.repRange[0], sets: 0,
    rpe: null, readinessScore: null, setQuality: [],
  };
  const previous = valid.at(-2);
  const [minimum, maximum] = input.exercise.repRange;
  const currentReadiness = input.readiness?.score ?? latest.readinessScore;
  let decision: ProgressionState["decision"] = "hold";
  let targetWeight = latest.weight;
  let targetReps: RepTarget = latest.reps;
  let ruleId = "progression.insufficient_exposures";

  const twoMisses = Boolean(previous
    && minimumRep(previous.reps) < minimum && minimumRep(latest.reps) < minimum);
  const failedQuality = hasUnsafeQuality(latest);
  const highStress = (latest.rpe ?? 0) >= 9;
  const lowReadiness = currentReadiness !== null && currentReadiness < 52;
  const sameWorkingLoad = Boolean(previous && previous.weight === latest.weight);
  const supportedEffort = Boolean(previous
    && previous.rpe !== null && previous.rpe <= 8
    && latest.rpe !== null && latest.rpe <= 8
    && qualitySupportsIncrease(previous) && qualitySupportsIncrease(latest));

  const hasDuplicatePeriod = input.evidenceIssues
    ?.some((issue) => issue.startsWith("duplicate_period_reconciled:"));
  if (input.evidenceIssues?.includes("ambiguous_chronology")) {
    ruleId = "progression.ambiguous_chronology";
  } else if (hasDuplicatePeriod) {
    ruleId = "progression.duplicate_period";
  } else if (valid.length < 2) {
    ruleId = "progression.insufficient_exposures";
  } else if (twoMisses) {
    decision = "reduce";
    targetWeight = roundedReduction(latest.weight, input.exercise.increment);
    targetReps = minimum;
    ruleId = `${input.strategy}.two_misses`;
  } else if (failedQuality || highStress || lowReadiness || input.strategy === "hold_or_reduce") {
    ruleId = failedQuality ? "safety.failed_set_quality"
      : highStress ? "safety.high_session_rpe"
        : lowReadiness ? "safety.low_readiness" : "hold_or_reduce.hold";
  } else {
    const topRangeTwice = previous && sameWorkingLoad && supportedEffort
      && allSetsAtLeast(previous.reps, maximum) && allSetsAtLeast(latest.reps, maximum);
    const stableLoad = previous && sameWorkingLoad
      && minimumRep(latest.reps) >= minimum && minimumRep(latest.reps) < maximum;
    const wantsLoadIncrease = (topRangeTwice && input.strategy !== "rep_range")
      || (input.strategy === "fixed_increment" && sameWorkingLoad && supportedEffort);
    if (wantsLoadIncrease) {
      if (canAddConfiguredIncrement(latest.weight, input.exercise.increment)) {
        decision = "add_weight";
        targetWeight = latest.weight + input.exercise.increment;
        if (topRangeTwice) targetReps = minimum;
        ruleId = topRangeTwice
          ? `${input.strategy}.top_range_twice`
          : "fixed_increment.supported";
      } else {
        ruleId = "progression.increment_exceeds_cap";
      }
    } else if (stableLoad && input.strategy !== "fixed_increment") {
      decision = "add_rep";
      targetReps = incrementLowestRep(latest.reps, maximum);
      ruleId = `${input.strategy}.stable_load`;
    } else {
      ruleId = `${input.strategy}.hold`;
    }
  }

  const recommendation = {weight: targetWeight, reps: targetReps, sets: latest.sets};
  return {
    exerciseId: input.exercise.id,
    exerciseName: input.exercise.name,
    strategy: input.strategy,
    decision,
    targetWeight,
    targetReps,
    targetSets: latest.sets,
    observed: {
      weight: latest.weight, reps: latest.reps, sets: latest.sets, rpe: latest.rpe,
      readinessScore: currentReadiness, setQuality: [...latest.setQuality],
    },
    recommendation,
    ruleId,
    evidenceState: evidenceState(valid),
    supportingPeriodIds: valid.slice(-2).map((row) => row.periodId),
  };
}

export function progressionAction(state: ProgressionState): CoachAction | null {
  if (!state.exerciseId || state.evidenceState === "insufficient_evidence") return null;
  const explanation = state.decision === "add_weight"
    ? "Use the supported conservative load increase."
    : state.decision === "add_rep" ? "Keep the load and add one controlled rep."
      : state.decision === "reduce" ? "Reduce the load after repeated misses."
        : "Repeat the current target before progressing.";
  return {
    id: `progression:${state.exerciseId}:${state.decision}`,
    type: "progression",
    label: "Use this target",
    explanation,
    payload: {
      exerciseId: state.exerciseId,
      weight: state.recommendation.weight,
      reps: state.recommendation.reps,
      sets: state.recommendation.sets,
      ruleId: state.ruleId,
      evidenceState: state.evidenceState,
      supportingPeriodIds: [...state.supportingPeriodIds],
      observed: {...state.observed},
    },
    requiresConfirmation: true,
  };
}
