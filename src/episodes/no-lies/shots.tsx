/**
 * Shots for "What If Humans Couldn't Lie?" (ep. 8).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * Arc: sunset (the hook: secrets caught in spotlights) → neon night → night interiors → a grey, rainy
 * morning → a silent snowy dusk → a warm kitchen on a snowy night → dawn on a rooftop.
 * The running gag: a speech bubble starts with the lie, a red strike crosses it, the truth replaces it.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Building, Car, CityGrid, Ground, Lamp, StreetSet } from "../../slavoski/city";
import { BoxG, CylG, IcoG } from "../../slavoski/detail";
import { crowdLook, suitLook, type HeroLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Clouds, Rain, Snow } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { handPosition, headPosition, Hero, mergePose, reach as reachRaw, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { sittingPose } from "../../slavoski/room";
import { CanvasPanel, ScreenHtml } from "../../slavoski/screens";
import { lerpCam, project, Stage, type CameraSpec } from "../../slavoski/Stage";
import { type CuedShot } from "../../slavoski/timeline";
import { HillRing, Skyline, Stall } from "../no-work-2036/props";
import { Capitol } from "../smart-animals/props";
import { CITY, PHONE, Phone3D } from "../ww3-countdown/props";
import {
  AdBoard,
  Apartment,
  BadHair,
  BurgerBar,
  Cafe,
  CAFE,
  Cap,
  Chair,
  chatter,
  COUCH,
  DRAWING,
  drawCreamAd,
  drawKidArt,
  drawPromiseAd,
  FolderBurst,
  Interrogation,
  ITABLE,
  Motel,
  NeonSign,
  PressCamera,
  PressRoom,
  Rooftop,
  Spotlight,
  Sweat,
  TruthBubble,
  Umbrella,
} from "./props";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
/** Pavement top in a BigStreet (kit curb 0.12 × 3.5). */
const PAVE = 0.42;
const up = (p: V3, dy = 0.95): V3 => [p[0], p[1] + dy, p[2]];
const talkIf = (lt: number, a: number, b: number, seed = 1) => (lt > a && lt < b ? chatter(lt, seed) : 0);

/**
 * reach() with a cache: the arm solution depends only on the torso (lean/twist/side/bob), the target and the
 * root, so the face can change freely. `scale` reaches for a scaled hero by scaling the target into its space.
 */
const REACH_CACHE = new Map<string, Pick<Pose, "lShoulder" | "rShoulder" | "lElbow" | "rElbow">>();
const reach = (pose: Pose, side: "l" | "r", target: V3, opts: { position?: V3; yaw?: number; scale?: number } = {}) => {
  const pos = opts.position ?? [0, 0, 0];
  const s = opts.scale ?? 1;
  const tgt: V3 = s === 1 ? target : [pos[0] + (target[0] - pos[0]) / s, pos[1] + (target[1] - pos[1]) / s, pos[2] + (target[2] - pos[2]) / s];
  const r3 = (v: number) => Math.round(v * 1000) / 1000;
  const key = JSON.stringify([side, tgt.map(r3), pos.map(r3), r3(opts.yaw ?? 0), r3(pose.lean), r3(pose.twist), r3(pose.side), r3(pose.bob), pose.lShoulder.map(r3), pose.rShoulder.map(r3), r3(pose.lElbow), r3(pose.rElbow)]);
  let arm = REACH_CACHE.get(key);
  if (!arm) {
    const out = reachRaw(pose, side, tgt, { position: pos, yaw: opts.yaw }).pose;
    arm = { lShoulder: out.lShoulder, rShoulder: out.rShoulder, lElbow: out.lElbow, rElbow: out.rElbow };
    REACH_CACHE.set(key, arm);
  }
  return { pose: { ...pose, ...arm } };
};

/** Kit street ×3.5 so it matches Slavoski (road |x| < 12.25, pavements 12.25–21.35 at y 0.42). */
const BigStreet: React.FC<React.ComponentProps<typeof StreetSet> & { day?: boolean }> = ({ day = false, ...props }) => (
  <group scale={CITY}>
    <StreetSet {...props} lampsOn={day ? false : props.lampsOn} modify={day ? (sp, i) => ({ power: 0.35, ...(props.modify?.(sp, i) ?? {}) }) : props.modify} />
  </group>
);

/** Snow lying on both pavements and down the middle of the road (thin white slabs). */
const SnowCover: React.FC = () => (
  <group>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 16.8, PAVE + 0.04, -100]} receiveShadow>
        <BoxG args={[9.1, 0.08, 330]} />
        <Flat color="#E8EEF5" />
      </mesh>
    ))}
    <mesh position={[0, 0.06, -100]} receiveShadow>
      <BoxG args={[24.4, 0.06, 330]} />
      <Flat color="#C9D2DE" />
    </mesh>
    {[-4.6, 4.6].map((x) => (
      <mesh key={x} position={[x, 0.1, -100]}>
        <BoxG args={[1.4, 0.03, 330]} />
        <Flat color="#7A8294" />
      </mesh>
    ))}
  </group>
);

/** Neon blade signs on the night street's facades (big-street units). */
const NEON: { x: number; y: number; z: number; text: string; color: string }[] = [
  { x: 21.1, y: 9, z: -8, text: "OPEN", color: "#7FE8FF" },
  { x: 21.1, y: 12, z: -40, text: "BAR", color: "#FF6FB0" },
  { x: -21.1, y: 10, z: -20, text: "24H", color: "#FFBA58" },
  { x: -21.1, y: 8, z: -55, text: "HOTEL", color: "#B58CFF" },
  { x: 21.1, y: 10, z: -75, text: "DINER", color: "#FF6FB0" },
];
const NeonStreet: React.FC<{ seed?: string; trees?: boolean; lamps?: boolean }> = ({ seed = "neon", trees = true, lamps = true }) => (
  <>
    <BigStreet seed={seed} trees={trees} lamps={lamps} />
    {NEON.map((n, i) => (
      <NeonSign key={i} position={[n.x - Math.sign(n.x) * 0.3, n.y, n.z]} w={n.text.length * 0.9 + 1} h={1.8} text={n.text} color={n.color} yaw={n.x > 0 ? -Math.PI / 2 : Math.PI / 2} />
    ))}
  </>
);

const Shot: React.FC<{ children: React.ReactNode; overlay?: React.ReactNode } & React.ComponentProps<typeof Stage>> = ({ children, overlay, ...stage }) => (
  <AbsoluteFill>
    <Stage {...stage}>{children}</Stage>
    {overlay}
  </AbsoluteFill>
);

const CLOUD = { day: "#F4F6FA", dawn: "#F0B8A8", sunset: "#F7B890", storm: "#3E4656", overcast: "#AEB6C2", snow: "#C9D0DC", night: "#2A3050" } as const;
const Sky: React.FC<{ t: number; tint: keyof typeof CLOUD; y?: number; radius?: number; count?: number; seed?: string }> = ({ t, tint, y = 45, radius = 200, count = 16, seed = "sky" }) => (
  <Clouds t={t} color={CLOUD[tint]} y={y} radius={radius} count={count} seed={seed} />
);

/** The low sun (sunset or dawn): a disc plus a big halo, far away in the given direction. */
const Sun: React.FC<{ position: V3; color?: string; size?: number }> = ({ position, color = "#FFB070", size = 14 }) => (
  <group>
    <mesh position={position}>
      <circleGeometry args={[size, 20]} />
      <Glow color="#FFE2A0" fog={false} />
    </mesh>
    <Halo position={position} size={size * 12} color={color} opacity={0.7} />
  </group>
);

/** A phone close-up in front of any backdrop, its screen an HTML overlay pinned to the 3D phone. */
const PhoneCU: React.FC<{
  c: ShotCtx;
  at: V3;
  glow: string;
  screen: (w: number, h: number) => React.ReactNode;
  children: React.ReactNode;
  stage?: Partial<React.ComponentProps<typeof Stage>>;
  push?: number;
}> = ({ c, at, glow, screen, children, stage, push = 0.35 }) => {
  const P0 = at;
  const cam = move({ position: [P0[0] + 0.05, P0[1], P0[2] + 2.1], target: [P0[0], P0[1] - 0.02, P0[2]] }, { position: [P0[0] + 0.03, P0[1], P0[2] + 2.1 - push], target: [P0[0], P0[1], P0[2]] }, c);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      stars={false}
      shadowSize={10}
      {...stage}
      overlay={
        <ScreenHtml c={[P0[0], P0[1], P0[2] + PHONE.d / 2 + 0.003]} w={PHONE.screenW} h={PHONE.screenH} cam={cam} width={c.width} height={c.height}>
          {screen}
        </ScreenHtml>
      }
    >
      {children}
      <Phone3D position={P0} glow={glow} />
      <mesh position={[P0[0] + 0.04, P0[1] - PHONE.h / 2 - 0.06, P0[2] + 0.02]} scale={[1.1, 0.8, 0.9]}>
        <IcoG args={[0.22, 2]} />
        <Flat color="#D9A27A" />
      </mesh>
      <pointLight position={[P0[0], P0[1], P0[2] + 1]} color={glow} intensity={4} distance={4} decay={2} />
      <Halo position={[P0[0], P0[1], P0[2] - 0.1]} size={1.6} color={glow} opacity={0.25} />
    </Shot>
  );
};

