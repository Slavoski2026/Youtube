/**
 * Props and sets for "What If Everyone Had a Death Countdown?" (ep. 8).
 * The star prop is `Timer`: a floating holographic countdown above a head, billboarded to the camera,
 * ticking live (years / days / hh:mm:ss), green → amber → red as time runs short. Generic world,
 * non-graphic: nobody dies on screen.
 * Everything is at hero scale (Slavoski ≈ 4.2 tall) and rests on y = 0 by its real extents.
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { Building, BUILDING_COLORS } from "../../slavoski/city";
import { BoxG, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { FONT } from "../../slavoski/fonts";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { clamp01, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { DIM, type Pose } from "../../slavoski/rig/Hero";
import { CANVAS_FONT, CanvasPanel, fitText } from "../../slavoski/screens";

// ================================================================ the countdown

const YEAR = 365.25 * 86400;
export const yrs = (n: number) => n * YEAR;
export const days = (n: number) => n * 86400;

export const TONE = { long: "#4BE3A4", mid: P.amber, short: "#FF4A3A" } as const;
/** Green for 20+ years, amber for 1–20 years, red for under a year. */
export const toneFor = (sec: number) => (sec >= yrs(20) ? TONE.long : sec >= YEAR ? TONE.mid : TONE.short);

const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");
const hms = (s: number) => `${pad(s / 3600)}:${pad((s % 3600) / 60)}:${pad(s % 60)}`;

/** Splits seconds left into the timer's big value, unit and ticking sub-line. */
export const fmtLeft = (sec: number): { big: string; unit: string; sub: string } => {
  const s = Math.max(0, sec);
  if (s >= YEAR) {
    const y = Math.floor(s / YEAR);
    const rem = s - y * YEAR;
    return { big: String(y), unit: y === 1 ? "YEAR" : "YEARS", sub: `${Math.floor(rem / 86400)}D  ${hms(rem % 86400)}` };
  }
  if (s >= 86400) {
    const d = Math.floor(s / 86400);
    return { big: String(d), unit: d === 1 ? "DAY" : "DAYS", sub: hms(s % 86400) };
  }
  return { big: hms(s), unit: "", sub: "LEFT" };
};

