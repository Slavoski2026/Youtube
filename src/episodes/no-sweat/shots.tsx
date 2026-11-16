/**
 * Shots for "What If Nobody Could Sweat?" (ep. 8).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * The hook opens on Slavoski's face mid-jog: his sweat dries up and vanishes in the first second.
 */
import type { Caption } from "@remotion/captions";
import React, { useMemo } from "react";
import { AbsoluteFill, random } from "remotion";
import * as THREE from "three";
import { Car, CityGrid, Lamp, PineTree, StreetSet } from "../../slavoski/city";
import { BoxG, IcoG } from "../../slavoski/detail";
import { crowdLook, SLAVOSKI, type HeroLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Clouds, LeafyTree } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { CardLine } from "../../slavoski/Overlays";
import { mix, P } from "../../slavoski/palette";
import { DIM, handPosition, headPosition, Hero, lerpPose, mergePose, reach, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { CanvasPanel, fitText } from "../../slavoski/screens";
import { FacetedEarth } from "../../slavoski/space";
import { lerpCam, project, Stage, type CameraSpec } from "../../slavoski/Stage";
import { type CuedShot } from "../../slavoski/timeline";
import { Crane, HillRing, House, SkyscraperSite, Stall } from "../no-work-2036/props";
import { CITY } from "../ww3-countdown/props";
import {
  Backyard,
  BodyGlow,
  Bottle,
  Breath,
  DeckChair,
  EcgStrip,
  FaceSweat,
  faceSurface,
  flushed,
  grounded,
  HangingShirt,
  HardHat,
  headPoint,
  HeatHaze,
  HeatRings,
  Lake,
  Leaves,
  Lift,
  Park,
  ParkSkyline,
  PedestalFan,
  Pin,
  RedPulse,
  Rooftop,
  runPose,
  SignBoard,
  SKIN,
  SkinSection,
  Sparkle,
  StinkLines,
  Sun,
  SweatPatches,
  TempSign,
  ThermalGround,
  ThermalHud,
  thermalLook,
  torsoPoint,
  Track,
  TRACK,
  WindStreaks,
  XRayBody,
} from "./props";
import { bodyTemp } from "./temp";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
const startFrame = (c: ShotCtx) => Math.round((c.t - c.lt) * 30);
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const Shot: React.FC<{ children: React.ReactNode; overlay?: React.ReactNode } & React.ComponentProps<typeof Stage>> = ({ children, overlay, ...stage }) => (
  <AbsoluteFill>
    <Stage {...stage}>{children}</Stage>
    {overlay}
  </AbsoluteFill>
);

/** Kit street ×3.5 so it matches Slavoski (road |x| < 12.25, pavements to 21.35). `day` dims practicals. */
const BigStreet: React.FC<React.ComponentProps<typeof StreetSet> & { day?: boolean }> = ({ day = false, ...props }) => (
  <group scale={CITY}>
    <StreetSet {...props} lampsOn={day ? false : props.lampsOn} modify={day ? (sp, i) => ({ power: 0.3, ...(props.modify?.(sp, i) ?? {}) }) : props.modify} />
  </group>
);

/** A gradient sky dome (for the heatwave's washed-out orange sky). */
const SkyDome: React.FC<{ top: string; horizon: string; r?: number }> = ({ top, horizon, r = 1400 }) => {
  const geom = useMemo(() => {
    const g = new THREE.SphereGeometry(r, 24, 16);
    const pos = g.getAttribute("position");
    const cols = new Float32Array(pos.count * 3);
    const a = new THREE.Color(top);
    const b = new THREE.Color(horizon);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / r;
      c.copy(b).lerp(a, clamp01(y * 1.6));
      cols.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    return g;
  }, [top, horizon, r]);
  return (
    <mesh geometry={geom}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

const HOT = { top: "#E89A5A", horizon: "#FFE2A6" };
const SCORCH = { top: "#D8703E", horizon: "#FFC27A" };

/** Extra warm light for the heat shots. */
const HeatLight: React.FC<{ k?: number }> = ({ k = 1 }) => <directionalLight color="#FFB070" intensity={0.55 * k} position={[30, 40, 20]} />;

const CLOUD = { day: "#F4F6FA", overcast: "#AEB6C2", sunset: "#F7C0A0" } as const;

/** Module-level cache for `reach` solutions (shot functions can't use hooks). */
const reachCache = new Map<string, Pose>();
const reachC = (key: string, base: Pose, side: "l" | "r", target: V3, position: V3): Pose => {
  const k = `${key}|${target.map((v) => v.toFixed(2)).join(",")}|${position.map((v) => v.toFixed(2)).join(",")}`;
  let p = reachCache.get(k);
  if (!p) {
    p = reach(base, side, target, { position }).pose;
    reachCache.set(k, p);
  }
  return p;
};

/** A crowd member walking or running along a heading. */
type Walker = { x: number; z: number; yaw: number; speed: number; run?: boolean; seed: number; phase?: number };
const walkerAt = (w: Walker, t: number) => {
  const d = w.speed * t;
  const pos: V3 = [w.x + Math.sin(w.yaw) * d, 0, w.z + Math.cos(w.yaw) * d];
  const ph = (w.phase ?? 0) + t * (w.run ? 1.5 : 0.95);
  const pose = w.run ? runPose(ph) : grounded(walkPose(ph, 0.9));
  return { pos, pose };
};
const Walkers: React.FC<{ list: Walker[]; t: number; look?: (seed: number) => HeroLook }> = ({ list, t, look = crowdLook }) => (
  <>
    {list.map((w, i) => {
      const { pos, pose } = walkerAt(w, t);
      return <Hero key={i} pose={pose} position={pos} yaw={w.yaw} look={look(w.seed)} />;
    })}
  </>
);

/** Camera locked on a face for close-ups: target sits below the head so the face stays above the captions. */
const faceCam = (head: V3, off: V3, drop = 0.5, fov = 40): CameraSpec => ({ position: add(head, off), target: [head[0], head[1] - drop, head[2]], fov });

// ================================================================ cold open: the hook

/** 0 s: extreme close-up mid-jog, sweat beads on his face… that dry up and vanish. */
const coldDrop: ShotFn = (c) => {
  const z = -6 + c.lt * 3.2;
  const hero: V3 = [0, 0, z];
  const pose = runPose(c.lt * 1.5, { expression: c.lt > 0.8 ? "awe" : "neutral", headPitch: -0.05 });
  const head = headPosition(pose, hero);
  const cam = faceCam([head[0], head[1] - (pose.bob - 0.08) * 0.7, head[2]], [0.55, 0.12, 2.9], 0.5);
  const dry = k01(c.lt, 0.38, 0.72);
  return (
    <Shot mood="day" camera={cam} fog={[60, 420]} shadowSize={14} keyDir={[0.55, 0.5, 0.8]} shake={0.012}>
      <Park seed="hook" />
      <Clouds t={c.t} color={CLOUD.day} y={45} radius={220} count={14} seed="hook" />
      <Sun position={[-70, 95, -240]} r={7} heat={0.3} />
      <Hero pose={pose} position={hero} />
      <FaceSweat pose={pose} position={hero} amount={1 - dry} />
      {[0, 1, 2].map((i) => (
        <Sparkle key={i} position={headPoint(pose, faceSurface([0.0, 0.44, -0.45][i], [0.29, 0.22, 0.26][i], 0.08), hero)} k={k01(c.lt, 0.58 + i * 0.05, 0.86 + i * 0.05) * 0.999} size={0.07} />
      ))}
    </Shot>
  );
};

const PARK_CROWD: Walker[] = [
  { x: -2.4, z: -14, yaw: 0, speed: 3.0, run: true, seed: 1, phase: 0.3 },
  { x: 2.4, z: -22, yaw: Math.PI, speed: 2.8, run: true, seed: 2, phase: 0.1 },
  { x: -1.8, z: -34, yaw: 0, speed: 1.6, seed: 3 },
  { x: 2.2, z: -40, yaw: Math.PI, speed: 1.5, seed: 4, phase: 0.5 },
  { x: -12, z: -10, yaw: 1.2, speed: 1.4, seed: 5 },
  { x: 12, z: -18, yaw: -2.1, speed: 1.3, seed: 6, phase: 0.2 },
  { x: -16, z: -30, yaw: 0.4, speed: 1.4, seed: 7 },
  { x: 15, z: -6, yaw: -0.6, speed: 1.2, seed: 8, phase: 0.7 },
  { x: 8, z: 2, yaw: 2.6, speed: 1.3, seed: 9 },
  { x: -9, z: 4, yaw: -2.4, speed: 1.3, seed: 10, phase: 0.4 },
  { x: 20, z: -34, yaw: -1.4, speed: 1.4, seed: 11 },
  { x: -22, z: -20, yaw: 1.6, speed: 1.3, seed: 12, phase: 0.6 },
];

/** The park, wide: joggers and walkers everywhere on a hot, bright morning. The title comes in. */
const coldCrowd: ShotFn = (c) => {
  const cam = move({ position: [16, 15, 30], target: [0, 1, -10] }, { position: [13, 13.5, 27], target: [0, 1.5, -10] }, c);
  const hero: V3 = [0.3, 0, -3 + c.lt * 3.2];
  return (
    <Shot mood="day" camera={cam} fog={[80, 480]} shadowSize={40} keyDir={[0.55, 0.55, 0.8]}>
      <Park seed="hook" />
      <Clouds t={c.t} color={CLOUD.day} y={50} radius={240} count={14} seed="hook2" />
      <Sun position={[-90, 110, -300]} r={9} heat={0.3} />
      <Walkers list={PARK_CROWD} t={c.lt} />
      <Hero pose={runPose(c.lt * 1.5)} position={hero} />
    </Shot>
  );
};

/** Under the skin: two sweat glands pumping… then they switch off on "sweat". */
const coldGlands: ShotFn = (c) => {
  const offAt = 0.85;
  const off = k01(c.lt, offAt, offAt + 0.35);
  const cam = move({ position: [3.2, 1.0, 15], target: [0, -1.25, 0] }, { position: [2.2, 0.8, 13.6], target: [0, -1.25, 0] }, c);
  const pore: V3 = [SKIN.glands[0], 0.05, SKIN.d / 2 - 0.2];
  return (
    <Shot
      mood="space"
      camera={cam}
      fog={false}
      stars={false}
      shadows={false}
      light={1.2}
      overlay={
        <>
          <Pin at={pore} cam={cam} width={c.width} height={c.height} text="SWEAT: OFF" color="#FF5A4A" dx={120} dy={-130} k={k01(c.lt, offAt + 0.2, offAt + 0.5)} warn />
        </>
      }
    >
      <SkinSection t={c.t} flow={1 - off} drop={1 - off} off={off} heatDots={0.6 + off * 0.4} flush={off * 0.6} />
    </Shot>
  );
};

// ================================================================ 01 no more sweat (bright morning)

/** He slows to a stop, wipes his forehead… dry. Looks at his hand and grins: amazing. */
const c1Dry: ShotFn = (c) => {
  const stop = k01(c.lt, 0, 0.6);
  const tt = Math.min(c.lt, 0.6);
  const z = -7.5 + 3.4 * (tt - (tt * tt) / 1.2);
  const hero: V3 = [0, 0, z];
  const run = runPose(c.lt * 1.4, {}, 1 - stop * 0.85);
  const stand = grounded(mergePose(REST, { headPitch: -0.05, expression: "neutral" }));
  const base = lerpPose(run, stand, stop);
  const heroK: V3 = [0, 0, -7.5 + 3.4 * 0.3];
  const brow = headPoint(stand, faceSurface(-0.06, 0.3, 0.34), heroK);
  const wipe = reachC("c1wipe", { ...stand, headPitch: -0.05 }, "r", brow, heroK);
  const look = reachC("c1look", { ...stand, headPitch: -0.35 }, "r", [heroK[0] - 0.35, 2.75, heroK[2] + 1.2], heroK);
  const up = k01(c.lt, 0.55, 0.95);
  const down = k01(c.lt, 1.25, 1.6);
  let pose = lerpPose(base, wipe, up);
  pose = lerpPose(pose, { ...look, headPitch: -0.35 }, down);
  const grin = c.lt > 1.5;
  pose = { ...pose, rShoulder: [pose.rShoulder[0] + Math.sin(c.lt * 9) * 0.05 * (up - down), pose.rShoulder[1]], expression: grin ? "smile" : up > 0.5 ? "awe" : "neutral", headPitch: pose.headPitch + (-0.05 - pose.headPitch) * k01(c.lt, 1.95, 2.25) };
  const cam = move({ position: [4.2, 3.3, z + 13.5], target: [0, 3.0, z] }, { position: [3.2, 3.4, z + 11.2], target: [0, 3.1, z] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[70, 460]} shadowSize={22} keyDir={[0.55, 0.55, 0.8]}>
      <Park seed="hook" />
      <Clouds t={c.t} color={CLOUD.day} y={45} radius={220} count={14} seed="hook" />
      <Sun position={[-70, 95, -240]} r={7} heat={0.3} />
      <Hero pose={pose} position={hero} />
      <Walkers list={PARK_CROWD.slice(2, 6)} t={c.lt + 2} />
    </Shot>
  );
};

/** Arms up in a V: the dark sweat patches on his jacket shrink away to nothing. */
const c1Arms: ShotFn = (c) => {
  const hero: V3 = [0, 0, 0];
  const up = k01(c.lt, 0, 0.3);
  const pose = grounded(
    lerpPose(mergePose(REST, { expression: "smile" }), mergePose(REST, { lShoulder: [0.3, 2.4], rShoulder: [0.3, 2.4], lElbow: 0.25, rElbow: 0.25, headPitch: 0.1, expression: "smile" }), up),
  );
  const cam = move({ position: [1.8, 1.3, 8.6], target: [0, 3.5, 0] }, { position: [1.2, 1.5, 7.6], target: [0, 3.55, 0] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[70, 460]} shadowSize={14} keyDir={[0.35, 0.6, 0.9]}>
      <Park seed="arms" />
      <Clouds t={c.t} color={CLOUD.day} y={40} radius={200} count={14} seed="arms" />
      <Sun position={[50, 120, -200]} r={7} heat={0.3} />
      <Hero pose={pose} position={hero} />
      <SweatPatches pose={pose} position={hero} amount={1 - k01(c.lt, 0.25, 0.85)} />
    </Shot>
  );
};

/** The washing line: the sweat stains on the shirts fade away. */
const c1Line: ShotFn = (c) => {
  const cam = move({ position: [10, 4.4, 11], target: [-0.6, 4.6, 0] }, { position: [8.6, 4.6, 9.6], target: [-0.6, 4.7, 0] }, c);
  const stain = 1 - k01(c.lt, 0.2, 1.05);
  const shirts: { x: number; color: string }[] = [
    { x: -3.7, color: "#E8E4DA" },
    { x: 0, color: "#8FB3D9" },
    { x: 3.7, color: "#C8CCD4" },
  ];
  return (
    <Shot mood="day" camera={cam} fog={[70, 400]} shadowSize={18} keyDir={[0.5, 0.6, 0.7]}>
      <Backyard span={12} lineY={6.4} />
      <House position={[-9, 0, -22]} lit={false} scale={1.3} />
      <House position={[9, 0, -26]} color="#C8D8E4" roof="#5A4A78" lit={false} scale={1.2} />
      {[-20, -4, 14, 24].map((x, i) => (
        <LeafyTree key={i} position={[x, 0, -16 - i * 3]} scale={2.6} seed={`yard${i}`} />
      ))}
      <Clouds t={c.t} color={CLOUD.day} y={40} radius={200} count={14} seed="yard" />
      <Sun position={[60, 100, -220]} r={7} heat={0.3} />
      {shirts.map((s, i) => (
        <HangingShirt key={i} position={[s.x, 6.4, 0]} color={s.color} stain={stain} sway={Math.sin(c.t * 2.2 + i) * 0.12} />
      ))}
    </Shot>
  );
};

/** A packed lift: the smell lines over one passenger fade, and everyone relaxes. */
const c1Lift: ShotFn = (c) => {
  const fresh = k01(c.lt, 0.35, 1.0);
  const cam = move({ position: [1.0, 6.6, 16], target: [0, 3.3, 0] }, { position: [0.4, 6.3, 14.6], target: [0, 3.4, 0] }, c);
  const people: { p: V3; yaw: number; look?: HeroLook; seed: number; worried?: boolean }[] = [
    { p: [-2.3, 0, -1.25], yaw: 0.15, seed: 21 },
    { p: [0.15, 0, -1.35], yaw: 0, seed: 22 },
    { p: [2.45, 0, -1.2], yaw: -0.15, seed: 25 },
    { p: [-1.15, 0, 1.0], yaw: 0.05, look: SLAVOSKI, seed: 0, worried: true },
    { p: [1.35, 0, 1.05], yaw: -0.12, seed: 24, worried: true },
  ];
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={10} keyDir={[0.2, 1, 0.5]} light={1.25}>
      <Lift floor="12" />
      {people.map((q, i) => {
        const pose = grounded(
          mergePose(REST, {
            expression: q.worried && fresh < 0.6 ? "worried" : "smile",
            headYaw: q.worried && fresh < 0.6 ? (q.p[0] < 0 ? -0.35 : 0.35) : 0,
            headPitch: i < 3 ? 0.02 : -0.02,
            lShoulder: [0.05, 0.08],
            rShoulder: [0.05, 0.08],
          }),
        );
        return <Hero key={i} pose={pose} position={q.p} yaw={q.yaw} look={q.look ?? crowdLook(q.seed)} />;
      })}
      <StinkLines position={[0.15, 4.5, -1.35]} t={c.t} k={1 - fresh} />
    </Shot>
  );
};

// ================================================================ 02 the body's air con

/** Low angle: he looks up at the blazing sun, and the smile drops. */
const c2Sun: ShotFn = (c) => {
  const hero: V3 = [0, 0, 0];
  const worried = c.lt > 0.9;
  const pose = grounded(mergePose(REST, { headPitch: 0.45, expression: worried ? "worried" : "smile", lShoulder: [0.08, 0.14], rShoulder: [0.12, 0.16] }));
  const cam = move({ position: [-2.6, 1.1, 9.4], target: [0, 4.3, -4] }, { position: [-2.0, 1.2, 8.4], target: [0, 4.4, -4] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[70, 460]} shadowSize={14} keyDir={[0.15, 1, -0.4]} overlay={<HeatHaze t={c.t} k={0.35 + k01(c.lt, 0.8, 2.2) * 0.35} />}>
      <Park seed="sun" />
      <SkyDome top="#5E9AD8" horizon={mix("#C4E0F6", "#FFE2A6", k01(c.lt, 0.6, 2.4))} />
      <Sun position={[7, 44, -78]} r={4.5 + k01(c.lt, 0.6, 2.4) * 1.5} heat={0.5 + k01(c.lt, 0.6, 2.4) * 0.4} />
      <Hero pose={pose} position={hero} />
      <HeatLight k={k01(c.lt, 0.6, 2.4)} />
    </Shot>
  );
};

/** Thermal camera: his body runs warm and needs to dump that heat. */
const c2Thermal: ShotFn = (c) => {
  const hero: V3 = [0, 0, 0];
  const pose = grounded(mergePose(REST, { headPitch: 0.02, side: Math.sin(c.t * 1.6) * 0.02, expression: "neutral" }));
  const cam = move({ position: [2.4, 3.6, 13.4], target: [0, 2.7, 0] }, { position: [1.6, 3.5, 11.6], target: [0, 2.8, 0] }, c);
  const head = headPosition(pose, hero);
  return (
    <Shot
      mood="space"
      camera={cam}
      fog={false}
      stars={false}
      shadows={false}
      light={1.5}
      overlay={<ThermalHud temp={bodyTemp(c.t, c.words)} t={c.t} target={project(head, cam, c.width, c.height)} status="CORE TEMP" />}
    >
      <ThermalGround seed="th1" />
      <Hero pose={pose} position={hero} look={thermalLook(0.35)} castShadow={false} />
      <BodyGlow pose={pose} position={hero} h={0.35} />
      <HeatRings position={torsoPoint(pose, [0, 0.8, 0.2], hero)} t={c.t} k={0.8} max={3.2} />
    </Shot>
  );
};

/** Inside the skin: sweat glands pump sweat up to the pores. Up to 4 million of them. */
const c2Glands: ShotFn = (c) => {
  const cam = move({ position: [4.4, 0.6, 14.2], target: [0, -1.4, 0] }, { position: [2.4, 1.0, 12.6], target: [-0.2, -1.2, 0] }, c);
  return (
    <Shot
      mood="space"
      camera={cam}
      fog={false}
      stars={false}
      shadows={false}
      light={1.2}
      overlay={
        <>
          <Pin at={[SKIN.glands[1] + 0.05, -2.6, SKIN.d / 2]} cam={cam} width={c.width} height={c.height} text="SWEAT GLAND" color="#8FD0FF" dx={-250} dy={-40} k={k01(c.lt, 0.3, 0.7)} />
          {c.lt > 1.25 ? <CardLine text="2–4 MILLION SWEAT GLANDS" sub="ALL OVER YOUR SKIN" y={300} appearFrame={startFrame(c) + Math.round(1.25 * 30)} /> : null}
        </>
      }
    >
      <SkinSection t={c.t} flow={1} drop={k01(c.lt, 0.2, 1.6)} heatDots={0.8} flush={0.25} />
    </Shot>
  );
};

/** Close on the surface: the beads evaporate, vapour rises and carries the heat away; the skin cools. */
const c2Evap: ShotFn = (c) => {
  const gx = SKIN.glands[0];
  const cam = move({ position: [gx + 1.7, 1.0, 6.8], target: [gx, 0.95, 0] }, { position: [gx + 1.4, 2.0, 6.4], target: [gx, 1.75, 0] }, c);
  const evap = k01(c.lt, 0.2, 1.4);
  return (
    <Shot
      mood="space"
      camera={cam}
      fog={false}
      stars={false}
      shadows={false}
      light={1.2}
      overlay={<Pin at={[gx + 0.35, 2.2, SKIN.d / 2 - 0.2]} cam={cam} width={c.width} height={c.height} text="HEAT ESCAPES" color="#FF8A4A" dx={110} dy={-60} k={k01(c.lt, 1.9, 2.3)} />}
    >
      <SkinSection t={c.t} flow={1} drop={1} evap={evap} flush={0.85 * (1 - k01(c.lt, 1.4, 3.3))} heatDots={1 - k01(c.lt, 1.6, 3.3) * 0.6} />
    </Shot>
  );
};

// ================================================================ 03 running hot (blazing midday street)

const NOON_WALKERS: Walker[] = [
  { x: 17.5, z: -52, yaw: 0, speed: 1.4, seed: 31 },
  { x: 14, z: -66, yaw: Math.PI, speed: 1.3, seed: 32, phase: 0.4 },
  { x: -15.5, z: -40, yaw: Math.PI, speed: 1.3, seed: 33 },
  { x: -17.5, z: -24, yaw: 0, speed: 1.2, seed: 34, phase: 0.6 },
];

const NoonStreet: React.FC<{ t: number; scorch?: number }> = ({ t, scorch = 0 }) => (
  <>
    <BigStreet seed="noon" day lamps={false} trees={false} cars={false} />
    <SkyDome top={mix(HOT.top, SCORCH.top, scorch)} horizon={mix(HOT.horizon, SCORCH.horizon, scorch)} />
    {[-8, -50, -96].map((z, i) => (
      <LeafyTree key={i} position={[19.2, 0, z]} scale={2.8} seed={`noon${i}`} />
    ))}
    <Car position={[8, 0, -46]} yaw={Math.PI} color={P.carRed} />
    <Car position={[-8, 0, -70]} color={P.carTeal} />
    <HeatLight k={0.8 + scorch * 0.4} />
    <Clouds t={t} color="#FFF4E0" y={60} radius={260} count={6} seed="noon" opacity={0.7} />
  </>
);

/** Running down a blazing street at noon. */
const c3Run: ShotFn = (c) => {
  const z = -36 + c.lt * 3.3;
  const hero: V3 = [15.4, 0, z];
  const pose = runPose(c.lt * 1.45, { expression: c.lt > 1.6 ? "worried" : "neutral" });
  const cam = move({ position: [18.4, 3.0, z + 14.5], target: [15.4, 3.4, z] }, { position: [18.0, 2.7, z + 12.5], target: [15.4, 3.5, z] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} shadowSize={26} keyDir={[0.2, 1, 0.3]} overlay={<HeatHaze t={c.t} k={0.55} />}>
      <NoonStreet t={c.t} />
      <Sun position={[2, 46, -230]} r={8} heat={0.7} />
      <Hero pose={pose} position={hero} look={flushed(k01(c.lt, 0.8, 2.4) * 0.5)} />
      <Walkers list={NOON_WALKERS} t={c.lt} />
    </Shot>
  );
};

/** Close on his face: bright red, mouth open, panting… and bone dry. */
const c3Red: ShotFn = (c) => {
  const z = -28 + c.lt * 3.2;
  const hero: V3 = [15.4, 0, z];
  const pose = runPose(c.lt * 1.4, { expression: "alarm", headPitch: 0.05 });
  const head = headPosition(pose, hero);
  const cam = faceCam([head[0], head[1] - (pose.bob - 0.08) * 0.7, head[2]], [-0.7, 0.15, 3.5], 0.55);
  return (
    <Shot mood="day" camera={cam} fog={false} shadowSize={12} keyDir={[-0.3, 1, 0.5]} shake={0.015} overlay={<HeatHaze t={c.t} k={0.7} />}>
      <NoonStreet t={c.t} />
      <Sun position={[16.5, 8, -200]} r={7} heat={0.8} />
      <Hero pose={pose} position={hero} look={flushed(0.8)} />
      <Breath from={headPoint(pose, [0.1, -0.33, 0.75], hero)} dir={[1, -0.2, 0.3]} t={c.t * 2.2} k={0.55} scale={0.35} />
    </Shot>
  );
};

/** Thermal, side on: running, his body heats from orange to white-hot. */
const c3Thermal: ShotFn = (c) => {
  const z = -6 + c.lt * 3.3;
  const hero: V3 = [0, 0, z];
  const pose = runPose(c.lt * 1.45, { expression: "worried" });
  const h = 0.45 + k01(c.lt, 0.2, 2.0) * 0.5;
  const cam: CameraSpec = { position: [12.5, 3.4, z + 2.5], target: [0, 2.8, z] };
  const head = headPosition(pose, hero);
  return (
    <Shot
      mood="space"
      camera={cam}
      fog={false}
      stars={false}
      shadows={false}
      light={1.5}
      overlay={<ThermalHud temp={bodyTemp(c.t, c.words)} t={c.t} target={project(head, cam, c.width, c.height)} status="CLIMBING" />}
    >
      <ThermalGround seed="th2" hot={0.4} />
      <Hero pose={pose} position={hero} look={thermalLook(h)} castShadow={false} />
      <BodyGlow pose={pose} position={hero} h={h} />
    </Shot>
  );
};

/** X-ray: the heart pounds faster, pushing hot blood out toward the skin. */
const c3Heart: ShotFn = (c) => {
  const hero: V3 = [0, 0, 0];
  const pose = grounded(mergePose(REST, { lean: 0.06, headPitch: -0.04, expression: "worried", lShoulder: [0.05, 0.2], rShoulder: [0.05, 0.2] }));
  const rate = 1.6 + k01(c.lt, 0, 2.4) * 1.1;
  const heat = k01(c.lt, 1.2, 2.2);
  const cam = move({ position: [1.6, 3.0, 9.8], target: [0, 2.7, 0] }, { position: [0.8, 3.0, 8.6], target: [0, 2.75, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} stars={false} shadows={false} light={1.1} overlay={<EcgStrip t={c.t} rate={rate} />}>
      <XRayFloor />
      <XRayBody pose={pose} position={hero} t={c.t} rate={rate} heat={heat} />
      <Hero pose={pose} position={hero} ghost={0.26} />
      <BodyGlow pose={pose} position={hero} h={heat * 0.6} />
    </Shot>
  );
};

/** A faint blueprint floor for x-ray shots. */
const XRayFloor: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <circleGeometry args={[9, 32]} />
      <meshBasicMaterial color="#10264A" transparent opacity={0.8} />
    </mesh>
    {Array.from({ length: 13 }, (_, i) => (
      <React.Fragment key={i}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-6 + i, 0, 0]}>
          <planeGeometry args={[0.03, 12]} />
          <meshBasicMaterial color="#3A7ACC" transparent opacity={0.45} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0, -6 + i]}>
          <planeGeometry args={[0.03, 12]} />
          <meshBasicMaterial color="#3A7ACC" transparent opacity={0.45} />
        </mesh>
      </React.Fragment>
    ))}
  </group>
);

