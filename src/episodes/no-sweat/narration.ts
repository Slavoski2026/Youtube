import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "no-sweat";

/** The user's script, unchanged (see script.md). Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "What if every human on Earth suddenly lost the ability to SWEAT?" },
  {
    id: "c1",
    chapter: { n: 1, title: "NO MORE SWEAT" },
    text: "At first, you might think that's amazing. No sweaty clothes. No embarrassing stains. No more body odour from sweat.",
  },
  {
    id: "c2",
    chapter: { n: 2, title: "THE BODY'S AIR CON" },
    text: "But there's one terrifying problem. Your body needs to cool itself down. And sweating is one of its most powerful cooling systems. When sweat evaporates from your skin, it carries heat away.",
  },
  {
    id: "c3",
    chapter: { n: 3, title: "RUNNING HOT" },
    text: "Without it, even something as simple as running could become dangerous. Your body temperature could start climbing. Your heart would work harder to move heat towards your skin.",
  },
  {
    id: "c4",
    chapter: { n: 4, title: "HEATSTROKE" },
    text: "And in extreme conditions, you could develop heatstroke. Your brain could malfunction. Your organs could begin failing.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "NOT SO FAST" },
    text: "But here's something surprising. You wouldn't instantly overheat. Your body could still lose heat through other mechanisms, especially in cooler environments.",
  },
  {
    id: "c6",
    chapter: { n: 6, title: "A NEW WAY TO LIVE" },
    text: "The real danger would come during exercise, heatwaves, or physically demanding work. And across the planet, millions of people would need to change how they live.",
  },
  {
    id: "c7",
    chapter: { n: 7, title: "WHY WE SWEAT" },
    text: "Because sweating isn't just something annoying your body does. It's one of the reasons you can survive the heat.",
  },
];

export const TAGS: Partial<Record<string, TagKind>> = { c2: "REAL SCIENCE", c4: "REAL SCIENCE", c5: "REAL SCIENCE" };

/** Caption words always set in brand amber (Scribe wrote "odor" and "heat waves"). */
export const KEYWORDS = [
  "sweat",
  "sweaty",
  "sweating",
  "amazing",
  "clothes",
  "stains",
  "odour",
  "odor",
  "terrifying",
  "cool",
  "cooling",
  "evaporates",
  "heat",
  "running",
  "dangerous",
  "temperature",
  "climbing",
  "heart",
  "extreme",
  "heatstroke",
  "brain",
  "malfunction",
  "organs",
  "failing",
  "surprising",
  "overheat",
  "mechanisms",
  "cooler",
  "danger",
  "exercise",
  "heatwaves",
  "waves",
  "demanding",
  "planet",
  "millions",
  "change",
  "survive",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF NOBODY" }, { text: "COULD SWEAT?", color: P.amber }];
