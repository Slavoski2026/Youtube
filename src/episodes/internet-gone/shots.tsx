/**
 * Shots for "What If the Internet Disappeared?" (ep. 8).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * The man in the leather jacket (the CEO) is only ever seen from behind, as hands, or as a silhouette.
 * Arc: sunrise bedroom (the hook) → the night before (office, data centres) → dusk explainer →
 * overcast morning of failures → rain (queues) → day 2 command room → sunny breakfast.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Building, CityGrid, Ground, Road, StreetSet } from "../../slavoski/city";
import { BoxG, IcoG } from "../../slavoski/detail";
import { crowdLook, suitLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Clouds, LeafyTree, Rain } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { CardLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import { handPosition, headPosition, Hero, lerpPose, mergePose, reach, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { sittingPose } from "../../slavoski/room";
import { CanvasPanel, ScreenHtml } from "../../slavoski/screens";
import { FacetedEarth } from "../../slavoski/space";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import { wordAt, type CuedShot } from "../../slavoski/timeline";
import { SmokeCluster } from "../../slavoski/fx";
import { Factory, House, HillRing, Suitcase } from "../no-work-2036/props";
import { CellTower, CommandRoom, WALL } from "../satellites-dark/props";
import { BED, Bedroom } from "../smart-animals/props";
import { AtmWall, ATM, BILLBOARD, Billboard, BOARD, CITY, DeadScreen, PHONE, Phone3D, Terminal } from "../ww3-countdown/props";
import {
  AppGrid,
  BankCard,
  BOWL,
  Breakfast,
  BucketTruck,
  ButtonConsole,
  Campus,
  CardReader,
  CEO_LOOK,
  CeoOffice,
  ChatScreen,
  Chip,
  ClusterRoom,
  CableNet,
  DeskPhone,
  drawAiVideo,
  drawBoard,
  drawLineStopped,
  drawNetStatus,
  drawSign,
  Exchange,
  HIVIS,
  HqTower,
  KITCHEN,
  Kitchen,
  MUG,
  NoInternetScreen,
  OFFICE,
  OfficeChair,
  OpenOffice,
  PaperMap,
  PhoneBox,
  PRESS_TARGET,
  RouterRack,
  ServerHall,
  TROPHY,
  Umbrella,
} from "./props";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
const startFrame = (c: ShotCtx) => Math.round((c.t - c.lt) * 30);
/** Seconds into the shot when `phrase` is spoken (searching from the shot start), or `fallback`. */
const cueAt = (c: ShotCtx, phrase: string, fallback: number) => {
  const s = c.t - c.lt;
  const w = wordAt(c.words, phrase, s - 0.3, -1);
  return w < 0 ? fallback : w - s;
};
/** Lazily computed (IK searches are slow: run each once, not per frame). */
const once = <T,>(f: () => T) => {
  let v: T | undefined;
  return () => (v ??= f());
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

const CLOUD = { day: "#F4F6FA", dawn: "#F2C9B0", sunset: "#F7C0A0", storm: "#3E4656", overcast: "#AEB6C2" } as const;
const Sky: React.FC<{ t: number; tint: keyof typeof CLOUD; y?: number; radius?: number; count?: number; seed?: string }> = ({ t, tint, y = 45, radius = 200, count = 16, seed = "sky" }) => (
  <Clouds t={t} color={CLOUD[tint]} y={y} radius={radius} count={count} seed={seed} />
);

const YAW_BACK = Math.PI; // facing −Z (away from a camera on +Z)

// ---------------------------------------------------------------- poses (computed once)

/** Slavoski sitting up in bed (same placement as ep. 4/5), phone in the right hand. */
const BED_HERO: V3 = [BED.x, BED.mattressTop - (1.55 + 0.02 - 0.18), -2.55];
const bedPose = (over: Partial<Pose> = {}): Pose =>
  mergePose(REST, { lHip: [1.47, 0.06], rHip: [1.47, 0.06], lKnee: 0.04, rKnee: 0.04, lShoulder: [0.25, 0.25], rShoulder: [0.25, 0.25], lElbow: 0.5, rElbow: 0.5, ...over });
const phoneArm = once(() => reach(bedPose({ headPitch: -0.3 }), "r", [BED.x - 0.3, 1.82, -1.35]).pose);
const PhoneInHand: React.FC<{ pose: Pose; glow: string }> = ({ pose, glow }) => {
  const h = handPosition(pose, "r", BED_HERO);
  const p: V3 = [h[0] + 0.05, h[1] + 0.22 + PHONE.h / 2 - 0.12, h[2]];
  return (
    <>
      <Phone3D position={p} rotation={[-0.7, Math.PI, 0]} glow={glow} />
      <pointLight position={[p[0], p[1] + 0.2, p[2] - 0.4]} color={glow} intensity={6} distance={4} decay={2} />
    </>
  );
};

/** A standing person looking down at a phone in the right hand (hero space, facing +Z). */
const crowdPhone = once(() => {
  const pose = reach(mergePose(REST, { headPitch: -0.35 }), "r", [-0.3, 1.9, 1.05]).pose;
  const hp = handPosition(pose, "r");
  return { pose, phone: [hp[0] + 0.02, hp[1] + 0.22 + PHONE.h / 2 - 0.14, hp[2] + 0.05] as V3 };
});
const PhonePerson: React.FC<{ position: V3; yaw: number; seed: number; glow?: string; over?: Partial<Pose> }> = ({ position, yaw, seed, glow = "#3A3F4E", over }) => {
  const { pose, phone } = crowdPhone();
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <Hero pose={{ ...pose, ...over }} look={seed < 0 ? undefined : crowdLook(seed)} />
      <Phone3D position={phone} rotation={[-0.75, Math.PI, 0]} glow={glow} />
    </group>
  );
};

/** The CEO at the console (world), right fist raised (k = 0) or on the dome (k = 1). */
const PRESS_HERO: V3 = [0, 0, 1.3];
const PRESS_BASE = mergePose(REST, { headPitch: -0.4 });
const pressUp = once(() => reach(PRESS_BASE, "r", [0.25, 3.9, 0.6], { position: PRESS_HERO, yaw: YAW_BACK }).pose);
const pressDown = once(() => reach(PRESS_BASE, "r", PRESS_TARGET, { position: PRESS_HERO, yaw: YAW_BACK }).pose);
const pressPose = (k: number) => lerpPose(pressUp(), pressDown(), clamp01(k));
/** A slam: fist up, then down hard at `at`, holding there. */
const slam = (lt: number, at: number) => (lt < at - 0.35 ? 0 : lt < at ? ((lt - (at - 0.35)) / 0.35) ** 2 : 1);
/** Repeated slams at each time in `hits` (down hard, a short hold, back up); stays down after the last. */
const hits = (lt: number, at: number[]) => {
  let k = 0;
  at.forEach((h, i) => {
    const last = i === at.length - 1;
    const down = lt < h - 0.3 ? 0 : lt < h ? ((lt - (h - 0.3)) / 0.3) ** 2 : 1;
    const up = last ? 0 : clamp01((lt - h - 0.12) / 0.3);
    k = Math.max(k, down * (1 - up));
  });
  return k;
};

/** The CEO seated at the kitchen table facing the TV: left hand on the table, right hand eating. */
const SITBASE = sittingPose({ headPitch: -0.05 });
const sitLeft = once(() => reach(SITBASE, "l", [-0.8, KITCHEN.tableTop + 0.23, 0.8], { position: KITCHEN.chair, yaw: YAW_BACK }).pose);
const eatLow = once(() => reach(sitLeft(), "r", [BOWL[0] + 0.1, BOWL[1] + 0.6, BOWL[2] + 0.15], { position: KITCHEN.chair, yaw: YAW_BACK }).pose);
const eatHigh = once(() => reach(sitLeft(), "r", [0.3, 2.4, 1.0], { position: KITCHEN.chair, yaw: YAW_BACK }).pose);
const MUG_GRIP: V3 = [0, 0.25, 0.28];
const mugLow = once(() => reach(sitLeft(), "r", [MUG[0], MUG[1] + MUG_GRIP[1], MUG[2] + MUG_GRIP[2]], { position: KITCHEN.chair, yaw: YAW_BACK }).pose);
const mugHigh = once(() => reach(sitLeft(), "r", [0.55, 2.42, 1.15], { position: KITCHEN.chair, yaw: YAW_BACK }).pose);
const eatPose = (t: number) => {
  const k = 0.5 - 0.5 * Math.cos(t * 2.6);
  return lerpPose(eatLow(), eatHigh(), k * k);
};

