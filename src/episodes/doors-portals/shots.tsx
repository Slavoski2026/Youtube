/**
 * Shots for "What If Every Door Became a Portal?" (ep. 8).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * The hook opens on a clock in a London hallway flipping to 9:00, not on Earth from space.
 * Time zones drive the light: London 9 AM rain, New York 4 AM, Tokyo 6 PM, Washington 4 AM.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import * as THREE from "three";
import { FONT } from "../../slavoski/fonts";
import { isBloom } from "../../slavoski/quality";
import { crowdLook, POLICE_OFFICER, SLAVOSKI, suitLook, type HeroLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Clouds, Rain, Snow } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { CardLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import { DOOR, DoorFrame, DoorLeaf, LightPool, Portal, PortalRim, SkyDome } from "../../slavoski/portal";
import { groundedBob, handPosition, Hero, mergePose, reach, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { CANVAS_FONT, CanvasPanel } from "../../slavoski/screens";
import { FacetedEarth } from "../../slavoski/space";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import { type CuedShot } from "../../slavoski/timeline";
import { BoxG, CylG, ConeG, IcoG } from "../../slavoski/detail";
import { Quadruped } from "../../slavoski/critters";
import { Barn } from "../smart-animals/props";
import { Mountain, SnowPine } from "../satellites-dark/props";
import {
  Aisles,
  Airport,
  AlpineLab,
  BEDROOM,
  Blizzard,
  CELL,
  CellBlock,
  CellInterior,
  Corridor,
  CORR,
  DoorLab,
  DoorSwarm,
  FRIDGE,
  fridgeFront,
  HALL,
  Hallway,
  HOSP,
  Hospital,
  HUT,
  Kitchen,
  LABDOOR,
  LabCorridor,
  Linked,
  MilitaryBase,
  NeonStreet,
  OvalRoom,
  ovalDoor,
  Plaza,
  RIG,
  SandGust,
  TERRACE,
  TerraceHouse,
  TerraceStreet,
  UnluckyBedroom,
  WhiteMansion,
} from "./sets";
import { BeachWorld, DesertWorld, Drone, Gull, JungleWorld, Motes, NightCityWorld, OceanWorld, PeekingEyes, Penguin, rotY, SnowWorld, SpaceWorld, Visitor, type AltKind } from "./worlds";

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

/** World position of a point on a DoorLeaf (hinged on its left edge) at `open`. */
const leafPoint = (door: V3, yaw: number, open: number, toward: boolean, local: V3, w = DOOR.w): V3 => {
  const a = clamp01(open) * 1.75 * (toward ? 1 : -1);
  const p = new THREE.Vector3(w / 2 + local[0], local[1], local[2]).applyAxisAngle(new THREE.Vector3(0, 1, 0), -a);
  p.x -= w / 2;
  p.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  return [door[0] + p.x, door[1] + p.y, door[2] + p.z];
};
const HANDLE: V3 = [DOOR.w / 2 - 0.24, -0.05, DOOR.leaf / 2 + 0.2];

/** A pose that reaches the right hand to `target` while `k` > 0 (blends back to `base` as k falls). */
const reachR = (base: Pose, target: V3, position: V3, yaw: number) => reach(base, "r", target, { position, yaw }).pose;

const heroAt = (p: V3, yaw: number, local: V3): V3 => {
  const r = rotY(local, yaw);
  return [p[0] + r[0], p[1] + r[1], p[2] + r[2]];
};

/** Arms up in alarm (roll-raised V), leaning back a touch. */
const alarmPose = (k: number, over: Partial<Pose> = {}): Pose =>
  mergePose(REST, { lShoulder: [0.3, 0.12 + 1.9 * k], rShoulder: [0.3, 0.12 + 1.9 * k], lElbow: 0.3 + 0.6 * k, rElbow: 0.3 + 0.6 * k, lean: -0.12 * k, expression: k > 0.3 ? "alarm" : "neutral", ...over });

/** Arms wrapped around the chest (cold). */
const huddlePose = (over: Partial<Pose> = {}): Pose => mergePose(REST, { lShoulder: [1.0, -0.35], rShoulder: [1.0, -0.35], lElbow: 1.9, rElbow: 1.9, headPitch: -0.1, expression: "worried", ...over });

/** Sitting on the ground, knees up. */
const groundSit = (over: Partial<Pose> = {}): Pose => {
  const p = mergePose(REST, { lHip: [1.35, 0.18], rHip: [1.35, 0.18], lKnee: 2.2, rKnee: 2.2, lShoulder: [0.7, 0.1], rShoulder: [0.7, 0.1], lElbow: 0.9, rElbow: 0.9, lean: 0.25, ...over });
  return { ...p, bob: -1.1 };
};

const NY_WOMAN: HeroLook = { ...crowdLook(12), hairStyle: "long", hair: "#3A2418", jacket: "#C46A8A", jacketShade: "#A85A74", zipper: "#F2E2EA", jeans: "#7A6AA8", shoe: "#F2EEE4" };
const SHOPPER: HeroLook = suitLook(5);
const BRIEFCASE_MAN: HeroLook = { ...suitLook(9), jacket: "#4A3A2E", jacketShade: "#3A2E24" };
const doctor = (i: number): HeroLook => ({ ...crowdLook(20 + i), jacket: "#3E8E8A", jacketShade: "#327470", zipper: "#3E8E8A", jeans: "#3E8E8A", shoe: "#F2F4F6", hat: { kind: "surgical", color: "#3E8E8A" } });
const GUARD: HeroLook = { ...crowdLook(31), jacket: "#8A7A54", jacketShade: "#706244", zipper: "#C9A44A", jeans: "#3A3A30", shoe: "#141418", hat: { kind: "cap", color: "#5A5038" } };
const PRISONER: HeroLook = { ...crowdLook(33), jacket: "#9AA0A8", jacketShade: "#80868E", zipper: "#C8372D", jeans: "#9AA0A8", shoe: "#F2F2EE", hairStyle: "bald" };
const scientist = (i: number, over: Partial<HeroLook> = {}): HeroLook => ({ ...crowdLook(40 + i), jacket: "#F2F4F6", jacketShade: "#D8DCE2", zipper: "#C9D0D8", coat: "#EEF0F2", ...over });
const SWISS: HeroLook = scientist(0, { hair: "#B8B8B8", glasses: "#9FD4F4" });
const TOURIST_SLAV: HeroLook = { ...SLAVOSKI, hat: { kind: "sun", color: "#E8D8A8" }, glasses: "#15151C" };
const TOURISTS: HeroLook[] = [
  { ...crowdLook(51), jacket: "#E84A8A", jacketShade: "#C83A74", zipper: "#F2C43D", jeans: "#E8D8A8", hat: { kind: "sun", color: "#F2E6C8" } },
  { ...crowdLook(52), jacket: "#2AB0A0", jacketShade: "#22908A", zipper: "#F2EEE4", jeans: "#F2EEE4", hairStyle: "bun", glasses: "#15151C" },
  { ...crowdLook(53), jacket: "#F2C43D", jacketShade: "#D8A82A", zipper: "#E84A8A", jeans: "#2E6AB8", hat: { kind: "cap", color: "#C8372D" } },
];
const soldier = (i: number): HeroLook => ({ ...crowdLook(60 + i), jacket: "#5A6A3A", jacketShade: "#4A5830", zipper: "#5A6A3A", jeans: "#4A5A30", shoe: "#2A2418", hat: { kind: "cap", color: "#4A5A30" } });
const PILOT: HeroLook = { ...suitLook(70), hat: { kind: "cap", color: "#1A2238" }, zipper: "#C9A44A" };
const UNLUCKY: HeroLook = { ...crowdLook(80), jacket: "#7A9AD0", jacketShade: "#6A88BC", zipper: "#F2F2EE", jeans: "#7A9AD0", shoe: "#C58B62" };

/** A wire shopping basket (held at the hand, base below it). */
const Basket: React.FC<{ hand: V3; yaw?: number }> = ({ hand, yaw = 0 }) => (
  <group position={[hand[0], hand[1] - 0.6, hand[2]]} rotation={[0, yaw, 0]}>
    <mesh castShadow>
      <BoxG args={[1.1, 0.6, 0.7]} />
      <Flat color="#C8372D" />
    </mesh>
    {[
      ["#F2C43D", -0.25],
      ["#6AC87A", 0.2],
    ].map(([c, x]) => (
      <mesh key={x as number} position={[x as number, 0.38, 0]}>
        <BoxG args={[0.32, 0.36, 0.3]} />
        <Flat color={c as string} />
      </mesh>
    ))}
    <mesh position={[0, 0.48, 0]}>
      <BoxG args={[0.06, 0.4, 0.06]} />
      <Flat color="#2A2A30" />
    </mesh>
  </group>
);

/** Sweat drops / drips falling from around a point. */
const Drips: React.FC<{ at: V3; t: number; count?: number; spread?: number; color?: string; fall?: number }> = ({ at, t, count = 10, spread = 0.7, color = "#8FC8F4", fall = 3 }) => (
  <group>
    {Array.from({ length: count }, (_, i) => {
      const k = ((random(`dr${i}`) + t * (0.9 + random(`drs${i}`) * 0.6)) % 1 + 1) % 1;
      return (
        <mesh key={i} position={[at[0] + (random(`drx${i}`) - 0.5) * spread, at[1] - k * fall, at[2] + (random(`drz${i}`) - 0.5) * spread]} scale={[1, 1.6, 1]}>
          <IcoG args={[0.05, 0]} />
          <Glow color={color} opacity={1 - k * 0.6} />
        </mesh>
      );
    })}
  </group>
);

/** A splash: white-blue drops bursting up and out, plus a spreading foam ring (p 0..1). */
const Splash: React.FC<{ at: V3; p: number; size?: number; seed?: string }> = ({ at, p, size = 1, seed = "spl" }) => {
  if (p <= 0 || p >= 1) return null;
  return (
    <group position={at} scale={size}>
      {Array.from({ length: 34 }, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const v = 2 + random(`${seed}v${i}`) * 4;
        const up = 4 + random(`${seed}u${i}`) * 6;
        const tt = p * 1.2;
        return (
          <mesh key={i} position={[Math.cos(a) * v * tt, Math.max(0, up * tt - 9 * tt * tt), Math.sin(a) * v * tt]}>
            <IcoG args={[0.12 + random(`${seed}s${i}`) * 0.18, 0]} />
            <Glow color={i % 3 ? "#EAF6FF" : "#9FD4F4"} opacity={1 - p} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[p * 3.5, p * 3.5 + 0.6, 32]} />
        <Glow color="#F2FAFF" opacity={0.8 * (1 - p)} />
      </mesh>
    </group>
  );
};

/** A farm field world (the cow's side of the door). */
const FarmWorld: React.FC<{ at: V3; yaw?: number; t: number }> = ({ at, yaw = 0 }) => (
  <>
    <SkyDome position={at} radius={400} zenith="#4A8FD6" horizon="#D8ECF4" ground="#5A8A4A" />
    <group position={at} rotation={[0, yaw, 0]}>
      <mesh position={[0, -0.06, -40]} receiveShadow>
        <BoxG args={[200, 0.12, 90]} />
        <Flat color="#6AA050" />
      </mesh>
      <Barn position={[-14, 0, -30]} yaw={0.4} />
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[-20 + i * 4, 1.2, -14]}>
          <BoxG args={[0.3, 2.4, 0.3]} />
          <Flat color="#E8E2D4" />
        </mesh>
      ))}
      <mesh position={[2, 1.8, -14]}>
        <BoxG args={[48, 0.25, 0.2]} />
        <Flat color="#E8E2D4" />
      </mesh>
      {[
        [-40, -90, 30],
        [20, -110, 40],
        [70, -80, 26],
      ].map(([x, z, r], i) => (
        <mesh key={`h${i}`} position={[x, -r * 0.6, z]}>
          <IcoG args={[r, 1]} />
          <Flat color="#4F8F4A" />
        </mesh>
      ))}
    </group>
  </>
);

/** The visitor's world: violet sky, twin suns, glowing crystal spires. */
const AlienWorld: React.FC<{ at: V3; yaw?: number; t: number }> = ({ at, yaw = 0, t }) => (
  <>
    <SkyDome position={at} radius={400} zenith="#1A0630" horizon="#C04AB0" ground="#2A0E3A" sun={{ dir: rotY([0.35, 0.25, -1], yaw), color: "#FFE0FF", size: 1.4 }} />
    <group position={at} rotation={[0, yaw, 0]}>
      <mesh position={[-90, 70, -320]}>
        <circleGeometry args={[9, 20]} />
        <meshBasicMaterial color="#9AF0FF" fog={false} toneMapped={false} />
      </mesh>
      <Halo position={[-90, 70, -318]} size={120} color="#7CF7FF" opacity={0.4} />
      <mesh position={[0, -0.06, -60]} receiveShadow>
        <BoxG args={[300, 0.12, 140]} />
        <Flat color="#2E1240" />
      </mesh>
      {Array.from({ length: 22 }, (_, i) => {
        const x = (random(`ax${i}`) - 0.5) * 120;
        const z = -10 - random(`az${i}`) * 110;
        if (Math.abs(x) < 6 && z > -20) return null;
        const h = 8 + random(`ah${i}`) * 26;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, h / 2, 0]}>
              <ConeG args={[1.4 + random(`ar${i}`) * 2, h, 5]} />
              <Flat color="#3A1A5A" />
            </mesh>
            <mesh position={[0, h * 0.72, 0]}>
              <ConeG args={[0.6, h * 0.5, 5]} />
              <Glow color={i % 2 ? "#7CF7FF" : "#FF7AE0"} />
            </mesh>
          </group>
        );
      })}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={`r${i}`} position={[(random(`rx${i}`) - 0.5) * 80, 18 + random(`ry${i}`) * 20 + Math.sin(t * 0.6 + i) * 1.2, -40 - random(`rz${i}`) * 60]}>
          <IcoG args={[2 + random(`rs${i}`) * 3, 0]} />
          <Flat color="#4A2A6A" />
        </mesh>
      ))}
    </group>
  </>
);

const CLOUD = { day: "#F4F6FA", sunset: "#F7C0A0", overcast: "#AEB6C2", snow: "#DCE3EC" } as const;

