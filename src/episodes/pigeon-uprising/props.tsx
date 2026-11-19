/**
 * Sets and props for "What If Every Pigeon Got an IQ of 200?" (ep. 8).
 *
 * - `PigeonFlock`: hundreds to thousands of pigeons in one set of instanced meshes, each with its own
 *   pose (walk, peck, flap, flight, head turn, blink, brows). Same proportions as the kit `Bird`, so a
 *   close-up `Bird` and a flock pigeon match. `beakTip()` / `birdHeadAt()` place held props.
 * - Formations on a lattice (`Lattice`): every pigeon owns one lattice column, so pigeons landing,
 *   leaving or standing never share a column and can never pass through each other.
 *   `messageCells()` turns words into lattice cells with a 5×7 pixel font (2×2 pigeons per pixel).
 * - Sets: park (bench, clock, railing), traffic signal with push button, a ×3.5 road junction,
 *   rooftop with a phone grid and network beams, airport apron, military gate, negotiation table,
 *   our own low-poly Trafalgar Square (column, lions, fountains, gallery), a bakery and its shelves.
 * Generic world: no real people, flags or logos. Everything rests on y = 0 using its real extents.
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { Building, BUILDING_COLORS, Car, Ground, Lamp, Road } from "../../slavoski/city";
import { BoxG, chamferBox, CylG, ConeG, IcoG } from "../../slavoski/detail";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { DIM } from "../../slavoski/rig/Hero";
import { sittingPose } from "../../slavoski/room";
import { CANVAS_FONT, CanvasPanel, fitText } from "../../slavoski/screens";
import { LeafyTree } from "../../slavoski/nature";

// ================================================================ instanced pigeons

export type Coat = { body: string; wing: string; head: string; neck: string };
const COATS: Coat[] = [
  { body: "#8C93A6", wing: "#A3AABB", head: "#6E7590", neck: "#4F8C7C" }, // blue bar
  { body: "#767D92", wing: "#8B92A6", head: "#596075", neck: "#4F7E8A" }, // dark
  { body: "#AEB3C0", wing: "#C3C7D2", head: "#8F95A6", neck: "#5E9484" }, // pale
  { body: "#E4E2DC", wing: "#F0EEE8", head: "#D2D0CA", neck: "#B9C4BC" }, // white
  { body: "#8E7E74", wing: "#A39284", head: "#6E6058", neck: "#5E8474" }, // brown
];
/** Pale coats (white, pale grey, light blue-bar) for the birds that form letters, so the words read from the air. */
export const paleCoatFor = (seed: string): Coat => {
  const r = random(seed);
  return r < 0.45 ? COATS[3] : r < 0.85 ? COATS[2] : { body: "#BFC6D6", wing: "#D4D9E4", head: "#A3AABB", neck: "#6FA898" };
};
export const coatFor = (seed: string): Coat => {
  const r = random(seed);
  return COATS[r < 0.55 ? 0 : r < 0.75 ? 1 : r < 0.88 ? 2 : r < 0.95 ? 3 : 4];
};

export type PigeonState = {
  p: V3;
  yaw: number;
  s?: number;
  /** Walk phase (cycles). */
  walk?: number;
  /** 0..1 head down to the ground. */
  peck?: number;
  /** 0..1 wings spread; beats with flapT. */
  flap?: number;
  flapT?: number;
  /** 0..1 in flight: legs tucked, body level. */
  fly?: number;
  headYaw?: number;
  /** + looks up. */
  headPitch?: number;
  /** 1 normal, >1 wide, <1 squint. */
  eyeOpen?: number;
  /** 0..1 eyelids shut. */
  blink?: number;
  /** Brow angle (0.42 angry, 0.12 smug-ish, -0.38 worried); undefined = no brows. */
  brow?: number;
  /** Pupil offset [x, y] in eye widths. */
  look?: [number, number];
  coat?: Coat;
};

const ICO = new THREE.IcosahedronGeometry(1, 1);
const CONE = new THREE.ConeGeometry(1, 1, 5);
const UNIT = new THREE.BoxGeometry(1, 1, 1);

const _m = new THREE.Matrix4();
const _a = new THREE.Matrix4();
const _c = new THREE.Color();

const T = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);
const S = (x: number, y: number, z: number) => new THREE.Matrix4().makeScale(x, y, z);
const R = (x: number, y: number, z: number, order: THREE.EulerOrder = "XYZ") => new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(x, y, z, order));

/** Bird root, body group, neck group and head group matrices (kit `Bird` proportions, pigeon). */
const birdFrames = (b: PigeonState) => {
  const s = b.s ?? 1;
  const peck = b.peck ?? 0;
  const fly = b.fly ?? 0;
  const walk = b.walk ?? 0;
  const bob = walk ? Math.abs(Math.sin(walk * Math.PI * 2)) * 0.025 : 0;
  const root = T(b.p[0], b.p[1], b.p[2]).multiply(R(0, b.yaw, 0)).multiply(S(s, s, s));
  const body = root.clone().multiply(T(0, 0.48 + bob, 0)).multiply(R(0.18 + peck * 0.35 - fly * 0.22, 0, 0));
  const neckPitch = -0.18 - peck * 0.35 + peck * 1.25 - (b.headPitch ?? 0) + fly * 0.2;
  const neck = body.clone().multiply(T(0, 0.21, 0.285)).multiply(R(neckPitch, b.headYaw ?? 0, 0, "YXZ"));
  const head = neck.clone().multiply(T(0, 0.18, 0.07));
  return { root, body, neck, head };
};

/** World position of the beak tip (where a held phone's edge or a baguette goes). */
export const beakTip = (b: PigeonState): V3 => {
  const v = new THREE.Vector3(0, -0.03, 0.31).applyMatrix4(birdFrames(b).head);
  return [v.x, v.y, v.z];
};
/** World position of the head centre (for speech bubbles). */
export const birdHeadAt = (b: PigeonState): V3 => {
  const v = new THREE.Vector3(0, 0, 0).applyMatrix4(birdFrames(b).head);
  return [v.x, v.y, v.z];
};

type Kind = "ico" | "box" | "beak" | "feet" | "white" | "dark";

/**
 * Many pigeons as six instanced meshes. Pass the whole flock's pose for this frame in `birds`.
 * `eyes={false}` drops eyes/pupils/brows (distant flocks).
 */
