/**
 * Sets and props for "What If Work Ended in 2036?" (ep. 6).
 * Generic world: no real companies, logos or people (Elon Musk is named in the narration only).
 * Robots are our own low-poly design. Everything rests on y = 0 using its real extents and follows
 * the kit detail level. Human-scale props are sized to Slavoski (4.2 tall ≈ 1.8 m, so 1 unit ≈ 0.43 m).
 */
import React, { useMemo } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { Building, BUILDING_COLORS } from "../../slavoski/city";
import { BoxG, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { FONT } from "../../slavoski/fonts";
import { Flat, Glow } from "../../slavoski/materials";
import { clamp01, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { CANVAS_FONT, CanvasPanel, fitText } from "../../slavoski/screens";

// ================================================================ helpers

const v = (p: V3) => new THREE.Vector3(...p);
const UP = new THREE.Vector3(0, 1, 0);

/** A box strut from a to b (its long axis along the segment). */
export const Strut: React.FC<{ a: V3; b: V3; w: number; d?: number; color: string; glow?: boolean }> = ({ a, b, w, d, color, glow }) => {
  const dir = v(b).sub(v(a));
  const len = Math.max(0.001, dir.length());
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
  const mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  return (
    <mesh position={mid} quaternion={q} castShadow receiveShadow>
      <BoxG args={[w, len, d ?? w]} />
      {glow ? <Glow color={color} /> : <Flat color={color} />}
    </mesh>
  );
};

/** Two-bone IK: elbow position for shoulder S reaching T with lengths L1, L2, bending toward `pole`. */
export const ik2 = (S: V3, T: V3, L1: number, L2: number, pole: V3): V3 => {
  const s = v(S);
  const d = v(T).sub(s);
  const dist = Math.min(L1 + L2 - 1e-3, Math.max(Math.abs(L1 - L2) + 1e-3, d.length()));
  const dn = d.clone().normalize();
  const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const pn = v(pole).sub(dn.clone().multiplyScalar(v(pole).dot(dn))).normalize();
  const e = s.add(dn.multiplyScalar(a)).add(pn.multiplyScalar(h));
  return [e.x, e.y, e.z];
};

const frac = (x: number) => ((x % 1) + 1) % 1;

// ================================================================ humanoid robot

/** Robot proportions (feet on y = 0, faces +Z). About Slavoski's height. */
export const ROBOT = { hipY: 1.6, shoulderY: 2.92, shoulderX: 0.86, upper: 0.66, fore: 0.62, headY: 3.62, top: 4.35 };
const R_WHITE = "#DDE2EA";
const R_JOINT = "#2B2F3E";
const R_ACCENT = "#3FA7B5";
export const R_VISOR = "#7FE8FF";

/** [pitch forward, roll outward, elbow bend] in radians. */
export type RobotArm = [number, number, number];
export const ARM_REST: RobotArm = [0.05, 0.12, 0.2];

export type RobotProps = {
  position: V3;
  yaw?: number;
  scale?: number;
  /** Walk phase in cycles (0 = standing). */
  walk?: number;
  walkAmount?: number;
  l?: RobotArm;
  r?: RobotArm;
  headYaw?: number;
  headPitch?: number;
  visor?: string;
  body?: string;
  accent?: string;
};

const robotLegs = (walk: number, amount: number) => {
  const s = Math.sin(walk * Math.PI * 2);
  const c = Math.cos(walk * Math.PI * 2);
  return {
    l: { swing: 0.42 * s * amount, knee: Math.max(0, -c) * 0.65 * amount },
    r: { swing: -0.42 * s * amount, knee: Math.max(0, c) * 0.65 * amount },
    bob: walk ? Math.abs(s) * 0.05 * amount : 0,
  };
};

/** World position of a robot's hand centre (mirrors the transforms in <Robot>). */
export const robotHand = (side: "l" | "r", p: RobotProps): V3 => {
  const sx = side === "l" ? 1 : -1;
  const [pitch, roll, elbow] = (side === "l" ? p.l : p.r) ?? ARM_REST;
  const { bob } = robotLegs(p.walk ?? 0, p.walkAmount ?? 1);
  const m = new THREE.Matrix4()
    .makeTranslation(...p.position)
    .multiply(new THREE.Matrix4().makeRotationY(p.yaw ?? 0))
    .multiply(new THREE.Matrix4().makeScale(p.scale ?? 1, p.scale ?? 1, p.scale ?? 1))
    .multiply(new THREE.Matrix4().makeTranslation(sx * ROBOT.shoulderX, ROBOT.shoulderY + bob, 0))
    .multiply(new THREE.Matrix4().makeRotationZ(sx * roll))
    .multiply(new THREE.Matrix4().makeRotationX(-pitch))
    .multiply(new THREE.Matrix4().makeTranslation(0, -ROBOT.upper, 0))
    .multiply(new THREE.Matrix4().makeRotationX(-elbow));
  const h = new THREE.Vector3(0, -ROBOT.fore - 0.1, 0).applyMatrix4(m);
  return [h.x, h.y, h.z];
};

export const Robot: React.FC<RobotProps> = ({
  position,
  yaw = 0,
  scale = 1,
  walk = 0,
  walkAmount = 1,
  l = ARM_REST,
  r = ARM_REST,
  headYaw = 0,
  headPitch = 0,
  visor = R_VISOR,
  body = R_WHITE,
  accent = R_ACCENT,
}) => {
  const legs = robotLegs(walk, walkAmount);
  const leg = (sx: number, g: { swing: number; knee: number }) => (
    <group position={[sx * 0.32, ROBOT.hipY, 0]} rotation={[-g.swing, 0, 0]}>
      <mesh position={[0, -0.4, 0]} castShadow>
        <BoxG args={[0.4, 0.8, 0.44]} />
        <Flat color={body} />
      </mesh>
      <group position={[0, -0.8, 0]} rotation={[g.knee, 0, 0]}>
        <mesh castShadow>
          <IcoG args={[0.19, 1]} />
          <Flat color={R_JOINT} />
        </mesh>
        <mesh position={[0, -0.32, 0]} castShadow>
          <BoxG args={[0.34, 0.64, 0.38]} />
          <Flat color={body} />
        </mesh>
        <mesh position={[0, -0.72, 0.08]} castShadow>
          <BoxG args={[0.44, 0.16, 0.66]} />
          <Flat color={R_JOINT} />
        </mesh>
      </group>
    </group>
  );
  const arm = (sx: number, [pitch, roll, elbow]: RobotArm) => (
    <group position={[sx * ROBOT.shoulderX, ROBOT.shoulderY, 0]} rotation={[0, 0, sx * roll]}>
      <group rotation={[-pitch, 0, 0]}>
        <mesh castShadow>
          <IcoG args={[0.24, 1]} />
          <Flat color={R_JOINT} />
        </mesh>
        <mesh position={[0, -ROBOT.upper / 2, 0]} castShadow>
          <BoxG args={[0.32, ROBOT.upper, 0.34]} />
          <Flat color={body} />
        </mesh>
        <group position={[0, -ROBOT.upper, 0]} rotation={[-elbow, 0, 0]}>
          <mesh position={[0, -ROBOT.fore / 2, 0]} castShadow>
            <BoxG args={[0.29, ROBOT.fore, 0.31]} />
            <Flat color={body} />
          </mesh>
          <mesh position={[0, -ROBOT.fore - 0.1, 0]} castShadow>
            <BoxG args={[0.3, 0.24, 0.28]} />
            <Flat color={R_JOINT} />
          </mesh>
        </group>
      </group>
    </group>
  );
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      {leg(1, legs.l)}
      {leg(-1, legs.r)}
      <group position={[0, legs.bob, 0]}>
        <mesh position={[0, ROBOT.hipY + 0.05, 0]} castShadow>
          <BoxG args={[0.95, 0.32, 0.5]} />
          <Flat color={R_JOINT} />
        </mesh>
        <mesh position={[0, 2.42, 0]} castShadow>
          <BoxG args={[1.36, 1.24, 0.72]} />
          <Flat color={body} />
        </mesh>
        <mesh position={[0, 2.6, 0.37]}>
          <BoxG args={[0.74, 0.46, 0.04]} />
          <Flat color={accent} />
        </mesh>
        <mesh position={[0, 2.62, 0.4]}>
          <circleGeometry args={[0.12, 8]} />
          <Glow color={visor} />
        </mesh>
        {arm(1, l)}
        {arm(-1, r)}
        <mesh position={[0, 3.15, 0]} castShadow>
          <CylG args={[0.17, 0.2, 0.26, 8]} />
          <Flat color={R_JOINT} />
        </mesh>
        <group position={[0, 3.24, 0]} rotation={[-headPitch, headYaw, 0]}>
          <mesh position={[0, ROBOT.headY - 3.24, 0]} castShadow>
            <BoxG args={[0.9, 0.78, 0.82]} />
            <Flat color={body} />
          </mesh>
          <mesh position={[0, ROBOT.headY - 3.24 + 0.03, 0.415]}>
            <planeGeometry args={[0.74, 0.22]} />
            <Glow color={visor} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.47, ROBOT.headY - 3.24, 0]} rotation={[0, 0, Math.PI / 2]}>
              <CylG args={[0.14, 0.14, 0.08, 8]} />
              <Flat color={accent} />
            </mesh>
          ))}
          <mesh position={[0.24, ROBOT.headY - 3.24 + 0.55, 0]}>
            <CylG args={[0.025, 0.025, 0.32, 4]} />
            <Flat color={R_JOINT} />
          </mesh>
          <mesh position={[0.24, ROBOT.headY - 3.24 + 0.73, 0]}>
            <IcoG args={[0.06, 1]} />
            <Glow color={visor} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

