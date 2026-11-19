/**
 * "What If Every Pigeon Got an IQ of 200?" — SLAVOSKI, ep. 8. ~63.5 s, "mid" detail.
 * The hook opens on a park clock clunking onto 9:00, then the pigeons at Slavoski's feet freezing
 * mid-peck. Generic world: officials and leaders are generic; Trafalgar Square is our own low-poly take.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { loadHouseFonts } from "../../slavoski/fonts";
import { clamp01 } from "../../slavoski/noise";
import { BrandLockup, EndCard, Readout, TitleCard } from "../../slavoski/Overlays";
import { Soundtrack, type Sfx } from "../../slavoski/Soundtrack";
import { estimateManifest, scheduleShots, shotAt, wordAt } from "../../slavoski/timeline";
import { WordCaptions } from "../../slavoski/WordCaptions";
import { DayStamp } from "../ww3-countdown/props";
import { BLOCKS, KEYWORDS, SLUG, TITLE } from "./narration";
import { SHOTS } from "./shots";

loadHouseFonts();

export type PigeonUprisingProps = VoiceoverProps;
export const estimatedPigeonUprising = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

/** The clock readout per chapter (the cold open shows the pigeon IQ instead). */
const CLOCK: Record<string, string> = { c1: "12:00 PM", c2: "6:00 PM", c3: "DAY 2", c4: "DAY 3", c5: "DAY 5", c6: "DAY 7" };
const DAY: Record<string, number> = { c3: 2, c4: 3, c5: 5, c6: 7 };

export const PigeonUprisingEpisode: React.FC<PigeonUprisingProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedPigeonUprising();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;

  const sfx = useMemo<Sfx[]>(() => {
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const w = (phrase: string, from: number) => wordAt(words, phrase, from, -1);
    const last = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      // the hook: the minute hand clunks onto 9:00, coos, then dead silence from the flock
      { src: "sfx/pebble-scratch.mp3", at: start("cold.0") + 0.7, volume: 0.35, duration: 0.25, fade: 0.1 },
      { src: "sfx/pigeon-coo.mp3", at: start("cold.1") + 0.05, volume: 0.45, duration: Math.max(0.4, w("suddenly", 0) - start("cold.1") - 0.05), fade: 0.08 },
      { src: "sfx/moon-whoosh.mp3", at: start("cold.2") + 0.2, volume: 0.18 },
      // midday: the stare
      { src: "sfx/pigeon-coo.mp3", at: start("c1.0") + 0.1, volume: 0.25, duration: 1.2 },
      { src: "sfx/pebble-scratch.mp3", at: start("c1.0") + 1.45, volume: 0.3, duration: 0.4 },
      // gridlock
      { src: "sfx/phone-alert.mp3", at: start("c2.0") + 0.6, volume: 0.12, duration: 0.3, fade: 0.1 },
      { src: "sfx/phone-alert.mp3", at: start("c2.0") + 1.25, volume: 0.12, duration: 0.3, fade: 0.1 },
      // the snatch
      { src: "sfx/notify-chime.mp3", at: start("c3.0") + 0.3, volume: 0.35 },
      { src: "sfx/chicken-flurry.mp3", at: start("c3.1") + 0.15, volume: 0.35, duration: 1.2 },
      { src: "sfx/chicken-flurry.mp3", at: start("c3.2") + 0.2, volume: 0.18, duration: 1.4 },
      // storm and armies
      { src: "sfx/chicken-flurry.mp3", at: start("c4.0"), volume: 0.3, duration: 2.6, fade: 0.8 },
      { src: "sfx/quake-rumble.mp3", at: start("c4.0") + 1.85, volume: 0.35, duration: 2.0, fade: 0.8 },
      { src: "sfx/impact-boom.mp3", at: start("c4.1") + 0.85, volume: 0.2 },
      { src: "sfx/air-raid-siren.mp3", at: start("c4.2"), volume: 0.08, duration: 1.3, fade: 0.4 },
      { src: "sfx/tv-static.mp3", at: start("c4.3") + 0.1, volume: 0.1, duration: 0.5 },
      { src: "sfx/pigeon-coo.mp3", at: start("c4.5") + 0.3, volume: 0.6, duration: 0.9, fade: 0.2 },
      // London
      { src: "sfx/chicken-flurry.mp3", at: start("c5.0") + 0.3, volume: 0.25, duration: 2.4, fade: 0.6 },
      { src: "sfx/chicken-flurry.mp3", at: start("c5.4") + 0.1, volume: 0.25, duration: 1.6, fade: 0.5 },
      // day seven
      { src: "sfx/pigeon-coo.mp3", at: start("c6.0") + 0.2, volume: 0.3, duration: 1.4 },
      { src: "sfx/pigeon-coo.mp3", at: start("c6.4") + 1.0, volume: 0.4, duration: 1.0 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks, words]);

  // Title appears with the pigeons (the clock opens clean) and leaves just before chapter 1.
  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round(((blocks[1]?.start ?? 7) - LEAD - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);

  // PIGEON IQ: 2 until "suddenly", then racing to 200 by the end of "200".
  const t0 = wordAt(words, "suddenly", 0, 3.1);
  const t1 = wordAt(words, "200", t0, 4.7) + 0.45;
  const iq = t < t0 ? 2 : Math.round(2 + 198 * clamp01((t - t0) / (t1 - t0)) ** 1.6);
  const day = DAY[block.id];
  const chapterAt = block.start - LEAD;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      {block.id === "cold" ? <Readout label="PIGEON IQ" value={String(iq)} pulse={iq >= 200 ? 1 : 0} /> : <Readout label="TIME" value={CLOCK[block.id] ?? ""} />}
      {day ? <DayStamp n={day} lt={t - chapterAt} /> : null}
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
