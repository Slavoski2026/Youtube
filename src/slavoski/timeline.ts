import type { Caption } from "@remotion/captions";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverManifest } from "../lib/voiceover";

export type Chapter = { n: number; title: string };

/** Narration block: one per chapter (or cold open / outro with n = 0). */
export type NarrationBlock = { id: string; chapter: Chapter | null; text: string };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, "");

/** Current time in seconds. */
export const useTime = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/**
 * Estimated word timing from the script (used until the real voiceover is imported):
 * ~2.75 words/s, longer words take longer, pauses after sentences and between blocks.
 */
export const estimateManifest = (slug: string, blocks: NarrationBlock[], opts: { start?: number; wps?: number } = {}): VoiceoverManifest => {
  const wps = opts.wps ?? 2.75;
  let t = opts.start ?? 0.4;
  const words: Caption[] = [];
  blocks.forEach((b, bi) => {
    const tokens = b.text.split(/\s+/).filter(Boolean);
    tokens.forEach((tok) => {
      const syll = Math.max(1, Math.round(norm(tok).length / 3.2));
      const dur = (0.55 + syll * 0.45) / wps;
      words.push({
        text: (words.length === 0 ? "" : " ") + tok,
        startMs: Math.round(t * 1000),
        endMs: Math.round((t + dur * 0.92) * 1000),
        timestampMs: Math.round((t + dur / 2) * 1000),
        confidence: null,
      });
      t += dur;
      if (/[.?!]$/.test(tok)) t += 0.32;
      else if (/[,:;]$/.test(tok)) t += 0.14;
    });
    if (bi < blocks.length - 1) t += 0.25;
  });
  return { slug, audio: null, durationInSeconds: t + 0.3, words, estimated: true };
};

/**
 * Finds where each narration block starts in the (real or estimated) word list by matching
 * its first words in order. Robust to small transcription differences.
 */
export const blockTimes = (words: Caption[], blocks: NarrationBlock[]) => {
  const W = words.map((w) => norm(w.text));
  const out: { id: string; chapter: Chapter | null; start: number; end: number; firstWord: number; lastWord: number }[] = [];
  let cursor = 0;
  blocks.forEach((b) => {
    const toks = b.text.split(/\s+/).map(norm).filter(Boolean);
    const probe = toks.slice(0, 3);
    let found = -1;
    for (let i = cursor; i < W.length && found < 0; i++) {
      let hits = 0;
      probe.forEach((p, k) => {
        if (W[i + k] === p) hits++;
      });
      if (hits >= Math.min(2, probe.length)) found = i;
    }
    if (found < 0) found = Math.min(cursor, W.length - 1);
    const last = Math.min(W.length - 1, found + toks.length - 1);
    out.push({
      id: b.id,
      chapter: b.chapter,
      start: words[found].startMs / 1000,
      end: words[last].endMs / 1000,
      firstWord: found,
      lastWord: last,
    });
    cursor = last + 1;
  });
  return out;
};

/** Time (s) a word/phrase is spoken, searching from `fromSec`. Returns `fallback` if not found. */
export const wordAt = (words: Caption[], phrase: string, fromSec = 0, fallback = fromSec): number => {
  const toks = phrase.split(/\s+/).map(norm).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    if (words[i].startMs / 1000 < fromSec - 0.01) continue;
    if (toks.every((t, k) => words[i + k] && norm(words[i + k].text) === t)) return words[i].startMs / 1000;
  }
  return fallback;
};

/** Picks the active shot: shots sorted by `at` (seconds). Returns the shot and its local time. */
export const shotAt = <S extends { at: number }>(shots: S[], t: number): { shot: S; index: number; local: number; next: number } => {
  let index = 0;
  for (let i = 0; i < shots.length; i++) if (t >= shots[i].at) index = i;
  const shot = shots[index];
  const next = index + 1 < shots.length ? shots[index + 1].at : Infinity;
  return { shot, index, local: t - shot.at, next };
};
