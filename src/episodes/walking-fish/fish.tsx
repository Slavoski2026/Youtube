/**
 * Walking fish (ep. 8): our own design. A faceted, countershaded fish body on two stubby legs with
 * little white block sneakers, Slavoski-style square eyes on the sides of the head (with brows for
 * attitude), a mouth, flapping pectoral fins and a wagging tail.
 *
 * - `Fish`: one posable fish for close-ups (walk phase, face, pitch, fins).
 * - `FishSwarm`: thousands of instanced fish walking along lanes (beach landings, marching columns),
 *   with `freeze` (time stops) and `turn` (every head swings toward a target).
 *
 * Everything faces +Z with its feet on y = 0 at scale 1. Sizes are at Slavoski's scale (he is 4.2 tall).
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { useDetail } from "../../slavoski/detail";
import { Flat } from "../../slavoski/materials";
import type { V3 } from "../../slavoski/noise";

export type FishKind = "goldfish" | "salmon" | "tuna" | "shark" | "swordfish" | "mackerel" | "cod";

export type FishSpec = {
  /** Body length (snout to tail root), height and width. */
  L: number;
  H: number;
  W: number;
  back: string;
  belly: string;
  /** Optional band along the flank (salmon pink). */
  side?: string;
  /** Optional dark bars across the back (mackerel). */
  stripe?: string;
  /** Dark spots on the back (salmon, cod). */
  spots?: string;
  fin: string;
  /** Hip height (leg length). */
  leg: number;
  eye: number;
  tail: number;
  dorsal: number;
  /** Swordfish bill length. */
  bill?: number;
  /** Shark: a toothy mouth under the snout. */
  teeth?: boolean;
  legColor: string;
};

export const FISH: Record<FishKind, FishSpec> = {
  goldfish: { L: 0.9, H: 0.66, W: 0.42, back: "#F07A1A", belly: "#FFC060", fin: "#FF9A40", leg: 0.32, eye: 0.21, tail: 0.62, dorsal: 0.3, legColor: "#E8782A" },
  salmon: { L: 2.1, H: 0.62, W: 0.46, back: "#596A80", belly: "#EEE8E2", side: "#E8968A", spots: "#2E3644", fin: "#6A7488", leg: 0.6, eye: 0.21, tail: 0.6, dorsal: 0.32, legColor: "#7A8496" },
  tuna: { L: 2.9, H: 1.05, W: 0.82, back: "#1D3A6A", belly: "#D8DEE6", side: "#7A8EA8", fin: "#E8C030", leg: 0.72, eye: 0.27, tail: 0.95, dorsal: 0.5, legColor: "#3E5A84" },
  shark: { L: 8.4, H: 2.1, W: 1.9, back: "#6B7686", belly: "#EDEEE8", fin: "#5E6878", leg: 1.45, eye: 0.36, tail: 2.6, dorsal: 1.7, teeth: true, legColor: "#6E7888" },
  swordfish: { L: 3.6, H: 1.0, W: 0.7, back: "#2A3E6A", belly: "#C8D0DA", side: "#5A6E92", fin: "#3A4E7A", leg: 0.82, eye: 0.29, tail: 1.1, dorsal: 0.9, bill: 1.9, legColor: "#4A5A7E" },
  mackerel: { L: 1.45, H: 0.44, W: 0.32, back: "#2E6A6E", belly: "#E6EAEE", stripe: "#163A40", fin: "#3E5A60", leg: 0.42, eye: 0.16, tail: 0.42, dorsal: 0.2, legColor: "#3E6468" },
  cod: { L: 1.7, H: 0.58, W: 0.46, back: "#8A7A52", belly: "#ECE4CC", spots: "#5E5236", fin: "#7A6A48", leg: 0.48, eye: 0.19, tail: 0.5, dorsal: 0.26, legColor: "#8A7A56" },
};

export const SNEAKER = "#E8E6E0";
export const SOLE = "#B8B4AA";

/** Centre height of the body above the feet: legs tuck a little into the belly. */
export const bodyY = (s: FishSpec) => s.leg + s.H * 0.36;

// ---------------------------------------------------------------- geometry (baked per kind)

const colorCache = new Map<string, THREE.BufferGeometry>();