// ================================================================ construction site

export const STEEL = "#A2493A";
/** Frame grid: storeys every 8 units (a storey is ~3.5 m at hero scale). Slab k top is at slabTop(k). */
export const SITE = { storey: 8, xs: [-12, -4, 4, 12], zs: [-8, 0], storeys: 9, slabs: 3 };
export const slabTop = (k: number) => k * SITE.storey + 1.0;

export const SkyscraperSite: React.FC<{ position?: V3 }> = ({ position = [0, 0, 0] }) => {
  const S = SITE.storey;
  const colH = (x: number, z: number) => (SITE.storeys - (random(`col${x}${z}`) < 0.45 ? 1 : 0)) * S + 0.4;
  return (
    <group position={position}>
      {SITE.xs.flatMap((x) =>
        SITE.zs.map((z) => (
          <mesh key={`c${x}${z}`} position={[x, colH(x, z) / 2, z]} castShadow receiveShadow>
            <BoxG args={[0.9, colH(x, z), 0.9]} />
            <Flat color={STEEL} />
          </mesh>
        )),
      )}
      {Array.from({ length: SITE.storeys }, (_, i) => i + 1).map((k) => (
        <group key={k}>
          {SITE.zs.map((z) =>
            k < SITE.storeys || random(`bx${z}`) < 0.5 ? (
              <mesh key={`bx${z}`} position={[0, k * S, z]} castShadow receiveShadow>
                <BoxG args={[24.9, 0.8, 0.7]} />
                <Flat color={STEEL} />
              </mesh>
            ) : null,
          )}
          {k < SITE.storeys
            ? SITE.xs.map((x) => (
                <mesh key={`bz${x}`} position={[x, k * S, -4]} castShadow receiveShadow>
                  <BoxG args={[0.7, 0.8, 8]} />
                  <Flat color={STEEL} />
                </mesh>
              ))
            : null}
          {/* diagonal bracing on the upper, still-open storeys */}
          {k > SITE.slabs + 1 && k < SITE.storeys ? (
            <Strut a={[-12, (k - 1) * S + 0.4, 0.05]} b={[-4, k * S - 0.4, 0.05]} w={0.35} color={STEEL} />
          ) : null}
        </group>
      ))}
      {/* concrete slabs and glazing on the finished lower storeys */}
      {Array.from({ length: SITE.slabs }, (_, i) => i + 1).map((k) => (
        <group key={`s${k}`}>
          <mesh position={[0, k * S + 0.7, -4]} castShadow receiveShadow>
            <BoxG args={[25.6, 0.6, 9.2]} />
            <Flat color="#8E8A84" />
          </mesh>
          {k < SITE.slabs ? (
            <mesh position={[0, k * S + 1 + (S - 1.4) / 2, -4.2]}>
              <BoxG args={[24.2, S - 1.4, 7.6]} />
              <Flat color="#2E5A6A" opacity={0.92} />
            </mesh>
          ) : null}
        </group>
      ))}
      <mesh position={[0, (S - 0.4) / 2, -4.2]}>
        <BoxG args={[24.2, S - 0.4, 7.6]} />
        <Flat color="#24485A" />
      </mesh>
    </group>
  );
};

/** Tower crane: lattice mast, jib toward -X with a trolley and a hanging girder. */
export const Crane: React.FC<{ position: V3; height?: number; jib?: number; load?: number; swing?: number; yaw?: number }> = ({
  position,
  height = 92,
  jib = 42,
  load = 26,
  swing = 0,
  yaw = 0,
}) => {
  const Y = "#E8B83A";
  const m = 1.0;
  const ties = Math.floor(height / 4);
  const cableTop: V3 = [-load, height - 0.6, 0];
  const hookY = height - 22;
  const hook: V3 = [-load + Math.sin(swing) * 0.6, hookY, Math.cos(swing) * 0.2];
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * m, height / 2, sz * m]} castShadow>
            <BoxG args={[0.22, height, 0.22]} />
            <Flat color={Y} />
          </mesh>
        )),
      )}
      {Array.from({ length: ties }, (_, i) => (
        <group key={i} position={[0, 2 + i * 4, 0]}>
          <mesh position={[0, 0, m]}>
            <BoxG args={[2 * m, 0.16, 0.16]} />
            <Flat color={Y} />
          </mesh>
          <mesh position={[0, 0, -m]}>
            <BoxG args={[2 * m, 0.16, 0.16]} />
            <Flat color={Y} />
          </mesh>
          <mesh position={[m, 0, 0]}>
            <BoxG args={[0.16, 0.16, 2 * m]} />
            <Flat color={Y} />
          </mesh>
          <mesh position={[-m, 0, 0]}>
            <BoxG args={[0.16, 0.16, 2 * m]} />
            <Flat color={Y} />
          </mesh>
        </group>
      ))}
      {/* cab, jib, counter-jib, counterweight */}
      <mesh position={[0.4, height + 1.0, 1.6]} castShadow>
        <BoxG args={[2.2, 2.0, 1.6]} />
        <Flat color={Y} />
      </mesh>
      <mesh position={[-jib / 2 + 1, height, 0]} castShadow>
        <BoxG args={[jib, 1.2, 1.4]} />
        <Flat color={Y} />
      </mesh>
      <mesh position={[7, height, 0]} castShadow>
        <BoxG args={[14, 1.0, 1.4]} />
        <Flat color={Y} />
      </mesh>
      <mesh position={[12, height - 1.6, 0]} castShadow>
        <BoxG args={[3.2, 2.4, 2.0]} />
        <Flat color="#6B6F78" />
      </mesh>
      <mesh position={[0, height + 5, 0]}>
        <ConeG args={[1.0, 8, 4]} />
        <Flat color={Y} />
      </mesh>
      <Strut a={[0, height + 8.6, 0]} b={[-jib + 2, height + 0.6, 0]} w={0.12} color="#3A3A40" />
      <Strut a={[0, height + 8.6, 0]} b={[13, height + 0.5, 0]} w={0.12} color="#3A3A40" />
      {/* trolley, cable, hook block and the girder it carries */}
      <mesh position={[-load, height - 0.9, 0]}>
        <BoxG args={[1.6, 0.6, 1.6]} />
        <Flat color="#3A3A40" />
      </mesh>
      <Strut a={cableTop} b={[hook[0], hook[1] + 0.8, hook[2]]} w={0.08} color="#2A2A30" />
      <mesh position={[hook[0], hook[1] + 0.4, hook[2]]}>
        <BoxG args={[0.8, 0.8, 0.6]} />
        <Flat color="#E8B83A" />
      </mesh>
      <Strut a={[hook[0], hook[1], hook[2]]} b={[hook[0] - 3.5, hook[1] - 2.2, hook[2]]} w={0.06} color="#2A2A30" />
      <Strut a={[hook[0], hook[1], hook[2]]} b={[hook[0] + 3.5, hook[1] - 2.2, hook[2]]} w={0.06} color="#2A2A30" />
      <mesh position={[hook[0], hook[1] - 2.6, hook[2]]} castShadow>
        <BoxG args={[10, 0.8, 0.7]} />
        <Flat color={STEEL} />
      </mesh>
      {/* aircraft warning light */}
      <mesh position={[-jib + 1.2, height + 0.9, 0]}>
        <IcoG args={[0.3, 1]} />
        <Glow color="#FF4040" fog={false} />
      </mesh>
    </group>
  );
};

