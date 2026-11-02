/**
 * Real numbers for the episode: an Earth-mass black hole appearing at rest 384,400 km from Earth.
 * Radial free fall of two equal masses (cycloid solution). See script.md for the derivation.
 */
const G = 6.674e-11;
const M_EARTH = 5.972e24;
const M_TOTAL = 2 * M_EARTH;
export const R0_KM = 384_400;
const R0 = R0_KM * 1000;
const U = Math.sqrt(R0 ** 3 / (8 * G * M_TOTAL)); // seconds
/** Total time to meet: 3.43 days. */
export const T_FALL_DAYS = (U * Math.PI) / 86400;
const R_EARTH_KM = 6371;

/** Separation (km) after `days` of falling. */
export const separationKm = (days: number): number => {
  const t = Math.max(0, Math.min(days, T_FALL_DAYS)) * 86400;
  let lo = 0, hi = Math.PI;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (U * (m + Math.sin(m)) < t) lo = m;
    else hi = m;
  }
  return (R0_KM / 2) * (1 + Math.cos(lo));
};

/** Distance from Earth's surface to the black hole (km), never below 0. */
export const surfaceDistanceKm = (days: number) => Math.max(0, separationKm(days) - R_EARTH_KM);

/** Tidal strength relative to today's lunar tides. */
export const tidesX = (days: number) => 81.3 * (R0_KM / Math.max(R_EARTH_KM, separationKm(days))) ** 3;

/** "3D 10H 22M" / "14H 05M" / "16M 40S" / "00M 00S". */
export const formatCountdown = (days: number): string => {
  // Round up to the shown unit, like a real countdown (3 d 10 h 21.5 m shows as 3D 10H 22M).
  const raw = Math.max(0, (T_FALL_DAYS - days) * 86400);
  const s = raw >= 3600 ? Math.ceil(raw / 60) * 60 : Math.ceil(raw);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d >= 1) return `${d}D ${pad(h)}H ${pad(m)}M`;
  if (h >= 1) return `${pad(h)}H ${pad(m)}M`;
  return `${pad(m)}M ${pad(sec)}S`;
};

export const formatKm = (km: number) => `${Math.round(km).toLocaleString("en-US")} KM`;

export const formatTides = (x: number) => `×${x >= 100 ? (Math.round(x / 10) * 10).toLocaleString("en-US") : Math.round(x)}`;
