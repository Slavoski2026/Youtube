import type { Caption } from "@remotion/captions";
import type { CalculateMetadataFunction } from "remotion";
import { staticFile } from "remotion";

/** Written by `npm run import-voiceover` into `public/voiceover/<slug>.json`. */
export type VoiceoverManifest = {
  slug: string;
  /** Path relative to `public/`, e.g. `voiceover/black-hole.mp3`. Null for an estimated (silent) timing. */
  audio: string | null;
  durationInSeconds: number;
  /** Word captions. Every word after the first carries a leading space. */
  words: Caption[];
  /** True when the timing was estimated from the script, not transcribed from real audio. */
  estimated?: boolean;
};

export type VoiceoverProps = {
  /** Voiceover slug: loads `public/voiceover/<slug>.json`. */
  voiceover: string;
  /** Filled in by calculateMetadata. */
  manifest?: VoiceoverManifest | null;
};

/**
 * Makes a composition as long as its voiceover (plus `tailSeconds`).
 * Falls back to `fallback(props)` (an estimated manifest) when the voiceover hasn't been imported yet.
 */
export const voiceoverMetadata =
  <P extends VoiceoverProps>(
    fps: number,
    opts: { tailSeconds?: number; fallback?: (props: P) => VoiceoverManifest } = {},
  ): CalculateMetadataFunction<P> =>
  async ({ props }) => {
    let manifest: VoiceoverManifest | null = null;
    try {
      const res = await fetch(staticFile(`voiceover/${props.voiceover}.json`));
      if (res.ok) manifest = (await res.json()) as VoiceoverManifest;
    } catch {
      manifest = null;
    }
    if (!manifest && opts.fallback) manifest = opts.fallback(props);
    if (!manifest) throw new Error(`No voiceover manifest for "${props.voiceover}"`);
    const seconds = manifest.durationInSeconds + (opts.tailSeconds ?? 2);
    return {
      durationInFrames: Math.ceil(seconds * fps),
      props: { ...props, manifest },
    };
  };
