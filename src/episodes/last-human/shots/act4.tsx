/**
 * Act 4: 10 ALONE (day 30, a rainy night in the homestead, firelight) and 11 A NEW ROUTINE (a
 * dawn-to-night montage: the alarm callback, running, cooking, repairs, a journal, the library,
 * a message painted on a roof, the radio, a signal fire).
 */
import React from "react";
import { random } from "remotion";
import { Building } from "../../../slavoski/city";
import { BoxG, CylG, IcoG } from "../../../slavoski/detail";
import { FONT } from "../../../slavoski/fonts";
import { Flat, Glow, Halo } from "../../../slavoski/materials";
import { Rain } from "../../../slavoski/nature";
import { clamp01, type V3 } from "../../../slavoski/noise";
import { P } from "../../../slavoski/palette";
import { crowdLook } from "../../../slavoski/hero";
import { handPosition, Hero, mergePose, reach, REST, type Pose } from "../../../slavoski/rig/Hero";
import { CanvasPanel, CANVAS_FONT, ScreenHtml } from "../../../slavoski/screens";
import type { CuedShot } from "../../../slavoski/timeline";
import { GroundWriting } from "../../smart-animals/props";
import { AlarmClock, CLOCK, Phone3D, PHONE } from "../../ww3-countdown/props";
import { Candle, Laptop, laptopScreen, RecScreen } from "../props/home";
import { Campfire, HomesteadRoom, HOUSE, Radio, ROOM, SolarPanel } from "../props/survival";
import { S } from "../props/town";
import { growthAt } from "../props/wild";
import { bedPose } from "./act1";
import { Countryside } from "./act3";
import { k01, lerp, move, prog, Shot, Sky, standing, walking, type ShotCtx, type ShotFn } from "./common";

const DAY30 = growthAt(30);
const NIGHT_WINDOW = "#1A2440";

/** Seated on a chair (seat ~1.6 above the floor, feet on the floor). */
export const chairPose = (over: Partial<Pose> = {}): Pose =>
  mergePose(REST, { lHip: [1.45, 0.08], rHip: [1.45, 0.08], lKnee: 1.45, rKnee: 1.45, bob: -1.0, lShoulder: [0.5, 0.1], rShoulder: [0.5, 0.1], lElbow: 1.0, rElbow: 1.0, ...over });

/** A simple wooden chair (seat top at 1.6), front toward +Z. */
export const Chair: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 1.5, 0]} castShadow>
      <BoxG args={[1.6, 0.16, 1.6]} />
      <Flat color="#6A4A2E" />
    </mesh>
    <mesh position={[0, 2.7, -0.75]} castShadow>
      <BoxG args={[1.6, 2.2, 0.14]} />
      <Flat color="#6A4A2E" />
    </mesh>
    {[-0.7, 0.7].flatMap((x) =>
      [-0.7, 0.7].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.72, z]} castShadow>
          <BoxG args={[0.14, 1.44, 0.14]} />
          <Flat color="#5A3A24" />
        </mesh>
      )),
    )}
  </group>
);

/** The homestead room at night: rain against the window, the fire low. */
const NightRoom: React.FC<{ t: number; clutter?: number; tally?: number; fire?: number }> = ({ t, clutter = 0, tally = 0, fire = 0.8 }) => (
  <>
    <HomesteadRoom t={t} fire={fire} jars={16} window={NIGHT_WINDOW} clutter={clutter} tally={tally} />
    <Rain center={[ROOM.window[0], ROOM.window[1], ROOM.window[2] - 1.5]} size={[4, 4, 1]} t={t} count={80} />
    <Candle position={[ROOM.table[0] + 1.2, ROOM.tableTop, ROOM.table[2] - 0.4]} t={t} />
  </>
);

// ================================================================ 10 ALONE

/** The farmhouse at night in the rain, its windows warm. */
const c10House: ShotFn = (c) => {
  const k = prog(c);
  const cam = { position: [lerp(-26, -14, k), lerp(9, 6.5, k), lerp(46, 30, k)] as V3, target: [0, 4.6, 4] as V3, fov: 40 };
  return (
    <Shot mood="storm" camera={cam} fog={[40, 300]} shadowSize={40} light={0.45}>
      <Countryside t={c.t} growth={DAY30} lit={1} panels={2} />
      <Rain center={[cam.position[0] + 8, 8, cam.position[2] - 12]} size={[40, 24, 30]} t={c.t} count={700} />
      <Sky t={c.t} tint="storm" y={50} />
    </Shot>
  );
};

/** Alone at the table, the fire behind him. */
const c10Lonely: ShotFn = (c) => {
  const T = ROOM.table;
  const hero: V3 = [T[0], 0, T[2] + 2.0];
  const cam = move({ position: [T[0] + 7, 6.5, T[2] + 9], target: [T[0] - 1, 3, T[2] - 1] }, { position: [T[0] + 5.5, 6, T[2] + 7.5], target: [T[0] - 1, 3, T[2] - 1] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 40 }} fog={false} stars={false} light={0.18} shadowSize={14}>
      <NightRoom t={c.t} />
      <Chair position={[hero[0], 0, hero[2] + 0.2]} yaw={Math.PI} />
      <Hero pose={chairPose({ expression: "worried", headPitch: -0.35, lShoulder: [0.9, 0.05], rShoulder: [0.9, 0.05], lElbow: 1.6, rElbow: 1.6 })} position={hero} yaw={Math.PI} />
    </Shot>
  );
};

