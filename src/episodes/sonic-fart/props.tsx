/**
 * Props for "What If You Farted at the Speed of Sound?" (ep. 8). PG throughout: the gas is a cartoon
 * yellow-green puff, the X-ray shows a balloon, the trousers rip is a dark tear.
 *
 * Scale: Slavoski is 4.2 tall (≈ 1.8 m), so 1 unit ≈ 0.43 m. Tables top out at ~1.55, chair seats at 0.72,
 * doors are ~5 tall and rooms ~12–14 high.
 */
import React, { useMemo } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { BoxG, CircleG, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { heroParts, type Pose } from "../../slavoski/rig/Hero";
import { CANVAS_FONT, CanvasPanel, fitText } from "../../slavoski/screens";

const rnd = (s: string, a = 0, b = 1) => a + random(s) * (b - a);

// ---------------------------------------------------------------- gas, rings, vapour

/** A cartoon fart: a cluster of yellow-green faceted puffs that wobble. */
export const GasPuff: React.FC<{ position: V3; size?: number; t?: number; seed?: string; opacity?: number; count?: number; stretch?: V3 }> = ({
  position,
  size = 0.5,
  t = 0,
  seed = "gas",
  opacity = 0.92,
  count = 8,
  stretch = [1, 1, 1],
}) => {
  if (size <= 0.001 || opacity <= 0.01) return null;
  return (
    <group position={position} scale={stretch}>
      {Array.from({ length: count }, (_, i) => {
        const a = rnd(`${seed}a${i}`, 0, Math.PI * 2);
        const e = rnd(`${seed}e${i}`, -0.9, 0.9);
        const d = i === 0 ? 0 : size * rnd(`${seed}d${i}`, 0.35, 0.75);
        const r = size * rnd(`${seed}r${i}`, 0.38, 0.62) * (1 + 0.07 * Math.sin(t * 7 + i * 1.7));
        return (
          <mesh key={i} position={[Math.cos(a) * d * Math.cos(e), Math.sin(e) * d, Math.sin(a) * d * Math.cos(e)]} rotation={[i, i * 1.3, 0]}>
            <IcoG args={[r, 1]} />
            <Flat color={i % 3 === 1 ? P.gasDark : P.gas} opacity={opacity} />
          </mesh>
        );
      })}
    </group>
  );
};

/** A flat ring (a shock front), facing +Z unless rotated. */
export const Ring: React.FC<{ position: V3; rotation?: V3; radius: number; width?: number; color?: string; opacity?: number }> = ({
  position,
  rotation = [0, 0, 0],
  radius,
  width = 0.12,
  color = P.vapour,
  opacity = 0.8,
}) =>
  radius <= 0.01 || opacity <= 0.01 ? null : (
    <mesh position={position} rotation={rotation}>
      <ringGeometry args={[Math.max(0.005, radius - width), radius, 64]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );

/** A blast: a ground ring, an upright ring and a vapour shell, all growing with `p` (0..1). */
export const Blast: React.FC<{ position: V3; p: number; radius?: number; color?: string }> = ({ position, p, radius = 6, color = P.vapour }) => {
  if (p <= 0 || p >= 1) return null;
  const r = radius * ease(p);
  const o = (1 - p) ** 1.4;
  return (
    <group position={position}>
      <Ring position={[0, 0.05 - position[1], 0]} rotation={[-Math.PI / 2, 0, 0]} radius={r * 1.15} width={0.25 + r * 0.06} color={color} opacity={0.85 * o} />
      <Ring position={[0, 0, 0]} radius={r} width={0.18 + r * 0.05} color={color} opacity={0.7 * o} />
      <mesh scale={r * 0.85}>
        <IcoG args={[1, 2]} />
        <meshBasicMaterial color={color} transparent opacity={0.16 * o} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

/** A vapour cone (the white "shock collar" at Mach 1): apex at the origin, opening along +Z. */
export const VapourCone: React.FC<{ position: V3; rotation?: V3; length?: number; radius?: number; p: number }> = ({ position, rotation = [0, 0, 0], length = 1.6, radius = 1.0, p }) => {
  if (p <= 0) return null;
  const o = clamp01(p < 0.25 ? p / 0.25 : 1 - (p - 0.25) / 0.75);
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, (length * (0.6 + 0.4 * p)) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <ConeG args={[radius * (0.7 + 0.5 * p), length * (0.6 + 0.4 * p), 14, 1, true]} />
        <meshBasicMaterial color={P.vapour} transparent opacity={0.55 * o} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------- confetti, flying paper

const CONFETTI = [P.amber, P.cream, "#6FB8FF", P.carRed, "#7FD6A0", "#C85A8A"];

/** Confetti falling through a box (centre, size), fluttering. `t` seconds since it started. */
export const Confetti: React.FC<{ center: V3; size?: [number, number, number]; t: number; count?: number; seed?: string; fall?: number }> = ({
  center,
  size = [10, 8, 6],
  t,
  count = 160,
  seed = "conf",
  fall = 2.2,
}) => (
  <group position={center}>
    {Array.from({ length: count }, (_, i) => {
      const x0 = rnd(`${seed}x${i}`, -0.5, 0.5) * size[0];
      const z0 = rnd(`${seed}z${i}`, -0.5, 0.5) * size[2];
      const y0 = size[1] / 2 + rnd(`${seed}y${i}`, 0, 1) * size[1] * 0.6;
      const v = fall * rnd(`${seed}v${i}`, 0.7, 1.3);
      const y = Math.max(0.02 - center[1], y0 - v * t);
      const sway = Math.sin(t * 4 + i) * 0.3;
      return (
        <mesh key={i} position={[x0 + sway, y, z0]} rotation={[t * 5 + i, t * 3 + i * 0.7, i]}>
          <planeGeometry args={[0.16, 0.24]} />
          <meshBasicMaterial color={CONFETTI[i % CONFETTI.length]} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      );
    })}
  </group>
);

/** Sheets of paper blown off a table: fly out, then flutter down to the floor (y = 0). */
export const FlyingPapers: React.FC<{ origin: V3; t: number; count?: number; seed?: string; speed?: number }> = ({ origin, t, count = 14, seed = "paper", speed = 5 }) => {
  if (t <= 0) return null;
  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const a = rnd(`${seed}a${i}`, 0, Math.PI * 2);
        const sp = speed * rnd(`${seed}s${i}`, 0.5, 1.2);
        const out = (sp * (1 - Math.exp(-2 * t))) / 2;
        const up = rnd(`${seed}u${i}`, 1.5, 4) * (1 - Math.exp(-3 * t)) - 0.75 * t;
        const y = Math.max(0.02, origin[1] + up);
        const settled = y <= 0.021;
        return (
          <mesh
            key={i}
            position={[origin[0] + Math.cos(a) * out + (settled ? 0 : Math.sin(t * 3 + i) * 0.25), y, origin[2] + Math.sin(a) * out]}
            rotation={settled ? [-Math.PI / 2, 0, i] : [Math.sin(t * 4 + i) * 1.2 - Math.PI / 2, i, Math.cos(t * 3 + i) * 0.8]}
          >
            <planeGeometry args={[0.5, 0.7]} />
            <Flat color="#F4F1E8" side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Books blown off a table: ballistic, spinning, coming to rest on the floor. */
export const FlyingBooks: React.FC<{ origin: V3; t: number; count?: number; seed?: string; speed?: number }> = ({ origin, t, count = 8, seed = "book", speed = 6 }) => {
  if (t <= 0) return null;
  const g = 12;
  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const a = rnd(`${seed}a${i}`, 0, Math.PI * 2);
        const sp = speed * rnd(`${seed}s${i}`, 0.6, 1.2);
        const vy = rnd(`${seed}u${i}`, 3, 7);
        const thick = 0.18;
        const tl = (vy + Math.sqrt(vy * vy + 2 * g * Math.max(0, origin[1] - thick / 2))) / g;
        const tt = Math.min(t, tl);
        const y = Math.max(thick / 2, origin[1] + vy * tt - 0.5 * g * tt * tt);
        const done = t >= tl;
        return (
          <group key={i} position={[origin[0] + Math.cos(a) * sp * tt, y, origin[2] + Math.sin(a) * sp * tt]} rotation={done ? [0, i, 0] : [tt * 9 + i, tt * 6, tt * 4]}>
            <mesh castShadow>
              <BoxG args={[0.62, thick, 0.85]} />
              <Flat color={BOOKS[i % BOOKS.length]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// ---------------------------------------------------------------- the library (cold open)

const BOOKS = ["#8A3A3A", "#2E5A6A", "#C9A46A", "#3A6A4A", "#5A4A78", "#E0B04E", "#24748F", "#7A6A5A", "#C8372D", "#E8E4DA"];
const WOOD = "#5A3A28";
const WOOD_LIGHT = "#7A5236";

/** A bookshelf unit facing +Z: frame plus seeded rows of book spines. */
export const Bookshelf: React.FC<{ position: V3; yaw?: number; w?: number; h?: number; d?: number; rows?: number; seed?: string }> = ({
  position,
  yaw = 0,
  w = 4.4,
  h = 7.6,
  d = 1.2,
  rows = 6,
  seed = "shelf",
}) => {
  const books = useMemo(() => {
    const out: { x: number; y: number; bw: number; bh: number; c: string; tilt: number }[] = [];
    const gap = (h - 0.5) / rows;
    for (let r = 0; r < rows; r++) {
      let x = -w / 2 + 0.22;
      let k = 0;
      while (x < w / 2 - 0.3) {
        const bw = rnd(`${seed}w${r}_${k}`, 0.14, 0.3);
        const bh = gap * rnd(`${seed}h${r}_${k}`, 0.55, 0.85);
        if (random(`${seed}gap${r}_${k}`) < 0.06) {
          x += 0.35;
          k++;
          continue;
        }
        out.push({ x: x + bw / 2, y: 0.35 + r * gap + bh / 2, bw, bh, c: BOOKS[Math.floor(random(`${seed}c${r}_${k}`) * BOOKS.length)], tilt: random(`${seed}t${r}_${k}`) < 0.05 ? 0.25 : 0 });
        x += bw + 0.01;
        k++;
      }
    }
    return out;
  }, [w, h, rows, seed]);
  const gap = (h - 0.5) / rows;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, h / 2, -d / 2 + 0.05]} receiveShadow>
        <BoxG args={[w, h, 0.1]} />
        <Flat color="#3E281C" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * (w - 0.16)) / 2, h / 2, 0]} castShadow receiveShadow>
          <BoxG args={[0.16, h, d]} />
          <Flat color={WOOD} />
        </mesh>
      ))}
      <mesh position={[0, h - 0.08, 0.04]} castShadow>
        <BoxG args={[w + 0.2, 0.18, d + 0.1]} />
        <Flat color={WOOD_LIGHT} />
      </mesh>
      {Array.from({ length: rows + 1 }, (_, r) => (
        <mesh key={r} position={[0, 0.27 + r * gap, 0]} receiveShadow>
          <BoxG args={[w - 0.2, 0.08, d - 0.1]} />
          <Flat color={WOOD_LIGHT} />
        </mesh>
      ))}
      {books.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, 0.02]} rotation={[0, 0, b.tilt]}>
          <BoxG args={[b.bw, b.bh, d * 0.78]} />
          <Flat color={b.c} />
        </mesh>
      ))}
    </group>
  );
};