/** CanvasPanel with transparency (rounded holograms): unlit, not fogged, drawn over what's behind. */
export const HoloPanel: React.FC<{ w: number; h: number; px?: number; opacity?: number; draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => void }> = ({
  w,
  h,
  px = 640,
  opacity = 1,
  draw,
}) => {
  const W = px;
  const H = Math.max(8, Math.round((px * h) / w));
  const { canvas, tex } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return { canvas, tex };
  }, [W, H]);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, W, H);
    draw(ctx, W, H);
    tex.needsUpdate = true;
  }
  return (
    <mesh renderOrder={20}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} toneMapped={false} fog={false} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const drawHourglassIcon = (ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string, k: number) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = s * 0.12;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy - s);
  ctx.lineTo(cx + s * 0.5, cy - s);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx + s * 0.5, cy + s);
  ctx.lineTo(cx - s * 0.5, cy + s);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.stroke();
  // sand: top shrinking, bottom growing
  const top = 1 - k;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5 * top, cy - s * top);
  ctx.lineTo(cx + s * 0.5 * top, cy - s * top);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy + s);
  ctx.lineTo(cx + s * 0.5, cy + s);
  ctx.lineTo(cx + s * 0.5 * (1 - k * 0.5), cy + s * (1 - k * 0.6));
  ctx.lineTo(cx - s * 0.5 * (1 - k * 0.5), cy + s * (1 - k * 0.6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

const GLYPHS = "0123456789";

/** Draws the timer face (used by Timer and by full-screen inserts). */
export const drawTimer =
  (o: { sec: number; t: number; glitch?: number; seed?: string; color?: string; text?: { big: string; unit: string; sub: string } }) =>
  (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const { sec, t, glitch = 0, seed = "tm" } = o;
    const tone = o.color ?? toneFor(sec);
    const f = o.text ?? fmtLeft(sec);
    const fr = Math.floor(t * 30);
    const scramble = (s: string, k: string) =>
      glitch <= 0
        ? s
        : s
            .split("")
            .map((ch, i) => (/[0-9]/.test(ch) && random(`${seed}g${k}${fr}${i}`) < glitch ? GLYPHS[Math.floor(random(`${seed}c${k}${fr}${i}`) * 10)] : ch))
            .join("");
    const jx = glitch > 0 ? (random(`${seed}jx${fr}`) - 0.5) * W * 0.06 * glitch : 0;
    const pad = H * 0.06;
    ctx.save();
    ctx.translate(jx, 0);
    roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, H * 0.2);
    ctx.fillStyle = "rgba(7,10,26,0.8)";
    ctx.fill();
    ctx.shadowColor = tone;
    ctx.shadowBlur = H * 0.12;
    ctx.lineWidth = H * 0.035;
    ctx.strokeStyle = tone;
    ctx.stroke();
    ctx.shadowBlur = 0;
    // hourglass icon on the left
    drawHourglassIcon(ctx, W * 0.13, H * 0.5, H * 0.2, tone, (t * 0.25) % 1);
    const x0 = W * 0.23;
    const x1 = W - pad * 2.2;
    const cx = (x0 + x1) / 2;
    const big = scramble(f.big, "b");
    const sub = scramble(f.sub, "s");
    ctx.textBaseline = "alphabetic";
    if (f.unit) {
      const bs = H * 0.44;
      const us = H * 0.2;
      ctx.font = CANVAS_FONT(bs);
      const bw = ctx.measureText(big).width;
      ctx.font = CANVAS_FONT(us);
      const uw = ctx.measureText(f.unit).width;
      const gap = H * 0.06;
      const total = bw + gap + uw;
      const k = Math.min(1, (x1 - x0) / total);
      const sx = cx - (total * k) / 2;
      ctx.save();
      ctx.translate(sx, H * 0.56);
      ctx.scale(k, k);
      ctx.textAlign = "left";
      ctx.font = CANVAS_FONT(bs);
      ctx.fillStyle = tone;
      ctx.shadowColor = tone;
      ctx.shadowBlur = H * 0.08;
      ctx.fillText(big, 0, 0);
      ctx.shadowBlur = 0;
      ctx.font = CANVAS_FONT(us);
      ctx.fillStyle = P.cream;
      ctx.fillText(f.unit, bw + gap, 0);
      ctx.restore();
    } else {
      ctx.shadowColor = tone;
      ctx.shadowBlur = H * 0.08;
      fitText(ctx, big, cx, H * 0.43, x1 - x0, H * 0.4, tone);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 0.72;
    fitText(ctx, sub, cx, H * 0.77, x1 - x0, H * 0.15, P.cream, false);
    ctx.restore();
  };

export const TIMER_W = 2.6;
export const TIMER_H = 1.06;
/** Height of a timer's centre above the feet of the person it belongs to. */
export const TIMER_Y = 5.55;

/**
 * A floating countdown, centred at `at`, turned to face `face` (the camera position).
 * `pop` 0..1 springs it in; `glitch` 0..1 scrambles digits and jitters; `seconds` is the time left.
 */
export const Timer: React.FC<{
  at: V3;
  face: V3;
  seconds: number;
  t: number;
  scale?: number;
  pop?: number;
  glitch?: number;
  seed?: string;
  color?: string;
  text?: { big: string; unit: string; sub: string };
  opacity?: number;
  halo?: number;
}> = ({ at, face, seconds, t, scale = 1, pop = 1, glitch = 0, seed = "tm", color, text, opacity = 1, halo = 0.4 }) => {
  if (pop <= 0 || opacity <= 0) return null;
  const bob = Math.sin(t * 2.1 + random(`${seed}ph`) * 6) * 0.06 * scale;
  const p: V3 = [at[0], at[1] + bob, at[2]];
  const dx = face[0] - p[0];
  const dz = face[2] - p[2];
  const yaw = Math.atan2(dx, dz);
  const pitch = -Math.atan2(face[1] - p[1], Math.hypot(dx, dz)) * 0.85;
  // spring in with a little overshoot
  const k = clamp01(pop);
  const s = scale * (k >= 1 ? 1 : 1 + 2.2 * (k - 1) ** 3 + 1.2 * (k - 1) ** 2);
  const tone = color ?? toneFor(seconds);
  const flicker = glitch > 0 ? 0.7 + 0.3 * random(`${seed}fl${Math.floor(t * 30)}`) : 1;
  return (
    <group position={p} rotation={new THREE.Euler(pitch, yaw, 0, "YXZ")} scale={Math.max(0.001, s)}>
      <Halo position={[0, 0, -0.05]} size={TIMER_W * 1.5} color={tone} opacity={halo * opacity * flicker} />
      <HoloPanel w={TIMER_W} h={TIMER_H} opacity={opacity * flicker} draw={drawTimer({ sec: seconds, t, glitch, seed, color, text })} />
    </group>
  );
};

/** The timer breaking into glowing shards that drift away and fade (k 0..1). */
export const TimerShards: React.FC<{ at: V3; k: number; color: string; seed?: string; scale?: number }> = ({ at, k, color, seed = "sh", scale = 1 }) => {
  if (k <= 0 || k >= 1) return null;
  return (
    <group position={at} scale={scale}>
      {Array.from({ length: 26 }, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const sp = 0.8 + random(`${seed}s${i}`) * 2.2;
        const x0 = (random(`${seed}x${i}`) - 0.5) * TIMER_W;
        const y0 = (random(`${seed}y${i}`) - 0.5) * TIMER_H;
        const e = 1 - (1 - k) ** 2;
        return (
          <mesh
            key={i}
            position={[x0 + Math.cos(a) * sp * e, y0 + Math.sin(a) * sp * e * 0.7 + e * 0.6, (random(`${seed}z${i}`) - 0.5) * 1.6 * e]}
            rotation={[k * 6 * random(`${seed}r${i}`), k * 5, k * 4 * random(`${seed}q${i}`)]}
          >
            <tetrahedronGeometry args={[0.1 + random(`${seed}w${i}`) * 0.14, 0]} />
            <Glow color={i % 3 ? color : "#FFD0C8"} opacity={1 - k} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Aerial view of a kit-scale city: tiny people on every pavement, each with a glowing timer dot above. */
const tmpO = new THREE.Object3D();
const tmpC = new THREE.Color();
export const TimerDots: React.FC<{ t: number; count?: number; extent?: number; block?: number; seed?: string; pop?: number }> = ({
  t,
  count = 700,
  extent = 42,
  block = 14,
  seed = "dots",
  pop = 1,
}) => {
  const dots = useRef<THREE.InstancedMesh>(null);
  const bodies = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const alongX = random(`${seed}ax${i}`) < 0.5;
        const roads = Math.round((extent * 2) / block) + 1;
        const road = -extent + Math.floor(random(`${seed}r${i}`) * roads) * block;
        const side = (random(`${seed}sd${i}`) < 0.5 ? -1 : 1) * (2.3 + random(`${seed}o${i}`) * 0.5);
        const r = random(`${seed}c${i}`);
        return {
          alongX,
          road: road + side,
          s0: (random(`${seed}s${i}`) - 0.5) * extent * 2,
          v: (random(`${seed}v${i}`) < 0.5 ? -1 : 1) * (0.6 + random(`${seed}vv${i}`) * 0.8),
          color: r < 0.6 ? TONE.long : r < 0.88 ? TONE.mid : TONE.short,
          delay: random(`${seed}d${i}`) * 0.6,
        };
      }),
    [count, extent, block, seed],
  );
  useLayoutEffect(() => {
    const d = dots.current;
    const b = bodies.current;
    if (!d || !b) return;
    items.forEach((it, i) => {
      const span = extent * 2;
      const s = ((((it.s0 + it.v * t + extent) % span) + span) % span) - extent;
      const x = it.alongX ? s : it.road;
      const z = it.alongX ? it.road : s;
      const k = clamp01((pop - it.delay) / 0.3);
      tmpO.position.set(x, 1.15, z);
      tmpO.rotation.set(0, 0, 0);
      tmpO.scale.setScalar(Math.max(0.001, k));
      tmpO.updateMatrix();
      d.setMatrixAt(i, tmpO.matrix);
      d.setColorAt(i, tmpC.set(it.color));
      tmpO.position.set(x, 0.3, z);
      tmpO.scale.setScalar(1);
      tmpO.updateMatrix();
      b.setMatrixAt(i, tmpO.matrix);
    });
    d.instanceMatrix.needsUpdate = true;
    if (d.instanceColor) d.instanceColor.needsUpdate = true;
    b.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={dots} args={[undefined, undefined, items.length]} key={`d${items.length}`}>
        <boxGeometry args={[0.55, 0.26, 0.55]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={bodies} args={[undefined, undefined, items.length]} key={`b${items.length}`} castShadow>
        <boxGeometry args={[0.22, 0.6, 0.22]} />
        <meshLambertMaterial color="#2A2F45" flatShading />
      </instancedMesh>
    </group>
  );
};

// ================================================================ looks

/** A white lab coat over the crowd look. */
export const coatLook = <L extends { jacket: string; jacketShade: string; zipper: string }>(l: L): L => ({ ...l, jacket: "#E8EEF5", jacketShade: "#C4CCD8", zipper: "#AEB8C6" });

/** Seat height (top of a chair) that fits a seated pose: the thigh's underside. */
export const seatTop = (pose: Pose) => DIM.hipY + pose.bob - DIM.legW / 2 - 0.04;

// ================================================================ street furniture

/** A city bus at hero scale (≈ 28 long, 7.5 tall, 6 wide), driving along ±Z; front toward +Z. */
export const BUS = { len: 28, w: 6, h: 7.4 };
export const Bus: React.FC<{ position: V3; yaw?: number; color?: string; t?: number }> = ({ position, yaw = 0, color = "#C8372D", t = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.9 + (BUS.h - 0.9) / 2, 0]} castShadow receiveShadow>
      <BoxG args={[BUS.w, BUS.h - 0.9, BUS.len]} />
      <Flat color={color} />
    </mesh>
    <mesh position={[0, BUS.h + 0.1, 0]}>
      <BoxG args={[BUS.w - 0.6, 0.2, BUS.len - 1.2]} />
      <Flat color="#8E2620" />
    </mesh>
    {/* window band, both sides and the windscreen */}
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * (BUS.w / 2 + 0.01), 5.0, -0.6]} rotation={[0, s * Math.PI / 2, 0]}>
        <planeGeometry args={[BUS.len - 3.6, 2.4]} />
        <Glow color="#F2D79A" />
      </mesh>
    ))}
    <mesh position={[0, 4.8, BUS.len / 2 + 0.01]}>
      <planeGeometry args={[BUS.w - 0.8, 3.2]} />
      <Glow color="#AFC8E6" />
    </mesh>
    <CanvasPanel
      position={[0, 6.85, BUS.len / 2 + 0.02]}
      w={BUS.w - 1.4}
      h={0.7}
      draw={(ctx, W, H) => {
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, W, H);
        fitText(ctx, "42  CITY CENTRE", W / 2, H / 2 + H * 0.05, W * 0.9, H * 0.7, "#FFB040");
      }}
    />
    {[-1.9, 1.9].map((x) => (
      <React.Fragment key={x}>
        <mesh position={[x, 1.8, BUS.len / 2 + 0.02]}>
          <planeGeometry args={[0.9, 0.5]} />
          <Glow color={P.headlight} />
        </mesh>
        <Halo position={[x, 1.8, BUS.len / 2 + 0.3]} size={3.2} color={P.headlight} opacity={0.6} />
      </React.Fragment>
    ))}
    {[-1, 1].flatMap((s) =>
      [BUS.len / 2 - 4.5, -BUS.len / 2 + 5].map((z) => (
        <mesh key={`${s}${z}`} position={[s * (BUS.w / 2 - 0.3), 1.3, z]} rotation={[t * 8, 0, Math.PI / 2]}>
          <CylG args={[1.3, 1.3, 0.8, 12]} />
          <Flat color="#17181E" />
        </mesh>
      )),
    )}
  </group>
);

