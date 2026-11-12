/**
 * Props for "What If Nobody Could Speak?" (ep. 9), the first episode with post-processing (bloom, depth of
 * field, grade). Speech is drawn as glowing amber sound waves; when voices are gone the waves crack into
 * grey fragments and fall. Everything is driven by time `t` (seconds) and seeded randomness.
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { Building, Ground } from "../../slavoski/city";
import { BoxG, CircleG, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { CANVAS_FONT, CanvasPanel, fitText } from "../../slavoski/screens";
import type { HeroLook } from "../../slavoski/hero";
import { crowdLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { clamp01, ease, noise3, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { DIM, handPosition, headPosition, mergePose, REST, type Pose } from "../../slavoski/rig/Hero";
import { HillRing, Skyline, Strut } from "../no-work-2036/props";

export const AMBER = "#FFBA58";
const v3 = (p: V3) => new THREE.Vector3(...p);

// ================================================================ sound waves

/**
 * Speech as glowing arcs leaving a mouth along `dir`, drawn in the plane that contains `dir` and faces the
 * camera (so they always read as ")))"). `live`: waves travel out and fade. `dead`: each arc gets a few
 * units out, cracks into grey fragments and falls. `t` is seconds since the speaker started; `stop` (dead
 * only) is when the last arc is born.
 */
export const SoundWave: React.FC<{
  origin: V3;
  dir: V3;
  cam: V3;
  t: number;
  dead?: boolean;
  size?: number;
  count?: number;
  rate?: number;
  speed?: number;
  stop?: number;
  color?: string;
  seed?: string;
}> = ({ origin, dir, cam, t, dead = false, size = 1, count = 4, rate = 0.3, speed = 2.6, stop = 99, color = AMBER, seed = "sw" }) => {
  const basis = useMemo(() => {
    const x = v3(dir).normalize();
    const view = v3(cam).sub(v3(origin));
    const z = view.sub(x.clone().multiplyScalar(view.dot(x))).normalize();
    if (z.lengthSq() < 1e-6) z.set(0, 0, 1);
    const y = new THREE.Vector3().crossVectors(z, x).normalize();
    const m = new THREE.Matrix4().makeBasis(x, y, z);
    return new THREE.Quaternion().setFromRotationMatrix(m);
  }, [dir, cam, origin]);
  if (t <= 0) return null;
  const arc = 1.7;
  const life = dead ? 0.9 : 1.6;
  const arcs: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const born = i * rate;
    if (born > t || born > stop || (!dead && i >= count * 3)) break;
    const age = t - born;
    if (age > (dead ? 2.4 : life)) continue;
    if (dead) {
      const crack = 0.32;
      const d0 = Math.min(age, crack) * speed * 0.55;
      const r = (0.25 + d0 * 0.7) * size;
      const grey = clamp01((age - crack * 0.6) / 0.25);
      const col = new THREE.Color(color).lerp(new THREE.Color("#6A6E78"), grey).getStyle();
      if (age < crack) {
        arcs.push(
          <mesh key={i} position={[(d0 - r) * size, 0, 0]} rotation={[0, 0, -arc / 2]}>
            <torusGeometry args={[r, 0.07 * size, 4, 18, arc]} />
            <Glow color={col} opacity={0.95} />
          </mesh>,
        );
      } else {
        const fall = age - crack;
        const n = 6;
        for (let k = 0; k < n; k++) {
          const a = -arc / 2 + ((k + 0.5) / n) * arc;
          const jx = (random(`${seed}${i}x${k}`) - 0.5) * 0.6;
          const jy = random(`${seed}${i}y${k}`) * 0.5;
          const px = (d0 - r) * size + Math.cos(a) * r + jx * fall;
          const py = Math.sin(a) * r + jy * fall - 4.9 * fall * fall * 0.6;
          const op = 1 - clamp01((fall - 0.5) / 0.9);
          if (op <= 0) continue;
          arcs.push(
            <mesh key={`${i}-${k}`} position={[px, py, 0]} rotation={[fall * 4 + k, fall * 3, a]}>
              <BoxG args={[0.13 * size, ((arc * r) / n) * 0.75, 0.08 * size]} />
              <Glow color={col} opacity={op * 0.85} />
            </mesh>,
          );
        }
      }
    } else {
      const d = age * speed;
      const r = (0.25 + d * 0.45) * size;
      const op = 1 - clamp01(age / life);
      arcs.push(
        <mesh key={i} position={[(d - r) * size * 0.6, 0, 0]} rotation={[0, 0, -arc / 2]}>
          <torusGeometry args={[r, 0.07 * size, 4, 20, arc]} />
          <Glow color={color} opacity={op} />
        </mesh>,
      );
    }
  }
  return (
    <group position={origin} quaternion={basis}>
      {arcs}
    </group>
  );
};

/** World point just in front of a hero's mouth, and the direction he faces. */
export const mouthOf = (pose: Pose, position: V3, yaw = 0): { at: V3; dir: V3 } => {
  const h = headPosition(pose, position, yaw);
  const fy = yaw + pose.headYaw + pose.twist;
  const dir: V3 = [Math.sin(fy), -0.08 + pose.headPitch * 0.6, Math.cos(fy)];
  return { at: [h[0] + dir[0] * 0.8, h[1] - 0.3, h[2] + dir[2] * 0.8], dir };
};

// ================================================================ light

const shaftVert = /* glsl */ `
varying float vH;
varying vec3 vN;
varying vec3 vV;
void main() {
  vH = uv.y;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const shaftFrag = /* glsl */ `
