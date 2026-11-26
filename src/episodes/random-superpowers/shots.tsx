/**
 * Shots for "What If Every Human Got a Random Superpower?" (ep. 8).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * The hook opens on Slavoski, not on Earth: a ring of light drops over him, then a wave of powers
 * sweeps the suburb, the neighbour flies, the friend teleports… and Slavoski gets sock colours.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Building, Car, CAR_HALF_LENGTH, CityGrid, Ground, Lamp, Road, StreetSet, streetLayout } from "../../slavoski/city";
import { Bird } from "../../slavoski/critters";
import { BoxG, CylG, IcoG } from "../../slavoski/detail";
import { FONT } from "../../slavoski/fonts";
import { Debris, Meteor, Shockwave, SmokeCluster } from "../../slavoski/fx";
import { crowdLook, POLICE_OFFICER, SLAVOSKI, suitLook, type HeroLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Clouds, LightningBolt, Rain } from "../../slavoski/nature";
import { clamp01, ease, noise1, type V3 } from "../../slavoski/noise";
import { CardLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import { DIM, groundedBob, handPosition, headPosition, Hero, legJoints, mergePose, reach, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { CanvasPanel } from "../../slavoski/screens";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import { type CuedShot } from "../../slavoski/timeline";
import { VanishPuff } from "../no-humans/props";
import { CoinPile, HillRing, Skyline } from "../no-work-2036/props";
import { Bubble, Capitol } from "../smart-animals/props";
import { CITY, Jet } from "../ww3-countdown/props";
import { SOCK_COLORS } from "./narration";
import {
  aim,
  AURA_LIST,
  Aura,
  Coin,
  CrowdSea,
  DescendRing,
  Diploma,
  drawBoard,
  Flyer,
  FLY_POSE,
  FrozenRain,
  Handbag,
  Hangar,
  lerp3,
  LUCKY,
  MIND_LOOK,
  Mortarboard,
  POWER_COLORS,
  PowerStream,
  PowerTiers,
  PowerWave,
  RECRUIT,
  RecruitDesk,
  RECRUIT_DESK,
  Saucer,
  Searchlight,
  Sparks,
  StreetTile,
  Suburb,
  Tank,
  ThoughtPuff,
  tierStandZ,
  tierTop,
  TIERS,
} from "./props";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
const lin = (lt: number, a: number, b: number) => clamp01((lt - a) / (b - a));
const startFrame = (c: ShotCtx) => Math.round((c.t - c.lt) * 30);

/** Kit street ×3.5 so it matches the people (road |x| < 12.25, pavements to 21.35). `day` dims practicals. */
const BigStreet: React.FC<React.ComponentProps<typeof StreetSet> & { day?: boolean }> = ({ day = false, ...props }) => (
  <group scale={CITY}>
    <StreetSet {...props} lampsOn={day ? false : props.lampsOn} modify={day ? (sp, i) => ({ power: 0.35, ...(props.modify?.(sp, i) ?? {}) }) : props.modify} />
  </group>
);

const Shot: React.FC<{ children: React.ReactNode; overlay?: React.ReactNode; filter?: string } & React.ComponentProps<typeof Stage>> = ({ children, overlay, filter, ...stage }) => (
  <AbsoluteFill style={filter ? { filter } : undefined}>
    <Stage {...stage}>{children}</Stage>
    {overlay}
  </AbsoluteFill>
);

const CLOUD = { day: "#F4F6FA", dawn: "#F2C6B0", sunset: "#F7C0A0", storm: "#323A48", overcast: "#AEB6C2", dust: "#8A6A6A" } as const;
const Sky: React.FC<{ t: number; tint: keyof typeof CLOUD; y?: number; radius?: number; count?: number; seed?: string }> = ({ t, tint, y = 45, radius = 200, count = 16, seed = "sky" }) => (
  <Clouds t={t} color={CLOUD[tint]} y={y} radius={radius} count={count} seed={seed} />
);

/** Slavoski in this episode: his usual look plus visible socks (pink by default, his power colour). */
const SLAV = (sock: string = POWER_COLORS.socks): HeroLook => ({ ...SLAVOSKI, sock });
const sockAt = (t: number) => SOCK_COLORS[Math.floor(t / 0.2) % SOCK_COLORS.length];

/** Small flickering fire (a burning car, a fire-power hand). */
const Flames: React.FC<{ position: V3; t: number; size?: number; seed?: string; light?: boolean }> = ({ position, t, size = 1, seed = "fl", light = true }) => (
  <group position={position} scale={size}>
    {Array.from({ length: 7 }, (_, i) => {
      const k = (t * 1.6 + random(`${seed}${i}`)) % 1;
      const x = (random(`${seed}x${i}`) - 0.5) * 1.6;
      const z = (random(`${seed}z${i}`) - 0.5) * 1.2;
      const s = (0.55 + random(`${seed}s${i}`) * 0.4) * (1 - k * 0.7);
      return (
        <mesh key={i} position={[x * (1 - k * 0.5), k * 2.4, z]}>
          <IcoG args={[s, 1]} />
          <Glow color={k < 0.35 ? P.fireCore : k < 0.7 ? P.fire : P.meteor} opacity={1 - k * 0.6} />
        </mesh>
      );
    })}
    <Halo position={[0, 1, 0]} size={6} color={P.fire} opacity={0.6} />
    {light ? <pointLight position={[0, 1.5, 0]} color={P.fire} intensity={6} distance={24} decay={2} /> : null}
  </group>
);

/** A word struck through in red (WEALTH, EDUCATION): it pops in, then the line slashes across. */
const StrikeCard: React.FC<{ text: string; lt: number; y?: number }> = ({ text, lt, y = 500 }) => {
  const s = k01(lt, 0.05, 0.3);
  const line = k01(lt, 0.35, 0.6);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", fontFamily: FONT, opacity: s, transform: `scale(${0.85 + 0.15 * s})` }}>
      <div style={{ position: "relative", display: "inline-block", padding: "14px 34px", borderRadius: 14, background: "rgba(8,10,24,0.62)", border: "2px solid rgba(255,255,255,0.35)" }}>
        <span style={{ fontWeight: 700, fontSize: 64, letterSpacing: "0.06em", color: line > 0.5 ? "rgba(255,255,255,0.55)" : P.white }}>{text}</span>
        <div style={{ position: "absolute", left: 18, top: "50%", height: 10, width: `calc((100% - 36px) * ${line})`, background: "#FF4A3A", borderRadius: 6, transform: "rotate(-4deg)", boxShadow: "0 0 14px rgba(255,74,58,0.6)" }} />
      </div>
    </div>
  );
};

/** A big red cross over the frame ("it wouldn't be this"). */
const CrossOut: React.FC<{ k: number }> = ({ k }) => {
  if (k <= 0) return null;
  const bar = (rot: number, d: number) => {
    const w = 820 * ease(clamp01((k - d) / 0.5));
    return (
      <div
        style={{
          position: "absolute",
          left: 540 - w / 2,
          top: 900 - 17,
          width: w,
          height: 34,
          background: "#FF4A3A",
          borderRadius: 18,
          transform: `rotate(${rot}deg)`,
          boxShadow: "0 0 30px rgba(255,74,58,0.55), 0 0 0 6px rgba(11,11,20,0.6)",
        }}
      />
    );
  };
  return (
    <AbsoluteFill>
      {bar(50, 0)}
      {bar(-50, 0.25)}
    </AbsoluteFill>
  );
};

const Flash: React.FC<{ o: number }> = ({ o }) => (o > 0 ? <AbsoluteFill style={{ background: `rgba(235,240,255,${o})` }} /> : null);
const flashAt = (lt: number, ts: number[], len = 0.12) => Math.max(0, ...ts.map((s) => (lt >= s && lt < s + len ? 1 - (lt - s) / len : 0)));

// ---------------------------------------------------------------- cold open: the hook (sunny afternoon suburb)

/** Slavoski's spot: the pavement in front of his house (house at x = 0, z = -17). */
const SL: V3 = [0, 0, -6.2];
/** The neighbour's lawn (house at x = 16). */
const NB: V3 = [16, 0, -10];
const NB_LOOK = crowdLook(8);
const FRIEND_LOOK = crowdLook(31);

/** 0 s: a ring of light drops over Slavoski — his eyes go wide. */
const coldRing: ShotFn = (c) => {
  const cam = move({ position: [1.5, 3.8, 4.4], target: [0, 3.1, SL[2]] }, { position: [1.1, 3.7, 2.8], target: [0, 3.15, SL[2]] }, c);
  const up = 1 - k01(c.lt, 0.35, 0.75);
  const arms = 0.35 + 0.35 * (1 - up);
  const pose = mergePose(REST, { headPitch: 0.4 * up, expression: c.lt < 0.55 ? "awe" : "alarm", lShoulder: [0.15, arms], rShoulder: [0.15, arms], lElbow: 0.5, rElbow: 0.5 });
  return (
    <Shot mood="day" camera={cam} fog={[60, 320]} shadowSize={20}>
      <Suburb front={false} />
      <Sky t={c.t} tint="day" seed="sub" />
      <Hero pose={pose} position={SL} look={SLAV()} />
      <DescendRing position={SL} k={lin(c.lt, 0.02, 1.0)} radius={1.75} top={5.6} />
      <Aura position={SL} color={P.amber} t={c.t} k={k01(c.lt, 0.7, 1.2) * 0.6} shell={false} />
    </Shot>
  );
};

