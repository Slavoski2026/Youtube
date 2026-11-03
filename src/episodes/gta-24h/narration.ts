import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "gta-24h";

/** Approved, trimmed narration (see script.md). Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  {
    id: "cold",
    chapter: null,
    text: "What if playing GTA 6 for 24 hours straight started destroying your ability to play? At first, you'd be unstoppable. By the end, even a one-star wanted level could beat you.",
  },
  { id: "c1", chapter: { n: 1, title: "HOOKED" }, text: "After one hour, you're hooked. Exploring Vice City, stealing supercars, causing absolute chaos. Time flies." },
  {
    id: "c2",
    chapter: { n: 2, title: "SCREEN EYES" },
    text: "After four hours, your eyes are tired. You've been blinking less, your neck is stiff, and the outside world is gone.",
  },
  {
    id: "c3",
    chapter: { n: 3, title: "BODY ALARM" },
    text: "After eight hours, your back hurts, your reactions are slowing, and you forgot to drink water. You've also crashed about three hundred cars.",
  },
  {
    id: "c4",
    chapter: { n: 4, title: "MIDNIGHT MISTAKES" },
    text: "After twelve hours, it's the middle of the night. You crash into walls, miss obvious turns, and somehow lose a police chase to a bicycle.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "RUNNING ON EMPTY" },
    text: "After eighteen hours, your eyes are burning and your focus is fading. Even the easiest missions feel impossible.",
  },
  {
    id: "c6",
    chapter: { n: 6, title: "GAME OVER" },
    text: "After twenty-four hours, you've spent an entire day playing. Your sleep schedule is wrecked, and your body desperately needs rest.",
  },
  {
    id: "c7",
    chapter: { n: 7, title: "THE TWIST" },
    text: "Here's the craziest part. You spent a whole day trying to master a game, and got worse at it the longer you played. And just as you put down your controller, your friend texts: \"Bro, you getting on GTA?\"",
  },
];

export const TAGS: Partial<Record<string, TagKind>> = {
  c2: "REAL SCIENCE",
  c3: "REAL SCIENCE",
  c4: "DRAMATISED",
  c5: "REAL SCIENCE",
  c6: "REAL SCIENCE",
};

/** Caption words always set in brand amber. */
export const KEYWORDS = [
  "GTA",
  "24",
  "unstoppable.",
  "one-star",
  "hooked.",
  "supercars,",
  "chaos.",
  "eyes",
  "blinking",
  "neck",
  "back",
  "reactions",
  "water.",
  "hundred",
  "midnight",
  "night.",
  "walls,",
  "bicycle.",
  "burning",
  "focus",
  "impossible.",
  "twenty-four",
  "rest.",
  "worse",
  "Bro,",
];

export const TITLE: TitleLine[] = [
  { text: "WHAT IF YOU" },
  { text: "PLAYED GTA 6", color: P.amber },
  { text: "FOR 24 HOURS?", size: 46 },
];

/** Story clock: hours played at the start of each block. */
export const HOURS: Record<string, number> = { cold: 0, c1: 1, c2: 4, c3: 8, c4: 12, c5: 18, c6: 24, c7: 24 };