/** At the window, rain streaming down outside. */
const c10Window: ShotFn = (c) => {
  const W = ROOM.window;
  const hero: V3 = [W[0] + 0.3, 0, W[2] + 2.6];
  const cam = move({ position: [W[0] + 4, 5.6, W[2] + 9], target: [W[0], 4.6, W[2]] }, { position: [W[0] + 3, 5.2, W[2] + 7.5], target: [W[0], 4.6, W[2]] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.16} shadowSize={10}>
      <NightRoom t={c.t} />
      <Hero pose={standing({ expression: "worried", headPitch: -0.05 })} position={hero} yaw={Math.PI} />
    </Shot>
  );
};

/** A long table set for one; the other chairs empty. */
const c10Table: ShotFn = (c) => {
  const cam = move({ position: [-9, 5.2, 4], target: [3, 2.2, 0] }, { position: [-8, 4.6, 2.5], target: [3, 2.2, 0] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 40 }} fog={false} stars={false} light={0.12} shadowSize={14}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[30, 0.1, 20]} />
        <Flat color="#5A3E2A" />
      </mesh>
      <mesh position={[0, 5, -6]}>
        <BoxG args={[30, 10, 0.2]} />
        <Flat color="#8A6A4A" />
      </mesh>
      <mesh position={[0, 1.95, 0]} castShadow receiveShadow>
        <BoxG args={[12, 0.16, 3]} />
        <Flat color="#7A5034" />
      </mesh>
      {[-5.4, 5.4].flatMap((x) =>
        [-1.3, 1.3].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.95, z]} castShadow>
            <BoxG args={[0.18, 1.9, 0.18]} />
            <Flat color="#5A3A24" />
          </mesh>
        )),
      )}
      {[-4, -1.3, 1.3, 4].flatMap((x, i) =>
        [-1, 1].map((s) => <Chair key={`${x}${s}`} position={[x + (random(`tc${i}${s}`) - 0.5) * 0.4, 0, s * 2.3]} yaw={s > 0 ? Math.PI : 0} />),
      )}
      {/* one place setting */}
      <mesh position={[-4, 2.06, 0.7]}>
        <CylG args={[0.5, 0.45, 0.06, 14]} />
        <Flat color="#F2EEE6" />
      </mesh>
      <mesh position={[-3.4, 2.25, 0.4]} castShadow>
        <CylG args={[0.15, 0.13, 0.4, 8]} />
        <Flat color="#C8CCD4" />
      </mesh>
      <Candle position={[0, 2.03, 0]} t={c.t} />
    </Shot>
  );
};

/** Thirty marks on the wall calendar. */
const c10Tally: ShotFn = (c) => {
  const pos: V3 = [7.5, 6.6, -5.98];
  const cam = move({ position: [pos[0] + 1.2, pos[1] - 0.2, pos[2] + 5], target: pos }, { position: [pos[0] + 0.8, pos[1], pos[2] + 3.8], target: pos }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 34 }} fog={false} stars={false} light={0.25} shadowSize={8}>
      <NightRoom t={c.t} tally={30} />
      <Candle position={[pos[0] - 0.6, 4.9, pos[2] + 0.6]} t={c.t} light={1.4} />
      <mesh position={[pos[0] - 0.6, 4.8, pos[2] + 0.5]}>
        <BoxG args={[2, 0.2, 1.2]} />
        <Flat color="#6A4A2E" />
      </mesh>
    </Shot>
  );
};

/** Quick inserts: an empty armchair, a silent phone, an empty chair across the table. */
const c10EmptyChair: ShotFn = (c) => {
  const cam = move({ position: [-1, 3.4, 4.4], target: [-4, 1.8, -2.4] }, { position: [-1.4, 3.2, 3.8], target: [-4, 1.8, -2.4] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.2} shadowSize={10}>
      <NightRoom t={c.t} />
      {/* armchair by the fire */}
      <group position={[-4.6, 0, -1.8]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 1.0, 0]} castShadow>
          <BoxG args={[2.6, 1.2, 2.4]} />
          <Flat color="#5A6A8A" />
        </mesh>
        <mesh position={[0, 2.4, -1.0]} castShadow>
          <BoxG args={[2.6, 2.4, 0.5]} />
          <Flat color="#4E5E7E" />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 1.15, 1.8, 0]} castShadow>
            <BoxG args={[0.4, 0.8, 2.4]} />
            <Flat color="#4E5E7E" />
          </mesh>
        ))}
      </group>
    </Shot>
  );
};

const c10SilentPhone: ShotFn = (c) => {
  const T = ROOM.table;
  const at: V3 = [T[0] - 0.4, ROOM.tableTop + PHONE.d / 2 + 0.01, T[2] + 0.3];
  const cam = move({ position: [at[0] + 1.2, at[1] + 1.4, at[2] + 1.6], target: at }, { position: [at[0] + 0.9, at[1] + 1.1, at[2] + 1.2], target: at }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 36 }} fog={false} stars={false} light={0.2} shadowSize={6}>
      <NightRoom t={c.t} />
      <Phone3D position={at} rotation={[-Math.PI / 2, 0, 0.3]} glow="#0B0C10" />
    </Shot>
  );
};

