/**
 * Shots for "What If Earth Suddenly Had a Second Moon?" (ep. 8).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * The hook does not start on Earth from space: Slavoski's shadow splits in two on a night street.
 */
import React from "react";
import { AbsoluteFill, random } from "remotion";
import * as THREE from "three";
import { Building, Car, CityGrid, Ground, PineTree, StreetSet } from "../../slavoski/city";
import { BoxG, CylG, IcoG } from "../../slavoski/detail";
import { Fireball, FloodWater, Meteor, Shockwave, SmokeCluster } from "../../slavoski/fx";
import { crowdLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Clouds, LightningBolt, Rain } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { CardLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import { Hero, mergePose, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { FacetedEarth, OrbitPath } from "../../slavoski/space";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import { type CuedShot } from "../../slavoski/timeline";
import { Arrow } from "../black-hole/props";
import { Observatory } from "../black-hole/props";
import { HillRing, Skyline } from "../no-work-2036/props";
import { GantryCrane, Lighthouse, Quay, Sea, Waves } from "../satellites-dark/props";
import { CITY } from "../ww3-countdown/props";
import {
  DebrisRing,
  Flash,
  Lab,
  labCoat,
  Moon,
  MoonBreakup,
  MoonGlints,
  RingWave,
  RockBurst,
  SkyMoon,
  SkyRing,
  Stoop,
  TideBulge,
  TideGauge,
  type MoonKind,
} from "./props";

export type ShotCtx = { lt: number; dur: number; t: number; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
const startFrame = (c: ShotCtx) => Math.round((c.t - c.lt) * 30);
const ASPECT = 1080 / 1920;

/** Kit street ×3.5 so it matches Slavoski (road |x| < 12.25, pavements to 21.35). */
const BigStreet: React.FC<React.ComponentProps<typeof StreetSet>> = (props) => (
  <group scale={CITY}>
    <StreetSet {...props} />
  </group>
);

const Shot: React.FC<{ children: React.ReactNode; overlay?: React.ReactNode } & React.ComponentProps<typeof Stage>> = ({ children, overlay, ...stage }) => (
  <AbsoluteFill>
    <Stage {...stage}>{children}</Stage>
    {overlay}
  </AbsoluteFill>
);

/** World point `dist` away from the camera along a screen direction (NDC, +y up). Sky objects sit there. */
const skyAt = (cam: CameraSpec, ndc: [number, number], dist: number): V3 => {
  const c = new THREE.PerspectiveCamera(cam.fov ?? 40, ASPECT, 0.1, 5000);
  c.position.set(...cam.position);
  c.up.set(...(cam.up ?? [0, 1, 0]));
  c.lookAt(...cam.target);
  c.updateMatrixWorld();
  const p = new THREE.Vector3(ndc[0], ndc[1], 0.5).unproject(c);
  return c.position.clone().addScaledVector(p.sub(c.position).normalize(), dist).toArray() as V3;
};
/** World radius for a sky object `dist` away whose diameter is `frac` of the frame height. */
const skyR = (cam: CameraSpec, frac: number, dist: number) => dist * Math.tan((((cam.fov ?? 40) * Math.PI) / 180) * frac * 0.5);
const awayFrom = (cam: CameraSpec, p: V3, d: number): V3 => {
  const v = new THREE.Vector3(...p).sub(new THREE.Vector3(...cam.position)).normalize();
  return [p[0] + v.x * d, p[1] + v.y * d, p[2] + v.z * d];
};

type MoonSpot = { kind: MoonKind; ndc: [number, number]; size: number; dist?: number; halo?: number; crack?: number; rot?: V3 };
/** Moons pinned to screen positions for a camera (use the shot's start camera so they stay put in the world). */
const SkyMoons: React.FC<{ cam: CameraSpec; spots: MoonSpot[] }> = ({ cam, spots }) => (
  <>
    {spots.map((s, i) => {
      const dist = s.dist ?? (s.kind === "moon" ? 440 : 400);
      const r = skyR(cam, s.size, dist);
      const p = skyAt(cam, s.ndc, dist);
      return <SkyMoon key={i} kind={s.kind} radius={r} position={p} haloAt={awayFrom(cam, p, r * 1.3)} halo={s.halo ?? 0.35} crack={s.crack} rotation={s.rot ?? [0.2, 0.6 + i, 0]} />;
    })}
  </>
);

/**
 * The second Moon's light: a warm key from another direction, so everything casts two shadows. It comes
 * steeply along the street (not across it), or the tall buildings on either side would shade the pavement.
 */
const SecondKey: React.FC<{ intensity: number; dir?: V3; size?: number }> = ({ intensity, dir = [-0.3, 0.75, 0.6], size = 32 }) => {
  if (intensity <= 0.001) return null;
  const l = Math.hypot(...dir);
  return (
    <directionalLight
      color="#FFD2AE"
      intensity={intensity}
      position={[(dir[0] / l) * 60, (dir[1] / l) * 60, (dir[2] / l) * 60]}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0004}
      shadow-normalBias={0.02}
      shadow-camera-left={-size}
      shadow-camera-right={size}
      shadow-camera-top={size}
      shadow-camera-bottom={-size}
      shadow-camera-near={1}
      shadow-camera-far={160}
    />
  );
};

const NIGHT_CLOUD = "#3A4466";
const lookUp = (k: number, over: Partial<Pose> = {}) => mergePose(REST, { headPitch: 0.62 * k, ...over });

/** A dotted orbit: an ellipse around `c` spanned by unit-ish vectors `u` and `v`. */
const ellipse = (c: V3, u: V3, v: V3, r: number, n = 120, from = 0, to = Math.PI * 2): V3[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / n;
    return [c[0] + r * (Math.cos(a) * u[0] + Math.sin(a) * v[0]), c[1] + r * (Math.cos(a) * u[1] + Math.sin(a) * v[1]), c[2] + r * (Math.cos(a) * u[2] + Math.sin(a) * v[2])];
  });
const onEllipse = (c: V3, u: V3, v: V3, r: number, a: number): V3 => ellipse(c, u, v, r, 1, a, a)[0];
const norm = (p: V3): V3 => {
  const l = Math.hypot(...p);
  return [p[0] / l, p[1] / l, p[2] / l];
};

const Sun: React.FC<{ position: V3; size?: number }> = ({ position, size = 3 }) => (
  <group>
    <mesh position={position}>
      <circleGeometry args={[size, 12]} />
      <Glow color="#FFF4E0" fog={false} />
    </mesh>
    <Halo position={[position[0], position[1], position[2] + 1]} size={size * 12} color="#FFD8A8" opacity={0.5} />
  </group>
);

const WhiteFlash: React.FC<{ o: number }> = ({ o }) => (o > 0.001 ? <AbsoluteFill style={{ background: "#FFF6E6", opacity: o }} /> : null);

// ---------------------------------------------------------------- cold open: two shadows

const HERO_ST: V3 = [16.5, 0, 0];
/** Moon key from behind-left: his shadow falls toward the camera and right. */
const KEY1: V3 = [-0.35, 0.75, -0.55];

/** 0 s: walking home on a moonlit street… a second shadow fades in beside the first. He stops. */
const coldShadow: ShotFn = (c) => {
  // high overhead view so both shadows read on the pavement (neither hides behind his body)
  const cam = move({ position: [14.4, 15.5, 7.6], target: [16.3, 0, -0.6] }, { position: [14.6, 14.6, 7.0], target: [16.3, 0, -0.5] }, c);
  const second = k01(c.lt, 0.62, 0.92);
  const stop = k01(c.lt, 0.7, 1.15);
  const z = HERO_ST[2] - 2.2 + 1.7 * Math.min(c.lt, 0.7) + 0.85 * clamp01((c.lt - 0.7) / 0.45) * 0.45;
  const pose = mergePose(walkPose(c.lt * 1.25, 1 - stop), { headPitch: -0.5 * stop, expression: stop > 0.6 ? "worried" : "neutral" });
  return (
    <Shot mood="night" camera={cam} fog={[60, 320]} shadowSize={30} light={0.3} keyDir={KEY1}>
      <BigStreet seed="hook" lamps={false} trees={false} />
      <Hero pose={pose} position={[HERO_ST[0], 0, z]} yaw={0.12} />
      <SecondKey intensity={1.25 * second} />
    </Shot>
  );
};

/** He looks up: two moons over the street. The title comes in here. */
const coldUp: ShotFn = (c) => {
  const a: CameraSpec = { position: [18.5, 1.5, 12], target: [10, 22, -60] };
  const cam = move(a, { position: [18.5, 1.4, 11.2], target: [10, 23, -60] }, c);
  const pose = lookUp(1.05, { lShoulder: [0.1, 0.32], rShoulder: [0.1, 0.32], expression: "awe" });
  return (
    <Shot mood="night" camera={cam} fog={[60, 400]} shadowSize={30} light={0.75} keyDir={KEY1}>
      <BigStreet seed="hook" lamps={false} trees={false} />
      <Hero pose={pose} position={[16.5, 0, 1.6]} yaw={Math.PI + 0.25} />
      <SkyMoons cam={a} spots={[{ kind: "moon", ndc: [0.32, 0.42], size: 0.13 }, { kind: "moon2", ndc: [-0.3, 0.2], size: 0.18 }]} />
      <Clouds t={c.t} color={NIGHT_CLOUD} y={60} radius={240} count={12} seed="hook" />
      <SecondKey intensity={1.2} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 two moons (night)

const c1City: ShotFn = (c) => {
  const a: CameraSpec = { position: [0, 24, 78], target: [0, 30, -100] };
  const cam = move(a, { position: [0, 25, 70], target: [0, 31, -100] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[80, 400]} shadowSize={60} light={0.85}>
      <CityGrid seed="night" blocks={9} />
      <Skyline radius={150} count={30} seed="nsky" />
      <SkyMoons cam={a} spots={[{ kind: "moon", ndc: [-0.38, 0.5], size: 0.16 }, { kind: "moon2", ndc: [0.3, 0.2], size: 0.22 }]} />
      <Clouds t={c.t} color={NIGHT_CLOUD} y={55} radius={260} count={14} seed="ncity" />
      <SecondKey intensity={0.9} size={70} />
    </Shot>
  );
};

const c1Awe: ShotFn = (c) => {
  const a: CameraSpec = { position: [13.6, 2.4, 11.4], target: [12.2, 4.1, 2] };
  const cam = move(a, { position: [13.7, 2.3, 10.5], target: [12.2, 4.2, 2] }, c);
  const pose = lookUp(0.7, { expression: c.lt < 0.45 ? "awe" : "smile", headYaw: -0.08 });
  return (
    <Shot mood="night" camera={cam} fog={[60, 400]} shadowSize={20} light={0.8}>
      <BigStreet seed="hook" lamps={false} trees={false} />
      <Hero pose={pose} position={[13.2, 0, 2]} yaw={0.05} />
      <SkyMoons cam={a} spots={[{ kind: "moon", ndc: [-0.5, 0.64], size: 0.15 }, { kind: "moon2", ndc: [0.3, 0.5], size: 0.2 }]} />
      <SecondKey intensity={1.1} />
    </Shot>
  );
};

/** Two moonlit paths on the harbour water. */
const c1Sea: ShotFn = (c) => {
  const a: CameraSpec = { position: [0, 5, 40], target: [0, 17, -100] };
  const cam = move(a, { position: [0, 4.6, 36], target: [0, 17.5, -100] }, c);
  const spots: MoonSpot[] = [
    { kind: "moon", ndc: [-0.4, 0.5], size: 0.14 },
    { kind: "moon2", ndc: [0.32, 0.22], size: 0.19 },
  ];
  const glint = (s: MoonSpot) => {
    const p = skyAt(a, s.ndc, 400);
    const d = norm([p[0] - a.position[0], 0, p[2] - a.position[2]]);
    const at = (k: number): [number, number] => [a.position[0] + d[0] * k, a.position[2] + d[2] * k];
    return { near: at(34), far: at(260) };
  };
  return (
    <Shot mood="night" camera={cam} fog={[90, 420]} shadowSize={40} light={0.8}>
      <Sea t={c.t} color="#142646" />
      <Skyline radius={170} count={34} seed="harb" />
      <SkyMoons cam={a} spots={spots} />
      <MoonGlints {...glint(spots[0])} t={c.t} seed="g1" />
      <MoonGlints {...glint(spots[1])} t={c.t} seed="g2" color="#FFE2C4" width={1.3} />
      <Clouds t={c.t} color={NIGHT_CLOUD} y={50} radius={250} count={10} seed="nsea" />
    </Shot>
  );
};

const c1Obs: ShotFn = (c) => {
  const a: CameraSpec = { position: [10, 5.0, 22], target: [0, 6.0, 0] };
  const cam = move(a, { position: [9.2, 4.8, 20.4], target: [0, 6.1, 0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[40, 300]} shadowSize={14} light={0.8}>
      <Ground color="#1C2238" />
      <HillRing color="#1A2236" radius={150} seed="obs" />
      {Array.from({ length: 9 }, (_, i) => {
        const a = -0.6 + i * 0.55 + random(`ot${i}`) * 0.3;
        const r = 9 + random(`or${i}`) * 6;
        return <PineTree key={i} position={[Math.cos(a) * r, -0.6, -Math.sin(a) * r - 2]} scale={1.6 + random(`os${i}`) * 0.8} />;
      })}
      <group rotation={[0, -0.3 + c.lt * 0.12, 0]}>
        <Observatory slitOpen={0.2 + 0.8 * k01(c.lt, 0, 1.1)} />
      </group>
      <SkyMoons cam={a} spots={[{ kind: "moon", ndc: [-0.42, 0.62], size: 0.13 }, { kind: "moon2", ndc: [0.36, 0.44], size: 0.18 }]} />
    </Shot>
  );
};

const SCI_SKIN: [string, string][] = [
  ["#C68A5E", "#A9714A"],
  ["#F0C8A4", "#D6AA86"],
  ["#7A4E34", "#673F29"],
];
const c1Lab: ShotFn = (c) => {
  const cam = move({ position: [0.6, 4.4, 20], target: [0, 4.0, -6] }, { position: [0.5, 4.4, 18.6], target: [0, 4.1, -6] }, c);
  const alarm = k01(c.lt, 0, 0.35);
  const turn = k01(c.lt, 0.25, 0.75);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={22} light={0.9} keyDir={[0.3, 1, 0.6]}>
      <Lab t={c.t} alarm={alarm} />
      <Hero pose={mergePose(REST, { rShoulder: [1.45, 0.12], rElbow: 0.1, headPitch: 0.15 })} position={[-2.3, 0, 1.0]} yaw={Math.PI + 0.15} look={labCoat(SCI_SKIN[0], "#2A1E18")} />
      <Hero
        pose={mergePose(REST, { lShoulder: [2.5, 0.38], rShoulder: [2.5, 0.38], lElbow: 1.9, rElbow: 1.9, expression: turn > 0.5 ? "alarm" : "worried", headPitch: 0.05 })}
        position={[2.2, 0, 5.0]}
        yaw={Math.PI * (1 - turn) + 0.32 * turn}
        look={labCoat(SCI_SKIN[1], "#C9A46A")}
      />
      <Hero pose={mergePose(REST, { headPitch: -0.12, lShoulder: [0.5, 0.1], rShoulder: [0.5, 0.1], lElbow: 1.0, rElbow: 1.0 })} position={[0.6, 0, -2.6]} yaw={Math.PI - 0.2} look={labCoat(SCI_SKIN[2], "#1A1410")} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 rising tides (space → dawn harbour → storm)

const EARTH: V3 = [0, -4.2, 0];
const MOON_ORBIT_U: V3 = norm([0.0, 1, -0.12]);
const MOON_ORBIT_V: V3 = norm([0.42, 0, 1]);

const c2Diagram: ShotFn = (c) => {
  const cam = move({ position: [0, -0.6, 27.5], target: [0, -0.4, 0] }, { position: [0, -0.6, 25.5], target: [0, -0.4, 0] }, c);
  const moon = onEllipse(EARTH, MOON_ORBIT_U, MOON_ORBIT_V, 10.2, 0.05 + c.lt * 0.03);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.75} keyDir={[-0.8, 0.3, 0.5]}>
      <FacetedEarth radius={3} position={EARTH} rotation={[0.35, 1.8 + c.t * 0.12, 0]} />
      <OrbitPath points={ellipse(EARTH, MOON_ORBIT_U, MOON_ORBIT_V, 10.2, 160)} dotRadius={0.06} spacing={0.32} />
      <Moon kind="moon" radius={0.85} position={moon} rotation={[0.2, c.t * 0.1, 0]} glow={0.4} />
      <Halo position={[moon[0], moon[1], moon[2] - 1]} size={5} color="#C9D6FF" opacity={0.35} />
      <Sun position={[-60, 18, -120]} />
    </Shot>
  );
};

const c2Pull: ShotFn = (c) => {
  const cam = move({ position: [0, -1.6, 20], target: [0, -1.2, 0] }, { position: [0, -1.6, 18.8], target: [0, -1.2, 0] }, c);
  const moon: V3 = [0, 4.0, -1];
  const bulge = 0.18 * k01(c.lt, 0.2, 1.6);
  return (
    <Shot
      mood="space"
      camera={cam}
      fog={false}
      shadows={false}
      light={0.75}
      keyDir={[-0.8, 0.3, 0.5]}
    >
      <FacetedEarth radius={3} position={EARTH} rotation={[0.35, 2.0 + c.t * 0.12, 0]} />
      <TideBulge r={3} position={EARTH} amount={bulge} dir={[0, 1, 0]} />
      <Moon kind="moon" radius={0.85} position={moon} rotation={[0.2, c.t * 0.1, 0]} glow={0.4} />
      <Arrow from={[0, 2.9, -0.6]} to={[0, -0.4, -0.2]} width={0.16} progress={k01(c.lt, 0.1, 0.9)} />
      <Sun position={[-60, 18, -120]} />
    </Shot>
  );
};

const c2Second: ShotFn = (c) => {
  const cam = move({ position: [0.6, -1.4, 23], target: [0.6, -1, 0] }, { position: [0.6, -1.4, 21.8], target: [0.6, -1, 0] }, c);
  const moon: V3 = [-1.4, 4.6, -1];
  const k = k01(c.lt, 0, 1.6);
  const m2: V3 = [9.5 - 6.6 * k, -0.6 + 2.6 * k, -2 + 1 * k];
  const toM = norm([moon[0] - EARTH[0], moon[1] - EARTH[1], moon[2] - EARTH[2]]);
  const toM2 = norm([m2[0] - EARTH[0], m2[1] - EARTH[1], m2[2] - EARTH[2]]);
  const dir = norm([toM[0] + toM2[0] * 1.6 * k, toM[1] + toM2[1] * 1.6 * k, toM[2] + toM2[2] * 1.6 * k]);
  return (
    <Shot
      mood="space"
      camera={cam}
      fog={false}
      shadows={false}
      light={0.75}
      keyDir={[-0.8, 0.3, 0.5]}
    >
      <FacetedEarth radius={3} position={EARTH} rotation={[0.35, 2.2 + c.t * 0.12, 0]} />
      <TideBulge r={3} position={EARTH} amount={0.18 + 0.3 * k} dir={dir} opacity={0.4} />
      <Moon kind="moon" radius={0.85} position={moon} rotation={[0.2, c.t * 0.1, 0]} glow={0.4} />
      <Moon kind="moon2" radius={1.15} position={m2} rotation={[0.4, c.t * 0.15, 0.2]} glow={0.4} />
      <Arrow from={[moon[0] * 0.85, 3.5, -0.6]} to={[-0.45, -0.4, 0]} width={0.14} />
      {k > 0.5 ? <Arrow from={[m2[0] - 1.3, m2[1] - 0.6, m2[2]]} to={[1.6, -2.2, 0.2]} width={0.18} color="#FF8A5A" progress={k01(c.lt, 0.9, 1.6)} /> : null}
      <Sun position={[-60, 18, -120]} />
    </Shot>
  );
};

/** Dawn harbour: the quay front is at z = -6, its top at y = 2.2. Sea level `level` rises over it. */
const QUAY_TOP = 2.2;
const Boat: React.FC<{ position: V3; yaw?: number; t: number; color?: string }> = ({ position, yaw = 0, t, color = "#C8372D" }) => (
  <group position={[position[0], position[1] + Math.sin(t * 1.8 + position[0]) * 0.15, position[2]]} rotation={[Math.sin(t * 1.3 + position[0]) * 0.06, yaw, Math.sin(t * 1.6) * 0.05]}>
    <mesh position={[0, 0.3, 0]} castShadow>
      <BoxG args={[7, 1.6, 2.6]} />
      <Flat color={color} />
    </mesh>
    <mesh position={[-0.8, 1.7, 0]} castShadow>
      <BoxG args={[2.6, 1.4, 2.0]} />
      <Flat color="#E8E4DA" />
    </mesh>
  </group>
);
const Harbour: React.FC<{ t: number; level: number; seed?: string }> = ({ t, level, seed = "dh" }) => (
  <group>
    <Sea t={t} y={level} color="#35566A" />
    <group position={[0, level, 0]}>
      <Waves t={t} rows={5} z0={34} spacing={7} color="#2F5064" />
    </group>
    <Quay z={-6} length={320} />
    <TideGauge position={[4.5, 0, -5.4]} />
    <GantryCrane position={[-34, QUAY_TOP, -14]} />
    <GantryCrane position={[30, QUAY_TOP, -14]} color="#C8372D" />
    <Lighthouse position={[-62, 0, 26]} t={t} h={18} />
    {Array.from({ length: 8 }, (_, i) => (
      <Building key={i} position={[-70 + i * 20, QUAY_TOP, -46 - (i % 2) * 12]} w={14} d={12} h={16 + random(`${seed}${i}`) * 26} color={[P.bldgSlate, P.bldgTeal, P.bldgNavy, P.bldgPurple][i % 4]} seed={`${seed}${i}`} power={0.3} />
    ))}
    <Boat position={[-14, level, -0.6]} t={t} />
    <Boat position={[16, level, -0.2]} yaw={0.12} t={t} color="#24748F" />
  </group>
);
const seaCard = (c: ShotCtx, level: number) => <CardLine text={`SEA LEVEL +${Math.max(0, (level + 0.3) * 1.9).toFixed(1)} M`} y={250} appearFrame={startFrame(c) + 4} accent="#6FB8FF" />;
const DAWN_MOONS: MoonSpot[] = [
  { kind: "moon", ndc: [-0.5, 0.62], size: 0.1, halo: 0.12 },
  { kind: "moon2", ndc: [0.35, 0.5], size: 0.14, halo: 0.12 },
];

const c2Surge: ShotFn = (c) => {
  const a: CameraSpec = { position: [-4.5, 2.6, 17], target: [2.5, 4.4, -8] };
  const cam = move(a, { position: [-4.2, 2.8, 15], target: [2.5, 4.6, -8] }, c);
  const level = -0.3 + 2.9 * k01(c.lt, 0, 1.7);
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 360]} shadowSize={50} light={1} overlay={seaCard(c, level)}>
      <Harbour t={c.t} level={level} />
      <Clouds t={c.t} color="#C9B8D6" y={48} radius={220} count={12} seed="dawnh" />
      <SkyMoons cam={a} spots={DAWN_MOONS} />
    </Shot>
  );
};

