/**
 * Shots for "What If Minecraft Mobs Spawned in Real Life?" (ep. 8).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * Arc: sunny afternoon → sunset → night (street, bedroom, hallway) → the boss over a burning city →
 * sunrise → a clear morning. The hiss and the boom are sound effects with on-screen sound words.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Building, Car, CityGrid, StreetSet, streetLayout } from "../../slavoski/city";
import { crowdLook } from "../../slavoski/hero";
import { Fireball, Debris, LavaCrack, Shockwave, SmokeCluster } from "../../slavoski/fx";
import { Halo } from "../../slavoski/materials";
import { Clouds } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { CardLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import { groundedBob, Hero, mergePose, reach, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { FacetedMoon } from "../../slavoski/space";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import { wordAt, type CuedShot } from "../../slavoski/timeline";
import { Bedroom } from "../smart-animals/props";
import { CITY } from "../ww3-countdown/props";
import {
  Altar,
  ArrowFlight,
  AshPile,
  Boss,
  Flames,
  Flash,
  GiantSpider,
  Hallway,
  Hisser,
  HISSER,
  Motes,
  Poof,
  pop,
  runPose,
  Skeleton,
  SkullShot,
  SOOTY,
  SoundWord,
  Suburb,
  SunDisc,
  TALL,
  TallOne,
  ZOMBIE,
  zombiePose,
} from "./props";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
const startFrame = (c: ShotCtx) => Math.round((c.t - c.lt) * 30);

/** Moments that are sound effects, not words: the two hisses, the boom and the final bang. */
export const beats = (words: Caption[]) => {
  const lastEnd = words.length ? words[words.length - 1].endMs / 1000 : 58;
  return {
    hiss: wordAt(words, "a creeper", 5, 6.88) - 1.05,
    boom: wordAt(words, "Your", 9, 9.66) - 0.95,
    hiss2: wordAt(words, "Because", 50, 54.28) - 1.12,
    bang: lastEnd + 0.22,
  };
};

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

const CLOUD = { day: "#F4F6FA", dawn: "#E6C2C8", sunset: "#F7B890", night: "#3A4060", dust: "#5A4A50" } as const;
const Sky: React.FC<{ t: number; tint: keyof typeof CLOUD; y?: number; radius?: number; count?: number; seed?: string }> = ({ t, tint, y = 45, radius = 200, count = 16, seed = "sky" }) => (
  <Clouds t={t} color={CLOUD[tint]} y={y} radius={radius} count={count} seed={seed} />
);

type MobKind = "z" | "s" | "h";
/** One mob standing or walking at hero scale. */
const Mob: React.FC<{ kind: MobKind; position: V3; yaw?: number; scale?: number; phase?: number; seed?: number; vanish?: number }> = ({ kind, position, yaw = 0, scale = 1, phase = 0, seed = 0, vanish = 0 }) => {
  if (scale <= 0) return null;
  if (kind === "z") return <Hero pose={zombiePose(phase + seed * 0.37)} position={position} yaw={yaw} scale={scale} look={ZOMBIE} vanish={vanish} />;
  if (kind === "s") return <Skeleton position={position} yaw={yaw} scale={scale} walk={phase + seed * 0.37} />;
  return <Hisser position={position} yaw={yaw} scale={scale} walk={phase * 1.6 + seed * 0.37} />;
};

// ---------------------------------------------------------------- cold open: they spawn

const SPAWN: { kind: MobKind; p: V3; at: number }[] = [
  { kind: "z", p: [-2.0, 0, 4], at: 0.15 },
  { kind: "s", p: [3.2, 0, -1], at: 0.5 },
  { kind: "h", p: [0.2, 0, -8], at: 0.85 },
];

/** 0 s: an ordinary sunny street… pop, pop, pop. */
const coldSpawn: ShotFn = (c) => {
  const cam = move({ position: [3, 3.0, 23], target: [0.4, 3.0, 0] }, { position: [2.4, 3.0, 20.5], target: [0.4, 3.1, 0] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 320]} shadowSize={34}>
      <BigStreet seed="mc" day cars={false} />
      <Sky t={c.t} tint="day" seed="mc" />
      <group scale={CITY}>
        <Car position={[2.4, 0, -7.5]} yaw={Math.PI} color={P.carTeal} lights={false} />
        <Car position={[-2.4, 0, -13]} color={P.carRed} lights={false} />
      </group>
      <Hero pose={mergePose(walkPose(c.lt * 1.5, c.lt < 0.3 ? 0.8 : 0), { expression: c.lt > 0.3 ? "alarm" : "neutral", headYaw: c.lt > 0.3 ? 0.5 : 0 })} position={[4.4, 0, 1 - Math.min(c.lt, 0.3) * 2]} yaw={Math.PI} look={crowdLook(4)} />
      {SPAWN.map((m, i) => (
        <React.Fragment key={i}>
          <Mob kind={m.kind} position={m.p} scale={pop(c.lt, m.at)} phase={Math.max(0, c.lt - m.at) * 1.1} seed={i} />
          <Poof position={m.p} k={(c.lt - m.at) / 0.45} size={1.2} seed={`sp${i}`} />
        </React.Fragment>
      ))}
    </Shot>
  );
};

/** From above: dozens more pop in all the way down the street. The title lands here. */
const coldCity: ShotFn = (c) => {
  const cam = move({ position: [9, 40, 36], target: [0, 0, -22] }, { position: [8, 37, 32], target: [0, 0, -24] }, c);
  const mobs = Array.from({ length: 22 }, (_, i) => {
    const lane = (i % 4) - 1.5;
    const x = lane * 5.6 + (random(`cc${i}x`) - 0.5) * 2.2;
    const z = 12 - i * 3.6 - random(`cc${i}z`) * 2;
    return { kind: (["z", "s", "h", "z"] as MobKind[])[i % 4], p: [x, 0, z] as V3, at: 0.05 + random(`cc${i}t`) * 1.1 };
  });
  return (
    <Shot mood="day" camera={cam} fog={[70, 320]} shadowSize={60}>
      <BigStreet seed="mc" day cars={false} />
      {mobs.map((m, i) => (
        <React.Fragment key={i}>
          <Mob kind={m.kind} position={m.p} scale={pop(c.lt, m.at) * 1.25} phase={Math.max(0, c.lt - m.at) * 1.1} seed={i} />
          <Poof position={m.p} k={(c.lt - m.at) / 0.45} size={1.5} seed={`cp${i}`} />
        </React.Fragment>
      ))}
    </Shot>
  );
};

// Slavoski's walk down his own street. He stops at STOP when the hiss starts.
const WALK_X = 6.2;
const STOP_Z = 0.8;
const walkZ = (t: number, hiss: number) => STOP_Z - Math.max(0, hiss - t) * 2.2;
const hisserSpot = (): V3 => [WALK_X + 0.75, 0, STOP_Z - 1.75];

const coldWalk: ShotFn = (c) => {
  const { hiss } = beats(c.words);
  const z = walkZ(c.t, hiss);
  const cam: CameraSpec = { position: [WALK_X - 3.2, 3.1, z + 13.5 - c.lt * 0.5], target: [WALK_X, 2.9, z] };
  return (
    <Shot mood="day" camera={cam} fog={[70, 360]} shadowSize={26}>
      <Suburb />
      <Sky t={c.t} tint="day" seed="sub" />
      <Hero pose={mergePose(walkPose(c.t * 1.5, 0.9), { expression: "smile" })} position={[WALK_X, 0, z]} />
    </Shot>
  );
};

