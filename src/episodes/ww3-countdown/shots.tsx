/**
 * Shots for "What If WW3 Started in 7 Days?" (ep. 5). Generic world, non-graphic.
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Car, CityGrid, Lamp, PineTree, Road, StreetSet } from "../../slavoski/city";
import { P } from "../../slavoski/palette";
import { BoxG, IcoG } from "../../slavoski/detail";
import { CanvasPanel } from "../../slavoski/screens";
import { POLICE_OFFICER } from "../../slavoski/hero";
import { FONT } from "../../slavoski/fonts";
import { crowdLook, suitLook } from "../../slavoski/hero";
import { Flat } from "../../slavoski/materials";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { GamingRoom, SEAT, SEAT_YAW, sittingPose, TV } from "../../slavoski/room";
import { handPosition, headPosition, Hero, mergePose, reach, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { FacetedEarth } from "../../slavoski/space";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import { wordAt, type CuedShot } from "../../slavoski/timeline";
import { BED, Bedroom, Chair, WIN } from "../smart-animals/props";
import {
  AlarmClock,
  AlertScreen,
  ATM,
  AtmWall,
  CITY,
  drawCrashChart,
  drawDepartures,
  drawLabel,
  ShelterBunker,
  BILLBOARD,
  Billboard,
  BoardedShop,
  BOARD,
  Checkpoint,
  CLOCK,
  DeadScreen,
  FuelQueue,
  fuelStreetModify,
  GANTRY,
  Jet,
  NewsGraphic,
  OnScreen,
  PHONE,
  Phone3D,
  Siren,
  SummitHall,
  Supermarket,
  Terminal,
  Trolley,
} from "./props";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));

/**
 * A StreetSet scaled ×3.5 so its floors, cars and lamps are in proportion with Slavoski (4.2 tall):
 * at kit scale he stands four floors high and reads as a giant. Road |x| < 12.25, pavements to 21.35.
 */
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

/** Slavoski sitting up in bed, legs under the blanket (same rig placement as ep. 4). */
const BED_HERO: V3 = [BED.x, BED.mattressTop - (1.55 + 0.02 - 0.18), -2.55];
const bedPose = (over: Partial<Pose> = {}): Pose =>
  mergePose(REST, { lHip: [1.47, 0.06], rHip: [1.47, 0.06], lKnee: 0.04, rKnee: 0.04, lShoulder: [0.25, 0.25], rShoulder: [0.25, 0.25], lElbow: 0.5, rElbow: 0.5, ...over });

/** In bed, looking down at a phone held up in the right hand in front of his chest (the screen faces him). */
const PHONE_HAND_TARGET: V3 = [BED.x - 0.3, 2.1, -1.45];
const phoneArm = reach(bedPose({ headPitch: -0.3 }), "r", PHONE_HAND_TARGET).pose;
const phonePose = (over: Partial<Pose> = {}) => ({ ...phoneArm, ...over });
const PhoneInHand: React.FC<{ pose: Pose; glow: string }> = ({ pose, glow }) => {
  const h = handPosition(pose, "r", BED_HERO);
  // Phone stands on top of the fist (fist radius 0.22), screen turned toward his face.
  const p: V3 = [h[0] + 0.05, h[1] + 0.22 + PHONE.h / 2 - 0.12, h[2]];
  return (
    <>
      <Phone3D position={p} rotation={[-0.7, Math.PI, 0]} glow={glow} />
      <pointLight position={[p[0], p[1] + 0.2, p[2] - 0.4]} color={glow} intensity={6} distance={4} decay={2} />
    </>
  );
};

/** Big phone close-up in the bedroom (bed, pillow and poster behind it), an HTML screen pinned to it. */
const PHONE_CU: V3 = [BED.x - 0.2, 3.0, 0.9];
const PhoneCloseUp: React.FC<{ c: ShotCtx; glow: string; screen: (w: number, h: number) => React.ReactNode; shake?: number; lamp?: boolean }> = ({ c, glow, screen, shake = 0, lamp = true }) => {
  const P0 = PHONE_CU;
  const cam = move({ position: [P0[0] + 0.05, P0[1], P0[2] + 2.1], target: [P0[0], P0[1] - 0.02, P0[2]] }, { position: [P0[0] + 0.03, P0[1], P0[2] + 1.75], target: [P0[0], P0[1], P0[2]] }, c);
  const jitter = shake ? Math.sin(c.t * 80) * 0.012 * shake : 0;
  const pos: V3 = [P0[0] + jitter, P0[1], P0[2]];
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      stars={false}
      light={lamp ? 0.45 : 0.3}
      shadowSize={8}
      overlay={
        <OnScreen c={[pos[0], pos[1], pos[2] + PHONE.d / 2 + 0.003]} w={PHONE.screenW} h={PHONE.screenH} cam={cam} width={c.width} height={c.height}>
          {screen}
        </OnScreen>
      }
    >
      <Bedroom lampOn={lamp} />
      <Phone3D position={pos} glow={glow} />
      {/* the fist holding it from below */}
      <mesh position={[pos[0] + 0.04, pos[1] - PHONE.h / 2 - 0.06, pos[2] + 0.02]} scale={[1.1, 0.8, 0.9]}>
        <IcoG args={[0.22, 2]} />
        <Flat color="#D9A27A" />
      </mesh>
      <pointLight position={[pos[0], pos[1], pos[2] + 1]} color={glow} intensity={4} distance={4} decay={2} />
    </Shot>
  );
};