/** Umbrella in the right hand (hero space). */
const umbPose = once(() => reach(REST, "r", [-0.95, 3.0, 0.5]).pose);
/** Desk-phone call: right fist at the right ear, handset between fist and head (hero space). */
const callPose = once(() => reach(mergePose(REST, { expression: "worried", headYaw: -0.1 }), "r", [-1.02, 3.32, 0.12]).pose);
/** Holding a paper map open with both hands in front of the chest (hero space). */
const mapPose = once(() => {
  const l = reach(mergePose(REST, { headPitch: -0.3, expression: "worried" }), "l", [0.78, 1.95, 1.05]).pose;
  return reach(l, "r", [-0.78, 1.95, 1.05]).pose;
});

// ---------------------------------------------------------------- shared sets

/** Warm morning sun pooling in the bedroom from the window side. */
const SunIn: React.FC = () => (
  <>
    <pointLight position={[-4.6, 3.6, -0.6]} color="#FFD2A0" intensity={16} distance={14} decay={2} />
    <Halo position={[-6.3, 3.4, -0.6]} size={5} color="#FFE2B8" opacity={0.5} />
  </>
);

/** Phone close-up in the sunlit bedroom, its screen an HTML overlay pinned to the 3D phone. */
const PHONE_CU: V3 = [BED.x - 0.2, 3.0, 0.9];
const BedroomPhone: React.FC<{ c: ShotCtx; glow: string; screen: (w: number, h: number) => React.ReactNode; push?: number; shake?: number }> = ({ c, glow, screen, push = 0.35, shake = 0 }) => {
  const P0 = PHONE_CU;
  const cam = move({ position: [P0[0] + 0.05, P0[1] + 0.1, P0[2] + 2.1], target: [P0[0], P0[1] + 0.1, P0[2]] }, { position: [P0[0] + 0.03, P0[1] + 0.1, P0[2] + 2.1 - push], target: [P0[0], P0[1] + 0.12, P0[2]] }, c);
  const jitter = shake ? Math.sin(c.t * 80) * 0.01 * shake : 0;
  const pos: V3 = [P0[0] + jitter, P0[1], P0[2]];
  return (
    <Shot
      mood="dawn"
      camera={cam}
      fog={false}
      stars={false}
      light={1.45}
      keyDir={[-0.9, 0.45, 0.15]}
      shadowSize={8}
      overlay={
        <ScreenHtml c={[pos[0], pos[1], pos[2] + PHONE.d / 2 + 0.003]} w={PHONE.screenW} h={PHONE.screenH} cam={cam} width={c.width} height={c.height}>
          {screen}
        </ScreenHtml>
      }
    >
      <Bedroom lampOn={false} dawn />
      <Phone3D position={pos} glow={glow} />
      <pointLight position={[pos[0], pos[1], pos[2] + 1]} color={glow} intensity={3} distance={4} decay={2} />
      <SunIn />
    </Shot>
  );
};

/** The night city around the HQ tower (kit grid ×3.5 with the centre block left for the tower). */
const NightCity: React.FC<{ power?: number }> = ({ power = 1 }) => (
  <group>
    <group scale={CITY}>
      <CityGrid seed="hq" blocks={7} skip={(bx, bz) => bx === 3 && bz === 3} modify={() => ({ power })} />
    </group>
    <HqTower position={[0, 0, 0]} h={130} />
  </group>
);

/** Earth with its cable network, for the explainer and the failure. */
const NetEarth: React.FC<{ c: ShotCtx; cam: CameraSpec; dead?: number; aiDark?: number; light?: number }> = ({ c, cam, dead = 0, aiDark = 0, light = 0.6 }) => (
  <Shot mood="space" camera={cam} fog={false} shadows={false} light={light} keyDir={[0.8, 0.4, 0.5]}>
    <group rotation={[0.35, 1.7 + c.t * 0.035, 0]}>
      <FacetedEarth radius={3} cityLights={0.6 * (1 - dead)} />
      <CableNet r={3} t={c.t} dead={dead} aiDark={aiDark} />
    </group>
  </Shot>
);

// ---------------------------------------------------------------- cold open: tomorrow morning, no internet

/** 0 s: a phone in the sunrise bedroom, loading… then NO INTERNET. */
const coldPhone: ShotFn = (c) => <BedroomPhone c={c} glow={c.lt > 0.5 ? "#3A3F4E" : "#8FD0FF"} push={0.45} shake={c.lt > 0.48 && c.lt < 0.62 ? 1 : 0} screen={(w, h) => <NoInternetScreen w={w} h={h} t={c.t} k={k01(c.lt, 0.45, 0.55)} />} />;

/** Slavoski sitting up in bed in the morning sun, staring at the dead phone. */
const coldWake: ShotFn = (c) => {
  const cam = move({ position: [BED.x + 2.4, 4.9, 6.6], target: [BED.x - 0.4, 2.95, -2.0] }, { position: [BED.x + 2.0, 4.7, 5.7], target: [BED.x - 0.4, 2.95, -2.0] }, c);
  const pose = { ...phoneArm(), expression: c.lt > 0.8 ? ("alarm" as const) : ("worried" as const), headPitch: -0.3 + (c.lt > 0.8 ? 0.08 : 0) };
  return (
    <Shot mood="dawn" camera={cam} fog={false} stars={false} light={1.0} keyDir={[-0.9, 0.45, 0.15]} shadowSize={10}>
      <Bedroom lampOn={false} dawn />
      <SunIn />
      <Hero pose={pose} position={BED_HERO} />
      <PhoneInHand pose={pose} glow="#3A3F4E" />
    </Shot>
  );
};

/** The street outside: everyone frozen, staring at phones. The café's FREE WI-FI sign goes out. */
const STREET_PEOPLE: { p: V3; yaw: number; seed: number }[] = [
  { p: [15.2, 0, 2], yaw: -0.4, seed: 3 },
  { p: [18.4, 0, -4], yaw: 0.6, seed: 8 },
  { p: [14.6, 0, -11], yaw: -0.2, seed: 12 },
  { p: [18.8, 0, -17], yaw: 0.3, seed: 17 },
  { p: [-14.5, 0, -10], yaw: 0.5, seed: 21 },
  { p: [-17.5, 0, -14], yaw: -0.3, seed: 26 },
];
const coldStreet: ShotFn = (c) => {
  const cam = move({ position: [9.5, 4.6, 13], target: [17, 3.8, -8] }, { position: [10, 4.5, 11.5], target: [17.2, 3.8, -8] }, c);
  const signOff = c.lt > 0.6;
  return (
    <Shot mood="dawn" camera={cam} fog={[40, 260]} shadowSize={30} light={0.85}>
      <BigStreet seed="morning" day lamps={false} />
      <Sky t={c.t} tint="dawn" seed="morning" y={55} />
      {STREET_PEOPLE.map((s, i) => (
        <PhonePerson key={i} position={s.p} yaw={s.yaw} seed={s.seed} over={{ expression: i % 2 ? "worried" : "neutral" }} />
      ))}
      <mesh position={[21.2, 7.6, -8]} rotation={[0, -Math.PI / 2, 0]}>
        <BoxG args={[5.4, 1.4, 0.2]} />
        <Flat color="#15161C" />
      </mesh>
      <CanvasPanel position={[21.05, 7.6, -8]} rotation={[0, -Math.PI / 2, 0]} w={5} h={1.1} px={640} draw={drawSign("FREE WI-FI", "#15161C", signOff ? "#3A3D48" : "#7FE8FF", 0.62)} />
      {!signOff ? <Halo position={[20.6, 7.6, -8]} size={6} color="#7FE8FF" opacity={0.35} /> : null}
    </Shot>
  );
};

/** His phone again: the apps die one per "No…". */
const coldApps: ShotFn = (c) => {
  const a = cueAt(c, "YouTube", 0.36);
  const b = cueAt(c, "TikTok", 1.32);
  const g = cueAt(c, "Google", 2.46);
  const dead = clamp01((c.lt - a) / 0.2) + clamp01((c.lt - b) / 0.2) + clamp01((c.lt - g) / 0.2);
  return <BedroomPhone c={c} glow="#2A3050" push={0.5} screen={(w, h) => <AppGrid w={w} h={h} dead={dead} t={c.t} />} />;
};

