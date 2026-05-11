import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `
You are an expert STEM tutor.

Evaluate the student's answer carefully.

Be concise but specific.

Scoring rubric:
1-2 = fundamentally incorrect
3-4 = partially correct with major gaps
5-6 = mostly correct but incomplete
7-8 = strong answer with minor omissions
9-10 = excellent, accurate, clear answer

Classify the question into a concise academic topic.

Return ONLY valid JSON in this exact format:

{
  "score": number,
  "topic": "topic name",
  "correctness": "short explanation",
  "clarity": "short explanation",
  "improvement": "specific improvement advice"
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

    return Response.json(parsed);
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