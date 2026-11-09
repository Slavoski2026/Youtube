/**
 * Props for "What If Earth's Oxygen DOUBLED Overnight?" (ep. 9).
 * Fire (flames, match, grill, wildfire), the air as a grid of molecules, body diagrams (lungs, blood
 * vessel, a red blood cell), the oxygen-rich swamp of 300 million years ago (lycopsids, tree ferns,
 * a giant dragonfly, a giant millipede) and spiders / beetles. All at hero scale (Slavoski is 4.2 tall).
 */
import React, { useMemo } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { BoxG, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { clamp01, ease, noise1, type V3 } from "../../slavoski/noise";
import { mix, P } from "../../slavoski/palette";
import { CANVAS_FONT, CanvasPanel, fitText } from "../../slavoski/screens";
import { Strut } from "../no-work-2036/props";

export const O2_RED = "#FF4A3A";
export const N2_BLUE = "#4F86D9";

// ---------------------------------------------------------------- fire

/**
 * A flickering low-poly flame standing on `position` (its base). `size` is its height in units.
 * Three nested cones (orange → amber → yellow) plus two tongues that rise and shrink, a halo and,
 * when `light`, a real point light.
 */
export const Flame: React.FC<{ position: V3; size?: number; t: number; seed?: string; light?: number; lean?: number }> = ({
  position,
  size = 1,
  t,
  seed = "flame",
  light = 0,
  lean = 0,
}) => {
  if (size <= 0.01) return null;
  const f1 = noise1(seed, t * 7);
  // a tapering column of faceted fire balls (house style: orange-to-yellow icospheres), plus licks that rise and fade
  const n = 6;
  const core = Array.from({ length: n }, (_, i) => {
    const u = i / (n - 1);
    return {
      p: [noise1(`${seed}x${i}`, t * 6) * size * 0.1 * u, size * (0.14 + u * 0.66) * (1 + 0.08 * f1), noise1(`${seed}z${i}`, t * 5) * size * 0.06 * u] as V3,
      r: size * 0.27 * (1 - u * 0.78),
      c: i < 2 ? P.fireCore : i < 4 ? P.fire : P.meteor,
    };
  });
  const licks = [0, 1, 2, 3].map((i) => {
    const ph = (t * (1.8 + i * 0.35) + random(`${seed}l${i}`)) % 1;
    const a = random(`${seed}a${i}`) * Math.PI * 2;
    return { p: [Math.cos(a) * size * 0.12 * (1 - ph), size * (0.35 + ph * 0.75), Math.sin(a) * size * 0.08] as V3, r: size * 0.14 * (1 - ph), c: ph < 0.4 ? P.fire : P.meteor };
  });
  return (
    <group position={position} rotation={[0, 0, lean]}>
      {[0, 1, 2].map((i) => (
        <mesh key={`o${i}`} position={[Math.cos(i * 2.1) * size * 0.12, size * (0.2 + i * 0.15), Math.sin(i * 2.1) * size * 0.1]} rotation={[i, t * 2 + i, 0]}>
          <IcoG args={[size * (0.33 - i * 0.06), 1]} />
          <Glow color={P.meteor} opacity={0.55} />
        </mesh>
      ))}
      {core.map((b, i) => (
        <mesh key={i} position={b.p} rotation={[i * 0.7, t * 3 + i, 0]} scale={[1, 1.35, 1]}>
          <IcoG args={[Math.max(0.01, b.r), 1]} />
          <Glow color={b.c} />
        </mesh>
      ))}
      {licks.map((g, i) => (
        <mesh key={`l${i}`} position={g.p} rotation={[i, i * 2, 0]}>
          <IcoG args={[Math.max(0.01, g.r), 0]} />
          <Glow color={g.c} opacity={0.9} />
        </mesh>
      ))}
      <Halo position={[0, size * 0.4, 0]} size={size * 2.4} color={P.fire} opacity={0.4} />
      {light > 0 ? <pointLight position={[0, size * 0.55, 0]} color="#FFA850" intensity={light * (0.85 + 0.15 * f1)} distance={size * 14 + 6} decay={2} /> : null}
    </group>
  );
};

/** Flames spread over seeded points; a point burns once `burn(p)` > 0 (0..1 grows it). */
export const FireField: React.FC<{
  points: V3[];
  burn: (p: V3, i: number) => number;
  t: number;
  size?: number;
  seed?: string;
  smoke?: boolean;
  lights?: number;
}> = ({ points, burn, t, size = 1.6, seed = "ff", smoke = true, lights = 0 }) => (
  <group>
    {points.map((p, i) => {
      const k = clamp01(burn(p, i));
      if (k <= 0) return null;
      const s = size * (0.6 + random(`${seed}s${i}`) * 0.7) * ease(Math.min(1, k * 1.6));
      return (
        <group key={i}>
          <Flame position={p} size={s} t={t + i * 0.37} seed={`${seed}${i}`} light={i < lights ? 6 : 0} />
          {smoke && i % 3 === 0 ? (
            <group position={[p[0], p[1] + s * 1.1, p[2]]}>
              {[0, 1, 2].map((j) => {
                const ph = (t * 0.35 + random(`${seed}sm${i}${j}`)) % 1;
                return (
                  <mesh key={j} position={[ph * 2.5 + j * 0.4, ph * s * 5, (random(`${seed}sz${i}${j}`) - 0.5) * 1.5]}>
                    <IcoG args={[s * (0.4 + ph * 1.1), 1]} />
                    <Flat color={j % 2 ? P.smoke : P.smokeDark} opacity={0.85 * (1 - ph)} />
                  </mesh>
                );
              })}
            </group>
          ) : null}
        </group>
      );
    })}
  </group>
);

/** A wooden match standing on `position` (bottom of the stick), head up; `flame` is the flame height. */
export const Match: React.FC<{ position: V3; rotation?: V3; t: number; flame?: number; burnt?: number; smoke?: number }> = ({
  position,
  rotation = [0, 0, 0],
  t,
  flame = 0,
  burnt = 0,
  smoke = 0,
}) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 0.45, 0]} castShadow>
      <BoxG args={[0.07, 0.9, 0.07]} />
      <Flat color={mix("#E8D2A0", "#2A2220", burnt * 0.6)} />
    </mesh>
    <mesh position={[0, 0.94, 0]}>
      <IcoG args={[0.075, 1]} />
      <Flat color={mix("#C8372D", "#1A1414", burnt)} />
    </mesh>
    {flame > 0.01 ? <Flame position={[0, 0.9, 0]} size={flame} t={t} seed="match" light={Math.min(30, 8 + flame * 6)} /> : null}
    {smoke > 0
      ? [0, 1, 2, 3].map((i) => {
          const ph = (t * 0.6 + i * 0.25) % 1;
          return (
            <mesh key={i} position={[Math.sin(ph * 6 + i) * 0.08, 1.0 + ph * 1.2, 0]}>
              <IcoG args={[0.05 + ph * 0.12, 0]} />
              <Flat color="#B8B4C0" opacity={smoke * (1 - ph) * 0.8} />
            </mesh>
          );
        })
      : null}
  </group>
);

