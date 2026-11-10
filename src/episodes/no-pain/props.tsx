/**
 * Props for "What If Every Human Lost the Ability to Feel Pain?" (ep. 10).
 * Non-graphic throughout: burns are a red glow, a fracture is a glowing crack on an X-ray bone,
 * an infection is a red glow with cartoon germs. Generic medical signs (a blue "H", a green cross).
 * All at hero scale (Slavoski is 4.2 tall).
 */
import React, { useMemo } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { BoxG, ConeG, CylG, IcoG } from "../../slavoski/detail";
import type { HeroLook } from "../../slavoski/hero";
import { crowdLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { LeafyTree } from "../../slavoski/nature";
import { clamp01, noise1, type V3 } from "../../slavoski/noise";
import { mix, P } from "../../slavoski/palette";
import { armJoints, headPosition, legJoints, type Pose } from "../../slavoski/rig/Hero";
import { CANVAS_FONT, CanvasPanel, fitText } from "../../slavoski/screens";
import { HillRing, Strut } from "../no-work-2036/props";

export const PAIN_ORANGE = "#FF8A3A";
export const NERVE = "#FFB050";

/** A white coat for doctors and scientists (on a crowd face). */
export const coatLook = (seed: number): HeroLook => ({ ...crowdLook(seed), jacket: "#EEF2F6", jacketShade: "#D4DAE2", zipper: "#B8C2CE", jeans: "#3A4A6A" });
/** Athletes: bright vests. */
export const athleteLook = (seed: number, vest: string): HeroLook => ({ ...crowdLook(seed), jacket: vest, jacketShade: mix(vest, "#000000", 0.2), zipper: "#FFFFFF", jeans: "#1A1A22", shoe: "#F4F4F0" });

// ---------------------------------------------------------------- the wall

/**
 * A plaster wall (faces +Z at z = 0, `w` wide, `h` tall) with a crack star growing from `hit` (x, y on the wall)
 * as `crack` goes 0..1, and plaster dust puffing out.
 */
export const PlasterWall: React.FC<{ hit: [number, number]; crack: number; t: number; w?: number; h?: number; color?: string }> = ({ hit, crack, t, w = 14, h = 8, color = "#C8C0D8" }) => {
  const rays = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + random(`cr${i}`) * 0.5;
        const len = 0.5 + random(`crl${i}`) * 0.7;
        const kink = (random(`crk${i}`) - 0.5) * 0.8;
        return { a, len, kink };
      }),
    [],
  );
  return (
    <group>
      <mesh position={[0, h / 2, -0.2]} receiveShadow>
        <BoxG args={[w, h, 0.4]} />
        <Flat color={color} />
      </mesh>
      <mesh position={[0, 0.25, 0.02]}>
        <BoxG args={[w, 0.5, 0.06]} />
        <Flat color="#E6DCCB" />
      </mesh>
      {crack > 0 ? (
        <group position={[hit[0], hit[1], 0.02]}>
          <mesh>
            <circleGeometry args={[0.32 * Math.min(1, crack * 2), 9]} />
            <Flat color="#8A8098" />
          </mesh>
          {rays.map((r, i) => {
            const L = r.len * clamp01(crack * 1.4 - i * 0.04);
            if (L <= 0.02) return null;
            const mid: V3 = [Math.cos(r.a) * L * 0.5, Math.sin(r.a) * L * 0.5, 0.01];
            const tip: V3 = [Math.cos(r.a + r.kink) * L, Math.sin(r.a + r.kink) * L, 0.01];
            return (
              <group key={i}>
                <Strut a={[0, 0, 0.01]} b={mid} w={0.035} d={0.005} color="#3A3448" />
                <Strut a={mid} b={tip} w={0.022} d={0.005} color="#3A3448" />
              </group>
            );
          })}
          {Array.from({ length: 10 }, (_, i) => {
            const k = clamp01(crack * 1.3 - 0.1);
            if (k <= 0) return null;
            const a = random(`du${i}`) * Math.PI * 2;
            const sp = 0.6 + random(`dus${i}`);
            return (
              <mesh key={i} position={[Math.cos(a) * k * sp, Math.sin(a) * k * sp * 0.6 - k * k * 1.2, 0.3 + k * 0.8]}>
                <IcoG args={[0.06 + random(`dur${i}`) * 0.06, 0]} />
                <Flat color="#E8E2EE" opacity={1 - k * 0.6} />
              </mesh>
            );
          })}
        </group>
      ) : null}
    </group>
  );
};

/** A simple room behind the hero: floor, the plaster wall, a side wall, a door frame and a picture. */
export const Hall: React.FC<{ crack: number; t: number; hit?: [number, number] }> = ({ crack, t, hit = [0.6, 3.4] }) => (
  <group>
    <mesh position={[0, -0.05, 6]} receiveShadow>
      <BoxG args={[16, 0.1, 16]} />
      <Flat color="#6A5040" />
    </mesh>
    <PlasterWall hit={hit} crack={crack} t={t} w={16} h={9} />
    <mesh position={[-8, 4.5, 6]} receiveShadow>
      <BoxG args={[0.3, 9, 16]} />
      <Flat color="#B8B0C8" />
    </mesh>
    <mesh position={[-5, 4.2, 0.03]}>
      <BoxG args={[2.2, 1.6, 0.06]} />
      <Flat color="#5A4030" />
    </mesh>
    <mesh position={[-5, 4.2, 0.07]}>
      <planeGeometry args={[1.9, 1.3]} />
      <Flat color="#2E5A6A" />
    </mesh>
    <mesh position={[5.6, 2.8, 0.02]}>
      <BoxG args={[2.6, 5.6, 0.1]} />
      <Flat color="#7A5A3E" />
    </mesh>
  </group>
);