export const PigeonFlock: React.FC<{ birds: PigeonState[]; shadows?: boolean; eyes?: boolean }> = ({ birds, shadows = true, eyes = true }) => {
  const n = birds.length;
  const refs: Record<Kind, React.RefObject<THREE.InstancedMesh | null>> = {
    ico: useRef<THREE.InstancedMesh>(null),
    box: useRef<THREE.InstancedMesh>(null),
    beak: useRef<THREE.InstancedMesh>(null),
    feet: useRef<THREE.InstancedMesh>(null),
    white: useRef<THREE.InstancedMesh>(null),
    dark: useRef<THREE.InstancedMesh>(null),
  };
  useLayoutEffect(() => {
    const idx: Record<Kind, number> = { ico: 0, box: 0, beak: 0, feet: 0, white: 0, dark: 0 };
    const put = (kind: Kind, base: THREE.Matrix4, local: THREE.Matrix4, color?: string) => {
      const mesh = refs[kind].current;
      if (!mesh) return;
      mesh.setMatrixAt(idx[kind], _m.copy(base).multiply(local));
      if (color) mesh.setColorAt(idx[kind], _c.set(color));
      idx[kind]++;
    };
    const ZERO = S(0.0001, 0.0001, 0.0001);
    for (const b of birds) {
      const coat = b.coat ?? COATS[0];
      const { root, body, neck, head } = birdFrames(b);
      const fly = b.fly ?? 0;
      const walk = b.walk ?? 0;
      const sw = Math.sin(walk * Math.PI * 2);
      // legs (tucked in flight)
      const legK = 1 - 0.75 * fly;
      [1, -1].forEach((sx) => {
        const swing = walk ? 0.4 * sw * sx : 0;
        _a.copy(T(sx * 0.09, 0.24, 0.02)).multiply(R(swing + fly * 0.9, 0, 0)).multiply(T(0, -0.12 * legK, 0)).multiply(S(0.035, 0.24 * legK, 0.035));
        put("feet", root, _a);
      });
      // body, tail
      put("ico", body, S(0.3, 0.3, 0.46), coat.body);
      put("box", body, T(0, 0.075, -0.483).multiply(R(0.25, 0, 0)).multiply(S(0.27, 0.05, 0.32)), coat.head);
      // wings
      const open = (b.flap ?? 0) * (0.9 + 0.5 * Math.sin((b.flapT ?? 0) * Math.PI * 2 * 6));
      [1, -1].forEach((sx) => {
        _a.copy(T(sx * 0.234, 0.09, -0.023)).multiply(R(0.08, 0, sx * (0.06 + open * 1.3))).multiply(T(sx * 0.03, -0.09, -0.092)).multiply(S(0.07, 0.186, 0.377));
        put("ico", body, _a, coat.wing);
      });
      // neck band, head, beak
      put("ico", neck, T(0, 0.02, 0).multiply(S(0.21, 0.21, 0.21)), coat.neck);
      put("ico", head, S(0.2, 0.2, 0.2), coat.head);
      put("beak", head, T(0, -0.03, 0.23).multiply(R(Math.PI / 2, 0, 0)).multiply(S(0.064, 0.16, 0.064)));
      if (eyes) {
        const open1 = (b.eyeOpen ?? 1) * (1 - (b.blink ?? 0) * 0.88);
        const h = 0.115 * open1;
        const [lx, ly] = b.look ?? [0, 0];
        [1, -1].forEach((sx) => {
          put("white", head, T(sx * 0.08, 0.06, 0.184).multiply(S(0.1, Math.max(0.004, h), 0.03)));
          put("dark", head, (b.blink ?? 0) > 0.6 ? ZERO : T(sx * 0.08 + lx * 0.1, 0.06 + ly * 0.1 * Math.min(1, open1), 0.2).multiply(S(0.046, Math.max(0.004, 0.052 * Math.min(1, open1)), 0.008)));
          put("dark", head, b.brow === undefined ? ZERO : T(sx * 0.085, 0.06 + h / 2 + 0.024, 0.196).multiply(R(0, 0, sx * b.brow)).multiply(S(0.115, 0.02, 0.018)));
        });
      }
    }
    for (const k of Object.keys(refs) as Kind[]) {
      const mesh = refs[k].current;
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });
  return (
    <group key={`${n}:${eyes}`}>
      <instancedMesh ref={refs.ico} args={[ICO, undefined, n * 5]} castShadow={shadows} receiveShadow frustumCulled={false}>
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={refs.box} args={[UNIT, undefined, n]} castShadow={shadows} frustumCulled={false}>
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={refs.beak} args={[CONE, undefined, n]} frustumCulled={false}>
        <meshLambertMaterial color="#3A3A44" flatShading />
      </instancedMesh>
      <instancedMesh ref={refs.feet} args={[UNIT, undefined, n * 2]} frustumCulled={false}>
        <meshLambertMaterial color="#D9858A" flatShading />
      </instancedMesh>
      {eyes ? (
        <>
          <instancedMesh ref={refs.white} args={[UNIT, undefined, n * 2]} frustumCulled={false}>
            <meshBasicMaterial color={P.eyeWhite} toneMapped={false} />
          </instancedMesh>
          <instancedMesh ref={refs.dark} args={[UNIT, undefined, n * 4]} frustumCulled={false}>
            <meshBasicMaterial color={P.pupil} toneMapped={false} />
          </instancedMesh>
        </>
      ) : null}
    </group>
  );
};

// ================================================================ lattice formations

/** Lattice spacing: one pigeon per cell (a pigeon is ≈ 0.6 wide with wings closed, 1.3 long). */
export const CELL = { x: 1.0, z: 1.4 };
export const cellKey = (i: number, j: number) => `${i},${j}`;
export const cellPos = (i: number, j: number, y = 0): V3 => [i * CELL.x, y, j * CELL.z];

/** 5×7 pixel glyphs. */
const GLYPH: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
};

/**
 * Lattice cells spelling `lines` (2×2 pigeons per font pixel), centred on cell (0, 0).
 * Line 1 is at −Z, so a camera looking down with up = −Z reads it top to bottom.
 */
export const messageCells = (lines: string[], sub = 2): { i: number; j: number }[] => {
  const out: { i: number; j: number }[] = [];
  const rows = lines.length * 9 - 2;
  const top = -Math.floor(rows / 2);
  lines.forEach((line, li) => {
    const w = line.length * 6 - 1;
    const left = -Math.floor(w / 2);
    [...line].forEach((ch, ci) => {
      const g = GLYPH[ch];
      if (!g) return;
      g.forEach((row, py) =>
        [...row].forEach((px, pxI) => {
          if (px !== "#") return;
          const X = left + ci * 6 + pxI;
          const Y = top + li * 9 + py;
          for (let a = 0; a < sub; a++) for (let b = 0; b < sub; b++) out.push({ i: X * sub + a, j: Y * sub + b });
        }),
      );
    });
  });
  return out;
};

/** Pigeon standing in a lattice cell (with a little seeded jitter in place and heading). */
export const standing = (i: number, j: number, yaw: number, seed: string, extra: Partial<PigeonState> = {}): PigeonState => {
  const k = `${seed}${i},${j}`;
  const [x, , z] = cellPos(i, j);
  return {
    p: [x + (random(`${k}x`) - 0.5) * 0.12, 0, z + (random(`${k}z`) - 0.5) * 0.16],
    yaw: yaw + (random(`${k}y`) - 0.5) * 0.4,
    coat: coatFor(k),
    ...extra,
  };
};

/**
 * Vertical flight in a lattice column: `k` 0 = on the ground … 1 = `height` up. Wings beat and legs
 * tuck while airborne; the landing flares (fast flaps, slow touchdown).
 */
export const columnFlight = (b: PigeonState, k: number, t: number, height = 30): PigeonState => {
  const kk = clamp01(k);
  if (kk <= 0) return b;
  const y = height * kk * kk;
  return { ...b, p: [b.p[0], b.p[1] + y, b.p[2]], flap: 1, flapT: t + b.p[0] * 0.37, fly: clamp01(kk * 4), peck: 0, headPitch: 0.1 };
};

// ================================================================ bread

export const BREAD = { crust: "#C98A44", crumb: "#EBC98E", dark: "#9A6232" };

/** A round bread roll (≈ 0.34 across), resting on y = 0 at its position. */
export const Roll: React.FC<{ position: V3; scale?: number; rotation?: V3 }> = ({ position, scale = 1, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh position={[0, 0.1, 0]} scale={[1, 0.62, 0.86]} castShadow>
      <IcoG args={[0.17, 1]} />
      <Flat color={BREAD.crust} />
    </mesh>
    <mesh position={[0, 0.2, 0]} rotation={[0, 0.4, 0]}>
      <BoxG args={[0.2, 0.02, 0.04]} />
      <Flat color={BREAD.crumb} />
    </mesh>
  </group>
);

/** Crumbs scattered around a point (each resting on y = 0). */
export const Crumbs: React.FC<{ position: V3; count?: number; radius?: number; seed?: string; eaten?: number }> = ({ position, count = 14, radius = 0.7, seed = "crumb", eaten = 0 }) => (
  <group position={position}>
    {Array.from({ length: count }, (_, i) => {
      if (random(`${seed}e${i}`) < eaten) return null;
      const a = random(`${seed}a${i}`) * Math.PI * 2;
      const r = Math.sqrt(random(`${seed}r${i}`)) * radius;
      const s = 0.03 + random(`${seed}s${i}`) * 0.035;
      return (
        <mesh key={i} position={[Math.cos(a) * r, s * 0.7, Math.sin(a) * r]} rotation={[a, a * 2, 0]}>
          <IcoG args={[s, 0]} />
          <Flat color={i % 3 ? BREAD.crumb : BREAD.crust} />
        </mesh>
      );
    })}
  </group>
);

/** A baguette lying along local Z (length `len`), bottom on y = 0. Scored slashes on top. */
export const Baguette: React.FC<{ position: V3; rotation?: V3; len?: number; r?: number }> = ({ position, rotation = [0, 0, 0], len = 1.8, r = 0.13 }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, r, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <CylG args={[r, r, len - r * 2, 7]} />
      <Flat color={BREAD.crust} />
    </mesh>
    {[1, -1].map((sz) => (
      <mesh key={sz} position={[0, r, sz * (len / 2 - r)]} scale={[1, 1, 1.4]} castShadow>
        <IcoG args={[r, 1]} />
        <Flat color={BREAD.crust} />
      </mesh>
    ))}
    {[-0.3, 0, 0.3].map((f) => (
      <mesh key={f} position={[0, r * 1.95, f * len * 0.9]} rotation={[0, 0.5, 0]}>
        <BoxG args={[r * 1.1, 0.02, 0.06]} />
        <Flat color={BREAD.crumb} />
      </mesh>
    ))}
  </group>
);

/** A round loaf (≈ 0.9 across), bottom on y = 0. */
export const Loaf: React.FC<{ position: V3; scale?: number; yaw?: number; color?: string }> = ({ position, scale = 1, yaw = 0, color = BREAD.crust }) => (
  <group position={position} rotation={[0, yaw, 0]} scale={scale}>
    <mesh position={[0, 0.26, 0]} scale={[1, 0.58, 0.8]} castShadow>
      <IcoG args={[0.45, 1]} />
      <Flat color={color} />
    </mesh>
    {[-0.15, 0.15].map((x) => (
      <mesh key={x} position={[x, 0.51, 0]} rotation={[0, 0.2, 0]}>
        <BoxG args={[0.05, 0.02, 0.4]} />
        <Flat color={BREAD.crumb} />
      </mesh>
    ))}
  </group>
);

// ================================================================ park

const _sit = sittingPose();
/** Top of a seat that a `sittingPose()` hero sits on (his thighs rest on it). */
export const SEAT_TOP = DIM.hipY + _sit.bob - DIM.legD / 2 - 0.01;
/** How far in front of the backrest the hero's root sits (hips just in front of the backrest). */
export const BENCH = { w: 5.2, depth: 1.5, backGap: 0.5 };

/**
 * A park bench facing +Z. The hero sits with his root at (x, 0, z) of the bench `position`
 * (hips there, thighs forward along +Z over the seat, back 0.5 in front of the backrest).
 */
export const Bench: React.FC<{ position: V3; yaw?: number; w?: number }> = ({ position, yaw = 0, w = BENCH.w }) => {
  const seatZ0 = -BENCH.backGap; // back edge of the seat (backrest plane)
  const slat = "#8A5A36";
  const iron = "#24302A";
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, SEAT_TOP - 0.05, seatZ0 + 0.2 + i * 0.36]} castShadow receiveShadow>
          <BoxG args={[w, 0.1, 0.3]} />
          <Flat color={slat} />
        </mesh>
      ))}
      {[0, 1].map((i) => (
        <mesh key={`b${i}`} position={[0, SEAT_TOP + 0.55 + i * 0.5, seatZ0 - 0.06]} rotation={[-0.12, 0, 0]} castShadow>
          <BoxG args={[w, 0.34, 0.08]} />
          <Flat color={slat} />
        </mesh>
      ))}
      {[-w / 2 + 0.35, w / 2 - 0.35].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, (SEAT_TOP - 0.1) / 2, seatZ0 + 1.2]} castShadow>
            <BoxG args={[0.12, SEAT_TOP - 0.1, 0.12]} />
            <Flat color={iron} />
          </mesh>
          <mesh position={[0, (SEAT_TOP + 1.2) / 2, seatZ0 - 0.12]} rotation={[-0.08, 0, 0]} castShadow>
            <BoxG args={[0.12, SEAT_TOP + 1.2, 0.12]} />
            <Flat color={iron} />
          </mesh>
          <mesh position={[0, SEAT_TOP + 0.35, seatZ0 + 0.7]} castShadow>
            <BoxG args={[0.1, 0.08, 1.5]} />
            <Flat color={iron} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** A park clock on a post: two faces (±Z), hands at `hours` (e.g. 8.99 → 8:59). Face centre y = 7.6. */
