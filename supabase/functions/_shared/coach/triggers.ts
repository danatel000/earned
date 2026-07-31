import type {CoachMode} from "./contracts.ts";
import type {MemberContext} from "./member-context.ts";
import type {ProgressionState} from "./progression.ts";

export type TriggerType =
  | "plateau"
  | "streak_risk"
  | "pr_opportunity"
  | "readiness_mismatch"
  | "fatigue_deload";

export type CoachTrigger = {
  key: string;
  type: TriggerType;
  ruleId: string;
  evidenceRefs: string[];
  title: string;
  summary: string;
  prompt: string;
  deepLinkMode: CoachMode;
};

export type TriggerInput = {
  now: string;
  cadence: "daily" | "weekly";
  timeZone?: string;
  memberContext: MemberContext;
  progressionStates: ProgressionState[];
  currentDraft: Record<string, unknown> | null;
  dismissedKeys: Set<string>;
  mutedTypes: Set<string>;
};

// The Task 5 brief predates member timezone capture; UTC preserves deterministic compatibility.
export const DEFAULT_TRIGGER_TIME_ZONE = "UTC";

type ProvenanceRow = MemberContext["provenance"][number];

type ProvenanceIndex = {
  byId: Map<string, ProvenanceRow>;
  sessionByPeriod: Map<string, string>;
  readinessIds: string[];
};

type CanonicalSession = {
  periodId: string;
  localDate: string;
  day: number;
  provenanceId: string;
  load: number | null;
};

type MaterialState = {
  source: ProgressionState;
  periodId: string;
  localDate: string;
  day: number;
  provenanceId: string;
  weight: number;
  reps: number;
  sets: number;
  rpe: number | null;
  qualities: string[];
  supported: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const SAFE_QUALITIES = new Set(["easy", "good"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const positive = (value: unknown): value is number => finite(value) && value > 0;

const nonBlank = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

function stableRecord(value: Record<string, unknown>): string {
  return JSON.stringify(
    Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))),
  );
}

function validTimeZone(value: unknown): value is string {
  if (!nonBlank(value)) return false;
  try {
    new Intl.DateTimeFormat("en-US", {timeZone: value}).format(0);
    return true;
  } catch {
    return false;
  }
}

function validPlainDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function localDate(value: unknown, timeZone: string): string | null {
  if (!nonBlank(value)) return null;
  const normalized = value.trim();
  if (validPlainDate(normalized)) return normalized;
  const timestamp = Date.parse(normalized);
  if (!Number.isFinite(timestamp)) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(timestamp);
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((row) => row.type === type)?.value ?? "";
  const result = `${part("year")}-${part("month")}-${part("day")}`;
  return validPlainDate(result) ? result : null;
}

function dayNumber(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
}

function buildProvenanceIndex(value: unknown): {index: ProvenanceIndex; valid: boolean} {
  const index: ProvenanceIndex = {
    byId: new Map(),
    sessionByPeriod: new Map(),
    readinessIds: [],
  };
  if (!Array.isArray(value)) return {index, valid: false};
  const fingerprints = new Map<string, string>();
  let valid = true;

  for (const raw of value) {
    if (!isRecord(raw) || !nonBlank(raw.id) || !nonBlank(raw.type)) {
      valid = false;
      continue;
    }
    const row = raw as unknown as ProvenanceRow;
    const id = raw.id.trim();
    const fingerprint = stableRecord(raw);
    const previous = fingerprints.get(id);
    if (previous !== undefined && previous !== fingerprint) {
      valid = false;
      continue;
    }
    if (previous !== undefined) continue;
    fingerprints.set(id, fingerprint);
    index.byId.set(id, row);

    if (raw.type === "session") {
      if (!nonBlank(raw.periodId)) {
        valid = false;
        continue;
      }
      const periodId = raw.periodId.trim();
      const existing = index.sessionByPeriod.get(periodId);
      if (existing !== undefined && existing !== id) {
        valid = false;
        continue;
      }
      index.sessionByPeriod.set(periodId, id);
    } else if (raw.type === "readiness") {
      index.readinessIds.push(id);
    }
  }
  index.readinessIds.sort();
  return {index, valid};
}

