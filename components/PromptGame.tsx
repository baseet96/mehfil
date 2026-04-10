"use client";

import { useState } from "react";

interface PromptGameProps {
  deck: string[];
  gameName: string;
  onGameOver: () => void;
}

export default function PromptGame({
  deck,
  gameName,
  onGameOver,
}: PromptGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  function handleNext() {
    if (currentIndex + 1 >= deck.length) {
      onGameOver();
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-between px-6 py-12">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-xl font-bold">{gameName}</h1>
        <span className="text-sm text-foreground/50">
          {currentIndex + 1} / {deck.length}
        </span>
      </div>

      <button
        onClick={handleNext}
        className="w-full max-w-sm cursor-pointer rounded-2xl border border-foreground/10 px-8 py-16 text-center transition-colors hover:bg-foreground/5 active:bg-foreground/10"
      >
        <p className="text-2xl font-medium leading-relaxed">
          {deck[currentIndex]}
        </p>
      </button>

      <p className="text-sm text-foreground/30">Tap to continue</p>
    </div>
  );
}
