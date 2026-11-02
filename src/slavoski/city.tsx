/**
 * Low-poly city kit: Building (seeded windows, tilt/collapse), Road, Lamp, PineTree, Car,
 * plus two ready-made sets: StreetSet (street-level hero shots) and CityGrid (aerial shots).
 * Everything rests on y=0 using its real extents.
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import type { V3 } from "./noise";
import { P } from "./palette";
import { Flat, Glow } from "./materials";

const BOX = new THREE.BoxGeometry(1, 1, 1);
const tmp = new THREE.Object3D();
const tmpColor = new THREE.Color();

export const BUILDING_COLORS = [P.bldgNavy, P.bldgPurple, P.bldgSlate, P.bldgTeal, P.bldgIndigo] as const;

type WindowInstance = { pos: V3; size: V3; color: string };

/** Window grid on the four faces of a w×h×d box (box base at y=0, centred on x/z). */
const windowGrid = (w: number, h: number, d: number, seed: string, litRatio: number): WindowInstance[] => {
  const out: WindowInstance[] = [];
  const winW = 0.36, winH = 0.48, gapX = 0.78, gapY = 0.95, depth = 0.06;
  const rows = Math.max(1, Math.floor((h - 1.0) / gapY));
  const faces: { axis: "x" | "z"; sign: number; span: number }[] = [
    { axis: "z", sign: 1, span: w },
    { axis: "z", sign: -1, span: w },
    { axis: "x", sign: 1, span: d },
    { axis: "x", sign: -1, span: d },
  ];
  for (const f of faces) {
    const cols = Math.max(1, Math.floor((f.span - 0.5) / gapX));
    const start = -((cols - 1) * gapX) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const k = `${seed}:${f.axis}${f.sign}:${r}:${c}`;
        const roll = random(k);
        const color = roll < litRatio ? P.windowLit : roll < litRatio + 0.42 ? P.windowUnlit : P.windowDark;
        const y = 0.9 + r * gapY + winH / 2;
        const along = start + c * gapX;
        const pos: V3 =
          f.axis === "z" ? [along, y, f.sign * (d / 2 + depth / 2 - 0.02)] : [f.sign * (w / 2 + depth / 2 - 0.02), y, along];
        const size: V3 = f.axis === "z" ? [winW, winH, depth] : [depth, winH, winW];
        out.push({ pos, size, color });
      }
    }
  }
  return out;
};

const Instances: React.FC<{ items: WindowInstance[]; glow?: boolean }> = ({ items, glow }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    items.forEach((it, i) => {
      tmp.position.set(...it.pos);
      tmp.scale.set(...it.size);
      tmp.rotation.set(0, 0, 0);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
      m.setColorAt(i, tmpColor.set(it.color));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[BOX, undefined, items.length]} key={items.length}>
      {glow ? <meshBasicMaterial toneMapped={false} /> : <meshLambertMaterial flatShading />}
    </instancedMesh>
  );
};

export type BuildingProps = {
  position: V3;
  w?: number;
  d?: number;
  h?: number;
  color?: string;
  seed?: string;
  litRatio?: number;
  /** Lean in radians around the base edge: [x (toward -z/+z), z (toward ±x)]. Positive z tilts toward +x. */
  tilt?: [number, number];
  /** 0..1 sink into the ground (collapse). */
  sink?: number;
  yaw?: number;
};

