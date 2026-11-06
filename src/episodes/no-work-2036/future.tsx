/**
 * The 2036 city for ep. 6: varied, slightly futuristic architecture instead of a grid of identical boxes.
 * Glass towers with ribbon windows (a shared canvas texture), stepped towers with terrace gardens,
 * twisted towers of rotated floor plates, round towers with light rings, needle spires, sky bridges,
 * a monorail and drones. Two styles: "bright" (the hopeful city) and "corp" (dark, red-lit, hazy,
 * branded towers, the corporate future). All motion is driven by `t`; all variety is seeded.
 */
import React, { useMemo } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { Ground, Road } from "../../slavoski/city";
import { BoxG, chamferBox, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import type { V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { CanvasPanel } from "../../slavoski/screens";
import { CORP_RED, drawLogo, R_VISOR } from "./props";

export type CityStyle = "bright" | "corp";
export type TowerKind = "glass" | "stepped" | "twist" | "round" | "spire";

const BODY: Record<CityStyle, string[]> = {
  bright: [P.bldgNavy, P.bldgSlate, P.bldgPurple, P.bldgTeal, P.bldgIndigo, "#8E9CB2", "#C9D2DE"],
  corp: ["#1A1F33", "#232842", "#2A2F48", "#1D274B", "#262236"],
};
const ACCENT: Record<CityStyle, string[]> = { bright: [R_VISOR, P.amber, "#B58CFF"], corp: [CORP_RED, "#FF5A6A"] };

// ---------------------------------------------------------------- ribbon-window texture

const texCache = new Map<string, { map: THREE.CanvasTexture; glow: THREE.CanvasTexture }>();
/**
 * Canvas pair for a tower facade: `map` (body colour spandrels + glass windows) and `glow` (only the lit
 * windows, used as the emissive map). 8 window columns × 8 floors per tile; repeat it to fit the tower.
 */
const facade = (body: string, style: CityStyle, variant: number) => {
  const key = `${body}|${style}|${variant}`;
  const hit = texCache.get(key);
  if (hit) return hit;
  const W = 128;
  const H = 256;
  const make = () => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    return c;
  };
  const a = make();
  const g = make();
  const ca = a.getContext("2d")!;
  const cg = g.getContext("2d")!;
  ca.fillStyle = body;
  ca.fillRect(0, 0, W, H);
  cg.fillStyle = "#000";
  cg.fillRect(0, 0, W, H);
  const floors = 8;
  const cols = 8;
  const fh = H / floors;
  const cw = W / cols;
  const litP = style === "bright" ? 0.42 : 0.14;
  for (let f = 0; f < floors; f++) {
    for (let k = 0; k < cols; k++) {
      const r = random(`fac${key}${f}:${k}`);
      const lit = r < litP;
      const glass = style === "bright" ? (r < 0.75 ? P.windowUnlit : "#5D7BA0") : "#2A3550";
      ca.fillStyle = lit ? (style === "bright" ? P.windowLit : "#E8C8C8") : glass;
      ca.fillRect(k * cw + 1, f * fh + fh * 0.22, cw - 2, fh * 0.56);
      if (lit) {
        cg.fillStyle = style === "bright" ? P.windowLit : "#C84A5A";
        cg.fillRect(k * cw + 1, f * fh + fh * 0.22, cw - 2, fh * 0.56);
      }
    }
  }
  const map = new THREE.CanvasTexture(a);
  const glow = new THREE.CanvasTexture(g);
  for (const t of [map, glow]) {
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.NearestFilter;
  }
  const out = { map, glow };
  texCache.set(key, out);
  return out;
};

/** A facade material sized so one floor is ~1.5 units tall and one window column ~1.4 wide. */
const FacadeMat: React.FC<{ body: string; style: CityStyle; w: number; h: number; variant: number; power?: number }> = ({ body, style, w, h, variant, power = 1 }) => {
  const { map, glow } = useMemo(() => {
    const base = facade(body, style, variant);
    const m = base.map.clone();
    const g = base.glow.clone();
    for (const t of [m, g]) {
      t.repeat.set(Math.max(1, Math.round(w / 11)), Math.max(1, h / 12));
      t.needsUpdate = true;
    }
    return { map: m, glow: g };
  }, [body, style, w, h, variant]);
  return <meshLambertMaterial map={map} emissiveMap={glow} emissive="#FFFFFF" emissiveIntensity={power} flatShading />;
};

// ---------------------------------------------------------------- towers

export type TowerSpec = { kind: TowerKind; position: V3; w: number; d: number; h: number; seed: string; color: string };

const Garden: React.FC<{ y: number; w: number; d: number; seed: string }> = ({ y, w, d, seed }) => (
  <group position={[0, y, 0]}>
    <mesh position={[0, 0.15, 0]} receiveShadow>
      <BoxG args={[w, 0.3, d]} />
      <Flat color={P.grass} />
    </mesh>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[(random(`${seed}gx${i}`) - 0.5) * w * 0.7, 0.3 + 0.6, (random(`${seed}gz${i}`) - 0.5) * d * 0.7]} castShadow>
        <IcoG args={[0.6 + random(`${seed}gs${i}`) * 0.4, 1]} />
        <Flat color={i % 2 ? P.leaf : P.leafDark} />
      </mesh>
    ))}
  </group>
);

