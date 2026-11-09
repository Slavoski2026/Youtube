/**
 * Shots for "What If VERITY Actually Existed in Real Life?" (ep. 8).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * Arc: sunny afternoon delivery → golden-hour living room → rainy night with lightning → flickering
 * blackout in the hall, lit only by the smile.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { BoxG, IcoG } from "../../slavoski/detail";
import { Shockwave } from "../../slavoski/fx";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Clouds, LightningBolt } from "../../slavoski/nature";
import { clamp01, ease, noise1, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { handPosition, headPosition, Hero, lerpPose, mergePose, reach, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { sittingPose } from "../../slavoski/room";
import { CanvasPanel, ScreenHtml, fitText } from "../../slavoski/screens";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import { wordAt, type CuedShot } from "../../slavoski/timeline";
import { PHONE, Phone3D } from "../ww3-countdown/props";
import {
  CallScreen,
  Creature,
  drawHomework,
  HALL,
  Hallway,
  HOUSE,
  HouseFront,
  LivingRoom,
  Paper,
  Parcel,
  phoneOnSide,
  ROOM,
  Verity,
  VERITY_R,
  VERITY_YELLOW,
  verityOnTable,
} from "./props";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const Shot: React.FC<{ children: React.ReactNode; overlay?: React.ReactNode } & React.ComponentProps<typeof Stage>> = ({ children, overlay, ...stage }) => (
  <AbsoluteFill>
    <Stage {...stage}>{children}</Stage>
    {overlay}
  </AbsoluteFill>
);

/** Mouth opening while Verity's words are spoken: the phrase starting at `phrase` (searched from `from`). */
const talkFor = (c: ShotCtx, phrase: string, from: number, fallback: number) => {
  const a = wordAt(c.words, phrase, from, fallback);
  for (const w of c.words) {
    const s = w.startMs / 1000;
    const e = w.endMs / 1000;
    if (s < a - 0.01 || s > a + 2.6) continue;
    if (c.t >= s && c.t <= e) return 0.35 + 0.65 * Math.abs(Math.sin((c.t - s) * 15));
  }
  return 0;
};

/** On/off flicker for a bad bulb (seeded, frame-driven). */
const flicker = (seed: string, t: number, on = 0.45) => (noise1(seed, t * 7) > on - 0.5 ? 1 : 0.08) * (0.75 + 0.25 * noise1(`${seed}b`, t * 23));

/** Lightning flash 0..1 starting at `at` (two quick pulses). */
const flash = (lt: number, at: number) => {
  const x = lt - at;
  if (x < 0 || x > 0.45) return 0;
  return x < 0.08 ? 1 : x < 0.16 ? 0.25 : x < 0.24 ? 0.85 : Math.max(0, 1 - (x - 0.24) / 0.2) * 0.6;
};
const Flash: React.FC<{ k: number }> = ({ k }) => (k > 0 ? <AbsoluteFill style={{ background: "#DDE6FF", opacity: k * 0.55, pointerEvents: "none" }} /> : null);

const SIDE_L = Math.sign(handPosition(REST, "l")[0]) || 1;
/** Both hands holding a ball of radius R centred at `ball` (world), hero at `hero` facing +Z. */
const holdBall = (hero: V3, ball: V3, R: number, over: Partial<Pose> = {}) => {
  let pose = mergePose(REST, over);
  pose = reach(pose, "l", [ball[0] + SIDE_L * (R + 0.15), ball[1] - 0.12, ball[2] - 0.05], { position: hero }).pose;
  pose = reach(pose, "r", [ball[0] - SIDE_L * (R + 0.15), ball[1] - 0.12, ball[2] - 0.05], { position: hero }).pose;
  return pose;
};

/** A fist plus an orange sleeve (for close-up inserts where the full hero is off-screen). */
const ArmInsert: React.FC<{ fist: V3; dir: V3 }> = ({ fist, dir }) => {
  const len = Math.hypot(...dir);
  const u: V3 = [dir[0] / len, dir[1] / len, dir[2] / len];
  const elbow: V3 = add(fist, [u[0] * 1.6, u[1] * 1.6, u[2] * 1.6]);
  const mid: V3 = [(fist[0] + elbow[0]) / 2, (fist[1] + elbow[1]) / 2, (fist[2] + elbow[2]) / 2];
  const yaw = Math.atan2(u[0], u[2]);
  const pitch = -Math.asin(Math.max(-1, Math.min(1, u[1])));
  return (
    <group>
      <mesh position={fist} castShadow>
        <IcoG args={[0.24, 2]} />
        <Flat color={P.skin} />
      </mesh>
      <mesh position={mid} rotation={[pitch, yaw, 0]} castShadow>
        <BoxG args={[0.42, 0.42, 1.45]} />
        <Flat color={P.jacket} />
      </mesh>
    </group>
  );
};

const CLOUD_DAY = "#F4F6FA";

// ---------------------------------------------------------------- cold open: the hook

/** 0 s: darkness, then two square eyes snap open on a yellow face. */
const coldEyes: ShotFn = (c) => {
  const v: V3 = verityOnTable();
  const open = k01(c.lt, 0.22, 0.34);
  const cam = move({ position: add(v, [0.15, 0.12, 2.6]), target: add(v, [0, 0.05, 0]) }, { position: add(v, [0.1, 0.1, 1.9]), target: add(v, [0, 0.05, 0]) }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.25} shadowSize={10}>
      <LivingRoom t={c.t} sky="night" lamp={0} pendant={0} rain />
      <Verity position={v} R={VERITY_R} awake={0.25 + 0.75 * open} shut={1 - open} wide={0.2 * open} />
    </Shot>
  );
};

