/**
 * Shots for "What If Earth's Oxygen DOUBLED Overnight?" (ep. 9).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * Arc: night (the hook) → sunset "today" → night → dawn → sunny backyard → orange wildfire →
 * overcast park → inside the body → misty swamp 300 million years ago → dusk → forest floor → sunset jungle → rooftop.
 */
import type { Caption } from "@remotion/captions";
import React, { useMemo } from "react";
import { AbsoluteFill, random } from "remotion";
import { Bird } from "../../slavoski/critters";
import { BoxG, CylG, IcoG } from "../../slavoski/detail";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Bush, Clouds, LeafyTree } from "../../slavoski/nature";
import { clamp01, ease, noise1, type V3 } from "../../slavoski/noise";
import { CardLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import { groundedBob, handPosition, headPosition, Hero, legJoints, mergePose, reach, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import type { CuedShot } from "../../slavoski/timeline";
import { HillRing, House, Skyline } from "../no-work-2036/props";
import { BED, Bedroom } from "../smart-animals/props";
import { AlarmClock } from "../ww3-countdown/props";
import { HouseFront } from "../verity/props";
import {
  AirGrid,
  Beetle,
  BloodVessel,
  Dragonfly,
  FireField,
  Flame,
  Grill,
  GRILL_TOP,
  Lungs,
  Lycopsid,
  Match,
  Millipede,
  Molecule,
  O2_RED,
  RedCell,
  Spider,
  Swamp,
  SWAMP_LOG,
  TreeFern,
  WaterDrop,
  WildfireHills,
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

/** Slavoski holding a match up in his right hand (hero facing +Z unless `yaw`); returns the pose and the match base. */
const matchStance = (hero: V3, yaw: number, target: V3, over: Partial<Pose> = {}) => {
  const pose = reach(mergePose(REST, over), "r", target, { position: hero, yaw }).pose;
  const hp = handPosition(pose, "r", hero, yaw);
  return { pose, base: [hp[0], hp[1] + 0.14, hp[2]] as V3 };
};

/** Molecules drifting toward a point (breathing in), seeded. */
const Inflow: React.FC<{ to: V3; t: number; count?: number; spread?: number; r?: number; dir?: V3; reach?: number }> = ({ to, t, count = 16, spread = 3, r = 0.1, dir = [0, 0, 1], reach = 2.6 }) => (
  <group>
    {Array.from({ length: count }, (_, i) => {
      const ph = (t * 0.45 + random(`in${i}`)) % 1;
      const d = 0.35 + (1 - ph) * reach * (0.45 + random(`ind${i}`) * 0.55);
      const off: V3 = [(random(`inx${i}`) - 0.5) * spread * (1 - ph), (random(`iny${i}`) - 0.5) * spread * 0.6 * (1 - ph), 0];
      return <Molecule key={i} position={add(to, [dir[0] * d + off[0], dir[1] * d + off[1], dir[2] * d + off[2]])} r={r} o2={i % 4 !== 0} spin={t + i} glow={0.4} />;
    })}
  </group>
);

// ---------------------------------------------------------------- sets

/** A small town: two rows of houses along a street, trees, hills. `jungle` 0..1 grows giant ferns and scale trees through it. */
const TOWN_HOUSES: { p: V3; yaw: number; c: string; r: string }[] = [
  { p: [-36, 0, -8], yaw: 0, c: "#C9B08A", r: "#5A4A78" },
  { p: [-18, 0, -8], yaw: 0, c: "#9AB0A0", r: "#7A3A4A" },
  { p: [0, 0, -8], yaw: 0, c: "#E8DCC4", r: "#C8372D" },
  { p: [18, 0, -8], yaw: 0, c: "#B8A0B8", r: "#2E5A6A" },
  { p: [36, 0, -8], yaw: 0, c: "#D8C8A8", r: "#3A3550" },
  { p: [-27, 0, 26], yaw: Math.PI, c: "#A8B8C8", r: "#5A4A78" },
  { p: [-9, 0, 26], yaw: Math.PI, c: "#E0C8A0", r: "#2E5A6A" },
  { p: [9, 0, 26], yaw: Math.PI, c: "#C8D0B0", r: "#C8372D" },
  { p: [27, 0, 26], yaw: Math.PI, c: "#D0B8A8", r: "#3A3550" },
];
const Town: React.FC<{ jungle?: number; night?: boolean; t: number; back?: boolean }> = ({ jungle = 0, night = false, back = true }) => {
  const plants = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        p: [(random(`jx${i}`) - 0.5) * 110, 0, (random(`jz${i}`) - 0.5) * 90 + 6] as V3,
        lyc: i % 3 === 0,
        h: 20 + random(`jh${i}`) * 16,
        delay: random(`jd${i}`) * 0.5,
      })).filter((p) => Math.abs(p.p[2] - 9) > 7),
    [],
  );
  return (
    <group>
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <Flat color={jungle > 0.3 ? "#3E7A44" : P.grass} />
      </mesh>
      <mesh position={[0, 0.01, 9]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[500, 10]} />
        <Flat color={P.road} />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => (
        <mesh key={i} position={[-112 + i * 15, 0.02, 9]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4, 0.3]} />
          <Flat color={P.laneMark} />
        </mesh>
      ))}
      {TOWN_HOUSES.filter((h) => back || h.p[2] < 0).map((h, i) => (
        <House key={i} position={h.p} yaw={h.yaw} scale={2.1} color={h.c} roof={h.r} lit={night} />
      ))}
      {[-45, -27, -9, 9, 27, 45].map((x, i) => (
        <LeafyTree key={i} position={[x, 0, -2]} scale={2.6} seed={`tt${i}`} />
      ))}
      <HillRing radius={190} color={night ? "#1A2A26" : "#3E6B4A"} />
      {jungle > 0
        ? plants.map((pl, i) => {
            const g = clamp01((jungle - pl.delay) / (1 - pl.delay));
            if (g <= 0) return null;
            return pl.lyc ? <Lycopsid key={i} position={pl.p} h={pl.h} growth={g} seed={`jl${i}`} /> : <TreeFern key={i} position={pl.p} h={8 + pl.h * 0.2} growth={g} seed={`jf${i}`} />;
          })
        : null}
    </group>
  );
};

/** Floating oxygen molecules over the town; `count` of them visible (new ones pop in). */
const SkyMolecules: React.FC<{ count: number; t: number; max?: number }> = ({ count, t, max = 90 }) => (
  <group>
    {Array.from({ length: max }, (_, i) => {
      const k = clamp01(count - i);
      if (k <= 0) return null;
      const p: V3 = [(random(`smx${i}`) - 0.5) * 70, 6 + random(`smy${i}`) * 22 + Math.sin(t + i) * 0.3, (random(`smz${i}`) - 0.5) * 50];
      return (
        <group key={i} position={p} scale={k < 1 ? 1 + Math.sin(k * Math.PI) * 0.6 : 1}>
          <Molecule position={[0, 0, 0]} r={0.55} o2 spin={t * 0.5 + i} glow={0.8} />
        </group>
      );
    })}
  </group>
);

