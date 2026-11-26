/**
 * Props for "What If Every Human Got a Random Superpower?" (ep. 8).
 * Generic, original superpowers only: no capes, emblems or costumes from any comic brand.
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { Ground, Road } from "../../slavoski/city";
import { BoxG, CircleG, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { crowdLook, type HeroLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Bush, LeafyTree } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { Hero, mergePose, REST, type Pose } from "../../slavoski/rig/Hero";
import { CANVAS_FONT, CanvasPanel, fitText } from "../../slavoski/screens";
import { HillRing, House } from "../no-work-2036/props";

/** One colour per power, used for auras, streams and orbs. */
export const POWER_COLORS = {
  flight: "#6FD3FF",
  teleport: "#B58CFF",
  strength: "#FF7A3A",
  mind: "#7FFFE0",
  invisible: "#C9E6FF",
  fire: "#FFB24A",
  ice: "#9FE8FF",
  lucky: "#FFE07A",
  socks: "#FF6FB5",
} as const;
export const AURA_LIST = [POWER_COLORS.flight, POWER_COLORS.teleport, POWER_COLORS.strength, POWER_COLORS.mind, POWER_COLORS.fire, POWER_COLORS.ice, "#7ED957", "#FF6FB5"];

/** The lucky one: an ordinary person in a grey hoodie and jeans (never orange). */
export const LUCKY: HeroLook = { ...crowdLook(41), jacket: "#6A6E78", jacketShade: "#585C66", zipper: "#8A8E98", jeans: "#2A3A5A", hair: "#2A1E18" };
/** Mind readers' eyes read pale cyan. */
export const MIND_LOOK: HeroLook = { ...crowdLook(17), eyeWhite: "#BFFFF2", jacket: "#2E5A6A", jacketShade: "#244A58" };
/** Recruits in navy fatigues (generic, no insignia). */
export const RECRUIT = (seed: number): HeroLook => ({ ...crowdLook(seed), jacket: "#2C3A52", jacketShade: "#232F44", zipper: "#3A4A64", jeans: "#232F44", shoe: "#141418" });

// ================================================================ glow effects

/** Small glowing sparks orbiting a centre (seeded, frame-driven). */
export const Sparks: React.FC<{ center: V3; t: number; color: string; count?: number; radius?: number; height?: number; size?: number; seed?: string; k?: number }> = ({
  center,
  t,
  color,
  count = 10,
  radius = 1.4,
  height = 4,
  size = 0.09,
  seed = "spk",
  k = 1,
}) => {
  if (k <= 0) return null;
  return (
    <group position={center}>
      {Array.from({ length: count }, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2 + t * (1.2 + random(`${seed}s${i}`) * 1.6);
        const y = ((random(`${seed}y${i}`) + t * (0.25 + random(`${seed}v${i}`) * 0.3)) % 1) * height;
        const r = radius * (0.75 + random(`${seed}r${i}`) * 0.4);
        const fade = Math.sin((y / height) * Math.PI);
        return (
          <mesh key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r]} scale={k * (0.6 + fade * 0.6)}>
            <IcoG args={[size, 0]} />
            <Glow color={color} opacity={0.9} additive />
          </mesh>
        );
      })}
    </group>
  );
};

/** A power aura around a standing person (feet at `position`): soft glow, a shimmer shell, a ground ring, sparks. */
export const Aura: React.FC<{ position: V3; color: string; t: number; k?: number; scale?: number; seed?: string; shell?: boolean }> = ({
  position,
  color,
  t,
  k = 1,
  scale = 1,
  seed = "aura",
  shell = false,
}) => {
  if (k <= 0) return null;
  const pulse = 1 + Math.sin(t * 7 + random(seed) * 6) * 0.06;
  return (
    <group position={position} scale={scale}>
      <Halo position={[0, 2.3, 0]} size={6.5 * k * pulse} color={color} opacity={0.55 * k} />
      {shell ? (
        <mesh position={[0, 2.25, 0]}>
          <CylG args={[1.25, 1.45, 4.7, 10, 1, true]} />
          <meshBasicMaterial color={color} transparent opacity={0.12 * k} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ) : null}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, t * 1.5]}>
        <ringGeometry args={[1.35 * pulse, 1.6 * pulse, 18]} />
        <meshBasicMaterial color={color} transparent opacity={0.7 * k} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <Sparks center={[0, 0.2, 0]} t={t} color={color} seed={`${seed}s`} k={k} />
    </group>
  );
};

