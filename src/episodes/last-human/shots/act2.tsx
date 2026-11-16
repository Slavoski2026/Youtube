/**
 * Act 2: 04 THE FIRST 24 HOURS (bright day one), 05 LIGHTS OUT (evening → night, staggered failures),
 * 06 THE FIRST WEEK (overcast, then a dusk fire, a rainy night).
 */
import React from "react";
import { random } from "remotion";
import { CityGrid, Lamp, PowerStation } from "../../../slavoski/city";
import { BoxG, CylG, IcoG } from "../../../slavoski/detail";
import { Fireball, SmokeCluster } from "../../../slavoski/fx";
import { Flat, Glow, Halo } from "../../../slavoski/materials";
import { Rain } from "../../../slavoski/nature";
import { clamp01, type V3 } from "../../../slavoski/noise";
import { P } from "../../../slavoski/palette";
import { handPosition, Hero, mergePose, REST, walkPose, type Pose } from "../../../slavoski/rig/Hero";
import { CanvasPanel, CANVAS_FONT, ScreenHtml } from "../../../slavoski/screens";
import type { CuedShot } from "../../../slavoski/timeline";
import { CellTower, Pylon } from "../../satellites-dark/props";
import { BED, Bedroom, WIN } from "../../smart-animals/props";
import { Phone3D, PHONE, Supermarket, Trolley } from "../../ww3-countdown/props";
import { ControlRoom, FlashBeam, FuelTanker, RegionAtNight, Substation, WaterPlant } from "../props/grid";
import { Candle, Kitchen, KITCHEN, NoSignalScreen } from "../props/home";
import { ApartmentEntrance, FireStation, LOUNGER_TOP, Mansion, Museum, PetrolStation, S, SupplyShelves } from "../props/town";
import { Convertible, drivingPose } from "../props/vehicles";
import { Avenue, AvenueCars, bedPose, CityRing } from "./act1";
import { BigStreet, k01, lerp, move, prog, Shot, Sky, standing, walking, type ShotCtx, type ShotFn } from "./common";

const ENTRANCE_X = 21.35;

/** A trolley at hero scale. */
const BigTrolley: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]} scale={2.1}>
    <Trolley position={[0, 0, 0]} />
  </group>
);

/** Pushing pose: both hands forward at waist height. */
const pushPose = (phase: number, over: Partial<Pose> = {}) =>
  mergePose(walkPose(phase, 0.8), { lShoulder: [1.0, 0.05], rShoulder: [1.0, 0.05], lElbow: 0.9, rElbow: 0.9, ...over });

// ================================================================ 04 THE FIRST 24 HOURS

const c4Trolley: ShotFn = (c) => {
  const z = -30 + c.lt * 2.2;
  const pose = pushPose(c.lt * 0.9, { expression: "smile", headYaw: Math.sin(c.lt) * 0.3 });
  const cam = move({ position: [2, 3.6, z + 20], target: [0, 3.0, z] }, { position: [3, 3.4, z + 16], target: [0, 3.2, z] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 40 }} fog={[160, 700]} shadowSize={50}>
      <Avenue />
      <Hero pose={pose} position={[0, 0, z]} />
      <BigTrolley position={[0, 0, z + 3.4]} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

const c4Market: ShotFn = (c) => {
  const z = 6 - c.lt * 2.2;
  const pose = pushPose(c.lt * 0.9, { expression: "smile", headYaw: -0.5 });
  const cam = move({ position: [2.6, 5.2, z - 11], target: [2.9, 2.8, z] }, { position: [2.7, 4.8, z - 9], target: [2.9, 2.8, z] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 42 }} fog={false} stars={false} light={0.8} shadowSize={20}>
      <group scale={[1.6, 1.6, 1.6]}>
        <Supermarket stock={0.95} seed="full" />
      </group>
      <Hero pose={pose} position={[2.9, 0, z]} yaw={Math.PI} />
      <BigTrolley position={[2.9, 0, z - 3.4]} yaw={Math.PI} />
    </Shot>
  );
};

const c4Petrol: ShotFn = (c) => {
  const hero: V3 = [-2.4, 0, 1.8];
  const pose = mergePose(standing({ expression: "smile", headYaw: 0.4 }), { rShoulder: [0.9, 0.3], rElbow: 0.9 });
  const cam = move({ position: [-24, 7, 22], target: [-5, 4, 0] }, { position: [-20, 6.4, 18], target: [-5, 4, 0] }, c);
  const h = handPosition(pose, "r", hero, -Math.PI / 2);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 40 }} fog={[120, 600]} shadowSize={40}>
      <PetrolStation />
      <Convertible position={[-11, 0, 1]} color="#24748F" />
      <Hero pose={pose} position={hero} yaw={-Math.PI / 2} />
      {/* fuel hose from pump to hand */}
      <mesh position={[(h[0] - 6) / 2 - 0.5, (h[1] + 2.7) / 2, (h[2] + 2.6) / 2]} rotation={[0, 0, Math.atan2(h[1] - 2.7, h[0] + 6) + Math.PI / 2]}>
        <CylG args={[0.08, 0.08, Math.hypot(h[0] + 6, h[1] - 2.7), 6]} />
        <Flat color="#1A1A1E" />
      </mesh>
      <CityRing radius={170} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

const c4Pantry: ShotFn = (c) => {
  const cam = move({ position: [-8, 4.2, 9], target: [0, 2.8, 0] }, { position: [6, 4.0, 9], target: [0, 2.8, 0] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 36 }} fog={false} stars={false} light={0.8} shadowSize={14}>
      <mesh position={[0, -0.05, 2]} receiveShadow>
        <BoxG args={[30, 0.1, 14]} />
        <Flat color="#8A7A66" />
      </mesh>
      <mesh position={[0, 4.5, -1]}>
        <BoxG args={[30, 9, 0.2]} />
        <Flat color="#D8CDB8" />
      </mesh>
      <SupplyShelves kind="pantry" w={18} seed="pantry" />
      <pointLight position={[0, 7, 5]} color="#FFF0D8" intensity={30} distance={20} decay={2} />
    </Shot>
  );
};

