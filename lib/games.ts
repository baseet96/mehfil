export interface GameInfo {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  available: boolean;
}

export const games: GameInfo[] = [
  { slug: "would-you-rather", name: "Would You Rather", description: "Pick between two impossible choices", emoji: "\u{1F914}", available: true },
  { slug: "most-likely-to", name: "Most Likely To", description: "Point at who fits best", emoji: "\u{1F446}", available: false },
  { slug: "truth-or-dare", name: "Truth or Dare", description: "Spill or act \u2014 your call", emoji: "\u{1F3AD}", available: false },
  { slug: "two-truths-one-lie", name: "Two Truths and a Lie", description: "Spot the liar", emoji: "\u{1F925}", available: false },
  { slug: "charades", name: "Charades", description: "Act it out, no words", emoji: "\u{1F3AC}", available: false },
  { slug: "imposter", name: "Imposter", description: "Find who doesn't belong", emoji: "\u{1F575}\u{FE0F}", available: false },
];
