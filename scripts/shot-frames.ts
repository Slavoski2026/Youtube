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
const EPISODES: Record<string, () => Promise<{ schedule: (w: VoiceoverManifest["words"]) => { shots: { at: number; name: string }[] }; estimated: () => VoiceoverManifest }>> = {
  "black-hole": async () => {
    const ep = await import("../src/episodes/black-hole/BlackHoleEpisode");
    return { schedule: ep.schedule, estimated: ep.estimatedBlackHole };
  },
  "gta-24h": async () => {
    const ep = await import("../src/episodes/gta-24h/GtaEpisode");
    return { schedule: ep.schedule, estimated: ep.estimatedGta };
  },
  "smart-animals": async () => {
    const ep = await import("../src/episodes/smart-animals/SmartAnimalsEpisode");
    return { schedule: ep.schedule, estimated: ep.estimatedSmartAnimals };
  },
  "ww3-countdown": async () => {
    const ep = await import("../src/episodes/ww3-countdown/Ww3Episode");
    return { schedule: ep.schedule, estimated: ep.estimatedWw3 };
  },
  "satellites-dark": async () => {
    const ep = await import("../src/episodes/satellites-dark/SatellitesDarkEpisode");
    return { schedule: ep.schedule, estimated: ep.estimatedSatellitesDark };
  },
  "no-voices": async () => {
    const ep = await import("../src/episodes/no-voices/NoVoicesEpisode");
    return { schedule: ep.schedule, estimated: ep.estimatedNoVoices };
  },
  "minecraft-mobs": async () => {
    const ep = await import("../src/episodes/minecraft-mobs/MinecraftMobsEpisode");
    return { schedule: ep.schedule, estimated: ep.estimatedMinecraftMobs };
  },
  "no-work-2036": async () => {
    const ep = await import("../src/episodes/no-work-2036/NoWork2036Episode");
    return { schedule: ep.schedule, estimated: ep.estimatedNoWork2036 };
  },
  "no-humans": async () => {
    const ep = await import("../src/episodes/no-humans/NoHumansEpisode");
    return { schedule: ep.schedule, estimated: ep.estimatedNoHumans };
  },
};

const main = async () => {
  const load = EPISODES[slug];
  if (!load) throw new Error(`Unknown episode "${slug}". Known: ${Object.keys(EPISODES).join(", ")}`);
  const ep = await load();
  const file = resolve(import.meta.dirname, "..", "public", "voiceover", `${slug}.json`);
  const m: VoiceoverManifest = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : ep.estimated();
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
