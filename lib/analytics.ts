export type SubmissionLike = {
  score?: number | null;
  reasoning_quality?: number | null;
  answer_completeness?: number | null;
  topic?: string | null;
  /** User-reported confidence (preferred) */
  student_confidence?: string | null;
  /** Legacy rows before student_confidence column */
  confidence_estimate?: string | null;
};

export type TopicCount = { topic: string; count: number };

export type AnalyticsSummary = {
  count: number;
  avgScore: number | null;
  avgReasoning: number | null;
  avgCompleteness: number | null;
  confidenceBreakdown: Record<string, number>;
  topicCounts: TopicCount[];
  scoreHistogram: number[];
};

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function computeAnalytics(rows: SubmissionLike[]): AnalyticsSummary {
  const scores = rows
    .map((r) => r.score)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  const reasoning = rows
    .map((r) => r.reasoning_quality)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  const completeness = rows
    .map((r) => r.answer_completeness)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));

  const confidenceBreakdown: Record<string, number> = {};
  for (const r of rows) {
    const c =
      r.student_confidence ?? r.confidence_estimate ?? null;
    if (c && typeof c === "string") {
      confidenceBreakdown[c] = (confidenceBreakdown[c] ?? 0) + 1;
    }
  }

  const topicMap = new Map<string, number>();
  for (const r of rows) {
    const t = r.topic?.trim();
    if (t) topicMap.set(t, (topicMap.get(t) ?? 0) + 1);
  }
  const topicCounts = [...topicMap.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);

  const scoreHistogram = Array.from({ length: 10 }, () => 0);
  for (const s of scores) {
    const idx = Math.min(9, Math.max(0, Math.round(s) - 1));
    scoreHistogram[idx] += 1;
  }

  return {
    count: rows.length,
    avgScore: mean(scores),
    avgReasoning: mean(reasoning),
    avgCompleteness: mean(completeness),
    confidenceBreakdown,
    topicCounts,
    scoreHistogram,
  };
}
