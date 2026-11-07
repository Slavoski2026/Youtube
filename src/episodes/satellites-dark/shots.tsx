/**
 * Shots for "What If Every Satellite Stopped Working?" (ep. 7).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * The cold open deliberately does not start on Earth: a phone losing GPS, satellites blinking out
 * across the dawn sky, one satellite dying in close-up.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Building, Car, CityGrid, StreetSet, Ground, PowerStation, Plane } from "../../slavoski/city";
import { BoxG, CylG, IcoG } from "../../slavoski/detail";
import { FONT } from "../../slavoski/fonts";
import { crowdLook, suitLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Clouds, LightningBolt, Rain, Snow } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { CardLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import { handPosition, headPosition, Hero, mergePose, reach, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { GamingRoom, SEAT, SEAT_YAW, sittingPose, TV } from "../../slavoski/room";
import { CanvasPanel, ScreenHtml } from "../../slavoski/screens";
import { FacetedEarth } from "../../slavoski/space";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import { type CuedShot } from "../../slavoski/timeline";
import { PalmTree } from "../gta-24h/props";
import { Crane, House, HillRing, Robot, SkyscraperSite } from "../no-work-2036/props";
import { CITY, PHONE, Phone3D } from "../ww3-countdown/props";
import {
  Cabin,
  CellTower,
  CommandRoom,
  ContainerShip,
  drawTicker,
  GantryCrane,
  GroundDish,
  Helmet,
  Lighthouse,
  MapPin,
  MapScreen,
  Mountain,
  NoService,
  NoSignalTV,
  OrbitShell,
  Pylon,
  Quay,
  Satellite,
  Sea,
  SkyTrain,
  SnowGround,
  SnowPine,
  SPACESUIT,
  StormWall,
  Waves,
  drawWeather,
  drawScope,
} from "./props";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
const startFrame = (c: ShotCtx) => Math.round((c.t - c.lt) * 30);

/** Kit street ×3.5 so it matches Slavoski (road |x| < 12.25, pavements to 21.35). `day` dims practicals. */
const BigStreet: React.FC<React.ComponentProps<typeof StreetSet> & { day?: boolean }> = ({ day = false, ...props }) => (
  <group scale={CITY}>
    <StreetSet {...props} lampsOn={day ? false : props.lampsOn} modify={day ? (sp, i) => ({ power: 0.35, ...(props.modify?.(sp, i) ?? {}) }) : props.modify} />
  </group>
);

const Shot: React.FC<{ children: React.ReactNode; overlay?: React.ReactNode } & React.ComponentProps<typeof Stage>> = ({ children, overlay, ...stage }) => (
  <AbsoluteFill>
    <Stage {...stage}>{children}</Stage>
    {overlay}
  </AbsoluteFill>
);

const CLOUD = { day: "#F4F6FA", dawn: "#C9B8D6", sunset: "#F7C0A0", storm: "#3E4656", overcast: "#AEB6C2", snow: "#DCE3EC" } as const;
const Sky: React.FC<{ t: number; tint: keyof typeof CLOUD; y?: number; radius?: number; count?: number; seed?: string }> = ({ t, tint, y = 45, radius = 200, count = 16, seed = "sky" }) => (
  <Clouds t={t} color={CLOUD[tint]} y={y} radius={radius} count={count} seed={seed} />
);

/** A phone close-up in front of any backdrop, its screen an HTML overlay pinned to the 3D phone. */
const PhoneCU: React.FC<{
  c: ShotCtx;
  at: V3;
  glow: string;
  screen: (w: number, h: number) => React.ReactNode;
  children: React.ReactNode;
  stage?: Partial<React.ComponentProps<typeof Stage>>;
  push?: number;
}> = ({ c, at, glow, screen, children, stage, push = 0.35 }) => {
  const P0 = at;
  const cam = move({ position: [P0[0] + 0.05, P0[1], P0[2] + 2.1], target: [P0[0], P0[1] - 0.02, P0[2]] }, { position: [P0[0] + 0.03, P0[1], P0[2] + 2.1 - push], target: [P0[0], P0[1], P0[2]] }, c);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      stars={false}
      shadowSize={10}
      {...stage}
      overlay={
        <ScreenHtml c={[P0[0], P0[1], P0[2] + PHONE.d / 2 + 0.003]} w={PHONE.screenW} h={PHONE.screenH} cam={cam} width={c.width} height={c.height}>
          {screen}
        </ScreenHtml>
      }
    >
      {children}
      <Phone3D position={P0} glow={glow} />
      <mesh position={[P0[0] + 0.04, P0[1] - PHONE.h / 2 - 0.06, P0[2] + 0.02]} scale={[1.1, 0.8, 0.9]}>
        <IcoG args={[0.22, 2]} />
        <Flat color="#D9A27A" />
      </mesh>
      <pointLight position={[P0[0], P0[1], P0[2] + 1]} color={glow} intensity={4} distance={4} decay={2} />
      <Halo position={[P0[0], P0[1], P0[2] - 0.1]} size={1.6} color={glow} opacity={0.25} />
    </Shot>
  );
};

/** Slavoski standing, holding a phone in his right hand in front of his chest (screen toward him). */
const phoneStance = (hero: V3, over: Partial<Pose> = {}) => {
  const base = mergePose(REST, { headPitch: -0.35, ...over });
  const pose = reach(base, "r", [hero[0] - 0.3, hero[1] + 1.9, hero[2] + 1.05], { position: hero }).pose;
  const hp = handPosition(pose, "r", hero);
  const phone: V3 = [hp[0] + 0.02, hp[1] + 0.22 + PHONE.h / 2 - 0.14, hp[2] + 0.05];
  return { pose, phone };
};

// ---------------------------------------------------------------- cold open: the hook

/** 0 s: his phone map, the blue dot… then "GPS signal lost". */
const coldPhone: ShotFn = (c) => {
  const lost = c.lt > 0.55;
  const glitch = c.lt > 0.5 && c.lt < 0.62;
  return (
    <PhoneCU
      c={c}
      at={[16.5, 6.4, 14]}
      glow={lost ? "#9AA1B0" : "#8FB3D9"}
      push={0.5}
      stage={{ mood: "dawn", fog: [40, 240], light: 0.7, shake: glitch ? 0.02 : 0 }}
      screen={(w, h) => (
        <div style={{ width: w, height: h, opacity: glitch ? 0.55 : 1, transform: glitch ? `translateX(${w * 0.03}px)` : undefined }}>
          <MapScreen w={w} h={h} state={lost ? "lost" : "ok"} t={c.t} k={k01(c.lt, 0.55, 0.8)} />
        </div>
      )}
    >
      <BigStreet seed="hook" />
      <Sky t={c.t} tint="dawn" seed="hook" />
    </PhoneCU>
  );
};

