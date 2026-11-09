import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "double-oxygen";

/** The user's script (see script.md), as transcribed so block starts match the take. */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "What if the amount of oxygen in Earth's atmosphere doubled overnight?" },
  {
    id: "c1",
    chapter: { n: 1, title: "42 PERCENT" },
    text: "Right now, oxygen makes up about twenty-one percent of the air we breathe. But imagine waking up tomorrow and that number has suddenly jumped to forty-two percent. At first, you might not even notice,",
  },
  {
    id: "c2",
    chapter: { n: 2, title: "A TINY SPARK" },
    text: "but then something terrifying starts happening. Fires become much more dangerous. A tiny spark that might normally go out could suddenly ignite nearby materials. Wildfires could spread faster, and putting them out would become much harder.",
  },
  {
    id: "c3",
    chapter: { n: 3, title: "YOUR BODY" },
    text: "But what about your body? You might think twice the oxygen means twice the energy. Unfortunately, that's not how breathing works. Your blood is already nearly saturated with oxygen under normal conditions, and breathing unusually high oxygen levels for long periods can damage your lungs.",
  },
  {
    id: "c4",
    chapter: { n: 4, title: "GIANT INSECTS" },
    text: "But here's where things get really interesting. Millions of years ago, Earth's atmosphere contained more oxygen than it does today, and some insects grew to enormous sizes. Scientists believe higher oxygen levels helped make this possible because insects breathe through networks of tiny tubes.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "GIANT SPIDERS?" },
    text: "So would we suddenly have giant spiders? Not overnight. Evolution takes generations, and oxygen isn't the only factor controlling insect size. But over millions of years, ecosystems could change dramatically.",
  },
  {
    id: "c6",
    chapter: { n: 6, title: "TOO MUCH" },
    text: "And here's the craziest part: oxygen is the very thing keeping you alive, yet doubling it could make the world around you far more dangerous. Sometimes even too much of a good thing can be deadly.",
  },
];

export const TAGS: Partial<Record<string, TagKind>> = { c2: "REAL SCIENCE", c3: "REAL SCIENCE", c4: "REAL SCIENCE" };

/** Caption words always set in brand amber (Scribe spelled the numbers out). */
export const KEYWORDS = [
  "oxygen",
  "doubled",
  "doubling",
  "overnight",
  "twenty-one",
  "forty-two",
  "percent",
  "terrifying",
  "fires",
  "spark",
  "ignite",
  "wildfires",
  "faster",
  "harder",
  "body",
  "energy",
  "breathing",
  "blood",
  "saturated",
  "damage",
  "lungs",
  "interesting",
  "millions",
  "insects",
  "enormous",
  "tubes",
  "giant",
  "spiders",
  "evolution",
  "generations",
  "ecosystems",
  "dramatically",
  "craziest",
  "alive",
  "dangerous",
  "deadly",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF OUR" }, { text: "OXYGEN", color: P.amber }, { text: "DOUBLED OVERNIGHT?", size: 46 }];