// ================================================================ 04 heatstroke (scorching orange haze)

/** The street in an extreme heatwave: 47 °C on the sign, the sun huge, Slavoski staggering. */
const c4Heatwave: ShotFn = (c) => {
  const hero: V3 = [13.2, 0, -16 + c.lt * 1.1];
  const sway = Math.sin(c.t * 3.2);
  const pose = grounded(mergePose(walkPose(c.lt * 0.7, 0.6), { side: sway * 0.08, headRoll: sway * 0.12, lean: 0.12, expression: "worried" }));
  const cam = move({ position: [15, 9.5, 20], target: [7, 6, -40] }, { position: [14, 8.5, 17], target: [7, 6, -40] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} shadowSize={40} keyDir={[0.15, 1, 0.2]} overlay={<HeatHaze t={c.t} k={1} />}>
      <NoonStreet t={c.t} scorch={1} />
      <Sun position={[-14, 45, -230]} r={13} heat={1} />
      <TempSign position={[14.6, 0, -30]} yaw={-0.1} value="47°C" scale={1.15} blink t={c.t} />
      <Hero pose={pose} position={hero} look={flushed(0.9)} />
    </Shot>
  );
};

/** Dizzy: wobbling, arms out, eyes half-closed. HEATSTROKE. */
const c4Dizzy: ShotFn = (c) => {
  const hero: V3 = [0, 0, 0];
  const s = Math.sin(c.t * 4.2);
  const pose = grounded(mergePose(REST, { side: s * 0.12, headRoll: -s * 0.22, lShoulder: [0.2, 1.15 + s * 0.15], rShoulder: [0.2, 1.15 - s * 0.15], lElbow: 0.3, rElbow: 0.3, blink: 0.5, expression: "worried", headPitch: -0.08 }));
  const roll = Math.sin(c.t * 2.6) * 0.06;
  const cam: CameraSpec = { ...move({ position: [2.2, 3.4, 10.5], target: [0, 3.0, 0] }, { position: [1.4, 3.3, 9.2], target: [0, 3.05, 0] }, c), up: [Math.sin(roll), Math.cos(roll), 0] };
  return (
    <Shot
      mood="day"
      camera={cam}
      fog={false}
      shadowSize={14}
      keyDir={[0.1, 1, 0.3]}
      overlay={
        <>
          <HeatHaze t={c.t} k={1} />
          <RedPulse t={c.t} k={0.8} />
          <CardLine text="HEATSTROKE" sub="CORE TEMPERATURE 40 °C AND UP" y={300} appearFrame={startFrame(c) + 6} accent="#FF5A4A" />
        </>
      }
    >
      <group position={[-15.4, 0, 12]}>
        <NoonStreet t={c.t} scorch={1} />
        <Sun position={[12, 34, -230]} r={12} heat={1} />
      </group>
      <Hero pose={pose} position={hero} look={flushed(1)} />
    </Shot>
  );
};

