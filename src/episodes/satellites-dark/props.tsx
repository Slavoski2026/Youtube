/**
 * Sets and props for "What If Every Satellite Stopped Working?" (ep. 7).
 * Generic world: no real countries, flags, companies or logos. Non-graphic: missiles are only ever
 * blips on a screen. Everything rests on y = 0 using its real extents and follows the kit detail level.
 * Hero scale: Slavoski is 4.2 tall (≈ 1.8 m, so 1 unit ≈ 0.43 m).
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { PineTree } from "../../slavoski/city";
import { BoxG, chamferBox, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { FONT } from "../../slavoski/fonts";
import type { HeroLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { clamp01, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { CanvasPanel, fitText } from "../../slavoski/screens";
import { Strut } from "../no-work-2036/props";

const frac = (x: number) => ((x % 1) + 1) % 1;

// ================================================================ satellites

export type SatKind = "gps" | "comms" | "weather" | "warning";
const FOIL = "#C9A040";
const FOIL_DARK = "#A07E2C";
const PANEL = "#26428E";
const PANEL_LINE = "#6A8AD8";

/** One solar wing: a boom and two panels of cells along +X from the origin. */
const SolarWing: React.FC<{ len?: number; h?: number; angle?: number }> = ({ len = 6.4, h = 1.8, angle = 0 }) => (
  <group rotation={[angle, 0, 0]}>
    <mesh position={[0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <CylG args={[0.07, 0.07, 1.4, 6]} />
      <Flat color="#8E96A6" />
    </mesh>
    {[0, 1].map((k) => {
      const w = (len - 1.6) / 2;
      const cx = 1.4 + w / 2 + k * (w + 0.12);
      return (
        <group key={k} position={[cx, 0, 0]}>
          <mesh castShadow>
            <BoxG args={[w, h, 0.08]} />
            <Flat color={PANEL} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              {Array.from({ length: 3 }, (_, i) => (
                <mesh key={i} position={[-w / 2 + (w / 3) * (i + 0.5), 0, s * 0.045]}>
                  <planeGeometry args={[0.04, h * 0.94]} />
                  <Flat color={PANEL_LINE} side={THREE.DoubleSide} />
                </mesh>
              ))}
              <mesh position={[0, 0, s * 0.045]}>
                <planeGeometry args={[w * 0.96, 0.04]} />
                <Flat color={PANEL_LINE} side={THREE.DoubleSide} />
              </mesh>
            </group>
          ))}
        </group>
      );
    })}
  </group>
);

/**
 * A low-poly satellite (~2 units bus, wings out along ±X). `on` 0..1 is its life: status light green,
 * payload glow; at 0 everything is dark. `t` drives slow wobble and blinking.
 */
export const Satellite: React.FC<{ position?: V3; rotation?: V3; scale?: number; kind?: SatKind; on?: number; t?: number; wing?: number }> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  kind = "gps",
  on = 1,
  t = 0,
  wing = 0,
}) => {
  const blink = on > 0.5 && Math.floor(t * 2) % 2 === 0;
  const light = on > 0.5 ? "#45E08A" : on > 0.15 ? "#FF4A3A" : "#2A1414";
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* bus in gold foil */}
      <mesh geometry={chamferBox(2, 2, 2.4)} castShadow receiveShadow>
        <Flat color={FOIL} />
      </mesh>
      {[
        [0, 0.55, 1.205, 1.6, 0.7, 0.02],
        [0.3, -0.45, 1.205, 1.2, 0.8, 0.02],
        [1.005, 0.2, -0.3, 0.02, 1.2, 1.4],
        [-1.005, -0.3, 0.4, 0.02, 1.0, 1.2],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, 0, (i % 2 ? 0.08 : -0.06)]}>
          <BoxG args={[w, h, d]} />
          <Flat color={i % 2 ? FOIL_DARK : "#D8B85A"} />
        </mesh>
      ))}
      <SolarWing angle={wing} />
      <group rotation={[0, Math.PI, 0]}>
        <SolarWing angle={-wing} />
      </group>
      {/* payload by kind */}
      {kind === "gps" ? (
        <group position={[0, -1.15, 0]}>
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.55, -0.25, Math.sin(a) * 0.55]}>
                <CylG args={[0.09, 0.09, 0.5, 6]} />
                <Flat color="#E8E4DA" />
              </mesh>
            );
          })}
          <mesh position={[0, -0.05, 0]}>
            <CylG args={[0.8, 0.8, 0.12, 10]} />
            <Flat color="#E8E4DA" />
          </mesh>
        </group>
      ) : null}
      {kind === "comms" ? (
        <group position={[0, 0.2, 1.3]} rotation={[-Math.PI / 2 + 0.3, 0, 0]}>
          <mesh>
            <sphereGeometry args={[1.5, 14, 4, 0, Math.PI * 2, 0, 0.55]} />
            <meshLambertMaterial color="#E8E4DA" flatShading side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <CylG args={[0.04, 0.04, 1.4, 4]} />
            <Flat color="#8E96A6" />
          </mesh>
        </group>
      ) : null}
      {kind === "weather" ? (
        <group position={[0, 0, 1.25]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <CylG args={[0.45, 0.5, 0.7, 10]} />
            <Flat color="#2B2F3E" />
          </mesh>
          <mesh position={[0, 0, 0.36]}>
            <circleGeometry args={[0.36, 10]} />
            <Glow color={on > 0.5 ? "#7FE8FF" : "#10181E"} />
          </mesh>
          <mesh position={[0, 1.2, -0.4]}>
            <BoxG args={[1.6, 0.06, 1.2]} />
            <Flat color="#E8E4DA" />
          </mesh>
        </group>
      ) : null}
      {kind === "warning" ? (
        <group position={[0, -0.2, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh position={[0, 1.0, 0]}>
            <CylG args={[0.55, 0.65, 2.2, 10]} />
            <Flat color="#E8E4DA" />
          </mesh>
          <mesh position={[0, 2.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.48, 12]} />
            <Glow color={on > 0.5 ? "#FF5A3A" : "#140808"} />
          </mesh>
          {on > 0.5 ? <Halo position={[0, 2.3, 0]} size={2.2} color="#FF5A3A" opacity={0.45} /> : null}
        </group>
      ) : null}
      {/* thrusters + status light */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 1.1, -1.0]} rotation={[0, 0, Math.PI]}>
          <ConeG args={[0.16, 0.3, 6]} />
          <Flat color="#5A5E68" />
        </mesh>
      ))}
      <mesh position={[0.7, 1.05, 1.0]}>
        <IcoG args={[0.12, 1]} />
        <Glow color={blink || on <= 0.5 ? light : "#123018"} />
      </mesh>
      {on > 0.15 && (blink || on <= 0.5) ? <Halo position={[0.7, 1.05, 1.0]} size={1.4} color={light} opacity={0.6} /> : null}
    </group>
  );
};

