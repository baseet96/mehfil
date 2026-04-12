import type { PersonalizationInput } from "@/lib/validators";

export function buildTruthOrDarePrompt(
  personalization: PersonalizationInput,
  count: number
): string {
  const lines: string[] = [
    `You are writing Truth or Dare prompts for a party game.`,
    "",
    `Generate exactly ${count} unique prompts as a JSON array of strings. Produce roughly half truths and half dares.`,
    "",
    "## Quality bar",
    "",
    "Great truths are genuinely revealing or funny — not surface-level small talk.",
    "Great dares are bold and entertaining but physically safe and doable in a living room.",
    "",
    "## Rules",
    "",
    '- Prefix every item with exactly "TRUTH: " or "DARE: " (these prefixes must always be in English, even if the content is in another language)',
    "- One sentence per prompt",
    "- Truths should probe something people would hesitate to answer honestly",
    "- Dares should be embarrassing or funny, never dangerous",
    "- Cover a wide range of themes — don't cluster around any single topic",
  ];

  if (personalization.isAdult) {
    lines.push(
      "- 18+ Only: Raunchy truths, embarrassing dares. Push boundaries hard but keep dares physically safe."
    );
  }

  if (personalization.language !== "English") {
    const scriptNote =
      personalization.script === "latin"
        ? " in Latin/Roman script"
        : " in native script";
    lines.push(
      `Write the content after the prefix in ${personalization.language}${scriptNote}. Keep "TRUTH: " and "DARE: " prefixes in English. Avoid formal suffixes, honorifics, or stiff conjugations.`
    );
  }

  lines.push(
    "",
    `Return ONLY a raw JSON array of exactly ${count} strings, starting with [ and ending with ].`
  );

  return lines.join("\n");
}
