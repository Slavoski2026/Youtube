import type { TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "death-countdown";

/** Approved narration (see script.md). The user's script, word for word. Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  {
    id: "cold",
    chapter: null,
    text: "There's a countdown floating above everyone's head. Your friend has 64 years left. Your neighbour has 12. But yours says 47 seconds. What would happen if every human could suddenly see exactly when they would die?",
  },
  { id: "c1", chapter: { n: 1, title: "THE NUMBERS APPEAR" }, text: "Within hours, society would descend into chaos." },
  { id: "c2", chapter: { n: 2, title: "FEARLESS" }, text: "People with decades remaining might become fearless, believing nothing could kill them early." },
  {
    id: "c3",
    chapter: { n: 3, title: "LAST DAYS" },
    text: "Meanwhile, those with only days left would abandon their jobs and spend their remaining time with loved ones.",
  },
  {
    id: "c4",
    chapter: { n: 4, title: "A WORLD OF TIMERS" },
    text: "Insurance companies would become almost obsolete. Employers might refuse to hire people with short countdowns. Even relationships could change, with people choosing partners based on how long they have left.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "CHEATING FATE" },
    text: "But then scientists would investigate something terrifying. Can the countdown actually be changed? If you avoid a dangerous situation, does your timer increase? Or was your decision to avoid it already part of your fate?",
  },
  {
    id: "c6",
    chapter: { n: 6, title: "THE MIRROR" },
    text: "Now imagine looking in the mirror. Your countdown suddenly drops from 60 years to 10 seconds. And you have absolutely no idea why. Would you rather know exactly when you'll die… or live without ever knowing?",
  },
];

/** Caption words always set in brand amber (Scribe wrote the numbers as words). */
export const KEYWORDS = [
  "countdown",
  "countdowns",
  "floating",
  "sixty-four",
  "64",
  "twelve",
  "12",
  "forty-seven",
  "47",
  "seconds",
  "die",
  "chaos",
  "decades",
  "fearless",
  "kill",
  "days",
  "abandon",
  "jobs",
  "loved",
  "insurance",
  "obsolete",
  "refuse",
  "hire",
  "short",
  "relationships",
  "partners",
  "scientists",
  "terrifying",
  "changed",
  "dangerous",
  "timer",
  "increase",
  "fate",
  "mirror",
  "drops",
  "sixty",
  "60",
  "ten",
  "10",
  "why",
  "know",
  "knowing",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF EVERYONE" }, { text: "HAD A DEATH", color: P.amber }, { text: "COUNTDOWN?", color: P.amber }];

/** "SINCE THE TIMERS" readout per chapter (hidden in the cold open and the mirror). */
export const SINCE: Partial<Record<string, string>> = {
  c1: "3 HOURS",
  c2: "2 DAYS",
  c3: "1 WEEK",
  c4: "6 MONTHS",
  c5: "2 YEARS",
};
