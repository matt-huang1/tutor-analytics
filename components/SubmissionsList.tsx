"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ERROR_TYPE_LABELS,
  type ErrorTypeId,
} from "../lib/diagnostics";
import { supabase } from "../lib/supabase";

type SubmissionRow = {
  id: string;
  question: string;
  answer: string;
  score?: number | null;
  topic?: string | null;
  subtopic?: string | null;
  strengths?: string[] | null;
  misconceptions?: string[] | null;
  missing_concepts?: string[] | null;
  suggested_next_step?: string | null;
  /** User-reported */
  student_confidence?: "low" | "medium" | "high" | null;
  /** Legacy */
  confidence_estimate?: "low" | "medium" | "high" | null;
  reasoning_quality?: number | null;
  answer_completeness?: number | null;
  error_types?: string[] | null;
  created_at?: string;
};

function renderTagList(items: string[] | null | undefined, emptyLabel: string) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function formatShortDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function errorTypeLabel(id: string): string {
  if (id in ERROR_TYPE_LABELS) {
    return ERROR_TYPE_LABELS[id as ErrorTypeId];
  }
  return id.replace(/_/g, " ");
}

export default function SubmissionsList() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchSubmissions = useCallback(async (silent?: boolean) => {
    if (!silent) setLoading(true);
    setErrorMessage("");
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setErrorMessage(error.message ?? "Failed to fetch submissions.");
      setSubmissions([]);
    } else {
      setSubmissions((data as SubmissionRow[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchSubmissions(false);
    });
  }, [fetchSubmissions]);

  useEffect(() => {
    function onRefresh() {
      void fetchSubmissions(true);
    }
    window.addEventListener("submissions:refresh", onRefresh);
    return () => window.removeEventListener("submissions:refresh", onRefresh);
  }, [fetchSubmissions]);

  if (loading) {
    return (
      <section aria-busy="true" aria-label="Loading submissions">
        <div className="h-5 w-40 animate-pulse rounded bg-border" />
        <div className="mt-4 space-y-3">
          <div className="h-16 animate-pulse rounded-xl bg-border/60" />
          <div className="h-16 animate-pulse rounded-xl bg-border/40" />
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="submissions-heading">
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id="submissions-heading"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          Past submissions
        </h2>
        <span className="text-xs text-muted-foreground">
          {submissions.length}{" "}
          {submissions.length === 1 ? "item" : "items"}
        </span>
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      )}

      {!errorMessage && submissions.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-card/50 px-4 py-8 text-center text-sm text-muted-foreground">
          Nothing here yet. Submit a question and answer above.
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {submissions.map((item) => {
          const userConf =
            item.student_confidence ?? item.confidence_estimate ?? null;
          const errors = Array.isArray(item.error_types)
            ? item.error_types
            : [];
          const dateStr = formatShortDate(item.created_at);

          return (
            <li key={item.id}>
              <details className="group rounded-xl border border-border bg-card shadow-sm">
                <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
                  <span
                    className="mt-1.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
                    aria-hidden
                  >
                    ▸
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-card-foreground">
                      {item.question}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-md bg-surface-subtle px-2 py-0.5 font-semibold text-card-foreground">
                        {item.score ?? "—"}/10
                      </span>
                      <span className="truncate">
                        {item.topic ?? "Topic"}
                        {item.subtopic ? ` · ${item.subtopic}` : ""}
                      </span>
                      {dateStr ? <span>{dateStr}</span> : null}
                      {userConf ? (
                        <span className="rounded-md border border-border px-2 py-0.5">
                          You: {userConf}
                        </span>
                      ) : null}
                    </div>
                    {errors.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {errors.slice(0, 3).map((id) => (
                          <span
                            key={id}
                            className="rounded-full bg-background px-2 py-0.5 text-[11px] text-foreground ring-1 ring-border"
                          >
                            {errorTypeLabel(id)}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </summary>

                <div className="border-t border-border px-4 pb-4 pt-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Question
                  </p>
                  <p className="mt-1 text-sm text-card-foreground">{item.question}</p>

                  <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Your answer
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.answer}
                  </p>

                  <div className="mt-4 rounded-lg border border-border bg-surface-subtle p-4">
                    <div className="flex flex-wrap gap-2 text-xs">
                      {errors.length > 0 ? (
                        <div className="w-full">
                          <p className="font-medium uppercase tracking-wide text-muted-foreground">
                            Issue patterns (AI)
                          </p>
                          <ul className="mt-2 flex flex-wrap gap-2">
                            {errors.map((id) => (
                              <li
                                key={id}
                                className="rounded-full border border-border bg-background px-2.5 py-1 text-foreground"
                              >
                                {errorTypeLabel(id)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          No issue pattern tags for this row (older submission).
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Scores (AI)
                      </span>
                      <span className="rounded-md bg-background px-2 py-1 text-sm font-semibold">
                        Overall {item.score ?? "—"}/10
                      </span>
                      <span className="text-sm text-card-foreground">
                        Reasoning {item.reasoning_quality ?? "—"}/10
                      </span>
                      <span className="text-sm text-card-foreground">
                        Completeness {item.answer_completeness ?? "—"}/10
                      </span>
                      {userConf ? (
                        <span className="text-sm text-muted-foreground">
                          Your confidence (before feedback): {userConf}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-4 text-sm text-card-foreground">
                      <span className="font-medium text-muted-foreground">
                        Topic:{" "}
                      </span>
                      {item.topic ?? "N/A"}
                      {item.subtopic ? ` / ${item.subtopic}` : ""}
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Strengths
                        </p>
                        {renderTagList(
                          item.strengths,
                          "No strengths listed."
                        )}
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Misconceptions
                        </p>
                        {renderTagList(
                          item.misconceptions,
                          "None listed."
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Missing concepts
                      </p>
                      {renderTagList(
                        item.missing_concepts,
                        "None listed."
                      )}
                    </div>

                    <div className="mt-4">
                      <p className="font-medium text-muted-foreground">
                        Suggested next step
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-card-foreground">
                        {item.suggested_next_step ?? "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