const c10AcrossTable: ShotFn = (c) => {
  const T = ROOM.table;
  const cam = move({ position: [T[0] + 0.5, 3.6, T[2] + 4.5], target: [T[0], 2.4, T[2] - 2] }, { position: [T[0] + 0.3, 3.4, T[2] + 3.6], target: [T[0], 2.5, T[2] - 2] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.2} shadowSize={10}>
      <NightRoom t={c.t} />
      <Chair position={[T[0], 0, T[2] - 2.2]} />
      <mesh position={[T[0], ROOM.tableTop + 0.04, T[2] - 0.7]}>
        <CylG args={[0.5, 0.45, 0.06, 14]} />
        <Flat color="#F2EEE6" />
      </mesh>
    </Shot>
  );
};

/** A small cake with a single candle; he sits behind it. */
const c10Celebrate: ShotFn = (c) => {
  const T = ROOM.table;
  const cake: V3 = [T[0] + 0.3, ROOM.tableTop, T[2] + 0.4];
  const hero: V3 = [T[0], 0, T[2] - 2.2];
  const cam = move({ position: [cake[0] + 0.4, cake[1] + 1.3, cake[2] + 3.4], target: [cake[0], cake[1] + 1.2, cake[2] - 1.5] }, { position: [cake[0] + 0.3, cake[1] + 1.2, cake[2] + 2.8], target: [cake[0], cake[1] + 1.2, cake[2] - 1.5] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 36 }} fog={false} stars={false} light={0.15} shadowSize={8}>
      <NightRoom t={c.t} />
      <Chair position={[hero[0], 0, hero[2] - 0.2]} />
      <Hero pose={chairPose({ expression: "worried", headPitch: -0.25, lShoulder: [0.9, 0.05], rShoulder: [0.9, 0.05], lElbow: 1.5, rElbow: 1.5 })} position={hero} />
      <mesh position={[cake[0], cake[1] + 0.3, cake[2]]} castShadow>
        <CylG args={[0.6, 0.6, 0.6, 14]} />
        <Flat color="#E8D6B0" />
      </mesh>
      <mesh position={[cake[0], cake[1] + 0.62, cake[2]]}>
        <CylG args={[0.62, 0.62, 0.06, 14]} />
        <Flat color="#F2EEE6" />
      </mesh>
      <Candle position={[cake[0], cake[1] + 0.62, cake[2]]} t={c.t} size={0.6} />
    </Shot>
  );
};

/** On the floor by the fire, knees up, head down. */
const c10Floor: ShotFn = (c) => {
  const F = ROOM.hearth;
  const hero: V3 = [F[0] + 1.2, 0, F[2] + 4.2];
  const pose = mergePose(REST, { lHip: [2.0, 0.15], rHip: [2.0, 0.15], lKnee: 2.3, rKnee: 2.3, bob: -1.55, lean: 0.35, headPitch: -0.5, lShoulder: [1.0, 0.2], rShoulder: [1.0, 0.2], lElbow: 1.8, rElbow: 1.8, expression: "worried" });
  const cam = move({ position: [F[0] + 7, 3.6, F[2] + 9], target: [hero[0], 1.6, hero[2]] }, { position: [F[0] + 6, 3.3, F[2] + 7.8], target: [hero[0], 1.6, hero[2]] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.15} shadowSize={10}>
      <NightRoom t={c.t} fire={0.7} />
      <Hero pose={pose} position={hero} yaw={Math.PI - 0.3} />
    </Shot>
  );
};

/** Talking to himself, gesturing at the empty room. */
const c10Talking: ShotFn = (c) => {
  const T = ROOM.table;
  const hero: V3 = [T[0] - 1.6, 0, T[2] + 2.4];
  const talk = Math.floor(c.t * 5) % 2 === 0;
  const g = Math.sin(c.lt * 3);
  const pose = mergePose(standing({ expression: talk ? "alarm" : "smile", headYaw: 0.3 * g }), { rShoulder: [0.9 + 0.3 * g, 0.4], rElbow: 1.2, lShoulder: [0.5, 0.3 - 0.2 * g], lElbow: 1.0 });
  const cam = move({ position: [hero[0] + 5, 5.0, hero[2] + 6.5], target: [hero[0], 3.4, hero[2]] }, { position: [hero[0] + 4, 4.6, hero[2] + 5.5], target: [hero[0], 3.4, hero[2]] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.18} shadowSize={10}>
      <NightRoom t={c.t} />
      <Hero pose={pose} position={hero} yaw={-0.4} />
    </Shot>
  );
};

const c10Record: ShotFn = (c) => {
  const T = ROOM.table;
  const at: V3 = [T[0], ROOM.tableTop + 0.7, T[2] + 0.4];
  const cam = move({ position: [at[0] + 0.06, at[1] + 0.02, at[2] + 1.8], target: at }, { position: [at[0] + 0.03, at[1], at[2] + 1.45], target: at }, c);
  return (
    <Shot
      mood="night"
      camera={{ ...cam, fov: 34 }}
      fog={false}
      stars={false}
      light={0.2}
      shadowSize={6}
      overlay={
        <ScreenHtml c={[at[0], at[1], at[2] + PHONE.d / 2 + 0.003]} w={PHONE.screenW} h={PHONE.screenH} cam={{ ...cam, fov: 34 }} width={c.width} height={c.height}>
          {(w, h) => <RecScreen w={w} h={h} t={c.t} day={30} />}
        </ScreenHtml>
      }
    >
      <NightRoom t={c.t} />
      <Phone3D position={at} glow="#20141A" />
      {/* propped on a stack of books */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[at[0], ROOM.tableTop + 0.1 + i * 0.2, at[2] - 0.15]} castShadow>
          <BoxG args={[1.2, 0.18, 0.9]} />
          <Flat color={["#8A3A3A", "#2E5A6A", "#B39A62"][i]} />
        </mesh>
      ))}
    </Shot>
  );
};

