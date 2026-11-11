/**
 * Props for "What If Minecraft Mobs Spawned in Real Life?" (ep. 8).
 * The mobs are OUR OWN low-poly designs in the SLAVOSKI style (faceted boxes, flat shading): recognisable
 * by silhouette and colour only. No Mojang textures, pixel faces, logos or HUD.
 */
import React from "react";
import { AbsoluteFill, random } from "remotion";
import * as THREE from "three";
import { Ground, Road } from "../../slavoski/city";
import { BoxG, CircleG, ConeG, IcoG } from "../../slavoski/detail";
import { FONT } from "../../slavoski/fonts";
import type { HeroLook } from "../../slavoski/hero";
import { SLAVOSKI } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { LeafyTree } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { mergePose, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { HillRing, House, Skyline, Strut } from "../no-work-2036/props";

const mix = (a: string, b: string, k: number) => new THREE.Color(a).lerp(new THREE.Color(b), clamp01(k)).getStyle();

/** Scale-in for a mob that pops into the world: overshoots, then settles. 0 before `at`. */
export const pop = (lt: number, at: number, dur = 0.22) => {
  const k = clamp01((lt - at) / dur);
  if (lt < at) return 0;
  return k < 0.7 ? (k / 0.7) * 1.14 : 1.14 - ((k - 0.7) / 0.3) * 0.14;
};

// ================================================================ looks on Slavoski's rig

/** Zombie townsfolk: green skin, torn teal shirt, purple-blue trousers. */
export const ZOMBIE: HeroLook = {
  skin: "#6FA85A",
  skinShade: "#578A46",
  hair: "#35522C",
  jacket: "#2E9AA6",
  jacketShade: "#237C86",
  zipper: "#2E9AA6",
  jeans: "#4B4A9E",
  shoe: "#3A3A44",
  eyeWhite: "#1B1B22",
};

/** Slavoski after standing next to an explosion. */
export const SOOTY: HeroLook = {
  ...SLAVOSKI,
  skin: mix(SLAVOSKI.skin, "#2A2622", 0.55),
  skinShade: mix(SLAVOSKI.skinShade, "#2A2622", 0.6),
  jacket: mix(SLAVOSKI.jacket, "#2A2622", 0.6),
  jacketShade: mix(SLAVOSKI.jacketShade, "#2A2622", 0.65),
  zipper: "#6A645A",
  jeans: mix(SLAVOSKI.jeans, "#2A2622", 0.4),
  shoe: "#7A766E",
};

/** The zombie shuffle: slow walk, both arms straight out in front. */
export const zombiePose = (phase: number, amount = 0.6): Pose =>
  mergePose(walkPose(phase, amount), {
    lShoulder: [1.5 + Math.sin(phase * 6.3) * 0.06, 0.06],
    rShoulder: [1.42 - Math.sin(phase * 6.3) * 0.06, 0.06],
    lElbow: 0.05,
    rElbow: 0.05,
    headRoll: 0.16,
    lean: 0.12,
  });

/** A flat-out sprint. */
export const runPose = (phase: number): Pose =>
  mergePose(walkPose(phase, 1.7), { lean: 0.32, lElbow: 1.3, rElbow: 1.3, expression: "alarm" });

// ================================================================ the hisser (our creeper)

export const HISSER = { top: 4.85, headY: 4.1, head: 1.5 };

/**
 * A tall, armless green thing on four stubby feet that hisses, swells and flashes white.
 * Faces +Z. `swell` 0..1 inflates it, `flash` 0..1 turns it white, `walk` is a step phase.
 */
export const Hisser: React.FC<{ position?: V3; yaw?: number; scale?: number; swell?: number; flash?: number; walk?: number; tilt?: number }> = ({
  position = [0, 0, 0],
  yaw = 0,
  scale = 1,
  swell = 0,
  flash = 0,
  walk,
  tilt = 0,
}) => {
  const c = (hex: string) => mix(hex, "#FFFFFF", flash * 0.85);
  const g = "#58B04E";
  const s = scale * (1 + swell * 0.16);
  const step = walk === undefined ? 0 : Math.sin(walk * Math.PI * 2);
  const patches = Array.from({ length: 9 }, (_, i) => ({
    x: (random(`hp${i}x`) - 0.5) * 0.95,
    y: 1.0 + random(`hp${i}y`) * 2.2,
    w: 0.22 + random(`hp${i}w`) * 0.22,
    front: i % 2 === 0,
    dark: random(`hp${i}c`) > 0.45,
  }));
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={s}>
      {/* four feet */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.4, 0.36, sz * 0.56 + step * 0.16 * sx * sz]} castShadow>
            <BoxG args={[0.6, 0.72, 0.7]} />
            <Flat color={c("#3F8A3C")} />
          </mesh>
        )),
      )}
      {/* body */}
      <mesh position={[0, 2.02, 0]} castShadow receiveShadow>
        <BoxG args={[1.3, 2.62, 0.9]} />
        <Flat color={c(g)} />
      </mesh>
      {patches.map((p, i) => (
        <mesh key={i} position={[p.x * (p.front ? 1 : 0.9), p.y, p.front ? 0.455 : -0.455]}>
          <BoxG args={[p.w, p.w, 0.03]} />
          <Flat color={c(p.dark ? "#3F8A3C" : "#7CCB6C")} />
        </mesh>
      ))}
      {/* head */}
      <group position={[0, HISSER.headY, 0]} rotation={[0, 0, tilt]}>
        <mesh castShadow>
          <BoxG args={[HISSER.head, HISSER.head, HISSER.head]} />
          <Flat color={c("#62BC56")} />
        </mesh>
        <mesh position={[0.42, 0.52, 0.2]}>
          <BoxG args={[0.4, 0.5, 0.5]} />
          <Flat color={c("#7CCB6C")} />
        </mesh>
        {/* our own face: two square eyes and a wide grumpy mouth */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.36, 0.2, 0.76]}>
            <BoxG args={[0.36, 0.36, 0.04]} />
            <Flat color="#10140F" />
          </mesh>
        ))}
        {[-1, 1].map((sx) => (
          <mesh key={`g${sx}`} position={[sx * 0.3, 0.26, 0.785]}>
            <BoxG args={[0.1, 0.1, 0.02]} />
            <Glow color="#E8FFE0" />
          </mesh>
        ))}
        <mesh position={[0, -0.3, 0.76]}>
          <BoxG args={[0.66, 0.16, 0.04]} />
          <Flat color="#10140F" />
        </mesh>
        {[-1, 1].map((sx) => (
          <mesh key={`m${sx}`} position={[sx * 0.33, -0.44, 0.76]}>
            <BoxG args={[0.16, 0.22, 0.04]} />
            <Flat color="#10140F" />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// ================================================================ the skeleton archer

const BONE = "#DDD9CA";
const BONE_SHADE = "#B9B5A5";

/** A bony archer, 4 units tall, facing +Z. `aim` 0..1 raises and draws the bow; `arrow` shows one on the string. */
export const Skeleton: React.FC<{ position?: V3; yaw?: number; scale?: number; aim?: number; arrow?: boolean; walk?: number; panic?: number }> = ({
  position = [0, 0, 0],
  yaw = 0,
  scale = 1,
  aim = 0,
  arrow = true,
  walk,
  panic = 0,
}) => {
  const s = walk === undefined ? 0 : Math.sin(walk * Math.PI * 2);
  const a = ease(aim);
  const shL: V3 = [-0.62, 2.95, 0];
  const shR: V3 = [0.62, 2.95, 0];
  // Bow hand (left) out in front; string hand (right) by the cheek. Panic throws both arms up.
  const handL: V3 = panic > 0 ? [-1.0, 4.3, 0.1] : [-0.5 + a * 0.3, 1.5 + a * 1.45, 0.15 + a * 1.25];
  const handR: V3 = panic > 0 ? [1.0, 4.3, 0.1] : [0.6 - a * 0.25, 1.5 + a * 1.45, 0.15 + a * 0.15];
  const bow = handL;
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      {[-1, 1].map((sx) => {
        const sw = sx * s * 0.5;
        const foot: V3 = [sx * 0.28, 0.1, Math.sin(sw) * 1.5];
        return (
          <React.Fragment key={sx}>
            <Strut a={[sx * 0.28, 1.6, 0]} b={foot} w={0.2} color={BONE} />
            <mesh position={[foot[0], 0.1, foot[2] + 0.12]} castShadow>
              <BoxG args={[0.26, 0.2, 0.5]} />
              <Flat color={BONE_SHADE} />
            </mesh>
          </React.Fragment>
        );
      })}
      <mesh position={[0, 1.66, 0]} castShadow>
        <BoxG args={[0.84, 0.26, 0.36]} />
        <Flat color={BONE} />
      </mesh>
      <mesh position={[0, 2.3, -0.04]} castShadow>
        <BoxG args={[0.18, 1.2, 0.18]} />
        <Flat color={BONE_SHADE} />
      </mesh>
      {[2.08, 2.38, 2.68].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <BoxG args={[0.92, 0.14, 0.42]} />
          <Flat color={BONE} />
        </mesh>
      ))}
      <mesh position={[0, 2.96, 0]} castShadow>
        <BoxG args={[1.36, 0.18, 0.24]} />
        <Flat color={BONE} />
      </mesh>
      <Strut a={shL} b={handL} w={0.17} color={BONE} />
      <Strut a={shR} b={[(shR[0] + handR[0]) / 2 + (panic > 0 ? 0 : 0.35 * a), (shR[1] + handR[1]) / 2 - (panic > 0 ? 0 : 0.1), (shR[2] + handR[2]) / 2 - (panic > 0 ? 0 : 0.3 * a)]} w={0.17} color={BONE} />
      <Strut a={[(shR[0] + handR[0]) / 2 + (panic > 0 ? 0 : 0.35 * a), (shR[1] + handR[1]) / 2 - (panic > 0 ? 0 : 0.1), (shR[2] + handR[2]) / 2 - (panic > 0 ? 0 : 0.3 * a)]} b={handR} w={0.17} color={BONE} />
      {/* head */}
      <group position={[0, 3.56, 0.02]}>
        <mesh castShadow>
          <BoxG args={[0.96, 0.92, 0.94]} />
          <Flat color="#E9E6DA" />
        </mesh>
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.22, 0.08, 0.475]}>
            <BoxG args={[0.24, 0.22, 0.03]} />
            <Flat color="#17161C" />
          </mesh>
        ))}
        <mesh position={[0, -0.12, 0.475]}>
          <BoxG args={[0.1, 0.12, 0.03]} />
          <Flat color="#3A3840" />
        </mesh>
        <mesh position={[0, -0.3, 0.475]}>
          <BoxG args={[0.56, 0.1, 0.03]} />
          <Flat color="#17161C" />
        </mesh>
      </group>
      {/* bow, string and arrow (hidden while panicking) */}
      {panic > 0 ? null : (
        <group>
          <Strut a={[bow[0], bow[1] + 0.95, bow[2] - 0.22]} b={[bow[0], bow[1] + 0.35, bow[2] + 0.06]} w={0.09} color="#7A5232" />
          <Strut a={[bow[0], bow[1] + 0.35, bow[2] + 0.06]} b={[bow[0], bow[1] - 0.35, bow[2] + 0.06]} w={0.11} color="#7A5232" />
          <Strut a={[bow[0], bow[1] - 0.35, bow[2] + 0.06]} b={[bow[0], bow[1] - 0.95, bow[2] - 0.22]} w={0.09} color="#7A5232" />
          <Strut a={[bow[0], bow[1] + 0.95, bow[2] - 0.22]} b={[bow[0], bow[1], bow[2] - 0.22 - a * (arrow ? 0.85 : 0)]} w={0.025} color="#E8E4DA" />
          <Strut a={[bow[0], bow[1] - 0.95, bow[2] - 0.22]} b={[bow[0], bow[1], bow[2] - 0.22 - a * (arrow ? 0.85 : 0)]} w={0.025} color="#E8E4DA" />
          {arrow && aim > 0.2 ? <Arrow position={[bow[0], bow[1], bow[2] + 0.55 - a * 0.85]} dir={[0, 0, 1]} /> : null}
        </group>
      )}
    </group>
  );
};

