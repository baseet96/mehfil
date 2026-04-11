import type { PersonalizationInput } from "@/lib/validators";

function hashInputs(game: string, personalization: PersonalizationInput): string {
  const str = JSON.stringify({ game, ...personalization });
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return `mehfil:deck:${(hash >>> 0).toString(36)}`;
}

export function getCachedDeck(
  game: string,
  personalization: PersonalizationInput
): string[] | null {
  try {
    const key = hashInputs(game, personalization);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (
      Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
    ) {
      return parsed as string[];
    }
    return null;
  } catch {
    return null;
  }
}

export function cacheDeck(
  game: string,
  personalization: PersonalizationInput,
  deck: string[]
): void {
  try {
    const key = hashInputs(game, personalization);
    localStorage.setItem(key, JSON.stringify(deck));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}
