/**
 * Shots for "What If Humans Became Immortal?" (ep. 8).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * Hook: Slavoski falls off a ladder hanging grandma's 120th-birthday banner… and sits right back up.
 * Bookend: the same lawn at the end, as the light dims.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import * as THREE from "three";
import { Building, CityGrid, Ground, StreetSet, streetLayout } from "../../slavoski/city";
import { BoxG, CylG } from "../../slavoski/detail";
import { SmokeCluster, Debris, LavaCrack } from "../../slavoski/fx";
import { crowdLook, suitLook, SLAVOSKI, type HeroLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Bush, Clouds, GrassTufts, LeafyTree, LightningBolt, Rain } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { CardLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import { DIM, handPosition, headPosition, Hero, mergePose, reach, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { sittingPose } from "../../slavoski/room";
import { CanvasPanel } from "../../slavoski/screens";
import { FacetedEarth } from "../../slavoski/space";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import { type CuedShot } from "../../slavoski/timeline";
import { ContainerShip } from "../satellites-dark/props";
import { Capitol, Placard } from "../smart-animals/props";
import { Balance, BALANCE, HillRing, Skyline } from "../no-work-2036/props";
import { CITY, Supermarket } from "../ww3-countdown/props";
import {
  Baby,
  BED,
  Cake,
  Confetti,
  Crib,
  DOCTOR,
  drawDeaths,
  drawSign,
  dusty,
  FadingStars,
  frosty,
  FuneralHome,
  Galaxy,
  Garden,
  GardenTable,
  GiftBox,
  GRANDMA,
  Hearse,
  HospitalRoom,
  Ladder,
  MONITOR,
  PATIENT,
  RedGiant,
  Rubble,
  SCREEN,
  ScorchedGround,
  TABLE,
  TRAP,
} from "./props";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
const lin = (lt: number, a: number, b: number) => clamp01((lt - a) / (b - a));
const startFrame = (c: ShotCtx) => Math.round((c.t - c.lt) * 30);
const L3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

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

const CLOUD = { day: "#F4F6FA", dawn: "#C9B8D6", sunset: "#F7C0A0", storm: "#3E4656", overcast: "#AEB6C2" } as const;
const Sky: React.FC<{ t: number; tint: keyof typeof CLOUD; y?: number; radius?: number; count?: number; seed?: string }> = ({ t, tint, y = 45, radius = 200, count = 16, seed = "sky" }) => (
  <Clouds t={t} color={CLOUD[tint]} y={y} radius={radius} count={count} seed={seed} />
);

/** A full-frame flash (lightning) or darkening (time-lapse night) over the shot, under the HUD. */
const Wash: React.FC<{ color: string; opacity: number }> = ({ color, opacity }) =>
  opacity > 0.001 ? <AbsoluteFill style={{ background: color, opacity, pointerEvents: "none" }} /> : null;

/**
 * Slavoski tipped back around his hip joint: `back` 0 = upright … π/2 = flat on his back (the head goes
 * away from the way he faces). Keep the legs on the ground with `legsFlat(back)`.
 */
const Reclined: React.FC<{ hip: V3; yaw: number; back: number; pose: Pose; look?: HeroLook; roll?: number }> = ({ hip, yaw, back, pose, look, roll = 0 }) => (
  <group position={hip} rotation={[0, yaw, 0]}>
    <group rotation={[-back, 0, roll]}>
      <Hero pose={{ ...pose, bob: 0 }} position={[0, -DIM.hipY, 0]} look={look} />
    </group>
  </group>
);
const legsFlat = (back: number, knee = 0.12): Partial<Pose> => ({ lHip: [Math.PI / 2 - back, 0.1], rHip: [Math.PI / 2 - back, 0.1], lKnee: knee, rKnee: knee });

/** Arms up in a V, bouncing (crowds cheering). */
const cheer = (t: number, seed: number, expression: Pose["expression"] = "smile"): Pose => {
  const b = Math.sin(t * 7 + seed);
  return mergePose(REST, {
    lShoulder: [0.25, 2.35 + 0.12 * b],
    rShoulder: [0.25, 2.35 - 0.12 * b],
    lElbow: 0.3,
    rElbow: 0.3,
    headPitch: 0.2,
    expression,
    bob: 0.12 * Math.max(0, Math.sin(t * 9 + seed * 2)),
  });
};

// ---------------------------------------------------------------- the garden (hook + bookend)

/** Ladder pivot (its left foot) and lean against the wall; the hero stands on a rung at HERO_LADDER. */
const LADDER_FOOT: V3 = [1.85, 0, 5.3];
const LEAN = -0.277;
const HERO_LADDER: V3 = [2.4, 2.0, 4.73];
/** Where he lands: hip joint on the lawn, flat on his back, head toward +Z. */
const LAND_HIP: V3 = [2.45, 0.62, 7.3];
/** Sitting on the lawn after the fall. */
const SIT_HIP: V3 = [2.45, 0.48, 7.3];

const ladderTip = (lt: number) => {
  const wob = lt > 0.15 && lt < 0.55 ? 0.05 * Math.sin((lt - 0.15) * 26) * k01(lt, 0.15, 0.35) : 0;
  const fall = lt > 0.5 ? Math.min(Math.PI / 2, 0.05 + ((lt - 0.5) / 0.6) ** 2 * 1.55) : 0;
  return wob + fall;
};
const LadderFalling: React.FC<{ tip: number }> = ({ tip }) => (
  <group position={LADDER_FOOT} rotation={new THREE.Euler(LEAN, 0, tip, "YXZ")}>
    <Ladder position={[0.55, 0, 0]} />
  </group>
);
/** The ladder at rest on the lawn after the fall (as in the last frame of the hook). */
const LadderDown: React.FC = () => <LadderFalling tip={Math.PI / 2} />;

/** 0 s: on the ladder pinning the banner → the ladder wobbles → he falls flat on his back. */
const coldFall: ShotFn = (c) => {
  const lt = c.lt;
  const cam = move({ position: [19.5, 4.8, 13.6], target: [2.2, 3.0, 7.1] }, { position: [18.6, 4.6, 13.3], target: [2.3, 2.7, 7.2] }, c);
  const tip = ladderTip(lt);
  const falling = lt > 0.5;
  const u = clamp01((lt - 0.5) / 0.45);
  const landed = lt >= 0.95;
  // on the ladder: hammering the banner corner
  const base = mergePose(REST, { lean: 0.12, headPitch: 0.45, expression: lt > 0.3 ? "alarm" : "neutral" });
  const onLadder = reach(base, "r", [2.95, 5.35 + 0.08 * Math.sin(lt * 30), 3.78], { position: HERO_LADDER, yaw: Math.PI }).pose;
  const ladderPose = mergePose(onLadder, { lShoulder: [lt > 0.3 ? 1.4 : 2.3, lt > 0.3 ? 1.0 : 0.25], lElbow: 0.4 });
  const flail = mergePose(REST, {
    lShoulder: [1.2 + 0.4 * Math.sin(lt * 30), 1.3],
    rShoulder: [1.2 - 0.4 * Math.sin(lt * 30), 1.3],
    lElbow: 0.5,
    rElbow: 0.5,
    lHip: [0.5 * u, 0.1],
    rHip: [0.3 * u, 0.1],
    lKnee: 0.4,
    rKnee: 0.2,
    headPitch: -0.3,
    expression: "alarm",
  });
  const flat = mergePose(REST, { ...legsFlat(Math.PI / 2), lShoulder: [0.1, 1.25], rShoulder: [0.1, 1.3], lElbow: 0.3, rElbow: 0.4, headPitch: -0.15, expression: "alarm", blink: lt > 1.25 && lt < 1.33 ? 1 : 0 });
  const back = landed ? Math.PI / 2 : (Math.PI / 2) * u * u;
  const bounce = landed ? 0.1 * Math.max(0, Math.sin((lt - 0.95) * 18)) * Math.exp(-(lt - 0.95) * 8) : 0;
  const hip: V3 = landed ? [LAND_HIP[0], LAND_HIP[1] + bounce, LAND_HIP[2]] : L3([HERO_LADDER[0], HERO_LADDER[1] + DIM.hipY, HERO_LADDER[2]], LAND_HIP, u * u);
  hip[2] = landed ? LAND_HIP[2] : HERO_LADDER[2] + (LAND_HIP[2] - HERO_LADDER[2]) * u;
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={22} shake={landed && lt < 1.3 ? 0.12 : 0} keyDir={[0.7, 0.8, 0.6]}>
      <Garden banner />
      <Sky t={c.t} tint="day" seed="hook" />
      <LadderFalling tip={tip} />
      {falling ? (
        <Reclined hip={hip} yaw={Math.PI} back={back} pose={landed ? flat : flail} />
      ) : (
        <group position={[LADDER_FOOT[0], 0, HERO_LADDER[2]]} rotation={[0, 0, tip]}>
          <Hero pose={ladderPose} position={[HERO_LADDER[0] - LADDER_FOOT[0], HERO_LADDER[1], 0]} yaw={Math.PI} />
        </group>
      )}
    </Shot>
  );
};

