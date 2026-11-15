/**
 * Props for "What If Everyone Skipped Work for GTA 6?" (ep. 9, release day, November 19).
 * The game only ever appears as OUR OWN neon art (sunset grid road, pink supercar, palms):
 * never real GTA footage, logos, box art, map or HUD.
 */
import React, { useMemo } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { Building, PineTree } from "../../slavoski/city";
import { BoxG, chamferBox, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { crowdLook, suitLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { clamp01, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { handPosition, Hero, mergePose, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { sittingPose } from "../../slavoski/room";
import { CANVAS_FONT, CanvasPanel, fitText } from "../../slavoski/screens";

export const NEON_PINK = "#FF4FA0";
export const NEON_TEAL = "#2FE0D0";
export const NEON_BLUE = "#6F8CFF";

const smooth = (t: number) => {
  const k = clamp01(t);
  return k * k * (3 - 2 * k);
};

// ================================================================ our own game art

/** Synthwave sunset over a grid road with a pink supercar: the game's look on boxes, posters and screens. */
export const drawGameArt = (t = 0, opts: { car?: boolean; title?: string } = {}) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.6);
  sky.addColorStop(0, "#2A1458");
  sky.addColorStop(0.55, "#C2307A");
  sky.addColorStop(1, "#FF9A5A");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.6);
  // striped sun
  const sunR = Math.min(W, H) * 0.22;
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, H * 0.6, sunR, Math.PI, 0);
  ctx.clip();
  const sg = ctx.createLinearGradient(0, H * 0.6 - sunR, 0, H * 0.6);
  sg.addColorStop(0, "#FFE27A");
  sg.addColorStop(1, "#FF6A8A");
  ctx.fillStyle = sg;
  ctx.fillRect(W / 2 - sunR, H * 0.6 - sunR, sunR * 2, sunR);
  ctx.fillStyle = "#C2307A";
  for (let i = 0; i < 5; i++) ctx.fillRect(W / 2 - sunR, H * 0.6 - sunR * 0.12 - i * sunR * 0.16, sunR * 2, sunR * (0.025 + i * 0.012));
  ctx.restore();
  // ground with a perspective grid road
  ctx.fillStyle = "#170A30";
  ctx.fillRect(0, H * 0.6, W, H * 0.4);
  ctx.strokeStyle = NEON_TEAL;
  ctx.lineWidth = Math.max(1, W * 0.004);
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(W / 2 + i * W * 0.02, H * 0.6);
    ctx.lineTo(W / 2 + i * W * 0.22, H);
    ctx.stroke();
  }
  const scroll = (t * 0.8) % 1;
  for (let j = 0; j < 8; j++) {
    const k = (j + scroll) / 8;
    const y = H * 0.6 + H * 0.4 * k * k;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  // palm silhouettes
  ctx.fillStyle = "#12061F";
  const palm = (x: number, s: number) => {
    ctx.fillRect(x - s * 0.02, H * 0.6 - s * 0.55, s * 0.04, s * 0.55);
    for (let f = 0; f < 6; f++) {
      const a = -Math.PI + (f / 5) * Math.PI;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * s * 0.14, H * 0.6 - s * 0.55 + Math.sin(a) * s * 0.05 + s * 0.04, s * 0.16, s * 0.035, a * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  palm(W * 0.12, H * 0.55);
  palm(W * 0.88, H * 0.5);
  if (opts.car !== false) {
    // a chunky pink supercar from behind, glowing tail lights
    const cw = W * 0.36, ch = H * 0.1, cx = W / 2, cy = H * 0.86;
    ctx.fillStyle = NEON_PINK;
    ctx.beginPath();
    ctx.moveTo(cx - cw / 2, cy);
    ctx.lineTo(cx - cw * 0.42, cy - ch);
    ctx.lineTo(cx - cw * 0.22, cy - ch * 1.6);
    ctx.lineTo(cx + cw * 0.22, cy - ch * 1.6);
    ctx.lineTo(cx + cw * 0.42, cy - ch);
    ctx.lineTo(cx + cw / 2, cy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#2A1030";
    ctx.fillRect(cx - cw * 0.18, cy - ch * 1.45, cw * 0.36, ch * 0.4);
    ctx.fillStyle = "#FFE0F0";
    ctx.fillRect(cx - cw * 0.46, cy - ch * 0.75, cw * 0.18, ch * 0.18);
    ctx.fillRect(cx + cw * 0.28, cy - ch * 0.75, cw * 0.18, ch * 0.18);
    ctx.fillStyle = "#101018";
    ctx.fillRect(cx - cw * 0.44, cy, cw * 0.14, ch * 0.35);
    ctx.fillRect(cx + cw * 0.3, cy, cw * 0.14, ch * 0.35);
  }
  if (opts.title) {
    ctx.fillStyle = "rgba(10,4,20,0.55)";
    ctx.fillRect(W * 0.18, H * 0.12, W * 0.64, H * 0.13);
    fitText(ctx, opts.title, W / 2, H * 0.185, W * 0.6, H * 0.08, Math.floor(t * 2) % 2 === 0 ? "#FFFFFF" : "#FFE27A");
  }
};

/** A car seen from behind (canvas), used by the drawn gameplay. */
const carBack = (ctx: CanvasRenderingContext2D, cx: number, cy: number, cw: number, color: string, lights?: [string, string]) => {
  const ch = cw * 0.28;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - cw / 2, cy);
  ctx.lineTo(cx - cw * 0.42, cy - ch);
  ctx.lineTo(cx - cw * 0.24, cy - ch * 1.6);
  ctx.lineTo(cx + cw * 0.24, cy - ch * 1.6);
  ctx.lineTo(cx + cw * 0.42, cy - ch);
  ctx.lineTo(cx + cw / 2, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#1A1426";
  ctx.fillRect(cx - cw * 0.18, cy - ch * 1.45, cw * 0.36, ch * 0.4);
  ctx.fillStyle = "#FFD0E0";
  ctx.fillRect(cx - cw * 0.46, cy - ch * 0.75, cw * 0.16, ch * 0.2);
  ctx.fillRect(cx + cw * 0.3, cy - ch * 0.75, cw * 0.16, ch * 0.2);
  if (lights) {
    ctx.fillStyle = lights[0];
    ctx.fillRect(cx - cw * 0.2, cy - ch * 1.85, cw * 0.18, ch * 0.25);
    ctx.fillStyle = lights[1];
    ctx.fillRect(cx + cw * 0.02, cy - ch * 1.85, cw * 0.18, ch * 0.25);
  }
};

/** Gameplay drawn on a canvas (for a TV seen as a real 3D screen): a night police chase with our HUD. */
export const drawChase = (t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  const hz = H * 0.42;
  const sky = ctx.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, "#120A2A");
  sky.addColorStop(1, "#4A1E5A");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, hz);
  // towers with lit windows on both sides
  for (let i = 0; i < 9; i++) {
    for (const side of [-1, 1]) {
      const x = W / 2 + side * (W * 0.08 + i * W * 0.06);
      const h = H * (0.12 + ((i * 37) % 7) * 0.025);
      ctx.fillStyle = side < 0 ? "#2A1E44" : "#241A3C";
      ctx.fillRect(x - W * 0.03, hz - h, W * 0.06, h);
      ctx.fillStyle = i % 2 ? "#FFB0E0" : "#7FE8F0";
      for (let k = 0; k < 4; k++) ctx.fillRect(x - W * 0.02 + (k % 2) * W * 0.022, hz - h + H * 0.02 + Math.floor(k / 2) * H * 0.04, W * 0.012, H * 0.018);
    }
  }
  ctx.fillStyle = "#1A1426";
  ctx.fillRect(0, hz, W, H - hz);
  // road with scrolling lane dashes
  ctx.fillStyle = "#2A2238";
  ctx.beginPath();
  ctx.moveTo(W * 0.46, hz);
  ctx.lineTo(W * 0.54, hz);
  ctx.lineTo(W * 0.98, H);
  ctx.lineTo(W * 0.02, H);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#E6D7A8";
  for (let j = 0; j < 7; j++) {
    const k = (j / 7 + t * 1.6) % 1;
    const y = hz + (H - hz) * k * k;
    const w = W * 0.004 + W * 0.012 * k;
    ctx.fillRect(W / 2 - w / 2, y, w, H * 0.04 * k + 1);
  }
  const weave = Math.sin(t * 2.6) * W * 0.06;
  const flash = Math.floor(t * 6) % 2 === 0;
  carBack(ctx, W * 0.56 + weave, H * 0.72, W * 0.2, NEON_PINK);
  carBack(ctx, W * 0.42 - weave * 0.5, H * 0.9, W * 0.26, "#E8E8F0", flash ? ["#FF2A2A", "#203060"] : ["#401010", "#3A6AFF"]);
  carBack(ctx, W * 0.75, H * 0.98, W * 0.3, "#E8E8F0", flash ? ["#401010", "#3A6AFF"] : ["#FF2A2A", "#203060"]);
  // HUD: stars, mission
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";
  ctx.font = `700 ${Math.round(H * 0.09)}px "DejaVu Sans", sans-serif`;
  ctx.fillStyle = flash ? "#FFFFFF" : "#FFE27A";
  ctx.fillText("★★★★★", W * 0.96, H * 0.08);
  ctx.textAlign = "left";
  ctx.font = `700 ${Math.round(H * 0.05)}px "DejaVu Sans", sans-serif`;
  ctx.fillStyle = NEON_TEAL;
  ctx.fillText("ESCAPE THE COPS", W * 0.04, H * 0.08);
};

/** A game box (our own art, no logo) standing or lying, 1.0 × 1.3 × 0.16. */
export const GameBox: React.FC<{ position: V3; rotation?: V3; scale?: number }> = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh castShadow>
      <boxGeometry args={[1.0, 1.3, 0.16]} />
      <Flat color="#1A0E2A" />
    </mesh>
    <CanvasPanel position={[0, 0, 0.081]} w={0.96} h={1.26} px={256} draw={drawGameArt(0)} />
  </group>
);