function loadFromExercise(value: unknown): number | null {
  if (!isRecord(value)) return null;
  if (positive(value.volume)) return value.volume;
  if (positive(value.weight) && positive(value.reps) && positive(value.sets)) {
    return value.weight * value.reps * value.sets;
  }
  if (positive(value.w) && positive(value.r) && positive(value.s)) {
    return value.w * value.r * value.s;
  }
  return null;
}

function collectExerciseLoads(value: unknown): {total: number; found: boolean; malformed: boolean} {
  if (Array.isArray(value)) {
    return value.reduce((result, row) => {
      const child = collectExerciseLoads(row);
      return {
        total: result.total + child.total,
        found: result.found || child.found,
        malformed: result.malformed || child.malformed,
      };
    }, {total: 0, found: false, malformed: false});
  }
  if (!isRecord(value)) return {total: 0, found: false, malformed: false};
  if (Object.hasOwn(value, "volume") && !positive(value.volume)) {
    return {total: 0, found: false, malformed: true};
  }
  const direct = loadFromExercise(value);
  if (direct !== null) return {total: direct, found: true, malformed: false};
  return Object.values(value).reduce((result, row) => {
    const child = collectExerciseLoads(row);
    return {
      total: result.total + child.total,
      found: result.found || child.found,
      malformed: result.malformed || child.malformed,
    };
  }, {total: 0, found: false, malformed: false});
}

function canonicalSessions(
  value: unknown,
  timeZone: string,
  provenance: ProvenanceIndex,
): {rows: CanonicalSession[]; valid: boolean} {
  if (!Array.isArray(value)) return {rows: [], valid: false};
  const rows = new Map<string, CanonicalSession>();
  const fingerprints = new Map<string, string>();
  let valid = true;

  for (const raw of value) {
    if (!isRecord(raw) || !nonBlank(raw.periodId)) {
      valid = false;
      continue;
    }
    const periodId = raw.periodId.trim();
    const date = localDate(raw.date, timeZone);
    const provenanceId = provenance.sessionByPeriod.get(periodId);
    const load = collectExerciseLoads(raw.exercises);
    const provenanceDate = provenanceId
      ? localDate(provenance.byId.get(provenanceId)?.date, timeZone)
      : null;
    if (!date || !provenanceId || provenanceDate !== date || load.malformed) {
      valid = false;
      continue;
    }
    const row: CanonicalSession = {
      periodId,
      localDate: date,
      day: dayNumber(date),
      provenanceId,
      load: load.found ? load.total : null,
    };
    const fingerprint = stableRecord(raw);
    const previous = fingerprints.get(periodId);
    if (previous !== undefined && previous !== fingerprint) {
      valid = false;
      continue;
    }
    if (previous !== undefined) continue;
    fingerprints.set(periodId, fingerprint);
    rows.set(periodId, row);
  }

  return {
    rows: [...rows.values()].sort((left, right) =>
      left.day - right.day || left.periodId.localeCompare(right.periodId)),
    valid,
  };
}

function repValue(value: unknown): number | null {
  if (positive(value)) return value;
  if (!Array.isArray(value) || value.length === 0 || !value.every(positive)) return null;
  return Math.min(...value);
}

function materialState(
  value: unknown,
  sessions: Map<string, CanonicalSession>,
): MaterialState | null {
  if (!isRecord(value) || !nonBlank(value.exerciseId) || !nonBlank(value.exerciseName) ||
    !isRecord(value.observed) || !Array.isArray(value.supportingPeriodIds) ||
    value.supportingPeriodIds.length === 0) return null;
  const periodIds = value.supportingPeriodIds;
  if (!periodIds.every(nonBlank)) return null;
  const periodId = periodIds.at(-1)!.trim();
  const session = sessions.get(periodId);
  const reps = repValue(value.observed.reps);
  const weight = value.observed.weight;
  const sets = value.observed.sets;
  const qualities = value.observed.setQuality;
  const rpe = value.observed.rpe;
  if (!session || !positive(weight) || reps === null || !positive(sets) ||
    !Array.isArray(qualities) || !qualities.every((row) => typeof row === "string") ||
    (rpe !== null && (!finite(rpe) || rpe < 0 || rpe > 10))) return null;
  return {
    source: value as unknown as ProgressionState,
    periodId,
    localDate: session.localDate,
    day: session.day,
    provenanceId: session.provenanceId,
    weight,
    reps,
    sets,
    rpe,
    qualities: qualities.map((row) => row.trim().toLowerCase()),
    supported: value.evidenceState === "well_supported",
  };
}

