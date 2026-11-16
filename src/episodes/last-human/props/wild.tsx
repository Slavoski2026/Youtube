/**
 * Nature reclaiming things, on a believable timescale: `growthAt(day)` maps story time to how far
 * weeds, ivy and decay have got (nothing dramatic in the first weeks; only a speculative
 * "decades later" flash-forward goes far). Instanced forests, road cracks with weeds, a fallen tree,
 * a highway.
 */
import React, { useMemo } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { BoxG, CylG, ConeG, IcoG } from "../../../slavoski/detail";
import { Flat } from "../../../slavoski/materials";
import { GrassTufts } from "../../../slavoski/nature";
import type { V3 } from "../../../slavoski/noise";
import { P } from "../../../slavoski/palette";

/** Story day → overgrowth 0..1 (Day 1 → 0, Day 7 → 0.03, Day 30 → 0.12, Year 1 → 0.35, decades → 0.85). */
export const growthAt = (day: number): number => {
  const pts: [number, number][] = [
    [0, 0],
    [7, 0.03],
    [30, 0.12],
    [365, 0.35],
    [3650, 0.6],
    [18250, 0.85],
  ];
  for (let i = 1; i < pts.length; i++) {
    const [d0, g0] = pts[i - 1];
    const [d1, g1] = pts[i];
    if (day <= d1) return g0 + ((g1 - g0) * (day - d0)) / (d1 - d0);
  }
  return 0.85;
};

/** An instanced low-poly forest over an area (pines and leafy crowns), `growth` scales the trees. */
export const Forest: React.FC<{ area: [number, number, number, number]; count?: number; seed?: string; growth?: number; y?: number; avoid?: (x: number, z: number) => boolean; tint?: string }> = ({
  area,
  count = 300,
  seed = "forest",
  growth = 1,
  y = 0,
  avoid,
  tint,
}) => {
  const { trunks, cones, crowns } = useMemo(() => {
    const trunks: THREE.Matrix4[] = [];
    const cones: THREE.Matrix4[] = [];
    const crowns: THREE.Matrix4[] = [];
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const x = area[0] + random(`${seed}x${i}`) * (area[1] - area[0]);
      const z = area[2] + random(`${seed}z${i}`) * (area[3] - area[2]);
      if (avoid?.(x, z)) continue;
      const s = (2.2 + random(`${seed}s${i}`) * 2.4) * Math.max(0.05, growth);
      const pine = random(`${seed}p${i}`) < 0.55;
      trunks.push(m.clone().compose(new THREE.Vector3(x, y + s * 0.6, z), new THREE.Quaternion(), new THREE.Vector3(s * 0.25, s * 1.2, s * 0.25)));
      if (pine) {
        for (let k = 0; k < 3; k++) cones.push(m.clone().compose(new THREE.Vector3(x, y + s * (1.5 + k * 0.95), z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, random(`${seed}r${i}`) * 3, 0)), new THREE.Vector3(s * (1.25 - k * 0.3), s * (1.9 - k * 0.2), s * (1.25 - k * 0.3))));
      } else {
        crowns.push(m.clone().compose(new THREE.Vector3(x, y + s * 2.0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(random(`${seed}a${i}`), random(`${seed}b${i}`), 0)), new THREE.Vector3(s * 1.3, s * 1.1, s * 1.3)));
      }
    }
    return { trunks, cones, crowns };
  }, [area, count, seed, growth, y, avoid]);
  return (
    <group>
      <Inst mats={trunks} color={P.trunk} geom="box" />
      <Inst mats={cones} color={tint ?? P.pine} geom="cone" />
      <Inst mats={crowns} color={tint ?? P.leaf} geom="ico" />
    </group>
  );
};

const GEOMS = {
  box: () => new THREE.BoxGeometry(1, 1, 1),
  cone: () => new THREE.ConeGeometry(1, 1, 7),
  ico: () => new THREE.IcosahedronGeometry(1, 1),
};

const Inst: React.FC<{ mats: THREE.Matrix4[]; color: string; geom: keyof typeof GEOMS }> = ({ mats, color, geom }) => {
  const g = useMemo(() => GEOMS[geom](), [geom]);
  const ref = React.useRef<THREE.InstancedMesh>(null);
  React.useLayoutEffect(() => {
    if (!ref.current) return;
    mats.forEach((m, i) => ref.current!.setMatrixAt(i, m));
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [mats]);
  if (!mats.length) return null;
  return (
    <instancedMesh ref={ref} args={[g, undefined, mats.length]} castShadow receiveShadow>
      <meshLambertMaterial color={color} flatShading />
    </instancedMesh>
  );
};

/** Dark crack lines on a road (y = surface) with weeds pushing through, growing with `growth`. */
export const RoadCracks: React.FC<{ area: [number, number, number, number]; count?: number; growth: number; seed?: string; y?: number }> = ({ area, count = 14, growth, seed = "cracks", y = 0.03 }) => {
  const cracks = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const x = area[0] + random(`${seed}x${i}`) * (area[1] - area[0]);
        const z = area[2] + random(`${seed}z${i}`) * (area[3] - area[2]);
        const segs = Array.from({ length: 4 }, (_, k) => ({ len: 1.2 + random(`${seed}l${i}${k}`) * 2, yaw: random(`${seed}y${i}${k}`) * Math.PI }));
        return { x, z, segs, i };
      }),
    [area, count, seed],
  );
  return (
    <group>
      {cracks.map((c) => (
        <group key={c.i} position={[c.x, y, c.z]}>
          {c.segs.map((s, k) => (
            <mesh key={k} position={[Math.cos(s.yaw) * s.len * 0.4 * k, 0, Math.sin(s.yaw) * s.len * 0.4 * k]} rotation={[-Math.PI / 2, 0, s.yaw]}>
              <planeGeometry args={[s.len, 0.12]} />
              <Flat color="#15181F" />
            </mesh>
          ))}
          {growth > 0.01 ? <GrassTufts points={c.segs.map((s, k) => [c.x + Math.cos(s.yaw) * s.len * 0.4 * k, y, c.z + Math.sin(s.yaw) * s.len * 0.4 * k] as V3).map((p) => [p[0] - c.x, 0, p[2] - c.z] as V3)} growth={growth} height={1.2} seed={`${seed}g${c.i}`} /> : null}
        </group>
      ))}
    </group>
  );
};