/** A countershaded, tapered icosphere body with per-face colours (back / flank band / belly, stripes, spots). */
export const fishBodyGeometry = (kind: FishKind, detail = 2): THREE.BufferGeometry => {
  const key = `${kind}:${detail}`;
  const hit = colorCache.get(key);
  if (hit) return hit;
  const s = FISH[kind];
  const g = new THREE.IcosahedronGeometry(1, detail).toNonIndexed();
  const pos = g.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    // taper toward the tail (z < 0) and blunt the snout a little
    const taper = z < 0 ? 1 + z * 0.62 : 1 - z * z * 0.18;
    const yBias = kind === "shark" && z > 0.4 ? -0.08 * (z - 0.4) : 0;
    pos.setXYZ(i, x * (s.W / 2) * taper, (y * taper + yBias) * (s.H / 2), z * (s.L / 2));
  }
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const pick = (cx: number, cy: number, cz: number, f: number) => {
    const ny = cy / (s.H / 2);
    const nz = cz / (s.L / 2);
    if (ny < -0.18) return s.belly;
    if (s.side && ny < 0.18) return s.side;
    if (s.stripe && ny > 0.1 && Math.sin(nz * 22) > 0.35) return s.stripe;
    if (s.spots && ny > 0.25 && random(`${kind}sp${f}`) < 0.16) return s.spots;
    return s.back;
  };
  for (let f = 0; f < pos.count / 3; f++) {
    let cx = 0,
      cy = 0,
      cz = 0;
    for (let k = 0; k < 3; k++) {
      cx += pos.getX(f * 3 + k) / 3;
      cy += pos.getY(f * 3 + k) / 3;
      cz += pos.getZ(f * 3 + k) / 3;
    }
    c.set(pick(cx, cy, cz, f));
    // a touch of facet jitter so the flat shading sparkles
    const j = 0.94 + random(`${kind}j${f}`) * 0.1;
    for (let k = 0; k < 3; k++) colors.set([c.r * j, c.g * j, c.b * j], (f * 3 + k) * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  colorCache.set(key, g);
  return g;
};

/** A flat fin from a 2D outline (x = backward, y = up), `d` thick, centred on x = 0 sideways. */
const finGeometry = (pts: [number, number][], d: number) => {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
  g.translate(0, 0, -d / 2);
  g.rotateY(Math.PI / 2); // outline x (backward) → -Z, thickness → X
  return g;
};

/** Unit tail fin: a forked "V", root at the origin, reaching 1 backward. */
const TAIL_FORK = finGeometry(
  [
    [0, 0.1],
    [0.85, 0.78],
    [1.0, 0.62],
    [0.62, 0],
    [1.0, -0.56],
    [0.85, -0.68],
    [0, -0.1],
  ],
  0.06,
);
/** Shark tail: a big upper lobe. */
const TAIL_SHARK = finGeometry(
  [
    [0, 0.12],
    [0.9, 1.0],
    [1.0, 0.86],
    [0.5, 0],
    [0.62, -0.42],
    [0.5, -0.46],
    [0, -0.12],
  ],
  0.08,
);
/** Unit dorsal fin, swept back, base from x = -0.5 to 0.45, tip at height 1. */
const DORSAL = finGeometry(
  [
    [-0.5, 0],
    [0.45, 0],
    [0.38, 0.12],
    [0.22, 1.0],
  ],
  0.06,
);
/** Unit pectoral fin (a small paddle), root at the origin, reaching 1 backward. */
const PECTORAL = finGeometry(
  [
    [0, 0.12],
    [0.85, 0.2],
    [1.0, -0.05],
    [0.6, -0.35],
    [0, -0.12],
  ],
  0.08,
);

// ---------------------------------------------------------------- one posable fish

export type FishFace = {
  /** Pupil offset in eye widths [-0.3..0.3]: x toward the snout, y up. */
  look?: [number, number];
  brow?: "none" | "angry" | "worried" | "flat";
  /** 1 normal, 1.3 wide, 0.4 squint. */
  eyeOpen?: number;
  blink?: number;
  /** 0 closed … 1 wide open. */
  mouth?: number;
};

export type FishProps = {
  kind: FishKind;
  position?: V3;
  yaw?: number;
  scale?: number;
  /** Walk phase in strides (1 = left + right step). */
  walk?: number;
  /** 0 standing … 1 full stride. */
  amount?: number;
  face?: FishFace;
  /** Nose up (+) / down (−), radians around the hips. */
  pitch?: number;
  /** Pectoral fins: 0 at the sides … 1 flapped out like arms. */
  fins?: number;
  /** Turn the head end left/right (radians), e.g. to look at the camera. */
  headYaw?: number;
  /** 0..1 legs grown (0 = an ordinary fish, legs tucked away). */
  legs?: number;
  /** Extra tail wag (radians), added to the walking wag. */
  wag?: number;
  castShadow?: boolean;
};

/** One walking fish, posable for close-ups. Faces +Z, feet on y = 0. */
export const Fish: React.FC<FishProps> = ({
  kind,
  position = [0, 0, 0],
  yaw = 0,
  scale = 1,
  walk = 0,
  amount = 0,
  face = {},
  pitch = 0,
  fins = 0,
  headYaw = 0,
  legs = 1,
  wag = 0,
  castShadow = true,
}) => {
  const s = FISH[kind];
  const { mid } = useDetail();
  const body = useMemo(() => fishBodyGeometry(kind, mid ? 2 : 1), [kind, mid]);
  const ph = walk * Math.PI * 2;
  const sn = Math.sin(ph);
  const cs = Math.cos(ph);
  const legK = Math.max(0, Math.min(1, legs));
  const hipY = s.leg * legK;
  const bob = Math.abs(sn) * 0.07 * s.leg * amount;
  const by = hipY + s.H * 0.36 + bob;
  const roll = sn * 0.07 * amount;
  const waddle = sn * 0.08 * amount;
  const tailWag = Math.sin(ph * 2) * 0.32 * amount + wag;
  const legW = Math.max(0.07, s.leg * 0.17);
  const thigh = s.leg * 0.55;
  const shin = s.leg * 0.5;
  const { look = [0, 0], brow = "none", eyeOpen = 1, blink = 0, mouth = 0 } = face;
  const eh = s.eye * 1.15 * eyeOpen * (1 - blink * 0.88);
  const browA = { none: 0, flat: 0, angry: 0.5, worried: -0.42 }[brow];
  const headZ = s.L * 0.3;

  const leg = (side: 1 | -1) => {
    const swing = side * sn * 0.55 * amount;
    const knee = Math.max(0, -side * cs) * 0.85 * amount + 0.05;
    return (
      <group key={side} position={[side * s.W * 0.24, hipY, s.L * 0.04]} rotation={[swing, 0, side * 0.04]} scale={[1, Math.max(0.001, legK), 1]}>
        <mesh position={[0, -thigh / 2, 0]} castShadow={castShadow}>
          <boxGeometry args={[legW, thigh + legW * 0.3, legW]} />
          <Flat color={s.legColor} />
        </mesh>
        <group position={[0, -thigh, 0]} rotation={[knee, 0, 0]}>
          <mesh position={[0, -shin / 2, 0]} castShadow={castShadow}>
            <boxGeometry args={[legW * 0.9, shin, legW * 0.9]} />
            <Flat color={s.legColor} />
          </mesh>
          {/* white block sneaker, flat on the ground when the leg is under the hip */}
          <group position={[0, -shin, 0]} rotation={[-swing - knee, 0, 0]}>
            <mesh position={[0, -legW * 0.12, legW * 0.55]} castShadow={castShadow}>
              <boxGeometry args={[legW * 1.5, legW * 0.95, legW * 2.6]} />
              <Flat color={SNEAKER} />
            </mesh>
            <mesh position={[0, -legW * 0.5, legW * 0.55]}>
              <boxGeometry args={[legW * 1.56, legW * 0.22, legW * 2.66]} />
              <Flat color={SOLE} />
            </mesh>
          </group>
        </group>
      </group>
    );
  };

  return (
    <group position={position} rotation={[0, yaw + waddle, 0]} scale={scale}>
      {legK > 0.01 ? (
        <>
          {leg(1)}
          {leg(-1)}
        </>
      ) : null}
      <group position={[0, by, 0]} rotation={[-pitch, 0, roll]}>
        {/* front half turns with headYaw; the tail counter-swings */}
        <group rotation={[0, headYaw * 0.6, 0]}>
          <mesh geometry={body} castShadow={castShadow}>
            <meshLambertMaterial vertexColors flatShading />
          </mesh>
          {/* dorsal fin */}
          <mesh geometry={DORSAL} position={[0, s.H * 0.42, -s.L * 0.02]} scale={[1, s.dorsal, s.L * 0.34]} castShadow={castShadow}>
            <Flat color={s.fin} />
          </mesh>
          {/* pectoral fins (flap like arms) */}
          {([1, -1] as const).map((side) => (
            <group key={side} position={[side * s.W * 0.42, -s.H * 0.12, s.L * 0.16]} rotation={[0, side * (0.35 + fins * 0.9), side * (0.25 + fins * 0.5)]}>
              <mesh geometry={PECTORAL} scale={[1, s.H * 0.38, s.L * 0.2]} castShadow={castShadow}>
                <Flat color={s.fin} />
              </mesh>
            </group>
          ))}
          {/* eyes: square, on the sides, angled a little forward */}
          {([1, -1] as const).map((side) => (
            <group key={side} position={[side * s.W * 0.36, s.H * 0.12, headZ]} rotation={[0, side * (Math.PI / 2 - 0.62), 0]}>
              <mesh>
                <boxGeometry args={[s.eye, Math.max(0.004, eh), s.eye * 0.3]} />
                <meshLambertMaterial color="#F4F4F0" flatShading />
              </mesh>
              {blink < 0.6 ? (
                <mesh position={[-side * look[0] * s.eye, look[1] * s.eye * eyeOpen, s.eye * 0.16]}>
                  <boxGeometry args={[s.eye * 0.46, Math.max(0.004, s.eye * 0.52 * Math.min(1, eyeOpen) * (1 - blink)), s.eye * 0.06]} />
                  <meshBasicMaterial color="#1A1A22" />
                </mesh>
              ) : null}
              {brow !== "none" ? (
                <mesh position={[0, eh / 2 + s.eye * 0.22, s.eye * 0.1]} rotation={[0, 0, side * browA]}>
                  <boxGeometry args={[s.eye * 1.2, s.eye * 0.22, s.eye * 0.2]} />
                  <meshLambertMaterial color="#1E1A22" flatShading />
                </mesh>
              ) : null}
            </group>
          ))}
          {/* mouth */}
          {s.teeth ? (
            <group position={[0, -s.H * 0.24, s.L * 0.4]}>
              <mesh>
                <boxGeometry args={[s.W * 0.52, Math.max(0.02, s.H * 0.05 + mouth * s.H * 0.22), s.L * 0.04]} />
                <meshBasicMaterial color="#3A1418" />
              </mesh>
              {Array.from({ length: 9 }, (_, i) => (
                <React.Fragment key={i}>
                  <mesh position={[(i - 4) * s.W * 0.055, s.H * 0.025 + mouth * s.H * 0.1, s.L * 0.022]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[s.W * 0.026, s.H * 0.09, 3]} />
                    <meshLambertMaterial color="#F6F2E6" flatShading />
                  </mesh>
                  {mouth > 0.15 ? (
                    <mesh position={[(i - 4) * s.W * 0.055 + s.W * 0.025, -s.H * 0.025 - mouth * s.H * 0.1, s.L * 0.022]}>
                      <coneGeometry args={[s.W * 0.024, s.H * 0.08, 3]} />
                      <meshLambertMaterial color="#F6F2E6" flatShading />
                    </mesh>
                  ) : null}
                </React.Fragment>
              ))}
            </group>
          ) : (
            <mesh position={[0, -s.H * 0.06, s.L * 0.49]}>
              <boxGeometry args={[s.W * 0.34, Math.max(0.015, s.H * 0.05 + mouth * s.H * 0.18), s.L * 0.03]} />
              <meshBasicMaterial color="#3A1418" />
            </mesh>
          )}
          {s.bill ? (
            <mesh position={[0, -s.H * 0.02, s.L / 2 + s.bill / 2 - 0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow={castShadow}>
              <coneGeometry args={[s.H * 0.09, s.bill, 5]} />
              <Flat color={s.back} />
            </mesh>
          ) : null}
        </group>
        {/* tail */}
        <group position={[0, 0, -s.L * 0.46]} rotation={[0, tailWag - headYaw * 0.3, 0]}>
          <mesh geometry={s.teeth ? TAIL_SHARK : TAIL_FORK} scale={[1, s.tail, s.tail]} castShadow={castShadow}>
            <Flat color={s.fin} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

/** World position of a fish's snout tip (for contact gags), ignoring the walk bob. */
export const snoutAt = (kind: FishKind, position: V3, yaw = 0, scale = 1): V3 => {
  const s = FISH[kind];
  const fwd = (s.L / 2 + (s.bill ?? 0)) * scale;
  return [position[0] + Math.sin(yaw) * fwd, position[1] + bodyY(s) * scale, position[2] + Math.cos(yaw) * fwd];
};

// ---------------------------------------------------------------- the swarm (instanced)

export type Lane = { from: V3; to: V3 };

const UNIT = new THREE.BoxGeometry(1, 1, 1);
const m4 = new THREE.Matrix4();
const base = new THREE.Matrix4();
const part = new THREE.Matrix4();
const v = new THREE.Vector3();
const q = new THREE.Quaternion();
const e = new THREE.Euler();
const sc = new THREE.Vector3();
const tmpC = new THREE.Color();

type SwarmFish = { lane: number; off: number; s0: number; speed: number; kind: FishKind; scale: number; phase: number };

const clamp = (x: number) => Math.max(0, Math.min(1, x));

const angleLerp = (a: number, b: number, k: number) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
};

/**
 * Thousands of walking fish on straight lanes. Each lane holds a file of fish (`rank` abreast, spaced so
 * they never overlap) that loops from `from` to `to`; start a lane under water and they climb out of it.
 * Fish shrink in over the first and last few metres of a lane so nothing pops.
 */
export const FishSwarm: React.FC<{
  lanes: Lane[];
  t: number;
  kinds?: FishKind[];
  /** Fish size multiplier range. */
  size?: [number, number];
  /** Metres between fish along a lane (in units of the largest fish length). */
  gap?: number;
  /** Fish side by side in each lane, and the spacing between them. */
  rank?: number;
  rankGap?: number;
  speed?: [number, number];
  seed?: string;
  /** Frozen: time stops at this lane time. */
  freezeAt?: number;
  /** Heads swing toward a point: k 0..1. */
  turn?: { target: V3; k: number };
  /** Marching in step (all phases equal). */
  march?: boolean;
  /** Fade-in/out length at the lane ends (world units); 0 = none (lane ends hidden off frame). */
  ends?: number;
  /** Distance along the lane over which y goes from `from` to `to` (climbing out of the water); default the whole lane. */
  climb?: number;
  /** No looping: the file starts with its front at this fraction of the lane and advances; fish past either end are hidden. */
  fill?: number;
  castShadow?: boolean;
}> = ({ lanes, t, kinds = ["mackerel", "cod", "salmon", "tuna", "goldfish"], size = [1, 1.25], gap = 1.35, rank = 1, rankGap = 1.0, speed = [1.6, 2.4], seed = "swarm", freezeAt, turn, march = false, ends = 3, climb, fill, castShadow = true }) => {
  const fish = useMemo(() => {
    const out: SwarmFish[] = [];
    const maxL = Math.max(...kinds.map((k) => FISH[k].L + FISH[k].tail * 0.6)) * size[1];
    lanes.forEach((ln, li) => {
      const len = Math.hypot(ln.to[0] - ln.from[0], ln.to[2] - ln.from[2]);
      const spacing = maxL * gap;
      const n = Math.max(1, Math.floor(len / spacing));
      const sp = speed[0] + random(`${seed}v${li}`) * (speed[1] - speed[0]);
      for (let r = 0; r < rank; r++)
        for (let i = 0; i < n; i++) {
          const k = `${seed}${li}:${r}:${i}`;
          out.push({
            lane: li,
            off: (r - (rank - 1) / 2) * rankGap + (random(`${k}x`) - 0.5) * rankGap * 0.25,
            s0: i * (len / n) + (r % 2) * spacing * 0.5 + (random(`${k}z`) - 0.5) * spacing * 0.15,
            speed: sp,
            kind: kinds[Math.floor(random(`${k}k`) * kinds.length)],
            scale: size[0] + random(`${k}s`) * (size[1] - size[0]),
            phase: march ? 0 : random(`${k}p`) * 10,
          });
        }
    });
    return out;
  }, [lanes, kinds, size, gap, rank, rankGap, speed, seed, march]);

  const byKind = useMemo(() => {
    const m = new Map<FishKind, number>();
    for (const f of fish) m.set(f.kind, (m.get(f.kind) ?? 0) + 1);
    return m;
  }, [fish]);
  const kindList = useMemo(() => [...byKind.keys()], [byKind]);
  const bodyRefs = useRef<Record<string, THREE.InstancedMesh | null>>({});
  const refs = {
    fin: useRef<THREE.InstancedMesh>(null),
    dorsal: useRef<THREE.InstancedMesh>(null),
    leg: useRef<THREE.InstancedMesh>(null),
    shoe: useRef<THREE.InstancedMesh>(null),
    eye: useRef<THREE.InstancedMesh>(null),
    pupil: useRef<THREE.InstancedMesh>(null),
    mouth: useRef<THREE.InstancedMesh>(null),
  };
  const tt = freezeAt !== undefined ? Math.min(t, freezeAt) : t;

  useLayoutEffect(() => {
    const idx: Record<string, number> = {};
    const put = (key: string, mesh: THREE.InstancedMesh | null, px: number, py: number, pz: number, sx: number, sy: number, sz: number, rx = 0, ry = 0, color?: string) => {
      if (!mesh) return;
      e.set(rx, ry, 0);
      q.setFromEuler(e);
      part.compose(v.set(px, py, pz), q, sc.set(sx, sy, sz));
      const i = idx[key] ?? 0;
      mesh.setMatrixAt(i, m4.copy(base).multiply(part));
      if (color) mesh.setColorAt(i, tmpC.set(color));
      idx[key] = i + 1;
    };
    for (const f of fish) {
      const ln = lanes[f.lane];
      const dx = ln.to[0] - ln.from[0];
      const dz = ln.to[2] - ln.from[2];
      const len = Math.hypot(dx, dz);
      let s = ((((f.s0 + tt * f.speed) % len) + len) % len);
      let hidden = false;
      if (fill !== undefined) {
        s = fill * len - (len - f.s0) + tt * f.speed;
        hidden = s < 0 || s > len;
      }
      const u = clamp(s / len);
      const nx = -dz / len;
      const nz = dx / len;
      const x = ln.from[0] + dx * u + nx * f.off;
      const z = ln.from[2] + dz * u + nz * f.off;
      const y = ln.from[1] + (ln.to[1] - ln.from[1]) * (climb ? clamp(s / climb) : u);
      const grow = hidden ? 0 : ends > 0 ? Math.min(1, s / ends, (len - s) / ends) : 1;
      const S = FISH[f.kind];
      const k = f.scale * Math.max(0.001, grow);
      let yaw = Math.atan2(dx, dz);
      if (turn && turn.k > 0) yaw = angleLerp(yaw, Math.atan2(turn.target[0] - x, turn.target[2] - z), turn.k);
      const step = (tt * f.speed) / (S.leg * 1.6 * f.scale) + f.phase;
      const sn = Math.sin(step * Math.PI * 2);
      const bob = Math.abs(sn) * 0.07 * S.leg;
      e.set(0, yaw + sn * 0.08, sn * 0.06);
      q.setFromEuler(e);
      base.compose(v.set(x, y, z), q, sc.set(k, k, k));
      const by = S.leg + S.H * 0.36 + bob;
      // body (vertex-coloured per kind)
      const bodyMesh = bodyRefs.current[f.kind];
      put(`b${f.kind}`, bodyMesh ?? null, 0, by, 0, 1, 1, 1);
      // tail + dorsal
      put("fin", refs.fin.current, 0, by, -S.L * 0.46, 1, S.tail * (f.kind === "shark" ? 1 : 1), S.tail, 0, Math.sin(step * Math.PI * 4) * 0.3, S.fin);
      put("dorsal", refs.dorsal.current, 0, by + S.H * 0.42, -S.L * 0.02, 1, S.dorsal, S.L * 0.34, 0, 0, S.fin);
      // legs: one box per leg swinging from the hip, sneaker at the foot
      const legW = Math.max(0.07, S.leg * 0.17);
      for (const side of [1, -1]) {
        const sw = side * sn * 0.5;
        const hx = side * S.W * 0.24;
        put("leg", refs.leg.current, hx + 0, S.leg / 2 + bob * 0.5, S.L * 0.04 + Math.sin(sw) * S.leg * 0.5, legW, S.leg, legW, -sw * 1.0, 0, S.legColor);
        put("shoe", refs.shoe.current, hx, legW * 0.4, S.L * 0.04 + Math.sin(sw) * S.leg + legW * 0.5, legW * 1.5, legW * 0.9, legW * 2.6);
      }
      put("mouth", refs.mouth.current, 0, by - S.H * 0.06, S.L * 0.485, S.W * 0.34, S.H * 0.08, S.L * 0.03);
      // eyes on the sides, angled forward
      for (const side of [1, -1]) {
        const ex = side * S.W * 0.36;
        const ry = side * (Math.PI / 2 - 0.62);
        put("eye", refs.eye.current, ex, by + S.H * 0.12, S.L * 0.3, S.eye, S.eye * 1.15, S.eye * 0.3, 0, ry);
        put("pupil", refs.pupil.current, ex + Math.sin(ry) * S.eye * 0.16, by + S.H * 0.12, S.L * 0.3 + Math.cos(ry) * S.eye * 0.16, S.eye * 0.46, S.eye * 0.52, S.eye * 0.06, 0, ry);
      }
    }
    for (const kind of kindList) {
      const mesh = bodyRefs.current[kind];
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    }
    for (const r of Object.values(refs)) {
      const mesh = r.current;
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });

  const n = fish.length;
  return (
    <group>
      {kindList.map((kind) => (
        <instancedMesh
          key={kind}
          ref={(m) => {
            bodyRefs.current[kind] = m;
          }}
          args={[fishBodyGeometry(kind, 1), undefined, byKind.get(kind) ?? 1]}
          castShadow={castShadow}
          frustumCulled={false}
        >
          <meshLambertMaterial vertexColors flatShading />
        </instancedMesh>
      ))}
      <instancedMesh ref={refs.fin} args={[TAIL_FORK, undefined, n]} castShadow={castShadow} frustumCulled={false}>
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={refs.dorsal} args={[DORSAL, undefined, n]} frustumCulled={false}>
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={refs.leg} args={[UNIT, undefined, n * 2]} castShadow={castShadow} frustumCulled={false}>
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={refs.shoe} args={[UNIT, undefined, n * 2]} frustumCulled={false}>
        <meshLambertMaterial color={SNEAKER} flatShading />
      </instancedMesh>
      <instancedMesh ref={refs.eye} args={[UNIT, undefined, n * 2]} frustumCulled={false}>
        <meshLambertMaterial color="#F4F4F0" flatShading />
      </instancedMesh>
      <instancedMesh ref={refs.pupil} args={[UNIT, undefined, n * 2]} frustumCulled={false}>
        <meshBasicMaterial color="#1A1A22" />
      </instancedMesh>
      <instancedMesh ref={refs.mouth} args={[UNIT, undefined, n]} frustumCulled={false}>
        <meshBasicMaterial color="#3A1418" />
      </instancedMesh>
    </group>
  );
};

/** Lanes helpers. */
export const parallelLanes = (count: number, x0: number, x1: number, z0: number, z1: number, y0 = 0, y1 = 0, seed = "pl", jitter = 0): Lane[] =>
  Array.from({ length: count }, (_, i) => {
    const x = count === 1 ? x0 : x0 + ((x1 - x0) * i) / (count - 1) + (random(`${seed}${i}`) - 0.5) * jitter;
    return { from: [x, y0, z0], to: [x, y1, z1] };
  });

/** Lanes converging on a point from all around (aerial "lines toward the city"). */
export const radialLanes = (count: number, center: V3, rFrom: number, rTo: number, seed = "rl", arc: [number, number] = [0, Math.PI * 2]): Lane[] =>
  Array.from({ length: count }, (_, i) => {
    const a = arc[0] + ((arc[1] - arc[0]) * (i + 0.5)) / count + (random(`${seed}${i}`) - 0.5) * 0.12;
    return {
      from: [center[0] + Math.sin(a) * rFrom, center[1], center[2] + Math.cos(a) * rFrom],
      to: [center[0] + Math.sin(a) * rTo, center[1], center[2] + Math.cos(a) * rTo],
    };
  });
