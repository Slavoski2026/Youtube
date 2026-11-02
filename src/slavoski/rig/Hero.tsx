/**
 * Slavoski, the recurring low-poly hero. Faces +Z. Feet on y=0 at the root.
 *
 * Every body part's transform comes from one pure function, `heroParts(pose)`, so props can be
 * placed exactly with `handPosition()` / `headPosition()` and checked with `selfClipping()`.
 *
 * Key dimensions (world units): total height ≈ 4.2, head radius ≈ 0.68, torso half-depth 0.36,
 * torso half-width 0.65, hip height 1.55.
 */
import React, { useMemo } from "react";
import * as THREE from "three";
import type { V3 } from "../noise";
import { P } from "../palette";
import { Flat } from "../materials";
import { SLAVOSKI, type HeroLook } from "../hero";

export type Expression = "neutral" | "alarm" | "smile" | "worried" | "awe" | "relief";

export type Pose = {
  /** Extra vertical offset of the whole body (use groundedBob for crouches). */
  bob: number;
  /** Torso pitch forward (+) in radians, around the hips. */
  lean: number;
  twist: number;
  side: number;
  headYaw: number;
  /** + looks up. */
  headPitch: number;
  headRoll: number;
  /** [pitch forward (+), roll outward (+)] */
  lShoulder: [number, number];
  rShoulder: [number, number];
  /** Elbow bend, forearm forward/up (+). */
  lElbow: number;
  rElbow: number;
  /** [pitch forward (+), roll outward (+)] */
  lHip: [number, number];
  rHip: [number, number];
  /** Knee bend, shin backward (+). */
  lKnee: number;
  rKnee: number;
  expression: Expression;
  /** 0 open … 1 closed. */
  blink: number;
};

export const REST: Pose = {
  bob: 0,
  lean: 0,
  twist: 0,
  side: 0,
  headYaw: 0,
  headPitch: 0,
  headRoll: 0,
  lShoulder: [0.05, 0.12],
  rShoulder: [0.05, 0.12],
  lElbow: 0.15,
  rElbow: 0.15,
  lHip: [0, 0.03],
  rHip: [0, 0.03],
  lKnee: 0,
  rKnee: 0,
  expression: "neutral",
  blink: 0,
};

export const mergePose = (base: Pose, over: Partial<Pose>): Pose => ({ ...base, ...over });

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpPose = (a: Pose, b: Pose, t: number): Pose => {
  const out = { ...a } as Record<string, unknown>;
  for (const k of Object.keys(a) as (keyof Pose)[]) {
    const va = a[k];
    const vb = b[k];
    if (typeof va === "number" && typeof vb === "number") out[k] = lerp(va, vb, t);
    else if (Array.isArray(va) && Array.isArray(vb)) out[k] = [lerp(va[0], vb[0], t), lerp(va[1], vb[1], t)];
    else out[k] = t < 0.5 ? va : vb;
  }
  return out as Pose;
};

/** Walk cycle. `phase` in cycles (1 = one full stride pair). */
export const walkPose = (phase: number, amount = 1): Pose => {
  const s = Math.sin(phase * Math.PI * 2);
  const c = Math.cos(phase * Math.PI * 2);
  return mergePose(REST, {
    lHip: [0.45 * s * amount, 0.03],
    rHip: [-0.45 * s * amount, 0.03],
    lKnee: Math.max(0, -c) * 0.7 * amount + 0.05,
    rKnee: Math.max(0, c) * 0.7 * amount + 0.05,
    lShoulder: [-0.4 * s * amount, 0.12],
    rShoulder: [0.4 * s * amount, 0.12],
    lElbow: 0.35,
    rElbow: 0.35,
    bob: Math.abs(s) * 0.06 * amount,
    lean: 0.05 * amount,
  });
};