/** The backyard: lawn, the house behind, fence, hedge, a patch of dry grass, the grill, neighbours. */
const GRILL_AT: V3 = [2.1, 0, 1];
const YARD_HERO: V3 = [0, 0, 1];
const SPARK_LAND: V3 = [3.9, 0.05, 3.1];
const DRY = Array.from({ length: 70 }, (_, i) => [3 + random(`dg${i}`) * 6.5, 0, 1.6 + random(`dgz${i}`) * 5.5] as V3);
const HEDGE = Array.from({ length: 7 }, (_, i) => [9.6, 0, -4 + i * 1.6] as V3);
const FENCE_POSTS = Array.from({ length: 12 }, (_, i) => [-12 + i * 2.2, 0, -7] as V3);
const Backyard: React.FC<{ t: number; dry?: number }> = ({ t }) => (
  <group>
    <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[400, 400]} />
      <Flat color={P.grass} />
    </mesh>
    <House position={[-2, 0, -20]} scale={2.2} color="#E8DCC4" roof="#C8372D" lit={false} />
    <House position={[-30, 0, -22]} scale={2.1} color="#9AB0A0" roof="#5A4A78" lit={false} />
    <House position={[26, 0, -24]} scale={2.1} color="#C9B08A" roof="#2E5A6A" lit={false} />
    {/* wooden fence along the back and a hedge on the right */}
    {FENCE_POSTS.map((p, i) => (
      <mesh key={i} position={[p[0], 1.1, p[2]]} castShadow>
        <BoxG args={[0.3, 2.2, 0.3]} />
        <Flat color="#8A6A4A" />
      </mesh>
    ))}
    {[0.7, 1.7].map((y) => (
      <mesh key={y} position={[0, y, -7]}>
        <BoxG args={[24.4, 0.3, 0.12]} />
        <Flat color="#9A7A54" />
      </mesh>
    ))}
    {HEDGE.map((p, i) => (
      <Bush key={i} position={p} size={1.7} seed={`hg${i}`} color={P.leafDark} />
    ))}
    {/* the dry patch */}
    {DRY.map((p, i) => (
      <mesh key={i} position={[p[0], 0.25, p[2]]} rotation={[0, i, (random(`dl${i}`) - 0.5) * 0.4]}>
        <coneGeometry args={[0.12, 0.6 + random(`dh${i}`) * 0.4, 4]} />
        <Flat color={i % 2 ? "#C8A860" : "#B39A62"} />
      </mesh>
    ))}
    <Grill position={GRILL_AT} coals={0.3 + 0.2 * Math.sin(t * 3)} />
    {[-24, 18, 34].map((x, i) => (
      <LeafyTree key={i} position={[x, 0, -12]} scale={3} seed={`by${i}`} />
    ))}
    <HillRing radius={170} />
  </group>
);

/** A city park: grass, a path, benches, trees and a skyline behind. */
const Park: React.FC = () => (
  <group>
    <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[400, 400]} />
      <Flat color="#5A8A4E" />
    </mesh>
    <mesh position={[0, 0.01, -20]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[5, 120]} />
      <Flat color={P.stone} />
    </mesh>
    {[-14, -2, 10].map((z, i) => (
      <group key={i} position={[-5.2, 0, z]}>
        <mesh position={[0, 1.0, 0]} castShadow>
          <BoxG args={[1.2, 0.2, 3.2]} />
          <Flat color="#8A6A4A" />
        </mesh>
        <mesh position={[-0.5, 1.7, 0]} castShadow>
          <BoxG args={[0.15, 1.2, 3.2]} />
          <Flat color="#8A6A4A" />
        </mesh>
        {[-1.3, 1.3].map((dz) => (
          <mesh key={dz} position={[0, 0.5, dz]}>
            <BoxG args={[0.9, 1, 0.15]} />
            <Flat color="#2A2C34" />
          </mesh>
        ))}
      </group>
    ))}
    {Array.from({ length: 14 }, (_, i) => (
      <LeafyTree key={i} position={[(i % 2 ? 1 : -1) * (9 + random(`pk${i}`) * 14), 0, -60 + i * 7]} scale={2.8 + random(`pks${i}`)} seed={`pk${i}`} />
    ))}
    <Skyline radius={120} count={30} seed="park" />
    <HillRing radius={200} />
  </group>
);

/** A flat rooftop with a parapet, an AC unit and a water tank, the city all around. */
const Rooftop: React.FC<{ far?: boolean }> = ({ far = true }) => (
  <group>
    <mesh position={[0, -0.25, -4]} receiveShadow>
      <BoxG args={[22, 0.5, 22]} />
      <Flat color="#6A6E78" />
    </mesh>
    {[
      [0, -15, 22, 0.3],
      [11, -4, 0.3, 22],
      [-11, -4, 0.3, 22],
    ].map(([x, z, w, d], i) => (
      <mesh key={i} position={[x, 0.6, z]} castShadow receiveShadow>
        <BoxG args={[w, 1.2, d]} />
        <Flat color="#7A7E88" />
      </mesh>
    ))}
    <mesh position={[-6.5, 1.0, -9]} castShadow>
      <BoxG args={[3, 2, 2.2]} />
      <Flat color="#A8ACB4" />
    </mesh>
    <group position={[7, 0, -10]}>
      <mesh position={[0, 4.5, 0]} castShadow>
        <CylG args={[1.6, 1.6, 3.2, 10]} />
        <Flat color="#7A5A3E" />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 1.1, 1.45, sz * 1.1]}>
            <BoxG args={[0.18, 2.9, 0.18]} />
            <Flat color={P.pole} />
          </mesh>
        )),
      )}
    </group>
    <mesh position={[0, -30, -4]}>
      <BoxG args={[21.5, 59.5, 21.5]} />
      <Flat color={P.bldgSlate} />
    </mesh>
    <Skyline radius={70} count={34} seed="roof" arc={[0, Math.PI * 2]} power={0.6} />
    {far ? <Skyline radius={140} count={30} seed="roof2" arc={[Math.PI * 0.5, Math.PI * 1.5]} power={0.5} /> : <HillRing radius={230} color="#4A3E36" />}
  </group>
);

// ---------------------------------------------------------------- cold open: the hook