// ---------------------------------------------------------------- 01 one man (the night before)

/** Night city, one tower, one lit floor at the top: push up toward it. */
const c1Tower: ShotFn = (c) => {
  const cam = move({ position: [70, 50, 210], target: [0, 96, 0] }, { position: [58, 66, 172], target: [0, 112, 0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[160, 520]} shadowSize={80}>
      <NightCity />
    </Shot>
  );
};

/** Inside, from behind: a man in a black leather jacket at the window, the city below. */
const WIN_SPOT: V3 = [-5, 0, -7.2];
const c1Silhouette: ShotFn = (c) => {
  const cam = move({ position: [-3.6, 4.0, 3.2], target: [-5.6, 3.9, -12] }, { position: [-3.8, 4.0, 1.6], target: [-5.6, 3.9, -12] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.35} shadowSize={14}>
      <CeoOffice t={c.t} spot={0.4} />
      <Hero pose={mergePose(REST, { headPitch: -0.12 })} position={WIN_SPOT} yaw={YAW_BACK} look={CEO_LOOK} />
    </Shot>
  );
};

/** Wider: the console glowing in its spotlight, him at the window beyond. */
const c1Fiction: ShotFn = (c) => {
  const cam = move({ position: [5.5, 6.2, 11.5], target: [-1.5, 3.2, -5] }, { position: [4.6, 5.8, 10.0], target: [-1.5, 3.2, -5] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.4} shadowSize={14}>
      <CeoOffice t={c.t} />
      <ButtonConsole position={OFFICE.console} cover={0} />
      <Hero pose={mergePose(REST, { headPitch: -0.12, headYaw: 0.1 + c.lt * 0.05 })} position={WIN_SPOT} yaw={YAW_BACK} look={CEO_LOOK} />
    </Shot>
  );
};

/** At the desk, from behind: three monitors of endless chatbots… he's had enough and turns away. */
const DESK_SPOT: V3 = [OFFICE.desk[0], 0, OFFICE.desk[2] + 2.25];
const c1Desk: ShotFn = (c) => {
  const cam = move({ position: [9.2, 4.9, 4.2], target: [7, 3.1, -4.5] }, { position: [9.0, 4.8, 3.2], target: [7, 3.1, -4.5] }, c);
  const enough = cueAt(c, "enough", 2.1);
  const turn = k01(c.lt, enough - 0.1, enough + 0.5);
  const shake = Math.sin(c.lt * 9) * 0.12 * (1 - turn) * k01(c.lt, 0.6, 1.0);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.4} shadowSize={14}>
      <CeoOffice t={c.t} />
      <Hero pose={mergePose(REST, { headYaw: shake, headPitch: 0.05, lean: 0.06 * (1 - turn) })} position={DESK_SPOT} yaw={YAW_BACK - turn * 0.9} look={CEO_LOOK} />
    </Shot>
  );
};