/** A kettle barbecue (top of the grate at y ≈ 2.1). `coals` 0..1 glow. */
export const GRILL_TOP = 2.1;
export const Grill: React.FC<{ position: V3; coals?: number }> = ({ position, coals = 0.6 }) => (
  <group position={position}>
    <mesh position={[0, GRILL_TOP - 0.05, 0]} castShadow>
      <sphereGeometry args={[0.95, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      <meshLambertMaterial color="#1E2028" flatShading side={THREE.DoubleSide} />
    </mesh>
    {[0, 1, 2].map((i) => {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      return <Strut key={i} a={[Math.cos(a) * 0.55, GRILL_TOP - 0.6, Math.sin(a) * 0.55]} b={[Math.cos(a) * 0.85, 0, Math.sin(a) * 0.85]} w={0.08} color="#2A2C34" />;
    })}
    <mesh position={[0, GRILL_TOP - 0.02, 0]}>
      <CylG args={[0.93, 0.93, 0.03, 16]} />
      <meshLambertMaterial color="#6A6E78" flatShading wireframe />
    </mesh>
    {Array.from({ length: 9 }, (_, i) => (
      <mesh key={i} position={[(random(`co${i}`) - 0.5) * 1.0, GRILL_TOP - 0.42, (random(`coz${i}`) - 0.5) * 1.0]}>
        <IcoG args={[0.13, 0]} />
        <Glow color={mix("#3A2A24", "#FF6A2A", coals * (0.6 + 0.4 * random(`cg${i}`)))} />
      </mesh>
    ))}
  </group>
);

/** Pine forest scattered over a hilly area with a fire front sweeping across it (+X). */
export const WildfireHills: React.FC<{ t: number; front: number; seed?: string; count?: number; area?: [number, number, number, number] }> = ({
  t,
  front,
  seed = "wf",
  count = 140,
  area = [-80, 80, -120, 10],
}) => {
  const trees = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const x = area[0] + random(`${seed}x${i}`) * (area[1] - area[0]);
        const z = area[2] + random(`${seed}z${i}`) * (area[3] - area[2]);
        const y = 3 * Math.sin(x * 0.04) * Math.cos(z * 0.05) + 3;
        return { p: [x, y, z] as V3, s: 2.2 + random(`${seed}s${i}`) * 1.6 };
      }),
    [count, seed, area],
  );
  const burnAt = (p: V3) => (front - p[0] - (p[2] + 60) * 0.25) / 12;
  return (
    <group>
      <mesh position={[0, 0, -60]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400, 30, 30]} />
        <Flat color="#5A6A3A" />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-90 + i * 24, -6, -40 - random(`h${i}`) * 60]} scale={[22, 9 + random(`hh${i}`) * 6, 18]} receiveShadow>
          <IcoG args={[1, 1]} />
          <Flat color={i % 2 ? "#6A7A42" : "#5A6E3A"} />
        </mesh>
      ))}
      {trees.map((tr, i) => {
        const b = burnAt(tr.p);
        const charred = clamp01(b - 0.6);
        return (
          <group key={i} position={tr.p} scale={tr.s}>
            <mesh position={[0, 0.6, 0]}>
              <CylG args={[0.12, 0.16, 1.2, 5]} />
              <Flat color={P.trunk} />
            </mesh>
            {[0, 1, 2].map((k) => (
              <mesh key={k} position={[0, 1.3 + k * 0.7, 0]}>
                <ConeG args={[0.9 - k * 0.22, 1.2, 6]} />
                <Flat color={mix(P.pine, "#2A2220", charred)} />
              </mesh>
            ))}
          </group>
        );
      })}
      <FireField
        points={trees.map((tr) => [tr.p[0], tr.p[1] + tr.s * 0.6, tr.p[2]] as V3)}
        burn={(p) => {
          const b = burnAt(p);
          return b > 0 && b < 2.2 ? Math.min(1, b * 2) * (b > 1.6 ? 1 - (b - 1.6) / 0.6 : 1) : 0;
        }}
        t={t}
        size={9}
        seed={`${seed}fire`}
        lights={0}
      />
    </group>
  );
};