/** Old videos on a laptop: people laughing at a party (our own figures), their glow on his face. */
const c10Videos: ShotFn = (c) => {
  const T = ROOM.table;
  const lp: V3 = [T[0], ROOM.tableTop, T[2] + 0.2];
  const scr = laptopScreen(lp, Math.PI);
  const hero: V3 = [T[0], 0, T[2] - 2.0];
  const cam = move({ position: [lp[0] + 1.6, lp[1] + 1.8, lp[2] + 3.2], target: [lp[0], lp[1] + 1.6, lp[2] - 1.4] }, { position: [lp[0] + 1.2, lp[1] + 1.7, lp[2] + 2.6], target: [lp[0], lp[1] + 1.6, lp[2] - 1.4] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.15} shadowSize={8}>
      <NightRoom t={c.t} fire={0.4} />
      <Chair position={[hero[0], 0, hero[2] - 0.2]} />
      <Hero pose={chairPose({ expression: "smile", headPitch: -0.15, lShoulder: [0.9, 0.05], rShoulder: [0.9, 0.05], lElbow: 1.5, rElbow: 1.5 })} position={hero} />
      <Laptop position={lp} yaw={Math.PI} glow="#FFE0B0" />
      <pointLight position={[scr.c[0], scr.c[1], scr.c[2] - 1.2]} color="#FFE0B0" intensity={5} distance={5} decay={2} />
    </Shot>
  );
};

/** The screen itself: a crowd at a party, a blurry phone video (generic figures). */
const c10VideoScreen: ShotFn = (c) => {
  const cam = move({ position: [0, 3.8, 9], target: [0, 3.4, 0] }, { position: [0, 3.7, 7.5], target: [0, 3.5, 0] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 40 }} fog={false} stars={false} light={0.6} shadowSize={10} vignette>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[30, 0.1, 20]} />
        <Flat color="#3A2E3A" />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => {
        const bounce = Math.abs(Math.sin(c.t * 4 + i * 1.3)) * 0.3;
        const x = -6 + i * 2;
        return (
          <Hero
            key={i}
            pose={mergePose(REST, { bob: bounce, expression: i % 2 ? "smile" : "awe", lShoulder: [0.4, 0.4 + bounce * 3], rShoulder: [0.4, 0.4 + bounce * 2], headYaw: Math.sin(c.t + i) * 0.3 })}
            position={[x, 0, -1 - (i % 2) * 2]}
            look={crowdLook(i + 3)}
          />
        );
      })}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[-8 + i * 1.8, 7.5 + Math.sin(i) * 0.4, -4]}>
          <IcoG args={[0.18, 0]} />
          <Glow color={["#FFBA58", "#7AD4FF", "#FF7AB0"][i % 3]} />
        </mesh>
      ))}
      <pointLight position={[0, 7, 4]} color="#FFD8A0" intensity={30} distance={22} decay={2} />
    </Shot>
  );
};

/** Clutter piling up; he slumps in the chair. Slow pull back. */
const c10Routine: ShotFn = (c) => {
  const T = ROOM.table;
  const hero: V3 = [T[0] + 1.8, 0, T[2] + 2.0];
  const k = prog(c);
  const cam = { position: [lerp(T[0] - 1, T[0] - 3, k), lerp(4.6, 6.4, k), lerp(T[2] - 3, T[2] - 5.4, k)] as V3, target: [hero[0], 2.6, hero[2]] as V3, fov: 40 };
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.15} shadowSize={14}>
      <NightRoom t={c.t} clutter={1} fire={0.4} />
      <Chair position={[hero[0], 0, hero[2] + 0.2]} yaw={Math.PI + 0.4} />
      <Hero pose={chairPose({ expression: "worried", headPitch: -0.45, lean: -0.2, lShoulder: [0.2, 0.2], rShoulder: [0.2, 0.2], lElbow: 0.3, rElbow: 0.3 })} position={hero} yaw={Math.PI + 0.4} />
    </Shot>
  );
};

const c10Away: ShotFn = (c) => {
  const k = prog(c);
  const cam = { position: [lerp(-14, -50, k), lerp(6, 22, k), lerp(30, 90, k)] as V3, target: [0, 4, 0] as V3, fov: 40 };
  return (
    <Shot mood="storm" camera={cam} fog={[40, 400]} shadowSize={60} light={0.4}>
      <Countryside t={c.t} growth={DAY30} lit={0.8} panels={2} />
      <Rain center={[cam.position[0] + 10, 10, cam.position[2] - 14]} size={[50, 30, 40]} t={c.t} count={700} />
      <Sky t={c.t} tint="storm" y={50} />
    </Shot>
  );
};

// ================================================================ 11 A NEW ROUTINE

