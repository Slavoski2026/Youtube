import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "shield-down";

/** Approved narration (the user's full script, see script.md). Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "Earth has an invisible shield. And if it disappeared tomorrow, we'd have just 24 hours without it." },
  { id: "c1", chapter: { n: 1, title: "ABSOLUTELY NOTHING" }, text: "The first thing you'd notice? Absolutely nothing." },
  {
    id: "c2",
    chapter: { n: 2, title: "THE SHIELD IS DOWN" },
    text: "But thousands of kilometres above you, everything would be changing. Charged particles from the Sun would interact with Earth's atmosphere and satellites differently.",
  },
  { id: "c3", chapter: { n: 3, title: "RADIATION" }, text: "Astronauts could face dangerous radiation exposure." },
  {
    id: "c4",
    chapter: { n: 4, title: "SOLAR STORM" },
    text: "And if a powerful solar storm struck at the same time, satellites and communications systems could suffer serious disruption.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "THE LONG GAME" },
    text: "But here's where it gets terrifying. Earth's magnetic field doesn't just protect technology. Over geological timescales, it also influences how our planet interacts with the solar wind.",
  },
  { id: "c6", chapter: { n: 6, title: "STILL BREATHING" }, text: "Fortunately, losing it for one day wouldn't make our atmosphere disappear. And you wouldn't suddenly burn alive." },
  {
    id: "c7",
    chapter: { n: 7, title: "EXPOSED" },
    text: "But imagine looking up at the sky, knowing that one of Earth's greatest natural defences had vanished. For 24 hours, our planet would be far more exposed to the dangers of space. And the scariest part? You might never even realise it happened.",
  },
];

export const TAGS: Partial<Record<string, TagKind>> = { c3: "REAL SCIENCE", c5: "REAL SCIENCE", c6: "REAL SCIENCE" };

/** Caption words always set in brand amber (Scribe spells them the US way and writes "twenty-four"). */
export const KEYWORDS = [
  "invisible",
  "shield",
  "disappeared",
  "twenty-four",
  "24",
  "hours",
  "nothing",
  "thousands",
  "kilometers",
  "kilometres",
  "changing",
  "Charged",
  "particles",
  "Sun",
  "atmosphere",
  "satellites",
  "Astronauts",
  "dangerous",
  "radiation",
  "solar",
  "storm",
  "communication",
  "communications",
  "serious",
  "disruption",
  "terrifying",
  "magnetic",
  "field",
  "technology",
  "geological",
  "wind",
  "Fortunately",
  "disappear",
  "burn",
  "alive",
  "sky",
  "defenses",
  "defences",
  "vanished",
  "exposed",
  "space",
  "scariest",
  "never",
  "realize",
  "realise",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF EARTH" }, { text: "LOST ITS SHIELD?", color: P.amber }, { text: "FOR 24 HOURS", size: 46 }];

/** Clock hour when the shield goes down (the morning); the day follows the "SHIELD DOWN FOR" readout. */
export const START_HOUR = 7;
