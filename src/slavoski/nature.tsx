/**
 * Nature kit: grass tufts, bushes, leafy trees, ground cover, rain and lightning.
 * Growth is an explicit 0..1 prop so shots can show nature taking over a set.
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { clamp01, ease, type V3 } from "./noise";
import { P } from "./palette";
import { Flat, Glow } from "./materials";

const tmp = new THREE.Object3D();
const tmpColor = new THREE.Color();
const BLADE = new THREE.ConeGeometry(0.07, 1, 4);
BLADE.translate(0, 0.5, 0); // base on the ground

/** Grass tufts scattered over a rectangle (x0..x1, z0..z1) or along given points. Blades grow up with `growth`. */
export const GrassTufts: React.FC<{
  area?: [number, number, number, number];
  points?: V3[];
  count?: number;
  growth: number;
  height?: number;
  seed?: string;
  y?: number;
}> = ({ area, points, count = 300, growth, height = 0.7, seed = "grass", y = 0 }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const blades = useMemo(() => {
    const out: { p: V3; h: number; lean: number; yaw: number; c: string; start: number }[] = [];
    for (let i = 0; i < count; i++) {
      let base: V3;
      if (points && points.length) {
        const q = points[i % points.length];
        base = [q[0] + (random(`${seed}x${i}`) - 0.5) * 0.5, y, q[2] + (random(`${seed}z${i}`) - 0.5) * 0.5];
      } else {
        const [x0, x1, z0, z1] = area ?? [-5, 5, -5, 5];
        base = [x0 + random(`${seed}x${i}`) * (x1 - x0), y, z0 + random(`${seed}z${i}`) * (z1 - z0)];
      }
      out.push({
        p: base,
        h: height * (0.5 + random(`${seed}h${i}`) * 0.8),
        lean: (random(`${seed}l${i}`) - 0.5) * 0.6,
        yaw: random(`${seed}y${i}`) * Math.PI * 2,
        c: random(`${seed}c${i}`) < 0.5 ? P.grass : P.grassLight,
        start: random(`${seed}s${i}`) * 0.6,
      });
    }
    return out;
  }, [area, points, count, height, seed, y]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    blades.forEach((b, i) => {
      const g = ease((growth - b.start) / 0.4);
      tmp.position.set(...b.p);
      tmp.rotation.set(b.lean, b.yaw, 0);
      tmp.scale.set(1, Math.max(0.001, b.h * g), 1);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
      m.setColorAt(i, tmpColor.set(b.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[BLADE, undefined, blades.length]} key={blades.length} castShadow>
      <meshLambertMaterial flatShading />
    </instancedMesh>
  );
};

/** A low-poly bush (cluster of green icospheres). */
export const Bush: React.FC<{ position: V3; size?: number; growth?: number; seed?: string; color?: string }> = ({
  position,
  size = 1,
  growth = 1,
  seed = "bush",
  color = P.leaf,
}) => {
  const g = ease(growth);
  if (g <= 0.01) return null;
  return (
    <group position={position} scale={size * g}>
      {[0, 1, 2, 3].map((i) => {
        const a = random(`${seed}${i}`) * Math.PI * 2;
        const r = 0.35 + random(`${seed}r${i}`) * 0.3;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.35 * (i ? 1 : 0), r, Math.sin(a) * 0.35 * (i ? 1 : 0)]} castShadow>
            <icosahedronGeometry args={[r, 0]} />
            <Flat color={i % 2 ? P.leafDark : color} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Leafy (deciduous) tree: trunk plus 2–3 faceted canopy blobs. Grows from a sapling with `growth`. */
export const LeafyTree: React.FC<{ position: V3; scale?: number; growth?: number; seed?: string; lean?: number }> = ({
  position,
  scale = 1,
  growth = 1,
  seed = "tree",
  lean = 0,
}) => {
  const g = 0.15 + 0.85 * ease(growth);
  if (growth <= 0) return null;
  const h = 2.6 + random(`${seed}h`) * 1.2;
  return (
    <group position={position} scale={scale * g} rotation={[0, random(`${seed}y`) * 6, lean]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.24, h, 6]} />
        <Flat color={P.bark} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[(random(`${seed}x${i}`) - 0.5) * 1.1, h + 0.3 + i * 0.45, (random(`${seed}z${i}`) - 0.5) * 1.1]}
          castShadow
        >
          <icosahedronGeometry args={[1.05 - i * 0.18, 0]} />
          <Flat color={i === 1 ? P.leafDark : P.leaf} />
        </mesh>
      ))}
    </group>
  );
};

/** Flat green patches spreading over the ground (moss and weeds over asphalt). */
export const GroundCover: React.FC<{ area: [number, number, number, number]; growth: number; count?: number; seed?: string; y?: number }> = ({
  area,
  growth,
  count = 40,
  seed = "cover",
  y = 0.015,
}) => {
  const patches = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: area[0] + random(`${seed}x${i}`) * (area[1] - area[0]),
        z: area[2] + random(`${seed}z${i}`) * (area[3] - area[2]),
        r: 0.6 + random(`${seed}r${i}`) * 1.6,
        rot: random(`${seed}a${i}`) * Math.PI,
        start: random(`${seed}s${i}`) * 0.7,
        c: random(`${seed}c${i}`) < 0.6 ? P.moss : P.grass,
      })),
    [area, count, seed],
  );
  return (
    <group>
      {patches.map((p, i) => {
        const g = ease((growth - p.start) / 0.3);
        if (g <= 0.01) return null;
        return (
          <mesh key={i} position={[p.x, y + i * 0.0004, p.z]} rotation={[-Math.PI / 2, 0, p.rot]} scale={g} receiveShadow>
            <circleGeometry args={[p.r, 6]} />
            <Flat color={p.c} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Rain streaks falling through a box around `center`. `t` in seconds. */
export const Rain: React.FC<{ center: V3; size?: [number, number, number]; t: number; count?: number; seed?: string; speed?: number }> = ({
  center,
  size = [30, 20, 30],
  t,
  count = 500,
  seed = "rain",
  speed = 22,
}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const drops = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (random(`${seed}x${i}`) - 0.5) * size[0],
        z: (random(`${seed}z${i}`) - 0.5) * size[2],
        o: random(`${seed}o${i}`),
      })),
    [count, seed, size],
  );
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    drops.forEach((d, i) => {
      const k = (d.o + (t * speed) / size[1]) % 1;
      tmp.position.set(center[0] + d.x + k * 1.5, center[1] + size[1] / 2 - k * size[1], center[2] + d.z);
      tmp.rotation.set(0, 0, 0.08);
      tmp.scale.set(1, 1, 1);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, drops.length]} key={drops.length}>
      <boxGeometry args={[0.03, 0.9, 0.03]} />
      <meshBasicMaterial color="#B9CCE6" transparent opacity={0.55} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  );
};

/** Lightning: a jagged emissive bolt from `top` to `bottom`, visible while 0 < flash. */
export const LightningBolt: React.FC<{ top: V3; bottom: V3; flash: number; seed?: string }> = ({ top, bottom, flash, seed = "bolt" }) => {
  const segs = useMemo(() => {
    const n = 9;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const p = new THREE.Vector3(...top).lerp(new THREE.Vector3(...bottom), k);
      if (i > 0 && i < n) {
        p.x += (random(`${seed}x${i}`) - 0.5) * 3;
        p.z += (random(`${seed}z${i}`) - 0.5) * 1.5;
      }
      pts.push(p);
    }
    return pts.slice(1).map((b, i) => {
      const a = pts[i];
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const dir = b.clone().sub(a);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      return { mid: mid.toArray() as V3, q, len: dir.length() };
    });
  }, [top, bottom, seed]);
  if (flash <= 0) return null;
  return (
    <group>
      {segs.map((s, i) => (
        <mesh key={i} position={s.mid} quaternion={s.q}>
          <cylinderGeometry args={[0.12, 0.12, s.len, 4]} />
          <Glow color="#EAF2FF" opacity={clamp01(flash)} fog={false} />
        </mesh>
      ))}
    </group>
  );
};