/** On a pool lounger at the mansion, hands behind the head. */
const c4Mansion: ShotFn = (c) => {
  const k = prog(c);
  const cam = { position: [lerp(-16, -12, k), lerp(9, 8, k), lerp(24, 20, k)] as V3, target: [0, 2, 4] as V3, fov: 40 };
  const lie = mergePose(REST, { lShoulder: [2.9, 0.6], rShoulder: [2.9, 0.6], lElbow: 2.2, rElbow: 2.2, expression: "smile", blink: 0.9 });
  return (
    <Shot mood="day" camera={cam} fog={[150, 600]} shadowSize={40}>
      <Mansion t={c.t} />
      {/* lying on the middle lounger: back on the cushion, head toward -Z */}
      <group position={[0, 0.3 + LOUNGER_TOP + 0.36, 8.5 + 1.8]} rotation={[-Math.PI / 2 + 0.25, 0, 0]}>
        <Hero pose={lie} />
      </group>
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

const c4Supercar: ShotFn = (c) => {
  const z = 20 - c.lt * 16;
  const cam = move({ position: [-10, 4.5, z - 16], target: [2, 3.2, z] }, { position: [-8, 4.2, z - 12], target: [2, 3.2, z] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 40 }} fog={[160, 700]} shadowSize={50}>
      <Avenue cars={false} />
      <Convertible position={[2, 0, z]} yaw={Math.PI} color="#C8372D" spin={-c.lt * 16} driver={drivingPose({ expression: "smile", blink: 0 }, 0)} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

const c4Museum: ShotFn = (c) => {
  const z = 10 - c.lt * 1.8;
  const { pose } = walking(c.lt, 1.8, { expression: "smile", headYaw: 0.5 });
  const cam = move({ position: [8, 6.5, 24], target: [0, 4.5, -10] }, { position: [6, 6, 20], target: [0, 4.5, -12] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 42 }} fog={false} stars={false} light={0.75} shadowSize={30}>
      <Museum t={c.t} />
      <Hero pose={pose} position={[1, 0, z]} yaw={Math.PI} />
    </Shot>
  );
};

const c4Problem: ShotFn = (c) => {
  const look = k01(c.lt, 0.2, 0.6);
  const pose = standing({ expression: look > 0.5 ? "worried" : "neutral", headPitch: 0.5 * look });
  const cam = move({ position: [4.5, 3.6, -22.5], target: [0.5, 4.2, -16] }, { position: [4.0, 3.5, -21.8], target: [0.5, 4.3, -16] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.6} shadowSize={20}>
      <Museum t={c.t} flicker={c.lt > 0.1 && c.lt < 1.2 ? 1 : 0} />
      <Hero pose={pose} position={[0.5, 0, -16]} yaw={Math.PI + 0.3} />
    </Shot>
  );
};

const c4Control: ShotFn = (c) => {
  const cam = move({ position: [-17, 7, 16], target: [0, 4, -6] }, { position: [-12, 6, 14], target: [2, 4, -6] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 44 }} fog={false} stars={false} light={0.5} shadowSize={30}>
      <ControlRoom t={c.t} />
    </Shot>
  );
};

/** The water works on a working day with nobody at work: hard hats left on a bench. */
const c4Works: ShotFn = (c) => {
  const cam = move({ position: [40, 18, 46], target: [0, 2, 0] }, { position: [32, 15, 40], target: [0, 2, 0] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 40 }} fog={[150, 700]} shadowSize={60}>
      <WaterPlant t={c.t} run={1} night={false} />
      <group position={[20, 0, 30]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <BoxG args={[6, 0.3, 1.4]} />
          <Flat color="#7A5A3E" />
        </mesh>
        {[-1.8, 0, 1.8].map((x) => (
          <mesh key={x} position={[x, 1.35, 0]} castShadow>
            <IcoG args={[0.45, 1]} />
            <Flat color="#E0B04E" />
          </mesh>
        ))}
      </group>
      <CityRing radius={170} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

/** Alone in the middle of the empty control room. */
const c4Gone: ShotFn = (c) => {
  const k = prog(c);
  const cam = { position: [lerp(0, 0, k), lerp(9, 12.5, k), lerp(16, 22, k)] as V3, target: [0, 3, 0] as V3, fov: 42 };
  return (
    <Shot mood="day" camera={cam} fog={false} stars={false} light={0.5} shadowSize={30}>
      <ControlRoom t={c.t} />
      <Hero pose={standing({ headYaw: Math.sin(c.lt * 0.7) * 0.5, expression: "worried" })} position={[0, 0, 7]} yaw={Math.PI} />
    </Shot>
  );
};

// ================================================================ 05 LIGHTS OUT

const c5Map: ShotFn = (c) => {
  const cam = move({ position: [0, 6.5, 14], target: [0, 6.5, -12] }, { position: [0, 6.8, 6], target: [0, 7, -12] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 46 }} fog={false} stars={false} light={0.35} shadowSize={30}>
      <ControlRoom t={c.t} lost={0.04 + prog(c) * 0.12} />
    </Shot>
  );
};

const c5Plant: ShotFn = (c) => {
  const cam = move({ position: [-56, 14, 70], target: [0, 16, 0] }, { position: [-46, 13, 60], target: [0, 16, 0] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 40 }} fog={[150, 800]} shadowSize={80} light={0.5}>
      <group scale={S}>
        <PowerStation position={[0, 0, 0]} on={1} t={c.t} />
      </group>
      <SmokeCluster position={[8, 46, -6]} progress={(c.t * 0.12) % 1} radius={5} rise={18} color="#6A6670" seed="nst" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[1200, 1200]} />
        <Flat color="#2A3A30" />
      </mesh>
      <CityRing radius={170} power={0.9} />
    </Shot>
  );
};

