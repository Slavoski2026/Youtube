import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "no-work-2036";

/** Approved narration (see script.md). Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  {
    id: "cold",
    chapter: null,
    text: "What if 2036 is the year humanity never has to work again? No more nine-to-five. No more six a.m. alarms. Elon Musk predicts AI and robots could make work optional within ten to twenty years.",
  },
  { id: "c1", chapter: { n: 1, title: "FULLY AUTOMATED" }, text: "Welcome to 2036. Your phone buzzes: \"Your job has been fully automated.\" You panic. Then you look outside." },
  { id: "c2", chapter: { n: 2, title: "THE MACHINES" }, text: "Robots are building skyscrapers. Trucks drive themselves. Whole factories run without a single human." },
  {
    id: "c3",
    chapter: { n: 3, title: "FREEDOM" },
    text: "Imagine AI so productive that governments pay everyone a universal high income. Travel the world. Start a business. Finally see your family.",
  },
  { id: "c4", chapter: { n: 4, title: "THE CATCH" }, text: "But what if the companies that own the robots keep the money? What if millions lose their jobs before help arrives?" },
  {
    id: "c5",
    chapter: { n: 5, title: "TWO FUTURES" },
    text: "In ten years: cheap homes and incredible medicine. Or a handful of companies controlling almost everything. Both start with the same invention.",
  },
  {
    id: "c6",
    chapter: { n: 6, title: "WHO BENEFITS?" },
    text: "The real question isn't whether AI takes our jobs. It's who benefits when it does. What do you think: humanity's greatest achievement… or its biggest mistake?",
  },
];

export const TAGS: Partial<Record<string, TagKind>> = { c3: "HYPOTHESIS" };

/** Caption words always set in brand amber (Scribe writes "2036" and "6:00"). */
export const KEYWORDS = [
  "2036",
  "never",
  "work",
  "nine",
  "five",
  "6:00",
  "alarms",
  "robots",
  "optional",
  "automated",
  "panic",
  "outside",
  "skyscrapers",
  "Trucks",
  "factories",
  "human",
  "universal",
  "income",
  "Travel",
  "business",
  "family",
  "companies",
  "money",
  "millions",
  "jobs",
  "homes",
  "medicine",
  "handful",
  "everything",
  "invention",
  "benefits",
  "achievement",
  "mistake",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF WORK" }, { text: "ENDED IN 2036?", color: P.amber }];

/** "THE YEAR" readout per block (c5 jumps ten years ahead on its first words). */
export const YEAR: Record<string, string> = { cold: "2026", c1: "2036", c2: "2036", c3: "2036", c4: "2036", c5: "2046", c6: "2046" };
