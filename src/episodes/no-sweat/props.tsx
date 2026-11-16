/**
 * Props for "What If Nobody Could Sweat?" (ep. 8): sweat drops and patches on Slavoski, the thermal-camera
 * look, the x-ray body (organs, vessels, pulses), the skin cross-section with sweat glands, and the sets
 * (park, washing line, lift, running track, rooftop, lake). Everything is seeded and driven by time.
 */
import React, { useMemo } from "react";
import { interpolate, random } from "remotion";
import * as THREE from "three";
import { Building, Lamp } from "../../slavoski/city";
import { BoxG, CircleG, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { FONT } from "../../slavoski/fonts";
import { SLAVOSKI, type HeroLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Bush, LeafyTree } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { mix, P } from "../../slavoski/palette";
import { armJoints, DIM, groundedBob, heroParts, legJoints, mergePose, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { CanvasPanel, fitText } from "../../slavoski/screens";
import { project, type CameraSpec } from "../../slavoski/Stage";

// ================================================================ rig helpers

const rootM = (position: V3 = [0, 0, 0], yaw = 0, scale = 1) =>
  new THREE.Matrix4().compose(new THREE.Vector3(...position), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(scale, scale, scale));

const partM = (pose: Pose, name: string) => heroParts(pose).find((p) => p.name === name)!.matrix;

/** A point in head space (head centre = origin, face toward +Z) to world space. */
export const headPoint = (pose: Pose, local: V3, position?: V3, yaw?: number, scale?: number): V3 => {
  const v = new THREE.Vector3(...local).applyMatrix4(rootM(position, yaw, scale).multiply(partM(pose, "head")));
  return [v.x, v.y, v.z];
};

/** The torso joint frame (at the hips, unscaled) in world space. */
const torsoFrame = (pose: Pose, position?: V3, yaw?: number, scale?: number) => {
  const m = partM(pose, "torso").clone();
  m.multiply(new THREE.Matrix4().makeScale(1 / DIM.torsoW, 1 / DIM.torsoH, 1 / DIM.torsoD));
  m.multiply(new THREE.Matrix4().makeTranslation(0, -(0.05 + DIM.torsoH / 2), 0));
  return rootM(position, yaw, scale).multiply(m);
};
export const torsoPoint = (pose: Pose, local: V3, position?: V3, yaw?: number, scale?: number): V3 => {
  const v = new THREE.Vector3(...local).applyMatrix4(torsoFrame(pose, position, yaw, scale));
  return [v.x, v.y, v.z];
};

/** Head ellipsoid semi-axes (the head icosphere is scaled 1 × 1.06 × 0.95). */
const HEAD_AX: V3 = [DIM.headR, DIM.headR * 1.06, DIM.headR * 0.95];
/** A point on the face surface at (x, y) in head space, pushed `out` along the surface normal. */
export const faceSurface = (x: number, y: number, out = 0): V3 => {
  const [a, b, c] = HEAD_AX;
  const z = c * Math.sqrt(Math.max(0.02, 1 - (x / a) ** 2 - (y / b) ** 2));
  const n = new THREE.Vector3(x / (a * a), y / (b * b), z / (c * c)).normalize();
  return [x + n.x * out, y + n.y * out, z + n.z * out];
};

/** Running: a bigger stride than walking, bent elbows, a forward lean, feet kept on the floor. */
export const runPose = (phase: number, over: Partial<Pose> = {}, amount = 1): Pose => {
  const w = walkPose(phase, 1.35 * amount);
  const s = Math.abs(Math.sin(phase * Math.PI * 2));
  const p = mergePose(w, { lElbow: 1.45, rElbow: 1.45, lean: 0.16 * amount, ...over });
  return { ...p, bob: groundedBob({ ...p, bob: 0 }) + s * 0.16 * amount };
};

/** A standing pose with the feet on the floor. */
export const grounded = (p: Pose): Pose => ({ ...p, bob: Math.max(p.bob, groundedBob({ ...p, bob: 0 })) });

// ================================================================ sweat

const DROP_MAT = { color: "#A9D8FF", opacity: 0.88 };

/** A teardrop of sweat (rounded bottom, point up) with a tiny highlight. */
export const SweatDrop: React.FC<{ position: V3; r?: number; opacity?: number; color?: string }> = ({ position, r = 0.06, opacity = DROP_MAT.opacity, color = DROP_MAT.color }) => {
  if (r <= 0.002) return null;
  return (
    <group position={position}>
      <mesh>
        <IcoG args={[r, 1]} />
        <meshLambertMaterial color={color} flatShading transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, r * 1.1, 0]}>
        <ConeG args={[r * 0.84, r * 1.3, 6]} />
        <meshLambertMaterial color={color} flatShading transparent opacity={opacity} />
      </mesh>
      <mesh position={[-r * 0.35, r * 0.25, r * 0.72]}>
        <IcoG args={[r * 0.22, 0]} />
        <Glow color="#FFFFFF" opacity={Math.min(1, opacity + 0.1)} />
      </mesh>
    </group>
  );
};

/** Sweat beads on Slavoski's face, in head space (temples, forehead, cheeks; clear of the eyes and hair). */
const FACE_DROPS: { x: number; y: number; r: number }[] = [
  { x: 0.0, y: 0.29, r: 0.055 },
  { x: 0.44, y: 0.22, r: 0.07 },
  { x: -0.45, y: 0.26, r: 0.06 },
  { x: 0.4, y: -0.1, r: 0.05 },
  { x: -0.5, y: 0.02, r: 0.065 },
  { x: -0.36, y: -0.2, r: 0.045 },
];

/** Beads of sweat on the hero's face. `amount` 0..1 scales them (0 = dry), `drip` slides one down the cheek. */
export const FaceSweat: React.FC<{ pose: Pose; position?: V3; yaw?: number; amount: number; drip?: number; opacity?: number }> = ({
  pose,
  position,
  yaw,
  amount,
  drip = 0,
  opacity,
}) => {
  if (amount <= 0.01) return null;
  return (
    <group>
      {FACE_DROPS.map((d, i) => {
        const y = i === 4 ? d.y - drip * 0.45 : d.y;
        const r = d.r * amount;
        return <SweatDrop key={i} position={headPoint(pose, faceSurface(d.x, y, r * 0.85), position, yaw)} r={r} opacity={opacity} />;
      })}
    </group>
  );
};

/** A little white sparkle (four thin glowing spikes) where a drop just vanished. */
export const Sparkle: React.FC<{ position: V3; k: number; size?: number; color?: string }> = ({ position, k, size = 0.18, color = "#FFFFFF" }) => {
  if (k <= 0 || k >= 1) return null;
  const s = Math.sin(k * Math.PI) * size;
  return (
    <group position={position} rotation={[0, 0, k * 1.2]}>
      {[0, 1].map((i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]}>
          <BoxG args={[s * 2, s * 0.16, 0.01]} />
          <Glow color={color} opacity={0.95} />
        </mesh>
      ))}
      <Halo size={s * 3} color={color} opacity={0.6} />
    </group>
  );
};

/** Dark sweat patches on the jacket (chest and both underarms), shrinking with `amount`. */
export const SweatPatches: React.FC<{ pose: Pose; position?: V3; yaw?: number; amount: number; color?: string }> = ({ pose, position, yaw, amount, color = "#A85A1C" }) => {
  if (amount <= 0.01) return null;
  const m = rootM(position, yaw).multiply(partM(pose, "torso"));
  return (
    <group matrix={m} matrixAutoUpdate={false}>
      {/* in the torso box's unit-cube space: front face z = +0.5, sides x = ±0.5 */}
      <mesh position={[0.02, 0.18, 0.512]} scale={[0.34 * amount, 0.4 * amount, 1]}>
        <CircleG args={[0.5, 12]} />
        <meshLambertMaterial color={color} transparent opacity={0.85} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * 0.508, 0.3, 0]} rotation={[0, (s * Math.PI) / 2, 0]} scale={[0.7 * amount, 0.36 * amount, 1]}>
          <CircleG args={[0.5, 12]} />
          <meshLambertMaterial color={color} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
};

