/**
 * Props for "What If Humans Became Immortal?" (ep. 8).
 * Garden + ladder (the hook and the bookend), hospital room with an ECG monitor, funeral home, birthday cake,
 * cribs, rubble with Slavoski pinned under a slab, the red-giant Sun, scorched ground, fading stars, a gift box.
 */
import React, { useMemo } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { Ground } from "../../slavoski/city";
import { BoxG, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { SLAVOSKI, crowdLook, type HeroLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { GrassTufts, LeafyTree } from "../../slavoski/nature";
import { clamp01, type V3 } from "../../slavoski/noise";
import { P, mix } from "../../slavoski/palette";
import { CanvasPanel, fitText } from "../../slavoski/screens";
import { Stars } from "../../slavoski/Stage";
import { HillRing, House } from "../no-work-2036/props";

// ================================================================ looks

export const GRANDMA: HeroLook = { ...crowdLook(3), skin: "#E8C0A0", skinShade: "#CCA284", hair: "#E4E4E8", jacket: "#8A5A9A", jacketShade: "#744A84", zipper: "#F0E6F4", jeans: "#5A4A6A", shoe: "#3A2A30" };
export const DOCTOR: HeroLook = { ...crowdLook(11), jacket: "#F0F2F4", jacketShade: "#D4D8DE", zipper: "#8FB3D9", jeans: "#4F9A9A", shoe: "#E8E4DA" };
export const PATIENT: HeroLook = { ...crowdLook(5), skin: "#E0B494", skinShade: "#C49878", hair: "#C8C8CC", jacket: "#A8C8D8", jacketShade: "#8CB0C2", zipper: "#E8F0F4", jeans: "#A8C8D8" };

/** Slavoski with a frost tint (0..1) for the cold, dark end of the universe. */
export const frosty = (k: number, base: HeroLook = SLAVOSKI): HeroLook => {
  const f = (c: string) => mix(c, "#CFE4F4", k * 0.55);
  return { ...base, skin: f(base.skin), skinShade: f(base.skinShade), hair: mix(base.hair, "#E8F2FA", k * 0.7), jacket: f(base.jacket), jacketShade: f(base.jacketShade), jeans: f(base.jeans), shoe: f(base.shoe) };
};

/** Slavoski covered in dust (0..1) after the collapse / on the scorched Earth. */
export const dusty = (k: number, tint = "#9A8A78", base: HeroLook = SLAVOSKI): HeroLook => {
  const f = (c: string) => mix(c, tint, k * 0.45);
  return { ...base, skin: f(base.skin), skinShade: f(base.skinShade), hair: f(base.hair), jacket: f(base.jacket), jacketShade: f(base.jacketShade), jeans: f(base.jeans), shoe: f(base.shoe) };
};

// ================================================================ canvas helpers

export const drawSign = (text: string, bg: string, color: string, size = 0.6, border?: string) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = H * 0.08;
    ctx.strokeRect(H * 0.06, H * 0.06, W - H * 0.12, H - H * 0.12);
  }
  fitText(ctx, text, W / 2, H / 2 + H * 0.04, W * 0.86, H * size, color);
};

/** Party banner with a pennant row. */
export const drawBanner = (text: string) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#F6EBC4";
  ctx.fillRect(0, 0, W, H);
  const cols = ["#E8544A", "#FFBA58", "#4FA3D9", "#5FB86A", "#B06AD0"];
  const n = 14;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = cols[i % cols.length];
    ctx.beginPath();
    ctx.moveTo((i / n) * W, 0);
    ctx.lineTo(((i + 1) / n) * W, 0);
    ctx.lineTo(((i + 0.5) / n) * W, H * 0.26);
    ctx.closePath();
    ctx.fill();
  }
  fitText(ctx, text, W / 2, H * 0.64, W * 0.9, H * 0.46, "#C8372D");
};

