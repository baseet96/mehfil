"use client";

interface LoadingStateProps {
  message: string;
  onCancel?: () => void;
}

export default function LoadingState({ message, onCancel }: LoadingStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      <p className="text-lg text-foreground/60">{message}</p>
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-4 cursor-pointer px-4 py-2 text-sm text-foreground/50 transition-colors hover:text-foreground/70"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
