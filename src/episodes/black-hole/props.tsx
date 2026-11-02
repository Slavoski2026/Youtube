/** Props for "What If a Black Hole Appeared Next to Earth?". Reusable ones can move to src/slavoski/. */
import React, { useMemo } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { Flat, Glow } from "../../slavoski/materials";
import { clamp01, ease, fbm3, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";

/** Glossy black marble (rendered slightly larger than life so it reads on screen). */
export const Marble: React.FC<{ position: V3; radius?: number }> = ({ position, radius = 0.13 }) => (
  <group position={position}>
    <mesh castShadow>
      <icosahedronGeometry args={[radius, 2]} />
      <meshLambertMaterial color="#05050A" flatShading />
    </mesh>
    <mesh position={[-radius * 0.35, radius * 0.4, radius * 0.6]}>
      <icosahedronGeometry args={[radius * 0.18, 0]} />
      <Glow color="#9AA6D6" opacity={0.8} />
    </mesh>
  </group>
);

/** Binoculars centred at `position`, barrels pointing along `dir`. */
export const Binoculars: React.FC<{ position: V3; pitch?: number }> = ({ position, pitch = 0 }) => (
  <group position={position} rotation={[-pitch, 0, 0]}>
    {[-0.15, 0.15].map((x) => (
      <group key={x} position={[x, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, 0.42, 8]} />
          <Flat color="#23252E" />
        </mesh>
        <mesh position={[0, 0, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.02, 8]} />
          <Glow color="#6E86C8" />
        </mesh>
      </group>
    ))}
    <mesh>
      <boxGeometry args={[0.14, 0.1, 0.2]} />
      <Flat color="#3A3D4A" />
    </mesh>
  </group>
);

/** Amber arrow from `from` to `to` (shaft + head). */
export const Arrow: React.FC<{ from: V3; to: V3; width?: number; color?: string; progress?: number }> = ({
  from,
  to,
  width = 0.18,
  color = P.amber,
  progress = 1,
}) => {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const full = b.clone().sub(a);
  const len = full.length() * clamp01(progress);
  if (len < 0.01) return null;
  const dir = full.normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  const head = Math.min(len * 0.45, width * 3);
  return (
    <group position={from} quaternion={q}>
      <mesh position={[0, (len - head) / 2, 0]}>
        <cylinderGeometry args={[width / 2, width / 2, len - head, 8]} />
        <Glow color={color} fog={false} />
      </mesh>
      <mesh position={[0, len - head / 2, 0]}>
        <coneGeometry args={[width * 1.4, head, 8]} />
        <Glow color={color} fog={false} />
      </mesh>
    </group>
  );
};

/** Dashed straight line between two points (dashes are thin boxes). */
export const DashedLine: React.FC<{ from: V3; to: V3; dash?: number; gap?: number; width?: number; color?: string; progress?: number }> = ({
  from,
  to,
  dash = 0.3,
  gap = 0.2,
  width = 0.05,
  color = P.cream,
  progress = 1,
}) => {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const dir = b.clone().sub(a);
  const len = dir.length();
  dir.normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  const n = Math.floor((len * clamp01(progress)) / (dash + gap));
  return (
    <group position={from} quaternion={q}>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[0, i * (dash + gap) + dash / 2, 0]}>
          <boxGeometry args={[width, dash, width]} />
          <Glow color={color} fog={false} />
        </mesh>
      ))}
    </group>
  );
};

export const Observatory: React.FC<{ position?: V3; slitOpen?: number }> = ({ position = [0, 0, 0], slitOpen = 1 }) => (
  <group position={position}>
    {/* hill */}
    <mesh position={[0, -1.2, 0]} scale={[9, 2.4, 7]} receiveShadow>
      <icosahedronGeometry args={[1, 1]} />
      <Flat color="#232A45" />
    </mesh>
    <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[2.2, 2.3, 2.2, 12]} />
      <Flat color="#C9CED9" />
    </mesh>
    <group position={[0, 2.7, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[2.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Flat color="#DDE1EA" />
      </mesh>
      <mesh position={[0, 1.1, 1.55]} rotation={[-0.62, 0, 0]}>
        <boxGeometry args={[0.6 * slitOpen + 0.05, 2.6, 0.4]} />
        <Flat color="#0A0C18" />
      </mesh>
      <mesh position={[0, 1.5, 1.2]} rotation={[-0.55, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 2.2, 8]} />
        <Flat color="#3A3F55" />
      </mesh>
    </group>
    <mesh position={[0.9, 1.0, 2.25]}>
      <boxGeometry args={[0.7, 1.2, 0.08]} />
      <Glow color={P.windowLit} />
    </mesh>
  </group>
);

/**
 * Gravitationally lensed star field in a plane facing +Z. `thetaE` = Einstein radius in plane units.
 * Each star's primary image sits at (β + √(β²+4θE²))/2 along its direction; a faint secondary image inside.
 */
export const LensStars: React.FC<{ thetaE: number; t: number; count?: number; extent?: number; seed?: string }> = ({
  thetaE,
  t,
  count = 420,
  extent = 5,
  seed = "lens",
}) => {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (random(`${seed}x${i}`) - 0.5) * extent * 2,
        y: (random(`${seed}y${i}`) - 0.5) * extent * 2,
        s: 0.012 + random(`${seed}s${i}`) ** 3 * 0.035,
      })),
    [count, extent, seed],
  );
  const drift = t * 0.25;
  return (
    <group>
      {stars.map((st, i) => {
        let x = st.x + drift;
        if (x > extent) x -= extent * 2;
        const y = st.y;
        const b = Math.hypot(x, y) || 1e-4;
        const root = Math.sqrt(b * b + 4 * thetaE * thetaE);
        const kP = (b + root) / 2 / b;
        const kS = (b - root) / 2 / b;
        const mag = Math.min(1.7, 1 + (thetaE * thetaE) / (b * b) * 0.5);
        return (
          <React.Fragment key={i}>
            <mesh position={[x * kP, y * kP, 0]} scale={[mag * (1 + (kP - 1) * 0.6), mag, 1]} rotation={[0, 0, Math.atan2(y, x)]}>
              <circleGeometry args={[st.s, 6]} />
              <Glow color={P.star} fog={false} />
            </mesh>
            {thetaE > 0.05 && b < thetaE * 3 ? (
              <mesh position={[x * kS, y * kS, 0]}>
                <circleGeometry args={[st.s * 0.7, 6]} />
                <Glow color={P.star} opacity={0.45} fog={false} />
              </mesh>
            ) : null}
          </React.Fragment>
        );
      })}
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[Math.max(0.02, thetaE * 0.45), 24]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>
    </group>
  );
};