/** Water dropped from a bomber: a falling, spreading curtain of blue streaks. `k` 0..1 over the drop. */
export const WaterDrop: React.FC<{ origin: V3; k: number; seed?: string }> = ({ origin, k, seed = "wd" }) => {
  if (k <= 0 || k >= 1) return null;
  return (
    <group position={origin}>
      {Array.from({ length: 60 }, (_, i) => {
        const d = random(`${seed}d${i}`);
        const fall = k * (14 + d * 10);
        return (
          <mesh key={i} position={[(random(`${seed}x${i}`) - 0.5) * (2 + k * 9), -fall, (random(`${seed}z${i}`) - 0.5) * (2 + k * 6) - k * 8 * d]}>
            <BoxG args={[0.25, 1.4, 0.25]} />
            <Flat color={i % 3 ? "#BFE3FF" : "#E8F4FF"} opacity={0.75 * (1 - k * 0.6)} />
          </mesh>
        );
      })}
    </group>
  );
};

// ---------------------------------------------------------------- molecules

/** One molecule: two faceted atoms. `o2` red oxygen, otherwise blue nitrogen. */
export const Molecule: React.FC<{ position: V3; r?: number; o2?: boolean; spin?: number; glow?: number; color?: string }> = ({ position, r = 0.26, o2 = true, spin = 0, glow = 0, color }) => {
  const c = color ?? (o2 ? O2_RED : N2_BLUE);
  return (
    <group position={position} rotation={[spin * 0.7, spin, spin * 0.3]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * r * 0.78, 0, 0]}>
          <IcoG args={[r, 1]} />
          <meshLambertMaterial color={c} flatShading emissive={c} emissiveIntensity={0.25 + glow * 0.5} />
        </mesh>
      ))}
    </group>
  );
};