/** ECG monitor: a scrolling trace, flat (red, 0 BPM) until `aliveAt`, then a steady heartbeat (green). */
export const drawEcg = (t: number, aliveAt: number, bpm = 72) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#06120E";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(60,140,110,0.18)";
  ctx.lineWidth = 2;
  for (let x = 0; x < W; x += W / 12) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += H / 7) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  const on = t >= aliveAt;
  const col = on ? "#4CFF9A" : "#FF5A4A";
  const period = 60 / bpm;
  const base = H * 0.52;
  const span = 2.4;
  const shape = (ph: number) => {
    if (ph > 0.1 && ph < 0.16) return -Math.sin(((ph - 0.1) / 0.06) * Math.PI) * 0.06;
    if (ph >= 0.24 && ph < 0.27) return ((ph - 0.24) / 0.03) * 0.07;
    if (ph >= 0.27 && ph < 0.31) return 0.07 - ((ph - 0.27) / 0.04) * 0.45;
    if (ph >= 0.31 && ph < 0.35) return -0.38 + ((ph - 0.31) / 0.04) * 0.5;
    if (ph >= 0.35 && ph < 0.38) return 0.12 - ((ph - 0.35) / 0.03) * 0.12;
    if (ph > 0.5 && ph < 0.62) return -Math.sin(((ph - 0.5) / 0.12) * Math.PI) * 0.09;
    return 0;
  };
  ctx.lineWidth = H * 0.028;
  ctx.strokeStyle = col;
  ctx.shadowColor = col;
  ctx.shadowBlur = H * 0.05;
  ctx.beginPath();
  const N = 300;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const ts = t - (1 - u) * span;
    const y = ts >= aliveAt ? base + shape((((ts - aliveAt) % period) + period) % period / period) * H : base;
    if (i === 0) ctx.moveTo(u * W * 0.7, y);
    else ctx.lineTo(u * W * 0.7, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(W * 0.7, base + (on ? shape((((t - aliveAt) % period) + period) % period / period) * H : 0), H * 0.025, 0, Math.PI * 2);
  ctx.fill();
  fitText(ctx, "HR", W * 0.86, H * 0.18, W * 0.2, H * 0.1, col, false);
  fitText(ctx, on ? String(bpm) : "0", W * 0.86, H * 0.47, W * 0.24, H * 0.34, col);
  fitText(ctx, "BPM", W * 0.86, H * 0.7, W * 0.2, H * 0.08, col, false);
  if (on) {
    const ph = (((t - aliveAt) % period) + period) % period / period;
    const s = H * (0.07 + (ph > 0.27 && ph < 0.4 ? 0.025 : 0));
    const cx = W * 0.86;
    const cy = H * 0.86;
    ctx.beginPath();
    ctx.moveTo(cx, cy + s);
    ctx.bezierCurveTo(cx - s * 1.6, cy - s * 0.2, cx - s * 0.6, cy - s * 1.3, cx, cy - s * 0.4);
    ctx.bezierCurveTo(cx + s * 0.6, cy - s * 1.3, cx + s * 1.6, cy - s * 0.2, cx, cy + s);
    ctx.fill();
  }
};

/** The plaza screen: DEATHS TODAY 0. */
export const drawDeaths = (t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0A0E22";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#C8372D";
  ctx.fillRect(0, 0, W, H * 0.2);
  fitText(ctx, "BREAKING NEWS", W / 2, H * 0.11, W * 0.8, H * 0.13, "#FFFFFF");
  fitText(ctx, "DEATHS TODAY", W / 2, H * 0.36, W * 0.8, H * 0.14, "#DDE4F0", false);
  const s = 1 + 0.04 * Math.sin(t * 6);
  fitText(ctx, "0", W / 2, H * 0.68, W * 0.5, H * 0.46 * s, "#FFBA58");
};

// ================================================================ garden: the house, the ladder, the lawn

/** A leaning wooden ladder (base at the origin, running up local +Y). */
export const LADDER = { len: 6.2, w: 1.1, rung: 0.52 };
export const Ladder: React.FC<{ position: V3; rotation?: V3 }> = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={new THREE.Euler(...rotation, "YXZ")}>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[(s * LADDER.w) / 2, LADDER.len / 2, 0]} castShadow>
        <BoxG args={[0.12, LADDER.len, 0.16]} />
        <Flat color="#C89A5A" />
      </mesh>
    ))}
    {Array.from({ length: Math.floor(LADDER.len / LADDER.rung) - 1 }, (_, i) => (
      <mesh key={i} position={[0, LADDER.rung * (i + 1), 0]} castShadow>
        <BoxG args={[LADDER.w, 0.09, 0.12]} />
        <Flat color="#B4864A" />
      </mesh>
    ))}
  </group>
);

/** Banner under the eave of the House (front face at z = 3.5). */
export const BANNER = { c: [0, 5.35, 3.56] as V3, w: 5.6, h: 1.0 };