/** An open umbrella held overhead (canopy radius 2.2), handle bottom at the origin. */
export const Umbrella: React.FC<{ position: V3; color?: string; tilt?: number }> = ({ position, color = "#24748F", tilt = 0 }) => (
  <group position={position} rotation={[tilt, 0, 0]}>
    <mesh position={[0, 1.4, 0]}>
      <CylG args={[0.05, 0.05, 2.8, 6]} />
      <Flat color="#2B2F3E" />
    </mesh>
    <mesh position={[0, 2.95, 0]} castShadow>
      <ConeG args={[2.2, 0.9, 8]} />
      <Flat color={color} />
    </mesh>
  </group>
);

/** A picket fence along X at z (hero scale: 2.2 tall), pickets every 0.6. */
export const Picket: React.FC<{ x0: number; x1: number; z: number; color?: string }> = ({ x0, x1, z, color = "#F2EEE6" }) => {
  const n = Math.round((x1 - x0) / 0.6);
  return (
    <group>
      {Array.from({ length: n + 1 }, (_, i) => (
        <mesh key={i} position={[x0 + i * 0.6, 1.1, z]} castShadow>
          <BoxG args={[0.34, 2.2, 0.12]} />
          <Flat color={color} />
        </mesh>
      ))}
      {[0.6, 1.6].map((y) => (
        <mesh key={y} position={[(x0 + x1) / 2, y, z - 0.1]} castShadow>
          <BoxG args={[x1 - x0, 0.18, 0.08]} />
          <Flat color={color} />
        </mesh>
      ))}
    </group>
  );
};

/** A row of low-poly flowers along X at z. */
export const Flowers: React.FC<{ x0: number; x1: number; z: number; seed?: string }> = ({ x0, x1, z, seed = "fl" }) => (
  <group>
    {Array.from({ length: Math.round((x1 - x0) / 0.7) }, (_, i) => {
      const x = x0 + i * 0.7 + (random(`${seed}x${i}`) - 0.5) * 0.3;
      const h = 0.6 + random(`${seed}h${i}`) * 0.5;
      const c = ["#E8607A", "#FFD24A", "#F2EEE6", "#B58CFF", "#FF8A3A"][Math.floor(random(`${seed}c${i}`) * 5)];
      return (
        <group key={i} position={[x, 0, z + (random(`${seed}z${i}`) - 0.5) * 0.6]}>
          <mesh position={[0, h / 2, 0]}>
            <BoxG args={[0.06, h, 0.06]} />
            <Flat color={P.leafDark} />
          </mesh>
          <mesh position={[0, h + 0.1, 0]}>
            <IcoG args={[0.17, 0]} />
            <Flat color={c} />
          </mesh>
        </group>
      );
    })}
  </group>
);

/** A watering can (body 0.7 long) whose handle sits at the origin, spout toward +X. */
export const WateringCan: React.FC<{ position: V3; rotation?: V3 }> = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, -0.42, 0]} castShadow>
      <CylG args={[0.28, 0.32, 0.55, 8]} />
      <Flat color="#3F9A7A" />
    </mesh>
    <mesh position={[0.42, -0.36, 0]} rotation={[0, 0, -0.9]}>
      <CylG args={[0.04, 0.06, 0.6, 6]} />
      <Flat color="#3F9A7A" />
    </mesh>
    <mesh position={[0, -0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.18, 0.04, 4, 10, Math.PI]} />
      <Flat color="#2E7A5E" />
    </mesh>
  </group>
);

/** A cardboard box (0.9 × 0.6 × 0.6) of desk things: a plant and a frame poking out. Centre at origin. */
export const DeskBox: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh castShadow>
      <BoxG args={[1.0, 0.6, 0.66]} />
      <Flat color="#B48A5A" />
    </mesh>
    <mesh position={[-0.25, 0.45, 0]}>
      <IcoG args={[0.24, 1]} />
      <Flat color={P.leaf} />
    </mesh>
    <mesh position={[0.22, 0.42, -0.1]} rotation={[0.2, 0, 0.1]}>
      <BoxG args={[0.36, 0.44, 0.05]} />
      <Flat color="#2B2F3E" />
    </mesh>
  </group>
);

// ================================================================ sets

/** Flat roof (top at y = 0) with a parapet (2.2 tall) and rooftop clutter; the city far below. */
export const ROOF = { half: 20, parapet: 2.2, thick: 0.8 };
export const Rooftop: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <group>
    <mesh position={[0, -1, 0]} receiveShadow>
      <BoxG args={[ROOF.half * 2, 2, ROOF.half * 2]} />
      <Flat color="#5A6070" />
    </mesh>
    <mesh position={[0, -40, 0]}>
      <BoxG args={[ROOF.half * 2 - 0.2, 78, ROOF.half * 2 - 0.2]} />
      <Flat color={P.bldgSlate} />
    </mesh>
    {[
      [0, -ROOF.half + ROOF.thick / 2, ROOF.half * 2, ROOF.thick],
      [0, ROOF.half - ROOF.thick / 2, ROOF.half * 2, ROOF.thick],
      [-ROOF.half + ROOF.thick / 2, 0, ROOF.thick, ROOF.half * 2],
      [ROOF.half - ROOF.thick / 2, 0, ROOF.thick, ROOF.half * 2],
    ].map(([x, z, w, d], i) => (
      <mesh key={i} position={[x, ROOF.parapet / 2, z]} castShadow receiveShadow>
        <BoxG args={[w, ROOF.parapet, d]} />
        <Flat color="#6A7080" />
      </mesh>
    ))}
    {/* vents, a water tank on legs, an antenna */}
    {[
      [-12, 6, 3, 2, 3],
      [10, 10, 4, 2.6, 2.4],
      [-6, 13, 2, 1.6, 2],
    ].map(([x, z, w, h, d], i) => (
      <mesh key={i} position={[x, h / 2, z]} castShadow>
        <BoxG args={[w, h, d]} />
        <Flat color="#8A909C" />
      </mesh>
    ))}
    <group position={[12, 0, -6]}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 1.4, 1.8, sz * 1.4]}>
            <BoxG args={[0.25, 3.6, 0.25]} />
            <Flat color="#4A4038" />
          </mesh>
        )),
      )}
      <mesh position={[0, 6.2, 0]} castShadow>
        <CylG args={[2.3, 2.3, 5, 12]} />
        <Flat color="#7A5A40" />
      </mesh>
      <mesh position={[0, 9.4, 0]} castShadow>
        <ConeG args={[2.5, 1.4, 12]} />
        <Flat color="#5A4030" />
      </mesh>
    </group>
    {children}
  </group>
);