/** A green banker's lamp (warm glow under the shade). */
export const DeskLamp: React.FC<{ position: V3; on?: boolean }> = ({ position, on = true }) => (
  <group position={position}>
    <mesh position={[0, 0.04, 0]}>
      <CylG args={[0.22, 0.25, 0.08, 10]} />
      <Flat color="#C9A46A" />
    </mesh>
    <mesh position={[0, 0.35, 0]}>
      <CylG args={[0.03, 0.03, 0.6, 6]} />
      <Flat color="#C9A46A" />
    </mesh>
    <mesh position={[0, 0.68, 0.08]} rotation={[0, 0, Math.PI / 2]}>
      <CylG args={[0.18, 0.18, 0.75, 10, 1, true]} />
      <Flat color="#1F6E4A" side={THREE.DoubleSide} />
    </mesh>
    {on ? (
      <>
        <mesh position={[0, 0.6, 0.08]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.7, 0.24]} />
          <Glow color="#FFE3A0" />
        </mesh>
        <Halo position={[0, 0.5, 0.1]} size={2.2} color={P.lampGlow} opacity={0.45} />
      </>
    ) : null}
  </group>
);

/** A long reading table (top at `top`), wood, four chunky legs. */
export const ReadingTable: React.FC<{ position: V3; w?: number; d?: number; top?: number; yaw?: number; color?: string }> = ({ position, w = 7, d = 2.4, top = 1.5, yaw = 0, color = WOOD_LIGHT }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, top - 0.07, 0]} castShadow receiveShadow>
      <BoxG args={[w, 0.14, d]} />
      <Flat color={color} />
    </mesh>
    {[-1, 1].map((sx) =>
      [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 0.3), (top - 0.14) / 2, sz * (d / 2 - 0.25)]} castShadow>
          <BoxG args={[0.2, top - 0.14, 0.2]} />
          <Flat color={WOOD} />
        </mesh>
      )),
    )}
  </group>
);

/** A backless bench (seat top 0.72), along X. */
export const Bench: React.FC<{ position: V3; w?: number; yaw?: number }> = ({ position, w = 4, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.66, 0]} castShadow receiveShadow>
      <BoxG args={[w, 0.12, 1.0]} />
      <Flat color={WOOD} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * (w / 2 - 0.25), 0.3, 0]} castShadow>
        <BoxG args={[0.16, 0.6, 0.8]} />
        <Flat color="#3E281C" />
      </mesh>
    ))}
  </group>
);

/** A stack of closed books on a table (base at y = 0 of the group). */
export const BookStack: React.FC<{ position: V3; n?: number; seed?: string; yaw?: number }> = ({ position, n = 3, seed = "stack", yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    {Array.from({ length: n }, (_, i) => (
      <mesh key={i} position={[rnd(`${seed}x${i}`, -0.06, 0.06), 0.09 + i * 0.18, 0]} rotation={[0, rnd(`${seed}r${i}`, -0.25, 0.25), 0]} castShadow>
        <BoxG args={[0.62, 0.17, 0.85]} />
        <Flat color={BOOKS[(i * 3 + Math.floor(random(seed) * 5)) % BOOKS.length]} />
      </mesh>
    ))}
  </group>
);

/** An open book lying on a table (base at the group origin). */
export const OpenBook: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.34, 0.04, 0]} rotation={[0, 0, -s * 0.08]} castShadow>
        <BoxG args={[0.66, 0.06, 0.9]} />
        <Flat color="#F2EEE2" />
      </mesh>
    ))}
    <mesh position={[0, 0.01, 0]}>
      <BoxG args={[1.42, 0.03, 0.96]} />
      <Flat color="#8A3A3A" />
    </mesh>
  </group>
);

const drawQuiet = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#1A2420";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#C9A46A";
  ctx.lineWidth = H * 0.06;
  ctx.strokeRect(H * 0.06, H * 0.06, W - H * 0.12, H - H * 0.12);
  fitText(ctx, "QUIET PLEASE", W / 2, H * 0.53, W * 0.84, H * 0.5, "#F2E6C4");
};

/**
 * The library: deep-green walls, tall sunny windows with light shafts, bookshelves, a librarian's desk.
 * Reading table for Slavoski at the origin (he sits on the bench at z = 0, facing +Z).
 */
export const LIB = { tableZ: 1.75, tableTop: 1.5 };
export const Library: React.FC<{ beams?: number }> = ({ beams = 1 }) => (
  <group>
    {/* floor, rug */}
    <mesh position={[0, -0.1, 0]} receiveShadow>
      <BoxG args={[60, 0.2, 50]} />
      <Flat color="#6A4A34" />
    </mesh>
    {Array.from({ length: 14 }, (_, i) => (
      <mesh key={i} position={[-26 + i * 4, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.05, 50]} />
        <Flat color="#5A3E2C" />
      </mesh>
    ))}
    <mesh position={[0, 0.006, -1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[11, 16]} />
      <Flat color="#7A2E2E" />
    </mesh>
    {/* back wall with two tall windows (x = ±5, 3.4 wide) */}
    {[
      [-18.35, 23.3],
      [0, 6.6],
      [18.35, 23.3],
    ].map(([x, w], i) => (
      <mesh key={i} position={[x, 8, -9.2]} receiveShadow>
        <BoxG args={[w, 16, 0.4]} />
        <Flat color="#2C4A40" />
      </mesh>
    ))}
    {[-1, 1].map((s) => (
      <group key={s} position={[s * 5, 0, -9.2]}>
        <mesh position={[0, 1.7, 0]} receiveShadow>
          <BoxG args={[3.4, 3.4, 0.4]} />
          <Flat color="#2C4A40" />
        </mesh>
        <mesh position={[0, 14, 0]} receiveShadow>
          <BoxG args={[3.4, 4, 0.4]} />
          <Flat color="#2C4A40" />
        </mesh>
        <mesh position={[0, 7.7, -0.25]}>
          <planeGeometry args={[3.4, 8.6]} />
          <Glow color="#DCEFFA" />
        </mesh>
        {/* mullions */}
        <mesh position={[0, 7.7, 0]}>
          <BoxG args={[0.14, 8.6, 0.3]} />
          <Flat color="#E8E0CC" />
        </mesh>
        {[5.2, 7.7, 10.2].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <BoxG args={[3.4, 0.14, 0.3]} />
            <Flat color="#E8E0CC" />
          </mesh>
        ))}
        <mesh position={[0, 3.4, 0.25]}>
          <BoxG args={[3.8, 0.2, 0.6]} />
          <Flat color="#E8E0CC" />
        </mesh>
        <Halo position={[0, 7.7, 0.2]} size={9} color="#FFF6DC" opacity={0.35} />
        {/* light shaft from the window to the floor */}
        {beams > 0 ? (
          <mesh position={[s * -0.6, 3.9, 4.1]} rotation={[2.25, 0, 0]}>
            <planeGeometry args={[3.2, 11]} />
            <meshBasicMaterial color="#FFF2C8" transparent opacity={0.09 * beams} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        ) : null}
      </group>
    ))}
    {/* side walls */}
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 18, 8, 0]} receiveShadow>
        <BoxG args={[0.4, 16, 50]} />
        <Flat color="#2A443B" />
      </mesh>
    ))}
    {/* shelves along the back wall, between and beside the windows */}
    <Bookshelf position={[0, 0, -8.4]} w={6} h={5.2} rows={4} seed="midshelf" />
    {[-1, 1].map((s) => (
      <React.Fragment key={s}>
        <Bookshelf position={[s * 9.2, 0, -8.4]} w={4.6} h={9.5} rows={8} seed={`bs${s}`} />
        <Bookshelf position={[s * 13.9, 0, -8.4]} w={4.6} h={9.5} rows={8} seed={`bt${s}`} />
        <Bookshelf position={[s * 11.5, 0, -2]} yaw={-s * Math.PI / 2} w={6} h={7.6} rows={6} seed={`side${s}`} />
        <Bookshelf position={[s * 11.5, 0, 5]} yaw={-s * Math.PI / 2} w={6} h={7.6} rows={6} seed={`side2${s}`} />
      </React.Fragment>
    ))}
    <CanvasPanel position={[0, 6.6, -8.98]} w={4.6} h={1.15} px={900} draw={drawQuiet} />
    {/* a wall clock and a globe on the middle shelf */}
    <mesh position={[0, 5.62, -8.3]}>
      <IcoG args={[0.42, 2]} />
      <Flat color="#2F7A5A" />
    </mesh>
    {/* ceiling lamps */}
    {[-6, 0, 6].map((x) => (
      <group key={x} position={[x, 12.5, -2]}>
        <mesh position={[0, 1.6, 0]}>
          <CylG args={[0.03, 0.03, 3.2, 4]} />
          <Flat color="#2A2A30" />
        </mesh>
        <mesh>
          <ConeG args={[0.7, 0.5, 10, 1, true]} />
          <Flat color="#C9A46A" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.2, 0]}>
          <IcoG args={[0.22, 1]} />
          <Glow color="#FFE9B0" />
        </mesh>
        <Halo position={[0, -0.3, 0]} size={3} color={P.lampGlow} opacity={0.4} />
      </group>
    ))}
    {/* librarian's desk */}
    <group position={[3.6, 0, -4.7]}>
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <BoxG args={[4.4, 1.7, 1.3]} />
        <Flat color={WOOD} />
      </mesh>
      <mesh position={[0, 1.74, 0]} castShadow>
        <BoxG args={[4.6, 0.1, 1.5]} />
        <Flat color={WOOD_LIGHT} />
      </mesh>
      <BookStack position={[-1.4, 1.79, 0]} n={4} seed="desk" />
      <DeskLamp position={[1.4, 1.79, -0.1]} />
      <mesh position={[0.3, 1.86, 0.2]}>
        <CylG args={[0.16, 0.2, 0.14, 10]} />
        <Flat color="#C9A46A" />
      </mesh>
    </group>
    {/* a second table behind on the left */}
    <ReadingTable position={[-6, 0, -3.6]} w={5} d={2.2} />
    <Bench position={[-6, 0, -5.3]} w={4.4} />
    <DeskLamp position={[-6, 1.5, -3.6]} />
    <BookStack position={[-7.6, 1.5, -3.4]} n={2} seed="t2" />
  </group>
);

