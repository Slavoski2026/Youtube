/**
 * Shots for "What If Every Fish Learned to Walk?" (ep. 8).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * The hook is personal (not Earth from space): the kitchen clock flips to 8:00 and the goldfish grows legs.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Building, Car, Ground, Lamp, PineTree, Road, StreetSet } from "../../slavoski/city";
import { BoxG, ConeG, IcoG } from "../../slavoski/detail";
import { crowdLook, POLICE_OFFICER } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Clouds, LeafyTree, Rain } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { DIM, handPosition, headPosition, Hero, mergePose, reach, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { sittingPose } from "../../slavoski/room";
import { ScreenHtml } from "../../slavoski/screens";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import { wordAt, type CuedShot } from "../../slavoski/timeline";
import { PalmTree } from "../gta-24h/props";
import { HillRing, Skyline } from "../no-work-2036/props";
import { Lighthouse, Quay, Sea } from "../satellites-dark/props";
import { Capitol } from "../smart-animals/props";
import { Phone3D, Siren, Trolley } from "../ww3-countdown/props";
import { Fish, FishSwarm, parallelLanes, radialLanes, type FishKind, type Lane } from "./fish";
import {
  EmptyNet,
  FishAndChips,
  FishBar,
  FishBowl,
  FishingBoat,
  FishingRod,
  FishStall,
  FryingPan,
  Kitchen,
  KITCHEN,
  KitchenChair,
  KitchenTable,
  LifeguardTower,
  Microwave,
  NoonBeach,
  PotHelmet,
  RiotShield,
  River,
  RIVER,
  RoadSign,
  Sandbags,
  ShopFront,
  SonarScreen,
  SupermarketFront,
  Umbrella,
} from "./props";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
/** Time of a phrase (s), searched from `from`. */
const cueT = (c: ShotCtx, phrase: string, from: number, fb: number) => wordAt(c.words, phrase, from, fb);

/** Human-scale cars (kit cars ×2.6: ~8 long, ~3.6 tall next to Slavoski's 4.2). */
const CAR_S = 2.6;
const BigCar: React.FC<{ position: V3; yaw?: number; color?: string; lights?: boolean; police?: boolean; t?: number }> = ({ position, yaw = 0, color, lights, police, t }) => (
  <group position={position} scale={CAR_S}>
    <Car position={[0, 0, 0]} yaw={yaw} color={color} lights={lights} police={police} t={t} />
  </group>
);

/** Kit street ×3.5 (road |x| < 12.25, pavements to 21.35). `day` dims practicals; `cross` clears a cross street (world z range). */
const CITY = 3.5;
const BigStreet: React.FC<React.ComponentProps<typeof StreetSet> & { day?: boolean; cross?: [number, number]; colors?: string[] }> = ({ day = false, cross, colors, ...props }) => (
  <group scale={CITY}>
    <StreetSet
      {...props}
      cars={false}
      lampsOn={day ? false : props.lampsOn}
      modify={(sp, i) => {
        const z0 = sp.position[2] - (sp.d ?? 3.4) / 2;
        const z1 = sp.position[2] + (sp.d ?? 3.4) / 2;
        const hide = cross && z1 * CITY > cross[0] && z0 * CITY < cross[1];
        return {
          ...(day ? { power: 0.35 } : {}),
          ...(colors ? { color: colors[i % colors.length] } : {}),
          ...(hide ? { sink: 1.05 } : {}),
          ...(props.modify?.(sp, i) ?? {}),
        };
      }}
    />
  </group>
);

const Shot: React.FC<{ children: React.ReactNode; overlay?: React.ReactNode } & React.ComponentProps<typeof Stage>> = ({ children, overlay, ...stage }) => (
  <AbsoluteFill>
    <Stage {...stage}>{children}</Stage>
    {overlay}
  </AbsoluteFill>
);

const CLOUD = { day: "#F4F6FA", sunset: "#F7C0A0", overcast: "#AEB6C2", storm: "#3E4656", night: "#2A3048" } as const;
const Sky: React.FC<{ t: number; tint: keyof typeof CLOUD; y?: number; radius?: number; count?: number; seed?: string }> = ({ t, tint, y = 45, radius = 200, count = 16, seed = "sky" }) => (
  <Clouds t={t} color={CLOUD[tint]} y={y} radius={radius} count={count} seed={seed} />
);

/** Seeded street-lamp row for sets where the kit lamps would stand in the way. */
const LampRow: React.FC<{ x: number; z0: number; z1: number; step?: number; on?: boolean; yaw?: number }> = ({ x, z0, z1, step = 34, on = true, yaw = 0 }) => (
  <>
    {Array.from({ length: Math.max(1, Math.floor((z1 - z0) / step) + 1) }, (_, i) => (
      <group key={i} position={[x, 0, z0 + i * step]} scale={CITY}>
        <Lamp position={[0, 0.12, 0]} on={on} yaw={yaw} />
      </group>
    ))}
  </>
);

/** An ice cream cone held at a hand. */
const IceCream: React.FC<{ at: V3 }> = ({ at }) => (
  <group position={at}>
    <mesh position={[0, 0.25, 0]} rotation={[Math.PI, 0, 0]} castShadow>
      <ConeG args={[0.2, 0.55, 6]} />
      <Flat color="#D9A25A" />
    </mesh>
    <mesh position={[0, 0.62, 0]} castShadow>
      <IcoG args={[0.24, 1]} />
      <Flat color="#F4C8D8" />
    </mesh>
  </group>
);

// ---------------------------------------------------------------- cold open: the kitchen at 8 AM

/** Kitchen layout used by the hook: microwave right of the bowl, Slavoski at the table on the left. */
const MW: V3 = [3.4, KITCHEN.counterY, -3.45];
const BOWL: V3 = KITCHEN.bowl;
const KitchenSet: React.FC<{ t: number; clock: string; flash?: number }> = ({ t, clock, flash = 0 }) => (
  <>
    <Kitchen t={t} />
    <Microwave position={MW} text={clock} flash={flash} />
    <FishBowl position={BOWL} />
  </>
);

/** 0 s: the microwave clock: 7:59 → 8:00 on "8:00". */
const coldClock: ShotFn = (c) => {
  const flip = cueT(c, "8:00", 0, 0.95);
  const on = c.t >= flip;
  const flash = on ? Math.max(0, 1 - (c.t - flip) / 0.35) : 0;
  const disp: V3 = [MW[0] + 0.66, MW[1] + 0.78, MW[2] + 0.63];
  const cam = move({ position: [disp[0] - 0.25, disp[1] + 0.32, disp[2] + 2.0], target: [disp[0] - 0.12, disp[1] - 0.05, disp[2]] }, { position: [disp[0] - 0.18, disp[1] + 0.24, disp[2] + 1.45], target: [disp[0] - 0.1, disp[1] - 0.04, disp[2]] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} stars={false} shadowSize={8} shake={flash * 0.01}>
      <KitchenSet t={c.t} clock={on ? "8:00" : "7:59"} flash={flash} />
    </Shot>
  );
};

