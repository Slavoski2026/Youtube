/**
 * "What If Earth Lost Its Shield?" (Earth's magnetic field gone for 24 hours) — SLAVOSKI, ep. 8.
 * The user's full script (~61 s narration, "mid" detail). The hook is Slavoski's compass needle letting go,
 * not Earth from space. A "SHIELD DOWN FOR" clock runs 00:00 → 24:00 and the sky follows the day:
 * morning → overcast afternoon → sunset → night with a faint aurora → dawn, when the shield comes back.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { loadHouseFonts } from "../../slavoski/fonts";
import { BrandLockup, EndCard, Readout, Tag, TitleCard } from "../../slavoski/Overlays";
import { Soundtrack, type Sfx } from "../../slavoski/Soundtrack";
import { estimateManifest, scheduleShots, shotAt, wordAt } from "../../slavoski/timeline";
import { WordCaptions } from "../../slavoski/WordCaptions";
import { BLOCKS, KEYWORDS, SLUG, TAGS, TITLE } from "./narration";
import { SHOTS } from "./shots";

loadHouseFonts();

export type ShieldDownProps = VoiceoverProps;
export const estimatedShieldDown = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;
const GREEN = "#7FE0A0";

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

const hhmm = (h: number) => {
  const m = Math.floor(h * 60 + 1e-6);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

export const ShieldDownEpisode: React.FC<ShieldDownProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedShieldDown();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;

  // When the shield goes (on "disappeared") and comes back (the dawn shot, as its loops spring on).
  const tDown = wordAt(words, "disappeared", 0, 2.7);
  const tBack = Math.max(at("c7.5"), 0) + 0.45;

  const sfx = useMemo<Sfx[]>(() => {
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const last = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      // the hook: a glitch as the needle lets go, a whoosh out to space, the shield powering down
      { src: "sfx/tv-static.mp3", at: 0.42, volume: 0.12, duration: 0.3, fade: 0.1 },
      { src: "sfx/moon-whoosh.mp3", at: start("cold.1") - 0.05, volume: 0.3 },
      { src: "sfx/power-down.mp3", at: start("cold.2") + 0.05, volume: 0.32, duration: 1.4, fade: 0.5 },
      { src: "sfx/impact-boom.mp3", at: start("cold.2") + 0.2, volume: 0.16 },
      { src: "sfx/moon-whoosh.mp3", at: start("c2.0") + 0.2, volume: 0.2 },
      { src: "sfx/quake-rumble.mp3", at: start("c2.2"), volume: 0.16, duration: 1.0, fade: 0.4 },
      { src: "sfx/tv-static.mp3", at: start("c2.4") + 0.2, volume: 0.08, duration: 0.4 },
      { src: "sfx/phone-alert.mp3", at: start("c3.0") + 0.25, volume: 0.14 },
      // the solar storm
      { src: "sfx/impact-boom.mp3", at: start("c4.0") + 0.1, volume: 0.32 },
      { src: "sfx/quake-rumble.mp3", at: start("c4.0") + 0.1, volume: 0.34 },
      { src: "sfx/quake-rumble.mp3", at: start("c4.1") + 0.6, volume: 0.3 },
      { src: "sfx/impact-boom.mp3", at: start("c4.1") + 0.95, volume: 0.24 },
      { src: "sfx/tv-static.mp3", at: start("c4.2") + 0.2, volume: 0.12, duration: 0.6, fade: 0.2 },
      { src: "sfx/power-down.mp3", at: start("c4.2") + 0.35, volume: 0.18, duration: 1.0, fade: 0.4 },
      { src: "sfx/tv-static.mp3", at: start("c4.4") + 0.1, volume: 0.07, duration: 1.2, fade: 0.4 },
      { src: "sfx/moon-whoosh.mp3", at: start("c5.0"), volume: 0.2 },
      // dawn: the shield comes back with a soft chime
      { src: "sfx/moon-whoosh.mp3", at: start("c7.5") + 0.15, volume: 0.28 },
      { src: "sfx/notify-chime.mp3", at: tBack + 0.1, volume: 0.2 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks, tBack]);

  // Title appears with the space shot (the compass opens clean) and leaves just before chapter 1.
  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round(((blocks[1]?.start ?? 6.5) - LEAD - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);
  const blockStartFrame = Math.round((block.start - LEAD) * fps);
  const tag = TAGS[block.id];

  // SHIELD DOWN FOR: hours since the shield vanished, paced per chapter (the clock races in the last one).
  const keys: [number, number][] = [
    [tDown, 0],
    [blocks[1].start, 0.1],
    [blocks[2].start, 1],
    [blocks[3].start, 4],
    [blocks[4].start, 6],
    [blocks[5].start, 10],
    [blocks[6].start, 13],
    [blocks[7].start, 16],
    [tBack, 24],
  ];
  const hours = interpolate(
    t,
    keys.map((k) => k[0]),
    keys.map((k) => k[1]),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const down = t >= tDown && t < tBack;
  const readout = down ? (
    <Readout label="SHIELD DOWN FOR" value={hhmm(hours)} />
  ) : (
    <Readout label="EARTH'S SHIELD" value={t < tDown ? "ON" : "BACK ON"} accent={GREEN} />
  );

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      {tag && !(block.id === "cold" && frame < titleOut + 10) ? <Tag kind={tag} appearFrame={blockStartFrame + 4} /> : null}
      {block.id === "cold" && frame < titleIn ? null : readout}
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