// ---------------------------------------------------------------- nerves

/**
 * Glowing nerve paths over a (ghost) hero: fingertips → elbows → shoulders → spine → brain, and feet → knees →
 * hips → spine. Pulses run toward the brain while `on` is 1; at 0 the paths go dark grey.
 */
export const Nerves: React.FC<{ pose: Pose; position: V3; yaw?: number; t: number; on: number }> = ({ pose, position, yaw = 0, t, on }) => {
  const head = headPosition(pose, position, yaw);
  const spineTop: V3 = [head[0], head[1] - 1.0, head[2]];
  const hips: V3 = [position[0], position[1] + 1.55, position[2]];
  const paths: V3[][] = [];
  (["l", "r"] as const).forEach((s) => {
    const a = armJoints(pose, s, position, yaw);
    paths.push([a.hand, a.elbow, a.shoulder, spineTop, head]);
    const g = legJoints(pose, s, position, yaw);
    paths.push([g.ankle, g.knee, hips, spineTop]);
  });
  const color = mix("#3A3A44", NERVE, on);
  return (
    <group>
      {paths.map((pts, i) => (
        <group key={i}>
          {pts.slice(1).map((b, j) => (
            <Strut key={j} a={pts[j]} b={b} w={0.06} color={color} glow={on > 0.05} />
          ))}
          {on > 0.05
            ? [0, 1].map((k) => {
                const ph = (t * 0.9 + k * 0.5 + i * 0.13) % 1;
                const seg = Math.min(pts.length - 2, Math.floor(ph * (pts.length - 1)));
                const f = ph * (pts.length - 1) - seg;
                const A = pts[seg];
                const B = pts[seg + 1];
                const p: V3 = [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f];
                return (
                  <mesh key={k} position={p}>
                    <IcoG args={[0.11, 1]} />
                    <Glow color="#FFF2C8" opacity={on} />
                  </mesh>
                );
              })
            : null}
        </group>
      ))}
      <mesh position={[head[0], head[1] + 0.15, head[2] - 0.1]}>
        <IcoG args={[0.26, 1]} />
        <Glow color={mix("#2A2A34", "#FFC870", on)} opacity={0.5} />
      </mesh>
      {on > 0.05 ? <Halo position={head} size={2.2} color={NERVE} opacity={0.4 * on} /> : null}
    </group>
  );
};

/** X-ray bones of one leg (thigh and shin) for a hero pose, with a glowing crack on the shin when `fracture` > 0. */
export const LegBones: React.FC<{ pose: Pose; position: V3; yaw?: number; side?: "l" | "r"; fracture?: number; t?: number }> = ({ pose, position, yaw = 0, side = "r", fracture = 0, t = 0 }) => {
  const g = legJoints(pose, side, position, yaw);
  const hip: V3 = [position[0] + (side === "l" ? 0.3 : -0.3) * Math.cos(yaw), position[1] + pose.bob + 1.5, position[2] - (side === "l" ? 0.3 : -0.3) * Math.sin(yaw)];
  const mid: V3 = [(g.knee[0] + g.ankle[0]) / 2, (g.knee[1] + g.ankle[1]) / 2, (g.knee[2] + g.ankle[2]) / 2];
  return (
    <group>
      <Strut a={hip} b={g.knee} w={0.13} color="#F4F4F0" glow />
      <Strut a={g.knee} b={g.ankle} w={0.11} color="#F4F4F0" glow />
      {[hip, g.knee, g.ankle].map((p, i) => (
        <mesh key={i} position={p}>
          <IcoG args={[0.12, 1]} />
          <Glow color="#F4F4F0" />
        </mesh>
      ))}
      {fracture > 0 ? (
        <group position={mid}>
          <mesh rotation={[0, 0, 0.6]}>
            <boxGeometry args={[0.32 * fracture, 0.04, 0.16]} />
            <meshBasicMaterial color="#FF3A2A" toneMapped={false} />
          </mesh>
          <Halo size={1.1} color="#FF3A2A" opacity={0.6 * fracture * (0.7 + 0.3 * Math.sin(t * 10))} />
        </group>
      ) : null}
    </group>
  );
};