/** A horizontal ring of light descending over someone (the moment powers arrive). `k` 0..1 = top → feet. */
export const DescendRing: React.FC<{ position: V3; k: number; color?: string; radius?: number; top?: number }> = ({ position, k, color = P.amber, radius = 1.7, top = 5.4 }) => {
  if (k <= 0 || k >= 1) return null;
  const y = top * (1 - ease(k));
  const o = Math.sin(k * Math.PI);
  return (
    <group position={position}>
      <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.07, 6, 40]} />
        <meshBasicMaterial color={color} transparent opacity={o} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.2, radius, 32]} />
        <meshBasicMaterial color={color} transparent opacity={o * 0.18} blending={THREE.AdditiveBlending} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <Halo position={[0, y, 0]} size={radius * 4} color={color} opacity={o * 0.45} />
    </group>
  );
};

/** A golden wave sweeping out over the ground from `center`: a bright ground ring plus a shimmering wall. */
export const PowerWave: React.FC<{ center: V3; radius: number; color?: string; height?: number; opacity?: number }> = ({ center, radius, color = P.amber, height = 7, opacity = 1 }) => {
  if (radius <= 0.1) return null;
  return (
    <group position={center}>
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.max(0.05, radius - 1.6), radius, 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.85 * opacity} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius, height, 96, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.22 * opacity} blending={THREE.AdditiveBlending} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

/** A tapered speed trail (emissive cone) behind a moving object, pointing along -Z of its group. */
export const SpeedTrail: React.FC<{ length: number; radius?: number; color?: string; opacity?: number }> = ({ length, radius = 0.7, color = "#E8F6FF", opacity = 0.5 }) => (
  <mesh position={[0, 0, -length / 2]} rotation={[-Math.PI / 2, 0, 0]}>
    <coneGeometry args={[radius, length, 10, 1, true]} />
    <meshBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
  </mesh>
);

/** The flying pose (before the body is tipped forward): one fist leading, the other arm back, legs together. */
export const FLY_POSE: Pose = mergePose(REST, {
  headPitch: 0.95,
  rShoulder: [2.95, 0.05],
  rElbow: 0.05,
  lShoulder: [-0.2, 0.18],
  lElbow: 0.1,
  lHip: [-0.1, 0.02],
  rHip: [0.05, 0.02],
  lKnee: 0.25,
  rKnee: 0.1,
  expression: "smile",
});

/**
 * A flyer: a person tipped forward to fly along +Z of the group (chest at the origin), with a speed trail.
 * Use `yaw`/`pitch` to aim; `tip` 0 = upright (taking off) … 1 = horizontal.
 */
export const Flyer: React.FC<{ position: V3; yaw?: number; pitch?: number; tip?: number; look?: HeroLook; pose?: Pose; trail?: number; trailColor?: string; aura?: string; t?: number; scale?: number }> = ({
  position,
  yaw = 0,
  pitch = 0,
  tip = 1,
  look,
  pose = FLY_POSE,
  trail = 0,
  trailColor = "#E8F6FF",
  aura,
  t = 0,
  scale = 1,
}) => (
  <group position={position} rotation={[0, yaw, 0]} scale={scale}>
    <group rotation={[pitch, 0, 0]}>
      {trail > 0 ? <SpeedTrail length={trail} radius={0.9} color={aura ?? trailColor} opacity={0.2} /> : null}
      {aura ? <Halo position={[0, 0, 0]} size={7} color={aura} opacity={0.5} /> : null}
      <group rotation={[(Math.PI / 2) * tip, 0, 0]}>
        <group position={[0, -2.3, 0]}>
          <Hero pose={pose} look={look} />
        </group>
      </group>
      {aura ? <Sparks center={[0, -1.5, -1]} t={t} color={aura} radius={1.2} height={3} count={8} /> : null}
    </group>
  </group>
);

