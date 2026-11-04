/**
 * Shots for "What If Every Animal Got As Smart As Us?" (ep. 4). Detail level: "mid".
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random, useVideoConfig } from "remotion";
import { CityGrid, StreetSet } from "../../slavoski/city";
import { Bird, Chimp, Octopus, Quadruped, quadPaw, type Face, type QuadKind } from "../../slavoski/critters";
import { FONT } from "../../slavoski/fonts";
import { SmokeCluster } from "../../slavoski/fx";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { GamingRoom } from "../../slavoski/room";
import { Hero, headPosition, mergePose, REST, type Pose } from "../../slavoski/rig/Hero";
import { FacetedEarth, FacetedMoon } from "../../slavoski/space";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import type { CuedShot } from "../../slavoski/timeline";
import { LeafyTree } from "../../slavoski/nature";
import {
  AnimalSea,
  Aquarium,
  Barn,
  BED,
  Bedroom,
  Blueprint,
  BreakerPanel,
  Bowl,
  Bubble,
  Capitol,
  Chair,
  Chamber,
  Coop,
  EyesInDark,
  RatSwarm,
  Fence,
  Gate,
  GroundWriting,
  MapCrate,
  MeetingRoom,
  penAt,
  Pinned,
  Placard,
  PowerLine,
  ScanRing,
  SewerGrate,
  Silo,
  TANK,
  Tunnel,
  WhiteFlag,
  WIN,
  wireY,
  ZooYard,
} from "./props";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));

/** Mouth opening for a talking character: open while a word is being spoken (global time t). */
const talk = (words: Caption[], t: number, from = 0) => {
  const ms = t * 1000;
  const w = words.find((x) => x.startMs >= from * 1000 - 1 && ms >= x.startMs && ms <= x.endMs);
  return w ? 0.35 + 0.65 * Math.abs(Math.sin((ms - w.startMs) / 70)) : 0;
};

const Shot: React.FC<{ children: React.ReactNode; overlay?: React.ReactNode } & React.ComponentProps<typeof Stage>> = ({ children, overlay, ...stage }) => (
  <AbsoluteFill>
    <Stage {...stage}>{children}</Stage>
    {overlay}
  </AbsoluteFill>
);

/** Slavoski sitting up in bed, legs under the blanket. */
const BED_HERO: V3 = [BED.x, BED.mattressTop - (1.55 + 0.02 - 0.18), -2.55];
const bedPose = (over: Partial<Pose> = {}): Pose =>
  mergePose(REST, { lHip: [1.47, 0.06], rHip: [1.47, 0.06], lKnee: 0.04, rKnee: 0.04, lShoulder: [0.25, 0.25], rShoulder: [0.25, 0.25], lElbow: 0.5, rElbow: 0.5, ...over });

const useSize = () => {
  const { width, height } = useVideoConfig();
  return { width, height };
};

// ---------------------------------------------------------------- cold open

const coldEarth: ShotFn = (c) => {
  const cam = move({ position: [0, 0.4, 18], target: [0, -0.8, 0] }, { position: [0, 0.2, 16], target: [0, -0.9, 0] }, c);
  const lat = 1.35 - k01(c.lt, 0.2, 2.1) * 2.7;
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.9}>
      <group position={[0, -2.6, 0]}>
        <FacetedEarth radius={3} rotation={[0.35, 1.3 + c.t * 0.12, 0]} cityLights={0.6} />
        <ScanRing radius={3} lat={lat} opacity={c.lt < 2.1 ? 1 : 0} />
      </group>
      <FacetedMoon radius={0.6} position={[2.5, 0.9, -4]} rotation={[0.2, 0.6, 0]} />
    </Shot>
  );
};

