/**
 * The survivor's homestead (hero scale): a stone-and-timber farmhouse with a fireplace and chimney,
 * a stream, a shed, solar panels, a rain barrel, a vegetable garden and a woodpile; plus its interior
 * (fireplace, pot, shelves of jars, table) and the survival gear he collects.
 */
import React, { useMemo } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { BoxG, CylG, IcoG, ConeG } from "../../../slavoski/detail";
import { Fireball, SmokeCluster } from "../../../slavoski/fx";
import { Flat, Glow, Halo } from "../../../slavoski/materials";
import { Bush, GrassTufts } from "../../../slavoski/nature";
import type { V3 } from "../../../slavoski/noise";
import { P } from "../../../slavoski/palette";
import { CanvasPanel, CANVAS_FONT } from "../../../slavoski/screens";

/** A gable roof (triangular prism) of width w (along X), depth d (along Z), rise h, sitting on y = 0. */
const triangle = (w: number, h: number) => {
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2, 0);
  sh.lineTo(w / 2, 0);
  sh.lineTo(0, h);
  sh.closePath();
  return sh;
};

export const Gable: React.FC<{ w: number; d: number; h: number; color: string; overhang?: number; wallColor?: string }> = ({ w, d, h, color, overhang = 0.8, wallColor = "#B8925E" }) => {
  const half = w / 2 + overhang;
  const slope = Math.hypot(half, h);
  const ang = Math.atan2(h, half);
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * half) / 2, h / 2, 0]} rotation={[0, 0, -s * ang]} castShadow receiveShadow>
          <BoxG args={[slope, 0.35, d + overhang * 2]} />
          <Flat color={color} />
        </mesh>
      ))}
      {/* gable end walls */}
      {[-1, 1].map((s) => (
        <mesh key={`g${s}`} position={[0, 0, (s * d) / 2]} rotation={[0, s > 0 ? 0 : Math.PI, 0]} castShadow>
          <shapeGeometry args={[triangle(w, h)]} />
          <Flat color={wallColor} side={2} />
        </mesh>
      ))}
    </group>
  );
};

/** Farmhouse layout: front (door, porch) faces +Z. Footprint 18 × 12, walls 8 high, chimney at x = -6. */
export const HOUSE = { w: 18, d: 12, wall: 8, chimneyX: -6.5, door: [2, 0, 6] as V3, porchZ: 9.5 };

