/**
 * Shots for "What If Your Girlfriend Was Stronger Than You?" (ep. 9).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * Arc: sunrise kitchen → bright midday car park → neon gym at dusk → overcast, windy moving day →
 * sunny airfield (day 3) → sunset kitchen. Comedy, non-graphic.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Car, Ground, Lamp, Plane, Road, StreetSet } from "../../slavoski/city";
import { BoxG, IcoG } from "../../slavoski/detail";
import { crowdLook, suitLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Clouds } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { CardLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import { handPosition, headPosition, Hero, lerpPose, mergePose, reach, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { sittingPose } from "../../slavoski/room";
import { CanvasPanel, ScreenHtml } from "../../slavoski/screens";
import { lerpCam, project, Stage, type CameraSpec } from "../../slavoski/Stage";
import { wordAt, type CuedShot } from "../../slavoski/timeline";
import { HillRing, Truck } from "../no-work-2036/props";
import { CITY, PHONE, Phone3D } from "../ww3-countdown/props";
import {
  Airfield,
  Bag,
  Barbell,
  BENCH,
  BenchRig,
  BigCar,
  Bottle,
  Burst,
  Crown,
  Fridge,
  Gf,
  Gym,
  GymFront,
  HOME,
  HomeKitchen,
  Jar,
  JAR,
  LABCOAT,
  lie,
  OLIVE,
  Rack,
  Sofa,
  SOFA,
  Spoon,
  ViralScreen,
} from "./props";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
const startFrame = (c: ShotCtx) => Math.round((c.t - c.lt) * 30);
/** Seconds into the shot when `phrase` is spoken (searching from just before the shot start), or `fallback`. */
const cueAt = (c: ShotCtx, phrase: string, fallback: number) => {
  const s = c.t - c.lt;
  const w = wordAt(c.words, phrase, s - 0.3, -1);
  return w < 0 ? fallback : w - s;
};
const once = <T,>(f: () => T) => {
  let v: T | undefined;
  return () => (v ??= f());
};

const BigStreet: React.FC<React.ComponentProps<typeof StreetSet> & { day?: boolean }> = ({ day = false, ...props }) => (
  <group scale={CITY}>
    <StreetSet {...props} lampsOn={day ? false : props.lampsOn} modify={day ? (sp, i) => ({ power: 0.3, ...(props.modify?.(sp, i) ?? {}) }) : props.modify} />
  </group>
);

const Shot: React.FC<{ children: React.ReactNode; overlay?: React.ReactNode } & React.ComponentProps<typeof Stage>> = ({ children, overlay, ...stage }) => (
  <AbsoluteFill>
    <Stage {...stage}>{children}</Stage>
    {overlay}
  </AbsoluteFill>
);

const CLOUD = { day: "#F4F6FA", dawn: "#F2C9B0", sunset: "#F7C0A0", overcast: "#AEB6C2" } as const;
const Sky: React.FC<{ t: number; tint: keyof typeof CLOUD; y?: number; radius?: number; count?: number; seed?: string }> = ({ t, tint, y = 45, radius = 200, count = 16, seed = "sky" }) => (
  <Clouds t={t} color={CLOUD[tint]} y={y} radius={radius} count={count} seed={seed} />
);

// ---------------------------------------------------------------- poses (computed once)

const GF_YAW = Math.PI / 2; // at the table she faces +X
const ME_YAW = -Math.PI / 2; // he faces −X
const SIT = sittingPose({ headPitch: -0.05 });

/** At the table: her right fist holding a spoon up in front of her. */
const SPOON_HAND: V3 = [HOME.gf[0] + 1.0, 1.95, 0.55];
const spoonPose = once(() => reach(SIT, "r", SPOON_HAND, { position: HOME.gf, yaw: GF_YAW }).pose);

/** The jar on the table in front of her: right fist round its body, left fist on the lid. */
const JAR_AT: V3 = [HOME.gf[0] + 1.05, HOME.tableTop + JAR.h / 2, 0];
const jarPose = once(() => {
  const l = reach(SIT, "l", [JAR_AT[0], JAR_AT[1] + JAR.h / 2 + 0.1 + 0.24, JAR_AT[2]], { position: HOME.gf, yaw: GF_YAW }).pose;
  return reach(l, "r", [JAR_AT[0], JAR_AT[1], JAR_AT[2] + JAR.r + 0.2], { position: HOME.gf, yaw: GF_YAW }).pose;
});
/** Him at the table, a mug-free resting pose, and laughing. */
const meSit = (over: Partial<Pose> = {}) => mergePose(SIT, { lShoulder: [0.6, 0.1], rShoulder: [0.6, 0.1], lElbow: 0.9, rElbow: 0.9, ...over });

/** Arms-up overhead lift, keyframed (IK is slow): hands from waist height in front to straight overhead. */
const LIFT_LO = { y: 1.95, z: 0.78 };
const LIFT_HI = { y: 5.75, z: 0.15 };
const liftKeys = once(() => {
  const base = mergePose(REST, { headPitch: 0.15, expression: "smile" });
  return Array.from({ length: 6 }, (_, i) => {
    const k = i / 5;
    const y = LIFT_LO.y + (LIFT_HI.y - LIFT_LO.y) * k;
    const z = LIFT_LO.z + (LIFT_HI.z - LIFT_LO.z) * k;
    const l = reach(base, "l", [0.85, y, z]).pose;
    return reach(l, "r", [-0.85, y, z]).pose;
  });
});
const liftPose = (k: number): Pose => {
  const keys = liftKeys();
  const f = clamp01(k) * (keys.length - 1);
  const i = Math.min(keys.length - 2, Math.floor(f));
  return lerpPose(keys[i], keys[i + 1], f - i);
};
/** The point (hero space) where a lifted load's bottom sits: on top of both fists. */
const liftLoad = (pose: Pose): V3 => {
  const l = handPosition(pose, "l");
  const r = handPosition(pose, "r");
  return [(l[0] + r[0]) / 2, Math.max(l[1], r[1]) + 0.22, (l[2] + r[2]) / 2];
};
/** Her, lifting: `children` are drawn in her frame at the load point (their bottom centre at the origin). */
const Lifting: React.FC<{ k: number; position: V3; yaw?: number; over?: Partial<Pose>; children: React.ReactNode }> = ({ k, position, yaw = 0, over, children }) => {
  const pose = { ...liftPose(k), ...over };
  const load = liftLoad(pose);
  return (
    <>
      <Gf pose={pose} position={position} yaw={yaw} />
      <group position={position} rotation={[0, yaw, 0]}>
        <group position={load}>{children}</group>
      </group>
    </>
  );
};

/** Flexing both biceps (arms out, forearms up). */
const FLEX = mergePose(REST, { lShoulder: [0.25, 2.35], rShoulder: [0.25, 2.35], lElbow: 0.7, rElbow: 0.7, expression: "smile", headPitch: 0.1 });

