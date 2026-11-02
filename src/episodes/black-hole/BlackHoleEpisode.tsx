/**
 * "What If a Black Hole Appeared Next to Earth?" — SLAVOSKI, A Cosmic What If.
 * Plays one continuous narration take; one scene per narration block, shots keyed to word times.
 * Until the voiceover is imported, timing is estimated from the script (silent animatic).
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { loadHouseFonts } from "../../slavoski/fonts";
import { clamp01, ease } from "../../slavoski/noise";
import { BrandLockup, EndCard, Readout, Tag, TitleCard } from "../../slavoski/Overlays";
import { Soundtrack, type Sfx } from "../../slavoski/Soundtrack";
import { blockTimes, estimateManifest, shotAt, wordAt } from "../../slavoski/timeline";
import { WordCaptions } from "../../slavoski/WordCaptions";
import { BLOCKS, KEYWORDS, SLUG, TAGS, TITLE } from "./narration";
import { formatCountdown, formatKm, separationKm, T_FALL_DAYS } from "./physics";
import { SHOTS, type ShotFn } from "./shots";

loadHouseFonts();

export type BlackHoleProps = VoiceoverProps;
export const estimatedBlackHole = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

/** Cut this long before a block's first word (J-cut). */
const LEAD = 0.12;

type FlatShot = { at: number; fn: ShotFn; block: number; name: string };

/** Block times and the flat shot list for a word list (also used by scripts/shot-frames.ts). */
export const schedule = (words: VoiceoverManifest["words"]) => {
  const blocks = blockTimes(words, BLOCKS);
  const shots: FlatShot[] = [];
  blocks.forEach((b, bi) => {
    const sceneStart = bi === 0 ? 0 : b.start - LEAD;
    (SHOTS[b.id] ?? []).forEach((s, si) => {
      const at = s.cue ? wordAt(words, s.cue, b.start, sceneStart) - LEAD : sceneStart;
      shots.push({ at: Math.max(sceneStart, at), fn: s.fn, block: bi, name: `${b.id}.${si}` });
    });
  });
  return { blocks, shots };
};

/** Sound effects keyed to narration words, so they stay in sync if the voiceover changes. */
const sfxCues = (words: VoiceoverManifest["words"], blocks: ReturnType<typeof schedule>["blocks"]): Sfx[] => {
  const at = (phrase: string, offset = 0) => Math.max(0, wordAt(words, phrase, 0, -1) + offset);
  const ground = at("The ground", -0.12);
  const outro = blocks[blocks.length - 1];
  const c8 = blocks.find((b) => b.id === "c8")!;
  return [
    { src: "sfx/impact-boom.mp3", at: 0.05, volume: 0.9 },
    { src: "sfx/impact-boom.mp3", at: at("Impact", -LEAD), volume: 1.1 },
    { src: "sfx/moon-whoosh.mp3", at: at("gets flung", -0.35), volume: 0.5 },
    // The rumble clip is ~1 s: chain overlapping copies under "The ground itself bends … Volcanoes wake up".
    ...Array.from({ length: 6 }, (_, i) => ({ src: "sfx/quake-rumble.mp3", at: ground + i * 0.8, volume: 0.42 })),
    { src: "sfx/impact-boom.mp3", at: at("Volcanoes", -0.1), volume: 1.0 },
    ...Array.from({ length: 4 }, (_, i) => ({ src: "sfx/quake-rumble.mp3", at: c8.start - LEAD + i * 0.85, volume: 0.32 })),
    { src: "sfx/planet-breakup.mp3", at: at("ripped", -0.1), volume: 0.6 },
    { src: "sfx/end-sting.mp3", at: outro.end + 0.5, volume: 0.8 },
  ].filter((x) => x.at >= 0);
};

/** Narration gain: the take measures about −26 LUFS; +4 dB keeps its peaks under 0 dBFS. */
const VOICE_VOLUME = 1.6;

export const BlackHoleEpisode: React.FC<BlackHoleProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedBlackHole();
  const words = m.words;

  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const sfx = useMemo(() => (m.estimated ? [] : sfxCues(words, blocks)), [words, blocks, m.estimated]);

  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const blockId = block.id;

  // Story clock (days since the black hole appeared), piecewise over chapters 4–8.
  const days = useMemo(() => {
    const seg = (id: string, d0: number, d1: number, curve: (k: number) => number = (k) => k) => {
      const b = blocks.find((x) => x.id === id)!;
      return { b, d0, d1, curve };
    };
    const segs = [
      seg("c4", 0, 1.0),
      seg("c5", 1.0, 2.2),
      seg("c6", 2.6, 3.05),
      seg("c7", 3.05, 3.405, (k) => k * k),
      seg("c8", 3.405, T_FALL_DAYS),
    ];
    const cur = segs.find((s) => t >= s.b.start - LEAD && t < s.b.end + 0.6) ?? null;
    if (!cur) return t < segs[0].b.start ? 0 : T_FALL_DAYS;
    const k = clamp01((t - (cur.b.start - LEAD)) / (cur.b.end + 0.6 - (cur.b.start - LEAD)));
    return cur.d0 + (cur.d1 - cur.d0) * cur.curve(k);
  }, [blocks, t]);

  const hudOn = ["c4", "c5", "c6", "c7", "c8"].includes(blockId);
  const coldBlock = blocks[0];
  const outro = blocks[blocks.length - 1];
  const endCardFrame = Math.round((outro.end + 0.5) * fps);
  const tag = TAGS[blockId];
  const blockStartFrame = Math.round((block.start - LEAD) * fps);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, days })}

      {blockId === "cold" ? (
        <TitleCard lines={TITLE} startFrame={4} outFrame={Math.round((coldBlock.end + 0.1) * fps)} />
      ) : (
        <BrandLockup chapter={block.chapter} />
      )}
      {tag ? <Tag kind={tag} appearFrame={blockStartFrame + 4} /> : null}
      {hudOn ? (
        <>
          <Readout label="IMPACT IN" value={days >= T_FALL_DAYS ? "NOW" : formatCountdown(days)} pulse={blockId === "c8" ? 0.5 + 0.5 * Math.sin(t * 12) : 0} />
          <Readout label="DISTANCE" value={days >= T_FALL_DAYS ? "0 KM" : formatKm(separationKm(days))} top={196} accent="#FFFFFF" />
        </>
      ) : null}

      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
      {m.estimated ? <EstimatedBadge fade={ease(1 - (frame - (durationInFrames - 30)) / 30)} /> : null}
    </AbsoluteFill>
  );
};

/** Small corner badge so an estimated-timing animatic can never be mistaken for the final cut. */
const EstimatedBadge: React.FC<{ fade: number }> = ({ fade }) => (
  <div
    style={{
      position: "absolute",
      right: 20,
      bottom: 20,
      padding: "6px 10px",
      borderRadius: 6,
      background: "rgba(255,80,60,0.85)",
      color: "white",
      fontFamily: "sans-serif",
      fontSize: 16,
      opacity: fade,
    }}
  >
    ANIMATIC · ESTIMATED TIMING · NO VOICEOVER
  </div>
);