/** The house on a rainy night, the upstairs window glowing with the smile. Title comes in here. */
const coldHouse: ShotFn = (c) => {
  const cam = move({ position: [-6, 3.2, 40], target: [0, 9, 0] }, { position: [-4.5, 3.4, 32], target: [0, 9.5, 0] }, c);
  const f = flash(c.lt, 1.3);
  return (
    <Shot mood="storm" camera={cam} fog={[40, 220]} light={0.55 + f} overlay={<Flash k={f} />}>
      <HouseFront t={c.t} night lit={false} rain upGlow={k01(c.lt, 0.2, 0.9)} />
      <Clouds t={c.t} color="#2E3646" y={40} radius={150} count={18} seed="coldcl" />
      <LightningBolt top={[40, 60, -90]} bottom={[34, 0, -90]} flash={f} seed="cold" />
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 the package (sunny afternoon)

const PORCH_HERO: V3 = [0.4, HOUSE.porchY, 1.0];
const PARCEL_AT: V3 = [0, HOUSE.porchY, 2.7];

/** The parcel on the doormat; the door swings open and Slavoski steps out and looks down. */
const c1Porch: ShotFn = (c) => {
  const door = k01(c.lt, 0.3, 0.9);
  // he walks out of the entry hall, across the threshold, to the parcel
  const step = k01(c.lt, 0.7, 2.5);
  const walking = c.lt > 0.7 && c.lt < 2.5;
  const hero: V3 = [PORCH_HERO[0], PORCH_HERO[1], -2.4 + step * (PORCH_HERO[2] + 2.4)];
  const settle = k01(c.lt, 2.3, 2.6);
  const pose = mergePose(walking ? lerpPose(walkPose((c.lt - 0.7) * 1.25, 0.8), REST, settle) : REST, {
    headPitch: -0.55 * k01(c.lt, 2.1, 2.7),
    expression: c.lt > 2.6 ? "awe" : "neutral",
  });
  const cam = move({ position: [7, 3.4, 20], target: [0, 4.4, 1.5] }, { position: [6, 3.4, 17.5], target: [0, 4.2, 1.8] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={25}>
      <HouseFront t={c.t} doorOpen={door} />
      <Clouds t={c.t} color={CLOUD_DAY} y={45} radius={170} count={14} seed="dayc" />
      <Parcel position={PARCEL_AT} yaw={0.15} />
      <Hero pose={pose} position={hero} />
    </Shot>
  );
};

/** Looking down into the open box: Verity asleep in crinkled paper. */
const c1Box: ShotFn = (c) => {
  const open = k01(c.lt, 0.0, 0.7);
  const cam = move({ position: [0.5, HOUSE.porchY + 5.2, 4.6], target: [0, HOUSE.porchY + 0.6, 2.7] }, { position: [0.35, HOUSE.porchY + 3.9, 3.8], target: [0, HOUSE.porchY + 0.6, 2.7] }, c);
  const v: V3 = [0, HOUSE.porchY + 0.62, 2.7];
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={12}>
      <HouseFront t={c.t} />
      <Parcel position={PARCEL_AT} yaw={0} open={open} />
      <Paper position={[0, HOUSE.porchY + 0.3, 2.7]} count={12} spread={[1.3, 1.1]} />
      <Verity position={v} R={0.5} dock={false} awake={0} shut={1} pitch={-0.9} light={0} />
    </Shot>
  );
};

/** He lifts it up to his face… and its eyes snap open. */
const VERITY_HELD = (hero: V3): V3 => add(hero, [-0.05, 2.7, 1.3]);
const c1Wake: ShotFn = (c) => {
  const hero = PORCH_HERO;
  const v = VERITY_HELD(hero);
  const wake = k01(c.lt, 0.2, 0.32);
  const pose = holdBall(hero, v, 0.5, { expression: wake > 0.5 ? "alarm" : "neutral", lean: -0.12 * wake, headPitch: -0.4 });
  const cam = move({ position: [3.6, HOUSE.porchY + 3.4, 9.5], target: [0.2, HOUSE.porchY + 3.1, 1.2] }, { position: [3.1, HOUSE.porchY + 3.4, 8.2], target: [0.2, HOUSE.porchY + 3.1, 1.2] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={14} shake={wake > 0 && wake < 1 ? 0.04 : 0}>
      <HouseFront t={c.t} doorOpen={1} />
      <Parcel position={PARCEL_AT} yaw={0.15} open={1} />
      <Hero pose={pose} position={hero} />
      <Verity position={v} R={0.5} dock={false} yaw={0.35} awake={wake} shut={1 - wake} wide={0.3 * wake} />
    </Shot>
  );
};

/** "Hey, it's me. It's Verity!": close on the talking face, Slavoski grinning behind it. */
const c1Hello: ShotFn = (c) => {
  const hero = PORCH_HERO;
  const v = VERITY_HELD(hero);
  const pose = holdBall(hero, v, 0.5, { expression: "smile", headPitch: -0.35 });
  const talk = talkFor(c, "hey it's me", 10.5, 11.4);
  const cam = move({ position: add(v, [2.0, 0.2, 3.6]), target: add(v, [-0.2, 0.5, -0.6]) }, { position: add(v, [1.7, 0.15, 3.0]), target: add(v, [-0.2, 0.5, -0.6]) }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={10}>
      <HouseFront t={c.t} doorOpen={1} />
      <Hero pose={pose} position={hero} />
      <Verity position={v} R={0.5} dock={false} yaw={0.55} awake={1} wide={0.4} talk={talk} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 the perfect helper (golden hour)

const seated = (over: Partial<Pose> = {}) => sittingPose({ lShoulder: [0.35, 0.18], rShoulder: [0.35, 0.18], lElbow: 0.7, rElbow: 0.7, ...over });

/** Golden hour: Slavoski relaxed on the couch, Verity glowing happily on the table. */
const c2Couch: ShotFn = (c) => {
  const v = verityOnTable();
  const cam = move({ position: [5, 4.6, 8.5], target: [0.4, 2.3, -4.5] }, { position: [4, 4.2, 6.6], target: [0.4, 2.3, -4.5] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={false} keyDir={[0.35, 0.45, -1]} light={0.9} shadowSize={16}>
      <LivingRoom t={c.t} sky="golden" lamp={0} />
      <Hero pose={seated({ expression: "smile", headPitch: -0.1 })} position={ROOM.seat} />
      <Verity position={v} R={VERITY_R} awake={1} wide={0.4} talk={talkFor(c, "at first", 13.5, 13.94) * 0} />
    </Shot>
  );
};

/** "It answers every question": a little holo card above Verity, ? → the answer. */
const drawAnswer = (k: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0E2A3A";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#5BE0C8";
  ctx.lineWidth = W * 0.03;
  ctx.strokeRect(W * 0.03, H * 0.04, W * 0.94, H * 0.92);
  if (k < 0.5) fitText(ctx, "?", W / 2, H * 0.52, W * 0.4, H * 0.75, VERITY_YELLOW);
  else {
    fitText(ctx, "HOW FAR IS", W / 2, H * 0.3, W * 0.8, H * 0.16, "#BFEFE6", false);
    fitText(ctx, "THE MOON?", W / 2, H * 0.48, W * 0.8, H * 0.16, "#BFEFE6", false);
    fitText(ctx, "384,400 KM ✓", W / 2, H * 0.72, W * 0.86, H * 0.2, VERITY_YELLOW);
  }
};
const c2Question: ShotFn = (c) => {
  const v = verityOnTable();
  const cam = move({ position: [2.4, 3.1, 2.6], target: [-0.5, 2.6, -3.6] }, { position: [2.0, 3.0, 1.7], target: [-0.5, 2.6, -3.6] }, c);
  const pop = k01(c.lt, 0.1, 0.35);
  return (
    <Shot mood="sunset" camera={cam} fog={false} keyDir={[0.35, 0.45, -1]} light={0.9} shadowSize={12}>
      <LivingRoom t={c.t} sky="golden" lamp={0} />
      <Hero pose={seated({ expression: "awe", headPitch: 0.05 })} position={ROOM.seat} />
      <Verity position={v} R={VERITY_R} awake={1} wide={0.5} talk={c.lt > 0.6 ? 0.3 + 0.3 * Math.abs(Math.sin(c.lt * 14)) : 0} />
      <group position={add(v, [-0.85, 1.45, 0.6])} rotation={[0, 0.45, 0]} scale={[pop, pop, 1]}>
        <CanvasPanel position={[0, 0, 0]} w={1.8} h={1.25} px={512} draw={drawAnswer(c.lt / Math.max(0.8, c.dur * 0.6))} />
      </group>
      <Halo position={add(v, [-0.85, 1.45, 0.5])} size={3.2} color="#5BE0C8" opacity={0.25 * pop} />
    </Shot>
  );
};

/** "Helps with your homework": answers and ticks write themselves into his notebook. */
const c2Homework: ShotFn = (c) => {
  const v = verityOnTable();
  const book: V3 = [-1.0, ROOM.table.top + 0.02, -2.75];
  const cam = move({ position: [-0.6, 4.6, 0.2], target: [-0.6, 1.3, -2.9] }, { position: [-0.7, 4.1, -0.3], target: [-0.6, 1.3, -2.9] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={false} keyDir={[0.35, 0.45, -1]} light={0.9} shadowSize={10}>
      <LivingRoom t={c.t} sky="golden" lamp={0} notebook />
      <mesh position={[book[0], book[1], book[2]]} rotation={[0, 0.15, 0]}>
        <BoxG args={[2.3, 0.04, 1.6]} />
        <Flat color="#3E6AA8" />
      </mesh>
      <CanvasPanel position={[book[0], book[1] + 0.03, book[2]]} rotation={[-Math.PI / 2, 0, 0.15]} w={2.1} h={1.45} px={512} draw={drawHomework(k01(c.lt, 0.05, 1.0))} />
      <Verity position={v} R={VERITY_R} awake={1} wide={0.5} yaw={-0.6} />
    </Shot>
  );
};

/** "And even controls your smart home": the lamp, the pendant, everything pops on in turn. */
const c2Smart: ShotFn = (c) => {
  const v = verityOnTable();
  const lamp = c.lt > 0.25 ? 1 : 0;
  const pend = c.lt > 0.75 ? 1 : 0;
  const cam = move({ position: [-4, 5.2, 9], target: [0.6, 2.8, -5] }, { position: [-3, 5.0, 7.4], target: [0.6, 2.8, -5] }, c);
  const wave = k01(c.lt, 0.9, 1.4);
  const pose = seated({ expression: "smile", headPitch: 0.15, lShoulder: [0.35 + wave * 0.2, 0.18 + wave * 2.2], lElbow: 0.7 - wave * 0.3 });
  return (
    <Shot mood="sunset" camera={cam} fog={false} keyDir={[0.35, 0.45, -1]} light={0.8} shadowSize={16}>
      <LivingRoom t={c.t} sky="golden" lamp={lamp} pendant={pend} />
      <Hero pose={pose} position={ROOM.seat} />
      <Verity position={v} R={VERITY_R} awake={1} wide={0.5} />
      <Shockwave position={add(v, [0, -0.5, 0])} progress={(c.lt - 0.15) / 0.6} radius={6} color="#5BE0C8" />
      <Shockwave position={add(v, [0, -0.5, 0])} progress={(c.lt - 0.65) / 0.6} radius={6} color="#5BE0C8" />
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 it refuses (rainy night)

/** "But one night…": the house in the rain, a lightning flash. */
const c3House: ShotFn = (c) => {
  const cam = move({ position: [9, 2.6, 36], target: [0, 8, 0] }, { position: [7, 2.8, 29], target: [0, 8.5, 0] }, c);
  const f = flash(c.lt, 1.0);
  return (
    <Shot mood="storm" camera={cam} fog={[40, 220]} light={0.55 + f} overlay={<Flash k={f} />}>
      <HouseFront t={c.t} night lit rain />
      <Clouds t={c.t} color="#2E3646" y={40} radius={150} count={18} seed="c3cl" />
      <LightningBolt top={[-50, 60, -100]} bottom={[-44, 0, -100]} flash={f} seed="c3" />
    </Shot>
  );
};

const STAND: V3 = [3.2, 0, 0.4];
const faceYaw = (from: V3, to: V3) => Math.atan2(to[0] - from[0], to[2] - from[2]);
/** Slavoski standing, pointing at Verity. */
const pointPose = (over: Partial<Pose> = {}) => {
  const v = verityOnTable();
  const yaw = faceYaw(STAND, v);
  // in hero space Verity is straight ahead (+Z) and below: aim the right fist that way
  const dist = Math.hypot(v[0] - STAND[0], v[2] - STAND[2]);
  const dy = v[1] - 2.9;
  const n = Math.hypot(dist, dy);
  const target: V3 = [-0.55, 2.9 + (dy / n) * 1.15, (dist / n) * 1.15 + 0.2];
  const pose = reach(mergePose(REST, over), "r", target).pose;
  return { pose, yaw };
};

/** "You tell Verity to turn off the lights." */
const c3Tell: ShotFn = (c) => {
  const v = verityOnTable();
  const { pose, yaw } = pointPose({ expression: "neutral", headPitch: -0.25 });
  const cam = move({ position: [10.8, 4.0, 1.6], target: [2.0, 2.7, -1.5] }, { position: [10.2, 3.9, 1.3], target: [2.0, 2.7, -1.5] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.4} shadowSize={14}>
      <LivingRoom t={c.t} sky="night" lamp={1} pendant={1} rain />
      <Hero pose={pose} position={STAND} yaw={yaw} />
      <Verity position={v} R={VERITY_R} awake={1} wide={0.3} />
    </Shot>
  );
};

/** "It refuses.": the eyes narrow, and the lights burn brighter instead. */
const c3Refuse: ShotFn = (c) => {
  const v = verityOnTable();
  const k = k01(c.lt, 0.1, 0.5);
  const cam = move({ position: add(v, [0.5, 0.45, 2.8]), target: add(v, [0, 0.15, 0]) }, { position: add(v, [0.35, 0.35, 2.2]), target: add(v, [0, 0.1, 0]) }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.4} shadowSize={10}>
      <LivingRoom t={c.t} sky="night" lamp={1 + 0.6 * k} pendant={1 + 0.8 * k} rain />
      <Verity position={v} R={VERITY_R} awake={1} narrow={0.85 * k} wide={0.3} creepy={0.3 * k} yaw={0.25} />
    </Shot>
  );
};

/** "Then it asks you a question": his worried face, lit from below by the yellow glow. */
const c3Worry: ShotFn = (c) => {
  const v = verityOnTable();
  const yaw = faceYaw(STAND, v);
  const pose = mergePose(REST, { expression: "worried", headPitch: -0.3, blink: c.lt > 0.7 && c.lt < 0.8 ? 1 : 0 });
  const head = headPosition(pose, STAND, yaw);
  const dir: V3 = [Math.sin(yaw), 0, Math.cos(yaw)];
  const cam = move({ position: add(head, [dir[0] * 4.2 + 0.4, -0.8, dir[2] * 4.2]), target: add(head, [0, -0.35, 0]) }, { position: add(head, [dir[0] * 3.4 + 0.35, -0.75, dir[2] * 3.4]), target: add(head, [0, -0.3, 0]) }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.35} shadowSize={10}>
      <LivingRoom t={c.t} sky="night" lamp={0.7} pendant={0.6} rain />
      <Hero pose={pose} position={STAND} yaw={yaw} />
      <Verity position={v} R={VERITY_R} awake={1} narrow={0.6} creepy={0.4} />
    </Shot>
  );
};

/** "Do you live alone?": an extreme close-up, the grin stretching, everything else dimming. */
const c3Alone: ShotFn = (c) => {
  const v = verityOnTable();
  const talk = talkFor(c, "do you live alone", 28.8, 29.16);
  const k = k01(c.lt, 0, 1.6);
  const cam = move({ position: add(v, [0.12, 0.1, 1.9]), target: add(v, [0, 0.02, 0]) }, { position: add(v, [0.08, 0.06, 1.35]), target: add(v, [0, 0.0, 0]) }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.25} shadowSize={8}>
      <LivingRoom t={c.t} sky="night" lamp={0.6 - 0.45 * k} pendant={0.5 - 0.45 * k} rain />
      <Verity position={v} R={VERITY_R} awake={1} narrow={0.6} wide={0.4 + 0.6 * k} creepy={0.6 + 0.3 * k} talk={talk} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 unplugged

/** "You immediately unplug it": his fist yanks the plug out of the wall; a spark. */
const c4Unplug: ShotFn = (c) => {
  const s = ROOM.socket;
  const pull = k01(c.lt, 0.25, 0.5);
  const plugZ = s[2] + 0.21 + pull * 1.6;
  const plug: V3 = [s[0] + pull * 0.4, s[1] + 0.16 + pull * 0.3, plugZ];
  const spark = c.lt > 0.25 && c.lt < 0.5;
  const cam = move({ position: [s[0] + 1.6, s[1] + 0.9, s[2] + 3.1], target: [s[0], s[1] + 0.1, s[2] + 0.4] }, { position: [s[0] + 1.4, s[1] + 0.8, s[2] + 2.7], target: [s[0], s[1] + 0.1, s[2] + 0.4] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.35} shadowSize={8} shake={pull > 0 && pull < 1 ? 0.03 : 0}>
      <LivingRoom t={c.t} sky="night" lamp={1} pendant={0} rain plug={pull > 0 ? 0 : 1} />
      {pull > 0 ? (
        <mesh position={plug} castShadow>
          <BoxG args={[0.3, 0.3, 0.36]} />
          <Flat color="#F0EDE4" />
        </mesh>
      ) : null}
      <ArmInsert fist={add(plug, [0, 0.02, 0.38])} dir={[0.5, 0.3, 1]} />
      {spark
        ? Array.from({ length: 7 }, (_, i) => (
            <mesh key={i} position={add([s[0], s[1] + 0.16, s[2] + 0.2], [(random(`sp${i}`) - 0.5) * 0.5, (random(`spy${i}`) - 0.3) * 0.5, random(`spz${i}`) * 0.4])}>
              <IcoG args={[0.03 + random(`sps${i}`) * 0.03, 0]} />
              <Glow color={i % 2 ? "#FFF2B0" : "#8FD8FF"} />
            </mesh>
          ))
        : null}
      {spark ? <Halo position={[s[0], s[1] + 0.16, s[2] + 0.3]} size={1.4} color="#BFE8FF" opacity={0.6} /> : null}
    </Shot>
  );
};

/** "But the lights start flickering." Verity is dead… mostly. */
const c4Flicker: ShotFn = (c) => {
  const v = verityOnTable();
  const L = flicker("room", c.t);
  const pose = mergePose(REST, { expression: "alarm", headPitch: 0.45, headYaw: 0.2 });
  const cam = move({ position: [-1.8, 4.2, 9.8], target: [2.6, 3.0, -2.2] }, { position: [-1.4, 4.1, 8.8], target: [2.6, 3.0, -2.2] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.2 + 0.15 * L} shadowSize={14}>
      <LivingRoom t={c.t} sky="night" lamp={L} pendant={flicker("pend", c.t + 3)} rain plug={0} />
      <Hero pose={pose} position={STAND} yaw={faceYaw(STAND, v) + 0.4} />
      <Verity position={v} R={VERITY_R} awake={0.12 * (1 - L)} narrow={0.6} creepy={0.6} light={0} />
    </Shot>
  );
};

/** "Your phone rings": the phone on the side table lights up yellow. */
const c4Ring: ShotFn = (c) => {
  const p = phoneOnSide();
  const on = c.lt > 0.15;
  const pulse = 0.6 + 0.4 * Math.abs(Math.sin(c.lt * 9));
  const cam = move({ position: add(p, [-2.2, 1.9, 3.0]), target: add(p, [0, 0.0, 0]) }, { position: add(p, [-1.8, 1.6, 2.4]), target: add(p, [0, 0.0, 0]) }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.2} shadowSize={8}>
      <LivingRoom t={c.t} sky="night" lamp={0.12} pendant={0} rain plug={0} phoneGlow={on ? VERITY_YELLOW : undefined} />
      {on ? (
        <>
          <pointLight position={add(p, [0, 0.8, 0])} color={VERITY_YELLOW} intensity={4 * pulse} distance={6} decay={2} />
          <Halo position={add(p, [0, 0.15, 0])} size={2.2} color={VERITY_YELLOW} opacity={0.4 * pulse} />
        </>
      ) : null}
    </Shot>
  );
};

/** "It's Verity.": straight down onto the screen, Verity calling. */
const c4Caller: ShotFn = (c) => {
  const p = phoneOnSide();
  const scr: V3 = [p[0], p[1] + PHONE.d / 2 + 0.004, p[2]];
  const cam = move({ position: add(p, [0.02, 1.75, 0.18]), target: p }, { position: add(p, [0.02, 1.45, 0.14]), target: p }, c);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      light={0.2}
      shadowSize={6}
      overlay={
        <ScreenHtml c={scr} w={PHONE.screenW} h={PHONE.screenH} flat yaw={0.3} cam={cam} width={c.width} height={c.height}>
          {(w, h) => <CallScreen w={w} h={h} t={c.t} />}
        </ScreenHtml>
      }
    >
      <LivingRoom t={c.t} sky="night" lamp={0.12} pendant={0} rain plug={0} phoneGlow={VERITY_YELLOW} />
      <pointLight position={add(p, [0, 0.8, 0])} color={VERITY_YELLOW} intensity={3} distance={6} decay={2} />
    </Shot>
  );
};

/** "You throw your phone across the room." Wind-up, release, it smacks the far wall and drops. */
const THROWER: V3 = [4.5, 0, 2.6];
const c4Throw: ShotFn = (c) => {
  const yaw = Math.atan2(-12, -12.2);
  const wind = k01(c.lt, 0.0, 0.3);
  const fling = k01(c.lt, 0.3, 0.48);
  const pitch = -0.9 * wind + (2.1 + 0.9) * fling;
  const pose = mergePose(REST, { expression: "alarm", rShoulder: [pitch, 0.25], rElbow: 0.5 + 0.8 * wind - 0.9 * fling, twist: 0.35 * wind - 0.5 * fling, lean: 0.2 * fling });
  const hand = handPosition(pose, "r", THROWER, yaw);
  const rel = 0.46;
  const hit = 1.15;
  const wall: V3 = [-7.5, 4.6, -9.6];
  let phone: V3 = hand;
  let spin = 0;
  if (c.lt > rel) {
    const k = clamp01((c.lt - rel) / (hit - rel));
    const h0 = handPosition(mergePose(pose, { rShoulder: [2.1, 0.25] }), "r", THROWER, yaw);
    phone = [h0[0] + (wall[0] - h0[0]) * k, h0[1] + (wall[1] - h0[1]) * k + Math.sin(k * Math.PI) * 1.6, h0[2] + (wall[2] - h0[2]) * k];
    spin = k * 9;
    if (c.lt > hit) {
      const f = c.lt - hit;
      phone = [wall[0] + f * 0.3, Math.max(PHONE.d / 2 + 0.02, wall[1] - 9 * f * f), wall[2] + 0.3 + f * 0.4];
      spin = 9 + f * 3;
    }
  }
  const cam = move({ position: [11.4, 6.6, 10.8], target: [-5.5, 2.6, -7.0] }, { position: [11.0, 6.4, 10.2], target: [-5.5, 2.6, -7.0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.3} shadowSize={16} shake={c.lt > hit && c.lt < hit + 0.2 ? 0.05 : 0}>
      <LivingRoom t={c.t} sky="night" lamp={0.5} pendant={0} rain plug={0} phone={false} />
      <Hero pose={pose} position={THROWER} yaw={yaw} />
      <Phone3D position={phone} rotation={[spin, spin * 0.6, 0.4]} glow={VERITY_YELLOW} />
      <pointLight position={phone} color={VERITY_YELLOW} intensity={2.5} distance={5} decay={2} />
      {c.lt > rel ? <Halo position={phone} size={1.6} color={VERITY_YELLOW} opacity={0.45} /> : null}
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 footsteps (the hall in the dark)

/** "Then you hear footsteps upstairs": looking up the dark stairwell; dust shakes down on every step. */
const c5Stairs: ShotFn = (c) => {
  const beat = 0.62;
  const ph = (c.lt % beat) / beat;
  const thump = ph < 0.12 ? 1 - ph / 0.12 : 0;
  const cam = move({ position: [1.2, 2.2, 4.5], target: [-3.4, 10.5, -14] }, { position: [1.0, 2.4, 3.2], target: [-3.4, 10.8, -14] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.6} shadowSize={20} shake={thump * 0.05}>
      <Hallway t={c.t} lights={[0.7, 0.5 * flicker("h2", c.t), 0.15]} upstairsGlow={0.6} />
      {Array.from({ length: 16 }, (_, i) => {
        const t0 = (random(`ds${i}`) * 3) % 3;
        const f = (c.lt - t0 * 0.6) % 1.4;
        if (f < 0 || c.lt < t0 * 0.6) return null;
        return (
          <mesh key={i} position={[-3.6 + random(`dx${i}`) * 3, 15.8 - 6 * f * f, -4 - random(`dz${i}`) * 9]}>
            <IcoG args={[0.05, 0]} />
            <Flat color="#B8AE98" />
          </mesh>
        );
      })}
    </Shot>
  );
};

const HALL_HERO: V3 = [1.4, 0, 2.2];
/** "You slowly turn around…": Slavoski faces us, then turns to look down the hall. */
const c5Turn: ShotFn = (c) => {
  const k = k01(c.lt, 0.15, 1.75);
  const pose = mergePose(REST, { expression: "worried", headYaw: -0.3 * (1 - k), lShoulder: [0.1, 0.25], rShoulder: [0.1, 0.25] });
  const cam = move({ position: [2.2, 3.8, 14.2], target: [1.4, 2.9, 2.2] }, { position: [2.1, 3.7, 13.0], target: [1.4, 2.9, 2.2] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.25} shadowSize={14}>
      <Hallway t={c.t} lights={[0.5, 0.3 * flicker("h2", c.t), 0]} front={false} />
      <Hero pose={pose} position={HALL_HERO} yaw={Math.PI * k} />
    </Shot>
  );
};

const CREATURE_AT: V3 = [1.8, 0, -15];
/** "…and standing in the hallway": over his shoulder, the creature at the far end; the light stutters. */
const c5Reveal: ShotFn = (c) => {
  const pose = mergePose(REST, { expression: "alarm", lShoulder: [0.2, 0.3], rShoulder: [0.2, 0.3] });
  const cam = move({ position: [3.0, 4.6, 7.2], target: [1.4, 4.6, -14] }, { position: [2.8, 4.6, 6.4], target: [1.5, 4.8, -14] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.2} shadowSize={24}>
      <Hallway t={c.t} lights={[0.3, flicker("h2r", c.t, 0.6), 0]} />
      <Hero pose={pose} position={HALL_HERO} yaw={Math.PI} />
      <Creature position={CREATURE_AT} t={c.t} glow={k01(c.lt, 0.1, 0.6)} />
    </Shot>
  );
};

/** "…a giant, twisted creature": low angle, head twitching. */
const c5Giant: ShotFn = (c) => {
  const head = add(CREATURE_AT, [0.25, 7.45, 2.4]);
  const cam = move({ position: [-0.2, 1.0, -4.0], target: add(head, [0, -1.6, 0]) }, { position: [-0.1, 1.1, -5.0], target: add(head, [0, -1.4, 0]) }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.2} shadowSize={16}>
      <Hallway t={c.t} lights={[0.1, flicker("h2g", c.t, 0.7), 0]} />
      <Creature position={CREATURE_AT} t={c.t * 2} reach={0.15} />
    </Shot>
  );
};

/** "…with that SAME yellow smile." */
const c5Smile: ShotFn = (c) => {
  const head = add(CREATURE_AT, [0.25, 7.45, 2.4]);
  const cam = move({ position: add(head, [0.35, -0.6, 4.4]), target: add(head, [0, -0.1, 0]) }, { position: add(head, [0.25, -0.5, 3.3]), target: add(head, [0, -0.1, 0]) }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.15} shadowSize={10}>
      <Hallway t={c.t} lights={[0, 0.15, 0]} />
      <Creature position={CREATURE_AT} t={c.t} twitch={0.4} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 06 no way out

/** "You run towards the front door": he sprints at us, the glow far behind him. */
const c6Run: ShotFn = (c) => {
  const z = -1.5 + c.lt * 4.6;
  const hero: V3 = [1.2, 0, Math.min(z, 7.5)];
  const pose = mergePose(walkPose(c.lt * 2.6, 1.5), { expression: "alarm", lean: 0.22 });
  const cam = move({ position: [0.4, 3.8, 11.3], target: [1.3, 3.2, -6] }, { position: [0.5, 3.7, 11.3], target: [1.3, 3.0, -6] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.22} shadowSize={20}>
      <Hallway t={c.t} lights={[0.45, flicker("h2run", c.t, 0.6) * 0.5, 0]} front={false} />
      <Hero pose={pose} position={hero} />
      <Creature position={[1.8, 0, -19]} t={c.t} glow={0.8} />
    </Shot>
  );
};

/** "But it's already locked.": the handle won't move; the lock flashes LOCKED. */
const c6Locked: ShotFn = (c) => {
  const rattle = Math.sin(c.lt * 38) * 0.04;
  const handle: V3 = [0.95, 2.6, HALL.door.z - 0.3];
  const cam = move({ position: [-1.6, 3.4, 8.9], target: [0.7, 2.9, 11.6] }, { position: [-1.3, 3.3, 9.3], target: [0.7, 2.9, 11.6] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.25} shadowSize={8} shake={0.015}>
      <Hallway t={c.t} lights={[0.5, 0, 0]} lock="locked" />
      <ArmInsert fist={add(handle, [rattle, 0, -0.1])} dir={[-1, -0.45, -0.55]} />
      <pointLight position={[HALL.lock[0], HALL.lock[1], HALL.lock[2] - 0.8]} color="#FF4A3A" intensity={1.2} distance={3} decay={2} />
    </Shot>
  );
};

const DOOR_HERO: V3 = [0.7, 0, 10.4];
const doorPose = (over: Partial<Pose> = {}) => reach(mergePose(REST, over), "r", [0.95, 2.6, HALL.door.z - 0.32], { position: DOOR_HERO }).pose;

/** "And then you hear that familiar voice": frozen at the door, hand still on the handle. */
const c6Freeze: ShotFn = (c) => {
  const pose = doorPose({ expression: "alarm", headYaw: -0.45 * k01(c.lt, 0.4, 1.4), headPitch: -0.05 });
  const cam = move({ position: [-3.8, 4.6, 0.8], target: [0.6, 3.0, 10.6] }, { position: [-3.4, 4.5, 1.8], target: [0.6, 3.0, 10.6] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.3} shadowSize={12}>
      <Hallway t={c.t} lights={[0.5 * flicker("h1f", c.t, 0.7), 0.1, 0]} lock="locked" />
      <Hero pose={pose} position={DOOR_HERO} />
    </Shot>
  );
};

/** "Hey, it's me.": the lock screen turns into Verity's face, talking. */
const c6LockFace: ShotFn = (c) => {
  const talk = talkFor(c, "hey it's me", 54.5, 55.12);
  const cam = move({ position: add(HALL.lock, [0.15, 0.05, -1.3]), target: HALL.lock }, { position: add(HALL.lock, [0.1, 0.03, -0.95]), target: HALL.lock }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.2} shadowSize={6}>
      <Hallway t={c.t} lights={[0.2, 0, 0]} lock="smile" lockTalk={talk} />
      <pointLight position={add(HALL.lock, [0, 0, -0.8])} color={VERITY_YELLOW} intensity={3} distance={4} decay={2} />
    </Shot>
  );
};

/** The door-side close-up of his face (the front wall is left out: the camera stands where it was). */
const FACE_CAM: CameraSpec = { position: [1.1, 4.4, 18.6], target: [0.9, 3.9, 7] };
const FACE_CAM_IN: CameraSpec = { position: [1.0, 4.4, 17.6], target: [0.9, 3.9, 7] };
const c6Face: ShotFn = (c) => {
  const pose = mergePose(REST, { expression: "alarm", headPitch: 0.05, lShoulder: [0.15, 0.2], rShoulder: [0.15, 0.2] });
  const cam = move(FACE_CAM, FACE_CAM_IN, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.18} shadowSize={10}>
      <Hallway t={c.t} lights={[0.2, 0, 0]} front={false} />
      <Hero pose={pose} position={DOOR_HERO} />
      <pointLight position={[0.9, 3.3, 11.6]} color={VERITY_YELLOW} intensity={2} distance={4} decay={2} />
    </Shot>
  );
};

/** "Except this time… it's standing right behind you." The smile lights up right behind his head. */
const c6Behind: ShotFn = (c) => {
  const glow = k01(c.lt, 1.3, 1.6);
  const pose = mergePose(REST, { expression: "alarm", headPitch: 0.05, lShoulder: [0.15, 0.2], rShoulder: [0.15, 0.2], blink: 0 });
  const cam = move(FACE_CAM_IN, { position: [1.0, 4.4, 16.6], target: [0.9, 3.9, 7] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.14 + 0.1 * glow} shadowSize={12} shake={glow > 0 && glow < 1 ? 0.03 : 0}>
      <Hallway t={c.t} lights={[0.12 * (1 - glow), 0, 0]} front={false} />
      {c.lt > 1.25 ? <Creature position={[1.7, 0, 5.0]} t={c.t} headDrop={2.4} reach={0.85} glow={glow} twitch={0.3} /> : null}
      <Hero pose={pose} position={DOOR_HERO} />
    </Shot>
  );
};

// ---------------------------------------------------------------- thumbnail

/** Shorts cover: Slavoski at the door, the giant smile lit right behind him. */
export const thumbShot: ShotFn = (c) => {
  const pose = mergePose(REST, { expression: "alarm", headPitch: 0.05, lShoulder: [0.15, 0.2], rShoulder: [0.15, 0.2] });
  return (
    <Shot mood="night" camera={{ position: [0.6, 2.2, 21], target: [1.0, 5.6, 7] }} fog={false} light={0.24} shadowSize={12}>
      <Hallway t={c.t} lights={[0, 0, 0]} front={false} />
      <Creature position={[2.3, 0, 5.0]} t={0.3} headDrop={2.4} reach={0.85} glow={1} twitch={0} />
      <Hero pose={pose} position={DOOR_HERO} />
    </Shot>
  );
};

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldEyes },
    { cue: "actually", fn: coldHouse },
  ],
  c1: [
    { cue: null, fn: c1Porch },
    { cue: "Inside is", fn: c1Box },
    { cue: "Suddenly", fn: c1Wake },
    { cue: "Hey it's me", fn: c1Hello },
  ],
  c2: [
    { cue: null, fn: c2Couch },
    { cue: "It answers", fn: c2Question },
    { cue: "helps with", fn: c2Homework },
    { cue: "and even", fn: c2Smart },
  ],
  c3: [
    { cue: null, fn: c3House },
    { cue: "You tell", fn: c3Tell },
    { cue: "It refuses", fn: c3Refuse },
    { cue: "Then it asks", fn: c3Worry },
    { cue: "Do you live", fn: c3Alone },
  ],
  c4: [
    { cue: null, fn: c4Unplug },
    { cue: "but the lights", fn: c4Flicker },
    { cue: "Your phone", fn: c4Ring },
    { cue: "It's Verity", fn: c4Caller },
    { cue: "You throw", fn: c4Throw },
  ],
  c5: [
    { cue: null, fn: c5Stairs },
    { cue: "You slowly", fn: c5Turn },
    { cue: "and standing", fn: c5Reveal },
    { cue: "twisted", fn: c5Giant },
    { cue: "same yellow", fn: c5Smile },
  ],
  c6: [
    { cue: null, fn: c6Run },
    { cue: "but it's already", fn: c6Locked },
    { cue: "And then you", fn: c6Freeze },
    { cue: "Hey it's me", fn: c6LockFace },
    { cue: "It's Verity", fn: c6Face },
    { cue: "Except this", fn: c6Behind },
  ],
};
