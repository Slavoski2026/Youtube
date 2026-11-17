/**
 * "What If the Internet Disappeared?" — SLAVOSKI, ep. 8. ~87 s (the user chose the full script), "mid" detail.
 * Fictional scenario: a real CEO is named in the narration only; on screen he is an anonymous man in a
 * black leather jacket, never framed face-on. No real logos. The hook opens on Slavoski's phone, not Earth.
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
import { BLOCKS, KEYWORDS, SLUG, TITLE } from "./narration";
import { Stamp } from "./props";
import { SHOTS } from "./shots";

loadHouseFonts();

export type InternetGoneProps = VoiceoverProps;
export const estimatedInternetGone = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

/** INTERNET readout: 0% in the cold open (tomorrow), 100% the night before, AI's share lost, then 0%. */
const AI_SHARE = 0.19;

export const InternetGoneEpisode: React.FC<InternetGoneProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedInternetGone();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
  const w = (phrase: string, from: number, fallback: number) => wordAt(words, phrase, from, fallback);

  const sfx = useMemo<Sfx[]>(() => {
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const word = (phrase: string, from: number, fb: number) => wordAt(words, phrase, from, fb);
    const last = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      // the hook: the feed dies, then one blip per dead app
      { src: "sfx/tv-static.mp3", at: start("cold.0") + 0.48, volume: 0.16, duration: 0.3, fade: 0.1 },
      ...["YouTube", "TikTok", "Google"].map((x) => ({ src: "sfx/tv-static.mp3", at: word(x, 4, 5) + 0.05, volume: 0.1, duration: 0.18, fade: 0.06 })),
      // the night before
      { src: "sfx/moon-whoosh.mp3", at: start("c1.0") - 0.05, volume: 0.25 },
      { src: "sfx/tank-lid.mp3", at: start("c1.4") + 0.35, volume: 0.35, duration: 1.0, fade: 0.3 },
      { src: "sfx/impact-boom.mp3", at: word("AI", 19.6, 20.3), volume: 0.42 },
      // servers die
      { src: "sfx/power-down.mp3", at: word("begin", 24, 25.5), volume: 0.42, duration: 2.6, fade: 0.8 },
      { src: "sfx/tv-static.mp3", at: word("stop", 28.6, 29.9), volume: 0.16, duration: 0.5, fade: 0.15 },
      { src: "sfx/power-down.mp3", at: word("systems", 32.5, 33.9) - 0.1, volume: 0.22, duration: 1.2, fade: 0.4 },
      // the catch: useless presses
      { src: "sfx/impact-boom.mp3", at: start("c3.0") + 0.5, volume: 0.16 },
      { src: "sfx/impact-boom.mp3", at: start("c3.0") + 1.25, volume: 0.16 },
      { src: "sfx/impact-boom.mp3", at: start("c3.3") + 0.45, volume: 0.13 },
      { src: "sfx/impact-boom.mp3", at: start("c3.3") + 1.05, volume: 0.13 },
      // the failure
      { src: "sfx/quake-rumble.mp3", at: start("c4.0"), volume: 0.3, duration: 3.6, fade: 0.9 },
      { src: "sfx/tv-static.mp3", at: start("c4.1") + 0.35, volume: 0.18, duration: 1.4, fade: 0.4 },
      { src: "sfx/power-down.mp3", at: word("failure", 48, 49.8), volume: 0.28, duration: 1.2, fade: 0.4 },
      { src: "sfx/tv-static.mp3", at: start("c4.3") + 0.95, volume: 0.12, duration: 0.25, fade: 0.08 },
      { src: "sfx/power-down.mp3", at: start("c4.6"), volume: 0.2, duration: 1.2, fade: 0.4 },
      // tower sparks in the rain
      { src: "sfx/tv-static.mp3", at: start("c5.4"), volume: 0.12, duration: 1.2, fade: 0.4 },
      // a calm garden morning
      { src: "sfx/pigeon-coo.mp3", at: start("c6.0") + 0.1, volume: 0.3, duration: 1.6, fade: 0.4 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks, words]);

  // Title appears with the second shot (the phone opens clean) and leaves just before chapter 1.
  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round(((blocks[1]?.start ?? 8) - LEAD - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);

  // FICTIONAL SCENARIO: from "fictional" through chapter 1, and again when he returns in chapter 6.
  const tFiction = w("fictional", 8, 12.9);
  const showTag = (block.id === "c1" && t >= tFiction - 0.1) || block.id === "c6";
  const tagFrame = Math.round((block.id === "c1" ? tFiction - 0.1 : block.start - LEAD) * fps) + 2;

  // INTERNET readout.
  const tShut = w("shutting", 23, 25.8);
  const tFail = w("catastrophic", 45, 49);
  const pct = (() => {
    if (block.id === "cold") return 0;
    if (t < tShut) return 1;
    if (t < tFail) return 1 - AI_SHARE * clamp01((t - tShut) / 1.2);
    return (1 - AI_SHARE) * (1 - clamp01((t - tFail) / 1.3));
  })();
  const pctText = `${Math.round(pct * 100)}%`;

  // Stamps: THE NIGHT BEFORE (chapter 1), DAY 2.
  const c1Start = blocks[1]?.start ?? 8;
  const tDay2 = w("By day two", 58, 62);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      {showTag ? <Tag kind="FICTIONAL SCENARIO" appearFrame={tagFrame} /> : null}
      <Readout label="THE INTERNET" value={pctText} accent={pct > 0 ? undefined : "#FF5A4A"} />
      <Stamp label="IT STARTED" value="THE NIGHT BEFORE" lt={t - (c1Start - LEAD)} hold={1.5} />
      <Stamp label="OFFLINE" value="DAY 2" lt={t - (tDay2 - LEAD)} hold={1.2} />
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
