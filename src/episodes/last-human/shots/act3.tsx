/**
 * Act 3: 07 SURVIVAL MODE (misty dawn in the countryside), 08 NATURE MOVES IN (spring, ~day 20; a short
 * speculative "decades later" flash-forward), 09 LEFT BEHIND (golden afternoon, the animals).
 */
import React from "react";
import { random } from "remotion";
import { Building, Car } from "../../../slavoski/city";
import { Animal } from "../../../slavoski/animals";
import { Quadruped } from "../../../slavoski/critters";
import { BoxG, CylG, IcoG } from "../../../slavoski/detail";
import { FONT } from "../../../slavoski/fonts";
import { Flat, Glow } from "../../../slavoski/materials";
import { Bush, GrassTufts, LeafyTree } from "../../../slavoski/nature";
import { clamp01, type V3 } from "../../../slavoski/noise";
import { P } from "../../../slavoski/palette";
import { handPosition, Hero, mergePose, reach, type Pose } from "../../../slavoski/rig/Hero";
import { CanvasPanel } from "../../../slavoski/screens";
import type { CuedShot } from "../../../slavoski/timeline";
import { HillRing } from "../../no-work-2036/props";
import { Mountain } from "../../satellites-dark/props";
import { Barn, Bowl, Fence, Gate } from "../../smart-animals/props";
import { Fridge } from "../props/home";
import { Mansion, S, Suburb } from "../props/town";
import { Backpack, drawMap, Homestead, HomesteadRoom, HOUSE, ROOM, ShedWall, SolarPanel, Stream } from "../props/survival";
import { Convertible } from "../props/vehicles";
import { Forest, growthAt, Highway, LyingBike, RoadCracks } from "../props/wild";
import { AvenueCars, CityRing } from "./act1";
import { BigStreet, k01, lerp, move, prog, Shot, Sky, standing, walking, type ShotCtx, type ShotFn } from "./common";

// ================================================================ the countryside set

/** Homestead in its valley: forest, hills, mountains, the stream, the city far off on the horizon. */
export const Countryside: React.FC<{
  t: number;
  growth?: number;
  lit?: number;
  smoke?: boolean;
  panels?: number;
  snow?: number;
  garden?: number;
  barrel?: number;
  cityPower?: number;
  ground?: string;
  tint?: string;
  forest?: boolean;
}> = ({ t, growth = 0.15, lit = 0, smoke = true, panels = 0, snow = 0, garden, barrel, cityPower = 0, ground, tint, forest = true }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[2400, 2400]} />
      <Flat color={ground ?? (snow > 0.5 ? "#E8EEF4" : "#5E8A4A")} />
    </mesh>
    <Homestead t={t} lit={lit} smoke={smoke} panels={panels} snow={snow} garden={garden} growth={growth} barrel={barrel} />
    <Stream t={t} zc={34} frozen={snow > 0.7} />
    {forest ? (
      <Forest
        area={[-260, 260, -260, 120]}
        count={420}
        seed="valley"
        tint={tint}
        avoid={(x, z) => (Math.abs(x) < 45 && z > -40 && z < 70) || Math.abs(z - 34 - Math.sin(x * 0.04) * 8) < 6 || (x > 40 && x < 120 && z > 10 && z < 120)}
      />
    ) : null}
    <HillRing radius={330} count={22} color={snow > 0.5 ? "#D8E2EA" : "#4E7A4A"} seed="vhill" />
    {[0, 1, 2, 3].map((i) => (
      <Mountain key={i} position={[-500 + i * 330, 0, -620 - (i % 2) * 80]} h={170 + (i % 3) * 40} r={150} seed={`vm${i}`} />
    ))}
    {/* the city far away, toward +X / -Z */}
    <group position={[520, 0, -380]} scale={S * 0.8}>
      {Array.from({ length: 14 }, (_, i) => (
        <Building key={i} position={[(i % 7) * 7 - 21, 0, Math.floor(i / 7) * 8]} w={5} d={5} h={10 + random(`far${i}`) * 26} seed={`far${i}`} power={cityPower} decay={growth * 0.6} />
      ))}
    </group>
  </group>
);

// ================================================================ 07 SURVIVAL MODE

