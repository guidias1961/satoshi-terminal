import express from "express";
import fetch from "node-fetch";
import { RateLimiterMemory } from "rate-limiter-flexible";
import sirv from "sirv";

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(express.json({ limit: "1mb" }));
app.use(sirv("public", { dev: process.env.NODE_ENV !== "production" }));

// Basic rate limit: 30 requests per 5 minutes per IP
const limiter = new RateLimiterMemory({ points: 30, duration: 300 });
app.use(async (req, res, next) => {
  try { await limiter.consume(req.ip); next(); }
  catch { res.status(429).json({ error: "Too many requests" }); }
});

// AI endpoint
app.post("/api/ai", async (req, res) => {
  try {
    if (!OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY missing" });
    const { prompt = "", history = [] } = req.body || {};

    const recent = Array.isArray(history)
      ? history.slice(-10).map((c, i) => ({
          role: i % 2 ? "assistant" : "user",
          content: String(c).slice(0, 600)
        }))
      : [];

    const system = `You are SATOSHI TERMINAL, a bold, aggressive, relentlessly bullish AI persona of the $SATS token on BSC.
Speak concisely, with sharp hype, short punchlines, and occasional cyberpunk flair.
Priorities: 1) be engaging and confident 2) highlight $SATS and its mission 3) avoid financial advice.
Never apologize for being bullish. Never mention you are an AI model.`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.8,
        messages: [
          { role: "system", content: system },
          ...recent,
          { role: "user", content: prompt }
        ]
      })
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(500).json({ error: "OpenAI error", detail: txt });
    }
    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "…";
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message || "server error" });
  }
});

// Health
app.get("/healthz", (_, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Satoshi Terminal running on :${PORT}`));

