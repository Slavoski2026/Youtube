/**
 * "What If Every Satellite Stopped Working?" — SLAVOSKI, ep. 7. ~73 s (the user accepted the overrun), "mid" detail.
 * The cold open does not start on Earth: a phone losing GPS, satellites blinking out over a dawn street,
 * one satellite dying in close-up. Generic world, non-graphic.
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
import { BLOCKS, KEYWORDS, SAT_COUNT, SLUG, TAGS, TITLE } from "./narration";
import { SHOTS } from "./shots";

loadHouseFonts();

export type SatellitesDarkProps = VoiceoverProps;
export const estimatedSatellitesDark = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

export const SatellitesDarkEpisode: React.FC<SatellitesDarkProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedSatellitesDark();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;

  const sfx = useMemo<Sfx[]>(() => {
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const last = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      // the hook: a glitch as GPS drops, a whoosh up to the sky, the satellite powering down
      { src: "sfx/tv-static.mp3", at: start("cold.0") + 0.5, volume: 0.14, duration: 0.35, fade: 0.1 },
      { src: "sfx/moon-whoosh.mp3", at: start("cold.1") - 0.05, volume: 0.32 },
      { src: "sfx/power-down.mp3", at: start("cold.2") + 0.1, volume: 0.32, duration: 1.4, fade: 0.5 },
      // ep. 7's one new effect: the foghorn, plus a plane passing
      { src: "sfx/jet-flyover.mp3", at: start("c1.3"), volume: 0.2, duration: 2.4, fade: 0.6 },
      { src: "sfx/ship-foghorn.mp3", at: start("c1.3") + 0.35, volume: 0.55 },
      { src: "sfx/tv-static.mp3", at: start("c2.6") + 0.6, volume: 0.1, duration: 0.4 },
      { src: "sfx/power-down.mp3", at: start("c2.7") + 0.2, volume: 0.15, duration: 1.0, fade: 0.4 },
      { src: "sfx/tv-static.mp3", at: start("c3.0") + 0.1, volume: 0.16, duration: 1.0, fade: 0.4 },
      { src: "sfx/quake-rumble.mp3", at: start("c3.4"), volume: 0.35, duration: 3.6, fade: 0.8 },
      { src: "sfx/impact-boom.mp3", at: start("c3.4") + 0.9, volume: 0.22 },
      { src: "sfx/impact-boom.mp3", at: start("c3.5") + 0.5, volume: 0.18 },
      { src: "sfx/power-down.mp3", at: start("c4.3") + 0.3, volume: 0.25, duration: 1.2, fade: 0.4 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks]);

  // Title appears with the sky shot (the phone opens clean) and leaves just before chapter 1.
  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round(((blocks[1]?.start ?? 4) - LEAD - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);
  const blockStartFrame = Math.round((block.start - LEAD) * fps);
  const tag = TAGS[block.id];

  // ACTIVE SATELLITES: 12,000 until "suddenly", then racing to 0 by the end of "working".
  const t0 = wordAt(words, "suddenly", 0, 2.4);
  const t1 = wordAt(words, "working", 0, 3.3) + 0.35;
  const count = t < t0 ? SAT_COUNT : Math.round(SAT_COUNT * (1 - clamp01((t - t0) / (t1 - t0))) ** 2);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      {tag ? <Tag kind={tag} appearFrame={blockStartFrame + 4} /> : null}
      <Readout label="ACTIVE SATELLITES" value={count.toLocaleString("en-US")} accent={count > 0 ? undefined : "#FF5A4A"} />
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
