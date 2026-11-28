/**
 * Shots for "What If You Farted at the Speed of Sound?" (ep. 8).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * Hook: a silent library, the FART SPEED readout racing to 767 MPH, then the blast. PG throughout.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill } from "remotion";
import { IcoG } from "../../slavoski/detail";
import { FONT } from "../../slavoski/fonts";
import { crowdLook, type HeroLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Bush, Clouds, LeafyTree } from "../../slavoski/nature";
import { clamp01, ease, shake, type V3 } from "../../slavoski/noise";
import { CardLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import { groundedBob, headPosition, Hero, lerpPose, mergePose, reach, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { GamingRoom, sittingPose } from "../../slavoski/room";
import { lerpCam, project, Stage, type CameraSpec } from "../../slavoski/Stage";
import { wordAt, type CuedShot } from "../../slavoski/timeline";
import { SmokeCluster } from "../../slavoski/fx";
import { HillRing, House } from "../no-work-2036/props";
import {
  Anvil,
  ANVIL_H,
  Balloon,
  Banner,
  BarrierPane,
  Blast,
  Chalkboard,
  Confetti,
  CountdownBoard,
  DashedArc,
  DbMeter,
  DinnerChair,
  DiningRoom,
  Fence,
  FlyingBooks,
  FlyingPapers,
  Gantry,
  GasJar,
  GasPuff,
  KitchenScale,
  LaunchSite,
  Lab,
  Library,
  LIB,
  Medal,
  Monitor,
  OpenBook,
  BookStack,
  ReadingTable,
  Bench,
  DeskLamp,
  PartDecal,
  Podium,
  PODIUM_TOP,
  PressureGauge,
  Ring,
  Rocket,
  SaltFlat,
  SeatRip,
  Snail,
  Sparkles,
  TABLE,
  TapeMeasure,
  TrafficCone,
  VapourCone,
  XrayArch,
} from "./props";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
/** Absolute time of a phrase (searched from `from`), as local time in this shot. */
const cueLt = (c: ShotCtx, phrase: string, from = 0, fallback = 0.5) => wordAt(c.words, phrase, from, c.t - c.lt + fallback) - (c.t - c.lt);
const grounded = (p: Pose): Pose => ({ ...p, bob: groundedBob(p) });
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const Shot: React.FC<{ children: React.ReactNode; overlay?: React.ReactNode } & React.ComponentProps<typeof Stage>> = ({ children, overlay, ...stage }) => (
  <AbsoluteFill>
    <Stage {...stage}>{children}</Stage>
    {overlay}
  </AbsoluteFill>
);

/** A quick white flash (impacts, the pop). */
const Flash: React.FC<{ lt: number; at: number; len?: number; color?: string; max?: number }> = ({ lt, at, len = 0.18, color = "#FFFFFF", max = 0.75 }) => {
  const k = lt - at;
  if (k < 0 || k > len) return null;
  return <AbsoluteFill style={{ background: color, opacity: max * (1 - k / len), pointerEvents: "none" }} />;
};