export const CLOCK_Y = 7.6;
export const ParkClock: React.FC<{ position: V3; hours: number; yaw?: number }> = ({ position, hours, yaw = 0 }) => {
  const green = "#1F4A3A";
  const minA = -((hours % 1) * Math.PI * 2);
  const hourA = -(((hours % 12) / 12) * Math.PI * 2);
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, CLOCK_Y / 2 - 0.4, 0]} castShadow>
        <CylG args={[0.16, 0.24, CLOCK_Y - 0.8, 8]} />
        <Flat color={green} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <CylG args={[0.45, 0.55, 0.6, 8]} />
        <Flat color={green} />
      </mesh>
      <mesh position={[0, CLOCK_Y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <CylG args={[1.12, 1.12, 0.42, 20]} />
        <Flat color={green} />
      </mesh>
      <mesh position={[0, CLOCK_Y + 1.25, 0]} castShadow>
        <ConeG args={[0.32, 0.5, 8]} />
        <Flat color={P.amber} />
      </mesh>
      {[1, -1].map((side) => (
        <group key={side} position={[0, CLOCK_Y, side * 0.215]} rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
          <mesh position={[0, 0, 0.002]}>
            <circleGeometry args={[0.96, 32]} />
            <meshBasicMaterial color="#F4F0E4" toneMapped={false} />
          </mesh>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const big = i % 3 === 0;
            return (
              <mesh key={i} position={[Math.sin(a) * 0.8, Math.cos(a) * 0.8, 0.01]} rotation={[0, 0, -a]}>
                <boxGeometry args={[big ? 0.08 : 0.04, big ? 0.2 : 0.12, 0.01]} />
                <meshBasicMaterial color="#1A1A22" toneMapped={false} />
              </mesh>
            );
          })}
          <group rotation={[0, 0, hourA]} position={[0, 0, 0.03]}>
            <mesh position={[0, 0.24, 0]}>
              <boxGeometry args={[0.1, 0.56, 0.02]} />
              <meshBasicMaterial color="#1A1A22" toneMapped={false} />
            </mesh>
          </group>
          <group rotation={[0, 0, minA]} position={[0, 0, 0.05]}>
            <mesh position={[0, 0.34, 0]}>
              <boxGeometry args={[0.06, 0.8, 0.02]} />
              <meshBasicMaterial color="#1A1A22" toneMapped={false} />
            </mesh>
          </group>
          <mesh position={[0, 0, 0.07]}>
            <circleGeometry args={[0.07, 10]} />
            <meshBasicMaterial color={P.carRed} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** A park: grass, a paved path along X (z ∈ [-2, 2]), trees, lamps and a town skyline behind. */
export const Park: React.FC<{ seed?: string; trees?: boolean; skyline?: boolean }> = ({ seed = "park", trees = true, skyline = true }) => (
  <group>
    <Ground color="#4F8A46" />
    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[400, 4.6]} />
      <Flat color="#C9B894" />
    </mesh>
    {trees
      ? Array.from({ length: 14 }, (_, i) => {
          const x = -70 + i * 11 + (random(`${seed}tx${i}`) - 0.5) * 4;
          const z = -12 - random(`${seed}tz${i}`) * 26;
          return <LeafyTree key={i} position={[x, 0, z]} scale={2.6 + random(`${seed}ts${i}`) * 1.2} seed={`${seed}t${i}`} />;
        })
      : null}
    {skyline
      ? Array.from({ length: 16 }, (_, i) => {
          const x = -120 + i * 16;
          const h = 18 + random(`${seed}h${i}`) * 34;
          return <Building key={i} position={[x, 0, -78 - (i % 3) * 8]} w={12} d={10} h={h} color={BUILDING_COLORS[i % 5]} seed={`${seed}b${i}`} power={0.25} />;
        })
      : null}
  </group>
);

/** A park railing along X at z (top rail y = RAIL_TOP), from x0 to x1. Pigeons perch on the top rail. */
export const RAIL_TOP = 2.3;
export const Railing: React.FC<{ x0: number; x1: number; z: number }> = ({ x0, x1, z }) => (
  <group>
    {Array.from({ length: Math.floor((x1 - x0) / 2.4) + 1 }, (_, i) => (
      <mesh key={i} position={[x0 + i * 2.4, RAIL_TOP / 2, z]} castShadow>
        <BoxG args={[0.14, RAIL_TOP, 0.14]} />
        <Flat color="#24302A" />
      </mesh>
    ))}
    {[RAIL_TOP - 0.06, 1.0].map((y) => (
      <mesh key={y} position={[(x0 + x1) / 2, y, z]} castShadow>
        <BoxG args={[x1 - x0, 0.12, 0.16]} />
        <Flat color="#2E3C34" />
      </mesh>
    ))}
  </group>
);

/** A takeaway coffee cup (≈ 0.36 tall), centre-bottom at the origin. */
export const Cup: React.FC<{ position: V3 }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 0.18, 0]} castShadow>
      <CylG args={[0.12, 0.09, 0.36, 8]} />
      <Flat color="#F2EEE6" />
    </mesh>
    <mesh position={[0, 0.37, 0]}>
      <CylG args={[0.13, 0.13, 0.04, 8]} />
      <Flat color="#3A2A22" />
    </mesh>
    <mesh position={[0, 0.17, 0]}>
      <CylG args={[0.115, 0.1, 0.12, 8]} />
      <Flat color={P.carRed} />
    </mesh>
  </group>
);

// ================================================================ traffic

