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
import { BoxG, ConeG, CylG, IcoG, chamferBox, useDetail } from "./detail";

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

/** Ivy strips climbing each face from the ground; height grows with `decay`. */
const ivyPatches = (w: number, h: number, d: number, seed: string, decay: number): WindowInstance[] => {
  if (decay <= 0) return [];
  const out: WindowInstance[] = [];
  const faces: { axis: "x" | "z"; sign: number; span: number }[] = [
    { axis: "z", sign: 1, span: w },
    { axis: "z", sign: -1, span: w },
    { axis: "x", sign: 1, span: d },
    { axis: "x", sign: -1, span: d },
  ];
  for (const f of faces) {
    const n = Math.max(2, Math.round(f.span / 0.9));
    for (let i = 0; i < n; i++) {
      const k = `${seed}ivy${f.axis}${f.sign}${i}`;
      const reach = h * decay * (0.25 + random(k) * 0.75);
      if (reach < 0.2) continue;
      const width = 0.5 + random(`${k}w`) * 0.7;
      const along = -f.span / 2 + ((i + 0.5) / n) * f.span + (random(`${k}x`) - 0.5) * 0.3;
      const off = f.sign * ((f.axis === "z" ? d : w) / 2 + 0.06);
      const pos: V3 = f.axis === "z" ? [along, reach / 2, off] : [off, reach / 2, along];
      const size: V3 = f.axis === "z" ? [width, reach, 0.07] : [0.07, reach, width];
      out.push({ pos, size, color: random(`${k}c`) < 0.5 ? P.leaf : P.moss });
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
  /** 0..1 share of the lit windows still lit (1 = normal, 0 = blackout). */
  power?: number;
  /** 0..1 abandonment: weathered colour, broken windows, ivy climbing the walls, roof plants. */
  decay?: number;
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
  power = 1,
  decay = 0,
}) => {
  const windows = useMemo(() => windowGrid(w, h, d, seed, litRatio), [w, h, d, seed, litRatio]);
  const pq = Math.round(power * 20) / 20;
  const dq = Math.round(decay * 20) / 20;
  const { lit, rest } = useMemo(() => {
    const lit: WindowInstance[] = [];
    const rest: WindowInstance[] = [];
    windows.forEach((win, i) => {
      let c = win.color;
      if (c === P.windowLit && random(`${seed}pw${i}`) >= pq) c = P.windowDark;
      if (dq > 0 && c !== P.windowLit && random(`${seed}br${i}`) < dq * 0.7) c = "#0E1219";
      (c === P.windowLit ? lit : rest).push({ ...win, color: c });
    });
    return { lit, rest };
  }, [windows, pq, dq, seed]);
  const ivy = useMemo(() => ivyPatches(w, h, d, seed, dq), [w, h, d, seed, dq]);
  const bodyColor = useMemo(() => (dq > 0 ? new THREE.Color(color).lerp(new THREE.Color("#5E6A5A"), dq * 0.45).getStyle() : color), [color, dq]);
  const roofColor = useMemo(() => new THREE.Color(bodyColor).multiplyScalar(0.78).getStyle(), [bodyColor]);
  const rooftop = useMemo(
    () => ({
      w: w * (0.32 + random(`${seed}rt`) * 0.2),
      d: d * (0.28 + random(`${seed}rd`) * 0.2),
      x: (random(`${seed}rx`) - 0.5) * w * 0.3,
      z: (random(`${seed}rz`) - 0.5) * d * 0.3,
    }),
    [w, d, seed],
  );
  const { mid } = useDetail();
  // "mid" detail: chamfered edges at the real size, a cornice band and a sill under every window.
  const box = (bw: number, bh: number, bd: number) =>
    mid ? { geometry: chamferBox(bw, bh, bd), scale: [1, 1, 1] as V3 } : { geometry: BOX, scale: [bw, bh, bd] as V3 };
  const sills = useMemo(
    () =>
      mid
        ? windows.map((win) => ({
            pos: [win.pos[0], win.pos[1] - 0.27, win.pos[2]] as V3,
            size: (win.size[0] > win.size[2] ? [0.5, 0.06, 0.13] : [0.13, 0.06, 0.5]) as V3,
            color: roofColor,
          }))
        : [],
    [mid, windows, roofColor],
  );
  // Pivot on the base edge in the direction of the tilt so the building leans without sinking.
  const px = tilt[1] > 0 ? w / 2 : tilt[1] < 0 ? -w / 2 : 0;
  const pz = tilt[0] > 0 ? d / 2 : tilt[0] < 0 ? -d / 2 : 0;
  return (
    <group position={[position[0], position[1] - sink * h, position[2]]} rotation={[0, yaw, 0]}>
      <group position={[px, 0, pz]} rotation={[tilt[0], 0, -tilt[1]]}>
        <group position={[-px, 0, -pz]}>
          <mesh {...box(w, h, d)} position={[0, h / 2, 0]} castShadow receiveShadow>
            <Flat color={bodyColor} />
          </mesh>
          {mid ? (
            <mesh geometry={chamferBox(w + 0.16, 0.24, d + 0.16)} position={[0, h - 0.12, 0]} castShadow>
              <Flat color={roofColor} />
            </mesh>
          ) : null}
          <mesh {...box(w - 0.3, 0.16, d - 0.3)} position={[0, h + 0.08, 0]} castShadow>
            <Flat color={roofColor} />
          </mesh>
          <mesh {...box(rooftop.w, 0.7, rooftop.d)} position={[rooftop.x, h + 0.16 + 0.35, rooftop.z]} castShadow>
            <Flat color={roofColor} />
          </mesh>
          <Instances items={rest} />
          {sills.length ? <Instances items={sills} /> : null}
          {lit.length ? <Instances items={lit} glow /> : null}
          {ivy.length ? <Instances items={ivy} /> : null}
          {dq > 0.45 ? (
            <mesh geometry={BOX} position={[0, h + 0.3, 0]} scale={[(w - 0.4) * Math.min(1, dq), 0.35, (d - 0.4) * Math.min(1, dq)]} castShadow>
              <Flat color={P.leaf} />
            </mesh>
          ) : null}
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
      <BoxG args={[0.3, 1, 0.3]} />
      <Flat color={P.trunk} />
    </mesh>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[0, 1.5 + i * 0.95, 0]} castShadow>
        <ConeG args={[1.25 - i * 0.3, 1.9 - i * 0.2, 7]} />
        <Flat color={color} />
      </mesh>
    ))}
  </group>
);