/** Leaves on the mansion pool; he walks away with a pack. */
const c7Playground: ShotFn = (c) => {
  const z = 6 + c.lt * 1.6;
  const { pose } = walking(c.lt, 1.6, { expression: "neutral" });
  const cam = move({ position: [14, 7, -6], target: [0, 2, 6] }, { position: [12, 6.5, -2], target: [0, 2.5, 10] }, c);
  return (
    <Shot mood="overcast" camera={{ ...cam, fov: 40 }} fog={[100, 500]} shadowSize={40}>
      <Mansion t={c.t} leaves={1} />
      <Hero pose={pose} position={[-3, 0.3, z]} />
      <Backpack position={[-3, 0.3, z]} />
      <Sky t={c.t} tint="overcast" />
    </Shot>
  );
};

/** A paper map on the table: circling the places that could work. */
const c7Map: ShotFn = (c) => {
  const T = ROOM.table;
  const pos: V3 = [T[0], ROOM.tableTop + 0.02, T[2]];
  const cam = move({ position: [T[0] + 0.4, 6.4, T[2] + 2.6], target: pos }, { position: [T[0] + 0.3, 5.8, T[2] + 2.0], target: pos }, c);
  const k = k01(c.lt, 0.2, 2.4);
  const hand: V3 = [pos[0] + 0.5 * Math.cos(c.lt * 4), pos[1] + 0.3, pos[2] + 0.2 + 0.3 * Math.sin(c.lt * 4)];
  return (
    <Shot mood="dawn" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.7} shadowSize={8}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[30, 0.1, 30]} />
        <Flat color="#4A3A2E" />
      </mesh>
      <mesh position={[T[0], ROOM.tableTop - 0.08, T[2]]} receiveShadow>
        <BoxG args={[6, 0.16, 4]} />
        <Flat color="#8A5A34" />
      </mesh>
      <CanvasPanel position={pos} rotation={[-Math.PI / 2, 0, 0.05]} w={3.6} h={2.6} px={800} draw={drawMap(k)} />
      <mesh position={hand} scale={[1.1, 0.8, 1]}>
        <IcoG args={[0.22, 2]} />
        <Flat color={P.skin} />
      </mesh>
      <mesh position={[hand[0] + 0.5, hand[1] + 0.12, hand[2] + 0.7]} rotation={[0, -0.5, 0]}>
        <BoxG args={[0.32, 0.3, 1.3]} />
        <Flat color={P.jacket} />
      </mesh>
      <pointLight position={[T[0] - 3, 6, T[2] - 2]} color="#FFD8B0" intensity={22} distance={16} decay={2} />
    </Shot>
  );
};

/** Drone shot over the misty valley at dawn, down to the farmhouse. */
const c7Find: ShotFn = (c) => {
  const k = k01(c.lt, 0, Math.min(c.dur, 4.5));
  const cam = { position: [lerp(-90, -34, k), lerp(70, 22, k), lerp(140, 52, k)] as V3, target: [0, lerp(0, 4, k), 0] as V3, fov: 42 };
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 600]} shadowSize={80} keyDir={[0.75, 0.35, -0.55]}>
      <Countryside t={c.t} growth={growthAt(10)} />
      <Convertible position={[16, 0, 20]} yaw={-0.6} color="#24748F" dirt={0.2} />
      <Sky t={c.t} tint="dawn" y={50} />
    </Shot>
  );
};

/** Filling a bucket at the stream by the house. */
const c7Water: ShotFn = (c) => {
  const x = 6;
  const zc = 34 + Math.sin(x * 0.04) * 8;
  const hero: V3 = [x, 0, zc - 3.6];
  const pose = reach(standing({ lean: 0.55, headPitch: -0.4, expression: "neutral" }), "r", [x + 0.2, 0.6, zc - 1.4], { position: hero }).pose;
  const h = handPosition(pose, "r", hero);
  const cam = move({ position: [x + 9, 3.2, zc + 6], target: [x, 1.6, zc - 2] }, { position: [x + 7.5, 3.0, zc + 5], target: [x, 1.6, zc - 2] }, c);
  return (
    <Shot mood="dawn" camera={{ ...cam, fov: 40 }} fog={[50, 400]} shadowSize={30} keyDir={[0.75, 0.35, -0.55]}>
      <Countryside t={c.t} growth={growthAt(10)} />
      <Hero pose={pose} position={hero} />
      <mesh position={[h[0], h[1] - 0.55, h[2]]} castShadow>
        <CylG args={[0.45, 0.35, 0.8, 10]} />
        <Flat color="#9AA1B0" />
      </mesh>
      <Sky t={c.t} tint="dawn" />
    </Shot>
  );
};