const c5Substation: ShotFn = (c) => {
  const cam = move({ position: [-40, 12, 40], target: [0, 6, -4] }, { position: [-32, 10, 34], target: [0, 6, -4] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 40 }} fog={[120, 600]} shadowSize={50} keyDir={[0.8, 0.25, -0.5]}>
      <Substation t={c.t} state="on" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[1200, 1200]} />
        <Flat color="#4A6A44" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <Pylon key={i} position={[40 + i * 40, 0, -40 - i * 20]} h={34} />
      ))}
      <CityRing radius={170} power={0.8} />
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

/** Low among the empty operator chairs. */
const c5Operators: ShotFn = (c) => {
  const cam = move({ position: [-7, 4.0, 15], target: [2, 2.4, 0] }, { position: [-4, 3.8, 14], target: [4, 2.4, 0] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 40 }} fog={false} stars={false} light={0.35} shadowSize={20}>
      <ControlRoom t={c.t} lost={0.15} />
    </Shot>
  );
};

const c5Tankers: ShotFn = (c) => {
  const cam = move({ position: [-30, 8, 34], target: [0, 3, 0] }, { position: [-24, 7, 30], target: [2, 3, 0] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 40 }} fog={[120, 600]} shadowSize={50} keyDir={[0.8, 0.25, -0.5]}>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <BoxG args={[300, 0.04, 300]} />
        <Flat color="#5A5E68" />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <FuelTanker key={i} position={[-14 + i * 7.5, 0, 0]} yaw={Math.PI} />
      ))}
      <CityRing radius={170} power={0.6} />
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

/** A hard hat and toolbox left at the foot of a pylon. */
const c5Maintenance: ShotFn = (c) => {
  const cam = move({ position: [7, 3, 11], target: [1, 2.5, 0] }, { position: [6, 2.6, 10], target: [0, 14, -12] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 46 }} fog={[120, 600]} shadowSize={40} keyDir={[0.8, 0.25, -0.5]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[1200, 1200]} />
        <Flat color="#4A6A44" />
      </mesh>
      <Pylon position={[0, 0, -12]} h={40} />
      {[1, 2, 3].map((i) => (
        <Pylon key={i} position={[-40 * i, 0, -12 - 30 * i]} h={40} />
      ))}
      <mesh position={[2.5, 0.45, 2]} castShadow>
        <IcoG args={[0.45, 1]} />
        <Flat color="#E0B04E" />
      </mesh>
      <mesh position={[0.5, 0.45, 2.6]} castShadow>
        <BoxG args={[1.6, 0.9, 0.8]} />
        <Flat color="#C8372D" />
      </mesh>
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

const c5Safe: ShotFn = (c) => {
  const cam = move({ position: [-30, 9, 32], target: [0, 6, -4] }, { position: [-26, 8.5, 28], target: [0, 6, -4] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 40 }} fog={[120, 600]} shadowSize={50} light={0.6}>
      <Substation t={c.t} state="safe" k={k01(c.lt, 0.6, 1.4)} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[1200, 1200]} />
        <Flat color="#2A3A30" />
      </mesh>
      <CityRing radius={170} power={0.6} />
    </Shot>
  );
};

const c5Fault: ShotFn = (c) => {
  const k = clamp01(c.lt / 2);
  const cam = { ...move({ position: [-22, 8, 26], target: [0, 7, -4] }, { position: [-18, 7.5, 22], target: [0, 7, -4] }, c), fov: 40 };
  return (
    <Shot mood="night" camera={cam} fog={[120, 600]} shadowSize={50} light={0.6} shake={k > 0.15 ? 0.06 : 0}>
      <Substation t={c.t} state="fault" k={k} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[1200, 1200]} />
        <Flat color="#2A3A30" />
      </mesh>
      <CityRing radius={170} power={0.5} />
    </Shot>
  );
};

/** Night aerial: districts go dark at different times; some stay lit. */
const c5Districts: ShotFn = (c) => {
  const lt = c.lt;
  const cam = move({ position: [140, 210, 220], target: [0, 0, -20] }, { position: [120, 190, 190], target: [0, 0, -20] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 40 }} fog={[300, 1400]} shadowSize={200} light={0.45}>
      <group scale={S}>
        <CityGrid
          seed="lastcity"
          blocks={10}
          block={14}
          modify={(sp) => {
            const bx = Math.round(sp.position[0] / 14);
            const bz = Math.round(sp.position[2] / 14);
            const fail = 0.3 + random(`dist${bx}:${bz}`) * 3.4;
            return { power: lt > fail ? 0 : 1 };
          }}
        />
      </group>
      <CityRing radius={170} power={0.5} />
    </Shot>
  );
};

const c5Region: ShotFn = (c) => {
  const cam = move({ position: [0, 260, 260], target: [0, 0, -200] }, { position: [0, 240, 220], target: [0, 0, -220] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 44 }} fog={false} shadows={false} light={0.4}>
      <RegionAtNight k={0.1 + prog(c) * 0.55} />
    </Shot>
  );
};