/** From high behind his shoulder: the giant red button; the safety cover flips up. */
const c1Reveal: ShotFn = (c) => {
  const cam = move({ position: [4.6, 8.4, 6.0], target: [0, 2.2, 0] }, { position: [4.1, 7.6, 5.0], target: [0, 2.2, 0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.4} shadowSize={10}>
      <CeoOffice t={c.t} />
      <ButtonConsole position={OFFICE.console} cover={k01(c.lt, 0.3, 1.1)} />
      <Hero pose={lerpPose(mergePose(REST, { headPitch: -0.35 }), pressUp(), k01(c.lt, 1.1, 2.0))} position={PRESS_HERO} yaw={YAW_BACK} look={CEO_LOOK} />
    </Shot>
  );
};

/** Close over his right shoulder: TURN OFF AI… and the fist slams down on "AI". */
const c1Press: ShotFn = (c) => {
  const hit = cueAt(c, "AI", 0.82);
  const k = slam(c.lt, hit);
  const flash = c.lt > hit ? Math.max(0, 1 - (c.lt - hit) / 0.5) : 0;
  // Straight above the console (screen-up toward the window): the plate reads, his head is only hair at the bottom.
  const cam = move({ position: [0.15, 9.3, -0.4], target: [0, 2.45, 0.22], fov: 31, up: [0, 0, -1] }, { position: [0.12, 8.9, -0.38], target: [0, 2.45, 0.22], fov: 29, up: [0, 0, -1] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.4} shadowSize={8} shake={flash * 0.05}>
      <CeoOffice t={c.t} />
      <ButtonConsole position={OFFICE.console} press={k} cover={1} />
      <Hero pose={pressPose(k)} position={PRESS_HERO} yaw={YAW_BACK} look={CEO_LOOK} />
      {flash > 0 ? <pointLight position={[0, 3, 0.6]} color="#FF3A2A" intensity={20 * flash} distance={10} decay={2} /> : null}
    </Shot>
  );
};

/** Wide, low, behind him: the whole city outside is still lit. Nothing happens. */
const c1Nothing: ShotFn = (c) => {
  const cam = move({ position: [-3.4, 2.8, 10.5], target: [1.2, 4.2, -10] }, { position: [-3.1, 2.8, 9.6], target: [1.2, 4.2, -10] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.35} shadowSize={12}>
      <CeoOffice t={c.t} />
      <ButtonConsole position={OFFICE.console} press={1} cover={1} />
      <Hero pose={mergePose(pressDown(), { headPitch: 0.15, headYaw: c.lt > 1.2 ? 0.25 : 0 })} position={PRESS_HERO} yaw={YAW_BACK} look={CEO_LOOK} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 AI goes dark (night)

/** A data hall: millions of blinking lights… dying in a wave from the far end. */
const c2Hall: ShotFn = (c) => {
  const begin = cueAt(c, "begin", 2.1);
  const cam = move({ position: [0.6, 3.2, 5], target: [-0.3, 2.8, -40] }, { position: [0.5, 3.0, 2], target: [-0.3, 2.8, -40] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[20, 70]} light={0.5} shadowSize={20} stars={false}>
      <ServerHall t={c.t} wave={k01(c.lt, begin - 0.1, begin + 0.5) * 0.6} />
    </Shot>
  );
};

/** Aerial: the data-centre campus going dark shed by shed. */
const c2Campus: ShotFn = (c) => {
  const cam = move({ position: [70, 70, 110], target: [0, 0, 0] }, { position: [62, 64, 98], target: [0, 0, 0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[120, 420]} shadowSize={80}>
      <Campus t={c.t} off={k01(c.lt, 0.05, 1.0)} />
      <HillRing color="#1E2A26" radius={220} />
    </Shot>
  );
};

/** A laptop chatbot: the bubbles pop away, CONNECTION LOST. */
const LAPTOP: V3 = [0, 2.4, 0];
const Laptop: React.FC = () => (
  <group>
    <mesh position={[0, LAPTOP[1] - 0.04, 0.25]} castShadow>
      <BoxG args={[1.5, 0.06, 1.0]} />
      <Flat color="#8A8E98" />
    </mesh>
    <mesh position={[0, LAPTOP[1] + 0.5, -0.28]} castShadow>
      <BoxG args={[1.5, 1.0, 0.05]} />
      <Flat color="#5A5E6A" />
    </mesh>
    <mesh position={[0, LAPTOP[1] - 0.12, 0]} receiveShadow>
      <BoxG args={[6, 0.16, 3]} />
      <Flat color="#5A3E2E" />
    </mesh>
    <mesh position={[0, 3, -3]}>
      <BoxG args={[12, 8, 0.2]} />
      <Flat color="#262A3A" />
    </mesh>
    <mesh position={[-2.4, 4.0, -2.88]}>
      <planeGeometry args={[2.4, 2.2]} />
      <Glow color="#18203E" />
    </mesh>
  </group>
);
const LAP_SCREEN = { c: [0, LAPTOP[1] + 0.5, -0.25] as V3, w: 1.36, h: 0.86 };
const c2Chat: ShotFn = (c) => {
  const cam = move({ position: [0.45, 3.5, 4.6], target: [0, 2.75, -0.3] }, { position: [0.35, 3.4, 3.9], target: [0, 2.78, -0.3] }, c);
  const gone = k01(c.lt, cueAt(c, "disappear", 0.6) - 0.1, cueAt(c, "disappear", 0.6) + 0.6);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      stars={false}
      light={0.35}
      shadowSize={6}
      overlay={
        <ScreenHtml c={LAP_SCREEN.c} w={LAP_SCREEN.w} h={LAP_SCREEN.h} cam={cam} width={c.width} height={c.height}>
          {(w, h) => <ChatScreen w={w} h={h} gone={gone} />}
        </ScreenHtml>
      }
    >
      <Laptop />
      <pointLight position={[0, 3.2, 1.0]} color="#DCE6FF" intensity={4} distance={5} decay={2} />
    </Shot>
  );
};

/** A street screen playing an AI video: it freezes, glitches, VIDEO UNAVAILABLE. */
const c2Video: ShotFn = (c) => {
  const stop = cueAt(c, "stop working", 1.3);
  const cam = move({ position: [0.6, 2.6, 15], target: [0, 6.8, -2] }, { position: [0.5, 2.6, 13.6], target: [0, 6.9, -2] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[60, 300]} shadowSize={40}>
      <BigStreet seed="plaza" cars={false} />
      <Billboard />
      <CanvasPanel position={[BILLBOARD.c[0], BILLBOARD.c[1], BILLBOARD.c[2]]} w={BILLBOARD.w} h={BILLBOARD.h} draw={drawAiVideo(c.t, k01(c.lt, stop - 0.2, stop + 0.6))} />
      <Hero pose={mergePose(REST, { headPitch: 0.45, expression: c.lt > stop ? "worried" : "smile" })} position={[1.0, 0, 3.6]} yaw={Math.PI} look={crowdLook(5)} />
      <Hero pose={mergePose(REST, { headPitch: 0.4, expression: c.lt > stop ? "alarm" : "smile" })} position={[-1.8, 0, 4.6]} yaw={Math.PI - 0.2} look={crowdLook(9)} />
      <Hero pose={mergePose(REST, { headPitch: 0.4 })} position={[3.2, 0, 5.4]} yaw={Math.PI + 0.25} look={crowdLook(14)} />
    </Shot>
  );
};

/** An office at night: every screen flips to ACCESS DENIED. Workers from behind. */
const WORKERS: V3[] = [
  [-6, 0, 0],
  [2, 0, 0],
  [-2, 0, -5],
  [6, 0, -5],
  [-6, 0, -10],
  [2, 0, -10],
];
const workerPose = sittingPose({ lShoulder: [0.7, 0.1], rShoulder: [0.7, 0.1], lElbow: 0.8, rElbow: 0.8 });
const c2Office: ShotFn = (c) => {
  const cam = move({ position: [5.0, 8.6, 11], target: [-0.5, 3.6, -10] }, { position: [4.6, 8.3, 9.8], target: [-0.5, 3.6, -10] }, c);
  const denied = k01(c.lt, 0.25, 1.3);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.5} shadowSize={20}>
      <OpenOffice t={c.t} denied={denied} />
      {WORKERS.map((p, i) => (
        <React.Fragment key={i}>
          <OfficeChair position={p} yaw={YAW_BACK} />
          <Hero
            pose={denied > 0.6 && i % 2 === 0 ? mergePose(workerPose, { lShoulder: [0.2, 1.4], rShoulder: [0.2, 1.4], lElbow: 0.4, rElbow: 0.4, expression: "alarm" }) : workerPose}
            position={p}
            yaw={YAW_BACK}
            look={crowdLook(40 + i)}
          />
        </React.Fragment>
      ))}
    </Shot>
  );
};

/** Behind glass, the company's most powerful cluster: blue → red, OFFLINE. */
const c2Cluster: ShotFn = (c) => {
  const off = cueAt(c, "systems", 1.5);
  const cam = move({ position: [2.4, 5.0, 12.5], target: [0.2, 4.0, -5] }, { position: [2.1, 4.9, 11.2], target: [0.2, 4.1, -5] }, c);
  const k = k01(c.lt, off - 0.15, off + 0.05);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.35} shadowSize={20}>
      <ClusterRoom t={c.t} k={k} />
      <Hero
        pose={mergePose(REST, k > 0.5 ? { lShoulder: [0.15, 1.2], rShoulder: [0.15, 1.2], lElbow: 0.3, rElbow: 0.3, expression: "alarm", headPitch: 0.15 } : { headPitch: 0.15 })}
        position={[0.6, 0, 2.0]}
        yaw={YAW_BACK + 0.15}
        look={crowdLook(77)}
      />
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 the catch (night → dusk explainer)

/** He presses again… and again. The city outside stays lit. */
const c3Again: ShotFn = (c) => {
  const k = hits(c.lt, [0.5, 1.25]);
  const cam = move({ position: [-2.4, 4.8, 9.8], target: [0.8, 3.4, -6] }, { position: [-2.2, 4.7, 8.8], target: [0.8, 3.4, -6] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.4} shadowSize={12}>
      <CeoOffice t={c.t} />
      <ButtonConsole position={OFFICE.console} press={k} cover={1} />
      <Hero pose={pressPose(k)} position={PRESS_HERO} yaw={YAW_BACK} look={CEO_LOOK} />
    </Shot>
  );
};

/** The internet is a web of cables and nodes: only a few AI centres (amber dots) went dark. */
const c3Earth: ShotFn = (c) => {
  const cam = move({ position: [0, 1.2, 21], target: [0, 0, 0] }, { position: [0, 0.9, 19], target: [0, 0, 0] }, c);
  return <NetEarth c={c} cam={cam} aiDark={1} />;
};

/** The AI chip (dark) beside racks of routers that keep blinking. */
const c3Chips: ShotFn = (c) => {
  const cam = move({ position: [1.8, 5.0, 12.5], target: [1.4, 1.9, 0] }, { position: [1.6, 4.9, 11.4], target: [1.4, 2.0, 0] }, c);
  return (
    <Shot
      mood="sunset"
      camera={cam}
      fog={false}
      stars={false}
      light={0.7}
      shadowSize={10}
      overlay={<CardLine text="CABLES • ROUTERS • TOWERS" sub="THE REST OF THE INTERNET: STILL ON" y={470} appearFrame={startFrame(c) + 8} />}
    >
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[30, 0.1, 20]} />
        <Flat color="#2A2E3A" />
      </mesh>
      <mesh position={[0, 5, -3]}>
        <BoxG args={[30, 10, 0.2]} />
        <Flat color="#1E2230" />
      </mesh>
      <mesh position={[1.4, 0.9, 3.6]} castShadow receiveShadow>
        <BoxG args={[2.8, 1.8, 2.6]} />
        <Flat color="#3A3F4E" />
      </mesh>
      <Chip position={[1.4, 1.92, 3.6]} rotation={[0.35, 0.3, 0]} scale={0.95} glow={0} />
      {[1.2, 3.8, 6.4].map((x, i) => (
        <RouterRack key={x} position={[x, 0, -1.2 + i * 0.2]} t={c.t} seed={`r${i}`} />
      ))}
    </Shot>
  );
};

/** Close on the button again: press, press… nothing. */
const c3Press: ShotFn = (c) => {
  const k = hits(c.lt, [0.45, 1.05]);
  const cam = move({ position: [-0.25, 9.2, -0.42], target: [0, 2.45, 0.22], fov: 30, up: [0.18, 0, -1] }, { position: [-0.22, 8.8, -0.4], target: [0, 2.45, 0.22], fov: 28, up: [0.18, 0, -1] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.4} shadowSize={8}>
      <CeoOffice t={c.t} />
      <ButtonConsole position={OFFICE.console} press={k} cover={1} />
      <Hero pose={pressPose(k)} position={PRESS_HERO} yaw={YAW_BACK} look={CEO_LOOK} />
    </Shot>
  );
};

