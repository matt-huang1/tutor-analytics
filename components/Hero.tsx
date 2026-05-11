"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Hero() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer }),
      });

      const data = await res.json();

      const { error } = await supabase.from("submissions").insert([
        {
          question,
          answer,
          topic: data.topic,
          score: data.score,
          correctness: data.correctness,
          clarity: data.clarity,
          improvement: data.improvement,
        },
      ]);

      if (error) {
        console.error(error);
        alert("Error saving");
      } else {
        alert("Saved with AI feedback!");
        setQuestion("");
        setAnswer("");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }

    setLoading(false);
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
        Ask a question and paste your answer. We&apos;ll return feedback and
        save it to your list below.
      </p>

      <div className="mt-6 space-y-4">
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
            onChange={(e) => setQuestion(e.target.value)}
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
            onChange={(e) => setAnswer(e.target.value)}
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
      </div>
    </section>
  );
}