export type SignalState = "green" | "amber" | "red";
/** A traffic signal (base y = 0, head facing +Z, head lamps y ≈ 7.5–9.3) with a pedestrian push button. */
export const SIGNAL = { buttonY: 3.3, buttonTop: 3.3 + 0.42, headY: 8.4 };
export const Signal: React.FC<{ position: V3; yaw?: number; state: SignalState; button?: boolean; pressed?: boolean }> = ({ position, yaw = 0, state, button = true, pressed = false }) => {
  const lamps: [string, boolean][] = [
    ["#FF4A3A", state === "red"],
    [P.amber, state === "amber"],
    ["#45E08A", state === "green"],
  ];
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, 4.5, 0]} castShadow>
        <CylG args={[0.18, 0.22, 9, 6]} />
        <Flat color="#2B2F3E" />
      </mesh>
      <mesh position={[0, SIGNAL.headY, 0.4]} castShadow>
        <BoxG args={[1.1, 3.0, 0.6]} />
        <Flat color="#15161C" />
      </mesh>
      {lamps.map(([col, on], i) => (
        <group key={i} position={[0, SIGNAL.headY + 0.92 - i * 0.92, 0.72]}>
          <mesh>
            <circleGeometry args={[0.32, 12]} />
            {on ? <Glow color={col} /> : <Flat color="#2A2A30" />}
          </mesh>
          <mesh position={[0, 0.38, 0.14]}>
            <boxGeometry args={[0.76, 0.05, 0.3]} />
            <Flat color="#15161C" />
          </mesh>
          {on ? <Halo size={2.6} color={col} opacity={0.6} /> : null}
        </group>
      ))}
      {button ? (
        <group position={[0, SIGNAL.buttonY, 0.32]}>
          <mesh castShadow>
            <BoxG args={[0.5, 0.84, 0.26]} />
            <Flat color={P.amber} />
          </mesh>
          <mesh position={[0, -0.12, 0.14 - (pressed ? 0.03 : 0)]}>
            <CylG args={[0.1, 0.1, 0.06, 10]} />
            <Flat color="#E8E4DA" />
          </mesh>
          <mesh position={[0, 0.2, 0.135]}>
            <planeGeometry args={[0.32, 0.18]} />
            <Glow color={pressed ? "#FF4A3A" : "#3A1A18"} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

/**
 * A road junction at kit scale (wrap in a ×3.5 group for hero scale): roads along X and Z (width 7)
 * crossing at the origin, kerbs, zebra crossings, and buildings along all four arms.
 */
export const Junction: React.FC<{ seed?: string; length?: number; power?: number }> = ({ seed = "jn", length = 70, power = 0.4 }) => {
  const specs = useMemo(() => {
    const out: { key: string; position: V3; w: number; d: number; h: number; color: string }[] = [];
    // N/S arms carry the corner lots; E/W arms start one lot further out so corners never overlap.
    for (const arm of ["n", "s", "e", "w"] as const) {
      for (const side of [1, -1]) {
        let u = arm === "n" || arm === "s" ? 6.4 : 11.5;
        let i = 0;
        while (u < length) {
          const k = `${seed}${arm}${side}${i}`;
          const w = 3.4 + random(`${k}w`) * 1.4;
          const d = 3.6 + random(`${k}d`) * 1.6;
          const h = 7 + random(`${k}h`) * 10;
          const along = u + d / 2;
          const across = side * (6.1 + 0.3 + w / 2);
          const pos: V3 = arm === "n" ? [across, 0, -along] : arm === "s" ? [across, 0, along] : arm === "e" ? [along, 0, across] : [-along, 0, across];
          const [bw, bd] = arm === "n" || arm === "s" ? [w, d] : [d, w];
          out.push({ key: k, position: pos, w: bw, d: bd, h, color: BUILDING_COLORS[Math.floor(random(`${k}c`) * BUILDING_COLORS.length)] });
          u += d + 0.5 + random(`${k}g`) * 0.6;
          i++;
        }
      }
    }
    return out;
  }, [seed, length]);
  return (
    <group>
      <Ground />
      <Road width={7} length={length * 2} />
      <Road width={7} length={length * 2} yaw={Math.PI / 2} position={[0, 0.002, 0]} dashes={false} />
      {/* kerbs: four corner pavements */}
      {[1, -1].map((sx) =>
        [1, -1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (3.5 + length / 2), 0.06, sz * (3.5 + length / 2)]} receiveShadow>
            <BoxG args={[length, 0.12, length]} />
            <Flat color={P.pavement} />
          </mesh>
        )),
      )}
      {/* zebra crossings on all four arms */}
      {[0, 1, 2, 3].map((a) => (
        <group key={a} rotation={[0, (a * Math.PI) / 2, 0]}>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} position={[-2.9 + i * 1.16, 0.012, -4.6]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.6, 1.7]} />
              <Flat color="#E8E4DA" />
            </mesh>
          ))}
        </group>
      ))}
      {specs.map(({ key, ...s }) => (
        <Building key={key} {...s} seed={key} power={power} />
      ))}
    </group>
  );
};

// ================================================================ rooftop + network

/** A flat roof (top y = 0) with a parapet, vents, a water tank and a stair hut. 30 × 22. */
export const Rooftop: React.FC<{ w?: number; d?: number; color?: string }> = ({ w = 30, d = 22, color = "#6A6E78" }) => (
  <group>
    <mesh position={[0, -20, 0]} receiveShadow castShadow>
      <BoxG args={[w, 40, d]} />
      <Flat color={P.bldgSlate} />
    </mesh>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[w - 0.2, 0.1, d - 0.2]} />
      <Flat color={color} />
    </mesh>
    {[
      [0, -d / 2, w, 0.4],
      [0, d / 2, w, 0.4],
      [-w / 2, 0, 0.4, d],
      [w / 2, 0, 0.4, d],
    ].map(([x, z, pw, pd], i) => (
      <mesh key={i} position={[x, 0.6, z]} castShadow receiveShadow>
        <BoxG args={[pw, 1.2, pd]} />
        <Flat color="#59606C" />
      </mesh>
    ))}
    <mesh position={[-w / 2 + 4, 2.2, -d / 2 + 3.5]} castShadow>
      <BoxG args={[5, 4.4, 4]} />
      <Flat color="#4A505C" />
    </mesh>
    <group position={[w / 2 - 4, 0, -d / 2 + 4]}>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
        <mesh key={`${sx}${sz}`} position={[sx * 1.1, 1.5, sz * 1.1]} castShadow>
          <BoxG args={[0.2, 3, 0.2]} />
          <Flat color="#2B2F3E" />
        </mesh>
      ))}
      <mesh position={[0, 4.6, 0]} castShadow>
        <CylG args={[1.7, 1.7, 3.2, 10]} />
        <Flat color="#7A5A44" />
      </mesh>
      <mesh position={[0, 6.6, 0]} castShadow>
        <ConeG args={[1.8, 0.8, 10]} />
        <Flat color="#5A4232" />
      </mesh>
    </group>
    {[-6, -2, 2].map((x) => (
      <mesh key={x} position={[x, 0.5, d / 2 - 3]} castShadow>
        <BoxG args={[2.2, 1.0, 1.6]} />
        <Flat color="#9AA0AA" />
      </mesh>
    ))}
  </group>
);

/** A phone lying flat, screen up (screen 0.36 × 0.74), on y = 0. */
export const FlatPhone: React.FC<{ position: V3; yaw?: number; glow?: string; on?: boolean }> = ({ position, yaw = 0, glow = "#8FB3D9", on = true }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.025, 0]} castShadow>
      <BoxG args={[0.42, 0.05, 0.84]} />
      <Flat color="#15161C" />
    </mesh>
    <mesh position={[0, 0.052, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.36, 0.74]} />
      {on ? <Glow color={glow} /> : <Flat color="#22252E" />}
    </mesh>
  </group>
);

const SCREEN_COLS = ["#8FB3D9", "#E0B04E", "#7FD6A0", "#B58CFF", "#6FB8FF", "#F49A5C"];
export const screenColor = (seed: string) => SCREEN_COLS[Math.floor(random(seed) * SCREEN_COLS.length)];

/** A glowing arc between two points (a network link) with data pulses travelling along it. */
export const Beam: React.FC<{ from: V3; to: V3; lift?: number; t: number; color?: string; grow?: number; seed?: string; radius?: number }> = ({ from, to, lift = 12, t, color = P.amber, grow = 1, seed = "beam", radius = 0.45 }) => {
  const curve = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const m = a.clone().lerp(b, 0.5);
    m.y += lift;
    return new THREE.QuadraticBezierCurve3(a, m, b);
  }, [from, to, lift]);
  const g = clamp01(grow);
  // the tube grows from `from` toward `to`
  const geo = useMemo(() => {
    const n = Math.max(2, Math.round(40 * g));
    const pts = Array.from({ length: n + 1 }, (_, i) => curve.getPoint((i / n) * Math.max(0.02, g)));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, radius, 6, false);
  }, [curve, g, radius]);
  if (g <= 0) return null;
  const off = random(seed);
  return (
    <group>
      <mesh geometry={geo}>
        <Glow color={color} opacity={0.9} additive />
      </mesh>
      {[0, 1, 2].map((i) => {
        const u = (t * 0.6 + off + i / 3) % 1;
        if (u > g) return null;
        const p = curve.getPoint(u);
        return (
          <group key={i} position={[p.x, p.y, p.z]}>
            <mesh>
              <IcoG args={[radius * 2.2, 1]} />
              <Glow color="#FFF2D0" />
            </mesh>
            <Halo size={radius * 16} color={color} opacity={0.8} />
          </group>
        );
      })}
    </group>
  );
};

