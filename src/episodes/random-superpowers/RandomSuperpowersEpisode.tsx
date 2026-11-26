/**
 * "What If Every Human Got a Random Superpower?" — SLAVOSKI, ep. 8. 60 s cut, "mid" detail.
 * The hook opens on Slavoski as the powers arrive (not on Earth); a "YOUR POWER" readout spins through
 * powers and lands on SOCK COLOUR. Generic, original powers: no comic-brand costumes or emblems.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { loadHouseFonts } from "../../slavoski/fonts";
import { BrandLockup, EndCard, Readout, TitleCard } from "../../slavoski/Overlays";
import { Soundtrack, type Sfx } from "../../slavoski/Soundtrack";
import { estimateManifest, scheduleShots, shotAt, wordAt } from "../../slavoski/timeline";
import { WordCaptions } from "../../slavoski/WordCaptions";
import { BLOCKS, KEYWORDS, MY_POWER, POWERS, SLUG, TITLE } from "./narration";
import { POWER_COLORS } from "./props";
import { SHOTS } from "./shots";

loadHouseFonts();

export type RandomSuperpowersProps = VoiceoverProps;
export const estimatedRandomSuperpowers = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

export const RandomSuperpowersEpisode: React.FC<RandomSuperpowersProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedRandomSuperpowers();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;

  const sfx = useMemo<Sfx[]>(() => {
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const last = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      // the powers arrive: a whoosh as the ring drops, another as the wave sweeps the street
      { src: "sfx/moon-whoosh.mp3", at: 0.05, volume: 0.28 },
      { src: "sfx/moon-whoosh.mp3", at: start("cold.1"), volume: 0.22 },
      { src: "sfx/moon-whoosh.mp3", at: start("cold.3") + 0.15, volume: 0.2 },
      { src: "sfx/teleport-zap.mp3", at: start("cold.4") + 0.35, volume: 0.35 },
      { src: "sfx/teleport-zap.mp3", at: start("cold.4") + 0.8, volume: 0.45 },
      { src: "sfx/notify-chime.mp3", at: start("cold.7") + 0.05, volume: 0.35 },
      // 01: the car flung, the building keeling over
      { src: "sfx/impact-boom.mp3", at: start("c1.2") + 0.38, volume: 0.3 },
      { src: "sfx/quake-rumble.mp3", at: start("c1.3") + 0.3, volume: 0.32, duration: 1.6, fade: 0.5 },
      // 02: the invisible man
      { src: "sfx/teleport-zap.mp3", at: start("c2.2") + 0.4, volume: 0.2 },
      // 03: the tank stopped, the jet overtaken
      { src: "sfx/impact-boom.mp3", at: start("c3.2") + 0.55, volume: 0.32 },
      { src: "sfx/jet-flyover.mp3", at: start("c3.4"), volume: 0.22, duration: 2.2, fade: 0.6 },
      { src: "sfx/impact-boom.mp3", at: start("c3.4") + 0.87, volume: 0.4 },
      // 05: time stops, reality bends, powers drain
      { src: "sfx/power-down.mp3", at: start("c5.2"), volume: 0.28, duration: 1.2, fade: 0.4 },
      { src: "sfx/quake-rumble.mp3", at: start("c5.3"), volume: 0.22, duration: 1.6, fade: 0.5 },
      { src: "sfx/moon-whoosh.mp3", at: start("c5.4") + 0.1, volume: 0.22 },
      // 06: thunder, the meteor, the coin
      { src: "sfx/thunder-crack.mp3", at: start("c6.0") + 0.3, volume: 0.4 },
      { src: "sfx/moon-whoosh.mp3", at: start("c6.1"), volume: 0.22 },
      { src: "sfx/thunder-crack.mp3", at: start("c6.3") + 1.05, volume: 0.3 },
      { src: "sfx/notify-chime.mp3", at: start("c6.4") + 1.1, volume: 0.3 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks]);

  // Title appears with the wave shot (the first frame is clean) and leaves before "Your neighbor".
  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round((wordAt(words, "Your neighbor", 0, 4.2) - LEAD - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);

  // YOUR POWER: "???" until "random", then spinning through powers, slowing, and landing on SOCK COLOUR at "socks".
  const tSpin = wordAt(words, "random", 0, 2.7);
  const tLand = wordAt(words, "socks", 0, 10.1);
  const step = t > tLand - 1.6 ? 0.24 : 0.1;
  const value = t < tSpin ? "???" : t < tLand ? POWERS[Math.floor((t - tSpin) / step) % POWERS.length] : MY_POWER;
  const landed = t >= tLand;
  const pulse = landed ? Math.max(0, 1 - (t - tLand) / 0.6) : 0;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      <Readout label="YOUR POWER" value={value} accent={landed ? POWER_COLORS.socks : undefined} pulse={pulse} />
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
