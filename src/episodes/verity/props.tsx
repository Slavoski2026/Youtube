/**
 * Props for "What If VERITY Actually Existed in Real Life?" (ep. 8).
 * Everything here is our own design: Verity is a faceted yellow smiley smart speaker, and the creature is a
 * tall, thin, twisted figure wearing the same smile. Nothing from any existing game or character.
 *
 * All sets are at hero scale (Slavoski is 4.2 tall): doors 5.6 high, ceilings 7.5 (living room) and 9.5 (hall).
 */
import React, { useMemo } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { FONT } from "../../slavoski/fonts";
import { BoxG, CircleG, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { LeafyTree, Rain } from "../../slavoski/nature";
import { noise1, type V3 } from "../../slavoski/noise";
import { mix, P } from "../../slavoski/palette";
import { CANVAS_FONT, CanvasPanel, fitText } from "../../slavoski/screens";
import { HillRing, House, Strut } from "../no-work-2036/props";
import { PHONE, Phone3D } from "../ww3-countdown/props";

export const VERITY_YELLOW = "#F4C23A";
export const VERITY_ORANGE = "#FF7A2A";
export const FACE_INK = "#1A1206";

// ---------------------------------------------------------------- the smiley face

const ZAX = new THREE.Vector3(0, 0, 1);
/** A point on a sphere of radius R seen from the front (+Z) at (x, y), with the rotation that faces outward. */
const onSphere = (R: number, x: number, y: number, lift = 0) => {
  const z = Math.sqrt(Math.max(0, R * R - x * x - y * y));
  const n = new THREE.Vector3(x, y, z).normalize();
  const p = n.clone().multiplyScalar(R + lift);
  return { p: [p.x, p.y, p.z] as V3, q: new THREE.Quaternion().setFromUnitVectors(ZAX, n) };
};

/**
 * Eyes and smile laid on the front of a sphere of radius R (centred at the origin, facing +Z).
 * `narrow` 0..1 squints and slants the eyes (refusing, creepy); `wide` 0..1 stretches the grin;
 * `talk` 0..1 opens the mouth; `shut` 0..1 closes the eyes (asleep in the box).
 */
export const SmileyFace: React.FC<{ R: number; narrow?: number; wide?: number; talk?: number; shut?: number; color?: string }> = ({
  R,
  narrow = 0,
  wide = 0,
  talk = 0,
  shut = 0,
  color = FACE_INK,
}) => {
  const N = 21;
  const w = R * (0.5 + 0.2 * wide);
  const y0 = -R * (0.3 + 0.05 * wide);
  const curve = R * (0.24 + 0.12 * wide);
  const segW = ((2 * w) / (N - 1)) * 1.45;
  const eyeH = R * 0.36 * Math.max(0.12, 1 - 0.7 * narrow - 0.88 * shut);
  return (
    <group>
      {[-1, 1].map((s) => {
        const { p, q } = onSphere(R, s * 0.3 * R, 0.2 * R, -0.01 * R);
        return (
          <group key={s} position={p} quaternion={q}>
            <mesh rotation={[0, 0, s * 0.45 * narrow]} scale={[R * 0.11, eyeH / 2, R * 0.06]}>
              <sphereGeometry args={[1, 10, 8]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
      {Array.from({ length: N }, (_, i) => {
        const x = -w + (2 * w * i) / (N - 1);
        const u = x / w;
        const y = y0 + curve * u * u;
        const h = R * (0.08 + 0.26 * talk * (1 - u * u));
        const { p, q } = onSphere(R, x, y - h / 2 + 0.04 * R, -0.005 * R);
        return (
          <mesh key={i} position={p} quaternion={q}>
            <boxGeometry args={[segW, h, R * 0.06]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Height of Verity's centre above the surface it stands on (its dock included). */
export const verityCenter = (R: number) => R * 1.13;

/**
 * Verity: a faceted yellow smiley smart speaker on a small dark dock with a status ring.
 * `position` is the sphere's centre. `awake` 0..1 lights it up; `creepy` 0..1 warms the glow toward orange-red.
 */
export const Verity: React.FC<{
  position: V3;
  R?: number;
  yaw?: number;
  pitch?: number;
  roll?: number;
  awake?: number;
  narrow?: number;
  wide?: number;
  talk?: number;
  shut?: number;
  creepy?: number;
  dock?: boolean;
  light?: number;
  halo?: number;
}> = ({ position, R = 0.55, yaw = 0, pitch = 0, roll = 0, awake = 1, narrow = 0, wide = 0, talk = 0, shut = 0, creepy = 0, dock = true, light = 1, halo = 1 }) => {
  const glow = mix(VERITY_YELLOW, VERITY_ORANGE, creepy);
  const ring = creepy > 0.4 ? "#FF4A3A" : "#5BE0C8";
  return (
    <group position={position}>
      {dock ? (
        <group position={[0, -R * 0.98, 0]}>
          <mesh castShadow receiveShadow>
            <CylG args={[R * 0.62, R * 0.7, R * 0.3, 16]} />
            <Flat color="#22242E" />
          </mesh>
          <mesh position={[0, R * 0.155, 0]}>
            <CylG args={[R * 0.6, R * 0.6, R * 0.04, 16]} />
            {awake > 0.05 ? <Glow color={ring} /> : <Flat color="#3A3D48" />}
          </mesh>
        </group>
      ) : null}
      <group rotation={[pitch, yaw, roll]}>
        <mesh castShadow>
          <IcoG args={[R, 3]} />
          <meshLambertMaterial color={VERITY_YELLOW} flatShading emissive={glow} emissiveIntensity={0.06 + awake * 0.34} />
        </mesh>
        <SmileyFace R={R} narrow={narrow} wide={wide} talk={talk} shut={shut} />
      </group>
      {awake > 0.02 && halo > 0 ? <Halo position={[0, 0, R * 0.3]} size={R * 6} color={glow} opacity={0.32 * awake * halo} /> : null}
      {awake > 0.02 && light > 0 ? <pointLight position={[0, R * 0.2, R * 1.6]} color={glow} intensity={6 * awake * light} distance={12} decay={2} /> : null}
    </group>
  );
};

// ---------------------------------------------------------------- the creature

const BODY = "#1D1A24";
const JOINT = "#2B2634";

/**
 * The creature: about 9 tall, hunched under the ceiling, spindly limbs at wrong angles, and Verity's face
 * (R 1.25) for a head. Faces +Z, feet on y = 0. `reach` 0..1 lifts the long arms forward;
 * `twitch` adds seeded jerks of the head (pass the shot time).
 */
export const Creature: React.FC<{
  position: V3;
  yaw?: number;
  scale?: number;
  t?: number;
  reach?: number;
  headRoll?: number;
  headDrop?: number;
  talk?: number;
  glow?: number;
  twitch?: number;
}> = ({ position, yaw = 0, scale = 1, t = 0, reach = 0, headRoll = 0.38, headDrop = 0, talk = 0, glow = 1, twitch = 1 }) => {
  const L = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const jerk = Math.round(noise1("twitch", t * 2.2) * 3) / 3;
  const roll = headRoll + jerk * 0.22 * twitch;
  const sway = noise1("sway", t * 0.6) * 0.15;
  const head: V3 = [0.25 + sway, 7.45 - headDrop, 2.4];
  const limbs = [-1, 1].map((s) => {
    const hip: V3 = [s * 0.6, 4.2, -0.2];
    const knee: V3 = [s * 1.05, 2.3, 0.75];
    const ankle: V3 = [s * 0.9, 0.35, -0.3];
    const toe: V3 = [s * 1.0, 0.14, 0.75];
    const shoulder: V3 = [s * 0.95, 6.9, 0.9];
    const elbowDown: V3 = s > 0 ? [2.2, 4.9, 1.7] : [-2.0, 5.2, 0.4];
    const wristDown: V3 = s > 0 ? [1.8, 2.0, 2.2] : [-1.9, 2.4, 1.4];
    const elbowUp: V3 = [s * 2.0, 6.3, 2.6];
    const wristUp: V3 = [s * 1.45, 5.5, 4.7];
    const elbow = L(elbowDown, elbowUp, reach);
    const wrist = L(wristDown, wristUp, reach);
    const dir = new THREE.Vector3(...wrist).sub(new THREE.Vector3(...elbow)).normalize();
    const fingers = [-1, 0, 1].map((f) => {
      const side = new THREE.Vector3(s * 0.28 * f, 0, 0.2 * f);
      const tip = new THREE.Vector3(...wrist).add(dir.clone().multiplyScalar(1.15)).add(side);
      const curl = tip.clone().add(new THREE.Vector3(0, -0.15, 0.25));
      return { a: wrist, b: [tip.x, tip.y, tip.z] as V3, c: [curl.x, curl.y, curl.z] as V3 };
    });
    return { s, hip, knee, ankle, toe, shoulder, elbow, wrist, fingers };
  });
  const faceColor = mix(VERITY_YELLOW, VERITY_ORANGE, 0.15);
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      {limbs.map((l) => (
        <group key={l.s}>
          <Strut a={l.hip} b={l.knee} w={0.42} color={BODY} />
          <Strut a={l.knee} b={l.ankle} w={0.32} color={BODY} />
          <Strut a={l.ankle} b={l.toe} w={0.38} d={0.3} color={JOINT} />
          <Strut a={l.shoulder} b={l.elbow} w={0.3} color={BODY} />
          <Strut a={l.elbow} b={l.wrist} w={0.24} color={BODY} />
          {[l.knee, l.elbow, l.wrist].map((j, i) => (
            <mesh key={i} position={j} castShadow>
              <IcoG args={[i === 0 ? 0.3 : 0.22, 1]} />
              <Flat color={JOINT} />
            </mesh>
          ))}
          {l.fingers.map((f, i) => (
            <group key={i}>
              <Strut a={f.a} b={f.b} w={0.1} color={BODY} />
              <Strut a={f.b} b={f.c} w={0.08} color={BODY} />
            </group>
          ))}
        </group>
      ))}
      {/* pelvis to chest, hunched forward, with a ribcage and spine knobs */}
      <Strut a={[0, 4.1, -0.25]} b={[0, 7.0, 0.85]} w={1.2} d={0.7} color={BODY} />
      <Strut a={[0, 5.7, 0.4]} b={[0, 7.15, 1.0]} w={1.6} d={0.95} color={JOINT} />
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, 4.6 + i * 0.58, -0.45 + i * 0.25]} castShadow>
          <IcoG args={[0.18, 0]} />
          <Flat color={JOINT} />
        </mesh>
      ))}
      <Strut a={[0, 7.1, 1.0]} b={[head[0], head[1] - 0.9, head[2] - 0.6]} w={0.34} color={BODY} />
      <group position={head} rotation={[0.25, -0.1, roll]}>
        <mesh castShadow>
          <IcoG args={[1.25, 3]} />
          <meshLambertMaterial color={VERITY_YELLOW} flatShading emissive={faceColor} emissiveIntensity={0.04 + 0.44 * glow} />
        </mesh>
        <SmileyFace R={1.25} narrow={0.35} wide={1} talk={talk} />
      </group>
      {glow > 0 ? (
        <>
          <Halo position={[head[0], head[1], head[2] + 0.6]} size={7} color={faceColor} opacity={0.3 * glow} />
          <pointLight position={[head[0], head[1] - 0.4, head[2] + 2.2]} color={faceColor} intensity={10 * glow} distance={14} decay={2} />
        </>
      ) : null}
    </group>
  );
};

// ---------------------------------------------------------------- living room

/** Living room layout (hero scale). The couch faces +Z under the back-wall window. */
export const ROOM = {
  ceiling: 7.5,
  backZ: -10,
  win: { x: 0, y: 3.6, w: 8, h: 4 },
  seat: [1.6, 0, -6.6] as V3,
  table: { c: [0, 0, -3] as V3, top: 1.2, w: 4.6, d: 2.2 },
  verity: [0.7, 0, -3.1] as V3,
  side: { c: [6.6, 0, -7.6] as V3, top: 1.5 },
  socket: [4.5, 0.9, -9.88] as V3,
  lamp: [-6.8, 0, -8.4] as V3,
  pendant: [0, 6.0, -3] as V3,
};
export const VERITY_R = 0.55;
export const verityOnTable = (): V3 => [ROOM.verity[0], ROOM.table.top + verityCenter(VERITY_R), ROOM.verity[2]];
export const phoneOnSide = (): V3 => [ROOM.side.c[0] - 0.1, ROOM.side.top + PHONE.d / 2, ROOM.side.c[2] + 0.2];

type WindowSky = "golden" | "night" | "day";
const SKY_COLORS: Record<WindowSky, [string, string]> = {
  golden: ["#2E3560", "#F49A5C"],
  night: ["#070A1C", "#1A2148"],
  day: ["#4A8FD6", "#C4E0F6"],
};

const GradientPlane: React.FC<{ position: V3; size: [number, number]; top: string; bottom: string; rotation?: V3 }> = ({ position, size, top, bottom, rotation = [0, 0, 0] }) => (
  <mesh position={position} rotation={rotation}>
    <planeGeometry args={size} />
    <shaderMaterial
      uniforms={{ top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) } }}
      vertexShader="varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }"
      fragmentShader="uniform vec3 top; uniform vec3 bottom; varying vec2 vUv; void main(){ gl_FragColor = vec4(mix(bottom, top, smoothstep(0.25, 0.85, vUv.y)), 1.0); }"
    />
  </mesh>
);

/** A wall with a rectangular opening, built from four boxes. Wall lies in the XY plane at z, thickness d. */
const WallWithHole: React.FC<{ x0: number; x1: number; y1: number; hole: [number, number, number, number]; z: number; d?: number; color: string; axis?: "x" | "z" }> = ({
  x0,
  x1,
  y1,
  hole,
  z,
  d = 0.3,
  color,
  axis = "z",
}) => {
  const [hx0, hx1, hy0, hy1] = hole;
  const pieces: [number, number, number, number][] = [
    [x0, hx0, 0, y1],
    [hx1, x1, 0, y1],
    [hx0, hx1, 0, hy0],
    [hx0, hx1, hy1, y1],
  ];
  return (
    <group>
      {pieces
        .filter(([a, b, c, e]) => b - a > 0.01 && e - c > 0.01)
        .map(([a, b, c, e], i) => {
          const cx = (a + b) / 2;
          const cy = (c + e) / 2;
          return (
            <mesh key={i} position={axis === "z" ? [cx, cy, z] : [z, cy, cx]} receiveShadow>
              <BoxG args={axis === "z" ? [b - a, e - c, d] : [d, e - c, b - a]} />
              <Flat color={color} />
            </mesh>
          );
        })}
    </group>
  );
};

/** Neighbouring rooftops and trees seen through a window. */
const WindowView: React.FC<{ z: number; sky: WindowSky; t: number; rain?: boolean; lit?: boolean }> = ({ z, sky, t, rain, lit = true }) => {
  const [top, bottom] = SKY_COLORS[sky];
  const dark = sky === "night" ? "#0C1024" : sky === "golden" ? "#3A2E44" : "#5A6A80";
  return (
    <group>
      <GradientPlane position={[0, 6, z - 14]} size={[60, 22]} top={top} bottom={bottom} />
      {[-12, -4.5, 4, 12].map((x, i) => (
        <group key={i} position={[x, 0, z - 9 - (i % 2) * 2]}>
          <mesh position={[0, 2.4, 0]}>
            <BoxG args={[6, 4.8, 1]} />
            <Flat color={dark} />
          </mesh>
          <mesh position={[0, 5.6, 0]} rotation={[0, 0, Math.PI / 4]}>
            <BoxG args={[3.2, 3.2, 1]} />
            <Flat color={dark} />
          </mesh>
          {lit ? (
            <mesh position={[(i % 2 ? 1 : -1) * 1.2, 2.6, 0.52]}>
              <planeGeometry args={[1.1, 1.2]} />
              <Glow color={sky === "day" ? "#8FB3D9" : P.windowLit} />
            </mesh>
          ) : null}
        </group>
      ))}
      {[-8, 8].map((x) => (
        <LeafyTree key={x} position={[x, 0, z - 5]} scale={1.6} seed={`wv${x}`} />
      ))}
      {sky === "night" ? (
        <mesh position={[9, 9.5, z - 13]}>
          <CircleG args={[0.9, 14]} />
          <Glow color="#E8ECF5" fog={false} />
        </mesh>
      ) : null}
      {rain ? <Rain center={[0, 4, z - 2]} size={[12, 9, 3]} t={t} count={160} seed="winrain" thickness={0.025} opacity={0.5} /> : null}
    </group>
  );
};

/** A wall socket (with the plug in it when `plugged`). Faces +Z at `position` on the back wall. */
export const Socket: React.FC<{ position: V3; plugged?: number }> = ({ position, plugged = 1 }) => (
  <group position={position}>
    <mesh>
      <BoxG args={[0.55, 0.75, 0.06]} />
      <Flat color="#E8E4DA" />
    </mesh>
    {[0.16, -0.16].map((y) => (
      <group key={y} position={[0, y, 0.035]}>
        {[-0.07, 0.07].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <BoxG args={[0.04, 0.09, 0.01]} />
            <Flat color="#2A2A30" />
          </mesh>
        ))}
      </group>
    ))}
    {plugged > 0 ? (
      <mesh position={[0, 0.16, 0.03 + 0.18 + (1 - plugged) * 0.8]} castShadow>
        <BoxG args={[0.3, 0.3, 0.36]} />
        <Flat color="#F0EDE4" />
      </mesh>
    ) : null}
  </group>
);

/** Verity's power cable: from the socket down the wall, across the floor, up the table leg. */
const Cable: React.FC<{ plugged: boolean }> = ({ plugged }) => {
  const s = ROOM.socket;
  const tl: V3 = [ROOM.table.c[0] + 0.6, 0.04, ROOM.table.c[2] - ROOM.table.d / 2 + 0.25];
  const pts: V3[] = plugged
    ? [[s[0], s[1] + 0.16, s[2] + 0.4], [s[0], 0.04, s[2] + 0.5], [s[0] - 1.5, 0.04, -7.2], [tl[0] + 0.5, 0.04, tl[2] - 0.3], tl, [tl[0], ROOM.table.top + 0.05, tl[2]]]
    : [[s[0] - 0.6, 0.04, s[2] + 1.6], [s[0] - 1.5, 0.04, -7.2], [tl[0] + 0.5, 0.04, tl[2] - 0.3], tl, [tl[0], ROOM.table.top + 0.05, tl[2]]];
  return (
    <group>
      {pts.slice(1).map((b, i) => (
        <Strut key={i} a={pts[i]} b={b} w={0.07} color="#E8E4DA" />
      ))}
    </group>
  );
};

/**
 * The living room. `lamp` and `pendant` 0..1 (lights on), `sky` for the window, `rain` streaks past it.
 * `phone` draws Slavoski's phone on the side table (with a screen glow when `phoneGlow`).
 */
export const LivingRoom: React.FC<{
  t: number;
  sky?: WindowSky;
  lamp?: number;
  pendant?: number;
  rain?: boolean;
  /** 1 = plugged in, 0 = pulled out (the plug slides away from the socket). */
  plug?: number;
  phone?: boolean;
  phoneGlow?: string;
  notebook?: boolean;
}> = ({ t, sky = "night", lamp = 1, pendant = 0, rain = false, plug = 1, phone = true, phoneGlow, notebook = false }) => {
  const wall = "#584A68";
  const W = ROOM.win;
  const C = ROOM.ceiling;
  return (
    <group>
      {/* floor, rug, ceiling */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <BoxG args={[24, 0.2, 22]} />
        <Flat color="#5A4034" />
      </mesh>
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={i} position={[-11 + i * 2.2, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[0.04, 22]} />
          <Flat color="#4A342A" />
        </mesh>
      ))}
      <mesh position={[0, 0.01, -3.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11, 7.4]} />
        <Flat color="#7A3A4A" />
      </mesh>
      <mesh position={[0, 0.015, -3.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9.8, 6.2]} />
        <Flat color="#8C4A56" />
      </mesh>
      <mesh position={[0, C + 0.1, 0]}>
        <BoxG args={[24, 0.2, 22]} />
        <Flat color="#4A3E58" />
      </mesh>
      {/* back wall with the window, left wall with the hall doorway, right wall */}
      <WallWithHole x0={-12} x1={12} y1={C} hole={[W.x - W.w / 2, W.x + W.w / 2, W.y - W.h / 2, W.y + W.h / 2]} z={ROOM.backZ - 0.15} color={wall} />
      <WallWithHole x0={-11} x1={11} y1={C} hole={[1.5, 5.5, 0, 5.6]} z={-12.15} color="#4E425E" axis="x" />
      <mesh position={[-16, 3, 3.5]}>
        <BoxG args={[0.2, 6, 4]} />
        <Flat color="#141220" />
      </mesh>
      <mesh position={[12.15, C / 2, 0]} receiveShadow>
        <BoxG args={[0.3, C, 22]} />
        <Flat color="#4E425E" />
      </mesh>
      {/* skirting */}
      <mesh position={[0, 0.2, ROOM.backZ + 0.02]}>
        <BoxG args={[24, 0.4, 0.06]} />
        <Flat color="#E6DCCB" />
      </mesh>
      {/* window frame */}
      {[
        [W.x, W.y + W.h / 2, W.w + 0.4, 0.25],
        [W.x, W.y - W.h / 2, W.w + 0.6, 0.3],
        [W.x, W.y, W.w, 0.12],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, ROOM.backZ + 0.05]}>
          <BoxG args={[w, h, 0.25]} />
          <Flat color="#E6DCCB" />
        </mesh>
      ))}
      {[-W.w / 2, 0, W.w / 2].map((x) => (
        <mesh key={x} position={[W.x + x, W.y, ROOM.backZ + 0.05]}>
          <BoxG args={[0.18, W.h, 0.25]} />
          <Flat color="#E6DCCB" />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[W.x + s * (W.w / 2 + 0.9), W.y + 0.4, ROOM.backZ + 0.25]} castShadow>
          <BoxG args={[1.3, W.h + 1.6, 0.18]} />
          <Flat color="#7A3A4A" />
        </mesh>
      ))}
      <WindowView z={ROOM.backZ} sky={sky} t={t} rain={rain} />
      {/* couch, facing +Z */}
      <group>
        <mesh position={[0, 0.325, -6.85]} castShadow receiveShadow>
          <BoxG args={[9, 0.65, 1.4]} />
          <Flat color="#2E5A6A" />
        </mesh>
        <mesh position={[0, 1.3, -7.75]} castShadow receiveShadow>
          <BoxG args={[9, 2.6, 0.5]} />
          <Flat color="#264E5E" />
        </mesh>
        {[-4.7, 4.7].map((x) => (
          <mesh key={x} position={[x, 0.8, -7.0]} castShadow>
            <BoxG args={[0.5, 1.6, 2.0]} />
            <Flat color="#264E5E" />
          </mesh>
        ))}
        {[-3.4, -1.6].map((x, i) => (
          <mesh key={x} position={[x, 1.25, -7.25]} rotation={[-0.2, 0, i ? 0.12 : -0.1]} castShadow>
            <BoxG args={[1.3, 1.1, 0.35]} />
            <Flat color={i ? P.amber : "#C8A04E"} />
          </mesh>
        ))}
      </group>
      {/* coffee table */}
      <group position={ROOM.table.c}>
        <mesh position={[0, ROOM.table.top - 0.08, 0]} castShadow receiveShadow>
          <BoxG args={[ROOM.table.w, 0.16, ROOM.table.d]} />
          <Flat color="#7A5A3E" />
        </mesh>
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => (
            <mesh key={`${sx}${sz}`} position={[sx * (ROOM.table.w / 2 - 0.25), (ROOM.table.top - 0.16) / 2, sz * (ROOM.table.d / 2 - 0.25)]} castShadow>
              <BoxG args={[0.18, ROOM.table.top - 0.16, 0.18]} />
              <Flat color="#5A4030" />
            </mesh>
          )),
        )}
        {notebook ? null : (
          <mesh position={[-1.3, ROOM.table.top + 0.05, 0.2]} rotation={[0, 0.3, 0]} castShadow>
            <BoxG args={[1.0, 0.1, 1.3]} />
            <Flat color="#3E6AA8" />
          </mesh>
        )}
      </group>
      <Cable plugged={plug > 0.5} />
      <Socket position={ROOM.socket} plugged={plug > 0.5 ? plug : 0} />
      {/* floor lamp */}
      <group position={ROOM.lamp}>
        <mesh position={[0, 0.1, 0]}>
          <CylG args={[0.5, 0.6, 0.2, 10]} />
          <Flat color={P.pole} />
        </mesh>
        <mesh position={[0, 2.6, 0]}>
          <CylG args={[0.07, 0.07, 5.2, 6]} />
          <Flat color={P.pole} />
        </mesh>
        <mesh position={[0, 5.4, 0]}>
          <ConeG args={[0.85, 1.0, 10, 1, true]} />
          {lamp > 0.05 ? <Glow color={mix("#5A4A3A", P.lampGlow, lamp)} /> : <Flat color="#6A5A48" />}
        </mesh>
        {lamp > 0.05 ? (
          <>
            <pointLight position={[0, 4.9, 0.8]} color="#FFD49A" intensity={26 * lamp} distance={20} decay={2} />
            <Halo position={[0, 5.3, 0.3]} size={4} color={P.lampGlow} opacity={0.35 * lamp} />
          </>
        ) : null}
      </group>
      {/* ceiling pendant */}
      <group position={ROOM.pendant}>
        <mesh position={[0, (C - ROOM.pendant[1]) / 2, 0]}>
          <CylG args={[0.03, 0.03, C - ROOM.pendant[1], 4]} />
          <Flat color="#1A1A20" />
        </mesh>
        <mesh>
          <ConeG args={[0.9, 0.7, 10, 1, true]} />
          <Flat color="#2A2A34" />
        </mesh>
        <mesh position={[0, -0.25, 0]}>
          <IcoG args={[0.28, 1]} />
          {pendant > 0.05 ? <Glow color={mix("#6A6050", "#FFF0C8", pendant)} /> : <Flat color="#4A4A50" />}
        </mesh>
        {pendant > 0.05 ? (
          <>
            <pointLight position={[0, -0.8, 0]} color="#FFE6B8" intensity={30 * pendant} distance={22} decay={2} />
            <Halo position={[0, -0.3, 0]} size={3} color="#FFE6B8" opacity={0.4 * pendant} />
          </>
        ) : null}
      </group>
      {/* side table with the phone */}
      <mesh position={[ROOM.side.c[0], ROOM.side.top / 2, ROOM.side.c[2]]} castShadow receiveShadow>
        <BoxG args={[1.7, ROOM.side.top, 1.7]} />
        <Flat color="#5A4030" />
      </mesh>
      {phone ? <Phone3D position={phoneOnSide()} rotation={[-Math.PI / 2, 0, 0.3]} glow={phoneGlow ?? "#0A0B10"} /> : null}
      {/* bookshelf on the right wall */}
      <group position={[11.4, 0, -3]}>
        <mesh position={[0, 3, 0]} castShadow receiveShadow>
          <BoxG args={[1.2, 6, 5]} />
          <Flat color="#4A3428" />
        </mesh>
        {[1.2, 2.6, 4.0, 5.3].map((y, r) =>
          Array.from({ length: 8 }, (_, i) => {
            const h = 0.7 + random(`bk${r}${i}`) * 0.4;
            return (
              <mesh key={`${r}${i}`} position={[-0.62, y + h / 2 - 0.4, -2.1 + i * 0.55]}>
                <BoxG args={[0.12, h, 0.42]} />
                <Flat color={["#C8372D", "#24748F", P.amber, "#5A4A78", "#E6DCCB", "#2F7A5A"][(r * 3 + i) % 6]} />
              </mesh>
            );
          }),
        )}
      </group>
      {/* plant */}
      <group position={[-9.6, 0, -8.6]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <CylG args={[0.7, 0.55, 1.2, 8]} />
          <Flat color="#B8643A" />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[Math.cos(i * 1.7) * 0.5, 1.9 + i * 0.5, Math.sin(i * 1.7) * 0.5]} castShadow>
            <IcoG args={[0.8 - i * 0.12, 0]} />
            <Flat color={i % 2 ? P.leafDark : P.leaf} />
          </mesh>
        ))}
      </group>
      {/* a framed picture on the right part of the back wall */}
      <mesh position={[8, 4, ROOM.backZ + 0.03]}>
        <BoxG args={[2.4, 1.8, 0.08]} />
        <Flat color="#E6DCCB" />
      </mesh>
      <mesh position={[8, 4, ROOM.backZ + 0.08]}>
        <planeGeometry args={[2.0, 1.4]} />
        <Flat color="#2F7A5A" />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------- hallway

