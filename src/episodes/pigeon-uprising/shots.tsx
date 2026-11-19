/**
 * Shots for "What If Every Pigeon Got an IQ of 200?" (ep. 8).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * The hook opens on a park clock hitting 9:00, then pigeons at Slavoski's feet freezing mid-peck.
 * Time and weather arc: sunny morning park → bright midday plaza → sunset gridlock → overcast day two →
 * storm on day three → drizzly grey London on day five → golden dawn at the bakery on day seven.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Building, BUILDING_COLORS, Car, CityGrid, Ground, Plane, StreetSet } from "../../slavoski/city";
import { Bird } from "../../slavoski/critters";
import { BoxG } from "../../slavoski/detail";
import { crowdLook, POLICE_OFFICER, suitLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Clouds, LeafyTree, LightningBolt, Rain } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { handPosition, headPosition, Hero, mergePose, reach, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { sittingPose } from "../../slavoski/room";
import { CanvasPanel } from "../../slavoski/screens";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import { wordAt, type CuedShot } from "../../slavoski/timeline";
import { Bubble, Capitol, Chair, WhiteFlag } from "../smart-animals/props";
import { Suitcase } from "../no-work-2036/props";
import { BOARD, CITY, drawDepartures, Phone3D, PHONE, Terminal } from "../ww3-countdown/props";
import {
  Airport,
  ArmyTruck,
  Bakery,
  BakeryShelves,
  Baguette,
  BaseGate,
  Beam,
  beakTip,
  Bench,
  birdHeadAt,
  BREAD,
  CELL,
  cellKey,
  cellPos,
  CLOCK_Y,
  coatFor,
  columnFlight,
  Crumbs,
  Cup,
  FlatPhone,
  Headset,
  Junction,
  LandingGear,
  Loaf,
  messageCells,
  onSquare,
  paleCoatFor,
  Park,
  ParkClock,
  PigeonFlock,
  type PigeonState,
  PLANE_AT,
  RAIL_TOP,
  Railing,
  ramp,
  Roll,
  Rooftop,
  screenColor,
  SEAT_TOP,
  SHELF_Y,
  Signal,
  SIGNAL,
  type SignalState,
  standing,
  SummitTable,
  TABLE_TOP,
  TrafalgarSquare,
  Umbrella,
} from "./props";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
const W = (c: ShotCtx, phrase: string, from: number, fallback: number) => wordAt(c.words, phrase, from, fallback);

/** Kit street ×3.5 so it matches Slavoski (road |x| < 12.25, pavements to 21.35). `day` dims practicals. */
const BigStreet: React.FC<React.ComponentProps<typeof StreetSet> & { day?: boolean }> = ({ day = false, ...props }) => (
  <group scale={CITY}>
    <StreetSet {...props} lampsOn={day ? false : props.lampsOn} modify={day ? (sp, i) => ({ power: 0.35, ...(props.modify?.(sp, i) ?? {}) }) : props.modify} />
  </group>
);

const Shot: React.FC<{ children: React.ReactNode; overlay?: React.ReactNode } & React.ComponentProps<typeof Stage>> = ({ children, overlay, ...stage }) => (
  <AbsoluteFill>
    <Stage {...stage}>{children}</Stage>
    {overlay}
  </AbsoluteFill>
);

const CLOUD = { day: "#F4F6FA", dawn: "#F2C9A8", sunset: "#F7C0A0", storm: "#3E4656", overcast: "#AEB6C2" } as const;
const Sky: React.FC<{ t: number; tint: keyof typeof CLOUD; y?: number; radius?: number; count?: number; seed?: string }> = ({ t, tint, y = 45, radius = 200, count = 16, seed = "sky" }) => (
  <Clouds t={t} color={CLOUD[tint]} y={y} radius={radius} count={count} seed={seed} />
);

/** A white flash overlay (lightning). */
const Flash: React.FC<{ k: number }> = ({ k }) => (k > 0 ? <AbsoluteFill style={{ background: `rgba(235,242,255,${clamp01(k) * 0.55})` }} /> : null);

/** Yaw that faces from `from` toward `to` (0 faces +Z). */
const yawTo = (from: V3, to: V3) => Math.atan2(to[0] - from[0], to[2] - from[2]);
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
/** Head yaw so a pigeon with body `yaw` at `p` looks at `target` (clamped to a natural turn). */
const lookYaw = (p: V3, yaw: number, target: V3, max = 1.5) => Math.max(-max, Math.min(max, wrap(yawTo(p, target) - yaw)));

const SUN_MORNING: V3 = [0.75, 0.55, 0.55];

// ---------------------------------------------------------------- cold open: 9 AM in the park

/** Slavoski's bench: his root (hips) here, facing +Z toward the path; pigeons peck on the path in front. */
const BENCH_AT: V3 = [0, 0, -4.6];
const CLOCK_AT: V3 = [-7.5, 0, -9];

/** Seated, tossing crumbs with the right hand (phase in cycles). */
const tossPose = (phase: number, over: Partial<Pose> = {}) => {
  const s = Math.sin(phase * Math.PI * 2);
  return sittingPose({ rShoulder: [0.75 + 0.35 * s, -0.1], rElbow: 0.7 - 0.3 * s, lShoulder: [0.45, -0.2], lElbow: 1.2, ...over });
};

/** The park pigeons at the bench (path in front of it), with the hero pigeon in front. */
const PARK_FLOCK: { p: V3; yaw: number; s: number; seed: string }[] = [
  { p: [-1.3, 0, -1.6], yaw: 0.5, s: 1.0, seed: "a" },
  { p: [1.5, 0, -1.9], yaw: -0.7, s: 1.05, seed: "b" },
  { p: [-0.4, 0, -2.4], yaw: 2.6, s: 0.95, seed: "c" },
  { p: [0.7, 0, -0.6], yaw: -2.4, s: 1.0, seed: "d" },
  { p: [-2.2, 0, -0.2], yaw: 1.2, s: 1.0, seed: "e" },
  { p: [2.4, 0, -0.1], yaw: -1.6, s: 1.0, seed: "f" },
  { p: [-0.9, 0, 0.6], yaw: 0.2, s: 1.1, seed: "g" },
  { p: [1.9, 0, 1.4], yaw: -0.4, s: 1.0, seed: "h" },
  { p: [-2.6, 0, 1.8], yaw: 0.9, s: 1.0, seed: "i" },
];
const HERO_P: V3 = [0.3, 0, 1.0];
const HERO_P_YAW = 2.75;
const HERO_P_SCALE = 1.2;

/** Pecking until `tFreeze`, then everyone stops dead and looks up at Slavoski (head toward his face). */
const parkFlock = (t: number, tFreeze: number, stare: number): PigeonState[] => {
  const face: V3 = [BENCH_AT[0], 2.8, BENCH_AT[2]];
  return PARK_FLOCK.map((b) => {
    const frozen = clamp01((t - tFreeze) / 0.12);
    const peckLive = 0.5 + 0.5 * Math.sin(t * 9 + random(b.seed) * 6);
    return {
      p: b.p,
      yaw: b.yaw,
      s: b.s,
      peck: peckLive * (1 - frozen),
      headYaw: lookYaw(b.p, b.yaw, face) * frozen * stare,
      headPitch: 0.35 * frozen,
      eyeOpen: 1 + 0.25 * frozen,
      coat: coatFor(`park${b.seed}`),
    };
  });
};

const parkStage = { mood: "day" as const, fog: [60, 320] as [number, number], keyDir: SUN_MORNING, shadowSize: 14 };

/** 0 s: the park clock. The minute hand clunks onto 9:00. */
const coldClock: ShotFn = (c) => {
  const face: V3 = [CLOCK_AT[0], CLOCK_Y, CLOCK_AT[2] + 0.22];
  const cam = move({ position: [face[0] + 0.7, face[1] - 0.5, face[2] + 6.8], target: [face[0], face[1] - 0.25, face[2]] }, { position: [face[0] + 0.5, face[1] - 0.4, face[2] + 5.6], target: [face[0], face[1] - 0.2, face[2]] }, c);
  const jump = c.lt < 0.72 ? 0 : 1 + Math.sin((c.lt - 0.72) * 30) * 0.12 * Math.exp(-(c.lt - 0.72) * 9);
  return (
    <Shot {...parkStage} camera={cam} shake={c.lt > 0.72 && c.lt < 0.85 ? 0.012 : 0}>
      <Park seed="hook" />
      <Sky t={c.t} tint="day" seed="hook" />
      <ParkClock position={CLOCK_AT} hours={8 + (59 + jump) / 60} />
    </Shot>
  );
};

/** Crumbs falling from his hand into the flock (a few in flight at any time, until `stop`). */
const FallingCrumbs: React.FC<{ t: number; from: V3; stop: number }> = ({ t, from, stop }) =>
  t > stop + 0.8 ? null : (
    <group>
      {Array.from({ length: 6 }, (_, i) => {
        const period = 0.8;
        const t0 = Math.floor((t - i * 0.13) / period) * period + i * 0.13;
        if (t0 > stop) return null;
        const k = (t - t0) / period;
        if (k < 0 || k > 1) return null;
        const land: V3 = [(random(`fc${i}${t0}`) - 0.5) * 3.4, 0, -1.6 + random(`fz${i}${t0}`) * 2.6];
        const x = from[0] + (land[0] - from[0]) * k;
        const z = from[2] + (land[2] - from[2]) * k;
        const y = Math.max(0.03, from[1] + (land[1] - from[1]) * k + 1.2 * k * (1 - k) * 2 - 0.0);
        return (
          <mesh key={i} position={[x, y, z]} rotation={[t * 7 + i, t * 5, 0]}>
            <icosahedronGeometry args={[0.05, 0]} />
            <Flat color={i % 2 ? BREAD.crumb : BREAD.crust} />
          </mesh>
        );
      })}
    </group>
  );

