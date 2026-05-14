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
  type AnalyticsSummary,
  type SubmissionLike,
} from "../lib/analytics";

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
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-card-foreground">
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
  const maxBarPx = 96;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Score distribution (1–10)
      </p>
      <div className="flex h-[112px] items-end gap-1">
        {histogram.map((count, i) => {
          const score = i + 1;
          const barPx =
            count === 0 ? 4 : Math.max(6, (count / max) * maxBarPx);
          return (
            <div
              key={score}
              className="flex flex-1 flex-col items-center gap-1"
              title={`Score ${score}: ${count}`}
            >
              <div
                className="w-full rounded-t bg-accent/80"
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

type Props = {
  /** When true, omit outer title/card shell — parent section provides layout */
  embedded?: boolean;
};

export default function LearningAnalytics({ embedded = false }: Props) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async (silent?: boolean) => {
    if (!silent) {
      setLoading(true);
      setErrorMessage("");
    }
    const { data, error } = await supabase.from("submissions").select(
      "score, reasoning_quality, answer_completeness, topic, student_confidence, confidence_estimate"
    );

    if (error) {
      console.error(error);
      setErrorMessage(error.message ?? "Could not load analytics.");
      setSummary(null);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as SubmissionLike[];
    setSummary(computeAnalytics(rows));
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
        className={`rounded-2xl border border-border bg-surface-subtle/80 p-6 sm:p-8 ${className ?? ""}`}
      >
        {children}
      </section>
    );

  if (loading) {
    return shell(
      <>
        {!embedded ? (
          <div className="h-6 w-48 animate-pulse rounded bg-border" />
        ) : null}
        <div
          className={`grid gap-3 sm:grid-cols-3 ${embedded ? "" : "mt-4"}`}
        >
          <div className="h-20 animate-pulse rounded-xl bg-border/50" />
          <div className="h-20 animate-pulse rounded-xl bg-border/40" />
          <div className="h-20 animate-pulse rounded-xl bg-border/30" />
        </div>
      </>,
      embedded ? "space-y-4" : undefined
    );
  }

  if (errorMessage) {
    return shell(
      <>
        {!embedded ? (
          <h2
            id="analytics-heading"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            Your analytics
          </h2>
        ) : null}
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
        {!embedded ? (
          <>
            <h2
              id="analytics-heading"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              Your analytics
            </h2>
            <p className="mt-2 rounded-xl border border-dashed border-border bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
              Submit at least one answer to see averages and charts here.
            </p>
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
            Submit an answer to see your dashboard here.
          </p>
        )}
      </>
    );
  }

  const fmt = (n: number | null) =>
    n === null ? "—" : n.toFixed(1);

  const confParts = Object.entries(summary.confidenceBreakdown).filter(
    ([, n]) => n > 0
  );

  const body = (
    <>
      {!embedded ? (
        <>
          <h2
            id="analytics-heading"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            Your analytics
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Summary across all saved submissions (updates after each successful
            submit).
          </p>
        </>
      ) : null}

      <div className={`grid gap-3 sm:grid-cols-3 ${embedded ? "" : "mt-6"}`}>
        <StatCard label="Submissions" value={String(summary.count)} />
        <StatCard
          label="Avg score"
          value={fmt(summary.avgScore)}
          suffix="/10"
        />
        <StatCard
          label="Avg reasoning"
          value={fmt(summary.avgReasoning)}
          suffix="/10"
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Avg completeness"
          value={fmt(summary.avgCompleteness)}
          suffix="/10"
        />
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Your confidence mix
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {confParts.length === 0 ? (
              <span className="text-sm text-muted-foreground">No data</span>
            ) : (
              confParts.map(([level, n]) => (
                <span
                  key={level}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground"
                >
                  {level}: {n}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Histogram histogram={summary.scoreHistogram} />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Top topics
          </p>
          <ul className="mt-3 space-y-2">
            {summary.topicCounts.slice(0, 6).map(({ topic, count }) => (
              <li
                key={topic}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="truncate text-card-foreground">{topic}</span>
                <span className="tabular-nums text-muted-foreground">
                  {count}×
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );

  return shell(body, embedded ? "space-y-6" : undefined);
}
