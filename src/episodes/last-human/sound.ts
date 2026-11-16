/**
 * Sound design for ep. 8. Narration always on top: the music ducks under the voice.
 *
 * - Music (one 50 s ambient cue, crossfade-looped) is used sparingly: under the phone scenes, the
 *   realisation, the blackout, the loneliness, the last chapter and the ending. At the city reveal it
 *   drops out: just wind ("the soundtrack becomes eerily quiet").
 * - Ambience beds follow the story's places and weather (morning birds, empty-city wind, night
 *   crickets, rain, fireplace, countryside).
 * - One-shot effects are keyed to narration words, so they stay in sync with the voice.
 */
import type { Caption } from "@remotion/captions";
import type { MusicCue, Sfx } from "../../slavoski/Soundtrack";
import { wordAt } from "../../slavoski/timeline";

type BlockTime = { id: string; start: number; end: number };
type ShotTime = { at: number; name: string };

const MUSIC = { src: "music/hollow.mp3", length: 50.04, xfade: 5 };

export const soundFor = (words: Caption[], blocks: BlockTime[], shots: ShotTime[]): { beds: MusicCue[]; sfx: Sfx[] } => {
  const w = (phrase: string, from = 0) => wordAt(words, phrase, from, -1);
  const block = (id: string) => blocks.find((b) => b.id === id)!;
  const start = (id: string) => Math.max(0, block(id).start - 0.15);
  const last = blocks[blocks.length - 1];
  const end = last.end + 4.4;
  const reveal = shots.find((s) => s.name === "cold.10")?.at ?? 21.6;

  const music = (from: number, to: number, gain: number, offset = 0): MusicCue => ({
    src: MUSIC.src,
    from,
    to,
    gain,
    fadeIn: 2.5,
    fadeOut: 3,
    loop: true,
    length: MUSIC.length,
    xfade: MUSIC.xfade,
    duck: 0.5,
    offset,
  });
  const bed = (src: string, from: number, to: number, gain: number, fade = 1.5): MusicCue => ({ src, from, to, gain, fadeIn: fade, fadeOut: fade, loop: true });

  const beds: MusicCue[] = [
    // ---- music, sparingly
    music(w("Until") - 0.3, reveal + 0.6, 0.2),
    music(w("And slowly") - 0.5, start("c3") + 1.0, 0.24),
    music(start("c5") + 0.5, start("c6") + 1.5, 0.26),
    music(w("Without emergency") - 1, start("c7") + 2, 0.22),
    music(w("The planet would continue") - 1, start("c10") + 1, 0.22),
    music(w("It might be loneliness") - 0.5, start("c11") + 1.5, 0.28),
    music(w("And you keep looking") - 0.5, start("c12") + 1.5, 0.24),
    music(start("c13"), end, 0.3),
    // ---- ambience
    bed("sfx/amb-countryside.mp3", 0, w("You step outside") + 0.4, 0.1),
    bed("sfx/amb-city-wind.mp3", w("You step outside"), start("c5") + 1, 1.0, 2.5),
    bed("sfx/amb-night.mp3", start("c5"), start("c6") + 1, 0.55, 2),
    bed("sfx/amb-rain.mp3", start("c6"), w("And you need to think") + 0.5, 0.18),
    bed("sfx/amb-city-wind.mp3", w("And you need to think"), w("or a serious"), 1.0),
    bed("sfx/amb-fire.mp3", w("Fire") - 0.1, w("Without emergency") + 0.3, 0.45, 0.4),
    bed("sfx/amb-rain.mp3", w("or a serious") - 0.3, start("c7") + 1, 0.45),
    bed("sfx/amb-countryside.mp3", start("c7"), w("Nature is beginning") + 0.2, 0.22),
    bed("sfx/amb-city-wind.mp3", w("Nature is beginning"), w("Meanwhile, the animals") + 0.5, 1.0),
    bed("sfx/amb-countryside.mp3", w("Meanwhile, the animals"), start("c10") + 1, 0.2),
    bed("sfx/amb-rain.mp3", start("c10"), start("c11") + 1, 0.42, 2),
    bed("sfx/amb-fire.mp3", w("It might be loneliness") - 0.2, start("c11") + 1, 0.3),
    bed("sfx/amb-countryside.mp3", start("c11"), w("Not because") + 0.3, 0.2),
    bed("sfx/amb-night.mp3", w("Not because"), start("c12") + 1, 0.45),
    bed("sfx/amb-fire.mp3", w("But because accepting"), start("c12") + 1, 0.3),
    bed("sfx/amb-city-wind.mp3", start("c12"), w("You might still generate") + 0.5, 1.0),
    bed("sfx/amb-rain.mp3", w("Buildings have suffered") - 0.2, w("Some areas") + 0.4, 0.55, 0.6),
    bed("sfx/amb-countryside.mp3", w("You might grow"), start("c13") + 1, 0.2),
    bed("sfx/amb-night.mp3", start("c13"), w("Yet Earth") + 1, 0.45),
    bed("sfx/amb-fire.mp3", start("c13"), w("Our cities") + 0.3, 0.32),
    bed("sfx/amb-countryside.mp3", w("Yet Earth") - 0.5, end, 0.24, 2),
  ];

  const sfx: Sfx[] = [
    { src: "sfx/alarm-clock.mp3", at: 0.15, volume: 0.42, duration: 2.3, fade: 0.08 },
    { src: "sfx/ringback.mp3", at: w("You call your best") + 0.5, volume: 0.32, duration: 1.4, fade: 0.2 },
    { src: "sfx/ringback.mp3", at: w("You call your family") + 0.4, volume: 0.3, duration: 1.3, fade: 0.2 },
    { src: "sfx/door-knock.mp3", at: w("You search houses") + 0.05, volume: 0.6 },
    { src: "sfx/car-drive.mp3", at: w("You drive") - 0.2, volume: 0.4, duration: 3.6, fade: 0.8 },
    { src: "sfx/tap-water.mp3", at: w("Water still") + 0.3, volume: 0.45 },
    { src: "sfx/car-drive.mp3", at: w("drive an expensive") - 0.2, volume: 0.35, duration: 1.8, fade: 0.5 },
    { src: "sfx/power-down.mp3", at: w("Some facilities") + 0.6, volume: 0.22, duration: 1.4, fade: 0.4 },
    { src: "sfx/tv-static.mp3", at: w("Others could") + 0.2, volume: 0.18, duration: 1.3, fade: 0.3 },
    { src: "sfx/impact-boom.mp3", at: w("Others could") + 0.35, volume: 0.16 },
    { src: "sfx/power-down.mp3", at: w("But eventually") + 0.4, volume: 0.3, duration: 2.2, fade: 0.6 },
    { src: "sfx/power-down.mp3", at: w("Refrigerators") + 0.2, volume: 0.16, duration: 1.0, fade: 0.3 },
    { src: "sfx/tap-water.mp3", at: w("Water pumps") + 0.05, volume: 0.35, duration: 1.2, fade: 0.4 },
    { src: "sfx/pencil-write.mp3", at: start("c6") + 0.3, volume: 0.45 },
    { src: "sfx/tap-water.mp3", at: w("Depending on") + 0.2, volume: 0.32, duration: 2.6, fade: 0.5 },
    { src: "sfx/thunder.mp3", at: w("completely helpless") - 0.6, volume: 0.32 },
    { src: "sfx/crow-caws.mp3", at: w("With traffic gone") + 0.6, volume: 0.22, duration: 2.0, fade: 0.5 },
    { src: "sfx/dog-grumble.mp3", at: start("c9") + 1.2, volume: 0.25 },
    { src: "sfx/gate-creak.mp3", at: w("especially vulnerable") - 0.1, volume: 0.35 },
    { src: "sfx/cow-moo.mp3", at: w("especially vulnerable") + 1.0, volume: 0.3 },
    { src: "sfx/wolf-howl.mp3", at: w("habitat disturbance") + 0.1, volume: 0.35 },
    { src: "sfx/thunder.mp3", at: start("c10") + 1.2, volume: 0.22 },
    { src: "sfx/alarm-clock.mp3", at: w("You wake up at the same") + 0.1, volume: 0.32, duration: 1.4, fade: 0.1 },
    { src: "sfx/hammer.mp3", at: w("equipment", w("You exercise")) - 0.1, volume: 0.4, duration: 1.0, fade: 0.2 },
    { src: "sfx/pencil-write.mp3", at: w("journal") - 0.1, volume: 0.4, duration: 1.0, fade: 0.2 },
    { src: "sfx/tv-static.mp3", at: w("Not because") + 0.2, volume: 0.14, duration: 2.4, fade: 0.5 },
    { src: "sfx/thunder.mp3", at: w("Buildings have suffered") + 1.1, volume: 0.4 },
    { src: "sfx/hammer.mp3", at: w("Every repair") + 0.1, volume: 0.45 },
    { src: "sfx/tap-water.mp3", at: w("Every mistake") + 0.1, volume: 0.35, duration: 2.0, fade: 0.4 },
    { src: "sfx/end-sting.mp3", at: last.end + 1.6, volume: 0.55 },
  ];
  return { beds: beds.filter((b) => b.to > b.from && b.from >= 0), sfx: sfx.filter((s) => s.at >= 0) };
};
