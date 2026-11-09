/**
 * "What If VERITY Actually Existed in Real Life?" — SLAVOSKI, ep. 8. ~64 s, "mid" detail.
 * Our own faceted yellow smiley smart speaker and creature. Sunny delivery → golden-hour helper →
 * rainy night → a flickering blackout in the hall, lit only by the smile.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { loadHouseFonts } from "../../slavoski/fonts";
import { BrandLockup, EndCard, Readout, TitleCard } from "../../slavoski/Overlays";
import { Soundtrack, type Sfx } from "../../slavoski/Soundtrack";
import { estimateManifest, scheduleShots, shotAt, wordAt } from "../../slavoski/timeline";
import { WordCaptions } from "../../slavoski/WordCaptions";
import { BLOCKS, KEYWORDS, SLUG, TITLE } from "./narration";
import { SHOTS } from "./shots";

loadHouseFonts();

export type VerityProps = VoiceoverProps;
export const estimatedVerity = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;
const GREEN = "#5BD08A";
const RED = "#FF5A4A";
const GREY = "#9AA1B0";

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

export const VerityEpisode: React.FC<VerityProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedVerity();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;

  const sfx = useMemo<Sfx[]>(() => {
    const s = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const last = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      { src: "sfx/notify-chime.mp3", at: s("cold.0") + 0.2, volume: 0.35 },
      { src: "sfx/quake-rumble.mp3", at: s("cold.1") + 1.2, volume: 0.25, duration: 2.2, fade: 0.8 },
      { src: "sfx/gate-creak.mp3", at: s("c1.0") + 0.5, volume: 0.3, duration: 1.2 },
      { src: "sfx/pebble-scratch.mp3", at: s("c1.1"), volume: 0.25, duration: 0.8 },
      { src: "sfx/notify-chime.mp3", at: s("c1.2") + 0.18, volume: 0.5 },
      { src: "sfx/notify-chime.mp3", at: s("c2.3") + 0.25, volume: 0.2 },
      { src: "sfx/notify-chime.mp3", at: s("c2.3") + 0.75, volume: 0.2 },
      { src: "sfx/impact-boom.mp3", at: s("c3.0") + 1.0, volume: 0.3 },
      { src: "sfx/quake-rumble.mp3", at: s("c3.0") + 1.0, volume: 0.3, duration: 2.0, fade: 0.8 },
      { src: "sfx/tv-static.mp3", at: s("c3.2") + 0.1, volume: 0.1, duration: 0.4 },
      { src: "sfx/power-down.mp3", at: s("c4.0") + 0.3, volume: 0.3, duration: 1.2, fade: 0.4 },
      { src: "sfx/light-flicker.mp3", at: s("c4.1"), volume: 0.55 },
      { src: "sfx/light-flicker.mp3", at: s("c4.1") + 0.95, volume: 0.45 },
      // a soft ring (the user dislikes buzzing phones): the chime three times
      { src: "sfx/notify-chime.mp3", at: s("c4.2") + 0.15, volume: 0.45 },
      { src: "sfx/notify-chime.mp3", at: s("c4.2") + 0.85, volume: 0.45 },
      { src: "sfx/notify-chime.mp3", at: s("c4.3") + 0.4, volume: 0.45 },
      { src: "sfx/impact-boom.mp3", at: s("c4.4") + 1.15, volume: 0.22, duration: 0.7 },
      { src: "sfx/footsteps-upstairs.mp3", at: s("c5.0"), volume: 0.8 },
      { src: "sfx/footsteps-upstairs.mp3", at: s("c5.0") + 1.0, volume: 0.8 },
      { src: "sfx/footsteps-upstairs.mp3", at: s("c5.0") + 2.0, volume: 0.7 },
      { src: "sfx/light-flicker.mp3", at: s("c5.2"), volume: 0.4 },
      { src: "sfx/quake-rumble.mp3", at: s("c5.2") + 0.2, volume: 0.25, duration: 2.0, fade: 0.8 },
      { src: "sfx/creature-breath.mp3", at: s("c5.3"), volume: 0.6 },
      { src: "sfx/creature-breath.mp3", at: s("c5.4") + 0.3, volume: 0.6 },
      { src: "sfx/door-rattle.mp3", at: s("c6.1"), volume: 0.75 },
      { src: "sfx/door-rattle.mp3", at: s("c6.1") + 0.8, volume: 0.6 },
      { src: "sfx/creature-breath.mp3", at: s("c6.5") + 0.6, volume: 0.7 },
      { src: "sfx/impact-boom.mp3", at: s("c6.5") + 1.4, volume: 0.4 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks]);

  // Title comes in with the house shot (the eyes open clean) and leaves before chapter 1.
  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round(((blocks[1]?.start ?? 4) - LEAD - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);

  // VERITY status readout, keyed to the words.
  const speaks = wordAt(words, "it speaks", 0, 10.3) + 0.5;
  const refuses = wordAt(words, "refuses", 20, 26.3);
  const unplug = wordAt(words, "unplug", 30, 32.1);
  const rings = wordAt(words, "rings", 34, 35.5);
  const behind = wordAt(words, "standing right", 58, 59.9);
  const [status, accent] =
    t < speaks ? ["OFFLINE", GREY] : t < refuses ? ["ONLINE", GREEN] : t < unplug ? ["REFUSING", RED] : t < rings ? ["UNPLUGGED", GREY] : t < behind ? ["STILL ONLINE", RED] : ["BEHIND YOU", RED];

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      <Readout label="VERITY" value={status} accent={accent} />
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