/** A shopfront at street level: facade at z = 0 facing +Z, a big "LIFE INSURANCE" sign that can flicker off. */
export const InsuranceShop: React.FC<{ t: number; signOn: number; shutter: number; closed: number }> = ({ t, signOn, shutter, closed }) => {
  const fl = signOn >= 1 ? 1 : signOn <= 0 ? 0 : random(`ins${Math.floor(t * 20)}`) < signOn ? 1 : 0;
  return (
    <group>
      <Building position={[0, 0, -12]} w={30} d={24} h={30} color={P.bldgSlate} seed="ins" power={0.5} />
      {/* ground floor facade in front of the building */}
      <mesh position={[0, 5, -0.2]} castShadow receiveShadow>
        <BoxG args={[30, 10, 0.4]} />
        <Flat color="#3A4558" />
      </mesh>
      {/* window and door */}
      <mesh position={[-4, 3.6, 0.02]}>
        <planeGeometry args={[12, 5.4]} />
        <Glow color={fl ? "#BFD4E8" : "#4A5A70"} />
      </mesh>
      <mesh position={[8, 3.2, 0.02]}>
        <planeGeometry args={[3.6, 6.4]} />
        <Flat color="#22283A" />
      </mesh>
      {/* the roller shutter coming down over the window */}
      <mesh position={[-4, 6.3 - (5.4 * shutter) / 2, 0.12]} castShadow>
        <BoxG args={[12.4, Math.max(0.05, 5.4 * shutter), 0.12]} />
        <Flat color="#8A909C" />
      </mesh>
      {Array.from({ length: Math.floor(shutter * 12) }, (_, i) => (
        <mesh key={i} position={[-4, 6.3 - i * 0.45 - 0.2, 0.19]}>
          <BoxG args={[12.3, 0.05, 0.02]} />
          <Flat color="#6A707C" />
        </mesh>
      ))}
      {/* the sign */}
      <mesh position={[-1, 8.4, 0.15]}>
        <BoxG args={[14, 2.3, 0.3]} />
        <Flat color="#141A2C" />
      </mesh>
      <CanvasPanel
        position={[-1, 8.4, 0.31]}
        w={13.4}
        h={1.9}
        draw={(ctx, W, H) => {
          ctx.fillStyle = "#141A2C";
          ctx.fillRect(0, 0, W, H);
          ctx.shadowColor = "#6FB8FF";
          ctx.shadowBlur = fl ? H * 0.25 : 0;
          fitText(ctx, "LIFE INSURANCE", W / 2, H / 2 + H * 0.04, W * 0.88, H * 0.64, fl ? "#CFE6FF" : "#2E3A50");
        }}
      />
      {fl ? <Halo position={[-1, 8.4, 1.2]} size={14} color="#6FB8FF" opacity={0.35} /> : null}
      {/* CLOSED banner across the shutter */}
      {closed > 0 ? (
        <CanvasPanel
          position={[-4, 3.8, 0.3 + 0.01]}
          rotation={[0, 0, 0.12]}
          w={8.4 * Math.min(1, closed * 1.2)}
          h={1.7}
          draw={(ctx, W, H) => {
            ctx.fillStyle = "#C8372D";
            ctx.fillRect(0, 0, W, H);
            fitText(ctx, "CLOSED FOREVER", W / 2, H / 2 + H * 0.05, W * 0.9, H * 0.6, "#FFFFFF");
          }}
        />
      ) : null}
    </group>
  );
};

/** A plain room shell: floor, back wall at z = -back, side walls, ceiling lights. Interiors build on it. */
export const RoomShell: React.FC<{ wall: string; floor: string; back?: number; half?: number; height?: number; lights?: boolean }> = ({
  wall,
  floor,
  back = 4,
  half = 14,
  height = 12,
  lights = true,
}) => (
  <group>
    <mesh position={[0, -0.05, 4]} receiveShadow>
      <BoxG args={[half * 2, 0.1, 30]} />
      <Flat color={floor} />
    </mesh>
    <mesh position={[0, height / 2, -back - 0.15]} receiveShadow>
      <BoxG args={[half * 2, height, 0.3]} />
      <Flat color={wall} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * half, height / 2, 4]} receiveShadow>
        <BoxG args={[0.3, height, 30]} />
        <Flat color={wall} />
      </mesh>
    ))}
    {lights
      ? [-5, 5].map((x) => (
          <mesh key={x} position={[x, height - 0.1, 1]}>
            <BoxG args={[3.4, 0.12, 1.2]} />
            <Glow color="#EEF2F8" />
          </mesh>
        ))
      : null}
  </group>
);

/** A window on a back wall (z = wallZ) showing a rainy city: a canvas skyline with streaks. */
export const RainWindow: React.FC<{ position: V3; w: number; h: number; t: number; night?: boolean }> = ({ position, w, h, t, night = false }) => (
  <group position={position}>
    <CanvasPanel
      position={[0, 0, 0.02]}
      w={w}
      h={h}
      px={512}
      draw={(ctx, W, H) => {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, night ? "#0E1530" : "#5A6474");
        g.addColorStop(1, night ? "#1E2850" : "#8A94A2");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 9; i++) {
          const bw = W * (0.08 + random(`rw${i}`) * 0.1);
          const bh = H * (0.25 + random(`rh${i}`) * 0.5);
          const bx = (W * i) / 9;
          ctx.fillStyle = night ? "#141C3A" : "#4A5464";
          ctx.fillRect(bx, H - bh, bw, bh);
          for (let j = 0; j < 12; j++) {
            if (random(`rl${i}${j}`) < 0.45) {
              ctx.fillStyle = night ? "#E0B04E" : "#C8D2DE";
              ctx.fillRect(bx + bw * (0.2 + (j % 3) * 0.25), H - bh + H * 0.04 + Math.floor(j / 3) * H * 0.07, bw * 0.12, H * 0.025);
            }
          }
        }
        ctx.strokeStyle = "rgba(220,230,245,0.35)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 60; i++) {
          const x = random(`rx${i}`) * W;
          const y = ((random(`ry${i}`) + t * 1.6) % 1) * H;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 4, y + H * 0.06);
          ctx.stroke();
        }
      }}
    />
    {/* frame and cross bars */}
    {[
      [0, h / 2, w + 0.4, 0.3],
      [0, -h / 2, w + 0.4, 0.3],
      [0, 0, w, 0.16],
    ].map(([x, y, ww, hh], i) => (
      <mesh key={`h${i}`} position={[x, y, 0.08]}>
        <BoxG args={[ww, hh, 0.2]} />
        <Flat color="#E8E4DA" />
      </mesh>
    ))}
    {[-w / 2, 0, w / 2].map((x, i) => (
      <mesh key={`v${i}`} position={[x, 0, 0.08]}>
        <BoxG args={[i === 1 ? 0.16 : 0.3, h, 0.2]} />
        <Flat color="#E8E4DA" />
      </mesh>
    ))}
  </group>
);

/** A chair whose seat top is at `top`, facing +Z (back toward −Z). */
export const SeatChair: React.FC<{ position: V3; yaw?: number; top: number; color?: string }> = ({ position, yaw = 0, top, color = "#2E5A6A" }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, top - 0.1, 0]} castShadow receiveShadow>
      <BoxG args={[1.7, 0.2, 1.6]} />
      <Flat color={color} />
    </mesh>
    <mesh position={[0, top + 1.2, -0.75]} castShadow>
      <BoxG args={[1.7, 2.2, 0.18]} />
      <Flat color={color} />
    </mesh>
    {[-1, 1].flatMap((sx) =>
      [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * 0.7, (top - 0.2) / 2, sz * 0.65]}>
          <BoxG args={[0.14, top - 0.2, 0.14]} />
          <Flat color="#2B2F3E" />
        </mesh>
      )),
    )}
  </group>
);

/** Where the CV lies on the interview desk (the stamp lands here). */
export const CV = { x: -0.7, z: 0.1 };