/** One futuristic tower, base on y = 0 at `position`. */
export const FutureTower: React.FC<TowerSpec & { style: CityStyle; t: number; power?: number }> = ({ kind, position, w, d, h, seed, color, style, t, power = 1 }) => {
  const accent = ACCENT[style][Math.floor(random(`${seed}ac`) * ACCENT[style].length)];
  const variant = Math.floor(random(`${seed}v`) * 3);
  const blink = Math.floor(t * 1.3 + random(`${seed}bl`) * 2) % 2 === 0;
  const tipColor = style === "corp" ? (blink ? "#FF4040" : "#401010") : blink ? "#FFFFFF" : accent;
  const tip = (y: number) => (
    <group position={[0, y, 0]}>
      <mesh>
        <IcoG args={[0.3, 1]} />
        <Glow color={tipColor} fog={false} />
      </mesh>
      {style === "corp" && !blink ? null : <Halo size={3.4} color={style === "corp" ? "#FF4040" : accent} opacity={0.55} />}
    </group>
  );
  let body: React.ReactNode;
  if (kind === "glass") {
    body = (
      <>
        <mesh geometry={chamferBox(w, h, d)} position={[0, h / 2, 0]} castShadow receiveShadow>
          <FacadeMat body={color} style={style} w={w} h={h} variant={variant} power={power} />
        </mesh>
        {/* glowing corner fins */}
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => (
            <mesh key={`${sx}${sz}`} position={[sx * (w / 2 + 0.02), h / 2, sz * (d / 2 + 0.02)]}>
              <BoxG args={[0.14, h * 0.96, 0.14]} />
              <Glow color={accent} />
            </mesh>
          )),
        )}
        <mesh position={[0, h + 1.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <ConeG args={[Math.min(w, d) * 0.68, 3.2, 4]} />
          <Flat color={color} />
        </mesh>
        {tip(h + 3.5)}
      </>
    );
  } else if (kind === "stepped") {
    const tiers = [
      { k: 0, w, d, y0: 0, h: h * 0.5 },
      { k: 1, w: w * 0.74, d: d * 0.74, y0: h * 0.5, h: h * 0.3 },
      { k: 2, w: w * 0.5, d: d * 0.5, y0: h * 0.8, h: h * 0.2 },
    ];
    body = (
      <>
        {tiers.map((tr) => (
          <group key={tr.k}>
            <mesh geometry={chamferBox(tr.w, tr.h, tr.d)} position={[0, tr.y0 + tr.h / 2, 0]} castShadow receiveShadow>
              <FacadeMat body={color} style={style} w={tr.w} h={tr.h} variant={(variant + tr.k) % 3} power={power} />
            </mesh>
            {/* terrace: gardens either side in the bright city, a red light line in the corporate one */}
            {tr.k > 0 && style === "bright"
              ? [-1, 1].map((sd) => {
                  const prev = tiers[tr.k - 1];
                  const gw = (prev.w - tr.w) / 2 - 0.15;
                  return gw > 0.5 ? (
                    <group key={sd} position={[sd * (tr.w / 2 + gw / 2 + 0.05), 0, 0]}>
                      <Garden y={tr.y0} w={gw} d={prev.d * 0.85} seed={`${seed}t${tr.k}${sd}`} />
                    </group>
                  ) : null;
                })
              : null}
            {tr.k > 0 && style === "corp" ? (
              <mesh position={[0, tr.y0 + 0.05, tiers[tr.k - 1].d / 2 + 0.03]}>
                <planeGeometry args={[tiers[tr.k - 1].w, 0.25]} />
                <Glow color={accent} />
              </mesh>
            ) : null}
          </group>
        ))}
        <mesh position={[0, h + 3, 0]}>
          <CylG args={[0.08, 0.2, 6, 6]} />
          <Flat color="#2B2F3E" />
        </mesh>
        {tip(h + 6.2)}
      </>
    );
  } else if (kind === "twist") {
    const plateH = 1.6;
    const n = Math.max(4, Math.floor(h / plateH));
    const turn = (0.5 + random(`${seed}tw`) * 0.6) / n;
    body = (
      <>
        {Array.from({ length: n }, (_, i) => (
          <mesh key={i} position={[0, i * plateH + plateH / 2, 0]} rotation={[0, i * turn, 0]} castShadow receiveShadow>
            <BoxG args={[w, plateH * 0.92, d]} />
            {i % 4 === 3 ? <Glow color={accent} opacity={0.9} /> : <Flat color={i % 2 ? color : style === "bright" ? "#8FB3D9" : "#2A3550"} />}
          </mesh>
        ))}
        {tip(n * plateH + 0.6)}
      </>
    );
  } else if (kind === "round") {
    const r = Math.min(w, d) / 2;
    const rings = Math.floor(h / 6);
    body = (
      <>
        <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[r, r * 1.04, h, 14]} />
          <FacadeMat body={color} style={style} w={r * 6} h={h} variant={variant} power={power} />
        </mesh>
        {Array.from({ length: rings }, (_, i) => (
          <mesh key={i} position={[0, 4 + i * 6, 0]}>
            <CylG args={[r + 0.18, r + 0.18, 0.3, 14]} />
            <Glow color={accent} />
          </mesh>
        ))}
        <mesh position={[0, h, 0]} scale={[1, 0.55, 1]} castShadow>
          <IcoG args={[r * 0.95, 2]} />
          <Flat color={style === "bright" ? "#C9D2DE" : "#2A2F48"} />
        </mesh>
        {tip(h + r * 0.55 + 0.4)}
      </>
    );
  } else {
    // needle spire
    body = (
      <>
        <mesh geometry={chamferBox(w * 0.6, h * 0.7, d * 0.6)} position={[0, h * 0.35, 0]} castShadow receiveShadow>
          <FacadeMat body={color} style={style} w={w * 0.6} h={h * 0.7} variant={variant} power={power} />
        </mesh>
        <mesh position={[0, h * 0.7 + h * 0.15, 0]} castShadow>
          <ConeG args={[w * 0.32, h * 0.3, 6]} />
          <Flat color={color} />
        </mesh>
        {tip(h + 0.3)}
      </>
    );
  }
  return <group position={position}>{body}</group>;
};