/** Grandma's garden: her house with the party banner, lawn, fence, trees, neighbours and hills. */
export const Garden: React.FC<{ banner?: boolean; grass?: number; seed?: string }> = ({ banner = true, grass = 1, seed = "garden" }) => (
  <group>
    <Ground color="#5E9A50" />
    <House position={[0, 0, 0]} color="#E8DCC4" roof="#B8483A" lit={false} />
    {banner ? <CanvasPanel position={BANNER.c} w={BANNER.w} h={BANNER.h} draw={drawBanner("HAPPY 120TH, GRANDMA!")} /> : null}
    {/* path to the door */}
    <mesh position={[0, -0.02, 9]} receiveShadow>
      <BoxG args={[1.8, 0.1, 11]} />
      <Flat color="#C9C2B4" />
    </mesh>
    {/* neighbours */}
    <House position={[-17, 0, -4]} color="#C8D8E4" roof="#3A4A6A" lit={false} />
    <House position={[17, 0, -3]} yaw={-0.15} color="#E8D0B0" roof="#5A4A3A" lit={false} />
    <House position={[-32, 0, -10]} yaw={0.2} color="#D8E4C8" roof="#8A3A3A" lit={false} scale={1.1} />
    <House position={[33, 0, -12]} yaw={-0.3} color="#F0E0C8" roof="#3A5A4A" lit={false} scale={1.1} />
    {/* picket fence along the front */}
    {Array.from({ length: 36 }, (_, i) => {
      const x = -26 + i * 1.5;
      if (Math.abs(x) < 1.6) return null;
      return (
        <mesh key={i} position={[x, 0.6, 16]} castShadow>
          <BoxG args={[0.22, 1.2, 0.12]} />
          <Flat color="#F2EEE6" />
        </mesh>
      );
    })}
    <mesh position={[0, 0.85, 16]}>
      <BoxG args={[52, 0.14, 0.08]} />
      <Flat color="#F2EEE6" />
    </mesh>
    {[
      [-8, -6],
      [9, -8],
      [-11, 6],
      [-14, 12],
      [-24, 4],
      [25, 5],
    ].map(([x, z], i) => (
      <LeafyTree key={i} position={[x, 0, z]} scale={1.5 + random(`${seed}t${i}`) * 0.6} seed={`${seed}${i}`} />
    ))}
    {grass > 0 ? <GrassTufts area={[-14, 14, 4, 15]} count={260} growth={grass} height={0.45} seed={`${seed}g`} /> : null}
    <HillRing color="#4F8A5A" radius={140} />
  </group>
);

// ================================================================ hospital

/** Hospital room: floor, back wall (z = -4) with a window, a bed along x, a monitor and an IV pole. */
export const BED = { x: 0, z: -1.2, w: 2.2, len: 4.6, top: 1.35 };
export const MONITOR = { c: [2.6, 3.6, -2.4] as V3, w: 1.6, h: 1.1, yaw: -0.5 };
export const HospitalRoom: React.FC<{ t: number; aliveAt: number; sky?: string }> = ({ t, aliveAt, sky = "#BFE0F6" }) => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[16, 0.1, 14]} />
      <Flat color="#B8C8C4" />
    </mesh>
    <mesh position={[0, 3.6, -4.1]} receiveShadow>
      <BoxG args={[16, 7.2, 0.2]} />
      <Flat color="#DCE8E4" />
    </mesh>
    <mesh position={[-6, 3.6, 0]} receiveShadow>
      <BoxG args={[0.2, 7.2, 14]} />
      <Flat color="#D0DEDA" />
    </mesh>
    {/* window */}
    <mesh position={[-2.6, 4.3, -3.98]}>
      <planeGeometry args={[3.2, 2.4]} />
      <Glow color={sky} />
    </mesh>
    <mesh position={[-2.6, 4.3, -3.95]}>
      <BoxG args={[0.1, 2.4, 0.06]} />
      <Flat color="#F2F4F4" />
    </mesh>
    {/* bed: frame, mattress, pillow, blanket */}
    <group position={[BED.x, 0, BED.z]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * BED.len) / 2, 0.9, 0]} castShadow>
          <BoxG args={[0.12, 1.8, BED.w]} />
          <Flat color="#AEB8C4" />
        </mesh>
      ))}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <BoxG args={[BED.len, 0.2, BED.w]} />
        <Flat color="#8A96A6" />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <BoxG args={[BED.len - 0.2, 0.4, BED.w - 0.1]} />
        <Flat color="#F4F6F8" />
      </mesh>
      <mesh position={[-BED.len / 2 + 0.6, 1.35, 0]} castShadow>
        <BoxG args={[0.8, 0.26, 1.4]} />
        <Flat color="#FFFFFF" />
      </mesh>
    </group>
    {/* monitor on a stand */}
    <mesh position={[MONITOR.c[0], MONITOR.c[1] / 2 - 0.4, MONITOR.c[2]]} castShadow>
      <CylG args={[0.06, 0.08, MONITOR.c[1] - 0.8, 6]} />
      <Flat color="#6A7480" />
    </mesh>
    <group position={MONITOR.c} rotation={[0, MONITOR.yaw, 0]}>
      <mesh position={[0, 0, -0.14]} castShadow>
        <BoxG args={[MONITOR.w + 0.24, MONITOR.h + 0.24, 0.26]} />
        <Flat color="#3A424E" />
      </mesh>
      <CanvasPanel position={[0, 0, 0.002]} w={MONITOR.w} h={MONITOR.h} px={640} draw={drawEcg(t, aliveAt)} />
    </group>
    <pointLight position={[MONITOR.c[0] - 0.4, MONITOR.c[1], MONITOR.c[2] + 1]} color={t >= aliveAt ? "#4CFF9A" : "#FF5A4A"} intensity={2.5} distance={4} decay={2} />
    {/* IV pole */}
    <mesh position={[-2.9, 2.4, -2.2]} castShadow>
      <CylG args={[0.04, 0.04, 4.8, 5]} />
      <Flat color="#AEB8C4" />
    </mesh>
    <mesh position={[-2.9, 4.3, -2.0]} castShadow>
      <BoxG args={[0.4, 0.6, 0.12]} />
      <Flat color="#DDEEF6" opacity={0.85} />
    </mesh>
    <mesh position={[0, 7.25, 0]}>
      <BoxG args={[16, 0.1, 14]} />
      <Flat color="#E8EEEC" />
    </mesh>
    {/* ceiling light strip */}
    <mesh position={[0, 7.1, -1]}>
      <boxGeometry args={[4, 0.06, 0.4]} />
      <Glow color="#F4FAFF" />
    </mesh>
  </group>
);