/** A generic chat screen: the scammer's message, struck through, then the honest one underneath. */
const ScamScreen: React.FC<{ w: number; h: number; k: number }> = ({ w, h, k }) => {
  const strike = clamp01((k - 0.25) / 0.25);
  const second = clamp01((k - 0.5) / 0.15);
  const bubble = (text: string, extra: React.CSSProperties = {}) => (
    <div style={{ background: "#2A3048", color: "#F2F2F6", borderRadius: w * 0.05, padding: `${w * 0.04}px ${w * 0.05}px`, fontSize: w * 0.075, fontWeight: 700, lineHeight: 1.2, marginTop: h * 0.025, maxWidth: w * 0.82, position: "relative", ...extra }}>
      {text}
    </div>
  );
  return (
    <div style={{ width: w, height: h, background: "#12162A", fontFamily: "DejaVu Sans, sans-serif", color: "#F2F2F6", position: "relative", overflow: "hidden" }}>
      <div style={{ padding: `${h * 0.05}px ${w * 0.06}px ${h * 0.025}px`, background: "#1D2238", fontSize: w * 0.06, letterSpacing: "0.06em", color: "#9AA1B0", textAlign: "center" }}>
        <div style={{ width: w * 0.16, height: w * 0.16, borderRadius: "50%", background: "#566270", margin: "0 auto", marginBottom: h * 0.012 }} />
        UNKNOWN NUMBER
      </div>
      <div style={{ padding: `0 ${w * 0.06}px` }}>
        {bubble("CONGRATS! YOU WON A NEW CAR! JUST SEND YOUR BANK DETAILS", {})}
        <div style={{ position: "relative", top: -h * 0.12, left: w * 0.02, height: h * 0.012, width: `${strike * 80}%`, background: "#D8352A", borderRadius: 4, transform: "rotate(-14deg)", transformOrigin: "0 50%" }} />
        <div style={{ opacity: second, transform: `translateY(${(1 - second) * h * 0.03}px)`, marginTop: -h * 0.02 }}>
          {bubble("ACTUALLY, I'M A SCAMMER. THERE IS NO CAR.", { background: "#C8372D" })}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- cold open: secrets in the spotlight (sunset)

const MOTEL_A: V3 = [-0.6, 0, 1.4];
const MOTEL_B: V3 = [1.2, 0, 1.9];
const coldMotel: ShotFn = (c) => {
  const cam = move({ position: [2.8, 5.4, 23], target: [0.4, 4.7, 0.5] }, { position: [2.5, 5.3, 20.5], target: [0.4, 4.7, 0.5] }, c);
  const on = k01(c.lt, 0.12, 0.22);
  const caught = c.lt > 0.25;
  const look = (seed: number): HeroLook => ({ ...crowdLook(seed), hair: seed === 11 ? "#3A2A1E" : "#1A1410" });
  const pa = mergePose(walkPose(0.15, caught ? 0 : 0.5), { expression: caught ? "alarm" : "smile", headYaw: caught ? -0.1 : 0.6, lShoulder: caught ? [0.4, 0.7] : [0.1, 0.12], rShoulder: caught ? [0.4, 0.7] : [0.1, 0.12], lElbow: caught ? 1.3 : 0.3, rElbow: caught ? 1.3 : 0.3 });
  const pb = mergePose(walkPose(0.4, caught ? 0 : 0.5), { expression: caught ? "alarm" : "smile", headYaw: caught ? 0.15 : -0.6, headPitch: caught ? 0.15 : 0 });
  return (
    <Shot mood="sunset" camera={cam} fog={[40, 260]} shadowSize={20} light={0.9}>
      <Ground color="#4A4048" />
      <Motel />
      <Car position={[7.5, 0, 8]} yaw={-0.3} color={P.carTeal} />
      <Car position={[-8, 0, 9]} yaw={0.4} color={P.carRed} />
      {[-30, -14, 14, 30].map((x, i) => (
        <Building key={x} position={[x, 0, -22 - (i % 2) * 8]} w={12} d={10} h={14 + i * 4} color={[P.bldgNavy, P.bldgPurple, P.bldgSlate, P.bldgTeal][i]} seed={`mb${i}`} />
      ))}
      <Sky t={c.t} tint="sunset" seed="motel" />
      <Hero pose={pa} position={MOTEL_A} yaw={caught ? 0 : 0.3} look={look(11)} />
      <Hero pose={pb} position={MOTEL_B} yaw={caught ? -0.2 : -0.4} look={look(24)} />
      <Spotlight from={[-22, 42, 12]} to={[0.3, 0, 1.6]} r={3.4} on={on} strength={1.4} />
    </Shot>
  );
};

/** The hug: one friend beams (back to us), the other rolls their eyes over the shoulder. */
const HUG_A: V3 = [16.2, PAVE, 4];
const HUG_B: V3 = [17.2, PAVE, 5.0];
const hugPoses = () => {
  // A (facing the camera) hugs B; B (back to camera, a bit shorter) hugs A
  let a = mergePose(REST, { expression: "deadpan", headYaw: -0.4, headRoll: 0.08 });
  a = reach(a, "l", [HUG_B[0] + 0.55, PAVE + 2.55, HUG_B[2] + 0.34], { position: HUG_A }).pose;
  a = reach(a, "r", [HUG_B[0] - 0.45, PAVE + 2.45, HUG_B[2] + 0.34], { position: HUG_A }).pose;
  let b = mergePose(REST, { expression: "smile", headYaw: 0.3 });
  b = reach(b, "l", [HUG_A[0] - 0.5, PAVE + 2.3 * 0.92, HUG_A[2] - 0.38], { position: HUG_B, yaw: Math.PI, scale: 0.92 }).pose;
  b = reach(b, "r", [HUG_A[0] + 0.55, PAVE + 2.25 * 0.92, HUG_A[2] - 0.38], { position: HUG_B, yaw: Math.PI, scale: 0.92 }).pose;
  return { a, b };
};
const coldHug: ShotFn = (c) => {
  const cam = move({ position: [10.4, 5.4, 21], target: [16.5, 4.2, 4.5] }, { position: [10.8, 5.3, 19.4], target: [16.5, 4.2, 4.5] }, c);
  const on = k01(c.lt, 0.45, 0.55);
  const { a, b } = hugPoses();
  const caught = c.lt > 0.6;
  return (
    <Shot mood="sunset" camera={cam} fog={[40, 260]} shadowSize={16} light={0.85}>
      <BigStreet seed="sunset" />
      <Sky t={c.t} tint="sunset" seed="hug" />
      <Hero pose={mergePose(a, caught ? { expression: "alarm", headYaw: -0.05 } : {})} position={HUG_A} look={crowdLook(5)} />
      <Hero pose={b} position={HUG_B} yaw={Math.PI} scale={0.92} look={crowdLook(18)} />
      <Spotlight from={[4, 44, 12]} to={[16.6, PAVE, 4.6]} r={3.2} on={on} strength={1.3} />
    </Shot>
  );
};

/** A domed government building at sunset: folders of secrets bursting out of its windows. */
const coldCapitol: ShotFn = (c) => {
  const cam = move({ position: [16, 7, 66], target: [0, 17, -6] }, { position: [14, 7.5, 59], target: [0, 17.5, -6] }, c);
  const S = 2.2;
  const win = (x: number): V3 => [x * S, 3.6 * S, -6 + 2.6 * S];
  return (
    <Shot mood="sunset" camera={cam} fog={[60, 320]} shadowSize={50} light={0.9}>
      <Ground color="#4F7A4A" />
      <HillRing color="#3E5A4A" />
      <Skyline radius={160} count={24} seed="capsky" />
      <Sky t={c.t} tint="sunset" seed="cap" />
      <Capitol position={[0, 0, -6]} scale={S} />
      <FolderBurst origin={win(-6.6)} t={c.lt - 0.1} seed="fa" scale={3.6} spread={1.6} count={18} />
      <FolderBurst origin={win(6.6)} t={c.lt - 0.25} seed="fb" scale={3.6} spread={1.6} count={18} />
      <FolderBurst origin={[0, 9 * S, -6 + 2.4 * S]} t={c.lt - 0.4} seed="fc" count={14} scale={3.6} spread={2} />
      <Spotlight from={[-70, 60, 10]} to={[-6, 0, 4]} r={5} on={k01(c.lt, 0.0, 0.2)} pool={false} strength={0.7} />
      <Spotlight from={[70, 60, 10]} to={[6, 0, 4]} r={5} on={k01(c.lt, 0.1, 0.3)} pool={false} strength={0.7} />
    </Shot>
  );
};

/** The whole city at sunset, searchlights sweeping across the rooftops. */
const coldCity: ShotFn = (c) => {
  const cam = move({ position: [48, 58, 78], target: [0, 0, -6] }, { position: [44, 54, 72], target: [0, 0, -6] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[80, 340]} shadowSize={70} light={0.85}>
      <CityGrid seed="coldcity" blocks={7} />
      <Ground color="#3A3F55" />
      <Sky t={c.t} tint="sunset" seed="ccsky" radius={240} />
      {Array.from({ length: 6 }, (_, i) => {
        const a = i * 1.7 + c.t * (0.6 + random(`sw${i}`) * 0.5);
        const to: V3 = [Math.sin(a) * (14 + i * 5), 0, Math.cos(a * 0.8) * (12 + i * 4)];
        return <Spotlight key={i} from={[(i - 2.5) * 30, 150, -60]} to={to} r={5} on={1} pool />;
      })}
    </Shot>
  );
};

/** A wave of light rolls down the street; everyone it passes flinches and grabs their throat. */
const WAVE_O: V3 = [0, 0.5, -150];
const PEOPLE: { p: V3; yaw: number; seed: number }[] = [
  { p: [14.0, PAVE, -2], yaw: 0.3, seed: 3 },
  { p: [18.2, PAVE, -7], yaw: -0.4, seed: 8 },
  { p: [15.4, PAVE, -14], yaw: 0.2, seed: 13 },
  { p: [19.4, PAVE, -21], yaw: -0.2, seed: 21 },
  { p: [13.8, PAVE, -28], yaw: 0, seed: 34 },
  { p: [17.4, PAVE, -36], yaw: 0.3, seed: 41 },
  { p: [9.0, 0, -18], yaw: 0.6, seed: 47 },
];
const SLAV_ST: V3 = [16.6, PAVE, 6];
const throatGrab = (base: Pose, pos: V3, yaw = 0): Pose => {
  const head = headPosition(base, pos, yaw);
  const fwd: V3 = [Math.sin(yaw), 0, Math.cos(yaw)];
  return reach(base, "r", [head[0] + fwd[0] * 0.75 - Math.cos(yaw) * 0.1, head[1] - 0.95, head[2] + fwd[2] * 0.75], { position: pos, yaw }).pose;
};
const coldPulse: ShotFn = (c) => {
  const cam = move({ position: [8.4, 5.8, 17], target: [16, 3.0, -16] }, { position: [8.8, 5.6, 15.5], target: [16, 3.0, -16] }, c);
  const r = 60 + c.lt * 65;
  const hit = (p: V3) => Math.hypot(p[0] - WAVE_O[0], p[2] - WAVE_O[2]) < r;
  return (
    <Shot mood="sunset" camera={cam} fog={[40, 260]} shadowSize={30} light={0.85} shake={r > 140 && r < 160 ? 0.05 : 0}>
      <BigStreet seed="sunset" />
      <Sky t={c.t} tint="sunset" seed="pulse" />
      <Sun position={[0, 20, -480]} />
      {PEOPLE.map(({ p, yaw, seed }, i) => {
        const base = mergePose(walkPose(c.lt * (hit(p) ? 0 : 1.3) + i * 0.3, hit(p) ? 0 : 0.8), { expression: hit(p) ? "alarm" : "neutral" });
        return <Hero key={i} pose={hit(p) ? throatGrab(base, p, yaw) : base} position={p} yaw={yaw} look={crowdLook(seed)} />;
      })}
      {r > 0 && r < 220 ? (
        <group position={WAVE_O}>
          <mesh position={[0, 5, 0]}>
            <cylinderGeometry args={[r, r, 12, 64, 1, true]} />
            <meshBasicMaterial color="#FFF2D6" transparent opacity={0.4 * (1 - r / 220)} blending={2} depthWrite={false} side={2} toneMapped={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
            <ringGeometry args={[Math.max(0.01, r - 3), r, 64]} />
            <meshBasicMaterial color="#FFF2D6" transparent opacity={0.8 * (1 - r / 220)} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ) : null}
    </Shot>
  );
};

/** Slavoski tries the oldest lie in the book. */
const coldMondays: ShotFn = (c) => {
  const cam = move({ position: [14.6, 4.75, 16.4], target: [16.6, 4.05, 6] }, { position: [14.75, 4.7, 15.1], target: [16.6, 4.1, 6] }, c);
  const swap = clamp01((c.lt - 0.55) / 0.7);
  const after = swap > 0.55;
  let pose = mergePose(REST, { expression: after ? "alarm" : "smile", talk: talkIf(c.lt, 0.05, 0.6, 2), headYaw: -0.15 });
  if (after) {
    const head = headPosition(pose, SLAV_ST, -0.15);
    pose = reach(pose, "r", [head[0] - 0.1, head[1] - 0.3, head[2] + 0.95], { position: SLAV_ST, yaw: -0.15 }).pose;
  }
  return (
    <Shot
      mood="sunset"
      camera={cam}
      fog={[40, 260]}
      shadowSize={14}
      light={0.85}
      overlay={<TruthBubble at={up(headPosition(pose, SLAV_ST, -0.15), 0.85)} cam={cam} width={c.width} height={c.height} lie={"I LOVE\nMONDAYS!"} truth={"I HATE\nMONDAYS."} swap={swap} appear={k01(c.lt, 0.05, 0.25)} offset={[-20, -110]} />}
    >
      <BigStreet seed="sunset" />
      <Sky t={c.t} tint="sunset" seed="mon" />
      <Hero pose={pose} position={SLAV_ST} yaw={-0.15} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 a perfect world (neon night)

const c1Walk: ShotFn = (c) => {
  const z = -4 + c.lt * 2.0;
  const hero: V3 = [16.4, PAVE, z];
  const cam = move({ position: [14.2, 4.8, z + 12.5], target: [16.4, 3.3, z - 1] }, { position: [14.0, 4.6, z + 11.5], target: [16.4, 3.3, z - 1] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[30, 200]} shadowSize={16}>
      <NeonStreet seed="neon" />
      <Hero pose={mergePose(walkPose(c.lt * 1.2, 0.9), { expression: "smile", headYaw: 0.2 + Math.sin(c.lt * 1.5) * 0.15 })} position={hero} />
      {[
        [-15, -10, 7],
        [-18, -22, 12],
        [14.2, -26, 16],
      ].map(([x, z0, s], i) => (
        <Hero key={i} pose={mergePose(walkPose(c.lt * 1.2 + i * 0.4, 0.9), { expression: "smile" })} position={[x, PAVE, z0 + c.lt * (i === 2 ? 1.6 : -1.6)]} yaw={i === 2 ? 0 : Math.PI} look={crowdLook(s)} />
      ))}
    </Shot>
  );
};

const c1Scam: ShotFn = (c) => (
  <PhoneCU c={c} at={[16.6, 4.4, 14]} glow="#8FB3D9" push={0.4} screen={(w, h) => <ScamScreen w={w} h={h} k={clamp01(c.lt / 1.4)} />}>
    <NeonStreet seed="neon" />
  </PhoneCU>
);

const BOARD_C: V3 = [0, 17, -78];
const c1Promise: ShotFn = (c) => {
  const cam = move({ position: [7, 4.2, 10], target: [0, 15, -78] }, { position: [6.4, 4.0, 4], target: [0, 15.5, -78] }, c);
  const honest = clamp01((c.lt - 0.35) / 0.7);
  return (
    <Shot mood="night" camera={cam} fog={[40, 220]} shadowSize={40}>
      <NeonStreet seed="neon" trees={false} />
      <AdBoard c={BOARD_C} w={22} h={11} draw={drawPromiseAd(honest)} />
      <Hero pose={mergePose(REST, { headPitch: 0.5, expression: honest > 0.5 ? "deadpan" : "awe" })} position={[3.5, 0, -12]} yaw={Math.PI} />
    </Shot>
  );
};

/** A street salesman's pitch: "TRUST ME!" — struck — "DON'T TRUST ME." */
const STALL_AT: V3 = [16.6, PAVE, -8];
const SALES: V3 = [STALL_AT[0] + 0.6, PAVE, STALL_AT[2] - 0.6];
const SLAV_STALL: V3 = [13.4, PAVE, -4.3];
const SLAV_STALL_YAW = Math.atan2(SALES[0] - SLAV_STALL[0], SALES[2] - SLAV_STALL[2]);
const c1Salesman: ShotFn = (c) => {
  const cam = move({ position: [21.0, 4.7, 7.5], target: [16.0, 3.9, -6.8] }, { position: [20.6, 4.6, 6.0], target: [16.0, 3.9, -6.8] }, c);
  const swap = clamp01((c.lt - 0.7) / 0.75);
  const sp = mergePose(REST, { expression: swap > 0.55 ? "alarm" : "smile", talk: talkIf(c.lt, 0.1, 1.9, 3), lShoulder: [1.2, 0.5], lElbow: 0.9, rShoulder: [0.6, 0.3], rElbow: 1.1 });
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={[30, 200]}
      shadowSize={16}
      overlay={<TruthBubble at={up(headPosition(sp, SALES), 0.9)} cam={cam} width={c.width} height={c.height} lie="TRUST ME!" truth={"DON'T\nTRUST ME."} swap={swap} appear={k01(c.lt, 0.1, 0.3)} offset={[-30, -130]} />}
    >
      <NeonStreet seed="neon" trees={false} />
      <Stall position={STALL_AT} name="BEST DEALS" />
      <Hero pose={sp} position={SALES} look={suitLook(7)} />
      <Hero pose={mergePose(REST, { expression: swap > 0.55 ? "deadpan" : "neutral", headYaw: 0.2 })} position={SLAV_STALL} yaw={SLAV_STALL_YAW} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 falling apart (night interiors)

/** An apartment block at night: broken hearts pop over the windows and lights go out. */
const HEARTS: [number, number][] = [
  [-4.5, 9],
  [3.6, 15],
  [-1.2, 21],
  [5.2, 6],
  [-5.6, 17],
];
const BrokenHeart: React.FC<{ k: number; split: number }> = ({ k, split }) => {
  const s = 0.4 + 0.6 * k;
  const d = split * 14;
  const half = (side: number) => (
    <path
      d={side < 0 ? "M50,88 C20,66 2,46 2,28 C2,12 16,2 30,2 C40,2 47,8 50,16 L44,34 L54,48 L46,62 Z" : "M50,88 C80,66 98,46 98,28 C98,12 84,2 70,2 C60,2 53,8 50,16 L44,34 L54,48 L46,62 Z"}
      fill="#E83A5A"
      stroke="#14121C"
      strokeWidth={5}
      transform={`translate(${side * d},${split * 6}) rotate(${side * split * 12} 50 50)`}
    />
  );
  return (
    <svg width={100} height={100} viewBox="-10 -10 120 120" style={{ transform: `translate(-50%,-50%) scale(${s * 1.1})`, opacity: k }}>
      {half(-1)}
      {half(1)}
    </svg>
  );
};
const c2Block: ShotFn = (c) => {
  const cam = move({ position: [0, 14, 80], target: [0, 13, 0] }, { position: [0, 14.4, 71], target: [0, 13.4, 0] }, c);
  const dark = clamp01((c.lt - 0.8) / 1.4);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={[40, 220]}
      shadowSize={40}
      overlay={
        <>
          {HEARTS.map(([x, y], i) => {
            const a = 0.15 + i * 0.28;
            const p = { x: 0, y: 0 };
            const pr = project([x, y, 5.6], cam, c.width, c.height) ?? p;
            return (
              <div key={i} style={{ position: "absolute", left: pr.x, top: pr.y }}>
                <BrokenHeart k={k01(c.lt, a, a + 0.18)} split={k01(c.lt, a + 0.45, a + 0.6)} />
              </div>
            );
          })}
        </>
      }
    >
      <Ground color="#2C3247" />
      <Building position={[0, 0, 0]} w={16} d={10} h={26} color={P.bldgPurple} seed="apblock" power={1 - dark * 0.6} />
      <Building position={[-19, 0, -4]} w={14} d={10} h={20} color={P.bldgNavy} seed="apl" />
      <Building position={[19, 0, -4]} w={14} d={10} h={30} color={P.bldgTeal} seed="apr" />
      <Skyline radius={120} count={22} seed="apsky" />
      <Sky t={c.t} tint="night" seed="blk" y={60} />
    </Shot>
  );
};

/** The couch: "I never liked your mother." */
const COUPLE_A: V3 = [COUCH.x - 1.3, 0, COUCH.z + 0.1];
const COUPLE_B: V3 = [COUCH.x + 1.3, 0, COUCH.z + 0.1];
const c2Couch: ShotFn = (c) => {
  const cam = move({ position: [-3.2, 3.7, 7.8], target: [-3.6, 2.6, -4.4] }, { position: [-3.3, 3.6, 6.9], target: [-3.6, 2.6, -4.4] }, c);
  const pa = sittingPose({ expression: "deadpan", headYaw: 0.45, talk: talkIf(c.lt, 0.05, 1.0, 4), lShoulder: [0.3, 0.1], rShoulder: [0.3, 0.1], lElbow: 0.9, rElbow: 0.9 });
  const pb = sittingPose({ expression: c.lt > 0.5 ? "alarm" : "neutral", headYaw: -0.5, lShoulder: [0.3, 0.1], rShoulder: [0.3, 0.1], lElbow: 0.9, rElbow: 0.9 });
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      shadowSize={14}
      light={0.7}
      overlay={<TruthBubble at={up(headPosition(pa, COUPLE_A, 0.2), 0.85)} cam={cam} width={c.width} height={c.height} truth={"I NEVER LIKED\nYOUR MOTHER."} appear={k01(c.lt, 0.0, 0.18)} offset={[30, -130]} />}
    >
      <Apartment />
      <Hero pose={pa} position={COUPLE_A} yaw={0.2} look={crowdLook(44)} />
      <Hero pose={pb} position={COUPLE_B} yaw={-0.2} look={crowdLook(52)} />
    </Shot>
  );
};

/** Dinner with friends, over Slavoski's shoulder: he tells a joke, they don't laugh. */
const FR1: V3 = [3.0, 0, -2.55];
const FR2: V3 = [5.1, 0, -2.55];
const SL_DIN: V3 = [5.6, 0, 1.0];
const c2Dinner: ShotFn = (c) => {
  const cam = move({ position: [2.6, 5.6, 8.8], target: [4.1, 2.8, -2.4] }, { position: [2.8, 5.4, 8.0], target: [4.1, 2.8, -2.4] }, c);
  const joke = c.lt < 1.0;
  const sl = sittingPose({ expression: joke ? "smile" : "worried", talk: talkIf(c.lt, 0, 1.0, 5), lShoulder: joke ? [0.9, 0.5] : [0.5, 0.1], rShoulder: joke ? [0.9, 0.5] : [0.5, 0.1], lElbow: 1.0, rElbow: 1.0 });
  const f = (seed: number) => sittingPose({ expression: "deadpan", headYaw: seed % 2 ? 0.15 : -0.1, lShoulder: [0.55, 0.05], rShoulder: [0.55, 0.05], lElbow: 1.15, rElbow: 1.15, talk: seed === 2 ? talkIf(c.lt, 1.05, 2.0, 6) : 0 });
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      shadowSize={14}
      light={0.7}
      overlay={<TruthBubble at={up(headPosition(f(2), FR2), 0.85)} cam={cam} width={c.width} height={c.height} truth={"YOU'RE NOT\nFUNNY."} appear={k01(c.lt, 1.0, 1.2)} offset={[40, -130]} />}
    >
      <Apartment />
      <Chair position={[FR1[0], 0, FR1[2]]} />
      <Chair position={[FR2[0], 0, FR2[2]]} />
      <Chair position={[SL_DIN[0], 0, SL_DIN[2]]} yaw={Math.PI} />
      <Hero pose={f(1)} position={FR1} look={crowdLook(61)} />
      <Hero pose={f(2)} position={FR2} look={crowdLook(70)} />
      <Hero pose={sl} position={SL_DIN} yaw={Math.PI} />
    </Shot>
  );
};

/** The night shift at the burger bar. */
const WORKER: V3 = [0.2, 0, -1.3];
const SL_BAR: V3 = [1.9, 0, 1.75];
const workerPose = (lt: number, swap: number) => mergePose(REST, { expression: swap > 0.55 ? "deadpan" : "smile", talk: talkIf(lt, 0.1, 1.6, 7), lShoulder: [0.5, 0.1], lElbow: 1.2 });
const c2Counter: ShotFn = (c) => {
  const cam = move({ position: [-4.8, 4.5, 13.2], target: [0.4, 3.5, -1] }, { position: [-4.4, 4.4, 11.8], target: [0.4, 3.5, -1] }, c);
  const swap = clamp01((c.lt - 0.55) / 0.6);
  const wp = workerPose(c.lt, swap);
  const head = headPosition(wp, WORKER);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      shadowSize={14}
      light={0.6}
      overlay={<TruthBubble at={up(head, 1.2)} cam={cam} width={c.width} height={c.height} lie="HAPPY TO HELP!" truth={"I HATE\nTHIS JOB."} swap={swap} appear={k01(c.lt, 0.05, 0.25)} offset={[-20, -130]} />}
    >
      <BurgerBar t={c.t} />
      <Hero pose={wp} position={WORKER} look={{ ...crowdLook(80), jacket: "#C8372D", jacketShade: "#A02A22" }} />
      <Cap head={head} />
      <Hero pose={mergePose(REST, { headYaw: 0.1 })} position={SL_BAR} yaw={Math.PI - 0.35} />
    </Shot>
  );
};
const c2Worker: ShotFn = (c) => {
  const cam = move({ position: [-0.4, 3.9, 4.6], target: [0.2, 3.6, -1.3] }, { position: [-0.3, 3.85, 3.9], target: [0.2, 3.62, -1.3] }, c);
  const wp = mergePose(workerPose(c.lt + 2, 1), { talk: 0, blink: c.lt > 0.6 && c.lt < 0.72 ? 1 : 0 });
  const head = headPosition(wp, WORKER);
  return (
    <Shot mood="night" camera={cam} fog={false} shadowSize={10} light={0.6}>
      <BurgerBar t={c.t} />
      <Hero pose={wp} position={WORKER} look={{ ...crowdLook(80), jacket: "#C8372D", jacketShade: "#A02A22" }} />
      <Cap head={head} />
      {/* the burger, dropped flat on the tray */}
      <mesh position={[0.4, 1.75 + 0.2, 0.1]}>
        <CylG args={[0.35, 0.33, 0.3, 10]} />
        <Flat color="#B8743A" />
      </mesh>
    </Shot>
  );
};

/** The press briefing: a question the politician can't answer truthfully. */
const POL: V3 = [0, 0.4, -0.95];
const REPORTERS: { p: V3; seed: number; cam?: boolean }[] = [
  { p: [-3.6, 0, 5.2], seed: 90, cam: true },
  { p: [-2.3, 0, 7.8], seed: 91 },
  { p: [2.6, 0, 5.4], seed: 92 },
  { p: [3.9, 0, 7.4], seed: 93, cam: true },
];
const Press: React.FC<{ t: number; asking?: number }> = ({ t, asking = 0 }) => (
  <>
    <PressRoom t={t} />
    {REPORTERS.map(({ p, seed, cam }, i) => {
      let pose = mergePose(REST, { headPitch: 0.1, talk: i === 2 ? asking : 0 });
      if (cam) {
        const head = headPosition(pose, p, Math.PI);
        pose = reach(pose, "r", [head[0] + 0.4, head[1] + 0.1, head[2] - 0.9], { position: p, yaw: Math.PI }).pose;
        pose = reach(pose, "l", [head[0] - 0.2, head[1] - 0.05, head[2] - 0.95], { position: p, yaw: Math.PI }).pose;
      }
      const head = headPosition(pose, p, Math.PI);
      return (
        <React.Fragment key={i}>
          <Hero pose={pose} position={p} yaw={Math.PI} look={crowdLook(seed)} />
          {cam ? <PressCamera position={[head[0] + 0.1, head[1] + 0.1, head[2] - 1.15]} /> : null}
        </React.Fragment>
      );
    })}
  </>
);
const c2Podium: ShotFn = (c) => {
  const cam = move({ position: [0, 6.4, 13.2], target: [0, 3.6, -0.6] }, { position: [0, 6.3, 11.8], target: [0, 3.65, -0.6] }, c);
  const pp = mergePose(REST, { expression: c.lt > 1.3 ? "alarm" : "smile", lShoulder: [0.7, 0.15], rShoulder: [0.7, 0.15], lElbow: 0.6, rElbow: 0.6 });
  const asker = REPORTERS[2].p;
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      shadowSize={16}
      light={0.55}
      overlay={<TruthBubble at={up(headPosition(REST, asker, Math.PI), 0.9)} cam={cam} width={c.width} height={c.height} truth={"WILL YOU\nLOWER TAXES?"} appear={k01(c.lt, 0.25, 0.45)} offset={[90, -30]} size={40} />}
    >
      <Press t={c.t} asking={talkIf(c.lt, 0.25, 1.3, 9)} />
      <Hero pose={pp} position={POL} look={suitLook(12)} />
    </Shot>
  );
};
const c2Sweat: ShotFn = (c) => {
  const cam = move({ position: [0.9, 4.45, 6.6], target: [0, 4.05, -0.95] }, { position: [0.8, 4.4, 5.7], target: [0, 4.07, -0.95] }, c);
  const dart = Math.sin(c.lt * 7) > 0 ? 0.35 : -0.35;
  const pp = mergePose(REST, { expression: "sealed", headYaw: c.lt < 0.9 ? dart * 0.6 : 0, lShoulder: [0.7, 0.15], rShoulder: [0.7, 0.15], lElbow: 0.6, rElbow: 0.6, talk: talkIf(c.lt, 1.0, 1.7, 10) * 0.6 });
  const head = headPosition(pp, POL);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      shadowSize={10}
      light={0.55}
      overlay={<TruthBubble at={up(head, 0.85)} cam={cam} width={c.width} height={c.height} truth="NO COMMENT." appear={k01(c.lt, 1.0, 1.2)} offset={[0, -120]} />}
    >
      <PressRoom t={c.t} />
      <Hero pose={pp} position={POL} look={suitLook(12)} />
      {[0, 1].map((i) => {
        const fall = ((c.lt * 0.6 + i * 0.5) % 1) * 0.5;
        return <Sweat key={i} position={[head[0] + (i ? -0.42 : 0.45), head[1] + 0.32 - fall, head[2] + 0.55]} />;
      })}
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 nowhere to hide (grey morning, rain)

const SUSPECT: V3 = [0, 0, -1.6];
const DETECTIVE: V3 = [2.5, 0, 0.5];
const DET_YAW = -2.2;
const SUSPECT_LOOK: HeroLook = { ...crowdLook(101), hair: "#2A1E18" };
const detectivePose = (lt: number) => {
  let p = mergePose(REST, { lean: 0.35, expression: "neutral", talk: talkIf(lt, 0.25, 1.4, 11), headPitch: -0.2 });
  p = reach(p, "l", [1.25, ITABLE.top + 0.25, 0.15], { position: DETECTIVE, yaw: DET_YAW }).pose;
  p = reach(p, "r", [1.6, ITABLE.top + 0.25, -0.6], { position: DETECTIVE, yaw: DET_YAW }).pose;
  return p;
};
const suspectPose = (talk = 0, expr: Pose["expression"] = "worried") => sittingPose({ expression: expr, lShoulder: [0.55, 0.05], rShoulder: [0.55, 0.05], lElbow: 1.15, rElbow: 1.15, talk, headPitch: 0.05 });
const c3Interro: ShotFn = (c) => {
  const cam = move({ position: [-5.4, 5.4, 11], target: [0.9, 2.8, -0.4] }, { position: [-5.0, 5.3, 9.9], target: [0.9, 2.8, -0.4] }, c);
  const dp = detectivePose(c.lt);
  return (
    <Shot
      mood="overcast"
      camera={cam}
      fog={false}
      shadowSize={12}
      light={0.55}
      overlay={<TruthBubble at={up(headPosition(dp, DETECTIVE, DET_YAW), 0.85)} cam={cam} width={c.width} height={c.height} truth={"WHERE WERE YOU\nLAST NIGHT?"} appear={k01(c.lt, 0.25, 0.45)} offset={[-20, -130]} size={40} />}
    >
      <Interrogation />
      <Chair position={[SUSPECT[0], 0, SUSPECT[2]]} color="#2B2F3E" />
      <Hero pose={suspectPose()} position={SUSPECT} look={SUSPECT_LOOK} />
      <Hero pose={dp} position={DETECTIVE} yaw={DET_YAW} look={{ ...suitLook(13), jacket: "#566270", jacketShade: "#46505C" }} />
    </Shot>
  );
};
const c3Confess: ShotFn = (c) => {
  const cam = move({ position: [0.5, 3.45, 4.6], target: [0, 3.05, -1.6] }, { position: [0.45, 3.4, 3.9], target: [0, 3.05, -1.6] }, c);
  const sp = suspectPose(talkIf(c.lt, 0.05, 1.2, 12), "relief");
  return (
    <Shot
      mood="overcast"
      camera={cam}
      fog={false}
      shadowSize={10}
      light={0.55}
      overlay={<TruthBubble at={up(headPosition(sp, SUSPECT), 0.8)} cam={cam} width={c.width} height={c.height} truth={"I DID IT.\nI TOOK THE DIAMONDS."} appear={k01(c.lt, 0.02, 0.2)} offset={[0, -120]} size={40} />}
    >
      <Interrogation />
      <Chair position={[SUSPECT[0], 0, SUSPECT[2]]} color="#2B2F3E" />
      <Hero pose={sp} position={SUSPECT} look={SUSPECT_LOOK} />
    </Shot>
  );
};

/** The rainy shopping street with the cream billboard on the right pavement. */
const AD_C: V3 = [19.6, 10.5, -46];
const RainStreet: React.FC<{ t: number; honest: number; walkers?: boolean }> = ({ t, honest, walkers = true }) => (
  <>
    <BigStreet seed="rain" day lampsOn={false} />
    <AdBoard c={AD_C} w={13} h={6.5} yaw={-Math.PI / 2} draw={drawCreamAd(honest)} />
    <Sky t={t} tint="overcast" seed="rain" y={50} />
    {walkers
      ? [
          { p: [-15.5, PAVE, -20 + t * 0.8] as V3, yaw: 0.0, seed: 120, col: P.carRed },
          { p: [-18, PAVE, -34 - t * 0.8] as V3, yaw: Math.PI, seed: 121, col: "#5A4A78" },
          { p: [14.4, PAVE, -24 - t * 0.6] as V3, yaw: Math.PI, seed: 122, col: "#E8E4DA" },
        ].map(({ p, yaw, seed, col }, i) => {
          const pose = mergePose(walkPose(t * 1.1 + i * 0.37, 0.7), { rShoulder: [0.75, 0.1], rElbow: 1.5 });
          return (
            <React.Fragment key={i}>
              <Hero pose={pose} position={p} yaw={yaw} look={crowdLook(seed)} />
              <Umbrella hand={handPosition(pose, "r", p, yaw)} color={col} />
            </React.Fragment>
          );
        })
      : null}
  </>
);
const c3Ad: ShotFn = (c) => {
  const cam = move({ position: [-15, 4.8, 8], target: [14, 9, -46] }, { position: [-14.6, 4.9, 5], target: [14, 9.2, -46] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[30, 220]} shadowSize={40} light={0.8}>
      <RainStreet t={c.t} honest={0} />
      <Rain center={[-6, 8, -18]} size={[18, 16, 22]} t={c.t} count={900} />
    </Shot>
  );
};
const c3AdTruth: ShotFn = (c) => {
  const cam = move({ position: [-18.5, 8.2, -37.5], target: [19.6, 10.5, -46] }, { position: [-16.5, 8.4, -38.2], target: [19.6, 10.5, -46] }, c);
  const honest = clamp01(c.lt / 0.8);
  return (
    <Shot mood="overcast" camera={cam} fog={[30, 220]} shadowSize={30} light={0.8}>
      <RainStreet t={c.t} honest={honest} walkers={false} />
      <Rain center={[0, 9, -40]} size={[14, 16, 16]} t={c.t} count={700} />
    </Shot>
  );
};

/** The haircut: a friend shows off a terrible new cut; Slavoski can't make himself say he loves it. */
const SL_RAIN: V3 = [15.6, PAVE, 6];
const SL_RAIN_YAW = 0.95;
const FRIEND: V3 = [18.0, PAVE, 6.6];
const FRIEND_YAW = -1.9;
const rainSlav = (expr: Pose["expression"], talk = 0) => {
  const base = mergePose(REST, { expression: expr, talk, headYaw: 0.15 });
  const pose = reach(base, "l", [SL_RAIN[0] - 0.2, SL_RAIN[1] + 3.1, SL_RAIN[2] - 0.6], { position: SL_RAIN, yaw: SL_RAIN_YAW }).pose;
  return { pose, hand: handPosition(pose, "l", SL_RAIN, SL_RAIN_YAW) };
};
const c3Haircut: ShotFn = (c) => {
  const cam = move({ position: [16.4, 4.4, 18.5], target: [16.8, 3.5, 6.2] }, { position: [16.4, 4.35, 17.2], target: [16.8, 3.55, 6.2] }, c);
  const fp = mergePose(REST, { expression: "smile", talk: talkIf(c.lt, 0.3, 1.6, 13), headYaw: -0.25, lShoulder: [0.3, 0.9], lElbow: 1.6 });
  const fh = headPosition(fp, FRIEND, FRIEND_YAW);
  const { pose, hand } = rainSlav(c.lt > 1.2 ? "awe" : "neutral");
  return (
    <Shot
      mood="overcast"
      camera={cam}
      fog={[25, 200]}
      shadowSize={16}
      light={0.8}
      overlay={<TruthBubble at={up(fh, 1.6)} cam={cam} width={c.width} height={c.height} truth={"NEW HAIRCUT!\nDO YOU LIKE IT?"} appear={k01(c.lt, 0.3, 0.5)} offset={[0, -110]} size={40} />}
    >
      <BigStreet seed="rain" day lampsOn={false} />
      <Sky t={c.t} tint="overcast" seed="hair" y={50} />
      <Hero pose={fp} position={FRIEND} yaw={FRIEND_YAW} look={crowdLook(130)} />
      <BadHair head={fh} yaw={FRIEND_YAW} />
      <Hero pose={pose} position={SL_RAIN} yaw={SL_RAIN_YAW} />
      <Umbrella hand={hand} color="#24748F" />
      <Rain center={[16.8, 7, 6]} size={[12, 14, 8]} t={c.t} count={600} />
    </Shot>
  );
};
const c3Strain: ShotFn = (c) => {
  const cam = move({ position: [17.6, 4.2, 12.4], target: [15.7, 3.95, 6.1] }, { position: [17.4, 4.15, 11.6], target: [15.7, 3.97, 6.1] }, c);
  const swap = clamp01((c.lt - 0.35) / 0.8);
  const { pose, hand } = rainSlav(swap < 0.5 ? "smile" : "sealed", swap < 0.5 ? talkIf(c.lt, 0.05, 0.5, 14) : talkIf(c.lt, 1.1, 1.6, 15) * 0.5);
  const head = headPosition(pose, SL_RAIN, SL_RAIN_YAW);
  return (
    <Shot
      mood="overcast"
      camera={cam}
      fog={[25, 200]}
      shadowSize={12}
      light={0.8}
      overlay={<TruthBubble at={up(head, 0.8)} cam={cam} width={c.width} height={c.height} lie="I LOVE IT!" truth={"IT'S… A\nHAIRCUT."} swap={swap} appear={k01(c.lt, 0.02, 0.2)} offset={[40, -120]} />}
    >
      <BigStreet seed="rain" day lampsOn={false} />
      <Hero pose={pose} position={SL_RAIN} yaw={SL_RAIN_YAW} />
      <Umbrella hand={hand} color="#24748F" />
      {swap > 0.5 ? <Sweat position={[head[0] + 0.5, head[1] + 0.3 - ((c.lt * 0.5) % 0.4), head[2] + 0.45]} /> : null}
      <Rain center={[15.6, 6, 2]} size={[10, 12, 5]} t={c.t} count={360} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 the silence (snowy dusk)

const SnowStreet: React.FC<{ t: number; seed?: string; lamps?: boolean }> = ({ t, seed = "snow", lamps = true }) => (
  <>
    <BigStreet seed={seed} lamps={lamps} />
    <SnowCover />
    <Sky t={t} tint="overcast" seed={`${seed}sky`} y={55} />
  </>
);
const WALKERS: { x: number; z0: number; dir: number; seed: number }[] = [
  { x: 14.5, z0: -4, dir: 1, seed: 140 },
  { x: 18.6, z0: -30, dir: 1, seed: 141 },
  { x: -15, z0: -10, dir: -1, seed: 142 },
  { x: -18.4, z0: 4, dir: -1, seed: 143 },
  { x: 16.5, z0: -48, dir: -1, seed: 144 },
  { x: -16, z0: -44, dir: 1, seed: 145 },
];
const c4Snow: ShotFn = (c) => {
  const cam = move({ position: [4.5, 8.5, 27], target: [13, 3, -12] }, { position: [5.2, 7.4, 24], target: [13, 3, -12] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[30, 220]} shadowSize={40} light={0.65}>
      <SnowStreet t={c.t} />
      {WALKERS.map(({ x, z0, dir, seed }, i) => (
        <Hero key={i} pose={mergePose(walkPose(c.lt * 1.1 + i * 0.3, 0.75), { expression: "sealed", headPitch: -0.2 })} position={[x, PAVE + 0.08, z0 + dir * c.lt * 1.5]} yaw={dir > 0 ? 0 : Math.PI} look={crowdLook(seed)} />
      ))}
      <Snow center={[10, 10, -10]} size={[30, 20, 30]} t={c.t} count={800} />
    </Shot>
  );
};

/** A bus stop: three people side by side, lips pressed, little empty bubbles. */
const STOP: { p: V3; seed: number }[] = [
  { p: [17.4, PAVE + 0.08, 4.6], seed: 150 },
  { p: [17.8, PAVE + 0.08, 1.9], seed: 151 },
  { p: [17.2, PAVE + 0.08, -0.8], seed: 152 },
];
const STOP_YAW = -Math.PI / 2 + 0.55;
const BusShelter: React.FC = () => (
  <group position={[19.8, PAVE, 2]}>
    <mesh position={[0, 5.4, 0]} castShadow>
      <BoxG args={[2.6, 0.2, 9]} />
      <Flat color="#E8EEF5" />
    </mesh>
    <mesh position={[0.9, 2.7, 0]}>
      <BoxG args={[0.1, 5.2, 8.6]} />
      <Flat color="#8FB3D9" opacity={0.35} />
    </mesh>
  </group>
);
const c4Faces: ShotFn = (c) => {
  const cam = move({ position: [10.5, 4.5, 13.5], target: [17.4, 3.5, 1.6] }, { position: [11.2, 4.4, 12.4], target: [17.4, 3.55, 1.6] }, c);
  return (
    <Shot
      mood="dawn"
      camera={cam}
      fog={[30, 220]}
      shadowSize={20}
      light={0.65}
      overlay={
        <>
          {STOP.map(({ p }, i) => {
            const a = 0.2 + i * 0.55;
            const k = k01(c.lt, a, a + 0.15) * (1 - k01(c.lt, a + 0.9, a + 1.05));
            return <TruthBubble key={i} at={up(headPosition(REST, p, STOP_YAW), 0.85)} cam={cam} width={c.width} height={c.height} truth="…" appear={k} offset={[0, -90]} size={46} />;
          })}
        </>
      }
    >
      <SnowStreet t={c.t} seed="stop" lamps={false} />
      <BusShelter />
      {STOP.map(({ p, seed }, i) => (
        <Hero key={i} pose={mergePose(REST, { expression: "sealed", headYaw: (i - 1) * 0.15, blink: Math.sin(c.lt * 3 + i) > 0.97 ? 1 : 0 })} position={p} yaw={STOP_YAW} look={crowdLook(seed)} />
      ))}
      <Snow center={[17, 7, -9]} size={[12, 14, 8]} t={c.t} count={220} />
    </Shot>
  );
};

const SL_SNOW: V3 = [16.6, PAVE + 0.08, 6];
const c4Hush: ShotFn = (c) => {
  const cam = move({ position: [14.7, 4.75, 15.4], target: [16.6, 4.15, 6] }, { position: [14.85, 4.7, 14.2], target: [16.6, 4.17, 6] }, c);
  const stop = c.lt > 0.7;
  let pose = mergePose(REST, { expression: stop ? "sealed" : "neutral", talk: talkIf(c.lt, 0.05, 0.65, 16), headYaw: -0.1 });
  if (stop) {
    const head = headPosition(pose, SL_SNOW, -0.15);
    const k = k01(c.lt, 0.7, 1.0);
    pose = reach(pose, "r", [head[0] + 0.3 - k * 0.6, head[1] - 0.5, head[2] + 0.9], { position: SL_SNOW, yaw: -0.15 }).pose;
  }
  return (
    <Shot
      mood="dawn"
      camera={cam}
      fog={[30, 220]}
      shadowSize={14}
      light={0.65}
      overlay={<TruthBubble at={up(headPosition(pose, SL_SNOW, -0.15), 0.85)} cam={cam} width={c.width} height={c.height} truth={"WELL, HONESTLY…"} appear={k01(c.lt, 0.05, 0.2) * (1 - k01(c.lt, 0.65, 0.8))} offset={[-30, -120]} />}
    >
      <SnowStreet t={c.t} seed="snow" />
      <Hero pose={pose} position={SL_SNOW} yaw={-0.15} />
      <Snow center={[16.6, 5.5, 0]} size={[10, 9, 5]} t={c.t} count={200} />
    </Shot>
  );
};

/** The café in the snow: couples at their tables, saying nothing. */
const CAFE_AT: V3 = [0, 0, 0];
const SITTERS: { p: V3; yaw: number; seed: number }[] = [
  { p: [-5.5, 0, -3.4], yaw: Math.PI / 2 - 0.45, seed: 160 },
  { p: [-2.5, 0, -3.4], yaw: -Math.PI / 2 + 0.45, seed: 161 },
  { p: [2.5, 0, -3.4], yaw: Math.PI / 2 - 0.45, seed: 162 },
  { p: [5.5, 0, -3.4], yaw: -Math.PI / 2 + 0.45, seed: 163 },
];
const c4Cafe: ShotFn = (c) => {
  const cam = move({ position: [2.6, 6.2, 25], target: [0, 4.6, -3] }, { position: [2.3, 6.0, 22], target: [0, 4.6, -3] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[30, 200]} shadowSize={24} light={0.6}>
      <Ground color="#E8EEF5" />
      <Cafe position={CAFE_AT} />
      <Building position={[-CAFE.w / 2 - 6.2, 0, -6]} w={12} d={12} h={20} color={P.bldgNavy} seed="cfl" />
      <Building position={[CAFE.w / 2 + 6.2, 0, -6]} w={12} d={12} h={16} color={P.bldgPurple} seed="cfr" />
      <Lamp position={[-9.5, 0, 3]} height={7} />
      <Sky t={c.t} tint="overcast" seed="cafe" y={55} />
      {SITTERS.map(({ p, yaw, seed }, i) => (
        <React.Fragment key={i}>
          <Chair position={p} yaw={yaw} color="#5A3E2E" />
          <Hero pose={sittingPose({ expression: "sealed", headPitch: -0.1, lShoulder: [0.5, 0.05], rShoulder: [0.5, 0.05], lElbow: 1.2, rElbow: 1.2 })} position={p} yaw={yaw} look={crowdLook(seed)} />
        </React.Fragment>
      ))}
      <Snow center={[0, 8, 4]} size={[22, 16, 6]} t={c.t} count={300} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 kind lies (a warm kitchen, snow outside)

const c5Walk: ShotFn = (c) => {
  const z = -2 + c.lt * 1.8;
  const hero: V3 = [16.4, PAVE + 0.08, z];
  const cam = move({ position: [14.0, 4.6, z + 12], target: [16.4, 3.3, z - 1] }, { position: [14.0, 4.5, z + 11.4], target: [16.4, 3.3, z - 1] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[25, 170]} shadowSize={14}>
      <BigStreet seed="snow" />
      <SnowCover />
      <Hero pose={mergePose(walkPose(c.lt * 1.0, 0.7), { expression: "worried", headPitch: -0.15 })} position={hero} />
      <Snow center={[16, 6, z - 2]} size={[14, 12, 10]} t={c.t} count={320} />
    </Shot>
  );
};
const c5Face: ShotFn = (c) => {
  const hero: V3 = [16.4, PAVE + 0.08, 2];
  const cam = move({ position: [15.0, 4.25, 10.2], target: [16.4, 4.1, 2] }, { position: [15.1, 4.2, 9.3], target: [16.4, 4.12, 2] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[25, 170]} shadowSize={10}>
      <BigStreet seed="snow" />
      <SnowCover />
      <Hero pose={mergePose(REST, { expression: "worried", headPitch: 0.35 - k01(c.lt, 0.4, 1.2) * 0.25, headYaw: 0.3 })} position={hero} yaw={-0.2} />
      <Snow center={[16.4, 5, -2]} size={[9, 8, 5]} t={c.t} count={160} />
    </Shot>
  );
};

/** The child shows Slavoski a drawing. Over his shoulder. */
const KID: V3 = [7.2, 0, -2.4];
const KID_S = 0.62;
const SL_K: V3 = [4.7, 0, -1.2];
const KID_YAW = Math.atan2(SL_K[0] - KID[0], SL_K[2] - KID[2]);
const SL_K_YAW = Math.atan2(KID[0] - SL_K[0], KID[2] - SL_K[2]);
const kidPose = (expr: Pose["expression"], raise: number, talk = 0) =>
  mergePose(REST, { expression: expr, talk, headPitch: 0.35, lShoulder: [0.4 + raise * 1.0, -0.05], rShoulder: [0.4 + raise * 1.0, -0.05], lElbow: 0.5 - raise * 0.2, rElbow: 0.5 - raise * 0.2 });
const KidDrawing: React.FC<{ pose: Pose }> = ({ pose }) => {
  const l = handPosition(pose, "l", KID, KID_YAW, KID_S);
  const r = handPosition(pose, "r", KID, KID_YAW, KID_S);
  const fwd: V3 = [Math.sin(KID_YAW), 0, Math.cos(KID_YAW)];
  const cx = (l[0] + r[0]) / 2 + fwd[0] * 0.12;
  const cz = (l[2] + r[2]) / 2 + fwd[2] * 0.12;
  const cy = (l[1] + r[1]) / 2 + DRAWING.h * 0.35;
  return <CanvasPanel position={[cx, cy, cz]} rotation={[0, KID_YAW, 0]} w={DRAWING.w} h={DRAWING.h} draw={drawKidArt} />;
};
const c5Drawing: ShotFn = (c) => {
  const dir: V3 = [Math.sin(SL_K_YAW), 0, Math.cos(SL_K_YAW)];
  const base: V3 = [SL_K[0] - dir[0] * 3.2 - dir[2] * 2.4, 5.6, SL_K[2] - dir[2] * 3.2 + dir[0] * 2.4];
  const cam = move({ position: base, target: [KID[0], 2.1, KID[2]] }, { position: [base[0] + dir[0] * 0.6, 5.5, base[2] + dir[2] * 0.6], target: [KID[0], 2.15, KID[2]] }, c);
  const kp = kidPose("smile", k01(c.lt, 0.0, 0.35), talkIf(c.lt, 0.15, 1.2, 17));
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      shadowSize={14}
      light={0.65}
      overlay={<TruthBubble at={up(headPosition(kp, KID, KID_YAW, KID_S), 0.7)} cam={cam} width={c.width} height={c.height} truth={"I MADE THIS\nFOR YOU!"} appear={k01(c.lt, 0.15, 0.35)} offset={[40, -120]} size={40} />}
    >
      <Apartment warm snow t={c.t} table={false} />
      <Hero pose={kp} position={KID} yaw={KID_YAW} scale={KID_S} look={crowdLook(170)} />
      <KidDrawing pose={kp} />
      <Hero pose={mergePose(REST, { headPitch: -0.45, expression: "neutral" })} position={SL_K} yaw={SL_K_YAW} />
    </Shot>
  );
};
const c5Honest: ShotFn = (c) => {
  const dir: V3 = [Math.sin(KID_YAW), 0, Math.cos(KID_YAW)];
  const at: V3 = [KID[0] - dir[0] * 2.5, 3.45, KID[2] - dir[2] * 2.5];
  const cam = move({ position: at, target: [SL_K[0], 3.3, SL_K[2]] }, { position: [at[0] + dir[0] * 0.35, 3.42, at[2] + dir[2] * 0.35], target: [SL_K[0], 3.32, SL_K[2]] }, c);
  const swap = clamp01((c.lt - 0.25) / 0.7);
  const sp = mergePose(REST, { headPitch: -0.4, expression: swap > 0.55 ? "worried" : "smile", talk: talkIf(c.lt, 0.05, 1.2, 18) });
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      shadowSize={12}
      light={0.65}
      overlay={<TruthBubble at={up(headPosition(sp, SL_K, SL_K_YAW), 0.8)} cam={cam} width={c.width} height={c.height} lie="I LOVE IT!" truth={"IT'S…\nNOT GOOD."} swap={swap} appear={k01(c.lt, 0.02, 0.18)} offset={[0, -110]} />}
    >
      <Apartment warm snow t={c.t} table={false} />
      <Hero pose={sp} position={SL_K} yaw={SL_K_YAW} />
      <pointLight position={[SL_K[0] - dir[0] * 1.6, 4.2, SL_K[2] - dir[2] * 1.6]} color="#FFD8A8" intensity={10} distance={6} decay={2} />
    </Shot>
  );
};
const c5Sad: ShotFn = (c) => {
  const dir: V3 = [Math.sin(SL_K_YAW), 0, Math.cos(SL_K_YAW)];
  const at: V3 = [SL_K[0] - dir[0] * 1.0 - dir[2] * 1.2, 4.2, SL_K[2] - dir[2] * 1.0 + dir[0] * 1.2];
  const cam = move({ position: at, target: [KID[0], 2.0, KID[2]] }, { position: [at[0] + dir[0] * 0.5, 4.1, at[2] + dir[2] * 0.5], target: [KID[0], 2.0, KID[2]] }, c);
  const kp = mergePose(kidPose("worried", 1 - k01(c.lt, 0.1, 0.8)), { headPitch: 0.3 - k01(c.lt, 0.2, 1.0) * 0.55 });
  return (
    <Shot mood="night" camera={cam} fog={false} shadowSize={12} light={0.65}>
      <Apartment warm snow t={c.t} table={false} />
      <Hero pose={kp} position={KID} yaw={KID_YAW} scale={KID_S} look={crowdLook(170)} />
      <KidDrawing pose={kp} />
    </Shot>
  );
};
/** It goes on the fridge anyway: the two of them, smiling at it. */
const c5Fridge: ShotFn = (c) => {
  const cam = move({ position: [7.6, 4.9, 8.8], target: [7.6, 2.9, -3.5] }, { position: [7.6, 4.8, 7.6], target: [7.6, 2.95, -3.5] }, c);
  const kidAt: V3 = [9.0, 0, -2.5];
  const slAt: V3 = [6.1, 0, -2.7];
  return (
    <Shot mood="night" camera={cam} fog={false} shadowSize={14} light={0.7}>
      <Apartment warm snow t={c.t} table={false} art />
      <Hero pose={mergePose(REST, { expression: "smile", headPitch: 0.35, headYaw: -0.1 })} position={kidAt} yaw={-1.3} scale={KID_S} look={crowdLook(170)} />
      <Hero pose={mergePose(REST, { expression: "relief", headPitch: -0.25, headYaw: 0.1 })} position={slAt} yaw={1.15} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 06 the truth (dawn)

const DAWN_SUN: V3 = [-60, 26, -520];
const c6Aerial: ShotFn = (c) => {
  const cam = move({ position: [30, 42, 70], target: [0, 4, -40] }, { position: [27, 40, 62], target: [0, 4, -40] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[80, 420]} shadowSize={70} light={0.85}>
      <CityGrid seed="dawn" blocks={7} />
      <Ground color="#3A3F55" />
      <Sky t={c.t} tint="dawn" seed="dsky" radius={260} y={55} />
      <Sun position={DAWN_SUN} size={16} />
    </Shot>
  );
};
const c6Street: ShotFn = (c) => {
  const cam = move({ position: [9.5, 4.6, 16], target: [17, 3.2, -26] }, { position: [9.7, 4.5, 14], target: [17, 3.25, -26] }, c);
  const people = [
    { x: 14.2, z: -4, dir: 1, seed: 180 },
    { x: 18.4, z: -12, dir: -1, seed: 181 },
    { x: 15.0, z: -22, dir: 1, seed: 182 },
    { x: 19.0, z: -30, dir: -1, seed: 183 },
    { x: 14.0, z: -40, dir: 1, seed: 184 },
  ];
  return (
    <Shot mood="dawn" camera={cam} fog={[40, 300]} shadowSize={40} light={0.8}>
      <BigStreet seed="dawnst" day lamps={false} />
      <Sky t={c.t} tint="dawn" seed="dst" y={55} />
      <Sun position={[0, 22, -520]} size={14} />
      {people.map(({ x, z, dir, seed }, i) => (
        <Hero key={i} pose={mergePose(walkPose(c.lt * 1.1 + i * 0.3, 0.8), { expression: i % 2 ? "neutral" : "relief" })} position={[x, PAVE, z + dir * c.lt * 1.6]} yaw={dir > 0 ? 0 : Math.PI} look={crowdLook(seed)} />
      ))}
    </Shot>
  );
};

/** The rooftop: the city far below, the sun coming up ahead. */
const ROOF_SL: V3 = [0, 0, 4.4];
const RoofSet: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Rooftop />
    <group position={[0, -60, 170]} scale={3.5}>
      <CityGrid seed="roofcity" blocks={7} />
    </group>
    <Sky t={t} tint="dawn" seed="roof" y={30} radius={300} />
    <Sun position={[-40, 18, 520]} size={18} />
  </>
);
const c6Roof: ShotFn = (c) => {
  const cam = move({ position: [-0.8, 6.4, -8.5], target: [0, 1.6, 30] }, { position: [-0.6, 6.2, -7.2], target: [0, 1.6, 30] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 600]} shadowSize={20} light={0.8} keyDir={[-0.3, 0.4, 1]}>
      <RoofSet t={c.t} />
      <Hero pose={mergePose(REST, { headPitch: 0.05 })} position={ROOF_SL} />
    </Shot>
  );
};
const c6Profile: ShotFn = (c) => {
  const cam = move({ position: [6.4, 4.5, 11.0], target: [0, 4.0, 4.4] }, { position: [5.8, 4.45, 10.2], target: [0, 4.02, 4.4] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 600]} shadowSize={10} light={0.8} keyDir={[-0.3, 0.4, 1]}>
      <RoofSet t={c.t} />
      <Hero pose={mergePose(REST, { headPitch: 0.08, expression: "neutral", blink: c.lt > 0.8 && c.lt < 0.92 ? 1 : 0 })} position={ROOF_SL} />
    </Shot>
  );
};
const c6Ask: ShotFn = (c) => {
  const cam = move({ position: [0.5, 4.0, 11.4], target: [0, 3.75, 4.4] }, { position: [0.45, 3.98, 10.4], target: [0, 3.77, 4.4] }, c);
  const turn = k01(c.lt, 0.1, 0.6);
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 600]} shadowSize={10} light={0.8} keyDir={[-0.3, 0.4, 1]}>
      <RoofSet t={c.t} />
      <Hero pose={mergePose(REST, { headYaw: 0.7 * (1 - turn), headPitch: 0.1 * (1 - turn), expression: turn > 0.6 ? "awe" : "neutral" })} position={ROOF_SL} />
    </Shot>
  );
};

