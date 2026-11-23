import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "immortal";

/** Approved narration (see script.md): the user's script as written. Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "What would happen if all 8 billion humans suddenly became immortal?" },
  {
    id: "c1",
    chapter: { n: 1, title: "THE GIFT" },
    text: "At first, it would seem like humanity's greatest achievement. No more death. No more funerals. No more fear of losing someone.",
  },
  {
    id: "c2",
    chapter: { n: 2, title: "ONE PROBLEM" },
    text: "But there's one massive problem. People would keep being born, while nobody would ever die.",
  },
  {
    id: "c3",
    chapter: { n: 3, title: "OVERCROWDED" },
    text: "Within centuries, Earth's population could grow to unimaginable numbers. Food would become scarce. Cities would become overcrowded. And entire countries could collapse.",
  },
  {
    id: "c4",
    chapter: { n: 4, title: "TRAPPED" },
    text: "But overpopulation wouldn't even be the worst part. Imagine being trapped beneath a collapsed building. You can't move. You can't escape. And you can't die. You could remain there for thousands of years.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "THE DYING SUN" },
    text: "And even if humanity somehow survived for billions of years, the Sun would eventually make Earth uninhabitable. But you'd still be alive.",
  },
  {
    id: "c6",
    chapter: { n: 6, title: "THE LAST LIGHT" },
    text: "And as the universe slowly grows colder and darker, you'd face something far worse than death. An eternity with no escape.",
  },
  {
    id: "c7",
    chapter: { n: 7, title: "THE CURSE" },
    text: "Because immortality might not be humanity's greatest gift. It might be its greatest curse.",
  },
];

export const TAGS: Partial<Record<string, TagKind>> = { c2: "REAL SCIENCE", c3: "HYPOTHESIS", c5: "REAL SCIENCE", c6: "HYPOTHESIS" };

/** Caption words always set in brand amber. */
export const KEYWORDS = [
  "8",
  "eight",
  "billion",
  "immortal",
  "greatest",
  "achievement",
  "death",
  "funerals",
  "losing",
  "massive",
  "problem",
  "born",
  "nobody",
  "die",
  "centuries",
  "population",
  "unimaginable",
  "Food",
  "scarce",
  "overcrowded",
  "countries",
  "collapse",
  "overpopulation",
  "worst",
  "trapped",
  "collapsed",
  "move",
  "escape",
  "thousands",
  "billions",
  "sun",
  "uninhabitable",
  "alive",
  "universe",
  "colder",
  "darker",
  "worse",
  "eternity",
  "immortality",
  "gift",
  "curse",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF HUMANS" }, { text: "BECAME IMMORTAL?", color: P.amber }];