export const Building: React.FC<BuildingProps> = ({
  position,
  w = 3.4,
  d = 3.4,
  h = 9,
  color = P.bldgNavy,
  seed = "b",
  litRatio = 0.33,
  tilt = [0, 0],
  sink = 0,
  yaw = 0,
}) => {
  const windows = useMemo(() => windowGrid(w, h, d, seed, litRatio), [w, h, d, seed, litRatio]);
  const lit = useMemo(() => windows.filter((x) => x.color === P.windowLit), [windows]);
  const rest = useMemo(() => windows.filter((x) => x.color !== P.windowLit), [windows]);
  const roofColor = useMemo(() => new THREE.Color(color).multiplyScalar(0.78).getStyle(), [color]);
  const rooftop = useMemo(
    () => ({
      w: w * (0.32 + random(`${seed}rt`) * 0.2),
      d: d * (0.28 + random(`${seed}rd`) * 0.2),
      x: (random(`${seed}rx`) - 0.5) * w * 0.3,
      z: (random(`${seed}rz`) - 0.5) * d * 0.3,
    }),
    [w, d, seed],
  );
  // Pivot on the base edge in the direction of the tilt so the building leans without sinking.
  const px = tilt[1] > 0 ? w / 2 : tilt[1] < 0 ? -w / 2 : 0;
  const pz = tilt[0] > 0 ? d / 2 : tilt[0] < 0 ? -d / 2 : 0;
  return (
    <group position={[position[0], position[1] - sink * h, position[2]]} rotation={[0, yaw, 0]}>
      <group position={[px, 0, pz]} rotation={[tilt[0], 0, -tilt[1]]}>
        <group position={[-px, 0, -pz]}>
          <mesh geometry={BOX} position={[0, h / 2, 0]} scale={[w, h, d]} castShadow receiveShadow>
            <Flat color={color} />
          </mesh>
          <mesh geometry={BOX} position={[0, h + 0.08, 0]} scale={[w - 0.3, 0.16, d - 0.3]} castShadow>
            <Flat color={roofColor} />
          </mesh>
          <mesh
            geometry={BOX}
            position={[rooftop.x, h + 0.16 + 0.35, rooftop.z]}
            scale={[rooftop.w, 0.7, rooftop.d]}
            castShadow
          >
            <Flat color={roofColor} />
          </mesh>
          <Instances items={rest} />
          <Instances items={lit} glow />
        </group>
      </group>
    </group>
  );
};

export const PineTree: React.FC<{ position: V3; scale?: number; color?: string; lean?: number }> = ({
  position,
  scale = 1,
  color = P.pine,
  lean = 0,
}) => (
  <group position={position} scale={scale} rotation={[0, 0, lean]}>
    <mesh position={[0, 0.5, 0]} castShadow>
      <boxGeometry args={[0.3, 1, 0.3]} />
      <Flat color={P.trunk} />
    </mesh>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[0, 1.5 + i * 0.95, 0]} castShadow>
        <coneGeometry args={[1.25 - i * 0.3, 1.9 - i * 0.2, 7]} />
        <Flat color={color} />
      </mesh>
    ))}
  </group>
);

export const Lamp: React.FC<{ position: V3; height?: number; yaw?: number }> = ({ position, height = 4.6, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, height / 2, 0]} castShadow>
      <cylinderGeometry args={[0.07, 0.09, height, 6]} />
      <Flat color={P.pole} />
    </mesh>
    <mesh position={[0, height + 0.06, 0]}>
      <boxGeometry args={[0.95, 0.14, 0.42]} />
      <Flat color={P.pole} />
    </mesh>
    <mesh position={[0, height - 0.02, 0]}>
      <boxGeometry args={[0.85, 0.06, 0.36]} />
      <Glow color={P.lampGlow} />
    </mesh>
  </group>
);