const Z_AXIS = new THREE.Vector3(0, 0, 1);
/** An arrow 1.7 long centred on `position`, pointing along `dir`. */
export const Arrow: React.FC<{ position: V3; dir: V3; scale?: number }> = ({ position, dir, scale = 1 }) => {
  const q = new THREE.Quaternion().setFromUnitVectors(Z_AXIS, new THREE.Vector3(...dir).normalize());
  return (
    <group position={position} quaternion={q} scale={scale}>
      <mesh castShadow>
        <BoxG args={[0.06, 0.06, 1.7]} />
        <Flat color="#C9B48A" />
      </mesh>
      <mesh position={[0, 0, 0.93]} rotation={[Math.PI / 2, 0, 0]}>
        <ConeG args={[0.1, 0.24, 4]} />
        <Flat color="#9AA1B0" />
      </mesh>
      {[0, 1].map((i) => (
        <mesh key={i} position={[0, 0, -0.74]} rotation={[0, 0, (i * Math.PI) / 2]}>
          <BoxG args={[0.26, 0.02, 0.26]} />
          <Flat color="#E8E4DA" />
        </mesh>
      ))}
    </group>
  );
};

/** An arrow in flight from `from` to `to` on a shallow arc; at progress 1 it stays stuck in the target. */
export const ArrowFlight: React.FC<{ from: V3; to: V3; progress: number; arc?: number; scale?: number }> = ({ from, to, progress, arc = 2.5, scale = 1.6 }) => {
  if (progress <= 0) return null;
  const k = clamp01(progress);
  const at = (u: number): V3 => [from[0] + (to[0] - from[0]) * u, from[1] + (to[1] - from[1]) * u + Math.sin(u * Math.PI) * arc, from[2] + (to[2] - from[2]) * u];
  const p = at(k);
  const q = at(Math.max(0, k - 0.04));
  const d: V3 = [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
  // Stuck arrows sit back along their own direction so only the head is in the ground.
  const back = k >= 1 ? 0.75 * scale : 0;
  const n = Math.hypot(d[0], d[1], d[2]) || 1;
  return <Arrow position={[p[0] - (d[0] / n) * back, p[1] - (d[1] / n) * back, p[2] - (d[2] / n) * back]} dir={d} scale={scale} />;
};

// ================================================================ the giant spider

/** A car-sized spider (about 4.4 long at scale 1), facing +Z, walking with `t`. */
export const GiantSpider: React.FC<{ position?: V3; rotation?: V3; scale?: number; t: number; speed?: number }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, t, speed = 2.2 }) => {
  const body = "#51476A";
  const leg = "#3A3350";
  const bob = Math.sin(t * speed * Math.PI * 2 * 2) * 0.05;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group position={[0, bob, 0]}>
        <mesh position={[0, 1.25, -1.35]} scale={[1.15, 0.85, 1.4]} castShadow>
          <IcoG args={[1.1, 1]} />
          <Flat color={body} />
        </mesh>
        <mesh position={[0, 1.6, -1.5]} scale={[0.5, 0.3, 0.7]}>
          <IcoG args={[1.1, 1]} />
          <Flat color="#C8372D" />
        </mesh>
        <mesh position={[0, 1.1, 0.35]} castShadow>
          <BoxG args={[1.3, 0.9, 1.3]} />
          <Flat color="#5E5378" />
        </mesh>
        {/* eyes: two big, four small */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.3, 1.22, 1.01]}>
            <BoxG args={[0.26, 0.22, 0.04]} />
            <Glow color="#FF3B3B" />
          </mesh>
        ))}
        {[-1, 1].flatMap((sx) =>
          [0, 1].map((r) => (
            <mesh key={`${sx}${r}`} position={[sx * (0.5 - r * 0.32), 1.46 - r * 0.02, 1.01]}>
              <BoxG args={[0.1, 0.1, 0.04]} />
              <Glow color="#FF3B3B" />
            </mesh>
          )),
        )}
        {[-1, 1].map((sx) => (
          <mesh key={`f${sx}`} position={[sx * 0.22, 0.72, 1.0]}>
            <BoxG args={[0.14, 0.34, 0.14]} />
            <Flat color={leg} />
          </mesh>
        ))}
      </group>
      {/* eight legs: hip on the thorax, a high knee, a foot planted on the ground */}
      {[-1, 1].flatMap((sx) =>
        [0, 1, 2, 3].map((i) => {
          const ph = t * speed * Math.PI * 2 + (i % 2 ? Math.PI : 0) + (sx > 0 ? Math.PI : 0);
          const swing = Math.sin(ph) * 0.45;
          const lift = Math.max(0, Math.cos(ph)) * 0.45;
          const z0 = 0.7 - i * 0.42;
          const spread = 0.9 - i * 0.75;
          const hip: V3 = [sx * 0.6, 1.05 + bob, z0];
          const knee: V3 = [sx * 1.75, 2.15 + lift * 0.4, z0 + spread * 0.9 + swing * 0.4];
          const foot: V3 = [sx * 2.75, 0.08 + lift, z0 + spread * 1.9 + swing];
          return (
            <React.Fragment key={`${sx}${i}`}>
              <Strut a={hip} b={knee} w={0.2} color={leg} />
              <Strut a={knee} b={foot} w={0.15} color={leg} />
            </React.Fragment>
          );
        }),
      )}
      <Halo position={[0, 1.3, 1.2]} size={2.2} color="#FF3B3B" opacity={0.35} />
    </group>
  );
};