function orderedStates(
  values: unknown,
  sessions: Map<string, CanonicalSession>,
): {
  groups: Map<string, MaterialState[]>;
  invalidExercises: Set<string>;
  valid: boolean;
} {
  if (!Array.isArray(values)) return {groups: new Map(), invalidExercises: new Set(), valid: false};
  const groups = new Map<string, MaterialState[]>();
  const invalidExercises = new Set<string>();
  let valid = true;

  for (const value of values) {
    const row = materialState(value, sessions);
    if (!row) {
      valid = false;
      if (isRecord(value) && nonBlank(value.exerciseId)) invalidExercises.add(value.exerciseId.trim());
      continue;
    }
    const exerciseId = row.source.exerciseId;
    const group = groups.get(exerciseId) ?? [];
    if (group.some((existing) => existing.periodId === row.periodId)) {
      invalidExercises.add(exerciseId);
    }
    group.push(row);
    groups.set(exerciseId, group);
  }

  for (const [exerciseId, group] of groups) {
    group.sort((left, right) =>
      left.day - right.day || left.periodId.localeCompare(right.periodId));
    if (group.some((row, index) => index > 0 && row.day === group[index - 1].day)) {
      invalidExercises.add(exerciseId);
    }
  }
  return {groups, invalidExercises, valid};
}

