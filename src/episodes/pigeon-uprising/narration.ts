import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "pigeon-uprising";

/** Approved narration (see script.md). Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "At exactly 9 AM, every pigeon on Earth suddenly gets an IQ of 200. At first, nobody notices." },
  {
    id: "c1",
    chapter: { n: 1, title: "THE STARE" },
    text: "Three hours later, pigeons stop eating bread. They start watching humans. By midday, thousands gather outside government buildings. Not moving. Just staring.",
  },
  {
    id: "c2",
    chapter: { n: 2, title: "GRIDLOCK" },
    text: "By 6 PM, they've figured out traffic lights. Coordinated flocks block the intersections. Cities freeze.",
  },
  {
    id: "c3",
    chapter: { n: 3, title: "THE NETWORK" },
    text: "On day two, pigeons start stealing smartphones. Not randomly. They're collecting them, to build their own network.",
  },
  {
    id: "c4",
    chapter: { n: 4, title: "WINGED ARMIES" },
    text: "By day three, millions of pigeons form armies. They occupy airports and military bases. Flights stop. Governments try to negotiate. One problem: nobody speaks pigeon.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "THE MESSAGE" },
    text: "On day five, thousands of pigeons spell out a message across London's Trafalgar Square: \"NO MORE BREAD.\" World leaders are confused. Until a second message appears: \"WE WANT THE BAKERIES.\"",
  },
  {
    id: "c6",
    chapter: { n: 6, title: "THE BREAD WAR" },
    text: "By day seven, pigeons control the world's bread supply. Humanity has lost a war against birds. And the worst part? They haven't even learned to use weapons yet.",
  },
];

export const TAGS: Partial<Record<string, TagKind>> = {};

/** Caption words always set in brand amber (Scribe writes numbers as digits). */
export const KEYWORDS = [
  "9",
  "AM",
  "pigeon",
  "pigeons",
  "IQ",
  "200",
  "nobody",
  "bread",
  "watching",
  "humans",
  "thousands",
  "government",
  "staring",
  "6",
  "PM",
  "traffic",
  "lights",
  "flocks",
  "intersections",
  "freeze",
  "stealing",
  "smartphones",
  "collecting",
  "network",
  "millions",
  "armies",
  "airports",
  "military",
  "Flights",
  "negotiate",
  "speaks",
  "message",
  "London's",
  "Trafalgar",
  "Square",
  "NO",
  "MORE",
  "BREAD",
  "confused",
  "WANT",
  "BAKERIES",
  "seven",
  "supply",
  "war",
  "birds",
  "weapons",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF EVERY" }, { text: "PIGEON", color: P.amber }, { text: "GOT AN IQ OF 200?", size: 46 }];
