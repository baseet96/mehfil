"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { games } from "@/lib/games";
import { shuffle } from "@/lib/shuffle";
import { wouldYouRatherDeck } from "@/lib/decks/would-you-rather";
import { mostLikelyToDeck } from "@/lib/decks/most-likely-to";
import { truthOrDareDeck } from "@/lib/decks/truth-or-dare";
import { twoTruthsOneLieDeck } from "@/lib/decks/two-truths-one-lie";
import { getCachedDeck, cacheDeck } from "@/lib/storage";
import type { PersonalizationInput } from "@/lib/validators";
import PromptGame from "@/components/PromptGame";
import PersonalizationFlow from "@/components/PersonalizationFlow";

function getStaticDeck(slug: string): string[] {
  switch (slug) {
    case "would-you-rather":
      return wouldYouRatherDeck;
    case "most-likely-to":
      return mostLikelyToDeck;
    case "truth-or-dare":
      return truthOrDareDeck;
    case "two-truths-one-lie":
      return twoTruthsOneLieDeck;
    default:
      return [];
  }
}

const LLM_GAMES = new Set(["would-you-rather"]);

type GameState =
  | "age-gate"
  | "choose"
  | "personalizing"
  | "loading"
  | "playing"
  | "game-over";

export default function GamePage() {
  const params = useParams<{ game: string }>();
  const slug = params.game;
  const needsAgeGate = slug === "truth-or-dare";
  const supportsLLM = LLM_GAMES.has(slug);

  const staticDeck = useMemo(() => getStaticDeck(slug), [slug]);

  const [gameState, setGameState] = useState<GameState>(() => {
    if (needsAgeGate) return "age-gate";
    if (supportsLLM) return "choose";
    return "playing";
  });
  const [deck, setDeck] = useState<string[]>(() =>
    supportsLLM ? [] : shuffle(staticDeck)
  );

  const gameInfo = games.find((g) => g.slug === slug && g.available);

  if (!gameInfo || staticDeck.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-xl font-medium">Game not found</p>
        <Link
          href="/games"
          className="rounded-full bg-foreground px-6 py-2 text-background transition-opacity hover:opacity-90"
        >
          Back to Games
        </Link>
      </div>
    );
  }

  function handleQuickStart() {
    setDeck(shuffle(staticDeck));
    setGameState("playing");
  }

  async function handlePersonalized(data: PersonalizationInput) {
    const cached = getCachedDeck(slug, data);
    if (cached) {
      setDeck(shuffle(cached));
      setGameState("playing");
      return;
    }

    setGameState("loading");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: slug, personalization: data, count: 25 }),
      });

      if (!res.ok) {
        const body: { error?: string } | null = await res
          .json()
          .catch(() => null);
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }

      const { deck: generated }: { deck: string[] } = await res.json();
      cacheDeck(slug, data, generated);
      setDeck(shuffle(generated));
      setGameState("playing");
    } catch {
      setDeck(shuffle(staticDeck));
      setGameState("playing");
    }
  }

  function handlePlayAgain() {
    if (supportsLLM) {
      setDeck([]);
      setGameState("choose");
    } else {
      setDeck(shuffle(staticDeck));
      setGameState(needsAgeGate ? "age-gate" : "playing");
    }
  }

  if (gameState === "age-gate") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="text-5xl">{"\uD83D\uDD1E"}</span>
        <h1 className="text-2xl font-bold">Is everyone 18+?</h1>
        <p className="text-foreground/60">
          This game may include mature prompts. Make sure everyone playing is
          comfortable.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setGameState("playing")}
            className="cursor-pointer rounded-full bg-foreground px-8 py-3 text-lg font-medium text-background transition-opacity hover:opacity-90"
          >
            Yes, we are all 18+
          </button>
          <Link
            href="/games"
            className="rounded-full border border-foreground/20 px-8 py-3 text-lg font-medium transition-colors hover:bg-foreground/5"
          >
            Back to Games
          </Link>
        </div>
      </div>
    );
  }

  if (gameState === "choose") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="text-5xl">{gameInfo.emoji}</span>
        <h1 className="text-2xl font-bold">{gameInfo.name}</h1>
        <p className="text-foreground/60">How do you want to play?</p>
        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            onClick={handleQuickStart}
            className="cursor-pointer rounded-full bg-foreground px-8 py-3 text-lg font-medium text-background transition-opacity hover:opacity-90"
          >
            Quick Start
          </button>
          <button
            onClick={() => setGameState("personalizing")}
            className="cursor-pointer rounded-full border border-foreground/20 px-8 py-3 text-lg font-medium transition-colors hover:bg-foreground/5"
          >
            Personalize
          </button>
        </div>
      </div>
    );
  }

  if (gameState === "personalizing") {
    return <PersonalizationFlow onComplete={handlePersonalized} />;
  }

  if (gameState === "loading") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
        <p className="text-lg text-foreground/60">
          Generating your prompts...
        </p>
      </div>
    );
  }

  if (gameState === "game-over") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-4xl font-bold">Game Over!</h1>
        <p className="text-lg text-foreground/60">
          You went through {deck.length} prompts
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handlePlayAgain}
            className="cursor-pointer rounded-full bg-foreground px-8 py-3 text-lg font-medium text-background transition-opacity hover:opacity-90"
          >
            Play Again
          </button>
          <Link
            href="/games"
            className="rounded-full border border-foreground/20 px-8 py-3 text-lg font-medium transition-colors hover:bg-foreground/5"
          >
            Back to Games
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PromptGame
      deck={deck}
      gameName={gameInfo.name}
      onGameOver={() => setGameState("game-over")}
    />
  );
}