/**
 * A line of satellites crossing the sky as moving lights (seen from the ground). Light i goes dark at
 * `offAt + i * stagger` seconds: the chain reaction of the cold open.
 */
export const SkyTrain: React.FC<{ t: number; count?: number; offAt?: number; stagger?: number; from?: V3; to?: V3; speed?: number; size?: number }> = ({
  t,
  count = 24,
  offAt = 99,
  stagger = 0.05,
  from = [-170, 95, -230],
  to = [170, 140, -230],
  speed = 0.05,
  size = 1.4,
}) => (
  <group>
    {Array.from({ length: count }, (_, i) => {
      const k = clamp01(0.15 + t * speed + i * (0.7 / count));
      const p: V3 = [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k + Math.sin(k * Math.PI) * 18, from[2] + (to[2] - from[2]) * k];
      const dark = clamp01((t - (offAt + i * stagger)) / 0.12);
      const flash = t > offAt + i * stagger - 0.08 && t < offAt + i * stagger ? 1.6 : 1;
      const o = 1 - dark;
      return (
        <group key={i} position={p}>
          <mesh>
            <IcoG args={[size * 0.35, 1]} />
            <Glow color={o > 0.05 ? "#F4F8FF" : "#1A1E2C"} fog={false} />
          </mesh>
          {o > 0.05 ? <Halo size={size * 3.2 * flash} color="#DCE8FF" opacity={0.7 * o} /> : null}
        </group>
      );
    })}
  </group>
);

/** Thousands of satellites as a shell of points around a planet of radius `r` (instanced, seeded). */
export const OrbitShell: React.FC<{ r: number; count?: number; t: number; lit?: number; seed?: string }> = ({ r, count = 2400, t, lit = 0, seed = "shell" }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const u = random(`${seed}u${i}`) * 2 - 1;
        const th = random(`${seed}t${i}`) * Math.PI * 2;
        const band = random(`${seed}b${i}`);
        const rr = r * (band < 0.75 ? 1.12 + random(`${seed}r${i}`) * 0.12 : band < 0.93 ? 1.6 + random(`${seed}r${i}`) * 0.4 : 3.6 + random(`${seed}r${i}`) * 0.2);
        return { u, th, rr, w: (band < 0.75 ? 0.1 : band < 0.93 ? 0.05 : 0.012) * (random(`${seed}w${i}`) < 0.5 ? 1 : -1) };
      }),
    [count, r, seed],
  );
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    items.forEach((it, i) => {
      const th = it.th + t * it.w;
      const s = Math.sqrt(1 - it.u * it.u);
      o.position.set(Math.cos(th) * s * it.rr, it.u * it.rr, Math.sin(th) * s * it.rr);
      o.scale.setScalar(r * 0.012);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c.set(random(`${seed}l${i}`) < lit ? "#F4F8FF" : "#7A808E"));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} key={items.length}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
};

// ================================================================ ground: pins, towers, harbour

/** A floating map pin (tip at the origin's y + 0, head above), glowing blue; `pop` 0..1 scales it in/out. */
export const MapPin: React.FC<{ position: V3; pop?: number; color?: string; size?: number }> = ({ position, pop = 1, color = "#3A8BFF", size = 1 }) => {
  if (pop <= 0.01) return null;
  return (
    <group position={position} scale={size * pop}>
      <mesh position={[0, 0.9, 0]} rotation={[Math.PI, 0, 0]}>
        <ConeG args={[0.5, 1.4, 8]} />
        <Glow color={color} />
      </mesh>
      <mesh position={[0, 1.75, 0]}>
        <IcoG args={[0.62, 2]} />
        <Glow color={color} />
      </mesh>
      <mesh position={[0, 1.78, 0.45]}>
        <IcoG args={[0.24, 1]} />
        <Glow color="#FFFFFF" />
      </mesh>
      <Halo position={[0, 1.6, 0]} size={3.4} color={color} opacity={0.4} />
    </group>
  );
};

