/**
 * Shots for "What If Every Human on Earth Suddenly Disappeared?".
 * Each shot is a full frame (Stage + shot-specific overlays). `lt` = seconds since the shot started.
 */
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Animal } from "../../slavoski/animals";
import { Building, BUILDING_COLORS, Car, CAR_HALF_LENGTH, CityGrid, Ground, Lamp, PineTree, Plane, PowerStation, StreetSet, type BuildingSpec } from "../../slavoski/city";
import { Debris, Fireball, FloodWater, SmokeCluster } from "../../slavoski/fx";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { Bush, GrassTufts, GroundCover, LeafyTree, LightningBolt, Rain } from "../../slavoski/nature";
import { CardLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import { groundedBob, handPosition, Hero, mergePose, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { FacetedEarth, FacetedMoon } from "../../slavoski/space";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import type { CuedShot } from "../../slavoski/timeline";
import { BuriedBottle, Hills, HouseWithDog, Obelisk, Phone, Pyramid, SedimentLayers, SubwayTunnel, VanishPuff } from "./props";

export type ShotCtx = { lt: number; dur: number; t: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- shared bits

const HERO_AT: V3 = [0.2, 0, 1.2];
const STREET_WIDE: CameraSpec = { position: [0.6, 2.6, 22], target: [0, 6.2, -10] };
const grounded = (p: Pose): Pose => ({ ...p, bob: groundedBob(p) });
const GHOST = 0.42;

/** Buildings for a stage of abandonment: power and decay for every building in a set. */
const abandon = (power: number, decay: number) => () => ({ power, decay });

/** Grass lines along both kerbs and down the centre-line cracks of the street set. */
const KERB_POINTS: V3[] = (() => {
  const pts: V3[] = [];
  for (let z = 12; z > -70; z -= 0.8) {
    pts.push([3.55, 0, z], [-3.55, 0, z]);
    if (Math.floor(z) % 5 === 0) pts.push([0.4 * Math.sin(z), 0, z]);
  }
  return pts;
})();

/** Leafy trees on the road and pavements of the street set, leaving a clear spot around `keepClear`. */
const streetTrees = (n: number, seed: string, keepClear: V3 = HERO_AT, xMax = 5.2) => {
  const out: { p: V3; s: number; seed: string }[] = [];
  for (let i = 0; i < n; i++) {
    const x = (random(`${seed}x${i}`) - 0.5) * 2 * xMax;
    const z = 6 - random(`${seed}z${i}`) * 60;
    if (Math.hypot(x - keepClear[0], z - keepClear[2]) < 3) continue;
    out.push({ p: [x, 0, z], s: 0.9 + random(`${seed}s${i}`) * 0.7, seed: `${seed}${i}` });
  }
  return out;
};

// ---------------------------------------------------------------- COLD OPEN

const coldEarth: ShotFn = ({ lt, t }) => {
  const cam = lerpCam({ position: [0, 0.4, 19], target: [0, 0.2, 0] }, { position: [0, 0.4, 17], target: [0, 0.2, 0] }, lt / 4);
  return (
    <Stage mood="space" camera={cam} fog={false} shadows={false} keyDir={[-1, 0.25, -0.7]} light={0.3}>
      <FacetedEarth radius={3} position={[0, -4.6, 0]} rotation={[0.35, 1.6 + t * 0.06, 0]} cityLights={1} />
      <FacetedMoon radius={0.6} position={[2.6, 1.6, -3]} />
    </Stage>
  );
};

const PHONE_POSE: Pose = mergePose(walkPose(0), { rShoulder: [0.95, 0.08], rElbow: 1.35, headPitch: -0.42 });

const walkingHero = (lt: number, stopAt = Infinity) => {
  const tw = Math.min(lt, stopAt);
  const z = -5 + tw * 1.2;
  const base = lt < stopAt ? walkPose(tw * 0.85) : walkPose(stopAt * 0.85);
  const pose = grounded(mergePose(base, { rShoulder: PHONE_POSE.rShoulder, rElbow: PHONE_POSE.rElbow, headPitch: PHONE_POSE.headPitch }));
  return { pose, at: [0.2, 0, z] as V3 };
};

const phoneInHand = (pose: Pose, at: V3): V3 => {
  const h = handPosition(pose, "r", at);
  return [h[0], h[1] + 0.22 + 0.03, h[2] + 0.05];
};

const coldWalk: ShotFn = ({ lt }) => {
  const { pose, at } = walkingHero(lt);
  const cam: CameraSpec = { position: [1.8, 3.2, at[2] + 14], target: [0.2, 3.0, at[2]] };
  return (
    <Stage mood="night" camera={cam} fog={[40, 200]}>
      <StreetSet seed="nh" cars={false} />
      <Car position={[-1.7, 0, -18]} color={P.carTeal} />
      <Hero pose={pose} position={at} />
      <Phone position={phoneInHand(pose, at)} rotation={[-0.9, 0, 0]} />
    </Stage>
  );
};

/** Slavoski stops, flashes and is gone; the phone drops and clatters onto the road. */
const VANISH_AT = 0.55;
const coldVanish: ShotFn = ({ lt }) => {
  const walkLt = 2.4 + lt; // continues the walk from the previous shot
  const stopAt = 2.4 + VANISH_AT;
  const { pose, at } = walkingHero(walkLt, stopAt);
  const v = clamp01((lt - VANISH_AT) / 0.35);
  const start = phoneInHand(pose, at);
  const tf = Math.max(0, lt - VANISH_AT - 0.1);
  const fallT = Math.sqrt((2 * (start[1] - 0.03)) / 9.8);
  let py = start[1] - 0.5 * 9.8 * tf * tf;
  let rot = -0.9 + (0.9 * Math.min(tf, fallT)) / fallT;
  if (tf > fallT) {
    const b = tf - fallT; // one small bounce
    py = 0.03 + Math.max(0, 1.2 * b - 0.5 * 9.8 * b * b);
    rot = Math.sin(b * 18) * 0.12 * Math.max(0, 1 - b * 3);
  }
  const phone: V3 = [start[0], Math.max(0.03, py), start[2] + Math.min(tf, fallT) * 0.4];
  const cam: CameraSpec = { position: [1.6, 2.8, at[2] + 11.5], target: [0.2, 2.2, at[2] - 0.5] };
  return (
    <Stage mood="night" camera={cam} fog={[40, 200]} shake={v > 0 && v < 1 ? 0.05 : 0}>
      <StreetSet seed="nh" cars={false} />
      <Car position={[-1.7, 0, -18]} color={P.carTeal} />
      <Hero pose={pose} position={at} vanish={v} />
      <VanishPuff center={[at[0], 2.2, at[2]]} progress={clamp01((lt - VANISH_AT - 0.15) / 0.9)} />
      <Phone position={tf > 0 || v >= 1 ? phone : start} rotation={[rot, 0, 0]} />
    </Stage>
  );
};

// ---------------------------------------------------------------- 01 INSTANT CHAOS

const PHONE_ON_ROAD: V3 = [0.25, 0.03, -2.2];

const c1Phone: ShotFn = ({ lt }) => {
  const carZ = -38 + lt * 14;
  const cam = lerpCam({ position: [1.4, 0.8, 1.8], target: [0.2, 0.4, -6] }, { position: [1.3, 0.7, 1.2], target: [0.2, 0.4, -6] }, lt / 3);
  return (
    <Stage mood="night" camera={cam} fog={[30, 160]}>
      <StreetSet seed="nh" cars={false} />
      <Phone position={PHONE_ON_ROAD} rotation={[0, 0.4, 0]} />
      <Car position={[-1.7, 0, carZ]} color={P.carRed} />
    </Stage>
  );
};

const c1Crash: ShotFn = ({ lt }) => {
  const faceZ = -30;
  const ti = 0.9;
  const speed = 10;
  const crumple = clamp01((lt - ti) / 0.15);
  const shift = (3.1 - 3.1 * (1 - 0.18 * crumple)) / 2;
  const contactZ = faceZ + CAR_HALF_LENGTH; // car centre when its front bumper touches the wall
  const carZ = lt < ti ? contactZ + speed * (ti - lt) : contactZ - 2 * shift;
  const cam = lerpCam({ position: [3.2, 3.6, -13], target: [1.6, 1.4, -28] }, { position: [3.0, 3.4, -14.5], target: [1.6, 1.4, -28.5] }, lt / 2.5);
  const shakeAmp = lt > ti && lt < ti + 0.5 ? 0.18 * (1 - (lt - ti) / 0.5) : 0;
  return (
    <Stage mood="night" camera={cam} fog={[40, 200]} shake={shakeAmp} shakeSeed="crash">
      <StreetSet seed="nh" cars={false} />
      <Building position={[0, 0, faceZ - 2.5]} w={11} d={5} h={10} color={P.bldgPurple} seed="terminus" />
      <Car position={[1.7, 0, carZ]} yaw={Math.PI} color={P.carRed} crumple={crumple} />
      <SmokeCluster position={[1.7, 0.2, faceZ + 0.6]} progress={clamp01((lt - ti) / 1.4)} radius={1.2} count={7} rise={1.5} seed="cs" />
      <Debris origin={[1.7, 0.8, faceZ + 0.3]} t={Math.max(0, lt - ti)} count={10} speed={4} seed="cd" color={P.carRed} />
      {lt > ti ? <Fireball position={[1.7, 0.2, faceZ + 0.8]} progress={clamp01((lt - ti) / 0.9) * 0.5} radius={0.9} seed="cf" /> : null}
    </Stage>
  );
};

const c1Collide: ShotFn = ({ lt }) => {
  const C: V3 = [0, 0, 0]; // a road intersection in a 4-block grid
  const ti = 0.32;
  const sp = 12;
  const hit = lt >= ti;
  const k = clamp01((lt - ti) / 0.3);
  const ax = hit ? C[0] - 0.75 - CAR_HALF_LENGTH : C[0] - 0.75 - CAR_HALF_LENGTH - sp * (ti - lt);
  const bz = hit ? C[2] : C[2] + sp * (ti - lt);
  // Camera above the road the red car drives down, so no building sits between it and the crash.
  const cam = lerpCam({ position: [0.6, 15, 15], target: [0, 0, -0.5] }, { position: [0.6, 14, 13.5], target: [0, 0, -0.5] }, lt / 1.2);
  return (
    <Stage mood="night" camera={cam} fog={[40, 160]} shake={hit && lt < ti + 0.4 ? 0.15 : 0} shakeSeed="tbone" shadowSize={30}>
      <CityGrid seed="nhc" blocks={4} />
      <Car position={[ax, 0, C[2]]} yaw={Math.PI / 2} color={P.carTeal} crumple={k} />
      <Car position={[C[0] + 0.5 * k, 0, bz]} yaw={Math.PI + 0.4 * k} color={P.carRed} />
      <SmokeCluster position={[C[0] - 0.8, 0.3, C[2]]} progress={k * 0.8} radius={1.1} count={6} rise={1.2} seed="ts" />
    </Stage>
  );
};

const c1Plane: ShotFn = ({ lt, t }) => {
  const cam = lerpCam({ position: [0.4, 1.6, 14], target: [0, 12, -40] }, { position: [0.4, 1.6, 12.5], target: [0, 13, -40] }, lt / 2.5);
  return (
    <AbsoluteFill>
      <Stage mood="night" camera={cam} fog={[60, 260]}>
        <StreetSet seed="nh" cars={false} />
        <Plane position={[-26 + lt * 16, 34, -70]} rotation={[0, Math.PI / 2, 0]} scale={1.4} t={t} />
      </Stage>
      <CardLine text="AUTOPILOT ON" sub="NOBODY IN THE COCKPIT" y={1100} appearFrame={-9999} />
    </AbsoluteFill>
  );
};

const c1PlaneDown: ShotFn = ({ lt, dur, t }) => {
  const ti = Math.max(1.2, dur - 0.55);
  const k = clamp01(lt / ti);
  const from: V3 = [-36, 40, -170];
  const to: V3 = [26, 0, -175];
  const pos: V3 = [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k * k, from[2] + (to[2] - from[2]) * k];
  const pitch = -0.15 - 0.45 * k;
  const cam = lerpCam({ position: [0, 13, 34], target: [0, 9, -60] }, { position: [0, 13, 31], target: [0, 9, -60] }, lt / 3);
  return (
    <Stage mood="night" camera={cam} fog={[70, 320]} shadowSize={60}>
      <CityGrid seed="skyline" blocks={4} block={13} />
      {lt < ti ? <Plane position={pos} rotation={[pitch, Math.PI / 2, 0]} scale={2.2} t={t} /> : null}
      {lt >= ti ? <Fireball position={[to[0], 0, to[2]]} progress={clamp01((lt - ti) / 1.2)} radius={10} seed="pd" /> : null}
    </Stage>
  );
};

// ---------------------------------------------------------------- 02 LIGHTS OUT

const aerialCam = (lt: number, a0 = 0.35): CameraSpec => {
  const a = a0 + lt * 0.05;
  return { position: [Math.sin(a) * 30, 24, Math.cos(a) * 30], target: [0, 2, 0] };
};

const c2CityLit: ShotFn = ({ lt }) => (
  <Stage mood="night" camera={aerialCam(lt)} fog={[60, 170]} shadowSize={50}>
    <CityGrid seed="nhcity" blocks={5} />
  </Stage>
);

const c2EarthLights: ShotFn = ({ lt, t }) => {
  const cam = lerpCam({ position: [0, 0, 13], target: [0, 0, 0] }, { position: [0, 0, 11.5], target: [0, 0, 0] }, lt / 2.5);
  return (
    <Stage mood="space" camera={cam} fog={false} shadows={false} keyDir={[-1, 0.2, -0.8]} light={0.3}>
      <FacetedEarth radius={3} position={[0, 0, 0]} rotation={[0.35, 1.6 + t * 0.06, 0]} cityLights={1 - 0.6 * ease(lt / 1.8)} />
    </Stage>
  );
};

const c2Power: ShotFn = ({ lt, t }) => {
  const cam = lerpCam({ position: [20, 7, 30], target: [0, 6, 0] }, { position: [18, 7, 27], target: [0, 6, 0] }, lt / 2);
  return (
    <Stage mood="night" camera={cam} fog={[50, 220]} shadowSize={40}>
      <Ground color="#232A3E" />
      <PowerStation on={1 - ease(lt / 1.4)} t={t} />
      <PineTree position={[-12, 0, 10]} scale={1.4} />
      <PineTree position={[16, 0, -6]} scale={1.6} />
    </Stage>
  );
};

const c2Blackout: ShotFn = ({ lt }) => {
  const k = lt / 2.2;
  const modify = (s: BuildingSpec) => {
    const d = Math.hypot(s.position[0] + 20, s.position[2] + 20) / 60;
    return { power: clamp01(1 - (k * 1.6 - d) * 3) };
  };
  return (
    <Stage mood="night" camera={aerialCam(lt, 0.55)} fog={[60, 170]} shadowSize={50}>
      <CityGrid seed="nhcity" blocks={5} modify={modify} />
    </Stage>
  );
};

// ---------------------------------------------------------------- 03 THE FLOOD BELOW

const DARK = abandon(0, 0);

const c3DarkStreet: ShotFn = ({ lt }) => {
  const pose = grounded(mergePose(REST, { headYaw: Math.sin(lt * 2.2) * 0.6, expression: "worried" }));
  return (
    <Stage mood="night" camera={lerpCam(STREET_WIDE, { position: [0.5, 2.6, 19.5], target: [0, 6.0, -10] }, lt / 2)} fog={[30, 180]}>
      <StreetSet seed="nh" cars={false} lampsOn={false} modify={DARK} />
      <Car position={[1.7, 0, -14]} yaw={Math.PI} color={P.carRed} lights={false} />
      <Hero pose={pose} position={HERO_AT} ghost={GHOST * ease(lt / 0.8)} />
    </Stage>
  );
};

const c3Tunnel: ShotFn = ({ lt, t }) => {
  const cam = lerpCam({ position: [0.9, 2.1, 4], target: [0, 1.2, -30] }, { position: [0.8, 1.9, 2.5], target: [0, 1.1, -30] }, lt / 2.5);
  return (
    <Stage mood="night" camera={cam} fog={[10, 70]} stars={false} shadows={false}>
      <SubwayTunnel water={0.25 + ease(lt / 2.4) * 1.1} lights={0.5 - 0.5 * ease(lt / 1.5)} t={t} />
    </Stage>
  );
};

const c3Dog: ShotFn = ({ lt, t }) => {
  const cam = lerpCam({ position: [1.6, 2.0, 7.5], target: [0, 1.9, -1] }, { position: [1.3, 2.0, 6.3], target: [0, 1.9, -1] }, lt / 2);
  return (
    <Stage mood="night" camera={cam} fog={[20, 120]} shadowSize={14}>
      <Ground color={P.pavement} />
      <HouseWithDog position={[0, 0, 0]} t={t} />
      <Lamp position={[3.8, 0, 2.2]} on={false} />
      <Bush position={[-2.4, 0, 0.9]} size={1.1} seed="db" />
    </Stage>
  );
};

const c3Deer: ShotFn = ({ lt }) => {
  const dz = -11 + lt * 2.0;
  const pose = grounded(mergePose(REST, { headYaw: -0.5, expression: "awe" }));
  return (
    <Stage mood="night" camera={lerpCam({ position: [0.4, 2.8, 20], target: [0, 4.8, -8] }, { position: [0.4, 2.7, 18], target: [0, 4.8, -8] }, lt / 3)} fog={[30, 180]}>
      <StreetSet seed="nh" cars={false} lampsOn={false} modify={DARK} />
      <Animal kind="deer" position={[-1.6, 0, dz]} walk={lt * 1.1} scale={1.25} />
      <Animal kind="fox" position={[1.0, 0, -26 + lt * 2.8]} walk={lt * 1.6} />
      <Hero pose={pose} position={[2.6, 0.12, -1]} yaw={-0.4} ghost={GHOST} />
    </Stage>
  );
};

// ---------------------------------------------------------------- 04 NATURE MOVES IN

const c4Street: ShotFn = ({ lt }) => {
  const g = 0.15 + 0.45 * ease(lt / 3.4);
  const pose = grounded(mergePose(REST, { headPitch: -0.2, headYaw: 0.3, expression: "awe" }));
  return (
    <Stage mood="dawn" camera={lerpCam(STREET_WIDE, { position: [0.5, 3.2, 19], target: [0, 5.6, -10] }, lt / 3.5)} fog={[40, 220]}>
      <StreetSet seed="nh" cars={false} lampsOn={false} modify={abandon(0, 0.15)} />
      <GrassTufts points={KERB_POINTS} count={700} growth={g} seed="kerb" height={0.6} />
      <GroundCover area={[-3.2, 3.2, -60, 10]} growth={g * 0.5} count={50} seed="road" />
      <Car position={[-1.7, 0, -12]} color={P.carTeal} lights={false} rust={0.1} />
      <Hero pose={pose} position={HERO_AT} ghost={GHOST} />
    </Stage>
  );
};

const c4Cracks: ShotFn = ({ lt }) => {
  const cam = lerpCam({ position: [0.9, 0.9, 2.6], target: [0, 0.1, -1.5] }, { position: [0.7, 0.75, 2.0], target: [0, 0.1, -1.5] }, lt / 2);
  const crack: V3[] = [[-1.4, 0, 0.6], [-0.6, 0, -0.2], [0.1, 0, -0.5], [0.8, 0, -1.4], [1.3, 0, -2.6]];
  return (
    <Stage mood="dawn" camera={cam} fog={[10, 80]}>
      <StreetSet seed="nh" cars={false} lampsOn={false} modify={abandon(0, 0.15)} />
      {crack.slice(1).map((b, i) => {
        const a = crack[i];
        const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
        return (
          <mesh key={i} position={[(a[0] + b[0]) / 2, 0.006, (a[2] + b[2]) / 2]} rotation={[-Math.PI / 2, 0, -Math.atan2(b[2] - a[2], b[0] - a[0])]}>
            <planeGeometry args={[len, 0.09]} />
            <meshBasicMaterial color="#12141A" />
          </mesh>
        );
      })}
      <GrassTufts points={crack} count={90} growth={ease(lt / 1.6)} height={0.5} seed="crack" />
    </Stage>
  );
};

const c4Spread: ShotFn = ({ lt }) => {
  const g = 0.3 + 0.6 * ease(lt / 2.2);
  const cam = lerpCam({ position: [7, 10, 14], target: [0, 0, -8] }, { position: [6, 9, 12], target: [0, 0, -8] }, lt / 2.5);
  return (
    <Stage mood="dawn" camera={cam} fog={[40, 200]}>
      <StreetSet seed="nh" cars={false} lampsOn={false} modify={abandon(0, 0.2)} />
      <GroundCover area={[-3.4, 3.4, -50, 12]} growth={g} count={70} seed="road" />
      <GrassTufts points={KERB_POINTS} count={700} growth={0.6 + g * 0.4} seed="kerb" height={0.7} />
      {[-12, -24, -36].map((z, i) => (
        <Bush key={z} position={[i % 2 ? 3.3 : -3.3, 0.12, z]} growth={clamp01((g - 0.3 - i * 0.12) / 0.4)} size={1.2} seed={`sb${i}`} />
      ))}
    </Stage>
  );
};

// ---------------------------------------------------------------- 05 CITIES CHANGE

const cityTrees = (n: number, seed: string, block = 14, blocks = 5) =>
  Array.from({ length: n }, (_, i) => {
    // On roads: road centres are at multiples of `block` offset by half the grid.
    const half = (blocks - 1) / 2;
    const alongX = random(`${seed}a${i}`) < 0.5;
    const line = (Math.floor(random(`${seed}l${i}`) * (blocks + 1)) - (blocks / 2)) * block;
    const pos = (random(`${seed}p${i}`) - 0.5) * (blocks - 1) * block;
    void half;
    return { p: (alongX ? [pos, 0, line + (random(`${seed}o${i}`) - 0.5) * 2] : [line + (random(`${seed}o${i}`) - 0.5) * 2, 0, pos]) as V3, s: 1 + random(`${seed}s${i}`) * 0.6, seed: `${seed}${i}` };
  });

const c5Aerial: ShotFn = ({ lt }) => {
  const trees = cityTrees(26, "c5t");
  return (
    <Stage mood="dawn" camera={aerialCam(lt, 0.9)} fog={[60, 200]} shadowSize={50}>
      <CityGrid seed="nhcity" blocks={5} modify={abandon(0, 0.4)} />
      <GroundCover area={[-40, 40, -40, 40]} growth={0.55} count={120} seed="c5g" />
      {trees.map((tr) => (
        <LeafyTree key={tr.seed} position={tr.p} scale={tr.s * 0.8} growth={0.35} seed={tr.seed} />
      ))}
    </Stage>
  );
};

const c5Storm: ShotFn = ({ lt, t }) => {
  const flash = lt > 0.45 && lt < 0.62 ? 1 - (lt - 0.45) / 0.17 : lt > 0.75 && lt < 0.83 ? 0.6 : 0;
  const pose = grounded(mergePose(REST, { headPitch: 0.35, expression: "alarm", lShoulder: [0.2, 0.3], rShoulder: [0.2, 0.3] }));
  return (
    <AbsoluteFill>
      <Stage mood="storm" camera={lerpCam(STREET_WIDE, { position: [0.5, 2.6, 19.5], target: [0, 6.2, -10] }, lt / 2)} fog={[20, 140]} shake={flash > 0 ? 0.08 : 0} shakeSeed="storm">
        <StreetSet seed="nh" cars={false} lampsOn={false} modify={abandon(0, 0.45)} />
        <GrassTufts points={KERB_POINTS} count={700} growth={0.9} seed="kerb" height={0.8} />
        <FloodWater level={0.18} t={t} size={[7, 140]} position={[0, 0, -40]} flow={3} />
        <Rain center={[0, 8, 4]} size={[26, 18, 30]} t={t} count={600} />
        <LightningBolt top={[-6, 40, -60]} bottom={[-3, 8, -60]} flash={flash} />
        <Hero pose={pose} position={HERO_AT} ghost={GHOST} />
      </Stage>
      <AbsoluteFill style={{ background: "#DCE8FF", opacity: flash * 0.35, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

const c5Ivy: ShotFn = ({ lt }) => {
  const decay = 0.25 + 0.55 * ease(lt / 2.3);
  const pose = grounded(mergePose(REST, { headPitch: 0.55, expression: "awe" }));
  const cam = lerpCam({ position: [4.5, 2.0, 15], target: [0.5, 6, -5] }, { position: [4.2, 1.9, 13.5], target: [0.5, 6.5, -5] }, lt / 2.5);
  return (
    <Stage mood="dawn" camera={cam} fog={[30, 160]}>
      <Ground color={P.pavement} />
      <Building position={[0, 0, -7]} w={8} d={4} h={14} color={P.bldgSlate} seed="ivyb" power={0} decay={decay} />
      <GrassTufts area={[-5, 5, -4.8, 3]} count={260} growth={0.9} seed="ivyg" />
      <Hero pose={pose} position={[1.2, 0, 2]} yaw={Math.PI - 0.25} ghost={GHOST} />
    </Stage>
  );
};

// ---------------------------------------------------------------- 06 THE WILD RETURNS

const c6Lapse: ShotFn = ({ lt, dur }) => {
  const k = ease(lt / Math.max(1.5, dur));
  const trees = cityTrees(60, "c6t");
  const a = 0.9 + lt * 0.12;
  const cam: CameraSpec = { position: [Math.sin(a) * 30, 20 + k * 10, Math.cos(a) * 30], target: [0, 2, 0] };
  return (
    <Stage mood="dawn" camera={cam} fog={[60, 210]} shadowSize={50}>
      <CityGrid seed="nhcity" blocks={5} modify={abandon(0, 0.45 + 0.45 * k)} />
      <GroundCover area={[-40, 40, -40, 40]} growth={0.6 + 0.4 * k} count={140} seed="c5g" />
      {trees.map((tr) => (
        <LeafyTree key={tr.seed} position={tr.p} scale={tr.s} growth={0.3 + 0.7 * k} seed={tr.seed} />
      ))}
    </Stage>
  );
};

const c6Forest: ShotFn = ({ lt }) => {
  const trees = streetTrees(34, "c6f");
  const pose = grounded(mergePose(REST, { headPitch: 0.25, headYaw: Math.sin(lt * 1.5) * 0.4, expression: "awe" }));
  return (
    <Stage mood="dawn" camera={lerpCam(STREET_WIDE, { position: [0.5, 3.0, 19], target: [0, 6.0, -10] }, lt / 3)} fog={[30, 170]}>
      <StreetSet seed="nh" cars={false} lampsOn={false} modify={abandon(0, 0.85)} />
      <GroundCover area={[-6, 6, -60, 12]} growth={1} count={90} seed="c6g" />
      <GrassTufts points={KERB_POINTS} count={800} growth={1} seed="kerb" height={1.0} />
      {trees.map((tr) => (
        <LeafyTree key={tr.seed} position={tr.p} scale={tr.s} growth={1} seed={tr.seed} />
      ))}
      <Hero pose={pose} position={HERO_AT} ghost={GHOST} />
    </Stage>
  );
};

/** Street-set buildings collapse into the road (away from their row neighbours), capped by height. */
const ruin = (s: BuildingSpec, i: number) => {
  const towardRoad = s.position[0] > 0 ? -1 : 1;
  const h = s.h ?? 9;
  const pick = random(`ruin${i}`);
  return {
    power: 0,
    decay: 0.95,
    sink: pick < 0.4 ? 0.3 : 0.05,
    tilt: [0, pick < 0.4 ? towardRoad * 0.22 * Math.min(1, 9 / h) : 0] as [number, number],
  };
};

const RoadSlabs: React.FC = () => (
  <group>
    {Array.from({ length: 16 }, (_, i) => {
      const x = (random(`sl${i}`) - 0.5) * 5;
      const z = 2 - i * 3.2 - random(`slz${i}`) * 1.5;
      return (
        <mesh key={i} position={[x, 0.12, z]} rotation={[(random(`sp${i}`) - 0.5) * 0.25, random(`sy${i}`) * 1.2, (random(`sr${i}`) - 0.5) * 0.25]} castShadow receiveShadow>
          <boxGeometry args={[1.6 + random(`sw${i}`), 0.22, 1.2 + random(`sd${i}`)]} />
          <meshLambertMaterial color={P.road} flatShading />
        </mesh>
      );
    })}
  </group>
);

const c6Ruins: ShotFn = ({ lt }) => {
  const cam = lerpCam({ position: [-3, 2.4, 16], target: [0.5, 4.5, -10] }, { position: [-2.6, 2.4, 14], target: [0.5, 4.8, -10] }, lt / 3);
  return (
    <Stage mood="dawn" camera={cam} fog={[30, 170]}>
      <StreetSet seed="nh" cars={false} lampsOn={false} modify={ruin} trees={false} />
      <RoadSlabs />
      <GroundCover area={[-6, 6, -60, 12]} growth={1} count={90} seed="c6g" />
      <GrassTufts points={KERB_POINTS} count={800} growth={1} seed="kerb" height={1.1} />
      <Car position={[1.6, 0, -6]} yaw={Math.PI + 0.2} color={P.carRed} rust={1} moss={1} lights={false} tilt={[0.05, 0.08]} />
      <Car position={[-1.8, 0, -15]} yaw={0.3} color={P.carTeal} rust={1} moss={0.8} lights={false} />
      {[[-0.6, 0, -24], [1.2, 0, -32], [-1.0, 0, -40]].map((p, i) => (
        <LeafyTree key={i} position={p as V3} scale={1.3} seed={`rt${i}`} />
      ))}
      <Lamp position={[3.9, 0.12, -9]} on={false} lean={0.35} />
    </Stage>
  );
};

const c6Animals: ShotFn = ({ lt }) => {
  const trees = streetTrees(26, "c6a", [0, 0, -4], 4.8);
  return (
    <Stage mood="dawn" camera={lerpCam({ position: [3, 2.6, 14], target: [-0.5, 2.6, -6] }, { position: [2.6, 2.5, 12.5], target: [-0.5, 2.6, -6] }, lt / 3)} fog={[30, 160]}>
      <StreetSet seed="nh" cars={false} lampsOn={false} modify={abandon(0, 0.9)} />
      <GroundCover area={[-6, 6, -60, 12]} growth={1} count={90} seed="c6g" />
      <GrassTufts area={[-3.5, 3.5, -20, 8]} count={500} growth={1} height={0.9} seed="c6ag" />
      {trees.map((tr) => (
        <LeafyTree key={tr.seed} position={tr.p} scale={tr.s} seed={tr.seed} />
      ))}
      <Animal kind="deer" position={[-1.2, 0, -3]} yaw={0.6} headPitch={-0.9} scale={1.2} />
      <Animal kind="deer" position={[0.9, 0, -6.5]} yaw={-0.4} headPitch={-0.2 + Math.sin(lt * 2) * 0.1} scale={1.1} />
      <Animal kind="deer" position={[-0.3, 0, -10]} yaw={0.2} walk={lt * 0.9} scale={1.0} />
      <Animal kind="wolf" position={[2.8, 0, -18 + lt * 1.8]} walk={lt * 1.3} />
    </Stage>
  );
};

// ---------------------------------------------------------------- 07 BURIED BY TIME

const STUMPS: { p: V3; h: number; seed: string }[] = Array.from({ length: 7 }, (_, i) => ({
  p: [(random(`st${i}`) - 0.5) * 40, 0, -10 - random(`stz${i}`) * 40] as V3,
  h: 2 + random(`sth${i}`) * 3,
  seed: `stump${i}`,
}));

const c7Hills: ShotFn = ({ lt }) => {
  const cam = lerpCam({ position: [0, 12, 30], target: [0, 2, -20] }, { position: [0, 11, 26], target: [0, 2, -20] }, lt / 3);
  return (
    <Stage mood="dawn" camera={cam} fog={[40, 220]} shadowSize={60}>
      <Ground color={P.grass} />
      <Hills />
      {STUMPS.map((s, i) => (
        <Building key={s.seed} position={s.p} w={3} d={3} h={s.h} color={BUILDING_COLORS[i % BUILDING_COLORS.length]} seed={s.seed} power={0} decay={1} />
      ))}
      {Array.from({ length: 18 }, (_, i) => (
        <LeafyTree key={i} position={[(random(`ht${i}`) - 0.5) * 50, 0, -random(`htz${i}`) * 50]} scale={1.4} seed={`ht${i}`} />
      ))}
    </Stage>
  );
};

const c7Layers: ShotFn = ({ lt }) => {
  const cam = lerpCam({ position: [4, 1.5, 11], target: [0, -1.4, 0] }, { position: [3.4, 1.4, 9.6], target: [0, -1.4, 0] }, lt / 3);
  const chunks: { p: V3; s: V3; c: string; r: number }[] = [
    { p: [-3.5, -2.6, 3.0], s: [1.6, 0.8, 0.8], c: P.bldgSlate, r: 0.2 },
    { p: [-0.5, -3.2, 3.0], s: [2.2, 0.5, 0.6], c: P.road, r: -0.1 },
    { p: [2.6, -2.2, 3.0], s: [1.0, 1.0, 0.7], c: P.bldgPurple, r: 0.5 },
    { p: [4.4, -3.4, 3.0], s: [1.3, 0.6, 0.6], c: P.rust, r: -0.3 },
  ];
  return (
    <AbsoluteFill>
      <Stage mood="dawn" camera={cam} fog={[30, 160]} keyDir={[0.4, 0.7, 1]}>
        <SedimentLayers />
        {chunks.map((ch, i) => (
          <mesh key={i} position={ch.p} rotation={[0, 0, ch.r]} castShadow>
            <boxGeometry args={ch.s} />
            <meshLambertMaterial color={ch.c} flatShading />
          </mesh>
        ))}
        <GrassTufts area={[-7, 7, -3, 3]} count={360} growth={1} seed="lg" height={0.35} />
        <LeafyTree position={[-3, 0, -1]} scale={1.2} seed="lt1" />
        <Bush position={[3.2, 0, 0.5]} size={1.2} seed="lb" />
      </Stage>
      <CardLine text="BURIED" sub="UNDER PLANTS AND SEDIMENT" y={1110} appearFrame={-9999} />
    </AbsoluteFill>
  );
};

const c7Monuments: ShotFn = ({ lt }) => {
  const cam = lerpCam({ position: [14, 6, 26], target: [0, 4, -4] }, { position: [12.5, 6, 23], target: [0, 4.5, -4] }, lt / 2);
  return (
    <Stage mood="dawn" camera={cam} fog={[40, 220]} shadowSize={40}>
      <Ground color={P.grass} />
      <Pyramid position={[-2, 0, -8]} size={14} bury={0.12} vines={0.6} />
      <Obelisk position={[9, 0, 2]} height={10} lean={0.1} />
      {Array.from({ length: 10 }, (_, i) => (
        <LeafyTree key={i} position={[(random(`mt${i}`) - 0.5) * 40, 0, 6 - random(`mtz${i}`) * 30]} scale={1.3} seed={`mt${i}`} />
      ))}
    </Stage>
  );
};

const c7Bottle: ShotFn = ({ lt }) => {
  const cam = lerpCam({ position: [2.6, 1.7, 6.2], target: [0, 0.4, 0] }, { position: [2.3, 1.5, 5.4], target: [0, 0.4, 0] }, lt / 3);
  return (
    <AbsoluteFill>
      <Stage mood="dawn" camera={cam} fog={[10, 80]}>
        <Ground color={P.sediment} y={0} />
        <BuriedBottle position={[0, 0.05, 0]} />
        <GrassTufts area={[-3, 3, -3, 2]} count={220} growth={1} seed="bg" height={0.5} />
        <Bush position={[-1.8, 0, -1.4]} size={0.8} seed="bb" />
      </Stage>
      <CardLine text="STILL HERE" sub="LONG AFTER US" y={1110} appearFrame={-9999} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 08 LIFE GOES ON

const c8Earth: ShotFn = ({ lt, t }) => {
  const cam = lerpCam({ position: [0, 0, 15], target: [0, 0, 0] }, { position: [0, 0, 13.5], target: [0, 0, 0] }, lt / 2);
  return (
    <Stage mood="space" camera={cam} fog={false} shadows={false}>
      <FacetedEarth radius={3} rotation={[0.35, 1.0 + t * 0.06, 0]} />
    </Stage>
  );
};

const c8Spin: ShotFn = ({ lt, t }) => {
  const cam = lerpCam({ position: [0, 0.4, 12], target: [0, 0, 0] }, { position: [0, 0.4, 10], target: [0, 0, 0] }, lt / 2.5);
  return (
    <Stage mood="space" camera={cam} fog={false} shadows={false}>
      <FacetedEarth radius={3} rotation={[0.35, 1.0 + t * 0.06 + lt * lt * 0.6, 0]} />
      <FacetedMoon radius={0.5} position={[3.4, 2.6, -4]} />
    </Stage>
  );
};

const c8Ocean: ShotFn = ({ lt, t }) => {
  const cam = lerpCam({ position: [0, 2.2, 10], target: [0, 1.6, -40] }, { position: [0, 2.0, 7], target: [0, 1.6, -40] }, lt / 2);
  return (
    <Stage mood="dawn" camera={cam} fog={[40, 260]} shadows={false}>
      <FloodWater level={0.01} t={t} size={[120, 160]} position={[0, 0, -60]} flow={2} />
      <mesh position={[0, 4, -150]}>
        <circleGeometry args={[7, 16]} />
        <meshBasicMaterial color="#FFD9A0" toneMapped={false} fog={false} />
      </mesh>
    </Stage>
  );
};

const c8Life: ShotFn = ({ lt }) => {
  const cam = lerpCam({ position: [2.5, 2.4, 13], target: [0, 2.0, -4] }, { position: [2.2, 2.3, 11.5], target: [0, 2.0, -4] }, lt / 2.5);
  return (
    <Stage mood="dawn" camera={cam} fog={[30, 170]}>
      <Ground color={P.grass} />
      <GrassTufts area={[-8, 8, -20, 8]} count={700} growth={1} seed="lifeg" height={0.8} />
      {Array.from({ length: 16 }, (_, i) => {
        const x = (random(`lf${i}`) - 0.5) * 22;
        const z = -4 - random(`lfz${i}`) * 30;
        return Math.abs(x) < 3 && z > -12 ? null : <LeafyTree key={i} position={[x, 0, z]} scale={1.4} seed={`lf${i}`} />;
      })}
      <Animal kind="deer" position={[-1.2, 0, -2 + lt * 0.6]} walk={lt * 0.8} scale={1.2} />
      <Animal kind="fox" position={[1.8, 0, -6]} yaw={-0.6} headPitch={0.2} />
    </Stage>
  );
};

const c8Ghost: ShotFn = ({ lt, dur }) => {
  const fade = 1 - ease((lt - (dur - 0.7)) / 0.6);
  const pose = grounded(mergePose(REST, { headPitch: 0.1, expression: "relief" }));
  const cam = lerpCam({ position: [2.4, 3.2, 12.5], target: [0.4, 2.9, -6] }, { position: [2.2, 3.1, 11.2], target: [0.4, 2.9, -6] }, lt / 2.5);
  return (
    <Stage mood="dawn" camera={cam} fog={[30, 220]}>
      <Ground color={P.grass} />
      <Hills seed="gh" count={10} spread={80} />
      <GrassTufts area={[-6, 6, -6, 5]} count={500} growth={1} seed="ghg" height={0.7} />
      <Hero pose={pose} position={[0, 0, 0]} yaw={Math.PI} ghost={GHOST * fade} />
    </Stage>
  );
};

const c8Final: ShotFn = ({ lt, t }) => {
  const cam = lerpCam({ position: [0, 0, 12], target: [0, 0, 0] }, { position: [0, 0, 18], target: [0, 0, 0] }, lt / 4);
  return (
    <Stage mood="space" camera={cam} fog={false} shadows={false}>
      <FacetedEarth radius={3} rotation={[0.35, 1.4 + t * 0.06, 0]} />
    </Stage>
  );
};

// ---------------------------------------------------------------- shot list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldEarth },
    { cue: "Not died", fn: coldWalk },
    { cue: "just vanished", fn: coldVanish },
  ],
  c1: [
    { cue: null, fn: c1Phone },
    { cue: "Millions of cars", fn: c1Crash },
    { cue: "and each other", fn: c1Collide },
    { cue: "Planes", fn: c1Plane },
    { cue: "but many", fn: c1PlaneDown },
  ],
  c2: [
    { cue: null, fn: c2CityLit },
    { cue: "parts of the world", fn: c2EarthLights },
    { cue: "Power stations", fn: c2Power },
    { cue: "and entire cities", fn: c2Blackout },
  ],
  c3: [
    { cue: null, fn: c3DarkStreet },
    { cue: "underground tunnels", fn: c3Tunnel },
    { cue: "Pets", fn: c3Dog },
    { cue: "while wild animals", fn: c3Deer },
  ],
  c4: [
    { cue: null, fn: c4Street },
    { cue: "Grass", fn: c4Cracks },
    { cue: "and plants", fn: c4Spread },
  ],
  c5: [
    { cue: null, fn: c5Aerial },
    { cue: "as storms", fn: c5Storm },
    { cue: "and plants slowly", fn: c5Ivy },
  ],
  c6: [
    { cue: null, fn: c6Lapse },
    { cue: "Forests", fn: c6Forest },
    { cue: "Roads would crumble", fn: c6Ruins },
    { cue: "Animals", fn: c6Animals },
  ],
  c7: [
    { cue: null, fn: c7Hills },
    { cue: "most of what", fn: c7Layers },
    { cue: "But some monuments", fn: c7Monuments },
    { cue: "our plastic", fn: c7Bottle },
  ],
  c8: [
    { cue: null, fn: c8Earth },
    { cue: "the Earth", fn: c8Spin },
    { cue: "the oceans", fn: c8Ocean },
    { cue: "and life", fn: c8Life },
    { cue: "Because humanity", fn: c8Ghost },
    { cue: "but Earth", fn: c8Final },
  ],
};