/** A crib with a sleeping baby. Pops in with `pop` 0..1. */
export const Crib: React.FC<{ position: V3; pop?: number; yaw?: number; seed?: string }> = ({ position, pop = 1, yaw = 0, seed = "crib" }) => {
  if (pop <= 0) return null;
  const s = Math.min(1, pop * 1.15) - Math.max(0, pop * 1.15 - 1) * 0.6;
  const blanket = ["#F4C8D4", "#BFD8F0", "#F6EBC4", "#CDE8C4"][Math.floor(random(`${seed}b`) * 4)];
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={s}>
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <BoxG args={[1.6, 0.1, 1.0]} />
        <Flat color="#F2EEE6" />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.75, 0.6, sz * 0.45]} castShadow>
            <BoxG args={[0.08, 1.2, 0.08]} />
            <Flat color="#E8E4DA" />
          </mesh>
        )),
      )}
      {[-1, 1].map((sz) => (
        <mesh key={sz} position={[0, 1.15, sz * 0.47]}>
          <BoxG args={[1.6, 0.06, 0.05]} />
          <Flat color="#E8E4DA" />
        </mesh>
      ))}
      <mesh position={[0.15, 0.95, 0]} castShadow>
        <BoxG args={[0.9, 0.3, 0.62]} />
        <Flat color={blanket} />
      </mesh>
      <mesh position={[-0.5, 0.98, 0]} castShadow>
        <IcoG args={[0.2, 1]} />
        <Flat color="#E8B896" />
      </mesh>
    </group>
  );
};

/** A swaddled baby (for the balance pan). */
export const Baby: React.FC<{ position: V3; seed?: string; rot?: number }> = ({ position, seed = "baby", rot = 0 }) => {
  const blanket = ["#F4C8D4", "#BFD8F0", "#F6EBC4", "#CDE8C4"][Math.floor(random(`${seed}b`) * 4)];
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <CylG args={[0.25, 0.28, 0.85, 8]} />
        <Flat color={blanket} />
      </mesh>
      <mesh position={[-0.55, 0.3, 0]} castShadow>
        <IcoG args={[0.22, 1]} />
        <Flat color="#E8B896" />
      </mesh>
    </group>
  );
};

// ================================================================ celebration

