/**
 * Shots for "What If Nobody Could Speak?" (ep. 9). Each shot is a cue phrase (or null = the chapter start)
 * plus a function of local time `lt`. Rendered with post-processing (bloom, depth of field focused on each
 * camera's target, grade), so cameras aim at the subject they should be sharp on.
 *
 * Arc: dawn bedroom and a sunrise city → bright morning street → storm at the airport → ER and a stuck lift
 * → an abstract void (brain, hologram) → a golden-hour plaza → a rainy neon street at dusk → night: a city
 * under a sky of messages, a prehistoric campfire, a rooftop.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Car, CityGrid, StreetSet } from "../../slavoski/city";
import { BoxG } from "../../slavoski/detail";
import { crowdLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Clouds, LightningBolt, Rain } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { CardLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import { CanvasPanel, CANVAS_FONT, fitText } from "../../slavoski/screens";
import { headPosition, Hero, mergePose, reach, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import { wordAt, type CuedShot } from "../../slavoski/timeline";
import { Plane } from "../../slavoski/city";
import { Flames, SunDisc } from "../minecraft-mobs/props";
import { drawScope } from "../satellites-dark/props";
import { BED, Bedroom, WIN } from "../smart-animals/props";
import { CITY } from "../ww3-countdown/props";
import { Strut } from "../no-work-2036/props";
import {
  AMBER,
  BubbleRiver,
  Bubble3D,
  Brain,
  Cave,
  CONTROLLER,
  ControlTower,
  Dispatch,
  DISPATCH_ROWS,
  drawCall,
  drawCard,
  drawScreen,
  ERRoom,
  FUR,
  HandTrail,
  Headset,
  HeldPhone,
  kneelPose,
  Lift,
  LIFT,
  LightShaft,
  Mask,
  Motes,
  mouthOf,
  Neon,
  NightCity,
  Plaza,
  PLAZA,
  Rooftop,
  Runway,
  SCRUBS,
  signPose,
  SoundWave,
  TEACHER,
  TowerCab,
  WetStreaks,
  Word,
  WORDS,
} from "./props";

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

const CLOUD = { day: "#F4F6FA", dawn: "#F2C4B0", sunset: "#F7B890", storm: "#3E4656", overcast: "#AEB6C2", night: "#2A3050" } as const;
const Sky: React.FC<{ t: number; tint: keyof typeof CLOUD; y?: number; radius?: number; count?: number; seed?: string }> = ({ t, tint, y = 45, radius = 200, count = 16, seed = "sky" }) => (
  <Clouds t={t} color={CLOUD[tint]} y={y} radius={radius} count={count} seed={seed} />
);

/** IK is slow (a grid search): cache solutions per target. */
const reachCache = new Map<string, Pose>();
const reachTo = (base: Pose, side: "l" | "r", target: V3, position: V3, yaw = 0): Pose => {
  const key = `${JSON.stringify(base)}|${side}|${target.map((x) => x.toFixed(2))}|${position.map((x) => x.toFixed(2))}|${yaw.toFixed(3)}`;
  const hit = reachCache.get(key);
  if (hit) return hit;
  const p = reach(base, side, target, { position, yaw }).pose;
  reachCache.set(key, p);
  return p;
};

/** One hand at the throat (a fist below the chin, clear of the head). */
const throatPose = (position: V3, yaw: number, over: Partial<Pose> = {}): Pose => {
  const base = mergePose(REST, { expression: "worried", ...over });
  const h = headPosition(base, position, yaw);
  const target: V3 = [h[0] + Math.sin(yaw) * 0.5, h[1] - 1.0, h[2] + Math.cos(yaw) * 0.5];
  return reachTo(base, "r", target, position, yaw);
};

/** Arms up and waving, mouth open. */
const wavePose = (t: number, over: Partial<Pose> = {}): Pose =>
  mergePose(REST, {
    expression: "alarm",
    lShoulder: [0.25, 2.3 + Math.sin(t * 9) * 0.25],
    rShoulder: [0.25, 2.3 + Math.sin(t * 9 + Math.PI) * 0.25],
    lElbow: 0.5 + Math.sin(t * 9) * 0.3,
    rElbow: 0.5 + Math.sin(t * 9 + Math.PI) * 0.3,
    ...over,
  });

/** A hero who tries to speak: the mouth flaps between open and shut, and a dead wave cracks in front of it. */
const Speaker: React.FC<{ pose: Pose; position: V3; yaw?: number; t: number; start?: number; cam: V3; look?: React.ComponentProps<typeof Hero>["look"]; size?: number; live?: boolean; seed?: string }> = ({
  pose,
  position,
  yaw = 0,
  t,
  start = 0,
  cam,
  look,
  size = 0.8,
  live = false,
  seed = "spk",
}) => {
  const talking = t > start;
  const flap = talking && Math.sin((t - start) * 14) > -0.2;
  const p = mergePose(pose, talking ? { expression: flap ? "alarm" : pose.expression === "alarm" ? "worried" : pose.expression } : {});
  const m = mouthOf(p, position, yaw);
  return (
    <>
      <Hero pose={p} position={position} yaw={yaw} look={look} />
      <SoundWave origin={m.at} dir={m.dir} cam={cam} t={t - start} dead={!live} size={size} seed={seed} />
    </>
  );
};

// ---------------------------------------------------------------- cold open: wake up

const BED_HERO: V3 = [BED.x, BED.mattressTop - (1.55 + 0.02 - 0.18), -2.55];
const bedPose = (over: Partial<Pose> = {}): Pose =>
  mergePose(REST, { lHip: [1.47, 0.06], rHip: [1.47, 0.06], lKnee: 0.04, rKnee: 0.04, lShoulder: [0.25, 0.25], rShoulder: [0.25, 0.25], lElbow: 0.5, rElbow: 0.5, ...over });
const SUNBEAM_FROM: V3 = [WIN.x - 0.1, WIN.y + 0.2, WIN.z];

const DawnRoom: React.FC<{ t: number; head: V3 }> = ({ t, head }) => (
  <>
    <Bedroom lampOn={false} dawn />
    <LightShaft from={SUNBEAM_FROM} to={[head[0] - 0.2, head[1] - 0.6, head[2] + 0.3]} r0={1.0} r1={1.6} color="#FFC890" opacity={0.42} />
    <Motes center={[(SUNBEAM_FROM[0] + head[0]) / 2 - 1, 3.4, (SUNBEAM_FROM[2] + head[2]) / 2]} size={[6, 2.0, 2.0]} t={t} count={70} scale={0.035} />
    <pointLight position={[WIN.x + 1.2, WIN.y + 0.3, WIN.z + 0.2]} color="#FFB880" intensity={60} distance={16} decay={2} />
    <pointLight position={[head[0] + 2, head[1] + 1.5, head[2] + 4]} color="#9FB8E8" intensity={14} distance={12} decay={2} />
    <SunDisc position={[-60, 6, 4]} r={4} color="#FFE2B0" glow="#FF9A5A" halo={0.5} />
  </>
);

/** 0 s: his eyes snap open in a beam of sunrise. */
const coldWake: ShotFn = (c) => {
  const pose = bedPose({ blink: c.lt < 0.45 ? 1 : c.lt < 0.55 ? 0.5 : 0, expression: "neutral", headPitch: -0.05 });
  const head = headPosition(pose, BED_HERO);
  const cam = move({ position: add(head, [1.6, 0.3, 5.6]), target: add(head, [0, -0.35, 0]) }, { position: add(head, [1.3, 0.25, 4.7]), target: add(head, [0, -0.3, 0]) }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={false} stars={false} light={0.85} shadowSize={8}>
      <DawnRoom t={c.t} head={head} />
      <Hero pose={pose} position={BED_HERO} />
    </Shot>
  );
};

/** The sunrise rolls over a city: windows light up block by block. The title lands here. */
const coldCity: ShotFn = (c) => {
  const cam = move({ position: [26, 34, 62], target: [-4, 4, -20] }, { position: [22, 31, 56], target: [-4, 5, -20] }, c);
  const front = -60 + c.lt * 55;
  return (
    <Shot mood="dawn" camera={cam} fog={[50, 330]} shadowSize={70} light={0.8} keyDir={[-0.8, 0.25, -0.5]}>
      <CityGrid seed="wake" blocks={7} block={14} modify={(sp) => ({ power: clamp01((front - sp.position[0]) / 12) * 0.9 + 0.08 })} />
      <SunDisc position={[-300, 26, -280]} r={22} color="#FFE6B0" glow="#FF9A5A" halo={0.7} />
      <LightShaft from={[-180, 40, -170]} to={[-20, 0, -30]} r0={6} r1={40} color="#FFB880" opacity={0.12} />
      <Sky t={c.t} tint="dawn" seed="wake" y={50} radius={240} />
      <Motes center={[0, 14, -10]} size={[70, 24, 60]} t={c.t} count={120} scale={0.18} />
    </Shot>
  );
};

