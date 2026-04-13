import Link from "next/link";
import InstallPrompt from "@/components/InstallPrompt";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-5xl font-bold tracking-tight">Mehfil</h1>
      <p className="text-lg text-foreground/60">
        Party games for family gatherings
      </p>
      <Link
        href="/games"
        className="mt-4 rounded-full bg-foreground px-8 py-3 text-lg font-medium text-background transition-opacity hover:opacity-90"
      >
        Start Playing
      </Link>
      <InstallPrompt />
    </div>
  );
}
