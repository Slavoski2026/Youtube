import type { TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "strong-girlfriend";

/** The user's full script, unchanged (see script.md). Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "Imagine waking up tomorrow… And your girlfriend is suddenly ten times stronger than you." },
  {
    id: "c1",
    chapter: { n: 1, title: "THE JAR" },
    text: "At first, you think nothing has changed. Until she opens a jar. And accidentally crushes it. You laugh. She laughs. Then she goes to hug you. Three ribs crack.",
  },
  { id: "c2", chapter: { n: 2, title: "SHOPPING" }, text: "By lunchtime, she's carrying all the shopping bags. Including you." },
  {
    id: "c3",
    chapter: { n: 3, title: "THE GYM" },
    text: "You decide it's time to hit the gym. You load 100 kilograms onto the bench press. She asks if that's your warm-up. Then casually lifts the entire bench. With you still lying on it. Your gym membership suddenly feels pointless.",
  },
  {
    id: "c4",
    chapter: { n: 4, title: "MOVING DAY" },
    text: "But things get worse. You get into an argument about who has to carry the sofa upstairs. She picks up the sofa. Then the fridge. Then your car.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "GONE VIRAL" },
    text: "By day three, she's gone viral. Millions of people are watching her deadlift a small aircraft. Scientists want to study her. The military wants to recruit her. And you? You're standing in the background. Holding her water bottle.",
  },
  {
    id: "c6",
    chapter: { n: 6, title: "THE JAR, AGAIN" },
    text: "But here's the real problem. One evening, she looks at you and says… \"Babe, can you open this jar?\" You finally have your moment. You grab the lid. You twist. Nothing. She takes it back. And opens it with two fingers. Congratulations. You're now the princess in the relationship.",
  },
];

/** Caption words always set in brand amber (Scribe wrote "one hundred" in words). */
export const KEYWORDS = [
  "girlfriend",
  "ten",
  "stronger",
  "jar",
  "crushes",
  "hug",
  "ribs",
  "crack",
  "shopping",
  "bags",
  "including",
  "gym",
  "hundred",
  "kilograms",
  "bench",
  "warm-up",
  "entire",
  "pointless",
  "worse",
  "sofa",
  "fridge",
  "car",
  "viral",
  "Millions",
  "deadlift",
  "aircraft",
  "Scientists",
  "military",
  "recruit",
  "background",
  "water",
  "bottle",
  "problem",
  "Babe",
  "moment",
  "twist",
  "Nothing",
  "two",
  "fingers",
  "Congratulations",
  "princess",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF YOUR" }, { text: "GIRLFRIEND", color: P.amber }, { text: "WAS STRONGER?", size: 60 }];