/** He stops. Something tall and green is right behind him. */
const coldHiss: ShotFn = (c) => {
  const { hiss } = beats(c.words);
  const z = walkZ(c.t, hiss);
  const since = c.t - hiss;
  const cam: CameraSpec = { position: [WALK_X + 0.9, 3.7, z + 10.6 - c.lt * 0.6], target: [WALK_X + 0.3, 3.5, z] };
  const pose = since < 0 ? mergePose(walkPose(c.t * 1.5, 0.9), { expression: "smile" }) : mergePose(REST, { expression: since > 0.25 ? "alarm" : "neutral", lShoulder: [0.1, 0.5 * k01(since, 0.25, 0.45)], rShoulder: [0.1, 0.5 * k01(since, 0.25, 0.45)] });
  return (
    <Shot mood="day" camera={cam} fog={[70, 360]} shadowSize={26} shake={since > 0 ? 0.03 : 0} overlay={<SoundWord text="SSSSSSSS!" k={since - 0.05} />}>
      <Suburb />
      <Sky t={c.t} tint="day" seed="sub" />
      <Hero pose={pose} position={[WALK_X, 0, z]} />
      <Hisser position={hisserSpot()} scale={pop(since, 0)} tilt={0.08} />
      <Poof position={hisserSpot()} k={since / 0.45} size={1.2} seed="h1" />
    </Shot>
  );
};

/** He turns… it swells and flashes… BOOM. */
const coldTurn: ShotFn = (c) => {
  const { boom } = beats(c.words);
  const since = c.t - boom;
  if (since >= 0) {
    const cam = move({ position: [-3.5, 4, 18], target: [12, 6, 0] }, { position: [-4.2, 4.2, 19.5], target: [12, 7, 0] }, c);
    return (
      <Shot mood="day" camera={cam} fog={[70, 360]} shadowSize={40} shake={0.7 * (1 - clamp01(since / 1.1))} dust={0.25 * clamp01(since / 0.6)} overlay={<><SoundWord text="BOOM!" k={since} color={P.amber} size={170} y={420} jitter={12} /><Flash k={1 - since / 0.14} /></>}>
        <Suburb gone={[1, 1]} />
        <Fireball position={[12, 0.5, 0]} progress={since / 1.25} radius={11} seed="boom" />
        <Shockwave position={[12, 0.3, 0]} progress={since / 0.7} radius={26} />
        <Debris origin={[15, 4, 0]} t={since} count={44} speed={17} seed="hs" color="#E8DCC4" />
        <Debris origin={[14, 6, 0]} t={since} count={18} speed={20} seed="rf" color="#566270" />
        <SmokeCluster position={[14, 1, 0]} progress={clamp01(since / 2.2)} radius={6} rise={9} count={12} seed="bs" />
      </Shot>
    );
  }
  const z = STOP_Z;
  const turn = k01(c.lt, 0.05, 0.4);
  const swell = k01(c.lt, 0.35, boom - (c.t - c.lt));
  const blink = Math.sin(c.lt * c.lt * 22) > 0 ? 1 : 0;
  const cam = move({ position: [-6.5, 3.4, 0.6], target: [WALK_X + 0.3, 3.2, z - 1.1] }, { position: [-5.4, 3.4, 0.4], target: [WALK_X + 0.3, 3.3, z - 1.1] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[70, 360]} shadowSize={26} shake={0.05 + swell * 0.16}>
      <Suburb />
      <Hero pose={mergePose(REST, { expression: "alarm", headYaw: -turn * 0.4, twist: -turn * 0.2, lShoulder: [0.2, 0.9], rShoulder: [0.2, 0.9], lElbow: 1.2, rElbow: 1.2, lean: -0.12 * swell })} position={[WALK_X, 0, z]} yaw={-turn * 2.5} />
      <Hisser position={hisserSpot()} swell={swell} flash={swell > 0.05 ? blink : 0} tilt={0.08} />
    </Shot>
  );
};

const SOOT_AT: V3 = [5.5, 0, 3.6];
/** The dust settles: his neighbour's house is a smoking hole. The mailbox survived. */
const coldGone: ShotFn = (c) => {
  const cam = move({ position: [-6, 7.5, 14], target: [11, 2, 0.5] }, { position: [-4.4, 6.8, 12.6], target: [11.5, 2, 0.5] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 340]} shadowSize={34} dust={0.3}>
      <Suburb gone={[1, 1]} />
      <Sky t={c.t} tint="day" seed="sub" />
      <SmokeCluster position={[15, 0.5, 0]} progress={0.55 + c.lt * 0.08} radius={5} rise={12} count={12} seed="bs" />
      <SmokeCluster position={[SOOT_AT[0], 4.3, SOOT_AT[2]]} progress={0.3 + c.lt * 0.15} radius={0.5} rise={1.6} count={4} seed="hair" />
      <Hero pose={mergePose(REST, { expression: "alarm", lShoulder: [0.05, 0.3], rShoulder: [0.05, 0.3] })} position={SOOT_AT} yaw={Math.PI / 2 - 0.25} look={SOOTY} />
    </Shot>
  );
};

