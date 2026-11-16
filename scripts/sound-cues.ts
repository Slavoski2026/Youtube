/**
 * Prints an episode's computed music/ambience beds and sound-effect cues (for checking the mix).
 *   npx tsx scripts/sound-cues.ts last-human
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const slug = process.argv[2] ?? "last-human";
const main = async () => {
  if (slug !== "last-human") throw new Error("Only last-human has a sound plan module so far");
  const m = JSON.parse(readFileSync(resolve(import.meta.dirname, "..", "public", "voiceover", `${slug}.json`), "utf8"));
  const ep = await import("../src/episodes/last-human/LastHumanEpisode");
  const { soundFor } = await import("../src/episodes/last-human/sound");
  const { blocks, shots } = ep.schedule(m.words);
  const s = soundFor(m.words, blocks, shots);
  for (const b of s.beds) console.log("bed", b.src.padEnd(26), b.from.toFixed(1).padStart(6), "→", b.to.toFixed(1).padStart(6), b.gain);
  for (const x of s.sfx) console.log("sfx", x.src.padEnd(26), x.at.toFixed(2).padStart(7));
};
main();