// ---------------------------------------------------------------- salt flat (chapter 1)

/** A bright salt flat: pale cracked ground, a test-range line of flags and far purple mountains. */
export const SaltFlat: React.FC<{ tint?: string; flags?: boolean }> = ({ tint = "#ECE6D8", flags = true }) => {
  const cracks = useMemo(
    () =>
      Array.from({ length: 140 }, (_, i) => ({
        x: rnd(`cx${i}`, -60, 60),
        z: rnd(`cz${i}`, -90, 30),
        l: rnd(`cl${i}`, 2, 6),
        r: rnd(`cr${i}`, 0, Math.PI),
      })),
    [],
  );
  return (
    <group>
      <mesh position={[0, -0.1, -200]} receiveShadow>
        <BoxG args={[1400, 0.2, 900]} />
        <Flat color={tint} />
      </mesh>
      {cracks.map((c, i) => (
        <mesh key={i} position={[c.x, 0.004, c.z]} rotation={[-Math.PI / 2, 0, c.r]}>
          <planeGeometry args={[c.l, 0.06]} />
          <Flat color="#CFC6B2" />
        </mesh>
      ))}
      {/* far mountains: a purple-grey ring behind */}
      {Array.from({ length: 22 }, (_, i) => {
        const a = -Math.PI * 0.95 + (i / 21) * Math.PI * 0.9 - Math.PI * 0.03;
        const r = rnd(`mr${i}`, 380, 470);
        const h = rnd(`mh${i}`, 50, 120);
        return (
          <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
            <mesh position={[0, h / 2 - 2, 0]} rotation={[0, i, 0]}>
              <ConeG args={[h * rnd(`mw${i}`, 0.9, 1.4), h, 6]} />
              <Flat color={i % 2 ? "#8C8AA6" : "#9C98B2"} />
            </mesh>
          </group>
        );
      })}
      {flags
        ? Array.from({ length: 9 }, (_, i) => (
            <group key={i} position={[-34 + i * 8.5, 0, -40]}>
              <mesh position={[0, 3, 0]}>
                <CylG args={[0.08, 0.08, 6, 5]} />
                <Flat color="#E8E4DA" />
              </mesh>
              <mesh position={[0.7, 5.5, 0]}>
                <BoxG args={[1.4, 0.8, 0.04]} />
                <Flat color={P.carRed} />
              </mesh>
            </group>
          ))
        : null}
    </group>
  );
};

/** An orange traffic cone at hero scale (≈ 70 cm). */
export const TrafficCone: React.FC<{ position: V3 }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 0.05, 0]} castShadow>
      <BoxG args={[1.0, 0.1, 1.0]} />
      <Flat color="#E8862A" />
    </mesh>
    <mesh position={[0, 0.85, 0]} castShadow>
      <ConeG args={[0.42, 1.6, 8]} />
      <Flat color="#F08A2A" />
    </mesh>
    <mesh position={[0, 0.85, 0]}>
      <CylG args={[0.29, 0.33, 0.25, 8]} />
      <Flat color="#F4F4F0" />
    </mesh>
  </group>
);

/** A sound-level meter on a tripod: the dial needle goes 0..1 (1 = pinned in the red). */
export const DbMeter: React.FC<{ position: V3; yaw?: number; value: number; cracked?: boolean }> = ({ position, yaw = 0, value, cracked = false }) => {
  const draw = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    ctx.fillStyle = "#14161E";
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.86, R = W * 0.4;
    ctx.lineWidth = W * 0.05;
    const seg = (a0: number, a1: number, c: string) => {
      ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.arc(cx, cy, R, Math.PI + a0 * Math.PI, Math.PI + a1 * Math.PI);
      ctx.stroke();
    };
    seg(0, 0.55, "#7FD6A0");
    seg(0.55, 0.78, P.amber);
    seg(0.78, 1, "#FF5A4A");
    ctx.fillStyle = "#E8E4DA";
    fitText(ctx, "dB", cx, H * 0.55, W * 0.3, H * 0.16, "#E8E4DA");
    const a = Math.PI + clamp01(value) * Math.PI;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = W * 0.022;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * R * 1.05, cy + Math.sin(a) * R * 1.05);
    ctx.stroke();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cx, cy, W * 0.04, 0, Math.PI * 2);
    ctx.fill();
    if (cracked) {
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = W * 0.008;
      for (let k = 0; k < 7; k++) {
        ctx.beginPath();
        ctx.moveTo(W * 0.62, H * 0.32);
        let x = W * 0.62, y = H * 0.32;
        for (let s = 0; s < 4; s++) {
          const ang = (k / 7) * Math.PI * 2 + s * 0.3;
          x += Math.cos(ang) * W * 0.1;
          y += Math.sin(ang) * H * 0.1;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  };
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.45, 1.25, Math.sin(a) * 0.45]} rotation={[Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35]} castShadow>
            <CylG args={[0.05, 0.05, 2.6, 5]} />
            <Flat color="#2A2A30" />
          </mesh>
        );
      })}
      <mesh position={[0, 3.25, 0]} castShadow>
        <BoxG args={[1.9, 1.5, 0.6]} />
        <Flat color="#E8C23A" />
      </mesh>
      <CanvasPanel position={[0, 3.3, 0.31]} w={1.6} h={1.15} px={512} draw={draw} />
      <mesh position={[0, 4.15, 0]} rotation={[0, 0, Math.PI / 2]}>
        <CylG args={[0.12, 0.12, 0.5, 8]} />
        <Flat color="#2A2A30" />
      </mesh>
    </group>
  );
};

/** A three-step winners' podium (1 in the middle). Top of step 1 at y = 1.3. */
export const PODIUM_TOP = 1.3;
export const Podium: React.FC<{ position: V3 }> = ({ position }) => {
  const steps: [number, number, string][] = [
    [0, PODIUM_TOP, "1"],
    [-2.6, 0.85, "2"],
    [2.6, 0.55, "3"],
  ];
  return (
    <group position={position}>
      {steps.map(([x, h, n]) => (
        <group key={n}>
          <mesh position={[x, h / 2, 0]} castShadow receiveShadow>
            <BoxG args={[2.6, h, 2.2]} />
            <Flat color="#F2EEE6" />
          </mesh>
          <CanvasPanel
            position={[x, h / 2, 1.105]}
            w={1.2}
            h={Math.min(1.0, h * 0.8)}
            px={256}
            draw={(ctx, W, H) => {
              ctx.clearRect(0, 0, W, H);
              ctx.fillStyle = n === "1" ? "#E0A93A" : n === "2" ? "#AEB6C2" : "#B87A4A";
              ctx.fillRect(0, 0, W, H);
              fitText(ctx, n, W / 2, H * 0.54, W * 0.8, H * 0.85, "#FFFFFF");
            }}
          />
        </group>
      ))}
    </group>
  );
};

/** A banner on two poles (text drawn on a 3D panel). */
export const Banner: React.FC<{ position: V3; w?: number; h?: number; text: string; color?: string; ink?: string; yaw?: number }> = ({
  position,
  w = 9,
  h = 1.8,
  text,
  color = P.amber,
  ink = P.ink,
  yaw = 0,
}) => (
  <group position={position} rotation={[0, yaw, 0]}>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[(s * (w + 0.3)) / 2, -position[1] / 2 + h / 2, 0]} castShadow>
        <CylG args={[0.1, 0.1, position[1] + h, 6]} />
        <Flat color="#E8E4DA" />
      </mesh>
    ))}
    <CanvasPanel
      position={[0, 0, 0]}
      w={w}
      h={h}
      px={1024}
      draw={(ctx, W, H) => {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, W, H);
        fitText(ctx, text, W / 2, H * 0.54, W * 0.9, H * 0.7, ink);
      }}
    />
  </group>
);

/** A gold medal on a ribbon, hung in front of the chest (pass the torso-front point). */
export const Medal: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.16, 0.32, 0]} rotation={[0, 0, s * 0.35]}>
        <BoxG args={[0.12, 0.7, 0.03]} />
        <Flat color={P.carRed} />
      </mesh>
    ))}
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <CylG args={[0.24, 0.24, 0.06, 12]} />
      <Flat color="#E0A93A" />
    </mesh>
    <Halo position={[0, 0, 0.1]} size={0.9} color={P.amber} opacity={0.5} />
  </group>
);

/**
 * The "SOUND BARRIER": a big glass pane in a steel frame, facing +Z, standing on the ground. From `shatter`
 * (seconds, compared with `t`) it bursts into triangular shards flying away from `hit` and landing on y = 0.
 */
