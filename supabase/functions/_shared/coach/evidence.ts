import type {EvidenceState} from "./contracts.ts";

type EvidenceResult = {
  state: EvidenceState;
  reasons: string[];
  missingData: string[];
};

type EvidenceInput = {
  retrievedChunks?: unknown;
  citations?: unknown;
  provenance?: unknown;
  externalClaims?: unknown;
  personalizedClaims?: unknown;
  supportingPeriodIds?: unknown;
  conflictingSignals?: unknown;
  requiresPersonalization?: boolean;
};

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const nonBlank = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validHttpUrl = (value: unknown): boolean => {
  if (!nonBlank(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

const validScore = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;

function stringIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(nonBlank).map((row) => row.trim()))];
}

function validClaimReferences(
  claimsValue: unknown,
  referenceKey: "citationIds" | "provenanceIds",
  validIds: Set<string>,
): boolean {
  if (claimsValue === undefined) return true;
  if (!Array.isArray(claimsValue)) return false;
  return claimsValue.every((claim) => {
    if (!isRecord(claim) || !nonBlank(claim.text)) return false;
    const references = stringIds(claim[referenceKey]);
    return references.length > 0 && references.every((id) => validIds.has(id));
  });
}

function recordFingerprint(value: RecordValue): string {
  return JSON.stringify(
    Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))),
  );
}

function validChunks(value: unknown): {rows: RecordValue[]; valid: boolean} {
  if (!Array.isArray(value)) return {rows: [], valid: false};
  const rows = new Map<string, RecordValue>();
  const fingerprints = new Map<string, string>();
  const conflicted = new Set<string>();
  let valid = true;
  for (const row of value) {
    if (!isRecord(row) || !nonBlank(row.id) || !nonBlank(row.sourceId) ||
      !validHttpUrl(row.url) || !validScore(row.score)) continue;
    const id = row.id.trim();
    const fingerprint = recordFingerprint(row);
    const previous = fingerprints.get(id);
    if (previous !== undefined && previous !== fingerprint) {
      valid = false;
      conflicted.add(id);
      rows.delete(id);
      continue;
    }
    if (previous === undefined && !conflicted.has(id)) {
      fingerprints.set(id, fingerprint);
      rows.set(id, row);
    }
  }
  return {rows: [...rows.values()], valid};
}

function groundedCitationIds(
  citationsValue: unknown,
  chunks: RecordValue[],
): {ids: Set<string>; valid: boolean} {
  const groundedChunks = chunks.filter((row) => (row.score as number) >= 0.72);
  const chunkIds = new Set(groundedChunks.map((row) => row.id as string));
  const ids = new Set(groundedChunks.map((row) => row.id as string));
  if (citationsValue === undefined) return {ids, valid: true};
  if (!Array.isArray(citationsValue)) return {ids, valid: false};

  const fingerprints = new Map<string, string>();
  let valid = true;
  for (const citation of citationsValue) {
    if (!isRecord(citation) || !nonBlank(citation.id) || !nonBlank(citation.chunkId) ||
      !chunkIds.has(citation.chunkId.trim()) ||
      (Object.hasOwn(citation, "url") && !validHttpUrl(citation.url))) {
      valid = false;
      continue;
    }
    const id = citation.id.trim();
    const fingerprint = recordFingerprint(citation);
    const previous = fingerprints.get(id);
    if (previous !== undefined && previous !== fingerprint) {
      valid = false;
      ids.delete(id);
      continue;
    }
    fingerprints.set(id, fingerprint);
    ids.add(id);
  }
  return {ids, valid};
}

function validProvenanceIds(
  value: unknown,
  periodIds: Set<string>,
): {ids: Set<string>; valid: boolean} {
  const ids = new Set<string>();
  if (value === undefined) return {ids, valid: true};
  if (!Array.isArray(value)) return {ids, valid: false};
  const fingerprints = new Map<string, string>();
  let valid = true;
  for (const row of value) {
    if (!isRecord(row) || !nonBlank(row.id) ||
      !(row.periodId === null || (nonBlank(row.periodId) && periodIds.has(row.periodId.trim())))) {
      valid = false;
      continue;
    }
    const id = row.id.trim();
    const fingerprint = recordFingerprint(row);
    const previous = fingerprints.get(id);
    if (previous !== undefined && previous !== fingerprint) {
      valid = false;
      ids.delete(id);
      continue;
    }
    fingerprints.set(id, fingerprint);
    ids.add(id);
  }
  return {ids, valid};
}

function hasMaterialContradiction(value: unknown): boolean {
  if (!Array.isArray(value)) return value !== undefined && value !== null;
  return value.some((signal) => {
    if (nonBlank(signal)) return true;
    if (!isRecord(signal)) return signal !== null;
    return signal.resolved !== true && signal.changesRecommendation !== false;
  });
}

export function deriveEvidenceState(input: EvidenceInput): EvidenceResult {
  const source = isRecord(input) ? input : {};
  const canonicalChunks = validChunks(source.retrievedChunks);
  const chunks = canonicalChunks.rows;
  const groundedChunks = chunks.filter((row) => (row.score as number) >= 0.72);
  const periodIds = new Set(stringIds(source.supportingPeriodIds));
  const citationRefs = groundedCitationIds(source.citations, chunks);
  const provenanceRefs = validProvenanceIds(source.provenance, periodIds);
  const citationsValid = canonicalChunks.valid && citationRefs.valid &&
    validClaimReferences(source.externalClaims, "citationIds", citationRefs.ids);
  const provenanceValid =
    provenanceRefs.valid &&
    validClaimReferences(source.personalizedClaims, "provenanceIds", provenanceRefs.ids);
  const needsPersonalization =
    source.requiresPersonalization === true ||
    (Array.isArray(source.personalizedClaims) && source.personalizedClaims.length > 0);
  const contradiction = hasMaterialContradiction(source.conflictingSignals);

  const reasons: string[] = [];
  const missingData: string[] = [];

  if (contradiction) {
    reasons.push("An unresolved contradiction could change the recommendation.");
    missingData.push("resolve_contradictions");
  }
  if (!citationsValid) {
    reasons.push("One or more external claims lack valid grounded citations.");
    missingData.push("valid_citations");
  }
  if (!provenanceValid) {
    reasons.push("One or more personalized claims lack valid provenance.");
    missingData.push("valid_provenance");
  }
  if (groundedChunks.length === 0) {
    reasons.push("No retrieved source meets the relevance threshold.");
    missingData.push("grounded_retrieval");
  }
  if (periodIds.size < 2) {
    reasons.push("At least two distinct consistent sessions are required for a personalized trend.");
    missingData.push("second_exposure");
  }

  if (contradiction || !citationsValid || !provenanceValid ||
    (needsPersonalization && periodIds.size < 2)) {
    return {state: "insufficient_evidence", reasons, missingData};
  }

  if (groundedChunks.length > 0 && periodIds.size >= 2) {
    return {
      state: "well_supported",
      reasons: ["Grounded retrieval and a consistent multi-session trend support the guidance."],
      missingData: [],
    };
  }

  if (groundedChunks.length > 0 || periodIds.size > 0) {
    return {state: "partially_supported", reasons, missingData};
  }

  return {state: "insufficient_evidence", reasons, missingData};
}
