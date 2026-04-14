import type { PersonalizationInput } from "@/lib/validators";

export function buildImposterPrompt(
  personalization: PersonalizationInput,
  count: number
): string {
  const lines: string[] = [
    `You are generating secret words for the party game "Imposter." One player is the imposter and must bluff — everyone else knows the word.`,
    "",
    `Generate exactly ${count} unique words or short phrases as a JSON array of strings.`,
    "",
    "- 1 word each. Concrete nouns, places, activities, or experiences.",
    "- Easy to describe in conversation but hard for someone who doesn't know the word to fake.",
    "- Mix categories: food, animals, places, objects, activities, occupations, experiences.",
    "- No abstract concepts, no proper nouns, no brand names, no duplicates.",
    "- Each word should be universally familiar to the group.",
  ];

  if (personalization.isAdult) {
    lines.push(
      "- 18+ mode: Include edgy, suggestive, or taboo-adjacent words. Still concrete and describable."
    );
  }

  if (personalization.language !== "English") {
    const scriptNote =
      personalization.script === "latin"
        ? " in Latin/Roman script"
        : " in native script";
    lines.push(
      `Write in ${personalization.language}${scriptNote}. Use words that are culturally familiar to ${personalization.language} speakers.`
    );
  }

  lines.push(
    "",
    `Return ONLY a raw JSON array of exactly ${count} strings, starting with [ and ending with ].`
  );

  return lines.join("\n");
}
