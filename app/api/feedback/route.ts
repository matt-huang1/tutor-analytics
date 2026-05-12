import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { sanitizeDiagnostics } from "../../../lib/diagnostics";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question, answer } = body;

    if (!question || !answer) {
      return Response.json(
        { error: "Missing question or answer" },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return Response.json(
        {
          error:
            "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.",
        },
        { status: 500 }
      );
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are an expert STEM tutor.
Return concise, diagnostic feedback that is educationally useful.

Rules:
- Output ONLY valid JSON. No markdown, no prose, no code fences.
- Keep each list short (1-3 items) and actionable.
- Use confidence_estimate as one of: "low", "medium", "high".
- Use integer scores from 1 to 10 for score, reasoning_quality, and answer_completeness.

Return this exact JSON shape:

{
  "score": number,
  "topic": "string",
  "subtopic": "string",
  "strengths": ["string"],
  "misconceptions": ["string"],
  "missing_concepts": ["string"],
  "suggested_next_step": "string",
  "confidence_estimate": "low" | "medium" | "high",
  "reasoning_quality": number,
  "answer_completeness": number
}
`,
        },
        {
          role: "user",
          content: `Question: ${question}\nAnswer: ${answer}`,
        },
      ],
    });

    const raw = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(raw);
    const diagnostics = sanitizeDiagnostics(parsed);

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { error: insertError } = await supabase.from("submissions").insert([
      {
        question,
        answer,
        score: diagnostics.score,
        topic: diagnostics.topic,
        subtopic: diagnostics.subtopic,
        strengths: diagnostics.strengths,
        misconceptions: diagnostics.misconceptions,
        missing_concepts: diagnostics.missing_concepts,
        suggested_next_step: diagnostics.suggested_next_step,
        confidence_estimate: diagnostics.confidence_estimate,
        reasoning_quality: diagnostics.reasoning_quality,
        answer_completeness: diagnostics.answer_completeness,
      },
    ]);

    if (insertError) {
      console.error("SUPABASE INSERT ERROR:", insertError);
      return Response.json(
        {
          error: "Failed to save submission.",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    return Response.json(diagnostics);
  } catch (err: unknown) {
    console.error("API ERROR:", err);
    const message =
      err instanceof Error ? err.message : "Unknown error";

    return Response.json(
      { error: "Server error", details: message },
      { status: 500 }
    );
  }
}