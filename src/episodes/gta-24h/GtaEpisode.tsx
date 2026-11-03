/**
 * "What If You Played GTA 6 for 24 Hours Straight?" — SLAVOSKI, ep. 3.
 * The game on screen is our own low-poly world: no Rockstar art, logos, map or HUD.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { loadHouseFonts } from "../../slavoski/fonts";
import { BrandLockup, EndCard, Readout, Tag, TitleCard } from "../../slavoski/Overlays";
import { Soundtrack, type Sfx } from "../../slavoski/Soundtrack";
import { estimateManifest, scheduleShots, shotAt } from "../../slavoski/timeline";
import { WordCaptions } from "../../slavoski/WordCaptions";
import { BLOCKS, HOURS, KEYWORDS, SLUG, TAGS, TITLE } from "./narration";
import { SkillBar } from "./props";
import { SHOTS } from "./shots";

loadHouseFonts();

export type GtaProps = VoiceoverProps;
export const estimatedGta = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;
const SKILL: Record<string, number> = { cold: 0.9, c1: 1, c2: 0.85, c3: 0.65, c4: 0.4, c5: 0.2, c6: 0.08, c7: 0.05 };

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

export const GtaEpisode: React.FC<GtaProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedGta();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];

  const sfx = useMemo<Sfx[]>(() => {
    // Reuses the sound effects from earlier episodes (no new credits).
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const last = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      { src: "sfx/moon-whoosh.mp3", at: start("cold.1") + 0.1, volume: 0.4 },
      { src: "sfx/impact-boom.mp3", at: start("cold.2") + 0.05, volume: 0.6 },
      { src: "sfx/moon-whoosh.mp3", at: start("c1.2") + 0.5, volume: 0.4 },
      { src: "sfx/impact-boom.mp3", at: start("c1.3") + 0.45, volume: 0.9 },
      { src: "sfx/planet-breakup.mp3", at: start("c1.3") + 0.2, volume: 0.35 },
      { src: "sfx/impact-boom.mp3", at: start("c3.1") + 0.9, volume: 0.9 },
      { src: "sfx/impact-boom.mp3", at: start("c4.1") + 0.8, volume: 1.0 },
      // phone buzz: two short low rumbles
      { src: "sfx/quake-rumble.mp3", at: start("c7.4") + 0.05, volume: 0.35 },
      { src: "sfx/quake-rumble.mp3", at: start("c7.4") + 0.45, volume: 0.3 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.8 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks]);

  const tag = TAGS[block.id];
  const titleOut = Math.round(((shots[1]?.at ?? blocks[0].end) - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);
  const blockStartFrame = Math.round((block.start - LEAD) * fps);
  const hudOn = block.id !== "cold" && block.id !== "c7";

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={4} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      {tag ? <Tag kind={tag} appearFrame={blockStartFrame + 4} /> : null}
      {hudOn ? (
        <>
          <Readout label="HOURS PLAYED" value={`${HOURS[block.id]}H`} />
          <SkillBar value={SKILL[block.id] ?? 1} />
        </>
      ) : null}
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