// ================================================================ bedroom hook

/** Red seven-segment-style digits on a black face. */
export const drawDigits = (text: string, blink = false) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0A0606";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#3A0E0E";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = CANVAS_FONT(H * 0.72);
  ctx.fillText("88:88", W / 2, H * 0.54);
  if (!blink) {
    ctx.fillStyle = "#FF3A2A";
    ctx.fillText(text, W / 2, H * 0.54);
  }
};

/** A bedside alarm clock (face 0.9 × 0.42) with live digits. */
export const BedsideClock: React.FC<{ position: V3; yaw?: number; text: string; blink?: boolean }> = ({ position, yaw = 0, text, blink = false }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.27, 0]} geometry={chamferBox(1.05, 0.54, 0.42)} castShadow>
      <Flat color="#15161C" />
    </mesh>
    <CanvasPanel position={[0, 0.27, 0.212]} w={0.9} h={0.4} px={256} draw={drawDigits(text, blink)} />
    {!blink ? <Halo position={[0, 0.3, 0.4]} size={1.4} color="#FF3A2A" opacity={0.35} /> : null}
  </group>
);

// ================================================================ office

const DESK_TOP = 1.5;
/** A seated office worker (seat at y 0.7 like the couch), facing -z at the chair spot. */
export const seatedWorker = (over: Partial<Pose> = {}) => sittingPose({ lShoulder: [0.95, -0.1], rShoulder: [0.95, -0.1], lElbow: 0.55, rElbow: 0.55, ...over });

