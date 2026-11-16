/**
 * Act 1: cold open (waking up, the phone, stepping outside), 01 THE EMPTY CITY, 02 IS ANYONE THERE?,
 * 03 THE MACHINES KEEP RUNNING. Sunny morning → bright midday → golden hour → dusk.
 */
import React from "react";
import { random } from "remotion";
import { Car, CityGrid, Lamp, PowerStation } from "../../../slavoski/city";
import { BoxG, IcoG } from "../../../slavoski/detail";
import { FONT } from "../../../slavoski/fonts";
import { Flat, Glow } from "../../../slavoski/materials";
import { clamp01, type V3 } from "../../../slavoski/noise";
import { P } from "../../../slavoski/palette";
import { handPosition, Hero, mergePose, reach, REST, type Pose } from "../../../slavoski/rig/Hero";
import { ScreenHtml } from "../../../slavoski/screens";
import { SmokeCluster } from "../../../slavoski/fx";
import type { CuedShot } from "../../../slavoski/timeline";
import { Skyline } from "../../no-work-2036/props";
import { Pylon } from "../../satellites-dark/props";
import { BED, Bedroom, WIN } from "../../smart-animals/props";
import { AlarmClock, CLOCK, Phone3D, PHONE } from "../../ww3-countdown/props";
import { CallScreen, FeedEmpty, Kitchen, KITCHEN, Laptop, laptopScreen, LockEmpty, MessagesEmpty } from "../props/home";
import { ApartmentEntrance, Cafe, Hospital, PlasticBag, PoliceStation, Rooftop, S, ShopFront, Suburb, TrafficLight } from "../props/town";
import { Ambulance, Convertible, CONV, drivingPose } from "../props/vehicles";
import { BigStreet, k01, lerp, move, prog, Shot, Sky, standing, walking, type ShotCtx, type ShotFn } from "./common";

// ================================================================ shared pieces

/** City backdrop: a ring of hero-scale towers far away, so no wide shot ends in empty ground. */
export const CityRing: React.FC<{ power?: number; radius?: number; seed?: string; count?: number }> = ({ power = 0.3, radius = 150, seed = "ring", count = 48 }) => (
  <group scale={S}>
    <Skyline radius={radius} count={count} seed={seed} arc={[0, Math.PI * 2]} power={power} />
  </group>
);

/** Abandoned cars along the avenue (kit scale inside BigStreet coordinates). */
const AVENUE_CARS: { x: number; z: number; yaw: number; c: string }[] = [
  { x: 1.6, z: -6, yaw: Math.PI + 0.06, c: P.carRed },
  { x: -1.8, z: -13, yaw: 0.15, c: P.carTeal },
  { x: 1.7, z: -22, yaw: Math.PI - 0.2, c: "#E8E4DA" },
  { x: -1.5, z: -30, yaw: -0.08, c: "#2A2A30" },
  { x: 2.0, z: -41, yaw: Math.PI + 0.35, c: "#5A4A78" },
  { x: -1.9, z: -52, yaw: 0.05, c: P.carRed },
];
export const AvenueCars: React.FC<{ rust?: number; moss?: number }> = ({ rust = 0, moss = 0 }) => (
  <group scale={S}>
    {AVENUE_CARS.map((c, i) => (
      <Car key={i} position={[c.x, 0, c.z]} yaw={c.yaw} color={c.c} lights={false} rust={rust} moss={moss} />
    ))}
  </group>
);

/** The avenue: big street, abandoned cars, city ring. */
export const Avenue: React.FC<{ day?: boolean; power?: number; lampsOn?: boolean; cars?: boolean; ring?: number; modify?: React.ComponentProps<typeof BigStreet>["modify"] }> = ({
  day = true,
  power,
  lampsOn = false,
  cars = true,
  ring = 0.3,
  modify,
}) => (
  <>
    <BigStreet seed="avenue" day={day} power={power} lampsOn={lampsOn} cars={false} modify={modify} />
    {cars ? <AvenueCars /> : null}
    <CityRing power={ring} />
  </>
);

/** Phone close-up with an HTML screen, in front of any backdrop. */
const PhoneCU: React.FC<{
  c: ShotCtx;
  at: V3;
  screen: (w: number, h: number) => React.ReactNode;
  children: React.ReactNode;
  stage?: Partial<React.ComponentProps<typeof Shot>>;
  glow?: string;
  push?: number;
}> = ({ c, at, screen, children, stage, glow = "#CFE2FF", push = 0.35 }) => {
  const cam = move({ position: [at[0] + 0.06, at[1] + 0.02, at[2] + 1.75], target: [at[0], at[1] - 0.02, at[2]] }, { position: [at[0] + 0.03, at[1], at[2] + 1.75 - push], target: [at[0], at[1], at[2]] }, c);
  return (
    <Shot
      mood="day"
      camera={{ ...cam, fov: 34 }}
      fog={false}
      stars={false}
      shadowSize={10}
      {...stage}
      overlay={
        <ScreenHtml c={[at[0], at[1], at[2] + PHONE.d / 2 + 0.003]} w={PHONE.screenW} h={PHONE.screenH} cam={{ ...cam, fov: 34 }} width={c.width} height={c.height}>
          {screen}
        </ScreenHtml>
      }
    >
      {children}
      <Phone3D position={at} glow={glow} />
      <mesh position={[at[0] + 0.04, at[1] - PHONE.h / 2 - 0.06, at[2] + 0.02]} scale={[1.1, 0.8, 0.9]}>
        <IcoG args={[0.22, 2]} />
        <Flat color={P.skin} />
      </mesh>
      <pointLight position={[at[0], at[1], at[2] + 1]} color={glow} intensity={3} distance={4} decay={2} />
    </Shot>
  );
};