const c2Brink: ShotFn = (c) => {
  const a: CameraSpec = { position: [1.0, 3.7, 6], target: [-2, 4.9, -10] };
  const cam = move(a, { position: [0.8, 3.6, 4.9], target: [-2, 5.0, -10] }, c);
  const level = 2.1 + 0.75 * k01(c.lt, 0, 1.9);
  const back = k01(c.lt, 0.2, 1.4);
  const pose = mergePose(walkPose(-c.lt * 0.9, 0.35 * (1 - back)), {
    expression: "alarm",
    headPitch: -0.32,
    lShoulder: [0.25, 0.75],
    rShoulder: [0.25, 0.75],
    lElbow: 0.4,
    rElbow: 0.4,
  });
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 360]} shadowSize={30} light={1} overlay={seaCard(c, level)}>
      <Harbour t={c.t} level={level} />
      <Hero pose={pose} position={[-2, QUAY_TOP, -9 - back * 1.2]} yaw={0.15} />
      <Clouds t={c.t} color="#C9B8D6" y={48} radius={220} count={12} seed="dawnh" />
      <SkyMoons cam={a} spots={[{ kind: "moon", ndc: [-0.55, 0.7], size: 0.09, halo: 0.12 }, { kind: "moon2", ndc: [0.45, 0.62], size: 0.12, halo: 0.12 }]} />
    </Shot>
  );
};