export const Car: React.FC<{ position: V3; yaw?: number; color?: string; lights?: boolean }> = ({
  position,
  yaw = 0,
  color = P.carRed,
  lights = true,
}) => {
  const wheel = 0.32;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {/* body (faces +z) */}
      <mesh position={[0, wheel + 0.32, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.62, 3.1]} />
        <Flat color={color} />
      </mesh>
      <mesh position={[0, wheel + 0.86, -0.2]} castShadow>
        <boxGeometry args={[1.3, 0.5, 1.6]} />
        <Flat color={P.bldgNavy} />
      </mesh>
      {[
        [0.72, 1.0],
        [-0.72, 1.0],
        [0.72, -1.0],
        [-0.72, -1.0],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, wheel, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[wheel, wheel, 0.24, 8]} />
          <Flat color="#15151C" />
        </mesh>
      ))}
      {lights
        ? [0.48, -0.48].map((x) => (
            <React.Fragment key={x}>
              <mesh position={[x, wheel + 0.36, 1.56]}>
                <boxGeometry args={[0.32, 0.16, 0.03]} />
                <Glow color={P.headlight} />
              </mesh>
              <mesh position={[x, wheel + 0.38, -1.56]}>
                <boxGeometry args={[0.3, 0.12, 0.03]} />
                <Glow color={P.taillight} />
              </mesh>
            </React.Fragment>
          ))
        : null}
    </group>
  );
};

/** A road slab running along Z with dashed centre marks. */
export const Road: React.FC<{ position?: V3; width?: number; length?: number; yaw?: number; dashes?: boolean }> = ({
  position = [0, 0, 0],
  width = 7,
  length = 120,
  yaw = 0,
  dashes = true,
}) => {
  const n = Math.floor(length / 4);
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[width, 0.1, length]} />
        <Flat color={P.road} />
      </mesh>
      {dashes
        ? Array.from({ length: n }, (_, i) => (
            <group key={i} position={[0, 0.005, -length / 2 + 2 + i * 4]}>
              {[-0.16, 0.16].map((x) => (
                <mesh key={x} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[0.13, 1.3]} />
                  <Flat color={P.laneMark} />
                </mesh>
              ))}
            </group>
          ))
        : null}
    </group>
  );
};

/** Ground plane (pavement colour) — big, receives shadows. */
export const Ground: React.FC<{ size?: number; color?: string; y?: number }> = ({ size = 600, color = P.pavement, y = -0.12 }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
    <planeGeometry args={[size, size]} />
    <Flat color={color} />
  </mesh>
);

// ---------------------------------------------------------------------------
// Ready-made sets
// ---------------------------------------------------------------------------

export type BuildingSpec = BuildingProps & { key: string };

/** Street running along Z (toward -Z into the distance), buildings on both sides. */
export const streetLayout = (seed: string, length = 90, roadW = 7, sidewalk = 2.6): BuildingSpec[] => {
  const specs: BuildingSpec[] = [];
  for (const side of [1, -1]) {
    let z = 8;
    let i = 0;
    while (z > -length) {
      const k = `${seed}:${side}:${i}`;
      const w = 3.2 + random(`${k}w`) * 1.6;
      const d = 3.4 + random(`${k}d`) * 1.8;
      const h = 6 + random(`${k}h`) * 9;
      const gap = 0.4 + random(`${k}g`) * 0.9;
      specs.push({
        key: k,
        seed: k,
        position: [side * (roadW / 2 + sidewalk + w / 2), 0, z - d / 2],
        w,
        d,
        h,
        color: BUILDING_COLORS[Math.floor(random(`${k}c`) * BUILDING_COLORS.length)],
        litRatio: 0.25 + random(`${k}l`) * 0.2,
      });
      z -= d + gap;
      i++;
    }
  }
  return specs;
};