/** The sky above the street at blue hour: a train of satellites… blinking out one after another. */
const coldSky: ShotFn = (c) => {
  const cam = move({ position: [12, 3.2, 26], target: [2, 70, -230] }, { position: [12, 3.0, 24], target: [2, 78, -230] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 420]} shadowSize={30} light={0.7}>
      <BigStreet seed="hook" />
      <Sky t={c.t} tint="dawn" seed="hooksky" y={60} radius={260} />
      <SkyTrain t={c.t} offAt={2.45} stagger={0.045} count={26} from={[-170, 48, -230]} to={[170, 82, -230]} size={2.4} />
    </Shot>
  );
};

/** One satellite in close-up: green status light, then red, then dark; the wings drift off the sun. */
const coldSat: ShotFn = (c) => {
  const cam = move({ position: [9.5, 3.4, 9.5], target: [0.6, 0.1, 0] }, { position: [8.4, 3.0, 8.2], target: [0.6, 0.1, 0] }, c);
  const life = c.lt < 0.2 ? 1 : c.lt < 0.55 ? 0.3 : 0;
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.7} keyDir={[-1, 0.4, 0.5]}>
      <Satellite kind="gps" on={life} t={c.t} rotation={[0.15 + c.lt * 0.05, -0.5 + c.lt * 0.12, 0.08]} wing={k01(c.lt, 0.4, 1.6) * 0.5} />
      <mesh position={[-60, 18, -120]}>
        <circleGeometry args={[4, 12]} />
        <Glow color="#FFF4E0" fog={false} />
      </mesh>
      <Halo position={[-60, 18, -119]} size={40} color="#FFE9C0" opacity={0.5} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 no signal (foggy morning)

/** Aerial street in morning fog: blue location pins above every car and person pop away. */
const PIN_CARS: { x: number; z: number; yaw: number; color: string }[] = [
  { x: 1.7, z: -2, yaw: Math.PI, color: P.carRed },
  { x: -1.7, z: -6, yaw: 0, color: P.carTeal },
  { x: 1.7, z: -11, yaw: Math.PI, color: "#E8E4DA" },
  { x: -1.7, z: -15, yaw: 0, color: "#5A4A78" },
  { x: 1.7, z: -19, yaw: Math.PI, color: P.carTeal },
];
const PIN_PEOPLE: V3[] = [
  [15.5, 0, -6],
  [18.5, 0, -16],
  [-16, 0, -10],
  [-18.6, 0, -24],
  [16, 0, -30],
  [-15.6, 0, -40],
];
const c1Pins: ShotFn = (c) => {
  const cam = move({ position: [6, 34, 30], target: [0, 0, -22] }, { position: [5, 32, 26], target: [0, 0, -24] }, c);
  const gone = c.t - (6.3 - 0.0);
  const pop = (i: number) => (gone < i * 0.05 ? 1 : 1 - clamp01((gone - i * 0.05) / 0.12));
  return (
    <Shot mood="overcast" camera={cam} fog={[20, 150]} shadowSize={40} light={0.85}>
      <BigStreet seed="pins" cars={false} />
      <group scale={CITY}>
        {PIN_CARS.map((p, i) => (
          <Car key={i} position={[p.x, 0, p.z + (p.yaw ? -1 : 1) * c.lt * 0.6]} yaw={p.yaw} color={p.color} />
        ))}
      </group>
      {PIN_CARS.map((p, i) => (
        <MapPin key={`pc${i}`} position={[p.x * CITY, 5.4, (p.z + (p.yaw ? -1 : 1) * c.lt * 0.6) * CITY]} pop={pop(i)} size={1.6} />
      ))}
      {PIN_PEOPLE.map((p, i) => (
        <React.Fragment key={`pp${i}`}>
          <Hero pose={walkPose(c.lt * 1.4 + i * 0.3, 0.8)} position={[p[0], 0, p[2] + c.lt * 1.6]} look={crowdLook(30 + i)} />
          <MapPin position={[p[0], 4.8, p[2] + c.lt * 1.6]} pop={pop(i + 5)} size={1.2} />
        </React.Fragment>
      ))}
    </Shot>
  );
};

const PH_HERO: V3 = [16.6, 0, 6];
const c1Look: ShotFn = (c) => {
  const cam = move({ position: [12.6, 4.6, 16.5], target: [16.6, 3.6, 6] }, { position: [12.9, 4.5, 15.2], target: [16.6, 3.6, 6] }, c);
  const { pose, phone } = phoneStance(PH_HERO, { expression: c.lt > 0.5 ? "worried" : "neutral", headYaw: 0.1 });
  return (
    <Shot mood="overcast" camera={cam} fog={[15, 130]} shadowSize={14} light={0.85}>
      <BigStreet seed="look" />
      <Hero pose={pose} position={PH_HERO} />
      <Phone3D position={phone} rotation={[-0.75, Math.PI, 0]} glow="#C9D2DE" />
      <pointLight position={[phone[0], phone[1] + 0.3, phone[2] - 0.5]} color="#DCE6FF" intensity={3} distance={3} decay={2} />
    </Shot>
  );
};

const c1Unknown: ShotFn = (c) => (
  <PhoneCU c={c} at={[16.6, 5.0, 14]} glow="#9AA1B0" stage={{ mood: "overcast", fog: [12, 120], light: 0.85 }} screen={(w, h) => <MapScreen w={w} h={h} state="unknown" t={c.t} k={0.35 + k01(c.lt, 0.6, 2.6) * 0.65} />}>
    <BigStreet seed="look" />
  </PhoneCU>
);

