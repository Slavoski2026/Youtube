/**
 * "What If Earth Suddenly Had a Second Moon?" — SLAVOSKI, ep. 8. ~71 s (the user chose the full script), "mid" detail.
 * The hook does not start on Earth from space: Slavoski's shadow splits in two on a night street, then two moons.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { loadHouseFonts } from "../../slavoski/fonts";
import { clamp01, ease } from "../../slavoski/noise";
import { BrandLockup, EndCard, Readout, Tag, TitleCard } from "../../slavoski/Overlays";
import { Soundtrack, type Sfx } from "../../slavoski/Soundtrack";
import { estimateManifest, scheduleShots, shotAt } from "../../slavoski/timeline";
import { WordCaptions } from "../../slavoski/WordCaptions";
import { BLOCKS, KEYWORDS, MOON_GAP, SLUG, TAGS, TITLE } from "./narration";
import { SHOTS } from "./shots";

loadHouseFonts();

export type SecondMoonProps = VoiceoverProps;
export const estimatedSecondMoon = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;
/** Local time in shot c5.2 at which the two moons touch (must match HIT_LT in shots.tsx). */
const HIT_LT = 0.3;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

export const SecondMoonEpisode: React.FC<SecondMoonProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedSecondMoon();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;

  const sfx = useMemo<Sfx[]>(() => {
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const last = blocks[blocks.length - 1];
    const hit = start("c5.2") + HIT_LT;
    const cues: Sfx[] = [
      // the reveal: a whoosh up to the two moons
      { src: "sfx/moon-whoosh.mp3", at: start("cold.1") - 0.05, volume: 0.3 },
      // the lab alarm, kept short and low
      { src: "sfx/air-raid-siren.mp3", at: start("c1.4") + 0.05, volume: 0.08, duration: 2.0, fade: 0.6 },
      // the sea surging, thunder over the flooded city
      { src: "sfx/quake-rumble.mp3", at: start("c2.3"), volume: 0.28, duration: 3.6, fade: 0.8 },
      { src: "sfx/impact-boom.mp3", at: start("c2.5") + 0.9, volume: 0.18 },
      { src: "sfx/quake-rumble.mp3", at: start("c2.6"), volume: 0.22, duration: 1.9, fade: 0.6 },
      { src: "sfx/impact-boom.mp3", at: start("c2.6") + 0.55, volume: 0.2 },
      { src: "sfx/moon-whoosh.mp3", at: start("c3.0"), volume: 0.18 },
      // the second Moon tearing apart, rocks rushing past, a fragment striking the ground
      { src: "sfx/planet-breakup.mp3", at: start("c4.1") + 0.3, volume: 0.32, duration: 4.0, fade: 0.8 },
      { src: "sfx/moon-whoosh.mp3", at: start("c4.3"), volume: 0.28 },
      { src: "sfx/impact-boom.mp3", at: start("c4.5") + 0.28, volume: 0.36 },
      { src: "sfx/quake-rumble.mp3", at: start("c4.5") + 0.3, volume: 0.26, duration: 1.6, fade: 0.5 },
      // the collision
      { src: "sfx/impact-boom.mp3", at: hit, volume: 0.45 },
      { src: "sfx/planet-breakup.mp3", at: hit + 0.05, volume: 0.32, duration: 4.0, fade: 1.0 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks]);

  // Title appears with the sky shot (the shadow shot opens clean) and leaves just before chapter 1.
  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round(((blocks[1]?.start ?? 4) - LEAD - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);
  const blockStartFrame = Math.round((block.start - LEAD) * fps);
  const tag = TAGS[block.id];

  // DISTANCE BETWEEN MOONS: steady, closing during the tug of war, 18,000 km when one is torn apart, 0 at the collision.
  const c3 = blocks[3]?.start ?? 27.7;
  const c4 = blocks[4]?.start ?? 34.3;
  const c5 = blocks[5]?.start ?? 44.8;
  const tear = at("c4.1") + 0.6;
  const hit = at("c5.2") + HIT_LT;
  const lerpE = (a: number, b: number, k: number) => a + (b - a) * ease(clamp01(k));
  const gap =
    t < c3
      ? MOON_GAP + 1800 * Math.sin(t * 0.6)
      : t < c4
        ? lerpE(MOON_GAP, 64000, (t - c3) / (c4 - c3))
        : t < c5
          ? lerpE(64000, 18000, (t - c4) / Math.max(0.5, tear - c4))
          : t < hit
            ? 18000 * (1 - clamp01((t - c5) / (hit - c5)) ** 2)
            : 0;
  const shown = Math.max(0, Math.round(gap / 100) * 100);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      {tag ? <Tag kind={tag} appearFrame={blockStartFrame + 4} /> : null}
      <Readout label="DISTANCE BETWEEN MOONS" value={`${shown.toLocaleString("en-US")} KM`} accent={shown < 20000 ? "#FF5A4A" : undefined} />
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