/** The people on the lawns of the street (back row z ≈ -10, front row z ≈ +9.6). */
const LAWN_PEOPLE: { p: V3; yaw: number; seed: number }[] = [
  { p: [-30, 0, -10], yaw: 0.2, seed: 2 },
  { p: [-15, 0, -9.8], yaw: -0.3, seed: 5 },
  { p: NB, yaw: 0.1, seed: 8 },
  { p: [33, 0, -10], yaw: -0.2, seed: 11 },
  { p: [-22, 0, 9.6], yaw: Math.PI, seed: 14 },
  { p: [10, 0, 9.4], yaw: Math.PI + 0.3, seed: 19 },
  { p: [24, 0, 9.8], yaw: Math.PI, seed: 23 },
  { p: [-8, 0, 6.4], yaw: 2.8, seed: 27 },
];
const WAVE_C: V3 = [-80, 0, -30];

/** From above: a golden wave sweeps the suburb, and every person it passes lights up. */
const coldWave: ShotFn = (c) => {
  const cam = move({ position: [6, 72, 22], target: [0, 0, -5] }, { position: [5, 66, 18], target: [0, 0, -5] }, c);
  const r = 30 + c.lt * 80;
  const hit = (p: V3) => clamp01((r - Math.hypot(p[0] - WAVE_C[0], p[2] - WAVE_C[2])) / 8);
  return (
    <Shot mood="day" camera={cam} fog={[90, 420]} shadowSize={70}>
      <Suburb front={false} />
      <Sky t={c.t} tint="day" seed="sub" y={40} />
      <PowerWave center={WAVE_C} radius={r} height={9} />
      {LAWN_PEOPLE.map((q, i) => (
        <React.Fragment key={i}>
          <Hero pose={mergePose(REST, { headPitch: 0.4, expression: "awe" })} position={q.p} yaw={q.yaw} look={crowdLook(q.seed)} />
          <Aura position={q.p} color={AURA_LIST[i % AURA_LIST.length]} t={c.t} k={hit(q.p)} shell={false} seed={`w${i}`} />
        </React.Fragment>
      ))}
      <Hero pose={mergePose(REST, { headPitch: 0.4, expression: "awe" })} position={SL} look={SLAV()} />
      <Aura position={SL} color={POWER_COLORS.socks} t={c.t} k={hit(SL) * 0.35} shell={false} />
    </Shot>
  );
};

const handsPose = (expr: Pose["expression"] = "awe"): Pose => mergePose(REST, { lShoulder: [0.85, 0.12], rShoulder: [0.85, 0.12], lElbow: 1.25, rElbow: 1.25, headPitch: -0.45, expression: expr });

/** Street level: everyone staring at their own hands, each glowing a different colour… Slavoski barely sparkles. */
const coldAuras: ShotFn = (c) => {
  const cam = move({ position: [-12, 3.0, 1.5], target: [14.7, 3.4, -12.1] }, { position: [-11, 3.0, 1.0], target: [14.7, 3.5, -12.1] }, c);
  const people: { p: V3; yaw: number; look: HeroLook; color: string }[] = [
    { p: [4, 0, -6.6], yaw: -1.3, look: crowdLook(29), color: POWER_COLORS.teleport },
    { p: [14, 0, -9], yaw: -1.5, look: NB_LOOK, color: POWER_COLORS.flight },
  ];
  return (
    <Shot mood="day" camera={cam} fog={[60, 320]} shadowSize={30}>
      <Suburb front={false} />
      <Sky t={c.t} tint="day" seed="sub" />
      {people.map((q, i) => (
        <React.Fragment key={i}>
          <Hero pose={handsPose()} position={q.p} yaw={q.yaw} look={q.look} />
          <Aura position={q.p} color={q.color} t={c.t} seed={`a${i}`} />
        </React.Fragment>
      ))}
      <Hero pose={handsPose("worried")} position={SL} yaw={-1.25} look={SLAV()} />
      <Sparks center={[SL[0], 0.1, SL[2]]} t={c.t} color={POWER_COLORS.socks} count={5} radius={0.6} height={0.8} size={0.06} />
    </Shot>
  );
};

const V_ARMS: Partial<Pose> = { lShoulder: [0.25, 2.4], rShoulder: [0.25, 2.4], lElbow: 0.15, rElbow: 0.15, lHip: [0, 0.01], rHip: [0, 0.01], lKnee: 0.15, rKnee: 0.15 };

/** "Your neighbor can fly": over Slavoski's shoulder, the neighbour lifts off his lawn. */
const coldFly: ShotFn = (c) => {
  const lift = 11 * ease(lin(c.lt, 0.1, 1.35));
  const cam = move({ position: [-11, 1.4, -0.5], target: [15, 5 + lift * 0.75, -9.4] }, { position: [-10.2, 1.4, -0.8], target: [15, 5.4 + lift * 0.8, -9.4] }, c);
  const yaw = Math.atan2(NB[0] - SL[0], NB[2] - SL[2]);
  return (
    <Shot mood="day" camera={cam} fog={[60, 320]} shadowSize={30}>
      <Suburb front={false} />
      <Sky t={c.t} tint="day" seed="sub" />
      <Hero pose={mergePose(REST, { headPitch: 0.25 + 0.45 * ease(lin(c.lt, 0.2, 1.2)), expression: "awe" })} position={SL} yaw={yaw} look={SLAV()} />
      <Hero pose={mergePose(REST, { ...V_ARMS, expression: "smile", headPitch: 0.2 })} position={[NB[0], lift, NB[2]]} look={NB_LOOK} />
      <Aura position={[NB[0], lift, NB[2]]} color={POWER_COLORS.flight} t={c.t} shell={false} />
      <Shockwave position={[NB[0], 0.1, NB[2]]} progress={lin(c.lt, 0.1, 0.7)} radius={6} color={POWER_COLORS.flight} />
    </Shot>
  );
};

const FRIEND_FAR: V3 = [-22, 0, -6.4];
const FRIEND_NEAR: V3 = [-1.9, 0, -4.4];

/** "Your best friend can teleport": a wave far down the pavement… pop… and he's right next to Slavoski. */
const coldTeleport: ShotFn = (c) => {
  const cam = move({ position: [13, 3.4, -2.4], target: [-8, 2.8, -6.6] }, { position: [12, 3.3, -2.6], target: [-8, 2.8, -6.6] }, c);
  const gone = lin(c.lt, 0.35, 0.7);
  const back = 1 - lin(c.lt, 0.8, 1.1);
  const jump = Math.sin(Math.PI * lin(c.lt, 1.05, 1.45));
  const wave = (lt: number): Partial<Pose> => ({ rShoulder: [0.3, 2.35 + Math.sin(lt * 10) * 0.2], rElbow: 0.35, expression: "smile" });
  const slav = mergePose(REST, {
    bob: jump * 0.7,
    expression: c.lt > 1.0 ? "alarm" : "neutral",
    headYaw: c.lt > 0.95 ? 0.5 : -0.15,
    lShoulder: [0.1, 0.12 + jump * 1.2],
    rShoulder: [0.1, 0.12 + jump * 1.2],
    lKnee: jump * 0.4,
    rKnee: jump * 0.4,
  });
  return (
    <Shot mood="day" camera={cam} fog={[60, 320]} shadowSize={30}>
      <Suburb front={false} />
      <Sky t={c.t} tint="day" seed="sub" />
      <Hero pose={slav} position={SL} yaw={Math.PI / 2 - 0.35} look={SLAV()} />
      {gone < 1 ? <Hero pose={mergePose(REST, wave(c.lt))} position={FRIEND_FAR} yaw={Math.PI / 2} look={FRIEND_LOOK} vanish={gone} /> : null}
      <VanishPuff center={[FRIEND_FAR[0], 2.4, FRIEND_FAR[2]]} progress={lin(c.lt, 0.35, 0.95)} seed="tpa" />
      {c.lt > 0.8 ? <Hero pose={mergePose(REST, wave(c.lt))} position={FRIEND_NEAR} yaw={Math.PI / 2 - 0.9} look={FRIEND_LOOK} vanish={back} /> : null}
      <VanishPuff center={[FRIEND_NEAR[0], 2.4, FRIEND_NEAR[2]]} progress={lin(c.lt, 0.8, 1.4)} seed="tpb" />
      <Aura position={FRIEND_NEAR} color={POWER_COLORS.teleport} t={c.t} k={c.lt > 0.8 ? 1 - back : 0} shell={false} />
    </Shot>
  );
};

const strainPose = (): Pose => {
  const base = mergePose(REST, {
    lHip: [0.35, 0.16],
    rHip: [0.35, 0.16],
    lKnee: 0.7,
    rKnee: 0.7,
    lean: 0.16,
    lShoulder: [0.85, 0.3],
    rShoulder: [0.85, 0.3],
    lElbow: 1.7,
    rElbow: 1.7,
    expression: "worried",
    headPitch: -0.02,
  });
  return { ...base, bob: groundedBob(base) };
};

/** "But you…": Slavoski strains with everything he has. */
const coldStrain: ShotFn = (c) => {
  const cam = move({ position: [0.5, 2.8, 4.2], target: [0, 2.5, SL[2]] }, { position: [0.4, 2.7, 2.6], target: [0, 2.5, SL[2]] }, c);
  const jitter = noise1("strain", c.t * 14) * 0.03;
  return (
    <Shot mood="day" camera={cam} fog={[60, 320]} shadowSize={20} shake={0.02} shakeSeed="strain">
      <Suburb front={false} />
      <Sky t={c.t} tint="day" seed="sub" />
      <Hero pose={strainPose()} position={[SL[0] + jitter, 0, SL[2]]} look={SLAV()} />
      <Sparks center={[SL[0], 0.1, SL[2]]} t={c.t} color={POWER_COLORS.socks} count={6} radius={0.7} height={0.9} size={0.07} k={k01(c.lt, 1.0, 1.3)} />
    </Shot>
  );
};