// ================================================================ self-driving truck

/** Truck facing +Z, origin at the middle of its length. Front bumper at z = TRUCK.front. */
export const TRUCK = { w: 5.2, front: 11.8, back: -11.8, wheelR: 1.1 };

export const Truck: React.FC<{ position: V3; yaw?: number; t?: number; color?: string; label?: "left" | "right" | "none" }> = ({
  position,
  yaw = 0,
  t = 0,
  color = "#E9ECF2",
  label = "left",
}) => {
  const W = TRUCK.w;
  const cabZ = TRUCK.front - 2.6;
  const trailerZ = TRUCK.back + 9;
  const spin = t * 6;
  const wheelZs = [cabZ + 1.2, trailerZ - 5.5, trailerZ - 7.7];
  const blink = Math.floor(t * 2.2) % 2 === 0;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {/* chassis */}
      <mesh position={[0, 1.35, -0.4]} castShadow>
        <BoxG args={[W - 1.2, 0.6, 22.6]} />
        <Flat color="#23262F" />
      </mesh>
      {/* cab */}
      <mesh position={[0, 3.9, cabZ]} castShadow receiveShadow>
        <BoxG args={[W, 5.0, 5.2]} />
        <Flat color={P.carTeal} />
      </mesh>
      <mesh position={[0, 5.15, cabZ + 2.61]}>
        <planeGeometry args={[W - 0.8, 1.9]} />
        <Flat color="#1B2638" />
      </mesh>
      {/* "nobody at the wheel": an empty-seat glyph glowing on the windscreen */}
      <mesh position={[0, 5.15, cabZ + 2.62]}>
        <planeGeometry args={[0.7, 0.7]} />
        <Glow color={blink ? "#7FE8FF" : "#3A7A90"} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (W / 2 + 0.01), 5.1, cabZ + 0.6]} rotation={[0, (s * Math.PI) / 2, 0]}>
          <planeGeometry args={[2.2, 1.6]} />
          <Flat color="#1B2638" />
        </mesh>
      ))}
      {/* lidar dome on the roof */}
      <mesh position={[0, 6.65, cabZ + 1.2]} castShadow>
        <CylG args={[0.5, 0.55, 0.5, 10]} />
        <Flat color="#2B2F3E" />
      </mesh>
      <mesh position={[0, 6.7, cabZ + 1.2]} rotation={[0, spin, 0]}>
        <CylG args={[0.56, 0.56, 0.12, 10]} />
        <Glow color={R_VISOR} />
      </mesh>
      {[-1.8, 1.8].map((x) => (
        <mesh key={x} position={[x, 2.4, TRUCK.front + 0.01]}>
          <planeGeometry args={[0.9, 0.45]} />
          <Glow color={P.headlight} />
        </mesh>
      ))}
      {/* trailer */}
      <mesh position={[0, 5.0, trailerZ]} castShadow receiveShadow>
        <BoxG args={[W, 6.6, 18]} />
        <Flat color={color} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (W / 2 + 0.01), 2.0, trailerZ]} rotation={[0, (s * Math.PI) / 2, 0]}>
          <planeGeometry args={[18, 0.3]} />
          <Glow color={R_VISOR} />
        </mesh>
      ))}
      {label !== "none" ? (
        <CanvasPanel
          position={[(label === "left" ? 1 : -1) * (W / 2 + 0.02), 5.2, trailerZ]}
          rotation={[0, (label === "left" ? 1 : -1) * (Math.PI / 2), 0]}
          w={16}
          h={4.6}
          draw={(ctx, w, h) => {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, w, h);
            fitText(ctx, "SELF-DRIVING", w / 2, h * 0.42, w * 0.88, h * 0.42, "#1D274B");
            fitText(ctx, "NO DRIVER ON BOARD", w / 2, h * 0.78, w * 0.7, h * 0.16, "#24748F");
          }}
        />
      ) : null}
      {[-1, 1].flatMap((s) =>
        wheelZs.map((z) => (
          <mesh key={`${s}${z}`} position={[s * (W / 2 - 0.35), TRUCK.wheelR, z]} rotation={[spin, 0, Math.PI / 2]} castShadow>
            <CylG args={[TRUCK.wheelR, TRUCK.wheelR, 0.8, 10]} />
            <Flat color="#17181E" />
          </mesh>
        )),
      )}
      {[-1.9, 1.9].map((x) => (
        <mesh key={x} position={[x, 2.2, TRUCK.back - 0.01]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.6, 0.4]} />
          <Glow color={P.taillight} />
        </mesh>
      ))}
    </group>
  );
};

// ================================================================ factory

export const BELT = { top: 2.0, w: 3.2, x0: -46, x1: 46 };
const ARM_Y = "#E0B04E";

/** An industrial robot arm on a pedestal at `base`, its gripper at `target` (two-bone IK). */
export const IndustrialArm: React.FC<{ base: V3; target: V3 }> = ({ base, target }) => {
  const S: V3 = [base[0], base[1] + 3.0, base[2]];
  const L1 = 3.3;
  const L2 = 2.8;
  const wrist: V3 = [target[0], target[1] + 0.7, target[2]];
  const elbow = ik2(S, wrist, L1, L2, [0, 1, 0]);
  const yaw = Math.atan2(target[0] - base[0], target[2] - base[2]);
  return (
    <group>
      <mesh position={[base[0], base[1] + 0.3, base[2]]} castShadow>
        <CylG args={[1.0, 1.1, 0.6, 10]} />
        <Flat color="#3A3F4E" />
      </mesh>
      <mesh position={[base[0], base[1] + 1.6, base[2]]} rotation={[0, yaw, 0]} castShadow>
        <CylG args={[0.62, 0.72, 2.2, 8]} />
        <Flat color={ARM_Y} />
      </mesh>
      <mesh position={S}>
        <IcoG args={[0.6, 1]} />
        <Flat color="#2B2F3E" />
      </mesh>
      <Strut a={S} b={elbow} w={0.62} color={ARM_Y} />
      <mesh position={elbow}>
        <IcoG args={[0.45, 1]} />
        <Flat color="#2B2F3E" />
      </mesh>
      <Strut a={elbow} b={wrist} w={0.48} color={ARM_Y} />
      <mesh position={wrist}>
        <IcoG args={[0.32, 1]} />
        <Flat color="#2B2F3E" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[target[0] + s * 0.28, target[1] + 0.25, target[2]]} castShadow>
          <BoxG args={[0.14, 0.6, 0.4]} />
          <Flat color="#2B2F3E" />
        </mesh>
      ))}
    </group>
  );
};

/** Box positions on the belt at time t (moving +X, wrapping), shared by the factory and its arms. */
export const beltBoxes = (t: number, n = 18) =>
  Array.from({ length: n }, (_, i) => {
    const span = BELT.x1 - BELT.x0;
    const x = BELT.x0 + frac((i * (span / n) + t * 2.4) / span) * span;
    return { x, s: 1.5 + random(`bx${i}`) * 0.3, tint: random(`bt${i}`) };
  });

