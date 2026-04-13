"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { shuffle } from "@/lib/shuffle";
import { getCachedDeck, cacheDeck } from "@/lib/storage";
import type { PersonalizationInput } from "@/lib/validators";
import PersonalizationFlow from "@/components/PersonalizationFlow";
import Toast from "@/components/Toast";

interface CharadesGameProps {
  deck: string[];
  gameName: string;
  onGameOver: () => void;
}

type Phase =
  | "setup"
  | "choose-deck"
  | "personalizing"
  | "loading"
  | "ready"
  | "active"
  | "turn-over"
  | "done";
type Mode = "classic" | "speed";

const TIMER_OPTIONS = [30, 60, 90, 120, 180];
const GAME_SLUG = "charades";

export default function CharadesGame({
  deck: staticDeck,
  gameName,
  onGameOver,
}: CharadesGameProps) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<Mode>("classic");
  const [timerDuration, setTimerDuration] = useState(60);
  const [teams, setTeams] = useState(["", ""]);
  const [currentTeam, setCurrentTeam] = useState<0 | 1>(0);
  const [scores, setScores] = useState([0, 0]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [turnScore, setTurnScore] = useState(0);
  const [speedDeck, setSpeedDeck] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function teamName(i: number) {
    return teams[i] || `Team ${i + 1}`;
  }

  function clearTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  // Timer effect
  useEffect(() => {
    if (phase !== "active") return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTimer();
          setPhase("turn-over");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return clearTimer;
  }, [phase, currentIndex]);

  function startWithDeck(d: string[]) {
    setSpeedDeck(shuffle(d));
    setCurrentIndex(0);
    setPhase("ready");
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
        body: JSON.stringify({ game: GAME_SLUG, personalization: data, count: 25 }),
      });

      if (!res.ok) {
        const body: { code?: string; error?: string } | null = await res
          .json()
          .catch(() => null);
        throw new Error(
          body?.code === "rate_limited"
            ? (body.error ?? "Too many requests. Try again later.")
            : "Couldn't personalize — using default deck instead."
        );
      }

      const { deck: generated }: { deck: string[] } = await res.json();
      cacheDeck(GAME_SLUG, data, generated);
      startWithDeck(generated);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Couldn't personalize — using default deck instead.";
      setToast(message);
      startWithDeck(staticDeck);
    }
  }

  function handleQuickStart() {
    handleGenerate({ isAdult: false, language: "English" });
  }

  function handlePlayAgain() {
    setPhase("setup");
    setCurrentTeam(0);
    setScores([0, 0]);
    setCurrentIndex(0);
    setTimeLeft(timerDuration);
    setTurnScore(0);
    setSpeedDeck([]);
  }

  function handleCorrect() {
    setTurnScore((s) => s + 1);
    setScores((s) => {
      const next = [...s];
      next[currentTeam] += 1;
      return next;
    });

    if (mode === "classic") {
      clearTimer();
      setPhase("turn-over");
      return;
    }

    if (currentIndex + 1 >= speedDeck.length) {
      clearTimer();
      setPhase("turn-over");
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function handleSkip() {
    if (mode === "classic") {
      clearTimer();
      setPhase("turn-over");
      return;
    }

    if (currentIndex + 1 >= speedDeck.length) {
      clearTimer();
      setPhase("turn-over");
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function handleEndGame() {
    clearTimer();
    setPhase("done");
  }

  function handleNextTeam() {
    if (mode === "speed" && currentIndex >= speedDeck.length) {
      setPhase("done");
      return;
    }
    setCurrentTeam((t) => (t === 0 ? 1 : 0) as 0 | 1);
    setTimeLeft(timerDuration);
    setTurnScore(0);
    setPhase("ready");
  }

  // --- Done screen ---
  if (phase === "done") {
    const winner =
      scores[0] > scores[1] ? teamName(0)
      : scores[1] > scores[0] ? teamName(1)
      : null;

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-4xl font-bold">
          {winner ? `${winner} Wins!` : "It\u2019s a Tie!"}
        </h1>
        <div className="flex flex-col items-center gap-1">
          <p className="text-2xl">{teamName(0)}: {scores[0]}</p>
          <p className="text-2xl">{teamName(1)}: {scores[1]}</p>
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

  const scoreBar = `${teamName(0)}: ${scores[0]} — ${teamName(1)}: ${scores[1]}`;

  // --- Setup screen ---
  if (phase === "setup") {
    return (
      <div className="flex flex-1 flex-col items-center justify-between px-6 py-12">
        <h1 className="text-xl font-bold">{gameName}</h1>

        <div className="flex w-full max-w-xs flex-col gap-6">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Team 1"
              value={teams[0]}
              onChange={(e) => setTeams([e.target.value, teams[1]])}
              className="rounded-xl border border-foreground/15 bg-transparent px-4 py-3 text-center text-lg outline-none focus:border-foreground/40"
            />
            <input
              type="text"
              placeholder="Team 2"
              value={teams[1]}
              onChange={(e) => setTeams([teams[0], e.target.value])}
              className="rounded-xl border border-foreground/15 bg-transparent px-4 py-3 text-center text-lg outline-none focus:border-foreground/40"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-center text-sm text-foreground/50">Game mode</p>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("classic")}
                className={`flex-1 cursor-pointer rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
                  mode === "classic"
                    ? "border-foreground bg-foreground text-background"
                    : "border-foreground/15 hover:bg-foreground/5"
                }`}
              >
                Classic
              </button>
              <button
                onClick={() => setMode("speed")}
                className={`flex-1 cursor-pointer rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
                  mode === "speed"
                    ? "border-foreground bg-foreground text-background"
                    : "border-foreground/15 hover:bg-foreground/5"
                }`}
              >
                Speed
              </button>
            </div>
            <p className="text-center text-xs text-foreground/40">
              {mode === "classic"
                ? "Other team picks the word — one turn each, then swap"
                : "Race through as many prompts as you can"}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-center text-sm text-foreground/50">Timer</p>
            <div className="flex gap-2">
              {TIMER_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setTimerDuration(s);
                    setTimeLeft(s);
                  }}
                  className={`flex-1 cursor-pointer rounded-xl border px-1 py-3 text-sm font-medium transition-colors ${
                    timerDuration === s
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground/15 hover:bg-foreground/5"
                  }`}
                >
                  {s >= 120 ? `${s / 60}m` : `${s}s`}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setTimeLeft(timerDuration);
              if (mode === "speed") {
                setPhase("choose-deck");
              } else {
                setPhase("ready");
              }
            }}
            className="cursor-pointer rounded-full bg-foreground px-8 py-3 text-lg font-medium text-background transition-opacity hover:opacity-90"
          >
            Start Game
          </button>
          <Link
            href="/games"
            className="mt-2 text-sm text-foreground/50 transition-colors hover:text-foreground/70"
          >
            &larr; Back
          </Link>
        </div>

        <div />
      </div>
    );
  }

  // --- Choose deck screen (Speed only) ---
  if (phase === "choose-deck") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="text-5xl">{"\uD83C\uDFAC"}</span>
        <h1 className="text-2xl font-bold">{gameName} — Speed</h1>
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
        <p className="text-lg text-foreground/60">Generating your prompts...</p>
        <button
          onClick={() => setPhase("choose-deck")}
          className="mt-4 text-sm text-foreground/50 transition-colors hover:text-foreground/70"
        >
          Cancel
        </button>
      </div>
    );
  }

  // --- Ready screen ---
  if (phase === "ready") {
    const otherTeam = currentTeam === 0 ? 1 : 0;
    return (
      <div className="flex flex-1 flex-col items-center justify-between px-6 py-12">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xl font-bold">{gameName}</h1>
          <span className="text-sm text-foreground/50">{scoreBar}</span>
        </div>

        <div className="flex flex-col items-center gap-4">
          <p className="text-2xl font-bold">{teamName(currentTeam)}&apos;s Turn</p>
          <p className="text-center text-foreground/60">
            {mode === "classic"
              ? `${teamName(otherTeam)} — think of something for them to act out`
              : "Actor holds the phone — face it away from your team"}
          </p>
          <button
            onClick={() => {
              setTimeLeft(timerDuration);
              setTurnScore(0);
              setPhase("active");
            }}
            className="mt-2 cursor-pointer rounded-full bg-foreground px-10 py-4 text-xl font-medium text-background transition-opacity hover:opacity-90"
          >
            Start
          </button>
          <button
            onClick={handleEndGame}
            className="cursor-pointer rounded-full border border-foreground/20 px-6 py-2 text-sm text-foreground/60 transition-colors hover:bg-foreground/5"
          >
            End Game
          </button>
        </div>

        <div />
      </div>
    );
  }

  // --- Turn over screen ---
  if (phase === "turn-over") {
    const outOfPrompts = mode === "speed" && currentIndex >= speedDeck.length;

    return (
      <div className="flex flex-1 flex-col items-center justify-between px-6 py-12">
        <h1 className="text-xl font-bold">{gameName}</h1>

        <div className="flex flex-col items-center gap-4">
          {mode === "speed" && (
            <p className="text-lg text-foreground/60">
              {teamName(currentTeam)} scored {turnScore} this round
            </p>
          )}
          <div className="flex flex-col items-center gap-1">
            <p className="text-3xl font-bold">{teamName(0)}: {scores[0]}</p>
            <p className="text-3xl font-bold">{teamName(1)}: {scores[1]}</p>
          </div>
          <button
            onClick={outOfPrompts ? () => setPhase("done") : handleNextTeam}
            className="mt-2 cursor-pointer rounded-full bg-foreground px-8 py-3 text-lg font-medium text-background transition-opacity hover:opacity-90"
          >
            {outOfPrompts ? "See Results" : `${teamName(currentTeam === 0 ? 1 : 0)}'s Turn`}
          </button>
          {!outOfPrompts && (
            <button
              onClick={handleEndGame}
              className="cursor-pointer rounded-full border border-foreground/20 px-6 py-2 text-sm text-foreground/60 transition-colors hover:bg-foreground/5"
            >
              End Game
            </button>
          )}
        </div>

        <div />
      </div>
    );
  }

  // --- Active round ---
  const activeDeck = mode === "speed" ? speedDeck : [];
  const timerRatio = timeLeft / timerDuration;
  const timerColor =
    timerRatio > 0.5
      ? "text-green-500"
      : timerRatio > 0.2
        ? "text-yellow-500"
        : "text-red-500";

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-between px-6 py-12">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xl font-bold">{gameName}</h1>
          <span className="text-sm text-foreground/50">
            {teamName(currentTeam)}&apos;s Turn
          </span>
        </div>

        <div className="flex w-full max-w-sm flex-col items-center gap-6">
          <span className={`text-5xl font-bold tabular-nums ${timerColor}`}>
            {timeLeft}
          </span>

          {mode === "speed" && activeDeck[currentIndex] && (
            <div className="w-full rounded-2xl border border-foreground/10 px-8 py-12 text-center">
              <p className="text-2xl font-medium leading-relaxed">
                {activeDeck[currentIndex]}
              </p>
            </div>
          )}

          <div className="flex w-full gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 cursor-pointer rounded-full border border-foreground/20 py-3 text-lg font-medium transition-colors hover:bg-foreground/5"
            >
              Skip
            </button>
            <button
              onClick={handleCorrect}
              className="flex-1 cursor-pointer rounded-full bg-green-600 py-3 text-lg font-medium text-white transition-opacity hover:opacity-90"
            >
              Correct
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-foreground/30">
            {mode === "speed" ? `Round score: ${turnScore}` : scoreBar}
          </p>
          <button
            onClick={handleEndGame}
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