const STORM_CLOUD = "#3E4656";
const c2CityFlood: ShotFn = (c) => {
  const cam = move({ position: [30, 30, 58], target: [0, 1, -6] }, { position: [27, 28, 52], target: [0, 1, -6] }, c);
  const level = 0.8 + 1.4 * k01(c.lt, 0, 1.6);
  const flash = c.lt > 0.9 && c.lt < 1.05 ? 1 : 0;
  return (
    <Shot mood="storm" camera={cam} fog={[40, 260]} shadowSize={60} light={0.9 + flash * 0.6} overlay={<WhiteFlash o={flash * 0.35} />}>
      <CityGrid seed="coast" blocks={7} modify={() => ({ power: 0.5 })} />
      <Sea t={c.t} y={level} color="#3C6E94" />
      <Clouds t={c.t} color={STORM_CLOUD} y={48} radius={150} count={20} seed="stormc" />
      <Rain center={[18, 18, 30]} size={[60, 40, 60]} t={c.t} count={900} thickness={0.08} opacity={0.4} />
      <LightningBolt top={[-50, 60, -120]} bottom={[-42, 0, -120]} flash={flash} seed="b1" />
    </Shot>
  );
};

const STOOP: V3 = [18.8, 0, 3];
const STOOP_TOP = 3;
const c2StreetFlood: ShotFn = (c) => {
  const cam = move({ position: [6.5, 6.6, 20], target: [18.4, 4.9, 2] }, { position: [7.4, 6.3, 18.4], target: [18.4, 5.0, 2] }, c);
  const level = 1.3 + 1.0 * k01(c.lt, 0, 1.8);
  const flash = c.lt > 0.55 && c.lt < 0.72 ? 1 : 0;
  const pose = mergePose(REST, { expression: "alarm", headPitch: -0.2, headYaw: 0.3, lShoulder: [0.3, 0.95], rShoulder: [0.3, 0.95], lElbow: 0.3, rElbow: 0.3 });
  const floatY = level / CITY - 0.42;
  return (
    <Shot mood="storm" camera={cam} fog={[30, 220]} shadowSize={30} light={0.95 + flash * 0.7} overlay={<WhiteFlash o={flash * 0.4} />}>
      <BigStreet seed="flood" lamps={false} cars={false} />
      <Stoop position={STOOP} yaw={-Math.PI / 2} w={7} d={6} h={STOOP_TOP} />
      <Hero pose={pose} position={[20.3, STOOP_TOP, STOOP[2]]} yaw={-Math.PI / 2 + 0.55} />
      <FloodWater level={level} t={c.t} size={[90, 260]} position={[0, 0, -80]} flow={4} />
      <group scale={CITY}>
        <Car position={[1.4, floatY + Math.sin(c.t * 2.2) * 0.04, 2.2 - c.lt * 0.6]} yaw={0.35 + Math.sin(c.t) * 0.06} color={P.carRed} />
        <Car position={[-1.6, floatY + Math.sin(c.t * 2 + 1) * 0.04, -9 - c.lt * 0.8]} yaw={-0.25} color={P.carTeal} />
      </group>
      <Clouds t={c.t} color={STORM_CLOUD} y={45} radius={160} count={18} seed="streetc" />
      <Rain center={[12, 9, 10]} size={[30, 20, 26]} t={c.t} count={700} thickness={0.04} opacity={0.4} />
      <LightningBolt top={[-30, 90, -220]} bottom={[-22, 0, -220]} flash={flash} seed="b2" />
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 tug of war (space)

const E3: V3 = [0, -1.5, 0];
const O1 = { u: norm([0.3, 1, 0]), v: norm([0.6, 0, 1]), r: 7.8 };
const O2 = { u: norm([-0.45, 1, 0.2]), v: norm([0.3, 0, 1]), r: 10.2 };

const c3Wide: ShotFn = (c) => {
  const cam = move({ position: [0, 1, 30], target: [0, -1.2, 0] }, { position: [0, 2.2, 40], target: [0, -1.2, 0] }, c);
  const m1 = onEllipse(E3, O1.u, O1.v, O1.r, 0.5 + c.t * 0.05);
  const m2 = onEllipse(E3, O2.u, O2.v, O2.r, -0.9 + c.t * 0.04);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.75} keyDir={[-0.8, 0.3, 0.5]}>
      <FacetedEarth radius={3} position={E3} rotation={[0.35, 2.4 + c.t * 0.1, 0]} />
      <OrbitPath points={ellipse(E3, O1.u, O1.v, O1.r, 180)} dotRadius={0.07} spacing={0.36} />
      <OrbitPath points={ellipse(E3, O2.u, O2.v, O2.r, 200)} dotRadius={0.08} spacing={0.36} color={P.amber} />
      <Moon kind="moon" radius={0.9} position={m1} rotation={[0.2, c.t * 0.1, 0]} glow={0.4} />
      <Moon kind="moon2" radius={1.1} position={m2} rotation={[0.4, c.t * 0.12, 0.2]} glow={0.4} />
      <Sun position={[-80, 30, -160]} />
    </Shot>
  );
};

