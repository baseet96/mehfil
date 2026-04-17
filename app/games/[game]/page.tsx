"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { games } from "@/lib/games";
import { shuffle } from "@/lib/shuffle";
import { wouldYouRatherDeck } from "@/lib/decks/would-you-rather";
import { mostLikelyToDeck } from "@/lib/decks/most-likely-to";
import { truthOrDareDeck } from "@/lib/decks/truth-or-dare";
import { twoTruthsOneLieDeck } from "@/lib/decks/two-truths-one-lie";
import { charadesDeck } from "@/lib/decks/charades";
import { imposterDeck } from "@/lib/decks/imposter";
import type { PersonalizationInput } from "@/lib/validators";
import { useGenerateDeck } from "@/lib/hooks/use-generate-deck";
import PromptGame from "@/components/PromptGame";
import TruthOrDareGame from "@/components/TruthOrDareGame";
import CharadesGame from "@/components/CharadesGame";
import ImposterGame from "@/components/ImposterGame";
import PersonalizationFlow from "@/components/PersonalizationFlow";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";

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
    case "charades":
      return charadesDeck;
    case "imposter":
      return imposterDeck;
    default:
      return [];
  }
}

const LLM_GAMES = new Set([
  "would-you-rather",
  "most-likely-to",
  "truth-or-dare",
  "two-truths-one-lie",
]);

type GameState = "choose" | "personalizing" | "playing" | "game-over";

export default function GamePage() {
  const params = useParams<{ game: string }>();
  const slug = params.game;
  const supportsLLM = LLM_GAMES.has(slug);

  const staticDeck = useMemo(() => getStaticDeck(slug), [slug]);

  const [gameState, setGameState] = useState<GameState>(() =>
    supportsLLM ? "choose" : "playing"
  );
  const [deck, setDeck] = useState<string[]>(() =>
    supportsLLM ? [] : shuffle(staticDeck)
  );

  const handleDeckReady = useCallback((generated: string[]) => {
    setDeck(shuffle(generated));
    setGameState("playing");
  }, []);

  const { status, error, generate, retry, cancel, reset } = useGenerateDeck({
    game: slug,
    onSuccess: handleDeckReady,
  });

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
    generate({ isAdult: false, language: "English" });
  }

  function handleUseDefault() {
    reset();
    setDeck(shuffle(staticDeck));
    setGameState("playing");
  }

  function handleBackFromError() {
    reset();
    setGameState("choose");
  }

  function handlePlayAgain() {
    reset();
    setDeck([]);
    if (supportsLLM) {
      setGameState("choose");
    } else {
      setDeck(shuffle(staticDeck));
      setGameState("playing");
    }
  }

  if (status === "loading") {
    return (
      <LoadingState
        message="Generating your prompts..."
        onCancel={() => {
          cancel();
          setGameState("choose");
        }}
      />
    );
  }

  if (status === "error" && error) {
    return (
      <ErrorState
        title={error.title}
        message={error.message}
        onRetry={retry}
        onUseDefault={handleUseDefault}
        onBack={handleBackFromError}
      />
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
          <Link
            href="/games"
            className="mt-2 px-4 py-2 text-sm text-foreground/50 transition-colors hover:text-foreground/70"
          >
            &larr; Back
          </Link>
        </div>
      </div>
    );
  }

  if (gameState === "personalizing") {
    return (
      <PersonalizationFlow
        onComplete={(data: PersonalizationInput) => generate(data)}
        onBack={() => setGameState("choose")}
      />
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

  if (slug === "truth-or-dare") {
    return (
      <TruthOrDareGame
        deck={deck}
        gameName={gameInfo.name}
        onGameOver={() => setGameState("game-over")}
      />
    );
  }
  if (slug === "charades") {
    return (
      <CharadesGame
        deck={deck}
        gameName={gameInfo.name}
        onGameOver={() => setGameState("game-over")}
      />
    );
  }
  if (slug === "imposter") {
    return (
      <ImposterGame
        deck={deck}
        gameName={gameInfo.name}
        onGameOver={() => setGameState("game-over")}
      />
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
