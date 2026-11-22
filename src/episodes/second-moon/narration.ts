import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "second-moon";

/** Approved narration (see script.md). Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "What if Earth suddenly had a second Moon?" },
  {
    id: "c1",
    chapter: { n: 1, title: "TWO MOONS" },
    text: "At first, it would look incredible. Two enormous moons lighting up the night sky. But within hours, scientists would begin to panic.",
  },
  {
    id: "c2",
    chapter: { n: 2, title: "RISING TIDES" },
    text: "Because the Moon doesn't just light up our sky. Its gravity helps control Earth's tides. And now, another massive object is pulling on our oceans. Depending on its size and distance, coastal cities could experience catastrophic flooding.",
  },
  {
    id: "c3",
    chapter: { n: 3, title: "TUG OF WAR" },
    text: "But that's only the beginning. The two moons would also pull on each other. Their orbits could become unstable.",
  },
  {
    id: "c4",
    chapter: { n: 4, title: "TORN APART" },
    text: "And if they got too close, gravity could tear one of them apart. Sending enormous chunks of rock hurtling through space. Some of those fragments could eventually strike Earth.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "COLLISION" },
    text: "But there's an even more terrifying possibility. The second Moon could collide with our original Moon. Creating a gigantic cloud of debris around our planet.",
  },
  {
    id: "c6",
    chapter: { n: 6, title: "THE REMAINS" },
    text: "And suddenly, humanity wouldn't be looking up at two beautiful moons anymore. We'd be looking up at the remains of a cosmic disaster. Because the most dangerous thing about a second Moon isn't having two. It's what happens when one of them gets too close.",
  },
];

export const TAGS: Partial<Record<string, TagKind>> = { c2: "REAL PHYSICS", c4: "REAL PHYSICS", c5: "HYPOTHESIS" };

/** Caption words always set in brand amber. */
export const KEYWORDS = [
  "Earth",
  "second",
  "moon",
  "Moon",
  "moons",
  "incredible",
  "enormous",
  "panic",
  "gravity",
  "tides",
  "massive",
  "oceans",
  "coastal",
  "catastrophic",
  "flooding",
  "beginning",
  "pull",
  "orbits",
  "unstable",
  "close",
  "tear",
  "apart",
  "chunks",
  "rock",
  "fragments",
  "strike",
  "terrifying",
  "collide",
  "original",
  "debris",
  "planet",
  "humanity",
  "remains",
  "cosmic",
  "disaster",
  "dangerous",
  "two",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF EARTH HAD" }, { text: "A SECOND MOON?", color: P.amber }];

/** DISTANCE BETWEEN MOONS readout (km): steady, then falling to 0 at the collision. */
export const MOON_GAP = 150000;
