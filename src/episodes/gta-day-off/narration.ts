import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "gta-day-off";

/** Approved narration (the user's full script, see script.md). Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "It's November 19th, 2026. GTA 6 has finally arrived. But what if millions of people decided to stay home and play it?" },
  {
    id: "c1",
    chapter: { n: 1, title: "EMPTY DESKS" },
    text: "Offices would be missing employees. Managers would be flooded with sick calls. And some businesses could struggle to cover their shifts.",
  },
  {
    id: "c2",
    chapter: { n: 2, title: "THE REAL NUMBERS" },
    text: "Sounds exaggerated? A real survey found that 18% of salaried American workers planned to take the day off for GTA 6. And leave requests for November 19 were already running nearly 13% higher than comparable dates.",
  },
  {
    id: "c3",
    chapter: { n: 3, title: "LOST HOURS" },
    text: "Now imagine the economic impact. Millions of working hours could be lost. Businesses might need overtime staff, delay appointments, or postpone projects.",
  },
  { id: "c4", chapter: { n: 4, title: "THE WINNERS" }, text: "Meanwhile, gaming retailers, streamers, and content creators could benefit from the enormous attention." },
  {
    id: "c5",
    chapter: { n: 5, title: "THE CATCH" },
    text: "But taking a day off doesn't automatically mean lost economic output. Some work simply gets done later. And the money spent on gaming still circulates through the economy.",
  },
  {
    id: "c6",
    chapter: { n: 6, title: "ONE GAME" },
    text: "So GTA 6 probably won't bring the world to a standstill. But November 19th could reveal something extraordinary. Just how much influence a single video game has over the real world.",
  },
];

/** c2 quotes BambooHR's survey and leave-request data (shown on screen as the source). */
export const TAGS: Partial<Record<string, TagKind>> = { c2: "REAL DATA" };

/** Caption words always set in brand amber (Scribe writes "VI", "eighteen percent", "nineteenth"). */
export const KEYWORDS = [
  "November",
  "nineteenth",
  "19th",
  "GTA",
  "VI",
  "6",
  "arrived",
  "millions",
  "home",
  "play",
  "Offices",
  "missing",
  "employees",
  "managers",
  "flooded",
  "sick",
  "calls",
  "businesses",
  "shifts",
  "exaggerated",
  "survey",
  "eighteen",
  "percent",
  "18%",
  "day",
  "off",
  "leave",
  "requests",
  "thirteen",
  "13%",
  "higher",
  "economic",
  "impact",
  "Millions",
  "hours",
  "lost",
  "overtime",
  "delay",
  "postpone",
  "gaming",
  "retailers",
  "streamers",
  "creators",
  "benefit",
  "output",
  "later",
  "money",
  "circulates",
  "economy",
  "standstill",
  "extraordinary",
  "influence",
  "game",
  "real",
  "world",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF EVERYONE" }, { text: "SKIPPED WORK", color: P.amber }, { text: "FOR GTA 6?", size: 46 }];

/** Source line shown with the numbers in chapter 2. */
export const SOURCE = "SOURCE: BAMBOOHR SURVEY & PTO DATA, 2026";
