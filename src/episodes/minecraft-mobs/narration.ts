import type { TagKind, TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "minecraft-mobs";

/**
 * Approved narration (see script.md). The hiss and the boom are sound effects, not spoken: the take has
 * gaps for them after "when suddenly…", after "right behind you!" and after "sound behind you…".
 */
export const BLOCKS: NarrationBlock[] = [
  {
    id: "cold",
    chapter: null,
    text: "What if Minecraft mobs suddenly spawned in real life? Imagine walking down the street when suddenly… A Creeper appears right behind you! Your neighbour's house is gone! But that's just the beginning.",
  },
  {
    id: "c1",
    chapter: { n: 1, title: "SUNSET" },
    text: "As the Sun sets, zombies start appearing across every city. Skeletons begin shooting arrows at anyone outside. And spiders the size of cars start climbing buildings!",
  },
  {
    id: "c2",
    chapter: { n: 2, title: "NOWHERE TO HIDE" },
    text: "You think hiding inside your house will save you? Think again. An Enderman teleports straight into your bedroom! You look it directly in the eyes. Big mistake. Now it's chasing you through your own house!",
  },
  {
    id: "c3",
    chapter: { n: 3, title: "THE WITHER" },
    text: "But here's where things get really bad. Someone accidentally summons the Wither. Buildings explode, streets collapse, and entire cities become battlegrounds.",
  },
  {
    id: "c4",
    chapter: { n: 4, title: "UNTIL SUNRISE" },
    text: "Humanity's only hope? Survive until sunrise. The zombies and skeletons start burning in daylight. Finally, the nightmare is over.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "ONE MORE THING" },
    text: "Until you hear a familiar sound behind you… Because Creepers don't burn in sunlight. And neither do your problems.",
  },
];

export const TAGS: Partial<Record<string, TagKind>> = {};

/** Caption words always set in brand amber. */
export const KEYWORDS = [
  "Minecraft",
  "mobs",
  "spawned",
  "real",
  "life",
  "creeper",
  "creepers",
  "gone",
  "zombies",
  "skeletons",
  "arrows",
  "spiders",
  "cars",
  "Enderman",
  "teleports",
  "bedroom",
  "eyes",
  "mistake",
  "chasing",
  "Wither",
  "explode",
  "collapse",
  "battlegrounds",
  "hope",
  "sunrise",
  "burning",
  "daylight",
  "nightmare",
  "sound",
  "sunlight",
  "problems",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF MINECRAFT" }, { text: "MOBS SPAWNED", color: P.amber }, { text: "IN REAL LIFE?", size: 46 }];