/** Seeded confetti falling through a box (cycles). */
export const Confetti: React.FC<{ center: V3; size: [number, number, number]; t: number; count?: number; seed?: string }> = ({ center, size, t, count = 140, seed = "conf" }) => {
  const cols = ["#E8544A", "#FFBA58", "#4FA3D9", "#5FB86A", "#B06AD0", "#F6EBC4"];
  return (
    <group position={center}>
      {Array.from({ length: count }, (_, i) => {
        const k = `${seed}${i}`;
        const sp = 1.2 + random(`${k}v`) * 1.4;
        const y = size[1] / 2 - (((random(`${k}y`) * size[1] + t * sp) % size[1]) + size[1]) % size[1];
        const x = (random(`${k}x`) - 0.5) * size[0] + Math.sin(t * 2 + i) * 0.3;
        const z = (random(`${k}z`) - 0.5) * size[2];
        return (
          <mesh key={i} position={[x, y, z]} rotation={[t * 3 + i, t * 2 + i * 0.7, 0]}>
            <planeGeometry args={[0.22, 0.14]} />
            <meshBasicMaterial color={cols[i % cols.length]} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
};

/** City plaza with a big news screen on a building (screen centre SCREEN.c, facing +Z). */
export const SCREEN = { c: [0, 15, -18] as V3, w: 12, h: 7.5 };

// ================================================================ funeral home

/** A small funeral home (front at z = 0), a CLOSED sign on the door, the name over the portico. */
export const FuneralHome: React.FC = () => (
  <group>
    <mesh position={[0, 4.5, -5]} castShadow receiveShadow>
      <BoxG args={[18, 9, 10]} />
      <Flat color="#B8AE98" />
    </mesh>
    <mesh position={[0, 9.3, -5]} castShadow>
      <BoxG args={[18.6, 0.6, 10.6]} />
      <Flat color="#857C6A" />
    </mesh>
    {/* steps */}
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[0, 0.2 + i * 0.4, 1.6 - i * 0.6]} castShadow receiveShadow>
        <BoxG args={[8 - i * 0.6, 0.4, 1.4]} />
        <Flat color="#C9C2B4" />
      </mesh>
    ))}
    {/* portico columns + roof */}
    {[-3, -1, 1, 3].map((x) => (
      <mesh key={x} position={[x * 1.15, 3.8, 0.6]} castShadow>
        <CylG args={[0.32, 0.36, 5.2, 8]} />
        <Flat color="#E6E0D4" />
      </mesh>
    ))}
    <mesh position={[0, 6.6, 0.4]} castShadow>
      <BoxG args={[9, 0.5, 2.4]} />
      <Flat color="#E6E0D4" />
    </mesh>
    <CanvasPanel position={[0, 7.55, 1.62]} w={8.2} h={1.3} draw={drawSign("FUNERAL HOME", "#2A2F3A", "#E6E0D4", 0.56)} />
    <mesh position={[0, 7.55, 1.5]}>
      <BoxG args={[8.4, 1.5, 0.2]} />
      <Flat color="#1A1E28" />
    </mesh>
    {/* door */}
    <mesh position={[0, 2.8, 0.01]}>
      <planeGeometry args={[2.4, 3.6]} />
      <Flat color="#3A2A22" />
    </mesh>
    <CanvasPanel position={[0, 3.0, 0.04]} w={1.6} h={0.8} draw={drawSign("CLOSED", "#F6EBC4", "#C8372D", 0.6, "#C8372D")} />
    {/* windows */}
    {[-6.5, -4.5, 4.5, 6.5].map((x) => (
      <mesh key={x} position={[x, 4.5, 0.01]}>
        <planeGeometry args={[1.2, 2.2]} />
        <Flat color={P.windowDark} />
      </mesh>
    ))}
    {/* hedges */}
    {[-6.5, 6.5].map((x) => (
      <mesh key={x} position={[x, 0.7, 1.4]} castShadow>
        <BoxG args={[4, 1.4, 1.4]} />
        <Flat color={P.leafDark} />
      </mesh>
    ))}
  </group>
);

/** A long black hearse (front faces +X), with a FOR SALE sign in the window. Wheels touch y = 0. */
export const Hearse: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
      <BoxG args={[6.2, 1.0, 2.2]} />
      <Flat color="#1C1E26" />
    </mesh>
    <mesh position={[-0.6, 1.95, 0]} castShadow>
      <BoxG args={[4.6, 1.1, 2.0]} />
      <Flat color="#22252E" />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[-0.6, 1.95, s * 1.01]} rotation={[0, s > 0 ? 0 : Math.PI, 0]}>
        <planeGeometry args={[4.2, 0.8]} />
        <Flat color="#5A6478" />
      </mesh>
    ))}
    <CanvasPanel position={[0.4, 1.95, 1.03]} w={1.6} h={0.7} draw={drawSign("FOR SALE", "#FFFFFF", "#C8372D", 0.56)} />
    {[-2.1, 2.1].flatMap((x) =>
      [-1, 1].map((s) => (
        <mesh key={`${x}${s}`} position={[x, 0.5, s * 1.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <CylG args={[0.5, 0.5, 0.3, 10]} />
          <Flat color="#141418" />
        </mesh>
      )),
    )}
    <mesh position={[3.11, 0.95, 0.7]}>
      <boxGeometry args={[0.02, 0.25, 0.4]} />
      <Glow color={P.headlight} />
    </mesh>
    <mesh position={[3.11, 0.95, -0.7]}>
      <boxGeometry args={[0.02, 0.25, 0.4]} />
      <Glow color={P.headlight} />
    </mesh>
  </group>
);

// ================================================================ birthday

/** Garden table (top y = 2.0) with a cloth. */
export const TABLE = { top: 2.0, w: 4.4, d: 2.2 };
export const GardenTable: React.FC<{ position: V3 }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, TABLE.top - 0.08, 0]} castShadow receiveShadow>
      <BoxG args={[TABLE.w, 0.16, TABLE.d]} />
      <Flat color="#F2EEE6" />
    </mesh>
    <mesh position={[0, TABLE.top - 0.4, TABLE.d / 2 + 0.01]}>
      <planeGeometry args={[TABLE.w, 0.7]} />
      <Flat color="#F2EEE6" />
    </mesh>
    {[-1, 1].flatMap((sx) =>
      [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * (TABLE.w / 2 - 0.2), (TABLE.top - 0.16) / 2, sz * (TABLE.d / 2 - 0.2)]} castShadow>
          <BoxG args={[0.14, TABLE.top - 0.16, 0.14]} />
          <Flat color="#B4864A" />
        </mesh>
      )),
    )}
  </group>
);