// ================================================================ the tall one (our enderman)

export const TALL = { height: 5.6, headY: 5.08, shoulderY: 4.4 };
const VOID = "#15121C";
const VIOLET = "#D36BFF";

/** Drifting violet motes around a point. */
export const Motes: React.FC<{ center: V3; t: number; count?: number; spread?: V3; seed?: string; size?: number; opacity?: number }> = ({ center, t, count = 18, spread = [1.2, 3, 1.2], seed = "mote", size = 0.11, opacity = 1 }) => (
  <group position={center}>
    {Array.from({ length: count }, (_, i) => {
      const life = ((t * (0.35 + random(`${seed}v${i}`) * 0.4) + random(`${seed}o${i}`)) % 1 + 1) % 1;
      const a = random(`${seed}a${i}`) * Math.PI * 2 + t * 0.6;
      const r = 0.3 + random(`${seed}r${i}`) * 0.7;
      return (
        <mesh key={i} position={[Math.cos(a) * r * spread[0], (life - 0.5) * spread[1], Math.sin(a) * r * spread[2]]} rotation={[i, t + i, 0]}>
          <BoxG args={[size, size, size]} />
          <Glow color={i % 3 ? VIOLET : "#F3C4FF"} opacity={Math.sin(life * Math.PI) * opacity} />
        </mesh>
      );
    })}
  </group>
);