const coldFace: ShotFn = (c) => {
  const cam = move({ position: [1.4, 4.0, 9.2], target: [SOOT_AT[0], 3.75, SOOT_AT[2]] }, { position: [1.9, 4.0, 8.4], target: [SOOT_AT[0], 3.8, SOOT_AT[2]] }, c);
  const blinkAt = c.lt > 0.35 && c.lt < 0.5 ? 1 : c.lt > 0.7 && c.lt < 0.82 ? 1 : 0;
  return (
    <Shot mood="day" camera={cam} fog={[60, 340]} shadowSize={14} dust={0.3 + c.lt * 0.15}>
      <Suburb gone={[1, 1]} />
      <SmokeCluster position={[15, 0.5, 0]} progress={0.7 + c.lt * 0.08} radius={5} rise={12} count={12} seed="bs" />
      <SmokeCluster position={[SOOT_AT[0], 4.3, SOOT_AT[2]]} progress={0.5 + c.lt * 0.15} radius={0.5} rise={1.6} count={4} seed="hair" />
      <Hero pose={mergePose(REST, { expression: "worried", blink: blinkAt })} position={SOOT_AT} yaw={-0.68} look={SOOTY} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 sunset

const sunSet: ShotFn = (c) => {
  const cam = move({ position: [0, 17, 46], target: [0, 15, -80] }, { position: [0, 16, 42], target: [0, 13, -80] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[80, 520]} shadowSize={60}>
      <BigStreet seed="mc" lampsOn={c.lt > 0.7} />
      <Sky t={c.t} tint="sunset" seed="set" y={52} radius={260} />
      <SunDisc position={[0, 22 - c.lt * 7, -420]} r={30} color="#FFD08A" glow="#FF8A3A" />
    </Shot>
  );
};

const ROW: V3[] = [
  [-7.5, 0, -3],
  [-2.2, 0, -1],
  [3.2, 0, -4],
  [8, 0, -2],
  [-5, 0, -13],
  [0.6, 0, -15],
  [6, 0, -12],
  [-9, 0, -24],
  [-2.5, 0, -26],
  [4, 0, -23],
  [9.5, 0, -27],
];
/** Street level at dusk: they rise out of the long shadows and shuffle toward us. */
const zombieRise: ShotFn = (c) => {
  const cam = move({ position: [0.6, 2.4, 17], target: [0, 3.0, -6] }, { position: [0.4, 2.4, 15], target: [0, 3.1, -6] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[40, 300]} shadowSize={36} light={0.85}>
      <BigStreet seed="mc" cars={false} />
      <Sky t={c.t} tint="sunset" seed="set" />
      {ROW.map((p, i) => {
        const at = i * 0.07;
        return (
          <React.Fragment key={i}>
            <Mob kind="z" position={[p[0], 0, p[2] + Math.max(0, c.lt - at) * 1.5]} scale={pop(c.lt, at)} phase={c.lt * 0.9} seed={i} />
            <Poof position={p} k={(c.lt - at) / 0.45} seed={`zr${i}`} color="#F7D0B0" />
          </React.Fragment>
        );
      })}
    </Shot>
  );
};

const zombieCity: ShotFn = (c) => {
  const cam = move({ position: [12, 46, 30], target: [0, 0, -28] }, { position: [10, 42, 26], target: [0, 0, -30] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[70, 320]} shadowSize={64} light={0.7}>
      <BigStreet seed="mc" cars={false} />
      {Array.from({ length: 40 }, (_, i) => {
        const x = ((i % 5) - 2) * 4.6 + (random(`zc${i}x`) - 0.5) * 2;
        const z = 14 - Math.floor(i / 5) * 9 - random(`zc${i}z`) * 5;
        return <Mob key={i} kind="z" position={[x, 0, z + c.lt * 1.5]} phase={c.lt * 0.9} seed={i} scale={1.25} />;
      })}
    </Shot>
  );
};

/** Blue hour: an archer draws. */
const skelAim: ShotFn = (c) => {
  const cam = move({ position: [-5.5, 3.2, 8.5], target: [0.3, 2.9, 0.4] }, { position: [-4.6, 3.2, 7.4], target: [0.3, 3.0, 0.4] }, c);
  const aim = k01(c.lt, 0.05, 0.75);
  const loosed = c.lt > 0.98;
  return (
    <Shot mood="night" camera={cam} fog={[40, 260]} shadowSize={24} light={1.15}>
      <BigStreet seed="mc" cars={false} />
      <Skeleton position={[0, 0, 0]} yaw={0.15} aim={aim} arrow={!loosed} />
      <Skeleton position={[4.5, 0, -5]} yaw={0.1} aim={k01(c.lt, 0.3, 1.0)} />
      <Skeleton position={[-5, 0, -9]} yaw={0.2} aim={k01(c.lt, 0.4, 1.1)} />
      {loosed ? <ArrowFlight from={[-0.2, 2.95, 1.6]} to={[4, 3.2, 60]} progress={(c.lt - 0.98) / 0.9} arc={1} /> : null}
    </Shot>
  );
};

const ARROWS: { to: V3; at: number }[] = [
  { to: [-3.5, 0, -9], at: 0.1 },
  { to: [3.6, 0, -4], at: 0.35 },
  { to: [-1.2, 0, -1], at: 0.6 },
  { to: [5.0, 0, 3], at: 0.85 },
  { to: [-4.4, 0, 5], at: 1.1 },
  { to: [2.2, 0, 8.5], at: 1.35 },
];
/** Anyone outside: Slavoski sprints up the road while arrows thud into the tarmac around him. */
const arrowsRun: ShotFn = (c) => {
  const hz = -12 + c.lt * 8.5;
  const cam: CameraSpec = { position: [2.2, 3.0, hz + 15.5], target: [0.3, 2.9, hz - 1] };
  return (
    <Shot mood="night" camera={cam} fog={[40, 260]} shadowSize={30} light={1.15} shake={0.04}>
      <BigStreet seed="mc" cars={false} />
      <Hero pose={runPose(c.lt * 2.6)} position={[0.6, 0, hz]} />
      {[-6, 0, 6].map((x, i) => (
        <Skeleton key={i} position={[x, 0, -46 - i * 2]} aim={1} arrow={false} />
      ))}
      {ARROWS.map((a, i) => (
        <ArrowFlight key={i} from={[a.to[0] * 0.6, 3, -44]} to={[a.to[0], 0.05, a.to[2]]} progress={(c.lt - a.at) / 0.55} arc={7} />
      ))}
    </Shot>
  );
};

/** The size of cars: one stalks down the lane beside a parked car. */
const spiderCar: ShotFn = (c) => {
  const cam = move({ position: [-1, 3.6, 31], target: [0, 3.2, -4] }, { position: [-0.4, 3.4, 28], target: [0, 3.4, -4] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[40, 260]} shadowSize={34} light={1.35}>
      <BigStreet seed="mc" cars={false} />
      <group scale={CITY}>
        <Car position={[1.5, 0, -1.2]} yaw={Math.PI} color={P.carRed} lights={false} />
      </group>
      <GiantSpider position={[-4.6, 0, -9 + c.lt * 3.2]} scale={2.4} t={c.lt} speed={1.5} />
      <GiantSpider position={[2, 0, -44 + c.lt * 3.2]} scale={2.4} t={c.lt + 0.3} speed={1.5} />
    </Shot>
  );
};

/** …and up the towers. */
const spiderClimb: ShotFn = (c) => {
  const cam = move({ position: [6, 2.2, 46], target: [0, 26, -3] }, { position: [5.4, 2.2, 43], target: [0, 28, -3] }, c);
  const wallZ = -3 + 0.2;
  const climbers: [number, number, number][] = [
    [-5, 14, 0],
    [5.5, 28, 0.4],
    [-1, 44, 0.7],
  ];
  return (
    <Shot mood="night" camera={cam} fog={[60, 420]} shadowSize={50} light={1.35}>
      <group scale={CITY}>
        <Building position={[0, 0, -10 / CITY]} w={6.4} d={4} h={22} color={P.bldgNavy} seed="tower" litRatio={0.5} />
        <Building position={[-8.5, 0, -6]} w={5} d={4} h={13} color={P.bldgPurple} seed="tl" />
        <Building position={[8.5, 0, -7]} w={5} d={4} h={16} color={P.bldgTeal} seed="tr" />
        <Building position={[-4, 0, -14]} w={6} d={4} h={28} color={P.bldgSlate} seed="tb" />
        <Building position={[6, 0, -16]} w={6} d={4} h={25} color={P.bldgPurple} seed="tb2" />
      </group>
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshLambertMaterial color={P.pavement} flatShading />
      </mesh>
      <FacetedMoon radius={16} position={[-34, 92, -150]} />
      <Halo position={[-34, 92, -148]} size={70} color="#C9D4FF" opacity={0.25} />
      {climbers.map(([x, y, ph], i) => (
        <group key={i} position={[x, y + c.lt * 3.4, wallZ]} rotation={[Math.PI / 2, 0, 0]}>
          <group rotation={[0, Math.PI, 0]}>
            <GiantSpider scale={1.7} t={c.lt + ph} speed={1.5} />
          </group>
        </group>
      ))}
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 nowhere to hide

const HOME_Z = 18;
const DOOR: V3 = [10.4, 0, HOME_Z];
/** He bolts for his own front door with the street filling up behind him. */
const houseOut: ShotFn = (c) => {
  const k = clamp01(c.lt / 0.75);
  const pos: V3 = [6.2 + (DOOR[0] - 6.2) * k, 0, 15.5 + (DOOR[2] - 15.5) * k];
  const cam = move({ position: [-8, 3.0, 29], target: [8, 3.2, 17.5] }, { position: [-7, 3.0, 27.5], target: [8.6, 3.2, 17.5] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[50, 300]} shadowSize={30} light={1.1}>
      <Suburb gone={[1, 1]} lit />
      <Hero pose={runPose(c.lt * 2.6)} position={pos} yaw={1.05} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Mob key={i} kind="z" position={[-3 + i * 1.9, 0, 12.5 - i * 2.6 + c.lt * 1.2]} phase={c.lt * 0.9} seed={i} yaw={0.5} />
      ))}
    </Shot>
  );
};

const ROOM_HERO: V3 = [-1.0, 0, 0.9];
const ROOM_TALL: V3 = [-3.5, 0, -1.7];
const roomLight = (flicker = 1) => <pointLight position={[-1, 4.5, 3]} color="#C8D0FF" intensity={10 * flicker} distance={16} decay={2} />;

/** Door shut. Bedroom. Safe. */
const bedSafe: ShotFn = (c) => {
  const cam = move({ position: [3.0, 4.0, 10.5], target: [-1.6, 3.0, -1] }, { position: [2.4, 3.9, 9.2], target: [-1.6, 3.1, -1] }, c);
  const wipe = k01(c.lt, 0.3, 0.8);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={12} light={0.6}>
      <Bedroom lampOn />
      {roomLight()}
      <Hero pose={mergePose(REST, { expression: "relief", lean: -0.06, rShoulder: [1.9 * wipe, 0.25], rElbow: 2.0 * wipe, headPitch: 0.1 })} position={ROOM_HERO} yaw={0.25} />
    </Shot>
  );
};