const coldDog: ShotFn = (c) => {
  const cam = move({ position: [0.5, 2.0, 5.4], target: [0, 1.62, 0] }, { position: [0.4, 1.95, 4.5], target: [0, 1.65, 0] }, c);
  const wake = k01(c.lt, 0.2, 0.45);
  const ring = clamp01((c.lt - 0.3) / 0.6);
  return (
    <Shot mood="night" camera={cam} fog={[14, 80]}>
      <StreetSet seed="cold" />
      <Quadruped
        kind="dog"
        position={[0, 0, 0]}
        scale={1.6}
        headPitch={0.15 + wake * 0.1}
        face={{ eyeOpen: 0.3 + wake * 1.0, brow: wake > 0.5 ? "worried" : "none", look: [0, 0.1 * wake], mouth: wake * 0.3 }}
      />
      {ring > 0 && ring < 1 ? (
        <mesh position={[0, 1.7, -0.4]}>
          <ringGeometry args={[0.4 + ring * 1.4, 0.48 + ring * 1.45, 40]} />
          <meshBasicMaterial color={P.amber} transparent opacity={(1 - ring) * 0.9} toneMapped={false} />
        </mesh>
      ) : null}
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 the pigeon

const c1Wake: ShotFn = (c) => {
  const cam = move({ position: [7.6, 5.2, 5.8], target: [2.2, 3.1, -2.3] }, { position: [7.0, 5.0, 5.1], target: [2.25, 3.15, -2.3] }, c);
  const stretch = 1 - k01(c.lt, 0.55, 0.85);
  const turn = k01(c.lt, 0.7, 0.95);
  const pose = bedPose({
    lShoulder: [0.25 + stretch * 2.6, 0.25 + stretch * 0.1],
    rShoulder: [0.25 + stretch * 2.6, 0.25 + stretch * 0.1],
    lElbow: 0.5 - stretch * 0.3,
    rElbow: 0.5 - stretch * 0.3,
    headPitch: stretch * 0.25,
    headYaw: -turn * 0.85,
    expression: stretch > 0.5 ? "awe" : "worried",
    blink: stretch > 0.5 ? 1 : 0,
  });
  return (
    <Shot mood="dawn" camera={cam} fog={false} stars={false} light={1.0} shadowSize={12}>
      <Bedroom lampOn dawn />
      <Hero pose={pose} position={BED_HERO} />
    </Shot>
  );
};

const PIGEON_SILL: V3 = [WIN.x - 0.42, WIN.sillY, WIN.z - 0.25];

const c1Window: ShotFn = (c) => {
  const cam = move({ position: [-2.6, 3.0, -0.35], target: [-6.4, 2.85, -0.6] }, { position: [-3.6, 2.95, -0.45], target: [-6.4, 2.85, -0.6] }, c);
  const twitch = c.lt > 0.9 && c.lt < 1.05 ? 0.25 : 0;
  return (
    <Shot mood="dawn" camera={cam} fog={false} stars={false} light={0.8} shadowSize={10}>
      <Bedroom lampOn={false} dawn />
      <Bird kind="pigeon" position={PIGEON_SILL} yaw={Math.PI / 2} scale={1.15} headYaw={twitch} face={{ eyeOpen: 1.2, look: [0, 0] }} />
    </Shot>
  );
};

/** The pigeon on the pavement (sidewalk top y = 0.12). */
const PAVE: V3 = [4.6, 0.12, 2.6];

const c1Pick: ShotFn = (c) => {
  const cam = move({ position: [PAVE[0] - 1.2, 1.0, PAVE[2] + 4.2], target: [PAVE[0], 0.55, PAVE[2]] }, { position: [PAVE[0] - 0.9, 0.9, PAVE[2] + 3.4], target: [PAVE[0], 0.5, PAVE[2]] }, c);
  const walk = clamp01(c.lt / 0.55);
  const peck = c.lt < 0.55 ? 0 : c.lt < 0.85 ? k01(c.lt, 0.55, 0.75) : 1 - k01(c.lt, 0.85, 1.1);
  const held = c.lt > 0.8;
  const z = PAVE[2] - 0.3 + walk * 0.3;
  return (
    <Shot mood="dawn" camera={cam} fog={[20, 120]} stars={false}>
      <StreetSet seed="pave" cars={false} />
      <Bird kind="pigeon" position={[PAVE[0], PAVE[1], z]} walk={c.lt < 0.55 ? c.lt * 2.4 : 0} peck={peck} pebble={held} face={{ eyeOpen: 1.1, brow: held ? "smug" : "none" }} />
      {!held ? (
        <mesh position={[PAVE[0], PAVE[1] + 0.04, PAVE[2] + 0.42]} castShadow>
          <icosahedronGeometry args={[0.05, 0]} />
          <meshLambertMaterial color="#C9C2B4" flatShading />
        </mesh>
      ) : null}
    </Shot>
  );
};

const WRITE = { text: "WE KNOW.", size: 0.22, at: [1.6, 0.0, 2.4] as V3 };

const c1Write: ShotFn = (c) => {
  const cam = move({ position: [1.6, 6.6, 7.2], target: [1.6, 0.1, 1.95] }, { position: [1.6, 6.1, 6.7], target: [1.6, 0.1, 1.95] }, c);
  const progress = clamp01(c.lt / 1.15);
  const [px, pz] = penAt(WRITE.text, WRITE.size, progress);
  const done = c.lt > 1.2;
  const scratch = done ? 0.2 : 0.75 + 0.25 * Math.abs(Math.sin(c.lt * 22));
  // The pigeon stands behind the line of text (−Z) facing the camera, beak on the pen point.
  const pos: V3 = [WRITE.at[0] + px, 0, WRITE.at[2] + pz - 0.45];
  return (
    <Shot mood="dawn" camera={cam} fog={[20, 120]} stars={false}>
      <StreetSet seed="pave" cars={false} />
      <GroundWriting text={WRITE.text} size={WRITE.size} position={WRITE.at} progress={progress} />
      <Bird kind="pigeon" position={pos} scale={0.85} peck={scratch} headPitch={done ? 0.5 : 0} pebble face={{ eyeOpen: 1.1, brow: done ? "smug" : "flat", look: [0, done ? 0.3 : -0.2] }} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 within minutes

const c2Stare: ShotFn = (c) => {
  const cam = move({ position: [1.2, 2.3, 10.5], target: [0, 1.1, 0] }, { position: [1.0, 2.2, 9.4], target: [0, 1.1, 0] }, c);
  const snap = k01(c.lt, 0.25, 0.4);
  const turn = (seed: string) => (1 - snap) * (random(seed) - 0.5) * 2.4;
  return (
    <Shot mood="dawn" camera={cam} fog={[20, 120]} stars={false}>
      <StreetSet seed="stare" />
      <Quadruped kind="dog" position={[-1.4, 0, 1.2]} yaw={0.4} scale={1.2} headYaw={turn("d1") - 0.4 * snap} face={{ eyeOpen: 1.2 }} />
      <Quadruped kind="cat" position={[1.5, 0, 0.6]} yaw={-0.5} scale={1.3} sit headYaw={turn("c1") + 0.45 * snap} face={{ eyeOpen: 1.1, brow: "flat" }} />
      <Bird kind="pigeon" position={[0.2, 0, 3.2]} scale={0.7} headYaw={turn("p1")} face={{ eyeOpen: 1.2 }} />
      <Bird kind="pigeon" position={[-0.6, 0, 4.0]} scale={0.7} yaw={0.4} headYaw={turn("p2") - 0.3 * snap} face={{ eyeOpen: 1.2 }} />
      <Bird kind="pigeon" position={[0.9, 0, 4.4]} scale={0.7} yaw={-0.3} headYaw={turn("p3") + 0.2 * snap} face={{ eyeOpen: 1.2 }} />
    </Shot>
  );
};

const DOG_POS: V3 = [-0.75, 0, 1.6];
const HERO_DOG: V3 = [0.95, 0, -0.4];

const c2Dog: ShotFn = (c) => {
  const { width, height } = c;
  const cam = move({ position: [0.6, 2.8, 10.6], target: [0.2, 2.1, 0] }, { position: [0.5, 2.7, 9.6], target: [0.2, 2.1, 0] }, c);
  const second = c.lt > 1.15;
  const pose = mergePose(REST, { headYaw: -0.35, headPitch: -0.25, expression: second ? "worried" : "smile", lShoulder: [0.35, 0.2], rShoulder: [0.1, 0.15], lElbow: 0.8 });
  const head = headPosition(pose, HERO_DOG, -0.55);
  const dogFace: Face = second ? { brow: "smug", eyeOpen: 0.55, look: [0.15, 0.1], mouth: talk(c.words, c.t) * 0 + (Math.sin(c.lt * 18) > 0 ? 0.5 : 0.1) } : { eyeOpen: 1.1, look: [0.2, 0.2] };
  return (
    <Shot
      mood="dawn"
      camera={cam}
      fog={[20, 120]}
      stars={false}
      overlay={
        <>
          <Bubble text={"WHO'S A\nGOOD BOY?"} at={[head[0] - 0.3, head[1] - 0.2, head[2] + 0.6]} cam={cam} width={width} height={height} offset={[60, -190]} appear={k01(c.lt, 0.05, 0.25) * (second ? 0 : 1)} />
          <Bubble text={"DEFINE\n“GOOD.”"} at={[DOG_POS[0] + 0.25, 1.15, DOG_POS[2] + 0.75]} cam={cam} width={width} height={height} offset={[-40, -260]} appear={k01(c.lt, 1.15, 1.35)} accent="#14121C" />
        </>
      }
    >
      <StreetSet seed="dogwalk" />
      <Hero pose={pose} position={HERO_DOG} yaw={-0.55} />
      <Quadruped kind="dog" position={DOG_POS} yaw={0.75} scale={1.35} headPitch={0.35} headYaw={-0.2} face={dogFace} wag={second ? 0 : c.t * 3} />
    </Shot>
  );
};

const c2Cat: ShotFn = (c) => {
  const { width } = c;
  const cam = move({ position: [-0.5, 2.5, -3.6], target: [-0.3, 1.75, 1.95] }, { position: [-0.5, 2.4, -2.9], target: [-0.3, 1.78, 1.95] }, c);
  const realise = k01(c.lt, 0.15, 0.4);
  const smug = k01(c.lt, 1.3, 1.6);
  const face: Face = smug > 0.5 ? { brow: "smug", eyeOpen: 0.45, look: [0.05, 0] } : { eyeOpen: 0.7 + realise * 0.6, brow: realise > 0.5 ? "worried" : "none", look: [0, 0.1] };
  const lines = [
    { label: "FOOD", value: "FREE", at: 1.1 },
    { label: "ACCOMMODATION", value: "FREE", at: 1.75 },
    { label: "RENT PAID", value: "£0", at: 2.9 },
  ];
  return (
    <Shot
      mood="dawn"
      camera={cam}
      fog={false}
      stars={false}
      light={0.85}
      shadowSize={10}
      overlay={
        <div
          style={{
            position: "absolute",
            left: width / 2 - 230,
            top: 250,
            width: 460,
            padding: "26px 34px 22px",
            background: "#F6F2EA",
            borderRadius: 6,
            boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
            fontFamily: FONT,
            color: "#24212C",
            transform: `rotate(-3deg) translateY(${(1 - k01(c.lt, 0.7, 1.0)) * -600}px)`,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 30, letterSpacing: "0.18em", textAlign: "center", marginBottom: 14 }}>RECEIPT</div>
          {lines.map((l) => (
            <div key={l.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 28, margin: "8px 0", opacity: c.lt > l.at ? 1 : 0, fontWeight: l.label === "RENT PAID" ? 700 : 400 }}>
              <span>{l.label}</span>
              <span style={{ color: l.label === "RENT PAID" ? "#C8372D" : "#24212C" }}>{l.value}</span>
            </div>
          ))}
          <div style={{ borderTop: "3px dashed #8A8590", marginTop: 12, paddingTop: 10, fontSize: 22, textAlign: "center", letterSpacing: "0.1em", opacity: c.lt > 2.9 ? 0.8 : 0 }}>
            DURATION: ENTIRE LIFE
          </div>
        </div>
      }
    >
      <GamingRoom hours={-4} tvOn={false} />
      <Quadruped kind="cat" position={[-0.6, 0.7, 1.95]} yaw={Math.PI} scale={1.5} sit headPitch={0.1} face={face} />
      <Bowl position={[0.55, 0.7, 1.9]} />
    </Shot>
  );
};

const OCTO: V3 = [0.3, TANK.standH + 0.24, 0.1];

const c2Octo: ShotFn = (c) => {
  const cam = move({ position: [0.5, 2.6, 5.4], target: [0.2, 2.4, 0] }, { position: [0.4, 2.55, 4.5], target: [0.25, 2.4, 0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.45} shadowSize={8}>
      <Aquarium t={c.t} />
      <Octopus position={OCTO} t={c.t} face={{ brow: "angry", eyeOpen: 0.6, look: [0.1 * Math.sin(c.lt * 3), 0] }} />
    </Shot>
  );
};

const c2Lid: ShotFn = (c) => {
  const cam = move({ position: [0.9, 3.5, 6.0], target: [0.2, 3.1, 0] }, { position: [0.8, 3.5, 5.3], target: [0.2, 3.15, 0] }, c);
  const rise = k01(c.lt, 0, 0.5);
  const lid = k01(c.lt, 0.5, 1.3);
  const reach = k01(c.lt, 0.15, 0.55);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.45} shadowSize={8}>
      <Aquarium t={c.t} lid={lid} />
      <Octopus position={[OCTO[0] - 0.1, OCTO[1] + rise * 0.9, OCTO[2] - 0.2]} t={c.t} reach={{ 0: reach, 7: reach }} face={{ brow: "smug", eyeOpen: 0.7, look: [0, 0.3] }} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 one hour in

const LEADER: V3 = [0, 0, -1.05];

const c3Yard: ShotFn = (c) => {
  const cam = move({ position: [2.8, 4.6, 9.6], target: [0, 1.3, 0.4] }, { position: [2.5, 4.4, 8.8], target: [0, 1.3, 0.4] }, c);
  const walk = c.lt * 1.4;
  return (
    <Shot mood="night" camera={cam} fog={[25, 90]}>
      <ZooYard />
      <MapCrate position={[0, 0, 0]} route={0} />
      <Chimp position={LEADER} face={{ eyeOpen: 1 }} arms={[0.3, 0.1]} />
      {[
        [-3.4, 2.6, 0.7],
        [3.2, 2.9, -0.8],
        [-1.4, 4.0, 0.3],
      ].map(([x, z, yaw], i) => (
        <Chimp key={i} position={[x - Math.sin(yaw) * (1.2 - c.lt * 0.8), 0, z - Math.cos(yaw) * (1.2 - c.lt * 0.8)]} yaw={yaw + Math.PI} walk={walk + i * 0.3} lean={0.35} face={{ eyeOpen: 1 }} />
      ))}
    </Shot>
  );
};

const c3Plan: ShotFn = (c) => {
  const cam = move({ position: [0.6, 3.5, 5.9], target: [0, 1.5, -0.3] }, { position: [0.5, 3.3, 5.1], target: [0, 1.5, -0.3] }, c);
  const route = k01(c.lt, 0.2, 1.6);
  const nod = (i: number) => Math.max(0, Math.sin(c.lt * 7 + i * 1.3)) * 0.18;
  return (
    <Shot mood="night" camera={cam} fog={[25, 90]}>
      <ZooYard />
      <MapCrate position={[0, 0, 0]} route={route} />
      {/* leader points down at the route */}
      <Chimp position={LEADER} arms={[1.15, 0.15]} elbows={[0.05, 0.3]} armRoll={[-0.15, 0.15]} headPitch={-0.35} lean={0.18} face={{ brow: "flat", eyeOpen: 0.9, look: [0.05, -0.2], mouth: Math.sin(c.lt * 14) > 0 ? 0.6 : 0.1 }} />
      <Chimp position={[-1.2, 0, 1.0]} yaw={2.25} headPitch={-0.25 - nod(0)} face={{ eyeOpen: 1.1, look: [0, -0.2] }} />
      <Chimp position={[1.25, 0, 1.05]} yaw={-2.25} headPitch={-0.25 - nod(1)} face={{ eyeOpen: 1.1, look: [0, -0.2] }} />
    </Shot>
  );
};

const CROWS = [-5.2, -3.9, -2.6, -1.3, 0, 1.3, 2.6, 3.9, 5.2];

const crowRow = (lt: number, snapAt: number) =>
  CROWS.map((x, i) => {
    const snap = k01(lt, snapAt + (i % 3) * 0.02, snapAt + 0.12);
    const away = (random(`crow${i}`) - 0.5) * 2.6;
    return (
      <Bird
        key={i}
        kind="crow"
        position={[x, wireY(x, 1) + 0.02, 0.25]}
        scale={0.95}
        headYaw={away * (1 - snap)}
        face={{ eyeOpen: snap > 0.5 ? 0.6 : 1, brow: snap > 0.5 ? "angry" : "none" }}
      />
    );
  });

const c3Wire: ShotFn = (c) => {
  const cam = move({ position: [0, 4.2, 8.6], target: [0, 6.3, 0] }, { position: [0, 4.4, 7.7], target: [0, 6.3, 0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[30, 140]}>
      <PowerLine />
      {crowRow(c.lt, 99)}
      <FacetedMoon radius={3} position={[2, 11, -30]} rotation={[0.2, 0.8, 0]} />
    </Shot>
  );
};

const c3Stare: ShotFn = (c) => {
  const cam = move({ position: [3.0, 6.5, 4.4], target: [-1.2, 6.1, 0.2] }, { position: [2.6, 6.45, 3.7], target: [-1.2, 6.1, 0.2] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[30, 140]}>
      <PowerLine />
      {crowRow(c.lt, 0.35)}
      <FacetedMoon radius={3} position={[2, 11, -30]} rotation={[0.2, 0.8, 0]} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 the great escape

const Farm: React.FC<{ fenceBurst?: number; gateOpen?: number; latch?: number; t: number }> = ({ fenceBurst = 0, gateOpen = 0, latch = 0, t }) => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <boxGeometry args={[160, 0.1, 160]} />
      <meshLambertMaterial color="#2F5A44" flatShading />
    </mesh>
    <Barn position={[-6, 0, -9]} doorOpen={0.6} />
    <Silo position={[0.5, 0, -12]} />
    <Fence x0={-12} x1={12} z={0} breakAt={-3} burst={fenceBurst} />
    <Gate position={[6, 0, 0.0]} open={gateOpen} latch={latch} />
    <Coop position={[7.5, 0, -6]} />
    <LeafyTree position={[12, 0, -10]} scale={1.6} seed="ft1" />
    <LeafyTree position={[-14, 0, -6]} scale={1.4} seed="ft2" />
    <FacetedMoon radius={3} position={[-8, 20, -60]} rotation={[0.2, 0.6, 0]} />
    <pointLight position={[-6, 3, -3.5]} color="#FFC890" intensity={12 + Math.sin(t * 8) * 0.5} distance={14} decay={2} />
  </group>
);

const c4Farm: ShotFn = (c) => {
  const cam = move({ position: [7, 6, 18], target: [-1, 2, -6] }, { position: [5.5, 5.4, 15.5], target: [-1, 2, -6] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[30, 120]} shadowSize={30}>
      <Farm t={c.t} />
    </Shot>
  );
};

const c4Sea: ShotFn = (c) => {
  const cam = move({ position: [0, 14, 10], target: [0, 0, -18] }, { position: [0, 22, 16], target: [0, 0, -24] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[30, 110]} shadowSize={40}>
      <mesh position={[0, -0.05, -40]} receiveShadow>
        <boxGeometry args={[200, 0.1, 200]} />
        <meshLambertMaterial color="#3A3428" flatShading />
      </mesh>
      <AnimalSea t={c.t} />
    </Shot>
  );
};

const COW_CLOSE: V3 = [0, 0, 0];

const c4Realise: ShotFn = (c) => {
  const { width, height } = c;
  const cam = move({ position: [0.9, 2.5, 6.6], target: [0, 1.85, 0] }, { position: [0.8, 2.45, 5.8], target: [0, 1.9, 0] }, c);
  const shock = k01(c.lt, 0.9, 1.05);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={[30, 120]}
      overlay={<Bubble think text={"WAIT...\nBURGERS?!"} at={[0.25, 2.6, 0.9]} cam={cam} width={width} height={height} offset={[60, -190]} appear={k01(c.lt, 0.3, 0.55)} />}
    >
      <Farm t={c.t} />
      <Quadruped kind="cow" position={COW_CLOSE} scale={1.15} headPitch={0.1} face={{ eyeOpen: 0.9 + shock * 0.45, brow: shock > 0.5 ? "worried" : "none", look: [0, 0.1], mouth: shock * 0.7 }} />
    </Shot>
  );
};

const c4Angry: ShotFn = (c) => {
  const cam = move({ position: [0, 1.1, 10.2], target: [0, 1.4, 0] }, { position: [0, 1.05, 9.2], target: [0, 1.45, 0] }, c);
  const face: Face = { brow: "angry", eyeOpen: 0.65, look: [0, 0] };
  return (
    <Shot mood="night" dust={0.6} camera={cam} fog={[20, 90]} shake={0.02}>
      <Farm t={c.t} />
      <pointLight position={[0, 2.5, -3]} color="#FF6A2A" intensity={30} distance={12} decay={2} />
      <Quadruped kind="cow" position={[-1.4, 0, -0.6]} yaw={0.25} scale={1} face={face} />
      <Quadruped kind="pig" position={[1.35, 0, 0.2]} yaw={-0.3} scale={1.15} face={face} />
      <Bird kind="chicken" position={[0.05, 0, 1.6]} scale={0.95} face={face} />
    </Shot>
  );
};

const c4Cows: ShotFn = (c) => {
  const cam = { position: [-1.0, 1.4, 7.8] as V3, target: [-3, 1.1, 0] as V3 };
  // Nose reaches the fence line (z = 0) at lt = 0.32; boards burst from there.
  const nose = 1.55;
  const z = -3.4 + c.lt * 7.5;
  const burst = clamp01((z + nose) / 2.2);
  return (
    <Shot mood="night" camera={cam} fog={[30, 120]} shake={burst > 0 && burst < 0.4 ? 0.05 : 0}>
      <Farm t={c.t} fenceBurst={burst} />
      <Quadruped kind="cow" position={[-3, 0, z]} walk={c.lt * 3.2} face={{ brow: "angry", eyeOpen: 0.75 }} />
      <Quadruped kind="cow" position={[-3.1, 0, z - 2.6]} walk={c.lt * 3.2 + 0.4} face={{ brow: "angry", eyeOpen: 0.75 }} />
    </Shot>
  );
};

/** The pig rears up behind the gate and lifts the latch with its right trotter. */
const PIG_GATE = { scale: 1.3, arms: [0.6, 0.95] as [number, number] };
const LATCH: V3 = [6 - 1.48 + 2.85, 0.92, 0.1];
const pigAtLatch = (): V3 => {
  const paw = quadPaw("pig", { rear: 1, arms: PIG_GATE.arms, scale: PIG_GATE.scale }, -1);
  return [LATCH[0] - paw[0], 0, LATCH[2] - 0.2 - paw[2]];
};

const c4Pig: ShotFn = (c) => {
  const cam = move({ position: [9.6, 2.0, 5.6], target: [7.4, 1.2, -0.4] }, { position: [9.2, 1.9, 4.9], target: [7.4, 1.2, -0.4] }, c);
  const latch = k01(c.lt, 0.1, 0.4);
  const open = k01(c.lt, 0.45, 1.2);
  const base = pigAtLatch();
  return (
    <Shot mood="night" camera={cam} fog={[30, 120]}>
      <Farm t={c.t} gateOpen={open} latch={latch} />
      <Quadruped kind="pig" position={base} scale={PIG_GATE.scale} rear={1} arms={latch < 1 || open < 0.1 ? PIG_GATE.arms : [0.4, 0.4]} headYaw={open * 0.5} face={{ brow: open > 0.3 ? "smug" : "flat", eyeOpen: 0.8 }} />
    </Shot>
  );
};

const CHICKS = [
  [-0.95, 0.25, 1.6],
  [0.95, 0.2, -1.6],
  [0.0, -0.95, 0],
  [0.0, 0.95, Math.PI],
];

const c4Plan: ShotFn = (c) => {
  const cam = move({ position: [0.3, 5.6, 2.6], target: [0, 0.3, 0] }, { position: [0.25, 5.1, 2.2], target: [0, 0.3, 0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[30, 120]}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[40, 0.1, 40]} />
        <meshLambertMaterial color="#6A5A3A" flatShading />
      </mesh>
      <pointLight position={[0, 3, 1]} color="#FFD8A0" intensity={10} distance={8} decay={2} />
      <Blueprint position={[0, 0.02, 0]} draw={k01(c.lt, 0.1, 0.8)} />
      {CHICKS.map(([x, z, yaw], i) => (
        <Bird key={i} kind="chicken" position={[x, 0, z]} yaw={yaw} scale={0.75} peck={i === 2 ? Math.max(0, Math.sin(c.lt * 8)) * 0.3 : 0} headPitch={-0.3} face={{ brow: "angry", eyeOpen: 0.8, look: [0, -0.3] }} flap={i === 3 ? 0.3 : 0} flapT={c.t} />
      ))}
    </Shot>
  );
};

const COOP_POS: V3 = [0, 0, -2];

const c4Breakout: ShotFn = (c) => {
  const cam = move({ position: [1.4, 1.6, 6.5], target: [0, 1.0, -1.2] }, { position: [1.2, 1.4, 5.8], target: [0, 0.9, -1.0] }, c);
  const hatch = k01(c.lt, 0, 0.15);
  const chickens = Array.from({ length: 9 }, (_, i) => {
    const s = c.lt * 2.6 - i * 0.28 - 0.1; // path length travelled
    if (s < 0) return null;
    // Path: hatch sill (z = 1.12, y = 1.0) → down the ramp to (z = 2.4, y = 0) → along the ground toward the camera.
    const rampLen = 1.64;
    const lz = s < rampLen ? 1.12 + (s / rampLen) * 1.28 : 2.4 + (s - rampLen);
    const y = s < rampLen ? 1.0 - (s / rampLen) * 1.0 + 0.04 : 0;
    const x = (random(`ch${i}`) - 0.5) * (s < rampLen ? 0.4 : 0.6 + (s - rampLen) * 0.8);
    return <Bird key={i} kind="chicken" position={[COOP_POS[0] + x, y, COOP_POS[2] + lz]} yaw={x * 0.3} scale={0.6} walk={c.lt * 4 + i * 0.3} flap={0.5} flapT={c.t + i * 0.1} face={{ brow: "angry", eyeOpen: 0.8 }} />;
  });
  return (
    <Shot mood="night" camera={cam} fog={[30, 120]}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[60, 0.1, 60]} />
        <meshLambertMaterial color="#2F5A44" flatShading />
      </mesh>
      <Coop position={COOP_POS} hatch={hatch} />
      {chickens}
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 beneath the city

const GRATE: V3 = [1.0, 0, 3.0];

const c5Grate: ShotFn = (c) => {
  const cam = move({ position: [1.7, 1.3, 6.4], target: [1.0, 0.45, 3.0] }, { position: [1.6, 1.2, 5.7], target: [1.0, 0.45, 3.0] }, c);
  const lift = k01(c.lt, 0.05, 0.45);
  return (
    <Shot mood="night" camera={cam} fog={[20, 100]}>
      <StreetSet seed="grate" cars={false} />
      <SewerGrate position={GRATE} lift={lift * 0.75} />
      {/* rat rises out of the hole: body hidden below the road until it climbs */}
      <Quadruped kind="rat" position={[GRATE[0], -0.62 + lift * 0.62, GRATE[2] + 0.05]} scale={1.05} rear={0.85} arms={[0.6, 0.6]} face={{ eyeOpen: 1.1, brow: "flat", look: [0, 0.1] }} />
    </Shot>
  );
};

const c5Eyes: ShotFn = (c) => {
  // A river of rats pours down the sewer toward the camera as it rises and backs away.
  const cam = move({ position: [0.7, 3.1, 2.6], target: [0, 0.2, -6.5] }, { position: [0.9, 3.7, 4.6], target: [0, 0.2, -6.5] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[6, 28]} stars={false} light={0.6} shadows={false}>
      <Tunnel lamps={1} />
      <RatSwarm t={c.t} />
      <EyesInDark count={110} area={[-2.3, 2.3, 0.25, 0.7, -40, -27]} t={c.t} open={1} />
    </Shot>
  );
};

/** Lever pivot in world space (panel on the right tunnel wall, facing -x). */
const PANEL: V3 = [2.4, 2.4, -2];

const c5Lever: ShotFn = (c) => {
  const cam = move({ position: [-1.2, 2.5, 3.8], target: [2.1, 2.0, -1.1] }, { position: [-0.9, 2.45, 3.1], target: [2.1, 2.0, -1.1] }, c);
  const lever = k01(c.lt, 0.15, 0.75);
  // Knob centre in world: panel local (0.9, 0.1, 0.1) pivot, arm 0.8 along the rotated +x.
  const ang = 0.9 - lever * 1.8;
  const yaw = -Math.PI / 2;
  const kx = 0.9 + Math.cos(ang) * 0.8;
  const ky = 0.1 + Math.sin(ang) * 0.8;
  const kz = 0.2;
  const knob: V3 = [PANEL[0] + kz * Math.sin(yaw) + kx * Math.cos(yaw), PANEL[1] + ky, PANEL[2] - kx * Math.sin(yaw) + kz * Math.cos(yaw)];
  // The rat hangs from the knob by both front paws, facing the panel (+x).
  const ratYaw = Math.PI / 2;
  const arms: [number, number] = [2.7, 2.7];
  const pl = quadPaw("rat", { rear: 1, arms, yaw: ratYaw, scale: 2.2 }, 1);
  const pr = quadPaw("rat", { rear: 1, arms, yaw: ratYaw, scale: 2.2 }, -1);
  const pm: V3 = [(pl[0] + pr[0]) / 2, (pl[1] + pr[1]) / 2, (pl[2] + pr[2]) / 2];
  const ratPos: V3 = [knob[0] - pm[0] - 0.12, Math.max(0.1, knob[1] - pm[1]), knob[2] - pm[2]];
  return (
    <Shot mood="night" camera={cam} fog={[4, 30]} stars={false} light={0.4}>
      <Tunnel lamps={lever < 0.9 ? 1 : 0} />
      <BreakerPanel position={PANEL} yaw={yaw} lever={lever} t={c.t} />
      <Quadruped kind="rat" position={ratPos} yaw={ratYaw} scale={2.2} rear={1} arms={arms} face={{ brow: "angry", eyeOpen: 0.8, mouth: 0.4 }} />
    </Shot>
  );
};

const c5Blackout: ShotFn = (c) => {
  const cam = move({ position: [12, 30, 30], target: [0, 2, -4] }, { position: [11, 28, 27], target: [0, 2, -4] }, c);
  const wave = c.lt * 46;
  return (
    <Shot mood="night" camera={cam} fog={[50, 150]} shadowSize={50}>
      <CityGrid seed="blackout" blocks={5} modify={(s) => ({ power: clamp01((Math.hypot(s.position[0], s.position[2]) - wave) / 6) })} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 06 one week later

const c6Capitol: ShotFn = (c) => {
  const cam = move({ position: [5, 6.5, 36], target: [0, 5, -2] }, { position: [4.5, 6.2, 32.5], target: [0, 5, -2] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[40, 160]} stars={false}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[200, 0.1, 200]} />
        <meshLambertMaterial color="#566270" flatShading />
      </mesh>
      <Capitol position={[0, 0, -2]} />
      {[
        ["dog", -3, 9],
        ["pig", 2.4, 10],
        ["cow", -0.4, 11.5],
      ].map(([k, x, z], i) => (
        <Quadruped key={i} kind={k as QuadKind} position={[x as number, 0, z as number]} yaw={Math.PI + 0.2 * (i - 1)} walk={c.lt * 1.5 + i * 0.3} />
      ))}
    </Shot>
  );
};

const c6Chamber: ShotFn = (c) => {
  const cam = move({ position: [3.4, 6.2, 11.6], target: [0, 2.8, -1] }, { position: [3.0, 6.0, 10.6], target: [0, 2.8, -1] }, c);
  const pose = mergePose(REST, { expression: "worried", headPitch: -0.1, lShoulder: [0.5, 0.2], rShoulder: [0.5, 0.2], lElbow: 0.9, rElbow: 0.9 });
  const benchY = (r: number) => 0.7 + r * 0.5;
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.8} shadowSize={14}>
      <Chamber />
      <pointLight position={[0, 6, 2]} color="#FFE2B8" intensity={22} distance={20} decay={2} />
      <Hero pose={pose} position={[0, 0.4, -1.65]} />
      {(
        [
          ["dog", -3.2, 0],
          ["pig", -1.0, 0],
          ["pig", 1.6, 1],
          ["cat", 3.4, 0],
          ["pig", -2.6, 1],
          ["dog", 0.4, 2],
        ] as [QuadKind, number, number][]
      ).map(([k, x, r], i) => (
        <Quadruped key={i} kind={k} position={[x, benchY(r) - 0.02, 2.6 + r * 1.9]} yaw={Math.PI} sit={k !== "cow"} scale={k === "cow" ? 0.75 : 1.2} headPitch={0.25} face={{ eyeOpen: 1, brow: i % 2 ? "angry" : "flat", look: [0, 0.2] }} />
      ))}
    </Shot>
  );
};

const SIGNS = [
  { text: "RIGHTS\nNOW", kind: "dog" as QuadKind, x: -1.7, z: 1.2 },
  { text: "WE CAN\nREAD", kind: "pig" as QuadKind, x: 0.3, z: 2.6 },
  { text: "NO MORE\nCAGES", kind: "cow" as QuadKind, x: 1.8, z: 0.0 },
];

const c6Protest: ShotFn = (c) => {
  const { width, height } = c;
  const cam = move({ position: [0.5, 3.2, 13.8], target: [0.1, 2.9, 0] }, { position: [0.4, 3.2, 12.6], target: [0.1, 2.9, 0] }, c);
  const signs = SIGNS.map((s, i) => {
    const scale = s.kind === "cow" ? 0.9 : 1.25;
    const bob = Math.sin(c.t * 5 + i * 2) * 0.08;
    const paw = quadPaw(s.kind, { rear: 1, arms: [1.4, 1.4], position: [s.x, 0, s.z], scale }, 1);
    const board: V3 = [paw[0], paw[1] + 1.0 + bob, paw[2] + 0.06];
    return { ...s, scale, board, bob };
  });
  return (
    <Shot
      mood="dawn"
      camera={cam}
      fog={[40, 160]}
      stars={false}
      overlay={signs.map((s, i) => (
        <Pinned key={i} at={s.board} cam={cam} width={width} height={height} rotate={Math.sin(c.t * 5 + i * 2) * 2}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 38, color: "#C8372D", textAlign: "center", lineHeight: 1.0, whiteSpace: "pre" }}>{s.text}</div>
        </Pinned>
      ))}
    >
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[200, 0.1, 200]} />
        <meshLambertMaterial color="#566270" flatShading />
      </mesh>
      <Capitol position={[0, 0, -34]} scale={0.9} />
      {signs.map((s, i) => (
        <React.Fragment key={i}>
          <Quadruped kind={s.kind} position={[s.x, 0, s.z]} scale={s.scale} rear={1} arms={[1.4, 1.4]} face={{ brow: "angry", eyeOpen: 0.85, mouth: Math.sin(c.t * 9 + i) > 0.3 ? 0.7 : 0.1 }} />
          <Placard position={s.board} />
        </React.Fragment>
      ))}
    </Shot>
  );
};

const PEACE_DOG: V3 = [-0.9, 0, 1.0];

const c6Peace: ShotFn = (c) => {
  const cam = move({ position: [0.3, 2.9, 9.4], target: [0.1, 2.2, 0] }, { position: [0.3, 2.8, 8.4], target: [0.1, 2.25, 0] }, c);
  const paw = quadPaw("dog", { rear: 1, arms: [0.9, 0.5], position: PEACE_DOG, yaw: 0.45, scale: 1.35 }, 1);
  const pose = mergePose(REST, { expression: "relief", headYaw: -0.4, headPitch: -0.2, lShoulder: [0.2, 0.15], rShoulder: [0.2, 0.15] });
  return (
    <Shot mood="dawn" camera={cam} fog={[30, 140]} stars={false}>
      <StreetSet seed="peace" cars={false} />
      <Hero pose={pose} position={[1.1, 0, -0.6]} yaw={-0.45} />
      <Quadruped kind="dog" position={PEACE_DOG} yaw={0.45} scale={1.35} rear={1} arms={[0.9, 0.5]} face={{ eyeOpen: 0.9, look: [0.15, 0.2], mouth: 0.3 }} wag={c.t * 3} />
      <WhiteFlag position={[paw[0], paw[1] - 0.1, paw[2] + 0.05]} rotation={[0, 0.45, -0.15]} t={c.t} />
    </Shot>
  );
};

const c6Revenge: ShotFn = (c) => {
  const cam = move({ position: [0, 0.9, 11.8], target: [0, 2.0, 0] }, { position: [0, 0.85, 10.8], target: [0, 2.05, 0] }, c);
  const face: Face = { brow: "angry", eyeOpen: 0.55 };
  return (
    <Shot mood="night" dust={1} camera={cam} fog={[15, 70]} shake={0.025} keyDir={[0, 0.4, -1]}>
      <mesh position={[0, -0.6, -1]} scale={[14, 1.6, 6]} receiveShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshLambertMaterial color="#3A2E2A" flatShading />
      </mesh>
      <pointLight position={[0, 4, -6]} color="#FF6A2A" intensity={60} distance={20} decay={2} />
      <SmokeCluster position={[-4, 0.5, -8]} progress={0.6} radius={3} count={8} />
      <SmokeCluster position={[5, 0.5, -9]} progress={0.5} radius={3} count={8} seed="s2" />
      <group position={[0, 0.85, 0]}>
        <Quadruped kind="cow" position={[-2.4, 0, -0.6]} yaw={0.2} scale={1.0} face={face} />
        <Quadruped kind="pig" position={[0, 0, 0.2]} scale={1.2} rear={1} arms={[0.3, 0.3]} face={face} />
        <Quadruped kind="dog" position={[2.3, 0, -0.4]} yaw={-0.25} scale={1.15} face={face} />
        <Bird kind="chicken" position={[-0.9, 0, 1.2]} scale={0.8} face={face} />
        <Bird kind="crow" position={[1.1, 0, 1.3]} scale={0.8} face={face} />
      </group>
    </Shot>
  );
};

// ---------------------------------------------------------------- 07 the smartest species

/** Seats along the meeting table (top y = 0.81): x, z, yaw. Slavoski sits at the near end. */
const SEATS: [number, number, number][] = [
  [-1.9, -3.4, Math.PI / 2],
  [-1.9, -1.4, Math.PI / 2],
  [-1.9, 0.6, Math.PI / 2],
  [1.9, -3.4, -Math.PI / 2],
  [1.9, -1.4, -Math.PI / 2],
  [1.9, 0.6, -Math.PI / 2],
];

const Board: React.FC<{ cam: CameraSpec }> = ({ cam }) => {
  const { width, height } = useSize();
  return (
    <Pinned at={[0, 3.6, -5.95]} cam={cam} width={width} height={height}>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, color: "#2A5AA8", whiteSpace: "pre", lineHeight: 1.3, textAlign: "center" }}>
        {"E = mc²   ∫ f(x) dx\nPLAN: TAKE OVER\nSTEP 1: ???"}
      </div>
    </Pinned>
  );
};

