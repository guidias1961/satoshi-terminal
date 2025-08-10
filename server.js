import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/chat", async (req, res) => {
  try {
    const userInput = req.body.input || "Hello from Satoshi Terminal";

    const response = await client.responses.create({
      model: "gpt-3.5-turbo-16k",
      input: userInput
    });

    res.json({
      model: "gpt-3.5-turbo-16k",
      output: response.output_text
    });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