/** X-ray of the head: the brain flickers and sparks. */
const c4Brain: ShotFn = (c) => {
  const hero: V3 = [0, 0, 0];
  const s = Math.sin(c.t * 4);
  const pose = grounded(mergePose(REST, { headRoll: s * 0.1, headPitch: -0.05, expression: "worried", blink: 0.4 }));
  const head = headPosition(pose, hero);
  const cam = faceCam(head, [1.0, 0.3, 4.3], 0.4);
  const glitch = random(`gl${Math.floor(c.t * 15)}`) < 0.35;
  return (
    <Shot
      mood="space"
      camera={cam}
      fog={false}
      stars={false}
      shadows={false}
      light={1.1}
      shake={glitch ? 0.03 : 0.006}
      overlay={
        <>
          {glitch ? <Glitch seed={Math.floor(c.t * 15)} /> : null}
          <Pin at={headPoint(pose, [0.15, 0.3, 0], hero)} cam={cam} width={c.width} height={c.height} text="OVERHEATING" color="#FF5A4A" dx={-130} dy={-230} k={k01(c.lt, 0.25, 0.55)} warn />
        </>
      }
    >
      <XRayBody pose={pose} position={hero} t={c.t} rate={2.8} warn={{ brain: 1 }} heat={0.7} spark={0.75} />
      <Hero pose={pose} position={hero} ghost={0.24} />
    </Shot>
  );
};