/** "…change the color of your socks": the socks flick through colours, each change a little sparkle. */
const coldSocks: ShotFn = (c) => {
  const cam = move({ position: [1.5, 0.95, -2.4], target: [0, 0.6, SL[2]] }, { position: [1.2, 0.85, -3.0], target: [0, 0.6, SL[2]] }, c);
  const flash = 1 - ((c.t / 0.2) % 1);
  return (
    <Shot mood="day" camera={cam} fog={[60, 320]} shadowSize={10}>
      <Suburb front={false} />
      <Hero pose={REST} position={SL} look={SLAV(sockAt(c.t))} />
      {(["l", "r"] as const).map((s) => {
        const a = legJoints(REST, s, SL).ankle;
        return <Halo key={s} position={[a[0], a[1] + 0.25, a[2] + 0.25]} size={1.4} color={sockAt(c.t)} opacity={0.7 * flash} />;
      })}
      <Sparks center={[SL[0], 0.05, SL[2]]} t={c.t} color="#FFFFFF" count={8} radius={0.75} height={0.9} size={0.05} />
    </Shot>
  );
};

/** His face: unimpressed. */
const coldDeadpan: ShotFn = (c) => {
  const cam = move({ position: [0.15, 3.6, -0.8], target: [0, 3.52, SL[2]] }, { position: [0.1, 3.58, -1.7], target: [0, 3.53, SL[2]] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 320]} shadowSize={10}>
      <Suburb front={false} />
      <Sky t={c.t} tint="day" seed="sub" />
      <Hero pose={mergePose(REST, { blink: 0.45, headPitch: -0.04, lShoulder: [0.04, 0.06], rShoulder: [0.04, 0.06] })} position={SL} look={SLAV()} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 pure chaos (dusty sunset)

/** "Within hours, chaos": flyers zigzag between the buildings, a car floats upside down, another burns. */
const c1Street: ShotFn = (c) => {
  const cam = move({ position: [3, 4.5, 44], target: [0, 15, -30] }, { position: [3, 4.8, 40], target: [0, 15.5, -30] }, c);
  const fly = (a: V3, b: V3, k: number) => ({ p: lerp3(a, b, k), ...aim(a, b) });
  const f1 = fly([-9, 18, 10], [8, 32, -50], lin(c.lt, 0, 1.4));
  const f2 = fly([10, 26, -40], [-8, 20, 2], lin(c.lt, 0, 1.4));
  const run = (i: number): V3 => [15.5 + i * 1.8, 0, 6 + c.lt * 7 - i * 6];
  return (
    <Shot mood="sunset" dust={0.3} camera={cam} fog={[40, 260]} shadowSize={40}>
      <BigStreet seed="chaos" cars={false} />
      <Sky t={c.t} tint="sunset" seed="chaos" y={60} radius={240} />
      <Flyer position={f1.p} yaw={f1.yaw} pitch={f1.pitch} look={crowdLook(3)} trail={10} aura={POWER_COLORS.flight} t={c.t} />
      <Flyer position={f2.p} yaw={f2.yaw} pitch={f2.pitch} look={crowdLook(6)} trail={8} aura={POWER_COLORS.teleport} t={c.t} />
      <group scale={CITY}>
        <group position={[-1.7, 2.7 + Math.sin(c.t * 2) * 0.1, -12]} rotation={[0.4, 0.5 + c.lt * 0.4, 2.7]}>
          <Car position={[0, -0.7, 0]} color={P.carTeal} />
        </group>
        <Car position={[1.7, 0, -5]} yaw={Math.PI} color={P.carRed} rust={0.4} />
      </group>
      <Halo position={[-1.7 * CITY, 2.7 * CITY, -12 * CITY]} size={16} color={POWER_COLORS.teleport} opacity={0.4} />
      <Flames position={[1.7 * CITY, 3.4, -5 * CITY]} t={c.t} size={1.8} seed="car" />
      {[0, 1, 2].map((i) => (
        <Hero key={i} pose={mergePose(walkPose(c.lt * 2.4 + i * 0.3, 1.2), { lean: 0.22, expression: "alarm" })} position={run(i)} look={crowdLook(50 + i)} />
      ))}
      <SmokeCluster position={[-32, 30, -80]} progress={0.7} radius={8} rise={5} seed="cs1" />
      <SmokeCluster position={[26, 22, -110]} progress={0.6} radius={9} rise={6} seed="cs2" />
    </Shot>
  );
};

/** From above: trails crisscross the sunset city, smoke columns rise, someone throws lightning at a crossroad. */
const c1Aerial: ShotFn = (c) => {
  const cam = move({ position: [52, 56, 82], target: [0, 6, 0] }, { position: [48, 53, 76], target: [0, 6, 0] }, c);
  const trails: [V3, V3][] = [
    [[-60, 32, 10], [60, 40, -20]],
    [[40, 28, 50], [-30, 36, -60]],
    [[-20, 44, -60], [30, 30, 40]],
    [[60, 36, 30], [-60, 42, 10]],
  ];
  const bolt = c.lt % 0.42 < 0.14 ? 1 : 0;
  return (
    <Shot mood="sunset" dust={0.35} camera={cam} fog={[60, 320]} shadowSize={70}>
      <CityGrid seed="chaos" blocks={7} block={14} modify={() => ({ power: 0.7 })} />
      <Skyline radius={130} seed="chaosring" power={0.6} />
      <Sky t={c.t} tint="sunset" seed="chaosair" y={70} radius={260} />
      {trails.map(([a, b], i) => {
        const k = (c.lt * 0.5 + i * 0.23) % 1;
        const { yaw, pitch } = aim(a, b);
        return <Flyer key={i} position={lerp3(a, b, k)} yaw={yaw} pitch={pitch} look={crowdLook(60 + i)} trail={16} scale={1.3} aura={AURA_LIST[i]} t={c.t} />;
      })}
      <SmokeCluster position={[-14, 14, -14]} progress={0.7} radius={6} rise={6} seed="as1" />
      <SmokeCluster position={[21, 12, 7]} progress={0.55} radius={5} rise={5} seed="as2" />
      <SmokeCluster position={[-7, 12, 28]} progress={0.6} radius={5} rise={5} seed="as3" />
      <LightningBolt top={[24, 80, -50]} bottom={[7, 0.6, -21]} flash={bolt} seed="ab" />
      <Halo position={[7, 1.5, -21]} size={10} color="#CFE6FF" opacity={0.3 + bolt * 0.6} />
      <Flames position={[-21, 0, 7]} t={c.t} size={1.6} seed="af1" light={false} />
      <Flames position={[21, 0, -7]} t={c.t} size={1.4} seed="af2" light={false} />
    </Shot>
  );
};

/** Super strength: a light push… and the car tumbles away down the street. */
const STRONG_LOOK = crowdLook(5);
const PUSHER: V3 = [-2, 0, 9];
const c1Fling: ShotFn = (c) => {
  const cam = move({ position: [-6, 3.8, 23], target: [-1.5, 4.2, -6] }, { position: [-5.6, 4.0, 21.5], target: [-1.5, 4.6, -6] }, c);
  const base = mergePose(REST, { lHip: [-0.25, 0.05], rHip: [0.35, 0.05], rKnee: 0.25, lean: 0.12, expression: c.lt < 0.4 ? "smile" : "alarm" });
  const carHalf = CAR_HALF_LENGTH * CITY;
  const contactZ = PUSHER[2] - 2.0;
  const push = reach(base, "r", [PUSHER[0] - 0.3, 2.3, contactZ], { position: PUSHER, yaw: Math.PI }).pose;
  const pose = c.lt < 0.45 ? push : mergePose(push, { lShoulder: [0.3, 1.1], expression: "alarm", headPitch: 0.25 });
  const k = lin(c.lt, 0.35, 1.55);
  const fist = handPosition(push, "r", PUSHER, Math.PI);
  const carZ = fist[2] - DIM.fistR - carHalf - 70 * k;
  const pivotY = 0.7 * CITY + 16 * Math.sin(Math.PI * k);
  return (
    <Shot mood="sunset" dust={0.3} camera={cam} fog={[40, 260]} shadowSize={40} shake={c.lt > 0.35 && c.lt < 0.7 ? 0.12 : 0} shakeSeed="push">
      <BigStreet seed="lift" cars={false} trees={false} />
      <Sky t={c.t} tint="sunset" seed="lift" y={60} radius={240} />
      <Hero pose={pose} position={PUSHER} yaw={Math.PI} look={STRONG_LOOK} />
      <Aura position={PUSHER} color={POWER_COLORS.strength} t={c.t} k={0.8} shell={false} />
      <group position={[PUSHER[0] - 0.3, pivotY, carZ]} rotation={[-2 * Math.PI * k, 0, 0]}>
        <group scale={CITY}>
          <Car position={[0, -0.7, 0]} color="#E8E4DA" />
        </group>
      </group>
      <Shockwave position={[fist[0], fist[1], fist[2] - 0.2]} progress={lin(c.lt, 0.35, 0.8)} radius={4} color={POWER_COLORS.strength} />
      <Hero pose={mergePose(REST, { expression: "alarm", lShoulder: [0.2, 1.6], rShoulder: [0.2, 1.6], headYaw: 0.3 })} position={[-14, 0, -18]} yaw={1.0} look={crowdLook(54)} />
      <Hero pose={mergePose(REST, { expression: "alarm", headYaw: 0.4 })} position={[-17, 0, -26]} yaw={0.9} look={crowdLook(55)} />
    </Shot>
  );
};

/** "…accidentally destroy buildings": he leans on a wall to catch his breath, and the building keels over. */
const LEAN_SEED = "lean";
const LEAN_SPECS = streetLayout(LEAN_SEED);
const LEAN_I = (() => {
  let best = -1;
  LEAN_SPECS.forEach((s, i) => {
    if (s.position[0] <= 0) return;
    if (best < 0 || Math.abs(s.position[2] + 9) < Math.abs(LEAN_SPECS[best].position[2] + 9)) best = i;
  });
  return best;
})();
const LEAN_B = LEAN_SPECS[LEAN_I];
const WALL_X = (LEAN_B.position[0] - (LEAN_B.w ?? 3.4) / 2) * CITY;
const WALL_Z = LEAN_B.position[2] * CITY;
const LEANER: V3 = [WALL_X - 1.75, 0, WALL_Z + 1.2];
const c1Building: ShotFn = (c) => {
  const cam = move({ position: [3, 4.5, WALL_Z + 24], target: [WALL_X + 3, 9, WALL_Z - 3] }, { position: [3.5, 4.8, WALL_Z + 22.5], target: [WALL_X + 3, 9.6, WALL_Z - 3] }, c);
  const fall = k01(c.lt, 0.25, 1.6);
  const lean = reach(mergePose(REST, { lean: 0.1, expression: "smile" }), "r", [WALL_X - 0.24, 3.1, WALL_Z + 0.6], { position: LEANER, yaw: Math.PI / 2 }).pose;
  const pose = c.lt < 0.3 ? lean : mergePose(REST, { expression: "alarm", lShoulder: [0.2, 1.7], rShoulder: [0.2, 1.7], lElbow: 0.6, rElbow: 0.6, headPitch: 0.45, lean: -0.08 });
  return (
    <Shot mood="sunset" dust={0.35} camera={cam} fog={[40, 260]} shadowSize={50} shake={c.lt > 0.3 ? 0.14 * (1 - fall * 0.5) : 0} shakeSeed="fall">
      <BigStreet seed={LEAN_SEED} cars={false} trees={false} lamps={false} modify={(_, i) => (i === LEAN_I ? { tilt: [0, 0.42 * fall], sink: 0.35 * fall } : {})} />
      <Sky t={c.t} tint="sunset" seed="lean" y={60} radius={240} />
      <Hero pose={pose} position={LEANER} yaw={c.lt < 0.3 ? Math.PI / 2 : Math.PI / 2 - 0.9} look={STRONG_LOOK} />
      <Aura position={LEANER} color={POWER_COLORS.strength} t={c.t} k={0.7} shell={false} />
      <Debris origin={[WALL_X + 1, 7, WALL_Z]} t={c.lt - 0.35} count={18} speed={6} seed="lb" color={LEAN_B.color ?? P.bldgSlate} />
      <SmokeCluster position={[WALL_X + 9, 0, WALL_Z - 4]} progress={lin(c.lt, 0.6, 2.4)} radius={5} rise={4} seed="ls" />
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 no more secrets (blue-hour dusk)

const MR: V3 = [17.6, 0, 7];
const PASSERS = [
  { x: 14.6, z0: -1, seed: 70, text: "I ATE YOUR\nLUNCH", off: [90, -150] as [number, number] },
  { x: 19.8, z0: -6, seed: 71, text: "I CAN'T\nSWIM", off: [-70, -170] as [number, number] },
  { x: 14.2, z0: -12, seed: 72, text: "I CHEATED\nAT CARDS", off: [110, -120] as [number, number] },
];

/** A mind reader on the pavement, eyes glowing; above every passer-by a thought pops up. */
const c2Mind: ShotFn = (c) => {
  const cam = move({ position: [16.5, 4.0, 19.5], target: [16.6, 3.7, 2] }, { position: [16.6, 4.0, 18.2], target: [16.6, 3.8, 2] }, c);
  const head = headPosition(REST, MR, -0.25);
  return (
    <Shot
      mood="dawn"
      camera={cam}
      fog={[30, 220]}
      shadowSize={30}
      light={0.85}
      overlay={PASSERS.map((q, i) => (
        <Bubble key={i} think text={q.text} at={[q.x, 4.9, q.z0 + c.lt * 1.2]} cam={cam} width={c.width} height={c.height} offset={q.off} appear={lin(c.lt, 0.15 + i * 0.25, 0.4 + i * 0.25)} size={30} />
      ))}
    >
      <BigStreet seed="dusk" trees={false} lamps={false} />
      <Sky t={c.t} tint="dawn" seed="dusk" y={60} radius={240} />
      <Hero pose={mergePose(REST, { expression: "smile", headYaw: -0.2 })} position={MR} yaw={-0.25} look={MIND_LOOK} />
      <Halo position={head} size={3.4} color={POWER_COLORS.mind} opacity={0.5} />
      <mesh position={[head[0], head[1] + 1.15, head[2]]} rotation={[Math.PI / 2, 0, c.t * 2]}>
        <torusGeometry args={[0.7, 0.05, 6, 28]} />
        <Glow color={POWER_COLORS.mind} />
      </mesh>
      {PASSERS.map((q, i) => (
        <Hero key={i} pose={walkPose(c.lt * 1.1 + i * 0.37, 0.7)} position={[q.x, 0, q.z0 + c.lt * 1.2]} look={crowdLook(q.seed)} />
      ))}
    </Shot>
  );
};

/** Millions of secrets: thought bubbles pop up over the whole city at dusk. */
const PUFFS = Array.from({ length: 90 }, (_, i) => {
  const roads = [-35, -21, -7, 7, 21, 35];
  const r = roads[i % 6];
  const along = (random(`pf${i}`) - 0.5) * 90;
  const onX = i % 2 === 0;
  return { x: onX ? r : along, z: onX ? along : r, y: 8 + random(`pfy${i}`) * 7, at: random(`pft${i}`) * 1.1 };
});
const c2Secrets: ShotFn = (c) => {
  const a = { position: [46, 54, 74] as V3, target: [0, 2, 0] as V3 };
  const cam = move(a, { position: [42, 50, 68], target: [0, 2, 0] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 320]} shadowSize={70} light={0.85}>
      <CityGrid seed="dusk" blocks={7} block={14} />
      <Skyline radius={130} seed="duskring" />
      <Sky t={c.t} tint="dawn" seed="duskair" y={70} radius={260} />
      {PUFFS.map((p, i) => (
        <ThoughtPuff key={i} position={[p.x, p.y, p.z]} scale={1.5} yaw={Math.atan2(cam.position[0] - p.x, cam.position[2] - p.z)} pop={lin(c.lt, p.at, p.at + 0.25)} />
      ))}
    </Shot>
  );
};

/** "…and anyone invisible": a man walking toward us fades away to almost nothing. */
const c2Fade: ShotFn = (c) => {
  const cam = move({ position: [17.5, 4.0, 16], target: [17, 3.4, 0] }, { position: [17.4, 4.0, 14.5], target: [17, 3.4, 0] }, c);
  const pos: V3 = [17, 0, -2 + c.lt * 1.8];
  const ghost = c.lt < 0.4 ? 0 : 0.9 - 0.8 * lin(c.lt, 0.4, 1.2);
  return (
    <Shot mood="dawn" camera={cam} fog={[30, 220]} shadowSize={30} light={0.85}>
      <BigStreet seed="dusk" trees={false} lamps={false} />
      <Sky t={c.t} tint="dawn" seed="dusk" y={60} radius={240} />
      <Hero pose={mergePose(walkPose(c.lt * 1.3, 0.8), { expression: "smile" })} position={pos} look={crowdLook(23)} ghost={ghost} />
      <VanishPuff center={[pos[0], 2.4, pos[2]]} progress={lin(c.lt, 0.4, 1.0)} seed="inv" />
      <Hero pose={mergePose(REST, { headYaw: 0.3 })} position={[13.6, 0, -14]} yaw={0.2} look={POLICE_OFFICER} />
    </Shot>
  );
};

/** "…almost impossible to catch": the officer looks around; a handbag floats past him on its own. */
const c2Catch: ShotFn = (c) => {
  const cam = move({ position: [14.6, 3.7, 14], target: [17.4, 3.0, 1] }, { position: [15.0, 3.7, 12.8], target: [17.4, 3.0, 1] }, c);
  const gp: V3 = [21 - c.lt * 3.2, 0, 3.6];
  const gpose = walkPose(c.lt * 1.4, 0.8);
  const hand = handPosition(gpose, "r", gp, -Math.PI / 2);
  return (
    <Shot mood="dawn" camera={cam} fog={[30, 220]} shadowSize={30} light={0.85}>
      <BigStreet seed="dusk" trees={false} lamps={false} />
      <Sky t={c.t} tint="dawn" seed="dusk" y={60} radius={240} />
      <Hero
        pose={mergePose(REST, { expression: "worried", headYaw: Math.sin(c.lt * 3.2) * 0.75, lShoulder: [0.2, 0.55], rShoulder: [0.2, 0.55], lElbow: 0.9, rElbow: 0.9 })}
        position={[16.6, 0, 0]}
        yaw={0.2}
        look={POLICE_OFFICER}
      />
      <Hero pose={gpose} position={gp} yaw={-Math.PI / 2} look={crowdLook(23)} ghost={0.06} />
      <Handbag position={[hand[0], hand[1] - DIM.fistR - 0.33, hand[2]]} rotation={[0, -Math.PI / 2, Math.sin(c.lt * 5) * 0.08]} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 super armies (night, searchlights)

const NightPlaza: React.FC<{ t: number; capitol?: V3 }> = ({ t, capitol = [0, 0, -46] }) => (
  <group>
    <Ground color="#2E3244" />
    <Road position={[0, 0, 0]} width={16} length={200} />
    <Capitol position={capitol} scale={2.4} />
    <Skyline radius={120} seed="nightring" count={30} />
    {[-34, 34, 0].map((x, i) => (
      <Searchlight key={i} position={[x, 0, capitol[2] - 18 - (i === 2 ? 14 : 0)]} t={t} seed={`sl${i}`} />
    ))}
    <group scale={CITY}>
      {[2.6, -2.6].flatMap((x) => [-5, -9].map((z) => <Lamp key={`${x}${z}`} position={[x, 0, z]} on />))}
    </group>
  </group>
);

/** "Within days": a queue of glowing people stretches to the government building. */
const c3Queue: ShotFn = (c) => {
  const cam = move({ position: [8, 4.5, 23], target: [-1, 5, -10] }, { position: [7.4, 4.5, 21], target: [-1, 5.2, -10] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[40, 260]} shadowSize={50}>
      <NightPlaza t={c.t} />
      {Array.from({ length: 10 }, (_, i) => {
        const p: V3 = [-1 + (random(`q${i}`) - 0.5) * 0.8, i === 3 ? 1.4 + Math.sin(c.t * 3) * 0.2 : 0, 14 - i * 5.2];
        return (
          <React.Fragment key={i}>
            <Hero pose={mergePose(REST, { headYaw: (random(`qy${i}`) - 0.5) * 0.6 })} position={p} yaw={Math.PI} look={crowdLook(80 + i)} />
            <Aura position={p} color={AURA_LIST[i % AURA_LIST.length]} t={c.t} shell={false} seed={`q${i}`} k={0.8} />
          </React.Fragment>
        );
      })}
    </Shot>
  );
};

/** The recruitment desk: an official nods a fire-handed recruit through. */
const c3Desk: ShotFn = (c) => {
  const cam = move({ position: [8, 4.2, 17], target: [0, 4.4, -1] }, { position: [7.3, 4.2, 15.6], target: [0, 4.5, -1] }, c);
  const recruit: V3 = [-0.6, 0, 3.4];
  const rpose = mergePose(REST, { rShoulder: [1.55, 0.25], rElbow: 1.25, headPitch: 0.1 });
  const hand = handPosition(rpose, "r", recruit, Math.PI);
  return (
    <Shot mood="night" camera={cam} fog={[30, 220]} shadowSize={30}>
      <NightPlaza t={c.t} capitol={[0, 0, -44]} />
      <RecruitDesk position={[0, 0, 0]} />
      <pointLight position={[0, 5, 2]} color={P.lampGlow} intensity={8} distance={22} decay={2} />
      <Hero pose={mergePose(REST, { expression: "smile", headPitch: -0.12 + Math.max(0, Math.sin(c.lt * 6)) * 0.12, lean: 0.06 })} position={[0.8, 0, -1.9]} look={suitLook(3)} />
      <Hero pose={rpose} position={recruit} yaw={Math.PI} look={crowdLook(91)} />
      <Flames position={[hand[0], hand[1] + DIM.fistR, hand[2]]} t={c.t} size={0.28} seed="rf" light={false} />
      {[7.5, 12, 16.5].map((z, i) => (
        <React.Fragment key={z}>
          <Hero pose={mergePose(REST, { headYaw: 0.2 * (i - 1) })} position={[-1 + i * 0.6, 0, z]} yaw={Math.PI} look={crowdLook(92 + i)} />
          <Aura position={[-1 + i * 0.6, 0, z]} color={AURA_LIST[(i + 2) % AURA_LIST.length]} t={c.t} shell={false} seed={`d${i}`} k={0.7} />
        </React.Fragment>
      ))}
    </Shot>
  );
};

/** "…the most powerful": a recruit stops a charging tank with one hand. */
const REC: V3 = [0, 0, 0];
const c3Tank: ShotFn = (c) => {
  const cam = move({ position: [16, 3.6, 2.5], target: [0, 2.6, 1.0] }, { position: [15.2, 3.6, 2.4], target: [0, 2.7, 1.0] }, c);
  const crouch = mergePose(REST, { lHip: [-0.35, 0.08], rHip: [0.45, 0.08], lKnee: 0.55, rKnee: 0.2, lean: 0.2, expression: "smile", lShoulder: [-0.3, 0.3] });
  const stance = { ...crouch, bob: groundedBob(crouch) };
  const contact: V3 = [0.25, 1.45, 1.55];
  const pose = reach(stance, "r", contact, { position: REC, yaw: 0 }).pose;
  const fist = handPosition(pose, "r", REC, 0);
  const s = 0.8;
  const frontAt = fist[2] + DIM.fistR;
  const stopK = k01(c.lt, 0, 0.55);
  const front = frontAt + 22 * (1 - stopK);
  const hit = c.lt > 0.55;
  return (
    <Shot mood="night" camera={cam} fog={[30, 200]} shadowSize={30} shake={hit && c.lt < 0.9 ? 0.12 : 0} shakeSeed="tank">
      <Ground color="#3A3B30" />
      <Skyline radius={110} seed="base" count={24} />
      {[-30, 0, 30].map((x, i) => (
        <Searchlight key={i} position={[x, 0, -60]} t={c.t} seed={`ts${i}`} />
      ))}
      <Hero pose={pose} position={REC} look={RECRUIT(7)} />
      <Aura position={REC} color={POWER_COLORS.strength} t={c.t} shell={false} />
      <Tank scale={s} position={[0.3, 0, front + 5 * s]} rotation={[hit ? -0.05 * Math.sin(Math.min(1, (c.lt - 0.55) / 0.3) * Math.PI) : 0, Math.PI, 0]} turret={Math.PI / 2} />
      <Shockwave position={[fist[0], fist[1], fist[2] + 0.3]} progress={lin(c.lt, 0.55, 1.0)} radius={5} color={POWER_COLORS.strength} />
      <SmokeCluster position={[-2.5, 0, frontAt + 2]} progress={lin(c.lt, 0.55, 1.6)} radius={1.6} rise={1} seed="td" color="#6A6250" />
      {Array.from({ length: 6 }, (_, i) => (
        <React.Fragment key={i}>
          <Hero pose={REST} position={[-15 + i * 6, 0, -14]} look={RECRUIT(20 + i)} />
          <Aura position={[-15 + i * 6, 0, -14]} color={AURA_LIST[i]} t={c.t} shell={false} seed={`r${i}`} k={0.6} />
        </React.Fragment>
      ))}
    </Shot>
  );
};

/** "Why build fighter jets…": a jet in a hangar with a FOR SALE sign. */
const c3Hangar: ShotFn = (c) => {
  const cam = move({ position: [7, 4.0, 14], target: [0, 3.4, -16] }, { position: [6.4, 3.9, 12.5], target: [0, 3.5, -16] }, c);
  const jetY = 2.6;
  return (
    <Shot mood="night" camera={cam} fog={[40, 240]} shadowSize={40} light={1.7}>
      <Ground color="#2E3244" />
      <Skyline radius={120} seed="airbase" count={26} />
      <Hangar position={[0, 0, 0]} />
      <pointLight position={[0, 14, -12]} color="#E8ECF5" intensity={5} distance={70} decay={1} />
      <pointLight position={[6, 6, 2]} color={P.lampGlow} intensity={3} distance={30} decay={1} />
      <Jet position={[0, jetY, -18]} rotation={[0, 0.5, 0]} scale={7} trail={0} />
      {[
        [0, 7.5],
        [-3.2, -3],
        [3.2, -3],
      ].map(([x, z], i) => {
        const wx = Math.cos(0.5) * x + Math.sin(0.5) * z;
        const wz = -Math.sin(0.5) * x + Math.cos(0.5) * z;
        return (
          <mesh key={i} position={[wx, (jetY - 1.3) / 2, -18 + wz]}>
            <CylG args={[0.18, 0.18, jetY - 1.3, 6]} />
            <Flat color="#2A2E38" />
          </mesh>
        );
      })}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[4.6 + sx * 1.2, 1.6, -5.5]}>
          <BoxG args={[0.14, 3.2, 0.14]} />
          <Flat color={P.pole} />
        </mesh>
      ))}
      <CanvasPanel position={[4.6, 3.6, -5.4]} w={3.2} h={1.7} draw={drawBoard(["FOR SALE"], "#C8372D", "#FFFFFF", "BARELY USED")} />
    </Shot>
  );
};

