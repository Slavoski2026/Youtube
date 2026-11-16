/**
 * Joins voiceover parts (generated and transcribed separately) into one take, without regenerating:
 *
 *   npx tsx scripts/join-voiceover.ts --name <slug> \
 *       --parts "a.mp3:a.words.json,b.mp3:b.words.json" [--gap 1.4] \
 *       [--breathe "The streets are empty:2.0,Fire:0.8"]
 *
 * --gap      silence (s) added between consecutive parts (on top of their own lead/tail silence).
 * --breathe  extra silence (s) inserted before the first word of a phrase, in the middle of the pause
 *            that precedes it. Phrases are matched in order through the joined word list.
 *
 * Writes public/voiceover/<slug>.mp3 and public/voiceover/<slug>.json (a VoiceoverManifest whose word
 * times include every inserted silence). Uses ffmpeg for decode/encode; no credits are spent.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { Caption } from "@remotion/captions";
import type { VoiceoverManifest } from "../src/lib/voiceover";
import { extractWords, scribeToCaptions } from "./scribe";

const RATE = 44100;
const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const name = flag("name");
const partsArg = flag("parts");
if (!name || !partsArg) throw new Error("--name and --parts are required");
const gap = Number(flag("gap") ?? 1.2);
const breathe = (flag("breathe") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => {
    const i = s.lastIndexOf(":");
    return { phrase: s.slice(0, i), sec: Number(s.slice(i + 1)) };
  });

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, "");

/** Decodes an audio file to mono float32 PCM at RATE. */
const decode = (file: string): Float32Array => {
  const buf = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", String(RATE), "-f", "f32le", "-"], {
    maxBuffer: 1 << 30,
  });
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
};

type Part = { pcm: Float32Array; words: Caption[] };
const parts: Part[] = partsArg.split(",").map((spec) => {
  const [mp3, words] = spec.split(":");
  return { pcm: decode(mp3), words: scribeToCaptions(extractWords(JSON.parse(readFileSync(words, "utf8")))) };
});

/**
 * --script <file>: the approved script text. Each transcribed word takes the script's spelling and
 * punctuation (Scribe writes US spellings and splits "first-aid"), aligned by an LCS over normalised tokens.
 */
const scriptFile = flag("script");
if (scriptFile) {
  const script = readFileSync(scriptFile, "utf8").split(/\s+/).filter(Boolean);
  const flat = parts.flatMap((p, pi) => p.words.map((w, wi) => ({ pi, wi })));
  const A = script.map(norm);
  const B = flat.map(({ pi, wi }) => norm(parts[pi].words[wi].text));
  const n = A.length;
  const m = B.length;
  const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  // Walk the LCS; collect unmatched runs and map them.
  const setText = (j: number, text: string) => {
    const { pi, wi } = flat[j];
    parts[pi].words[wi] = { ...parts[pi].words[wi], text };
  };
  const drop = new Set<number>();
  let i = 0;
  let j = 0;
  const flush = (i0: number, i1: number, j0: number, j1: number) => {
    const sa = i1 - i0;
    const sb = j1 - j0;
    if (sa === 0 || sb === 0) return;
    if (sa === sb) for (let k = 0; k < sa; k++) setText(j0 + k, script[i0 + k]);
    else if (sa === 1) {
      // Several transcribed words for one script word ("first aid" → "first-aid"): merge into the first.
      const { pi, wi } = flat[j0];
      const last = flat[j1 - 1];
      parts[pi].words[wi] = { ...parts[pi].words[wi], text: script[i0], endMs: parts[last.pi].words[last.wi].endMs };
      for (let k = j0 + 1; k < j1; k++) drop.add(k);
    } else console.warn(`Unaligned: script "${script.slice(i0, i1).join(" ")}" vs "${B.slice(j0, j1).join(" ")}"`);
  };
  let ri = 0;
  let rj = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      flush(ri, i, rj, j);
      setText(j, script[i]);
      i++;
      j++;
      ri = i;
      rj = j;
    } else if (L[i + 1][j] >= L[i][j + 1]) i++;
    else j++;
  }
  flush(ri, n, rj, m);
  for (const p of parts.keys()) parts[p].words = parts[p].words.filter((_, wi) => !drop.has(flat.findIndex((f) => f.pi === p && f.wi === wi)));
}