/** Factory floor with a conveyor along X at z = 0, robot arms on both sides and a "HUMAN WORKERS: 0" board. */
export const Factory: React.FC<{ t: number; boardX?: number }> = ({ t, boardX = 0 }) => {
  const boxes = beltBoxes(t);
  const arms = [-22, -11, 0, 11, 22].map((x, i) => {
    const z = i % 2 ? -3.6 : 3.6;
    const ph = i * 1.7;
    const tx = x + Math.sin(t * 1.4 + ph) * 1.0;
    const ty = BELT.top + 2.2 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2.8 + ph));
    return { base: [x, 0, z] as V3, target: [tx, ty, z * 0.12] as V3 };
  });
  return (
    <group>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[120, 0.1, 50]} />
        <Flat color="#454B5E" />
      </mesh>
      {/* caution lanes */}
      {[-6.2, 6.2].map((z) => (
        <mesh key={z} position={[0, 0.006, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[110, 0.3]} />
          <Flat color={P.windowLit} />
        </mesh>
      ))}
      {/* back wall with a strip of high windows */}
      <mesh position={[0, 11, -16]} receiveShadow>
        <BoxG args={[120, 22, 0.4]} />
        <Flat color="#2E3448" />
      </mesh>
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[-52 + i * 8, 15.5, -15.78]}>
          <planeGeometry args={[6.4, 3.4]} />
          <Glow color="#6F8FB8" />
        </mesh>
      ))}
      {/* roof trusses + hanging lamps */}
      {Array.from({ length: 9 }, (_, i) => (
        <group key={i} position={[-40 + i * 10, 0, 0]}>
          <mesh position={[0, 21, -2]}>
            <BoxG args={[0.6, 0.8, 30]} />
            <Flat color="#262B3A" />
          </mesh>
          <mesh position={[0, 18, 0.5]}>
            <CylG args={[0.04, 0.04, 6, 4]} />
            <Flat color="#262B3A" />
          </mesh>
          <mesh position={[0, 15, 0.5]}>
            <ConeG args={[0.9, 0.8, 8, 1, true]} />
            <Glow color={P.lampGlow} />
          </mesh>
        </group>
      ))}
      {/* conveyor */}
      <mesh position={[0, BELT.top - 0.3, 0]} castShadow receiveShadow>
        <BoxG args={[BELT.x1 - BELT.x0, 0.6, BELT.w]} />
        <Flat color="#3A3F4E" />
      </mesh>
      <mesh position={[0, BELT.top + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[BELT.x1 - BELT.x0, BELT.w - 0.3]} />
        <Flat color="#1E2029" />
      </mesh>
      {Array.from({ length: 24 }, (_, i) => (
        <group key={i} position={[BELT.x0 + 2 + i * 3.9, 0, 0]}>
          {[-1.3, 1.3].map((z) => (
            <mesh key={z} position={[0, (BELT.top - 0.6) / 2, z]} castShadow>
              <BoxG args={[0.3, BELT.top - 0.6, 0.3]} />
              <Flat color="#2B2F3E" />
            </mesh>
          ))}
        </group>
      ))}
      {boxes.map((b, i) => (
        <group key={i} position={[b.x, BELT.top + b.s / 2, 0]}>
          <mesh castShadow receiveShadow>
            <BoxG args={[b.s, b.s, b.s]} />
            <Flat color={b.tint < 0.5 ? "#B89060" : "#A88052"} />
          </mesh>
          <mesh position={[0, b.s / 2 + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.32, b.s]} />
            <Flat color="#D8C29A" />
          </mesh>
        </group>
      ))}
      {arms.map((a, i) => (
        <IndustrialArm key={i} base={a.base} target={a.target} />
      ))}
      {/* the board hangs from the trusses behind the line */}
      <group position={[boardX, 0, -9]}>
        {[-3.6, 3.6].map((x) => (
          <mesh key={x} position={[x, 17.3, 0]}>
            <CylG args={[0.05, 0.05, 7.4, 4]} />
            <Flat color="#262B3A" />
          </mesh>
        ))}
        <mesh position={[0, 11.6, -0.12]}>
          <BoxG args={[9.4, 4.2, 0.2]} />
          <Flat color="#15161C" />
        </mesh>
        <CanvasPanel
          position={[0, 11.6, 0.0]}
          w={9}
          h={3.8}
          draw={(ctx, w, h) => {
            ctx.fillStyle = "#0E1018";
            ctx.fillRect(0, 0, w, h);
            fitText(ctx, "HUMAN WORKERS", w / 2, h * 0.3, w * 0.86, h * 0.24, "#E8E4DA");
            fitText(ctx, "0", w / 2, h * 0.7, w * 0.5, h * 0.52, "#FF5A4A");
          }}
        />
      </group>
    </group>
  );
};

// ================================================================ AI core, coins

/** The "invention": a glowing faceted core with rotating rings and orbiting data bits. */
export const AiCore: React.FC<{ position: V3; t: number; scale?: number; color?: string; split?: boolean; light?: number }> = ({
  position,
  t,
  scale = 1,
  color = R_VISOR,
  split = false,
  light = 1,
}) => {
  const bits = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 + t * (0.6 + (i % 3) * 0.15);
    const r = 2.9 + (i % 4) * 0.35;
    const y = Math.sin(a * 2 + i) * 0.6;
    return [Math.cos(a) * r, y, Math.sin(a) * r] as V3;
  });
  return (
    <group position={position} scale={scale}>
      <mesh rotation={[t * 0.3, t * 0.45, 0]} castShadow>
        <IcoG args={[1.6, 1]} />
        <Flat color={split ? "#E8E4DA" : "#BFEFFF"} />
      </mesh>
      <mesh rotation={[0.4, -t * 0.6, 0]}>
        <IcoG args={[1.95, 0]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2 + 0.35, 0, t * 0.8]}>
        <torusGeometry args={[2.6, 0.07, 4, 48]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2 - 0.6, 0.5, -t * 0.6]}>
        <torusGeometry args={[3.2, 0.05, 4, 56]} />
        <meshBasicMaterial color={split ? P.amber : color} toneMapped={false} />
      </mesh>
      {bits.map((p, i) => (
        <mesh key={i} position={p}>
          <IcoG args={[0.09, 0]} />
          <Glow color={i % 3 ? color : P.amber} />
        </mesh>
      ))}
      {split ? (
        <>
          <pointLight position={[-4, 1, 3]} color={P.amber} intensity={60 * light} distance={14} decay={2} />
          <pointLight position={[4, 1, 3]} color="#FF3A4A" intensity={60 * light} distance={14} decay={2} />
        </>
      ) : (
        <pointLight position={[0, 0, 3.5]} color={color} intensity={40 * light} distance={30} decay={2} />
      )}
    </group>
  );
};

/** A stream of gold coins flying from `from` to points around `to` along arcs, looping with t. */
export const CoinFlow: React.FC<{ from: V3; to: V3; t: number; count?: number; arc?: number; spread?: number; speed?: number; size?: number; seed?: string; fromSpread?: number }> = ({
  from,
  to,
  t,
  count = 40,
  arc = 4,
  spread = 3,
  speed = 0.45,
  size = 0.35,
  seed = "coin",
  fromSpread = 0,
}) => (
  <group>
    {Array.from({ length: count }, (_, i) => {
      const p = frac(t * speed + random(`${seed}p${i}`));
      const ox = (random(`${seed}x${i}`) - 0.5) * 2 * spread;
      const oz = (random(`${seed}z${i}`) - 0.5) * 2 * spread;
      const fx = (random(`${seed}fx${i}`) - 0.5) * 2 * fromSpread;
      const fz = (random(`${seed}fz${i}`) - 0.5) * 2 * fromSpread;
      const a: V3 = [from[0] + fx, from[1], from[2] + fz];
      const b: V3 = [to[0] + ox, to[1], to[2] + oz];
      const pos: V3 = [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p + arc * 4 * p * (1 - p), a[2] + (b[2] - a[2]) * p];
      const s = size * Math.min(1, p * 8, (1 - p) * 8);
      return (
        <mesh key={i} position={pos} rotation={[Math.PI / 2 + t * 4 + i, t * 3 + i * 0.7, 0]} scale={s / 0.35}>
          <CylG args={[0.35, 0.35, 0.08, 10]} />
          <Flat color="#E8C04A" />
        </mesh>
      );
    })}
  </group>
);

/** A heap of coins resting on a surface (top of the heap at y + h). */
export const CoinPile: React.FC<{ position: V3; r?: number; h?: number }> = ({ position, r = 1.2, h = 0.8 }) => (
  <group position={position}>
    <mesh position={[0, h * 0.42, 0]} scale={[1, h / r, 1]} castShadow>
      <IcoG args={[r, 1]} />
      <Flat color="#D9AE3A" />
    </mesh>
    {Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * r * 0.75, 0.05, Math.sin(a) * r * 0.75]} rotation={[0, a, 0.2]}>
          <CylG args={[0.3, 0.3, 0.07, 10]} />
          <Flat color="#E8C04A" />
        </mesh>
      );
    })}
  </group>
);

