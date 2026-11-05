/**
 * Shots for "What If WW3 Started in 7 Days?" (ep. 5). Generic world, non-graphic.
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { CityGrid, StreetSet } from "../../slavoski/city";
import { BoxG, IcoG } from "../../slavoski/detail";
import { FONT } from "../../slavoski/fonts";
import { crowdLook, suitLook, type HeroLook } from "../../slavoski/hero";
import { Flat } from "../../slavoski/materials";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { GamingRoom, SEAT, SEAT_YAW, sittingPose, tvScreenRect } from "../../slavoski/room";
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
  BILLBOARD,
  Billboard,
  BoardedShop,
  BOARD,
  Checkpoint,
  CLOCK,
  CrashChart,
  DeadScreen,
  Departures,
  FuelQueue,
  GANTRY,
  Jet,
  NewsGraphic,
  OnScreen,
  PHONE,
  Phone3D,
  ShelterEntrance,
  SHELTER_SIGN,
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

const Shot: React.FC<{ children: React.ReactNode; overlay?: React.ReactNode } & React.ComponentProps<typeof Stage>> = ({ children, overlay, ...stage }) => (
  <AbsoluteFill>
    <Stage {...stage}>{children}</Stage>
    {overlay}
  </AbsoluteFill>
);

const Label: React.FC<{ w: number; h: number; text: string; bg: string; color?: string; size?: number }> = ({ w, h, text, bg, color = "#FFF", size = 0.55 }) => (
  <div style={{ width: w, height: h, background: bg, color, fontFamily: FONT, fontWeight: 700, fontSize: h * size, letterSpacing: "0.08em", display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap" }}>
    {text}
  </div>
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

/** Big phone close-up in a dark room, an HTML screen pinned to it. `shake` > 0 = vibrating. */
const PhoneCloseUp: React.FC<{ c: ShotCtx; glow: string; screen: (w: number, h: number) => React.ReactNode; shake?: number }> = ({ c, glow, screen, shake = 0 }) => {
  const cam = move({ position: [0.05, 2.5, 2.1], target: [0, 2.48, 0] }, { position: [0.03, 2.5, 1.75], target: [0, 2.5, 0] }, c);
  const jitter = shake ? Math.sin(c.t * 80) * 0.012 * shake : 0;
  const pos: V3 = [jitter, 2.5, 0];
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      stars={false}
      light={0.35}
      shadows={false}
      overlay={
        <OnScreen c={[pos[0], pos[1], PHONE.d / 2 + 0.003]} w={PHONE.screenW} h={PHONE.screenH} cam={cam} width={c.width} height={c.height}>
          {screen}
        </OnScreen>
      }
    >
      <mesh position={[0, 2.5, -3]}>
        <planeGeometry args={[12, 12]} />
        <Flat color="#141826" />
      </mesh>
      <Phone3D position={pos} glow={glow} />
      {/* the fist holding it from below */}
      <mesh position={[jitter + 0.04, 2.5 - PHONE.h / 2 - 0.06, 0.02]} scale={[1.1, 0.8, 0.9]}>
        <IcoG args={[0.22, 2]} />
        <Flat color="#D9A27A" />
      </mesh>
      <pointLight position={[0, 2.5, 1]} color={glow} intensity={4} distance={4} decay={2} />
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
  const cam = move({ position: [-7, 9, 14], target: [2, 0, -22] }, { position: [-6.4, 8.6, 12], target: [2, 0, -24] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[30, 110]} shadowSize={40}>
      <mesh position={[0, -0.05, -40]} receiveShadow>
        <boxGeometry args={[120, 0.1, 140]} />
        <meshLambertMaterial color="#2F3A44" flatShading />
      </mesh>
      <mesh position={[0, 0.0, -40]} receiveShadow>
        <boxGeometry args={[7, 0.06, 140]} />
        <meshLambertMaterial color="#2A2E3C" flatShading />
      </mesh>
      <FuelQueue t={c.t} cars={26} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 the crash

const c2Market: ShotFn = (c) => {
  const cam = move({ position: [0.6, 2.6, 13.5], target: [0, 5.2, -2] }, { position: [0.5, 2.6, 12.3], target: [0, 5.3, -2] }, c);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={[30, 120]}
      overlay={
        <OnScreen c={BILLBOARD.c} w={BILLBOARD.w} h={BILLBOARD.h} cam={cam} width={c.width} height={c.height}>
          {(w, h) => <CrashChart w={w} h={h} k={k01(c.lt, 0.1, 1.8)} />}
        </OnScreen>
      }
    >
      <StreetSet seed="plaza" cars={false} />
      <Billboard />
      <Hero pose={mergePose(REST, { headPitch: 0.45, expression: "alarm" })} position={[0.6, 0, 3.4]} yaw={Math.PI} />
      <Hero pose={mergePose(REST, { headPitch: 0.4, expression: "worried" })} position={[-1.6, 0, 4.2]} yaw={Math.PI - 0.2} look={crowdLook(11)} />
      <Hero pose={mergePose(REST, { headPitch: 0.4, expression: "worried" })} position={[2.6, 0, 5.0]} yaw={Math.PI + 0.25} look={crowdLook(4)} />
    </Shot>
  );
};

const c2Flights: ShotFn = (c) => {
  const cam = move({ position: [0.6, 3.0, 10.5], target: [0, 4.4, -4] }, { position: [0.5, 3.0, 9.4], target: [0, 4.5, -4] }, c);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      stars={false}
      light={0.85}
      overlay={
        <OnScreen c={BOARD.c} w={BOARD.w} h={BOARD.h} cam={cam} width={c.width} height={c.height}>
          {(w, h) => <Departures w={w} h={h} k={k01(c.lt, 0, 1.0)} />}
        </OnScreen>
      }
    >
      <Terminal />
      <Hero pose={mergePose(REST, { headPitch: 0.35, expression: "alarm" })} position={[1.6, 0, 2.2]} yaw={Math.PI} />
      <mesh position={[2.75, 0.5, 2.2]} castShadow>
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
      fog={[30, 120]}
      overlay={
        <OnScreen c={GANTRY.c} w={GANTRY.w} h={GANTRY.h} cam={cam} width={c.width} height={c.height}>
          {(w, h) => <Label w={w} h={h} text="BORDER CLOSED" bg="#0E0606" color="#FF3A2A" size={0.42} />}
        </OnScreen>
      }
    >
      <Checkpoint down={k01(c.lt, 0.05, 0.6)} t={c.t} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 offline

const TVVIEW: CameraSpec = { position: [1.0, 7.5, 9.0], target: [0.8, 1.4, -1.5] };

const RoomTV: React.FC<{ c: ShotCtx; pose: Pose; screen: (w: number, h: number) => React.ReactNode; hours?: number }> = ({ c, pose, screen, hours = 10 }) => {
  const cam = lerpCam(TVVIEW, { position: [1.0, 7.2, 8.3], target: [0.8, 1.4, -1.5] }, c.lt / span(c.dur));
  const rect = tvScreenRect(cam, c.width, c.height);
  return (
    <AbsoluteFill>
      <Stage mood="night" camera={cam} fog={false} stars={false} light={0.4} shadowSize={14}>
        <GamingRoom hours={hours} cans={0} />
        <Hero pose={pose} position={SEAT} yaw={SEAT_YAW} />
      </Stage>
      <div style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, clipPath: `polygon(${rect.poly})`, overflow: "hidden" }}>{screen(rect.w, rect.h)}</div>
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
  const cam = move({ position: [-1.2, 3.1, 7.0], target: [0.6, 2.3, 0.6] }, { position: [-1.0, 3.05, 6.2], target: [0.6, 2.3, 0.6] }, c);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={[20, 90]}
      overlay={
        <OnScreen c={ATM.c} w={ATM.w} h={ATM.h} cam={cam} width={c.width} height={c.height}>
          {(w, h) => <DeadScreen w={w} h={h} label={"OUT OF\nSERVICE"} />}
        </OnScreen>
      }
    >
      <AtmWall />
      <Hero pose={mergePose(REST, { expression: "worried", headPitch: -0.05, rShoulder: [0.6, 0.1], rElbow: 0.5 })} position={[1.25, 0, 1.6]} yaw={-2.5} />
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
  const cam = move({ position: [-3.2, 4.2, 9.5], target: [-0.3, 3.4, 0] }, { position: [-2.8, 4.1, 8.4], target: [-0.3, 3.45, 0] }, c);
  const head = headPosition(callPose, CALL_POS);
  const fist = handPosition(callPose, "r", CALL_POS);
  const phone: V3 = [head[0] - 0.68 - 0.03, fist[1] + 0.18, head[2]];
  return (
    <Shot mood="night" camera={cam} fog={[20, 100]}>
      <StreetSet seed="call" />
      <Hero pose={callPose} position={CALL_POS} />
      <Phone3D position={phone} rotation={[0, -Math.PI / 2, 0]} glow="#8FD0FF" />
    </Shot>
  );
};

const c3Nothing: ShotFn = (c) => <PhoneCloseUp c={c} glow="#141826" screen={(w, h) => <DeadScreen w={w} h={h} label="CALL FAILED" sub="NO SIGNAL" />} />;

// ---------------------------------------------------------------- 04 seek shelter

const c4Jets: ShotFn = (c) => {
  const cam = move({ position: [1.2, 1.7, 10], target: [0, 8.5, -10] }, { position: [1.0, 1.6, 9.0], target: [0, 9.0, -10] }, c);
  const jets = [
    { y: 24, z: -30, d: 0 },
    { y: 22, z: -34, d: 0.25 },
    { y: 26, z: -38, d: 0.45 },
  ];
  return (
    <Shot mood="night" camera={cam} fog={[40, 160]} shake={c.lt > 0.6 && c.lt < 2.2 ? 0.05 : 0.01}>
      <StreetSet seed="jets" />
      <Hero pose={mergePose(REST, { headPitch: 0.6, expression: "alarm", lShoulder: [0.3, 0.6], rShoulder: [0.3, 0.6] })} position={[0.2, 0, 1.0]} />
      {jets.map((j, i) => (
        <Jet key={i} position={[-50 + (c.lt - j.d) * 40, j.y, j.z]} rotation={[0, Math.PI / 2, 0]} scale={1.6} trail={18} />
      ))}
    </Shot>
  );
};

const c4Siren: ShotFn = (c) => {
  const cam = move({ position: [1.5, 1.4, 6], target: [0, 5.6, 0] }, { position: [1.3, 1.5, 5.2], target: [0, 5.8, 0] }, c);
  return (
    <Shot mood="night" dust={0.2} camera={cam} fog={[30, 120]}>
      <StreetSet seed="siren" cars={false} />
      <Siren position={[0, 0, 0]} t={c.t} />
    </Shot>
  );
};

const c4Shelter: ShotFn = (c) => {
  const cam = move({ position: [1.8, 5.2, 11.5], target: [0, 1.8, -6] }, { position: [1.6, 5.0, 10.5], target: [0, 1.8, -6] }, c);
  const runner = (seed: number, x: number, z0: number, speed: number, look?: HeroLook) => (
    <Hero key={seed} pose={mergePose(walkPose(c.lt * 2.6 + seed * 0.37, 1.35), { expression: "alarm", lean: 0.2 })} position={[x, 0, z0 - c.lt * speed]} yaw={Math.PI} look={look} />
  );
  return (
    <Shot
      mood="night"
      dust={0.3}
      camera={cam}
      fog={[25, 110]}
      overlay={
        <OnScreen c={[SHELTER_SIGN.c[0], SHELTER_SIGN.c[1], SHELTER_SIGN.c[2] - 8]} w={SHELTER_SIGN.w} h={SHELTER_SIGN.h} cam={cam} width={c.width} height={c.height}>
          {(w, h) => <Label w={w} h={h} text="SHELTER ↓" bg="#2FA05A" size={0.42} />}
        </OnScreen>
      }
    >
      <StreetSet seed="shelter" cars={false} />
      <ShelterEntrance position={[0, 0.0, -8]} />
      <Siren position={[3.8, 0.12, -4]} t={c.t} />
      {runner(0, 0.3, 2.5, 3.2)}
      {runner(21, -2.3, 3.6, 3.0, crowdLook(21))}
      {runner(22, 2.6, 4.8, 3.4, crowdLook(22))}
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 silence

const c5Empty: ShotFn = (c) => {
  const cam = move({ position: [0.5, 6, 22], target: [0, 2.5, -8] }, { position: [0.4, 5.6, 19.5], target: [0, 2.5, -8] }, c);
  return (
    <Shot mood="dawn" dust={0.5} camera={cam} fog={[20, 100]} stars={false}>
      <StreetSet seed="empty" cars={false} lampsOn={false} modify={() => ({ power: 0.15 })} />
      <Hero pose={mergePose(REST, { expression: "worried", headYaw: 0.5 })} position={[0.2, 0, 4]} yaw={Math.PI + 0.4} />
    </Shot>
  );
};

const c5Shops: ShotFn = (c) => {
  const x = -1.5 + c.lt * 2.2;
  const cam = { position: [x, 2.6, 9] as V3, target: [x - 0.6, 2.4, 0] as V3 };
  return (
    <Shot mood="dawn" dust={0.5} camera={cam} fog={[20, 100]} stars={false}>
      <mesh position={[0, -0.05, 4]} receiveShadow>
        <boxGeometry args={[60, 0.1, 14]} />
        <meshLambertMaterial color="#566270" flatShading />
      </mesh>
      <BoardedShop position={[-5.2, 0, 0]} color="#5A4A78" seed="s1" />
      <BoardedShop position={[0, 0, 0]} color="#2E5A6A" seed="s2" />
      <BoardedShop position={[5.2, 0, 0]} color="#566270" seed="s3" />
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
  <PhoneCloseUp c={c} glow="#B3261E" shake={1} screen={(w, h) => <AlertScreen w={w} h={h} title="EMERGENCY ALERT" body={"INCOMING\nMISSILE\nWARNING"} t={c.t} />} />
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