export const OfficeChair: React.FC<{ position: V3; yaw?: number; color?: string }> = ({ position, yaw = 0, color = "#2B2F3E" }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.62, 0]} geometry={chamferBox(1.3, 0.16, 1.2)} castShadow>
      <Flat color={color} />
    </mesh>
    <mesh position={[0, 1.55, 0.58]} geometry={chamferBox(1.25, 1.5, 0.16)} castShadow>
      <Flat color={color} />
    </mesh>
    <mesh position={[0, 0.32, 0]}>
      <CylG args={[0.08, 0.08, 0.5, 6]} />
      <Flat color="#8E96A6" />
    </mesh>
    {[0, 1, 2, 3, 4].map((i) => {
      const a = (i / 5) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * 0.32, 0.06, Math.sin(a) * 0.32]} rotation={[0, -a, 0]}>
          <BoxG args={[0.62, 0.08, 0.12]} />
          <Flat color="#5A5E68" />
        </mesh>
      );
    })}
  </group>
);

/** One desk (top at 1.5) with a monitor, keyboard and a chair. Faces -z (the worker sits at +z). */
export const DeskPod: React.FC<{ position: V3; seed: string; screen?: string; chairOut?: number; notes?: boolean }> = ({ position, seed, screen, chairOut = 0, notes = false }) => {
  const scr = screen ?? (random(`${seed}s`) < 0.7 ? "#9FC4E8" : "#1E2432");
  const cy = (random(`${seed}cy`) - 0.5) * 0.9 * chairOut;
  return (
    <group position={position}>
      <mesh position={[0, DESK_TOP - 0.06, 0]} geometry={chamferBox(3.6, 0.12, 1.6)} castShadow receiveShadow>
        <Flat color="#C9C2B4" />
      </mesh>
      {[-1.65, 1.65].map((x) => (
        <mesh key={x} position={[x, (DESK_TOP - 0.12) / 2, 0]} castShadow>
          <BoxG args={[0.12, DESK_TOP - 0.12, 1.5]} />
          <Flat color="#5A6478" />
        </mesh>
      ))}
      {/* privacy screen behind the monitor */}
      <mesh position={[0, DESK_TOP + 0.9, -0.85]} castShadow>
        <BoxG args={[3.6, 1.8, 0.12]} />
        <Flat color="#5A6E80" />
      </mesh>
      <mesh position={[0, DESK_TOP + 0.75, -0.45]} castShadow>
        <BoxG args={[1.6, 1.0, 0.1]} />
        <Flat color="#17181E" />
      </mesh>
      <mesh position={[0, DESK_TOP + 0.75, -0.39]}>
        <planeGeometry args={[1.44, 0.86]} />
        <Glow color={scr} />
      </mesh>
      <mesh position={[0, DESK_TOP + 0.12, -0.45]}>
        <BoxG args={[0.12, 0.25, 0.12]} />
        <Flat color="#17181E" />
      </mesh>
      <mesh position={[0, DESK_TOP + 0.03, 0.2]}>
        <BoxG args={[1.2, 0.05, 0.4]} />
        <Flat color="#2B2F3E" />
      </mesh>
      {notes
        ? [0, 1, 2].map((i) => (
            <mesh key={i} position={[-0.62 + i * 0.3, DESK_TOP + 1.18 - (i % 2) * 0.12, -0.385]} rotation={[0, 0, (random(`${seed}n${i}`) - 0.5) * 0.4]}>
              <planeGeometry args={[0.24, 0.24]} />
              <Flat color="#F2D84A" />
            </mesh>
          ))
        : null}
      <OfficeChair position={[cy, 0, 1.45 + chairOut * 0.6]} yaw={cy * 0.6} />
    </group>
  );
};

/** Rows of desks under ceiling lights, with a glass wall of rainy grey city at the back (z = -27). */
export const OpenOffice: React.FC<{ seats?: (row: number, col: number) => boolean; t: number; dusk?: boolean; workers?: boolean }> = ({ seats, t, dusk = false, workers = true }) => {
  const rows = [0, -6, -12, -18];
  const cols = [-12, -6, 0, 6, 12];
  return (
    <group>
      <mesh position={[0, -0.05, -10]} receiveShadow>
        <BoxG args={[44, 0.1, 40]} />
        <Flat color="#3E4658" />
      </mesh>
      <mesh position={[0, 9.6, -10]}>
        <BoxG args={[44, 0.2, 40]} />
        <Flat color="#C9CED8" />
      </mesh>
      {rows.flatMap((z) =>
        [-8, 0, 8].map((x) => (
          <group key={`${x}${z}`}>
            <mesh position={[x, 9.45, z + 2.5]}>
              <boxGeometry args={[4, 0.1, 1.2]} />
              <Glow color="#F4F6FA" />
            </mesh>
          </group>
        )),
      )}
      {/* glass wall: mullions, grey sky, buildings outside */}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[-22 + i * 4, 4.8, -27]}>
          <BoxG args={[0.3, 9.6, 0.3]} />
          <Flat color="#2B2F3E" />
        </mesh>
      ))}
      <mesh position={[0, 0.5, -27]}>
        <BoxG args={[44, 1.0, 0.3]} />
        <Flat color="#2B2F3E" />
      </mesh>
      <mesh position={[0, 5, -29]}>
        <planeGeometry args={[60, 12]} />
        <Glow color={dusk ? "#4A5470" : "#A9B4C4"} opacity={0.55} />
      </mesh>
      {[-30, -18, -6, 8, 20, 32].map((x, i) => (
        <Building key={x} position={[x, -6, -48 - (i % 3) * 8]} w={9} d={9} h={30 + (i % 3) * 12} color={i % 2 ? P.bldgSlate : P.bldgNavy} seed={`ow${i}`} power={dusk ? 0.8 : 0.25} />
      ))}
      {/* side wall */}
      <mesh position={[-22, 4.8, -10]}>
        <BoxG args={[0.3, 9.6, 40]} />
        <Flat color="#7A8294" />
      </mesh>
      {rows.flatMap((z, r) =>
        cols.map((x, c) => {
          const seat = seats?.(r, c) ?? false;
          const seed = `pod${r}${c}`;
          return (
            <group key={seed}>
              <DeskPod position={[x, 0, z]} seed={seed} chairOut={seat ? 0 : random(`${seed}o`)} />
              {seat && workers ? <Hero pose={seatedWorker({ headPitch: -0.05 })} position={[x, 0, z + 1.45]} yaw={Math.PI} look={crowdLook(r * 5 + c + 3)} /> : null}
            </group>
          );
        }),
      )}
      {/* rain on the glass */}
      {Array.from({ length: 40 }, (_, i) => {
        const x = -22 + random(`gr${i}`) * 44;
        const k = (random(`grk${i}`) + t * (0.3 + random(`grs${i}`) * 0.3)) % 1;
        return (
          <mesh key={i} position={[x, 9 - k * 9, -26.8]}>
            <planeGeometry args={[0.04, 0.5]} />
            <Glow color="#DCE6F2" opacity={0.5} />
          </mesh>
        );
      })}
    </group>
  );
};