/** A two-tier cake covered in candles, with a "120" topper. `lit` 0..1 = share of flames still burning. */
export const Cake: React.FC<{ position: V3; t: number; lit?: number }> = ({ position, t, lit = 1 }) => {
  const candles = useMemo(() => {
    const out: V3[] = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      out.push([Math.cos(a) * 0.78, 0.62, Math.sin(a) * 0.78]);
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.2;
      out.push([Math.cos(a) * 0.42, 1.02, Math.sin(a) * 0.42]);
    }
    return out;
  }, []);
  return (
    <group position={position}>
      <mesh position={[0, 0.03, 0]} castShadow>
        <CylG args={[1.15, 1.15, 0.06, 16]} />
        <Flat color="#E8E4DA" />
      </mesh>
      <mesh position={[0, 0.32, 0]} castShadow>
        <CylG args={[0.95, 0.95, 0.55, 16]} />
        <Flat color="#F6D8E0" />
      </mesh>
      <mesh position={[0, 0.79, 0]} castShadow>
        <CylG args={[0.58, 0.58, 0.4, 14]} />
        <Flat color="#FFF4F0" />
      </mesh>
      {candles.map((p, i) => {
        const on = random(`cake${i}`) < lit;
        return (
          <group key={i} position={p}>
            <mesh position={[0, 0.12, 0]}>
              <CylG args={[0.03, 0.03, 0.24, 5]} />
              <Flat color={["#4FA3D9", "#FFBA58", "#E8544A", "#5FB86A"][i % 4]} />
            </mesh>
            {on ? (
              <mesh position={[0, 0.3, 0]} scale={[1, 1 + 0.15 * Math.sin(t * 20 + i), 1]}>
                <ConeG args={[0.045, 0.14, 5]} />
                <Glow color={P.fireCore} />
              </mesh>
            ) : null}
          </group>
        );
      })}
      {lit > 0 ? <Halo position={[0, 1.2, 0]} size={3.2 * lit} color="#FFD27A" opacity={0.45} /> : null}
      <mesh position={[0, 1.3, 0]}>
        <CylG args={[0.02, 0.02, 0.6, 4]} />
        <Flat color="#D9AE3A" />
      </mesh>
      <CanvasPanel position={[0, 1.75, 0.02]} w={0.95} h={0.5} px={256} draw={drawSign("120", "#FFBA58", "#7A2A1A", 0.8)} />
    </group>
  );
};

// ================================================================ the collapse

/** A concrete slab (centre at `position`), with rebar stubs. Moss creeps over with `moss` 0..1. */
export const Slab: React.FC<{ position: V3; size: V3; rotation?: V3; moss?: number; seed?: string; color?: string }> = ({ position, size, rotation = [0, 0, 0], moss = 0, seed = "slab", color = "#8A8E98" }) => {
  const c = mix(color, P.moss, moss * 0.75);
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <BoxG args={size} />
        <Flat color={c} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[size[0] / 2 + 0.2, (random(`${seed}r${i}`) - 0.5) * size[1] * 0.5, (i - 1) * size[2] * 0.3]} rotation={[0, 0, Math.PI / 2 + (random(`${seed}a${i}`) - 0.5) * 0.6]}>
          <CylG args={[0.04, 0.04, 0.7, 4]} />
          <Flat color="#6A3A2A" />
        </mesh>
      ))}
    </group>
  );
};

/**
 * The pinned hero: lying on his back on a broken floor slab, head toward -Z, face up, his free right arm
 * (world -X) out on a chunk. TRAP.hip is his hip joint (see `Reclined` in the shots).
 */
