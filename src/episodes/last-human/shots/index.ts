import type { CuedShot } from "../../../slavoski/timeline";
import { ACT1 } from "./act1";
import type { ShotFn } from "./common";

/** Every block's cued shots (acts 1–5). */
export const SHOTS: Record<string, CuedShot<ShotFn>[]> = { ...ACT1 };