/** Him lying on the bench: arms straight up holding the bar (k = 0) or bent, straining (k = 1). */
const LIE_UP = mergePose(REST, { lShoulder: [1.57, 0.32], rShoulder: [1.57, 0.32], lElbow: 0.05, rElbow: 0.05, headPitch: 0 });
const LIE_STRAIN = mergePose(REST, { lShoulder: [1.2, 0.5], rShoulder: [1.2, 0.5], lElbow: 1.3, rElbow: 1.3, expression: "worried" });
const barAt = (pose: Pose): V3 => {
  const l = handPosition(pose, "l");
  const r = handPosition(pose, "r");
  return lie([(l[0] + r[0]) / 2, (l[1] + r[1]) / 2, (l[2] + r[2]) / 2]);
};

/** Holding something in the right hand in front of the chest (a bottle, a card), hero space. */
const holdPose = once(() => reach(mergePose(REST, { expression: "worried", headPitch: -0.1 }), "r", [-0.45, 2.05, 0.75]).pose);

/** Pointing at someone with the right arm. */
const POINT = mergePose(REST, { rShoulder: [1.45, 0.05], rElbow: 0.05, lShoulder: [0.05, 0.3], expression: "alarm" });

// ---------------------------------------------------------------- shared sets

const KitchenShot: React.FC<{ c: ShotCtx; cam: CameraSpec; evening?: boolean; children: React.ReactNode; overlay?: React.ReactNode; shake?: number }> = ({ c, cam, evening = false, children, overlay, shake = 0 }) => (
  <Shot
    mood={evening ? "sunset" : "dawn"}
    camera={cam}
    fog={false}
    stars={false}
    light={1.15}
    keyDir={[0.25, 0.4, -1]}
    shadowSize={10}
    shake={shake}
    overlay={overlay}
  >
    <HomeKitchen evening={evening} />
    <pointLight position={[0, 4.4, -3.8]} color={evening ? "#FFB070" : "#FFD8B0"} intensity={22} distance={16} decay={2} />
    <Halo position={[0, 4.4, -6]} size={7} color={evening ? "#FFB070" : "#FFE2B8"} opacity={0.45} />
    {children}
  </Shot>
);

/** Both seated at the table. */
const Table: React.FC<{ gf?: Pose; me?: Pose }> = ({ gf = SIT, me = meSit() }) => (
  <>
    <Gf pose={gf} position={HOME.gf} yaw={GF_YAW} />
    <Hero pose={me} position={HOME.me} yaw={ME_YAW} />
  </>
);

/** A standing person filming with a phone held up in front (hero space, facing +Z). */
const filmPose = once(() => reach(mergePose(REST, { headPitch: 0.1 }), "r", [-0.35, 3.2, 1.0]).pose);
const Filmer: React.FC<{ position: V3; yaw: number; seed: number }> = ({ position, yaw, seed }) => {
  const pose = filmPose();
  const h = handPosition(pose, "r");
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <Hero pose={pose} look={crowdLook(seed)} />
      <Phone3D position={[h[0], h[1] + 0.3, h[2] + 0.05]} rotation={[0.1, Math.PI, 0]} glow="#8FD0FF" />
    </group>
  );
};

// ---------------------------------------------------------------- cold open: sunrise kitchen

/** 0 s: her fist round a spoon at breakfast… the spoon folds in half. */
const coldSpoon: ShotFn = (c) => {
  const pose = spoonPose();
  const h = handPosition(pose, "r", HOME.gf, GF_YAW);
  const cam = move({ position: [h[0] + 3.4, h[1] + 1.3, h[2] + 2.0], target: [h[0] - 0.4, h[1] + 0.75, h[2] - 0.3] }, { position: [h[0] + 3.0, h[1] + 1.25, h[2] + 1.8], target: [h[0] - 0.4, h[1] + 0.75, h[2] - 0.3] }, c);
  return (
    <KitchenShot c={c} cam={cam}>
      <Table gf={pose} />
      <Spoon position={[h[0], h[1] - 0.05, h[2]]} rotation={[0, -0.6, -0.35]} bend={k01(c.lt, 0.3, 0.6)} />
    </KitchenShot>
  );
};

/** Slavoski across the table: the spoon, then her, then… oh no. */
const coldFace: ShotFn = (c) => {
  const head = headPosition(meSit(), HOME.me, ME_YAW);
  const cam = move({ position: [head[0] - 5.6, head[1] + 0.8, head[2] + 3.6], target: [head[0], head[1] - 0.7, head[2]] }, { position: [head[0] - 5.0, head[1] + 0.75, head[2] + 3.2], target: [head[0], head[1] - 0.7, head[2]] }, c);
  return (
    <KitchenShot c={c} cam={cam}>
      <Table gf={spoonPose()} me={meSit({ expression: c.lt > 0.6 ? "alarm" : "worried", headPitch: -0.05 })} />
    </KitchenShot>
  );
};

/** Wide: she stretches at the window and flexes. */
const coldFlex: ShotFn = (c) => {
  const cam = move({ position: [1.2, 4.0, 13], target: [0.2, 3.0, -2] }, { position: [1.0, 3.9, 11.6], target: [0.2, 3.0, -2] }, c);
  const gfPos: V3 = [-1.4, 0, -3.0];
  const pose = lerpPose(mergePose(REST, { expression: "smile" }), FLEX, k01(c.lt, 0.1, 0.6));
  return (
    <KitchenShot c={c} cam={cam}>
      <Gf pose={pose} position={gfPos} yaw={0.15} />
      <Hero pose={meSit({ expression: "alarm", headYaw: -0.6 })} position={HOME.me} yaw={ME_YAW} />
    </KitchenShot>
  );
};

// ---------------------------------------------------------------- 01 the jar (morning)

/** Breakfast as usual. Nothing has changed. */
const c1Calm: ShotFn = (c) => {
  const cam = move({ position: [-7.5, 5.2, 7.5], target: [0.8, 2.5, -0.3] }, { position: [-6.8, 5.0, 6.8], target: [0.8, 2.5, -0.3] }, c);
  return (
    <KitchenShot c={c} cam={cam}>
      <Table gf={mergePose(SIT, { expression: "smile" })} me={meSit({ expression: "smile" })} />
      <Jar position={JAR_AT} />
    </KitchenShot>
  );
};

/** Medium on her: she opens a jar. */
const c1Jar: ShotFn = (c) => {
  const cam = move({ position: [JAR_AT[0] + 3.4, 3.9, 5.2], target: [JAR_AT[0] - 0.7, 2.4, 0] }, { position: [JAR_AT[0] + 3.0, 3.8, 4.6], target: [JAR_AT[0] - 0.7, 2.4, 0] }, c);
  return (
    <KitchenShot c={c} cam={cam}>
      <Table gf={mergePose(jarPose(), { expression: "neutral", headPitch: -0.25 })} me={meSit()} />
      <Jar position={JAR_AT} lidOff={0} />
    </KitchenShot>
  );
};

/** Close: …and accidentally crushes it. */
const c1Crush: ShotFn = (c) => {
  const hit = cueAt(c, "crushes", 0.7);
  const burst = c.lt < hit ? 0 : clamp01((c.lt - hit) / 0.9) + 0.001;
  const cam = move({ position: [JAR_AT[0] + 1.4, JAR_AT[1] + 1.0, 3.4], target: [JAR_AT[0] - 0.2, JAR_AT[1] + 0.45, 0] }, { position: [JAR_AT[0] + 1.25, JAR_AT[1] + 0.95, 3.0], target: [JAR_AT[0] - 0.2, JAR_AT[1] + 0.45, 0] }, c);
  return (
    <KitchenShot c={c} cam={cam} shake={burst > 0 && burst < 0.3 ? 0.04 : 0}>
      <Table gf={mergePose(jarPose(), { expression: burst > 0 ? "alarm" : "neutral", headPitch: -0.25 })} me={meSit()} />
      <Jar position={JAR_AT} burst={burst} />
    </KitchenShot>
  );
};