export const BarrierPane: React.FC<{ position: V3; t: number; shatter: number; w?: number; h?: number; hit?: V3; seed?: string }> = ({
  position,
  t,
  shatter,
  w = 8,
  h = 6.4,
  hit = [0, 1.6, 0],
  seed = "pane",
}) => {
  const shards = useMemo(() => {
    const out: { geo: THREE.BufferGeometry; c: THREE.Vector3; v: THREE.Vector3; spin: V3 }[] = [];
    const nx = 8, ny = 6;
    const pts: THREE.Vector2[][] = [];
    for (let i = 0; i <= nx; i++) {
      pts[i] = [];
      for (let j = 0; j <= ny; j++) {
        const jx = i > 0 && i < nx ? rnd(`${seed}jx${i}${j}`, -0.3, 0.3) : 0;
        const jy = j > 0 && j < ny ? rnd(`${seed}jy${i}${j}`, -0.3, 0.3) : 0;
        pts[i][j] = new THREE.Vector2(-w / 2 + (w * (i + jx)) / nx, (h * (j + jy)) / ny);
      }
    }
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < ny; j++) {
        const q = [pts[i][j], pts[i + 1][j], pts[i + 1][j + 1], pts[i][j + 1]];
        const tris = random(`${seed}d${i}${j}`) < 0.5 ? [[q[0], q[1], q[2]], [q[0], q[2], q[3]]] : [[q[0], q[1], q[3]], [q[1], q[2], q[3]]];
        tris.forEach((tri, k) => {
          const c = new THREE.Vector3((tri[0].x + tri[1].x + tri[2].x) / 3, (tri[0].y + tri[1].y + tri[2].y) / 3, 0);
          const g = new THREE.BufferGeometry();
          g.setAttribute("position", new THREE.Float32BufferAttribute(tri.flatMap((p) => [p.x - c.x, p.y - c.y, 0]), 3));
          g.computeVertexNormals();
          const away = new THREE.Vector3(c.x - hit[0], c.y - hit[1], 0);
          const dist = Math.max(0.5, away.length());
          away.normalize().multiplyScalar(3 / dist + 0.8);
          const v = new THREE.Vector3(away.x * rnd(`${seed}vx${i}${j}${k}`, 0.6, 1.4), away.y + rnd(`${seed}vy${i}${j}${k}`, 0.5, 2.5), -rnd(`${seed}vz${i}${j}${k}`, 1.5, 4.5) / Math.sqrt(dist));
          out.push({ geo: g, c, v, spin: [rnd(`${seed}s1${i}${j}${k}`, -8, 8), rnd(`${seed}s2${i}${j}${k}`, -8, 8), rnd(`${seed}s3${i}${j}${k}`, -6, 6)] });
        });
      }
    return out;
  }, [w, h, hit, seed]);
  const ts = t - shatter;
  const glass = "#BFE3FF";
  return (
    <group position={position}>
      {/* steel frame posts stay standing */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * (w + 0.3)) / 2, (h + 0.4) / 2, 0]} castShadow>
          <BoxG args={[0.3, h + 0.4, 0.4]} />
          <Flat color="#566270" />
        </mesh>
      ))}
      <mesh position={[0, h + 0.3, 0]} castShadow>
        <BoxG args={[w + 0.6, 0.3, 0.4]} />
        <Flat color="#566270" />
      </mesh>
      {ts < 0 ? (
        <>
          <mesh position={[0, h / 2, 0]}>
            <BoxG args={[w, h, 0.08]} />
            <meshLambertMaterial color={glass} transparent opacity={0.38} flatShading depthWrite={false} />
          </mesh>
          <CanvasPanel
            position={[0, h - 0.8, 0.05]}
            w={w * 0.86}
            h={1.25}
            px={1024}
            draw={(ctx, W, H) => {
              ctx.clearRect(0, 0, W, H);
              ctx.fillStyle = "rgba(10,20,40,0.55)";
              ctx.fillRect(0, 0, W, H);
              fitText(ctx, "SOUND BARRIER", W / 2, H * 0.54, W * 0.9, H * 0.72, "#FFFFFF");
            }}
          />
          {/* streaks of reflection */}
          {[-0.25, 0.1].map((x) => (
            <mesh key={x} position={[x * w, h * 0.45, 0.06]} rotation={[0, 0, 0.6]}>
              <planeGeometry args={[0.18, h * 0.8]} />
              <meshBasicMaterial color="#FFFFFF" transparent opacity={0.35} depthWrite={false} toneMapped={false} />
            </mesh>
          ))}
        </>
      ) : (
        shards.map((s, i) => {
          const g = 14;
          const ty = s.c.y;
          // land on the ground: solve y(t) = 0.05
          const disc = s.v.y * s.v.y + 2 * g * Math.max(0, ty - 0.05);
          const tl = (s.v.y + Math.sqrt(disc)) / g;
          const tt = Math.min(ts, tl);
          const y = Math.max(0.05, ty + s.v.y * tt - 0.5 * g * tt * tt);
          const landed = ts >= tl;
          return (
            <mesh
              key={i}
              geometry={s.geo}
              position={[s.c.x + s.v.x * tt, y, s.v.z * tt]}
              rotation={landed ? [-Math.PI / 2, 0, s.spin[2]] : [s.spin[0] * tt, s.spin[1] * tt, s.spin[2] * tt]}
            >
              <meshLambertMaterial color={glass} transparent opacity={0.6} flatShading side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          );
        })
      )}
    </group>
  );
};

// ---------------------------------------------------------------- the lab (chapter 2)

const drawGauge = (value: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#AEBBC8"; // the lab wall, so the square corners vanish
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2, R = W * 0.47;
  ctx.fillStyle = "#E8E4DA";
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = W * 0.035;
  ctx.strokeStyle = "#3A3F55";
  ctx.stroke();
  const a0 = Math.PI * 0.75, span = Math.PI * 1.5;
  const zone = (f0: number, f1: number, c: string, label: string) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = W * 0.09;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.78, a0 + f0 * span, a0 + f1 * span);
    ctx.stroke();
    const am = a0 + ((f0 + f1) / 2) * span;
    ctx.save();
    fitText(ctx, label, cx + Math.cos(am) * R * 0.45, cy + Math.sin(am) * R * 0.45, W * 0.2, W * 0.07, c === P.amber ? "#A06A10" : c);
    ctx.restore();
  };
  zone(0, 0.4, "#3A9A5A", "SAFE");
  zone(0.4, 0.7, P.amber, "OUCH");
  zone(0.7, 1, "#D8382D", "NOPE");
  fitText(ctx, "GUT PRESSURE", cx, cy + R * 0.58, W * 0.5, W * 0.06, "#2C3247");
  const a = a0 + clamp01(value) * span;
  ctx.strokeStyle = "#14161E";
  ctx.lineWidth = W * 0.03;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - Math.cos(a) * R * 0.12, cy - Math.sin(a) * R * 0.12);
  ctx.lineTo(cx + Math.cos(a) * R * 0.74, cy + Math.sin(a) * R * 0.74);
  ctx.stroke();
  ctx.fillStyle = "#14161E";
  ctx.beginPath();
  ctx.arc(cx, cy, W * 0.05, 0, Math.PI * 2);
  ctx.fill();
};

/** A big round pressure gauge (SAFE / OUCH / NOPE) on a pipe, facing +Z. */
export const PressureGauge: React.FC<{ position: V3; value: number; r?: number }> = ({ position, value, r = 1.6 }) => (
  <group position={position}>
    <mesh position={[0, -r - 1.6, -0.3]} castShadow>
      <CylG args={[0.32, 0.32, 3.2, 10]} />
      <Flat color="#8A939E" />
    </mesh>
    <mesh position={[0, 0, -0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <CylG args={[r + 0.18, r + 0.18, 0.36, 20]} />
      <Flat color="#566270" />
    </mesh>
    <CanvasPanel position={[0, 0, 0.005]} w={r * 2} h={r * 2} px={768} draw={drawGauge(value)} />
    <mesh position={[0, 0, 0.05]}>
      <CircleG args={[r, 24]} />
      <meshBasicMaterial color="#FFFFFF" transparent opacity={0.08} depthWrite={false} toneMapped={false} />
    </mesh>
  </group>
);

/** The lab: cool tiled walls and floor, a strip of overcast windows, ceiling light panels and pipes. */
export const Lab: React.FC<{ alarm?: number }> = ({ alarm = 0 }) => (
  <group>
    <mesh position={[0, -0.1, 0]} receiveShadow>
      <BoxG args={[60, 0.2, 40]} />
      <Flat color="#8C98A6" />
    </mesh>
    {Array.from({ length: 20 }, (_, i) => (
      <mesh key={i} position={[-30 + i * 3, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.04, 40]} />
        <Flat color="#7A8694" />
      </mesh>
    ))}
    <mesh position={[0, 8, -8]} receiveShadow>
      <BoxG args={[60, 16, 0.4]} />
      <Flat color="#B6C2CE" />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 14, 8, 0]} receiveShadow>
        <BoxG args={[0.4, 16, 40]} />
        <Flat color="#A6B2BF" />
      </mesh>
    ))}
    {/* windows high on the back wall: overcast sky */}
    {[-9, -4.5, 4.5, 9].map((x) => (
      <group key={x} position={[x, 9.4, -7.78]}>
        <mesh>
          <planeGeometry args={[3.6, 2.4]} />
          <Glow color="#C9D1DC" />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <BoxG args={[0.12, 2.4, 0.1]} />
          <Flat color="#E8ECF2" />
        </mesh>
      </group>
    ))}
    {/* wall panels and a pipe run */}
    {Array.from({ length: 9 }, (_, i) => (
      <mesh key={i} position={[-12 + i * 3, 3.8, -7.78]}>
        <planeGeometry args={[2.8, 6.4]} />
        <Flat color={i % 2 ? "#AEBBC8" : "#B2BECB"} />
      </mesh>
    ))}
    <mesh position={[0, 7.3, -7.5]} rotation={[0, 0, Math.PI / 2]}>
      <CylG args={[0.22, 0.22, 30, 8]} />
      <Flat color="#7E8996" />
    </mesh>
    {/* ceiling light panels */}
    {[-6, 0, 6].map((x) => (
      <group key={x} position={[x, 13.5, -1]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.4, 1.2]} />
          <Glow color="#F2F6FA" />
        </mesh>
        <Halo size={4} color="#E8F0FA" opacity={0.3} />
      </group>
    ))}
    {/* the red alarm beacon on the back wall */}
    <group position={[-6.5, 8.6, -7.6]}>
      <mesh>
        <CylG args={[0.45, 0.5, 0.7, 10]} />
        <Flat color={alarm > 0.5 ? "#FF3A2A" : "#6A2420"} />
      </mesh>
      {alarm > 0.5 ? <Halo size={6} color="#FF3A2A" opacity={0.7} /> : null}
    </group>
  </group>
);