/** His avenue goes dark, building by building, lamp by lamp, while he sits on the steps. */
const c5Street: ShotFn = (c) => {
  const lt = c.lt;
  const cam = move({ position: [-6, 10, 40], target: [8, 8, -30] }, { position: [-4, 9, 34], target: [8, 8, -30] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 42 }} fog={[120, 650]} shadowSize={60} light={0.6}>
      <BigStreet seed="avenue" lamps={false} cars={false} modify={(sp, i) => ({ power: lt > 0.4 + random(`off${i}`) * 2.6 ? 0 : 1 })} />
      <AvenueCars />
      <group scale={S}>
        {Array.from({ length: 9 }, (_, i) => (
          <React.Fragment key={i}>
            <Lamp position={[4, 0.12, 2 - i * 11]} on={lt < 0.6 + i * 0.22} />
            <Lamp position={[-4, 0.12, -3.5 - i * 11]} on={lt < 0.7 + i * 0.25} />
          </React.Fragment>
        ))}
      </group>
      <group position={[ENTRANCE_X, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <ApartmentEntrance lit={lt < 2.4} />
      </group>
      <Hero pose={mergePose(sitPose(), { headPitch: 0.25, headYaw: -0.4, expression: "worried" })} position={[ENTRANCE_X - 3.3, 0.52, 0]} yaw={-Math.PI / 2} />
      <CityRing power={lt > 2.5 ? 0 : 0.3} />
    </Shot>
  );
};

/** Sitting on a step (seat ~1.3 above the feet). */
const sitPose = (over: Partial<Pose> = {}): Pose => mergePose(REST, { lHip: [1.35, 0.1], rHip: [1.35, 0.1], lKnee: 1.3, rKnee: 1.3, bob: -1.25, lShoulder: [0.6, 0.1], rShoulder: [0.6, 0.1], lElbow: 1.2, rElbow: 1.2, ...over });

/** Close-up: his face lit only by the phone in the dark. */
const c5Face: ShotFn = (c) => {
  const hero: V3 = [0, 0, 0];
  const pose = mergePose(standing({ expression: "worried", headPitch: -0.3 }), { rShoulder: [1.1, -0.05], rElbow: 1.3 });
  const h = handPosition(pose, "r", hero);
  const cam = move({ position: [0.6, 3.9, 4.6], target: [0, 3.4, 0] }, { position: [0.4, 3.85, 3.8], target: [0, 3.45, 0] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 36 }} fog={false} stars light={0.12} shadows={false}>
      <Hero pose={pose} position={hero} />
      <Phone3D position={[h[0], h[1] + 0.35, h[2] + 0.1]} rotation={[-0.6, Math.PI, 0]} glow="#9AC0FF" />
      <pointLight position={[h[0], h[1] + 0.6, h[2] + 0.6]} color="#9AC0FF" intensity={9} distance={5} decay={2} />
      <CityRing power={0} />
    </Shot>
  );
};

/** Night kitchen: he opens the fridge; its light is dead. A flashlight beam. */
const c5Fridge: ShotFn = (c) => {
  const open = k01(c.lt, 0.1, 0.7);
  const hero: V3 = [4.6, 0, 3.4];
  const pose = mergePose(standing({ expression: "worried", headYaw: 0.2 }), { lShoulder: [1.2, 0.1], lElbow: 0.3 });
  const hand = handPosition(pose, "l", hero, Math.PI * 0.95);
  const cam = move({ position: [-0.5, 3.6, 4.8], target: [5.4, 2.8, -1.2] }, { position: [0.3, 3.5, 4.2], target: [5.4, 2.8, -1.2] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 40 }} fog={false} stars={false} light={0.18} shadowSize={10}>
      <Kitchen t={c.t} lamp={false} fridgeOpen={open} fridgeLight={false} sky="#1A2038" />
      <Hero pose={pose} position={hero} yaw={Math.PI * 0.95} />
      <FlashBeam from={[hand[0], hand[1] + 0.2, hand[2]]} to={[KITCHEN.fridge[0], 2.6, KITCHEN.fridge[2] + 0.6]} />
    </Shot>
  );
};

const c5Tower: ShotFn = (c) => {
  const k = k01(c.lt, 0.6, 1.4);
  const cam = move({ position: [-20, 4, 30], target: [0, 18, 0] }, { position: [-16, 3.5, 26], target: [0, 20, 0] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 44 }} fog={[120, 600]} shadowSize={40} light={0.5}>
      <CellTower position={[0, 0, 0]} h={34} signal={1 - k} t={c.t} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[1200, 1200]} />
        <Flat color="#232C26" />
      </mesh>
      {/* backup battery cabinet with a status light going out */}
      <mesh position={[5, 2, 3]} castShadow>
        <BoxG args={[3, 4, 2]} />
        <Flat color="#9AA1B0" />
      </mesh>
      <mesh position={[5, 3.2, 4.02]}>
        <planeGeometry args={[0.4, 0.4]} />
        {k < 0.95 ? <Glow color={k > 0.4 ? "#FF3A2E" : "#3AE07A"} /> : <Flat color="#2A2E38" />}
      </mesh>
      <CityRing radius={170} power={0} />
    </Shot>
  );
};

const c5Tap: ShotFn = (c) => {
  const flow = 1 - k01(c.lt, 0.8, 1.3);
  const cam = move({ position: [-2.6, 3.6, 0.8], target: [0, 2.5, -2.2] }, { position: [-2.2, 3.4, 0.3], target: [0, 2.45, -2.2] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.2} shadowSize={8}>
      <Kitchen t={c.t} lamp={false} flow={flow} sputter sky="#1A2038" />
      <FlashBeam from={[-1.6, 3.6, 1.2]} to={[0, 2.2, -2.2]} strength={0.35} />
    </Shot>
  );
};

const c5Waste: ShotFn = (c) => {
  const run = 1 - k01(c.lt, 0.2, 1.8);
  const cam = move({ position: [36, 22, 40], target: [0, 2, 0] }, { position: [30, 19, 34], target: [0, 2, 0] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 40 }} fog={[150, 700]} shadowSize={60} light={0.5}>
      <WaterPlant t={c.t} run={run} />
      <CityRing radius={170} power={0} />
    </Shot>
  );
};

const c5Phone: ShotFn = (c) => {
  const at: V3 = [0, 3, 0];
  const cam = move({ position: [0.06, 3.02, 1.75], target: [0, 2.98, 0] }, { position: [0.03, 3, 1.45], target: [0, 3, 0] }, c);
  return (
    <Shot
      mood="night"
      camera={{ ...cam, fov: 34 }}
      fog={false}
      light={0.15}
      shadows={false}
      overlay={
        <ScreenHtml c={[at[0], at[1], at[2] + PHONE.d / 2 + 0.003]} w={PHONE.screenW} h={PHONE.screenH} cam={{ ...cam, fov: 34 }} width={c.width} height={c.height}>
          {(w, h) => <NoSignalScreen w={w} h={h} battery={0.14} time="9:41" />}
        </ScreenHtml>
      }
    >
      <Phone3D position={at} glow="#9AC0FF" />
      <mesh position={[0.04, 3 - PHONE.h / 2 - 0.06, 0.02]} scale={[1.1, 0.8, 0.9]}>
        <IcoG args={[0.22, 2]} />
        <Flat color={P.skin} />
      </mesh>
      <pointLight position={[0, 3, 1]} color="#9AC0FF" intensity={3} distance={4} decay={2} />
      <CityRing power={0} radius={60} />
    </Shot>
  );
};