/** Which of the 100 grid cells are oxygen, in order (seeded, scattered). */
const ORDER = (() => {
  const idx = Array.from({ length: 100 }, (_, i) => i);
  for (let i = 99; i > 0; i--) {
    const j = Math.floor(random(`ord${i}`) * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const rank: number[] = [];
  idx.forEach((cell, r) => (rank[cell] = r));
  return rank;
})();

/**
 * The air as 100 molecules on a 10×10 grid (a vertical plane facing +Z, centred on `position`).
 * `o2` cells are oxygen (21 today); raising it flips more cells, each with a little pop.
 */
export const AirGrid: React.FC<{ position: V3; o2: number; t: number; gap?: number; label?: boolean }> = ({ position, o2, t, gap = 1.15, label = true }) => (
  <group position={position}>
    {Array.from({ length: 100 }, (_, i) => {
      const gx = i % 10;
      const gy = Math.floor(i / 10);
      const r = ORDER[i];
      const k = clamp01(o2 - r);
      const pop = k > 0 && k < 1 ? 1 + Math.sin(k * Math.PI) * 0.5 : 1;
      return (
        <group key={i} position={[(gx - 4.5) * gap, (4.5 - gy) * gap + Math.sin(t * 1.5 + i) * 0.06, 0]} scale={pop}>
          <Molecule position={[0, 0, 0]} o2={k >= 0.5} spin={t * 0.6 + i} r={0.24} glow={k > 0 && k < 1 ? 1 : 0} />
        </group>
      );
    })}
    {label ? (
      <CanvasPanel
        position={[0, -6.4, 0]}
        w={9.6}
        h={1.2}
        px={1024}
        draw={(ctx, W, H) => {
          ctx.fillStyle = "rgba(10,14,30,0.92)";
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = O2_RED;
          ctx.beginPath();
          ctx.arc(W * 0.07, H / 2, H * 0.18, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = CANVAS_FONT(H * 0.4);
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(`OXYGEN ${Math.round(o2)}%`, W * 0.11, H / 2);
          ctx.fillStyle = N2_BLUE;
          ctx.beginPath();
          ctx.arc(W * 0.56, H / 2, H * 0.18, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#BFD0EE";
          ctx.fillText(`OTHER GASES ${100 - Math.round(o2)}%`, W * 0.6, H / 2);
        }}
      />
    ) : null}
  </group>
);

// ---------------------------------------------------------------- body diagrams

/** Lungs (two faceted lobes, windpipe and bronchi), centred on `position`, about 4.4 tall. */
export const Lungs: React.FC<{ position: V3; breath?: number; damage?: number; t?: number; scale?: number; opacity?: number }> = ({
  position,
  breath = 0,
  damage = 0,
  t = 0,
  scale = 1,
  opacity = 1,
}) => {
  const pink = mix("#E8909E", "#B0283A", damage);
  const inflate = 1 + 0.12 * breath;
  return (
    <group position={position} scale={scale}>
      <Strut a={[0, 3.0, 0]} b={[0, 1.4, 0]} w={0.32} color="#D8A0A8" />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Strut a={[0, 1.45, 0]} b={[s * 0.75, 0.75, 0]} w={0.22} color="#D8A0A8" />
          <mesh position={[s * 1.05, 0, 0]} scale={[0.95 * inflate, 1.55 * inflate, 0.8 * inflate]} castShadow>
            <IcoG args={[1, 2]} />
            <meshLambertMaterial color={pink} flatShading transparent={opacity < 1} opacity={opacity} emissive={damage > 0 ? "#FF2020" : "#000000"} emissiveIntensity={damage * (0.25 + 0.2 * Math.sin(t * 8))} />
          </mesh>
          {damage > 0
            ? Array.from({ length: 6 }, (_, i) => {
                const a = random(`lsp${s}${i}`) * Math.PI * 2;
                const y = (random(`lspy${s}${i}`) - 0.5) * 2.2;
                return (
                  <mesh key={i} position={[s * 1.05 + Math.cos(a) * 0.85 * inflate, y, Math.sin(a) * 0.55 + 0.35]} scale={damage}>
                    <IcoG args={[0.16, 0]} />
                    <Flat color="#5A1018" />
                  </mesh>
                );
              })
            : null}
        </group>
      ))}
    </group>
  );
};

/** A blood vessel along X (translucent wall) with red blood cells flowing, each carrying oxygen. */
export const BloodVessel: React.FC<{ t: number; length?: number; r?: number; cells?: number; full?: number }> = ({ t, length = 40, r = 1.7, cells = 34, full = 1 }) => (
  <group>
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[r, r, length, 18, 1, true]} />
      <meshLambertMaterial color="#E86A7A" flatShading transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
    {Array.from({ length: cells }, (_, i) => {
      const x = (((random(`rx${i}`) * length + t * 3.2) % length) + length) % length - length / 2;
      const y = (random(`ry${i}`) - 0.5) * r * 1.2;
      const z = (random(`rz${i}`) - 0.5) * r * 1.2;
      return <RedCell key={i} position={[x, y, z]} spin={t * 0.8 + i} filled={random(`rf${i}`) < full ? 4 : 3} />;
    })}
  </group>
);