/** "And nobody can speak": he stretches, opens his mouth to say good morning, and the wave cracks. */
const coldSpeak: ShotFn = (c) => {
  const up = k01(c.lt, 0.0, 0.35) * (1 - k01(c.lt, 0.9, 1.3));
  const pose = bedPose({ expression: c.lt > 1.1 ? "worried" : "smile", lShoulder: [0.25, 0.25 + up * 2.1], rShoulder: [0.25, 0.25 + up * 2.1], lElbow: 0.5 - up * 0.3, rElbow: 0.5 - up * 0.3 });
  const head = headPosition(pose, BED_HERO);
  const cam = move({ position: add(head, [3.0, 0.2, 8.6]), target: add(head, [0, -0.9, 0]) }, { position: add(head, [2.6, 0.2, 7.6]), target: add(head, [0, -0.85, 0]) }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={false} stars={false} light={0.85} shadowSize={8}>
      <DawnRoom t={c.t} head={head} />
      <Speaker pose={pose} position={BED_HERO} t={c.lt} start={0.35} cam={cam.position} size={0.75} />
    </Shot>
  );
};

/** "Not a single word": the whole street, mouths open, waves cracking everywhere. */
const STREET_FOLK: { p: V3; yaw: number; seed: number; start: number }[] = [
  { p: [15.2, 0, 3.5], yaw: -0.5, seed: 21, start: 0.05 },
  { p: [18.6, 0, -1.5], yaw: -2.2, seed: 22, start: 0.25 },
  { p: [16.0, 0, -6.5], yaw: 0.4, seed: 23, start: 0.15 },
  { p: [19.2, 0, -11.5], yaw: -1.2, seed: 24, start: 0.4 },
  { p: [15.6, 0, -16.5], yaw: 0.8, seed: 25, start: 0.3 },
  { p: [18.4, 0, -22.5], yaw: -0.3, seed: 26, start: 0.5 },
];
const coldStreet: ShotFn = (c) => {
  const cam = move({ position: [5.5, 3.2, 25], target: [17, 4.6, -6] }, { position: [6.2, 3.1, 22.5], target: [17, 4.8, -6] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 320]} shadowSize={36} keyDir={[-0.7, 0.45, 0.4]} light={1.2} grade={{ exposure: 1.12, dof: 0.6 }}>
      <BigStreet seed="morning" day cars={false} lamps={false} />
      <Sky t={c.t} tint="day" seed="morning" />
      {STREET_FOLK.map((f, i) => (
        <Speaker key={i} pose={throatPose(f.p, f.yaw, { expression: "alarm" })} position={f.p} yaw={f.yaw} t={c.lt} start={f.start} cam={cam.position} look={crowdLook(f.seed)} seed={`sf${i}`} />
      ))}
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 silence

const ME: V3 = [16.4, 0, 6];
/** He holds his throat, a mug of honey tea in the other hand. */
const c1Throat: ShotFn = (c) => {
  const yaw = -0.35;
  const pose = throatPose(ME, yaw);
  const head = headPosition(pose, ME, yaw);
  const cam = move({ position: add(head, [-3.4, -0.4, 10.5]), target: add(head, [0, -0.9, 0]) }, { position: add(head, [-3.0, -0.4, 9.4]), target: add(head, [0, -0.85, 0]) }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 320]} shadowSize={16} keyDir={[-0.7, 0.45, 0.4]} light={1.2} grade={{ exposure: 1.12 }}>
      <BigStreet seed="morning" day cars={false} />
      <Sky t={c.t} tint="day" seed="morning" />
      <Speaker pose={pose} position={ME} yaw={yaw} t={c.lt} start={0.5} cam={cam.position} size={0.6} />
    </Shot>
  );
};

/** The pharmacy queue: everyone holding their throat. Shot from the end of the line so it recedes. */
const c1Pharmacy: ShotFn = (c) => {
  const cam = move({ position: [10.5, 5.2, 16], target: [17.6, 4.2, -14] }, { position: [10.9, 5.1, 14], target: [17.6, 4.2, -14] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 320]} shadowSize={40} keyDir={[-0.7, 0.45, 0.4]} light={1.2} grade={{ exposure: 1.12, dof: 0.7 }}>
      <BigStreet seed="pharm" day cars={false} trees={false} />
      <Sky t={c.t} tint="day" seed="morning" />
      {Array.from({ length: 8 }, (_, i) => {
        const p: V3 = [17.2 + (i % 2) * 0.6, 0, 1 - i * 3.3];
        const y = Math.PI + (random(`ph${i}`) - 0.5) * 0.5;
        return <Hero key={i} pose={throatPose(p, y, { headPitch: -0.1 })} position={p} yaw={y} look={crowdLook(40 + i)} />;
      })}
      {/* the green cross, a blade sign on the facade ahead */}
      <group position={[20.6, 9.5, -30]}>
        <mesh>
          <BoxG args={[0.4, 4.4, 4.4]} />
          <Flat color="#1A1C22" />
        </mesh>
        {[[0.3, 3.6, 1.2], [0.3, 1.2, 3.6]].map((s, i) => (
          <mesh key={i}>
            <BoxG args={s as V3} />
            <Glow color="#2FE08A" />
          </mesh>
        ))}
        <Halo position={[-0.4, 0, 0]} size={11} color="#2FE08A" opacity={0.5} />
      </group>
    </Shot>
  );
};

/** A big phone close-up: an emergency call, the waveform flat, CALL FAILED. */
const PhoneShot: React.FC<{ c: ShotCtx; at: V3; draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => void; glow: string; children: React.ReactNode; stage?: Partial<React.ComponentProps<typeof Stage>> }> = ({
  c,
  at,
  draw,
  glow,
  children,
  stage,
}) => {
  const cam = move({ position: [at[0] + 0.06, at[1] + 0.02, at[2] + 2.15], target: at }, { position: [at[0] + 0.03, at[1], at[2] + 1.75], target: at }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} stars={false} shadowSize={10} {...stage}>
      {children}
      <group position={at}>
        <mesh castShadow>
          <BoxG args={[0.46, 0.92, 0.06]} />
          <Flat color="#15171C" />
        </mesh>
        <CanvasPanel position={[0, 0, 0.032]} w={0.4} h={0.84} px={420} glow draw={draw} />
        <mesh position={[0.06, -0.58, -0.02]} scale={[0.8, 0.6, 0.7]}>
          <icosahedronGeometry args={[0.22, 2]} />
          <meshLambertMaterial color={P.skin} flatShading />
        </mesh>
      </group>
      <pointLight position={[at[0], at[1], at[2] + 1]} color={glow} intensity={3} distance={4} decay={2} />
      <Halo position={[at[0], at[1], at[2] - 0.05]} size={1.8} color={glow} opacity={0.3} />
    </Shot>
  );
};
const c1Call: ShotFn = (c) => (
  <PhoneShot c={c} at={[16.4, 5.0, 13]} glow={c.lt > 0.9 ? "#FF5A5A" : "#7FB8FF"} draw={drawCall(k01(c.lt, 0.75, 0.95), c.t)} stage={{ keyDir: [-0.7, 0.45, 0.4] }}>
    <BigStreet seed="morning" day cars={false} />
    <Sky t={c.t} tint="day" seed="morning" />
  </PhoneShot>
);

