/**
 * "What If Every Human on Earth Suddenly Disappeared?" — SLAVOSKI, A Cosmic What If, ep. 2.
 * One continuous narration take; one scene per narration block, shots keyed to word times.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { loadHouseFonts } from "../../slavoski/fonts";
import { BrandLockup, EndCard, Readout, Tag, TitleCard } from "../../slavoski/Overlays";
import { Soundtrack, type Sfx } from "../../slavoski/Soundtrack";
import { estimateManifest, scheduleShots, shotAt } from "../../slavoski/timeline";
import { WordCaptions } from "../../slavoski/WordCaptions";
import { BLOCKS, CLOCK, KEYWORDS, SLUG, TAGS, TITLE } from "./narration";
import { SHOTS } from "./shots";

loadHouseFonts();

export type NoHumansProps = VoiceoverProps;
export const estimatedNoHumans = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
/** Narration gain (same mastering as ep. 1). */
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

/** "TIME WITHOUT HUMANS": live seconds in chapter 01, then a time-lapse spin into each chapter's value. */
const clockValue = (blockId: string, t: number, blockStart: number, vanishAt: number, frame: number): string | null => {
  if (blockId === "c1") {
    const s = Math.max(0, Math.floor(t - vanishAt));
    return `00:00:${String(s).padStart(2, "0")}`;
  }
  const target = CLOCK[blockId];
  if (!target) return null;
  const since = t - (blockStart - LEAD);
  if (since < 0.45) {
    // spinning digits during the jump (seeded per frame)
    return target.replace(/[0-9]/g, (_d, i: number) => String(Math.floor(random(`clk${frame}:${i}`) * 10)));
  }
  return target;
};

export const NoHumansEpisode: React.FC<NoHumansProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedNoHumans();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const vanishAt = useMemo(() => {
    const w = words.find((x) => x.text.trim().toLowerCase().startsWith("vanished"));
    return w ? w.startMs / 1000 : 0;
  }, [words]);
  const sfx = useMemo<Sfx[]>(() => {
    // Reuses ep. 1's sound effects (no new credits). Times follow the shot schedule, so they track the voiceover.
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const len = (name: string) => {
      const i = shots.findIndex((x) => x.name === name);
      return i >= 0 && i + 1 < shots.length ? shots[i + 1].at - shots[i].at : 2;
    };
    const lastBlock = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      { src: "sfx/impact-boom.mp3", at: 0.05, volume: 0.7 },
      { src: "sfx/moon-whoosh.mp3", at: start("cold.2") + 0.5, volume: 0.45 },
      { src: "sfx/impact-boom.mp3", at: start("c1.1") + 0.9, volume: 1.0 },
      { src: "sfx/impact-boom.mp3", at: start("c1.2") + 0.32, volume: 0.8 },
      { src: "sfx/planet-breakup.mp3", at: start("c1.4") + Math.max(1.2, len("c1.4") - 0.55), volume: 0.5 },
      { src: "sfx/impact-boom.mp3", at: start("c5.1") + 0.45, volume: 0.9 },
      { src: "sfx/quake-rumble.mp3", at: start("c5.1") + 0.5, volume: 0.4 },
      { src: "sfx/quake-rumble.mp3", at: start("c5.1") + 1.2, volume: 0.3 },
      { src: "sfx/end-sting.mp3", at: lastBlock.end + 0.6, volume: 0.8 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks]);

  const tag = TAGS[block.id];
  const clock = clockValue(block.id, t, block.start, vanishAt, frame);
  // The title leaves with the space shot, just before Slavoski appears on the street.
  const titleOut = Math.round(((shots[1]?.at ?? blocks[0].end) - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);
  const blockStartFrame = Math.round((block.start - LEAD) * fps);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t })}
      {block.id === "cold" && frame < titleOut + 10 ? (
        <TitleCard lines={TITLE} startFrame={4} outFrame={titleOut} />
      ) : (
        <BrandLockup chapter={block.chapter} />
      )}
      {tag ? <Tag kind={tag} appearFrame={blockStartFrame + 4} /> : null}
      {clock ? <Readout label="TIME WITHOUT HUMANS" value={clock} /> : null}
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