/** The X-ray scanner: an arch with glowing edges and a dark backboard, opening along X at the origin. */
export const XrayArch: React.FC<{ position: V3; glow?: number }> = ({ position, glow = 1 }) => (
  <group position={position}>
    <mesh position={[0, 3.4, -1.3]} receiveShadow>
      <BoxG args={[4.6, 6.8, 0.3]} />
      <Flat color="#141C34" />
    </mesh>
    {Array.from({ length: 7 }, (_, i) => (
      <mesh key={i} position={[0, 0.6 + i * 0.95, -1.13]}>
        <planeGeometry args={[4.2, 0.03]} />
        <Glow color="#4F7FBF" opacity={0.6} />
      </mesh>
    ))}
    {[-1, 1].map((s) => (
      <group key={s} position={[s * 2.65, 0, 0]}>
        <mesh position={[0, 3.6, -0.4]} castShadow>
          <BoxG args={[0.7, 7.2, 2.2]} />
          <Flat color="#DDE4EC" />
        </mesh>
        <mesh position={[-s * 0.36, 3.6, -0.4]}>
          <planeGeometry args={[0.02, 6.8]} />
          <Glow color="#7FC8FF" opacity={glow} />
        </mesh>
      </group>
    ))}
    <mesh position={[0, 7.45, -0.4]} castShadow>
      <BoxG args={[6.1, 0.6, 2.2]} />
      <Flat color="#DDE4EC" />
    </mesh>
    <mesh position={[0, 7.1, 0.25]}>
      <planeGeometry args={[4.4, 0.06]} />
      <Glow color="#7FC8FF" opacity={glow} />
    </mesh>
    <Halo position={[0, 7.0, 0.4]} size={5} color="#7FC8FF" opacity={0.25 * glow} />
  </group>
);

/** A monitor on a stand (screen drawn on a 3D panel), facing +Z. */
export const Monitor: React.FC<{ position: V3; yaw?: number; w?: number; h?: number; draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => void; standH?: number }> = ({
  position,
  yaw = 0,
  w = 3.2,
  h = 2,
  draw,
  standH = 3.4,
}) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, standH / 2, -0.2]} castShadow>
      <BoxG args={[0.3, standH, 0.3]} />
      <Flat color="#3A3F55" />
    </mesh>
    <mesh position={[0, 0.06, -0.2]} castShadow>
      <BoxG args={[1.6, 0.12, 1.2]} />
      <Flat color="#3A3F55" />
    </mesh>
    <mesh position={[0, standH + h / 2, -0.15]} castShadow>
      <BoxG args={[w + 0.24, h + 0.24, 0.24]} />
      <Flat color="#22242E" />
    </mesh>
    <CanvasPanel position={[0, standH + h / 2, -0.02]} w={w} h={h} px={640} draw={draw} />
  </group>
);

/** A party balloon (red) with a knot, a string and a "GUT" tag. `pop` > 0 bursts it into shreds. */
export const Balloon: React.FC<{ position: V3; size: number; pop?: number; wobble?: number; seed?: string; label?: string }> = ({
  position,
  size,
  pop = 0,
  wobble = 0,
  seed = "bal",
  label = "GUT",
}) => {
  const red = "#D8382D";
  return (
    <group position={position}>
      {pop <= 0 ? (
        <group rotation={[0, 0, Math.sin(wobble) * 0.08]}>
          <mesh position={[0, size * 1.15, 0]} scale={[1 + Math.sin(wobble * 1.7) * 0.03, 1.15, 1 - Math.sin(wobble * 1.7) * 0.03]} castShadow>
            <IcoG args={[size, 2]} />
            <Flat color={red} />
          </mesh>
          <mesh position={[-size * 0.35, size * 1.6, size * 0.75]}>
            <IcoG args={[size * 0.16, 1]} />
            <Glow color="#FF9A8A" opacity={0.8} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <ConeG args={[0.14, 0.24, 6]} />
            <Flat color={red} />
          </mesh>
        </group>
      ) : (
        Array.from({ length: 16 }, (_, i) => {
          const a = rnd(`${seed}a${i}`, 0, Math.PI * 2);
          const e = rnd(`${seed}e${i}`, -1, 1);
          const sp = rnd(`${seed}s${i}`, 4, 9);
          const tt = pop;
          const out = (sp * (1 - Math.exp(-4 * tt))) / 4;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * Math.cos(e) * out, size * 1.15 + Math.sin(e) * out - 2.5 * tt * tt, Math.sin(a) * Math.cos(e) * out]}
              rotation={[tt * 9 + i, tt * 7, i]}
            >
              <planeGeometry args={[0.35, 0.22]} />
              <Flat color={red} side={THREE.DoubleSide} />
            </mesh>
          );
        })
      )}
      {/* the label, printed on the balloon, and a short string */}
      {pop <= 0 ? (
        <CanvasPanel
          position={[0, size * 1.15, size * 1.05]}
          w={size * 1.1}
          h={size * 0.55}
          px={360}
          draw={(ctx, W, H) => {
            ctx.fillStyle = "#D8382D";
            ctx.fillRect(0, 0, W, H);
            fitText(ctx, label, W / 2, H * 0.55, W * 0.9, H * 0.85, "#FFF2E6");
          }}
        />
      ) : null}
      <mesh position={[0, -0.6, 0]}>
        <CylG args={[0.015, 0.015, 1.2, 4]} />
        <Flat color="#E8E4DA" />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------- backyard + anvil (chapter 3)

/** A cartoon anvil (≈ 1.7 wide), base on its origin. */
export const Anvil: React.FC<{ position: V3; rotation?: V3 }> = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 0.17, 0]} castShadow>
      <BoxG args={[1.3, 0.34, 0.8]} />
      <Flat color="#3A3F4A" />
    </mesh>
    <mesh position={[0, 0.5, 0]} castShadow>
      <BoxG args={[0.7, 0.36, 0.55]} />
      <Flat color="#323640" />
    </mesh>
    <mesh position={[0.1, 0.86, 0]} castShadow>
      <BoxG args={[1.4, 0.38, 0.7]} />
      <Flat color="#444A56" />
    </mesh>
    <mesh position={[-0.92, 0.9, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <ConeG args={[0.26, 0.6, 6]} />
      <Flat color="#444A56" />
    </mesh>
  </group>
);
export const ANVIL_H = 1.05;

/** A wooden fence line along X from x0 to x1 at z. */
export const Fence: React.FC<{ x0: number; x1: number; z: number; h?: number; color?: string }> = ({ x0, x1, z, h = 3.2, color = "#B8875A" }) => {
  const n = Math.round((x1 - x0) / 0.62);
  return (
    <group>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[x0 + i * 0.62 + 0.3, h / 2, z]} castShadow>
          <BoxG args={[0.54, h + (i % 2) * 0.1, 0.12]} />
          <Flat color={i % 3 === 0 ? "#A87A4E" : color} />
        </mesh>
      ))}
      {[0.6, h - 0.6].map((y) => (
        <mesh key={y} position={[(x0 + x1) / 2, y, z - 0.1]}>
          <BoxG args={[x1 - x0, 0.2, 0.1]} />
          <Flat color="#8A6440" />
        </mesh>
      ))}
    </group>
  );
};