// ================================================================ bedroom (cold open)

/** Slavoski sitting up in bed (eps. 4–5 placement). */
const BED_HERO: V3 = [BED.x, BED.mattressTop - (1.55 + 0.02 - 0.18), -2.55];
export const bedPose = (over: Partial<Pose> = {}): Pose =>
  mergePose(REST, { lHip: [1.47, 0.06], rHip: [1.47, 0.06], lKnee: 0.04, rKnee: 0.04, lShoulder: [0.25, 0.25], rShoulder: [0.25, 0.25], lElbow: 0.5, rElbow: 0.5, ...over });
const CLOCK_POS: V3 = [0.5, 1.1, -3.05];
const CLOCK_YAW = 0.5;
const CLOCK_FACE: V3 = [CLOCK_POS[0] + Math.sin(CLOCK_YAW) * 0.205, CLOCK_POS[1] + 0.25, CLOCK_POS[2] + Math.cos(CLOCK_YAW) * 0.205];

/** Morning sunlight through the window: a soft additive shaft from the window toward the bed. */
const SunShaft: React.FC<{ strength?: number }> = ({ strength = 1 }) => (
  <group>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[WIN.x + 3.2, WIN.y - 1.1 - i * 0.15, WIN.z + 0.4 + i * 0.25]} rotation={[0, 0, 0.62]}>
        <BoxG args={[7.4, 1.6 - i * 0.4, WIN.w - 0.4 - i * 0.3]} />
        <meshBasicMaterial color="#FFE2A8" transparent opacity={0.07 * strength} depthWrite={false} blending={2} toneMapped={false} />
      </mesh>
    ))}
    <mesh position={[WIN.x + 0.05, WIN.y, WIN.z]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[WIN.w, WIN.h]} />
      <Glow color="#FFF0D0" opacity={0.55 * strength} />
    </mesh>
  </group>
);

/** The bedroom as a morning set: sun, warm key light from the window, no lamp. */
const MorningRoom: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>
    <Bedroom lampOn={false} dawn />
    <SunShaft />
    <pointLight position={[WIN.x + 1.2, WIN.y + 0.4, WIN.z]} color="#FFD8A0" intensity={34} distance={20} decay={2} />
    <pointLight position={[4, 6.5, 5]} color="#FFF0DC" intensity={22} distance={22} decay={2} />
    <AlarmClock position={CLOCK_POS} yaw={CLOCK_YAW} />
    {children}
  </>
);

/** A duvet over a lying sleeper (head toward -Z on the pillow). */
const Duvet: React.FC<{ rise?: number }> = ({ rise = 0 }) => (
  <mesh position={[BED.x, BED.mattressTop + 0.45 + rise, -0.3]} castShadow receiveShadow>
    <BoxG args={[BED.w - 0.1, 0.9, 3.2]} />
    <Flat color="#5A6EA0" />
  </mesh>
);