// ---------------------------------------------------------------- city layout

export type FutureCityProps = {
  seed?: string;
  blocks?: number;
  block?: number;
  style?: CityStyle;
  t: number;
  /** Height multiplier (the city growing over ten years). */
  grow?: number;
  /** Lit-window strength 0..1. */
  power?: number;
  skip?: (bx: number, bz: number) => boolean;
  monorail?: boolean;
  drones?: number;
  /** Corporate HQ towers (the hex logo) placed on skipped blocks: [x, z, h, w]. */
  hq?: [number, number, number, number][];
};

const pickKind = (r: number, style: CityStyle): TowerKind => {
  if (style === "bright") return r < 0.3 ? "glass" : r < 0.52 ? "stepped" : r < 0.7 ? "twist" : r < 0.9 ? "round" : "spire";
  return r < 0.4 ? "glass" : r < 0.65 ? "stepped" : r < 0.75 ? "twist" : r < 0.9 ? "round" : "spire";
};

export const cityTowers = (seed: string, blocks: number, block: number, style: CityStyle, skip?: (bx: number, bz: number) => boolean) => {
  const out: TowerSpec[] = [];
  const bridges: { a: V3; b: V3 }[] = [];
  const parks: V3[] = [];
  const half = (blocks - 1) / 2;
  const extent = blocks * block;
  const inner = block - 4 - 2.4;
  const colors = BODY[style];
  for (let bx = 0; bx < blocks; bx++)
    for (let bz = 0; bz < blocks; bz++) {
      if (skip?.(bx, bz)) continue;
      const k = `${seed}:${bx}:${bz}`;
      const cx = (bx - half) * block;
      const cz = (bz - half) * block;
      // Downtown is taller: height falls off with distance from the centre.
      const rr = Math.hypot(cx, cz) / (extent * 0.42);
      const tall = 9 + 38 * Math.exp(-rr * rr);
      const layout = random(`${k}lay`);
      if (style === "bright" && layout < 0.1) {
        parks.push([cx, 0, cz]);
        continue;
      }
      const color = () => colors[Math.floor(random(`${k}c${out.length}`) * colors.length)];
      if (layout < 0.45) {
        const s = inner * (0.62 + random(`${k}s`) * 0.2);
        out.push({ kind: pickKind(random(`${k}k`), style), position: [cx, 0, cz], w: s, d: s, h: tall * (0.8 + random(`${k}h`) * 0.5), seed: k, color: color() });
      } else if (layout < 0.75) {
        const s = inner * 0.42;
        const hA = tall * (0.6 + random(`${k}ha`) * 0.5);
        const hB = tall * (0.5 + random(`${k}hb`) * 0.5);
        const a: V3 = [cx - inner * 0.26, 0, cz + (random(`${k}oz`) - 0.5) * 2];
        const b: V3 = [cx + inner * 0.26, 0, cz - (random(`${k}oz`) - 0.5) * 2];
        out.push({ kind: pickKind(random(`${k}ka`), style), position: a, w: s, d: s, h: hA, seed: `${k}a`, color: color() });
        out.push({ kind: pickKind(random(`${k}kb`), style), position: b, w: s, d: s, h: hB, seed: `${k}b`, color: color() });
        if (random(`${k}br`) < 0.6) {
          const y = Math.min(hA, hB) * 0.55;
          bridges.push({ a: [a[0] + s / 2, y, (a[2] + b[2]) / 2], b: [b[0] - s / 2, y, (a[2] + b[2]) / 2] });
        }
      } else {
        const s = inner * 0.38;
        for (let i = 0; i < 4; i++) {
          const ox = (i % 2 ? 1 : -1) * inner * 0.25;
          const oz = (i < 2 ? 1 : -1) * inner * 0.25;
          out.push({
            kind: pickKind(random(`${k}k${i}`), style),
            position: [cx + ox, 0, cz + oz],
            w: s,
            d: s,
            h: tall * (0.3 + random(`${k}h${i}`) * 0.45),
            seed: `${k}${i}`,
            color: color(),
          });
        }
      }
    }
  return { towers: out, bridges, parks };
};

