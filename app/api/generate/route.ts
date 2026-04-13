import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limiter";
import { generateDeck } from "@/lib/llm";
import {
  validateGameSlug,
  validateDeckSize,
  validatePersonalization,
  validateDeck,
  type PersonalizationInput,
} from "@/lib/validators";
import { buildWouldYouRatherPrompt } from "@/lib/prompts/would-you-rather";
import { buildMostLikelyToPrompt } from "@/lib/prompts/most-likely-to";
import { buildTruthOrDarePrompt } from "@/lib/prompts/truth-or-dare";
import { buildTwoTruthsOneLiePrompt } from "@/lib/prompts/two-truths-one-lie";
import { buildCharadesPrompt } from "@/lib/prompts/charades";
import { buildImposterPrompt } from "@/lib/prompts/imposter";

export const maxDuration = 30;

const DEFAULT_COUNT = 25;

function getPromptForGame(
  game: string,
  personalization: PersonalizationInput,
  count: number
): string {
  switch (game) {
    case "would-you-rather":
      return buildWouldYouRatherPrompt(personalization, count);
    case "most-likely-to":
      return buildMostLikelyToPrompt(personalization, count);
    case "truth-or-dare":
      return buildTruthOrDarePrompt(personalization, count);
    case "two-truths-one-lie":
      return buildTwoTruthsOneLiePrompt(personalization, count);
    case "charades":
      return buildCharadesPrompt(personalization, count);
    case "imposter":
      return buildImposterPrompt(personalization, count);
    default:
      throw new Error(`No prompt builder for game: ${game}`);
  }
}

export async function POST(request: Request) {
  // 1. Rate limit
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    const minutes = Math.ceil((rateCheck.retryAfterSeconds ?? 3600) / 60);
    return NextResponse.json(
      {
        code: "rate_limited",
        error: `Too many requests. Try again in ~${minutes} minute${minutes === 1 ? "" : "s"}.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateCheck.retryAfterSeconds ?? 3600),
        },
      }
    );
  }

  // 2. Parse and validate input
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: "Request body must be an object" },
      { status: 400 }
    );
  }

  const { game, personalization, count } = body as Record<string, unknown>;

  if (!validateGameSlug(game)) {
    return NextResponse.json(
      { error: "Invalid game slug" },
      { status: 400 }
    );
  }

  const deckSize = count === undefined ? DEFAULT_COUNT : count;
  if (!validateDeckSize(deckSize)) {
    return NextResponse.json(
      { error: "count must be an integer between 1 and 30" },
      { status: 400 }
    );
  }

  const persResult = validatePersonalization(personalization);
  if (!persResult.valid) {
    return NextResponse.json(
      { error: persResult.error },
      { status: 400 }
    );
  }

  // 3. Build prompt
  let systemPrompt: string;
  try {
    systemPrompt = getPromptForGame(game, persResult.data, deckSize);
  } catch {
    return NextResponse.json(
      { error: "Game not yet supported for generation" },
      { status: 400 }
    );
  }

  // 4. Call LLM + validate (with one retry)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await generateDeck(systemPrompt);
      const deckResult = validateDeck(raw, deckSize);

      if (deckResult.valid) {
        return NextResponse.json({ deck: deckResult.deck });
      }

      console.error(`[generate] Attempt ${attempt + 1} validation failed for ${game}:`, deckResult.error);

      // First attempt failed validation — retry once
      if (attempt === 0) {
        continue;
      }

      return NextResponse.json(
        {
          code: "generation_failed",
          error: "AI generated unexpected content. Please try again.",
        },
        { status: 502 }
      );
    } catch (err) {
      console.error(`[generate] Attempt ${attempt + 1} error for ${game}:`, err instanceof Error ? err.message : err);

      if (attempt === 1) {
        return NextResponse.json(
          {
            code: "generation_failed",
            error: "Couldn't reach the AI service. Please try again later.",
          },
          { status: 502 }
        );
      }
    }
  }

  return NextResponse.json(
    {
      code: "generation_failed",
      error: "Something went wrong generating content. Please try again.",
    },
    { status: 502 }
  );
}