/** Yaw and pitch that aim a Flyer (forward = +Z) from `a` toward `b`. */
export const aim = (a: V3, b: V3): { yaw: number; pitch: number } => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  return { yaw: Math.atan2(dx, dz), pitch: -Math.atan2(dy, Math.hypot(dx, dz)) };
};
export const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

// ================================================================ vehicles and big props

/** A generic olive tank (no markings), facing +Z. Hull top at y = 2.2; length ≈ 10. */
export const TANK = { length: 10, width: 5.2, hullTop: 2.2 };
export const Tank: React.FC<{ position: V3; rotation?: V3; turret?: number; scale?: number }> = ({ position, rotation = [0, 0, 0], turret = 0, scale = 1 }) => {
  const olive = "#5A6A3A";
  const dark = "#3E4A2A";
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 2.0, 0.65, 0]} castShadow>
            <BoxG args={[1.2, 1.3, 9.6]} />
            <Flat color="#2E3226" />
          </mesh>
          {[-3.6, -1.8, 0, 1.8, 3.6].map((z) => (
            <mesh key={z} position={[s * 2.62, 0.62, z]} rotation={[0, 0, Math.PI / 2]}>
              <CylG args={[0.5, 0.5, 0.1, 10]} />
              <Flat color="#4A4E3E" />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 1.65, 0]} castShadow>
        <BoxG args={[4.4, 1.1, TANK.length]} />
        <Flat color={olive} />
      </mesh>
      <group position={[0, 2.2, -0.6]} rotation={[0, turret, 0]}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <BoxG args={[3.0, 1.1, 3.6]} />
          <Flat color={olive} />
        </mesh>
        <mesh position={[0, 0.65, 4.0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <CylG args={[0.2, 0.24, 5.4, 8]} />
          <Flat color={dark} />
        </mesh>
        <mesh position={[0.6, 1.25, -0.4]} castShadow>
          <CylG args={[0.5, 0.5, 0.25, 10]} />
          <Flat color={dark} />
        </mesh>
      </group>
    </group>
  );
};

/** A faceted flying saucer (generic UFO) with rim lights and an optional tractor beam. Radius ≈ 7. */
export const Saucer: React.FC<{ position: V3; t: number; beam?: number; tilt?: number; scale?: number }> = ({ position, t, beam = 0, tilt = 0, scale = 1 }) => (
  <group position={position} rotation={[tilt, t * 0.6, tilt * 0.5]} scale={scale}>
    <mesh scale={[1, 0.22, 1]} castShadow>
      <IcoG args={[7, 1]} />
      <Flat color="#8A90A0" />
    </mesh>
    <mesh position={[0, 1.0, 0]} scale={[1, 0.75, 1]}>
      <IcoG args={[2.6, 1]} />
      <Glow color="#7FFFE0" opacity={0.85} />
    </mesh>
    {Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2;
      const on = Math.sin(t * 9 + i * 1.3) > -0.2;
      return (
        <mesh key={i} position={[Math.cos(a) * 6.2, -0.1, Math.sin(a) * 6.2]}>
          <IcoG args={[0.32, 0]} />
          <Glow color={on ? "#FFE07A" : "#6A5A3A"} />
        </mesh>
      );
    })}
    {beam > 0 ? (
      <mesh position={[0, -12, 0]}>
        <cylinderGeometry args={[1.6, 6.5, 24, 16, 1, true]} />
        <meshBasicMaterial color="#9FFFE8" transparent opacity={0.22 * beam} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    ) : null}
    <Halo position={[0, -0.5, 0]} size={18} color="#7FFFE0" opacity={0.35} />
  </group>
);

