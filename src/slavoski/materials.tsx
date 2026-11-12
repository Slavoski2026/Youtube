import React, { useContext, useMemo } from "react";
import { GlowBoost } from "./postfx";
import * as THREE from "three";

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
}) => {
  const boost = useContext(GlowBoost);
  const c = useMemo(() => (boost === 1 ? color : new THREE.Color(color).multiplyScalar(boost)), [color, boost]);
  return (
  <meshBasicMaterial
    color={c}
    transparent={opacity < 1 || additive}
    opacity={opacity}
    fog={fog}
    depthWrite={!(opacity < 1 || additive)}
    blending={additive ? 2 /* AdditiveBlending */ : 1 /* NormalBlending */}
    toneMapped={false}
  />
  );
};

let haloTexture: THREE.CanvasTexture | null = null;
/** A soft radial falloff (white centre → transparent edge), shared by every Halo. */
const haloMap = () => {
  if (haloTexture) return haloTexture;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.55)");
  g.addColorStop(0.45, "rgba(255,255,255,0.16)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  haloTexture = new THREE.CanvasTexture(c);
  haloTexture.colorSpace = THREE.SRGBColorSpace;
  return haloTexture;
};

/**
 * A soft glow around a light source (a camera-facing additive sprite): the house "bloom" for neon, lamps,
 * beacons, the sun and glowing cores. Depth-tested, so buildings in front still hide it.
 */
export const Halo: React.FC<{ position?: [number, number, number]; size: number; color: string; opacity?: number }> = ({ position = [0, 0, 0], size, color, opacity = 0.6 }) => (
  <sprite position={position} scale={[size, size, 1]}>
    <spriteMaterial map={haloMap()} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
  </sprite>
);
