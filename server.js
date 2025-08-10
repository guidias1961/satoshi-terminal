import express from "express";
import fetch from "node-fetch";
import { RateLimiterMemory } from "rate-limiter-flexible";
import sirv from "sirv";

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

app.use(express.json({ limit: "1mb" }));
app.use(sirv("public", { dev: process.env.NODE_ENV !== "production" }));

// rate limit básico
const limiter = new RateLimiterMemory({ points: 30, duration: 300 });
app.use(async (req, res, next) => {
  try { await limiter.consume(req.ip); next(); }
  catch { res.status(429).json({ error: "Too many requests" }); }
});

// healthcheck para Railway
app.get("/healthz", (req, res) => {
  res.status(200).json({
    ok: true,
    hasKey: !!OPENAI_API_KEY,
    time: new Date().toISOString()
  });
});

// AI endpoint
app.post("/api/ai", async (req, res) => {
  try {
    if (!OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY missing" });
    const { prompt = "", history = [] } = req.body || {};

    const recent = Array.isArray(history)
      ? history.slice(-10).map((c, i) => ({ role: i % 2 ? "assistant" : "user", content: String(c).slice(0, 600) }))
      : [];

    const system = `You are SATOSHI TERMINAL, a bold, aggressive, relentlessly bullish persona for $SATS on BSC. Be concise, hype, confident. No financial advice.`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        temperature: 0.8,
        messages: [{ role: "system", content: system }, ...recent, { role: "user", content: prompt }]
      })
    });

    if (!r.ok) {
      const txt = await r.text();
      console.error("OpenAI error:", txt);
      return res.status(500).json({ error: "OpenAI error", detail: txt });
    }
    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "…";
    res.json({ reply });
  } catch (e) {
    console.error("AI endpoint error:", e);
    res.status(500).json({ error: e.message || "server error" });
  }
});

// raiz responde algo para o health default
app.get("/", (req, res) => res.sendFile(process.cwd() + "/public/index.html"));

app.listen(PORT, HOST, () => {
  console.log(`Satoshi Terminal running on http://${HOST}:${PORT}`);
  console.log(`Key present: ${OPENAI_API_KEY ? "yes" : "no"}`);
});