/** Foggy harbour: a container ship, gantry cranes, and a plane passing low overhead. */
const Harbour: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <Sea t={t} />
    <Quay z={-28} length={300} />
    <GantryCrane position={[-40, 2.2, -36]} />
    <GantryCrane position={[-10, 2.2, -36]} color="#C8372D" />
    <GantryCrane position={[30, 2.2, -36]} />
    {[-60, -20, 20, 60].map((x, i) => (
      <Building key={x} position={[x, 2.2, -70 - (i % 2) * 14]} w={14} d={12} h={18 + i * 6} color={i % 2 ? P.bldgSlate : P.bldgNavy} seed={`hb${i}`} power={0.4} />
    ))}
  </group>
);
const c1Ship: ShotFn = (c) => {
  const cam = move({ position: [-6, 11, 74], target: [2, 12, 0] }, { position: [-5.5, 10.6, 69], target: [2, 12.5, 0] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[22, 190]} shadowSize={50} light={0.8}>
      <Harbour t={c.t} />
      <ContainerShip position={[8, 0, -4 + c.lt * 1.2]} yaw={0.42} t={c.t} />
      <group position={[-34 + c.lt * 18, 31, -12]} rotation={[0, Math.PI / 2, -0.06]} scale={4}>
        <Plane position={[0, 0, 0]} t={c.t} />
      </group>
    </Shot>
  );
};