/** 1 s: pigeons pecking crumbs at his feet… on "suddenly" every one of them freezes and looks up. */
const coldPeck: ShotFn = (c) => {
  const tS = W(c, "suddenly", 0, 3.1);
  const cam = move({ position: [2.0, 2.5, 5.6], target: [0.1, -0.1, -1.2] }, { position: [1.8, 2.3, 4.9], target: [0.15, -0.05, -1.1] }, c);
  const pose = tossPose(c.t * 0.9, { expression: "smile" });
  const hand = handPosition(pose, "r", BENCH_AT);
  const frozen = clamp01((c.t - tS) / 0.12);
  const hero: PigeonState = { p: HERO_P, yaw: HERO_P_YAW, s: HERO_P_SCALE };
  const peck = (0.5 + 0.5 * Math.sin(c.t * 8)) * (1 - frozen);
  return (
    <Shot {...parkStage} camera={cam} shadowSize={8}>
      <Park seed="hook" />
      <Sky t={c.t} tint="day" seed="hook" />
      <Bench position={BENCH_AT} />
      <Hero pose={pose} position={BENCH_AT} />
      <Crumbs position={[0, 0, -0.7]} radius={2.2} count={40} seed="cp" eaten={0.3} />
      <FallingCrumbs t={c.t} from={hand} stop={1e9} />
      <PigeonFlock birds={parkFlock(c.t, tS, 0)} />
      <Bird
        kind="pigeon"
        position={hero.p}
        yaw={hero.yaw}
        scale={HERO_P_SCALE}
        peck={peck}
        headPitch={0.45 * frozen}
        face={{ eyeOpen: 1 + 0.35 * frozen, look: [0, 0.2 * frozen] }}
      />
    </Shot>
  );
};

/** 3.9 s, "IQ of 200": extreme close-up. The eyes narrow, a brow lifts: something switched on. */
const coldIQ: ShotFn = (c) => {
  const head = birdHeadAt({ p: HERO_P, yaw: HERO_P_YAW, s: HERO_P_SCALE, headPitch: 0.45 });
  const dir: V3 = [Math.sin(HERO_P_YAW), 0, Math.cos(HERO_P_YAW)];
  const at = (d: number, up: number): V3 => [head[0] + dir[0] * d + 0.25, head[1] + up, head[2] + dir[2] * d];
  const cam = move({ position: at(2.3, 0.05), target: [head[0], head[1] - 0.05, head[2]] }, { position: at(1.7, 0.02), target: [head[0], head[1] - 0.03, head[2]] }, c);
  const smart = k01(c.lt, 0.35, 0.7);
  const ping = clamp01(1 - Math.abs(c.lt - 0.45) / 0.3);
  return (
    <Shot {...parkStage} camera={cam} shadowSize={6}>
      <Park seed="hook" />
      <Sky t={c.t} tint="day" seed="hook" />
      <Bench position={BENCH_AT} />
      <Hero pose={tossPose(0.25, { expression: "smile" })} position={BENCH_AT} />
      <Crumbs position={[0, 0, -0.7]} radius={2.2} count={40} seed="cp" eaten={0.3} />
      <Bird
        kind="pigeon"
        position={HERO_P}
        yaw={HERO_P_YAW}
        scale={HERO_P_SCALE}
        headPitch={0.45 - 0.2 * smart}
        headYaw={0.15 * smart}
        face={{ eyeOpen: 1.35 - 0.75 * smart, brow: smart > 0.5 ? "smug" : "none", look: [0.15 * smart, 0.2 - 0.2 * smart] }}
      />
      {ping > 0 ? (
        <group position={head}>
          <Halo size={1.6 + ping * 1.4} color={P.amber} opacity={0.55 * ping} />
          <mesh rotation={[0, HERO_P_YAW, 0]}>
            <torusGeometry args={[0.35 + (1 - ping) * 0.5, 0.012, 4, 32]} />
            <meshBasicMaterial color={P.amber} transparent opacity={ping} toneMapped={false} depthWrite={false} />
          </mesh>
        </group>
      ) : null}
    </Shot>
  );
};

