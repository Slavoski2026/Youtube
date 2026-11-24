/**
 * Shots for "What If Everyone Had a Death Countdown?" (ep. 8).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * Hook: a timer floating over a stranger, then the street full of them, the friend (64 years), the
 * neighbour (12 years)… and Slavoski's own: 47 seconds. Arc: sunny morning → overcast chaos → storm
 * rooftop → golden office and sunset picnic → rainy day → night lab → a dark bathroom mirror.
 * Slavoski is kept out of the middle chapters (his timer would contradict the hook) and comes back
 * for the mirror ("Now imagine…"), where his timer reads 60 years before it drops.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import * as THREE from "three";
import { Building, Car, CityGrid, Ground, StreetSet } from "../../slavoski/city";
import { BoxG } from "../../slavoski/detail";
import { crowdLook, suitLook, type HeroLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Clouds, LeafyTree, Rain } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { groundedBob, handPosition, headPosition, Hero, lerpPose, mergePose, reach, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { sittingPose } from "../../slavoski/room";
import { CanvasPanel, ScreenHtml } from "../../slavoski/screens";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import { type CuedShot, wordAt } from "../../slavoski/timeline";
import { Blanket, HillRing, House, Skyline } from "../no-work-2036/props";
import { CITY, PHONE, Phone3D } from "../ww3-countdown/props";
import {
  Bathroom,
  Bus,
  Cafe,
  coatLook,
  CV,
  DatingScreen,
  days,
  DeskBox,
  drawDeadline,
  drawLabWall,
  drawNews,
  drawWhiteboard,
  Flowers,
  Heart,
  Hourglass,
  InsuranceShop,
  InterviewRoom,
  Lab,
  MIRROR,
  Mirrored,
  Picket,
  reflect,
  RoomShell,
  Rooftop,
  ROOF,
  SeatChair,
  seatTop,
  Stamp,
  Timer,
  TIMER_Y,
  TimerDots,
  TimerShards,
  toneFor,
  TONE,
  WateringCan,
  yrs,
} from "./props";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
const at = (c: ShotCtx, phrase: string, from: number, fallback: number) => wordAt(c.words, phrase, from, fallback);

/** Kit street ×3.5 so it matches Slavoski (road |x| < 12.25, pavements to 21.35). `day` dims practicals. */
const BigStreet: React.FC<React.ComponentProps<typeof StreetSet> & { day?: boolean }> = ({ day = false, ...props }) => (
  <group scale={CITY}>
    <StreetSet {...props} lampsOn={day ? false : props.lampsOn} modify={day ? (sp, i) => ({ power: 0.3, ...(props.modify?.(sp, i) ?? {}) }) : props.modify} />
  </group>
);

const Shot: React.FC<{ children: React.ReactNode; overlay?: React.ReactNode } & React.ComponentProps<typeof Stage>> = ({ children, overlay, ...stage }) => (
  <AbsoluteFill>
    <Stage {...stage}>{children}</Stage>
    {overlay}
  </AbsoluteFill>
);

const CLOUD = { day: "#F4F6FA", sunset: "#F7C0A0", storm: "#3E4656", overcast: "#AEB6C2" } as const;
const Sky: React.FC<{ t: number; tint: keyof typeof CLOUD; y?: number; radius?: number; count?: number; seed?: string }> = ({ t, tint, y = 40, radius = 220, count = 16, seed = "sky" }) => (
  <Clouds t={t} color={CLOUD[tint]} y={y} radius={radius} count={count} seed={seed} />
);

/** A person with their countdown floating above the head. Timer hidden with `seconds` null. */
const Person: React.FC<{
  c: ShotCtx;
  cam: CameraSpec;
  position: V3;
  yaw?: number;
  pose?: Pose;
  look?: HeroLook;
  seconds: number | null;
  pop?: number;
  glitch?: number;
  seed: string;
  text?: { big: string; unit: string; sub: string };
  timerScale?: number;
  color?: string;
  /** Extra height for the timer (e.g. over an umbrella). */
  lift?: number;
}> = ({ c, cam, position, yaw = 0, pose = REST, look, seconds, pop = 1, glitch = 0, seed, text, timerScale = 1, color, lift = 0 }) => {
  const head = headPosition(pose, position, yaw);
  return (
    <>
      <Hero pose={pose} position={position} yaw={yaw} look={look} />
      {seconds !== null ? (
        <Timer at={[head[0], head[1] + (TIMER_Y - 3.5) * timerScale + (timerScale - 1) * 0.1 + lift, head[2]]} face={cam.position} seconds={seconds} t={c.t} pop={pop} glitch={glitch} seed={seed} text={text} scale={timerScale} color={color} />
      ) : null}
    </>
  );
};

/** Seeded seconds-left for an extra: mostly decades, some years, a few days. */
const extraLeft = (seed: string) => {
  const r = random(`${seed}r`);
  if (r < 0.62) return yrs(22 + random(`${seed}y`) * 60) ;
  if (r < 0.9) return yrs(1 + random(`${seed}y`) * 18);
  return days(1 + random(`${seed}d`) * 200);
};

const walker = (lt: number, i: number, speed = 1.4, amount = 0.8) => walkPose(lt * speed + i * 0.37, amount);
const runner = (lt: number, i: number) => mergePose(walkPose(lt * 2.4 + i * 0.41, 1.3), { lean: 0.22, expression: "alarm" });

/** A hand-held phone in close-up with its screen as HTML (the screen faces +Z). */
const PhoneCU: React.FC<{ c: ShotCtx; at: V3; glow: string; screen: (w: number, h: number) => React.ReactNode; children: React.ReactNode; stage?: Partial<React.ComponentProps<typeof Stage>> }> = ({
  c,
  at: P0,
  glow,
  screen,
  children,
  stage,
}) => {
  const cam = move({ position: [P0[0] + 0.06, P0[1] + 0.02, P0[2] + 2.05], target: [P0[0], P0[1] - 0.02, P0[2]] }, { position: [P0[0] + 0.03, P0[1], P0[2] + 1.75], target: [P0[0], P0[1], P0[2]] }, c);
  return (
    <Shot
      mood="overcast"
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
      <pointLight position={[P0[0], P0[1], P0[2] + 1]} color={glow} intensity={3} distance={4} decay={2} />
    </Shot>
  );
};

/** reach() is a numeric search: cache it (targets rounded to 2 cm) so repeated frames are free. */
const REACH = new Map<string, Pose>();
const reachC = (pose: Pose, side: "l" | "r", target: V3, opts: { position?: V3; yaw?: number } = {}): Pose => {
  const key = JSON.stringify([pose, side, target.map((v) => Math.round(v * 50)), opts]);
  const hit = REACH.get(key);
  if (hit) return hit;
  const out = reach(pose, side, target, opts).pose;
  if (REACH.size > 400) REACH.clear();
  REACH.set(key, out);
  return out;
};

/** Rotates a hero-local offset by the hero's yaw. */
const rotY = (v: V3, yaw: number): V3 => [v[0] * Math.cos(yaw) + v[2] * Math.sin(yaw), v[1], -v[0] * Math.sin(yaw) + v[2] * Math.cos(yaw)];

/** A person holding a phone in the right hand in front of the chest (screen toward them). */
const phoneStance = (hero: V3, yaw = 0, over: Partial<Pose> = {}) => {
  const base = mergePose(REST, { headPitch: -0.35, ...over, expression: "neutral" });
  const o = rotY([-0.3, 1.9, 1.05], yaw);
  const pose = mergePose(reachC(base, "r", [hero[0] + o[0], hero[1] + o[1], hero[2] + o[2]], { position: hero, yaw }), { expression: over.expression ?? "neutral" });
  const hp = handPosition(pose, "r", hero, yaw);
  const d = rotY([0.02, 0.22 + PHONE.h / 2 - 0.14, 0.05], yaw);
  const phone: V3 = [hp[0] + d[0], hp[1] + d[1], hp[2] + d[2]];
  return { pose, phone, rotation: new THREE.Euler(-0.75, yaw + Math.PI, 0, "YXZ") };
};

