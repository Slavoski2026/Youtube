/**
 * Shots for "What If Nobody Could Feel Fear?" (ep. 10), post-processed (bloom, depth of field on the camera target,
 * grade). Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 *
 * Arc: a blazing blue noon on top of a skyscraper above the clouds → a golden savanna → steel beams in the sky → an
 * abstract violet void (the brain) → a white lab → a desert canyon at dusk → night (a caveman's fire, the evolution
 * line) → the same skyscraper at sunset, where fear comes back and saves him. Nobody gets hurt on screen.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { BoxG } from "../../slavoski/detail";
import { Chimp, Quadruped } from "../../slavoski/critters";
import { crowdLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { CardLine } from "../../slavoski/Overlays";
import { CanvasPanel } from "../../slavoski/screens";
import { groundedBob, handPosition, headPosition, Hero, mergePose, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import { type CuedShot } from "../../slavoski/timeline";
import { Flames, SunDisc } from "../minecraft-mobs/props";
import { Brain, LightShaft, Motes, Word } from "../no-voices/props";
import { EyesInDark } from "../smart-animals/props";
import {
  AlphaPanel,
  Amygdala,
  BEAM,
  Canyon,
  Classroom,
  Downtown,
  drawSkullThought,
  ElectricFence,
  FearAlarm,
  FishTank,
  FUR,
  HoloHeart,
  IBeam,
  Lab,
  LABCOAT,
  PainStars,
  PATIENT,
  PLANK,
  PlankTowers,
  PostSign,
  ROOF,
  Savanna,
  SkyTower,
  Snake,
  ToyBrick,
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

// ---------------------------------------------------------------- the rooftop (noon and sunset)

/** Slavoski at the very edge of the roof, facing out (+X), toes at the edge. */
const EDGE: V3 = [ROOF.edge - 0.55, ROOF.y, 4];
const EDGE_YAW = Math.PI / 2;

const Rooftop: React.FC<{ t: number; sunset?: boolean }> = ({ t, sunset = false }) => (
  <>
    <SkyTower power={sunset ? 0.8 : 0.3} />
    <Downtown t={t} power={sunset ? 0.8 : 0.3} cloudTint={sunset ? "#F7B890" : "#F4F6FA"} />
    {sunset ? (
      <>
        <SunDisc position={[600, 330, -520]} r={34} color="#FFD08A" glow="#FF8A3A" halo={0.75} />
        <pointLight position={[60, 330, -40]} color="#FF9A5A" intensity={900} distance={160} decay={2} />
      </>
    ) : (
      <SunDisc position={[-400, 700, -500]} r={26} color="#FFF8E0" glow="#FFE2A0" halo={0.5} />
    )}
    <Motes center={[EDGE[0], ROOF.y + 4, EDGE[2]]} size={[20, 8, 20]} t={t} count={50} scale={0.04} color={sunset ? "#FFD8A0" : "#FFFFFF"} />
  </>
);
const NOON = { mood: "day" as const, fog: [200, 1400] as [number, number], keyDir: [-0.5, 0.9, 0.3] as V3, shadowSize: 40 };
const DUSK = { mood: "sunset" as const, fog: [200, 1400] as [number, number], keyDir: [0.75, 0.25, -0.6] as V3, shadowSize: 40 };

const edgePose = (over: Partial<Pose> = {}): Pose => mergePose(REST, { headPitch: -0.55, expression: "neutral", ...over });

/** 0 s: straight down past his sneakers — 300 metres to the street. */
const coldDrop: ShotFn = (c) => {
  const cam = move(
    { position: [EDGE[0] + 3.6, ROOF.y + 9.5, EDGE[2] + 2.4], target: [EDGE[0] + 2.4, ROOF.y - 60, EDGE[2] - 0.4], up: [-1, 0, 0], fov: 62 },
    { position: [EDGE[0] + 3.4, ROOF.y + 8.6, EDGE[2] + 2.2], target: [EDGE[0] + 2.4, ROOF.y - 60, EDGE[2] - 0.4], up: [-1, 0, 0], fov: 60 },
    c,
  );
  return (
    <Shot {...NOON} camera={cam} grade={{ focus: 9, dof: 0.3 }}>
      <Rooftop t={c.t} />
      <Hero pose={edgePose()} position={EDGE} yaw={EDGE_YAW} />
    </Shot>
  );
};

/** The swoop out: a tiny figure on the edge of a tower above the clouds. The title lands here. */
const coldTower: ShotFn = (c) => {
  const cam = move({ position: [70, ROOF.y - 22, 46], target: [EDGE[0], ROOF.y + 2, EDGE[2]] }, { position: [56, ROOF.y - 14, 36], target: [EDGE[0], ROOF.y + 2.5, EDGE[2]] }, c);
  return (
    <Shot {...NOON} camera={cam} grade={{ dof: 0.4 }}>
      <Rooftop t={c.t} />
      <Hero pose={edgePose({ headPitch: -0.4 })} position={EDGE} yaw={EDGE_YAW} />
    </Shot>
  );
};

/** "Imagine standing on top of a skyscraper": orbiting him at the edge, the city spread out below. */
const coldOrbit: ShotFn = (c) => {
  const a = -0.6 + c.lt * 0.25;
  const head = headPosition(edgePose(), EDGE, EDGE_YAW);
  const cam: CameraSpec = { position: [head[0] + Math.cos(a) * 9, head[1] + 1.5, head[2] + Math.sin(a) * 9], target: add(head, [0, -0.8, 0]) };
  return (
    <Shot {...NOON} camera={cam}>
      <Rooftop t={c.t} />
      <Hero pose={edgePose()} position={EDGE} yaw={EDGE_YAW} />
    </Shot>
  );
};

