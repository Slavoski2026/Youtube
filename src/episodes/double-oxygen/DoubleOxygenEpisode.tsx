/**
 * "What If Earth's Oxygen DOUBLED Overnight?" — SLAVOSKI, ep. 9. ~95 s (the user accepted the overrun), "mid" detail.
 * Hook: a match roaring into a tower of flame. An OXYGEN readout: 21% → 42% (35% in the swamp, 300 million years ago).
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
import { BLOCKS, KEYWORDS, SLUG, TAGS, TITLE } from "./narration";
import { SHOTS } from "./shots";

loadHouseFonts();

export type DoubleOxygenProps = VoiceoverProps;
export const estimatedDoubleOxygen = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

export const DoubleOxygenEpisode: React.FC<DoubleOxygenProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedDoubleOxygen();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;

  const sfx = useMemo<Sfx[]>(() => {
    const s = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const last = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      { src: "sfx/match-flare.mp3", at: s("cold.0") + 0.05, volume: 0.6, duration: 2.2, fade: 0.8 },
      { src: "sfx/moon-whoosh.mp3", at: s("cold.2") - 0.05, volume: 0.2 },
      { src: "sfx/notify-chime.mp3", at: s("c1.3") + 0.5, volume: 0.25 },
      { src: "sfx/deep-breath.mp3", at: s("c1.4") + 0.85, volume: 0.6 },
      { src: "sfx/match-flare.mp3", at: s("c2.0") + 0.55, volume: 0.25, duration: 0.8, fade: 0.4 },
      { src: "sfx/match-flare.mp3", at: s("c2.1") - 0.05, volume: 0.75, duration: 2.4, fade: 0.8 },
      { src: "sfx/wildfire-roar.mp3", at: s("c2.3") + 0.3, volume: 0.5 },
      { src: "sfx/wildfire-roar.mp3", at: s("c2.3") + 1.2, volume: 0.6 },
      { src: "sfx/wildfire-roar.mp3", at: s("c2.4"), volume: 0.7 },
      { src: "sfx/wildfire-roar.mp3", at: s("c2.4") + 0.9, volume: 0.7 },
      { src: "sfx/jet-flyover.mp3", at: s("c2.5"), volume: 0.35, duration: 2.4, fade: 0.6 },
      { src: "sfx/wildfire-roar.mp3", at: s("c2.5") + 1.4, volume: 0.5 },
      { src: "sfx/deep-breath.mp3", at: s("c3.3") + 0.2, volume: 0.7 },
      { src: "sfx/deep-breath.mp3", at: s("c3.3") + 1.4, volume: 0.6 },
      { src: "sfx/power-down.mp3", at: s("c3.7") + 0.1, volume: 0.18, duration: 1.0, fade: 0.4 },
      { src: "sfx/moon-whoosh.mp3", at: s("c4.1") - 0.1, volume: 0.25 },
      { src: "sfx/giant-wings.mp3", at: s("c4.3") + 0.5, volume: 0.8 },
      { src: "sfx/giant-wings.mp3", at: s("c4.3") + 1.4, volume: 0.9 },
      { src: "sfx/rat-swarm.mp3", at: s("c4.4") + 0.2, volume: 0.25, duration: 2.2, fade: 0.6 },
      { src: "sfx/quake-rumble.mp3", at: s("c5.0"), volume: 0.3, duration: 1.6, fade: 0.6 },
      { src: "sfx/crow-caws.mp3", at: s("c5.3") + 0.3, volume: 0.4, duration: 1.4 },
      { src: "sfx/giant-wings.mp3", at: s("c5.5") + 0.4, volume: 0.5 },
      { src: "sfx/deep-breath.mp3", at: s("c6.1") + 0.3, volume: 0.6 },
      { src: "sfx/wildfire-roar.mp3", at: s("c6.2") + 0.4, volume: 0.3 },
      { src: "sfx/match-flare.mp3", at: s("c6.3") + 0.2, volume: 0.6, duration: 1.8, fade: 0.5 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks]);

  // Title comes in with the face shot (the match strike opens clean) and leaves before chapter 1.
  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round(((blocks[1]?.start ?? 4) - LEAD - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);
  const blockStartFrame = Math.round((block.start - LEAD) * fps);
  const tag = TAGS[block.id];

  // OXYGEN readout: 21% → 42% on "jumped"; about 35% in the swamp 300 million years ago.
  const jump = wordAt(words, "jumped", 8, 12);
  const past0 = wordAt(words, "millions of years ago", 50, 52.4);
  const past1 = blocks.find((b) => b.id === "c5")?.start ?? 67;
  const o2 = t < jump ? 21 : Math.round(21 + 21 * clamp01((t - jump) / 0.9));
  const past = t >= past0 - LEAD && t < past1 - LEAD;
  const label = past ? "OXYGEN · 300M YEARS AGO" : "OXYGEN";
  const value = past ? "~35%" : `${o2}%`;
  const accent = past ? "#7FD6A0" : o2 > 21 ? "#FF6A4A" : "#FFFFFF";

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      {tag ? <Tag kind={tag} appearFrame={blockStartFrame + 4} /> : null}
      <Readout label={label} value={value} accent={accent} />
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