/** He laughs (nervously). */
const c1Laugh: ShotFn = (c) => {
  const head = headPosition(meSit(), HOME.me, ME_YAW);
  const cam = move({ position: [head[0] - 5.2, head[1] + 0.6, head[2] + 3.4], target: [head[0], head[1] - 0.7, head[2]] }, { position: [head[0] - 4.8, head[1] + 0.6, head[2] + 3.1], target: [head[0], head[1] - 0.7, head[2]] }, c);
  return (
    <KitchenShot c={c} cam={cam}>
      <Table gf={mergePose(jarPose(), { expression: "smile" })} me={meSit({ expression: "smile", headPitch: 0.15 + Math.abs(Math.sin(c.lt * 9)) * 0.08 })} />
    </KitchenShot>
  );
};

/** She laughs. */
const c1SheLaughs: ShotFn = (c) => {
  const head = headPosition(SIT, HOME.gf, GF_YAW);
  const cam = move({ position: [head[0] + 5.2, head[1] + 0.6, head[2] + 3.4], target: [head[0], head[1] - 0.7, head[2]] }, { position: [head[0] + 4.8, head[1] + 0.6, head[2] + 3.1], target: [head[0], head[1] - 0.7, head[2]] }, c);
  return (
    <KitchenShot c={c} cam={cam}>
      <Table gf={mergePose(SIT, { expression: "smile", headPitch: 0.15 + Math.abs(Math.sin(c.lt * 8)) * 0.08 })} me={meSit({ expression: "smile" })} />
    </KitchenShot>
  );
};

/** Hug positions: she at HUG_GF facing +Z; he 0.95 in front and 0.95 to the side, facing her. */
const HUG_GF: V3 = [-1.0, 0, 2.3];
const HUG_ME: V3 = [HUG_GF[0] + 0.95, 0, HUG_GF[2] + 0.95];
const hugPose = once(() => {
  const base = mergePose(REST, { expression: "smile", headYaw: 0.45 });
  const l = reach(base, "l", [HUG_GF[0] + 0.95 + 0.85, 2.3, HUG_GF[2] + 0.95], { position: HUG_GF, yaw: 0 }).pose;
  return reach(l, "r", [HUG_GF[0] + 0.95 - 0.85, 2.3, HUG_GF[2] + 0.95], { position: HUG_GF, yaw: 0 }).pose;
});
const OPEN_ARMS = mergePose(REST, { lShoulder: [0.7, 1.0], rShoulder: [0.7, 1.0], lElbow: 0.4, rElbow: 0.4, expression: "smile" });
const SQUEEZED = mergePose(REST, { lShoulder: [0.3, 2.1], rShoulder: [0.3, 2.1], lElbow: 0.3, rElbow: 0.3, expression: "alarm", headYaw: -0.45, headPitch: 0.2 });

/** Then she goes to hug you: arms open, walking in. */
const c1HugIn: ShotFn = (c) => {
  const k = k01(c.lt, 0, 1.1);
  const start: V3 = [HUG_GF[0] - 2.4, 0, HUG_GF[2] - 0.3];
  const pos: V3 = [start[0] + (HUG_GF[0] - start[0]) * k, 0, start[2] + (HUG_GF[2] - start[2]) * k];
  const cam = move({ position: [8.6, 4.3, 3.6], target: [-0.9, 2.9, 2.8] }, { position: [8.0, 4.2, 3.5], target: [-0.9, 2.9, 2.8] }, c);
  return (
    <KitchenShot c={c} cam={cam}>
      <Gf pose={k < 1 ? mergePose(walkPose(c.lt * 1.6, 0.6), { lShoulder: [0.7, 1.0], rShoulder: [0.7, 1.0], lElbow: 0.4, rElbow: 0.4, expression: "smile" }) : OPEN_ARMS} position={pos} yaw={0.9 * (1 - k)} />
      <Hero pose={OPEN_ARMS} position={HUG_ME} yaw={Math.PI + 0.2} />
    </KitchenShot>
  );
};

/** The hug. CRACK! CRACK! CRACK! (cartoon bursts; nothing shown hurt). */
const c1Crack: ShotFn = (c) => {
  const cam = move({ position: [7.4, 3.9, 3.2], target: [-0.5, 2.9, 2.8] }, { position: [6.8, 3.8, 3.1], target: [-0.5, 2.9, 2.8] }, c);
  const crack = cueAt(c, "crack", 0.85);
  const bursts = [crack - 0.5, crack - 0.15, crack + 0.2];
  const chest = project([HUG_ME[0] + 0.3, 2.3, HUG_ME[2]], cam, c.width, c.height);
  const squeeze = bursts.some((b) => c.lt > b && c.lt < b + 0.12);
  return (
    <KitchenShot
      c={c}
      cam={cam}
      shake={squeeze ? 0.05 : 0}
      overlay={
        <>
          {bursts.map((b, i) => (
            <Burst key={i} x={chest.x + (i - 1) * 150} y={chest.y - 180 + (i % 2) * 120} text="CRACK!" lt={c.lt - b} rot={(i - 1) * 12} size={0.85} />
          ))}
        </>
      }
    >
      <Gf pose={hugPose()} position={HUG_GF} yaw={0} />
      <Hero pose={mergePose(SQUEEZED, { expression: c.lt > bursts[0] ? "alarm" : "smile" })} position={HUG_ME} yaw={Math.PI} />
    </KitchenShot>
  );
};

// ---------------------------------------------------------------- 02 shopping (bright midday)

/** A supermarket car park: shop front, parked cars, lamps. */
const CarPark: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <Ground color="#4A505E" />
    {Array.from({ length: 9 }, (_, i) => (
      <mesh key={i} position={[-24 + i * 6, 0.01, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 8]} />
        <Flat color="#F2EEE6" />
      </mesh>
    ))}
    <mesh position={[0, 6, -26]} castShadow receiveShadow>
      <BoxG args={[60, 12, 16]} />
      <Flat color="#E8E4DA" />
    </mesh>
    <mesh position={[0, 3, -17.95]}>
      <planeGeometry args={[18, 6]} />
      <Glow color="#3A5A7A" />
    </mesh>
    <CanvasPanel position={[0, 9.6, -17.9]} w={20} h={3} px={1024} draw={(ctx, W, H) => {
      ctx.fillStyle = "#2F7A5A";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${Math.round(H * 0.6)}px "Slavoski Sans", "DejaVu Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("FRESH MART", W / 2, H / 2 + H * 0.04);
    }} />
    {[-15, -9, 7, 13, 19].map((x, i) => (
      <group key={x} position={[x, 0, -2]} rotation={[0, Math.PI, 0]} scale={3.5}>
        <Car position={[0, 0, 0]} color={[P.carRed, P.carTeal, "#E8E4DA", "#5A4A78", "#2A2E3C"][i]} />
      </group>
    ))}
    {[-30, 30].map((x) => (
      <group key={x} scale={3.5} position={[x, 0, 6]}>
        <Lamp position={[0, 0, 0]} on={false} />
      </group>
    ))}
    <HillRing color="#5A8A5A" radius={220} />
    <Sky t={t} tint="day" seed="carpark" y={50} />
  </group>
);

