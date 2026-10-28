import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.NEBIUS_API_KEY,
  baseURL: process.env.NEBIUS_BASE_URL,
});

const PROMPT = `You are Exit Door, a consumer advocate that reviews bills, leases, and subscription contracts.
Find anything that costs the user money or locks them in: hidden or junk fees, duplicate charges, price increases, auto-renewals, early termination fees, cancellation hurdles, and unfair clauses.
Reply with ONLY valid JSON in this exact shape:
{
  "company": "company name or Unknown",
  "documentType": "bill | lease | subscription | contract | other",
  "summary": "one or two plain-English sentences",
  "issues": [
    { "title": "short name", "severity": "high | medium | low", "explanation": "what it is and why it matters, in plain English", "amount": "dollar amount or null" }
  ]
}`;

// Nemotron is a reasoning model, so strip any thinking text and grab the JSON
function extractJson(text: string) {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in model reply");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || text.trim().length < 20) {
      return NextResponse.json({ error: "Paste a bill or contract first." }, { status: 400 });
    }

    const completion = await client.chat.completions.create({
      model: process.env.NEBIUS_MODEL!,
      temperature: 0.2,
      max_tokens: 4000,
      messages: [
        { role: "system", content: PROMPT },
        { role: "user", content: text.slice(0, 20000) },
      ],
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json(extractJson(reply));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Analysis failed. Check the terminal for details." }, { status: 500 });
  }
}