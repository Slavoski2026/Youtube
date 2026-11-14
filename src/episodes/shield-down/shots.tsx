/**
 * Shots for "What If Earth Lost Its Shield?" (ep. 8: the magnetic field gone for 24 hours).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * The hook is personal, not Earth from space: Slavoski's compass needle letting go. The day follows the
 * "SHIELD DOWN FOR" clock: morning street → late morning → overcast afternoon → sunset → a night of
 * faint aurora → dawn, when the shield comes back and the needle swings home.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Car, Ground, PineTree, Plane, PowerStation, StreetSet } from "../../slavoski/city";
import { BoxG, IcoG } from "../../slavoski/detail";
import { crowdLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Bush, Clouds, GrassTufts, LeafyTree } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { CardLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import { Bird } from "../../slavoski/critters";
import { handPosition, headPosition, Hero, mergePose, reach, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { CanvasPanel, ScreenHtml } from "../../slavoski/screens";
import { FacetedEarth } from "../../slavoski/space";
import { lerpCam, Stage, Stars, type CameraSpec } from "../../slavoski/Stage";
import { type CuedShot, wordAt } from "../../slavoski/timeline";
import { HillRing, House } from "../no-work-2036/props";
import { Pinned } from "../smart-animals/props";
import { CellTower, Helmet, NoService, Pylon, Satellite, SPACESUIT } from "../satellites-dark/props";
import { CITY, PHONE, Phone3D } from "../ww3-countdown/props";
import {
  AtmoHits,
  Aurora,
  CoffeeCup,
  Compass,
  COMPASS,
  Fence,
  FieldLines,
  needleHeading,
  RedPlanet,
  ShieldBubble,
  SolarWind,
  SpaceStation,
  Sun,
  Sunscreen,
  TownLights,
} from "./props";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
const startFrame = (c: ShotCtx) => Math.round((c.t - c.lt) * 30);
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** The needle lets go 0.45 s into the episode and swings home on "You might never even realise it happened". */
export const NEEDLE_LOOSE = 0.45;
const heading = (c: ShotCtx) => needleHeading(c.t, NEEDLE_LOOSE, c.words?.length ? wordAt(c.words, "You might", 40, 58.6) - 0.02 : Infinity);

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

const CLOUD = { day: "#F4F6FA", dawn: "#E8C4C8", sunset: "#F7C0A0", overcast: "#AEB6C2" } as const;
const Sky: React.FC<{ t: number; tint: keyof typeof CLOUD; y?: number; radius?: number; count?: number; seed?: string }> = ({ t, tint, y = 45, radius = 200, count = 16, seed = "sky" }) => (
  <Clouds t={t} color={CLOUD[tint]} y={y} radius={radius} count={count} seed={seed} />
);

const MORNING_KEY: V3 = [-0.7, 0.55, 0.45];
const SPACE_KEY: V3 = [0.25, 1, 0.45];

/** Slavoski holding his compass flat in front of his chest, looking down at it. */
const compassStance = (hero: V3, over: Partial<Pose> = {}, yaw = 0) => {
  const base = mergePose(REST, { headPitch: -0.45, ...over });
  const local: V3 = [-0.25, 2.3, 0.95];
  const target: V3 = [hero[0] + local[0] * Math.cos(yaw) + local[2] * Math.sin(yaw), hero[1] + local[1], hero[2] - local[0] * Math.sin(yaw) + local[2] * Math.cos(yaw)];
  const pose = reach(base, "r", target, { position: hero, yaw }).pose;
  const hp = handPosition(pose, "r", hero, yaw);
  const compass: V3 = [hp[0], hp[1] + 0.22 + COMPASS.h / 2 - 0.02, hp[2]];
  return { pose, compass };
};

/** A prop held in front of the right fist (hero facing `yaw`). */
const inFront = (pose: Pose, hero: V3, yaw: number, ahead: number, up: number): V3 => {
  const hp = handPosition(pose, "r", hero, yaw);
  return [hp[0] + Math.sin(yaw) * ahead, hp[1] + up, hp[2] + Math.cos(yaw) * ahead];
};

/** A palm-up hand holding the compass in close-up (no body in frame). */
const PalmCompass: React.FC<{ at: V3; heading: number; tilt?: number }> = ({ at, heading, tilt = 0.55 }) => (
  <group position={at} rotation={[tilt, 0, 0]}>
    <mesh position={[0, -COMPASS.h / 2 - 0.12, 0.05]} scale={[0.62, 0.16, 0.7]}>
      <IcoG args={[1, 2]} />
      <Flat color={P.skin} />
    </mesh>
    {[-0.3, -0.1, 0.1, 0.3].map((x, i) => (
      <mesh key={x} position={[x, -0.02, -0.55 - (i === 0 || i === 3 ? -0.06 : 0)]} rotation={[-0.5, 0, 0]}>
        <BoxG args={[0.17, 0.16, 0.36]} />
        <Flat color={P.skin} />
      </mesh>
    ))}
    <mesh position={[0.55, 0.0, 0.18]} rotation={[0, -0.6, 0.4]}>
      <BoxG args={[0.18, 0.17, 0.42]} />
      <Flat color={P.skin} />
    </mesh>
    <mesh position={[0, -0.25, 0.75]} scale={[0.5, 0.36, 0.6]}>
      <IcoG args={[1, 1]} />
      <Flat color={P.jacket} />
    </mesh>
    <Compass heading={heading} />
  </group>
);

/** Townsfolk walking along a pavement (×3.5 street): x lane, starting z, speed and direction. */
const Walkers: React.FC<{ t: number; list: { x: number; z: number; dir: 1 | -1; seed: number }[] }> = ({ t, list }) => (
  <group>
    {list.map((w, i) => (
      <Hero key={i} pose={walkPose(t * 1.5 + i * 0.37, 0.8)} position={[w.x, 0, w.z + w.dir * t * 2.4]} yaw={w.dir > 0 ? 0 : Math.PI} look={crowdLook(w.seed)} />
    ))}
  </group>
);

/** A car driving along a kit lane inside the ×3.5 street. */
const Driving: React.FC<{ t: number; lane: number; z0: number; speed: number; color: string }> = ({ t, lane, z0, speed, color }) => (
  <group scale={CITY}>
    <Car position={[lane, 0, z0 + speed * t]} yaw={speed > 0 ? 0 : Math.PI} color={color} />
  </group>
);

/** Earth in the vertical space layout (Sun up): a slowly turning faceted planet. */
const Earth: React.FC<{ t: number; R?: number; spin?: number; lights?: number }> = ({ t, R = 3, spin = 0.05, lights = 0 }) => (
  <group rotation={[0.3, 0, -Math.PI / 2 + 0.35]}>
    <FacetedEarth radius={R} rotation={[0, 2.2 + t * spin, 0]} cityLights={lights} />
  </group>
);

