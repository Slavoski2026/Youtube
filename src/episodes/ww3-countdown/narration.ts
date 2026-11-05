import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "ww3-countdown";

/** Approved 60-second narration (see script.md). Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "In seven days, World War Three begins. And your life falls apart before a single missile is launched." },
  { id: "c1", chapter: { n: 1, title: "THE ALERT" }, text: "Day one. Your phone screams: \"Global conflict imminent.\" Supermarkets are emptied. Petrol queues stretch for miles." },
  { id: "c2", chapter: { n: 2, title: "THE CRASH" }, text: "Day two. Stock markets crash. Flights are cancelled. Borders close." },
  { id: "c3", chapter: { n: 3, title: "OFFLINE" }, text: "Day three. The internet goes down. ATMs stop working. You try calling your family. Nothing." },
  { id: "c4", chapter: { n: 4, title: "SEEK SHELTER" }, text: "Day four. Military jets roar overhead. Another alert: \"Seek shelter immediately.\"" },
  { id: "c5", chapter: { n: 5, title: "SILENCE" }, text: "Day five. The streets are empty. Shops are boarded up. And the silence is more terrifying than the noise." },
  { id: "c6", chapter: { n: 6, title: "THE LAST MEETING" }, text: "Day six. World leaders meet one last time. Then the broadcast cuts to black." },
  {
    id: "c7",
    chapter: { n: 7, title: "MIDNIGHT" },
    text: "Day seven. 11:59 PM. Your phone vibrates: \"Incoming missile warning.\" Three. Two. One. The sky turns white. And then… nothing. Because the scariest part isn't knowing when it starts. It's not knowing if you'll be there when it ends.",
  },
];

export const TAGS: Partial<Record<string, TagKind>> = { c1: "DRAMATISED" };

/** Caption words always set in brand amber (Scribe writes "III" and "11:59"). */
export const KEYWORDS = [
  "seven",
  "III",
  "missile",
  "phone",
  "imminent",
  "Supermarkets",
  "Petrol",
  "Stock",
  "crash",
  "Flights",
  "cancelled",
  "Borders",
  "internet",
  "ATMs",
  "family",
  "Nothing",
  "jets",
  "shelter",
  "immediately",
  "empty",
  "boarded",
  "silence",
  "leaders",
  "black",
  "11:59",
  "Incoming",
  "white",
  "nothing",
  "scariest",
  "ends",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF WW3" }, { text: "STARTED IN 7 DAYS?", color: P.amber }];

/** "WAR BEGINS IN" readout per block (day seven counts down live in the episode). */
export const DAYS_LEFT: Record<string, string> = { cold: "7 DAYS", c1: "6 DAYS", c2: "5 DAYS", c3: "4 DAYS", c4: "3 DAYS", c5: "2 DAYS", c6: "1 DAY" };

/** Day number for the "DAY N" stamp at each chapter start. */
export const DAY: Record<string, number> = { c1: 1, c2: 2, c3: 3, c4: 4, c5: 5, c6: 6, c7: 7 };
