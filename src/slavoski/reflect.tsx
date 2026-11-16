/**
 * Reflective surfaces for the cinematic look: polished floors, still water, wet streets, heat mirages.
 * A `Mirror` renders the scene once more from a mirrored camera (drei's MeshReflectorMaterial), so use a
 * few per shot, not dozens. In the "classic" look it falls back to a plain flat surface.
 */
import { MeshReflectorMaterial } from "@react-three/drei";
import React from "react";
import { useDetail } from "./detail";
import { Flat } from "./materials";
import type { V3 } from "./noise";
import { useLook } from "./postfx";
import { isHq } from "./Stage";

export type MirrorProps = {
  position: V3;
  /** Plane size [width (x), depth (z)], or a circle radius for puddles. */
  size: [number, number] | number;
  /**
   * Base colour. The reflection multiplies it (colour × (1 − mirror + reflection × strength)), so pick a
   * fairly light tint: dark bases swallow the reflection.
   */
  color: string;
  /** 0..1 how much it mirrors (0.3 polished stone, 0.6 wet asphalt, 1 still water). */
  mirror?: number;
  /** Strength of the reflection over the base colour (≈ 0.5–2). */
  strength?: number;
  /** Blur of the reflection (0 = sharp mirror; 200–600 = soft, wet). Prefer 0 or ≥ 150: small blurs looked noisy. (The white flashes once blamed on blur were NaN facets, now fixed in postfx.tsx.) */
  blur?: number;
  roughness?: number;
  /** Rotation around Y (rectangles). */
  yaw?: number;
  /** Fade the reflection out with depth for a mirage (0 = off, ~0.6–1). */
  depthFade?: number;
};

export const Mirror: React.FC<MirrorProps> = ({ position, size, color, mirror = 0.6, strength = 1.2, blur = 300, roughness = 0.8, yaw = 0, depthFade = 0 }) => {
  const look = useLook();
  const { mid } = useDetail();
  const geom = typeof size === "number" ? <circleGeometry args={[size, mid ? 40 : 20]} /> : <planeGeometry args={[size[0], size[1]]} />;
  if (look === "classic") {
    return (
      <mesh position={position} rotation={[-Math.PI / 2, 0, yaw]} receiveShadow>
        {geom}
        <Flat color={color} />
      </mesh>
    );
  }
  const res = isHq() ? 1024 : 512;
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, yaw]} receiveShadow>
      {geom}
      <MeshReflectorMaterial
        color={color}
        resolution={res}
        mirror={mirror}
        mixStrength={strength}
        mixBlur={blur > 0 ? 1 : 0}
        blur={[blur, blur * 0.5]}
        roughness={roughness}
        metalness={0}
        depthScale={depthFade > 0 ? depthFade : 0}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.2}
        flatShading
      />
    </mesh>
  );
};
