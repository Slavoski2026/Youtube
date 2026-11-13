import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "no-fear";

/** The user's script, trimmed to ~59 s (they asked me to pick the version most likely to go viral). See script.md. */
export const BLOCKS: NarrationBlock[] = [
  {
    id: "cold",
    chapter: null,
    text: "What if every human on Earth suddenly lost the ability to feel fear? Imagine standing on top of a skyscraper, looking straight down… And feeling absolutely nothing.",
  },
  { id: "c1", chapter: { n: 1, title: "NO PANIC" }, text: "No panic. Not even a racing heartbeat. Sounds like a superpower, right?" },
  {
    id: "c2",
    chapter: { n: 2, title: "RISK" },
    text: "But within hours, the consequences could be terrifying. People might start taking risks they'd normally avoid. Dangerous animals? No longer frightening. Extreme heights? Just another view.",
  },
  {
    id: "c3",
    chapter: { n: 3, title: "THE AMYGDALA" },
    text: "But here's what science tells us. Deep inside your brain, a structure called the amygdala helps process threats and fear. Scientists have studied rare patients with damage there who feel dramatically less fear.",
  },
  {
    id: "c4",
    chapter: { n: 4, title: "NO WARNING" },
    text: "But losing fear doesn't mean losing intelligence. You could still recognise danger, feel pain, and understand that something might kill you. You just wouldn't feel the same emotional warning.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "WHY WE FEAR" },
    text: "Fear isn't something that holds humanity back. It's a survival mechanism shaped by millions of years of evolution. So the next time you're scared of something… Remember. That fear might be the very reason you're still alive.",
  },
];

export const TAGS: Partial<Record<string, TagKind>> = { c3: "REAL SCIENCE" };

/** Caption words always set in brand amber. */
export const KEYWORDS = [
  "fear", "skyscraper", "down", "nothing", "panic", "heartbeat", "superpower", "terrifying", "risks", "dangerous", "animals",
  "frightening", "extreme", "heights", "view", "science", "brain", "amygdala", "threats", "patients", "damage", "intelligence",
  "danger", "pain", "kill", "warning", "survival", "evolution", "scared", "remember", "alive",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF NOBODY" }, { text: "COULD FEEL FEAR?", color: P.amber }];