uniform vec3 color;
uniform float opacity;
varying float vH;
varying vec3 vN;
varying vec3 vV;
void main() {
  float facing = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
  float along = smoothstep(0.0, 0.25, vH) * (0.35 + 0.65 * vH);
  gl_FragColor = vec4(color * facing * along * opacity, 1.0);
}`;

/** A soft volumetric beam (additive) from `from` (narrow) to `to` (wide), e.g. sunlight through a window, headlights, a lamp. */
export const LightShaft: React.FC<{ from: V3; to: V3; r0?: number; r1?: number; color?: string; opacity?: number }> = ({ from, to, r0 = 0.3, r1 = 2, color = "#FFE2B0", opacity = 0.35 }) => {
  const { pos, quat, len } = useMemo(() => {
    const a = v3(from);
    const b = v3(to);
    const d = b.clone().sub(a);
    const len = d.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.normalize());
    const pos = a.clone().add(b).multiplyScalar(0.5);
    return { pos, quat, len };
  }, [from, to]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: shaftVert,
        fragmentShader: shaftFrag,
        uniforms: { color: { value: new THREE.Color(color) }, opacity: { value: opacity } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [color, opacity],
  );
  // CylinderGeometry uv.y runs 0 (bottom) → 1 (top); we point "top" at `from` so the beam fades out toward `to`.
  return (
    <mesh position={pos} quaternion={quat} material={mat}>
      <cylinderGeometry args={[r0, r1, len, 24, 1, true]} />
    </mesh>
  );
};

/** Glowing dust motes drifting in a box (instanced, seeded). */
export const Motes: React.FC<{ center: V3; size: V3; t: number; count?: number; color?: string; seed?: string; scale?: number; rise?: number }> = ({
  center,
  size,
  t,
  count = 160,
  color = "#FFE6B8",
  seed = "mote",
  scale = 0.05,
  rise = 0.15,
}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const base = useMemo(() => Array.from({ length: count }, (_, i) => [random(`${seed}x${i}`), random(`${seed}y${i}`), random(`${seed}z${i}`), random(`${seed}s${i}`)]), [count, seed]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    base.forEach(([x, y, z, s], i) => {
      const px = center[0] + (x - 0.5) * size[0] + Math.sin(t * 0.4 + i) * 0.25;
      const py = center[1] + ((((y + t * rise * (0.5 + s)) % 1) + 1) % 1 - 0.5) * size[1];
      const pz = center[2] + (z - 0.5) * size[2] + Math.cos(t * 0.33 + i * 1.7) * 0.25;
      const k = scale * (0.5 + s);
      q.setFromEuler(new THREE.Euler(t + i, t * 0.7 + i, 0));
      m.compose(new THREE.Vector3(px, py, pz), q, new THREE.Vector3(k, k, k));
      ref.current?.setMatrixAt(i, m);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <octahedronGeometry args={[1, 0]} />
      <Glow color={color} opacity={0.85} />
    </instancedMesh>
  );
};

// ================================================================ words and bubbles

/** A word set in glowing type on a transparent plane (bloom under FX). */
const wordTex = new Map<string, THREE.CanvasTexture>();
const wordTexture = (text: string, color: string, bg?: string) => {
  const key = `${text}|${color}|${bg ?? ""}`;
  const hit = wordTex.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  if (bg) {
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(4, 4, 504, 120, 40);
    ctx.fill();
  }
  ctx.font = CANVAS_FONT(78);
  fitText(ctx, text, 256, 66, 460, 78, color);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  wordTex.set(key, tex);
  return tex;
};

export const Word: React.FC<{ text: string; position: V3; rotation?: V3; w?: number; color?: string; bg?: string; opacity?: number; bright?: number; billboard?: boolean }> = ({
  text,
  position,
  rotation = [0, 0, 0],
  w = 2,
  color = "#FFFFFF",
  bg,
  opacity = 1,
  bright = 1.6,
}) => {
  const tex = wordTexture(text, color, bg);
  const tint = useMemo(() => new THREE.Color(1, 1, 1).multiplyScalar(bright), [bright]);
  if (opacity <= 0) return null;
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[w, w / 4]} />
      <meshBasicMaterial map={tex} color={tint} transparent opacity={opacity} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
};

export const WORDS = [
  "HELLO", "MUM", "PIZZA", "HELP", "LOVE", "WHY", "SORRY", "YES", "NO", "MAYBE", "COFFEE", "TOMORROW", "FRIEND", "HOME", "WAIT",
  "THANK YOU", "GOODNIGHT", "STOP", "LOOK", "PLEASE", "DINOSAUR", "BANANA", "SUPERNOVA", "OKAY", "WOW", "MUSIC", "DOG", "RUN",
  "BIRTHDAY", "LATER", "WHAT", "LISTEN", "SECRET", "FOREVER", "HI", "NEVER", "YOU", "ME", "WE", "WORD",
];

/** A 3D chat bubble (rounded slab, a tail, a word or "•••" on it), front faces +Z. */
export const Bubble3D: React.FC<{ position: V3; rotation?: V3; scale?: number; text?: string; color?: string; ink?: string; mine?: boolean; opacity?: number }> = ({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  text = "•••",
  color = "#3D8BFF",
  ink = "#FFFFFF",
  mine = true,
  opacity = 1,
}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh>
      <BoxG args={[2.2, 0.9, 0.22]} />
      <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} toneMapped={false} />
    </mesh>
    <mesh position={[mine ? 0.85 : -0.85, -0.5, 0]} rotation={[0, 0, mine ? 0.6 : -0.6]}>
      <BoxG args={[0.32, 0.32, 0.2]} />
      <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} toneMapped={false} />
    </mesh>
    <Word text={text} position={[0, 0.02, 0.12]} w={1.9} color={ink} bright={1} opacity={opacity} />
  </group>
);

/** A river of chat bubbles rising from `points` (phones) into the sky. */
export const BubbleRiver: React.FC<{ from: V3[]; t: number; height?: number; seed?: string; speed?: number; scale?: number; cam?: V3 }> = ({ from, t, height = 40, seed = "br", speed = 4, scale = 1 }) => (
  <group>
    {from.flatMap((p, i) =>
      [0, 1, 2].map((k) => {
        const ph = ((t * speed) / height + random(`${seed}${i}p${k}`) + k / 3) % 1;
        const y = p[1] + 1 + ph * height;
        const sway = Math.sin(t * 0.9 + i + k) * 1.2 * ph;
        const op = Math.min(1, ph * 6) * (1 - clamp01((ph - 0.75) / 0.25));
        const cols = ["#3D8BFF", "#2FD27A", "#E8E4DA", "#FF7AB8"];
        return (
          <Bubble3D
            key={`${i}-${k}`}
            position={[p[0] + sway + (random(`${seed}${i}x${k}`) - 0.5) * 2, y, p[2] + (random(`${seed}${i}z${k}`) - 0.5) * 2]}
            rotation={[0, (random(`${seed}${i}r${k}`) - 0.5) * 0.8, 0]}
            scale={scale * (0.7 + ph * 0.8)}
            color={cols[(i + k) % cols.length]}
            ink={(i + k) % cols.length === 2 ? "#141824" : "#FFFFFF"}
            text={k === 1 ? WORDS[(i * 3 + k) % WORDS.length] : "•••"}
            opacity={op}
            mine={k % 2 === 0}
          />
        );
      }),
    )}
  </group>
);

// ================================================================ the brain

const brainGeom = (side: number) => {
  const g = new THREE.IcosahedronGeometry(1, 5).toNonIndexed();
  const pos = g.getAttribute("position");
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    // gyri: banded ridges plus noise
    const ridge = Math.sin(n.y * 13 + Math.sin(n.z * 7) * 1.6 + n.x * 3) * 0.5 + 0.5;
    const r = 1 + ridge * 0.07 + noise3("brain", n.x * 2.4, n.y * 2.4, n.z * 2.4) * 0.06;
    v.copy(n).multiplyScalar(r);
    v.set(v.x * 0.82, v.y * 0.86, v.z * 1.18);
    if (v.x * side < 0) v.x *= 0.35; // flatten the inner face
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let f = 0; f < pos.count / 3; f++) {
    const j = random(`bf${side}${f}`);
    c.set("#E28BB0").lerp(new THREE.Color("#B85A92"), j * 0.6);
    for (let k = 0; k < 3; k++) colors.set([c.r, c.g, c.b], (f * 3 + k) * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return g;
};

/** A faceted brain, about 2.6 wide at scale 1, with synapse sparks flickering over it. Front faces +Z. */
export const Brain: React.FC<{ position: V3; rotation?: V3; scale?: number; t: number; sparks?: number; ghost?: number }> = ({ position, rotation = [0, 0, 0], scale = 1, t, sparks = 1, ghost = 0 }) => {
  const left = useMemo(() => brainGeom(1), []);
  const right = useMemo(() => brainGeom(-1), []);
  const spark = Array.from({ length: 34 }, (_, i) => {
    const a = random(`sp${i}a`) * Math.PI * 2;
    const b = (random(`sp${i}b`) - 0.3) * 1.6;
    const side = i % 2 ? 1 : -1;
    const n = new THREE.Vector3(Math.cos(b) * Math.sin(a) * 0.5 + side * 0.5, Math.sin(b), Math.cos(b) * Math.cos(a)).normalize();
    const p: V3 = [n.x * 0.86 + side * 0.4, n.y * 0.9, n.z * 1.2];
    const on = (Math.sin(t * (4 + random(`sp${i}f`) * 6) + i * 2.1) + 1) / 2;
    return { p, on: on * on * sparks };
  });
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {[left, right].map((g, i) => (
        <mesh key={i} geometry={g} position={[i === 0 ? 0.47 : -0.47, 0, 0]} castShadow>
          {ghost > 0 ? (
            <meshBasicMaterial color="#FF8AC8" wireframe transparent opacity={ghost} toneMapped={false} />
          ) : (
            <meshLambertMaterial vertexColors flatShading emissive="#3A0E2A" />
          )}
        </mesh>
      ))}
      {ghost > 0 ? null : (
        <>
          <mesh position={[0, -0.62, -0.78]} scale={[0.75, 0.42, 0.45]} castShadow>
            <IcoG args={[1, 3]} />
            <Flat color="#C46F9C" />
          </mesh>
          <mesh position={[0, -1.0, -0.35]} rotation={[0.35, 0, 0]}>
            <CylG args={[0.2, 0.15, 0.9, 8]} />
            <Flat color="#C46F9C" />
          </mesh>
        </>
      )}
      {spark.map((s, i) =>
        s.on > 0.15 ? (
          <mesh key={i} position={s.p}>
            <octahedronGeometry args={[0.05 + s.on * 0.06, 0]} />
            <Glow color={i % 3 ? "#FFE2F4" : "#9AE6FF"} opacity={s.on} />
          </mesh>
        ) : null,
      )}
      <Halo position={[0, 0, 0]} size={7} color="#FF6AB8" opacity={0.18 + (ghost > 0 ? 0 : 0.12)} />
    </group>
  );
};

// ================================================================ looks and wearables

export const SCRUBS: HeroLook = { ...crowdLook(2), hair: "#2E8A86", jacket: "#2E8A86", jacketShade: "#23706D", zipper: "#2E8A86", jeans: "#2A7A77", shoe: "#E8E4DA" };
export const TEACHER: HeroLook = { ...crowdLook(9), jacket: "#7A4AB8", jacketShade: "#623A98", zipper: "#E8E4DA", jeans: "#2A2A30" };
export const CONTROLLER: HeroLook = { ...crowdLook(5), jacket: "#E8E4DA", jacketShade: "#C9C4B6", zipper: "#1D274B", jeans: "#1D274B" };
export const FUR: HeroLook = { ...crowdLook(3), jacket: "#7A5232", jacketShade: "#5E3E26", zipper: "#7A5232", jeans: "#5E3E26", shoe: "#5E3E26", hair: "#2A1E18" };

/** Head frame (centre plus yaw), for things worn on the head. */
const headFrame = (pose: Pose, position: V3, yaw: number) => ({ c: headPosition(pose, position, yaw), yaw: yaw + pose.headYaw + pose.twist, pitch: pose.headPitch });

/** A surgical mask: a shell hugging the lower face (radius just over the head's). */
export const Mask: React.FC<{ pose: Pose; position: V3; yaw?: number }> = ({ pose, position, yaw = 0 }) => {
  const f = headFrame(pose, position, yaw);
  return (
    <group position={f.c} rotation={[0, f.yaw, 0]}>
      <group rotation={[-f.pitch, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[0.735, 18, 6, Math.PI * 0.18, Math.PI * 0.64, Math.PI * 0.56, Math.PI * 0.32]} />
          <meshLambertMaterial color="#9ED2DA" flatShading side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};

/** A headset: a band over the hair and two ear cups, with a mic boom. */
export const Headset: React.FC<{ pose: Pose; position: V3; yaw?: number }> = ({ pose, position, yaw = 0 }) => {
  const f = headFrame(pose, position, yaw);
  return (
    <group position={f.c} rotation={[0, f.yaw, 0]}>
      <group rotation={[-f.pitch, 0, 0]}>
        <mesh position={[0, 0.2, -0.05]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.84, 0.05, 4, 20, Math.PI]} />
          <Flat color="#22262E" />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.8, 0.0, -0.02]} rotation={[0, 0, Math.PI / 2]}>
            <CylG args={[0.24, 0.24, 0.16, 10]} />
            <Flat color="#22262E" />
          </mesh>
        ))}
        <Strut a={[-0.8, -0.05, 0.05]} b={[-0.38, -0.36, 0.72]} w={0.04} color="#22262E" />
        <mesh position={[-0.34, -0.37, 0.76]}>
          <IcoG args={[0.07, 1]} />
          <Glow color="#FF3A3A" />
        </mesh>
      </group>
    </group>
  );
};

/** A phone held upright in a hand (screen toward the hero or toward `face`). */
export const HeldPhone: React.FC<{ pose: Pose; position: V3; yaw?: number; side?: "l" | "r"; glow?: string; out?: boolean; scale?: number }> = ({
  pose,
  position,
  yaw = 0,
  side = "r",
  glow = "#9FD0FF",
  out = false,
  scale = 1,
}) => {
  const h = handPosition(pose, side, position, yaw);
  const w = 0.42 * scale;
  const hh = 0.84 * scale;
  const p: V3 = [h[0], h[1] + DIM.fistR + hh / 2 - 0.16, h[2]];
  const ry = yaw + (out ? 0 : Math.PI);
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <mesh castShadow>
        <BoxG args={[w, hh, 0.06]} />
        <Flat color="#1A1C22" />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
        <planeGeometry args={[w * 0.86, hh * 0.88]} />
        <meshBasicMaterial color={new THREE.Color(glow).multiplyScalar(1.25)} toneMapped={false} />
      </mesh>
      <Halo position={[0, 0, 0.2]} size={0.9 * scale} color={glow} opacity={0.22} />
    </group>
  );
};

/** The signing hand trail: glowing beads along where a hand was over the last ~0.4 s. */
export const HandTrail: React.FC<{ poseAt: (t: number) => Pose; t: number; position: V3; yaw?: number; side: "l" | "r"; color?: string; steps?: number }> = ({
  poseAt,
  t,
  position,
  yaw = 0,
  side,
  color = "#7FE8FF",
  steps = 14,
}) => (
  <group>
    {Array.from({ length: steps }, (_, i) => {
      const tt = t - i * 0.03;
      const p = handPosition(poseAt(tt), side, position, yaw);
      const k = 1 - i / steps;
      return (
        <mesh key={i} position={p}>
          <octahedronGeometry args={[0.07 + 0.09 * k, 0]} />
          <Glow color={color} opacity={k * 0.9} />
        </mesh>
      );
    })}
  </group>
);

/** Sign-language motion: both hands work in front of the chest, never up into the face. */
export const signPose = (t: number, seed = 0, over: Partial<Pose> = {}): Pose => {
  const a = t * 5.2 + seed;
  const b = t * 3.7 + seed * 1.7;
  return mergePose(REST, {
    rShoulder: [0.95 + 0.3 * Math.sin(a), 0.35 + 0.2 * Math.sin(b)],
    lShoulder: [0.85 + 0.28 * Math.sin(a * 0.8 + 1.4), 0.32 + 0.22 * Math.cos(b * 1.1)],
    rElbow: 1.45 + 0.3 * Math.sin(a * 1.3 + 0.5),
    lElbow: 1.4 + 0.3 * Math.cos(a * 1.1),
    headPitch: 0.04,
    expression: "smile",
    ...over,
  });
};

// ================================================================ sets

/** A screen texture: an emergency call that fails. */
export const drawCall = (k: number, t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  const failed = k > 0.5;
  ctx.fillStyle = failed ? "#2A0E12" : "#0E1626";
  ctx.fillRect(0, 0, W, H);
  ctx.font = CANVAS_FONT(W * 0.075, false);
  fitText(ctx, failed ? "CALL FAILED" : "CALLING…", W / 2, H * 0.14, W * 0.85, W * 0.075, failed ? "#FF6A6A" : "#9FB3D9", !failed);
  ctx.font = CANVAS_FONT(W * 0.13);
  fitText(ctx, "EMERGENCY", W / 2, H * 0.25, W * 0.9, W * 0.13, "#FFFFFF");
  // waveform: lively while calling, a flat red line when no voice is heard
  ctx.strokeStyle = failed ? "#FF5A5A" : "#5AE0A0";
  ctx.lineWidth = W * 0.012;
  ctx.beginPath();
  for (let x = 0; x <= 60; x++) {
    const px = W * 0.1 + (x / 60) * W * 0.8;
    const amp = failed ? 0 : Math.sin(x * 0.7 + t * 9) * Math.sin(x * 0.13 + t * 3) * H * 0.04 * (1 - k * 2);
    const py = H * 0.48 + amp;
    if (x === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.font = CANVAS_FONT(W * 0.06);
  fitText(ctx, failed ? "NO VOICE DETECTED" : "SAY YOUR EMERGENCY", W / 2, H * 0.6, W * 0.85, W * 0.06, failed ? "#FFBA58" : "#E8E4DA");
  ctx.fillStyle = "#E8344A";
  ctx.beginPath();
  ctx.arc(W / 2, H * 0.84, W * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(W / 2 - W * 0.05, H * 0.84 - W * 0.015, W * 0.1, W * 0.03);
};

/** The emergency dispatch room: two rows of consoles, a wall board, red alarm beacons. Consoles face −Z. */
export const DISPATCH_ROWS = [3, 9];
export const Dispatch: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[46, 0.1, 46]} />
      <Flat color="#1A1F2E" />
    </mesh>
    <mesh position={[0, 9, -8]} receiveShadow>
      <BoxG args={[46, 18, 0.4]} />
      <Flat color="#141A28" />
    </mesh>
    {[-22, 22].map((x) => (
      <mesh key={x} position={[x, 9, 6]} receiveShadow>
        <BoxG args={[0.4, 18, 28]} />
        <Flat color="#161C2A" />
      </mesh>
    ))}
    <CanvasPanel position={[0, 11, -7.7]} w={10} h={5.6} px={1000} glow draw={drawBoard(t)} />
    {DISPATCH_ROWS.flatMap((z, row) =>
      [-12, -4, 4, 12].map((x) => (
        <group key={`${row}${x}`} position={[x, 0, z]}>
          <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
            <BoxG args={[6.4, 2.4, 1.8]} />
            <Flat color="#262C3C" />
          </mesh>
          {[-1.6, 1.6].map((mx) => (
            <React.Fragment key={mx}>
              <mesh position={[mx, 3.3, -0.4]} rotation={[-0.15, 0, 0]} castShadow>
                <BoxG args={[2.8, 1.7, 0.14]} />
                <Flat color="#0E1018" />
              </mesh>
              <CanvasPanel position={[mx, 3.3, -0.32]} rotation={[-0.15, 0, 0]} w={2.55} h={1.45} px={384} glow draw={drawMonitor(t, row * 4 + mx + x)} />
            </React.Fragment>
          ))}
        </group>
      )),
    )}
    {[-14, 0, 14].map((x, i) => {
      const on = Math.sin(t * 7 + i * 2) > 0;
      return (
        <React.Fragment key={x}>
          <mesh position={[x, 17, -7.4]}>
            <BoxG args={[1.2, 0.8, 0.8]} />
            <Glow color={on ? "#FF2A2A" : "#5A1010"} />
          </mesh>
          {on ? <Halo position={[x, 17, -6.8]} size={9} color="#FF3A3A" opacity={0.7} /> : null}
        </React.Fragment>
      );
    })}
    <pointLight position={[0, 12, 0]} color="#FF4A4A" intensity={Math.sin(t * 7) > 0 ? 120 : 40} distance={40} decay={2} />
    <pointLight position={[0, 6, 14]} color="#6A8AD8" intensity={60} distance={40} decay={2} />
  </group>
);

const drawBoard = (t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#08101C";
  ctx.fillRect(0, 0, W, H);
  ctx.font = CANVAS_FONT(H * 0.11);
  fitText(ctx, "EMERGENCY CALLS WAITING", W / 2, H * 0.17, W * 0.9, H * 0.11, "#9FB3D9");
  const n = Math.floor(48213 + t * 9137);
  ctx.font = CANVAS_FONT(H * 0.34);
  fitText(ctx, n.toLocaleString("en-US"), W / 2, H * 0.52, W * 0.9, H * 0.34, "#FF5A5A");
  ctx.font = CANVAS_FONT(H * 0.1);
  fitText(ctx, "VOICE RECEIVED: NONE", W / 2, H * 0.84, W * 0.9, H * 0.1, "#FFBA58");
};
const drawMonitor = (t: number, seed: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  const blink = Math.sin(t * 6 + seed) > 0;
  ctx.fillStyle = blink ? "#3A0E14" : "#14181F";
  ctx.fillRect(0, 0, W, H);
  ctx.font = CANVAS_FONT(H * 0.16);
  fitText(ctx, "INCOMING CALL", W / 2, H * 0.22, W * 0.9, H * 0.16, "#FF8A8A");
  ctx.strokeStyle = "#FF5A5A";
  ctx.lineWidth = H * 0.03;
  ctx.beginPath();
  ctx.moveTo(W * 0.1, H * 0.55);
  ctx.lineTo(W * 0.9, H * 0.55);
  ctx.stroke();
  ctx.font = CANVAS_FONT(H * 0.13);
  fitText(ctx, "NO AUDIO", W / 2, H * 0.82, W * 0.9, H * 0.13, "#FFBA58");
};

/** Runway in the rain: edge lights in two rows, a centre line, approach strobes. Runway along Z. */
export const Runway: React.FC<{ t: number; length?: number }> = ({ t, length = 400 }) => (
  <group>
    <Ground color="#1C2228" />
    <mesh position={[0, 0.02, -length / 2 + 40]} receiveShadow>
      <BoxG args={[30, 0.06, length]} />
      <Flat color="#2A2E36" />
    </mesh>
    {Array.from({ length: 40 }, (_, i) => (
      <mesh key={`c${i}`} position={[0, 0.06, 40 - i * 10]}>
        <BoxG args={[0.6, 0.02, 4.5]} />
        <Flat color="#C9C4B6" />
      </mesh>
    ))}
    {[-15.5, 15.5].flatMap((x) =>
      Array.from({ length: 30 }, (_, i) => (
        <React.Fragment key={`${x}${i}`}>
          <mesh position={[x, 0.3, 40 - i * 13]}>
            <BoxG args={[0.5, 0.5, 0.5]} />
            <Glow color="#FFE2A0" />
          </mesh>
        </React.Fragment>
      )),
    )}
    {Array.from({ length: 8 }, (_, i) => {
      const on = Math.floor(t * 12) % 8 === i;
      return (
        <React.Fragment key={`s${i}`}>
          <mesh position={[0, 0.5, 52 + i * 9]}>
            <BoxG args={[0.8, 0.8, 0.8]} />
            <Glow color={on ? "#FFFFFF" : "#5A5A60"} />
          </mesh>
          {on ? <Halo position={[0, 0.8, 52 + i * 9]} size={10} color="#E8F0FF" opacity={0.8} /> : null}
        </React.Fragment>
      );
    })}
    <HillRing radius={260} count={20} color="#1E2A26" />
  </group>
);

/** A control tower: a column with a flared glass cab glowing teal. Base at y = 0. */
export const ControlTower: React.FC<{ position: V3; scale?: number }> = ({ position, scale = 1 }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 14, 0]} castShadow>
      <CylG args={[2.2, 3.2, 28, 10]} />
      <Flat color="#9AA1B0" />
    </mesh>
    <mesh position={[0, 29.3, 0]}>
      <CylG args={[5.4, 4.2, 3.2, 12]} />
      <Glow color="#5AD8C8" opacity={0.9} />
    </mesh>
    <mesh position={[0, 31.3, 0]}>
      <CylG args={[5.8, 5.8, 0.8, 12]} />
      <Flat color="#5A606E" />
    </mesh>
    <mesh position={[0, 32.6, 0]}>
      <CylG args={[0.15, 0.15, 2.6, 4]} />
      <Flat color="#5A606E" />
    </mesh>
    <mesh position={[0, 34, 0]}>
      <IcoG args={[0.35, 1]} />
      <Glow color="#FF3A3A" />
    </mesh>
    <Halo position={[0, 29.3, 0]} size={20} color="#5AD8C8" opacity={0.35} />
  </group>
);

/** Inside a tower cab: a console at z = 0 facing −Z with a radar scope, slanted windows all round, the dark airfield outside. */
export const TowerCab: React.FC<{ t: number; drawScope: (t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => void; flash?: number }> = ({ t, drawScope, flash = 0 }) => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <CylG args={[13, 13, 0.1, 12]} />
      <Flat color="#2A303C" />
    </mesh>
    {/* window frames (a ring of slanted mullions) */}
    {Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <Strut key={i} a={[Math.sin(a) * 12.4, 2.2, Math.cos(a) * 12.4]} b={[Math.sin(a) * 13.6, 10, Math.cos(a) * 13.6]} w={0.35} color="#3A404C" />;
    })}
    <mesh position={[0, 1.1, 0]} rotation={[0, 0, 0]}>
      <CylG args={[12.4, 12.4, 2.2, 12, 1, true]} />
      <Flat color="#262C38" side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 10.2, 0]}>
      <CylG args={[13.8, 13.8, 0.4, 12]} />
      <Flat color="#1A1E26" />
    </mesh>
    {/* console */}
    <mesh position={[0, 1.4, -1.8]} castShadow receiveShadow>
      <BoxG args={[9, 2.8, 2]} />
      <Flat color="#323846" />
    </mesh>
    <CanvasPanel position={[-2, 2.86, -1.8]} rotation={[-Math.PI / 2 + 0.25, 0, 0]} w={2.6} h={1.9} px={512} glow draw={drawScope(t)} />
    <CanvasPanel position={[2.2, 3.6, -2.5]} rotation={[-0.2, 0, 0]} w={3} h={1.4} px={512} glow draw={drawRadio(t)} />
    {/* the airfield far below and beyond */}
    {Array.from({ length: 24 }, (_, i) => (
      <mesh key={i} position={[-30 + (i % 12) * 5, -6, -60 - Math.floor(i / 12) * 30]}>
        <BoxG args={[0.6, 0.6, 0.6]} />
        <Glow color={i % 5 === 0 ? "#5AA0FF" : "#FFE2A0"} />
      </mesh>
    ))}
    <pointLight position={[0, 5, 2]} color="#5AD8C8" intensity={30} distance={20} decay={2} />
    {flash > 0 ? <pointLight position={[0, 20, -30]} color="#E8F0FF" intensity={flash * 900} distance={120} decay={2} /> : null}
  </group>
);
const drawRadio = (t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#081410";
  ctx.fillRect(0, 0, W, H);
  ctx.font = CANVAS_FONT(H * 0.15);
  fitText(ctx, "TOWER ↔ FLIGHT 702", W / 2, H * 0.18, W * 0.9, H * 0.15, "#5AE0A0");
  ctx.strokeStyle = "#FF5A5A";
  ctx.lineWidth = H * 0.03;
  ctx.beginPath();
  ctx.moveTo(W * 0.08, H * 0.52);
  ctx.lineTo(W * 0.92, H * 0.52);
  ctx.stroke();
  ctx.font = CANVAS_FONT(H * 0.14);
  fitText(ctx, Math.floor(t * 2) % 2 ? "NO VOICE" : "", W / 2, H * 0.82, W * 0.9, H * 0.14, "#FFBA58");
};

/** ECG trace on a monitor; `fast` speeds the heartbeat up. */
export const drawEcg = (t: number, fast: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#04100C";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#3AFF8A";
  ctx.lineWidth = H * 0.025;
  ctx.beginPath();
  const bpm = 1.2 + fast * 1.6;
  for (let x = 0; x <= 120; x++) {
    const u = x / 120;
    const ph = ((u * 3 - t * bpm) % 1 + 1) % 1;
    const spike = ph < 0.06 ? Math.sin((ph / 0.06) * Math.PI) * (ph < 0.03 ? 1 : -0.4) : 0;
    const py = H * 0.5 - spike * H * 0.32 + Math.sin(ph * 12) * H * 0.01;
    if (x === 0) ctx.moveTo(u * W, py);
    else ctx.lineTo(u * W, py);
  }
  ctx.stroke();
  ctx.font = CANVAS_FONT(H * 0.14);
  fitText(ctx, `${Math.round(72 + fast * 70)}`, W * 0.86, H * 0.18, W * 0.2, H * 0.14, "#3AFF8A");
};

/** The ER: tiled walls, a bed with a covered patient (along X, head at −X), a surgical lamp, a heart monitor. */
export const ER = { bedTop: 2.2, lamp: [0, 9, 0] as V3, monitor: [6.2, 4.6, -3.2] as V3 };
export const ERRoom: React.FC<{ t: number; fast: number }> = ({ t, fast }) => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[34, 0.1, 34]} />
      <Flat color="#B9C6C8" />
    </mesh>
    <mesh position={[0, 7, -8]} receiveShadow>
      <BoxG args={[34, 14, 0.3]} />
      <Flat color="#7FB4B2" />
    </mesh>
    {Array.from({ length: 12 }, (_, i) => (
      <mesh key={i} position={[-15 + i * 2.75, 7, -7.83]}>
        <BoxG args={[0.06, 14, 0.04]} />
        <Flat color="#6A9E9C" />
      </mesh>
    ))}
    {[-14, 14].map((x) => (
      <mesh key={x} position={[x, 7, 4]} receiveShadow>
        <BoxG args={[0.3, 14, 24]} />
        <Flat color="#8ABEBC" />
      </mesh>
    ))}
    {/* bed */}
    <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
      <BoxG args={[7, 0.5, 2.6]} />
      <Flat color="#5A606E" />
    </mesh>
    {[-3, 3].flatMap((x) =>
      [-1, 1].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.4, z]}>
          <BoxG args={[0.2, 0.8, 0.2]} />
          <Flat color="#8A909E" />
        </mesh>
      )),
    )}
    <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
      <BoxG args={[6.8, 0.7, 2.4]} />
      <Flat color="#EDF2F4" />
    </mesh>
    {/* the patient under a sheet, head on a pillow at −X */}
    <mesh position={[0.6, 2.2, 0]} scale={[3.0, 0.55, 1.05]} castShadow>
      <IcoG args={[1, 2]} />
      <Flat color="#9ED2DA" />
    </mesh>
    <mesh position={[-2.6, 2.2, 0]} castShadow>
      <BoxG args={[1.3, 0.4, 1.8]} />
      <Flat color="#FFFFFF" />
    </mesh>
    <mesh position={[-2.55, 2.85, 0]} castShadow>
      <IcoG args={[0.55, 2]} />
      <Flat color={P.skin} />
    </mesh>
    {/* surgical lamp */}
    <Strut a={[0, 14, 0]} b={[0, 9.6, 0]} w={0.25} color="#C9CED8" />
    <mesh position={ER.lamp}>
      <CylG args={[2.2, 2.6, 0.7, 16]} />
      <Flat color="#E8ECF2" />
    </mesh>
    <mesh position={[ER.lamp[0], ER.lamp[1] - 0.36, ER.lamp[2]]} rotation={[Math.PI / 2, 0, 0]}>
      <CircleG args={[2.2, 16]} />
      <Glow color="#F4FAFF" />
    </mesh>
    <pointLight position={[0, 7.6, 0]} intensity={120} distance={16} decay={2} color="#F4FAFF" />
    {/* monitor */}
    <Strut a={[ER.monitor[0], 0, ER.monitor[2]]} b={[ER.monitor[0], ER.monitor[1] - 1, ER.monitor[2]]} w={0.18} color="#8A909E" />
    <mesh position={[ER.monitor[0], ER.monitor[1], ER.monitor[2] - 0.12]} rotation={[0, -0.5, 0]} castShadow>
      <BoxG args={[2.6, 1.9, 0.25]} />
      <Flat color="#22262E" />
    </mesh>
    <CanvasPanel position={[ER.monitor[0] + 0.0, ER.monitor[1], ER.monitor[2]]} rotation={[0, -0.5, 0]} w={2.3} h={1.6} px={512} glow draw={drawEcg(t, fast)} />
  </group>
);

/** A lift interior (hero scale): steel walls, a handrail, an intercom panel on the right wall facing −X. */
export const LIFT = { w: 7, d: 7, h: 7.2, intercom: [3.38, 3.6, -1.2] as V3 };
export const Lift: React.FC<{ t: number; flicker?: number; press?: number }> = ({ t, flicker = 1, press = 0 }) => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[LIFT.w, 0.1, LIFT.d]} />
      <Flat color="#3A3E48" />
    </mesh>
    <mesh position={[0, LIFT.h, 0]}>
      <BoxG args={[LIFT.w, 0.1, LIFT.d]} />
      <Flat color="#C9CED8" />
    </mesh>
    <mesh position={[0, LIFT.h / 2, -LIFT.d / 2]} receiveShadow>
      <BoxG args={[LIFT.w, LIFT.h, 0.1]} />
      <Flat color="#9AA1B0" />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[(s * LIFT.w) / 2, LIFT.h / 2, 0]} receiveShadow>
        <BoxG args={[0.1, LIFT.h, LIFT.d]} />
        <Flat color={s > 0 ? "#A8AEBA" : "#8E95A3"} />
      </mesh>
    ))}
    {[-1, 1].map((s) => (
      <mesh key={`r${s}`} position={[(s * (LIFT.w / 2 - 0.25)), 2.3, -0.5]}>
        <BoxG args={[0.12, 0.12, 4.5]} />
        <Flat color="#D8DCE4" />
      </mesh>
    ))}
    {/* ceiling light panel */}
    <mesh position={[0, LIFT.h - 0.08, 0]}>
      <BoxG args={[3.2, 0.06, 3.2]} />
      <Glow color={new THREE.Color("#3A3A40").lerp(new THREE.Color("#F2F4FF"), flicker).getStyle()} />
    </mesh>
    <pointLight position={[0, LIFT.h - 1, 0]} color="#F2F4FF" intensity={30 * flicker + 2} distance={14} decay={2} />
    <pointLight position={[2.5, 6, -2.5]} color="#FF2A2A" intensity={Math.sin(t * 6) > 0 ? 14 : 4} distance={9} decay={2} />
    <mesh position={[2.5, 6.6, -3.4]}>
      <BoxG args={[0.5, 0.3, 0.2]} />
      <Glow color={Math.sin(t * 6) > 0 ? "#FF2A2A" : "#5A1010"} />
    </mesh>
    {/* intercom */}
    <mesh position={[LIFT.intercom[0] + 0.04, LIFT.intercom[1], LIFT.intercom[2]]} castShadow>
      <BoxG args={[0.12, 2.4, 1.3]} />
      <Flat color="#5A606E" />
    </mesh>
    {Array.from({ length: 6 }, (_, i) => (
      <mesh key={i} position={[LIFT.intercom[0] - 0.03, LIFT.intercom[1] + 0.75, LIFT.intercom[2] - 0.4 + i * 0.16]}>
        <BoxG args={[0.04, 0.35, 0.06]} />
        <Flat color="#22262E" />
      </mesh>
    ))}
    <mesh position={[LIFT.intercom[0] - 0.02 - press * 0.05, LIFT.intercom[1] - 0.3, LIFT.intercom[2]]}>
      <CylG args={[0.24, 0.24, 0.1, 12]} />
      <Glow color={press > 0.5 ? "#FFBA58" : "#C8372D"} />
    </mesh>
    <CanvasPanel position={[LIFT.intercom[0] - 0.03, LIFT.intercom[1] - 0.85, LIFT.intercom[2]]} rotation={[0, -Math.PI / 2, 0]} w={1.1} h={0.36} px={256} glow draw={drawLabel("PRESS AND SPEAK")} />
  </group>
);
const drawLabel = (text: string, bg = "#14181F", color = "#E8E4DA") => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.font = CANVAS_FONT(H * 0.5);
  fitText(ctx, text, W / 2, H * 0.56, W * 0.92, H * 0.5, color);
};

/** A city plaza at hero scale: paving, buildings round three sides, a giant screen, a low stage at the back. Open toward +Z. */
export const PLAZA = { screen: [0, 26, -46] as V3, screenW: 30, screenH: 14, stage: [0, 0, -18] as V3, stageTop: 1.2 };
export const Plaza: React.FC<{ screen: (ctx: CanvasRenderingContext2D, W: number, H: number) => void; power?: number }> = ({ screen, power = 0.5 }) => (
  <group>
    <Ground color="#4A4650" />
    <mesh position={[0, 0.02, -10]} receiveShadow>
      <BoxG args={[80, 0.04, 80]} />
      <Flat color="#8A8078" />
    </mesh>
    {Array.from({ length: 9 }, (_, i) => (
      <mesh key={i} position={[-36 + i * 9, 0.05, -10]}>
        <BoxG args={[0.18, 0.02, 80]} />
        <Flat color="#7A7068" />
      </mesh>
    ))}
    <Building position={[0, 0, -60]} w={40} d={16} h={40} color={P.bldgNavy} seed="pz0" power={power} />
    <Building position={[-36, 0, -40]} w={16} d={24} h={30} color={P.bldgPurple} seed="pz1" power={power} />
    <Building position={[36, 0, -40]} w={16} d={24} h={34} color={P.bldgTeal} seed="pz2" power={power} />
    <Building position={[-40, 0, -6]} w={14} d={20} h={22} color={P.bldgSlate} seed="pz3" power={power} />
    <Building position={[40, 0, -4]} w={14} d={20} h={26} color={P.bldgPurple} seed="pz4" power={power} />
    <mesh position={[PLAZA.screen[0], PLAZA.screen[1], PLAZA.screen[2] - 0.4]}>
      <BoxG args={[PLAZA.screenW + 1, PLAZA.screenH + 1, 0.6]} />
      <Flat color="#0A0C12" />
    </mesh>
    <CanvasPanel position={[PLAZA.screen[0], PLAZA.screen[1], PLAZA.screen[2] + 0.2]} w={PLAZA.screenW} h={PLAZA.screenH} px={1100} glow draw={screen} />
    {/* stage */}
    <mesh position={[PLAZA.stage[0], PLAZA.stageTop / 2, PLAZA.stage[2]]} castShadow receiveShadow>
      <BoxG args={[14, PLAZA.stageTop, 7]} />
      <Flat color="#3A2E2A" />
    </mesh>
    {/* trees in planters */}
    {[-24, 24].flatMap((x) =>
      [4, 18].map((z) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <BoxG args={[3, 1.2, 3]} />
            <Flat color="#5A5450" />
          </mesh>
          <mesh position={[0, 3, 0]}>
            <CylG args={[0.3, 0.4, 3.6, 6]} />
            <Flat color="#5A3E2E" />
          </mesh>
          <mesh position={[0, 6.6, 0]} castShadow>
            <IcoG args={[2.8, 1]} />
            <Flat color="#2F7A5A" />
          </mesh>
        </group>
      )),
    )}
    <Skyline radius={140} count={24} arc={[Math.PI * 0.6, Math.PI * 1.4]} power={power} />
  </group>
);

/** Sign text for the plaza screen. */
export const drawScreen = (lines: string[], accent = "#FFBA58") => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0E1A3A");
  g.addColorStop(1, "#2A1040");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  lines.forEach((l, i) => {
    ctx.font = CANVAS_FONT(H * 0.26);
    fitText(ctx, l, W / 2, H * (0.36 + i * 0.34), W * 0.9, H * 0.26, i === lines.length - 1 ? accent : "#FFFFFF");
  });
};

/** A handwritten cardboard sign (texture). */
export const drawCard = (text: string) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#C8A878";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#A8885A";
  ctx.lineWidth = W * 0.02;
  ctx.strokeRect(W * 0.03, H * 0.05, W * 0.94, H * 0.9);
  ctx.font = `700 ${Math.round(H * 0.42)}px "Slavoski Sans", "DejaVu Sans", sans-serif`;
  fitText(ctx, text, W / 2, H * 0.55, W * 0.86, H * 0.42, "#1A1C22");
};

/** Wet-road reflections: long soft streaks of light lying on the road under each light source. */
export const WetStreaks: React.FC<{ lights: { at: V3; color: string; length?: number; width?: number; opacity?: number }[]; toward: V3 }> = ({ lights, toward }) => (
  <group>
    {lights.map((l, i) => {
      const dx = toward[0] - l.at[0];
      const dz = toward[2] - l.at[2];
      const yaw = Math.atan2(dx, dz);
      const len = l.length ?? 14;
      return (
        <mesh key={i} position={[l.at[0] + Math.sin(yaw) * len * 0.5, 0.06, l.at[2] + Math.cos(yaw) * len * 0.5]} rotation={[-Math.PI / 2, 0, -yaw]}>
          <planeGeometry args={[l.width ?? 1.2, len]} />
          <meshBasicMaterial color={l.color} transparent opacity={l.opacity ?? 0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      );
    })}
  </group>
);

/** A neon blade sign on a facade (CanvasPanel both sides plus a halo). */
export const Neon: React.FC<{ position: V3; yaw?: number; text: string; color: string; w?: number; h?: number }> = ({ position, yaw = 0, text, color, w = 2.4, h = 6 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh>
      <BoxG args={[w + 0.3, h + 0.3, 0.3]} />
      <Flat color="#14141C" />
    </mesh>
    {[1, -1].map((s) => (
      <CanvasPanel
        key={s}
        position={[0, 0, s * 0.17]}
        rotation={[0, s > 0 ? 0 : Math.PI, 0]}
        w={w}
        h={h}
        px={256}
        glow
        draw={(ctx, W, H) => {
          ctx.fillStyle = "#0A0A12";
          ctx.fillRect(0, 0, W, H);
          ctx.font = CANVAS_FONT(W * 0.5);
          const chars = text.split("");
          chars.forEach((ch, i) => fitText(ctx, ch, W / 2, (H * (i + 0.75)) / chars.length, W * 0.8, W * 0.5, color));
        }}
      />
    ))}
    <Halo position={[0, 0, 0.6]} size={h * 2.2} color={color} opacity={0.35} />
  </group>
);

/** Rocks, a cave mouth and a campfire ring for the storytelling scene (fire at the origin). */
export const Cave: React.FC = () => (
  <group>
    <Ground color="#2A241E" />
    {Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * 1.4, 0.25, Math.sin(a) * 1.4]} castShadow>
          <IcoG args={[0.4, 1]} />
          <Flat color="#5A544E" />
        </mesh>
      );
    })}
    {[0, 1, 2, 3].map((i) => (
      <mesh key={`l${i}`} position={[Math.cos(i * 1.6) * 0.4, 0.25, Math.sin(i * 1.6) * 0.4]} rotation={[0, i * 1.6, Math.PI / 2 - 0.4]}>
        <CylG args={[0.13, 0.13, 1.6, 6]} />
        <Flat color="#3A2A1E" />
      </mesh>
    ))}
    {/* the cave arch behind (−Z) */}
    {Array.from({ length: 16 }, (_, i) => {
      const a = (i / 15) * Math.PI;
      const r = 13 + random(`ca${i}`) * 2;
      return (
        <mesh key={`c${i}`} position={[Math.cos(a) * r, Math.sin(a) * r * 0.85, -14 - random(`cz${i}`) * 3]} castShadow>
          <IcoG args={[4 + random(`cs${i}`) * 2.5, 1]} />
          <Flat color={i % 2 ? "#4A423A" : "#3E3830"} />
        </mesh>
      );
    })}
    {Array.from({ length: 14 }, (_, i) => {
      const a = random(`br${i}`) * Math.PI * 2;
      const r = 16 + random(`brr${i}`) * 20;
      return (
        <mesh key={`b${i}`} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} castShadow>
          <IcoG args={[1 + random(`brs${i}`) * 2.4, 1]} />
          <Flat color="#3A342E" />
        </mesh>
      );
    })}
    <HillRing radius={200} count={20} color="#141A1E" />
  </group>
);

/** A rooftop at night: parapet along z = 2 (the edge he looks over), a water tank and vents. */
export const Rooftop: React.FC = () => (
  <group>
    <mesh position={[0, -0.05, -6]} receiveShadow>
      <BoxG args={[30, 0.1, 18]} />
      <Flat color="#3A3E4A" />
    </mesh>
    <mesh position={[0, -30, -6]}>
      <BoxG args={[30, 60, 18]} />
      <Flat color="#232838" />
    </mesh>
    <mesh position={[0, 0.6, 3.1]} castShadow receiveShadow>
      <BoxG args={[30, 1.2, 0.6]} />
      <Flat color="#4A4E5A" />
    </mesh>
    <group position={[-9, 0, -9]}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => <Strut key={`${sx}${sz}`} a={[sx * 1.6, 0, sz * 1.6]} b={[sx * 1.4, 5, sz * 1.4]} w={0.2} color="#3A2A22" />),
      )}
      <mesh position={[0, 7, 0]} castShadow>
        <CylG args={[2.4, 2.4, 4, 12]} />
        <Flat color="#6A4A34" />
      </mesh>
      <mesh position={[0, 9.6, 0]}>
        <ConeG args={[2.6, 1.4, 12]} />
        <Flat color="#4A3424" />
      </mesh>
    </group>
    {[5, 9].map((x) => (
      <mesh key={x} position={[x, 0.8, -8]} castShadow>
        <BoxG args={[2, 1.6, 2]} />
        <Flat color="#5A606E" />
      </mesh>
    ))}
  </group>
);

/** A city at night far below a rooftop: a grid of lit towers and a scatter of phone lights in the streets. */
export const NightCity: React.FC<{ y?: number; z?: number; phones?: number; t?: number; pulse?: string }> = ({ y = -40, z = -80, phones = 1, t = 0, pulse }) => (
  <group position={[0, y, z]}>
    {Array.from({ length: 48 }, (_, i) => {
      const gx = (i % 8) - 3.5;
      const gz = Math.floor(i / 8);
      const h = 14 + random(`nc${i}`) * 40;
      return (
        <Building key={i} position={[gx * 18 + (random(`ncx${i}`) - 0.5) * 4, 0, -gz * 22]} w={10 + random(`ncw${i}`) * 4} d={10} h={h} color={[P.bldgNavy, P.bldgPurple, P.bldgSlate, P.bldgTeal][i % 4]} seed={`nc${i}`} litRatio={0.45} />
      );
    })}
    {phones > 0
      ? Array.from({ length: 140 }, (_, i) => {
          const x = (random(`np${i}x`) - 0.5) * 150;
          const zz = -random(`np${i}z`) * 120 + 8;
          const on = pulse ? (Math.sin(t * 5 + i * 1.3) + 1) / 2 : 1;
          return (
            <mesh key={`p${i}`} position={[Math.round(x / 9) * 9 + 4.5, 0.6, zz]}>
              <octahedronGeometry args={[0.35 + on * 0.25, 0]} />
              <Glow color={pulse ?? (i % 3 ? "#9FD0FF" : "#FFE2A0")} opacity={phones * (0.4 + on * 0.6)} />
            </mesh>
          );
        })
      : null}
  </group>
);

/** A simple seated/kneeling pose on the ground (hips low, shins flat). */
export const kneelPose = (over: Partial<Pose> = {}): Pose =>
  mergePose(REST, { lHip: [1.0, 0.12], rHip: [1.0, 0.12], lKnee: 2.25, rKnee: 2.25, lean: 0.15, lShoulder: [0.5, 0.2], rShoulder: [0.5, 0.2], lElbow: 1.1, rElbow: 1.1, ...over });

export { ease };
