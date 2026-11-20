/**
 * "What If Every Fish Learned to Walk?" — SLAVOSKI, ep. 8. ~60 s, "mid" detail.
 * The hook is personal: Slavoski's kitchen clock flips to 8:00 and his goldfish grows legs.
 * Our own walking fish (stubby legs, white sneakers, square eyes). Generic world, non-graphic.
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
import { DayStamp } from "../ww3-countdown/props";
import { BLOCKS, KEYWORDS, SLUG, TAGS, TITLE } from "./narration";
import { SHOTS } from "./shots";

loadHouseFonts();

export type WalkingFishProps = VoiceoverProps;
export const estimatedWalkingFish = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

/** FISH ON LAND: piecewise ramps between word cues. */
const fishCount = (t: number, cue: (p: string, from?: number, fb?: number) => number) => {
  const keys: [number, number][] = [
    [cue("walk", 0, 3.8), 0],
    [cue("walk", 0, 3.8) + 0.05, 1],
    [cue("salmon", 0, 7.1), 1],
    [cue("salmon", 0, 7.1) + 0.05, 2],
    [cue("millions", 0, 12.2), 2],
    [cue("lakes", 0, 15.3), 48_000_000],
    [cue("overrun", 0, 17.3), 910_000_000],
    [cue("waters", 0, 26.8), 1_740_000_000],
    [cue("cities", 0, 34.6), 3_500_000_000],
  ];
  if (t <= keys[0][0]) return 0;
  for (let i = 1; i < keys.length; i++) {
    const [t0, v0] = keys[i - 1];
    const [t1, v1] = keys[i];
    if (t < t1) {
      const k = clamp01((t - t0) / Math.max(0.001, t1 - t0));
      return Math.round(v0 + (v1 - v0) * k * k * (3 - 2 * k));
    }
  }
  return keys[keys.length - 1][1];
};

export const WalkingFishEpisode: React.FC<WalkingFishProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedWalkingFish();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
  const cue = (p: string, from = 0, fb = -1) => wordAt(words, p, from, fb);

  const sfx = useMemo<Sfx[]>(() => {
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const w = (p: string, fb: number) => wordAt(words, p, 0, fb);
    const last = blocks[blocks.length - 1];
    const stop = w("stops", 44);
    const cues: Sfx[] = [
      { src: "sfx/notify-chime.mp3", at: w("8:00", 0.95) - 0.05, volume: 0.45 },
      { src: "sfx/fish-steps.mp3", at: start("c1.0") + 0.5, volume: 0.5, duration: 1.6 },
      { src: "sfx/fish-steps.mp3", at: start("c1.2") + 0.3, volume: 0.45, duration: 2.0 },
      { src: "sfx/rat-swarm.mp3", at: start("c2.1"), volume: 0.18, duration: 2.6, fade: 0.6 },
      { src: "sfx/rat-swarm.mp3", at: start("c2.3"), volume: 0.24, duration: 2.0, fade: 0.5 },
      { src: "sfx/quake-rumble.mp3", at: start("c3.0"), volume: 0.28, duration: 3.6, fade: 0.8 },
      { src: "sfx/impact-boom.mp3", at: start("c3.1") + 0.4, volume: 0.16 },
      { src: "sfx/ship-foghorn.mp3", at: start("c4.2") + 0.1, volume: 0.45 },
      { src: "sfx/rat-swarm.mp3", at: start("c5.3"), volume: 0.2, duration: 2.3, fade: 0.5 },
      { src: "sfx/quake-rumble.mp3", at: start("c5.3"), volume: 0.22, duration: 2.3, fade: 0.6 },
      { src: "sfx/fence-smash.mp3", at: w("windows", 36.9) - 0.2, volume: 0.5 },
      { src: "sfx/air-raid-siren.mp3", at: start("c6.1"), volume: 0.16, duration: 3.6, fade: 0.8 },
      { src: "sfx/rat-swarm.mp3", at: start("c7.0"), volume: 0.2, duration: Math.max(0.3, stop - start("c7.0")), fade: 0.05 },
      { src: "sfx/quake-rumble.mp3", at: start("c7.0"), volume: 0.2, duration: Math.max(0.3, stop - start("c7.0")), fade: 0.05 },
      { src: "sfx/rat-swarm.mp3", at: start("c8.2"), volume: 0.3, duration: 4.6, fade: 0.8 },
      { src: "sfx/quake-rumble.mp3", at: start("c8.2"), volume: 0.3, duration: 4.6, fade: 1.0 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks, words]);

  // Title appears with the bowl shot (the clock opens clean) and leaves just before chapter 1.
  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps) + 3;
  const titleOut = Math.round(((blocks[1]?.start ?? 4) - LEAD - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);
  const blockStartFrame = Math.round((block.start - LEAD) * fps);
  const tag = TAGS[block.id];

  // DAY 2 on chapter 4, DAY 3 on "By day three".
  const day2 = (blocks.find((b) => b.id === "c4")?.start ?? 22.8) - LEAD;
  const day3 = cue("By day three", 30, 30.5) - LEAD;

  // TEN SECONDS: the readout becomes a silence countdown from "For ten" until "Then billions".
  const s0 = cue("For ten", 40, 44.9);
  const s1 = cue("Then billions", 45, 47.7);
  const silence = t >= s0 - 0.1 && t < s1;
  const secs = Math.max(0, Math.ceil(10 * (1 - clamp01((t - s0) / Math.max(0.1, s1 - s0 - 0.15)))));
  const count = fishCount(t, cue);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      {tag ? <Tag kind={tag} appearFrame={blockStartFrame + 4} /> : null}
      {silence ? (
        <Readout label="SILENCE" value={`00:${String(secs).padStart(2, "0")}`} accent="#F6EBC4" />
      ) : t > s1 - 0.1 && t < s1 + 0.6 ? null : (
        <Readout label="FISH ON LAND" value={count.toLocaleString("en-US")} accent={t > s1 ? "#FF5A4A" : undefined} />
      )}
      {t >= day2 && t < day2 + 1.2 ? <DayStamp n={2} lt={t - day2} /> : null}
      {t >= day3 && t < day3 + 1.2 ? <DayStamp n={3} lt={t - day3} /> : null}
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
