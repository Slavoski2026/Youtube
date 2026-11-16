/**
 * "What If Nobody Could Sweat?" — SLAVOSKI, ep. 8. ~65 s (the user chose the full script), "mid" detail.
 * The hook opens on Slavoski's face mid-jog as his sweat dries up and vanishes. A BODY TEMP readout
 * follows the story; thermal-camera, x-ray and skin cross-section inserts explain the science.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { loadHouseFonts } from "../../slavoski/fonts";
import { BrandLockup, EndCard, Readout, Tag, TitleCard } from "../../slavoski/Overlays";
import { Soundtrack, type Sfx } from "../../slavoski/Soundtrack";
import { estimateManifest, scheduleShots, shotAt } from "../../slavoski/timeline";
import { WordCaptions } from "../../slavoski/WordCaptions";
import { BLOCKS, KEYWORDS, SLUG, TAGS, TITLE } from "./narration";
import { SHOTS } from "./shots";
import { bodyTemp } from "./temp";

loadHouseFonts();

export type NoSweatProps = VoiceoverProps;
export const estimatedNoSweat = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

export const NoSweatEpisode: React.FC<NoSweatProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedNoSweat();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;

  const sfx = useMemo<Sfx[]>(() => {
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const last = blocks[blocks.length - 1];
    const beat = (from: number, n: number, gap: number, volume: number) =>
      Array.from({ length: n }, (_, i): Sfx => ({ src: "sfx/impact-boom.mp3", at: from + i * gap, volume, duration: 0.3, fade: 0.15 }));
    const cues: Sfx[] = [
      // the hook: a soft chime as the sweat vanishes, a whoosh into the wide, the glands powering down
      { src: "sfx/notify-chime.mp3", at: start("cold.0") + 0.55, volume: 0.22, duration: 0.9, fade: 0.3 },
      { src: "sfx/moon-whoosh.mp3", at: start("cold.1") - 0.05, volume: 0.28 },
      { src: "sfx/power-down.mp3", at: start("cold.2") + 0.8, volume: 0.28, duration: 1.2, fade: 0.5 },
      { src: "sfx/moon-whoosh.mp3", at: start("c2.2") - 0.05, volume: 0.18 },
      // running hot: the heart pounding (soft low booms), faster in the x-ray
      ...beat(start("c3.3") + 0.1, 6, 0.48, 0.16),
      { src: "sfx/quake-rumble.mp3", at: start("c4.0"), volume: 0.3, duration: 1.0, fade: 0.4 },
      { src: "sfx/tv-static.mp3", at: start("c4.2") + 0.05, volume: 0.14, duration: 1.2, fade: 0.4 },
      ...beat(start("c4.3") + 0.1, 4, 0.36, 0.18),
      { src: "sfx/power-down.mp3", at: start("c4.3") + 1.5, volume: 0.22, duration: 0.8, fade: 0.4 },
      { src: "sfx/notify-chime.mp3", at: start("c5.0") + 0.05, volume: 0.16, duration: 1.0, fade: 0.4 },
      { src: "sfx/moon-whoosh.mp3", at: start("c6.1") - 0.1, volume: 0.22 },
      { src: "sfx/moon-whoosh.mp3", at: start("c6.3") - 0.1, volume: 0.2 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks]);

  // Title appears with the wide park shot (the face close-up opens clean) and leaves just before chapter 1.
  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round(((blocks[1]?.start ?? 4) - LEAD - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);
  const blockStartFrame = Math.round((block.start - LEAD) * fps);
  const tag = TAGS[block.id];
  const temp = bodyTemp(t, words);
  const hot = temp >= 40;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {/* a soft dark scrim at the top so the lockup and the readout read on bright, hot skies */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(6,8,20,0.55) 0%, rgba(6,8,20,0.25) 9%, rgba(6,8,20,0) 17%)", pointerEvents: "none" }} />
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      {tag ? <Tag kind={tag} appearFrame={blockStartFrame + 4} /> : null}
      <Readout label="BODY TEMP" value={`${temp.toFixed(1)} °C`} accent={hot ? "#FF5A4A" : undefined} pulse={hot ? 0.5 + 0.5 * Math.sin(t * 8) : 0} />
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