/**
 * A very tall, thin, black figure with long arms and glowing violet eyes. Faces +Z.
 * `headYaw` turns the head, `jaw` 0..1 drops the lower jaw (the scream), `reach` 0..1 raises the arms forward,
 * `walk` is a stride phase, `appear` 0..1 stretches it in from a thin line (teleport).
 */
export const TallOne: React.FC<{ position?: V3; yaw?: number; scale?: number; headYaw?: number; headPitch?: number; jaw?: number; reach?: number; walk?: number; appear?: number; t?: number; shakeHead?: number }> = ({
  position = [0, 0, 0],
  yaw = 0,
  scale = 1,
  headYaw = 0,
  headPitch = 0,
  jaw = 0,
  reach = 0,
  walk,
  appear = 1,
  t = 0,
  shakeHead = 0,
}) => {
  if (appear <= 0) return null;
  const k = ease(appear);
  const s = walk === undefined ? 0 : Math.sin(walk * Math.PI * 2);
  const armEnd = (sx: number): V3 => {
    const pitch = reach * 1.45 + (walk === undefined ? 0 : -sx * s * 0.35 * (1 - reach));
    return [sx * (0.66 + reach * -0.12), TALL.shoulderY - Math.cos(pitch) * 2.9, Math.sin(pitch) * 2.9];
  };
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={[scale * (0.08 + 0.92 * k), scale * (1.25 - 0.25 * k), scale * (0.08 + 0.92 * k)]}>
      {[-1, 1].map((sx) => {
        const foot: V3 = [sx * 0.24, 0.1, Math.sin(sx * s * 0.42) * 3.1];
        return <Strut key={sx} a={[sx * 0.24, 3.2, 0]} b={foot} w={0.26} color={VOID} />;
      })}
      <mesh position={[0, 3.85, 0]} castShadow>
        <BoxG args={[0.95, 1.3, 0.46]} />
        <Flat color="#1B1724" />
      </mesh>
      {[-1, 1].map((sx) => (
        <Strut key={`a${sx}`} a={[sx * 0.62, TALL.shoulderY, 0]} b={armEnd(sx)} w={0.22} color={VOID} />
      ))}
      <group position={[0, TALL.headY, 0]} rotation={[-headPitch, headYaw + Math.sin(t * 60) * 0.06 * shakeHead, Math.sin(t * 47) * 0.05 * shakeHead]}>
        {/* upper head; the jaw is a separate block that drops */}
        <mesh position={[0, 0.14, 0]} castShadow>
          <BoxG args={[1.0, 0.72, 1.0]} />
          <Flat color="#1B1724" />
        </mesh>
        <mesh position={[0, -0.36 - jaw * 0.42, 0]} castShadow>
          <BoxG args={[1.0, 0.28, 1.0]} />
          <Flat color="#1B1724" />
        </mesh>
        {jaw > 0.02 ? (
          <mesh position={[0, -0.22 - jaw * 0.21, 0.02]}>
            <BoxG args={[0.86, jaw * 0.42 + 0.02, 0.9]} />
            <Flat color="#3A1248" />
          </mesh>
        ) : null}
        {[-1, 1].map((sx) => (
          <React.Fragment key={sx}>
            <mesh position={[sx * 0.26, 0.12, 0.51]}>
              <BoxG args={[0.36, 0.12 + jaw * 0.06, 0.03]} />
              <Glow color={VIOLET} />
            </mesh>
            <mesh position={[sx * 0.26, 0.12, 0.525]}>
              <BoxG args={[0.12, 0.12 + jaw * 0.06, 0.02]} />
              <Glow color="#F9E0FF" />
            </mesh>
          </React.Fragment>
        ))}
        <Halo position={[0, 0.12, 0.7]} size={1.6 + jaw * 1.6} color={VIOLET} opacity={0.45 + jaw * 0.3} />
      </group>
      <Motes center={[0, 3, 0]} t={t} count={16} spread={[1.3, 5.4, 1.3]} seed="tall" />
    </group>
  );
};

