import { P } from "./palette";

export type HeroLook = {
  skin: string;
  skinShade: string;
  hair: string;
  jacket: string;
  jacketShade: string;
  zipper: string;
  jeans: string;
  shoe: string;
  /** Eye whites (red-tinted for tired, burning eyes). */
  eyeWhite?: string;
};

/** Slavoski: orange zip jacket, dark jeans, light block sneakers, dark-brown blocky hair. */
export const SLAVOSKI: HeroLook = {
  skin: P.skin,
  skinShade: "#B47A55",
  hair: P.hair,
  jacket: P.jacket,
  jacketShade: "#C96E1F",
  zipper: P.zipper,
  jeans: P.jeans,
  shoe: P.shoe,
};

/** Slavoski after 18+ hours of screen time: bloodshot eyes. */
export const SLAVOSKI_TIRED: HeroLook = { ...SLAVOSKI, eyeWhite: "#F0B4AE" };

/** An NPC police officer (same rig, navy uniform). */
export const POLICE_OFFICER: HeroLook = {
  skin: "#A86F4C",
  skinShade: "#93603F",
  hair: "#1A1410",
  jacket: "#1F3A7A",
  jacketShade: "#172C5E",
  zipper: "#E8D27A",
  jeans: "#17203A",
  shoe: "#141418",
};

/**
 * Generic townsfolk on Slavoski's rig (queues, crowds, the summit): varied skin, hair, jackets and
 * trousers, picked by seed. Never use orange jackets, so Slavoski stays easy to spot.
 */
const SKINS: [string, string][] = [
  ["#E0AC84", "#C48E68"],
  ["#C68A5E", "#A9714A"],
  ["#A86F4C", "#93603F"],
  ["#7A4E34", "#673F29"],
  ["#F0C8A4", "#D6AA86"],
];
const HAIRS = ["#1A1410", "#3A2A1E", "#6A4A2E", "#C9A46A", "#8A8A8A", "#2A1E18"];
const JACKETS: [string, string][] = [
  ["#2E5A6A", "#244A58"],
  ["#5A4A78", "#4A3C64"],
  ["#566270", "#46505C"],
  ["#8A3A3A", "#723030"],
  ["#3A6A4A", "#2E583C"],
  ["#2A3A5A", "#22304A"],
  ["#7A6A5A", "#64564A"],
];
const LEGS = ["#1D274B", "#2A2A30", "#4A4038", "#3A4A5A", "#17203A"];
const SHOES = ["#E8E4DA", "#2A2A30", "#6A4A34", "#C8C4BA"];

export const crowdLook = (seed: number): HeroLook => {
  const pick = <T,>(arr: T[], k: number) => arr[Math.abs(Math.floor(seed * 7919 + k * 104729)) % arr.length];
  const [skin, skinShade] = pick(SKINS, 1);
  const [jacket, jacketShade] = pick(JACKETS, 2);
  return { skin, skinShade, hair: pick(HAIRS, 3), jacket, jacketShade, zipper: "#D8D2C4", jeans: pick(LEGS, 4), shoe: pick(SHOES, 5) };
};

/** A dark suit for officials and world leaders (generic: no flags, no badges). */
export const suitLook = (seed: number): HeroLook => ({ ...crowdLook(seed), jacket: "#22283A", jacketShade: "#1A1F2E", zipper: "#E8E4DA", jeans: "#22283A", shoe: "#141418" });