/** X-ray bones of one arm (upper arm and forearm), with a glowing crack on the forearm when `fracture` > 0. */
export const ArmBones: React.FC<{ pose: Pose; position: V3; yaw?: number; side?: "l" | "r"; fracture?: number; t?: number }> = ({ pose, position, yaw = 0, side = "l", fracture = 0, t = 0 }) => {
  const a = armJoints(pose, side, position, yaw);
  const mid: V3 = [(a.elbow[0] + a.hand[0]) / 2, (a.elbow[1] + a.hand[1]) / 2, (a.elbow[2] + a.hand[2]) / 2];
  return (
    <group>
      <Strut a={a.shoulder} b={a.elbow} w={0.11} color="#F4F4F0" glow />
      <Strut a={a.elbow} b={a.hand} w={0.09} color="#F4F4F0" glow />
      {[a.shoulder, a.elbow, a.hand].map((p, i) => (
        <mesh key={i} position={p}>
          <IcoG args={[0.11, 1]} />
          <Glow color="#F4F4F0" />
        </mesh>
      ))}
      {fracture > 0 ? (
        <group position={mid}>
          <mesh rotation={[0, 0, 0.9]}>
            <boxGeometry args={[0.3 * fracture, 0.04, 0.16]} />
            <meshBasicMaterial color="#FF3A2A" toneMapped={false} />
          </mesh>
          <Halo size={1.1} color="#FF3A2A" opacity={0.6 * fracture * (0.7 + 0.3 * Math.sin(t * 10))} />
        </group>
      ) : null}
    </group>
  );
};

// ---------------------------------------------------------------- kitchen

export const KITCHEN = { counterTop: 2.0, stove: [1.6, 0, -2.4] as V3, pan: [1.1, 0, -2.2] as V3, back: -3.6 };
/** A sunny kitchen: counters along the back wall, a stove with a hot pan, a window, cabinets, a fridge. */
export const Kitchen: React.FC<{ t: number; hot?: number }> = ({ t, hot = 1 }) => {
  const K = KITCHEN;
  return (
    <group>
      <mesh position={[0, -0.05, 2]} receiveShadow>
        <BoxG args={[22, 0.1, 14]} />
        <Flat color="#D8CDB8" />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[-9.6 + i * 2.75, 0.004, 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.04, 14]} />
          <Flat color="#C4B8A2" />
        </mesh>
      ))}
      <mesh position={[0, 4.5, K.back - 0.2]} receiveShadow>
        <BoxG args={[22, 9, 0.3]} />
        <Flat color="#E8DCB8" />
      </mesh>
      {/* window over the sink, sunny garden outside */}
      <mesh position={[-4.5, 4.6, K.back - 0.02]}>
        <planeGeometry args={[3.6, 2.4]} />
        <Glow color="#BFE3FF" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-4.5 + s * 1.85, 4.6, K.back]}>
          <BoxG args={[0.16, 2.6, 0.12]} />
          <Flat color="#FFFFFF" />
        </mesh>
      ))}
      <mesh position={[-4.5, 4.6, K.back]}>
        <BoxG args={[3.8, 0.14, 0.12]} />
        <Flat color="#FFFFFF" />
      </mesh>
      {/* counter run */}
      <mesh position={[-1.5, K.counterTop / 2 - 0.08, K.back + 0.75]} castShadow receiveShadow>
        <BoxG args={[15, K.counterTop - 0.16, 1.5]} />
        <Flat color="#2E5A6A" />
      </mesh>
      <mesh position={[-1.5, K.counterTop - 0.08, K.back + 0.8]} castShadow receiveShadow>
        <BoxG args={[15.2, 0.16, 1.7]} />
        <Flat color="#E8E4DA" />
      </mesh>
      {/* stove top with four burners */}
      <mesh position={[K.stove[0], K.counterTop + 0.02, K.stove[2]]}>
        <BoxG args={[2.2, 0.06, 1.4]} />
        <Flat color="#1A1A20" />
      </mesh>
      {[
        [-0.5, -0.3],
        [0.5, -0.3],
        [-0.5, 0.3],
        [0.5, 0.3],
      ].map(([dx, dz], i) => (
        <mesh key={i} position={[K.stove[0] + dx, K.counterTop + 0.06, K.stove[2] + dz]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.18, 0.32, 16]} />
          <meshBasicMaterial color={i === 2 ? mix("#2A2A30", "#FF3A1A", hot) : "#2A2A30"} toneMapped={false} />
        </mesh>
      ))}
      {/* the pan (on the front-left burner), its handle sticking out toward +X */}
      <group position={[K.pan[0], K.counterTop + 0.08, K.pan[2]]}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <CylG args={[0.5, 0.42, 0.24, 14]} />
          <Flat color="#3A3C44" />
        </mesh>
        <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.46, 14]} />
          <meshBasicMaterial color={mix("#4A4C54", "#FF6A2A", hot * 0.6)} toneMapped={false} />
        </mesh>
        <mesh position={[0.85, 0.2, 0]} castShadow>
          <BoxG args={[0.8, 0.08, 0.14]} />
          <Flat color="#2A2A30" />
        </mesh>
        {hot > 0.3 ? <Halo position={[0, 0.2, 0]} size={1.8} color="#FF6A2A" opacity={0.3 * hot} /> : null}
        {hot > 0.3
          ? [0, 1, 2].map((i) => {
              const ph = (t * 0.7 + i / 3) % 1;
              return (
                <mesh key={i} position={[(random(`st${i}`) - 0.5) * 0.5, 0.3 + ph * 1.6, (random(`stz${i}`) - 0.5) * 0.4]}>
                  <IcoG args={[0.12 + ph * 0.18, 0]} />
                  <Flat color="#F4F4F8" opacity={0.6 * (1 - ph)} />
                </mesh>
              );
            })
          : null}
      </group>
      {/* wall cabinets, fridge, a plant */}
      {[-7, -4.5, -2, 4.5, 7].map((x) => (
        <mesh key={x} position={[x, 6.6, K.back + 0.4]} castShadow>
          <BoxG args={[2.3, 1.8, 0.8]} />
          <Flat color="#F2EEE6" />
        </mesh>
      ))}
      <mesh position={[8.6, 3.4, K.back + 1]} castShadow>
        <BoxG args={[2.2, 6.8, 2]} />
        <Flat color="#DDE4EC" />
      </mesh>
      <mesh position={[-7.5, K.counterTop + 0.4, K.back + 0.7]} castShadow>
        <CylG args={[0.35, 0.3, 0.7, 8]} />
        <Flat color="#B8643A" />
      </mesh>
      <mesh position={[-7.5, K.counterTop + 1.1, K.back + 0.7]} castShadow>
        <IcoG args={[0.6, 1]} />
        <Flat color={P.leaf} />
      </mesh>
      <mesh position={[0, 8.9, 2]}>
        <BoxG args={[22, 0.2, 14]} />
        <Flat color="#F2EEE6" />
      </mesh>
    </group>
  );
};

