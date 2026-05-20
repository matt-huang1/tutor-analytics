"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import {
  computeAnalytics,
  generateInsights,
  type AnalyticsSummary,
  type Insight,
  type InsightSeverity,
  type SubmissionForInsights,
} from "../lib/analytics";
import { confidenceClasses } from "../lib/format";

// ─── Sub-components ───────────────────────────────────────────────────────────

const SEVERITY: Record<
  InsightSeverity,
  { border: string; badge: string; label: string }
> = {
  risk:     { border: "border-l-red-500",   badge: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",         label: "Risk" },
  warning:  { border: "border-l-amber-500", badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300", label: "Watch" },
  strength: { border: "border-l-green-500", badge: "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300", label: "Strength" },
  neutral:  { border: "border-l-accent",    badge: "bg-accent-soft text-accent",                                          label: "Insight" },
};

const INSIGHT_ORDER: Record<InsightSeverity, number> = { strength: 0, neutral: 1, warning: 2, risk: 3 };

function InsightCard({ insight }: { insight: Insight }) {
  const s = SEVERITY[insight.type];
  const shadow = insight.type === "risk" ? "shadow-md" : "shadow-sm";
  return (
    <div
      className={`flex flex-col rounded-xl border border-border bg-card p-4 ${shadow} border-l-4 ${s.border}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug text-foreground">
          {insight.title}
        </p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.badge}`}
        >
          {s.label}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {insight.description}
      </p>
      <p className="mt-auto pt-3 text-[11px] text-muted-foreground/60">
        {insight.metric}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-accent">
        {value}
        {suffix ? (
          <span className="text-base font-normal text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </p>
    </div>
  );
}

function Histogram({ histogram }: { histogram: number[] }) {
  const max = Math.max(1, ...histogram);
  const maxBarPx = 72;
  return (
    <div className="flex h-full flex-col">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Score distribution
      </p>
      <div className="mt-auto flex h-20 items-end gap-1">
        {histogram.map((count, i) => {
          const score = i + 1;
          const barPx =
            count === 0 ? 3 : Math.max(4, (count / max) * maxBarPx);
          const barColor =
            score <= 2
              ? "bg-red-400/60 dark:bg-red-500/50"
              : score <= 7
              ? "bg-amber-400/60 dark:bg-amber-500/50"
              : "bg-green-400/60 dark:bg-green-500/50";
          return (
            <div
              key={score}
              className="flex flex-1 flex-col items-center gap-1"
              title={`Score ${score}: ${count}`}
            >
              <div
                className={`w-full rounded-t ${barColor}`}
                style={{ height: `${barPx}px` }}
              />
              <span className="text-[10px] text-muted-foreground">{score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {children}
      </span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  embedded?: boolean;
};

export default function LearningAnalytics({ embedded = false }: Props) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async (silent?: boolean) => {
    if (!silent) {
      setLoading(true);
      setErrorMessage("");
    }
    const { data, error } = await supabase.from("submissions").select(
      "score, reasoning_quality, answer_completeness, topic, student_confidence, confidence_estimate, error_types, created_at"
    );

    if (error) {
      console.error(error);
      setErrorMessage(error.message ?? "Could not load analytics.");
      setSummary(null);
      setInsights([]);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as SubmissionForInsights[];
    setSummary(computeAnalytics(rows));
    setInsights(generateInsights(rows));
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load(false);
    });
  }, [load]);

  useEffect(() => {
    function onRefresh() {
      void load(true);
    }
    window.addEventListener("submissions:refresh", onRefresh);
    return () => window.removeEventListener("submissions:refresh", onRefresh);
  }, [load]);

  const shell = (children: ReactNode, className?: string) =>
    embedded ? (
      <div className={className}>{children}</div>
    ) : (
      <section
        aria-labelledby="analytics-heading"
        className={`rounded-2xl border border-border bg-card p-6 shadow-md sm:p-8 ${className ?? ""}`}
      >
        {children}
      </section>
    );

  if (loading) {
    return shell(
      <div className="space-y-6">
        {!embedded && <div className="h-6 w-52 animate-pulse rounded bg-border" />}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-border/40" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-32 animate-pulse rounded-xl bg-border/30" />
          <div className="h-32 animate-pulse rounded-xl bg-border/25" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-28 animate-pulse rounded-xl bg-border/20" />
          <div className="h-28 animate-pulse rounded-xl bg-border/15" />
          <div className="h-28 animate-pulse rounded-xl bg-border/10" />
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return shell(
      <>
        {!embedded && (
          <h1 id="analytics-heading" className="text-2xl font-semibold tracking-tight text-foreground">
            Learning Dashboard
          </h1>
        )}
        <p
          role="alert"
          className={`rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive ${embedded ? "" : "mt-2"}`}
        >
          {errorMessage}
        </p>
      </>
    );
  }

  if (!summary || summary.count === 0) {
    return shell(
      <>
        {!embedded && (
          <h1 id="analytics-heading" className="text-2xl font-semibold tracking-tight text-foreground">
            Learning Dashboard
          </h1>
        )}
        <p className={`rounded-xl border border-dashed border-border bg-surface-subtle px-4 py-8 text-center text-sm text-muted-foreground ${embedded ? "" : "mt-3"}`}>
          Submit at least one answer to generate insights and see your analytics.
        </p>
      </>
    );
  }

  const fmt = (n: number | null) => (n === null ? "—" : n.toFixed(1));

  const sortedInsights = [...insights].sort(
    (a, b) => INSIGHT_ORDER[a.type] - INSIGHT_ORDER[b.type]
  );
  const insightGridClass =
    sortedInsights.length === 1
      ? ""
      : sortedInsights.length % 2 === 0
      ? "grid gap-3 sm:grid-cols-2"
      : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3";

  const CONFIDENCE_ORDER = ["low", "medium", "high"];
  const confParts = Object.entries(summary.confidenceBreakdown)
    .filter(([, n]) => n > 0)
    .sort(([a], [b]) => CONFIDENCE_ORDER.indexOf(a) - CONFIDENCE_ORDER.indexOf(b));

  const body = (
    <>
      {!embedded && (
        <>
          <h1
            id="analytics-heading"
            className="text-2xl font-semibold tracking-tight text-foreground"
          >
            Learning Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Overview of learning patterns and generated insights from submitted answers.
          </p>
        </>
      )}

      {/* ── Section 1: Overview ─────────────────────────────────────── */}
      <div className={embedded ? "" : "mt-6"}>
        <SectionHeader>Overview</SectionHeader>

        {/* 4-up stat grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Submissions" value={String(summary.count)} />
          <StatCard label="Avg score" value={fmt(summary.avgScore)} suffix="/10" />
          <StatCard label="Avg reasoning" value={fmt(summary.avgReasoning)} suffix="/10" />
          <StatCard label="Avg completeness" value={fmt(summary.avgCompleteness)} suffix="/10" />
        </div>

        {/* Confidence mix */}
        {confParts.length > 0 && (
          <div className="mt-3 rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Confidence mix
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {confParts.map(([level, n]) => (
                <span
                  key={level}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${confidenceClasses(level)}`}
                >
                  {level}: {n}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Section 2: Patterns ─────────────────────────────────────── */}
      <div className="mt-8">
        <SectionHeader>Patterns</SectionHeader>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
            <Histogram histogram={summary.scoreHistogram} />
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Top topics
            </p>
            {summary.topicCounts.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No topics yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {summary.topicCounts.slice(0, 6).map(({ topic, count }) => {
                  const maxCount = summary.topicCounts[0].count;
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <li key={topic}>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate text-foreground">{topic}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">{count}×</span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-muted-foreground/40"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 3: Personalised Insights ────────────────────────── */}
      <div className="mt-8">
        <SectionHeader>Personalised Insights</SectionHeader>
        {insights.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface-subtle px-4 py-6 text-center text-sm text-muted-foreground">
            {summary.count < 3
              ? "Submit at least 3 answers to generate insights."
              : "No clear patterns yet. Keep submitting to build a fuller picture."}
          </p>
        ) : (
          <div className={insightGridClass}>
            {sortedInsights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        )}
      </div>
    </>
  );

  return shell(body, embedded ? "space-y-6" : undefined);
}