/** Seated pose with its hips at the right height. */
const seated = (over: Partial<Pose> = {}) => sittingPose({ lShoulder: [0.35, 0.1], rShoulder: [0.35, 0.1], lElbow: 0.6, rElbow: 0.6, ...over });

/** Sitting on the ground, legs forward. */
const groundSit = (over: Partial<Pose> = {}): Pose => {
  const p = mergePose(REST, { lHip: [1.45, 0.12], rHip: [1.45, 0.12], lKnee: 0.35, rKnee: 0.35, lShoulder: [0.3, 0.25], rShoulder: [0.3, 0.25], lElbow: 0.3, rElbow: 0.3, ...over });
  return { ...p, bob: Math.max(groundedBob(p), 0.2 - 1.55) };
};

// Slavoski's own timer in the cold open: 47 seconds, ticking from "forty-seven".
const coldTimes = (c: ShotCtx) => {
  const yours = at(c, "yours", 6, 7.76);
  const fortySeven = at(c, "forty-seven", 6, 8.5);
  return { yours, fortySeven, left: (t: number) => 47 - Math.max(0, t - fortySeven - 0.3) };
};

// ---------------------------------------------------------------- cold open (sunny morning)

const MORNING_KEY: V3 = [0.75, 0.55, 0.45];

/** 0 s: a countdown floating over a stranger's head, in close-up, pulling back to the head below. */
const coldTimer: ShotFn = (c) => {
  const S: V3 = [15.5, 0, -2 + c.lt * 1.2];
  const cam = move({ position: [15.8, 4.9, S[2] + 7.6], target: [15.5, 4.3, S[2]] }, { position: [16.1, 4.8, S[2] + 9.4], target: [15.5, 4.25, S[2]] }, c);
  return (
    <Shot mood="day" camera={cam} keyDir={MORNING_KEY} fog={[40, 300]} shadowSize={20} light={1.1}>
      <BigStreet seed="morning" day lamps={false} />
      <Sky t={c.t} tint="day" seed="morning" />
      <Person c={c} cam={cam} position={S} pose={mergePose(walker(c.lt, 0, 1.2, 0.6), { headPitch: 0.05 })} look={crowdLook(3)} seconds={yrs(52) + days(118) + 27733 - c.t} seed="s0" />
    </Shot>
  );
};

/** The street: everybody walking under their own countdown (lanes that never cross). Title comes in. */
const CROWD1: { p: V3; dir: V3 }[] = [
  { p: [14.4, 0, 6], dir: [0, 0, 1] },
  { p: [14.4, 0, -8], dir: [0, 0, 1] },
  { p: [14.4, 0, -22], dir: [0, 0, 1] },
  { p: [14.4, 0, -36], dir: [0, 0, 1] },
  { p: [18.6, 0, 0], dir: [0, 0, -1] },
  { p: [18.6, 0, -14], dir: [0, 0, -1] },
  { p: [18.6, 0, -28], dir: [0, 0, -1] },
  { p: [18.6, 0, -44], dir: [0, 0, -1] },
  { p: [4, 0, -18], dir: [1, 0, 0] },
  { p: [-6, 0, -30], dir: [1, 0, 0] },
];
const coldStreet: ShotFn = (c) => {
  const cam = move({ position: [9.5, 9.5, 30], target: [14, 3.2, -24] }, { position: [9.8, 9.0, 27], target: [14, 3.4, -24] }, c);
  return (
    <Shot mood="day" camera={cam} keyDir={MORNING_KEY} fog={[60, 320]} shadowSize={60} light={1.1}>
      <BigStreet seed="morning" day cars={false} lamps={false} />
      <Sky t={c.t} tint="day" seed="morning2" />
      {CROWD1.map((w, i) => {
        const pos: V3 = [w.p[0] + w.dir[0] * c.lt * 1.8, 0, w.p[2] + w.dir[2] * c.lt * 1.8];
        return (
          <Person
            key={i}
            c={c}
            cam={cam}
            position={pos}
            yaw={Math.atan2(w.dir[0], w.dir[2])}
            pose={walker(c.lt, i)}
            look={crowdLook(10 + i)}
            seconds={extraLeft(`c1${i}`) - c.t}
            pop={clamp01((c.lt - 0.05 - i * 0.05) / 0.25)}
            seed={`c1${i}`}
          />
        );
      })}
    </Shot>
  );
};

/** Your friend: 64 years. Over Slavoski's shoulder (his own timer is above the frame). */
const coldFriend: ShotFn = (c) => {
  const F: V3 = [15.5, 0, 0.5];
  const cam = move({ position: [16.6, 3.9, 11.2], target: [15.5, 4.3, 0.5] }, { position: [16.5, 3.95, 10.2], target: [15.5, 4.3, 0.5] }, c);
  const sixty = at(c, "sixty-four", 2.5, 3.92) - (c.t - c.lt);
  const wave = Math.sin(c.lt * 9) * 0.25;
  const fpose = mergePose(REST, { expression: "smile", rShoulder: [0.2, 2.3 + wave], rElbow: 0.5, headYaw: 0.08 });
  return (
    <Shot mood="day" camera={cam} keyDir={MORNING_KEY} fog={[40, 300]} shadowSize={20} light={1.1}>
      <BigStreet seed="friend" day lamps={false} />
      <Sky t={c.t} tint="day" seed="friend" />
      <Person c={c} cam={cam} position={F} pose={fpose} look={crowdLook(5)} seconds={yrs(64) + days(201) + 41820 - c.t} pop={clamp01((c.lt - 0.05) / 0.3)} timerScale={1 + 0.12 * Math.sin(clamp01((c.lt - sixty) / 0.35) * Math.PI)} seed="friend" />
    </Shot>
  );
};

/** Your neighbour: 12 years, watering the flowers over the picket fence. */
const coldNeighbour: ShotFn = (c) => {
  const N: V3 = [2, 0, -5.5];
  const cam = move({ position: [-2.2, 4.1, 9.6], target: [1.6, 4.25, -5.5] }, { position: [-1.7, 4.05, 8.4], target: [1.7, 4.25, -5.5] }, c);
  const wave = Math.sin(c.lt * 8) * 0.25;
  const base = mergePose(REST, { expression: "smile", lShoulder: [0.15, 2.25 + wave], lElbow: 0.5, rShoulder: [0.75, 0.35], rElbow: 0.5, headYaw: -0.25 });
  const hand = handPosition(base, "r", N);
  return (
    <Shot mood="day" camera={cam} keyDir={MORNING_KEY} fog={[50, 300]} shadowSize={26} light={1.1}>
      <Ground color={P.grass} />
      <mesh position={[0, -0.05, 18]} receiveShadow>
        <BoxG args={[200, 0.1, 12]} />
        <Flat color={P.pavement} />
      </mesh>
      <group scale={1.6}>
        <House position={[2, 0, -10]} color="#E8DCC4" roof="#C8372D" lit={false} />
        <House position={[-12, 0, -13]} color="#C9D6E0" roof="#3A4A6A" lit={false} />
        <House position={[15, 0, -14]} color="#E8C8A8" roof="#5A3A28" lit={false} />
      </group>
      <LeafyTree position={[-8, 0, -6]} scale={2.4} seed="n1" />
      <LeafyTree position={[12, 0, -4]} scale={2.2} seed="n2" />
      <Picket x0={-14} x1={14} z={-2.4} />
      <Flowers x0={-10} x1={10} z={-3.6} seed="nb" />
      <Sky t={c.t} tint="day" seed="nbr" />
      <Person c={c} cam={cam} position={N} pose={base} look={{ ...crowdLook(8), hair: "#8A8A8A" }} seconds={yrs(12) + days(77) + 3021 - c.t} pop={clamp01((c.lt - 0.05) / 0.3)} seed="nbr" />
      <WateringCan position={[hand[0] - 0.05, hand[1] + 0.05, hand[2] + 0.12]} rotation={[0, -Math.PI / 2, -0.35]} />
    </Shot>
  );
};