/** A fallen tree lying across something (trunk along X), with its root plate and crown. */
export const FallenTree: React.FC<{ position: V3; yaw?: number; len?: number }> = ({ position, yaw = 0, len = 22 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 1.0, 0]} rotation={[0, 0, Math.PI / 2 - 0.05]} castShadow>
      <CylG args={[0.9, 1.2, len, 8]} />
      <Flat color={P.trunk} />
    </mesh>
    <mesh position={[-len / 2 - 0.5, 2.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <CylG args={[3.2, 3.2, 0.8, 9]} />
      <Flat color="#5A4030" />
    </mesh>
    {[0, 1, 2, 3].map((i) => (
      <mesh key={i} position={[len / 2 - 2 + i * 1.5, 2.0 + (i % 2) * 1.2, (i - 1.5) * 1.6]} castShadow>
        <IcoG args={[2.6, 1]} />
        <Flat color={i % 2 ? P.leaf : P.leafDark} />
      </mesh>
    ))}
  </group>
);

/** A long empty highway along Z: two carriageways, a median, guardrails, lane marks, sign gantry. */
export const Highway: React.FC<{ length?: number; growth?: number; seed?: string }> = ({ length = 900, growth = 0, seed = "hwy" }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, -length / 2 + 100]} receiveShadow>
      <planeGeometry args={[1500, length + 600]} />
      <Flat color="#5E7A44" />
    </mesh>
    {[-1, 1].map((s) => (
      <group key={s}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[s * 12, 0.02, -length / 2 + 100]} receiveShadow>
          <planeGeometry args={[20, length + 600]} />
          <Flat color={P.road} />
        </mesh>
        {[-3.4, 3.4].map((lx) =>
          Array.from({ length: Math.floor(length / 14) }, (_, i) => (
            <mesh key={`${lx}${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[s * 12 + lx, 0.04, 100 - i * 14]}>
              <planeGeometry args={[0.35, 5]} />
              <Flat color={P.laneMark} />
            </mesh>
          )),
        )}
        <mesh position={[s * 22.5, 0.9, -length / 2 + 100]} castShadow>
          <BoxG args={[0.3, 0.6, length + 600]} />
          <Flat color="#B8BEC8" />
        </mesh>
      </group>
    ))}
    <mesh position={[0, 0.5, -length / 2 + 100]} castShadow>
      <BoxG args={[1.2, 1.0, length + 600]} />
      <Flat color="#9AA1B0" />
    </mesh>
    {/* sign gantry */}
    <group position={[0, 0, -60]}>
      {[-24, 24].map((x) => (
        <mesh key={x} position={[x, 8, 0]} castShadow>
          <BoxG args={[0.8, 16, 0.8]} />
          <Flat color="#8A909C" />
        </mesh>
      ))}
      <mesh position={[0, 15.5, 0]} castShadow>
        <BoxG args={[49, 0.8, 0.8]} />
        <Flat color="#8A909C" />
      </mesh>
      {[-12, 12].map((x) => (
        <mesh key={x} position={[x, 13, 0.5]}>
          <BoxG args={[14, 4, 0.2]} />
          <Flat color="#2F6A4A" />
        </mesh>
      ))}
    </group>
    {growth > 0.02 ? <GrassTufts area={[-1.5, 1.5, -length + 100, 100]} count={140} growth={growth} height={1.6} seed={`${seed}med`} /> : null}
    {growth > 0.02 ? <RoadCracks area={[-20, 20, -400, 60]} count={30} growth={growth} seed={`${seed}cr`} /> : null}
  </group>
);

/** A low-poly bicycle lying on its side (garden prop). */
export const LyingBike: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, Math.PI / 2 - 0.1]}>
    {[-1.1, 1.1].map((z) => (
      <mesh key={z} position={[0, 0, z]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.8, 0.07, 6, 16]} />
        <Flat color="#1A1A1E" />
      </mesh>
    ))}
    <mesh position={[0, 0.5, 0]} rotation={[0.3, 0, 0]}>
      <BoxG args={[0.12, 0.12, 2.0]} />
      <Flat color="#C8372D" />
    </mesh>
  </group>
);

export { ConeG };
