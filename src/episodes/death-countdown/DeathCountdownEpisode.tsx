/**
 * "What If Everyone Had a Death Countdown?" — SLAVOSKI, ep. 8. ~70 s (the user's full script), "mid" detail.
 * Hook: a timer over a stranger, a street full of them, the friend (64 years), the neighbour (12)… and
 * Slavoski's own, 47 seconds. Generic world, non-graphic: nobody dies on screen; the ending is a choice.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { loadHouseFonts } from "../../slavoski/fonts";
import { BrandLockup, EndCard, Readout, TitleCard } from "../../slavoski/Overlays";
import { Soundtrack, type Sfx } from "../../slavoski/Soundtrack";
import { estimateManifest, scheduleShots, shotAt, wordAt } from "../../slavoski/timeline";
import { WordCaptions } from "../../slavoski/WordCaptions";
import { BLOCKS, KEYWORDS, SINCE, SLUG, TITLE } from "./narration";
import { SHOTS } from "./shots";

loadHouseFonts();

export type DeathCountdownProps = VoiceoverProps;
export const estimatedDeathCountdown = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

export const DeathCountdownEpisode: React.FC<DeathCountdownProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedDeathCountdown();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;

  const sfx = useMemo<Sfx[]>(() => {
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const w = (phrase: string, from: number, fb: number) => wordAt(words, phrase, from, fb);
    const last = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      // the hook: a soft whoosh up the street as the title lands, a hit when his own timer appears
      { src: "sfx/moon-whoosh.mp3", at: start("cold.1") - 0.05, volume: 0.22 },
      { src: "sfx/notify-chime.mp3", at: start("cold.2") + 0.15, volume: 0.25 },
      { src: "sfx/impact-boom.mp3", at: w("yours", 6, 7.76) + 0.05, volume: 0.26 },
      { src: "sfx/tv-static.mp3", at: start("cold.5") + 0.1, volume: 0.1, duration: 0.25, fade: 0.08 },
      { src: "sfx/moon-whoosh.mp3", at: start("cold.6") - 0.05, volume: 0.2 },
      // 01 chaos, 02 the rooftop wind, the car stopping
      { src: "sfx/quake-rumble.mp3", at: start("c1.0"), volume: 0.18, duration: 3.2, fade: 0.8 },
      { src: "sfx/moon-whoosh.mp3", at: start("c2.0"), volume: 0.18 },
      { src: "sfx/impact-boom.mp3", at: start("c2.1") + 1.05, volume: 0.12 },
      // 04 the sign dying, the stamp, the match
      { src: "sfx/power-down.mp3", at: w("obsolete", 29, 31.06) - 0.4, volume: 0.22, duration: 1.2, fade: 0.4 },
      { src: "sfx/impact-boom.mp3", at: start("c4.1") + 1.05, volume: 0.16 },
      { src: "sfx/notify-chime.mp3", at: start("c4.2") + 0.2 + 1.7 * 0.45, volume: 0.3 },
      // 05 the anomaly, the bus, the glitch, the hourglass
      { src: "sfx/tv-static.mp3", at: w("terrifying", 40, 43.34) - 0.2, volume: 0.1, duration: 0.5, fade: 0.2 },
      { src: "sfx/jet-flyover.mp3", at: start("c5.2") + 0.3, volume: 0.3, duration: 1.8, fade: 0.6 },
      { src: "sfx/tv-static.mp3", at: start("c5.3") + 0.35, volume: 0.14, duration: 0.75, fade: 0.2 },
      { src: "sfx/quake-rumble.mp3", at: start("c5.4"), volume: 0.2, duration: 3.8, fade: 1.0 },
      // 06 the drop, the flicker, the shatter
      { src: "sfx/tv-static.mp3", at: w("drops", 54, 57.96), volume: 0.14, duration: 1.7, fade: 0.4 },
      { src: "sfx/power-down.mp3", at: w("ten", 56, 59.74) - 0.3, volume: 0.2, duration: 1.0, fade: 0.4 },
      { src: "sfx/tv-static.mp3", at: start("c6.3") + 0.4, volume: 0.06, duration: 0.3, fade: 0.1 },
      { src: "sfx/moon-whoosh.mp3", at: w("live", 63, 66.6), volume: 0.26 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks, words]);

  // Title appears with the street shot (the first close-up opens clean) and leaves during the friend shot.
  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round(Math.min(at("cold.2") + 0.9, (blocks[1]?.start ?? 4) - LEAD - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);
  const since = SINCE[block.id];

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      {since ? <Readout label="SINCE THE TIMERS" value={since} /> : null}
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