// ================================================================ airport

/** An airliner on the apron (kit Plane ×4 with landing gear). Nose +Z. Wing top y = PLANE_AT.wingTop. */
export const PLANE_AT = { s: 4, y: 4.6, wingTop: 4.6 + (-0.1 + 0.07) * 4, roofY: 4.6 + 0.5 * 4 };
export const LandingGear: React.FC = () => (
  <group>
    {[
      [0, 13.5],
      [-2.4, 0.4],
      [2.4, 0.4],
    ].map(([x, z], i) => (
      <group key={i} position={[x, 0, z]}>
        <mesh position={[0, PLANE_AT.y / 2, 0]} castShadow>
          <CylG args={[0.18, 0.18, PLANE_AT.y - 1, 6]} />
          <Flat color="#8E96A6" />
        </mesh>
        <mesh position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <CylG args={[0.55, 0.55, 0.8, 10]} />
          <Flat color="#1A1A22" />
        </mesh>
      </group>
    ))}
  </group>
);

/** Apron + runway markings + terminal + control tower. Apron is y = 0. */
export const Airport: React.FC<{ seed?: string }> = ({ seed = "apt" }) => (
  <group>
    <Ground color="#6E737C" />
    {Array.from({ length: 10 }, (_, i) => (
      <mesh key={i} position={[-30, 0.01, 40 - i * 14]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 7]} />
        <Flat color="#E0B04E" />
      </mesh>
    ))}
    <mesh position={[0, 0.008, -10]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[20, 20.5, 40, 1, Math.PI * 0.1, Math.PI * 0.8]} />
      <Flat color="#E0B04E" />
    </mesh>
    {/* terminal: long low glass block */}
    <mesh position={[0, 6, -70]} castShadow receiveShadow>
      <BoxG args={[160, 12, 20]} />
      <Flat color="#566270" />
    </mesh>
    <mesh position={[0, 6.5, -59.9]}>
      <planeGeometry args={[150, 7]} />
      <Glow color="#2E4A64" />
    </mesh>
    <mesh position={[0, 12.6, -70]} castShadow>
      <BoxG args={[164, 1.2, 24]} />
      <Flat color="#C9C2B4" />
    </mesh>
    {/* control tower */}
    <group position={[54, 0, -50]}>
      <mesh position={[0, 18, 0]} castShadow>
        <CylG args={[2, 3, 36, 10]} />
        <Flat color="#C9C2B4" />
      </mesh>
      <mesh position={[0, 38.5, 0]} castShadow>
        <CylG args={[6, 4.2, 5, 10]} />
        <Flat color="#2E4A64" />
      </mesh>
      <mesh position={[0, 41.6, 0]} castShadow>
        <CylG args={[6.4, 6.4, 1.2, 10]} />
        <Flat color="#C9C2B4" />
      </mesh>
    </group>
    {Array.from({ length: 6 }, (_, i) => (
      <Building key={i} position={[-150 + i * 60, 0, -140]} w={30} d={20} h={20 + random(`${seed}${i}`) * 30} color={BUILDING_COLORS[i % 5]} seed={`${seed}${i}`} power={0.3} />
    ))}
  </group>
);

// ================================================================ military gate (no weapons)

