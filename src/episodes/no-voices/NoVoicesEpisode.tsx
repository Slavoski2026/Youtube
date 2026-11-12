/**
 * "What If Nobody Could Speak?" — SLAVOSKI, ep. 9. ~60 s, "mid" detail, the first episode with post-processing
 * (bloom, depth of field, grade: see src/slavoski/postfx.tsx; registered with withFx in Root.tsx).
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
import { BLOCKS, KEYWORDS, SLUG, TAGS, TITLE, VOICES } from "./narration";
import { BRAKE, SHOTS } from "./shots";

loadHouseFonts();

export type NoVoicesProps = VoiceoverProps;
export const estimatedNoVoices = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

export const NoVoicesEpisode: React.FC<NoVoicesProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedNoVoices();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;

  const sfx = useMemo<Sfx[]>(() => {
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const last = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      { src: "sfx/moon-whoosh.mp3", at: start("cold.1") - 0.05, volume: 0.25 },
      { src: "sfx/tv-static.mp3", at: start("cold.2") + 0.55, volume: 0.1, duration: 0.3, fade: 0.1 },
      { src: "sfx/power-down.mp3", at: start("cold.3") + 0.1, volume: 0.22, duration: 1.2, fade: 0.4 },
      { src: "sfx/call-failed.mp3", at: start("c1.2") + 0.75, volume: 0.5 },
      { src: "sfx/phone-alert.mp3", at: start("c1.3"), volume: 0.18, duration: 1.2, fade: 0.4 },
      { src: "sfx/jet-flyover.mp3", at: start("c1.4"), volume: 0.28, duration: 2.2, fade: 0.6 },
      { src: "sfx/quake-rumble.mp3", at: start("c1.4") + 0.75, volume: 0.25, duration: 1.4, fade: 0.6 },
      { src: "sfx/heart-monitor.mp3", at: start("c1.6"), volume: 0.45 },
      { src: "sfx/call-failed.mp3", at: start("c1.8") + 0.45, volume: 0.3 },
      { src: "sfx/power-down.mp3", at: start("c2.0") + 0.2, volume: 0.15, duration: 1.4, fade: 0.6 },
      { src: "sfx/notify-chime.mp3", at: start("c3.0") + 0.05, volume: 0.35 },
      { src: "sfx/notify-chime.mp3", at: start("c3.0") + 0.7, volume: 0.25 },
      { src: "sfx/horn-screech.mp3", at: start("c4.0") >= 0 ? wordAt(words, "imagine", 30, start("c4.0")) + BRAKE - 0.05 : -1, volume: 0.6 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.7, volume: 0.6 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks, words]);

  // The first shot opens clean; the title lands with the sunrise city and leaves before "And nobody".
  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round((at("cold.2") - 0.2) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.8) * fps);
  const blockStartFrame = Math.round((block.start - LEAD) * fps);
  const tag = TAGS[block.id];

  // VOICES: 8,000,000,000 until "nobody", then racing to 0 by the end of "word".
  const t0 = wordAt(words, "nobody", 0, 3);
  const t1 = wordAt(words, "word", 0, 5) + 0.3;
  const count = t < t0 ? VOICES : Math.round(VOICES * (1 - clamp01((t - t0) / Math.max(0.3, t1 - t0))) ** 3);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      {tag ? <Tag kind={tag} appearFrame={blockStartFrame + 4} /> : null}
      <Readout label="VOICES" value={count.toLocaleString("en-US")} accent={count > 0 ? undefined : "#FF5A4A"} />
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