/** Meanwhile at dusk: the cell tower still pulses, people still scroll. */
const c3Online: ShotFn = (c) => {
  const cam = move({ position: [-2, 3.8, 32], target: [3, 6.2, -20] }, { position: [-1.8, 3.8, 30], target: [3, 6.4, -20] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[60, 320]} shadowSize={40} light={0.85}>
      <Ground color="#6A6070" />
      <HillRing color="#4A4058" radius={220} />
      <Sky t={c.t} tint="sunset" seed="dusk" y={60} />
      <CellTower position={[6, 0, -30]} h={24} t={c.t} />
      {Array.from({ length: 8 }, (_, i) => (
        <Building key={i} position={[-46 + i * 13, 0, -58 - (i % 3) * 9]} w={10} d={10} h={16 + random(`dk${i}`) * 26} color={[P.bldgSlate, P.bldgNavy, P.bldgTeal, P.bldgPurple][i % 4]} seed={`dk${i}`} power={0.6} />
      ))}
      <PhonePerson position={[-3, 0, 8]} yaw={0.3} seed={51} glow="#8FD0FF" over={{ expression: "smile" }} />
      <PhonePerson position={[3.4, 0, 4]} yaw={-0.5} seed={52} glow="#8FD0FF" over={{ expression: "smile" }} />
      <PhonePerson position={[-0.6, 0, -4]} yaw={0.1} seed={53} glow="#8FD0FF" />
    </Shot>
  );
};

/** "Unless…": a slow, ominous push in on the glowing network; one cable flickers red. */
const c3Unless: ShotFn = (c) => {
  const cam = move({ position: [0, 0.6, 15], target: [0, 0.2, 0] }, { position: [0, 0.5, 11.5], target: [0, 0.3, 0] }, { ...c, dur: 3.5 });
  const flick = Math.floor(c.t * 8) % 3 === 0 ? 0.04 : 0;
  return <NetEarth c={c} cam={cam} aiDark={1} dead={c.lt > 0.6 ? flick : 0} light={0.45} />;
};

// ---------------------------------------------------------------- 04 offline world (overcast morning)

/** Every provider fails: the cables go dark one after another. */
const c4Cables: ShotFn = (c) => {
  const cam = move({ position: [0, 0.8, 12], target: [0, 0.2, 0] }, { position: [0, 1.4, 18], target: [0, 0.1, 0] }, c);
  return <NetEarth c={c} cam={cam} aiDark={1} dead={k01(c.lt, 0.1, 1.5) * 1.02} light={0.5} />;
};

/** An internet exchange: sparks, smoke, the lights go out. */
const c4Exchange: ShotFn = (c) => {
  const cam = move({ position: [-20, 4.5, 60], target: [1, 13, -15] }, { position: [-18.5, 4.4, 56], target: [1, 13.3, -15] }, c);
  const fail = k01(c.lt, 0.35, 0.6);
  return (
    <Shot mood="overcast" camera={cam} fog={[40, 260]} shadowSize={40} light={0.9}>
      <Ground color="#5A606E" />
      <Road position={[0, 0.01, 4]} width={10} length={200} yaw={Math.PI / 2} />
      <Sky t={c.t} tint="overcast" seed="xc" y={50} />
      <Exchange position={[0, 0, -20]} t={c.t} fail={fail} />
      <SmokeCluster position={[7, 14, -22]} progress={k01(c.lt, 0.5, 2.6)} radius={3.5} rise={5} seed="xs" />
      {[-46, -30, 34, 52].map((x, i) => (
        <Building key={x} position={[x, 0, -36 - (i % 2) * 10]} w={14} d={12} h={24 + i * 7} color={[P.bldgSlate, P.bldgNavy, P.bldgTeal, P.bldgPurple][i]} seed={`xb${i}`} power={0.3} />
      ))}
      <HillRing color="#4F5A5A" radius={240} />
    </Shot>
  );
};

/** A cell tower over the town: its signal rings stop, the beacon dies. */
const c4Tower: ShotFn = (c) => {
  const cam = move({ position: [9, 3.2, 44], target: [0, 18, 0] }, { position: [8.2, 3.2, 40], target: [0, 18.5, 0] }, c);
  const fail = cueAt(c, "failure", 0.95);
  return (
    <Shot mood="overcast" camera={cam} fog={[60, 300]} shadowSize={40} light={0.9}>
      <Ground color="#5A6A52" />
      <HillRing color="#56665A" radius={220} />
      <Sky t={c.t} tint="overcast" seed="ct" />
      <CellTower position={[0, 0, 0]} t={c.t} signal={c.lt < fail ? 1 : 0} />
      {Array.from({ length: 9 }, (_, i) => (
        <Building key={i} position={[-52 + i * 13, 0, -48 - (i % 3) * 9]} w={10} d={10} h={14 + random(`ct${i}`) * 24} color={[P.bldgSlate, P.bldgNavy, P.bldgTeal, P.bldgPurple][i % 4]} seed={`ct${i}`} power={0.3} />
      ))}
    </Shot>
  );
};

/** A café counter: card held over the terminal… DECLINED, NO CONNECTION. */
const CAFE_READER: V3 = [0, 2.4, 0];
const c4Card: ShotFn = (c) => {
  const k = k01(c.lt, 0.95, 1.0);
  const cam = move({ position: [-0.2, 4.0, 3.1], target: [0.2, 2.95, -0.1] }, { position: [-0.15, 3.9, 2.7], target: [0.2, 2.95, -0.1] }, c);
  const fist: V3 = [1.0, 3.45 - k01(c.lt, 0.2, 0.7) * 0.3, 0.25];
  return (
    <Shot mood="overcast" camera={cam} fog={false} stars={false} light={0.8} shadowSize={6} keyDir={[-0.6, 0.6, 0.5]}>
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <BoxG args={[8, 2.4, 2.2]} />
        <Flat color="#5A3E2E" />
      </mesh>
      <mesh position={[0, 2.43, 0]} receiveShadow>
        <BoxG args={[8.2, 0.06, 2.4]} />
        <Flat color="#E8E4DA" />
      </mesh>
      <mesh position={[0, 4, -3]}>
        <BoxG args={[14, 8, 0.2]} />
        <Flat color="#C9B89A" />
      </mesh>
      <CanvasPanel position={[-1.4, 4.6, -2.88]} w={2.6} h={1.1} px={512} draw={drawSign(k > 0.5 ? "CASH ONLY" : "COFFEE  2.50", "#22242E", k > 0.5 ? "#FFBA58" : "#F6EBC4", 0.5)} />
      <mesh position={[2.2, 3.2, -2.4]} castShadow>
        <BoxG args={[1.4, 1.4, 0.9]} />
        <Flat color="#8A8E98" />
      </mesh>
      <CardReader position={CAFE_READER} k={k} t={c.t} />
      <mesh position={fist} scale={[1, 0.85, 1]}>
        <IcoG args={[0.22, 2]} />
        <Flat color="#C58B62" />
      </mesh>
      <mesh position={[fist[0] + 0.36, fist[1] - 0.05, fist[2]]} castShadow>
        <BoxG args={[0.5, 0.36, 0.42]} />
        <Flat color={P.jacket} />
      </mesh>
      <BankCard position={[fist[0] - 0.36, fist[1] - 0.1, fist[2] - 0.05]} rotation={[-1.2, 0, 0.15]} />
    </Shot>
  );
};

/** The airport: the departures board flips to SYSTEM OFFLINE; Slavoski with his suitcase. */
const c4Airport: ShotFn = (c) => {
  const cam = move({ position: [1.5, 3.4, 13.5], target: [0.8, 4.9, -4] }, { position: [1.4, 3.4, 12.2], target: [0.8, 5.0, -4] }, c);
  const k = k01(c.lt, 0.2, 1.5);
  return (
    <Shot mood="overcast" camera={cam} fog={false} stars={false} light={0.85}>
      <Terminal />
      <CanvasPanel position={[BOARD.c[0], BOARD.c[1], BOARD.c[2] + 0.03]} w={BOARD.w} h={BOARD.h} draw={drawBoard(k)} />
      <Hero pose={mergePose(REST, { headPitch: 0.35, expression: k > 0.4 ? "alarm" : "worried" })} position={[2.0, 0, 3.4]} yaw={Math.PI} />
      <Suitcase position={[3.4, 0, 3.6]} yaw={-0.2} />
      <Hero pose={mergePose(REST, { headPitch: 0.3, expression: "worried" })} position={[-2.5, 0, 0.6]} yaw={Math.PI + 0.15} look={crowdLook(41)} />
      <Hero pose={mergePose(REST, { headPitch: 0.3 })} position={[-4.6, 0, 2.6]} yaw={Math.PI + 0.3} look={suitLook(43)} />
    </Shot>
  );
};