/** Under the stars over a blacked-out city, alone on the steps. */
const c5Nobody: ShotFn = (c) => {
  const k = prog(c);
  const cam = { position: [lerp(-12, -16, k), lerp(5, 11, k), lerp(18, 30, k)] as V3, target: [ENTRANCE_X - 3, lerp(4, 12, k), -4] as V3, fov: 44 };
  return (
    <Shot mood="night" camera={cam} fog={[150, 900]} shadowSize={60} light={0.45}>
      <BigStreet seed="avenue" lamps={false} cars={false} power={0} />
      <AvenueCars />
      <group position={[ENTRANCE_X, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <ApartmentEntrance lit={false} />
      </group>
      <Hero pose={mergePose(sitPose(), { headPitch: 0.5, expression: "worried" })} position={[ENTRANCE_X - 3.3, 0.52, 0]} yaw={-Math.PI / 2} />
      <CityRing power={0} />
    </Shot>
  );
};

// ================================================================ 06 THE FIRST WEEK

/** The plan, written on a notepad by candlelight on a grey morning. */
const drawPlan = (k: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#F4F0E2";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#B8C8DC";
  ctx.lineWidth = 2;
  for (let y = H * 0.18; y < H; y += H * 0.11) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#1A2A5A";
  ctx.font = CANVAS_FONT(H * 0.085);
  ctx.textAlign = "left";
  const lines = ["PLAN — WEEK 1", "1. Bottled water", "2. Food that keeps", "3. Medicine", "4. Warm clothes", "5. A safe place"];
  const n = Math.floor(k * lines.length * 10) / 10;
  lines.forEach((l, i) => {
    if (i > n) return;
    const part = i + 1 > n ? l.slice(0, Math.floor((n - i) * l.length)) : l;
    ctx.fillText(part, W * 0.08, H * (0.15 + i * 0.11));
  });
};

const c6Plan: ShotFn = (c) => {
  const T = KITCHEN.table;
  const pad: V3 = [T[0] + 0.2, KITCHEN.tableTop + 0.02, T[2] + 0.4];
  const cam = move({ position: [T[0] + 1.4, 5.0, T[2] + 3.6], target: [pad[0], pad[1], pad[2]] }, { position: [T[0] + 1.0, 4.4, T[2] + 2.8], target: [pad[0], pad[1], pad[2]] }, c);
  const hand: V3 = [pad[0] + 0.3 + Math.sin(c.lt * 6) * 0.25, pad[1] + 0.25, pad[2] + 0.3];
  return (
    <Shot mood="overcast" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.45} shadowSize={8}>
      <Kitchen t={c.t} lamp={false} candle sky="#AEB6C2" />
      <CanvasPanel position={pad} rotation={[-Math.PI / 2, 0, 0.15]} w={1.8} h={2.3} px={600} draw={drawPlan(k01(c.lt, 0.1, 2.8))} />
      <mesh position={hand} scale={[1.1, 0.8, 1]}>
        <IcoG args={[0.22, 2]} />
        <Flat color={P.skin} />
      </mesh>
      <mesh position={[hand[0] + 0.6, hand[1] + 0.15, hand[2] + 0.5]} rotation={[0, -0.6, 0]}>
        <BoxG args={[0.32, 0.3, 1.2]} />
        <Flat color={P.jacket} />
      </mesh>
      <mesh position={[hand[0] - 0.1, hand[1] - 0.05, hand[2] - 0.2]} rotation={[0.9, 0, 0.3]}>
        <CylG args={[0.03, 0.03, 0.8, 6]} />
        <Flat color="#E0B04E" />
      </mesh>
    </Shot>
  );
};

const c6Spoiled: ShotFn = (c) => {
  const recoil = k01(c.lt, 0.5, 0.9);
  const hero: V3 = [4.6, 0, 3.4];
  const pose = mergePose(standing({ expression: recoil > 0.5 ? "alarm" : "worried", headPitch: -0.1, lean: -0.15 * recoil }), { rShoulder: [1.6 * recoil, 0.1], rElbow: 2.2 * recoil });
  const cam = move({ position: [-0.5, 3.6, 4.8], target: [5.4, 2.8, -1.2] }, { position: [0.3, 3.5, 4.2], target: [5.4, 2.8, -1.2] }, c);
  return (
    <Shot mood="overcast" camera={{ ...cam, fov: 40 }} fog={false} stars={false} light={0.45} shadowSize={10}>
      <Kitchen t={c.t} lamp={false} fridgeOpen={1} fridgeLight={false} spoil={1} sky="#AEB6C2" />
      <Hero pose={pose} position={hero} yaw={Math.PI * 0.95} />
      {/* flies */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[KITCHEN.fridge[0] + Math.sin(c.t * 7 + i * 2) * 0.8, 3.2 + Math.cos(c.t * 5 + i) * 0.6, KITCHEN.fridge[2] + 1.4 + Math.sin(c.t * 6 + i) * 0.4]}>
          <IcoG args={[0.04, 0]} />
          <Flat color="#141414" />
        </mesh>
      ))}
    </Shot>
  );
};

const c6Murky: ShotFn = (c) => {
  const flow = c.lt < 2.6 ? 1 : 0;
  const cam = move({ position: [-2.4, 3.4, 0.6], target: [0, 2.4, -2.2] }, { position: [-1.8, 3.1, -0.1], target: [0, 2.35, -2.2] }, c);
  return (
    <Shot mood="overcast" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.45} shadowSize={8}>
      <Kitchen t={c.t} lamp={false} flow={flow} murky={0.8} sputter sky="#AEB6C2" />
    </Shot>
  );
};