/** Slavoski lying asleep on his back (head on the pillow, toward -Z). */
const Sleeper: React.FC<{ blink?: number; breathe?: number }> = ({ blink = 1, breathe = 0 }) => (
  <group position={[BED.x, BED.mattressTop + 0.38 + breathe * 0.03, 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
    <Hero pose={mergePose(REST, { blink, lShoulder: [0, 0.1], rShoulder: [0, 0.1], headPitch: 0.1 })} />
  </group>
);

const clockDigits = (text: string, blinkOn: boolean) => (w: number, h: number) => (
  <div style={{ width: w, height: h, background: "#140404", color: "#FF3A2A", fontFamily: FONT, fontWeight: 700, fontSize: h * 0.56, display: "flex", alignItems: "center", justifyContent: "center", letterSpacing: "0.04em", textShadow: "0 0 12px #FF3A2A", opacity: blinkOn ? 1 : 0.25 }}>
    {text}
  </div>
);

const coldWake: ShotFn = (c) => {
  const cam = move({ position: [9.5, 5.6, 7.8], target: [1.2, 1.8, -1.6] }, { position: [8.3, 5.0, 6.6], target: [1.4, 1.7, -1.8] }, c);
  const on = Math.floor(c.t * 2.2) % 2 === 0;
  return (
    <Shot
      mood="day"
      camera={{ ...cam, fov: 36 }}
      fog={false}
      stars={false}
      keyDir={[-1, 0.7, 0.3]}
      light={0.7}
      shadowSize={12}
      overlay={
        <ScreenHtml c={CLOCK_FACE} w={CLOCK.w} h={CLOCK.h} yaw={CLOCK_YAW} cam={{ ...cam, fov: 36 }} width={c.width} height={c.height}>
          {clockDigits("7:00", on)}
        </ScreenHtml>
      }
    >
      <MorningRoom>
        <Sleeper breathe={Math.sin(c.t * 2)} />
        <Duvet />
      </MorningRoom>
    </Shot>
  );
};

const coldAlarm: ShotFn = (c) => {
  const cam = move({ position: [CLOCK_FACE[0] + 1.9, CLOCK_FACE[1] + 0.7, CLOCK_FACE[2] + 2.6], target: CLOCK_FACE }, { position: [CLOCK_FACE[0] + 1.5, CLOCK_FACE[1] + 0.55, CLOCK_FACE[2] + 2.0], target: CLOCK_FACE }, c);
  const silenced = c.lt > 0.82;
  const on = silenced || Math.floor(c.t * 2.2) % 2 === 0;
  return (
    <Shot
      mood="day"
      camera={{ ...cam, fov: 34 }}
      fog={false}
      stars={false}
      light={0.6}
      shadowSize={6}
      overlay={
        <ScreenHtml c={CLOCK_FACE} w={CLOCK.w} h={CLOCK.h} yaw={CLOCK_YAW} cam={{ ...cam, fov: 34 }} width={c.width} height={c.height}>
          {clockDigits("7:00", on)}
        </ScreenHtml>
      }
    >
      <MorningRoom />
    </Shot>
  );
};

const coldSun: ShotFn = (c) => {
  const cam = move({ position: [-1.5, 3.9, 3.8], target: [WIN.x, WIN.y, WIN.z] }, { position: [-0.2, 3.6, 4.6], target: [WIN.x + 3, 2.4, WIN.z - 0.6] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 40 }} fog={false} stars={false} keyDir={[-1, 0.7, 0.3]} light={0.7} shadowSize={12}>
      <MorningRoom>
        <Sleeper />
        <Duvet />
        {Array.from({ length: 30 }, (_, i) => (
          <mesh key={i} position={[WIN.x + 1 + random(`d${i}`) * 4, 1.5 + random(`dy${i}`) * 3 + Math.sin(c.t * 0.6 + i) * 0.15, WIN.z - 1 + random(`dz${i}`) * 2.4]}>
            <IcoG args={[0.02, 0]} />
            <Glow color="#FFF2D0" />
          </mesh>
        ))}
      </MorningRoom>
    </Shot>
  );
};

const coldStretch: ShotFn = (c) => {
  const cam = move({ position: [6.8, 4.9, 5.0], target: [2.2, 3.1, -2.3] }, { position: [6.2, 4.7, 4.3], target: [2.25, 3.15, -2.3] }, c);
  const up = k01(c.lt, 0.15, 0.7) * (1 - k01(c.lt, 1.5, 2.1));
  const pose = bedPose({
    lShoulder: [0.25 + up * 0.35, 0.25 + up * 2.15],
    rShoulder: [0.25 + up * 0.35, 0.25 + up * 2.15],
    lElbow: 0.5 - up * 0.35,
    rElbow: 0.5 - up * 0.35,
    headPitch: up * 0.25,
    expression: "smile",
    blink: c.lt < 0.3 ? 0.8 : 0,
  });
  return (
    <Shot mood="day" camera={{ ...cam, fov: 38 }} fog={false} stars={false} keyDir={[-1, 0.7, 0.3]} light={0.7} shadowSize={12}>
      <MorningRoom>
        <Hero pose={pose} position={BED_HERO} />
      </MorningRoom>
    </Shot>
  );
};

/** In bed, holding the phone in front of the chest (eps. 4–5 rig placement). */
const PHONE_HAND_TARGET: V3 = [BED.x - 0.3, 2.1, -1.45];
const phoneArm = reach(bedPose({ headPitch: -0.3 }), "r", PHONE_HAND_TARGET).pose;
const coldCheck: ShotFn = (c) => {
  const cam = move({ position: [5.6, 4.2, 3.2], target: [2.0, 2.7, -2.0] }, { position: [5.0, 4.0, 2.4], target: [2.1, 2.75, -2.0] }, c);
  const k = k01(c.lt, 0.1, 0.7);
  const pose = { ...phoneArm, expression: (c.lt > 1.2 ? "worried" : "neutral") as Pose["expression"], headPitch: -0.3 * k, blink: 0 };
  const h = handPosition(pose, "r", BED_HERO);
  const p: V3 = [h[0] + 0.05, h[1] + 0.22 + PHONE.h / 2 - 0.12, h[2]];
  return (
    <Shot mood="day" camera={{ ...cam, fov: 38 }} fog={false} stars={false} keyDir={[-1, 0.7, 0.3]} light={0.7} shadowSize={12}>
      <MorningRoom>
        <Hero pose={pose} position={BED_HERO} />
        <Phone3D position={p} rotation={[-0.7, Math.PI, 0]} glow="#CFE2FF" />
        <pointLight position={[p[0], p[1] + 0.2, p[2] - 0.4]} color="#CFE2FF" intensity={4} distance={4} decay={2} />
      </MorningRoom>
    </Shot>
  );
};

const PHONE_CU: V3 = [BED.x - 0.2, 3.0, 0.9];
const coldMessages: ShotFn = (c) => {
  const swipe = k01(c.lt, 0.7, 1.0);
  return (
    <PhoneCU c={c} at={PHONE_CU} stage={{ keyDir: [-1, 0.7, 0.3], light: 0.6 }} screen={(w, h) => (
      <div style={{ position: "relative", width: w, height: h }}>
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${-swipe * h}px)` }}>
          <LockEmpty w={w} h={h} />
        </div>
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - swipe) * h}px)` }}>
          <MessagesEmpty w={w} h={h} k={k01(c.lt, 1.1, 1.5)} />
        </div>
      </div>
    )}>
      <MorningRoom />
    </PhoneCU>
  );
};