/** A desk phone with a row of line buttons (blinking red when calls wait) and a small display. */
const drawCalls = (n: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#1E2A20";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#9CF0A0";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = CANVAS_FONT(H * 0.26, false);
  ctx.fillText("CALLS WAITING", W / 2, H * 0.3);
  ctx.font = CANVAS_FONT(H * 0.46);
  ctx.fillText(String(n), W / 2, H * 0.7);
};
export const DeskPhone: React.FC<{ position: V3; yaw?: number; calls: number; t: number; handset?: boolean }> = ({ position, yaw = 0, calls, t, handset = true }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.12, 0]} rotation={[-0.25, 0, 0]} geometry={chamferBox(1.1, 0.24, 0.9)} castShadow>
      <Flat color="#22242E" />
    </mesh>
    <CanvasPanel position={[0.18, 0.27, 0.05]} rotation={[-Math.PI / 2 + 0.25, 0, 0]} w={0.5} h={0.3} px={160} draw={drawCalls(calls)} />
    {Array.from({ length: 6 }, (_, i) => {
      const on = i < calls && Math.floor(t * 3 + i * 0.7) % 2 === 0;
      return (
        <mesh key={i} position={[-0.38, 0.2 + 0.0, -0.22 + i * 0.09]} rotation={[-Math.PI / 2 + 0.25, 0, 0]}>
          <circleGeometry args={[0.03, 8]} />
          <Glow color={on ? "#FF3A2A" : "#3A1010"} />
        </mesh>
      );
    })}
    {handset ? (
      <mesh position={[0.05, 0.32, -0.12]} rotation={[0, Math.PI / 2, 0]} geometry={chamferBox(0.22, 0.14, 0.95)} castShadow>
        <Flat color="#22242E" />
      </mesh>
    ) : null}
  </group>
);

/** The handset alone, held to an ear (long axis vertical). */
export const Handset: React.FC<{ position: V3; rotation?: V3 }> = ({ position, rotation = [0, 0, 0] }) => (
  <mesh position={position} rotation={rotation} geometry={chamferBox(0.14, 0.95, 0.22)} castShadow>
    <Flat color="#22242E" />
  </mesh>
);

/** A shift rota whiteboard: Thursday's column (NOV 19) fills with red "OFF" cells as `k` goes 0 → 1. */
const NAMES = ["ALEX", "SAM", "JO", "MIA", "LEE", "KAI", "RAY", "ZOE"];
export const drawRota = (k: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#F4F6F8";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#2B2F3E";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = CANVAS_FONT(H * 0.07);
  ctx.fillText("SHIFTS  ·  WEEK 47", W * 0.04, H * 0.08);
  const days = ["MON 16", "TUE 17", "WED 18", "THU 19", "FRI 20"];
  const x0 = W * 0.2, cw = (W * 0.77) / 5, y0 = H * 0.2, rh = (H * 0.76) / NAMES.length;
  ctx.font = CANVAS_FONT(H * 0.045);
  ctx.textAlign = "center";
  days.forEach((d, i) => {
    ctx.fillStyle = i === 3 ? "#C8372D" : "#2B2F3E";
    ctx.fillText(d, x0 + cw * (i + 0.5), H * 0.16);
  });
  const offs = Math.round(clamp01(k) * 6);
  NAMES.forEach((n, r) => {
    const y = y0 + rh * r;
    ctx.fillStyle = "#2B2F3E";
    ctx.textAlign = "left";
    ctx.font = CANVAS_FONT(H * 0.045, false);
    ctx.fillText(n, W * 0.04, y + rh / 2);
    days.forEach((_, i) => {
      const off = i === 3 && [1, 3, 4, 6, 0, 7].indexOf(r) > -1 && [1, 3, 4, 6, 0, 7].indexOf(r) < offs;
      ctx.fillStyle = off ? "#C8372D" : "#D6E4F0";
      ctx.fillRect(x0 + cw * i + cw * 0.06, y + rh * 0.12, cw * 0.88, rh * 0.76);
      ctx.fillStyle = off ? "#FFFFFF" : "#2B4A6A";
      ctx.textAlign = "center";
      ctx.font = CANVAS_FONT(H * (off ? 0.05 : 0.04), off);
      ctx.fillText(off ? "OFF" : "9–5", x0 + cw * (i + 0.5), y + rh / 2);
    });
  });
};

