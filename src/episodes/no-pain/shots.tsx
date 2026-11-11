/**
 * Shots for "What If Every Human Lost the Ability to Feel Pain?" (ep. 10).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * Arc: cold blue morning → sunny street and kitchen → floodlit evening stadium → golden playground →
 * clinic → night hospital in the rain → a dark bedroom where a dead smoke alarm says it all.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { StreetSet } from "../../slavoski/city";
import { BoxG, CylG, IcoG } from "../../slavoski/detail";
import { crowdLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Clouds, LeafyTree, Rain } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { CardLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import { handPosition, Hero, mergePose, reach, REST, walkPose, groundedBob, type Pose } from "../../slavoski/rig/Hero";
import { CanvasPanel } from "../../slavoski/screens";
import { FacetedEarth } from "../../slavoski/space";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import type { CuedShot } from "../../slavoski/timeline";
import { Clinic, HillRing, ScanHoop } from "../no-work-2036/props";
import { BED, Bedroom } from "../smart-animals/props";
import { AlarmClock, CITY, Phone3D } from "../ww3-countdown/props";
import {
  Ambulance,
  ArmBones,
  athleteLook,
  Bathroom,
  Bathtub,
  BurnGlow,
  coatLook,
  CreepingSmoke,
  DnaHelix,
  drawChart,
  drawDash,
  drawSignal,
  Germ,
  Hall,
  HospitalFront,
  Kitchen,
  KITCHEN,
  LabBench,
  LegBones,
  Nerves,
  PLAY,
  Playground,
  SmokeAlarm,
  Stadium,
  TUB,
} from "./props";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const startFrame = (c: ShotCtx) => Math.round((c.t - c.lt) * 30);

const Shot: React.FC<{ children: React.ReactNode; overlay?: React.ReactNode } & React.ComponentProps<typeof Stage>> = ({ children, overlay, ...stage }) => (
  <AbsoluteFill>
    <Stage {...stage}>{children}</Stage>
    {overlay}
  </AbsoluteFill>
);

/** A fist plus an orange sleeve, for close-up inserts where the full hero is off-screen. */
const ArmInsert: React.FC<{ fist: V3; dir: V3; glow?: number; t?: number }> = ({ fist, dir, glow = 0, t = 0 }) => {
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
      {glow > 0 ? <BurnGlow at={fist} k={glow} t={t} /> : null}
    </group>
  );
};

/** Kit street ×3.5 so it matches Slavoski (road |x| < 12.25, pavements to 21.35). `day` dims practicals. */
const BigStreet: React.FC<React.ComponentProps<typeof StreetSet> & { day?: boolean }> = ({ day = true, ...props }) => (
  <group scale={CITY}>
    <StreetSet {...props} lampsOn={!day} modify={day ? () => ({ power: 0.35 }) : undefined} />
  </group>
);


// ---------------------------------------------------------------- cold open: the hook

const WALL_HIT: [number, number] = [0.6, 3.4];
const PUNCH_HERO: V3 = [-0.4, 0, 1.6];