/** Interview office: a desk across the room (top at `deskTop`), a rainy window behind, a plant and shelves. */
export const InterviewRoom: React.FC<{ t: number; deskTop: number; stamped: number }> = ({ t, deskTop, stamped }) => (
  <group>
    <RoomShell wall="#8C94A4" floor="#4A5468" back={4} />
    <RainWindow position={[-3, 6.2, -4.0]} w={9} h={5.4} t={t} />
    {/* shelves on the right of the back wall */}
    {[3.2, 5.4, 7.6].map((y) => (
      <mesh key={y} position={[8, y, -3.6]} castShadow>
        <BoxG args={[5, 0.18, 0.9]} />
        <Flat color="#C9C2B4" />
      </mesh>
    ))}
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <mesh key={i} position={[6.2 + (i % 3) * 1.4, 3.75 + Math.floor(i / 3) * 2.2, -3.6]} castShadow>
        <BoxG args={[0.9, 0.9 + random(`bk${i}`) * 0.3, 0.7]} />
        <Flat color={BUILDING_COLORS[i % BUILDING_COLORS.length]} />
      </mesh>
    ))}
    <mesh position={[-11, 1, -2.2]} castShadow>
      <CylG args={[0.8, 0.6, 2, 8]} />
      <Flat color="#E8E4DA" />
    </mesh>
    <mesh position={[-11, 3.3, -2.2]} castShadow>
      <IcoG args={[1.5, 1]} />
      <Flat color={P.leaf} />
    </mesh>
    {/* desk */}
    <mesh position={[0, deskTop - 0.1, 0]} castShadow receiveShadow>
      <BoxG args={[7, 0.2, 3]} />
      <Flat color="#6A4A34" />
    </mesh>
    <mesh position={[0, (deskTop - 0.2) / 2, 1.3]} castShadow>
      <BoxG args={[6.6, deskTop - 0.2, 0.2]} />
      <Flat color="#5A3E2E" />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 3.3, (deskTop - 0.2) / 2, 0]} castShadow>
        <BoxG args={[0.2, deskTop - 0.2, 2.8]} />
        <Flat color="#5A3E2E" />
      </mesh>
    ))}
    {/* the CV on the desk, turned toward the interviewer; REJECTED once stamped */}
    <group position={[CV.x, deskTop + 0.012, CV.z]} rotation={[-Math.PI / 2, 0, Math.PI + 0.12]}>
      <CanvasPanel
        position={[0, 0, 0]}
        w={1.1}
        h={1.5}
        px={300}
        draw={(ctx, W, H) => {
          ctx.fillStyle = "#F4F1EA";
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = "#2B2F3E";
          ctx.font = CANVAS_FONT(H * 0.07);
          ctx.textAlign = "left";
          ctx.fillText("CV", W * 0.1, H * 0.12);
          ctx.fillStyle = "#9AA1B0";
          for (let i = 0; i < 9; i++) ctx.fillRect(W * 0.1, H * (0.2 + i * 0.075), W * (0.5 + random(`cv${i}`) * 0.3), H * 0.025);
          ctx.fillStyle = "#FF4A3A";
          ctx.font = CANVAS_FONT(H * 0.05);
          ctx.fillText("TIMER: 2 YEARS", W * 0.1, H * 0.92);
          if (stamped > 0) {
            ctx.save();
            ctx.translate(W / 2, H * 0.55);
            ctx.rotate(-0.35);
            ctx.globalAlpha = Math.min(1, stamped * 3);
            ctx.strokeStyle = "#D0201A";
            ctx.lineWidth = W * 0.035;
            ctx.strokeRect(-W * 0.42, -H * 0.08, W * 0.84, H * 0.16);
            fitText(ctx, "REJECTED", 0, H * 0.005, W * 0.76, H * 0.12, "#D0201A");
            ctx.restore();
          }
        }}
      />
    </group>
    {/* nameplate and a monitor */}
    <mesh position={[2.3, deskTop + 0.95, 0.4]} castShadow>
      <BoxG args={[1.9, 1.2, 0.12]} />
      <Flat color="#17181E" />
    </mesh>
    <mesh position={[2.3, deskTop + 0.95, 0.33]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[1.75, 1.05]} />
      <Glow color="#9FC4E8" />
    </mesh>
    <mesh position={[2.3, deskTop + 0.2, 0.4]}>
      <BoxG args={[0.14, 0.4, 0.14]} />
      <Flat color="#2B2F3E" />
    </mesh>
  </group>
);

/** A rubber stamp (handle up), its face at the origin. */
export const Stamp: React.FC<{ position: V3; rotation?: V3 }> = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 0.06, 0]} castShadow>
      <BoxG args={[0.5, 0.12, 0.32]} />
      <Flat color="#D0201A" />
    </mesh>
    <mesh position={[0, 0.2, 0]}>
      <BoxG args={[0.42, 0.16, 0.26]} />
      <Flat color="#6A4A34" />
    </mesh>
    <mesh position={[0, 0.42, 0]}>
      <CylG args={[0.07, 0.07, 0.3, 8]} />
      <Flat color="#6A4A34" />
    </mesh>
    <mesh position={[0, 0.6, 0]}>
      <IcoG args={[0.14, 1]} />
      <Flat color="#5A3E2E" />
    </mesh>
  </group>
);

/** Café corner: a round table (top at `tableTop`) by a big rainy window, warm pendant lamps. */
export const Cafe: React.FC<{ t: number; tableTop: number }> = ({ t, tableTop }) => (
  <group>
    <RoomShell wall="#6A4A40" floor="#3A2E2A" back={5} lights={false} />
    <RainWindow position={[0, 6.4, -5.0]} w={16} h={7} t={t} />
    {/* brick band under the window */}
    <mesh position={[0, 1.4, -4.9]}>
      <BoxG args={[28, 2.8, 0.2]} />
      <Flat color="#7A4A3A" />
    </mesh>
    {[-4.5, 4.5].map((x) => (
      <group key={x} position={[x, 11.5, -0.5]}>
        <mesh position={[0, 0.5, 0]}>
          <CylG args={[0.03, 0.03, 1.2, 4]} />
          <Flat color="#2B2F3E" />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <ConeG args={[0.7, 0.6, 8]} />
          <Flat color="#2B2F3E" />
        </mesh>
        <mesh position={[0, -0.62, 0]}>
          <IcoG args={[0.22, 1]} />
          <Glow color="#FFD89A" />
        </mesh>
        <Halo position={[0, -0.7, 0]} size={4} color="#FFC870" opacity={0.5} />
      </group>
    ))}
    {/* table */}
    <mesh position={[0, tableTop - 0.08, 0]} castShadow receiveShadow>
      <CylG args={[1.7, 1.7, 0.16, 16]} />
      <Flat color="#E8E4DA" />
    </mesh>
    <mesh position={[0, (tableTop - 0.16) / 2, 0]}>
      <CylG args={[0.14, 0.14, tableTop - 0.16, 8]} />
      <Flat color="#2B2F3E" />
    </mesh>
    <mesh position={[0, 0.06, 0]}>
      <CylG args={[0.8, 0.8, 0.12, 12]} />
      <Flat color="#2B2F3E" />
    </mesh>
    {[-0.75, 0.75].map((x) => (
      <group key={x} position={[x, tableTop, 0.3]}>
        <mesh position={[0, 0.03, 0]}>
          <CylG args={[0.4, 0.4, 0.05, 12]} />
          <Flat color="#F4F1EA" />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <CylG args={[0.22, 0.18, 0.5, 10]} />
          <Flat color="#F4F1EA" />
        </mesh>
      </group>
    ))}
    {/* other tables behind */}
    {[-9, 9].map((x) => (
      <group key={x} position={[x, 0, -2]}>
        <mesh position={[0, tableTop - 0.08, 0]} castShadow>
          <CylG args={[1.5, 1.5, 0.16, 14]} />
          <Flat color="#E8E4DA" />
        </mesh>
        <mesh position={[0, (tableTop - 0.16) / 2, 0]}>
          <CylG args={[0.12, 0.12, tableTop - 0.16, 8]} />
          <Flat color="#2B2F3E" />
        </mesh>
      </group>
    ))}
  </group>
);

/** A glowing heart (≈ 1 wide) facing +Z. */
const HEART = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, -0.5);
  s.bezierCurveTo(-0.15, -0.35, -0.55, -0.15, -0.55, 0.15);
  s.bezierCurveTo(-0.55, 0.45, -0.15, 0.55, 0, 0.3);
  s.bezierCurveTo(0.15, 0.55, 0.55, 0.45, 0.55, 0.15);
  s.bezierCurveTo(0.55, -0.15, 0.15, -0.35, 0, -0.5);
  return new THREE.ShapeGeometry(s, 6);
})();
export const Heart: React.FC<{ position: V3; scale?: number; color?: string; yaw?: number; opacity?: number }> = ({ position, scale = 1, color = "#FF5A7A", yaw = 0, opacity = 1 }) => (
  <group position={position} rotation={[0, yaw, 0]} scale={scale}>
    <mesh geometry={HEART}>
      <meshBasicMaterial color={color} toneMapped={false} side={THREE.DoubleSide} transparent opacity={opacity} />
    </mesh>
    <Halo size={2.4} color={color} opacity={0.5 * opacity} />
  </group>
);