/** Bags hanging from one hand (world positions from the rig). */
const BagsInHand: React.FC<{ pose: Pose; position: V3; yaw: number; side: "l" | "r"; count?: number }> = ({ pose, position, yaw, side, count = 3 }) => {
  const h = handPosition(pose, side, position, yaw);
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = yaw + (i - (count - 1) / 2) * 0.9;
        return <Bag key={i} position={[h[0] + Math.sin(a) * 0.32 * (i ? 1 : 0), h[1] - 1.2, h[2] + Math.cos(a) * 0.32 * (i ? 1 : 0)]} yaw={a} color={["#C9A46A", "#F2EEE6", "#E8D23A"][i % 3]} />;
      })}
    </>
  );
};

/** A tower of bags held in front of her (hero space), 2 columns × 5 rows, shifted to her left so her face peeks out. */
const towerPose = once(() => {
  const l = reach(mergePose(REST, { expression: "smile", headYaw: -0.25 }), "l", [1.0, 2.05, 1.0]).pose;
  return reach(l, "r", [-0.1, 2.05, 1.0]).pose;
});
const BagTower: React.FC = () => (
  <group position={[0.45, 2.05 + 0.22, 1.0]}>
    {Array.from({ length: 10 }, (_, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      return <Bag key={i} position={[(col - 0.5) * 0.66 + (row % 2) * 0.05, row * 0.86, 0]} yaw={(row % 2) * 0.08} color={["#C9A46A", "#F2EEE6", "#E8D23A", "#C9A46A", "#E8475A"][(i + row) % 5]} />;
    })}
  </group>
);

/** She strides across the car park with a tower of bags. */
const c2Bags: ShotFn = (c) => {
  const cam = move({ position: [8, 4.8, 17], target: [0, 3.4, 1] }, { position: [7.3, 4.7, 15.8], target: [0.6, 3.4, 1] }, c);
  const pos: V3 = [-2.5 + c.lt * 1.3, 0, 3];
  const tp = towerPose();
  const pose = { ...mergePose(walkPose(c.lt * 1.3, 0.5), { expression: "smile" as const, headYaw: -0.25 }), lShoulder: tp.lShoulder, rShoulder: tp.rShoulder, lElbow: tp.lElbow, rElbow: tp.rElbow };
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={30}>
      <CarPark t={c.t} />
      <Gf pose={pose} position={pos} yaw={Math.PI / 2} />
      <group position={pos} rotation={[0, Math.PI / 2, 0]}>
        <BagTower />
      </group>
    </Shot>
  );
};

/** …including you: tucked under her arm like a surfboard, stiff as a plank, bags in her other hand. */
const PLANK = mergePose(REST, { expression: "worried", headPitch: 0.3, lShoulder: [0, 0.05], rShoulder: [0, 0.05], lElbow: 0, rElbow: 0 });
const c2Carry: ShotFn = (c) => {
  const cam = move({ position: [-8.6, 4.4, 5.2], target: [-1.0, 2.5, -0.2] }, { position: [-8.0, 4.3, 4.8], target: [-1.0, 2.5, -0.2] }, c);
  const pos: V3 = [0, 0, 0];
  const pose = mergePose(walkPose(c.lt * 1.2, 0.35), { expression: "smile", rShoulder: [0.05, 0.12], rElbow: 0.1 });
  const bob = Math.abs(Math.sin(c.lt * 1.2 * Math.PI * 2)) * 0.04;
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={20}>
      <CarPark t={c.t} />
      <Gf pose={pose} position={pos} yaw={0} />
      {/* him: lying face up, head forward (+Z), at her right hip, her arm along his side */}
      <group position={[-1.95, 2.25 + bob, -2.0]} rotation={[0, Math.PI, 0]}>
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <Hero pose={PLANK} />
        </group>
      </group>
      <BagsInHand pose={pose} position={pos} yaw={0} side="l" count={3} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 the gym (neon, dusk)

/** Outside the gym at dusk: Slavoski marches in. */
const c3Front: ShotFn = (c) => {
  const cam = move({ position: [3, 4.2, 34], target: [0, 6.0, -6] }, { position: [2.6, 4.1, 31], target: [0, 6.2, -6] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[50, 260]} shadowSize={30}>
      <Ground color="#4A4E5E" />
      <Road position={[0, 0.01, 10]} width={10} length={200} yaw={Math.PI / 2} />
      <Sky t={c.t} tint="sunset" seed="gym" y={55} />
      <GymFront />
      <Hero pose={mergePose(walkPose(c.lt * 1.5, 0.9), { expression: "smile", headPitch: 0.1 })} position={[0.8, 0, 3 - c.lt * 1.2]} yaw={Math.PI} />
    </Shot>
  );
};

/** The bench at world BENCH_AT (seat top). */
const BENCH_AT: V3 = [0, 1.35, 0];
const RACK_TOP = BENCH_AT[1] + barAt(LIE_UP)[1] + 0.1;
const GymBench: React.FC<{ pose: Pose }> = ({ pose }) => (
  <group position={BENCH_AT}>
    <BenchRig pose={pose} bar={barAt(pose)} />
  </group>
);

/** He loads 100 kg: standing by the racked bar, proud. */
const c3Load: ShotFn = (c) => {
  const cam = move({ position: [5.5, 5.0, 13], target: [0, 2.6, 0] }, { position: [5.0, 4.9, 12], target: [0, 2.6, 0] }, c);
  const barWorld: V3 = [BENCH_AT[0] + barAt(LIE_UP)[0], RACK_TOP, 0];
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.75} shadowSize={14} overlay={<CardLine text="100 KG" sub="HIS PERSONAL RECORD" y={470} appearFrame={startFrame(c) + 10} />}>
      <Gym />
      <group position={BENCH_AT}>
        <mesh position={[(BENCH.x0 + BENCH.x1) / 2, -BENCH.seat / 2, 0]} castShadow>
          <BoxG args={[BENCH.x1 - BENCH.x0, BENCH.seat, BENCH.w]} />
          <Flat color="#22242E" />
        </mesh>
        {[BENCH.x0 + 0.3, BENCH.x1 - 0.3].map((x) => (
          <mesh key={x} position={[x, -BENCH.seat - (BENCH.legs - BENCH.seat) / 2, 0]} castShadow>
            <BoxG args={[0.2, BENCH.legs - BENCH.seat, BENCH.w - 0.2]} />
            <Flat color="#8A8E98" />
          </mesh>
        ))}
      </group>
      <Rack top={RACK_TOP} />
      <Barbell position={barWorld} />
      <Hero pose={mergePose(REST, { expression: "smile", lShoulder: [0.2, 0.6], lElbow: 1.8, rShoulder: [0.2, 0.6], rElbow: 1.8 })} position={[1.2, 0, 2.6]} yaw={-0.3} />
    </Shot>
  );
};

