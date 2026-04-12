import type { PersonalizationInput } from "@/lib/validators";

export function buildMostLikelyToPrompt(
  personalization: PersonalizationInput,
  count: number
): string {
  const lines: string[] = [
    `You are writing "Most Likely To" prompts for a party game.`,
    "",
    `Generate exactly ${count} unique prompts as a JSON array of strings.`,
    "",
    "## Quality bar",
    "",
    "A great prompt is specific enough to spark real debate — not generic compliments or insults.",
    `"Most likely to accidentally set off a fire alarm while cooking" beats "Most likely to be successful."`,
    "",
    "## Rules",
    "",
    '- Start each prompt with "Most likely to"',
    "- One sentence, no question marks",
    "- Specific, vivid scenarios — not vague traits",
    "- Cover a wide range of themes — don't cluster around any single topic",
  ];

  if (personalization.isAdult) {
    lines.push(
      "- 18+ Only: Unhinged, raunchy, dark humor. Cards Against Humanity energy."
    );
  }

  if (personalization.language !== "English") {
    const scriptNote =
      personalization.script === "latin"
        ? " in Latin/Roman script"
        : " in native script";
    lines.push(
      `Write in ${personalization.language}${scriptNote}. Avoid formal suffixes, honorifics, or stiff conjugations.`
    );
  }

  lines.push(
    "",
    `Return ONLY a raw JSON array of exactly ${count} strings, starting with [ and ending with ].`
  );

  return lines.join("\n");
}