/** Night lab: dark room, a big data wall, consoles, a scan platform with a ring at the origin. */
export const Lab: React.FC<{ t: number; ring: number; wall: (ctx: CanvasRenderingContext2D, W: number, H: number) => void }> = ({ t, ring, wall }) => (
  <group>
    <RoomShell wall="#1E2840" floor="#141A2C" back={7} half={16} lights={false} />
    <CanvasPanel position={[0, 7.2, -6.95]} w={15} h={6.4} px={1024} draw={wall} />
    <mesh position={[0, 7.2, -7.0]}>
      <BoxG args={[15.6, 7, 0.1]} />
      <Flat color="#0A0E1A" />
    </mesh>
    <Halo position={[0, 7.2, -6.4]} size={20} color="#4F9BFF" opacity={0.18} />
    {/* consoles along the sides */}
    {[-1, 1].map((s) => (
      <group key={s} position={[s * 10.5, 0, 0]} rotation={[0, -s * 0.5, 0]}>
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <BoxG args={[5, 2.4, 2]} />
          <Flat color="#2A3450" />
        </mesh>
        {[-1.4, 0, 1.4].map((x, i) => (
          <group key={x} position={[x, 3.3, -0.4]} rotation={[-0.2, 0, 0]}>
            <mesh>
              <BoxG args={[1.25, 0.9, 0.1]} />
              <Flat color="#0E1220" />
            </mesh>
            <mesh position={[0, 0, 0.06]}>
              <planeGeometry args={[1.1, 0.76]} />
              <Glow color={["#4F9BFF", "#4BE3A4", "#B58CFF"][(i + (s > 0 ? 1 : 0)) % 3]} opacity={0.9} />
            </mesh>
          </group>
        ))}
      </group>
    ))}
    {/* scan platform */}
    <mesh position={[0, 0.15, 0]} receiveShadow>
      <CylG args={[2.4, 2.6, 0.3, 20]} />
      <Flat color="#3A4460" />
    </mesh>
    <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.9, 2.2, 32]} />
      <Glow color="#4F9BFF" />
    </mesh>
    {ring > 0 ? (
      <mesh position={[0, 0.3 + ((Math.sin(t * 2.2) + 1) / 2) * 4.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.7, 0.07, 4, 48]} />
        <meshBasicMaterial color="#4BE3A4" transparent opacity={ring * 0.95} toneMapped={false} />
      </mesh>
    ) : null}
    <pointLight position={[0, 6, 3]} color="#6FA8FF" intensity={30} distance={22} decay={2} />
  </group>
);

/** The lab's data wall: subject timer, a chart, "ANOMALY" flashing (k 0..1 = how far it's gone). */
export const drawLabWall = (t: number, k: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0B1224";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(79,155,255,0.18)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += W / 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += H / 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.textAlign = "left";
  ctx.fillStyle = "#8FB3D9";
  ctx.font = CANVAS_FONT(H * 0.06);
  ctx.fillText("SUBJECT 07  /  TIMER STUDY", W * 0.04, H * 0.11);
  ctx.fillStyle = TONE.long;
  ctx.font = CANVAS_FONT(H * 0.12);
  const sec = yrs(41) + days(202) + 40000 - t;
  const f = fmtLeft(sec);
  ctx.fillText(`${f.big} ${f.unit}`, W * 0.04, H * 0.27);
  ctx.font = CANVAS_FONT(H * 0.06, false);
  ctx.fillText(f.sub, W * 0.04, H * 0.36);
  // chart: flat line that suddenly jumps
  ctx.strokeStyle = TONE.long;
  ctx.lineWidth = H * 0.012;
  ctx.beginPath();
  const n = 60;
  for (let i = 0; i <= n; i++) {
    const x = W * (0.04 + (0.92 * i) / n);
    const u = i / n;
    const jump = u > 0.62 && u < 0.62 + 0.38 * k ? Math.sin((u - 0.62) * 60) * 0.12 * k : 0;
    const y = H * (0.82 - u * 0.08 - jump - random(`ch${i}`) * 0.015);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  if (k > 0.2 && Math.floor(t * 4) % 2 === 0) {
    ctx.fillStyle = "#FF4A3A";
    ctx.font = CANVAS_FONT(H * 0.08);
    ctx.textAlign = "right";
    ctx.fillText("⚠ ANOMALY", W * 0.96, H * 0.11);
  }
};

/** A whiteboard (12 × 6.4) with a marker sketch drawn in by k (0..1): timer → arrows → "CAN IT CHANGE?". */
export const drawWhiteboard = (k: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#F4F6F8";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#1F3A7A";
  ctx.fillStyle = "#1F3A7A";
  ctx.lineWidth = H * 0.012;
  ctx.lineCap = "round";
  const k1 = clamp01(k / 0.35);
  const k2 = clamp01((k - 0.35) / 0.25);
  const k3 = clamp01((k - 0.6) / 0.4);
  // a timer box with 41Y
  if (k1 > 0) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    const bx = W * 0.08;
    const by = H * 0.18;
    const bw = W * 0.28 * k1;
    ctx.strokeRect(bx, by, bw, H * 0.22);
    if (k1 > 0.6) {
      ctx.font = CANVAS_FONT(H * 0.12);
      ctx.textAlign = "center";
      ctx.fillText("41 Y", bx + W * 0.14, by + H * 0.15);
    }
    ctx.restore();
  }
  // two arrows: up "+?" and down
  if (k2 > 0) {
    ctx.beginPath();
    ctx.moveTo(W * 0.4, H * 0.29);
    ctx.lineTo(W * (0.4 + 0.16 * k2), H * (0.29 - 0.14 * k2));
    ctx.moveTo(W * 0.4, H * 0.29);
    ctx.lineTo(W * (0.4 + 0.16 * k2), H * (0.29 + 0.14 * k2));
    ctx.stroke();
    ctx.font = CANVAS_FONT(H * 0.08);
    ctx.textAlign = "left";
    ctx.fillStyle = "#1F7A4A";
    if (k2 > 0.8) ctx.fillText("+ ?", W * 0.6, H * 0.17);
    ctx.fillStyle = "#C8372D";
    if (k2 > 0.8) ctx.fillText("− ?", W * 0.6, H * 0.47);
  }
  if (k3 > 0) {
    ctx.fillStyle = "#C8372D";
    const text = "CAN IT CHANGE?";
    const n = Math.ceil(text.length * k3);
    ctx.font = CANVAS_FONT(H * 0.15);
    ctx.textAlign = "left";
    ctx.fillText(text.slice(0, n), W * 0.08, H * 0.82);
    if (k3 >= 1) {
      ctx.strokeStyle = "#C8372D";
      ctx.beginPath();
      ctx.moveTo(W * 0.08, H * 0.88);
      ctx.lineTo(W * 0.86, H * 0.88);
      ctx.stroke();
    }
  }
};

/** A giant hourglass (height 1 before scaling): sand drains with k (0..1), stream glowing. */
export const Hourglass: React.FC<{ position: V3; scale: number; k: number; t: number; yaw?: number }> = ({ position, scale, k, t, yaw = 0 }) => {
  const top = Math.max(0.02, Math.sqrt(1 - k));
  const bot = Math.max(0.05, Math.sqrt(k + 0.15));
  const wood = "#5A3A28";
  const sand = "#F0AE4E";
  return (
    <group position={position} scale={scale} rotation={[0, yaw, 0]}>
      {[0.04, 0.96].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <CylG args={[0.62, 0.62, 0.08, 14]} />
          <Flat color={wood} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.4;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.54, 0.5, Math.sin(a) * 0.54]} castShadow>
            <CylG args={[0.03, 0.03, 0.84, 6]} />
            <Flat color={wood} />
          </mesh>
        );
      })}
      {/* sand: top cone (apex down at the neck), bottom pile, the stream */}
      <mesh position={[0, 0.5 + (0.36 * top) / 2 + 0.02, 0]} rotation={[Math.PI, 0, 0]}>
        <ConeG args={[0.4 * top, 0.36 * top, 12]} />
        <Glow color={sand} />
      </mesh>
      <mesh position={[0, 0.08 + (0.3 * bot) / 2, 0]}>
        <ConeG args={[0.42 * Math.min(1, bot * 1.1), 0.3 * bot, 12]} />
        <Glow color={sand} />
      </mesh>
      {k < 0.999 ? (
        <mesh position={[0, 0.5 - (0.42 - 0.3 * bot) / 2, 0]}>
          <CylG args={[0.012, 0.012, 0.42 - 0.3 * bot, 5]} />
          <Glow color="#FFE0A0" />
        </mesh>
      ) : null}
      {/* glass bulbs */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, 0.5 + s * 0.22, 0]} rotation={[s > 0 ? Math.PI : 0, t * 0.05, 0]}>
          <ConeG args={[0.46, 0.44, 12, 1, true]} />
          <meshLambertMaterial color="#BFE3FF" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} flatShading />
        </mesh>
      ))}
      <Halo position={[0, 0.3, 0.3]} size={1.2} color="#FFC060" opacity={0.45} />
    </group>
  );
};

