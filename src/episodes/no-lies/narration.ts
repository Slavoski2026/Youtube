import type { TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "no-lies";

/** The user's script, unchanged (see script.md). Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  {
    id: "cold",
    chapter: null,
    text: "Every affair, every fake friendship, and every government cover-up is about to be exposed. Because humanity has just lost the ability to lie.",
  },
  {
    id: "c1",
    chapter: { n: 1, title: "A PERFECT WORLD" },
    text: "At first, this might sound like the perfect world. No more scams. No more false promises. No more manipulation through lies.",
  },
  {
    id: "c2",
    chapter: { n: 2, title: "FALLING APART" },
    text: "But within hours, relationships would begin falling apart. Your friends could no longer pretend to like you. Employees could no longer pretend to enjoy their jobs. And politicians would have to carefully avoid questions they couldn't answer truthfully.",
  },
  {
    id: "c3",
    chapter: { n: 3, title: "NOWHERE TO HIDE" },
    text: "Within days, criminal investigations could become much easier. Businesses would struggle to advertise misleading products. Even something as simple as complimenting someone's appearance could become impossible.",
  },
  {
    id: "c4",
    chapter: { n: 4, title: "THE SILENCE" },
    text: "Eventually, humans would learn to stay silent rather than reveal uncomfortable truths. Because being unable to lie doesn't mean you're forced to speak.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "KIND LIES" },
    text: "And humanity would discover something disturbing. Not every lie is designed to hurt someone. Sometimes, we lie to protect the people we love.",
  },
  {
    id: "c6",
    chapter: { n: 6, title: "THE TRUTH" },
    text: "Maybe a world without lies wouldn't be a perfect world. Maybe it would be a world that couldn't handle the truth. Would you want to live in it?",
  },
];

/** Caption words always set in brand amber. */
export const KEYWORDS = [
  "affair",
  "fake",
  "friendship",
  "government",
  "cover-up",
  "exposed",
  "lie",
  "lies",
  "perfect",
  "scams",
  "false",
  "promises",
  "manipulation",
  "relationships",
  "apart",
  "friends",
  "pretend",
  "jobs",
  "politicians",
  "truthfully",
  "criminal",
  "investigations",
  "easier",
  "misleading",
  "products",
  "complimenting",
  "appearance",
  "impossible",
  "silent",
  "truths",
  "speak",
  "disturbing",
  "hurt",
  "protect",
  "love",
  "truth",
  "live",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF HUMANS" }, { text: "COULDN'T LIE?", color: P.amber }];

/** "TIME WITHOUT LIES" readout value per narration block. */
export const CLOCK: Record<string, string> = {
  cold: "0 SEC",
  c1: "10 MIN",
  c2: "3 HOURS",
  c3: "4 DAYS",
  c4: "1 YEAR",
  c5: "1 YEAR",
  c6: "10 YEARS",
};
