import { readFileSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";
import { buildWouldYouRatherPrompt } from "../lib/prompts/would-you-rather";
import { validateDeck, type PersonalizationInput } from "../lib/validators";

const env = readFileSync(".env", "utf8");
const apiKey = env.match(/^GEMINI_API_KEY\s*=\s*(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");
if (!apiKey) throw new Error("GEMINI_API_KEY not found in .env");

const ai = new GoogleGenAI({ apiKey });
const COUNT = 25;

async function generate(model: string, systemPrompt: string) {
  const start = Date.now();
  const response = await ai.models.generateContent({
    model,
    contents: "Generate the deck now.",
    config: { systemInstruction: systemPrompt, responseMimeType: "application/json" },
  });
  const ms = Date.now() - start;
  const text = response.text;
  if (!text) throw new Error(`${model}: empty response`);
  const raw = JSON.parse(text);
  const validation = validateDeck(raw, COUNT);
  return {
    ms,
    valid: validation.valid,
    deck: validation.valid ? validation.deck : (Array.isArray(raw) ? raw : []),
    error: validation.valid ? null : validation.error,
  };
}

async function runCase(label: string, personalization: PersonalizationInput) {
  const systemPrompt = buildWouldYouRatherPrompt(personalization, COUNT);
  console.log(`\n${"=".repeat(80)}\n${label}\n${"=".repeat(80)}`);

  const [flash, lite] = await Promise.all([
    generate("gemini-2.5-flash", systemPrompt),
    generate("gemini-2.5-flash-lite", systemPrompt),
  ]);

  for (const [name, r] of [["gemini-2.5-flash", flash], ["gemini-2.5-flash-lite", lite]] as const) {
    console.log(`\n--- ${name}  |  ${r.ms}ms  |  ${r.valid ? "valid" : `INVALID: ${r.error}`} ---`);
    r.deck.forEach((q, i) => console.log(`${String(i + 1).padStart(2)}. ${q}`));
  }
}

(async () => {
  await runCase("BASELINE: WYR, English, 18+ off", { isAdult: false, language: "English" });
  await runCase("CULTURAL: WYR, Urdu (native script), 18+ on", { isAdult: true, language: "Urdu", script: "latin" });
})();
