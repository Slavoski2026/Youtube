/**
 * "What If Every Human Lost the Ability to Feel Pain?" — SLAVOSKI, ep. 10. ~88 s (the user chose the full script), "mid" detail.
 * Hook: a fist through plaster, a blank face. A PAIN SIGNAL readout (ON → OFF), and an 8,000,000,000 counter in chapter 5.
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
import { BLOCKS, KEYWORDS, SLUG, TAGS, TITLE } from "./narration";
import { SHOTS } from "./shots";

loadHouseFonts();

export type NoPainProps = VoiceoverProps;
export const estimatedNoPain = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

export const NoPainEpisode: React.FC<NoPainProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedNoPain();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;

  const sfx = useMemo<Sfx[]>(() => {
    const s = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const last = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      { src: "sfx/wall-punch.mp3", at: s("cold.0") + 0.12, volume: 0.8, duration: 1.4, fade: 0.5 },
      { src: "sfx/power-down.mp3", at: s("cold.2") + 1.8, volume: 0.25, duration: 1.0, fade: 0.4 },
      { src: "sfx/notify-chime.mp3", at: s("c1.0") + 0.05, volume: 0.3 },
      { src: "sfx/wall-punch.mp3", at: s("c1.1") + 0.28, volume: 0.7, duration: 1.2, fade: 0.4 },
      { src: "sfx/tv-static.mp3", at: s("c1.4") + 1.2, volume: 0.08, duration: 0.5 },
      // c2: 0 signpost bonk, 1 box drop, 2 hand on the pan, 3 "normally", 4 hand burning, 5 he notices
      { src: "sfx/fence-smash.mp3", at: s("c2.0") + 1.55, volume: 0.25, duration: 0.6 },
      { src: "sfx/tank-lid.mp3", at: s("c2.1") + 0.85, volume: 0.3, duration: 0.6 },
      { src: "sfx/pan-sizzle.mp3", at: s("c2.2") + 0.9, volume: 0.45 },
      { src: "sfx/pan-sizzle.mp3", at: s("c2.4") + 0.1, volume: 0.6 },
      { src: "sfx/pan-sizzle.mp3", at: s("c2.4") + 1.6, volume: 0.6 },
      { src: "sfx/air-raid-siren.mp3", at: s("c3.0"), volume: 0.12, duration: 1.8, fade: 0.6 },
      { src: "sfx/stadium-crowd.mp3", at: s("c3.1"), volume: 0.6 },
      { src: "sfx/stadium-crowd.mp3", at: s("c3.1") + 0.9, volume: 0.5 },
      { src: "sfx/stadium-crowd.mp3", at: s("c3.2") + 0.4, volume: 0.35 },
      { src: "sfx/impact-boom.mp3", at: s("c3.3") + 1.1, volume: 0.25, duration: 0.6 },
      { src: "sfx/power-down.mp3", at: s("c3.5") + 0.3, volume: 0.2, duration: 1.0, fade: 0.4 },
      { src: "sfx/moon-whoosh.mp3", at: s("c4.0"), volume: 0.2 },
      { src: "sfx/notify-chime.mp3", at: s("c4.4") + 0.8, volume: 0.2 },
      { src: "sfx/notify-chime.mp3", at: s("c4.4") + 1.6, volume: 0.2 },
      { src: "sfx/notify-chime.mp3", at: s("c4.4") + 2.4, volume: 0.2 },
      { src: "sfx/air-raid-siren.mp3", at: s("c5.1"), volume: 0.12, duration: 2.6, fade: 0.8 },
      { src: "sfx/monitor-beep.mp3", at: s("c5.2"), volume: 0.4 },
      { src: "sfx/monitor-beep.mp3", at: s("c5.2") + 1.05, volume: 0.4 },
      { src: "sfx/monitor-beep.mp3", at: s("c6.2"), volume: 0.35 },
      { src: "sfx/power-down.mp3", at: s("c6.3") + 0.5, volume: 0.35, duration: 1.0, fade: 0.4 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks]);

  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round(((blocks[1]?.start ?? 4) - LEAD - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);
  const blockStartFrame = Math.round((block.start - LEAD) * fps);
  const tag = TAGS[block.id];

  // PAIN SIGNAL: ON until "lost", then OFF. In chapter 5 it counts the people affected, up to 8,000,000,000.
  const lost = wordAt(words, "lost", 0, 2.4);
  const eight = wordAt(words, "eight billion", 55, 62);
  const c5 = blocks.find((b) => b.id === "c5");
  const inC5 = c5 && t >= c5.start - LEAD && t < c5.end + 0.4;
  const people = Math.round(8e9 * clamp01((t - eight) / 1.1) ** 0.5);
  const readout = inC5
    ? { label: "PEOPLE WITH NO PAIN", value: t < eight ? "0" : people.toLocaleString("en-US"), accent: "#FF5A4A" }
    : t < lost
      ? { label: "PAIN SIGNAL", value: "ON", accent: "#5BD08A" }
      : { label: "PAIN SIGNAL", value: "OFF", accent: "#FF5A4A" };

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      {tag ? <Tag kind={tag} appearFrame={blockStartFrame + 4} /> : null}
      <Readout label={readout.label} value={readout.value} accent={readout.accent} />
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