/** Earth's limb at the bottom of frame (satellite and station shots). */
const Limb: React.FC<{ y?: number; t: number }> = ({ y = -66, t }) => (
  <FacetedEarth radius={60} position={[0, y, -10]} rotation={[0.4, 2.0 + t * 0.004, 0]} />
);

/** The Sun far above (top of frame) for space diagrams: just its edge and glow. */
const SunAbove: React.FC<{ t: number; y?: number; z?: number; x?: number }> = ({ t, y = 33, z = -30, x = 4 }) => <Sun position={[x, y, z]} radius={5} t={t} />;

// ---------------------------------------------------------------- cold open: the hook

/** 0 s: the compass in his palm on a sunny morning street… then the needle lets go. */
const coldCompass: ShotFn = (c) => {
  const at: V3 = [16, 3.3, 12];
  const cam = move({ position: add(at, [0.15, 0.95, 1.55]), target: add(at, [0, 0.02, 0]) }, { position: add(at, [0.1, 0.82, 1.3]), target: add(at, [0, 0.02, 0]) }, c);
  return (
    <Shot mood="day" camera={cam} fog={[40, 380]} shadowSize={6} keyDir={MORNING_KEY} shake={c.lt > NEEDLE_LOOSE && c.lt < NEEDLE_LOOSE + 0.15 ? 0.006 : 0}>
      <BigStreet seed="hook" day lamps={false} />
      <Sky t={c.t} tint="day" seed="hook" />
      <PalmCompass at={at} heading={heading(c)} />
    </Shot>
  );
};

/** Earth from space with its shield up: field loops and a faint faceted bubble; the solar wind slides round it. */
const ShieldScene: React.FC<{ t: number; on?: number; shatter?: number; wind?: number; hits?: number }> = ({ t, on = 1, shatter = 0, wind = 1, hits = 0 }) => (
  <group>
    <Earth t={t} />
    <FieldLines t={t} on={on} />
    <ShieldBubble on={1} shatter={shatter} />
    <SolarWind t={t} shield={wind} count={460} width={16} />
    <AtmoHits t={t} amount={hits} />
  </group>
);