/** An analog wall clock (radius r); `hours` turns the hands (fractional hours, 12-hour face). */
let wallTex: THREE.CanvasTexture | null = null;
const wallFace = () => {
  if (wallTex) return wallTex;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#F4F2EA";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "#2B2F3E";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.lineWidth = i % 3 === 0 ? 10 : 5;
    ctx.beginPath();
    ctx.moveTo(128 + Math.sin(a) * 92, 128 - Math.cos(a) * 92);
    ctx.lineTo(128 + Math.sin(a) * 116, 128 - Math.cos(a) * 116);
    ctx.stroke();
  }
  wallTex = new THREE.CanvasTexture(c);
  wallTex.colorSpace = THREE.SRGBColorSpace;
  return wallTex;
};
export const WallClock: React.FC<{ position: V3; r?: number; hours: number; yaw?: number }> = ({ position, r = 1, hours, yaw = 0 }) => {
  const ha = -((hours % 12) / 12) * Math.PI * 2;
  const ma = -((hours * 60) % 60) / 60 * Math.PI * 2;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <CylG args={[r * 1.08, r * 1.08, 0.16, 24]} />
        <Flat color="#2B2F3E" />
      </mesh>
      <mesh position={[0, 0, 0.085]}>
        <circleGeometry args={[r, 32]} />
        <meshBasicMaterial map={wallFace()} toneMapped={false} />
      </mesh>
      <group position={[0, 0, 0.11]} rotation={[0, 0, ha]}>
        <mesh position={[0, r * 0.25, 0]}>
          <boxGeometry args={[r * 0.09, r * 0.55, 0.03]} />
          <Flat color="#17181E" />
        </mesh>
      </group>
      <group position={[0, 0, 0.13]} rotation={[0, 0, ma]}>
        <mesh position={[0, r * 0.38, 0]}>
          <boxGeometry args={[r * 0.06, r * 0.8, 0.03]} />
          <Flat color="#17181E" />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.15]}>
        <circleGeometry args={[r * 0.07, 10]} />
        <Flat color="#C8372D" />
      </mesh>
    </group>
  );
};

/** A stack of paper (sheets as one block with a few skewed top sheets). Height h, bottom at y. */
export const PaperStack: React.FC<{ position: V3; h?: number; seed?: string }> = ({ position, h = 0.8, seed = "paper" }) => (
  <group position={position}>
    <mesh position={[0, h / 2, 0]} castShadow>
      <BoxG args={[0.85, h, 1.1]} />
      <Flat color="#ECEAE2" />
    </mesh>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[(random(`${seed}x${i}`) - 0.5) * 0.1, h + 0.012 + i * 0.012, 0]} rotation={[0, (random(`${seed}r${i}`) - 0.5) * 0.4, 0]}>
        <boxGeometry args={[0.85, 0.01, 1.1]} />
        <Flat color="#F8F6F0" />
      </mesh>
    ))}
  </group>
);

// ================================================================ street: shops, umbrellas, traffic

/** A shopfront facing +z: facade, lit window, door, striped awning and a canvas sign (occludable). */
export const ShopFront: React.FC<{
  position: V3;
  yaw?: number;
  w?: number;
  color?: string;
  awning?: [string, string];
  sign: (ctx: CanvasRenderingContext2D, W: number, H: number) => void;
  window?: (ctx: CanvasRenderingContext2D, W: number, H: number) => void;
  glow?: string;
  neon?: string;
}> = ({ position, yaw = 0, w = 14, color = "#5A4A78", awning = ["#C8372D", "#F4F2EA"], sign, window: win, glow = "#F2C46A", neon }) => {
  const H = 12;
  const stripes = 10;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, H / 2, -0.5]} castShadow receiveShadow>
        <BoxG args={[w, H, 1]} />
        <Flat color={color} />
      </mesh>
      {/* the shop window (an interior glow, with an optional poster drawn on it) */}
      {win ? (
        <CanvasPanel position={[-w * 0.12, 3.1, 0.02]} w={w * 0.58} h={4.2} px={512} draw={win} />
      ) : (
        <mesh position={[-w * 0.12, 3.1, 0.02]}>
          <planeGeometry args={[w * 0.58, 4.2]} />
          <Glow color={glow} />
        </mesh>
      )}
      <mesh position={[-w * 0.12, 0.5, 0.15]}>
        <BoxG args={[w * 0.62, 1.0, 0.3]} />
        <Flat color="#2B2F3E" />
      </mesh>
      {/* door */}
      <mesh position={[w * 0.3, 2.6, 0.02]}>
        <planeGeometry args={[2.6, 5.2]} />
        <Glow color={glow} opacity={0.85} />
      </mesh>
      <mesh position={[w * 0.3, 5.3, 0.1]}>
        <BoxG args={[2.9, 0.25, 0.2]} />
        <Flat color="#2B2F3E" />
      </mesh>
      {/* awning */}
      {Array.from({ length: stripes }, (_, i) => (
        <mesh key={i} position={[-w / 2 + (w / stripes) * (i + 0.5), 6.25, 1.2]} rotation={[0.45, 0, 0]} castShadow>
          <BoxG args={[w / stripes, 0.08, 2.8]} />
          <Flat color={awning[i % 2]} />
        </mesh>
      ))}
      <CanvasPanel position={[0, 8.6, 0.03]} w={w * 0.8} h={2.4} px={800} draw={sign} />
      {neon ? (
        <>
          <Halo position={[0, 8.6, 0.6]} size={w * 0.9} color={neon} opacity={0.35} />
          <pointLight position={[0, 8, 3]} color={neon} intensity={30} distance={18} decay={1.6} />
        </>
      ) : null}
      <pointLight position={[-w * 0.12, 3, 2.5]} color={glow} intensity={20} distance={14} decay={1.6} />
    </group>
  );
};

/** A sign: dark board, bold text (shrunk to fit), optional neon glow colour for the letters. */
export const drawSign = (text: string, bg: string, color: string, sub?: string) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.shadowColor = color;
  ctx.shadowBlur = H * 0.12;
  fitText(ctx, text, W / 2, sub ? H * 0.4 : H * 0.53, W * 0.9, H * (sub ? 0.5 : 0.62), color);
  ctx.shadowBlur = 0;
  if (sub) fitText(ctx, sub, W / 2, H * 0.8, W * 0.9, H * 0.22, "#F4F2EA", false);
};