// ---------- Dimensions ----------
export const DIM = {
  hipY: 1.55,
  thigh: 0.72,
  shin: 0.63,
  ankleY: 0.2,
  legX: 0.3,
  legW: 0.44,
  legD: 0.46,
  torsoW: 1.46,
  torsoH: 1.25,
  torsoD: 0.72,
  shoulderX: 0.92,
  shoulderY: 1.13, // above hips (torso space)
  upperArm: 0.62,
  forearm: 0.55,
  armW: 0.38,
  fistR: 0.22,
  headR: 0.68,
  headY: 1.95, // head centre above hips (torso space)
};

// ---------- Matrix helpers ----------
const M = () => new THREE.Matrix4();
const T = (x: number, y: number, z: number) => M().makeTranslation(x, y, z);
const R = (x: number, y: number, z: number, order: THREE.EulerOrder = "ZYX") =>
  M().makeRotationFromEuler(new THREE.Euler(x, y, z, order));
const S = (x: number, y: number, z: number) => M().makeScale(x, y, z);
const chain = (...ms: THREE.Matrix4[]) => ms.reduce((acc, m) => acc.multiply(m), M());

export type PartKind = "box" | "head" | "fist" | "ear" | "neck";
export type Part = { name: string; kind: PartKind; color: string; matrix: THREE.Matrix4 };

