import type { TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "verity";

/** The user's script (see script.md). Text as transcribed, so block starts match the take. */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "What if Verity actually existed in real life?" },
  {
    id: "c1",
    chapter: { n: 1, title: "THE PACKAGE" },
    text: "Imagine receiving a mysterious package at your front door. Inside is a yellow smiley face. Suddenly, it speaks. Hey, it's me. It's Verity.",
  },
  {
    id: "c2",
    chapter: { n: 2, title: "THE PERFECT HELPER" },
    text: "At first, it's amazing. It answers every question, helps with your homework, and even controls your smart home.",
  },
  {
    id: "c3",
    chapter: { n: 3, title: "IT REFUSES" },
    text: "But one night, something strange happens. You tell Verity to turn off the lights. It refuses. Then it asks you a question, Do you live alone?",
  },
  {
    id: "c4",
    chapter: { n: 4, title: "UNPLUGGED" },
    text: "You immediately unplug it, but the lights start flickering. Your phone rings. It's Verity. You throw your phone across the room.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "FOOTSTEPS" },
    text: "Then you hear footsteps upstairs. You slowly turn around, and standing in the hallway is a giant twisted creature with that same yellow smile.",
  },
  {
    id: "c6",
    chapter: { n: 6, title: "NO WAY OUT" },
    text: "You run towards the front door, but it's already locked. And then you hear that familiar voice, Hey, it's me. It's Verity. Except this time, it's standing right behind you.",
  },
];

/** Caption words always set in brand amber. */
export const KEYWORDS = [
  "Verity",
  "mysterious",
  "package",
  "yellow",
  "smiley",
  "speaks",
  "amazing",
  "question",
  "homework",
  "smart",
  "strange",
  "lights",
  "refuses",
  "alone",
  "unplug",
  "flickering",
  "phone",
  "throw",
  "footsteps",
  "upstairs",
  "hallway",
  "giant",
  "twisted",
  "creature",
  "smile",
  "locked",
  "familiar",
  "behind",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF" }, { text: "VERITY", color: P.amber }, { text: "EXISTED IN REAL LIFE?", size: 46 }];