const c6Water: ShotFn = (c) => {
  const lift = k01(c.lt, 0.2, 0.9);
  const hero: V3 = [2.9, 0, -2];
  const pose = mergePose(standing({ expression: "neutral", headPitch: -0.3 }), { lShoulder: [0.7 + lift * 0.4, 0.1], rShoulder: [0.7 + lift * 0.4, 0.1], lElbow: 1.0, rElbow: 1.0 });
  const cam = move({ position: [2.4, 5.6, 7], target: [2.9, 2.5, -4] }, { position: [2.6, 5.2, 5.4], target: [2.9, 2.5, -4] }, c);
  return (
    <Shot mood="overcast" camera={{ ...cam, fov: 40 }} fog={false} stars={false} light={0.6} shadowSize={14}>
      <group scale={[1.6, 1.6, 1.6]}>
        <Supermarket stock={0.6} seed="week" />
      </group>
      <Hero pose={pose} position={hero} yaw={Math.PI} />
      <BigTrolley position={[2.9, 0, -5.5]} yaw={0} />
      {/* bottled water packs in the trolley */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[2.9 + (i - 1) * 0.8, 2.4 + (i % 2) * 0.3, -5.6]} castShadow>
          <BoxG args={[0.75, 0.6, 0.9]} />
          <meshLambertMaterial color="#A8D4F0" transparent opacity={0.85} />
        </mesh>
      ))}
    </Shot>
  );
};

const shelvesShot = (kind: "pharmacy" | "clothes"): ShotFn => (c) => {
  const cam = move({ position: [-5, 4.0, 7], target: [0, 3.0, 0] }, { position: [-2, 3.8, 6.5], target: [1, 3.0, 0] }, c);
  const reachK = k01(c.lt, 0.15, 0.6);
  const hand: V3 = [lerp(4, 0.6, reachK), 3.5, lerp(3, 0.9, reachK)];
  return (
    <Shot mood="overcast" camera={{ ...cam, fov: 36 }} fog={false} stars={false} light={0.6} shadowSize={10}>
      <mesh position={[0, -0.05, 2]} receiveShadow>
        <BoxG args={[30, 0.1, 14]} />
        <Flat color={kind === "pharmacy" ? "#E8ECF0" : "#8A7A66"} />
      </mesh>
      <mesh position={[0, 4.5, -1]}>
        <BoxG args={[30, 9, 0.2]} />
        <Flat color={kind === "pharmacy" ? "#F2F4F6" : "#C8BCA8"} />
      </mesh>
      <SupplyShelves kind={kind} w={16} seed={kind} stock={0.85} />
      <mesh position={hand} scale={[1.1, 0.85, 1]}>
        <IcoG args={[0.22, 2]} />
        <Flat color={P.skin} />
      </mesh>
      <mesh position={[hand[0] + 0.7, hand[1] - 0.1, hand[2] + 0.4]} rotation={[0, -0.6, -0.15]}>
        <BoxG args={[1.3, 0.32, 0.34]} />
        <Flat color={P.jacket} />
      </mesh>
      <pointLight position={[0, 7, 5]} color="#F4F8FF" intensity={26} distance={20} decay={2} />
    </Shot>
  );
};

/** Loading the car outside his building on a grey morning. */
const c6Load: ShotFn = (c) => {
  const lift = Math.abs(Math.sin(c.lt * 2.2));
  const car: V3 = [8.5, 0, 6];
  const hero: V3 = [10.8, 0.24, 13.2];
  const pose = mergePose(standing({ expression: "neutral", headPitch: -0.2, lean: 0.25 * lift }), { lShoulder: [0.9 + lift * 0.4, 0.1], rShoulder: [0.9 + lift * 0.4, 0.1], lElbow: 0.6, rElbow: 0.6 });
  const cam = move({ position: [-4, 6, 30], target: [9, 3, 6] }, { position: [-2, 5.6, 26], target: [9, 3, 6] }, c);
  return (
    <Shot mood="overcast" camera={{ ...cam, fov: 40 }} fog={[100, 500]} shadowSize={40}>
      <Avenue day power={0} />
      <group position={[ENTRANCE_X, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <ApartmentEntrance lit={false} />
      </group>
      <Convertible position={car} color="#24748F" />
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[car[0] + (i % 2 ? 1.0 : -1.0), 2.6 + Math.floor(i / 2) * 0.7, car[2] - 3.4 + (i % 2) * 0.4]} castShadow>
          <BoxG args={[1.6, 0.7, 1.2]} />
          <Flat color={["#B39A62", "#A8D4F0", "#7A5A3E", "#E0B04E"][i]} />
        </mesh>
      ))}
      <Hero pose={pose} position={hero} yaw={Math.PI * 0.85} />
      <Sky t={c.t} tint="overcast" />
    </Shot>
  );
};

/** Dusk: walking home with bags; far off, a glow on the horizon. */
const c6Think: ShotFn = (c) => {
  const z = -60 + c.lt * 1.4;
  const { pose: wp } = walking(c.lt, 1.4, { expression: "neutral" });
  const look = k01(c.lt, 2.0, 2.8);
  const pose = mergePose(wp, { headYaw: -0.7 * look, lShoulder: [0.2, 0.25], rShoulder: [0.2, 0.25], lElbow: 0.2, rElbow: 0.2 });
  const cam = move({ position: [-2, 4.5, z + 18], target: [3, 3.6, z - 30] }, { position: [-1, 4.2, z + 14], target: [2, 3.8, z - 30] }, c);
  return (
    <Shot mood="dust" camera={{ ...cam, fov: 40 }} fog={[100, 600]} shadowSize={40} dust={0.4} light={0.7}>
      <BigStreet seed="avenue" lamps={false} cars={false} power={0} />
      <AvenueCars />
      <Hero pose={pose} position={[3, 0, z]} yaw={Math.PI} />
      {[-1, 1].map((s) => {
        const hp = handPosition(pose, s > 0 ? "r" : "l", [3, 0, z], Math.PI);
        return (
          <mesh key={s} position={[hp[0], hp[1] - 0.7, hp[2]]} castShadow>
            <BoxG args={[0.9, 1.1, 0.5]} />
            <Flat color="#F2EEE6" />
          </mesh>
        );
      })}
      <Halo position={[-120, 30, -420]} size={140} color="#FF8A3A" opacity={0.35} />
      <CityRing power={0} />
    </Shot>
  );
};