/** "…when someone can fly faster than sound?": a flyer overtakes the jet, and the air booms. */
const c3Boom: ShotFn = (c) => {
  const jetX = -36 + c.lt * 16;
  const flyX = -60 + c.lt * 36;
  const cross = 1.2;
  const cam: CameraSpec = { position: [jetX + 1, 51.8, 14 - c.lt * 0.6], target: [jetX - 1, 50.6, -3] };
  const boom = lin(c.lt, cross, cross + 0.8);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      shadows={false}
      shake={c.lt > cross && c.lt < cross + 0.35 ? 0.35 : 0}
      shakeSeed="boom"
      overlay={c.lt > cross + 0.1 ? <CardLine text="FASTER THAN SOUND" sub="≈ 1,235 KM/H" y={480} appearFrame={startFrame(c) + Math.round((cross + 0.1) * 30)} /> : null}
    >
      <CityGrid seed="night" blocks={9} block={14} />
      <Clouds t={c.t} color="#2A3048" y={30} radius={70} count={22} seed="nightcl" />
      <Jet position={[jetX, 50, -6]} rotation={[0, Math.PI / 2, 0.08]} scale={2.2} trail={14} />
      <Halo position={[jetX - 3, 50, -6]} size={5} color={P.amber} opacity={0.7} />
      <Halo position={[jetX, 50, -6 + 3.1]} size={1.6} color="#45E08A" opacity={0.9} />
      <Halo position={[jetX, 50, -6 - 3.1]} size={1.6} color="#FF4A3A" opacity={0.9} />
      <pointLight position={[jetX, 54, 0]} color="#C4CCFF" intensity={3} distance={30} decay={1} />
      <Flyer position={[flyX, 52.6, -1]} yaw={Math.PI / 2} look={crowdLook(3)} trail={20} aura={POWER_COLORS.flight} t={c.t} scale={0.9} />
      {c.lt > cross - 0.3 ? (
        <mesh position={[flyX - 1.8, 52.6, -1]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[1.6, 3.5, 16, 1, true]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.16} depthWrite={false} toneMapped={false} side={2} />
        </mesh>
      ) : null}
      {boom > 0 && boom < 1 ? (
        <mesh position={[-60 + cross * 36, 52.6, -1]} rotation={[0, Math.PI / 2, 0]}>
          <ringGeometry args={[Math.max(0.1, 9 * ease(boom) - 0.8), 9 * ease(boom), 48]} />
          <meshBasicMaterial color="#E8F6FF" transparent opacity={(1 - boom) * 0.7} depthWrite={false} toneMapped={false} side={2} />
        </mesh>
      ) : null}
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 a new order (overcast morning)

const PlazaSet: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <Ground color="#8E96A6" />
    <PowerTiers t={t} />
    <Skyline radius={115} seed="orderring" count={32} power={0.3} />
    <HillRing radius={200} color="#5A6A62" />
  </group>
);
const TIER_PEOPLE: { p: V3; color: string; seed: number }[] = [
  ...[-9, -3, 3.5, 9.5].map((x, i) => ({ p: [x, tierTop(0), tierStandZ(0)] as V3, color: POWER_COLORS.strength, seed: 100 + i })),
  { p: [-4.5, tierTop(1), tierStandZ(1)], color: POWER_COLORS.teleport, seed: 110 },
  { p: [4.5, tierTop(1), tierStandZ(1)], color: POWER_COLORS.mind, seed: 111 },
];
const GROUND_CROWD: V3[] = [
  [-9, 0, 18],
  [-4, 0, 20.5],
  [7.5, 0, 19],
  [11, 0, 21.5],
  [-12.5, 0, 22],
  [0.5, 0, 23],
];
const SL_ORDER: V3 = [2.5, 0, 17.4];
const OrderPeople: React.FC<{ t: number; sock?: string }> = ({ t, sock }) => (
  <group>
    {TIER_PEOPLE.map((q, i) => (
      <React.Fragment key={i}>
        <Hero pose={mergePose(REST, { expression: "smile", headPitch: -0.15 })} position={q.p} look={crowdLook(q.seed)} />
        <Aura position={q.p} color={q.color} t={t} shell={false} seed={`tp${i}`} k={0.85} />
      </React.Fragment>
    ))}
    <Hero pose={mergePose(REST, { ...V_ARMS, expression: "smile" })} position={[0, tierTop(2) + 2 + Math.sin(t * 2) * 0.25, 0]} look={crowdLook(120)} />
    <Aura position={[0, tierTop(2) + 2 + Math.sin(t * 2) * 0.25, 0]} color={P.amber} t={t} />
    {GROUND_CROWD.map((p, i) => (
      <Hero key={i} pose={mergePose(REST, { headPitch: 0.5, expression: i % 2 ? "worried" : "awe" })} position={p} yaw={Math.PI + (random(`gc${i}`) - 0.5) * 0.6} look={crowdLook(130 + i)} />
    ))}
    <Hero pose={mergePose(REST, { headPitch: 0.6, expression: "worried" })} position={SL_ORDER} yaw={Math.PI - 0.15} look={SLAV(sock)} />
  </group>
);

