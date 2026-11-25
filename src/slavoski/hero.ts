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
  // ---- identity (ep. 8 on; all optional, so older looks render exactly as before) ----
  /** Haircut: "short" is Slavoski's (the default). */
  hairStyle?: "short" | "buzz" | "long" | "bob" | "ponytail" | "bun" | "pigtails";
  /** Facial hair, in the hair colour (stubble is a skin/hair mix). */
  beard?: "full" | "stubble" | "moustache";
  /** Dark lash ticks at the outer top corner of each eye. */
  lashes?: boolean;
  /** Mouth colour (lipstick); the house mouth colour otherwise. */
  lips?: string;
  /** Small round earrings under the ears. */
  earrings?: string;
  /** A knee-length skirt (or a dress's lower half) flaring from the hips; it folds over the lap when seated. */
  skirt?: string;
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

// ---- men and women (ep. 8 on): clearly male or female townsfolk on the same rig ----
// `crowdLook` stays as it was so published episodes re-render identically; new episodes cast with these.

const pickBy = <T,>(arr: T[], seed: number, k: number) => arr[Math.abs(Math.floor(seed * 7919 + k * 104729)) % arr.length];
const W_HAIRS = ["#1A1410", "#3A2A1E", "#6A2E1E", "#C9A46A", "#2A1E18", "#8A5A34"];
const LIPS = ["#B83A4A", "#9A3040", "#C8505A", "#A8485A"];
const SKIRTS = ["#5A4A78", "#2E5A6A", "#8A3A3A", "#24748F", "#3A6A4A", "#C8A040", "#1D274B"];
const TIGHTS = ["#2A2A30", "#3A3040"];

/** A man: short or buzzed hair, often a beard or moustache. `over` wins (e.g. a suit). */
export const manLook = (seed: number, over: Partial<HeroLook> = {}): HeroLook => ({
  ...crowdLook(seed),
  hairStyle: pickBy<HeroLook["hairStyle"]>(["short", "short", "buzz"], seed, 11),
  beard: pickBy<HeroLook["beard"]>([undefined, "stubble", "full", "moustache", undefined], seed, 12),
  ...over,
});

/** A woman: long, bob, ponytail or bun hair, lashes, lipstick, often earrings and a skirt or dress. */
export const womanLook = (seed: number, over: Partial<HeroLook> = {}): HeroLook => {
  const base = crowdLook(seed);
  const outfit = pickBy(["pants", "skirt", "dress"], seed, 13);
  const skirt = pickBy(SKIRTS, seed, 14);
  return {
    ...base,
    hair: pickBy(W_HAIRS, seed, 15),
    hairStyle: pickBy<HeroLook["hairStyle"]>(["long", "long", "bob", "ponytail", "bun"], seed, 16),
    lashes: true,
    lips: pickBy(LIPS, seed, 17),
    earrings: pickBy([undefined, "#F2C94C", "#E8E4DA"], seed, 18),
    ...(outfit === "pants" ? {} : { skirt, jeans: pickBy(TIGHTS, seed, 19) }),
    ...(outfit === "dress" ? { jacket: skirt, jacketShade: skirt, zipper: skirt } : {}),
    ...over,
  };
};

/** A girl (for a child, scaled ~0.62): pigtails or a ponytail, lashes, a dress. */
export const girlLook = (seed: number, over: Partial<HeroLook> = {}): HeroLook => {
  const dress = pickBy(["#24748F", "#C8505A", "#3A6A4A", "#5A4A78"], seed, 21);
  return {
    ...crowdLook(seed),
    hair: pickBy(["#3A2A1E", "#6A2E1E", "#1A1410"], seed, 22),
    hairStyle: pickBy<HeroLook["hairStyle"]>(["pigtails", "ponytail"], seed, 23),
    lashes: true,
    jacket: dress,
    jacketShade: dress,
    zipper: dress,
    skirt: dress,
    jeans: "#E8E4DA",
    ...over,
  };
};

/** Alternates by seed: odd seeds are women, even seeds men. */
export const personLook = (seed: number, over: Partial<HeroLook> = {}): HeroLook => (seed % 2 ? womanLook(seed, over) : manLook(seed, over));

/** A dark suit for a man or a woman (skirt suit), generic: no flags, no badges. */
export const suitFor = (seed: number, gender: "m" | "f"): HeroLook => {
  const suit = { jacket: "#22283A", jacketShade: "#1A1F2E", zipper: "#E8E4DA", shoe: "#141418" };
  return gender === "m" ? manLook(seed, { ...suit, jeans: "#22283A" }) : womanLook(seed, { ...suit, skirt: "#22283A", jeans: "#2A2A30" });
};

