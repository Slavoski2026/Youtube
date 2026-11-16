/**
 * "What If You Were the Last Human on Earth?" — SLAVOSKI ep. 8, the first long-form (16:9, ~6:45) episode.
 * The user's script verbatim, narrated by Mark in three parts joined by scripts/join-voiceover.ts.
 * Light on-screen text: a chapter label at each chapter start, time stamps at the jumps, clean subtitles.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { loadHouseFonts } from "../../slavoski/fonts";
import { ChapterLabel, EndCard, Tag, TimeStamp, type TagKind } from "../../slavoski/Overlays";
import { Soundtrack } from "../../slavoski/Soundtrack";
import { Subtitles } from "../../slavoski/Subtitles";
import { estimateManifest, scheduleShots, shotAt } from "../../slavoski/timeline";
import { BLOCKS, SLUG, STAMPS } from "./narration";
import { SHOTS } from "./shots";
import type { ShotFn } from "./shots/common";
import { soundFor } from "./sound";

loadHouseFonts();

export type LastHumanProps = VoiceoverProps;
export const estimatedLastHuman = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS, { wps: 2.45 });

export const LEAD = 0.15;
const VOICE_VOLUME = 1.45;
/** Seconds after the last word before the end card. */
export const END_CARD_AFTER = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

export const LastHumanEpisode: React.FC<LastHumanProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedLastHuman();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const sound = useMemo(() => soundFor(words, blocks, shots), [words, blocks, shots]);

  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + END_CARD_AFTER) * fps);
  const blockStart = Math.round(Math.max(0, block.start - LEAD) * fps);
  const stamp = STAMPS[block.id];
  // Speculative shots (the decades flash-forward) carry an honesty tag while on screen.
  const tag = (shot.fn as ShotFn & { tag?: TagKind }).tag;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.chapter ? <ChapterLabel chapter={block.chapter} startFrame={blockStart + 6} /> : null}
      {stamp ? <TimeStamp text={stamp} startFrame={blockStart + 10} /> : null}
      {tag ? <Tag kind={tag} appearFrame={Math.round(shot.at * fps) + 4} /> : null}
      <Subtitles words={words} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sound.sfx} beds={sound.beds} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