/** He blinks… and sits straight up, checks his arms, unhurt. The title comes in on this shot. */
const coldSitUp: ShotFn = (c) => {
  const lt = c.lt;
  const cam = move({ position: [9.6, 2.7, 2.4], target: [2.45, 2.75, 7.6] }, { position: [9.0, 2.7, 2.8], target: [2.45, 2.7, 7.6] }, c);
  const k = k01(lt, 0.3, 0.8);
  const back = Math.PI / 2 - k * (Math.PI / 2 - 0.12);
  const look = k01(lt, 0.85, 1.15);
  const pose = mergePose(REST, {
    ...legsFlat(back, 0.12 + 0.3 * k),
    lShoulder: [0.1 + 1.0 * look, 1.25 - 1.0 * k],
    rShoulder: [0.1 + 1.0 * look, 1.3 - 1.0 * k],
    lElbow: 0.3 + 1.0 * look,
    rElbow: 0.4 + 1.0 * look,
    headPitch: -0.15 - 0.35 * look,
    expression: lt < 0.3 ? "alarm" : look > 0.5 ? "awe" : "worried",
    blink: lt > 0.12 && lt < 0.2 ? 1 : 0,
  });
  const hip = L3(LAND_HIP, SIT_HIP, k);
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={14} keyDir={[0.7, 0.8, 0.6]}>
      <Garden banner />
      <Sky t={c.t} tint="day" seed="hook" />
      <LadderDown />
      <Reclined hip={hip} yaw={Math.PI} back={back} pose={pose} />
    </Shot>
  );
};

/** The patient's sleeping hip in bed (lying back, head on the pillow toward -X, facing +X). */
const PATIENT_HIP: V3 = [0.19, 1.61, BED.z];
const Patient: React.FC<{ up: number; arms?: number; expression?: Pose["expression"] }> = ({ up, arms = 0, expression = "neutral" }) => {
  const back = Math.PI / 2 - 0.25 - up * (Math.PI / 2 - 0.5);
  const pose = mergePose(REST, {
    ...legsFlat(back, 0.05),
    lShoulder: [0.2 + 0.1 * arms, 0.15 + 2.1 * arms],
    rShoulder: [0.2 + 0.1 * arms, 0.15 + 2.1 * arms],
    lElbow: 0.3,
    rElbow: 0.3,
    expression,
    blink: up < 0.05 && arms === 0 ? 1 : 0,
  });
  return (
    <>
      <Reclined hip={PATIENT_HIP} yaw={Math.PI / 2} back={back} pose={pose} look={PATIENT} />
      {/* blanket over the legs */}
      <mesh position={[1.25, 1.62, BED.z]} castShadow>
        <BoxG args={[2.3, 0.62, BED.w - 0.05]} />
        <Flat color="#7FA8C8" />
      </mesh>
    </>
  );
};

/** A heart monitor: flatline… then the pulse comes back. */
const coldMonitor: ShotFn = (c) => {
  const n: V3 = [Math.sin(MONITOR.yaw), 0, Math.cos(MONITOR.yaw)];
  const at = (d: number, dy: number): V3 => [MONITOR.c[0] + n[0] * d, MONITOR.c[1] + dy, MONITOR.c[2] + n[2] * d];
  const cam = move({ position: at(4.9, 0.25), target: at(0, -0.15) }, { position: at(4.3, 0.15), target: at(0, -0.1) }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} stars={false} shadowSize={10} light={0.85}>
      <HospitalRoom t={c.t} aliveAt={c.t - c.lt + 0.62} />
      <Patient up={0} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 the gift (sunny midday)

const SLAV_PLAZA: V3 = [1.2, 0, 7.2];
const PLAZA_CROWD = (() => {
  const out: { p: V3; seed: number; kid: boolean }[] = [];
  let i = 0;
  for (let z = -10; z <= 9; z += 2.3)
    for (let x = -13; x <= 13; x += 2.3) {
      i++;
      const p: V3 = [x + (random(`pc${i}x`) - 0.5) * 0.6, 0, z + (random(`pc${i}z`) - 0.5) * 0.6];
      if (Math.hypot(p[0] - SLAV_PLAZA[0], p[2] - SLAV_PLAZA[2]) < 1.9) continue;
      out.push({ p, seed: i, kid: random(`pc${i}k`) < 0.15 });
    }
  return out;
})();
const Plaza: React.FC<{ t: number; near?: boolean }> = ({ t, near = false }) => (
  <group>
    <Ground color="#C9C2B4" />
    <mesh position={[0, 14, -21]} castShadow receiveShadow>
      <BoxG args={[14, 28, 5]} />
      <Flat color={P.bldgSlate} />
    </mesh>
    <mesh position={[0, 15, -18.55]}>
      <BoxG args={[SCREEN.w + 0.6, SCREEN.h + 0.6, 0.2]} />
      <Flat color="#15161C" />
    </mesh>
    <CanvasPanel position={[SCREEN.c[0], SCREEN.c[1], -18.42]} w={SCREEN.w} h={SCREEN.h} draw={drawDeaths(t)} />
    <Skyline radius={70} count={30} seed="plaza" arc={[Math.PI * 0.55, Math.PI * 1.45]} power={0.3} />
    {PLAZA_CROWD.filter((m) => !near || (m.p[2] > -2 && !(m.p[2] > SLAV_PLAZA[2] - 1.2 && Math.abs(m.p[0] - SLAV_PLAZA[0]) < 4.5))).map((m) => (
      <Hero key={m.seed} pose={cheer(t, m.seed)} position={m.p} yaw={Math.PI + (random(`py${m.seed}`) - 0.5) * 0.8} look={crowdLook(m.seed)} scale={m.kid ? 0.68 : 1} />
    ))}
    <Hero pose={cheer(t, 3, "smile")} position={SLAV_PLAZA} yaw={0.25} />
    <Confetti center={[0, 9, -1]} size={[28, 18, 24]} t={t} count={170} />
  </group>
);
const c1Plaza: ShotFn = (c) => {
  const cam = move({ position: [8, 19, 42], target: [0, 7, -4] }, { position: [7, 17.5, 38], target: [0, 7.5, -4] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[70, 320]} shadowSize={40}>
      <Plaza t={c.t} />
      <Sky t={c.t} tint="day" seed="plaza" />
    </Shot>
  );
};
const c1Cheer: ShotFn = (c) => {
  const cam = move({ position: [3.0, 2.3, 15.5], target: [1.0, 3.9, 0] }, { position: [2.8, 2.3, 14.2], target: [1.0, 4.0, 0] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[70, 320]} shadowSize={24}>
      <Plaza t={c.t} near />
      <Sky t={c.t} tint="day" seed="plaza" />
    </Shot>
  );
};

/** The ward: the old patient sits bolt upright and cheers; the doctor shrugs. */
const c1Ward: ShotFn = (c) => {
  const cam = move({ position: [1.3, 5.0, 12.8], target: [1.4, 2.8, -1.0] }, { position: [1.3, 4.9, 11.8], target: [1.4, 2.9, -1.0] }, c);
  const up = k01(c.lt, 0.05, 0.4);
  const shrug = k01(c.lt, 0.3, 0.6);
  const doc = mergePose(REST, { lShoulder: [0.4 * shrug + 0.1, 0.3 + 0.5 * shrug], rShoulder: [0.4 * shrug + 0.1, 0.3 + 0.5 * shrug], lElbow: 0.3 + 1.3 * shrug, rElbow: 0.3 + 1.3 * shrug, headRoll: 0.15 * shrug, expression: "smile" });
  return (
    <Shot mood="day" camera={cam} fog={false} stars={false} shadowSize={10} light={0.9}>
      <HospitalRoom t={c.t} aliveAt={-100} />
      <Patient up={up} arms={k01(c.lt, 0.35, 0.6)} expression={up > 0.5 ? "smile" : "neutral"} />
      <Hero pose={doc} position={[3.5, 0, -0.3]} yaw={-1.35} look={DOCTOR} />
    </Shot>
  );
};

/** The funeral home: CLOSED, a hearse FOR SALE, the undertaker bored on a bench. */
const BENCH_AT: V3 = [-1.8, 0, 4.6];
const c1Funeral: ShotFn = (c) => {
  const cam = move({ position: [7.2, 4.1, 23], target: [0.3, 3.6, 1] }, { position: [6.7, 4.0, 21], target: [0.3, 3.7, 1] }, c);
  const sit = sittingPose({ headPitch: -0.25, expression: "worried", headYaw: 0.3 });
  const chin = headPosition(sit, BENCH_AT, 0);
  const pose = reach(sit, "r", [chin[0] - 0.05, chin[1] - 0.82, chin[2] + 0.42], { position: BENCH_AT, yaw: 0 }).pose;
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={30}>
      <Ground color="#8E96A6" />
      <mesh position={[0, -0.05, 14]} receiveShadow>
        <BoxG args={[80, 0.1, 10]} />
        <Flat color={P.road} />
      </mesh>
      <FuneralHome />
      <Hearse position={[3.0, 0, 7.0]} yaw={0} />
      <mesh position={[BENCH_AT[0], 0.6, BENCH_AT[2] - 0.15]} castShadow receiveShadow>
        <BoxG args={[2.6, 0.2, 1.0]} />
        <Flat color="#8A6A44" />
      </mesh>
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} position={[BENCH_AT[0] + x, 0.25, BENCH_AT[2] - 0.15]} castShadow>
          <BoxG args={[0.16, 0.5, 0.8]} />
          <Flat color="#3A3A40" />
        </mesh>
      ))}
      <Hero pose={pose} position={BENCH_AT} look={suitLook(21)} />
      {[-16, -12, 13, 17].map((x, i) => (
        <LeafyTree key={x} position={[x, 0, -4 - (i % 2) * 5]} scale={1.8} seed={`fh${i}`} />
      ))}
      <Skyline radius={90} count={22} seed="fh" power={0.3} />
      <Sky t={c.t} tint="day" seed="fh" />
    </Shot>
  );
};