function keyFor(type: TriggerType, scope: string, material: string[]): string {
  const value = material.join("|");
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${type}:${scope}:${(hash >>> 0).toString(36)}`;
}

function makeTrigger(
  type: TriggerType,
  scope: string,
  evidenceRefs: string[],
  fields: Omit<CoachTrigger, "key" | "type" | "evidenceRefs">,
  keyMaterial: string[] = evidenceRefs,
): CoachTrigger {
  return {key: keyFor(type, scope, keyMaterial), type, evidenceRefs, ...fields};
}

function estimatedStrength(row: MaterialState): number {
  return row.weight * (1 + row.reps / 30);
}

function materialFingerprint(row: MaterialState): string {
  return [
    row.periodId,
    row.localDate,
    row.weight,
    row.reps,
    row.sets,
    row.rpe ?? "no-rpe",
    row.qualities.join(","),
  ].join("@");
}

function successful(row: MaterialState): boolean {
  return row.rpe !== null &&
    row.rpe <= 8.5 &&
    row.qualities.length > 0 &&
    row.qualities.every((quality) => SAFE_QUALITIES.has(quality));
}

function readinessRef(
  provenance: ProvenanceIndex,
  date: string,
  timeZone: string,
): string | null {
  const sameDay = provenance.readinessIds.filter((id) => {
    const row = provenance.byId.get(id);
    return localDate(row?.date, timeZone) === date;
  });
  if (sameDay.length === 1) return sameDay[0];
  return null;
}

function progressionTriggers(
  groups: Map<string, MaterialState[]>,
  invalidExercises: Set<string>,
  readiness: number | null,
  readinessProvenanceId: string | null,
): CoachTrigger[] {
  const triggers: CoachTrigger[] = [];
  for (const [exerciseId, rows] of groups) {
    if (invalidExercises.has(exerciseId)) continue;
    const latestThree = rows.slice(-3);
    if (latestThree.length === 3 && latestThree.every((row) => row.supported)) {
      const noProgress = latestThree.slice(1).every((row, index) =>
        row.reps <= latestThree[index].reps &&
        estimatedStrength(row) <= estimatedStrength(latestThree[index]) + 0.0001);
      if (noProgress) {
        const latest = latestThree[2];
        triggers.push(makeTrigger(
          "plateau",
          exerciseId,
          latestThree.map((row) => row.provenanceId),
          {
            ruleId: "plateau.three_exposures_no_progress",
            title: `Review ${latest.source.exerciseName} plateau`,
            summary: "Three valid exposures show no estimated-strength or rep progress.",
            prompt: `Review my ${latest.source.exerciseName} plateau`,
            deepLinkMode: "planning",
          },
          latestThree.map(materialFingerprint),
        ));
      }
    }

    const latestTwo = rows.slice(-2);
    if (latestTwo.length === 2 &&
      latestTwo.every((row) => row.supported) &&
      readiness !== null && readiness >= 52 &&
      readinessProvenanceId !== null &&
      latestTwo.every(successful) &&
      latestTwo[0].weight === latestTwo[1].weight &&
      latestTwo.every((row) => {
        const target = repValue(row.source.targetReps);
        return target !== null && row.reps >= target;
      })) {
      const latest = latestTwo[1];
      triggers.push(makeTrigger(
        "pr_opportunity",
        exerciseId,
        [...latestTwo.map((row) => row.provenanceId), readinessProvenanceId],
        {
          ruleId: "pr_opportunity.top_range_twice",
          title: `${latest.source.exerciseName} progression opportunity`,
          summary: "Two successful top-range exposures and acceptable readiness support a review.",
          prompt: `Review a conservative progression for ${latest.source.exerciseName}`,
          deepLinkMode: "planning",
        },
        [...latestTwo.map(materialFingerprint), `readiness:${readiness}`],
      ));
    }

    if (latestThree.length === 3 && latestThree.every((row) => row.supported)) {
      const highStress = latestThree.filter((row) => row.rpe !== null && row.rpe >= 9).length;
      const failedQuality = latestThree.filter((row) =>
        row.qualities.some((quality) => !SAFE_QUALITIES.has(quality))).length;
      if (highStress >= 2 || failedQuality >= 2) {
        const latest = latestThree[2];
        triggers.push(makeTrigger(
          "fatigue_deload",
          exerciseId,
          latestThree.map((row) => row.provenanceId),
          {
            ruleId: highStress >= 2
              ? "fatigue_deload.two_high_stress"
              : "fatigue_deload.repeated_failed_quality",
            title: `Review fatigue for ${latest.source.exerciseName}`,
            summary: "The latest three exposures contain repeated high-stress or failed-quality work.",
            prompt: `Review whether ${latest.source.exerciseName} needs a deload`,
            deepLinkMode: "planning",
          },
          latestThree.map(materialFingerprint),
        ));
      }
    }
  }
  return triggers;
}

function streakTrigger(
  input: TriggerInput,
  sessions: CanonicalSession[],
  nowDay: number,
): CoachTrigger | null {
  if (sessions.length < 2) return null;
  const intervalDays = input.cadence === "weekly" ? 7 : 1;
  const latest = sessions.at(-1)!;
  const previous = sessions.at(-2)!;
  if (latest.day - previous.day !== intervalDays || nowDay - latest.day !== intervalDays) {
    return null;
  }
  return makeTrigger(
    "streak_risk",
    input.cadence,
    [previous.provenanceId, latest.provenanceId],
    {
      ruleId: `streak_risk.${input.cadence}_boundary`,
      title: "Training streak at risk",
      summary: `The current ${input.cadence} streak is within one local cadence interval of expiring.`,
      prompt: "Help me choose a safe session to maintain my training streak",
      deepLinkMode: "planning",
    },
    [
      `${previous.periodId}@${previous.localDate}`,
      `${latest.periodId}@${latest.localDate}`,
    ],
  );
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function readinessTrigger(
  input: TriggerInput,
  sessions: CanonicalSession[],
  nowLocalDate: string,
  timeZone: string,
  readinessProvenanceId: string | null,
): CoachTrigger | null {
  const readiness = input.memberContext?.readiness?.score;
  if (!finite(readiness) || readiness < 0 || readiness > 100 ||
    readinessProvenanceId === null) return null;
  const restDay = isRecord(input.currentDraft) &&
    (input.currentDraft.scheduledRestDay === true ||
      input.currentDraft.restDay === true ||
      input.currentDraft.isRestDay === true);
  if (readiness >= 75 && restDay) {
    const scheduled = Object.hasOwn(input.currentDraft!, "scheduledDate")
      ? localDate(input.currentDraft!.scheduledDate, timeZone)
      : nowLocalDate;
    if (!scheduled) return null;
    return makeTrigger(
      "readiness_mismatch",
      "rest-day",
      [readinessProvenanceId],
      {
        ruleId: "readiness_mismatch.high_readiness_rest_day",
        title: "Readiness and rest-day review",
        summary: "Readiness is high on a scheduled rest day.",
        prompt: "Review whether my scheduled rest day still fits",
        deepLinkMode: "planning",
      },
      [
        readinessProvenanceId,
        `readiness:${readiness}`,
        `schedule:${scheduled}`,
        `window:${nowLocalDate}`,
      ],
    );
  }
  if (readiness >= 52 || !isRecord(input.currentDraft)) return null;
  const draft = collectExerciseLoads(input.currentDraft);
  if (!draft.found || draft.malformed) return null;
  const recent = sessions.filter((row) => row.load !== null).slice(-5);
  const recentMedian = median(recent.map((row) => row.load!));
  if (recentMedian === null || draft.total <= recentMedian) return null;
  return makeTrigger(
    "readiness_mismatch",
    "heavy-draft",
    [...recent.map((row) => row.provenanceId), readinessProvenanceId],
    {
      ruleId: "readiness_mismatch.low_readiness_heavy_draft",
      title: "Readiness and draft load mismatch",
      summary: "Readiness is below 52 while the draft load is above the recent median.",
      prompt: "Review today's draft against my readiness",
      deepLinkMode: "pre_workout",
    },
    [
      ...recent.map((row) => `${row.periodId}@${row.localDate}@${row.load}`),
      readinessProvenanceId,
      `readiness:${readiness}`,
      `draft:${draft.total}`,
      `median:${recentMedian}`,
    ],
  );
}

export function buildProactiveTriggers(input: TriggerInput): CoachTrigger[] {
  const timeZone = input?.timeZone ?? DEFAULT_TRIGGER_TIME_ZONE;
  if (!isRecord(input) || !isRecord(input.memberContext) ||
    (input.cadence !== "daily" && input.cadence !== "weekly") ||
    !validTimeZone(timeZone) ||
    !(input.dismissedKeys instanceof Set) ||
    !(input.mutedTypes instanceof Set)) return [];
  const nowLocalDate = localDate(input.now, timeZone);
  if (!nowLocalDate) return [];

  const provenance = buildProvenanceIndex(input.memberContext.provenance);
  if (!provenance.valid) return [];
  const canonical = canonicalSessions(
    input.memberContext.sessions,
    timeZone,
    provenance.index,
  );
  if (!canonical.valid) return [];
  const sessionMap = new Map(canonical.rows.map((row) => [row.periodId, row]));
  const ordered = orderedStates(input.progressionStates, sessionMap);
  const readiness = input.memberContext.readiness?.score;
  const safeReadiness = finite(readiness) && readiness >= 0 && readiness <= 100
    ? readiness
    : null;
  const currentReadinessRef = readinessRef(provenance.index, nowLocalDate, timeZone);
  const candidates = ordered.valid
    ? progressionTriggers(
      ordered.groups,
      ordered.invalidExercises,
      safeReadiness,
      currentReadinessRef,
    )
    : [];
  const streak = streakTrigger(input, canonical.rows, dayNumber(nowLocalDate));
  const mismatch = readinessTrigger(
    input,
    canonical.rows,
    nowLocalDate,
    timeZone,
    currentReadinessRef,
  );
  if (streak) candidates.push(streak);
  if (mismatch) candidates.push(mismatch);

  return candidates
    .filter((trigger) =>
      trigger.evidenceRefs.every((ref) => provenance.index.byId.has(ref)) &&
      !input.dismissedKeys.has(trigger.key) &&
      !input.mutedTypes.has(trigger.type))
    .sort((left, right) =>
      left.type.localeCompare(right.type) || left.key.localeCompare(right.key));
}