const MeetingCast: React.FC<{ t: number; lookAtHero: number }> = ({ t, lookAtHero }) => {
  const turn = (yaw: number) => lookAtHero * (yaw > 0 ? -1 : 1) * 0.9;
  return (
    <>
      {SEATS.map(([x, z, yaw], i) => (
        <Chair key={i} position={[x, 0, z]} yaw={yaw} seatY={0.55} />
      ))}
      <Chimp position={[-1.9, 0.55 - 0.78 + 0.05, -3.4]} yaw={Math.PI / 2} scale={0.9} arms={[0.9, 0.9]} elbows={[0.9, 0.9]} headYaw={turn(1) * 1.2} face={{ eyeOpen: 1, brow: "flat" }} />
      <Quadruped kind="pig" position={[-1.9, 0.55, -1.4]} yaw={Math.PI / 2} scale={1.1} sit headYaw={-turn(1)} face={{ eyeOpen: 1, brow: "smug" }} />
      <Octopus position={[-1.9, 0.55, 0.6]} yaw={Math.PI / 2} scale={0.9} t={t} face={{ eyeOpen: 0.9, brow: "flat", look: [lookAtHero * 0.3, 0] }} />
      <Quadruped kind="dog" position={[1.9, 0.55, -3.4]} yaw={-Math.PI / 2} scale={1.1} sit headYaw={turn(-1)} face={{ eyeOpen: 1, brow: "flat" }} />
      <Bird kind="crow" position={[1.9, 0.55, -1.4]} yaw={-Math.PI / 2} scale={1.0} headYaw={turn(-1) * 1.2} face={{ eyeOpen: 0.8, brow: "angry" }} />
      <Quadruped kind="cat" position={[1.9, 0.55, 0.6]} yaw={-Math.PI / 2} scale={1.2} sit headYaw={turn(-1)} face={{ eyeOpen: 0.5, brow: "smug" }} />
    </>
  );
};