/** The dispatch room: every line ringing, no voice on any of them. */
const OPERATORS: { p: V3; yaw: number; seed: number }[] = [
  { p: [-6, 0, DISPATCH_ROWS[1] + 1.7], yaw: Math.PI - 0.3, seed: 51 },
  { p: [3, 0, DISPATCH_ROWS[1] + 1.7], yaw: Math.PI + 0.2, seed: 52 },
  { p: [-11, 0, DISPATCH_ROWS[0] + 1.7], yaw: Math.PI + 0.2, seed: 53 },
  { p: [6, 0, DISPATCH_ROWS[0] + 1.7], yaw: Math.PI - 0.2, seed: 54 },
  { p: [2.2, 0, DISPATCH_ROWS[1] + 3.6], yaw: 0.25, seed: 55 },
];
const c1Dispatch: ShotFn = (c) => {
  const cam = move({ position: [6, 4.6, 22], target: [0, 6.6, 0] }, { position: [5.4, 4.5, 20], target: [0, 6.8, 0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.8} shadowSize={30} grade={{ dof: 0.4 }}>
      <Dispatch t={c.t} />
      <pointLight position={[0, 7, 16]} color="#C8D8FF" intensity={90} distance={26} decay={2} />
      {OPERATORS.map((o, i) => {
        const pose = i === 4 ? wavePose(c.t + i, { lShoulder: [0.3, 1.0], rShoulder: [1.1, 0.4], rElbow: 1.6, lElbow: 0.4 }) : mergePose(REST, { expression: "alarm", lShoulder: [0.4, 0.5 + Math.sin(c.t * 3 + i) * 0.2], rShoulder: [0.4, 0.5], lElbow: 0.6, rElbow: 0.6, headYaw: Math.sin(c.t * 2 + i) * 0.3 });
        return (
          <React.Fragment key={i}>
            <Speaker pose={pose} position={o.p} yaw={o.yaw} t={c.lt} start={0.2 + i * 0.15} cam={cam.position} look={crowdLook(o.seed)} seed={`op${i}`} size={0.6} />
            <Headset pose={pose} position={o.p} yaw={o.yaw} />
          </React.Fragment>
        );
      })}
    </Shot>
  );
};

/** Storm at the airport: a jet on approach, landing lights blazing, the tower behind. */
const c1Runway: ShotFn = (c) => {
  const k = c.lt / 2.4;
  const plane: V3 = [0, 26 - k * 8, -150 + k * 70];
  const cam = move({ position: [-70, 6, -40], target: [0, 18, -110] }, { position: [-66, 5.6, -38], target: [0, 16, -100] }, c);
  const flash = Math.max(0, 1 - Math.abs(c.lt - 0.8) / 0.12);
  return (
    <Shot mood="storm" camera={cam} fog={[40, 380]} shadowSize={60} light={0.8 + flash * 2} overlay={<AbsoluteFill style={{ background: "#E8F0FF", opacity: flash * 0.35 }} />}>
      <Runway t={c.t} />
      <ControlTower position={[60, 0, -90]} scale={1.2} />
      <Sky t={c.t} tint="storm" seed="storm" y={60} radius={260} count={20} />
      <group position={plane} rotation={[0.08, 0, 0]} scale={6}>
        <Plane position={[0, 0, 0]} t={c.t} />
      </group>
      {[-1, 1].map((s) => (
        <React.Fragment key={s}>
          <Halo position={[plane[0] + s * 4, plane[1] - 1.5, plane[2] + 20]} size={22} color="#FFF4E0" opacity={0.85} />
          <mesh position={[plane[0] + s * 4, plane[1] - 1.5, plane[2] + 19.5]}>
            <boxGeometry args={[0.9, 0.5, 0.2]} />
            <Glow color="#FFFFFF" />
          </mesh>
        </React.Fragment>
      ))}
      <LightShaft from={[plane[0], plane[1] - 1.5, plane[2] + 20]} to={[plane[0], 0, plane[2] + 75]} r0={1.4} r1={9} color="#F4F0E0" opacity={0.18} />
      <LightningBolt top={[-90, 90, -260]} bottom={[-70, 0, -240]} flash={flash} seed="bolt1" />
      <Rain center={[cam.position[0] + 4, 14, cam.position[2] - 22]} size={[40, 30, 40]} t={c.t} count={900} thickness={0.05} opacity={0.4} />
    </Shot>
  );
};

/** In the tower cab: the controller at the scope, mouth open, nothing on the radio. */
const TOWER_GUY: V3 = [1.2, 0, 0.9];
const c1Tower: ShotFn = (c) => {
  const yaw = 0.35;
  const pose = mergePose(REST, { expression: "alarm", lShoulder: [0.9, 0.25], lElbow: 1.5, rShoulder: [0.3, 0.3], rElbow: 0.5, headYaw: 0.25 });
  const head = headPosition(pose, TOWER_GUY, yaw);
  const cam = move({ position: add(head, [2.2, -0.3, 6.6]), target: add(head, [0, -0.7, 0]) }, { position: add(head, [1.9, -0.3, 5.7]), target: add(head, [0, -0.65, 0]) }, c);
  const flash = Math.max(0, 1 - Math.abs(c.lt - 1.0) / 0.1);
  return (
    <Shot mood="storm" camera={cam} fog={false} stars={false} light={0.8 + flash} shadowSize={14} overlay={<AbsoluteFill style={{ background: "#E8F0FF", opacity: flash * 0.25 }} />}>
      <TowerCab t={c.t} drawScope={drawScope} flash={flash} />
      <Speaker pose={pose} position={TOWER_GUY} yaw={yaw} t={c.lt} start={0.3} cam={cam.position} look={CONTROLLER} size={0.55} seed="twr" />
      <Headset pose={pose} position={TOWER_GUY} yaw={yaw} />
      <Rain center={[0, 6, -18]} size={[40, 14, 8]} t={c.t} count={500} thickness={0.04} opacity={0.35} />
    </Shot>
  );
};

/** The ER: two doctors, masks on, gesturing across the bed; the monitor racing. */
const DOC_A: V3 = [-0.8, 0, -2.4];
const DOC_B: V3 = [4.9, 0, 0.4];
const docPose = (t: number, seed: number): Pose =>
  mergePose(REST, {
    expression: "alarm",
    lShoulder: [0.9 + Math.sin(t * 6 + seed) * 0.25, 0.7],
    rShoulder: [1.0 + Math.cos(t * 5 + seed) * 0.25, 0.55],
    lElbow: 0.9,
    rElbow: 1.1 + Math.sin(t * 7 + seed) * 0.3,
  });
const c1ER: ShotFn = (c) => {
  const cam = move({ position: [-2.4, 5.4, 12.5], target: [0.4, 3.6, -1.2] }, { position: [-2.0, 5.2, 11.2], target: [0.4, 3.7, -1.2] }, c);
  const pa = docPose(c.t, 0);
  const pb = docPose(c.t, 2);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.5} shadowSize={14} grade={{ dof: 0.6, exposure: 0.85 }}>
      <ERRoom t={c.t} fast={k01(c.lt, 0, 1.5)} />
      <LightShaft from={[0, 8.6, 0]} to={[0, 2.2, 0]} r0={2.1} r1={3.2} color="#F4FAFF" opacity={0.1} />
      <Hero pose={pa} position={DOC_A} yaw={0} look={SCRUBS} />
      <Mask pose={pa} position={DOC_A} yaw={0} />
      <Hero pose={pb} position={DOC_B} yaw={-Math.PI / 2} look={SCRUBS} />
      <Mask pose={pb} position={DOC_B} yaw={-Math.PI / 2} />
    </Shot>
  );
};

const c1Doc: ShotFn = (c) => {
  const pose = mergePose(docPose(c.t, 0), { expression: "worried", headYaw: Math.sin(c.lt * 3) * 0.15 });
  const head = headPosition(pose, DOC_A, 0);
  const cam = move({ position: add(head, [1.3, -0.1, 4.6]), target: add(head, [0, -0.35, 0]) }, { position: add(head, [1.1, -0.1, 4.0]), target: add(head, [0, -0.3, 0]) }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.5} shadowSize={8} grade={{ exposure: 0.85 }}>
      <ERRoom t={c.t} fast={1} />
      <Hero pose={pose} position={DOC_A} look={SCRUBS} />
      <Mask pose={pose} position={DOC_A} />
    </Shot>
  );
};

/** Stuck in a lift: he presses PRESS AND SPEAK, opens his mouth… nothing. */
const LIFT_ME: V3 = [2.15, 0, -0.55];
const BUTTON: V3 = [LIFT.intercom[0] - 0.3, LIFT.intercom[1] - 0.3, LIFT.intercom[2]];
const c1Lift: ShotFn = (c) => {
  const yaw = Math.PI / 2;
  const press = k01(c.lt, 0.1, 0.45);
  const base = mergePose(REST, { expression: "worried", headYaw: -0.15 });
  const rest = handRestTarget(base, LIFT_ME, yaw);
  const target: V3 = [rest[0] + (BUTTON[0] - rest[0]) * press, rest[1] + (BUTTON[1] - rest[1]) * press, rest[2] + (BUTTON[2] - rest[2]) * press];
  const pose = reachTo(base, "l", target.map((x) => Math.round(x * 20) / 20) as V3, LIFT_ME, yaw);
  const fl = 0.55 + 0.45 * (random(`lf${Math.floor(c.t * 10)}`) > 0.3 ? 1 : 0.2);
  const cam = move({ position: [3.15, 4.3, 3.3, ], target: [2.4, 3.5, -0.7], fov: 52 }, { position: [3.1, 4.25, 2.9], target: [2.4, 3.5, -0.7], fov: 52 }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.6} shadowSize={8}>
      <Lift t={c.t} flicker={fl} press={press} />
      <Speaker pose={pose} position={LIFT_ME} yaw={yaw} t={c.lt} start={0.55} cam={cam.position} size={0.6} seed="lift" />
    </Shot>
  );
};
const handRestTarget = (pose: Pose, position: V3, yaw: number): V3 => {
  const h = headPosition(pose, position, yaw);
  return [h[0] + Math.sin(yaw) * 0.5 - Math.cos(yaw) * 0.7, h[1] - 2.0, h[2] + Math.cos(yaw) * 0.5 + Math.sin(yaw) * 0.7];
};

/** From above: red "call failed" pulses blooming across the whole city. */
const c1Pulses: ShotFn = (c) => {
  const cam = move({ position: [36, 70, 82], target: [0, 0, -6] }, { position: [32, 64, 74], target: [0, 0, -8] }, c);
  const pts = Array.from({ length: 46 }, (_, i) => {
    const onX = i % 2 === 0;
    const line = (Math.floor(random(`pl${i}`) * 6) - 3) * 14;
    const along = (random(`pa${i}`) - 0.5) * 84;
    return { p: (onX ? [line, 0.3, along] : [along, 0.3, line]) as V3, ph: random(`pp${i}`) };
  });
  return (
    <Shot mood="overcast" camera={cam} fog={[60, 360]} shadowSize={80} light={1.0}>
      <CityGrid seed="calls" blocks={6} block={14} modify={() => ({ power: 0.2 })} />
      <Sky t={c.t} tint="overcast" seed="calls" y={58} radius={240} />
      {pts.map((q, i) => {
        const k = ((c.t * 0.9 + q.ph) % 1 + 1) % 1;
        return (
          <React.Fragment key={i}>
            <mesh position={q.p} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.4 + k * 4.2, 0.7 + k * 4.4, 24]} />
              <meshBasicMaterial color="#FF3A3A" transparent opacity={(1 - k) * 0.9} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh position={[q.p[0], 0.6, q.p[2]]}>
              <octahedronGeometry args={[0.45, 0]} />
              <Glow color="#FF4A4A" />
            </mesh>
          </React.Fragment>
        );
      })}
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 the brain still knows

