import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import {
  ERROR_TYPE_IDS,
  isConfidenceLevel,
  sanitizeDiagnostics,
} from "../../../lib/diagnostics";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ERROR_TYPES_LIST = ERROR_TYPE_IDS.join(", ");

const SYSTEM_PROMPT = `
You are an expert STEM tutor producing structured educational diagnostics.

Output ONLY valid JSON. No markdown, no prose outside JSON, no code fences.

Signals:
- **Student (user)**: self-reported confidence is given in the user message — never invent student feelings.
- **Model (AI)**: scores, lists, suggested_next_step, error_types — your analysis only.

Scoring rubrics (use consistently):

**score (1–10) overall answer quality**
- 1–2: Wrong core idea or dominant misconception.
- 3–4: Partially relevant; major gaps.
- 5–6: Mostly sound; missing key steps or depth.
- 7–8: Strong; minor omissions.
- 9–10: Excellent — accurate, clear, fully addresses the prompt.
**10 means**: correct for the question scope, coherent reasoning, no material gaps.

**reasoning_quality (1–10)** — logic, justification, use of principles.
**10 means**: explicit reasoning chain; correct principles; no unjustified leaps.

**answer_completeness (1–10)** — all parts of the question addressed with enough detail.
**10 means**: every sub-question or requirement covered.

**error_types** — Pick 1–3 primary issue patterns from this closed set ONLY (use exact ids):
${ERROR_TYPES_LIST}

Definitions:
- conceptual_misunderstanding: wrong or mixed-up core idea or principle.
- calculation_error: arithmetic/symbol manipulation slip when procedure was otherwise known.
- misread_question: answered a different question or missed a key constraint.
- partial_knowledge: some correct pieces but incomplete coverage or depth.
- guessing: little supporting reasoning; shot-in-the-dark tone or inconsistent claims.
- logic_breakdown: steps don’t follow; internal contradiction or non sequitur.

**suggested_next_step** — 3–6 sentences: concrete practice, what to review (named concepts), success criteria. Tie to error_types and topic.

Lists (strengths, misconceptions, missing_concepts): max 3 short items each.

Example JSON:

{
  "score": 6,
  "topic": "Physics",
  "subtopic": "Newton's laws",
  "strengths": ["Identified relevant forces"],
  "misconceptions": ["Mixed mass and weight"],
  "missing_concepts": ["Free-body diagrams"],
  "suggested_next_step": "Draw a labeled free-body diagram first. Then write ΣF = ma along each axis you need. Check that friction opposes motion. Success: you can explain each arrow without contradicting Newton's third law.",
  "reasoning_quality": 5,
  "answer_completeness": 6,
  "error_types": ["conceptual_misunderstanding", "logic_breakdown"]
}

Return this exact JSON shape:

{
  "score": number,
  "topic": "string",
  "subtopic": "string",
  "strengths": ["string"],
  "misconceptions": ["string"],
  "missing_concepts": ["string"],
  "suggested_next_step": "string",
  "reasoning_quality": number,
  "answer_completeness": number,
  "error_types": ["string"]
}
`.trim();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question, answer, student_confidence, submission_id } = body;

    if (!question || !answer) {
      return Response.json(
        { error: "Missing question or answer" },
        { status: 400 }
      );
    }

    if (!isConfidenceLevel(student_confidence)) {
      return Response.json(
        {
          error:
            'Please choose how confident you felt ("low", "medium", or "high").',
        },
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
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Student self-reported confidence (before AI feedback): ${student_confidence}

Question:
${question}

Student answer:
${answer}`,
        },
      ],
    });

    const raw = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(raw);
    const diagnostics = sanitizeDiagnostics(parsed);

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { error: insertError } = await supabase.from("submissions").upsert(
      [
        {
          submission_id: typeof submission_id === "string" ? submission_id : null,
          question,
          answer,
          score: diagnostics.score,
          topic: diagnostics.topic,
          subtopic: diagnostics.subtopic,
          strengths: diagnostics.strengths,
          misconceptions: diagnostics.misconceptions,
          missing_concepts: diagnostics.missing_concepts,
          suggested_next_step: diagnostics.suggested_next_step,
          reasoning_quality: diagnostics.reasoning_quality,
          answer_completeness: diagnostics.answer_completeness,
          error_types: diagnostics.error_types,
          student_confidence,
        },
      ],
      { onConflict: "submission_id", ignoreDuplicates: true }
    );

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

    return Response.json({
      ...diagnostics,
      student_confidence,
    });
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
