import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Página básica para testar no navegador
app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Satoshi Terminal</title>
<style>
  body{background:#0b0b0b;color:#f5f5f5;font-family:system-ui,Arial;padding:24px}
  .card{max-width:720px;margin:0 auto;background:#141414;border-radius:16px;padding:20px;box-shadow:0 8px 30px rgba(0,0,0,.35)}
  h1{margin:0 0 8px;font-size:22px}
  p{margin:0 0 16px;color:#ccc}
  textarea, input, button{width:100%;padding:12px;border-radius:12px;border:1px solid #2a2a2a;background:#101010;color:#f5f5f5}
  textarea{min-height:120px;resize:vertical}
  button{margin-top:12px;background:#f7931a;border:none;font-weight:700;cursor:pointer}
  pre{white-space:pre-wrap;background:#0f0f0f;border-radius:12px;padding:12px;margin-top:12px;border:1px solid #222}
  .row{display:flex;gap:12px}
  .row input{flex:1}
  small{color:#aaa}
</style>
</head>
<body>
  <div class="card">
    <h1>Satoshi Terminal</h1>
    <p>API online. Envie uma mensagem e veja a resposta do modelo.</p>
    <div class="row">
      <input id="model" value="gpt-3.5-turbo-16k" />
      <button id="btn">Send</button>
    </div>
    <textarea id="input" placeholder="Type your prompt...">Hello Satoshi, be bullish about $SATS.</textarea>
    <pre id="out"><small>Waiting...</small></pre>
  </div>
<script>
  const btn = document.getElementById('btn');
  const out = document.getElementById('out');
  btn.onclick = async () => {
    out.textContent = 'Loading...';
    const model = document.getElementById('model').value.trim();
    const input = document.getElementById('input').value;
    try {
      const r = await fetch('/chat', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ input, model })
      });
      const data = await r.json();
      out.textContent = data.output ? data.output : JSON.stringify(data, null, 2);
    } catch (e) {
      out.textContent = String(e);
    }
  };
</script>
</body>
</html>`);
});

// Endpoint de chat
app.post("/chat", async (req, res) => {
  try {
    const userInput = req.body.input || "Hello from Satoshi Terminal";
    const model = (req.body.model || "gpt-3.5-turbo-16k").trim();

    const r = await client.responses.create({
      model,
      input: userInput
    });

    res.json({
      model,
      output: r.output_text
    });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