// ================================================================ the three-headed boss (our wither)

const WITHER = "#2B2A32";
const BossHead: React.FC<{ position: V3; size: number; charge: number; yaw?: number }> = ({ position, size, charge, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]} scale={size}>
    <mesh castShadow>
      <BoxG args={[1, 1, 1]} />
      <Flat color={mix(WITHER, "#DDEBFF", charge * 0.7)} />
    </mesh>
    {[-1, 1].map((sx) => (
      <mesh key={sx} position={[sx * 0.24, 0.12, 0.51]}>
        <BoxG args={[0.26, 0.14, 0.03]} />
        <Glow color="#EAF4FF" />
      </mesh>
    ))}
    <mesh position={[0, -0.24, 0.51]}>
      <BoxG args={[0.6, 0.12, 0.03]} />
      <Flat color="#0E0D12" />
    </mesh>
    <Halo position={[0, 0.1, 0.7]} size={1.6} color="#BFD8FF" opacity={0.3 + charge * 0.5} />
  </group>
);

/** A floating three-headed skeleton boss, about 4.6 tall at scale 1 (origin at the centre head). `charge` flashes it pale blue. */
export const Boss: React.FC<{ position?: V3; yaw?: number; scale?: number; t: number; charge?: number; pitch?: number }> = ({ position = [0, 0, 0], yaw = 0, scale = 1, t, charge = 0, pitch = 0.18 }) => {
  const bob = Math.sin(t * 2.4) * 0.18;
  const col = mix(WITHER, "#DDEBFF", charge * 0.7);
  return (
    <group position={[position[0], position[1] + bob * scale, position[2]]} rotation={[pitch, yaw, 0]} scale={scale}>
      <BossHead position={[0, 0, 0]} size={1.3} charge={charge} />
      <BossHead position={[-1.6, -0.35 + Math.sin(t * 3.1) * 0.06, -0.05]} size={0.95} charge={charge} yaw={-0.25} />
      <BossHead position={[1.6, -0.35 + Math.sin(t * 3.1 + 2) * 0.06, -0.05]} size={0.95} charge={charge} yaw={0.25} />
      <mesh position={[0, -1.05, -0.15]} castShadow>
        <BoxG args={[3.5, 0.42, 0.42]} />
        <Flat color={col} />
      </mesh>
      <Strut a={[0, -0.7, -0.15]} b={[0, -3.1, -0.75]} w={0.4} color={col} />
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, -1.65 - i * 0.45, -0.28 - i * 0.11]} castShadow>
          <BoxG args={[1.7 - i * 0.25, 0.2, 0.34]} />
          <Flat color={col} />
        </mesh>
      ))}
      <Strut a={[0, -3.1, -0.75]} b={[0, -3.9, -1.35]} w={0.3} color={col} />
      <Halo position={[0, -1, 0]} size={7 + charge * 6} color="#9FC4FF" opacity={0.16 + charge * 0.5} />
    </group>
  );
};

