/**
 * Pacing check from the schedule (no render needed): shots longer than --max under narration, and
 * narration gaps longer than 2 s with no cut inside them.
 *   npx tsx scripts/pacing.ts last-human [--max=6.5]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const slug = process.argv[2] ?? "last-human";
const max = Number(process.argv.find((a) => a.startsWith("--max="))?.slice(6) ?? 6.5);
const main = async () => {
  const m = JSON.parse(readFileSync(resolve(import.meta.dirname, "..", "public", "voiceover", `${slug}.json`), "utf8"));
  const ep = await import("../src/episodes/last-human/LastHumanEpisode");
  const { shots } = ep.schedule(m.words);
  const end = m.durationInSeconds + ep.END_CARD_AFTER;
  let issues = 0;
  shots.forEach((s: { at: number; name: string }, i: number) => {
    const e = i + 1 < shots.length ? shots[i + 1].at : end;
    if (e - s.at > max) {
      issues++;
      console.log(`long shot  ${s.name.padEnd(8)} ${s.at.toFixed(2)}–${e.toFixed(2)} (${(e - s.at).toFixed(2)} s)`);
    }
  });
  const words = m.words as { startMs: number; endMs: number }[];
  for (let i = 1; i < words.length; i++) {
    const a = words[i - 1].endMs / 1000;
    const b = words[i].startMs / 1000;
    if (b - a < 2) continue;
    const cuts = shots.filter((s: { at: number }) => s.at > a && s.at < b).length;
    if (!cuts) {
      issues++;
      console.log(`dead gap   ${a.toFixed(2)}–${b.toFixed(2)} (${(b - a).toFixed(2)} s) with no cut`);
    }
  }
  console.log(`${shots.length} shots, ${issues} issue(s)`);
};
main();