const c3Tug: ShotFn = (c) => {
  const cam = move({ position: [0.9, 0.3, 11], target: [0, 0.1, 0] }, { position: [0.7, 0.2, 10], target: [0, 0.1, 0] }, c);
  const k = k01(c.lt, 0, 2.4);
  const m1: V3 = [-0.4, 2.7 - 0.25 * k, 0];
  const m2: V3 = [0.5, -2.5 + 0.55 * k, 0];
  const d = norm([m2[0] - m1[0], m2[1] - m1[1], m2[2] - m1[2]]);
  const pulse = 0.85 + 0.15 * Math.sin(c.t * 8);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.75} keyDir={[-0.8, 0.3, 0.5]}>
      <Moon kind="moon" radius={1.4} position={m1} rotation={[0.2, c.t * 0.1, 0]} stretch={0.04 + 0.08 * k} stretchDir={d} glow={0.4} />
      <Moon kind="moon2" radius={1.2} position={m2} rotation={[0.4, c.t * 0.12, 0.2]} stretch={0.04 + 0.1 * k} stretchDir={d} glow={0.4} />
      <Arrow from={[m1[0] - 0.25, m1[1] - 1.55, 0.6]} to={[m1[0] - 0.05 + d[0] * 1.6, m1[1] - 1.55 + d[1] * 1.0, 0.6]} width={0.13 * pulse} progress={k01(c.lt, 0.1, 0.6)} />
      <Arrow from={[m2[0] + 0.25, m2[1] + 1.4, 0.6]} to={[m2[0] + 0.05 - d[0] * 1.6, m2[1] + 1.4 - d[1] * 1.0, 0.6]} width={0.13 * pulse} color="#FF8A5A" progress={k01(c.lt, 0.3, 0.8)} />
      <FacetedEarth radius={3} position={[4.5, -9.5, -16]} rotation={[0.35, 2.4 + c.t * 0.1, 0]} />
      <Sun position={[-80, 30, -160]} />
    </Shot>
  );
};

/** Chaotic orbits, seen from above: trails of the last few seconds loop and cross. */
const ORB_C: V3 = [0, 0, 0];
const m1At = (s: number): V3 => [Math.cos(s * 1.0) * 3.6, 0.25, Math.sin(s * 1.0) * 3.6];
const m2At = (s: number): V3 => {
  const r = 4.3 + 1.4 * Math.sin(s * 1.9);
  const a = 2.4 + s * 0.8 + 0.6 * Math.sin(s * 1.3);
  return [Math.cos(a) * r, -0.6 + 0.4 * Math.sin(s * 1.1), Math.sin(a) * r];
};
const c3Chaos: ShotFn = (c) => {
  const cam = move({ position: [0, 27, 7], target: [0, 0, -0.6], up: [0, 0, -1] }, { position: [0, 24, 6], target: [0, 0, -0.6], up: [0, 0, -1] }, c);
  const s = c.lt * 1.3 + 3;
  const trail = (f: (s: number) => V3) => Array.from({ length: 60 }, (_, i) => f(s - i * 0.07));
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.75} keyDir={[-0.6, 0.8, 0.3]}>
      <FacetedEarth radius={1.5} position={ORB_C} rotation={[0.35, 2.4 + c.t * 0.2, 0]} />
      <OrbitPath points={trail(m1At)} dotRadius={0.07} spacing={0.22} />
      <OrbitPath points={trail(m2At)} dotRadius={0.08} spacing={0.22} color={P.amber} />
      <Moon kind="moon" radius={0.45} position={m1At(s)} detail={2} glow={0.4} />
      <Moon kind="moon2" radius={0.52} position={m2At(s)} detail={2} glow={0.4} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 torn apart (space → sunset)