/** A searchlight beam from the ground, swinging with `t`. */
export const Searchlight: React.FC<{ position: V3; t: number; seed?: string; length?: number; color?: string }> = ({ position, t, seed = "sl", length = 120, color = "#DCE6FF" }) => {
  const a = Math.sin(t * 0.7 + random(seed) * 6) * 0.45;
  const b = 0.25 + Math.sin(t * 0.5 + random(`${seed}b`) * 6) * 0.12;
  return (
    <group position={position} rotation={[b, 0, a]}>
      <mesh position={[0, length / 2, 0]}>
        <cylinderGeometry args={[4.5, 0.5, length, 14, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <Halo position={[0, 0.5, 0]} size={4} color={color} opacity={0.7} />
    </group>
  );
};

/** A spinning gold coin (radius 0.32), for the lucky flip. */
export const Coin: React.FC<{ position: V3; spin: number; scale?: number }> = ({ position, spin, scale = 1 }) => (
  <group position={position} rotation={[spin, 0.3, 0]} scale={scale}>
    <mesh>
      <CylG args={[0.32, 0.32, 0.06, 16]} />
      <Flat color="#E8B84A" />
    </mesh>
    <mesh position={[0, 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <CircleG args={[0.22, 12]} />
      <Glow color="#FFE07A" />
    </mesh>
    <Halo size={1.2} color="#FFE07A" opacity={0.45} />
  </group>
);

/** A graduate's cap sitting on a head centred at `head` (head radius 0.68). */
export const Mortarboard: React.FC<{ head: V3; tilt?: number }> = ({ head, tilt = 0.08 }) => (
  <group position={[head[0], head[1] + 0.74, head[2]]} rotation={[tilt, 0.4, 0]}>
    <mesh castShadow>
      <BoxG args={[1.0, 0.26, 1.0]} />
      <Flat color="#1A1A22" />
    </mesh>
    <mesh position={[0, 0.17, 0]} castShadow>
      <BoxG args={[1.7, 0.08, 1.7]} />
      <Flat color="#22222C" />
    </mesh>
    <mesh position={[0.62, -0.05, 0.62]}>
      <BoxG args={[0.06, 0.5, 0.06]} />
      <Flat color={P.amber} />
    </mesh>
  </group>
);

/** A rolled diploma (cylinder with a red ribbon), centred at `position`, lying along X. */
export const Diploma: React.FC<{ position: V3; rotation?: V3 }> = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation}>
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <CylG args={[0.13, 0.13, 1.1, 10]} />
      <Flat color="#F4EEDC" />
    </mesh>
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <CylG args={[0.15, 0.15, 0.14, 10]} />
      <Flat color="#C8372D" />
    </mesh>
  </group>
);

/** A handbag (for the invisible thief): body 0.9 × 0.7 × 0.35 with a strap, centred at `position`. */
export const Handbag: React.FC<{ position: V3; rotation?: V3 }> = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation}>
    <mesh castShadow>
      <BoxG args={[0.9, 0.7, 0.35]} />
      <Flat color="#8A3A5A" />
    </mesh>
    <mesh position={[0, 0.5, 0]}>
      <torusGeometry args={[0.3, 0.04, 4, 12, Math.PI]} />
      <Flat color="#5A2238" />
    </mesh>
  </group>
);

// ================================================================ sets

/** Sign text drawn on a canvas panel: one or two lines, fitted to the board. */
export const drawBoard = (lines: string[], bg: string, color: string, sub?: string) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = H * 0.03;
  ctx.strokeRect(H * 0.05, H * 0.05, W - H * 0.1, H - H * 0.1);
  const n = lines.length + (sub ? 0.7 : 0);
  const lh = (H * 0.8) / n;
  lines.forEach((l, i) => fitText(ctx, l, W / 2, H * 0.1 + lh * (i + 0.55), W * 0.86, lh * 0.78, color));
  if (sub) {
    ctx.font = CANVAS_FONT(lh * 0.42, false);
    fitText(ctx, sub, W / 2, H * 0.1 + lh * (lines.length + 0.35), W * 0.8, lh * 0.42, color, false);
  }
};

