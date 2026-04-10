"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { games } from "@/lib/games";
import { shuffle } from "@/lib/shuffle";
import { wouldYouRatherDeck } from "@/lib/decks/would-you-rather";
import PromptGame from "@/components/PromptGame";

function getDeckForGame(slug: string): string[] {
  switch (slug) {
    case "would-you-rather":
      return wouldYouRatherDeck;
    default:
      return [];
  }
}

export default function GamePage() {
  const params = useParams<{ game: string }>();
  const [gameState, setGameState] = useState<"playing" | "game-over">(
    "playing"
  );
  const [shuffleKey, setShuffleKey] = useState(0);

  const gameInfo = games.find(
    (g) => g.slug === params.game && g.available
  );

  const deck = useMemo(
    () => shuffle(getDeckForGame(params.game)),
    [params.game, shuffleKey]
  );

  if (!gameInfo || deck.length === 0) {
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

  if (gameState === "game-over") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-4xl font-bold">Game Over!</h1>
        <p className="text-lg text-foreground/60">
          You went through {deck.length} prompts
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              setShuffleKey((k) => k + 1);
              setGameState("playing");
            }}
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
