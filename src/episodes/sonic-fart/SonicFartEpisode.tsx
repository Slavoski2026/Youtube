/**
 * "What If You Farted at the Speed of Sound?" — SLAVOSKI, ep. 8. ~56 s, "mid" detail. PG throughout.
 * Hook: a silent library, a FART SPEED readout racing to 767 MPH, then the blast.
 * Arc: sunny library morning → bright salt flat → overcast lab → golden afternoon → sunset pad → night dinner.
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
import { BLOCKS, KEYWORDS, MACH1_MPH, SLUG, TAGS, TITLE } from "./narration";
import { machNumber, SHOTS } from "./shots";

loadHouseFonts();

export type SonicFartProps = VoiceoverProps;
export const estimatedSonicFart = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

export const SonicFartEpisode: React.FC<SonicFartProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedSonicFart();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;

  const sfx = useMemo<Sfx[]>(() => {
    const w = (p: string, from = 0, fb = -1) => wordAt(words, p, from, fb);
    const last = blocks[blocks.length - 1];
    const blastCold = w("hour", 3) + 0.26;
    const cues: Sfx[] = [
      // the hook: the library blast
      { src: "sfx/fart-blast.mp3", at: blastCold - 0.05, volume: 0.75 },
      { src: "sfx/impact-boom.mp3", at: blastCold + 0.02, volume: 0.35 },
      // 01: the salt-flat blast, the tiny boom, the ding, the glass
      { src: "sfx/fart-blast.mp3", at: w("blast", 6), volume: 0.45 },
      { src: "sfx/impact-boom.mp3", at: w("blast", 6) + 0.05, volume: 0.4 },
      { src: "sfx/moon-whoosh.mp3", at: at("c1.1") + 0.2, volume: 0.22, duration: 2.6, fade: 0.6 },
      { src: "sfx/impact-boom.mp3", at: w("boom", 12) - 0.02, volume: 0.12, duration: 0.6, fade: 0.3 },
      { src: "sfx/notify-chime.mp3", at: at("c1.3") + 0.12, volume: 0.45 },
      { src: "sfx/fart-blast.mp3", at: w("broken", 15) - 0.24, volume: 0.25, duration: 0.4, fade: 0.15 },
      { src: "sfx/fence-smash.mp3", at: w("broken", 15) + 0.06, volume: 0.42 },
      // 02: the alarm and the pop
      { src: "sfx/phone-alert.mp3", at: at("c2.3") + 0.05, volume: 0.22, duration: 2.0, fade: 0.4 },
      { src: "sfx/impact-boom.mp3", at: w("escaped", 27) + 0.12, volume: 0.32, duration: 0.5, fade: 0.25 },
      // 03: the anvil, the pfft
      { src: "sfx/moon-whoosh.mp3", at: w("indestructible", 30) - 0.5, volume: 0.25, duration: 0.7, fade: 0.2 },
      { src: "sfx/tank-lid.mp3", at: w("indestructible", 30) + 0.12, volume: 0.55 },
      { src: "sfx/fart-blast.mp3", at: at("c3.2") + 0.35, volume: 0.2, duration: 0.35, fade: 0.15 },
      // 04: pfft, then the real rocket
      { src: "sfx/fart-blast.mp3", at: at("c4.3") + 0.12, volume: 0.18, duration: 0.3, fade: 0.12 },
      { src: "sfx/quake-rumble.mp3", at: at("c4.3") + 0.35, volume: 0.45, duration: 2.2, fade: 0.6 },
      { src: "sfx/jet-flyover.mp3", at: at("c4.3") + 0.4, volume: 0.25, duration: 2.0, fade: 0.6 },
      // 05: the rip, the chairs
      { src: "sfx/cloth-rip.mp3", at: w("trousers", 48), volume: 0.6 },
      { src: "sfx/chairs-scrape.mp3", at: w("and", 50) + 0.05, volume: 0.45, duration: 2.6, fade: 0.6 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks, words]);

  // Title appears with the wide library shot (the face opens clean) and leaves just before chapter 1.
  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round(((blocks[1]?.start ?? 6) - LEAD - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);
  const blockStartFrame = Math.round((block.start - LEAD) * fps);
  const tag = TAGS[block.id];

  // FART SPEED: 0 → 767 MPH over the opening line (accelerating), shown in the cold open and chapter 1.
  const r0 = 0.45;
  const r1 = wordAt(words, "hour", 3, 4.2) + 0.2;
  const k = clamp01((t - r0) / (r1 - r0));
  let mph = Math.round(MACH1_MPH * k * k);
  const machShot = shots.find((x) => x.name === "c1.1");
  const machEnd = shots.find((x) => x.name === "c1.2")?.at ?? Infinity;
  if (machShot && t >= machShot.at && t < machEnd) mph = Math.round(MACH1_MPH * machNumber(Math.max(0, t - machShot.at - 0.15)));
  const showReadout = block.id === "cold" || block.id === "c1";

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      {tag ? <Tag kind={tag} appearFrame={blockStartFrame + 4} /> : null}
      {showReadout ? <Readout label="FART SPEED" value={`${mph.toLocaleString("en-US")} MPH`} accent={mph >= MACH1_MPH ? "#FF5A4A" : undefined} pulse={mph >= MACH1_MPH ? 1 : 0} /> : null}
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