/** Grandma's 120th: the cake covered in candles, Slavoski beside her. */
const TABLE_AT: V3 = [-4.0, 0, 6.6];
const GRAN_AT: V3 = [-5.6, 0, 5.0];
const SLAV_PARTY: V3 = [-2.4, 0, 5.1];
const Party: React.FC<{ t: number; blow: number; slav: Pose; gran?: Pose }> = ({ t, blow, slav, gran }) => (
  <>
    <Garden banner />
    <GardenTable position={TABLE_AT} />
    <Cake position={[TABLE_AT[0], TABLE.top, TABLE_AT[2]]} t={t} lit={1 - blow} />
    <Hero pose={gran ?? mergePose(REST, { expression: "smile", headPitch: -0.1, lean: 0.25 * Math.sin(blow * Math.PI) })} position={GRAN_AT} yaw={0.08} look={GRANDMA} />
    <Hero pose={slav} position={SLAV_PARTY} yaw={-0.3} />
  </>
);
const c1Cake: ShotFn = (c) => {
  const cam = move({ position: [-3.8, 5.4, 19.5], target: [-4.0, 3.0, 5.6] }, { position: [-3.9, 5.1, 18.0], target: [-4.0, 3.1, 5.6] }, c);
  const blow = k01(c.lt, 1.0, 1.7);
  const slav = mergePose(REST, { expression: "smile", headYaw: -0.4, lShoulder: [0.4, 0.3], rShoulder: [0.4, 0.3], lElbow: 1.2, rElbow: 1.2 });
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={16} keyDir={[0.6, 0.9, 0.7]}>
      <Party t={c.t} blow={blow} slav={slav} />
      <Sky t={c.t} tint="day" seed="party" />
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 one problem

/** His smile drops. */
const c2Drop: ShotFn = (c) => {
  const cam = move({ position: [-1.9, 3.8, 12.2], target: [-2.4, 3.4, 5.1] }, { position: [-2.0, 3.7, 10.6], target: [-2.4, 3.45, 5.1] }, c);
  const worried = c.lt > 0.35;
  const slav = mergePose(REST, { expression: worried ? "worried" : "smile", headYaw: worried ? 0.1 : -0.4, headPitch: worried ? 0.05 : 0 });
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={12} keyDir={[0.6, 0.9, 0.7]}>
      <Party t={c.t} blow={1} slav={slav} />
      <Sky t={c.t} tint="day" seed="party" />
    </Shot>
  );
};

/** The garden fills with relatives: children, grandchildren, great-great-grandchildren… */
const RELATIVES = (() => {
  const out: { p: V3; seed: number; kid: boolean; at: number; yaw: number }[] = [];
  let i = 0;
  for (let z = 5.0; z <= 15; z += 2.0)
    for (let x = -13; x <= 13; x += 2.0) {
      i++;
      const p: V3 = [x + (random(`rl${i}x`) - 0.5) * 0.5, 0, z + (random(`rl${i}z`) - 0.5) * 0.5];
      if (Math.abs(p[0] - TABLE_AT[0]) < 3.4 && Math.abs(p[2] - TABLE_AT[2]) < 2.2) continue;
      if (Math.abs(p[0] - GRAN_AT[0]) < 1.6 && Math.abs(p[2] - GRAN_AT[2]) < 1.5) continue;
      if (Math.abs(p[0] - SLAV_PARTY[0]) < 1.6 && Math.abs(p[2] - SLAV_PARTY[2]) < 1.5) continue;
      if (Math.abs(p[0]) < 4.3 && p[2] < 5.6) continue;
      out.push({ p, seed: i, kid: random(`rl${i}k`) < 0.3, at: random(`rl${i}t`), yaw: (random(`rl${i}y`) - 0.5) * 1.6 });
    }
  return out;
})();
const c2Family: ShotFn = (c) => {
  const cam = move({ position: [9, 17, 30], target: [-1, 1.5, 6] }, { position: [8.5, 18.5, 31], target: [-1, 1.2, 6] }, c);
  const g = c.lt / Math.max(0.8, span(c.dur));
  const slav = mergePose(REST, { expression: "worried", headYaw: 0.4, headPitch: 0.1 });
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={30} keyDir={[0.6, 0.9, 0.7]}>
      <Party t={c.t} blow={1} slav={slav} gran={mergePose(REST, { expression: "smile", lShoulder: [0.2, 1.9], rShoulder: [0.2, 0.3] })} />
      {RELATIVES.map((r) => {
        const k = clamp01((g * 1.15 - r.at * 0.9) / 0.12);
        if (k <= 0) return null;
        return <Hero key={r.seed} pose={mergePose(REST, { expression: "smile", headPitch: 0.1 })} position={r.p} yaw={r.yaw} look={crowdLook(r.seed + 40)} scale={(r.kid ? 0.62 : 1) * (0.4 + 0.6 * k)} />;
      })}
      <Sky t={c.t} tint="day" seed="party" />
    </Shot>
  );
};

/** The maternity ward: rows of cribs popping in. */
const c2Nursery: ShotFn = (c) => {
  const cam = move({ position: [8.5, 6.4, 10], target: [-1.5, 0.8, -8] }, { position: [7.6, 6.0, 8.6], target: [-1.5, 0.8, -8.5] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[30, 90]} stars={false} shadowSize={20} light={0.95}>
      <mesh position={[0, -0.05, -10]} receiveShadow>
        <BoxG args={[40, 0.1, 50]} />
        <Flat color="#E4E0D4" />
      </mesh>
      <mesh position={[-10, 4, -10]} receiveShadow>
        <BoxG args={[0.2, 8, 50]} />
        <Flat color="#DCE8E4" />
      </mesh>
      {[-4, -12, -20, -28].map((z) => (
        <mesh key={z} position={[-9.85, 4.2, z]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[4.4, 3.2]} />
          <Glow color="#BFE0F6" />
        </mesh>
      ))}
      <mesh position={[0, 4, -32]} receiveShadow>
        <BoxG args={[40, 8, 0.2]} />
        <Flat color="#E8EEEC" />
      </mesh>
      {Array.from({ length: 9 }, (_, r) =>
        Array.from({ length: 5 }, (_, col) => {
          const i = r * 5 + col;
          const pop = clamp01((c.lt - (r * 0.11 + col * 0.03)) / 0.18);
          return <Crib key={i} position={[-6.5 + col * 2.6, 0, 3 - r * 2.6]} pop={pop} seed={`cr${i}`} />;
        }),
      )}
      <Sky t={c.t} tint="day" seed="nurse" />
    </Shot>
  );
};