/** Horizontal glitch bands (HTML), seeded per frame block. */
const Glitch: React.FC<{ seed: number }> = ({ seed }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {Array.from({ length: 4 }, (_, i) => {
      const y = random(`gy${seed}${i}`) * 1700;
      const h = 12 + random(`gh${seed}${i}`) * 60;
      return <div key={i} style={{ position: "absolute", left: 0, right: 0, top: y, height: h, background: i % 2 ? "rgba(255,60,60,0.22)" : "rgba(60,220,255,0.18)", transform: `translateX(${(random(`gx${seed}${i}`) - 0.5) * 80}px)` }} />;
    })}
  </AbsoluteFill>
);

/** X-ray of the body: organ after organ flashes red. */
const c4Organs: ShotFn = (c) => {
  const hero: V3 = [0, 0, 0];
  const pose = grounded(mergePose(REST, { lean: 0.08, headPitch: -0.15, expression: "worried", blink: 0.6 }));
  const w = (a: number) => k01(c.lt, a, a + 0.3);
  const warn = { liver: w(0.15), kidneys: w(0.55), heart: w(0.95), lungs: w(1.35), brain: 0.6 };
  const cam = move({ position: [-1.4, 2.6, 6.4], target: [0, 2.35, 0] }, { position: [-0.9, 2.5, 5.6], target: [0, 2.35, 0] }, c);
  const dim = k01(c.lt, 1.8, 2.25);
  const pins: { at: V3; text: string; k: number; dx: number; dy: number }[] = [
    { at: torsoPoint(pose, [-0.24, 0.47, 0.06], hero), text: "LIVER", k: warn.liver, dx: -210, dy: 120 },
    { at: torsoPoint(pose, [0.3, 0.36, -0.2], hero), text: "KIDNEYS", k: warn.kidneys, dx: 160, dy: 190 },
    { at: torsoPoint(pose, [0.12, 0.8, 0.14], hero), text: "HEART", k: warn.heart, dx: 180, dy: -150 },
    { at: torsoPoint(pose, [-0.34, 0.86, -0.02], hero), text: "LUNGS", k: warn.lungs, dx: -200, dy: -190 },
  ];
  return (
    <Shot
      mood="space"
      camera={cam}
      fog={false}
      stars={false}
      shadows={false}
      light={1.1}
      overlay={
        <>
          {pins.map((p, i) => (
            <Pin key={i} at={p.at} cam={cam} width={c.width} height={c.height} text={p.text} color="#FF5A4A" dx={p.dx} dy={p.dy} k={p.k} warn />
          ))}
          <RedPulse t={c.t} k={0.6} />
          <AbsoluteFill style={{ background: `rgba(0,0,0,${dim * 0.7})` }} />
        </>
      }
    >
      <XRayFloor />
      <XRayBody pose={pose} position={hero} t={c.t} rate={2.9} warn={warn} heat={0.8} />
      <Hero pose={pose} position={hero} ghost={0.24} />
    </Shot>
  );
};