/** "Your place in society": a stepped plinth, the most powerful at the top. */
const c4Tiers: ShotFn = (c) => {
  const cam = move({ position: [15, 10, 60], target: [0, 12, 0] }, { position: [13, 11, 55], target: [0, 12.5, 0] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[60, 320]} shadowSize={50}>
      <PlazaSet t={c.t} />
      <Sky t={c.t} tint="overcast" seed="order" y={55} radius={220} count={20} />
      <OrderPeople t={c.t} />
    </Shot>
  );
};

/** "…wouldn't depend on wealth": a rich man and his coins, looking up at the people above him. */
const RICH: V3 = [7, 0, 26];
const c4Wealth: ShotFn = (c) => {
  const cam = move({ position: [3.6, 3.7, 35.5], target: [6.6, 3.5, 25] }, { position: [4.2, 3.7, 33.5], target: [6.6, 3.5, 25] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[60, 320]} shadowSize={30} overlay={<StrikeCard text="WEALTH" lt={c.lt} />}>
      <PlazaSet t={c.t} />
      <Sky t={c.t} tint="overcast" seed="order" y={55} radius={220} count={20} />
      <OrderPeople t={c.t} />
      <Hero pose={mergePose(REST, { headPitch: 0.45, expression: "worried" })} position={RICH} yaw={-0.35} look={suitLook(8)} />
      <CoinPile position={[RICH[0] + 2.6, 0, RICH[2] + 0.8]} r={1.6} h={1.3} />
      <CoinPile position={[RICH[0] - 2.4, 0, RICH[2] - 0.6]} r={1.1} h={0.8} />
    </Shot>
  );
};