/** The boss's shot: a small dark skull with a pale-blue trail, from `from` to `to`. */
export const SkullShot: React.FC<{ from: V3; to: V3; progress: number; size?: number }> = ({ from, to, progress, size = 1 }) => {
  if (progress <= 0 || progress >= 1) return null;
  const at = (u: number): V3 => [from[0] + (to[0] - from[0]) * u, from[1] + (to[1] - from[1]) * u, from[2] + (to[2] - from[2]) * u];
  const p = at(progress);
  return (
    <group>
      <Strut a={at(Math.max(0, progress - 0.16))} b={p} w={0.3 * size} color="#BFD8FF" glow />
      <mesh position={p} rotation={[progress * 6, progress * 4, 0]}>
        <BoxG args={[size, size, size]} />
        <Flat color="#17161C" />
      </mesh>
      <Halo position={p} size={4 * size} color="#9FC4FF" opacity={0.6} />
    </group>
  );
};

/** The summoning shape: a T of dark blocks with up to three small skulls on top. `glow` 0..1 lights it up. */
export const Altar: React.FC<{ position?: V3; skulls?: number; glow?: number; third?: V3 | null }> = ({ position = [0, 0, 0], skulls = 3, glow = 0, third = null }) => {
  const block = mix("#4A3A30", "#DDEBFF", glow * 0.8);
  return (
    <group position={position}>
      {([[0, 0.55, 0], [-1.1, 1.65, 0], [0, 1.65, 0], [1.1, 1.65, 0]] as V3[]).map((p, i) => (
        <mesh key={i} position={p} castShadow receiveShadow>
          <BoxG args={[1.1, 1.1, 1.1]} />
          <Flat color={i % 2 ? block : mix(block, "#000000", 0.12)} />
        </mesh>
      ))}
      {[-1.1, 0, 1.1].slice(0, skulls).map((x, i) => (
        <BossHead key={i} position={i === 2 && third ? third : [x, 2.55, 0]} size={0.68} charge={glow} />
      ))}
      {glow > 0 ? <Halo position={[0, 2, 0.4]} size={6 + glow * 10} color="#BFD8FF" opacity={glow * 0.8} /> : null}
    </group>
  );
};

// ================================================================ fire, spawn puffs, the sun

/** Flickering flames (for mobs caught in daylight). `size` is the overall height. */
export const Flames: React.FC<{ position: V3; size?: number; t: number; seed?: string; amount?: number }> = ({ position, size = 1.4, t, seed = "fl", amount = 1 }) => {
  if (amount <= 0) return null;
  return (
    <group position={position} scale={size * ease(amount)}>
      {Array.from({ length: 6 }, (_, i) => {
        const ph = t * (5 + random(`${seed}f${i}`) * 4) + i * 1.7;
        const h = 0.55 + Math.sin(ph) * 0.22 + random(`${seed}h${i}`) * 0.3;
        const a = (i / 6) * Math.PI * 2;
        const r = i === 0 ? 0 : 0.32;
        return (
          <mesh key={i} position={[Math.cos(a) * r, h * 0.5, Math.sin(a) * r]} rotation={[0, ph * 0.4, 0]}>
            <ConeG args={[0.26, h, 5]} />
            <Glow color={i % 3 === 0 ? P.fireCore : i % 3 === 1 ? P.fire : "#F18E1C"} opacity={0.95} />
          </mesh>
        );
      })}
      <Halo position={[0, 0.5, 0]} size={3.2} color={P.fire} opacity={0.5} />
    </group>
  );
};

/** A quick puff of pale blocks where a mob pops into the world. `k` 0..1. */
export const Poof: React.FC<{ position: V3; k: number; size?: number; seed?: string; color?: string }> = ({ position, k, size = 1, seed = "poof", color = "#EDEAF6" }) => {
  if (k <= 0 || k >= 1) return null;
  const g = ease(k);
  return (
    <group position={position}>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + random(`${seed}${i}`);
        const r = (0.5 + g * 2.0) * size;
        const y = (0.6 + random(`${seed}y${i}`) * 3.2 + g * 0.8) * size;
        const s = (0.5 - g * 0.42) * size;
        return (
          <mesh key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r]} rotation={[i, g * 3 + i, 0]}>
            <BoxG args={[s, s, s]} />
            <Glow color={color} opacity={1 - g * 0.8} />
          </mesh>
        );
      })}
    </group>
  );
};

/** The sun (or a low sunset/sunrise sun): a bright disc with a big halo. Not fogged. */
export const SunDisc: React.FC<{ position: V3; r?: number; color?: string; glow?: string; halo?: number }> = ({ position, r = 20, color = "#FFE9B0", glow = "#FFB25A", halo = 0.6 }) => (
  <group>
    <mesh position={position}>
      <circleGeometry args={[r, 20]} />
      <Glow color={color} fog={false} />
    </mesh>
    <Halo position={[position[0], position[1], position[2] + 1]} size={r * 9} color={glow} opacity={halo} />
  </group>
);

/** A small pile of ash with a wisp, where a mob burned away. */
export const AshPile: React.FC<{ position: V3; size?: number }> = ({ position, size = 1 }) => (
  <group position={position} scale={size}>
    <mesh position={[0, 0.2, 0]} castShadow>
      <ConeG args={[0.75, 0.4, 6]} />
      <Flat color="#4A4648" />
    </mesh>
    <mesh position={[0.3, 0.12, 0.25]}>
      <ConeG args={[0.4, 0.24, 5]} />
      <Flat color="#6A6668" />
    </mesh>
  </group>
);