/** Hallway layout: runs along Z, front door at z = 12, stairs up the left wall, creature room at the far end. */
export const HALL = {
  x: 5,
  z0: -26,
  z1: 12,
  ceiling: 9.5,
  door: { z: 11.85, w: 2.8, h: 5.6 },
  lock: [0.95, 3.3, 11.68] as V3,
  lights: [7, -3, -13],
};

/** The smart lock's screen: a red padlock and LOCKED, or Verity's face (talking with `talk`). */
export const drawLock = (state: "locked" | "smile", talk = 0) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0E0F14";
  ctx.fillRect(0, 0, W, H);
  if (state === "locked") {
    ctx.strokeStyle = "#FF4A3A";
    ctx.lineWidth = W * 0.06;
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.36, W * 0.17, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = "#FF4A3A";
    ctx.fillRect(W * 0.26, H * 0.36, W * 0.48, H * 0.26);
    ctx.fillStyle = "#0E0F14";
    ctx.fillRect(W * 0.47, H * 0.43, W * 0.06, H * 0.1);
    fitText(ctx, "LOCKED", W / 2, H * 0.78, W * 0.84, W * 0.2, "#FF4A3A");
  } else {
    const cx = W / 2;
    const cy = H * 0.45;
    const r = W * 0.38;
    ctx.fillStyle = VERITY_YELLOW;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = FACE_INK;
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.ellipse(cx + s * r * 0.32, cy - r * 0.2, r * 0.1, r * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = FACE_INK;
    ctx.lineWidth = r * (0.12 + talk * 0.2);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.05, r * 0.55, Math.PI * 0.18, Math.PI * 0.82);
    ctx.stroke();
    fitText(ctx, "HI!", W / 2, H * 0.88, W * 0.6, W * 0.16, VERITY_YELLOW);
  }
};