// ================================================================ 05 not so fast (shade, cool)

/** In the deep shade of a big tree, calm again. */
const c5Shade: ShotFn = (c) => {
  const hero: V3 = [1.6, 0, 0];
  const pose = grounded(mergePose(REST, { headPitch: 0.05, expression: c.lt > 0.5 ? "relief" : "neutral", lShoulder: [0.05, 0.16], rShoulder: [0.05, 0.16] }));
  const cam = move({ position: [5.6, 3.8, 15.8], target: [1.2, 4.4, 0] }, { position: [4.6, 3.7, 14.2], target: [1.4, 4.4, 0] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[70, 460]} shadowSize={26} keyDir={[-0.28, 1, 0.12]}>
      <Park seed="shade" pathX={8} lamps={false} />
      <LeafyTree position={[-2.6, 0, 0.5]} scale={3.3} seed="bigshade" />
      <Clouds t={c.t} color={CLOUD.day} y={45} radius={220} count={14} seed="shade" />
      <Hero pose={pose} position={hero} />
      <Leaves t={c.t} center={[0, 6, -2]} size={[22, 10, 10]} count={14} seed="shade" />
    </Shot>
  );
};

/** Thermal in the shade: warm, but stable. Some people already live without sweat. */
const c5Steady: ShotFn = (c) => {
  const hero: V3 = [0, 0, 0];
  const pose = grounded(mergePose(REST, { headPitch: 0.03, side: Math.sin(c.t * 1.2) * 0.015, expression: "relief" }));
  const cam = move({ position: [-2.2, 3.5, 12.6], target: [0, 2.8, 0] }, { position: [-1.4, 3.4, 11.2], target: [0, 2.85, 0] }, c);
  const head = headPosition(pose, hero);
  return (
    <Shot
      mood="space"
      camera={cam}
      fog={false}
      stars={false}
      shadows={false}
      light={1.5}
      overlay={
        <>
          <ThermalHud temp={bodyTemp(c.t, c.words)} t={c.t} target={project(head, cam, c.width, c.height)} status="STABLE" />
          {c.lt > 0.35 ? <CardLine text="SOME PEOPLE CAN'T SWEAT" sub="ANHIDROSIS · A REAL CONDITION" y={1190} appearFrame={startFrame(c) + 10} /> : null}
        </>
      }
    >
      <ThermalGround seed="th3" road={false} />
      {/* the cool shade canopy overhead */}
      <mesh position={[-1.5, 13, -3]} scale={[1.3, 0.7, 1]}>
        <IcoG args={[6, 1]} />
        <meshBasicMaterial color="#2A1A7A" />
      </mesh>
      <Hero pose={pose} position={hero} look={thermalLook(0.18)} castShadow={false} />
      <BodyGlow pose={pose} position={hero} h={0.2} />
    </Shot>
  );
};