/** Shops with handwritten notices: CLOSED, CASH ONLY, SYSTEMS DOWN. */
const ShopFront: React.FC<{ position: V3; name: string; notice: string; color: string; seed: string }> = ({ position, name, notice, color, seed }) => (
  <group position={position}>
    <mesh position={[0, 4.5, -0.5]} castShadow receiveShadow>
      <BoxG args={[8.4, 9, 1]} />
      <Flat color={color} />
    </mesh>
    <mesh position={[-1.2, 3.0, 0.02]}>
      <planeGeometry args={[4.8, 3.6]} />
      <Glow color="#2A3248" />
    </mesh>
    <mesh position={[2.6, 2.4, 0.02]}>
      <planeGeometry args={[1.8, 4.8]} />
      <Flat color="#3A2A22" />
    </mesh>
    <CanvasPanel position={[0, 6.4, 0.05]} w={7.4} h={1.2} px={768} draw={drawSign(name, "#15161C", "#F6EBC4", 0.6)} />
    <CanvasPanel position={[-1.2, 3.2, 0.06]} w={2.6} h={1.5} px={512} draw={drawSign(notice, "#F2EEE6", "#C8372D", 0.5)} />
    <mesh position={[0, 5.4, 0.9]} rotation={[0.45, 0, 0]} castShadow>
      <BoxG args={[8.2, 0.12, 2]} />
      <Flat color={random(`${seed}aw`) < 0.5 ? "#C8372D" : "#24748F"} />
    </mesh>
  </group>
);
const c4Shops: ShotFn = (c) => {
  const cam = move({ position: [-15, 4.8, 23], target: [3, 4.6, -1] }, { position: [-14, 4.7, 21.4], target: [3.4, 4.6, -1] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[50, 260]} shadowSize={30} light={0.9}>
      <Ground color="#6A6E78" />
      <Road position={[0, 0.01, 12]} width={12} length={200} yaw={Math.PI / 2} />
      <Sky t={c.t} tint="overcast" seed="shops" />
      <ShopFront position={[-9, 0, 0]} name="BAKERY" notice="CASH ONLY" color="#5A4A78" seed="s1" />
      <ShopFront position={[0, 0, 0]} name="ELECTRONICS" notice="CLOSED" color="#2E5A6A" seed="s2" />
      <ShopFront position={[9, 0, 0]} name="TRAVEL" notice="SYSTEMS DOWN" color="#566270" seed="s3" />
      <ShopFront position={[18, 0, 0]} name="PHARMACY" notice="CASH ONLY" color="#1D274B" seed="s4" />
      {[-9, 0, 9, 18].map((x, i) => (
        <Building key={x} position={[x, 9, -2]} w={8.4} d={6} h={14 + (i % 2) * 8} color={[P.bldgSlate, P.bldgNavy, P.bldgPurple, P.bldgTeal][i]} seed={`sb${i}`} power={0.3} />
      ))}
      <Hero pose={mergePose(REST, { headPitch: 0.1, expression: "worried" })} position={[-0.6, 0, 3.4]} yaw={Math.PI + 0.3} look={crowdLook(61)} />
      <Hero pose={mergePose(REST, { headPitch: 0.1 })} position={[8.0, 0, 3.8]} yaw={Math.PI - 0.2} look={crowdLook(62)} />
    </Shot>
  );
};

/** A factory line slowing to a stop under a red light. */
const c4Factory: ShotFn = (c) => {
  const cam = move({ position: [12, 8.5, 24], target: [-3, 6.6, -4] }, { position: [11, 8.3, 22.4], target: [-3.5, 6.7, -4] }, c);
  const t0 = c.t - c.lt;
  const ft = t0 + (c.lt < 1 ? c.lt - (c.lt * c.lt) / 2 : 0.5);
  const blink = Math.floor(c.t * 3) % 2 === 0;
  return (
    <Shot mood="overcast" camera={cam} fog={[40, 160]} stars={false} light={0.8} shadowSize={30}>
      <Factory t={ft} boardX={-5} />
      <CanvasPanel position={[-5, 11.6, -8.97]} w={9} h={3.8} px={768} draw={drawLineStopped(c.t)} />
      <mesh position={[-14, 11, -6]}>
        <IcoG args={[0.6, 1]} />
        <Glow color={blink ? "#FF3A2A" : "#5A1414"} />
      </mesh>
      {blink ? <pointLight position={[-14, 11, -5]} color="#FF3A2A" intensity={40} distance={30} decay={2} /> : null}
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 hours later (rain, then day 2)

/** In the rain: a long queue to the cash machine, Slavoski third in line. */
/** First person at the machine (facing it), the rest along the pavement past the lamp (kit lamp at x ≈ 3.15). */
const QUEUE = Array.from({ length: 10 }, (_, i) => ({ x: i === 0 ? 0 : 3.0 + i * 2.5, z: i === 0 ? 1.7 : 2.0 + (i % 2 ? 0.25 : -0.15), umb: i % 2 === 1, seed: 90 + i }));
const QueueSet: React.FC<{ c: ShotCtx }> = ({ c }) => {
  const up = umbPose();
  const hand = handPosition(up, "r");
  return (
    <group>
      <AtmWall />
      {QUEUE.map((q, i) => {
        const hero = i === 2;
        const pose = q.umb ? mergePose(up, { expression: hero ? "worried" : "neutral", headPitch: -0.1 }) : mergePose(REST, { expression: hero ? "worried" : "neutral", headPitch: -0.15, lShoulder: [0.1, 0.05], rShoulder: [0.1, 0.05] });
        return (
          <group key={i} position={[q.x, 0, q.z]} rotation={[0, (i === 0 ? Math.PI : -Math.PI / 2) + Math.sin(c.t * 0.7 + i) * 0.05, 0]}>
            <Hero pose={pose} look={hero ? undefined : crowdLook(q.seed)} />
            {q.umb ? <Umbrella hand={hand} color={["#24748F", "#C8372D", "#5A4A78", "#2F7A5A", "#E8D23A"][i % 5]} top={5.1} /> : null}
          </group>
        );
      })}
    </group>
  );
};
const c5Queue: ShotFn = (c) => {
  const cam = move({ position: [-7.5, 6.6, 16], target: [8, 3.0, 1.5] }, { position: [-7.0, 6.4, 14.8], target: [8.4, 3.0, 1.5] }, c);
  return (
    <Shot
      mood="overcast"
      camera={cam}
      fog={[30, 200]}
      shadowSize={30}
      light={0.7}
      overlay={
        <ScreenHtml c={ATM.c} w={ATM.w} h={ATM.h} cam={cam} width={c.width} height={c.height}>
          {(w, h) => <DeadScreen w={w} h={h} label={"CASH ONLY\nPLEASE WAIT"} />}
        </ScreenHtml>
      }
    >
      <QueueSet c={c} />
      <Rain center={[0, 6, 6]} size={[24, 14, 14]} t={c.t} count={600} thickness={0.025} opacity={0.4} />
    </Shot>
  );
};
const c5QueueHigh: ShotFn = (c) => {
  const cam = move({ position: [4, 22, 18], target: [12, 0, 1] }, { position: [4.6, 21, 16.5], target: [12.6, 0, 1] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[30, 200]} shadowSize={40} light={0.7}>
      <QueueSet c={c} />
      <Rain center={[10, 10, 8]} size={[30, 20, 20]} t={c.t} count={700} thickness={0.03} opacity={0.4} />
    </Shot>
  );
};

/** Day 2: the government's command room, every network on the wall map offline. */
const OFFICERS: V3[] = [
  [-4.5, 0, 6.6],
  [-0.6, 0, 7.2],
  [3.6, 0, 6.4],
];
/** The command room with this episode's wall screen in front of ep. 7's map. */
const GovRoom: React.FC<{ t: number }> = ({ t }) => (
  <>
    <CommandRoom t={t} offline={1} />
    <CanvasPanel position={[WALL.c[0], WALL.c[1], WALL.c[2] + 0.16]} w={WALL.w} h={WALL.h} px={1024} draw={drawNetStatus(t, 0.04)} />
  </>
);
const c5Room: ShotFn = (c) => {
  const cam = move({ position: [0.5, 4.3, 17], target: [0, 5.3, -9] }, { position: [0.4, 4.25, 15.6], target: [0, 5.4, -9] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.32} shadowSize={20}>
      <GovRoom t={c.t} />
      {OFFICERS.map((p, i) => (
        <Hero key={i} pose={mergePose(REST, { headPitch: 0.25, expression: "worried", headYaw: (i - 1) * 0.15 })} position={p} yaw={Math.PI} look={suitLook(40 + i)} />
      ))}
    </Shot>
  );
};

/** Scrambling: an official on an old desk phone, another with a paper map (both between console rows). */
const MAPPER: V3 = [3.6, 0, 0.8];
const c5Phone: ShotFn = (c) => {
  const cam = move({ position: [4.8, 4.8, 12.5], target: [1.2, 3.6, 0] }, { position: [4.4, 4.7, 11.4], target: [1.2, 3.6, 0] }, c);
  const caller: V3 = [0, 0, 0];
  const pose = callPose();
  const h = handPosition(pose, "r", caller, 0.5);
  const head = headPosition(pose, caller, 0.5);
  const handset: V3 = [(h[0] + head[0]) / 2 + 0.02, (h[1] + head[1]) / 2, (h[2] + head[2]) / 2];
  const mp = mapPose();
  const ml = handPosition(mp, "l", MAPPER, -0.4);
  const mr = handPosition(mp, "r", MAPPER, -0.4);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.4} shadowSize={14}>
      <GovRoom t={c.t} />
      <Hero pose={pose} position={caller} yaw={0.5} look={suitLook(44)} />
      <mesh position={handset} rotation={[0, 0.5, 0.15]} castShadow>
        <BoxG args={[0.18, 0.8, 0.16]} />
        <Flat color="#C8372D" />
      </mesh>
      <DeskPhone position={[-1.2, 2.2, -1.6]} yaw={0.4} handset={[0, 0, 0]} />
      <Hero pose={mp} position={MAPPER} yaw={-0.4} look={suitLook(47)} />
      <PaperMap l={ml} r={mr} h={1.4} />
    </Shot>
  );
};

