export type ConfidenceLevel = "low" | "medium" | "high";

/** Fixed taxonomy for AI — matches DB / prompt (snake_case). */
export const ERROR_TYPE_IDS = [
  "conceptual_misunderstanding",
  "calculation_error",
  "misread_question",
  "partial_knowledge",
  "guessing",
  "logic_breakdown",
] as const;

export type ErrorTypeId = (typeof ERROR_TYPE_IDS)[number];

export const ERROR_TYPE_LABELS: Record<ErrorTypeId, string> = {
  conceptual_misunderstanding: "Conceptual misunderstanding",
  calculation_error: "Calculation error",
  misread_question: "Misread question",
  partial_knowledge: "Partial knowledge",
  guessing: "Guessing",
  logic_breakdown: "Logic breakdown",
};

export type AiDiagnostics = {
  score: number;
  topic: string;
  subtopic: string;
  strengths: string[];
  misconceptions: string[];
  missing_concepts: string[];
  suggested_next_step: string;
  reasoning_quality: number;
  answer_completeness: number;
  /** Primary issue patterns (1–3 items), ids from ERROR_TYPE_IDS only */
  error_types: ErrorTypeId[];
};

const CONFIDENCE_VALUES: ConfidenceLevel[] = ["low", "medium", "high"];

const ERROR_ID_SET = new Set<string>(ERROR_TYPE_IDS);

export function isConfidenceLevel(value: unknown): value is ConfidenceLevel {
  return typeof value === "string" && CONFIDENCE_VALUES.includes(value as ConfidenceLevel);
}

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

function sanitizeErrorTypes(value: unknown): ErrorTypeId[] {
  if (!Array.isArray(value)) return [];
  const out: ErrorTypeId[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const id = item.trim();
    if (ERROR_ID_SET.has(id) && !out.includes(id as ErrorTypeId)) {
      out.push(id as ErrorTypeId);
      if (out.length >= 3) break;
    }
  }
  return out;
}

export function sanitizeDiagnostics(input: unknown): AiDiagnostics {
  const data = (input ?? {}) as Record<string, unknown>;

  const error_types = sanitizeErrorTypes(data.error_types);

  return {
    score: toIntegerInRange(data.score, 1, 10),
    topic: toNonEmptyString(data.topic, "General"),
    subtopic: toNonEmptyString(data.subtopic, "General"),
    strengths: toStringArray(data.strengths),
    misconceptions: toStringArray(data.misconceptions),
    missing_concepts: toStringArray(data.missing_concepts),
    suggested_next_step: toNonEmptyString(
      data.suggested_next_step,
      "Spend 10 minutes reviewing the core definition, then rewrite your answer addressing each part of the question."
    ),
    reasoning_quality: toIntegerInRange(data.reasoning_quality, 1, 10),
    answer_completeness: toIntegerInRange(data.answer_completeness, 1, 10),
    error_types: error_types.length > 0 ? error_types : ["partial_knowledge"],
  };
}