/** Slavoski flushed red from the heat (`k` 0..1). */
export const flushed = (k: number, base: HeroLook = SLAVOSKI): HeroLook => ({
  ...base,
  skin: mix(base.skin, "#D9573F", k * 0.75),
  skinShade: mix(base.skinShade, "#B8402E", k * 0.75),
  eyeWhite: k > 0.5 ? mix(P.eyeWhite, "#F2B8B0", (k - 0.5) * 1.4) : base.eyeWhite,
});

// ================================================================ thermal camera

/** Thermal-camera colours for a body at heat `h` (0 = normal, 1 = overheating: white-hot skin). */
export const thermalLook = (h: number): HeroLook => {
  const k = clamp01(h);
  return {
    skin: mix("#F0B42C", "#FFF6CF", k),
    skinShade: mix("#E8902A", "#FFE08A", k),
    hair: mix("#B8382A", "#FF9A3A", k),
    jacket: mix("#C8442C", "#FF8A2A", k),
    jacketShade: mix("#A8302C", "#F0602A", k),
    zipper: mix("#E0702A", "#FFC24A", k),
    jeans: mix("#7A2470", "#D8402C", k),
    shoe: mix("#3A2486", "#9A2A70", k),
    eyeWhite: mix("#FFD24A", "#FFFFFF", k),
  };
};

/** Cool ground and backdrop for thermal shots: deep blue-violet, with cold "trees" and a warm road. */
export const THERMAL = { ground: "#160C48", cold: "#22186A", cool: "#3A1E86", warm: "#7A2478", bg: "#0A0628" };

export const ThermalGround: React.FC<{ road?: boolean; trees?: boolean; seed?: string; hot?: number }> = ({ road = true, trees = true, seed = "th", hot = 0 }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[400, 400]} />
      <meshBasicMaterial color={mix(THERMAL.ground, "#3A1450", hot)} />
    </mesh>
    {road ? (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[9, 400]} />
        <meshBasicMaterial color={mix(THERMAL.warm, "#C83A3A", hot)} />
      </mesh>
    ) : null}
    {trees
      ? Array.from({ length: 22 }, (_, i) => {
          const side = i % 2 ? 1 : -1;
          const x = side * (9 + random(`${seed}x${i}`) * 14);
          const z = 12 - Math.floor(i / 2) * 9 - random(`${seed}z${i}`) * 4;
          const s = 2.4 + random(`${seed}s${i}`) * 1.4;
          return (
            <group key={i} position={[x, 0, z]} scale={s}>
              <mesh position={[0, 1.2, 0]}>
                <CylG args={[0.14, 0.2, 2.4, 6]} />
                <meshBasicMaterial color={THERMAL.cool} />
              </mesh>
              <mesh position={[0, 3.1, 0]}>
                <IcoG args={[1.25, 0]} />
                <meshBasicMaterial color={i % 3 ? THERMAL.cold : THERMAL.cool} />
              </mesh>
            </group>
          );
        })
      : null}
  </group>
);

/** Heat glow around a hot body: soft warm halos at the chest and head. */
export const BodyGlow: React.FC<{ pose: Pose; position: V3; yaw?: number; h: number }> = ({ pose, position, yaw, h }) => {
  if (h <= 0.05) return null;
  return (
    <group>
      <Halo position={torsoPoint(pose, [0, 0.7, 0.5], position, yaw)} size={3.4 + h * 3} color={mix("#FF8A2A", "#FFE08A", h)} opacity={0.18 + h * 0.3} />
      <Halo position={headPoint(pose, [0, 0, 0.6], position, yaw)} size={2.4 + h * 2.4} color={mix("#FFB040", "#FFFFFF", h)} opacity={0.14 + h * 0.3} />
    </group>
  );
};

