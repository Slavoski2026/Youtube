import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "no-voices";

/** Approved narration (see script.md): the user's script, unchanged. */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "Tomorrow morning, eight billion people wake up… And nobody can speak. Not a single word." },
  {
    id: "c1",
    chapter: { n: 1, title: "SILENCE" },
    text: "At first, everyone thinks they've lost their voice. But then the emergency calls start failing. Pilots can't speak to air traffic controllers. Doctors can't communicate verbally during emergencies. And millions of people realise they can't even call for help.",
  },
  {
    id: "c2",
    chapter: { n: 2, title: "THE BRAIN STILL KNOWS" },
    text: "But here's where things get really strange. Your brain still knows every word you've ever learned. Your vocal cords might even be perfectly healthy. But somehow, your ability to produce speech has vanished.",
  },
  {
    id: "c3",
    chapter: { n: 3, title: "A NEW LANGUAGE" },
    text: "Within hours, people turn to texting, writing, and sign language. Phones become more important than ever. And people who already communicate without speech suddenly have skills the rest of the world desperately needs.",
  },
  { id: "c4", chapter: { n: 4, title: "DANGER" }, text: "But imagine trying to warn someone about danger… When they're not looking at you." },
  {
    id: "c5",
    chapter: { n: 5, title: "TO BE HEARD" },
    text: "Humanity wouldn't lose its intelligence. It wouldn't even lose language. It would lose something we've depended on for thousands of years. The ability to be heard.",
  },
];

export const TAGS: Partial<Record<string, TagKind>> = { c2: "HYPOTHESIS" };

/** Caption words always set in brand amber. */
export const KEYWORDS = [
  "eight", "billion", "8", "nobody", "speak", "word", "voice", "emergency", "failing", "pilots", "controllers", "doctors",
  "emergencies", "millions", "help", "strange", "brain", "vocal", "cords", "healthy", "speech", "vanished", "texting",
  "writing", "sign", "language", "phones", "skills", "needs", "warn", "danger", "looking", "intelligence", "thousands",
  "heard",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF NOBODY" }, { text: "COULD SPEAK?", color: P.amber }];

/** VOICES readout: 8,000,000,000 until "nobody", then racing to 0 by the end of "word". */
export const VOICES = 8_000_000_000;