const coldFeed: ShotFn = (c) => (
  <PhoneCU c={c} at={PHONE_CU} stage={{ keyDir: [-1, 0.7, 0.3], light: 0.6 }} push={0.25} screen={(w, h) => <FeedEmpty w={w} h={h} pull={k01(c.lt, 0.1, 0.9) * (1 - k01(c.lt, 1.1, 1.4))} />}>
    <MorningRoom />
  </PhoneCU>
);

const coldCallFriend: ShotFn = (c) => (
  <PhoneCU c={c} at={PHONE_CU} stage={{ keyDir: [-1, 0.7, 0.3], light: 0.6 }} push={0.3} screen={(w, h) => <CallScreen w={w} h={h} name="Sam" k={c.lt > 1.75 ? 1 : 0} t={c.t} />}>
    <MorningRoom />
  </PhoneCU>
);

/** Standing by the window, phone at the ear; lowers it on "Nothing". */
const coldCallFamily: ShotFn = (c) => {
  const hero: V3 = [-3.6, 0, -0.4];
  const yaw = -1.25;
  const lower = k01(c.lt, 1.55, 2.0);
  const base = standing({ expression: lower > 0.5 ? "worried" : "neutral", headYaw: 0.2, headPitch: -0.05 - lower * 0.2 });
  // Phone to the ear: right hand up beside the head; lowered to the chest on "Nothing".
  const pose = mergePose(base, { rShoulder: [1.2 - lower * 0.5, 0.55 - lower * 0.4], rElbow: 2.3 - lower * 1.2 });
  const h = handPosition(pose, "r", hero, yaw);
  const cam = move({ position: [3.2, 4.6, 7.2], target: [-3.4, 3.3, -0.6] }, { position: [2.2, 4.4, 6.0], target: [-3.5, 3.2, -0.6] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 36 }} fog={false} stars={false} keyDir={[-1, 0.7, 0.3]} light={0.7} shadowSize={12}>
      <MorningRoom>
        <Hero pose={pose} position={hero} yaw={yaw} />
        <Phone3D position={[h[0], h[1] + 0.3, h[2]]} rotation={[0, yaw + Math.PI / 2, 0.2]} glow="#CFE2FF" />
      </MorningRoom>
    </Shot>
  );
};