const VoidSet: React.FC<{ t: number; tint?: string }> = ({ t, tint = "#7F5AFF" }) => (
  <>
    <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <meshLambertMaterial color="#0E0C1C" />
    </mesh>
    {Array.from({ length: 21 }, (_, i) => (
      <React.Fragment key={i}>
        <mesh position={[(i - 10) * 3, 0.01, -20]}>
          <BoxG args={[0.04, 0.01, 80]} />
          <Glow color={tint} opacity={0.25} />
        </mesh>
        <mesh position={[0, 0.01, (i - 10) * 3 - 20]}>
          <BoxG args={[80, 0.01, 0.04]} />
          <Glow color={tint} opacity={0.25} />
        </mesh>
      </React.Fragment>
    ))}
    <Motes center={[0, 5, 0]} size={[30, 10, 30]} t={t} count={160} color="#C8A8FF" scale={0.06} />
  </>
);

/** "Really strange": a slow push into his face as the world drains to violet dark. */
const c2Strange: ShotFn = (c) => {
  const pose = mergePose(REST, { expression: "worried", headYaw: Math.sin(c.lt * 1.5) * 0.12 });
  const head = headPosition(pose, [0, 0, 0]);
  const cam = move({ position: add(head, [0.6, 0.0, 7.2]), target: add(head, [0, -0.6, 0]) }, { position: add(head, [0.2, 0.05, 3.0]), target: head }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} stars={false} light={0.6} shadowSize={8} keyDir={[0.6, 0.6, 0.5]}>
      <VoidSet t={c.t} />
      <pointLight position={[-3, 5, -3]} color="#A85AFF" intensity={60} distance={14} decay={2} />
      <pointLight position={[3.5, 4, -2]} color="#5AD8FF" intensity={40} distance={12} decay={2} />
      <Hero pose={pose} position={[0, 0, 0]} />
    </Shot>
  );
};

const BRAIN: V3 = [0, 7, 0];
const WordOrbit: React.FC<{ t: number; cam: V3; spin?: number }> = ({ t, cam, spin = 0.22 }) => (
  <group>
    {WORDS.map((w, i) => {
      const ring = i % 3;
      const r = 5.2 + ring * 1.8;
      const tilt = [0.25, -0.35, 0.55][ring];
      const a = (i / WORDS.length) * Math.PI * 2 * 3 + t * spin * (ring % 2 ? -1 : 1);
      const x = Math.cos(a) * r;
      const z0 = Math.sin(a) * r;
      const y = z0 * Math.sin(tilt);
      const z = z0 * Math.cos(tilt);
      const p: V3 = [BRAIN[0] + x, BRAIN[1] + y, BRAIN[2] + z];
      const yaw = Math.atan2(cam[0] - p[0], cam[2] - p[2]);
      return <Word key={i} text={w} position={p} rotation={[0, yaw, 0]} w={2.2} color={i % 4 === 0 ? AMBER : i % 4 === 1 ? "#9AE6FF" : "#E8E4DA"} bright={1.3} />;
    })}
  </group>
);
const c2Brain: ShotFn = (c) => {
  const cam = move({ position: [0, 9, 21], target: BRAIN }, { position: [1.5, 8.4, 18], target: BRAIN }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} stars light={0.8} shadowSize={14} keyDir={[0.4, 0.8, 0.6]}>
      <VoidSet t={c.t} tint="#FF5AB8" />
      <pointLight position={[0, 12, 6]} color="#FFB0E0" intensity={120} distance={30} decay={2} />
      <pointLight position={[0, 4, -6]} color="#5AD8FF" intensity={90} distance={30} decay={2} />
      <Brain position={BRAIN} scale={2.1} t={c.t} rotation={[0.15, c.t * 0.25, 0]} />
      <WordOrbit t={c.t} cam={cam.position} />
    </Shot>
  );
};
const c2Words: ShotFn = (c) => {
  const cam = move({ position: [11.5, 9.6, 9.5], target: BRAIN }, { position: [9.6, 8.8, 7.6], target: BRAIN }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} stars light={0.8} shadowSize={14} keyDir={[0.4, 0.8, 0.6]} grade={{ dof: 1.3 }}>
      <VoidSet t={c.t} tint="#FF5AB8" />
      <pointLight position={[0, 12, 6]} color="#FFB0E0" intensity={120} distance={30} decay={2} />
      <pointLight position={[0, 4, -6]} color="#5AD8FF" intensity={90} distance={30} decay={2} />
      <Brain position={BRAIN} scale={2.1} t={c.t} rotation={[0.15, c.t * 0.25, 0]} />
      <WordOrbit t={c.t} cam={cam.position} spin={0.35} />
    </Shot>
  );
};

