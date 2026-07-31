export const COACH_SCHEMA_VERSION = 1 as const;

export type CoachMode = "pre_workout" | "in_session" | "post_workout" | "planning";
export type EvidenceState = "well_supported" | "partially_supported" | "insufficient_evidence";
export type CoachRequestAction =
  | "bootstrap" | "ask" | "review" | "save_settings" | "save_exclusion"
  | "delete_exclusion" | "save_memory" | "delete_memory"
  | "dismiss_trigger" | "mute_trigger_type" | "delete_thread"
  | "delete_all_coach_data" | "reset_coach_settings" | "export";

export type CoachRequest = {
  action: CoachRequestAction;
  message?: string;
  threadId?: string;
  mode?: CoachMode;
  payload?: Record<string, unknown>;
};

export type CoachAction = {
  id: string;
  type: "progression" | "substitution" | "intensity" | "keep_plan" | "recovery_focus";
  label: string;
  explanation: string;
  payload: Record<string, unknown>;
  requiresConfirmation: true;
};

export type CoachAnswer = {
  schemaVersion: 1;
  requestId: string;
  threadId: string;
  sections: {
    groundedGuidance: Array<{text: string; citationIds: string[]}>;
    userPattern: Array<{text: string; provenanceIds: string[]}>;
    recommendation: string;
    whyThisFits: string[];
  };
  evidence: {state: EvidenceState; reasons: string[]; missingData: string[]};
  citations: Array<{
    id: string; sourceId: string; title: string; url: string; snippet: string;
    publishedAt: string | null; lastReviewedAt: string;
  }>;
  provenance: Array<{
    id: string; type: "session" | "set" | "goal" | "readiness";
    label: string; periodId: string | null; exerciseId: string | null; setIndex: number | null; date: string | null;
  }>;
  selectedActionIds: string[];
};

type ValidationResult = {ok: true} | {ok: false; error: string};

const REQUEST_ACTIONS = new Set<CoachRequestAction>([
  "bootstrap", "ask", "review", "save_settings", "save_exclusion",
  "delete_exclusion", "save_memory", "delete_memory",
  "dismiss_trigger", "mute_trigger_type", "delete_thread",
  "delete_all_coach_data", "reset_coach_settings", "export",
]);
const MODES = new Set<CoachMode>(["pre_workout", "in_session", "post_workout", "planning"]);
const EVIDENCE_STATES = new Set<EvidenceState>(["well_supported", "partially_supported", "insufficient_evidence"]);
const PROVENANCE_TYPES = new Set<CoachAnswer["provenance"][number]["type"]>(["session", "set", "goal", "readiness"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function invalid(error: string): ValidationResult {
  return {ok: false, error};
}

export function validateCoachRequest(value: unknown): ValidationResult {
  if (!isRecord(value) || !hasOnlyKeys(value, ["action", "message", "threadId", "mode", "payload"])) {
    return invalid("Request must be an object with known keys.");
  }
  if (typeof value.action !== "string" || !REQUEST_ACTIONS.has(value.action as CoachRequestAction)) {
    return invalid("Request action is invalid.");
  }
  if (value.message !== undefined && (typeof value.message !== "string" || value.message.length > 2000)) {
    return invalid("Request message is invalid.");
  }
  if (value.action === "ask" && (typeof value.message !== "string" || value.message.trim().length === 0)) {
    return invalid("Ask requests require a message.");
  }
  if (value.threadId !== undefined && typeof value.threadId !== "string") return invalid("Request threadId is invalid.");
  if (value.mode !== undefined && (typeof value.mode !== "string" || !MODES.has(value.mode as CoachMode))) {
    return invalid("Request mode is invalid.");
  }
  if (value.payload !== undefined && !isRecord(value.payload)) return invalid("Request payload must be an object.");
  return {ok: true};
}

export function validateCoachAnswer(value: unknown, actionAllowlist: Set<string>): ValidationResult {
  if (!isRecord(value) || !hasOnlyKeys(value, [
    "schemaVersion", "requestId", "threadId", "sections", "evidence", "citations", "provenance", "selectedActionIds",
  ])) return invalid("Answer must be an object with known keys.");

  if (value.schemaVersion !== COACH_SCHEMA_VERSION || typeof value.requestId !== "string" || typeof value.threadId !== "string") {
    return invalid("Answer identity is invalid.");
  }
  if (!isRecord(value.sections) || !hasOnlyKeys(value.sections, ["groundedGuidance", "userPattern", "recommendation", "whyThisFits"]) ||
    !Array.isArray(value.sections.groundedGuidance) || !Array.isArray(value.sections.userPattern) ||
    typeof value.sections.recommendation !== "string" || !isStringArray(value.sections.whyThisFits)) return invalid("Answer sections are invalid.");
  if (!isRecord(value.evidence) || !hasOnlyKeys(value.evidence, ["state", "reasons", "missingData"]) ||
    typeof value.evidence.state !== "string" || !EVIDENCE_STATES.has(value.evidence.state as EvidenceState) ||
    !isStringArray(value.evidence.reasons) || !isStringArray(value.evidence.missingData)) return invalid("Answer evidence is invalid.");
  if (!Array.isArray(value.citations) || !Array.isArray(value.provenance) || !isStringArray(value.selectedActionIds)) {
    return invalid("Answer references are invalid.");
  }

  const citationIds = new Set<string>();
  for (const citation of value.citations) {
    if (!isRecord(citation) || !hasOnlyKeys(citation, ["id", "sourceId", "title", "url", "snippet", "publishedAt", "lastReviewedAt"]) ||
      typeof citation.id !== "string" || typeof citation.sourceId !== "string" || typeof citation.title !== "string" ||
      !isHttpUrl(citation.url) || typeof citation.snippet !== "string" || !isNullableString(citation.publishedAt) ||
      typeof citation.lastReviewedAt !== "string" || citationIds.has(citation.id)) return invalid("Answer citations are invalid.");
    citationIds.add(citation.id);
  }

  const provenanceIds = new Set<string>();
  for (const provenance of value.provenance) {
    if (!isRecord(provenance) || !hasOnlyKeys(provenance, ["id", "type", "label", "periodId", "exerciseId", "setIndex", "date"]) ||
      typeof provenance.id !== "string" || typeof provenance.type !== "string" || !PROVENANCE_TYPES.has(provenance.type as CoachAnswer["provenance"][number]["type"]) ||
      typeof provenance.label !== "string" || !isNullableString(provenance.periodId) || !isNullableString(provenance.exerciseId) ||
      (provenance.setIndex !== null && typeof provenance.setIndex !== "number") || !isNullableString(provenance.date) || provenanceIds.has(provenance.id)) return invalid("Answer provenance is invalid.");
    provenanceIds.add(provenance.id);
  }

  for (const guidance of value.sections.groundedGuidance) {
    if (!isRecord(guidance) || !hasOnlyKeys(guidance, ["text", "citationIds"]) || typeof guidance.text !== "string" ||
      !isStringArray(guidance.citationIds) || guidance.citationIds.some((id) => !citationIds.has(id))) return invalid("Grounded guidance citations are invalid.");
  }
  for (const pattern of value.sections.userPattern) {
    if (!isRecord(pattern) || !hasOnlyKeys(pattern, ["text", "provenanceIds"]) || typeof pattern.text !== "string" ||
      !isStringArray(pattern.provenanceIds) || pattern.provenanceIds.some((id) => !provenanceIds.has(id))) return invalid("User pattern provenance is invalid.");
  }
  if (value.selectedActionIds.some((id) => !actionAllowlist.has(id))) return invalid("Selected action is not allowed.");
  return {ok: true};
}