const drawSchedule = (k: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#2A3A2E";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#F2EEE6";
  ctx.font = CANVAS_FONT(H * 0.09);
  ctx.textAlign = "left";
  const rows = ["6:00  WAKE UP", "6:30  RUN", "8:00  GARDEN", "12:00  REPAIRS", "15:00  SEARCH", "20:00  JOURNAL", "21:00  RADIO"];
  rows.forEach((r, i) => {
    if (i > k * rows.length) return;
    ctx.fillText(r, W * 0.06, H * (0.14 + i * 0.125));
  });
};

const c11Schedule: ShotFn = (c) => {
  const pos: V3 = [-7.5, 5.6, -5.98];
  const cam = move({ position: [pos[0] + 3, 5.2, pos[2] + 7], target: pos }, { position: [pos[0] + 2.4, 5.3, pos[2] + 5.6], target: pos }, c);
  const hand: V3 = [pos[0] + 1.1 - prog(c) * 1.6, pos[1] - 0.6 + prog(c) * 0.9, pos[2] + 0.4];
  return (
    <Shot mood="dawn" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.6} shadowSize={8}>
      <HomesteadRoom t={c.t} fire={0.3} jars={16} window="#E8C8B8" />
      <CanvasPanel position={pos} w={3.4} h={3.2} px={600} draw={drawSchedule(k01(c.lt, 0, 1.6))} />
      <mesh position={hand} scale={[1.1, 0.8, 1]}>
        <IcoG args={[0.22, 2]} />
        <Flat color={P.skin} />
      </mesh>
      <mesh position={[hand[0] + 0.4, hand[1] - 0.6, hand[2] + 0.4]} rotation={[0.5, 0, 0.3]}>
        <BoxG args={[0.32, 1.3, 0.32]} />
        <Flat color={P.jacket} />
      </mesh>
    </Shot>
  );
};

/** The alarm callback: 6:00, dawn, he is already sitting up. */
const BED_POS: V3 = [-8.5, 0, 0];
const c11Wake: ShotFn = (c) => {
  const clock: V3 = [BED_POS[0] + 2.4, 1.2, BED_POS[2] - 3.6];
  const face: V3 = [clock[0], clock[1] + 0.25, clock[2] + 0.205];
  const cam = move({ position: [BED_POS[0] + 6, 4.6, BED_POS[2] + 6], target: [BED_POS[0] + 0.5, 2.6, BED_POS[2] - 1.5] }, { position: [BED_POS[0] + 5, 4.3, BED_POS[2] + 5], target: [BED_POS[0] + 0.5, 2.7, BED_POS[2] - 1.5] }, c);
  const reachK = k01(c.lt, 0.6, 1.1);
  const pose = bedPose({ expression: "neutral", headYaw: 0.4 * reachK, rShoulder: [0.25 + 0.9 * reachK, 0.25], rElbow: 0.5 - 0.3 * reachK });
  return (
    <Shot
      mood="dawn"
      camera={{ ...cam, fov: 38 }}
      fog={false}
      stars={false}
      light={0.55}
      shadowSize={10}
      overlay={
        <ScreenHtml c={face} w={CLOCK.w} h={CLOCK.h} cam={{ ...cam, fov: 38 }} width={c.width} height={c.height}>
          {(w, h) => (
            <div style={{ width: w, height: h, background: "#140404", color: "#FF3A2A", fontFamily: FONT, fontWeight: 700, fontSize: h * 0.56, display: "flex", alignItems: "center", justifyContent: "center", textShadow: "0 0 12px #FF3A2A", opacity: Math.floor(c.t * 2.2) % 2 ? 1 : 0.3 }}>
              6:00
            </div>
          )}
        </ScreenHtml>
      }
    >
      <HomesteadRoom t={c.t} fire={0.2} jars={16} window="#E8C8B8" />
      {/* a simple bed against the wall */}
      <mesh position={[BED_POS[0], 0.6, BED_POS[2] - 1.2]} castShadow receiveShadow>
        <BoxG args={[3.2, 1.2, 6]} />
        <Flat color="#6A4A2E" />
      </mesh>
      <mesh position={[BED_POS[0], 1.35, BED_POS[2] - 1.2]} castShadow>
        <BoxG args={[3.0, 0.3, 5.8]} />
        <Flat color="#E8E2D4" />
      </mesh>
      <mesh position={[BED_POS[0], 1.75, BED_POS[2] + 0.4]} castShadow>
        <BoxG args={[3.0, 0.5, 2.8]} />
        <Flat color="#8A3A3A" />
      </mesh>
      <Hero pose={pose} position={[BED_POS[0], 1.5 - (1.55 + 0.02 - 0.18), BED_POS[2] - 2.6]} />
      <mesh position={[clock[0], 0.6, clock[2]]} castShadow>
        <BoxG args={[1.2, 1.2, 1.0]} />
        <Flat color="#8A6A40" />
      </mesh>
      <AlarmClock position={clock} />
    </Shot>
  );
};