/** An open umbrella held in a right fist: pole from the fist up to a canopy over the head. */
export const UMBRELLA_COLORS = ["#C8372D", "#24748F", "#2B2F3E", "#E8C04A", "#5A4A78", "#2F7A5A"];
export const Umbrella: React.FC<{ hand: V3; over: V3; color: string }> = ({ hand, over, color }) => {
  const top: V3 = [over[0], over[1] + 1.15, over[2]];
  const mid: V3 = [(hand[0] + top[0]) / 2, (hand[1] + top[1]) / 2, (hand[2] + top[2]) / 2];
  const dir = new THREE.Vector3(top[0] - hand[0], top[1] - hand[1], top[2] - hand[2]);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return (
    <group>
      <mesh position={mid} quaternion={q}>
        <CylG args={[0.04, 0.04, len, 6]} />
        <Flat color="#2B2F3E" />
      </mesh>
      <mesh position={top} quaternion={q} castShadow>
        <ConeG args={[1.5, 0.95, 8]} />
        <Flat color={color} />
      </mesh>
    </group>
  );
};

/** A pedestrian with an umbrella (walking, or standing in a queue when `walk` is undefined). */
export const UmbrellaWalker: React.FC<{ position: V3; yaw?: number; walk?: number; seed: number; umbrella?: boolean; suit?: boolean }> = ({ position, yaw = 0, walk, seed, umbrella = true, suit = false }) => {
  const base = walk === undefined ? mergePose(REST, { headPitch: -0.05 }) : walkPose(walk, 0.7);
  const pose: Pose = umbrella ? mergePose(base, { rShoulder: [0.55, 0.12], rElbow: 1.45 }) : base;
  const hand = handPosition(pose, "r", position, yaw);
  const over: V3 = [position[0], position[1] + 3.5, position[2]];
  return (
    <group>
      <Hero pose={pose} position={position} yaw={yaw} look={suit ? suitLook(seed) : crowdLook(seed)} />
      {umbrella ? <Umbrella hand={hand} over={over} color={UMBRELLA_COLORS[seed % UMBRELLA_COLORS.length]} /> : null}
    </group>
  );
};

/** A traffic light on a pole (hero scale): `state` 0 red, 1 amber, 2 green. */
export const TrafficLight: React.FC<{ position: V3; yaw?: number; state: number }> = ({ position, yaw = 0, state }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 4.5, 0]} castShadow>
      <CylG args={[0.14, 0.16, 9, 8]} />
      <Flat color="#2B2F3E" />
    </mesh>
    <mesh position={[0, 9.4, 0.2]} geometry={chamferBox(0.9, 2.5, 0.6)} castShadow>
      <Flat color="#17181E" />
    </mesh>
    {["#FF3A2A", "#FFB03A", "#45E08A"].map((c, i) => (
      <group key={c} position={[0, 10.2 - i * 0.78, 0.52]}>
        <mesh>
          <circleGeometry args={[0.28, 12]} />
          <Glow color={state === i ? c : "#1E1E24"} />
        </mesh>
        {state === i ? <Halo position={[0, 0, 0.1]} size={2.2} color={c} opacity={0.7} /> : null}
      </group>
    ))}
  </group>
);

// ================================================================ infographics

/** 100 little pawns (10 × 10); `k` lights 18 of them amber, one after another (they hop as they turn). */
export const PawnGrid: React.FC<{ k: number; t: number; highlight?: number; seed?: string }> = ({ k, t, highlight = 18, seed = "pawn" }) => {
  const order = useMemo(() => {
    const idx = Array.from({ length: 100 }, (_, i) => i);
    idx.sort((a, b) => random(`${seed}${a}`) - random(`${seed}${b}`));
    return idx.slice(0, highlight);
  }, [seed, highlight]);
  return (
    <group>
      {Array.from({ length: 100 }, (_, i) => {
        const r = Math.floor(i / 5), c = i % 5;
        const rank = order.indexOf(i);
        const on = rank >= 0 ? clamp01(k * highlight * 1.15 - rank) : 0;
        const hop = on > 0 && on < 1 ? Math.sin(on * Math.PI) * 0.6 : 0;
        const color = on > 0.5 ? P.amber : "#5A6478";
        return (
          <group key={i} position={[(c - 2) * 1.35, hop, (r - 9.5) * 1.15]}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <CylG args={[0.24, 0.36, 0.9, 8]} />
              <Flat color={color} />
            </mesh>
            <mesh position={[0, 1.12, 0]} castShadow>
              <IcoG args={[0.3, 1]} />
              <Flat color={color} />
            </mesh>
          </group>
        );
      })}
      {/* a soft floor disc under the grid */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8.5, 24]} />
        <Flat color="#232A40" />
      </mesh>
    </group>
  );
};

/** A tear-off desk calendar page for Thursday 19 November; `stamp` 0..1 shows the red DAY OFF stamp. */
export const drawCalendar = (stamped: boolean) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#F8F6F0";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#C8372D";
  ctx.fillRect(0, 0, W, H * 0.22);
  fitText(ctx, "NOVEMBER", W / 2, H * 0.115, W * 0.85, H * 0.13, "#FFFFFF");
  fitText(ctx, "19", W / 2, H * 0.55, W * 0.8, H * 0.46, "#1A1A22");
  fitText(ctx, "THURSDAY", W / 2, H * 0.87, W * 0.8, H * 0.09, "#5A6478", false);
  if (stamped) {
    ctx.save();
    ctx.translate(W / 2, H * 0.56);
    ctx.rotate(-0.28);
    ctx.strokeStyle = "rgba(200,40,40,0.9)";
    ctx.lineWidth = W * 0.03;
    ctx.strokeRect(-W * 0.42, -H * 0.11, W * 0.84, H * 0.22);
    fitText(ctx, "DAY OFF", 0, 0, W * 0.76, H * 0.16, "rgba(200,40,40,0.92)");
    ctx.restore();
  }
};
export const DeskCalendar: React.FC<{ position: V3; stamped: boolean }> = ({ position, stamped }) => (
  <group position={position}>
    <mesh position={[0, 1.0, -0.2]} rotation={[-0.15, 0, 0]} geometry={chamferBox(2.2, 2.6, 0.4)} castShadow>
      <Flat color="#2B2F3E" />
    </mesh>
    <CanvasPanel position={[0, 1.02, 0.02]} rotation={[-0.15, 0, 0]} w={2.0} h={2.4} px={400} draw={drawCalendar(stamped)} />
  </group>
);
/** A rubber stamp: handle + block; `y` is the height of the block's bottom face. */
export const RubberStamp: React.FC<{ position: V3; y: number; yaw?: number }> = ({ position, y, yaw = 0.28 }) => (
  <group position={[position[0], y, position[2]]} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.15, 0]} geometry={chamferBox(1.9, 0.3, 0.6)} castShadow>
      <Flat color="#7A4A2C" />
    </mesh>
    <mesh position={[0, 0.02, 0]}>
      <BoxG args={[1.8, 0.05, 0.55]} />
      <Flat color="#B02828" />
    </mesh>
    <mesh position={[0, 0.7, 0]} castShadow>
      <CylG args={[0.14, 0.18, 0.8, 8]} />
      <Flat color="#5A3A28" />
    </mesh>
    <mesh position={[0, 1.2, 0]} castShadow>
      <IcoG args={[0.3, 1]} />
      <Flat color="#5A3A28" />
    </mesh>
  </group>
);