const coldShield: ShotFn = (c) => {
  const cam = move({ position: [0, 1, 46], target: [0, 1.5, 0] }, { position: [2.5, 1.5, 41], target: [0, 1.5, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={SPACE_KEY}>
      <SunAbove t={c.t} />
      <ShieldScene t={c.t} />
    </Shot>
  );
};

/** "…if it disappeared": the loops flicker out, the bubble shatters, the wind pours straight in. */
const coldGone: ShotFn = (c) => {
  const cam = move({ position: [9, 3, 38], target: [0, 1.5, 0] }, { position: [7, 2.5, 33], target: [0, 1.2, 0] }, c);
  const shatter = k01(c.lt, 0.15, 1.15);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={SPACE_KEY} shake={0.18 * Math.sin(Math.PI * clamp01((c.lt - 0.1) / 0.6))}>
      <SunAbove t={c.t} x={-3} />
      <ShieldScene t={c.t} on={1 - k01(c.lt, 0.0, 0.8)} shatter={shatter} wind={1 - shatter} hits={k01(c.lt, 0.6, 1.2)} />
    </Shot>
  );
};

/** Back on the street: Slavoski frowns at the needle wandering round the dial. */
const COLD_HERO: V3 = [16.4, 0, 8];
const coldStreet: ShotFn = (c) => {
  const cam = move({ position: add(COLD_HERO, [-2.2, 4.0, 9.6]), target: add(COLD_HERO, [0, 3.35, 0]) }, { position: add(COLD_HERO, [-1.7, 3.9, 8.4]), target: add(COLD_HERO, [0, 3.35, 0]) }, c);
  const tilt = Math.sin(c.lt * 2.2) * 0.12;
  const { pose, compass } = compassStance(COLD_HERO, { expression: c.lt > 0.6 ? "worried" : "neutral", headRoll: tilt, headYaw: 0.08 });
  return (
    <Shot mood="day" camera={cam} fog={[60, 420]} shadowSize={14} keyDir={MORNING_KEY}>
      <BigStreet seed="hook" day lamps={false} />
      <Sky t={c.t} tint="day" seed="hook" />
      <Walkers t={c.t} list={[{ x: -16, z: -30, dir: 1, seed: 3 }, { x: 18.5, z: -40, dir: 1, seed: 7 }, { x: -18, z: 10, dir: -1, seed: 11 }]} />
      <Driving t={c.t} lane={-1.7} z0={-30} speed={4} color={P.carTeal} />
      <Hero pose={pose} position={COLD_HERO} />
      <Compass position={compass} rotation={[0.55, 0, 0]} heading={heading(c)} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 absolutely nothing (sunny morning)

const C1_HERO: V3 = [16.2, 0, 2];
const cupWalk = (phase: number, amount = 1): Pose => mergePose(walkPose(phase, amount), { rShoulder: [0.55, 0.12], rElbow: 1.45 });

const c1Street: ShotFn = (c) => {
  const cam = move({ position: [4.5, 3.6, 30], target: [15, 3.4, 4] }, { position: [5.5, 3.5, 28], target: [15.2, 3.4, 5] }, c);
  const hero: V3 = [C1_HERO[0], 0, C1_HERO[2] + c.lt * 2.2];
  const pose = cupWalk(c.lt * 1.5, 0.8);
  return (
    <Shot mood="day" camera={cam} fog={[60, 420]} shadowSize={30} keyDir={MORNING_KEY}>
      <BigStreet seed="morning" day lamps={false} />
      <Sky t={c.t} tint="day" seed="morning" />
      <Walkers t={c.lt} list={[{ x: 19.5, z: -24, dir: 1, seed: 21 }, { x: -15.5, z: -10, dir: -1, seed: 22 }, { x: -18.5, z: -40, dir: 1, seed: 23 }, { x: 14, z: -60, dir: 1, seed: 24 }]} />
      <Driving t={c.lt} lane={1.7} z0={-60} speed={9} color={P.carRed} />
      <Driving t={c.lt} lane={-1.7} z0={8} speed={-7} color="#E8E4DA" />
      <Hero pose={pose} position={hero} />
      <CoffeeCup position={inFront(pose, hero, 0, 0.3, 0.12)} />
      <Bird kind="pigeon" position={[19.5, 0, 12]} yaw={-0.8} peck={Math.abs(Math.sin(c.lt * 4))} />
    </Shot>
  );
};

/** "Absolutely nothing": he stops, shrugs with a smile; a pigeon pecks on, unbothered. */
const c1Shrug: ShotFn = (c) => {
  const hero: V3 = [16.2, 0, 6];
  const cam = move({ position: add(hero, [-2.6, 3.2, 9.5]), target: add(hero, [0, 2.5, 0]) }, { position: add(hero, [-2.0, 3.1, 8.4]), target: add(hero, [0, 2.55, 0]) }, c);
  const s = k01(c.lt, 0.25, 0.65);
  const pose = mergePose(REST, {
    rShoulder: [0.55, 0.12 + 0.3 * s],
    rElbow: 1.45,
    lShoulder: [0.3 * s + 0.05, 0.12 + 0.75 * s],
    lElbow: 0.15 + 1.2 * s,
    headRoll: 0.16 * s,
    expression: c.lt > 0.3 ? "smile" : "neutral",
    headYaw: -0.1,
  });
  return (
    <Shot mood="day" camera={cam} fog={[60, 420]} shadowSize={14} keyDir={MORNING_KEY}>
      <BigStreet seed="morning" day lamps={false} />
      <Sky t={c.t} tint="day" seed="morning" />
      <Walkers t={c.t - 8} list={[{ x: -16, z: -20, dir: 1, seed: 31 }, { x: 19, z: -50, dir: 1, seed: 32 }]} />
      <Hero pose={pose} position={hero} />
      <CoffeeCup position={inFront(pose, hero, 0, 0.3, 0.12)} />
      <Bird kind="pigeon" position={[18.2, 0, 8.6]} yaw={-1.2} peck={Math.abs(Math.sin(c.lt * 5))} scale={1.1} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 the shield is down (space)

/** Crane up from the street into the sky: "thousands of kilometres above you". */
const c2Up: ShotFn = (c) => {
  const hero: V3 = [16.2, 0, 8];
  const k = clamp01(c.lt / span(c.dur));
  const s = k * k * (3 - 2 * k);
  const cam: CameraSpec = {
    position: [10.5, 2.4 + s * 2.2, 22 - s * 4],
    target: [15.5, 3.4 + s * 56, 6 - s * 46],
  };
  const pose = mergePose(REST, { headPitch: 0.65, rShoulder: [0.55, 0.12], rElbow: 1.45, expression: "neutral" });
  return (
    <Shot mood="day" camera={cam} fog={[60, 480]} shadowSize={20} keyDir={MORNING_KEY}>
      <BigStreet seed="morning" day lamps={false} />
      <Sky t={c.t} tint="day" seed="up" y={55} radius={120} count={22} />
      <Plane position={[-30 + c.lt * 16, 62, -40]} rotation={[0, Math.PI / 2, 0]} scale={2.5} t={c.t} />
      <Hero pose={pose} position={hero} />
      <CoffeeCup position={inFront(pose, hero, 0, 0.3, 0.12)} />
    </Shot>
  );
};

/** Earth without its shield: only a faint memory of the loops, and the wind pouring straight in. */
const Naked: React.FC<{ t: number; ghost?: number; hits?: number; wind?: number; count?: number }> = ({ t, ghost = 1, hits = 1, wind = 1, count = 460 }) => (
  <group>
    <Earth t={t} />
    {ghost > 0.02 ? <FieldLines t={t} ghost on={1} /> : null}
    {wind > 0 ? <SolarWind t={t} shield={0} count={count} width={14} /> : null}
    <AtmoHits t={t} amount={hits} />
  </group>
);

const c2Orbit: ShotFn = (c) => {
  const cam = move({ position: [-4, 5, 30], target: [0, 1, 0] }, { position: [-6, 6, 34], target: [0, 1.2, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={SPACE_KEY}>
      <SunAbove t={c.t} x={6} />
      <Naked t={c.t} hits={0.6} />
    </Shot>
  );
};

/** The Sun, spraying charged particles down toward the camera. */
const c2Sun: ShotFn = (c) => {
  const cam = move({ position: [0, -16, 34], target: [0, 5, 0] }, { position: [1.5, -14, 30], target: [0, 5.5, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={[0, 1, 0.3]}>
      <Sun position={[0, 9, -6]} radius={5.5} t={c.t} />
      <group position={[0, 9, -6]}>
        <SolarWind t={c.t} shield={0} R={0.1} count={520} width={5} top={0} bottom={-50} speed={14} length={1.4} seed="sunwind" />
      </group>
    </Shot>
  );
};

/** Close on the top of the atmosphere: particles striking it in flashes. */
const c2Hit: ShotFn = (c) => {
  const cam = move({ position: [3, 7.5, 9.5], target: [0, 2.2, 0] }, { position: [2.4, 6.8, 8.4], target: [0, 2.3, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={SPACE_KEY}>
      <Earth t={c.t} />
      <SolarWind t={c.t} shield={0} count={520} width={5} top={20} bottom={-6} speed={12} length={0.7} seed="hitwind" />
      <AtmoHits t={c.t} amount={1} count={220} />
    </Shot>
  );
};

/** A satellite peppered with particles: sparks on its wings, the status light flickering. */
const Sparks: React.FC<{ t: number; amount: number; seed: string; spread?: [number, number, number] }> = ({ t, amount, seed, spread = [6, 0.6, 0.6] }) => (
  <group>
    {Array.from({ length: 14 }, (_, i) => {
      const f = Math.max(0, Math.sin(t * (6 + random(`${seed}r${i}`) * 9) + random(`${seed}p${i}`) * 9)) ** 10 * amount;
      if (f < 0.05) return null;
      const p: V3 = [(random(`${seed}x${i}`) - 0.5) * 2 * spread[0], (random(`${seed}y${i}`) - 0.5) * 2 * spread[1], (random(`${seed}z${i}`) - 0.5) * 2 * spread[2]];
      return (
        <group key={i} position={p}>
          <mesh scale={0.12 + f * 0.18}>
            <IcoG args={[1, 0]} />
            <Glow color="#E8FFF4" fog={false} />
          </mesh>
          <Halo size={1.6 * f} color="#9CFFC0" opacity={0.8} />
        </group>
      );
    })}
  </group>
);

const c2Sat: ShotFn = (c) => {
  const cam = move({ position: [8, 3.4, 12], target: [0, 0.2, 0] }, { position: [7, 3.0, 10.5], target: [0, 0.2, 0] }, c);
  const flick = Math.floor(c.t * 9) % 4 === 0 ? 0.3 : 1;
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.7} keyDir={SPACE_KEY}>
      <Limb t={c.t} y={-72} />
      <Satellite kind="comms" on={flick} t={c.t} rotation={[0.15, -0.5 + c.lt * 0.1, 0.08]} />
      <Sparks t={c.t} amount={1} seed="sat1" />
      <SolarWind t={c.t} shield={0} R={0.1} count={260} width={9} top={20} bottom={-20} speed={18} length={1.2} seed="satwind" />
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 radiation

const c3Station: ShotFn = (c) => {
  const cam = move({ position: [12, 5, 30], target: [0, 0, 0] }, { position: [10, 4.4, 26], target: [0, 0, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.75} keyDir={SPACE_KEY}>
      <Limb t={c.t} y={-75} />
      <SpaceStation t={c.t} rotation={[0.25, -0.5, 0.05]} alarm={1} />
      <SolarWind t={c.t} shield={0} R={0.1} count={320} width={16} top={26} bottom={-24} speed={18} length={1.4} seed="stwind" />
    </Shot>
  );
};

/** Astronaut Slavoski on a spacewalk by the truss: particles zipping past, an alarm on the station. */
const c3Astro: ShotFn = (c) => {
  const astro: V3 = [0, -2.4, 0];
  const cam = move({ position: [1.4, 1.2, 11.5], target: [0, 0.9, 0] }, { position: [1.1, 1.1, 10.2], target: [0, 0.95, 0] }, c);
  const pose = mergePose(REST, {
    lShoulder: [0.6, 0.5],
    rShoulder: [0.2, 0.3],
    lElbow: 1.0,
    rElbow: 0.6,
    lHip: [0.25, 0.08],
    rHip: [-0.1, 0.08],
    lKnee: 0.5,
    rKnee: 0.15,
    headPitch: 0.25,
    headYaw: 0.35 + Math.sin(c.lt * 3) * 0.12,
    expression: "alarm",
  });
  const drift: V3 = [astro[0], astro[1] + Math.sin(c.t * 0.9) * 0.1, astro[2]];
  const head = headPosition(pose, drift, 0.2);
  const alarm = Math.floor(c.t * 4) % 2 === 0;
  return (
    <Shot
      mood="space"
      camera={cam}
      fog={false}
      shadows={false}
      light={0.75}
      keyDir={[0.6, 0.8, 0.6]}
      overlay={<CardLine text="RADIATION ALERT" y={330} appearFrame={startFrame(c) + 6} accent="#FF5A4A" />}
    >
      <Limb t={c.t} y={-80} />
      <group position={[-4.5, 8.5, -14]} rotation={[0.1, 0.5, 0.05]} scale={0.8}>
        <SpaceStation t={c.t} alarm={1} />
      </group>
      <group position={drift} rotation={[0, 0.2, 0]}>
        <mesh position={[0, 2.25, -0.65]}>
          <BoxG args={[1.3, 1.6, 0.6]} />
          <Flat color="#C9D2DE" />
        </mesh>
        <mesh position={[0.45, 2.75, -0.95]}>
          <IcoG args={[0.09, 1]} />
          <Glow color={alarm ? "#FF3A2A" : "#401010"} fog={false} />
        </mesh>
      </group>
      {alarm ? <Halo position={[drift[0] + 0.45, drift[1] + 2.75, drift[2] - 1.0]} size={1.4} color="#FF3A2A" opacity={0.7} /> : null}
      <Hero pose={pose} position={drift} yaw={0.2} look={SPACESUIT} />
      <Helmet head={head} />
      <group position={[0, 0, -6]}>
        <SolarWind t={c.t} shield={0} R={0.1} count={160} width={10} top={16} bottom={-16} speed={16} length={1.0} seed="astrowind" depth={3} />
      </group>
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 solar storm

/** The Sun erupts: a prominence leaps and a burst races out (toward Earth, down). */
const c4Flare: ShotFn = (c) => {
  const cam = move({ position: [0, -6, 26], target: [0, 4, 0] }, { position: [1, -5, 22], target: [0, 4, 0] }, c);
  const flare = k01(c.lt, 0.1, 1.5);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={[0, 1, 0.3]} shake={0.25 * Math.sin(Math.PI * clamp01((c.lt - 0.1) / 0.9))}>
      <Sun position={[0, 6, -4]} radius={5.5} t={c.t} flare={flare} />
      <group position={[0, 6, -4]}>
        <SolarWind t={c.t} shield={0} R={0.1} count={700} width={5 + flare * 5} top={0} bottom={-50} speed={22} length={1.6} seed="flarewind" />
      </group>
    </Shot>
  );
};

/** The storm front hits an unshielded Earth: the atmosphere lights up. */
const c4Wave: ShotFn = (c) => {
  const cam = move({ position: [-6, 4, 30], target: [0, 2, 0] }, { position: [-5, 3.4, 26], target: [0, 1.8, 0] }, c);
  const front = 26 - c.lt * 22; // y of the burst front
  const hit = clamp01((4 - front) / 4) * clamp01(1 - (c.lt - 1.6) / 1.2);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={SPACE_KEY} shake={hit > 0.1 ? 0.14 * hit : 0}>
      <Earth t={c.t} />
      <SolarWind t={c.t} shield={0} count={700} width={14} speed={26} length={1.5} seed="stormwind" top={Math.min(34, front + 30)} bottom={-30} />
      <AtmoHits t={c.t} amount={0.5 + hit * 1.5} count={240} color="#FFD8A0" />
      {front > -8 ? (
        <mesh position={[0, front + 16, 0]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[16, 18, 4, 0, Math.PI * 2, 0, Math.PI * 0.32]} />
          <meshBasicMaterial color="#FFC060" transparent opacity={0.32} blending={2} depthWrite={false} side={2} toneMapped={false} fog={false} />
        </mesh>
      ) : null}
      {hit > 0.05 ? <Halo position={[0, 3.3, 0]} size={14 * hit} color="#FFC890" opacity={0.6 * hit} /> : null}
    </Shot>
  );
};

/** Satellites hit by the storm: sparks, lights going red, one tumbling dark. */
const c4Sats: ShotFn = (c) => {
  const cam = move({ position: [3, 4, 26], target: [0, 1, -6] }, { position: [2.5, 3.6, 23], target: [0, 1, -6] }, c);
  const die = k01(c.lt, 0.3, 1.0);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.7} keyDir={SPACE_KEY}>
      <Limb t={c.t} y={-74} />
      <group position={[0, 0, 0]} rotation={[0.3 + die * c.lt * 0.6, -0.4 + die * c.lt * 0.8, 0.1]}>
        <Satellite kind="gps" on={die > 0.5 ? 0 : 1 - die} t={c.t} />
        <Sparks t={c.t} amount={1 - die * 0.7} seed="st1" />
      </group>
      <group position={[-8, 5, -16]} rotation={[0.6, 1.2, 0.2]}>
        <Satellite kind="weather" on={0.3} t={c.t} />
        <Sparks t={c.t + 3} amount={1} seed="st2" />
      </group>
      <group position={[9, -2, -22]} rotation={[-0.2, -0.9, 0.4]}>
        <Satellite kind="comms" on={Math.floor(c.t * 7) % 3 === 0 ? 0.3 : 1} t={c.t} />
        <Sparks t={c.t + 7} amount={0.8} seed="st3" />
      </group>
      <SolarWind t={c.t} shield={0} R={0.1} count={420} width={20} top={26} bottom={-26} speed={24} length={1.5} seed="satstorm" />
    </Shot>
  );
};

/** A phone close-up in front of a backdrop, its screen an HTML overlay pinned to the 3D phone. */
const PhoneCU: React.FC<{ c: ShotCtx; at: V3; glow: string; screen: (w: number, h: number) => React.ReactNode; children: React.ReactNode; stage?: Partial<React.ComponentProps<typeof Stage>> }> = ({
  c,
  at,
  glow,
  screen,
  children,
  stage,
}) => {
  const cam = move({ position: [at[0] + 0.05, at[1], at[2] + 2.1], target: [at[0], at[1] - 0.02, at[2]] }, { position: [at[0] + 0.03, at[1], at[2] + 1.8], target: at }, c);
  return (
    <Shot
      mood="overcast"
      camera={cam}
      fog={false}
      stars={false}
      shadowSize={10}
      {...stage}
      overlay={
        <ScreenHtml c={[at[0], at[1], at[2] + PHONE.d / 2 + 0.003]} w={PHONE.screenW} h={PHONE.screenH} cam={cam} width={c.width} height={c.height}>
          {screen}
        </ScreenHtml>
      }
    >
      {children}
      <Phone3D position={at} glow={glow} />
      <mesh position={[at[0] + 0.04, at[1] - PHONE.h / 2 - 0.06, at[2] + 0.02]} scale={[1.1, 0.8, 0.9]}>
        <IcoG args={[0.22, 2]} />
        <Flat color={P.skin} />
      </mesh>
      <pointLight position={[at[0], at[1], at[2] + 1]} color={glow} intensity={4} distance={4} decay={2} />
    </Shot>
  );
};

const Overcast: React.FC<{ t: number; seed: string }> = ({ t, seed }) => (
  <group>
    <BigStreet seed={seed} day lamps={false} />
    <Sky t={t} tint="overcast" seed={seed} y={50} count={22} />
  </group>
);

const c4Phone: ShotFn = (c) => (
  <PhoneCU c={c} at={[16.5, 5.2, 14]} glow="#3A3F4E" stage={{ mood: "overcast", fog: [20, 200], light: 0.9 }} screen={(w, h) => <NoService w={w} h={h} />}>
    <Overcast t={c.t} seed="storm" />
  </PhoneCU>
);

/** A big street screen showing static (drawn on a canvas so heads can pass in front). */
const drawStatic = (t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#14161E";
  ctx.fillRect(0, 0, W, H);
  const f = Math.floor(t * 15);
  for (let i = 0; i < 260; i++) {
    const v = Math.floor(80 + random(`st${f}v${i}`) * 150);
    ctx.fillStyle = `rgb(${v},${v},${v + 10})`;
    ctx.fillRect(random(`st${f}x${i}`) * W, random(`st${f}y${i}`) * H, W * 0.05, H * 0.02);
  }
  ctx.fillStyle = "rgba(10,12,20,0.75)";
  ctx.fillRect(W * 0.18, H * 0.38, W * 0.64, H * 0.24);
  ctx.fillStyle = "#FFBA58";
  ctx.font = `700 ${Math.round(H * 0.13)}px "Slavoski Sans", "DejaVu Sans", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("NO SIGNAL", W / 2, H / 2);
};

/** Slavoski holds his phone up hunting for signal; a street screen behind him shows static. */
const C4_HERO: V3 = [15.8, 0, 6];
const c4Signal: ShotFn = (c) => {
  const cam = move({ position: add(C4_HERO, [-3.2, 2.8, 13.5]), target: add(C4_HERO, [0.6, 4.9, 0]) }, { position: add(C4_HERO, [-2.8, 2.8, 12.2]), target: add(C4_HERO, [0.6, 5.0, 0]) }, c);
  const wave = Math.sin(c.lt * 3.2) * 0.12;
  const pose = mergePose(REST, { rShoulder: [0.55, 2.2 + wave], rElbow: 0.5, lShoulder: [0.1, 0.2], headPitch: 0.5, headYaw: -0.25, expression: "worried" });
  const hp = handPosition(pose, "r", C4_HERO);
  return (
    <Shot mood="overcast" camera={cam} fog={[30, 300]} shadowSize={16} light={0.95}>
      <Overcast t={c.t} seed="storm" />
      <group position={[19.5, 0, -12]} rotation={[0, -0.3, 0]}>
        <mesh position={[0, 9, -0.3]}>
          <BoxG args={[10.4, 6.4, 0.5]} />
          <Flat color="#1E222E" />
        </mesh>
        <CanvasPanel position={[0, 9, 0.0]} w={9.6} h={5.6} px={640} draw={drawStatic(c.t)} />
        <mesh position={[0, 3, -0.3]}>
          <BoxG args={[0.6, 6, 0.6]} />
          <Flat color={P.pole} />
        </mesh>
      </group>
      <Hero pose={pose} position={C4_HERO} />
      <Phone3D position={[hp[0], hp[1] + 0.22 + PHONE.h / 2 - 0.12, hp[2]]} rotation={[0.2, Math.PI - 0.4, 0]} glow="#3A3F4E" />
      {[
        [-15.8, 0, -4, 0.4],
        [-17.5, 0, -14, -0.2],
      ].map(([x, y, z, yaw], i) => (
        <Hero key={i} pose={mergePose(REST, { headPitch: -0.45, rShoulder: [0.9, 0.1], rElbow: 1.3, expression: "worried" })} position={[x, y, z]} yaw={yaw} look={crowdLook(40 + i)} />
      ))}
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 the long game (sunset)

const C5_HERO: V3 = [16, 0, 6];
const c5Face: ShotFn = (c) => {
  const head = headPosition(REST, C5_HERO);
  const cam = move({ position: add(head, [0.8, 0.1, 7.4]), target: add(head, [0, -0.45, 0]) }, { position: add(head, [0.5, 0.05, 5.8]), target: add(head, [0, -0.4, 0]) }, c);
  const pose = mergePose(REST, { expression: c.lt > 0.5 ? "alarm" : "worried", headPitch: 0.05 + k01(c.lt, 0.4, 0.8) * 0.12, headYaw: -0.1 });
  return (
    <Shot mood="sunset" camera={cam} fog={[40, 300]} shadowSize={8} keyDir={[0.9, 0.3, 0.4]}>
      <BigStreet seed="sunset" lampsOn modify={() => ({ power: 0.6 })} />
      <Sky t={c.t} tint="sunset" seed="sunset" />
      <Hero pose={pose} position={C5_HERO} />
    </Shot>
  );
};

const c5Field: ShotFn = (c) => {
  const cam = move({ position: [0, 2, 44], target: [0, 1, 0] }, { position: [-3, 2.5, 40], target: [0, 1, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={SPACE_KEY}>
      <SunAbove t={c.t} />
      <ShieldScene t={c.t} />
    </Shot>
  );
};

/** "Doesn't just protect technology": pylons, a power station and towers at sunset. */
const c5Tech: ShotFn = (c) => {
  const cam = move({ position: [36, 9, 58], target: [0, 9, 0] }, { position: [32, 8.5, 52], target: [0, 9.5, 0] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[70, 420]} shadowSize={50} keyDir={[0.9, 0.3, 0.4]}>
      <Ground color="#4E5A40" />
      <HillRing color="#3A4A44" radius={240} />
      <Sky t={c.t} tint="sunset" seed="tech" />
      <group scale={2.2} position={[-14, 0, -22]}>
        <PowerStation t={c.t} />
      </group>
      <Pylon position={[10, 0, -6]} h={26} />
      <Pylon position={[34, 0, 8]} h={26} />
      <Pylon position={[-34, 0, -26]} h={26} />
      <CellTower position={[22, 0, -30]} h={30} t={c.t} />
      <TownLights position={[0, 2, -200]} width={260} count={160} />
    </Shot>
  );
};

/** Geological time: Earth spinning fast while its field holds the wind off. */
const c5Ages: ShotFn = (c) => {
  const cam = move({ position: [6, 3, 40], target: [0, 1, 0] }, { position: [4, 2.5, 36], target: [0, 1, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={SPACE_KEY} overlay={<CardLine text="MILLIONS OF YEARS" y={330} appearFrame={startFrame(c) + 4} />}>
      <SunAbove t={c.t} x={-4} />
      <group rotation={[0.3, 0, -Math.PI / 2 + 0.35]}>
        <FacetedEarth radius={3} rotation={[0, c.t * 6, 0]} />
      </group>
      <FieldLines t={c.t} />
      <ShieldBubble />
      <SolarWind t={c.t * 3} shield={1} count={460} width={16} />
    </Shot>
  );
};

/** Mars, with no global shield: the solar wind strips its thin air away. */
const c5Mars: ShotFn = (c) => {
  const cam: CameraSpec = move({ position: [0, 1, 20], target: [0, 0.4, 0] }, { position: [1.5, 1.2, 17.5], target: [0, 0.4, 0] }, c);
  return (
    <Shot
      mood="space"
      camera={cam}
      fog={false}
      shadows={false}
      light={0.7}
      keyDir={SPACE_KEY}
      overlay={
        <Pinned at={[0, 3.9, 0]} cam={cam} width={c.width} height={c.height}>
          <div style={{ fontFamily: '"Slavoski Sans", "DejaVu Sans", sans-serif', textAlign: "center", color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>
            <div style={{ fontWeight: 700, fontSize: 46, letterSpacing: "0.2em" }}>MARS</div>
            <div style={{ fontSize: 22, letterSpacing: "0.14em", opacity: 0.75, marginTop: 6 }}>NO GLOBAL SHIELD</div>
          </div>
        </Pinned>
      }
    >
      <SunAbove t={c.t} y={24} z={-20} />
      <RedPlanet radius={2.4} t={c.t} rotation={[0.3, c.t * 0.1, 0]} />
      <SolarWind t={c.t} shield={0} R={2.4} count={360} width={8} top={22} bottom={-16} speed={14} length={1.0} seed="marswind" />
    </Shot>
  );
};

/** Earth's shield turning the solar wind aside, the long way round. */
const c5Wind: ShotFn = (c) => {
  const cam = move({ position: [9, 16, 20], target: [0, 7, 0] }, { position: [6, 14.5, 23], target: [0, 6, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={SPACE_KEY}>
      <SunAbove t={c.t} x={2} />
      <ShieldScene t={c.t} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 06 still breathing (night)

/** Earth's blue air still wrapped round it, the wind beating on it in vain. */
const c6Air: ShotFn = (c) => {
  const cam = move({ position: [0, 3, 17], target: [0, 0.3, 0] }, { position: [1.5, 2.5, 14], target: [0, 0.3, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={SPACE_KEY} overlay={<CardLine text="THE AIR STAYS" y={330} appearFrame={startFrame(c) + 20} accent="#7FD6FF" />}>
      <Earth t={c.t} lights={0.5} />
      <mesh>
        <sphereGeometry args={[3.25, 24, 12]} />
        <meshBasicMaterial color="#4F9BFF" transparent opacity={0.14} blending={2} depthWrite={false} toneMapped={false} fog={false} />
      </mesh>
      <Halo size={10} color="#4F9BFF" opacity={0.35} />
      <SolarWind t={c.t} shield={0} count={300} width={8} top={22} speed={10} seed="airwind" />
      <AtmoHits t={c.t} amount={0.5} />
    </Shot>
  );
};

/** A back garden at night: house with a porch light, fence, trees, stars. */
const BACKYARD_HERO: V3 = [0, 0, 4];
const Backyard: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <Ground color="#2E4A34" />
    <GrassTufts area={[-30, -20, 30, 20]} count={500} growth={1} seed="yard" />
    <House position={[0, 0, -16]} scale={2} lit />
    <Fence x0={-22} x1={22} z={-4} />
    <LeafyTree position={[-15, 0, -2]} scale={2.2} seed="y1" />
    <LeafyTree position={[17, 0, -8]} scale={2.6} seed="y2" />
    <Bush position={[-7, 0, -2.5]} size={1.4} seed="yb1" />
    <Bush position={[9, 0, -2.2]} size={1.2} seed="yb2" />
    <HillRing color="#16241E" radius={200} />
    <TownLights position={[0, 1, -170]} width={300} count={120} seed="yardtown" />
    <mesh position={[4.2, 8.4, -8.6]}>
      <BoxG args={[0.6, 0.5, 0.4]} />
      <Glow color={P.lampGlow} />
    </mesh>
    <Halo position={[4.2, 8.4, -8.3]} size={6} color={P.lampGlow} opacity={0.55} />
    <pointLight position={[4.2, 8, -7]} color={P.lampGlow} intensity={60} distance={30} decay={1.6} />
    <Aurora t={t} position={[0, 50, -220]} opacity={0.35} />
  </group>
);

const c6Breath: ShotFn = (c) => {
  const hero = BACKYARD_HERO;
  const cam = move({ position: add(hero, [-2.5, 3.6, 10]), target: add(hero, [0, 2.9, 0]) }, { position: add(hero, [-2.0, 3.5, 8.8]), target: add(hero, [0, 2.95, 0]) }, c);
  const b = k01(c.lt, 0.05, 0.7);
  const pose = mergePose(REST, {
    lShoulder: [0.1, 0.12 + 1.1 * b],
    rShoulder: [0.1, 0.12 + 1.1 * b],
    lElbow: 0.15 + 0.3 * b,
    rElbow: 0.15 + 0.3 * b,
    lean: -0.08 * b,
    headPitch: 0.25 * b,
    blink: b > 0.5 ? 1 : 0,
    expression: "relief",
  });
  return (
    <Shot mood="night" camera={cam} fog={[40, 260]} shadowSize={14} light={0.75}>
      <Backyard t={c.t} />
      <Hero pose={pose} position={hero} />
    </Shot>
  );
};

/** "…burn alive": sunscreen under the porch light at night, then the penny drops. */
const c6Sunscreen: ShotFn = (c) => {
  const hero: V3 = [1, 0, 5];
  const cam = move({ position: add(hero, [2.4, 3.4, 9]), target: add(hero, [0, 2.7, 0]) }, { position: add(hero, [2.0, 3.3, 7.8]), target: add(hero, [0, 2.75, 0]) }, c);
  const rub = c.lt < 1.2;
  const sweep = Math.sin(c.lt * 9) * 0.12;
  const look = k01(c.lt, 1.2, 1.5);
  const pose = mergePose(REST, {
    lShoulder: [0.9 - look * 0.6, -0.15],
    lElbow: 0.5 + look * 0.4,
    rShoulder: rub ? [0.75 + sweep, -0.05] : [0.35, 0.15],
    rElbow: rub ? 1.25 : 1.2,
    headPitch: rub ? -0.35 : 0.5 * look,
    headYaw: rub ? 0.15 : 0,
    expression: rub ? "neutral" : "smile",
  });
  return (
    <Shot mood="night" camera={cam} fog={[40, 260]} shadowSize={14} light={0.75}>
      <Backyard t={c.t} />
      <Hero pose={pose} position={hero} />
      <Sunscreen position={inFront(pose, hero, 0, 0.32, 0.1)} rotation={[0.3, 0, rub ? -0.6 : 0]} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 07 exposed (night → dawn)

/** The hilltop: grass, pines, a town far off, the aurora. */
const HILL_HERO: V3 = [0, 0.55, 0];
const Hill: React.FC<{ t: number; aurora?: number; dawn?: boolean }> = ({ t, aurora = 0.6, dawn = false }) => (
  <group>
    <Ground color={dawn ? "#4A6A44" : "#22382A"} />
    <GrassTufts area={[-25, -25, 25, 25]} count={700} growth={1} seed="hill" />
    {[
      [-14, -10, 2.6],
      [12, -16, 3.0],
      [-22, -26, 3.4],
      [20, -30, 2.8],
      [-6, -34, 3.2],
    ].map(([x, z, s], i) => (
      <PineTree key={i} position={[x, 0, z]} scale={s} />
    ))}
    <HillRing color={dawn ? "#3E5A4A" : "#121E1A"} radius={220} />
    <TownLights position={[30, 1, -190]} width={220} count={dawn ? 40 : 160} seed="hilltown" />
    {aurora > 0 && !dawn ? <Aurora t={t} position={[0, 46, -200]} opacity={aurora} /> : null}
  </group>
);

/** Slavoski lying on his back in the grass (rotated rig; head toward −z). */
const Lying: React.FC<{ pose: Pose }> = ({ pose }) => (
  <group position={HILL_HERO} rotation={[-Math.PI / 2, 0, 0]}>
    <Hero pose={pose} />
  </group>
);
const lyingPose = (over: Partial<Pose> = {}) => mergePose(REST, { headPitch: -0.12, lShoulder: [0, 0.35], rShoulder: [0, 0.35], ...over });

const c7Lie: ShotFn = (c) => {
  const cam = move({ position: [2.8, 4.6, 4.2], target: [0, 0.5, -2.3] }, { position: [2.4, 4.1, 3.6], target: [0, 0.5, -2.3] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[30, 240]} shadowSize={10} light={0.7}>
      <Hill t={c.t} />
      <GrassTufts area={[-6, -9, 6, 4]} count={420} growth={1} seed="liegrass" height={0.55} />
      <Lying pose={lyingPose({ expression: "awe" })} />
    </Shot>
  );
};

/** Looking up: stars and a faint aurora rippling across the whole sky, pines at the edges. */
const c7Sky: ShotFn = (c) => {
  const cam = move({ position: [0, 1.6, 6], target: [0, 70, -120] }, { position: [0, 1.6, 6], target: [3, 80, -120] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} shadowSize={10} light={0.5}>
      <Hill t={c.t} aurora={0.9} />
      <Aurora t={c.t + 3} position={[20, 70, -120]} width={260} height={50} bend={40} opacity={0.6} seed="au2" yaw={0.3} />
      <PineTree position={[-9, 0, -8]} scale={3.6} />
      <PineTree position={[10, 0, -12]} scale={4} />
    </Shot>
  );
};

/** "One of Earth's greatest natural defences had vanished": the memory of the loops fading away. */
const c7Naked: ShotFn = (c) => {
  const cam = move({ position: [5, 4, 30], target: [0, 1, 0] }, { position: [7, 5, 36], target: [0, 1, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.6} keyDir={SPACE_KEY}>
      <SunAbove t={c.t} x={-5} />
      <Naked t={c.t} ghost={1 - k01(c.lt, 1.2, 2.2)} hits={0.9} />
    </Shot>
  );
};

/** Time-lapse on the hill: Slavoski asleep, the stars wheeling overhead, the aurora rippling. */
const c7Lapse: ShotFn = (c) => {
  const cam = move({ position: [15, 3.0, 15], target: [0, 2.2, -5] }, { position: [14, 2.9, 14], target: [0, 2.3, -5] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} shadowSize={14} light={0.6} stars={false}>
      <Hill t={c.t * 8} aurora={0.8} />
      <group rotation={[0.3, 0, c.lt * 0.35]}>
        <Stars opacity={0.8} seed="lapse" />
      </group>
      <GrassTufts area={[-6, -9, 6, 4]} count={420} growth={1} seed="liegrass" height={0.55} />
      <Lying pose={lyingPose({ blink: 1, expression: "neutral", headYaw: 0.3 })} />
    </Shot>
  );
};

const c7Exposed: ShotFn = (c) => {
  const cam = move({ position: [-3, 2, 22], target: [0, 1.5, 0] }, { position: [-8, 5, 40], target: [0, 0.5, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.6} keyDir={SPACE_KEY}>
      <SunAbove t={c.t} />
      <Naked t={c.t} ghost={0} hits={1.2} count={640} />
    </Shot>
  );
};

/** Dawn, 24 hours on: the loops spring back and the bubble re-forms; the wind turns aside again. */
const c7Return: ShotFn = (c) => {
  const cam = move({ position: [6, 2, 40], target: [0, 1.5, 0] }, { position: [3, 2, 36], target: [0, 1.5, 0] }, c);
  const on = k01(c.lt, 0.25, 0.9);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.85} keyDir={SPACE_KEY}>
      <SunAbove t={c.t} x={-2} />
      <Earth t={c.t} />
      <FieldLines t={c.t} on={on} />
      <ShieldBubble on={on} />
      <SolarWind t={c.t} shield={on} count={460} width={16} />
      <AtmoHits t={c.t} amount={1 - on} />
      {on > 0 && on < 1 ? <Halo position={[0, 0, 0]} size={30 * on} color="#9FE8FF" opacity={0.5 * (1 - on)} /> : null}
    </Shot>
  );
};

/** The compass at dawn: the needle swings home and settles on north. */
const c7Compass: ShotFn = (c) => {
  const at: V3 = [0.6, 3.2, 6];
  const cam = move({ position: add(at, [0.12, 0.92, 1.5]), target: add(at, [0, 0.02, 0]) }, { position: add(at, [0.08, 0.8, 1.28]), target: add(at, [0, 0.02, 0]) }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[40, 300]} shadowSize={6} keyDir={[0.8, 0.35, -0.5]}>
      <Hill t={c.t} dawn />
      <Sky t={c.t} tint="dawn" seed="dawn" y={40} />
      <PalmCompass at={at} heading={heading(c)} />
    </Shot>
  );
};

/** Sunrise: he stretches, pockets the compass and strolls off, none the wiser. */
const c7Walk: ShotFn = (c) => {
  const cam = move({ position: [6, 3.0, 18], target: [0, 3.0, 0] }, { position: [5, 3.2, 16], target: [0, 3.4, -3] }, c);
  const stretch = k01(c.lt, 0.0, 0.5) * (1 - k01(c.lt, 1.0, 1.4));
  const walking = c.lt > 1.3;
  const wt = Math.max(0, c.lt - 1.3);
  const yaw = walking ? Math.PI - 0.5 * k01(c.lt, 1.3, 1.6) : 0.2;
  const base = walking ? walkPose(wt * 1.5, 0.8) : REST;
  const pose = mergePose(base, walking ? { expression: "smile" } : {
    lShoulder: [0.1, 0.12 + 2.3 * stretch],
    rShoulder: [0.1, 0.12 + 2.3 * stretch],
    lElbow: 0.15 + 0.4 * stretch,
    rElbow: 0.15 + 0.4 * stretch,
    headPitch: 0.25 * stretch,
    blink: stretch > 0.5 ? 1 : 0,
    expression: stretch > 0.3 ? "relief" : "smile",
  });
  const pos: V3 = [Math.sin(yaw) * wt * 2.2, 0, 2 + Math.cos(yaw) * wt * 2.2];
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 360]} shadowSize={20} keyDir={[0.8, 0.35, -0.5]}>
      <Hill t={c.t} dawn />
      <Sky t={c.t} tint="dawn" seed="dawnwide" y={40} />
      <mesh position={[60, 18, -260]}>
        <circleGeometry args={[9, 16]} />
        <Glow color="#FFE8C0" fog={false} />
      </mesh>
      <Halo position={[60, 18, -258]} size={110} color="#FFC890" opacity={0.6} />
      <Hero pose={pose} position={pos} yaw={yaw} />
    </Shot>
  );
};

// ---------------------------------------------------------------- thumbnail

/** Shorts cover: Earth with its shield shattering, the solar wind pouring in. */
export const thumbShot: ShotFn = () => (
  <Shot mood="space" camera={{ position: [7, 2.5, 30], target: [0, 0.2, 0] }} fog={false} shadows={false} light={0.85} keyDir={SPACE_KEY}>
    <SunAbove t={0} x={-3} />
    <ShieldScene t={1.2} on={0.25} shatter={0.32} wind={0.4} hits={0.8} />
  </Shot>
);

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldCompass },
    { cue: "shield", fn: coldShield },
    { cue: "disappeared", fn: coldGone },
    { cue: "we'd have", fn: coldStreet },
  ],
  c1: [
    { cue: null, fn: c1Street },
    { cue: "Absolutely", fn: c1Shrug },
  ],
  c2: [
    { cue: null, fn: c2Up },
    { cue: "everything", fn: c2Orbit },
    { cue: "Charged", fn: c2Sun },
    { cue: "interact", fn: c2Hit },
    { cue: "satellites differently", fn: c2Sat },
  ],
  c3: [
    { cue: null, fn: c3Station },
    { cue: "radiation", fn: c3Astro },
  ],
  c4: [
    { cue: null, fn: c4Flare },
    { cue: "storm", fn: c4Wave },
    { cue: "satellites and", fn: c4Sats },
    { cue: "systems", fn: c4Phone },
    { cue: "serious", fn: c4Signal },
  ],
  c5: [
    { cue: null, fn: c5Face },
    { cue: "Earth's magnetic", fn: c5Field },
    { cue: "protect technology", fn: c5Tech },
    { cue: "Over geological", fn: c5Ages },
    { cue: "it also influences", fn: c5Mars },
    { cue: "interacts", fn: c5Wind },
  ],
  c6: [
    { cue: null, fn: c6Air },
    { cue: "atmosphere disappear", fn: c6Breath },
    { cue: "and you wouldn't", fn: c6Sunscreen },
  ],
  c7: [
    { cue: null, fn: c7Lie },
    { cue: "sky", fn: c7Sky },
    { cue: "greatest", fn: c7Naked },
    { cue: "For twenty-four", fn: c7Lapse },
    { cue: "exposed", fn: c7Exposed },
    { cue: "And the scariest", fn: c7Return },
    { cue: "You might", fn: c7Compass },
    { cue: "realize", fn: c7Walk },
  ],
};