/** Backup systems: the lighthouse beam sweeping the fog, the ship's own radar turning. */
const c1Backup: ShotFn = (c) => {
  const cam = move({ position: [-12, 7, 28], target: [-30, 17, -22] }, { position: [-13, 7, 25.5], target: [-30, 17.5, -22] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[22, 190]} shadowSize={50} light={0.62}>
      <Sea t={c.t} />
      <Lighthouse position={[-32, 0, -22]} t={c.t} />
      <ContainerShip position={[-14 + c.lt * 1.4, 0, -78]} yaw={-Math.PI / 2} t={c.t} />
      <Quay z={-80} length={300} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 lost time (clear midday)

const c2Serious: ShotFn = (c) => {
  const cam = move({ position: [15.6, 4.1, 14], target: [16.5, 3.7, 4] }, { position: [16.0, 4.0, 10.8], target: [16.5, 3.75, 4] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[40, 300]} shadowSize={16}>
      <BigStreet seed="noon" day />
      <Sky t={c.t} tint="day" seed="noon" />
      <Hero pose={mergePose(REST, { expression: "worried", headPitch: 0.05, headYaw: -0.1 })} position={[16.5, 0, 4]} yaw={-0.12} />
    </Shot>
  );
};

/** Time pulses: a GPS satellite sending rings of "time" down out of frame. */
const c2Pulse: ShotFn = (c) => {
  const cam = move({ position: [3, 2, 13], target: [0, -0.5, 0] }, { position: [2.4, 1.6, 11.5], target: [0, -0.6, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.8} keyDir={[1, 0.5, 0.4]} overlay={<CardLine text="ATOMIC CLOCKS ON BOARD" sub="TIME, TO A FEW BILLIONTHS OF A SECOND" y={470} appearFrame={startFrame(c) + 6} />}>
      <Satellite kind="gps" on={1} t={c.t} position={[0, 1.2, 0]} rotation={[0.2, -0.4, 0]} />
      {[0, 1, 2, 3].map((i) => {
        const k = ((c.t * 0.8 + i / 4) % 1 + 1) % 1;
        return (
          <mesh key={i} position={[0, -0.5 - k * 8, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.8 + k * 4.5, 0.06, 4, 40]} />
            <meshBasicMaterial color={P.amber} transparent opacity={(1 - k) * 0.85} toneMapped={false} depthWrite={false} />
          </mesh>
        );
      })}
    </Shot>
  );
};

/** A nanosecond clock over the midday city. */
const nanoClock = (t: number, drift: number) => {
  const total = 12 * 3600 + t + drift;
  const s = Math.floor(total);
  const hh = String(Math.floor(s / 3600) % 24).padStart(2, "0");
  const mm = String(Math.floor(s / 60) % 60).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  const ns = String(Math.floor((total - s) * 1e9)).padStart(9, "0");
  return `${hh}:${mm}:${ss}.${ns.slice(0, 3)} ${ns.slice(3, 6)} ${ns.slice(6)}`;
};
const ClockCard: React.FC<{ t: number; drift?: number; error?: string }> = ({ t, drift = 0, error }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 430, textAlign: "center", fontFamily: FONT }}>
    <div style={{ display: "inline-block", padding: "18px 30px", borderRadius: 16, background: "rgba(8,10,24,0.72)", border: `2px solid ${error ? "#FF5A4A" : P.amber}` }}>
      <div style={{ fontSize: 20, letterSpacing: "0.18em", color: "rgba(255,255,255,0.7)" }}>{error ? "TIME SIGNAL LOST" : "GPS TIME"}</div>
      <div style={{ marginTop: 8, fontWeight: 700, fontSize: 52, color: error ? "#FF5A4A" : "#FFFFFF", fontVariantNumeric: "tabular-nums", whiteSpace: "pre" }}>{nanoClock(t, drift)}</div>
      {error ? <div style={{ marginTop: 6, fontSize: 26, fontWeight: 700, color: "#FFD0C8" }}>{error}</div> : null}
    </div>
  </div>
);

const c2Clock: ShotFn = (c) => {
  const cam = move({ position: [40, 52, 76], target: [0, 4, 0] }, { position: [36, 49, 70], target: [0, 5, 0] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[80, 320]} shadowSize={60} overlay={<ClockCard t={c.t} />}>
      <CityGrid seed="noon" blocks={7} modify={() => ({ power: 0.3 })} />
      <Sky t={c.t} tint="day" seed="noonsky" radius={240} />
    </Shot>
  );
};

/** A cell tower at noon with signal rings, against the town. */
const Town: React.FC<{ seed: string }> = ({ seed }) => (
  <group>
    <Ground color="#4F7A4A" />
    <HillRing color="#4F7A5A" />
    {Array.from({ length: 9 }, (_, i) => (
      <Building key={i} position={[-48 + i * 12, 0, -60 - (i % 3) * 10]} w={9} d={9} h={12 + random(`${seed}${i}`) * 26} color={[P.bldgSlate, P.bldgNavy, P.bldgTeal, P.bldgPurple][i % 4]} seed={`${seed}${i}`} power={0.3} />
    ))}
  </group>
);
const c2Tower: ShotFn = (c) => {
  const cam = move({ position: [9, 3.2, 40], target: [0, 18, 0] }, { position: [8, 3.2, 36], target: [0, 19, 0] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={40}>
      <Town seed="tw" />
      <Sky t={c.t} tint="day" seed="tower" />
      <CellTower position={[0, 0, 0]} t={c.t} />
    </Shot>
  );
};

/** A market board on a building above a plaza (people with their backs to us). */
const MARKET = { c: [0, 13, -8] as V3, w: 16, h: 9 };
const Market: React.FC<{ t: number; halted: boolean; worried?: boolean }> = ({ t, halted, worried = false }) => (
  <group>
    <Ground color="#8E96A6" />
    <mesh position={[0, 12, -10]} castShadow receiveShadow>
      <BoxG args={[34, 24, 4]} />
      <Flat color={P.bldgSlate} />
    </mesh>
    {[-12, -4, 4, 12].map((x) => (
      <mesh key={x} position={[x, 3.5, -7.6]} castShadow>
        <BoxG args={[1.6, 7, 1.6]} />
        <Flat color="#C9D2DE" />
      </mesh>
    ))}
    <mesh position={[MARKET.c[0], MARKET.c[1], MARKET.c[2] - 0.1]}>
      <BoxG args={[MARKET.w + 0.8, MARKET.h + 0.8, 0.3]} />
      <Flat color="#15161C" />
    </mesh>
    <CanvasPanel position={[MARKET.c[0], MARKET.c[1], MARKET.c[2] + 0.07]} w={MARKET.w} h={MARKET.h} draw={drawTicker(t, halted)} />
    {Array.from({ length: 7 }, (_, i) => (
      <Hero
        key={i}
        pose={mergePose(REST, { headPitch: 0.45, expression: worried ? "alarm" : "neutral", headYaw: (random(`mk${i}`) - 0.5) * 0.4 })}
        position={[-9 + i * 3 + (random(`mx${i}`) - 0.5), 0, 6 + (i % 3) * 2.4]}
        yaw={Math.PI + (random(`my${i}`) - 0.5) * 0.4}
        look={i === 3 ? undefined : crowdLook(60 + i)}
      />
    ))}
    {[-30, 30].map((x) => (
      <Building key={x} position={[x, 0, -12]} w={18} d={14} h={32} color={P.bldgNavy} seed={`mkb${x}`} power={0.3} />
    ))}
  </group>
);
const c2Money: ShotFn = (c) => {
  const cam = move({ position: [3, 4.2, 30], target: [0, 10, -6] }, { position: [2.6, 4.2, 27], target: [0, 10.5, -6] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={30}>
      <Market t={c.t} halted={false} />
      <Sky t={c.t} tint="day" seed="money" />
    </Shot>
  );
};

const c2Grid: ShotFn = (c) => {
  const cam = move({ position: [60, 22, 90], target: [0, 10, 0] }, { position: [55, 21, 82], target: [0, 10, 0] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[80, 400]} shadowSize={70}>
      <Ground color="#5A7A4A" />
      <HillRing color="#4F7A5A" radius={260} />
      <Sky t={c.t} tint="day" seed="grid" radius={260} />
      <group scale={3}>
        <PowerStation position={[0, 0, 0]} on={1} t={c.t} />
      </group>
      {[-60, -20, 20, 60, 100].map((x) => (
        <Pylon key={x} position={[x, 0, 48]} />
      ))}
      {[14, 18].map((y) => (
        <mesh key={y} position={[20, y - 0.6, 48]} rotation={[0, 0, Math.PI / 2]}>
          <CylG args={[0.06, 0.06, 170, 4]} />
          <Flat color="#2B2F3E" />
        </mesh>
      ))}
    </Shot>
  );
};

const c2Halt: ShotFn = (c) => {
  const cam = move({ position: [2, 4.2, 25], target: [0, 10.5, -6] }, { position: [1.6, 4.3, 22.5], target: [0, 11, -6] }, c);
  const drift = k01(c.lt, 0.2, 1.4) * 0.0042;
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={30} overlay={<ClockCard t={c.t} drift={drift} error={c.lt > 0.6 ? `DRIFT +${(drift * 1000).toFixed(1)} ms` : undefined} />}>
      <Market t={c.t} halted={c.lt > 0.7} worried={c.lt > 0.9} />
      <Sky t={c.t} tint="day" seed="money" />
    </Shot>
  );
};

/** A traffic signal (base y = 0, head facing +Z): normal, or flashing amber when its timing fails. */
const TrafficLight: React.FC<{ position: V3; yaw?: number; t: number; fail: boolean }> = ({ position, yaw = 0, t, fail }) => {
  const amberOn = fail ? ((t * 2.5) % 1) < 0.6 : false;
  const lamps: [string, boolean][] = [
    ["#FF4A3A", !fail],
    [P.amber, amberOn],
    ["#45E08A", false],
  ];
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, 4.5, 0]} castShadow>
        <CylG args={[0.18, 0.22, 9, 6]} />
        <Flat color="#2B2F3E" />
      </mesh>
      <mesh position={[0, 8.4, 0.4]} castShadow>
        <BoxG args={[1.1, 3.0, 0.6]} />
        <Flat color="#15161C" />
      </mesh>
      {lamps.map(([col, on], i) => (
        <group key={i} position={[0, 9.3 - i * 0.92, 0.72]}>
          <mesh>
            <circleGeometry args={[0.32, 12]} />
            {on ? <Glow color={col} /> : <Flat color="#2A2A30" />}
          </mesh>
          {on ? <Halo size={2.4} color={col} opacity={0.55} /> : null}
        </group>
      ))}
    </group>
  );
};
const c2Traffic: ShotFn = (c) => {
  const cam = move({ position: [2, 4.2, 36], target: [10, 7, 8] }, { position: [2.4, 4.1, 33.5], target: [10, 7.1, 8] }, c);
  const fail = c.lt > 0.25;
  return (
    <Shot mood="day" camera={cam} fog={[60, 300]} shadowSize={40}>
      <BigStreet seed="traffic" cars={false} lamps={false} day />
      <Sky t={c.t} tint="day" seed="traffic" />
      <group scale={CITY}>
        <Car position={[1.7, 0, -1.6]} yaw={Math.PI} color={P.carRed} />
        <Car position={[1.7, 0, -5.6]} yaw={Math.PI} color="#E8E4DA" />
        <Car position={[-1.7, 0, -3.8]} yaw={0.12} color={P.carTeal} />
        <Car position={[-1.0, 0, -8.2]} yaw={-0.5} color="#5A4A78" />
        <Car position={[1.7, 0, -9.8]} yaw={Math.PI + 0.2} color={P.carTeal} />
      </group>
      <TrafficLight position={[10.8, 0, 16]} yaw={-0.45} t={c.t} fail={fail} />
      <TrafficLight position={[-13.4, 0, -20]} yaw={0.35} t={c.t} fail={fail} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 going dark (afternoon → snowy dusk → storm)

const TVVIEW: CameraSpec = { position: [1.0, 7.5, 9.0], target: [0.8, 1.4, -1.5] };
const c3TV: ShotFn = (c) => {
  const cam = lerpCam(TVVIEW, { position: [1.0, 7.2, 8.3], target: [0.8, 1.4, -1.5] }, c.lt / span(c.dur));
  const pose = sittingPose({ lShoulder: [0.35, 0.15], rShoulder: [0.35, 0.15], lElbow: 0.6, rElbow: 0.6, expression: c.lt > 0.6 ? "worried" : "neutral" });
  return (
    <AbsoluteFill>
      <Stage mood="day" camera={cam} fog={false} stars={false} light={0.5} shadowSize={14}>
        <GamingRoom hours={4} cans={0} />
        <Hero pose={pose} position={SEAT} yaw={SEAT_YAW} />
      </Stage>
      <ScreenHtml c={[TV.center[0], TV.center[1], TV.center[2] + 0.002]} w={TV.w} h={TV.h} cam={cam} width={c.width} height={c.height}>
        {(w, h) => <NoSignalTV w={w} h={h} t={c.t} k={k01(c.lt, 0.2, 0.9)} />}
      </ScreenHtml>
    </AbsoluteFill>
  );
};

/** A snowy mountain village at dusk; a villager holds a satellite phone up, searching for a signal. */
const Village: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <SnowGround />
    <Mountain position={[-80, 0, -220]} h={130} r={80} seed="m1" />
    <Mountain position={[60, 0, -260]} h={170} r={100} seed="m2" />
    <Mountain position={[170, 0, -200]} h={110} r={70} seed="m3" />
    <Cabin position={[-9, 0, -6]} yaw={0.3} />
    <Cabin position={[10, 0, -14]} yaw={-0.4} color="#5A3A2A" />
    <Cabin position={[-2, 0, -30]} yaw={0.1} color="#6A4A3A" dish={false} />
    {[
      [-20, -16],
      [22, -2],
      [-16, 6],
      [18, -30],
      [-30, -34],
      [6, -46],
    ].map(([x, z], i) => (
      <SnowPine key={i} position={[x, 0, z]} scale={2.2 + (i % 3) * 0.3} />
    ))}
    <Snow center={[0, 10, 8]} size={[30, 22, 26]} t={t} count={500} />
  </group>
);
const VILLAGER: V3 = [2, 0, 5];
const c3Village: ShotFn = (c) => {
  const cam = move({ position: [7, 5.8, 26], target: [0, 5.5, -6] }, { position: [6.5, 5.6, 23.5], target: [0, 5.6, -6] }, c);
  const raise = 0.1 * Math.sin(c.lt * 2.4);
  const pose = mergePose(REST, { rShoulder: [0.3, 2.35 + raise], rElbow: 0.35, expression: "worried", headPitch: 0.45, headYaw: -0.35 });
  const hp = handPosition(pose, "r", VILLAGER, 0.2);
  return (
    <Shot mood="snow" camera={cam} fog={[30, 300]} shadowSize={40} light={0.85}>
      <Village t={c.t} />
      <Sky t={c.t} tint="snow" seed="village" y={60} />
      <Hero pose={pose} position={VILLAGER} yaw={0.2} look={{ ...crowdLook(77), jacket: "#8A3A3A", jacketShade: "#723030" }} />
      <Phone3D position={[hp[0], hp[1] + 0.22 + PHONE.h / 2 - 0.12, hp[2]]} rotation={[0.1, 0.3, 0]} glow="#3A3F4E" />
    </Shot>
  );
};

const c3NoService: ShotFn = (c) => (
  <PhoneCU c={c} at={[2, 6.2, 10]} glow="#3A3F4E" stage={{ mood: "snow", fog: [20, 260], light: 0.85 }} screen={(w, h) => <NoService w={w} h={h} />}>
    <Village t={c.t} />
  </PhoneCU>
);

/** The weather office: a satellite image of a spiralling storm… then NO DATA. */
const WX = { c: [0, 6.2, -5.85] as V3, w: 12, h: 6.75 };
const c3Weather: ShotFn = (c) => {
  const cam = move({ position: [0.4, 5.0, 18], target: [-1.2, 5.0, -4] }, { position: [0.3, 5.0, 16.4], target: [-1.2, 5.1, -4] }, c);
  const dead = k01(c.lt, 1.3, 1.7);
  return (
    <Shot
      mood="overcast"
      camera={cam}
      fog={false}
      stars={false}
      light={0.7}
      shadowSize={14}
    >
      <CanvasPanel position={[WX.c[0], WX.c[1], WX.c[2] + 0.02]} w={WX.w} h={WX.h} draw={drawWeather(c.t, dead)} />
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[30, 0.1, 30]} />
        <Flat color="#3A4258" />
      </mesh>
      <mesh position={[0, 6, -6.1]} receiveShadow>
        <BoxG args={[30, 12, 0.3]} />
        <Flat color="#5A6478" />
      </mesh>
      <mesh position={[WX.c[0], WX.c[1], WX.c[2] - 0.1]}>
        <BoxG args={[WX.w + 0.5, WX.h + 0.5, 0.2]} />
        <Flat color="#15161C" />
      </mesh>
      {[-8.5, 8.5].map((x) => (
        <group key={x} position={[x, 0, -2]}>
          <mesh position={[0, 1.45, 0]} castShadow>
            <BoxG args={[4, 0.12, 2]} />
            <Flat color="#C9C2B4" />
          </mesh>
          <mesh position={[0, 2.3, -0.5]} castShadow>
            <BoxG args={[1.8, 1.1, 0.1]} />
            <Flat color="#17181E" />
          </mesh>
          <mesh position={[0, 2.3, -0.44]}>
            <planeGeometry args={[1.62, 0.92]} />
            <Glow color={dead > 0.5 ? "#3A1A1A" : "#2E6A8A"} />
          </mesh>
        </group>
      ))}
      <Hero pose={mergePose(REST, { expression: dead > 0.5 ? "alarm" : "neutral", rShoulder: [1.4, 0.6], rElbow: 0.1, headYaw: -0.5 })} position={[-3.0, 0, 2.2]} yaw={0.7} look={crowdLook(91)} />
    </Shot>
  );
};