/** Other ways out: heat radiating off his body, the breeze carrying it away, and his breath. */
const c5Ways: ShotFn = (c) => {
  const hero: V3 = [0, 0, 0];
  const pose = grounded(mergePose(REST, { headPitch: 0.04, expression: "smile", lShoulder: [0.05, 0.14], rShoulder: [0.05, 0.14] }));
  const cam = move({ position: [6.5, 3.8, 9.2], target: [0, 3.0, 0] }, { position: [3.2, 3.7, 10.4], target: [0, 3.0, 0] }, c);
  const chest = torsoPoint(pose, [0, 0.75, 0.45], hero);
  const mouth = headPoint(pose, [0, -0.33, 0.7], hero);
  return (
    <Shot
      mood="day"
      camera={cam}
      fog={[70, 460]}
      shadowSize={16}
      keyDir={[0.6, 0.7, 0.4]}
      overlay={
        <>
          <Pin at={add(chest, [0.9, 0.4, 0])} cam={cam} width={c.width} height={c.height} text="RADIATION" color="#FF9A3A" dx={120} dy={-160} k={k01(c.lt, 0.2, 0.5)} />
          <Pin at={[-0.6, 2.2, 1.2]} cam={cam} width={c.width} height={c.height} text="AIRFLOW" color="#7FE0FF" dx={30} dy={-330} k={k01(c.lt, 0.9, 1.2)} />
          <Pin at={add(mouth, [0.6, 0.05, 0.15])} cam={cam} width={c.width} height={c.height} text="BREATHING" color="#F4F8FC" dx={60} dy={-300} k={k01(c.lt, 1.5, 1.8)} />
        </>
      }
    >
      <Park seed="ways" pathX={-9} />
      <Clouds t={c.t} color={CLOUD.day} y={45} radius={220} count={14} seed="ways" />
      <Hero pose={pose} position={hero} />
      <group rotation={[0, 0.7, 0]} position={chest}>
        <HeatRings position={[0, 0, 0]} t={c.t} k={0.9} max={2.6} />
      </group>
      <WindStreaks t={c.t} center={[0, 2.4, 0.6]} size={[22, 4, 4]} count={14} />
      <Breath from={mouth} dir={[1, 0.05, 0.25]} t={c.t} k={1} scale={0.55} />
      <Leaves t={c.t} center={[0, 4, 0]} size={[24, 8, 8]} count={10} seed="ways" />
    </Shot>
  );
};

/** Somewhere cool: an overcast lake, a breeze, the readout settling below 37 °C. */
const c5Cool: ShotFn = (c) => {
  const hero: V3 = [0, 0.62, -5];
  const pose = grounded(mergePose(REST, { headPitch: 0.08, expression: "relief", lShoulder: [0.05, 0.1], rShoulder: [0.05, 0.1] }));
  const cam = move({ position: [6.5, 4.6, 12], target: [0, 3.4, -5] }, { position: [5, 4.2, 10.5], target: [0, 3.5, -5] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[60, 360]} shadowSize={20}>
      <Lake t={c.t} shore={6} />
      <HillRing radius={220} count={16} color="#4A6A58" seed="lake" />
      {Array.from({ length: 12 }, (_, i) => (
        <PineTree key={`f${i}`} position={[-70 + i * 12 + random(`fp${i}`) * 5, 0, -126 - random(`fz${i}`) * 10]} scale={4 + random(`fs${i}`) * 2} />
      ))}
      <Clouds t={c.t} color={CLOUD.overcast} y={36} radius={200} count={18} seed="lake" />
      <Hero pose={pose} position={hero} />
      <Leaves t={c.t} center={[0, 5, -4]} size={[22, 8, 8]} count={12} seed="lake" />
    </Shot>
  );
};

// ================================================================ 06 a new way to live

const RUNNERS: { x: number; z: number; seed: number }[] = [
  { x: -TRACK.lane * 0.5, z: -6, seed: 41 },
  { x: TRACK.lane * 1.5, z: -7.5, seed: 42 },
  { x: TRACK.lane * 0.5, z: -17, seed: 43 },
];

/** Hands on knees, catching breath. */
const restPose = (s: number, t: number, look = 0) =>
  grounded(
    mergePose(REST, {
      lean: 0.62,
      lHip: [0.5, 0.06],
      rHip: [0.5, 0.06],
      lKnee: 0.45,
      rKnee: 0.45,
      lShoulder: [0.95, 0.2],
      rShoulder: [0.95, 0.2],
      lElbow: 0.15,
      rElbow: 0.15,
      headPitch: 0.45 + look,
      bob: 0,
      side: Math.sin(t * 5 + s) * 0.01,
      expression: "worried",
    }),
  );

