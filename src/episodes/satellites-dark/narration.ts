import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "satellites-dark";

/** Approved narration (see script.md). Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "What if EVERY satellite orbiting Earth suddenly stopped working?" },
  {
    id: "c1",
    chapter: { n: 1, title: "NO SIGNAL" },
    text: "Within seconds, GPS signals disappear. Your phone can still use maps, but it can no longer pinpoint your location using satellites. Planes and ships lose satellite navigation, forcing them to rely on backup systems.",
  },
  {
    id: "c2",
    chapter: { n: 2, title: "LOST TIME" },
    text: "But here's where things get serious. GPS doesn't just tell you where you are. It also provides incredibly precise timing used by mobile networks, financial systems, and power grids. Without it, systems lacking reliable backups could start experiencing disruptions.",
  },
  {
    id: "c3",
    chapter: { n: 3, title: "GOING DARK" },
    text: "Meanwhile, satellite television goes dark, remote communities lose vital communications, and meteorologists lose important weather observations. Tracking hurricanes and predicting dangerous storms becomes much harder.",
  },
  {
    id: "c4",
    chapter: { n: 4, title: "NO EARLY WARNING" },
    text: "And here's something terrifying. Satellites also help detect missile launches. Without them, countries lose a crucial early-warning capability.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "SILENT ORBIT" },
    text: "But the satellites haven't disappeared. They're still orbiting Earth, completely silent. And if we couldn't repair or replace them? Humanity would have to rebuild huge parts of its technology infrastructure. All because thousands of machines stopped talking to Earth.",
  },
];

export const TAGS: Partial<Record<string, TagKind>> = { c2: "REAL SCIENCE", c4: "REAL SCIENCE" };

/** Caption words always set in brand amber. */
export const KEYWORDS = [
  "every",
  "satellite",
  "satellites",
  "stopped",
  "working",
  "GPS",
  "disappear",
  "phone",
  "location",
  "Planes",
  "ships",
  "navigation",
  "backup",
  "serious",
  "timing",
  "mobile",
  "networks",
  "financial",
  "power",
  "grids",
  "disruptions",
  "television",
  "dark",
  "remote",
  "communications",
  "meteorologists",
  "weather",
  "hurricanes",
  "storms",
  "terrifying",
  "missile",
  "launches",
  "warning",
  "silent",
  "repair",
  "replace",
  "rebuild",
  "infrastructure",
  "thousands",
  "machines",
  "talking",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF EVERY" }, { text: "SATELLITE", color: P.amber }, { text: "STOPPED WORKING?", size: 46 }];

/** "ACTIVE SATELLITES" readout: counts down from about 12,000 to 0 in the cold open. */
export const SAT_COUNT = 12000;