/** A seawall promenade with a hurricane coming in: storm wall, lightning, rain, bending palms. */
const Coast: React.FC<{ t: number; flash: number }> = ({ t, flash }) => (
  <group>
    <mesh position={[0, -1.5, -20]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[800, 600]} />
      <Flat color="#24384A" />
    </mesh>
    <group position={[0, -1.2, -6]}>
      <Waves t={t} rows={12} />
    </group>
    <mesh position={[0, -0.6, 20]} receiveShadow>
      <BoxG args={[200, 1.2, 40]} />
      <Flat color="#6A6E78" />
    </mesh>
    <mesh position={[0, 0.6, 0.6]} castShadow>
      <BoxG args={[200, 1.2, 0.5]} />
      <Flat color="#8E96A6" />
    </mesh>
    {[-26, -10, 12, 28].map((x, i) => (
      <PalmTree key={x} position={[x, 0, 8 + (i % 2) * 6]} height={10} seed={`cp${i}`} sway={3 + Math.sin(t * 3 + i) * 1.5} />
    ))}
    {[-40, -22, 22, 40].map((x, i) => (
      <House key={x} position={[x, 0, 34]} yaw={Math.PI} color={["#E8DCC4", "#BFD7E0", "#F2E2B0", "#E8C8C0"][i]} roof="#5A4A78" lit />
    ))}
    <StormWall position={[30, 0, -300]} t={t} radius={170} />
    <LightningBolt top={[-40, 120, -220]} bottom={[-30, 0, -180]} flash={flash} seed="coast" />
    <group scale={2}>
      <Rain center={[0, 6, 4]} size={[20, 14, 20]} t={t} count={900} seed="coast" speed={16} thickness={0.016} />
    </group>
  </group>
);
const c3Storm: ShotFn = (c) => {
  const flash = c.lt > 0.9 && c.lt < 1.1 ? 1 - Math.abs(c.lt - 0.95) * 6 : 0;
  const cam = move({ position: [6, 5.4, 24], target: [0, 16, -80] }, { position: [5.4, 5.2, 21.5], target: [0, 17, -80] }, c);
  return (
    <Shot mood="storm" camera={cam} fog={[60, 420]} shadowSize={40} light={0.9} shake={0.03} overlay={<AbsoluteFill style={{ background: "#E8EEFF", opacity: flash * 0.25 }} />}>
      <Coast t={c.t} flash={flash} />
      <Sky t={c.t} tint="storm" seed="coast" y={55} radius={240} count={22} />
      <Hero pose={mergePose(REST, { expression: "alarm", headPitch: 0.3 })} position={[1.5, 0, 6]} yaw={Math.PI - 0.25} />
    </Shot>
  );
};
const c3Face: ShotFn = (c) => {
  const flash = c.lt > 0.5 && c.lt < 0.7 ? 1 - Math.abs(c.lt - 0.55) * 6 : 0;
  const cam = move({ position: [0.6, 4.0, 16], target: [0, 3.6, 4] }, { position: [0.5, 3.95, 14.6], target: [0, 3.65, 4] }, c);
  return (
    <Shot mood="storm" camera={cam} fog={[40, 380]} shadowSize={14} light={0.95} shake={0.04} overlay={<AbsoluteFill style={{ background: "#E8EEFF", opacity: flash * 0.3 }} />}>
      <group rotation={[0, Math.PI, 0]}>
        <Coast t={c.t} flash={flash} />
      </group>
      <Hero pose={mergePose(REST, { expression: "alarm", lShoulder: [0.5, 0.9], rShoulder: [0.5, 0.9], lElbow: 0.5, rElbow: 0.5, headYaw: 0.25 * Math.sin(c.lt * 3) })} position={[0, 0, 4]} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 no early warning (night)

const OFFICERS: V3[] = [
  [-7, 0, 1.0],
  [-1.5, 0, 1.2],
  [4.5, 0, 1.0],
  [9.5, 0, 7.0],
];
const c4Room: ShotFn = (c) => {
  const cam = move({ position: [0.5, 6.4, 18], target: [0, 6.6, -9] }, { position: [0.4, 6.3, 16.2], target: [0, 6.7, -9] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.32} shadowSize={20}>
      <CommandRoom t={c.t} offline={0} />
      {OFFICERS.map((p, i) => (
        <Hero key={i} pose={mergePose(REST, { headPitch: 0.25, headYaw: (i - 1.5) * 0.08 })} position={p} yaw={Math.PI} look={suitLook(40 + i)} />
      ))}
    </Shot>
  );
};

/** The early-warning satellite over the night side: its infrared eye scanning. */
const WarningSat: React.FC<{ c: ShotCtx; on: number; close?: boolean }> = ({ c, on, close = false }) => {
  const cam = close
    ? move({ position: [-4.6, -0.6, 8.2], target: [-1.5, -0.7, 2.4] }, { position: [-4.1, -0.6, 7.2], target: [-1.5, -0.7, 2.4] }, c)
    : move({ position: [7, 3, 13], target: [0, -1.2, 0] }, { position: [6.2, 2.6, 11.6], target: [0, -1.3, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.5} keyDir={[1, 0.3, 0.2]}>
      <Satellite kind="warning" on={on} t={c.t} rotation={[0.25, -0.6 + c.lt * 0.04, 0.05]} />
      <FacetedEarth radius={40} position={[0, -52, -20]} rotation={[0.3, 1.2, 0]} cityLights={1} />
    </Shot>
  );
};
const c4Sat: ShotFn = (c) => <WarningSat c={c} on={1} />;
/** A launch-detection radar scope in the dark room: sweep, rings, blips. */
const c4Radar: ShotFn = (c) => {
  const cam = move({ position: [0.4, 4.2, 6.8], target: [0, 3.5, 0] }, { position: [0.3, 4.1, 5.8], target: [0, 3.5, 0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.3} shadowSize={8}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[20, 0.1, 20]} />
        <Flat color="#1A1F2E" />
      </mesh>
      <mesh position={[0, 4, -1.2]}>
        <BoxG args={[20, 8, 0.3]} />
        <Flat color="#121624" />
      </mesh>
      <mesh position={[0, 0.95, 0.6]} castShadow>
        <BoxG args={[5, 1.9, 1.6]} />
        <Flat color="#232838" />
      </mesh>
      <mesh position={[0, 3.9, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <CylG args={[1.75, 1.75, 0.3, 24]} />
        <Flat color="#15161C" />
      </mesh>
      <CanvasPanel position={[0, 3.9, -0.03]} w={3.2} h={3.2} px={512} draw={drawScope(c.t)} />
      <Halo position={[0, 3.9, 0.2]} size={5} color="#50FF96" opacity={0.18} />
      <pointLight position={[0, 3.9, 1.5]} color="#50FF96" intensity={6} distance={6} decay={2} />
    </Shot>
  );
};
const c4Dark: ShotFn = (c) => <WarningSat c={c} on={c.lt < 0.35 ? 1 : c.lt < 0.6 ? 0.3 : 0} close />;
const c4Offline: ShotFn = (c) => {
  const cam = move({ position: [-0.6, 6.0, 15], target: [0, 7.4, -9] }, { position: [-0.5, 6.0, 13.6], target: [0, 7.4, -9] }, c);
  const off = k01(c.lt, 0, 0.3);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.3} shadowSize={20}>
      <CommandRoom t={c.t} offline={off} />
      {OFFICERS.map((p, i) => (
        <Hero key={i} pose={mergePose(REST, { headPitch: 0.3, expression: "alarm", headYaw: (i - 1.5) * 0.2 })} position={p} yaw={Math.PI} look={suitLook(40 + i)} />
      ))}
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 silent orbit (sunrise)

/** Earth's limb at the bottom of frame with the sun rising over it (space shots of the last chapter). */
const Limb: React.FC<{ y?: number }> = ({ y = -66 }) => (
  <group>
    <FacetedEarth radius={60} position={[0, y, -10]} rotation={[0.4, 2.0, 0]} />
    <mesh position={[30, y + 58, -260]}>
      <circleGeometry args={[6, 16]} />
      <Glow color="#FFF4E0" fog={false} />
    </mesh>
    <Halo position={[30, y + 58, -259]} size={90} color="#FFC890" opacity={0.55} />
  </group>
);
const DEAD = [
  { p: [0, 0, 0] as V3, r: [0.2, 0.6, 0.1] as V3, k: "comms" as const },
  { p: [-9, 3, -14] as V3, r: [0.6, 1.4, 0.3] as V3, k: "gps" as const },
  { p: [10, -1, -18] as V3, r: [-0.3, -0.8, 0.5] as V3, k: "weather" as const },
  { p: [-4, 6, -30] as V3, r: [1.0, 0.2, -0.4] as V3, k: "gps" as const },
  { p: [14, 7, -40] as V3, r: [0.2, 2.2, 0.8] as V3, k: "comms" as const },
  { p: [-16, -2, -44] as V3, r: [-0.6, 0.9, 0.1] as V3, k: "warning" as const },
];
const c5Field: ShotFn = (c) => {
  const cam = move({ position: [0, 3, 26], target: [0, 0, -10] }, { position: [0, 2.6, 23], target: [0, -0.3, -10] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.6} keyDir={[0.6, 0.4, -0.7]}>
      <Limb />
      {DEAD.map((d, i) => (
        <Satellite key={i} kind={d.k} on={0} position={[d.p[0] + c.t * 0.05 * (i % 2 ? 1 : -1), d.p[1], d.p[2]]} rotation={[d.r[0] + c.t * 0.02 * (i + 1), d.r[1] + c.t * 0.015, d.r[2]]} />
      ))}
    </Shot>
  );
};
const c5Tumble: ShotFn = (c) => {
  const cam = move({ position: [3.5, 2, 16], target: [0, 0, 0] }, { position: [3.0, 1.8, 14.2], target: [0, 0, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.55} keyDir={[0.8, 0.3, -0.6]}>
      <Limb y={-72} />
      <Satellite kind="comms" on={0} rotation={[0.3 + c.t * 0.12, 0.8 + c.t * 0.07, 0.2 + c.t * 0.05]} />
    </Shot>
  );
};

/** Astronaut Slavoski by a dead satellite: no way to fix them all. */
const ASTRO: V3 = [0, -2.6, 0];
const c5Astro: ShotFn = (c) => {
  const cam = move({ position: [1.2, 0.8, 13], target: [0, 0.6, 0] }, { position: [1.0, 0.7, 11.6], target: [0, 0.6, 0] }, c);
  const shrug = k01(c.lt, 0.6, 1.0);
  const pose = mergePose(REST, {
    lShoulder: [0.35 * shrug + 0.2, 0.3 + 0.5 * shrug],
    rShoulder: [0.35 * shrug + 0.2, 0.3 + 0.5 * shrug],
    lElbow: 0.4 + 1.2 * shrug,
    rElbow: 0.4 + 1.2 * shrug,
    lHip: [0.2, 0.08],
    rHip: [-0.15, 0.08],
    lKnee: 0.4,
    rKnee: 0.2,
    headRoll: 0.12 * shrug,
    expression: "worried",
  });
  const drift: V3 = [ASTRO[0], ASTRO[1] + Math.sin(c.t * 0.8) * 0.12, ASTRO[2]];
  const head = headPosition(pose, drift, 0.25);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.75} keyDir={[0.7, 0.4, 0.6]}>
      <Limb y={-80} />
      <Satellite kind="gps" on={0} position={[0.4, 5.6, -5]} rotation={[0.4, -0.7 + c.t * 0.03, 0.2]} scale={1.1} />
      <group position={drift} rotation={[0, 0.25, 0]}>
        <mesh position={[0, 2.25, -0.65]} castShadow>
          <BoxG args={[1.3, 1.6, 0.6]} />
          <Flat color="#C9D2DE" />
        </mesh>
      </group>
      <Hero pose={pose} position={drift} yaw={0.25} look={SPACESUIT} />
      <Helmet head={head} />
    </Shot>
  );
};

/** Back on the ground at sunrise: new ground stations and towers going up. */
const c5Ground: ShotFn = (c) => {
  const cam = move({ position: [30, 7, 48], target: [0, 7, 0] }, { position: [27, 6.8, 44], target: [0, 7.2, 0] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 360]} shadowSize={50} light={1.0} keyDir={[0.8, 0.3, -0.6]}>
      <Ground color="#4F6A4A" />
      <HillRing color="#3E5A4A" radius={240} />
      <Sky t={c.t} tint="dawn" seed="gs" />
      <GroundDish position={[-14, 0, -6]} yaw={0.4} tilt={0.8 + Math.sin(c.t * 0.3) * 0.05} />
      <GroundDish position={[8, 0, -14]} yaw={-0.3} tilt={0.95} scale={1.3} />
      <GroundDish position={[22, 0, 4]} yaw={-0.8} tilt={0.7} scale={0.9} />
      {[-4, 2].map((x, i) => (
        <Hero key={x} pose={walkPose(c.lt * 1.3 + i * 0.4, 0.7)} position={[x, 0, 10 + c.lt * 1.2]} yaw={0.3} look={{ ...crowdLook(120 + i), jacket: "#D8D040", jacketShade: "#B8B030" }} />
      ))}
    </Shot>
  );
};
const c5Rebuild: ShotFn = (c) => {
  const cam = move({ position: [44, 16, 70], target: [0, 18, -10] }, { position: [40, 15, 64], target: [0, 18.5, -10] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[70, 420]} shadowSize={60} light={1.0} keyDir={[0.8, 0.3, -0.6]}>
      <Ground color="#5A5048" />
      <HillRing color="#3E5A4A" radius={260} />
      <Sky t={c.t} tint="dawn" seed="rebuild" />
      <group position={[-6, 0, -22]} scale={0.8}>
        <SkyscraperSite />
      </group>
      <Crane position={[16, 0, -24]} height={70} jib={34} load={20} swing={c.t} />
      <CellTower position={[24, 0, 6]} h={26} t={c.t} signal={0} />
      <CellTower position={[-26, 0, 8]} h={20} t={c.t} signal={0} />
      <Robot position={[6, 0, 10]} walk={c.lt * 1.2} yaw={-0.6} />
      {[-12, -6].map((x, i) => (
        <Hero key={x} pose={walkPose(c.lt * 1.3 + i * 0.5, 0.8)} position={[x, 0, 14 + c.lt]} yaw={0.4} look={{ ...crowdLook(130 + i), jacket: "#D8D040", jacketShade: "#B8B030" }} />
      ))}
    </Shot>
  );
};

/** Pull back: Earth wrapped in thousands of silent satellites. */
const c5Shell: ShotFn = (c) => {
  const cam = move({ position: [0, 2.2, 13], target: [0, 0.4, 0] }, { position: [0, 3.2, 21], target: [0, 0.2, 0] }, { ...c, dur: 3.8 });
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.7} keyDir={[0.9, 0.3, -0.4]}>
      <FacetedEarth radius={3} rotation={[0.4, 2.6 + c.t * 0.04, 0]} cityLights={0.4} />
      <OrbitShell r={3} t={c.t} />
      <mesh position={[40, 6, -120]}>
        <circleGeometry args={[3, 12]} />
        <Glow color="#FFF4E0" fog={false} />
      </mesh>
      <Halo position={[40, 6, -119]} size={30} color="#FFD8A8" opacity={0.5} />
    </Shot>
  );
};

// ---------------------------------------------------------------- thumbnail

/** Shorts cover: Slavoski on the dawn street looking up, phone in hand, the satellite train going dark. */
export const thumbShot: ShotFn = () => {
  const hero: V3 = [15.8, 0, 7];
  const { pose, phone } = phoneStance(hero, { headPitch: 0.6, expression: "alarm", headYaw: -0.05 });
  const cam: CameraSpec = { position: [15.2, 2.2, 21], target: [14.6, 10.5, -40] };
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 420]} shadowSize={30} light={0.8}>
      <BigStreet seed="hook" lamps={false} />
      <Sky t={0} tint="dawn" seed="thumb" y={40} radius={260} />
      <SkyTrain t={2.72} offAt={2.45} stagger={0.045} count={26} from={[-60, 44, -230]} to={[120, 52, -230]} size={2.8} />
      <Hero pose={pose} position={hero} yaw={0.05} />
      <Phone3D position={phone} rotation={[-0.75, Math.PI, 0]} glow="#9AA1B0" />
    </Shot>
  );
};

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldPhone },
    { cue: "orbiting", fn: coldSky },
    { cue: "stopped working", fn: coldSat },
  ],
  c1: [
    { cue: null, fn: c1Pins },
    { cue: "Your phone", fn: c1Look },
    { cue: "but it can", fn: c1Unknown },
    { cue: "Planes and", fn: c1Ship },
    { cue: "forcing them", fn: c1Backup },
  ],
  c2: [
    { cue: null, fn: c2Serious },
    { cue: "GPS doesn't", fn: c2Pulse },
    { cue: "It also provides", fn: c2Clock },
    { cue: "mobile networks", fn: c2Tower },
    { cue: "financial", fn: c2Money },
    { cue: "power grids", fn: c2Grid },
    { cue: "Without it", fn: c2Halt },
    { cue: "could start", fn: c2Traffic },
  ],
  c3: [
    { cue: null, fn: c3TV },
    { cue: "remote communities", fn: c3Village },
    { cue: "communications", fn: c3NoService },
    { cue: "and meteorologists", fn: c3Weather },
    { cue: "Tracking hurricanes", fn: c3Storm },
    { cue: "dangerous storms", fn: c3Face },
  ],
  c4: [
    { cue: null, fn: c4Room },
    { cue: "satellites also", fn: c4Sat },
    { cue: "missile launches", fn: c4Radar },
    { cue: "Without them", fn: c4Dark },
    { cue: "crucial", fn: c4Offline },
  ],
  c5: [
    { cue: null, fn: c5Field },
    { cue: "They're still", fn: c5Tumble },
    { cue: "And if we", fn: c5Astro },
    { cue: "humanity would", fn: c5Ground },
    { cue: "huge parts", fn: c5Rebuild },
    { cue: "all because", fn: c5Shell },
  ],
};