/** Out through the front doors onto the top step, looking around. Bright morning. */
const ENTRANCE_X = 21.35;
const coldStepOut: ShotFn = (c) => {
  const open = k01(c.lt, 0.15, 0.7);
  const walk = clamp01((c.lt - 0.4) / 1.6);
  const { pose: wp } = walking(c.lt, 1.6);
  const looking = c.lt > 2.0;
  const pose = looking ? standing({ headYaw: Math.sin((c.lt - 2.0) * 2.2) * 0.7, expression: "neutral" }) : wp;
  const hero: V3 = [ENTRANCE_X - 1.2 - walk * 3.6, 0.78, 0];
  const cam = move({ position: [ENTRANCE_X - 26, 5.2, 6], target: [ENTRANCE_X - 2, 4.4, 0] }, { position: [ENTRANCE_X - 23, 4.8, 4.5], target: [ENTRANCE_X - 2.5, 4.2, 0] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 38 }} fog={[120, 520]} shadowSize={40}>
      <Avenue />
      <group position={[ENTRANCE_X, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <ApartmentEntrance open={open} />
      </group>
      <Hero pose={pose} position={hero} yaw={-Math.PI / 2} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

/** The reveal: crane up from the hero on the steps to the whole empty avenue and city. */
const coldReveal: ShotFn = (c) => {
  const k = k01(c.lt, 0, 3.0);
  const hero: V3 = [ENTRANCE_X - 4.8, 0.78, 0];
  const a = { position: [ENTRANCE_X + 1, 6.5, 9] as V3, target: [hero[0] - 8, 4.5, -10] as V3, fov: 42 };
  const b = { position: [ENTRANCE_X - 6, 85, 70] as V3, target: [0, 0, -180] as V3, fov: 44 };
  const cam = { position: [lerp(a.position[0], b.position[0], k), lerp(a.position[1], b.position[1], k * k), lerp(a.position[2], b.position[2], k)] as V3, target: [lerp(a.target[0], b.target[0], k), lerp(a.target[1], b.target[1], k), lerp(a.target[2], b.target[2], k)] as V3, fov: lerp(42, 44, k) };
  return (
    <Shot mood="day" camera={cam} fog={[220, 900]} shadowSize={90}>
      <Avenue />
      <group position={[ENTRANCE_X, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <ApartmentEntrance open={1} />
      </group>
      <Hero pose={standing({ headYaw: -0.3 + k * 0.3, headPitch: 0.1 })} position={hero} yaw={-Math.PI / 2 + 0.6} />
      <Sky t={c.t} tint="day" count={24} />
    </Shot>
  );
};

// ================================================================ 01 THE EMPTY CITY

const c1Cars: ShotFn = (c) => {
  const cam = move({ position: [-4, 3.2, 10], target: [6, 2.0, -40] }, { position: [-6, 2.8, -12], target: [8, 2.4, -70] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 40 }} fog={[150, 700]} shadowSize={60}>
      <Avenue />
      {/* one driver's door left open */}
      <group scale={S}>
        <mesh position={[AVENUE_CARS[1].x - 0.95, 0.75, AVENUE_CARS[1].z + 0.25]} rotation={[0, -0.9, 0]} castShadow>
          <BoxG args={[0.06, 0.62, 0.95]} />
          <Flat color={P.carTeal} />
        </mesh>
      </group>
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

const c1Shop: ShotFn = (c) => {
  const cam = move({ position: [-14, 5.0, 26], target: [-2, 4.6, 0] }, { position: [4, 4.6, 24], target: [-1, 4.4, 0] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 38 }} fog={[90, 400]} shadowSize={36}>
      <ShopFront position={[0, 0, 0]} name="CORNER GROCER" seed="grocer" door={0.45} />
      <ShopFront position={[-19, 0, 0]} name="BOOKS & CO" color="#2E5A6A" awning="#E0B04E" seed="books" door={0} />
      <ShopFront position={[19, 0, 0]} name="PHARMACY" color="#566270" awning="#2F7A5A" seed="pharm" door={0.2} />
      {/* pavement and road in front */}
      <mesh position={[0, 0.12, 6]} receiveShadow>
        <BoxG args={[200, 0.24, 12]} />
        <Flat color={P.pavement} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 30]} receiveShadow>
        <planeGeometry args={[400, 60]} />
        <Flat color={P.road} />
      </mesh>
      <group position={[0, 0, 40]} rotation={[0, Math.PI, 0]}>
        <ShopFront position={[0, 0, 0]} name="BAKERY" color="#7A5A44" seed="bakery" />
      </group>
      <CityRing />
    </Shot>
  );
};

const c1Cafe: ShotFn = (c) => {
  const cam = move({ position: [12, 5.6, 9], target: [0, 2.8, -3] }, { position: [9, 5.0, 6.5], target: [0, 2.8, -3] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 40 }} fog={false} stars={false} light={0.8} shadowSize={20}>
      <Cafe t={c.t} />
    </Shot>
  );
};

/** In the middle of the avenue: a slow push from a wide to a close-up as the thought arrives. */
const c1Realise: ShotFn = (c) => {
  const k = prog(c);
  const hero: V3 = [0, 0, -20];
  const expression: Pose["expression"] = c.lt < 1.2 ? "neutral" : c.lt < 3.2 ? "worried" : "alarm";
  const pose = standing({ expression, headYaw: Math.sin(c.lt * 0.8) * 0.25 * (1 - k), headPitch: 0.05 });
  const cam = { position: [lerp(3, 1.2, k), lerp(5.5, 3.9, k), lerp(-2, -12.5, k)] as V3, target: [0, lerp(3.2, 3.7, k), -20] as V3, fov: lerp(40, 30, k) };
  return (
    <Shot mood="day" camera={cam} fog={[150, 700]} shadowSize={50}>
      <Avenue />
      <Hero pose={pose} position={hero} yaw={0.05} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

/** Top-down: the camera rises straight up from the hero at an intersection until he is a dot in the grid. */
const c1Aerial: ShotFn = (c) => {
  const k = k01(c.lt, 0, Math.min(c.dur, 4));
  const h = lerp(26, 340, k * k);
  return (
    <Shot mood="day" camera={{ position: [0.01, h, 0.01], target: [0, 0, 0], up: [0, 0, -1], fov: 46 }} fog={[400, 1400]} shadowSize={160} stars={false}>
      <group scale={S}>
        <CityGrid seed="lastcity" blocks={10} block={14} modify={() => ({ power: 0.3 })} />
      </group>
      <Hero pose={standing({ headPitch: 0.5, expression: "worried" })} position={[0, 0, 0]} yaw={0.4} />
      <AvenueCars />
      <Sky t={c.t} tint="day" y={60} count={10} />
    </Shot>
  );
};

// ================================================================ 02 IS ANYONE THERE?

const c2Hurry: ShotFn = (c) => {
  const { pose: wp } = walking(c.lt, 2.6, { expression: "worried" });
  const pose = mergePose(wp, { headYaw: Math.sin(c.lt * 2.8) * 0.6 });
  const z = -40 + c.lt * 2.6;
  const cam = move({ position: [6, 4.6, z + 14], target: [14.5, 3.6, z - 1] }, { position: [6.5, 4.4, z + 17], target: [14.5, 3.6, z + 2] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 38 }} fog={[150, 700]} shadowSize={50}>
      <Avenue />
      <Hero pose={pose} position={[13.8, 0.24, z]} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

/** Knocking on a neighbour's door in the suburb (house at x = -26, door facing +X at x ≈ -18.5). */
const c2Knock: ShotFn = (c) => {
  const knock = Math.max(0, Math.sin(c.lt * 9)) * (c.lt < 0.9 ? 1 : 0);
  const pose = mergePose(standing({ expression: "worried", headPitch: 0.05 }), { rShoulder: [1.5, 0.15], rElbow: 1.3 + knock * 0.5 });
  const hero: V3 = [-16.4, 0, -4];
  const cam = move({ position: [-4, 5.0, 8], target: [-17, 4.0, -4.5] }, { position: [-5, 4.6, 5], target: [-17, 4.0, -4.5] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 36 }} fog={[120, 600]} shadowSize={40}>
      <Suburb seed="search" />
      <Hero pose={pose} position={hero} yaw={-Math.PI / 2} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

const c2Hospital: ShotFn = (c) => {
  const { pose } = walking(c.lt, 3.2, { expression: "worried" });
  const z = 22 - c.lt * 3.2;
  const cam = move({ position: [26, 6, 40], target: [0, 6, 0] }, { position: [20, 5.6, 36], target: [0, 6, 0] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 40 }} fog={[150, 600]} shadowSize={60}>
      <Hospital />
      <Ambulance position={[14, 0, 12]} yaw={-0.4} doorsOpen={1} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 20]} receiveShadow>
        <planeGeometry args={[600, 300]} />
        <Flat color={P.pavement} />
      </mesh>
      <Hero pose={pose} position={[-1.5, 0, z]} yaw={Math.PI} />
      <CityRing />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

const c2Police: ShotFn = (c) => {
  const cam = move({ position: [-6, 4.2, 22], target: [0, 4.6, 0] }, { position: [-3, 4.4, 18], target: [0, 4.8, 0] }, c);
  const pose = mergePose(standing({ expression: "worried", headPitch: 0.05 }), { lShoulder: [1.2, 0.05], lElbow: 1.8, rShoulder: [1.2, 0.05], rElbow: 1.8 });
  return (
    <Shot mood="day" camera={{ ...cam, fov: 38 }} fog={[120, 600]} shadowSize={40}>
      <PoliceStation t={c.t} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 20]} receiveShadow>
        <planeGeometry args={[600, 300]} />
        <Flat color={P.pavement} />
      </mesh>
      <Hero pose={pose} position={[0.8, 0, 1.6]} yaw={Math.PI} />
      <CityRing />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

/** Driving the suburb in an open-top car, one arm up, shouting. */
const c2Drive: ShotFn = (c) => {
  const z = 30 - c.lt * 9;
  const shout = 0.5 + 0.5 * Math.sin(c.lt * 3.5);
  const car: V3 = [-3.5, 0, z];
  const cam = move({ position: [-12, 6.0, z - 17], target: [-3.0, 3.6, z] }, { position: [-10.5, 5.6, z - 14], target: [-3.0, 3.6, z] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 40 }} fog={[140, 600]} shadowSize={50} keyDir={[0.8, 0.35, -0.5]}>
      <Suburb seed="drive" />
      <Convertible position={car} yaw={Math.PI} color="#24748F" spin={-c.lt * 9} driver={drivingPose({ blink: 0 }, shout)} />
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

const c2DriveAerial: ShotFn = (c) => {
  const z = 10 - c.lt * 10;
  const cam = move({ position: [30, 70, z + 40], target: [-3.5, 0, z - 10] }, { position: [24, 64, z + 30], target: [-3.5, 0, z - 14] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 42 }} fog={[200, 900]} shadowSize={80} keyDir={[0.8, 0.35, -0.5]}>
      <Suburb seed="drive" length={420} />
      <Convertible position={[-3.5, 0, z]} yaw={Math.PI} color="#24748F" spin={-c.lt * 9} driver={drivingPose({}, 0.6)} />
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

const c2Nobody: ShotFn = (c) => {
  const k = prog(c);
  const pose = standing({ expression: "worried", headYaw: Math.sin(c.lt * 0.9) * 0.4, headPitch: -0.05 - k * 0.15 });
  const cam = { position: [lerp(-26, -21, k), lerp(8, 6.5, k), lerp(18, 13, k)] as V3, target: [0, 3.2, -10] as V3, fov: 40 };
  return (
    <Shot mood="sunset" camera={cam} fog={[140, 600]} shadowSize={50} keyDir={[0.8, 0.35, -0.5]}>
      <Suburb seed="drive" />
      <Convertible position={[-3.5, 0, -22]} yaw={Math.PI} color="#24748F" />
      <Hero pose={pose} position={[2.5, 0, -6]} yaw={-0.9} />
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

// ================================================================ 03 THE MACHINES KEEP RUNNING

/** Dusk: an empty junction, traffic lights still cycling for nobody. */
const c3Junction: ShotFn = (c) => {
  const cam = move({ position: [-20, 7, 34], target: [2, 7, -10] }, { position: [-14, 6.4, 28], target: [3, 7, -10] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 40 }} fog={[120, 700]} shadowSize={60} keyDir={[0.8, 0.3, -0.5]}>
      <Avenue day={false} power={0.7} lampsOn ring={0.6} />
      <TrafficLight position={[13.5, 0.24, 6]} yaw={Math.PI / 2} t={c.t} />
      <TrafficLight position={[-13.5, 0.24, -12]} yaw={0} t={c.t} phase={5} />
      <TrafficLight position={[13.5, 0.24, -12]} yaw={Math.PI} t={c.t} phase={5} />
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

const c3Power: ShotFn = (c) => {
  const cam = move({ position: [-60, 18, 80], target: [0, 14, 0] }, { position: [-48, 16, 66], target: [0, 15, 0] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 40 }} fog={[150, 800]} shadowSize={80} keyDir={[0.8, 0.3, -0.5]}>
      <group scale={S}>
        <PowerStation position={[0, 0, 0]} on={1} t={c.t} />
      </group>
      {[0, 1, 2, 3].map((i) => (
        <Pylon key={i} position={[-30 - i * 45, 0, 40 + i * 30]} h={34} />
      ))}
      {[0, 1].map((i) => (
        <SmokeCluster key={i} position={[8 + i * 10, 46, -6]} progress={((c.t * 0.12 + i * 0.5) % 1)} radius={5} rise={18} color="#E8E4E8" seed={`st${i}`} />
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[1200, 1200]} />
        <Flat color="#4A6A44" />
      </mesh>
      <CityRing radius={170} power={0.7} />
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

const c3Tap: ShotFn = (c) => {
  const flow = k01(c.lt, 0.45, 0.75);
  const hero: V3 = [1.3, 0, -0.35];
  const handTarget: V3 = [0.32, 2.95, -2.55];
  const pose = reach(standing({ headPitch: -0.35, expression: "neutral" }), "r", handTarget, { position: hero, yaw: Math.PI }).pose;
  const cam = move({ position: [-3.4, 3.9, 1.2], target: [0.2, 2.6, -2.2] }, { position: [-2.8, 3.6, 0.5], target: [0.2, 2.5, -2.2] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.7} shadowSize={10}>
      <Kitchen t={c.t} flow={flow} sky="#F7C0A0" />
      <Hero pose={pose} position={hero} yaw={Math.PI} />
    </Shot>
  );
};

const c3Internet: ShotFn = (c) => {
  const lp: V3 = [KITCHEN.table[0] + 0.3, KITCHEN.tableTop, KITCHEN.table[2] + 0.1];
  const yaw = 0.3;
  const scr = laptopScreen(lp, yaw);
  const cam = move({ position: [lp[0] + 1.6, lp[1] + 1.4, lp[2] + 3.4], target: [scr.c[0], scr.c[1] - 0.1, scr.c[2]] }, { position: [lp[0] + 1.2, lp[1] + 1.2, lp[2] + 2.7], target: [scr.c[0], scr.c[1] - 0.1, scr.c[2]] }, c);
  const scroll = k01(c.lt, 0.4, 2.0);
  return (
    <Shot
      mood="sunset"
      camera={{ ...cam, fov: 38 }}
      fog={false}
      stars={false}
      light={0.6}
      shadowSize={8}
      overlay={
        <ScreenHtml c={scr.c} w={1.5} h={0.95} yaw={yaw} cam={{ ...cam, fov: 38 }} width={c.width} height={c.height}>
          {(w, h) => <NewsPage w={w} h={h} scroll={scroll} />}
        </ScreenHtml>
      }
    >
      <Kitchen t={c.t} laptop sky="#F7C0A0" />
    </Shot>
  );
};

/** A generic news page that hasn't been updated since yesterday. */
const NewsPage: React.FC<{ w: number; h: number; scroll: number }> = ({ w, h, scroll }) => (
  <div style={{ width: w, height: h, background: "#F4F2EC", fontFamily: FONT, color: "#1A1E2C", overflow: "hidden", position: "relative" }}>
    <div style={{ height: h * 0.12, background: "#1D274B", color: "#F6EBC4", display: "flex", alignItems: "center", padding: `0 ${w * 0.04}px`, fontWeight: 700, fontSize: h * 0.06, letterSpacing: "0.08em" }}>
      THE DAILY NEWS
      <span style={{ marginLeft: "auto", fontSize: h * 0.04, fontWeight: 400, opacity: 0.8 }}>● Connected</span>
    </div>
    <div style={{ transform: `translateY(${-scroll * h * 0.35}px)`, padding: `${h * 0.04}px ${w * 0.04}px` }}>
      <div style={{ fontSize: h * 0.04, color: "#C8372D", fontWeight: 700 }}>LAST UPDATED: YESTERDAY, 11:52 PM</div>
      <div style={{ marginTop: h * 0.02, fontSize: h * 0.075, fontWeight: 700, lineHeight: 1.1 }}>Weekend weather: sunny spells expected</div>
      <div style={{ display: "flex", gap: w * 0.03, marginTop: h * 0.04 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ height: h * 0.2, background: ["#9AA1B0", "#B39A62", "#24748F"][i], borderRadius: 4 }} />
            <div style={{ height: h * 0.025, background: "#C8C4BA", marginTop: h * 0.02, width: "90%" }} />
            <div style={{ height: h * 0.025, background: "#D8D4CA", marginTop: h * 0.012, width: "70%" }} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: h * 0.05, fontSize: h * 0.05, color: "#5A5E68" }}>No new stories</div>
    </div>
  </div>
);

/** Street lamps switching themselves on one after another down the empty avenue. */
const c3Lamps: ShotFn = (c) => {
  const cam = move({ position: [-6, 9, 30], target: [4, 7, -60] }, { position: [-4, 8, 22], target: [4, 7, -70] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 40 }} fog={[120, 650]} shadowSize={60} keyDir={[0.8, 0.25, -0.5]} light={0.8}>
      <BigStreet seed="avenue" lamps={false} cars={false} power={0.75} />
      <AvenueCars />
      <group scale={S}>
        {Array.from({ length: 9 }, (_, i) => {
          const on = c.lt > 0.25 + i * 0.16;
          return (
            <React.Fragment key={i}>
              <Lamp position={[3.5 + 0.5, 0.12, 2 - i * 11]} on={on} />
              <Lamp position={[-(3.5 + 0.5), 0.12, -3.5 - i * 11]} on={c.lt > 0.33 + i * 0.16} />
            </React.Fragment>
          );
        })}
      </group>
      <CityRing power={0.6} />
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

/** Automatic doors opening for a drifting plastic bag. */
const c3Doors: ShotFn = (c) => {
  const bagX = lerp(-8, 10, prog(c));
  const near = Math.abs(bagX - (18 / 2 - 3.2)) < 4.5;
  const open = near ? 1 : 0;
  const cam = move({ position: [-2, 4.5, 20], target: [3, 4, 0] }, { position: [1, 4.2, 17], target: [4, 4, 0] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 40 }} fog={[90, 500]} shadowSize={30} keyDir={[0.8, 0.25, -0.5]}>
      <ShopFront position={[0, 0, 0]} name="SUPERMARKET" color="#2E5A6A" awning="#E0B04E" seed="mart" sliding={open} open={false} />
      <mesh position={[0, 0.12, 6]} receiveShadow>
        <BoxG args={[200, 0.24, 12]} />
        <Flat color={P.pavement} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 40]} receiveShadow>
        <planeGeometry args={[400, 70]} />
        <Flat color={P.road} />
      </mesh>
      <PlasticBag position={[bagX, 0.6, 3.2]} t={c.t} />
      <CityRing power={0.6} />
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

/** On the rooftop at dusk, the lit city still humming below. */
const c3Rooftop: ShotFn = (c) => {
  const roofY = 52;
  const hero: V3 = [0, roofY, 6];
  const cam = move({ position: [6, roofY + 7, 26], target: [0, roofY + 2, -60] }, { position: [3, roofY + 5.5, 17], target: [0, roofY + 2, -60] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 40 }} fog={[150, 900]} shadowSize={40} keyDir={[0.8, 0.22, -0.5]} light={0.75}>
      <group position={[0, roofY, 0]}>
        <Rooftop />
      </group>
      <group position={[0, 0, -80]} scale={S}>
        <CityGrid seed="dusk" blocks={8} block={14} modify={() => ({ power: 1 })} />
      </group>
      <CityRing power={1} radius={190} />
      <Hero pose={standing({ headPitch: -0.1 })} position={hero} yaw={Math.PI} />
      <Sky t={c.t} tint="sunset" y={70} />
    </Shot>
  );
};

// ================================================================ cues

export const ACT1: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldWake },
    { cue: "Your alarm", fn: coldAlarm },
    { cue: "Sunlight", fn: coldSun },
    { cue: "Everything seems", fn: coldStretch },
    { cue: "Until", fn: coldCheck },
    { cue: "No new messages", fn: coldMessages },
    { cue: "Nobody has posted", fn: coldFeed },
    { cue: "You call your best", fn: coldCallFriend },
    { cue: "You call your family", fn: coldCallFamily },
    { cue: "You step outside", fn: coldStepOut },
    { cue: "outside", fn: coldReveal, offset: 1.6 },
  ],
  c1: [
    { cue: "Cars sit", fn: c1Cars },
    { cue: "The shops", fn: c1Shop },
    { cue: "but nobody", fn: c1Cafe },
    { cue: "And slowly", fn: c1Realise },
    { cue: "What if", fn: c1Aerial },
  ],
  c2: [
    { cue: null, fn: c2Hurry },
    { cue: "You search houses", fn: c2Knock },
    { cue: "hospitals", fn: c2Hospital },
    { cue: "police stations", fn: c2Police },
    { cue: "You drive", fn: c2Drive },
    { cue: "shouting", fn: c2DriveAerial },
    { cue: "But nobody does", fn: c2Nobody },
  ],
  c3: [
    { cue: null, fn: c3Junction },
    { cue: "Electricity is", fn: c3Power },
    { cue: "Water still", fn: c3Tap },
    { cue: "The internet", fn: c3Internet },
    { cue: "Humanity has vanished", fn: c3Lamps },
    { cue: "But the machines", fn: c3Doors },
    { cue: "So what happens", fn: c3Rooftop },
  ],
};

export { CONV, Laptop };