/** Carrying a solar panel from the car to the house. */
const c7Panels: ShotFn = (c) => {
  const z = 22 - c.lt * 1.5;
  const { pose: wp } = walking(c.lt, 1.5, { expression: "neutral" });
  const pose = mergePose(wp, { lShoulder: [1.4, 0.15], rShoulder: [1.4, 0.15], lElbow: 1.5, rElbow: 1.5 });
  const cam = move({ position: [22, 6, z + 14], target: [6, 3, z - 4] }, { position: [20, 5.6, z + 11], target: [6, 3, z - 6] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 40 }} fog={[80, 500]} shadowSize={40}>
      <Countryside t={c.t} growth={growthAt(12)} panels={1} />
      <Convertible position={[16, 0, 26]} yaw={-0.6} color="#24748F" dirt={0.2} />
      <Hero pose={pose} position={[7, 0, z]} yaw={Math.PI} />
      <SolarPanel position={[7, 3.6, z - 0.9]} rotation={[0.2, 0, 0]} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

/** Stocking the shed: tools on the pegboard, batteries, a first-aid kit. */
const c7Shed: ShotFn = (c) => {
  const hero: V3 = [-1.5, 0, 3.5];
  const pose = mergePose(standing({ expression: "neutral", headPitch: -0.1 }), { lShoulder: [1.3, 0.1], rShoulder: [1.3, 0.1], lElbow: 0.6, rElbow: 0.6 });
  const cam = move({ position: [6, 5, 10], target: [0, 3.2, 0] }, { position: [5, 4.6, 8.5], target: [0, 3.2, 0] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 40 }} fog={false} stars={false} light={0.6} shadowSize={10}>
      <mesh position={[0, -0.05, 4]} receiveShadow>
        <BoxG args={[16, 0.1, 12]} />
        <Flat color="#7A5A3E" />
      </mesh>
      <ShedWall stock={0.5 + prog(c) * 0.5} />
      <Hero pose={pose} position={hero} yaw={Math.PI} />
      <mesh position={[-1.5, 2.6, 2.2]} castShadow>
        <BoxG args={[1.6, 0.9, 1.0]} />
        <Flat color="#2A2A30" />
      </mesh>
      <pointLight position={[2, 7, 6]} color="#FFF0D8" intensity={22} distance={18} decay={2} />
    </Shot>
  );
};

/** Boiling water over the fire; a cloth filter on a bucket. */
const c7Boil: ShotFn = (c) => {
  const pot = ROOM.pot;
  const cam = move({ position: [pot[0] + 3.4, 3.4, pot[2] + 5.0], target: [pot[0], 1.8, pot[2]] }, { position: [pot[0] + 2.6, 3.1, pot[2] + 4.0], target: [pot[0], 1.8, pot[2]] }, c);
  return (
    <Shot mood="dawn" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.35} shadowSize={8}>
      <HomesteadRoom t={c.t} jars={4} window="#E8C8B8" />
      {/* steam */}
      {Array.from({ length: 8 }, (_, i) => {
        const ph = (c.t * 0.5 + i / 8) % 1;
        return (
          <mesh key={i} position={[pot[0] + Math.sin(i * 2 + c.t) * 0.3 * ph, pot[1] + 0.5 + ph * 2.4, pot[2] + 0.1]} scale={0.4 + ph * 0.8}>
            <IcoG args={[0.3, 1]} />
            <meshLambertMaterial color="#F2F2F2" transparent opacity={0.5 * (1 - ph)} depthWrite={false} />
          </mesh>
        );
      })}
      {/* filter bucket */}
      <group position={[pot[0] + 2.6, 0, pot[2] + 1.6]}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <CylG args={[0.7, 0.55, 1.6, 10]} />
          <Flat color="#C8CCD4" />
        </mesh>
        <mesh position={[0, 1.62, 0]}>
          <CylG args={[0.66, 0.66, 0.06, 10]} />
          <Flat color="#F2EEE0" />
        </mesh>
      </group>
    </Shot>
  );
};