/** Running along the empty country road at sunrise. */
const c11Run: ShotFn = (c) => {
  const z = 60 - c.lt * 4.2;
  const { pose } = walking(c.lt, 4.2, { lean: 0.15, lShoulder: [0, 0.15], rShoulder: [0, 0.15], lElbow: 1.5, rElbow: 1.5, expression: "neutral" });
  const cam = move({ position: [-6, 3.6, z - 12], target: [16, 3, z] }, { position: [-6, 3.6, z - 10], target: [16, 3, z] }, c);
  return (
    <Shot mood="dawn" camera={{ ...cam, fov: 40 }} fog={[60, 600]} shadowSize={30} keyDir={[0.75, 0.3, -0.55]}>
      <Countryside t={c.t} growth={growthAt(60)} panels={2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[16, 0.02, 0]} receiveShadow>
        <planeGeometry args={[8, 600]} />
        <Flat color="#7A6A54" />
      </mesh>
      <Hero pose={pose} position={[16, 0, z]} yaw={Math.PI} />
      <Sky t={c.t} tint="dawn" />
    </Shot>
  );
};

const c11Cook: ShotFn = (c) => {
  const pot = ROOM.pot;
  const hero: V3 = [pot[0] + 2.4, 0, pot[2] + 2.6];
  const stir = Math.sin(c.lt * 6);
  const pose = reach(standing({ expression: "neutral", headPitch: -0.3 }), "r", [pot[0] + 0.25 + stir * 0.15, pot[1] + 0.6, pot[2] + 0.1], { position: hero, yaw: -2.4 }).pose;
  const cam = move({ position: [pot[0] - 3.4, 3.8, pot[2] + 5.6], target: [pot[0] + 1.0, 2.4, pot[2] + 1.0] }, { position: [pot[0] - 2.8, 3.6, pot[2] + 4.8], target: [pot[0] + 1.0, 2.4, pot[2] + 1.0] }, c);
  const h = handPosition(pose, "r", hero, -2.4);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.4} shadowSize={8}>
      <HomesteadRoom t={c.t} jars={16} />
      <Hero pose={pose} position={hero} yaw={-2.4} />
      <mesh position={[(h[0] + pot[0]) / 2, (h[1] + pot[1] + 0.3) / 2, (h[2] + pot[2]) / 2]} rotation={[0, 0, 0.6]}>
        <CylG args={[0.04, 0.04, 1.6, 5]} />
        <Flat color="#8A5A34" />
      </mesh>
    </Shot>
  );
};

