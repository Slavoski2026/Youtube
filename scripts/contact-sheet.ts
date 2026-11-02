/**
 * Renders a list of frames from a bundled composition into out/sheet/ and tiles them into a contact sheet.
 *   npx remotion bundle src/index.ts --out-dir=build
 *   npx tsx scripts/contact-sheet.ts <CompositionId> <frames,comma,separated> [scale=0.35] [out=out/sheet.png] [--props=<json>]
 * Uses software GL (swangle), which works in GPU-less containers.
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";

const [id, framesArg, scaleArg, outArg] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const propsArg = process.argv.find((a) => a.startsWith("--props="));
const inputProps = propsArg ? JSON.parse(propsArg.slice(8)) : {};
const frames = framesArg.split(",").map(Number);
const scale = Number(scaleArg ?? 0.35);
const out = outArg ?? "out/sheet.png";
const serveUrl = resolve(import.meta.dirname, "..", "build");
const dir = resolve(import.meta.dirname, "..", "out", "sheet");
mkdirSync(dir, { recursive: true });

const main = async () => {
  const browser = await openBrowser("chrome", { chromiumOptions: { gl: "swangle" } });
  const composition = await selectComposition({ serveUrl, id, inputProps, puppeteerInstance: browser, chromiumOptions: { gl: "swangle" } });
  const files: string[] = [];
  for (const frame of frames) {
    const output = resolve(dir, `${id}-${String(frame).padStart(5, "0")}.png`);
    await renderStill({ serveUrl, composition, frame, output, scale, inputProps, puppeteerInstance: browser, chromiumOptions: { gl: "swangle" }, overwrite: true });
    files.push(output);
    process.stdout.write(`${frame} `);
  }
  await browser.close({ silent: true });
  console.log(`\n${files.length} stills in out/sheet`);
  const { execFileSync } = await import("node:child_process");
  execFileSync("python3", ["-I", resolve(import.meta.dirname, "tile.py"), out, ...files], { stdio: "inherit" });
};
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