// ================================================================ sets

/** Slavoski's street: houses at hero scale on both sides of a road along Z. House `i` on side `s` sits at x = s·15, z = 18 − 18·i. */
export const SUBURB = { houseX: 15, step: 18, first: 18, pavement: 6.2, roadHalf: 4.5 };
export const houseZ = (i: number) => SUBURB.first - SUBURB.step * i;
const HOUSE_COLORS = ["#E8DCC4", "#C9D6E0", "#E0C9B4", "#D4E0C4", "#E6D2D2"];
const ROOFS = ["#C8372D", "#566270", "#5A4A78", "#2E5A6A", "#8A4A2E"];

export const Mailbox: React.FC<{ position: V3; yaw?: number; lean?: number }> = ({ position, yaw = 0, lean = 0 }) => (
  <group position={position} rotation={[0, yaw, lean]}>
    <mesh position={[0, 0.8, 0]} castShadow>
      <BoxG args={[0.14, 1.6, 0.14]} />
      <Flat color="#5A3E2E" />
    </mesh>
    <mesh position={[0, 1.78, 0]} castShadow>
      <BoxG args={[0.5, 0.44, 0.86]} />
      <Flat color="#C8372D" />
    </mesh>
    <mesh position={[0.28, 1.95, 0.2]}>
      <BoxG args={[0.05, 0.36, 0.1]} />
      <Flat color={P.amber} />
    </mesh>
  </group>
);

/** Where a house used to be: a scorched pit, a ring of rubble, a few charred beams. */
export const Crater: React.FC<{ position: V3; r?: number }> = ({ position, r = 6.5 }) => (
  <group position={position}>
    <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <CircleG args={[r, 14]} />
      <Flat color="#2A2622" />
    </mesh>
    <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <CircleG args={[r * 0.55, 10]} />
      <Flat color="#17140F" />
    </mesh>
    {Array.from({ length: 22 }, (_, i) => {
      const a = (i / 22) * Math.PI * 2 + random(`cr${i}`) * 0.2;
      const d = r * (0.82 + random(`crd${i}`) * 0.3);
      const s = 0.4 + random(`crs${i}`) * 0.7;
      return (
        <mesh key={i} position={[Math.cos(a) * d, s * 0.35, Math.sin(a) * d]} rotation={[random(`crx${i}`), random(`cry${i}`) * 3, random(`crz${i}`)]} castShadow>
          <BoxG args={[s, s * 0.7, s * 1.2]} />
          <Flat color={i % 3 === 0 ? "#E8DCC4" : i % 3 === 1 ? "#5A3E2E" : "#4A4648"} />
        </mesh>
      );
    })}
    {[0.4, 2.2, 4.1].map((a, i) => (
      <Strut key={i} a={[Math.cos(a) * 2.2, 0.1, Math.sin(a) * 2.2]} b={[Math.cos(a) * 3.1, 2.4 + i * 0.5, Math.sin(a) * 3.4]} w={0.28} color="#2A1E18" />
    ))}
  </group>
);

export const Suburb: React.FC<{ gone?: [number, number] | null; lit?: boolean; count?: number; children?: React.ReactNode }> = ({ gone = null, lit = false, count = 6, children }) => (
  <group>
    <Ground color="#4E8A52" />
    <Road width={SUBURB.roadHalf * 2} length={400} />
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * (SUBURB.roadHalf + 1.75), 0.06, -60]} receiveShadow>
        <BoxG args={[3.5, 0.12, 400]} />
        <Flat color={P.pavement} />
      </mesh>
    ))}
    {[-1, 1].flatMap((s) =>
      Array.from({ length: count }, (_, i) => {
        const z = houseZ(i);
        const key = `${s}:${i}`;
        const isGone = gone && gone[0] === s && gone[1] === i;
        return (
          <React.Fragment key={key}>
            {isGone ? (
              <Crater position={[s * SUBURB.houseX, 0, z]} />
            ) : (
              <>
                <House position={[s * SUBURB.houseX, 0, z]} yaw={s > 0 ? -Math.PI / 2 : Math.PI / 2} color={HOUSE_COLORS[(i * 2 + (s > 0 ? 0 : 3)) % 5]} roof={ROOFS[(i + (s > 0 ? 1 : 3)) % 5]} lit={lit} />
                {/* garden path to the door */}
                <mesh position={[s * 9.7, 0.04, z]} receiveShadow>
                  <BoxG args={[3.6, 0.08, 1.7]} />
                  <Flat color="#B8AE98" />
                </mesh>
              </>
            )}
            <Mailbox position={[s * 8.6, 0, z + 2.6]} yaw={s > 0 ? Math.PI / 2 : -Math.PI / 2} lean={isGone ? 0.3 : 0} />
            <LeafyTree position={[s * (SUBURB.houseX + 1.5), 0, z - 9]} scale={1.5 + random(`st${key}`) * 0.5} seed={`st${key}`} />
          </React.Fragment>
        );
      }),
    )}
    <HillRing radius={190} count={22} />
    <Skyline radius={150} count={22} arc={[Math.PI * 0.75, Math.PI * 1.25]} power={lit ? 1 : 0.35} />
    {children}
  </group>
);