/** He strains on the bench; she looks down from behind his head: "Is that your warm-up?" */
const GF_AT_HEAD: V3 = [-4.4, 0, 0];
const c3Strain: ShotFn = (c) => {
  const wob = Math.sin(c.lt * 14) * 0.08;
  const pose = lerpPose(LIE_UP, LIE_STRAIN, 0.75 + wob);
  const cam = move({ position: [6.0, 5.6, 7.0], target: [-1.8, 2.6, 0] }, { position: [5.5, 5.4, 6.4], target: [-1.8, 2.6, 0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.75} shadowSize={14}>
      <Gym />
      <Rack top={RACK_TOP} />
      <GymBench pose={pose} />
      <Gf pose={mergePose(REST, { expression: "smile", headPitch: -0.35, headRoll: 0.15, lShoulder: [0.1, 0.5], rShoulder: [0.1, 0.5], lElbow: 1.7, rElbow: 1.7 })} position={GF_AT_HEAD} yaw={Math.PI / 2} />
    </Shot>
  );
};

/** She lifts the whole bench overhead, him still on it, bar and all. */
const GF_LIFT: V3 = [-0.6, 0, -1.25];
const BenchLoad: React.FC<{ pose: Pose }> = ({ pose }) => (
  // load point = under the seat centre; the bench space origin is the seat top (0.2 higher).
  <group position={[0.6, BENCH.seat, 0.45]}>
    <BenchRig pose={pose} bar={barAt(pose)} />
  </group>
);
const c3Lift: ShotFn = (c) => {
  const k = k01(c.lt, 0.1, 1.8);
  const cam = move({ position: [1.4, 4.6, 17], target: [-0.4, 5.0, -1] }, { position: [1.3, 4.8, 16], target: [-0.4, 5.4, -1] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.75} shadowSize={14}>
      <Gym />
      <Rack top={RACK_TOP} />
      <Lifting k={k} position={GF_LIFT}>
        <BenchLoad pose={mergePose(LIE_UP, { expression: k > 0.3 ? "alarm" : "worried" })} />
      </Lifting>
    </Shot>
  );
};
/** Low angle: still lying on it, way up there. */
const c3High: ShotFn = (c) => {
  const flail = Math.sin(c.lt * 10) * 0.35;
  const pose = mergePose(LIE_UP, { expression: "alarm", lShoulder: [1.57 + flail, 0.5], rShoulder: [1.57 - flail, 0.5], headPitch: 0.3 });
  const cam = move({ position: [5.0, 2.2, 14], target: [-0.4, 5.6, -1] }, { position: [4.6, 2.2, 13], target: [-0.4, 5.8, -1] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.75} shadowSize={14}>
      <Gym />
      <Rack top={RACK_TOP} />
      <Lifting k={1} position={GF_LIFT}>
        <BenchLoad pose={pose} />
      </Lifting>
    </Shot>
  );
};

/** Gym membership: pointless. He sits on the floor with his card; she curls the dumbbell rack behind. */
const SIT_FLOOR = mergePose(REST, { lHip: [1.5, 0.1], rHip: [1.5, 0.1], lKnee: 0.1, rKnee: 0.1, bob: -1.18, expression: "worried", headPitch: -0.3 });
const c3Pointless: ShotFn = (c) => {
  const cam = move({ position: [3.6, 4.4, 14], target: [-0.8, 3.0, -2] }, { position: [3.3, 4.3, 13], target: [-0.8, 3.0, -2] }, c);
  const card = handPosition(mergePose(SIT_FLOOR, { rShoulder: [0.9, 0.1], rElbow: 0.9 }), "r", [0.4, 0, 1.6], -0.2);
  const curl = 0.5 + 0.5 * Math.sin(c.lt * 4);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.75} shadowSize={14}>
      <Gym />
      <Hero pose={mergePose(SIT_FLOOR, { rShoulder: [0.9, 0.1], rElbow: 0.9 })} position={[0.4, 0, 1.6]} yaw={-0.2} />
      <mesh position={[card[0], card[1] + 0.3, card[2] + 0.05]} rotation={[0, -0.2, 0]}>
        <boxGeometry args={[0.5, 0.32, 0.02]} />
        <Flat color={P.amber} />
      </mesh>
      <Lifting k={0.55 + curl * 0.4} position={[-2.6, 0, -4.2]} over={{ expression: "smile" }}>
        <mesh position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 2.6, 10]} />
          <Flat color="#15161C" />
        </mesh>
      </Lifting>
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 moving day (overcast, windy)

const MOVE_GF: V3 = [-3, 0, 4];
const MOVE_ME: V3 = [3.2, 0, 4];
const SOFA_AT: V3 = [0.1, 0, 3.6];
const MoveSet: React.FC<{ t: number; sofa?: boolean; fridge?: boolean; car?: boolean }> = ({ t, sofa = true, fridge = true, car = true }) => (
  <group>
    <BigStreet seed="moving" day lamps={false} cars={false} />
    <Sky t={t} tint="overcast" seed="moving" y={50} count={22} />
    <group position={[-20, 0, -14]} rotation={[0, Math.PI / 2, 0]} scale={0.95}>
      <Truck position={[0, 0, 0]} label="none" color="#E8E4DA" />
    </group>
    {sofa ? <Sofa position={SOFA_AT} /> : null}
    {fridge ? <Fridge position={[6.8, 0, 1.2]} rotation={[0, -0.3, 0]} /> : null}
    {car ? <BigCar position={[-8.5, 0, -8]} rotation={[0, 0.15, 0]} color={P.carTeal} /> : null}
  </group>
);

const c4Worse: ShotFn = (c) => {
  const cam = move({ position: [5, 5.4, 30], target: [0, 4, 0] }, { position: [4.6, 5.2, 27.5], target: [0, 4.2, 0] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[40, 260]} shadowSize={30} light={0.9}>
      <MoveSet t={c.t} />
      <Gf pose={mergePose(REST, { expression: "neutral" })} position={MOVE_GF} yaw={0.4} />
      <Hero pose={mergePose(REST, { expression: "worried" })} position={MOVE_ME} yaw={-0.4} />
    </Shot>
  );
};

const c4Argue: ShotFn = (c) => {
  const cam = move({ position: [6, 5.0, 19.5], target: [0, 3.0, 4] }, { position: [5.6, 4.9, 18.2], target: [0, 3.0, 4] }, c);
  const jab = Math.max(0, Math.sin(c.lt * 7)) * 0.15;
  return (
    <Shot mood="overcast" camera={cam} fog={[40, 260]} shadowSize={20} light={0.9}>
      <MoveSet t={c.t} />
      <Gf pose={mergePose(POINT, { expression: "smile", rShoulder: [1.45 + jab, 0.05] })} position={MOVE_GF} yaw={Math.PI / 2} />
      <Hero pose={mergePose(POINT, { rShoulder: [1.45 - jab, 0.05] })} position={MOVE_ME} yaw={-Math.PI / 2} />
    </Shot>
  );
};