/** Fixing a solar panel on a trestle outside: the hammer taps. */
const c11Repair: ShotFn = (c) => {
  const bench: V3 = [12, 0, 18];
  const hero: V3 = [bench[0], 0, bench[2] + 2.4];
  const tap = Math.max(0, Math.sin(c.lt * 10));
  const pose = mergePose(standing({ expression: "neutral", headPitch: -0.4, lean: 0.2 }), { rShoulder: [1.2 + tap * 0.4, 0.2], rElbow: 1.4 - tap * 0.6, lShoulder: [0.9, 0.1], lElbow: 0.8 });
  const cam = move({ position: [bench[0] + 7, 4.4, bench[2] + 7], target: [bench[0], 2.4, bench[2]] }, { position: [bench[0] + 6, 4.0, bench[2] + 6], target: [bench[0], 2.4, bench[2]] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 40 }} fog={[60, 500]} shadowSize={30}>
      <Countryside t={c.t} growth={growthAt(70)} panels={2} />
      {[-1.6, 1.6].map((x) => (
        <mesh key={x} position={[bench[0] + x, 1.0, bench[2]]} castShadow>
          <BoxG args={[0.3, 2.0, 1.6]} />
          <Flat color="#8A6A40" />
        </mesh>
      ))}
      <SolarPanel position={[bench[0], 2.1, bench[2]]} />
      <Hero pose={pose} position={hero} yaw={Math.PI} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

const drawJournal = (k: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#F4EEDA";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#C8D4E4";
  ctx.lineWidth = 2;
  for (let y = H * 0.2; y < H; y += H * 0.1) {
    ctx.beginPath();
    ctx.moveTo(W * 0.04, y);
    ctx.lineTo(W * 0.96, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#1A2A5A";
  ctx.font = CANVAS_FONT(H * 0.075);
  ctx.textAlign = "left";
  const lines = ["DAY 41", "Rain stopped. Planted beans.", "Fixed the panel cable.", "Radio: static again.", "Still no one. Tomorrow,", "the library across the river."];
  const n = k * lines.length;
  lines.forEach((l, i) => {
    if (i > n) return;
    const part = i + 1 > n ? l.slice(0, Math.floor((n - i) * l.length)) : l;
    ctx.fillText(part, W * 0.06, H * (0.17 + i * 0.1));
  });
};

const c11Journal: ShotFn = (c) => {
  const T = ROOM.table;
  const pad: V3 = [T[0] - 0.4, ROOM.tableTop + 0.02, T[2] + 0.3];
  const cam = move({ position: [pad[0] + 0.6, pad[1] + 2.8, pad[2] + 1.8], target: pad }, { position: [pad[0] + 0.4, pad[1] + 2.4, pad[2] + 1.4], target: pad }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.2} shadowSize={6}>
      <HomesteadRoom t={c.t} fire={0.6} jars={16} window={NIGHT_WINDOW} />
      <Candle position={[pad[0] + 1.4, ROOM.tableTop, pad[2] - 0.6]} t={c.t} />
      <CanvasPanel position={pad} rotation={[-Math.PI / 2, 0, -0.08]} w={2.0} h={2.6} px={600} draw={drawJournal(k01(c.lt, 0, 1.2))} />
    </Shot>
  );
};

/** A library hall: tall shelves, light shafts, the sections he needs. */
const Library: React.FC<{ t: number }> = ({ t }) => {
  const books = React.useMemo(() => {
    const out: { p: V3; h: number; c: string }[] = [];
    [-9, 9].forEach((x, si) => {
      for (let bay = 0; bay < 6; bay++)
        for (let row = 0; row < 6; row++)
          for (let b = 0; b < 9; b++) {
            const k = `lb${si}${bay}${row}${b}`;
            if (random(k) < 0.12) continue;
            out.push({ p: [x - Math.sign(x) * 0.6, 0.9 + row * 1.6, -2 - bay * 6 + b * 0.62], h: 0.9 + random(`${k}h`) * 0.4, c: ["#8A3A3A", "#2E5A6A", "#B39A62", "#3A6A4A", "#5A4A78", "#C8862A", "#2A3A5A"][Math.floor(random(`${k}c`) * 7)] });
          }
    });
    return out;
  }, []);
  return (
    <group>
      <mesh position={[0, -0.05, -14]} receiveShadow>
        <BoxG args={[22, 0.1, 50]} />
        <Flat color="#6A4A34" />
      </mesh>
      {[-10.5, 10.5].map((x) => (
        <mesh key={x} position={[x, 7, -14]}>
          <BoxG args={[0.3, 14, 50]} />
          <Flat color="#C8B898" />
        </mesh>
      ))}
      <mesh position={[0, 7, -38]}>
        <BoxG args={[22, 14, 0.3]} />
        <Flat color="#B8A888" />
      </mesh>
      {[-9, 9].map((x) =>
        [0, 1, 2, 3, 4, 5].map((r) => (
          <mesh key={`${x}${r}`} position={[x, 0.5 + r * 1.6, -17]} receiveShadow>
            <BoxG args={[1.6, 0.1, 34]} />
            <Flat color="#5A3A24" />
          </mesh>
        )),
      )}
      {books.map((b, i) => (
        <mesh key={i} position={[b.p[0], b.p[1] - 0.4 + b.h / 2, b.p[2]]}>
          <BoxG args={[0.9, b.h, 0.5]} />
          <Flat color={b.c} />
        </mesh>
      ))}
      {[
        ["FARMING", -9, -4],
        ["MEDICINE", 9, -4],
        ["ENGINEERING", -9, -16],
      ].map(([label, x, z]) => (
        <CanvasPanel key={label as string} position={[(x as number) - Math.sign(x as number) * 1.0, 10.4, z as number]} rotation={[0, (x as number) < 0 ? Math.PI / 2 : -Math.PI / 2, 0]} w={4.4} h={0.8} draw={(ctx, W, H) => {
          ctx.fillStyle = "#1D274B";
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = "#F6EBC4";
          ctx.font = CANVAS_FONT(H * 0.6);
          ctx.textAlign = "center";
          ctx.fillText(label as string, W / 2, H * 0.72);
        }} />
      ))}
      {/* reading table */}
      <mesh position={[0, 1.95, -8]} castShadow receiveShadow>
        <BoxG args={[4, 0.16, 8]} />
        <Flat color="#7A5034" />
      </mesh>
      {/* light shafts from high windows */}
      {[0, 1, 2].map((i) => (
        <group key={i}>
          <mesh position={[10.3, 11, -6 - i * 10]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[3, 4]} />
            <Glow color="#FFF0D0" />
          </mesh>
          <mesh position={[4, 6, -6 - i * 10]} rotation={[0, 0, -0.75]}>
            <BoxG args={[16, 2.6, 2.6]} />
            <meshBasicMaterial color="#FFE8B8" transparent opacity={0.06} depthWrite={false} blending={2} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <pointLight position={[0, 11, -10]} color="#FFF0D8" intensity={60 * (0.95 + 0.05 * Math.sin(t))} distance={40} decay={2} />
    </group>
  );
};

const c11Library: ShotFn = (c) => {
  const hero: V3 = [-6.4, 0, -4 - prog(c) * 2];
  const pose = reach(standing({ expression: "neutral", headPitch: 0.3 }), "l", [-8.0, 6.2, hero[2]], { position: hero, yaw: -Math.PI / 2 }).pose;
  const cam = move({ position: [5, 6, 10], target: [-6, 5, -8] }, { position: [3.5, 5.6, 7], target: [-6, 5, -8] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 42 }} fog={false} stars={false} light={0.5} shadowSize={20}>
      <Library t={c.t} />
      <Hero pose={pose} position={hero} yaw={-Math.PI / 2} />
      {/* stack of books on the table */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0.3, 2.1 + i * 0.22, -7]} rotation={[0, i * 0.3, 0]} castShadow>
          <BoxG args={[1.2, 0.2, 0.9]} />
          <Flat color={["#3A6A4A", "#8A3A3A", "#2E5A6A", "#C8862A"][i]} />
        </mesh>
      ))}
    </Shot>
  );
};