// ---------------------------------------------------------------- cold open

const coldEarth: ShotFn = (c) => {
  const cam = move({ position: [0, 0.3, 18], target: [0, -0.9, 0] }, { position: [0, 0.2, 16.2], target: [0, -1.0, 0] }, c);
  // Generic red alert pings scattered over the night side (no real places).
  const pings = Array.from({ length: 9 }, (_, i) => {
    const a = random(`pa${i}`) * Math.PI * 2;
    const b = (random(`pb${i}`) - 0.5) * 1.6;
    const r = 3.03;
    const p: V3 = [r * Math.cos(b) * Math.sin(a), r * Math.sin(b), r * Math.cos(b) * Math.cos(a)];
    const k = ((c.t * 0.9 + random(`pt${i}`)) % 1 + 1) % 1;
    return { p, k, on: p[2] > 0.6 };
  });
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.5}>
      <group position={[0, -2.6, 0]}>
        <FacetedEarth radius={3} rotation={[0.35, 2.2 + c.t * 0.05, 0]} cityLights={0.9} />
        {pings.map(({ p, k, on }, i) =>
          on ? (
            <mesh key={i} position={p}>
              <IcoG args={[0.05 + k * 0.18, 1]} />
              <meshBasicMaterial color="#FF3030" transparent opacity={(1 - k) * 0.9} toneMapped={false} fog={false} />
            </mesh>
          ) : null,
        )}
      </group>
    </Shot>
  );
};

const coldLife: ShotFn = (c) => {
  const cam = move({ position: [BED.x + 2.2, 4.8, 6.4], target: [BED.x - 0.4, 2.6, -2.0] }, { position: [BED.x + 1.9, 4.6, 5.6], target: [BED.x - 0.4, 2.6, -2.0] }, c);
  const pose = phonePose({ expression: "neutral" });
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.55} shadowSize={10}>
      <Bedroom lampOn />
      <Hero pose={pose} position={BED_HERO} />
      <PhoneInHand pose={pose} glow="#8FD0FF" />
    </Shot>
  );
};

const coldCity: ShotFn = (c) => {
  const cam = move({ position: [14, 30, 34], target: [0, 2, -4] }, { position: [12, 28, 30], target: [0, 2, -4] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[60, 170]} shadowSize={50}>
      <CityGrid seed="ww3" blocks={5} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 the alert

const c1Phone: ShotFn = (c) => {
  const cam = move({ position: [BED.x + 0.4, 3.4, 4.0], target: [BED.x - 0.2, 3.0, -2.2] }, { position: [BED.x + 0.3, 3.35, 3.2], target: [BED.x - 0.2, 3.05, -2.2] }, c);
  const shock = k01(c.lt, 0.25, 0.45);
  const pose = phonePose({ expression: shock > 0.5 ? "alarm" : "neutral", headPitch: -0.3 + shock * 0.1 });
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.5} shadowSize={10} shake={shock > 0 && shock < 1 ? 0.03 : 0}>
      <Bedroom lampOn />
      <Hero pose={pose} position={BED_HERO} />
      <PhoneInHand pose={pose} glow={c.lt > 0.25 ? "#FF3030" : "#8FD0FF"} />
    </Shot>
  );
};

const c1Alert: ShotFn = (c) => (
  <PhoneCloseUp c={c} glow="#B3261E" shake={1} screen={(w, h) => <AlertScreen w={w} h={h} title="EMERGENCY ALERT" body={"GLOBAL CONFLICT\nIMMINENT"} t={c.t} />} />
);