// ================================================================ cold open: 9:00

/** The clock in Slavoski's hallway flips 8:59 → 9:00; warm light starts leaking from the door beside it. */
const coldClock: ShotFn = (c) => {
  const flip = c.lt > 0.78;
  const cam = move({ position: [2.22, 3.7, 4.5], target: [2.15, 3.6, 0.42] }, { position: [2.18, 3.66, 3.9], target: [2.15, 3.6, 0.42] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={false} light={0.55} shadowSize={8} shake={flip && c.lt < 1.0 ? 0.012 : 0}>
      <Hallway t={c.t} clockText={flip ? "9:00" : "8:59"} clockFlash={flip && c.lt < 0.98} seams={k01(c.lt, 0.82, 1.05)} />
    </Shot>
  );
};

/** The bathroom door blazing at the seams, the handle rattling. */
const coldDoor: ShotFn = (c) => {
  const cam = move({ position: [0.9, 3.3, 11.8], target: [0, 2.5, 0] }, { position: [0.6, 3.1, 9.6], target: [0, 2.45, 0] }, c);
  const pulse = 0.82 + Math.sin(c.t * 19) * 0.18;
  return (
    <Shot mood="overcast" camera={cam} fog={false} light={0.5} shadowSize={14} shake={0.035}>
      <Hallway t={c.t} clockText="9:00" seams={pulse} doorOpen={Math.abs(Math.sin(c.t * 31)) * 0.012} handle={Math.abs(Math.sin(c.t * 17))} />
    </Shot>
  );
};

/** Every front door on a rainy terraced street lights up, in a wave. */
const STREET_COLS = ["#FFD08A", "#7FD8FF", "#B88AFF", "#7FFFA0", "#FF8AC0", "#FFB25A"];
const coldStreet: ShotFn = (c) => {
  const cam = move({ position: [-66, 22, 3], target: [10, 3, -1.5] }, { position: [-58, 20, 2], target: [12, 3, -1.5] }, c);
  const wave = (row: number, i: number) => k01(c.lt, 0.05 + i * 0.09 + row * 0.05, 0.25 + i * 0.09 + row * 0.05);
  return (
    <Shot mood="overcast" camera={cam} fog={[70, 260]} light={0.7} shadowSize={60}>
      <TerraceStreet t={c.t} glow={wave} open={(row, i) => ((i + row) % 3 === 1 ? wave(row, i) * 0.8 : 0)} color={(row, i) => STREET_COLS[(i * 2 + row) % STREET_COLS.length]} />
      <Clouds t={c.t} color={CLOUD.overcast} y={40} radius={180} seed="lnd" />
    </Shot>
  );
};

/** One front door bursts open by itself: a jungle on the other side. */
const BURST_DOOR: V3 = [TERRACE.door.x, TERRACE.door.y + DOOR.h / 2, 0.1];
const coldBurst: ShotFn = (c) => {
  const open = k01(c.lt, 0.12, 0.42);
  const cam = move({ position: [6.6, 3.5, 13.5], target: [3, 3.1, 0] }, { position: [5.2, 3.3, 10.6], target: [3, 3.2, 0] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[30, 160]} light={0.7} shadowSize={20} shake={open > 0 && open < 1 ? 0.04 : 0.01}>
      <TerraceHouse position={[0, 0, 0]} seed="burstA" open={open * 0.95} lit />
      <TerraceHouse position={[-TERRACE.w, 0, 0]} seed="burstB" />
      <TerraceHouse position={[TERRACE.w, 0, 0]} seed="burstC" />
      <mesh position={[0, -0.1, 8]} receiveShadow>
        <BoxG args={[80, 0.2, 18]} />
        <Flat color="#5A5E68" />
      </mesh>
      <Portal id={1} position={BURST_DOOR} w={DOOR.w} h={DOOR.h} open={open * 1.6} sky={["#5FA0C8", "#D8EED0"]} brighten={0.3}>
        <JungleWorld at={[BURST_DOOR[0], TERRACE.door.y, BURST_DOOR[2]]} t={c.t} />
      </Portal>
      <PortalRim position={[BURST_DOOR[0], BURST_DOOR[1], 0.3]} w={DOOR.w} h={DOOR.h} t={c.t} color="#9AFFB0" k={open} seed="burst" />
      <LightPool position={[BURST_DOOR[0], 0.62, 2.6]} w={3} d={4.4} color="#C8FFB0" opacity={0.5 * open} />
      <pointLight position={[BURST_DOOR[0], 3, 2.5]} color="#C8FFB0" intensity={12 * open} distance={12} decay={2} />
      <Rain center={[4, 6, 6]} size={[16, 12, 12]} t={c.t} count={420} seed="brain" thickness={0.03} opacity={0.45} />
    </Shot>
  );
};

/** A hotel corridor: every door bursts open in a wave, each onto a different coloured world. */
const coldCorridor: ShotFn = (c) => {
  const cam = move({ position: [0, 3.4, 3.5], target: [0, 2.9, -60] }, { position: [0.2, 3.3, -5], target: [0, 2.8, -60] }, c);
  const endOpen = k01(c.lt, 0.15, 0.55);
  const endDoor: V3 = [0, DOOR.h / 2, CORR.z1];
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.6} stars={false} shadowSize={20}>
      <Corridor t={c.t} open={(i) => k01(c.lt, 0.05 + i * 0.1, 0.3 + i * 0.1)} endOpen={endOpen * 0.95} />
      <Portal id={1} position={endDoor} w={DOOR.w} h={DOOR.h} open={endOpen * 1.5} sky={["#2E86D8", "#BFE6F4"]} brighten={0.3}>
        <BeachWorld at={[0, 0, CORR.z1]} t={c.t} />
      </Portal>
      <PortalRim position={[0, DOOR.h / 2, CORR.z1 + 0.25]} w={DOOR.w} h={DOOR.h} t={c.t} color="#BFE6FF" k={endOpen} seed="cend" />
      <LightPool position={[0, 0.03, CORR.z1 + 2.4]} w={3} d={4.5} color="#BFE6FF" opacity={0.5 * endOpen} />
    </Shot>
  );
};

// ================================================================ 01 the first doors

