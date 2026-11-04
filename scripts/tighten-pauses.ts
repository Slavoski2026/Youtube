/**
 * Shortens the pauses in a voiceover take without touching the speech (no regeneration, no credits).
 *
 *   npx tsx scripts/tighten-pauses.ts --in <take.mp3> --out <voiceover.mp3> [--cap 0.22]
 *       [--keep "8.18:0.45,59.72:0.45"] [--noise -40] [--min 0.25]
 *
 * Every silence longer than --min seconds (quieter than --noise dB) is cut down to --cap seconds,
 * keeping half of the kept length on each side of the cut. --keep lists comic beats to leave longer:
 * `<silence start in the take>:<seconds to keep>` (a silence within 0.15 s of that start matches).
 *
 * Writes the shortened mp3 and `<out>.cuts.json`: `[{ at, removed }]` in take-time seconds.
 * Pass that file to `npm run import-voiceover -- ... --cuts <file>` so Scribe word times from the
 * original take are remapped onto the shortened audio.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

export type Cut = { at: number; removed: number };

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const input = flag("in");
const output = flag("out");
if (!input || !output) throw new Error("--in and --out are required");
const cap = Number(flag("cap") ?? 0.22);
const noise = Number(flag("noise") ?? -40);
const min = Number(flag("min") ?? 0.25);
const keep = (flag("keep") ?? "")
  .split(",")
  .filter(Boolean)
  .map((s) => s.split(":").map(Number) as [number, number]);

// silencedetect reports on stderr.
const ffLog = spawnSync(
  "ffmpeg",
  ["-hide_banner", "-i", input, "-af", `silencedetect=noise=${noise}dB:d=${min}`, "-f", "null", "-"],
  { encoding: "utf8" },
).stderr;

const starts = [...ffLog.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
const ends = [...ffLog.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
const duration = Number(
  execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", input], {
    encoding: "utf8",
  }),
);

// Remove the middle of each long silence. Leading/trailing silences (no speech on one side) are left alone.
const removals: { from: number; to: number }[] = [];
starts.forEach((s, i) => {
  const e = ends[i];
  if (e === undefined || s <= 0.01 || e >= duration - 0.01) return;
  const want = keep.find(([at]) => Math.abs(at - s) < 0.15)?.[1] ?? cap;
  const d = e - s;
  if (d <= want) return;
  const mid = (s + e) / 2;
  removals.push({ from: mid - (d - want) / 2, to: mid + (d - want) / 2 });
});

const keepIntervals: [number, number][] = [];
let cursor = 0;
for (const r of removals) {
  keepIntervals.push([cursor, r.from]);
  cursor = r.to;
}
keepIntervals.push([cursor, duration + 1]);

const select = keepIntervals.map(([a, b]) => `between(t,${a.toFixed(4)},${b.toFixed(4)})`).join("+");
execFileSync(
  "ffmpeg",
  ["-y", "-hide_banner", "-loglevel", "error", "-i", input, "-af", `aselect='${select}',asetpts=N/SR/TB`, "-c:a", "libmp3lame", "-q:a", "2", output],
  { stdio: "inherit" },
);

const cuts: Cut[] = removals.map((r) => ({ at: +r.from.toFixed(4), removed: +(r.to - r.from).toFixed(4) }));
writeFileSync(`${output}.cuts.json`, JSON.stringify(cuts, null, 2));
const removed = cuts.reduce((t, c) => t + c.removed, 0);
console.log(
  `${removals.length} pauses shortened, ${removed.toFixed(2)} s removed: ${duration.toFixed(2)} s -> ${(duration - removed).toFixed(2)} s`,
);