/** BORN vs DIED on a golden balance: babies pile up on one pan, the other stays empty. */
const c2Balance: ShotFn = (c) => {
  const cam = move({ position: [2.5, 9, 48], target: [0, 7.6, 0] }, { position: [2.2, 8.8, 44], target: [0, 7.6, 0] }, c);
  const n = Math.min(22, 4 + Math.floor(c.lt * 10));
  const tilt = -Math.min(0.42, 0.06 + c.lt * 0.2);
  const babies = Array.from({ length: n }, (_, i) => {
    const layer = Math.floor(i / 7);
    const a = (i % 7) * 0.9 + layer * 0.45;
    const r = i % 7 === 0 ? 0 : 1.25 - layer * 0.3;
    return <Baby key={i} position={[Math.cos(a) * r, layer * 0.5, Math.sin(a) * r]} rot={a} seed={`bb${i}`} />;
  });
  return (
    <Shot
      mood="day"
      camera={cam}
      fog={[60, 300]}
      shadowSize={20}
      overlay={<CardLine text="≈ 370,000 BORN EVERY DAY" sub="AND NOW NOBODY DIES" y={430} appearFrame={startFrame(c) + 6} />}
    >
      <Ground color="#5E9A50" />
      <HillRing color="#4F8A5A" radius={140} />
      <Skyline radius={90} count={24} seed="bal" power={0.3} />
      <Balance
        tilt={tilt}
        left={<group>{babies}</group>}
        right={<CanvasPanel position={[0, 1.1, 0]} w={2.4} h={1.6} px={512} draw={drawSign("0", "#F6EBC4", "#C8372D", 0.8, "#C8372D")} />}
      />
      <CanvasPanel position={[-BALANCE.arm - 1.5, 2.6, 2.2]} w={3.6} h={1.2} draw={drawSign("BORN", "#2F7A5A", "#FFFFFF", 0.62)} />
      <CanvasPanel position={[BALANCE.arm + 1.5, 2.6, 2.2]} w={3.6} h={1.2} draw={drawSign("DIED", "#566270", "#FFFFFF", 0.62)} />
      <Sky t={c.t} tint="day" seed="bal" />
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 overcrowded (hazy afternoon → sunset)

/** Time-lapse: the city rises block by block while the sun's shadows sweep round. */
const c3Grow: ShotFn = (c) => {
  const cam = move({ position: [52, 46, 66], target: [0, 4, 0] }, { position: [44, 42, 60], target: [0, 6, 0] }, c);
  const g = c.lt / 2.6;
  const a = c.lt * 5;
  return (
    <Shot mood="day" camera={cam} fog={[90, 340]} shadowSize={70} keyDir={[Math.cos(a), 0.7, Math.sin(a)]} dust={0.15 * g}>
      <CityGrid
        seed="grow"
        blocks={7}
        modify={(spec) => {
          const d = random(`${spec.seed}g`) * 0.7;
          return { sink: 1 - clamp01((g - d) / 0.25), power: 0.3, h: (spec.h ?? 8) * 1.6 };
        }}
      />
      <HillRing color="#4F7A5A" radius={200} />
      <Sky t={c.t * 6} tint="day" seed="grow" radius={240} />
    </Shot>
  );
};

/** Towers to the horizon in a hazy sunset. */
const c3Endless: ShotFn = (c) => {
  const cam = move({ position: [8, 62, 96], target: [0, 16, -40] }, { position: [6, 58, 88], target: [0, 17, -42] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[70, 300]} shadowSize={90} dust={0.35}>
      <CityGrid seed="endless" blocks={13} modify={(spec) => ({ h: (spec.h ?? 8) * 3 + 8, power: 0.6 })} />
      <Sky t={c.t} tint="sunset" seed="endless" y={70} radius={260} />
    </Shot>
  );
};

/** The supermarket: shelves almost bare; Slavoski holds the last can. */
const SLAV_MART: V3 = [1.5, 0, -0.6];
const c3Market: ShotFn = (c) => {
  const cam = move({ position: [1.3, 4.4, 10.5], target: [1.4, 3.1, -4] }, { position: [1.4, 4.2, 9.2], target: [1.4, 3.2, -4] }, c);
  const base = mergePose(REST, { expression: "worried", headPitch: -0.3, headYaw: -0.2 });
  const pose = reach(base, "r", [SLAV_MART[0] - 0.25, 2.6, SLAV_MART[2] + 0.95], { position: SLAV_MART, yaw: 0.2 }).pose;
  const hand = handPosition(pose, "r", SLAV_MART, 0.2);
  const shopper = (i: number, x: number, z: number) => (
    <Hero key={i} pose={reach(mergePose(REST, { expression: "alarm", headPitch: 0.2 }), "r", [x + 0.9, 2.4, z - 0.4], { position: [x, 0, z], yaw: Math.PI / 2 }).pose} position={[x, 0, z]} yaw={Math.PI / 2} look={crowdLook(70 + i)} />
  );
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.85} shadowSize={14}>
      <Supermarket stock={0.015} seed="last" />
      {shopper(1, 1.6, -7)}
      {shopper(2, -2.0, -10)}
      <Hero key="s3" pose={walkPose(c.lt * 1.4, 0.8)} position={[-1.8, 0, -4 - c.lt * 0.8]} yaw={Math.PI} look={crowdLook(73)} />
      <Hero pose={pose} position={SLAV_MART} yaw={0.2} />
      <mesh position={[hand[0], hand[1] + 0.26, hand[2] + 0.02]} castShadow>
        <CylG args={[0.17, 0.17, 0.4, 10]} />
        <Flat color="#C8372D" />
      </mesh>
    </Shot>
  );
};

/** Shoulder to shoulder down the whole street. */
const SLAV_CROWD: V3 = [0.6, 0, 5.2];
const PACKED = (() => {
  const out: { p: V3; seed: number; yaw: number }[] = [];
  let i = 0;
  for (let z = 6.8; z >= -34; z -= 1.75)
    for (let x = -11; x <= 11; x += 1.75) {
      i++;
      const p: V3 = [x + (random(`pk${i}x`) - 0.5) * 0.25, 0, z + (random(`pk${i}z`) - 0.5) * 0.25];
      if (Math.abs(p[0] - SLAV_CROWD[0]) < 1.6 && Math.abs(p[2] - SLAV_CROWD[2]) < 1.6) continue;
      if (Math.abs(p[0] - 1.0) > 2.2 + (20 - p[2]) * 0.22) continue;
      if (p[2] > 6 && Math.abs(p[0] - SLAV_CROWD[0]) < 1.4) continue; // nobody between him and the camera
      out.push({ p, seed: i, yaw: random(`pk${i}y`) < 0.55 ? (random(`pk${i}a`) - 0.5) * 0.6 : Math.PI + (random(`pk${i}a`) - 0.5) * 0.6 });
    }
  return out;
})();
const c3Crowd: ShotFn = (c) => {
  const cam = move({ position: [1.1, 5.8, 20], target: [0.6, 3.5, -10] }, { position: [1.0, 5.6, 18.4], target: [0.6, 3.5, -10] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[18, 110]} shadowSize={30} dust={0.3}>
      <BigStreet seed="packed" day cars={false} />
      {PACKED.map((m) => (
        <Hero key={m.seed} pose={mergePose(REST, { expression: random(`pe${m.seed}`) < 0.5 ? "worried" : "neutral", headYaw: (random(`ph${m.seed}`) - 0.5) * 0.6, lShoulder: [0.05, 0.02], rShoulder: [0.05, 0.02] })} position={m.p} yaw={m.yaw} look={crowdLook(m.seed)} />
      ))}
      <Hero pose={mergePose(REST, { expression: "worried", lShoulder: [0.3, -0.12], rShoulder: [0.3, -0.12], lElbow: 1.5, rElbow: 1.5, headYaw: Math.sin(c.lt * 3) * 0.25 })} position={SLAV_CROWD} />
      <Sky t={c.t} tint="sunset" seed="packed" />
    </Shot>
  );
};