/** For the thumbnail: the couch confession. */
export const thumbShot: ShotFn = (c) => c2Couch({ ...c, lt: 0.6 });

// ---------------------------------------------------------------- the cue list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldMotel },
    { cue: "every fake", fn: coldHug },
    { cue: "every government", fn: coldCapitol },
    { cue: "exposed", fn: coldCity },
    { cue: "because humanity", fn: coldPulse },
    { cue: "the ability", fn: coldMondays },
  ],
  c1: [
    { cue: null, fn: c1Walk },
    { cue: "No more scams", fn: c1Scam },
    { cue: "false promises", fn: c1Promise },
    { cue: "manipulation", fn: c1Salesman },
  ],
  c2: [
    { cue: null, fn: c2Block },
    { cue: "falling apart", fn: c2Couch },
    { cue: "Your friends", fn: c2Dinner },
    { cue: "Employees", fn: c2Counter },
    { cue: "enjoy their", fn: c2Worker },
    { cue: "and politicians", fn: c2Podium },
    { cue: "they couldn't", fn: c2Sweat },
  ],
  c3: [
    { cue: null, fn: c3Interro },
    { cue: "much easier", fn: c3Confess },
    { cue: "Businesses", fn: c3Ad },
    { cue: "misleading", fn: c3AdTruth },
    { cue: "Even something", fn: c3Haircut },
    { cue: "could become impossible", fn: c3Strain },
  ],
  c4: [
    { cue: null, fn: c4Snow },
    { cue: "rather than", fn: c4Faces },
    { cue: "Because being", fn: c4Hush },
    { cue: "doesn't mean", fn: c4Cafe },
  ],
  c5: [
    { cue: null, fn: c5Walk },
    { cue: "something disturbing", fn: c5Face },
    { cue: "Not every", fn: c5Drawing },
    { cue: "hurt someone", fn: c5Honest },
    { cue: "Sometimes", fn: c5Sad },
    { cue: "people we love", fn: c5Fridge },
  ],
  c6: [
    { cue: null, fn: c6Aerial },
    { cue: "wouldn't be", fn: c6Street },
    { cue: "Maybe it would", fn: c6Roof },
    { cue: "handle the truth", fn: c6Profile },
    { cue: "Would you", fn: c6Ask },
  ],
};

