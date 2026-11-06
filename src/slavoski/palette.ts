/** SLAVOSKI house palette (sampled from the reference frames). Use only these tokens. */
export const P = {
  // Skies
  nightSky: "#090E26",
  nightSkyGlow: "#1A2148",
  space: "#0D0B1E",
  spaceGlow: "#1A1838",
  dustSky: "#44383F",
  dustSkyGlow: "#5E4B55",
  /** Dawn: used when nature takes over (ep. 2 onward). */
  dawnSky: "#1F3550",
  dawnGlow: "#D9926A",
  stormSky: "#1A2230",
  stormGlow: "#36465A",
  /** Daylight, sunset, overcast and snow skies (time-of-day and weather variety, ep. 6 onward). */
  daySky: "#4A8FD6",
  dayGlow: "#C4E0F6",
  sunsetSky: "#2E3560",
  sunsetGlow: "#F49A5C",
  overcastSky: "#56606F",
  overcastGlow: "#9AA3B0",
  snowSky: "#8592A6",
  snowGlow: "#DCE3EC",
  cloud: "#F4F6FA",

  // Nature
  grass: "#4F8F4A",
  grassLight: "#79B35C",
  leaf: "#3E7D45",
  leafDark: "#2C5E3A",
  moss: "#5E8A4C",
  bark: "#5A3A28",
  rust: "#8A4A2C",
  stone: "#B8AE98",
  stoneDark: "#857C6A",
  sediment: "#6B5A45",
  ghost: "#A8DEFF",

  // City
  bldgNavy: "#1D274B",
  bldgSlate: "#566270",
  bldgPurple: "#5A4A78",
  bldgTeal: "#2E5A6A",
  bldgIndigo: "#34396A",
  roof: "#2A2F4F",
  windowLit: "#E0B04E",
  windowUnlit: "#8FB3D9",
  windowDark: "#22304F",
  lampGlow: "#DDC284",
  pole: "#2B2F3E",
  road: "#2C3247",
  pavement: "#3A3F55",
  laneMark: "#E6D7A8",
  pine: "#1F6E6A",
  trunk: "#4A2E22",
  carRed: "#C8372D",
  carTeal: "#24748F",
  headlight: "#FFE9B0",
  taillight: "#FF4A3A",

  // Space
  moon: "#9AA1B0",
  moonDark: "#5D6475",
  ocean: "#0D3F86",
  landGreen: "#2F7A5A",
  landTan: "#B39A62",
  ice: "#E8EEF5",
  atmosphere: "#4F9BFF",
  orbitDots: "#4F9BFF",
  star: "#C9D2F0",

  // FX
  fire: "#FAA628",
  meteor: "#F18E1C",
  fireCore: "#FFE07A",
  lava: "#FE5A0E",
  smoke: "#6E5A55",
  smokeDark: "#4C3F3E",
  water: "#2C6FB0",
  waterFoam: "#BFE3FF",

  // Hero
  skin: "#C58B62",
  hair: "#3A2418",
  jacket: "#E8862A",
  zipper: "#F3E2B8",
  jeans: "#1F3558",
  shoe: "#D9DDE6",
  eyeWhite: "#F4F4F0",
  pupil: "#1A1A22",
  mouth: "#4A1E1A",

  // Brand / type
  amber: "#FFBA58",
  cream: "#F6EBC4",
  white: "#FFFFFF",
  ink: "#0B0B14",
} as const;

export type PaletteKey = keyof typeof P;

/** Mix two hex colours (t=0 → a, t=1 → b). */
export const mix = (a: string, b: string, t: number): string => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const m = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t);
  return `#${((m(16) << 16) | (m(8) << 8) | m(0)).toString(16).padStart(6, "0")}`;
};