/** A capitol in a smoky sunset: the protest, then the dome gives way. */
const PROTEST = Array.from({ length: 24 }, (_, i) => ({
  p: [-15 + (i % 8) * 4.2 + (random(`pr${i}x`) - 0.5) * 1.2, 0, 4 + Math.floor(i / 8) * 3.4 + (random(`pr${i}z`) - 0.5)] as V3,
  seed: i,
  sign: random(`pr${i}s`) < 0.55,
}));
const c3Capitol: ShotFn = (c) => {
  const cam = move({ position: [8, 10, 56], target: [0, 12, -10] }, { position: [7, 9.5, 51], target: [0, 12, -10] }, c);
  const fall = k01(c.lt, 1.0, 2.3);
  return (
    <Shot mood="sunset" camera={cam} fog={[40, 220]} shadowSize={50} dust={0.65} shake={fall > 0 && fall < 1 ? 0.14 : 0}>
      <Ground color="#6A6058" />
      <group position={[0, -fall * 14, -14]} rotation={[0, 0, fall * 0.06]}>
        <Capitol position={[0, 0, 0]} scale={2.3} />
      </group>
      {[-14, 0, 14].map((x, i) => (
        <SmokeCluster key={x} position={[x, 0, -6 - (i % 2) * 3]} progress={fall * 0.7} radius={5.5} count={8} seed={`dome${i}`} rise={1.5} color="#D2C8BC" />
      ))}
      <Debris origin={[0, 18, -6]} t={c.lt - 1.1} count={18} speed={8} seed="cap" color="#C9C2B4" />
      <SmokeCluster position={[-24, 0, -26]} progress={0.4 + c.lt * 0.1} radius={6} seed="s1" rise={18} />
      <SmokeCluster position={[22, 0, -30]} progress={0.35 + c.lt * 0.1} radius={6} seed="s2" rise={18} />
      <Skyline radius={110} count={24} seed="cap" power={0.4} />
      {PROTEST.map((m) => {
        const pose = mergePose(REST, { expression: "alarm", headPitch: 0.3, rShoulder: m.sign ? [2.6, 0.2] : [0.1, 0.1], rElbow: m.sign ? 0.2 : 0.3 });
        const yaw = Math.PI + (random(`pry${m.seed}`) - 0.5) * 0.4;
        const hand = handPosition(pose, "r", m.p, yaw);
        return (
          <React.Fragment key={m.seed}>
            <Hero pose={pose} position={m.p} yaw={yaw} look={crowdLook(m.seed + 90)} />
            {m.sign ? <Placard position={[hand[0], hand[1] + 1.25, hand[2] - 0.12]} yaw={yaw} color={["#F6EBC4", "#C8372D", "#FFFFFF"][m.seed % 3]} /> : null}
          </React.Fragment>
        );
      })}
      <Sky t={c.t} tint="sunset" seed="cap" />
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 trapped (stormy night → time-lapse)

/** The tall building on the right side of the quake street (kit units), picked from the street layout. */
const QUAKE_SPECS = streetLayout("quake");
const TOWER_INDEX = QUAKE_SPECS.reduce((best, s, i) => (s.position[0] > 0 && Math.abs(s.position[2] + 3) < Math.abs(QUAKE_SPECS[best].position[2] + 3) ? i : best), QUAKE_SPECS.findIndex((s) => s.position[0] > 0));
const TOWER = QUAKE_SPECS[TOWER_INDEX];
const TOWER_H = 15;
const TOWER_WORLD: V3 = [TOWER.position[0] * CITY, 0, TOWER.position[2] * CITY];
const quakeStreet = (lt: number, collapse = 0) => (sp: { position: V3 }, i: number) => {
  if (i === TOWER_INDEX) return { h: TOWER_H, sink: collapse * 0.97, tilt: [0, 0.03 * Math.sin(lt * 10) * (1 - collapse) - collapse * 0.05] as [number, number] };
  return { tilt: [0.012 * Math.sin(lt * 9 + i), 0.012 * Math.sin(lt * 11 + i * 2)] as [number, number] };
};
const SLAV_QUAKE: V3 = [17.0, 0, 5];
const flicker = (t: number) => random(`fl${Math.floor(t * 12)}`) > 0.35;

const c4Quake: ShotFn = (c) => {
  const cam = move({ position: [17.6, 4.6, 20], target: [17.0, 4.4, 2] }, { position: [17.5, 4.5, 18.4], target: [17.0, 4.6, 2] }, c);
  const flash = Math.max(0, 1 - Math.abs(c.lt - 0.95) / 0.12);
  const pose = mergePose(REST, {
    lShoulder: [0.2, 1.25 + 0.2 * Math.sin(c.lt * 12)],
    rShoulder: [0.2, 1.25 - 0.2 * Math.sin(c.lt * 12)],
    lElbow: 0.3,
    rElbow: 0.3,
    lHip: [0.1, 0.25],
    rHip: [-0.1, 0.25],
    lKnee: 0.3,
    rKnee: 0.3,
    side: 0.08 * Math.sin(c.lt * 10),
    expression: "alarm",
    headPitch: 0.3,
  });
  return (
    <Shot mood="storm" camera={cam} fog={[20, 160]} shadowSize={30} shake={0.22} light={0.9} overlay={<Wash color="#E8F0FF" opacity={flash * 0.55} />}>
      <BigStreet seed="quake" lampsOn={flicker(c.t)} modify={quakeStreet(c.lt)} cars={false} />
      <Hero pose={{ ...pose, bob: -0.25 }} position={SLAV_QUAKE} yaw={-0.15} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Hero key={i} pose={walkPose(c.lt * 2.2 + i * 0.3, 1)} position={[15 + (i % 2) * 3.5, 0, -6 - i * 4 + c.lt * 3]} look={crowdLook(110 + i)} />
      ))}
      <Rain center={[15, 10, -4]} size={[26, 24, 30]} t={c.t} count={900} seed="qr" thickness={0.05} />
      <LightningBolt top={[-30, 90, -160]} bottom={[-20, 0, -150]} flash={flash} seed="q1" />
    </Shot>
  );
};

/** Looking up past him at the tower above: chunks breaking off the top. */
const c4Up: ShotFn = (c) => {
  const dx = TOWER_WORLD[0] - 3 - SLAV_QUAKE[0];
  const dz = TOWER_WORLD[2] - SLAV_QUAKE[2];
  const dl = Math.hypot(dx, dz);
  const back: V3 = [SLAV_QUAKE[0] - (dx / dl) * 5, 2.2, SLAV_QUAKE[2] - (dz / dl) * 5];
  const aim = (e: number): V3 => [back[0] + (dx / dl) * 17.3, back[1] + e, back[2] + (dz / dl) * 17.3];
  const cam = move({ position: back, target: aim(9.5) }, { position: [back[0] + (dx / dl) * 0.6, 2.1, back[2] + (dz / dl) * 0.6], target: aim(11) }, c);
  const flash = Math.max(0, 1 - Math.abs(c.lt - 0.4) / 0.1);
  return (
    <Shot mood="storm" camera={cam} fog={[30, 200]} shadowSize={40} shake={0.18} light={0.9} overlay={<Wash color="#E8F0FF" opacity={flash * 0.5} />}>
      <BigStreet seed="quake" lampsOn={flicker(c.t)} modify={quakeStreet(c.lt + 2)} cars={false} />
      <Hero pose={mergePose(REST, { expression: "alarm", headPitch: 0.75, lShoulder: [0.3, 0.9], rShoulder: [0.3, 0.9], lElbow: 0.6, rElbow: 0.6 })} position={SLAV_QUAKE} yaw={Math.atan2(TOWER_WORLD[0] - 3 - SLAV_QUAKE[0], TOWER_WORLD[2] - SLAV_QUAKE[2])} />
      <Debris origin={[TOWER_WORLD[0] - 8, TOWER_H * CITY - 2, TOWER_WORLD[2] + 4]} t={c.lt * 0.9} count={14} speed={4} seed="top" color={P.bldgSlate} />
      <Rain center={[16, 12, -2]} size={[20, 26, 24]} t={c.t} count={700} seed="qr2" thickness={0.05} />
    </Shot>
  );
};