// ================================================================ corporate tower

const CORP_RED = "#E8344A";

/** Draws the generic corporate logo (a hexagon ring around a dot): no text, no real brand. */
const drawLogo = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0B0D16";
  ctx.fillRect(0, 0, W, H);
  const r = Math.min(W, H) * 0.36;
  ctx.strokeStyle = CORP_RED;
  ctx.lineWidth = r * 0.22;
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const x = W / 2 + Math.cos(a) * r;
    const y = H / 2 + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = CORP_RED;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
};

/** A giant dark corporate tower with red light strips and a logo near the top. Base on y = 0. */
export const MegaTower: React.FC<{ position: V3; h?: number; w?: number; t?: number; seed?: string }> = ({ position, h = 90, w = 16, t = 0, seed = "mega" }) => {
  const body = "#141826";
  const crownH = h * 0.12;
  const baseH = h * 0.1;
  const blink = Math.floor(t * 1.4 + random(seed) * 2) % 2 === 0;
  return (
    <group position={position}>
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
        <BoxG args={[w * 1.35, baseH, w * 1.35]} />
        <Flat color="#1B2030" />
      </mesh>
      <mesh position={[0, baseH + (h - baseH - crownH) / 2, 0]} castShadow receiveShadow>
        <BoxG args={[w, h - baseH - crownH, w]} />
        <Flat color={body} />
      </mesh>
      <mesh position={[0, h - crownH / 2, 0]} castShadow>
        <BoxG args={[w * 0.72, crownH, w * 0.72]} />
        <Flat color={body} />
      </mesh>
      <mesh position={[0, h + 6, 0]}>
        <CylG args={[0.15, 0.4, 12, 6]} />
        <Flat color="#2B2F3E" />
      </mesh>
      <mesh position={[0, h + 12.2, 0]}>
        <IcoG args={[0.6, 1]} />
        <Glow color={blink ? "#FF4040" : "#401010"} fog={false} />
      </mesh>
      {/* vertical light strips on all four faces */}
      {[0, 1, 2, 3].map((f) => (
        <group key={f} rotation={[0, (f * Math.PI) / 2, 0]}>
          {[-0.36, 0, 0.36].map((x) => (
            <mesh key={x} position={[x * w, baseH + (h - baseH - crownH) / 2, w / 2 + 0.02]}>
              <planeGeometry args={[0.35, h - baseH - crownH - 4]} />
              <Glow color={CORP_RED} />
            </mesh>
          ))}
          {/* a few lit floors */}
          {Array.from({ length: 10 }, (_, i) => {
            const y = baseH + 3 + i * ((h - baseH - crownH - 6) / 10);
            return random(`${seed}f${f}${i}`) < 0.35 ? (
              <mesh key={`w${i}`} position={[-0.18 * w, y, w / 2 + 0.03]}>
                <planeGeometry args={[w * 0.28, 0.5]} />
                <Glow color="#E8C8C8" opacity={0.85} />
              </mesh>
            ) : null;
          })}
          <CanvasPanel position={[0, h - crownH / 2, w * 0.36 + 0.03]} w={w * 0.5} h={w * 0.5} px={512} draw={drawLogo} />
        </group>
      ))}
    </group>
  );
};

// ================================================================ houses, stall, park, beach

/** A small house (walls 6 tall, pyramid roof). `build` < 1 leaves the roof off with scaffolding. */
export const House: React.FC<{ position: V3; yaw?: number; color?: string; roof?: string; lit?: boolean; build?: number; scale?: number }> = ({
  position,
  yaw = 0,
  color = "#E8DCC4",
  roof = "#C8372D",
  lit = true,
  build = 1,
  scale = 1,
}) => (
  <group position={position} rotation={[0, yaw, 0]} scale={scale}>
    <mesh position={[0, 3, 0]} castShadow receiveShadow>
      <BoxG args={[7, 6, 7]} />
      <Flat color={color} />
    </mesh>
    {build >= 1 ? (
      <mesh position={[0, 6 + 1.8, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <ConeG args={[5.6, 3.6, 4]} />
        <Flat color={roof} />
      </mesh>
    ) : (
      <>
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => (
            <mesh key={`${sx}${sz}`} position={[sx * 3.8, 4, sz * 3.8]}>
              <BoxG args={[0.16, 8, 0.16]} />
              <Flat color="#8A8E98" />
            </mesh>
          )),
        )}
        <mesh position={[0, 6.1, 0]}>
          <BoxG args={[7.2, 0.2, 7.2]} />
          <Flat color="#B8AE98" />
        </mesh>
      </>
    )}
    <mesh position={[0, 1.7, 3.51]}>
      <planeGeometry args={[1.6, 3.4]} />
      <Flat color="#5A3E2E" />
    </mesh>
    {[-2.3, 2.3].map((x) => (
      <mesh key={x} position={[x, 3.8, 3.51]}>
        <planeGeometry args={[1.5, 1.4]} />
        {lit ? <Glow color={P.windowLit} /> : <Flat color={P.windowUnlit} />}
      </mesh>
    ))}
  </group>
);

/** A street food stall: counter (top 2.0), striped awning on posts, a sign board on top. Front faces +Z. */
export const STALL = { w: 6.4, counterTop: 2.0, counterZ: 1.2, awningY: 5.6 };
export const Stall: React.FC<{ position: V3; yaw?: number; name?: string; open?: number }> = ({ position, yaw = 0, name = "SLAVOSKI'S", open = 1 }) => {
  const W = STALL.w;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, STALL.counterTop / 2, STALL.counterZ]} castShadow receiveShadow>
        <BoxG args={[W, STALL.counterTop, 1.4]} />
        <Flat color="#2E5A6A" />
      </mesh>
      <mesh position={[0, STALL.counterTop + 0.06, STALL.counterZ + 0.1]} castShadow>
        <BoxG args={[W + 0.3, 0.12, 1.7]} />
        <Flat color="#E8E4DA" />
      </mesh>
      {/* back wall */}
      <mesh position={[0, 3.3, -2.2]} castShadow receiveShadow>
        <BoxG args={[W, 6.6, 0.3]} />
        <Flat color="#5A4A78" />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [STALL.counterZ + 0.6, -2.0].map((z) => (
          <mesh key={`${sx}${z}`} position={[sx * (W / 2 - 0.12), STALL.awningY / 2, z]} castShadow>
            <BoxG args={[0.18, STALL.awningY, 0.18]} />
            <Flat color="#E8E4DA" />
          </mesh>
        )),
      )}
      {/* striped awning, tilted down toward the customer */}
      <group position={[0, STALL.awningY + 0.2, -0.2]} rotation={[0.18, 0, 0]}>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[-W / 2 + (W / 8) * (i + 0.5), 0, 0]} castShadow>
            <BoxG args={[W / 8, 0.16, 4.6]} />
            <Flat color={i % 2 ? "#F2EEE6" : "#C8372D"} />
          </mesh>
        ))}
      </group>
      <CanvasPanel
        position={[0, STALL.awningY + 1.55, 0.55]}
        w={W * 0.86}
        h={1.5}
        draw={(ctx, w, h) => {
          ctx.fillStyle = "#1D274B";
          ctx.fillRect(0, 0, w, h);
          fitText(ctx, name, w / 2, h / 2 + h * 0.04, w * 0.9, h * 0.66, P.amber);
        }}
      />
      {/* goods on the counter at the +x end, the till at the -x end */}
      {[1.4, 2.0, 2.6].map((x, i) => (
        <mesh key={x} position={[x, STALL.counterTop + 0.12 + 0.3, STALL.counterZ + 0.3]} castShadow>
          <CylG args={[0.2, 0.16, 0.6, 8]} />
          <Flat color={["#E8E4DA", "#24748F", "#E8E4DA"][i]} />
        </mesh>
      ))}
      <mesh position={[-2.5, STALL.counterTop + 0.12 + 0.35, STALL.counterZ + 0.2]} castShadow>
        <BoxG args={[0.9, 0.7, 0.7]} />
        <Flat color="#2B2F3E" />
      </mesh>
      {open > 0 ? (
        <mesh position={[-2.5, STALL.counterTop + 0.12 + 0.48, STALL.counterZ + 0.56]}>
          <planeGeometry args={[0.6, 0.3]} />
          <Glow color="#7FD6A0" />
        </mesh>
      ) : null}
    </group>
  );
};