/**
 * A sunny suburb at hero scale: a road along X at z = 0 (|z| < 5), pavements, houses (×1.4) behind
 * lawns on both sides (back row faces +Z at z = -17, front row faces -Z at z = +17), trees, bushes,
 * picket fences, hills and a far row of roofs. `skip` drops houses by index (to clear a camera line).
 */
export const HOUSE_XS = [-48, -32, -16, 0, 16, 32, 48];
export const Suburb: React.FC<{ seed?: string; front?: boolean; lit?: boolean; skip?: number[] }> = ({ seed = "sub", front = true, lit = false, skip = [] }) => {
  const colors = ["#E8DCC4", "#C9D8E6", "#E6C8B4", "#D8E6C9", "#F0E2A8", "#D6CDE8"];
  const roofs = ["#C8372D", "#5A4A78", "#2E5A6A", "#8A4A2C", "#3A4A5A"];
  return (
    <group>
      <Ground color="#5E9A52" />
      <Road position={[0, 0, 0]} width={10} length={260} yaw={Math.PI / 2} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0.07, s * 6.2]} receiveShadow>
          <BoxG args={[260, 0.14, 2.4]} />
          <Flat color="#B8B4A8" />
        </mesh>
      ))}
      {HOUSE_XS.map((x, i) => (
        <React.Fragment key={x}>
          {skip.includes(i) ? null : (
            <House position={[x, 0, -17]} color={colors[i % colors.length]} roof={roofs[(i * 2) % roofs.length]} lit={lit} scale={1.4} />
          )}
          {/* driveway */}
          <mesh position={[x + 6.2, 0.03, -10.5]} receiveShadow>
            <BoxG args={[3.2, 0.06, 7.2]} />
            <Flat color="#A8A49A" />
          </mesh>
          {/* picket fence along the back pavement, with a gate gap at the path and the driveway left open */}
          {[
            [x - 5.4, 5.0],
            [x + 2.45, 3.9],
          ].map(([cx, w]) => (
            <mesh key={cx} position={[cx, 0.6, -7.8]} castShadow>
              <BoxG args={[w, 1.2, 0.16]} />
              <Flat color="#F4F0E6" />
            </mesh>
          ))}
          <Bush position={[x - 4.6, 0, -10.6]} size={1.7} seed={`${seed}b${i}`} />
          {i % 2 === 0 ? <LeafyTree position={[x + 9.6, 0, -8.8]} scale={2.0} seed={`${seed}t${i}`} /> : null}
          {front ? (
            <>
              <House position={[x + 8, 0, 17]} yaw={Math.PI} color={colors[(i + 3) % colors.length]} roof={roofs[(i + 1) % roofs.length]} lit={lit} scale={1.4} />
              {i % 2 ? <LeafyTree position={[x, 0, 9.6]} scale={2.0} seed={`${seed}f${i}`} /> : null}
            </>
          ) : null}
        </React.Fragment>
      ))}
      {/* far row of roofs and the hills */}
      {Array.from({ length: 14 }, (_, i) => (
        <House key={`far${i}`} position={[-130 + i * 20, 0, -70 - (i % 3) * 8]} color={colors[(i + 2) % colors.length]} roof={roofs[i % roofs.length]} lit={lit} scale={1.3} />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <LeafyTree key={`ft${i}`} position={[-120 + i * 22 + random(`${seed}ft${i}`) * 8, 0, -56 - random(`${seed}fz${i}`) * 10]} scale={2.6} seed={`${seed}ft${i}`} />
      ))}
      <HillRing radius={190} color="#4F7A5A" />
    </group>
  );
};