const OLIVE = "#4E5A3A";
/** A generic olive army truck (≈ 13 long at hero scale), nose +Z, wheels on y = 0. */
export const ArmyTruck: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 3.0, 3.8]} castShadow>
      <BoxG args={[4.4, 3.4, 3.4]} />
      <Flat color={OLIVE} />
    </mesh>
    <mesh position={[0, 3.6, 5.52]}>
      <planeGeometry args={[3.6, 1.3]} />
      <Glow color="#2A3A4A" />
    </mesh>
    <mesh position={[0, 2.0, -2.0]} castShadow>
      <BoxG args={[4.6, 1.2, 8.4]} />
      <Flat color="#3E4830" />
    </mesh>
    <mesh position={[0, 4.4, -2.0]} castShadow>
      <BoxG args={[4.5, 3.0, 8.2]} />
      <Flat color="#6A7250" />
    </mesh>
    {[4.2, -0.8, -4.2].map((z) =>
      [1, -1].map((sx) => (
        <mesh key={`${z}${sx}`} position={[sx * 2.2, 1.0, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <CylG args={[1.0, 1.0, 0.8, 12]} />
          <Flat color="#1A1A1E" />
        </mesh>
      )),
    )}
  </group>
);

/** A base gate across a road along Z at z = 0: fence with wire, a barrier, a guard booth, a watchtower and sandbags. */
export const BaseGate: React.FC<{ barrier?: number }> = ({ barrier = 0 }) => (
  <group>
    <Ground color="#5E6450" />
    <Road width={20} length={200} />
    {[1, -1].map((side) => (
      <group key={side}>
        {Array.from({ length: 22 }, (_, i) => (
          <mesh key={i} position={[side * (13 + i * 4), 3, 0]} castShadow>
            <BoxG args={[0.25, 6, 0.25]} />
            <Flat color="#5A5E66" />
          </mesh>
        ))}
        <mesh position={[side * (13 + 42), 3, 0]}>
          <planeGeometry args={[84, 6]} />
          <meshLambertMaterial color="#9AA0AA" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh position={[side * (13 + 42), 6.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <CylG args={[0.35, 0.35, 84, 6]} />
          <meshLambertMaterial color="#B8BCC6" wireframe />
        </mesh>
      </group>
    ))}
    {/* barrier arm pivots at x = -10 */}
    <group position={[-10.5, 2.4, 0]} rotation={[0, 0, barrier * 1.3]}>
      <mesh position={[10.2, 0, 0]} castShadow>
        <BoxG args={[20.4, 0.36, 0.36]} />
        <Flat color="#E8E4DA" />
      </mesh>
      {[2, 6, 10, 14, 18].map((x) => (
        <mesh key={x} position={[x, 0, 0.19]}>
          <planeGeometry args={[1.6, 0.36]} />
          <Flat color={P.carRed} />
        </mesh>
      ))}
    </group>
    <mesh position={[-10.5, 1.2, 0]} castShadow>
      <BoxG args={[1.0, 2.4, 1.0]} />
      <Flat color="#3A3E48" />
    </mesh>
    {/* guard booth */}
    <group position={[-15, 0, 4]}>
      <mesh position={[0, 3.4, 0]} castShadow>
        <BoxG args={[4.4, 6.8, 4.4]} />
        <Flat color="#C9C2B4" />
      </mesh>
      <mesh position={[0, 4.4, 2.22]}>
        <planeGeometry args={[3.2, 2.0]} />
        <Glow color="#E0D0A0" />
      </mesh>
      <mesh position={[0, 7.0, 0]} castShadow>
        <BoxG args={[5.2, 0.4, 5.2]} />
        <Flat color={OLIVE} />
      </mesh>
    </group>
    {/* watchtower */}
    <group position={[24, 0, -10]}>
      {[[-2, -2], [2, -2], [-2, 2], [2, 2]].map(([sx, sz]) => (
        <mesh key={`${sx}${sz}`} position={[sx, 9, sz]} castShadow>
          <BoxG args={[0.4, 18, 0.4]} />
          <Flat color="#4A4E58" />
        </mesh>
      ))}
      <mesh position={[0, 20, 0]} castShadow>
        <BoxG args={[6, 4, 6]} />
        <Flat color={OLIVE} />
      </mesh>
      <mesh position={[0, 22.6, 0]} castShadow>
        <ConeG args={[5, 2, 4]} />
        <Flat color="#3E4830" />
      </mesh>
      <Halo position={[0, 20, 3.2]} size={4} color="#FFF2D0" opacity={0.5} />
    </group>
    {/* sandbags */}
    {[-1, 1].map((side) =>
      Array.from({ length: 3 }, (_, r) =>
        Array.from({ length: 5 - r }, (_, i) => (
          <mesh key={`${side}${r}${i}`} position={[side * (16 + i * 1.5 + r * 0.75), 0.4 + r * 0.7, 6]} scale={[1, 0.6, 0.7]} castShadow>
            <IcoG args={[0.9, 1]} />
            <Flat color="#A89870" />
          </mesh>
        )),
      ),
    )}
  </group>
);

// ================================================================ negotiation

/** A summit table along X (top y = TABLE_TOP) with microphones; officials sit at z < 0, the pigeon side is z > 0. */
export const TABLE_TOP = SEAT_TOP + 1.05;
export const SummitTable: React.FC<{ w?: number }> = ({ w = 16 }) => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[60, 0.1, 60]} />
      <Flat color="#3A2E34" />
    </mesh>
    <mesh position={[0, 7, -9]} receiveShadow>
      <BoxG args={[60, 14, 0.4]} />
      <Flat color="#2E3448" />
    </mesh>
    {[-14, -6, 2, 10].map((x) => (
      <mesh key={x} position={[x, 6.5, -8.78]}>
        <planeGeometry args={[5.2, 8]} />
        <Glow color="#1A2638" />
      </mesh>
    ))}
    <mesh position={[0, TABLE_TOP - 0.08, 0]} castShadow receiveShadow>
      <BoxG args={[w, 0.16, 3.6]} />
      <Flat color="#5A3E2E" />
    </mesh>
    <mesh position={[0, (TABLE_TOP - 0.16) / 2, 0]} castShadow>
      <BoxG args={[w - 1, TABLE_TOP - 0.16, 2.4]} />
      <Flat color="#4A3428" />
    </mesh>
    {[-4.8, 0, 4.8].map((x) => (
      <group key={x} position={[x, TABLE_TOP, -0.9]}>
        <mesh position={[0, 0.04, 0]}>
          <CylG args={[0.18, 0.2, 0.08, 8]} />
          <Flat color="#15161C" />
        </mesh>
        <mesh position={[0, 0.4, 0.15]} rotation={[0.4, 0, 0]}>
          <CylG args={[0.025, 0.025, 0.8, 4]} />
          <Flat color="#15161C" />
        </mesh>
        <mesh position={[0, 0.76, 0.32]}>
          <IcoG args={[0.07, 1]} />
          <Glow color="#FF4A3A" />
        </mesh>
      </group>
    ))}
    <pointLight position={[0, 9, 3]} color="#FFE2B8" intensity={30} distance={26} decay={2} />
  </group>
);

/** Interpreter headset on a head (centre `head`, hero yaw): a band over the crown and two ear cups. */
export const Headset: React.FC<{ head: V3; yaw?: number; roll?: number }> = ({ head, yaw = 0, roll = 0 }) => (
  <group position={head} rotation={[0, yaw, roll, "YXZ"]}>
    <mesh position={[0, 0.06, 0]} rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[DIM.headR + 0.1, 0.05, 5, 16, Math.PI]} />
      <Flat color="#15161C" />
    </mesh>
    {[1, -1].map((sx) => (
      <mesh key={sx} position={[sx * (DIM.headR + 0.1), 0.0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <CylG args={[0.22, 0.22, 0.16, 10]} />
        <Flat color="#2B2F3E" />
      </mesh>
    ))}
    <mesh position={[-(DIM.headR + 0.05), -0.32, 0.3]} rotation={[0.9, 0, 0]}>
      <CylG args={[0.025, 0.025, 0.7, 4]} />
      <Flat color="#15161C" />
    </mesh>
  </group>
);

/** An umbrella held by a fist at `hand`: shaft straight up, canopy centred `rise` above the fist. */
export const Umbrella: React.FC<{ hand: V3; rise?: number; color?: string; tilt?: number }> = ({ hand, rise = 3.2, color = "#1A1E2A", tilt = 0 }) => (
  <group position={hand} rotation={[0, 0, tilt]}>
    <mesh position={[0, rise / 2, 0]}>
      <CylG args={[0.035, 0.035, rise + 0.4, 5]} />
      <Flat color="#2A2A30" />
    </mesh>
    <mesh position={[0, rise, 0]} castShadow>
      <ConeG args={[2.1, 0.8, 8, 1, true]} />
      <meshLambertMaterial color={color} flatShading side={THREE.DoubleSide} />
    </mesh>
  </group>
);

// ================================================================ Trafalgar Square (our own low-poly take)

export const SQUARE = { column: [0, 0, 56] as V3, colH: 44, plinth: 6.6, fountainX: 60, fountainZ: -6, gallery: -64, terrace: -50 };
const STONE = "#CFC6B2";
const STONE_SHADE = "#A89E8A";
const BRONZE = "#2E3134";

/** A lying lion (bronze), ≈ 6.4 long, facing +Z, on y = 0. */
export const Lion: React.FC<{ position: V3; yaw?: number; scale?: number }> = ({ position, yaw = 0, scale = 1 }) => (
  <group position={position} rotation={[0, yaw, 0]} scale={scale}>
    <mesh position={[0, 1.1, -0.6]} castShadow>
      <primitive object={chamferBox(2.0, 1.7, 4.0)} attach="geometry" />
      <Flat color={BRONZE} />
    </mesh>
    <mesh position={[0, 1.1, -2.5]} scale={[1.1, 1, 1]} castShadow>
      <IcoG args={[1.05, 1]} />
      <Flat color={BRONZE} />
    </mesh>
    {/* mane + head */}
    <mesh position={[0, 2.25, 1.3]} castShadow>
      <IcoG args={[1.3, 1]} />
      <Flat color="#25282B" />
    </mesh>
    <mesh position={[0, 2.15, 2.25]} castShadow>
      <primitive object={chamferBox(1.1, 1.1, 1.0)} attach="geometry" />
      <Flat color={BRONZE} />
    </mesh>
    {/* front paws stretched forward */}
    {[0.55, -0.55].map((x) => (
      <mesh key={x} position={[x, 0.3, 2.3]} castShadow>
        <primitive object={chamferBox(0.55, 0.6, 2.4)} attach="geometry" />
        <Flat color={BRONZE} />
      </mesh>
    ))}
    <mesh position={[0, 0.5, -4.0]} rotation={[0.3, 0, 0]} castShadow>
      <CylG args={[0.12, 0.12, 1.6, 5]} />
      <Flat color={BRONZE} />
    </mesh>
  </group>
);

/** The column: steps, plinth with four lions, fluted shaft, capital and a small generic statue. */
export const Column: React.FC<{ position?: V3 }> = ({ position = SQUARE.column }) => {
  const pl = SQUARE.plinth;
  const top = 3.2 + pl;
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.4 + i * 0.8, 0]} castShadow receiveShadow>
          <BoxG args={[34 - i * 3, 0.8, 34 - i * 3]} />
          <Flat color={i % 2 ? STONE : STONE_SHADE} />
        </mesh>
      ))}
      <mesh position={[0, 2.4 + pl / 2, 0]} castShadow receiveShadow>
        <BoxG args={[9, pl, 9]} />
        <Flat color={STONE} />
      </mesh>
      {[0, 1, 2, 3].map((a) => (
        <mesh key={a} position={[Math.sin((a * Math.PI) / 2) * 4.51, 2.4 + pl / 2, Math.cos((a * Math.PI) / 2) * 4.51]} rotation={[0, (a * Math.PI) / 2, 0]}>
          <planeGeometry args={[5.4, pl * 0.6]} />
          <Flat color={BRONZE} />
        </mesh>
      ))}
      {/* lions on low pedestals, one per side, facing out */}
      {[0, 1, 2, 3].map((a) => {
        const yaw = (a * Math.PI) / 2;
        const r = 12.5;
        return (
          <group key={`l${a}`} position={[Math.sin(yaw) * r, 2.4, Math.cos(yaw) * r]} rotation={[0, yaw, 0]}>
            <mesh position={[0, 0.7, -0.5]} castShadow receiveShadow>
              <BoxG args={[3.6, 1.4, 8]} />
              <Flat color={STONE_SHADE} />
            </mesh>
            <Lion position={[0, 1.4, -0.6]} />
          </group>
        );
      })}
      <mesh position={[0, top + 1.2, 0]} castShadow>
        <BoxG args={[5.6, 2.4, 5.6]} />
        <Flat color={STONE_SHADE} />
      </mesh>
      <mesh position={[0, top + 2.4 + SQUARE.colH / 2, 0]} castShadow>
        <CylG args={[1.45, 1.75, SQUARE.colH, 16]} />
        <Flat color={STONE} />
      </mesh>
      <mesh position={[0, top + 2.4 + SQUARE.colH + 0.8, 0]} castShadow>
        <BoxG args={[4.2, 1.6, 4.2]} />
        <Flat color={BRONZE} />
      </mesh>
      {/* the statue: a plain standing figure with a cocked hat */}
      <group position={[0, top + 2.4 + SQUARE.colH + 1.6, 0]}>
        <mesh position={[0, 1.4, 0]} castShadow>
          <CylG args={[0.55, 0.75, 2.8, 8]} />
          <Flat color={STONE_SHADE} />
        </mesh>
        <mesh position={[0, 3.2, 0]} castShadow>
          <IcoG args={[0.5, 1]} />
          <Flat color={STONE_SHADE} />
        </mesh>
        <mesh position={[0, 3.75, 0]} castShadow>
          <BoxG args={[1.5, 0.3, 0.5]} />
          <Flat color={STONE_SHADE} />
        </mesh>
      </group>
    </group>
  );
};