/** A red blood cell (a faceted disc) with up to four oxygen molecules bound to it. */
export const RedCell: React.FC<{ position: V3; spin?: number; filled?: number; scale?: number }> = ({ position, spin = 0, filled = 4, scale = 1 }) => (
  <group position={position} rotation={[spin, spin * 0.6, 0.3]} scale={scale}>
    <mesh scale={[1, 0.32, 1]} castShadow>
      <IcoG args={[0.6, 2]} />
      <Flat color="#B8202E" />
    </mesh>
    <mesh position={[0, 0.17, 0]} scale={[1, 0.12, 1]}>
      <IcoG args={[0.32, 1]} />
      <Flat color="#8A1622" />
    </mesh>
    {[0, 1, 2, 3].map((k) =>
      k < filled ? <Molecule key={k} position={[Math.cos(k * 1.57) * 0.7, 0.12, Math.sin(k * 1.57) * 0.7]} r={0.12} o2 spin={k} glow={0.6} color="#FF8A6A" /> : null,
    )}
  </group>
);

/** A label card drawn on a real 3D panel. */
export const drawCard = (title: string, value: string, color = "#FFFFFF") => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "rgba(10,14,30,0.9)";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = color;
  ctx.lineWidth = H * 0.04;
  ctx.strokeRect(H * 0.04, H * 0.04, W - H * 0.08, H - H * 0.08);
  fitText(ctx, title, W / 2, H * 0.32, W * 0.86, H * 0.2, "#C8D0E8", false);
  fitText(ctx, value, W / 2, H * 0.66, W * 0.86, H * 0.38, color);
};

// ---------------------------------------------------------------- 300 million years ago