const c1Market: ShotFn = (c) => {
  const cam = move({ position: [1.8, 4.8, 9.5], target: [1.8, 1.4, -8] }, { position: [1.8, 4.6, 8.4], target: [1.8, 1.4, -8] }, c);
  const walker = (seed: number, z0: number, speed: number, x: number) => {
    const z = z0 + c.lt * speed;
    return <Hero key={seed} pose={walkPose(c.lt * 1.6 + seed * 0.3, 0.9)} position={[x, 0, z]} look={crowdLook(seed)} />;
  };
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.85} shadowSize={14}>
      <Supermarket stock={0.08} />
      <Trolley position={[2.5, 0, -3.5]} yaw={0.3} />
      {/* shoppers stay behind Slavoski (z ≤ -6) for the whole shot, in separate lanes */}
      {walker(3, -12, 2.0, 1.2)}
      {walker(7, -9.5, 2.0, 2.5)}
      <Hero pose={mergePose(REST, { expression: "worried", headYaw: 0.9, headPitch: 0.1 })} position={[1.9, 0, -1.0]} yaw={0.3} />
    </Shot>
  );
};

const c1Fuel: ShotFn = (c) => {
  // High above the road (inside the corridor, |x| < 3), looking down the queue between the buildings.
  const cam = move({ position: [-1.5, 12, 18], target: [1.7, 0, -22] }, { position: [-1.3, 11.4, 16], target: [1.7, 0, -24] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[40, 140]} shadowSize={40}>
      <StreetSet seed="fuel" length={120} cars={false} modify={fuelStreetModify} />
      <FuelQueue t={c.t} cars={30} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 the crash

const c2Market: ShotFn = (c) => {
  const cam = move({ position: [0.6, 2.4, 14.5], target: [0, 6.4, -2] }, { position: [0.5, 2.4, 13.3], target: [0, 6.5, -2] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[60, 300]} shadowSize={40}>
      <BigStreet seed="plaza" cars={false} />
      <Billboard />
      <CanvasPanel position={[BILLBOARD.c[0], BILLBOARD.c[1], BILLBOARD.c[2]]} w={BILLBOARD.w} h={BILLBOARD.h} draw={drawCrashChart(k01(c.lt, 0.1, 1.8))} />
      <Hero pose={mergePose(REST, { headPitch: 0.45, expression: "alarm" })} position={[0.6, 0, 3.4]} yaw={Math.PI} />
      <Hero pose={mergePose(REST, { headPitch: 0.4, expression: "worried" })} position={[-1.6, 0, 4.2]} yaw={Math.PI - 0.2} look={crowdLook(11)} />
      <Hero pose={mergePose(REST, { headPitch: 0.4, expression: "worried" })} position={[2.6, 0, 5.0]} yaw={Math.PI + 0.25} look={crowdLook(4)} />
    </Shot>
  );
};

const c2Flights: ShotFn = (c) => {
  const cam = move({ position: [0.4, 3.0, 11.5], target: [0, 5.2, -4] }, { position: [0.3, 3.0, 10.4], target: [0, 5.3, -4] }, c);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      stars={false}
      light={0.85}
    >
      <Terminal />
      <CanvasPanel position={[BOARD.c[0], BOARD.c[1], BOARD.c[2] + 0.03]} w={BOARD.w} h={BOARD.h} draw={drawDepartures(k01(c.lt, 0, 1.0))} />
      <Hero pose={mergePose(REST, { headPitch: 0.35, expression: "alarm" })} position={[2.0, 0, 3.4]} yaw={Math.PI} />
      <Hero pose={mergePose(REST, { headPitch: 0.3, expression: "worried" })} position={[-2.5, 0, 0.6]} yaw={Math.PI + 0.15} look={crowdLook(41)} />
      <mesh position={[3.15, 0.5, 3.4]} castShadow>
        <BoxG args={[0.5, 1.0, 0.9]} />
        <Flat color="#5A4A78" />
      </mesh>
    </Shot>
  );
};

const c2Border: ShotFn = (c) => {
  const cam = move({ position: [-0.4, 3.0, 19], target: [0.4, 2.9, 0] }, { position: [-0.3, 2.9, 17.5], target: [0.4, 2.9, 0] }, c);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={[45, 200]}
      shadowSize={30}
    >
      <Checkpoint down={k01(c.lt, 0.05, 0.6)} t={c.t} />
      <CanvasPanel position={[GANTRY.c[0], GANTRY.c[1], GANTRY.c[2] + 0.01]} w={GANTRY.w} h={GANTRY.h} draw={drawLabel("BORDER CLOSED", "#0E0606", "#FF3A2A", 0.6)} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 offline

const TVVIEW: CameraSpec = { position: [1.0, 7.5, 9.0], target: [0.8, 1.4, -1.5] };

const RoomTV: React.FC<{ c: ShotCtx; pose: Pose; screen: (w: number, h: number) => React.ReactNode; hours?: number }> = ({ c, pose, screen, hours = 10 }) => {
  const cam = lerpCam(TVVIEW, { position: [1.0, 7.2, 8.3], target: [0.8, 1.4, -1.5] }, c.lt / span(c.dur));
  return (
    <AbsoluteFill>
      <Stage mood="night" camera={cam} fog={false} stars={false} light={0.4} shadowSize={14}>
        <GamingRoom hours={hours} cans={0} />
        <Hero pose={pose} position={SEAT} yaw={SEAT_YAW} />
      </Stage>
      <OnScreen c={[TV.center[0], TV.center[1], TV.center[2] + 0.002]} w={TV.w} h={TV.h} cam={cam} width={c.width} height={c.height}>
        {screen}
      </OnScreen>
    </AbsoluteFill>
  );
};

const couchPose = (over: Partial<Pose> = {}) => sittingPose({ lShoulder: [0.35, 0.15], rShoulder: [0.35, 0.15], lElbow: 0.6, rElbow: 0.6, ...over });

const c3Offline: ShotFn = (c) => (
  <RoomTV
    c={c}
    pose={couchPose({ expression: c.lt > 0.6 ? "worried" : "neutral" })}
    screen={(w, h) => (c.lt < 0.45 ? <NewsGraphic w={w} h={h} t={c.t} /> : <DeadScreen w={w} h={h} label={"NO INTERNET\nCONNECTION"} />)}
  />
);

const c3Atm: ShotFn = (c) => {
  const cam = move({ position: [-2.6, 4.2, 12.0], target: [0.5, 3.4, 0.5] }, { position: [-2.4, 4.15, 11.0], target: [0.5, 3.4, 0.5] }, c);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={[40, 220]}
      shadowSize={30}
      overlay={
        <OnScreen c={ATM.c} w={ATM.w} h={ATM.h} cam={cam} width={c.width} height={c.height}>
          {(w, h) => <DeadScreen w={w} h={h} label={"OUT OF\nSERVICE"} />}
        </OnScreen>
      }
    >
      <AtmWall />
      <Hero pose={mergePose(REST, { expression: "worried", headPitch: -0.05, rShoulder: [0.6, 0.1], rElbow: 0.5 })} position={[2.2, 0, 1.9]} yaw={-2.3} />
    </Shot>
  );
};

/** Right hand at the right ear, phone between fist and head. Hero faces +Z, so his right is −X. */
const CALL_POS: V3 = [0, 0, 0];
const callPose = (() => {
  const base = mergePose(REST, { expression: "worried", headPitch: -0.05, headYaw: -0.1 });
  const head = headPosition(base, CALL_POS);
  const target: V3 = [head[0] - (0.68 + 0.05 + 0.22), head[1] - 0.08, head[2] + 0.05];
  return reach(base, "r", target).pose;
})();

const c3Call: ShotFn = (c) => {
  const cam = move({ position: [-1.9, 3.3, 6.2], target: [-0.35, 3.15, 0] }, { position: [-1.7, 3.3, 5.4], target: [-0.35, 3.2, 0] }, c);
  const head = headPosition(callPose, CALL_POS);
  const fist = handPosition(callPose, "r", CALL_POS);
  const phone: V3 = [head[0] - 0.68 - 0.03, fist[1] + 0.18, head[2]];
  return (
    <Shot mood="night" camera={cam} fog={[60, 300]} shadowSize={30}>
      <BigStreet seed="call" />
      <Hero pose={callPose} position={CALL_POS} />
      <Phone3D position={phone} rotation={[0, -Math.PI / 2, 0]} glow="#8FD0FF" />
    </Shot>
  );
};

const c3Nothing: ShotFn = (c) => <PhoneCloseUp c={c} glow="#141826" screen={(w, h) => <DeadScreen w={w} h={h} label="CALL FAILED" sub="NO SIGNAL" />} />;

// ---------------------------------------------------------------- 04 seek shelter

const c4Jets: ShotFn = (c) => {
  const cam = move({ position: [1.2, 1.7, 10], target: [0, 13, -20] }, { position: [1.0, 1.6, 9.0], target: [0, 14, -20] }, c);
  const jets = [
    { y: 66, z: -95, d: 0 },
    { y: 60, z: -105, d: 0.25 },
    { y: 72, z: -115, d: 0.45 },
  ];
  return (
    <Shot mood="night" camera={cam} fog={[80, 400]} shadowSize={40} shake={c.lt > 0.6 && c.lt < 2.2 ? 0.05 : 0.01}>
      <BigStreet seed="jets" />
      <Hero pose={mergePose(REST, { headPitch: 0.6, expression: "alarm", lShoulder: [0.3, 0.6], rShoulder: [0.3, 0.6] })} position={[0.2, 0, 1.0]} />
      {jets.map((j, i) => (
        <Jet key={i} position={[-160 + (c.lt - j.d) * 120, j.y, j.z]} rotation={[0, Math.PI / 2, 0]} scale={5} trail={20} />
      ))}
    </Shot>
  );
};

/**
 * Siren and warning board stand on the right pavement (x = 4.6, StreetSet units) in the gap between its
 * board stands in front of the siren; StreetSet lamps and trees are off here and re-placed out of the line of sight.
 */
const SIREN_POS: V3 = [4.6, 0.12, -12.0];
const SHELTER_BOARD = { c: [4.4, 3.6, -9.3] as V3, w: 3.0, h: 1.1, yaw: -0.2 };

const c4Siren: ShotFn = (c) => {
  const S = CITY;
  const cam = move({ position: [1.4 * S, 0.5 * S, 2.0 * S], target: [4.1 * S, 4.6 * S, -13.5 * S] }, { position: [1.25 * S, 0.55 * S, 1.6 * S], target: [4.1 * S, 4.8 * S, -13.5 * S] }, c);
  const flash = Math.sin(c.t * 9) > 0;
  return (
    <Shot mood="night" dust={0.2} camera={cam} fog={[80, 400]} shadowSize={60}>
      <group scale={S}>
        <StreetSet seed="siren" cars={false} trees={false} lamps={false} />
        {/* our own lamps and trees, kept out of the camera's line to the siren and board */}
        {[-3.5, -14.5, -25.5, -36.5].map((z) => (
          <Lamp key={z} position={[-4.0, 0.12, z]} />
        ))}
        {[-24, -31, -38].map((z) => (
          <Lamp key={`r${z}`} position={[4.0, 0.12, z]} />
        ))}
        {[-27, -43].map((z) => (
          <PineTree key={z} position={[5.1, 0.12, z]} scale={1.2} />
        ))}
        <Siren position={SIREN_POS} t={c.t} />
        <group position={SHELTER_BOARD.c} rotation={[0, SHELTER_BOARD.yaw, 0]}>
          <mesh position={[0, -SHELTER_BOARD.c[1] / 2 + 0.06, -0.15]} castShadow>
            <BoxG args={[0.2, SHELTER_BOARD.c[1] - 0.12, 0.2]} />
            <Flat color="#2A2A30" />
          </mesh>
          <mesh position={[0, 0, -0.06]} castShadow>
            <BoxG args={[SHELTER_BOARD.w + 0.2, SHELTER_BOARD.h + 0.2, 0.1]} />
            <Flat color="#15161C" />
          </mesh>
          <CanvasPanel position={[0, 0, 0]} w={SHELTER_BOARD.w} h={SHELTER_BOARD.h} draw={drawLabel("SEEK SHELTER", flash ? "#B3261E" : "#3A0E0C", "#FFFFFF", 0.55)} />
        </group>
      </group>
    </Shot>
  );
};

/**
 * The shelter stands on the right-hand pavement (front face at x = 14, facing the road, door centre at
 * z = -50), clear of the street's lamps (x = 14, z = -31.5 / -70). Trees are off in this set. Runners
 * head for points spread across the doorway; at run speed none reaches the door before the cut.
 */
const SHELTER_AT: V3 = [14, 0.42, -50];
const DOOR_TARGETS: V3[] = [
  [14.5, 0, -51.4],
  [14.5, 0, -49.6],
  [14.5, 0, -50.5],
  [14.5, 0, -48.8],
];

const c4Shelter: ShotFn = (c) => {
  const cam = move({ position: [-3, 9.5, -10], target: [11, 3.5, -50] }, { position: [-2.4, 9.0, -13], target: [11, 3.6, -50] }, c);
  const runners = [
    { start: [5, -30] as const, look: undefined },
    { start: [8.5, -34] as const, look: crowdLook(21) },
    { start: [2, -24] as const, look: crowdLook(22) },
    { start: [9.5, -40] as const, look: crowdLook(23) },
  ];
  return (
    <Shot mood="night" dust={0.3} camera={cam} fog={[80, 400]} shadowSize={60}>
      <BigStreet seed="shelter" cars={false} trees={false} />
      <ShelterBunker position={SHELTER_AT} yaw={-Math.PI / 2} t={c.t} />
      <Hero
        pose={mergePose(REST, { expression: "alarm", rShoulder: [2.5 + Math.sin(c.t * 8) * 0.35, 0.5], rElbow: 0.4, headYaw: 0.4 })}
        position={[12.6, 0.42, -46.3]}
        yaw={-Math.PI / 2}
        look={POLICE_OFFICER}
      />
      {runners.map((r, i) => {
        const target = DOOR_TARGETS[i];
        const dx = target[0] - r.start[0];
        const dz = target[2] - r.start[1];
        const len = Math.hypot(dx, dz);
        const d = Math.min(len - 3, c.lt * 4.6);
        const p: V3 = [r.start[0] + (dx / len) * d, 0, r.start[1] + (dz / len) * d];
        return (
          <Hero
            key={i}
            pose={mergePose(walkPose(c.lt * 2.6 + i * 0.37, 1.35), { expression: "alarm", lean: 0.2 })}
            position={p}
            yaw={Math.atan2(dx, dz)}
            look={r.look}
          />
        );
      })}
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 silence

const c5Empty: ShotFn = (c) => {
  const cam = move({ position: [0.5, 9, 30], target: [0, 5, -20] }, { position: [0.4, 8.5, 26], target: [0, 5, -20] }, c);
  return (
    <Shot mood="dawn" dust={0.5} camera={cam} fog={[60, 300]} stars={false} shadowSize={60}>
      <BigStreet seed="empty" cars={false} lampsOn={false} modify={() => ({ power: 0.15 })} />
      <Hero pose={mergePose(REST, { expression: "worried", headYaw: 0.5 })} position={[0.2, 0, 4]} yaw={Math.PI + 0.4} />
    </Shot>
  );
};

const c5Shops: ShotFn = (c) => {
  const x = -1.5 + c.lt * 2.2;
  const cam = { position: [x, 3.4, 14.5] as V3, target: [x - 0.6, 3.0, 0] as V3 };
  return (
    <Shot mood="dawn" dust={0.5} camera={cam} fog={[20, 100]} stars={false}>
      <mesh position={[0, -0.05, 2]} receiveShadow>
        <boxGeometry args={[60, 0.1, 6]} />
        <meshLambertMaterial color="#8A8F99" flatShading />
      </mesh>
      <mesh position={[0, 0.06, 4.9]} receiveShadow>
        <boxGeometry args={[60, 0.12, 0.3]} />
        <meshLambertMaterial color="#6A707C" flatShading />
      </mesh>
      <Road position={[0, 0.005, 8.6]} width={7} length={60} yaw={Math.PI / 2} />
      <BoardedShop position={[-5.2, 0, 0]} color="#5A4A78" seed="s1" h={11} />
      <BoardedShop position={[0, 0, 0]} color="#2E5A6A" seed="s2" h={14} />
      <BoardedShop position={[5.2, 0, 0]} color="#566270" seed="s3" h={9} />
      <BoardedShop position={[10.4, 0, 0]} color="#1D274B" seed="s4" h={12} />
      <Car position={[3.2, 0, 7.0]} yaw={Math.PI / 2 + 0.25} color={P.carRed} lights={false} />
      <Lamp position={[-2.6, 0, 4.4]} on={false} />
      <Lamp position={[7.8, 0, 4.4]} on={false} lean={0.08} />
    </Shot>
  );
};

const c5Silence: ShotFn = (c) => {
  const cam = move({ position: [1.8, 5.4, 4.2], target: [-6, 3.3, -0.8] }, { position: [1.2, 5.2, 3.6], target: [-6, 3.3, -0.8] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars light={0.35} shadowSize={10}>
      <Bedroom lampOn={false} />
      <Hero pose={mergePose(REST, { expression: "worried", headPitch: 0.05 })} position={[WIN.x + 1.45, 0, WIN.z]} yaw={-Math.PI / 2} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 06 the last meeting

const SEATS = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2 + 0.2);

const c6Summit: ShotFn = (c) => {
  const a = 0.5 + c.lt * 0.12;
  const cam = { position: [Math.sin(a) * 16, 11, Math.cos(a) * 16] as V3, target: [0, 1.4, 0] as V3 };
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      stars={false}
      light={0.6}
      shadowSize={14}
    >
      <SummitHall />
      {SEATS.map((ang, i) => {
        // Chairs at radius 5.1 so the knees (≈1.1 forward) stay clear of the table apron (radius 3.6).
        const pos: V3 = [Math.sin(ang) * 5.1, 0, Math.cos(ang) * 5.1];
        const yaw = ang + Math.PI;
        return (
          <React.Fragment key={i}>
            <Chair position={pos} yaw={yaw} seatY={0.7} />
            <Hero pose={sittingPose({ lShoulder: [0.7, 0.1], rShoulder: [0.7, 0.1], lElbow: 0.9, rElbow: 0.9, headPitch: -0.1, expression: i % 3 ? "worried" : "neutral" })} position={pos} yaw={yaw} look={suitLook(i + 30)} />
          </React.Fragment>
        );
      })}
    </Shot>
  );
};

const c6Broadcast: ShotFn = (c) => {
  // The feed cuts to black on the word "cuts".
  const cut = wordAt(c.words, "cuts to black", c.t - c.lt, c.t - c.lt + 1.3);
  return <RoomTV c={c} pose={couchPose({ expression: c.t > cut ? "alarm" : "worried", lean: 0.12 })} screen={(w, h) => <NewsGraphic w={w} h={h} t={c.t} black={clamp01((c.t - cut) / 0.1)} />} />;
};

const c6Black: ShotFn = () => <AbsoluteFill style={{ background: "#000" }} />;

// ---------------------------------------------------------------- 07 midnight

const CLOCK_POS: V3 = [0.5, 1.1, -3.05];
const CLOCK_YAW = 0.5;

const c7Clock: ShotFn = (c) => {
  const cam = move({ position: [2.4, 2.0, -0.2], target: [0.6, 1.5, -3.0] }, { position: [2.2, 1.95, -0.6], target: [0.6, 1.5, -3.0] }, c);
  const face: V3 = [CLOCK_POS[0] + Math.sin(CLOCK_YAW) * 0.205, CLOCK_POS[1] + 0.25, CLOCK_POS[2] + Math.cos(CLOCK_YAW) * 0.205];
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      stars={false}
      light={0.3}
      shadowSize={8}
      overlay={
        <OnScreen c={face} w={CLOCK.w} h={CLOCK.h} yaw={CLOCK_YAW} cam={cam} width={c.width} height={c.height}>
          {(w, h) => (
            <div style={{ width: w, height: h, background: "#140404", color: "#FF3A2A", fontFamily: FONT, fontWeight: 700, fontSize: h * 0.5, display: "flex", alignItems: "center", justifyContent: "center", letterSpacing: "0.04em", textShadow: "0 0 12px #FF3A2A" }}>
              11:59<span style={{ fontSize: h * 0.26, marginLeft: w * 0.02 }}>PM</span>
            </div>
          )}
        </OnScreen>
      }
    >
      <Bedroom lampOn={false} />
      <AlarmClock position={CLOCK_POS} yaw={CLOCK_YAW} />
      <Hero pose={bedPose({ expression: "worried", headYaw: -0.4 })} position={BED_HERO} />
    </Shot>
  );
};

const PHONE_BED: V3 = [BED.x + 0.35, BED.blanketTop + PHONE.d / 2, -0.2];

const c7Vibrate: ShotFn = (c) => {
  const cam = move({ position: [PHONE_BED[0] + 0.2, 3.0, PHONE_BED[2] + 1.0], target: PHONE_BED }, { position: [PHONE_BED[0] + 0.15, 2.7, PHONE_BED[2] + 0.8], target: PHONE_BED }, c);
  const jitter = Math.sin(c.t * 90) * 0.015;
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      stars={false}
      light={0.3}
      shadowSize={6}
      overlay={
        <OnScreen flat c={[PHONE_BED[0] + jitter, PHONE_BED[1] + PHONE.d / 2 + 0.003, PHONE_BED[2]]} w={PHONE.screenW} h={PHONE.screenH} cam={cam} width={c.width} height={c.height}>
          {(w, h) => <AlertScreen w={w} h={h} title="ALERT" body={"INCOMING"} t={c.t} />}
        </OnScreen>
      }
    >
      <Bedroom lampOn={false} />
      <Phone3D position={[PHONE_BED[0] + jitter, PHONE_BED[1], PHONE_BED[2]]} rotation={[-Math.PI / 2, 0, 0]} glow="#B3261E" />
      <pointLight position={[PHONE_BED[0], PHONE_BED[1] + 0.5, PHONE_BED[2]]} color="#FF3030" intensity={5} distance={3} decay={2} />
    </Shot>
  );
};

const c7Missile: ShotFn = (c) => (
  <PhoneCloseUp c={c} glow="#B3261E" shake={1} lamp={false} screen={(w, h) => <AlertScreen w={w} h={h} title="EMERGENCY ALERT" body={"INCOMING\nMISSILE\nWARNING"} t={c.t} />} />
);

const faceCam = (dist: number): CameraSpec => {
  const head = headPosition(bedPose({ expression: "alarm" }), BED_HERO);
  return { position: [head[0] + 0.25, head[1] - 0.05, head[2] + dist], target: [head[0], head[1] - 0.1, head[2]] };
};

const c7Three: ShotFn = (c) => {
  const cam = lerpCam(faceCam(3.8), faceCam(3.2), c.lt / span(c.dur));
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.3} shadowSize={6}>
      <Bedroom lampOn={false} />
      <Hero pose={bedPose({ expression: "alarm", headPitch: -0.05 })} position={BED_HERO} />
      <pointLight position={[BED.x, 2.2, -1.2]} color="#FF3030" intensity={8} distance={4} decay={2} />
    </Shot>
  );
};