/** A small comic word pinned to a 3D point (never over a face). */
const Pinned: React.FC<{ at: V3; cam: CameraSpec; c: ShotCtx; text: string; size?: number; color?: string; show: number; rotate?: number }> = ({ at, cam, c, text, size = 40, color = P.white, show, rotate = -8 }) => {
  if (show <= 0) return null;
  const p = project(at, cam, c.width, c.height);
  const s = Math.min(1, show * 3);
  return (
    <div
      style={{
        position: "absolute",
        left: p.x,
        top: p.y,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${0.6 + 0.4 * s})`,
        opacity: s,
        fontFamily: FONT,
        fontWeight: 700,
        fontStyle: "italic",
        fontSize: size,
        color,
        textShadow: "0 0 6px rgba(0,0,0,0.8), 0 3px 10px rgba(0,0,0,0.5)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

/** Square glasses on a head (for the librarian). */
const Glasses: React.FC<{ head: V3; yaw?: number; tilt?: number }> = ({ head, yaw = 0, tilt = 0 }) => (
  <group position={head} rotation={[0, yaw, tilt]}>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.21, 0.1, 0.72]} rotation={[0, 0, Math.PI / 4]}>
        <ringGeometry args={[0.13, 0.17, 4]} />
        <meshBasicMaterial color="#1A1A22" />
      </mesh>
    ))}
    <mesh position={[0, 0.12, 0.72]}>
      <planeGeometry args={[0.14, 0.03]} />
      <meshBasicMaterial color="#1A1A22" />
    </mesh>
  </group>
);

const LIBRARIAN: HeroLook = { ...crowdLook(3), hair: "#BDBDBD", jacket: "#5A4A78", jacketShade: "#4A3C64" };
const GRANDMA: HeroLook = { ...crowdLook(11), hair: "#D0D0D0", jacket: "#8A3A3A", jacketShade: "#723030" };

/** Pale salt dust kicked up around a point (never dark: dark smoke behind a backside reads wrong). */
const SaltDust: React.FC<{ position: V3; t: number; count?: number; r?: number }> = ({ position, t, count = 12, r = 3.2 }) => {
  if (t <= 0) return null;
  const g = ease(clamp01(t / 0.7));
  return (
    <group position={position}>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + i;
        const d = r * (0.5 + 0.7 * g) * (0.6 + ((i * 37) % 10) / 25);
        const s = (0.5 + ((i * 13) % 7) / 10) * (0.4 + 0.8 * g);
        return (
          <mesh key={i} position={[Math.cos(a) * d, s * 0.7 + t * 0.4, Math.sin(a) * d]} rotation={[i, i * 2, 0]}>
            <IcoG args={[s, 1]} />
            <Flat color={i % 2 ? "#F2EEE6" : "#DCD4C4"} opacity={0.85 * clamp01(1 - (t - 1.2) / 1.5)} />
          </mesh>
        );
      })}
    </group>
  );
};

// ---------------------------------------------------------------- poses

/** Seated at a table, both fists resting on the top at `handY` and `handZ` ahead (hero-root space). */
const seatedAt = (over: Partial<Pose> = {}, handY = LIB.tableTop + 0.24, handZ = 0.95, handX = 0.55): Pose => {
  let p = sittingPose(over);
  p = reach(p, "l", [handX, handY, handZ]).pose;
  p = reach(p, "r", [-handX, handY, handZ]).pose;
  return p;
};
const SEATED = seatedAt({ headPitch: -0.25 });

/** Bracing to let one rip: knees soft, fists clenched at the chest. */
const strain = (over: Partial<Pose> = {}): Pose =>
  grounded(mergePose(REST, { lKnee: 0.3, rKnee: 0.3, lHip: [0.25, 0.12], rHip: [0.25, 0.12], lean: 0.12, lShoulder: [0.35, 0.45], rShoulder: [0.35, 0.45], lElbow: 1.5, rElbow: 1.5, expression: "worried", ...over }));

const V_ARMS: Partial<Pose> = { lShoulder: [0.15, 2.4], rShoulder: [0.15, 2.4], lElbow: 0.25, rElbow: 0.25 };

/** Ready to launch: a sprinter's crouch. */
const crouch = (over: Partial<Pose> = {}): Pose =>
  grounded(mergePose(REST, { lean: 0.5, lHip: [0.95, 0.1], rHip: [0.55, 0.1], lKnee: 1.25, rKnee: 0.85, lShoulder: [-0.55, 0.25], rShoulder: [-0.55, 0.25], lElbow: 0.5, rElbow: 0.5, headPitch: 0.35, expression: "smile", ...over }));

// ---------------------------------------------------------------- cold open: the library

const HERO: V3 = [0, 0, 0];
const LIBRARIAN_AT: V3 = [3.6, 0, -6.0];

/** The library around Slavoski's table: open book, stacks, lamp, readers, the librarian. */
const LibraryScene: React.FC<{ lt: number; blastAt?: number; c: ShotCtx; tremble?: number; heroPose?: Pose; papers?: boolean }> = ({ lt, blastAt = 99, tremble = 0, heroPose, papers = true }) => {
  const tb = lt - blastAt;
  const blown = tb > 0;
  const jolt = blown ? Math.exp(-tb * 4) : 0;
  const shushPose = (() => {
    const base = mergePose(REST, { expression: "worried", headPitch: -0.05 });
    const head = headPosition(base);
    return reach(base, "r", [head[0] - 0.05, head[1] - 0.2, head[2] + 0.95]).pose;
  })();
  const libPose = blown ? grounded(mergePose(REST, { expression: "alarm", lShoulder: [0.3, 1.2], rShoulder: [0.3, 1.2], lElbow: 1.3, rElbow: 1.3, lean: -0.15 * jolt - 0.05, headPitch: 0.1 })) : shushPose;
  const readerPose = (k: number) =>
    blown ? seatedAt({ expression: "alarm", headYaw: k > 0 ? -0.5 : 0.6, headPitch: 0.1, lean: -0.1 }, LIB.tableTop + 0.24, 1.0) : seatedAt({ headPitch: -0.3 }, LIB.tableTop + 0.24, 1.0);
  const hp = heroPose ?? (blown ? seatedAt({ expression: tb < 0.6 ? "alarm" : "worried", headPitch: 0.05, lean: -0.08 * jolt }) : SEATED);
  const trem = shake("trem", lt, tremble);
  const libHead = headPosition(libPose, LIBRARIAN_AT);
  return (
    <group>
      <Library />
      <ReadingTable position={[0, 0, LIB.tableZ]} />
      <Bench position={[0, 0, 0]} w={5} />
      <DeskLamp position={[2.4, LIB.tableTop, 2.2]} />
      {!blown ? (
        <>
          <OpenBook position={[0, LIB.tableTop, 1.25]} />
          <BookStack position={[-2.2, LIB.tableTop, 1.6]} n={3} seed="hero" yaw={0.2} />
          <BookStack position={[1.5, LIB.tableTop, 2.4]} n={2} seed="hero2" yaw={-0.3} />
        </>
      ) : (
        <>
          <FlyingBooks origin={[0, LIB.tableTop + 0.1, 1.6]} t={tb} count={7} seed="blast" speed={7} />
          {papers ? <FlyingPapers origin={[0, LIB.tableTop + 0.1, 1.4]} t={tb} count={18} seed="pp" speed={8} /> : null}
          <FlyingPapers origin={[-6, LIB.tableTop + 0.1, -3.6]} t={tb - 0.12} count={8} seed="pp2" speed={5} />
        </>
      )}
      <Hero pose={hp} position={add(HERO, trem)} />
      {/* readers at the back table */}
      <Hero pose={readerPose(1)} position={[-7.4, 0, -5.3]} look={crowdLook(4)} />
      <Hero pose={readerPose(-1)} position={[-4.6, 0, -5.3]} look={crowdLook(8)} />
      <Hero pose={libPose} position={LIBRARIAN_AT} look={LIBRARIAN} />
      <Glasses head={libHead} tilt={blown ? 0.25 * Math.min(1, tb * 4) : 0} />
      {blown ? <Blast position={[0, 1.0, -0.6]} p={tb / 0.9} radius={16} /> : null}
      {blown ? <GasPuff position={[0, 0.9 + tb * 0.4, -1.2 - tb * 0.6]} size={0.9 * Math.min(1, tb * 3)} t={lt} seed="libgas" opacity={0.7 * clamp01(1 - (tb - 0.8) / 1.5)} /> : null}
    </group>
  );
};

/** 0 s: Slavoski's face, straining, in total silence. The FART SPEED readout starts to climb. */
const coldFace: ShotFn = (c) => {
  const hp = headPosition(SEATED, HERO);
  const pose = { ...SEATED, expression: "worried" as const, headPitch: -0.05, blink: c.lt > 0.9 && c.lt < 0.98 ? 1 : 0 };
  const cam = move({ position: [hp[0] + 1.1, hp[1] - 0.1, hp[2] + 6.4], target: [hp[0] + 0.1, hp[1] + 0.1, hp[2] - 3] }, { position: [hp[0] + 0.8, hp[1] - 0.05, hp[2] + 5.4], target: [hp[0] + 0.05, hp[1] + 0.15, hp[2] - 3] }, c);
  const sweat: V3 = [hp[0] + 0.62, hp[1] + 0.25 - c.lt * 0.35, hp[2] + 0.38];
  return (
    <Shot mood="day" camera={cam} shake={0.006 + c.lt * 0.01} fog={false} stars={false} shadowSize={14}>
      <LibraryScene lt={c.lt} c={c} heroPose={pose} tremble={0.01 + c.lt * 0.012} />
      <mesh position={sweat} scale={[1, 1.5, 1]}>
        <IcoG args={[0.05, 1]} />
        <Glow color="#BFE3FF" />
      </mesh>
    </Shot>
  );
};

/** The quiet library. Slavoski trembles; the librarian shushes; the title comes in. */
const coldWide: ShotFn = (c) => {
  const cam = move({ position: [3.9, 4.4, 17.5], target: [1.0, 3.1, -2] }, { position: [3.0, 4.0, 14.6], target: [0.9, 3.0, -2] }, c);
  const pose = seatedAt({ expression: c.lt > 1.8 ? "alarm" : "worried", headPitch: -0.1 });
  return (
    <Shot mood="day" camera={cam} fog={false} stars={false} shadowSize={22}>
      <LibraryScene lt={c.lt} c={c} heroPose={pose} tremble={0.01 + c.lt * 0.02} />
    </Shot>
  );
};

/** "…per hour?" BOOM: the shock ring, books and papers everywhere. */
const coldBlast: ShotFn = (c) => {
  const blastAt = cueLt(c, "hour", 3.5, 0.1) + 0.26;
  const tb = c.lt - blastAt;
  const cam = move({ position: [-5.2, 7.2, 12.5], target: [0.4, 2.0, -2.2] }, { position: [-4.6, 6.6, 11.2], target: [0.4, 2.0, -2.2] }, c);
  return (
    <Shot mood="day" camera={cam} shake={tb > 0 ? 0.45 * Math.exp(-tb * 3.5) : 0.02} shakeSeed="blast" fog={false} stars={false} shadowSize={24} overlay={<Flash lt={c.lt} at={blastAt} len={0.15} max={0.55} />}>
      <LibraryScene lt={c.lt} c={c} blastAt={blastAt} tremble={tb < 0 ? 0.04 : 0} />
    </Shot>
  );
};

/** "That's the speed of sound." The librarian, glasses askew, papers drifting down. */
const coldLibrarian: ShotFn = (c) => {
  const blastAt = cueLt(c, "hour", 3.5, -1) + 0.26;
  const libPose = grounded(mergePose(REST, { expression: "alarm", lShoulder: [0.3, 1.2], rShoulder: [0.3, 1.2], lElbow: 1.3, rElbow: 1.3, headPitch: 0.1, lean: -0.05 }));
  const head = headPosition(libPose, LIBRARIAN_AT);
  const cam = move({ position: [head[0] - 2.0, head[1] + 0.2, head[2] + 8.4], target: [head[0] - 0.1, head[1] + 0.05, head[2]] }, { position: [head[0] - 1.8, head[1] + 0.2, head[2] + 7.4], target: [head[0] - 0.1, head[1] + 0.05, head[2]] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} stars={false} shadowSize={16}>
      <LibraryScene lt={c.lt - blastAt} c={c} blastAt={0} />
      <FlyingPapers origin={[head[0] - 1.2, head[1] + 2.4, head[2] + 2.2]} t={0.5 + c.lt * 0.6} count={6} seed="lpap" speed={2} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 SOUND BARRIER: the salt flat

/** "First, an incredibly loud blast." The dB meter pins; the blast ring rips across the salt. */
const c1Blast: ShotFn = (c) => {
  const loud = cueLt(c, "loud", 6, 1.9);
  const blast = cueLt(c, "blast", 6, 2.2);
  const tb = c.lt - blast;
  const v = tb > 0 ? 1 - Math.exp(-tb * 30) * 0.2 + Math.sin(c.lt * 60) * 0.015 : c.lt > loud - 0.3 ? 0.25 + 0.45 * k01(c.lt, loud - 0.3, blast) : 0.15 + Math.sin(c.lt * 9) * 0.03;
  const pose = tb > 0 ? strain({ expression: tb < 0.5 ? "alarm" : "awe", headPitch: 0.1 }) : strain({ expression: "worried" });
  const cam = move({ position: [1.8, 3.1, 17], target: [0.9, 3.0, 0] }, { position: [1.4, 3.0, 14.5], target: [0.8, 3.0, 0] }, c);
  return (
    <Shot mood="day" camera={cam} shake={tb > 0 ? 0.35 * Math.exp(-tb * 3) : 0} shakeSeed="c1b" fog={[80, 600]} stars={false} shadowSize={20} overlay={<Flash lt={c.lt} at={blast} len={0.12} max={0.4} />}>
      <SaltFlat />
      <Clouds t={c.t} color="#F4F6FA" y={45} radius={260} count={14} seed="c1" />
      <Hero pose={pose} position={HERO} />
      <DbMeter position={[2.3, 0, 7.4]} yaw={-0.2} value={v} cracked={tb > 0.05} />
      {[-6, -3.5, 4.5, 7].map((x, i) => (
        <TrafficCone key={i} position={[x, 0, -4 - (i % 2) * 3]} />
      ))}
      {tb > 0 ? (
        <>
          <Blast position={[0, 1.2, -0.5]} p={tb / 0.9} radius={14} />
          <SaltDust position={[0, 0, -1]} t={tb} />
          <GasPuff position={[0, 1.2 + tb * 0.4, -1.4 - tb * 1.2]} size={0.9 * Math.min(1, tb * 3)} t={c.lt} seed="flatgas" />
        </>
      ) : null}
    </Shot>
  );
};

/** Mach diagram: the puff's sound rings pile up into a cone once it passes the speed of sound. */
const C_SND = 5;
const MACH_RAMP = 2.6;
export const machNumber = (lt: number) => 0.5 + clamp01(lt / MACH_RAMP) * 1.0;
const machY = (lt: number) => {
  const k = Math.min(lt, MACH_RAMP);
  let y = C_SND * (0.5 * k + (0.5 * k * k) / MACH_RAMP);
  if (lt > MACH_RAMP) y += C_SND * 1.5 * (lt - MACH_RAMP);
  return y;
};
const c1Mach: ShotFn = (c) => {
  const lt = Math.max(0, c.lt - 0.15);
  const y0 = 1.6;
  const py = y0 + machY(lt);
  const M = machNumber(lt);
  const camY = 4 + machY(lt) * 0.82;
  const cam: CameraSpec = { position: [0, camY, 26], target: [0, camY + 0.5, 0] };
  const rings: { y: number; r: number; age: number }[] = [];
  for (let te = 0; te <= lt; te += 0.12) rings.push({ y: y0 + machY(te), r: C_SND * (lt - te), age: lt - te });
  const mu = M > 1.01 ? Math.asin(1 / M) : 0;
  const crossed = M >= 1;
  return (
    <Shot
      mood="day"
      camera={cam}
      fog={[80, 700]}
      stars={false}
      shadows={false}
      overlay={crossed ? <CardLine text="MACH 1 = 767 MPH" sub="THE SPEED OF SOUND" y={250} appearFrame={Math.round((c.t - c.lt + 0.15 + MACH_RAMP / 2) * 30)} /> : null}
    >
      <SaltFlat flags={false} />
      <Clouds t={c.t} color="#F4F6FA" y={40} radius={240} count={14} seed="mach" />
      {rings.map((r, i) => (
        <Ring key={i} position={[0, r.y, 0]} radius={r.r} width={0.09} color={P.white} opacity={0.85 * clamp01(1 - r.age / 2.6)} />
      ))}
      {mu > 0
        ? [-1, 1].map((s) => (
            <mesh key={s} position={[(s * Math.sin(mu) * 6) / 1, py - Math.cos(mu) * 6, 0.05]} rotation={[0, 0, s * mu]}>
              <planeGeometry args={[0.14, 12]} />
              <Glow color={P.amber} />
            </mesh>
          ))
        : null}
      {/* speed streaks under the puff */}
      {[-0.35, 0, 0.35].map((x, i) => (
        <mesh key={i} position={[x, py - 1.2 - M * 0.5 - i * 0.15, -0.1]}>
          <planeGeometry args={[0.07, 1.2 + M]} />
          <Glow color={P.white} opacity={0.55} />
        </mesh>
      ))}
      <GasPuff position={[0, py, 0]} size={0.75} t={c.lt} seed="mach" stretch={[1 / Math.sqrt(M), Math.sqrt(M), 1]} />
    </Shot>
  );
};

/** "…a tiny sonic boom." From behind: a little vapour cone pops off the seat of his jeans. */
const c1Vapour: ShotFn = (c) => {
  const boom = cueLt(c, "boom", 12, 1.0);
  const tb = c.lt - boom + 0.08;
  const pose = strain({ lean: 0.22, expression: "worried" });
  const cam = move({ position: [3.8, 2.3, -9.5], target: [0, 2.1, 0] }, { position: [3.2, 2.2, -8.2], target: [0, 2.1, 0] }, c);
  const seat: V3 = [0, 1.42, -0.5];
  return (
    <Shot mood="day" camera={cam} shake={tb > 0 ? 0.05 * Math.exp(-tb * 5) : 0} fog={[80, 600]} stars={false} shadowSize={16}
      overlay={<Pinned at={[-0.9, 1.7, -1.5]} cam={cam} c={c} text="boom." size={38} show={tb > 0 ? Math.min(1, tb * 2) : 0} />}
    >
      <SaltFlat />
      <Clouds t={c.t} color="#F4F6FA" y={45} radius={260} count={14} seed="c1v" />
      <Hero pose={pose} position={HERO} />
      <VapourCone position={seat} rotation={[0, Math.PI, 0]} length={1.3} radius={0.7} p={clamp01(tb / 0.7)} />
      {tb > 0 ? <Ring position={[0, 1.42, -1.0 - tb * 1.5]} radius={0.3 + tb * 2.2} width={0.07} opacity={0.7 * clamp01(1 - tb / 0.7)} /> : null}
      {tb > 0 ? <GasPuff position={[0, 1.4, -1.0 - tb * 0.9]} size={0.35 * Math.min(1, tb * 4)} t={c.lt} seed="vap" opacity={0.8} /> : null}
    </Shot>
  );
};

/** "Congratulations": the winners' podium, a medal, confetti. */
const c1Podium: ShotFn = (c) => {
  const pose = grounded(mergePose(REST, { ...V_ARMS, expression: "smile", headPitch: 0.1 }));
  const at: V3 = [0, PODIUM_TOP, 0];
  const cam = move({ position: [0.5, 3.8, 15.5], target: [0, 4.0, 0] }, { position: [0.4, 3.9, 13.8], target: [0, 4.1, 0] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[80, 600]} stars={false} shadowSize={16}>
      <SaltFlat />
      <Clouds t={c.t} color="#F4F6FA" y={45} radius={260} count={14} seed="pod" />
      <Podium position={[0, 0, 0]} />
      <Hero pose={pose} position={at} />
      <Medal position={[0, PODIUM_TOP + 2.25, 0.42]} />
      <Banner position={[0, 8.0, -3.5]} w={6.2} h={1.3} text="MACH 1 CHAMPION" />
      <Confetti center={[0, 5, 0.5]} size={[10, 9, 6]} t={c.lt + 0.6} count={180} seed="pod" fall={3} />
    </Shot>
  );
};

/** "…your backside has just broken the sound barrier." The glass pane behind him shatters. */
const c1Barrier: ShotFn = (c) => {
  const broken = cueLt(c, "broken", 15, 1.4) + 0.06;
  const PANE: V3 = [1.0, 0, -4.2];
  const ME: V3 = [-1.2, 0, 0];
  const ts = c.lt - broken;
  const seat: V3 = [ME[0], 1.45, -0.45];
  const hit: V3 = [1.0, 1.7, PANE[2]];
  const fly = clamp01((c.lt - (broken - 0.3)) / 0.3);
  const puff: V3 = [seat[0] + (hit[0] - seat[0]) * fly, seat[1] + (hit[1] - seat[1]) * fly, seat[2] + (hit[2] - seat[2]) * fly];
  const look = k01(c.lt, broken + 0.1, broken + 0.45);
  const pose = grounded(mergePose(REST, { expression: ts > 0 ? "awe" : "smile", headYaw: 0.9 * look, headPitch: 0.05, lShoulder: [0.05, 0.25], rShoulder: [0.05, 0.25], lElbow: 0.3, rElbow: 0.3 }));
  const cam = move({ position: [2.2, 3.2, 15], target: [-0.1, 3.1, -2] }, { position: [1.9, 3.1, 13.6], target: [-0.1, 3.1, -2] }, c);
  return (
    <Shot mood="day" camera={cam} shake={ts > 0 ? 0.22 * Math.exp(-ts * 4) : 0} fog={[80, 600]} stars={false} shadowSize={18} overlay={<Flash lt={c.lt} at={broken} len={0.1} max={0.35} />}>
      <SaltFlat />
      <Clouds t={c.t} color="#F4F6FA" y={45} radius={260} count={14} seed="bar" />
      <BarrierPane position={PANE} t={c.lt} shatter={broken} hit={[hit[0] - PANE[0], hit[1], 0]} w={5.2} h={6.0} />
      <Hero pose={pose} position={ME} />
      {fly > 0 && fly < 1 ? <GasPuff position={puff} size={0.5} t={c.lt} seed="barp" stretch={[1, 1, 1.6]} /> : null}
      {ts > 0 ? <GasPuff position={[hit[0], hit[1] + ts * 0.5, hit[2] - ts * 1.5]} size={0.6 * clamp01(1 - ts / 1.4)} t={c.lt} seed="barq" opacity={0.7} /> : null}
      {ts > 0 ? <Ring position={hit} radius={0.4 + ts * 9} width={0.15} opacity={0.6 * clamp01(1 - ts / 0.6)} /> : null}
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 UNDER PRESSURE: overcast, the lab

/** "But things get worse." Clouds roll over the salt flat; his grin drops. */
const c2Worse: ShotFn = (c) => {
  const worse = cueLt(c, "worse", 18, 1.0);
  const pose = grounded(mergePose(REST, { expression: c.lt < worse - 0.1 ? "smile" : "worried", headPitch: c.lt < worse ? 0 : 0.25, lShoulder: [0.05, 0.15], rShoulder: [0.05, 0.15] }));
  const hp = headPosition(pose, HERO);
  const cam = move({ position: [1.0, hp[1] - 0.2, 8.5], target: [0.1, hp[1] - 0.9, 0] }, { position: [0.7, hp[1] - 0.1, 6.6], target: [0.05, hp[1] - 0.8, 0] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[60, 420]} stars={false} shadowSize={14}>
      <SaltFlat tint="#D8D4CA" />
      <Clouds t={c.t * 3} color="#8E96A3" y={22} radius={120} count={22} seed="worse" scale={1.3} />
      <Hero pose={pose} position={HERO} />
    </Shot>
  );
};

/** "To accelerate gas to that speed…" The GUT PRESSURE gauge swings from SAFE to NOPE. */
const c2Gauge: ShotFn = (c) => {
  const speed = cueLt(c, "speed", 20, 1.4);
  const v = 0.12 + 0.85 * k01(c.lt, 0.2, speed + 0.1) + (c.lt > speed ? Math.sin(c.lt * 45) * 0.02 : 0);
  const G: V3 = [0, 4.6, -7.4];
  const cam = move({ position: [0.6, 4.2, 2.6], target: [0, 4.1, -7.4] }, { position: [0.35, 4.3, 1.4], target: [0, 4.15, -7.4] }, c);
  const steam = c.lt > speed - 0.2;
  return (
    <Shot mood="overcast" camera={cam} shake={c.lt > speed ? 0.02 : 0} fog={false} stars={false} shadowSize={12}>
      <Lab />
      <PressureGauge position={G} value={v} />
      {steam ? <GasPuff position={[1.8, 7.3 + (c.lt - speed) * 0.6, -7.3]} size={0.35 + (c.lt - speed) * 0.4} t={c.lt} seed="steam" opacity={0.6} /> : null}
    </Shot>
  );
};

const drawPressureScreen = (k: number, alarm: boolean, lt: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0A1024";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#7FC8FF";
  ctx.font = `700 ${Math.round(H * 0.12)}px "Slavoski Sans", "DejaVu Sans", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("GUT PRESSURE", W / 2, H * 0.18);
  const bw = W * 0.8, bh = H * 0.2, bx = W * 0.1, by = H * 0.42;
  ctx.strokeStyle = "#7FC8FF";
  ctx.lineWidth = 4;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = k > 0.7 ? "#FF5A4A" : k > 0.4 ? P.amber : "#7FD6A0";
  ctx.fillRect(bx + 4, by + 4, (bw - 8) * clamp01(k), bh - 8);
  if (alarm && Math.floor(lt * 5) % 2 === 0) {
    ctx.fillStyle = "#FF5A4A";
    ctx.font = `700 ${Math.round(H * 0.15)}px "Slavoski Sans", "DejaVu Sans", sans-serif`;
    ctx.fillText("⚠ DANGER", W / 2, H * 0.82);
  }
};

/** "…your body would need to generate enormous pressure." X-ray: a balloon swelling inside him. */
const c2Xray: ShotFn = (c) => {
  const enormous = cueLt(c, "enormous", 22, 1.4);
  const k = k01(c.lt, 0.1, enormous + 0.8);
  const pose = grounded(mergePose(REST, { expression: k > 0.6 ? "alarm" : "worried", lShoulder: [0.05, 0.3], rShoulder: [0.05, 0.3], lElbow: 0.3, rElbow: 0.3 }));
  const cam = move({ position: [1.9, 3.7, 14], target: [1.1, 3.3, 0] }, { position: [1.6, 3.6, 12.4], target: [1.05, 3.3, 0] }, c);
  const r = 0.26 + 0.34 * k;
  return (
    <Shot mood="overcast" camera={cam} fog={false} stars={false} shadowSize={16}>
      <Lab />
      <XrayArch position={[0, 0, 0]} />
      <Hero pose={pose} position={HERO} ghost={0.55} />
      <mesh position={[0, 2.05, 0.02]} scale={[1, 1.1, 0.85]}>
        <IcoG args={[r, 2]} />
        <Flat color={k > 0.7 ? "#E0281E" : "#D8382D"} />
      </mesh>
      <Halo position={[0, 2.05, 0.3]} size={1.4 + k} color="#FF5A4A" opacity={0.3 * k} />
      <Monitor position={[2.75, 0, 1.7]} yaw={-0.3} w={1.7} h={1.1} standH={4.4} draw={drawPressureScreen(k, k > 0.75, c.lt)} />
    </Shot>
  );
};

/** "You could suffer catastrophic internal injuries…" Alarm: red light, his terrified face. */
const c2Alarm: ShotFn = (c) => {
  const pose = grounded(mergePose(REST, { expression: "alarm", headPitch: 0.05, lShoulder: [0.3, 0.6], rShoulder: [0.3, 0.6], lElbow: 1.6, rElbow: 1.6 }));
  const hp = headPosition(pose, HERO);
  const on = Math.floor(c.lt * 4) % 2 === 0;
  const cam = move({ position: [0.9, hp[1] - 0.1, 8.2], target: [0.15, hp[1] - 0.9, 0] }, { position: [0.6, hp[1] - 0.05, 7.0], target: [0.1, hp[1] - 0.85, 0] }, c);
  return (
    <Shot mood="overcast" camera={cam} shake={0.02} fog={false} stars={false} shadowSize={12} light={on ? 0.8 : 1}>
      <Lab alarm={on ? 1 : 0} />
      <Hero pose={pose} position={HERO} />
      <Monitor position={[-1.7, 0, -4.8]} yaw={0.2} w={2.6} h={1.6} standH={4.0} draw={drawPressureScreen(1, true, c.lt)} />
      {on ? <pointLight position={[-3, 6, 3]} color="#FF3A2A" intensity={70} distance={20} decay={2} /> : null}
    </Shot>
  );
};

/** "…before the fart even escaped." The GUT balloon swells, wobbles… pop. */
const c2Pop: ShotFn = (c) => {
  const pop = cueLt(c, "escaped", 27, 1.1) + 0.12;
  const tp = c.lt - pop;
  const size = 1.0 + 0.55 * k01(c.lt, 0, pop);
  const cam = move({ position: [0.4, 4.6, 11], target: [0, 4.6, 0] }, { position: [0.3, 4.6, 9.6], target: [0, 4.6, 0] }, c);
  return (
    <Shot mood="overcast" camera={cam} shake={tp > 0 ? 0.12 * Math.exp(-tp * 6) : 0.01 + c.lt * 0.01} fog={false} stars={false} shadowSize={12} overlay={<Flash lt={c.lt} at={pop} len={0.12} max={0.6} />}>
      <Lab />
      <Balloon position={[0, 3.0, 0]} size={size} pop={tp > 0 ? tp : 0} wobble={c.lt * (6 + c.lt * 6)} />
      {tp > 0.25 ? <GasPuff position={[0.2, 4.6 + (tp - 0.25) * 0.5, 0.3]} size={0.35} t={c.lt} seed="sad" opacity={0.8 * clamp01(1 - (tp - 0.8) / 1)} /> : null}
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 INDESTRUCTIBLE

/** "…somehow indestructible." An anvil lands on his head, clangs off; he grins. */
const c3Anvil: ShotFn = (c) => {
  const hit = cueLt(c, "indestructible", 30, 2.3) + 0.12;
  const th = c.lt - hit;
  const basePose = grounded(mergePose(REST, { expression: th > 0.35 ? "smile" : "neutral", headPitch: th > 0 && th < 0.2 ? -0.15 : 0.0, blink: th > 0 && th < 0.12 ? 1 : 0 }));
  const pose = th > 0 && th < 0.2 ? { ...basePose, bob: basePose.bob - 0.12 * Math.sin((th / 0.2) * Math.PI) } : basePose;
  const hp = headPosition(basePose, HERO);
  const top = hp[1] + 0.78;
  const g = 42;
  let anvil: V3, rot: V3 = [0, 0.3, 0];
  if (th < 0) {
    anvil = [0, top + 0.5 * g * th * th, 0];
  } else {
    // bounce off the head: one full turn in the air, landing upright on the grass (base at y = 0)
    const vx = 3.2, vy = 8, gb = 26;
    const tl = (vy + Math.sqrt(vy * vy + 2 * gb * top)) / gb;
    const tt = Math.min(th, tl);
    anvil = [vx * tt, Math.max(0, top + vy * tt - 0.5 * gb * tt * tt), 0.6 * tt];
    rot = [0, 0.3, -Math.PI * 2 * (tt / tl)];
  }
  const cam = move({ position: [1.2, 3.5, 15.5], target: [0.4, 3.7, 0] }, { position: [1.0, 3.5, 14], target: [0.4, 3.7, 0] }, c);
  return (
    <Shot
      mood="day"
      camera={cam}
      shake={th > 0 ? 0.3 * Math.exp(-th * 5) : 0}
      fog={[60, 420]}
      stars={false}
      shadowSize={18}
      keyDir={[0.8, 0.55, 0.5]}
      overlay={th > 0.05 ? <CardLine text="INDESTRUCTIBLE" y={250} appearFrame={Math.round((c.t - c.lt + hit + 0.05) * 30)} /> : null}
    >
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[400, 0.2, 400]} />
        <Flat color={P.grass} />
      </mesh>
      <Fence x0={-22} x1={22} z={-9} />
      <House position={[-9, 0, -22]} yaw={0.2} scale={1.6} />
      <House position={[11, 0, -24]} yaw={-0.25} scale={1.6} color="#C9D6E0" roof="#5A4A78" />
      <LeafyTree position={[-8, 0, -6]} scale={2.6} seed="yt1" />
      <LeafyTree position={[9, 0, -5]} scale={2.2} seed="yt2" />
      <Bush position={[-4.5, 0, -7.5]} size={1.6} seed="yb1" />
      <Bush position={[5.5, 0, -7.6]} size={1.3} seed="yb2" />
      <HillRing radius={200} seed="yard" />
      <Clouds t={c.t} color="#FFF0DC" y={40} radius={220} count={14} seed="yard" />
      <Hero pose={pose} position={HERO} />
      <Anvil position={anvil} rotation={rot} />
      {th > 0 ? <Sparkles center={[hp[0], top + 0.1, hp[2] + 0.4]} t={th} r={1.2} /> : null}
    </Shot>
  );
};
void ANVIL_H;

/** The living room at 4 pm, with walls tall enough that no sky shows over them. */
const LivingRoom: React.FC = () => (
  <group>
    <GamingRoom hours={4} tvOn={false} cans={0} />
    <mesh position={[0, 10, -5.1]}>
      <boxGeometry args={[12.4, 8, 0.2]} />
      <Flat color="#3A3550" />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 6, 10, 0]}>
        <boxGeometry args={[0.2, 8, 14]} />
        <Flat color="#433D5C" />
      </mesh>
    ))}
    <mesh position={[0, 14, 0]}>
      <boxGeometry args={[12.4, 0.2, 14]} />
      <Flat color="#2E2A40" />
    </mesh>
    <pointLight position={[-4.5, 4, 1]} color="#FFD8A0" intensity={25} distance={16} decay={2} />
  </group>
);

