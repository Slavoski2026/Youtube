import type { CuedShot } from "../../../slavoski/timeline";
import { ACT1 } from "./act1";
import { ACT2 } from "./act2";
import { ACT3 } from "./act3";
import { ACT4 } from "./act4";
import { ACT5 } from "./act5";
import type { ShotFn } from "./common";

/** Every block's cued shots (acts 1–5). */
export const SHOTS: Record<string, CuedShot<ShotFn>[]> = { ...ACT1, ...ACT2, ...ACT3, ...ACT4, ...ACT5 };
