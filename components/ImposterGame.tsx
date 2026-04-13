"use client";

import { useState } from "react";
import Link from "next/link";
import { shuffle } from "@/lib/shuffle";
import { getCachedDeck, cacheDeck } from "@/lib/storage";
import type { PersonalizationInput } from "@/lib/validators";
import PersonalizationFlow from "@/components/PersonalizationFlow";
import Toast from "@/components/Toast";

interface ImposterGameProps {
  deck: string[];
  gameName: string;
  onGameOver: () => void;
}

type Phase =
  | "setup"
  | "choose-deck"
  | "personalizing"
  | "loading"
  | "reveal"
  | "discuss"
  | "result"
  | "who-called-it"
  | "scoreboard"
  | "done";

const GAME_SLUG = "imposter";
const MIN_PLAYERS = 3;

export default function ImposterGame({
  deck: staticDeck,
  gameName,
}: ImposterGameProps) {
  const [players, setPlayers] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [imposterCount, setImposterCount] = useState(1);

  const [phase, setPhase] = useState<Phase>("setup");
  const [wordDeck, setWordDeck] = useState<string[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [word, setWord] = useState("");
  const [imposterIndices, setImposterIndices] = useState<Set<number>>(
    new Set()
  );
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [activeReveal, setActiveReveal] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [round, setRound] = useState(1);
  const [toast, setToast] = useState<string | null>(null);

  function addPlayer() {
    const name = nameInput.trim();
    if (name && !players.includes(name)) {
      setPlayers([...players, name]);
      setNameInput("");
    }
  }

  function removePlayer(index: number) {
    setPlayers(players.filter((_, i) => i !== index));
  }

  function startRound(deck: string[], idx: number, playerList: string[]) {
    const currentWord = deck[idx % deck.length];
    setWord(currentWord);

    const impCount = Math.min(imposterCount, playerList.length - 1);
    const indices = new Set<number>();
    const shuffledIndices = shuffle(playerList.map((_, i) => i));
    for (let i = 0; i < impCount; i++) {
      indices.add(shuffledIndices[i]);
    }
    setImposterIndices(indices);
    setRevealed(new Set());
    setActiveReveal(null);
    setPhase("reveal");
  }

  function startWithDeck(d: string[]) {
    const shuffled = shuffle(d);
    setWordDeck(shuffled);
    setWordIndex(0);
    const initial: Record<string, number> = {};
    for (const p of players) initial[p] = 0;
    setScores(initial);
    startRound(shuffled, 0, players);
  }

  async function handleGenerate(data: PersonalizationInput) {
    setToast(null);
    const cached = getCachedDeck(GAME_SLUG, data);
    if (cached) {
      startWithDeck(cached);
      return;
    }
    setPhase("loading");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: GAME_SLUG,
          personalization: data,
          count: 25,
        }),
      });
      if (!res.ok) {
        const body: { code?: string; error?: string } | null = await res
          .json()
          .catch(() => null);
        throw new Error(
          body?.code === "rate_limited"
            ? (body?.error ?? "Too many requests. Try again later.")
            : "Couldn't personalize — using default words instead."
        );
      }
      const { deck: generated }: { deck: string[] } = await res.json();
      cacheDeck(GAME_SLUG, data, generated);
      startWithDeck(generated);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Couldn't personalize — using default words instead.";
      setToast(message);
      startWithDeck(staticDeck);
    }
  }

  function handleQuickStart() {
    handleGenerate({ isAdult: false, language: "English" });
  }

  function handleWhoCalled(playerName: string) {
    setScores((prev) => ({
      ...prev,
      [playerName]: (prev[playerName] || 0) + 1,
    }));
    setPhase("scoreboard");
  }

  function handleEscaped() {
    setScores((prev) => {
      const next = { ...prev };
      players.forEach((p, i) => {
        if (imposterIndices.has(i)) next[p] = (next[p] || 0) + 2;
      });
      return next;
    });
    setPhase("scoreboard");
  }

  function handleNextRound() {
    const nextIdx = wordIndex + 1;
    setWordIndex(nextIdx);
    setRound((r) => r + 1);
    startRound(wordDeck, nextIdx, players);
  }

  function handlePlayAgain() {
    setPhase("setup");
    setPlayers([]);
    setNameInput("");
    setWordDeck([]);
    setWordIndex(0);
    setWord("");
    setImposterIndices(new Set());
    setRevealed(new Set());
    setActiveReveal(null);
    setScores({});
    setRound(1);
    setToast(null);
  }

  function sortedPlayers() {
    return [...players].sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
  }

  // --- Done screen ---
  if (phase === "done") {
    const sorted = sortedPlayers();
    const topScore = scores[sorted[0]] || 0;
    const winners = sorted.filter((p) => (scores[p] || 0) === topScore);
    const winnerText =
      winners.length > 1 ? "It\u2019s a Tie!" : `${winners[0]} Wins!`;

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-4xl font-bold">{winnerText}</h1>
        <p className="text-foreground/50">
          {round - 1} round{round - 1 !== 1 ? "s" : ""} played
        </p>
        <div className="flex flex-col items-center gap-1">
          {sorted.map((p) => (
            <p key={p} className="text-xl">
              <span className={winners.includes(p) ? "font-bold" : ""}>
                {p}
              </span>
              : {scores[p] || 0}
            </p>
          ))}
        </div>
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

  // --- Setup screen ---
  if (phase === "setup") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
        <h1 className="text-xl font-bold">{gameName}</h1>

        <div className="flex w-full max-w-xs flex-col gap-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Player name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPlayer()}
              className="flex-1 rounded-xl border border-foreground/15 bg-transparent px-4 py-3 text-lg outline-none focus:border-foreground/40"
            />
            <button
              onClick={addPlayer}
              disabled={!nameInput.trim() || players.includes(nameInput.trim())}
              className="cursor-pointer rounded-xl bg-foreground px-4 py-3 text-lg font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add
            </button>
          </div>

          {players.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {players.map((p, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 rounded-full border border-foreground/15 px-3 py-1 text-sm"
                >
                  {p}
                  <button
                    onClick={() => removePlayer(i)}
                    className="cursor-pointer text-foreground/40 hover:text-foreground/70"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-foreground/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/50">
                {players.length} player{players.length !== 1 ? "s" : ""}
                {players.length < MIN_PLAYERS
                  ? ` \u2014 need at least ${MIN_PLAYERS}`
                  : ""}
              </span>
              {players.length >= MIN_PLAYERS && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground/50">Imposters:</span>
                  <select
                    value={Math.min(imposterCount, players.length - 1)}
                    onChange={(e) => setImposterCount(Number(e.target.value))}
                    className="rounded-lg border border-foreground/15 bg-transparent px-2 py-1 text-sm outline-none focus:border-foreground/40"
                  >
                    {Array.from({ length: players.length - 1 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setPhase("choose-deck")}
            disabled={players.length < MIN_PLAYERS}
            className="cursor-pointer rounded-full bg-foreground px-8 py-3 text-lg font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start Game
          </button>
          <Link
            href="/games"
            className="text-center text-sm text-foreground/50 transition-colors hover:text-foreground/70"
          >
            &larr; Back
          </Link>
        </div>

        <div />
      </div>
    );
  }

  // --- Choose deck screen ---
  if (phase === "choose-deck") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="text-5xl">{"\uD83D\uDD75\uFE0F"}</span>
        <h1 className="text-2xl font-bold">{gameName}</h1>
        <p className="text-foreground/60">How do you want to play?</p>
        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            onClick={handleQuickStart}
            className="cursor-pointer rounded-full bg-foreground px-8 py-3 text-lg font-medium text-background transition-opacity hover:opacity-90"
          >
            Quick Start
          </button>
          <button
            onClick={() => setPhase("personalizing")}
            className="cursor-pointer rounded-full border border-foreground/20 px-8 py-3 text-lg font-medium transition-colors hover:bg-foreground/5"
          >
            Personalize
          </button>
          <button
            onClick={() => setPhase("setup")}
            className="mt-2 text-sm text-foreground/50 transition-colors hover:text-foreground/70"
          >
            &larr; Back
          </button>
        </div>
      </div>
    );
  }

  // --- Personalizing ---
  if (phase === "personalizing") {
    return (
      <PersonalizationFlow
        onComplete={handleGenerate}
        onBack={() => setPhase("choose-deck")}
      />
    );
  }

  // --- Loading ---
  if (phase === "loading") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
        <p className="text-lg text-foreground/60">Generating words...</p>
        <button
          onClick={() => setPhase("choose-deck")}
          className="mt-4 text-sm text-foreground/50 transition-colors hover:text-foreground/70"
        >
          Cancel
        </button>
      </div>
    );
  }

  // --- Reveal phase (active: showing a player their role) ---
  if (phase === "reveal" && activeReveal !== null) {
    const isImposter = imposterIndices.has(activeReveal);
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-lg text-foreground/50">{players[activeReveal]}</p>
        {isImposter ? (
          <>
            <h1 className="text-4xl font-bold text-red-500">IMPOSTER</h1>
            <p className="text-foreground/50">
              You don&apos;t know the word. Bluff!
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-foreground/40">The word is</p>
            <h1 className="text-4xl font-bold">{word}</h1>
          </>
        )}
        <button
          onClick={() => {
            setRevealed(new Set([...revealed, activeReveal]));
            setActiveReveal(null);
          }}
          className="mt-4 cursor-pointer rounded-full bg-foreground px-8 py-3 text-lg font-medium text-background transition-opacity hover:opacity-90"
        >
          Got It
        </button>
      </div>
    );
  }

  // --- Reveal phase (list: tap name to see role) ---
  if (phase === "reveal") {
    const allRevealed = revealed.size === players.length;
    return (
      <div className="flex flex-1 flex-col items-center justify-between px-6 py-12">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xl font-bold">Round {round}</h1>
          <p className="text-sm text-foreground/50">
            Tap your name to see your role
          </p>
        </div>

        <div className="flex w-full max-w-xs flex-col gap-2">
          {players.map((p, i) => (
            <button
              key={i}
              onClick={() => !revealed.has(i) && setActiveReveal(i)}
              disabled={revealed.has(i)}
              className={`cursor-pointer rounded-xl border px-4 py-3 text-lg font-medium transition-colors ${
                revealed.has(i)
                  ? "border-foreground/10 text-foreground/30"
                  : "border-foreground/20 hover:bg-foreground/5"
              }`}
            >
              {p}
              {revealed.has(i) ? " \u2713" : ""}
            </button>
          ))}
        </div>

        <div>
          {allRevealed ? (
            <button
              onClick={() => setPhase("discuss")}
              className="cursor-pointer rounded-full bg-foreground px-8 py-3 text-lg font-medium text-background transition-opacity hover:opacity-90"
            >
              Everyone&apos;s Ready
            </button>
          ) : (
            <p className="text-sm text-foreground/30">
              {revealed.size}/{players.length} viewed
            </p>
          )}
        </div>
      </div>
    );
  }

  // --- Discuss phase ---
  if (phase === "discuss") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-2xl font-bold">Discuss and Vote!</h1>
        <p className="text-foreground/60">
          When you&apos;re ready, reveal the imposter.
        </p>
        <button
          onClick={() => setPhase("result")}
          className="mt-4 cursor-pointer rounded-full bg-foreground px-8 py-3 text-lg font-medium text-background transition-opacity hover:opacity-90"
        >
          Reveal Imposter
        </button>
        <button
          onClick={() => setPhase("done")}
          className="cursor-pointer rounded-full border border-foreground/20 px-6 py-2 text-sm text-foreground/60 transition-colors hover:bg-foreground/5"
        >
          End Game
        </button>
      </div>
    );
  }

  // --- Result phase ---
  if (phase === "result") {
    const imposterNames = players
      .filter((_, i) => imposterIndices.has(i))
      .join(" & ");

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-sm text-foreground/40">
          {imposterIndices.size > 1 ? "The imposters were" : "The imposter was"}
        </p>
        <h1 className="text-4xl font-bold text-red-500">{imposterNames}</h1>
        <p className="text-foreground/50">
          The word was:{" "}
          <span className="font-bold text-foreground">{word}</span>
        </p>
        <p className="mt-4 text-lg text-foreground/60">
          Did the group catch the imposter?
        </p>
        <div className="flex w-full max-w-xs gap-3">
          <button
            onClick={() => setPhase("who-called-it")}
            className="flex-1 cursor-pointer rounded-full bg-green-600 py-3 text-lg font-medium text-white transition-opacity hover:opacity-90"
          >
            Caught!
          </button>
          <button
            onClick={handleEscaped}
            className="flex-1 cursor-pointer rounded-full bg-red-600 py-3 text-lg font-medium text-white transition-opacity hover:opacity-90"
          >
            Escaped!
          </button>
        </div>
      </div>
    );
  }

  // --- Who called it phase ---
  if (phase === "who-called-it") {
    const nonImposters = players.filter((_, i) => !imposterIndices.has(i));

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-2xl font-bold">Who called it?</h1>
        <p className="text-foreground/60">
          Who identified the imposter?
        </p>
        <div className="flex w-full max-w-xs flex-col gap-2">
          {nonImposters.map((p) => (
            <button
              key={p}
              onClick={() => handleWhoCalled(p)}
              className="cursor-pointer rounded-xl border border-foreground/20 px-4 py-3 text-lg font-medium transition-colors hover:bg-foreground/5"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- Scoreboard phase ---
  const sorted = sortedPlayers();

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-2xl font-bold">Scores</h1>
        <div className="flex flex-col items-center gap-1">
          {sorted.map((p) => (
            <p key={p} className="text-xl">
              {p}: {scores[p] || 0}
            </p>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleNextRound}
            className="cursor-pointer rounded-full bg-foreground px-8 py-3 text-lg font-medium text-background transition-opacity hover:opacity-90"
          >
            Next Round
          </button>
          <button
            onClick={() => setPhase("done")}
            className="cursor-pointer rounded-full border border-foreground/20 px-6 py-2 text-sm text-foreground/60 transition-colors hover:bg-foreground/5"
          >
            End Game
          </button>
        </div>
      </div>
      {toast && (
        <Toast message={toast} type="error" onDismiss={() => setToast(null)} />
      )}
    </>
  );
}