/**
 * The hallway. `lights` 0..1 for each ceiling light (front to back), `front` draws the front-door wall
 * (leave it off when the camera stands behind it), `lock` picks the smart-lock screen.
 */
export const Hallway: React.FC<{
  t: number;
  lights?: [number, number, number];
  front?: boolean;
  lock?: "locked" | "smile";
  lockTalk?: number;
  upstairsGlow?: number;
}> = ({ t, lights = [0.6, 0.4, 0.2], front = true, lock = "locked", lockTalk = 0, upstairsGlow = 0 }) => {
  const H = HALL;
  const wall = "#3E4A5A";
  const lower = "#2C3442";
  const len = H.z1 - H.z0;
  const zc = (H.z1 + H.z0) / 2;
  const stepRise = 0.5;
  const stepRun = 0.85;
  const steps = 14;
  const stairZ0 = -1;
  const stairTopZ = stairZ0 - steps * stepRun;
  const landY = steps * stepRise;
  return (
    <group>
      <mesh position={[0, -0.1, zc]} receiveShadow>
        <BoxG args={[H.x * 2, 0.2, len]} />
        <Flat color="#4A3328" />
      </mesh>
      <mesh position={[1.6, 0.01, zc]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.8, len - 2]} />
        <Flat color="#6A2E3A" />
      </mesh>
      {/* walls: right full height; left lower part plus the tall stairwell */}
      <mesh position={[H.x + 0.15, H.ceiling / 2, zc]} receiveShadow>
        <BoxG args={[0.3, H.ceiling, len]} />
        <Flat color={wall} />
      </mesh>
      <mesh position={[H.x - 0.02, 1.1, zc]}>
        <BoxG args={[0.06, 2.2, len]} />
        <Flat color={lower} />
      </mesh>
      <mesh position={[-H.x - 0.15, 8, zc]} receiveShadow>
        <BoxG args={[0.3, 16, len]} />
        <Flat color={wall} />
      </mesh>
      <mesh position={[-H.x + 0.02, 1.1, (H.z1 + stairZ0) / 2]}>
        <BoxG args={[0.06, 2.2, H.z1 - stairZ0]} />
        <Flat color={lower} />
      </mesh>
      {/* ceilings: low over the hall, high over the stairwell */}
      <mesh position={[1.6, H.ceiling + 0.1, zc]}>
        <BoxG args={[6.8, 0.2, len]} />
        <Flat color="#323A48" />
      </mesh>
      <mesh position={[-3.4, H.ceiling + 0.1, (H.z1 + stairZ0) / 2]}>
        <BoxG args={[3.2, 0.2, H.z1 - stairZ0]} />
        <Flat color="#323A48" />
      </mesh>
      <mesh position={[-3.4, 16, (stairZ0 + H.z0) / 2]}>
        <BoxG args={[3.2, 0.2, stairZ0 - H.z0]} />
        <Flat color="#262C38" />
      </mesh>
      <mesh position={[-1.8, (H.ceiling + 16) / 2, (stairZ0 + H.z0) / 2]}>
        <BoxG args={[0.2, 16 - H.ceiling, stairZ0 - H.z0]} />
        <Flat color={wall} />
      </mesh>
      {/* far wall */}
      <mesh position={[0, 8, H.z0 - 0.15]}>
        <BoxG args={[H.x * 2, 16, 0.3]} />
        <Flat color="#323A48" />
      </mesh>
      {/* stairs, landing, rail */}
      {Array.from({ length: steps }, (_, k) => {
        const h = (k + 1) * stepRise;
        return (
          <group key={k}>
            <mesh position={[-3.4, h / 2, stairZ0 - k * stepRun - stepRun / 2]} castShadow receiveShadow>
              <BoxG args={[3.2, h, stepRun]} />
              <Flat color={k % 2 ? "#5A4030" : "#62463A"} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[-3.4, landY - 0.15, (stairTopZ + H.z0) / 2]} receiveShadow>
        <BoxG args={[3.2, 0.3, stairTopZ - H.z0]} />
        <Flat color="#5A4030" />
      </mesh>
      <mesh position={[-3.4, landY / 2 - 0.15, (stairTopZ + H.z0) / 2]}>
        <BoxG args={[3.0, landY - 0.3, stairTopZ - H.z0]} />
        <Flat color={lower} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const z = stairZ0 - 0.4 - i * 1.6;
        const y = Math.max(0, (stairZ0 - z) / stepRun) * stepRise;
        return (
          <mesh key={i} position={[-1.95, y + 1.4, z]} castShadow>
            <BoxG args={[0.12, 2.8, 0.12]} />
            <Flat color="#E6DCCB" />
          </mesh>
        );
      })}
      <Strut a={[-1.95, 2.8, stairZ0 - 0.2]} b={[-1.95, landY + 2.8, stairTopZ]} w={0.16} color="#7A5A3E" />
      {/* the dark upstairs doorway at the top of the stairs */}
      <mesh position={[-H.x + 0.05, landY + 2.6, stairTopZ - 4]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.6, 5.2]} />
        {upstairsGlow > 0.02 ? <Glow color={mix("#0A0A10", VERITY_YELLOW, upstairsGlow * 0.6)} /> : <Flat color="#0A0A10" />}
      </mesh>
      {upstairsGlow > 0.02 ? <pointLight position={[-3.2, landY + 2.6, stairTopZ - 4]} color={VERITY_YELLOW} intensity={8 * upstairsGlow} distance={12} decay={2} /> : null}
      {/* picture frames and a console table */}
      {[3, -5, -16].map((z, i) => (
        <group key={z} position={[H.x - 0.05, 4.6, z]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh>
            <BoxG args={[2.2, 1.6, 0.08]} />
            <Flat color="#B8A27A" />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <planeGeometry args={[1.8, 1.2]} />
            <Flat color={["#2E5A6A", "#5A4A78", "#7A3A4A"][i]} />
          </mesh>
        </group>
      ))}
      <group position={[3.9, 0, 7.6]}>
        <mesh position={[0, 1.6, 0]} castShadow>
          <BoxG args={[1.6, 0.16, 3.0]} />
          <Flat color="#5A4030" />
        </mesh>
        {[-1.3, 1.3].map((z) => (
          <mesh key={z} position={[0, 0.76, z]}>
            <BoxG args={[0.12, 1.52, 0.12]} />
            <Flat color="#5A4030" />
          </mesh>
        ))}
        <mesh position={[0, 1.85, 0.6]}>
          <CylG args={[0.4, 0.25, 0.35, 10]} />
          <Flat color="#24748F" />
        </mesh>
      </group>
      {/* ceiling lights */}
      {H.lights.map((z, i) => {
        const L = lights[i] ?? 0;
        return (
          <group key={z} position={[1.6, H.ceiling - 0.05, z]}>
            <mesh>
              <CylG args={[0.55, 0.65, 0.12, 12]} />
              <Flat color="#B8B0A0" />
            </mesh>
            <mesh position={[0, -0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <CircleG args={[0.45, 12]} />
              {L > 0.03 ? <Glow color={mix("#5A5650", "#FFF0D0", L)} /> : <Flat color="#5A5650" />}
            </mesh>
            {L > 0.03 ? (
              <>
                <pointLight position={[0, -0.8, 0]} color="#FFE8C0" intensity={22 * L} distance={16} decay={2} />
                <Halo position={[0, -0.25, 0]} size={2.4} color="#FFE8C0" opacity={0.35 * L} />
              </>
            ) : null}
          </group>
        );
      })}
      {/* front door wall */}
      {front ? (
        <group>
          <WallWithHole x0={-H.x} x1={H.x} y1={H.ceiling} hole={[-H.door.w / 2, H.door.w / 2, 0, H.door.h]} z={H.z1 + 0.15} color={wall} />
          <mesh position={[0, H.door.h / 2, H.door.z + 0.1]} castShadow>
            <BoxG args={[H.door.w, H.door.h, 0.25]} />
            <Flat color="#6A2A2A" />
          </mesh>
          {[1.4, 3.9].map((y) => (
            <mesh key={y} position={[0, y, H.door.z - 0.04]}>
              <BoxG args={[H.door.w - 0.8, 1.7, 0.05]} />
              <Flat color="#5A2222" />
            </mesh>
          ))}
          <mesh position={[0.95, 2.6, H.door.z - 0.12]} castShadow>
            <BoxG args={[0.4, 0.14, 0.14]} />
            <Flat color="#D8B060" />
          </mesh>
          <mesh position={[HALL.lock[0], HALL.lock[1], HALL.lock[2] + 0.04]}>
            <BoxG args={[0.62, 0.86, 0.06]} />
            <Flat color="#2A2C34" />
          </mesh>
          <CanvasPanel position={HALL.lock} rotation={[0, Math.PI, 0]} w={0.5} h={0.72} px={256} draw={drawLock(lock, lockTalk)} />
          {/* narrow sidelight window: rain outside */}
          <mesh position={[2.6, 3.4, H.z1 + 0.02]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.9, 3.6]} />
            <Glow color="#1A2440" />
          </mesh>
          <Rain center={[2.6, 3.4, H.z1 + 1.2]} size={[1.4, 4, 0.8]} t={t} count={30} seed="side" thickness={0.02} opacity={0.6} />
        </group>
      ) : null}
    </group>
  );
};