/** A round fountain: basin (radius 9), a central bowl and animated jets. */
export const Fountain: React.FC<{ position: V3; t: number }> = ({ position, t }) => (
  <group position={position}>
    <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
      <CylG args={[9, 9.3, 1.2, 24]} />
      <Flat color={STONE} />
    </mesh>
    <mesh position={[0, 1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[8.3, 32]} />
      <meshLambertMaterial color="#4A7A9A" />
    </mesh>
    <mesh position={[0, 2.2, 0]} castShadow>
      <CylG args={[0.8, 1.2, 2.4, 10]} />
      <Flat color={STONE_SHADE} />
    </mesh>
    <mesh position={[0, 3.6, 0]} castShadow>
      <CylG args={[3.2, 1.0, 0.8, 14]} />
      <Flat color={STONE} />
    </mesh>
    {[0, 1, 2].map((i) => {
      const h = 5 + Math.sin(t * 5 + i * 2) * 0.4 - i * 1.4;
      return (
        <mesh key={i} position={[0, 4 + h / 2, 0]}>
          <CylG args={[0.12 + i * 0.12, 0.3 + i * 0.25, h, 8]} />
          <meshBasicMaterial color="#D4ECFA" transparent opacity={0.55 - i * 0.12} depthWrite={false} toneMapped={false} />
        </mesh>
      );
    })}
  </group>
);

/** A classic gallery facade with a portico and a small dome, front at z = 0 (faces +Z), plus a terrace. */
export const Gallery: React.FC<{ position: V3 }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 10, -9]} castShadow receiveShadow>
      <BoxG args={[150, 20, 18]} />
      <Flat color={STONE} />
    </mesh>
    {Array.from({ length: 22 }, (_, i) => -70 + i * 6.6)
      .filter((x) => Math.abs(x) > 14)
      .map((x) => (
        <mesh key={x} position={[x, 10, 0.02]}>
          <planeGeometry args={[2.2, 5]} />
          <Flat color="#3A3E48" />
        </mesh>
      ))}
    {Array.from({ length: 6 }, (_, i) => (
      <mesh key={`c${i}`} position={[-10 + i * 4, 9, 3.2]} castShadow>
        <CylG args={[0.8, 0.9, 14, 10]} />
        <Flat color="#E6E0D4" />
      </mesh>
    ))}
    <mesh position={[0, 16.6, 2.6]} castShadow>
      <BoxG args={[26, 1.4, 3.6]} />
      <Flat color="#E6E0D4" />
    </mesh>
    <mesh position={[0, 17.3, 1.2]} castShadow>
      <extrudeGeometry args={[new THREE.Shape([new THREE.Vector2(-13, 0), new THREE.Vector2(13, 0), new THREE.Vector2(0, 4.2)]), { depth: 3.2, bevelEnabled: false }]} />
      <meshLambertMaterial color="#E6E0D4" flatShading />
    </mesh>
    <mesh position={[0, 22.5, -8]} castShadow>
      <CylG args={[5, 5.4, 4, 14]} />
      <Flat color={STONE} />
    </mesh>
    <mesh position={[0, 24.4, -8]} scale={[1, 0.8, 1]} castShadow>
      <sphereGeometry args={[4.8, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <Flat color="#8A9AA0" />
    </mesh>
    {/* terrace in front: a raised walkway with a balustrade, steps down to the square */}
    <mesh position={[0, 2, 7]} castShadow receiveShadow>
      <BoxG args={[150, 4, 14]} />
      <Flat color={STONE_SHADE} />
    </mesh>
    {Array.from({ length: 60 }, (_, i) => (
      <mesh key={`b${i}`} position={[-74 + i * 2.5, 4.6, 13.6]} castShadow>
        <BoxG args={[0.5, 1.2, 0.5]} />
        <Flat color={STONE} />
      </mesh>
    ))}
    <mesh position={[0, 5.3, 13.6]} castShadow>
      <BoxG args={[150, 0.3, 0.8]} />
      <Flat color={STONE} />
    </mesh>
  </group>
);

/** A red double-decker bus (≈ 13 × 5.6 × 3.6), nose +Z, wheels on y = 0. Generic: no route or branding. */
export const DoubleDecker: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 3.0, 0]} castShadow>
      <primitive object={chamferBox(3.6, 5.2, 13)} attach="geometry" />
      <Flat color="#C8302A" />
    </mesh>
    {[1.6, 4.0].map((y) =>
      [1, -1].map((sx) => (
        <mesh key={`${y}${sx}`} position={[sx * 1.81, y, 0]} rotation={[0, sx * (Math.PI / 2), 0]}>
          <planeGeometry args={[11.4, 1.1]} />
          <Glow color="#E8D8A8" />
        </mesh>
      )),
    )}
    <mesh position={[0, 4.0, 6.51]}>
      <planeGeometry args={[3.0, 1.1]} />
      <Glow color="#E8D8A8" />
    </mesh>
    {[4.2, -4.2].map((z) =>
      [1, -1].map((sx) => (
        <mesh key={`${z}${sx}`} position={[sx * 1.7, 0.7, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <CylG args={[0.7, 0.7, 0.5, 10]} />
          <Flat color="#15161C" />
        </mesh>
      )),
    )}
  </group>
);

/** A red phone box (≈ 1.4 × 4.6), front +Z. */
export const PhoneBox: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 2.2, 0]} castShadow>
      <BoxG args={[1.4, 4.4, 1.4]} />
      <Flat color="#C8302A" />
    </mesh>
    <mesh position={[0, 4.55, 0]} castShadow>
      <BoxG args={[1.5, 0.3, 1.5]} />
      <Flat color="#A8261F" />
    </mesh>
    <mesh position={[0, 2.4, 0.71]}>
      <planeGeometry args={[1.0, 2.6]} />
      <Glow color="#E8D8A8" opacity={0.85} />
    </mesh>
  </group>
);

/**
 * The whole square: wet stone paving, the column to the south, two fountains, the gallery to the north,
 * stone buildings east and west and a road with buses south of the column.
 */
export const TrafalgarSquare: React.FC<{ t: number; seed?: string }> = ({ t, seed = "tsq" }) => (
  <group>
    <Ground color="#3A3F48" />
    <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[160, 110]} />
      <Flat color="#3E444F" />
    </mesh>
    {/* slab joints */}
    {Array.from({ length: 17 }, (_, i) => (
      <mesh key={`jx${i}`} position={[-80 + i * 10, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.12, 110]} />
        <Flat color="#343943" />
      </mesh>
    ))}
    {Array.from({ length: 12 }, (_, i) => (
      <mesh key={`jz${i}`} position={[0, 0.012, -55 + i * 10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[160, 0.12]} />
        <Flat color="#343943" />
      </mesh>
    ))}
    <Column />
    <Fountain position={[-SQUARE.fountainX, 0, SQUARE.fountainZ]} t={t} />
    <Fountain position={[SQUARE.fountainX, 0, SQUARE.fountainZ]} t={t + 1} />
    <Gallery position={[0, 0, SQUARE.gallery]} />
    {/* roads: south (with buses) and both sides */}
    <Road position={[0, 0.02, 92]} width={18} length={320} yaw={Math.PI / 2} />
    <Road position={[-92, 0.02, 0]} width={16} length={240} />
    <Road position={[92, 0.02, 0]} width={16} length={240} />
    <DoubleDecker position={[-30, 0, 88]} yaw={Math.PI / 2} />
    <DoubleDecker position={[26, 0, 96]} yaw={-Math.PI / 2} />
    <group scale={1.2}>
      <Car position={[-76, 0, 25]} color="#15161C" />
      <Car position={[76, 0, -30]} yaw={Math.PI} color="#15161C" />
      <Car position={[60, 0, 73]} yaw={-Math.PI / 2} color={P.carTeal} />
    </group>
    <PhoneBox position={[-84, 0, 60]} yaw={Math.PI / 2} />
    <PhoneBox position={[82, 0, 64]} yaw={-Math.PI / 2} />
    {[-1, 1].map((side) =>
      Array.from({ length: 5 }, (_, i) => (
        <Building
          key={`${side}${i}`}
          position={[side * 118, 0, -80 + i * 40]}
          w={36}
          d={34}
          h={26 + random(`${seed}${side}${i}`) * 16}
          color={["#B8AE98", "#C9C2B4", "#A8A090", "#BDB4A0"][i % 4]}
          seed={`${seed}${side}${i}`}
          power={0.5}
        />
      )),
    )}
    {Array.from({ length: 6 }, (_, i) => (
      <Building key={`s${i}`} position={[-125 + i * 50, 0, 132]} w={42} d={24} h={24 + random(`${seed}s${i}`) * 14} color={["#B8AE98", "#A8A090", "#C9C2B4"][i % 3]} seed={`${seed}s${i}`} power={0.5} />
    ))}
    {[-1, 1].map((side) =>
      Array.from({ length: 4 }, (_, i) => <LeafyTree key={`t${side}${i}`} position={[side * 84, 0, -40 + i * 26]} scale={3.2} seed={`${seed}t${side}${i}`} />),
    )}
    {[-1, 1].map((side) =>
      Array.from({ length: 5 }, (_, i) => <Lamp key={`lp${side}${i}`} position={[side * 76, 0, -44 + i * 22]} height={7} on={false} />),
    )}
  </group>
);