const HERO_TABLE: V3 = [0, 0, 3.4];

const tablePose = (over: Partial<Pose> = {}) => mergePose(REST, { lShoulder: [0.9, 0.1], rShoulder: [0.9, 0.1], lElbow: 0.9, rElbow: 0.9, ...over });

const c7Meeting: ShotFn = (c) => {
  const cam = move({ position: [4.0, 6.6, 9.4], target: [0, 1.9, -2.0] }, { position: [3.6, 6.3, 8.6], target: [0, 1.9, -2.0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.7} shadowSize={12} overlay={<Board cam={cam} />}>
      <MeetingRoom />
      <MeetingCast t={c.t} lookAtHero={0} />
      <Hero pose={tablePose({ expression: "neutral", headPitch: -0.1 })} position={HERO_TABLE} yaw={Math.PI} />
    </Shot>
  );
};

const c7Stare: ShotFn = (c) => {
  const cam = move({ position: [0.2, 4.4, -2.6], target: [0, 3.6, 3.4] }, { position: [0.15, 4.3, -1.6], target: [0, 3.65, 3.4] }, c);
  const look = k01(c.lt, 0.1, 0.35);
  const sweat = Math.sin(c.lt * 10) * 0.03;
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.7} shadowSize={12}>
      <MeetingRoom />
      <MeetingCast t={c.t} lookAtHero={look} />
      <Hero pose={tablePose({ expression: "worried", headYaw: sweat, headPitch: 0.02 })} position={HERO_TABLE} yaw={Math.PI} />
    </Shot>
  );
};

