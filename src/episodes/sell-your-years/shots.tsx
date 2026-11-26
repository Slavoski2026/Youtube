/**
 * Shots for "What If You Could Sell Years of Your Life?" (ep. 8).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * Hook: Slavoski's ATM balance (£10.00) in the drizzle, then a LIFEBANK kiosk lights up beside it.
 * Arc: grey drizzle → bright midday → golden hour → sunny towers vs a stormy slum → night market →
 * sunset → space → a day-night time-lapse → dawn back at the kiosk.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { CityGrid, Ground, StreetSet } from "../../slavoski/city";
import { BoxG, CylG, IcoG } from "../../slavoski/detail";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Bush, Clouds, LeafyTree, LightningBolt, Rain } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { handPosition, headPosition, Hero, mergePose, reach, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { FacetedEarth } from "../../slavoski/space";
import { lerpCam, Stage, type CameraSpec, type Mood } from "../../slavoski/Stage";
import { type CuedShot } from "../../slavoski/timeline";
import { Balance, CoinFlow, CoinPile, HillRing, House, Stall, Strut } from "../no-work-2036/props";
import { FutureCity, FutureSkyline } from "../no-work-2036/future";
import { Pinned } from "../smart-animals/props";
import {
  Beacon,
  CashStreet,
  CITY,
  drawBill,
  drawExchange,
  drawPanel,
  folk,
  Groceries,
  Hourglass,
  Island,
  KID,
  KIOSK,
  KIOSK_AT,
  kioskPad,
  kioskScreen,
  Kitchen,
  LifeBankFront,
  LifeLabel,
  LOSS_RED,
  RICH,
  School,
  Showroom,
  StormCloud,
  TABLE,
  Terrace,
  Vault,
  YearStream,
  type KioskScreen,
} from "./props";
import { CanvasPanel } from "../../slavoski/screens";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const yrs = (n: number) => `${Math.round(n).toLocaleString("en-GB")} YRS`;

/** Kit street ×3.5 so it matches Slavoski (road |x| < 12.25, pavements to 21.35). `day` dims practicals. */
const BigStreet: React.FC<React.ComponentProps<typeof StreetSet> & { day?: boolean; decay?: number }> = ({ day = false, decay = 0, ...props }) => (
  <group scale={CITY}>
    <StreetSet
      {...props}
      lampsOn={day ? false : props.lampsOn}
      modify={(sp, i) => ({ ...(day ? { power: 0.35 } : {}), ...(decay > 0 ? { decay, power: 0.25 } : {}), ...(props.modify?.(sp, i) ?? {}) })}
    />
  </group>
);

const Shot: React.FC<{ children: React.ReactNode; overlay?: React.ReactNode } & Omit<React.ComponentProps<typeof Stage>, "overlay">> = ({ children, overlay, ...stage }) => (
  <AbsoluteFill>
    <Stage {...stage}>{children}</Stage>
    {overlay}
  </AbsoluteFill>
);

const CLOUD = { day: "#F4F6FA", dawn: "#E8B8B0", sunset: "#F7C0A0", storm: "#3E4656", overcast: "#AEB6C2" } as const;
const Sky: React.FC<{ t: number; tint: keyof typeof CLOUD; y?: number; radius?: number; count?: number; seed?: string }> = ({ t, tint, y = 45, radius = 200, count = 16, seed = "sky" }) => (
  <Clouds t={t} color={CLOUD[tint]} y={y} radius={radius} count={count} seed={seed} />
);

/** A white flash overlay for lightning (0..1). */
const Flash: React.FC<{ k: number }> = ({ k }) => (k > 0 ? <AbsoluteFill style={{ background: `rgba(235,240,255,${0.55 * k})`, pointerEvents: "none" }} /> : null);
const flashAt = (lt: number, at: number) => (lt >= at && lt < at + 0.25 ? 1 - (lt - at) / 0.25 : 0);

// ---------------------------------------------------------------- poses

const HERO_ATM: V3 = [1.7, 0, 2.0];
const ATM_YAW = -2.36;
/** Where Slavoski (and the mother) stand to use the kiosk: the pad is ahead and to his right. */
const HERO_PAD: V3 = [KIOSK_AT[0] - 0.75, 0, 2.6];
const PAD_POSE: Pose = (() => {
  const pad = kioskPad(KIOSK_AT);
  const base = mergePose(REST, { headPitch: -0.12 });
  return reach(base, "r", [pad[0] - 0.05, pad[1] + 0.21, pad[2] + 0.02], { position: HERO_PAD, yaw: Math.PI }).pose;
})();
const cheer = (k: number, over: Partial<Pose> = {}): Pose =>
  mergePose(REST, { lShoulder: [0.25, lerp(0.3, 2.4, k)], rShoulder: [0.25, lerp(0.3, 2.4, k)], lElbow: 0.3, rElbow: 0.3, expression: "smile", headPitch: 0.15, ...over });

// ---------------------------------------------------------------- cold open: the hook (grey drizzle)

const drizzle = (t: number, center: V3, size: [number, number, number] = [16, 14, 12], thickness = 0.018, opacity = 0.4) => (
  <Rain center={center} size={size} t={t} count={420} thickness={thickness} opacity={opacity} speed={18} />
);

/** 0 s: the ATM screen, £10.00, LOW BALANCE. */
const coldAtm: ShotFn = (c) => {
  const cam = move({ position: [0.4, 3.75, 3.6], target: [0, 3.8, 0.4] }, { position: [0.3, 3.78, 3.1], target: [0, 3.8, 0.4] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[30, 160]} shadowSize={20} light={0.85}>
      <CashStreet t={c.t} kioskOn={0} atmFlicker={c.lt > 0.3 && c.lt < 0.36 ? 1 : 0} />
      {drizzle(c.t, [0, 4, 1.4], [4, 6, 1.4], 0.008, 0.3)}
    </Shot>
  );
};

/** Slavoski at the ATM in the drizzle, head down. */
const coldSlump: ShotFn = (c) => {
  const cam = move({ position: [-6.2, 4.9, 16.5], target: [0.9, 2.7, 0.9] }, { position: [-5.6, 4.8, 15.2], target: [0.9, 2.7, 0.9] }, c);
  const pose = mergePose(REST, { expression: "worried", headPitch: lerp(-0.05, -0.32, k01(c.lt, 0.2, 1.0)), lean: 0.08, lShoulder: [0.08, 0.06], rShoulder: [0.08, 0.06], blink: c.lt > 1.0 && c.lt < 1.1 ? 1 : 0 });
  return (
    <Shot mood="overcast" camera={cam} fog={[30, 170]} shadowSize={24} light={0.85}>
      <CashStreet t={c.t} kioskOn={0} />
      <Sky t={c.t} tint="overcast" seed="cold" y={60} />
      <Hero pose={pose} position={HERO_ATM} yaw={ATM_YAW} />
      {drizzle(c.t, [-1, 5, 5])}
    </Shot>
  );
};

