import type { TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "random-superpowers";

/** Approved 60 s cut (see script.md). Spelling follows the transcript ("neighbor", "color") so cues match. */
export const BLOCKS: NarrationBlock[] = [
  {
    id: "cold",
    chapter: null,
    text: "Eight billion humans have just received a random superpower. Your neighbor can fly. Your best friend can teleport. But you can only change the color of your socks.",
  },
  { id: "c1", chapter: { n: 1, title: "PURE CHAOS" }, text: "Within hours, chaos. Super strength could accidentally destroy buildings." },
  { id: "c2", chapter: { n: 2, title: "NO MORE SECRETS" }, text: "Mind readers would uncover millions of secrets, and anyone invisible would be almost impossible to catch." },
  { id: "c3", chapter: { n: 3, title: "SUPER ARMIES" }, text: "Within days, governments would recruit the most powerful. Why build fighter jets when someone can fly faster than sound?" },
  { id: "c4", chapter: { n: 4, title: "A NEW ORDER" }, text: "Your place in society wouldn't depend on wealth or education, only on the power you randomly received." },
  {
    id: "c5",
    chapter: { n: 5, title: "THE ONE" },
    text: "But among eight billion people, someone could get a power stronger than everyone's: control time, manipulate reality, steal other people's powers.",
  },
  {
    id: "c6",
    chapter: { n: 6, title: "THE LUCKY ONE" },
    text: "Humanity's greatest threat wouldn't be a disaster or an alien invasion. It would be an ordinary person who got incredibly lucky. If you could choose one superpower, what would it be?",
  },
];

/** Caption words always set in brand amber (both spellings where Scribe and the script differ). */
export const KEYWORDS = [
  "billion",
  "random",
  "superpower",
  "neighbor",
  "neighbour",
  "fly",
  "teleport",
  "socks",
  "color",
  "colour",
  "chaos",
  "strength",
  "destroy",
  "buildings",
  "Mind",
  "readers",
  "secrets",
  "invisible",
  "impossible",
  "governments",
  "recruit",
  "powerful",
  "fighter",
  "jets",
  "sound",
  "society",
  "wealth",
  "education",
  "power",
  "randomly",
  "stronger",
  "control",
  "time",
  "manipulate",
  "reality",
  "steal",
  "powers",
  "threat",
  "disaster",
  "alien",
  "invasion",
  "ordinary",
  "lucky",
  "choose",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF EVERYONE" }, { text: "GOT A SUPERPOWER?", color: P.amber, size: 68 }, { text: "A RANDOM ONE", size: 46 }];

/** The "YOUR POWER" readout spins through these, then lands on SOCK COLOUR. */
export const POWERS = ["FLIGHT", "TELEPORT", "LASER EYES", "SUPER STRENGTH", "MIND READING", "INVISIBILITY", "ICE HANDS", "SUPER SPEED", "X-RAY VISION"];
export const MY_POWER = "SOCK COLOUR";
export const SOCK_COLORS = ["#E8344A", "#3FB8E8", "#7ED957", "#B58CFF", "#FFBA58", "#FF6FB5", "#F4F4F0", "#2FE0D0"];
