"use client";
import { useState } from "react";

type Issue = { title: string; severity: "high" | "medium" | "low"; explanation: string; amount: string | null };
type Research = { question: string; answer: string; sources: { title: string; url: string }[] };
type Result = { company: string; documentType: string; summary: string; issues: Issue[]; research?: Research[] };
type ExitPlan = { letter: string; phoneScript: string; steps: string[] };

const SAMPLE = `Comcast Xfinity - Monthly Statement - October 2026
Account #: 48213-77
Internet 500 Mbps (promo rate ended 09/30)   $89.99
Equipment Rental - Modem/Router              $15.00
Equipment Rental - Modem/Router              $15.00
Network Enhancement Fee                       $6.99
Regulatory Recovery Charge                    $3.49
Paper Bill Fee                                $2.99
Total Due: $133.46

Terms: Service auto-renews for a 24-month term unless canceled in writing 60 days before renewal.
Early termination fee: $240, reduced by $10 per month of service. Cancellation requests must be made by phone during business hours.`;

const colors = {
  high: "border-red-500 bg-red-500/10",
  medium: "border-yellow-500 bg-yellow-500/10",
  low: "border-blue-500 bg-blue-500/10",
};

function money(amount: string | null) {
  if (!amount) return null;
  const a = String(amount);
  return a.startsWith("$") ? a : `$${a}`;
}

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<ExitPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function analyze() {
    setLoading(true);
    setError("");
    setResult(null);
    setPlan(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function getExitPlan() {
    if (!result) return;
    setPlanLoading(true);
    setError("");
    try {
      const res = await fetch("/api/exit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlan(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPlanLoading(false);
    }
  }

  function copyLetter() {
    if (!plan) return;
    navigator.clipboard.writeText(plan.letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold">🚪 Exit Door</h1>
        <p className="text-zinc-400 mt-2">
          Paste a bill, lease, or subscription contract. We&apos;ll find the hidden fees and traps, then get you out.
        </p>

        <textarea
          className="w-full h-56 mt-6 p-3 rounded-lg bg-zinc-900 border border-zinc-700 text-sm"
          placeholder="Paste your bill or contract text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="flex gap-3 mt-3">
          <button
            onClick={analyze}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-emerald-500 text-black font-semibold disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Find the traps"}
          </button>
          <button onClick={() => setText(SAMPLE)} className="px-5 py-2 rounded-lg border border-zinc-700">
            Try a sample bill
          </button>
        </div>

        {error && <p className="mt-4 text-red-400">{error}</p>}

        {result && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold">{result.company}</h2>
            <p className="text-zinc-400 mt-1">{result.summary}</p>

            <div className="mt-4 space-y-3">
              {result.issues.map((issue, i) => (
                <div key={i} className={`border-l-4 rounded-lg p-4 ${colors[issue.severity] ?? colors.low}`}>
                  <div className="flex justify-between font-semibold">
                    <span>{issue.title}</span>
                    {money(issue.amount) && <span>{money(issue.amount)}</span>}
                  </div>
                  <p className="text-sm text-zinc-300 mt-1">{issue.explanation}</p>
                </div>
              ))}
            </div>

            {result.research && result.research.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold">🔎 Real-world check</h3>
                <div className="mt-3 space-y-4">
                  {result.research.map((r, i) => (
                    <div key={i} className="rounded-lg p-4 bg-zinc-900 border border-zinc-700">
                      <p className="font-semibold">{r.question}</p>
                      <p className="text-sm text-zinc-300 mt-1">{r.answer}</p>
                      <ul className="mt-2 text-sm space-y-1">
                        {r.sources.map((s, j) => (
                          <li key={j}>
                            <a href={s.url} target="_blank" className="text-emerald-400 underline">
                              {s.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={getExitPlan}
              disabled={planLoading}
              className="mt-8 w-full py-3 rounded-lg bg-emerald-500 text-black font-bold text-lg disabled:opacity-50"
            >
              {planLoading ? "Building your exit plan..." : "🚪 Get me out"}
            </button>

            {plan && (
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold">✅ Your plan</h3>
                  <p className="text-xs text-zinc-500 mt-1">Always double-check phone numbers and addresses on the company&apos;s official site before sending.</p>
                  <ol className="list-decimal ml-6 mt-2 space-y-1 text-zinc-300">
                    {plan.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">✉️ Letter</h3>
                    <button onClick={copyLetter} className="text-sm px-3 py-1 rounded border border-zinc-700">
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <pre className="mt-2 p-4 rounded-lg bg-zinc-900 border border-zinc-700 text-sm whitespace-pre-wrap font-sans">
                    {plan.letter}
                  </pre>
                </div>

                <div>
                  <h3 className="text-xl font-semibold">📞 Phone script</h3>
                  <pre className="mt-2 p-4 rounded-lg bg-zinc-900 border border-zinc-700 text-sm whitespace-pre-wrap font-sans">
                    {plan.phoneScript}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}