/** "But there's a new way…": the kiosk beside the ATM flickers on; Slavoski turns to look. */
const coldKiosk: ShotFn = (c) => {
  const cam = move({ position: [-4.6, 5.2, 13.0], target: [4.0, 3.0, 1.0] }, { position: [-4.0, 5.1, 12.0], target: [4.4, 3.1, 1.0] }, c);
  const on = c.lt < 0.15 ? 0 : c.lt < 0.22 ? 1 : c.lt < 0.28 ? 0 : 1;
  const turn = k01(c.lt, 0.35, 0.9);
  const pose = mergePose(REST, { expression: turn > 0.5 ? "awe" : "worried", headYaw: -0.5 * turn, headPitch: 0.05 });
  return (
    <Shot mood="overcast" camera={cam} fog={[30, 170]} shadowSize={24} light={0.8}>
      <CashStreet t={c.t} kioskOn={on} kiosk={{ mode: "idle", t: c.t }} />
      <Sky t={c.t} tint="overcast" seed="cold" y={60} />
      <Hero pose={pose} position={HERO_ATM} yaw={lerp(ATM_YAW, -3.2, turn)} />
      {drizzle(c.t, [0, 5, 5])}
    </Shot>
  );
};

/** The kiosk screen up close: SELL 5 YEARS OF YOUR LIFE, the amount starting to count. */
const kioskCU = (c: ShotCtx, screen: KioskScreen, from: CameraSpec, to: CameraSpec, mood: Mood = "overcast", rain = true) => {
  const cam = move(from, to, c);
  return (
    <Shot mood={mood} camera={cam} fog={[30, 170]} shadowSize={20} light={0.8}>
      <CashStreet t={c.t} kioskOn={1} kiosk={screen} />
      {rain ? drizzle(c.t, add(kioskScreen(KIOSK_AT), [0, 0, 1.2]), [4, 5, 1.4], 0.007, 0.28) : null}
    </Shot>
  );
};
const SCR = kioskScreen(KIOSK_AT);
const coldOffer: ShotFn = (c) =>
  kioskCU(
    c,
    { mode: "offer", years: 5, amount: 500000, k: -1, t: c.t },
    { position: [SCR[0] - 0.6, SCR[1] + 0.1, SCR[2] + 5.2], target: [SCR[0], SCR[1] - 0.1, SCR[2]] },
    { position: [SCR[0] - 0.4, SCR[1] + 0.05, SCR[2] + 4.6], target: [SCR[0], SCR[1] - 0.1, SCR[2]] },
  );
const coldAmount: ShotFn = (c) =>
  kioskCU(
    c,
    { mode: "offer", years: 5, amount: 500000, k: k01(c.lt, 0.1, 1.45), t: c.t },
    { position: [SCR[0] + 0.6, SCR[1] - 0.45, SCR[2] + 3.6], target: [SCR[0], SCR[1] - 0.1, SCR[2]] },
    { position: [SCR[0] + 0.45, SCR[1] - 0.35, SCR[2] + 3.0], target: [SCR[0], SCR[1] - 0.12, SCR[2]] },
  );