/** 5.2 s, "At first, nobody notices": Slavoski happily tossing crumbs; every pigeon is staring at him. */
const coldNobody: ShotFn = (c) => {
  const cam = move({ position: [5.2, 2.6, 13.5], target: [0.2, 1.9, -2.6] }, { position: [4.4, 2.5, 11.8], target: [0.2, 1.95, -2.6] }, c);
  const pose = tossPose(c.t * 0.9, { expression: "smile", headPitch: -0.15, blink: c.lt > 0.9 && c.lt < 1.05 ? 1 : 0 });
  const hand = handPosition(pose, "r", BENCH_AT);
  return (
    <Shot {...parkStage} camera={cam}>
      <Park seed="hook" />
      <Sky t={c.t} tint="day" seed="hook" />
      <ParkClock position={CLOCK_AT} hours={9 + c.t / 3600} />
      <Bench position={BENCH_AT} />
      <Hero pose={pose} position={BENCH_AT} />
      <Crumbs position={[0, 0, -0.7]} radius={2.4} count={50} seed="cn" eaten={0} />
      <FallingCrumbs t={c.t} from={hand} stop={1e9} />
      <PigeonFlock birds={[...parkFlock(c.t, -10, 1), { p: HERO_P, yaw: HERO_P_YAW, s: HERO_P_SCALE, headPitch: 0.35, headYaw: lookYaw(HERO_P, HERO_P_YAW, [0, 2.8, BENCH_AT[2]]), eyeOpen: 0.7, brow: 0.12 }]} />
      {/* a jogger on the back path, oblivious too */}
      <Hero pose={walkPose(c.t * 1.6, 1.0)} position={[-12 + c.lt * 5, 0, -16]} yaw={Math.PI / 2} look={crowdLook(3)} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 the stare (midday)

const NOON_SUN: V3 = [0.35, 1, 0.4];
const noonStage = { mood: "day" as const, fog: [60, 340] as [number, number], keyDir: NOON_SUN, shadowSize: 16 };

/** "Three hours later": he throws a whole roll. The pigeons ignore it; one nudges it away. */
const TOSS_HERO: V3 = [-1.4, 0, -5.5];
const NUDGER: PigeonState = { p: [0.9, 0, 0.6], yaw: -2.5, s: 1.15 };
const c1Ignore: ShotFn = (c) => {
  const cam = move({ position: [2.6, 1.15, 6.6], target: [-0.3, 1.5, -2.5] }, { position: [2.3, 1.1, 5.8], target: [-0.3, 1.55, -2.5] }, c);
  const throwK = k01(c.lt, 0.0, 0.35);
  const pose = mergePose(REST, {
    rShoulder: [0.2 + 1.5 * throwK - 0.6 * k01(c.lt, 0.4, 0.8), 0.15],
    rElbow: 0.3,
    expression: c.lt > 1.9 ? "worried" : "smile",
    headPitch: -0.25,
    headYaw: -0.15,
  });
  // Where the nudging beak meets the roll: the roll lands there, then slides away from the beak.
  const nudge = ramp(c.lt, 1.45, 1.75);
  const pushed: PigeonState = { ...NUDGER, peck: 0.75 * clamp01(Math.sin(clamp01((c.lt - 1.3) / 0.6) * Math.PI)) };
  const beak = beakTip({ ...NUDGER, peck: 0.75 });
  const dir: V3 = [Math.sin(NUDGER.yaw), 0, Math.cos(NUDGER.yaw)];
  const rest: V3 = [beak[0] + dir[0] * 0.2, 0, beak[2] + dir[2] * 0.2];
  const start = handPosition(mergePose(REST, { rShoulder: [1.7, 0.15], rElbow: 0.3 }), "r", TOSS_HERO);
  const fly = clamp01((c.lt - 0.3) / 0.45);
  const rollPos: V3 =
    c.lt < 0.3
      ? [handPosition(pose, "r", TOSS_HERO)[0], handPosition(pose, "r", TOSS_HERO)[1] - 0.2, handPosition(pose, "r", TOSS_HERO)[2] + 0.25]
      : fly < 1
        ? [start[0] + (rest[0] - start[0]) * fly, Math.max(0, start[1] * (1 - fly) + 2.0 * fly * (1 - fly)), start[2] + (rest[2] - start[2]) * fly]
        : [rest[0] + dir[0] * 0.55 * nudge, 0, rest[2] + dir[2] * 0.55 * nudge];
  const others: PigeonState[] = ([
    { p: [-1.6, 0, -0.4], yaw: 0.9, s: 1.0 },
    { p: [2.4, 0, -1.6], yaw: -1.9, s: 1.0 },
    { p: [-0.3, 0, -1.9], yaw: 0.2, s: 1.05 },
    { p: [-2.3, 0, 1.6], yaw: 1.4, s: 1.0 },
  ] as PigeonState[]).map((b, i) => ({ ...b, headYaw: lookYaw(b.p, b.yaw, [TOSS_HERO[0], 3.6, TOSS_HERO[2]]), headPitch: 0.3, coat: coatFor(`ig${i}`), eyeOpen: 1.1 }));
  return (
    <Shot {...noonStage} camera={cam}>
      <Park seed="noon" />
      <Sky t={c.t} tint="day" seed="noon" />
      <Hero pose={pose} position={TOSS_HERO} yaw={0.25} />
      <Roll position={rollPos} scale={1.3} rotation={[0, c.lt * 2, nudge * 2.4]} />
      <PigeonFlock birds={[...others, { ...pushed, coat: coatFor("nudge"), headYaw: 0, eyeOpen: 0.75, brow: 0.12 }]} />
    </Shot>
  );
};

/** "They start watching humans": pigeons on a railing turn their heads as one to follow him. */
const RAIL_Z = 3.2;
const c1Watch: ShotFn = (c) => {
  const cam = move({ position: [10.5, 4.2, 12.5], target: [-0.5, 2.2, 0] }, { position: [9.6, 4.0, 11.4], target: [0.2, 2.2, 0] }, c);
  const heroX = -6 + c.lt * 2.9;
  const hero: V3 = [heroX, 0, 0];
  const glance = k01(c.lt, 0.95, 1.2);
  const pose = mergePose(walkPose(c.lt * 1.4, 0.9), { rShoulder: [0.55, 0.12], rElbow: 1.35, headYaw: 1.1 * glance, expression: glance > 0.4 ? "worried" : "neutral" });
  const hand = handPosition(pose, "r", hero, Math.PI / 2);
  const face: V3 = [heroX, 3.5, 0];
  const birds: PigeonState[] = Array.from({ length: 9 }, (_, i) => {
    const p: V3 = [1.2 + i * 0.95, RAIL_TOP, RAIL_Z];
    const yaw = Math.PI + (random(`rw${i}`) - 0.5) * 0.3;
    const lag = clamp01((c.lt - 0.15 - i * 0.015) / 0.2);
    return { p, yaw, s: 0.95, headYaw: lookYaw(p, yaw, face, 1.7) * lag + (1 - lag) * (random(`rh${i}`) - 0.5), headPitch: 0.15, eyeOpen: 1.15, coat: coatFor(`rail${i}`) };
  });
  return (
    <Shot {...noonStage} camera={cam}>
      <Park seed="watch" />
      <Sky t={c.t} tint="day" seed="watch" />
      <Railing x0={-14} x1={14} z={RAIL_Z} />
      <Hero pose={pose} position={hero} yaw={Math.PI / 2} />
      {/* cup beside the fist (fist radius 0.22 + cup radius 0.12, toward his front) */}
      <Cup position={[hand[0] + 0.34, hand[1] - 0.2, hand[2]]} />
      <PigeonFlock birds={birds} />
    </Shot>
  );
};

/** Government plaza: a capitol, and thousands of pigeons on the square facing it. */
const CAP_AT: V3 = [0, 0, -30];
const CAP_SCALE = 3;
const PLAZA_FLOCK = (() => {
  const out: PigeonState[] = [];
  for (let i = -30; i <= 30; i++)
    for (let j = -6; j <= 30; j++) {
      const k = `pl${i},${j}`;
      if (random(k) > 0.78) continue;
      out.push(standing(i, j, Math.PI, "pl", { headPitch: 0.3, eyeOpen: 1.15 }));
    }
  return out;
})();
const Plaza: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <Ground color="#B8B0A0" />
    <mesh position={[0, 0.01, 8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[76, 70]} />
      <Flat color="#C9C2B4" />
    </mesh>
    <Capitol position={CAP_AT} scale={CAP_SCALE} />
    {[-1, 1].map((side) =>
      Array.from({ length: 5 }, (_, i) => <LeafyTree key={`${side}${i}`} position={[side * 42, 0, -10 + i * 12]} scale={3.2} seed={`pz${side}${i}`} />),
    )}
    {Array.from({ length: 10 }, (_, i) => (
      <Building key={i} position={[-135 + i * 30, 0, -95 - (i % 2) * 12]} w={24} d={18} h={24 + random(`cb${i}`) * 34} color={BUILDING_COLORS[i % 5]} seed={`cb${i}`} power={0.3} />
    ))}
    {[-1, 1].map((side) =>
      Array.from({ length: 4 }, (_, i) => (
        <Building key={`s${side}${i}`} position={[side * 78, 0, -50 + i * 30]} w={22} d={22} h={20 + random(`cs${side}${i}`) * 20} color={BUILDING_COLORS[(i + 2) % 5]} seed={`cs${side}${i}`} power={0.3} />
      )),
    )}
    <Sky t={t} tint="day" seed="plaza" radius={240} />
  </group>
);

const c1Plaza: ShotFn = (c) => {
  const cam = move({ position: [24, 34, 72], target: [0, 5, -6] }, { position: [20, 31, 62], target: [0, 5.5, -8] }, c);
  return (
    <Shot {...noonStage} camera={cam} fog={[90, 420]} shadowSize={60}>
      <Plaza t={c.t} />
      <PigeonFlock birds={PLAZA_FLOCK} eyes={false} />
      {[-8, 8].map((x, i) => (
        <Hero key={x} pose={mergePose(REST, { headPitch: 0.1, expression: "worried", headYaw: i ? -0.4 : 0.4 })} position={[x, 0, -12.2]} look={POLICE_OFFICER} />
      ))}
    </Shot>
  );
};

/** "Not moving. Just staring.": low in front of the crowd, push into the front row… they blink as one. */
const c1Stare: ShotFn = (c) => {
  const cam = move({ position: [1.4, 1.5, -13.8], target: [0.2, 1.0, 6] }, { position: [0.6, 1.05, -10.6], target: [0.3, 0.85, 4] }, { ...c, dur: 1.6 });
  const blink = clamp01(1 - Math.abs(c.lt - 1.3) / 0.09);
  const near = PLAZA_FLOCK.filter((b) => b.p[2] < 6).map((b) => ({ ...b, blink }));
  const far = PLAZA_FLOCK.filter((b) => b.p[2] >= 6);
  return (
    <Shot {...noonStage} camera={cam} fog={[30, 260]} shadowSize={20}>
      <Plaza t={c.t} />
      <PigeonFlock birds={near} />
      <PigeonFlock birds={far} eyes={false} />
      <Hero pose={mergePose(REST, { expression: "worried", headYaw: 0.5, headPitch: -0.3 })} position={[-3.6, 0, -11.6]} yaw={0.2} look={POLICE_OFFICER} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 gridlock (sunset)

const SUNSET_KEY: V3 = [0.8, 0.3, -0.5];
const sunsetStage = { mood: "sunset" as const, keyDir: SUNSET_KEY, light: 0.95 };

/** "By 6 PM": a pigeon hovers at the crossing button, pecks it, and the light goes red. */
const SIG_AT: V3 = [15, 0.42, 0];
/** The button pigeon: hovering with its beak on the button (jab 0..1 pushes it in). */
const buttonBird = (t: number, lt: number, jab: number): PigeonState => {
  const button: V3 = [SIG_AT[0], SIG_AT[1] + SIGNAL.buttonY - 0.12, SIG_AT[2] + 0.32 + 0.17];
  const base: PigeonState = { p: [0, 0, 0], yaw: Math.PI - 0.5, s: 1.1, headPitch: -0.2, flap: 1, flapT: t, fly: 1, coat: coatFor("btn"), eyeOpen: 0.8, brow: 0.3 };
  const tip = beakTip(base);
  const arrive = k01(lt, 0, 0.45);
  const hover: V3 = [button[0] - tip[0], button[1] - tip[1] + Math.sin(t * 9) * 0.03, button[2] - tip[2] + 0.12 - 0.12 * jab];
  return { ...base, p: [hover[0] + (1 - arrive) * 3.5, hover[1] + (1 - arrive) * 1.8, hover[2] + (1 - arrive) * 1.5] };
};
const SixStreet: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <BigStreet seed="six" lampsOn />
    <Sky t={t} tint="sunset" seed="six" />
  </group>
);
/** "By 6 PM": a pigeon hovers at the crossing button and pecks it, twice. */
const c2Button: ShotFn = (c) => {
  const cam = move({ position: [18.4, 4.4, 5.6], target: [15.2, 3.6, 0.4] }, { position: [17.8, 4.2, 4.8], target: [15.2, 3.6, 0.4] }, c);
  const jab = Math.max(...[0.6, 1.25].map((p) => clamp01(1 - Math.abs(c.lt - p) / 0.12)));
  return (
    <Shot {...sunsetStage} camera={cam} fog={[40, 300]} shadowSize={12}>
      <SixStreet t={c.t} />
      <Signal position={SIG_AT} yaw={0} state="green" pressed={jab > 0.3 || c.lt > 0.6} />
      <PigeonFlock birds={[buttonBird(c.t, c.lt, jab)]} />
    </Shot>
  );
};
/** "…traffic lights": looking up, the signal flips amber → red; two more pigeons perch on the signal head. */
const c2Red: ShotFn = (c) => {
  const cam = move({ position: [19.5, 3.0, 8.5], target: [15, 8.2, 0] }, { position: [19.0, 3.0, 7.6], target: [15, 8.4, 0] }, c);
  const state: SignalState = c.lt < 0.2 ? "green" : c.lt < 0.5 ? "amber" : "red";
  const top = SIG_AT[1] + SIGNAL.headY + 1.5;
  return (
    <Shot {...sunsetStage} camera={cam} fog={[40, 300]} shadowSize={14}>
      <SixStreet t={c.t} />
      <Signal position={SIG_AT} yaw={0} state={state} pressed />
      <PigeonFlock
        birds={[
          buttonBird(c.t, 2, 0),
          { p: [SIG_AT[0] - 0.3, top, SIG_AT[2] + 0.4], yaw: 0.6, s: 1.0, coat: coatFor("hd1"), headYaw: -0.4, brow: 0.12 },
          { p: [SIG_AT[0] + 0.35, top, SIG_AT[2] + 0.3], yaw: -0.3, s: 1.0, coat: coatFor("hd2"), headPitch: -0.3 },
        ]}
      />
    </Shot>
  );
};

/** Junction blockade: four tight blocks of pigeons hold the crossings; every signal red; traffic stuck. */
const JN_FLOCK = (() => {
  const out: PigeonState[] = [];
  const block = (i0: number, i1: number, j0: number, j1: number, yaw: number, tag: string) => {
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) out.push(standing(i, j, yaw, tag, { headPitch: 0.1, brow: 0.42, eyeOpen: 0.9 }));
  };
  block(-10, 10, -14, -9, Math.PI, "jn"); // north crossing, facing north
  block(-10, 10, 9, 14, 0, "js"); // south
  block(13, 20, -6, 6, Math.PI / 2, "je"); // east
  block(-20, -13, -6, 6, -Math.PI / 2, "jw"); // west
  return out;
})();
const JN_CARS: { x: number; z: number; yaw: number; color: string }[] = [];
(["n", "s", "e", "w"] as const).forEach((arm) => {
  for (let k = 0; k < 6; k++) {
    const d = 9 + k * 4.0;
    const lane = 1.7;
    const color = [P.carRed, P.carTeal, "#E8E4DA", "#5A4A78", "#2B2F3E", "#D8B040"][(k + arm.charCodeAt(0)) % 6];
    if (arm === "n") JN_CARS.push({ x: -lane, z: -d, yaw: 0, color });
    if (arm === "s") JN_CARS.push({ x: lane, z: d, yaw: Math.PI, color });
    if (arm === "e") JN_CARS.push({ x: d, z: -lane, yaw: -Math.PI / 2, color });
    if (arm === "w") JN_CARS.push({ x: -d, z: lane, yaw: Math.PI / 2, color });
  }
});
const c2Junction: ShotFn = (c) => {
  // along the south arm's road corridor, so no building ever sits between the camera and the junction
  const cam = move({ position: [3, 66, 92], target: [0, 0, -4] }, { position: [6, 60, 84], target: [0, 0, -4] }, c);
  return (
    <Shot {...sunsetStage} camera={cam} fog={[80, 380]} shadowSize={70}>
      <group scale={CITY}>
        <Junction seed="jn" power={0.6} />
        {JN_CARS.map((car, i) => (
          <Car key={i} position={[car.x, 0, car.z]} yaw={car.yaw} color={car.color} />
        ))}
      </group>
      {[
        [14, 14, Math.PI],
        [-14, -14, 0],
        [14, -14, -Math.PI / 2],
        [-14, 14, Math.PI / 2],
      ].map(([x, z, yaw], i) => (
        <Signal key={i} position={[x, 0.42, z]} yaw={yaw} state="red" button={false} />
      ))}
      <PigeonFlock birds={JN_FLOCK} eyes={false} />
      <Sky t={c.t} tint="sunset" seed="jn" radius={260} />
    </Shot>
  );
};

/** "Cities freeze": the whole grid at sunset, every road a line of red tail lights, flocks at every junction. */
const FREEZE_FLOCK = (() => {
  const out: PigeonState[] = [];
  const blocks = 8;
  const block = 14;
  for (let bx = 0; bx <= blocks; bx++)
    for (let bz = 0; bz <= blocks; bz++) {
      const cx = (bx - blocks / 2) * block;
      const cz = (bz - blocks / 2) * block;
      for (let i = -3; i <= 3; i++)
        for (let j = -2; j <= 2; j++) out.push({ p: [cx + i * 0.55, 0, cz + j * 0.75], yaw: 0, s: 0.45, coat: coatFor(`fz${bx}${bz}${i}${j}`) });
    }
  return out;
})();
const FREEZE_CARS = (() => {
  const out: { p: V3; yaw: number }[] = [];
  const blocks = 8;
  const block = 14;
  for (let r = 0; r <= blocks; r++) {
    const o = (r - blocks / 2) * block;
    for (let k = -blocks / 2; k < blocks / 2; k++)
      for (let q = 0; q < 2; q++) {
        const u = k * block + 4 + q * 4.5 + random(`fc${r}${k}${q}`);
        if (random(`fe${r}${k}${q}`) < 0.15) continue;
        out.push({ p: [o + 1, 0, u], yaw: Math.PI });
        out.push({ p: [u, 0, o - 1], yaw: -Math.PI / 2 });
      }
  }
  return out;
})();
const c2Freeze: ShotFn = (c) => {
  const cam = move({ position: [40, 36, 56], target: [0, 0, -6] }, { position: [47, 42, 65], target: [0, 0, -6] }, c);
  return (
    <Shot {...sunsetStage} camera={cam} fog={[90, 380]} shadowSize={80} light={0.85}>
      <CityGrid seed="frz" blocks={8} modify={() => ({ power: 0.7 })} />
      {FREEZE_CARS.map((car, i) => (
        <group key={i} position={car.p} rotation={[0, car.yaw, 0]}>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[1.4, 0.7, 2.8]} />
            <Flat color={[P.carRed, P.carTeal, "#E8E4DA", "#5A4A78"][i % 4]} />
          </mesh>
          <mesh position={[0, 0.5, -1.42]}>
            <boxGeometry args={[1.2, 0.18, 0.04]} />
            <Glow color={P.taillight} />
          </mesh>
        </group>
      ))}
      <PigeonFlock birds={FREEZE_FLOCK} eyes={false} shadows={false} />
      <Sky t={c.t} tint="sunset" seed="frz" radius={300} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 the network (overcast, day two)

const overStage = { mood: "overcast" as const, fog: [30, 260] as [number, number], light: 0.95, shadowSize: 12 };
const BENCH2: V3 = [0, 0, 0];

/** Seated, phone in the right hand in front of his chest (screen toward him). */
const phoneSeat = (over: Partial<Pose> = {}) => {
  const base = sittingPose({ headPitch: -0.5, lShoulder: [0.4, -0.15], lElbow: 1.0, ...over });
  const pose = reach(base, "r", [BENCH2[0] - 0.45, SEAT_TOP + 0.75, BENCH2[2] + 1.1], { position: BENCH2 }).pose;
  const hp = handPosition(pose, "r", BENCH2);
  const phone: V3 = [hp[0] + 0.02, hp[1] + 0.22 + PHONE.h / 2 - 0.14, hp[2] + 0.05];
  return { pose, phone };
};
const PHONE_ROT: V3 = [-0.75, Math.PI, 0];
const PIGEON_SEAT: V3 = [-1.7, SEAT_TOP, 0.25];

/** Phone top edge (world) for a phone at `phone` with PHONE_ROT. */
const phoneTop = (phone: V3): V3 => {
  // local +Y after Rx(-0.75)·Ry(π): (0, cos 0.75, −sin 0.75)
  const h = PHONE.h / 2;
  return [phone[0], phone[1] + Math.cos(0.75) * h, phone[2] - Math.sin(0.75) * h];
};

const ParkGrey: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <Park seed="grey" />
    <Sky t={t} tint="overcast" seed="grey" y={40} />
  </group>
);

const c3Bench: ShotFn = (c) => {
  const cam = move({ position: [-5.0, 3.4, 12.4], target: [-0.7, 1.9, 0.3] }, { position: [-4.5, 3.3, 11.0], target: [-0.7, 1.95, 0.3] }, c);
  const { pose, phone } = phoneSeat({ expression: "neutral" });
  const land = k01(c.lt, 0, 0.55);
  const p: V3 = [PIGEON_SEAT[0] - (1 - land) * 2.5, PIGEON_SEAT[1] + (1 - land) * (1 - land) * 4, PIGEON_SEAT[2] + (1 - land) * 1.5];
  const bird: PigeonState = {
    p,
    yaw: Math.PI / 2 - 0.3,
    s: 1.05,
    flap: land < 1 ? 1 : 0,
    flapT: c.t,
    fly: 1 - land,
    headYaw: c.lt > 0.7 ? lookYaw(p, Math.PI / 2 - 0.3, phone) : 0,
    headPitch: c.lt > 0.7 ? 0.35 : 0,
    eyeOpen: c.lt > 0.9 ? 1.25 : 1,
    coat: coatFor("thief"),
  };
  return (
    <Shot {...overStage} camera={cam}>
      <ParkGrey t={c.t} />
      <Bench position={BENCH2} />
      <Hero pose={pose} position={BENCH2} />
      <Phone3D position={phone} rotation={PHONE_ROT} glow="#8FB3D9" />
      <PigeonFlock birds={[bird]} />
    </Shot>
  );
};

/** "stealing smartphones": it grabs the phone by the top edge and flies off with it. */
const c3Snatch: ShotFn = (c) => {
  const cam = move({ position: [-4.5, 3.3, 11.0], target: [-0.9, 2.2, 0.3] }, { position: [-5.2, 3.8, 11.6], target: [-2.2, 3.6, 0.6] }, c);
  const { pose: holdPose, phone } = phoneSeat({ expression: "neutral" });
  const top = phoneTop(phone);
  const grabAt = 0.32;
  const yaw = Math.PI - 0.25;
  const grab: PigeonState = { p: [0, 0, 0], yaw, s: 1.05, fly: 1 };
  const tip = beakTip(grab);
  const grabP: V3 = [top[0] - tip[0], top[1] - tip[1], top[2] - tip[2] + 0.03];
  const via: V3 = [-2.4, 2.6, 2.0];
  let p: V3;
  if (c.lt < grabAt) {
    const k = ease(c.lt / grabAt);
    const a: V3 = [PIGEON_SEAT[0], PIGEON_SEAT[1], PIGEON_SEAT[2]];
    // quadratic path seat → via (front-right, clear of his arm) → grab point
    p = [0, 1, 2].map((i) => (1 - k) * (1 - k) * a[i] + 2 * (1 - k) * k * via[i] + k * k * grabP[i]) as V3;
  } else {
    const k = (c.lt - grabAt) / 1.1;
    p = [grabP[0] - 7 * k, grabP[1] + 6 * k * k + 2 * k, grabP[2] + 2.5 * k];
  }
  const bird: PigeonState = { p, yaw: c.lt < grabAt ? yaw : yaw - 0.9 * k01(c.lt, grabAt, grabAt + 0.4), s: 1.05, flap: 1, flapT: c.t, fly: 1, coat: coatFor("thief"), eyeOpen: 0.8, brow: 0.3 };
  const held = c.lt >= grabAt;
  const beak = beakTip(bird);
  const reachK = k01(c.lt, grabAt, grabAt + 0.35);
  const pose = held ? reach(sittingPose({ expression: "alarm", headPitch: 0.35, headYaw: -0.5, lean: -0.1 * reachK }), "r", [-0.9 - 0.6 * reachK, SEAT_TOP + 2.6 + 0.6 * reachK, 1.0], { position: BENCH2 }).pose : holdPose;
  const hang = k01(c.lt, grabAt, grabAt + 0.2);
  const phoneAt: V3 = held ? [beak[0], beak[1] - PHONE.h / 2 + 0.02, beak[2] + 0.05] : phone;
  const phoneRot: V3 = held ? [-0.75 * (1 - hang), bird.yaw + Math.PI * (1 - hang), 0] : PHONE_ROT;
  return (
    <Shot {...overStage} camera={cam}>
      <ParkGrey t={c.t} />
      <Bench position={BENCH2} />
      <Hero pose={pose} position={BENCH2} />
      <Phone3D position={phoneAt} rotation={phoneRot} glow="#8FB3D9" />
      <PigeonFlock birds={[bird]} />
    </Shot>
  );
};

/** "Not randomly. They're collecting them": a rooftop where phones are laid out in neat rows. */
const GRID = { cols: 9, rows: 6, x0: -4, z0: -3.5, dx: 1.0, dz: 1.4 };
const slotPos = (col: number, row: number): V3 => [GRID.x0 + col * GRID.dx, 0, GRID.z0 + row * GRID.dz];
const RoofCity: React.FC<{ t: number; seed?: string }> = ({ t, seed = "rc" }) => (
  <group>
    <Ground y={-40} color="#3A3F4A" />
    {Array.from({ length: 26 }, (_, i) => {
      const a = (i / 26) * Math.PI * 2;
      const r = 70 + random(`${seed}r${i}`) * 50;
      const h = 30 + random(`${seed}h${i}`) * 45;
      return <Building key={i} position={[Math.sin(a) * r, -40, Math.cos(a) * r]} w={18} d={18} h={h} color={BUILDING_COLORS[i % 5]} seed={`${seed}${i}`} power={0.5} />;
    })}
    <Sky t={t} tint="overcast" seed={seed} y={30} />
  </group>
);
const c3Collect: ShotFn = (c) => {
  const cam = move({ position: [7.5, 3.0, 9.5], target: [0, 0.4, -1] }, { position: [6.6, 2.7, 8.4], target: [0, 0.4, -1] }, c);
  const incoming = [
    { col: 6, row: 5, at: 0.35 },
    { col: 7, row: 5, at: 0.75 },
    { col: 8, row: 5, at: 1.15 },
  ];
  const phones: React.ReactNode[] = [];
  const birds: PigeonState[] = [];
  for (let row = 0; row < GRID.rows; row++)
    for (let col = 0; col < GRID.cols; col++) {
      const inc = incoming.find((s) => s.col === col && s.row === row);
      const key = `${col},${row}`;
      const slot = slotPos(col, row);
      if (inc) {
        const air = clamp01((inc.at - c.lt) / 0.9);
        const b: PigeonState = columnFlight({ p: [slot[0], 0, slot[2] - 0.75], yaw: 0, s: 0.9, coat: coatFor(`in${key}`) }, air, c.t, 14);
        if (air < 1) birds.push(b);
        if (air <= 0) phones.push(<FlatPhone key={key} position={slot} glow={screenColor(key)} />);
        else if (air < 1) {
          const tip = beakTip(b);
          phones.push(<Phone3D key={key} position={[tip[0], tip[1] - PHONE.h / 2 + 0.02, tip[2] + 0.05]} glow={screenColor(key)} />);
        }
        continue;
      }
      if (row === 5 && col > 5) continue;
      phones.push(<FlatPhone key={key} position={slot} glow={screenColor(key)} on={random(`on${key}`) < 0.8} />);
    }
  // sorters: one pigeon standing behind each column, checking the row
  for (let col = 0; col < GRID.cols; col += 2) {
    const p: V3 = [GRID.x0 + col * GRID.dx, 0, GRID.z0 - 1.3];
    birds.push({ p, yaw: 0, s: 0.95, headPitch: -0.3 + 0.1 * Math.sin(c.t * 3 + col), headYaw: Math.sin(c.t * 2 + col) * 0.4, coat: coatFor(`so${col}`), brow: 0.12 });
  }
  return (
    <Shot {...overStage} camera={cam} fog={[30, 220]}>
      <RoofCity t={c.t} />
      <Rooftop />
      {phones}
      <PigeonFlock birds={birds} />
    </Shot>
  );
};

/** "…to build their own network": rooftops all over the city, phone grids glowing, links arcing between them. */
const ROOFS: { p: V3; yaw: number }[] = [
  { p: [0, 0, 0], yaw: 0 },
  { p: [62, 8, -48], yaw: 0.4 },
  { p: [-58, -6, -64], yaw: -0.3 },
  { p: [22, 14, -128], yaw: 0.1 },
  { p: [-40, 4, -160], yaw: 0.5 },
  { p: [90, -2, -150], yaw: -0.4 },
];
const LINKS: [number, number, number][] = [
  [0, 1, 0.0],
  [0, 2, 0.15],
  [1, 3, 0.35],
  [2, 4, 0.45],
  [3, 4, 0.6],
  [1, 5, 0.7],
  [3, 5, 0.85],
];
const roofHub = (i: number): V3 => [ROOFS[i].p[0], ROOFS[i].p[1] + 1.5, ROOFS[i].p[2]];
const c3Network: ShotFn = (c) => {
  const cam = move({ position: [-34, 58, 66], target: [16, -2, -84] }, { position: [-40, 66, 78], target: [16, -2, -88] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[90, 520]} light={0.7} dust={0.25} shadows={false}>
      <Ground y={-40} color="#2E333E" />
      {ROOFS.map((r, i) => (
        <group key={i} position={r.p} rotation={[0, r.yaw, 0]}>
          <Rooftop />
          {Array.from({ length: GRID.rows * GRID.cols }, (_, k) => {
            const col = k % GRID.cols;
            const row = Math.floor(k / GRID.cols);
            return <FlatPhone key={k} position={slotPos(col, row)} glow={screenColor(`n${i}${k}`)} />;
          })}
          <Halo position={[0, 1.5, 0]} size={26} color={P.amber} opacity={0.6} />
        </group>
      ))}
      {Array.from({ length: 70 }, (_, i) => {
        const x = -130 + (i % 10) * 30 + (random(`nx${i}`) - 0.5) * 8;
        const z = 40 - Math.floor(i / 10) * 32 + (random(`nz${i}`) - 0.5) * 8;
        if (ROOFS.some((r) => Math.hypot(r.p[0] - x, r.p[2] - z) < 26)) return null;
        return <Building key={i} position={[x, -40, z]} w={16} d={16} h={20 + random(`nh${i}`) * 22} color={BUILDING_COLORS[i % 5]} seed={`nb${i}`} power={0.6} />;
      })}
      {LINKS.map(([a, b, at], i) => (
        <Beam key={i} from={roofHub(a)} to={roofHub(b)} lift={22} t={c.t} grow={k01(c.lt, at * 0.8, at * 0.8 + 0.45)} color={i % 2 ? P.amber : "#7FD6FF"} seed={`l${i}`} radius={0.7} />
      ))}
      <Sky t={c.t} tint="overcast" seed="net" y={50} radius={260} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 winged armies (storm, day three)

const stormStage = { mood: "storm" as const, light: 1.0, keyDir: [-0.3, 1, 0.4] as V3 };

/** A murmuration: thousands of birds in a rolling sheet that sharpens into an arrowhead. */
const MURM = (() =>
  Array.from({ length: 1800 }, (_, i) => ({
    u: random(`mu${i}`) * 2 - 1,
    v: random(`mv${i}`) * 2 - 1,
    w: random(`mw${i}`) * 2 - 1,
    coat: coatFor(`mc${i}`),
  })))();
const murmuration = (t: number, lt: number, center: V3, size: number): PigeonState[] => {
  const arrow = k01(lt, 0.3, 2.4);
  return MURM.map((m, i) => {
    const wave = Math.sin(m.u * 3 + t * 1.6) * 0.18 + Math.cos(m.w * 2 + t * 1.1) * 0.1;
    // a rolling ribbon …
    let x = m.u;
    let y = m.v * 0.22 + wave;
    let z = m.w * 0.35;
    // … pulled into a chevron pointing toward −X
    const chevron = Math.abs(m.v) * 0.9;
    x = x * (1 - arrow) + (m.u * 0.25 + chevron - 0.45) * arrow;
    y = y * (1 - arrow) + (m.v * 0.9 + wave * 0.3) * arrow;
    z = z * (1 - arrow) + m.w * 0.2 * arrow;
    return {
      p: [center[0] + x * size, center[1] + y * size, center[2] + z * size],
      yaw: -Math.PI / 2 + Math.sin(t + i) * 0.1,
      s: 2.4,
      flap: 1,
      flapT: t + i * 0.13,
      fly: 1,
      coat: m.coat,
    };
  });
};
const c4Swarm: ShotFn = (c) => {
  const cam = move({ position: [8, 3.2, 40], target: [0, 34, -60] }, { position: [7, 3.0, 34], target: [0, 36, -60] }, c);
  const flash = clamp01(1 - Math.abs(c.lt - 1.9) / 0.1);
  return (
    <Shot mood="overcast" dust={0.3} light={0.85} camera={cam} fog={[40, 320]} shadowSize={40} overlay={<Flash k={flash} />}>
      <BigStreet seed="storm" cars lampsOn />
      <Sky t={c.t} tint="storm" seed="storm" y={80} radius={260} count={14} />
      <PigeonFlock birds={murmuration(c.t, c.lt, [30 - c.lt * 10, 56, -120], 72)} eyes={false} shadows={false} />
      <LightningBolt top={[-60, 120, -200]} bottom={[-50, 20, -200]} flash={flash} seed="b1" />
      <Rain center={[8, 10, 22]} size={[30, 24, 30]} t={c.t} count={500} thickness={0.03} opacity={0.4} />
    </Shot>
  );
};

/** "They occupy airports": an airliner on the apron, every surface covered in pigeons. */
const PLANE_YAW = -0.55;
const APRON_FLOCK = (() => {
  const out: PigeonState[] = [];
  const cy = Math.cos(PLANE_YAW);
  const sy = Math.sin(PLANE_YAW);
  const toWorld = (x: number, z: number): [number, number] => [x * cy + z * sy, -x * sy + z * cy];
  const blocked = (lx: number, lz: number) =>
    (Math.abs(lx) < 2.2 && lz > 11.5 && lz < 15.5) || // nose gear
    (Math.abs(Math.abs(lx) - 2.4) < 1.4 && Math.abs(lz - 0.4) < 1.4) || // main gear
    (Math.abs(Math.abs(lx) - 8.8) < 2.2 && Math.abs(lz - 2.8) < 3.4); // engines (bottom y 1.2)
  for (let i = -26; i <= 26; i++)
    for (let j = -16; j <= 18; j++) {
      const [x, z] = [i * CELL.x, j * CELL.z];
      // to plane-local
      const lx = x * cy - z * sy;
      const lz = x * sy + z * cy;
      if (blocked(lx, lz) || random(`ap${i},${j}`) > 0.8) continue;
      out.push(standing(i, j, PLANE_YAW + Math.PI, "ap", { headPitch: 0.15 }));
    }
  // on the wings (plane-local lattice, skipping the fuselage)
  for (let lx = -17; lx <= 17; lx += 1.0) {
    if (Math.abs(lx) < 2.6) continue;
    for (let lz = -1.0; lz <= 3.6; lz += 1.4) {
      const [x, z] = toWorld(lx, lz);
      out.push({ p: [x, PLANE_AT.wingTop, z], yaw: PLANE_YAW + Math.PI, coat: coatFor(`wg${lx}${lz}`), headPitch: 0.2 });
    }
  }
  // a line along the top of the fuselage
  for (let lz = -11; lz <= 11; lz += 1.4) {
    const [x, z] = toWorld(0, lz);
    out.push({ p: [x, PLANE_AT.roofY, z], yaw: PLANE_YAW + Math.PI / 2, coat: coatFor(`fu${lz}`) });
  }
  return out;
})();
const c4Airport: ShotFn = (c) => {
  const cam = move({ position: [12, 2.4, 34], target: [-5, 5.6, 8] }, { position: [11, 2.3, 31], target: [-5, 5.8, 8] }, c);
  const flash = clamp01(1 - Math.abs(c.lt - 0.9) / 0.08);
  return (
    <Shot {...stormStage} light={1.35} camera={cam} fog={[30, 260]} shadowSize={40} overlay={<Flash k={flash * 0.7} />}>
      <Airport />
      <group position={[0, 0, 0]} rotation={[0, PLANE_YAW, 0]}>
        <Plane position={[0, PLANE_AT.y, 0]} scale={PLANE_AT.s} t={c.t} />
        <LandingGear />
      </group>
      <PigeonFlock birds={APRON_FLOCK} eyes={false} />
      <Sky t={c.t} tint="storm" seed="apt" y={60} radius={240} />
      <Rain center={[10, 8, 26]} size={[24, 18, 18]} t={c.t} count={500} opacity={0.45} />
      <LightningBolt top={[-80, 110, -180]} bottom={[-70, 10, -180]} flash={flash} seed="b2" />
    </Shot>
  );
};

/** "and military bases": pigeons in ranks at the gate and all along the fence. */
const GATE_FLOCK = (() => {
  const out: PigeonState[] = [];
  for (let i = -8; i <= 8; i++) for (let j = 4; j <= 15; j++) out.push(standing(i, j, Math.PI, "gt", { brow: 0.42, headPitch: 0.1 }));
  for (const side of [1, -1]) for (let k = 0; k < 22; k++) out.push({ p: [side * (13 + k * 4), 6.0, 0], yaw: Math.PI, coat: coatFor(`fp${side}${k}`), s: 1.1 });
  return out;
})();
const c4Base: ShotFn = (c) => {
  const cam = move({ position: [22, 10, 40], target: [2, 4.5, -4] }, { position: [20, 9.5, 36], target: [2, 4.7, -4] }, c);
  return (
    <Shot {...stormStage} camera={cam} fog={[30, 240]} shadowSize={40}>
      <BaseGate barrier={0} />
      <ArmyTruck position={[3, 0, -16]} yaw={0} />
      <PigeonFlock birds={GATE_FLOCK} />
      <Hero pose={mergePose(REST, { expression: "alarm", headPitch: -0.2, lShoulder: [0.2, 0.3], rShoulder: [0.2, 0.3] })} position={[-15, 0, 7.5]} yaw={0.3} look={{ ...crowdLook(52), jacket: "#4E5A3A", jacketShade: "#3E4830", jeans: "#3E4830" }} />
      <Sky t={c.t} tint="storm" seed="base" y={55} />
      <Rain center={[20, 10, 32]} size={[30, 20, 26]} t={c.t} count={450} opacity={0.45} />
    </Shot>
  );
};

/** "Flights stop": every row on the board flips to CANCELLED; a pigeon sits on top of the board. */
const c4Board: ShotFn = (c) => {
  const cam = move({ position: [3.6, 5.0, 10.6], target: [0.2, 5.0, -4] }, { position: [3.2, 5.0, 9.6], target: [0.2, 5.1, -4] }, c);
  const hero: V3 = [1.6, 0, 1.8];
  const pose = mergePose(REST, { headPitch: 0.45, expression: "worried", headYaw: 0.15 });
  const handle: V3 = [hero[0] + 1.25, 2.12, hero[2] - 0.1];
  const posed = reach(pose, "l", [handle[0], handle[1] + 0.22, handle[2]], { position: hero, yaw: Math.PI }).pose;
  const topY = BOARD.c[1] + BOARD.h / 2 + 0.15;
  return (
    <Shot mood="overcast" camera={cam} fog={false} stars={false} shadowSize={12}>
      <Terminal />
      <CanvasPanel position={[BOARD.c[0], BOARD.c[1], BOARD.c[2] + 0.03]} w={BOARD.w} h={BOARD.h} draw={drawDepartures(0.4 + k01(c.lt, 0.1, 0.9) * 0.6)} />
      <Hero pose={posed} position={hero} yaw={Math.PI} />
      <Suitcase position={[handle[0], 0, handle[2]]} yaw={Math.PI / 2} />
      <Bird kind="pigeon" position={[-1.2, topY, BOARD.c[2]]} yaw={0.3} scale={1.1} headYaw={Math.sin(c.t * 2) * 0.4} face={{ eyeOpen: 0.7, brow: "smug" }} />
    </Shot>
  );
};

/** "Governments try to negotiate": officials on one side of the table, the pigeon delegation on the table. */
const OFFICIALS: V3[] = [
  [-4.8, 0, -2.9],
  [0, 0, -2.9],
  [4.8, 0, -2.9],
];
const officialPose = (i: number, t: number) => {
  const base = sittingPose({ expression: i === 1 ? "worried" : "neutral", headPitch: -0.05, headYaw: (1 - i) * 0.25 });
  const l = reach(base, "l", [OFFICIALS[i][0] + 0.55, TABLE_TOP + 0.24, -1.45], { position: OFFICIALS[i] }).pose;
  return reach(l, "r", [OFFICIALS[i][0] - 0.55 + Math.sin(t * 3 + i) * 0.05, TABLE_TOP + 0.24 + (i === 1 ? 0.25 + Math.abs(Math.sin(t * 4)) * 0.2 : 0), -1.45], { position: OFFICIALS[i] }).pose;
};
const DELEGATES: PigeonState[] = [
  { p: [0, TABLE_TOP, 0.7], yaw: Math.PI, s: 1.5, brow: 0.42, eyeOpen: 0.85, headPitch: 0.15 },
  { p: [-1.5, TABLE_TOP, 1.0], yaw: Math.PI + 0.2, s: 1.15, brow: 0.12 },
  { p: [1.5, TABLE_TOP, 1.0], yaw: Math.PI - 0.2, s: 1.15, brow: 0.12 },
];
const SummitScene: React.FC<{ t: number; talk?: number }> = ({ t, talk = 0 }) => (
  <group>
    <SummitTable />
    {OFFICIALS.map((p, i) => (
      <React.Fragment key={i}>
        <Chair position={p} seatY={SEAT_TOP} />
        <Hero pose={officialPose(i, t)} position={p} look={suitLook(70 + i)} />
      </React.Fragment>
    ))}
    <PigeonFlock birds={DELEGATES.map((d, i) => ({ ...d, coat: coatFor(`dl${i}`), headYaw: i === 0 ? Math.sin(t * 5) * 0.08 * talk : Math.sin(t * 1.4 + i) * 0.3 }))} />
  </group>
);
const c4Table: ShotFn = (c) => {
  const cam = move({ position: [10.5, 6.8, 12.5], target: [0, 2.4, -0.8] }, { position: [9.5, 6.4, 11.2], target: [0, 2.5, -0.8] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={false} stars={false} shadowSize={12} light={1.25}>
      <SummitScene t={c.t} />
    </Shot>
  );
};

/** "One problem": over the official's shoulder, the pigeon general answers… "COO." */
const c4Coo: ShotFn = (c) => {
  const head = birdHeadAt(DELEGATES[0]);
  const cam = move({ position: [2.8, 5.4, -6.4], target: [0, TABLE_TOP + 0.8, 0.7] }, { position: [2.5, 5.1, -5.6], target: [0, TABLE_TOP + 0.85, 0.7] }, c);
  return (
    <Shot
      mood="overcast"
      camera={cam}
      fog={false}
      stars={false}
      shadowSize={10}
      light={1.25}
      overlay={<Bubble text="COO." at={[head[0], head[1] + 0.3, head[2]]} cam={cam} width={c.width} height={c.height} offset={[150, -230]} appear={k01(c.lt, 0.3, 0.45)} size={64} />}
    >
      <SummitScene t={c.t} talk={c.lt > 0.3 ? 1 : 0} />
    </Shot>
  );
};

/** "Nobody speaks pigeon": Slavoski, the interpreter, headset on… shrugs. */
const INTERP: V3 = [9.6, 0, -1.4];
const c4Shrug: ShotFn = (c) => {
  const shrug = k01(c.lt, 0.35, 0.7);
  const pose = mergePose(REST, {
    lShoulder: [0.35 * shrug + 0.15, 0.3 + 0.55 * shrug],
    rShoulder: [0.35 * shrug + 0.15, 0.3 + 0.55 * shrug],
    lElbow: 0.4 + 1.2 * shrug,
    rElbow: 0.4 + 1.2 * shrug,
    headRoll: 0.14 * shrug,
    expression: "worried",
    headYaw: -0.25,
  });
  const yaw = 0.35;
  const head = headPosition(pose, INTERP, yaw);
  const cam = move({ position: [14.0, 4.6, 9.6], target: [9.0, 2.7, -1.2] }, { position: [13.4, 4.5, 8.4], target: [9.0, 2.8, -1.2] }, c);
  return (
    <Shot
      mood="overcast"
      camera={cam}
      fog={false}
      stars={false}
      shadowSize={10}
      light={1.25}
      overlay={<Bubble text="???" at={[head[0], head[1] + 0.8, head[2]]} cam={cam} width={c.width} height={c.height} offset={[-60, -170]} appear={k01(c.lt, 0.55, 0.7)} size={52} think />}
    >
      <SummitScene t={c.t} />
      <Hero pose={pose} position={INTERP} yaw={yaw} />
      <Headset head={head} yaw={yaw + pose.headYaw} roll={-pose.headRoll} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 the message (London, drizzle, day five)

const MSG_A = messageCells(["NO", "MORE", "BREAD"]);
const MSG_B = messageCells(["WE WANT", "THE", "BAKERIES"]);
type SqBird = { i: number; j: number; a: boolean; b: boolean; bg: boolean; r: number };
const SQ_BIRDS: SqBird[] = (() => {
  const A = new Set(MSG_A.map((m) => cellKey(m.i, m.j)));
  const B = new Set(MSG_B.map((m) => cellKey(m.i, m.j)));
  const out: SqBird[] = [];
  for (let i = -76; i <= 76; i++)
    for (let j = -30; j <= 37; j++) {
      const k = cellKey(i, j);
      const a = A.has(k);
      const b = B.has(k);
      const [x, , z] = cellPos(i, j);
      const bg = !a && !b && onSquare(x, z) && random(`sq${k}`) < 0.075;
      if (a || b || bg) out.push({ i, j, a, b, bg, r: random(`sr${k}`) });
    }
  return out;
})();

/**
 * Every bird in the square at time t (absolute). Letters of message A land between form0..form1; at
 * swap0 the A-only birds lift straight up and away while B-only birds land; shared cells stay put.
 */
const squareBirds = (t: number, form0: number, form1: number, swap0: number, swap1: number): PigeonState[] => {
  const out: PigeonState[] = [];
  const FLY = 1.0;
  for (const s of SQ_BIRDS) {
    const base = standing(s.i, s.j, Math.PI, "sq", {
      peck: s.bg ? Math.max(0, Math.sin(t * 3 + s.r * 20)) * 0.6 : 0,
      headPitch: s.bg ? 0 : 0.1,
      coat: s.bg ? coatFor(`sqb${s.i},${s.j}`) : paleCoatFor(`sqp${s.i},${s.j}`),
      s: s.bg ? 1 : 1.05,
    });
    if (s.bg) {
      out.push(base);
      continue;
    }
    // arrival
    const arrive = s.a ? form0 + s.r * (form1 - form0 - FLY) + FLY : swap0 + 0.35 + s.r * (swap1 - swap0 - FLY - 0.35) + FLY;
    let air = clamp01((arrive - t) / FLY);
    if (air >= 1) continue;
    // departure (A-only)
    if (s.a && !s.b) {
      const leave = swap0 + s.r * 0.8;
      const up = clamp01((t - leave) / FLY);
      if (up >= 1) continue;
      if (up > 0) air = up;
    }
    out.push(columnFlight(base, air, t, 30));
  }
  return out;
};
const sqTimes = (c: ShotCtx) => {
  const form0 = W(c, "thousands", 40.3, 41.6) - 0.2;
  const form1 = W(c, "No", form0, 45.8) - 0.35;
  const swap0 = W(c, "until", form1, 48.8) - 0.15;
  const swap1 = W(c, "We", swap0, 50.8) - 0.3;
  return { form0, form1, swap0, swap1 };
};
const londonStage = { mood: "overcast" as const, light: 0.9, keyDir: [-0.3, 1, 0.35] as V3 };

/** Ground level in the drizzle: pigeons dropping out of the grey sky in columns and landing in rows. */
const SQ_HERO: V3 = [27, 0, 38];
const SQ_HERO_YAW = 0.75;
const c5Arrive: ShotFn = (c) => {
  const { form0, form1, swap0, swap1 } = sqTimes(c);
  const cam = move({ position: [36, 4.0, 52], target: [8, 8.5, 4] }, { position: [35, 3.8, 49.5], target: [8, 9.2, 4] }, c);
  const pose = mergePose(REST, { headPitch: 0.55, expression: "awe", headYaw: -0.5, rShoulder: [0.45, 0.75], rElbow: 1.5 });
  const hand = handPosition(pose, "r", SQ_HERO, SQ_HERO_YAW);
  return (
    <Shot {...londonStage} camera={cam} fog={[30, 260]} shadowSize={30}>
      <TrafalgarSquare t={c.t} />
      <PigeonFlock birds={squareBirds(c.t, form0, form1, swap0, swap1)} />
      <Hero pose={pose} position={SQ_HERO} yaw={SQ_HERO_YAW} />
      <Umbrella hand={hand} rise={2.6} />
      <Sky t={c.t} tint="overcast" seed="ldn" y={40} radius={220} />
      <Rain center={[32, 7, 44]} size={[22, 14, 16]} t={c.t} count={420} opacity={0.4} thickness={0.025} />
    </Shot>
  );
};

/** High above the column: the letters fill in. */
const c5Forming: ShotFn = (c) => {
  const { form0, form1, swap0, swap1 } = sqTimes(c);
  const cam = move({ position: [46, 96, 124], target: [0, 0, 2] }, { position: [40, 116, 102], target: [0, 0, 2] }, c);
  return (
    <Shot {...londonStage} camera={cam} fog={[120, 520]} shadowSize={90}>
      <TrafalgarSquare t={c.t} />
      <PigeonFlock birds={squareBirds(c.t, form0, form1, swap0, swap1)} eyes={false} />
      <Sky t={c.t} tint="overcast" seed="ldn" y={60} radius={300} />
    </Shot>
  );
};

/** Straight down: NO MORE BREAD. */
const c5Read: ShotFn = (c) => {
  const { form0, form1, swap0, swap1 } = sqTimes(c);
  const cam = move({ position: [0, 182, 44], target: [0, 0, 8] }, { position: [0, 172, 40], target: [0, 0, 8] }, c);
  return (
    <Shot {...londonStage} camera={cam} fog={[150, 600]} shadowSize={90}>
      <TrafalgarSquare t={c.t} />
      <PigeonFlock birds={squareBirds(c.t, form0, form1, swap0, swap1)} eyes={false} />
    </Shot>
  );
};

/** "World leaders are confused": officials under umbrellas on the gallery terrace, scratching their heads. */
const LEADERS: V3[] = [
  [-6, 4, -51.5],
  [-2, 4, -52.5],
  [2.2, 4, -51.8],
  [6.2, 4, -52.6],
];
const c5Leaders: ShotFn = (c) => {
  const cam = move({ position: [4.0, 8.2, -31], target: [0, 6.6, -52] }, { position: [3.4, 8.0, -33.5], target: [0, 6.7, -52] }, c);
  return (
    <Shot {...londonStage} camera={cam} fog={[40, 260]} shadowSize={20}>
      <TrafalgarSquare t={c.t} />
      {LEADERS.map((p, i) => {
        const scratch = i % 2 === 1;
        const pose = mergePose(REST, {
          expression: "worried",
          headPitch: -0.35,
          headRoll: (i % 2 ? -1 : 1) * 0.15,
          ...(scratch
            ? { lShoulder: [2.5, 0.35] as [number, number], lElbow: 1.5 + Math.sin(c.t * 14) * 0.08, rShoulder: [0.45, 0.6] as [number, number], rElbow: 1.5 }
            : { rShoulder: [0.45, 0.6] as [number, number], rElbow: 1.5, lShoulder: [0.2, 0.2] as [number, number] }),
        });
        const yaw = (i - 1.5) * -0.12;
        const hand = handPosition(pose, "r", p, yaw);
        return (
          <React.Fragment key={i}>
            <Hero pose={pose} position={p} yaw={yaw} look={suitLook(80 + i)} />
            <Umbrella hand={hand} rise={2.7} tilt={(i - 1.5) * 0.08} />
          </React.Fragment>
        );
      })}
      <Rain center={[2, 9, -42]} size={[18, 12, 10]} t={c.t} count={300} opacity={0.4} thickness={0.025} />
    </Shot>
  );
};

/** "Until a second message appears": seen at an angle, the old letters lift away and new ones land. */
const c5Swap: ShotFn = (c) => {
  const { form0, form1, swap0, swap1 } = sqTimes(c);
  const cam = move({ position: [-60, 70, 110], target: [0, 4, -4] }, { position: [-52, 82, 104], target: [0, 4, -4] }, c);
  return (
    <Shot {...londonStage} camera={cam} fog={[110, 520]} shadowSize={90}>
      <TrafalgarSquare t={c.t} />
      <PigeonFlock birds={squareBirds(c.t, form0, form1, swap0, swap1)} eyes={false} />
      <Sky t={c.t} tint="overcast" seed="ldn" y={60} radius={300} />
    </Shot>
  );
};

/** Straight down again: WE WANT THE BAKERIES. */
const c5Read2: ShotFn = (c) => {
  const { form0, form1, swap0, swap1 } = sqTimes(c);
  const cam = move({ position: [0, 268, 56], target: [0, 0, 9] }, { position: [0, 256, 52], target: [0, 0, 9] }, c);
  return (
    <Shot {...londonStage} camera={cam} fog={[230, 800]} shadowSize={110}>
      <TrafalgarSquare t={c.t} />
      <PigeonFlock birds={squareBirds(c.t, form0, form1, swap0, swap1)} eyes={false} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 06 the bread war (golden dawn, day seven)

const DAWN_KEY: V3 = [0.85, 0.32, 0.45];
const dawnStage = { mood: "dawn" as const, keyDir: DAWN_KEY, light: 1.05 };

const BakeryStreet: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <Ground color="#4A4650" />
    <mesh position={[0, 0.06, 7]} receiveShadow>
      <BoxG args={[120, 0.12, 16]} />
      <Flat color="#6A6470" />
    </mesh>
    <mesh position={[0, 0.01, 25]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 20]} />
      <Flat color={P.road} />
    </mesh>
    {[-1, 1].map((side) =>
      Array.from({ length: 3 }, (_, i) => (
        <Building key={`${side}${i}`} position={[side * (16 + i * 13), 0, -7]} w={12} d={14} h={16 + random(`bk${side}${i}`) * 14} color={["#8A6A5A", "#5A4A78", "#2E5A6A"][i]} seed={`bk${side}${i}`} power={0.3} />
      )),
    )}
    {Array.from({ length: 8 }, (_, i) => (
      <Building key={`f${i}`} position={[-70 + i * 20, 0, 48]} w={16} d={12} h={14 + random(`bf${i}`) * 12} color={BUILDING_COLORS[i % 5]} seed={`bf${i}`} power={0.3} />
    ))}
    <Bakery t={t} />
    <Sky t={t} tint="dawn" seed="bkry" y={45} />
  </group>
);
const GUARDS = (() => {
  const out: PigeonState[] = [];
  for (let i = -4; i <= 4; i++) for (let j = 2; j <= 6; j++) out.push(standing(i, j, 0, "gd", { brow: 0.42, eyeOpen: 0.85, headPitch: 0.05 }));
  return out.map((b) => ({ ...b, p: [b.p[0], 0.12, b.p[2]] as V3 }));
})();

/** "By day seven": the bakery under pigeon control, their bread flag flying on the roof. */
const c6Bakery: ShotFn = (c) => {
  const cam = move({ position: [18, 6.5, 44], target: [0, 9.6, 0] }, { position: [16, 6.3, 39.5], target: [0, 9.7, 0] }, c);
  return (
    <Shot {...dawnStage} camera={cam} fog={[50, 300]} shadowSize={30}>
      <BakeryStreet t={c.t} />
      <PigeonFlock birds={GUARDS} />
    </Shot>
  );
};

/** "…the world's bread supply": inside, a pigeon on every shelf and one on the till. */
const SHELF_BIRDS: PigeonState[] = SHELF_Y.flatMap((y, r) =>
  [-5.5, 0.1, 4.6].map((x, i) => ({ p: [x + (r % 2) * 1.1, y, -1.0] as V3, yaw: (random(`sb${r}${i}`) - 0.5) * 0.5, s: 0.95, brow: 0.12, eyeOpen: 0.8, coat: coatFor(`sb${r}${i}`) })),
);
const c6Shelves: ShotFn = (c) => {
  const cam = move({ position: [2.8, 4.4, 12.5], target: [0, 4.3, -1] }, { position: [2.4, 4.3, 11.0], target: [0, 4.3, -1] }, c);
  return (
    <Shot {...dawnStage} camera={cam} fog={false} stars={false} shadowSize={14}>
      <BakeryShelves />
      <PigeonFlock birds={[...SHELF_BIRDS.map((b, i) => ({ ...b, headYaw: Math.sin(c.t * 1.5 + i) * 0.35 })), { p: [5.2, 3.0, 4.2], yaw: 0.2, s: 1.1, brow: 0.42, coat: coatFor("till"), headYaw: Math.sin(c.t * 2) * 0.3 }]} />
    </Shot>
  );
};

/** "Humanity has lost a war against birds": Slavoski raises a white flag to the pigeon general. */
const SURRENDER: V3 = [3.6, 0.12, 13.4];
const CRATE: V3 = [0.4, 0.12, 10.4];
const GENERAL: PigeonState = { p: [CRATE[0], CRATE[1] + 1.2, CRATE[2]], yaw: 0.5, s: 1.5, brow: 0.42, eyeOpen: 0.75, headPitch: 0.3 };
const c6Surrender: ShotFn = (c) => {
  // over the general's shoulder, from above the ranks: Slavoski faces us, flag against the street behind him
  const cam = move({ position: [-3.4, 4.6, 0.4], target: [2.9, 3.3, 13.4] }, { position: [-3.1, 4.5, 1.3], target: [2.9, 3.35, 13.4] }, c);
  const raise = k01(c.lt, 0.1, 0.6);
  const pose = mergePose(REST, {
    rShoulder: [0.15, 0.2 + 2.55 * raise],
    rElbow: 0.2,
    lShoulder: [0.1, 0.15],
    expression: "worried",
    headPitch: -0.25,
    headYaw: -0.3,
    lean: 0.08,
  });
  const yaw = yawTo(SURRENDER, GENERAL.p);
  const hand = handPosition(pose, "r", SURRENDER, yaw);
  return (
    <Shot {...dawnStage} camera={cam} fog={[50, 300]} shadowSize={20}>
      <BakeryStreet t={c.t} />
      <PigeonFlock birds={[...GUARDS, { ...GENERAL, coat: coatFor("gen"), headYaw: lookYaw(GENERAL.p, GENERAL.yaw, [SURRENDER[0], 3.6, SURRENDER[2]]) }]} />
      {/* the general stands on a crate of loaves */}
      <mesh position={[CRATE[0], CRATE[1] + 0.6, CRATE[2]]} castShadow>
        <BoxG args={[1.6, 1.2, 1.4]} />
        <Flat color="#8A5A36" />
      </mesh>
      <Baguette position={[CRATE[0] - 0.3, CRATE[1] + 1.2, CRATE[2] + 0.45]} rotation={[0, Math.PI / 2, 0]} len={1.4} r={0.1} />
      <Hero pose={pose} position={SURRENDER} yaw={yaw} />
      <group position={[hand[0], hand[1] - 0.25, hand[2]]} rotation={[0, yaw + Math.PI / 2, 0]} scale={2.2}>
        <WhiteFlag position={[0, 0, 0]} t={c.t} />
      </group>
    </Shot>
  );
};

/** "And the worst part?": close on Slavoski. */
const c6Worst: ShotFn = (c) => {
  const pose = mergePose(REST, { expression: "alarm", headYaw: 0.25, headPitch: 0.05 });
  const hero: V3 = SURRENDER;
  const head = headPosition(pose, hero, -0.2);
  const cam = move({ position: [head[0] + 1.2, head[1] + 0.2, head[2] + 6.4], target: [head[0], head[1] - 0.25, head[2]] }, { position: [head[0] + 1.0, head[1] + 0.15, head[2] + 5.0], target: [head[0], head[1] - 0.2, head[2]] }, c);
  return (
    <Shot {...dawnStage} camera={cam} fog={[50, 300]} shadowSize={14}>
      <BakeryStreet t={c.t} />
      <Hero pose={pose} position={hero} yaw={-0.2} />
    </Shot>
  );
};

/** "They haven't even learned to use weapons… yet": a pigeon lifts a baguette like a sword. */
const SWORD: PigeonState = { p: [0.8, 0.12, 9.0], yaw: -1.15, s: 1.3, coat: coatFor("sword") };
const c6Sword: ShotFn = (c) => {
  const lift = k01(c.lt, 0.55, 1.15);
  const bird: PigeonState = { ...SWORD, peck: c.lt < 0.55 ? k01(c.lt, 0.1, 0.45) * 0.9 : 0.9 * (1 - lift), headPitch: 0.45 * lift, brow: c.lt > 1.0 ? 0.42 : undefined, eyeOpen: c.lt > 1.0 ? 0.65 : 1.1 };
  const tip = beakTip(bird);
  const a = lift * 0.75; // pitch of the blade (radians above horizontal)
  const len = 2.0;
  const r = 0.13;
  const fwd: V3 = [Math.sin(SWORD.yaw) * Math.cos(a), Math.sin(a), Math.cos(SWORD.yaw) * Math.cos(a)];
  // lying in front of the beak before the lift; held by its end afterwards
  const center: V3 = lift <= 0 && c.lt < 0.45 ? [tip[0] + Math.sin(SWORD.yaw) * (len / 2 + 0.05), SWORD.p[1] + r, tip[2] + Math.cos(SWORD.yaw) * (len / 2 + 0.05)] : [tip[0] + fwd[0] * (len / 2 - 0.05), Math.max(SWORD.p[1] + r, tip[1] + fwd[1] * (len / 2 - 0.05)), tip[2] + fwd[2] * (len / 2 - 0.05)];
  const gleam = clamp01(1 - Math.abs(c.lt - 1.35) / 0.15);
  const tipEnd: V3 = [center[0] + fwd[0] * len * 0.5, center[1] + fwd[1] * len * 0.5, center[2] + fwd[2] * len * 0.5];
  const cam = move({ position: [1.4, 1.5, 19.0], target: [-0.1, 1.5, 9.0] }, { position: [1.2, 1.45, 17.4], target: [-0.1, 1.6, 9.0] }, { ...c, dur: 3.5 });
  const watchers: PigeonState[] = ([
    { p: [-3.2, 0.12, 8.2], yaw: 0.9, s: 1.0 },
    { p: [3.2, 0.12, 7.6], yaw: -0.6, s: 1.0 },
    { p: [-1.6, 0.12, 6.4], yaw: 0.4, s: 1.0 },
    { p: [1.8, 0.12, 6.0], yaw: -0.2, s: 1.0 },
  ] as PigeonState[]).map((w, i) => ({ ...w, coat: coatFor(`wt${i}`), headYaw: c.lt > 1.0 ? lookYaw(w.p, w.yaw, SWORD.p) : 0, eyeOpen: c.lt > 1.0 ? 1.3 : 1 }));
  return (
    <Shot {...dawnStage} camera={cam} fog={[40, 300]} shadowSize={10}>
      <BakeryStreet t={c.t} />
      <PigeonFlock birds={[bird, ...watchers]} />
      <group position={center} rotation={[-a, SWORD.yaw, 0, "YXZ"]}>
        <Baguette position={[0, -r, 0]} len={len} r={r} />
      </group>
      {gleam > 0 ? <Halo position={tipEnd} size={1.8 * gleam} color="#FFF6D8" opacity={gleam} /> : null}
      <Loaf position={[2.6, 0.12, 10.2]} yaw={0.4} />
    </Shot>
  );
};

// ---------------------------------------------------------------- thumbnail

/** Shorts cover: the pigeon general and the army in front of the bakery, Slavoski with his white flag. */
export const thumbShot: ShotFn = (c) => c6Surrender({ ...c, lt: 1.2, dur: 2.7, t: 57 });

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldClock },
    { cue: "AM", fn: coldPeck },
    { cue: "IQ", fn: coldIQ },
    { cue: "At first", fn: coldNobody },
  ],
  c1: [
    { cue: null, fn: c1Ignore },
    { cue: "They start watching", fn: c1Watch },
    { cue: "By midday", fn: c1Plaza },
    { cue: "not moving", fn: c1Stare },
  ],
  c2: [
    { cue: null, fn: c2Button },
    { cue: "traffic lights", fn: c2Red },
    { cue: "Coordinated", fn: c2Junction },
    { cue: "Cities freeze", fn: c2Freeze },
  ],
  c3: [
    { cue: null, fn: c3Bench },
    { cue: "stealing", fn: c3Snatch },
    { cue: "Not randomly", fn: c3Collect },
    { cue: "to build", fn: c3Network },
  ],
  c4: [
    { cue: null, fn: c4Swarm },
    { cue: "They occupy", fn: c4Airport },
    { cue: "military bases", fn: c4Base },
    { cue: "Flights stop", fn: c4Board },
    { cue: "Governments", fn: c4Table },
    { cue: "One problem", fn: c4Coo },
    { cue: "nobody speaks", fn: c4Shrug },
  ],
  c5: [
    { cue: null, fn: c5Arrive },
    { cue: "across London's", fn: c5Forming },
    { cue: "No more bread", fn: c5Read },
    { cue: "World leaders", fn: c5Leaders },
    { cue: "until a second", fn: c5Swap },
    { cue: "We want", fn: c5Read2 },
  ],
  c6: [
    { cue: null, fn: c6Bakery },
    { cue: "the world's bread", fn: c6Shelves },
    { cue: "Humanity", fn: c6Surrender },
    { cue: "and the worst", fn: c6Worst },
    { cue: "They haven't", fn: c6Sword },
  ],
};
