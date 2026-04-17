"use client";

interface ToastProps {
  message: string;
  onDismiss: () => void;
  type?: "info" | "error";
}

export default function Toast({ message, onDismiss, type = "info" }: ToastProps) {
  return (
    <div
      className="fixed bottom-0 left-1/2 z-50 w-[calc(100%-3rem)] max-w-sm -translate-x-1/2 pb-6"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
    >
      <div
        className={`flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg ${
          type === "error"
            ? "bg-red-950/90 text-red-100"
            : "bg-foreground/90 text-background"
        }`}
      >
        <p className="flex-1 text-sm leading-snug">{message}</p>
        <button
          onClick={onDismiss}
          className="-mr-1 shrink-0 cursor-pointer rounded-full px-3 py-1 text-sm font-semibold opacity-70 transition-opacity hover:opacity-100"
        >
          OK
        </button>
      </div>
    </div>
  );
}