/** "…or education": a graduate, cap and diploma, just as stuck on the ground. */
const GRAD: V3 = [-6.5, 0, 26];
const c4Grad: ShotFn = (c) => {
  const cam = move({ position: [-3.4, 3.7, 35], target: [-6.6, 3.5, 25] }, { position: [-3.9, 3.7, 33], target: [-6.6, 3.5, 25] }, c);
  const pose = mergePose(REST, { rShoulder: [0.95, 0.2], rElbow: 1.2, headPitch: 0.4, expression: "worried" });
  const head = headPosition(pose, GRAD, 0.35);
  const hand = handPosition(pose, "r", GRAD, 0.35);
  return (
    <Shot mood="overcast" camera={cam} fog={[60, 320]} shadowSize={30} overlay={<StrikeCard text="EDUCATION" lt={c.lt} />}>
      <PlazaSet t={c.t} />
      <Sky t={c.t} tint="overcast" seed="order" y={55} radius={220} count={20} />
      <OrderPeople t={c.t} />
      <Hero pose={pose} position={GRAD} yaw={0.35} look={crowdLook(12)} />
      <Mortarboard head={head} tilt={-0.25} />
      <Diploma position={[hand[0], hand[1] + DIM.fistR + 0.1, hand[2]]} rotation={[0, 0.35, 0]} />
    </Shot>
  );
};