const ROCHE_MOON: V3 = [0, 0.6, 0];
const ROCHE_R = 2.7;
const c4Roche: ShotFn = (c) => {
  const cam = move({ position: [0.3, 0.9, 14.4], target: [0, 0.9, 0] }, { position: [0.2, 0.9, 13.8], target: [0, 0.9, 0] }, c);
  const k = k01(c.lt, 0, 1.5);
  const m2: V3 = [2.6 - 1.8 * k, -4.6 + 2.7 * k, 0];
  const d = norm([ROCHE_MOON[0] - m2[0], ROCHE_MOON[1] - m2[1], 0]);
  const ring = ellipse(ROCHE_MOON, [1, 0, 0], [0, 1, 0], ROCHE_R, 120);
  return (
    <Shot
      mood="space"
      camera={cam}
      fog={false}
      shadows={false}
      light={0.75}
      keyDir={[-0.8, 0.3, 0.5]}
      overlay={<CardLine text="THE ROCHE LIMIT" sub="ANY CLOSER AND GRAVITY TEARS A MOON APART" y={250} appearFrame={startFrame(c) + 6} accent="#FF5A4A" />}
    >
      <Moon kind="moon" radius={1.0} position={ROCHE_MOON} rotation={[0.2, c.t * 0.1, 0]} glow={0.4} />
      <OrbitPath points={ring} dotRadius={0.05} spacing={0.24} color="#FF5A4A" />
      <Moon kind="moon2" radius={0.7} position={m2} rotation={[0.4, c.t * 0.12, 0.2]} stretch={0.18 * k} stretchDir={d} glow={0.4} />
      <Sun position={[-80, 30, -160]} />
    </Shot>
  );
};

/** The second Moon (at the origin) stretching and cracking under our Moon's pull, then starting to come apart. */
const TEAR_AXIS: V3 = [0, 1, 0];
const c4Tear: ShotFn = (c) => {
  const cam = move({ position: [0.6, 0.3, 8.6], target: [0, 0.5, 0] }, { position: [0.5, 0.2, 7.6], target: [0, 0.5, 0] }, c);
  const stretch = 0.15 + 0.3 * k01(c.lt, 0, 1.7);
  const crack = k01(c.lt, 0.15, 1.6);
  const brk = clamp01((c.lt - 1.8) / 0.6) * 0.06;
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={[-0.8, 0.3, 0.5]} shake={0.015 + 0.04 * crack} shakeSeed="tear">
      <Moon kind="moon" radius={2.0} position={[0.2, 5.4, -1.5]} rotation={[0.2, c.t * 0.1, 0]} glow={0.4} />
      {brk <= 0 ? (
        <Moon kind="moon2" radius={1.3} position={[0, -0.6, 0]} stretch={stretch} stretchDir={TEAR_AXIS} crack={crack} glow={0.4} />
      ) : (
        <MoonBreakup kind="moon2" radius={1.3} position={[0, -0.6, 0]} progress={brk} spread={4} axis={TEAR_AXIS} stretch={stretch} t={c.t} />
      )}
      <Sun position={[-80, 30, -160]} />
    </Shot>
  );
};

const CHUNK_AXIS: V3 = [0.55, 1, 0.25];
const c4Chunks: ShotFn = (c) => {
  const cam = move({ position: [1, 0.2, 11], target: [0.4, 0.3, 0] }, { position: [1.6, 0.5, 16], target: [0.8, 0.6, 0] }, c);
  const p = 0.06 + 0.6 * k01(c.lt, 0, 1.9);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={[-0.8, 0.3, 0.5]} shake={0.03 * (1 - c.lt / 2)} shakeSeed="chunks">
      <MoonBreakup kind="moon2" radius={1.3} position={[0, 0, 0]} progress={p} spread={4.5} axis={CHUNK_AXIS} push={[2.2, 0, 0]} stretch={0.45} t={c.t} />
      <RockBurst origin={[0, 0, 0]} progress={p} reach={9} count={260} size={0.08} seed="c4b" flatten={0.4} push={[2, 0, 0]} />
      <Sun position={[-80, 30, -160]} />
    </Shot>
  );
};

/** Rocks streaming past the camera toward Earth. Lanes are spaced around the camera axis so none clip it or each other. */
const ROCKS = Array.from({ length: 48 }, (_, i) => {
  const s = 0.2 + random(`rsz${i}`) ** 2 * 0.7;
  const a = i * 2.39996 + random(`rs${i}`) * 0.3; // golden-angle spiral: lanes never coincide
  const rad = 1.3 + s + (i / 48) * 3.6;
  return { ox: Math.cos(a) * rad * 0.7, oy: Math.sin(a) * rad, phase: random(`rz${i}`) * 3.2, sp: 15 + random(`rv${i}`) * 6, s, i };
});
const c4Stream: ShotFn = (c) => {
  const cam = move({ position: [0, 0, 12], target: [0.5, -2.2, -60] }, { position: [0, 0.2, 11], target: [0.6, -2.4, -60] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={[-0.8, 0.4, 0.5]}>
      <FacetedEarth radius={8} position={[3, -15, -95]} rotation={[0.35, 2.6 + c.t * 0.05, 0]} />
      {ROCKS.map((r) => {
        // each rock enters just behind the camera (z 13) and recedes toward Earth, wrapping round
        const z = 13 - ((c.lt + r.phase) % 3.2) * r.sp;
        const k = clamp01((13 - z) / 60);
        return (
          <mesh key={r.i} position={[r.ox * (1 - k * 0.7) + k * 2, r.oy * (1 - k * 0.7) - k * 9, z]} rotation={[c.t * (0.5 + r.s), r.i, c.t * 0.3]} scale={r.s}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshLambertMaterial color={r.i % 3 ? P.moon2 : P.moon2Dark} flatShading fog={false} emissive="#3A2A22" />
          </mesh>
        );
      })}
      <Sun position={[-90, 30, -200]} size={4} />
    </Shot>
  );
};

/** Sunset countryside: hills, a road, a small town on the horizon. */
const SUNSET_CLOUD = "#F7C0A0";
const Country: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <Ground color="#56603E" />
    <HillRing color="#4A4A3E" radius={230} seed="sunhill" />
    <mesh position={[0, 0.02, -40]} receiveShadow>
      <BoxG args={[9, 0.06, 240]} />
      <Flat color={P.road} />
    </mesh>
    {Array.from({ length: 12 }, (_, i) => (
      <mesh key={i} position={[0, 0.07, 10 - i * 12]}>
        <BoxG args={[0.3, 0.03, 3]} />
        <Flat color={P.laneMark} />
      </mesh>
    ))}
    {Array.from({ length: 9 }, (_, i) => (
      <Building key={i} position={[-30 + i * 9, 0, -150 - (i % 3) * 6]} w={7} d={7} h={8 + random(`stn${i}`) * 16} color={[P.bldgSlate, P.bldgPurple, P.bldgNavy][i % 3]} seed={`stn${i}`} power={0.6} />
    ))}
    <Clouds t={t} color={SUNSET_CLOUD} y={40} radius={220} count={12} seed="sunc" />
  </group>
);
const METEORS = [
  { from: [-150, 130, -280] as V3, to: [40, 6, -330] as V3, at: 0.0, size: 2.6 },
  { from: [-90, 150, -300] as V3, to: [110, 4, -360] as V3, at: 0.35, size: 3.4 },
  { from: [-200, 110, -260] as V3, to: [-20, 6, -320] as V3, at: 0.7, size: 2.0 },
  { from: [-60, 170, -320] as V3, to: [150, 5, -380] as V3, at: 1.0, size: 2.8 },
];
const c4Meteors: ShotFn = (c) => {
  const cam = move({ position: [6.5, 2.6, 22], target: [-2, 16, -100] }, { position: [6.3, 2.5, 20.8], target: [-2, 17, -100] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[80, 520]} shadowSize={20} light={0.95}>
      <Country t={c.t} />
      <Hero pose={lookUp(1.1, { expression: "alarm", lShoulder: [0.15, 0.35], rShoulder: [0.15, 0.35] })} position={[4.5, 0, 6]} yaw={Math.PI + 0.25} />
      {METEORS.map((m, i) => (
        <Meteor key={i} from={m.from} to={m.to} progress={clamp01((c.lt - m.at) / 1.5) * 0.92} size={m.size} trail={60} seed={`sm${i}`} />
      ))}
    </Shot>
  );
};