export const StreetSet: React.FC<{
  seed?: string;
  length?: number;
  /** Per-building overrides (tilt/sink) by index. */
  modify?: (spec: BuildingSpec, index: number) => Partial<BuildingProps>;
  cars?: boolean;
  trees?: boolean;
}> = ({ seed = "street", length = 90, modify, cars = true, trees = true }) => {
  const specs = useMemo(() => streetLayout(seed, length), [seed, length]);
  const roadW = 7;
  return (
    <group>
      <Ground />
      <Road width={roadW} length={length * 2} />
      {/* curbs */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * (roadW / 2 + 1.3), 0.06, -length / 2]} receiveShadow>
          <boxGeometry args={[2.6, 0.12, length * 2]} />
          <Flat color={P.pavement} />
        </mesh>
      ))}
      {specs.map((s, i) => {
        const { key, ...props } = s;
        return <Building key={key} {...props} {...(modify?.(s, i) ?? {})} />;
      })}
      {Array.from({ length: Math.floor(length / 11) }, (_, i) => (
        <React.Fragment key={i}>
          <Lamp position={[roadW / 2 + 0.5, 0.12, 2 - i * 11]} />
          <Lamp position={[-(roadW / 2 + 0.5), 0.12, -3.5 - i * 11]} />
        </React.Fragment>
      ))}
      {trees
        ? Array.from({ length: Math.floor(length / 16) }, (_, i) => (
            <React.Fragment key={i}>
              <PineTree position={[-(roadW / 2 + 1.5), 0.12, -1 - i * 16]} scale={1.1 + random(`${seed}t${i}`) * 0.3} />
              <PineTree position={[roadW / 2 + 1.6, 0.12, -9 - i * 16]} scale={1.0 + random(`${seed}u${i}`) * 0.3} />
            </React.Fragment>
          ))
        : null}
      {cars ? (
        <>
          <Car position={[1.7, 0, -14]} yaw={Math.PI} color={P.carRed} />
          <Car position={[-1.7, 0, -24]} color={P.carTeal} />
        </>
      ) : null}
    </group>
  );
};

/** A grid of city blocks for aerial shots (roads along X and Z every `block`). */
export const CityGrid: React.FC<{
  seed?: string;
  blocks?: number;
  block?: number;
  modify?: (spec: BuildingSpec, index: number) => Partial<BuildingProps>;
  skip?: (bx: number, bz: number) => boolean;
}> = ({ seed = "city", blocks = 5, block = 14, modify, skip }) => {
  const roadW = 4;
  const specs = useMemo(() => {
    const out: BuildingSpec[] = [];
    const half = (blocks - 1) / 2;
    for (let bx = 0; bx < blocks; bx++)
      for (let bz = 0; bz < blocks; bz++) {
        if (skip?.(bx, bz)) continue;
        const cx = (bx - half) * block;
        const cz = (bz - half) * block;
        const inner = block - roadW - 1.2;
        // 2×2 lots per block
        for (let lx = 0; lx < 2; lx++)
          for (let lz = 0; lz < 2; lz++) {
            const k = `${seed}:${bx}:${bz}:${lx}${lz}`;
            if (random(`${k}e`) < 0.12) continue;
            const lot = inner / 2;
            const w = lot - 0.6 - random(`${k}w`) * 0.8;
            const d = lot - 0.6 - random(`${k}d`) * 0.8;
            out.push({
              key: k,
              seed: k,
              position: [cx + (lx - 0.5) * lot, 0, cz + (lz - 0.5) * lot],
              w,
              d,
              h: 3.5 + random(`${k}h`) * random(`${k}h2`) * 14,
              color: BUILDING_COLORS[Math.floor(random(`${k}c`) * BUILDING_COLORS.length)],
              litRatio: 0.28 + random(`${k}l`) * 0.15,
            });
          }
      }
    return out;
  }, [seed, blocks, block, skip]);
  const extent = blocks * block;
  return (
    <group>
      <Ground />
      {Array.from({ length: blocks + 1 }, (_, i) => {
        const o = (i - blocks / 2) * block;
        return (
          <React.Fragment key={i}>
            <Road position={[o, 0.01, 0]} width={roadW} length={extent + block} />
            <Road position={[0, 0.012, o]} width={roadW} length={extent + block} yaw={Math.PI / 2} />
          </React.Fragment>
        );
      })}
      {specs.map((s, i) => {
        const { key, ...props } = s;
        return <Building key={key} {...props} {...(modify?.(s, i) ?? {})} />;
      })}
    </group>
  );
};
