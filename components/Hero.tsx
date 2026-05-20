"use client";

import { useRef, useState } from "react";
import FeedbackPanel, { type FeedbackResult } from "./FeedbackPanel";

type ConfidenceLevel = "low" | "medium" | "high" | "";

type FeedbackPayload = FeedbackResult & {
  topic?: string | null;
  subtopic?: string | null;
  student_confidence?: string;
  error?: string;
  details?: string;
};

export default function Hero() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [studentConfidence, setStudentConfidence] =
    useState<ConfidenceLevel>("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedbackResult, setFeedbackResult] = useState<FeedbackResult | null>(null);
  const submittingRef = useRef(false);

  async function handleSubmit() {
    if (submittingRef.current) return;
    submittingRef.current = true;

    setLoading(true);
    setFormError("");
    setFeedbackResult(null);

    if (!studentConfidence) {
      setFormError('Choose how confident you felt before seeing feedback ("low", "medium", or "high").');
      submittingRef.current = false;
      setLoading(false);
      return;
    }

    try {
      const submissionId = crypto.randomUUID();
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          answer,
          student_confidence: studentConfidence,
          submission_id: submissionId,
        }),
      });

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        setFormError(
          "The server sent a response we could not read. Please try again."
        );
        return;
      }

      const payload = data as FeedbackPayload;

      if (!res.ok) {
        const base =
          typeof payload.error === "string" ? payload.error : "Request failed";
        const extra =
          typeof payload.details === "string" && payload.details.length > 0
            ? ` ${payload.details}`
            : "";
        setFormError(`${base}${extra}`.trim());
        return;
      }

      setFeedbackResult(payload);
      setQuestion("");
      setAnswer("");
      setStudentConfidence("");
      if (typeof window !== "undefined") {
        queueMicrotask(() => {
          window.dispatchEvent(new CustomEvent("submissions:refresh"));
        });
      }
    } catch (err) {
      console.error(err);
      setFormError(
        "Something went wrong. Check your connection and try again."
      );
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <section
      aria-labelledby="submit-heading"
      className="rounded-2xl border border-border bg-card p-6 shadow-md transition-all duration-200 hover:shadow-lg sm:p-8"
    >
      <h2
        id="submit-heading"
        className="text-xl font-semibold tracking-tight text-foreground"
      >
        New submission
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Rate how confident you feel when you submit your answer.
      </p>

      <div className="mt-6 space-y-6">
        <div className="border-l-2 border-border pl-4">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-accent">
            Step 1
          </span>
          <label
            htmlFor="question"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Question
          </label>
          <input
            id="question"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-shadow focus:border-ring focus:ring-2 focus:ring-ring/20"
            placeholder="e.g. Explain photosynthesis"
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              if (formError) setFormError("");
              if (feedbackResult) setFeedbackResult(null);
            }}
          />
        </div>

        <div className="border-l-2 border-border pl-4">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-accent">
            Step 2
          </span>
          <label
            htmlFor="answer"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Your answer
          </label>
          <textarea
            id="answer"
            rows={4}
            className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-shadow focus:border-ring focus:ring-2 focus:ring-ring/20"
            placeholder="Type your response here…"
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              if (formError) setFormError("");
              if (feedbackResult) setFeedbackResult(null);
            }}
          />
        </div>

        <div className="border-l-2 border-border pl-4">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-accent">
            Step 3
          </span>
          <label
            htmlFor="confidence"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Your confidence
          </label>
          <select
            id="confidence"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-shadow focus:border-ring focus:ring-2 focus:ring-ring/20"
            value={studentConfidence}
            onChange={(e) => {
              setStudentConfidence(e.target.value as ConfidenceLevel);
              if (formError) setFormError("");
              if (feedbackResult) setFeedbackResult(null);
            }}
          >
            <option value="">Select…</option>
            <option value="low">Low — unsure or guessing</option>
            <option value="medium">Medium — partly sure</option>
            <option value="high">High — fairly sure</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition-all duration-200 hover:scale-[1.02] hover:opacity-90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-sm"
        >
          {loading ? "Submitting…" : "Submit & get feedback"}
        </button>

        {formError ? (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </p>
        ) : null}

        {feedbackResult ? (
          <div className="mt-4">
            <FeedbackPanel
              result={feedbackResult}
              onDismiss={() => setFeedbackResult(null)}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