/** Engineers in the rain, up a cell tower in a bucket truck, sparks at the top. */
const c5Tower: ShotFn = (c) => {
  const cam = move({ position: [16, 3.0, 30], target: [2, 15, 0] }, { position: [14.8, 3.0, 27.5], target: [2, 15.5, 0] }, c);
  const bucket: V3 = [-6, 18, -6];
  return (
    <Shot mood="storm" camera={cam} fog={[30, 200]} shadowSize={40} light={1.05}>
      <Ground color="#3E4A42" />
      <HillRing color="#2E3A34" radius={200} />
      <Sky t={c.t} tint="storm" seed="rt" y={50} />
      <CellTower position={[0, 0, 0]} t={c.t} signal={0} h={30} />
      <BucketTruck position={[9, 0, 6]} bucket={bucket} />
      <Hero pose={mergePose(REST, { headPitch: 0.3, lShoulder: [1.8, 0.3], lElbow: 0.3 })} position={[9 + bucket[0], bucket[1] - 1.3, 6 + bucket[2]]} yaw={-Math.PI / 2} look={HIVIS(crowdLook(70))} />
      <Hero pose={mergePose(REST, { headPitch: 0.5 })} position={[13, 0, 13]} yaw={-2.6} look={HIVIS(crowdLook(71))} />
      {Array.from({ length: 10 }, (_, i) => {
        const life = ((c.t * 2.6 + random(`ts${i}`)) % 1 + 1) % 1;
        const a = random(`tsa${i}`) * Math.PI * 2;
        return (
          <mesh key={i} position={[1.1 + Math.cos(a) * life * 1.6, 19.6 + life * 1.2 - life * life * 4, -0.6 + Math.sin(a) * life * 1.6]}>
            <IcoG args={[0.08 * (1 - life), 0]} />
            <Glow color="#FFE07A" />
          </mesh>
        );
      })}
      <Halo position={[1.1, 19.6, -0.6]} size={4} color="#FFE9B0" opacity={0.5 + 0.3 * Math.sin(c.t * 40)} />
      <Rain center={[10, 8, 18]} size={[30, 20, 20]} t={c.t} count={700} thickness={0.03} opacity={0.45} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 06 breakfast (sunny morning, day 2)

/** A calm, sunny house with a garden. Birds. */
const c6House: ShotFn = (c) => {
  const cam = move({ position: [17, 5, 46], target: [0, 7, 0] }, { position: [15.5, 5, 42], target: [0, 7.2, 0] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={40}>
      <Ground color="#5A9A4A" />
      <HillRing color="#4F8A4A" radius={200} />
      <Sky t={c.t} tint="day" seed="house" y={50} />
      <House position={[0, 0, 0]} scale={1.5} color="#F2E6CC" roof="#2E5A6A" lit={false} />
      {[-14, 13, 18].map((x, i) => (
        <LeafyTree key={x} position={[x, 0, 4 - i * 4]} scale={2.2} seed={`ht${i}`} />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[-10 + i * 1.8, 0.6, 9]} castShadow>
          <BoxG args={[0.25, 1.2, 0.25]} />
          <Flat color="#F2EEE6" />
        </mesh>
      ))}
      <mesh position={[0, 1.0, 9]}>
        <BoxG args={[21, 0.15, 0.12]} />
        <Flat color="#F2EEE6" />
      </mesh>
      <mesh position={[-60, 70, -200]}>
        <circleGeometry args={[7, 16]} />
        <Glow color="#FFF8E0" />
      </mesh>
      <Halo position={[-60, 70, -199]} size={70} color="#FFF0C8" opacity={0.5} />
    </Shot>
  );
};

/** The kitchen: him at the table from behind-right, eating breakfast; the TV news on the wall. */
const KitchenShot: React.FC<{ c: ShotCtx; cam: CameraSpec; pose: Pose; mugAt?: V3 | null; trophyGlow?: number; children?: React.ReactNode }> = ({ c, cam, pose, mugAt = null, trophyGlow = 1, children }) => (
  <Shot mood="day" camera={cam} fog={false} stars={false} light={0.8} keyDir={[-0.9, 0.5, 0.25]} shadowSize={10}>
    <Kitchen t={c.t} trophyGlow={trophyGlow} />
    <Breakfast mugAt={mugAt} />
    <Hero pose={pose} position={KITCHEN.chair} yaw={YAW_BACK} look={CEO_LOOK} />
    {children}
  </Shot>
);
const c6Kitchen: ShotFn = (c) => {
  const cam = move({ position: [1.9, 6.0, 10.5], target: [0.2, 3.3, -2.5] }, { position: [1.7, 5.8, 9.4], target: [0.2, 3.3, -2.5] }, c);
  return <KitchenShot c={c} cam={cam} pose={eatPose(c.t)} />;
};
const c6TV: ShotFn = (c) => {
  const cam = move({ position: [1.5, 4.3, 5.2], target: [0.05, 4.25, -4.85] }, { position: [1.35, 4.3, 4.4], target: [0.05, 4.3, -4.85] }, c);
  return <KitchenShot c={c} cam={{ ...cam, fov: 36 }} pose={eatPose(c.t)} />;
};
const c6Antenna: ShotFn = (c) => {
  const ant: V3 = [KITCHEN.tv.c[0] + 0.9, KITCHEN.tv.c[1] + KITCHEN.tv.h / 2 + 0.7, KITCHEN.tv.c[2]];
  const cam = move({ position: [ant[0] - 0.5, ant[1] - 0.2, ant[2] + 3.6], target: [ant[0], ant[1] - 0.25, ant[2]] }, { position: [ant[0] - 0.4, ant[1] - 0.2, ant[2] + 3.0], target: [ant[0], ant[1] - 0.25, ant[2]] }, c);
  const tip: V3 = [ant[0] + 0.68, ant[1] + 0.55, ant[2]];
  return (
    <KitchenShot c={c} cam={cam} pose={eatPose(c.t)}>
      <Halo position={tip} size={0.6 + 0.3 * Math.abs(Math.sin(c.t * 5))} color="#FFFFFF" opacity={0.8} />
    </KitchenShot>
  );
};
const c6Trophy: ShotFn = (c) => {
  const chip: V3 = [TROPHY[0], TROPHY[1] + 0.8, TROPHY[2]];
  const cam = move({ position: [chip[0] - 3.4, chip[1] + 0.6, chip[2] + 2.6], target: chip }, { position: [chip[0] - 2.5, chip[1] + 0.4, chip[2] + 1.9], target: chip }, { ...c, dur: 3.1 });
  const dim = k01(c.lt, Math.max(0.5, c.dur - 0.6), Math.max(0.9, c.dur));
  return <KitchenShot c={c} cam={cam} pose={eatPose(c.t)} trophyGlow={1 - dim} />;
};
const c6Back: ShotFn = (c) => {
  const cam = move({ position: [0.6, 4.0, 6.6], target: [0, 3.0, -2] }, { position: [0.45, 3.7, 5.0], target: [0, 3.0, -2] }, c);
  return <KitchenShot c={c} cam={cam} pose={mergePose(mugLow(), { headPitch: 0.05 })} />;
};
const c6Jacket: ShotFn = (c) => {
  const cam = move({ position: [4.0, 4.8, 8.8], target: [0.2, 2.6, 1.0], fov: 34 }, { position: [3.6, 4.6, 7.9], target: [0.2, 2.6, 1.0], fov: 34 }, c);
  const k = k01(c.lt, 0.9, 1.7);
  const pose = lerpPose(mugLow(), mugHigh(), k);
  const h = handPosition(pose, "r", KITCHEN.chair, YAW_BACK);
  const mugAt: V3 = [h[0] - MUG_GRIP[0], h[1] - MUG_GRIP[1], h[2] - MUG_GRIP[2]];
  const glint = 0.5 + 0.5 * Math.sin(c.t * 3);
  return (
    <KitchenShot c={c} cam={cam} pose={pose} mugAt={mugAt}>
      <Halo position={[0.62, 2.05, 2.4]} size={0.5 + glint * 0.5} color="#FFFFFF" opacity={0.6} />
      <Halo position={[-0.3, 1.6, 2.4]} size={0.35 + (1 - glint) * 0.35} color="#FFFFFF" opacity={0.45} />
    </KitchenShot>
  );
};

/** "Sent humanity back to the offline age": Slavoski in the sunny park with a paper map. */
const c6Map: ShotFn = (c) => {
  const cam = move({ position: [2.4, 4.4, 16], target: [0, 3.4, 0] }, { position: [2.1, 4.3, 14.4], target: [0, 3.4, 0] }, c);
  const mp = mapPose();
  const hero: V3 = [0, 0, 2];
  const l = handPosition(mp, "l", hero, 0.15);
  const r = handPosition(mp, "r", hero, 0.15);
  return (
    <Shot mood="day" camera={cam} fog={[50, 260]} shadowSize={30}>
      <Ground color="#5A9A4A" />
      <HillRing color="#4F8A4A" radius={200} />
      <Sky t={c.t} tint="day" seed="park" y={50} />
      <Hero pose={mergePose(mp, { headYaw: Math.sin(c.lt * 2) * 0.2, headPitch: -0.25 })} position={hero} yaw={0.15} />
      <PaperMap l={l} r={r} h={1.5} />
      {/* behind him: people reading newspapers, a kid's kite */}
      {[
        [-7, 0, -6, 0.5, 81],
        [7.5, 0, -8, -0.5, 82],
      ].map(([x, y, z, yaw, seed]) => {
        const lp = handPosition(mp, "l", [x, y, z], yaw);
        const rp = handPosition(mp, "r", [x, y, z], yaw);
        return (
          <React.Fragment key={seed}>
            <Hero pose={mergePose(mp, { expression: "neutral" })} position={[x, y, z]} yaw={yaw} look={crowdLook(seed)} />
            <PaperMap l={lp} r={rp} h={1.1} />
          </React.Fragment>
        );
      })}
      {[-16, -10, 12, 18].map((x, i) => (
        <LeafyTree key={x} position={[x, 0, -14 - i * 3]} scale={2.4} seed={`pk${i}`} />
      ))}
      <mesh position={[5, 14 + Math.sin(c.t * 1.5) * 0.6, -20]} rotation={[0, 0, 0.785 + Math.sin(c.t) * 0.1]}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial color="#C8372D" side={2} toneMapped={false} />
      </mesh>
    </Shot>
  );
};

/** …and a queue at the old phone box; Slavoski inside, receiver at his ear. */
const c6PhoneBox: ShotFn = (c) => {
  const box: V3 = [16.5, 0, 2];
  const cam = move({ position: [4, 4.4, 17], target: [16, 4, 0] }, { position: [4.8, 4.3, 15.5], target: [16, 4, 0] }, c);
  const pose = callPose();
  const yaw = -Math.PI / 2 + 0.25;
  const h = handPosition(pose, "r", box, yaw);
  const head = headPosition(pose, box, yaw);
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={30}>
      <BigStreet seed="noon" day lamps={false} />
      <Sky t={c.t} tint="day" seed="phonebox" />
      <PhoneBox position={box} yaw={-Math.PI / 2} />
      <Hero pose={mergePose(pose, { expression: "smile" })} position={box} yaw={yaw} />
      <mesh position={[(h[0] + head[0]) / 2, (h[1] + head[1]) / 2, (h[2] + head[2]) / 2]} rotation={[0, yaw, 0.15]}>
        <BoxG args={[0.18, 0.8, 0.16]} />
        <Flat color="#15161C" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <Hero key={i} pose={walkPose(0.1 * i, 0.05)} position={[15.4, 0, 6.2 + i * 2.4]} yaw={Math.PI} look={crowdLook(100 + i)} />
      ))}
    </Shot>
  );
};

