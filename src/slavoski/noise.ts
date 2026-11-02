import { random } from "remotion";

export type V3 = [number, number, number];

/** Smooth deterministic 1D noise in [-1, 1]. Same (seed, t) → same value on every render. */
export const noise1 = (seed: string | number, t: number): number => {
  const i = Math.floor(t);
  const f = t - i;
  const a = random(`${seed}:${i}`) * 2 - 1;
  const b = random(`${seed}:${i + 1}`) * 2 - 1;
  const s = f * f * (3 - 2 * f);
  return a + (b - a) * s;
};

/** Camera shake offset. `amp` in world units, `freq` in Hz, `t` in seconds. */
export const shake = (seed: string | number, t: number, amp: number, freq = 9): V3 => {
  if (amp <= 0) return [0, 0, 0];
  return [
    noise1(`${seed}x`, t * freq) * amp,
    noise1(`${seed}y`, t * freq) * amp,
    noise1(`${seed}z`, t * freq) * amp * 0.5,
  ];
};

/** Seeded value in [min, max). */
export const rand = (seed: string | number, min = 0, max = 1) => min + random(seed) * (max - min);

/** Deterministic 3D value noise in [0, 1] (for planet surfaces, facet jitter). */
export const noise3 = (seed: string, x: number, y: number, z: number): number => {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const s = (t: number) => t * t * (3 - 2 * t);
  const h = (a: number, b: number, c: number) => hash3(seed, a, b, c);
  const u = s(xf), v = s(yf), w = s(zf);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const x00 = lerp(h(xi, yi, zi), h(xi + 1, yi, zi), u);
  const x10 = lerp(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u);
  const x01 = lerp(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u);
  const x11 = lerp(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
};

const hash3 = (seed: string, x: number, y: number, z: number): number => {
  // Cheap integer hash (deterministic, faster than remotion's random for dense lookups).
  let h = 2166136261 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  h = Math.imul(h ^ (x * 374761393), 668265263);
  h = Math.imul(h ^ (y * 1274126177), 2246822519);
  h = Math.imul(h ^ (z * 2654435761), 3266489917);
  h ^= h >>> 15;
  return ((h >>> 0) % 100000) / 100000;
};

/** Fractal noise (a few octaves of noise3). */
export const fbm3 = (seed: string, x: number, y: number, z: number, octaves = 4): number => {
  let amp = 0.5, freq = 1, sum = 0, norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise3(`${seed}${o}`, x * freq, y * freq, z * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
};

export const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
export const ease = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};
