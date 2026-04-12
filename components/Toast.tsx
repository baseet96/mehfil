"use client";

interface ToastProps {
  message: string;
  onDismiss: () => void;
  type?: "info" | "error";
}

export default function Toast({ message, onDismiss, type = "info" }: ToastProps) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-3rem)] max-w-sm -translate-x-1/2">
      <div
        className={`flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg ${
          type === "error"
            ? "bg-red-950/90 text-red-100"
            : "bg-foreground/90 text-background"
        }`}
      >
        <p className="flex-1 text-sm leading-snug">{message}</p>
        <button
          onClick={onDismiss}
          className="shrink-0 cursor-pointer text-sm font-semibold opacity-70 transition-opacity hover:opacity-100"
        >
          OK
        </button>
      </div>
    </div>
  );
}
