import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "no-humans";

/** Approved, trimmed narration (see script.md). Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "What if every single human on Earth suddenly disappeared? Not died. Not evacuated. Just vanished." },
  {
    id: "c1",
    chapter: { n: 1, title: "INSTANT CHAOS" },
    text: "Within seconds, chaos would erupt. Millions of cars would crash into buildings and each other. Planes would keep flying on autopilot, but many would eventually crash.",
  },
  {
    id: "c2",
    chapter: { n: 2, title: "LIGHTS OUT" },
    text: "After twenty-four hours, parts of the world would go dark. Power stations would shut down, and entire cities would lose electricity.",
  },
  {
    id: "c3",
    chapter: { n: 3, title: "THE FLOOD BELOW" },
    text: "After one week, underground tunnels would already be flooded. Pets would struggle to survive, while wild animals explored empty streets.",
  },
  {
    id: "c4",
    chapter: { n: 4, title: "NATURE MOVES IN" },
    text: "After one month, nature would start reclaiming our cities. Grass would push through cracks in the pavement, and plants would spread across roads.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "CITIES CHANGE" },
    text: "After one year, many cities would look completely different, as storms, floods, and plants slowly tear them apart.",
  },
  {
    id: "c6",
    chapter: { n: 6, title: "THE WILD RETURNS" },
    text: "Fast-forward one hundred years. Forests would spread through abandoned neighbourhoods. Roads would crumble, and some buildings would collapse. Animals would roam where millions of people once lived.",
  },
  {
    id: "c7",
    chapter: { n: 7, title: "BURIED BY TIME" },
    text: "After thousands of years, most of what we built would vanish beneath plants and sediment. But some monuments, and our plastic, could last thousands of years longer.",
  },
  {
    id: "c8",
    chapter: { n: 8, title: "LIFE GOES ON" },
    text: "And here's the strangest part. The Earth wouldn't stop spinning. The oceans wouldn't stop moving. And life would go on without us. Because humanity needs Earth to survive… but Earth doesn't need humanity.",
  },
];

export const TAGS: Partial<Record<string, TagKind>> = {
  c1: "DRAMATISED",
  c2: "EXPERT ESTIMATE",
  c3: "EXPERT ESTIMATE",
  c4: "EXPERT ESTIMATE",
  c5: "EXPERT ESTIMATE",
  c6: "EXPERT ESTIMATE",
  c7: "EXPERT ESTIMATE",
};

/** Caption words always set in brand amber. */
export const KEYWORDS = [
  "human",
  "vanished.",
  "chaos",
  "cars",
  "Planes",
  "crash.",
  "dark.",
  "electricity.",
  "flooded.",
  "Pets",
  "wild",
  "animals",
  "nature",
  "Grass",
  "storms,",
  "floods,",
  "Forests",
  "Animals",
  "monuments,",
  "plastic,",
  "spinning.",
  "oceans",
  "life",
  "humanity.",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF EVERY" }, { text: "HUMAN VANISHED?", color: P.amber }];

/** "TIME WITHOUT HUMANS" clock value at the end of each block (shown values interpolate between). */
export const CLOCK: Record<string, string> = {
  c1: "00:00:30",
  c2: "24 HOURS",
  c3: "1 WEEK",
  c4: "1 MONTH",
  c5: "1 YEAR",
  c6: "100 YEARS",
  c7: "10,000 YEARS",
};
