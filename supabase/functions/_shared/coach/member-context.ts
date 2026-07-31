import type {CoachMode} from "./contracts.ts";
import type {CoachSettings} from "./settings.ts";

export type ProvenanceRef = {
  id: string;
  type: "session" | "set" | "goal" | "readiness";
  label: string;
  periodId: string | null;
  exerciseId: string | null;
  setIndex: number | null;
  date: string | null;
};

export type CoachExclusion =
  | {target_type: "session"; target_key: string; selector: Record<string, never>}
  | {target_type: "date_range"; target_key: string; selector: {from: string; to: string}}
  | {target_type: "exercise"; target_key: string; selector: Record<string, never>}
  | {
    target_type: "data_category";
    target_key: "workouts" | "readiness" | "goals" | "notes";
    selector: Record<string, never>;
  };

type SourceSession = Record<string, unknown> & {
  periodId?: unknown;
  date?: unknown;
  week?: unknown;
  exercises?: unknown;
  readiness?: unknown;
};

type AnalyticsSetRow = {
  w: number;
  r: number;
  quality: string | null;
  setIndex: number;
};

type AnalyticsExercise = {
  w: number;
  r: number;
  s: number;
  volume: number;
  setDetails: AnalyticsSetRow[];
};

type AnalyticsSession = {
  periodId: string;
  date: string | null;
  week: string | number | null;
  periodType: "day" | "week";
  dayKey: string | null;
  rating: number | null;
  rpe: number | null;
  deload: boolean;
  notes?: string;
  readiness?: NonNullable<MemberContext["readiness"]>;
  exercises: Record<string, AnalyticsExercise>;
};

export type BuildMemberContextInput = {
  userId: string;
  appData: Record<string, unknown> & {
    history?: unknown;
    goals?: unknown;
  };
  draft: unknown;
  settings: CoachSettings;
  exclusions: CoachExclusion[];
  mode: CoachMode;
};

export type FilteredMemberData = {
  analyticsSessions: AnalyticsSession[];
  goals: Record<string, number>;
  readiness: MemberContext["readiness"];
  draft: Record<string, unknown> | null;
  notesEnabled: boolean;
};

type MemberSession = {
  periodId: string;
  date: string | null;
  periodType: "day" | "week";
  dayKey: string | null;
  rating: number | null;
  rpe: number | null;
  deload: boolean;
  notes?: string;
  exercises: Array<{
    exerciseId: string;
    weight: number;
    reps: number;
    sets: number;
    volume: number;
    setRows: Array<{weight: number; reps: number; quality: string | null}>;
  }>;
};

export type MemberContext = {
  schemaVersion: 1;
  userId: string;
  mode: CoachMode;
  goals: Record<string, number>;
  readiness: null | {sleep: number; energy: number; soreness: number; score: number};
  sessions: MemberSession[];
  draft: null | Record<string, unknown>;
  profile: CoachSettings["profile"];
  provenance: ProvenanceRef[];
  missingData: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function workoutNumber(value: unknown, fallback = 0): number {
  if (typeof value !== "number" && typeof value !== "string") return fallback;
  if (typeof value === "string" && value.trim() === "") return fallback;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function optionalNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function canonicalDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
}

function legacyPeriodId(entry: SourceSession, index: number): string {
  const date = canonicalDate(entry.date) ?? "unknown";
  const week = typeof entry.week === "string" || typeof entry.week === "number" ? String(entry.week) : "unknown";
  return `legacy:${date}:${week}:${index}`;
}

export function buildSessionRef(entry: SourceSession, index: number): ProvenanceRef {
  const periodId = typeof entry.periodId === "string" && entry.periodId.trim()
    ? entry.periodId.trim()
    : legacyPeriodId(entry, index);
  const date = canonicalDate(entry.date);
  return {
    id: `session:${periodId}`,
    type: "session",
    label: date ? `Session on ${date}` : "Training session",
    periodId,
    exerciseId: null,
    setIndex: null,
    date,
  };
}

function categoryExcluded(exclusions: CoachExclusion[], category: string): boolean {
  return exclusions.some((row) => row.target_type === "data_category" && row.target_key === category);
}

function excludedByDate(entry: SourceSession, exclusions: CoachExclusion[]): boolean {
  const date = canonicalDate(entry.date);
  if (!date) return false;
  return exclusions.some((row) =>
    row.target_type === "date_range" &&
    date >= row.selector.from &&
    date <= row.selector.to
  );
}

function hasMalformedDateExclusion(exclusions: CoachExclusion[]): boolean {
  return exclusions.some((row) =>
    row.target_type === "date_range" &&
    (
      !canonicalDate(row.selector?.from) ||
      !canonicalDate(row.selector?.to) ||
      row.selector.from > row.selector.to
    )
  );
}

function projectGoals(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, number] =>
      typeof entry[1] === "number" && Number.isFinite(entry[1])
    ),
  );
}