export const TRAP = { hip: [0, 0.93, 0] as V3, head: [0, 0.93, -1.95] as V3, floor: 0.25 };
export const RUBBLE = {
  slab: { position: [0, 1.74, 0.8] as V3, size: [3.6, 0.55, 3.4] as V3, rotation: [0.03, 0.1, 0] as V3 },
};
/** A rubble heap around the pinned hero; chunks keep clear of his body, head and free arm. */
export const Rubble: React.FC<{ moss?: number; seed?: string; spread?: number; count?: number }> = ({ moss = 0, seed = "rub", spread = 1, count = 70 }) => {
  const chunks = useMemo(() => {
    const out: { p: V3; s: V3; r: V3; c: string }[] = [];
    for (let i = 0; i < count; i++) {
      const k = `${seed}${i}`;
      const a = random(`${k}a`) * Math.PI * 2;
      const d = 2.6 + random(`${k}d`) * 9 * spread;
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d + 0.6;
      const s = (0.4 + random(`${k}s`) * 0.9) * (1 + Math.min(1.2, d / 12));
      // keep the body, head and free arm clear (chunk half-size included)
      if (x > -3.8 - s * 0.7 && x < 2.3 + s * 0.7 && z > -3.6 - s * 0.7 && z < 2.9 + s * 0.7) continue;
      // keep the cameras' line of sight from the feet side clear of big chunks
      if (s > 0.8 && x > -1.5 - s * 0.7 && x < 5 + s * 0.7 && z > 2.9 && z < 16) continue;
      out.push({
        p: [x, s * 0.25, z],
        s: [s * (1 + random(`${k}w`)), s * 0.6, s * (0.8 + random(`${k}l`))],
        r: [(random(`${k}x`) - 0.5) * 0.5, random(`${k}y`) * 3, (random(`${k}z`) - 0.5) * 0.5],
        c: ["#8A8E98", "#9A948A", "#6E7480", "#A89E8E", "#5A6070"][Math.floor(random(`${k}c`) * 5)],
      });
    }
    return out;
  }, [seed, spread, count]);
  const m = (c: string, k = 0.6) => mix(c, P.moss, moss * k);
  return (
    <group>
      {/* the broken floor he lies on */}
      <mesh position={[-0.6, TRAP.floor / 2, -0.2]} rotation={[0, 0.08, 0]} receiveShadow castShadow>
        <BoxG args={[7.6, TRAP.floor, 7.4]} />
        <Flat color={m("#7E828C", 0.5)} />
      </mesh>
      {chunks.map((ch, i) => (
        <mesh key={i} position={ch.p} rotation={ch.r} castShadow receiveShadow>
          <BoxG args={ch.s} />
          <Flat color={m(ch.c, 0.5 + 0.4 * random(`${seed}m${i}`))} />
        </mesh>
      ))}
      {/* the slab pinning him, propped on two blocks either side of his chest */}
      <Slab {...RUBBLE.slab} moss={moss} seed={`${seed}main`} />
      {[-1.75, 1.75].map((x) => (
        <mesh key={x} position={[x, TRAP.floor + 0.585, 0.8]} castShadow receiveShadow>
          <BoxG args={[0.9, 1.17, 1.6]} />
          <Flat color={m(x < 0 ? "#7A7E88" : "#8A8478")} />
        </mesh>
      ))}
      {/* a block under his free hand */}
      <mesh position={[-2.35, TRAP.floor + 0.12, -1.0]} rotation={[0, 0.3, 0]} castShadow receiveShadow>
        <BoxG args={[1.4, 0.24, 1.1]} />
        <Flat color={m("#8A8E98")} />
      </mesh>
      {/* a second slab past his feet */}
      <Slab position={[0.3, 1.0, 3.9]} size={[3.4, 0.5, 2.0]} rotation={[-0.25, -0.2, 0.08]} moss={moss} seed={`${seed}leg`} color="#7E828C" />
    </group>
  );
};

// ================================================================ the dying Sun