/** London: Slavoski shuffles down his hallway toward the bathroom. */
const c1Walk: ShotFn = (c) => {
  const z = 12.4 - c.lt * 2.6;
  const cam = move({ position: [1.7, 4.9, 22.5], target: [0, 2.6, 2] }, { position: [1.4, 4.7, 20.5], target: [0, 2.6, 2] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={false} light={0.55} shadowSize={16}>
      <Hallway t={c.t} clockText="9:00" seams={0.3 + Math.sin(c.t * 9) * 0.08} />
      <Hero pose={walkPose(c.lt * 1.5, 0.8)} position={[0.35, 0, z]} yaw={Math.PI} />
    </Shot>
  );
};

/** He opens the bathroom door: the Sahara, blazing, sand blowing into the hallway. */
const c1Open: ShotFn = (c) => {
  const open = k01(c.lt, 0.2, 0.85) * 0.92;
  const pos: V3 = [0.95, 0, 2.7 + open * 0.8];
  const doorAt: V3 = [0, DOOR.h / 2, 0.1];
  const holding = open < 0.42;
  let pose: Pose = mergePose(REST, { expression: open > 0.5 ? "alarm" : "neutral", headPitch: open > 0.5 ? 0.05 : -0.05, lean: open > 0.5 ? -0.1 : 0 });
  if (holding) pose = reachR(pose, leafPoint(doorAt, 0, open, true, HANDLE), pos, Math.PI);
  else pose = mergePose(pose, { lShoulder: [2.3, 0.4], lElbow: 1.6 });
  const cam = move({ position: [-0.9, 4.9, 13.2], target: [0.1, 2.6, -2] }, { position: [-0.6, 4.7, 11.6], target: [0.1, 2.6, -2] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={false} light={0.55} shadowSize={14} shake={open > 0.4 && open < 0.92 ? 0.02 : 0}>
      <Hallway t={c.t} clockText="9:00" doorOpen={open} seams={open > 0 ? 0 : 0.4} />
      <Portal id={1} position={HALL.door} w={DOOR.w} h={DOOR.h} sky={["#2F7FD8", "#F6DDAE"]} brighten={0.12}>
        <DesertWorld at={[0, 0, 0]} />
      </Portal>
      <Hero pose={pose} position={pos} yaw={Math.PI} />
      {open > 0.05 ? (
        <>
          <PortalRim position={[0, DOOR.h / 2, 0.25]} w={DOOR.w} h={DOOR.h} t={c.t} color="#FFE0A0" k={open} seed="sah" sparks={12} />
          <SandGust position={[0, DOOR.h / 2, 0.3]} w={DOOR.w} h={DOOR.h} t={c.t} reach={9} />
          <LightPool position={[0, 0.03, 2.3]} w={2.8} d={4.4} color="#FFE6B0" opacity={0.55 * open} />
          <pointLight position={[0, 2.6, 1.4]} color="#FFE6B8" intensity={16 * open} distance={12} decay={1.6} />
        </>
      ) : null}
    </Shot>
  );
};

/** The Sahara: his hallway door frame stands in the dunes, and he steps out onto the sand. */
const SAH_DOOR: V3 = [0, DOOR.h / 2, 0];
const SAH_SUN: V3 = rotY([-0.25, 0.55, -1], 0);
const SaharaDoor: React.FC<{ t: number; hero?: { pos: V3; pose: Pose; yaw?: number; look?: HeroLook }; inside?: boolean }> = ({ t, hero, inside = true }) => (
  <>
    <DesertWorld at={[0, 0, 0]} />
    <DoorFrame position={SAH_DOOR} />
    {inside ? (
      <Portal id={1} position={SAH_DOOR} w={DOOR.w} h={DOOR.h} sky={["#E8E2D4", "#E8E2D4"]}>
        <Linked to={{ pos: SAH_DOOR }} from={{ pos: HALL.door }}>
          <Hallway t={t} clockText="9:00" doorOpen={0.92} />
        </Linked>
        {hero ? <Hero pose={hero.pose} position={hero.pos} yaw={hero.yaw ?? 0} look={hero.look} /> : null}
      </Portal>
    ) : null}
    {hero ? <Hero pose={hero.pose} position={hero.pos} yaw={hero.yaw ?? 0} look={hero.look} /> : null}
  </>
);

const c1Step: ShotFn = (c) => {
  const z = -2.4 + k01(c.lt, 0, 1.25) * 5.0;
  const pose = mergePose(walkPose(c.lt * 1.3, z < 2.4 ? 0.9 : 0), { expression: "awe", headPitch: 0.1, headYaw: Math.sin(c.lt * 2) * 0.2 });
  const cam = move({ position: [2.2, 2.9, 10.8], target: [0, 2.6, 0] }, { position: [1.7, 2.7, 9.0], target: [0, 2.6, 0] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} keyDir={SAH_SUN} shadowSize={14} light={0.78}>
      <SaharaDoor t={c.t} hero={{ pos: [0.15, 0, z], pose }} />
    </Shot>
  );
};

/** Aerial: a tiny door in an ocean of dunes, Slavoski beside it. */
const c1Aerial: ShotFn = (c) => {
  const cam = move({ position: [-24, 26, 34], target: [0, 1, 0] }, { position: [-26, 36, 36], target: [0, 1, 0] }, c);
  const pose = mergePose(REST, { expression: "alarm", headYaw: Math.sin(c.lt * 2.4) * 0.6, headPitch: 0.15 });
  return (
    <Shot mood="day" camera={cam} fog={false} keyDir={[-0.7, 0.45, -0.5]} shadowSize={30} light={0.72}>
      <SaharaDoor t={c.t} hero={{ pos: [1.6, 0, 3.0], pose, yaw: -0.4 }} />
    </Shot>
  );
};

/** New York, 4 AM: a woman pads into her dark kitchen. */
const c1Kitchen: ShotFn = (c) => {
  const z = 10.0 - k01(c.lt, 0, 1.7) * 4.0;
  const cam = move({ position: [0.2, 6.6, 19.5], target: [2.4, 2.6, 1.5] }, { position: [0.6, 6.2, 17.4], target: [2.4, 2.6, 1.5] }, c);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      light={0.45}
      stars={false}
      shadowSize={14}
      overlay={<CardLine text="NEW YORK" sub="4:00 AM" y={300} appearFrame={startFrame(c) + 4} />}
    >
      <Kitchen t={c.t} />
      <Hero pose={walkPose(c.lt * 1.1, z > 6.1 ? 0.6 : 0)} position={[3.15, 0, z]} yaw={Math.PI} look={NY_WOMAN} />
    </Shot>
  );
};

/** She opens the fridge: Antarctica, a blizzard, and a penguin right there. */
const FRIDGE_P = fridgeFront();
const FRIDGE_LEAF: V3 = [FRIDGE.x, 0.3 + FRIDGE.opening.h / 2, 0.15 + FRIDGE.d / 2 + FRIDGE.d / 2 + 0.07];
const c1Fridge: ShotFn = (c) => {
  const open = k01(c.lt, 0.12, 0.6) * 0.85;
  const pos: V3 = [3.15, 0, 4.3 + open * 0.6];
  const holding = open < 0.4;
  let pose: Pose = mergePose(REST, { expression: open > 0.4 ? "alarm" : "neutral" });
  if (holding) pose = reachR(pose, leafPoint(FRIDGE_LEAF, 0, open, true, [FRIDGE.w / 2 - 0.16, 0, 0.32], FRIDGE.w), pos, Math.PI);
  else pose = alarmPose(k01(c.lt, 0.6, 0.9), { expression: "alarm" });
  const cam = move({ position: [0.2, 6.0, 14.2], target: [2.5, 2.5, 0] }, { position: [0.6, 5.6, 12.6], target: [2.5, 2.5, 0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.45} stars={false} shadowSize={14} shake={open > 0.3 && open < 0.85 ? 0.02 : 0}>
      <Kitchen t={c.t} fridgeOpen={open} />
      <Portal id={1} position={FRIDGE_P} w={FRIDGE.opening.w} h={FRIDGE.opening.h} sky={["#8FA6C4", "#E6EDF5"]} brighten={0.35}>
        <SnowWorld at={[FRIDGE.x, 0, FRIDGE_P[2]]} t={c.t} />
        <Penguin position={[FRIDGE.x, 0, FRIDGE_P[2] - 1.6]} scale={1.25} t={c.t} tilt={Math.sin(c.t * 2) * 0.2} />
      </Portal>
      <Hero pose={pose} position={pos} yaw={Math.PI} look={NY_WOMAN} />
      {open > 0.1 ? (
        <>
          <Blizzard position={[FRIDGE.x, FRIDGE_P[1], FRIDGE_P[2] + 0.1]} w={FRIDGE.opening.w} h={FRIDGE.opening.h} t={c.t} reach={7} />
          <pointLight position={[FRIDGE.x, 2.6, FRIDGE_P[2] + 1.4]} color="#CFE8FF" intensity={14 * open} distance={12} decay={1.6} />
          <LightPool position={[FRIDGE.x, 0.03, FRIDGE_P[2] + 2.2]} w={2.4} d={4} color="#CFE8FF" opacity={0.5 * open} />
        </>
      ) : null}
    </Shot>
  );
};

/** Antarctica: the fridge-shaped doorway on the ice, her face in it, a penguin staring back. */
const ANT_DOOR: V3 = [0, FRIDGE.opening.h / 2, 0];
const AntarcticFridge: React.FC<{ t: number; face?: "alarm" | "awe" | "worried" }> = ({ t, face = "alarm" }) => (
  <>
    <SnowWorld at={[0, 0, 0]} t={t} />
    <DoorFrame position={ANT_DOOR} w={FRIDGE.opening.w} h={FRIDGE.opening.h} color="#E6EAEE" frame={0.18} />
    <Portal id={1} position={ANT_DOOR} w={FRIDGE.opening.w} h={FRIDGE.opening.h} sky={["#2A2A32", "#2A2A32"]}>
      <Linked to={{ pos: ANT_DOOR }} from={{ pos: FRIDGE_P }}>
        <Kitchen t={t} fridgeOpen={0.85} />
        <Hero pose={mergePose(REST, { expression: face, lean: 0.32, headPitch: -0.05, lShoulder: [0.9, 0.1], rShoulder: [0.9, 0.1], lElbow: 0.6, rElbow: 0.6 })} position={[FRIDGE.x, 0, 3.4]} yaw={Math.PI} look={NY_WOMAN} />
      </Linked>
    </Portal>
    <PortalRim position={[ANT_DOOR[0], ANT_DOOR[1], 0.2]} w={FRIDGE.opening.w} h={FRIDGE.opening.h} t={t} color="#FFE6B8" k={0.6} sparks={8} seed="antr" />
  </>
);
const c1Antarctica: ShotFn = (c) => {
  const cam = move({ position: [5.6, 3.0, 7.2], target: [0, 2.1, 0.6] }, { position: [5.0, 2.9, 6.2], target: [0, 2.1, 0.6] }, c);
  return (
    <Shot mood="snow" camera={cam} fog={[30, 260]} shadowSize={12}>
      <AntarcticFridge t={c.t} />
      <Penguin position={[0.35, 0, 2.4]} yaw={Math.PI + 0.15} scale={1.2} t={c.t} tilt={Math.sin(c.t * 1.6) * 0.25} />
      <Penguin position={[-3.4, 0, -1.8]} yaw={0.6} scale={1.05} t={c.t + 3} waddle={c.t * 1.4} />
    </Shot>
  );
};

/** Close-up: the penguin tilts its head at the visitor in the fridge. */
const c1Penguin: ShotFn = (c) => {
  const cam = move({ position: [-0.4, 3.1, -2.4], target: [0.35, 2.45, 2.6] }, { position: [-0.25, 3.0, -1.5], target: [0.35, 2.5, 2.6] }, c);
  return (
    <Shot mood="snow" camera={cam} fog={[20, 220]} shadowSize={8}>
      <SnowWorld at={[0, 0, 0]} t={c.t} />
      <Penguin position={[0.35, 0, 2.6]} yaw={Math.PI} scale={1.2} t={c.t} tilt={0.35 * Math.sin(c.lt * 2.6)} face={{ eyeOpen: 1.2 }} />
      <Penguin position={[-2.2, 0, 7]} yaw={Math.PI + 0.4} scale={1.0} t={c.t + 1.3} waddle={c.t} />
      <Snow center={[0, 4, 3]} size={[10, 8, 8]} t={c.t} count={160} seed="pcu" speed={2.4} />
    </Shot>
  );
};

// ================================================================ 02 chaos

/** London from above: doors flaring all along the street, sand, snow and a cow pouring out, people running. */
const RUNNERS: { x: number; z: number; d: number }[] = [
  { x: -24, z: -8.5, d: 1 },
  { x: -8, z: 8.6, d: -1 },
  { x: 6, z: -9, d: 1 },
  { x: 16, z: 9.2, d: -1 },
  { x: -15, z: 9, d: 1 },
  { x: 27, z: -8.8, d: -1 },
];
const c2Chaos: ShotFn = (c) => {
  const cam = move({ position: [-50, 15, 5], target: [10, 2, -2] }, { position: [-44, 14, 4], target: [12, 2, -2] }, c);
  const doorX = (row: number, i: number) => (row === 0 ? -35.5 + TERRACE.w * i : 35.5 - TERRACE.w * i);
  return (
    <Shot mood="overcast" camera={cam} fog={[60, 240]} light={0.75} shadowSize={50}>
      <TerraceStreet t={c.t} rain={false} glow={(row, i) => ((i + row * 2) % 2 === 0 ? 1 : 0)} open={(row, i) => ((i + row * 2) % 2 === 0 ? 0.85 : 0)} color={(row, i) => STREET_COLS[(i + row * 3) % STREET_COLS.length]} />
      <SandGust position={[doorX(0, 2), 2.95, -11.6]} w={DOOR.w} h={DOOR.h} t={c.t} reach={10} />
      <Blizzard position={[doorX(0, 4), 2.95, -11.6]} w={DOOR.w} h={DOOR.h} t={c.t} reach={10} />
      <Blizzard position={[doorX(1, 2), 2.95, 11.6]} yaw={Math.PI} w={DOOR.w} h={DOOR.h} t={c.t} reach={8} color="#9FD4F4" seed="water" />
      <Quadruped kind="cow" position={[doorX(1, 4), 0.24, 9.6 - c.lt * 1.2]} yaw={Math.PI} walk={c.lt * 1.2} />
      {RUNNERS.map((r, i) => (
        <Hero key={i} pose={mergePose(walkPose(c.lt * 2.4 + i * 0.3, 1.2), { expression: "alarm" })} position={[r.x + r.d * c.lt * 5, 0.24, r.z]} yaw={(r.d * Math.PI) / 2} look={crowdLook(100 + i)} />
      ))}
    </Shot>
  );
};

/** Street level: a cow walks out of somebody's front door. */
const COW_DOOR: V3 = [TERRACE.door.x, TERRACE.door.y + DOOR.h / 2, 0.1];
const c2Cow: ShotFn = (c) => {
  const z = -2.2 + k01(c.lt, 0, 1.2) * 5.4;
  const y = z < 1.4 ? 0.6 : z < 2.2 ? 0.3 : 0;
  const cow = (inner: boolean) => <Quadruped key={inner ? "ci" : "co"} kind="cow" position={[COW_DOOR[0], y, z]} walk={c.lt * 1.6} face={{ mouth: c.lt > 0.6 ? 0.6 : 0 }} />;
  const cam = move({ position: [-7.5, 3.5, 17.5], target: [2.4, 2.5, 1] }, { position: [-6.4, 3.3, 15.4], target: [2.6, 2.5, 1] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[30, 160]} light={0.75} shadowSize={16}>
      <TerraceHouse position={[0, 0, 0]} seed="cowA" open={0.92} />
      <TerraceHouse position={[-TERRACE.w, 0, 0]} seed="cowB" />
      <TerraceHouse position={[TERRACE.w, 0, 0]} seed="cowC" />
      <mesh position={[0, -0.1, 8]} receiveShadow>
        <BoxG args={[80, 0.2, 18]} />
        <Flat color="#6A6E78" />
      </mesh>
      <Portal id={1} position={COW_DOOR} w={DOOR.w} h={DOOR.h} sky={["#4A8FD6", "#D8ECF4"]} brighten={0.25}>
        <FarmWorld at={[COW_DOOR[0], TERRACE.door.y, COW_DOOR[2]]} t={c.t} />
        {cow(true)}
      </Portal>
      {cow(false)}
      <Hero pose={alarmPose(k01(c.lt, 0.3, 0.7))} position={[6.8, 0, 5.4]} yaw={-0.95} look={crowdLook(7)} />
    </Shot>
  );
};

/** A commuter opens his front door and steps straight into a jungle. */
const c2Front: ShotFn = (c) => {
  const open = k01(c.lt, 0.05, 0.6) * 0.92;
  const walk = k01(c.lt, 0.7, 2.1);
  const pos: V3 = [0.55, 0, 3.0 - walk * 5.0];
  let pose: Pose = mergePose(walk > 0 ? walkPose(c.lt * 1.4, 0.9) : REST, { expression: walk > 0 ? "awe" : "neutral" });
  if (open < 0.4) pose = reachR(pose, leafPoint([0, DOOR.h / 2, 0.1], 0, open, true, HANDLE), pos, Math.PI);
  const cam = move({ position: [-1.0, 4.9, 15.4], target: [0, 2.6, -3] }, { position: [-0.7, 4.7, 13.0], target: [0, 2.6, -3] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={false} light={0.55} shadowSize={14}>
      <Hallway t={c.t} clockText="9:06" doorOpen={open} doorColor="#2F6A4A" wall="#8A7A9A" />
      <Portal id={1} position={HALL.door} w={DOOR.w} h={DOOR.h} sky={["#5FA0C8", "#D8EED0"]} brighten={0.35}>
        <JungleWorld at={[0, 0, 0]} t={c.t} />
        <Hero pose={pose} position={pos} yaw={Math.PI} look={BRIEFCASE_MAN} />
      </Portal>
      <Hero pose={pose} position={pos} yaw={Math.PI} look={BRIEFCASE_MAN} />
      <PortalRim position={[0, DOOR.h / 2, 0.25]} w={DOOR.w} h={DOOR.h} t={c.t} color="#B0FFB8" k={open} seed="jun" sparks={10} />
      <LightPool position={[0, 0.03, 2.3]} w={2.8} d={4.4} color="#D8FFC8" opacity={0.45 * open} />
      <pointLight position={[0, 2.6, 1.4]} color="#D8FFC8" intensity={12 * open} distance={12} decay={1.6} />
    </Shot>
  );
};

/** The globe: arcs flying from one city to random points thousands of kilometres away. */
const ARC_FROM = new THREE.Vector3(0.15, 0.58, 0.8).normalize();
const ARCS = Array.from({ length: 14 }, (_, i) => {
  const u = random(`arcu${i}`) * 1.6 - 0.6;
  const th = random(`arct${i}`) * Math.PI * 1.6 - Math.PI * 0.8;
  const r = Math.sqrt(1 - u * u);
  return { to: new THREE.Vector3(r * Math.sin(th), u, r * Math.cos(th)).normalize(), delay: i * 0.09 };
});
const arcCurve = (to: THREE.Vector3, R: number, k: number) => {
  const pts: THREE.Vector3[] = [];
  const ang = ARC_FROM.angleTo(to);
  const n = 24;
  for (let s = 0; s <= n; s++) {
    const f = (s / n) * k;
    const dir = ARC_FROM.clone().lerp(to, f).normalize();
    pts.push(dir.multiplyScalar(R + Math.sin(Math.PI * f) * ang * 0.9 + 0.04));
  }
  return new THREE.CatmullRomCurve3(pts);
};
const c2Globe: ShotFn = (c) => {
  const cam = move({ position: [2.5, 4.5, 22], target: [0, 0.4, 0] }, { position: [-1.5, 3.5, 20], target: [0, 0.4, 0] }, c);
  const R = 3;
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.9} keyDir={[0.4, 0.6, 0.8]}>
      <group rotation={[0, c.lt * 0.08, 0]}>
        <FacetedEarth radius={R} seed="doors" />
        <mesh position={ARC_FROM.clone().multiplyScalar(R * 1.01).toArray() as V3}>
          <IcoG args={[0.09, 1]} />
          <Glow color={P.amber} />
        </mesh>
        <Halo position={ARC_FROM.clone().multiplyScalar(R * 1.02).toArray() as V3} size={1.4} color={P.amber} opacity={0.8} />
        {ARCS.map((a, i) => {
          const k = k01(c.lt, a.delay, a.delay + 0.7);
          if (k <= 0.02) return null;
          const curve = arcCurve(a.to, R, k);
          const tip = curve.getPoint(1);
          return (
            <group key={i}>
              <mesh>
                <tubeGeometry args={[curve, 32, 0.035, 5, false]} />
                <Glow color={i % 3 ? P.amber : "#7FD8FF"} />
              </mesh>
              <Halo position={tip.toArray() as V3} size={k >= 1 ? 1.1 : 0.6} color={i % 3 ? P.amber : "#7FD8FF"} opacity={0.9} />
            </group>
          );
        })}
      </group>
    </Shot>
  );
};

/** Tokyo, 6 PM: a shopper with a basket heads into the neon market. */
const MARKET_DOOR: V3 = [11, 2.6, -8];
const c2Tokyo: ShotFn = (c) => {
  const k = k01(c.lt, 0, 2.3);
  const pos: V3 = [2.4 + k * 6.8, 0, 7.5 - k * 14.5];
  const yaw = Math.atan2(MARKET_DOOR[0] - pos[0], MARKET_DOOR[2] - pos[2]);
  const pose = mergePose(walkPose(c.lt * 1.4, 0.9), { lShoulder: [0.1, 0.25], lElbow: 0.2 });
  const cam = move({ position: [-5.5, 4.4, 17], target: [8, 4.4, -6] }, { position: [-4.2, 4.1, 13.6], target: [9, 4.2, -7] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[40, 170]} light={0.6} shadowSize={24}>
      <NeonStreet t={c.t} marketSlide={k01(c.lt, 1.3, 1.9)} />
      <Hero pose={pose} position={pos} yaw={yaw} look={SHOPPER} />
      <Basket hand={handPosition(pose, "l", pos, yaw)} yaw={yaw} />
      {Array.from({ length: 5 }, (_, i) => (
        <Hero key={i} pose={walkPose(c.lt * 1.3 + i * 0.4, 0.8)} position={[-7.5 + (i % 2) * 15.5, 0.24, -10 - i * 7 + c.lt * (i % 2 ? 2 : -2)]} yaw={i % 2 ? 0 : Math.PI} look={crowdLook(140 + i)} />
      ))}
    </Shot>
  );
};

/** …and walks out of a door in a grand oval room in Washington, at 4 AM. Two officials freeze. */
const OD = ovalDoor();
const c2Oval: ShotFn = (c) => {
  const open = k01(c.lt, 0, 0.35) * 0.9;
  const zl = -2.4 + k01(c.lt, 0.15, 1.6) * 5.0;
  const pos = heroAt([OD.pos[0], 0, OD.pos[2]], OD.yaw, [0.25, 0, zl]);
  const pose = mergePose(walkPose(c.lt * 1.3, zl < 2.4 ? 0.85 : 0), { expression: zl > 1.4 ? "awe" : "neutral", lShoulder: [0.1, 0.25], lElbow: 0.2, headYaw: zl > 1.6 ? 0.4 : 0 });
  const cam = move({ position: [1.4, 6.2, 6.2], target: [-8.6, 2.5, -3.6] }, { position: [0.6, 5.8, 5.4], target: [-8.6, 2.5, -3.6] }, c);
  const shopper = (k: string) => (
    <group key={k}>
      <Hero pose={pose} position={pos} yaw={OD.yaw} look={SHOPPER} />
      <Basket hand={handPosition(pose, "l", pos, OD.yaw)} yaw={OD.yaw} />
    </group>
  );
  const look = (p: V3) => Math.atan2(pos[0] - p[0], pos[2] - p[2]);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.6} stars={false} shadowSize={18}>
      <OvalRoom t={c.t} doorOpen={open} />
      <Portal id={1} position={OD.pos} yaw={OD.yaw} w={DOOR.w} h={DOOR.h} sky={["#F4F6F8", "#F4F6F8"]} brighten={0.3}>
        <Aisles at={[OD.pos[0], 0, OD.pos[2]]} yaw={OD.yaw} />
        {shopper("in")}
      </Portal>
      {shopper("out")}
      <PortalRim position={heroAt(OD.pos, OD.yaw, [0, 0, 0.3])} yaw={OD.yaw} w={DOOR.w} h={DOOR.h} t={c.t} color="#FFFFFF" k={open * 0.8} seed="ov" sparks={10} />
      {[
        [-2.6, -2.2],
        [1.8, -2.6],
      ].map(([x, z], i) => (
        <Hero key={i} pose={alarmPose(k01(c.lt, 0.6 + i * 0.15, 1.0 + i * 0.15) * 0.7, { headYaw: 0 })} position={[x, 0, z]} yaw={look([x, 0, z])} look={suitLook(200 + i)} />
      ))}
    </Shot>
  );
};