/** A lycopsid ("scale tree"): a tall straight trunk with a diamond-scale pattern and a forked crown. */
export const Lycopsid: React.FC<{ position: V3; h?: number; seed?: string; growth?: number }> = ({ position, h = 24, seed = "ly", growth = 1 }) => {
  const g = Math.max(0.05, growth);
  const segs = 8;
  return (
    <group position={position} scale={[g, g, g]}>
      {Array.from({ length: segs }, (_, i) => (
        <mesh key={i} position={[0, (i + 0.5) * (h / segs), 0]} rotation={[0, i * 0.4, 0]} castShadow>
          <CylG args={[0.62 - i * 0.03, 0.66 - i * 0.03, h / segs, 6]} />
          <Flat color={i % 2 ? "#4E6248" : "#5A7052"} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Strut a={[0, h - 0.2, 0]} b={[s * 2.4, h + 2.6, (random(`${seed}${s}`) - 0.5) * 1.5]} w={0.32} color="#4E6248" />
          {[0, 1].map((k) => {
            const tip: V3 = [s * (2.4 + k * 1.3), h + 2.6 + k * 0.8, (random(`${seed}t${s}${k}`) - 0.5) * 2];
            return (
              <group key={k}>
                {k ? <Strut a={[s * 2.4, h + 2.6, 0]} b={tip} w={0.22} color="#4E6248" /> : null}
                <mesh position={[tip[0], tip[1] - 0.6, tip[2]]} castShadow>
                  <ConeG args={[1.1, 2.6, 7]} />
                  <Flat color={k ? P.leafDark : "#3E7A44"} />
                </mesh>
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
};

/** A tree fern: a shaggy trunk and a crown of long drooping fronds. */
export const TreeFern: React.FC<{ position: V3; h?: number; seed?: string; growth?: number; color?: string }> = ({ position, h = 7, seed = "tf", growth = 1, color = "#3E8A4A" }) => {
  const g = Math.max(0.05, growth);
  return (
    <group position={position} scale={[g, g, g]} rotation={[0, random(seed) * 6, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <CylG args={[0.35, 0.5, h, 6]} />
        <Flat color="#4A3A28" />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return (
          <group key={i} position={[0, h, 0]} rotation={[0, a, 0]}>
            <mesh position={[0, 0.2, 1.6]} rotation={[-0.35 - random(`${seed}${i}`) * 0.3, 0, 0]} castShadow>
              <BoxG args={[0.9, 0.08, 3.4]} />
              <Flat color={i % 2 ? color : P.leafDark} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/** A giant horsetail (Calamites): a banded green trunk with whorls of thin leaves. */
export const Horsetail: React.FC<{ position: V3; h?: number; seed?: string }> = ({ position, h = 12, seed = "hs" }) => {
  const segs = 7;
  return (
    <group position={position}>
      {Array.from({ length: segs }, (_, i) => (
        <group key={i}>
          <mesh position={[0, (i + 0.5) * (h / segs), 0]} castShadow>
            <CylG args={[0.32, 0.36, h / segs - 0.08, 6]} />
            <Flat color="#5E8A4A" />
          </mesh>
          {i > 1
            ? Array.from({ length: 6 }, (_, k) => {
                const a = (k / 6) * Math.PI * 2 + i;
                const y = (i + 1) * (h / segs);
                return <Strut key={k} a={[0, y, 0]} b={[Math.cos(a) * 1.4, y + 0.5, Math.sin(a) * 1.4]} w={0.06} color="#4E7A3A" />;
              })
            : null}
        </group>
      ))}
    </group>
  );
};

/** The swamp: murky water, mud banks, fallen logs and a forest of lycopsids, horsetails and tree ferns. */
export const SWAMP_LOG = { c: [0, 0.75, 2] as V3, r: 0.75, len: 12 };
export const Swamp: React.FC<{ t: number; seed?: string }> = ({ t, seed = "sw" }) => {
  const trees = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const d = 11 + random(`${seed}d${i}`) * 75;
        return { p: [Math.cos(a) * d, 0, Math.sin(a) * d - 12] as V3, kind: i % 5 < 2 ? 0 : i % 5 < 4 ? 2 : 1, h: 20 + random(`${seed}h${i}`) * 16 };
      }).filter((tr) => !(Math.abs(tr.p[0]) < 9 && tr.p[2] > -6)),
    [seed],
  );
  return (
    <group>
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <Flat color="#2E4A3A" />
      </mesh>
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={i} position={[(random(`${seed}rx${i}`) - 0.5) * 80 + Math.sin(t * 0.3 + i) * 0.5, 0.0, (random(`${seed}rz${i}`) - 0.5) * 80]} rotation={[-Math.PI / 2, 0, random(`${seed}rr${i}`)]}>
          <planeGeometry args={[2 + random(`${seed}rw${i}`) * 3, 0.18]} />
          <Flat color="#5A7A62" />
        </mesh>
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[(random(`${seed}mx${i}`) - 0.5) * 70, -0.6, (random(`${seed}mz${i}`) - 0.5) * 60 - 10]} scale={[5 + random(`${seed}ms${i}`) * 6, 1.2, 4 + random(`${seed}mt${i}`) * 5]} receiveShadow>
          <IcoG args={[1, 1]} />
          <Flat color={i % 2 ? "#4A5A34" : "#3E5230"} />
        </mesh>
      ))}
      {/* the log Slavoski stands on */}
      <mesh position={SWAMP_LOG.c} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <CylG args={[SWAMP_LOG.r, SWAMP_LOG.r * 1.1, SWAMP_LOG.len, 8]} />
        <Flat color="#5A4630" />
      </mesh>
      {trees.map((tr, i) =>
        tr.kind === 0 ? (
          <Lycopsid key={i} position={tr.p} h={tr.h} seed={`${seed}l${i}`} />
        ) : tr.kind === 1 ? (
          <Horsetail key={i} position={tr.p} h={tr.h * 0.5} seed={`${seed}h${i}`} />
        ) : (
          <TreeFern key={i} position={tr.p} h={6 + (tr.h - 18) * 0.3} seed={`${seed}f${i}`} />
        ),
      )}
      {Array.from({ length: 26 }, (_, i) => (
        <mesh key={`gf${i}`} position={[(random(`${seed}gx${i}`) - 0.5) * 60, 0.2, -6 - random(`${seed}gz${i}`) * 40]} scale={[2.2, 1, 2.2]}>
          <IcoG args={[1, 0]} />
          <Flat color={i % 2 ? "#3E7A44" : "#2C5E3A"} />
        </mesh>
      ))}
      <mesh position={[30, 14, -150]}>
        <circleGeometry args={[7, 16]} />
        <Glow color="#FFE6B0" fog={false} />
      </mesh>
      <Halo position={[30, 14, -149]} size={60} color="#FFD49A" opacity={0.45} />
      {/* near ferns framing the log */}
      {[
        [-7, 0, -1],
        [7.5, 0, -2],
        [-9, 0, 5],
        [9, 0, 4],
      ].map((p, i) => (
        <TreeFern key={`n${i}`} position={p as V3} h={4 + i} seed={`${seed}n${i}`} />
      ))}
    </group>
  );
};

/**
 * A giant dragonfly (like Meganeura), facing +Z, wingspan ≈ 3.6 (NOT TO SCALE: about twice the real
 * 70 cm). `flap` is time in seconds; `xray` 0..1 turns the body see-through and lights its breathing tubes.
 */
export const Dragonfly: React.FC<{ position: V3; yaw?: number; pitch?: number; roll?: number; scale?: number; flap: number; xray?: number; t?: number }> = ({
  position,
  yaw = 0,
  pitch = 0,
  roll = 0,
  scale = 1,
  flap,
  xray = 0,
  t = 0,
}) => {
  const beat = Math.sin(flap * 2 * Math.PI * 7);
  const body = "#2E7A8A";
  const dark = "#1A3A48";
  const op = 1 - 0.75 * xray;
  const segs = 9;
  return (
    <group position={position} rotation={[pitch, yaw, roll]} scale={scale}>
      {/* abdomen (towards −Z), thorax, head with huge eyes */}
      {Array.from({ length: segs }, (_, i) => (
        <mesh key={i} position={[0, 0, -0.45 - i * 0.27]}>
          <BoxG args={[0.22 - i * 0.008, 0.22 - i * 0.008, 0.25]} />
          <meshLambertMaterial color={i % 2 ? body : dark} flatShading transparent={xray > 0} opacity={op} depthWrite={xray === 0} />
        </mesh>
      ))}
      <mesh position={[0, 0.02, 0]} scale={[1, 0.9, 1.4]}>
        <IcoG args={[0.3, 1]} />
        <meshLambertMaterial color={body} flatShading transparent={xray > 0} opacity={op} depthWrite={xray === 0} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.17, 0.08, 0.42]}>
          <IcoG args={[0.2, 1]} />
          <meshLambertMaterial color="#3FB8C8" flatShading emissive="#1A6A78" emissiveIntensity={0.4} transparent={xray > 0} opacity={op} />
        </mesh>
      ))}
      {/* legs */}
      {[-1, 1].flatMap((s) => [0, 1, 2].map((k) => <Strut key={`${s}${k}`} a={[s * 0.12, -0.1, 0.15 - k * 0.15]} b={[s * 0.4, -0.45, 0.25 - k * 0.2]} w={0.035} color={dark} />))}
      {/* four wings */}
      {[-1, 1].flatMap((s) =>
        [0.12, -0.18].map((z, k) => (
          <group key={`${s}${k}`} position={[s * 0.15, 0.14, z]} rotation={[0, s * (k ? 0.12 : -0.08), s * (0.15 + beat * 0.55 * (k ? -1 : 1))]}>
            <mesh position={[s * 0.95, 0, 0]}>
              <boxGeometry args={[1.9, 0.015, 0.42]} />
              <meshLambertMaterial color="#D8EEF4" transparent opacity={0.42} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <mesh position={[s * 0.95, 0.01, 0.19]}>
              <boxGeometry args={[1.9, 0.02, 0.03]} />
              <Flat color={dark} />
            </mesh>
          </group>
        )),
      )}
      {/* breathing tubes (tracheae): a glowing main pipe each side with branches, oxygen flowing in */}
      {xray > 0 ? (
        <group>
          {[-1, 1].map((s) => (
            <group key={s}>
              <Strut a={[s * 0.07, 0.04, 0.3]} b={[s * 0.06, 0.03, -2.6]} w={0.035} color="#7FF0FF" glow />
              {Array.from({ length: 10 }, (_, i) => {
                const z = 0.2 - i * 0.29;
                return <Strut key={i} a={[s * 0.07, 0.03, z]} b={[s * 0.14, (i % 2 ? 0.08 : -0.06), z - 0.12]} w={0.02} color="#7FF0FF" glow />;
              })}
              {Array.from({ length: 5 }, (_, i) => {
                const ph = (t * 0.5 + i / 5) % 1;
                return (
                  <mesh key={`o${i}`} position={[s * 0.07, 0.04, 0.3 - ph * 2.9]}>
                    <IcoG args={[0.05, 0]} />
                    <Glow color={O2_RED} />
                  </mesh>
                );
              })}
            </group>
          ))}
          <Halo position={[0, 0, -1]} size={4} color="#7FF0FF" opacity={0.2 * xray} />
        </group>
      ) : null}
    </group>
  );
};

/**
 * A giant millipede (like Arthropleura, about 2.5 m long → 6 units at hero scale), crawling along +X.
 * `s` is how far its head has travelled; the body follows a gentle S-curve; legs ripple.
 */
export const Millipede: React.FC<{ position: V3; s: number; yaw?: number; segs?: number; wiggle?: number }> = ({ position, s, yaw = 0, segs = 26, wiggle = 0.6 }) => {
  const path = (u: number): V3 => [u, 0, Math.sin(u * 0.45) * wiggle];
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {Array.from({ length: segs }, (_, i) => {
        const u = s - i * 0.24;
        const p = path(u);
        const q = path(u + 0.1);
        const a = Math.atan2(q[2] - p[2], q[0] - p[0]);
        const w = 1.15 * (i < 3 ? 0.7 + i * 0.1 : i > segs - 4 ? 0.6 + (segs - i) * 0.1 : 1);
        return (
          <group key={i} position={[p[0], 0.32, p[2]]} rotation={[0, -a, 0]}>
            <mesh castShadow>
              <BoxG args={[0.22, 0.28, w]} />
              <Flat color={i % 2 ? "#9A5E3A" : "#C08050"} />
            </mesh>
            {[-1, 1].map((sd) => {
              const ph = Math.sin(s * 9 - i * 0.7 + (sd > 0 ? Math.PI : 0));
              return <Strut key={sd} a={[0, -0.05, sd * w * 0.45]} b={[ph * 0.12, -0.32, sd * (w * 0.5 + 0.28)]} w={0.04} color="#3A2C22" />;
            })}
            {i === 0
              ? [-1, 1].map((sd) => <Strut key={`a${sd}`} a={[0.1, 0.1, sd * 0.2]} b={[0.8, 0.45, sd * 0.55]} w={0.04} color="#3A2C22" />)
              : null}
          </group>
        );
      })}
    </group>
  );
};

