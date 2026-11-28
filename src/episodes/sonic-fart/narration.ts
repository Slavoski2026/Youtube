import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "sonic-fart";

/** Approved narration (the user's script, trimmed at their request; see script.md). */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "What would happen if you farted at 767 miles per hour? That's the speed of sound." },
  {
    id: "c1",
    chapter: { n: 1, title: "SOUND BARRIER" },
    text: "First, an incredibly loud blast. If the gas exceeded the speed of sound, it could even generate a tiny sonic boom. Congratulations, your backside has just broken the sound barrier.",
  },
  {
    id: "c2",
    chapter: { n: 2, title: "UNDER PRESSURE" },
    text: "But things get worse. To accelerate gas to that speed, your body would need to generate enormous pressure. You could suffer catastrophic internal injuries before the fart even escaped.",
  },
  {
    id: "c3",
    chapter: { n: 3, title: "INDESTRUCTIBLE" },
    text: "But let's assume your body was somehow indestructible. Would you launch yourself across the room? Unfortunately, no.",
  },
  {
    id: "c4",
    chapter: { n: 4, title: "WORST ROCKET EVER" },
    text: "Even at the speed of sound, a normal fart contains far too little mass to propel you any meaningful distance. You'd become the world's most disappointing rocket engine.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "THE FALLOUT" },
    text: "You wouldn't break the laws of physics, you'd probably just break your trousers, and you'd never be invited to a family dinner again.",
  },
];

export const TAGS: Partial<Record<string, TagKind>> = { c1: "REAL PHYSICS", c2: "REAL SCIENCE", c3: "HYPOTHESIS", c4: "REAL PHYSICS", c5: "DRAMATISED" };

/** Caption words always set in brand amber. */
export const KEYWORDS = [
  "farted",
  "fart",
  "767",
  "miles",
  "hour",
  "speed",
  "sound",
  "loud",
  "blast",
  "gas",
  "sonic",
  "boom",
  "Congratulations",
  "backside",
  "barrier",
  "worse",
  "pressure",
  "enormous",
  "catastrophic",
  "injuries",
  "indestructible",
  "launch",
  "room",
  "no",
  "mass",
  "propel",
  "disappointing",
  "rocket",
  "engine",
  "physics",
  "trousers",
  "never",
  "family",
  "dinner",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF YOU" }, { text: "FARTED", color: P.amber }, { text: "AT THE SPEED OF SOUND?", size: 46 }];

/** The speed of sound at sea level, 20 °C (343 m/s). */
export const MACH1_MPH = 767;
