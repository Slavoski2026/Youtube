/**
 * Saves ElevenLabs MCP output into public/.
 *
 *   npm run import-voiceover -- --name <slug> --audio "<content_url>" --words "<words_download_url>"
 *     -> public/voiceover/<slug>.mp3 + public/voiceover/<slug>.json (VoiceoverManifest)
 *
 *   npm run import-audio -- --audio "<content_url>" --out sfx/<slug>.mp3
 *     -> public/sfx/<slug>.mp3 (or music/...)
 *
 * --audio and --words accept URLs or local file paths (e.g. files uploaded into the session).
 *
 * The words file is an ElevenLabs Scribe word list: `{ text, type, start, end }` in seconds,
 * as a bare list, `{ words }` or `{ transcripts: [{ words }] }`. Spacing and audio events are skipped.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { Caption } from "@remotion/captions";
import { parseMedia } from "@remotion/media-parser";
import { nodeReader } from "@remotion/media-parser/node";
import type { VoiceoverManifest } from "../src/lib/voiceover";

type ScribeWord = { text: string; type?: string; start: number; end: number };

const args = process.argv.slice(2);
const mode = args[0];
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const PUBLIC = resolve(import.meta.dirname, "..", "public");

const isUrl = (s: string) => /^https?:\/\//.test(s);

/** Downloads a URL, or copies a local file (e.g. an uploaded mp3), to `out`. */
const download = async (src: string, out: string) => {
  mkdirSync(dirname(out), { recursive: true });
  if (!isUrl(src)) {
    copyFileSync(src, out);
    return;
  }
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${src.slice(0, 80)}…`);
  writeFileSync(out, Buffer.from(await res.arrayBuffer()));
};

const readJson = async (src: string): Promise<unknown> => {
  if (!isUrl(src)) return JSON.parse(readFileSync(src, "utf8"));
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Words download failed (${res.status})`);
  return res.json();
};

const extractWords = (json: unknown): ScribeWord[] => {
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

const main = async () => {
  const audio = flag("audio");
  if (!audio) throw new Error("--audio is required");

  if (mode === "audio") {
    const out = flag("out");
    if (!out) throw new Error("--out is required (e.g. sfx/boom.mp3)");
    await download(audio, join(PUBLIC, out));
    console.log(`Saved public/${out}`);
    return;
  }

  if (mode !== "voiceover") throw new Error(`Unknown mode "${mode}"`);
  const name = flag("name");
  const wordsUrl = flag("words");
  if (!name || !wordsUrl) throw new Error("--name and --words are required");

  const mp3 = join(PUBLIC, "voiceover", `${name}.mp3`);
  await download(audio, mp3);
  const words = scribeToCaptions(extractWords(await readJson(wordsUrl)));

  const { durationInSeconds } = await parseMedia({
    src: mp3,
    reader: nodeReader,
    fields: { durationInSeconds: true },
  });

  const manifest: VoiceoverManifest = {
    slug: name,
    audio: `voiceover/${name}.mp3`,
    durationInSeconds: durationInSeconds ?? (words.at(-1)?.endMs ?? 0) / 1000,
    words,
  };
  writeFileSync(join(PUBLIC, "voiceover", `${name}.json`), JSON.stringify(manifest, null, 2));
  console.log(`Saved public/voiceover/${name}.mp3 and .json (${words.length} words, ${manifest.durationInSeconds.toFixed(2)} s)`);
};

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