/** "Would you do it?": his face in the blue glow of the screen. */
const FACE_POS: V3 = [KIOSK_AT[0] - 0.3, 0, 6.3];
const coldFace: ShotFn = (c) => {
  const head = headPosition(REST, FACE_POS, 3.06);
  // from the kiosk screen's point of view, looking back at him
  const cam = move(
    { position: [SCR[0] - 0.3, SCR[1] - 0.15, SCR[2] + 0.4], target: [head[0], head[1] - 0.55, head[2]], fov: 52 },
    { position: [SCR[0] - 0.25, SCR[1] - 0.15, SCR[2] + 0.75], target: [head[0], head[1] - 0.5, head[2]], fov: 50 },
    c,
  );
  const pose = mergePose(REST, { expression: "awe", headPitch: 0.06, headRoll: lerp(0, 0.1, k01(c.lt, 0.3, 0.9)), blink: c.lt > 0.7 && c.lt < 0.78 ? 1 : 0 });
  return (
    <Shot mood="overcast" camera={cam} fog={[30, 170]} shadowSize={14} light={0.75}>
      <CashStreet t={c.t} kioskOn={1} kiosk={{ mode: "offer", years: 5, amount: 500000, k: 1, t: c.t }} />
      <Hero pose={pose} position={FACE_POS} yaw={3.06} />
      <pointLight position={[SCR[0], SCR[1], SCR[2] + 1.2]} color="#9FD8FF" intensity={10} distance={8} decay={2} />
      {drizzle(c.t, add(head, [0, 0.5, 1.6]), [4, 5, 3], 0.012, 0.35)}
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 time is money (bright midday)

/** His palm on the scan pad: a hologram hourglass rises with his lifespan. */
const c1Scan: ShotFn = (c) => {
  const cam = move({ position: [13.5, 5.2, 13], target: [5.9, 2.9, 1.8] }, { position: [12.6, 5.0, 11.8], target: [5.9, 2.9, 1.8] }, c);
  const rise = k01(c.lt, 0.15, 0.9);
  const holo: V3 = [KIOSK_AT[0] + 2.3, 2.2 + rise * 1.1, KIOSK_AT[2] + 1.6];
  const label = add(holo, [-0.6, 2.2, 0]);
  return (
    <Shot
      mood="day"
      camera={cam}
      fog={[60, 300]}
      shadowSize={24}
      overlay={
        rise > 0.3 ? (
          <Pinned at={label} cam={cam} width={c.width} height={c.height} scale={0.9}>
            <LifeLabel caption="YOUR LIFESPAN" value="52 YEARS LEFT" />
          </Pinned>
        ) : null
      }
    >
      <CashStreet t={c.t} kioskOn={1} kiosk={{ mode: "idle", t: c.t }} power={0.3} puddleSky="#9CC4EA" padGlow={1} />
      <Sky t={c.t} tint="day" seed="noon" y={55} />
      <Hero pose={mergePose(PAD_POSE, { expression: "awe", headYaw: -0.45 * rise })} position={HERO_PAD} yaw={Math.PI} />
      <group position={holo} rotation={[0, c.t * 1.2, 0]}>
        <Hourglass scale={1.4 * rise + 0.01} fill={0.62} position={[0, -0.7 * rise, 0]} halo={0.6 * rise} />
      </group>
      <mesh position={[holo[0], holo[1] - 0.9, holo[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.62, 24]} />
        <Glow color="#7CFFB8" opacity={0.6 * rise} additive />
      </mesh>
    </Shot>
  );
};

/** "…the most valuable currency on Earth": a giant exchange board; 1 YEAR OF LIFE climbs to the top. */
const c1Board: ShotFn = (c) => {
  const cam = move({ position: [1.0, 5.2, 16], target: [0, 10.6, -22] }, { position: [0.6, 5.6, 13], target: [0, 10.8, -22] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[70, 360]} shadowSize={40}>
      <BigStreet seed="square" day lamps={false} cars={false} />
      <Sky t={c.t} tint="day" seed="sq" y={60} />
      {[-6.8, 6.8].map((x) => (
        <mesh key={x} position={[x, 9.5, -22]} castShadow>
          <BoxG args={[0.9, 19, 0.9]} />
          <Flat color="#2A2D3A" />
        </mesh>
      ))}
      <mesh position={[0, 11.5, -22.4]}>
        <BoxG args={[12.8, 16.4, 0.6]} />
        <Flat color="#1A1C26" />
      </mesh>
      <CanvasPanel position={[0, 11.5, -22.05]} w={12} h={15.6} px={900} draw={drawExchange(k01(c.lt, 0.45, 1.05), c.t)} />
      {Array.from({ length: 12 }, (_, i) => {
        const x = -9 + (i % 6) * 3.5 + (random(`bx${i}`) - 0.5);
        const z = -6 + Math.floor(i / 6) * 4 + (random(`bz${i}`) - 0.5) * 1.5;
        return <Hero key={i} look={folk(i + 30)} pose={mergePose(REST, { headPitch: 0.35, headYaw: (random(`by${i}`) - 0.5) * 0.4 })} position={[x, 0, z]} yaw={Math.PI + (random(`bw${i}`) - 0.5) * 0.3} />;
      })}
    </Shot>
  );
};

/** Aerial: LIFEBANK beams switch on all over the city. */
const BEAMS: [number, number][] = [
  [-14, -14],
  [14, 0],
  [0, -28],
  [-28, 14],
  [28, -28],
  [14, 28],
  [-28, -42],
  [42, 14],
];
const c1City: ShotFn = (c) => {
  const cam = move({ position: [46, 58, 74], target: [0, 0, -6] }, { position: [36, 56, 70], target: [0, 0, -8] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[90, 420]} shadowSize={80}>
      <CityGrid seed="lb" blocks={8} block={14} />
      <Sky t={c.t} tint="day" seed="air" y={50} radius={240} />
      {BEAMS.map(([x, z], i) => (
        <Beacon key={i} position={[x, 0, z]} h={70} r={1.6} k={k01(c.lt, i * 0.09, i * 0.09 + 0.35)} />
      ))}
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 the first sales (sunny day)

/** A long queue outside a LIFEBANK branch, shot along the queue so it recedes. */
const QUEUE = Array.from({ length: 14 }, (_, i) => ({ x: 17.4 + (random(`qx${i}`) - 0.5) * 0.8, z: -6 + i * 2.35, seed: i + 50 }));
const c2Queue: ShotFn = (c) => {
  const cam = move({ position: [-1, 15, 33], target: [17.5, 2.5, -1] }, { position: [0, 14, 30], target: [17.5, 2.5, -3] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[70, 380]} shadowSize={50}>
      <BigStreet seed="queue" day lamps={false} modify={(s) => (s.position[0] > 0 && s.position[2] > -8 && s.position[2] < 3 ? { sink: 1 } : {})} />
      <Sky t={c.t} tint="day" seed="q" y={55} />
      <LifeBankFront x={21.6} z={-10} t={c.t} />
      {QUEUE.map((q, i) => (
        <Hero
          key={i}
          look={folk(q.seed)}
          pose={mergePose(REST, { headYaw: Math.sin(c.t * 0.8 + i) * 0.2, headPitch: -0.05, lShoulder: [0.05, 0.1 + 0.05 * Math.sin(i)], rShoulder: [0.05, 0.12] })}
          position={[q.x, 0, q.z]}
          yaw={Math.PI + (random(`qy${i}`) - 0.5) * 0.25}
        />
      ))}
    </Shot>
  );
};

/** "…to buy houses": a family cheering in front of their new house, SOLD sign. */
const c2House: ShotFn = (c) => {
  const cam = move({ position: [4, 4.2, 18], target: [0, 4, -1] }, { position: [3.4, 4.0, 15.5], target: [0, 4, -1] }, c);
  const k = k01(c.lt, 0.05, 0.45);
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={30}>
      <Ground color="#4F8F4A" />
      <mesh position={[0, 0.01, 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 14]} />
        <Flat color="#B8AE98" />
      </mesh>
      <House position={[0, 0, -6]} color="#E8DCC4" roof="#24748F" lit={false} />
      <House position={[-16, 0, -9]} color="#D8C8E0" roof="#C8372D" lit={false} />
      <House position={[16, 0, -9]} color="#E0E8D0" roof="#5A4A78" lit={false} />
      <HillRing radius={150} seed="sub" />
      <LeafyTree position={[-8, 0, -1]} scale={2.2} seed="h1" />
      <LeafyTree position={[9, 0, -2]} scale={2.0} seed="h2" />
      <Sky t={c.t} tint="day" seed="house" y={45} />
      <mesh position={[0.1, 2.5, -0.9]} castShadow>
        <BoxG args={[0.16, 5.0, 0.16]} />
        <Flat color="#E8E4DA" />
      </mesh>
      <CanvasPanel position={[0.1, 5.05, -0.8]} w={1.9} h={0.9} draw={drawPanel("SOLD", "#C8372D", "#FFFFFF", 0.66)} />
      <Hero look={folk(61)} pose={cheer(k)} position={[-1.4, 0, 2.2]} yaw={0.1} />
      <Hero look={folk(62)} pose={cheer(k, { headYaw: -0.2 })} position={[1.6, 0, 2.0]} yaw={-0.1} />
      <Hero look={folk(63)} pose={cheer(k)} position={[0.1, 0, 3.4]} scale={KID} />
    </Shot>
  );
};

/** "…pay off debts": a FINAL NOTICE on the table, stamped PAID. */
const c2Debt: ShotFn = (c) => {
  const cam = move({ position: [0.4, 5.6, 2.9], target: [0, 0, -0.1] }, { position: [0.3, 5.1, 2.6], target: [0, 0, -0.1] }, c);
  const down = c.lt < 0.28 ? k01(c.lt, 0.0, 0.28) : 1 - k01(c.lt, 0.33, 0.48);
  const stampY = lerp(3.4, 0.12, down);
  return (
    <Shot mood="day" camera={cam} fog={false} stars={false} shadowSize={6} shake={c.lt > 0.28 && c.lt < 0.4 ? 0.03 : 0}>
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <BoxG args={[10, 0.2, 7]} />
        <Flat color="#8A5A3A" />
      </mesh>
      <group position={[-0.1, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0.08]}>
        <CanvasPanel position={[0, 0, 0]} w={2.0} h={2.8} px={700} draw={drawBill(k01(c.lt, 0.27, 0.34))} />
      </group>
      <group position={[0.1, stampY, 0.1]}>
        <mesh position={[0, 0, 0]} castShadow>
          <CylG args={[0.34, 0.34, 0.16, 12]} />
          <Flat color="#2E9A5E" />
        </mesh>
        <mesh position={[0, 0.38, 0]} castShadow>
          <CylG args={[0.08, 0.11, 0.6, 8]} />
          <Flat color="#5A3A28" />
        </mesh>
        <mesh position={[0, 0.76, 0]} castShadow>
          <IcoG args={[0.18, 1]} />
          <Flat color="#5A3A28" />
        </mesh>
      </group>
      <mesh position={[1.9, 0.45, -1.2]} castShadow>
        <CylG args={[0.38, 0.32, 0.9, 10]} />
        <Flat color="#F2EEE6" />
      </mesh>
      <mesh position={[-1.8, 0.04, 1.1]} rotation={[0, 0.5, Math.PI / 2]} castShadow>
        <CylG args={[0.05, 0.05, 1.4, 6]} />
        <Flat color="#1D274B" />
      </mesh>
    </Shot>
  );
};

/** "…and escape poverty": a man outside his run-down block jumps for joy under a shower of coins. */
const c2Escape: ShotFn = (c) => {
  const cam = move({ position: [9.5, 4.6, 20], target: [15.5, 4.0, 0] }, { position: [9.8, 4.4, 17.5], target: [15.5, 4.0, 0] }, c);
  const hop = Math.abs(Math.sin(c.lt * 6.5)) * 0.55;
  const hero: V3 = [15.5, hop, 1.5];
  return (
    <Shot mood="day" camera={cam} fog={[60, 320]} shadowSize={30}>
      <BigStreet seed="poor" day decay={0.6} lamps={false} cars={false} />
      <Sky t={c.t} tint="day" seed="esc" y={55} />
      <Hero look={folk(71)} pose={cheer(1, { lKnee: hop * 0.6, rKnee: hop * 0.6, expression: "smile" })} position={hero} yaw={-0.35} />
      <CoinFlow from={[15.5, 16, 1]} to={[15.5, 0.1, 1.5]} t={c.t} count={40} arc={0} spread={4} fromSpread={4} speed={0.7} size={0.32} seed="esc" />
      <Halo position={[15.5, 9, 0]} size={18} color="#FFE9A0" opacity={0.25} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 buying centuries (golden hour)

/** "…wouldn't buy cars": the billionaire walks past a gold supercar on its turntable, waving it off. */
const c3Car: ShotFn = (c) => {
  const cam = move({ position: [1.5, 5.2, 27], target: [0.5, 3.0, 2] }, { position: [1.2, 5.0, 24.5], target: [0.5, 3.0, 2] }, c);
  const z = lerp(7.2, 9.8, c.lt / span(c.dur));
  const wave = k01(c.lt, 0.3, 0.7);
  // walking toward us past the car; the left hand flicks back at it ("no thanks")
  const pose = mergePose(walkPose(c.lt * 1.1, 0.7), { lShoulder: [lerp(0.1, -0.5, wave), lerp(0.1, 0.9, wave)], lElbow: lerp(0.3, 0.9, wave), headYaw: 0.55, headPitch: 0.18, expression: "neutral" });
  return (
    <Shot mood="sunset" camera={cam} fog={false} stars={false} shadowSize={20} keyDir={[-0.4, 0.5, 1]}>
      <Showroom spin={c.t * 0.35} />
      <Hero look={RICH} pose={pose} position={[1.9, 0, z]} yaw={-0.15} />
    </Shot>
  );
};

/** "…and private islands": an island for sale at sunset, nobody bidding. */
const c3Island: ShotFn = (c) => {
  const a = 0.5 + c.lt * 0.06;
  const cam = move({ position: [Math.sin(a) * 72, 34, Math.cos(a) * 72], target: [0, 1, 2] }, { position: [Math.sin(a) * 64, 30, Math.cos(a) * 64], target: [0, 1, 2] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[90, 420]} shadowSize={40}>
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[900, 900]} />
        <Flat color="#3E4A72" />
      </mesh>
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={i} position={[(random(`wx${i}`) - 0.5) * 140 + Math.sin(c.t * 0.4 + i) * 1.5, -0.15, (random(`wz${i}`) - 0.5) * 140]} rotation={[-Math.PI / 2, 0, random(`wr${i}`)]}>
          <planeGeometry args={[3 + random(`ww${i}`) * 4, 0.25]} />
          <Flat color="#C98A7A" />
        </mesh>
      ))}
      <Island t={c.t} />
      <Sky t={c.t} tint="sunset" seed="isle" y={40} radius={220} />
    </Shot>
  );
};

/** "They'd buy centuries of extra life": his vault of hourglasses; he spreads his arms. */
const c3Vault: ShotFn = (c) => {
  const cam = move({ position: [0, 3.0, 17], target: [0, 4.4, -3] }, { position: [0, 3.4, 13.5], target: [0, 4.6, -3] }, c);
  const open = k01(c.lt, 0.2, 1.2);
  const pose = mergePose(REST, { lShoulder: [0.15, lerp(0.15, 1.25, open)], rShoulder: [0.15, lerp(0.15, 1.25, open)], lElbow: 0.25, rElbow: 0.25, headPitch: 0.25, expression: open > 0.5 ? "smile" : "awe" });
  const hero: V3 = [0, 0, 3];
  const years = lerp(80, 860, k01(c.lt, 0.6, 2.2));
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      stars={false}
      shadowSize={20}
      light={0.9}
      overlay={
        <Pinned at={add(headPosition(pose, hero), [0, 1.6, 0])} cam={cam} width={c.width} height={c.height} scale={0.9}>
          <LifeLabel caption="LIFE LEFT" value={yrs(years)} fill={0.9} />
        </Pinned>
      }
    >
      <Vault t={c.t} />
      <Hero look={RICH} pose={pose} position={hero} />
      <pointLight position={[0, 6, 6]} color="#FFD9A0" intensity={40} distance={30} decay={2} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 two classes (sunny towers vs stormy slum)

/** Aerial: the city split by a wall: gleaming towers in the sun on the left, a dark slum in the rain on the right. */
const c4Split: ShotFn = (c) => {
  const cam = move({ position: [0, 150, 70], target: [0, 0, -18] }, { position: [0, 140, 64], target: [0, 0, -20] }, c);
  const fl = flashAt(c.lt, 1.5);
  return (
    <Shot
      mood="day"
      camera={cam}
      fog={[110, 420]}
      shadowSize={90}
      overlay={
        <>
          <Pinned at={[-14, 30, -2]} cam={cam} width={c.width} height={c.height}>
            <div style={{ fontFamily: "'Slavoski Sans', 'DejaVu Sans', sans-serif", fontWeight: 700, fontSize: 46, letterSpacing: "0.2em", color: P.amber, textShadow: "0 3px 12px rgba(0,0,0,0.6)" }}>RICH</div>
          </Pinned>
          <Pinned at={[14, 30, -2]} cam={cam} width={c.width} height={c.height}>
            <div style={{ fontFamily: "'Slavoski Sans', 'DejaVu Sans', sans-serif", fontWeight: 700, fontSize: 46, letterSpacing: "0.2em", color: "#B8C0CC", textShadow: "0 3px 12px rgba(0,0,0,0.6)" }}>POOR</div>
          </Pinned>
          <Flash k={fl * 0.6} />
        </>
      }
    >
      <FutureCity seed="rich" blocks={6} block={18} style="bright" t={c.t} skip={(bx, bz) => bx >= 3 || bz >= 5} drones={14} monorail={false} />
      <mesh position={[62, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[122, 400]} />
        <Flat color="#2A2622" />
      </mesh>
      <group scale={1.8}>
        <CityGrid seed="slum" blocks={6} block={10} skip={(bx) => bx < 3} modify={() => ({ decay: 0.35, power: 0.15 })} />
      </group>
      {/* the wall */}
      <mesh position={[0, 4, 0]} castShadow receiveShadow>
        <BoxG args={[1.6, 8, 400]} />
        <Flat color="#8A8E98" />
      </mesh>
      <mesh position={[-0.81, 6.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[400, 0.4]} />
        <Glow color={P.amber} />
      </mesh>
      <Sky t={c.t} tint="day" seed="split" y={60} radius={260} count={8} />
      <StormCloud position={[34, 42, -14]} scale={1.3} seed="sc1" />
      <StormCloud position={[40, 46, -60]} scale={1.5} seed="sc2" />
      <Rain center={[32, 22, -8]} size={[52, 44, 70]} t={c.t} count={1400} thickness={0.12} opacity={0.35} speed={30} />
      <LightningBolt top={[30, 40, -26]} bottom={[27, 0, -20]} flash={fl} seed="lb1" />
    </Shot>
  );
};

/** "The rich, who could live for thousands of years": the billionaire on his sky terrace, drink in hand. */
const c4Rich: ShotFn = (c) => {
  const cam = move({ position: [-2.6, 5.6, -6.6], target: [0, 3.0, 4.5], fov: 50 }, { position: [-2.2, 5.4, -5.8], target: [0, 3.0, 4.5], fov: 48 }, c);
  const hero: V3 = [0, 0, 4.6];
  const YAW = Math.PI - 0.3;
  const pose = mergePose(REST, { rShoulder: [0.6, 0.15], rElbow: 1.25, expression: "smile", headPitch: 0.1, headYaw: -0.15, lShoulder: [0.05, 0.15] });
  const hand = handPosition(pose, "r", hero, YAW);
  const years = lerp(900, 3000, k01(c.lt, 1.3, 2.4));
  return (
    <Shot
      mood="day"
      camera={cam}
      fog={[80, 420]}
      shadowSize={20}
      overlay={
        <Pinned at={add(headPosition(pose, hero, YAW), [0, 1.55, 0])} cam={cam} width={c.width} height={c.height} scale={0.9}>
          <LifeLabel caption="AGE 412  ·  LIFE LEFT" value={yrs(years)} fill={0.95} />
        </Pinned>
      }
    >
      <Terrace />
      <FutureSkyline t={c.t} y={-70} radius={150} count={24} arc={[-Math.PI * 0.4, Math.PI * 0.4]} />
      <Clouds t={c.t} y={-12} radius={120} count={14} color="#F4F6FA" seed="terr" />
      <Hero look={RICH} pose={pose} position={hero} yaw={YAW} />
      <mesh position={[hand[0], hand[1] + 0.32, hand[2]]} castShadow>
        <CylG args={[0.13, 0.1, 0.42, 8]} />
        <Flat color="#F4D9A0" opacity={0.85} />
      </mesh>
    </Shot>
  );
};

/** "And the poor, who might never reach 40": a man hunched in the rain in the slum. */
const c4Poor: ShotFn = (c) => {
  const cam = move({ position: [11, 4.6, 17], target: [15.8, 3.0, 2.5] }, { position: [11.5, 4.4, 14.8], target: [15.8, 3.0, 2.5] }, c);
  const hero: V3 = [16, 0, 3];
  const pose = mergePose(REST, { lean: 0.26, headPitch: -0.32, lShoulder: [0.3, 0.05], rShoulder: [0.3, 0.05], lElbow: 0.7, rElbow: 0.7, expression: "worried", blink: c.lt > 1.4 && c.lt < 1.5 ? 1 : 0 });
  const fl = flashAt(c.lt, 1.9);
  return (
    <Shot
      mood="storm"
      camera={cam}
      fog={[20, 140]}
      shadowSize={24}
      light={0.85 + fl}
      overlay={
        <>
          <Pinned at={add(headPosition(pose, hero, -0.4), [0, 1.55, 0])} cam={cam} width={c.width} height={c.height} scale={0.9}>
            <LifeLabel caption="AGE 36  ·  LIFE LEFT" value={yrs(lerp(4, 3, k01(c.lt, 1.6, 2.2)))} color={LOSS_RED} fill={0.06} />
          </Pinned>
          <Flash k={fl * 0.5} />
        </>
      }
    >
      <BigStreet seed="slumst" decay={0.6} lamps={false} cars={false} />
      <pointLight position={[13, 6.5, 9]} color="#B0C4E0" intensity={45} distance={18} decay={2} />
      <Sky t={c.t} tint="storm" seed="st" y={50} />
      <Hero look={folk(77)} pose={pose} position={hero} yaw={-0.4} />
      <Rain center={[14, 6, 9]} size={[16, 14, 16]} t={c.t} count={900} thickness={0.03} opacity={0.5} speed={26} />
      <LightningBolt top={[-10, 70, -120]} bottom={[-6, 0, -110]} flash={fl} seed="lb2" />
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 the year market (night)

const STALLS: { z: number; name: string }[] = [
  { z: 2, name: "CASH FOR YEARS" },
  { z: -9, name: "WE BUY DECADES" },
  { z: -20, name: "YEARS FOR FOOD" },
];
/** "People would sacrifice decades": a night market of stalls buying years, hourglasses on the counters. */
const c5Market: ShotFn = (c) => {
  const cam = move({ position: [1.5, 8.2, 16], target: [15, 4.6, -3] }, { position: [2.2, 7.8, 14], target: [15, 4.6, -4] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[40, 220]} shadowSize={40}>
      <BigStreet seed="market" lampsOn cars={false} />
      {STALLS.map((s, i) => (
        <React.Fragment key={i}>
          <Stall position={[15.6, 0, s.z]} yaw={-Math.PI / 2} name={s.name} />
          {[-1.6, 0, 1.6].map((dz) => (
            <Hourglass key={dz} position={[14.3, 2.12, s.z + dz]} scale={0.75} fill={0.3 + 0.5 * random(`m${i}${dz}`)} halo={0.4} />
          ))}
          {i > 0 ? (
            <>
              <Hero look={folk(80 + i)} pose={mergePose(REST, { lean: 0.12, headPitch: -0.15, rShoulder: [0.7, 0.1], rElbow: 0.6, expression: "worried" })} position={[11.6, 0, s.z + 0.8]} yaw={Math.PI / 2} />
              <Hero look={folk(90 + i)} pose={mergePose(REST, { headPitch: -0.05, expression: "neutral" })} position={[10.4, 0, s.z - 2.2]} yaw={Math.PI / 2 + 0.3} />
            </>
          ) : (
            <Hero look={folk(80)} pose={mergePose(REST, { lean: 0.12, headPitch: -0.15, rShoulder: [0.7, 0.1], rElbow: 0.6, expression: "worried" })} position={[12.0, 0, s.z - 1.2]} yaw={Math.PI / 2} />
          )}
        </React.Fragment>
      ))}
    </Shot>
  );
};

/** "…just to feed their families": dad brings home groceries; the kids cheer. He sold twenty years. */
const DAD: V3 = [-3.45, 0, 0.2];
const DAD_POSE: Pose = (() => {
  const base = mergePose(REST, { headYaw: -0.75, headPitch: -0.05, expression: "smile", lean: 0.05 });
  const r = reach(base, "r", [-2.25, TABLE.top + 0.21, 0.75], { position: DAD, yaw: Math.PI / 2 }).pose;
  return reach(r, "l", [-2.25, TABLE.top + 0.21, -0.35], { position: DAD, yaw: Math.PI / 2 }).pose;
})();
const c5Feed: ShotFn = (c) => {
  const cam = move({ position: [-2.4, 4.9, 15.5], target: [-1.3, 2.7, 0] }, { position: [-2.3, 4.7, 13.8], target: [-1.3, 2.7, 0] }, c);
  const k = k01(c.lt, 0.15, 0.6);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      stars={false}
      shadowSize={14}
      light={0.85}
      overlay={
        <Pinned at={add(headPosition(DAD_POSE, DAD, Math.PI / 2), [0, 1.55, 0])} cam={cam} width={c.width} height={c.height} scale={0.85}>
          <LifeLabel caption="SOLD" value="20 YEARS" color={LOSS_RED} fill={0.2} />
        </Pinned>
      }
    >
      <Kitchen />
      <Groceries position={[-0.9, TABLE.top, 0.1]} />
      <Hero look={folk(101)} pose={DAD_POSE} position={DAD} yaw={Math.PI / 2} />
      <Hero look={folk(102)} pose={cheer(k)} position={[0.5, 0, -1.95]} scale={KID} />
      <Hero look={folk(103)} pose={cheer(k, { headYaw: 0.3 })} position={[2.2, 0, -1.95]} scale={KID} yaw={-0.2} />
    </Shot>
  );
};

/** "Parents would sell their years…": a mother at the kiosk at night, her years streaming into it; her child beside her. */
const KIDPOS: V3 = [HERO_PAD[0] - 1.3, 0, HERO_PAD[2] + 1.1];
const c5Parent: ShotFn = (c) => {
  const cam = move({ position: [14.5, 5.4, 13.5], target: [5.6, 2.7, 2.0] }, { position: [13.6, 5.2, 12.4], target: [5.6, 2.7, 2.0] }, c);
  const k = k01(c.lt, 0.2, 2.0);
  const head = headPosition(PAD_POSE, HERO_PAD, Math.PI);
  const labelAt = add(head, [0, 1.6, 0]);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={[40, 220]}
      shadowSize={20}
      overlay={
        <Pinned at={labelAt} cam={cam} width={c.width} height={c.height} scale={0.85}>
          <LifeLabel caption="LIFE LEFT" value={yrs(lerp(46, 26, k))} color={k > 0.5 ? LOSS_RED : undefined} fill={lerp(0.6, 0.3, k)} />
        </Pinned>
      }
    >
      <CashStreet t={c.t} kioskOn={1} kiosk={{ mode: "transfer", years: 20, k, t: c.t, to: k > 0.9 ? "SCHOOL FUND  £2,000,000" : "PROCESSING…" }} power={1} puddleSky="#2A3560" padGlow={1} />
      <Hero look={folk(111)} pose={mergePose(PAD_POSE, { expression: "worried", headYaw: 0.3 })} position={HERO_PAD} yaw={Math.PI} />
      <Hero look={folk(112)} pose={mergePose(REST, { headPitch: 0.45, headYaw: -0.3, expression: "neutral" })} position={KIDPOS} yaw={2.2} scale={KID} />
      <YearStream from={add(head, [0, 0.9, 0])} to={add(SCR, [0, 0.2, 0.05])} t={c.t} count={30} arc={0.6} />
    </Shot>
  );
};

/** "…a better future": next morning the child walks into school. */
const c5School: ShotFn = (c) => {
  const cam = move({ position: [1.8, 2.4, 9], target: [0, 3.2, -16] }, { position: [1.5, 2.3, 7.5], target: [0, 3.4, -16] }, c);
  const z = lerp(0.5, -2.4, c.lt / span(c.dur));
  const kid: V3 = [0, 0, z];
  const pose = walkPose(c.lt * 1.6, 0.8);
  return (
    <Shot mood="dawn" camera={cam} fog={[40, 300]} shadowSize={30} light={0.9}>
      <Ground color="#5E8A4C" />
      <mesh position={[0, 0.01, -8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 30]} />
        <Flat color="#B8AE98" />
      </mesh>
      <School position={[0, 0, -24]} />
      <HillRing radius={160} seed="school" />
      <LeafyTree position={[-7, 0, -8]} scale={2.3} seed="s1" />
      <LeafyTree position={[8, 0, -12]} scale={2.1} seed="s2" />
      <Bush position={[-3.5, 0, -2]} size={1.2} seed="sb1" />
      <Bush position={[3.6, 0, -5]} size={1.1} seed="sb2" />
      <Sky t={c.t} tint="dawn" seed="sch" y={40} />
      <Hero look={folk(112)} pose={pose} position={kid} yaw={Math.PI} scale={KID} />
      <mesh position={[kid[0], KID * (1.55 + 0.62) + pose.bob * KID, z + KID * 0.36 + 0.19]} castShadow>
        <BoxG args={[0.72, 0.82, 0.36]} />
        <Flat color="#24748F" />
      </mesh>
      <Halo position={[-30, 18, -120]} size={40} color="#FFD9A0" opacity={0.5} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 06 how long you live (sunset → space → time-lapse)

/** "Money wouldn't just determine how well you live": a giant balance, coins against an hourglass. */
const c6Balance: ShotFn = (c) => {
  const cam = move({ position: [6, 6, 40], target: [1, 6.2, 0] }, { position: [5.2, 5.8, 36], target: [1, 6.2, 0] }, c);
  const tilt = lerp(0, -0.2, k01(c.lt, 0.3, 1.6));
  return (
    <Shot mood="sunset" camera={cam} fog={[60, 300]} shadowSize={30}>
      <Ground color="#C9B89A" />
      <mesh position={[0, 0.2, -2]} receiveShadow>
        <CylG args={[7, 7.4, 0.4, 20]} />
        <Flat color="#E8E4DA" />
      </mesh>
      <group position={[0, 0.4, -2]}>
        <Balance tilt={tilt} left={<CoinPile position={[0, 0, 0]} r={1.8} h={1.4} />} right={<Hourglass scale={2.6} fill={0.6} position={[0, 0, 0]} halo={0.5} />} />
      </group>
      <Hero pose={mergePose(REST, { headPitch: 0.5, expression: "awe", headYaw: -0.2 })} position={[7, 0, 4]} yaw={-0.75} />
      <HillRing radius={170} seed="bal" color="#6A5A6A" />
      <Sky t={c.t} tint="sunset" seed="bal" y={40} />
      <Halo position={[-40, 12, -150]} size={50} color="#FFB070" opacity={0.6} />
    </Shot>
  );
};

/** "It would determine how long you live": a towering hourglass full of years beside a tiny, nearly empty one. */
const c6Glasses: ShotFn = (c) => {
  const cam = move({ position: [0.8, 4.4, 24], target: [0, 4.4, 0] }, { position: [0.6, 4.4, 21], target: [0, 4.5, 0] }, c);
  const big: V3 = [-1.9, 0.4, -3];
  const small: V3 = [2.0, 0.4, 3.2];
  return (
    <Shot
      mood="sunset"
      camera={cam}
      fog={[50, 260]}
      shadowSize={20}
      light={0.9}
      overlay={
        <>
          <Pinned at={add(big, [0, 8.4, 0])} cam={cam} width={c.width} height={c.height} scale={0.85}>
            <LifeLabel caption="RICH" value="3,000 YRS" fill={0.9} />
          </Pinned>
          <Pinned at={add(small, [0, 3.0, 0])} cam={cam} width={c.width} height={c.height} scale={0.75}>
            <LifeLabel caption="POOR" value="2 YRS" color={LOSS_RED} fill={0.04} />
          </Pinned>
        </>
      }
    >
      <Ground color="#4A3E48" />
      <mesh position={[0, 0.2, -1]} receiveShadow>
        <CylG args={[9, 9.4, 0.4, 20]} />
        <Flat color="#6A5A6A" />
      </mesh>
      <Hourglass position={big} scale={7} fill={lerp(0.9, 0.88, c.lt / 3)} halo={0.4} />
      <Hourglass position={small} scale={2} fill={lerp(0.06, 0.0, k01(c.lt, 0, 2.2))} frame="#8A8E98" />
      <HillRing radius={170} seed="gl" color="#3A3048" />
      <Sky t={c.t} tint="sunset" seed="gl" y={40} />
    </Shot>
  );
};

/** "The rich wouldn't just own the world": the billionaire standing on top of the Earth. */
const c6World: ShotFn = (c) => {
  const a = -0.25 + c.lt * 0.1;
  const cam = move({ position: [Math.sin(a) * 15, 1.4, Math.cos(a) * 15], target: [0, 2.2, 0] }, { position: [Math.sin(a) * 12.5, 1.6, Math.cos(a) * 12.5], target: [0, 2.3, 0] }, c);
  const pose = mergePose(REST, { lShoulder: [0.1, 1.15], rShoulder: [0.1, 1.15], lElbow: 0.2, rElbow: 0.2, headPitch: 0.2, expression: "smile" });
  return (
    <Shot mood="space" camera={cam} fog={false} shadowSize={10} keyDir={[-0.6, 0.6, 0.8]}>
      <FacetedEarth radius={7} position={[0, -7, 0]} rotation={[1.1, c.t * 0.05, 0]} />
      <Hero look={RICH} pose={pose} position={[0, -0.04, 0]} />
      <mesh position={[-60, 30, -140]}>
        <circleGeometry args={[5, 14]} />
        <Glow color="#FFF4E0" fog={false} />
      </mesh>
      <Halo position={[-60, 30, -139]} size={46} color="#FFE9C0" opacity={0.55} />
    </Shot>
  );
};

/** "They'd outlive everyone in it": a time-lapse in the park; people come and go around him, he stays. */
const MOODS: Mood[] = ["day", "sunset", "night", "dawn"];
const PARK_FOLK: { p: V3; yaw: number; a: number; v: number; seed: number }[] = Array.from({ length: 9 }, (_, i) => {
  // only beside and behind him (the camera sits around angle 0.55), so nobody blocks him
  const ang = 0.55 + Math.PI / 2 + (i / 8) * Math.PI;
  const r = 4.4 + (i % 3) * 1.7;
  const a = (i % 3) * 0.55 + random(`pa${i}`) * 0.2;
  return { p: [Math.sin(ang) * r, 0, Math.cos(ang) * r - 1], yaw: ang + Math.PI + (random(`py${i}`) - 0.5), a, v: a + 0.75 + random(`pv${i}`) * 0.3, seed: 120 + i };
});
const c6Outlive: ShotFn = (c) => {
  const lt = c.lt;
  const mood = MOODS[Math.floor(lt / 0.28) % 4];
  const ang = 0.4 + lt * 0.12;
  const cam = move({ position: [Math.sin(ang) * 18, 5.5, Math.cos(ang) * 18], target: [0, 3, 0] }, { position: [Math.sin(ang) * 15, 5.2, Math.cos(ang) * 15], target: [0, 3.1, 0] }, c);
  const pose = mergePose(REST, { expression: "neutral", headYaw: Math.sin(lt * 1.5) * 0.3 });
  const age = lerp(412, 1240, k01(lt, 0, 2.4));
  return (
    <Shot
      mood={mood}
      camera={cam}
      fog={[40, 260]}
      shadowSize={24}
      overlay={
        <Pinned at={add(headPosition(pose, [0, 0, 0]), [0, 1.55, 0])} cam={cam} width={c.width} height={c.height} scale={0.85}>
          <LifeLabel caption="HIS AGE" value={`${Math.round(age).toLocaleString("en-GB")}`} fill={0.9} />
        </Pinned>
      }
    >
      <Ground color="#4F8F4A" />
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[9, 11, 32]} />
        <Flat color="#B8AE98" />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return <LeafyTree key={i} position={[Math.sin(a) * 14, 0, Math.cos(a) * 14]} scale={2.2} seed={`pk${i}`} growth={clamp01(0.4 + lt * 0.25 + (i % 2) * 0.2)} />;
      })}
      <HillRing radius={150} seed="park" />
      <FutureSkyline t={c.t} radius={120} count={14} scale={0.8} />
      <Hero look={RICH} pose={pose} position={[0, 0, 0]} />
      {PARK_FOLK.map((f, i) => {
        const gen = Math.floor(lt / 1.2);
        const local = lt - gen * 1.2;
        const appear = k01(local, f.a - 0.15, f.a);
        const gone = k01(local, f.v, f.v + 0.3);
        if (local < f.a - 0.15 || gone >= 1) return null;
        const vanish = appear < 1 ? (1 - appear) * 0.9 : gone;
        return <Hero key={i} look={folk(f.seed + gen * 17)} pose={mergePose(walkPose(lt * 1.4 + i * 0.3, 0.5), { headYaw: 0 })} position={f.p} yaw={f.yaw} vanish={vanish} />;
      })}
    </Shot>
  );
};

// ---------------------------------------------------------------- 07 your offer (dawn, back at the kiosk)

const endStreet = (c: ShotCtx, screen: KioskScreen, children?: React.ReactNode) => (
  <>
    <CashStreet t={c.t} kioskOn={1} kiosk={screen} power={0.4} puddleSky="#E8B0A0" />
    <Sky t={c.t} tint="dawn" seed="end" y={55} />
    {children}
  </>
);

/** Back at the kiosk at dawn: the new offer, ten years for £1,000,000. */
const endOffer: ShotFn = (c) => {
  const cam = move({ position: [15.5, 6.0, 17], target: [5.0, 2.9, 1.8] }, { position: [14.6, 5.8, 15.8], target: [5.0, 3.0, 1.8] }, c);
  const pose = mergePose(REST, { expression: "awe", headPitch: 0.02, headYaw: 0.05 });
  return (
    <Shot mood="dawn" camera={cam} fog={[40, 260]} shadowSize={24} light={0.9}>
      {endStreet(c, { mode: "offer", years: 10, amount: 1000000, k: k01(c.lt, 0.25, 1.4), t: c.t }, <Hero pose={pose} position={HERO_PAD} yaw={Math.PI} />)}
    </Shot>
  );
};

/** ACCEPT / DECLINE: his fist drifts toward ACCEPT… and stops. */
const endButtons: ShotFn = (c) => {
  const cam = move({ position: [SCR[0] + 0.35, SCR[1] - 0.05, SCR[2] + 4.0], target: [SCR[0], SCR[1] - 0.05, SCR[2]] }, { position: [SCR[0] + 0.25, SCR[1] - 0.1, SCR[2] + 3.5], target: [SCR[0] - 0.05, SCR[1] - 0.1, SCR[2]] }, c);
  const accept: V3 = [SCR[0] + (0.27 - 0.5) * KIOSK.screenW, SCR[1] + (0.5 - 0.815) * KIOSK.screenH, SCR[2]];
  const reachK = k01(c.lt, 0.2, 1.7);
  const stop: V3 = [accept[0] + 0.3, accept[1] - 0.36, SCR[2] + 0.4];
  const start: V3 = [SCR[0] + 0.9, SCR[1] - 1.3, SCR[2] + 0.75];
  const tremble = c.lt > 1.7 ? Math.sin(c.lt * 23) * 0.012 : 0;
  const fist: V3 = [lerp(start[0], stop[0], reachK) + tremble, lerp(start[1], stop[1], reachK), lerp(start[2], stop[2], reachK)];
  const elbow: V3 = add(fist, [0.42, -0.55, 0.35]);
  return (
    <Shot mood="dawn" camera={cam} fog={[40, 260]} shadowSize={10} light={0.85}>
      {endStreet(c, { mode: "offer", years: 10, amount: 1000000, k: 1, t: c.t, buttons: true, hover: k01(c.lt, 1.3, 1.7) })}
      <mesh position={fist} castShadow>
        <IcoG args={[0.22, 1]} />
        <Flat color={P.skin} />
      </mesh>
      <Strut a={add(fist, [0.09, -0.12, 0.08])} b={elbow} w={0.34} color={P.jacket} />
    </Shot>
  );
};

/** "…would you accept?": Slavoski turns from the screen and looks right at us. */
const endAsk: ShotFn = (c) => {
  const head = headPosition(REST, HERO_PAD, Math.PI);
  const cam = move({ position: [head[0] + 2.6, head[1] + 0.2, head[2] + 4.2], target: [head[0], head[1] - 0.45, head[2]] }, { position: [head[0] + 2.3, head[1] + 0.15, head[2] + 3.7], target: [head[0], head[1] - 0.4, head[2]] }, c);
  const turn = k01(c.lt, 0.1, 0.7);
  const pose = mergePose(REST, { expression: turn > 0.6 ? "worried" : "awe", headYaw: lerp(0, -0.1, turn), headRoll: 0.08 * turn, headPitch: 0.02, blink: c.lt > 1.2 && c.lt < 1.28 ? 1 : 0 });
  return (
    <Shot mood="dawn" camera={cam} fog={[40, 260]} shadowSize={12} light={0.9}>
      {endStreet(c, { mode: "offer", years: 10, amount: 1000000, k: 1, t: c.t, buttons: true, hover: 1 }, <Hero pose={pose} position={HERO_PAD} yaw={lerp(2.1, 0.75, turn)} />)}
    </Shot>
  );
};

// ---------------------------------------------------------------- thumbnail key shot

export const thumbShot = () => {
  const c: ShotCtx = { lt: 1.0, dur: 2, t: 9.0, words: [], width: 1080, height: 1920 };
  // Slavoski facing us, wide-eyed, the kiosk offer (£500,000) glowing over his shoulder
  const hero: V3 = [3.75, 0, 3.6];
  const pose = mergePose(REST, { expression: "awe", headYaw: 0.1, headPitch: 0.04, lShoulder: [0.55, 0.35], lElbow: 0.9 });
  const cam: CameraSpec = { position: [4.5, 3.5, 13.2], target: [4.35, 2.9, 1.5] };
  return (
    <Stage mood="overcast" camera={cam} fog={[30, 170]} shadowSize={14} light={1.0}>
      <CashStreet t={c.t} kioskOn={1} kiosk={{ mode: "offer", years: 5, amount: 500000, k: 1, t: c.t }} />
      <Hero pose={pose} position={hero} yaw={0.12} />
      <pointLight position={[5.2, 3.8, 3.4]} color="#9FD8FF" intensity={14} distance={8} decay={2} />
    </Stage>
  );
};

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldAtm },
    { cue: "left", fn: coldSlump },
    { cue: "but there's", fn: coldKiosk },
    { cue: "Sell five", fn: coldOffer },
    { cue: "for five hundred", fn: coldAmount },
    { cue: "Would you", fn: coldFace },
  ],
  c1: [
    { cue: null, fn: c1Scan },
    { cue: "time would", fn: c1Board },
    { cue: "on Earth", fn: c1City },
  ],
  c2: [
    { cue: null, fn: c2Queue },
    { cue: "to buy houses", fn: c2House },
    { cue: "pay off", fn: c2Debt },
    { cue: "and escape", fn: c2Escape },
  ],
  c3: [
    { cue: null, fn: c3Car },
    { cue: "and private", fn: c3Island },
    { cue: "They'd buy", fn: c3Vault },
  ],
  c4: [
    { cue: null, fn: c4Split },
    { cue: "the rich", fn: c4Rich },
    { cue: "and the poor", fn: c4Poor },
  ],
  c5: [
    { cue: null, fn: c5Market },
    { cue: "just to feed", fn: c5Feed },
    { cue: "Parents would", fn: c5Parent },
    { cue: "a better future", fn: c5School },
  ],
  c6: [
    { cue: null, fn: c6Balance },
    { cue: "It would", fn: c6Glasses },
    { cue: "The rich wouldn't", fn: c6World },
    { cue: "They'd outlive", fn: c6Outlive },
  ],
  end: [
    { cue: null, fn: endOffer },
    { cue: "one million", fn: endButtons },
    { cue: "would you accept", fn: endAsk },
  ],
};

