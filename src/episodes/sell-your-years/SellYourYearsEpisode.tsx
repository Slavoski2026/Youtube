/**
 * "What If You Could Sell Years of Your Life?" — SLAVOSKI, ep. 8. ≈ 60 s, "mid" detail.
 * The hook is personal: Slavoski's ATM shows £10.00 in the drizzle, then a LIFEBANK kiosk (our own
 * invented brand) lights up beside it with an offer. A "1 YEAR OF LIFE" price ticks like a market.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest, VoiceoverProps } from "../../lib/voiceover";
import { loadHouseFonts } from "../../slavoski/fonts";
import { clamp01, ease, noise1 } from "../../slavoski/noise";
import { BrandLockup, EndCard, Readout, TitleCard } from "../../slavoski/Overlays";
import { Soundtrack, type Sfx } from "../../slavoski/Soundtrack";
import { estimateManifest, scheduleShots, shotAt, wordAt } from "../../slavoski/timeline";
import { WordCaptions } from "../../slavoski/WordCaptions";
import { BLOCKS, KEYWORDS, SLUG, TITLE } from "./narration";
import { LOSS_RED, OK_GREEN } from "./props";
import { SHOTS } from "./shots";

loadHouseFonts();

export type SellYourYearsProps = VoiceoverProps;
export const estimatedSellYourYears = (): VoiceoverManifest => estimateManifest(SLUG, BLOCKS);

const LEAD = 0.12;
const VOICE_VOLUME = 1.6;

export const schedule = (words: VoiceoverManifest["words"]) => scheduleShots(words, BLOCKS, SHOTS, LEAD);

const ramp = (t: number, a: number, b: number) => ease(clamp01((t - a) / (b - a)));

export const SellYourYearsEpisode: React.FC<SellYourYearsProps> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const m = manifest ?? estimatedSellYourYears();
  const words = m.words;
  const { blocks, shots } = useMemo(() => schedule(words), [words]);
  const { shot, local, next } = shotAt(shots, t);
  const block = blocks[shot.block];
  const at = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;

  const sfx = useMemo<Sfx[]>(() => {
    const start = (name: string) => shots.find((x) => x.name === name)?.at ?? -1;
    const last = blocks[blocks.length - 1];
    const cues: Sfx[] = [
      // the hook: the ATM beep, the kiosk switching on, the amount landing
      { src: "sfx/notify-chime.mp3", at: 0.12, volume: 0.16 },
      { src: "sfx/moon-whoosh.mp3", at: start("cold.2") + 0.1, volume: 0.22 },
      { src: "sfx/notify-chime.mp3", at: start("cold.2") + 0.3, volume: 0.3 },
      { src: "sfx/notify-chime.mp3", at: start("cold.4") + 1.45, volume: 0.36 },
      { src: "sfx/notify-chime.mp3", at: start("c1.0") + 0.25, volume: 0.2 },
      { src: "sfx/moon-whoosh.mp3", at: start("c1.2") - 0.05, volume: 0.25 },
      { src: "sfx/impact-boom.mp3", at: start("c2.2") + 0.28, volume: 0.16, duration: 0.6, fade: 0.2 },
      { src: "sfx/gate-creak.mp3", at: start("c3.2"), volume: 0.22, duration: 1.4, fade: 0.4 },
      { src: "sfx/impact-boom.mp3", at: start("c4.0") + 1.5, volume: 0.24 },
      { src: "sfx/quake-rumble.mp3", at: start("c4.0") + 1.5, volume: 0.22, duration: 2.0, fade: 0.6 },
      { src: "sfx/impact-boom.mp3", at: start("c4.2") + 1.9, volume: 0.2 },
      { src: "sfx/moon-whoosh.mp3", at: start("c6.2") - 0.05, volume: 0.3 },
      { src: "sfx/moon-whoosh.mp3", at: start("c6.3"), volume: 0.14 },
      { src: "sfx/notify-chime.mp3", at: start("end.0") + 1.4, volume: 0.3 },
      { src: "sfx/end-sting.mp3", at: last.end + 0.6, volume: 0.7 },
    ];
    return cues.filter((c) => c.at >= 0);
  }, [shots, blocks]);

  // Title comes in with the second shot (the ATM opens clean) and leaves before the offer close-ups.
  const titleIn = Math.round(Math.max(0, at("cold.1")) * fps);
  const titleOut = Math.round((Math.max(at("cold.3"), 3) - 0.2) * fps);
  const last = blocks[blocks.length - 1];
  const endCardFrame = Math.round((last.end + 0.6) * fps);

  // 1 YEAR OF LIFE: appears when £500,000 lands, ticks like a market; billionaires push it up,
  // desperate sellers drag it down, and it settles back at £100,000 for the final offer.
  const reveal = wordAt(words, "pounds", 7, 7.7) + 0.1;
  const up0 = wordAt(words, "centuries", 20, 24.6);
  const down0 = wordAt(words, "sacrifice", 30, 35.5);
  const back0 = last.start;
  const level =
    100000 + 140000 * ramp(t, up0, up0 + 1.4) - 180000 * ramp(t, down0, down0 + 1.6) - 0 + 140000 * ramp(t, back0, back0 + 1.2) - 0;
  const price = Math.round((level * (1 + 0.012 * noise1("price", t * 1.7))) / 10) * 10;
  const rising = t > up0 && t < up0 + 3;
  const falling = t > down0 && t < down0 + 4;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shot.fn({ lt: local, dur: next - shot.at, t, words, width, height })}
      {block.id === "cold" && frame < titleOut + 10 ? <TitleCard lines={TITLE} startFrame={titleIn} outFrame={titleOut} /> : <BrandLockup chapter={block.chapter} />}
      {t >= reveal ? (
        <Readout label="1 YEAR OF LIFE" value={`£${price.toLocaleString("en-GB")}`} accent={rising ? OK_GREEN : falling ? LOSS_RED : undefined} pulse={t < reveal + 0.5 ? 1 - (t - reveal) / 0.5 : 0} />
      ) : null}
      <WordCaptions words={words} keywords={KEYWORDS} />
      {frame >= endCardFrame - 2 ? <EndCard startFrame={endCardFrame} /> : null}
      <Soundtrack voice={m.audio} words={words} sfx={sfx} voiceVolume={VOICE_VOLUME} />
    </AbsoluteFill>
  );
};
