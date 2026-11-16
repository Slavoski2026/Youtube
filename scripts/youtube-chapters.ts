/**
 * Prints YouTube chapter timestamps (first at 0:00) from an episode's narration blocks.
 *   npx tsx scripts/youtube-chapters.ts last-human [out.txt]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const slug = process.argv[2] ?? "last-human";
const main = async () => {
  const m = JSON.parse(readFileSync(resolve(import.meta.dirname, "..", "public", "voiceover", `${slug}.json`), "utf8"));
  const ep = await import("../src/episodes/last-human/LastHumanEpisode");
  const { blocks } = ep.schedule(m.words);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const title = (t: string) => t.toLowerCase().replace(/(^|\s)\S/g, (x) => x.toUpperCase()).replace(/\b24\b/, "24");
  const lines = blocks.map((b, i) => `${fmt(i === 0 ? 0 : Math.max(0, b.start - ep.LEAD))} ${b.chapter ? `${String(b.chapter.n).padStart(2, "0")} ${title(b.chapter.title)}` : "Waking Up"}`);
  const text = lines.join("\n");
  console.log(text);
  if (process.argv[3]) writeFileSync(resolve(process.argv[3]), `${text}\n`);
};
main();
