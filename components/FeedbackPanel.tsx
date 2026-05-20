"use client";

import { ERROR_TYPE_LABELS, type ErrorTypeId } from "../lib/diagnostics";
import { errorTypeClasses, formatMathText, scoreClasses } from "../lib/format";

export type FeedbackResult = {
  score?: number | null;
  topic?: string | null;
  subtopic?: string | null;
  suggested_next_step?: string | null;
  error_types?: string[] | null;
  strengths?: string[] | null;
  misconceptions?: string[] | null;
  missing_concepts?: string[] | null;
  reasoning_quality?: number | null;
  answer_completeness?: number | null;
};

function errorTypeLabel(id: string): string {
  if (id in ERROR_TYPE_LABELS) return ERROR_TYPE_LABELS[id as ErrorTypeId];
  return id.replace(/_/g, " ");
}

export default function FeedbackPanel({
  result,
  onDismiss,
}: {
  result: FeedbackResult;
  onDismiss: () => void;
}) {
  const errors = Array.isArray(result.error_types) ? result.error_types : [];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-accent/20 bg-accent-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
            AI evaluation complete
          </span>
          <span className={`rounded-md border px-2 py-1 text-sm font-semibold ${scoreClasses(result.score)}`}>
            {result.score ?? "—"}/10
          </span>
          {result.topic ? (
            <span className="text-xs text-muted-foreground">
              {result.topic}
              {result.subtopic ? ` › ${result.subtopic}` : ""}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss feedback"
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
        >
          ✕
        </button>
      </div>

      {errors.length > 0 ? (
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Issue patterns
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {errors.map((id) => (
              <span
                key={id}
                className={`rounded-full border px-2.5 py-0.5 text-xs ${errorTypeClasses(id)}`}
              >
                {errorTypeLabel(id)}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {result.suggested_next_step ? (
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Next step
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {formatMathText(result.suggested_next_step)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