/** A red burn glow on a fist (non-graphic): grows with `k`, with steam. */
export const BurnGlow: React.FC<{ at: V3; k: number; t: number }> = ({ at, k, t }) =>
  k <= 0 ? null : (
    <group position={at}>
      <mesh>
        <IcoG args={[0.25, 2]} />
        <meshBasicMaterial color="#FF3A1A" transparent opacity={0.55 * k} toneMapped={false} depthWrite={false} />
      </mesh>
      <Halo size={1.2 * (0.5 + k)} color="#FF3A1A" opacity={0.6 * k} />
      {[0, 1].map((i) => {
        const ph = (t * 0.9 + i * 0.5) % 1;
        return (
          <mesh key={i} position={[0.1 * i, 0.2 + ph * 0.9, 0]}>
            <IcoG args={[0.07 + ph * 0.1, 0]} />
            <Flat color="#F4F4F8" opacity={0.5 * (1 - ph) * k} />
          </mesh>
        );
      })}
    </group>
  );

// ---------------------------------------------------------------- stadium

/** A floodlit athletics stadium: lanes along X at z ∈ [−6, 6], packed stands behind, light towers, a scoreboard. */
export const Stadium: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[400, 400]} />
      <Flat color="#3E7A44" />
    </mesh>
    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[300, 12]} />
      <Flat color="#B8503A" />
    </mesh>
    {Array.from({ length: 7 }, (_, i) => (
      <mesh key={i} position={[0, 0.02, -6 + i * 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[300, 0.08]} />
        <Flat color="#F4F0E8" />
      </mesh>
    ))}
    {/* stands: stepped tiers with a crowd of coloured heads */}
    {Array.from({ length: 8 }, (_, r) => (
      <group key={r}>
        <mesh position={[0, 0.9 + r * 1.3, -12 - r * 1.6]} receiveShadow>
          <BoxG args={[300, 1.8 + r * 2.6, 1.6]} />
          <Flat color={r % 2 ? "#3A4258" : "#444C64"} />
        </mesh>
        <Crowd row={r} t={t} />
      </group>
    ))}
    {[-60, -20, 20, 60].map((x) => (
      <group key={x} position={[x, 0, -30]}>
        <mesh position={[0, 16, 0]}>
          <CylG args={[0.5, 0.7, 32, 6]} />
          <Flat color="#5A6070" />
        </mesh>
        <mesh position={[0, 32.5, 0.6]}>
          <BoxG args={[6, 3, 0.6]} />
          <Glow color="#F4F8FF" />
        </mesh>
        <Halo position={[0, 32.5, 1.2]} size={22} color="#E8F0FF" opacity={0.5} />
      </group>
    ))}
    <CanvasPanel
      position={[30, 18, -27]}
      w={16}
      h={6}
      px={768}
      draw={(ctx, W, H) => {
        ctx.fillStyle = "#0E1018";
        ctx.fillRect(0, 0, W, H);
        fitText(ctx, "100 M FINAL", W / 2, H * 0.3, W * 0.9, H * 0.24, "#FFBA58");
        fitText(ctx, `${(9.6 + ((t * 0.6) % 0.3)).toFixed(2)}`, W / 2, H * 0.68, W * 0.8, H * 0.42, "#F4F8FF");
      }}
    />
  </group>
);