/** The goldfish swims… legs pop out on "suddenly", it stands on the gravel and looks at us. */
const GOLD = 0.5;
const coldBowl: ShotFn = (c) => {
  const pop = cueT(c, "suddenly", 1.5, 2.93) - (c.t - c.lt);
  const legs = c.lt < pop ? 0 : Math.min(1.12, ease(clamp01((c.lt - pop) / 0.18)) * 1.12) - Math.max(0, (c.lt - pop - 0.18) / 0.15) * 0.12;
  const legK = clamp01(legs);
  // swimming loop inside the bowl, then sinking to stand on the gravel
  const a = c.lt * 1.6;
  const swim: V3 = [BOWL[0] + Math.sin(a) * 0.22, BOWL[1] + 0.52 + Math.sin(c.lt * 3) * 0.03, BOWL[2] + Math.cos(a) * 0.16];
  const stand: V3 = [BOWL[0] + 0.02, BOWL[1] + 0.13, BOWL[2] + 0.05];
  const k = k01(c.lt, pop + 0.05, pop + 0.45);
  const pos = lerp3(swim, stand, k);
  const yawSwim = a + Math.PI / 2;
  const yaw = lerp(yawSwim % (Math.PI * 2), 1.15, k);
  const stepping = c.lt > pop + 0.6;
  const cam = move({ position: [BOWL[0] + 0.5, BOWL[1] + 1.5, BOWL[2] + 4.6], target: [BOWL[0], BOWL[1] + 0.95, BOWL[2]] }, { position: [BOWL[0] + 0.35, BOWL[1] + 1.35, BOWL[2] + 3.9], target: [BOWL[0], BOWL[1] + 0.9, BOWL[2]] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} stars={false} shadowSize={6}>
      <KitchenSet t={c.t} clock="8:00" />
      <Fish
        kind="goldfish"
        position={pos}
        yaw={yaw}
        scale={GOLD}
        legs={legK}
        walk={stepping ? (c.lt - pop - 0.6) * 1.6 : 0}
        amount={stepping ? 0.6 : 0}
        wag={c.lt < pop ? Math.sin(c.lt * 9) * 0.4 : 0}
        fins={c.lt < pop ? 0.2 + Math.sin(c.lt * 6) * 0.2 : 0.6}
        face={{ eyeOpen: c.lt > pop && c.lt < pop + 0.8 ? 1.35 : 1, look: c.lt > pop + 0.8 ? [-0.2, 0] : [0, 0], mouth: c.lt > pop && c.lt < pop + 0.8 ? 0.6 : 0.1 }}
      />
    </Shot>
  );
};

