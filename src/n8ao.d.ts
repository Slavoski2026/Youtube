/** Minimal typings for n8ao 2.x (the package ships none). Only what src/slavoski/postfx.tsx uses. */
declare module "n8ao" {
  import type { Camera, Scene } from "three";
  import { Pass } from "postprocessing";
  export class N8AOPostPass extends Pass {
    constructor(scene: Scene, camera: Camera, width?: number, height?: number);
    configuration: Record<string, unknown>;
    setQualityMode(mode: "Performance" | "Low" | "Medium" | "High" | "Ultra"): void;
  }
}
