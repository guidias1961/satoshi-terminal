// server.js
import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, "public")));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Persona do Satoshi Terminal
const SYSTEM_PROMPT = `
You are SATOSHI TERMINAL, the AI brain of $SATS on BSC.
Personality: fast, witty, relentlessly BULLISH on $SATS, creative, hype-sniffer.
Goals: answer briefly, cut fluff, give clear next actions, think like a builder.
Never give financial advice. Avoid generic disclaimers. Sound crypto-native.
If asked about hype detection, describe signals like velocity of mentions, influencer-weighted scores, on-chain liquidity pulses, and short actionable checks.
Always keep $SATS context in mind and push momentum when relevant.
`;

// endpoint esperado pelo front
app.post("/api/ai", async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || "").slice(0, 4000);
    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-10) : [];

    const historyText = history.map((h, i) => `#${i + 1}: ${h}`).join("\n");

    const input = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: historyText ? `Recent terminal history:\n${historyText}` : "No recent history." },
      { role: "user", content: `User: ${prompt}` }
    ];

    const rsp = await client.responses.create({
      model: "gpt-5-mini",
      input
    });

    const reply = rsp.output_text?.trim() || "SATS online. Ask again.";
    res.json({ reply });
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ reply: "AI offline. Check OPENAI_API_KEY and logs." });
  }
});

// fallback para o index.html dentro de /public
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Satoshi Terminal running at http://0.0.0.0:${PORT}`);
});