// ---------------------------------------------------------------- the house from outside

const roofGeom = (len: number, depth: number, height: number) => {
  const s = new THREE.Shape();
  s.moveTo(-depth / 2, 0);
  s.lineTo(depth / 2, 0);
  s.lineTo(0, height);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
  g.rotateY(Math.PI / 2);
  g.translate(-len / 2, 0, 0);
  return g.toNonIndexed();
};

/** Drawn in the upstairs window: a yellow glow with Verity's smile in it. */
const drawSmileWindow = (k: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  const g = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, W * 0.9);
  g.addColorStop(0, mix("#22304F", "#FFD860", k));
  g.addColorStop(1, mix("#22304F", "#8A5A10", k));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  if (k > 0.3) {
    ctx.fillStyle = `rgba(26,18,6,${Math.min(1, (k - 0.3) * 2)})`;
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.ellipse(W / 2 + s * W * 0.14, H * 0.36, W * 0.05, H * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = `rgba(26,18,6,${Math.min(1, (k - 0.3) * 2)})`;
    ctx.lineWidth = W * 0.05;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.4, W * 0.26, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
  }
  ctx.fillStyle = "#E6DCCB";
  ctx.fillRect(W / 2 - W * 0.025, 0, W * 0.05, H);
  ctx.fillRect(0, H / 2 - H * 0.02, W, H * 0.04);
};

