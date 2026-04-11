export interface PersonalizationInput {
  isAdult: boolean;
  language: string;
  script?: "native" | "latin";
  country?: string;
  city?: string;
  vibe: string;
  groupDescription?: string;
}

const VALID_GAMES = [
  "would-you-rather",
  "most-likely-to",
  "truth-or-dare",
  "two-truths-one-lie",
] as const;

export type GameSlug = (typeof VALID_GAMES)[number];

const MAX_TEXT_LENGTH = 500;
const MAX_DECK_SIZE = 30;

export function validateGameSlug(slug: unknown): slug is GameSlug {
  return (
    typeof slug === "string" &&
    VALID_GAMES.includes(slug as GameSlug)
  );
}

export function validateDeckSize(count: unknown): count is number {
  return (
    typeof count === "number" &&
    Number.isInteger(count) &&
    count >= 1 &&
    count <= MAX_DECK_SIZE
  );
}

export function validatePersonalization(
  input: unknown
): { valid: true; data: PersonalizationInput } | { valid: false; error: string } {
  if (typeof input !== "object" || input === null) {
    return { valid: false, error: "Personalization must be an object" };
  }

  const obj = input as Record<string, unknown>;

  if (typeof obj.isAdult !== "boolean") {
    return { valid: false, error: "isAdult must be a boolean" };
  }
  if (
    typeof obj.language !== "string" ||
    obj.language.length === 0 ||
    obj.language.length > 50
  ) {
    return { valid: false, error: "language must be a non-empty string under 50 chars" };
  }
  if (
    obj.script !== undefined &&
    obj.script !== "native" &&
    obj.script !== "latin"
  ) {
    return { valid: false, error: "script must be 'native' or 'latin' if provided" };
  }
  if (
    obj.country !== undefined &&
    (typeof obj.country !== "string" || obj.country.length > 100)
  ) {
    return { valid: false, error: "country must be a string under 100 chars" };
  }
  if (
    obj.city !== undefined &&
    (typeof obj.city !== "string" || obj.city.length > 100)
  ) {
    return { valid: false, error: "city must be a string under 100 chars" };
  }
  if (
    typeof obj.vibe !== "string" ||
    obj.vibe.length === 0 ||
    obj.vibe.length > 100
  ) {
    return { valid: false, error: "vibe must be a non-empty string under 100 chars" };
  }
  if (
    obj.groupDescription !== undefined &&
    (typeof obj.groupDescription !== "string" ||
      obj.groupDescription.length > MAX_TEXT_LENGTH)
  ) {
    return {
      valid: false,
      error: `groupDescription must be under ${MAX_TEXT_LENGTH} chars`,
    };
  }

  return {
    valid: true,
    data: {
      isAdult: obj.isAdult,
      language: obj.language.trim(),
      script: obj.script as "native" | "latin" | undefined,
      country: typeof obj.country === "string" ? obj.country.trim() : undefined,
      city: typeof obj.city === "string" ? obj.city.trim() : undefined,
      vibe: obj.vibe.trim(),
      groupDescription:
        typeof obj.groupDescription === "string"
          ? obj.groupDescription.trim()
          : undefined,
    },
  };
}

export function validateDeck(
  raw: unknown,
  expectedCount: number
): { valid: true; deck: string[] } | { valid: false; error: string } {
  if (!Array.isArray(raw)) {
    return { valid: false, error: "Response is not an array" };
  }

  if (raw.length < expectedCount) {
    return {
      valid: false,
      error: `Expected ${expectedCount} items, got ${raw.length}`,
    };
  }

  const items = raw.slice(0, expectedCount);

  for (let i = 0; i < items.length; i++) {
    if (typeof items[i] !== "string") {
      return { valid: false, error: `Item at index ${i} is not a string` };
    }
    if ((items[i] as string).trim().length === 0) {
      return { valid: false, error: `Item at index ${i} is empty` };
    }
  }

  const seen = new Set<string>();
  for (const item of items) {
    const normalized = (item as string).toLowerCase().trim();
    if (seen.has(normalized)) {
      return { valid: false, error: `Duplicate item found` };
    }
    seen.add(normalized);
  }

  return { valid: true, deck: items as string[] };
}