/** Drones on seeded loops above the streets. */
export const Drones: React.FC<{ count: number; t: number; style: CityStyle; radius?: number; y?: [number, number]; seed?: string }> = ({ count, t, style, radius = 40, y = [14, 34], seed = "drone" }) => (
  <group>
    {Array.from({ length: count }, (_, i) => {
      const r = radius * (0.3 + random(`${seed}r${i}`) * 0.7);
      const a = random(`${seed}a${i}`) * Math.PI * 2 + t * (0.08 + random(`${seed}s${i}`) * 0.12) * (i % 2 ? 1 : -1);
      const yy = y[0] + random(`${seed}y${i}`) * (y[1] - y[0]) + Math.sin(t * 1.5 + i) * 0.4;
      return (
        <group key={i} position={[Math.cos(a) * r, yy, Math.sin(a) * r]}>
          <mesh>
            <BoxG args={[1.0, 0.25, 1.0]} />
            <Flat color="#2B2F3E" />
          </mesh>
          <mesh position={[0, -0.22, 0]}>
            <IcoG args={[0.16, 1]} />
            <Glow color={style === "corp" ? "#FF3A4A" : i % 3 ? R_VISOR : P.amber} fog={false} />
          </mesh>
          <Halo position={[0, -0.22, 0]} size={1.8} color={style === "corp" ? "#FF3A4A" : i % 3 ? R_VISOR : P.amber} opacity={0.5} />
        </group>
      );
    })}
  </group>
);

