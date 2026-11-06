/**
 * "What If Work Ended in 2036?" — SLAVOSKI, ep. 6. A ~65-second Short, "mid" detail.
 * Generic world: Elon Musk is named in the narration only (never shown), companies have no real brands.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { loadHouseFonts } from "../../slavoski/fonts";
import { clamp01 } from "../../slavoski/noise";
import { BrandLockup, EndCard, Readout, Tag, TitleCard } from "../../slavoski/Overlays";
import { Soundtrack, type Sfx } from "../../slavoski/Soundtrack";
import { estimateManifest, scheduleShots, shotAt, wordAt } from "../../slavoski/timeline";
import { WordCaptions } from "../../slavoski/WordCaptions";
import { BLOCKS, KEYWORDS, SLUG, TAGS, TITLE, YEAR } from "./narration";
import { YearStamp } from "./props";
import { SHOTS } from "./shots";

loadHouseFonts();

export type NoWork2036Props = VoiceoverProps;
export const estimatedNoWork2036 = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

/** The year readout: 2026 in the cold open, 2036 from chapter 1, rolling to 2046 on "In ten years". */
const yearAt = (blockId: string, sinceBlock: number): string => {
  if (blockId === "c5") return String(2036 + Math.round(10 * clamp01(sinceBlock / 0.9)));
  return YEAR[blockId] ?? "2036";
};

export const NoWork2036Episode: React.FC<NoWork2036Props> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedNoWork2036();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];

  const sfx = useMemo<Sfx[]>(() => {
    // All reused from earlier episodes: no new ElevenLabs spend.
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const last = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      { src: "sfx/moon-whoosh.mp3", at: start("cold.0") + 0.1, volume: 0.3 },
      { src: "sfx/pebble-scratch.mp3", at: start("cold.2") + 0.35, volume: 0.35, duration: 0.8 },
      { src: "sfx/phone-alert.mp3", at: start("cold.3"), volume: 0.12, duration: 0.9 },
      { src: "sfx/tank-lid.mp3", at: start("cold.3") + 0.92, volume: 0.35 },
      { src: "sfx/phone-alert.mp3", at: start("c1.1"), volume: 0.14 },
      { src: "sfx/phone-alert.mp3", at: start("c1.2") + 0.1, volume: 0.12 },
      { src: "sfx/quake-rumble.mp3", at: start("c2.0"), volume: 0.18, duration: 2.0, fade: 0.6 },
      { src: "sfx/jet-flyover.mp3", at: start("c2.1") + 0.1, volume: 0.14, duration: 1.7, fade: 0.5 },
      { src: "sfx/tank-lid.mp3", at: start("c2.2") + 0.4, volume: 0.16 },
      { src: "sfx/tank-lid.mp3", at: start("c2.2") + 1.5, volume: 0.13 },
      { src: "sfx/phone-alert.mp3", at: start("c3.1") + 0.25, volume: 0.12 },
      { src: "sfx/jet-flyover.mp3", at: start("c3.2"), volume: 0.18, duration: 1.4, fade: 0.4 },
      { src: "sfx/gate-creak.mp3", at: start("c4.2"), volume: 0.25, duration: 1.4 },
      { src: "sfx/power-down.mp3", at: start("c5.3"), volume: 0.22, duration: 1.4, fade: 0.5 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks]);

  // The title holds over the Earth and the rush-hour street, out on "No more".
  const titleOut = Math.round(((shots.find((s) => s.name === "cold.2")?.at ?? blocks[0].end) - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);
  const blockStartFrame = Math.round((block.start - LEAD) * fps);
  const sinceBlock = t - (block.start - LEAD);
  // "REAL PREDICTION" sits under the lockup while the Musk line plays.
  const musk = wordAt(words, "Elon Musk", 0, -1);
  const muskTag = block.id === "cold" && musk >= 0 && t >= musk - 0.1;
  const tag = TAGS[block.id];

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={4} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      {muskTag ? <Tag kind="REAL PREDICTION" appearFrame={Math.round((musk - 0.1) * fps)} /> : null}
      {tag ? <Tag kind={tag} appearFrame={blockStartFrame + 4} /> : null}
      <Readout label="THE YEAR" value={yearAt(block.id, sinceBlock)} />
      {block.id === "c1" ? <YearStamp year="2036" lt={sinceBlock} /> : null}
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
