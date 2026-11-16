/**
 * Renders a long composition in resumable chunks and joins them seamlessly (Remotion's combineChunks).
 * Long-form episodes take hours; a chunk that finished is never rendered again if the run is restarted.
 *
 *   npx remotion bundle src/index.ts --out-dir=build
 *   npx tsx scripts/render-chunks.ts <CompositionId> <out.mp4> [--chunk=1500] [--scale=1] [--props='{"hq":true}']
 *       [--crf=15] [--jpeg-quality=95] [--concurrency=4] [--dir=out/chunks/<name>]
 *
 * Each chunk renders H.264 video with its audio separated to AAC (trimmed for seamless joins); then
 * combineChunks concatenates the video streams and the audio and muxes the final MP4.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { combineChunks, openBrowser, renderMedia, selectComposition } from "@remotion/renderer";

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));
const opt = (name: string, fallback?: string) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : fallback;
};
const [id, outArg] = positional;
if (!id || !outArg) throw new Error("Usage: render-chunks.ts <CompositionId> <out.mp4> [options]");
const out = resolve(outArg);
const chunk = Number(opt("chunk", "1500"));
const scale = Number(opt("scale", "1"));
const crf = Number(opt("crf", "18"));
const jpegQuality = Number(opt("jpeg-quality", "90"));
const concurrency = Number(opt("concurrency", "4"));
const inputProps = JSON.parse(opt("props", "{}")!);
const dir = resolve(opt("dir", `out/chunks/${basename(out, ".mp4")}`)!);
const serveUrl = resolve(import.meta.dirname, "..", "build");
/** Integrated loudness target (LUFS) for a two-pass ffmpeg loudnorm of the final audio; omit to skip. */
const loudnorm = opt("loudnorm");
const chromiumOptions = { gl: "swangle" as const };

const main = async () => {
  mkdirSync(dir, { recursive: true });
  const browser = await openBrowser("chrome", { chromiumOptions });
  const composition = await selectComposition({ serveUrl, id, inputProps, puppeteerInstance: browser, chromiumOptions });
  // --max-frames limits the render (pipeline tests); combineChunks is told the same total.
  const total = Math.min(composition.durationInFrames, Number(opt("max-frames", String(composition.durationInFrames))));
  const n = Math.ceil(total / chunk);
  const videoFiles: string[] = [];
  const audioFiles: string[] = [];
  const t0 = Date.now();
  console.log(`${id}: ${total} frames (${(total / composition.fps).toFixed(1)} s), ${n} chunks of ${chunk}, scale ${scale}, props ${JSON.stringify(inputProps)}`);
  for (let i = 0; i < n; i++) {
    const a = i * chunk;
    const b = Math.min(total - 1, a + chunk - 1);
    // Chunks are MPEG-TS H.264 so combineChunks can join them losslessly with ffmpeg's concat protocol.
    const video = resolve(dir, `video-${String(i).padStart(3, "0")}.ts`);
    const audio = resolve(dir, `audio-${String(i).padStart(3, "0")}.aac`);
    const done = resolve(dir, `done-${String(i).padStart(3, "0")}`);
    videoFiles.push(video);
    audioFiles.push(audio);
    if (existsSync(done) && existsSync(video) && existsSync(audio)) {
      console.log(`chunk ${i + 1}/${n} [${a}-${b}] already rendered`);
      continue;
    }
    const c0 = Date.now();
    let last = -1;
    await renderMedia({
      serveUrl,
      composition,
      inputProps,
      codec: "h264-ts",
      outputLocation: video,
      separateAudioTo: audio,
      forSeamlessAacConcatenation: true,
      frameRange: [a, b],
      compositionStart: a,
      scale,
      crf,
      jpegQuality,
      concurrency,
      audioBitrate: "320k",
      puppeteerInstance: browser,
      chromiumOptions,
      overwrite: true,
      onProgress: ({ progress }) => {
        const p = Math.floor(progress * 10);
        if (p !== last) {
          last = p;
          process.stdout.write(`  chunk ${i + 1}/${n}: ${p * 10}%\n`);
        }
      },
    });
    writeFileSync(done, new Date().toISOString());
    const secs = (Date.now() - c0) / 1000;
    console.log(`chunk ${i + 1}/${n} [${a}-${b}] done in ${secs.toFixed(0)} s (${(secs / (b - a + 1)).toFixed(2)} s/frame)`);
  }
  await browser.close({ silent: true });
  console.log("combining…");
  await combineChunks({
    outputLocation: out,
    videoFiles,
    audioFiles,
    codec: "h264",
    fps: composition.fps,
    framesPerChunk: chunk,
    preferLossless: false,
    compositionDurationInFrames: total,
    audioBitrate: "320k",
    audioCodec: "aac",
  });
  if (loudnorm) {
    // Two-pass loudnorm on the audio only; the video stream is copied untouched.
    const target = `I=${loudnorm}:TP=-1.0:LRA=11`;
    const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", out, "-af", `loudnorm=${target}:print_format=json`, "-vn", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 26 });
    const m = String(r.stderr).match(/\{[\s\S]*\}/);
    if (!m) throw new Error("loudnorm measurement failed");
    const res = JSON.parse(m[0]);
    const tmp = out.replace(/\.mp4$/, ".norm.mp4");
    const second = `loudnorm=${target}:measured_I=${res.input_i}:measured_TP=${res.input_tp}:measured_LRA=${res.input_lra}:measured_thresh=${res.input_thresh}:offset=${res.target_offset}:linear=true`;
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", out, "-map", "0:v", "-map", "0:a", "-c:v", "copy", "-af", second, "-ar", "48000", "-c:a", "aac", "-b:a", "320k", "-movflags", "+faststart", tmp], { stdio: "inherit" });
    renameSync(tmp, out);
    console.log(`Loudness: ${res.input_i} LUFS -> ${loudnorm} LUFS (true peak <= -1 dBTP)`);
  }
  console.log(`Saved ${out} in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