/** One window glowing orange, smoke curling out. */
const c6FireWindow: ShotFn = (c) => {
  const cam = move({ position: [0, 14, 22], target: [0, 15, 0] }, { position: [0, 14.5, 18], target: [0, 15.2, 0] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 38 }} fog={false} light={0.3} dust={0.3}>
      <mesh position={[0, 15, -0.5]} receiveShadow>
        <BoxG args={[40, 30, 1]} />
        <Flat color="#3A3448" />
      </mesh>
      {[-8, 0, 8].map((x) => (
        <mesh key={x} position={[x, 15, 0.02]}>
          <planeGeometry args={[4, 5]} />
          {x === 0 ? <Glow color={Math.sin(c.t * 9) > -0.3 ? "#FF8A2A" : "#FFB040"} /> : <Flat color="#141822" />}
        </mesh>
      ))}
      <Fireball position={[0, 14.5, 0.5]} progress={0.35 + Math.sin(c.t * 3) * 0.05} radius={2.0} seed="win" />
      <SmokeCluster position={[0, 18, 1]} progress={(c.t * 0.3) % 1} radius={2.6} rise={8} color="#3A3436" seed="winsmoke" />
      <pointLight position={[0, 15, 3]} color="#FF8A2A" intensity={50} distance={20} decay={2} />
    </Shot>
  );
};

/** A building burning floor by floor, nobody coming; he watches from the street. */
const c6Blaze: ShotFn = (c) => {
  const k = prog(c);
  const cam = move({ position: [-10, 6, 60], target: [20, 18, -20] }, { position: [-8, 5.5, 52], target: [20, 18, -20] }, c);
  const fires = [0, 1, 2, 3, 4, 5].filter((i) => k * 6 + 1 > i);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 42 }} fog={[100, 600]} shadowSize={60} light={0.35} dust={0.4}>
      <BigStreet seed="fire" lamps={false} cars={false} power={0} />
      {fires.map((i) => (
        <group key={i}>
          <Fireball position={[22, 10 + i * 4.5, -20 + (i % 2) * 6]} progress={0.4 + 0.08 * Math.sin(c.t * 2 + i)} radius={3 + (i % 3)} seed={`bl${i}`} />
          <SmokeCluster position={[22, 16 + i * 4.5, -20]} progress={(c.t * 0.18 + i * 0.17) % 1} radius={6} rise={22} color="#2A2426" seed={`bs${i}`} />
        </group>
      ))}
      <pointLight position={[18, 20, -10]} color="#FF7A2A" intensity={260} distance={90} decay={2} />
      <Hero pose={standing({ expression: "alarm", headPitch: 0.25, headYaw: 0.5 })} position={[-2, 0, 22]} yaw={Math.PI - 0.6} />
      <CityRing power={0} />
    </Shot>
  );
};

const c6FireStation: ShotFn = (c) => {
  const cam = move({ position: [-14, 6, 34], target: [0, 7, 0] }, { position: [-10, 6, 30], target: [0, 7, 0] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 40 }} fog={[100, 500]} shadowSize={40} light={0.45} dust={0.3}>
      <FireStation />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 10]} receiveShadow>
        <planeGeometry args={[600, 300]} />
        <Flat color={P.pavement} />
      </mesh>
      <Halo position={[60, 30, -80]} size={60} color="#FF8A3A" opacity={0.3} />
      <CityRing power={0} />
    </Shot>
  );
};

/** He misses a step on the stairs and sits, holding his ankle. */
const c6Injury: ShotFn = (c) => {
  const fall = k01(c.lt, 0.25, 0.6);
  const hero: V3 = [ENTRANCE_X - 3.3, 0.52, 0];
  const stand = walking(c.lt, 1.2).pose;
  const sat = mergePose(sitPose(), { lean: 0.5, lShoulder: [1.3, -0.1], rShoulder: [1.3, -0.1], lElbow: 0.6, rElbow: 0.6, expression: "alarm", rKnee: 2.0, rHip: [1.9, 0.1] });
  const pose = fall < 0.5 ? mergePose(stand, { lean: 0.4 * fall, expression: "alarm" }) : sat;
  const cam = move({ position: [ENTRANCE_X - 18, 4, 9], target: [ENTRANCE_X - 3, 2.2, 0] }, { position: [ENTRANCE_X - 15, 3.6, 7.5], target: [ENTRANCE_X - 3, 2.0, 0] }, c);
  return (
    <Shot mood="overcast" camera={{ ...cam, fov: 38 }} fog={[100, 500]} shadowSize={30}>
      <Avenue day power={0} />
      <group position={[ENTRANCE_X, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <ApartmentEntrance lit={false} />
      </group>
      <Hero pose={pose} position={hero} yaw={-Math.PI / 2} />
      <Sky t={c.t} tint="overcast" />
    </Shot>
  );
};

/** Bandaging a cut hand by candlelight, first-aid kit open. */
const c6Bandage: ShotFn = (c) => {
  const T = KITCHEN.table;
  const center: V3 = [T[0], KITCHEN.tableTop + 0.4, T[2] + 0.4];
  const wrap = c.lt * 3;
  const cam = move({ position: [T[0] + 2.4, 3.6, T[2] + 2.8], target: center }, { position: [T[0] + 1.8, 3.3, T[2] + 2.1], target: center }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 36 }} fog={false} stars={false} light={0.15} shadowSize={6}>
      <Kitchen t={c.t} lamp={false} candle sky="#1A2038" />
      {/* first-aid kit */}
      <group position={[T[0] + 1.0, KITCHEN.tableTop, T[2] - 0.3]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <BoxG args={[1.2, 0.5, 0.8]} />
          <Flat color="#2F7A5A" />
        </mesh>
        <mesh position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.5, 0.14]} />
          <Flat color="#F2F2EE" />
        </mesh>
        <mesh position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[0.5, 0.14]} />
          <Flat color="#F2F2EE" />
        </mesh>
      </group>
      {/* the hand with a bandage being wound round it */}
      <mesh position={center} scale={[1.2, 0.85, 1]}>
        <IcoG args={[0.24, 2]} />
        <Flat color={P.skin} />
      </mesh>
      <mesh position={center} rotation={[wrap, 0, Math.PI / 2]}>
        <torusGeometry args={[0.22, 0.06, 6, 12]} />
        <Flat color="#F2F2EE" />
      </mesh>
      <mesh position={[center[0] + 0.7, center[1], center[2] + 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <BoxG args={[0.32, 1.2, 0.32]} />
        <Flat color={P.jacket} />
      </mesh>
      <mesh position={[center[0] - 0.4, center[1] + 0.1, center[2] + 0.25]} scale={[1.1, 0.85, 1]}>
        <IcoG args={[0.22, 2]} />
        <Flat color={P.skin} />
      </mesh>
    </Shot>
  );
};