/** She picks up the sofa. */
const GF_MOVE_LIFT: V3 = [0.1, 0, 2.6];
const c4Sofa: ShotFn = (c) => {
  const k = k01(c.lt, 0.05, 0.9);
  const cam = move({ position: [2.4, 4.6, 19], target: [0, 5.0, 2] }, { position: [2.2, 4.8, 17.5], target: [0, 5.3, 2] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[40, 260]} shadowSize={30} light={0.9}>
      <MoveSet t={c.t} sofa={false} />
      <Lifting k={k} position={GF_MOVE_LIFT}>
        <Sofa position={[0, 0, 0]} />
      </Lifting>
      <Hero pose={mergePose(REST, { expression: "alarm", headPitch: 0.4 })} position={MOVE_ME} yaw={-0.8} />
    </Shot>
  );
};

/** Then the fridge, stacked on top. */
const c4Fridge: ShotFn = (c) => {
  const drop = 1 - k01(c.lt, 0.05, 0.4);
  const cam = move({ position: [2.4, 5.2, 24], target: [0, 7.4, 2] }, { position: [2.2, 5.4, 22.5], target: [0, 7.6, 2] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[40, 260]} shadowSize={30} light={0.9}>
      <MoveSet t={c.t} sofa={false} fridge={false} />
      <Lifting k={1} position={GF_MOVE_LIFT}>
        <Sofa position={[0, 0, 0]} />
        <Fridge position={[0, SOFA.h * 0.38 + drop * 3, 0]} />
      </Lifting>
      <Hero pose={mergePose(REST, { expression: "alarm", headPitch: 0.5 })} position={MOVE_ME} yaw={-0.8} />
    </Shot>
  );
};

/** Then your car. */
const c4Car: ShotFn = (c) => {
  const k = k01(c.lt, 0.0, 0.7);
  const cam = move({ position: [8, 5.0, 36], target: [-1, 7.0, 0] }, { position: [7.4, 5.0, 33], target: [-1, 7.3, 0] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[40, 260]} shadowSize={40} light={0.9} shake={k > 0.6 && k < 1 ? 0.06 : 0}>
      <MoveSet t={c.t} car={false} />
      <Lifting k={k} position={[-3, 0, 0]}>
        <BigCar position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} color={P.carTeal} />
      </Lifting>
      <Hero pose={mergePose(REST, { expression: "alarm", headPitch: 0.4, lShoulder: [0.3, 0.9], rShoulder: [0.3, 0.9] })} position={[5.5, 0, 6]} yaw={-0.7} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 gone viral (sunny airfield, day 3)

/** A crowd phone filming her: the video's views racing into the millions. */
const c5Phone: ShotFn = (c) => {
  const P0: V3 = [0, 4.6, 14];
  const cam = move({ position: [P0[0] + 0.05, P0[1] + 0.05, P0[2] + 2.1], target: [P0[0], P0[1] + 0.05, P0[2]] }, { position: [P0[0] + 0.03, P0[1] + 0.05, P0[2] + 1.7], target: [P0[0], P0[1] + 0.05, P0[2]] }, c);
  return (
    <Shot
      mood="day"
      camera={cam}
      fog={[40, 300]}
      shadowSize={10}
      overlay={
        <ScreenHtml c={[P0[0], P0[1], P0[2] + PHONE.d / 2 + 0.003]} w={PHONE.screenW} h={PHONE.screenH} cam={cam} width={c.width} height={c.height}>
          {(w, h) => <ViralScreen w={w} h={h} t={c.t} k={k01(c.lt, 0.2, 2.4)} />}
        </ScreenHtml>
      }
    >
      <Airfield t={c.t} />
      <Sky t={c.t} tint="day" seed="air" y={45} />
      <Phone3D position={P0} glow="#8FD0FF" />
    </Shot>
  );
};

/** The crowd films her lifting a small plane over her head. */
const PLANE_GF: V3 = [0, 0, -4];
const CROWD: { p: V3; yaw: number; seed: number }[] = Array.from({ length: 9 }, (_, i) => ({
  p: [-9 + (i % 5) * 4.5 + (i > 4 ? 2.2 : 0), 0, 7 + (i > 4 ? 3.5 : 0) + random(`cz${i}`)],
  yaw: Math.PI + (random(`cy${i}`) - 0.5) * 0.4,
  seed: 200 + i,
}));
const PlaneLoad: React.FC<{ t: number }> = ({ t }) => (
  <group position={[0, 1.25, 0]}>
    <Plane position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={2.2} t={t} />
  </group>
);
const c5Plane: ShotFn = (c) => {
  const k = k01(c.lt, 0.0, 1.2);
  const cam = move({ position: [2, 8.5, 32], target: [0, 6.2, -4] }, { position: [1.8, 8.3, 30], target: [0, 6.5, -4] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 400]} shadowSize={40}>
      <Airfield t={c.t} />
      <Sky t={c.t} tint="day" seed="air" y={50} />
      <Lifting k={0.5 + k * 0.5} position={PLANE_GF}>
        <PlaneLoad t={c.t} />
      </Lifting>
      {CROWD.map((f, i) => (
        <Filmer key={i} position={f.p} yaw={f.yaw} seed={f.seed} />
      ))}
    </Shot>
  );
};

/** Scientists with clipboards scan her flexing bicep. */
const clipPose = once(() => reach(mergePose(REST, { headPitch: 0.1 }), "l", [0.4, 2.1, 0.8]).pose);
const c5Science: ShotFn = (c) => {
  const cam = move({ position: [1.0, 4.6, 18], target: [0, 3.2, 0] }, { position: [0.9, 4.5, 16.8], target: [0, 3.2, 0] }, c);
  const sci = clipPose();
  return (
    <Shot mood="day" camera={cam} fog={[60, 400]} shadowSize={20}>
      <Airfield t={c.t} />
      <Sky t={c.t} tint="day" seed="air2" y={50} />
      <Gf pose={FLEX} position={[0, 0, -1]} yaw={0} />
      {[
        { p: [-3.0, 0, 0.8] as V3, yaw: 0.9, seed: 301 },
        { p: [3.1, 0, 0.6] as V3, yaw: -0.9, seed: 302 },
      ].map((s, i) => {
        const h = handPosition(sci, "l", s.p, s.yaw);
        return (
          <React.Fragment key={i}>
            <Hero pose={mergePose(sci, { expression: i ? "awe" : "alarm" })} position={s.p} yaw={s.yaw} look={LABCOAT(crowdLook(s.seed))} />
            <mesh position={[h[0], h[1] + 0.32, h[2]]} rotation={[0.2, s.yaw, 0]} castShadow>
              <boxGeometry args={[0.55, 0.75, 0.04]} />
              <Flat color="#E8E4DA" />
            </mesh>
          </React.Fragment>
        );
      })}
      {/* a scanning ring around her raised arm */}
      <mesh position={[-1.5, 3.4, -1]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.55, 0.04, 4, 20]} />
        <meshBasicMaterial color="#5AF08A" toneMapped={false} transparent opacity={0.6 + 0.4 * Math.sin(c.t * 8)} />
      </mesh>
    </Shot>
  );
};