// Insertion points (part index, sample, seconds) for every breathe phrase, found in order.
type Insert = { part: number; at: number; sec: number; phrase: string };
const inserts: Insert[] = [];
{
  const flat = parts.flatMap((p, pi) => p.words.map((w, wi) => ({ pi, wi, n: norm(w.text) })));
  let cursor = 0;
  for (const b of breathe) {
    const toks = b.phrase.split(/\s+/).map(norm).filter(Boolean);
    let found = -1;
    for (let i = cursor; i < flat.length && found < 0; i++) if (toks.every((t, k) => flat[i + k]?.n === t)) found = i;
    if (found < 0) throw new Error(`Phrase not found (in order): "${b.phrase}"`);
    cursor = found + 1;
    const { pi, wi } = flat[found];
    const words = parts[pi].words;
    const start = words[wi].startMs / 1000;
    const prevEnd = wi > 0 ? words[wi - 1].endMs / 1000 : Math.max(0, start - 0.1);
    inserts.push({ part: pi, at: Math.round(((prevEnd + start) / 2) * RATE), sec: b.sec, phrase: b.phrase });
  }
}

// Assemble: part audio split at insertion points, silences between, short fades at every seam.
const chunks: Float32Array[] = [];
const words: Caption[] = [];
let offset = 0; // samples written so far
const FADE = Math.round(0.012 * RATE);
const pushAudio = (a: Float32Array) => {
  const c = Float32Array.from(a);
  for (let i = 0; i < Math.min(FADE, c.length); i++) {
    c[i] *= i / FADE;
    c[c.length - 1 - i] *= i / FADE;
  }
  chunks.push(c);
  offset += c.length;
};
const pushSilence = (sec: number) => {
  const n = Math.round(sec * RATE);
  chunks.push(new Float32Array(n));
  offset += n;
};

parts.forEach((p, pi) => {
  if (pi > 0) pushSilence(gap);
  const cuts = inserts.filter((x) => x.part === pi).sort((a, b) => a.at - b.at);
  let from = 0;
  // Map a time in this part to output seconds: part start + inserted silence before it.
  const partStart = offset;
  const shiftBefore = (sample: number) => cuts.filter((c) => c.at <= sample).reduce((s, c) => s + Math.round(c.sec * RATE), 0);
  for (const c of cuts) {
    pushAudio(p.pcm.subarray(from, c.at));
    pushSilence(c.sec);
    from = c.at;
  }
  pushAudio(p.pcm.subarray(from));
  for (const w of p.words) {
    const s = Math.round((w.startMs / 1000) * RATE);
    const e = Math.round((w.endMs / 1000) * RATE);
    const toMs = (smp: number) => Math.round(((partStart + smp + shiftBefore(s)) / RATE) * 1000);
    const startMs = toMs(s);
    const endMs = toMs(e);
    words.push({ ...w, text: (words.length === 0 ? "" : " ") + w.text.trim(), startMs, endMs, timestampMs: Math.round((startMs + endMs) / 2) });
  }
});

const total = new Float32Array(offset);
let k = 0;
for (const c of chunks) {
  total.set(c, k);
  k += c.length;
}

const tmp = mkdtempSync(join(tmpdir(), "join-vo-"));
const raw = join(tmp, "joined.f32");
writeFileSync(raw, Buffer.from(total.buffer));
const PUBLIC = resolve(import.meta.dirname, "..", "public");
const mp3 = join(PUBLIC, "voiceover", `${name}.mp3`);
execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "f32le", "-ar", String(RATE), "-ac", "1", "-i", raw, "-c:a", "libmp3lame", "-b:a", "192k", mp3], {
  stdio: "inherit",
});
rmSync(tmp, { recursive: true, force: true });

const durationInSeconds = Number(
  execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3], { encoding: "utf8" }),
);
const manifest: VoiceoverManifest = { slug: name, audio: `voiceover/${name}.mp3`, durationInSeconds, words };
writeFileSync(join(PUBLIC, "voiceover", `${name}.json`), JSON.stringify(manifest, null, 2));
const added = inserts.reduce((s, i) => s + i.sec, 0) + gap * (parts.length - 1);
console.log(
  `Saved public/voiceover/${name}.mp3 and .json: ${parts.length} parts, ${inserts.length} pauses widened, ` +
    `+${added.toFixed(1)} s silence, ${words.length} words, ${durationInSeconds.toFixed(2)} s`,
);