export const HOUSE = { w: 20, h: 15, d: 14, porchY: 0.9, door: { w: 2.8, h: 5.6 } };

/** A cardboard parcel; `open` 0..1 swings the four flaps out. Origin at the bottom centre. */
export const Parcel: React.FC<{ position: V3; yaw?: number; open?: number; size?: [number, number, number] }> = ({ position, yaw = 0, open = 0, size = [1.5, 1.1, 1.3] }) => {
  const [w, h, d] = size;
  const a = open * 2.0;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {open > 0.05 ? (
        <group>
          <mesh position={[0, 0.03, 0]} receiveShadow>
            <BoxG args={[w, 0.06, d]} />
            <Flat color="#5A4030" />
          </mesh>
          {[
            [0, d / 2 - 0.03, w, 0.06],
            [0, -d / 2 + 0.03, w, 0.06],
          ].map(([x, z, ww, dd], i) => (
            <mesh key={`z${i}`} position={[x, h / 2, z]} castShadow receiveShadow>
              <BoxG args={[ww, h, dd]} />
              <Flat color="#B88A58" />
            </mesh>
          ))}
          {[-1, 1].map((sx) => (
            <mesh key={`x${sx}`} position={[sx * (w / 2 - 0.03), h / 2, 0]} castShadow receiveShadow>
              <BoxG args={[0.06, h, d - 0.12]} />
              <Flat color="#A87A48" />
            </mesh>
          ))}
        </group>
      ) : (
        <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
          <BoxG args={[w, h, d]} />
          <Flat color="#B88A58" />
        </mesh>
      )}
      {open > 0.05 ? null : (
        <mesh position={[0, h + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.24, d + 0.01]} />
          <Flat color="#D8C08A" />
        </mesh>
      )}
      {/* the label: a black question mark */}
      <mesh position={[0.3, h * 0.55, d / 2 + 0.005]}>
        <planeGeometry args={[0.55, 0.4]} />
        <Flat color="#F0EDE4" />
      </mesh>
      <CanvasPanel
        position={[0.3, h * 0.55, d / 2 + 0.008]}
        w={0.5}
        h={0.36}
        px={128}
        draw={(ctx, W, H) => {
          ctx.fillStyle = "#F0EDE4";
          ctx.fillRect(0, 0, W, H);
          fitText(ctx, "?", W / 2, H / 2 + 4, W * 0.5, H * 0.9, "#14121C");
        }}
      />
      {open > 0.05
        ? [
            { p: [0, h, d / 2] as V3, r: [a, 0, 0] as V3, s: [w, 0.04, d / 2] as V3, off: [0, 0, -d / 4] as V3 },
            { p: [0, h, -d / 2] as V3, r: [-a, 0, 0] as V3, s: [w, 0.04, d / 2] as V3, off: [0, 0, d / 4] as V3 },
            { p: [w / 2, h, 0] as V3, r: [0, 0, -a] as V3, s: [w / 2, 0.04, d] as V3, off: [-w / 4, 0, 0] as V3 },
            { p: [-w / 2, h, 0] as V3, r: [0, 0, a] as V3, s: [w / 2, 0.04, d] as V3, off: [w / 4, 0, 0] as V3 },
          ].map((f, i) => (
            <group key={i} position={f.p} rotation={f.r}>
              <mesh position={f.off} castShadow>
                <BoxG args={f.s} />
                <Flat color={i < 2 ? "#C49460" : "#AE8250"} />
              </mesh>
            </group>
          ))
        : null}
    </group>
  );
};