/** "…only on the power you randomly received": from Slavoski (socks flashing) up to the glowing top. */
const c4Tilt: ShotFn = (c) => {
  const k = ease(lin(c.lt, 0.35, 2.4));
  const cam = lerpCam({ position: [5, 2.4, 27], target: [2.4, 3.4, 17.4] }, { position: [9, 13, 57], target: [0, 18, 0] }, k);
  return (
    <Shot mood="overcast" camera={cam} fog={[60, 320]} shadowSize={50}>
      <PlazaSet t={c.t} />
      <Sky t={c.t} tint="overcast" seed="order" y={55} radius={220} count={20} />
      <OrderPeople t={c.t} sock={sockAt(c.t)} />
      <Sparks center={[SL_ORDER[0], 0.05, SL_ORDER[2]]} t={c.t} color={sockAt(c.t)} count={6} radius={0.7} height={0.8} size={0.06} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 the one (eerie dust)

const OnePlaza: React.FC<{ t: number; clear?: number; count?: number }> = ({ t, clear = 3.5, count = 1500 }) => (
  <group>
    <Ground color="#6A5A5E" />
    <CrowdSea radius={58} count={count} clear={clear} t={t} />
    <Skyline radius={86} seed="onering" count={30} power={0.6} />
  </group>
);

/** "But among eight billion people…": a vast crowd from above; a beam picks out one person. */
const c5Crowd: ShotFn = (c) => {
  const cam = move({ position: [0, 80, 54], target: [0, 0, 0] }, { position: [0, 64, 40], target: [0, 0, 0] }, c);
  return (
    <Shot mood="dust" camera={cam} fog={[60, 320]} shadowSize={60}>
      <OnePlaza t={c.t} />
      <Hero pose={mergePose(REST, { headPitch: 0.5, expression: "awe" })} position={[0, 0, 0]} look={LUCKY} />
      <mesh position={[0, 60, 0]}>
        <cylinderGeometry args={[2.2, 2.6, 120, 16, 1, true]} />
        <meshBasicMaterial color={POWER_COLORS.lucky} transparent opacity={0.2} blending={2} depthWrite={false} toneMapped={false} side={2} />
      </mesh>
      <Halo position={[0, 2, 0]} size={12} color={POWER_COLORS.lucky} opacity={0.7} />
    </Shot>
  );
};

const RECOIL: V3[] = [
  [-5.5, 0, -3],
  [5.8, 0, -2.5],
  [-3, 0, -7],
  [3.6, 0, -7.5],
  [0, 0, -10],
];
/** "…someone could get a power stronger than everyone's": the aura swells; everyone backs away. */
const c5Rise: ShotFn = (c) => {
  const cam = move({ position: [0, 3.9, 13.5], target: [0, 3.3, 0] }, { position: [0, 3.8, 10.5], target: [0, 3.3, 0] }, c);
  const grow = ease(lin(c.lt, 0.2, 2.8));
  return (
    <Shot mood="dust" camera={cam} fog={[30, 220]} shadowSize={30}>
      <OnePlaza t={c.t} clear={12} count={1100} />
      <Hero pose={mergePose(REST, { lShoulder: [0.2, 0.5 + grow * 0.3], rShoulder: [0.2, 0.5 + grow * 0.3], lElbow: 0.4, rElbow: 0.4, expression: c.lt > 2.2 ? "smile" : "awe", headPitch: -0.05 })} position={[0, 0, 0]} look={LUCKY} />
      <Aura position={[0, 0, 0]} color={POWER_COLORS.lucky} t={c.t} scale={1 + grow * 1.6} />
      <Sparks center={[0, 0, 0]} t={c.t} color="#FFFFFF" count={16} radius={2.2 + grow * 2} height={6} size={0.1} />
      {RECOIL.map((p, i) => (
        <Hero key={i} pose={mergePose(REST, { lean: -0.15 * grow, expression: "alarm", lShoulder: [0.6 * grow, 0.4], rShoulder: [0.6 * grow, 0.4], lElbow: 1.1 * grow, rElbow: 1.1 * grow })} position={[p[0] * (1 + grow * 0.15), 0, p[2] * (1 + grow * 0.15)]} yaw={Math.atan2(-p[0], -p[2])} look={crowdLook(140 + i)} />
      ))}
    </Shot>
  );
};

/** "Control time": the rain stops in mid-air; a car's splash, a pigeon and a jumper all freeze. */
const c5Freeze: ShotFn = (c) => {
  const cam = move({ position: [2.5, 4.0, 15], target: [0, 3.8, 0] }, { position: [2.3, 4.0, 13.8], target: [0, 3.8, 0] }, c);
  const snap = mergePose(REST, { rShoulder: [2.25, 0.45], rElbow: 1.0, expression: "smile" });
  const hand = handPosition(snap, "r", [0, 0, 4]);
  const jump = mergePose(REST, { lKnee: 1.2, rKnee: 0.9, lHip: [0.5, 0.1], rHip: [0.2, 0.1], lShoulder: [0.2, 2.0], rShoulder: [0.2, 2.0], expression: "alarm" });
  const ripple = lin(c.lt, 0, 0.9);
  return (
    <Shot
      mood="dust"
      camera={cam}
      fog={[30, 200]}
      shadowSize={30}
      filter="saturate(0.35) brightness(1.05) hue-rotate(-10deg)"
      overlay={<CardLine text="TIME: STOPPED" y={470} appearFrame={startFrame(c) + 8} accent="#DCE6FF" />}
    >
      <BigStreet seed="freeze" cars={false} />
      <FrozenRain center={[0, 7, 0]} size={[20, 14, 16]} count={700} />
      <Hero pose={snap} position={[0, 0, 4]} look={LUCKY} />
      <Halo position={hand} size={3} color="#FFFFFF" opacity={0.6} />
      {ripple > 0 && ripple < 1 ? (
        <mesh position={hand}>
          <IcoG args={[1 + ripple * 34, 3]} />
          <meshBasicMaterial color="#DCE6FF" transparent opacity={(1 - ripple) * 0.18} side={2} depthWrite={false} toneMapped={false} />
        </mesh>
      ) : null}
      <group scale={CITY}>
        <Car position={[-0.8, 0, -3]} color={P.carTeal} />
      </group>
      {Array.from({ length: 22 }, (_, i) => (
        <mesh key={i} position={[-2.8 + (i % 2 ? 3.2 : -3.2) + (random(`sp${i}`) - 0.5) * 1.6, 0.4 + random(`spy${i}`) * 1.8, -10.5 + (random(`spz${i}`) - 0.5) * 8]}>
          <IcoG args={[0.12 + random(`sps${i}`) * 0.1, 0]} />
          <Glow color="#BFE3FF" opacity={0.8} />
        </mesh>
      ))}
      <Hero pose={jump} position={[-3.2, 2.6, -5]} yaw={0.3} look={crowdLook(44)} />
      <Bird kind="pigeon" position={[3, 6.8, -3]} yaw={0.6} scale={1.6} flap={1} flapT={0.07} />
    </Shot>
  );
};

/** "Manipulate reality": the street breaks into tiles that float up, buildings drift and turn, the colours slide. */
const TILES = Array.from({ length: 81 }, (_, i) => {
  const gx = (i % 9) - 4;
  const gz = Math.floor(i / 9) - 4;
  return { x: gx * 6, z: gz * 6, h: (1.5 + random(`ty${i}`) * 15) * (gz > 0 ? 0.25 : 1), r: [(random(`tr${i}`) - 0.5) * 0.9, (random(`tq${i}`) - 0.5) * 1.2, (random(`tp${i}`) - 0.5) * 0.9] as V3, centre: gx === 0 && gz === 0 };
});
const FLOATERS = Array.from({ length: 7 }, (_, i) => {
  const a = (i / 7) * Math.PI * 2 + 0.4;
  return { a, r: 34 + random(`fr${i}`) * 10, h: 8 + random(`fh${i}`) * 14, w: 2.2 + random(`fw${i}`) * 1.4, bh: 5 + random(`fb${i}`) * 7, color: [P.bldgNavy, P.bldgPurple, P.bldgTeal, P.bldgSlate][i % 4] };
});
const c5Bend: ShotFn = (c) => {
  const cam = move({ position: [0, 20, 34], target: [0, 4, 0] }, { position: [3, 19, 31], target: [0, 4.5, 0] }, c);
  const lift = ease(lin(c.lt, 0, 1.6));
  const centreY = lift * 2;
  return (
    <Shot mood="dust" camera={cam} fog={[40, 260]} shadowSize={50} light={1.15} filter={`hue-rotate(${Math.round(c.lt * 45)}deg) saturate(1.2)`}>
      <Ground color="#3A3040" y={-30} />
      <group rotation={[0, 0, 0.18 * lift]}>
        <Skyline radius={110} seed="bendring" count={28} power={0.6} />
      </group>
      {TILES.map((tile, i) => {
        const y = tile.centre ? centreY : lift * tile.h;
        const r: V3 = tile.centre ? [0, 0, 0] : [tile.r[0] * lift, tile.r[1] * lift, tile.r[2] * lift];
        return <StreetTile key={i} position={[tile.x, y - 0.4, tile.z]} rotation={r} />;
      })}
      {FLOATERS.map((f, i) => (
        <group key={i} position={[Math.sin(f.a) * f.r, f.h * lift, Math.cos(f.a) * f.r - 10]} rotation={[0.4 * lift, c.t * 0.3 + i, 0.6 * lift]} scale={3}>
          <Building position={[0, -f.bh / 2, 0]} w={f.w} d={f.w} h={f.bh} color={f.color} seed={`fl${i}`} />
        </group>
      ))}
      <Hero pose={mergePose(REST, { lShoulder: [0.3, 1.3], rShoulder: [0.3, 1.3], lElbow: 0.3, rElbow: 0.3, expression: "smile", headPitch: 0.2 })} position={[0, centreY, 0]} look={LUCKY} />
      <Aura position={[0, centreY, 0]} color={POWER_COLORS.lucky} t={c.t} scale={1.6} />
    </Shot>
  );
};

const VICTIMS: V3[] = [
  [-6, 0, -2.5],
  [-3.6, 0, -6.2],
  [0.6, 0, -7.4],
  [4.3, 0, -5.8],
  [6.6, 0, -1.8],
];
/** "Steal other people's powers": streams of colour pour out of the people around him and into his hands. */
const c5Steal: ShotFn = (c) => {
  const cam = move({ position: [7, 5.5, 17], target: [0, 4.2, 0] }, { position: [6, 5.2, 15], target: [0, 4.4, 0] }, c);
  const pose = mergePose(REST, { ...V_ARMS, expression: "smile", headPitch: 0.15 });
  const hands = [handPosition(pose, "l", [0, 0, 0]), handPosition(pose, "r", [0, 0, 0])];
  const drain = lin(c.lt, 0.2, 1.9);
  const on = clamp01(c.lt * 3);
  return (
    <Shot mood="dust" camera={cam} fog={[30, 220]} shadowSize={30}>
      <OnePlaza t={c.t} clear={14} count={1000} />
      <Hero pose={pose} position={[0, 0, 0]} look={LUCKY} />
      <Aura position={[0, 0, 0]} color={AURA_LIST[Math.floor(c.t * 6) % AURA_LIST.length]} t={c.t} scale={1.3 + drain * 0.8} />
      {VICTIMS.map((p, i) => {
        const color = AURA_LIST[i % AURA_LIST.length];
        const vpose = mergePose(REST, { lean: 0.18 * drain, expression: "alarm", headPitch: 0.1 - drain * 0.2, lShoulder: [0.05, 0.12 + 0.3 * (1 - drain)], rShoulder: [0.05, 0.12 + 0.3 * (1 - drain)] });
        return (
          <React.Fragment key={i}>
            <Hero pose={vpose} position={p} yaw={Math.atan2(-p[0], -p[2])} look={crowdLook(150 + i)} />
            <Aura position={p} color={color} t={c.t} shell={false} seed={`v${i}`} k={1 - drain * 0.9} />
            <PowerStream from={[p[0], 2.6, p[2]]} to={hands[i % 2]} t={c.t + i * 0.13} color={color} k={on * (1 - drain * 0.4)} seed={`st${i}`} />
          </React.Fragment>
        );
      })}
    </Shot>
  );
};

// ---------------------------------------------------------------- 06 the lucky one (storm) → calm dawn

/** "Humanity's greatest threat": a storm over the city, lightning. */
const c6Storm: ShotFn = (c) => {
  const cam = move({ position: [44, 34, 76], target: [0, 12, 0] }, { position: [40, 32, 70], target: [0, 12, 0] }, c);
  const f = flashAt(c.lt, [0.3, 1.2], 0.14);
  return (
    <Shot mood="storm" camera={cam} fog={[50, 280]} shadowSize={60} light={0.85 + f * 0.6} overlay={<Flash o={f * 0.35} />}>
      <CityGrid seed="storm" blocks={7} block={14} modify={() => ({ power: 0.55 })} />
      <Skyline radius={130} seed="stormring" power={0.5} />
      <Sky t={c.t} tint="storm" seed="storm" y={58} radius={170} count={24} />
      <LightningBolt top={[-24, 90, -60]} bottom={[-7, 14, -21]} flash={f > 0 ? 1 : 0} seed="sb" />
      <Rain center={[40, 34, 62]} size={[50, 36, 50]} t={c.t} count={800} speed={30} thickness={0.06} />
    </Shot>
  );
};

/** "…wouldn't be a disaster": a meteor streaks over the storm — crossed out. */
const c6Meteor: ShotFn = (c) => {
  const cam = move({ position: [0, 5, 30], target: [0, 30, -100] }, { position: [0, 5, 28], target: [2, 31, -100] }, c);
  return (
    <Shot mood="storm" camera={cam} fog={false} shadowSize={50} overlay={<CrossOut k={lin(c.lt, 0.4, 0.75)} />}>
      <Ground color="#262C38" />
      <Skyline radius={100} seed="metring" count={30} power={0.5} />
      <Sky t={c.t} tint="storm" seed="storm" y={70} radius={180} count={20} />
      <Meteor from={[-30, 60, -70]} to={[20, 6, -80]} progress={0.3 + c.lt * 0.45} size={2} trail={30} seed="dm" />
    </Shot>
  );
};

/** "…or an alien invasion": saucers over the hills — crossed out. */
const c6Ufo: ShotFn = (c) => {
  const cam = move({ position: [0, 6, 40], target: [0, 22, -40] }, { position: [2, 6.5, 37], target: [0, 22.5, -40] }, c);
  return (
    <Shot mood="storm" camera={cam} fog={[60, 300]} shadowSize={50} overlay={<CrossOut k={lin(c.lt, 0.6, 0.95)} />}>
      <Ground color="#2A3230" />
      <HillRing radius={150} color="#2E3A36" />
      <Skyline radius={95} seed="ufoRing" count={24} power={0.5} />
      <Sky t={c.t} tint="storm" seed="storm" y={70} radius={180} count={20} />
      <Saucer position={[-22, 30 + Math.sin(c.t * 2) * 0.6, -55]} t={c.t} beam={1} />
      <Saucer position={[22, 40, -85]} t={c.t + 1} beam={0.6} />
      <Saucer position={[3, 22 + Math.sin(c.t * 2.4) * 0.5, -30]} t={c.t + 2} tilt={0.12} scale={0.8} />
    </Shot>
  );
};

/** "It would be an ordinary person…": the lucky one walks toward us down a rainy street at night. */
const c6Walk: ShotFn = (c) => {
  const z = -6 + c.lt * 1.8;
  const cam: CameraSpec = { position: [0.7, 3.9, z + 13 - c.lt * 0.3], target: [0, 3.2, z - 1] };
  const f = flashAt(c.lt, [1.05], 0.16);
  return (
    <Shot mood="storm" camera={cam} fog={[30, 200]} shadowSize={30} light={0.8 + f * 0.6} overlay={<Flash o={f * 0.3} />}>
      <BigStreet seed="rain" />
      <Sky t={c.t} tint="storm" seed="rainy" y={60} radius={200} count={20} />
      <LightningBolt top={[-14, 140, -180]} bottom={[-6, 0, -130]} flash={f > 0 ? 1 : 0} seed="wb" />
      <Hero pose={mergePose(walkPose(c.lt * 1.25, 0.8), { expression: "neutral" })} position={[0, 0, z]} look={LUCKY} />
      <Aura position={[0, 0, z]} color={POWER_COLORS.lucky} t={c.t} k={0.4 + 0.2 * Math.sin(c.t * 9)} shell={false} />
      <Rain center={[0, 9, z + 6]} size={[26, 20, 22]} t={c.t} count={650} speed={26} thickness={0.04} opacity={0.5} seed="wr" />
    </Shot>
  );
};

/** "…who got incredibly lucky": a coin flipped high in the rain, caught, a smirk. */
const c6Coin: ShotFn = (c) => {
  const cam = move({ position: [0.5, 4.2, 7.8], target: [0, 4.0, 0] }, { position: [0.4, 4.25, 7.0], target: [0, 4.05, 0] }, c);
  const pose = mergePose(REST, { rShoulder: [1.0, 0.15], rElbow: 1.45, expression: c.lt > 1.1 ? "smile" : "neutral", headPitch: c.lt > 0.2 && c.lt < 1.1 ? 0.35 : 0 });
  const hand = handPosition(pose, "r", [0, 0, 0]);
  const u = lin(c.lt, 0.15, 1.1);
  const rest = hand[1] + DIM.fistR + 0.04;
  const y = rest + 2.2 * 4 * u * (1 - u);
  const f = flashAt(c.lt, [0.62], 0.16);
  return (
    <Shot mood="storm" camera={cam} fog={[20, 160]} shadowSize={12} light={0.85 + f * 0.6} overlay={<Flash o={f * 0.28} />}>
      <BigStreet seed="rain" />
      <Hero pose={pose} position={[0, 0, 0]} look={LUCKY} />
      <Aura position={[0, 0, 0]} color={POWER_COLORS.lucky} t={c.t} k={0.35} shell={false} />
      <Coin position={[hand[0], y, hand[2]]} spin={u < 1 ? u * 20 : Math.PI / 2} />
      <Rain center={[0, 6, 2]} size={[12, 12, 10]} t={c.t} count={260} speed={26} thickness={0.03} opacity={0.4} seed="cr" />
    </Shot>
  );
};

/** "If you could choose one superpower…": dawn again on Slavoski's street; he shrugs, socks flashing. */
const c6End: ShotFn = (c) => {
  const cam = move({ position: [10, 3.4, 1.0], target: [-4, 3.4, -7.4] }, { position: [8.8, 3.4, 0.3], target: [-4, 3.45, -7.4] }, c);
  const shrug = k01(c.lt, 0.2, 0.7);
  const pose = mergePose(REST, { lShoulder: [0.35, 0.12 + 0.6 * shrug], rShoulder: [0.35, 0.12 + 0.6 * shrug], lElbow: 0.2 + 1.1 * shrug, rElbow: 0.2 + 1.1 * shrug, headRoll: 0.12 * shrug, expression: "smile" });
  const k = lin(c.lt, 0.6, 3.0);
  const a: V3 = [-55, 14, 24];
  const b: V3 = [-55, 26, -44];
  const { yaw, pitch } = aim(a, b);
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 320]} shadowSize={20}>
      <Suburb front={false} />
      <Sky t={c.t} tint="dawn" seed="dawnsub" />
      <Hero pose={pose} position={SL} yaw={1.0} look={SLAV(sockAt(c.t))} />
      <Sparks center={[SL[0], 0.05, SL[2]]} t={c.t} color={sockAt(c.t)} count={6} radius={0.7} height={0.8} size={0.06} />
      {k > 0 && k < 1 ? <Flyer position={lerp3(a, b, k)} yaw={yaw} pitch={pitch} look={NB_LOOK} pose={FLY_POSE} trail={12} aura={POWER_COLORS.flight} t={c.t} /> : null}
    </Shot>
  );
};

