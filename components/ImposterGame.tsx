"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { shuffle } from "@/lib/shuffle";
import { getRecentPlayers, setRecentPlayers } from "@/lib/storage";
import { useGenerateDeck } from "@/lib/hooks/use-generate-deck";
import PersonalizationFlow from "@/components/PersonalizationFlow";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";

interface ImposterGameProps {
  deck: string[];
  gameName: string;
  onGameOver: () => void;
}

type Phase =
  | "setup"
  | "choose-deck"
  | "personalizing"
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
  const [prevImposters, setPrevImposters] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [activeReveal, setActiveReveal] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [round, setRound] = useState(1);
  const [selectedCallers, setSelectedCallers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = getRecentPlayers();
    if (saved.length > 0) setPlayers(saved);
  }, []);

  const startWithDeckRef = useRef<((d: string[]) => void) | null>(null);
  const handleDeckReady = useCallback((generated: string[]) => {
    startWithDeckRef.current?.(generated);
  }, []);

  const { status, error, generate, retry, cancel, reset } = useGenerateDeck({
    game: GAME_SLUG,
    onSuccess: handleDeckReady,
  });

  function addPlayer() {
    const name = nameInput.trim();
    if (name && !players.includes(name)) {
      const next = [...players, name];
      setPlayers(next);
      setRecentPlayers(next);
      setNameInput("");
    }
  }

  function removePlayer(index: number) {
    const next = players.filter((_, i) => i !== index);
    setPlayers(next);
    setRecentPlayers(next);
  }

  function startRound(
    deck: string[],
    idx: number,
    playerList: string[],
    avoid: Set<string>
  ) {
    const currentWord = deck[idx % deck.length];
    setWord(currentWord);

    const impCount = Math.min(imposterCount, playerList.length - 1);
    const allIndices = playerList.map((_, i) => i);
    const preferred = shuffle(allIndices.filter((i) => !avoid.has(playerList[i])));
    const fallback = shuffle(allIndices.filter((i) => avoid.has(playerList[i])));
    const ordered = [...preferred, ...fallback];

    const indices = new Set<number>();
    for (let i = 0; i < impCount; i++) indices.add(ordered[i]);

    setImposterIndices(indices);
    setPrevImposters(new Set([...indices].map((i) => playerList[i])));
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
    setPrevImposters(new Set());
    startRound(shuffled, 0, players, new Set());
  }

  useEffect(() => {
    startWithDeckRef.current = startWithDeck;
  });

  function handleQuickStart() {
    generate({ isAdult: false, language: "English" });
  }

  function handleUseDefault() {
    reset();
    startWithDeck(staticDeck);
  }

  function handleBackFromError() {
    reset();
    setPhase("choose-deck");
  }

  function toggleCaller(playerName: string) {
    setSelectedCallers((prev) => {
      const next = new Set(prev);
      if (next.has(playerName)) next.delete(playerName);
      else next.add(playerName);
      return next;
    });
  }

  function confirmCallers() {
    setScores((prev) => {
      const next = { ...prev };
      selectedCallers.forEach((name) => {
        next[name] = (next[name] || 0) + 1;
      });
      return next;
    });
    setSelectedCallers(new Set());
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
    startRound(wordDeck, nextIdx, players, prevImposters);
  }

  function handlePlayAgain() {
    setPhase("setup");
    setNameInput("");
    setWordDeck([]);
    setWordIndex(0);
    setWord("");
    setImposterIndices(new Set());
    setPrevImposters(new Set());
    setRevealed(new Set());
    setActiveReveal(null);
    setSelectedCallers(new Set());
    setScores({});
    setRound(1);
    reset();
  }

  function sortedPlayers() {
    return [...players].sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
  }

  if (status === "loading") {
    return (
      <LoadingState
        message="Generating your words..."
        onCancel={() => {
          cancel();
          setPhase("choose-deck");
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
      <div className="flex flex-1 flex-col items-center justify-between px-6 py-12">
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
            className="mt-2 px-4 py-2 text-center text-sm text-foreground/50 transition-colors hover:text-foreground/70"
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
            className="mt-2 cursor-pointer px-4 py-2 text-sm text-foreground/50 transition-colors hover:text-foreground/70"
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
        onComplete={(data) => generate(data)}
        onBack={() => setPhase("choose-deck")}
      />
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

        <div className="flex flex-col items-center gap-3">
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
          <button
            onClick={() => setPhase("done")}
            className="cursor-pointer rounded-full border border-foreground/20 px-6 py-2 text-sm text-foreground/60 transition-colors hover:bg-foreground/5"
          >
            End Game
          </button>
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
        <button
          onClick={() => setPhase("done")}
          className="cursor-pointer rounded-full border border-foreground/20 px-6 py-2 text-sm text-foreground/60 transition-colors hover:bg-foreground/5"
        >
          End Game
        </button>
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
          Tap everyone who identified the imposter.
        </p>
        <div className="flex w-full max-w-xs flex-col gap-2">
          {nonImposters.map((p) => {
            const isSelected = selectedCallers.has(p);
            return (
              <button
                key={p}
                onClick={() => toggleCaller(p)}
                className={`cursor-pointer rounded-xl border px-4 py-3 text-lg font-medium transition-colors ${
                  isSelected
                    ? "border-foreground bg-foreground text-background"
                    : "border-foreground/20 hover:bg-foreground/5"
                }`}
              >
                {p}
                {isSelected ? " \u2713" : ""}
              </button>
            );
          })}
        </div>
        <button
          onClick={confirmCallers}
          className="cursor-pointer rounded-full bg-foreground px-8 py-3 text-lg font-medium text-background transition-opacity hover:opacity-90"
        >
          Done
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

  // --- Scoreboard phase ---
  const sorted = sortedPlayers();

  return (
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
  );
}