export const Homestead: React.FC<{
  t: number;
  /** Window light (night): 0..1. */
  lit?: number;
  /** Chimney smoke. */
  smoke?: boolean;
  /** Solar panels on the roof (0..4). */
  panels?: number;
  /** Snow on the roof and panels (0..1). */
  snow?: number;
  /** Vegetable garden growth (0..1); omit for no garden. */
  garden?: number;
  /** Overgrowth around the house (0..1). */
  growth?: number;
  /** Rain barrel fill 0..1. */
  barrel?: number;
}> = ({ t, lit = 0, smoke = true, panels = 0, snow = 0, garden, growth = 0.15, barrel = 0.6 }) => {
  const W = HOUSE.w;
  const D = HOUSE.d;
  const H = HOUSE.wall;
  const roofRise = 5;
  const roofColor = snow > 0.5 ? "#E8EEF4" : "#6A3A2E";
  return (
    <group>
      {/* stone base + timber walls */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <BoxG args={[W + 0.4, 2, D + 0.4]} />
        <Flat color="#8A847A" />
      </mesh>
      <mesh position={[0, 2 + (H - 2) / 2, 0]} castShadow receiveShadow>
        <BoxG args={[W, H - 2, D]} />
        <Flat color="#B8925E" />
      </mesh>
      {/* plank lines */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[0, 2.5 + i, D / 2 + 0.01]}>
          <planeGeometry args={[W, 0.05]} />
          <Flat color="#8A6A40" />
        </mesh>
      ))}
      <group position={[0, H, 0]}>
        <Gable w={W} d={D} h={roofRise} color={roofColor} />
      </group>
      {/* chimney */}
      <mesh position={[HOUSE.chimneyX, H + 3.5, -1]} castShadow>
        <BoxG args={[2, 9, 2]} />
        <Flat color="#7A746A" />
      </mesh>
      {smoke ? <SmokeCluster position={[HOUSE.chimneyX, H + 8.5, -1]} progress={(t * 0.12) % 1} radius={1.8} rise={9} color="#C8C4C0" seed="chim" count={8} /> : null}
      {/* door + windows */}
      <mesh position={[HOUSE.door[0], 2.9, D / 2 + 0.02]}>
        <planeGeometry args={[2.6, 5.4]} />
        <Flat color="#5A3A2A" />
      </mesh>
      {[-5.5, 6.5].map((x) => (
        <group key={x}>
          <mesh position={[x, 4.6, D / 2 + 0.02]}>
            <planeGeometry args={[2.8, 2.6]} />
            {lit > 0 ? <Glow color="#FFB860" opacity={0.4 + lit * 0.6} /> : <Flat color="#4A6070" />}
          </mesh>
          <mesh position={[x, 4.6, D / 2 + 0.05]}>
            <planeGeometry args={[0.12, 2.6]} />
            <Flat color="#F2EEE6" />
          </mesh>
          {lit > 0 ? <Halo position={[x, 4.6, D / 2 + 0.6]} size={5} color="#FFB060" opacity={0.3 * lit} /> : null}
        </group>
      ))}
      {lit > 0 ? <pointLight position={[0, 4.5, D / 2 + 3]} color="#FFB060" intensity={14 * lit} distance={16} decay={2} /> : null}
      {/* porch */}
      <mesh position={[0, 0.25, D / 2 + 1.8]} castShadow receiveShadow>
        <BoxG args={[12, 0.5, 3.6]} />
        <Flat color="#8A6A40" />
      </mesh>
      <mesh position={[0, 6.4, D / 2 + 1.9]} rotation={[0.18, 0, 0]} castShadow>
        <BoxG args={[12.6, 0.3, 4.2]} />
        <Flat color={roofColor} />
      </mesh>
      {[-5.6, 5.6].map((x) => (
        <mesh key={x} position={[x, 3.2, D / 2 + 3.4]} castShadow>
          <BoxG args={[0.35, 6.4, 0.35]} />
          <Flat color="#6A4A2E" />
        </mesh>
      ))}
      {/* solar panels on the front roof slope */}
      {Array.from({ length: panels }, (_, i) => (
        <SolarPanel key={i} position={[3 + i * 3.2 - 1.6 * (panels - 1) * 0.0, H + 2.6, 1.6]} rotation={[-0.5, 0, 0]} snow={snow} />
      ))}
      {/* rain barrel by the corner */}
      <group position={[W / 2 + 1.4, 0, D / 2 - 1]}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <CylG args={[1.0, 1.0, 3.0, 12]} />
          <Flat color="#3E5A6A" />
        </mesh>
        <mesh position={[0, 0.2 + barrel * 2.7, 0]}>
          <CylG args={[0.95, 0.95, 0.05, 12]} />
          <Flat color="#6A9AB8" />
        </mesh>
        <mesh position={[-0.6, 6.5, 0]} castShadow>
          <BoxG args={[0.3, 7, 0.3]} />
          <Flat color="#7A7E88" />
        </mesh>
      </group>
      {/* woodpile */}
      <group position={[-W / 2 - 2.2, 0, 2]}>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} position={[0, 0.4 + Math.floor(i / 4) * 0.7, -1.5 + (i % 4) * 1.0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <CylG args={[0.35, 0.35, 2.4, 7]} />
            <Flat color={i % 3 ? "#8A5A34" : "#A8743E"} />
          </mesh>
        ))}
      </group>
      {garden !== undefined ? <VegGarden position={[W / 2 + 8, 0, 4]} growth={garden} /> : null}
      {growth > 0 ? <GrassTufts area={[-W / 2 - 6, W / 2 + 6, D / 2 + 4, D / 2 + 14]} count={60} growth={growth} height={1.6} seed="hs-grass" /> : null}
      <Bush position={[-W / 2 + 1, 0, D / 2 + 2]} size={1.8} growth={1} seed="hsb1" />
      <Bush position={[W / 2 + 0.5, 0, -D / 2]} size={2.2} growth={1} seed="hsb2" />
    </group>
  );
};

