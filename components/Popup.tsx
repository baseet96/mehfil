"use client";

interface PopupProps {
  message: string;
  onDismiss: () => void;
}

export default function Popup({ message, onDismiss }: PopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl bg-background p-6 text-center shadow-xl">
        <p className="text-sm leading-relaxed text-foreground/80">{message}</p>
        <button
          onClick={onDismiss}
          className="cursor-pointer rounded-full bg-foreground px-8 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          OK
        </button>
      </div>
    </div>
  );
}