function projectReadiness(value: unknown): MemberContext["readiness"] {
  if (!isRecord(value)) return null;
  const values = [value.sleep, value.energy, value.soreness];
  if (values.some((item) => typeof item !== "number" || !Number.isFinite(item) || item < 1 || item > 5)) {
    return null;
  }
  const [sleep, energy, soreness] = values as number[];
  const score = Math.max(0, Math.min(100, Math.round(((sleep + energy + (6 - soreness)) / 15) * 100)));
  return {sleep, energy, soreness, score};
}

function projectSetRows(value: unknown): AnalyticsSetRow[] {
  if (!Array.isArray(value)) return [];
  const rows: AnalyticsSetRow[] = [];
  value.forEach((row, setIndex) => {
    if (!isRecord(row)) return;
    const w = optionalNumber(row.w ?? row.weight);
    const r = optionalNumber(row.r ?? row.reps);
    if (w === null || r === null || w <= 0 || r <= 0) return;
    rows.push({
      w,
      r,
      quality: typeof row.quality === "string" ? row.quality : null,
      setIndex,
    });
  });
  return rows;
}

function projectAnalyticsExercise(value: unknown): AnalyticsExercise | null {
  if (!isRecord(value)) return null;
  return {
    w: workoutNumber(value.w ?? value.weight),
    r: workoutNumber(value.r ?? value.reps),
    s: workoutNumber(value.s ?? value.sets),
    volume: workoutNumber(value.volume),
    setDetails: projectSetRows(value.setDetails ?? value.setRows),
  };
}

function projectAnalyticsSession(
  entry: SourceSession,
  periodId: string,
  includeNotes: boolean,
  includeReadiness: boolean,
  excludedExercises: Set<string>,
): AnalyticsSession {
  const exercises: Record<string, AnalyticsExercise> = {};
  if (isRecord(entry.exercises)) {
    for (const [exerciseId, value] of Object.entries(entry.exercises)) {
      if (!exerciseId.trim() || excludedExercises.has(exerciseId)) continue;
      const exercise = projectAnalyticsExercise(value);
      if (exercise) exercises[exerciseId] = exercise;
    }
  }
  const projected: AnalyticsSession = {
    periodId,
    date: canonicalDate(entry.date),
    week: typeof entry.week === "string" || typeof entry.week === "number" ? entry.week : null,
    periodType: entry.periodType === "week" ? "week" : "day",
    dayKey: typeof entry.dayKey === "string" ? entry.dayKey : null,
    rating: optionalNumber(entry.rating),
    rpe: optionalNumber(entry.rpe),
    deload: entry.deload === true,
    exercises,
  };
  if (includeNotes && typeof entry.notes === "string") projected.notes = entry.notes;
  if (includeReadiness) {
    const readiness = projectReadiness(entry.readiness);
    if (readiness) projected.readiness = readiness;
  }
  return projected;
}

function projectDraftCell(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  return {
    weight: workoutNumber(value.w ?? value.weight),
    reps: workoutNumber(value.r ?? value.reps),
    sets: workoutNumber(value.s ?? value.sets),
    skipped: value.skipped === true,
    setRows: projectSetRows(value.setDetails ?? value.setRows).map((row) => ({
      weight: row.w,
      reps: row.r,
      quality: row.quality,
    })),
  };
}

function projectDraft(
  value: unknown,
  allowWorkouts: boolean,
  allowReadiness: boolean,
  allowNotes: boolean,
  excludedExercises: Set<string>,
): Record<string, unknown> | null {
  if (!allowWorkouts || !isRecord(value)) return null;
  const draft: Record<string, unknown> = {};
  for (const key of ["activeDay", "trackingMode", "periodType", "dayKey", "date"]) {
    if (typeof value[key] === "string") draft[key] = value[key];
  }
  for (const key of ["rating", "rpe"]) {
    const number = optionalNumber(value[key]);
    if (number !== null) draft[key] = number;
  }
  if (typeof value.deload === "boolean") draft.deload = value.deload;
  if (allowNotes && typeof value.notes === "string") draft.notes = value.notes;

  const activeDay = typeof value.activeDay === "string" && value.activeDay.trim()
    ? value.activeDay
    : null;
  const persistedDay = activeDay && isRecord(value.inputs) && isRecord(value.inputs[activeDay])
    ? value.inputs[activeDay]
    : null;
  const legacyDay = activeDay && !persistedDay && isRecord(value.exercises)
    ? value.exercises
    : null;
  const sourceDay = persistedDay ?? legacyDay;
  if (activeDay && sourceDay) {
    const projectedDay: Record<string, unknown> = {};
    for (const [exerciseId, cell] of Object.entries(sourceDay)) {
      if (!exerciseId.trim() || excludedExercises.has(exerciseId)) continue;
      const projected = projectDraftCell(cell);
      if (projected) projectedDay[exerciseId] = projected;
    }
    draft.inputs = {[activeDay]: projectedDay};
  }
  if (allowReadiness) {
    const readiness = projectReadiness(value.readiness);
    if (readiness) draft.readiness = readiness;
  }
  return Object.keys(draft).length ? draft : null;
}