/** The thermal-camera HUD: corner brackets, REC, a crosshair label with the temperature and a colour scale. */
export const ThermalHud: React.FC<{ temp: number; t: number; target?: { x: number; y: number }; status?: string; minimal?: boolean }> = ({ temp, t, target, status, minimal = false }) => {
  const rec = Math.floor(t * 2) % 2 === 0;
  const hot = temp >= 39;
  const c = "rgba(255,255,255,0.82)";
  const corner = (x: number, y: number, sx: number, sy: number) => (
    <div style={{ position: "absolute", left: x, top: y, width: 70, height: 70, borderLeft: sx > 0 ? `4px solid ${c}` : undefined, borderRight: sx < 0 ? `4px solid ${c}` : undefined, borderTop: sy > 0 ? `4px solid ${c}` : undefined, borderBottom: sy < 0 ? `4px solid ${c}` : undefined, transform: `translate(${sx > 0 ? 0 : -70}px, ${sy > 0 ? 0 : -70}px)` }} />
  );
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT, color: c, pointerEvents: "none" }}>
      {minimal ? null : (
        <>
          {corner(80, 290, 1, 1)}
          {corner(1000, 290, -1, 1)}
          {corner(80, 1330, 1, -1)}
          {corner(1000, 1330, -1, -1)}
        </>
      )}
      <div style={{ display: minimal ? "none" : "flex", position: "absolute", left: 112, top: 318, fontSize: 22, letterSpacing: "0.18em", gap: 14, alignItems: "center" }}>
        <span style={{ width: 16, height: 16, borderRadius: 16, background: rec ? "#FF4A3A" : "transparent", border: "2px solid #FF4A3A" }} />
        THERMAL CAM
      </div>
      {/* colour scale */}
      <div style={{ display: minimal ? "none" : "block", position: "absolute", right: 106, top: 420, width: 22, height: 560, borderRadius: 4, background: "linear-gradient(0deg, #2A1A7A, #7A2470, #C8442C, #F0B42C, #FFF6CF)" }} />
      <div style={{ display: minimal ? "none" : "block", position: "absolute", right: 140, top: 408, fontSize: 18, letterSpacing: "0.08em" }}>42°</div>
      <div style={{ display: minimal ? "none" : "block", position: "absolute", right: 140, top: 964, fontSize: 18, letterSpacing: "0.08em" }}>20°</div>
      {target ? (
        <div style={{ position: "absolute", left: target.x, top: target.y, transform: "translate(-50%, -50%)" }}>
          <div style={{ position: "absolute", left: -46, top: -46, width: 92, height: 92, border: `3px solid ${hot ? "#FF5A4A" : c}`, borderRadius: 4 }} />
          <div style={{ position: "absolute", left: -18, top: -1.5, width: 36, height: 3, background: hot ? "#FF5A4A" : c }} />
          <div style={{ position: "absolute", left: -1.5, top: -18, width: 3, height: 36, background: hot ? "#FF5A4A" : c }} />
          <div
            style={{
              position: "absolute",
              left: 62,
              top: -32,
              whiteSpace: "nowrap",
              padding: "6px 14px",
              borderRadius: 8,
              background: "rgba(8,6,30,0.7)",
              fontWeight: 700,
              fontSize: 34,
              color: hot ? "#FF6A4A" : "#FFFFFF",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {temp.toFixed(1)}°C
            {status ? <div style={{ fontWeight: 400, fontSize: 17, letterSpacing: "0.16em", opacity: 0.75, marginTop: 2 }}>{status}</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

// ================================================================ x-ray body

const ORGAN = { brain: "#E89AB0", lung: "#E07A8A", heart: "#D8323A", liver: "#A8423A", stomach: "#E8A07A", kidney: "#B4504A", gut: "#E8B08A" };
const WARN = "#FF2A2A";

export type OrganWarn = Partial<Record<"brain" | "lungs" | "heart" | "liver" | "kidneys" | "gut", number>>;

/** Strut between two points (a thin box), for vessels. */
const Tube: React.FC<{ a: V3; b: V3; r: number; color: string; glow?: boolean }> = ({ a, b, r, color, glow }) => {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  if (len < 1e-4) return null;
  const mid = A.clone().add(B).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return (
    <mesh position={[mid.x, mid.y, mid.z]} quaternion={q}>
      <CylG args={[r, r, len, 5]} />
      {glow ? <Glow color={color} /> : <Flat color={color} />}
    </mesh>
  );
};

/** A point `k` (0..1) of the way along a polyline. */
const along = (pts: V3[], k: number): V3 => {
  const segs = pts.slice(1).map((p, i) => new THREE.Vector3(...p).distanceTo(new THREE.Vector3(...pts[i])));
  const total = segs.reduce((a, b) => a + b, 0);
  let d = clamp01(k) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const u = segs[i] > 0 ? Math.min(1, d / segs[i]) : 0;
      const a = pts[i], b = pts[i + 1];
      return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
    }
    d -= segs[i];
  }
  return pts[pts.length - 1];
};

/** The heart's beat (0..1 spike) at time t for a rate in beats per second. */
export const beat = (t: number, rate: number) => {
  const ph = (t * rate) % 1;
  return Math.max(0, 1 - ph / 0.18) * (ph < 0.18 ? 1 : 0) + Math.max(0, 0.6 - Math.abs(ph - 0.3) / 0.1) * 0.6;
};

/**
 * See-through Slavoski with his organs inside: a pulsing heart, lungs, brain, liver, stomach, kidneys and
 * gut. Vessels run from the heart to the head, hands and feet with blood pulses travelling along them.
 * `warn` flashes organs red (heatstroke), `heat` 0..1 warms the vessels toward the skin.
 */
export const XRayBody: React.FC<{
  pose: Pose;
  position: V3;
  yaw?: number;
  t: number;
  rate?: number;
  warn?: OrganWarn;
  heat?: number;
  vessels?: boolean;
  spark?: number;
}> = ({ pose, position, yaw = 0, t, rate = 1.2, warn = {}, heat = 0, vessels = true, spark = 0 }) => {
  const T = (p: V3) => torsoPoint(pose, p, position, yaw);
  const H = (p: V3) => headPoint(pose, p, position, yaw);
  const b = beat(t, rate);
  const flash = (w = 0) => (w > 0 ? 0.5 + 0.5 * Math.sin(t * 14) : 0) * w;
  const col = (c: string, w?: number) => mix(c, WARN, Math.min(1, (w ?? 0) * 0.55 + flash(w) * 0.45));
  const heart = T([0.12, 0.8, 0.14]);
  const routes = useMemo(() => {
    const la = armJoints(pose, "l", position, yaw);
    const ra = armJoints(pose, "r", position, yaw);
    const ll = legJoints(pose, "l", position, yaw);
    const rl = legJoints(pose, "r", position, yaw);
    const hip = (s: number) => torsoPoint(pose, [s * 0.3, 0.1, 0.05], position, yaw);
    return [
      [heart, T([0.05, 1.25, 0.05]), H([0, -0.55, 0]), H([0, 0.1, 0.1])],
      [heart, T([0.55, 1.05, 0.05]), la.shoulder, la.elbow, la.hand],
      [heart, T([-0.55, 1.05, 0.05]), ra.shoulder, ra.elbow, ra.hand],
      [heart, T([0.05, 0.35, 0.1]), hip(1), ll.knee, ll.ankle],
      [heart, T([0.05, 0.35, 0.1]), hip(-1), rl.knee, rl.ankle],
    ] as V3[][];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose, position[0], position[1], position[2], yaw]);
  const vesselColor = mix("#B02A3A", "#FF6A2A", heat);
  const blob = (p: V3, s: V3, color: string, key: string, glowK = 0) => (
    <group key={key}>
      <mesh position={p} scale={s}>
        <IcoG args={[1, 1]} />
        <Flat color={color} />
      </mesh>
      {glowK > 0.05 ? <Halo position={p} size={Math.max(...s) * 6} color={WARN} opacity={0.35 * glowK} /> : null}
    </group>
  );
  const hs = 0.2 * (1 + b * 0.22);
  return (
    <group>
      {/* brain */}
      {[
        [0, 0.2, -0.02, 0.24],
        [0.17, 0.16, 0.02, 0.18],
        [-0.17, 0.16, 0.02, 0.18],
        [0.1, 0.28, -0.12, 0.17],
        [-0.1, 0.28, -0.12, 0.17],
      ].map(([x, y, z, r], i) => blob(H([x, y, z]), [r, r * 0.9, r], col(ORGAN.brain, warn.brain), `br${i}`, i === 0 ? flash(warn.brain) : 0))}
      {spark > 0
        ? Array.from({ length: 5 }, (_, i) => {
            const on = random(`sp${i}${Math.floor(t * 12)}`) < spark;
            if (!on) return null;
            const a = random(`spa${i}${Math.floor(t * 12)}`) * Math.PI * 2;
            const p = H([Math.cos(a) * 0.32, 0.22 + Math.sin(a) * 0.22, 0.12]);
            return (
              <group key={`s${i}`}>
                <mesh position={p} rotation={[0, 0, a]}>
                  <BoxG args={[0.26, 0.035, 0.035]} />
                  <Glow color="#FFF27A" />
                </mesh>
                <Halo position={p} size={0.5} color="#FFE04A" opacity={0.7} />
              </group>
            );
          })
        : null}
      {/* lungs */}
      {[1, -1].map((s) => blob(T([s * 0.34, 0.86, -0.02]), [0.27, 0.4, 0.22], col(ORGAN.lung, warn.lungs), `lu${s}`, flash(warn.lungs)))}
      {/* heart */}
      {blob(heart, [hs, hs * 1.15, hs], col(ORGAN.heart, warn.heart), "heart", flash(warn.heart) + b * 0.4)}
      {blob(T([-0.24, 0.47, 0.06]), [0.36, 0.17, 0.22], col(ORGAN.liver, warn.liver), "liver", flash(warn.liver))}
      {blob(T([0.26, 0.45, 0.1]), [0.2, 0.19, 0.17], col(ORGAN.stomach, warn.gut), "stomach")}
      {[1, -1].map((s) => blob(T([s * 0.3, 0.36, -0.2]), [0.1, 0.16, 0.08], col(ORGAN.kidney, warn.kidneys), `ki${s}`, flash(warn.kidneys)))}
      {blob(T([0, 0.2, 0.08]), [0.42, 0.14, 0.2], col(ORGAN.gut, warn.gut), "gut")}
      {vessels
        ? routes.map((pts, ri) => (
            <group key={ri}>
              {pts.slice(1).map((p, i) => (
                <Tube key={i} a={pts[i]} b={p} r={0.035} color={vesselColor} glow={heat > 0.4} />
              ))}
              {Array.from({ length: 3 }, (_, k) => {
                const u = (t * rate * 0.55 + k / 3 + ri * 0.13) % 1;
                const p = along(pts, u);
                return (
                  <group key={k}>
                    <mesh position={p}>
                      <IcoG args={[0.075 + heat * 0.03, 0]} />
                      <Glow color={mix("#FF3A3A", "#FFB040", heat)} />
                    </mesh>
                    {heat > 0.3 ? <Halo position={p} size={0.6} color="#FF8A2A" opacity={0.4 * heat} /> : null}
                  </group>
                );
              })}
            </group>
          ))
        : null}
    </group>
  );
};

/** An ECG strip: a scrolling green trace with a BPM read-out. */
export const EcgStrip: React.FC<{ t: number; rate: number; y?: number; bpm?: number }> = ({ t, rate, y = 1222, bpm }) => {
  const W = 760;
  const H = 120;
  const pts: string[] = [];
  for (let i = 0; i <= 190; i++) {
    const x = (i / 190) * W;
    const tt = t - (1 - i / 190) * 2.4;
    const ph = (((tt * rate) % 1) + 1) % 1;
    let v = 0;
    if (ph > 0.1 && ph < 0.14) v = -0.25;
    else if (ph >= 0.14 && ph < 0.18) v = 1;
    else if (ph >= 0.18 && ph < 0.22) v = -0.45;
    else if (ph > 0.38 && ph < 0.5) v = 0.22 * Math.sin(((ph - 0.38) / 0.12) * Math.PI);
    pts.push(`${x.toFixed(1)},${(H / 2 - v * H * 0.42).toFixed(1)}`);
  }
  return (
    <div style={{ position: "absolute", left: (1080 - W) / 2, top: y, width: W, height: H, borderRadius: 14, background: "rgba(4,16,14,0.62)", border: "2px solid rgba(80,255,170,0.35)", overflow: "hidden" }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <polyline points={pts.join(" ")} fill="none" stroke="#5CFFB0" strokeWidth={4} strokeLinejoin="round" />
      </svg>
      <div style={{ position: "absolute", right: 18, top: 10, fontFamily: FONT, fontWeight: 700, fontSize: 30, color: "#5CFFB0", fontVariantNumeric: "tabular-nums" }}>
        {Math.round(bpm ?? rate * 60)} <span style={{ fontWeight: 400, fontSize: 17, letterSpacing: "0.14em" }}>BPM</span>
      </div>
    </div>
  );
};

/** HTML label pinned to a 3D point (with a short leader line). */
export const Pin: React.FC<{ at: V3; cam: CameraSpec; width: number; height: number; text: string; color?: string; dx?: number; dy?: number; k?: number; warn?: boolean }> = ({
  at,
  cam,
  width,
  height,
  text,
  color = "#FFFFFF",
  dx = 90,
  dy = -50,
  k = 1,
  warn,
}) => {
  if (k <= 0) return null;
  const p = project(at, cam, width, height);
  const lx = p.x + dx;
  const ly = p.y + dy;
  const len = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: clamp01(k * 1.5), pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: p.x - 7, top: p.y - 7, width: 14, height: 14, borderRadius: 14, background: color, boxShadow: `0 0 14px ${color}` }} />
      <div style={{ position: "absolute", left: p.x, top: p.y - 1.5, width: len * ease(k), height: 3, background: color, transformOrigin: "0 50%", transform: `rotate(${ang}rad)` }} />
      <div
        style={{
          position: "absolute",
          left: lx,
          top: ly,
          transform: `translate(${dx < 0 ? "-100%" : "0"}, -50%)`,
          padding: "8px 16px",
          borderRadius: 10,
          background: warn ? "rgba(90,10,10,0.78)" : "rgba(8,10,24,0.7)",
          border: `2px solid ${color}`,
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "0.1em",
          color: P.white,
          whiteSpace: "nowrap",
        }}
      >
        {warn ? "⚠ " : ""}
        {text}
      </div>
    </div>
  );
};

// ================================================================ skin cross-section

/** Skin block layout (cross-section face at z = +SKIN.d/2, surface at y = 0). */
export const SKIN = { w: 6.4, d: 3, epi: 0.38, dermis: 2.5, fat: 1.2, glands: [-1.6, 1.5] as number[] };

const coil = (cx: number, cy: number, cz: number) =>
  Array.from({ length: 5 }, (_, i) => ({ p: [cx + Math.sin(i * 2.1) * 0.16, cy + i * 0.13, cz] as V3, r: 0.26 - (i % 2) * 0.04 }));

/**
 * A slab of skin seen in cross-section: epidermis, dermis and fat, two coiled sweat glands with ducts to
 * pores, a hair, and a capillary. `flow` moves blue sweat beads up the ducts; `drop` 0..1 grows a bead at
 * each pore; `evap` 0..1 lifts vapour wisps carrying red heat dots away; `flush` 0..1 warms the surface;
 * `off` greys the glands (no more sweat).
 */
export const SkinSection: React.FC<{ t: number; flow?: number; drop?: number; evap?: number; flush?: number; off?: number; heatDots?: number }> = ({
  t,
  flow = 1,
  drop = 1,
  evap = 0,
  flush = 0,
  off = 0,
  heatDots = 1,
}) => {
  const fz = SKIN.d / 2;
  const epiTop = 0;
  const derTop = -SKIN.epi;
  const fatTop = derTop - SKIN.dermis;
  const glandY = fatTop + 0.15;
  const glandCol = mix("#C8506A", "#7A7480", off);
  const ductCol = mix("#D86A80", "#8A8490", off);
  const skinTop = mix("#D9A27A", "#E2604A", flush);
  return (
    <group>
      {/* layers */}
      <mesh position={[0, -SKIN.epi / 2, 0]} receiveShadow>
        <BoxG args={[SKIN.w, SKIN.epi, SKIN.d]} />
        <Flat color={skinTop} />
      </mesh>
      <mesh position={[0, derTop - SKIN.dermis / 2, 0]}>
        <BoxG args={[SKIN.w, SKIN.dermis, SKIN.d]} />
        <Flat color={mix("#E89A92", "#E8706A", flush * 0.6)} />
      </mesh>
      <mesh position={[0, fatTop - SKIN.fat / 2, 0]}>
        <BoxG args={[SKIN.w, SKIN.fat, SKIN.d]} />
        <Flat color="#EAC96E" />
      </mesh>
      {/* fat lobules on the cut face */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-SKIN.w / 2 + 0.4 + i * 0.7, fatTop - 0.5 - (i % 2) * 0.3, fz]} scale={[1, 0.8, 0.35]}>
          <IcoG args={[0.32, 1]} />
          <Flat color="#F2D682" />
        </mesh>
      ))}
      {/* capillary: red, with blood dots drifting along it */}
      <mesh position={[0, derTop - 0.75, fz]} rotation={[0, 0, Math.PI / 2]}>
        <CylG args={[0.08, 0.08, SKIN.w * 0.96, 6]} />
        <Flat color="#C8303A" />
      </mesh>
      <mesh position={[0, derTop - 1.55, fz]} rotation={[0, 0, Math.PI / 2]}>
        <CylG args={[0.07, 0.07, SKIN.w * 0.96, 6]} />
        <Flat color="#4A5AB0" />
      </mesh>
      {/* hair follicle */}
      <mesh position={[0.1, derTop - 0.8, fz]} rotation={[0, 0, 0.25]}>
        <CylG args={[0.05, 0.09, 1.9, 5]} />
        <Flat color="#5A3A28" />
      </mesh>
      <mesh position={[-0.28, 0.85, fz - 0.1]} rotation={[0, 0, 0.25]}>
        <CylG args={[0.035, 0.05, 1.8, 5]} />
        <Flat color="#3A2418" />
      </mesh>
      {SKIN.glands.map((gx, gi) => {
        const duct: V3[] = [
          [gx + 0.05, glandY + 0.7, fz],
          [gx - 0.12, glandY + 1.3, fz],
          [gx + 0.1, glandY + 1.9, fz],
          [gx - 0.05, derTop - 0.2, fz],
          [gx, epiTop + 0.02, fz],
        ];
        const pore: V3 = [gx, epiTop, fz - 0.2];
        const dr = 0.34 * drop * (1 - off);
        return (
          <group key={gi}>
            {coil(gx, glandY, fz).map((c, i) => (
              <mesh key={i} position={c.p} rotation={[Math.PI / 2, 0, i * 0.7]}>
                <torusGeometry args={[c.r, 0.075, 5, 10]} />
                <Flat color={glandCol} />
              </mesh>
            ))}
            {duct.slice(1).map((p, i) => (
              <Tube key={i} a={duct[i]} b={p} r={0.06} color={ductCol} />
            ))}
            {/* sweat beads climbing the duct */}
            {flow > 0.01
              ? Array.from({ length: 4 }, (_, k) => {
                  const u = (t * 0.45 + k / 4 + gi * 0.11) % 1;
                  return (
                    <mesh key={k} position={along(duct, u)}>
                      <IcoG args={[0.085 * flow, 0]} />
                      <Glow color="#8FD0FF" />
                    </mesh>
                  );
                })
              : null}
            {/* the bead at the pore, shrinking as it evaporates */}
            <SweatDrop position={[pore[0], epiTop + dr * (1 - evap * 0.55) * 0.95, pore[2]]} r={dr * (1 - evap * 0.55)} />
            {/* vapour wisps rising from the bead, carrying heat away */}
            {evap > 0.01
              ? Array.from({ length: 7 }, (_, k) => {
                  const u = (t * 0.42 + k / 7 + gi * 0.3) % 1;
                  const y = epiTop + 0.45 + u * 3.6;
                  const x = gx + Math.sin(u * 5 + k) * 0.3 * (0.4 + u);
                  const o = Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5) * (1 - u) * evap;
                  return (
                    <group key={k}>
                      <Halo position={[x, y, pore[2]]} size={0.9 + u * 2.0} color="#DCEBFF" opacity={Math.min(1, 1.5 * o)} />
                      <mesh position={[x, y, pore[2] - 0.05]} scale={0.18 + u * 0.3}>
                        <IcoG args={[1, 1]} />
                        <meshBasicMaterial color="#F4FAFF" transparent opacity={0.22 * o} depthWrite={false} />
                      </mesh>
                      <mesh position={[x + 0.1, y + 0.08, pore[2] + 0.05]}>
                        <IcoG args={[0.055, 0]} />
                        <Glow color="#FF6A2A" opacity={Math.min(1, o * 1.6)} />
                      </mesh>
                      <Halo position={[x + 0.1, y + 0.08, pore[2] + 0.06]} size={0.45} color="#FF7A3A" opacity={0.6 * o} />
                    </group>
                  );
                })
              : null}
          </group>
        );
      })}
      {/* heat dots inside the skin (warm red, drifting up toward the surface) */}
      {heatDots > 0
        ? Array.from({ length: 10 }, (_, k) => {
            const u = (t * 0.3 + random(`hd${k}`)) % 1;
            const x = -SKIN.w / 2 + 0.4 + random(`hdx${k}`) * (SKIN.w - 0.8);
            const y = fatTop + 0.4 + u * (SKIN.dermis - 0.5);
            return (
              <mesh key={k} position={[x, y, fz + 0.05]}>
                <IcoG args={[0.07, 0]} />
                <Glow color="#FF6A3A" opacity={heatDots * Math.sin(u * Math.PI)} />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

// ================================================================ heat, sky, signs

/** The blazing sun: a white-hot core with two warm halos. */
export const Sun: React.FC<{ position: V3; r?: number; heat?: number }> = ({ position, r = 6, heat = 0.5 }) => (
  <group>
    <mesh position={position}>
      <IcoG args={[r, 2]} />
      <Glow color="#FFF8E0" fog={false} />
    </mesh>
    <Halo position={position} size={r * 6} color={mix("#FFE7A8", "#FFB04A", heat)} opacity={0.75} />
    <Halo position={position} size={r * 16} color={mix("#FFD890", "#FF8A2A", heat)} opacity={0.32 + heat * 0.2} />
  </group>
);

/**
 * HTML heat overlay: a warm haze rising from the bottom and faint shimmer lines drifting up.
 * `k` 0..1 strength.
 */
export const HeatHaze: React.FC<{ t: number; k: number }> = ({ t, k }) => {
  if (k <= 0.01) return null;
  const lines = Array.from({ length: 7 }, (_, i) => {
    const y = 1920 - (((t * 90 + i * 260) % 1820) + 100);
    const pts: string[] = [];
    for (let x = 0; x <= 1080; x += 30) pts.push(`${x},${(y + Math.sin(x / 70 + t * 3 + i) * 10).toFixed(1)}`);
    return <polyline key={i} points={pts.join(" ")} fill="none" stroke="rgba(255,240,210,1)" strokeWidth={3} opacity={0.05 * k * Math.sin(((1920 - y) / 1920) * Math.PI)} />;
  });
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(0deg, rgba(255,120,30,${0.22 * k}) 0%, rgba(255,150,60,${0.1 * k}) 35%, rgba(255,200,120,0) 60%)` }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {lines}
      </svg>
    </div>
  );
};

/** A red pulse around the frame edge (heatstroke). */
export const RedPulse: React.FC<{ t: number; k: number }> = ({ t, k }) =>
  k <= 0.01 ? null : (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: `radial-gradient(ellipse 70% 60% at 50% 45%, rgba(0,0,0,0) 45%, rgba(170,20,10,${(0.35 + 0.25 * Math.sin(t * 7)) * k}) 100%)`,
      }}
    />
  );

/** A street temperature sign: an LED panel on a pole (a real 3D sign, so people can pass in front of it). */
export const TempSign: React.FC<{ position: V3; yaw?: number; value: string; label?: string; scale?: number; blink?: boolean; t?: number }> = ({
  position,
  yaw = 0,
  value,
  label = "TEMP",
  scale = 1,
  blink = false,
  t = 0,
}) => {
  const on = !blink || Math.floor(t * 3) % 2 === 0;
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      <mesh position={[0, 3, 0]} castShadow>
        <CylG args={[0.12, 0.14, 6, 6]} />
        <Flat color={P.pole} />
      </mesh>
      <mesh position={[0, 7.2, -0.12]} castShadow>
        <BoxG args={[4.6, 2.8, 0.2]} />
        <Flat color="#1A1C26" />
      </mesh>
      <CanvasPanel
        position={[0, 7.2, 0.0]}
        w={4.3}
        h={2.5}
        px={512}
        draw={(ctx, W, H) => {
          ctx.fillStyle = "#0A0A10";
          ctx.fillRect(0, 0, W, H);
          fitText(ctx, label, W / 2, H * 0.2, W * 0.8, H * 0.16, "#FFB04A");
          fitText(ctx, value, W / 2, H * 0.62, W * 0.9, H * 0.58, on ? "#FF4A2A" : "#5A1A12");
        }}
      />
      <Halo position={[0, 7.2, 0.3]} size={6} color="#FF4A2A" opacity={on ? 0.35 : 0.08} />
    </group>
  );
};

/** A sign board on two posts with canvas-drawn text lines. */
export const SignBoard: React.FC<{ position: V3; yaw?: number; w?: number; h?: number; lines: { text: string; color: string; size: number }[]; bg?: string; post?: number }> = ({
  position,
  yaw = 0,
  w = 5,
  h = 2.6,
  lines,
  bg = "#F4F0E4",
  post = 2.4,
}) => (
  <group position={position} rotation={[0, yaw, 0]}>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * (w / 2 - 0.3), (post + h) / 2, -0.1]} castShadow>
        <BoxG args={[0.18, post + h, 0.18]} />
        <Flat color="#5A5A62" />
      </mesh>
    ))}
    <mesh position={[0, post + h / 2, -0.06]} castShadow>
      <BoxG args={[w + 0.2, h + 0.2, 0.1]} />
      <Flat color="#2A2C36" />
    </mesh>
    <CanvasPanel
      position={[0, post + h / 2, 0.0]}
      w={w}
      h={h}
      px={768}
      draw={(ctx, W, H) => {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        const n = lines.length;
        lines.forEach((l, i) => fitText(ctx, l.text, W / 2, (H * (i + 0.5)) / n, W * 0.88, H * l.size, l.color));
      }}
    />
  </group>
);

// ================================================================ park

/** A sunny park at hero scale: grass, a path along z, big leafy trees, bushes, benches, lamps and a skyline. */
export const Park: React.FC<{ seed?: string; pathX?: number; lampsOn?: boolean; lamps?: boolean; grass?: string; skyline?: boolean }> = ({ seed = "park", pathX = 0, lampsOn = false, lamps = true, grass = "#5E9A4E", skyline = true }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <circleGeometry args={[420, 32]} />
      <Flat color={grass} />
    </mesh>
    {/* the path */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pathX, 0.01, -60]} receiveShadow>
      <planeGeometry args={[7, 220]} />
      <Flat color="#D8C49A" />
    </mesh>
    {[1, -1].map((s) => (
      <mesh key={s} position={[pathX + s * 3.6, 0.08, -60]} receiveShadow>
        <BoxG args={[0.3, 0.16, 220]} />
        <Flat color="#B8A47E" />
      </mesh>
    ))}
    {Array.from({ length: 16 }, (_, i) => {
      const side = i % 2 ? 1 : -1;
      const z = 6 - Math.floor(i / 2) * 18 - random(`${seed}tz${i}`) * 6;
      const x = pathX + side * (9 + random(`${seed}tx${i}`) * 5);
      return <LeafyTree key={i} position={[x, 0, z]} scale={2.6 + random(`${seed}ts${i}`) * 0.9} seed={`${seed}t${i}`} />;
    })}
    {Array.from({ length: 14 }, (_, i) => {
      const side = i % 2 ? -1 : 1;
      const z = 8 - Math.floor(i / 2) * 15 - random(`${seed}bz${i}`) * 5;
      return <Bush key={i} position={[pathX + side * (5.8 + random(`${seed}bx${i}`) * 2), 0, z]} size={1.6 + random(`${seed}bs${i}`) * 0.8} seed={`${seed}b${i}`} />;
    })}
    {[-14, -46].map((z, i) => (
      <Bench key={i} position={[pathX + (i % 2 ? -5.4 : 5.4), 0, z]} yaw={i % 2 ? Math.PI / 2 : -Math.PI / 2} />
    ))}
    {(lamps ? [-6, -40, -74] : []).map((z, i) => (
      <group key={i} position={[pathX + (i % 2 ? 4.4 : -4.4), 0, z]} scale={2.2}>
        <Lamp position={[0, 0, 0]} on={lampsOn} yaw={i % 2 ? 0 : Math.PI} />
      </group>
    ))}
    {skyline ? <ParkSkyline seed={seed} /> : null}
  </group>
);

/** City towers around the park, far enough back to read as a skyline. */
export const ParkSkyline: React.FC<{ seed?: string; radius?: number; power?: number }> = ({ seed = "park", radius = 150, power = 0.3 }) => {
  const specs = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        const a = (i / 30) * Math.PI * 2 + random(`${seed}sa${i}`) * 0.12;
        const r = radius * (0.9 + random(`${seed}sr${i}`) * 0.25);
        return { i, pos: [Math.sin(a) * r, 0, Math.cos(a) * r] as V3, h: 30 + random(`${seed}sh${i}`) * 60, w: 12 + random(`${seed}sw${i}`) * 10, c: [P.bldgSlate, P.bldgTeal, P.bldgPurple, P.bldgIndigo][i % 4] };
      }),
    [seed, radius],
  );
  return (
    <group>
      {specs.map((s) => (
        <group key={s.i} position={s.pos} scale={[1, 1, 1]}>
          <Building position={[0, 0, 0]} w={s.w} d={s.w} h={s.h} color={s.c} seed={`${seed}${s.i}`} power={power} />
        </group>
      ))}
    </group>
  );
};

export const Bench: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 1.1, 0]} castShadow>
      <BoxG args={[4.4, 0.18, 1.3]} />
      <Flat color="#8A5A3A" />
    </mesh>
    <mesh position={[0, 1.9, -0.62]} castShadow>
      <BoxG args={[4.4, 1.0, 0.16]} />
      <Flat color="#8A5A3A" />
    </mesh>
    {[-1.8, 1.8].map((x) => (
      <mesh key={x} position={[x, 0.5, 0]} castShadow>
        <BoxG args={[0.16, 1.0, 1.2]} />
        <Flat color="#2B2F3E" />
      </mesh>
    ))}
  </group>
);

// ================================================================ washing line

/** A flat hanging T-shirt (front faces +Z), top edge at the origin; `stain` 0..1 sizes the dark sweat stains. */
export const HangingShirt: React.FC<{ position: V3; color: string; stain: number; sway?: number; yaw?: number }> = ({ position, color, stain, sway = 0, yaw = 0 }) => {
  const dark = mix(color, "#1A1410", 0.42);
  return (
    <group position={position} rotation={[sway * 0.4, yaw, sway * 0.15]}>
      <mesh position={[0, -1.15, 0]} castShadow>
        <BoxG args={[1.7, 2.1, 0.08]} />
        <Flat color={color} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * 1.12, -0.42, 0]} rotation={[0, 0, s * 0.55]} castShadow>
          <BoxG args={[0.75, 0.85, 0.08]} />
          <Flat color={color} />
        </mesh>
      ))}
      {/* collar */}
      <mesh position={[0, -0.05, 0.045]}>
        <BoxG args={[0.6, 0.12, 0.02]} />
        <Flat color={mix(color, "#FFFFFF", 0.3)} />
      </mesh>
      {stain > 0.01 ? (
        <>
          {[1, -1].map((s) => (
            <mesh key={s} position={[s * 0.62, -0.62, 0.05]} scale={[0.42 * stain, 0.5 * stain, 1]}>
              <CircleG args={[0.5, 12]} />
              <meshLambertMaterial color={dark} transparent opacity={0.8} />
            </mesh>
          ))}
          <mesh position={[0, -1.0, 0.05]} scale={[0.7 * stain, 0.9 * stain, 1]}>
            <CircleG args={[0.5, 12]} />
            <meshLambertMaterial color={dark} transparent opacity={0.75} />
          </mesh>
        </>
      ) : null}
      {/* pegs */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.05, 0.06]}>
          <BoxG args={[0.12, 0.34, 0.12]} />
          <Flat color="#E8E4DA" />
        </mesh>
      ))}
    </group>
  );
};

/** A backyard: lawn, board fence, two poles and a line along x from -span/2 to +span/2 at height `lineY`. */
export const Backyard: React.FC<{ span?: number; lineY?: number }> = ({ span = 12, lineY = 6.4 }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <circleGeometry args={[300, 24]} />
      <Flat color="#6AA052" />
    </mesh>
    {/* fence */}
    {Array.from({ length: 36 }, (_, i) => (
      <mesh key={i} position={[-26 + i * 1.5, 2.4, -9]} castShadow receiveShadow>
        <BoxG args={[1.35, 4.8 + (i % 2) * 0.2, 0.18]} />
        <Flat color={i % 2 ? "#B8875A" : "#A87A50"} />
      </mesh>
    ))}
    {[1, -1].map((s) => (
      <mesh key={s} position={[(s * span) / 2, lineY / 2, 0]} castShadow>
        <CylG args={[0.12, 0.14, lineY, 6]} />
        <Flat color="#E8E4DA" />
      </mesh>
    ))}
    <mesh position={[0, lineY, 0]} rotation={[0, 0, Math.PI / 2]}>
      <CylG args={[0.03, 0.03, span, 4]} />
      <Flat color="#F4F0E4" />
    </mesh>
  </group>
);

// ================================================================ lift (elevator)

/** A cut-away lift car (no front wall, no ceiling): floor, back and side walls, rail, light and floor display. */
export const LIFT = { w: 7.6, d: 4.4, h: 6.2 };
export const Lift: React.FC<{ floor: string }> = ({ floor }) => (
  <group>
    <mesh position={[0, -0.1, 0]} receiveShadow>
      <BoxG args={[LIFT.w, 0.2, LIFT.d]} />
      <Flat color="#4A4A52" />
    </mesh>
    <mesh position={[0, LIFT.h / 2, -LIFT.d / 2 - 0.1]} receiveShadow>
      <BoxG args={[LIFT.w, LIFT.h, 0.2]} />
      <Flat color="#9AA4B0" />
    </mesh>
    {[1, -1].map((s) => (
      <mesh key={s} position={[(s * (LIFT.w + 0.2)) / 2, LIFT.h / 2, 0]} receiveShadow>
        <BoxG args={[0.2, LIFT.h, LIFT.d]} />
        <Flat color="#8A94A2" />
      </mesh>
    ))}
    {/* brushed panels */}
    {[-2.5, 0, 2.5].map((x) => (
      <mesh key={x} position={[x, LIFT.h / 2, -LIFT.d / 2 + 0.01]}>
        <BoxG args={[2.3, LIFT.h - 0.6, 0.02]} />
        <Flat color="#A8B2BE" />
      </mesh>
    ))}
    <mesh position={[0, 2.6, -LIFT.d / 2 + 0.15]}>
      <BoxG args={[LIFT.w - 0.6, 0.12, 0.12]} />
      <Flat color="#D8DCE4" />
    </mesh>
    <mesh position={[0, LIFT.h - 0.08, -LIFT.d / 2 + 0.9]}>
      <BoxG args={[LIFT.w - 1.2, 0.08, 1.4]} />
      <Glow color="#F4F0E0" />
    </mesh>
    <mesh position={[0, LIFT.h - 0.25, -LIFT.d / 2 + 0.9]}>
      <BoxG args={[LIFT.w - 1.0, 0.1, 1.6]} />
      <Flat color="#C8CCD4" />
    </mesh>
    <CanvasPanel
      position={[2.9, LIFT.h - 0.75, -LIFT.d / 2 + 0.02]}
      w={1.3}
      h={0.6}
      px={256}
      draw={(ctx, W, H) => {
        ctx.fillStyle = "#0A0A10";
        ctx.fillRect(0, 0, W, H);
        fitText(ctx, `▲ ${floor}`, W / 2, H / 2, W * 0.86, H * 0.66, "#FF8A3A");
      }}
    />
  </group>
);

/** Wavy green "smell" lines rising from a point, fading with `k`. */
export const StinkLines: React.FC<{ position: V3; t: number; k: number }> = ({ position, t, k }) => {
  if (k <= 0.01) return null;
  return (
    <group position={position}>
      {[-0.5, 0, 0.5].map((x, i) =>
        Array.from({ length: 6 }, (_, j) => {
          const u = (t * 0.6 + j / 6 + i * 0.2) % 1;
          return (
            <mesh key={`${i}${j}`} position={[x + Math.sin(u * 9 + i) * 0.22, u * 2.4, 0]} scale={0.12 + u * 0.08}>
              <IcoG args={[1, 0]} />
              <meshBasicMaterial color="#8FCB4A" transparent opacity={k * 0.75 * Math.sin(u * Math.PI)} depthWrite={false} />
            </mesh>
          );
        }),
      )}
    </group>
  );
};

// ================================================================ running track, stands

/** A straight running track along z (lanes across x), an infield and a grandstand on the -x side. */
export const TRACK = { lanes: 6, lane: 2.8, len: 260 };
export const Track: React.FC<{ seed?: string }> = ({ seed = "track" }) => {
  const W = TRACK.lanes * TRACK.lane;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, -60]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <Flat color="#5E9A4E" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, -60]} receiveShadow>
        <planeGeometry args={[W + 1, TRACK.len]} />
        <Flat color="#B8503A" />
      </mesh>
      {Array.from({ length: TRACK.lanes + 1 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-W / 2 + i * TRACK.lane, 0.02, -60]}>
          <planeGeometry args={[0.14, TRACK.len]} />
          <Glow color="#F4F0E4" />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, -6]}>
        <planeGeometry args={[W, 0.4]} />
        <Glow color="#F4F0E4" />
      </mesh>
      {/* grandstand: three tiers of seats with a crowd */}
      {[0, 1, 2, 3].map((k) => (
        <group key={k}>
          <mesh position={[-W / 2 - 8 - k * 3, 1 + k * 2, -40]} castShadow receiveShadow>
            <BoxG args={[3, 2 + k * 4, 120]} />
            <Flat color={k % 2 ? "#566270" : "#4A5462"} />
          </mesh>
          {Array.from({ length: 40 }, (_, i) => {
            if (random(`${seed}c${k}${i}`) < 0.35) return null;
            return (
              <mesh key={i} position={[-W / 2 - 8 - k * 3, 2.6 + k * 4, 18 - i * 2.9]}>
                <BoxG args={[0.9, 1.2, 0.9]} />
                <Flat color={[P.carRed, P.carTeal, "#E8E4DA", "#5A4A78", "#E0B04E", "#3A6A4A"][Math.floor(random(`${seed}cc${k}${i}`) * 6)]} />
              </mesh>
            );
          })}
        </group>
      ))}
      <mesh position={[-W / 2 - 13, 16, -40]} castShadow>
        <BoxG args={[8, 0.5, 124]} />
        <Flat color="#E8E4DA" />
      </mesh>
    </group>
  );
};

// ================================================================ fans, rooftop, lake

/** A pedestal fan (faces +Z) with spinning blades; `mist` 0..1 sprays fine droplets forward. */
export const PedestalFan: React.FC<{ position: V3; yaw?: number; t: number; scale?: number; mist?: number; height?: number; reachZ?: number; puff?: number }> = ({ position, yaw = 0, t, scale = 1, mist = 0, height = 3.2, reachZ = 4.5, puff = 1 }) => {
  const hy = height;
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      <mesh position={[0, 0.06, 0]} castShadow>
        <CylG args={[0.6, 0.7, 0.12, 12]} />
        <Flat color="#2A2C36" />
      </mesh>
      <mesh position={[0, hy / 2, 0]} castShadow>
        <CylG args={[0.06, 0.07, hy, 6]} />
        <Flat color="#C8CCD4" />
      </mesh>
      <mesh position={[0, hy, -0.35]} castShadow>
        <BoxG args={[0.5, 0.5, 0.6]} />
        <Flat color="#E8E4DA" />
      </mesh>
      <group position={[0, hy, 0.1]}>
        {[0, 0.22].map((z) => (
          <mesh key={z} position={[0, 0, z]}>
            <torusGeometry args={[0.85, 0.035, 4, 20]} />
            <Flat color="#C8CCD4" />
          </mesh>
        ))}
        <group position={[0, 0, 0.1]} rotation={[0, 0, t * 14]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} rotation={[0, 0.25, (i * Math.PI * 2) / 3]} position={[Math.cos((i * Math.PI * 2) / 3) * 0.38, Math.sin((i * Math.PI * 2) / 3) * 0.38, 0]}>
              <BoxG args={[0.62, 0.3, 0.03]} />
              <Flat color="#7FC8E8" />
            </mesh>
          ))}
          <mesh>
            <CylG args={[0.12, 0.12, 0.12, 8]} />
            <Flat color="#E8E4DA" />
          </mesh>
        </group>
        {mist > 0
          ? Array.from({ length: 22 }, (_, i) => {
              const u = (t * 0.9 + i / 22) % 1;
              const a = random(`mist${i}`) * Math.PI * 2;
              const rr = random(`mistr${i}`) * 0.7 * (0.4 + u);
              return (
                <mesh key={i} position={[Math.cos(a) * rr, Math.sin(a) * rr - u * 0.4, 0.4 + u * reachZ]} scale={(0.03 + u * 0.08) * puff}>
                  <IcoG args={[1, 0]} />
                  <meshBasicMaterial color="#E8F6FF" transparent opacity={mist * 0.55 * Math.sin(u * Math.PI)} depthWrite={false} />
                </mesh>
              );
            })
          : null}
      </group>
    </group>
  );
};

/** A flat rooftop (top at y = 0) with a parapet, water tank, AC units and a string of warm lights. */
export const Rooftop: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <mesh position={[0, -0.5, -4]} receiveShadow>
      <BoxG args={[34, 1, 30]} />
      <Flat color="#4A4E5E" />
    </mesh>
    {/* parapet: front and sides */}
    <mesh position={[0, 0.7, 10.6]} castShadow receiveShadow>
      <BoxG args={[34, 1.4, 0.6]} />
      <Flat color="#5A6070" />
    </mesh>
    {[1, -1].map((s) => (
      <mesh key={s} position={[s * 16.7, 0.7, -4]} castShadow receiveShadow>
        <BoxG args={[0.6, 1.4, 30]} />
        <Flat color="#5A6070" />
      </mesh>
    ))}
    {/* water tank on legs */}
    <group position={[-9, 0, -12]}>
      {[[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].map(([x, z], i) => (
        <mesh key={i} position={[x, 2, z]} castShadow>
          <BoxG args={[0.3, 4, 0.3]} />
          <Flat color="#2B2F3E" />
        </mesh>
      ))}
      <mesh position={[0, 7, 0]} castShadow>
        <CylG args={[3, 3, 6, 12]} />
        <Flat color="#8A5A3A" />
      </mesh>
      <mesh position={[0, 10.8, 0]} castShadow>
        <ConeG args={[3.3, 1.6, 12]} />
        <Flat color="#5A3A28" />
      </mesh>
    </group>
    {/* AC units */}
    {[8, 12].map((x, i) => (
      <group key={i} position={[x, 0, -10 + i * 3]}>
        <mesh position={[0, 1.1, 0]} castShadow>
          <BoxG args={[3, 2.2, 2.4]} />
          <Flat color="#C8CCD4" />
        </mesh>
        <mesh position={[0, 2.21, 0]} rotation={[-Math.PI / 2, 0, t * 6 + i]}>
          <CircleG args={[0.85, 10]} />
          <Flat color="#3A3E4A" />
        </mesh>
      </group>
    ))}
    {/* string lights */}
    {Array.from({ length: 14 }, (_, i) => {
      const x = -15 + i * 2.3;
      const y = 6.4 - Math.sin((i / 13) * Math.PI) * 1.2;
      return (
        <group key={i}>
          <mesh position={[x, y, 4]}>
            <IcoG args={[0.16, 1]} />
            <Glow color="#FFD890" />
          </mesh>
          <Halo position={[x, y, 4]} size={1.2} color="#FFC870" opacity={0.5} />
        </group>
      );
    })}
    {[-15.5, 15.5].map((x) => (
      <mesh key={x} position={[x, 3.3, 4]} castShadow>
        <CylG args={[0.08, 0.08, 6.6, 5]} />
        <Flat color={P.pole} />
      </mesh>
    ))}
  </group>
);

/** A deck chair facing +Z with its seat top at `seat`. */
export const DeckChair: React.FC<{ position: V3; yaw?: number; color?: string; seat?: number }> = ({ position, yaw = 0, color = "#24748F", seat = 1.0 }) => {
  const y = seat - 0.08;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, y, 0.1]} rotation={[-0.08, 0, 0]} castShadow receiveShadow>
        <BoxG args={[2.2, 0.16, 2.0]} />
        <Flat color={color} />
      </mesh>
      <mesh position={[0, y + 1.05, -1.05]} rotation={[0.38, 0, 0]} castShadow>
        <BoxG args={[2.2, 2.4, 0.16]} />
        <Flat color={color} />
      </mesh>
      {[-1, 1].map((s) =>
        [-0.8, 0.9].map((z) => (
          <mesh key={`${s}${z}`} position={[s * 1.05, y / 2, z]} castShadow>
            <BoxG args={[0.12, y, 0.12]} />
            <Flat color="#C8CCD4" />
          </mesh>
        )),
      )}
    </group>
  );
};

/** A plastic water bottle (bottom at the origin). */
export const Bottle: React.FC<{ position: V3; rotation?: V3; scale?: number }> = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh position={[0, 0.32, 0]}>
      <CylG args={[0.13, 0.13, 0.64, 8]} />
      <meshLambertMaterial color="#9AD0F0" flatShading transparent opacity={0.8} />
    </mesh>
    <mesh position={[0, 0.7, 0]}>
      <CylG args={[0.06, 0.12, 0.14, 8]} />
      <meshLambertMaterial color="#9AD0F0" flatShading transparent opacity={0.8} />
    </mesh>
    <mesh position={[0, 0.81, 0]}>
      <CylG args={[0.065, 0.065, 0.08, 8]} />
      <Flat color="#2A6AC8" />
    </mesh>
  </group>
);

/** A calm lake (top at y = 0) with a wooden jetty along -z from the shore at z = `shore`. */
export const Lake: React.FC<{ t: number; shore?: number }> = ({ t, shore = 6 }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, -150]} receiveShadow>
      <planeGeometry args={[600, 300]} />
      <Flat color="#4A6E84" />
    </mesh>
    {Array.from({ length: 36 }, (_, i) => (
      <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[(random(`lk${i}`) - 0.5) * 120 + Math.sin(t * 0.4 + i) * 1.5, -0.2, shore - 8 - random(`lkz${i}`) * 110]}>
        <planeGeometry args={[2 + random(`lkw${i}`) * 4, 0.18]} />
        <Flat color="#8AAABB" />
      </mesh>
    ))}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, shore + 100]} receiveShadow>
      <planeGeometry args={[600, 200]} />
      <Flat color="#5A7A4A" />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -210]} receiveShadow>
      <planeGeometry args={[600, 180]} />
      <Flat color="#4E6E46" />
    </mesh>
    {/* jetty */}
    {Array.from({ length: 14 }, (_, i) => (
      <mesh key={i} position={[0, 0.5, shore - 1 - i * 1.35]} castShadow receiveShadow>
        <BoxG args={[6, 0.24, 1.2]} />
        <Flat color={i % 2 ? "#9A6A44" : "#8A5E3C"} />
      </mesh>
    ))}
    {Array.from({ length: 6 }, (_, i) =>
      [-1, 1].map((s) => (
        <mesh key={`${i}${s}`} position={[s * 2.8, 0.2, shore - 2 - i * 3.4]} castShadow>
          <CylG args={[0.2, 0.2, 1.6, 6]} />
          <Flat color="#5A3A28" />
        </mesh>
      )),
    )}
  </group>
);

/** Falling leaves drifting across a shot (a breeze). */
export const Leaves: React.FC<{ t: number; center: V3; size?: V3; count?: number; seed?: string }> = ({ t, center, size = [30, 16, 16], count = 26, seed = "leaf" }) => (
  <group position={center}>
    {Array.from({ length: count }, (_, i) => {
      const u = (t * (0.18 + random(`${seed}v${i}`) * 0.12) + random(`${seed}o${i}`)) % 1;
      const x = (u - 0.5) * size[0];
      const y = size[1] * (0.5 - u * 0.7) + Math.sin(t * 2 + i) * 0.6 + (random(`${seed}y${i}`) - 0.5) * size[1] * 0.5;
      const z = (random(`${seed}z${i}`) - 0.5) * size[2];
      return (
        <mesh key={i} position={[x, y, z]} rotation={[t * 3 + i, t * 2 + i, i]}>
          <BoxG args={[0.5, 0.04, 0.32]} />
          <Flat color={["#E8862A", "#C8502A", "#E0B04E", "#8A9A3A"][i % 4]} />
        </mesh>
      );
    })}
  </group>
);

/** Breath puffs leaving a mouth point, drifting forward. */
export const Breath: React.FC<{ from: V3; dir: V3; t: number; k?: number; scale?: number }> = ({ from, dir, t, k = 1, scale = 1 }) => (
  <group>
    {Array.from({ length: 5 }, (_, i) => {
      const u = (t * 0.7 + i / 5) % 1;
      return (
        <mesh key={i} position={[from[0] + dir[0] * u * 2.2 * scale, from[1] + (dir[1] * u * 2.2 + u * 0.3) * scale, from[2] + dir[2] * u * 2.2 * scale]} scale={(0.1 + u * 0.3) * scale}>
          <IcoG args={[1, 1]} />
          <meshLambertMaterial color="#F4F8FC" transparent opacity={0.45 * k * Math.sin(u * Math.PI)} depthWrite={false} />
        </mesh>
      );
    })}
  </group>
);

/** Wavy heat radiating outward from a centre: expanding thin orange rings in a vertical plane facing +Z. */
export const HeatRings: React.FC<{ position: V3; t: number; k?: number; color?: string; max?: number }> = ({ position, t, k = 1, color = "#FF9A3A", max = 4 }) => (
  <group position={position}>
    {[0, 1, 2].map((i) => {
      const u = (t * 0.55 + i / 3) % 1;
      return (
        <mesh key={i} scale={0.8 + u * max}>
          <torusGeometry args={[1, 0.025, 4, 28]} />
          <meshBasicMaterial color={color} transparent opacity={k * 0.8 * (1 - u)} depthWrite={false} />
        </mesh>
      );
    })}
  </group>
);

/** Wind streaks passing along +x (airflow carrying heat away). */
export const WindStreaks: React.FC<{ t: number; center: V3; size?: V3; count?: number; color?: string; seed?: string }> = ({ t, center, size = [26, 6, 6], count = 12, color = "#BFEFFF", seed = "wind" }) => (
  <group position={center}>
    {Array.from({ length: count }, (_, i) => {
      const u = (t * 0.7 + random(`${seed}o${i}`)) % 1;
      const y = (random(`${seed}y${i}`) - 0.5) * size[1];
      const z = (random(`${seed}z${i}`) - 0.5) * size[2];
      const len = 1.6 + random(`${seed}l${i}`) * 2.2;
      return (
        <mesh key={i} position={[(u - 0.5) * size[0], y + Math.sin(u * 6 + i) * 0.2, z]}>
          <BoxG args={[len, 0.06, 0.06]} />
          <meshBasicMaterial color={color} transparent opacity={0.75 * Math.sin(u * Math.PI)} depthWrite={false} />
        </mesh>
      );
    })}
  </group>
);

/** A soft interpolate helper for shots: 0 before a, 1 after b. */
export const kk = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** A yellow hard hat sitting on a hero's head. */
export const HardHat: React.FC<{ pose: Pose; position: V3; yaw?: number }> = ({ pose, position, yaw = 0 }) => {
  const top = headPoint(pose, [0, 0.66, -0.04], position, yaw);
  return (
    <group position={top} rotation={[-pose.headPitch * 0.9 + (pose.lean ?? 0) * 0.6, yaw + pose.headYaw, 0]}>
      <mesh position={[0, 0.12, 0]} scale={[1, 0.62, 1]} castShadow>
        <IcoG args={[0.8, 2]} />
        <Flat color="#F2C230" />
      </mesh>
      <mesh position={[0, -0.02, 0.1]} castShadow>
        <CylG args={[0.95, 0.98, 0.08, 14]} />
        <Flat color="#E8B020" />
      </mesh>
    </group>
  );
};
