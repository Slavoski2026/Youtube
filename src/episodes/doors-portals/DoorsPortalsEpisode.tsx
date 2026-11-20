/**
 * "What If Every Door Became a Portal?" — SLAVOSKI, ep. 8. ~97 s (the user chose the full script), "mid" detail.
 * Doors are real stencil portals (src/slavoski/portal.tsx): each opening shows another 3D world with
 * true parallax. The hook opens on a hallway clock flipping to 9:00, not on Earth from space.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { loadHouseFonts } from "../../slavoski/fonts";
import { BrandLockup, EndCard, Readout, TitleCard } from "../../slavoski/Overlays";
import { Soundtrack, type Sfx } from "../../slavoski/Soundtrack";
import { estimateManifest, scheduleShots, shotAt, wordAt } from "../../slavoski/timeline";
import { WordCaptions } from "../../slavoski/WordCaptions";
import { BLOCKS, CLOCK, KEYWORDS, SLUG, TITLE } from "./narration";
import { SHOTS } from "./shots";

loadHouseFonts();

export type DoorsPortalsProps = VoiceoverProps;
export const estimatedDoorsPortals = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

export const DoorsPortalsEpisode: React.FC<DoorsPortalsProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedDoorsPortals();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;

  const sfx = useMemo<Sfx[]>(() => {
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const last = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      // 9:00: the clock ticks over, the door rattles, every door flares
      { src: "sfx/notify-chime.mp3", at: start("cold.0") + 0.78, volume: 0.35 },
      { src: "sfx/quake-rumble.mp3", at: start("cold.1"), volume: 0.25, duration: 1.0, fade: 0.3 },
      { src: "sfx/moon-whoosh.mp3", at: start("cold.2"), volume: 0.3 },
      { src: "sfx/gate-creak.mp3", at: start("cold.3") + 0.05, volume: 0.35, duration: 1.0 },
      { src: "sfx/moon-whoosh.mp3", at: start("cold.3") + 0.12, volume: 0.28 },
      { src: "sfx/moon-whoosh.mp3", at: start("cold.4"), volume: 0.24 },
      // 01: the bathroom door, the fridge
      { src: "sfx/gate-creak.mp3", at: start("c1.1") + 0.2, volume: 0.32, duration: 1.2 },
      { src: "sfx/moon-whoosh.mp3", at: start("c1.1") + 0.45, volume: 0.3 },
      { src: "sfx/moon-whoosh.mp3", at: start("c1.5") + 0.2, volume: 0.26 },
      // 02: chaos, the cow, the market, the mansion
      { src: "sfx/cow-moo.mp3", at: start("c2.1") + 0.5, volume: 0.4 },
      { src: "sfx/moon-whoosh.mp3", at: start("c2.2") + 0.1, volume: 0.24 },
      { src: "sfx/gate-creak.mp3", at: start("c2.5"), volume: 0.28, duration: 0.9 },
      // 03: the order, the operating theatre, the cell
      { src: "sfx/phone-alert.mp3", at: start("c3.0") + 0.1, volume: 0.22, duration: 1.6, fade: 0.4 },
      { src: "sfx/moon-whoosh.mp3", at: start("c3.3") + 0.4, volume: 0.26 },
      { src: "sfx/gate-creak.mp3", at: start("c3.4"), volume: 0.28, duration: 0.7 },
      // 04: the test door, the base
      { src: "sfx/moon-whoosh.mp3", at: start("c4.2"), volume: 0.2 },
      { src: "sfx/jet-flyover.mp3", at: start("c4.5"), volume: 0.18, duration: 2.4, fade: 0.6 },
      // 05: splash
      { src: "sfx/impact-boom.mp3", at: start("c5.3") + 0.6, volume: 0.2 },
      // 06: the black room
      { src: "sfx/quake-rumble.mp3", at: start("c6.1"), volume: 0.3, duration: 1.6, fade: 0.5 },
      { src: "sfx/gate-creak.mp3", at: start("c6.3") + 0.15, volume: 0.32, duration: 1.4 },
      { src: "sfx/power-down.mp3", at: start("c6.4"), volume: 0.24, duration: 1.4, fade: 0.5 },
      // 07: the feed
      { src: "sfx/tv-static.mp3", at: start("c7.1"), volume: 0.12, duration: 0.4, fade: 0.2 },
      { src: "sfx/moon-whoosh.mp3", at: start("c7.2"), volume: 0.26 },
      // 08: the handle, the door, the visitor
      { src: "sfx/gate-creak.mp3", at: start("c8.1") + 0.05, volume: 0.4, duration: 1.5 },
      { src: "sfx/quake-rumble.mp3", at: start("c8.2"), volume: 0.3, duration: 2.0, fade: 0.6 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks]);

  // Title appears with the street shot (the clock opens clean) and leaves just before chapter 1.
  const titleIn = Math.round(Math.max(0, at("cold.2")) * fps);
  const titleOut = Math.round(((blocks[1]?.start ?? 5) - LEAD - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);

  // DAY / time readout; the cold open ticks 08:59 → 09:00 on "nine", the void glitches.
  const nine = wordAt(words, "nine", 0, 0.9);
  const [day, time] = CLOCK[block.id] ?? ["DAY 1", "09:00"];
  const value = block.id === "cold" && t < nine ? "08:59" : block.id === "c8" ? (Math.floor(t * 8) % 3 ? "??:??" : "--:--") : time;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      <Readout label={day} value={value} accent={block.id === "c8" ? "#C88AFF" : undefined} />
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
