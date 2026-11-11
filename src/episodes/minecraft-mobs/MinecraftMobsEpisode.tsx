/**
 * "What If Minecraft Mobs Spawned in Real Life?" — SLAVOSKI, ep. 8. ~60 s, "mid" detail.
 * The mobs are our own low-poly designs (see props.tsx); the game is named only in the narration and title.
 * The hiss and the boom are sound effects with on-screen sound words, placed in gaps in the narration.
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
import { beats, SHOTS } from "./shots";

loadHouseFonts();

export type MinecraftMobsProps = VoiceoverProps;
export const estimatedMinecraftMobs = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

/** The clock in the corner: [minutes at the block's start, minutes at its end] per block, from 15:00 to the next morning. */
const CLOCK: Record<string, [number, number]> = {
  cold: [15 * 60, 15 * 60 + 4],
  c1: [18 * 60 + 40, 21 * 60 + 30],
  c2: [23 * 60 + 10, 23 * 60 + 24],
  c3: [26 * 60, 27 * 60 + 40],
  c4: [29 * 60 + 20, 30 * 60 + 20],
  c5: [30 * 60 + 40, 30 * 60 + 41],
};
const clock = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(Math.floor(min) % 60).padStart(2, "0")}`;

export const MinecraftMobsEpisode: React.FC<MinecraftMobsProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedMinecraftMobs();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
  const b = useMemo(() => beats(words), [words]);

  const sfx = useMemo<Sfx[]>(() => {
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const cues: Sfx[] = [
      // the hook: they pop into the street
      { src: "sfx/moon-whoosh.mp3", at: start("cold.1") - 0.05, volume: 0.28 },
      // hiss … BOOM
      { src: "sfx/creeper-hiss.mp3", at: b.hiss, volume: 0.75, duration: 1.15, fade: 0.2 },
      { src: "sfx/creeper-hiss.mp3", at: start("cold.4") + 0.5, volume: 0.3, duration: 1.2, fade: 0.2 },
      { src: "sfx/impact-boom.mp3", at: b.boom - 0.03, volume: 0.9 },
      { src: "sfx/quake-rumble.mp3", at: b.boom, volume: 0.35, duration: 2.2, fade: 0.8 },
      // archers
      { src: "sfx/arrow-shot.mp3", at: start("c1.3") + 0.75, volume: 0.5 },
      { src: "sfx/arrow-shot.mp3", at: start("c1.4") + 0.2, volume: 0.4 },
      { src: "sfx/arrow-shot.mp3", at: start("c1.4") + 0.85, volume: 0.35 },
      // the tall one
      { src: "sfx/teleport.mp3", at: start("c2.3") + 0.05, volume: 0.55, duration: 1.6, fade: 0.5 },
      { src: "sfx/power-down.mp3", at: start("c2.7") + 0.05, volume: 0.3, duration: 0.9, fade: 0.3 },
      { src: "sfx/teleport.mp3", at: start("c2.9") + 0.3, volume: 0.45, duration: 1.2, fade: 0.4 },
      // the boss
      { src: "sfx/impact-boom.mp3", at: start("c3.3") + 0.02, volume: 0.6 },
      { src: "sfx/quake-rumble.mp3", at: start("c3.3"), volume: 0.4, duration: 5.6, fade: 1.0 },
      { src: "sfx/impact-boom.mp3", at: start("c3.4") + 0.35, volume: 0.5 },
      { src: "sfx/impact-boom.mp3", at: start("c3.4") + 0.8, volume: 0.45 },
      { src: "sfx/planet-breakup.mp3", at: start("c3.5"), volume: 0.3, duration: 1.4, fade: 0.5 },
      { src: "sfx/arrow-shot.mp3", at: start("c3.7") + 0.1, volume: 0.3 },
      // the last word
      { src: "sfx/creeper-hiss.mp3", at: b.hiss2, volume: 0.75, duration: 1.2, fade: 0.2 },
      { src: "sfx/creeper-hiss.mp3", at: start("c5.3") + 0.1, volume: 0.35, duration: 1.6, fade: 0.2 },
      { src: "sfx/impact-boom.mp3", at: b.bang - 0.03, volume: 0.9 },
      { src: "sfx/end-sting.mp3", at: b.bang + 0.25, volume: 0.6 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, b]);

  // The first shot opens clean; the title lands with the aerial and leaves before the walk.
  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round((at("cold.3") - 0.25) * fps);
  const endCardFrame = Math.round((b.bang + 0.3) * fps);
  const blockStartFrame = Math.round((block.start - LEAD) * fps);
  const tag = TAGS[block.id];

  const [c0, c1] = CLOCK[block.id] ?? [0, 0];
  const blockEnd = blocks[shot.block + 1]?.start ?? block.end;
  const k = Math.min(1, Math.max(0, (t - block.start) / Math.max(0.1, blockEnd - block.start)));
  const night = block.id === "c1" ? k > 0.35 : ["c2", "c3"].includes(block.id) || (block.id === "c4" && k < 0.3);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      {tag ? <Tag kind={tag} appearFrame={blockStartFrame + 4} /> : null}
      <Readout label={night ? "NIGHT" : "DAY"} value={clock(c0 + (c1 - c0) * k)} accent={night ? "#C9A8FF" : undefined} />
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