const HIT: V3 = [18, 0, -200];
const c4Impact: ShotFn = (c) => {
  const cam = move({ position: [-5, 3.2, 20], target: [3, 9, -160] }, { position: [-5.2, 3.0, 19], target: [3, 9.5, -160] }, c);
  const hitAt = 0.28;
  const fb = (c.lt - hitAt) / 1.3;
  const shake = c.lt > hitAt ? 0.16 * Math.max(0, 1 - (c.lt - hitAt) / 1.0) : 0;
  const flash = c.lt > hitAt ? Math.max(0, 1 - (c.lt - hitAt) / 0.35) : 0;
  return (
    <Shot mood="sunset" camera={cam} fog={[80, 520]} shadowSize={20} light={0.95 + flash * 0.5} shake={shake} shakeSeed="impact" overlay={<WhiteFlash o={flash * 0.45} />}>
      <Country t={c.t} />
      <Hero pose={mergePose(REST, { expression: "alarm", headPitch: 0.1, lShoulder: [1.6, 0.4], rShoulder: [1.6, 0.4], lElbow: 1.6, rElbow: 1.6 })} position={[-6, 0, 4]} yaw={Math.PI - 0.35} />
      <Meteor from={[-120, 160, -260]} to={HIT} progress={clamp01((c.lt + 0.9) / (hitAt + 0.9)) * (c.lt < hitAt ? 1 : 0)} size={3.2} trail={60} seed="hitm" />
      <Fireball position={HIT} progress={fb} radius={16} seed="hitfb" />
      <SmokeCluster position={HIT} progress={clamp01((c.lt - hitAt) / 1.6)} radius={18} count={12} rise={14} seed="hitsm" />
      <Shockwave position={[HIT[0], 0.4, HIT[2]]} progress={(c.lt - hitAt) / 1.0} radius={70} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 collision (night dust → space)

const c5Fear: ShotFn = (c) => {
  const a: CameraSpec = { position: [13.9, 2.4, 11.8], target: [12.4, 4.1, 2.5] };
  const cam = move(a, { position: [14.0, 2.3, 10.8], target: [12.4, 4.2, 2.5] }, c);
  const pose = lookUp(0.75, { expression: c.lt < 1.2 ? "worried" : "alarm", headYaw: 0.05 });
  return (
    <Shot mood="night" dust={0.4} camera={cam} fog={[60, 400]} shadowSize={20} light={0.8}>
      <BigStreet seed="dread" lamps={false} trees={false} />
      <Hero pose={pose} position={[13.3, 0, 2.5]} yaw={0.05} />
      <SkyMoons
        cam={a}
        spots={[
          { kind: "moon", ndc: [-0.42, 0.64], size: 0.18, dist: 440 },
          { kind: "moon2", ndc: [0.32, 0.36], size: 0.2, dist: 380 },
        ]}
      />
      <SecondKey intensity={1.0} />
    </Shot>
  );
};

/** Collision geometry: the second Moon closes in on ours along DIRN; contact when the gap is r1 + r2. */
const C_MOON: V3 = [0.1, 2.2, 0];
const R1 = 1.5;
const R2 = 1.25;
const DIRN: V3 = norm([0.3, -1, 0.25]);
const m2At5 = (d: number): V3 => [C_MOON[0] + DIRN[0] * d, C_MOON[1] + DIRN[1] * d, C_MOON[2] + DIRN[2] * d];
const HIT_LT = 0.3;

const c5Approach: ShotFn = (c) => {
  const cam = move({ position: [0.6, -0.4, 13.5], target: [0.3, -0.4, 0] }, { position: [0.5, -0.4, 12.6], target: [0.3, -0.4, 0] }, c);
  const d = 8.2 - 4.2 * clamp01(c.lt / span(c.dur));
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={[-0.8, 0.4, 0.5]}>
      <Moon kind="moon" radius={R1} position={C_MOON} rotation={[0.2, c.t * 0.1, 0]} glow={0.4} />
      <Moon kind="moon2" radius={R2} position={m2At5(d)} rotation={[0.4, c.t * 0.2, 0.2]} glow={0.4} />
      <Sun position={[-80, 30, -160]} />
    </Shot>
  );
};

const c5Hit: ShotFn = (c) => {
  const cam = move({ position: [0.5, -0.4, 12.6], target: [0.3, -0.4, 0] }, { position: [0.6, -0.4, 15], target: [0.3, -0.4, 0] }, c);
  const before = c.lt < HIT_LT;
  const d = before ? 4.0 - (4.0 - (R1 + R2)) * (c.lt / HIT_LT) : R1 + R2;
  const p = clamp01((c.lt - HIT_LT) / 1.4) * 0.45;
  const contact: V3 = [C_MOON[0] + DIRN[0] * R1, C_MOON[1] + DIRN[1] * R1, C_MOON[2] + DIRN[2] * R1];
  const shake = before ? 0 : 0.1 * Math.max(0, 1 - (c.lt - HIT_LT) / 1.1);
  const flash = before ? 0 : Math.max(0, 1 - (c.lt - HIT_LT) / 0.3);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={[-0.8, 0.4, 0.5]} shake={shake} shakeSeed="hit5" overlay={<WhiteFlash o={flash * 0.55} />}>
      {before ? (
        <>
          <Moon kind="moon" radius={R1} position={C_MOON} rotation={[0.2, c.t * 0.1, 0]} glow={0.4} />
          <Moon kind="moon2" radius={R2} position={m2At5(d)} rotation={[0.4, c.t * 0.2, 0.2]} glow={0.4} />
        </>
      ) : (
        <>
          <MoonBreakup kind="moon" radius={R1} position={C_MOON} progress={p} spread={3.2} push={[-DIRN[0] * 2, -DIRN[1] * 2, 0]} pieces={34} t={c.t} />
          <MoonBreakup kind="moon2" radius={R2} position={m2At5(R1 + R2)} progress={p} spread={3.6} push={[DIRN[0] * 1.5, DIRN[1] * 1.5, 0]} pieces={26} t={c.t} />
          <RockBurst origin={contact} progress={clamp01((c.lt - HIT_LT) / 1.6)} reach={10} count={420} size={0.07} seed="c5b" />
        </>
      )}
      <Flash position={contact} progress={(c.lt - HIT_LT) / 1.0} radius={2.6} />
      <RingWave position={contact} progress={(c.lt - HIT_LT) / 1.1} radius={9} normal={DIRN} />
      <Sun position={[-80, 30, -160]} />
    </Shot>
  );
};

const c5Cloud: ShotFn = (c) => {
  const cam = move({ position: [0, -0.5, 24], target: [0, -1.6, 0] }, { position: [0, -1.2, 30], target: [0, -2.0, 0] }, c);
  const site: V3 = [0, 3.2, 0];
  const p = 0.45 + 0.4 * k01(c.lt, 0, 2.1);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={[-0.8, 0.4, 0.5]}>
      <FacetedEarth radius={3.4} position={[0, -9.5, -6]} rotation={[0.35, 2.6 + c.t * 0.08, 0]} cityLights={0.3} />
      <MoonBreakup kind="moon" radius={R1} position={[site[0] - DIRN[0] * R1, site[1] - DIRN[1] * R1, 0]} progress={p} spread={4.2} push={[-DIRN[0] * 2.4, -DIRN[1] * 2.4, 0]} pieces={34} t={c.t} />
      <MoonBreakup kind="moon2" radius={R2} position={[site[0] + DIRN[0] * R2, site[1] + DIRN[1] * R2, 0]} progress={p} spread={4.4} push={[DIRN[0] * 2, DIRN[1] * 2, 0]} pieces={26} t={c.t} />
      <RockBurst origin={site} progress={0.4 + 0.6 * k01(c.lt, 0, 2.1)} reach={10} count={900} size={0.07} seed="c5c" />
      <Sun position={[-80, 30, -160]} />
    </Shot>
  );
};