/** The tower comes down into its own dust: the street disappears in a wall of grey. */
const c4Collapse: ShotFn = (c) => {
  const cam = move({ position: [-2, 12, 82], target: [16, 20, -4] }, { position: [-1.5, 11.5, 78], target: [16, 18, -4] }, c);
  const fall = k01(c.lt, 0.12, 1.1);
  return (
    <Shot mood="storm" camera={cam} fog={[30, 220]} shadowSize={60} shake={0.3 * (1 - lin(c.lt, 0.9, 1.4))} light={0.85} overlay={<Wash color="#E8F0FF" opacity={Math.max(0, 1 - Math.abs(c.lt - 0.2) / 0.1) * 0.45} />}>
      <BigStreet seed="quake" lampsOn={false} modify={quakeStreet(c.lt + 4, fall)} cars={false} />
      <SmokeCluster position={[TOWER_WORLD[0] - 4, 0, TOWER_WORLD[2]]} progress={lin(c.lt, 0.15, 1.4) * 0.85} radius={26} count={16} seed="col" rise={14} color="#D6D0CA" />
      <SmokeCluster position={[TOWER_WORLD[0] - 16, 0, TOWER_WORLD[2] + 14]} progress={lin(c.lt, 0.45, 1.6) * 0.7} radius={18} count={12} seed="col2" rise={6} color="#DCD6D0" />
      <Hero pose={walkPose(c.lt * 2.6, 1.3)} position={[SLAV_QUAKE[0] - 1, 0, SLAV_QUAKE[2] + 8 + c.lt * 7]} yaw={-0.2} />
      <Rain center={[10, 15, 30]} size={[60, 30, 60]} t={c.t} count={1200} seed="qr3" thickness={0.1} />
    </Shot>
  );
};

/** Slavoski pinned under the slab: lying on his back, face up, his free right arm out on the rubble. */
const trapPose = (lt: number, over: Partial<Pose> = {}): Pose =>
  mergePose(REST, {
    ...legsFlat(Math.PI / 2, 0.1),
    rShoulder: [-0.35, 1.35 + 0.08 * Math.sin(lt * 2.2)],
    rElbow: 0.25,
    lShoulder: [0.0, 0.18],
    lElbow: 0.1,
    headPitch: 0.05,
    expression: "worried",
    ...over,
  });
const Trapped: React.FC<{ lt: number; pose?: Pose; look?: HeroLook }> = ({ lt, pose, look = dusty(0.6) }) => (
  <Reclined hip={TRAP.hip} yaw={0} back={Math.PI / 2} pose={pose ?? trapPose(lt)} look={look} />
);

/** Broken stumps of the buildings around the pile. */
const RUINS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 + random(`ru${i}`) * 0.4;
  const r = 22 + random(`rr${i}`) * 12;
  return { p: [Math.cos(a) * r, 0, Math.sin(a) * r] as V3, w: 9 + random(`rw${i}`) * 6, h: 8 + random(`rh${i}`) * 14, seed: `ruin${i}`, color: [P.bldgSlate, P.bldgNavy, P.bldgTeal, P.bldgPurple][i % 4] };
});
const Ruins: React.FC<{ decay?: number; sink?: number }> = ({ decay = 0.3, sink = 0.35 }) => (
  <group>
    {RUINS.map((r) => (
      <Building key={r.seed} position={r.p} w={r.w} d={r.w} h={r.h} color={r.color} seed={r.seed} power={0} decay={decay} sink={sink} tilt={[0.05, -0.04]} />
    ))}
  </group>
);

/** Dust settling over the pile in the rain; his head and one arm show under the slab. */
const c4Rubble: ShotFn = (c) => {
  const cam = move({ position: [2.0, 6.8, 4.6], target: [-0.5, 0.9, -2.2] }, { position: [1.8, 6.4, 4.1], target: [-0.5, 0.9, -2.2] }, c);
  return (
    <Shot mood="storm" camera={cam} fog={[8, 70]} shadowSize={14} light={0.95}>
      <Ground color="#4A4E58" />
      <Rubble spread={1.6} count={90} />
      <Ruins />
      <Trapped lt={c.lt} pose={trapPose(c.lt, { expression: "alarm", blink: c.lt > 0.6 && c.lt < 0.68 ? 1 : 0 })} />
      <SmokeCluster position={[-4, 0, -8]} progress={0.55 + c.lt * 0.15} radius={9} count={10} seed="settle" rise={2} color="#8A847E" />
      <Rain center={[-1, 5, -4]} size={[12, 10, 10]} t={c.t} count={400} seed="rr" thickness={0.025} opacity={0.5} />
    </Shot>
  );
};

/** Top-down on his face: he strains, can't move. */
const TOP = (h: number, dz = 0.3): CameraSpec => ({ position: [TRAP.head[0], h, TRAP.head[2] + dz], target: [TRAP.head[0], 0, TRAP.head[2] + dz], up: [0, 0, -1] });
const c4Pinned: ShotFn = (c) => {
  const cam = move(TOP(7.6, 0.8), TOP(6.8, 0.7), c);
  const strain = Math.sin(c.lt * 9);
  const pose = trapPose(c.lt, { expression: "alarm", headYaw: 0.18 * strain, rShoulder: [-0.15 + 0.2 * strain, 1.2], rElbow: 0.6 + 0.3 * strain });
  return (
    <Shot mood="storm" camera={cam} fog={[8, 70]} shadowSize={10} light={0.95} shake={0.03}>
      <Ground color="#4A4E58" />
      <Rubble spread={1.6} count={90} />
      <Trapped lt={c.lt} pose={pose} />
    </Shot>
  );
};

/** The camera rises straight up: a field of rubble, nobody coming. */
const c4Rise: ShotFn = (c) => {
  const k = ease(clamp01(c.lt / Math.max(0.8, span(c.dur))));
  const cam = TOP(7 + k * 58, 0.8 + k * 2);
  return (
    <Shot mood="storm" camera={cam} fog={[30, 160]} shadowSize={60} light={0.95}>
      <Ground color="#4A4E58" />
      <Rubble spread={2.6} count={180} />
      <Ruins />
      <Trapped lt={c.lt} />
    </Shot>
  );
};

/** Close on his face. A slow blink. */
const c4Face: ShotFn = (c) => {
  const a = 0.12 + c.lt * 0.1;
  const h = 4.8 - c.lt * 0.35;
  const cam: CameraSpec = { position: [TRAP.head[0], h, TRAP.head[2] + 0.25], target: [TRAP.head[0], 0, TRAP.head[2] + 0.25], up: [Math.sin(a), 0, -Math.cos(a)] };
  return (
    <Shot mood="storm" camera={cam} fog={[8, 60]} shadowSize={8} light={0.95}>
      <Ground color="#4A4E58" />
      <Rubble spread={1.6} count={90} />
      <Trapped lt={c.lt} pose={trapPose(c.lt, { expression: "worried", blink: c.lt > 0.7 && c.lt < 0.92 ? 1 : 0, headYaw: -0.1 })} />
      <Rain center={[-0.5, 2.5, -3.5]} size={[5, 5, 4]} t={c.t} count={90} seed="rf" thickness={0.02} opacity={0.45} />
    </Shot>
  );
};

/** Grass blades around the pile, placed clear of his head, body and free arm. */
const GRASS_PTS: V3[] = (() => {
  const out: V3[] = [];
  for (let i = 0; i < 900 && out.length < 360; i++) {
    const x = (random(`gp${i}x`) - 0.5) * 12;
    const z = (random(`gp${i}z`) - 0.5) * 14 - 1;
    if (Math.hypot(x, z + 1.95) < 1.1) continue; // head
    if (x > -3.1 && x < -0.5 && z > -1.7 && z < -0.2) continue; // free arm
    out.push([x, TRAP.floor, z]);
  }
  return out;
})();

/** Time-lapse from above: days flicker past, grass and moss creep over the slab. */
const c4Lapse: ShotFn = (c) => {
  const cam = move({ position: [2.4, 7.4, 4.9], target: [-0.5, 0.8, -2.0] }, { position: [2.6, 7.9, 5.4], target: [-0.5, 0.8, -2.0] }, c);
  const g = lin(c.lt, 0, Math.max(0.8, span(c.dur)));
  const night = 0.5 + 0.5 * Math.sin(c.lt * 34);
  return (
    <Shot mood="overcast" camera={cam} fog={[30, 160]} shadowSize={14} keyDir={[Math.cos(c.lt * 34), 0.8, Math.sin(c.lt * 34)]} overlay={<Wash color="#060A1A" opacity={night * 0.5} />}>
      <Ground color="#4A5A48" />
      <Rubble spread={1.6} count={90} moss={g * 0.8} />
      <Trapped lt={c.lt} look={dusty(0.6)} pose={trapPose(c.lt, { expression: "worried", blink: Math.sin(c.lt * 23) > 0.9 ? 1 : 0 })} />
      <GrassTufts points={GRASS_PTS} growth={g} height={0.7} seed="lapse" />
      {[-5, 4, -4.5, 5.5].map((x, i) => (
        <Bush key={i} position={[x, TRAP.floor, [-5.5, -4.8, 4.5, 3.6][i]]} size={1.3} growth={clamp01(g * 1.4 - i * 0.12)} seed={`lb${i}`} />
      ))}
    </Shot>
  );
};