/** Outside: a generic white mansion at night, one window flashing as the door opens. */
const c2Mansion: ShotFn = (c) => {
  const cam = move({ position: [36, 8, 118], target: [0, 12, 0] }, { position: [31, 7.5, 104], target: [0, 12, 0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[140, 460]} light={0.7} shadowSize={80}>
      <WhiteMansion t={c.t} flash={1 - k01(c.lt, 0.1, 0.9)} />
    </Shot>
  );
};

// ================================================================ 03 stop opening doors (midday)

/** A plaza at noon: the emergency order on the big screen, everyone looking up. */
const c3Screen: ShotFn = (c) => {
  const cam = move({ position: [5, 3.2, 46], target: [0, 17, -29] }, { position: [4, 3.4, 41], target: [0, 18, -29] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[120, 420]} shadowSize={50}>
      <Plaza t={c.t} />
      <Clouds t={c.t} color={CLOUD.day} y={60} radius={220} seed="noon" />
      {Array.from({ length: 16 }, (_, i) => {
        const x = -13 + (i % 8) * 3.6 + (random(`pzx${i}`) - 0.5) * 1.2;
        const z = 4 + Math.floor(i / 8) * 5 + (random(`pzz${i}`) - 0.5) * 2;
        return <Hero key={i} pose={mergePose(REST, { headPitch: 0.5 + random(`ph${i}`) * 0.2, headYaw: (random(`py${i}`) - 0.5) * 0.4, expression: i % 3 ? "worried" : "alarm" })} position={[x, 0, z]} yaw={Math.PI + (random(`pyw${i}`) - 0.5) * 0.5} look={crowdLook(300 + i)} />;
      })}
    </Shot>
  );
};

/** DO NOT OPEN: an officer tapes a front door shut. */
const TAPE_DOOR: V3 = [TERRACE.door.x, TERRACE.door.y + DOOR.h / 2, 0.36];
const drawTape = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#F2C43D";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#1A1A22";
  ctx.font = CANVAS_FONT(H * 0.62);
  ctx.textBaseline = "middle";
  for (let x = 10; x < W; x += H * 7.2) ctx.fillText("DO NOT OPEN", x, H * 0.54);
};
const c3Tape: ShotFn = (c) => {
  const k = k01(c.lt, 0.15, 1.3);
  const len = 5.6;
  const officer: V3 = [5.4, 0.3, 2.3];
  const end: V3 = [TAPE_DOOR[0] + Math.cos(0.92) * (len * k - len / 2), TAPE_DOOR[1] - Math.sin(0.92) * (len * k - len / 2), 0.42];
  const pose = reachR(mergePose(REST, { expression: "worried" }), end, officer, -0.95);
  const cam = move({ position: [0.6, 3.7, 14.5], target: [3.9, 2.9, 0.6] }, { position: [1.0, 3.6, 12.6], target: [4.0, 2.9, 0.6] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[40, 200]} shadowSize={16}>
      <TerraceHouse position={[0, 0, 0]} seed="tapeA" lit={false} />
      <TerraceHouse position={[TERRACE.w, 0, 0]} seed="tapeB" lit={false} />
      <TerraceHouse position={[-TERRACE.w, 0, 0]} seed="tapeC" lit={false} />
      <mesh position={[0, -0.1, 8]} receiveShadow>
        <BoxG args={[80, 0.2, 18]} />
        <Flat color="#8A8E98" />
      </mesh>
      <CanvasPanel position={TAPE_DOOR} rotation={[0, 0, -0.92]} w={len} h={0.42} px={1024} draw={drawTape} />
      <group position={[TAPE_DOOR[0] + Math.cos(0.92) * (len * k - len) / 2, TAPE_DOOR[1] - Math.sin(0.92) * (len * k - len) / 2, 0.4]} rotation={[0, 0, 0.92]}>
        <CanvasPanel position={[0, 0, 0]} w={Math.max(0.01, len * k)} h={0.42} px={1024} draw={drawTape} />
      </group>
      <Hero pose={pose} position={officer} yaw={-0.95} look={POLICE_OFFICER} />
    </Shot>
  );
};

/** Meanwhile in the Sahara: Slavoski, still holding his toothbrush, wilting in the sun. */
const c3Problem: ShotFn = (c) => {
  const pos: V3 = [0.9, 0, 2.2];
  const pose = mergePose(REST, { expression: "worried", headPitch: 0.05, headYaw: -0.15, lShoulder: [2.2, 0.55], lElbow: 2.1, rShoulder: [0.15, 0.15] });
  const cam = move({ position: [1.8, 4.0, 10.6], target: [0.5, 3.2, 0] }, { position: [1.6, 3.9, 9.2], target: [0.5, 3.25, 0] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} keyDir={[0.4, 0.8, 0.5]} shadowSize={12}>
      <SaharaDoor t={c.t} inside={false} />
      <Hero pose={pose} position={pos} yaw={0.1} />
      <mesh position={handPosition(pose, "r", pos, 0.1)} rotation={[0, 0, 0.2]}>
        <BoxG args={[0.08, 0.9, 0.08]} />
        <Flat color="#2AA6A0" />
      </mesh>
      <Drips at={[pos[0] + 0.2, 4.6, pos[2] + 0.5]} t={c.t} count={8} spread={1.1} fall={1.6} />
    </Shot>
  );
};