/** Picnic blanket (two-colour check), lying flat. */
export const Blanket: React.FC<{ position: V3; w?: number; d?: number; yaw?: number }> = ({ position, w = 5, d = 4, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    {Array.from({ length: 5 }, (_, i) =>
      Array.from({ length: 4 }, (_, j) => (
        <mesh key={`${i}${j}`} position={[-w / 2 + (w / 5) * (i + 0.5), 0.02, -d / 2 + (d / 4) * (j + 0.5)]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[w / 5, d / 4]} />
          <Flat color={(i + j) % 2 ? "#C8372D" : "#F2EEE6"} />
        </mesh>
      )),
    )}
  </group>
);

/** Suitcase standing on its end (base on y = 0), front toward +Z. */
export const Suitcase: React.FC<{ position: V3; yaw?: number; color?: string }> = ({ position, yaw = 0, color = "#24748F" }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.95, 0]} castShadow>
      <BoxG args={[1.3, 1.7, 0.6]} />
      <Flat color={color} />
    </mesh>
    <mesh position={[0, 2.0, 0]}>
      <BoxG args={[0.5, 0.12, 0.12]} />
      <Flat color="#2B2F3E" />
    </mesh>
    {[-0.4, 0.4].map((x) => (
      <mesh key={x} position={[x, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <CylG args={[0.1, 0.1, 0.12, 8]} />
        <Flat color="#17181E" />
      </mesh>
    ))}
  </group>
);

/** Beach: sand, sea with a foam line, a low sun disc on the horizon. */
export const Beach: React.FC = () => (
  <group>
    <mesh position={[0, -0.05, 20]} receiveShadow>
      <BoxG args={[400, 0.1, 80]} />
      <Flat color="#D9C08A" />
    </mesh>
    <mesh position={[0, -0.12, -140]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[600, 240]} />
      <Flat color="#1E6FA8" />
    </mesh>
    {[-20.2, -24, -30].map((z, i) => (
      <mesh key={z} position={[0, -0.03 - i * 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[400, 0.6 - i * 0.15]} />
        <Glow color={P.waterFoam} opacity={0.85 - i * 0.2} />
      </mesh>
    ))}
    <mesh position={[30, 22, -400]}>
      <circleGeometry args={[26, 12]} />
      <Glow color="#FFD08A" fog={false} />
    </mesh>
  </group>
);

/** Distant hills, a soft ring of faceted bumps (park and suburb backdrops). */
export const HillRing: React.FC<{ radius?: number; count?: number; color?: string; seed?: string; y?: number }> = ({ radius = 160, count = 18, color = "#3E6B4A", seed = "hill", y = -2 }) => (
  <group>
    {Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2;
      const r = radius * (0.9 + random(`${seed}r${i}`) * 0.2);
      const s = 28 + random(`${seed}s${i}`) * 30;
      return (
        <mesh key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r]} scale={[1, 0.45 + random(`${seed}h${i}`) * 0.3, 1]}>
          <IcoG args={[s, 1]} />
          <Flat color={color} />
        </mesh>
      );
    })}
  </group>
);

// ================================================================ closed factory gate, queue

/** Factory exterior with a saw-tooth roof, a fence along z = 0 and a closed gate at x = 0. */
export const FENCE_Z = 0;
export const ClosedFactory: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <mesh position={[0, 9, -30]} castShadow receiveShadow>
      <BoxG args={[70, 18, 26]} />
      <Flat color="#566270" />
    </mesh>
    {Array.from({ length: 7 }, (_, i) => (
      <mesh key={i} position={[-30 + i * 10, 20.5, -30]} rotation={[0, 0, 0.6]} castShadow>
        <BoxG args={[7.5, 0.6, 26]} />
        <Flat color="#3A3F55" />
      </mesh>
    ))}
    {[-22, -14].map((x, i) => (
      <group key={x}>
        <mesh position={[x, 28, -36]} castShadow>
          <CylG args={[1.4, 1.8, 20, 10]} />
          <Flat color="#8A6A5A" />
        </mesh>
        <mesh position={[x + Math.sin(t + i) * 0.4, 40 + ((t * 2 + i * 3) % 6), -36]} scale={1 + ((t * 0.6 + i) % 1)}>
          <IcoG args={[2.2, 1]} />
          <Flat color="#B8B4BE" opacity={0.6} />
        </mesh>
      </group>
    ))}
    {/* loading door, lit inside: robots at work */}
    <mesh position={[0, 6, -16.9]}>
      <planeGeometry args={[16, 12]} />
      <Glow color="#F2D49A" />
    </mesh>
    <Robot position={[-4, 0, -18.5]} walk={t * 0.9} yaw={Math.PI / 2} />
    <Robot position={[3.5, 0, -18.2]} l={[1.1, 0.1, 0.6]} r={[1.1, 0.1, 0.6]} yaw={-0.4} />
    {/* yard */}
    <mesh position={[0, 0.005, -8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[90, 16]} />
      <Flat color="#3A3F55" />
    </mesh>
    {/* fence: posts, rails, see-through mesh; the gate in the middle is shut */}
    {Array.from({ length: 21 }, (_, i) => {
      const x = -50 + i * 5;
      return (
        <mesh key={i} position={[x, 3.2, FENCE_Z]} castShadow>
          <BoxG args={[0.25, 6.4, 0.25]} />
          <Flat color="#5A6070" />
        </mesh>
      );
    })}
    {[6.3, 0.4].map((y) => (
      <mesh key={y} position={[0, y, FENCE_Z]}>
        <BoxG args={[100, 0.14, 0.14]} />
        <Flat color="#5A6070" />
      </mesh>
    ))}
    <mesh position={[0, 3.3, FENCE_Z]}>
      <planeGeometry args={[100, 6]} />
      <meshLambertMaterial color="#9AA1B0" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
    <mesh position={[0, 3.3, FENCE_Z + 0.1]}>
      <BoxG args={[9.6, 6.4, 0.1]} />
      <Flat color="#3A3F4E" opacity={0.5} />
    </mesh>
    <mesh position={[0, 3.3, FENCE_Z + 0.2]} rotation={[0, 0, 0.6]}>
      <BoxG args={[0.3, 11.5, 0.12]} />
      <Flat color="#C8372D" />
    </mesh>
    <CanvasPanel
      position={[0, 4.3, FENCE_Z + 0.3]}
      w={6.4}
      h={2.6}
      draw={(ctx, w, h) => {
        ctx.fillStyle = "#F2EEE6";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#C8372D";
        ctx.fillRect(0, 0, w, h * 0.44);
        fitText(ctx, "CLOSED", w / 2, h * 0.23, w * 0.8, h * 0.34, "#FFFFFF");
        fitText(ctx, "FULLY AUTOMATED", w / 2, h * 0.7, w * 0.86, h * 0.26, "#1D274B");
      }}
    />
    <CanvasPanel
      position={[-17.5, 4.3, FENCE_Z + 0.15]}
      w={6.4}
      h={2.6}
      draw={(ctx, w, h) => {
        ctx.fillStyle = "#F2EEE6";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#C8372D";
        ctx.fillRect(0, 0, w, h * 0.44);
        fitText(ctx, "NO HIRING", w / 2, h * 0.23, w * 0.8, h * 0.34, "#FFFFFF");
        fitText(ctx, "FULLY AUTOMATED", w / 2, h * 0.7, w * 0.86, h * 0.26, "#1D274B");
      }}
    />
  </group>
);

// ================================================================ clinic, scale