const thinkAgain: ShotFn = (c) => {
  const cam = move({ position: [-0.2, 3.9, 6.6], target: [ROOM_HERO[0], 3.75, ROOM_HERO[2]] }, { position: [-0.4, 3.9, 5.6], target: [ROOM_HERO[0], 3.78, ROOM_HERO[2]] }, c);
  const k = k01(c.lt, 0.25, 0.7);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={8} light={0.6 - k * 0.2}>
      <Bedroom lampOn />
      {roomLight(1 - k * 0.5)}
      <pointLight position={[-3.5, 4, 1]} color="#D36BFF" intensity={k * 22} distance={10} decay={2} />
      <Hero pose={mergePose(REST, { expression: k > 0.5 ? "worried" : "relief", headYaw: 0 })} position={ROOM_HERO} yaw={0.1} />
      <Motes center={[-1.6, 3.6, 1.6]} t={c.t} count={22} spread={[2.2, 2.6, 1.2]} seed="warn" opacity={k} />
    </Shot>
  );
};

/** A violet crack of light, and it is simply there. */
const teleportIn: ShotFn = (c) => {
  const cam = move({ position: [3.4, 4.3, 11], target: [-2.2, 3.3, -1.2] }, { position: [2.8, 4.2, 9.8], target: [-2.3, 3.4, -1.2] }, c);
  const at = 0.22;
  const turn = k01(c.lt, 0.7, 1.05);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={12} light={0.42} overlay={<Flash k={(1 - Math.abs(c.lt - at) / 0.1) * 0.75} color="#E9B8FF" />}>
      <Bedroom lampOn />
      {roomLight(0.5)}
      <pointLight position={[ROOM_TALL[0], 4, ROOM_TALL[2] + 1.5]} color="#D36BFF" intensity={c.lt > at ? 26 : 0} distance={12} decay={2} />
      <Hero pose={mergePose(REST, { expression: turn > 0.5 ? "alarm" : "worried", headYaw: 0.9 * turn, twist: 0.3 * turn })} position={ROOM_HERO} yaw={0.1 + turn * 0.5} />
      <TallOne position={ROOM_TALL} yaw={1.1} headYaw={-0.9} appear={(c.lt - at) / 0.22} t={c.t} />
    </Shot>
  );
};

