import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "black-hole";

/** Approved narration (see script.md). Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "What if one night, a black hole suddenly appeared right next to Earth?" },
  {
    id: "c1",
    chapter: { n: 1, title: "OUT OF NOWHERE" },
    text: "No flash. No sound. Just a black hole as heavy as our entire planet, crushed to the size of a marble, about as far away as the Moon.",
  },
  {
    id: "c2",
    chapter: { n: 2, title: "THE INVISIBLE GUEST" },
    text: "Look up, and you'd see nothing. It gives off no light. Only giant telescopes would spot the stars behind it bending out of place.",
  },
  {
    id: "c3",
    chapter: { n: 3, title: "FREE FALL" },
    text: "But Earth feels it. It pulls on us as hard as we pull on it, so we start falling toward each other. Impact: in three and a half days.",
  },
  {
    id: "c4",
    chapter: { n: 4, title: "THE STRETCH" },
    text: "You wouldn't feel the fall. You'd feel the stretch. Its tides are eighty times stronger than the Moon's, and twice a day the ocean surges into coastal cities.",
  },
  { id: "c5", chapter: { n: 5, title: "A RUNAWAY MOON" }, text: "The Moon, caught in the tug of war, gets flung into a wild new orbit." },
  {
    id: "c6",
    chapter: { n: 6, title: "THE GROUND BENDS" },
    text: "By day three, the tides are a thousand times stronger. The ground itself bends. Earthquakes everywhere. Volcanoes wake up.",
  },
  {
    id: "c7",
    chapter: { n: 7, title: "THE LAST HOURS" },
    text: "The first half of the fall took almost three days. The second half takes just fifteen hours.",
  },
  {
    id: "c8",
    chapter: { n: 8, title: "TORN APART" },
    text: "In the final minutes, its pull beats Earth's own gravity, and our planet is ripped apart.",
  },
  {
    id: "c9",
    chapter: { n: 9, title: "WHAT'S LEFT" },
    text: "Earth becomes a glowing disk of rock and gas, swirling around a marble. Swallowing it all could take millions of years.",
  },
  {
    id: "outro",
    chapter: null,
    text: "The good news? The closest black hole we know of is about fifteen hundred light-years away. For now, the Moon keeps its job.",
  },
];

export const TAGS: Partial<Record<string, TagKind>> = {
  c1: "REAL PHYSICS",
  c2: "REAL PHYSICS",
  c3: "REAL PHYSICS",
  c4: "REAL PHYSICS",
  c5: "DRAMATISED",
  c6: "REAL PHYSICS",
  c7: "REAL PHYSICS",
  c8: "REAL PHYSICS",
  c9: "HYPOTHESIS",
};

/** Caption words always set in brand amber. */
export const KEYWORDS = [
  "black",
  "hole",
  "Earth?",
  "Earth",
  "marble,",
  "marble.",
  "Moon.",
  "Moon,",
  "Moon's,",
  "telescopes",
  "falling",
  "Impact:",
  "stretch.",
  "eighty",
  "ocean",
  "flung",
  "thousand",
  "Earthquakes",
  "Volcanoes",
  "fifteen",
  "gravity,",
  "ripped",
  "disk",
  "millions",
  "light-years",
];

export const TITLE: TitleLine[] = [
  { text: "WHAT IF A" },
  { text: "BLACK HOLE", color: P.amber },
  { text: "APPEARED NEXT TO EARTH?", size: 46 },
];