/** All body parts in hero-root space (feet at y=0, facing +Z). */
export const heroParts = (pose: Pose, look: HeroLook = SLAVOSKI): Part[] => {
  const d = DIM;
  const parts: Part[] = [];
  const add = (name: string, kind: PartKind, color: string, matrix: THREE.Matrix4) =>
    parts.push({ name, kind, color, matrix });

  const hips = chain(T(0, d.hipY + pose.bob, 0));
  // Pelvis
  add("pelvis", "box", look.jeans, chain(hips, T(0, 0.02, 0), S(1.12, 0.36, 0.64)));

  // Legs
  for (const side of ["l", "r"] as const) {
    const sx = side === "l" ? 1 : -1;
    const [pitch, roll] = side === "l" ? pose.lHip : pose.rHip;
    const knee = side === "l" ? pose.lKnee : pose.rKnee;
    const hip = chain(hips, T(sx * d.legX, -0.05, 0), R(-pitch, 0, sx * roll));
    add(`${side}Thigh`, "box", look.jeans, chain(hip, T(0, -d.thigh / 2, 0), S(d.legW, d.thigh + 0.06, d.legD)));
    const kneeM = chain(hip, T(0, -d.thigh, 0), R(knee, 0, 0));
    add(`${side}Shin`, "box", look.jeans, chain(kneeM, T(0, -d.shin / 2, 0), S(d.legW * 0.96, d.shin + 0.04, d.legD * 0.96)));
    const ankle = chain(kneeM, T(0, -d.shin, 0), R(-knee + pitch, 0, -sx * roll));
    add(`${side}Shoe`, "box", look.shoe, chain(ankle, T(0, -0.015, 0.1), S(0.5, 0.27, 0.78)));
  }

  // Torso
  const torso = chain(hips, R(pose.lean, pose.twist, -pose.side, "YXZ"));
  add("torso", "box", look.jacket, chain(torso, T(0, 0.05 + d.torsoH / 2, 0), S(d.torsoW, d.torsoH, d.torsoD)));
  add("zipper", "box", look.zipper, chain(torso, T(0, 0.05 + d.torsoH / 2 - 0.02, d.torsoD / 2 + 0.006), S(0.055, d.torsoH - 0.12, 0.02)));
  add("hem", "box", look.jacketShade, chain(torso, T(0, 0.1, 0), S(d.torsoW + 0.02, 0.12, d.torsoD + 0.02)));
  add("collar", "box", look.jacketShade, chain(torso, T(0, 0.05 + d.torsoH - 0.02, 0), S(0.62, 0.12, 0.5)));
  add("neck", "neck", look.skin, chain(torso, T(0, d.torsoH + 0.12, 0)));

  // Arms
  for (const side of ["l", "r"] as const) {
    const sx = side === "l" ? 1 : -1;
    const [pitch, roll] = side === "l" ? pose.lShoulder : pose.rShoulder;
    const elbow = side === "l" ? pose.lElbow : pose.rElbow;
    const sh = chain(torso, T(sx * d.shoulderX, d.shoulderY, 0), R(-pitch, 0, sx * roll));
    add(`${side}UpperArm`, "box", look.jacket, chain(sh, T(0, -d.upperArm / 2 + 0.08, 0), S(d.armW, d.upperArm + 0.16, d.armW)));
    const el = chain(sh, T(0, -d.upperArm, 0), R(-elbow, 0, 0));
    add(`${side}Forearm`, "box", look.jacket, chain(el, T(0, -d.forearm / 2, 0), S(d.armW * 0.94, d.forearm + 0.06, d.armW * 0.94)));
    add(`${side}Cuff`, "box", look.jacketShade, chain(el, T(0, -d.forearm + 0.02, 0), S(d.armW * 1.0, 0.08, d.armW * 1.0)));
    add(`${side}Fist`, "fist", look.skin, chain(el, T(0, -d.forearm - d.fistR * 0.7, 0)));
  }

  // Head
  const head = chain(torso, T(0, d.headY, 0), R(-pose.headPitch, pose.headYaw, pose.headRoll, "YXZ"));
  add("head", "head", look.skin, head);
  add("lEar", "ear", look.skin, chain(head, T(0.66, -0.02, -0.02)));
  add("rEar", "ear", look.skin, chain(head, T(-0.66, -0.02, -0.02)));
  // Hair: cap, back, fringe, sideburns
  add("hairCap", "box", look.hair, chain(head, T(0, 0.5, -0.06), R(-0.1, 0, 0), S(1.26, 0.3, 1.24)));
  add("hairBack", "box", look.hair, chain(head, T(0, 0.12, -0.5), S(1.24, 0.7, 0.36)));
  add("hairFringe", "box", look.hair, chain(head, T(0.1, 0.43, 0.5), R(0.35, 0, -0.1), S(0.9, 0.2, 0.28)));
  add("lSideburn", "box", look.hair, chain(head, T(0.6, 0.18, 0.05), S(0.16, 0.42, 0.5)));
  add("rSideburn", "box", look.hair, chain(head, T(-0.6, 0.18, 0.05), S(0.16, 0.42, 0.5)));

  // Face
  const e = EXPR[pose.expression];
  const faceZ = 0.625;
  const eyeH = 0.26 * e.eyeH * (1 - pose.blink * 0.85);
  for (const sx of [1, -1]) {
    add(sx > 0 ? "lEye" : "rEye", "box", P.eyeWhite, chain(head, T(sx * 0.21, 0.1, faceZ), S(0.22, eyeH, 0.06)));
    if (pose.blink < 0.6) {
      add(
        sx > 0 ? "lPupil" : "rPupil",
        "box",
        P.pupil,
        chain(head, T(sx * 0.21 + e.lookX, 0.09 + e.lookY, faceZ + 0.035), S(0.1 * e.pupil, 0.12 * e.pupil * (1 - pose.blink), 0.02)),
      );
    }
  }
  add("nose", "box", look.skinShade, chain(head, T(0, -0.08, faceZ + 0.06), R(0.15, 0, 0), S(0.14, 0.2, 0.16)));
  add("mouth", "box", P.mouth, chain(head, T(e.mouthX, -0.32, faceZ - 0.04), R(0, 0, e.mouthTilt), S(e.mouthW, e.mouthH, 0.08)));
  return parts;
};

const EXPR: Record<
  Expression,
  { eyeH: number; pupil: number; lookX: number; lookY: number; mouthW: number; mouthH: number; mouthX: number; mouthTilt: number }
