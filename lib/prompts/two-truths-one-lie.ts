import type { PersonalizationInput } from "@/lib/validators";

export function buildTwoTruthsOneLiePrompt(
  personalization: PersonalizationInput,
  count: number
): string {
  const lines: string[] = [
    `You are writing topic prompts for a "Two Truths and a Lie" party game.`,
    "",
    `Generate exactly ${count} unique topic prompts as a JSON array of strings.`,
    "",
    "## Quality bar",
    "",
    "A great topic is specific enough to be interesting but broad enough that anyone can play.",
    `"Tell two truths and a lie about your relationship with money" beats "Tell two truths and a lie about something."`,
    "",
    "## Rules",
    "",
    '- Start each prompt with "Tell two truths and a lie about"',
    "- Topic only — do not generate the actual truths or lies",
    "- One sentence each",
    "- Cover a wide range of themes — don't cluster around any single topic",
  ];

  if (personalization.isAdult) {
    lines.push(
      "- 18+ Only: Provocative, personal, borderline uncomfortable topics. Push into dating, embarrassing moments, wild stories."
    );
  }

  if (personalization.language !== "English") {
    const scriptNote =
      personalization.script === "latin"
        ? " in Latin/Roman script"
        : " in native script";
    lines.push(
      `Write entirely in ${personalization.language}${scriptNote}, including the "Tell two truths and a lie about" prefix. Avoid formal suffixes, honorifics, or stiff conjugations.`
    );
  }

  lines.push(
    "",
    `Return ONLY a raw JSON array of exactly ${count} strings, starting with [ and ending with ].`
  );

  return lines.join("\n");
}
