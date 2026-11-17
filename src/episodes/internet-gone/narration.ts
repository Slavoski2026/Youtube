import type { TitleLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import type { NarrationBlock } from "../../slavoski/timeline";

export const SLUG = "internet-gone";

/** The user's full script, unchanged (see script.md). Edit here and in script.md together. */
export const BLOCKS: NarrationBlock[] = [
  { id: "cold", chapter: null, text: "Imagine waking up tomorrow… and the entire internet is gone. No YouTube. No TikTok. No Google." },
  {
    id: "c1",
    chapter: { n: 1, title: "ONE MAN" },
    text: "And somehow, it's all because of one man. Jensen Huang. In this fictional scenario, the NVIDIA CEO decides he's had enough. He presses a giant red button labelled \"TURN OFF AI.\" At first, nothing happens.",
  },
  {
    id: "c2",
    chapter: { n: 2, title: "AI GOES DARK" },
    text: "Then millions of AI servers begin shutting down. Chatbots disappear. AI-generated videos stop working. Companies lose access to their most powerful computing systems.",
  },
  {
    id: "c3",
    chapter: { n: 3, title: "THE CATCH" },
    text: "But there's a problem. The internet doesn't actually run entirely on NVIDIA chips. So Jensen's button can't switch off the whole internet. Unless…",
  },
  {
    id: "c4",
    chapter: { n: 4, title: "OFFLINE WORLD" },
    text: "Every major internet provider suddenly suffers a completely separate, catastrophic failure. Now banks can't process payments. Airports lose access to online systems. Millions of businesses grind to a halt.",
  },
  {
    id: "c5",
    chapter: { n: 5, title: "HOURS LATER" },
    text: "Within hours, people are queuing outside cash machines. By day two, governments are scrambling to restore communications.",
  },
  {
    id: "c6",
    chapter: { n: 6, title: "BREAKFAST" },
    text: "And Jensen? He's sitting in his kitchen. Eating breakfast. Watching the chaos on a television that somehow still works. Because the man who helped power the AI revolution… Just accidentally sent humanity back to the offline age. And the craziest part? He still hasn't taken off his leather jacket.",
  },
];

/** Caption words always set in brand amber (Scribe writes "Nvidia", "labeled", "two"). */
export const KEYWORDS = [
  "internet",
  "gone",
  "YouTube",
  "TikTok",
  "Google",
  "Jensen",
  "Huang",
  "fictional",
  "Nvidia",
  "enough",
  "red",
  "button",
  "AI",
  "nothing",
  "servers",
  "shutting",
  "Chatbots",
  "disappear",
  "videos",
  "problem",
  "chips",
  "Jensen's",
  "unless",
  "provider",
  "catastrophic",
  "failure",
  "banks",
  "Airports",
  "businesses",
  "halt",
  "cash",
  "governments",
  "scrambling",
  "kitchen",
  "breakfast",
  "chaos",
  "television",
  "revolution",
  "offline",
  "craziest",
  "leather",
  "jacket",
];

export const TITLE: TitleLine[] = [{ text: "WHAT IF THE" }, { text: "INTERNET", color: P.amber }, { text: "DISAPPEARED?", size: 60 }];
