import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.5-flash";

let ai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function generateDeck(systemPrompt: string): Promise<unknown> {
  const client = getClient();

  const response = await client.models.generateContent({
    model: MODEL,
    contents: "Generate the deck now.",
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  return JSON.parse(text);
}