/** Elevated monorail along X at z, with a three-car train sliding along with t. */
export const Monorail: React.FC<{ z: number; length: number; y?: number; t: number; style: CityStyle }> = ({ z, length, y = 16, t, style }) => {
  const pillars = Math.floor(length / 14);
  const trainX = ((t * 14) % (length + 40)) - length / 2 - 20;
  return (
    <group>
      <mesh position={[0, y, z]} castShadow>
        <BoxG args={[length, 0.9, 1.4]} />
        <Flat color={style === "bright" ? "#C9D2DE" : "#2A2F48"} />
      </mesh>
      {Array.from({ length: pillars }, (_, i) => (
        <mesh key={i} position={[-length / 2 + 7 + i * 14, y / 2, z]} castShadow>
          <CylG args={[0.5, 0.7, y, 8]} />
          <Flat color={style === "bright" ? "#AEB6C4" : "#1D2233"} />
        </mesh>
      ))}
      {[0, 1, 2].map((c) => (
        <group key={c} position={[trainX - c * 10.6, y + 1.9, z]}>
          <mesh castShadow>
            <BoxG args={[10, 2.6, 2.4]} />
            <Flat color={style === "bright" ? "#F2F6FA" : "#3A3F55"} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0, 0.3, s * 1.21]} rotation={[0, s > 0 ? 0 : Math.PI, 0]}>
              <planeGeometry args={[9, 0.8]} />
              <Glow color={style === "bright" ? R_VISOR : "#C84A5A"} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

/** The 2036 city: roads every `block`, varied towers, sky bridges, parks, a monorail, drones; corp haze and HQ towers. */
export const FutureCity: React.FC<FutureCityProps> = ({ seed = "future", blocks = 6, block = 18, style = "bright", t, grow = 1, power, skip, monorail = true, drones = 24, hq = [] }) => {
  const { towers, bridges, parks } = useMemo(() => cityTowers(seed, blocks, block, style, skip), [seed, blocks, block, style, skip]);
  const extent = blocks * block;
  const pw = power ?? (style === "bright" ? 1 : 0.55);
  return (
    <group>
      <Ground color={style === "bright" ? "#3A4258" : "#22263A"} />
      {Array.from({ length: blocks + 1 }, (_, i) => {
        const o = (i - blocks / 2) * block;
        return (
          <React.Fragment key={i}>
            <Road position={[o, 0.01, 0]} width={4} length={extent + block} />
            <Road position={[0, 0.012, o]} width={4} length={extent + block} yaw={Math.PI / 2} />
          </React.Fragment>
        );
      })}
      {towers.map((s) => (
        <FutureTower key={s.seed} {...s} h={s.h * grow} style={style} t={t} power={pw} />
      ))}
      {bridges.map((b, i) => (
        <group key={i}>
          <mesh position={[(b.a[0] + b.b[0]) / 2, b.a[1] * grow, b.a[2]]} castShadow>
            <BoxG args={[Math.abs(b.b[0] - b.a[0]) + 0.6, 1.2, 2.2]} />
            <Flat color={style === "bright" ? "#C9D2DE" : "#2A2F48"} />
          </mesh>
          <mesh position={[(b.a[0] + b.b[0]) / 2, b.a[1] * grow - 0.62, b.a[2]]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[Math.abs(b.b[0] - b.a[0]), 0.5]} />
            <Glow color={ACCENT[style][0]} />
          </mesh>
        </group>
      ))}
      {parks.map((p, i) => (
        <group key={i} position={p}>
          <mesh position={[0, 0.06, 0]} receiveShadow>
            <BoxG args={[block - 6, 0.12, block - 6]} />
            <Flat color={P.grass} />
          </mesh>
          {Array.from({ length: 6 }, (_, j) => (
            <group key={j} position={[(random(`pk${i}x${j}`) - 0.5) * (block - 9), 0, (random(`pk${i}z${j}`) - 0.5) * (block - 9)]}>
              <mesh position={[0, 0.6, 0]}>
                <CylG args={[0.15, 0.2, 1.2, 6]} />
                <Flat color={P.trunk} />
              </mesh>
              <mesh position={[0, 2.0, 0]} castShadow>
                <IcoG args={[1.1, 1]} />
                <Flat color={j % 2 ? P.leaf : P.leafDark} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {monorail ? <Monorail z={(Math.floor(blocks / 2) - blocks / 2) * block + block} length={extent + block * 2} t={t} style={style} /> : null}
      <Drones count={drones} t={t} style={style} radius={extent * 0.5} />
      {hq.map(([x, z, h, w], i) => (
        <MegaTower key={i} position={[x, 0, z]} h={h} w={w} t={t} seed={`hq${i}`} />
      ))}
      {style === "corp" ? (
        <>
          {/* smog layers */}
          {[9, 22].map((y, i) => (
            <mesh key={y} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[extent * 3, extent * 3]} />
              <meshBasicMaterial color="#5E4B55" transparent opacity={0.16 - i * 0.05} depthWrite={false} toneMapped={false} />
            </mesh>
          ))}
          {/* searchlights sweeping from the HQ roofs */}
          {hq.map(([x, z, h], i) => (
            <mesh key={`s${i}`} position={[x, h + 30, z]} rotation={[Math.sin(t * 0.6 + i * 2) * 0.35, 0, Math.cos(t * 0.5 + i) * 0.35]}>
              <ConeG args={[5, 60, 12, 1, true]} />
              <meshBasicMaterial color="#FF8A8A" transparent opacity={0.07} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
          ))}
          {/* corporate screens on a few towers */}
          {towers
            .filter((s, i) => i % 5 === 2 && s.h > 20 && (s.kind === "glass" || s.kind === "stepped"))
            .slice(0, 6)
            .map((s, i) => (
              <CanvasPanel key={i} position={[s.position[0], s.h * grow * (s.kind === "glass" ? 0.62 : 0.3), s.position[2] + s.d / 2 + 0.25]} w={s.w * 0.6} h={s.w * 0.6} px={256} draw={drawLogo} />
            ))}
        </>
      ) : null}
    </group>
  );
};

/** A ring of future towers on the horizon (backdrops for street, park and rooftop shots). */
export const FutureSkyline: React.FC<{ radius?: number; count?: number; seed?: string; arc?: [number, number]; style?: CityStyle; t: number; y?: number; scale?: number; power?: number }> = ({
  radius = 180,
  count = 22,
  seed = "fsky",
  arc = [Math.PI * 0.6, Math.PI * 1.4],
  style = "bright",
  t,
  y = 0,
  scale = 1,
  power,
}) => {
  const specs = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = arc[0] + ((arc[1] - arc[0]) * (i + random(`${seed}a${i}`) * 0.7)) / count;
        const r = radius * (0.88 + random(`${seed}r${i}`) * 0.24);
        const s = 10 + random(`${seed}w${i}`) * 8;
        return {
          kind: pickKind(random(`${seed}k${i}`), style),
          position: [Math.sin(a) * r, y, Math.cos(a) * r] as V3,
          w: s,
          d: s,
          h: 40 + random(`${seed}h${i}`) * random(`${seed}h2${i}`) * 110,
          seed: `${seed}${i}`,
          color: BODY[style][Math.floor(random(`${seed}c${i}`) * BODY[style].length)],
        } satisfies TowerSpec;
      }),
    [radius, count, seed, arc, style, y],
  );
  return (
    <group scale={scale}>
      {specs.map((s) => (
        <FutureTower key={s.seed} {...s} style={style} t={t} power={power ?? (style === "bright" ? 1 : 0.55)} />
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- the corporate HQ

/**
 * A giant corporate HQ (base on y = 0): podium with a lit entrance, a lit-window lower shaft with red corner
 * strips, a floating sky lobby, a set-back upper shaft, a finned crown carrying the hex logo on all four
 * sides, a slowly turning red halo and a spire. Generic: no text, no real brand.
 */
export const MegaTower: React.FC<{ position: V3; h?: number; w?: number; t?: number; seed?: string }> = ({ position, h = 90, w = 16, t = 0, seed = "mega" }) => {
  const body = "#141826";
  const podH = h * 0.08;
  const lowTop = h * 0.55;
  const lobbyH = Math.max(1.6, h * 0.025);
  const upTop = h * 0.85;
  const wu = w * 0.8;
  const wc = w * 0.6;
  const blink = Math.floor(t * 1.4 + random(seed) * 2) % 2 === 0;
  return (
    <group position={position}>
      {/* podium + entrance */}
      <mesh geometry={chamferBox(w * 1.4, podH, w * 1.4)} position={[0, podH / 2, 0]} castShadow receiveShadow>
        <Flat color="#1B2030" />
      </mesh>
      <mesh position={[0, podH * 0.4, w * 0.7 + 0.03]}>
        <planeGeometry args={[w * 0.5, podH * 0.6]} />
        <Glow color="#C84A5A" />
      </mesh>
      {/* lower shaft */}
      <mesh geometry={chamferBox(w, lowTop - podH, w)} position={[0, (podH + lowTop) / 2, 0]} castShadow receiveShadow>
        <FacadeMat body={body} style="corp" w={w} h={lowTop - podH} variant={1} power={0.5} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (w / 2 + 0.05), (podH + lowTop) / 2, sz * (w / 2 + 0.05)]}>
            <BoxG args={[0.3, lowTop - podH - 1, 0.3]} />
            <Glow color={CORP_RED} />
          </mesh>
        )),
      )}
      {/* sky lobby: a recessed glowing band that makes the upper shaft float */}
      <mesh position={[0, lowTop + lobbyH / 2, 0]}>
        <BoxG args={[w * 0.7, lobbyH, w * 0.7]} />
        <Glow color="#FF5A6A" />
      </mesh>
      {/* upper shaft */}
      <mesh geometry={chamferBox(wu, upTop - lowTop - lobbyH, wu)} position={[0, (lowTop + lobbyH + upTop) / 2, 0]} castShadow receiveShadow>
        <FacadeMat body={body} style="corp" w={wu} h={upTop - lowTop - lobbyH} variant={2} power={0.5} />
      </mesh>
      {/* crown: dark core with fins, the logo on every face */}
      <mesh geometry={chamferBox(wc, h - upTop, wc)} position={[0, (upTop + h) / 2, 0]} castShadow>
        <Flat color={body} />
      </mesh>
      {[0, 1, 2, 3].map((f) => (
        <group key={f} rotation={[0, (f * Math.PI) / 2, 0]}>
          {[-0.42, 0.42].map((x) => (
            <mesh key={x} position={[x * wc, (upTop + h) / 2, wc / 2 + 0.25]} castShadow>
              <BoxG args={[0.3, h - upTop + 2, 0.5]} />
              <Flat color="#222838" />
            </mesh>
          ))}
          <CanvasPanel position={[0, (upTop + h) / 2, wc / 2 + 0.04]} w={wc * 0.66} h={wc * 0.66} px={512} draw={drawLogo} />
        </group>
      ))}
      <mesh position={[0, upTop + (h - upTop) * 0.25, 0]} rotation={[Math.PI / 2 + 0.12 * Math.sin(t * 0.4), 0, t * 0.3]}>
        <torusGeometry args={[w * 0.72, Math.max(0.12, w * 0.02), 4, 48]} />
        <meshBasicMaterial color={CORP_RED} toneMapped={false} />
      </mesh>
      {/* soft glow around the halo ring */}
      <mesh position={[0, upTop + (h - upTop) * 0.25, 0]} rotation={[Math.PI / 2 + 0.12 * Math.sin(t * 0.4), 0, t * 0.3]}>
        <torusGeometry args={[w * 0.72, Math.max(0.6, w * 0.1), 6, 48]} />
        <meshBasicMaterial color={CORP_RED} transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* spire */}
      <mesh position={[0, h + h * 0.07, 0]}>
        <CylG args={[0.15, Math.max(0.4, w * 0.04), h * 0.14, 6]} />
        <Flat color="#2B2F3E" />
      </mesh>
      <mesh position={[0, h + h * 0.14 + 0.4, 0]}>
        <IcoG args={[Math.max(0.5, w * 0.04), 1]} />
        <Glow color={blink ? "#FF4040" : "#401010"} fog={false} />
      </mesh>
      {blink ? <Halo position={[0, h + h * 0.14 + 0.4, 0]} size={Math.max(5, w * 0.6)} color="#FF4040" opacity={0.6} /> : null}
      <Halo position={[0, lowTop + lobbyH / 2, w * 0.36]} size={w * 1.1} color="#FF5A6A" opacity={0.18} />
    </group>
  );
};