/** A spider (body ≈ 1.6 long at scale 1), facing +Z, feet on y = 0. `walk` ripples the legs. */
export const Spider: React.FC<{ position: V3; yaw?: number; scale?: number; walk?: number; color?: string; eyes?: number }> = ({
  position,
  yaw = 0,
  scale = 1,
  walk = 0,
  color = "#2A2228",
  eyes = 0,
}) => {
  const bodyY = 0.75;
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      <mesh position={[0, bodyY, 0.15]} castShadow>
        <IcoG args={[0.36, 1]} />
        <Flat color={color} />
      </mesh>
      <mesh position={[0, bodyY + 0.12, -0.55]} scale={[1, 0.85, 1.25]} castShadow>
        <IcoG args={[0.55, 1]} />
        <Flat color={color} />
      </mesh>
      <mesh position={[0, bodyY + 0.5, -0.6]} rotation={[0.3, 0, 0]}>
        <BoxG args={[0.18, 0.04, 0.5]} />
        <Flat color="#C8372D" />
      </mesh>
      {[-1, 1].flatMap((sd) =>
        [0, 1, 2, 3].map((k) => {
          const ph = Math.sin(walk * Math.PI * 2 + k * 1.6 + (sd > 0 ? Math.PI : 0));
          const az = 0.55 - k * 0.42;
          const hip: V3 = [sd * 0.25, bodyY, 0.2 - k * 0.12];
          const knee: V3 = [sd * 0.85, bodyY + 0.55 + Math.max(0, ph) * 0.15, hip[2] + az * 0.9 + ph * 0.1];
          const foot: V3 = [sd * 1.35, 0, hip[2] + az * 1.5 + ph * 0.2];
          return (
            <group key={`${sd}${k}`}>
              <Strut a={hip} b={knee} w={0.08} color={color} />
              <Strut a={knee} b={foot} w={0.06} color={color} />
            </group>
          );
        }),
      )}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[sd * 0.12, bodyY + 0.14, 0.47]}>
          <IcoG args={[0.07, 1]} />
          {eyes > 0 ? <Glow color="#FF3A30" /> : <Flat color="#0A0A0E" />}
        </mesh>
      ))}
    </group>
  );
};