const Crowd: React.FC<{ row: number; t: number }> = ({ row, t }) => {
  const n = 80;
  const y = 0.9 + row * 1.3 + (1.8 + row * 2.6) / 2;
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const x = -120 + i * 3 + random(`cx${row}${i}`) * 1.4;
        const jump = Math.max(0, Math.sin(t * 6 + i * 0.7 + row)) * 0.25;
        return (
          <group key={i} position={[x, y + jump, -12 - row * 1.6]}>
            <mesh position={[0, 0.4, 0]}>
              <BoxG args={[1.0, 0.8, 0.6]} />
              <Flat color={["#C8372D", "#24748F", "#E8C84A", "#E8E4DA", "#5A4A78", "#2F7A5A"][(i + row) % 6]} />
            </mesh>
            <mesh position={[0, 1.1, 0]}>
              <IcoG args={[0.34, 0]} />
              <Flat color={["#C58B62", "#8A5A3A", "#E0B090", "#5A3A28"][(i * 3 + row) % 4]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// ---------------------------------------------------------------- playground

/** A playground: a climbing frame with a platform (top at y = 4) and a slide, swings, sand, trees. */
export const PLAY = { deck: [0, 4, 0] as V3 };
export const Playground: React.FC = () => (
  <group>
    <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[400, 400]} />
      <Flat color={P.grass} />
    </mesh>
    <mesh position={[0, 0.02, 1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[9, 18]} />
      <Flat color="#D8C08A" />
    </mesh>
    {/* climbing frame */}
    {[-1.5, 1.5].flatMap((x) =>
      [-1.5, 1.5].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 2.6, z]} castShadow>
          <CylG args={[0.12, 0.12, 5.2, 6]} />
          <Flat color="#C8372D" />
        </mesh>
      )),
    )}
    <mesh position={[0, 3.9, 0]} castShadow receiveShadow>
      <BoxG args={[3.4, 0.2, 3.4]} />
      <Flat color="#24748F" />
    </mesh>
    <mesh position={[0, 5.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
      <ConeG args={[2.6, 1.6, 4]} />
      <Flat color="#E8C84A" />
    </mesh>
    {/* slide down to +X */}
    <mesh position={[3.6, 2.0, 0]} rotation={[0, 0, -0.62]} castShadow>
      <BoxG args={[5.2, 0.15, 1.2]} />
      <Flat color="#E8C84A" />
    </mesh>
    {/* swing set to −X */}
    <group position={[-7, 0, -1]}>
      {[-2, 2].map((z) => (
        <Strut key={z} a={[0, 0, z]} b={[0, 5.5, z * 0.6]} w={0.18} color="#2E5A6A" />
      ))}
      <Strut a={[0, 5.5, -1.2]} b={[0, 5.5, 1.2]} w={0.18} color="#2E5A6A" />
    </group>
    {[-16, 14, -10, 18].map((x, i) => (
      <LeafyTree key={i} position={[x, 0, -10 - i * 2]} scale={3} seed={`pg${i}`} />
    ))}
    <HillRing radius={170} />
  </group>
);

/** A cartoon germ (green, spiky, with angry eyes). */
export const Germ: React.FC<{ position: V3; r?: number; t?: number; seed?: string }> = ({ position, r = 0.2, t = 0, seed = "g" }) => (
  <group position={position} rotation={[t * 0.8 + random(seed), t * 0.6, 0]}>
    <mesh>
      <IcoG args={[r, 1]} />
      <meshLambertMaterial color="#6AC84A" flatShading emissive="#3A8A2A" emissiveIntensity={0.4} />
    </mesh>
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      const b = (i % 2 ? 0.6 : -0.6);
      const d: V3 = [Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b)];
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...d));
      return (
        <mesh key={i} position={[d[0] * r, d[1] * r, d[2] * r]} quaternion={q}>
          <ConeG args={[r * 0.25, r * 0.6, 5]} />
          <Flat color="#4A9A3A" />
        </mesh>
      );
    })}
  </group>
);

/** The body's "dashboard": warning lights all dark, labelled; a needle sitting in the red. */
export const drawDash = (t: number, dead: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0E1016";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#2A2E3A";
  ctx.lineWidth = W * 0.015;
  ctx.strokeRect(W * 0.03, H * 0.02, W * 0.94, H * 0.96);
  fitText(ctx, "BODY WARNING", W / 2, H * 0.08, W * 0.85, H * 0.06, "#8A90A0", false);
  fitText(ctx, "LIGHTS", W / 2, H * 0.14, W * 0.85, H * 0.06, "#8A90A0", false);
  const labels = ["BURN", "BREAK", "INFECTION", "STRAIN"];
  labels.forEach((l, i) => {
    const cx = W * (i % 2 ? 0.7 : 0.3);
    const cy = H * (i < 2 ? 0.36 : 0.62);
    const flick = dead < 1 && Math.sin(t * 20 + i) > 0.6 ? 0.3 : 0;
    const on = Math.max(0, 1 - dead) * 0.8 + flick * (1 - dead);
    ctx.fillStyle = on > 0.1 ? `rgba(255,${80 + i * 30},40,${0.3 + on * 0.7})` : "#22242C";
    ctx.beginPath();
    ctx.arc(cx, cy, W * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#3A3E4A";
    ctx.lineWidth = W * 0.012;
    ctx.stroke();
    fitText(ctx, l, cx, cy + W * 0.19, W * 0.36, H * 0.04, "#6A7080", false);
  });
  fitText(ctx, dead > 0.5 ? "NO SIGNAL" : "", W / 2, H * 0.88, W * 0.8, H * 0.08, "#FF4A3A");
};

// ---------------------------------------------------------------- the condition

/** A DNA double helix along Y; rung `glow` (index) lights amber (the gene behind the condition). */
export const DnaHelix: React.FC<{ position: V3; t: number; glow?: number; height?: number }> = ({ position, t, glow = 9, height = 12 }) => {
  const n = 22;
  return (
    <group position={position} rotation={[0, t * 0.5, 0]}>
      {Array.from({ length: n }, (_, i) => {
        const y = -height / 2 + (i / (n - 1)) * height;
        const a = i * 0.55;
        const pA: V3 = [Math.cos(a) * 1.4, y, Math.sin(a) * 1.4];
        const pB: V3 = [-pA[0], y, -pA[2]];
        const hot = i === glow;
        return (
          <group key={i}>
            <mesh position={pA}>
              <IcoG args={[0.26, 1]} />
              <Flat color="#4F86D9" />
            </mesh>
            <mesh position={pB}>
              <IcoG args={[0.26, 1]} />
              <Flat color="#C85A8A" />
            </mesh>
            <Strut a={pA} b={pB} w={hot ? 0.18 : 0.1} color={hot ? "#FFBA58" : "#C8D0E0"} glow={hot} />
            {hot ? <Halo position={[0, y, 0]} size={4} color="#FFBA58" opacity={0.6} /> : null}
          </group>
        );
      })}
    </group>
  );
};

/** A big wall chart about the condition (a real, occludable panel). */
export const drawChart = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#F4F6FA";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#2E5A6A";
  ctx.fillRect(0, 0, W, H * 0.16);
  fitText(ctx, "RARE GENETIC CONDITION", W / 2, H * 0.08, W * 0.9, H * 0.09, "#FFFFFF");
  fitText(ctx, "CONGENITAL", W / 2, H * 0.3, W * 0.9, H * 0.12, "#1A2238");
  fitText(ctx, "INSENSITIVITY", W / 2, H * 0.44, W * 0.9, H * 0.12, "#1A2238");
  fitText(ctx, "TO PAIN", W / 2, H * 0.58, W * 0.9, H * 0.12, "#C8372D");
  ctx.font = CANVAS_FONT(H * 0.045, false);
  ctx.fillStyle = "#4A5468";
  ctx.textAlign = "center";
  ["NERVES DON'T SEND PAIN SIGNALS", "INJURIES GO UNNOTICED", "DAILY BODY CHECKS NEEDED"].forEach((l, i) => ctx.fillText(l, W / 2, H * (0.74 + i * 0.075)));
};