/** A solar panel (2.8 × 1.8) on a frame; `snow` 0..1 covers it. */
export const SolarPanel: React.FC<{ position: V3; rotation?: V3; snow?: number; clean?: number }> = ({ position, rotation = [0, 0, 0], snow = 0 }) => (
  <group position={position} rotation={rotation}>
    <mesh castShadow>
      <BoxG args={[2.8, 0.12, 1.8]} />
      <Flat color="#C8CCD4" />
    </mesh>
    <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2.6, 1.6]} />
      <Flat color="#1D2E5A" />
    </mesh>
    {[-0.65, 0, 0.65].map((x) => (
      <mesh key={x} position={[x, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.03, 1.6]} />
        <Flat color="#8FB3D9" />
      </mesh>
    ))}
    {snow > 0 ? (
      <mesh position={[0, 0.12 + snow * 0.08, 0]}>
        <BoxG args={[2.7 * Math.min(1, snow * 1.2), 0.16 * snow + 0.02, 1.7]} />
        <Flat color="#F2F6FA" />
      </mesh>
    ) : null}
  </group>
);

/** Raised vegetable beds; `growth` 0..1 grows the plants. */
export const VegGarden: React.FC<{ position: V3; growth: number }> = ({ position, growth }) => (
  <group position={position}>
    {[0, 1, 2].map((r) => (
      <group key={r} position={[0, 0, -4 + r * 4]}>
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <BoxG args={[8, 0.8, 2.4]} />
          <Flat color="#6A4A2E" />
        </mesh>
        <mesh position={[0, 0.82, 0]}>
          <BoxG args={[7.6, 0.06, 2.0]} />
          <Flat color="#4A3424" />
        </mesh>
        {Array.from({ length: 7 }, (_, i) => {
          const g = Math.max(0, growth - random(`veg${r}${i}`) * 0.2);
          return (
            <group key={i} position={[-3.2 + i * 1.07, 0.85, 0]}>
              <mesh position={[0, 0.35 * g, 0]} scale={[g, g, g]} castShadow>
                <IcoG args={[0.5, 1]} />
                <Flat color={r === 1 ? "#4E9A3A" : "#2F7A5A"} />
              </mesh>
              {r === 2 && g > 0.6 ? (
                <mesh position={[0.25, 0.5 * g, 0.2]}>
                  <IcoG args={[0.16, 0]} />
                  <Flat color="#C8372D" />
                </mesh>
              ) : null}
            </group>
          );
        })}
      </group>
    ))}
  </group>
);