/** Two honest bars from zero: a typical Thursday (100) and 19 November (113). `k` grows them. */
const drawBarLabel = (a: string, b: string, color: string) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#141826";
  ctx.fillRect(0, 0, W, H);
  fitText(ctx, a, W / 2, H * 0.36, W * 0.92, H * 0.34, color);
  fitText(ctx, b, W / 2, H * 0.75, W * 0.92, H * 0.24, "#C9D2DE", false);
};
export const BarChart: React.FC<{ k: number; t: number }> = ({ k }) => {
  const unit = 0.07; // world units per point
  const bars = [
    { x: -2.1, v: 100, color: "#5A6478", top: "100", label: "A TYPICAL THURSDAY" },
    { x: 2.1, v: 113, color: P.amber, top: "+13%", label: "THU 19 NOVEMBER" },
  ];
  return (
    <group>
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <BoxG args={[10, 0.3, 6]} />
        <Flat color="#232A40" />
      </mesh>
      {bars.map((b, i) => {
        const h = Math.max(0.01, b.v * unit * smooth(k * 1.2 - i * 0.2));
        return (
          <group key={i}>
            <mesh position={[b.x, h / 2, 0]} castShadow>
              <BoxG args={[3.2, h, 3.0]} />
              <Flat color={b.color} />
            </mesh>
            <CanvasPanel position={[b.x, h + 1.0, 0]} w={3.1} h={1.4} px={300} draw={drawBarLabel(b.top, "", i ? P.amber : "#C9D2DE")} />
            <CanvasPanel position={[b.x, 0.9, 1.52]} w={3.1} h={1.0} px={300} draw={drawBarLabel(b.label, "LEAVE REQUESTS", "#F4F2EA")} />
          </group>
        );
      })}
    </group>
  );
};

/** A clinic/office appointments board: rows flip from ON TIME to DELAYED/RESCHEDULED as `k` rises. */
export const drawAppointments = (k: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#10141E";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#E8C04A";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = CANVAS_FONT(H * 0.08);
  ctx.fillText("TODAY'S APPOINTMENTS", W * 0.05, H * 0.1);
  const rows = [
    ["09:30", "CHECK-UP"],
    ["10:15", "DENTAL CLEAN"],
    ["11:00", "CONSULTATION"],
    ["13:30", "BLOOD TEST"],
    ["14:45", "PHYSIO"],
    ["16:00", "EYE TEST"],
  ];
  const flipped = Math.round(clamp01(k) * rows.length);
  rows.forEach(([time, what], i) => {
    const y = H * (0.25 + i * 0.125);
    ctx.fillStyle = "#C9D2DE";
    ctx.font = CANVAS_FONT(H * 0.065, false);
    ctx.textAlign = "left";
    ctx.fillText(time, W * 0.05, y);
    ctx.fillText(what, W * 0.24, y);
    const late = i < flipped;
    ctx.fillStyle = late ? (i % 2 ? "#FF6A4A" : "#FFB03A") : "#7FE0A0";
    ctx.textAlign = "right";
    ctx.font = CANVAS_FONT(H * 0.065);
    ctx.fillText(late ? (i % 2 ? "RESCHEDULED" : "DELAYED") : "ON TIME", W * 0.95, y);
  });
};