/** A bathroom: tiled wall, a mirror (a pale "reflection" plane with a reflected figure drawn by the shot), sink. */
export const MIRROR = { c: [0, 4.2, -2.9] as V3, w: 3.2, h: 4.2 };
export const Bathroom: React.FC = () => (
  <group>
    <mesh position={[0, -0.05, 2]} receiveShadow>
      <BoxG args={[16, 0.1, 12]} />
      <Flat color="#C8D8E0" />
    </mesh>
    <mesh position={[0, 4.5, -3.2]} receiveShadow>
      <BoxG args={[16, 9, 0.3]} />
      <Flat color="#DCEAF0" />
    </mesh>
    {Array.from({ length: 12 }, (_, i) => (
      <mesh key={i} position={[-7.5 + i * 1.35, 4.5, -3.04]}>
        <planeGeometry args={[0.03, 9]} />
        <Flat color="#B8CCD6" />
      </mesh>
    ))}
    <mesh position={[MIRROR.c[0], MIRROR.c[1], MIRROR.c[2] - 0.08]}>
      <BoxG args={[MIRROR.w + 0.3, MIRROR.h + 0.3, 0.1]} />
      <Flat color="#8A9AA6" />
    </mesh>
    <mesh position={[0, 1.4, -2.5]} castShadow>
      <BoxG args={[2.6, 0.3, 1.2]} />
      <Flat color="#F4F6F8" />
    </mesh>
    <mesh position={[0, 0.7, -2.6]}>
      <BoxG args={[0.6, 1.2, 0.6]} />
      <Flat color="#E8ECF0" />
    </mesh>
    <mesh position={[-6.8, 4.5, 2]}>
      <BoxG args={[0.3, 9, 12]} />
      <Flat color="#D0E0E8" />
    </mesh>
  </group>
);

// ---------------------------------------------------------------- hospitals

/** An ambulance (generic: white van, green and yellow check band, blue light bar), facing +Z. */
export const Ambulance: React.FC<{ position: V3; yaw?: number; t: number }> = ({ position, yaw = 0, t }) => {
  const blink = Math.floor(t * 5) % 2 === 0;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, 1.9, -0.6]} castShadow>
        <BoxG args={[2.6, 2.8, 5.2]} />
        <Flat color="#F4F4F0" />
      </mesh>
      <mesh position={[0, 1.4, 2.6]} castShadow>
        <BoxG args={[2.5, 1.8, 1.6]} />
        <Flat color="#F4F4F0" />
      </mesh>
      <mesh position={[0, 1.9, 3.42]}>
        <planeGeometry args={[2.2, 0.8]} />
        <Flat color="#2A3A50" />
      </mesh>
      {[-1, 1].map((s) =>
        Array.from({ length: 6 }, (_, i) => (
          <mesh key={`${s}${i}`} position={[s * 1.31, 1.3, -2.8 + i * 0.95]} rotation={[0, s * Math.PI / 2, 0]}>
            <planeGeometry args={[0.95, 0.4]} />
            <Flat color={i % 2 ? "#2FA84A" : "#F2D23A"} />
          </mesh>
        )),
      )}
      {[-1, 1].flatMap((sx) =>
        [-2.4, 2.4].map((z) => (
          <mesh key={`${sx}${z}`} position={[sx * 1.2, 0.45, z]} rotation={[0, 0, Math.PI / 2]}>
            <CylG args={[0.45, 0.45, 0.3, 10]} />
            <Flat color="#1A1A20" />
          </mesh>
        )),
      )}
      {[-0.6, 0.6].map((x, i) => (
        <group key={x}>
          <mesh position={[x, 3.45, 1.0]}>
            <BoxG args={[0.8, 0.25, 0.4]} />
            <Glow color={(blink ? i === 0 : i === 1) ? "#4AA0FF" : "#1A2A50"} />
          </mesh>
          {(blink ? i === 0 : i === 1) ? <Halo position={[x, 3.5, 1.0]} size={3} color="#4AA0FF" opacity={0.6} /> : null}
        </group>
      ))}
      <mesh position={[0, 1.2, 3.42]}>
        <planeGeometry args={[2.4, 0.3]} />
        <Glow color={P.headlight} />
      </mesh>
    </group>
  );
};