const c7Two: ShotFn = (c) => {
  const cam = move({ position: [0.5, 3.5, -1.2], target: [-6.4, 3.3, -0.6] }, { position: [-0.3, 3.45, -1.1], target: [-6.4, 3.3, -0.6] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars light={0.3} shadowSize={6}>
      <Bedroom lampOn={false} />
    </Shot>
  );
};

const c7One: ShotFn = (c) => {
  const cam = lerpCam(faceCam(2.6), faceCam(2.2), c.lt / span(c.dur));
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.3} shadowSize={6}>
      <Bedroom lampOn={false} />
      <Hero pose={bedPose({ expression: "alarm", blink: k01(c.lt, 0.35, 0.55) })} position={BED_HERO} />
      <pointLight position={[BED.x, 2.2, -1.2]} color="#FF3030" intensity={8} distance={4} decay={2} />
    </Shot>
  );
};

const c7White: ShotFn = (c) => {
  const cam = move({ position: [0, 18, 46], target: [0, 6, -10] }, { position: [0, 17.5, 44], target: [0, 6, -10] }, c);
  const white = k01(c.lt, 0.15, 1.1);
  return (
    <Shot mood="night" camera={cam} fog={[60, 170]} shadowSize={40} overlay={<AbsoluteFill style={{ background: "#FFFFFF", opacity: white }} />}>
      <CityGrid seed="ww3" blocks={5} />
    </Shot>
  );
};