/** Earth tearing into faceted chunks that stream toward `target`. */
export const EarthBreakup: React.FC<{
  radius?: number;
  position: V3;
  target: V3;
  progress: number;
  t: number;
  seed?: string;
}> = ({ radius = 3, position, target, progress, t, seed = "earth" }) => {
  const chunks = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(radius, 2);
    const pos = g.getAttribute("position");
    const out: { geom: THREE.BufferGeometry; c: THREE.Vector3; color: string; i: number }[] = [];
    for (let f = 0; f < pos.count / 3; f++) {
      const a = new THREE.Vector3().fromBufferAttribute(pos, f * 3);
      const b = new THREE.Vector3().fromBufferAttribute(pos, f * 3 + 1);
      const c = new THREE.Vector3().fromBufferAttribute(pos, f * 3 + 2);
      const cen = a.clone().add(b).add(c).divideScalar(3);
      const apex = cen.clone().multiplyScalar(0.55);
      const geom = new THREE.BufferGeometry();
      const verts = [a, b, c, a, b, apex, b, c, apex, c, a, apex].map((v) => v.clone().sub(cen));
      geom.setAttribute("position", new THREE.Float32BufferAttribute(verts.flatMap((v) => [v.x, v.y, v.z]), 3));
      geom.computeVertexNormals();
      const n = cen.clone().normalize();
      const land = fbm3(seed, n.x * 1.5 + 10, n.y * 1.5, n.z * 1.5, 4);
      const color = Math.abs(n.y) > 0.9 ? P.ice : land > 0.53 ? (random(`${seed}d${f}`) > 0.5 ? P.landGreen : P.landTan) : P.ocean;
      out.push({ geom, c: cen, color, i: f });
    }
    return out;
  }, [radius, seed]);
  const origin = new THREE.Vector3(...position);
  const tgt = new THREE.Vector3(...target);
  const toT = tgt.clone().sub(origin).normalize();
  const side = new THREE.Vector3(0, 0, 1).cross(toT).normalize();
  return (
    <group>
      {/* molten core revealed as the crust peels */}
      <mesh position={position} scale={Math.max(0.01, 1 - ease((progress - 0.5) / 0.5)) * radius * 0.82}>
        <icosahedronGeometry args={[1, 2]} />
        <Glow color={P.lava} />
      </mesh>
      {chunks.map((ch) => {
        const n = ch.c.clone().normalize();
        const facing = n.dot(toT); // 1 = near side
        const start = ((1 - facing) / 2) * 0.55 + random(`${seed}s${ch.i}`) * 0.08;
        const p = clamp01((progress - start) / 0.45);
        const home = origin.clone().add(ch.c.clone().multiplyScalar(1 + clamp01(progress / Math.max(0.05, start + 0.01)) * 0.04));
        const e = ease(p);
        const swirl = Math.sin(p * Math.PI) * (1.6 + random(`${seed}w${ch.i}`) * 1.4);
        const posV = home.clone().lerp(tgt, e).addScaledVector(side, swirl);
        if (p >= 0.995) return null;
        const s = 1 - p * 0.75;
        return (
          <mesh key={ch.i} geometry={ch.geom} position={posV.toArray() as V3} rotation={[p * 4 + ch.i, p * 3, t * 0.2]} scale={s} castShadow>
            <Flat color={p > 0.6 ? P.smoke : ch.color} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Beach strip, a promenade and a row of buildings; sea toward +Z. */
export const CoastSet: React.FC<{ seed?: string; children?: React.ReactNode }> = ({ children }) => (
  <group>
    <mesh position={[0, -0.25, 3]} receiveShadow>
      <boxGeometry args={[120, 0.5, 10]} />
      <Flat color="#C8B07A" />
    </mesh>
    <mesh position={[0, 0.15, -4]} receiveShadow>
      <boxGeometry args={[120, 0.3, 5]} />
      <Flat color={P.pavement} />
    </mesh>
    <mesh position={[0, -0.6, 40]}>
      <boxGeometry args={[200, 0.2, 70]} />
      <Flat color="#0E2E5C" />
    </mesh>
    {children}
  </group>
);
