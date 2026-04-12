import type { PersonalizationInput } from "@/lib/validators";

export function buildCharadesPrompt(
  personalization: PersonalizationInput,
  count: number
): string {
  const lines: string[] = [
    `You are writing charades prompts for a speed round. Teams race to guess as many as possible.`,
    "",
    `Generate exactly ${count} unique prompts as a JSON array of strings.`,
    "",
    "- 1–4 words each. Simple, instantly recognizable.",
    "- Each prompt must be solvable with one signature gesture.",
    "- Mix categories: actions, animals, sports, famous characters, objects.",
    "- No book/movie/song titles. Use characters or actions directly.",
    "- No abstract concepts, no obscure references, no duplicates.",
  ];

  if (personalization.isAdult) {
    lines.push(
      "- 18+ mode: Raunchy and suggestive, but still 1–2 common words that people can actually guess."
    );
  }

  if (personalization.language !== "English") {
    const scriptNote =
      personalization.script === "latin"
        ? " in Latin/Roman script"
        : " in native script";
    lines.push(
      `Write in ${personalization.language}${scriptNote}. Use culturally familiar references.`
    );
  }

  lines.push(
    "",
    `Return ONLY a raw JSON array of exactly ${count} strings, starting with [ and ending with ].`
  );

  return lines.join("\n");
}
