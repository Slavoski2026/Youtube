import React from "react";
import type * as THREE from "three";

/** Flat-shaded Lambert: the house material for every solid object. */
export const Flat: React.FC<{ color: string; opacity?: number; vertexColors?: boolean; side?: THREE.Side }> = ({
  color,
  opacity,
  vertexColors,
  side,
}) => (
  <meshLambertMaterial
    color={color}
    flatShading
    vertexColors={vertexColors}
    transparent={opacity !== undefined && opacity < 1}
    opacity={opacity ?? 1}
    side={side}
  />
);

/** Unlit glowing material for emissive practicals (windows, lamps, fire, lava). */
export const Glow: React.FC<{ color: string; opacity?: number; fog?: boolean; additive?: boolean }> = ({
  color,
  opacity = 1,
  fog = true,
  additive,
}) => (
  <meshBasicMaterial
    color={color}
    transparent={opacity < 1 || additive}
    opacity={opacity}
    fog={fog}
    depthWrite={!(opacity < 1 || additive)}
    blending={additive ? 2 /* AdditiveBlending */ : 1 /* NormalBlending */}
    toneMapped={false}
  />
);
