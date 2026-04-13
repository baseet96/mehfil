"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const ua = navigator.userAgent;
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    const safari = /Safari/.test(ua) && !/Chrome/.test(ua);

    if (ios && safari) {
      setIsIOS(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Hide if already installed or unsupported browser
  if (installed || (!isIOS && !deferredPrompt)) return null;

  async function handleTap() {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  }

  return (
    <>
      <button
        onClick={handleTap}
        className="cursor-pointer text-sm text-foreground/40 underline underline-offset-4 transition-opacity hover:text-foreground/60"
      >
        Add to Home Screen
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl bg-background p-6 text-center shadow-xl">
            <p className="text-lg font-semibold text-foreground">
              Add Mehfil
            </p>
            <div className="flex flex-col gap-2 text-sm leading-relaxed text-foreground/80">
              <p>
                Tap the <span className="font-semibold">Share</span> button
                <span className="mx-1 inline-block translate-y-px text-base">
                  ⎙
                </span>
                at the bottom of Safari
              </p>
              <p>
                Then tap{" "}
                <span className="font-semibold">Add to Home Screen</span>
              </p>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full cursor-pointer rounded-full bg-foreground px-8 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
