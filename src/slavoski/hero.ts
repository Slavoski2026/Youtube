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