/** Square paving extents where pigeons may stand (outside fountains and the column steps). */
export const onSquare = (x: number, z: number) => {
  if (Math.abs(x) > 76 || z < -42 || z > 52) return false;
  if (Math.hypot(Math.abs(x) - SQUARE.fountainX, z - SQUARE.fountainZ) < 10.5) return false;
  if (Math.abs(x) < 18.5 && z > SQUARE.column[2] - 18.5) return false;
  return true;
};

// ================================================================ bakery

/** "BAKERY" sign drawn for a CanvasPanel. */
export const drawBakerySign = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#3A2418";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#E0B04E";
  ctx.lineWidth = H * 0.06;
  ctx.strokeRect(H * 0.08, H * 0.08, W - H * 0.16, H - H * 0.16);
  fitText(ctx, "BAKERY", W / 2, H / 2 + H * 0.04, W * 0.8, H * 0.6, "#F6EBC4");
};

/** A pennant with a loaf icon: the pigeons' flag. */
export const drawBreadFlag = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = P.amber;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#7A4A22";
  ctx.beginPath();
  ctx.ellipse(W * 0.5, H * 0.56, W * 0.26, H * 0.22, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(W * 0.24, H * 0.56, W * 0.52, H * 0.14);
  ctx.strokeStyle = "#F6EBC4";
  ctx.lineWidth = W * 0.025;
  for (const x of [0.4, 0.5, 0.6]) {
    ctx.beginPath();
    ctx.moveTo(W * (x - 0.03), H * 0.42);
    ctx.lineTo(W * (x + 0.03), H * 0.54);
    ctx.stroke();
  }
  ctx.font = CANVAS_FONT(H * 0.1);
};

export const BAKERY = { front: 0, w: 22, h: 14, doorX: 0, signY: 10.4 };

/** A bakery shopfront facing +Z at z = 0 (hero scale): window of loaves, striped awning, sign, a flag on the roof. */
export const Bakery: React.FC<{ t: number; flag?: boolean }> = ({ t, flag = true }) => {
  const { w, h } = BAKERY;
  return (
    <group>
      <mesh position={[0, h / 2, -6]} castShadow receiveShadow>
        <BoxG args={[w, h, 12]} />
        <Flat color="#C9A27A" />
      </mesh>
      <mesh position={[0, h + 0.3, -6]} castShadow>
        <BoxG args={[w + 0.6, 0.6, 12.6]} />
        <Flat color="#7A4A2E" />
      </mesh>
      {/* windows either side of the door, lit warm, with loaves on a sill */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 6.2, 0, 0]}>
          <mesh position={[0, 4.4, 0.02]}>
            <planeGeometry args={[7.4, 5.2]} />
            <Glow color="#F2C27A" />
          </mesh>
          <mesh position={[0, 1.6, 0.4]} castShadow>
            <BoxG args={[7.8, 0.4, 0.8]} />
            <Flat color="#7A4A2E" />
          </mesh>
          {[-2.6, -0.9, 0.9, 2.6].map((x, i) => (
            <Loaf key={x} position={[x, 1.8, 0.4]} scale={1.1} yaw={i * 0.7} color={i % 2 ? BREAD.crust : BREAD.dark} />
          ))}
        </group>
      ))}
      <mesh position={[0, 3.4, 0.05]}>
        <planeGeometry args={[3.2, 6.8]} />
        <Flat color="#4A2E1E" />
      </mesh>
      {/* awning: alternating stripes, tilted out */}
      <group position={[0, 8.0, 0.1]} rotation={[0.45, 0, 0]}>
        {Array.from({ length: 11 }, (_, i) => (
          <mesh key={i} position={[-w / 2 + 1 + i * 2, 0, 1.7]} castShadow>
            <BoxG args={[2, 0.12, 3.6]} />
            <Flat color={i % 2 ? "#F2EEE6" : "#C8372D"} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, BAKERY.signY, 0.1]} castShadow>
        <BoxG args={[12.4, 2.6, 0.3]} />
        <Flat color="#2A1A12" />
      </mesh>
      <CanvasPanel position={[0, BAKERY.signY, 0.27]} w={12} h={2.2} draw={drawBakerySign} />
      {flag ? (
        <group position={[-w / 2 + 3, h + 0.6, -3]}>
          <mesh position={[0, 3, 0]} castShadow>
            <CylG args={[0.1, 0.1, 6, 6]} />
            <Flat color="#2B2F3E" />
          </mesh>
          <group position={[1.6, 5.0, 0]} rotation={[0, Math.sin(t * 2.2) * 0.25, Math.sin(t * 3.1) * 0.03]}>
            <CanvasPanel position={[0, 0, 0]} w={3.2} h={2.0} px={512} draw={drawBreadFlag} />
          </group>
        </group>
      ) : null}
      {/* crates of bread by the door */}
      {[-1, 1].map((side) => (
        <group key={`c${side}`} position={[side * 3.4, 0, 2.4]}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <BoxG args={[2.4, 1.2, 1.6]} />
            <Flat color="#8A5A36" />
          </mesh>
          {[-0.5, 0.5].map((z) => (
            <Baguette key={z} position={[0, 1.2, z * 0.6]} rotation={[0, Math.PI / 2, 0.2]} len={2.2} r={0.16} />
          ))}
        </group>
      ))}
    </group>
  );
};

/** Bakery interior: back wall of shelves (shelf tops at SHELF_Y), loaves and baguettes, a counter with a till. */
export const SHELF_Y = [1.4, 3.2, 5.0, 6.8];
export const BakeryShelves: React.FC<{ seed?: string }> = ({ seed = "shelf" }) => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[40, 0.1, 30]} />
      <Flat color="#6A4A34" />
    </mesh>
    <mesh position={[0, 6, -2.2]} receiveShadow>
      <BoxG args={[40, 12, 0.3]} />
      <Flat color="#E8D8B8" />
    </mesh>
    {SHELF_Y.map((y, r) => (
      <group key={y}>
        <mesh position={[0, y - 0.1, -1.4]} castShadow receiveShadow>
          <BoxG args={[16, 0.2, 1.4]} />
          <Flat color="#8A5A36" />
        </mesh>
        {Array.from({ length: 7 }, (_, i) => {
          const x = -6.6 + i * 2.2;
          const k = `${seed}${r}${i}`;
          return random(`${k}b`) < 0.5 ? (
            <Baguette key={i} position={[x, y, -1.4]} rotation={[0, Math.PI / 2 + (random(`${k}y`) - 0.5) * 0.2, 0]} len={1.9} />
          ) : (
            <Loaf key={i} position={[x, y, -1.4]} yaw={random(`${k}y`) * 3} color={random(`${k}c`) < 0.5 ? BREAD.crust : BREAD.dark} />
          );
        })}
      </group>
    ))}
    {[-8.4, 8.4].map((x) => (
      <mesh key={x} position={[x, 4, -1.4]} castShadow>
        <BoxG args={[0.3, 8, 1.4]} />
        <Flat color="#6A4228" />
      </mesh>
    ))}
    {/* counter + till */}
    <mesh position={[5, 1.5, 4]} castShadow receiveShadow>
      <BoxG args={[8, 3, 2.2]} />
      <Flat color="#7A4A2E" />
    </mesh>
    <mesh position={[6.6, 3.5, 4]} castShadow>
      <BoxG args={[1.6, 1.0, 1.2]} />
      <Flat color="#2B2F3E" />
    </mesh>
    <mesh position={[6.6, 4.2, 4.1]} rotation={[-0.4, 0, 0]}>
      <planeGeometry args={[1.2, 0.6]} />
      <Glow color="#7FD6A0" />
    </mesh>
    <pointLight position={[0, 10, 6]} color="#FFD8A0" intensity={40} distance={30} decay={2} />
  </group>
);

/** Small helper: a smooth 0..1 ramp. */
export const ramp = (x: number, a: number, b: number) => ease(clamp01((x - a) / (b - a)));