/** The cat on the bed, sitting on the blanket just past Slavoski's knees, facing him. */
const CAT_BED: V3 = [BED.x, BED.blanketTop, -0.55];

const c7CatWalk: ShotFn = (c) => {
  const cam = move({ position: [7.4, 4.0, 3.6], target: [2.0, 2.4, -1.2] }, { position: [6.8, 3.9, 3.0], target: [2.0, 2.4, -1.2] }, c);
  const k = clamp01(c.lt / 0.9);
  const z = 1.0 - k * (1.0 - CAT_BED[2]);
  const pose = bedPose({ expression: "worried", headPitch: -0.3 * k, lShoulder: [0.6, 0.1], rShoulder: [0.6, 0.1], lElbow: 1.2, rElbow: 1.2 });
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.45} shadowSize={10}>
      <Bedroom lampOn />
      <Hero pose={pose} position={BED_HERO} />
      <Quadruped kind="cat" position={[CAT_BED[0], CAT_BED[1], z]} yaw={Math.PI} scale={1.2} walk={k < 1 ? c.lt * 2.6 : 0} sit={k >= 1} face={{ eyeOpen: 0.7, brow: "flat" }} />
    </Shot>
  );
};

const c7CatEyes: ShotFn = (c) => {
  const cam = move({ position: [2.3, 3.5, -2.3], target: [CAT_BED[0], CAT_BED[1] + 1.1, CAT_BED[2]] }, { position: [2.3, 3.35, -1.95], target: [CAT_BED[0], CAT_BED[1] + 1.1, CAT_BED[2]] }, c);
  const narrow = k01(c.lt, 0.2, 0.6);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.45} shadowSize={10}>
      <Bedroom lampOn />
      <Quadruped kind="cat" position={CAT_BED} yaw={Math.PI} scale={1.2} sit headPitch={0.35} face={{ eyeOpen: 1 - narrow * 0.5, brow: narrow > 0.5 ? "angry" : "flat", look: [0, 0.25] }} />
    </Shot>
  );
};