// ================================================================ bathroom + mirror

/**
 * Bathroom at hero scale. The mirror wall is the plane z = MIRROR.z; the mirror is a HOLE in that wall,
 * and the reflected bathroom is the same set drawn mirrored behind it (see `Mirrored`), so the reflection
 * is real geometry and the camera can move freely.
 */
export const MIRROR = { z: -2, cx: 0, cy: 4.75, w: 4.6, h: 3.7, counterTop: 2.1, counterD: 2.0, half: 9, height: 11, back: 16 };

export const Bathroom: React.FC<{ lamp: number; mirrorWall?: boolean }> = ({ lamp, mirrorWall = true }) => {
  const M = MIRROR;
  const tile = "#9FB4BC";
  const tileDark = "#5E7A86";
  const x0 = M.cx - M.w / 2;
  const x1 = M.cx + M.w / 2;
  const y0 = M.cy - M.h / 2;
  const y1 = M.cy + M.h / 2;
  const depth = M.back - M.z;
  const zc = (M.z + M.back) / 2;
  return (
    <group>
      {/* floor, ceiling, side walls, back wall (behind the camera) */}
      <mesh position={[0, -0.05, zc]} receiveShadow>
        <BoxG args={[M.half * 2, 0.1, depth]} />
        <Flat color="#3A4650" />
      </mesh>
      <mesh position={[0, M.height + 0.05, zc]}>
        <BoxG args={[M.half * 2, 0.1, depth]} />
        <Flat color="#C9D2D8" />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * M.half, M.height / 2, zc]} receiveShadow>
            <BoxG args={[0.3, M.height, depth]} />
            <Flat color={tile} />
          </mesh>
          <mesh position={[s * (M.half - 0.16), 1.4, zc]}>
            <BoxG args={[0.05, 2.8, depth]} />
            <Flat color={tileDark} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, M.height / 2, M.back]}>
        <BoxG args={[M.half * 2, M.height, 0.3]} />
        <Flat color={tile} />
      </mesh>
      {/* door on the left wall */}
      <mesh position={[-M.half + 0.17, 3.4, 8]}>
        <BoxG args={[0.06, 6.8, 3.2]} />
        <Flat color="#E8E4DA" />
      </mesh>
      {/* the mirror wall, built around the mirror hole */}
      {mirrorWall ? (
        <group>
          {[
            [(-M.half + x0) / 2, M.height / 2, x0 + M.half, M.height],
            [(M.half + x1) / 2, M.height / 2, M.half - x1, M.height],
            [M.cx, y0 / 2, M.w, y0],
            [M.cx, (y1 + M.height) / 2, M.w, M.height - y1],
          ].map(([x, y, w, h], i) => (
            <mesh key={i} position={[x, y, M.z - 0.15]} receiveShadow>
              <BoxG args={[w, h, 0.3]} />
              <Flat color={tile} />
            </mesh>
          ))}
          <mesh position={[0, 1.4, M.z + 0.02]}>
            <BoxG args={[M.half * 2, 2.8, 0.05]} />
            <Flat color={tileDark} />
          </mesh>
          {/* frame */}
          {[
            [M.cx, y1 + 0.12, M.w + 0.48, 0.24],
            [M.cx, y0 - 0.12, M.w + 0.48, 0.24],
            [x0 - 0.12, M.cy, 0.24, M.h],
            [x1 + 0.12, M.cy, 0.24, M.h],
          ].map(([x, y, w, h], i) => (
            <mesh key={`f${i}`} position={[x, y, M.z + 0.06]} castShadow>
              <BoxG args={[w, h, 0.14]} />
              <Flat color="#2B2F3E" />
            </mesh>
          ))}
          {/* faint glass tint and a glint */}
          <mesh position={[M.cx, M.cy, M.z + 0.005]} renderOrder={5}>
            <planeGeometry args={[M.w, M.h]} />
            <meshBasicMaterial color="#BFE3FF" transparent opacity={0.06} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[M.cx + 1.1, M.cy + 0.6, M.z + 0.008]} rotation={[0, 0, -0.7]} renderOrder={6}>
            <planeGeometry args={[0.18, 2.6]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.08} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ) : null}
      {/* light bar above the mirror */}
      <mesh position={[M.cx, y1 + 0.75, M.z + 0.3]}>
        <BoxG args={[3.6, 0.32, 0.4]} />
        <Flat color="#2B2F3E" />
      </mesh>
      <mesh position={[M.cx, y1 + 0.6, M.z + 0.3]}>
        <BoxG args={[3.4, 0.08, 0.34]} />
        <Glow color={lamp > 0.5 ? "#FFF2D6" : "#5A5A60"} />
      </mesh>
      {lamp > 0.5 ? <Halo position={[M.cx, y1 + 0.5, M.z + 0.6]} size={5} color="#FFE6B8" opacity={0.35 * lamp} /> : null}
      <pointLight position={[M.cx, y1 + 0.2, M.z + 1.4]} color="#FFE6C0" intensity={22 * lamp} distance={16} decay={2} />
      {/* counter, basin, tap, cup with toothbrushes */}
      <mesh position={[0, M.counterTop - 0.15, M.z + M.counterD / 2]} castShadow receiveShadow>
        <BoxG args={[6.4, 0.3, M.counterD]} />
        <Flat color="#E8E4DA" />
      </mesh>
      <mesh position={[0, (M.counterTop - 0.3) / 2, M.z + M.counterD / 2 - 0.05]} castShadow receiveShadow>
        <BoxG args={[6.2, M.counterTop - 0.3, M.counterD - 0.1]} />
        <Flat color="#4A5A6A" />
      </mesh>
      <mesh position={[0, M.counterTop + 0.002, M.z + M.counterD / 2 + 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 14]} />
        <Flat color="#B8C0C8" />
      </mesh>
      <mesh position={[0, M.counterTop + 0.3, M.z + 0.35]}>
        <CylG args={[0.08, 0.08, 0.6, 8]} />
        <Flat color="#C9D2D8" />
      </mesh>
      <mesh position={[0, M.counterTop + 0.56, M.z + 0.55]} rotation={[Math.PI / 2, 0, 0]}>
        <CylG args={[0.06, 0.06, 0.45, 8]} />
        <Flat color="#C9D2D8" />
      </mesh>
      <group position={[-2.2, M.counterTop, M.z + 0.6]}>
        <mesh position={[0, 0.3, 0]}>
          <CylG args={[0.22, 0.18, 0.6, 8]} />
          <Flat color="#24748F" />
        </mesh>
        {[-0.07, 0.08].map((x, i) => (
          <mesh key={x} position={[x, 0.75, 0]} rotation={[0, 0, x * 2]}>
            <BoxG args={[0.05, 0.6, 0.05]} />
            <Flat color={i ? "#E8607A" : "#FFD24A"} />
          </mesh>
        ))}
      </group>
      {/* towel on a rail, right wall */}
      <mesh position={[M.half - 0.35, 5.2, 3]}>
        <BoxG args={[0.12, 0.12, 2.6]} />
        <Flat color="#C9D2D8" />
      </mesh>
      <mesh position={[M.half - 0.42, 4.2, 3]} castShadow>
        <BoxG args={[0.16, 2.0, 2.2]} />
        <Flat color="#C8372D" />
      </mesh>
    </group>
  );
};

