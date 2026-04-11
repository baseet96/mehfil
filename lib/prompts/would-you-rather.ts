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
    "Great questions are SHORT, punchy, and split the room. Both options must be equally hard to pick. If one answer is obviously better, the question fails.",
    "",
    "These are the kind of quality to aim for (DO NOT copy these — create entirely new ones):",
    '- "Would you rather always have to sing instead of speak or always have to dance instead of walk?"',
    '- "Would you rather have a rewind button for your life or a pause button?"',
    '- "Would you rather be the funniest person in the room or the smartest?"',
    "",
    "Avoid questions like these:",
    '- "Would you rather lose all your photos forever and never be able to take any new ones or lose all your music..." (too long and wordy)',
    '- "Would you rather be rich but have no friends or be poor but..." (one answer is obviously better)',
    "",
    "## Rules",
    "",
    '- Start each question with "Would you rather..."',
    "- Keep questions to ONE short sentence — if it needs a comma or explanation, it's too long",
    "- Both options must be genuinely hard to choose between",
    "- Vary the style — don't repeat the same pattern back to back",
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
  const hasGroup = personalization.groupDescription && personalization.groupDescription.length > 0;

  if (hasLocation || personalization.vibe || hasGroup) {
    lines.push("", "## About the group");

    if (hasLocation) {
      const location = personalization.city
        ? `${personalization.city}, ${personalization.country}`
        : personalization.country;
      lines.push(`- From ${location}`);
    }

    lines.push(`- Vibe: ${personalization.vibe}`);

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