/** The race is off: runners stopped on the track, HEAT ALERT on the board. */
const c6Track: ShotFn = (c) => {
  const cam = move({ position: [3.6, 4.8, 15], target: [0.6, 3.1, -14] }, { position: [3.2, 4.6, 13], target: [0.6, 3.1, -14] }, c);
  const hero: V3 = [TRACK.lane * 0.5, 0, 2];
  return (
    <Shot mood="day" camera={cam} fog={false} shadowSize={30} keyDir={[0.2, 1, 0.3]} overlay={<HeatHaze t={c.t} k={0.7} />}>
      <Track />
      <SkyDome top={HOT.top} horizon={HOT.horizon} />
      <Sun position={[30, 60, -220]} r={9} heat={0.8} />
      <HeatLight />
      <ParkSkyline seed="track" radius={190} />
      <SignBoard
        position={[2, 0, -46]}
        yaw={-0.05}
        w={9}
        h={4.4}
        post={5}
        bg="#101018"
        lines={[
          { text: "HEAT ALERT", color: "#FF4A2A", size: 0.42 },
          { text: "RACE POSTPONED", color: "#FFE2A6", size: 0.3 },
        ]}
      />
      {RUNNERS.map((r, i) => (
        <Hero key={i} pose={restPose(r.seed, c.t)} position={[r.x, 0, r.z]} yaw={0.15 - i * 0.15} look={crowdLook(r.seed)} />
      ))}
      <Hero pose={restPose(0, c.t, 0.2)} position={hero} yaw={0.15} look={flushed(0.7)} />
    </Shot>
  );
};

/** Sun-baked building colours for the heatwave aerial. */
const BAKED = ["#C8A27A", "#B8876A", "#D8B48A", "#A8765A", "#C89A6A", "#9A6A52"];

/** The city from above in a heatwave. */
const c6Aerial: ShotFn = (c) => {
  const cam = move({ position: [30, 34, 62], target: [-6, 6, -40] }, { position: [26, 30, 54], target: [-6, 6, -40] }, c);
  return (
    <Shot
      mood="day"
      camera={cam}
      fog={false}
      shadowSize={60}
      keyDir={[-0.4, 0.8, -0.6]}
      light={1.15}
      overlay={
        <>
          <AbsoluteFill style={{ background: "rgba(255,130,40,0.16)" }} />
          <HeatHaze t={c.t} k={1} />
        </>
      }
    >
      <CityGrid seed="heat" blocks={8} block={14} modify={(_, i) => ({ power: 0.15, color: BAKED[i % BAKED.length] })} />
      <SkyDome top={SCORCH.top} horizon={SCORCH.horizon} />
      <Sun position={[-60, 70, -420]} r={20} heat={1} />
      <HeatLight k={1.4} />
      <fog attach="fog" args={[SCORCH.horizon, 70, 240]} />
    </Shot>
  );
};

const WORKERS: { p: V3; yaw: number; seed: number; drink?: boolean }[] = [
  { p: [-1.8, 0, -2.6], yaw: 0.45, seed: 51 },
  { p: [1.4, 0, 0.4], yaw: 0.25, seed: 52, drink: true },
  { p: [4.0, 0, 2.4], yaw: 0.1, seed: 53 },
];
const workerLook = (seed: number): HeroLook => ({ ...crowdLook(seed), jacket: "#C8E03A", jacketShade: "#A8BE2A", zipper: "#E8E4DA" });

/** Physically demanding work: the site stops at noon, workers in the shade with water. */
const c6Site: ShotFn = (c) => {
  const cam = move({ position: [7.4, 5.0, 17.5], target: [0.8, 4.3, -2] }, { position: [6.8, 4.8, 15.8], target: [0.9, 4.4, -2] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} shadowSize={34} keyDir={[0.2, 1, 0.25]} overlay={<HeatHaze t={c.t} k={0.75} />}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[400, 24]} />
        <Flat color="#B8A47E" />
      </mesh>
      <SkyDome top={HOT.top} horizon={HOT.horizon} />
      <Sun position={[-40, 70, -240]} r={9} heat={0.9} />
      <HeatLight />
      <SkyscraperSite position={[0, 0, -34]} />
      <Crane position={[26, 0, -40]} swing={0.4} />
      <ParkSkyline seed="site" radius={200} />
      {/* shade canopy with a banner on its front edge */}
      <mesh position={[1, 7.5, 0]} castShadow>
        <BoxG args={[12, 0.25, 8]} />
        <Flat color="#24748F" />
      </mesh>
      {[-4.6, 6.6].map((x) => [-3.6, 3.6].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 3.7, z]} castShadow>
          <BoxG args={[0.2, 7.4, 0.2]} />
          <Flat color="#5A5A62" />
        </mesh>
      )))}
      <mesh position={[2.9, 6.7, 4.0]}>
        <BoxG args={[5.6, 1.6, 0.08]} />
        <Flat color="#1A1C26" />
      </mesh>
      <CanvasPanel
        position={[2.9, 6.7, 4.05]}
        rotation={[0, 0, 0]}
        w={5.4}
        h={1.45}
        px={768}
        draw={(ctx, W, H) => {
          ctx.fillStyle = "#F4F0E4";
          ctx.fillRect(0, 0, W, H);
          fitText(ctx, "WORK PAUSED", W / 2, H * 0.33, W * 0.9, H * 0.4, "#C8372D");
          fitText(ctx, "11 AM – 4 PM", W / 2, H * 0.74, W * 0.9, H * 0.3, "#1A1C26");
        }}
      />
      {WORKERS.map((w, i) => {
        const base = mergePose(REST, { headPitch: w.drink ? 0.35 : 0, expression: "worried", lShoulder: [0.05, 0.14] });
        const pose = w.drink ? reachC(`drink${i}`, grounded(base), "r", add(headPoint(grounded(base), [0, -0.3, 0.9], w.p, w.yaw), [0, -0.1, 0]), w.p) : grounded(base);
        return (
          <group key={i}>
            <Hero pose={pose} position={w.p} yaw={w.yaw} look={workerLook(w.seed)} />
            <HardHat pose={pose} position={w.p} yaw={w.yaw} />
            {w.drink ? <Bottle position={add(handPosition(pose, "r", w.p, w.yaw), [0, 0.1, 0.05])} rotation={[-2.2, w.yaw, 0]} scale={1.6} /> : null}
          </group>
        );
      })}
    </Shot>
  );
};

