import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "no-pain";

/** The user's script (see script.md), as transcribed so block starts match the take. */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "What if every human on Earth suddenly lost the ability to feel pain?" },
  {
    id: "c1",
    chapter: { n: 1, title: "FEELING NOTHING" },
    text: "Imagine waking up tomorrow, punching a wall, and feeling absolutely nothing. Sounds like a superpower, right? Well, scientists know something terrifying. Pain is actually one of the reasons you're still alive.",
  },
  {
    id: "c2",
    chapter: { n: 2, title: "THE FIRST HOURS" },
    text: "Within hours, people would start injuring themselves without even realizing it. Imagine accidentally touching a boiling hot pan. Normally, you'd pull your hand away instantly. But without pain, you might not notice until your skin was seriously burned.",
  },
  {
    id: "c3",
    chapter: { n: 3, title: "HIDDEN DAMAGE" },
    text: "And that's just the beginning. Athletes could keep running on broken bones. Children could injure themselves without knowing. And dangerous infections might go unnoticed because the usual painful warning signs are missing.",
  },
  {
    id: "c4",
    chapter: { n: 4, title: "A REAL CONDITION" },
    text: "But here's where things get really interesting. There are actually people born with a rare condition called congenital insensitivity to pain. They can experience serious injuries without the normal pain warning, and many need to constantly check their bodies for damage.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "EIGHT BILLION" },
    text: "Now imagine this happening to eight billion people. Hospitals would face enormous challenges. Doctors would have to rely much more heavily on examinations and medical tests. And everyday activities could become surprisingly dangerous.",
  },
  {
    id: "c6",
    chapter: { n: 6, title: "THE ALARM SYSTEM" },
    text: "Because here's the terrifying truth: pain isn't your body's enemy. It's your body's alarm system. And without it, you might not realize something is killing you until it's too late",
  },
];

export const TAGS: Partial<Record<string, TagKind>> = { c4: "REAL SCIENCE" };

/** Caption words always set in brand amber. */
export const KEYWORDS = [
  "pain",
  "lost",
  "punching",
  "wall",
  "nothing",
  "superpower",
  "terrifying",
  "alive",
  "injuring",
  "injure",
  "boiling",
  "hot",
  "pan",
  "instantly",
  "burned",
  "athletes",
  "broken",
  "bones",
  "children",
  "infections",
  "warning",
  "interesting",
  "rare",
  "congenital",
  "insensitivity",
  "injuries",
  "damage",
  "eight",
  "billion",
  "hospitals",
  "doctors",
  "dangerous",
  "enemy",
  "alarm",
  "killing",
  "late",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF YOU" }, { text: "FELT NO PAIN?", color: P.amber }, { text: "EVERY HUMAN ON EARTH", size: 46 }];