/** A small stream: a winding ribbon of water with moving glints. Runs roughly along X at z ≈ zc. */
export const Stream: React.FC<{ t: number; zc?: number; x0?: number; x1?: number; width?: number; frozen?: boolean }> = ({ t, zc = 30, x0 = -120, x1 = 120, width = 5, frozen = false }) => {
  const segs = useMemo(() => {
    const n = 24;
    return Array.from({ length: n }, (_, i) => {
      const xa = x0 + ((x1 - x0) * i) / n;
      const xb = x0 + ((x1 - x0) * (i + 1)) / n;
      const za = zc + Math.sin(xa * 0.04) * 8;
      const zb = zc + Math.sin(xb * 0.04) * 8;
      return { x: (xa + xb) / 2, z: (za + zb) / 2, len: Math.hypot(xb - xa, zb - za), yaw: -Math.atan2(zb - za, xb - xa) };
    });
  }, [zc, x0, x1]);
  return (
    <group>
      {segs.map((s, i) => (
        <group key={i} position={[s.x, 0.04, s.z]} rotation={[0, s.yaw, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[s.len + 0.6, width]} />
            <Flat color={frozen ? "#C8DCEC" : "#3A7A9A"} />
          </mesh>
          {!frozen
            ? [0, 1].map((g) => (
                <mesh key={g} position={[((t * 3 + i * 1.7 + g * 4) % s.len) - s.len / 2, 0.02, (g - 0.5) * width * 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[1.4, 0.12]} />
                  <Glow color="#CFEAF8" opacity={0.7} />
                </mesh>
              ))
            : null}
          {/* stones on the banks */}
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[(random(`st${i}${sd}`) - 0.5) * s.len, 0.2, (sd * width) / 2 + sd * 0.3]} castShadow>
              <IcoG args={[0.5 + random(`ss${i}${sd}`) * 0.4, 0]} />
              <Flat color="#8A8E88" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

/** Inside the homestead: back wall (z = -6) with a stone fireplace at x = -4, shelves of jars at x = 5, a table. */
export const ROOM = { hearth: [-4, 0, -5.2] as V3, pot: [-4, 2.0, -4.6] as V3, shelf: [6, 0, -5.6] as V3, table: [1, 0, 1] as V3, tableTop: 2.0, window: [1.5, 5, -5.95] as V3 };

export const HomesteadRoom: React.FC<{
  t: number;
  fire?: number;
  jars?: number;
  window?: string;
  rain?: boolean;
  candle?: boolean;
  /** Messy dishes and clutter (loneliness). */
  clutter?: number;
  /** Tally marks on the wall calendar (days). */
  tally?: number;
}> = ({ t, fire = 1, jars = 12, window = "#BFD8F0", clutter = 0, tally = 0 }) => {
  const F = ROOM.hearth;
  return (
    <group>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[24, 0.1, 16]} />
        <Flat color="#7A5A3E" />
      </mesh>
      <mesh position={[0, 5, -6.1]} receiveShadow>
        <BoxG args={[24, 10, 0.2]} />
        <Flat color="#C8AE84" />
      </mesh>
      {[-12, 12].map((x) => (
        <mesh key={x} position={[x, 5, 1.9]} receiveShadow>
          <BoxG args={[0.2, 10, 16]} />
          <Flat color="#B89A70" />
        </mesh>
      ))}
      {/* beams */}
      {[-6, 0, 6].map((x) => (
        <mesh key={x} position={[x, 9.4, 1.5]}>
          <BoxG args={[0.6, 0.6, 16]} />
          <Flat color="#5A3A24" />
        </mesh>
      ))}
      {/* rug */}
      <mesh position={[0, 0.02, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 6]} />
        <Flat color="#8A3A3A" />
      </mesh>
      {/* window */}
      <mesh position={ROOM.window}>
        <planeGeometry args={[3.2, 2.6]} />
        <Glow color={window} />
      </mesh>
      <mesh position={[ROOM.window[0], ROOM.window[1], ROOM.window[2] + 0.06]}>
        <planeGeometry args={[0.12, 2.6]} />
        <Flat color="#5A3A24" />
      </mesh>
      <mesh position={[ROOM.window[0], ROOM.window[1], ROOM.window[2] + 0.06]}>
        <planeGeometry args={[3.2, 0.12]} />
        <Flat color="#5A3A24" />
      </mesh>
      {/* fireplace: stone surround, hearth, fire, hanging pot */}
      <group position={F}>
        <mesh position={[0, 2.6, -0.3]} castShadow receiveShadow>
          <BoxG args={[5.6, 5.2, 1.4]} />
          <Flat color="#8A847A" />
        </mesh>
        <mesh position={[0, 1.4, 0.32]}>
          <BoxG args={[3.2, 2.6, 0.2]} />
          <Flat color="#1A1614" />
        </mesh>
        <mesh position={[0, 5.6, -0.5]} castShadow>
          <BoxG args={[3.6, 3, 1]} />
          <Flat color="#7A746A" />
        </mesh>
        <mesh position={[0, 0.1, 1.0]} receiveShadow>
          <BoxG args={[6, 0.2, 1.6]} />
          <Flat color="#6A645A" />
        </mesh>
        {fire > 0 ? (
          <>
            <Fireball position={[0, 0.6, 0.55]} progress={0.3 + 0.05 * Math.sin(t * 5)} radius={0.5 * fire} seed="hearth" />
            <pointLight position={[0, 1.4, 2.2]} color="#FF9A3A" intensity={(26 + 6 * Math.sin(t * 9) * Math.sin(t * 3.3)) * fire} distance={18} decay={2} />
            <Halo position={[0, 1, 0.8]} size={4} color="#FF8A2A" opacity={0.4 * fire} />
          </>
        ) : null}
        {[-0.5, 0.5].map((x) => (
          <mesh key={x} position={[x, 0.4, 0.5]} rotation={[0, 0, Math.PI / 2 + x]} castShadow>
            <CylG args={[0.18, 0.18, 1.6, 6]} />
            <Flat color="#4A2E1E" />
          </mesh>
        ))}
      </group>
      {/* pot on a hook */}
      <group position={ROOM.pot}>
        <mesh castShadow>
          <CylG args={[0.55, 0.45, 0.8, 10]} />
          <Flat color="#2A2A2E" />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <CylG args={[0.03, 0.03, 1.2, 4]} />
          <Flat color="#2A2A2E" />
        </mesh>
      </group>
      {/* shelves of jars */}
      <group position={ROOM.shelf}>
        {[1.6, 3.2, 4.8].map((y) => (
          <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
            <BoxG args={[7, 0.14, 1.0]} />
            <Flat color="#6A4A2E" />
          </mesh>
        ))}
        {Array.from({ length: Math.min(jars, 24) }, (_, i) => (
          <group key={i} position={[-3 + (i % 8) * 0.85, [1.6, 3.2, 4.8][Math.floor(i / 8)] + 0.42, 0]}>
            <mesh castShadow>
              <CylG args={[0.3, 0.3, 0.7, 8]} />
              <meshLambertMaterial color={["#C8372D", "#E0B04E", "#4E9A3A", "#8A3A6A"][i % 4]} transparent opacity={0.85} flatShading />
            </mesh>
            <mesh position={[0, 0.4, 0]}>
              <CylG args={[0.32, 0.32, 0.1, 8]} />
              <Flat color="#C8A44A" />
            </mesh>
          </group>
        ))}
      </group>
      {/* table + chair */}
      <group position={ROOM.table}>
        <mesh position={[0, ROOM.tableTop - 0.08, 0]} castShadow receiveShadow>
          <BoxG args={[4.4, 0.16, 2.6]} />
          <Flat color="#8A5A34" />
        </mesh>
        {[
          [-2, -1.1],
          [2, -1.1],
          [-2, 1.1],
          [2, 1.1],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, (ROOM.tableTop - 0.16) / 2, z]} castShadow>
            <BoxG args={[0.16, ROOM.tableTop - 0.16, 0.16]} />
            <Flat color="#5A3A24" />
          </mesh>
        ))}
        {clutter > 0
          ? Array.from({ length: Math.round(clutter * 7) }, (_, i) => (
              <mesh key={i} position={[-1.6 + random(`cl${i}`) * 3.2, ROOM.tableTop + 0.1, -0.8 + random(`clz${i}`) * 1.6]} castShadow>
                {i % 2 ? <CylG args={[0.35, 0.3, 0.1, 10]} /> : <CylG args={[0.14, 0.12, 0.35, 8]} />}
                <Flat color={i % 3 ? "#E8E2D4" : "#9AA1B0"} />
              </mesh>
            ))
          : null}
      </group>
      {/* wall calendar with tally marks */}
      {tally > 0 ? <CanvasPanel position={[7.5, 6.6, -5.98]} w={2.6} h={2.0} px={420} draw={drawTally(tally)} /> : null}
    </group>
  );
};

const drawTally = (n: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#F4F0E2";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#2A2A3A";
  ctx.lineWidth = W * 0.012;
  for (let i = 0; i < n; i++) {
    const g = Math.floor(i / 5);
    const k = i % 5;
    const gx = W * 0.08 + (g % 6) * W * 0.15;
    const gy = H * 0.12 + Math.floor(g / 6) * H * 0.2;
    ctx.beginPath();
    if (k < 4) {
      ctx.moveTo(gx + k * W * 0.025, gy);
      ctx.lineTo(gx + k * W * 0.025, gy + H * 0.14);
    } else {
      ctx.moveTo(gx - W * 0.01, gy + H * 0.12);
      ctx.lineTo(gx + W * 0.09, gy + H * 0.02);
    }
    ctx.stroke();
  }
};

/** A paper map with circled places and routes (drawn on a canvas panel). */
export const drawMap = (k: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#EDE4CC";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#B8D4A8";
  ctx.beginPath();
  ctx.ellipse(W * 0.7, H * 0.35, W * 0.25, H * 0.22, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#9AC0D8";
  ctx.fillRect(0, H * 0.62, W, H * 0.05);
  ctx.strokeStyle = "#C8A87A";
  ctx.lineWidth = W * 0.008;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(W * (0.05 + i * 0.16), 0);
    ctx.lineTo(W * (0.1 + i * 0.15), H);
    ctx.stroke();
  }
  ctx.fillStyle = "#8A8E98";
  for (let i = 0; i < 30; i++) ctx.fillRect(W * (0.08 + (i % 6) * 0.05), H * (0.15 + Math.floor(i / 6) * 0.06), W * 0.035, H * 0.04);
  ctx.strokeStyle = "#C8372D";
  ctx.lineWidth = W * 0.012;
  const circles: [number, number][] = [
    [0.72, 0.35],
    [0.5, 0.75],
    [0.3, 0.4],
  ];
  circles.forEach(([x, y], i) => {
    if (k * 3 < i + 0.3) return;
    ctx.beginPath();
    ctx.arc(W * x, H * y, W * 0.06, 0, Math.PI * 2 * Math.min(1, k * 3 - i));
    ctx.stroke();
  });
  ctx.fillStyle = "#1A2A5A";
  ctx.font = CANVAS_FONT(H * 0.05);
  ctx.fillText("FARM + STREAM", W * 0.6, H * 0.24);
};

/** A backpack worn by Slavoski: place at the hero's root with the same yaw. */
export const Backpack: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 2.75, -0.62]} castShadow>
      <BoxG args={[1.0, 1.25, 0.5]} />
      <Flat color="#3A5A3E" />
    </mesh>
    <mesh position={[0, 2.25, -0.88]} castShadow>
      <BoxG args={[0.8, 0.5, 0.2]} />
      <Flat color="#2E4A32" />
    </mesh>
    <mesh position={[0, 3.45, -0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <CylG args={[0.22, 0.22, 1.0, 8]} />
      <Flat color="#8A3A3A" />
    </mesh>
  </group>
);

/** Shed shelves (tools on a pegboard, batteries, first-aid kit). Back at z = 0, facing +Z. */
export const ShedWall: React.FC<{ stock?: number }> = ({ stock = 1 }) => (
  <group>
    <mesh position={[0, 4, -0.2]} receiveShadow>
      <BoxG args={[12, 8, 0.2]} />
      <Flat color="#C8A87A" />
    </mesh>
    {/* pegboard tools */}
    {[
      [-4, 5.6, 0.3, 1.8, "#8A909C"],
      [-3, 5.4, 0.2, 2.2, "#C8372D"],
      [-2, 5.7, 0.4, 1.4, "#E0B04E"],
      [-1, 5.5, 0.25, 2.0, "#8A909C"],
    ].map(([x, y, w, h, c], i) => (
      <mesh key={i} position={[x as number, y as number, 0]} castShadow>
        <BoxG args={[w as number, h as number, 0.15]} />
        <Flat color={c as string} />
      </mesh>
    ))}
    {[1.4, 3.0].map((y) => (
      <mesh key={y} position={[2.5, y, 0.4]} castShadow>
        <BoxG args={[6, 0.14, 1.0]} />
        <Flat color="#7A5A3E" />
      </mesh>
    ))}
    {Array.from({ length: Math.round(8 * stock) }, (_, i) => (
      <mesh key={i} position={[0.2 + (i % 4) * 1.4, [1.4, 3.0][Math.floor(i / 4)] + 0.35, 0.4]} castShadow>
        <BoxG args={[1.0, 0.6, 0.7]} />
        <Flat color={["#2A2A30", "#E0B04E", "#2A2A30", "#3E5A6A"][i % 4]} />
      </mesh>
    ))}
    <group position={[4.2, 3.0, 0.5]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <BoxG args={[1.2, 0.7, 0.8]} />
        <Flat color="#2F7A5A" />
      </mesh>
      <mesh position={[0, 0.35, 0.41]}>
        <planeGeometry args={[0.5, 0.14]} />
        <Flat color="#F2F2EE" />
      </mesh>
      <mesh position={[0, 0.35, 0.41]} rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[0.5, 0.14]} />
        <Flat color="#F2F2EE" />
      </mesh>
    </group>
  </group>
);

/** Shortwave radio on a table, dial glowing. Front faces +Z. */
export const Radio: React.FC<{ position: V3; t: number; on?: boolean }> = ({ position, t, on = true }) => (
  <group position={position}>
    <mesh position={[0, 0.5, 0]} castShadow>
      <BoxG args={[1.8, 1.0, 0.8]} />
      <Flat color="#5A402C" />
    </mesh>
    <mesh position={[-0.35, 0.55, 0.41]}>
      <planeGeometry args={[0.8, 0.5]} />
      {on ? <Glow color="#FFC060" /> : <Flat color="#2A2A2E" />}
    </mesh>
    <mesh position={[-0.35 - 0.3 + ((t * 0.15) % 0.6), 0.55, 0.42]}>
      <planeGeometry args={[0.03, 0.45]} />
      <Flat color="#C8372D" />
    </mesh>
    {[0.45, 0.7].map((x) => (
      <mesh key={x} position={[x, 0.55, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
        <CylG args={[0.12, 0.12, 0.1, 10]} />
        <Flat color="#2A2A2E" />
      </mesh>
    ))}
    <mesh position={[0.7, 1.6, 0]} rotation={[0, 0, -0.3]}>
      <CylG args={[0.02, 0.02, 1.4, 4]} />
      <Flat color="#C8CCD4" />
    </mesh>
    {on ? <pointLight position={[0, 1, 1]} color="#FFC060" intensity={2} distance={3} decay={2} /> : null}
  </group>
);

/** A small campfire with stones. */
export const Campfire: React.FC<{ position: V3; t: number; size?: number }> = ({ position, t, size = 1 }) => (
  <group position={position} scale={size}>
    {Array.from({ length: 8 }, (_, i) => (
      <mesh key={i} position={[Math.cos((i / 8) * Math.PI * 2) * 1.2, 0.25, Math.sin((i / 8) * Math.PI * 2) * 1.2]} castShadow>
        <IcoG args={[0.35, 0]} />
        <Flat color="#7A7670" />
      </mesh>
    ))}
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[0, 0.3, 0]} rotation={[0, (i * Math.PI) / 3, Math.PI / 2 - 0.3]} castShadow>
        <CylG args={[0.12, 0.12, 1.8, 6]} />
        <Flat color="#4A2E1E" />
      </mesh>
    ))}
    <Fireball position={[0, 0.7, 0]} progress={0.3 + 0.06 * Math.sin(t * 6)} radius={0.9} seed="camp" />
    <Halo position={[0, 1.0, 0]} size={6} color="#FF8A2A" opacity={0.45} />
    <pointLight position={[0, 1.6, 0]} color="#FF8A3A" intensity={40 + 8 * Math.sin(t * 11) * Math.sin(t * 4.1)} distance={30} decay={2} />
    {Array.from({ length: 6 }, (_, i) => {
      const ph = (t * 0.6 + i / 6) % 1;
      return (
        <mesh key={`e${i}`} position={[Math.sin(i * 2.3 + t) * 0.4 * ph, 1 + ph * 4, Math.cos(i * 1.7) * 0.4 * ph]}>
          <IcoG args={[0.05, 0]} />
          <Glow color="#FFC060" opacity={1 - ph} />
        </mesh>
      );
    })}
  </group>
);

export { ConeG, P };