/** But yours… Slavoski looks up: 00:00:47, in red. */
const SL: V3 = [16, 0, 4];
const coldYours: ShotFn = (c) => {
  const { yours, left } = coldTimes(c);
  const t0 = yours - (c.t - c.lt);
  const pop = clamp01((c.lt - t0 + 0.05) / 0.3);
  const cam = move({ position: [17.0, 1.7, 13.5], target: [16, 4.3, 4] }, { position: [16.8, 1.8, 12.4], target: [16, 4.35, 4] }, c);
  const pose = mergePose(REST, { headPitch: pop > 0 ? 0.5 : 0.05, expression: pop > 0 ? "alarm" : "neutral", lShoulder: [0.15, 0.35], rShoulder: [0.15, 0.35] });
  return (
    <Shot mood="day" camera={cam} keyDir={MORNING_KEY} fog={[40, 300]} shadowSize={20} light={1.1} shake={pop > 0 && pop < 1 ? 0.06 : 0}>
      <BigStreet seed="yours" day lamps={false} />
      <Sky t={c.t} tint="day" seed="yours" y={50} />
      <Person c={c} cam={cam} position={SL} pose={pose} seconds={left(c.t)} pop={pop} seed="slav" />
      {pop > 0 ? <pointLight position={[SL[0], 5.3, SL[2] + 0.8]} color={TONE.short} intensity={8} distance={6} decay={2} /> : null}
    </Shot>
  );
};

/** Seconds: the red timer ticking, Slavoski's hair at the bottom of the frame. */
const coldTick: ShotFn = (c) => {
  const { left } = coldTimes(c);
  const cam = move({ position: [19.6, 4.6, 13.4], target: [16, 4.4, 4], up: [0.12, 1, 0] }, { position: [19.0, 4.6, 12.2], target: [16, 4.4, 4], up: [0.12, 1, 0] }, c);
  const sec = left(c.t);
  const tick = (sec % 1) > 0.88 ? 0.5 : 0;
  return (
    <Shot mood="day" camera={cam} keyDir={MORNING_KEY} fog={[40, 300]} shadowSize={20} light={1.1}>
      <BigStreet seed="yours" day lamps={false} />
      <Sky t={c.t} tint="day" seed="yours" y={50} />
      <Person c={c} cam={cam} position={SL} pose={mergePose(REST, { headPitch: 0.45, headYaw: 0.25, expression: "alarm" })} seconds={sec} glitch={tick} seed="slav" />
      <pointLight position={[SL[0], 5.3, SL[2] + 0.8]} color={TONE.short} intensity={8} distance={6} decay={2} />
    </Shot>
  );
};

/** Every human: a whole city of tiny people, each with a glowing timer. */
const coldCity: ShotFn = (c) => {
  const a = 0.5 + c.lt * 0.05;
  const cam: CameraSpec = { position: [Math.sin(a) * 62, 52, Math.cos(a) * 62], target: [0, 0, 0] };
  return (
    <Shot mood="day" camera={cam} keyDir={MORNING_KEY} fog={[70, 260]} shadowSize={70} light={1.1}>
      <CityGrid seed="dots" blocks={6} block={14} modify={() => ({ power: 0.3 })} />
      <TimerDots t={c.t} pop={c.lt * 1.5} />
      <Sky t={c.t} tint="day" seed="city" y={45} />
    </Shot>
  );
};

