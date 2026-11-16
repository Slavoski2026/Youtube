import type { Caption } from "@remotion/captions";
import { interpolate } from "remotion";
import { wordAt } from "../../slavoski/timeline";

/**
 * BODY TEMP readout (°C) over the episode, keyed to the narration: normal through the setup, climbing
 * while running, past 40 °C in heatstroke, back to normal for "you wouldn't instantly overheat", up
 * again for exercise and heatwaves, normal at the end.
 */
export const bodyTemp = (t: number, words: Caption[]): number => {
  const w = (p: string, from: number, fb: number) => wordAt(words, p, from, fb);
  const run = w("running", 20, 26.1);
  const dang = w("dangerous", run, 27);
  const climb = w("climbing", dang, 29.3);
  const skin = w("skin", climb, 32.4);
  const extreme = w("extreme", skin, 33.3);
  const stroke = w("heatstroke", extreme, 35.3);
  const failing = w("failing", stroke, 39);
  const surprising = w("surprising", failing, 40.7);
  const cooler = w("cooler", surprising, 47.1);
  const exercise = w("exercise", cooler, 50);
  const work = w("work", exercise, 52.9);
  const planet = w("planet", work, 54.2);
  const live = w("live", planet, 56.9);
  const keys: [number, number][] = [
    [0, 37.0],
    [run, 37.0],
    [dang + 0.5, 38.0],
    [climb + 0.4, 39.2],
    [skin + 0.4, 39.8],
    [stroke, 40.3],
    [failing + 0.3, 41.2],
    [surprising - 0.8, 41.2],
    [surprising - 0.1, 37.4],
    [cooler, 37.1],
    [cooler + 0.8, 36.9],
    [exercise, 37.4],
    [work, 38.4],
    [planet, 38.4],
    [live, 37.2],
    [live + 2, 37.0],
  ];
  const xs = keys.map((k) => k[0]);
  const ys = keys.map((k) => k[1]);
  // keep the key times strictly increasing even if a word is not found
  for (let i = 1; i < xs.length; i++) if (xs[i] <= xs[i - 1]) xs[i] = xs[i - 1] + 0.01;
  return interpolate(t, xs, ys, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
};