export const Lamp: React.FC<{ position: V3; height?: number; yaw?: number; on?: boolean; lean?: number }> = ({
  position,
  height = 4.6,
  yaw = 0,
  on = true,
  lean = 0,
}) => (
  <group position={position} rotation={[0, yaw, lean]}>
    <mesh position={[0, height / 2, 0]} castShadow>
      <CylG args={[0.07, 0.09, height, 6]} />
      <Flat color={P.pole} />
    </mesh>
    <mesh position={[0, height + 0.06, 0]}>
      <BoxG args={[0.95, 0.14, 0.42]} />
      <Flat color={P.pole} />
    </mesh>
    <mesh position={[0, height - 0.02, 0]}>
      <BoxG args={[0.85, 0.06, 0.36]} />
      {on ? <Glow color={P.lampGlow} /> : <Flat color="#3A3A40" />}
    </mesh>
  </group>
);

/** Car half-length (front bumper to centre), for placing contact points without clipping. */
export const CAR_HALF_LENGTH = 1.55;

export const Car: React.FC<{
  position: V3;
  yaw?: number;
  color?: string;
  lights?: boolean;
  /** 0..1 rust and grime (abandoned cars). */
  rust?: number;
  /** 0..1 front crumple after a crash (the front shortens; the rear stays put). */
  crumple?: number;
  /** Extra tilt [pitch, roll] in radians, e.g. a car nosed into a kerb. */
  tilt?: [number, number];
  /** 0..1 moss and plants on the roof and bonnet. */
  moss?: number;
  /** Police car: white doors and a roof lightbar flashing with `t` (seconds). */
  police?: boolean;
  t?: number;
  /** Low, wide sports-car proportions (same length, so CAR_HALF_LENGTH still holds). */
  sporty?: boolean;
}> = ({ position, yaw = 0, color = P.carRed, lights = true, rust = 0, crumple = 0, tilt = [0, 0], moss = 0, police = false, t = 0, sporty = false }) => {
  const wheel = 0.32;
  const body = rust > 0 ? new THREE.Color(color).lerp(new THREE.Color(P.rust), rust * 0.75).getStyle() : color;
  const cabin = rust > 0 ? new THREE.Color(P.bldgNavy).lerp(new THREE.Color("#2A2420"), rust).getStyle() : P.bldgNavy;
  const len = 3.1 * (1 - 0.18 * crumple);
  const shift = (3.1 - len) / 2; // keep the rear bumper where it was
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <group rotation={[tilt[0], 0, tilt[1]]}>
      {/* body (faces +z) */}
      <mesh position={[0, wheel + 0.32, -shift]} castShadow receiveShadow>
        <BoxG args={[1.5, 0.62 - crumple * 0.08, len]} />
        <Flat color={body} />
      </mesh>
      <mesh position={[0, wheel + (sporty ? 0.72 : 0.86), sporty ? -0.35 : -0.2]} castShadow>
        <BoxG args={[1.3, sporty ? 0.34 : 0.5, sporty ? 1.3 : 1.6]} />
        <Flat color={cabin} />
      </mesh>
      {police ? (
        <>
          <mesh position={[0, wheel + 0.34, 0.1]} castShadow>
            <BoxG args={[1.52, 0.3, 1.4]} />
            <Flat color="#F2F2F2" />
          </mesh>
          {[-0.32, 0.32].map((x, i) => {
            const on = Math.floor(t * 6) % 2 === i;
            return (
              <mesh key={x} position={[x, wheel + 1.18, -0.2]}>
                <BoxG args={[0.5, 0.14, 0.3]} />
                <Glow color={i === 0 ? (on ? "#FF3040" : "#401018") : on ? "#3080FF" : "#101840"} fog={false} />
              </mesh>
            );
          })}
        </>
      ) : null}
      {sporty ? (
        <mesh position={[0, wheel + 0.66, -1.45]} castShadow>
          <BoxG args={[1.4, 0.06, 0.3]} />
          <Flat color={cabin} />
        </mesh>
      ) : null}
      {moss > 0 ? (
        <mesh position={[0, wheel + 1.12 + 0.06 * moss, -0.2]} castShadow>
          <BoxG args={[1.32 * moss, 0.14, 1.62 * moss]} />
          <Flat color={P.moss} />
        </mesh>
      ) : null}
      {[
        [0.72, 1.0],
        [-0.72, 1.0],
        [0.72, -1.0],
        [-0.72, -1.0],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, wheel, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <CylG args={[wheel, wheel, 0.24, 8]} />
          <Flat color="#15151C" />
        </mesh>
      ))}
      {lights && rust === 0
        ? [0.48, -0.48].map((x) => (
            <React.Fragment key={x}>
              <mesh position={[x, wheel + 0.36, 1.56 - shift * 2]}>
                <BoxG args={[0.32, 0.16, 0.03]} />
                <Glow color={P.headlight} />
              </mesh>
              <mesh position={[x, wheel + 0.38, -1.56]}>
                <BoxG args={[0.3, 0.12, 0.03]} />
                <Glow color={P.taillight} />
              </mesh>
            </React.Fragment>
          ))
        : null}
      </group>
    </group>
  );
};