/** A hospital front at night: a tall lit block, a blue "H" sign, an entrance canopy. Front face at z = 0. */
export const HospitalFront: React.FC<{ t: number }> = ({ t }) => {
  const win = useMemo(
    () =>
      Array.from({ length: 9 * 12 }, (_, i) => ({
        x: -22 + (i % 12) * 4,
        y: 6 + Math.floor(i / 12) * 4,
        lit: random(`hw${i}`) < 0.7,
      })),
    [],
  );
  return (
    <group>
      <mesh position={[0, -0.05, 20]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <Flat color={P.road} />
      </mesh>
      <mesh position={[0, 20, -10]} castShadow receiveShadow>
        <BoxG args={[50, 40, 20]} />
        <Flat color="#C8CED8" />
      </mesh>
      {win.map((w, i) => (
        <mesh key={i} position={[w.x, w.y, 0.02]}>
          <planeGeometry args={[2.4, 2.2]} />
          {w.lit ? <Glow color="#F4F0D8" /> : <Flat color="#2A3448" />}
        </mesh>
      ))}
      <mesh position={[0, 4.6, 3]} castShadow>
        <BoxG args={[16, 0.5, 6]} />
        <Flat color="#E8ECF0" />
      </mesh>
      <mesh position={[0, 2.2, 0.02]}>
        <planeGeometry args={[8, 4.4]} />
        <Glow color="#DCEAF0" />
      </mesh>
      <group position={[-12, 27, 0.4]}>
        <mesh>
          <BoxG args={[7, 7, 0.4]} />
          <Glow color="#1E5AC8" />
        </mesh>
        <CanvasPanel position={[0, 0, 0.22]} w={6.4} h={6.4} px={256} draw={(ctx, W, H) => {
          ctx.fillStyle = "#1E5AC8";
          ctx.fillRect(0, 0, W, H);
          fitText(ctx, "H", W / 2, H * 0.54, W * 0.8, H * 0.82, "#FFFFFF");
        }} />
        <Halo size={18} color="#4A8AFF" opacity={0.5} />
      </group>
      <Halo position={[0, 2.2, 1]} size={16} color="#DCEAF0" opacity={0.3 + 0.05 * Math.sin(t)} />
    </group>
  );
};

/** A lab bench with test-tube racks, a microscope and a monitor (a canvas graph). */
export const LabBench: React.FC<{ draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => void }> = ({ draw }) => (
  <group>
    <mesh position={[0, -0.05, 2]} receiveShadow>
      <BoxG args={[20, 0.1, 14]} />
      <Flat color="#C9D2DE" />
    </mesh>
    <mesh position={[0, 5, -3.4]} receiveShadow>
      <BoxG args={[20, 10, 0.3]} />
      <Flat color="#E8EEF5" />
    </mesh>
    <mesh position={[0, 1.0, -1.8]} castShadow receiveShadow>
      <BoxG args={[10, 2.0, 2.2]} />
      <Flat color="#8E96A6" />
    </mesh>
    <mesh position={[0, 2.06, -1.8]} castShadow receiveShadow>
      <BoxG args={[10.2, 0.12, 2.4]} />
      <Flat color="#F4F6F8" />
    </mesh>
    {Array.from({ length: 6 }, (_, i) => (
      <mesh key={i} position={[-3.6 + i * 0.32, 2.5, -1.6]}>
        <CylG args={[0.11, 0.11, 0.8, 8]} />
        <meshLambertMaterial color={["#FF5A4A", "#4FA0FF", "#6AC84A", "#FFBA58", "#C85A8A", "#4FA0FF"][i]} transparent opacity={0.8} flatShading />
      </mesh>
    ))}
    <group position={[-1.2, 2.12, -1.9]}>
      <mesh position={[0, 0.1, 0]}>
        <BoxG args={[0.8, 0.2, 0.8]} />
        <Flat color="#2A2C34" />
      </mesh>
      <Strut a={[0, 0.2, -0.2]} b={[0, 1.3, -0.1]} w={0.16} color="#2A2C34" />
      <Strut a={[0, 1.3, -0.1]} b={[0, 1.0, 0.25]} w={0.2} color="#E8ECF0" />
    </group>
    <Strut a={[2.4, 2.12, -2.4]} b={[2.4, 3.6, -2.4]} w={0.16} color="#2A2C34" />
    <mesh position={[2.4, 4.7, -2.3]} castShadow>
      <BoxG args={[3.6, 2.3, 0.2]} />
      <Flat color="#1A1C22" />
    </mesh>
    <CanvasPanel position={[2.4, 4.7, -2.18]} w={3.3} h={2.0} px={768} draw={draw} />
    <mesh position={[0, 9.9, 2]}>
      <BoxG args={[20, 0.2, 14]} />
      <Flat color="#F2F4F8" />
    </mesh>
  </group>
);

/** A pain-signal trace: spikes, then a flat line labelled NO SIGNAL once `k` passes the cut. */
export const drawSignal = (t: number, k: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0A1418";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#1E3A40";
  ctx.lineWidth = 2;
  for (let x = 0; x < W; x += W / 10) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  fitText(ctx, "PAIN SIGNAL", W * 0.2, H * 0.1, W * 0.35, H * 0.08, "#7FE0C8", false);
  ctx.strokeStyle = k < 0.5 ? "#FFBA58" : "#FF4A3A";
  ctx.lineWidth = H * 0.025;
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const u = i / 120;
    const alive = u < k ? 1 : 0;
    const y = H * 0.55 - alive * (Math.max(0, Math.sin(u * 40 + t * 8)) ** 6) * H * 0.3;
    if (i === 0) ctx.moveTo(u * W, y);
    else ctx.lineTo(u * W, y);
  }
  ctx.stroke();
  if (k < 0.95) fitText(ctx, "NO SIGNAL", W / 2, H * 0.85, W * 0.6, H * 0.12, "#FF4A3A");
};

