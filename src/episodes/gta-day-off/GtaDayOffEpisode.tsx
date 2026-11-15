/**
 * "What If Everyone Skipped Work for GTA 6?" — SLAVOSKI, ep. 9 (release day, Thursday 19 November 2026).
 * The user's full script (~69 s narration), "mid" detail. A "THU · NOV 19" clock readout follows the day
 * (it flips to FRI · NOV 20 for the "work gets done later" flash-forward). The two statistics are
 * BambooHR's (survey: 18% planned the day off; PTO data: ~13% more leave requests), credited on screen.
 * The game appears only as our own neon art.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { loadHouseFonts } from "../../slavoski/fonts";
import { BrandLockup, EndCard, Readout, Tag, TitleCard } from "../../slavoski/Overlays";
import { Soundtrack, type Sfx } from "../../slavoski/Soundtrack";
import { estimateManifest, scheduleShots, shotAt } from "../../slavoski/timeline";
import { WordCaptions } from "../../slavoski/WordCaptions";
import { BLOCKS, KEYWORDS, SLUG, TAGS, TITLE } from "./narration";
import { SHOTS } from "./shots";

loadHouseFonts();

export type GtaDayOffProps = VoiceoverProps;
export const estimatedGtaDayOff = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

/** Clock time per chapter: [at the chapter's first word, at its last word] (hours, 24 h). */
const CLOCK: [number, number][] = [
  [7.0, 7.1],
  [9.0, 9.75],
  [10.0, 11.0],
  [12.0, 15.5],
  [16.5, 17.5],
  [18.5, 19.5],
  [21.5, 23.85],
];

const hhmm = (h: number) => {
  const m = Math.floor(h * 60 + 1e-6);
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

export const GtaDayOffEpisode: React.FC<GtaDayOffProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedGtaDayOff();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;

  const sfx = useMemo<Sfx[]>(() => {
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const last = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      // 7:00: the alarm, the jump out of bed, the game booting
      // a real bedside alarm (beep-beep-beep-beep), three cycles until he's on the couch
      { src: "sfx/alarm-clock.mp3", at: 0.5, volume: 0.3 },
      { src: "sfx/alarm-clock.mp3", at: 1.5, volume: 0.3 },
      { src: "sfx/alarm-clock.mp3", at: 2.5, volume: 0.22, duration: 0.45, fade: 0.15 },
      { src: "sfx/moon-whoosh.mp3", at: start("cold.1"), volume: 0.18 },
      { src: "sfx/notify-chime.mp3", at: start("cold.2") + 0.25, volume: 0.28 },
      // the sick calls stacking up (soft chimes, never a buzzing phone)
      { src: "sfx/notify-chime.mp3", at: start("c1.1") + 0.2, volume: 0.14 },
      { src: "sfx/notify-chime.mp3", at: start("c1.1") + 1.1, volume: 0.12 },
      // the DAY OFF stamp
      { src: "sfx/impact-boom.mp3", at: start("c2.3") + 0.75, volume: 0.26 },
      // ka-ching at the game store
      { src: "sfx/notify-chime.mp3", at: start("c4.2") + 0.3, volume: 0.3 },
      { src: "sfx/notify-chime.mp3", at: start("c5.3") + 0.3, volume: 0.22 },
      // the traffic keeps moving
      { src: "sfx/moon-whoosh.mp3", at: start("c6.1") + 0.1, volume: 0.16 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks]);

  // Title appears with the second shot (the clock opens clean) and leaves just before chapter 1.
  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round(((blocks[1]?.start ?? 9.5) - LEAD - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);
  const blockStartFrame = Math.round((block.start - LEAD) * fps);
  const tag = TAGS[block.id];
  const inTitle = block.id === "cold" && frame < titleOut + 10;

  // The release-day clock (06:59 until the alarm), and the Friday flash-forward.
  const bi = shot.block;
  const [c0, c1] = CLOCK[bi] ?? [21.5, 23.85];
  const b = blocks[bi];
  const clock = bi === 0 && t < 0.5 ? 6 + 59 / 60 : interpolate(t, [Math.max(b.start, bi === 0 ? 0.5 : b.start), b.end], [c0, c1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const friday = shot.name === "c5.2";
  const readout = friday ? <Readout label="FRI · NOV 20" value="09:12" /> : <Readout label="THU · NOV 19" value={hhmm(clock)} />;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {inTitle ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      {tag && !inTitle ? <Tag kind={tag} appearFrame={blockStartFrame + 4} /> : null}
      {readout}
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