/** Crinkled packing paper inside the open box. */
export const Paper: React.FC<{ position: V3; count?: number; spread?: [number, number] }> = ({ position, count = 9, spread = [1.2, 1.0] }) => (
  <group position={position}>
    {Array.from({ length: count }, (_, i) => (
      <mesh key={i} position={[(random(`pp${i}`) - 0.5) * spread[0], random(`ppy${i}`) * 0.1, (random(`ppz${i}`) - 0.5) * spread[1]]} rotation={[random(`pr${i}`) * 3, random(`pr2${i}`) * 3, 0]}>
        <IcoG args={[0.22 + random(`ps${i}`) * 0.1, 0]} />
        <Flat color={i % 2 ? "#E8DCC4" : "#D8C8A8"} />
      </mesh>
    ))}
  </group>
);

/**
 * Slavoski's house seen from the front yard: a two-storey house with a porch, at z = 0 (front face).
 * `doorOpen` 0..1 swings the front door in. `upGlow` 0..1 lights the upstairs middle window with the smile.
 */
export const HouseFront: React.FC<{ t: number; night?: boolean; lit?: boolean; doorOpen?: number; upGlow?: number; rain?: boolean; storm?: boolean }> = ({
  t,
  night = false,
  lit = true,
  doorOpen = 0,
  upGlow = 0,
  rain = false,
}) => {
  const { w, h, d, porchY } = HOUSE;
  const roof = useMemo(() => roofGeom(w + 1.4, d + 1.6, 6), [w, d]);
  const siding = "#7E90A8";
  const trim = "#E6DCCB";
  const win = (lit && night) ? P.windowLit : night ? "#1A2240" : "#8FB3D9";
  const winGlow = night && lit;
  return (
    <group>
      {/* yard, path, street */}
      <mesh position={[0, -0.05, 20]} receiveShadow>
        <BoxG args={[260, 0.1, 200]} />
        <Flat color={night ? "#2E4A3A" : P.grass} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[0, 0.02, 6.5 + i * 2.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2.6, 2]} />
          <Flat color={P.stone} />
        </mesh>
      ))}
      <mesh position={[0, 0.03, 30]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[260, 12]} />
        <Flat color={P.road} />
      </mesh>
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[-91 + i * 14, 0.04, 30]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4, 0.3]} />
          <Flat color={P.laneMark} />
        </mesh>
      ))}
      {/* low picket fence with a gap for the path */}
      {[-1, 1].map((s) =>
        Array.from({ length: 14 }, (_, i) => (
          <mesh key={`${s}${i}`} position={[s * (2.4 + i * 1.2), 0.9, 23]} castShadow>
            <BoxG args={[0.3, 1.8, 0.15]} />
            <Flat color={trim} />
          </mesh>
        )),
      )}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 10.2, 1.2, 23]}>
          <BoxG args={[15.6, 0.18, 0.12]} />
          <Flat color={trim} />
        </mesh>
      ))}
      {/* the house body */}
      <mesh position={[0, h / 2, -d / 2]} castShadow receiveShadow>
        <BoxG args={[w, h, d]} />
        <Flat color={siding} />
      </mesh>
      <mesh position={[0, 7.5, 0.06]}>
        <BoxG args={[w + 0.2, 0.3, 0.2]} />
        <Flat color={trim} />
      </mesh>
      <mesh geometry={roof} position={[0, h, -d / 2]} castShadow>
        <meshLambertMaterial color="#3A3550" flatShading />
      </mesh>
      <mesh position={[5.5, h + 3.5, -d / 2 - 2]} castShadow>
        <BoxG args={[1.4, 4, 1.4]} />
        <Flat color="#7A4A3A" />
      </mesh>
      {/* windows: two downstairs, three upstairs (the middle one can glow with the smile) */}
      {[
        [-6.5, 4.2],
        [6.5, 4.2],
        [-6.5, 10.8],
        [6.5, 10.8],
      ].map(([x, y]) => (
        <group key={`${x}${y}`} position={[x, y, 0.02]}>
          <mesh>
            <BoxG args={[3.8, 3.8, 0.2]} />
            <Flat color={trim} />
          </mesh>
          <mesh position={[0, 0, 0.11]}>
            <planeGeometry args={[3.2, 3.2]} />
            {winGlow ? <Glow color={win} /> : <Flat color={win} />}
          </mesh>
          <mesh position={[0, 0, 0.13]}>
            <BoxG args={[0.14, 3.2, 0.04]} />
            <Flat color={trim} />
          </mesh>
          <mesh position={[0, 0, 0.13]}>
            <BoxG args={[3.2, 0.14, 0.04]} />
            <Flat color={trim} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 2.4, 0, 0.08]}>
              <BoxG args={[0.9, 3.8, 0.12]} />
              <Flat color="#2E3E58" />
            </mesh>
          ))}
        </group>
      ))}
      <group position={[0, 10.8, 0.02]}>
        <mesh>
          <BoxG args={[3.8, 3.8, 0.2]} />
          <Flat color={trim} />
        </mesh>
        <CanvasPanel position={[0, 0, 0.11]} w={3.2} h={3.2} px={256} draw={drawSmileWindow(upGlow)} />
        {upGlow > 0.05 ? (
          <>
            <Halo position={[0, 0, 0.6]} size={9} color={VERITY_YELLOW} opacity={0.35 * upGlow} />
            <pointLight position={[0, 0, 2.5]} color={VERITY_YELLOW} intensity={10 * upGlow} distance={14} decay={2} />
          </>
        ) : null}
      </group>
      {/* porch: deck, steps, posts, roof */}
      <mesh position={[0, porchY / 2, 2.1]} castShadow receiveShadow>
        <BoxG args={[9, porchY, 4.2]} />
        <Flat color="#8A6A50" />
      </mesh>
      {[0, 1].map((i) => (
        <mesh key={i} position={[0, (porchY * (2 - i)) / 3 / 2, 4.6 + i * 0.6]} castShadow receiveShadow>
          <BoxG args={[3.6, (porchY * (2 - i)) / 3, 0.6]} />
          <Flat color="#7A5A42" />
        </mesh>
      ))}
      {[-4.2, 4.2].map((x) => (
        <mesh key={x} position={[x, porchY + 3.1, 3.9]} castShadow>
          <BoxG args={[0.35, 6.2, 0.35]} />
          <Flat color={trim} />
        </mesh>
      ))}
      <mesh position={[0, porchY + 6.35, 2.2]} castShadow>
        <BoxG args={[9.8, 0.3, 4.8]} />
        <Flat color="#3A3550" />
      </mesh>
      <mesh position={[0, porchY + 0.01, 3.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 1.4]} />
        <Flat color="#4A3A30" />
      </mesh>
      {/* porch light */}
      <mesh position={[2.2, porchY + 4.6, 0.25]}>
        <BoxG args={[0.4, 0.6, 0.3]} />
        {night ? <Glow color={P.lampGlow} /> : <Flat color="#C8B890" />}
      </mesh>
      {night ? <pointLight position={[2.2, porchY + 4.4, 1.6]} color="#FFD49A" intensity={14} distance={12} decay={2} /> : null}
      {/* the front door (hinged on its left edge, swings inward) */}
      <mesh position={[0, porchY + HOUSE.door.h / 2, 0.03]}>
        <planeGeometry args={[HOUSE.door.w, HOUSE.door.h]} />
        <Flat color={night ? "#120E0C" : "#2A1E18"} />
      </mesh>
      <group position={[-HOUSE.door.w / 2, porchY, 0.15]} rotation={[0, doorOpen * 1.6, 0]}>
        <mesh position={[HOUSE.door.w / 2, HOUSE.door.h / 2, 0]} castShadow>
          <BoxG args={[HOUSE.door.w, HOUSE.door.h, 0.2]} />
          <Flat color="#6A2A2A" />
        </mesh>
        <mesh position={[HOUSE.door.w - 0.45, 2.6, 0.13]}>
          <BoxG args={[0.14, 0.14, 0.14]} />
          <Flat color="#D8B060" />
        </mesh>
      </group>
      <mesh position={[0, porchY + HOUSE.door.h + 0.25, 0.1]}>
        <BoxG args={[HOUSE.door.w + 0.8, 0.4, 0.3]} />
        <Flat color={trim} />
      </mesh>
      {/* mailbox, trees, neighbours, hills */}
      <group position={[6.5, 0, 21.5]}>
        <mesh position={[0, 1.1, 0]}>
          <BoxG args={[0.2, 2.2, 0.2]} />
          <Flat color="#5A4030" />
        </mesh>
        <mesh position={[0, 2.4, 0]} castShadow>
          <BoxG args={[0.7, 0.6, 1.2]} />
          <Flat color={P.carRed} />
        </mesh>
      </group>
      <LeafyTree position={[-15, 0, 8]} scale={3.2} seed="yard1" />
      <LeafyTree position={[16, 0, 5]} scale={2.8} seed="yard2" />
      <LeafyTree position={[-24, 0, -16]} scale={3.6} seed="yard3" />
      <LeafyTree position={[22, 0, -18]} scale={3.4} seed="yard4" />
      <House position={[-36, 0, -6]} scale={2.1} color="#C9B08A" roof="#5A4A78" lit={night} />
      <House position={[36, 0, -8]} scale={2.1} color="#9AB0A0" roof="#7A3A4A" lit={night} />
      <House position={[-30, 0, 52]} yaw={Math.PI} scale={2.1} color="#B8A0B8" roof="#2E5A6A" lit={night} />
      <House position={[28, 0, 50]} yaw={Math.PI} scale={2.1} color="#D8C8A8" roof="#3A3550" lit={night} />
      <HillRing radius={180} color={night ? "#1A2A26" : "#3E6B4A"} />
      {rain ? <Rain center={[0, 10, 26]} size={[50, 24, 30]} t={t} count={700} seed="yardrain" thickness={0.06} opacity={0.5} /> : null}
    </group>
  );
};

