"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCachedDeck, cacheDeck } from "@/lib/storage";
import type { PersonalizationInput } from "@/lib/validators";

export type ErrorCode =
  | "rate_limited"
  | "quota_exhausted"
  | "network_error"
  | "generation_failed"
  | "unknown";

export interface GenerateError {
  code: ErrorCode;
  title: string;
  message: string;
}

export type GenerateStatus = "idle" | "loading" | "error";

interface UseGenerateDeckOptions {
  game: string;
  count?: number;
  onSuccess: (deck: string[]) => void;
}

export function useGenerateDeck({
  game,
  count = 25,
  onSuccess,
}: UseGenerateDeckOptions) {
  const [status, setStatus] = useState<GenerateStatus>("idle");
  const [error, setError] = useState<GenerateError | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<PersonalizationInput | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  const generate = useCallback(
    async (data: PersonalizationInput) => {
      setError(null);
      lastRequestRef.current = data;

      const cached = getCachedDeck(game, data);
      if (cached) {
        setStatus("idle");
        onSuccess(cached);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus("loading");

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game, personalization: data, count }),
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (!res.ok) {
          const body: { code?: string; error?: string } | null = await res
            .json()
            .catch(() => null);
          const serverCode = body?.code;
          const serverMessage = body?.error;
          const parsedCode: ErrorCode =
            serverCode === "rate_limited"
              ? "rate_limited"
              : serverCode === "quota_exhausted"
                ? "quota_exhausted"
                : serverCode === "generation_failed"
                  ? "generation_failed"
                  : "unknown";
          setError(buildError(parsedCode, serverMessage));
          setStatus("error");
          return;
        }

        const { deck: generated }: { deck: string[] } = await res.json();
        if (controller.signal.aborted) return;

        cacheDeck(game, data, generated);
        setStatus("idle");
        onSuccess(generated);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;

        setError(buildError("network_error"));
        setStatus("error");
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [game, count, onSuccess]
  );

  const retry = useCallback(() => {
    if (lastRequestRef.current) {
      generate(lastRequestRef.current);
    }
  }, [generate]);

  return { status, error, generate, retry, cancel, reset };
}

function buildError(code: ErrorCode, serverMessage?: string): GenerateError {
  switch (code) {
    case "rate_limited":
      return {
        code,
        title: "Slow down a sec",
        message:
          serverMessage ?? "Too many requests from this device. Try again in a bit.",
      };
    case "quota_exhausted":
      return {
        code,
        title: "AI is tapped out for today",
        message:
          serverMessage ??
          "We've hit today's AI limit. Try again tomorrow, or use the default deck.",
      };
    case "network_error":
      return {
        code,
        title: "Can't reach the server",
        message: "Check your connection and try again.",
      };
    case "generation_failed":
      return {
        code,
        title: "AI got confused",
        message:
          serverMessage ??
          "The AI returned something unexpected. Try again or use the default deck.",
      };
    default:
      return {
        code: "unknown",
        title: "Something went wrong",
        message: serverMessage ?? "Couldn't generate prompts. Try again.",
      };
  }
}
