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

/** A sound effect at `at` seconds. `duration` (s) cuts it short with a `fade` (s, default 0.3) fade-out. */
export type Sfx = { src: string; at: number; volume?: number; duration?: number; fade?: number };

/**
 * A music or ambience bed over [from, to) seconds with fades. `loop` repeats it: either a plain loop
 * (seamless files such as SFX v2 loops) or, with `length` and `xfade`, overlapping copies that
 * crossfade (music that isn't loop-perfect). `duck` (0..1) lowers it under the voice to that share.
 */
export type MusicCue = {
  src: string;
  from: number;
  to: number;
  gain?: number;
  fadeIn?: number;
  fadeOut?: number;
  loop?: boolean;
  /** File length (s), needed for crossfaded loops. */
  length?: number;
  /** Crossfade (s) between loop copies; requires `length`. */
  xfade?: number;
  /** Level under the voice relative to the gaps (e.g. 0.45); omit for no ducking. */
  duck?: number;
  /** Start offset into the file (s). */
  offset?: number;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const Bed: React.FC<{ cue: MusicCue; words: Caption[] }> = ({ cue, words }) => {
  const { fps } = useVideoConfig();
  const gain = cue.gain ?? 0.3;
  const fadeIn = cue.fadeIn ?? 1.5;
  const fadeOut = cue.fadeOut ?? 1.5;
  const env = (t: number) => {
    const k = clamp01((t - cue.from) / Math.max(0.01, fadeIn)) * clamp01((cue.to - t) / Math.max(0.01, fadeOut));
    const d = cue.duck !== undefined ? duck(words, t, cue.duck, 1) : 1;
    return gain * k * d;
  };
  const total = cue.to - cue.from;
  if (cue.loop && cue.length && cue.xfade) {
    const step = cue.length - cue.xfade;
    const copies = Math.ceil(total / step) + 1;
    return (
      <>
        {Array.from({ length: copies }, (_, i) => {
          const start = cue.from + i * step;
          if (start >= cue.to) return null;
          const dur = Math.min(cue.length!, cue.to - start);
          const x = cue.xfade!;
          return (
            <Sequence key={i} from={Math.round(start * fps)} durationInFrames={Math.max(1, Math.round(dur * fps))} layout="none">
              <Audio
                src={staticFile(cue.src)}
                volume={(f) => {
                  const lt = f / fps;
                  const xin = i === 0 ? 1 : clamp01(lt / x);
                  const xout = clamp01((cue.length! - lt) / x);
                  return env(start + lt) * Math.sqrt(xin * xout);
                }}
              />
            </Sequence>
          );
        })}
      </>
    );
  }
  return (
    <Sequence from={Math.round(cue.from * fps)} durationInFrames={Math.max(1, Math.round(total * fps))} layout="none">
      <Audio src={staticFile(cue.src)} loop={cue.loop} trimBefore={cue.offset ? Math.round(cue.offset * fps) : undefined} volume={(f) => env(cue.from + f / fps)} />
    </Sequence>
  );
};

export const Soundtrack: React.FC<{
  voice: string | null;
  words: Caption[];
  music?: string | null;
  sfx?: Sfx[];
  /** Music and ambience beds (long-form). */
  beds?: MusicCue[];
  /** Narration gain (1 = as recorded). */
  voiceVolume?: number;
}> = ({ voice, words, music, sfx = [], beds = [], voiceVolume = 1 }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {voice ? <Audio src={staticFile(voice)} volume={voiceVolume} /> : null}
      {beds.map((b, i) => (
        <Bed key={`bed${i}`} cue={b} words={words} />
      ))}
      {music ? <Audio src={staticFile(music)} volume={(f) => duck(words, f / fps)} /> : null}
      {sfx.map((s, i) => {
        const v = s.volume ?? 0.6;
        const frames = s.duration ? Math.round(s.duration * fps) : undefined;
        const fade = Math.max(1, Math.round((s.fade ?? 0.3) * fps));
        return (
          <Sequence key={i} from={Math.round(s.at * fps)} durationInFrames={frames} layout="none">
            <Audio src={staticFile(s.src)} volume={frames ? (f) => v * Math.min(1, Math.max(0, (frames - f) / fade)) : v} />
          </Sequence>
        );
      })}
    </>
  );
};