/** Stepped plinth for the new social order: `TIERS` from the ground up; risers labelled on their fronts (+Z). */
export const TIERS = [
  { w: 28, d: 26, h: 7, label: "SUPER STRENGTH" },
  { w: 20, d: 18, h: 7, label: "TELEPORT  ·  MIND" },
  { w: 12, d: 10, h: 7, label: "FLIGHT" },
];
/** Where people stand on tier i: the front strip in front of the tier above (z centre of that strip). */
export const tierStandZ = (i: number) => (i + 1 < TIERS.length ? (TIERS[i].d / 2 + TIERS[i + 1].d / 2) / 2 : 0);
export const tierTop = (i: number) => TIERS.slice(0, i + 1).reduce((s, t) => s + t.h, 0);
export const tierFront = (i: number) => TIERS[i].d / 2;
export const PowerTiers: React.FC<{ t: number; glow?: number }> = ({ t, glow = 1 }) => (
  <group>
    {TIERS.map((tier, i) => {
      const y0 = tierTop(i) - tier.h;
      const top = i === TIERS.length - 1;
      return (
        <group key={i}>
          <mesh position={[0, y0 + tier.h / 2, 0]} castShadow receiveShadow>
            <BoxG args={[tier.w, tier.h, tier.d]} />
            <Flat color={["#8E96A6", "#A2A9B6", "#C9CED8"][i]} />
          </mesh>
          <CanvasPanel
            position={[0, y0 + tier.h / 2, tier.d / 2 + 0.03]}
            w={Math.min(tier.w * 0.82, 18)}
            h={2.6}
            draw={drawBoard([tier.label], top ? "#3A2A10" : "#1D274B", top ? P.amber : "#F6EBC4")}
          />
          {top ? <Halo position={[0, y0 + tier.h + 3, 0]} size={26 * glow * (1 + Math.sin(t * 3) * 0.05)} color={P.amber} opacity={0.5 * glow} /> : null}
        </group>
      );
    })}
  </group>
);

/** A recruitment desk with a sign board on two posts (sign faces +Z, centred at x = 0). */
export const RECRUIT_DESK = { top: 1.8, z: 0, w: 8, d: 2.4, signY: 7.0, signW: 7.2, signH: 2.6 };
export const RecruitDesk: React.FC<{ position: V3 }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, RECRUIT_DESK.top / 2, 0]} castShadow receiveShadow>
      <BoxG args={[RECRUIT_DESK.w, RECRUIT_DESK.top, RECRUIT_DESK.d]} />
      <Flat color="#3A4A64" />
    </mesh>
    <mesh position={[0, RECRUIT_DESK.top + 0.05, 0]}>
      <BoxG args={[RECRUIT_DESK.w + 0.3, 0.1, RECRUIT_DESK.d + 0.3]} />
      <Flat color="#C9CED8" />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * (RECRUIT_DESK.signW / 2 - 0.4), RECRUIT_DESK.signY / 2, -3]} castShadow>
        <BoxG args={[0.3, RECRUIT_DESK.signY, 0.3]} />
        <Flat color={P.pole} />
      </mesh>
    ))}
    <mesh position={[0, RECRUIT_DESK.signY, -3.05]}>
      <BoxG args={[RECRUIT_DESK.signW + 0.4, RECRUIT_DESK.signH + 0.4, 0.2]} />
      <Flat color="#141822" />
    </mesh>
    <CanvasPanel position={[0, RECRUIT_DESK.signY, -2.92]} w={RECRUIT_DESK.signW} h={RECRUIT_DESK.signH} draw={drawBoard(["SUPER RECRUITS"], "#1D274B", P.amber, "ALL POWERS WELCOME")} />
    {/* a stack of forms and a stamp */}
    <mesh position={[1.6, RECRUIT_DESK.top + 0.2, 0.3]}>
      <BoxG args={[1.0, 0.3, 0.7]} />
      <Flat color="#F4F0E6" />
    </mesh>
  </group>
);