/** Little cartoon sparkles (four-point stars) popping around a point. */
export const Sparkles: React.FC<{ center: V3; t: number; r?: number; count?: number; color?: string; seed?: string }> = ({ center, t, r = 1.2, count = 6, color = P.cream, seed = "spk" }) => {
  if (t <= 0 || t > 1.2) return null;
  return (
    <group position={center}>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + rnd(`${seed}${i}`, 0, 0.6);
        const k = clamp01(t / 0.25);
        const s = (t < 0.6 ? k : clamp01(1 - (t - 0.6) / 0.6)) * rnd(`${seed}s${i}`, 0.25, 0.42);
        const d = r * (0.8 + 0.4 * k);
        return (
          <group key={i} position={[Math.cos(a) * d, Math.sin(a) * d * 0.8, 0.2]} rotation={[0, 0, t * 3 + i]} scale={Math.max(0.001, s)}>
            {[0, Math.PI / 2].map((rz) => (
              <mesh key={rz} rotation={[0, 0, rz]}>
                <planeGeometry args={[0.25, 1.4]} />
                <Glow color={color} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
};

// ---------------------------------------------------------------- living room helpers

/** A yellow tape measure lying flat on the floor along -Z from `start`, `len` long. */
export const TapeMeasure: React.FC<{ start: V3; len: number; out?: number }> = ({ start, len, out = 1 }) => {
  const L = Math.max(0.01, len * clamp01(out));
  return (
    <group position={start}>
      <mesh position={[0, 0.25, 0.3]} castShadow>
        <BoxG args={[0.6, 0.5, 0.6]} />
        <Flat color="#E8C23A" />
      </mesh>
      <CanvasPanel
        position={[0, 0.012, -L / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        w={0.32}
        h={L}
        px={64}
        draw={(ctx, W, H) => {
          ctx.fillStyle = "#F2D04A";
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = "#2A2A30";
          const n = Math.floor(L * 4);
          for (let i = 0; i <= n; i++) {
            const y = H - (i / (L * 4)) * H;
            ctx.fillRect(0, y - 1, i % 4 === 0 ? W * 0.6 : W * 0.3, 2);
          }
        }}
      />
    </group>
  );
};

/** Dashes along a parabolic arc from a to b with apex height h above the higher end; drawn to `p`. */
export const DashedArc: React.FC<{ a: V3; b: V3; h: number; p?: number; color?: string; n?: number }> = ({ a, b, h, p = 1, color = P.amber, n = 24 }) => {
  const pt = (u: number): THREE.Vector3 => {
    const x = a[0] + (b[0] - a[0]) * u;
    const z = a[2] + (b[2] - a[2]) * u;
    const y = a[1] + (b[1] - a[1]) * u + 4 * h * u * (1 - u);
    return new THREE.Vector3(x, y, z);
  };
  const shown = Math.floor(n * clamp01(p));
  return (
    <group>
      {Array.from({ length: shown }, (_, i) => {
        const u0 = i / n, u1 = (i + 0.55) / n;
        const p0 = pt(u0), p1 = pt(u1);
        const mid = p0.clone().add(p1).multiplyScalar(0.5);
        const dir = p1.clone().sub(p0);
        const len = dir.length();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        return (
          <mesh key={i} position={mid} quaternion={q}>
            <CylG args={[0.07, 0.07, len, 5]} />
            <Glow color={color} />
          </mesh>
        );
      })}
      {shown >= n ? (
        <mesh position={[b[0], b[1] + 0.02, b[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.7, 24]} />
          <meshBasicMaterial color={color} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ) : null}
    </group>
  );
};

// ---------------------------------------------------------------- launch site (chapter 4)

/** A rocket (white, teal band, black nose), base on its origin. `lift` raises it; `burn` 0..1 lights the engine. */
export const ROCKET_H = 26;
export const Rocket: React.FC<{ position: V3; lift?: number; burn?: number; t?: number }> = ({ position, lift = 0, burn = 0, t = 0 }) => {
  const r = 1.7;
  return (
    <group position={[position[0], position[1] + lift, position[2]]}>
      <mesh position={[0, 2 + 9, 0]} castShadow>
        <CylG args={[r, r, 18, 16]} />
        <Flat color="#F2F2EE" />
      </mesh>
      <mesh position={[0, 14, 0]}>
        <CylG args={[r + 0.02, r + 0.02, 1.4, 16]} />
        <Flat color="#24748F" />
      </mesh>
      <mesh position={[0, 5, 0]}>
        <CylG args={[r + 0.02, r + 0.02, 0.6, 16]} />
        <Flat color="#2A2A30" />
      </mesh>
      <mesh position={[0, 20 + 2.5, 0]} castShadow>
        <ConeG args={[r, 5, 16]} />
        <Flat color="#2A2A30" />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.cos((i * Math.PI) / 2) * (r + 0.6), 3, Math.sin((i * Math.PI) / 2) * (r + 0.6)]} rotation={[0, -(i * Math.PI) / 2, 0]} castShadow>
          <BoxG args={[1.3, 3.6, 0.22]} />
          <Flat color="#C8372D" />
        </mesh>
      ))}
      <mesh position={[0, 1.2, 0]}>
        <CylG args={[r * 0.75, r * 0.95, 1.8, 12]} />
        <Flat color="#3A3F4A" />
      </mesh>
      {burn > 0 ? (
        <group position={[0, 0.3, 0]}>
          <mesh position={[0, -4 * burn, 0]} rotation={[Math.PI, 0, 0]} scale={[1 + Math.sin(t * 40) * 0.05, 1, 1]}>
            <ConeG args={[r * 0.9, 8 * burn, 10]} />
            <Glow color={P.fire} opacity={0.95} />
          </mesh>
          <mesh position={[0, -2.6 * burn, 0]} rotation={[Math.PI, 0, 0]}>
            <ConeG args={[r * 0.55, 5 * burn, 10]} />
            <Glow color={P.fireCore} />
          </mesh>
          <Halo position={[0, -3 * burn, 0]} size={18 * burn} color={P.fire} opacity={0.8} />
          <pointLight position={[0, -2, 3]} color={P.fire} intensity={60 * burn} distance={40} decay={2} />
        </group>
      ) : null}
    </group>
  );
};

/** A red lattice launch tower, base on its origin. */
export const Gantry: React.FC<{ position: V3; h?: number }> = ({ position, h = 30 }) => (
  <group position={position}>
    {[-1, 1].map((sx) =>
      [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * 1.4, h / 2, sz * 1.4]} castShadow>
          <BoxG args={[0.3, h, 0.3]} />
          <Flat color="#B8372D" />
        </mesh>
      )),
    )}
    {Array.from({ length: Math.floor(h / 2.4) }, (_, i) => (
      <group key={i} position={[0, 1.2 + i * 2.4, 0]}>
        {[-1, 1].map((s) => (
          <React.Fragment key={s}>
            <mesh position={[0, 0, s * 1.4]} rotation={[0, 0, 0.6]}>
              <BoxG args={[3.4, 0.14, 0.14]} />
              <Flat color="#9A2E26" />
            </mesh>
            <mesh position={[s * 1.4, 0, 0]} rotation={[0.6, 0, 0]}>
              <BoxG args={[0.14, 0.14, 3.4]} />
              <Flat color="#9A2E26" />
            </mesh>
          </React.Fragment>
        ))}
      </group>
    ))}
    {[0.55, 0.8].map((f) => (
      <mesh key={f} position={[-2.6, h * f, 0]} castShadow>
        <BoxG args={[2.6, 0.3, 0.6]} />
        <Flat color="#566270" />
      </mesh>
    ))}
    <mesh position={[0, h + 0.6, 0]}>
      <IcoG args={[0.3, 1]} />
      <Glow color="#FF4A3A" />
    </mesh>
    <Halo position={[0, h + 0.6, 0]} size={2.6} color="#FF4A3A" opacity={0.7} />
  </group>
);

/** The launch pad: a concrete slab with hazard stripes, the sea and low hills behind, the sun on the horizon. */
export const LaunchSite: React.FC<{ t: number; sun?: boolean }> = ({ t, sun = true }) => (
  <group>
    <mesh position={[0, -0.1, -200]} receiveShadow>
      <BoxG args={[1400, 0.2, 900]} />
      <Flat color="#6E6A5E" />
    </mesh>
    <mesh position={[0, 0.1, 0]} receiveShadow>
      <BoxG args={[40, 0.4, 36]} />
      <Flat color="#9C978C" />
    </mesh>
    {Array.from({ length: 20 }, (_, i) => (
      <mesh key={i} position={[-19 + i * 2, 0.31, 17.6]} rotation={[-Math.PI / 2, 0, 0.6]}>
        <planeGeometry args={[0.7, 1.4]} />
        <Flat color={i % 2 ? "#E8C23A" : "#2A2A30"} />
      </mesh>
    ))}
    {/* the sea */}
    <mesh position={[0, 0.02, -330]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1400, 400]} />
      <Flat color="#3A4E7A" />
    </mesh>
    {Array.from({ length: 30 }, (_, i) => (
      <mesh key={i} position={[rnd(`sw${i}`, -300, 300), 0.06, -150 - rnd(`swz${i}`, 0, 300)]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[rnd(`swl${i}`, 6, 18), 0.4]} />
        <Glow color="#F7C0A0" opacity={0.55} />
      </mesh>
    ))}
    {/* low hills on the sides */}
    {Array.from({ length: 12 }, (_, i) => {
      const s = i < 6 ? -1 : 1;
      const k = i % 6;
      return (
        <mesh key={i} position={[s * (90 + k * 40), -4, -60 - k * 35]} scale={[1, 0.4, 1]}>
          <IcoG args={[38 + k * 6, 1]} />
          <Flat color="#4A3E52" />
        </mesh>
      );
    })}
    {sun ? (
      <group position={[-40, 26, -520]}>
        <mesh>
          <CircleG args={[22, 24]} />
          <Glow color="#FFD08A" fog={false} />
        </mesh>
        <Halo size={150} color="#FFB27A" opacity={0.55} />
      </group>
    ) : null}
    {/* a floodlight mast and a fuel tank to the side */}
    <group position={[16, 0, -10]}>
      <mesh position={[0, 7, 0]} castShadow>
        <CylG args={[3, 3, 14, 14]} />
        <Flat color="#E8E4DA" />
      </mesh>
      <mesh position={[0, 14.2, 0]}>
        <IcoG args={[3, 1]} />
        <Flat color="#E8E4DA" />
      </mesh>
    </group>
    <group position={[-17, 0, 4]}>
      <mesh position={[0, 8, 0]}>
        <CylG args={[0.2, 0.25, 16, 6]} />
        <Flat color="#2A2A30" />
      </mesh>
      <mesh position={[0, 16.2, 0.4]}>
        <BoxG args={[2.4, 1.2, 0.4]} />
        <Flat color="#2A2A30" />
      </mesh>
      <mesh position={[0, 16.2, 0.62]}>
        <planeGeometry args={[2.1, 0.9]} />
        <Glow color="#FFF2C8" />
      </mesh>
      <Halo position={[0, 16.2, 1]} size={6} color="#FFF2C8" opacity={0.5 + Math.sin(t) * 0} />
    </group>
  </group>
);

/** A countdown board on two legs: shows `text` big (drawn on a 3D panel). */
export const CountdownBoard: React.FC<{ position: V3; yaw?: number; text: string; color?: string }> = ({ position, yaw = 0, text, color = "#FF5A4A" }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 2.2, 3, 0]} castShadow>
        <BoxG args={[0.3, 6, 0.3]} />
        <Flat color="#2A2A30" />
      </mesh>
    ))}
    <mesh position={[0, 7.4, -0.1]} castShadow>
      <BoxG args={[5.4, 3.4, 0.3]} />
      <Flat color="#14161E" />
    </mesh>
    <CanvasPanel
      position={[0, 7.4, 0.06]}
      w={5}
      h={3}
      px={600}
      draw={(ctx, W, H) => {
        ctx.fillStyle = "#0A0C12";
        ctx.fillRect(0, 0, W, H);
        fitText(ctx, "LAUNCH IN", W / 2, H * 0.2, W * 0.8, H * 0.16, "#AEB6C2");
        fitText(ctx, text, W / 2, H * 0.62, W * 0.86, H * 0.62, color);
      }}
    />
  </group>
);

