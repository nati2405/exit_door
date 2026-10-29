# 🚪 Exit Door

**Find what you're overpaying for, then walk out the door.**

Exit Door reads any bill, lease, or subscription contract and finds the hidden fees, duplicate charges, auto-renewal traps, and cancellation hurdles buried in it. It checks the company against the real world, then writes you a ready-to-send dispute/cancellation letter, a phone script for when they push back, and a step-by-step exit plan.

🔗 **Live demo:** https://exit-door.vercel.app
🎥 **Demo video:** https://youtu.be/qHcalz9XZ2g
🏁 **Track:** Best Apps and Agents — Nebius x NVIDIA Global AI Hackathon

---

## The problem

Everyone gets hit by junk fees, surprise renewals, and contracts designed to be hard to leave. Most people never read the fine print, and even when they notice something wrong, they don't know what to say or who to contact. Companies count on that.

## What it does

1. **Find the traps** — Paste a bill or contract. NVIDIA Nemotron flags every issue (hidden fees, duplicate charges, auto-renewals, early termination fees, unfair clauses) with a severity level and dollar amount.
2. **Real-world check** — Tavily searches the live web for the company's actual cancellation process and what other customers are saying about its fees, with source links.
3. **Get me out** — One click and Nemotron combines the analysis and research into:
   - A step-by-step exit plan
   - A firm, specific dispute/cancellation letter (one-click copy)
   - A phone script, including what to say when they offer a retention deal

## How it uses NVIDIA + Nebius

| Piece | What it does |
|---|---|
| **NVIDIA Nemotron 3 Super** (`nvidia/nemotron-3-super-120b-a12b`) | Reasons over the document to find and rank issues, then writes the letter, script, and plan |
| **Nebius Token Factory** | Serves Nemotron through its OpenAI-compatible API. Every analysis and exit plan is a live runtime call to Token Factory |
| **Tavily** | Live web search for cancellation steps and fee complaints, fed back into Nemotron for the exit plan |

Nemotron is a reasoning model, so Exit Door strips any thinking output and parses structured JSON from the reply. That keeps the UI clean and reliable.

**Where Token Factory helped:** we didn't have to host a 120B model ourselves. Switching from a typical OpenAI setup was just a base URL and model ID change, which let us go from idea to working app quickly.

## Tech stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- OpenAI SDK pointed at Nebius Token Factory
- `@tavily/core` for search
- Deployed on Vercel

## Run it locally

**Requirements:** Node.js 18+, a Nebius Token Factory API key, and a Tavily API key.

```bash
git clone https://github.com/nati2405/exit_door.git
cd exit_door
npm install
```

Create a `.env.local` file in the project root:

```
NEBIUS_API_KEY=your_token_factory_key
NEBIUS_MODEL=nvidia/nemotron-3-super-120b-a12b
NEBIUS_BASE_URL=https://api.tokenfactory.nebius.com/v1/
TAVILY_API_KEY=your_tavily_key
```

Start the app:

```bash
npm run dev
```

Open http://localhost:3000, click **Try a sample bill**, then **Find the traps**, then **🚪 Get me out**.

## Project structure

```
app/
  page.tsx              # The whole UI
  api/analyze/route.ts  # Nemotron analysis + Tavily real-world check
  api/exit/route.ts     # Nemotron exit plan: letter, phone script, steps
```

## Disclaimer

Exit Door is not legal or financial advice. Always double-check phone numbers and addresses on the company's official site before sending anything.

## License

MIT