const c5Ring: ShotFn = (c) => {
  const cam = move({ position: [0, 1.5, 24], target: [0, 0, 0] }, { position: [0, 1.2, 22], target: [0, 0, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={[-0.8, 0.4, 0.5]}>
      <FacetedEarth radius={3} position={[0, 0, 0]} rotation={[0.35, 2.8 + c.t * 0.08, 0]} cityLights={0.3} />
      <DebrisRing r={3} inner={1.45} outer={2.35} t={c.t} form={0.25 + 0.75 * k01(c.lt, 0, 1.3)} a0={-0.5} tilt={[0.38, 0, 0.95]} count={2600} />
      <Sun position={[-80, 30, -160]} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 06 the remains (dusty night)

/** The ring arc and the rubble of the moons, as seen from the street. */
const RING_ROT: V3 = [-0.32, 0.1, 0.28];
const RING_R = 760;
const ringCenter = (cam: CameraSpec, apexNdc: [number, number]): V3 => {
  const apex = new THREE.Vector3(...skyAt(cam, apexNdc, 820));
  const top = new THREE.Vector3(0, RING_R, 0).applyEuler(new THREE.Euler(...RING_ROT));
  return apex.sub(top).toArray() as V3;
};
const RemainsSky: React.FC<{ cam: CameraSpec; t: number; rubble?: [number, number]; size?: number; apex?: [number, number] }> = ({ cam, t, rubble = [0.3, 0.5], size = 0.16, apex = [0, 0.3] }) => {
  const dist = 420;
  const r = skyR(cam, size * 0.55, dist);
  return (
    <group>
      <SkyRing position={ringCenter(cam, apex)} rotation={RING_ROT} radius={RING_R} width={95} t={t} />
      <MoonBreakup kind="moon" radius={r} position={skyAt(cam, rubble, dist)} progress={0.13} spread={1.6} pieces={34} t={t} seed="rubble1" lava={0.08} spin={0.25} />
      <MoonBreakup kind="moon2" radius={r * 0.8} position={skyAt(cam, [rubble[0] + 0.12, rubble[1] - 0.06], dist + 20)} progress={0.16} spread={1.6} pieces={26} t={t} seed="rubble2" lava={0.08} spin={0.25} />
    </group>
  );
};

const c6Up: ShotFn = (c) => {
  const a: CameraSpec = { position: [18.5, 1.5, 17], target: [10, 19, -60] };
  const cam = move(a, { position: [18.5, 1.45, 16.3], target: [10, 19.5, -60] }, c);
  return (
    <Shot mood="night" dust={0.75} camera={cam} fog={[60, 400]} shadowSize={30} light={0.85}>
      <BigStreet seed="hook" lamps={false} trees={false} />
      <Hero pose={lookUp(1.05, { expression: "worried" })} position={[16.5, 0, 1.6]} yaw={Math.PI + 0.25} />
      <RemainsSky cam={a} t={c.t} rubble={[0.3, 0.55]} apex={[-0.1, 0.32]} />
    </Shot>
  );
};

const CROWD: { p: V3; yaw: number; seed: number }[] = [
  { p: [12.8, 0, -1.5], yaw: 0.35, seed: 11 },
  { p: [19.6, 0, 0.5], yaw: -0.3, seed: 12 },
  { p: [15.2, 0, -6.5], yaw: 0.1, seed: 13 },
  { p: [9.5, 0, -8], yaw: 0.4, seed: 14 },
  { p: [20.4, 0, -9.5], yaw: -0.2, seed: 15 },
  { p: [13.5, 0, -14], yaw: 0.2, seed: 16 },
];
const c6Crowd: ShotFn = (c) => {
  const a: CameraSpec = { position: [15.6, 3.6, 21], target: [15.6, 5.2, 0] };
  const cam = move(a, { position: [15.6, 3.5, 19.8], target: [15.6, 5.35, 0] }, c);
  return (
    <Shot mood="night" dust={0.75} camera={cam} fog={[60, 400]} shadowSize={30} light={0.85}>
      <BigStreet seed="crowd" lamps={false} cars={false} trees={false} />
      {CROWD.map((m, i) => (
        <Hero key={i} pose={lookUp(0.9 + (i % 3) * 0.1, { expression: i % 2 ? "alarm" : "worried", headYaw: (random(`cy${i}`) - 0.5) * 0.4 })} position={m.p} yaw={m.yaw} look={crowdLook(m.seed)} />
      ))}
      <Hero pose={lookUp(0.95, { expression: "worried" })} position={[16.6, 0, 3.4]} yaw={0.05} />
      <RemainsSky cam={a} t={c.t} rubble={[-0.3, 0.7]} size={0.12} apex={[0.05, 0.52]} />
    </Shot>
  );
};

/** The two beautiful moons crack and crumble into rubble. */
const c6Crumble: ShotFn = (c) => {
  const a: CameraSpec = { position: [16, 2.6, 10], target: [12, 40, -80] };
  const cam = move(a, { position: [16, 2.6, 10], target: [12, 41.5, -80] }, c);
  const crack = k01(c.lt, 0.15, 0.9);
  const p = k01(c.lt, 0.8, 2.0) * 0.32;
  const spots: { kind: MoonKind; ndc: [number, number]; size: number; dist: number }[] = [
    { kind: "moon", ndc: [-0.35, 0.42], size: 0.2, dist: 440 },
    { kind: "moon2", ndc: [0.38, 0.05], size: 0.24, dist: 400 },
  ];
  return (
    <Shot mood="night" dust={0.3 + 0.45 * k01(c.lt, 0.5, 2)} camera={cam} fog={[60, 400]} shadowSize={30} light={0.85}>
      <BigStreet seed="hook" lamps={false} trees={false} />
      {spots.map((s, i) => {
        const r = skyR(a, s.size, s.dist);
        const pos = skyAt(a, s.ndc, s.dist);
        return p <= 0 ? (
          <SkyMoon key={i} kind={s.kind} radius={r} position={pos} haloAt={awayFrom(a, pos, r * 1.3)} crack={crack} halo={0.35 * (1 - crack * 0.6)} rotation={[0.2, 0.6 + i, 0]} />
        ) : (
          <MoonBreakup key={i} kind={s.kind} radius={r} position={pos} progress={p} spread={1.8} pieces={i ? 26 : 34} t={c.t} seed={`crumble${i}`} lava={0.1} spin={0.3} />
        );
      })}
    </Shot>
  );
};

const c6Remains: ShotFn = (c) => {
  const a: CameraSpec = { position: [12.5, 1.2, 28], target: [13, 15, -40] };
  const cam = move(a, { position: [12.6, 1.2, 26.5], target: [13, 15.5, -40] }, c);
  return (
    <Shot mood="night" dust={0.8} camera={cam} fog={[60, 420]} shadowSize={34} light={0.85}>
      <BigStreet seed="hook" lamps={false} trees={false} />
      <Hero pose={lookUp(1, { expression: "worried" })} position={[12.9, 0, 10]} yaw={Math.PI + 0.2} />
      <RemainsSky cam={a} t={c.t} rubble={[0.25, 0.6]} size={0.12} apex={[-0.1, 0.42]} />
      <Meteor from={[-120, 170, -320]} to={[60, 40, -360]} progress={clamp01(c.lt / 1.6) * 0.9} size={1.4} trail={40} seed="rm1" />
      <Meteor from={[40, 190, -300]} to={[160, 70, -340]} progress={clamp01((c.lt - 0.6) / 1.4) * 0.9} size={1.1} trail={34} seed="rm2" />
    </Shot>
  );
};

const c6Disaster: ShotFn = (c) => {
  const cam = move({ position: [9, 3.6, 11], target: [0, -0.5, 0] }, { position: [8.2, 3.3, 11.8], target: [0, -0.5, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={[-0.8, 0.4, 0.5]}>
      <FacetedEarth radius={3} position={[0, 0, 0]} rotation={[0.35, 3.0 + c.t * 0.06, 0]} cityLights={0.25} />
      <DebrisRing r={3} inner={1.4} outer={2.5} t={c.t} form={1} tilt={[0.22, 0, 0.16]} count={3600} size={0.03} />
      <Sun position={[-80, 30, -160]} />
    </Shot>
  );
};

/** A rooftop at night under the ring (roof top at y = 0, parapet at the edges, the city far below). */
const Rooftop: React.FC = () => (
  <group>
    <mesh position={[0, -0.5, -4]} receiveShadow>
      <BoxG args={[34, 1, 30]} />
      <Flat color="#4A4E5C" />
    </mesh>
    {[
      [0, -19, 34, 0.8],
      [-17, -4, 0.8, 30],
      [17, -4, 0.8, 30],
    ].map(([x, z, w, d], i) => (
      <mesh key={i} position={[x, 0.7, z]} castShadow receiveShadow>
        <BoxG args={[w, 1.4, d]} />
        <Flat color="#5A5E6C" />
      </mesh>
    ))}
    <group position={[-9, 0, -12]}>
      {[-1.6, 1.6].map((x) =>
        [-1.6, 1.6].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 2, z]} castShadow>
            <CylG args={[0.2, 0.2, 4, 6]} />
            <Flat color="#2B2F3E" />
          </mesh>
        )),
      )}
      <mesh position={[0, 6, 0]} castShadow>
        <CylG args={[2.6, 2.6, 4.4, 12]} />
        <Flat color="#7A5A44" />
      </mesh>
      <mesh position={[0, 8.6, 0]} castShadow>
        <IcoG args={[2.7, 1]} />
        <Flat color="#5A4A3C" />
      </mesh>
    </group>
    <mesh position={[8, 1.1, -10]} castShadow>
      <BoxG args={[4, 2.2, 3]} />
      <Flat color="#8E96A6" />
    </mesh>
    {Array.from({ length: 10 }, (_, i) => {
      const x = -90 + i * 20 + random(`rt${i}`) * 8;
      const h = 70 + random(`rth${i}`) * 50;
      return <Building key={i} position={[x, -80, -70 - random(`rtz${i}`) * 50]} w={16} d={16} h={h} color={[P.bldgNavy, P.bldgSlate, P.bldgPurple, P.bldgTeal][i % 4]} seed={`rt${i}`} power={0.6} />;
    })}
  </group>
);
const c6Rooftop: ShotFn = (c) => {
  const a: CameraSpec = { position: [2.6, 2.4, 12.5], target: [-1, 9.5, -30] };
  const cam = move(a, { position: [2.4, 2.3, 11.6], target: [-1, 10, -30] }, c);
  return (
    <Shot mood="night" dust={0.8} camera={cam} fog={[60, 420]} shadowSize={24} light={0.85}>
      <Rooftop />
      <Hero pose={lookUp(0.9, { expression: "worried", headYaw: 0.1 })} position={[0, 0, 0]} yaw={Math.PI - 0.45} />
      <RemainsSky cam={a} t={c.t} rubble={[0.3, 0.62]} size={0.13} apex={[-0.05, 0.42]} />
    </Shot>
  );
};

/** Back to calm: two moons on their own, well-separated orbits. */
const c6Calm: ShotFn = (c) => {
  const cam = move({ position: [0, 0.8, 26], target: [0, 0.6, 0] }, { position: [0, 0.8, 24], target: [0, 0.6, 0] }, c);
  const u1 = norm([0.1, 1, -0.1]);
  const v1 = norm([0.4, 0, 1]);
  const u2 = norm([-0.5, 1, 0.1]);
  const v2 = norm([0.2, 0, 1]);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.75} keyDir={[-0.8, 0.3, 0.5]}>
      <FacetedEarth radius={3} position={EARTH} rotation={[0.35, 1.8 + c.t * 0.1, 0]} />
      <OrbitPath points={ellipse(EARTH, u1, v1, 10.4, 160)} dotRadius={0.06} spacing={0.32} />
      <OrbitPath points={ellipse(EARTH, u2, v2, 6.8, 140)} dotRadius={0.06} spacing={0.32} color={P.amber} />
      <Moon kind="moon" radius={0.85} position={onEllipse(EARTH, u1, v1, 10.4, 0.1 + c.lt * 0.04)} glow={0.4} />
      <Moon kind="moon2" radius={0.9} position={onEllipse(EARTH, u2, v2, 6.8, 0.6 + c.lt * 0.06)} rotation={[0.4, 0.3, 0.2]} glow={0.4} />
      <Sun position={[-60, 18, -120]} />
    </Shot>
  );
};