/** 0 s: a match strikes… and roars up into a huge flame. */
const coldMatch: ShotFn = (c) => {
  const fist: V3 = [0, 2.6, 0];
  const flame = c.lt < 0.12 ? 0 : c.lt < 0.3 ? 0.3 : 0.3 + 2.0 * k01(c.lt, 0.3, 0.55);
  const cam = move({ position: [0.4, 3.9, 5.6], target: [0, 3.9, 0] }, { position: [0.3, 4.0, 4.8], target: [0, 4.0, 0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.25} shadowSize={8} shake={flame > 1 && c.lt < 0.7 ? 0.04 : 0}>
      <Bedroom lampOn={false} />
      <ArmInsert fist={add(fist, [0, 0, 0])} dir={[0.4, -0.9, 0.6]} />
      <Match position={add(fist, [0, 0.14, 0])} t={c.t} flame={flame} />
      {c.lt > 0.08 && c.lt < 0.2 ? <Halo position={add(fist, [0, 1.1, 0])} size={1.2} color="#FFF2B0" opacity={0.9} /> : null}
    </Shot>
  );
};

/** Slavoski behind the towering match flame, lit orange. The title comes in here. */
const COLD_HERO: V3 = [-1.2, 0, 0.6];
const coldFace: ShotFn = (c) => {
  const { pose, base } = matchStance(COLD_HERO, 0, add(COLD_HERO, [-1.25, 2.3, 0.75]), { expression: "alarm", lean: -0.08, headPitch: 0.1, headYaw: -0.25 });
  const cam = move({ position: [0.4, 3.7, 10.5], target: [-1.6, 3.9, 0.6] }, { position: [0.2, 3.7, 9.4], target: [-1.6, 3.9, 0.6] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.22} shadowSize={10}>
      <Bedroom lampOn={false} />
      <Hero pose={pose} position={COLD_HERO} />
      <Match position={base} t={c.t} flame={2.0} />
    </Shot>
  );
};

/** "…doubled overnight?": the town at night, oxygen molecules in the air doubling. */
const coldTown: ShotFn = (c) => {
  const cam = move({ position: [6, 46, 78], target: [0, 8, -4] }, { position: [5, 42, 70], target: [0, 9, -4] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[70, 260]} shadowSize={50} light={0.7}>
      <Town night t={c.t} back={false} />
      <SkyMolecules count={40 + 45 * k01(c.lt, 0.15, 1.3)} t={c.t} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 42 percent

const GRID_AT: V3 = [0, 22, 4];
/** "Right now, oxygen makes up about 21%": the air as 100 molecules over the town at sunset. */
const c1Grid: ShotFn = (c) => {
  const cam = move({ position: [1.5, 5, 40], target: [0, 19, 4] }, { position: [1, 5.5, 37], target: [0, 19.3, 4] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[80, 300]} shadowSize={50}>
      <Town t={c.t} back={false} />
      <Clouds t={c.t} color="#F7C0A0" y={40} radius={160} count={14} seed="c1cl" />
      <AirGrid position={GRID_AT} o2={21} t={c.t} />
    </Shot>
  );
};

/** Slavoski sitting up in bed (ep. 4 placement). */
const BED_HERO: V3 = [BED.x, BED.mattressTop - (1.55 + 0.02 - 0.18), -2.55];
const bedPose = (over: Partial<Pose> = {}): Pose =>
  mergePose(REST, { lHip: [1.47, 0.06], rHip: [1.47, 0.06], lKnee: 0.04, rKnee: 0.04, lShoulder: [0.25, 0.25], rShoulder: [0.25, 0.25], lElbow: 0.5, rElbow: 0.5, ...over });

/** "…of the air we breathe": asleep at night, the air drifting in through the window. */
const c1Sleep: ShotFn = (c) => {
  const pose = bedPose({ lean: -0.32, headRoll: 0.3, blink: 1, expression: "relief" });
  const head = headPosition(pose, BED_HERO);
  const cam = move({ position: [BED.x + 2.6, 3.9, 4.0], target: [BED.x - 0.2, 2.5, -2.3] }, { position: [BED.x + 2.3, 3.7, 3.2], target: [BED.x - 0.2, 2.6, -2.3] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars light={0.4} shadowSize={10}>
      <Bedroom lampOn={false} />
      <Hero pose={pose} position={BED_HERO} />
      <Inflow to={add(head, [-0.1, -0.1, 0.9])} t={c.t} count={10} dir={[-0.6, 0.15, 0.8]} r={0.07} />
    </Shot>
  );
};

/** "But imagine waking up tomorrow": dawn, the alarm, he snaps awake. */
const c1Wake: ShotFn = (c) => {
  const k = k01(c.lt, 0.7, 1.0);
  const pose = bedPose({ lean: -0.32 * (1 - k), headRoll: 0.3 * (1 - k), blink: 1 - k, expression: k > 0.5 ? "alarm" : "relief" });
  const ring = c.lt > 0.2 ? Math.sin(c.lt * 40) * 0.02 : 0;
  const cam = move({ position: [BED.x + 0.6, 4.6, 7.4], target: [BED.x - 1.0, 2.5, -2.6] }, { position: [BED.x + 0.5, 4.5, 6.6], target: [BED.x - 1.0, 2.6, -2.6] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={false} light={0.75} shadowSize={10} keyDir={[-1, 0.35, 0.1]} shake={k > 0 && k < 1 ? 0.03 : 0}>
      <Bedroom lampOn={false} dawn />
      <Hero pose={pose} position={BED_HERO} />
      <AlarmClock position={[0.1 + ring, 1.1, -3.3]} yaw={0.4} />
    </Shot>
  );
};

/** "…suddenly jumped to 42%": 21 more molecules flip to oxygen, one by one. */
const c1Grid42: ShotFn = (c) => {
  const o2 = 21 + 21 * k01(c.lt, 0.45, 1.6);
  const cam = move({ position: [-2.5, 5, 40], target: [0, 19.3, 4] }, { position: [-2, 5.5, 37], target: [0, 19.5, 4] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[80, 300]} shadowSize={50}>
      <Town t={c.t} back={false} />
      <Clouds t={c.t} color="#F4F6FA" y={40} radius={160} count={14} seed="c1cl2" />
      <AirGrid position={GRID_AT} o2={o2} t={c.t} />
    </Shot>
  );
};

/** "At first, you might not even notice": a big morning stretch and a deep breath at the window. */
const WIN_HERO: V3 = [-3.5, 0, -0.6];
const c1Stretch: ShotFn = (c) => {
  const up = k01(c.lt, 0.1, 0.8);
  const pose = mergePose(REST, {
    lShoulder: [0.2, 0.12 + 2.25 * up],
    rShoulder: [0.2, 0.12 + 2.25 * up],
    lElbow: 0.15 + 0.3 * up,
    rElbow: 0.15 + 0.3 * up,
    headPitch: 0.25 * up,
    blink: c.lt > 0.9 && c.lt < 1.9 ? 1 : 0,
    expression: c.lt > 0.9 ? "relief" : "smile",
  });
  const head = headPosition(pose, WIN_HERO, -Math.PI / 2);
  const cam = move({ position: [4.4, 3.9, 5.4], target: [-4.0, 3.3, -0.9] }, { position: [4.0, 3.8, 4.9], target: [-4.0, 3.3, -0.9] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} light={0.9} shadowSize={10} keyDir={[-1, 0.5, 0.2]}>
      <Bedroom lampOn={false} dawn />
      <Hero pose={pose} position={WIN_HERO} yaw={-Math.PI / 2} />
      {c.lt > 0.8 ? <Inflow to={add(head, [-0.7, -0.1, 0])} t={c.t} count={12} dir={[-1, 0.1, 0]} r={0.09} /> : null}
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 a tiny spark (sunny backyard → wildfire)

/** "…but then something terrifying starts happening": he strikes a match over the grill. */
const c2Grill: ShotFn = (c) => {
  const yaw = Math.PI / 2;
  const lower = k01(c.lt, 1.4, 2.2);
  const target: V3 = [1.25 + 0.2 * lower, 2.65 - 0.25 * lower, 1.35];
  const { pose, base } = matchStance(YARD_HERO, yaw, target, { expression: "smile", headPitch: -0.3 });
  const lit = c.lt > 0.6;
  const cam = move({ position: [-3.0, 3.9, 10.5], target: [1.3, 2.6, 0.6] }, { position: [-2.6, 3.7, 9.0], target: [1.3, 2.6, 0.6] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={14}>
      <Backyard t={c.t} />
      <Clouds t={c.t} color="#F4F6FA" y={45} radius={160} count={14} seed="yard" />
      <Hero pose={pose} position={YARD_HERO} yaw={yaw} />
      <Match position={base} t={c.t} flame={lit ? 0.35 : 0} />
      {c.lt > 2.6 ? <Flame position={[GRILL_AT[0], GRILL_TOP, GRILL_AT[2]]} size={0.6 * k01(c.lt, 2.6, 3.1)} t={c.t} seed="g0" light={6} /> : null}
    </Shot>
  );
};

/** "FIRES become much more dangerous.": the grill erupts into a tower of flame; he leaps back. */
const c2Flare: ShotFn = (c) => {
  const yaw = Math.PI / 2;
  const back = k01(c.lt, 0.1, 0.5);
  const hero: V3 = [YARD_HERO[0] - 1.6 * back, 0, YARD_HERO[2]];
  const pose = mergePose(REST, { expression: "alarm", lean: -0.18 * back, lShoulder: [1.2 * back, 0.3], rShoulder: [1.3 * back, 0.3], lElbow: 1.2 * back, rElbow: 1.2 * back, headPitch: 0.25 });
  const size = 0.6 + 6 * k01(c.lt, 0.0, 0.35);
  const cam = move({ position: [-6, 4.4, 14], target: [1.2, 4.2, 0.6] }, { position: [-5.4, 4.3, 12.6], target: [1.2, 4.4, 0.6] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={14} shake={c.lt < 0.6 ? 0.06 : 0.015}>
      <Backyard t={c.t} />
      <Hero pose={pose} position={hero} yaw={yaw} />
      <Flame position={[GRILL_AT[0], GRILL_TOP, GRILL_AT[2]]} size={size} t={c.t} seed="g1" light={22} />
    </Shot>
  );
};

/** "A tiny spark…": one ember drifts off the grill and lands in the dry grass. */
const sparkPath = (k: number): V3 => {
  const a: V3 = [GRILL_AT[0] + 0.4, GRILL_TOP + 1.2, GRILL_AT[2] + 0.3];
  const b = SPARK_LAND;
  return [a[0] + (b[0] - a[0]) * k + Math.sin(k * 9) * 0.25, a[1] + (b[1] - a[1]) * k + Math.sin(k * Math.PI) * 0.9, a[2] + (b[2] - a[2]) * k];
};
const c2Spark: ShotFn = (c) => {
  const k = clamp01(c.lt / 1.7);
  const p = sparkPath(k);
  const glowing = c.lt < 2.0 ? 1 : 0.6 + 0.4 * Math.sin(c.lt * 20);
  const cam: CameraSpec = { position: add(p, [-1.0, 0.8, 2.8]), target: add(p, [0.2, -0.1, 0]) };
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={10}>
      <Backyard t={c.t} />
      <Flame position={[GRILL_AT[0], GRILL_TOP, GRILL_AT[2]]} size={3} t={c.t} seed="g1" light={10} />
      <mesh position={p}>
        <IcoG args={[0.06, 0]} />
        <Glow color={P.fireCore} />
      </mesh>
      <Halo position={p} size={0.7} color={P.fire} opacity={0.8 * glowing} />
      <pointLight position={p} color="#FF9A40" intensity={1.5} distance={2} decay={2} />
    </Shot>
  );
};

/** "…could suddenly ignite nearby materials.": the dry grass catches; fire races to the hedge and fence. */
const c2Ignite: ShotFn = (c) => {
  const r = (c.lt + 0.15) * 3.6;
  const dist = (p: V3) => Math.hypot(p[0] - SPARK_LAND[0], p[2] - SPARK_LAND[2]);
  const pose = mergePose(REST, { expression: "alarm", lShoulder: [0.2, 1.0], rShoulder: [0.2, 1.0], lElbow: 0.6, rElbow: 0.6, headYaw: 0.4 });
  const cam = move({ position: [-4, 5.2, 16], target: [4.5, 2.4, 0] }, { position: [-3.5, 5.0, 14.5], target: [4.5, 2.6, 0] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={16} dust={0.25 * k01(c.lt, 0.5, 2.6)}>
      <Backyard t={c.t} />
      <Hero pose={pose} position={[-1.8, 0, 2.2]} yaw={Math.PI / 2} />
      <Flame position={[GRILL_AT[0], GRILL_TOP, GRILL_AT[2]]} size={2.6} t={c.t} seed="g1" light={8} />
      <FireField points={DRY} burn={(p) => (r - dist(p)) / 0.8} t={c.t} size={1.4} seed="dry" lights={2} />
      <FireField points={HEDGE.map((p) => add(p, [0, 1.2, 0]))} burn={(p) => (r - dist(p)) / 1.2} t={c.t} size={3.4} seed="hedge" />
      <FireField points={FENCE_POSTS.filter((p) => p[0] > 0).map((p) => add(p, [0, 1.6, 0.2]))} burn={(p) => (r - dist(p)) / 1.2} t={c.t} size={2.6} seed="fence" />
    </Shot>
  );
};

/** "Wildfires could spread faster": from the air, a fire front racing across pine hills. */
const c2Wildfire: ShotFn = (c) => {
  const cam = move({ position: [-40, 52, 56], target: [10, 0, -50] }, { position: [-34, 48, 50], target: [12, 0, -50] }, c);
  return (
    <Shot mood="sunset" dust={0.75} camera={cam} fog={[60, 320]} shadowSize={80} light={0.8}>
      <WildfireHills t={c.t} front={10 + c.lt * 30} />
    </Shot>
  );
};

/** "…and putting them out would become much harder.": a water bomber's drop barely dents it. */
const c2Bomber: ShotFn = (c) => {
  const planeX = -40 + c.lt * 34;
  const plane: V3 = [planeX, 22, -12];
  const cam = move({ position: [-18, 8, 40], target: [4, 14, -20] }, { position: [-15, 8.5, 36], target: [5, 14, -20] }, c);
  return (
    <Shot mood="sunset" dust={0.85} camera={cam} fog={[60, 320]} shadowSize={80} light={0.8}>
      <WildfireHills t={c.t} front={60 + c.lt * 6} />
      <group position={plane} rotation={[0, Math.PI / 2, 0.05]} scale={3}>
        <PlaneModel />
      </group>
      <WaterDrop origin={add(plane, [-3, -2, 0])} k={(c.lt - 0.6) / 1.5} />
    </Shot>
  );
};

/** A firefighting plane: red and white, high wing (faces +Z). */
const PlaneModel: React.FC = () => (
  <group>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <CylG args={[0.6, 0.5, 7, 10]} />
      <Flat color="#E8E4DA" />
    </mesh>
    <mesh position={[0, -0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <CylG args={[0.55, 0.45, 6.5, 10]} />
      <Flat color="#C8372D" />
    </mesh>
    <mesh position={[0, 0.65, 0.5]} castShadow>
      <BoxG args={[11, 0.18, 1.4]} />
      <Flat color="#E8E4DA" />
    </mesh>
    {[-2.6, 2.6].map((x) => (
      <mesh key={x} position={[x, 0.45, 1.3]} rotation={[Math.PI / 2, 0, 0]}>
        <CylG args={[0.3, 0.35, 1.4, 8]} />
        <Flat color="#C8372D" />
      </mesh>
    ))}
    <mesh position={[0, 1.0, -3.2]}>
      <BoxG args={[0.14, 1.8, 1.1]} />
      <Flat color="#C8372D" />
    </mesh>
    <mesh position={[0, 0.2, -3.2]}>
      <BoxG args={[3.4, 0.12, 0.9]} />
      <Flat color="#E8E4DA" />
    </mesh>
  </group>
);

// ---------------------------------------------------------------- 03 your body (overcast park → inside)

/** "But what about your body?": X-ray Slavoski, lungs breathing inside his chest. */
const c3Xray: ShotFn = (c) => {
  const pose = mergePose(REST, { expression: "awe", headPitch: -0.35 });
  const breath = (Math.sin(c.t * 2.6) + 1) / 2;
  const cam = move({ position: [1.4, 3.2, 9.6], target: [0, 2.7, 0] }, { position: [1.1, 3.1, 8.2], target: [0, 2.7, 0] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[60, 260]} shadowSize={14}>
      <Park />
      <Hero pose={pose} position={[0, 0, 0]} ghost={0.32} />
      <Lungs position={[0, 2.45, 0.02]} scale={0.3} breath={breath} />
      <Halo position={[0, 2.5, 0.3]} size={2.4} color="#FF8A9A" opacity={0.25} />
    </Shot>
  );
};

/** "You might think twice the oxygen…": he sprints along the path, full of beans. */
const c3Run: ShotFn = (c) => {
  const z = -10 + c.lt * 5.2;
  const hero: V3 = [0.5, 0, z];
  const pose = mergePose(walkPose(c.lt * 2.9, 1.6), { expression: "smile", lean: 0.22 });
  const cam: CameraSpec = { position: [2.2, 3.6, z + 11], target: [0.4, 2.8, z] };
  return (
    <Shot mood="overcast" camera={cam} fog={[60, 260]} shadowSize={14}>
      <Park />
      <Hero pose={pose} position={hero} />
    </Shot>
  );
};

/** "…means twice the energy.": a big double-bicep flex, crackling with energy. */
const c3Flex: ShotFn = (c) => {
  const up = k01(c.lt, 0.0, 0.3);
  const pose = mergePose(REST, { expression: "smile", lShoulder: [0.1, 0.12 + 1.75 * up], rShoulder: [0.1, 0.12 + 1.75 * up], lElbow: 0.15 + 1.95 * up, rElbow: 0.15 + 1.95 * up, headPitch: 0.1 });
  const cam = move({ position: [0.8, 3.4, 9.2], target: [0, 3.0, 0] }, { position: [0.6, 3.3, 8.2], target: [0, 3.0, 0] }, c);
  return (
    <Shot
      mood="overcast"
      camera={cam}
      fog={[60, 260]}
      shadowSize={12}
      overlay={<CardLine text="2× ENERGY?" y={420} appearFrame={startFrame(c) + 6} />}
    >
      <Park />
      <Hero pose={pose} position={[0, 0, 0]} />
      {Array.from({ length: 6 }, (_, i) => {
        const on = noise1(`zap${i}`, c.t * 9) > 0.1;
        if (!on) return null;
        const a = (i / 6) * Math.PI * 2 + c.t;
        const p0: V3 = [Math.cos(a) * 1.7, 2.8 + Math.sin(a * 1.3) * 1.1, 0.4];
        const p1: V3 = add(p0, [Math.cos(a) * 0.45, 0.35, 0.1]);
        const p2: V3 = add(p1, [Math.cos(a + 1) * 0.35, -0.2, 0]);
        return (
          <group key={i}>
            <mesh position={[(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, p0[2]]} rotation={[0, 0, Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) - Math.PI / 2]}>
              <BoxG args={[0.07, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), 0.07]} />
              <Glow color={P.amber} />
            </mesh>
            <mesh position={[(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, p1[2]]} rotation={[0, 0, Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) - Math.PI / 2]}>
              <BoxG args={[0.07, Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), 0.07]} />
              <Glow color={P.fireCore} />
            </mesh>
          </group>
        );
      })}
    </Shot>
  );
};

/** "Unfortunately, that's not how breathing works.": bent over, hands on knees, puffing. */
const c3Pant = (c: ShotCtx) => {
  let pose = mergePose(REST, { expression: "worried", lean: 0.55, lHip: [0.35, 0.05], rHip: [0.35, 0.05], lKnee: 0.45, rKnee: 0.45, headPitch: 0.35, blink: c.lt % 1.2 < 0.12 ? 1 : 0 });
  pose = { ...pose, bob: groundedBob(pose) - 0.0 };
  const lk = legJoints(pose, "l").knee;
  const rk = legJoints(pose, "r").knee;
  pose = reach(pose, "l", add(lk, [0, 0.25, 0.32])).pose;
  pose = reach(pose, "r", add(rk, [0, 0.25, 0.32])).pose;
  const head = headPosition(pose);
  const puff = (c.t * 1.6) % 1;
  const cam = move({ position: [4.5, 3.0, 7.5], target: [0, 2.2, 0] }, { position: [4.0, 2.9, 6.6], target: [0, 2.2, 0] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[60, 260]} shadowSize={12}>
      <Park />
      <Hero pose={pose} position={[0, 0, 0]} />
      <mesh position={add(head, [0, -0.2, 0.8 + puff * 0.8])} scale={0.4 + puff}>
        <IcoG args={[0.2, 1]} />
        <Flat color="#E8EEF5" opacity={0.6 * (1 - puff)} />
      </mesh>
      {[0, 1].map((i) => {
        const ph = (c.t * 1.3 + i * 0.5) % 1;
        return (
          <mesh key={i} position={add(head, [i ? 0.55 : -0.5, 0.3 - ph * 0.9, 0.3])}>
            <IcoG args={[0.07, 0]} />
            <Glow color="#9FD8FF" opacity={1 - ph} />
          </mesh>
        );
      })}
    </Shot>
  );
};

/** "Your blood is already nearly saturated…": red blood cells streaming through a vessel, all loaded. */
const c3Blood: ShotFn = (c) => {
  const cam = move({ position: [3.0, 1.4, 10.5], target: [0, 0.6, 0] }, { position: [2.4, 1.3, 9.4], target: [0, 0.6, 0] }, c);
  return (
    <Shot mood="dust" camera={cam} fog={false} stars={false} shadows={false} light={1.1} overlay={<CardLine text="≈ 98% FULL" sub="OXYGEN IN YOUR BLOOD" y={420} appearFrame={startFrame(c) + 6} accent={O2_RED} />}>
      <BloodVessel t={c.t} />
    </Shot>
  );
};

/** "…with oxygen under normal conditions": one cell, four seats taken; an extra oxygen bounces off. */
const c3Cell: ShotFn = (c) => {
  const k = clamp01(c.lt / 0.9);
  const bounce = c.lt > 0.9 ? c.lt - 0.9 : 0;
  const extra: V3 = bounce > 0 ? [2.3 + bounce * 1.6, 1.0 + bounce * 1.4, 0.4] : [3.4 - k * 1.1, 1.4 - k * 0.4, 0.4];
  const cam = move({ position: [0.4, 2.6, 12], target: [0.6, 0.9, 0] }, { position: [0.3, 2.5, 11], target: [0.6, 0.9, 0] }, c);
  return (
    <Shot mood="dust" camera={cam} fog={false} stars={false} shadows={false} light={1.1} overlay={<CardLine text="ALREADY FULL" sub="A RED BLOOD CELL" y={420} appearFrame={startFrame(c) + 6} accent="#FF8A6A" />}>
      <RedCell position={[0, 0, 0]} scale={2.6} spin={0.2 + c.t * 0.15} filled={4} />
      <Molecule position={extra} r={0.3} o2 spin={c.t * 3} glow={0.8} color="#FF8A6A" />
      {bounce > 0 && bounce < 0.3 ? <Halo position={[2.4, 1.0, 0.4]} size={1.6} color="#FFFFFF" opacity={0.6} /> : null}
    </Shot>
  );
};

/** "…and breathing unusually high oxygen levels for long periods…": the lungs, oxygen pouring in. */
const c3Lungs: ShotFn = (c) => {
  const breath = (Math.sin(c.t * 2.4) + 1) / 2;
  const cam = move({ position: [0, 1.6, 12], target: [0, 0.9, 0] }, { position: [0, 1.5, 10.6], target: [0, 0.9, 0] }, c);
  return (
    <Shot mood="dust" camera={cam} fog={false} stars={false} shadows={false} light={1.1}>
      <Lungs position={[0, 0, 0]} breath={breath} t={c.t} />
      {Array.from({ length: 22 }, (_, i) => {
        const ph = (c.t * 0.7 + random(`lo${i}`)) % 1;
        const side = i % 2 ? 1 : -1;
        const p: V3 = ph < 0.5 ? [0, 6 - ph * 9, 0.2] : [side * (ph - 0.5) * 2.4, 1.5 - (ph - 0.5) * 3.5, 0.6];
        return <Molecule key={i} position={p} r={0.13} o2 spin={c.t + i} glow={0.7} />;
      })}
    </Shot>
  );
};

/** "…can damage your lungs.": the lungs inflame, red and blotched. */
const c3Damage: ShotFn = (c) => {
  const dmg = k01(c.lt, 0.1, 1.0);
  const breath = (Math.sin(c.t * 3.2) + 1) / 2;
  const cam = move({ position: [0.8, 1.4, 13.5], target: [0, 1.0, 0] }, { position: [0.6, 1.3, 12.4], target: [0, 1.0, 0] }, c);
  return (
    <Shot mood="dust" camera={cam} fog={false} stars={false} shadows={false} light={1.0} shake={0.01 * dmg} overlay={<CardLine text="LUNG DAMAGE" sub="TOO MUCH OXYGEN, TOO LONG" y={420} appearFrame={startFrame(c) + 4} accent="#FF4A4A" />}>
      <Lungs position={[0, 0, 0]} breath={breath * 0.6} damage={dmg} t={c.t} />
      <Halo position={[0, 0.2, -1]} size={9} color="#FF2A2A" opacity={0.25 * dmg * (0.7 + 0.3 * Math.sin(c.t * 8))} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 giant insects (the swamp, 300 million years ago)

/** "But here's where things get REALLY interesting": his face lights up; the camera whips round. */
const c4Interest: ShotFn = (c) => {
  const a = -0.5 + k01(c.lt, 0, 2.6) * 0.9;
  const pose = mergePose(REST, { expression: "awe", headPitch: 0.12, lShoulder: [0.3, 0.6], rShoulder: [0.3, 0.6], lElbow: 1.2, rElbow: 1.2 });
  const cam: CameraSpec = { position: [Math.sin(a) * 6.5, 3.8, Math.cos(a) * 6.5], target: [0, 3.4, 0] };
  return (
    <Shot mood="overcast" camera={cam} fog={[60, 260]} shadowSize={12}>
      <Park />
      <Hero pose={pose} position={[0, 0, 0]} />
      {Array.from({ length: 7 }, (_, i) => {
        const ph = (c.t * 0.8 + i / 7) % 1;
        const ang = (i / 7) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(ang) * (1.3 + ph * 1.2), 3.6 + Math.sin(ang) * (1.0 + ph), 0.5]} rotation={[0, 0, ph * 4]}>
            <BoxG args={[0.16, 0.16, 0.16]} />
            <Glow color={P.amber} opacity={1 - ph} />
          </mesh>
        );
      })}
    </Shot>
  );
};

const LOG_HERO: V3 = [2.6, SWAMP_LOG.c[1] + SWAMP_LOG.r, SWAMP_LOG.c[2]];
/** A few dragonflies far off over the swamp. */
const FarFlies: React.FC<{ t: number }> = ({ t }) => (
  <group>
    {[0, 1, 2].map((i) => {
      const a = t * (0.25 + i * 0.07) + i * 2;
      return <Dragonfly key={i} position={[Math.cos(a) * (20 + i * 6), 9 + i * 2 + Math.sin(t + i) * 0.5, Math.sin(a) * 14 - 20]} yaw={-a} scale={1.2} flap={t + i * 0.1} />;
    })}
  </group>
);

/** "Millions of years ago…": the misty swamp of scale trees, horsetails and tree ferns. */
const c4Swamp: ShotFn = (c) => {
  const cam = move({ position: [-10, 6.5, 30], target: [2, 9, -10] }, { position: [-8, 6.2, 26], target: [2, 9.5, -10] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[30, 190]} shadowSize={60} light={0.9}>
      <Swamp t={c.t} />
      <FarFlies t={c.t} />
      <Hero pose={mergePose(REST, { headPitch: 0.2, headYaw: 0.3 })} position={LOG_HERO} />
    </Shot>
  );
};

/** "…contained more oxygen than it does today": Slavoski on a fallen log, taking it all in. */
const c4Log: ShotFn = (c) => {
  const pose = mergePose(REST, { expression: "awe", headPitch: 0.3, headYaw: -0.4 + 0.6 * k01(c.lt, 0, 2), lShoulder: [0.1, 0.5], rShoulder: [0.1, 0.5] });
  const cam = move({ position: [7.5, 4.6, 13], target: [2.6, 4.4, 2] }, { position: [6.6, 4.4, 11.6], target: [2.6, 4.5, 2] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[30, 190]} shadowSize={20} light={0.9}>
      <Swamp t={c.t} />
      <FarFlies t={c.t} />
      <Hero pose={pose} position={LOG_HERO} />
    </Shot>
  );
};

/** "…and some insects grew to enormous sizes.": a giant dragonfly zooms right past him. */
const c4Dragonfly: ShotFn = (c) => {
  const k = clamp01(c.lt / 3.0);
  const p: V3 = [-9 + k * 18, 6.4 - k * 0.3 + Math.sin(c.lt * 3) * 0.15, 6.2 + k * 0.8];
  const look = Math.atan2(p[0] - LOG_HERO[0], p[2] - LOG_HERO[2]);
  const pose = mergePose(REST, { expression: "alarm", headYaw: Math.max(-1.1, Math.min(1.1, look)), headPitch: 0.25, lean: -0.1, lShoulder: [0.4, 0.6], rShoulder: [0.4, 0.6] });
  const cam = move({ position: [-0.5, 4.4, 15.5], target: [1.5, 4.8, 2] }, { position: [-0.3, 4.4, 14.5], target: [1.5, 4.9, 2] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[30, 190]} shadowSize={20} light={0.9}>
      <Swamp t={c.t} />
      <Hero pose={pose} position={LOG_HERO} />
      <Dragonfly position={p} yaw={Math.PI / 2 - 0.05} roll={Math.sin(c.lt * 2) * 0.15} scale={1.1} flap={c.t} />
    </Shot>
  );
};

/** "Scientists believe…": a giant millipede crawls along the log toward him; he hops in fright. */
const c4Millipede: ShotFn = (c) => {
  const s = Math.min(c.lt * 1.7, 6.3);
  const jump = c.lt > 1.9 ? Math.max(0, Math.sin(clamp01((c.lt - 1.9) / 0.5) * Math.PI)) * 0.9 : 0;
  const hero: V3 = [3.4, LOG_HERO[1], LOG_HERO[2]];
  const pose = mergePose(REST, { expression: "alarm", headPitch: -0.4, lShoulder: [0.4, 1.5], rShoulder: [0.4, 1.5], lElbow: 0.5, rElbow: 0.5, bob: jump, lean: -0.1 });
  const cam = move({ position: [1.8, 3.7, 17], target: [1.8, 2.7, 2] }, { position: [1.8, 3.6, 16], target: [1.8, 2.7, 2] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[30, 190]} shadowSize={14} light={0.9}>
      <Swamp t={c.t} />
      <Millipede position={[-4.5, LOG_HERO[1], SWAMP_LOG.c[2] - 0.05]} s={s} wiggle={0.08} />
      <Hero pose={pose} position={hero} yaw={-Math.PI / 2} />
    </Shot>
  );
};

/** "…because insects breathe through networks of tiny tubes.": an X-ray of the dragonfly. */
const c4Tubes: ShotFn = (c) => {
  const cam = move({ position: [3.6, 4.6, 9.6], target: [0, 0.4, -1.6] }, { position: [3.0, 4.2, 8.6], target: [0, 0.4, -1.6] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} stars={false} shadows={false} light={1.2} overlay={<CardLine text="TINY AIR TUBES" sub="HOW INSECTS BREATHE" y={420} appearFrame={startFrame(c) + 6} accent="#7FF0FF" />}>
      <Dragonfly position={[0, 0, 0]} yaw={0.5 + c.lt * 0.1} scale={2.2} flap={c.t * 0.06} xray={1} t={c.t} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 giant spiders? (dusk → forest floor → the future)

/** "So would we suddenly have giant spiders?": a spider taller than the house looms over the yard. */
const STREET_HERO: V3 = [5, 0, 33];
const c5Spider: ShotFn = (c) => {
  const rise = k01(c.lt, 0, 0.9);
  const pose = mergePose(REST, { expression: "alarm", headPitch: 0.45, lean: -0.12, lShoulder: [0.3, 0.9], rShoulder: [0.3, 0.9], lElbow: 0.8, rElbow: 0.8 });
  const cam = move({ position: [10, 3.0, 54], target: [1.5, 11, 10] }, { position: [9, 3.0, 50], target: [1.5, 11.5, 10] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[60, 260]} shadowSize={40} light={0.8}>
      <HouseFront t={c.t} night lit />
      <Spider position={[0, 0, 16]} scale={11} walk={c.t * 0.4} eyes={rise} />
      <Hero pose={pose} position={STREET_HERO} yaw={Math.PI - 0.3} />
    </Shot>
  );
};

/** "Not overnight.": back to reality: a tiny, ordinary spider on the mailbox. Relief. */
const MAILBOX_TOP: V3 = [6.5, 2.7, 21.5];
const c5Tiny: ShotFn = (c) => {
  const hero: V3 = [6.5, 0, 24.25];
  const pose = mergePose(REST, { expression: "relief", lean: 0.3, headPitch: -0.45, lShoulder: [0.2, 0.2], rShoulder: [0.2, 0.2] });
  const cam = move({ position: [7.4, 3.45, 15.2], target: [6.5, 3.15, 22.8] }, { position: [7.3, 3.4, 16.0], target: [6.5, 3.15, 22.8] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[60, 260]} shadowSize={8} light={0.8}>
      <HouseFront t={c.t} night lit />
      <Spider position={MAILBOX_TOP} yaw={0.5} scale={0.2} walk={c.t * 1.5} />
      <Hero pose={pose} position={hero} yaw={Math.PI} />
    </Shot>
  );
};

/** The forest floor: leaf litter, a long fallen branch, ferns and trees. */
const BRANCH_Y = 0.9;
const ForestFloor: React.FC = () => (
  <group>
    <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[300, 300]} />
      <Flat color="#5A5A34" />
    </mesh>
    {Array.from({ length: 60 }, (_, i) => (
      <mesh key={i} position={[(random(`lf${i}`) - 0.5) * 40, 0.01, (random(`lfz${i}`) - 0.5) * 30]} rotation={[-Math.PI / 2, 0, random(`lfr${i}`) * 6]}>
        <planeGeometry args={[0.6, 0.35]} />
        <Flat color={["#8A6A3A", "#A8803E", "#6A7A3A"][i % 3]} />
      </mesh>
    ))}
    <mesh position={[0, BRANCH_Y / 2 + 0.05, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
      <CylG args={[BRANCH_Y / 2, BRANCH_Y / 2 + 0.05, 40, 8]} />
      <Flat color="#6A4E34" />
    </mesh>
    {Array.from({ length: 12 }, (_, i) => (
      <Bush key={i} position={[-20 + i * 3.7, 0, -3.5 - random(`fb${i}`) * 3]} size={1.4 + random(`fbs${i}`)} seed={`fb${i}`} />
    ))}
    {Array.from({ length: 10 }, (_, i) => (
      <LeafyTree key={i} position={[-30 + i * 7, 0, -14 - random(`ft${i}`) * 10]} scale={3.2} seed={`ft${i}`} />
    ))}
  </group>
);

/** "Evolution takes generations": beetle after beetle along a branch, each a little bigger. */
const c5Generations: ShotFn = (c) => {
  const camX = -6 + c.lt * 3.2;
  const gen = Math.round(10 ** (k01(c.lt, 0.2, 1.8) * 6));
  const cam: CameraSpec = { position: [camX, 2.2, 8.2], target: [camX + 1.4, 1.3, 0] };
  return (
    <Shot
      mood="day"
      camera={cam}
      fog={[30, 140]}
      shadowSize={14}
      overlay={<CardLine text={`GENERATION ${gen.toLocaleString("en-US")}`} y={420} appearFrame={startFrame(c) + 3} accent="#7FD6A0" />}
    >
      <ForestFloor />
      {Array.from({ length: 7 }, (_, i) => {
        const s = 0.32 * 1.22 ** i;
        return <Beetle key={i} position={[-8 + i * 1.7 + c.lt * 0.5, BRANCH_Y, 0]} yaw={Math.PI / 2} scale={s} walk={c.t * 2 + i} color={["#2E6A4A", "#3A6A3A", "#4A6A2E", "#5A6A2A", "#6A5A2A", "#7A4A2A", "#8A3A2A"][i]} />;
      })}
    </Shot>
  );
};

/** "…and oxygen isn't the only factor…": a crow drops in and snaps up the biggest beetle. */
const c5Bird: ShotFn = (c) => {
  const land = k01(c.lt, 0, 1.3);
  const bird: V3 = [-9 + land * 7.8, 9 * (1 - land) * (1 - land), -2 + land * 2.4];
  const peck = c.lt > 1.9 && c.lt < 2.5 ? Math.sin(((c.lt - 1.9) / 0.6) * Math.PI) : 0;
  const caught = c.lt > 2.2;
  const cam = move({ position: [2.4, 2.6, 13], target: [0.2, 1.5, 1] }, { position: [2.1, 2.5, 12], target: [0.2, 1.5, 1] }, c);
  return (
    <Shot
      mood="day"
      camera={cam}
      fog={[30, 140]}
      shadowSize={14}
      overlay={<CardLine text="PREDATORS · CLIMATE · FOOD" sub="ALSO LIMIT INSECT SIZE" y={420} appearFrame={startFrame(c) + 40} accent="#7FD6A0" />}
    >
      <ForestFloor />
      {!caught ? <Beetle position={[1.2, 0, 2.2]} yaw={-Math.PI / 2 + 0.3} scale={1.3} walk={c.t * 1.5} color="#8A3A2A" /> : null}
      <Bird kind="crow" position={bird} yaw={Math.PI / 2 - 0.2} scale={2.3} flap={1 - land * 0.9} flapT={c.t} peck={peck} headPitch={caught ? 0.3 : 0} pebble={caught} />
    </Shot>
  );
};

/** "But over millions of years…": time-lapse, giant ferns and scale trees swallow the town. */
const c5Timelapse: ShotFn = (c) => {
  const g = k01(c.lt, 0.0, 1.5) * 0.9;
  const years = Math.round(k01(c.lt, 0.1, 1.9) * 1000000);
  const cam = move({ position: [30, 62, 92], target: [0, 4, -6] }, { position: [28, 58, 86], target: [0, 4.5, -6] }, c);
  return (
    <Shot
      mood="sunset"
      camera={cam}
      fog={[60, 280]}
      shadowSize={50}
      overlay={<CardLine text={`+${years.toLocaleString("en-US")} YEARS`} y={420} appearFrame={startFrame(c)} accent="#7FD6A0" />}
    >
      <Town jungle={g} t={c.t} />
      <Clouds t={c.t * 6} color="#F7C0A0" y={45} radius={170} count={14} seed="tl" />
    </Shot>
  );
};

/** "…ecosystems could change dramatically.": the jungle town at sunset, giant dragonflies overhead. */
const c5Jungle: ShotFn = (c) => {
  const cam = move({ position: [-24, 46, 86], target: [0, 8, -8] }, { position: [-21, 43, 80], target: [0, 8.5, -8] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[60, 280]} shadowSize={60}>
      <Town jungle={1} t={c.t} />
      {[0, 1, 2, 3].map((i) => {
        const a = c.t * (0.3 + i * 0.05) + i * 1.6;
        return <Dragonfly key={i} position={[Math.cos(a) * (18 + i * 5), 16 + i * 3, Math.sin(a) * 12 + 4]} yaw={-a} scale={2.4} flap={c.t + i * 0.13} />;
      })}
    </Shot>
  );
};

// ---------------------------------------------------------------- 06 too much (the rooftop at sunset)

/** "And here's the craziest part": on the rooftop, he turns from the sunset to us. */
const c6Turn: ShotFn = (c) => {
  const k = k01(c.lt, 0.2, 1.3);
  const pose = mergePose(REST, { expression: "neutral", headYaw: 0.2 * (1 - k) });
  const cam = move({ position: [1.4, 3.8, 9.5], target: [0, 3.3, 0] }, { position: [1.1, 3.7, 8.4], target: [0, 3.3, 0] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[60, 300]} shadowSize={14}>
      <Rooftop />
      <Hero pose={pose} position={[0, 0, 0]} yaw={Math.PI * (1 - k)} />
    </Shot>
  );
};

/** "Oxygen is the very thing keeping you alive": eyes closed, one calm deep breath. */
const c6Breathe: ShotFn = (c) => {
  const pose = mergePose(REST, { expression: "relief", blink: 1, headPitch: 0.15, lShoulder: [0.05, 0.3], rShoulder: [0.05, 0.3] });
  const head = headPosition(pose);
  const cam = move({ position: [0.6, 3.7, 6.4], target: [0, 3.3, 0] }, { position: [0.5, 3.65, 5.6], target: [0, 3.35, 0] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[60, 300]} shadowSize={10}>
      <Rooftop />
      <Hero pose={pose} position={[0, 0, 0]} />
      <Inflow to={add(head, [0.25, -0.12, 0.62])} t={c.t} count={9} dir={[1, 0.15, 0.2]} r={0.05} spread={0.5} reach={1.7} />
      <Inflow to={add(head, [-0.25, -0.12, 0.62])} t={c.t + 0.5} count={9} dir={[-1, 0.15, 0.2]} r={0.05} spread={0.5} reach={1.7} />
    </Shot>
  );
};

/** "…yet doubling it could make the world around you far more dangerous.": dusk over town, fires on the ridge, giant wings overhead. */
const RIDGE = Array.from({ length: 22 }, (_, i) => [-70 + i * 6.5 + random(`rg${i}`) * 3, 2, -62 - random(`rgz${i}`) * 10] as V3);
const c6World: ShotFn = (c) => {
  const cam = move({ position: [-14, 40, 62], target: [0, 6, -30] }, { position: [-12, 38, 57], target: [0, 6.5, -30] }, c);
  return (
    <Shot mood="sunset" dust={0.45} camera={cam} fog={[70, 320]} shadowSize={60}>
      <Town jungle={0.45} t={c.t} back={false} />
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-80 + i * 20, -4, -70]} scale={[14, 10 + random(`rh${i}`) * 4, 10]}>
          <IcoG args={[1, 1]} />
          <Flat color="#5A5A34" />
        </mesh>
      ))}
      <FireField points={RIDGE} burn={() => 1} t={c.t} size={7} seed="ridge" />
      <Halo position={[0, 10, -66]} size={120} color="#FF7A30" opacity={0.3} />
      {[0, 1, 2].map((i) => {
        const a = c.t * (0.35 + i * 0.05) + i * 2.1;
        return <Dragonfly key={i} position={[Math.cos(a) * (16 + i * 6), 18 + i * 4, Math.sin(a) * 10 + 8]} yaw={-a} scale={2.6} flap={c.t + i * 0.13} />;
      })}
    </Shot>
  );
};

/** "Sometimes, even too much of a good thing can be deadly.": he strikes a match: it roars; he blows it out. */
const c6Match: ShotFn = (c) => {
  const blow = k01(c.lt, 1.8, 2.2);
  const flame = c.lt < 0.25 ? 0 : (0.3 + 1.6 * k01(c.lt, 0.3, 0.6)) * (1 - blow);
  const { pose, base } = matchStance([0, 0, 0], 0, [-1.2, 2.35, 0.8], { expression: c.lt > 1.6 && c.lt < 2.4 ? "alarm" : c.lt > 2.4 ? "relief" : "worried", headPitch: 0.05 });
  const cam = move({ position: [0.6, 3.7, 8.6], target: [-0.6, 3.7, 0] }, { position: [0.5, 3.7, 7.8], target: [-0.6, 3.7, 0] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[60, 300]} shadowSize={10} light={0.7}>
      <Rooftop />
      <Hero pose={pose} position={[0, 0, 0]} />
      <Match position={base} t={c.t} flame={flame} burnt={blow} smoke={blow} />
    </Shot>
  );
};

// ---------------------------------------------------------------- thumbnail

/** Shorts cover: Slavoski in the backyard, a match in his hand roaring into a tower of flame. */
export const thumbShot: ShotFn = () => {
  const hero: V3 = [0, 0, 1];
  const { pose, base } = matchStance(hero, 0, add(hero, [-1.75, 2.05, 0.55]), { expression: "alarm", lean: -0.1, headPitch: 0.15, headYaw: -0.15 });
  return (
    <Shot mood="day" camera={{ position: [-0.2, 3.4, 19], target: [-0.7, 4.9, 0] }} fog={[60, 300]} shadowSize={14}>
      <Backyard t={0} />
      <Clouds t={0} color="#F4F6FA" y={45} radius={160} count={14} seed="th" />
      <Hero pose={pose} position={hero} />
      <Match position={base} t={0.4} flame={3.6} />
    </Shot>
  );
};

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldMatch },
    { cue: "oxygen", fn: coldFace },
    { cue: "doubled", fn: coldTown },
  ],
  c1: [
    { cue: null, fn: c1Grid },
    { cue: "of the air", fn: c1Sleep },
    { cue: "But imagine", fn: c1Wake },
    { cue: "suddenly jumped", fn: c1Grid42 },
    { cue: "At first", fn: c1Stretch },
  ],
  c2: [
    { cue: null, fn: c2Grill },
    { cue: "Fires become", fn: c2Flare },
    { cue: "A tiny spark", fn: c2Spark },
    { cue: "could suddenly ignite", fn: c2Ignite },
    { cue: "Wildfires", fn: c2Wildfire },
    { cue: "and putting", fn: c2Bomber },
  ],
  c3: [
    { cue: null, fn: c3Xray },
    { cue: "You might think", fn: c3Run },
    { cue: "means twice", fn: c3Flex },
    { cue: "Unfortunately", fn: c3Pant },
    { cue: "Your blood", fn: c3Blood },
    { cue: "with oxygen under", fn: c3Cell },
    { cue: "and breathing unusually", fn: c3Lungs },
    { cue: "can damage", fn: c3Damage },
  ],
  c4: [
    { cue: null, fn: c4Interest },
    { cue: "Millions of years", fn: c4Swamp },
    { cue: "more oxygen than", fn: c4Log },
    { cue: "and some insects", fn: c4Dragonfly },
    { cue: "Scientists believe", fn: c4Millipede },
    { cue: "because insects", fn: c4Tubes },
  ],
  c5: [
    { cue: null, fn: c5Spider },
    { cue: "Not overnight", fn: c5Tiny },
    { cue: "Evolution takes", fn: c5Generations },
    { cue: "and oxygen isn't", fn: c5Bird },
    { cue: "But over millions", fn: c5Timelapse },
    { cue: "ecosystems", fn: c5Jungle },
  ],
  c6: [
    { cue: null, fn: c6Turn },
    { cue: "oxygen is the very", fn: c6Breathe },
    { cue: "yet doubling", fn: c6World },
    { cue: "Sometimes", fn: c6Match },
  ],
};