const LR_HERO: V3 = [-0.8, 0, 5.0];

/** "Would you launch yourself across the room?" Crouched, the dashed flight path drawing over the couch. */
const c3Aim: ShotFn = (c) => {
  const pose = crouch();
  const cam = move({ position: [4.2, 5.4, 13.5], target: [-1.7, 2.3, 1.0], fov: 50 }, { position: [3.9, 5.1, 12.4], target: [-1.7, 2.3, 1.0], fov: 50 }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} stars={false} shadowSize={14}>
      <LivingRoom />
      <TapeMeasure start={[0.4, 0, 5.6]} len={9.5} out={k01(c.lt, 0, 0.6)} />
      <Hero pose={pose} position={LR_HERO} yaw={Math.PI} />
      <DashedArc a={[LR_HERO[0], 2.2, LR_HERO[2] - 0.8]} b={[LR_HERO[0], 0.02, -3.6]} h={2.6} p={k01(c.lt, 0.2, 1.3)} />
    </Shot>
  );
};

/** "Unfortunately… no." Side view: a small puff, zero centimetres. */
const c3Fail: ShotFn = (c) => {
  const no = cueLt(c, "no", 35, 1.36);
  const puffAt = 0.35;
  const tp = c.lt - puffAt;
  const stand = k01(c.lt, 0, 0.3);
  const back = k01(c.lt, no - 0.5, no - 0.1);
  const pose = lerpPose(crouch({ expression: "smile" }), grounded(mergePose(REST, { expression: c.lt > no - 0.05 ? "worried" : "neutral", headYaw: -1.0 * back, headPitch: -0.1 * back })), stand);
  const cam = move({ position: [3.0, 3.6, 14.6], target: [-0.6, 2.2, 3.0], fov: 46 }, { position: [2.8, 3.5, 13.6], target: [-0.6, 2.2, 3.0], fov: 46 }, c);
  return (
    <Shot
      mood="day"
      camera={cam}
      fog={false}
      stars={false}
      shadowSize={14}
      overlay={c.lt > no ? <CardLine text="DISTANCE: 0 CM" y={250} appearFrame={Math.round((c.t - c.lt + no) * 30)} /> : null}
    >
      <LivingRoom />
      <TapeMeasure start={[0.4, 0, 5.6]} len={9.5} />
      <Hero pose={{ ...pose, bob: groundedBob(pose) }} position={LR_HERO} yaw={Math.PI} />
      {tp > 0 ? <GasPuff position={[LR_HERO[0], 1.45 + tp * 0.25, LR_HERO[2] + 0.75 + tp * 0.35]} size={0.32 * Math.min(1, tp * 4)} t={c.lt} seed="fail" opacity={0.85 * clamp01(1 - (tp - 0.8) / 0.8)} /> : null}
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 WORST ROCKET EVER: sunset launch pad

const PAD = 0.3;
const ROCKET_AT: V3 = [-5, PAD, -10];
const GANTRY_AT: V3 = [-9.6, PAD, -10];
const PadScene: React.FC<{ t: number; lift?: number; burn?: number; board?: string; smoke?: number }> = ({ t, lift = 0, burn = 0, board = "3", smoke = 0 }) => (
  <group>
    <LaunchSite t={t} />
    <Clouds t={t} color="#F7C0A0" y={50} radius={260} count={14} seed="pad" />
    <Gantry position={GANTRY_AT} />
    <Rocket position={ROCKET_AT} lift={lift} burn={burn} t={t} />
    <CountdownBoard position={[3.6, PAD, -9]} yaw={-0.15} text={board} />
    {smoke > 0 ? (
      <>
        <SmokeCluster position={[ROCKET_AT[0] - 3, PAD, ROCKET_AT[2]]} progress={smoke} radius={5} count={12} seed="rs1" rise={2} color="#C9C2BC" />
        <SmokeCluster position={[ROCKET_AT[0] + 3, PAD, ROCKET_AT[2] + 1]} progress={smoke * 0.9} radius={4.5} count={10} seed="rs2" rise={2} color="#D8D2CC" />
      </>
    ) : null}
  </group>
);

/** "…a normal fart contains far too little mass…" The jar on the scale: 0.1 g. */
const c4Jar: ShotFn = (c) => {
  const far = cueLt(c, "far", 37, 2.9);
  const scramble = c.lt > far - 0.9 && c.lt < far;
  const text = c.lt < far - 0.9 ? "- - - -" : scramble ? `0.0${Math.floor(((c.t * 30) % 10))}${Math.floor((c.t * 77) % 10)} g` : "0.1 g";
  const J: V3 = [7, PAD, 9];
  const top = J[1] + 1.55;
  const cam = move({ position: [J[0] + 3.4, top + 1.8, J[2] + 6.6], target: [J[0] - 0.6, top + 0.05, J[2] - 1.2] }, { position: [J[0] + 2.9, top + 1.6, J[2] + 5.6], target: [J[0] - 0.55, top + 0.1, J[2] - 1.1] }, c);
  return (
    <Shot
      mood="sunset"
      camera={cam}
      fog={[60, 700]}
      stars={false}
      shadowSize={10}
      overlay={c.lt > far + 0.1 ? <CardLine text="A FART ≈ 0.1 GRAMS" y={250} appearFrame={Math.round((c.t - c.lt + far + 0.1) * 30)} /> : null}
    >
      <PadScene t={c.t} />
      <ReadingTable position={[J[0], J[1], J[2]]} w={3.2} d={2} top={1.55} color="#8A939E" />
      <KitchenScale position={[J[0], top, J[2]]} text={text} />
      <GasJar position={[J[0], top + 0.34, J[2] - 0.1]} t={c.lt} />
    </Shot>
  );
};

/** "…to propel you any meaningful distance." A snail overtakes him on the start line. */
const c4Snail: ShotFn = (c) => {
  const H: V3 = [1.5, PAD, 6];
  const pose = crouch({ expression: c.lt > 1.2 ? "worried" : "smile", headPitch: -0.1 });
  const snailX = H[0] - 1.6 + c.lt * 1.25;
  const cam = move({ position: [H[0] + 1.8, 10.5, H[2] + 10.5], target: [H[0] + 0.5, 1.0, H[2] + 1.0] }, { position: [H[0] + 1.6, 10.0, H[2] + 9.6], target: [H[0] + 0.5, 1.0, H[2] + 1.0] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[60, 700]} stars={false} shadowSize={12} overlay={c.lt > 0.25 ? <CardLine text="YOUR TOP SPEED: 0.5 MM/S" y={250} appearFrame={Math.round((c.t - c.lt + 0.25) * 30)} /> : null}>
      <PadScene t={c.t} />
      <mesh position={[H[0] + 1.3, PAD + 0.01, H[2] + 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.25, 6]} />
        <Flat color="#F2F2EE" />
      </mesh>
      <Hero pose={pose} position={H} yaw={Math.PI / 2} />
      <GasPuff position={[H[0] - 0.9, PAD + 1.2, H[2]]} size={0.28} t={c.lt} seed="snailgas" opacity={0.7} />
      <Snail position={[snailX, PAD, H[2] + 1.35]} t={c.lt} scale={1.2} />
    </Shot>
  );
};

const ROCKET_POSE = (over: Partial<Pose> = {}) => grounded(mergePose(REST, { ...V_ARMS, expression: "smile", headPitch: 0.15, ...over }));
const PAD_HERO: V3 = [2, PAD, 3];

/** "You'd become the world's most…" On the pad in a rocket pose, the countdown hits zero. */
const c4Pad: ShotFn = (c) => {
  const board = c.lt < 0.45 ? "2" : c.lt < 0.85 ? "1" : "0";
  const cam = move({ position: [4.6, 3.2, 25], target: [0.2, 5.4, -4] }, { position: [4.3, 3.1, 23], target: [0.2, 5.4, -4] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[60, 700]} stars={false} shadowSize={26}>
      <PadScene t={c.t} board={board} />
      <Hero pose={ROCKET_POSE()} position={PAD_HERO} yaw={-0.15} />
    </Shot>
  );
};

/** "…disappointing rocket engine." His puff goes pfft; the real rocket roars off behind him. */
const c4Launch: ShotFn = (c) => {
  const pff = 0.12;
  const ign = 0.35;
  const ti = c.lt - ign;
  const lift = ti > 0.35 ? 0.5 * 5 * (ti - 0.35) ** 2 * 3 : 0;
  const hop = c.lt > pff && c.lt < pff + 0.3 ? Math.sin(((c.lt - pff) / 0.3) * Math.PI) * 0.12 : 0;
  const look = k01(c.lt, 0.7, 1.1);
  const pose = ROCKET_POSE({ expression: c.lt > 0.5 ? "worried" : "smile", headPitch: 0.15 + 0.5 * look, headYaw: 0.3 * look, lShoulder: [0.1, 1.6 - 0.8 * look], rShoulder: [0.1, 1.6 - 0.8 * look] });
  const tp = c.lt - pff;
  const cam = move({ position: [5.2, 3.3, 15.5], target: [0.6, 3.6, -3] }, { position: [4.8, 3.3, 14.5], target: [0.6, 3.9, -3] }, c);
  return (
    <Shot mood="sunset" camera={cam} shake={ti > 0 ? 0.08 + 0.06 * Math.min(1, ti) : 0} fog={[60, 700]} stars={false} shadowSize={20}>
      <PadScene t={c.t} board="0" lift={lift} burn={ti > 0 ? Math.min(1, ti * 3) : 0} smoke={ti > 0 ? clamp01(ti / 1.4) : 0} />
      <Hero pose={{ ...pose, bob: pose.bob + hop }} position={PAD_HERO} yaw={-0.15} />
      {tp > 0 ? <GasPuff position={[PAD_HERO[0] + 0.1, PAD + 1.3 + tp * 0.2, PAD_HERO[2] - 0.75 - tp * 0.3]} size={0.26 * Math.min(1, tp * 5)} t={c.lt} seed="pfft" opacity={0.85 * clamp01(1 - (tp - 0.6) / 0.6)} /> : null}
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 THE FALLOUT: night

/** "You wouldn't break the laws of physics…" The chalkboard, ticked off: UNBROKEN. */
const c5Board: ShotFn = (c) => {
  const laws = cueLt(c, "laws", 46, 0.7);
  const ticks = clamp01((c.lt - laws + 0.1) / 0.35) + clamp01((c.lt - laws - 0.25) / 0.35) + clamp01((c.lt - laws - 0.6) / 0.35);
  const stamp = clamp01((c.lt - laws - 0.9) / 0.3);
  const cam = move({ position: [0.6, 4.6, 9.8], target: [0, 4.3, -6] }, { position: [0.4, 4.5, 8.6], target: [0, 4.3, -6] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={10} light={0.7}>
      <mesh position={[0, 7, -6.4]}>
        <boxGeometry args={[30, 14, 0.4]} />
        <Flat color="#2E3450" />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[30, 0.2, 30]} />
        <Flat color="#3A2E2A" />
      </mesh>
      <Chalkboard position={[0, 4.4, -6.05]} ticks={ticks} stamp={stamp} />
      <DeskLamp position={[2.6, 1.6, -4.6]} />
      <ReadingTable position={[2.2, 0, -4.6]} w={3} d={1.6} top={1.6} />
      <pointLight position={[1.5, 6, -2]} color="#FFD8A0" intensity={30} distance={16} decay={2} />
    </Shot>
  );
};

const SEAT_X = -2.7;
const HERO_SEAT: V3 = [SEAT_X, 0, 1.4];
const DINE_SEATED = (over: Partial<Pose> = {}) => seatedAt(over, TABLE.top + 0.24, 1.2, 0.5);

/** "…you'd probably just break your trousers." He bends to sit: RIP. */
const c5Rip: ShotFn = (c) => {
  const rip = cueLt(c, "trousers", 48, 1.3);
  const tr = c.lt - rip;
  const bend = k01(c.lt, 0, 0.9);
  const pose = grounded(
    mergePose(REST, {
      lean: 0.55 * bend,
      lHip: [0.5 * bend, 0.08],
      rHip: [0.5 * bend, 0.08],
      lKnee: 0.55 * bend,
      rKnee: 0.55 * bend,
      lShoulder: [0.5 * bend, 0.2],
      rShoulder: [0.5 * bend, 0.2],
      lElbow: 0.4,
      rElbow: 0.4,
      expression: tr > 0 ? "alarm" : "neutral",
      headYaw: tr > 0.1 ? -1.1 * k01(tr, 0.1, 0.4) : 0,
      headPitch: tr > 0 ? 0.1 : -0.2,
    }),
  );
  const at: V3 = [SEAT_X + 0.25, 0, 1.4];
  const cam = move({ position: [-6.5, 3.6, 10.6], target: [-2.4, 2.3, 1.4] }, { position: [-6.4, 3.5, 9.6], target: [-2.4, 2.3, 1.4] }, c);
  return (
    <Shot mood="night" camera={cam} shake={tr > 0 && tr < 0.3 ? 0.04 : 0} fog={false} stars={false} shadowSize={14} overlay={<Pinned at={[at[0] - 1.6, 2.2, at[2] + 1.6]} cam={cam} c={c} text="RRRIP!" size={58} color={P.amber} show={tr > 0 ? Math.min(1, tr * 3) * clamp01(1 - (tr - 0.9) / 0.3) : 0} />}>
      <DiningRoom t={c.t} />
      <DinnerChair position={[SEAT_X - 0.5, 0, -0.1]} yaw={Math.PI / 2 - 0.5} />
      <DinnerChair position={[2.75, 0, 1.4]} yaw={-Math.PI / 2} />
      <DinnerChair position={[2.75, 0, -2.0]} yaw={-Math.PI / 2} />
      <DinnerChair position={[SEAT_X, 0, -2.0]} yaw={Math.PI / 2} />
      <Hero pose={pose} position={at} yaw={Math.PI / 2} />
      <PartDecal pose={pose} part="pelvis" position={at} yaw={Math.PI / 2}>
        <SeatRip p={tr} />
      </PartDecal>
      {tr > 0 ? <GasPuff position={[at[0] - 0.75 - tr * 0.4, 1.35 + tr * 0.2, at[2]]} size={0.25 * Math.min(1, tr * 5)} t={c.lt} seed="rip" opacity={0.8 * clamp01(1 - (tr - 0.5) / 0.6)} /> : null}
    </Shot>
  );
};

type Guest = { at: V3; yaw: number; look: HeroLook; out: V3; seed: number };
const GUESTS: Guest[] = [
  { at: [2.7, 0, 1.4], yaw: -Math.PI / 2, look: crowdLook(5), out: [1, 0, 0.35], seed: 1 },
  { at: [2.7, 0, -2.0], yaw: -Math.PI / 2, look: crowdLook(9), out: [1, 0, -0.2], seed: 2 },
  { at: [SEAT_X, 0, -2.0], yaw: Math.PI / 2, look: crowdLook(14), out: [-1, 0, -0.5], seed: 3 },
  { at: [0, 0, -5.4], yaw: 0, look: GRANDMA, out: [0.9, 0, -0.45], seed: 4 },
];

const GuestsAt: React.FC<{ lt: number; leave?: number }> = ({ lt, leave = 99 }) => (
  <>
    {GUESTS.map((g) => {
      const tl = lt - leave - g.seed * 0.06;
      const sitP = DINE_SEATED({ expression: tl > 0 ? "alarm" : "smile", headYaw: 0 });
      const standK = k01(tl, 0, 0.4);
      const walkT = Math.max(0, tl - 0.4);
      const turn = k01(tl, 0.3, 0.6);
      const outYaw = Math.atan2(g.out[0], g.out[2]);
      const yaw = g.yaw + (((outYaw - g.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * turn;
      const dist = walkT * 4.2;
      const pos: V3 = [g.at[0] + g.out[0] * dist + Math.sin(g.yaw) * -0.4 * standK, 0, g.at[2] + g.out[2] * dist + Math.cos(g.yaw) * -0.4 * standK];
      const pose = walkT > 0 ? grounded(mergePose(walkPose(walkT * 1.8), { expression: "alarm", headYaw: -0.4 })) : standK > 0 ? grounded(lerpPose(sitP, mergePose(REST, { expression: "alarm" }), standK)) : sitP;
      const chair: V3 = [g.at[0] - Math.sin(g.yaw) * (0.15 + 1.0 * standK) + g.out[2] * 0.0, 0, g.at[2] - Math.cos(g.yaw) * (0.15 + 1.0 * standK) + (g.seed % 2 ? 1 : -1) * 1.1 * standK];
      return (
        <React.Fragment key={g.seed}>
          <DinnerChair position={chair} yaw={g.yaw + 0.3 * standK} />
          <Hero pose={pose} position={pos} yaw={yaw} look={g.look} />
        </React.Fragment>
      );
    })}
  </>
);

/** "…and you'd never be invited…" The family gets up and walks out; chairs scrape. */
const c5Leave: ShotFn = (c) => {
  const leave = cueLt(c, "and", 50, 0.15) + 0.05;
  const hp = DINE_SEATED({ expression: "worried", headYaw: Math.sin(c.lt * 3) * 0.5 });
  const cam = move({ position: [0.8, 10.5, 19], target: [-0.5, 1.6, -0.8] }, { position: [0.7, 10.0, 17.8], target: [-0.5, 1.6, -0.8] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={16}>
      <DiningRoom t={c.t} />
      <DinnerChair position={[SEAT_X - 0.15, 0, 1.4]} yaw={Math.PI / 2} />
      <Hero pose={hp} position={HERO_SEAT} yaw={Math.PI / 2} />
      <GuestsAt lt={c.lt} leave={leave} />
    </Shot>
  );
};

/** "…a family dinner again." Alone at the table; the family photo with him crossed out. */
const c5Alone: ShotFn = (c) => {
  const hp = DINE_SEATED({ expression: "worried", headYaw: 0.25, headPitch: -0.15, blink: c.lt > 1.6 && c.lt < 1.7 ? 1 : 0 });
  const cam = move({ position: [6.4, 5.0, 3.6], target: [-2.9, 3.4, 1.9], fov: 50 }, { position: [5.6, 4.9, 3.3], target: [-2.9, 3.4, 1.9], fov: 48 }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={16}>
      <DiningRoom t={c.t} food={false} />
      <DinnerChair position={[SEAT_X - 0.15, 0, 1.4]} yaw={Math.PI / 2} />
      <Hero pose={hp} position={HERO_SEAT} yaw={Math.PI / 2} />
      {GUESTS.map((g) => (
        <DinnerChair key={g.seed} position={[g.at[0] - Math.sin(g.yaw) * 1.15, 0, g.at[2] - Math.cos(g.yaw) * 1.15 + (g.seed % 2 ? 1 : -1) * 1.1]} yaw={g.yaw + 0.3} />
      ))}
    </Shot>
  );
};

// ---------------------------------------------------------------- thumbnail

/** The library blast: books and papers flying, Slavoski mid-boom. */
export const thumbShot: ShotFn = (c) => {
  const cam: CameraSpec = { position: [-2.6, 4.4, 11.5], target: [0.3, 1.9, -1.5] };
  return (
    <Shot mood="day" camera={cam} fog={false} stars={false} shadowSize={22}>
      <LibraryScene lt={0.3} c={c} blastAt={0} papers={false} />
    </Shot>
  );
};

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldFace },
    { cue: "farted", fn: coldWide },
    { cue: "hour", fn: coldBlast },
    { cue: "speed of sound", fn: coldLibrarian },
  ],
  c1: [
    { cue: null, fn: c1Blast },
    { cue: "If the gas", fn: c1Mach },
    { cue: "tiny sonic", fn: c1Vapour },
    { cue: "Congratulations", fn: c1Podium },
    { cue: "your backside", fn: c1Barrier },
  ],
  c2: [
    { cue: null, fn: c2Worse },
    { cue: "To accelerate", fn: c2Gauge },
    { cue: "your body would", fn: c2Xray },
    { cue: "You could suffer", fn: c2Alarm },
    { cue: "before the fart", fn: c2Pop },
  ],
  c3: [
    { cue: null, fn: c3Anvil },
    { cue: "Would you launch", fn: c3Aim },
    { cue: "Unfortunately", fn: c3Fail },
  ],
  c4: [
    { cue: null, fn: c4Jar },
    { cue: "to propel", fn: c4Snail },
    { cue: "You'd become", fn: c4Pad },
    { cue: "disappointing", fn: c4Launch },
  ],
  c5: [
    { cue: null, fn: c5Board },
    { cue: "you'd probably", fn: c5Rip },
    { cue: "and you'd never", fn: c5Leave },
    { cue: "a family dinner", fn: c5Alone },
  ],
};
