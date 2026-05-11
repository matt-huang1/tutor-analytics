"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type SubmissionRow = {
  id: string;
  question: string;
  answer: string;
  feedback?: string | null;
  score?: number | null;
  topic?: string | null;
  correctness?: string | null;
  clarity?: string | null;
  improvement?: string | null;
  created_at?: string;
};

export default function SubmissionsList() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error(error);
        setErrorMessage(error.message ?? "Failed to fetch submissions.");
        setSubmissions([]);
      } else {
        setErrorMessage("");
        setSubmissions((data as SubmissionRow[]) ?? []);
      }
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section aria-busy="true" aria-label="Loading submissions">
        <div className="h-5 w-40 animate-pulse rounded bg-border" />
        <div className="mt-4 space-y-3">
          <div className="h-24 animate-pulse rounded-xl bg-border/60" />
          <div className="h-24 animate-pulse rounded-xl bg-border/40" />
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

      <ul className="mt-4 space-y-3">
        {submissions.map((item) => (
          <li key={item.id}>
            <article className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Question
              </p>
              <p className="mt-1 text-sm font-medium text-card-foreground">
                {item.question}
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Your answer
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </p>
              {(item.score != null ||
                item.topic ||
                item.correctness ||
                item.clarity ||
                item.improvement) && (
                <div className="mt-4 space-y-2 rounded-lg border border-border bg-surface-subtle px-3 py-3 text-sm">
                  {item.score != null && (
                    <p className="text-card-foreground">
                      <span className="font-medium text-muted-foreground">
                        Score:{" "}
                      </span>
                      {item.score}/10
                    </p>
                  )}
                  {item.topic ? (
                    <p className="text-card-foreground">
                      <span className="font-medium text-muted-foreground">
                        Topic:{" "}
                      </span>
                      {item.topic}
                    </p>
                  ) : null}
                  {item.correctness ? (
                    <p className="text-card-foreground">
                      <span className="font-medium text-muted-foreground">
                        Correctness:{" "}
                      </span>
                      {item.correctness}
                    </p>
                  ) : null}
                  {item.clarity ? (
                    <p className="text-card-foreground">
                      <span className="font-medium text-muted-foreground">
                        Clarity:{" "}
                      </span>
                      {item.clarity}
                    </p>
                  ) : null}
                  {item.improvement ? (
                    <p className="text-card-foreground">
                      <span className="font-medium text-muted-foreground">
                        Improvement:{" "}
                      </span>
                      {item.improvement}
                    </p>
                  ) : null}
                </div>
              )}
              {item.feedback ? (
                <div className="mt-4 rounded-lg border border-border bg-surface-subtle px-3 py-2.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    AI feedback
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-card-foreground">
                    {item.feedback}
                  </p>
                </div>
              ) : null}
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
