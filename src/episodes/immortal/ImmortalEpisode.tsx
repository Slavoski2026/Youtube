/**
 * "What If Humans Became Immortal?" — SLAVOSKI, ep. 8. ~67 s (the user's script as written), "mid" detail.
 * Hook: Slavoski falls off a ladder and sits right back up; a heart monitor's flatline comes back.
 * Non-graphic throughout: the collapse is dust, never a hit; trapped Slavoski is unhurt.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { loadHouseFonts } from "../../slavoski/fonts";
import { clamp01 } from "../../slavoski/noise";
import { BrandLockup, EndCard, Readout, Tag, TitleCard } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import { Soundtrack, type Sfx } from "../../slavoski/Soundtrack";
import { estimateManifest, scheduleShots, shotAt, wordAt } from "../../slavoski/timeline";
import { WordCaptions } from "../../slavoski/WordCaptions";
import { BLOCKS, KEYWORDS, SLUG, TAGS, TITLE } from "./narration";
import { SHOTS } from "./shots";

loadHouseFonts();

export type ImmortalProps = VoiceoverProps;
export const estimatedImmortal = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n: number) => String(n).split("").map((d) => SUP[Number(d)]).join("");
const big = (x: number) => (x < 1e15 ? Math.round(x).toLocaleString("en-US") : `10${sup(Math.round(Math.log10(x)))}`);
/** Log-scale race from a to b as k goes 0 → 1. */
const logRace = (a: number, b: number, k: number) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * clamp01(k));

const span = (sec: number) => {
  const s = Math.max(0, sec);
  const pl = (n: number, u: string) => `${Math.floor(n).toLocaleString("en-US")} ${u}${Math.floor(n) === 1 ? "" : "S"}`;
  if (s < 60) return pl(s, "SECOND");
  if (s < 3600) return pl(s / 60, "MINUTE");
  if (s < 86400) return pl(s / 3600, "HOUR");
  if (s < 86400 * 365) return pl(s / 86400, "DAY");
  return pl(s / (86400 * 365), "YEAR");
};

export const ImmortalEpisode: React.FC<ImmortalProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedImmortal();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;

  const sfx = useMemo<Sfx[]>(() => {
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const last = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      // the hook: the thud on the lawn, a whoosh with the title, a soft chime as the pulse comes back
      { src: "sfx/impact-boom.mp3", at: start("cold.0") + 0.95, volume: 0.22, duration: 0.9, fade: 0.4 },
      { src: "sfx/moon-whoosh.mp3", at: start("cold.1") - 0.05, volume: 0.28 },
      { src: "sfx/notify-chime.mp3", at: start("cold.2") + 0.62, volume: 0.35 },
      // the capitol gives way
      { src: "sfx/quake-rumble.mp3", at: start("c3.4") + 0.9, volume: 0.3, duration: 2.0, fade: 0.6 },
      // the quake, the tower, the collapse
      { src: "sfx/quake-rumble.mp3", at: start("c4.0"), volume: 0.42, duration: 3.6, fade: 0.8 },
      { src: "sfx/impact-boom.mp3", at: start("c4.0") + 0.95, volume: 0.2 },
      { src: "sfx/quake-rumble.mp3", at: start("c4.2"), volume: 0.45, duration: 2.0, fade: 0.8 },
      { src: "sfx/impact-boom.mp3", at: start("c4.2") + 0.4, volume: 0.42 },
      // a thousand years rush past; the sun swells; the last star goes out
      { src: "sfx/moon-whoosh.mp3", at: start("c4.7") - 0.05, volume: 0.3 },
      { src: "sfx/moon-whoosh.mp3", at: start("c5.0"), volume: 0.22 },
      { src: "sfx/quake-rumble.mp3", at: start("c5.1") + 0.2, volume: 0.22, duration: 2.2, fade: 0.8 },
      { src: "sfx/power-down.mp3", at: start("c6.2") + 0.5, volume: 0.28, duration: 1.8, fade: 0.6 },
      { src: "sfx/notify-chime.mp3", at: start("c7.1") + 0.05, volume: 0.25 },
      { src: "sfx/power-down.mp3", at: start("c7.1") + 1.0, volume: 0.16, duration: 1.0, fade: 0.4 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks]);

  // Title appears with the sit-up (the fall opens clean) and leaves just before chapter 1.
  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round(((blocks[1]?.start ?? 4) - LEAD - 0.3) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);
  const blockStartFrame = Math.round((block.start - LEAD) * fps);
  const tag = TAGS[block.id];

  // ---- the readout: WORLD POPULATION → TIME TRAPPED → YEARS FROM NOW → TIME LEFT
  const B = (id: string) => blocks.find((b) => b.id === id)!;
  const tImm = wordAt(words, "immortal", 0, 3.8);
  const c3 = B("c3");
  const c4 = B("c4");
  const c5 = B("c5");
  const c6 = B("c6");
  const c7 = B("c7");
  const tTrapped = wordAt(words, "collapsed building", c4.start, c4.start + 4.6) + 0.9;
  const tRemain = wordAt(words, "You could remain", c4.start, c4.start + 9.8);
  const tSun = wordAt(words, "the sun", c5.start, c5.start + 3.9);
  let label = "WORLD POPULATION";
  let value = "";
  let accent: string | undefined;
  if (t < c3.start - LEAD) {
    value = big(8e9 + Math.max(0, t - tImm) * 4.3);
  } else if (t < tTrapped) {
    value = big(logRace(8e9, 1e12, (t - c3.start) / (c3.end - c3.start + 0.4)));
    accent = t > c3.end ? "#FF5A4A" : undefined;
  } else if (t < c5.start - LEAD) {
    label = "TIME TRAPPED";
    const s = t < tRemain ? t - tTrapped : logRace(Math.max(1, tRemain - tTrapped), 1000 * 365 * 86400, (t - tRemain) / (c4.end - tRemain));
    value = span(s);
  } else if (t < c6.start - LEAD) {
    label = "YEARS FROM NOW";
    value = big(logRace(1000, 5e9, (t - c5.start) / Math.max(0.5, tSun - c5.start)));
  } else if (t < c7.start - LEAD) {
    label = "YEARS FROM NOW";
    value = big(logRace(5e9, 1e100, (t - c6.start) / (c6.end - c6.start)));
  } else {
    label = "TIME LEFT";
    value = "∞";
    accent = P.cream;
  }

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