/** A bright clinic room: floor, back and side walls, an exam bench (top 1.6) at the origin. */
export const BENCH = { top: 1.6, x: 0, z: 0, w: 5, d: 2 };
export const Clinic: React.FC = () => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[30, 0.1, 30]} />
      <Flat color="#C9D2DE" />
    </mesh>
    <mesh position={[0, 7, -5]} receiveShadow>
      <BoxG args={[30, 14, 0.3]} />
      <Flat color="#E8EEF5" />
    </mesh>
    <mesh position={[-9, 7, 4]} receiveShadow>
      <BoxG args={[0.3, 14, 18]} />
      <Flat color="#DCE4EE" />
    </mesh>
    {[-6, 6].map((x) => (
      <mesh key={x} position={[x, 13.6, 0]}>
        <BoxG args={[3.6, 0.2, 1.2]} />
        <Glow color="#F4F8FF" />
      </mesh>
    ))}
    <mesh position={[BENCH.x, BENCH.top / 2 - 0.15, BENCH.z]} castShadow receiveShadow>
      <BoxG args={[BENCH.w - 0.4, BENCH.top - 0.3, BENCH.d - 0.4]} />
      <Flat color="#8E96A6" />
    </mesh>
    <mesh position={[BENCH.x, BENCH.top - 0.15, BENCH.z]} castShadow receiveShadow>
      <BoxG args={[BENCH.w, 0.3, BENCH.d]} />
      <Flat color="#3FA7B5" />
    </mesh>
    {/* green medical cross on the wall */}
    <mesh position={[-4.6, 9.4, -4.84]}>
      <planeGeometry args={[2.6, 0.8]} />
      <Glow color="#45C77A" />
    </mesh>
    <mesh position={[-4.6, 9.4, -4.83]}>
      <planeGeometry args={[0.8, 2.6]} />
      <Glow color="#45C77A" />
    </mesh>
    {/* a plant in the corner */}
    <mesh position={[7.6, 0.8, -3.6]} castShadow>
      <CylG args={[0.7, 0.55, 1.6, 8]} />
      <Flat color="#E8E4DA" />
    </mesh>
    <mesh position={[7.6, 2.6, -3.6]} castShadow>
      <IcoG args={[1.3, 1]} />
      <Flat color={P.leaf} />
    </mesh>
  </group>
);

/** A horizontal scan ring of radius r at height y (green), for the robot doctor. */
export const ScanHoop: React.FC<{ position: V3; r: number; color?: string; opacity?: number }> = ({ position, r, color = "#45E08A", opacity = 0.9 }) => (
  <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
    <torusGeometry args={[r, 0.06, 4, 48]} />
    <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} />
  </mesh>
);

/**
 * A golden balance: post (pivot at y = 12), beam ±7 tilted by `tilt` (+ lowers the left pan), pans hanging
 * 5 below the beam ends. `left` and `right` render on top of each pan (pan top is y = 0 in their space).
 */
export const BALANCE = { pivot: 11, arm: 5.6, drop: 4.4, panR: 2.4 };
export const Balance: React.FC<{ tilt: number; left?: React.ReactNode; right?: React.ReactNode }> = ({ tilt, left, right }) => {
  const G = "#D9AE3A";
  const end = (s: number): V3 => [s * BALANCE.arm * Math.cos(tilt), BALANCE.pivot - s * BALANCE.arm * Math.sin(tilt), 0];
  const pan = (s: number, content: React.ReactNode) => {
    const e = end(s);
    const py = e[1] - BALANCE.drop;
    return (
      <group key={s}>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2;
          return <Strut key={i} a={e} b={[e[0] + Math.cos(a) * BALANCE.panR * 0.9, py + 0.15, Math.sin(a) * BALANCE.panR * 0.9]} w={0.05} color="#8A7030" />;
        })}
        <mesh position={[e[0], py, 0]} castShadow receiveShadow>
          <CylG args={[BALANCE.panR, BALANCE.panR * 0.8, 0.3, 14]} />
          <Flat color={G} />
        </mesh>
        <group position={[e[0], py + 0.15, 0]}>{content}</group>
      </group>
    );
  };
  return (
    <group>
      <mesh position={[0, 0.3, 0]} castShadow>
        <CylG args={[2.6, 3.0, 0.6, 12]} />
        <Flat color={G} />
      </mesh>
      <mesh position={[0, BALANCE.pivot / 2, 0]} castShadow>
        <CylG args={[0.35, 0.5, BALANCE.pivot, 8]} />
        <Flat color={G} />
      </mesh>
      <mesh position={[0, BALANCE.pivot, 0]}>
        <IcoG args={[0.7, 1]} />
        <Flat color={G} />
      </mesh>
      <mesh position={[0, BALANCE.pivot, 0]} rotation={[0, 0, -tilt]} castShadow>
        <BoxG args={[BALANCE.arm * 2 + 0.6, 0.45, 0.45]} />
        <Flat color={G} />
      </mesh>
      {pan(-1, left)}
      {pan(1, right)}
    </group>
  );
};

// ================================================================ office

/** Office corner: carpet, back wall at z = -3 with a sign panel and a clock, cubicle partitions, desk (top 1.5). */
export const DESK = { top: 1.5, z: 1.5, x: 0, w: 4.4, d: 1.6 };
export const Office: React.FC<{ cross: number; t: number }> = ({ cross, t }) => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[30, 0.1, 30]} />
      <Flat color="#4A5468" />
    </mesh>
    <mesh position={[0, 6, -3.2]} receiveShadow>
      <BoxG args={[30, 12, 0.3]} />
      <Flat color="#7A8294" />
    </mesh>
    {/* partitions */}
    {[-3.6, 3.6].map((x) => (
      <mesh key={x} position={[x, 1.7, -0.6]} castShadow receiveShadow>
        <BoxG args={[0.2, 3.4, 4.6]} />
        <Flat color="#5A6478" />
      </mesh>
    ))}
    {/* other desks fading off to the sides (empty chairs, monitors) */}
    {[-8.5, 8.5].map((x) => (
      <group key={x} position={[x, 0, 0.6]}>
        <mesh position={[0, DESK.top - 0.06, 0]} castShadow>
          <BoxG args={[3.6, 0.12, 1.6]} />
          <Flat color="#C9C2B4" />
        </mesh>
        <mesh position={[0, DESK.top + 0.7, -0.4]} castShadow>
          <BoxG args={[1.6, 1.0, 0.12]} />
          <Flat color="#17181E" />
        </mesh>
        <mesh position={[0, (DESK.top - 0.12) / 2, 0]}>
          <BoxG args={[3.4, DESK.top - 0.12, 0.1]} />
          <Flat color="#5A6478" />
        </mesh>
      </group>
    ))}
    {/* the desk */}
    <mesh position={[DESK.x, DESK.top - 0.06, DESK.z]} castShadow receiveShadow>
      <BoxG args={[DESK.w, 0.12, DESK.d]} />
      <Flat color="#C9C2B4" />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[DESK.x + s * (DESK.w / 2 - 0.15), (DESK.top - 0.12) / 2, DESK.z]} castShadow>
        <BoxG args={[0.12, DESK.top - 0.12, DESK.d - 0.1]} />
        <Flat color="#8E8A84" />
      </mesh>
    ))}
    {/* monitor at the right end, turned toward the chair */}
    <group position={[DESK.x + 1.6, DESK.top, DESK.z + 0.1]} rotation={[0, Math.PI + 0.7, 0]}>
      <mesh position={[0, 0.35, 0]}>
        <BoxG args={[0.12, 0.7, 0.12]} />
        <Flat color="#2B2F3E" />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <BoxG args={[1.7, 1.05, 0.1]} />
        <Flat color="#17181E" />
      </mesh>
      <mesh position={[0, 1.15, 0.055]}>
        <planeGeometry args={[1.56, 0.92]} />
        <Glow color="#9FC4E8" />
      </mesh>
    </group>
    {/* a stack of papers and a mug on the left */}
    <mesh position={[DESK.x - 1.5, DESK.top + 0.15, DESK.z + 0.2]} castShadow>
      <BoxG args={[0.9, 0.3, 0.7]} />
      <Flat color="#F2EEE6" />
    </mesh>
    <mesh position={[DESK.x - 0.85, DESK.top + 0.2, DESK.z + 0.35]} castShadow>
      <CylG args={[0.16, 0.14, 0.4, 8]} />
      <Flat color="#C8372D" />
    </mesh>
    {/* sign on the back wall: "9 TO 5", crossed out by `cross` (0..1) */}
    <CanvasPanel
      position={[0, 6.4, -3.03]}
      w={5.4}
      h={2.2}
      draw={(ctx, w, h) => {
        ctx.fillStyle = "#1D274B";
        ctx.fillRect(0, 0, w, h);
        fitText(ctx, "9 TO 5", w / 2, h / 2 + h * 0.04, w * 0.84, h * 0.66, "#F2EEE6");
        if (cross > 0) {
          ctx.strokeStyle = "#FF3A2A";
          ctx.lineCap = "round";
          ctx.lineWidth = h * 0.12;
          const k1 = clamp01(cross * 2);
          const k2 = clamp01(cross * 2 - 1);
          ctx.beginPath();
          ctx.moveTo(w * 0.12, h * 0.15);
          ctx.lineTo(w * (0.12 + 0.76 * k1), h * (0.15 + 0.7 * k1));
          if (k2 > 0) {
            ctx.moveTo(w * 0.88, h * 0.15);
            ctx.lineTo(w * (0.88 - 0.76 * k2), h * (0.15 + 0.7 * k2));
          }
          ctx.stroke();
        }
      }}
    />
    {/* wall clock */}
    <group position={[-5.2, 6.6, -3.02]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <CylG args={[0.9, 0.9, 0.12, 14]} />
        <Flat color="#F2EEE6" />
      </mesh>
      <mesh position={[0, 0, 0.08]} rotation={[0, 0, -t * 2]}>
        <planeGeometry args={[0.07, 1.2]} />
        <Flat color="#17181E" />
      </mesh>
      <mesh position={[0, 0, 0.09]} rotation={[0, 0, -0.9]}>
        <planeGeometry args={[0.1, 0.8]} />
        <Flat color="#17181E" />
      </mesh>
    </group>
    {/* ceiling light panels */}
    {[-4, 4].map((x) => (
      <mesh key={x} position={[x, 9.8, 1]}>
        <BoxG args={[3, 0.1, 1.2]} />
        <Glow color="#E8EEF5" />
      </mesh>
    ))}
  </group>
);