/** A corridor along Z inside Slavoski's house: |x| < 2.2, from z = 8 back to z = −40. */
export const HALL = { half: 2.2, far: -40, h: 6 };
export const Hallway: React.FC<{ flicker?: number }> = ({ flicker = 1 }) => (
  <group>
    <mesh position={[0, -0.05, -16]} receiveShadow>
      <BoxG args={[HALL.half * 2, 0.1, 50]} />
      <Flat color="#5A4636" />
    </mesh>
    <mesh position={[0, 0.01, -16]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[1.9, 48]} />
      <Flat color="#7A3A4A" />
    </mesh>
    <mesh position={[0, HALL.h + 0.05, -16]}>
      <BoxG args={[HALL.half * 2, 0.1, 50]} />
      <Flat color="#C9C2B4" />
    </mesh>
    {[-1, 1].map((s) => (
      <React.Fragment key={s}>
        <mesh position={[s * (HALL.half + 0.1), HALL.h / 2, -16]} receiveShadow>
          <BoxG args={[0.2, HALL.h, 50]} />
          <Flat color={s > 0 ? "#3F5A6A" : "#46627A"} />
        </mesh>
        <mesh position={[s * (HALL.half - 0.02), 0.25, -16]}>
          <BoxG args={[0.06, 0.5, 50]} />
          <Flat color="#E6E0D4" />
        </mesh>
        {[0, 1, 2, 3].map((i) => {
          const z = -3 - i * 10 - (s > 0 ? 0 : 5);
          return (
            <React.Fragment key={i}>
              <mesh position={[s * (HALL.half - 0.01), 2.35, z]} rotation={[0, -s * Math.PI / 2, 0]}>
                <planeGeometry args={[2.2, 4.7]} />
                <Flat color="#5A3E2E" />
              </mesh>
              <mesh position={[s * (HALL.half - 0.06), 2.3, z + 0.8]}>
                <BoxG args={[0.1, 0.16, 0.16]} />
                <Flat color={P.amber} />
              </mesh>
              <mesh position={[s * (HALL.half - 0.02), 3.5, z + 4.6]} rotation={[0, -s * Math.PI / 2, 0]}>
                <planeGeometry args={[1.3, 1.0]} />
                <Flat color={["#E0B04E", "#2E5A6A", "#C8372D", "#8FB3D9"][(i + (s > 0 ? 0 : 2)) % 4]} />
              </mesh>
            </React.Fragment>
          );
        })}
      </React.Fragment>
    ))}
    <mesh position={[0, HALL.h / 2, HALL.far - 0.9]}>
      <BoxG args={[HALL.half * 2 + 0.4, HALL.h, 0.2]} />
      <Flat color="#39505E" />
    </mesh>
    <mesh position={[0, 3.4, HALL.far - 0.78]}>
      <planeGeometry args={[1.8, 2.2]} />
      <Glow color="#2A3A6A" />
    </mesh>
    {[-4, -16, -28].map((z) => (
      <React.Fragment key={z}>
        <mesh position={[0, HALL.h - 0.12, z]}>
          <BoxG args={[0.9, 0.12, 0.9]} />
          <Glow color={mix("#3A3430", "#FFE2B0", flicker)} />
        </mesh>
        <pointLight position={[0, HALL.h - 0.8, z]} color="#FFD9A8" intensity={16 * flicker} distance={16} decay={2} />
      </React.Fragment>
    ))}
  </group>
);

// ================================================================ overlays

/** A big comic sound word ("SSSSSSSS!", "BOOM!"). `k` is seconds since it appeared. */
export const SoundWord: React.FC<{ text: string; k: number; y?: number; color?: string; size?: number; jitter?: number }> = ({ text, k, y = 470, color = "#8BE27A", size = 104, jitter = 5 }) => {
  if (k < 0) return null;
  const s = k < 0.12 ? 0.6 + (k / 0.12) * 0.5 : 1.1 - Math.min(0.1, (k - 0.12) * 0.8);
  const jx = (random(`sw${Math.floor(k * 30)}x`) - 0.5) * jitter * 2;
  const jy = (random(`sw${Math.floor(k * 30)}y`) - 0.5) * jitter * 2;
  const outline: string[] = [];
  for (let a = 0; a < 16; a++) outline.push(`${(Math.cos((a / 16) * Math.PI * 2) * 6).toFixed(1)}px ${(Math.sin((a / 16) * Math.PI * 2) * 6).toFixed(1)}px 0 ${P.ink}`);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 150,
          width: 780,
          top: y,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: size,
          letterSpacing: "0.02em",
          color,
          textShadow: `${outline.join(", ")}, 0 12px 24px rgba(0,0,0,0.5)`,
          transform: `translate(${jx}px, ${jy}px) scale(${s}) rotate(-4deg)`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

/** A full-frame colour flash (explosions, teleports). */
export const Flash: React.FC<{ k: number; color?: string }> = ({ k, color = "#FFFFFF" }) => (k <= 0 ? null : <AbsoluteFill style={{ background: color, opacity: clamp01(k), pointerEvents: "none" }} />);
