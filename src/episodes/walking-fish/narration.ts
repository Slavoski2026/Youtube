import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "walking-fish";

/** Approved 60-second cut (see script.md). Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "At exactly 8 AM, every fish on Earth suddenly learns how to walk." },
  {
    id: "c1",
    chapter: { n: 1, title: "THE FIRST STEP" },
    text: "At first, nobody notices. Until a salmon climbs out of the river… and casually walks into a supermarket.",
  },
  {
    id: "c2",
    chapter: { n: 2, title: "LANDFALL" },
    text: "Within three hours, millions of fish begin crawling out of oceans, rivers, and lakes. Beaches are completely overrun.",
  },
  { id: "c3", chapter: { n: 3, title: "THE SHARKS" }, text: "Then the sharks start coming. Great whites drag themselves through coastal towns." },
  { id: "c4", chapter: { n: 4, title: "EMPTY SEAS" }, text: "By day two, the fishing industry has collapsed. Boats return to empty waters." },
  {
    id: "c5",
    chapter: { n: 5, title: "THE MARCH" },
    text: "But the fish aren't wandering randomly. They're heading somewhere. By day three, enormous lines of fish are marching towards the world's major cities.",
  },
  {
    id: "c6",
    chapter: { n: 6, title: "UNDER SIEGE" },
    text: "Swordfish smash through shop windows. Sharks gather outside government buildings. Humanity prepares for the worst.",
  },
  { id: "c7", chapter: { n: 7, title: "TEN SECONDS" }, text: "But then, every fish on Earth suddenly stops moving. For ten seconds, complete silence." },
  {
    id: "c8",
    chapter: { n: 8, title: "PAYBACK" },
    text: "Then billions of fish turn towards the nearest human… and begin walking faster. Because apparently, they've finally figured out who's been eating them for the last 10,000 years.",
  },
];

export const TAGS: Partial<Record<string, TagKind>> = {};

/** Caption words always set in brand amber (Scribe writes "8:00" and "ten thousand"). */
export const KEYWORDS = [
  "8",
  "8:00",
  "AM",
  "every",
  "fish",
  "walk",
  "salmon",
  "river",
  "supermarket",
  "millions",
  "oceans",
  "rivers",
  "lakes",
  "Beaches",
  "overrun",
  "sharks",
  "Great",
  "whites",
  "coastal",
  "towns",
  "day",
  "two",
  "three",
  "fishing",
  "industry",
  "collapsed",
  "Boats",
  "empty",
  "somewhere",
  "lines",
  "marching",
  "cities",
  "Swordfish",
  "smash",
  "windows",
  "Sharks",
  "government",
  "worst",
  "stops",
  "ten",
  "seconds",
  "silence",
  "billions",
  "nearest",
  "human",
  "faster",
  "eating",
  "thousand",
  "10,000",
  "years",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF EVERY" }, { text: "FISH", color: P.amber }, { text: "LEARNED TO WALK?", size: 46 }];
