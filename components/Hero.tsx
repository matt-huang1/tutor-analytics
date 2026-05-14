"use client";

import { useState } from "react";

type ConfidenceLevel = "low" | "medium" | "high" | "";

type FeedbackPayload = {
  score?: number;
  topic?: string;
  subtopic?: string;
  student_confidence?: string;
};

export default function Hero() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [studentConfidence, setStudentConfidence] =
    useState<ConfidenceLevel>("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  async function handleSubmit() {
    if (loading) return;

    setLoading(true);
    setFormError("");
    setFormSuccess("");

    if (!studentConfidence) {
      setFormError('Choose how confident you felt before seeing feedback ("low", "medium", or "high").');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          answer,
          student_confidence: studentConfidence,
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

      const payload = data as {
        error?: string;
        details?: string;
      } & FeedbackPayload;

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

      const topic = typeof payload.topic === "string" ? payload.topic : "—";
      const subtopic =
        typeof payload.subtopic === "string" && payload.subtopic.length > 0
          ? payload.subtopic
          : null;
      const score =
        typeof payload.score === "number" && Number.isFinite(payload.score)
          ? payload.score
          : "—";

      setFormSuccess(
        subtopic
          ? `Saved. Score: ${score}/10 · ${topic} › ${subtopic}`
          : `Saved. Score: ${score}/10 · ${topic}`
      );
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
      setLoading(false);
    }
  }

  return (
    <section
      aria-labelledby="submit-heading"
      className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <h2
        id="submit-heading"
        className="text-lg font-semibold tracking-tight text-card-foreground"
      >
        New submission
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Rate how confident you felt <em>before</em> feedback, then submit your
        answer. We save diagnostics and update your analytics below.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="confidence"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Your confidence (before feedback)
          </label>
          <select
            id="confidence"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-ring/0 transition-shadow focus:border-ring focus:ring-2 focus:ring-ring/20"
            value={studentConfidence}
            onChange={(e) => {
              setStudentConfidence(e.target.value as ConfidenceLevel);
              if (formError) setFormError("");
              if (formSuccess) setFormSuccess("");
            }}
          >
            <option value="">Select…</option>
            <option value="low">Low — unsure or guessing</option>
            <option value="medium">Medium — partly sure</option>
            <option value="high">High — fairly sure</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="question"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Question
          </label>
          <input
            id="question"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-ring/0 transition-shadow focus:border-ring focus:ring-2 focus:ring-ring/20"
            placeholder="e.g. Explain photosynthesis"
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              if (formError) setFormError("");
              if (formSuccess) setFormSuccess("");
            }}
          />
        </div>
        <div>
          <label
            htmlFor="answer"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Your answer
          </label>
          <textarea
            id="answer"
            rows={4}
            className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-ring/0 transition-shadow focus:border-ring focus:ring-2 focus:ring-ring/20"
            placeholder="Type your response here…"
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              if (formError) setFormError("");
              if (formSuccess) setFormSuccess("");
            }}
          />
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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

        {formSuccess ? (
          <p
            aria-live="polite"
            className="mt-3 rounded-lg border border-border bg-surface-subtle px-3 py-2 text-sm text-card-foreground"
          >
            {formSuccess}
          </p>
        ) : null}
      </div>
    </section>
  );
}
