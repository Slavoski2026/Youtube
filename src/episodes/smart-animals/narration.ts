import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "smart-animals";

/** Approved 60-second narration (see script.md). Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "What if every animal suddenly became as smart as a human?" },
  {
    id: "c1",
    chapter: { n: 1, title: "THE PIGEON" },
    text: "Imagine waking up to a pigeon staring at you. Then it picks up a rock… and writes on the pavement.",
  },
  {
    id: "c2",
    chapter: { n: 2, title: "WITHIN MINUTES" },
    text: "Within minutes, dogs understand every word you say. Cats realise they've had free food and accommodation their entire lives. And an octopus is already planning its escape.",
  },
  { id: "c3", chapter: { n: 3, title: "ONE HOUR IN" }, text: "After one hour, chimpanzees start organising. Crows become terrifyingly clever." },
  {
    id: "c4",
    chapter: { n: 4, title: "THE GREAT ESCAPE" },
    text: "After twenty-four hours, billions of farm animals understand exactly why we keep them. And they're not happy. Cows escape. Pigs open gates. Chickens plan mass breakouts.",
  },
  { id: "c5", chapter: { n: 5, title: "BENEATH THE CITY" }, text: "And rats? Billions of them, under our cities. And now they understand electricity." },
  {
    id: "c6",
    chapter: { n: 6, title: "ONE WEEK LATER" },
    text: "After one week, governments must decide: should animals have human rights? Some might want peace. Others want revenge.",
  },
  {
    id: "c7",
    chapter: { n: 7, title: "THE SMARTEST SPECIES" },
    text: "So what happens when we're no longer the smartest species in the room? And your cat looks you dead in the eyes and says… \"Right. About that neutering appointment.\"",
  },
];

export const TAGS: Partial<Record<string, TagKind>> = {
  c1: "DRAMATISED",
  c4: "EXPERT ESTIMATE",
  c5: "EXPERT ESTIMATE",
};

/** Caption words always set in brand amber. */
export const KEYWORDS = [
  "animal",
  "smart",
  "pigeon",
  "rock",
  "pavement.",
  "dogs",
  "word",
  "Cats",
  "free",
  "octopus",
  "escape.",
  "chimpanzees",
  "organising.",
  "Crows",
  "terrifyingly",
  "billions",
  "farm",
  "happy.",
  "Cows",
  "Pigs",
  "gates.",
  "Chickens",
  "breakouts,",
  "rats?",
  "Billions",
  "electricity.",
  "governments",
  "rights?",
  "peace.",
  "revenge.",
  "smartest",
  "cat",
  "eyes",
  "neutering",
];

export const TITLE: TitleLine[] = [
  { text: "WHAT IF EVERY" },
  { text: "ANIMAL GOT SMART?", color: P.amber },
];

/** "TIME SINCE THE CHANGE" readout per block. */
export const CLOCK: Record<string, string> = {
  c1: "1 MIN",
  c2: "5 MIN",
  c3: "1 HOUR",
  c4: "24 HOURS",
  c5: "24 HOURS",
  c6: "1 WEEK",
  c7: "1 WEEK",
};
