export type CoachSettings = {
  schemaVersion: 1;
  onboardingCompletedAt: string | null;
  conservativeAdvice: boolean;
  permissions: {workouts: boolean; readiness: boolean; goals: boolean; notes: boolean; limitations: boolean};
  profile: {
    primaryGoal: "strength" | "hypertrophy" | "balanced" | "general_fitness";
    experience: "beginner" | "intermediate" | "advanced";
    daysPerWeek: number;
    equipment: string[];
    limitations: string[];
  };
};

export const DEFAULT_COACH_SETTINGS: CoachSettings = {
  schemaVersion: 1,
  onboardingCompletedAt: null,
  conservativeAdvice: true,
  permissions: {workouts: true, readiness: true, goals: true, notes: false, limitations: false},
  profile: {primaryGoal: "balanced", experience: "intermediate", daysPerWeek: 3, equipment: [], limitations: []},
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function booleanOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function stringArrayOrDefault(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? [...value] : [...fallback];
}

export function normalizeCoachSettings(value: unknown): CoachSettings {
  const input = isRecord(value) ? value : {};
  const permissions = isRecord(input.permissions) ? input.permissions : {};
  const profile = isRecord(input.profile) ? input.profile : {};
  const primaryGoal = profile.primaryGoal;
  const experience = profile.experience;
  const daysPerWeek = profile.daysPerWeek;
  return {
    schemaVersion: 1,
    onboardingCompletedAt: typeof input.onboardingCompletedAt === "string" ? input.onboardingCompletedAt : null,
    conservativeAdvice: booleanOrDefault(input.conservativeAdvice, DEFAULT_COACH_SETTINGS.conservativeAdvice),
    permissions: {
      workouts: booleanOrDefault(permissions.workouts, DEFAULT_COACH_SETTINGS.permissions.workouts),
      readiness: booleanOrDefault(permissions.readiness, DEFAULT_COACH_SETTINGS.permissions.readiness),
      goals: booleanOrDefault(permissions.goals, DEFAULT_COACH_SETTINGS.permissions.goals),
      notes: booleanOrDefault(permissions.notes, DEFAULT_COACH_SETTINGS.permissions.notes),
      limitations: booleanOrDefault(permissions.limitations, DEFAULT_COACH_SETTINGS.permissions.limitations),
    },
    profile: {
      primaryGoal: primaryGoal === "strength" || primaryGoal === "hypertrophy" || primaryGoal === "balanced" || primaryGoal === "general_fitness" ? primaryGoal : DEFAULT_COACH_SETTINGS.profile.primaryGoal,
      experience: experience === "beginner" || experience === "intermediate" || experience === "advanced" ? experience : DEFAULT_COACH_SETTINGS.profile.experience,
      daysPerWeek: typeof daysPerWeek === "number" && Number.isInteger(daysPerWeek) && daysPerWeek > 0 ? daysPerWeek : DEFAULT_COACH_SETTINGS.profile.daysPerWeek,
      equipment: stringArrayOrDefault(profile.equipment, DEFAULT_COACH_SETTINGS.profile.equipment),
      limitations: stringArrayOrDefault(profile.limitations, DEFAULT_COACH_SETTINGS.profile.limitations),
    },
  };
}