/** Toy building bricks scattered on a floor (each a small box with studs). */
export const ToyBricks: React.FC<{ area: [number, number, number, number]; count?: number; seed?: string }> = ({ area, count = 24, seed = "tb" }) => (
  <group>
    {Array.from({ length: count }, (_, i) => {
      const x = area[0] + random(`${seed}x${i}`) * (area[1] - area[0]);
      const z = area[2] + random(`${seed}z${i}`) * (area[3] - area[2]);
      const c = ["#C8372D", "#24748F", "#F2D23A", "#2FA84A", "#F4F4F0"][i % 5];
      return (
        <group key={i} position={[x, 0.12, z]} rotation={[0, random(`${seed}r${i}`) * 3, 0]}>
          <mesh castShadow>
            <BoxG args={[0.5, 0.24, 0.26]} />
            <Flat color={c} />
          </mesh>
          {[-0.12, 0.12].map((dx) => (
            <mesh key={dx} position={[dx, 0.16, 0]}>
              <CylG args={[0.06, 0.06, 0.08, 8]} />
              <Flat color={c} />
            </mesh>
          ))}
        </group>
      );
    })}
  </group>
);

// ---------------------------------------------------------------- the alarm

/** A ceiling smoke alarm (facing down at `position`). `battery` 1 = in; the LED blinks while powered. */
export const SmokeAlarm: React.FC<{ position: V3; t: number; battery?: number; ring?: number }> = ({ position, t, battery = 1, ring = 0 }) => {
  const powered = battery > 0.98;
  const led = powered && (ring > 0 ? Math.floor(t * 6) % 2 === 0 : Math.floor(t * 1.2) % 2 === 0);
  return (
    <group position={position}>
      <mesh position={[0, -0.12, 0]} castShadow>
        <CylG args={[0.9, 1.0, 0.25, 18]} />
        <Flat color="#F4F4F0" />
      </mesh>
      <mesh position={[0, -0.26, 0]}>
        <CylG args={[0.55, 0.55, 0.05, 18]} />
        <Flat color="#E0E0DA" />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[Math.cos(i * 0.785) * 0.75, -0.25, Math.sin(i * 0.785) * 0.75]}>
          <BoxG args={[0.16, 0.03, 0.05]} />
          <Flat color="#B8B8B0" />
        </mesh>
      ))}
      <mesh position={[0.3, -0.3, 0.3]}>
        <IcoG args={[0.07, 1]} />
        {led ? <Glow color="#FF2A20" /> : <Flat color="#4A2020" />}
      </mesh>
      {led ? <Halo position={[0.3, -0.32, 0.3]} size={0.9} color="#FF2A20" opacity={0.8} /> : null}
      {/* the 9V battery sliding out of its slot (−X side) */}
      <mesh position={[-0.95 - (1 - battery) * 1.2, -0.12 - (1 - battery) * 0.6, 0]} castShadow>
        <BoxG args={[0.5, 0.28, 0.36]} />
        <Flat color={battery < 1 ? "#2A2A30" : "#E8E4DA"} />
      </mesh>
    </group>
  );
};

/** Grey smoke creeping low across a floor from `from` toward +Z (k 0..1). */
export const CreepingSmoke: React.FC<{ from: V3; k: number; t: number; width?: number }> = ({ from, k, t, width = 6 }) => (
  <group position={from}>
    {Array.from({ length: 26 }, (_, i) => {
      const d = random(`cs${i}`);
      const reach = k * 9 * (0.4 + d * 0.6);
      return (
        <mesh key={i} position={[(random(`csx${i}`) - 0.5) * width, 0.3 + random(`csy${i}`) * 0.8 + noise1(`cs${i}`, t) * 0.2, reach]}>
          <IcoG args={[0.6 + d * 0.8, 1]} />
          <Flat color={i % 3 ? "#6A6A74" : "#55555E"} opacity={0.55} />
        </mesh>
      );
    })}
  </group>
);