> = {
  neutral: { eyeH: 1, pupil: 1, lookX: 0, lookY: 0, mouthW: 0.17, mouthH: 0.05, mouthX: 0, mouthTilt: 0 },
  alarm: { eyeH: 1.2, pupil: 0.75, lookX: 0, lookY: 0.01, mouthW: 0.2, mouthH: 0.15, mouthX: 0, mouthTilt: 0 },
  smile: { eyeH: 0.9, pupil: 1, lookX: 0, lookY: 0, mouthW: 0.28, mouthH: 0.06, mouthX: 0, mouthTilt: 0 },
  worried: { eyeH: 1.05, pupil: 0.9, lookX: 0.01, lookY: 0, mouthW: 0.14, mouthH: 0.05, mouthX: 0.03, mouthTilt: 0.18 },
  awe: { eyeH: 1.15, pupil: 0.85, lookX: 0, lookY: 0.02, mouthW: 0.12, mouthH: 0.13, mouthX: 0, mouthTilt: 0 },
  relief: { eyeH: 0.55, pupil: 1, lookX: 0, lookY: -0.02, mouthW: 0.24, mouthH: 0.05, mouthX: 0, mouthTilt: 0 },
};

// ---------- Queries ----------
const rootMatrix = (position: V3 = [0, 0, 0], yaw = 0, scale = 1) =>
  chain(T(...position), R(0, yaw, 0), S(scale, scale, scale));

const partCenter = (pose: Pose, name: string, root: THREE.Matrix4, offset: V3 = [0, 0, 0]): V3 => {
  const part = heroParts(pose).find((p) => p.name === name);
  if (!part) throw new Error(`No part ${name}`);
  const v = new THREE.Vector3(...offset).applyMatrix4(chain(root, part.matrix));
  return [v.x, v.y, v.z];
};

/** World position of the centre of a fist (place held props here, offset by their half-thickness). */
export const handPosition = (pose: Pose, side: "l" | "r", position?: V3, yaw?: number, scale?: number): V3 =>
  partCenter(pose, `${side}Fist`, rootMatrix(position, yaw, scale));

export const headPosition = (pose: Pose, position?: V3, yaw?: number, scale?: number): V3 =>
  partCenter(pose, "head", rootMatrix(position, yaw, scale));

/** Joint positions for placing props. */
export const armJoints = (pose: Pose, side: "l" | "r", position?: V3, yaw?: number, scale?: number) => {
  const root = rootMatrix(position, yaw, scale);
  return {
    // Offsets are in each box's unit-cube space (see the S() scales in heroParts).
    shoulder: partCenter(pose, `${side}UpperArm`, root, [0, (DIM.upperArm / 2 - 0.08) / (DIM.upperArm + 0.16), 0]),
    elbow: partCenter(pose, `${side}Forearm`, root, [0, DIM.forearm / 2 / (DIM.forearm + 0.06), 0]),
    hand: partCenter(pose, `${side}Fist`, root),
  };
};

export const legJoints = (pose: Pose, side: "l" | "r", position?: V3, yaw?: number, scale?: number) => {
  const root = rootMatrix(position, yaw, scale);
  return {
    knee: partCenter(pose, `${side}Shin`, root, [0, 0.5, 0]),
    ankle: partCenter(pose, `${side}Shoe`, root, [0, 0.26, -0.13]),
  };
};

/**
 * Bends an arm so the fist centre lands on `target` (hero-root space unless position/yaw given),
 * by numeric search over shoulder pitch/roll and elbow bend, rejecting poses that clip the head
 * or torso. Returns the new pose and the remaining error (world units).
 */