/** An aircraft hangar (open to +Z): a faceted half-cylinder shell, floor and a back wall. */
export const Hangar: React.FC<{ position?: V3; length?: number; radius?: number }> = ({ position = [0, 0, 0], length = 50, radius = 18 }) => (
  <group position={position}>
    <mesh position={[0, 0, -length / 2]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[radius, radius, length, 12, 1, true, -Math.PI / 2, Math.PI]} />
      <meshLambertMaterial color="#4A5262" flatShading side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 0.02, -length / 2]} receiveShadow>
      <BoxG args={[radius * 2, 0.06, length]} />
      <Flat color="#5A606E" />
    </mesh>
    <mesh position={[0, radius / 2, -length + 0.2]}>
      <BoxG args={[radius * 2, radius, 0.4]} />
      <Flat color="#3A404E" />
    </mesh>
    {[-12, -28, -44].map((z) => (
      <group key={z}>
        <mesh position={[0, radius - 1.2, z]}>
          <BoxG args={[3, 0.3, 1]} />
          <Glow color="#E8ECF5" />
        </mesh>
        <Halo position={[0, radius - 2, z]} size={8} color="#E8ECF5" opacity={0.35} />
      </group>
    ))}
  </group>
);

// ================================================================ crowds and streams

const tmp = new THREE.Object3D();
const tmpColor = new THREE.Color();
/** A dense crowd of simple people (instanced bodies and heads) seen from far away, centred on the origin. */
export const CrowdSea: React.FC<{ radius?: number; count?: number; seed?: string; t?: number; clear?: number }> = ({ radius = 60, count = 1400, seed = "crowd", t = 0, clear = 3.5 }) => {
  const bodies = useRef<THREE.InstancedMesh>(null);
  const heads = useRef<THREE.InstancedMesh>(null);
  const people = useMemo(() => {
    const out: { x: number; z: number; c: string; skin: string; ph: number }[] = [];
    for (let i = 0; out.length < count && i < count * 3; i++) {
      const a = random(`${seed}a${i}`) * Math.PI * 2;
      const r = Math.sqrt(random(`${seed}r${i}`)) * radius;
      if (r < clear) continue;
      const look = crowdLook(i);
      out.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, c: look.jacket, skin: look.skin, ph: random(`${seed}p${i}`) });
    }
    return out;
  }, [radius, count, seed, clear]);
  useLayoutEffect(() => {
    const b = bodies.current;
    const h = heads.current;
    if (!b || !h) return;
    people.forEach((p, i) => {
      const bob = Math.abs(Math.sin(t * 3 + p.ph * 6)) * 0.08;
      tmp.position.set(p.x, 1.6 + bob, p.z);
      tmp.rotation.set(0, p.ph * 6, 0);
      tmp.scale.set(1, 1, 1);
      tmp.updateMatrix();
      b.setMatrixAt(i, tmp.matrix);
      b.setColorAt(i, tmpColor.set(p.c));
      tmp.position.set(p.x, 3.55 + bob, p.z);
      tmp.updateMatrix();
      h.setMatrixAt(i, tmp.matrix);
      h.setColorAt(i, tmpColor.set(p.skin));
    });
    b.instanceMatrix.needsUpdate = true;
    h.instanceMatrix.needsUpdate = true;
    if (b.instanceColor) b.instanceColor.needsUpdate = true;
    if (h.instanceColor) h.instanceColor.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={bodies} args={[undefined, undefined, people.length]} key={`b${people.length}`} castShadow>
        <boxGeometry args={[1.4, 3.2, 0.8]} />
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, people.length]} key={`h${people.length}`} castShadow>
        <icosahedronGeometry args={[0.68, 1]} />
        <meshLambertMaterial flatShading />
      </instancedMesh>
    </group>
  );
};

