import OpenAI from "openai";
import { tavily } from "@tavily/core";
import { NextResponse } from "next/server";
export const maxDuration = 60;

const client = new OpenAI({
  apiKey: process.env.NEBIUS_API_KEY,
  baseURL: process.env.NEBIUS_BASE_URL,
});

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY! });

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

// Tavily: look up real cancellation steps and fee complaints for the company
async function realWorldCheck(company: string) {
  if (!company || company === "Unknown") return [];
  try {
    const queries = [
      `how to cancel ${company} service`,
      `${company} hidden fees complaints refund`,
    ];
    const searches = await Promise.all(
      queries.map((q) => tvly.search(q, { maxResults: 3, includeAnswer: true }))
    );
    return searches.map((s, i) => ({
      question: i === 0 ? "How to cancel" : "What others are saying about fees",
      answer: s.answer ?? "",
      sources: s.results.map((r) => ({ title: r.title, url: r.url })),
    }));
  } catch (err) {
    console.error("Tavily failed:", err);
    return [];
  }
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
    const analysis = extractJson(reply);
    const research = await realWorldCheck(analysis.company);
    return NextResponse.json({ ...analysis, research });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Analysis failed. Check the terminal for details." }, { status: 500 });
  }
}