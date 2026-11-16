/**
 * ElevenLabs Scribe word lists → Remotion captions. Shared by import-audio.ts and join-voiceover.ts.
 * A words file is `{ text, type, start, end }` in seconds, as a bare list, `{ words }` or
 * `{ transcripts: [{ words }] }`. Spacing and audio events are skipped.
 */
import { readFileSync } from "node:fs";
import type { Caption } from "@remotion/captions";

export type ScribeWord = { text: string; type?: string; start: number; end: number };

export const isUrl = (s: string) => /^https?:\/\//.test(s);

export const readJson = async (src: string): Promise<unknown> => {
  if (!isUrl(src)) return JSON.parse(readFileSync(src, "utf8"));
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Words download failed (${res.status})`);
  return res.json();
};

export const extractWords = (json: unknown): ScribeWord[] => {
  if (Array.isArray(json)) return json as ScribeWord[];
  const o = json as { words?: ScribeWord[]; transcripts?: { words: ScribeWord[] }[] };
  if (o.words) return o.words;
  if (o.transcripts?.[0]?.words) return o.transcripts[0].words;
  throw new Error("Unrecognised words file");
};

export const scribeToCaptions = (words: ScribeWord[]): Caption[] =>
  words
    .filter((w) => (w.type ?? "word") === "word" && w.text.trim() !== "")
    .map((w, i) => ({
      text: (i === 0 ? "" : " ") + w.text.trim(),
      startMs: Math.round(w.start * 1000),
      endMs: Math.round(w.end * 1000),
      timestampMs: Math.round(((w.start + w.end) / 2) * 1000),
      confidence: null,
    }));