/** White fades to black, then black holds ("…nothing."). */
const c7Nothing: ShotFn = (c) => (
  <AbsoluteFill style={{ background: "#FFFFFF" }}>
    <AbsoluteFill style={{ background: "#000", opacity: k01(c.lt, 0, 0.8) }} />
  </AbsoluteFill>
);

const c7Earth: ShotFn = (c) => {
  const cam = move({ position: [0, 0.3, 19], target: [0, -0.4, 0] }, { position: [0, 0.2, 17.5], target: [0, -0.5, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.35}>
      <FacetedEarth radius={3} position={[0, -0.8, 0]} rotation={[0.35, 2.6 + c.t * 0.03, 0]} cityLights={0.5} />
    </Shot>
  );
};

const c7Empty: ShotFn = (c) => {
  const cam = move({ position: [5.6, 4.6, 5.4], target: [BED.x - 0.2, 1.8, -1.0] }, { position: [5.0, 4.4, 4.6], target: [BED.x - 0.2, 1.8, -1.0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars light={0.3} shadowSize={8}>
      <Bedroom lampOn={false} />
      <Phone3D position={PHONE_BED} rotation={[-Math.PI / 2, 0, 0.4]} glow="#8FD0FF" />
      <pointLight position={[PHONE_BED[0], PHONE_BED[1] + 0.5, PHONE_BED[2]]} color="#8FD0FF" intensity={4} distance={3} decay={2} />
    </Shot>
  );
};

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldEarth },
    { cue: "and your life", fn: coldLife },
    { cue: "before a single", fn: coldCity },
  ],
  c1: [
    { cue: null, fn: c1Phone },
    { cue: "Global conflict", fn: c1Alert },
    { cue: "Supermarkets", fn: c1Market },
    { cue: "Petrol queues", fn: c1Fuel },
  ],
  c2: [
    { cue: null, fn: c2Market },
    { cue: "Flights", fn: c2Flights },
    { cue: "Borders", fn: c2Border },
  ],
  c3: [
    { cue: null, fn: c3Offline },
    { cue: "ATMs", fn: c3Atm },
    { cue: "You try calling", fn: c3Call },
    { cue: "Nothing", fn: c3Nothing },
  ],
  c4: [
    { cue: null, fn: c4Jets },
    { cue: "Another alert", fn: c4Siren },
    { cue: "Seek shelter", fn: c4Shelter },
  ],
  c5: [
    { cue: null, fn: c5Empty },
    { cue: "Shops are boarded", fn: c5Shops },
    { cue: "and the silence", fn: c5Silence },
  ],
  c6: [
    { cue: null, fn: c6Summit },
    { cue: "Then the broadcast", fn: c6Broadcast },
    { cue: "black", fn: c6Black },
  ],
  c7: [
    { cue: null, fn: c7Clock },
    { cue: "Your phone vibrates", fn: c7Vibrate },
    { cue: "Incoming missile", fn: c7Missile },
    { cue: "Three", fn: c7Three },
    { cue: "two", fn: c7Two },
    { cue: "one", fn: c7One },
    { cue: "The sky turns", fn: c7White },
    { cue: "and then nothing", fn: c7Nothing },
    { cue: "Because", fn: c7Earth },
    { cue: "it's not knowing", fn: c7Empty },
  ],
};
