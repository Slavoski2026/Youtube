/**
 * Quality checks for a finished video (ffmpeg/ffprobe):
 *   npx tsx scripts/qc-video.ts out/last-human-final.mp4 [--width=1920 --height=1080 --fps=30 --expect=<seconds>]
 *
 * Reports container/stream facts, black stretches (blackdetect), frozen stretches (freezedetect),
 * integrated loudness (ebur128), silent stretches, decode errors, and saves the first and last frames.
 * Exits non-zero when a hard requirement fails (size, fps, codecs, duration, decode errors).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { basename, dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
if (!file) throw new Error("Usage: qc-video.ts <file.mp4> [--width= --height= --fps= --expect=]");
const opt = (n: string) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const want = { width: Number(opt("width") ?? 1920), height: Number(opt("height") ?? 1080), fps: Number(opt("fps") ?? 30), expect: opt("expect") ? Number(opt("expect")) : null };

const probe = JSON.parse(
  execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration,size,bit_rate:stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels", "-of", "json", file], { encoding: "utf8" }),
);
const v = probe.streams.find((s: { codec_type: string }) => s.codec_type === "video");
const a = probe.streams.find((s: { codec_type: string }) => s.codec_type === "audio");
const dur = Number(probe.format.duration);
const [fn, fd] = String(v?.r_frame_rate ?? "0/1").split("/").map(Number);
const fps = fn / fd;
const fails: string[] = [];
console.log(`file      ${file}  (${(Number(probe.format.size) / 1e6).toFixed(1)} MB, ${(Number(probe.format.bit_rate) / 1e6).toFixed(1)} Mb/s)`);
console.log(`duration  ${dur.toFixed(3)} s  (${Math.floor(dur / 60)}:${String(Math.round(dur % 60)).padStart(2, "0")})`);
console.log(`video     ${v?.codec_name} ${v?.width}x${v?.height} @ ${fps.toFixed(3)} fps, ${v?.nb_frames} frames`);
console.log(`audio     ${a ? `${a.codec_name} ${a.sample_rate} Hz ${a.channels} ch` : "NONE"}`);
if (v?.codec_name !== "h264") fails.push(`video codec ${v?.codec_name} (want h264)`);
if (!a || a.codec_name !== "aac") fails.push(`audio codec ${a?.codec_name ?? "none"} (want aac)`);
if (v?.width !== want.width || v?.height !== want.height) fails.push(`size ${v?.width}x${v?.height} (want ${want.width}x${want.height})`);
if (Math.abs(fps - want.fps) > 0.01) fails.push(`fps ${fps} (want ${want.fps})`);
if (want.expect !== null && Math.abs(dur - want.expect) > 0.15) fails.push(`duration ${dur.toFixed(2)} (want ${want.expect.toFixed(2)})`);

const ff = (filters: string[], extra: string[] = []) => spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, ...filters, ...extra, "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 28 }).stderr;

// Black and frozen stretches (video), silences and loudness (audio) in one decode each.
const vlog = ff(["-vf", "blackdetect=d=0.5:pix_th=0.06,freezedetect=n=0.002:d=2.5", "-an"]);
const blacks = [...vlog.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
const freezeStarts = [...vlog.matchAll(/freeze_start: ([\d.]+)/g)].map((m) => Number(m[1]));
const freezeEnds = [...vlog.matchAll(/freeze_end: ([\d.]+)/g)].map((m) => Number(m[1]));
console.log(`black     ${blacks.length ? blacks.map(([s, e]) => `${s.toFixed(1)}–${e.toFixed(1)}`).join(", ") : "none"}`);
console.log(`frozen≥2.5s ${freezeStarts.length ? freezeStarts.map((s, i) => `${s.toFixed(1)}–${(freezeEnds[i] ?? dur).toFixed(1)}`).join(", ") : "none"}`);
const alog = ff(["-af", "ebur128=peak=true,silencedetect=n=-50dB:d=2", "-vn"]);
const integrated = alog.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop();
const peak = alog.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.pop();
const silences = [...alog.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
console.log(`loudness  ${integrated ?? "?"}  true ${peak ?? "?"}`);
console.log(`silence≥2s ${silences.length ? silences.map((s) => s.toFixed(1)).join(", ") : "none"}`);

// Full decode for errors.
const errs = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 28 }).stderr.trim();
console.log(`decode    ${errs ? `ERRORS:\n${errs.slice(0, 800)}` : "clean"}`);
if (errs) fails.push("decode errors");

// First and last frames.
const base = resolve(dirname(file), basename(file, ".mp4"));
execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", "0", "-i", file, "-frames:v", "1", `${base}-first.png`]);
execFileSync("ffmpeg", ["-v", "error", "-y", "-sseof", "-0.1", "-i", file, "-frames:v", "1", `${base}-last.png`]);
console.log(`frames    ${base}-first.png, ${base}-last.png`);

if (fails.length) {
  console.log(`\nFAIL: ${fails.join("; ")}`);
  process.exit(1);
}
console.log("\nPASS");