export const reach = (
  pose: Pose,
  side: "l" | "r",
  target: V3,
  opts: { position?: V3; yaw?: number } = {},
): { pose: Pose; error: number } => {
  const sk = side === "l" ? "lShoulder" : "rShoulder";
  const ek = side === "l" ? "lElbow" : "rElbow";
  const tgt = new THREE.Vector3(...target);
  const cost = (p: Pose) => {
    const h = new THREE.Vector3(...handPosition(p, side, opts.position, opts.yaw));
    const clip = selfClipping(p).filter((x) => x.startsWith(side)).length;
    const [, roll] = p[sk] as [number, number];
    return h.distanceTo(tgt) + clip * 10 + Math.abs(roll) * 0.02; // prefer natural, low-roll solutions
  };
  let best = { ...pose };
  let bestC = cost(best);
  // coarse grid
  for (let pi = -0.5; pi <= 3.0; pi += 0.25)
    for (let ro = -0.3; ro <= 2.6; ro += 0.2)
      for (let el = 0; el <= 2.4; el += 0.2) {
        const p = { ...pose, [sk]: [pi, ro], [ek]: el } as Pose;
        const c = cost(p);
        if (c < bestC) {
          best = p;
          bestC = c;
        }
      }
  // refine
  let step = 0.1;
  for (let it = 0; it < 60 && step > 0.004; it++) {
    let improved = false;
    for (const [dp, dr, de] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const [p0, r0] = best[sk] as [number, number];
      const p = { ...best, [sk]: [p0 + dp * step, r0 + dr * step], [ek]: Math.max(0, (best[ek] as number) + de * step) } as Pose;
      const c = cost(p);
      if (c < bestC) {
        best = p;
        bestC = c;
        improved = true;
      }
    }
    if (!improved) step /= 2;
  }
  return { pose: best, error: bestC };
};

/** The bob that puts the lowest shoe sole on the floor (use for crouches and landings). */
export const groundedBob = (pose: Pose): number => {
  const p0 = { ...pose, bob: 0 };
  let minY = Infinity;
  for (const part of heroParts(p0)) {
    if (!part.name.endsWith("Shoe")) continue;
    for (const cx of [-0.5, 0.5]) for (const cz of [-0.5, 0.5]) {
      const v = new THREE.Vector3(cx, -0.5, cz).applyMatrix4(part.matrix);
      minY = Math.min(minY, v.y);
    }
  }
  return -minY;
};

/** Lists limbs going into the head or torso, and feet below the floor. */
export const selfClipping = (pose: Pose): string[] => {
  const issues: string[] = [];
  const parts = heroParts(pose);
  const get = (n: string) => parts.find((p) => p.name === n)!;
  const torsoInv = get("torso").matrix.clone().invert();
  const headC = new THREE.Vector3().applyMatrix4(get("head").matrix);
  for (const side of ["l", "r"]) {
    for (const limb of ["Fist", "Forearm"]) {
      const c = new THREE.Vector3().applyMatrix4(get(`${side}${limb}`).matrix);
      const local = c.clone().applyMatrix4(torsoInv);
      if (Math.abs(local.x) < 0.5 && Math.abs(local.y) < 0.5 && Math.abs(local.z) < 0.5) issues.push(`${side}${limb} in torso`);
      if (c.distanceTo(headC) < DIM.headR + (limb === "Fist" ? DIM.fistR : DIM.armW / 2)) issues.push(`${side}${limb} in head`);
    }
  }
  const lift = groundedBob(pose);
  if (pose.bob < lift - 0.02) issues.push(`feet ${(lift - pose.bob).toFixed(2)} below floor`);
  return issues;
};

// ---------- Rendering ----------
const geoms = {
  box: new THREE.BoxGeometry(1, 1, 1),
  head: (() => {
    const g = new THREE.IcosahedronGeometry(DIM.headR, 2);
    g.scale(1, 1.06, 0.95);
    return g;
  })(),
  fist: new THREE.IcosahedronGeometry(DIM.fistR, 1),
  ear: new THREE.IcosahedronGeometry(0.13, 0),
  neck: new THREE.CylinderGeometry(0.22, 0.24, 0.3, 7),
};

export const Hero: React.FC<{
  pose?: Pose;
  position?: V3;
  /** Rotation around Y (0 faces +Z). */
  yaw?: number;
  scale?: number;
  look?: HeroLook;
  castShadow?: boolean;
}> = ({ pose = REST, position = [0, 0, 0], yaw = 0, scale = 1, look = SLAVOSKI, castShadow = true }) => {
  const parts = useMemo(() => heroParts(pose, look), [pose, look]);
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      {parts.map((p) => (
        <mesh
          key={p.name}
          geometry={geoms[p.kind]}
          matrix={p.matrix}
          matrixAutoUpdate={false}
          castShadow={castShadow}
          receiveShadow
        >
          <Flat color={p.color} />
        </mesh>
      ))}
    </group>
  );
};