/** Raindrops stopped in mid-air: small bright beads, instanced (seeded, static). */
export const FrozenRain: React.FC<{ center: V3; size: V3; count?: number; seed?: string }> = ({ center, size, count = 700, seed = "frz" }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    for (let i = 0; i < count; i++) {
      tmp.position.set(center[0] + (random(`${seed}x${i}`) - 0.5) * size[0], center[1] + (random(`${seed}y${i}`) - 0.5) * size[1], center[2] + (random(`${seed}z${i}`) - 0.5) * size[2]);
      tmp.rotation.set(0, 0, 0);
      tmp.scale.set(1, 2.2, 1);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} key={count}>
      <icosahedronGeometry args={[0.035, 0]} />
      <meshBasicMaterial color="#8FB8EE" toneMapped={false} />
    </instancedMesh>
  );
};

/** Glowing orbs flowing along an arc from `from` to `to` (a power being pulled away). */
export const PowerStream: React.FC<{ from: V3; to: V3; t: number; color: string; k?: number; arc?: number; count?: number; seed?: string }> = ({
  from,
  to,
  t,
  color,
  k = 1,
  arc = 2.5,
  count = 12,
  seed = "ps",
}) => {
  if (k <= 0) return null;
  const mid: V3 = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2 + arc, (from[2] + to[2]) / 2];
  const at = (u: number): V3 => {
    const a = (1 - u) * (1 - u);
    const b = 2 * u * (1 - u);
    const c = u * u;
    return [a * from[0] + b * mid[0] + c * to[0], a * from[1] + b * mid[1] + c * to[1], a * from[2] + b * mid[2] + c * to[2]];
  };
  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const u = (i / count + t * 0.9 + random(`${seed}${i}`) * 0.05) % 1;
        const p = at(u);
        const s = (0.1 + 0.12 * Math.sin(u * Math.PI)) * k;
        return (
          <mesh key={i} position={p} scale={s / 0.15}>
            <IcoG args={[0.15, 0]} />
            <Glow color={color} additive opacity={0.95} />
          </mesh>
        );
      })}
      <Halo position={from} size={2.4 * k} color={color} opacity={0.5 * k} />
    </group>
  );
};

/** A small 3D thought bubble (cream disc + three dark dots + two trailing puffs), facing +Z. */
export const ThoughtPuff: React.FC<{ position: V3; scale?: number; yaw?: number; pop?: number }> = ({ position, scale = 1, yaw = 0, pop = 1 }) => {
  const k = clamp01(pop);
  if (k <= 0) return null;
  const s = scale * (0.4 + 0.6 * ease(k));
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={s}>
      <mesh>
        <circleGeometry args={[1.6, 14]} />
        <meshBasicMaterial color="#F6EBC4" toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {[-0.6, 0, 0.6].map((x) => (
        <mesh key={x} position={[x, 0, 0.02]}>
          <circleGeometry args={[0.2, 8]} />
          <meshBasicMaterial color="#14121C" toneMapped={false} />
        </mesh>
      ))}
      {[
        [0.9, -1.9, 0.45],
        [1.4, -2.6, 0.28],
      ].map(([x, y, r]) => (
        <mesh key={x} position={[x, y, 0]}>
          <circleGeometry args={[r, 10]} />
          <meshBasicMaterial color="#F6EBC4" toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

/** A slab of street (asphalt with a lane mark) for the reality-bending shot, centred at its middle. */
export const StreetTile: React.FC<{ position: V3; rotation?: V3; size?: number }> = ({ position, rotation = [0, 0, 0], size = 6 }) => (
  <group position={position} rotation={rotation}>
    <mesh castShadow>
      <BoxG args={[size, 0.8, size]} />
      <Flat color={P.road} />
    </mesh>
    <mesh position={[0, 0.41, 0]}>
      <BoxG args={[0.3, 0.02, size * 0.5]} />
      <Flat color={P.laneMark} />
    </mesh>
    <mesh position={[0, -0.8, 0]} rotation={[Math.PI, 0, 0]}>
      <ConeG args={[size * 0.55, 1.6, 5]} />
      <Flat color={P.sediment} />
    </mesh>
  </group>
);

/** Slavoski with socks: SLAVOSKI's look with a sock colour. */
export const withSocks = (look: HeroLook, sock: string): HeroLook => ({ ...look, sock });
