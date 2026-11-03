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
