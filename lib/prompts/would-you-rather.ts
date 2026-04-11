import type { PersonalizationInput } from "@/lib/validators";

export function buildWouldYouRatherPrompt(
  personalization: PersonalizationInput,
  count: number
): string {
  const lines: string[] = [
    `You are writing "Would You Rather" questions.`,
    "",
    `Generate exactly ${count} unique questions as a JSON array of strings.`,
    "",
    "## Quality bar",
    "",
    "A great question is a balanced dilemma — both options equally agonizing or equally amazing. No no-brainers.",
    "Concise, parallel structure, high stakes. One clean sentence, two options.",
    "",
    "## Rules",
    "",
    '- Start each question with "Would you rather..."',
    "- One clean sentence, two parallel options",
    "- Both options must be genuinely equally hard to choose between — if one option is a superpower, the other must be an equally powerful ability or a massive quality-of-life trade-off. High opportunity cost on both sides.",
    "- Cover a wide range of themes — don't cluster around any single topic.",
  ];

  if (personalization.isAdult) {
    lines.push(
      "- 18+ Only: Cards Against Humanity energy. Raunchy, dark, and intentionally uncomfortable."
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
