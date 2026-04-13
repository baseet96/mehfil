"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { shuffle } from "@/lib/shuffle";

interface TruthOrDareGameProps {
  deck: string[];
  gameName: string;
  onGameOver: () => void;
}

export default function TruthOrDareGame({
  deck,
  gameName,
  onGameOver,
}: TruthOrDareGameProps) {
  const { truths, dares, total } = useMemo(() => {
    const t: string[] = [];
    const d: string[] = [];
    for (const item of deck) {
      if (item.startsWith("TRUTH: ")) t.push(item.slice(7));
      else if (item.startsWith("DARE: ")) d.push(item.slice(6));
    }
    return { truths: shuffle(t), dares: shuffle(d), total: t.length + d.length };
  }, [deck]);

  const [truthIndex, setTruthIndex] = useState(0);
  const [dareIndex, setDareIndex] = useState(0);
  const [current, setCurrent] = useState<{
    type: "truth" | "dare";
    text: string;
  } | null>(null);

  const truthsLeft = truths.length - truthIndex;
  const daresLeft = dares.length - dareIndex;
  const usedCount = truthIndex + dareIndex;

  function pick(type: "truth" | "dare") {
    if (type === "truth" && truthsLeft > 0) {
      setCurrent({ type: "truth", text: truths[truthIndex] });
      setTruthIndex((i) => i + 1);
    } else if (type === "dare" && daresLeft > 0) {
      setCurrent({ type: "dare", text: dares[dareIndex] });
      setDareIndex((i) => i + 1);
    }
  }

  function handleNext() {
    setCurrent(null);
    if (truthIndex + dareIndex >= total) {
      onGameOver();
    }
  }

  // Showing a prompt card
  if (current) {
    return (
      <div className="flex flex-1 flex-col items-center justify-between px-6 py-12">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xl font-bold">{gameName}</h1>
          <span className="text-sm text-foreground/50">
            {usedCount} / {total}
          </span>
        </div>

        <button
          onClick={handleNext}
          className="flex w-full max-w-sm cursor-pointer flex-col items-center gap-4 rounded-2xl border border-foreground/10 px-8 py-16 text-center transition-colors hover:bg-foreground/5 active:bg-foreground/10"
        >
          <span
            className={`rounded-full px-4 py-1 text-sm font-semibold uppercase tracking-wide ${
              current.type === "truth"
                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                : "bg-orange-500/15 text-orange-600 dark:text-orange-400"
            }`}
          >
            {current.type}
          </span>
          <p className="text-2xl font-medium leading-relaxed">{current.text}</p>
        </button>

        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-foreground/30">Tap to continue</p>
          <Link
            href="/games"
            className="text-sm text-foreground/40 transition-colors hover:text-foreground/70"
          >
            End Game
          </Link>
        </div>
      </div>
    );
  }

  // Choosing phase
  return (
    <div className="flex flex-1 flex-col items-center justify-between px-6 py-12">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-xl font-bold">{gameName}</h1>
        <span className="text-sm text-foreground/50">
          {usedCount} / {total}
        </span>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-4">
        <button
          onClick={() => pick("truth")}
          disabled={truthsLeft === 0}
          className="cursor-pointer rounded-2xl border border-foreground/10 px-8 py-10 text-center transition-colors hover:bg-foreground/5 active:bg-foreground/10 disabled:cursor-default disabled:opacity-30"
        >
          <p className="text-2xl font-bold">Truth</p>
          <p className="mt-1 text-sm text-foreground/50">
            {truthsLeft} remaining
          </p>
        </button>
        <button
          onClick={() => pick("dare")}
          disabled={daresLeft === 0}
          className="cursor-pointer rounded-2xl border border-foreground/10 px-8 py-10 text-center transition-colors hover:bg-foreground/5 active:bg-foreground/10 disabled:cursor-default disabled:opacity-30"
        >
          <p className="text-2xl font-bold">Dare</p>
          <p className="mt-1 text-sm text-foreground/50">
            {daresLeft} remaining
          </p>
        </button>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-foreground/30">Pick one</p>
        <Link
          href="/games"
          className="text-sm text-foreground/40 transition-colors hover:text-foreground/70"
        >
          End Game
        </Link>
      </div>
    </div>
  );
}