/** From the floor: it nearly touches the ceiling, and it has not noticed him. */
const tallLow: ShotFn = (c) => {
  const cam = move({ position: [-0.6, 0.9, 3.6], target: [ROOM_TALL[0], 3.9, ROOM_TALL[2]] }, { position: [-0.9, 0.9, 3.0], target: [ROOM_TALL[0], 4.2, ROOM_TALL[2]] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={12} light={0.42}>
      <Bedroom lampOn />
      {roomLight(0.5)}
      <mesh position={[0, 6.05, 0]}>
        <boxGeometry args={[13, 0.1, 13]} />
        <meshLambertMaterial color="#4A4560" flatShading />
      </mesh>
      <pointLight position={[ROOM_TALL[0] + 0.5, 4, ROOM_TALL[2] + 2]} color="#D36BFF" intensity={20} distance={12} decay={2} />
      <TallOne position={ROOM_TALL} yaw={1.1} headYaw={-0.9 + Math.sin(c.lt * 2) * 0.15} t={c.t} />
    </Shot>
  );
};

const heroLook: ShotFn = (c) => {
  const cam = move({ position: [-3.6, 3.9, 6.4], target: [ROOM_HERO[0], 3.6, ROOM_HERO[2]] }, { position: [-3.3, 3.9, 5.8], target: [ROOM_HERO[0], 3.6, ROOM_HERO[2]] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={8} light={0.42}>
      <Bedroom lampOn />
      {roomLight(0.5)}
      <pointLight position={[-3.2, 4.4, 1.2]} color="#D36BFF" intensity={16} distance={10} decay={2} />
      <Hero pose={mergePose(REST, { expression: "awe", headPitch: 0.28, headYaw: 0.1 })} position={ROOM_HERO} yaw={-0.75} />
    </Shot>
  );
};

const tallHead = (): V3 => [ROOM_TALL[0], TALL.headY, ROOM_TALL[2]];
/** Its head swings round. Eye contact. */
const tallEyes: ShotFn = (c) => {
  const h = tallHead();
  const cam = move({ position: [h[0] + 1.9, h[1] - 0.5, h[2] + 4.2], target: h }, { position: [h[0] + 1.6, h[1] - 0.4, h[2] + 3.4], target: h }, c);
  const turn = k01(c.lt, 0.15, 0.5);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={8} light={0.42}>
      <Bedroom lampOn />
      {roomLight(0.4)}
      <TallOne position={ROOM_TALL} yaw={1.1} headYaw={-0.9 + turn * 0.6} t={c.t} />
    </Shot>
  );
};

const bigMistake: ShotFn = (c) => {
  const h = tallHead();
  const jaw = k01(c.lt, 0.08, 0.3);
  const cam = move({ position: [h[0] + 2.2, h[1] - 0.5, h[2] + 4.6], target: [h[0], h[1] - 0.25, h[2]] }, { position: [h[0] + 1.8, h[1] - 0.4, h[2] + 3.7], target: [h[0], h[1] - 0.3, h[2]] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={8} light={0.42} shake={0.14 * jaw} overlay={<AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, rgba(211,107,255,0) 30%, rgba(120,30,170,0.45) 100%)", opacity: jaw }} />}>
      <Bedroom lampOn />
      {roomLight(0.3)}
      <TallOne position={ROOM_TALL} yaw={1.1} headYaw={-0.62} jaw={jaw} shakeHead={jaw} t={c.t} />
    </Shot>
  );
};

/** Down the hallway, long black arms an inch behind him. */
const chaseHall: ShotFn = (c) => {
  const hz = -22 + c.lt * 9;
  const cam: CameraSpec = { position: [-0.7, 3.3, hz + 10.5], target: [0.1, 3.5, hz - 2] };
  const fl = 0.55 + 0.45 * (random(`fl${Math.floor(c.t * 12)}`) > 0.35 ? 1 : 0.3);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={14} light={0.45} shake={0.07}>
      <Hallway flicker={fl} />
      <Hero pose={runPose(c.lt * 2.8)} position={[0.45, 0, hz]} />
      <TallOne position={[-0.35, 0, hz - 5.2 + c.lt * 1.2]} reach={0.85} jaw={1} walk={c.lt * 2.1} shakeHead={0.5} t={c.t} />
    </Shot>
  );
};

/** He turns the corner of his own house… and it is already waiting at the far end. */
const chaseTeleport: ShotFn = (c) => {
  const at = 0.42;
  const run = Math.min(c.lt, at + 0.2);
  const hz = 2 - run * 9;
  const skid = k01(c.lt, at + 0.05, at + 0.35);
  const cam: CameraSpec = { position: [-0.5, 4.3, hz + 9.5 - c.lt * 0.4], target: [-0.2, 3.3, hz - 10] };
  const fl = 0.55 + 0.45 * (random(`fl${Math.floor(c.t * 12)}`) > 0.35 ? 1 : 0.3);
  const pose = skid > 0 ? mergePose(REST, { expression: "alarm", lean: -0.3 * skid, lShoulder: [0.6, 1.1], rShoulder: [0.6, 1.1], lHip: [0.5 * skid, 0.05], rHip: [0.2 * skid, 0.05] }) : runPose(c.lt * 2.8);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={14} light={0.45} shake={0.05} overlay={<Flash k={(1 - Math.abs(c.lt - at) / 0.1) * 0.7} color="#E9B8FF" />}>
      <Hallway flicker={fl} />
      <Hero pose={pose} position={[0.95, 0, hz]} yaw={Math.PI} />
      <TallOne position={[-0.75, 0, hz - 9.5]} jaw={1} reach={0.3 + skid * 0.5} appear={(c.lt - at) / 0.2} shakeHead={0.6} t={c.t} />
      <pointLight position={[0, 4, hz - 8]} color="#D36BFF" intensity={c.lt > at ? 24 : 0} distance={12} decay={2} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 the wither

const ROAD_STOP: V3 = [1, 0, 19];
const runOut: ShotFn = (c) => {
  const k = clamp01(c.lt / 0.85);
  const pos: V3 = [DOOR[0] + (ROAD_STOP[0] - DOOR[0]) * k, 0, DOOR[2] + (ROAD_STOP[2] - DOOR[2]) * k];
  const cam = move({ position: [-9, 2.8, 29], target: [4, 3.1, 18] }, { position: [-8, 2.8, 27.5], target: [3, 3.2, 18] }, c);
  const stopped = k >= 1;
  return (
    <Shot mood="night" camera={cam} fog={[50, 300]} shadowSize={30} light={1.1}>
      <Suburb gone={[1, 1]} lit />
      <Hero pose={stopped ? mergePose(REST, { expression: "worried", headYaw: Math.sin((c.lt - 0.85) * 7) * 0.7, lean: 0.15, lShoulder: [0.2, 0.3], rShoulder: [0.2, 0.3] }) : runPose(c.lt * 2.6)} position={pos} yaw={stopped ? -0.6 : -1.45} />
      {[0, 1, 2].map((i) => (
        <Mob key={i} kind="z" position={[-2 + i * 2.6, 0, -4 - i * 5 + c.lt * 1.2]} phase={c.lt * 0.9} seed={i} />
      ))}
    </Shot>
  );
};

/** A cold blue light climbs up his face from somewhere down the street. */
const reallyBad: ShotFn = (c) => {
  const cam = move({ position: [-1.6, 3.9, 25.2], target: [ROAD_STOP[0], 3.75, ROAD_STOP[2]] }, { position: [-1.3, 3.9, 24.2], target: [ROAD_STOP[0], 3.8, ROAD_STOP[2]] }, c);
  const k = k01(c.lt, 0.1, 0.7);
  return (
    <Shot mood="night" camera={cam} fog={[50, 300]} shadowSize={12} light={1.0}>
      <Suburb gone={[1, 1]} lit />
      <pointLight position={[-4, 4.5, 26]} color="#9FC4FF" intensity={k * 60} distance={14} decay={2} />
      <Hero pose={mergePose(REST, { expression: k > 0.6 ? "alarm" : "worried", headYaw: -0.25 * k })} position={ROAD_STOP} yaw={-0.4} />
    </Shot>
  );
};

const ALTAR: V3 = [0, 0, 46];
const SUMMONER: V3 = [2.25, 0, 46.2];
/** Someone. Accidentally. */
const summon: ShotFn = (c) => {
  const cam = move({ position: [3.4, 3.0, 62], target: [0.9, 2.3, 46] }, { position: [3.0, 3.0, 60], target: [0.9, 2.4, 46] }, c);
  const k = k01(c.lt, 0.15, 0.6);
  const skull: V3 = [1.1 + (1 - k) * 0.25, 2.55 + (1 - k) * 0.75, (1 - k) * 0.15];
  const base = mergePose(REST, { expression: "smile", lean: 0.12, headPitch: 0.05 });
  const pose = reach(base, "r", [ALTAR[0] + skull[0] + 0.42, skull[1] + 0.05, ALTAR[2] + skull[2] + 0.1], { position: SUMMONER, yaw: -Math.PI / 2 }).pose;
  return (
    <Shot mood="night" camera={cam} fog={[50, 300]} shadowSize={20} light={1.1} overlay={<CardLine text="DO NOT TRY THIS" sub="AT HOME, OR ANYWHERE" y={430} appearFrame={startFrame(c) + 8} />}>
      <Suburb gone={[1, 1]} lit />
      <Altar position={ALTAR} skulls={3} third={skull} glow={k01(c.lt, 0.7, 1.1) * 0.6} />
      <Hero pose={pose} position={SUMMONER} yaw={-Math.PI / 2} look={crowdLook(3)} />
    </Shot>
  );
};

const bossRise: ShotFn = (c) => {
  const k = k01(c.lt, 0, 1.2);
  const cam = move({ position: [4.2, 2.2, 66], target: [0.8, 5, 46] }, { position: [4.6, 2.0, 69], target: [0.8, 8, 46] }, c);
  const charge = 1 - k01(c.lt, 0.5, 1.2);
  return (
    <Shot mood="night" camera={cam} fog={[50, 300]} shadowSize={24} light={1.0} dust={0.3 * k} shake={0.25} overlay={<Flash k={(1 - c.lt / 0.25) * 0.8} color="#DDEBFF" />}>
      <Suburb gone={[1, 1]} lit />
      <Shockwave position={[ALTAR[0], 0.3, ALTAR[2]]} progress={c.lt / 0.8} radius={22} color="#BFD8FF" />
      <Debris origin={[ALTAR[0], 1.5, ALTAR[2]]} t={c.lt} count={14} speed={9} seed="alt" color="#4A3A30" />
      <Boss position={[ALTAR[0], 3 + k * 7.5, ALTAR[2]]} scale={0.7 + k * 1.9} t={c.t} charge={charge} />
      <pointLight position={[ALTAR[0], 6, ALTAR[2] + 4]} color="#9FC4FF" intensity={60} distance={30} decay={2} />
      <Hero pose={mergePose(REST, { expression: "alarm", lean: -0.5, lShoulder: [1.2, 1.0], rShoulder: [1.2, 1.0], lHip: [0.6, 0.1], rHip: [0.3, 0.1] })} position={[SUMMONER[0] + 2 + c.lt * 3.5, 0, SUMMONER[2] + 0.5]} yaw={-Math.PI / 2} look={crowdLook(3)} />
    </Shot>
  );
};

/** The kit building nearest a point (kit units) in a street layout: lets the boss pick its targets. */
const nearest = (seed: string, x: number, z: number) => {
  const specs = streetLayout(seed);
  let best = 0;
  specs.forEach((s, i) => {
    if (Math.hypot(s.position[0] - x, s.position[2] - z) < Math.hypot(specs[best].position[0] - x, specs[best].position[2] - z)) best = i;
  });
  return { index: best, spec: specs[best] };
};

const cityExplode: ShotFn = (c) => {
  const A = nearest("mc", -8, -19);
  const B = nearest("mc", 8, -23);
  const hits = [
    { ...A, at: 0.35 },
    { ...B, at: 0.8 },
  ];
  const top = (s: typeof A.spec, f = 0.75): V3 => [s.position[0] * CITY * 0.8, (s.h ?? 10) * CITY * f, s.position[2] * CITY];
  const boss: V3 = [0, 33, -62 + c.lt * 3];
  const cam = move({ position: [5, 4, 28], target: [0, 27, -62], fov: 54 }, { position: [4, 4, 25], target: [0, 29, -62], fov: 54 }, c);
  return (
    <Shot mood="night" camera={cam} fog={[70, 420]} shadowSize={60} light={1.0} dust={0.45} shake={c.lt > 0.35 ? 0.3 : 0.05}>
      <BigStreet seed="mc" modify={(_, i) => {
        const h = hits.find((x) => x.index === i);
        return h ? { sink: k01(c.lt, h.at + 0.1, h.at + 1.6) * 0.55, power: c.lt > h.at ? 0 : 1 } : {};
      }} />
      <Sky t={c.t} tint="dust" seed="war" y={70} radius={260} />
      <Boss position={boss} scale={5} t={c.t} />
      {hits.map((h, i) => {
        const p = top(h.spec);
        const since = c.lt - h.at;
        return (
          <React.Fragment key={i}>
            <SkullShot from={[boss[0] + (i ? 7 : -7), boss[1] - 2, boss[2] + 3]} to={p} progress={(c.lt - (h.at - 0.3)) / 0.3} size={1.6} />
            <Fireball position={p} progress={since / 1.1} radius={10} seed={`ce${i}`} />
            <Debris origin={p} t={since} count={26} speed={15} seed={`cd${i}`} />
            <SmokeCluster position={[p[0], p[1] * 0.6, p[2]]} progress={clamp01(since / 2)} radius={7} rise={14} count={10} seed={`cs${i}`} />
          </React.Fragment>
        );
      })}
    </Shot>
  );
};

const CRACK: V3[] = [
  [-3, 0, 16],
  [2.5, 0, 6],
  [-4, 0, -6],
  [3, 0, -20],
  [-2, 0, -36],
  [2, 0, -60],
];
const streetCollapse: ShotFn = (c) => {
  const k = k01(c.lt, 0, 0.9);
  const hz = -16 + c.lt * 8.5;
  const cam = move({ position: [-4.5, 7.5, 27], target: [0.5, 1.0, -4] }, { position: [-3.6, 7, 24], target: [0.5, 1.0, -4] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[60, 340]} shadowSize={44} light={1.0} dust={0.6} shake={0.4}>
      <BigStreet seed="mc" cars={false} lampsOn={false} modify={(sp) => ({ tilt: [0, Math.sign(sp.position[0]) * 0.09 * k] as [number, number], power: 0.3 })} />
      <LavaCrack points={CRACK} width={2.6} progress={0.25 + k * 0.75} />
      <group scale={CITY}>
        <Car position={[-2.0, 0, -9]} color={P.carRed} tilt={[0.08 * k, -0.2 * k]} lights={false} />
      </group>
      <Hero pose={runPose(c.lt * 2.7)} position={[6.5, 0, hz]} />
      <Fireball position={[-9, 0.5, -34]} progress={(c.lt - 0.2) / 1.0} radius={7} seed="sc1" />
      <SmokeCluster position={[8, 0.5, -48]} progress={0.4 + c.lt * 0.2} radius={6} rise={12} seed="sc2" />
      <Debris origin={[-9, 2, -34]} t={c.lt - 0.2} count={18} speed={12} seed="scd" />
    </Shot>
  );
};

const FIRES: V3[] = [
  [-21, 0, -14],
  [14, 0, -28],
  [0, 0, 14],
  [28, 0, 7],
  [-28, 0, 21],
  [-7, 0, -35],
];
/** From the air: a whole city on fire, and the thing drifting over it. */
const cityBurn: ShotFn = (c) => {
  const cam = move({ position: [38, 50, 70], target: [0, 6, 0] }, { position: [32, 46, 64], target: [0, 7, 0] }, c);
  return (
    <Shot mood="dust" camera={cam} fog={[60, 300]} shadowSize={90} light={0.95} shake={0.1}>
      <CityGrid seed="war" blocks={6} modify={(_, i) => (i % 7 === 0 ? { sink: 0.5, power: 0 } : { power: i % 3 ? 0.5 : 0 })} />
      <Sky t={c.t} tint="dust" seed="war" y={60} radius={200} />
      {FIRES.map((p, i) => (
        <React.Fragment key={i}>
          <Fireball position={p} progress={((c.lt * 0.7 + i * 0.37) % 1)} radius={5} seed={`cb${i}`} />
          <SmokeCluster position={p} progress={0.6 + ((c.lt * 0.2 + i * 0.13) % 0.4)} radius={5} rise={16} count={10} seed={`cbs${i}`} />
          <Halo position={[p[0], 3, p[2]]} size={22} color={P.fire} opacity={0.5} />
        </React.Fragment>
      ))}
      <Boss position={[-12 + c.lt * 6, 26, 6]} yaw={0.9} scale={2.6} t={c.t} />
      <SkullShot from={[-10 + c.lt * 6, 24, 8]} to={[14, 3, -28]} progress={(c.lt - 0.3) / 0.5} size={1} />
      <SkullShot from={[-10 + c.lt * 6, 24, 8]} to={[0, 3, 14]} progress={(c.lt - 0.9) / 0.5} size={1} />
    </Shot>
  );
};

const crouch = (over: Partial<Pose> = {}): Pose => {
  const p = mergePose(REST, { lHip: [1.25, 0.12], rHip: [1.25, 0.12], lKnee: 2.1, rKnee: 2.1, lean: 0.4, lShoulder: [2.6, 0.35], rShoulder: [2.6, 0.35], lElbow: 1.6, rElbow: 1.6, expression: "alarm", ...over });
  return { ...p, bob: groundedBob(p) };
};
const BARRICADE: V3[] = [
  [0.2, 0, 4.6],
  [-2.5, 0, 4.9],
  [2.9, 0, 4.8],
];
const BarricadeSet: React.FC<{ c: ShotCtx; dawn?: number }> = ({ c, dawn = 0 }) => (
  <>
    <BigStreet seed="mc" cars={false} lampsOn={false} modify={() => ({ power: 0.25 })} />
    <group scale={CITY}>
      <Car position={[0, 0, 0]} yaw={Math.PI / 2} color={P.carRed} lights={false} />
    </group>
    <Flames position={[-9, 0, -8]} size={5} t={c.t} seed="b1" />
    <Flames position={[10, 0, -16]} size={6} t={c.t} seed="b2" />
    <SmokeCluster position={[-9, 3, -8]} progress={0.7} radius={3} rise={10} seed="bsm" />
    <pointLight position={[0, 5, 10]} color={dawn > 0 ? "#FFD2A8" : "#FF9A4A"} intensity={30 + dawn * 50} distance={30} decay={2} />
  </>
);
const barricade: ShotFn = (c) => {
  const cam = move({ position: [3.5, 3.6, 24], target: [0.2, 2.8, 3] }, { position: [3.0, 3.4, 22], target: [0.2, 2.8, 3] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[50, 300]} shadowSize={30} light={1.0} dust={0.6} shake={0.12}>
      <BarricadeSet c={c} />
      <Hero pose={crouch()} position={BARRICADE[0]} />
      <Hero pose={crouch({ headYaw: 0.4 })} position={BARRICADE[1]} look={crowdLook(7)} />
      <Hero pose={crouch({ headYaw: -0.4 })} position={BARRICADE[2]} look={crowdLook(11)} />
      {[0, 1, 2, 3].map((i) => (
        <ArrowFlight key={i} from={[-4 + i * 3, 6, -40]} to={[-5 + i * 3.4, 0.05, 9 + (i % 2) * 2.5]} progress={(c.lt + 0.25 - i * 0.16) / 0.5} arc={5} />
      ))}
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 until sunrise

const hope: ShotFn = (c) => {
  const k = k01(c.lt, 0.4, 1.3);
  const cam = move({ position: [1.8, 2.5, 12], target: [0.2, 2.3, 4.6] }, { position: [1.5, 2.5, 11], target: [0.2, 2.35, 4.6] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[50, 300]} shadowSize={14} light={1.0 + k * 0.2} dust={0.6 - k * 0.3}>
      <BarricadeSet c={c} dawn={k} />
      <Hero pose={crouch({ lShoulder: [0.6, 0.3], rShoulder: [0.6, 0.3], lElbow: 1.2, rElbow: 1.2, expression: k > 0.5 ? "awe" : "worried", headYaw: 0.5 * k, headPitch: 0.25 * k })} position={BARRICADE[0]} />
      <Hero pose={crouch({ headYaw: 0.4 })} position={BARRICADE[1]} look={crowdLook(7)} />
    </Shot>
  );
};

const sunrise: ShotFn = (c) => {
  const cam = move({ position: [0, 19, 48], target: [0, 15, -80] }, { position: [0, 18, 44], target: [0, 18, -80] }, c);
  const k = k01(c.lt, 0, 1.6);
  return (
    <Shot mood="dawn" camera={cam} fog={[80, 520]} shadowSize={60} light={0.75 + k * 0.3}>
      <BigStreet seed="mc" lampsOn={false} cars={false} modify={() => ({ power: 0.3 })} />
      <Sky t={c.t} tint="dawn" seed="rise" y={56} radius={260} />
      <SunDisc position={[0, 2 + k * 22, -420]} r={30} color="#FFF0C0" glow="#FFB25A" halo={0.4 + k * 0.4} />
      <SmokeCluster position={[-30, 30, -90]} progress={0.8} radius={9} rise={20} seed="rs1" />
      <SmokeCluster position={[34, 26, -130]} progress={0.9} radius={9} rise={20} seed="rs2" />
    </Shot>
  );
};

const BURN: V3[] = [
  [-2.6, 0, -1],
  [0.3, 0, 2],
  [3.0, 0, -2],
  [-1.4, 0, -8],
  [1.9, 0, -10],
  [4.6, 0, -9],
];
/** The light reaches the street. They smoke, they catch, they are gone. */
const zombieBurn: ShotFn = (c) => {
  const cam = move({ position: [0.8, 2.6, 21], target: [0.5, 3.0, -4] }, { position: [0.6, 2.6, 19.4], target: [0.5, 3.1, -4] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 360]} shadowSize={36} light={1.1} keyDir={[0.2, 0.5, -1]}>
      <BigStreet seed="mc" day cars={false} />
      <Sky t={c.t} tint="dawn" seed="rise" />
      {BURN.map((p, i) => {
        const fire = k01(c.lt, 0.1 + i * 0.06, 0.45 + i * 0.06);
        const gone = clamp01((c.lt - 0.75 - i * 0.09) / 0.45);
        return (
          <React.Fragment key={i}>
            <Hero pose={mergePose(zombiePose(0.2 + i * 0.3, 0.2), { headPitch: 0.5 * fire, lShoulder: [1.5 + fire, 0.4 * fire], rShoulder: [1.5 + fire, 0.4 * fire] })} position={p} look={ZOMBIE} vanish={gone} />
            {gone < 1 ? <Flames position={[p[0], 4.3 * (1 - gone), p[2]]} size={1.5 * (1 - gone * 0.6)} t={c.t + i} seed={`zb${i}`} amount={fire} /> : <AshPile position={p} />}
            <SmokeCluster position={[p[0], 3.4, p[2]]} progress={clamp01((c.lt - 0.3 - i * 0.06) / 1.6)} radius={0.9} rise={3.5} count={5} seed={`zs${i}`} color="#8A8088" />
          </React.Fragment>
        );
      })}
    </Shot>
  );
};

const skelBurn: ShotFn = (c) => {
  const x = -4 + c.lt * 5.4;
  const gone = c.lt > 1.15;
  const cam = move({ position: [0, 3.0, 15], target: [0, 2.6, 0] }, { position: [0.6, 3.0, 13.6], target: [0.6, 2.6, 0] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 360]} shadowSize={30} light={1.15} keyDir={[0.2, 0.5, -1]}>
      <BigStreet seed="mc" day cars={false} />
      <Sky t={c.t} tint="dawn" seed="rise" />
      {gone ? (
        <AshPile position={[2.2, 0, 0]} />
      ) : (
        <>
          <Skeleton position={[x, 0, 0]} yaw={Math.PI / 2} walk={c.lt * 3.2} panic={1} />
          <Flames position={[x, 4.0, 0]} size={1.5} t={c.t} seed="sk" />
        </>
      )}
      <Poof position={[2.2, 0, 0]} k={(c.lt - 1.15) / 0.4} color="#B8B5A6" seed="skp" />
      {BURN.slice(0, 4).map((p, i) => (
        <AshPile key={i} position={[p[0], 0, p[2] - 14]} />
      ))}
    </Shot>
  );
};

const MORNING: V3 = [0, 0, 6];
const MorningSet: React.FC<{ c: ShotCtx }> = ({ c }) => (
  <>
    <Suburb gone={[1, 1]} />
    <Sky t={c.t} tint="day" seed="morn" />
    <SunDisc position={[46, 78, -300]} r={13} halo={0.45} />
    {([[-2.5, 0, -6], [2.8, 0, -12], [-1, 0, -22], [3.2, 0, -30], [-3, 0, -40]] as V3[]).map((p, i) => (
      <AshPile key={i} position={p} size={1.2} />
    ))}
  </>
);
const finallyOver: ShotFn = (c) => {
  const up = k01(c.lt, 0.05, 0.45);
  const cam = move({ position: [-2, 2.6, 20], target: [0, 3.3, 6] }, { position: [-1.6, 2.6, 18.6], target: [0, 3.4, 6] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[70, 360]} shadowSize={26}>
      <MorningSet c={c} />
      <Hero pose={mergePose(REST, { expression: "smile", lShoulder: [0.1, 0.12 + 2.3 * up], rShoulder: [0.1, 0.12 + 2.3 * up], lElbow: 0.2, rElbow: 0.2, headPitch: 0.2 * up })} position={MORNING} />
    </Shot>
  );
};

const relief: ShotFn = (c) => {
  const cam = move({ position: [0.5, 3.9, 11.4], target: [0, 3.78, 6] }, { position: [0.4, 3.9, 10.6], target: [0, 3.8, 6] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[70, 360]} shadowSize={12}>
      <MorningSet c={c} />
      <Hero pose={mergePose(REST, { expression: "relief", blink: 1, headPitch: 0.12 })} position={MORNING} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 one more thing

/** The smile stops. */
const freeze: ShotFn = (c) => {
  const cam = move({ position: [-0.6, 3.85, 10.6], target: [0, 3.78, 6] }, { position: [-0.45, 3.85, 9.6], target: [0, 3.8, 6] }, c);
  const k = c.lt;
  return (
    <Shot mood="day" camera={cam} fog={[70, 360]} shadowSize={12}>
      <MorningSet c={c} />
      <Hero pose={mergePose(REST, { expression: k < 0.35 ? "relief" : k < 0.9 ? "neutral" : "worried", blink: k < 0.35 ? 1 : 0, headYaw: k > 0.9 ? -0.18 * k01(k, 0.9, 1.3) : 0 })} position={MORNING} />
    </Shot>
  );
};

const HISS2: V3 = [0.8, 0, 4.2];
const behind: ShotFn = (c) => {
  const { hiss2 } = beats(c.words);
  const since = c.t - hiss2;
  const cam = move({ position: [1.2, 3.7, 17], target: [0.3, 3.5, 6] }, { position: [0.9, 3.7, 15.2], target: [0.3, 3.5, 6] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[70, 360]} shadowSize={22} shake={since > 0 ? 0.03 : 0} overlay={<SoundWord text="SSSSSSSS!" k={since - 0.05} />}>
      <MorningSet c={c} />
      <Hero pose={mergePose(REST, { expression: since > 0.2 ? "alarm" : "worried", lShoulder: [0.1, 0.12 + 0.4 * k01(since, 0.2, 0.4)], rShoulder: [0.1, 0.12 + 0.4 * k01(since, 0.2, 0.4)] })} position={MORNING} />
      <Hisser position={HISS2} scale={pop(since, 0)} tilt={0.08} />
      <Poof position={HISS2} k={since / 0.45} size={1.2} seed="h2" />
    </Shot>
  );
};

/** Full morning sun on its head. It could not care less. */
const sunproof: ShotFn = (c) => {
  const cam = move({ position: [5.8, 1.5, 11.4], target: [0.5, 3.5, 4.8] }, { position: [5.2, 1.5, 10.6], target: [0.5, 3.7, 4.8] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[70, 360]} shadowSize={22} overlay={<CardLine text="SUN DAMAGE: 0" sub="CREEPERS ARE SUNPROOF" y={430} appearFrame={startFrame(c) + 8} />}>
      <Suburb gone={[1, 1]} />
      <Sky t={c.t} tint="day" seed="morn" />
      <SunDisc position={[-70, 74, -111]} r={9} halo={0.6} />
      <Hero pose={mergePose(REST, { expression: "alarm", lShoulder: [0.1, 0.5], rShoulder: [0.1, 0.5], headYaw: Math.sin(c.t * 40) * 0.03 })} position={MORNING} />
      <Hisser position={HISS2} tilt={0.14 + Math.sin(c.lt * 3) * 0.05} />
    </Shot>
  );
};

const hisserFace: ShotFn = (c) => {
  const k = k01(c.lt, 0.1, 1.0);
  const blink = Math.sin(c.lt * c.lt * 30) > 0 ? 1 : 0;
  const head: V3 = [HISS2[0], HISSER.headY, HISS2[2]];
  const cam = move({ position: [head[0] + 1.2, head[1] - 0.2, head[2] + 5.2], target: head }, { position: [head[0] + 0.9, head[1] - 0.1, head[2] + 4.2], target: head }, c);
  return (
    <Shot mood="day" camera={cam} fog={[70, 360]} shadowSize={12} shake={0.03 + k * 0.1}>
      <Suburb gone={[1, 1]} />
      <Sky t={c.t} tint="day" seed="morn" />
      <Hisser position={HISS2} swell={k * 0.4} flash={k > 0.15 ? blink : 0} tilt={0.1} />
      <Poof position={[MORNING[0], 0, MORNING[2] + 1]} k={c.lt / 0.5} seed="gone" color="#D8D2C4" />
    </Shot>
  );
};

/** And neither do your problems. */
const runAway: ShotFn = (c) => {
  const { bang } = beats(c.words);
  const since = c.t - bang;
  const hz = 9 + c.lt * 9;
  const gap = 6.2 - Math.min(c.lt, 1.4) * 1.6;
  const k = clamp01(c.lt / Math.max(0.5, bang - (c.t - c.lt)));
  const blink = Math.sin(c.lt * c.lt * 26) > 0 ? 1 : 0;
  const cam: CameraSpec = { position: [2.8, 3.0, hz + 14 - c.lt * 0.5], target: [0.5, 2.9, hz - 2] };
  return (
    <Shot mood="day" camera={cam} fog={[70, 360]} shadowSize={30} shake={0.06 + k * 0.1 + (since > 0 ? 0.5 * (1 - clamp01(since / 1)) : 0)} overlay={<Flash k={since > 0 ? 1 - since / 0.3 : 0} />}>
      <Suburb gone={[1, 1]} />
      <Sky t={c.t} tint="day" seed="morn" />
      {since > 0 ? (
        <>
          <Fireball position={[0.8, 0.5, hz - gap]} progress={since / 1.3} radius={9} seed="end" />
          <SmokeCluster position={[0.8, 1, hz - gap]} progress={clamp01(since / 2)} radius={5} rise={9} seed="ends" />
        </>
      ) : (
        <>
          <Hero pose={runPose(c.lt * 2.9)} position={[0, 0, hz]} />
          <Hisser position={[0.8, 0, hz - gap]} walk={c.lt * 5} swell={k} flash={blink} tilt={0.08} />
        </>
      )}
    </Shot>
  );
};

// ---------------------------------------------------------------- thumbnail

/** Slavoski mid-scream on his street at sunset, the hisser flashing right behind him, zombies down the road. */
export const thumbShot: ShotFn = () => {
  const hero: V3 = [-0.7, 0, 6];
  return (
    <Shot mood="sunset" camera={{ position: [0.5, 3.2, 17.5], target: [0.5, 5.6, 5] }} fog={[70, 360]} shadowSize={26} light={1.4}>
      <Suburb lit />
      <Sky t={0} tint="sunset" seed="thumb" y={40} radius={220} />
      <Hero pose={mergePose(REST, { expression: "alarm", lShoulder: [0.2, 0.7], rShoulder: [0.2, 0.7], lElbow: 1.2, rElbow: 1.2 })} position={hero} scale={1.15} />
      <Hisser position={[1.5, 0, 4.0]} scale={1.3} tilt={0.1} />
      <pointLight position={[0.5, 4, 12]} color="#FFE2C0" intensity={60} distance={20} decay={2} />
      {[0, 1, 2, 3].map((i) => (
        <Mob key={i} kind="z" position={[-4 + i * 2.6, 0, -8 - i * 4]} phase={i * 0.3} seed={i} />
      ))}
    </Shot>
  );
};

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldSpawn },
    { cue: "suddenly spawned", fn: coldCity },
    { cue: "Imagine", fn: coldWalk },
    { cue: "when suddenly", fn: coldHiss },
    { cue: "a creeper", fn: coldTurn },
    { cue: "Your", fn: coldGone },
    { cue: "but that's", fn: coldFace },
  ],
  c1: [
    { cue: null, fn: sunSet },
    { cue: "zombies", fn: zombieRise },
    { cue: "every city", fn: zombieCity },
    { cue: "Skeletons", fn: skelAim },
    { cue: "arrows", fn: arrowsRun },
    { cue: "and spiders", fn: spiderCar },
    { cue: "start climbing", fn: spiderClimb },
  ],
  c2: [
    { cue: null, fn: houseOut },
    { cue: "inside your", fn: bedSafe },
    { cue: "Think again", fn: thinkAgain },
    { cue: "An Enderman", fn: teleportIn },
    { cue: "straight into", fn: tallLow },
    { cue: "You look", fn: heroLook },
    { cue: "in the eyes", fn: tallEyes },
    { cue: "Big mistake", fn: bigMistake },
    { cue: "Now it's", fn: chaseHall },
    { cue: "through your", fn: chaseTeleport },
  ],
  c3: [
    { cue: null, fn: runOut },
    { cue: "really bad", fn: reallyBad },
    { cue: "Someone", fn: summon },
    { cue: "summons", fn: bossRise },
    { cue: "Buildings explode", fn: cityExplode },
    { cue: "streets collapse", fn: streetCollapse },
    { cue: "and entire", fn: cityBurn },
    { cue: "battlegrounds", fn: barricade },
  ],
  c4: [
    { cue: null, fn: hope },
    { cue: "Survive", fn: sunrise },
    { cue: "The zombies", fn: zombieBurn },
    { cue: "start burning", fn: skelBurn },
    { cue: "Finally", fn: finallyOver },
    { cue: "nightmare", fn: relief },
  ],
  c5: [
    { cue: null, fn: freeze },
    { cue: "sound behind", fn: behind },
    { cue: "Because", fn: sunproof },
    { cue: "don't burn", fn: hisserFace },
    { cue: "and neither", fn: runAway },
  ],
};