/** Filling jars on the shelf. */
const c7Jars: ShotFn = (c) => {
  const S0 = ROOM.shelf;
  const hero: V3 = [S0[0] - 1, 0, S0[2] + 3.4];
  const pose = reach(standing({ expression: "smile", headPitch: 0.05 }), "r", [S0[0] - 0.4, 3.6, S0[2] + 0.6], { position: hero, yaw: Math.PI }).pose;
  const cam = move({ position: [S0[0] - 6, 4.4, S0[2] + 7], target: [S0[0], 3.2, S0[2]] }, { position: [S0[0] - 5, 4.2, S0[2] + 6], target: [S0[0], 3.2, S0[2]] }, c);
  return (
    <Shot mood="dawn" camera={{ ...cam, fov: 40 }} fog={false} stars={false} light={0.45} shadowSize={10}>
      <HomesteadRoom t={c.t} jars={8 + Math.floor(prog(c) * 8)} window="#E8C8B8" />
      <Hero pose={pose} position={hero} yaw={Math.PI} />
    </Shot>
  );
};

// ================================================================ 08 NATURE MOVES IN

/** From the porch: the far city on the horizon. */
const c8Horizon: ShotFn = (c) => {
  const hero: V3 = [2, 0.5, HOUSE.d / 2 + 2.2];
  const cam = move({ position: [-4, 5, HOUSE.d / 2 + 9], target: [60, 6, -40] }, { position: [-6, 6, HOUSE.d / 2 + 12], target: [200, 10, -150] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 40 }} fog={[100, 900]} shadowSize={40}>
      <Countryside t={c.t} growth={growthAt(20)} panels={2} />
      <Hero pose={standing({ headYaw: 0.6, expression: "neutral" })} position={hero} yaw={Math.PI * 0.75} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

/** Ground-level close-up: a weed opening in a pavement crack, the city blurred behind. */
const c8Sprout: ShotFn = (c) => {
  const g = 0.04 + k01(c.lt, 0, 2.6) * 0.1;
  const cam = move({ position: [0.5, 0.9, 4.2], target: [0, 0.6, 0] }, { position: [0.3, 0.8, 3.4], target: [0, 0.65, 0] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 34 }} fog={[30, 300]} shadowSize={10}>
      <BigStreet seed="avenue" day cars={false} />
      <group position={[0, 0.24, 0]}>
        <RoadCracks area={[-1, 1, -1, 1]} count={2} growth={g * 3} seed="sprout" />
      </group>
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

/** An empty highway; birds land on the warm asphalt. */
const c8Highway: ShotFn = (c) => {
  const cam = move({ position: [-8, 10, 40], target: [10, 2, -80] }, { position: [-6, 9, 30], target: [10, 2, -90] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 42 }} fog={[150, 900]} shadowSize={60}>
      <Highway growth={growthAt(20)} />
      {Array.from({ length: 7 }, (_, i) => {
        const land = clamp01(c.lt * 0.8 - i * 0.12);
        const x = 6 + (random(`bd${i}`) - 0.5) * 12;
        const z = -10 - random(`bz${i}`) * 30;
        return (
          <mesh key={i} position={[x, 0.3 + (1 - land) * 8, z + (1 - land) * 10]} rotation={[0, i, 0]}>
            <IcoG args={[0.35, 0]} />
            <Flat color="#3A3A44" />
          </mesh>
        );
      })}
      <Forest area={[-300, 300, -700, 60]} count={260} seed="hwyf" avoid={(x) => Math.abs(x) < 40} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

/** A deer walks down the avenue between the abandoned cars. */
const c8Deer: ShotFn = (c) => {
  const z = -60 + c.lt * 2.4;
  const cam = move({ position: [5, 3.2, z + 18], target: [2, 2.6, z] }, { position: [4.5, 3.0, z + 15], target: [2, 2.6, z] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 38 }} fog={[150, 700]} shadowSize={50}>
      <BigStreet seed="avenue" day cars={false} modify={() => ({ decay: 0.05 })} />
      <AvenueCars rust={0.05} />
      <Animal kind="deer" position={[2, 0, z]} yaw={0} scale={1.7} walk={c.lt * 0.9} headPitch={0.1 * Math.sin(c.lt)} />
      <GrassTufts area={[-12, 12, -80, 20]} count={60} growth={growthAt(20)} height={1.2} seed="avg" />
      <CityRing power={0} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

/** A fox trots past the shopfronts. */
const c8Fox: ShotFn = (c) => {
  const x = -10 + c.lt * 3.2;
  const cam = move({ position: [x - 6, 2.2, 12], target: [x, 1.2, 3] }, { position: [x - 3, 2.0, 11], target: [x + 2, 1.2, 3] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 38 }} fog={[60, 400]} shadowSize={30}>
      <BigStreet seed="avenue" day cars={false} />
      <Animal kind="fox" position={[x, 0.24, 3]} yaw={Math.PI / 2} scale={1.6} walk={c.lt * 1.6} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

/** Weeds pushing through the cracks of a side street. */
const c8Weeds: ShotFn = (c) => {
  const cam = move({ position: [3, 3.2, 12], target: [0, 0.5, -4] }, { position: [2, 2.8, 9], target: [0, 0.5, -5] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 40 }} fog={[60, 500]} shadowSize={30}>
      <BigStreet seed="side" day cars={false} />
      <RoadCracks area={[-8, 8, -20, 6]} count={14} growth={growthAt(25) + 0.05} seed="weeds" y={0.04} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

const c8Gardens: ShotFn = (c) => {
  const cam = move({ position: [-2, 6, 26], target: [-22, 2, -10] }, { position: [-4, 5.4, 22], target: [-22, 2, -12] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 40 }} fog={[100, 600]} shadowSize={40}>
      <Suburb seed="gardens" growth={0.3} />
      <LyingBike position={[-16, 0.8, -8]} yaw={0.6} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

/** Close on a facade: a broken window, a damp stain, a gutter hanging loose. */
const c8Decay: ShotFn = (c) => {
  const cam = move({ position: [-10, 16, 20], target: [0, 22, 0] }, { position: [-8, 20, 18], target: [0, 27, 0] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 40 }} fog={[80, 500]} shadowSize={40}>
      <group scale={S}>
        <Building position={[0, 0, -2.5]} w={8} d={5} h={14} seed="decay8" color={P.bldgPurple} decay={0.18} power={0} />
      </group>
      {/* stain */}
      <mesh position={[3, 30, 0.05]}>
        <planeGeometry args={[3, 12]} />
        <meshBasicMaterial color="#2A2A20" transparent opacity={0.22} />
      </mesh>
      <mesh position={[-6, 44, 0.6]} rotation={[0, 0, 0.5]} castShadow>
        <BoxG args={[10, 0.5, 0.6]} />
        <Flat color="#7A7E88" />
      </mesh>
      <CityRing power={0} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

/** Still a city: a few weeks in, only the edges are softening. */
const c8NotForest: ShotFn = (c) => {
  const cam = move({ position: [0, 40, 70], target: [0, 8, -60] }, { position: [0, 34, 56], target: [0, 8, -70] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 42 }} fog={[150, 800]} shadowSize={80}>
      <BigStreet seed="avenue" day cars={false} power={0} modify={() => ({ decay: 0.05 })} />
      <AvenueCars rust={0.05} />
      <GrassTufts area={[-12, 12, -200, 20]} count={120} growth={growthAt(30)} height={1.4} seed="nf" />
      <CityRing power={0} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

/** Time-lapse: the sun races across the sky, shadows sweep, and the street barely changes. */
const c8Timescale: ShotFn = (c) => {
  const k = prog(c);
  const ang = -0.6 + k * 2.4;
  const keyDir: V3 = [Math.cos(ang), Math.max(0.15, Math.sin(ang + 0.6)), -0.4];
  const cam = move({ position: [-6, 7, 34], target: [4, 6, -40] }, { position: [-5, 7, 32], target: [4, 6.2, -40] }, c);
  return (
    <Shot mood={k < 0.75 ? "day" : "sunset"} camera={{ ...cam, fov: 40 }} fog={[150, 700]} shadowSize={60} keyDir={keyDir}>
      <BigStreet seed="avenue" day cars={false} power={0} modify={() => ({ decay: 0.05 + k * 0.03 })} />
      <AvenueCars rust={0.05 + k * 0.05} />
      <GrassTufts area={[-12, 12, -120, 20]} count={80} growth={growthAt(30 + k * 40)} height={1.4} seed="ts" />
      <Sky t={c.t * 8} tint={k < 0.75 ? "day" : "sunset"} />
    </Shot>
  );
};

/** Speculative flash-forward: the same avenue, decades on. Tagged HYPOTHESIS on screen. */
const c8Decades: ShotFn & { tag?: "HYPOTHESIS" } = (c) => {
  const cam = move({ position: [-6, 7, 34], target: [4, 6, -40] }, { position: [-4, 6, 26], target: [4, 6, -40] }, c);
  const g = growthAt(18250);
  const flash = 1 - clamp01(c.lt / 0.35);
  return (
    <Shot
      mood="day"
      camera={{ ...cam, fov: 40 }}
      fog={[60, 500]}
      shadowSize={60}
      overlay={
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: FONT, color: "#F6EBC4", fontSize: 40, letterSpacing: "0.3em", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>DECADES LATER?</div>
          <div style={{ position: "absolute", inset: 0, background: `rgba(255,255,255,${flash * 0.8})` }} />
        </>
      }
    >
      <BigStreet seed="avenue" day cars={false} power={0} lamps={false} modify={() => ({ decay: g })} />
      <AvenueCars rust={0.9} moss={0.8} />
      <Forest area={[-60, 60, -260, 40]} count={90} seed="decadesF" avoid={(x) => Math.abs(x) > 18 && Math.abs(x) < 22} growth={0.9} />
      <GrassTufts area={[-14, 14, -200, 30]} count={260} growth={g} height={2.6} seed="dg" />
      <CityRing power={0} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};
c8Decades.tag = "HYPOTHESIS";

// ================================================================ 09 LEFT BEHIND

/** A dog waits at a front door, its bowl empty. */
const c9Waiting: ShotFn = (c) => {
  const door: V3 = [-26 + 5.15 * 1.45 + 1.2, 0, -4];
  const cam = move({ position: [-8, 3.2, 6], target: [door[0], 1.6, door[2]] }, { position: [-9, 2.9, 3.5], target: [door[0], 1.6, door[2]] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 36 }} fog={[100, 600]} shadowSize={30} keyDir={[0.8, 0.32, -0.5]}>
      <Suburb seed="search" growth={growthAt(25)} />
      <Quadruped kind="dog" position={[door[0] + 1.4, 0, door[2] + 1.2]} yaw={Math.PI / 2 + 0.4} scale={1.35} sit headPitch={0.15} face={{ eyeOpen: 1, brow: "worried", look: [0, 0.1] }} wag={0} />
      <Bowl position={[door[0] + 2.6, 0, door[2] - 0.8]} full={0} />
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

/** A cat at an upstairs window, looking out. */
const c9Cat: ShotFn = (c) => {
  const cam = move({ position: [6, 7.5, 9], target: [0, 7.2, 0] }, { position: [5, 7.4, 7.4], target: [0, 7.2, 0] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 36 }} fog={[60, 400]} shadowSize={20} keyDir={[0.8, 0.32, -0.5]}>
      <mesh position={[0, 8, -0.3]} receiveShadow>
        <BoxG args={[20, 16, 0.6]} />
        <Flat color="#E2C9B0" />
      </mesh>
      <mesh position={[0, 7.4, 0.02]}>
        <planeGeometry args={[4, 3.4]} />
        <Flat color="#3A3448" />
      </mesh>
      <mesh position={[0, 5.6, 0.35]} castShadow>
        <BoxG args={[4.6, 0.3, 0.8]} />
        <Flat color="#F2EEE6" />
      </mesh>
      <Quadruped kind="cat" position={[0.3, 5.75, 0.1]} yaw={0.2} scale={1.3} sit headPitch={0.05} face={{ eyeOpen: 1, brow: "worried", look: [0.1, 0] }} />
      <mesh position={[0, 7.4, 0.12]}>
        <planeGeometry args={[4, 3.4]} />
        <meshLambertMaterial color="#BFD8F0" transparent opacity={0.18} />
      </mesh>
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

/** A dog squeezes through a gap in a garden fence and trots off. */
const c9Escape: ShotFn = (c) => {
  const k = clamp01(c.lt / 2.0);
  const x = lerp(-3, 9, k);
  const cam = move({ position: [6, 3, 12], target: [2, 1.2, 0] }, { position: [8, 2.8, 11], target: [5, 1.2, 0] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 38 }} fog={[80, 500]} shadowSize={30} keyDir={[0.8, 0.32, -0.5]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <Flat color="#5E8A4A" />
      </mesh>
      <group scale={2}>
        <Fence x0={-12} x1={12} z={0} breakAt={0.6} burst={1} />
      </group>
      <Quadruped kind="dog" position={[x, 0, lerp(-3, 4, k)]} yaw={0.8} scale={1.35} walk={c.lt * 1.8} face={{ eyeOpen: 1, look: [0.2, 0] }} wag={c.lt * 3} />
      <GrassTufts area={[-30, 30, -20, 20]} count={80} growth={growthAt(25)} height={1.4} seed="esc" />
      <LeafyTree position={[-14, 0, -12]} scale={3} seed="esc1" />
      <LeafyTree position={[18, 0, -16]} scale={3.4} seed="esc2" />
      <Suburb seed="escape" growth={growthAt(25)} cars={false} />
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

/** Cows penned beside a barn, an empty trough. */
const FARM_GATE: V3 = [0, 0, 10];
const Farm: React.FC<{ t: number; open?: number; cowsOut?: number }> = ({ t, open = 0, cowsOut = 0 }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[1200, 1200]} />
      <Flat color="#6A8A44" />
    </mesh>
    <Barn position={[0, 0, -18]} w={20} d={14} h={12} doorOpen={0.4} />
    <group scale={2}>
      <Fence x0={-10} x1={-1.2} z={5} />
      <Fence x0={1.2} x1={10} z={5} />
    </group>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 20, 1.4, -6]} castShadow>
        <BoxG args={[0.3, 2.8, 22]} />
        <Flat color="#8A6A40" />
      </mesh>
    ))}
    <group position={FARM_GATE} scale={2}>
      <Gate position={[0, 0, 0]} open={open} />
    </group>
    {/* trough */}
    <mesh position={[-10, 0.8, 2]} castShadow>
      <BoxG args={[6, 1.6, 1.6]} />
      <Flat color="#7A7E88" />
    </mesh>
    {[0, 1, 2, 3].map((i) => {
      const out = clamp01(cowsOut * 1.6 - i * 0.25);
      const x = -8 + i * 5;
      const z = lerp(-4 + (i % 2) * 3, 16 + i * 3, out);
      return <Quadruped key={i} kind="cow" position={[lerp(x, (i - 1.5) * 2, Math.min(1, out * 2)) , 0, z]} yaw={out > 0 ? 0 : (i % 2 ? 0.6 : -0.4)} scale={2.6} walk={out > 0 && out < 1 ? t * 1.2 + i : 0} headPitch={out > 0 ? 0 : -0.3} face={{ eyeOpen: 1, brow: out > 0 ? "flat" : "worried" }} />;
    })}
    <Forest area={[-300, 300, -400, -60]} count={160} seed="farmf" />
    <HillRing radius={300} count={18} seed="farmh" />
  </group>
);

const c9Livestock: ShotFn = (c) => {
  const cam = move({ position: [18, 9, 30], target: [-2, 2, -4] }, { position: [14, 8, 26], target: [-2, 2, -4] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 40 }} fog={[100, 600]} shadowSize={40} keyDir={[0.8, 0.32, -0.5]}>
      <Farm t={c.t} />
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

/** He opens the gate and the cows wander out. */
const c9Gate: ShotFn = (c) => {
  const open = k01(c.lt, 0.1, 0.9);
  const hero: V3 = [5.5, 0, FARM_GATE[2] + 2.5];
  const pose = reach(standing({ expression: "neutral" }), "r", [3.2, 2.2, FARM_GATE[2] + 1.0], { position: hero, yaw: -Math.PI / 2 - 0.4 }).pose;
  const cam = move({ position: [14, 6, 30], target: [0, 2, 6] }, { position: [12, 5.5, 26], target: [0, 2, 6] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 40 }} fog={[100, 600]} shadowSize={40} keyDir={[0.8, 0.32, -0.5]}>
      <Farm t={c.t} open={open} cowsOut={clamp01((c.lt - 0.6) / 2.4)} />
      <Hero pose={pose} position={hero} yaw={-Math.PI / 2 - 0.4} />
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

/** Deer cross a silent highway in the golden light. */
const c9Herd: ShotFn = (c) => {
  const cam = move({ position: [30, 7, 30], target: [0, 2, -20] }, { position: [26, 6.4, 24], target: [0, 2, -20] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 40 }} fog={[150, 900]} shadowSize={60} keyDir={[0.8, 0.32, -0.5]}>
      <Highway growth={growthAt(30)} />
      {Array.from({ length: 7 }, (_, i) => {
        const x = -30 + c.lt * 4 + i * 4.5 + (random(`hd${i}`) - 0.5) * 3;
        return <Animal key={i} kind="deer" position={[x, 0, -16 - (i % 3) * 4]} yaw={Math.PI / 2} scale={1.6 + (i % 2) * 0.2} walk={c.lt * 1.0 + i * 0.3} />;
      })}
      <Forest area={[-300, 300, -700, 60]} count={260} seed="hwyf2" avoid={(x) => Math.abs(x) < 40} />
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

/** Wolves on a ridge above the city edge at dusk. */
const c9Wolves: ShotFn = (c) => {
  const cam = move({ position: [-14, 4, 20], target: [0, 12, -10] }, { position: [-11, 4.5, 17], target: [0, 12.5, -10] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 40 }} fog={[100, 900]} shadowSize={40} keyDir={[0.8, 0.25, -0.5]} dust={0.1}>
      <mesh position={[0, 0, -10]} scale={[2.2, 0.5, 1]} castShadow receiveShadow>
        <IcoG args={[22, 2]} />
        <Flat color="#5A6A44" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <Animal key={i} kind="wolf" position={[-6 + i * 5, 10.3, -10 + (i - 1) * 1.5]} yaw={-0.4 + i * 0.3} scale={1.8} headPitch={i === 1 ? 0.6 : 0.1} />
      ))}
      <group position={[160, 0, -260]} scale={S}>
        {Array.from({ length: 10 }, (_, i) => (
          <Building key={i} position={[(i % 5) * 7 - 14, 0, Math.floor(i / 5) * 8]} w={5} d={5} h={12 + random(`wc${i}`) * 20} seed={`wc${i}`} power={0} />
        ))}
      </group>
      <Forest area={[-300, 300, -500, -40]} count={160} seed="wolff" />
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

/** Golden wide: the land goes on changing. */
const c9Planet: ShotFn = (c) => {
  const cam = move({ position: [-120, 50, 160], target: [100, 0, -200] }, { position: [-100, 46, 140], target: [120, 0, -220] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 42 }} fog={[150, 1200]} shadowSize={150} keyDir={[0.8, 0.25, -0.5]}>
      <Countryside t={c.t} growth={growthAt(30)} panels={2} />
      {Array.from({ length: 5 }, (_, i) => (
        <Animal key={i} kind="deer" position={[-40 + i * 6, 0, 60 + (i % 2) * 5]} yaw={0.3} scale={1.6} walk={i * 0.3} headPitch={-0.5} />
      ))}
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

/** Even without us: the empty city at sunset. */
const c9Without: ShotFn = (c) => {
  const cam = move({ position: [0, 30, 120], target: [0, 20, -60] }, { position: [0, 26, 100], target: [0, 22, -60] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 40 }} fog={[150, 900]} shadowSize={80} keyDir={[0.8, 0.22, -0.5]}>
      <BigStreet seed="avenue" day cars={false} power={0} lamps={false} modify={() => ({ decay: growthAt(30) * 0.6 })} />
      <AvenueCars rust={0.08} />
      <CityRing power={0} />
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

// ================================================================ cues

export const ACT3: Record<string, CuedShot<ShotFn>[]> = {
  c7: [
    { cue: null, fn: c7Playground },
    { cue: "And start treating", fn: c7Map },
    { cue: "You find a house", fn: c7Find },
    { cue: "a reliable water", fn: c7Water },
    { cue: "You collect batteries", fn: c7Panels },
    { cue: "tools and", fn: c7Shed },
    { cue: "You learn how", fn: c7Boil },
    { cue: "and preserve food", fn: c7Jars },
  ],
  c8: [
    { cue: null, fn: c8Horizon },
    { cue: "Nature is beginning", fn: c8Sprout },
    { cue: "With traffic gone", fn: c8Highway },
    { cue: "Without constant", fn: c8Deer },
    { cue: "places they once", fn: c8Fox },
    { cue: "Weeds push", fn: c8Weeds },
    { cue: "Gardens become", fn: c8Gardens },
    { cue: "Unmaintained buildings", fn: c8Decay },
    { cue: "But cities wouldn't", fn: c8NotForest },
    { cue: "Nature works", fn: c8Timescale },
    { cue: "And some of the most", fn: c8Decades },
  ],
  c9: [
    { cue: null, fn: c9Waiting },
    { cue: "Some pets", fn: c9Cat },
    { cue: "Others might escape", fn: c9Escape },
    { cue: "Livestock trapped", fn: c9Livestock },
    { cue: "especially vulnerable", fn: c9Gate },
    { cue: "Wild animals", fn: c9Herd },
    { cue: "habitat disturbance", fn: c9Wolves },
    { cue: "The planet would", fn: c9Planet },
    { cue: "Even without us", fn: c9Without },
  ],
};

export { Car, Bush, Fridge, Glow };
export type { Pose, ShotCtx };
