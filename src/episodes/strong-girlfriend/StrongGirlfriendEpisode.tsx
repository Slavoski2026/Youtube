/**
 * "What If Your Girlfriend Was Stronger Than You?" — SLAVOSKI, ep. 9. ~79 s (the user chose the full
 * script), "mid" detail. Comedy, non-graphic: the ribs are a cartoon CRACK! burst.
 * The hook opens on her spoon folding at breakfast, not Earth.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { loadHouseFonts } from "../../slavoski/fonts";
import { PostFxProvider } from "../../slavoski/postfx";
import { BrandLockup, EndCard, Readout, TitleCard } from "../../slavoski/Overlays";
import { Soundtrack, type Sfx } from "../../slavoski/Soundtrack";
import { estimateManifest, scheduleShots, shotAt, wordAt } from "../../slavoski/timeline";
import { WordCaptions } from "../../slavoski/WordCaptions";
import { BLOCKS, KEYWORDS, SLUG, TITLE } from "./narration";
import { Stamp } from "./props";
import { SHOTS } from "./shots";

loadHouseFonts();

export type StrongGirlfriendProps = VoiceoverProps;
export const estimatedStrongGirlfriend = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

/** YOUR DIGNITY readout: drops a step on every humiliation (word, value after it). */
const DIGNITY: [string, number][] = [
  ["crushes", 92],
  ["crack", 80],
  ["including", 64],
  ["lying", 48],
  ["pointless", 40],
  ["car", 30],
  ["bottle", 14],
  ["Nothing", 7],
  ["princess", 0],
];

export const StrongGirlfriendEpisode: React.FC<StrongGirlfriendProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedStrongGirlfriend();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;

  const steps = useMemo(() => {
    let from = 0;
    return DIGNITY.map(([w, v]) => {
      const s = wordAt(words, w, from, -1);
      if (s >= 0) from = s;
      return { at: s, v };
    }).filter((x) => x.at >= 0);
  }, [words]);

  const sfx = useMemo<Sfx[]>(() => {
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const word = (phrase: string, from: number, fb: number) => wordAt(words, phrase, from, fb);
    const last = blocks[blocks.length - 1];
    const crack = word("crack", 15, 16.5);
    const cues: Sfx[] = [
      { src: "sfx/tank-lid.mp3", at: start("cold.0") + 0.35, volume: 0.25, duration: 0.5, fade: 0.15 },
      { src: "sfx/fence-smash.mp3", at: word("crushes", 10, 10.8), volume: 0.35, duration: 0.8, fade: 0.3 },
      ...[-0.5, -0.15, 0.2].map((d) => ({ src: "sfx/impact-boom.mp3", at: crack + d, volume: 0.22, duration: 0.35, fade: 0.1 })),
      { src: "sfx/moon-whoosh.mp3", at: start("c3.3") + 0.1, volume: 0.3 },
      { src: "sfx/impact-boom.mp3", at: start("c4.2") + 0.85, volume: 0.25 },
      { src: "sfx/impact-boom.mp3", at: start("c4.3") + 0.4, volume: 0.28 },
      { src: "sfx/quake-rumble.mp3", at: start("c4.4"), volume: 0.3, duration: 1.6, fade: 0.5 },
      { src: "sfx/notify-chime.mp3", at: start("c5.0") + 0.3, volume: 0.35 },
      { src: "sfx/notify-chime.mp3", at: start("c5.0") + 1.2, volume: 0.25 },
      { src: "sfx/jet-flyover.mp3", at: start("c5.1"), volume: 0.18, duration: 2.6, fade: 0.8 },
      { src: "sfx/tank-lid.mp3", at: word("fingers", 71, 72.9) - 0.1, volume: 0.4, duration: 0.6, fade: 0.2 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks, words]);

  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round(((blocks[1]?.start ?? 5.4) - LEAD - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);

  const dignity = steps.reduce((v, s) => (t >= s.at + 0.15 ? s.v : v), 100);
  const tDay3 = wordAt(words, "By day three", 40, 46);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <PostFxProvider value>{shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}</PostFxProvider>
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      <Readout label="YOUR DIGNITY" value={`${dignity}%`} accent={dignity > 0 ? undefined : "#FF5A4A"} />
      <Stamp label="SHE WENT VIRAL" value="DAY 3" lt={t - (tDay3 - LEAD)} hold={1.2} />
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
