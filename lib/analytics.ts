import { ERROR_TYPE_LABELS, type ErrorTypeId } from "./diagnostics";

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

/** Extended type used by the insight engine — superset of SubmissionLike */
export type SubmissionForInsights = SubmissionLike & {
  error_types?: string[] | null;
  created_at?: string | null;
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

export type InsightSeverity = "risk" | "warning" | "strength" | "neutral";

export type Insight = {
  type: InsightSeverity;
  title: string;
  description: string;
  metric: string;
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
    const c = r.student_confidence ?? r.confidence_estimate ?? null;
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

// ─── Insight detectors ────────────────────────────────────────────────────────

function detectOverconfidence(rows: SubmissionForInsights[]): Insight | null {
  const highConf = rows.filter((r) => {
    const conf = r.student_confidence ?? r.confidence_estimate;
    return conf === "high" && typeof r.score === "number";
  });
  if (highConf.length < 3) return null;

  const overconfident = highConf.filter((r) => (r.score as number) < 6);
  const rate = overconfident.length / highConf.length;
  if (rate < 0.35) return null;

  const pct = Math.round(rate * 100);
  return {
    type: "risk",
    title: "Overconfidence pattern detected",
    description:
      "You frequently rate yourself as highly confident, but your scores don't reflect that. This gap makes it harder to know which topics genuinely need more work.",
    metric: `${pct}% of high-confidence submissions scored below 6/10`,
  };
}

function detectPersistentWeakness(rows: SubmissionForInsights[]): Insight | null {
  const withErrors = rows.filter(
    (r) => Array.isArray(r.error_types) && r.error_types.length > 0
  );
  if (withErrors.length < 3) return null;

  const counts: Record<string, number> = {};
  for (const row of withErrors) {
    for (const e of row.error_types as string[]) {
      counts[e] = (counts[e] ?? 0) + 1;
    }
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const meaningful = sorted.filter(([id]) => id !== "partial_knowledge");
  if (!meaningful.length || meaningful[0][1] < 3) return null;

  const [id, count] = meaningful[0];
  const pct = Math.round((count / withErrors.length) * 100);
  const label =
    id in ERROR_TYPE_LABELS
      ? ERROR_TYPE_LABELS[id as ErrorTypeId]
      : id.replace(/_/g, " ");

  return {
    type: "warning",
    title: `Recurring issue: ${label}`,
    description:
      "This error pattern keeps appearing across your submissions. Targeted practice on this specific gap will improve your scores faster than general review.",
    metric: `Flagged in ${count} of ${withErrors.length} scored submissions (${pct}%)`,
  };
}

function detectTopicStagnation(rows: SubmissionForInsights[]): Insight | null {
  const byTopic = new Map<string, Array<{ score: number; ts: string }>>();

  for (const row of rows) {
    const topic = row.topic?.trim();
    if (!topic || typeof row.score !== "number") continue;
    if (!byTopic.has(topic)) byTopic.set(topic, []);
    byTopic.get(topic)!.push({ score: row.score, ts: row.created_at ?? "" });
  }

  for (const [topic, entries] of byTopic) {
    if (entries.length < 3) continue;
    entries.sort((a, b) => a.ts.localeCompare(b.ts));

    const mid = Math.ceil(entries.length / 2);
    const early = entries.slice(0, mid);
    const recent = entries.slice(mid);

    const avgEarly = early.reduce((s, e) => s + e.score, 0) / early.length;
    const avgRecent = recent.reduce((s, e) => s + e.score, 0) / recent.length;

    if (avgRecent - avgEarly <= 0.5) {
      return {
        type: "warning",
        title: `No improvement in ${topic}`,
        description: `Your ${topic} scores haven't improved over your last ${entries.length} attempts. Try changing your study approach — revisit core concepts, not just more practice problems.`,
        metric: `Early avg: ${avgEarly.toFixed(1)}/10 → Recent avg: ${avgRecent.toFixed(1)}/10`,
      };
    }
  }

  return null;
}

function detectStrength(rows: SubmissionForInsights[]): Insight | null {
  const byTopic = new Map<string, number[]>();

  for (const row of rows) {
    const topic = row.topic?.trim();
    if (!topic || typeof row.score !== "number") continue;
    if (!byTopic.has(topic)) byTopic.set(topic, []);
    byTopic.get(topic)!.push(row.score);
  }

  let bestTopic = "";
  let bestAvg = 0;
  let bestCount = 0;

  for (const [topic, scores] of byTopic) {
    if (scores.length < 2) continue;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg >= 7.5 && avg > bestAvg) {
      bestTopic = topic;
      bestAvg = avg;
      bestCount = scores.length;
    }
  }

  if (!bestTopic) return null;

  return {
    type: "strength",
    title: `Consistent strength: ${bestTopic}`,
    description: `You're performing reliably well in ${bestTopic} across multiple submissions. Build on this as a foundation when tackling related or more advanced topics.`,
    metric: `Avg score ${bestAvg.toFixed(1)}/10 across ${bestCount} submissions`,
  };
}

export function generateInsights(rows: SubmissionForInsights[]): Insight[] {
  if (rows.length < 2) return [];
  return [
    detectOverconfidence(rows),
    detectPersistentWeakness(rows),
    detectTopicStagnation(rows),
    detectStrength(rows),
  ].filter((i): i is Insight => i !== null);
}
