import Link from "next/link";
import { games } from "@/lib/games";

export default function GamesPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold">Pick a game</h1>
      <div className="grid w-full max-w-md grid-cols-2 gap-4">
        {games.map((game) =>
          game.available ? (
            <Link
              key={game.slug}
              href={`/games/${game.slug}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-foreground/10 p-6 text-center transition-colors hover:bg-foreground/5"
            >
              <span className="text-4xl">{game.emoji}</span>
              <span className="font-semibold">{game.name}</span>
              <span className="text-sm text-foreground/50">
                {game.description}
              </span>
            </Link>
          ) : (
            <div
              key={game.slug}
              className="relative flex flex-col items-center gap-2 rounded-2xl border border-foreground/10 p-6 text-center opacity-50"
            >
              <span className="text-4xl">{game.emoji}</span>
              <span className="font-semibold">{game.name}</span>
              <span className="text-sm text-foreground/50">
                {game.description}
              </span>
              <span className="absolute top-2 right-2 rounded-full bg-foreground/10 px-2 py-0.5 text-xs">
                Soon
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