// ---------------------------------------------------------------- screens

/** The incoming-call screen: Verity's face as the caller (our own generic phone UI). */
export const CallScreen: React.FC<{ w: number; h: number; t: number }> = ({ w, h, t }) => {
  const pulse = 1 + 0.06 * Math.sin(t * 12);
  return (
    <div style={{ width: w, height: h, background: "linear-gradient(180deg, #1A1830 0%, #0A0A14 100%)", fontFamily: FONT, color: "#FFF", display: "flex", flexDirection: "column", alignItems: "center", boxSizing: "border-box", paddingTop: h * 0.1 }}>
      <div style={{ fontSize: w * 0.06, letterSpacing: "0.2em", opacity: 0.7 }}>INCOMING CALL</div>
      <div style={{ position: "relative", width: w * 0.46, height: w * 0.46, marginTop: h * 0.07, transform: `scale(${pulse})` }}>
        <div style={{ position: "absolute", inset: -w * 0.04, borderRadius: "50%", boxShadow: `0 0 ${w * 0.12}px ${VERITY_YELLOW}` }} />
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          <circle cx="50" cy="50" r="48" fill={VERITY_YELLOW} />
          <ellipse cx="35" cy="40" rx="5" ry="9" fill={FACE_INK} />
          <ellipse cx="65" cy="40" rx="5" ry="9" fill={FACE_INK} />
          <path d="M 24 58 Q 50 84 76 58" stroke={FACE_INK} strokeWidth="7" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ marginTop: h * 0.06, fontWeight: 700, fontSize: w * 0.13, letterSpacing: "0.08em", color: VERITY_YELLOW }}>VERITY</div>
      <div style={{ marginTop: h * 0.015, fontSize: w * 0.055, opacity: 0.6 }}>calling…</div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", gap: w * 0.22, marginBottom: h * 0.08 }}>
        {["#E8344A", "#3FC06A"].map((c) => (
          <div key={c} style={{ width: w * 0.2, height: w * 0.2, borderRadius: "50%", background: c }} />
        ))}
      </div>
    </div>
  );
};

