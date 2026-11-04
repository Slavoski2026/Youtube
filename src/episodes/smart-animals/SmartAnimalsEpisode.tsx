/**
 * "What If Every Animal Got As Smart As Us?" — SLAVOSKI, ep. 4. A 60-second Short.
 * First episode at the kit's "mid" detail level (bevelled boxes, more facets), now the house default.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { DetailProvider } from "../../slavoski/detail";
import { loadHouseFonts } from "../../slavoski/fonts";
import { BrandLockup, EndCard, Readout, Tag, TitleCard } from "../../slavoski/Overlays";
import { Soundtrack, type Sfx } from "../../slavoski/Soundtrack";
import { estimateManifest, scheduleShots, shotAt } from "../../slavoski/timeline";
import { WordCaptions } from "../../slavoski/WordCaptions";
import { BLOCKS, CLOCK, KEYWORDS, SLUG, TAGS, TITLE } from "./narration";
import { SHOTS } from "./shots";

loadHouseFonts();

export type SmartAnimalsProps = VoiceoverProps;
export const estimatedSmartAnimals = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

export const SmartAnimalsEpisode: React.FC<SmartAnimalsProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedSmartAnimals();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];

  const sfx = useMemo<Sfx[]>(() => {
    // Ep. 4's 13 animal effects plus reused ones from ep. 1–3.
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const last = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      { src: "sfx/moon-whoosh.mp3", at: start("cold.0") + 0.15, volume: 0.35 },
      { src: "sfx/moon-whoosh.mp3", at: start("cold.1") + 0.2, volume: 0.3 },
      // ep. 4 animal effects (generated for this episode)
      { src: "sfx/pigeon-coo.mp3", at: start("c1.1") + 0.3, volume: 0.45 },
      { src: "sfx/pebble-scratch.mp3", at: start("c1.3"), volume: 0.4, duration: 1.35 },
      { src: "sfx/dog-grumble.mp3", at: start("c2.1") + 1.1, volume: 0.5, duration: 1.5 },
      { src: "sfx/cat-purr.mp3", at: start("c2.2") + 0.2, volume: 0.8 },
      { src: "sfx/tank-lid.mp3", at: start("c2.4") + 0.4, volume: 0.5 },
      { src: "sfx/chimp-hoots.mp3", at: start("c3.1") + 0.3, volume: 0.3 },
      { src: "sfx/crow-caws.mp3", at: start("c3.3") + 0.3, volume: 0.35 },
      { src: "sfx/cow-moo.mp3", at: start("c4.3") + 0.1, volume: 0.18 },
      { src: "sfx/fence-smash.mp3", at: start("c4.4") + 0.28, volume: 0.42 },
      { src: "sfx/impact-boom.mp3", at: start("c4.4") + 0.3, volume: 0.22 },
      { src: "sfx/gate-creak.mp3", at: start("c4.5") + 0.1, volume: 0.4, duration: 1.3 },
      { src: "sfx/chicken-flurry.mp3", at: start("c4.7"), volume: 0.4, duration: 1.3 },
      { src: "sfx/rat-swarm.mp3", at: start("c5.1"), volume: 0.45 },
      { src: "sfx/power-down.mp3", at: start("c5.2") + 0.45, volume: 0.5, duration: 3.0, fade: 0.6 },
      { src: "sfx/quake-rumble.mp3", at: start("c6.4") + 0.05, volume: 0.45 },
      { src: "sfx/cat-purr.mp3", at: start("c7.3"), volume: 0.6, duration: 1.2 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.8 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks]);

  const tag = TAGS[block.id];
  const titleOut = Math.round(((shots[1]?.at ?? blocks[0].end) - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);
  const blockStartFrame = Math.round((block.start - LEAD) * fps);
  const clock = CLOCK[block.id];

  return (
    <DetailProvider value="mid">
      <AbsoluteFill style={{ background: "#000" }}>
        {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
        {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={4} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
        {tag ? <Tag kind={tag} appearFrame={blockStartFrame + 4} /> : null}
        {clock ? <Readout label="TIME SINCE THE CHANGE" value={clock} /> : null}
        <WordCaptions words={words} keywords={KEYWORDS} />
        {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
        <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
      </AbsoluteFill>
    </DetailProvider>
  );
};
