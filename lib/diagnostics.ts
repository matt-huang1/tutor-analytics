export type ConfidenceEstimate = "low" | "medium" | "high";

export type AiDiagnostics = {
  score: number;
  topic: string;
  subtopic: string;
  strengths: string[];
  misconceptions: string[];
  missing_concepts: string[];
  suggested_next_step: string;
  confidence_estimate: ConfidenceEstimate;
  reasoning_quality: number;
  answer_completeness: number;
};

const CONFIDENCE_VALUES: ConfidenceEstimate[] = ["low", "medium", "high"];

function toIntegerInRange(value: unknown, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return min;
  const rounded = Math.round(value);
  return Math.min(max, Math.max(min, rounded));
}

function toNonEmptyString(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toConfidenceEstimate(value: unknown): ConfidenceEstimate {
  if (typeof value !== "string") return "medium";
  return CONFIDENCE_VALUES.includes(value as ConfidenceEstimate)
    ? (value as ConfidenceEstimate)
    : "medium";
}

export function sanitizeDiagnostics(input: unknown): AiDiagnostics {
  const data = (input ?? {}) as Record<string, unknown>;

  return {
    score: toIntegerInRange(data.score, 1, 10),
    topic: toNonEmptyString(data.topic, "General"),
    subtopic: toNonEmptyString(data.subtopic, "General"),
    strengths: toStringArray(data.strengths),
    misconceptions: toStringArray(data.misconceptions),
    missing_concepts: toStringArray(data.missing_concepts),
    suggested_next_step: toNonEmptyString(
      data.suggested_next_step,
      "Review core definitions, then retry a similar question."
    ),
    confidence_estimate: toConfidenceEstimate(data.confidence_estimate),
    reasoning_quality: toIntegerInRange(data.reasoning_quality, 1, 10),
    answer_completeness: toIntegerInRange(data.answer_completeness, 1, 10),
  };
}