/** A lattice cell tower (base on y = 0) with panel antennas, a beacon and pulsing signal arcs (`signal` 0..1). */
export const CellTower: React.FC<{ position: V3; h?: number; signal?: number; t: number }> = ({ position, h = 30, signal = 1, t }) => {
  const legs: V3[] = [
    [-1.6, 0, -1.6],
    [1.6, 0, -1.6],
    [1.6, 0, 1.6],
    [-1.6, 0, 1.6],
  ];
  const top = (p: V3): V3 => [p[0] * 0.25, h, p[2] * 0.25];
  return (
    <group position={position}>
      {legs.map((p, i) => (
        <Strut key={i} a={p} b={top(p)} w={0.22} color="#8E96A6" />
      ))}
      {Array.from({ length: 7 }, (_, k) => {
        const y = (k + 1) * (h / 8);
        const s = 1 - (0.75 * y) / h;
        return legs.map((p, i) => {
          const q = legs[(i + 1) % 4];
          return <Strut key={`${k}${i}`} a={[p[0] * s, y, p[2] * s]} b={[q[0] * s, y - h / 16, q[2] * s]} w={0.1} color="#8E96A6" />;
        });
      })}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 0.9, h - 1.2, Math.cos(a) * 0.9]} rotation={[0, a, 0]} castShadow>
            <BoxG args={[0.6, 2.4, 0.25]} />
            <Flat color="#E8E4DA" />
          </mesh>
        );
      })}
      <mesh position={[0, h + 0.6, 0]}>
        <IcoG args={[0.25, 1]} />
        <Glow color={Math.floor(t * 1.5) % 2 ? "#FF4040" : "#401010"} />
      </mesh>
      {Math.floor(t * 1.5) % 2 ? <Halo position={[0, h + 0.6, 0]} size={3} color="#FF4040" opacity={0.6} /> : null}
      {signal > 0
        ? [0, 1, 2].map((i) => {
            const k = frac(t * 0.9 + i / 3);
            return (
              <mesh key={i} position={[0, h - 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[2 + k * 9, 0.08, 4, 32]} />
                <meshBasicMaterial color="#7FE8FF" transparent opacity={(1 - k) * 0.8 * signal} toneMapped={false} depthWrite={false} />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

/** Calm harbour water (a big plane) with a few seeded foam strips that drift. */
export const Sea: React.FC<{ t: number; color?: string; size?: number; y?: number }> = ({ t, color = "#2A4A5E", size = 900, y = 0 }) => (
  <group>
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <Flat color={color} />
    </mesh>
    {Array.from({ length: 40 }, (_, i) => (
      <mesh key={i} position={[(random(`sx${i}`) - 0.5) * 160 + Math.sin(t * 0.3 + i) * 2, y + 0.04, (random(`sz${i}`) - 0.5) * 160]} rotation={[-Math.PI / 2, 0, random(`sr${i}`)]}>
        <planeGeometry args={[3 + random(`sw${i}`) * 5, 0.25]} />
        <Flat color="#7A9AAE" />
      </mesh>
    ))}
  </group>
);

/** Container ship facing +Z (bow at z = +L/2), waterline at y = 0. Radar on the bridge spins with t. */
export const SHIP = { L: 64, W: 11 };
export const ContainerShip: React.FC<{ position: V3; yaw?: number; t: number; radar?: boolean }> = ({ position, yaw = 0, t, radar = true }) => {
  const { L, W } = SHIP;
  const colors = ["#C8372D", "#24748F", "#E0B04E", "#5A4A78", "#2F7A5A", "#8E96A6"];
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <BoxG args={[W, 5.5, L]} />
        <Flat color="#232838" />
      </mesh>
      <mesh position={[0, -1.0, 0]}>
        <BoxG args={[W - 0.2, 1.4, L - 0.4]} />
        <Flat color="#8A2A2A" />
      </mesh>
      <mesh position={[0, 1.2, L / 2 + 3]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <BoxG args={[W * 0.7, 5.5, W * 0.7]} />
        <Flat color="#232838" />
      </mesh>
      {/* container stacks */}
      {Array.from({ length: 8 }, (_, row) =>
        Array.from({ length: 3 }, (_, col) =>
          Array.from({ length: 1 + Math.floor(random(`st${row}${col}`) * 3) }, (_, lev) => (
            <mesh key={`${row}${col}${lev}`} position={[(col - 1) * 3.4, 4.0 + 1.35 + lev * 2.7, -L / 2 + 18 + row * 5.4]} castShadow receiveShadow>
              <BoxG args={[3.2, 2.6, 5.2]} />
              <Flat color={colors[Math.floor(random(`sc${row}${col}${lev}`) * colors.length)]} />
            </mesh>
          )),
        ),
      )}
      {/* bridge at the stern */}
      <group position={[0, 4, -L / 2 + 7]}>
        <mesh position={[0, 5, 0]} castShadow>
          <BoxG args={[W, 10, 6]} />
          <Flat color="#E8E4DA" />
        </mesh>
        <mesh position={[0, 8.6, 3.02]}>
          <planeGeometry args={[W * 0.9, 1.0]} />
          <Glow color="#9FC4E8" />
        </mesh>
        <mesh position={[0, 11, 0]}>
          <CylG args={[0.2, 0.2, 2, 6]} />
          <Flat color="#5A5E68" />
        </mesh>
        {radar ? (
          <mesh position={[0, 12.1, 0]} rotation={[0, t * 3, 0]}>
            <BoxG args={[3.6, 0.3, 0.3]} />
            <Flat color="#E8E4DA" />
          </mesh>
        ) : null}
        <mesh position={[0, 12.6, 0]}>
          <IcoG args={[0.18, 1]} />
          <Glow color="#FF4040" />
        </mesh>
        <Halo position={[0, 12.6, 0]} size={2.4} color="#FF4040" opacity={0.5} />
      </group>
    </group>
  );
};

/** A striped lighthouse on a rock (base y = 0) with a sweeping beam. */
export const Lighthouse: React.FC<{ position: V3; t: number; h?: number }> = ({ position, t, h = 22 }) => (
  <group position={position}>
    <mesh position={[0, 1.5, 0]} scale={[1, 0.4, 1]} castShadow>
      <IcoG args={[6, 1]} />
      <Flat color="#4A4F60" />
    </mesh>
    {Array.from({ length: 5 }, (_, i) => (
      <mesh key={i} position={[0, 3 + i * (h / 5) + h / 10, 0]} castShadow>
        <CylG args={[2.2 - (i + 1) * 0.22, 2.2 - i * 0.22, h / 5, 12]} />
        <Flat color={i % 2 ? "#C8372D" : "#F2EEE6"} />
      </mesh>
    ))}
    <mesh position={[0, 3 + h + 1.2, 0]}>
      <CylG args={[1.2, 1.2, 2.4, 10]} />
      <Glow color="#FFE9B0" />
    </mesh>
    <mesh position={[0, 3 + h + 3, 0]} castShadow>
      <ConeG args={[1.6, 1.6, 10]} />
      <Flat color="#2B2F3E" />
    </mesh>
    <Halo position={[0, 3 + h + 1.2, 0]} size={9} color="#FFE9B0" opacity={0.6} />
    <group position={[0, 3 + h + 1.2, 0]} rotation={[0, t * 1.4, 0]}>
      <mesh position={[0, 0, 20]} rotation={[Math.PI / 2, 0, 0]}>
        <ConeG args={[4, 40, 12, 1, true]} />
        <meshBasicMaterial color="#FFF2C8" transparent opacity={0.12} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  </group>
);

/** A concrete quay along X at z, with bollards and a dock crane frame. */
export const Quay: React.FC<{ z?: number; length?: number }> = ({ z = 0, length = 200 }) => (
  <group>
    <mesh position={[0, 1, z - 15]} receiveShadow>
      <BoxG args={[length, 2.4, 30]} />
      <Flat color="#6A6E78" />
    </mesh>
    {Array.from({ length: 12 }, (_, i) => (
      <mesh key={i} position={[-length / 2 + 10 + i * 16, 2.6, z - 1]} castShadow>
        <CylG args={[0.4, 0.5, 0.8, 8]} />
        <Flat color="#2B2F3E" />
      </mesh>
    ))}
  </group>
);

/** A ship-to-shore gantry crane (legs on the quay at z, boom out over the water toward +Z). */
export const GantryCrane: React.FC<{ position: V3; color?: string }> = ({ position, color = "#24748F" }) => (
  <group position={position}>
    {[-5, 5].flatMap((x) =>
      [-6, 6].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 11, z]} castShadow>
          <BoxG args={[0.9, 22, 0.9]} />
          <Flat color={color} />
        </mesh>
      )),
    )}
    <mesh position={[0, 22.5, 8]} castShadow>
      <BoxG args={[11, 1.6, 46]} />
      <Flat color={color} />
    </mesh>
    <mesh position={[0, 25.5, -4]} castShadow>
      <BoxG args={[4, 4, 6]} />
      <Flat color="#E8E4DA" />
    </mesh>
    <Strut a={[0, 30, -6]} b={[0, 23.4, 30]} w={0.2} color="#2B2F3E" />
    <mesh position={[0, 31, -6]}>
      <BoxG args={[1.4, 3, 1.4]} />
      <Flat color={color} />
    </mesh>
  </group>
);

// ================================================================ timing, money, power

/** A lattice transmission pylon (base y = 0), with cross-arms at 14 and 18. */
export const Pylon: React.FC<{ position: V3; h?: number }> = ({ position, h = 22 }) => (
  <group position={position}>
    {[
      [-2.4, -2.4],
      [2.4, -2.4],
      [2.4, 2.4],
      [-2.4, 2.4],
    ].map(([x, z], i) => (
      <Strut key={i} a={[x, 0, z]} b={[x * 0.2, h, z * 0.2]} w={0.25} color="#5A5E68" />
    ))}
    {[h * 0.64, h * 0.82].map((y) => (
      <mesh key={y} position={[0, y, 0]}>
        <BoxG args={[12 - (y / h) * 4, 0.35, 0.35]} />
        <Flat color="#5A5E68" />
      </mesh>
    ))}
  </group>
);

/** Ticker board drawing for a market wall: rows of symbols and moves, or a "HALTED" banner. */
export const drawTicker = (t: number, halted: boolean) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0B0D16";
  ctx.fillRect(0, 0, W, H);
  const rows = 6;
  const names = ["IDX 1", "IDX 2", "BANKS", "ENERGY", "TECH", "FX"];
  for (let i = 0; i < rows; i++) {
    const y = (H / (rows + 1)) * (i + 1);
    const up = random(`tk${i}`) > 0.4;
    const v = (random(`tv${i}`) * 3 + (halted ? 0 : Math.sin(t * 2 + i) * 0.1)).toFixed(2);
    ctx.font = `700 ${H * 0.085}px "Slavoski Sans", "DejaVu Sans", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = halted ? "#5A6070" : "#E8E4DA";
    ctx.fillText(names[i], W * 0.06, y);
    ctx.textAlign = "right";
    ctx.fillStyle = halted ? "#5A6070" : up ? "#45E08A" : "#FF5A4A";
    ctx.fillText(`${up ? "▲" : "▼"} ${v}%`, W * 0.94, y);
  }
  if (halted) {
    ctx.fillStyle = "rgba(200,40,40,0.92)";
    ctx.fillRect(0, H * 0.36, W, H * 0.28);
    fitText(ctx, "TRADING HALTED", W / 2, H * 0.46, W * 0.86, H * 0.12, "#FFFFFF");
    fitText(ctx, "TIME SYNC ERROR", W / 2, H * 0.57, W * 0.6, H * 0.07, "#FFD0C8");
  }
};

// ================================================================ snowy village, mountains

/** Snow-covered ground with a few drifts. */
export const SnowGround: React.FC = () => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[600, 0.1, 600]} />
      <Flat color="#E4EAF2" />
    </mesh>
    {Array.from({ length: 14 }, (_, i) => (
      <mesh key={i} position={[(random(`dx${i}`) - 0.5) * 80, -0.4, (random(`dz${i}`) - 0.5) * 80 - 20]} scale={[1, 0.25, 1]} receiveShadow>
        <IcoG args={[3 + random(`ds${i}`) * 4, 1]} />
        <Flat color="#EEF2F8" />
      </mesh>
    ))}
  </group>
);

/** A snow-capped mountain (base y = 0). */
export const Mountain: React.FC<{ position: V3; h?: number; r?: number; seed?: string }> = ({ position, h = 90, r = 60, seed = "mt" }) => (
  <group position={position} rotation={[0, random(seed) * Math.PI, 0]}>
    <mesh position={[0, h / 2, 0]} castShadow>
      <ConeG args={[r, h, 7]} />
      <Flat color="#56606F" />
    </mesh>
    <mesh position={[0, h * 0.82, 0]}>
      <ConeG args={[r * 0.37, h * 0.37, 7]} />
      <Flat color="#F2F6FA" />
    </mesh>
  </group>
);

/** A pine with snow on its tiers (kit PineTree plus white caps). */
export const SnowPine: React.FC<{ position: V3; scale?: number }> = ({ position, scale = 2.4 }) => (
  <group position={position} scale={scale}>
    <PineTree position={[0, 0, 0]} />
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[0, 2.2 + i * 0.95, 0]}>
        <ConeG args={[0.95 - i * 0.28, 0.6, 7]} />
        <Flat color="#F2F6FA" />
      </mesh>
    ))}
  </group>
);

/** A small cabin (walls 6 tall, snowy pitched roof) with a rooftop satellite dish. Front faces +Z. */
export const Cabin: React.FC<{ position: V3; yaw?: number; color?: string; lit?: boolean; dish?: boolean }> = ({ position, yaw = 0, color = "#7A4A34", lit = true, dish = true }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 3, 0]} castShadow receiveShadow>
      <BoxG args={[8, 6, 7]} />
      <Flat color={color} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 2.1, 7.4, 0]} rotation={[0, 0, s * -0.72]} castShadow>
        <BoxG args={[5.8, 0.5, 7.6]} />
        <Flat color="#F2F6FA" />
      </mesh>
    ))}
    <mesh position={[0, 1.7, 3.51]}>
      <planeGeometry args={[1.6, 3.4]} />
      <Flat color="#3A2418" />
    </mesh>
    {[-2.4, 2.4].map((x) => (
      <group key={x}>
        <mesh position={[x, 3.6, 3.51]}>
          <planeGeometry args={[1.5, 1.3]} />
          {lit ? <Glow color={P.windowLit} /> : <Flat color={P.windowDark} />}
        </mesh>
        {lit ? <Halo position={[x, 3.6, 3.8]} size={3} color={P.windowLit} opacity={0.3} /> : null}
      </group>
    ))}
    {dish ? (
      <group position={[2.6, 8.4, 1.6]} rotation={[0.5, -0.6, 0]}>
        <mesh>
          <sphereGeometry args={[1.0, 12, 4, 0, Math.PI * 2, 0, 0.6]} />
          <meshLambertMaterial color="#D8DCE6" flatShading side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <CylG args={[0.03, 0.03, 0.9, 4]} />
          <Flat color="#5A5E68" />
        </mesh>
      </group>
    ) : null}
  </group>
);

// ================================================================ hurricane

/** A wall of storm cloud on the horizon: a slowly turning spiral of faceted grey puffs, darker underneath. */
export const StormWall: React.FC<{ position: V3; t: number; radius?: number; seed?: string }> = ({ position, t, radius = 140, seed = "storm" }) => (
  <group position={position} rotation={[0, t * 0.05, 0]}>
    {Array.from({ length: 70 }, (_, i) => {
      const a = (i / 70) * Math.PI * 6;
      const r = radius * (0.15 + (i / 70) * 0.85);
      const s = 14 + random(`${seed}s${i}`) * 16;
      return (
        <mesh key={i} position={[Math.cos(a) * r, 24 + random(`${seed}y${i}`) * 18 + (1 - i / 70) * 14, Math.sin(a) * r]} scale={[1.4, 0.7, 1.2]}>
          <IcoG args={[s, 1]} />
          <Flat color={i % 3 ? "#4E5666" : "#3A4150"} />
        </mesh>
      );
    })}
  </group>
);

/** Choppy sea: rows of faceted wave crests bobbing with t. */
export const Waves: React.FC<{ t: number; rows?: number; z0?: number; spacing?: number; color?: string }> = ({ t, rows = 10, z0 = -10, spacing = 8, color = "#2E4656" }) => (
  <group>
    {Array.from({ length: rows }, (_, r) =>
      Array.from({ length: 9 }, (_, c) => {
        const x = -48 + c * 12 + (r % 2) * 6;
        const z = z0 - r * spacing;
        const y = Math.sin(t * 2.2 + c * 1.3 + r) * 0.8;
        return (
          <mesh key={`${r}${c}`} position={[x, y - 0.6, z]} rotation={[0, 0, Math.sin(t + c) * 0.15]} scale={[3, 0.8, 1.4]}>
            <IcoG args={[1.6, 0]} />
            <Flat color={(r + c) % 3 ? color : "#4E6A7A"} />
          </mesh>
        );
      }),
    )}
  </group>
);

// ================================================================ command room

/** Abstract world map (made-up landmasses, no real countries) with a radar sweep and track blips. */
export const drawWarRoomMap = (t: number, offline: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#06121C";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(80,160,200,0.18)";
  ctx.lineWidth = 2;
  for (let i = 1; i < 12; i++) {
    ctx.beginPath();
    ctx.moveTo((W / 12) * i, 0);
    ctx.lineTo((W / 12) * i, H);
    ctx.stroke();
  }
  for (let i = 1; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(0, (H / 6) * i);
    ctx.lineTo(W, (H / 6) * i);
    ctx.stroke();
  }
  // invented continents: lumpy blobs
  ctx.fillStyle = "rgba(60,140,170,0.45)";
  for (let b = 0; b < 5; b++) {
    const cx = W * (0.12 + b * 0.19 + random(`blx${b}`) * 0.05);
    const cy = H * (0.3 + random(`bly${b}`) * 0.4);
    ctx.beginPath();
    for (let k = 0; k <= 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const r = W * 0.06 * (0.7 + random(`blr${b}${k % 14}`) * 0.6);
      const x = cx + Math.cos(a) * r * 1.3;
      const y = cy + Math.sin(a) * r;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.fill();
  }
  const live = 1 - offline;
  if (live > 0) {
    const sx = W * 0.5;
    const sy = H * 0.5;
    const a = t * 1.6;
    ctx.fillStyle = `rgba(80,255,160,${0.18 * live})`;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.arc(sx, sy, W * 0.6, a, a + 0.35);
    ctx.fill();
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = `rgba(120,255,180,${live})`;
      ctx.beginPath();
      ctx.arc(W * (0.1 + random(`bp${i}`) * 0.8), H * (0.15 + random(`bq${i}`) * 0.7), W * 0.006, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (offline > 0) {
    ctx.fillStyle = `rgba(4,8,12,${offline * 0.6})`;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = `rgba(200,30,30,${0.92 * offline})`;
    ctx.fillRect(W * 0.3, H * 0.26, W * 0.4, H * 0.48);
    ctx.globalAlpha = offline;
    fitText(ctx, "EARLY WARNING", W / 2, H * 0.38, W * 0.36, H * 0.11, "#FFFFFF");
    fitText(ctx, "OFFLINE", W / 2, H * 0.53, W * 0.34, H * 0.16, "#FFFFFF");
    fitText(ctx, "NO SATELLITE DATA", W / 2, H * 0.66, W * 0.3, H * 0.06, "#FFD0C8");
    ctx.globalAlpha = 1;
  }
};

/** Dark command room: rows of consoles facing a big wall screen at z = -10 (its centre and size exported). */
export const WALL = { c: [0, 7.5, -9.7] as V3, w: 22, h: 9 };
export const CommandRoom: React.FC<{ t: number; offline: number }> = ({ t, offline }) => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[40, 0.1, 40]} />
      <Flat color="#1A1F2E" />
    </mesh>
    <mesh position={[0, 8, -10]} receiveShadow>
      <BoxG args={[40, 16, 0.4]} />
      <Flat color="#121624" />
    </mesh>
    {[-18, 18].map((x) => (
      <mesh key={x} position={[x, 8, 2]} receiveShadow>
        <BoxG args={[0.4, 16, 24]} />
        <Flat color="#141A28" />
      </mesh>
    ))}
    <CanvasPanel position={[WALL.c[0], WALL.c[1], WALL.c[2] + 0.12]} w={WALL.w} h={WALL.h} px={1024} draw={drawWarRoomMap(t, offline)} />
    <mesh position={[WALL.c[0], WALL.c[1], WALL.c[2] + 0.02]}>
      <BoxG args={[WALL.w + 0.6, WALL.h + 0.6, 0.15]} />
      <Flat color="#0A0C14" />
    </mesh>
    {/* consoles in two rows */}
    {[-2, 4].flatMap((z, row) =>
      [-9, -3, 3, 9].map((x) => (
        <group key={`${row}${x}`} position={[x, 0, z]}>
          <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
            <BoxG args={[5, 2.2, 1.6]} />
            <Flat color="#232838" />
          </mesh>
          <mesh position={[0, 2.6, -0.5]} rotation={[-0.3, 0, 0]}>
            <BoxG args={[4.4, 1.4, 0.12]} />
            <Flat color="#0E1018" />
          </mesh>
          <mesh position={[0, 2.6, -0.43]} rotation={[-0.3, 0, 0]}>
            <planeGeometry args={[4.1, 1.15]} />
            <Glow color={offline > 0.5 ? "#5A1A1A" : "#1E5A4A"} />
          </mesh>
        </group>
      )),
    )}
    {[-10, 0, 10].map((x) => (
      <mesh key={x} position={[x, 15.5, 0]}>
        <BoxG args={[3, 0.15, 1]} />
        <Glow color={offline > 0.5 ? "#7A2020" : "#2A3A50"} />
      </mesh>
    ))}
    <pointLight position={[0, 7, -6]} color={offline > 0.5 ? "#FF3A3A" : "#5AC8B0"} intensity={40} distance={30} decay={2} />
  </group>
);

/** A radar dish on a lattice base (base y = 0) turning with t. */
export const RadarDish: React.FC<{ position: V3; t: number; scale?: number }> = ({ position, t, scale = 1 }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 3, 0]} castShadow>
      <CylG args={[1.2, 2.2, 6, 8]} />
      <Flat color="#8E96A6" />
    </mesh>
    <group position={[0, 7, 0]} rotation={[0, t * 0.8, 0]}>
      <group rotation={[-0.5, 0, 0]}>
        <mesh>
          <sphereGeometry args={[5, 16, 5, 0, Math.PI * 2, 0, 0.75]} />
          <meshLambertMaterial color="#E8E4DA" flatShading side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 2.4, 0]}>
          <CylG args={[0.08, 0.08, 4.4, 4]} />
          <Flat color="#5A5E68" />
        </mesh>
      </group>
    </group>
  </group>
);

/** A big ground-station dish (base y = 0) pointing up at `tilt`. */
export const GroundDish: React.FC<{ position: V3; yaw?: number; tilt?: number; scale?: number }> = ({ position, yaw = 0, tilt = 0.9, scale = 1 }) => (
  <group position={position} rotation={[0, yaw, 0]} scale={scale}>
    <mesh position={[0, 2.5, 0]} castShadow>
      <BoxG args={[3, 5, 3]} />
      <Flat color="#C9D2DE" />
    </mesh>
    <group position={[0, 6, 0]} rotation={[-tilt, 0, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[6, 16, 5, 0, Math.PI * 2, 0, 0.7]} />
        <meshLambertMaterial color="#F2F6FA" flatShading side={THREE.DoubleSide} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return <Strut key={i} a={[Math.cos(a) * 3.4, 1.4, Math.sin(a) * 3.4]} b={[0, 5.4, 0]} w={0.12} color="#8E96A6" />;
      })}
    </group>
  </group>
);

// ================================================================ astronaut

/** Slavoski in a white spacesuit (same rig): the helmet and backpack are separate props. */
export const SPACESUIT: HeroLook = {
  skin: P.skin,
  skinShade: "#B47A55",
  hair: P.hair,
  jacket: "#EEF1F6",
  jacketShade: "#C9D2DE",
  zipper: P.jacket,
  jeans: "#DCE2EA",
  shoe: "#8E96A6",
};

/** A glass helmet bubble around a head centre (head radius 0.68), plus a collar ring. */
export const Helmet: React.FC<{ head: V3 }> = ({ head }) => (
  <group position={head}>
    <mesh>
      <IcoG args={[1.02, 3]} />
      <meshLambertMaterial color="#BFE3FF" transparent opacity={0.22} depthWrite={false} flatShading />
    </mesh>
    <mesh position={[0, -0.82, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.8, 0.14, 6, 18]} />
      <Flat color="#C9D2DE" />
    </mesh>
  </group>
);

// ================================================================ HTML screens

/**
 * A generic phone map (not any real app): streets, a park, a river, and the blue location dot.
 * `state`: "ok" (dot + accuracy ring), "lost" (grey dot, "GPS signal lost" banner), "unknown"
 * (a huge uncertainty circle and "Location unavailable").
 */
export const MapScreen: React.FC<{ w: number; h: number; state: "ok" | "lost" | "unknown"; t: number; k?: number }> = ({ w, h, state, t, k = 1 }) => {
  const pulse = 1 + 0.25 * Math.abs(Math.sin(t * 3));
  const roads = [
    { x: 0.18, y: 0, w: 0.06, h: 1, r: 0 },
    { x: 0.62, y: 0, w: 0.05, h: 1, r: 0 },
    { x: 0, y: 0.32, w: 1, h: 0.04, r: 0 },
    { x: 0, y: 0.66, w: 1, h: 0.05, r: 0 },
    { x: -0.2, y: 0.5, w: 1.4, h: 0.035, r: -24 },
  ];
  return (
    <div style={{ width: w, height: h, background: "#E9E6DE", position: "relative", overflow: "hidden", fontFamily: FONT }}>
      <div style={{ position: "absolute", left: w * 0.68, top: h * 0.05, width: w * 0.3, height: h * 0.22, background: "#BFE0B0", borderRadius: w * 0.03 }} />
      <div style={{ position: "absolute", left: -w * 0.1, top: h * 0.78, width: w * 1.2, height: h * 0.07, background: "#A8CDEB", transform: "rotate(-8deg)" }} />
      {roads.map((r, i) => (
        <div key={i} style={{ position: "absolute", left: r.x * w, top: r.y * h, width: r.w * w, height: r.h * h, background: "#FFFFFF", border: `${w * 0.006}px solid #D2CCC0`, transform: `rotate(${r.r}deg)`, transformOrigin: "0 0" }} />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <div key={`b${i}`} style={{ position: "absolute", left: w * (0.04 + (i % 5) * 0.2), top: h * (0.06 + Math.floor(i / 5) * 0.4), width: w * 0.1, height: h * 0.08, background: "#DAD5CA", borderRadius: w * 0.01 }} />
      ))}
      {state === "unknown" ? (
        <div style={{ position: "absolute", left: w * 0.5 - w * 0.6 * k, top: h * 0.48 - w * 0.6 * k, width: w * 1.2 * k, height: w * 1.2 * k, borderRadius: "50%", background: "rgba(90,140,220,0.18)", border: `${w * 0.006}px solid rgba(90,140,220,0.5)` }} />
      ) : null}
      {state === "ok" ? (
        <div style={{ position: "absolute", left: w * 0.5 - w * 0.09 * pulse, top: h * 0.48 - w * 0.09 * pulse, width: w * 0.18 * pulse, height: w * 0.18 * pulse, borderRadius: "50%", background: "rgba(58,139,255,0.22)" }} />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: w * 0.5 - w * 0.045,
          top: h * 0.48 - w * 0.045,
          width: w * 0.09,
          height: w * 0.09,
          borderRadius: "50%",
          background: state === "ok" ? "#3A8BFF" : "#9AA1B0",
          border: `${w * 0.012}px solid #FFFFFF`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      />
      {state !== "ok" ? (
        <div style={{ position: "absolute", left: w * 0.05, right: w * 0.05, top: h * 0.07, padding: w * 0.04, borderRadius: w * 0.04, background: "rgba(30,34,46,0.92)", color: "#F2F2F6", display: "flex", alignItems: "center", gap: w * 0.03, opacity: k }}>
          <div style={{ width: w * 0.08, height: w * 0.08, borderRadius: "50%", border: `${w * 0.008}px solid #FFBA58`, color: "#FFBA58", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: w * 0.055 }}>!</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: w * 0.06 }}>{state === "lost" ? "GPS signal lost" : "Location unavailable"}</div>
            <div style={{ fontSize: w * 0.045, opacity: 0.75, marginTop: w * 0.008 }}>{state === "lost" ? "Searching for satellites…" : "No satellites found"}</div>
          </div>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: w * 0.06, bottom: h * 0.04, padding: `${w * 0.02}px ${w * 0.04}px`, borderRadius: w * 0.06, background: "#FFFFFF", fontSize: w * 0.045, color: "#3A3F4E", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}>
        {state === "ok" ? "You are here" : "Last known location"}
      </div>
    </div>
  );
};