/** The military: an officer salutes, a jeep and soldiers behind. */
const SALUTE = mergePose(REST, { rShoulder: [1.2, 0.9], rElbow: 2.1, expression: "neutral", headPitch: 0.05 });
const c5Military: ShotFn = (c) => {
  const cam = move({ position: [-3.0, 4.6, 18], target: [0.5, 3.2, 0] }, { position: [-2.8, 4.5, 16.8], target: [0.5, 3.2, 0] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 400]} shadowSize={30}>
      <Airfield t={c.t} />
      <Sky t={c.t} tint="day" seed="air3" y={50} />
      <Gf pose={mergePose(REST, { expression: "smile", headYaw: 0.4 })} position={[-1.6, 0, 0]} yaw={0.5} />
      <Hero pose={SALUTE} position={[2.4, 0, 1.2]} yaw={-1.0} look={OLIVE(suitLook(51))} />
      {[0, 1, 2].map((i) => (
        <Hero key={i} pose={mergePose(REST, {})} position={[5 + i * 2.2, 0, -5 - i]} yaw={-0.6} look={OLIVE(crowdLook(60 + i))} />
      ))}
      <BigCar position={[-7, 0, -9]} rotation={[0, 0.6, 0]} color="#4E5A34" />
    </Shot>
  );
};