const CatTalk: React.FC<{ c: ShotCtx; cam: CameraSpec; heroPose: Pose }> = ({ c, cam, heroPose }) => (
  <Shot mood="night" camera={cam} fog={false} stars={false} light={0.45} shadowSize={10}>
    <Bedroom lampOn />
    <Hero pose={heroPose} position={BED_HERO} />
    <Quadruped kind="cat" position={CAT_BED} yaw={Math.PI} scale={1.2} sit headPitch={0.3} face={{ eyeOpen: 0.55, brow: "smug", look: [0, 0.25], mouth: talk(c.words, c.t, 54) }} />
  </Shot>
);

const c7Right: ShotFn = (c) => {
  const pose = bedPose({ expression: "alarm", headPitch: -0.3, lShoulder: [0.45, 0.4], rShoulder: [0.45, 0.4] });
  const cam = move({ position: [4.8, 4.5, -3.0], target: [CAT_BED[0], CAT_BED[1] + 1.0, CAT_BED[2]] }, { position: [4.6, 4.4, -2.7], target: [CAT_BED[0], CAT_BED[1] + 1.0, CAT_BED[2]] }, c);
  return <CatTalk c={c} cam={cam} heroPose={pose} />;
};

const c7Horror: ShotFn = (c) => {
  const pose = bedPose({ expression: "alarm", headPitch: -0.15, lShoulder: [0.9, 0.5], rShoulder: [0.9, 0.5], lElbow: 1.6, rElbow: 1.6 });
  const head = headPosition(pose, BED_HERO);
  const cam = move({ position: [head[0] + 0.3, head[1] - 0.1, head[2] + 3.1], target: [head[0], head[1] - 0.2, head[2]] }, { position: [head[0] + 0.25, head[1] - 0.1, head[2] + 2.6], target: [head[0], head[1] - 0.2, head[2]] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.45} shadowSize={10} shake={0.015}>
      <Bedroom lampOn />
      <Hero pose={pose} position={BED_HERO} />
    </Shot>
  );
};