/** Thumbnail: Slavoski looking down at his flashing socks while the neighbour flies overhead and auras glow behind him. */
export const thumbShot: ShotFn = (c) => {
  const cam: CameraSpec = { position: [0, 2.2, 10], target: [0.5, 5.0, -10] };
  const fly: V3 = [-1.8, 3.6, -11];
  const me: V3 = [1.5, 0, SL[2]];
  return (
    <Shot mood="day" camera={cam} fog={[60, 320]} shadowSize={30}>
      <Suburb front={false} />
      <Sky t={c.t} tint="day" seed="sub" />
      <Hero
        pose={mergePose(REST, { headPitch: 0.45, headYaw: 0.35, expression: "alarm", lShoulder: [0.25, 0.75], rShoulder: [0.25, 0.75], lElbow: 0.7, rElbow: 0.7 })}
        position={me}
        yaw={-0.1}
        look={SLAV(POWER_COLORS.socks)}
      />
      <Sparks center={[me[0], 0.1, me[2]]} t={c.t} color={POWER_COLORS.socks} count={12} radius={0.8} height={1.1} size={0.1} />
      <Halo position={[me[0], 0.45, me[2] + 0.3]} size={2.4} color={POWER_COLORS.socks} opacity={0.6} />
      <Hero pose={mergePose(REST, { ...V_ARMS, expression: "smile", headPitch: 0.1 })} position={fly} yaw={0.3} look={NB_LOOK} />
      <Aura position={fly} color={POWER_COLORS.flight} t={c.t} />
    </Shot>
  );
};

// ---------------------------------------------------------------- the shot list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldRing },
    { cue: "have just", fn: coldWave },
    { cue: "random", fn: coldAuras },
    { cue: "Your neighbor", fn: coldFly },
    { cue: "Your best", fn: coldTeleport },
    { cue: "But you", fn: coldStrain },
    { cue: "change the", fn: coldSocks },
    { cue: "socks", fn: coldDeadpan },
  ],
  c1: [
    { cue: null, fn: c1Street },
    { cue: "chaos", fn: c1Aerial },
    { cue: "Super strength", fn: c1Fling },
    { cue: "destroy", fn: c1Building },
  ],
  c2: [
    { cue: null, fn: c2Mind },
    { cue: "millions", fn: c2Secrets },
    { cue: "and anyone", fn: c2Fade },
    { cue: "almost", fn: c2Catch },
  ],
  c3: [
    { cue: null, fn: c3Queue },
    { cue: "governments", fn: c3Desk },
    { cue: "most powerful", fn: c3Tank },
    { cue: "Why build", fn: c3Hangar },
    { cue: "someone can", fn: c3Boom },
  ],
  c4: [
    { cue: null, fn: c4Tiers },
    { cue: "wouldn't depend", fn: c4Wealth },
    { cue: "education", fn: c4Grad },
    { cue: "only on", fn: c4Tilt },
  ],
  c5: [
    { cue: null, fn: c5Crowd },
    { cue: "someone could", fn: c5Rise },
    { cue: "control time", fn: c5Freeze },
    { cue: "manipulate", fn: c5Bend },
    { cue: "steal", fn: c5Steal },
  ],
  c6: [
    { cue: null, fn: c6Storm },
    { cue: "a disaster", fn: c6Meteor },
    { cue: "an alien", fn: c6Ufo },
    { cue: "It would", fn: c6Walk },
    { cue: "incredibly", fn: c6Coin },
    { cue: "If you", fn: c6End },
  ],
};

export { RECRUIT_DESK, TIERS };