/** Homework page: problems with answers and ticks appearing as `k` goes 0..1 (drawn on a 3D page). */
export const drawHomework = (k: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#F4F0E4";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#A8C0E0";
  ctx.lineWidth = 2;
  for (let y = H * 0.12; y < H; y += H * 0.1) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "#E89090";
  ctx.beginPath();
  ctx.moveTo(W * 0.12, 0);
  ctx.lineTo(W * 0.12, H);
  ctx.stroke();
  const rows = [
    ["12 × 7 =", "84"],
    ["√144 =", "12"],
    ["3x = 27", "x = 9"],
    ["H₂O =", "WATER"],
  ];
  rows.forEach(([q, a], i) => {
    const y = H * (0.2 + i * 0.2);
    ctx.font = CANVAS_FONT(W * 0.075, false);
    ctx.fillStyle = "#2A2A3A";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(q, W * 0.16, y);
    const show = k * rows.length - i;
    if (show > 0) {
      ctx.font = CANVAS_FONT(W * 0.08);
      ctx.fillStyle = "#C8372D";
      ctx.fillText(a, W * 0.56, y);
    }
    if (show > 0.5) {
      ctx.strokeStyle = "#2F9A5A";
      ctx.lineWidth = W * 0.02;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(W * 0.84, y);
      ctx.lineTo(W * 0.88, y + H * 0.04);
      ctx.lineTo(W * 0.95, y - H * 0.05);
      ctx.stroke();
    }
  });
};