/** "At first, nobody notices": Slavoski on his phone at the table; behind him the goldfish strolls off along the counter. */
const KHERO: V3 = [-1.9, 0, -0.7];
const seatedPhone = () => {
  const base = sittingPose({ headPitch: -0.42, lShoulder: [0.55, 0.1], lElbow: 1.0, expression: "neutral" });
  const { pose } = reach(base, "r", [KHERO[0] + 0.2, 2.0, KHERO[2] + 1.45], { position: KHERO });
  const hp = handPosition(pose, "r", KHERO);
  return { pose, phone: [hp[0], hp[1] + 0.26, hp[2] + 0.05] as V3 };
};
const c1Kitchen: ShotFn = (c) => {
  const { pose, phone } = seatedPhone();
  const seatY = DIM.hipY + pose.bob - 0.32;
  // the goldfish: hops off the bowl rim at the start, then strolls right along the counter
  const hop = k01(c.lt, 0, 0.35);
  const x = BOWL[0] - 0.75 - c.lt * 0.62;
  const y = KITCHEN.counterY + Math.sin(hop * Math.PI) * 0.4 * (1 - hop) + 0;
  const cam = move({ position: [-0.6, 3.9, 10.5], target: [-0.9, 2.5, -2] }, { position: [-0.5, 3.8, 9.4], target: [-0.9, 2.5, -2] }, c);
  return (
    <Shot mood="day" camera={cam} fog={false} stars={false} shadowSize={10}>
      <KitchenSet t={c.t} clock="8:00" />
      <KitchenTable position={[KHERO[0], 0, KHERO[2] + 1.8]} />
      <KitchenChair position={[KHERO[0], 0, KHERO[2] - 0.15]} seatY={seatY} />
      <Hero pose={mergePose(pose, { blink: c.lt > 1.2 && c.lt < 1.3 ? 1 : 0 })} position={KHERO} />
      <Phone3D position={phone} rotation={[-0.9, Math.PI, 0]} glow="#8FB3D9" />
      <Fish kind="goldfish" position={[x, y, -2.62]} yaw={-Math.PI / 2 + 0.25} scale={GOLD} walk={c.lt * 2.2} amount={1} fins={0.5} face={{ look: [0.2, 0] }} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 the first step (sunny morning)

const RiverBack: React.FC<{ t: number }> = ({ t }) => (
  <>
    <River t={t} />
    <HillRing color="#5A8A5A" radius={260} />
    {Array.from({ length: 14 }, (_, i) => (
      <React.Fragment key={i}>
        <LeafyTree position={[-70 + i * 11 + random(`rt${i}`) * 4, 0, RIVER.z0 - RIVER.w - 6 - random(`rz${i}`) * 10]} scale={3.2 + random(`rs${i}`)} seed={`rv${i}`} />
        {i % 3 === 0 ? <PineTree position={[-64 + i * 11, 0, RIVER.z0 - RIVER.w - 20]} scale={4} /> : null}
      </React.Fragment>
    ))}
  </>
);

/** "Until a salmon climbs out of the river": it hauls itself up the bank; the angler beside it stares. */
const ANGLER: V3 = [5.2, 0, 0.4];
const c1River: ShotFn = (c) => {
  const climb = k01(c.lt, 0.1, 0.9);
  const walkK = clamp01((c.lt - 0.75) / 0.3);
  const p0: V3 = [0.2, RIVER.water - 1.2, -4.6];
  const p1: V3 = [0.2, 0, -0.9];
  const walkDist = Math.max(0, c.lt - 0.9) * 1.6;
  const pos: V3 = c.lt < 0.9 ? lerp3(p0, p1, climb) : [p1[0] - walkDist * 0.94, 0, p1[2] + walkDist * 0.34];
  const yaw = lerp(0, -1.22, walkK);
  const look = clamp01((c.lt - 0.4) / 0.4);
  const anglerPose = mergePose(REST, { headYaw: -1.1 * look, headPitch: -0.15, expression: look > 0.5 ? "alarm" : "neutral" });
  const yawA = Math.PI + 0.2;
  const rodPose = reach(anglerPose, "r", [ANGLER[0] - 0.35, 2.4, ANGLER[2] - 0.9], { position: ANGLER, yaw: yawA }).pose;
  const hand = handPosition(rodPose, "r", ANGLER, yawA);
  const cam = move({ position: [-4.6, 2.2, 10.5], target: [1.2, 1.4, -2.2] }, { position: [-4.2, 2.0, 9.2], target: [0.6, 1.3, -1.6] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[40, 320]} stars={false} shadowSize={18}>
      <RiverBack t={c.t} />
      <Sky t={c.t} tint="day" seed="river" />
      <Fish kind="salmon" position={pos} yaw={yaw} pitch={c.lt < 0.9 ? 0.45 * (1 - climb * 0.9) : 0} walk={c.lt * 1.6} amount={c.lt < 0.9 ? 0.8 : 1} fins={0.4} face={{ look: [0.1, 0.1] }} />
      <Hero pose={rodPose} position={ANGLER} yaw={yawA} look={{ ...crowdLook(7), jacket: "#3A6A4A", jacketShade: "#2E583C" }} />
      <FishingRod hand={hand} tip={[hand[0] - 2.2, hand[1] + 2.4, hand[2] - 3.4]} bob={[hand[0] - 3.4, RIVER.water + 0.05, hand[2] - 6.5]} />
    </Shot>
  );
};

/** "…and casually walks into a supermarket": the doors slide open for it; a shopper with a trolley stares. */
const c1Mart: ShotFn = (c) => {
  const z = 13 - c.lt * 4.6;
  const open = k01(z, 8, 4.5);
  const shopper: V3 = [-4.6, 0, 5.2];
  const cz = Math.max(z + 7.5, 12.5);
  const cam: CameraSpec = { position: [1.5, 1.0, cz], target: [0.8, 2.4, cz - 16] };
  return (
    <Shot mood="day" camera={cam} fog={[40, 300]} stars={false} shadowSize={22}>
      <Ground color="#8E96A6" />
      <SupermarketFront open={open} />
      <Sky t={c.t} tint="day" seed="mart" />
      <BigCar position={[14, 0, 12]} yaw={0.1} color={P.carTeal} />
      <BigCar position={[-15, 0, 14]} yaw={-0.05} color="#E8E4DA" />
      <Fish kind="salmon" position={[0.9 + Math.sin(c.lt * 2) * 0.1, 0, z]} yaw={Math.PI} walk={c.lt * 2.2} amount={1} fins={0.35 + Math.sin(c.lt * 6) * 0.15} face={{ look: [0, 0] }} />
      <Hero pose={mergePose(REST, { headYaw: 0.75, expression: "awe", lShoulder: [0.45, 0.1], rShoulder: [0.45, 0.1], lElbow: 0.9, rElbow: 0.9 })} position={shopper} yaw={0.35} look={crowdLook(12)} />
      <Trolley position={[shopper[0] + 0.55, 0, shopper[2] + 1.7]} yaw={0.35} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 landfall (hot noon beach)

const BeachDress: React.FC<{ t: number }> = ({ t }) => (
  <>
    <NoonBeach />
    <Sky t={t} tint="day" seed="beach" />
    {[-30, -18, 22, 34].map((x, i) => (
      <group key={x} scale={3}>
        <PalmTree position={[x / 3, 0, (24 + (i % 2) * 8) / 3]} height={6} seed={`bp${i}`} sway={Math.sin(t + i) * 0.5} />
      </group>
    ))}
    <LifeguardTower position={[-16, 0, 10]} yaw={0.4} t={t} />
    {[
      [-9, 14, P.carRed],
      [9, 12, "#E0B04E"],
      [18, 18, P.carTeal],
      [-22, 20, "#5A4A78"],
    ].map(([x, z, col], i) => (
      <Umbrella key={i} position={[x as number, 0, z as number]} color={col as string} towel={i % 2 ? "#F6EBC4" : "#8FB3D9"} />
    ))}
  </>
);

/** Lanes out of the sea: start under water at z = -46, climb onto the sand by z = -20, walk to zEnd. */
const BEACH_POLES = [-9, 9, 18, -22, -30, -18, 22, 34];
const clearOfBeach = (x: number) => !BEACH_POLES.some((o) => Math.abs(x - o) < 1.3) && Math.abs(x + 16) > 2.6;
const seaLanes = (n: number, x0: number, x1: number, zEnd: number, seed: string, skip?: (x: number) => boolean, slant = 0): Lane[] =>
  parallelLanes(n, x0, x1, -46, zEnd, -1.8, 0, seed, 0.6)
    .filter((l) => !skip?.(l.from[0]) && (zEnd < 10 || clearOfBeach(l.from[0])))
    .map((l) => ({ from: [l.from[0] - slant, l.from[1], l.from[2]] as V3, to: [l.to[0] + slant, l.to[1], l.to[2]] as V3 }));
const CLIMB = 26;

/** Three hours later, from above: the first fish crawling out of the surf in long lines. */
const c2Coast: ShotFn = (c) => {
  const cam = move({ position: [6, 36, 20], target: [0, 0, -16] }, { position: [5, 33, 17], target: [0, 0, -17] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[60, 420]} stars={false} shadowSize={50}>
      <BeachDress t={c.t} />
      <FishSwarm lanes={seaLanes(26, -40, 40, 24, "coast")} t={c.t} gap={4} climb={CLIMB} size={[1.1, 1.4]} seed="coast" />
    </Shot>
  );
};

/** At the waterline: millions of fish climbing out of the waves toward us. */
const c2Surf: ShotFn = (c) => {
  const cam = move({ position: [1.6, 3.2, 15], target: [0, 1.2, -18] }, { position: [1.2, 3.0, 13], target: [0, 1.1, -18] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[30, 260]} stars={false} shadowSize={24}>
      <BeachDress t={c.t} />
      <FishSwarm lanes={seaLanes(26, -22, 14, 3, "surf", undefined, 14)} t={c.t} gap={1.5} climb={CLIMB} size={[1, 1.3]} seed="surf" />
    </Shot>
  );
};

/** …rivers: fish pouring out of the river onto the meadow. */
const c2River: ShotFn = (c) => {
  const cam = move({ position: [10, 10, 24], target: [0, 0, -5] }, { position: [9, 9, 21], target: [0, 0, -5] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[40, 320]} stars={false} shadowSize={30}>
      <RiverBack t={c.t} />
      <Sky t={c.t} tint="day" seed="river2" />
      <FishSwarm lanes={parallelLanes(24, -26, 26, -16, 22, -1.6, 0, "riv", 0.8)} t={c.t} gap={1.6} climb={15} kinds={["salmon", "mackerel", "cod"]} seed="riv" />
    </Shot>
  );
};

/** "Beaches are completely overrun": Slavoski on his towel, ice cream in hand, fish streaming past on both sides. */
const BHERO: V3 = [0, 0, 6];
const c2Overrun: ShotFn = (c) => {
  const pose = mergePose(REST, { expression: "alarm", headPitch: -0.25, headYaw: Math.sin(c.lt * 3) * 0.25, rShoulder: [0.9, 0.15], rElbow: 1.3, lShoulder: [0.2, 0.9], lElbow: 0.4 });
  const hand = handPosition(pose, "r", BHERO);
  const cam = move({ position: [7, 10.5, 30], target: [0, 2.6, 0] }, { position: [6, 9.5, 26], target: [0, 2.6, 0] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[40, 300]} stars={false} shadowSize={36}>
      <BeachDress t={c.t} />
      <mesh position={[BHERO[0], 0.02, BHERO[2]]} rotation={[-Math.PI / 2, 0, 0.1]} receiveShadow>
        <planeGeometry args={[2.4, 4.6]} />
        <Flat color="#C8372D" />
      </mesh>
      <Hero pose={pose} position={BHERO} />
      <IceCream at={[hand[0], hand[1] + 0.15, hand[2]]} />
      {[
        [-7.5, 9, 20],
        [8, 8, 21],
      ].map(([x, z, s], i) => (
        <Hero key={i} pose={mergePose(REST, { expression: "alarm", lShoulder: [0.2, 2.4], rShoulder: [0.2, 2.4], lElbow: 0.3, rElbow: 0.3, headPitch: -0.3 })} position={[x, 0, z]} yaw={i ? -0.4 : 0.4} look={crowdLook(s)} />
      ))}
      <FishSwarm lanes={seaLanes(30, -26, 26, 21, "over", (x) => Math.abs(x - BHERO[0]) < 1.8 || Math.abs(x + 7.5) < 1.6 || Math.abs(x - 8) < 1.6)} t={c.t} gap={1.25} climb={CLIMB} size={[1, 1.3]} seed="over" />
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 the sharks (clouds rolling in)

/** "Then the sharks start coming": a great white walks out of the surf toward us. */
const c3Shark: ShotFn = (c) => {
  const k = c.lt / 1.8;
  const z = lerp(-26, -9, clamp01(k));
  const y = Math.min(0, -2.6 + (z + 30) * 0.32);
  const cam = move({ position: [0.6, 1.5, 9], target: [0, 3.2, -14] }, { position: [0.4, 1.3, 7.2], target: [0, 3.4, -14] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[30, 240]} stars={false} shadowSize={24} light={0.85}>
      <BeachDress t={c.t} />
      <Sky t={c.t} tint="overcast" seed="sharksky" y={40} />
      <Fish kind="shark" position={[0.5, y, z]} yaw={0.32} walk={c.lt * 0.9} amount={0.9} fins={0.25} face={{ brow: "angry", mouth: 0.55 + Math.sin(c.lt * 3) * 0.15, look: [0.15, -0.05] }} />
      <Fish kind="shark" position={[-9, -2.2 + c.lt * 0.4, -34]} yaw={0.25} walk={c.lt * 0.9} amount={0.7} face={{ brow: "angry" }} />
      {[
        [-5.5, 2, 30],
        [5, 0.5, 31],
      ].map(([x, z, s], i) => (
        <Hero key={i} pose={mergePose(walkPose(c.lt * 2.6 + i * 0.5, 1.6), { expression: "alarm", headYaw: i ? 0.5 : -0.5 })} position={[x, 0, z + c.lt * 4]} yaw={i ? -0.2 : 0.25} look={crowdLook(s)} />
      ))}
    </Shot>
  );
};

/** Coastal town under a darkening sky: two great whites waddling down the high street between parked cars. */
const TOWN = ["#E8C4A0", "#9CC8C0", "#E8A0A0", "#C8D8E8", "#F0E0A8"];
const TownStreet: React.FC<{ t: number }> = ({ t }) => (
  <>
    <BigStreet seed="coast" day trees={false} lamps={false} colors={TOWN} />
    <Sky t={t} tint="overcast" seed="town" y={50} />
    {[-40, -84, -128].map((z, i) => (
      <group key={z} scale={3}>
        <PalmTree position={[-16.5 / 3, 0, z / 3]} height={6} seed={`tp${i}`} sway={Math.sin(t * 1.5 + i)} />
        <PalmTree position={[16.8 / 3, 0, (z - 20) / 3]} height={6} seed={`tq${i}`} sway={Math.sin(t * 1.5 + i + 1)} />
      </group>
    ))}
    <LampRow x={14} z0={-140} z1={20} on={false} yaw={Math.PI / 2} />
  </>
);
const c3Town: ShotFn = (c) => {
  const cam = move({ position: [9, 2.6, 22], target: [-1, 3.6, -2] }, { position: [8.4, 2.5, 20], target: [-1, 3.7, -3] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[30, 260]} stars={false} shadowSize={30}>
      <TownStreet t={c.t} />
      <BigCar position={[9.5, 0, 4]} yaw={0} color={P.carRed} />
      <BigCar position={[-8.5, 0, -18]} yaw={Math.PI} color="#E8E4DA" />
      <Fish kind="shark" position={[-3.0, 0, -3 + c.lt * 2.4]} yaw={0.42} walk={c.lt * 0.85} amount={1} fins={0.3} face={{ brow: "angry", mouth: 0.3 }} />
      <Fish kind="shark" position={[4.5, 0, -32 + c.lt * 2.2]} yaw={-0.25} walk={c.lt * 0.85 + 0.4} amount={1} face={{ brow: "angry", mouth: 0.4 }} />
    </Shot>
  );
};

/** Slavoski peeks over a parked car's bonnet as a shark lumbers past behind it. */
const CHERO: V3 = [14.4, 0, 4.2];
const c3Peek: ShotFn = (c) => {
  const pose = mergePose(REST, { expression: "alarm", headYaw: -0.6 + c.lt * 0.4, lean: 0.25, lHip: [0.5, 0.05], rHip: [0.5, 0.05], lKnee: 0.9, rKnee: 0.9, lShoulder: [1.2, 0.2], rShoulder: [1.2, 0.2], lElbow: 0.9, rElbow: 0.9 });
  const cam = move({ position: [19.6, 4.8, 15], target: [9, 3.3, -1] }, { position: [19.4, 4.7, 14], target: [9, 3.3, -1] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[25, 220]} stars={false} shadowSize={20}>
      <TownStreet t={c.t} />
      <BigCar position={[10.4, 0, 3.6]} yaw={0} color={P.carTeal} />
      <Hero pose={{ ...pose, bob: -0.55 }} position={CHERO} yaw={-1.35} />
      <Fish kind="shark" position={[3, 0, -14 + c.lt * 4]} yaw={0.15} walk={c.lt * 0.9} amount={1} face={{ brow: "angry", mouth: 0.35 }} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 empty seas (day two: drizzle)

const Harbour: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Sea t={t} color="#33505E" />
    <Quay z={0} length={400} />
    {[-50, -26, 22, 46].map((x, i) => (
      <Building key={x} position={[x, 2.2, -38 - (i % 2) * 6]} w={16} d={12} h={12 + i * 4} color={[P.bldgSlate, "#8A6A5A", P.bldgTeal, "#6A5A78"][i]} seed={`hb${i}`} power={0.3} />
    ))}
    <Sky t={t} tint="overcast" seed="harb" y={40} />
  </>
);

/** DAY 2: the fish market. Empty ice, a "NO FISH" board, the fishmonger shrugging in the drizzle. */
const c4Market: ShotFn = (c) => {
  const shrug = k01(c.lt, 0.3, 0.7);
  const pose = mergePose(REST, { expression: "worried", headRoll: 0.12 * shrug, lShoulder: [0.4 * shrug, 0.12 + 0.55 * shrug], rShoulder: [0.4 * shrug, 0.12 + 0.55 * shrug], lElbow: 0.2 + 1.2 * shrug, rElbow: 0.2 + 1.2 * shrug, bob: 0.08 * shrug });
  const cam = move({ position: [5.5, 7.4, 13], target: [0, 5.6, -8] }, { position: [4.6, 7.0, 10.5], target: [0, 5.6, -8] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[18, 160]} stars={false} shadowSize={20} light={0.9}>
      <Harbour t={c.t} />
      <FishStall position={[0, 2.2, -8]} />
      <Hero pose={pose} position={[-1.2, 2.2, -10.4]} look={{ ...crowdLook(21), jacket: "#E8E4DA", jacketShade: "#C8C4BA" }} />
      <FishingBoat position={[-14, 0, 9]} yaw={0.3} t={c.t} color="#24748F" />
      <Rain center={[2, 8, 4]} size={[18, 16, 14]} t={c.t} count={420} thickness={0.025} opacity={0.4} />
    </Shot>
  );
};

/** The trawler hauls up its net: empty, except for an old boot. */
const c4Net: ShotFn = (c) => {
  const cam = move({ position: [8, 5.6, 15.5], target: [2.6, 5.0, 0.6] }, { position: [7.2, 5.4, 14], target: [2.6, 5.4, 0.6] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[20, 180]} stars={false} shadowSize={20} light={0.9}>
      <Sea t={c.t} color="#33505E" />
      <Sky t={c.t} tint="overcast" seed="net" y={40} />
      <FishingBoat position={[-1, 0, -2]} yaw={0.7} t={c.t} roll={0.5} />
      <EmptyNet top={[4.6, 9.6, 2.6]} lift={0.25 + k01(c.lt, 0, 1.0) * 0.75} t={c.t} />
      <Hero pose={mergePose(REST, { expression: "worried", headPitch: 0.4, headYaw: -0.7 })} position={[1.08, 1.75, -1.4]} yaw={0.9} look={{ ...crowdLook(23), jacket: "#E0B04E", jacketShade: "#C09030" }} />
      <Rain center={[3, 7, 6]} size={[16, 14, 12]} t={c.t} count={360} thickness={0.025} opacity={0.4} />
    </Shot>
  );
};

/** Boats coming home in a line through the drizzle; the sonar inset reads NO FISH. */
const c4Boats: ShotFn = (c) => {
  const cam = move({ position: [9, 9, -6], target: [0, 3, 40] }, { position: [8, 8.4, -4], target: [0, 3, 40] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[20, 200]} stars={false} shadowSize={40} light={0.85}>
      <Sea t={c.t} color="#33505E" />
      <Quay z={0} length={400} />
      <Sky t={c.t} tint="overcast" seed="boats" y={40} />
      <mesh position={[-34, 1.5, 44]} castShadow>
        <BoxG args={[8, 3, 60]} />
        <Flat color="#7A7E88" />
      </mesh>
      <Lighthouse position={[-34, 3, 70]} t={c.t} h={20} />
      {[0, 1, 2, 3].map((i) => (
        <FishingBoat key={i} position={[-4 + i * 3.2, 0, 26 + i * 13 - c.lt * 2.2]} yaw={Math.PI + 0.12} t={c.t + i} color={[P.carRed, "#24748F", "#E0B04E", "#2F7A5A"][i]} />
      ))}
      <Rain center={[6, 8, 6]} size={[16, 14, 14]} t={c.t} count={360} thickness={0.025} opacity={0.4} />
    </Shot>
  );
};

/** Inside the wheelhouse: the fish finder sweeps an empty sea floor. */
const c4Sonar: ShotFn = (c) => {
  const S: V3 = [0, 3.2, 0];
  const cam = move({ position: [0.9, 3.7, 4.4], target: [0, 3.0, 0] }, { position: [0.7, 3.6, 3.8], target: [0, 3.0, 0] }, c);
  return (
    <Shot
      mood="overcast"
      camera={cam}
      fog={false}
      stars={false}
      shadowSize={6}
      overlay={
        <ScreenHtml c={[S[0], S[1], S[2] + 0.03]} w={1.6} h={1.0} cam={cam} width={c.width} height={c.height}>
          {(w, h) => <SonarScreen w={w} h={h} t={c.t} />}
        </ScreenHtml>
      }
    >
      <mesh position={[0, 1.4, -0.4]} castShadow receiveShadow>
        <BoxG args={[6, 2.8, 1.2]} />
        <Flat color="#5A6270" />
      </mesh>
      <mesh position={[S[0], S[1], S[2] - 0.06]} castShadow>
        <BoxG args={[1.85, 1.25, 0.16]} />
        <Flat color="#1A1E26" />
      </mesh>
      <mesh position={[0, 4.8, -1.6]}>
        <planeGeometry args={[8, 2.4]} />
        <meshBasicMaterial color="#8A96A6" toneMapped={false} />
      </mesh>
      <mesh position={[0, 3.2, -1.8]}>
        <BoxG args={[10, 8, 0.2]} />
        <Flat color="#E8E4DA" />
      </mesh>
      <pointLight position={[0, 3.3, 1]} color="#7FD6A0" intensity={3} distance={3} decay={2} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 the march (late afternoon → day three sunset)

const Fields: React.FC<{ t: number; tint: "day" | "sunset" }> = ({ t, tint }) => (
  <>
    <Ground color="#6A9A4E" />
    {Array.from({ length: 10 }, (_, i) => (
      <mesh key={i} position={[-120 + (i % 5) * 60, 0.0, -40 - Math.floor(i / 5) * 70]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[56, 64]} />
        <Flat color={["#7AA858", "#B8A866", "#5E8A48", "#A8B06A", "#6A9A4E"][i % 5]} />
      </mesh>
    ))}
    <HillRing color={tint === "day" ? "#4F7A5A" : "#4A5A50"} radius={300} />
    <Sky t={t} tint={tint} seed={`f${tint}`} y={50} />
  </>
);

/** "The fish aren't wandering randomly": tidy single-file lines across the field, all one way. Slavoski scratches his head. */
const FHERO: V3 = [-5, 0, 10];
const c5Lines: ShotFn = (c) => {
  const scratch = Math.sin(c.lt * 14) * 0.06;
  const pose = reach(mergePose(REST, { expression: "worried", headYaw: -0.5, headPitch: -0.1, headRoll: 0.12 }), "r", [FHERO[0] + 0.62 + scratch, 4.35, FHERO[2] - 0.25], { position: FHERO, yaw: -0.4 }).pose;
  const cam = move({ position: [-15, 6, 26], target: [2, 2.6, -8] }, { position: [-13.5, 5.6, 23], target: [2, 2.6, -8] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[50, 380]} stars={false} shadowSize={36} keyDir={[0.8, 0.45, 0.2]}>
      <Fields t={c.t} tint="day" />
      <Skyline radius={260} count={20} seed="far" arc={[Math.PI * 0.88, Math.PI * 1.12]} power={0.3} />
      <FishSwarm lanes={parallelLanes(9, 0, 30, 30, -140, 0, 0, "line")} t={c.t} gap={1.15} march speed={[2, 2]} kinds={["salmon", "cod", "mackerel", "tuna"]} seed="line" />
      <Hero pose={pose} position={FHERO} yaw={-0.4} />
    </Shot>
  );
};

/** "They're heading somewhere": columns turn onto the road past a sign to the city. */
const c5Sign: ShotFn = (c) => {
  const cam = move({ position: [-5, 3.2, 16], target: [2.5, 4.4, -1] }, { position: [-4.4, 3.0, 14.2], target: [2.5, 4.6, -1] }, c);
  return (
    <Shot mood="day" camera={cam} fog={[40, 320]} stars={false} shadowSize={24} keyDir={[0.8, 0.45, 0.2]}>
      <Fields t={c.t} tint="day" />
      <Road position={[0, 0.01, 4]} width={8} length={400} yaw={Math.PI / 2} />
      <RoadSign position={[4, 0, -1.5]} />
      <FishSwarm lanes={[2.0, 4.0, 6.0].map((z) => ({ from: [-60, 0, z] as V3, to: [60, 0, z] as V3 }))} t={c.t} gap={1.2} march speed={[2.2, 2.2]} kinds={["salmon", "cod", "mackerel", "tuna", "goldfish"]} seed="sign" />
    </Shot>
  );
};

/** DAY 3, from high above at sunset: lines of fish converging on the city like ant trails. */
const c5Aerial: ShotFn = (c) => {
  const cam = move({ position: [30, 190, 170], target: [0, 0, -10] }, { position: [26, 170, 150], target: [0, 0, -10] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[200, 900]} stars={false} shadows={false} light={0.85}>
      <Fields t={c.t} tint="sunset" />
      <group scale={2}>
        <BigCityBlock />
      </group>
      <FishSwarm lanes={radialLanes(22, [0, 0, -10], 360, 46, "aer")} t={c.t * 3} gap={1.05} size={[2.6, 3.2]} speed={[2.4, 3]} kinds={["salmon", "tuna", "cod"]} seed="aer" ends={10} castShadow={false} />
    </Shot>
  );
};

/** A compact downtown (kit blocks ×1) for aerials. */
const BigCityBlock: React.FC = () => (
  <>
    {Array.from({ length: 36 }, (_, i) => {
      const gx = (i % 6) - 2.5;
      const gz = Math.floor(i / 6) - 2.5;
      return (
        <Building key={i} position={[gx * 6.5, 0, gz * 6.5 - 5]} w={4.6} d={4.6} h={6 + random(`cb${i}`) * random(`cb2${i}`) * 26} color={[P.bldgNavy, P.bldgSlate, P.bldgPurple, P.bldgTeal][i % 4]} seed={`cb${i}`} power={0.6} />
      );
    })}
  </>
);

/** Columns marching in step down the highway toward the skyline, sharks among them. */
const c5Highway: ShotFn = (c) => {
  const cam = move({ position: [17, 3.8, 22], target: [0, 4, -40] }, { position: [15.5, 3.6, 19], target: [0, 4.2, -40] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[60, 460]} stars={false} shadowSize={40} keyDir={[-0.3, 0.25, -1]}>
      <Fields t={c.t} tint="sunset" />
      <Road position={[-6, 0.01, -100]} width={10} length={500} />
      <Road position={[6, 0.01, -100]} width={10} length={500} />
      <mesh position={[0, 0.3, -100]}>
        <BoxG args={[0.6, 0.6, 500]} />
        <Flat color="#8E96A6" />
      </mesh>
      <Skyline radius={240} count={30} seed="hwy" arc={[Math.PI * 0.85, Math.PI * 1.15]} power={0.7} />
      <mesh position={[30, 12, -420]}>
        <circleGeometry args={[22, 14]} />
        <Glow color="#FFC07A" fog={false} />
      </mesh>
      <Halo position={[30, 12, -418]} size={140} color="#FF9A50" opacity={0.6} />
      <FishSwarm lanes={parallelLanes(8, -10, 10, 30, -260, 0, 0, "hw")} t={c.t} gap={1.15} rank={1} march speed={[2.4, 2.4]} kinds={["salmon", "cod", "tuna", "mackerel"]} seed="hw" />
      {[-7, 6].map((x, i) => (
        <Fish key={x} kind="shark" position={[x, 0, -12 - i * 18 - c.lt * 2.2]} yaw={Math.PI} walk={c.lt * 0.9 + i * 0.5} amount={1} face={{ brow: "angry" }} />
      ))}
    </Shot>
  );
};

// ---------------------------------------------------------------- 06 under siege (dusk)

const ShopStreet: React.FC<{ t: number; smash: number }> = ({ t, smash }) => (
  <>
    <Ground color="#3A3F55" />
    <Road position={[0, 0.01, 14]} width={14} length={300} yaw={Math.PI / 2} />
    <mesh position={[0, 0.06, 2.5]} receiveShadow>
      <BoxG args={[300, 0.12, 9]} />
      <Flat color="#4A4F66" />
    </mesh>
    <ShopFront position={[0, 0, -4]} w={11} color={P.bldgTeal} smash={smash} seed="sw" sign="BOUTIQUE" />
    <ShopFront position={[-12, 0, -4]} w={11} color={P.bldgPurple} seed="sw2" sign="SHOES" signBg="#1A2030" />
    <ShopFront position={[12, 0, -4]} w={11} color="#8A5A4A" seed="sw3" sign="BOOKS" signBg="#20301A" />
    <ShopFront position={[24, 0, -4]} w={11} color={P.bldgNavy} seed="sw4" sign="CAFE" />
    <LampRow x={-6} z0={6} z1={6} on yaw={Math.PI} />
    <group position={[17, 0, 6]} scale={CITY}>
      <Lamp position={[0, 0.12, 0]} on yaw={Math.PI} />
    </group>
    <Sky t={t} tint="sunset" seed="shops" y={60} />
  </>
);
const c6Smash: ShotFn = (c) => {
  const hit = 1.25;
  // bill tip: from the road to the glass (z = -3.88) at `hit`, then a little way into the shop
  const tip = c.lt < hit ? lerp(14, -3.85, (c.lt / hit) ** 1.3) : -3.85 - Math.min(0.55, (c.lt - hit) * 2);
  const cam = move({ position: [10, 3.6, 17], target: [0, 2.6, -1] }, { position: [9, 3.4, 15], target: [0, 2.6, -1.5] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[30, 240]} stars={false} shadowSize={24} light={0.62} shake={c.lt > hit && c.lt < hit + 0.3 ? 0.08 : 0}>
      <ShopStreet t={c.t} smash={c.lt >= hit ? c.lt - hit : -1} />
      <Fish kind="swordfish" position={[0.4, 0.12, tip + 1.8 + 1.9]} yaw={Math.PI} walk={c.lt * 2.6} amount={c.lt < hit ? 1 : 0.3} fins={0.6} face={{ brow: "angry", mouth: 0.3 }} />
    </Shot>
  );
};

/** Sharks gathering in front of the government building; police lights, searchlights. */
const SHARK_RALLY: [number, number, number][] = [
  [-12, -2, 0],
  [-6, -1, 1],
  [0, -1.5, 2],
  [6, -1, 3],
  [12, -2, 4],
  [-9, 8, 5],
  [-3, 8.5, 6],
  [3, 8, 7],
  [9, 8.5, 8],
];
const c6Capitol: ShotFn = (c) => {
  const cam = move({ position: [9, 4.2, 21], target: [0, 5.6, -8] }, { position: [8, 4.0, 18.5], target: [0, 5.8, -8] }, c);
  return (
    <Shot mood="sunset" camera={cam} fog={[40, 320]} stars={false} shadowSize={40} light={0.7} keyDir={[0.5, 0.45, 0.75]}>
      <Ground color="#8E8676" />
      <Capitol position={[0, 0, -24]} scale={2.2} />
      <Skyline radius={150} count={22} seed="cap" power={0.8} />
      <Sky t={c.t} tint="sunset" seed="cap" y={70} />
      {SHARK_RALLY.map(([x, z, s]) => (
        <Fish key={s} kind="shark" position={[x, 0, -z]} yaw={Math.PI + (random(`sr${s}`) - 0.5) * 0.3} walk={Math.sin(c.t * 0.8 + s) * 0.08} amount={0.4} wag={Math.sin(c.t * 2 + s) * 0.15} face={{ brow: "angry" }} />
      ))}
      <BigCar position={[-19, 0, 14]} yaw={0.6} police t={c.t} />
      <BigCar position={[20, 0, 16]} yaw={-0.7} police t={c.t + 0.3} />
      <Siren position={[-24, 0, 2]} t={c.t} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 22, 22, -30]} rotation={[0, 0, s * (0.35 + Math.sin(c.t * 0.9 + s) * 0.18)]}>
          <coneGeometry args={[5, 46, 12, 1, true]} />
          <meshBasicMaterial color="#FFF2C8" transparent opacity={0.1} depthWrite={false} toneMapped={false} side={2} />
        </mesh>
      ))}
    </Shot>
  );
};

// ---------------------------------------------------------------- the barricade street (night)

/** Barricade across the main road at z = 6; the cross street (fish highway) runs along X at z ∈ [-36, -6]. */
const SAND_Z = 7;
/** The cross street is a raised slab (it covers the kit street's kerbs); everything on it stands at this height. */
const CROSS_Y = 0.44;
const SHERO: V3 = [2.2, 0, 3.4];
const POLICE_X = [-8.5, -5.2, -1.4, 5.8, 9.2];
const policePose = (i: number) => mergePose(REST, { expression: i % 2 ? "worried" : "neutral", headYaw: (random(`pp${i}`) - 0.5) * 0.3, lShoulder: [1.1, 0.1], rShoulder: [1.1, 0.1], lElbow: 0.6, rElbow: 0.6 });
const BarricadeSet: React.FC<{ t: number; fog?: boolean }> = ({ t }) => (
  <>
    <BigStreet seed="siege" trees={false} lamps={false} cross={[-38, -4]} lampsOn />
    <mesh position={[0, CROSS_Y / 2, -21]} receiveShadow>
      <BoxG args={[400, CROSS_Y, 32]} />
      <Flat color={P.road} />
    </mesh>
    {Array.from({ length: 24 }, (_, i) => (
      <mesh key={i} position={[-120 + i * 10, CROSS_Y + 0.01, -21]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 0.3]} />
        <Flat color={P.laneMark} />
      </mesh>
    ))}
    <LampRow x={-14} z0={-150} z1={-40} on />
    <LampRow x={14} z0={-140} z1={-40} on yaw={Math.PI} />
    <group position={[-14, 0, 14]} scale={CITY}>
      <Lamp position={[0, 0.12, 0]} on />
    </group>
    <group position={[14, 0, 18]} scale={CITY}>
      <Lamp position={[0, 0.12, 0]} on yaw={Math.PI} />
    </group>
    <Sandbags position={[0, 0, SAND_Z]} length={24} />
    <BigCar position={[-17, 0, 12]} yaw={0.3} police t={t} />
    <BigCar position={[17.5, 0, 14]} yaw={-0.4} police t={t + 0.4} />
  </>
);
const Defenders: React.FC<{ t: number; hero?: Pose; heroAt?: V3; heroItems?: React.ReactNode }> = ({ hero, heroAt = SHERO, heroItems }) => (
  <>
    {POLICE_X.map((x, i) => {
      const pos: V3 = [x, 0, 3.6 + (i % 2) * 0.5];
      const pose = policePose(i);
      return (
        <React.Fragment key={x}>
          <Hero pose={pose} position={pos} look={POLICE_OFFICER} />
          <RiotShield position={[x, 2.2, pos[2] + 1.1]} />
        </React.Fragment>
      );
    })}
    {hero ? <Hero pose={hero} position={heroAt} /> : null}
    {heroItems}
  </>
);

/** Slavoski's battle gear: a pot on his head, a frying pan in his right hand. */
const heroGear = (pose: Pose, at: V3, panRot: V3 = [0.35, 0, -0.2]) => {
  const head = headPosition(pose, at);
  const hand = handPosition(pose, "r", at);
  return (
    <>
      <PotHelmet head={head} />
      <FryingPan hand={hand} rotation={panRot} />
    </>
  );
};

/** "Humanity prepares for the worst": the police line behind sandbags; Slavoski with a pot helmet and a frying pan. */
const c6Prepare: ShotFn = (c) => {
  const pose = mergePose(REST, { expression: "worried", headYaw: Math.sin(c.lt * 2) * 0.2, rShoulder: [0.9, 0.2], rElbow: 1.2, lShoulder: [0.3, 0.2], lElbow: 0.5 });
  const cam = move({ position: [3.6, 5.0, 21], target: [1.4, 3.0, 3] }, { position: [3.2, 4.8, 18], target: [1.6, 3.1, 3] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[20, 200]} shadowSize={24} light={0.95}>
      <BarricadeSet t={c.t} />
      <Defenders t={c.t} hero={pose} heroItems={heroGear(pose, SHERO)} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 07 ten seconds (fog)

/** The fish army flowing along the cross street (left → right) in front of the barricade. */
const armyLanes = (): Lane[] => [-34, -31, -28, -25, -22, -19, -16, -13, -10].map((z) => ({ from: [-90, CROSS_Y, z] as V3, to: [90, CROSS_Y, z] as V3 }));
const ARMY_KINDS: FishKind[] = ["salmon", "cod", "mackerel", "tuna", "goldfish", "swordfish"];
const ARMY_SHARKS: V3[] = [
  [-14, CROSS_Y, -8],
  [6, CROSS_Y, -9],
  [-30, CROSS_Y, -21],
  [22, CROSS_Y, -20],
  [-2, CROSS_Y, -30],
];
/** Army time: seconds since chapter 7 began (so c7 and c8 shots agree), frozen on "stops". */
const armyClock = (c: ShotCtx) => {
  const t0 = cueT(c, "But then", 40, 41.8);
  const stop = cueT(c, "stops", t0, 44);
  return { t0, stop, tt: Math.min(c.t, stop) - t0 };
};
const Army: React.FC<{ tt: number; turn?: number; target?: V3; skip?: number }> = ({ tt, turn = 0, target = SHERO, skip = -1 }) => (
  <>
    <FishSwarm lanes={armyLanes()} t={tt + 20} gap={1.2} kinds={ARMY_KINDS} speed={[2.4, 3.0]} seed="army" turn={turn > 0 ? { target, k: turn } : undefined} ends={0} />
    {ARMY_SHARKS.map((p, i) => {
      if (i === skip) return null;
      const x = p[0] + tt * 2.4;
      const yaw0 = Math.PI / 2;
      const yaw = yaw0 + (Math.atan2(target[0] - x, target[2] - p[2]) - yaw0) * turn;
      return <Fish key={i} kind="shark" position={[x, p[1], p[2]]} yaw={yaw} walk={tt * 0.9 + i * 0.3} amount={1} face={{ brow: "angry", mouth: 0.2 }} />;
    })}
  </>
);

/** Over the defenders' heads: the army floods past… and on "stops" everything freezes mid-step. */
const c7Freeze: ShotFn = (c) => {
  const { tt, stop } = armyClock(c);
  const frozen = c.t >= stop;
  const cam = move({ position: [7, 12, 20], target: [-1, 0.5, -20] }, { position: [6.2, 11.2, 18.4], target: [-1, 0.5, -20] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[14, frozen ? 110 : 160]} shadowSize={40} light={0.95} shake={frozen ? 0 : 0.03}>
      <BarricadeSet t={c.t} />
      <Defenders t={c.t} hero={mergePose(REST, { expression: "alarm" })} heroItems={heroGear(REST, SHERO)} />
      <Army tt={tt} />
    </Shot>
  );
};

/** A frozen great white, one foot in the air, only its pupils moving. */
const c7Shark: ShotFn = (c) => {
  const { tt } = armyClock(c);
  const sp: V3 = [ARMY_SHARKS[0][0] + tt * 2.4, CROSS_Y, ARMY_SHARKS[0][2]];
  const cam = move({ position: [sp[0] + 7.5, 2.6, 4.5], target: [sp[0] + 2.2, 2.7, -8] }, { position: [sp[0] + 6.6, 2.5, 3.2], target: [sp[0] + 2.2, 2.7, -8] }, c);
  const dart = Math.sin(c.lt * 7) > 0 ? 0.25 : -0.2;
  return (
    <Shot mood="night" camera={cam} fog={[6, 70]} shadowSize={14} light={0.85}>
      <BarricadeSet t={c.t} />
      <Army tt={tt} skip={0} />
      <Fish kind="shark" position={sp} yaw={Math.PI / 2} walk={tt * 0.9} amount={1} face={{ brow: "angry", look: [dart, 0], mouth: 0.2 }} />
    </Shot>
  );
};

/** The goldfish, frozen on the front line between the sharks' feet. One eye twitches. */
const GF_AT: V3 = [1.2, CROSS_Y, -8.4];
const c7Goldfish: ShotFn = (c) => {
  const { tt } = armyClock(c);
  const twitch = c.lt > 0.9 && c.lt < 1.05 ? 0.25 : 0;
  const cam = move({ position: [GF_AT[0] + 1.6, 0.85, GF_AT[2] + 4.2], target: [GF_AT[0], 0.65, GF_AT[2]] }, { position: [GF_AT[0] + 1.2, 0.8, GF_AT[2] + 3.4], target: [GF_AT[0], 0.65, GF_AT[2]] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[4, 50]} shadowSize={8} light={0.9}>
      <BarricadeSet t={c.t} />
      <Army tt={tt} />
      <Fish kind="goldfish" position={GF_AT} yaw={Math.PI / 2} scale={0.9} walk={0.27} amount={1} face={{ look: [twitch, 0], brow: "flat" }} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 08 payback (night)

/** "Then billions of fish turn towards the nearest human": every head swings toward Slavoski (and us). */
const c8Turn: ShotFn = (c) => {
  const { tt } = armyClock(c);
  const turn = k01(c.lt, 0.35, 0.9);
  const cam = move({ position: [SHERO[0] + 2.6, 7.6, SHERO[2] + 6.5], target: [0, 0.6, -18] }, { position: [SHERO[0] + 2.3, 7.2, SHERO[2] + 5.6], target: [0, 0.6, -18] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[10, 120]} shadowSize={40} light={0.95}>
      <BarricadeSet t={c.t} />
      <Defenders t={c.t} hero={mergePose(REST, { expression: "worried" })} heroItems={heroGear(REST, SHERO)} />
      <Army tt={tt} turn={turn} target={[SHERO[0], 0, SHERO[2] + 2]} />
      <Fish kind="goldfish" position={GF_AT} yaw={Math.PI / 2 + (Math.atan2(SHERO[0] - GF_AT[0], SHERO[2] - GF_AT[2]) - Math.PI / 2) * turn} scale={0.9} walk={0.27} amount={1} face={{ brow: turn > 0.5 ? "angry" : "flat" }} />
    </Shot>
  );
};

/** Slavoski, mid-bite of his fish & chips, realises who the nearest human is. */
const c8Bite: ShotFn = (c) => {
  const base = mergePose(REST, { expression: c.lt > 0.35 ? "alarm" : "neutral", headPitch: -0.05, headYaw: c.lt > 0.35 ? 0.15 : 0 });
  const lower = k01(c.lt, 0.4, 0.95);
  const head = headPosition(base, SHERO);
  const target: V3 = [head[0] + 0.55, lerp(head[1] - 0.75, head[1] - 1.55, lower), head[2] + 0.75];
  const pose = reach(base, "l", target, { position: SHERO }).pose;
  const hand = handPosition(pose, "l", SHERO);
  const cam = move({ position: [SHERO[0] - 0.6, 3.7, SHERO[2] + 10.5], target: [SHERO[0] + 0.1, 3.0, SHERO[2]] }, { position: [SHERO[0] - 0.5, 3.65, SHERO[2] + 9.3], target: [SHERO[0] + 0.1, 3.05, SHERO[2]] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[8, 90]} shadowSize={14} light={0.95}>
      <BarricadeSet t={c.t} />
      <Hero pose={pose} position={SHERO} />
      {heroGear(pose, SHERO, [Math.PI - 0.2, 0, 0.15])}
      <FishAndChips position={[hand[0], hand[1] + 0.32, hand[2] + 0.1]} rotation={[0.2, 0, -0.25]} bite={1} />
    </Shot>
  );
};

/** …and begin walking faster: the wall of fish comes at the barricade, sharks in front, mouths open. */
const c8Charge: ShotFn = (c) => {
  const warp = c.lt + c.lt * c.lt * 0.9;
  const lanes = parallelLanes(12, -11, 11, -150, 5.5, 0, 0, "chg");
  const cam = move({ position: [0.8, 3.4, 15.5], target: [0, 2.2, -20] }, { position: [0.6, 3.3, 14.8], target: [0, 2.4, -20] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[10, 140]} shadowSize={30} light={0.95} shake={0.04 + c.lt * 0.03}>
      <BarricadeSet t={c.t} />
      <FishSwarm lanes={lanes} t={warp} gap={1.15} kinds={ARMY_KINDS} speed={[2.6, 3.2]} seed="chg" ends={0} fill={0.9} />
      {[-5, 4.5].map((x, i) => (
        <Fish key={x} kind="shark" position={[x, 0, -22 + warp * 3.2 - i * 6]} yaw={0} walk={warp * 1.1 + i * 0.4} amount={1} face={{ brow: "angry", mouth: 0.6 + Math.sin(c.lt * 6) * 0.2 }} />
      ))}
    </Shot>
  );
};

/** Slavoski runs for it down the street (fish & chips flying), the flood behind him. */
const RunStreet: React.FC = () => (
  <>
    <BigStreet seed="chase" trees={false} lamps={false} lampsOn />
    <LampRow x={-14} z0={-200} z1={40} on />
    <LampRow x={14} z0={-183} z1={40} on yaw={Math.PI} />
  </>
);
/** Long fixed lanes for the chase (z -200 … 200); `fill` puts the front of the flood just behind Slavoski. */
const RUN_LANES = parallelLanes(12, -11, 11, -200, 200, 0, 0, "run");
const FLOOD_LANES = parallelLanes(14, -11.5, 11.5, -200, 200, 0, 0, "fl");
const runPose = (ph: number, over: Partial<Pose> = {}) => mergePose(walkPose(ph, 1.5), { lean: 0.22, expression: "alarm", lShoulder: [-1.0 * Math.sin(ph * Math.PI * 2), 0.25], rShoulder: [1.0 * Math.sin(ph * Math.PI * 2), 0.25], lElbow: 1.3, rElbow: 1.3, ...over });
const c8Run: ShotFn = (c) => {
  const hz = 2 + c.lt * 7;
  const hero: V3 = [0, 0, hz];
  const drop = c.lt * 1.0;
  const cam: CameraSpec = { position: [1.2, 4.0, hz + 13 - c.lt * 0.6], target: [0, 3.0, hz - 6] };
  return (
    <Shot mood="night" camera={cam} fog={[12, 130]} shadowSize={30} light={0.95} shake={0.05}>
      <RunStreet />
      <Hero pose={runPose(c.lt * 2.2)} position={hero} />
      <PotHelmet head={headPosition(runPose(c.lt * 2.2), hero)} />
      <FishAndChips position={[1.0 + drop * 0.6, Math.max(0.35, 2.6 + drop * 1.6 - drop * drop * 6), hz + 0.6 - drop * 2]} rotation={[drop * 5, 0, drop * 3]} />
      <FishSwarm lanes={RUN_LANES} t={c.lt} gap={1.15} kinds={ARMY_KINDS} speed={[7, 7]} seed="run" ends={0} fill={0.4875} />
      <Fish kind="shark" position={[-4, 0, hz - 12]} yaw={0} walk={c.lt * 2} amount={1} face={{ brow: "angry", mouth: 0.7 }} />
    </Shot>
  );
};

/** "They've finally figured out…": the salmon from the supermarket reads the FISH BAR menu, then turns to us. */
const SAL: V3 = [0.2, 0, 7.0];
const c8Menu: ShotFn = (c) => {
  const turn = k01(c.lt, 0.9, 1.3);
  const cam = move({ position: [-2.6, 2.1, 13.6], target: [1.9, 1.7, 3.6] }, { position: [-2.3, 2.05, 12.6], target: [1.9, 1.7, 3.6] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[16, 140]} shadowSize={14} light={0.9}>
      <Ground color="#3A3F55" />
      <mesh position={[0, 0.06, 4]} receiveShadow>
        <BoxG args={[60, 0.12, 9]} />
        <Flat color="#4A4F66" />
      </mesh>
      <Road position={[0, 0.01, 16]} width={14} length={200} yaw={Math.PI / 2} />
      <FishBar position={[0, 0, -1]} t={c.t} />
      <ShopFront position={[-14, 0, -1]} w={12} color={P.bldgNavy} seed="mb" sign="LAUNDRY" lit={false} />
      <ShopFront position={[14, 0, -1]} w={12} color={P.bldgSlate} seed="mb2" sign="PHONES" lit />
      <group position={[10, 0, 7.5]} scale={CITY}>
        <Lamp position={[0, 0.12, 0]} on yaw={Math.PI} />
      </group>
      <Fish kind="salmon" position={[SAL[0], 0.12, SAL[2]]} yaw={lerp(2.56, -0.44, turn)} headYaw={0} walk={0} amount={0} fins={0.15} face={{ brow: turn > 0.4 ? "angry" : "worried", look: turn > 0.4 ? [0.1, 0] : [0.2, 0.15] }} />
    </Shot>
  );
};

/** Side-on, tracking: Slavoski sprints past the lamps, the flood of fish right behind him. */
const c8Side: ShotFn = (c) => {
  const hz = 6 + c.lt * 6.5;
  const hero: V3 = [-2, 0, hz];
  const cam: CameraSpec = { position: [16, 3.4, hz + 7], target: [-2, 2.4, hz - 1.5] };
  return (
    <Shot mood="night" camera={cam} fog={[16, 160]} shadowSize={36} light={0.95} shake={0.03}>
      <RunStreet />
      <Hero pose={runPose(c.lt * 2.2)} position={hero} />
      <PotHelmet head={headPosition(runPose(c.lt * 2.2), hero)} />
      <FishSwarm lanes={FLOOD_LANES} t={c.lt} gap={1.1} kinds={ARMY_KINDS} speed={[6.5, 6.5]} seed="sd" ends={0} fill={0.5} />
      <Fish kind="shark" position={[2.5, 0, hz - 9]} yaw={0} walk={c.lt * 2} amount={1} face={{ brow: "angry", mouth: 0.7 }} />
    </Shot>
  );
};

/** Pull up and away: Slavoski sprinting down the lamp-lit street, a river of fish filling it behind him. */
const c8Flood: ShotFn = (c) => {
  const hz = 20 + c.lt * 6.5;
  const hero: V3 = [0, 0, hz];
  const k = clamp01(c.lt / 3.2);
  const cam: CameraSpec = { position: [lerp(3, 10, k), lerp(10, 46, ease(k)), hz + lerp(22, 46, ease(k))], target: [0, 1, hz - lerp(8, 24, k)] };
  return (
    <Shot mood="night" camera={cam} fog={[30, 260]} shadowSize={60} light={0.95}>
      <RunStreet />
      <Hero pose={runPose(c.lt * 2.2)} position={hero} />
      <PotHelmet head={headPosition(runPose(c.lt * 2.2), hero)} />
      <FishSwarm lanes={FLOOD_LANES} t={c.lt} gap={1.1} kinds={ARMY_KINDS} speed={[6.5, 6.5]} seed="fl" ends={0} fill={0.535} />
      {[-6, 5].map((x, i) => (
        <Fish key={x} kind="shark" position={[x, 0, hz - 12 - i * 9]} yaw={0} walk={c.lt * 2 + i * 0.4} amount={1} face={{ brow: "angry", mouth: 0.6 }} />
      ))}
    </Shot>
  );
};

// ---------------------------------------------------------------- thumbnail

/** Shorts cover: a great white in sneakers walking up the beach at us, beachgoers fleeing. */
export const thumbShot: ShotFn = () => {
  const cam: CameraSpec = { position: [1.2, 1.6, 10.5], target: [0, 4.4, -12] };
  return (
    <Shot mood="day" camera={cam} fog={[30, 260]} stars={false} shadowSize={24}>
      <BeachDress t={0.5} />
      <Fish kind="shark" position={[0.4, 0, -10]} yaw={0.06} walk={0.3} amount={1} fins={0.3} face={{ brow: "angry", mouth: 0.75, look: [0.15, -0.05] }} />
      <FishSwarm lanes={seaLanes(18, -14, 14, 6, "thumb")} t={3} gap={1.6} climb={CLIMB} seed="thumb" />
    </Shot>
  );
};

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldClock },
    { cue: "every fish", fn: coldBowl },
  ],
  c1: [
    { cue: null, fn: c1Kitchen },
    { cue: "until a salmon", fn: c1River },
    { cue: "and casually", fn: c1Mart },
  ],
  c2: [
    { cue: null, fn: c2Coast },
    { cue: "millions", fn: c2Surf },
    { cue: "rivers", fn: c2River },
    { cue: "Beaches", fn: c2Overrun },
  ],
  c3: [
    { cue: null, fn: c3Shark },
    { cue: "Great whites", fn: c3Town },
    { cue: "coastal towns", fn: c3Peek },
  ],
  c4: [
    { cue: null, fn: c4Market },
    { cue: "has collapsed", fn: c4Net },
    { cue: "Boats return", fn: c4Boats },
    { cue: "empty waters", fn: c4Sonar },
  ],
  c5: [
    { cue: null, fn: c5Lines },
    { cue: "They're heading", fn: c5Sign },
    { cue: "By day three", fn: c5Aerial },
    { cue: "marching", fn: c5Highway },
  ],
  c6: [
    { cue: null, fn: c6Smash },
    { cue: "Sharks gather", fn: c6Capitol },
    { cue: "Humanity", fn: c6Prepare },
  ],
  c7: [
    { cue: null, fn: c7Freeze },
    { cue: "For ten", fn: c7Shark },
    { cue: "complete silence", fn: c7Goldfish },
  ],
  c8: [
    { cue: null, fn: c8Turn },
    { cue: "the nearest", fn: c8Bite },
    { cue: "and begin", fn: c8Charge },
    { cue: "because apparently", fn: c8Run },
    { cue: "they finally", fn: c8Menu },
    { cue: "eating them", fn: c8Side },
    { cue: "ten thousand", fn: c8Flood },
  ],
};

