/**
 * "What If Nobody Could Feel Fear?" — SLAVOSKI, ep. 10. ~60 s, "mid" detail, post-processed (withFx in Root.tsx).
 * A FEAR readout drops from 100% to 0% in the cold open and comes back on "remember".
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

export type NoFearProps = VoiceoverProps;
export const estimatedNoFear = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

export const NoFearEpisode: React.FC<NoFearProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedNoFear();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;

  const sfx = useMemo<Sfx[]>(() => {
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const last = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      { src: "sfx/high-wind.mp3", at: 0, volume: 0.35, duration: 2.0, fade: 0.5 },
      { src: "sfx/moon-whoosh.mp3", at: start("cold.1") - 0.05, volume: 0.3 },
      { src: "sfx/high-wind.mp3", at: start("cold.3"), volume: 0.4, duration: 1.4, fade: 0.4 },
      { src: "sfx/heartbeat.mp3", at: start("c1.0") + 0.05, volume: 0.6 },
      { src: "sfx/high-wind.mp3", at: start("c2.1"), volume: 0.3, duration: 1.8, fade: 0.5 },
      { src: "sfx/lion-roar.mp3", at: start("c2.2") + 0.1, volume: 0.65, duration: 1.4, fade: 0.3 },
      { src: "sfx/notify-chime.mp3", at: start("c2.3") + 0.68, volume: 0.25 },
      { src: "sfx/high-wind.mp3", at: start("c2.5"), volume: 0.4, duration: 1.0, fade: 0.4 },
      { src: "sfx/heartbeat.mp3", at: start("c3.3") + 0.55, volume: 0.45 },
      { src: "sfx/tv-static.mp3", at: start("c4.3") + 0.05, volume: 0.12, duration: 0.8, fade: 0.3 },
      { src: "sfx/power-down.mp3", at: start("c4.4") + 0.65, volume: 0.2, duration: 0.8, fade: 0.3 },
      { src: "sfx/heartbeat.mp3", at: start("c5.2") + 0.3, volume: 0.7 },
      { src: "sfx/air-raid-siren.mp3", at: start("c5.3"), volume: 0.18, duration: 0.8, fade: 0.3 },
      { src: "sfx/heartbeat.mp3", at: start("c5.4"), volume: 0.55 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.55, volume: 0.6 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks]);

  // The first shot opens clean; the title lands with the tower and leaves before "Imagine".
  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round((at("cold.2") - 0.2) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);
  const blockStartFrame = Math.round((block.start - LEAD) * fps);
  const tag = TAGS[block.id];

  // FEAR: 100% until "absolutely", 0% by the end of "nothing"; back to 100% between "remember" and "alive".
  const d0 = wordAt(words, "absolutely", 0, 9);
  const d1 = wordAt(words, "nothing", 0, 10) + 0.4;
  const u0 = wordAt(words, "remember", 40, 54);
  const u1 = wordAt(words, "alive", 40, 57.5);
  const fear = t < u0 ? 1 - clamp01((t - d0) / Math.max(0.3, d1 - d0)) : clamp01((t - u0) / Math.max(0.3, u1 - u0));
  const pct = Math.round(fear * 100);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      {tag ? <Tag kind={tag} appearFrame={blockStartFrame + 4} /> : null}
      <Readout label="FEAR" value={`${pct}%`} accent={pct > 0 ? undefined : "#FF5A4A"} />
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