/** The second Moon drifting toward us until it fills the frame. */
const c6Close: ShotFn = (c) => {
  const cam = move({ position: [0, 0, 12], target: [0, 0.3, 0] }, { position: [0, -0.1, 12.4], target: [0, 0.35, 0] }, c);
  const k = ease(clamp01(c.lt / 3.3));
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.75} keyDir={[-0.8, 0.4, 0.6]}>
      <Moon kind="moon" radius={1.2} position={[-6.5, 9, -70]} rotation={[0.2, 0.4, 0]} glow={0.4} />
      <Moon kind="moon2" radius={2.0} position={[0.5, 0.6, -42 + 44 * k]} rotation={[0.3, 0.5 + c.t * 0.12, 0.1]} crack={0.12 * k} glow={0.45} />
      <Sun position={[-90, 30, -200]} size={4} />
    </Shot>
  );
};

// ---------------------------------------------------------------- thumbnail

/** Shorts cover: Slavoski on the night street looking up at two huge moons, one of them cracking. */
export const thumbShot: ShotFn = () => {
  const cam: CameraSpec = { position: [17.2, 1.6, 15], target: [15.6, 19, -60] };
  return (
    <Shot mood="night" dust={0.15} camera={cam} fog={[60, 400]} shadowSize={30} light={0.85} keyDir={KEY1}>
      <BigStreet seed="hook" lamps={false} trees={false} />
      <Hero pose={lookUp(1.05, { lShoulder: [0.15, 0.4], rShoulder: [0.15, 0.4], expression: "alarm" })} position={[16.4, 0, 4]} yaw={Math.PI + 0.2} />
      <SkyMoons
        cam={cam}
        spots={[
          { kind: "moon", ndc: [-0.4, 0.2], size: 0.2 },
          { kind: "moon2", ndc: [0.42, -0.02], size: 0.26, crack: 0.35 },
        ]}
      />
      <SecondKey intensity={1.1} />
    </Shot>
  );
};

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldShadow },
    { cue: "had a", fn: coldUp },
  ],
  c1: [
    { cue: null, fn: c1City },
    { cue: "Two enormous", fn: c1Awe },
    { cue: "lighting up", fn: c1Sea },
    { cue: "But within", fn: c1Obs },
    { cue: "scientists", fn: c1Lab },
  ],
  c2: [
    { cue: null, fn: c2Diagram },
    { cue: "its gravity", fn: c2Pull },
    { cue: "And now", fn: c2Second },
    { cue: "pulling on", fn: c2Surge },
    { cue: "Depending", fn: c2Brink },
    { cue: "coastal cities", fn: c2CityFlood },
    { cue: "catastrophic", fn: c2StreetFlood },
  ],
  c3: [
    { cue: null, fn: c3Wide },
    { cue: "The two moons", fn: c3Tug },
    { cue: "Their orbits", fn: c3Chaos },
  ],
  c4: [
    { cue: null, fn: c4Roche },
    { cue: "gravity could", fn: c4Tear },
    { cue: "sending", fn: c4Chunks },
    { cue: "hurtling", fn: c4Stream },
    { cue: "Some of those", fn: c4Meteors },
    { cue: "strike", fn: c4Impact },
  ],
  c5: [
    { cue: null, fn: c5Fear },
    { cue: "The second moon could", fn: c5Approach },
    { cue: "with our original", fn: c5Hit },
    { cue: "creating", fn: c5Cloud },
    { cue: "around our planet", fn: c5Ring },
  ],
  c6: [
    { cue: null, fn: c6Up },
    { cue: "humanity", fn: c6Crowd },
    { cue: "two beautiful", fn: c6Crumble },
    { cue: "We'd be", fn: c6Remains },
    { cue: "cosmic disaster", fn: c6Disaster },
    { cue: "Because the most", fn: c6Rooftop },
    { cue: "isn't having", fn: c6Calm },
    { cue: "it's what", fn: c6Close },
  ],
};