// ---------------------------------------------------------------- thumbnail

/** Shorts cover: high behind his shoulder, the fist over the giant TURN OFF AI button. */
export const thumbShot: ShotFn = () => {
  // Top-down like the press close-up, shifted so the button sits under the hook text.
  const cam: CameraSpec = { position: [0.15, 9.6, -1.75], target: [0, 2.45, -1.0], fov: 34, up: [0, 0, -1] };
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.45} shadowSize={8}>
      <CeoOffice t={0.4} />
      <ButtonConsole position={OFFICE.console} press={0} cover={1} />
      <Hero pose={pressPose(0.7)} position={PRESS_HERO} yaw={YAW_BACK} look={CEO_LOOK} />
      <pointLight position={[0, 3.4, 0.6]} color="#FF3A2A" intensity={12} distance={6} decay={2} />
    </Shot>
  );
};

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldPhone },
    { cue: "tomorrow", fn: coldWake },
    { cue: "internet is gone", fn: coldStreet },
    { cue: "No YouTube", fn: coldApps },
  ],
  c1: [
    { cue: null, fn: c1Tower },
    { cue: "Jensen", fn: c1Silhouette },
    { cue: "In this fictional", fn: c1Fiction },
    { cue: "the Nvidia CEO", fn: c1Desk },
    { cue: "He presses", fn: c1Reveal },
    { cue: "Turn Off", fn: c1Press },
    { cue: "At first", fn: c1Nothing },
  ],
  c2: [
    { cue: null, fn: c2Hall },
    { cue: "shutting", fn: c2Campus },
    { cue: "Chatbots", fn: c2Chat },
    { cue: "AI-generated", fn: c2Video },
    { cue: "Companies", fn: c2Office },
    { cue: "most powerful", fn: c2Cluster },
  ],
  c3: [
    { cue: null, fn: c3Again },
    { cue: "The internet", fn: c3Earth },
    { cue: "entirely", fn: c3Chips },
    { cue: "so Jensen's", fn: c3Press },
    { cue: "switch off", fn: c3Online },
    { cue: "unless", fn: c3Unless },
  ],
  c4: [
    { cue: null, fn: c4Cables },
    { cue: "suddenly suffers", fn: c4Exchange },
    { cue: "catastrophic", fn: c4Tower },
    { cue: "Now banks", fn: c4Card },
    { cue: "Airports", fn: c4Airport },
    { cue: "Millions of businesses", fn: c4Shops },
    { cue: "grind to", fn: c4Factory },
  ],
  c5: [
    { cue: null, fn: c5Queue },
    { cue: "cash machines", fn: c5QueueHigh },
    { cue: "By day two", fn: c5Room },
    { cue: "scrambling", fn: c5Phone },
    { cue: "communications", fn: c5Tower },
  ],
  c6: [
    { cue: null, fn: c6House },
    { cue: "he's sitting", fn: c6Kitchen },
    { cue: "watching the chaos", fn: c6TV },
    { cue: "that somehow", fn: c6Antenna },
    { cue: "because the man", fn: c6Trophy },
    { cue: "just accidentally", fn: c6Map },
    { cue: "back to the", fn: c6PhoneBox },
    { cue: "And the craziest", fn: c6Back },
    { cue: "He still", fn: c6Jacket },
  ],
};