/** A thousand years on: trees grown through the ruins, the pile under moss… and he is still there. */
const c4Overgrown: ShotFn = (c) => {
  const cam = move({ position: [2.4, 11.5, 8.6], target: [-0.4, 0.9, -2.6] }, { position: [2.2, 10.6, 7.8], target: [-0.4, 0.9, -2.6] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[30, 160]} shadowSize={16} light={1.05} keyDir={[0.6, 0.45, -0.7]}>
      <Ground color="#3E6A40" />
      <Rubble spread={1.6} count={90} moss={0.85} />
      <Ruins decay={1} sink={0.5} />
      <Trapped lt={c.lt} look={dusty(0.5, "#6A8A5A")} pose={trapPose(c.lt, { expression: "worried", headYaw: -0.25, blink: c.lt > 1.0 && c.lt < 1.1 ? 1 : 0 })} />
      <GrassTufts points={GRASS_PTS} growth={1} height={0.8} seed="og" />
      {[
        [-7, -8],
        [5, -9],
        [-9, 2],
        [-4, -13],
        [10, -3],
      ].map(([x, z], i) => (
        <LeafyTree key={i} position={[x, 0, z]} scale={2.2 + random(`ogt${i}`) * 0.8} seed={`og${i}`} />
      ))}
      {[-5, -4.5, 5.5].map((x, i) => (
        <Bush key={i} position={[x, TRAP.floor, [-5.5, 4.5, 3.6][i]]} size={1.5} seed={`ob${i}`} />
      ))}
      <Sky t={c.t} tint="dawn" seed="og" />
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 the dying Sun

/** Earth spins faster and faster: the years race by. */
const c5Spin: ShotFn = (c) => {
  const cam = move({ position: [0, 1.2, 19], target: [0, 0, 0] }, { position: [0, 1.0, 16.5], target: [0, 0, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.75} keyDir={[0.9, 0.3, 0.4]}>
      <FacetedEarth radius={3} rotation={[0.35, c.t * 0.5 + c.lt * c.lt * 3, 0]} cityLights={0.3} />
      <RedGiant position={[70, 26, -160]} radius={5} k={0} t={c.t} />
    </Shot>
  );
};

/** The Sun swells red, far above a small Earth that browns and dries. */
const c5Swell: ShotFn = (c) => {
  const k = k01(c.lt, 0.1, 2.3);
  const cam = move({ position: [0, -1, 24], target: [0, 9, -60] }, { position: [0, -1.2, 22], target: [0, 10, -60] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.7} keyDir={[0, 0.5, -1]}>
      <FacetedEarth radius={2.2} position={[0, -4.6, 4]} rotation={[0.35, c.t * 0.4, 0]} heat={k * 0.8} clouds={k < 0.5} />
      <RedGiant position={[0, 34, -190]} radius={8 + 58 * k} k={k} t={c.t} />
    </Shot>
  );
};

/** Ground level: the oceans are gone; a ship lies on a cracked seabed under a red sun filling the sky. */
const SUN_POS: V3 = [0, 24, -480];
const c5Scorch: ShotFn = (c) => {
  const cam = move({ position: [8, 3.4, 34], target: [0, 9, -60] }, { position: [7, 3.2, 31], target: [0, 9.5, -60] }, c);
  return (
    <Shot mood="dust" camera={cam} fog={[80, 520]} shadowSize={80} dust={1} keyDir={[0, 0.25, -1]} light={0.8}>
      <ScorchedGround />
      <LavaCrack points={[[-30, 0, 10], [-12, 0, -4], [-4, 0, -30], [10, 0, -60]]} width={0.9} glow={1} />
      <LavaCrack points={[[24, 0, 14], [12, 0, -10], [20, 0, -40]]} width={0.7} glow={1} />
      <group position={[-26, -1.5, -70]} rotation={[0.04, 0.7, 0.2]}>
        <ContainerShip position={[0, 0, 0]} t={0} radar={false} />
      </group>
      <RedGiant position={SUN_POS} radius={125} k={1} t={c.t} />
    </Shot>
  );
};

/** Slavoski alone on the scorched Earth, shading his eyes against the swollen red sun. */
const SLAV_SUN: V3 = [0, 0, 0];
const c5Alive: ShotFn = (c) => {
  const cam = move({ position: [1.6, 1.9, 12.5], target: [0, 5.2, -2] }, { position: [1.4, 2.0, 10.8], target: [0, 5.0, -2] }, c);
  const base = mergePose(REST, { expression: c.lt > 0.6 ? "worried" : "awe", headPitch: 0.15, blink: c.lt > 1.1 && c.lt < 1.18 ? 1 : 0 });
  const head = headPosition(base, SLAV_SUN, 0.15);
  const pose = reach(base, "r", [head[0] - 0.1, head[1] + 0.55, head[2] + 0.75], { position: SLAV_SUN, yaw: 0.15 }).pose;
  return (
    <Shot mood="dust" camera={cam} fog={[80, 520]} shadowSize={20} dust={1} keyDir={[0, 0.3, -1]} light={0.85}>
      <ScorchedGround />
      <LavaCrack points={[[-12, 0, 6], [-3, 0, -6], [4, 0, -30]]} width={0.5} glow={1} />
      <Hero pose={pose} position={SLAV_SUN} yaw={0.15} look={dusty(0.5, "#8A5A48")} />
      <pointLight position={[0, 6, 8]} color="#FF8A5A" intensity={40} distance={20} decay={2} />
      <RedGiant position={SUN_POS} radius={125} k={1} t={c.t} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 06 the last light

const c6Fade: ShotFn = (c) => {
  const k = lin(c.lt, 0, 2.2) * 0.45;
  const cam = move({ position: [0, 0, 30], target: [0, 0, 0] }, { position: [0, 0.6, 27], target: [0, 0, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} stars={false} light={0.5}>
      <FadingStars k={k} />
      <Galaxy position={[-4, 6, -20]} rotation={[0.9, 0, 0.3]} size={5} o={1 - lin(c.lt, 0.3, 1.0)} seed="g1" />
      <Galaxy position={[5, -5, -26]} rotation={[0.4, 0, -0.4]} size={6} o={1 - lin(c.lt, 0.8, 1.5)} seed="g2" color="#F2D8C8" />
      <Galaxy position={[2, 10, -40]} rotation={[1.2, 0, 0.1]} size={7} o={1 - lin(c.lt, 1.3, 1.9)} seed="g3" color="#BFD8F0" />
    </Shot>
  );
};

/** Floating in the cold, frost creeping over him; he hugs himself. */
const FLOAT: V3 = [0, 0, 0];
const HUG = (() => {
  const base = mergePose(REST, { lShoulder: [0.9, -0.3], rShoulder: [0.9, -0.3], lElbow: 1.6, rElbow: 1.6 });
  const l = reach(base, "l", [-0.42, 2.35, 0.62]).pose;
  return reach(l, "r", [0.42, 2.2, 0.66]).pose;
})();
const floatPose = (lt: number, frost: number): Pose =>
  mergePose(REST, {
    lShoulder: HUG.lShoulder,
    rShoulder: HUG.rShoulder,
    lElbow: HUG.lElbow,
    rElbow: HUG.rElbow,
    lHip: [0.35, 0.1],
    rHip: [0.1, 0.1],
    lKnee: 0.8,
    rKnee: 0.5,
    headPitch: -0.1,
    expression: "worried",
    side: 0.03 * Math.sin(lt * 40) * frost,
  });
const c6Cold: ShotFn = (c) => {
  const frost = 0.25 + lin(c.lt, 0, 1.6) * 0.6;
  const cam = move({ position: [0.8, 3.0, 9.5], target: [0, 2.6, 0] }, { position: [0.6, 3.0, 8.2], target: [0, 2.7, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} stars={false} light={0.75} keyDir={[0.6, 0.5, 0.6]}>
      <FadingStars k={0.55} />
      <group position={[FLOAT[0], FLOAT[1] + Math.sin(c.t * 0.9) * 0.1, FLOAT[2]]} rotation={[0.08, 0.2 + c.lt * 0.05, -0.12]}>
        <Hero pose={floatPose(c.lt, frost)} look={frosty(frost)} />
      </group>
    </Shot>
  );
};

/** The last star, a dim red dwarf behind him, flickers and goes out. */
const c6LastStar: ShotFn = (c) => {
  const k = k01(c.lt, 0.4, 2.2);
  const cam = move({ position: [-1.5, 3.0, 11.5], target: [1.5, 4.5, -40] }, { position: [-1.4, 3.0, 10.5], target: [1.5, 4.6, -40] }, c);
  const flick = k < 1 ? 0.85 + 0.15 * Math.sin(c.lt * 31) : 0;
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} stars={false} light={0.5 * (1 - k * 0.8)} keyDir={[0.3, 0.2, -1]}>
      <FadingStars k={0.7 + k * 0.28} />
      {k < 0.98 ? <RedGiant position={[6, 22, -70]} radius={2.6 * (1 - k * 0.6)} k={1} t={c.t} /> : null}
      {k < 0.98 ? <Halo position={[6, 22, -69]} size={26 * (1 - k) * flick} color="#C8281A" opacity={0.6} /> : null}
      <group position={[0, Math.sin(c.t * 0.9) * 0.1, 0]} rotation={[0.08, 2.6, -0.12]}>
        <Hero pose={floatPose(c.lt, 0.85)} look={frosty(0.85)} />
      </group>
    </Shot>
  );
};

/** Pull back until he is one faint speck in total darkness. */
const c6Speck: ShotFn = (c) => {
  const k = ease(clamp01(c.lt / Math.max(1, span(c.dur))));
  const d = 9 + k * k * 260;
  const cam: CameraSpec = { position: [0.3, 2.4 + k * 4, d], target: [0, 2.4, 0] };
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} stars={false} light={0.35}>
      <group position={[0, Math.sin(c.t * 0.9) * 0.1, 0]} rotation={[0.08, 0.3, -0.12]}>
        <Hero pose={floatPose(c.lt, 0.9)} look={frosty(0.9)} />
      </group>
      <Halo position={[0, 2.4, 0]} size={3 + k * 18} color="#9AB8D8" opacity={0.25} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 07 the curse

const c7Gift: ShotFn = (c) => {
  const cam = move({ position: [0, 3.4, 10], target: [0, 1.6, 0] }, { position: [0, 3.2, 8.8], target: [0, 1.6, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} stars={false} shadows={false} light={0.8} keyDir={[0.5, 1, 0.6]}>
      <FadingStars k={0.85} />
      <GiftBox position={[0, 0, 0]} size={2.2} rotation={[0, 0.5 + c.t * 0.25, 0]} glow={0.15} />
      <Halo position={[0, 1.1, -1]} size={9} color="#FFD27A" opacity={0.25} />
    </Shot>
  );
};

/** The lid lifts: golden light… that turns cold and goes out. */
const c7Open: ShotFn = (c) => {
  const cam = move({ position: [0, 5.2, 11], target: [0, 2.8, 0] }, { position: [0, 5.2, 10], target: [0, 2.9, 0] }, c);
  const open = k01(c.lt, 0.05, 0.6);
  const cold = k01(c.lt, 1.0, 1.6);
  const glow = open * (1 - cold * 0.85);
  const color = cold > 0.5 ? "#8FA8C8" : "#FFD27A";
  return (
    <Shot mood="space" camera={cam} fog={false} stars={false} shadows={false} light={0.8 - cold * 0.4} keyDir={[0.5, 1, 0.6]}>
      <FadingStars k={0.85} />
      <GiftBox position={[0, 0, 0]} size={2.2} rotation={[0, 0.5 + c.t * 0.25, 0]} open={open} glow={glow} glowColor={color} />
    </Shot>
  );
};

/** Back on the lawn where it started: he looks at us as a cloud covers the sun. */
const c7Lawn: ShotFn = (c) => {
  const cam = move({ position: [9.4, 2.7, 2.6], target: [2.45, 2.7, 7.6] }, { position: [8.3, 2.65, 3.3], target: [2.45, 2.65, 7.6] }, c);
  const dim = k01(c.lt, 0.4, 1.6);
  const back = 0.12;
  const pose = mergePose(REST, {
    ...legsFlat(back, 0.42),
    lShoulder: [-0.35, 0.25],
    rShoulder: [-0.35, 0.25],
    lElbow: 0.1,
    rElbow: 0.1,
    headYaw: -0.55 * k01(c.lt, 0.2, 0.7),
    headPitch: 0.05,
    expression: c.lt > 0.9 ? "worried" : "neutral",
    blink: c.lt > 1.5 && c.lt < 1.58 ? 1 : 0,
  });
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={14} keyDir={[0.7, 0.8, 0.6]} light={1 - dim * 0.4} overlay={<Wash color="#0A0E26" opacity={dim * 0.28} />}>
      <Garden banner />
      <Sky t={c.t} tint="day" seed="hook" />
      <LadderDown />
      <Reclined hip={SIT_HIP} yaw={Math.PI} back={back} pose={pose} />
    </Shot>
  );
};

// ---------------------------------------------------------------- thumbnail

/** Shorts cover: Slavoski on the scorched Earth under the swollen red sun. */
export const thumbShot: ShotFn = () => {
  const base = mergePose(REST, { expression: "alarm", headPitch: 0.25 });
  const head = headPosition(base, SLAV_SUN, 0.15);
  const pose = reach(base, "r", [head[0] - 0.1, head[1] + 0.55, head[2] + 0.75], { position: SLAV_SUN, yaw: 0.15 }).pose;
  const cam: CameraSpec = { position: [1.4, 1.6, 13], target: [0, 7.5, -2] };
  return (
    <Shot mood="dust" camera={cam} fog={[80, 520]} shadowSize={20} dust={1} keyDir={[0, 0.3, -1]} light={0.85}>
      <ScorchedGround />
      <LavaCrack points={[[-12, 0, 6], [-3, 0, -6], [4, 0, -30]]} width={0.5} glow={1} />
      <Hero pose={pose} position={SLAV_SUN} yaw={0.15} look={dusty(0.5, "#8A5A48")} />
      <pointLight position={[0, 6, 8]} color="#FF8A5A" intensity={40} distance={20} decay={2} />
      <RedGiant position={SUN_POS} radius={125} k={1} t={2} />
    </Shot>
  );
};

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldFall },
    { cue: "eight billion", fn: coldSitUp },
    { cue: "suddenly", fn: coldMonitor },
  ],
  c1: [
    { cue: null, fn: c1Plaza },
    { cue: "humanity's greatest", fn: c1Cheer },
    { cue: "No more death", fn: c1Ward },
    { cue: "no more funerals", fn: c1Funeral },
    { cue: "no more fear", fn: c1Cake },
  ],
  c2: [
    { cue: null, fn: c2Drop },
    { cue: "massive problem", fn: c2Family },
    { cue: "People would", fn: c2Nursery },
    { cue: "while nobody", fn: c2Balance },
  ],
  c3: [
    { cue: null, fn: c3Grow },
    { cue: "unimaginable", fn: c3Endless },
    { cue: "Food would", fn: c3Market },
    { cue: "cities would", fn: c3Crowd },
    { cue: "and entire", fn: c3Capitol },
  ],
  c4: [
    { cue: null, fn: c4Quake },
    { cue: "the worst part", fn: c4Up },
    { cue: "Imagine being", fn: c4Collapse },
    { cue: "collapsed building", fn: c4Rubble },
    { cue: "You can't move", fn: c4Pinned },
    { cue: "you can't escape", fn: c4Rise },
    { cue: "and you can't die", fn: c4Face },
    { cue: "You could remain", fn: c4Lapse },
    { cue: "thousands of years", fn: c4Overgrown },
  ],
  c5: [
    { cue: null, fn: c5Spin },
    { cue: "billions of years", fn: c5Swell },
    { cue: "make Earth", fn: c5Scorch },
    { cue: "but you'd still", fn: c5Alive },
  ],
  c6: [
    { cue: null, fn: c6Fade },
    { cue: "colder and darker", fn: c6Cold },
    { cue: "you'd face", fn: c6LastStar },
    { cue: "an eternity", fn: c6Speck },
  ],
  c7: [
    { cue: null, fn: c7Gift },
    { cue: "humanity's greatest gift", fn: c7Open },
    { cue: "it might be its", fn: c7Lawn },
  ],
};

export { SLAVOSKI };
