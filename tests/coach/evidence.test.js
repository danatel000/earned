import {describe, expect, it} from "vitest";
import {chunk} from "./fixtures.js";
import {deriveEvidenceState} from "../../supabase/functions/_shared/coach/evidence.ts";

const citation = (overrides = {}) => ({
  id: "citation-1",
  sourceId: "hhs-pag-2e",
  url: "https://health.gov/",
  ...overrides,
});

const provenance = (overrides = {}) => ({
  id: "session:a",
  periodId: "a",
  ...overrides,
});

describe("Coach evidence calibration", () => {
  it("requires grounded retrieval and sufficient member data for well supported", () => {
    expect(deriveEvidenceState({
      retrievedChunks: [
        chunk({id: "chunk-a", score: 0.82}),
        chunk({id: "chunk-b", score: 0.79}),
      ],
      supportingPeriodIds: ["a", "b", "c"],
      conflictingSignals: [],
    }).state).toBe("well_supported");
  });

  it("returns insufficient evidence when a personalized prescription lacks history", () => {
    expect(deriveEvidenceState({
      retrievedChunks: [chunk({score: 0.91})],
      supportingPeriodIds: [],
      conflictingSignals: [],
      requiresPersonalization: true,
    }).state).toBe("insufficient_evidence");
  });

  it("requires every external claim to have a valid high-relevance citation", () => {
    const result = deriveEvidenceState({
      retrievedChunks: [
        chunk({id: "chunk-a", score: 0.9}),
        chunk({id: "chunk-b", score: 0.71}),
      ],
      citations: [citation({id: "citation-a", chunkId: "chunk-a"})],
      externalClaims: [
        {text: "Progress gradually.", citationIds: ["citation-a"]},
        {text: "Use a second unsupported claim.", citationIds: ["missing"]},
      ],
      supportingPeriodIds: ["a", "b"],
      conflictingSignals: [],
    });

    expect(result.state).toBe("insufficient_evidence");
    expect(result.missingData).toContain("valid_citations");
  });

  it("grounds a citation only through its exact threshold-qualified chunk ID", () => {
    const result = deriveEvidenceState({
      retrievedChunks: [
        chunk({id: "low", sourceId: "shared-source", score: 0.1}),
        chunk({id: "high", sourceId: "shared-source", score: 0.9}),
      ],
      citations: [citation({
        id: "citation-low",
        chunkId: "low",
        sourceId: "shared-source",
      })],
      externalClaims: [{text: "Claim from the low chunk.", citationIds: ["citation-low"]}],
      supportingPeriodIds: ["a", "b"],
      conflictingSignals: [],
    });

    expect(result.state).toBe("insufficient_evidence");
    expect(result.missingData).toContain("valid_citations");
  });

  it("rejects conflicting duplicate citation IDs", () => {
    const result = deriveEvidenceState({
      retrievedChunks: [
        chunk({id: "chunk-a", score: 0.9}),
        chunk({id: "chunk-b", score: 0.9}),
      ],
      citations: [
        citation({id: "citation-duplicate", chunkId: "chunk-a"}),
        citation({id: "citation-duplicate", chunkId: "chunk-b"}),
      ],
      externalClaims: [{
        text: "Ambiguously cited claim.",
        citationIds: ["citation-duplicate"],
      }],
      supportingPeriodIds: ["a", "b"],
      conflictingSignals: [],
    });

    expect(result.state).toBe("insufficient_evidence");
    expect(result.missingData).toContain("valid_citations");
  });

  it("rejects conflicting duplicate retrieved chunk IDs before grounding", () => {
    const result = deriveEvidenceState({
      retrievedChunks: [
        chunk({id: "duplicate-chunk", score: 0.1, text: "Low relevance row."}),
        chunk({id: "duplicate-chunk", score: 0.9, text: "High relevance row."}),
      ],
      citations: [citation({
        id: "citation-duplicate-chunk",
        chunkId: "duplicate-chunk",
      })],
      externalClaims: [{
        text: "Claim using an ambiguous chunk ID.",
        citationIds: ["citation-duplicate-chunk"],
      }],
      supportingPeriodIds: ["a", "b"],
      conflictingSignals: [],
    });

    expect(result.state).toBe("insufficient_evidence");
    expect(result.missingData).toContain("valid_citations");
  });

  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
    "0.95",
    -0.1,
    1.1,
  ])("fails closed for malformed retrieval score %s", (score) => {
    expect(deriveEvidenceState({
      retrievedChunks: [chunk({score})],
      supportingPeriodIds: ["a", "b"],
      conflictingSignals: [],
    }).state).not.toBe("well_supported");
  });

  it("requires valid provenance for each personalized claim", () => {
    const result = deriveEvidenceState({
      retrievedChunks: [chunk({score: 0.9})],
      supportingPeriodIds: ["a", "b"],
      provenance: [provenance()],
      personalizedClaims: [{
        text: "Your recent trend is stable.",
        provenanceIds: ["session:a", "session:missing"],
      }],
      conflictingSignals: [],
      requiresPersonalization: true,
    });

    expect(result.state).toBe("insufficient_evidence");
    expect(result.missingData).toContain("valid_provenance");
  });

  it("rejects conflicting duplicate provenance IDs", () => {
    const result = deriveEvidenceState({
      retrievedChunks: [chunk({score: 0.9})],
      supportingPeriodIds: ["a", "b"],
      provenance: [
        provenance({id: "session:duplicate", periodId: "a"}),
        provenance({id: "session:duplicate", periodId: "b"}),
      ],
      personalizedClaims: [{
        text: "Ambiguous member trend.",
        provenanceIds: ["session:duplicate"],
      }],
      conflictingSignals: [],
      requiresPersonalization: true,
    });

    expect(result.state).toBe("insufficient_evidence");
    expect(result.missingData).toContain("valid_provenance");
  });

  it("fails closed when an unresolved contradiction changes the recommendation", () => {
    const result = deriveEvidenceState({
      retrievedChunks: [chunk({score: 0.9})],
      supportingPeriodIds: ["a", "b"],
      conflictingSignals: [{resolved: false, changesRecommendation: true}],
    });

    expect(result.state).toBe("insufficient_evidence");
    expect(result.reasons.join(" ")).toMatch(/contradiction/i);
  });

  it("deduplicates supporting periods before assessing a personalized trend", () => {
    expect(deriveEvidenceState({
      retrievedChunks: [chunk({score: 0.9})],
      supportingPeriodIds: ["same", "same"],
      conflictingSignals: [],
      requiresPersonalization: true,
    }).state).toBe("insufficient_evidence");
  });

  it("uses partial support when useful evidence exists but one dimension is incomplete", () => {
    expect(deriveEvidenceState({
      retrievedChunks: [chunk({score: 0.8})],
      supportingPeriodIds: ["only-one"],
      conflictingSignals: [],
    }).state).toBe("partially_supported");
  });
});