/** "Looking straight down": a vertigo dolly-zoom over his shoulder down the facade. */
const coldVertigo: ShotFn = (c) => {
  const k = k01(c.lt, 0, 1.2);
  const cam: CameraSpec = { position: [EDGE[0] + 1.7, ROOF.y + 3.0, EDGE[2] + 1.2], target: [EDGE[0] + 3.2, 0, EDGE[2] + 0.6], up: [-1, 0, 0], fov: 75 - 47 * k };
  return (
    <Shot {...NOON} camera={cam} grade={{ focus: 300, dof: 0.4 }} shake={0.02}>
      <Rooftop t={c.t} />
      <Hero pose={edgePose({ headPitch: -0.7 })} position={EDGE} yaw={EDGE_YAW} />
    </Shot>
  );
};

/** "…and feeling absolutely nothing": a calm close-up. He blinks. Not a flicker. */
const coldCalm: ShotFn = (c) => {
  const pose = edgePose({ headPitch: -0.25, headYaw: -0.45 * k01(c.lt, 0.6, 1.2), blink: c.lt > 1.0 && c.lt < 1.15 ? 1 : 0, expression: "neutral" });
  const head = headPosition(pose, EDGE, EDGE_YAW);
  const cam = move({ position: add(head, [3.4, -0.3, 4.4]), target: add(head, [0, -0.45, 0]) }, { position: add(head, [2.9, -0.3, 3.8]), target: add(head, [0, -0.4, 0]) }, c);
  return (
    <Shot {...NOON} camera={cam}>
      <Rooftop t={c.t} />
      <Hero pose={pose} position={EDGE} yaw={EDGE_YAW} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 no panic

/** His chest goes see-through: a slow, calm heart and a lazy 58 BPM trace. */
const c1Heart: ShotFn = (c) => {
  const pose = edgePose({ headPitch: -0.1 });
  const head = headPosition(pose, EDGE, EDGE_YAW);
  const heart: V3 = [head[0] + 0.05, head[1] - 1.35, head[2] - 0.15];
  const cam = move({ position: add(heart, [3.4, 0.6, 3.0]), target: add(heart, [0, 0.4, 0]) }, { position: add(heart, [2.9, 0.5, 2.5]), target: add(heart, [0, 0.4, 0]) }, c);
  return (
    <Shot {...NOON} camera={cam} overlay={<EcgOverlay t={c.t} bpm={58} />}>
      <Rooftop t={c.t} />
      <Hero pose={pose} position={EDGE} yaw={EDGE_YAW} ghost={0.38} />
      <HoloHeart position={heart} t={c.t} rate={0.95} size={0.28} />

    </Shot>
  );
};

/** A crisp heart-rate monitor in the upper third (HTML over the canvas). */
const EcgOverlay: React.FC<{ t: number; bpm: number }> = ({ t, bpm }) => {
  const per = 60 / bpm;
  const pts = Array.from({ length: 121 }, (_, x) => {
    const u = x / 120;
    const ph = ((((t - (1 - u) * 3) / per) % 1) + 1) % 1;
    const spike = ph < 0.05 ? Math.sin((ph / 0.05) * Math.PI) : ph < 0.08 ? -0.3 * Math.sin(((ph - 0.05) / 0.03) * Math.PI) : 0;
    return `${(u * 600).toFixed(1)},${(110 - spike * 80).toFixed(1)}`;
  }).join(" ");
  return (
    <div style={{ position: "absolute", left: 240, top: 330, width: 600, height: 190, background: "rgba(4,16,12,0.78)", border: "2px solid rgba(58,255,138,0.5)", borderRadius: 14, fontFamily: '"DejaVu Sans", sans-serif' }}>
      <div style={{ position: "absolute", left: 22, top: 14, color: "#9FB3D9", fontSize: 24, letterSpacing: "0.12em" }}>HEART RATE</div>
      <div style={{ position: "absolute", right: 22, top: 8, color: "#3AFF8A", fontSize: 40, fontWeight: 700 }}>{bpm} BPM</div>
      <svg width={600} height={190} style={{ position: "absolute", left: 0, top: 30 }}>
        <polyline points={pts} fill="none" stroke="#3AFF8A" strokeWidth={5} strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px #3AFF8A)" }} />
      </svg>
    </div>
  );
};

/** "Sounds like a superpower": hands on hips at the edge, sun blazing behind him. */
const heroPose = (t: number): Pose =>
  mergePose(REST, { lShoulder: [-0.25, 0.75], rShoulder: [-0.25, 0.75], lElbow: 1.9, rElbow: 1.9, headPitch: 0.15, expression: "smile", lean: -0.05 + Math.sin(t * 2) * 0.01 });
const c1Super: ShotFn = (c) => {
  const p: V3 = [EDGE[0] - 1.2, ROOF.y, EDGE[2]];
  const head = headPosition(heroPose(c.t), p, -Math.PI / 2 + 0.3);
  const cam = move({ position: add(head, [-6.5, -2.6, 4.2]), target: add(head, [0, -0.6, 0]) }, { position: add(head, [-5.6, -2.4, 3.6]), target: add(head, [0, -0.5, 0]) }, c);
  return (
    <Shot {...NOON} camera={cam} grade={{ bloom: 1.1 }}>
      <Rooftop t={c.t} />
      <Hero pose={heroPose(c.t)} position={p} yaw={-Math.PI / 2 + 0.3} />
      <SunDisc position={add(head, [40, 70, -30])} r={8} color="#FFF8E0" glow="#FFD08A" halo={0.7} />
      {[0, 1, 2].map((i) => (
        <LightShaft key={i} from={add(head, [38, 66, -28])} to={add(head, [-3 + i * 3, -6 - i, 3 - i * 2])} r0={2} r1={5 + i} color="#FFF0C8" opacity={0.05} />
      ))}
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 risk

/** From above: people strolling along roof edges as if they were pavements. */
const RISKERS: { p: V3; yaw: number; seed: number; sit?: boolean }[] = [
  { p: [ROOF.edge - 0.6, ROOF.y, -6], yaw: Math.PI, seed: 31 },
  { p: [-ROOF.edge + 0.6, ROOF.y, 8], yaw: 0, seed: 32 },
  { p: [4, ROOF.y, ROOF.edge - 0.6], yaw: Math.PI / 2, seed: 33 },
  { p: [-8, ROOF.y, -ROOF.edge + 0.9], yaw: Math.PI, seed: 34, sit: true },
];
const sitEdgePose = (over: Partial<Pose> = {}): Pose => {
  const p = mergePose(REST, { lHip: [1.5, 0.05], rHip: [1.5, 0.05], lKnee: 1.5, rKnee: 1.5, lShoulder: [0.3, 0.2], rShoulder: [0.3, 0.2], ...over });
  return p;
};
const c2Edges: ShotFn = (c) => {
  const cam = move({ position: [44, ROOF.y + 40, 52], target: [0, ROOF.y - 6, 0] }, { position: [38, ROOF.y + 34, 46], target: [0, ROOF.y - 6, 0] }, c);
  return (
    <Shot {...NOON} camera={cam} grade={{ dof: 0.3 }}>
      <Rooftop t={c.t} />
      {RISKERS.map((r, i) =>
        r.sit ? (
          // sitting on the edge, legs over the drop: hips at the deck edge, shins hanging outside
          <Hero key={i} pose={sitEdgePose()} position={[r.p[0], ROOF.y + 0.25 - 1.55, -ROOF.edge + 0.25]} yaw={Math.PI} look={crowdLook(r.seed)} />
        ) : (
          <Hero key={i} pose={walkPose(c.t * 1.1 + i * 0.3, 0.7)} position={[r.p[0] + Math.sin(r.yaw) * c.lt * 1.2, r.p[1], r.p[2] + Math.cos(r.yaw) * c.lt * 1.2]} yaw={r.yaw} look={crowdLook(r.seed)} />
        ),
      )}
    </Shot>
  );
};

/** "People might start taking risks": strolling across a plank between two towers, coffee in hand. */
const plankPose = (t: number): Pose => mergePose(walkPose(t * 1.2, 0.45), { lShoulder: [0.15, 1.3], rShoulder: [0.9, 0.3], rElbow: 1.5, lElbow: 0.2, expression: "smile", headPitch: 0.05 });
const c2Plank: ShotFn = (c) => {
  const x = -9 + c.lt * 3.2;
  const p: V3 = [x, PLANK.y, 0];
  const cam = move({ position: [x + 10, PLANK.y + 13, 36], target: [x + 0.5, PLANK.y - 4, 0] }, { position: [x + 9, PLANK.y + 12, 33], target: [x + 0.5, PLANK.y - 4, 0] }, c);
  const hand = handPosition(plankPose(c.t), "r", p, Math.PI / 2);
  return (
    <Shot {...NOON} camera={cam}>
      <PlankTowers />
      <Downtown t={c.t} skip={(bx, bz) => bz === 4 && bx >= 3 && bx <= 5} />
      <SunDisc position={[-400, 700, -500]} r={26} color="#FFF8E0" glow="#FFE2A0" halo={0.5} />
      <Hero pose={plankPose(c.t)} position={p} yaw={Math.PI / 2} look={crowdLook(36)} />
      {/* coffee cup sitting on top of the fist */}
      <mesh position={[hand[0], hand[1] + 0.22 + 0.2, hand[2]]} castShadow>
        <cylinderGeometry args={[0.15, 0.12, 0.4, 10]} />
        <meshLambertMaterial color="#E8E4DA" flatShading />
      </mesh>
    </Shot>
  );
};

/** The savanna. A lion roars at him. He keeps walking toward it. */
const LION: V3 = [-3, 0, -4.5];
const LION_SCALE = 2.7;
const c2Lion: ShotFn = (c) => {
  const roar = k01(c.lt, 0.15, 0.4) * (1 - k01(c.lt, 1.1, 1.4));
  const me: V3 = [3.2 - c.lt * 0.5, 0, 3.5 - c.lt * 0.65];
  const cam = move({ position: [6.5, 3.6, 12.5], target: [0.5, 3.0, -1] }, { position: [6.0, 3.5, 11.6], target: [0.5, 3.1, -1] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 400]} keyDir={[0.7, 0.6, 0.4]} shadowSize={30} shake={roar * 0.04}>
      <Savanna />
      <Quadruped kind="lion" position={LION} yaw={0.66} scale={LION_SCALE} headPitch={0.25 * roar} face={{ mouth: roar, brow: "angry", eyeOpen: 1 }} wag={c.t * 0.5} />
      <Hero pose={mergePose(walkPose(c.lt * 1.0, 0.6), { expression: "neutral", headPitch: 0.05 })} position={me} yaw={-2.48} />
    </Shot>
  );
};

/** "No longer frightening": a selfie with the lion, who looks more confused than he does. */
const selfiePose: Pose = mergePose(REST, { rShoulder: [1.75, 0.3], rElbow: 0.25, headPitch: 0.15, headYaw: -0.15, expression: "smile", lShoulder: [0.2, 0.35] });
const c2Selfie: ShotFn = (c) => {
  const me: V3 = [0.9, 0, 1.6];
  const hand = handPosition(selfiePose, "r", me);
  const cam = move({ position: [1.6, 4.0, 11.5], target: [0.2, 3.3, -1.2] }, { position: [1.4, 3.9, 10.3], target: [0.2, 3.3, -1.2] }, c);
  return (
    <Shot
      mood="day"
      camera={cam}
      fog={[60, 400]}
      keyDir={[0.7, 0.6, 0.4]}
      shadowSize={20}
      overlay={<AbsoluteFill style={{ background: "#FFFFFF", opacity: Math.max(0, 1 - Math.abs(c.lt - 0.7) / 0.08) * 0.8 }} />}
    >
      <Savanna />
      <Quadruped kind="lion" position={[-1.9, 0, -3.6]} yaw={0.25} scale={LION_SCALE} headYaw={0.3} headPitch={0.1} face={{ brow: "worried", eyeOpen: 1.2, look: [0.2, 0] }} />
      <Hero pose={selfiePose} position={me} />
      <group position={[hand[0], hand[1] + 0.22 + 0.42, hand[2]]} rotation={[0.15, Math.PI, 0]}>
        <mesh castShadow>
          <BoxG args={[0.42, 0.84, 0.06]} />
          <Flat color="#1A1C22" />
        </mesh>
      </group>
    </Shot>
  );
};

/** "Extreme heights?": lunch on a steel beam dangling above the clouds. */
const BEAM_ME: V3 = [-1.5, BEAM.y + 0.25 - 1.55, 0.18];
const lunchPose = (t: number): Pose =>
  mergePose(REST, { lHip: [1.52, 0.06], rHip: [1.52, 0.06], lKnee: 1.45 + Math.sin(t * 3) * 0.12, rKnee: 1.45 + Math.sin(t * 3 + 2) * 0.12, rShoulder: [0.95, 0.15], rElbow: 1.7, lShoulder: [0.15, 0.3], expression: "smile" });
const BeamScene: React.FC<{ t: number }> = ({ t }) => {
  const pose = lunchPose(t);
  const hand = handPosition(pose, "r", BEAM_ME);
  return (
    <>
      <IBeam sway={Math.sin(t * 0.6) * 0.01} />
      <Downtown t={t} />
      <SunDisc position={[-400, 700, -500]} r={26} color="#FFF8E0" glow="#FFE2A0" halo={0.5} />
      <Hero pose={pose} position={BEAM_ME} />
      {/* sandwich resting on the fist */}
      <group position={[hand[0], hand[1] + 0.22 + 0.12, hand[2]]}>
        <mesh>
          <BoxG args={[0.6, 0.1, 0.45]} />
          <Flat color="#E8C890" />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <BoxG args={[0.64, 0.06, 0.48]} />
          <Flat color="#5E9A4A" />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <BoxG args={[0.6, 0.1, 0.45]} />
          <Flat color="#E8C890" />
        </mesh>
      </group>
      <Hero pose={mergePose(REST, { lHip: [1.52, 0.06], rHip: [1.52, 0.06], lKnee: 1.45, rKnee: 1.45, expression: "smile", lShoulder: [0.3, 1.1], lElbow: 0.4 })} position={[3.5, BEAM.y + 0.25 - 1.55, 0.18]} look={crowdLook(38)} />
    </>
  );
};
const c2Beam: ShotFn = (c) => {
  const head = headPosition(lunchPose(c.t), BEAM_ME);
  const cam = move({ position: add(head, [2.4, -1.2, 9.5]), target: add(head, [0.8, -1.2, 0]) }, { position: add(head, [2.0, -1.0, 8.4]), target: add(head, [0.8, -1.1, 0]) }, c);
  return (
    <Shot {...NOON} camera={cam} fog={[300, 1600]}>
      <BeamScene t={c.t} />
    </Shot>
  );
};
/** "Just another view": pull way back — the beam is a red matchstick over a 260-metre drop. */
const c2View: ShotFn = (c) => {
  const k = k01(c.lt, 0, 1.0);
  const cam: CameraSpec = { position: [6 + k * 20, BEAM.y + 3 + k * 26, 12 + k * 70], target: [0, BEAM.y - 4 - k * 60, 0], fov: 40 + k * 18 };
  return (
    <Shot {...NOON} camera={cam} fog={[300, 1600]} grade={{ dof: 0.2 }}>
      <BeamScene t={c.t} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 the amygdala (void)

const VoidSet: React.FC<{ t: number; tint?: string }> = ({ t, tint = "#A85AFF" }) => (
  <>
    <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <meshLambertMaterial color="#0E0C1C" />
    </mesh>
    {Array.from({ length: 21 }, (_, i) => (
      <React.Fragment key={i}>
        <mesh position={[(i - 10) * 3, 0.01, -20]}>
          <BoxG args={[0.04, 0.01, 80]} />
          <Glow color={tint} opacity={0.22} />
        </mesh>
        <mesh position={[0, 0.01, (i - 10) * 3 - 20]}>
          <BoxG args={[80, 0.01, 0.04]} />
          <Glow color={tint} opacity={0.22} />
        </mesh>
      </React.Fragment>
    ))}
    <Motes center={[0, 5, 0]} size={[30, 10, 30]} t={t} count={110} color="#C8A8FF" scale={0.05} />
  </>
);

/** A see-through head; inside, the brain; deep inside, two tiny lights. */
const c3Holo: ShotFn = (c) => {
  const pose = mergePose(REST, {});
  const head = headPosition(pose, [0, 0, 0]);
  const brainAt: V3 = [head[0], head[1] + 0.1, head[2] - 0.02];
  const cam = move({ position: add(head, [1.2, 0.0, 6.5]), target: add(head, [0, -0.1, 0]) }, { position: add(head, [0.5, 0.05, 2.6]), target: add(head, [0, 0, 0]) }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} stars={false} light={0.5} shadows={false} grade={{ dof: 0.4 }}>
      <VoidSet t={c.t} tint="#5AD8FF" />
      <Hero pose={pose} position={[0, 0, 0]} ghost={0.4} />
      <Brain position={brainAt} scale={0.21} t={c.t} ghost={0.85} />
      <group position={brainAt} scale={0.21}>
        <Amygdala glow={0.5 + 0.3 * Math.sin(c.t * 4)} />
      </group>
    </Shot>
  );
};

const BRAIN_AT: V3 = [0, 6, 0];
const BRAIN_S = 2.4;
const BigBrain: React.FC<{ t: number; glow: number }> = ({ t, glow }) => (
  <>
    <Brain position={BRAIN_AT} scale={BRAIN_S} t={t} ghost={0.55} sparks={0.35} rotation={[0, Math.sin(t * 0.3) * 0.2, 0]} />
    <group position={BRAIN_AT} scale={BRAIN_S} rotation={[0, Math.sin(t * 0.3) * 0.2, 0]}>
      <Amygdala glow={glow} />
    </group>
  </>
);
/** "Deep inside your brain": flying into a giant wireframe brain. */
const c3Brain: ShotFn = (c) => {
  const cam = move({ position: [3, 7.5, 16], target: BRAIN_AT }, { position: [1.2, 6.4, 7.5], target: add(BRAIN_AT, [0, -0.6, 0.4]) }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} stars light={0.6} shadows={false}>
      <VoidSet t={c.t} />
      <BigBrain t={c.t} glow={0.4} />
      <pointLight position={[0, 9, 6]} color="#FF9AD8" intensity={60} distance={30} decay={2} />
    </Shot>
  );
};
/** "…called the amygdala": the two almonds blaze red; the label floats beside them. */
const c3Amygdala: ShotFn = (c) => {
  const mid = add(BRAIN_AT, [0, -0.42 * BRAIN_S, 0.25 * BRAIN_S]);
  const cam = move({ position: add(mid, [0.6, -1.2, 9.5]), target: mid }, { position: add(mid, [0.4, -1.0, 8.2]), target: mid }, c);
  const g = 0.5 + 0.5 * k01(c.lt, 0.1, 0.5);
  return (
    <Shot mood="space" camera={cam} fog={false} stars light={0.6} shadows={false} overlay={<CardLine text="AMYGDALA" sub="YOUR BRAIN'S THREAT DETECTOR" y={430} appearFrame={startFrame(c) + 6} accent="#FF5A5A" />}>
      <VoidSet t={c.t} />
      <BigBrain t={c.t} glow={g} />
    </Shot>
  );
};

/** "Helps process threats": THREAT! flies in, the amygdala flashes, signals race down to a pounding heart. */
const c3Process: ShotFn = (c) => {
  const k = k01(c.lt, 0, 0.6);
  const hit = c.lt > 0.6;
  const cam = move({ position: [0, 5.2, 20], target: [0, 4.6, 0] }, { position: [0, 5.0, 18], target: [0, 4.6, 0] }, c);
  const amy: V3 = [0, 8, 0];
  const heart: V3 = [0, 1.6, 0];
  const pulses = hit ? [0, 1, 2].map((i) => clamp01((c.lt - 0.6 - i * 0.15) / 0.5)) : [];
  return (
    <Shot mood="space" camera={cam} fog={false} stars light={0.6} shadows={false}>
      <VoidSet t={c.t} tint="#FF5A5A" />
      <Word text="THREAT!" position={[-6 + k * 4.2, 11 - k * 2.2, 0]} w={4} color="#FF5A5A" bright={1.8} opacity={1 - clamp01((c.lt - 0.6) / 0.2)} />
      <group position={amy} scale={3}>
        <Amygdala glow={hit ? 1 : 0.35} />
      </group>
      {pulses.map((p, i) =>
        p > 0 && p < 1 ? (
          <mesh key={i} position={[amy[0] + Math.sin(i * 2) * 0.6, amy[1] + (heart[1] - amy[1]) * p, 0]}>
            <octahedronGeometry args={[0.25, 0]} />
            <Glow color="#FF7A5A" />
          </mesh>
        ) : null,
      )}
      <mesh position={[0, (amy[1] + heart[1]) / 2, -0.1]}>
        <BoxG args={[0.05, amy[1] - heart[1], 0.05]} />
        <Glow color="#FF5A5A" opacity={0.35} />
      </mesh>
      <HoloHeart position={heart} t={c.t} rate={hit ? 2.6 : 1} size={0.9} />
      <Word text="RUN!" position={[3.4, 3.6, 0]} w={3} color="#FFBA58" bright={1.6} opacity={k01(c.lt, 1.0, 1.2)} />
    </Shot>
  );
};

/** The lab: a scientist at a scan of a rare patient's brain. */
const SCI: V3 = [-2.6, 0, -2.8];
const c3Lab: ShotFn = (c) => {
  const pose = mergePose(REST, { rShoulder: [1.25, 0.55], rElbow: 0.35, headYaw: 0.5, expression: "awe" });
  const cam = move({ position: [3.2, 4.6, 12], target: [-0.6, 4.4, -4] }, { position: [2.8, 4.5, 10.5], target: [-0.6, 4.5, -4] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.95} shadowSize={14} grade={{ dof: 0.5 }}>
      <Lab t={c.t} />
      <Hero pose={pose} position={SCI} yaw={0.55} look={LABCOAT} />
    </Shot>
  );
};
/** "Who feel dramatically less fear": the patient smiles, a snake round their shoulders. */
const PAT: V3 = [0.4, 0, 1.2];
const c3Patient: ShotFn = (c) => {
  const pose = mergePose(REST, { expression: "smile", headYaw: 0.15 + Math.sin(c.t * 1.2) * 0.06, lShoulder: [0.1, 0.2], rShoulder: [0.1, 0.2] });
  const head = headPosition(pose, PAT);
  const cam = move({ position: add(head, [1.4, -0.4, 7.2]), target: add(head, [0, -0.9, 0]) }, { position: add(head, [1.1, -0.35, 6.2]), target: add(head, [0, -0.85, 0]) }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.95} shadowSize={10}>
      <Lab t={c.t} />
      <Hero pose={pose} position={PAT} look={PATIENT} />
      <Snake at={PAT} t={c.t} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 no warning

/** "Losing fear doesn't mean losing intelligence": the board fills with equations as he points. */
const c4Board: ShotFn = (c) => {
  const me: V3 = [2.2, 0, -1.6];
  const pose = mergePose(REST, { lShoulder: [1.6, 0.4], lElbow: 0.2, headYaw: -0.6, expression: "smile" });
  const cam = move({ position: [2.6, 4.0, 12.5], target: [0.9, 3.9, -3] }, { position: [2.4, 3.9, 11.2], target: [0.9, 3.9, -3] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.95} shadowSize={14} overlay={<CardLine text="INTELLIGENCE: 100%" sub="FEAR: 0%" y={1180} appearFrame={startFrame(c) + 12} />}>
      <Classroom k={k01(c.lt, 0, 1.8)} />
      <Hero pose={pose} position={me} yaw={-0.75} />
    </Shot>
  );
};

/** "You could still recognise danger": reading the DANGER sign at the canyon rim at dusk. Nods. */
const RIM_ME: V3 = [1.2, 0, 3.4];
const c4Danger: ShotFn = (c) => {
  const pose = mergePose(REST, { headPitch: -0.1 + Math.sin(c.lt * 7) * 0.08 * k01(c.lt, 0.4, 0.6), expression: "neutral" });
  const head = headPosition(pose, RIM_ME, Math.PI);
  const cam = move({ position: [-2.6, 4.6, 10.5], target: [0.2, 3.7, 1.6] }, { position: [-2.3, 4.5, 9.4], target: [0.2, 3.7, 1.6] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[60, 420]} keyDir={[-0.7, 0.3, -0.6]} shadowSize={20} grade={{ dof: 0.4 }}>
      <Canyon />
      <PostSign position={[-0.6, 0, 1.0]} yaw={0.15} lines={["DANGER", "CLIFF EDGE"]} y={4.2} />
      <Hero pose={pose} position={RIM_ME} yaw={Math.PI} />
      <SunDisc position={[-160, 40, -400]} r={22} color="#FFD08A" glow="#FF8A3A" halo={0.65} />
    </Shot>
  );
};

/** "Feel pain": he steps on a toy brick. Stars. */
const c4Pain: ShotFn = (c) => {
  const lift = k01(c.lt, 0.08, 0.25);
  const base = mergePose(REST, { rHip: [0.55 * lift, 0.1], rKnee: 1.3 * lift, lShoulder: [0.2, 0.9 * lift], rShoulder: [0.2, 0.9 * lift], expression: lift > 0.5 ? "alarm" : "neutral", headPitch: -0.3 * lift });
  const pose = { ...base, bob: groundedBob(base) };
  const me: V3 = [0, 0, 0];
  const foot: V3 = [-0.3, 0, 0.1];
  const cam = move({ position: [3.4, 2.2, 7.6], target: [0, 1.8, 0] }, { position: [3.0, 2.1, 6.8], target: [0, 1.9, 0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.95} shadowSize={10}>
      <Classroom k={1} />
      <Hero pose={pose} position={me} />
      <ToyBrick position={[foot[0] - 0.05, 0, foot[2] + 0.3]} yaw={0.4} />
      <PainStars at={[foot[0], 1.2, foot[2] + 0.3]} t={c.t} k={k01(c.lt, 0.15, 0.3)} />
    </Shot>
  );
};

/** "…and understand that something might kill you": HIGH VOLTAGE. He gets it. */
const c4Voltage: ShotFn = (c) => {
  const me: V3 = [0.6, 0, 3.4];
  const pose = mergePose(REST, { headPitch: 0.05, expression: "worried", rShoulder: [0.9, 0.3], rElbow: 1.9 });
  const head = headPosition(pose, me, Math.PI);
  const cam = move({ position: add(head, [3.4, 0.4, 6.4]), target: add(head, [-1.2, 0.6, -2.4]) }, { position: add(head, [3.0, 0.35, 5.6]), target: add(head, [-1.2, 0.6, -2.4]) }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[60, 420]} keyDir={[-0.7, 0.3, -0.6]} shadowSize={16}>
      <Canyon />
      <group position={[0, 0, -0.5]}>
        <ElectricFence t={c.t} />
      </group>
      <Hero pose={pose} position={me} yaw={Math.PI} />
      <AlphaPanel position={add(head, [1.0, 1.5, 0.2])} rotation={[0, 0.4, 0]} w={2.2} h={1.6} draw={drawSkullThought} opacity={k01(c.lt, 0.3, 0.5)} />
    </Shot>
  );
};

/** "You just wouldn't feel the same emotional warning": the fear alarm, dark. It tries once. Nothing. */
const c4Alarm: ShotFn = (c) => {
  const flick = c.lt > 0.7 && c.lt < 0.78 ? 0.25 : 0;
  const cam = move({ position: [2.2, 2.6, 7.2], target: [0, 1.4, 0] }, { position: [1.8, 2.4, 6.0], target: [0, 1.4, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} stars light={0.45} shadowSize={8}>
      <VoidSet t={c.t} tint="#5A5E70" />
      <FearAlarm position={[0, 0, 0]} t={c.t} on={flick} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 why we fear

/** Long ago at night: an early human freezes behind a rock as eyes open in the dark. Fear keeps them alive. */
const c5Cave: ShotFn = (c) => {
  const me: V3 = [0.8, 0, 2];
  const base = mergePose(REST, { lHip: [1.1, 0.12], rHip: [1.1, 0.12], lKnee: 2.0, rKnee: 2.0, lean: 0.35, expression: "alarm", headPitch: 0.1, lShoulder: [0.7, 0.3], rShoulder: [0.7, 0.3], lElbow: 1.2, rElbow: 1.2 });
  const pose = { ...base, bob: groundedBob(base) };
  const cam = move({ position: [4.2, 3.2, 10], target: [0.4, 2.0, -1] }, { position: [3.6, 3.0, 8.8], target: [0.4, 2.0, -1] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[20, 140]} shadowSize={12} light={1.0}>
      <pointLight position={[3, 3, 5]} color="#9FB8FF" intensity={22} distance={14} decay={2} />
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[200, 0.1, 200]} />
        <Flat color="#2A2A22" />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[(random(`bush${i}`) - 0.5) * 30, 1.2, -6 - random(`bz${i}`) * 10]} scale={[1.6, 1, 1.2]} castShadow>
          <icosahedronGeometry args={[1.6 + random(`bs${i}`), 1]} />
          <meshLambertMaterial color={i % 2 ? "#1E3A2A" : "#24442E"} flatShading />
        </mesh>
      ))}
      <mesh position={[-0.4, 0.9, 3.4]} scale={[1.6, 1, 1.1]} castShadow>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshLambertMaterial color="#5A544E" flatShading />
      </mesh>
      <group scale={7}>
        <EyesInDark area={[-1.2, 1.0, 0.2, 0.42, -0.8, -0.74]} t={c.t} count={9} open={k01(c.lt, 0.1, 0.9)} seed="pred" />
      </group>
      <Hero pose={pose} position={me} yaw={Math.PI - 0.2} look={FUR} />
      <Flames position={[6, 0, -1]} size={1.0} t={c.t} seed="far" />
      <pointLight position={[6, 1.5, -1]} color="#FF9A4A" intensity={70} distance={16} decay={2} />
    </Shot>
  );
};

/** "Shaped by millions of years of evolution": a line from fish to Slavoski, an amygdala glowing in every head. */
const STEPS = [
  { x: -12, label: "500 MILLION YEARS AGO" },
  { x: -6, label: "300 MILLION" },
  { x: 0, label: "6 MILLION" },
  { x: 6, label: "300,000" },
  { x: 12, label: "TODAY" },
];
const Plinth: React.FC<{ x: number; label: string }> = ({ x, label }) => (
  <group position={[x, 0, 0]}>
    <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
      <BoxG args={[4.4, 0.8, 3.2]} />
      <Flat color="#2A2E3A" />
    </mesh>
    <mesh position={[0, 0.81, 0]}>
      <BoxG args={[4.2, 0.02, 3.0]} />
      <Glow color="#5AD8FF" opacity={0.35} />
    </mesh>
    <CanvasPanel
      position={[0, 0.42, 1.61]}
      w={4.0}
      h={0.5}
      px={512}
      glow
      draw={(ctx, W, H) => {
        ctx.fillStyle = "#14181F";
        ctx.fillRect(0, 0, W, H);
        ctx.font = `700 ${Math.round(H * 0.5)}px "Slavoski Sans", "DejaVu Sans", sans-serif`;
        ctx.fillStyle = "#FFBA58";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, W / 2, H * 0.55, W * 0.92);
      }}
    />
  </group>
);
const AmyDot: React.FC<{ at: V3; t: number; i: number }> = ({ at, t, i }) => (
  <>
    <mesh position={at}>
      <octahedronGeometry args={[0.12, 0]} />
      <Glow color="#FF4A4A" opacity={0.7 + 0.3 * Math.sin(t * 4 + i)} />
    </mesh>
    <Halo position={at} size={1.6} color="#FF4A4A" opacity={0.5} />
  </>
);
const c5Evolution: ShotFn = (c) => {
  const x = -10 + k01(c.lt, 0, Math.min(3.6, span(c.dur) + 0.3)) * 20;
  const cam: CameraSpec = { position: [x + 1.6, 5.2, 13], target: [x, 2.6, 0], fov: 46 };
  const humanPose = mergePose(REST, { expression: "neutral" });
  const caveHead = headPosition(humanPose, [6, 0.8, 0]);
  const meHead = headPosition(humanPose, [12, 0.8, 0]);
  return (
    <Shot mood="space" camera={cam} fog={false} stars light={0.75} shadowSize={20}>
      <VoidSet t={c.t} tint="#5AD8FF" />
      {STEPS.map((s) => (
        <Plinth key={s.x} x={s.x} label={s.label} />
      ))}
      <FishTank position={[-12, 0.8, 0]} t={c.t} />
      <AmyDot at={[-12 + Math.sin(c.t * 1.5) * 0.4 + 0.1, 3.05 + Math.sin(c.t * 2.2) * 0.15, Math.cos(c.t * 1.5) * 0.3]} t={c.t} i={0} />
      <Quadruped kind="rat" position={[-6, 0.8, 0]} scale={4.2} fur="#4E8A4A" walk={0} headYaw={Math.sin(c.t) * 0.3} face={{ eyeOpen: 1 }} />
      <AmyDot at={[-6, 0.8 + 0.62 * 4.2 * 0.5 + 0.5, 1.3]} t={c.t} i={1} />
      <Chimp position={[0, 0.8, 0]} scale={2.1} headYaw={Math.sin(c.t * 0.8) * 0.3} face={{ eyeOpen: 1 }} />
      <AmyDot at={[0, 0.8 + 2.1 * 1.5, 0.9]} t={c.t} i={2} />
      <Hero pose={humanPose} position={[6, 0.8, 0]} look={FUR} />
      <AmyDot at={add(caveHead, [0, 0, 0.75])} t={c.t} i={3} />
      <Hero pose={mergePose(humanPose, { expression: "smile" })} position={[12, 0.8, 0]} />
      <AmyDot at={add(meHead, [0, 0, 0.75])} t={c.t} i={4} />
    </Shot>
  );
};

/** Sunset, the same edge. He looks down — and this time his body screams. */
const c5Return: ShotFn = (c) => {
  const k = k01(c.lt, 0.3, 0.8);
  const base = edgePose({ expression: k > 0.4 ? "alarm" : "neutral", headPitch: -0.6 + k * 0.2, lean: -0.15 * k, lShoulder: [0.3, 0.2 + 1.0 * k], rShoulder: [0.3, 0.2 + 1.0 * k], lKnee: 0.35 * k, rKnee: 0.35 * k, lHip: [0.2 * k, 0.05], rHip: [0.2 * k, 0.05] });
  const pose = { ...base, bob: groundedBob(base) };
  const p: V3 = [EDGE[0] - 0.1 * k + Math.sin(c.t * 40) * 0.015 * k, EDGE[1], EDGE[2]];
  const head = headPosition(pose, p, EDGE_YAW);
  const cam = move({ position: add(head, [3.2, -0.6, 4.6]), target: add(head, [0, -0.5, 0]) }, { position: add(head, [2.7, -0.5, 3.9]), target: add(head, [0, -0.45, 0]) }, c);
  return (
    <Shot {...DUSK} camera={cam} shake={0.03 * k}>
      <Rooftop t={c.t} sunset />
      <Hero pose={pose} position={p} yaw={EDGE_YAW} />
    </Shot>
  );
};

/** "Remember": the fear alarm switches ON — red light sweeping everywhere. */
const c5AlarmOn: ShotFn = (c) => {
  const on = k01(c.lt, 0.0, 0.15);
  const cam = move({ position: [2.6, 2.4, 7.4], target: [0, 1.4, 0] }, { position: [2.1, 2.2, 6.0], target: [0, 1.5, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} stars light={0.5} shadowSize={8} shake={0.04}>
      <VoidSet t={c.t} tint="#FF5A5A" />
      <FearAlarm position={[0, 0, 0]} t={c.t} on={on} />
    </Shot>
  );
};

/** "That fear might be the very reason…": he backs away from the edge, hand on his pounding heart. */
const c5Back: ShotFn = (c) => {
  const k = k01(c.lt, 0, 1.0);
  const p: V3 = [EDGE[0] - 0.4 - k * 5.5, ROOF.y, EDGE[2]];
  const pose = mergePose(walkPose(-c.lt * 1.2, 0.6 * (1 - k01(c.lt, 0.9, 1.2))), { expression: k > 0.8 ? "relief" : "worried", rShoulder: [1.0, -0.15], rElbow: 1.75, headPitch: -0.1 });
  const head = headPosition(pose, p, EDGE_YAW);
  const heart: V3 = [head[0] + 0.5, head[1] - 1.3, head[2] + 0.15];
  const cam = move({ position: add(head, [5.0, -0.8, 3.6]), target: add(head, [0, -0.6, 0]) }, { position: add(head, [4.3, -0.7, 3.1]), target: add(head, [0, -0.6, 0]) }, c);
  return (
    <Shot {...DUSK} camera={cam}>
      <Rooftop t={c.t} sunset />
      <Hero pose={pose} position={p} yaw={EDGE_YAW} />
      <HoloHeart position={heart} t={c.t} rate={2.4} size={0.2} />
    </Shot>
  );
};

/** "…you're still alive": wide at sunset, sitting safely on the helipad as the city lights up below. */
const c5Alive: ShotFn = (c) => {
  const base = mergePose(REST, { lHip: [1.5, 0.15], rHip: [1.5, 0.15], lKnee: 1.6, rKnee: 1.6, lean: 0.1, lShoulder: [0.4, 0.3], rShoulder: [0.4, 0.3], lElbow: 1.1, rElbow: 1.1, expression: "relief", headPitch: 0.15 });
  const pose = { ...base, bob: groundedBob(base) };
  const me: V3 = [-4, ROOF.y, -1];
  const cam = move({ position: [30, ROOF.y + 8, 30], target: [-4, ROOF.y + 2, -1] }, { position: [44, ROOF.y + 14, 44], target: [-4, ROOF.y + 1, -1] }, c);
  return (
    <Shot {...DUSK} camera={cam}>
      <Rooftop t={c.t} sunset />
      <Hero pose={pose} position={me} yaw={0.8} />
    </Shot>
  );
};

// ---------------------------------------------------------------- thumbnail

/** Slavoski at the very edge, toes over a 300 m drop, totally calm; the city and clouds far below. */
export const thumbShot: ShotFn = () => {
  const pose = edgePose({ headPitch: -0.2, headYaw: 0.5, expression: "smile" });
  const feet: V3 = [EDGE[0] + 0.3, ROOF.y + 0.4, EDGE[2]];
  const cam: CameraSpec = { position: [EDGE[0] + 9, ROOF.y - 5, EDGE[2] + 7], target: add(feet, [0, 5, 0]), fov: 60 };
  const focus = Math.hypot(cam.position[0] - EDGE[0], cam.position[1] - (ROOF.y + 3), cam.position[2] - EDGE[2]);
  return (
    <Stage {...NOON} camera={cam} grade={{ focus, dof: 0.5 }}>
      <Rooftop t={0} />
      <Hero pose={pose} position={EDGE} yaw={EDGE_YAW} />
    </Stage>
  );
};

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldDrop },
    { cue: "suddenly", fn: coldTower },
    { cue: "Imagine", fn: coldOrbit },
    { cue: "looking straight", fn: coldVertigo },
    { cue: "and feeling", fn: coldCalm },
  ],
  c1: [
    { cue: null, fn: c1Heart },
    { cue: "Sounds like", fn: c1Super },
  ],
  c2: [
    { cue: null, fn: c2Edges },
    { cue: "People might", fn: c2Plank },
    { cue: "Dangerous animals", fn: c2Lion },
    { cue: "No longer", fn: c2Selfie },
    { cue: "Extreme heights", fn: c2Beam },
    { cue: "Just another", fn: c2View },
  ],
  c3: [
    { cue: null, fn: c3Holo },
    { cue: "Deep inside", fn: c3Brain },
    { cue: "the amygdala", fn: c3Amygdala },
    { cue: "helps process", fn: c3Process },
    { cue: "Scientists", fn: c3Lab },
    { cue: "who feel", fn: c3Patient },
  ],
  c4: [
    { cue: null, fn: c4Board },
    { cue: "recognize danger", fn: c4Danger },
    { cue: "feel pain", fn: c4Pain },
    { cue: "and understand", fn: c4Voltage },
    { cue: "You just", fn: c4Alarm },
  ],
  c5: [
    { cue: null, fn: c5Cave },
    { cue: "It's a survival", fn: c5Evolution },
    { cue: "So the next", fn: c5Return },
    { cue: "remember", fn: c5AlarmOn },
    { cue: "that fear", fn: c5Back },
    { cue: "still alive", fn: c5Alive },
  ],
};
