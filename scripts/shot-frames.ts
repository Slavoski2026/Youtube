/**
 * Prints each shot's start/end and a mid frame, for rendering review stills.
 *   npx tsx scripts/shot-frames.ts black-hole            (table)
 *   npx tsx scripts/shot-frames.ts black-hole --frames   (comma-separated mid frames)
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { VoiceoverManifest } from "../src/lib/voiceover";

const FPS = 30;
const slug = process.argv[2] ?? "black-hole";
const main = async () => {
  const ep = await import("../src/episodes/black-hole/BlackHoleEpisode");
  const file = resolve(import.meta.dirname, "..", "public", "voiceover", `${slug}.json`);
  const m: VoiceoverManifest = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : ep.estimatedBlackHole();
  const { shots } = ep.schedule(m.words);
  const rows = shots.map((s, i) => {
    const end = i + 1 < shots.length ? shots[i + 1].at : m.durationInSeconds + 2.5;
    return { name: s.name, start: s.at, end, len: end - s.at, mid: Math.round(((s.at + end) / 2) * FPS) };
  });
  if (process.argv.includes("--frames")) {
    console.log(rows.map((r) => r.mid).join(","));
    return;
  }
  console.log(`${m.estimated ? "ESTIMATED" : "REAL"} timing, ${m.durationInSeconds.toFixed(1)} s narration`);
  for (const r of rows) console.log(`${r.name.padEnd(9)} ${r.start.toFixed(2).padStart(6)}–${r.end.toFixed(2).padStart(6)}  ${r.len.toFixed(2)} s  mid=${r.mid}${r.len > 4.2 ? "  ⚠ long" : ""}`);
};
main();