export function filterExcludedData(input: BuildMemberContextInput): FilteredMemberData {
  const history = Array.isArray(input.appData.history)
    ? input.appData.history.filter(isRecord) as SourceSession[]
    : [];
  const excludedExercises = new Set(
    input.exclusions
      .filter((row) => row.target_type === "exercise")
      .map((row) => row.target_key),
  );
  const workoutsEnabled =
    input.settings.permissions.workouts &&
    !categoryExcluded(input.exclusions, "workouts") &&
    !hasMalformedDateExclusion(input.exclusions);
  const readinessEnabled =
    input.settings.permissions.readiness &&
    !categoryExcluded(input.exclusions, "readiness");
  const notesEnabled =
    input.settings.permissions.notes &&
    !categoryExcluded(input.exclusions, "notes");

  const seenPeriodIds = new Set<string>();
  const filteredHistory: AnalyticsSession[] = [];
  if (workoutsEnabled) {
    history.forEach((entry, index) => {
      const periodId = buildSessionRef(entry, index).periodId!;
      if (
        seenPeriodIds.has(periodId) ||
        input.exclusions.some((row) => row.target_type === "session" && row.target_key === periodId) ||
        excludedByDate(entry, input.exclusions)
      ) return;
      seenPeriodIds.add(periodId);
      filteredHistory.push(projectAnalyticsSession(
        entry,
        periodId,
        notesEnabled,
        readinessEnabled,
        excludedExercises,
      ));
    });
  }
  const analyticsSessions = filteredHistory.slice(-52);
  const latestReadiness = [...analyticsSessions]
    .reverse()
    .map((entry) => entry.readiness ?? null)
    .find((value) => value !== null) ?? null;
  const draftReadiness = isRecord(input.draft) ? projectReadiness(input.draft.readiness) : null;

  return {
    analyticsSessions,
    goals: input.settings.permissions.goals && !categoryExcluded(input.exclusions, "goals")
      ? projectGoals(input.appData.goals)
      : {},
    readiness: readinessEnabled ? draftReadiness ?? latestReadiness : null,
    draft: projectDraft(input.draft, workoutsEnabled, readinessEnabled, notesEnabled, excludedExercises),
    notesEnabled,
  };
}

function projectSession(entry: AnalyticsSession, includeNotes: boolean): MemberSession {
  const projected: MemberSession = {
    periodId: entry.periodId,
    date: entry.date,
    periodType: entry.periodType,
    dayKey: entry.dayKey,
    rating: entry.rating,
    rpe: entry.rpe,
    deload: entry.deload,
    exercises: Object.entries(entry.exercises).map(([exerciseId, exercise]) => ({
      exerciseId,
      weight: exercise.w,
      reps: exercise.r,
      sets: exercise.s,
      volume: exercise.volume,
      setRows: exercise.setDetails.map((set) => ({
        weight: set.w,
        reps: set.r,
        quality: set.quality,
      })),
    })),
  };
  if (includeNotes && typeof entry.notes === "string") projected.notes = entry.notes;
  return projected;
}

function buildProvenance(sessions: MemberSession[], sources: AnalyticsSession[]): ProvenanceRef[] {
  const provenance: ProvenanceRef[] = [];
  for (const [sessionIndex, session] of sessions.entries()) {
    provenance.push(buildSessionRef(session as unknown as SourceSession, sessionIndex));
    for (const [exerciseId, exercise] of Object.entries(sources[sessionIndex].exercises)) {
      for (const set of exercise.setDetails) {
        provenance.push({
          id: `set:${session.periodId}:${exerciseId}:${set.setIndex}`,
          type: "set",
          label: `${exerciseId} set ${set.setIndex + 1}`,
          periodId: session.periodId,
          exerciseId,
          setIndex: set.setIndex,
          date: session.date,
        });
      }
    }
  }
  return provenance;
}

export function buildMemberContext(input: BuildMemberContextInput): MemberContext {
  const filtered = filterExcludedData(input);
  const generationSources = filtered.analyticsSessions.slice(-12);
  const sessions = generationSources.map((entry) => projectSession(entry, filtered.notesEnabled));
  const missingData: string[] = [];
  if (sessions.length === 0) missingData.push("workout_history");
  if (filtered.readiness === null) missingData.push("readiness");
  if (Object.keys(filtered.goals).length === 0) missingData.push("goals");

  return {
    schemaVersion: 1,
    userId: input.userId,
    mode: input.mode,
    goals: filtered.goals,
    readiness: filtered.readiness,
    sessions,
    draft: filtered.draft,
    profile: {
      primaryGoal: input.settings.profile.primaryGoal,
      experience: input.settings.profile.experience,
      daysPerWeek: input.settings.profile.daysPerWeek,
      equipment: [...input.settings.profile.equipment],
      limitations: input.settings.permissions.limitations
        ? [...input.settings.profile.limitations]
        : [],
    },
    provenance: buildProvenance(sessions, generationSources),
    missingData,
  };
}
