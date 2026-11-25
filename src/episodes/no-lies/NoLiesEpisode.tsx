/**
 * "What If Humans Couldn't Lie?" — SLAVOSKI, ep. 8. ~75 s (the user's full script, unchanged), "mid" detail.
 * The hook opens on secrets caught in spotlights at sunset, not on Earth. Generic world: no real people,
 * parties, flags or brands; the "affair" is two people caught at a motel door. A "TIME WITHOUT LIES" readout
 * jumps per chapter.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { loadHouseFonts } from "../../slavoski/fonts";
import { clamp01 } from "../../slavoski/noise";
import { BrandLockup, EndCard, Readout, TitleCard } from "../../slavoski/Overlays";
import { Soundtrack, type Sfx } from "../../slavoski/Soundtrack";
import { estimateManifest, scheduleShots, shotAt } from "../../slavoski/timeline";
import { WordCaptions } from "../../slavoski/WordCaptions";
import { BLOCKS, CLOCK, KEYWORDS, SLUG, TITLE } from "./narration";
import { SHOTS } from "./shots";

loadHouseFonts();

export type NoLiesProps = VoiceoverProps;
export const estimatedNoLies = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

export const NoLiesEpisode: React.FC<NoLiesProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedNoLies();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;

  const sfx = useMemo<Sfx[]>(() => {
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const last = blocks[blocks.length - 1];
    // a short glitch on every lie that gets struck out
    const strike = (name: string, delay: number): Sfx => ({ src: "sfx/tv-static.mp3", at: start(name) + delay, volume: 0.12, duration: 0.25, fade: 0.08 });
    const cues: Sfx[] = [
      // the hook: spotlights slam on, folders burst out, the wave rolls through the street
      { src: "sfx/impact-boom.mp3", at: start("cold.0") + 0.12, volume: 0.28 },
      { src: "sfx/impact-boom.mp3", at: start("cold.1") + 0.45, volume: 0.2 },
      { src: "sfx/moon-whoosh.mp3", at: start("cold.2") + 0.2, volume: 0.28 },
      { src: "sfx/moon-whoosh.mp3", at: start("cold.4") + 0.05, volume: 0.4 },
      { src: "sfx/quake-rumble.mp3", at: start("cold.4") + 0.6, volume: 0.22, duration: 1.4, fade: 0.6 },
      strike("cold.5", 0.85),
      { src: "sfx/notify-chime.mp3", at: start("c1.1") + 0.05, volume: 0.32 },
      strike("c1.1", 0.4),
      strike("c1.2", 0.55),
      strike("c1.3", 1.05),
      { src: "sfx/power-down.mp3", at: start("c2.0") + 0.9, volume: 0.14, duration: 1.3, fade: 0.5 },
      strike("c2.3", 0.85),
      strike("c3.3", 0.3),
      strike("c3.5", 0.65),
      strike("c5.3", 0.55),
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks]);

  // Title appears with the second shot (the motel opens clean) and leaves just before chapter 1.
  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round(((blocks[1]?.start ?? 4) - LEAD - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);

  // TIME WITHOUT LIES: jumps on each chapter cut, with a short glow pulse.
  const sinceCut = t - (block.start - LEAD);
  const pulse = block.id === "cold" ? 0 : 1 - clamp01(sinceCut / 0.6);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      <Readout label="TIME WITHOUT LIES" value={CLOCK[block.id] ?? ""} pulse={pulse} />
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