/** Low-poly airliner, nose toward +Z. `t` (seconds) blinks the nav lights. */
export const Plane: React.FC<{ position: V3; rotation?: V3; scale?: number; t?: number }> = ({ position, rotation = [0, 0, 0], scale = 1, t = 0 }) => {
  const blink = Math.floor(t * 1.5) % 2 === 0;
  const white = "#D9DEE8";
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <CylG args={[0.55, 0.5, 7, 10]} />
        <Flat color={white} />
      </mesh>
      <mesh position={[0, 0, 3.9]} rotation={[Math.PI / 2, 0, 0]}>
        <ConeG args={[0.55, 1.0, 10]} />
        <Flat color={white} />
      </mesh>
      <mesh position={[0, 0.05, -3.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <ConeG args={[0.5, 1.2, 10]} />
        <Flat color={white} />
      </mesh>
      <mesh position={[0, -0.1, 0.3]}>
        <BoxG args={[9, 0.14, 1.5]} />
        <Flat color="#C3C9D6" />
      </mesh>
      <mesh position={[0, 0.2, -3.6]}>
        <BoxG args={[3.2, 0.1, 0.9]} />
        <Flat color="#C3C9D6" />
      </mesh>
      <mesh position={[0, 1.0, -3.7]}>
        <BoxG args={[0.12, 1.6, 1.1]} />
        <Flat color={P.carTeal} />
      </mesh>
      {[-2.2, 2.2].map((x) => (
        <mesh key={x} position={[x, -0.55, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
          <CylG args={[0.3, 0.32, 1.2, 8]} />
          <Flat color="#8E96A6" />
        </mesh>
      ))}
      {/* cabin window strip (lit) */}
      {[0.56, -0.56].map((x) => (
        <mesh key={x} position={[x, 0.15, 0.4]} rotation={[0, x > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <planeGeometry args={[5, 0.12]} />
          <Glow color={P.windowLit} />
        </mesh>
      ))}
      <mesh position={[4.5, -0.1, 0.3]}>
        <IcoG args={[0.12, 0]} />
        <Glow color={blink ? "#40FF70" : "#103018"} fog={false} />
      </mesh>
      <mesh position={[-4.5, -0.1, 0.3]}>
        <IcoG args={[0.12, 0]} />
        <Glow color={blink ? "#FF4040" : "#301010"} fog={false} />
      </mesh>
    </group>
  );
};

/** Power station: two cooling towers, a turbine hall and a pylon. `on` 0..1 fades steam and lights. */
export const PowerStation: React.FC<{ position?: V3; on?: number; t?: number }> = ({ position = [0, 0, 0], on = 1, t = 0 }) => {
  const tower = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 8; i++) {
      const y = (i / 8) * 9;
      const r = 3.2 - 1.5 * Math.sin((i / 8) * Math.PI * 0.85) + (i === 8 ? 0.2 : 0);
      pts.push(new THREE.Vector2(r, y));
    }
    return new THREE.LatheGeometry(pts, 14);
  }, []);
  return (
    <group position={position}>
      {[-4, 4].map((x, k) => (
        <group key={x} position={[x, 0, -2 - k * 1.5]}>
          <mesh geometry={tower} castShadow receiveShadow>
            <meshLambertMaterial color="#9A9CA6" flatShading side={THREE.DoubleSide} />
          </mesh>
          {on > 0.02
            ? Array.from({ length: 6 }, (_, i) => {
                const k2 = ((t * 0.35 + i / 6) % 1);
                const s = (1.2 + k2 * 2.2) * on;
                return (
                  <mesh key={i} position={[Math.sin(i * 2.1) * 0.6 * k2, 9.5 + k2 * 7, Math.cos(i * 1.7) * 0.6 * k2]}>
                    <IcoG args={[s, 1]} />
                    <meshLambertMaterial color="#D8DCE6" flatShading transparent opacity={(1 - k2) * 0.85 * on} depthWrite={false} />
                  </mesh>
                );
              })
            : null}
        </group>
      ))}
      <mesh position={[0, 2.2, 5]} castShadow receiveShadow>
        <BoxG args={[12, 4.4, 5]} />
        <Flat color={P.bldgSlate} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[-5 + i * 1.4, 2.6, 7.53]}>
          <BoxG args={[0.7, 0.9, 0.05]} />
          {on > i / 8 ? <Glow color={P.windowLit} /> : <Flat color={P.windowDark} />}
        </mesh>
      ))}
      <mesh position={[5, 5, 4]} castShadow>
        <CylG args={[0.45, 0.6, 10, 8]} />
        <Flat color="#7A7C86" />
      </mesh>
      {/* pylon */}
      <group position={[11, 0, 8]}>
        <mesh position={[0, 5, 0]}>
          <CylG args={[0.12, 0.7, 10, 4]} />
          <Flat color="#3A3F4A" />
        </mesh>
        {[7.5, 9].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <BoxG args={[4, 0.15, 0.15]} />
            <Flat color="#3A3F4A" />
          </mesh>
        ))}
      </group>
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
        <BoxG args={[width, 0.1, length]} />
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
  /** Street lamps lit (false after the blackout). */
  lampsOn?: boolean;
}> = ({ seed = "street", length = 90, modify, cars = true, trees = true, lampsOn = true }) => {
  const specs = useMemo(() => streetLayout(seed, length), [seed, length]);
  const roadW = 7;
  return (
    <group>
      <Ground />
      <Road width={roadW} length={length * 2} />
      {/* curbs */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * (roadW / 2 + 1.3), 0.06, -length / 2]} receiveShadow>
          <BoxG args={[2.6, 0.12, length * 2]} />
          <Flat color={P.pavement} />
        </mesh>
      ))}
      {specs.map((s, i) => {
        const { key, ...props } = s;
        return <Building key={key} {...props} {...(modify?.(s, i) ?? {})} />;
      })}
      {Array.from({ length: Math.floor(length / 11) }, (_, i) => (
        <React.Fragment key={i}>
          <Lamp position={[roadW / 2 + 0.5, 0.12, 2 - i * 11]} on={lampsOn} />
          <Lamp position={[-(roadW / 2 + 0.5), 0.12, -3.5 - i * 11]} on={lampsOn} />
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
