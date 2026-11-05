/**
 * "What If WW3 Started in 7 Days?" — SLAVOSKI, ep. 5. A 60-second Short, "mid" detail.
 * Generic world (no real countries, flags or leaders) and non-graphic: the end is a white sky fading to black.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { loadHouseFonts } from "../../slavoski/fonts";
import { BrandLockup, EndCard, Readout, Tag, TitleCard } from "../../slavoski/Overlays";
import { Soundtrack, type Sfx } from "../../slavoski/Soundtrack";
import { estimateManifest, scheduleShots, shotAt, wordAt } from "../../slavoski/timeline";
import { WordCaptions } from "../../slavoski/WordCaptions";
import { BLOCKS, DAY, DAYS_LEFT, KEYWORDS, SLUG, TAGS, TITLE } from "./narration";
import { DayStamp } from "./props";
import { SHOTS } from "./shots";

loadHouseFonts();

export type Ww3Props = VoiceoverProps;
export const estimatedWw3 = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

/** Day seven readout: "01:00" at 11:59 PM, racing down to 00:03 on "Three", then 2, 1, 0 on the words. */
const finalCountdown = (words: VoiceoverManifest["words"], t: number, from: number): string | null => {
  const at = (w: string, fb: number) => wordAt(words, w, from, fb);
  const t0 = at("11:59", from + 0.8);
  const t3 = at("Three", t0 + 4);
  const t2 = at("two", t3 + 1);
  const t1 = at("one", t2 + 1);
  const tw = at("The sky", t1 + 0.7);
  if (t < t0) return "01:00";
  if (t >= tw + 0.2) return null;
  let s: number;
  if (t < t3) s = Math.max(3, Math.round(60 - ((t - t0) / (t3 - t0)) * 57));
  else if (t < t2) s = 3;
  else if (t < t1) s = 2;
  else if (t < tw) s = 1;
  else s = 0;
  return `00:${String(s).padStart(2, "0")}`;
};

export const Ww3Episode: React.FC<Ww3Props> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedWw3();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];

  const sfx = useMemo<Sfx[]>(() => {
    // Ep. 5's four new effects plus ones reused from earlier episodes.
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const last = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      { src: "sfx/moon-whoosh.mp3", at: start("cold.0") + 0.1, volume: 0.3 },
      // ep. 5 effects: alert tone, air-raid siren, jets, static
      { src: "sfx/phone-alert.mp3", at: start("c1.0") + 0.25, volume: 0.16 },
      { src: "sfx/phone-alert.mp3", at: start("c1.1"), volume: 0.12 },
      { src: "sfx/tv-static.mp3", at: start("c3.0") + 0.42, volume: 0.14, duration: 0.6 },
      { src: "sfx/power-down.mp3", at: start("c3.0") + 0.5, volume: 0.25, duration: 1.2 },
      { src: "sfx/jet-flyover.mp3", at: start("c4.0") + 0.5, volume: 0.3 },
      { src: "sfx/jet-flyover.mp3", at: start("c4.0") + 1.1, volume: 0.26 },
      { src: "sfx/quake-rumble.mp3", at: start("c4.0") + 0.6, volume: 0.4 },
      { src: "sfx/air-raid-siren.mp3", at: start("c4.1"), volume: 0.2 },
      { src: "sfx/air-raid-siren.mp3", at: start("c4.1") + 1.9, volume: 0.16, duration: 1.5, fade: 0.5 },
      { src: "sfx/tv-static.mp3", at: start("c6.2") - 0.3, volume: 0.18, duration: 0.8 },
      { src: "sfx/phone-alert.mp3", at: start("c7.1"), volume: 0.12 },
      { src: "sfx/phone-alert.mp3", at: start("c7.2"), volume: 0.16 },
      { src: "sfx/impact-boom.mp3", at: start("c7.6") + 0.15, volume: 0.35 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks]);

  const tag = TAGS[block.id];
  const titleOut = Math.round(((shots[1]?.at ?? blocks[0].end) - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);
  const blockStartFrame = Math.round((block.start - LEAD) * fps);
  const readout = block.id === "c7" ? finalCountdown(words, t, block.start) : DAYS_LEFT[block.id];
  const day = DAY[block.id];
  const sinceBlock = t - (block.start - LEAD);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={4} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      {tag ? <Tag kind={tag} appearFrame={blockStartFrame + 4} /> : null}
      {readout ? <Readout label={block.id === "c7" ? "MIDNIGHT IN" : "WAR BEGINS IN"} value={readout} accent={block.id === "c7" ? "#FF5A4A" : undefined} /> : null}
      {day ? <DayStamp n={day} lt={sinceBlock} /> : null}
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
