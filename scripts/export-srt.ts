/**
 * Writes an episode's subtitles as .srt, from the same cues the burned-in Subtitles component shows.
 *   npx tsx scripts/export-srt.ts last-human [out.srt]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { subtitleCues, toSrt } from "../src/slavoski/Subtitles";

const slug = process.argv[2] ?? "last-human";
const out = resolve(process.argv[3] ?? `out/${slug}.srt`);
const m = JSON.parse(readFileSync(resolve(import.meta.dirname, "..", "public", "voiceover", `${slug}.json`), "utf8"));
const cues = subtitleCues(m.words);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, toSrt(cues));
console.log(`Saved ${out}: ${cues.length} cues, ${m.words.length} words`);