/** Sick in bed at night, rain on the window. */
const BED_HERO: V3 = [BED.x, BED.mattressTop - (1.55 + 0.02 - 0.18), -2.55];
const c6Ill: ShotFn = (c) => {
  const cam = move({ position: [7.6, 4.6, 5.2], target: [2.2, 2.9, -2.4] }, { position: [6.8, 4.3, 4.3], target: [2.2, 3.0, -2.4] }, c);
  const pose = bedPose({ expression: "worried", blink: 0.6, headPitch: -0.25, lean: -0.3, lShoulder: [0.4, 0.05], rShoulder: [0.4, 0.05], lElbow: 1.2, rElbow: 1.2 });
  return (
    <Shot mood="night" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.22} shadowSize={10}>
      <Bedroom lampOn={false} />
      <Candle position={[0.3, 1.1, -3.1]} t={c.t} />
      <Hero pose={pose} position={BED_HERO} />
      <mesh position={[BED.x, BED.mattressTop + 0.55, -0.6]} castShadow>
        <BoxG args={[BED.w - 0.1, 1.1, 3.8]} />
        <Flat color="#5A6EA0" />
      </mesh>
      <Rain center={[WIN.x - 2, 3, WIN.z]} size={[3, 6, 4]} t={c.t} count={120} />
    </Shot>
  );
};

/** His building at night in the rain: one window lit by a candle. */
const c6Helpless: ShotFn = (c) => {
  const k = prog(c);
  const cam = { position: [lerp(-30, -40, k), lerp(8, 12, k), lerp(24, 34, k)] as V3, target: [ENTRANCE_X, 14, -6] as V3, fov: 42 };
  return (
    <Shot mood="storm" camera={cam} fog={[60, 400]} shadowSize={60} light={0.4}>
      <BigStreet seed="avenue" lamps={false} cars={false} power={0} />
      <AvenueCars />
      <group position={[ENTRANCE_X, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <ApartmentEntrance lit={false} />
      </group>
      <mesh position={[ENTRANCE_X - 0.4, 22, -3]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.4, 3.2]} />
        <Glow color="#FFB860" />
      </mesh>
      <Halo position={[ENTRANCE_X - 1, 22, -3]} size={6} color="#FFB060" opacity={0.4} />
      <Rain center={[cam.position[0] + 12, 10, cam.position[2] - 14]} size={[50, 30, 40]} t={c.t} count={900} />
      <CityRing power={0} />
      <Sky t={c.t} tint="storm" y={60} />
    </Shot>
  );
};

// ================================================================ cues

export const ACT2: Record<string, CuedShot<ShotFn>[]> = {
  c4: [
    { cue: null, fn: c4Trolley },
    { cue: "Supermarkets", fn: c4Market },
    { cue: "Petrol", fn: c4Petrol },
    { cue: "Homes are stocked", fn: c4Pantry },
    { cue: "You could sleep", fn: c4Mansion },
    { cue: "drive an expensive", fn: c4Supercar },
    { cue: "or walk through", fn: c4Museum },
    { cue: "But there's a problem", fn: c4Problem },
    { cue: "Almost everything", fn: c4Control },
    { cue: "maintained by other", fn: c4Works },
    { cue: "And those people", fn: c4Gone },
  ],
  c5: [
    { cue: null, fn: c5Map },
    { cue: "Power plants", fn: c5Plant },
    { cue: "automated controls", fn: c5Substation },
    { cue: "but also on operators", fn: c5Operators },
    { cue: "fuel deliveries", fn: c5Tankers },
    { cue: "maintenance", fn: c5Maintenance },
    { cue: "Some facilities", fn: c5Safe },
    { cue: "Others could", fn: c5Fault },
    { cue: "Different areas", fn: c5Districts },
    { cue: "There's no single", fn: c5Region },
    { cue: "But eventually", fn: c5Street },
    { cue: "And when the electricity", fn: c5Face },
    { cue: "Refrigerators", fn: c5Fridge },
    { cue: "Mobile networks", fn: c5Tower },
    { cue: "Water pumps", fn: c5Tap },
    { cue: "Wastewater", fn: c5Waste },
    { cue: "Your phone is still", fn: c5Phone },
    { cue: "But there's nobody", fn: c5Nobody },
  ],
  c6: [
    { cue: null, fn: c6Plan },
    { cue: "Fresh food", fn: c6Spoiled },
    { cue: "Depending on", fn: c6Murky },
    { cue: "You need bottled", fn: c6Water },
    { cue: "medicine", fn: shelvesShot("pharmacy") },
    { cue: "warm clothing", fn: shelvesShot("clothes") },
    { cue: "a safe place", fn: c6Load },
    { cue: "And you need to think", fn: c6Think },
    { cue: "Fire", fn: c6FireWindow },
    { cue: "Without firefighters", fn: c6Blaze },
    { cue: "Without emergency", fn: c6FireStation },
    { cue: "even a minor", fn: c6Injury },
    { cue: "A broken ankle", fn: c6Bandage },
    { cue: "or a serious", fn: c6Ill },
    { cue: "completely helpless", fn: c6Helpless },
  ],
};

export { ScreenHtml };
export type { ShotCtx };
