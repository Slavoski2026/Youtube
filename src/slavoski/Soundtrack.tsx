import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import React from "react";
import { Sequence, staticFile, useVideoConfig } from "remotion";

/** Music level in narration gaps vs under the voice. */
export const MUSIC_LIFT = 0.32;
export const MUSIC_UNDER = 0.11;

/** Ducking: returns the music volume at time t (s), lifting in gaps longer than ~0.6 s. */
export const duck = (words: Caption[], t: number, under = MUSIC_UNDER, lift = MUSIC_LIFT): number => {
  const ms = t * 1000;
  let nearest = Infinity;
  for (const w of words) {
    if (ms >= w.startMs && ms <= w.endMs) return under;
    nearest = Math.min(nearest, Math.abs(ms - w.startMs), Math.abs(ms - w.endMs));
  }
  const k = Math.min(1, Math.max(0, (nearest - 250) / 450));
  return under + (lift - under) * k;
};

export type Sfx = { src: string; at: number; volume?: number };

export const Soundtrack: React.FC<{
  voice: string | null;
  words: Caption[];
  music?: string | null;
  sfx?: Sfx[];
  /** Narration gain (1 = as recorded). */
  voiceVolume?: number;
}> = ({ voice, words, music, sfx = [], voiceVolume = 1 }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {voice ? <Audio src={staticFile(voice)} volume={voiceVolume} /> : null}
      {music ? <Audio src={staticFile(music)} volume={(f) => duck(words, f / fps)} /> : null}
      {sfx.map((s, i) => (
        <Sequence key={i} from={Math.round(s.at * fps)} layout="none">
          <Audio src={staticFile(s.src)} volume={s.volume ?? 0.6} />
        </Sequence>
      ))}
    </>
  );
};