const c7Neuter: ShotFn = (c) => {
  const pose = bedPose({ expression: "alarm", headPitch: -0.3 });
  const cam = move({ position: [3.3, 3.05, -2.5], target: [CAT_BED[0], CAT_BED[1] + 1.05, CAT_BED[2]] }, { position: [3.1, 3.0, -2.15], target: [CAT_BED[0], CAT_BED[1] + 1.05, CAT_BED[2]] }, c);
  return <CatTalk c={c} cam={cam} heroPose={pose} />;
};

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldEarth },
    { cue: "smart as", fn: coldDog },
  ],
  c1: [
    { cue: null, fn: c1Wake },
    { cue: "pigeon", fn: c1Window },
    { cue: "Then it picks", fn: c1Pick },
    { cue: "and writes", fn: c1Write },
  ],
  c2: [
    { cue: null, fn: c2Stare },
    { cue: "dogs understand", fn: c2Dog },
    { cue: "Cats realise", fn: c2Cat },
    { cue: "and an octopus", fn: c2Octo },
    { cue: "already planning", fn: c2Lid },
  ],
  c3: [
    { cue: null, fn: c3Yard },
    { cue: "chimpanzees", fn: c3Plan },
    { cue: "Crows", fn: c3Wire },
    { cue: "terrifyingly", fn: c3Stare },
  ],
  c4: [
    { cue: null, fn: c4Farm },
    { cue: "billions", fn: c4Sea },
    { cue: "understand exactly", fn: c4Realise },
    { cue: "and they're not", fn: c4Angry },
    { cue: "Cows escape", fn: c4Cows },
    { cue: "Pigs open", fn: c4Pig },
    { cue: "Chickens plan", fn: c4Plan },
    { cue: "mass breakouts", fn: c4Breakout },
  ],
  c5: [
    { cue: null, fn: c5Grate },
    { cue: "Billions of them", fn: c5Eyes },
    { cue: "and now they", fn: c5Lever },
    { cue: "electricity", fn: c5Blackout },
  ],
  c6: [
    { cue: null, fn: c6Capitol },
    { cue: "governments", fn: c6Chamber },
    { cue: "Should animals", fn: c6Protest },
    { cue: "Some might", fn: c6Peace },
    { cue: "Others want", fn: c6Revenge },
  ],
  c7: [
    { cue: null, fn: c7Meeting },
    { cue: "smartest species", fn: c7Stare },
    { cue: "and your cat", fn: c7CatWalk },
    { cue: "dead in the", fn: c7CatEyes },
    { cue: "Right", fn: c7Right },
    { cue: "about that", fn: c7Horror },
    { cue: "neutering", fn: c7Neuter },
  ],
};