/** The hologram scan: a see-through Slavoski, a little glowing brain in his head, healthy vocal cords. */
const HoloMe: React.FC<{ t: number; scan: number; signal?: number; broken?: boolean; cam: V3 }> = ({ t, scan, signal = -1, broken = false, cam }) => {
  const pose = mergePose(REST, { expression: "neutral" });
  const h = headPosition(pose, [0, 0, 0]);
  const throat: V3 = [0, h[1] - 0.92, 0.18];
  const path: V3[] = [
    [0, h[1] + 0.12, 0],
    [0, h[1] - 0.3, -0.25],
    [0, h[1] - 0.82, -0.05],
    throat,
    [0, h[1] - 0.5, 0.62],
  ];
  const seg = (i: number, k: number): V3 => [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k, path[i][2] + (path[i + 1][2] - path[i][2]) * k];
  // the signal can travel brain → throat (segments 0–2) but the last link to the mouth is broken
  const reachSeg = broken ? 3 : 4;
  const s = Math.min(signal, reachSeg - 0.001);
  const bead = signal >= 0 ? seg(Math.floor(s), s - Math.floor(s)) : null;
  const stuck = broken && signal >= reachSeg - 0.05;
  const vib = Math.sin(t * 60) * 0.015;
  return (
    <group>
      <Hero pose={pose} position={[0, 0, 0]} ghost={0.42} />
      <Brain position={[0, h[1] + 0.1, -0.02]} scale={0.21} t={t} ghost={0.85} />
      {/* vocal cords: two bright bands in a V at the throat */}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[sd * (0.06 + vib), throat[1], throat[2]]} rotation={[0, sd * 0.35, 0]}>
          <BoxG args={[0.04, 0.03, 0.24]} />
          <Glow color="#3AFF8A" />
        </mesh>
      ))}
      <Halo position={add(throat, [0, 0, 0.2])} size={1.0} color="#3AFF8A" opacity={0.5} />
      {/* the nerve path */}
      {path.slice(0, -1).map((p, i) => {
        if (broken && i === 3) {
          const gapA = seg(3, 0.35);
          const gapB = seg(3, 0.65);
          return (
            <React.Fragment key={i}>
              <StrutGlow a={p} b={gapA} color="#5AD8FF" />
              <StrutGlow a={gapB} b={path[4]} color="#5AD8FF" />
            </React.Fragment>
          );
        }
        return <StrutGlow key={i} a={p} b={path[i + 1]} color="#5AD8FF" />;
      })}
      {bead ? (
        <mesh position={stuck ? seg(3, 0.33) : bead}>
          <octahedronGeometry args={[0.07, 0]} />
          <Glow color="#FFFFFF" />
        </mesh>
      ) : null}
      {stuck
        ? Array.from({ length: 8 }, (_, i) => {
            const a = random(`spk${i}`) * Math.PI * 2;
            const k = ((t * 3 + random(`spkt${i}`)) % 1 + 1) % 1;
            const base = seg(3, 0.36);
            return (
              <mesh key={i} position={[base[0] + Math.cos(a) * 0.15 * k, base[1] + Math.sin(a) * 0.15 * k, base[2] + 0.05]}>
                <octahedronGeometry args={[0.03, 0]} />
                <Glow color="#FFBA58" opacity={1 - k} />
              </mesh>
            );
          })
        : null}
      {/* the scan ring */}
      <mesh position={[0, 4.6 - scan * 4.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.25, 0.025, 4, 48]} />
        <Glow color="#5AD8FF" />
      </mesh>
      <Halo position={[0, 2.5, 0]} size={8} color="#5AD8FF" opacity={0.12} />
      <SoundWave origin={path[4]} dir={[0, -0.05, 1]} cam={cam} t={-1} />
    </group>
  );
};
const StrutGlow: React.FC<{ a: V3; b: V3; color: string }> = ({ a, b, color }) => <Strut a={a} b={b} w={0.035} color={color} glow />;
const c2Holo: ShotFn = (c) => {
  const cam = move({ position: [2.2, 3.3, 5.6], target: [0, 2.85, 0] }, { position: [1.6, 3.15, 4.2], target: [0, 2.75, 0] }, c);
  return (
    <Shot
      mood="space"
      camera={cam}
      fog={false}
      stars={false}
      light={0.5}
      shadows={false}
      overlay={<CardLine text="VOCAL CORDS: HEALTHY" sub="NO DAMAGE FOUND" y={1180} appearFrame={startFrame(c) + 18} accent="#3AFF8A" />}
    >
      <VoidSet t={c.t} tint="#5AD8FF" />
      <HoloMe t={c.t} scan={(c.lt / 2.2) % 1} cam={cam.position} />
    </Shot>
  );
};
const c2Signal: ShotFn = (c) => {
  const cam = move({ position: [2.9, 3.4, 2.9], target: [0, 3.05, 0.15] }, { position: [2.5, 3.35, 2.5], target: [0, 3.05, 0.15] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} stars={false} light={0.5} shadows={false} grade={{ dof: 0.25 }}>
      <VoidSet t={c.t} tint="#5AD8FF" />
      <HoloMe t={c.t} scan={0.9} signal={c.lt * 3.2} broken cam={cam.position} />
    </Shot>
  );
};
/** "Vanished": the word he meant to say, HELLO, breaks apart at his lips. */
const c2Vanish: ShotFn = (c) => {
  const pose = mergePose(REST, { expression: c.lt > 0.3 ? "alarm" : "worried" });
  const head = headPosition(pose, [0, 0, 0]);
  const cam = move({ position: add(head, [1.4, -0.2, 4.6]), target: add(head, [0, -0.4, 0.8]) }, { position: add(head, [1.0, -0.2, 3.8]), target: add(head, [0, -0.4, 0.8]) }, c);
  const k = k01(c.lt, 0.5, 1.25);
  const letters = "HELLO".split("");
  return (
    <Shot mood="space" camera={cam} fog={false} stars={false} light={0.6} shadowSize={8} keyDir={[0.6, 0.6, 0.5]}>
      <VoidSet t={c.t} />
      <pointLight position={[-3, 5, -3]} color="#A85AFF" intensity={60} distance={14} decay={2} />
      <pointLight position={[2, 3, 3]} color="#FFBA58" intensity={20 * (1 - k)} distance={8} decay={2} />
      <Hero pose={pose} position={[0, 0, 0]} />
      {letters.map((ch, i) => {
        const x0 = (i - 2) * 0.5;
        const drift = k * (1 + random(`hl${i}`));
        return (
          <Word
            key={i}
            text={ch}
            position={[x0 * (1 + k * 0.6), head[1] - 0.95 - drift * 0.9 + Math.sin(i + c.t * 3) * 0.04, head[2] + 1.5 + drift * 0.4]}
            rotation={[drift * (random(`hr${i}`) - 0.5) * 3, 0, drift * (random(`hz${i}`) - 0.5) * 2]}
            w={1.6}
            color={AMBER}
            bright={2.2 - k * 1.6}
            opacity={1 - clamp01((k - 0.5) / 0.5)}
          />
        );
      })}
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 a new language (golden hour plaza)

const PLAZA_STAGE = { mood: "sunset" as const, fog: [60, 360] as [number, number], keyDir: [-0.8, 0.32, -0.5] as V3, shadowSize: 60, light: 1.15 };
const PlazaSet: React.FC<{ t: number; lines?: string[] }> = ({ t, lines = ["TYPE.", "DON'T TALK."] }) => (
  <>
    <Plaza screen={drawScreen(lines)} power={0.25} />
    <Sky t={t} tint="sunset" seed="plaza" y={44} radius={230} />
    <SunDisc position={[-230, 40, -260]} r={22} color="#FFD08A" glow="#FF8A3A" halo={0.7} />
    <pointLight position={[-30, 20, -20]} color="#FF9A5A" intensity={260} distance={90} decay={2} />
    <Motes center={[0, 7, 6]} size={[50, 12, 40]} t={t} count={70} scale={0.06} color="#FFD8A0" />
  </>
);

const drawChat = (t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0E1220";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#1A2034";
  ctx.fillRect(0, 0, W, H * 0.1);
  ctx.font = CANVAS_FONT(W * 0.065);
  fitText(ctx, "MUM", W / 2, H * 0.06, W * 0.6, W * 0.065, "#E8E4DA");
  const msgs: [string, boolean][] = [
    ["can u talk??", false],
    ["NO. can u?", true],
    ["no!! what is happening", false],
    ["no idea. everyone's silent", true],
    ["love u. text me", false],
  ];
  msgs.forEach(([m, mine], i) => {
    const at = i * 0.32;
    if (t < at) return;
    const k = Math.min(1, (t - at) / 0.12);
    const y = H * (0.18 + i * 0.15);
    ctx.font = CANVAS_FONT(W * 0.055, false);
    const tw = Math.min(W * 0.66, ctx.measureText(m).width + W * 0.08);
    const x = mine ? W * 0.94 - tw : W * 0.06;
    ctx.globalAlpha = k;
    ctx.fillStyle = mine ? "#3D8BFF" : "#2A3046";
    ctx.beginPath();
    ctx.roundRect(x, y, tw, H * 0.1, W * 0.04);
    ctx.fill();
    fitText(ctx, m, x + tw / 2, y + H * 0.055, tw - W * 0.06, W * 0.055, "#FFFFFF", false);
    ctx.globalAlpha = 1;
  });
};
const c3Chat: ShotFn = (c) => (
  <PhoneShot c={c} at={[2, 4.6, 26]} glow="#7FB8FF" draw={drawChat(c.lt)} stage={{ ...PLAZA_STAGE }}>
    <PlazaSet t={c.t} />
  </PhoneShot>
);

/** The plaza at golden hour: everyone on their phone, a river of messages rising into the sky. */
const CROWD: { p: V3; yaw: number; seed: number }[] = Array.from({ length: 16 }, (_, i) => {
  const row = Math.floor(i / 4);
  const col = i % 4;
  return { p: [(col - 1.5) * 4.6 + (row % 2) * 1.6 + (random(`cx${i}`) - 0.5), 0, 10 - row * 6 + (random(`cz${i}`) - 0.5)] as V3, yaw: (random(`cy${i}`) - 0.5) * 1.6, seed: 60 + i };
});
const phonePose = (seed: number, over: Partial<Pose> = {}): Pose => mergePose(REST, { rShoulder: [0.75, 0.15], rElbow: 1.35, headPitch: -0.38, lShoulder: [0.1, 0.12], expression: "neutral", ...over });
const c3Texting: ShotFn = (c) => {
  const cam = move({ position: [3, 5, 36], target: [0, 10, -4] }, { position: [2.5, 5.2, 33], target: [0, 12, -4] }, c);
  const phones = CROWD.map((q) => {
    const h = headPosition(phonePose(q.seed), q.p, q.yaw);
    return [h[0] + Math.sin(q.yaw) * 0.8, h[1] - 0.9, h[2] + Math.cos(q.yaw) * 0.8] as V3;
  });
  return (
    <Shot {...PLAZA_STAGE} camera={cam} grade={{ dof: 0.5 }}>
      <PlazaSet t={c.t} />
      {CROWD.map((q, i) => (
        <React.Fragment key={i}>
          <Hero pose={phonePose(q.seed)} position={q.p} yaw={q.yaw} look={crowdLook(q.seed)} />
          <HeldPhone pose={phonePose(q.seed)} position={q.p} yaw={q.yaw} />
        </React.Fragment>
      ))}
      <BubbleRiver from={phones} t={c.t} height={34} speed={5} />
    </Shot>
  );
};

/** Handwritten cardboard signs held in front of the chest (both fists just behind the card). */
const holdPose = (over: Partial<Pose> = {}): Pose => mergePose(REST, { lShoulder: [1.05, 0.1], rShoulder: [1.05, 0.1], lElbow: 0.9, rElbow: 0.9, ...over });
const HeldCard: React.FC<{ pose: Pose; position: V3; yaw: number; text: string }> = ({ pose, position, yaw, text }) => {
  const h = headPosition(pose, position, yaw);
  // fists are ~0.95 in front of the chest at this pose; the card sits just in front of them
  const fwd = 1.42;
  const p: V3 = [position[0] + Math.sin(yaw) * fwd, h[1] - 1.25, position[2] + Math.cos(yaw) * fwd];
  return (
    <group position={p} rotation={[-0.08, yaw, 0]}>
      <mesh castShadow>
        <BoxG args={[2.3, 1.3, 0.05]} />
        <Flat color="#B8986A" />
      </mesh>
      <CanvasPanel position={[0, 0, 0.03]} w={2.2} h={1.2} px={440} draw={drawCard(text)} />
    </group>
  );
};
const SIGNERS: { p: V3; yaw: number; text: string; look?: number }[] = [
  { p: [-0.5, 0, 14], yaw: 0.15, text: "HELLO :)" },
  { p: [-4.6, 0, 9.5], yaw: 0.35, text: "COFFEE?", look: 71 },
  { p: [4.2, 0, 10.5], yaw: -0.3, text: "I'M OK", look: 72 },
  { p: [0.8, 0, 4.5], yaw: 0.05, text: "BUS 42?", look: 73 },
];
const c3Writing: ShotFn = (c) => {
  const cam = move({ position: [1.2, 4.2, 30], target: [0, 3.3, 9] }, { position: [1.0, 4.1, 27.5], target: [0, 3.3, 10] }, c);
  return (
    <Shot {...PLAZA_STAGE} camera={cam} grade={{ dof: 0.8 }}>
      <PlazaSet t={c.t} />
      {SIGNERS.map((s, i) => {
        const pose = holdPose({ expression: i === 0 ? "smile" : "neutral", headYaw: Math.sin(c.t * 1.5 + i) * 0.2 });
        return (
          <React.Fragment key={i}>
            <Hero pose={pose} position={s.p} yaw={s.yaw} look={s.look ? crowdLook(s.look) : undefined} />
            <HeldCard pose={pose} position={s.p} yaw={s.yaw} text={s.text} />
          </React.Fragment>
        );
      })}
    </Shot>
  );
};

/** Sign language: two people talking with their hands, light trails following every movement. */
const SIGN_A: V3 = [-1.7, 0, 11.5];
const SIGN_B: V3 = [1.7, 0, 11.5];
const c3Sign: ShotFn = (c) => {
  const cam = move({ position: [0.9, 4.0, 26], target: [0, 3.1, 11.5] }, { position: [0.7, 3.9, 24.5], target: [0, 3.1, 11.5] }, c);
  const ya = Math.PI / 2 - 0.5;
  const yb = -Math.PI / 2 + 0.5;
  const pa = (t: number) => signPose(t, 0);
  const pb = (t: number) => signPose(t, 2.3, { expression: "awe" });
  return (
    <Shot {...PLAZA_STAGE} camera={cam} grade={{ dof: 0.9 }}>
      <PlazaSet t={c.t} />
      <Hero pose={pa(c.t)} position={SIGN_A} yaw={ya} look={TEACHER} />
      <Hero pose={pb(c.t)} position={SIGN_B} yaw={yb} />
      {(["l", "r"] as const).map((sd) => (
        <React.Fragment key={sd}>
          <HandTrail poseAt={pa} t={c.t} position={SIGN_A} yaw={ya} side={sd} color="#7FE8FF" />
          <HandTrail poseAt={pb} t={c.t} position={SIGN_B} yaw={yb} side={sd} color="#FFBA58" />
        </React.Fragment>
      ))}
    </Shot>
  );
};

/** Phones up: a sea of glowing screens under the giant sign. */
const upPose = (i: number, t: number): Pose => mergePose(REST, { rShoulder: [2.85, 0.3 + Math.sin(t * 2 + i) * 0.08], rElbow: 0.25, headPitch: 0.35, expression: i === 0 ? "awe" : "neutral" });
const c3PhonesUp: ShotFn = (c) => {
  const cam = move({ position: [0.5, 2.2, 31], target: [0, 9, 0] }, { position: [0.3, 2.0, 28.5], target: [0, 10.5, 0] }, c);
  const people: { p: V3; yaw: number; seed: number }[] = [{ p: [0, 0, 18], yaw: Math.PI, seed: 0 }, ...CROWD.map((q, i) => ({ p: q.p, yaw: Math.PI + (random(`u${i}`) - 0.5) * 0.4, seed: q.seed }))];
  return (
    <Shot {...PLAZA_STAGE} camera={cam} grade={{ dof: 0.6 }}>
      <PlazaSet t={c.t} lines={["YOUR PHONE", "IS YOUR VOICE"]} />
      {people.map((q, i) => (
        <React.Fragment key={i}>
          <Hero pose={upPose(i, c.t)} position={q.p} yaw={q.yaw} look={i === 0 ? undefined : crowdLook(q.seed)} />
          <HeldPhone pose={upPose(i, c.t)} position={q.p} yaw={q.yaw} out glow={i % 3 ? "#9FD0FF" : "#FFE2A0"} />
        </React.Fragment>
      ))}
    </Shot>
  );
};

/** The teacher who has always signed, on the stage, spotlit, suddenly the most important person here. */
const TEACH_AT: V3 = [PLAZA.stage[0], PLAZA.stageTop, PLAZA.stage[2]];
const teachPose = (t: number) => signPose(t, 0.7, { expression: "smile" });
const c3Teacher: ShotFn = (c) => {
  const head = headPosition(teachPose(c.t), TEACH_AT);
  const cam = move({ position: [2.6, 4.6, -5.5], target: add(head, [0, -0.9, 0]) }, { position: [2.1, 4.5, -7.5], target: add(head, [0, -0.8, 0]) }, c);
  return (
    <Shot {...PLAZA_STAGE} camera={cam} light={0.85} grade={{ dof: 1 }}>
      <PlazaSet t={c.t} lines={["SIGN", "LANGUAGE"]} />
      <LightShaft from={[TEACH_AT[0] + 2, 22, TEACH_AT[2] + 6]} to={[TEACH_AT[0], TEACH_AT[1], TEACH_AT[2]]} r0={0.6} r1={3.4} color="#FFE8C0" opacity={0.3} />
      <pointLight position={[TEACH_AT[0] + 1.5, 9, TEACH_AT[2] + 4]} color="#FFE8C0" intensity={80} distance={16} decay={2} />
      <Hero pose={teachPose(c.t)} position={TEACH_AT} look={TEACHER} />
      {(["l", "r"] as const).map((sd) => (
        <HandTrail key={sd} poseAt={teachPose} t={c.t} position={TEACH_AT} side={sd} color="#7FE8FF" steps={18} />
      ))}
      {[-3.4, 3.6].map((x, i) => (
        <Hero key={i} pose={mergePose(REST, { headPitch: 0.3 })} position={[x, 0, -12.5 + i]} yaw={Math.PI} look={crowdLook(80 + i)} />
      ))}
    </Shot>
  );
};

/** Everyone copying her: a crowd of hands drawing light. */
const c3Copy: ShotFn = (c) => {
  const cam = move({ position: [-9, 9, 30], target: [0, 3, 2] }, { position: [-7.5, 8.4, 27], target: [0, 3, 2] }, c);
  const crowd = CROWD.slice(0, 12).map((q, i) => ({ p: [q.p[0], 0, q.p[2] - 2] as V3, yaw: Math.PI + (random(`cp${i}`) - 0.5) * 0.5, seed: q.seed, ph: i * 0.37 }));
  return (
    <Shot {...PLAZA_STAGE} camera={cam} grade={{ dof: 0.5 }}>
      <PlazaSet t={c.t} lines={["SIGN", "LANGUAGE"]} />
      <Hero pose={teachPose(c.t)} position={TEACH_AT} look={TEACHER} />
      {(["l", "r"] as const).map((sd) => (
        <HandTrail key={sd} poseAt={teachPose} t={c.t} position={TEACH_AT} side={sd} color="#7FE8FF" />
      ))}
      {crowd.map((q, i) => {
        const pz = (t: number) => signPose(t - 0.25, 0.7 + q.ph * 0.1, { expression: "awe" });
        return (
          <React.Fragment key={i}>
            <Hero pose={pz(c.t)} position={q.p} yaw={q.yaw} look={i === 5 ? undefined : crowdLook(q.seed)} />
            <HandTrail poseAt={pz} t={c.t} position={q.p} yaw={q.yaw} side="r" color={i % 2 ? "#FFBA58" : "#7FE8FF"} steps={10} />
          </React.Fragment>
        );
      })}
    </Shot>
  );
};

/** From above at sunset: the whole plaza signing, the screen calling for teachers. */
const c3World: ShotFn = (c) => {
  const cam = move({ position: [22, 34, 58], target: [0, 4, -6] }, { position: [18, 30, 52], target: [0, 5, -6] }, c);
  const crowd = Array.from({ length: 36 }, (_, i) => ({ p: [((i % 9) - 4) * 3.6 + (random(`wx${i}`) - 0.5), 0, 14 - Math.floor(i / 9) * 5 + (random(`wz${i}`) - 0.5)] as V3, seed: 90 + i }));
  return (
    <Shot {...PLAZA_STAGE} camera={cam}>
      <PlazaSet t={c.t} lines={["TEACHERS", "NEEDED"]} />
      <Hero pose={teachPose(c.t)} position={TEACH_AT} look={TEACHER} />
      {crowd.map((q, i) => {
        const pz = (t: number) => signPose(t, i * 0.4);
        return (
          <React.Fragment key={i}>
            <Hero pose={pz(c.t)} position={q.p} yaw={Math.PI} look={crowdLook(q.seed)} />
            <HandTrail poseAt={pz} t={c.t} position={q.p} yaw={Math.PI} side="r" color={i % 2 ? "#FFBA58" : "#7FE8FF"} steps={8} />
          </React.Fragment>
        );
      })}
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 danger (rainy neon dusk)

/** Chapter clock: seconds since "imagine". The pedestrian crosses, the car brakes and stops 2+ units short. */
const dangerT = (c: ShotCtx) => c.t - wordAt(c.words, "imagine", 30, c.t - c.lt);
const WALKER_SPEED = 1.3;
const walkerX = (T: number) => 9.4 - WALKER_SPEED * Math.max(0, T);
const CAR_X = 6.1;
/** Seconds after "imagine" when the car starts braking (the horn); it stops 1 s later, 2.6 units short of him. */
export const BRAKE = 2.3;
const V0 = 16;
const DECEL = 16;
const STOP_FRONT = -2.6;
const TURN = BRAKE + 0.7;
const carFront = (T: number) => {
  if (T < BRAKE) return STOP_FRONT - (V0 * V0) / (2 * DECEL) - V0 * (BRAKE - T);
  const s = Math.min(T - BRAKE, V0 / DECEL);
  return STOP_FRONT - (V0 * V0) / (2 * DECEL) + V0 * s - 0.5 * DECEL * s * s;
};
const HALF_CAR = 1.55 * CITY;
const ME_WARN: V3 = [14.5, 0, 4];
const WARN_YAW = -1.9;

const RainStreet: React.FC<{ t: number; T: number; cam: V3 }> = ({ t, T, cam }) => {
  const front = carFront(T);
  const carZ = front - HALF_CAR;
  return (
    <>
      <BigStreet seed="neon" cars={false} lamps={false} />
      <pointLight position={[-8, 12, 3]} color="#FFD8A0" intensity={160} distance={40} decay={2} />
      {/* zebra crossing at z = 0 */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-10 + i * 2.5, 0.05, 0]}>
          <BoxG args={[1.3, 0.02, 3.6]} />
          <Flat color="#D8D2C4" />
        </mesh>
      ))}
      <Neon position={[20.8, 11, -14]} yaw={Math.PI / 2} text="NOODLES" color="#FF3A8A" />
      <Neon position={[-20.8, 12, -22]} yaw={-Math.PI / 2} text="OPEN" color="#3AE0FF" />
      <Neon position={[20.8, 10, -40]} yaw={Math.PI / 2} text="HOTEL" color="#FFBA58" />
      <group scale={CITY}>
        <Car position={[CAR_X / CITY, 0, carZ / CITY]} color={P.carTeal} lights />
      </group>
      {[-1, 1].map((s) => (
        <React.Fragment key={s}>
          <Halo position={[CAR_X + s * 1.7, 2.1, front + 0.2]} size={3.2} color="#FFF4D8" opacity={0.6} />
          <LightShaft from={[CAR_X + s * 1.7, 2.1, front + 0.1]} to={[CAR_X + s * 2.4, 0.2, front + 18]} r0={0.4} r1={3.2} color="#FFF0D0" opacity={0.09} />
        </React.Fragment>
      ))}
      <pointLight position={[CAR_X, 2.6, front + 1.5]} color="#FFF0D0" intensity={22} distance={24} decay={2} />
      <WetStreaks
        toward={cam}
        lights={[
          { at: [CAR_X - 1.7, 0, front], color: "#FFF0D0", length: 16, width: 1.4, opacity: 0.3 },
          { at: [CAR_X + 1.7, 0, front], color: "#FFF0D0", length: 16, width: 1.4, opacity: 0.3 },
          { at: [19.5, 0, -14], color: "#FF3A8A", length: 18, width: 2.2 },
          { at: [-19.5, 0, -22], color: "#3AE0FF", length: 18, width: 2.2 },
          { at: [19.5, 0, -40], color: "#FFBA58", length: 20, width: 2.2 },
          { at: [14, 0, 7], color: "#DDC284", length: 12, width: 1.6, opacity: 0.25 },
          { at: [-14, 0, -12.25], color: "#DDC284", length: 12, width: 1.6, opacity: 0.25 },
        ]}
      />
      <Sky t={t} tint="storm" seed="neon" y={50} radius={230} />
    </>
  );
};
const walkerPose = (T: number) => mergePose(walkPose(T * 1.3, 0.7), { rShoulder: [0.45, 0.15], rElbow: 1.65, headPitch: -0.45, expression: "neutral" });
const Walker: React.FC<{ T: number }> = ({ T }) => {
  const turned = T > TURN;
  const yaw = -Math.PI / 2 + (turned ? -k01(T, TURN, TURN + 0.3) * 1.2 : 0);
  const p: V3 = [walkerX(Math.min(T, TURN)), 0, 0];
  const pose = turned ? mergePose(REST, { expression: "alarm", rShoulder: [0.45, 0.15], rElbow: 1.65, lShoulder: [0.3, 0.9], lean: -0.15 }) : walkerPose(T);
  return (
    <>
      <Hero pose={pose} position={p} yaw={yaw} look={crowdLook(14)} />
      <HeldPhone pose={pose} position={p} yaw={yaw} glow="#9FD0FF" />
    </>
  );
};
const warnPose = (t: number) => wavePose(t);
const c4Wide: ShotFn = (c) => {
  const T = dangerT(c);
  const cam = move({ position: [16.5, 5.0, 19], target: [5, 2.8, -20] }, { position: [16.2, 4.8, 17.2], target: [5, 2.8, -20] }, c);
  return (
    <Shot mood="storm" camera={cam} fog={[30, 260]} shadowSize={40} light={1.0}>
      <RainStreet t={c.t} T={T} cam={cam.position} />
      <Walker T={T} />
      <Speaker pose={warnPose(c.t)} position={ME_WARN} yaw={WARN_YAW} t={T} start={0.2} cam={cam.position} size={0.7} seed="w1" />
      <Rain center={[cam.position[0] - 6, 12, cam.position[2] - 14]} size={[30, 26, 30]} t={c.t} count={900} thickness={0.04} opacity={0.35} />
    </Shot>
  );
};
const c4Warn: ShotFn = (c) => {
  const T = dangerT(c);
  const yaw = WARN_YAW;
  const head = headPosition(mergePose(REST, {}), ME_WARN, yaw);
  const cam = move({ position: add(head, [-3.4, -0.6, -5.4]), target: add(head, [0, -0.5, 0]) }, { position: add(head, [-2.9, -0.55, -4.7]), target: add(head, [0, -0.5, 0]) }, c);
  return (
    <Shot mood="storm" camera={cam} fog={[30, 240]} shadowSize={16} light={1.0}>
      <RainStreet t={c.t} T={T} cam={cam.position} />
      <Walker T={T} />
      <Speaker pose={warnPose(c.t)} position={ME_WARN} yaw={yaw} t={T} start={0.1} cam={cam.position} size={0.8} seed="w2" />
      <pointLight position={add(head, [-3, 1, -2])} color="#FF6AA8" intensity={6} distance={10} decay={2} />
      <Rain center={[head[0] - 2, 8, head[2] + 2]} size={[10, 14, 10]} t={c.t} count={500} thickness={0.025} opacity={0.3} />
    </Shot>
  );
};
/** Over his shoulder: eyes on the phone, Slavoski waving uselessly behind him, the headlights growing. */
const c4Back: ShotFn = (c) => {
  const T = dangerT(c);
  const wx = walkerX(Math.min(T, TURN));
  const head = headPosition(walkerPose(T), [wx, 0, 0], -Math.PI / 2);
  // over Slavoski's shoulder (he is in the blurred foreground, waving): the walker never looks round
  const cam = move({ position: [17.3, 4.9, 4.1], target: add(head, [0, -0.4, 0]) }, { position: [16.8, 4.8, 3.9], target: add(head, [0, -0.4, 0]) }, c);
  return (
    <Shot mood="storm" camera={cam} fog={[30, 240]} shadowSize={16} light={1.0} grade={{ dof: 0.9, bloom: 0.45 }}>
      <RainStreet t={c.t} T={T} cam={cam.position} />
      <Walker T={T} />
      <Speaker pose={warnPose(c.t)} position={ME_WARN} yaw={WARN_YAW} t={T} start={0.2} cam={cam.position} size={0.7} seed="w3" />
      <Rain center={[wx - 2, 8, 1]} size={[10, 14, 10]} t={c.t} count={500} thickness={0.025} opacity={0.3} />
    </Shot>
  );
};
/** Low on the wet road: the car stops dead, a few steps short. He finally looks up. */
const c4Stop: ShotFn = (c) => {
  const T = dangerT(c);
  const front = carFront(T);
  const shake = T > BRAKE && T < BRAKE + V0 / DECEL ? 0.05 : 0;
  const cam = move({ position: [-6.5, 1.6, 9.5], target: [5.6, 2.2, -1.8] }, { position: [-5.8, 1.5, 8.6], target: [5.6, 2.3, -1.8] }, c);
  return (
    <Shot mood="storm" camera={cam} fog={[30, 240]} shadowSize={24} light={1.0} shake={shake} grade={{ dof: 0.5, bloom: 0.45 }}>
      <RainStreet t={c.t} T={T} cam={cam.position} />
      <Walker T={T} />
      <Rain center={[2, 8, 4]} size={[14, 14, 14]} t={c.t} count={600} thickness={0.025} opacity={0.3} />
      {T > BRAKE ? <Halo position={[CAR_X, 0.4, front - 1]} size={4} color="#FFE2C0" opacity={0.25} /> : null}
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 to be heard (night)

const c5Mind: ShotFn = (c) => {
  const cam = move({ position: [0, 46, 110], target: [0, 42, -40] }, { position: [0, 44, 100], target: [0, 44, -40] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[80, 420]} shadowSize={80} light={0.7}>
      <NightCity y={0} z={0} phones={1} t={c.t} />
      <Brain position={[0, 58, -40]} scale={13} t={c.t} rotation={[0.1, c.t * 0.12, 0]} ghost={0.55} />
      <Motes center={[0, 50, -40]} size={[120, 50, 60]} t={c.t} count={140} scale={0.35} color="#FF9AD8" />
    </Shot>
  );
};

const ROOF_ME: V3 = [0, 0, 1.6];
const c5Language: ShotFn = (c) => {
  const pose = mergePose(REST, { headPitch: 0.5, expression: "awe" });
  const cam = move({ position: [0.8, 1.2, -6.5], target: [0, 8.5, 6] }, { position: [0.6, 1.2, -5.8], target: [0, 9.5, 6] }, c);
  const from: V3[] = Array.from({ length: 22 }, (_, i) => [(random(`lb${i}`) - 0.5) * 70, -40, 10 + random(`lz${i}`) * 50]);
  return (
    <Shot mood="night" camera={cam} fog={[80, 420]} shadowSize={20} light={0.7} grade={{ dof: 0.4 }}>
      <Rooftop />
      <NightCity y={-60} z={-20} phones={0.6} t={c.t} />
      <Hero pose={pose} position={ROOF_ME} yaw={Math.PI} />
      <BubbleRiver from={from} t={c.t} height={90} speed={12} scale={2.2} />
    </Shot>
  );
};

/** Long ago: a storyteller at the fire, the first sound waves reaching every listener. */
const TELLER: V3 = [0, 0, -2.6];
const LISTENERS: { p: V3; yaw: number; seed: number }[] = [
  { p: [-2.7, 0, 1.2], yaw: Math.PI * 0.82, seed: 3 },
  { p: [2.7, 0, 1.0], yaw: -Math.PI * 0.82, seed: 4 },
  { p: [-1.2, 0, 3.0], yaw: Math.PI * 0.95, seed: 6 },
  { p: [1.5, 0, 3.0], yaw: -Math.PI * 0.95, seed: 7 },
];
const tellerPose = (t: number) => mergePose(REST, { expression: Math.sin(t * 9) > 0 ? "alarm" : "smile", lShoulder: [0.6, 1.4 + Math.sin(t * 2) * 0.2], rShoulder: [0.9, 0.9], rElbow: 1.0, lElbow: 0.4, headPitch: 0.05 });
const Campfire: React.FC<{ t: number; cam: V3; spread?: number }> = ({ t, cam, spread = 0 }) => {
  const tp = tellerPose(t);
  const m = mouthOf(tp, TELLER);
  return (
    <>
      <Cave />
      <Flames position={[0, 0.2, 0]} size={1.6} t={t} seed="camp" />
      <pointLight position={[0, 2, 0]} color="#FF9A4A" intensity={70 + Math.sin(t * 13) * 10} distance={22} decay={2} castShadow />
      <Motes center={[0, 4, 0]} size={[3, 8, 3]} t={t} count={60} color="#FFB04A" scale={0.06} rise={0.5} />
      <Hero pose={tp} position={TELLER} look={FUR} />
      {LISTENERS.map((l, i) => (
        <Hero key={i} pose={kneelPose({ headPitch: 0.15, expression: "awe" })} position={[l.p[0], 0, l.p[2]]} yaw={l.yaw} look={{ ...FUR, ...crowdLook(l.seed), jacket: "#7A5232", jacketShade: "#5E3E26", jeans: "#5E3E26", zipper: "#7A5232", shoe: "#5E3E26" }} />
      ))}
      <SoundWave origin={m.at} dir={[0, 0.05, 1]} cam={cam} t={t} size={1.1} rate={0.35} />
      {spread > 0
        ? [0, 1, 2, 3].map((i) => {
            const k = ((t * 0.5 + i / 4) % 1 + 1) % 1;
            return (
              <mesh key={i} position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[k * 120 * spread, k * 120 * spread + 0.8 + k * 2, 64]} />
                <meshBasicMaterial color={AMBER} transparent opacity={(1 - k) * 0.6} depthWrite={false} toneMapped={false} />
              </mesh>
            );
          })
        : null}
    </>
  );
};
const c5Fire: ShotFn = (c) => {
  const cam = move({ position: [0.6, 7.2, 11], target: [0, 3.0, -2.6] }, { position: [0.5, 6.8, 9.8], target: [0, 3.1, -2.6] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[30, 260]} shadowSize={16} light={0.35} grade={{ dof: 0.8 }}>
      <Campfire t={c.t} cam={cam.position} />
    </Shot>
  );
};
const c5Ages: ShotFn = (c) => {
  const k = k01(c.lt, 0, 2.2);
  const cam: CameraSpec = { position: [6 + k * 10, 4 + k * 50, 12 + k * 40], target: [0, 1 + k * 2, -2] };
  return (
    <Shot mood="night" camera={cam} fog={[60, 420]} shadowSize={30} light={0.35}>
      <Campfire t={c.t} cam={cam.position} spread={0.35 + k * 0.8} />
    </Shot>
  );
};

/** The rooftop: he breathes in, opens his mouth to shout across the city… and nothing comes. */
const c5Heard: ShotFn = (c) => {
  const breathe = k01(c.lt, 0.1, 0.5);
  const pose = mergePose(REST, { expression: c.lt > 0.55 ? "alarm" : "neutral", headPitch: 0.08 + breathe * 0.12, lShoulder: [0.2, 0.5 * breathe], rShoulder: [0.2, 0.5 * breathe], lean: -0.08 * breathe });
  const head = headPosition(pose, ROOF_ME);
  const cam = move({ position: add(head, [1.4, -0.9, 6.4]), target: add(head, [0, -0.3, 0]) }, { position: add(head, [1.0, -0.8, 5.0]), target: add(head, [0, -0.25, 0]) }, c);
  return (
    <Shot mood="night" camera={cam} fog={[80, 420]} shadowSize={14} light={0.7}>
      <Rooftop />
      <NightCity y={-60} z={-120} phones={0.6} t={c.t} />
      <pointLight position={[2, 5, 6]} color="#9FB8FF" intensity={20} distance={14} decay={2} />
      <Speaker pose={pose} position={ROOF_ME} t={c.lt} start={0.6} cam={cam.position} size={1.0} seed="last" />
    </Shot>
  );
};

// ---------------------------------------------------------------- thumbnail

/** Slavoski on the rooftop at night, mouth wide open, the glowing wave cracking apart in front of him. */
export const thumbShot: ShotFn = () => {
  const pose = mergePose(REST, { expression: "alarm", lShoulder: [0.3, 0.7], rShoulder: [0.3, 0.7], lElbow: 0.9, rElbow: 0.9, headPitch: 0.12 });
  const head = headPosition(pose, ROOF_ME);
  const cam: CameraSpec = { position: add(head, [1.2, -1.6, 7.6]), target: add(head, [0, -1.2, 0]) };
  return (
    <Stage mood="night" camera={cam} fog={[80, 420]} shadowSize={14} light={0.8}>
      <Rooftop />
      <NightCity y={-60} z={-120} phones={0.6} t={0} />
      <pointLight position={[2, 5, 6]} color="#9FB8FF" intensity={24} distance={14} decay={2} />
      <Hero pose={pose} position={ROOF_ME} />
      <SoundWave origin={mouthOf(pose, ROOF_ME).at} dir={[0, 0, 1]} cam={cam.position} t={0.75} dead size={1.3} seed="thumb" />
      <Bubble3D position={[-2.6, 6.8, -3]} text="?" scale={1.1} />
    </Stage>
  );
};

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldWake },
    { cue: "eight billion", fn: coldCity },
    { cue: "And nobody", fn: coldSpeak },
    { cue: "Not a single", fn: coldStreet },
  ],
  c1: [
    { cue: null, fn: c1Throat },
    { cue: "lost their", fn: c1Pharmacy },
    { cue: "But then", fn: c1Call },
    { cue: "start failing", fn: c1Dispatch },
    { cue: "Pilots", fn: c1Runway },
    { cue: "air traffic", fn: c1Tower },
    { cue: "Doctors", fn: c1ER },
    { cue: "during emergencies", fn: c1Doc },
    { cue: "And millions", fn: c1Lift },
    { cue: "call for help", fn: c1Pulses },
  ],
  c2: [
    { cue: null, fn: c2Strange },
    { cue: "Your brain", fn: c2Brain },
    { cue: "every word", fn: c2Words },
    { cue: "Your vocal", fn: c2Holo },
    { cue: "But somehow", fn: c2Signal },
    { cue: "has vanished", fn: c2Vanish },
  ],
  c3: [
    { cue: null, fn: c3Chat },
    { cue: "people turn", fn: c3Texting },
    { cue: "writing", fn: c3Writing },
    { cue: "sign", fn: c3Sign },
    { cue: "Phones", fn: c3PhonesUp },
    { cue: "And people who", fn: c3Teacher },
    { cue: "suddenly have", fn: c3Copy },
    { cue: "the rest", fn: c3World },
  ],
  c4: [
    { cue: null, fn: c4Wide },
    { cue: "warn someone", fn: c4Warn },
    { cue: "danger", fn: c4Back },
    { cue: "looking at", fn: c4Stop },
  ],
  c5: [
    { cue: null, fn: c5Mind },
    { cue: "It wouldn't even", fn: c5Language },
    { cue: "It would lose", fn: c5Fire },
    { cue: "thousands", fn: c5Ages },
    { cue: "The ability", fn: c5Heard },
  ],
};