/** 0 s: a fist slams into a plaster wall. Cracks and dust. */
const coldPunch: ShotFn = (c) => {
  const k = k01(c.lt, 0.0, 0.18);
  const fist: V3 = [WALL_HIT[0], WALL_HIT[1], 1.6 - 1.36 * k];
  const crack = k01(c.lt, 0.18, 0.55);
  const cam = move({ position: [0.1, 3.6, 4.6], target: [0.6, 3.4, 0] }, { position: [0.15, 3.55, 4.0], target: [0.6, 3.4, 0] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={false} light={0.8} shadowSize={8} keyDir={[0.6, 0.6, 0.6]} shake={c.lt > 0.18 && c.lt < 0.45 ? 0.06 : 0}>
      <Hall crack={crack} t={c.t} hit={WALL_HIT} />
      <ArmInsert fist={fist} dir={[0.85, -0.3, 0.45]} />
    </Shot>
  );
};

/** Slavoski with his fist in the wall, turning to us with a completely blank face. The title comes in here. */
const fistInWall = (over: Partial<Pose> = {}) => reach(mergePose(REST, over), "r", [WALL_HIT[0], WALL_HIT[1], 0.26], { position: PUNCH_HERO, yaw: Math.PI }).pose;
const coldFace: ShotFn = (c) => {
  const pose = fistInWall({ expression: "neutral", headYaw: 0.75 * k01(c.lt, 0.1, 0.5), blink: c.lt > 0.7 && c.lt < 0.8 ? 1 : 0 });
  const cam = move({ position: [-5.6, 3.8, 2.6], target: [-0.1, 3.4, 0.9] }, { position: [-5.0, 3.8, 2.5], target: [-0.1, 3.4, 0.9] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={false} light={0.8} shadowSize={10} keyDir={[0.6, 0.6, 0.6]}>
      <Hall crack={1} t={c.t} hit={WALL_HIT} />
      <Hero pose={pose} position={PUNCH_HERO} yaw={Math.PI} />
    </Shot>
  );
};

/** "…suddenly lost the ability to feel pain?": his nerves glow, carrying signals to the brain… then go dark. */
const coldNerves: ShotFn = (c) => {
  const on = 1 - k01(c.lt, 1.9, 2.4);
  const pose = mergePose(REST, { expression: "neutral" });
  const cam = move({ position: [0.6, 3.0, 10.5], target: [0, 2.6, 0] }, { position: [0.5, 3.0, 9.4], target: [0, 2.6, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} stars={false} shadows={false} light={1}>
      <Hero pose={pose} position={[0, 0, 0]} ghost={0.25} />
      <Nerves pose={pose} position={[0, 0, 0]} t={c.t} on={on} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 feeling nothing

/** Slavoski sitting up in bed (ep. 4 placement). */
const BED_HERO: V3 = [BED.x, BED.mattressTop - (1.55 + 0.02 - 0.18), -2.55];
const bedPose = (over: Partial<Pose> = {}): Pose =>
  mergePose(REST, { lHip: [1.47, 0.06], rHip: [1.47, 0.06], lKnee: 0.04, rKnee: 0.04, lShoulder: [0.25, 0.25], rShoulder: [0.25, 0.25], lElbow: 0.5, rElbow: 0.5, ...over });

/** "Imagine waking up tomorrow…": a cold blue morning, the alarm, he sits up. */
const c1Wake: ShotFn = (c) => {
  const k = k01(c.lt, 0.3, 0.7);
  const pose = bedPose({ lean: -0.3 * (1 - k), headRoll: 0.3 * (1 - k), blink: 1 - k, expression: k > 0.5 ? "neutral" : "relief" });
  const cam = move({ position: [BED.x + 0.6, 4.6, 7.4], target: [BED.x - 1.0, 2.5, -2.6] }, { position: [BED.x + 0.5, 4.5, 6.8], target: [BED.x - 1.0, 2.6, -2.6] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={false} light={0.7} shadowSize={10} keyDir={[-1, 0.35, 0.1]}>
      <Bedroom lampOn={false} dawn />
      <Hero pose={pose} position={BED_HERO} />
      {/* on the nightstand top (y 1.1), in front of the lamp pole and below its shade (shade bottom 1.53) */}
      <group position={[0.1, 1.1, -2.98]} scale={0.6}>
        <AlarmClock position={[0, 0, 0]} yaw={0.25} />
      </group>
    </Shot>
  );
};

/** "…punching a wall…": the wind-up and the punch, from the side. */
const c1Punch: ShotFn = (c) => {
  const wind = k01(c.lt, 0.0, 0.2);
  const hit = k01(c.lt, 0.2, 0.34);
  const pose =
    hit > 0
      ? reach(mergePose(REST, { expression: "neutral", lean: 0.1 * hit }), "r", [WALL_HIT[0], WALL_HIT[1], 0.26 + (1 - hit) * 1.2], { position: PUNCH_HERO, yaw: Math.PI }).pose
      : mergePose(REST, { expression: "neutral", rShoulder: [-0.6 * wind, 0.3], rElbow: 0.4 + 1.2 * wind, twist: 0.3 * wind });
  const cam = move({ position: [6.0, 4.2, 5.4], target: [-0.2, 3.0, 0.8] }, { position: [5.6, 4.1, 5.0], target: [-0.2, 3.0, 0.8] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={false} light={0.8} shadowSize={10} keyDir={[0.6, 0.6, 0.6]} shake={hit >= 1 && c.lt < 0.55 ? 0.05 : 0}>
      <Hall crack={k01(c.lt, 0.34, 0.7)} t={c.t} hit={WALL_HIT} />
      <Hero pose={pose} position={PUNCH_HERO} yaw={Math.PI} />
    </Shot>
  );
};

/** "…and feeling absolutely NOTHING.": he turns, looks at his fist, shrugs. */
const FACE_HERO: V3 = [-0.6, 0, 2.6];
const c1Nothing: ShotFn = (c) => {
  const look = k01(c.lt, 0.4, 0.9);
  let pose = mergePose(REST, { expression: "neutral", headYaw: -0.45 * look, headPitch: -0.15 * look, blink: (c.lt > 1.3 && c.lt < 1.4) || (c.lt > 1.6 && c.lt < 1.7) ? 1 : 0 });
  pose = reach(pose, "r", [FACE_HERO[0] - 0.75, 3.05, FACE_HERO[2] + 0.85], { position: FACE_HERO }).pose;
  const cam = move({ position: [0.4, 3.7, 9.6], target: [-0.7, 3.3, 2.6] }, { position: [0.3, 3.65, 8.6], target: [-0.7, 3.3, 2.6] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={false} light={0.8} shadowSize={10} keyDir={[0.6, 0.6, 0.6]}>
      <Hall crack={1} t={c.t} hit={WALL_HIT} />
      <Hero pose={pose} position={FACE_HERO} />
    </Shot>
  );
};

/** "Sounds like a superpower, right?": a heroic pose, cape flapping, fist to the sky. */
const c1Super: ShotFn = (c) => {
  const up = k01(c.lt, 0, 0.35);
  const pose = mergePose(REST, { expression: "smile", headPitch: 0.25, lShoulder: [0.35, 0.12 + 2.45 * up], lElbow: 0.15, rShoulder: [0.1, 0.5], rElbow: 1.6 });
  const flap = Math.sin(c.t * 9) * 0.15;
  const cam = move({ position: [1.2, 1.6, 10], target: [0, 3.6, 0] }, { position: [1.0, 1.7, 9], target: [0, 3.7, 0] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={12} overlay={<CardLine text="SUPERPOWER?" y={420} appearFrame={startFrame(c) + 6} />}>
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <Flat color={P.grass} />
      </mesh>
      <HillRing radius={150} />
      {[-14, 12, -24, 22].map((x, i) => (
        <LeafyTree key={i} position={[x, 0, -18 - i * 3]} scale={3} seed={`sp${i}`} />
      ))}
      <Clouds t={c.t} color="#F4F6FA" y={40} radius={150} count={14} seed="sup" />
      {/* cape: pinned along the shoulder line just behind the back (torso back z −0.36, below the head), flapping out behind */}
      <group position={[0, 2.74, -0.42]} rotation={[0.3 + Math.abs(flap), 0, 0]}>
        <mesh position={[0, -1.1, 0]} castShadow>
          <BoxG args={[1.5, 2.2, 0.06]} />
          <Flat color={P.carRed} />
        </mesh>
      </group>
      <Hero pose={pose} position={[0, 0, 0]} />
      {Array.from({ length: 6 }, (_, i) => {
        const ph = (c.t * 0.9 + i / 6) % 1;
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * (1.6 + ph), 3.4 + Math.sin(a) * (1.4 + ph), 0.6]} rotation={[0, 0, ph * 4]}>
            <BoxG args={[0.18, 0.18, 0.18]} />
            <Glow color={P.amber} opacity={1 - ph} />
          </mesh>
        );
      })}
    </Shot>
  );
};

/** "Well, scientists know something terrifying.": the lab, the pain signal on screen going flat. */
const c1Lab: ShotFn = (c) => {
  const k = 1 - k01(c.lt, 0.3, 1.6);
  const worried = c.lt > 1.2;
  const cam = move({ position: [2.4, 4.4, 13], target: [2.4, 3.7, -1.8] }, { position: [2.4, 4.4, 11.8], target: [2.4, 3.8, -1.8] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} light={0.9} shadowSize={12}>
      <LabBench draw={drawSignal(c.t, k)} />
      <Hero pose={mergePose(REST, { expression: worried ? "alarm" : "neutral", headYaw: worried ? -0.5 : 0.6, headPitch: 0.15 })} position={[0.7, 0, 0.8]} yaw={0.25} look={coatLook(3)} />
      <Hero pose={mergePose(REST, { expression: worried ? "worried" : "neutral", headYaw: worried ? 0.4 : -0.6, headPitch: 0.15 })} position={[4.1, 0, 0.6]} yaw={-0.3} look={coatLook(8)} />
    </Shot>
  );
};

/** "Pain is actually one of the reasons you're still alive.": the nerve network as his guard. */
const c1Alive: ShotFn = (c) => {
  const pose = mergePose(REST, { expression: "neutral", headPitch: 0.1 });
  const a = -0.4 + k01(c.lt, 0, 3.2) * 0.8;
  const cam: CameraSpec = { position: [Math.sin(a) * 9, 2.4, Math.cos(a) * 9], target: [0, 2.6, 0] };
  return (
    <Shot mood="space" camera={cam} fog={false} stars={false} shadows={false} light={1} overlay={<CardLine text="PAIN KEEPS YOU ALIVE" y={420} appearFrame={startFrame(c) + 12} accent="#FFB050" />}>
      <Hero pose={pose} position={[0, 0, 0]} ghost={0.25} />
      <Nerves pose={pose} position={[0, 0, 0]} t={c.t} on={1} />
      <mesh position={[0, 2.3, 0]}>
        <IcoG args={[3.0, 2]} />
        <meshBasicMaterial color="#FFB050" wireframe transparent opacity={0.18} toneMapped={false} />
      </mesh>
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 the first hours

/** The sunny street with a signpost and two townsfolk; `focus` "bonk" (a man walks into the post) or "box" (a man drops a box on his foot). Both carry on smiling. */
/** BigStreet's pavement (x 12.25…21.35) is a 0.12 kit slab scaled ×3.5: people stand on its top, not on y = 0. */
const PAVE = 0.12 * CITY;
const streetBeat = (c: ShotCtx, focus: "bonk" | "box") => {
  const lt = c.lt;
  // A walks +Z along x = 16 and stops when his head (radius 0.68) meets the post (radius 0.15 at z = −4).
  const zStop = -4 - 0.15 - 0.7;
  const speed = 3.0;
  const tHit = (zStop + 9.5) / speed;
  const bonk = lt > tHit ? k01(lt, tHit, tHit + 0.12) - k01(lt, tHit + 0.3, tHit + 0.7) : 0;
  const side = k01(lt, tHit + 0.8, tHit + 1.4);
  const after = Math.max(0, lt - tHit - 1.4);
  const walking = lt < tHit || side > 0;
  const A: V3 = [16 + side * 1.6, PAVE, Math.min(-9.5 + lt * speed, zStop) - bonk * 0.25 + after * speed];
  let poseA = mergePose(walking ? walkPose(lt * 1.3, 0.8) : REST, { expression: lt > tHit + 0.5 ? "smile" : "neutral", headPitch: bonk * 0.35, lean: -0.15 * bonk });
  poseA = { ...poseA, bob: groundedBob({ ...poseA, bob: 0 }) };
  const headA: V3 = [A[0], PAVE + 4.6, A[2]];
  // B holds a wide box against his chest and drops it; it lands on the pavement touching his toes (toes at z = B.z + 0.49).
  const drop = focus === "box" ? k01(lt, 0.55, 0.85) : 0;
  const B: V3 = [19.2, PAVE, -6];
  const boxZ = B[2] + 0.49 + 0.4;
  const boxY = PAVE + 2.35 - drop * 1.95;
  const bounce = focus === "box" && lt > 0.85 ? Math.max(0, Math.sin(((lt - 0.85) / 0.25) * Math.PI)) * 0.12 * (lt < 1.1 ? 1 : 0) : 0;
  const holdB = 1 - drop;
  const poseB = mergePose(REST, { expression: lt > 1.2 ? "smile" : "neutral", headPitch: -0.45 * drop, lShoulder: [1.05 * holdB + 0.05, 0.12], rShoulder: [1.05 * holdB + 0.05, 0.12], lElbow: 0.15 + 0.5 * holdB, rElbow: 0.15 + 0.5 * holdB });
  const cam =
    focus === "bonk"
      ? move({ position: [6.0, 3.7, -1.0], target: [16, 2.8, -5.2] }, { position: [6.6, 3.6, -1.3], target: [16, 2.8, -5.0] }, c)
      : move({ position: [17.4, 3.4, 3.6], target: [19.2, 1.8, -5.4] }, { position: [17.6, 3.3, 2.8], target: [19.2, 1.8, -5.4] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[80, 320]} shadowSize={30} shake={bonk > 0.6 ? 0.02 : 0}>
      <BigStreet seed="pain" cars={false} lamps={false} />
      <Clouds t={c.t} color="#F4F6FA" y={45} radius={170} count={14} seed="ps" />
      <mesh position={[16, 3, -4]} castShadow>
        <CylG args={[0.15, 0.15, 6, 8]} />
        <Flat color={P.pole} />
      </mesh>
      <mesh position={[16, 6.2, -4]} castShadow>
        <BoxG args={[1.8, 1.0, 0.1]} />
        <Flat color="#2E5A8A" />
      </mesh>
      {focus === "bonk" ? (
        <>
          <Hero pose={poseA} position={A} look={crowdLook(4)} />
          {lt > tHit && lt < tHit + 1.6
            ? [0, 1, 2].map((i) => {
                const a = c.t * 5 + (i / 3) * Math.PI * 2;
                return (
                  <mesh key={i} position={[headA[0] + Math.cos(a) * 0.7, headA[1] + 0.25, headA[2] + Math.sin(a) * 0.7]} rotation={[0, a, 0.4]}>
                    <IcoG args={[0.12, 0]} />
                    <Glow color={P.amber} />
                  </mesh>
                );
              })
            : null}
        </>
      ) : null}
      {focus === "box" ? (
        <>
          <Hero pose={poseB} position={B} look={crowdLook(11)} />
          <mesh position={[B[0], boxY + bounce, boxZ]} rotation={[drop * 0.08, 0, 0]} castShadow>
            <BoxG args={[1.4, 0.8, 0.8]} />
            <Flat color="#B88A58" />
          </mesh>
        </>
      ) : null}
    </Shot>
  );
};
/** "Within hours, people would start injuring themselves…": a man walks smack into a signpost, smiles, carries on. */
const c2Bonk: ShotFn = (c) => streetBeat(c, "bonk");
/** "…without even realising it.": another drops a heavy box on his foot, beaming. */
const c2Box: ShotFn = (c) => streetBeat(c, "box");

/** Slavoski at the stove on his phone, his right hand resting on a hot pan. */
const STOVE_HERO: V3 = [0.4, 0, -1.25];
const PAN_RIM: V3 = [KITCHEN.pan[0] + 0.35, KITCHEN.counterTop + 0.55, KITCHEN.pan[2] + 0.3];
const panPose = (over: Partial<Pose> = {}, handOn = true, lift = 0) => {
  let pose = mergePose(REST, { expression: "smile", headPitch: -0.45, ...over });
  const target: V3 = handOn ? add(PAN_RIM, [0, lift * 1.2, lift * 0.8]) : add(PAN_RIM, [-0.5, 1.2, 0.9]);
  pose = reach(pose, "r", target, { position: STOVE_HERO, yaw: Math.PI }).pose;
  pose = reach(pose, "l", [STOVE_HERO[0] - 0.55, 2.75, STOVE_HERO[2] - 0.75], { position: STOVE_HERO, yaw: Math.PI }).pose;
  return pose;
};
const PhoneInLeft: React.FC<{ pose: Pose }> = ({ pose }) => {
  const h = handPosition(pose, "l", STOVE_HERO, Math.PI);
  return <Phone3D position={[h[0], h[1] + 0.5, h[2] - 0.05]} rotation={[-0.6, Math.PI, 0]} glow="#8FD0FF" />;
};

/** "Imagine accidentally touching a boiling hot pan.": scrolling his phone, his hand lands on the pan. */
const c2Pan: ShotFn = (c) => {
  const land = k01(c.lt, 0.5, 0.9);
  const pose = panPose({}, true, 1 - land);
  const cam = move({ position: [5.6, 4.0, 3.8], target: [0.9, 2.7, -1.8] }, { position: [5.0, 3.9, 3.3], target: [0.9, 2.7, -1.8] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} light={0.95} shadowSize={10} keyDir={[-0.4, 0.8, 0.6]}>
      <Kitchen t={c.t} hot={1} />
      <Hero pose={pose} position={STOVE_HERO} yaw={Math.PI} />
      <PhoneInLeft pose={pose} />
    </Shot>
  );
};

/** "Normally, you'd pull your hand away instantly.": what a normal body does: OW, snap back. */
const c2Normal: ShotFn = (c) => {
  const yank = k01(c.lt, 0.25, 0.4);
  const pose = panPose({ expression: yank > 0.3 ? "alarm" : "smile", headPitch: -0.45 + 0.5 * yank, lean: -0.15 * yank }, yank < 0.05, 0);
  const cam = move({ position: [4.2, 3.6, 2.2], target: [1.0, 2.9, -1.6] }, { position: [3.9, 3.55, 1.9], target: [1.0, 2.9, -1.6] }, c);
  return (
    <Shot
      mood="day"
      camera={cam}
      fog={false}
      light={0.95}
      shadowSize={10}
      keyDir={[-0.4, 0.8, 0.6]}
      shake={yank > 0 && yank < 1 ? 0.04 : 0}
      overlay={<CardLine text="NORMALLY" sub="YOU PULL AWAY IN A SPLIT SECOND" y={420} appearFrame={startFrame(c) + 4} accent="#7FD6A0" />}
    >
      <Kitchen t={c.t} hot={1} />
      <Hero pose={pose} position={STOVE_HERO} yaw={Math.PI} />
      <PhoneInLeft pose={pose} />
    </Shot>
  );
};

/** "But without pain, you might not notice…": his hand stays on the pan, glowing red. He keeps scrolling. */
const c2Burn: ShotFn = (c) => {
  const pose = panPose({ expression: "smile" });
  const fist = handPosition(pose, "r", STOVE_HERO, Math.PI);
  const cam = move({ position: [3.4, 3.4, 0.9], target: [1.2, 2.75, -1.8] }, { position: [3.1, 3.35, 0.6], target: [1.2, 2.75, -1.8] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} light={0.95} shadowSize={8} keyDir={[-0.4, 0.8, 0.6]} overlay={<CardLine text="NO PAIN" sub="NO WARNING" y={420} appearFrame={startFrame(c) + 6} accent="#FF6A4A" />}>
      <Kitchen t={c.t} hot={1} />
      <Hero pose={pose} position={STOVE_HERO} yaw={Math.PI} />
      <PhoneInLeft pose={pose} />
      <BurnGlow at={fist} k={k01(c.lt, 0.2, 2.4)} t={c.t} />
    </Shot>
  );
};

/** "…until your skin was seriously burned.": he finally looks: his hand is glowing red. */
const NOTICE_HERO: V3 = [0.4, 0, -0.9];
const c2Notice: ShotFn = (c) => {
  let pose = mergePose(REST, { expression: "alarm", headPitch: -0.1, headYaw: -0.25 });
  pose = reach(pose, "r", [NOTICE_HERO[0] - 0.7, 3.0, NOTICE_HERO[2] + 0.9], { position: NOTICE_HERO }).pose;
  const fist = handPosition(pose, "r", NOTICE_HERO);
  const cam = move({ position: [0.6, 3.7, 6.8], target: [0.1, 3.3, -0.9] }, { position: [0.5, 3.65, 6.0], target: [0.1, 3.3, -0.9] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} light={0.95} shadowSize={8} keyDir={[-0.4, 0.8, 0.6]} shake={c.lt < 0.3 ? 0.03 : 0}>
      <Kitchen t={c.t} hot={1} />
      <Hero pose={pose} position={NOTICE_HERO} />
      <BurnGlow at={fist} k={1} t={c.t} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 hidden damage

/** "And that's just the beginning.": from above, ambulances racing through town. */
const c3Town: ShotFn = (c) => {
  const cam = move({ position: [0, 70, 46], target: [0, 0, -36] }, { position: [0, 66, 42], target: [0, 0, -36] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[90, 360]} shadowSize={80}>
      <BigStreet seed="town" cars={false} />
      {[0, 1, 2, 3].map((i) => {
        const z = ((c.lt * 14 + i * 26) % 110) - 90;
        return <Ambulance key={i} position={[i % 2 ? 4.2 : -4.2, 0, i % 2 ? -z - 40 : z]} yaw={i % 2 ? Math.PI : 0} t={c.t + i * 0.3} />;
      })}
    </Shot>
  );
};

const RUN_Z = 1;
/** "Athletes could keep running…": a sprinter under the floodlights, the crowd on its feet. */
const c3Run: ShotFn = (c) => {
  const x = -8 + c.lt * 9;
  const pose0 = mergePose(walkPose(c.lt * 3.2, 1.7), { expression: "smile", lean: 0.25 });
  const pose = { ...pose0, bob: groundedBob({ ...pose0, bob: 0 }) };
  const cam: CameraSpec = { position: [x + 4, 3.6, 13], target: [x + 1, 3.0, -2] };
  return (
    <Shot mood="night" camera={cam} fog={[60, 260]} shadowSize={20} light={1.0}>
      <Stadium t={c.t} />
      <Hero pose={pose} position={[x, 0, RUN_Z]} yaw={Math.PI / 2} look={athleteLook(6, "#E8C84A")} />
    </Shot>
  );
};

/** "…on broken bones.": X-ray view: a cracked shin bone, still sprinting. */
const c3Xray: ShotFn = (c) => {
  const x = -1 + c.lt * 9;
  const pose0 = mergePose(walkPose(1.1 + c.lt * 3.2, 1.7), { expression: "smile", lean: 0.25 });
  const pose = { ...pose0, bob: groundedBob({ ...pose0, bob: 0 }) };
  const pos: V3 = [x, 0, RUN_Z];
  const cam: CameraSpec = { position: [x + 1.5, 2.4, 9], target: [x, 1.8, RUN_Z] };
  return (
    <Shot mood="night" camera={cam} fog={[60, 260]} shadowSize={20} light={0.6} overlay={<CardLine text="BROKEN BONE" sub="STILL RUNNING" y={420} appearFrame={startFrame(c) + 4} accent="#FF4A3A" />}>
      <Stadium t={c.t} />
      <Hero pose={pose} position={pos} yaw={Math.PI / 2} ghost={0.3} look={athleteLook(6, "#E8C84A")} />
      <LegBones pose={pose} position={pos} yaw={Math.PI / 2} side="r" fracture={1} t={c.t} />
      <LegBones pose={pose} position={pos} yaw={Math.PI / 2} side="l" />
    </Shot>
  );
};

/** "Children could injure themselves without knowing.": a kid leaps off the climbing frame, lands hard, giggles. */
const c3Play: ShotFn = (c) => {
  const s = 0.6;
  const j = k01(c.lt, 0.3, 1.1);
  const start: V3 = [0, PLAY.deck[1], 0.6];
  const end: V3 = [0.3, 0, 4.6];
  const kid: V3 = [start[0] + (end[0] - start[0]) * j, start[1] + (end[1] - start[1]) * j + Math.sin(j * Math.PI) * 1.4, start[2] + (end[2] - start[2]) * j];
  const squat = c.lt > 1.1 ? 1 - k01(c.lt, 1.3, 1.8) : 0;
  let pose = mergePose(REST, { expression: "smile", lShoulder: [0.3, 1.6 * (j > 0 && j < 1 ? 1 : 0.3)], rShoulder: [0.3, 1.6 * (j > 0 && j < 1 ? 1 : 0.3)], lHip: [0.9 * squat, 0.05], rHip: [0.9 * squat, 0.05], lKnee: 1.4 * squat, rKnee: 1.4 * squat, lean: 0.3 * squat });
  pose = { ...pose, bob: squat > 0 ? groundedBob(pose) : 0 };
  const knee = add(kid, [0.12, 0.75 * s, 0.25]);
  const cam = move({ position: [5.2, 3.8, 15], target: [0.3, 3.0, 2] }, { position: [4.8, 3.7, 13.8], target: [0.3, 3.0, 2] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[60, 280]} shadowSize={14}>
      <Playground />
      <Hero pose={pose} position={kid} yaw={0.3} scale={s} look={crowdLook(21)} />
      {c.lt > 1.2 ? <Halo position={knee} size={0.7} color="#FF6A3A" opacity={0.7} /> : null}
    </Shot>
  );
};

/** "And dangerous infections might go unnoticed…": a tiny cut, red spreading, germs multiplying. */
const c3Germs: ShotFn = (c) => {
  const n = Math.round(2 + k01(c.lt, 0, 2.2) * 14);
  const red = k01(c.lt, 0.3, 2.3);
  const cam = move({ position: [0, 2.6, 3.4], target: [0, 0, 0] }, { position: [0, 2.2, 2.8], target: [0, 0, 0] }, c);
  return (
    <Shot mood="dust" camera={cam} fog={false} stars={false} shadows={false} light={1.1} overlay={<CardLine text="INFECTION" sub="NO PAIN, NO WARNING" y={420} appearFrame={startFrame(c) + 8} accent="#6AC84A" />}>
      <mesh position={[0, -6, 0]}>
        <IcoG args={[6, 4]} />
        <Flat color={P.skin} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0.5]}>
        <planeGeometry args={[1.2, 0.08]} />
        <meshBasicMaterial color="#8A1A1A" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.4 + red * 1.6}>
        <circleGeometry args={[1, 24]} />
        <meshBasicMaterial color="#E83A2A" transparent opacity={0.35 * red} toneMapped={false} depthWrite={false} />
      </mesh>
      {Array.from({ length: n }, (_, i) => {
        const a = random(`gm${i}`) * Math.PI * 2;
        const d = 0.2 + random(`gmd${i}`) * (0.4 + red * 1.2);
        return <Germ key={i} position={[Math.cos(a) * d, 0.24 + random(`gmy${i}`) * 0.25, Math.sin(a) * d]} r={0.13} t={c.t + i} seed={`gm${i}`} />;
      })}
    </Shot>
  );
};

/** "…because the usual painful warning signs are missing.": the body's dashboard: every warning light dead. */
const c3Dash: ShotFn = (c) => {
  const cam = move({ position: [0.2, 2.6, 9.0], target: [0, 2.4, 0] }, { position: [0.15, 2.55, 8.2], target: [0, 2.4, 0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.4} shadowSize={8}>
      {/* a dark clinic wall with a wall-mounted monitor */}
      <mesh position={[0, 4, -0.3]} receiveShadow>
        <BoxG args={[16, 10, 0.3]} />
        <Flat color="#2A3040" />
      </mesh>
      <mesh position={[0, -0.05, 4]} receiveShadow>
        <BoxG args={[16, 0.1, 9]} />
        <Flat color="#3A4050" />
      </mesh>
      <mesh position={[0, 2.4, -0.05]} castShadow>
        <BoxG args={[2.6, 3.2, 0.2]} />
        <Flat color="#121318" />
      </mesh>
      <CanvasPanel position={[0, 2.4, 0.06]} w={2.2} h={2.8} px={768} draw={drawDash(c.t, k01(c.lt, 0.2, 1.2))} />
      <pointLight position={[0, 2.6, 2]} color="#8FB3D9" intensity={3} distance={8} decay={2} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 a real condition

/** "But here's where things get REALLY interesting.": his eyes light up; the camera whips round. */
const c4Interest: ShotFn = (c) => {
  const a = -0.5 + k01(c.lt, 0, 2.6) * 0.9;
  const pose = mergePose(REST, { expression: "awe", headPitch: 0.12, lShoulder: [0.3, 0.6], rShoulder: [0.3, 0.6], lElbow: 1.2, rElbow: 1.2 });
  const cam: CameraSpec = { position: [Math.sin(a) * 6.5, 3.8, Math.cos(a) * 6.5 + 2], target: [0, 3.4, 2] };
  return (
    <Shot mood="day" camera={cam} fog={false} light={0.95} shadowSize={12}>
      <Clinic />
      <Hero pose={pose} position={[0, 0, 2]} />
      {Array.from({ length: 7 }, (_, i) => {
        const ph = (c.t * 0.8 + i / 7) % 1;
        const ang = (i / 7) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(ang) * (1.3 + ph * 1.2), 3.6 + Math.sin(ang) * (1.0 + ph), 2.5]} rotation={[0, 0, ph * 4]}>
            <BoxG args={[0.16, 0.16, 0.16]} />
            <Glow color={P.amber} opacity={1 - ph} />
          </mesh>
        );
      })}
    </Shot>
  );
};

/** "There are actually people born with a rare condition…": a DNA helix, one rung glowing. */
const c4Dna: ShotFn = (c) => {
  const cam = move({ position: [0, 1.0, 16], target: [0, 0.4, 0] }, { position: [0, 0.8, 14], target: [0, 0.4, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} stars shadows={false} light={1.1} overlay={<CardLine text="RARE" sub="SOME PEOPLE ARE BORN WITH IT" y={420} appearFrame={startFrame(c) + 10} />}>
      <DnaHelix position={[0, 0, 0]} t={c.t} glow={9} />
    </Shot>
  );
};

/** "…called congenital insensitivity to pain.": Slavoski at the big wall chart in the clinic. */
const c4Chart: ShotFn = (c) => {
  let pose = mergePose(REST, { expression: "awe", headPitch: 0.25, headYaw: 0.3 });
  pose = reach(pose, "l", [-0.4, 4.2, -3.4], { position: [1.6, 0, -1.6], yaw: Math.PI + 0.35 }).pose;
  const cam = move({ position: [4.2, 4.8, 10.5], target: [-0.6, 4.8, -4.6] }, { position: [3.8, 4.8, 9.6], target: [-0.6, 4.9, -4.6] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} light={0.95} shadowSize={12}>
      <Clinic />
      <mesh position={[-1.2, 5.4, -4.82]}>
        <BoxG args={[5.4, 7.0, 0.1]} />
        <Flat color="#8A9AA6" />
      </mesh>
      <CanvasPanel position={[-1.2, 5.4, -4.76]} w={5.0} h={6.6} px={768} draw={drawChart} />
      <Hero pose={pose} position={[1.6, 0, -1.6]} yaw={Math.PI + 0.35} />
    </Shot>
  );
};

/** "They can experience serious injuries…": an X-ray of someone waving happily with a broken arm. */
const c4Fracture: ShotFn = (c) => {
  const wave = Math.sin(c.t * 7) * 0.25;
  const pose = mergePose(REST, { expression: "smile", lShoulder: [0.3, 2.3 + wave], lElbow: 0.5 });
  const cam = move({ position: [0.6, 3.4, 10], target: [0, 3.0, 0] }, { position: [0.5, 3.4, 9], target: [0, 3.0, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} stars={false} shadows={false} light={1} overlay={<CardLine text="INJURED" sub="AND FEELS NOTHING" y={420} appearFrame={startFrame(c) + 8} accent="#FF4A3A" />}>
      <Hero pose={pose} position={[0, 0, 0]} ghost={0.3} look={crowdLook(5)} />
      <ArmBones pose={pose} position={[0, 0, 0]} side="l" fracture={1} t={c.t} />
      <ArmBones pose={pose} position={[0, 0, 0]} side="r" />
    </Shot>
  );
};

/** "…and many need to constantly check their bodies for damage.": the daily check, ticking off a list. */
const c4Check: ShotFn = (c) => {
  const step = Math.floor(clamp01(c.lt / 3.2) * 4);
  const items = ["ARMS", "LEGS", "FEET", "SKIN"];
  const looks: Partial<Pose>[] = [
    { headYaw: 0.5, headPitch: -0.2, lShoulder: [1.2, 0.5], lElbow: 0.6 },
    { headPitch: -0.55, lean: 0.25 },
    { headPitch: -0.7, lean: 0.35 },
    { headYaw: -0.5, headPitch: -0.2, rShoulder: [1.2, 0.5], rElbow: 0.6 },
  ];
  const pose = mergePose(REST, { expression: "neutral", ...looks[Math.min(3, step)] });
  const list = items.map((it, i) => `${it} ${i < step ? "✓" : "·"}`).join("   ");
  const cam = move({ position: [1.0, 3.6, 9.5], target: [0, 3.2, 0.4] }, { position: [0.9, 3.55, 8.6], target: [0, 3.2, 0.4] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} light={0.95} shadowSize={10} overlay={<CardLine text="DAILY BODY CHECK" sub={list} y={420} appearFrame={startFrame(c) + 4} accent="#7FD6A0" />}>
      <Bathroom />
      <Hero pose={pose} position={[0, 0, 0.6]} look={crowdLook(5)} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 eight billion

/** "Now imagine this happening to EIGHT BILLION people.": the night side of Earth, every city lit. */
const c5Earth: ShotFn = (c) => {
  const cam = move({ position: [0, 0.6, 22], target: [0, 0, 0] }, { position: [0, 0.5, 20], target: [0, 0, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.45} keyDir={[-1, 0.3, -0.6]}>
      <FacetedEarth radius={3} rotation={[0.35, 1.6 + c.t * 0.05, 0]} cityLights={1} />
      <Halo position={[0, 0, -1]} size={10} color="#4F9BFF" opacity={0.25} />
    </Shot>
  );
};

/** "Hospitals would face enormous challenges.": a hospital at night in the rain, a queue of ambulances. */
const c5Hospital: ShotFn = (c) => {
  const cam = move({ position: [-13, 5, 48], target: [-3, 11, 0] }, { position: [-12, 5.2, 44], target: [-3, 11.5, 0] }, c);
  return (
    <Shot mood="storm" camera={cam} fog={[60, 260]} shadowSize={40} light={0.7}>
      <HospitalFront t={c.t} />
      {Array.from({ length: 6 }, (_, i) => (
        <Ambulance key={i} position={[-6 + i * 0.4, 0, 8 + i * 7.8]} yaw={Math.PI + 0.05} t={c.t + i * 0.37} />
      ))}
      <Rain center={[8, 10, 30]} size={[40, 22, 26]} t={c.t} count={600} seed="hos" thickness={0.06} opacity={0.5} />
    </Shot>
  );
};

/** "Doctors would have to rely much more heavily on examinations…": a doctor scans Slavoski head to toe. */
const c5Scan: ShotFn = (c) => {
  const y = 0.3 + ((Math.sin(c.lt * 2.2 - Math.PI / 2) + 1) / 2) * 3.9;
  const cam = move({ position: [3.2, 4.0, 13.5], target: [1.4, 2.8, 2.2] }, { position: [2.9, 3.9, 12.5], target: [1.4, 2.8, 2.2] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} light={0.95} shadowSize={12}>
      <Clinic />
      <Hero pose={mergePose(REST, { expression: "neutral", headPitch: -0.1 })} position={[0, 0, 2.6]} />
      <ScanHoop position={[0, y, 2.6]} r={1.45} />
      <Halo position={[0, y, 2.6]} size={3.5} color="#45E08A" opacity={0.25} />
      <Hero pose={mergePose(REST, { expression: "neutral", headYaw: -0.4, rShoulder: [1.0, 0.3], rElbow: 0.8 })} position={[3.6, 0, 2.6]} yaw={-0.9} look={coatLook(7)} />
    </Shot>
  );
};

/** "…and medical tests.": the lab bench, test tubes and a scan on the monitor. */
const c5Tests: ShotFn = (c) => {
  const cam = move({ position: [-1.4, 3.6, 3.4], target: [-2.4, 2.6, -1.6] }, { position: [-1.5, 3.5, 2.9], target: [-2.4, 2.6, -1.6] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} light={0.95} shadowSize={8} overlay={<CardLine text="SCANS · TESTS · CHECK-UPS" y={420} appearFrame={startFrame(c) + 3} accent="#7FD6A0" />}>
      <LabBench draw={drawSignal(c.t, 0)} />
    </Shot>
  );
};

/** "And everyday activities could become surprisingly dangerous.": a steaming, far-too-hot bath, and a big happy smile. */
const TUB_AT: V3 = [2.6, 0, 0.6];
const c5Bath: ShotFn = (c) => {
  const pose = mergePose(REST, { expression: "smile", headPitch: 0.05, lShoulder: [0.15, 0.35], rShoulder: [0.15, 0.35] });
  const cam = move({ position: [3.6, 4.6, 10.5], target: [2.6, 2.6, 0.6] }, { position: [3.4, 4.5, 9.6], target: [2.6, 2.6, 0.6] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} light={0.95} shadowSize={10} overlay={<CardLine text="EVERYDAY LIFE" sub="SURPRISINGLY DANGEROUS" y={420} appearFrame={startFrame(c) + 10} accent="#FF6A4A" />}>
      <Bathroom />
      <Bathtub position={TUB_AT} t={c.t} />
      <Hero pose={pose} position={[TUB_AT[0], TUB.floor, TUB_AT[2]]} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 06 the alarm system (a dark bedroom)

/** "Because here's the terrifying truth:": night, Slavoski looks straight at us. */
const c6Truth: ShotFn = (c) => {
  const cam = move({ position: [-1.4, 3.6, 9.8], target: [-1.8, 3.4, 1.6] }, { position: [-1.45, 3.6, 8.4], target: [-1.8, 3.45, 1.6] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.45} shadowSize={10}>
      <Bedroom lampOn />
      <Hero pose={mergePose(REST, { expression: "worried", headPitch: 0.05 })} position={[-1.8, 0, 1.6]} />
    </Shot>
  );
};

/** "…pain isn't your body's enemy.": the nerve network again, warm and friendly. */
const c6Friend: ShotFn = (c) => {
  const pose = mergePose(REST, { expression: "relief", headPitch: 0.1 });
  const cam = move({ position: [-2.2, 3.0, 9.4], target: [0, 2.6, 0] }, { position: [-1.8, 3.0, 8.4], target: [0, 2.6, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} stars={false} shadows={false} light={1}>
      <Hero pose={pose} position={[0, 0, 0]} ghost={0.25} />
      <Nerves pose={pose} position={[0, 0, 0]} t={c.t} on={1} />
      <Halo position={[0, 2.6, -0.5]} size={9} color="#FFB050" opacity={0.18} />
    </Shot>
  );
};

/** "It's your body's ALARM SYSTEM.": a smoke alarm on the ceiling, its red light blinking. */
const ALARM_AT: V3 = [0.4, 6.0, -1.0];
const c6Alarm: ShotFn = (c) => {
  const cam = move({ position: [1.6, 3.4, 2.4], target: ALARM_AT }, { position: [1.4, 3.6, 2.0], target: ALARM_AT }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.5} shadowSize={8} overlay={<CardLine text="PAIN = ALARM" y={420} appearFrame={startFrame(c) + 4} accent="#FF4A3A" />}>
      <Bedroom lampOn />
      <mesh position={[0, 6.05, 0]}>
        <BoxG args={[13, 0.1, 13]} />
        <Flat color="#4A4466" />
      </mesh>
      <SmokeAlarm position={ALARM_AT} t={c.t} />
    </Shot>
  );
};

/** "And without it…": a hand pulls the battery out. The light dies. */
const c6Battery: ShotFn = (c) => {
  const pull = k01(c.lt, 0.2, 0.7);
  const bat: V3 = [ALARM_AT[0] - 0.95 - pull * 1.2, ALARM_AT[1] - 0.12 - pull * 0.6, ALARM_AT[2]];
  const cam = move({ position: add(ALARM_AT, [-1.0, -3.4, 4.6]), target: add(ALARM_AT, [-1.25, -0.55, 0]) }, { position: add(ALARM_AT, [-1.0, -3.3, 4.2]), target: add(ALARM_AT, [-1.25, -0.55, 0]) }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.7} shadowSize={8}>
      <Bedroom lampOn />
      <mesh position={[0, 6.05, 0]}>
        <BoxG args={[13, 0.1, 13]} />
        <Flat color="#4A4466" />
      </mesh>
      <SmokeAlarm position={ALARM_AT} t={c.t} battery={1 - pull} />
      <ArmInsert fist={add(bat, [-0.49, -0.02, 0])} dir={[-0.5, -1, 0.6]} />
    </Shot>
  );
};

/** "…you might not realise something is killing you until it's too late.": he sleeps; smoke creeps in; the alarm stays dark. */
const c6Sleep: ShotFn = (c) => {
  const pose = bedPose({ lean: -0.32, headRoll: 0.3, blink: 1, expression: "relief" });
  const cam = move({ position: [BED.x + 2.2, 5.4, 10.2], target: [-0.1, 1.6, -0.8] }, { position: [BED.x + 1.8, 5.1, 8.6], target: [0.0, 1.7, -1.0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} light={0.35} shadowSize={10}>
      <Bedroom lampOn={false} />
      <mesh position={[0, 6.05, 0]}>
        <BoxG args={[13, 0.1, 13]} />
        <Flat color="#4A4466" />
      </mesh>
      <SmokeAlarm position={ALARM_AT} t={c.t} battery={0} />
      <Hero pose={pose} position={BED_HERO} />
      {/* in the open floor between the nightstand (z ≤ −2.85) and the bed (x ≥ 0.8) */}
      <CreepingSmoke from={[-1.7, 0, -1.8]} k={k01(c.lt, 0, 4)} t={c.t} width={0.6} maxReach={5} />
    </Shot>
  );
};

// ---------------------------------------------------------------- thumbnail

/** Shorts cover: fist buried in a cracked wall, his face completely blank. */
export const thumbShot: ShotFn = () => {
  let pose = mergePose(REST, { expression: "neutral", headPitch: 0.05 });
  pose = reach(pose, "r", [FACE_HERO[0] - 1.1, 3.0, FACE_HERO[2] + 0.7], { position: FACE_HERO }).pose;
  return (
    <Shot mood="dawn" camera={{ position: [0.2, 2.6, 13.5], target: [-0.3, 4.7, 0.5] }} fog={false} light={0.85} shadowSize={10} keyDir={[0.6, 0.6, 0.6]}>
      <Hall crack={1} t={0.6} hit={[0.9, 3.9]} />
      <Hero pose={pose} position={FACE_HERO} />
    </Shot>
  );
};

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldPunch },
    { cue: "human", fn: coldFace },
    { cue: "suddenly lost", fn: coldNerves },
  ],
  c1: [
    { cue: null, fn: c1Wake },
    { cue: "punching a wall", fn: c1Punch },
    { cue: "and feeling", fn: c1Nothing },
    { cue: "Sounds like", fn: c1Super },
    { cue: "Well scientists", fn: c1Lab },
    { cue: "Pain is actually", fn: c1Alive },
  ],
  c2: [
    { cue: null, fn: c2Bonk },
    { cue: "without even", fn: c2Box },
    { cue: "Imagine accidentally", fn: c2Pan },
    { cue: "Normally", fn: c2Normal },
    { cue: "But without pain", fn: c2Burn },
    { cue: "seriously burned", fn: c2Notice },
  ],
  c3: [
    { cue: null, fn: c3Town },
    { cue: "Athletes", fn: c3Run },
    { cue: "broken bones", fn: c3Xray },
    { cue: "Children could", fn: c3Play },
    { cue: "And dangerous", fn: c3Germs },
    { cue: "because the usual", fn: c3Dash },
  ],
  c4: [
    { cue: null, fn: c4Interest },
    { cue: "There are actually", fn: c4Dna },
    { cue: "called congenital", fn: c4Chart },
    { cue: "They can experience", fn: c4Fracture },
    { cue: "and many need", fn: c4Check },
  ],
  c5: [
    { cue: null, fn: c5Earth },
    { cue: "Hospitals", fn: c5Hospital },
    { cue: "Doctors would", fn: c5Scan },
    { cue: "medical tests", fn: c5Tests },
    { cue: "And everyday", fn: c5Bath },
  ],
  c6: [
    { cue: null, fn: c6Truth },
    { cue: "pain isn't", fn: c6Friend },
    { cue: "It's your body's", fn: c6Alarm },
    { cue: "And without it", fn: c6Battery },
    { cue: "you might not", fn: c6Sleep },
  ],
};