/** The hospital: surgeons crack open the operating theatre doors… and a blizzard blows out. */
const HOSP_DOOR: V3 = [0, HOSP.doorH / 2, HOSP.endZ + 0.2];
const c3Hospital: ShotFn = (c) => {
  const open = 0.05 + k01(c.lt, 0.35, 0.9) * 0.24;
  const blow = k01(c.lt, 0.45, 0.8);
  const cam = move({ position: [2.6, 4.4, 7.5], target: [0, 2.6, -22] }, { position: [2.2, 4.2, 4.8], target: [0, 2.6, -22] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={false} light={0.8} shadowSize={16}>
      <Hospital open={open} glow={1} t={c.t} />
      <Portal id={1} position={HOSP_DOOR} w={HOSP.doorW} h={HOSP.doorH} sky={["#8FA6C4", "#E6EDF5"]} brighten={0.35}>
        <SnowWorld at={[0, 0, HOSP_DOOR[2]]} t={c.t} />
      </Portal>
      {blow > 0 ? <Blizzard position={[0, HOSP_DOOR[1], HOSP_DOOR[2] + 0.4]} w={HOSP.doorW * 0.7} h={HOSP.doorH} t={c.t} reach={12} count={220} /> : null}
      <Hero pose={alarmPose(blow * 0.8, { lean: -0.2 * blow })} position={[-1.7, 0, HOSP.endZ + 2.4 + blow * 0.6]} yaw={Math.PI} look={doctor(0)} />
      <Hero pose={alarmPose(blow, { lean: -0.25 * blow })} position={[1.9, 0, HOSP.endZ + 2.8 + blow * 0.8]} yaw={Math.PI + 0.25} look={doctor(1)} />
      <Hero pose={mergePose(REST, { expression: blow > 0.3 ? "alarm" : "worried", headYaw: -0.3 })} position={[-3.4, 0, -6]} yaw={Math.PI - 0.6} look={doctor(2)} />
      <group position={[3.0, 2.25, -8]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <Hero pose={mergePose(REST, { expression: "worried" })} position={[0, -2.1, 0.3]} look={crowdLook(23)} />
      </group>
      <mesh position={[3.0, 2.5, -9]} castShadow>
        <BoxG args={[1.9, 0.5, 3.2]} />
        <Flat color="#BFE3E0" />
      </mesh>
      <pointLight position={[0, 3, HOSP.endZ + 2]} color="#DCEEFF" intensity={18 * blow} distance={16} decay={1.6} />
    </Shot>
  );
};

/** The cell block: a guard opens a cell door, and tropical light floods the corridor. */
const CELL_DOOR: V3 = [CELL.x, DOOR.h / 2, CELL.doorZ];
const c3Cell: ShotFn = (c) => {
  const open = k01(c.lt, 0, 0.5) * 0.9;
  const cam = move({ position: [-2.8, 4.6, 8.4], target: [3.0, 2.6, -6.4] }, { position: [-2.4, 4.4, 7.0], target: [3.0, 2.6, -6.4] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={false} light={0.7} shadowSize={14}>
      <CellBlock open={open} t={c.t} />
      <Portal id={1} position={CELL_DOOR} yaw={-Math.PI / 2} w={DOOR.w} h={DOOR.h} sky={["#2E86D8", "#BFE6F4"]} brighten={0.35}>
        <BeachWorld at={[CELL.x, 0, CELL.doorZ]} yaw={-Math.PI / 2} t={c.t} />
      </Portal>
      <LightPool position={[CELL.x - 2.2, 0.03, CELL.doorZ]} yaw={-Math.PI / 2} w={2.6} d={4.4} color="#FFF2C8" opacity={0.55 * open} />
      <pointLight position={[CELL.x - 1.4, 2.6, CELL.doorZ]} color="#FFF2C8" intensity={16 * open} distance={12} decay={1.6} />
      <Hero pose={alarmPose(k01(c.lt, 0.3, 0.6) * 0.6)} position={[0.9, 0, -9.2]} yaw={1.15} look={GUARD} />
    </Shot>
  );
};

/** …and the prisoner steps out of his cell onto a tropical beach. */
const BEACH_DOOR: V3 = [0, DOOR.h / 2, 0];
const c3Beach: ShotFn = (c) => {
  const z = -2.2 + k01(c.lt, 0, 1.2) * 4.8;
  const pose = mergePose(walkPose(c.lt * 1.3, z < 2.4 ? 0.85 : 0), { expression: z > 1.2 ? "smile" : "awe", headPitch: 0.08 });
  const hero = (k: string) => <Hero key={k} pose={pose} position={[0.1, 0, z]} look={PRISONER} />;
  const cam = move({ position: [2.8, 3.0, 10.5], target: [0, 2.6, 0] }, { position: [2.3, 2.9, 8.8], target: [0, 2.6, 0] }, c);
  const sun = rotY([0.4, 0.5, -1], 0);
  return (
    <Shot mood="day" camera={cam} fog={false} keyDir={sun} shadowSize={14}>
      <BeachWorld at={[0, 0, 0]} t={c.t} />
      <DoorFrame position={BEACH_DOOR} color="#6A6E74" />
      <Portal id={1} position={BEACH_DOOR} w={DOOR.w} h={DOOR.h} sky={["#5A5E66", "#5A5E66"]}>
        <CellInterior />
        <Hero pose={alarmPose(0.5)} position={[-1.2, 0, -4.6]} look={GUARD} />
        {hero("in")}
      </Portal>
      {hero("out")}
    </Shot>
  );
};

/** Stranded: people in pyjamas, aprons and bathrobes on the Antarctic ice, penguins among them. */
const CROWD: { p: V3; yaw: number; look: HeroLook }[] = [
  { p: [-2, 0, 3], yaw: 0.3, look: { ...crowdLook(401), jacket: "#E8E2D4", jacketShade: "#D0C8B8", zipper: "#E8E2D4", jeans: "#2A2A30", hat: { kind: "beanie", color: "#F2F2EE" } } },
  { p: [1.5, 0, 4.2], yaw: -0.4, look: { ...crowdLook(402), jacket: "#C46A8A", jacketShade: "#A85A74", jeans: "#C46A8A", hairStyle: "long" } },
  { p: [4.6, 0, 1.0], yaw: -0.9, look: crowdLook(403) },
  { p: [-5.2, 0, 0.2], yaw: 0.7, look: { ...crowdLook(404), jacket: "#2E86D8", jacketShade: "#2470B8", jeans: "#F2C43D", glasses: "#2A2A30" } },
  { p: [-0.6, 0, -1.8], yaw: 0.1, look: suitLook(405) },
  { p: [3.2, 0, -2.6], yaw: -0.3, look: { ...crowdLook(406), hairStyle: "bun" } },
  { p: [-3.8, 0, -4.0], yaw: 0.5, look: crowdLook(407) },
  { p: [6.6, 0, -4.4], yaw: -0.7, look: { ...crowdLook(408), hairStyle: "long" } },
];
const c3Crowd: ShotFn = (c) => {
  const cam = move({ position: [-12, 6.6, 24], target: [1, 2.2, -2] }, { position: [-10, 6.2, 20], target: [1, 2.2, -2] }, c);
  return (
    <Shot mood="snow" camera={cam} fog={[40, 260]} shadowSize={26}>
      <SnowWorld at={[0, 0, -8]} t={c.t} />
      {CROWD.map((m, i) => (
        <Hero key={i} pose={huddlePose({ headYaw: Math.sin(c.t * 0.8 + i) * 0.3, bob: Math.abs(Math.sin(c.t * 12 + i)) * 0.03 })} position={m.p} yaw={m.yaw} look={m.look} />
      ))}
      {[
        [2.8, 0, 5.4, 2.6],
        [-1.6, 0, 6.6, 3.4],
        [-7, 0, 3.2, 0.9],
        [7.4, 0, 2.6, -1.8],
        [0.6, 0, -5.4, 0.2],
      ].map(([x, y, z, yw], i) => (
        <Penguin key={`p${i}`} position={[x, y, z]} yaw={yw} t={c.t + i} waddle={c.t * (0.8 + i * 0.1)} tilt={Math.sin(c.t + i) * 0.2} />
      ))}
      {[
        [-9, -9, 0.6, "#FFD08A"],
        [10, -10, -0.5, "#7FD8FF"],
        [1, -16, 0.1, "#FF8AC0"],
      ].map(([x, z, yw, col], i) => (
        <group key={`d${i}`}>
          <DoorFrame position={[x as number, DOOR.h / 2, z as number]} yaw={yw as number} />
          <mesh position={[x as number, DOOR.h / 2, z as number]} rotation={[0, yw as number, 0]}>
            <planeGeometry args={[DOOR.w, DOOR.h]} />
            <Glow color={col as string} />
          </mesh>
          <PortalRim position={[x as number, DOOR.h / 2, z as number]} yaw={yw as number} w={DOOR.w} h={DOOR.h} t={c.t} color={col as string} k={0.8} sparks={10} seed={`cr${i}`} />
        </group>
      ))}
    </Shot>
  );
};

/** Split screen: three people, three continents (Sahara, Antarctica, Washington). */
const PANEL_H = 610;
const Panel: React.FC<{ top: number; label: string; children: React.ReactNode }> = ({ top, label, children }) => (
  <div style={{ position: "absolute", left: 0, top, width: 1080, height: PANEL_H, overflow: "hidden" }}>
    {children}
    <div style={{ position: "absolute", left: 40, bottom: 26, fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: "0.18em", color: P.amber, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>{label}</div>
  </div>
);
const c3Split: ShotFn = (c) => {
  const size = { width: 1080, height: PANEL_H };
  const lt = c.lt;
  return (
    <AbsoluteFill style={{ background: "#0B0B14" }}>
      <Panel top={30} label="SAHARA">
        <Stage size={size} mood="day" camera={{ position: [6 - lt * 0.4, 3.2, 10], target: [0.6, 2.2, 0], fov: 34 }} fog={false} keyDir={SAH_SUN} shadowSize={12}>
          <SaharaDoor t={c.t} inside={false} />
          <Hero pose={groundSit({ expression: "worried", headPitch: -0.1 })} position={[1.6, 0, 1.8]} yaw={-0.3} />
        </Stage>
      </Panel>
      <Panel top={30 + PANEL_H + 20} label="ANTARCTICA">
        <Stage size={size} mood="snow" camera={{ position: [4.5 - lt * 0.4, 3.2, 9.5], target: [0, 2.2, 1], fov: 34 }} fog={[30, 220]} shadowSize={12}>
          <SnowWorld at={[0, 0, -2]} t={c.t} />
          <Hero pose={huddlePose({ expression: "worried" })} position={[-0.8, 0, 2]} yaw={0.4} look={NY_WOMAN} />
          <Penguin position={[1.6, 0, 2.6]} yaw={-0.7} scale={1.15} t={c.t} tilt={Math.sin(c.t * 1.4) * 0.3} />
        </Stage>
      </Panel>
      <Panel top={30 + (PANEL_H + 20) * 2} label="WASHINGTON">
        <Stage size={size} mood="night" camera={{ position: [0.4 + lt * 0.4, 4.4, 6.6], target: [0, 2.8, -2], fov: 40 }} fog={false} light={0.6} stars={false} shadowSize={14}>
          <OvalRoom t={c.t} />
          <Hero pose={mergePose(REST, { expression: "worried", lShoulder: [0.1, 0.25], lElbow: 0.2 })} position={[0, 0, 0.4]} look={SHOPPER} />
          <Basket hand={handPosition(mergePose(REST, { lShoulder: [0.1, 0.25], lElbow: 0.2 }), "l", [0, 0, 0.4], 0)} />
          <Hero pose={mergePose(REST, { expression: "neutral", headYaw: 0.4 })} position={[-3.2, 0, -1.4]} yaw={0.5} look={suitLook(200)} />
          <Hero pose={mergePose(REST, { expression: "neutral", headYaw: -0.4 })} position={[3.0, 0, -1.6]} yaw={-0.5} look={suitLook(201)} />
        </Stage>
      </Panel>
    </AbsoluteFill>
  );
};

// ================================================================ 04 free travel (day two)

const RIG_FLOOR: V3 = [RIG.door[0], RIG.door[1] - DOOR.h / 2, RIG.door[2]];
const LAB_TEAM: { p: V3; yaw: number; look: HeroLook }[] = [
  { p: [-2.7, 0, 3.0], yaw: Math.PI - 0.6, look: scientist(1, { glasses: "#9FD4F4" }) },
  { p: [3.0, 0, 2.6], yaw: Math.PI + 0.6, look: scientist(2, { hairStyle: "bun" }) },
  { p: [9.2, 0, 3.6], yaw: Math.PI + 0.9, look: scientist(3) },
];
const RigWorld: React.FC<{ kind: number; t: number }> = ({ kind, t }) => {
  const at = RIG_FLOOR;
  switch (kind % 5) {
    case 0:
      return <DesertWorld at={at} />;
    case 1:
      return <SnowWorld at={at} t={t} />;
    case 2:
      return <JungleWorld at={at} t={t} />;
    case 3:
      return <NightCityWorld at={at} />;
    default:
      return <BeachWorld at={at} t={t} />;
  }
};
const RIG_SKY: [string, string][] = [
  ["#2F7FD8", "#F6DDAE"],
  ["#8FA6C4", "#E6EDF5"],
  ["#5FA0C8", "#D8EED0"],
  ["#0B0E2A", "#5A2E6A"],
  ["#2E86D8", "#BFE6F4"],
];

const c4Lab: ShotFn = (c) => {
  const cam = move({ position: [7.5, 6.6, 23], target: [0, 3.6, -2] }, { position: [6.2, 6.2, 19.5], target: [0, 3.6, -2] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} light={0.85} shadowSize={24}>
      <DoorLab t={c.t} open={0.9} />
      <Portal id={1} position={RIG.door} w={DOOR.w} h={DOOR.h} sky={RIG_SKY[0]} brighten={0.35}>
        <RigWorld kind={0} t={c.t} />
      </Portal>
      <PortalRim position={[RIG.door[0], RIG.door[1], RIG.door[2] + 0.3]} w={DOOR.w} h={DOOR.h} t={c.t} color="#FFE0A0" k={0.8} seed="lab" />
      {LAB_TEAM.map((m, i) => (
        <Hero key={i} pose={mergePose(REST, { expression: "awe", headPitch: 0.05 })} position={m.p} yaw={m.yaw} look={m.look} />
      ))}
    </Shot>
  );
};

/** A scientist's face in the desert light from the door. */
const c4Awe: ShotFn = (c) => {
  const m = LAB_TEAM[0];
  const head: V3 = [m.p[0], 4.5, m.p[2]];
  const cam = move({ position: [0.8, 4.2, -1.3], target: [head[0] + 0.2, head[1] - 0.8, head[2]] }, { position: [0.5, 4.15, -0.9], target: [head[0] + 0.2, head[1] - 0.8, head[2]] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} light={0.8} shadowSize={10}>
      <DoorLab t={c.t} open={0.9} />
      <Hero pose={mergePose(REST, { expression: "awe", headPitch: 0.06, blink: c.lt > 1.0 && c.lt < 1.1 ? 1 : 0 })} position={m.p} yaw={m.yaw} look={m.look} />
      <pointLight position={[0, 3.6, -1.0]} color="#FFE0A8" intensity={18} distance={10} decay={1.6} />
    </Shot>
  );
};

/** The test door opening again and again: somewhere new every time. */
const CYCLE = ["SAHARA", "GREENLAND", "AMAZON", "SEOUL", "FIJI"];
const c4Cycle: ShotFn = (c) => {
  const per = 0.62;
  const i = Math.min(CYCLE.length - 1, Math.floor(c.lt / per));
  const ph = c.lt - i * per;
  const open = i === CYCLE.length - 1 ? k01(ph, 0.04, 0.16) : k01(ph, 0.04, 0.16) * (1 - k01(ph, 0.46, 0.6));
  const cam = move({ position: [0.3, 3.8, 9.2], target: [0, 3.4, -2] }, { position: [0.2, 3.7, 7.6], target: [0, 3.4, -2] }, c);
  const label = (
    <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", fontFamily: FONT, color: P.white }}>
      <div style={{ fontSize: 26, letterSpacing: "0.2em", opacity: 0.7 }}>OPENING #{i + 1}</div>
      <div style={{ marginTop: 8, fontWeight: 700, fontSize: 64, letterSpacing: "0.06em", color: P.amber, textShadow: "0 4px 18px rgba(0,0,0,0.5)" }}>{CYCLE[i]}</div>
    </div>
  );
  return (
    <Shot mood="day" camera={cam} fog={false} light={0.85} shadowSize={14} overlay={open > 0.3 ? label : null}>
      <DoorLab t={c.t} open={open * 0.9} />
      <Portal id={1} position={RIG.door} w={DOOR.w} h={DOOR.h} sky={RIG_SKY[i]} brighten={0.35}>
        <RigWorld kind={i} t={c.t} />
      </Portal>
      {open > 0.05 ? <PortalRim position={[RIG.door[0], RIG.door[1], RIG.door[2] + 0.3]} w={DOOR.w} h={DOOR.h} t={c.t} color={RIG_SKY[i][1]} k={open} seed={`cy${i}`} /> : null}
    </Shot>
  );
};

/** Day-two tourism: Slavoski, sun hat on, steps out of the desert onto a beach at golden hour. */
const GOLD_SUN = rotY([0.55, 0.14, -1], 0);
const c4Tourist: ShotFn = (c) => {
  const z = -2.2 + k01(c.lt, 0, 1.3) * 5.0;
  const arrived = z > 2.4;
  const pose = arrived ? mergePose(REST, { expression: "smile", lShoulder: [0.3, 2.2], rShoulder: [0.3, 2.2], lElbow: 0.4, rElbow: 0.4 }) : mergePose(walkPose(c.lt * 1.3, 0.9), { expression: "smile" });
  const hero = (k: string) => <Hero key={k} pose={pose} position={[0.1, 0, z]} look={TOURIST_SLAV} />;
  const cam = move({ position: [3.2, 3.4, 15.0], target: [0, 2.7, 0] }, { position: [2.6, 3.2, 12.8], target: [0, 2.7, 0] }, c);
  const freeAt = 2.4;
  return (
    <Shot
      mood="sunset"
      camera={cam}
      fog={false}
      keyDir={GOLD_SUN}
      shadowSize={14}
      overlay={c.lt > freeAt ? <CardLine text="AIRFARE: £0.00" sub="TRAVEL BY DOOR" y={300} appearFrame={startFrame(c) + Math.round(freeAt * 30)} /> : null}
    >
      <BeachWorld at={[0, 0, 0]} t={c.t} sky={["#2E3560", "#F49A5C"]} sun={GOLD_SUN} sunColor="#FFC27A" />
      <DoorFrame position={SAH_DOOR} />
      <Portal id={1} position={SAH_DOOR} w={DOOR.w} h={DOOR.h} sky={["#2F7FD8", "#F6DDAE"]} brighten={0.3}>
        <DesertWorld at={[0, 0, 0]} />
        {hero("in")}
      </Portal>
      {hero("out")}
    </Shot>
  );
};

/** Airlines: an empty terminal, every flight cancelled, one pilot with nothing to fly. */
const c4Airport: ShotFn = (c) => {
  const pose = mergePose(REST, { lHip: [1.5, 0.1], rHip: [1.5, 0.1], lKnee: 1.5, rKnee: 1.5, lean: 0.35, headPitch: -0.35, lShoulder: [0.6, 0.1], rShoulder: [0.6, 0.1], lElbow: 1.2, rElbow: 1.2, expression: "worried" });
  const sat = { ...pose, bob: groundedBob(pose) };
  const seatTop = 1.55 + sat.bob - 0.2;
  const pos: V3 = [-2.85, 0, 11.4];
  const cam = move({ position: [-2.6, 5.8, 31], target: [-2.0, 7.2, -4] }, { position: [-2.4, 5.6, 28], target: [-2.0, 7.4, -4] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[60, 260]} light={0.9} shadowSize={24}>
      <Airport t={c.t} />
      <mesh position={[pos[0], seatTop - 0.12, pos[2] - 0.1]} castShadow>
        <BoxG args={[1.7, 0.24, 1.6]} />
        <Flat color="#C8372D" />
      </mesh>
      <Hero pose={sat} position={pos} look={PILOT} />
      <mesh position={[pos[0] + 1.6, 1.0, pos[2] + 0.4]} castShadow>
        <BoxG args={[1.0, 2.0, 0.5]} />
        <Flat color="#2A2E3A" />
      </mesh>
    </Shot>
  );
};

/** Tourists in sun hats wander out of a hut on a military base; the soldiers freeze. */
const c4Base: ShotFn = (c) => {
  const open = k01(c.lt, 0.05, 0.4) * 0.92;
  const tour = TOURISTS.map((look, i) => {
    const zl = -2.4 + k01(c.lt, 0.15 + i * 0.4, 1.5 + i * 0.4) * 5.6;
    const side = [-1, 1, 0.2][i];
    const x = zl > 1 ? (zl - 1) * side * 0.7 : 0;
    return { look, pos: [x, 0, HUT.door[2] + zl] as V3, walking: zl < 3.2, scale: i === 2 ? 0.7 : 1, i };
  });
  const people = (k: string) =>
    tour.map((p) => (
      <Hero key={`${k}${p.i}`} pose={mergePose(p.walking ? walkPose(c.lt * 1.4 + p.i * 0.3, 0.8) : REST, { expression: p.walking ? "smile" : "awe", headYaw: p.walking ? 0 : 0.5 })} position={p.pos} scale={p.scale} look={p.look} />
    ));
  const cam = move({ position: [12.5, 4.4, 24], target: [0, 3, 3] }, { position: [10.5, 4.1, 20], target: [0, 3, 3.5] }, c);
  const soldiers: V3[] = [
    [-6.4, 0, 10.5],
    [6.8, 0, 10],
  ];
  return (
    <Shot mood="day" camera={cam} fog={[80, 400]} shadowSize={30} keyDir={[0.5, 0.9, 0.6]}>
      <MilitaryBase t={c.t} hutOpen={open} />
      <Clouds t={c.t} color={CLOUD.day} y={55} radius={240} seed="base" />
      <Portal id={1} position={HUT.door} w={DOOR.w} h={DOOR.h} sky={["#2E86D8", "#BFE6F4"]} brighten={0.3}>
        <BeachWorld at={[0, 0, HUT.door[2]]} t={c.t} />
        {people("in")}
      </Portal>
      {people("out")}
      {soldiers.map((p, i) => (
        <Hero key={i} pose={alarmPose(k01(c.lt, 1.0 + i * 0.2, 1.4 + i * 0.2) * 0.5, { headYaw: 0 })} position={p} yaw={Math.atan2(0 - p[0], 5 - p[2])} look={soldier(i)} />
      ))}
    </Shot>
  );
};

// ================================================================ 05 seventeen times

/** A soaking-wet man in pyjamas, staring at sixteen tally marks on his bedroom wall. */
const c5Wet: ShotFn = (c) => {
  const pos: V3 = [2.8, 0, 7.4];
  const cam = move({ position: [-3.0, 4.8, 13.6], target: [5.6, 3.2, 5.0] }, { position: [-2.4, 4.6, 12.4], target: [5.6, 3.2, 5.0] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} light={0.8} shadowSize={14}>
      <UnluckyBedroom tally={16} t={c.t} />
      <Hero pose={mergePose(REST, { expression: "worried", headPitch: 0.05, blink: 0.3 })} position={pos} yaw={Math.PI / 2 + 0.45} look={UNLUCKY} />
      <Drips at={[pos[0], 3.4, pos[2]]} t={c.t} count={14} spread={1.4} fall={3.3} />
    </Shot>
  );
};

/** He opens his bedroom door: the open ocean, again. */
const c5Open: ShotFn = (c) => {
  const open = k01(c.lt, 0.08, 0.5) * 0.9;
  const pos: V3 = [0.95, 0, 2.7];
  let pose: Pose = mergePose(REST, { expression: "worried", blink: 0.35 });
  if (open < 0.4) pose = reachR(pose, leafPoint([0, DOOR.h / 2, 0.12], 0, open, true, HANDLE), pos, Math.PI);
  const cam = move({ position: [-0.9, 6.0, 12.6], target: [0.1, 2.4, -2] }, { position: [-0.6, 5.6, 11.0], target: [0.1, 2.4, -2] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} light={0.8} shadowSize={14}>
      <UnluckyBedroom tally={16} doorOpen={open} t={c.t} />
      <Portal id={1} position={BEDROOM.door} w={DOOR.w} h={DOOR.h} sky={["#3A8CDC", "#D6ECF8"]} brighten={0.3}>
        <OceanWorld at={[0, -0.6, 0]} t={c.t} />
      </Portal>
      <Hero pose={pose} position={pos} yaw={Math.PI} look={UNLUCKY} />
      {open > 0.2 ? <Blizzard position={[0, 1.2, 0.3]} w={DOOR.w} h={2.4} t={c.t} reach={5} color="#BFE3FF" seed="sea" count={120} /> : null}
    </Shot>
  );
};

/** Fifteen, sixteen, seventeen: the door opens on the ocean every time. */
const c5Count: ShotFn = (c) => {
  const per = 0.5;
  const i = Math.min(2, Math.floor(c.lt / per));
  const ph = c.lt - i * per;
  const open = i === 2 ? k01(ph, 0.02, 0.14) : k01(ph, 0.02, 0.14) * (1 - k01(ph, 0.34, 0.46));
  const n = 15 + i;
  const cam = move({ position: [0.3, 3.0, 8.4], target: [0, 2.6, 0] }, { position: [0.2, 2.95, 7.2], target: [0, 2.6, 0] }, c);
  const counter = (
    <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", fontFamily: FONT }}>
      <div style={{ fontWeight: 700, fontSize: 150, lineHeight: 1, color: i === 2 ? P.amber : P.white, textShadow: "0 6px 24px rgba(0,0,0,0.5)" }}>{n}</div>
      <div style={{ marginTop: 6, fontSize: 28, letterSpacing: "0.24em", color: P.white, opacity: 0.8 }}>{i === 2 ? "TIMES" : "×"}</div>
    </div>
  );
  return (
    <Shot mood="day" camera={cam} fog={false} light={0.8} shadowSize={12} overlay={counter} shake={open > 0.2 && open < 0.95 ? 0.02 : 0}>
      <UnluckyBedroom tally={n - 1} doorOpen={open * 0.9} t={c.t} />
      <Portal id={1} position={BEDROOM.door} w={DOOR.w} h={DOOR.h} sky={["#3A8CDC", "#D6ECF8"]} brighten={0.3}>
        <OceanWorld at={[0, -0.6, 0]} t={c.t} />
      </Portal>
      {open > 0.2 ? <Blizzard position={[0, 1.2, 0.3]} w={DOOR.w} h={2.4} t={c.t} reach={4} color="#BFE3FF" seed={`sea${i}`} count={90} /> : null}
    </Shot>
  );
};

/** The open sea: his bedroom doorway bobbing on the waves; he tumbles out and splashes in. */
const SEA_DOOR: V3 = [0, DOOR.h / 2, 0];
const SeaDoor: React.FC<{ t: number; children?: React.ReactNode; at?: V3; yaw?: number }> = ({ t, children, at = SEA_DOOR, yaw = 0 }) => {
  const bob = Math.sin(t * 1.4) * 0.18;
  const pos: V3 = [at[0], at[1] + bob, at[2]];
  return (
    <>
      <group position={[0, bob, 0]}>
        <DoorFrame position={at} yaw={yaw} />
      </group>
      <Portal id={1} position={pos} yaw={yaw} w={DOOR.w} h={DOOR.h} sky={["#C9B89A", "#C9B89A"]}>
        <Linked to={{ pos, yaw }} from={{ pos: BEDROOM.door }}>
          <UnluckyBedroom tally={17} doorOpen={0.9} t={t} />
        </Linked>
        {children}
      </Portal>
    </>
  );
};
const c5Fall: ShotFn = (c) => {
  const k = clamp01(c.lt / 0.75);
  const z = -1.2 + k * 3.8;
  const y = 0.2 + 1.6 * k - 4.2 * k * k;
  const pitch = k * 1.1;
  const pose = alarmPose(1, { lHip: [0.4, 0.1], rHip: [-0.2, 0.1], lKnee: 0.8, rKnee: 0.4 });
  const man = (key: string) =>
    k < 1 ? (
      <group key={key} position={[0, y + 2.2, z]} rotation={[pitch, 0, 0]}>
        <Hero pose={pose} position={[0, -2.2, 0]} look={UNLUCKY} />
      </group>
    ) : null;
  const cam = move({ position: [3.8, 3.4, 11.5], target: [0, 1.8, 1] }, { position: [3.2, 3.2, 9.8], target: [0, 1.6, 1.2] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} keyDir={[-0.5, 0.6, -1]} shadowSize={16}>
      <OceanWorld at={[0, 0, 0]} t={c.t} />
      <SeaDoor t={c.t}>{man("in")}</SeaDoor>
      {man("out")}
      <Splash at={[0, 0.1, 2.8]} p={(c.lt - 0.62) / 0.9} size={0.85} />
    </Shot>
  );
};

/** Every single time: bobbing in a life ring, deadpan, a gull circling overhead. */
const Lifebuoy: React.FC<{ position: V3 }> = ({ position }) => (
  <group position={position} rotation={[Math.PI / 2, 0, 0]}>
    {Array.from({ length: 8 }, (_, i) => (
      <mesh key={i} rotation={[0, 0, (i * Math.PI) / 4]}>
        <torusGeometry args={[1.25, 0.34, 6, 6, Math.PI / 4]} />
        <Flat color={i % 2 ? "#F2F2EE" : "#D8342A"} />
      </mesh>
    ))}
  </group>
);
const c5Bob: ShotFn = (c) => {
  const bob = Math.sin(c.t * 1.6) * 0.14;
  const pos: V3 = [0, -2.6 + bob, 2.6];
  const cam = move({ position: [1.3, 2.5, 10.5], target: [0, 1.3, 2.6] }, { position: [1.0, 2.3, 8.6], target: [0, 1.3, 2.6] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} keyDir={[-0.5, 0.6, 1]} shadowSize={14}>
      <OceanWorld at={[0, 0, 0]} t={c.t} />
      <SeaDoor t={c.t} at={[-3.6, DOOR.h / 2, -5]} yaw={0.35} />
      <Hero pose={mergePose(REST, { expression: "neutral", blink: 0.45, lShoulder: [0.5, 1.1], rShoulder: [0.5, 1.1], lElbow: 0.3, rElbow: 0.3 })} position={pos} look={UNLUCKY} />
      <Lifebuoy position={[0, 0.05 + bob, 2.6]} />
      <Gull position={[-8 + c.lt * 9, 7.5 + Math.sin(c.t * 2) * 0.3, 1]} yaw={Math.PI / 2} t={c.t} scale={1.2} />
    </Shot>
  );
};

// ================================================================ 06 the black room (day three, dusk in the Alps)

const c6Alps: ShotFn = (c) => {
  const cam = move({ position: [26, 26, 118], target: [0, 16, -60] }, { position: [22, 24, 106], target: [0, 16, -60] }, c);
  const sun = rotY([0.8, 0.16, -0.6], 0);
  return (
    <Shot mood="sunset" camera={cam} fog={[200, 1500]} keyDir={sun} shadowSize={70}>
      <AlpineLab t={c.t} />
      {[
        [-200, -700, 200, 170, "m1"],
        [60, -820, 250, 200, "m2"],
        [300, -720, 190, 160, "m3"],
        [-420, -640, 170, 150, "m4"],
        [460, -880, 230, 190, "m5"],
      ].map(([x, z, h, r, s]) => (
        <Mountain key={s as string} position={[x as number, 0, z as number]} h={h as number} r={r as number} seed={s as string} />
      ))}
      {Array.from({ length: 18 }, (_, i) => (
        <SnowPine key={i} position={[(i % 2 ? 1 : -1) * (46 + (i % 9) * 9 + random(`sp${i}`) * 6), 0, 10 - Math.floor(i / 2) * 14 - random(`spz${i}`) * 8]} scale={3 + random(`sps${i}`) * 1.5} />
      ))}
      <Clouds t={c.t} color={CLOUD.sunset} y={70} radius={300} seed="alps" />
    </Shot>
  );
};

/** Something strange: the LAB 3 door shudders, the warning light blinks, the lights flicker. */
const c6Strange: ShotFn = (c) => {
  const flicker = Math.sin(c.t * 37) > 0.6 ? 0.45 : 0.7;
  const cam = move({ position: [1.7, 3.6, 14], target: [0, 3.0, 0] }, { position: [1.3, 3.5, 11.6], target: [0, 3.0, 0] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={false} light={flicker} shadowSize={12} shake={0.025}>
      <LabCorridor open={Math.abs(Math.sin(c.t * 43)) * 0.006} t={c.t} />
    </Shot>
  );
};

const LAB_D: V3 = [0, LABDOOR.h / 2, 0.24];
const LAB_HANDLE: V3 = [LABDOOR.w / 2 - 0.24, -0.05, DOOR.leaf / 2 + 0.2];
/** The scientist walks up to the door. */
const c6Walk: ShotFn = (c) => {
  const z = 10.5 - k01(c.lt, 0, 1.35) * 7.3;
  const pose = mergePose(z > 3.4 ? walkPose(c.lt * 1.3, 0.8) : REST, { expression: "worried" });
  const cam = move({ position: [3.8, 4.6, 15.5], target: [0.4, 2.9, 2] }, { position: [3.4, 4.4, 13.5], target: [0.4, 2.9, 2] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={false} light={0.7} shadowSize={12}>
      <LabCorridor t={c.t} />
      <Hero pose={pose} position={[1.0, 0, z]} yaw={Math.PI} look={SWISS} />
    </Shot>
  );
};

/** His hand on the handle; the heavy door swings open. */
const c6Handle: ShotFn = (c) => {
  const open = k01(c.lt, 0.2, 1.2) * 0.9;
  const pos: V3 = [1.25, 0, 2.7];
  let pose: Pose = mergePose(REST, { expression: "worried" });
  if (open < 0.4) pose = reachR(pose, leafPoint(LAB_D, 0, open, true, LAB_HANDLE, LABDOOR.w), pos, Math.PI);
  const cam = move({ position: [3.4, 5.2, 10.2], target: [0.2, 2.6, 0] }, { position: [3.0, 4.9, 9.0], target: [0.2, 2.6, 0] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={false} light={0.7} shadowSize={10}>
      <LabCorridor open={open} t={c.t} />
      <Portal id={1} position={[0, LABDOOR.h / 2, 0]} w={LABDOOR.w} h={LABDOOR.h} sky={["#000000", "#000000"]} />
      <Hero pose={pose} position={pos} yaw={Math.PI} look={SWISS} />
    </Shot>
  );
};

/** Pure black: the corridor light stops dead at the threshold. */
const c6Black: ShotFn = (c) => {
  const cam = move({ position: [-0.7, 4.4, 10.5], target: [0, 2.4, -2] }, { position: [-0.35, 3.5, 6.0], target: [0, 2.4, -3] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={false} light={0.7} shadowSize={12}>
      <LabCorridor open={0.9} t={c.t} />
      <Portal id={1} position={[0, LABDOOR.h / 2, 0]} w={LABDOOR.w} h={LABDOOR.h} sky={["#000000", "#000000"]} />
      <Hero pose={mergePose(REST, { expression: "awe", headPitch: -0.05 })} position={[1.9, 0, 3.2]} yaw={Math.PI + 0.3} look={SWISS} />
    </Shot>
  );
};

/** Beam shader: bright at the torch (cone tip, uv.y = 1), fading to nothing at the far end. */
const BEAM_VERT = /* glsl */ `
  varying float vK;
  void main() {
    vK = uv.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const BEAM_FRAG = /* glsl */ `
  uniform vec3 color;
  uniform float opacity;
  varying float vK;
  void main() {
    gl_FragColor = vec4(color, opacity * pow(vK, 2.2));
    #include <colorspace_fragment>
  }
`;
/** No walls: his torch beam runs into the dark and hits nothing. */
const Beam: React.FC<{ from: V3; len: number; r: number; yaw?: number; pitch?: number; color?: string }> = ({ from, len, r, yaw = 0, pitch = 0, color = "#FFF2C8" }) => (
  <group position={from} rotation={[pitch, yaw, 0]}>
    {[
      [len, r, 0.45],
      [len * 0.6, r * 0.5, 0.55],
    ].map(([l, rr, o], i) => (
      <mesh key={i} position={[0, 0, -l / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[rr, l, 24, 8, true]} />
        <shaderMaterial
          vertexShader={BEAM_VERT}
          fragmentShader={BEAM_FRAG}
          uniforms={{ color: { value: new THREE.Color(color) }, opacity: { value: o } }}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    ))}
  </group>
);
const c6Beam: ShotFn = (c) => {
  const pos: V3 = [-1.0, 0, 3.2];
  const pose = mergePose(REST, { expression: "worried", rShoulder: [1.45, 0.1], rElbow: 0.1, lShoulder: [0.2, 0.15] });
  const hand = handPosition(pose, "r", pos, Math.PI);
  const sweep = Math.sin(c.lt * 2.2) * 0.25;
  const cam = move({ position: [3.9, 4.4, 8.8], target: [-0.4, 2.7, -3] }, { position: [3.6, 4.2, 7.8], target: [-0.4, 2.7, -3] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={false} light={0.6} shadowSize={10}>
      <LabCorridor open={0.9} t={c.t} />
      <Portal id={1} position={[0, LABDOOR.h / 2, 0]} w={LABDOOR.w} h={LABDOOR.h} sky={["#000000", "#000000"]} />
      <Hero pose={pose} position={pos} yaw={Math.PI} look={SWISS} />
      <mesh position={[hand[0], hand[1], hand[2] - 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <CylG args={[0.1, 0.12, 0.6, 8]} />
        <Flat color="#2A2A30" />
      </mesh>
      <Beam from={[hand[0], hand[1], hand[2] - 0.6]} len={16} r={2.4} yaw={sweep} pitch={-0.05} />
    </Shot>
  );
};

/** The void, looking up: the lit doorway hangs in black, and his pen falls past us forever. */
const VOID_DOOR: V3 = [0, 0, 0];
const VoidDoorway: React.FC<{ t: number; children?: React.ReactNode; leaning?: boolean }> = ({ t, children, leaning = false }) => (
  <Portal id={1} position={VOID_DOOR} w={LABDOOR.w} h={LABDOOR.h} sky={["#E4E8EE", "#C9CED6"]} doubleSided>
    <Linked to={{ pos: VOID_DOOR }} from={{ pos: [0, LABDOOR.h / 2, 0] }}>
      <LabCorridor open={0.9} t={t} />
      <Hero pose={mergePose(REST, { expression: "awe", lean: leaning ? 0.35 : 0.05, headPitch: leaning ? -0.5 : 0 })} position={[0.4, 0, 2.2]} yaw={Math.PI} look={SWISS} />
    </Linked>
    {children}
  </Portal>
);
const c6Floor: ShotFn = (c) => {
  const y = -2.3 - 8.5 * c.lt * c.lt;
  const cam = move({ position: [0.7, -11, 7.5], target: [0, -0.4, -1] }, { position: [0.6, -11.6, 7.2], target: [0, -0.6, -1] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} stars={false} light={0.7} shadows={false}>
      <VoidDoorway t={c.t} leaning />
      <group position={[0.3, y, 0.9 + c.lt * 0.8]} rotation={[c.lt * 7, c.lt * 3, c.lt * 5]}>
        <mesh>
          <CylG args={[0.09, 0.09, 1.4, 6]} />
          <Glow color="#4F9BFF" />
        </mesh>
        <mesh position={[0, 0.78, 0]}>
          <ConeG args={[0.09, 0.2, 6]} />
          <Glow color="#F2EEE4" />
        </mesh>
      </group>
      <pointLight position={[0, -1.5, 1.5]} color="#F0F6FF" intensity={8} distance={14} decay={1.5} />
    </Shot>
  );
};

/** Just darkness: we pull back until the doorway is a small lit rectangle in an endless black. */
const c6Dark: ShotFn = (c) => {
  const cam = move({ position: [0, 0.4, 7], target: [0, 0, 0] }, { position: [0, 0.2, 28], target: [0, 0, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} stars={false} light={0.7} shadows={false}>
      <VoidDoorway t={c.t} />
    </Shot>
  );
};

// ================================================================ 07 the void

/** He launches a camera drone into the dark; its red light shrinks away. */
const c7Drone: ShotFn = (c) => {
  const k = k01(c.lt, 0.15, 1.3);
  const d: V3 = [1.5 - k * 1.3, 3.8 - k * 0.6, 2.4 - k * 9];
  const cam = move({ position: [-0.6, 5.4, 13.5], target: [0.2, 2.9, -3] }, { position: [-0.4, 5.0, 11.6], target: [0.2, 2.9, -3] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={false} light={0.65} shadowSize={12}>
      <LabCorridor open={0.9} t={c.t} />
      <Portal id={1} position={[0, LABDOOR.h / 2, 0]} w={LABDOOR.w} h={LABDOOR.h} sky={["#000000", "#000000"]} />
      <Hero pose={mergePose(REST, { expression: "worried", lShoulder: [1.2 - k * 0.8, 0.1], rShoulder: [1.2 - k * 0.8, 0.1], lElbow: 0.6, rElbow: 0.6 })} position={[1.9, 0, 3.8]} yaw={Math.PI + 0.2} look={SWISS} />
      <Drone position={d} yaw={Math.PI} t={c.t} scale={0.9} />
    </Shot>
  );
};

/** The drone's feed: REC, a timecode, the dark… and faint lights far away. */
const FeedHud: React.FC<{ t: number; lt: number }> = ({ t, lt }) => {
  const blink = Math.floor(t * 2) % 2 === 0;
  const s = Math.floor(lt);
  const f = Math.floor((lt % 1) * 30);
  const corner = (style: React.CSSProperties) => <div style={{ position: "absolute", width: 70, height: 70, borderColor: "rgba(255,255,255,0.7)", borderStyle: "solid", borderWidth: 0, ...style }} />;
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "rgba(255,255,255,0.85)" }}>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(180deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px)" }} />
      {corner({ left: 80, top: 210, borderLeftWidth: 4, borderTopWidth: 4 })}
      {corner({ right: 80, top: 210, borderRightWidth: 4, borderTopWidth: 4 })}
      {corner({ left: 80, bottom: 240, borderLeftWidth: 4, borderBottomWidth: 4 })}
      {corner({ right: 80, bottom: 240, borderRightWidth: 4, borderBottomWidth: 4 })}
      <div style={{ position: "absolute", left: 110, top: 240, fontSize: 32, fontWeight: 700, letterSpacing: "0.12em", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 22, height: 22, borderRadius: 11, background: blink ? "#FF3A3A" : "rgba(255,58,58,0.25)", display: "inline-block" }} />
        REC
      </div>
      <div style={{ position: "absolute", right: 110, top: 244, fontSize: 28, letterSpacing: "0.08em", fontVariantNumeric: "tabular-nums" }}>
        00:00:{String(s).padStart(2, "0")}:{String(f).padStart(2, "0")}
      </div>
      <div style={{ position: "absolute", left: 110, bottom: 270, fontSize: 24, letterSpacing: "0.16em", opacity: 0.8 }}>CAM 01  ·  LAB 3</div>
      <div style={{ position: "absolute", right: 110, bottom: 270, fontSize: 24, letterSpacing: "0.1em", opacity: 0.8 }}>▮▮▮▯ 74%</div>
      <div style={{ position: "absolute", left: 540 - 30, top: 960 - 1, width: 60, height: 2, background: "rgba(255,255,255,0.5)" }} />
      <div style={{ position: "absolute", left: 540 - 1, top: 960 - 30, width: 2, height: 60, background: "rgba(255,255,255,0.5)" }} />
    </AbsoluteFill>
  );
};
const VoidBackdrop: React.FC<{ t: number; swarm?: Partial<React.ComponentProps<typeof DoorSwarm>>; nebula?: number }> = ({ t, swarm, nebula = 1 }) => (
  <>
    <DoorSwarm t={t} {...swarm} />
    <Motes t={t} count={260} radius={40} />
    {[
      [-120, 60, -260, "#7A4AFF", 420],
      [160, -40, -300, "#2AD8FF", 380],
      [20, 140, -200, "#FF4AD0", 300],
      [-200, -120, -160, "#4A6AFF", 360],
    ].map(([x, y, z, col, s], i) => (
      <Halo key={i} position={[x as number, y as number, z as number]} size={s as number} color={col as string} opacity={0.16 * nebula} />
    ))}
  </>
);
const c7Feed: ShotFn = (c) => {
  const cam = move({ position: [0, 0, 0], target: [0, 0.4, -60] }, { position: [0, 0.4, -12], target: [6, 4, -60] }, c);
  return (
    <Shot mood="space" camera={cam} fog={[60, 420]} light={0.55} shadows={false} overlay={<FeedHud t={c.t} lt={c.lt + 3} />}>
      <VoidBackdrop t={c.t} swarm={{ count: 700, rMin: 150, rMax: 420, seed: "far" }} nebula={k01(c.lt, 0.4, 2.2)} />
    </Shot>
  );
};

/** Thousands of doors, drifting and turning in an endless void. */
const c7Doors: ShotFn = (c) => {
  const cam = move({ position: [0, 1, 16], target: [-12, 2, -40] }, { position: [3, 2.6, 4], target: [-4, 3, -40] }, c);
  return (
    <Shot mood="space" camera={cam} fog={[90, 380]} light={0.9} shadows={false}>
      <VoidBackdrop t={c.t} swarm={{ count: 1600, rMin: 9, rMax: 300 }} />
    </Shot>
  );
};

const c7Wide: ShotFn = (c) => {
  const cam = move({ position: [0, 38, 200], target: [0, 0, 0] }, { position: [0, 46, 236], target: [0, 0, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={[160, 560]} light={0.9} shadows={false}>
      <VoidBackdrop t={c.t} swarm={{ count: 1800, rMin: 4, rMax: 150, seed: "ball" }} />
      <Halo position={[0, 0, 0]} size={8} color="#FF3A3A" opacity={0.9} />
    </Shot>
  );
};

/** Behind every door, a different Earth: ringed, frozen, violet, red. */
const EARTH_DOORS: { p: V3; yaw: number; kind: AltKind }[] = [
  { p: [-1.3, 2.0, -5], yaw: 0.15, kind: "ringed" },
  { p: [1.5, -2.4, -12], yaw: -0.15, kind: "ice" },
  { p: [-1.7, 3.8, -20], yaw: 0.2, kind: "purple" },
  { p: [1.9, -1.0, -28], yaw: -0.12, kind: "red" },
];
const EarthDoor: React.FC<{ id: number; p: V3; yaw: number; kind: AltKind; t: number; radius?: number; dist?: number }> = ({ id, p, yaw, kind, t, radius = 6, dist = 26 }) => (
  <group>
    <DoorFrame position={p} yaw={yaw} />
    <DoorLeaf position={add(p, rotY([0, 0, 0.1], yaw))} yaw={yaw} open={0.85} toward color="#8A6A4A" />
    <Portal id={id} position={p} yaw={yaw} w={DOOR.w} h={DOOR.h} sky={["#05040C", "#140F2A"]}>
      <SpaceWorld at={p} yaw={yaw} kind={kind} t={t} radius={radius} dist={dist} />
    </Portal>
    <PortalRim position={add(p, rotY([0, 0, 0.22], yaw))} yaw={yaw} w={DOOR.w} h={DOOR.h} t={t} color="#B8A8FF" k={0.55} sparks={8} seed={`ed${id}`} />
  </group>
);
const c7Earths: ShotFn = (c) => {
  const cam = move({ position: [0.2, 0.6, 12], target: [0, 0.6, -40] }, { position: [0.1, 0.5, 3], target: [0, 0.5, -40] }, c);
  return (
    <Shot mood="space" camera={cam} fog={[90, 380]} light={0.9} shadows={false}>
      <VoidBackdrop t={c.t} swarm={{ count: 1200, rMin: 34, rMax: 300 }} />
      {EARTH_DOORS.map((d, i) => (
        <EarthDoor key={i} id={i + 1} p={d.p} yaw={d.yaw} kind={d.kind} t={c.t} />
      ))}
    </Shot>
  );
};

/** One door up close: an Earth with two moons. */
const c7Version: ShotFn = (c) => {
  const cam = move({ position: [0.5, 0.3, 11], target: [0, 0, 0] }, { position: [0.3, 0.15, 7.6], target: [0, 0, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={[90, 380]} light={0.9} shadows={false}>
      <VoidBackdrop t={c.t} swarm={{ count: 1200, rMin: 30, rMax: 300 }} />
      <EarthDoor id={1} p={[0, 0, 0]} yaw={0} kind="twin" t={c.t} radius={4.2} dist={26} />
    </Shot>
  );
};

// ================================================================ 08 the other side

const ALIEN_DOOR: V3 = [0, 0, 0];
const ALIEN_FLOOR: V3 = [0, -DOOR.h / 2, 0];
/** One door ahead. Its handle starts to turn, from the other side. */
const c8Handle: ShotFn = (c) => {
  const k = k01(c.lt, 0.3, 1.4);
  const cam = move({ position: [0.9, 0.5, 7.8], target: [0, 0.1, 0] }, { position: [0.7, 0.35, 6.3], target: [0, 0.1, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={[90, 380]} light={0.8} shadows={false} shake={k * 0.02}>
      <VoidBackdrop t={c.t} swarm={{ count: 1000, rMin: 26, rMax: 300 }} nebula={0.7} />
      <DoorFrame position={ALIEN_DOOR} />
      <DoorLeaf position={[0, 0, 0.1]} handle={k * Math.abs(Math.sin(c.t * 16))} color="#8A6A4A" open={k * Math.abs(Math.sin(c.t * 23)) * 0.01} toward />
      {[
        [0, -DOOR.h / 2 + 0.03, DOOR.w, 0.07],
        [-DOOR.w / 2 + 0.03, 0, 0.06, DOOR.h],
        [DOOR.w / 2 - 0.03, 0, 0.06, DOOR.h],
        [0, DOOR.h / 2 - 0.03, DOOR.w, 0.06],
      ].map(([x, y, sw, sh], i) => (
        <mesh key={i} position={[x, y, 0.2]}>
          <planeGeometry args={[sw, sh]} />
          <Glow color="#C88AFF" opacity={0.3 + k * 0.7} additive />
        </mesh>
      ))}
      <Halo position={[0, 0, 0.4]} size={9} color="#B07AFF" opacity={0.15 + k * 0.3} />
    </Shot>
  );
};

/** It swings open toward us: violet light, another world, and a tall shape waiting. */
const c8Open: ShotFn = (c) => {
  const open = k01(c.lt, 0.05, 1.0) * 0.85;
  const cam = move({ position: [0.7, 0.3, 8.2], target: [0, 0.2, 0] }, { position: [0.5, 0.2, 7.0], target: [0, 0.2, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={[90, 380]} light={0.8} shadows={false} shake={open > 0 && open < 0.85 ? 0.02 : 0}>
      <VoidBackdrop t={c.t} swarm={{ count: 1000, rMin: 26, rMax: 300 }} nebula={0.7} />
      <DoorFrame position={ALIEN_DOOR} />
      <DoorLeaf position={[0, 0, 0.1]} color="#8A6A4A" open={open} toward />
      <Portal id={1} position={ALIEN_DOOR} w={DOOR.w} h={DOOR.h} sky={["#1A0630", "#C04AB0"]} brighten={0.25}>
        <AlienWorld at={ALIEN_FLOOR} t={c.t} />
        <Visitor position={[0, ALIEN_FLOOR[1], -3.0]} t={c.t} scale={0.68} eyeOpen={k01(c.lt, 0.7, 1.0)} />
      </Portal>
      <PortalRim position={[0, 0, 0.25]} w={DOOR.w} h={DOOR.h} t={c.t} color="#D8A8FF" k={open} seed="alien" />
      <Halo position={[0, 0, 0.6]} size={14} color="#B07AFF" opacity={0.35 * open} />
    </Shot>
  );
};

/** Something begins stepping through: a long hand on the frame, a foot, four glowing eyes. */
const c8Step: ShotFn = (c) => {
  const k = k01(c.lt, 0, 2.0);
  const z = -1.6 + k * 2.6;
  const visitor = (key: string) => <Visitor key={key} position={[0, ALIEN_FLOOR[1], z]} t={c.t} scale={0.68} step={Math.sin(k * Math.PI)} reach={k01(c.lt, 0.1, 0.8)} />;
  const cam = move({ position: [0.8, -1.9, 7.8], target: [0, 1.0, 0] }, { position: [0.6, -1.7, 6.4], target: [0, 1.1, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={[90, 380]} light={0.75} shadows={false}>
      <VoidBackdrop t={c.t} swarm={{ count: 1000, rMin: 26, rMax: 300 }} nebula={0.7} />
      <DoorFrame position={ALIEN_DOOR} />
      <DoorLeaf position={[0, 0, 0.1]} color="#8A6A4A" open={0.85} toward />
      <Portal id={1} position={ALIEN_DOOR} w={DOOR.w} h={DOOR.h} sky={["#1A0630", "#C04AB0"]} brighten={0.25}>
        <AlienWorld at={ALIEN_FLOOR} t={c.t} />
        {visitor("in")}
      </Portal>
      {visitor("out")}
      <PortalRim position={[0, 0, 0.25]} w={DOOR.w} h={DOOR.h} t={c.t} color="#D8A8FF" k={0.8} seed="alien2" />
      <pointLight position={[0, 0.5, -2.5]} color="#C88AFF" intensity={24} distance={12} decay={1.6} />
    </Shot>
  );
};

/** Back in the lab: the scientist stares at the feed… and behind him, in the black doorway, eyes. */
const c8Monitor: ShotFn = (c) => {
  const pos: V3 = [1.5, 0, 4.4];
  const pose = mergePose(REST, { expression: "alarm", lShoulder: [0.6, 0.05], rShoulder: [0.6, 0.05], lElbow: 1.0, rElbow: 1.0, headPitch: -0.3 });
  const l = handPosition(pose, "l", pos, 0);
  const r = handPosition(pose, "r", pos, 0);
  const tab: V3 = [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2 + 0.05, (l[2] + r[2]) / 2 + 0.1];
  const cam = move({ position: [2.0, 4.6, 12.6], target: [0.9, 4.0, 3] }, { position: [1.8, 4.5, 11.2], target: [0.9, 4.0, 3] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.4} stars={false} shadowSize={10}>
      <LabCorridor open={0.9} t={c.t} />
      <Portal id={1} position={[0, LABDOOR.h / 2, 0]} w={LABDOOR.w} h={LABDOOR.h} sky={["#000000", "#05020A"]}>
        <PeekingEyes position={[-0.4, 3.6, -2.2]} color="#7CF7FF" t={c.t} seed="m1" open={k01(c.lt, 0.4, 0.8)} size={1.2} />
      </Portal>
      <Hero pose={pose} position={pos} look={SWISS} />
      <mesh position={tab} rotation={[-1.1, 0, 0]} castShadow>
        <BoxG args={[1.5, 1.0, 0.08]} />
        <Flat color="#1A1A22" />
      </mesh>
      <pointLight position={[tab[0], tab[1] + 0.2, tab[2] - 0.5]} color="#C88AFF" intensity={isBloom() ? 4 : 9} distance={4} decay={2} />
    </Shot>
  );
};

/** Pull back: door after door creaks open, and in every one, eyes. Humanity wasn't the only one. */
const FINAL_DOORS = Array.from({ length: 22 }, (_, i) => {
  const a = (i / 22) * Math.PI * 2 + random(`fd${i}`) * 0.3;
  const ring = i % 2 ? 1 : 0;
  const r = 9 + ring * 8 + random(`fr${i}`) * 4;
  const p: V3 = [Math.cos(a) * r, Math.sin(a) * r * 0.62 + (random(`fy${i}`) - 0.5) * 2, -6 - ring * 8 - random(`fz${i}`) * 6];
  return { p, yaw: -Math.atan2(p[0], 30 - p[2]) * -1 * 0.8, delay: 0.15 + random(`fdl${i}`) * 1.6, col: ["#7CF7FF", "#FF7AE0", "#B8FF7A", "#FFD34F", "#FF5A4A", "#C8A8FF"][i % 6] };
});
const c8Final: ShotFn = (c) => {
  const cam = move({ position: [0, 0.4, 9.5], target: [0, 0.3, -4] }, { position: [0, 2.4, 38], target: [0, 0.5, -6] }, c);
  return (
    <Shot mood="space" camera={cam} fog={[90, 420]} light={0.75} shadows={false}>
      <VoidBackdrop t={c.t} swarm={{ count: 1200, rMin: 50, rMax: 320 }} nebula={0.8} />
      <DoorFrame position={ALIEN_DOOR} />
      <DoorLeaf position={[0, 0, 0.1]} color="#8A6A4A" open={0.85} toward />
      <Portal id={1} position={ALIEN_DOOR} w={DOOR.w} h={DOOR.h} sky={["#1A0630", "#C04AB0"]} brighten={0.25}>
        <AlienWorld at={ALIEN_FLOOR} t={c.t} />
      </Portal>
      <Visitor position={[0, ALIEN_FLOOR[1], 1.4]} t={c.t} scale={0.68} />
      {FINAL_DOORS.map((d, i) => {
        const k = k01(c.lt, d.delay, d.delay + 0.5);
        return (
          <group key={i}>
            <DoorFrame position={d.p} yaw={d.yaw} />
            <DoorLeaf position={add(d.p, rotY([0, 0, 0.1], d.yaw))} yaw={d.yaw} open={0.08 + k * 0.4} toward color="#6A5A4A" />
            <mesh position={add(d.p, rotY([0, 0, -0.02], d.yaw))} rotation={[0, d.yaw, 0]}>
              <planeGeometry args={[DOOR.w, DOOR.h]} />
              <meshBasicMaterial color="#0A0612" toneMapped={false} />
            </mesh>
            <PeekingEyes position={add(d.p, rotY([-0.2, 0.9, 0.05], d.yaw))} yaw={d.yaw} color={d.col} t={c.t} seed={`fe${i}`} open={k} size={0.8} />
          </group>
        );
      })}
    </Shot>
  );
};

/** Thumbnail: Slavoski stepping out of his London hallway into the Sahara. */
export const thumbShot: ShotFn = (c) => {
  const pose = mergePose(walkPose(0.3, 0.9), { expression: "alarm", headPitch: 0.1 });
  const cam: CameraSpec = { position: [1.9, 1.5, 13.5], target: [0, 4.7, 0] };
  return (
    <Shot mood="day" camera={cam} fog={false} keyDir={SAH_SUN} shadowSize={14}>
      <SaharaDoor t={c.t} hero={{ pos: [0.15, 0, 0.3], pose }} />
    </Shot>
  );
};

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldClock },
    { cue: "am", fn: coldDoor },
    { cue: "every door", fn: coldStreet },
    { cue: "suddenly", fn: coldBurst },
    { cue: "random", fn: coldCorridor },
  ],
  c1: [
    { cue: null, fn: c1Walk },
    { cue: "opens his", fn: c1Open },
    { cue: "and walks", fn: c1Step },
    { cue: "sahara", fn: c1Aerial },
    { cue: "meanwhile", fn: c1Kitchen },
    { cue: "opens her", fn: c1Fridge },
    { cue: "and finds", fn: c1Antarctica },
    { cue: "penguin", fn: c1Penguin },
  ],
  c2: [
    { cue: null, fn: c2Chaos },
    { cue: "chaos", fn: c2Cow },
    { cue: "people are", fn: c2Front },
    { cue: "thousands", fn: c2Globe },
    { cue: "one man", fn: c2Tokyo },
    { cue: "and somehow", fn: c2Oval },
    { cue: "the white", fn: c2Mansion },
  ],
  c3: [
    { cue: null, fn: c3Screen },
    { cue: "everyone", fn: c3Tape },
    { cue: "but there's", fn: c3Problem },
    { cue: "hospitals", fn: c3Hospital },
    { cue: "prisoners", fn: c3Cell },
    { cue: "accidentally", fn: c3Beach },
    { cue: "and millions", fn: c3Crowd },
    { cue: "completely", fn: c3Split },
  ],
  c4: [
    { cue: null, fn: c4Lab },
    { cue: "something incredible", fn: c4Awe },
    { cue: "every door", fn: c4Cycle },
    { cue: "people begin", fn: c4Tourist },
    { cue: "airlines", fn: c4Airport },
    { cue: "tourists", fn: c4Base },
  ],
  c5: [
    { cue: null, fn: c5Wet },
    { cue: "opened his", fn: c5Open },
    { cue: "seventeen", fn: c5Count },
    { cue: "only to", fn: c5Fall },
    { cue: "every single", fn: c5Bob },
  ],
  c6: [
    { cue: null, fn: c6Alps },
    { cue: "something strange", fn: c6Strange },
    { cue: "a scientist", fn: c6Walk },
    { cue: "opens a", fn: c6Handle },
    { cue: "and discovers", fn: c6Black },
    { cue: "no walls", fn: c6Beam },
    { cue: "no floor", fn: c6Floor },
    { cue: "just darkness", fn: c6Dark },
  ],
  c7: [
    { cue: null, fn: c7Drone },
    { cue: "the camera", fn: c7Feed },
    { cue: "thousands", fn: c7Doors },
    { cue: "endless void", fn: c7Wide },
    { cue: "and behind", fn: c7Earths },
    { cue: "is a different", fn: c7Version },
  ],
  c8: [
    { cue: null, fn: c8Handle },
    { cue: "opens from", fn: c8Open },
    { cue: "and something", fn: c8Step },
    { cue: "because apparently", fn: c8Monitor },
    { cue: "humanity", fn: c8Final },
  ],
};