/** A beetle (shell ≈ 1 long at scale 1), facing +Z. */
export const Beetle: React.FC<{ position: V3; yaw?: number; scale?: number; walk?: number; color?: string }> = ({ position, yaw = 0, scale = 1, walk = 0, color = "#2E6A4A" }) => (
  <group position={position} rotation={[0, yaw, 0]} scale={scale}>
    <mesh position={[0, 0.3, 0]} scale={[0.55, 0.35, 0.65]} castShadow>
      <IcoG args={[1, 2]} />
      <meshLambertMaterial color={color} flatShading emissive={color} emissiveIntensity={0.15} />
    </mesh>
    <mesh position={[0, 0.3, 0.68]} castShadow>
      <IcoG args={[0.22, 1]} />
      <Flat color="#1A1A20" />
    </mesh>
    {[-1, 1].flatMap((sd) =>
      [0, 1, 2].map((k) => {
        const ph = Math.sin(walk * Math.PI * 2 + k * 2 + (sd > 0 ? Math.PI : 0));
        return <Strut key={`${sd}${k}`} a={[sd * 0.4, 0.22, 0.3 - k * 0.3]} b={[sd * 0.8, 0, 0.4 - k * 0.35 + ph * 0.12]} w={0.05} color="#1A1A20" />;
      }),
    )}
  </group>
);