/** TV "no signal" screen: a calm grey card over faint static. */
export const NoSignalTV: React.FC<{ w: number; h: number; t: number; k: number }> = ({ w, h, t, k }) => {
  const seed = Math.floor(t * 12);
  return (
    <div style={{ width: w, height: h, background: "#0B0D14", position: "relative", overflow: "hidden", fontFamily: FONT }}>
      {k < 1
        ? Array.from({ length: 70 }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: random(`nx${seed}${i}`) * w, top: random(`ny${seed}${i}`) * h, width: w * 0.06, height: h * 0.012, background: `rgba(200,210,230,${0.35 * (1 - k)})` }} />
          ))
        : null}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#C9D2DE", opacity: k }}>
        <div style={{ fontWeight: 700, fontSize: h * 0.1 }}>NO SIGNAL</div>
        <div style={{ fontSize: h * 0.055, opacity: 0.7, marginTop: h * 0.03 }}>Satellite not found</div>
      </div>
    </div>
  );
};

/** Weather-office screen: a spiralling storm on a satellite image, then frozen with "NO DATA". */
export const WeatherScreen: React.FC<{ w: number; h: number; t: number; dead: number }> = ({ w, h, t, dead }) => (
  <div style={{ width: w, height: h, background: "#0A2238", position: "relative", overflow: "hidden", fontFamily: FONT }}>
    <div style={{ position: "absolute", left: w * 0.1, top: h * 0.3, width: w * 0.5, height: h * 0.5, background: "#2F6A4A", borderRadius: "40% 55% 45% 60%" }} />
    <div
      style={{
        position: "absolute",
        left: w * 0.42,
        top: h * 0.08,
        width: h * 0.7,
        height: h * 0.7,
        borderRadius: "50%",
        background: "conic-gradient(from 0deg, rgba(255,255,255,0.9), rgba(255,255,255,0.1), rgba(255,255,255,0.85), rgba(255,255,255,0.05), rgba(255,255,255,0.9))",
        transform: `rotate(${(1 - dead) * t * 60}deg)`,
        filter: `grayscale(${dead})`,
        opacity: 1 - dead * 0.6,
      }}
    />
    <div style={{ position: "absolute", left: w * 0.03, top: h * 0.04, fontSize: h * 0.06, letterSpacing: "0.12em", color: "#CFE6FF" }}>SATELLITE IMAGERY</div>
    {dead > 0 ? (
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(6,10,16,${0.55 * dead})` }}>
        <div style={{ padding: `${h * 0.03}px ${w * 0.05}px`, background: `rgba(200,40,40,${0.92 * dead})`, color: "#FFF", fontWeight: 700, fontSize: h * 0.12, letterSpacing: "0.06em" }}>NO DATA</div>
      </div>
    ) : null}
  </div>
);

/** Satellite phone screen: "NO SERVICE". */
export const NoService: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <div style={{ width: w, height: h, background: "#141824", fontFamily: FONT, color: "#E8E4DA", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
    <div style={{ fontSize: w * 0.08, letterSpacing: "0.1em", opacity: 0.7 }}>SATELLITE</div>
    <div style={{ marginTop: h * 0.03, fontSize: w * 0.13, fontWeight: 700, color: "#FFBA58" }}>NO SERVICE</div>
    <div style={{ marginTop: h * 0.04, display: "flex", gap: w * 0.03, alignItems: "flex-end" }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ width: w * 0.06, height: h * 0.02 * (i + 1), background: "#3A3F4E" }} />
      ))}
    </div>
  </div>
);

/** Weather-office screen for a CanvasPanel: a spiralling storm on a satellite image, then frozen with NO DATA. */
export const drawWeather = (t: number, dead: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0A2238";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#2F6A4A";
  ctx.beginPath();
  ctx.ellipse(W * 0.3, H * 0.6, W * 0.22, H * 0.26, -0.3, 0, Math.PI * 2);
  ctx.fill();
  const cx = W * 0.64;
  const cy = H * 0.46;
  const spin = (1 - dead) * t * 1.2;
  for (let arm = 0; arm < 3; arm++) {
    for (let k = 0; k < 40; k++) {
      const a = spin + arm * ((Math.PI * 2) / 3) + k * 0.16;
      const r = H * 0.03 + k * H * 0.0085;
      const g = Math.round(255 - dead * 120);
      ctx.fillStyle = `rgba(${g},${g},${g},${0.85 - k * 0.018})`;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.85, H * (0.05 - k * 0.0009), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.font = `400 ${H * 0.06}px "Slavoski Sans", "DejaVu Sans", sans-serif`;
  ctx.fillStyle = "#CFE6FF";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("SATELLITE IMAGERY", W * 0.03, H * 0.04);
  if (dead > 0) {
    ctx.fillStyle = `rgba(6,10,16,${0.55 * dead})`;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = `rgba(200,40,40,${0.92 * dead})`;
    ctx.fillRect(W * 0.28, H * 0.38, W * 0.44, H * 0.24);
    ctx.globalAlpha = dead;
    fitText(ctx, "NO DATA", W / 2, H * 0.5, W * 0.4, H * 0.16, "#FFFFFF");
    ctx.globalAlpha = 1;
  }
};

/** A round radar scope for a CanvasPanel: rings, a rotating sweep, blips that light as the beam passes. */
export const drawScope = (t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#04100A";
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) * 0.46;
  ctx.strokeStyle = "rgba(80,255,150,0.35)";
  ctx.lineWidth = W * 0.004;
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, (R * i) / 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(cx - R, cy);
  ctx.lineTo(cx + R, cy);
  ctx.moveTo(cx, cy - R);
  ctx.lineTo(cx, cy + R);
  ctx.stroke();
  const a = t * 2.2;
  for (let k = 0; k < 24; k++) {
    ctx.fillStyle = `rgba(80,255,150,${0.22 * (1 - k / 24)})`;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, a - (k + 1) * 0.03, a - k * 0.03);
    ctx.fill();
  }
  for (let i = 0; i < 6; i++) {
    const ba = random(`sb${i}`) * Math.PI * 2;
    const br = R * (0.25 + random(`sr${i}`) * 0.65);
    const since = (((a - ba) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const glow = Math.max(0, 1 - since / 2.5);
    ctx.fillStyle = `rgba(160,255,190,${0.25 + glow * 0.75})`;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(ba) * br, cy + Math.sin(ba) * br, W * 0.012 * (1 + glow), 0, Math.PI * 2);
    ctx.fill();
  }
};