/** Draws children mirrored in the mirror plane z = MIRROR.z (the reflected room behind the mirror hole). */
export const Mirrored: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <group position={[0, 0, 2 * MIRROR.z]} scale={[1, 1, -1]}>
    {children}
  </group>
);

/** Reflects a world point in the mirror plane. */
export const reflect = (p: V3): V3 => [p[0], p[1], 2 * MIRROR.z - p[2]];

// ================================================================ overlays (HTML)

/** A dating app card stack (generic UI, no real app): k 0..1 swipes card 1 right (match), then card 2 left. */
export const DatingScreen: React.FC<{ w: number; h: number; k: number; t: number }> = ({ w, h, k, t }) => {
  const k1 = clamp01(k / 0.45);
  const k2 = clamp01((k - 0.55) / 0.4);
  const card = (name: string, years: string, tone: string, skin: string, jacket: string, dx: number, rot: number, stamp: string, stampColor: string, stampK: number) => (
    <div
      style={{
        position: "absolute",
        left: w * 0.06,
        top: h * 0.1,
        width: w * 0.88,
        height: h * 0.66,
        borderRadius: w * 0.06,
        background: "linear-gradient(180deg, #2A3A5A 0%, #1A2238 100%)",
        transform: `translateX(${dx * w}px) rotate(${rot}rad)`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        overflow: "hidden",
      }}
    >
      {/* a Slavoski-style face: square eyes, block nose */}
      <div style={{ position: "absolute", left: "50%", top: h * 0.08, width: w * 0.42, height: w * 0.44, marginLeft: -w * 0.21, borderRadius: w * 0.12, background: skin }}>
        <div style={{ position: "absolute", left: w * 0.08, top: w * 0.14, width: w * 0.08, height: w * 0.09, background: "#F4F4F0" }} />
        <div style={{ position: "absolute", right: w * 0.08, top: w * 0.14, width: w * 0.08, height: w * 0.09, background: "#F4F4F0" }} />
        <div style={{ position: "absolute", left: w * 0.105, top: w * 0.165, width: w * 0.035, height: w * 0.04, background: "#1A1A22" }} />
        <div style={{ position: "absolute", right: w * 0.105, top: w * 0.165, width: w * 0.035, height: w * 0.04, background: "#1A1A22" }} />
        <div style={{ position: "absolute", left: "50%", top: w * 0.3, width: w * 0.12, marginLeft: -w * 0.06, height: w * 0.025, background: "#4A1E1A" }} />
        <div style={{ position: "absolute", left: -w * 0.02, top: -w * 0.05, width: w * 0.46, height: w * 0.12, borderRadius: w * 0.04, background: "#3A2418" }} />
      </div>
      <div style={{ position: "absolute", left: "50%", top: h * 0.08 + w * 0.46, width: w * 0.6, height: h * 0.2, marginLeft: -w * 0.3, borderRadius: `${w * 0.1}px ${w * 0.1}px 0 0`, background: jacket }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: `${h * 0.03}px ${w * 0.07}px`, background: "linear-gradient(0deg, rgba(5,8,20,0.95) 0%, rgba(5,8,20,0.7) 100%)" }}>
        <div style={{ fontWeight: 700, fontSize: w * 0.1, color: "#FFF" }}>{name}</div>
        <div
          style={{
            display: "inline-block",
            marginTop: h * 0.01,
            padding: `${h * 0.006}px ${w * 0.03}px`,
            borderRadius: w * 0.05,
            border: `${w * 0.008}px solid ${tone}`,
            color: tone,
            fontWeight: 700,
            fontSize: w * 0.065,
          }}
        >
          ⧗ {years}
        </div>
      </div>
      {stampK > 0 ? (
        <div
          style={{
            position: "absolute",
            top: h * 0.06,
            left: stampColor === "#4BE3A4" ? w * 0.06 : undefined,
            right: stampColor === "#4BE3A4" ? undefined : w * 0.06,
            padding: `${h * 0.008}px ${w * 0.03}px`,
            border: `${w * 0.012}px solid ${stampColor}`,
            borderRadius: w * 0.03,
            color: stampColor,
            fontWeight: 700,
            fontSize: w * 0.09,
            transform: `rotate(${stampColor === "#4BE3A4" ? -0.3 : 0.3}rad)`,
            opacity: stampK,
          }}
        >
          {stamp}
        </div>
      ) : null}
    </div>
  );
  return (
    <div style={{ width: w, height: h, background: "#0E1428", fontFamily: FONT, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: h * 0.025, left: 0, right: 0, textAlign: "center", color: "#FF5A7A", fontWeight: 700, fontSize: w * 0.075, letterSpacing: "0.08em" }}>
        ♥ MATCHTIME
      </div>
      {card("SAM, 31", "3 YEARS", TONE.mid, "#A86F4C", "#5A4A78", -1.3 * k2 * k2, -0.4 * k2, "NOPE", "#FF4A3A", clamp01(k2 * 3))}
      {k1 < 1 ? card("ALEX, 29", "61 YEARS", TONE.long, "#E0AC84", "#2E5A6A", 1.3 * k1 * k1, 0.4 * k1, "MATCH", "#4BE3A4", clamp01(k1 * 3)) : null}
      {/* buttons */}
      {[
        ["✕", "#FF4A3A", 0.27, k2],
        ["♥", "#4BE3A4", 0.73, k1 < 1 ? k1 : 0],
      ].map(([g, c, x, press]) => (
        <div
          key={String(g)}
          style={{
            position: "absolute",
            top: h * 0.8,
            left: w * Number(x) - w * 0.1,
            width: w * 0.2,
            height: w * 0.2,
            borderRadius: "50%",
            border: `${w * 0.012}px solid ${c}`,
            color: String(c),
            fontSize: w * 0.1,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${1 + 0.15 * Math.sin(clamp01(Number(press)) * Math.PI)})`,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          {g}
        </div>
      ))}
      <div style={{ position: "absolute", bottom: h * 0.02, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.45)", fontSize: w * 0.05 }}>
        FILTER: 50+ YEARS LEFT {Math.floor(t * 2) % 2 ? "▾" : "▿"}
      </div>
    </div>
  );
};

/** The street news wall: BREAKING bar, headline, a timer icon. */
export const drawNews = (t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0E1428";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#C8372D";
  ctx.fillRect(0, 0, W, H * 0.24);
  fitText(ctx, Math.floor(t * 3) % 2 ? "BREAKING" : "● BREAKING", W / 2, H * 0.13, W * 0.9, H * 0.15, "#FFFFFF");
  fitText(ctx, "THE NUMBERS ARE REAL", W / 2, H * 0.47, W * 0.9, H * 0.17, "#FFFFFF");
  fitText(ctx, "EVERYONE CAN SEE THEIR OWN TIMER", W / 2, H * 0.66, W * 0.88, H * 0.09, P.amber, false);
  ctx.fillStyle = "#1A2340";
  ctx.fillRect(0, H * 0.82, W, H * 0.18);
  const ticker = "STAY CALM  ·  DO NOT PANIC  ·  SCIENTISTS BAFFLED  ·  ";
  ctx.font = CANVAS_FONT(H * 0.08, false);
  ctx.fillStyle = "#C9D2DE";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const off = (t * W * 0.35) % (W * 1.6);
  ctx.fillText(ticker + ticker, W - off, H * 0.91);
};

/** A "DEADLINE: FRIDAY" office banner. */
export const drawDeadline = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#1D274B";
  ctx.fillRect(0, 0, W, H);
  fitText(ctx, "DEADLINE: FRIDAY", W / 2, H / 2 + H * 0.04, W * 0.86, H * 0.5, "#F2EEE6");
};