// ================================================================ HTML overlays

/** Big "WELCOME TO 2036" stamp that slams in at a chapter start (like ep. 5's DayStamp). */
export const YearStamp: React.FC<{ year: string; lt: number; label?: string }> = ({ year, lt, label = "WELCOME TO" }) => {
  if (lt > 1.6 || lt < 0) return null;
  const inK = clamp01(lt / 0.12);
  const out = clamp01((lt - 1.3) / 0.3);
  const scale = 1.25 - 0.25 * inK;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontFamily: FONT, opacity: inK * (1 - out), transform: `scale(${scale})`, transformOrigin: "50% 0", pointerEvents: "none" }}>
      <div style={{ display: "inline-block", padding: "10px 44px 12px", background: "rgba(8,8,14,0.72)", border: `4px solid ${P.amber}` }}>
        <div style={{ fontSize: 24, letterSpacing: "0.34em", color: "rgba(255,255,255,0.75)" }}>{label}</div>
        <div style={{ fontWeight: 700, fontSize: 110, lineHeight: 1, color: P.amber }}>{year}</div>
      </div>
    </div>
  );
};

/** Phone UI: an incoming payment (generic, no real bank or OS). */
export const PayScreen: React.FC<{ w: number; h: number; k: number }> = ({ w, h, k }) => (
  <div style={{ width: w, height: h, background: "linear-gradient(180deg, #145A3A 0%, #0B2A1E 100%)", fontFamily: FONT, color: "#FFF", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: w * 0.08, boxSizing: "border-box" }}>
    <div style={{ width: w * 0.3, height: w * 0.3, borderRadius: "50%", background: "#45E08A", color: "#0B2A1E", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: w * 0.2, marginBottom: h * 0.04, transform: `scale(${0.6 + 0.4 * k})` }}>✓</div>
    <div style={{ fontSize: w * 0.06, letterSpacing: "0.16em", opacity: 0.85, marginBottom: h * 0.025 }}>PAYMENT RECEIVED</div>
    <div style={{ fontWeight: 700, fontSize: w * 0.1, lineHeight: 1.15, whiteSpace: "pre-wrap" }}>{"UNIVERSAL\nHIGH INCOME"}</div>
    <div style={{ marginTop: h * 0.04, fontWeight: 700, fontSize: w * 0.15, color: "#7FFFB0", fontVariantNumeric: "tabular-nums" }}>+{Math.round(k * 5000).toLocaleString("en-US")}</div>
    <div style={{ fontSize: w * 0.05, opacity: 0.6, marginTop: h * 0.01 }}>EVERY MONTH</div>
  </div>
);

/** Phone UI: an endless help-centre queue. */
export const QueueScreen: React.FC<{ w: number; h: number; t: number }> = ({ w, h, t }) => {
  const n = 4812331 + Math.floor(t * 13);
  const dots = ".".repeat(1 + (Math.floor(t * 3) % 3));
  return (
    <div style={{ width: w, height: h, background: "#0E1018", fontFamily: FONT, color: "#E8E4DA", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: w * 0.08, boxSizing: "border-box" }}>
      <div style={{ fontSize: w * 0.06, letterSpacing: "0.16em", opacity: 0.7 }}>HELP CENTRE</div>
      <div style={{ marginTop: h * 0.04, fontSize: w * 0.075, fontWeight: 700 }}>YOU ARE NUMBER</div>
      <div style={{ marginTop: h * 0.015, fontSize: w * 0.13, fontWeight: 700, color: "#FF5A4A", fontVariantNumeric: "tabular-nums" }}>{n.toLocaleString("en-US")}</div>
      <div style={{ marginTop: h * 0.015, fontSize: w * 0.075, fontWeight: 700 }}>IN THE QUEUE</div>
      <div style={{ marginTop: h * 0.05, fontSize: w * 0.06, opacity: 0.6 }}>PLEASE WAIT{dots}</div>
    </div>
  );
};

/** HTML hologram text for the clinic panel (rendered with ScreenHtml). */
export const ScanReadout: React.FC<{ w: number; h: number; k: number }> = ({ w, h, k }) => (
  <div style={{ width: w, height: h, background: "rgba(10,60,40,0.55)", border: `${w * 0.012}px solid #45E08A`, boxSizing: "border-box", fontFamily: FONT, color: "#C8FFE0", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
    <div style={{ fontSize: w * 0.075, letterSpacing: "0.16em", opacity: 0.8 }}>{k < 1 ? `SCANNING ${Math.round(k * 100)}%` : "SCAN COMPLETE"}</div>
    <div style={{ marginTop: h * 0.06, fontWeight: 700, fontSize: w * 0.15, color: k < 1 ? "#C8FFE0" : "#45E08A" }}>{k < 1 ? "…" : "CURED ✓"}</div>
    <div style={{ marginTop: h * 0.04, fontSize: w * 0.065, opacity: 0.75 }}>COST: 0</div>
  </div>
);

/** Distant city skyline on a ring (behind beaches, parks and rooftops). */
export const Skyline: React.FC<{ radius?: number; count?: number; seed?: string; arc?: [number, number]; power?: number }> = ({ radius = 120, count = 26, seed = "sky", arc = [Math.PI * 0.7, Math.PI * 1.3], power = 1 }) => {
  const specs = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = arc[0] + ((arc[1] - arc[0]) * (i + random(`${seed}a${i}`) * 0.6)) / count;
        const r = radius * (0.92 + random(`${seed}r${i}`) * 0.16);
        return {
          i,
          pos: [Math.sin(a) * r, 0, Math.cos(a) * r] as V3,
          h: 14 + random(`${seed}h${i}`) * 36,
          w: 6 + random(`${seed}w${i}`) * 6,
          color: BUILDING_COLORS[Math.floor(random(`${seed}c${i}`) * BUILDING_COLORS.length)],
        };
      }),
    [radius, count, seed, arc],
  );
  return (
    <group>
      {specs.map((s) => (
        <Building key={s.i} position={s.pos} w={s.w} d={s.w} h={s.h} color={s.color} seed={`${seed}${s.i}`} power={power} />
      ))}
    </group>
  );
};

/** A canvas-drawn label in the house font (for CanvasPanel). */
export const drawSign = (text: string, bg: string, color: string, size = 0.6) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.font = CANVAS_FONT(H * size);
  fitText(ctx, text, W / 2, H / 2 + H * 0.04, W * 0.88, H * size, color);
};