/** And you? Far in the background, holding her water bottle. */
const c5You: ShotFn = (c) => {
  const cam = move({ position: [1.5, 3.6, 18], target: [3, 3.6, -14] }, { position: [1.5, 3.6, 16.5], target: [3.2, 3.6, -14] }, c);
  const me: V3 = [5.5, 0, -16];
  const pose = holdPose();
  const h = handPosition(pose, "r", me, -0.2);
  return (
    <Shot mood="day" camera={cam} fog={[60, 400]} shadowSize={40}>
      <Airfield t={c.t} />
      <Sky t={c.t} tint="day" seed="air4" y={50} />
      <Gf pose={FLEX} position={[1.6, 0, 6]} yaw={0.1} />
      {CROWD.slice(0, 5).map((f, i) => (
        <Filmer key={i} position={[f.p[0] * 0.8 + 2, 0, -2 - (i % 2) * 2]} yaw={Math.PI * 0 - 0.2 + i * 0.1} seed={f.seed} />
      ))}
      <Hero pose={pose} position={me} yaw={-0.2} />
      <Bottle position={[h[0], h[1] - 0.3, h[2]]} />
    </Shot>
  );
};
/** Close: holding her water bottle. */
const c5Bottle: ShotFn = (c) => {
  const me: V3 = [0, 0, 0];
  const pose = holdPose();
  const h = handPosition(pose, "r", me, 0);
  const cam = move({ position: [0.8, 3.6, 7.5], target: [0, 2.8, 0] }, { position: [0.7, 3.55, 6.8], target: [0, 2.8, 0] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 400]} shadowSize={10}>
      <Airfield t={c.t} />
      <Sky t={c.t} tint="day" seed="air5" y={50} />
      <Hero pose={mergePose(pose, { expression: "worried" })} position={me} />
      <Bottle position={[h[0], h[1] - 0.3, h[2]]} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 06 the jar, again (sunset kitchen)

const c6Problem: ShotFn = (c) => {
  const cam = move({ position: [0.3, 5.0, 13], target: [0, 2.8, 0] }, { position: [0.25, 4.6, 10.5], target: [0, 2.8, 0] }, { ...c, dur: 2.2 });
  return (
    <KitchenShot c={c} cam={cam} evening>
      <Table gf={mergePose(SIT, { expression: "neutral" })} me={meSit({ expression: "neutral" })} />
      <Jar position={JAR_AT} />
    </KitchenShot>
  );
};

/** She holds the jar out across the table to him. */
const offerPose = once(() => {
  const l = reach(SIT, "l", [HOME.gf[0] + 1.45, 2.3, -0.25], { position: HOME.gf, yaw: GF_YAW }).pose;
  return reach(l, "r", [HOME.gf[0] + 1.45, 1.8, 0.25], { position: HOME.gf, yaw: GF_YAW }).pose;
});
const OFFER_JAR: V3 = [HOME.gf[0] + 1.45, 2.05, 0];
const c6Offer: ShotFn = (c) => {
  const head = headPosition(SIT, HOME.gf, GF_YAW);
  const cam = move({ position: [head[0] + 6.0, head[1] + 0.9, head[2] + 4.0], target: [head[0] + 0.6, head[1] - 0.8, head[2]] }, { position: [head[0] + 5.5, head[1] + 0.85, head[2] + 3.6], target: [head[0] + 0.6, head[1] - 0.8, head[2]] }, c);
  return (
    <KitchenShot c={c} cam={cam} evening>
      <Table gf={mergePose(offerPose(), { expression: "worried", headPitch: 0.05 })} me={meSit()} />
      <Jar position={OFFER_JAR} />
    </KitchenShot>
  );
};
const c6Babe: ShotFn = (c) => {
  const head = headPosition(SIT, HOME.gf, GF_YAW);
  const cam = move({ position: [head[0] + 4.2, head[1] + 0.3, head[2] + 2.2], target: [head[0] + 0.4, head[1] - 0.55, head[2]] }, { position: [head[0] + 3.8, head[1] + 0.3, head[2] + 2.0], target: [head[0] + 0.4, head[1] - 0.55, head[2]] }, c);
  return (
    <KitchenShot c={c} cam={cam} evening>
      <Table gf={mergePose(offerPose(), { expression: "worried", headPitch: 0.1, headRoll: Math.sin(c.lt * 3) * 0.08 })} me={meSit()} />
      <Jar position={OFFER_JAR} />
    </KitchenShot>
  );
};

/** His moment: standing, jar raised, golden sunset behind. */
const raisePose = once(() => reach(mergePose(REST, { expression: "smile", headPitch: 0.25 }), "r", [-0.7, 4.7, 0.5]).pose);
const c6Moment: ShotFn = (c) => {
  const me: V3 = [0.5, 0, -2.2];
  const pose = raisePose();
  const h = handPosition(pose, "r", me, 0.2);
  const cam = move({ position: [0.8, 1.6, 7.5], target: [0.4, 3.8, -3] }, { position: [0.8, 1.6, 6.8], target: [0.4, 4.0, -3] }, c);
  return (
    <KitchenShot c={c} cam={cam} evening>
      <Hero pose={pose} position={me} yaw={0.2} />
      <Jar position={[h[0], h[1] + 0.22 + JAR.h / 2, h[2]]} />
      <Halo position={[h[0], h[1] + 0.6, h[2] - 0.5]} size={4 + Math.sin(c.t * 4) * 0.4} color="#FFE2A0" opacity={0.55} />
    </KitchenShot>
  );
};

/** Close on his hands: grab the lid, twist… strain. */
const twistPose = once(() => {
  const l = reach(mergePose(REST, { expression: "worried", headPitch: -0.3 }), "l", [0.1, 2.0, 0.9]).pose;
  return reach(l, "r", [-0.05, 2.0 + JAR.h / 2 + 0.34, 0.9]).pose;
});
const TWIST_ME: V3 = [0.4, 0, -1.6];
const c6Twist: ShotFn = (c) => {
  const pose = twistPose();
  const l = handPosition(pose, "l", TWIST_ME, 0);
  const jar: V3 = [l[0] - 0.05 - JAR.r - 0.2 + 0.3, l[1], l[2]];
  const strain = c.lt > 0.9 ? Math.sin(c.t * 60) * 0.015 : 0;
  const cam = move({ position: [TWIST_ME[0] + 1.6, 3.6, 4.8], target: [TWIST_ME[0], 2.9, -0.9] }, { position: [TWIST_ME[0] + 1.4, 3.55, 4.2], target: [TWIST_ME[0], 2.9, -0.9] }, c);
  return (
    <KitchenShot c={c} cam={cam} evening>
      <Hero pose={mergePose(pose, { expression: c.lt > 0.9 ? "alarm" : "worried" })} position={[TWIST_ME[0] + strain, 0, TWIST_ME[2]]} />
      <Jar position={[jar[0] + strain, jar[1] + 0.05, jar[2]]} />
    </KitchenShot>
  );
};

/** Nothing. His face. */
const c6Nothing: ShotFn = (c) => {
  const me: V3 = [0.4, 0, -1.6];
  const head = headPosition(twistPose(), me, 0);
  const cam = move({ position: [head[0] + 0.8, head[1] + 0.2, head[2] + 4.2], target: [head[0], head[1] - 0.45, head[2]] }, { position: [head[0] + 0.7, head[1] + 0.2, head[2] + 3.7], target: [head[0], head[1] - 0.45, head[2]] }, c);
  return (
    <KitchenShot c={c} cam={cam} evening>
      <Hero pose={mergePose(twistPose(), { expression: "worried", headPitch: 0 })} position={me} />
      {[0, 1].map((i) => {
        const life = ((c.t * 1.4 + i * 0.5) % 1 + 1) % 1;
        return (
          <mesh key={i} position={[head[0] + (i ? 0.62 : -0.62), head[1] + 0.35 - life * 0.6, head[2] + 0.3]}>
            <IcoG args={[0.07, 1]} />
            <Glow color="#9FD0FF" />
          </mesh>
        );
      })}
    </KitchenShot>
  );
};

/** She takes it back… two fingers. POP! */
const c6Pop: ShotFn = (c) => {
  const pop = cueAt(c, "fingers", 2.2);
  const lid = k01(c.lt, pop - 0.15, pop + 0.25);
  const cam = move({ position: [OFFER_JAR[0] + 1.3, OFFER_JAR[1] + 1.1, 3.4], target: [OFFER_JAR[0] - 0.2, OFFER_JAR[1] + 0.5, 0] }, { position: [OFFER_JAR[0] + 1.15, OFFER_JAR[1] + 1.05, 3.0], target: [OFFER_JAR[0] - 0.2, OFFER_JAR[1] + 0.55, 0] }, c);
  const at = project([OFFER_JAR[0], OFFER_JAR[1] + 0.9, 0], cam, c.width, c.height);
  return (
    <KitchenShot c={c} cam={cam} evening overlay={<Burst x={at.x} y={at.y - 60} text="POP!" lt={c.lt - pop} color="#BFF4FF" size={0.8} />}>
      <Table gf={mergePose(offerPose(), { expression: "smile" })} me={meSit({ expression: "alarm" })} />
      <Jar position={OFFER_JAR} lidOff={lid} />
    </KitchenShot>
  );
};

/** Congratulations: a crown lands on his head; she pats it. */
const c6Princess: ShotFn = (c) => {
  const me: V3 = [0.7, 0, -2.7];
  const gfAt: V3 = [-1.5, 0, -3.1];
  const head = headPosition(REST, me, -0.3);
  const land = cueAt(c, "princess", 1.9);
  const drop = 1 - k01(c.lt, land - 0.35, land);
  const crownY = head[1] + 0.62 + drop * 3;
  const cam = move({ position: [0.3, 4.6, 10.5], target: [-0.3, 3.3, -2.8] }, { position: [0.3, 4.5, 9.2], target: [-0.3, 3.4, -2.8] }, { ...c, dur: 3.5 });
  return (
    <KitchenShot c={c} cam={cam} evening>
      <Hero pose={mergePose(REST, { expression: drop < 0.05 ? "worried" : "neutral", headPitch: 0.05 })} position={me} yaw={-0.3} />
      <Crown position={[head[0], crownY, head[2]]} scale={0.75} rotation={[0, c.t * 0.5, 0.08]} />
      {drop < 0.05
        ? Array.from({ length: 5 }, (_, i) => (
            <Halo key={i} position={[head[0] + Math.cos(i * 1.3 + c.t * 2) * 0.9, head[1] + 0.9 + Math.sin(i * 2.1) * 0.3, head[2] + Math.sin(i * 1.3 + c.t * 2) * 0.4]} size={0.4 + 0.2 * Math.sin(c.t * 9 + i)} color="#FFF4C0" opacity={0.9} />
          ))
        : null}
      <Gf pose={mergePose(REST, { expression: "smile", headYaw: -0.3 })} position={gfAt} yaw={0.6} />
    </KitchenShot>
  );
};

// ---------------------------------------------------------------- thumbnail

/** Shorts cover: in the gym she holds the bench overhead with him (alarmed) still on it. */
export const thumbShot: ShotFn = () => {
  const cam: CameraSpec = { position: [2.4, 2.4, 12.0], target: [-0.4, 6.7, -1] };
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.8} shadowSize={14}>
      <Gym />
      <Rack top={RACK_TOP} />
      <Lifting k={1} position={GF_LIFT}>
        <BenchLoad pose={mergePose(LIE_UP, { expression: "alarm", headPitch: 0.3, lShoulder: [1.9, 0.6], rShoulder: [1.3, 0.6] })} />
      </Lifting>
    </Shot>
  );
};

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldSpoon },
    { cue: "tomorrow", fn: coldFace },
    { cue: "ten times", fn: coldFlex },
  ],
  c1: [
    { cue: null, fn: c1Calm },
    { cue: "until she opens", fn: c1Jar },
    { cue: "accidentally", fn: c1Crush },
    { cue: "You laugh", fn: c1Laugh },
    { cue: "she laughs", fn: c1SheLaughs },
    { cue: "Then she goes", fn: c1HugIn },
    { cue: "Three ribs", fn: c1Crack },
  ],
  c2: [
    { cue: null, fn: c2Bags },
    { cue: "including you", fn: c2Carry },
  ],
  c3: [
    { cue: null, fn: c3Front },
    { cue: "You load", fn: c3Load },
    { cue: "She asks", fn: c3Strain },
    { cue: "then casually", fn: c3Lift },
    { cue: "with you still", fn: c3High },
    { cue: "Your gym membership", fn: c3Pointless },
  ],
  c4: [
    { cue: null, fn: c4Worse },
    { cue: "You get into", fn: c4Argue },
    { cue: "She picks up", fn: c4Sofa },
    { cue: "then the fridge", fn: c4Fridge },
    { cue: "then your car", fn: c4Car },
  ],
  c5: [
    { cue: null, fn: c5Phone },
    { cue: "Millions", fn: c5Plane },
    { cue: "Scientists", fn: c5Science },
    { cue: "The military", fn: c5Military },
    { cue: "And you", fn: c5You },
    { cue: "holding her", fn: c5Bottle },
  ],
  c6: [
    { cue: null, fn: c6Problem },
    { cue: "One evening", fn: c6Offer },
    { cue: "Babe", fn: c6Babe },
    { cue: "You finally", fn: c6Moment },
    { cue: "You grab", fn: c6Twist },
    { cue: "Nothing", fn: c6Nothing },
    { cue: "She takes", fn: c6Pop },
    { cue: "Congratulations", fn: c6Princess },
  ],
};
