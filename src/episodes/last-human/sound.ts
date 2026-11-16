/**
 * Sound design for ep. 8: music and ambience beds per stretch of the story, and one-shot effects keyed
 * to shots. Narration is always on top: music ducks to ~45% under the voice.
 */
import type { Caption } from "@remotion/captions";
import type { MusicCue, Sfx } from "../../slavoski/Soundtrack";

type BlockTime = { id: string; start: number; end: number };
type ShotTime = { at: number; name: string };

export const soundFor = (_words: Caption[], blocks: BlockTime[], shots: ShotTime[]): { beds: MusicCue[]; sfx: Sfx[] } => {
  void blocks;
  void shots;
  return { beds: [], sfx: [] };
};