/** A unit icosphere with a grey jitter per face (multiplied by the material colour): the faceted sun surface. */
const GIANT = (() => {
  const g = new THREE.IcosahedronGeometry(1, 3); // already non-indexed (one vertex per face corner)
  const n = g.getAttribute("position").count;
  const col = new Float32Array(n * 3);
  for (let f = 0; f < n / 3; f++) {
    const r = random(`rgf${f}`);
    const v = 0.7 + 0.3 * r;
    for (let j = 0; j < 3; j++) col.set([v, v * (0.9 + 0.1 * r), v * (0.82 + 0.18 * r)], (f * 3 + j) * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
})();

/** The Sun swelling into a red giant: `k` 0 (yellow-white) → 1 (deep red-orange). Faceted, glowing limb. */
export const RedGiant: React.FC<{ position: V3; radius: number; k: number; t: number }> = ({ position, radius, k, t }) => {
  const core = mix("#FFF4D8", "#FF7A3A", clamp01(k * 1.2));
  const rim = mix("#FFD27A", "#D8301A", k);
  return (
    <group position={position}>
      <mesh geometry={GIANT} scale={radius} rotation={[t * 0.03, t * 0.05, 0]}>
        <meshBasicMaterial vertexColors color={core} toneMapped={false} fog={false} />
      </mesh>
      <mesh scale={radius * 1.035}>
        <IcoG args={[1, 3]} />
        <meshBasicMaterial color={rim} transparent opacity={0.35} depthWrite={false} toneMapped={false} fog={false} side={THREE.BackSide} />
      </mesh>
      <Halo size={radius * 3.4} color={rim} opacity={0.7} />
      <Halo size={radius * 6.5} color={rim} opacity={0.28} />
    </group>
  );
};

/** Cracked, scorched ground (the dried-up Earth): a dark plate with glowing seams and flat rock plates. */
export const ScorchedGround: React.FC<{ seed?: string; glow?: number }> = ({ seed = "scorch", glow = 1 }) => {
  const plates = useMemo(
    () =>
      Array.from({ length: 140 }, (_, i) => {
        const k = `${seed}${i}`;
        const x = (random(`${k}x`) - 0.5) * 160;
        const z = 30 - random(`${k}z`) * 220;
        const s = 2 + random(`${k}s`) * 4.5;
        return { x, z, s, yaw: random(`${k}y`) * Math.PI, c: ["#4A2E26", "#5A382C", "#3E2620", "#6A4232"][Math.floor(random(`${k}c`) * 4)] };
      }),
    [seed],
  );
  return (
    <group>
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <BoxG args={[1200, 0.1, 1200]} />
        <Glow color={mix("#2A1210", "#FE5A0E", 0.35 * glow)} />
      </mesh>
      {plates.map((p, i) => (
        <mesh key={i} position={[p.x, 0.02, p.z]} rotation={[0, p.yaw, 0]} receiveShadow castShadow>
          <CylG args={[p.s, p.s * 1.05, 0.22, 5 + (i % 3)]} />
          <Flat color={p.c} />
        </mesh>
      ))}
    </group>
  );
};

// ================================================================ the end of the universe

/** Star layers that fade out one after another as `k` goes 0 → 1 (0 = all lit). */
export const FadingStars: React.FC<{ k: number; layers?: number }> = ({ k, layers = 6 }) => (
  <group>
    {Array.from({ length: layers }, (_, i) => {
      const o = clamp01(1 - (k * layers - i) * 1.2);
      return o > 0.01 ? <Stars key={i} count={260} seed={`fade${i}`} size={1.6 + (i % 3) * 0.7} opacity={0.9 * o} /> : null;
    })}
  </group>
);

/** A small spiral galaxy made of points (fades with `o`). */
export const Galaxy: React.FC<{ position: V3; rotation?: V3; size?: number; o?: number; color?: string; seed?: string }> = ({ position, rotation = [0, 0, 0], size = 10, o = 1, color = "#C9D2F0", seed = "gal" }) => {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 900;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const arm = i % 2;
      const r = Math.pow(random(`${seed}r${i}`), 0.7) * size;
      const a = r * 0.55 + arm * Math.PI + (random(`${seed}a${i}`) - 0.5) * 0.7;
      pos.set([Math.cos(a) * r, (random(`${seed}y${i}`) - 0.5) * size * 0.06, Math.sin(a) * r], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [size, seed]);
  if (o <= 0.01) return null;
  return (
    <group position={position} rotation={rotation}>
      <points geometry={geom}>
        <pointsMaterial color={color} size={2.2} sizeAttenuation={false} transparent opacity={0.85 * o} fog={false} depthWrite={false} />
      </points>
      <Halo size={size * 0.9} color={color} opacity={0.5 * o} />
    </group>
  );
};

// ================================================================ the gift

/** A gift box (centre of the base at `position`) with an amber ribbon; the lid lifts with `open` 0..1. */
export const GiftBox: React.FC<{ position: V3; open?: number; glow?: number; glowColor?: string; size?: number; rotation?: V3 }> = ({
  position,
  open = 0,
  glow = 0,
  glowColor = "#FFD27A",
  size = 2,
  rotation = [0, 0, 0],
}) => {
  const s = size;
  const box = "#2E5A8A";
  const ribbon = P.amber;
  const lidY = s + s * 0.08 + open * s * 0.9;
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, s / 2, 0]} castShadow receiveShadow>
        <BoxG args={[s, s, s]} />
        <Flat color={box} />
      </mesh>
      {[0, 1].map((i) => (
        <mesh key={i} position={[0, s / 2, 0]} rotation={[0, (i * Math.PI) / 2, 0]}>
          <BoxG args={[s * 0.2, s * 1.004, s * 1.01]} />
          <Flat color={ribbon} />
        </mesh>
      ))}
      <group position={[0, lidY, 0]} rotation={[open * 0.5, 0, open * 0.25]}>
        <mesh castShadow>
          <BoxG args={[s * 1.08, s * 0.16, s * 1.08]} />
          <Flat color={box} />
        </mesh>
        {[0, 1].map((i) => (
          <mesh key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
            <BoxG args={[s * 0.2, s * 0.17, s * 1.09]} />
            <Flat color={ribbon} />
          </mesh>
        ))}
        {[-1, 1].map((d) => (
          <mesh key={d} position={[d * s * 0.2, s * 0.18, 0]} rotation={[0, 0, d * 0.6]} scale={[1.4, 0.6, 0.8]}>
            <IcoG args={[s * 0.16, 1]} />
            <Flat color={ribbon} />
          </mesh>
        ))}
      </group>
      {glow > 0 ? (
        <>
          <mesh position={[0, s + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[s * 0.96, s * 0.96]} />
            <Glow color={glowColor} opacity={glow} />
          </mesh>
          <mesh position={[0, s + s * 1.4 * glow, 0]}>
            <CylG args={[s * 0.48, s * 0.48, s * 2.8 * glow, 12, 1, true]} />
            <Glow color={glowColor} opacity={0.18 * glow} additive />
          </mesh>
          <Halo position={[0, s * 1.4, 0]} size={s * 6 * glow} color={glowColor} opacity={0.6 * glow} />
          <pointLight position={[0, s * 1.6, 0.5]} color={glowColor} intensity={30 * glow} distance={s * 6} decay={2} />
        </>
      ) : null}
    </group>
  );
};

export { clamp01 };