/** A glass jar with a lid, a little gas puff trapped inside. Base on its origin. */
export const GasJar: React.FC<{ position: V3; t: number }> = ({ position, t }) => (
  <group position={position}>
    <mesh position={[0, 0.75, 0]}>
      <CylG args={[0.5, 0.5, 1.5, 16, 1, true]} />
      <meshLambertMaterial color="#DCEFFA" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
    <mesh position={[0, 1.58, 0]} castShadow>
      <CylG args={[0.54, 0.54, 0.18, 16]} />
      <Flat color="#C9A46A" />
    </mesh>
    <GasPuff position={[0, 0.7, 0]} size={0.32} t={t} seed="jar" opacity={0.85} />
    <mesh position={[-0.28, 0.8, 0.42]} rotation={[0, 0.5, 0]}>
      <planeGeometry args={[0.08, 1.1]} />
      <meshBasicMaterial color="#FFFFFF" transparent opacity={0.5} depthWrite={false} toneMapped={false} />
    </mesh>
  </group>
);

/** A digital kitchen scale; its display shows `text` (drawn on a 3D panel). Top surface at y = 0.3. */
export const KitchenScale: React.FC<{ position: V3; text: string }> = ({ position, text }) => (
  <group position={position}>
    <mesh position={[0, 0.15, 0]} castShadow>
      <BoxG args={[1.9, 0.3, 1.6]} />
      <Flat color="#E8E4DA" />
    </mesh>
    <mesh position={[0, 0.32, -0.1]}>
      <BoxG args={[1.5, 0.04, 1.2]} />
      <Flat color="#C8CCD4" />
    </mesh>
    <CanvasPanel
      position={[0, 0.15, 0.805]}
      w={1.1}
      h={0.22}
      px={440}
      draw={(ctx, W, H) => {
        ctx.fillStyle = "#1C2A22";
        ctx.fillRect(0, 0, W, H);
        fitText(ctx, text, W / 2, H * 0.55, W * 0.9, H * 0.8, "#9CFFB8");
      }}
    />
  </group>
);

/** A garden snail (hero scale, a little bigger than life), facing +X. */
export const Snail: React.FC<{ position: V3; t: number; yaw?: number; scale?: number }> = ({ position, t, yaw = 0, scale = 1 }) => {
  const squish = 1 + Math.sin(t * 5) * 0.06;
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      <mesh position={[0.05, 0.1, 0]} scale={[squish, 1, 1]} castShadow>
        <BoxG args={[1.2, 0.2, 0.36]} />
        <Flat color="#B8B496" />
      </mesh>
      <mesh position={[0.62, 0.24, 0]} castShadow>
        <BoxG args={[0.3, 0.34, 0.3]} />
        <Flat color="#B8B496" />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[0.66, 0.42, s * 0.08]} rotation={[s * 0.25, 0, -0.35]}>
          <mesh position={[0, 0.18, 0]}>
            <CylG args={[0.03, 0.03, 0.36, 4]} />
            <Flat color="#B8B496" />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <IcoG args={[0.06, 1]} />
            <Flat color="#1A1A22" />
          </mesh>
        </group>
      ))}
      <mesh position={[-0.12, 0.52, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <CylG args={[0.38, 0.38, 0.36, 12]} />
        <Flat color="#B07A44" />
      </mesh>
      <mesh position={[-0.12, 0.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <CylG args={[0.22, 0.22, 0.38, 10]} />
        <Flat color="#7A4E2C" />
      </mesh>
      <mesh position={[-0.12, 0.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <CylG args={[0.09, 0.09, 0.4, 8]} />
        <Flat color="#C9A46A" />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------- dining room (chapter 5)

/** A dining chair (seat top 0.72) facing +Z. */
export const DinnerChair: React.FC<{ position: V3; yaw?: number; tip?: number }> = ({ position, yaw = 0, tip = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <group rotation={[-tip, 0, 0]}>
      <mesh position={[0, 0.66, 0]} castShadow receiveShadow>
        <BoxG args={[1.3, 0.12, 1.2]} />
        <Flat color="#6A3E2C" />
      </mesh>
      <mesh position={[0, 1.7, -0.56]} castShadow>
        <BoxG args={[1.3, 2.0, 0.12]} />
        <Flat color="#6A3E2C" />
      </mesh>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.55, 0.3, sz * 0.5]} castShadow>
            <BoxG args={[0.12, 0.6, 0.12]} />
            <Flat color="#4A2A1E" />
          </mesh>
        )),
      )}
    </group>
  </group>
);

const drawFamilyPhoto = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#C9A46A";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#BFE0F5";
  ctx.fillRect(W * 0.07, H * 0.09, W * 0.86, H * 0.82);
  ctx.fillStyle = "#79B35C";
  ctx.fillRect(W * 0.07, H * 0.62, W * 0.86, H * 0.29);
  const folks = [
    { x: 0.2, c: "#5A4A78", hair: "#8A8A8A" },
    { x: 0.36, c: "#2E5A6A", hair: "#3A2A1E" },
    { x: 0.52, c: "#E8862A", hair: "#3A2418" },
    { x: 0.68, c: "#8A3A3A", hair: "#C9A46A" },
    { x: 0.82, c: "#3A6A4A", hair: "#1A1410" },
  ];
  folks.forEach((f) => {
    const x = W * f.x;
    ctx.fillStyle = f.c;
    ctx.fillRect(x - W * 0.055, H * 0.48, W * 0.11, H * 0.3);
    ctx.fillStyle = "#C58B62";
    ctx.fillRect(x - W * 0.045, H * 0.3, W * 0.09, H * 0.16);
    ctx.fillStyle = f.hair;
    ctx.fillRect(x - W * 0.05, H * 0.27, W * 0.1, H * 0.05);
  });
  // Slavoski crossed out in red marker
  ctx.strokeStyle = "#E0281E";
  ctx.lineWidth = W * 0.03;
  ctx.lineCap = "round";
  const x = W * 0.52;
  ctx.beginPath();
  ctx.moveTo(x - W * 0.09, H * 0.22);
  ctx.lineTo(x + W * 0.09, H * 0.84);
  ctx.moveTo(x + W * 0.09, H * 0.22);
  ctx.lineTo(x - W * 0.09, H * 0.84);
  ctx.stroke();
};

/**
 * The dining room at night: a long table along Z (x ∈ ±1.7, z ∈ ±4.6, top 1.55) with a white cloth,
 * plates, candles and a roast; warm pendant lamp; a night window on the right wall; the family photo on
 * the left wall (x = -7) behind Slavoski's seat.
 */