/** A streamer's corner: desk, two monitors (game + chat), ring light, mic arm, LED strip. */
export const drawStream = (t: number, viewers: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  drawGameArt(t, { car: true })(ctx, W, H);
  ctx.fillStyle = "#E01E3C";
  ctx.fillRect(W * 0.03, H * 0.05, W * 0.12, H * 0.09);
  fitText(ctx, "LIVE", W * 0.09, H * 0.095, W * 0.1, H * 0.06, "#FFFFFF");
  ctx.fillStyle = "rgba(10,10,20,0.7)";
  ctx.fillRect(W * 0.16, H * 0.05, W * 0.3, H * 0.09);
  fitText(ctx, `${viewers.toLocaleString("en-US")} watching`, W * 0.31, H * 0.095, W * 0.28, H * 0.055, "#FFFFFF", false);
};
const CHAT = ["lets gooo", "day off gang", "boss is watching lol", "GG", "called in sick 😷", "first!!", "the car tho", "no work today", "W stream", "same lol"];
export const drawChat = (t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#14121E";
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const shift = Math.floor(t * 3);
  for (let i = 0; i < 9; i++) {
    const m = CHAT[(i + shift) % CHAT.length];
    ctx.fillStyle = ["#FF4FA0", "#2FE0D0", "#FFB03A", "#9A8CFF"][(i + shift) % 4];
    ctx.font = CANVAS_FONT(H * 0.06);
    ctx.fillText(`user${((i + shift) * 37) % 900}:`, W * 0.05, H * (0.08 + i * 0.105));
    ctx.fillStyle = "#E8E4DA";
    ctx.font = CANVAS_FONT(H * 0.06, false);
    ctx.fillText(m, W * 0.48, H * (0.08 + i * 0.105));
  }
};
export const StreamerDesk: React.FC<{ t: number; viewers: number }> = ({ t, viewers }) => (
  <group>
    <mesh position={[0, DESK_TOP - 0.06, 0]} geometry={chamferBox(6.2, 0.12, 2.0)} castShadow receiveShadow>
      <Flat color="#22242E" />
    </mesh>
    {[-2.9, 2.9].map((x) => (
      <mesh key={x} position={[x, (DESK_TOP - 0.12) / 2, 0]}>
        <BoxG args={[0.12, DESK_TOP - 0.12, 1.8]} />
        <Flat color="#17181E" />
      </mesh>
    ))}
    {/* main monitor: the game */}
    <mesh position={[-0.8, DESK_TOP + 1.1, -0.6]} castShadow>
      <BoxG args={[3.2, 1.9, 0.12]} />
      <Flat color="#0E0E14" />
    </mesh>
    <CanvasPanel position={[-0.8, DESK_TOP + 1.1, -0.53]} w={3.0} h={1.7} px={512} draw={drawStream(t, viewers)} />
    {/* chat monitor */}
    <group position={[2.3, DESK_TOP + 1.0, -0.4]} rotation={[0, -0.45, 0]}>
      <mesh castShadow>
        <BoxG args={[1.3, 1.9, 0.1]} />
        <Flat color="#0E0E14" />
      </mesh>
      <CanvasPanel position={[0, 0, 0.06]} w={1.2} h={1.8} px={300} draw={drawChat(t)} />
    </group>
    {/* mic on an arm */}
    <mesh position={[-2.6, DESK_TOP + 1.2, 0.3]} rotation={[0, 0, -0.5]}>
      <CylG args={[0.04, 0.04, 2.4, 6]} />
      <Flat color="#17181E" />
    </mesh>
    <mesh position={[-2.05, DESK_TOP + 2.1, 0.55]} rotation={[0.4, 0, 0]}>
      <CylG args={[0.16, 0.16, 0.5, 10]} />
      <Flat color="#2B2F3E" />
    </mesh>
    {/* ring light */}
    <mesh position={[-0.8, DESK_TOP + 2.75, -0.4]}>
      <torusGeometry args={[0.7, 0.08, 6, 24]} />
      <Glow color="#FFF6E8" />
    </mesh>
    <Halo position={[-0.8, DESK_TOP + 2.75, -0.2]} size={3.6} color="#FFF0D8" opacity={0.5} />
    {/* LED strip on the wall behind */}
    <mesh position={[0, DESK_TOP + 3.6, -1.6]}>
      <boxGeometry args={[8, 0.08, 0.05]} />
      <Glow color={Math.floor(t * 2) % 2 ? NEON_PINK : NEON_TEAL} />
    </mesh>
    <pointLight position={[0, DESK_TOP + 2.6, 1.2]} color="#FFF0E0" intensity={18} distance={10} decay={1.6} />
    <pointLight position={[0, DESK_TOP + 3.4, -1.0]} color={NEON_PINK} intensity={14} distance={10} decay={1.6} />
  </group>
);
/** A gaming headset around a head centre (head radius 0.68). */
export const Headset: React.FC<{ head: V3; yaw?: number }> = ({ head, yaw = 0 }) => (
  <group position={head} rotation={[0, yaw, 0]}>
    <mesh rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[0.76, 0.07, 6, 18, Math.PI]} />
      <Flat color="#17181E" />
    </mesh>
    {[-0.74, 0.74].map((x) => (
      <mesh key={x} position={[x, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
        <CylG args={[0.26, 0.26, 0.16, 10]} />
        <Flat color={x < 0 ? NEON_PINK : "#17181E"} />
      </mesh>
    ))}
  </group>
);

/** A shop till with a display, a drawer and a receipt curling out (`receipt` 0..1 grows it). */
export const CashRegister: React.FC<{ position: V3; yaw?: number; receipt: number; total: string }> = ({ position, yaw = 0, receipt, total }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.4, 0]} geometry={chamferBox(2.0, 0.8, 1.6)} castShadow>
      <Flat color="#2B2F3E" />
    </mesh>
    <mesh position={[0, 0.9, -0.3]} rotation={[-0.5, 0, 0]} geometry={chamferBox(1.8, 0.5, 0.9)} castShadow>
      <Flat color="#3A3F55" />
    </mesh>
    <group position={[0, 1.55, -0.55]} rotation={[-0.25, 0, 0]}>
      <mesh>
        <BoxG args={[1.3, 0.6, 0.1]} />
        <Flat color="#17181E" />
      </mesh>
      <CanvasPanel position={[0, 0, 0.06]} w={1.2} h={0.5} px={240} draw={drawSign(total, "#0E1A12", "#7FE0A0")} />
    </group>
    {/* the receipt: a long paper strip falling over the front */}
    <mesh position={[0.55, 0.85 - receipt * 0.6, 0.82]} rotation={[-0.05, 0, 0]}>
      <planeGeometry args={[0.34, 0.1 + receipt * 1.3]} />
      <meshLambertMaterial color="#F8F6F0" side={THREE.DoubleSide} />
    </mesh>
  </group>
);

// ================================================================ misc dressing

/** A low hedge of pines and bushes for odd gaps (used around the little economy town). */
export const PineRow: React.FC<{ from: V3; to: V3; n?: number; scale?: number }> = ({ from, to, n = 6, scale = 1.2 }) => (
  <group>
    {Array.from({ length: n }, (_, i) => {
      const k = n === 1 ? 0 : i / (n - 1);
      return <PineTree key={i} position={[from[0] + (to[0] - from[0]) * k, 0, from[2] + (to[2] - from[2]) * k]} scale={scale * (0.85 + random(`pr${i}`) * 0.3)} />;
    })}
  </group>
);