/** …see exactly when: a crosswalk crowd, all looking up at their own numbers. */
const CROSS: V3[] = [
  [13.8, 0, 6],
  [17.6, 0, 0.5],
  [14.4, 0, -5.5],
  [18.8, 0, -11.5],
  [15.0, 0, -18],
];
const coldCross: ShotFn = (c) => {
  const cam = move({ position: [6.0, 4.0, 18.5], target: [16, 4.8, -4] }, { position: [6.8, 4.1, 16.5], target: [16, 4.9, -4] }, c);
  return (
    <Shot mood="day" camera={cam} keyDir={MORNING_KEY} fog={[40, 300]} shadowSize={30} light={1.1}>
      <BigStreet seed="cross" day lamps={false} />
      <Sky t={c.t} tint="day" seed="cross" />
      {CROSS.map((p, i) => (
        <Person
          key={i}
          c={c}
          cam={cam}
          position={p}
          yaw={-0.9 + random(`cy${i}`) * 0.5}
          pose={mergePose(REST, { headPitch: 0.42 + random(`cp${i}`) * 0.15, expression: i % 3 === 0 ? "awe" : i % 3 === 1 ? "worried" : "alarm", headYaw: (random(`ch${i}`) - 0.5) * 0.3 })}
          look={crowdLook(20 + i)}
          seconds={extraLeft(`x${i}`) - c.t}
          seed={`x${i}`}
        />
      ))}
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 the numbers appear (overcast chaos)

const CHAOS_CARS = [
  { p: [1.6, 0, -2.5] as V3, yaw: 0.55, color: P.carRed },
  { p: [-1.9, 0, -7.5] as V3, yaw: Math.PI - 0.4, color: P.carTeal },
  { p: [1.4, 0, -13] as V3, yaw: -0.3, color: "#E8E4DA" },
];
const c1Chaos: ShotFn = (c) => {
  const cam = move({ position: [-6, 5.2, 24], target: [12.5, 7.6, -22] }, { position: [-5.4, 5.1, 21.5], target: [12.5, 7.9, -22] }, c);
  const runners: { p: V3; v: V3 }[] = [
    { p: [-2, 0, 6], v: [3.2, 0, -4] },
    { p: [4, 0, 2], v: [-4, 0, 3] },
    { p: [14, 0, -4], v: [0, 0, 6] },
    { p: [16.5, 0, -14], v: [0, 0, 5] },
    { p: [-15, 0, -2], v: [0, 0, -5.5] },
    { p: [-6, 0, -18], v: [-1, 0, 4.5] },
    { p: [8, 0, -26], v: [-3, 0, 4] },
    { p: [18, 0, 6], v: [-1, 0, -5] },
  ];
  return (
    <Shot mood="overcast" camera={cam} fog={[40, 260]} shadowSize={50} light={1.25}>
      <BigStreet seed="chaos" cars={false} lamps={false} />
      <Sky t={c.t} tint="overcast" seed="chaos" />
      <group scale={CITY}>
        {CHAOS_CARS.map((k, i) => (
          <Car key={i} position={k.p} yaw={k.yaw} color={k.color} />
        ))}
      </group>
      <CanvasPanel position={[21.1, 15, -26]} rotation={[0, -Math.PI / 2, 0]} w={17} h={9.5} draw={drawNews(c.t)} />
      <Halo position={[20.5, 15, -26]} size={22} color="#C8372D" opacity={0.18} />
      {runners.map((r, i) => {
        const pos: V3 = [r.p[0] + r.v[0] * c.lt, 0, r.p[2] + r.v[2] * c.lt];
        return <Person key={i} c={c} cam={cam} position={pos} yaw={Math.atan2(r.v[0], r.v[2])} pose={runner(c.lt, i)} look={crowdLook(40 + i)} seconds={extraLeft(`r${i}`) - c.t} seed={`r${i}`} />;
      })}
    </Shot>
  );
};

/** High above: people running every way (in lanes that never cross), timers bobbing over the crowd. */
const ABOVE: { p: V3; v: V3 }[] = [
  { p: [-18.5, 0, -2], v: [0, 0, -6] },
  { p: [-18.5, 0, -20], v: [0, 0, -6] },
  { p: [-14.5, 0, -34], v: [0, 0, 5.5] },
  { p: [-14.5, 0, -14], v: [0, 0, 5.5] },
  { p: [14.5, 0, 2], v: [0, 0, -5] },
  { p: [14.5, 0, -18], v: [0, 0, -5] },
  { p: [18.5, 0, -36], v: [0, 0, 6] },
  { p: [18.5, 0, -16], v: [0, 0, 6] },
  { p: [-10, 0, 0], v: [6, 0, 0] },
  { p: [9, 0, -18], v: [-6, 0, 0] },
  { p: [-9, 0, -34], v: [5.5, 0, 0] },
];
const c1Above: ShotFn = (c) => {
  const cam = move({ position: [3, 62, 36], target: [1, 0, -16] }, { position: [2.5, 58, 32], target: [1, 0, -17] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[60, 300]} shadowSize={70} light={1.25}>
      <BigStreet seed="chaos" cars={false} />
      <group scale={CITY}>
        {CHAOS_CARS.map((k, i) => (
          <Car key={i} position={k.p} yaw={k.yaw} color={k.color} />
        ))}
      </group>
      {ABOVE.map((r, i) => {
        const pos: V3 = [r.p[0] + r.v[0] * c.lt, 0, r.p[2] + r.v[2] * c.lt];
        return <Person key={i} c={c} cam={cam} position={pos} yaw={Math.atan2(r.v[0], r.v[2])} pose={runner(c.lt, i)} look={crowdLook(60 + i)} seconds={extraLeft(`ab${i}`) - c.t} seed={`ab${i}`} />;
      })}
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 fearless (storm)

/** 71 years left: a man balancing on the edge of a skyscraper roof, arms out, grinning. */
const c2Roof: ShotFn = (c) => {
  const D: V3 = [1.5, ROOF.parapet, -ROOF.half + ROOF.thick / 2];
  const cam = move({ position: [4.2, 14, -5], target: [1, -10, -40] }, { position: [3.8, 13.2, -6.5], target: [1, -10, -40] }, c);
  const sway = Math.sin(c.lt * 2.2) * 0.06;
  const dpose = mergePose(REST, { lShoulder: [0.05, 1.5 + sway], rShoulder: [0.05, 1.5 - sway], lElbow: 0.1, rElbow: 0.1, side: sway, headYaw: 0.55, expression: "smile" });
  return (
    <Shot mood="storm" camera={cam} fog={[70, 420]} shadowSize={30} light={1.35}>
      <Rooftop />
      <group position={[0, -80, -40]} scale={CITY}>
        <CityGrid seed="below" blocks={6} block={14} />
      </group>
      <Sky t={c.t} tint="storm" seed="roof" y={10} radius={220} count={18} />
      <Person c={c} cam={cam} position={D} yaw={Math.PI} pose={dpose} look={crowdLook(71)} seconds={yrs(71) + days(40) + 999 - c.t} seed="dare" />
    </Shot>
  );
};

/** …nothing could kill them: strolling across the road; a car screeches to a stop. */
const c2Road: ShotFn = (c) => {
  const W: V3 = [-2 + Math.min(c.lt, 2.2) * 2.4, 0, 0];
  const stopK = clamp01(c.lt / 1.1);
  const carZ = -60 + (1 - (1 - stopK) ** 2) * (60 - 7.6);
  const dive = c.lt > 1.1 && c.lt < 1.6 ? Math.sin(((c.lt - 1.1) / 0.5) * Math.PI) * 0.05 : 0;
  const cam = move({ position: [1, 3.0, 22], target: [1, 3.4, -3] }, { position: [1.4, 3.1, 20], target: [1.5, 3.5, -3] }, c);
  const wave = c.lt > 1.2 ? Math.sin(c.lt * 9) * 0.25 : 0;
  const wpose = mergePose(walker(c.lt, 0, 1.0, 0.6), { headYaw: -0.9, expression: "smile", ...(c.lt > 1.2 ? { lShoulder: [0.2, 2.2 + wave] as [number, number], lElbow: 0.5 } : {}) });
  return (
    <Shot mood="storm" camera={cam} fog={[40, 260]} shadowSize={30} light={1.3}>
      <BigStreet seed="road" cars={false} lamps={false} />
      <Sky t={c.t} tint="storm" seed="road" y={30} />
      <group scale={CITY}>
        <Car position={[1.7, 0, carZ / CITY]} yaw={0} color={P.carRed} tilt={[dive, 0]} />
        <Car position={[-1.7, 0, 7.6 / CITY + 0.2]} yaw={Math.PI} color={P.carTeal} />
      </group>
      <Person c={c} cam={cam} position={W} yaw={Math.PI / 2} pose={wpose} look={crowdLook(58)} seconds={yrs(58) + days(3) + 12000 - c.t} seed="walk" />
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 last days (golden hour)

/** Open-plan office at golden hour: the man with 3 days left walks out with his box. */
const OfficeFloor: React.FC<{ c: ShotCtx; cam: CameraSpec }> = ({ c, cam }) => {
  const sp = seated();
  const top = seatTop(sp);
  return (
    <group>
      <RoomShell wall="#7A8294" floor="#4A5468" back={22} half={12} />
      <CanvasPanel position={[0, 8.2, -21.95]} w={9} h={2.2} draw={drawDeadline} />
      {/* windows on the right wall, sunset outside */}
      {[-16, -8, 0].map((z) => (
        <CanvasPanel
          key={z}
          position={[-11.8, 6, z]}
          rotation={[0, Math.PI / 2, 0]}
          w={6}
          h={5}
          px={256}
          draw={(ctx, W, H) => {
            const g = ctx.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, "#5A4A78");
            g.addColorStop(0.6, "#F49A5C");
            g.addColorStop(1, "#FFD08A");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = "#3A2A40";
            for (let i = 0; i < 6; i++) ctx.fillRect((W * i) / 6, H * (0.55 + random(`ow${z}${i}`) * 0.25), W / 7, H);
          }}
        />
      ))}
      {[-15, -8, -1].flatMap((z) =>
        [-1, 1].map((s) => {
          const x = s * 3.7;
          const look = crowdLook(90 + z + s);
          return (
            <group key={`${z}${s}`}>
              <mesh position={[x + s * 1.9, top + 0.85, z]} castShadow receiveShadow>
                <BoxG args={[2, 0.14, 3.2]} />
                <Flat color="#C9C2B4" />
              </mesh>
              <mesh position={[x + s * 2.6, top + 1.55, z]} castShadow>
                <BoxG args={[0.12, 1.1, 1.8]} />
                <Flat color="#17181E" />
              </mesh>
              <SeatChair position={[x + s * 0.25, 0, z]} yaw={-s * Math.PI / 2} top={top} />
              <Person
                c={c}
                cam={cam}
                pose={mergePose(sp, { headYaw: z > -5 ? -0.5 * s : 0.3 * s, expression: "worried" })}
                position={[x, 0, z]}
                yaw={-s * Math.PI / 2}
                look={look}
                seconds={extraLeft(`of${z}${s}`) - c.t}
                seed={`of${z}${s}`}
                timerScale={0.7}
              />
            </group>
          );
        }),
      )}
    </group>
  );
};
const c3Office: ShotFn = (c) => {
  const Wz = -16 + Math.min(c.lt, 3.4) * 3.2;
  const W: V3 = [0, 0, Wz];
  const carry = mergePose(walker(c.lt, 0, 1.3, 0.55), { lShoulder: [1.0, 0.05], rShoulder: [1.0, 0.05], lElbow: 0.75, rElbow: 0.75, expression: "relief", headPitch: 0.05 });
  const l = handPosition(carry, "l", W);
  const r = handPosition(carry, "r", W);
  const box: V3 = [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2 + 0.05, (l[2] + r[2]) / 2 + 0.12];
  const cam = move({ position: [1.0, 5.4, 16], target: [0, 3.8, -10] }, { position: [0.8, 5.2, 13.5], target: [0, 3.8, -8] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={false} keyDir={[-0.9, 0.35, 0.1]} shadowSize={30} stars={false}>
      <OfficeFloor c={c} cam={cam} />
      <Person c={c} cam={cam} position={W} pose={carry} look={crowdLook(97)} seconds={days(3) + 25900 - c.t} seed="quit" />
      <DeskBox position={box} />
    </Shot>
  );
};

const KID = 0.68;

/** …with loved ones: a sunset picnic, grandpa (4 days) between his grandkids (80 years). */
const c3Picnic: ShotFn = (c) => {
  const cam = move({ position: [0.5, 4.0, 13.5], target: [0, 3.4, -12] }, { position: [0.2, 3.9, 12.2], target: [0, 3.45, -12] }, c);
  const g = groundSit({ headYaw: 0.15, expression: "smile", lShoulder: [0.2, 0.9], lElbow: 0.2 });
  const kid = (yaw: number) => groundSit({ headYaw: yaw, expression: "smile" });
  return (
    <Shot mood="sunset" camera={cam} fog={[40, 300]} shadowSize={20} keyDir={[0.2, 0.3, -1]}>
      <Ground color="#4F7A48" />
      <HillRing color="#3A5A42" radius={200} />
      <Skyline radius={170} count={18} seed="pic" arc={[Math.PI * 0.82, Math.PI * 1.18]} power={0.6} />
      <LeafyTree position={[-12, 0, -8]} scale={2.6} seed="p1" />
      <LeafyTree position={[13, 0, -12]} scale={2.4} seed="p2" />
      <Blanket position={[0, 0.01, 0]} w={7} d={5} />
      <mesh position={[0, 30, -400]}>
        <circleGeometry args={[30, 14]} />
        <Glow color="#FFD08A" fog={false} />
      </mesh>
      <Halo position={[0, 30, -399]} size={170} color="#FFB070" opacity={0.55} />
      <Sky t={c.t} tint="sunset" seed="pic" y={35} />
      <Person c={c} cam={cam} position={[0, 0, 0]} yaw={Math.PI} pose={g} look={{ ...crowdLook(77), hair: "#C8C8C8" }} seconds={days(4) + 20000 - c.t} seed="gpa" />
      {[
        { x: -1.95, yaw: -0.4, look: crowdLook(78), left: yrs(81) + 5000, seed: "k1" },
        { x: 1.95, yaw: 0.35, look: crowdLook(79), left: yrs(83) + 9000, seed: "k2" },
      ].map((k) => {
        const kp = kid(k.yaw);
        const hy = KID * headPosition(kp)[1];
        return (
          <React.Fragment key={k.seed}>
            <group scale={KID} position={[k.x, 0, 0.4]}>
              <Hero pose={kp} yaw={Math.PI} look={k.look} />
            </group>
            <Timer at={[k.x, hy + 1.45, 0.4]} face={cam.position} seconds={k.left - c.t} t={c.t} seed={k.seed} scale={0.62} />
          </React.Fragment>
        );
      })}
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 a world of timers (rain)

/** Life insurance: the sign flickers out, the shutter comes down, "CLOSED FOREVER". */
const c4Insurance: ShotFn = (c) => {
  const cam = move({ position: [-2.5, 4.4, 38], target: [-0.5, 6.0, 0] }, { position: [-2.2, 4.4, 34.5], target: [-0.5, 6.2, 0] }, c);
  const obs = at(c, "obsolete", 29, 31.06) - (c.t - c.lt);
  const signOn = c.lt < obs - 0.5 ? 1 : c.lt < obs + 0.2 ? 0.5 : 0;
  return (
    <Shot mood="overcast" camera={cam} fog={[40, 260]} shadowSize={40} light={1.2}>
      <Ground color={P.pavement} />
      <mesh position={[0, 0.02, 16]} receiveShadow>
        <BoxG args={[200, 0.06, 12]} />
        <Flat color={P.road} />
      </mesh>
      <InsuranceShop t={c.t} signOn={signOn} shutter={k01(c.lt, 0.2, 1.8)} closed={k01(c.lt, obs + 0.3, obs + 0.6)} />
      <Building position={[-30, 0, -10]} w={28} d={22} h={38} color={P.bldgNavy} seed="in1" power={0.4} />
      <Building position={[30, 0, -10]} w={28} d={22} h={26} color={P.bldgPurple} seed="in2" power={0.4} />
      {[
        { x: -9 + c.lt * 2.2, z: 7, yaw: Math.PI / 2, col: "#C8372D" },
        { x: 7 - c.lt * 2.0, z: 10.5, yaw: -Math.PI / 2, col: "#24748F" },
      ].map((p, i) => {
        const pose = mergePose(walker(c.lt, i, 1.5, 0.75), { headPitch: -0.3, lean: 0.12 });
        return <Person key={i} c={c} cam={cam} position={[p.x, 0, p.z]} yaw={p.yaw} pose={pose} look={{ ...crowdLook(110 + i), jacket: p.col }} seconds={extraLeft(`u${i}`) - c.t} seed={`u${i}`} timerScale={0.9} />;
      })}
      <Rain center={[-1, 8, 24]} size={[24, 18, 14]} t={c.t} count={500} />
    </Shot>
  );
};

/** Employers: a two-year timer gets a REJECTED stamp from a 39-year interviewer. */
const c4Interview: ShotFn = (c) => {
  const sp = seated();
  const top = seatTop(sp);
  const deskTop = top + 0.95;
  const I: V3 = [0, 0, -2.4];
  const C: V3 = [0, 0, 3.2];
  const down: V3 = [CV.x, deskTop + 0.62 + 0.16, CV.z];
  const up: V3 = [CV.x - 0.2, deskTop + 1.7, CV.z - 0.5];
  const slam = 1.05;
  const pUp = reachC(sp, "r", up, { position: I });
  const pDown = reachC(sp, "r", down, { position: I });
  const k = c.lt < 0.3 ? 0 : c.lt < slam - 0.15 ? ease((c.lt - 0.3) / (slam - 0.45)) : c.lt < slam ? 1 - ease((c.lt - slam + 0.15) / 0.15) : 0;
  const ipose = mergePose(c.lt < 0.3 ? pDown : lerpPose(pDown, pUp, k), { expression: c.lt > slam ? "smile" : "neutral", headPitch: -0.25 });
  const hand = handPosition(ipose, "r", I);
  const cpose = mergePose(sp, { expression: c.lt > slam + 0.1 ? "worried" : "neutral", headPitch: -0.15 });
  const cam = move({ position: [11.5, 6.4, 13.5], target: [0, 3.9, 0.4] }, { position: [10.6, 6.2, 12.4], target: [0, 3.9, 0.4] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={false} shadowSize={14} light={1.1} stars={false} shake={c.lt > slam && c.lt < slam + 0.15 ? 0.04 : 0}>
      <InterviewRoom t={c.t} deskTop={deskTop} stamped={c.lt > slam ? clamp01((c.lt - slam) / 0.1) : 0} />
      <SeatChair position={[I[0], 0, I[2] - 0.25]} top={top} color="#22283A" />
      <SeatChair position={[C[0], 0, C[2] + 0.25]} yaw={Math.PI} top={top} color="#5A6478" />
      <Person c={c} cam={cam} position={I} pose={ipose} look={suitLook(39)} seconds={yrs(39) + days(12) + 300 - c.t} seed="boss" />
      <Person c={c} cam={cam} position={C} yaw={Math.PI} pose={cpose} look={crowdLook(2)} seconds={yrs(2) + days(40) + 5000 - c.t} seed="cand" />
      <Stamp position={[hand[0], hand[1] - 0.78, hand[2]]} />
    </Shot>
  );
};

/** Relationships: a dating app where the timer is on every profile. */
const c4App: ShotFn = (c) => {
  const k = clamp01((c.lt - 0.2) / 1.7);
  const sp = seated();
  const tableTop = seatTop(sp) + 0.85;
  return (
    <PhoneCU c={c} at={[0.2, tableTop + 2.1, 4.2]} glow="#2A3A5A" screen={(w, h) => <DatingScreen w={w} h={h} k={k} t={c.t} />} stage={{ mood: "overcast", light: 0.8 }}>
      <Cafe t={c.t} tableTop={tableTop} />
    </PhoneCU>
  );
};

/** …choosing partners by how long they have left: 58 and 61 years. A match. */
const c4Date: ShotFn = (c) => {
  const sp = seated();
  const top = seatTop(sp);
  const tableTop = top + 0.85;
  const A: V3 = [-2.25, 0, 0];
  const B: V3 = [2.25, 0, 0];
  const look = c.lt > 0.3 && c.lt < 1.3;
  const happy = c.lt > 1.3;
  const pa = mergePose(sp, { headPitch: look ? 0.45 : 0.05, headYaw: 0, expression: happy ? "smile" : "neutral" });
  const pb = mergePose(sp, { headPitch: look ? 0.45 : 0.05, headYaw: 0, expression: happy ? "smile" : "awe" });
  const cam = move({ position: [0.5, 4.4, 17.5], target: [0, 3.7, 0] }, { position: [0.4, 4.3, 16.2], target: [0, 3.75, 0] }, c);
  const hk = clamp01((c.lt - 1.3) / 0.6);
  return (
    <Shot mood="overcast" camera={cam} fog={false} shadowSize={14} light={1.0} stars={false}>
      <Cafe t={c.t} tableTop={tableTop} />
      <SeatChair position={[A[0] - 0.25, 0, 0]} yaw={Math.PI / 2} top={top} color="#5A3E2E" />
      <SeatChair position={[B[0] + 0.25, 0, 0]} yaw={-Math.PI / 2} top={top} color="#5A3E2E" />
      <Person c={c} cam={cam} position={A} yaw={Math.PI / 2} pose={pa} look={crowdLook(22)} seconds={yrs(58) + days(30) + 100 - c.t} seed="da" timerScale={0.85} />
      <Person c={c} cam={cam} position={B} yaw={-Math.PI / 2} pose={pb} look={crowdLook(23)} seconds={yrs(61) + days(144) + 7000 - c.t} seed="db" timerScale={0.85} />
      {hk > 0 ? <Heart position={[0, 4.4 + hk * 1.0, 0.3]} scale={0.4 + 0.6 * Math.sin(Math.min(1, hk * 1.4) * Math.PI * 0.5)} opacity={1 - clamp01((c.lt - 2.6) / 0.4)} /> : null}
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 cheating fate (night)

const LAB_CAM_A: CameraSpec = { position: [2.8, 6.6, 23], target: [0, 5.0, -3] };
const LAB_CAM_B: CameraSpec = { position: [2.2, 6.3, 20], target: [0, 5.0, -3] };
const c5Lab: ShotFn = (c) => {
  const cam = move(LAB_CAM_A, LAB_CAM_B, c);
  const terr = at(c, "terrifying", 40, 43.34) - (c.t - c.lt);
  const k = clamp01((c.lt - terr + 0.6) / 0.6);
  return (
    <Shot mood="night" camera={cam} fog={false} shadowSize={20} light={0.5} stars={false}>
      <Lab t={c.t} ring={1} wall={drawLabWall(c.t, k)} />
      <Person c={c} cam={cam} position={[0, 0.3, 0]} pose={mergePose(REST, { lShoulder: [0.05, 0.4], rShoulder: [0.05, 0.4], expression: k > 0.5 ? "alarm" : "neutral" })} look={crowdLook(7)} seconds={yrs(41) + days(202) + 40000 - c.t} seed="subj" glitch={k > 0.5 ? 0.25 : 0} />
      <Person c={c} cam={cam} position={[-3.7, 0, 2.6]} yaw={0.8} pose={mergePose(REST, { expression: k > 0.5 ? "alarm" : "worried", headYaw: k > 0.5 ? -0.6 : 0 })} look={coatLook(crowdLook(41))} seconds={yrs(37) + 600 - c.t} seed="sci1" />
      <Person c={c} cam={cam} position={[3.8, 0, 2.4]} yaw={-0.8} pose={mergePose(REST, { rShoulder: [0.9, 0.0], rElbow: 1.2, expression: "worried" })} look={coatLook(crowdLook(42))} seconds={yrs(49) + 600 - c.t} seed="sci2" />
    </Shot>
  );
};

/** Can it be changed? The question goes up on the whiteboard; a scientist points at it. */
const BOARD = { x: -1.1, y: 4.4, w: 6.2, h: 3.4, z: -2.88 };
const c5Board: ShotFn = (c) => {
  const k = clamp01(c.lt / 2.3);
  const S: V3 = [3.1, 0, -1.6];
  const point = k01(c.lt, 0.2, 0.6);
  const pose = mergePose(REST, { headYaw: 0.75, expression: "worried", rShoulder: [1.2 * point + 0.05, 0.25 * point + 0.12], rElbow: 0.15 + 0.2 * (1 - point) });
  const cam = move({ position: [0.9, 4.4, 19], target: [0.6, 3.9, -2.5] }, { position: [0.8, 4.35, 17.2], target: [0.6, 3.9, -2.5] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} shadowSize={16} light={0.55} stars={false}>
      <RoomShell wall="#2A3450" floor="#141A2C" back={3} half={16} lights={false} />
      <mesh position={[BOARD.x, BOARD.y, BOARD.z - 0.07]}>
        <BoxG args={[BOARD.w + 0.4, BOARD.h + 0.4, 0.1]} />
        <Flat color="#B8C0CC" />
      </mesh>
      <CanvasPanel position={[BOARD.x, BOARD.y, BOARD.z]} w={BOARD.w} h={BOARD.h} draw={drawWhiteboard(k)} />
      <pointLight position={[0, 9, 4]} color="#E8EEF8" intensity={26} distance={20} decay={2} />
      <Person c={c} cam={cam} position={S} yaw={-Math.PI / 2 + 0.55} pose={pose} look={coatLook(crowdLook(43))} seconds={yrs(28) + 900 - c.t} seed="sci3" />
    </Shot>
  );
};

/** If you avoid a dangerous situation… head in the phone, a step off the curb, a bus roars past. */
const YOU: V3 = [15.6, 0, -2];
const youLeft = (t: number) => Math.max(0.4, 4.6 - (t - 47.1));
const c5Bus: ShotFn = (c) => {
  const step = c.lt < 0.6 ? k01(c.lt, 0, 0.6) : 1 - k01(c.lt, 0.66, 0.95);
  const P0: V3 = [YOU[0] - step * 2.3, 0, YOU[2]];
  const { pose, phone, rotation } = phoneStance(P0, -Math.PI / 2, { expression: c.lt > 0.66 ? "alarm" : "neutral", headPitch: c.lt > 0.66 ? 0.05 : -0.35, headYaw: c.lt > 0.66 ? 0.5 : 0 });
  const busZ = -75 + c.lt * 70;
  // Over the shoulder, looking across the road: the bus comes up the near lane and sweeps past in front of him.
  const cam = move({ position: [20, 5.2, 14], target: [10, 3.9, -12] }, { position: [19.6, 5.1, 12.8], target: [10, 3.9, -12] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[30, 200]} shadowSize={30} light={0.85} shake={Math.abs(busZ + 2) < 18 ? 0.05 : 0}>
      <BigStreet seed="night" cars={false} />
      <Person c={c} cam={cam} position={P0} yaw={-Math.PI / 2} pose={pose} look={crowdLook(50)} seconds={youLeft(c.t)} seed="you" />
      <group position={phone} rotation={rotation}>
        <Phone3D position={[0, 0, 0]} glow="#C9D2DE" />
      </group>
      {busZ < 60 ? <Bus position={[5.5, 0, busZ]} yaw={0} t={c.t} /> : null}
    </Shot>
  );
};

/** …does your timer increase? It glitches from one second to "?? years, recalculating". */
const c5Glitch: ShotFn = (c) => {
  const cam = move({ position: [9.4, 4.7, 3.0], target: [15.6, 4.15, -2] }, { position: [10.2, 4.65, 2.4], target: [15.6, 4.2, -2] }, c);
  const g = c.lt < 0.35 ? 0 : c.lt < 1.1 ? 0.35 : 0.1;
  const text = c.lt < 0.35 ? undefined : c.lt < 1.1 ? (Math.floor(c.lt * 12) % 2 ? { big: "41", unit: "YEARS", sub: "+ + + + +" } : undefined) : { big: "??", unit: "YEARS", sub: "RECALCULATING…" };
  return (
    <Shot mood="night" camera={cam} fog={[30, 200]} shadowSize={20} light={0.85}>
      <BigStreet seed="night" cars={false} />
      <Person
        c={c}
        cam={cam}
        position={YOU}
        yaw={-1.15}
        pose={mergePose(REST, { headPitch: 0.45, expression: c.lt > 1.1 ? "awe" : "alarm", rShoulder: [0.4, 0.1], rElbow: 1.1 })}
        look={crowdLook(50)}
        seconds={c.lt < 0.35 ? 1.2 : c.lt < 1.1 ? (Math.floor(c.lt * 12) % 2 ? yrs(41) : 1.2) : yrs(41)}
        glitch={g}
        text={text}
        seed="you"
        color={c.lt < 1.1 ? undefined : TONE.mid}
      />
      <pointLight position={[YOU[0] - 0.5, 5.4, YOU[2] + 0.5]} color={c.lt < 1.1 ? TONE.short : TONE.mid} intensity={6} distance={6} decay={2} />
    </Shot>
  );
};

/** Or was it already part of your fate? A giant hourglass over the night city. */
const c5Fate: ShotFn = (c) => {
  const cam = move({ position: [5, 3.0, 24], target: [0, 42, -150] }, { position: [4.4, 2.8, 20.5], target: [0, 44, -150] }, { ...c, dur: 4 });
  return (
    <Shot mood="night" camera={cam} fog={[60, 600]} shadowSize={40} light={0.6}>
      <Ground color="#1E2A3A" />
      <Skyline radius={240} count={34} seed="fate" arc={[Math.PI * 0.75, Math.PI * 1.25]} />
      <Skyline radius={70} count={8} seed="fate2" arc={[Math.PI * 0.62, Math.PI * 0.78]} />
      <Skyline radius={70} count={8} seed="fate3" arc={[Math.PI * 1.22, Math.PI * 1.38]} />
      <group position={[0, 0, -150]} scale={[50 / 85, 1, 50 / 85]}>
        <Hourglass position={[0, 0, 0]} scale={88} k={0.42 + c.lt * 0.02} t={c.t} />
      </group>
      <pointLight position={[0, 40, -110]} color="#FFB060" intensity={2000} distance={260} decay={2} />
      <Person c={c} cam={cam} position={[3, 0, 6]} yaw={Math.PI - 0.1} pose={mergePose(REST, { headPitch: 0.6, expression: "awe" })} look={crowdLook(50)} seconds={yrs(41)} text={{ big: "??", unit: "YEARS", sub: "RECALCULATING…" }} color={TONE.mid} seed="you" />
    </Shot>
  );
};

// ---------------------------------------------------------------- 06 the mirror (night bathroom)

const HB: V3 = [0, 0, MIRROR.z + MIRROR.counterD + 0.75];
const HB_YAW = Math.PI;

/** Slavoski's timer in the mirror chapter: 60 years, dropping to 10 seconds between "drops" and "ten". */
const mirrorLeft = (c: ShotCtx) => {
  const d0 = at(c, "drops", 54, 57.96);
  const d1 = at(c, "ten", 56, 59.74);
  const t = c.t;
  const hi = yrs(60) + days(14) + 3600 * 5;
  if (t < d0) return { sec: hi - t, glitch: 0 };
  if (t < d1) {
    const e = ease((t - d0) / (d1 - d0));
    return { sec: Math.exp(Math.log(hi) + (Math.log(10) - Math.log(hi)) * e), glitch: 0.12 };
  }
  return { sec: Math.max(0, 10 - (t - d1)), glitch: (10 - (t - d1)) % 1 > 0.9 ? 0.35 : 0 };
};

/** The bathroom and its reflection (the reflected set lives behind the mirror hole). */
const BathSet: React.FC<{ pose: Pose; lamp: number; position?: V3; reflection?: boolean }> = ({ pose, lamp, position = HB, reflection = true }) => (
  <>
    <Bathroom lamp={lamp} />
    <Hero pose={pose} position={position} yaw={HB_YAW} />
    <Mirrored>
      <Bathroom lamp={lamp} mirrorWall={false} />
      {reflection ? <Hero pose={pose} position={position} yaw={HB_YAW} /> : null}
    </Mirrored>
  </>
);

/** Timer floating over the reflected Slavoski (drawn outside the mirrored group so it reads correctly). */
const MirrorTimer: React.FC<{ c: ShotCtx; cam: CameraSpec; pose: Pose; position?: V3; sec: number; glitch: number; opacity?: number }> = ({ c, cam, pose, position = HB, sec, glitch, opacity = 1 }) => {
  const head = reflect(headPosition(pose, position, HB_YAW));
  return <Timer at={[head[0], head[1] + (TIMER_Y - 3.5), head[2]]} face={cam.position} seconds={sec} t={c.t} glitch={glitch} seed="mir" opacity={opacity} />;
};

const c6Mirror: ShotFn = (c) => {
  const walkK = clamp01(c.lt / 1.0);
  const pos: V3 = [HB[0], 0, HB[2] + (1 - walkK) * 1.8];
  const pose = walkK < 1 ? mergePose(walker(c.lt, 0, 1.0, 0.5), { expression: "neutral" }) : mergePose(REST, { expression: "neutral", headPitch: 0.05 });
  const cam = move({ position: [3.6, 4.6, 10], target: [0, 4.5, -3] }, { position: [3.2, 4.55, 8.8], target: [0, 4.55, -3] }, c);
  const { sec, glitch } = mirrorLeft(c);
  return (
    <Shot mood="night" camera={cam} fog={false} shadowSize={14} light={0.45} stars={false}>
      <BathSet pose={pose} lamp={1} position={pos} />
      <MirrorTimer c={c} cam={cam} pose={pose} position={pos} sec={sec} glitch={glitch} opacity={clamp01((c.lt - 0.6) / 0.4)} />
    </Shot>
  );
};

/** Drops from sixty years… to ten seconds: push into the reflection. */
const c6Drop: ShotFn = (c) => {
  const { sec, glitch } = mirrorLeft(c);
  const short = sec < 3600 * 24 * 365;
  const pose = mergePose(REST, { expression: short ? "alarm" : "worried", headPitch: 0.15 });
  const cam = move({ position: [1.6, 4.95, 5.2], target: [0, 4.7, -4.75] }, { position: [1.2, 5.0, 4.0], target: [0, 4.75, -4.75] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} shadowSize={14} light={0.45} stars={false} shake={glitch > 0 ? 0.015 : 0}>
      <BathSet pose={pose} lamp={glitch > 0 && Math.floor(c.t * 14) % 3 === 0 ? 0.3 : 1} />
      <MirrorTimer c={c} cam={cam} pose={pose} sec={sec} glitch={glitch} />
      <pointLight position={reflect([0, 5.3, HB[2] + 0.6])} color={toneFor(sec)} intensity={5} distance={5} decay={2} />
    </Shot>
  );
};

/** Ten seconds: his face, from the mirror's side, lit red by the timer above. */
const c6Face: ShotFn = (c) => {
  const { sec, glitch } = mirrorLeft(c);
  const pose = mergePose(REST, { expression: "alarm", headPitch: 0.05 });
  // From the mirror's side (the camera stands in the reflected room, looking out through the mirror).
  const cam = move({ position: [0.45, 4.3, -8.4], target: [0, 3.95, HB[2]] }, { position: [0.4, 4.3, -7.6], target: [0, 3.95, HB[2]] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} shadowSize={14} light={0.4} stars={false}>
      <BathSet pose={pose} lamp={0.8} reflection={false} />
      <Timer at={[HB[0], TIMER_Y, HB[2]]} face={cam.position} seconds={sec} t={c.t} glitch={glitch} seed="real" />
      <pointLight position={[0, 5.2, HB[2] - 0.8]} color={TONE.short} intensity={10} distance={6} decay={2} />
    </Shot>
  );
};

/** …no idea why: wide, the light flickering, Slavoski looking around. */
const c6Why: ShotFn = (c) => {
  const { sec, glitch } = mirrorLeft(c);
  const flick = random(`fl${Math.floor(c.t * 9)}`) < 0.3 ? 0.15 : 1;
  const pose = mergePose(REST, { expression: "worried", headYaw: Math.sin(c.lt * 2.6) * 0.7, lShoulder: [0.3, 0.6], rShoulder: [0.3, 0.6], lElbow: 0.8, rElbow: 0.8 });
  const cam = move({ position: [-4.4, 10.2, 10], target: [0, 3.9, -1.6] }, { position: [-4.0, 9.9, 9.2], target: [0, 3.9, -1.6] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} shadowSize={16} light={0.35 * (0.5 + flick * 0.5)} stars={false}>
      <BathSet pose={pose} lamp={flick} />
      <Timer at={[HB[0], TIMER_Y, HB[2]]} face={cam.position} seconds={sec} t={c.t} glitch={glitch} seed="real" />
      <MirrorTimer c={c} cam={cam} pose={pose} sec={sec} glitch={glitch} />
      <pointLight position={[0, 5.2, HB[2] + 0.5]} color={TONE.short} intensity={9} distance={7} decay={2} />
    </Shot>
  );
};

/** Would you rather know…: a slow push on the reflection, the seconds running out. */
const c6Know: ShotFn = (c) => {
  const { sec, glitch } = mirrorLeft(c);
  const pose = mergePose(REST, { expression: "awe", headPitch: 0.1 });
  const cam = move({ position: [3.4, 4.7, 8.6], target: [0, 4.6, -4.75] }, { position: [2.8, 4.8, 7.0], target: [0, 4.65, -4.75] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} shadowSize={14} light={0.4} stars={false}>
      <BathSet pose={pose} lamp={0.7} />
      <MirrorTimer c={c} cam={cam} pose={pose} sec={sec} glitch={glitch} />
      <pointLight position={reflect([0, 5.3, HB[2] + 0.6])} color={TONE.short} intensity={6} distance={6} decay={2} />
    </Shot>
  );
};

/** …or live without ever knowing? The timer shatters, the warm light comes back. */
const c6Never: ShotFn = (c) => {
  const live = at(c, "live", 63, 66.6) - (c.t - c.lt);
  const k = clamp01((c.lt - live) / 1.2);
  const { sec } = mirrorLeft(c);
  const pose = mergePose(REST, { expression: k > 0.3 ? "relief" : "awe", headPitch: 0.1 });
  const cam = move({ position: [3.0, 4.6, 8.0], target: [0, 4.55, -3.5] }, { position: [3.8, 4.7, 10.5], target: [0, 4.5, -3] }, { ...c, dur: 4 });
  const head = reflect(headPosition(pose, HB, HB_YAW));
  const tAt: V3 = [head[0], head[1] + (TIMER_Y - 3.5), head[2]];
  return (
    <Shot mood="night" camera={cam} fog={false} shadowSize={14} light={0.4 + k * 0.35} stars={false}>
      <BathSet pose={pose} lamp={0.7 + k * 0.5} />
      {k <= 0 ? <MirrorTimer c={c} cam={cam} pose={pose} sec={sec} glitch={0} /> : null}
      <TimerShards at={tAt} k={k} color={TONE.short} />
      <pointLight position={[0, 6, 3]} color="#FFD8A0" intensity={12 * k} distance={14} decay={2} />
    </Shot>
  );
};

// ---------------------------------------------------------------- thumbnail

/** Shorts cover: Slavoski on the sunny street, looking up in alarm at his red 00:00:47. */
export const thumbShot: ShotFn = () => {
  const cam: CameraSpec = { position: [17.0, 2.2, 13.0], target: [16, 5.6, 4] };
  const c: ShotCtx = { lt: 1, dur: 2, t: 9.0, words: [], width: 1080, height: 1920 };
  return (
    <Shot mood="day" camera={cam} keyDir={MORNING_KEY} fog={[40, 300]} shadowSize={20}>
      <BigStreet seed="yours" day lamps={false} />
      <Sky t={0} tint="day" seed="yours" y={50} />
      <Person c={c} cam={cam} position={SL} pose={mergePose(REST, { headPitch: 0.5, expression: "alarm", lShoulder: [0.15, 0.35], rShoulder: [0.15, 0.35] })} seconds={47} seed="slav" timerScale={1.15} />
      <pointLight position={[SL[0], 5.3, SL[2] + 0.8]} color={TONE.short} intensity={8} distance={6} decay={2} />
    </Shot>
  );
};

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldTimer },
    { cue: "above everyone's", fn: coldStreet },
    { cue: "Your friend", fn: coldFriend },
    { cue: "Your neighbor", fn: coldNeighbour },
    { cue: "but yours", fn: coldYours },
    { cue: "seconds", fn: coldTick },
    { cue: "What would happen", fn: coldCity },
    { cue: "see exactly", fn: coldCross },
  ],
  c1: [
    { cue: null, fn: c1Chaos },
    { cue: "descend", fn: c1Above },
  ],
  c2: [
    { cue: null, fn: c2Roof },
    { cue: "believing", fn: c2Road },
  ],
  c3: [
    { cue: null, fn: c3Office },
    { cue: "and spend", fn: c3Picnic },
  ],
  c4: [
    { cue: null, fn: c4Insurance },
    { cue: "Employers", fn: c4Interview },
    { cue: "Even relationships", fn: c4App },
    { cue: "people choosing", fn: c4Date },
  ],
  c5: [
    { cue: null, fn: c5Lab },
    { cue: "Can the countdown", fn: c5Board },
    { cue: "If you avoid", fn: c5Bus },
    { cue: "does your timer", fn: c5Glitch },
    { cue: "Or was your", fn: c5Fate },
  ],
  c6: [
    { cue: null, fn: c6Mirror },
    { cue: "Your countdown", fn: c6Drop },
    { cue: "ten seconds", fn: c6Face },
    { cue: "and you have", fn: c6Why },
    { cue: "Would you rather", fn: c6Know },
    { cue: "or live", fn: c6Never },
  ],
};