export const TABLE = { top: 1.55, halfW: 1.7, halfL: 4.6 };
export const DiningRoom: React.FC<{ t: number; candles?: number; food?: boolean }> = ({ t, candles = 1, food = true }) => (
  <group>
    <mesh position={[0, -0.1, 0]} receiveShadow>
      <BoxG args={[40, 0.2, 40]} />
      <Flat color="#5A3A2A" />
    </mesh>
    <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[9, 14]} />
      <Flat color="#5A2E34" />
    </mesh>
    {/* walls */}
    <mesh position={[0, 7, -9]} receiveShadow>
      <BoxG args={[40, 14, 0.4]} />
      <Flat color="#6A4A44" />
    </mesh>
    <mesh position={[-7.2, 7, 0]} receiveShadow>
      <BoxG args={[0.4, 14, 40]} />
      <Flat color="#5E423E" />
    </mesh>
    <mesh position={[7.2, 7, -5.5]} receiveShadow>
      <BoxG args={[0.4, 14, 7]} />
      <Flat color="#5E423E" />
    </mesh>
    <mesh position={[7.2, 7, 9]} receiveShadow>
      <BoxG args={[0.4, 14, 14]} />
      <Flat color="#5E423E" />
    </mesh>
    <mesh position={[7.2, 1.4, 0.75]} receiveShadow>
      <BoxG args={[0.4, 2.8, 5.5]} />
      <Flat color="#5E423E" />
    </mesh>
    <mesh position={[7.2, 11.3, 0.75]} receiveShadow>
      <BoxG args={[0.4, 5.4, 5.5]} />
      <Flat color="#5E423E" />
    </mesh>
    {/* the night window */}
    <mesh position={[7.6, 5.7, 0.75]} rotation={[0, -Math.PI / 2, 0]}>
      <planeGeometry args={[5.5, 5.8]} />
      <Glow color="#141A3A" />
    </mesh>
    <mesh position={[7.5, 7.3, 1.8]} rotation={[0, -Math.PI / 2, 0]}>
      <CircleG args={[0.5, 14]} />
      <Glow color="#E8ECF5" />
    </mesh>
    {[0.75].map((z) => (
      <mesh key={z} position={[7.0, 5.7, z]}>
        <BoxG args={[0.12, 5.8, 0.14]} />
        <Flat color="#E6E0D4" />
      </mesh>
    ))}
    <mesh position={[7.0, 5.7, 0.75]}>
      <BoxG args={[0.12, 0.14, 5.5]} />
      <Flat color="#E6E0D4" />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[6.85, 6.2, 0.75 + s * 3.2]}>
        <BoxG args={[0.2, 7.4, 1.0]} />
        <Flat color="#7A2E3A" />
      </mesh>
    ))}
    {/* wainscot strip */}
    <mesh position={[0, 2.2, -8.75]}>
      <BoxG args={[40, 0.14, 0.12]} />
      <Flat color="#8A6A50" />
    </mesh>
    <mesh position={[-6.95, 2.2, 0]}>
      <BoxG args={[0.12, 0.14, 40]} />
      <Flat color="#8A6A50" />
    </mesh>
    {/* sideboard on the back wall */}
    <mesh position={[0, 1.2, -8.2]} castShadow receiveShadow>
      <BoxG args={[6, 2.4, 1.2]} />
      <Flat color="#4A2A1E" />
    </mesh>
    <mesh position={[-1.8, 2.75, -8.2]}>
      <CylG args={[0.35, 0.25, 0.7, 10]} />
      <Flat color="#24748F" />
    </mesh>
    {/* the family photo, left wall */}
    <mesh position={[-6.96, 5.4, 2.6]} rotation={[0, Math.PI / 2, 0]}>
      <BoxG args={[3.3, 2.5, 0.12]} />
      <Flat color="#3E281C" />
    </mesh>
    <CanvasPanel position={[-6.88, 5.4, 2.6]} rotation={[0, Math.PI / 2, 0]} w={3.0} h={2.2} px={600} draw={drawFamilyPhoto} />
    {/* the table */}
    <mesh position={[0, TABLE.top - 0.08, 0]} castShadow receiveShadow>
      <BoxG args={[TABLE.halfW * 2, 0.16, TABLE.halfL * 2]} />
      <Flat color="#F2EEE6" />
    </mesh>
    {[-1, 1].map((sx) =>
      [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * (TABLE.halfW - 0.3), (TABLE.top - 0.16) / 2, sz * (TABLE.halfL - 0.3)]} castShadow>
          <BoxG args={[0.24, TABLE.top - 0.16, 0.24]} />
          <Flat color="#4A2A1E" />
        </mesh>
      )),
    )}
    {/* place settings: one plate per seat */}
    {[
      [-1.05, -2.0],
      [-1.05, 1.4],
      [1.05, -2.0],
      [1.05, 1.4],
      [0, -3.9],
    ].map(([x, z], i) => (
      <group key={i} position={[x, TABLE.top, z]}>
        <mesh position={[0, 0.03, 0]}>
          <CylG args={[0.5, 0.42, 0.06, 14]} />
          <Flat color="#FFFFFF" />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <CylG args={[0.3, 0.3, 0.03, 12]} />
          <Flat color={i % 2 ? "#79B35C" : "#C9A46A"} />
        </mesh>
        <mesh position={[x > 0 ? -0.55 : 0.55, 0.32, -0.55]}>
          <CylG args={[0.13, 0.1, 0.6, 8]} />
          <meshLambertMaterial color="#DCEFFA" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      </group>
    ))}
    {food ? (
      <group position={[0, TABLE.top, -0.3]}>
        <mesh position={[0, 0.06, 0]}>
          <CylG args={[0.9, 0.8, 0.1, 14]} />
          <Flat color="#E8E4DA" />
        </mesh>
        <mesh position={[0, 0.42, 0]} scale={[1.2, 0.8, 0.9]} castShadow>
          <IcoG args={[0.5, 1]} />
          <Flat color="#B8743A" />
        </mesh>
        <mesh position={[0.2, 0.15, 1.6]}>
          <CylG args={[0.55, 0.45, 0.3, 12]} />
          <Flat color="#2E5A6A" />
        </mesh>
        <mesh position={[0.2, 0.32, 1.6]}>
          <IcoG args={[0.42, 1]} />
          <Flat color="#5E9A48" />
        </mesh>
      </group>
    ) : null}
    {/* candles */}
    {[-1.6, 1.4].map((z, i) =>
      i < Math.round(candles * 2) || candles >= 1 ? (
        <group key={z} position={[0.2, TABLE.top, z]}>
          <mesh position={[0, 0.06, 0]}>
            <CylG args={[0.22, 0.25, 0.12, 8]} />
            <Flat color="#C9A46A" />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <CylG args={[0.08, 0.08, 0.9, 6]} />
            <Flat color="#F4F1E8" />
          </mesh>
          <mesh position={[0, 1.1 + Math.sin(t * 9 + z) * 0.02, 0]} scale={[1, 1.6, 1]}>
            <IcoG args={[0.08, 1]} />
            <Glow color="#FFD27A" />
          </mesh>
          <Halo position={[0, 1.1, 0]} size={1.6} color="#FFB24A" opacity={0.55} />
        </group>
      ) : null,
    )}
    {/* pendant lamp */}
    <group position={[0, 8.6, 0]}>
      <mesh position={[0, 2.5, 0]}>
        <CylG args={[0.03, 0.03, 5, 4]} />
        <Flat color="#2A2A30" />
      </mesh>
      <mesh>
        <ConeG args={[1.3, 0.9, 12, 1, true]} />
        <Flat color="#2E5A4A" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.32, 0]}>
        <IcoG args={[0.3, 1]} />
        <Glow color="#FFE3A0" />
      </mesh>
      <Halo position={[0, -0.4, 0]} size={5} color={P.lampGlow} opacity={0.5} />
      <pointLight position={[0, -1, 0]} color="#FFC77A" intensity={30} distance={22} decay={2} />
    </group>
  </group>
);

/** The chalkboard (in the study at night): physics laws chalked up, ticked off one by one (`ticks` 0..3). */
export const Chalkboard: React.FC<{ position: V3; ticks: number; stamp?: number }> = ({ position, ticks, stamp = 0 }) => (
  <group position={position}>
    <mesh position={[0, 0, -0.12]} castShadow>
      <BoxG args={[6.2, 4.2, 0.24]} />
      <Flat color="#6A4A34" />
    </mesh>
    <CanvasPanel
      position={[0, 0, 0.01]}
      w={5.8}
      h={3.8}
      px={1024}
      draw={(ctx, W, H) => {
        ctx.fillStyle = "#24382E";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        for (let i = 0; i < 40; i++) ctx.fillRect((i * 97) % W, (i * 53) % H, 80, 4);
        ctx.font = CANVAS_FONT(H * 0.085);
        ctx.fillStyle = "#EDEBE2";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("LAWS OF PHYSICS", W * 0.08, H * 0.14);
        const rows = ["F = m a", "p = m v", "E = m c²"];
        rows.forEach((r, i) => {
          ctx.font = CANVAS_FONT(H * 0.12);
          ctx.fillStyle = "#EDEBE2";
          ctx.fillText(r, W * 0.12, H * (0.36 + i * 0.2));
          if (ticks > i) {
            const k = clamp01(ticks - i);
            ctx.strokeStyle = "#9CFFB8";
            ctx.lineWidth = H * 0.025;
            ctx.lineCap = "round";
            ctx.beginPath();
            const x0 = W * 0.66, y0 = H * (0.36 + i * 0.2);
            ctx.moveTo(x0, y0);
            const k1 = Math.min(1, k * 2);
            ctx.lineTo(x0 + W * 0.04 * k1, y0 + H * 0.05 * k1);
            if (k > 0.5) {
              const k2 = (k - 0.5) * 2;
              ctx.lineTo(x0 + W * 0.04 + W * 0.09 * k2, y0 + H * 0.05 - H * 0.13 * k2);
            }
            ctx.stroke();
          }
        });
        if (stamp > 0) {
          ctx.save();
          ctx.translate(W * 0.8, H * 0.78);
          ctx.rotate(-0.18);
          ctx.globalAlpha = clamp01(stamp * 3);
          ctx.strokeStyle = P.amber;
          ctx.lineWidth = H * 0.018;
          ctx.strokeRect(-W * 0.16, -H * 0.075, W * 0.32, H * 0.15);
          fitText(ctx, "UNBROKEN", 0, 0, W * 0.28, H * 0.09, P.amber);
          ctx.restore();
        }
      }}
    />
    <mesh position={[0, -2.2, 0.15]} castShadow>
      <BoxG args={[6, 0.14, 0.4]} />
      <Flat color="#6A4A34" />
    </mesh>
  </group>
);

// ---------------------------------------------------------------- the trousers rip

/**
 * A decal on one of the hero's parts (in that part's unit-cube space), e.g. the rip on the seat of his
 * jeans: `part` "pelvis", face z = -0.5. Follows the pose exactly.
 */
export const PartDecal: React.FC<{ pose: Pose; part: string; position: V3; yaw?: number; children: React.ReactNode }> = ({ pose, part, position, yaw = 0, children }) => {
  const m = useMemo(() => {
    const p = heroParts(pose).find((x) => x.name === part);
    const root = new THREE.Matrix4().makeTranslation(...position).multiply(new THREE.Matrix4().makeRotationY(yaw));
    return p ? root.multiply(p.matrix) : root;
  }, [pose, part, position, yaw]);
  return (
    <group matrixAutoUpdate={false} matrix={m}>
      {children}
    </group>
  );
};

/** The rip itself (unit-cube space of the pelvis, on its back face): a dark jagged tear and two flaps. */
export const SeatRip: React.FC<{ p: number }> = ({ p }) => {
  const k = clamp01(p / 0.3);
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const pts: [number, number][] = [
      [-0.32, 0.05],
      [-0.2, 0.2],
      [-0.08, 0.02],
      [0.04, 0.24],
      [0.14, 0.0],
      [0.26, 0.18],
      [0.34, -0.02],
      [0.22, -0.2],
      [0.1, 0.0],
      [-0.02, -0.22],
      [-0.14, -0.02],
      [-0.26, -0.18],
    ];
    s.moveTo(...pts[0]);
    pts.slice(1).forEach((q) => s.lineTo(...q));
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);
  if (p <= 0) return null;
  return (
    <group position={[0.0, 0.05, -0.505]} rotation={[0, Math.PI, 0]} scale={[2.0 * k, 2.3 * k, 1]}>
      <mesh geometry={shape} scale={[1.18, 1.25, 1]} position={[0, 0, -0.004]}>
        <meshBasicMaterial color="#8FB3D9" side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={shape}>
        <meshBasicMaterial color="#0E1018" side={THREE.DoubleSide} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.3, 0.02, 0.02]} rotation={[0, s * 0.9 * k, s * 0.5]}>
          <planeGeometry args={[0.2, 0.34]} />
          <meshLambertMaterial color={P.jeans} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};