/** Across the planet: Earth turning, its day side baking, city lights on the night side. */
const c6Earth: ShotFn = (c) => {
  const cam = move({ position: [0, 1, 21], target: [0, 0, 0] }, { position: [0, 0.6, 19], target: [0, 0, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.7} keyDir={[1, 0.3, 0.35]}>
      <FacetedEarth radius={3} rotation={[0.4, 1.8 + c.t * 0.06, 0]} heat={0.45} cityLights={0.7} />
      <mesh position={[80, 20, -120]}>
        <circleGeometry args={[5, 12]} />
        <Glow color="#FFF4E0" fog={false} />
      </mesh>
      <Halo position={[80, 20, -119]} size={70} color="#FFB04A" opacity={0.55} />
    </Shot>
  );
};

const NIGHT_WALKERS: Walker[] = [
  { x: 13.4, z: -30, yaw: 0, speed: 1.3, seed: 61 },
  { x: 13, z: -48, yaw: Math.PI, speed: 1.2, seed: 62, phase: 0.3 },
  { x: 16, z: -62, yaw: 0, speed: 2.8, run: true, seed: 63 },
  { x: -16, z: -26, yaw: Math.PI, speed: 1.3, seed: 64, phase: 0.6 },
  { x: -18.5, z: -46, yaw: 0, speed: 1.2, seed: 65 },
  { x: -14, z: -60, yaw: 0, speed: 2.6, run: true, seed: 66, phase: 0.2 },
];

/** Living at night: joggers under the lamps, a night market open till dawn, misting fans. */
const c6Night: ShotFn = (c) => {
  const z = -18 + c.lt * 3.1;
  const hero: V3 = [15.2, 0, z];
  const pose = runPose(c.lt * 1.45, { expression: "smile" });
  const cam = move({ position: [17.8, 3.3, z + 14], target: [15.8, 3.6, z - 6] }, { position: [17.6, 3.0, z + 12], target: [15.8, 3.6, z - 6] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[40, 260]} shadowSize={26}>
      <BigStreet seed="night" lampsOn trees={false} />
      <Stall position={[19.2, 0, -44]} yaw={-Math.PI / 2} name="NIGHT MARKET" />
      <SignBoard position={[18.2, 0, -34]} yaw={-0.2} w={5.6} h={2.2} post={3.2} bg="#101018" lines={[{ text: "OPEN 9 PM – 6 AM", color: "#FFBA58", size: 0.5 }]} />
      <PedestalFan position={[19.8, 0, -27]} yaw={-Math.PI / 2 + 0.3} t={c.t} mist={1} reachZ={3} />
      <PedestalFan position={[-19.8, 0, -40]} yaw={Math.PI / 2} t={c.t + 0.4} mist={1} reachZ={3} />
      <Walkers list={NIGHT_WALKERS} t={c.lt} />
      <Hero pose={pose} position={hero} />
    </Shot>
  );
};

// ================================================================ 07 why we sweat (night rooftop)

const ROOF_HERO: V3 = [0, 0, 2];

/** Close on his face by the misting fan: fine droplets bead on his skin, like sweat. Relief. */
const c7Drop: ShotFn = (c) => {
  const pose = grounded(mergePose(REST, { headYaw: 0.25, headPitch: 0.05, expression: "relief", blink: c.lt > 1.3 ? 0.9 : 0 }));
  const head = headPosition(pose, ROOF_HERO);
  const cam = faceCam(head, [-1.3, 0.1, 3.3], 0.5);
  return (
    <Shot mood="night" camera={move(cam, { ...cam, position: add(cam.position, [0.25, 0, -0.4]) }, c)} fog={[40, 300]} shadowSize={10}>
      <Rooftop t={c.t} />
      <RoofCity />
      <PedestalFan position={[3.3, 0, 2.3]} yaw={-Math.PI / 2} t={c.t} mist={1} scale={1.1} reachZ={3.2} puff={0.6} />
      <Hero pose={pose} position={ROOF_HERO} />
      <FaceSweat pose={pose} position={ROOF_HERO} amount={k01(c.lt, 0.3, 1.8) * 0.85} opacity={0.8} />
    </Shot>
  );
};

/** City lights below the rooftop, a moon. */
const RoofCity: React.FC = () => (
  <>
    <group position={[0, -40, -30]}>
      <CityGrid seed="roofcity" blocks={6} block={18} />
    </group>
    <ParkSkyline seed="roof" radius={170} power={1} />
    <mesh position={[-60, 70, -200]}>
      <IcoG args={[7, 2]} />
      <Glow color="#E8ECF4" fog={false} />
    </mesh>
    <Halo position={[-60, 70, -199]} size={44} color="#C8D4F0" opacity={0.4} />
  </>
);

/** Pull back: Slavoski in a deck chair on the rooftop at night, fan blowing, water bottle, city lights. */
const c7Roof: ShotFn = (c) => {
  const sit = grounded(
    mergePose(REST, {
      lHip: [1.45, 0.1],
      rHip: [1.45, 0.1],
      lKnee: 1.4,
      rKnee: 1.4,
      lean: -0.18,
      headPitch: 0.15,
      lShoulder: [0.35, 0.3],
      rShoulder: [0.35, 0.3],
      lElbow: 0.9,
      rElbow: 0.9,
      expression: "smile",
    }),
  );
  const hero: V3 = [0, 0, 2.2];
  const seat = DIM.hipY + sit.bob - 0.24;
  const cam = move({ position: [7, 6.2, 19], target: [0, 3.2, 0] }, { position: [9, 8.6, 25], target: [0, 3.6, -2] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[60, 360]} shadowSize={20}>
      <Rooftop t={c.t} />
      <RoofCity />
      <DeckChair position={[hero[0], 0, hero[2] - 0.25]} seat={seat} />
      <Hero pose={sit} position={hero} />
      <PedestalFan position={[3.4, 0, 3.0]} yaw={-Math.PI / 2 - 0.2} t={c.t} mist={1} scale={1.1} reachZ={3.0} puff={0.7} />
      <Bottle position={[-1.7, 0, 3.0]} scale={1.5} />
      <Lamp position={[-14, 0, -6]} on />
    </Shot>
  );
};

// ================================================================ thumbnail

/** Shorts cover: thermal Slavoski glowing white-hot under the sun. */
export const thumbShot: ShotFn = () => {
  const hero: V3 = [0, 0, 0];
  const pose = grounded(mergePose(REST, { headPitch: 0.2, expression: "alarm", lShoulder: [0.2, 0.9], rShoulder: [0.2, 0.9], lElbow: 0.6, rElbow: 0.6 }));
  const cam: CameraSpec = { position: [1.2, 2.4, 12.5], target: [0, 4.4, 0] };
  return (
    <Stage
      mood="space"
      camera={cam}
      fog={false}
      stars={false}
      shadows={false}
      light={1.5}
      overlay={<ThermalHud temp={41.2} t={0} target={project(torsoPoint(pose, [0.2, 0.75, 0.4], hero), cam, 1080, 1920)} minimal />}
    >
      <ThermalGround seed="thumb" hot={0.6} />
      <Hero pose={pose} position={hero} look={thermalLook(0.95)} castShadow={false} />
      <BodyGlow pose={pose} position={hero} h={1} />
      <HeatRings position={torsoPoint(pose, [0, 0.8, 0.3], hero)} t={0.7} k={1} max={3.6} color="#FFB040" />
    </Stage>
  );
};

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldDrop },
    { cue: "on Earth", fn: coldCrowd },
    { cue: "the ability", fn: coldGlands },
  ],
  c1: [
    { cue: null, fn: c1Dry },
    { cue: "No sweaty", fn: c1Arms },
    { cue: "no embarrassing", fn: c1Line },
    { cue: "no more body", fn: c1Lift },
  ],
  c2: [
    { cue: null, fn: c2Sun },
    { cue: "Your body needs", fn: c2Thermal },
    { cue: "and sweating", fn: c2Glands },
    { cue: "When sweat", fn: c2Evap },
  ],
  c3: [
    { cue: null, fn: c3Run },
    { cue: "could become", fn: c3Red },
    { cue: "Your body temperature", fn: c3Thermal },
    { cue: "Your heart", fn: c3Heart },
  ],
  c4: [
    { cue: null, fn: c4Heatwave },
    { cue: "develop heatstroke", fn: c4Dizzy },
    { cue: "Your brain", fn: c4Brain },
    { cue: "Your organs", fn: c4Organs },
  ],
  c5: [
    { cue: null, fn: c5Shade },
    { cue: "You wouldn't", fn: c5Steady },
    { cue: "Your body could", fn: c5Ways },
    { cue: "especially", fn: c5Cool },
  ],
  c6: [
    { cue: null, fn: c6Track },
    { cue: "heat waves", fn: c6Aerial },
    { cue: "physically", fn: c6Site },
    { cue: "And across", fn: c6Earth },
    { cue: "millions", fn: c6Night },
  ],
  c7: [
    { cue: null, fn: c7Drop },
    { cue: "It's one", fn: c7Roof },
  ],
};
