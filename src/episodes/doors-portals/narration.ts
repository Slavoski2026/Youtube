import type { TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "doors-portals";

/** The user's full script, unchanged (see script.md). Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "At exactly 9 AM, every door on Earth suddenly becomes a portal to a random location." },
  {
    id: "c1",
    chapter: { n: 1, title: "THE FIRST DOORS" },
    text: "A man in London opens his bathroom door… And walks straight into the Sahara Desert. Meanwhile, a woman in New York opens her fridge… And finds herself staring at a penguin in Antarctica.",
  },
  {
    id: "c2",
    chapter: { n: 2, title: "CHAOS" },
    text: "Within minutes, complete chaos breaks out. People are opening their front doors and ending up thousands of kilometres away. One man walks into a supermarket in Tokyo… And somehow exits inside the White House.",
  },
  {
    id: "c3",
    chapter: { n: 3, title: "STOP OPENING DOORS" },
    text: "By midday, governments order everyone to stop opening doors. But there’s a problem. Hospitals can’t access operating rooms. Prisoners are accidentally escaping. And millions of people are now stranded on completely different continents.",
  },
  {
    id: "c4",
    chapter: { n: 4, title: "FREE TRAVEL" },
    text: "By day two, scientists discover something incredible. Every door leads somewhere different each time it’s opened. People begin using doors to travel the world for free. Airlines lose millions. Tourists are appearing inside military bases.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "SEVENTEEN TIMES" },
    text: "And one extremely unlucky man has opened his bedroom door seventeen times… Only to end up in the ocean every single time.",
  },
  {
    id: "c6",
    chapter: { n: 6, title: "THE BLACK ROOM" },
    text: "But on day three, something strange happens. A scientist in Switzerland opens a laboratory door. And discovers a completely black room. No walls. No floor. Just darkness.",
  },
  {
    id: "c7",
    chapter: { n: 7, title: "THE VOID" },
    text: "He sends a camera through. The camera records something impossible. Thousands of doors floating in an endless void. And behind every single door… Is a different version of Earth.",
  },
  {
    id: "c8",
    chapter: { n: 8, title: "THE OTHER SIDE" },
    text: "But then, one of those doors opens from the other side. And something begins stepping through. Because apparently… Humanity wasn’t the only civilisation opening doors.",
  },
];

/** Caption words always set in brand amber (Scribe spellings and digit forms included). */
export const KEYWORDS = [
  "9", "nine", "door", "doors", "portal", "random", "London", "bathroom", "Sahara", "Desert", "New", "York", "fridge", "penguin",
  "Antarctica", "chaos", "front", "thousands", "kilometres", "kilometers", "supermarket", "Tokyo", "White", "House", "midday",
  "stop", "problem", "Hospitals", "operating", "Prisoners", "escaping", "millions", "stranded", "continents", "two", "three",
  "scientists", "incredible", "different", "travel", "free", "Airlines", "Tourists", "military", "bases", "unlucky", "bedroom",
  "seventeen", "17", "ocean", "strange", "Switzerland", "laboratory", "black", "walls", "floor", "darkness", "camera",
  "impossible", "floating", "void", "Earth", "other", "side", "stepping", "Humanity", "civilisation", "civilization",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF EVERY" }, { text: "DOOR", color: P.amber }, { text: "BECAME A PORTAL?", size: 46 }];

/** The DAY / time readout per block (cold open ticks from 08:59 to 09:00 on "nine"). */
export const CLOCK: Record<string, [string, string]> = {
  cold: ["DAY 1", "09:00"],
  c1: ["DAY 1", "09:00"],
  c2: ["DAY 1", "09:07"],
  c3: ["DAY 1", "12:00"],
  c4: ["DAY 2", "09:00"],
  c5: ["DAY 2", "17:20"],
  c6: ["DAY 3", "18:40"],
  c7: ["DAY 3", "18:52"],
  c8: ["DAY 3", "??:??"],
};
