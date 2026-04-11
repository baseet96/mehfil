import type { PersonalizationInput } from "@/lib/validators";

export function buildWouldYouRatherPrompt(
  personalization: PersonalizationInput,
  count: number
): string {
  const lines: string[] = [
    `You are writing "Would You Rather" questions for a party game.`,
    "",
    `Generate exactly ${count} unique questions as a JSON array of strings.`,
    "",
    "## Quality bar",
    "",
    "Study these examples closely — this is the EXACT quality, length, and style to match. DO NOT copy them, but generate new questions that feel like they belong in this same list:",
    "",
    '- "Would you rather always have to sing instead of speak or always have to dance instead of walk?"',
    '- "Would you rather be able to talk to animals or speak every human language fluently?"',
    '- "Would you rather always know when someone is lying or always get away with lying?"',
    '- "Would you rather have a rewind button for your life or a pause button?"',
    '- "Would you rather know how you die or know when you die?"',
    '- "Would you rather be the funniest person in the room or the smartest?"',
    '- "Would you rather have a photographic memory or be able to forget anything on command?"',
    '- "Would you rather explore deep space or explore the deep ocean?"',
    '- "Would you rather give up your phone for a month or give up your bed for a month?"',
    '- "Would you rather have one wish granted today or three wishes granted in ten years?"',
    "",
    "What makes these work: short, clean, parallel structure, both options equally appealing, instantly makes you think.",
    "",
    "## Rules",
    "",
    '- Start each question with "Would you rather..."',
    "- Match the length and style of the examples above — one clean sentence, two parallel options",
    "- Both options must be genuinely equally hard to choose between",
    "- Vary the themes — superpowers, lifestyle, social, moral, silly, hypothetical",
    "- No offensive, discriminatory, or harmful content",
  ];

  if (personalization.isAdult) {
    lines.push(
      "- Adults only (18+) — mildly spicy or cheeky is fine, nothing explicit or offensive"
    );
  } else {
    lines.push(
      "- Group includes minors — keep it family-friendly, lean into silly and imaginative"
    );
  }

  const hasLocation = personalization.country && personalization.country.length > 0;
  const hasVibe = personalization.vibe && personalization.vibe.length > 0;
  const hasGroup = personalization.groupDescription && personalization.groupDescription.length > 0;

  if (hasLocation || hasVibe || hasGroup) {
    lines.push("", "## About the group");

    if (hasLocation) {
      const location = personalization.city
        ? `${personalization.city}, ${personalization.country}`
        : personalization.country;
      lines.push(`- From ${location}`);
    }

    if (hasVibe) {
      lines.push(`- Vibe: ${personalization.vibe}`);
    }

    if (hasGroup) {
      lines.push(
        `- ${personalization.groupDescription}`,
        "- Work these details into some questions naturally — but keep them short. Not every question needs to be personalized."
      );
    }
  }

  if (personalization.language !== "English") {
    const scriptNote =
      personalization.script === "latin"
        ? " in Latin/Roman script"
        : " in native script";
    lines.push(
      "",
      `Write in ${personalization.language}${scriptNote}. Use casual, conversational tone — the way friends actually talk, not formal or textbook.`
    );
  }

  lines.push(
    "",
    `JSON array of exactly ${count} strings. No markdown, no explanation.`
  );

  return lines.join("\n");
}