/** Painting HELLO? in huge letters on a rooftop. */
const c11Roof: ShotFn = (c) => {
  const roofY = 30;
  const k = k01(c.lt, 0, 2.6);
  const cam = move({ position: [0, roofY + 46, 30], target: [0, roofY, -2] }, { position: [0, roofY + 50, 26], target: [0, roofY, -2] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 44 }} fog={[150, 900]} shadowSize={60} keyDir={[0.8, 0.3, -0.5]}>
      <group scale={S}>
        <Building position={[0, 0, 0]} w={14} d={10} h={roofY / S} seed="roofb" color="#566270" power={0} />
      </group>
      <group position={[0, roofY + 0.62, 0]}>
        <GroundWriting text="HELLO?" position={[-9, 0, 0]} size={2.4} progress={k} color="#F6EBC4" />
      </group>
      <Hero pose={mergePose(walking(c.lt, 1.5).pose, { lean: 0.5, rShoulder: [1.3, 0.1], rElbow: 0.4 })} position={[lerp(-14, 12, k), roofY + 0.6, 7]} yaw={Math.PI / 2} />
      <CityRingNight />
      <Sky t={c.t} tint="sunset" y={60} />
    </Shot>
  );
};

const CityRingNight: React.FC = () => (
  <group scale={S}>
    {Array.from({ length: 30 }, (_, i) => {
      const a = (i / 30) * Math.PI * 2;
      const r = 40 + random(`crn${i}`) * 30;
      return <Building key={i} position={[Math.sin(a) * r, 0, Math.cos(a) * r]} w={6} d={6} h={6 + random(`crh${i}`) * 14} seed={`crn${i}`} power={0} decay={0.15} />;
    })}
  </group>
);

/** Turning the radio dial at night: only static. */
const c11Radio: ShotFn = (c) => {
  const T = ROOM.table;
  const radio: V3 = [T[0] + 0.6, ROOM.tableTop, T[2] - 0.3];
  const hero: V3 = [T[0] + 0.6, 0, T[2] + 2.2];
  const pose = reach(chairPose({ expression: "worried", headPitch: -0.2 }), "r", [radio[0] + 0.7, radio[1] + 0.55, radio[2] + 0.6], { position: hero, yaw: Math.PI }).pose;
  const cam = move({ position: [radio[0] + 4, 4.2, radio[2] + 4.2], target: [radio[0], 2.8, radio[2] + 1] }, { position: [radio[0] + 3.2, 4.0, radio[2] + 3.4], target: [radio[0], 2.8, radio[2] + 1] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.15} shadowSize={8}>
      <NightRoom t={c.t} fire={0.4} />
      <Chair position={[hero[0], 0, hero[2] + 0.2]} yaw={Math.PI} />
      <Hero pose={pose} position={hero} yaw={Math.PI} />
      <Radio position={radio} t={c.t} />
    </Shot>
  );
};

/** A signal fire on the hill above the valley; the world dark to the horizon. */
const c11Signal: ShotFn = (c) => {
  const k = prog(c);
  const fire: V3 = [-40, 12, -60];
  const hero: V3 = [fire[0] + 3.5, fire[1], fire[2] + 2.5];
  const cam = { position: [lerp(fire[0] + 10, fire[0] + 26, k), lerp(fire[1] + 5, fire[1] + 16, k), lerp(fire[2] + 14, fire[2] + 34, k)] as V3, target: [fire[0] - 4, fire[1] + 3, fire[2] - 10] as V3, fov: 42 };
  return (
    <Shot mood="night" camera={cam} fog={[150, 900]} shadowSize={40} light={0.35}>
      <Countryside t={c.t} growth={growthAt(80)} lit={0.6} panels={2} />
      <mesh position={[fire[0], 0, fire[2]]} scale={[1.4, 0.55, 1.2]} castShadow receiveShadow>
        <IcoG args={[22, 2]} />
        <Flat color="#3E5A3A" />
      </mesh>
      <Campfire position={fire} t={c.t} size={1.6} />
      <Hero pose={standing({ expression: "worried", headYaw: -0.3 })} position={hero} yaw={Math.PI + 0.5} />
    </Shot>
  );
};

// ================================================================ cues

export const ACT4: Record<string, CuedShot<ShotFn>[]> = {
  c10: [
    { cue: null, fn: c10House },
    { cue: "It might be loneliness", fn: c10Lonely },
    { cue: "Humans evolved", fn: c10Window },
    { cue: "We depend", fn: c10Table },
    { cue: "Now imagine", fn: c10Tally },
    { cue: "No jokes", fn: c10EmptyChair },
    { cue: "No arguments", fn: c10SilentPhone },
    { cue: "No conversations", fn: c10AcrossTable },
    { cue: "Nobody to celebrate", fn: c10Celebrate },
    { cue: "Nobody to tell", fn: c10Floor },
    { cue: "You might begin", fn: c10Talking },
    { cue: "Recording", fn: c10Record },
    { cue: "Playing old videos", fn: c10Videos },
    { cue: "just to hear", fn: c10VideoScreen },
    { cue: "And the longer", fn: c10Routine },
    { cue: "Because surviving", fn: c10Away },
  ],
  c11: [
    { cue: null, fn: c11Schedule },
    { cue: "You wake up", fn: c11Wake },
    { cue: "You exercise", fn: c11Run },
    { cue: "cook", fn: c11Cook },
    { cue: "equipment", fn: c11Repair },
    { cue: "journal", fn: c11Journal },
    { cue: "You search libraries", fn: c11Library },
    { cue: "And you keep looking", fn: c11Roof },
    { cue: "Not because", fn: c11Radio },
    { cue: "But because accepting", fn: c11Signal },
  ],
};

export { Halo, clamp01, HOUSE };
export type { ShotCtx };
