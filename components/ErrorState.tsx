"use client";

import Link from "next/link";

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry: () => void;
  onUseDefault: () => void;
  onBack?: () => void;
  backHref?: string;
}

export default function ErrorState({
  title,
  message,
  onRetry,
  onUseDefault,
  onBack,
  backHref = "/games",
}: ErrorStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="max-w-xs text-foreground/60">{message}</p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={onRetry}
          className="cursor-pointer rounded-full bg-foreground px-8 py-3 text-lg font-medium text-background transition-opacity hover:opacity-90"
        >
          Try Again
        </button>
        <button
          onClick={onUseDefault}
          className="cursor-pointer rounded-full border border-foreground/20 px-8 py-3 text-lg font-medium transition-colors hover:bg-foreground/5"
        >
          Use Default Deck
        </button>
        {onBack ? (
          <button
            onClick={onBack}
            className="mt-2 cursor-pointer px-4 py-2 text-sm text-foreground/50 transition-colors hover:text-foreground/70"
          >
            &larr; Back
          </button>
        ) : (
          <Link
            href={backHref}
            className="mt-2 px-4 py-2 text-sm text-foreground/50 transition-colors hover:text-foreground/70"
          >
            &larr; Back
          </Link>
        )}
      </div>
    </div>
  );
}
