import OpenAI from "openai";
import { NextResponse } from "next/server";
export const maxDuration = 60;

const client = new OpenAI({
  apiKey: process.env.NEBIUS_API_KEY,
  baseURL: process.env.NEBIUS_BASE_URL,
});

const PROMPT = `You are Exit Door, a consumer advocate. Using the bill analysis and real-world research provided, help the user dispute the bad charges and/or cancel.
Be firm, polite, and specific. Use [Your Name] and [Account Number] as placeholders. Write in plain text only, no markdown, no asterisks.
Reply with ONLY valid JSON in this exact shape:
{
  "letter": "a complete dispute and/or cancellation letter",
  "phoneScript": "what to say on the phone, including what to say if they push back or offer a retention deal",
  "steps": ["short step 1", "short step 2", "..."]
}`;

function extractJson(text: string) {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in model reply");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function POST(req: Request) {
  try {
    const analysis = await req.json();
    const completion = await client.chat.completions.create({
      model: process.env.NEBIUS_MODEL!,
      temperature: 0.3,
      max_tokens: 5000,
      messages: [
        { role: "system", content: PROMPT },
        { role: "user", content: JSON.stringify(analysis) },
      ],
    });
    const reply = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json(extractJson(reply));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Couldn't build your exit plan." }, { status: 500 });
  }
}