/**
 * Act 5: 12 ONE YEAR LATER (autumn → storm → snow → spring), 13 THE LAST CHAPTER (night, stars, what
 * remains), 14 EARTH GOES ON (sunrise: forest, ocean, herds, Earth turning, the last human looking out,
 * the bedroom bookend, the avenue).
 */
import React from "react";
import { random } from "remotion";
import { Building, Plane } from "../../../slavoski/city";
import { Animal } from "../../../slavoski/animals";
import { BoxG, CylG, IcoG } from "../../../slavoski/detail";
import { FloodWater, SmokeCluster } from "../../../slavoski/fx";
import { FONT } from "../../../slavoski/fonts";
import { Flat, Glow, Halo } from "../../../slavoski/materials";
import { GrassTufts, LightningBolt, Rain, Snow } from "../../../slavoski/nature";
import { clamp01, type V3 } from "../../../slavoski/noise";
import { P } from "../../../slavoski/palette";
import { Hero, mergePose, reach, REST, type Pose } from "../../../slavoski/rig/Hero";
import { ScreenHtml } from "../../../slavoski/screens";
import { FacetedEarth } from "../../../slavoski/space";
import type { CuedShot } from "../../../slavoski/timeline";
import { Sea, Waves } from "../../satellites-dark/props";
import { BED, Bedroom, WIN } from "../../smart-animals/props";
import { AlarmClock, CLOCK, Phone3D, PHONE } from "../../ww3-countdown/props";
import { Laptop } from "../props/home";
import { Museum, S } from "../props/town";
import { Campfire, HOUSE, SolarPanel } from "../props/survival";
import { Convertible, drivingPose } from "../props/vehicles";
import { FallenTree, Forest, growthAt, RoadCracks } from "../props/wild";
import { AvenueCars, CityRing } from "./act1";
import { Countryside } from "./act3";
import { BigStreet, k01, lerp, move, prog, Shot, Sky, standing, walking, type ShotCtx, type ShotFn } from "./common";

const YEAR = growthAt(365);
const AUTUMN = "#C8862A";

/** The avenue a year on: grass in the cracks and medians, some broken windows, dirty cars, autumn trees. */
const YearAvenue: React.FC<{ power?: number; ring?: boolean }> = ({ ring = true }) => (
  <>
    <BigStreet seed="avenue" day cars={false} power={0} lamps={false} modify={(sp, i) => ({ decay: YEAR * (0.7 + random(`yd${i}`) * 0.6) })} />
    <AvenueCars rust={0.35} moss={0.15} />
    <GrassTufts area={[-12, 12, -260, 30]} count={260} growth={YEAR} height={1.8} seed="yearg" />
    <RoadCracks area={[-11, 11, -200, 20]} count={40} growth={YEAR} seed="yearc" />
    {ring ? <CityRing power={0} /> : null}
  </>
);

// ================================================================ 12 ONE YEAR LATER

const c12Aerial: ShotFn = (c) => {
  const cam = move({ position: [40, 90, 80], target: [0, 0, -80] }, { position: [30, 80, 60], target: [0, 0, -90] }, c);
  return (
    <Shot mood="sunset" camera={{ ...cam, fov: 42 }} fog={[150, 900]} shadowSize={120} keyDir={[0.8, 0.35, -0.5]}>
      <YearAvenue />
      <Forest area={[-60, 60, -300, 40]} count={40} seed="autumnT" avoid={(x) => Math.abs(x) < 24} growth={0.7} tint={AUTUMN} />
      <Sky t={c.t} tint="sunset" />
    </Shot>
  );
};

const c12Roads: ShotFn = (c) => {
  const cam = move({ position: [-10, 4, 24], target: [2, 2, -6] }, { position: [-8, 3.6, 20], target: [2, 2, -6] }, c);
  return (
    <Shot mood="overcast" camera={{ ...cam, fov: 40 }} fog={[80, 600]} shadowSize={40}>
      <YearAvenue />
      <FallenTree position={[0, 0, -6]} yaw={0.15} len={26} />
      <Sky t={c.t} tint="overcast" />
    </Shot>
  );
};

/** A storm lashes a building with broken windows; lightning. */
const c12Storm: ShotFn = (c) => {
  const flash = c.lt > 1.1 && c.lt < 1.3 ? 1 : 0;
  const cam = move({ position: [-20, 14, 46], target: [20, 22, -10] }, { position: [-16, 13, 40], target: [20, 22, -10] }, c);
  return (
    <Shot
      mood="storm"
      camera={{ ...cam, fov: 40 }}
      fog={[60, 500]}
      shadowSize={60}
      light={0.5 + flash * 1.5}
      overlay={flash ? <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.35)" }} /> : null}
    >
      <BigStreet seed="avenue" cars={false} power={0} lamps={false} modify={(sp, i) => ({ decay: YEAR * (0.8 + random(`sd${i}`) * 0.7) })} />
      <AvenueCars rust={0.35} />
      <Rain center={[cam.position[0] + 12, 14, cam.position[2] - 16]} size={[60, 34, 46]} t={c.t} count={1000} />
      {flash ? <LightningBolt top={[60, 160, -240]} bottom={[50, 40, -240]} flash={1} /> : null}
      <CityRing power={0} />
      <Sky t={c.t} tint="storm" y={70} />
    </Shot>
  );
};

/** A burnt-out block, charred and roofless. */
const c12Fires: ShotFn = (c) => {
  const cam = move({ position: [-30, 12, 40], target: [10, 10, -10] }, { position: [-24, 11, 34], target: [10, 10, -10] }, c);
  return (
    <Shot mood="overcast" camera={{ ...cam, fov: 40 }} fog={[80, 600]} shadowSize={60}>
      <BigStreet seed="fire" day cars={false} power={0} lamps={false} modify={(sp, i) => (sp.position[0] > 0 && i % 3 !== 0 ? { color: "#2A2624", decay: 0.6, sink: 0.25 } : { decay: YEAR })} />
      <GrassTufts area={[-12, 12, -120, 30]} count={120} growth={YEAR} height={1.6} seed="fireg" />
      <SmokeCluster position={[26, 30, -30]} progress={(c.t * 0.05) % 1} radius={6} rise={10} color="#8A8480" seed="oldsmoke" count={4} />
      <CityRing power={0} />
      <Sky t={c.t} tint="overcast" />
    </Shot>
  );
};

/** A flooded street: water to the car doors. */
const c12Flood: ShotFn = (c) => {
  const cam = move({ position: [-8, 7, 30], target: [2, 2, -20] }, { position: [-6, 6.4, 26], target: [2, 2, -22] }, c);
  return (
    <Shot mood="overcast" camera={{ ...cam, fov: 40 }} fog={[80, 600]} shadowSize={50}>
      <YearAvenue />
      <FloodWater level={2.2} t={c.t} size={[44, 280]} position={[0, 0, -100]} flow={0.6} />
      <Sky t={c.t} tint="overcast" />
    </Shot>
  );
};

/** Dead technology: a cracked, dusty phone and a laptop that won't wake. */
const c12Tech: ShotFn = (c) => {
  const at: V3 = [0, 2.03, 0.4];
  const press = c.lt > 1.0 && c.lt < 1.4;
  const cam = move({ position: [2.6, 4.4, 4.4], target: [0, 2.2, -0.2] }, { position: [2.0, 4.0, 3.6], target: [0, 2.2, -0.2] }, c);
  return (
    <Shot mood="overcast" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.5} shadowSize={8}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[20, 0.1, 20]} />
        <Flat color="#5A4A3A" />
      </mesh>
      <mesh position={[0, 1.95, 0]} castShadow receiveShadow>
        <BoxG args={[5, 0.16, 3]} />
        <Flat color="#7A5034" />
      </mesh>
      <Laptop position={[-0.8, 2.03, -0.3]} yaw={0.4} on={false} />
      <Phone3D position={[at[0] + 1.2, at[1] + PHONE.d / 2, at[2]]} rotation={[-Math.PI / 2, 0, -0.4]} glow="#0E1014" />
      {/* crack lines and dust on the phone */}
      {[0.3, -0.5, 1.1].map((r, i) => (
        <mesh key={i} position={[at[0] + 1.2, at[1] + PHONE.d + 0.005, at[2]]} rotation={[-Math.PI / 2, 0, r]}>
          <planeGeometry args={[0.5, 0.01]} />
          <Flat color="#B8BEC8" />
        </mesh>
      ))}
      <mesh position={[-0.3, 2.5, 0.5]} scale={[1.1, 0.8, 1]}>
        <IcoG args={[0.22, 2]} />
        <Flat color={press ? "#D9A27A" : P.skin} />
      </mesh>
      <mesh position={[0.2, 2.6, 1.1]} rotation={[0.4, -0.6, 0]}>
        <BoxG args={[0.32, 0.3, 1.2]} />
        <Flat color={P.jacket} />
      </mesh>
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={i} position={[(random(`du${i}`) - 0.5) * 4, 2.04, (random(`dz${i}`) - 0.5) * 2.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 0.08]} />
          <Flat color="#A89A84" />
        </mesh>
      ))}
    </Shot>
  );
};

/** The car won't start: dirty, leaves on the bonnet, he turns the key, nothing. */
const c12Car: ShotFn = (c) => {
  const turn = Math.floor(c.lt * 2.5) % 2 === 0;
  const cam = move({ position: [25, 6, 34], target: [16, 3.2, 22] }, { position: [23.5, 5.6, 31.5], target: [16, 3.2, 22] }, c);
  return (
    <Shot mood="overcast" camera={{ ...cam, fov: 40 }} fog={[60, 500]} shadowSize={30}>
      <Countryside t={c.t} growth={YEAR} panels={2} smoke={false} />
      <Convertible position={[16, 0, 22]} yaw={0.6} color="#24748F" dirt={0.8} driver={drivingPose({ expression: "worried", headPitch: -0.2, rShoulder: [1.0, turn ? 0 : -0.2] }, 0)} />
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[16 + (random(`cl${i}`) - 0.5) * 3, 2.5, 22 + 2.2 + random(`cz${i}`) * 2]} rotation={[-Math.PI / 2, 0, i]}>
          <planeGeometry args={[0.4, 0.25]} />
          <Flat color={["#C8862A", "#A8643A"][i % 2]} />
        </mesh>
      ))}
      <Sky t={c.t} tint="overcast" />
    </Shot>
  );
};

/** Winter: brushing snow off the solar panels. */
const c12Snow: ShotFn = (c) => {
  const k = prog(c);
  const panelPos: V3 = [6, 0, HOUSE.d / 2 + 8];
  const hero: V3 = [panelPos[0] - 1.6, 0, panelPos[2] + 2.2];
  const brush = Math.sin(c.lt * 5);
  const pose = reach(standing({ expression: "neutral", lean: 0.2, headPitch: -0.3 }), "r", [panelPos[0] + brush * 0.8, 2.4, panelPos[2] + 0.3], { position: hero, yaw: Math.PI * 0.85 }).pose;
  const cam = move({ position: [panelPos[0] + 8, 5, panelPos[2] + 9], target: [panelPos[0], 2, panelPos[2]] }, { position: [panelPos[0] + 7, 4.6, panelPos[2] + 7.6], target: [panelPos[0], 2, panelPos[2]] }, c);
  return (
    <Shot mood="snow" camera={{ ...cam, fov: 40 }} fog={[60, 500]} shadowSize={30}>
      <Countryside t={c.t} growth={0} panels={2} snow={1} smoke ground="#E8EEF4" tint="#3E6A5A" />
      {[-1.6, 1.6].map((x, i) => (
        <SolarPanel key={i} position={[panelPos[0] + x, 1.8, panelPos[2]]} rotation={[-0.6, 0, 0]} snow={i === 0 ? 1 - k * 0.9 : 1} />
      ))}
      {[-1.6, 1.6].flatMap((x) =>
        [-0.6, 0.6].map((z) => (
          <mesh key={`${x}${z}`} position={[panelPos[0] + x, 0.8, panelPos[2] + z]} castShadow>
            <BoxG args={[0.15, 1.6, 0.15]} />
            <Flat color="#8A909C" />
          </mesh>
        )),
      )}
      <Hero pose={pose} position={hero} yaw={Math.PI * 0.85} />
      <Snow center={[cam.position[0] - 6, 8, cam.position[2] - 8]} size={[30, 18, 24]} t={c.t} count={500} />
      <Sky t={c.t} tint="snow" />
    </Shot>
  );
};

/** Inverter and battery: a green light, a cable tightened. */
const c12Battery: ShotFn = (c) => {
  const cam = move({ position: [2.4, 3.2, 3.6], target: [0, 2.4, 0] }, { position: [1.9, 3.0, 2.9], target: [0, 2.4, 0] }, c);
  const lightOn = c.lt > 0.9;
  return (
    <Shot mood="snow" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.4} shadowSize={6}>
      <mesh position={[0, 3, -0.6]}>
        <BoxG args={[10, 6, 0.2]} />
        <Flat color="#B89A70" />
      </mesh>
      <mesh position={[0, 2.4, -0.2]} castShadow>
        <BoxG args={[1.6, 2.2, 0.6]} />
        <Flat color="#E8E8EC" />
      </mesh>
      <mesh position={[0.4, 3.2, 0.11]}>
        <planeGeometry args={[0.25, 0.25]} />
        {lightOn ? <Glow color="#3AE07A" /> : <Flat color="#2A2E38" />}
      </mesh>
      {lightOn ? <Halo position={[0.4, 3.2, 0.2]} size={0.9} color="#3AE07A" opacity={0.6} /> : null}
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} position={[x * 1.6, 0.8, 0]} castShadow>
          <BoxG args={[1.2, 1.4, 0.9]} />
          <Flat color="#2A2A30" />
        </mesh>
      ))}
      <mesh position={[0, 1.6, 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <CylG args={[0.05, 0.05, 2.6, 5]} />
        <Flat color="#C8372D" />
      </mesh>
      <mesh position={[-0.6, 1.9, 0.4]} scale={[1.1, 0.8, 1]}>
        <IcoG args={[0.22, 2]} />
        <Flat color={P.skin} />
      </mesh>
    </Shot>
  );
};

/** Spring: the vegetable beds sprouting, rain barrel full. */
const c12Garden: ShotFn = (c) => {
  const g = 0.3 + prog(c) * 0.5;
  const bed: V3 = [HOUSE.w / 2 + 8, 0, 4];
  const hero: V3 = [bed[0] - 5.5, 0, bed[2] + 1];
  const hoe = Math.sin(c.lt * 3);
  const pose = mergePose(standing({ expression: "smile", lean: 0.3 + hoe * 0.1, headPitch: -0.3 }), { lShoulder: [0.9 + hoe * 0.2, 0.1], rShoulder: [0.8 + hoe * 0.2, 0.1], lElbow: 0.6, rElbow: 0.9 });
  const cam = move({ position: [bed[0] - 2, 6, bed[2] + 16], target: [bed[0] - 2, 1.6, bed[2]] }, { position: [bed[0] - 3, 5.4, bed[2] + 13], target: [bed[0] - 2, 1.6, bed[2]] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 40 }} fog={[60, 600]} shadowSize={40}>
      <Countryside t={c.t} growth={YEAR} garden={g} panels={2} barrel={0.95} />
      <Hero pose={pose} position={hero} yaw={Math.PI / 2} />
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

/** Carrying two buckets of water up from the stream. */
const c12Effort: ShotFn = (c) => {
  const z = 28 - c.lt * 1.2;
  const { pose: wp } = walking(c.lt, 1.2, { expression: "worried", lean: 0.15 });
  const pose = mergePose(wp, { lShoulder: [0.05, 0.25], rShoulder: [0.05, 0.25], lElbow: 0.05, rElbow: 0.05 });
  const cam = move({ position: [14, 4.4, z - 8], target: [4, 2.6, z] }, { position: [12, 4.2, z - 7], target: [4, 2.6, z] }, c);
  return (
    <Shot mood="day" camera={{ ...cam, fov: 40 }} fog={[60, 600]} shadowSize={30}>
      <Countryside t={c.t} growth={YEAR} garden={0.8} panels={2} />
      <Hero pose={pose} position={[4, 0, z]} yaw={Math.PI} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[4 + s * 1.15, 1.0, z]} castShadow>
          <CylG args={[0.45, 0.35, 0.8, 10]} />
          <Flat color="#9AA1B0" />
        </mesh>
      ))}
      <Sky t={c.t} tint="day" />
    </Shot>
  );
};

/** On the roof in the wind, nailing a loose board. */
const c12Repair: ShotFn = (c) => {
  const tap = Math.max(0, Math.sin(c.lt * 9));
  const hero: V3 = [4, HOUSE.wall + 2.2, 1.2];
  const pose = mergePose(REST, { lHip: [1.6, 0.2], rHip: [1.6, 0.2], lKnee: 1.8, rKnee: 1.8, bob: -1.45, lean: 0.5, rShoulder: [1.4 + tap * 0.5, 0.1], rElbow: 1.0 - tap * 0.5, lShoulder: [1.1, 0.1], lElbow: 0.6, expression: "worried", headPitch: -0.4 });
  const cam = move({ position: [14, HOUSE.wall + 7, 18], target: [3, HOUSE.wall + 2, 0] }, { position: [12, HOUSE.wall + 6.5, 15], target: [3, HOUSE.wall + 2, 0] }, c);
  return (
    <Shot mood="overcast" camera={{ ...cam, fov: 40 }} fog={[60, 500]} shadowSize={30}>
      <Countryside t={c.t} growth={YEAR} panels={2} />
      <Hero pose={pose} position={hero} yaw={0} />
      <Sky t={c.t} tint="overcast" />
    </Shot>
  );
};

/** A split pipe spraying water; he kneels with a wrench. */
const c12Mistake: ShotFn = (c) => {
  const spray = 1 - k01(c.lt, 1.8, 2.6);
  const pipe: V3 = [HOUSE.w / 2 + 2, 0.6, 2];
  const hero: V3 = [pipe[0] + 2.2, 0, pipe[2] + 1.6];
  const pose = mergePose(REST, { lHip: [1.5, 0.15], rHip: [0.2, 0.1], lKnee: 1.5, rKnee: 2.6, bob: -1.3, lean: 0.4, rShoulder: [1.2, 0.1], rElbow: 0.5, lShoulder: [1.0, 0.1], lElbow: 0.6, expression: spray > 0.5 ? "alarm" : "relief", headPitch: -0.3 });
  const cam = move({ position: [pipe[0] + 7, 3.6, pipe[2] + 7], target: [pipe[0] + 0.8, 1.2, pipe[2]] }, { position: [pipe[0] + 6, 3.3, pipe[2] + 6], target: [pipe[0] + 0.8, 1.2, pipe[2]] }, c);
  return (
    <Shot mood="overcast" camera={{ ...cam, fov: 40 }} fog={[60, 500]} shadowSize={20}>
      <Countryside t={c.t} growth={YEAR} panels={2} />
      <mesh position={pipe} rotation={[0, 0, Math.PI / 2]} castShadow>
        <CylG args={[0.25, 0.25, 8, 8]} />
        <Flat color="#7A7E88" />
      </mesh>
      {spray > 0
        ? Array.from({ length: 14 }, (_, i) => {
            const ph = (c.t * 2 + i / 14) % 1;
            return (
              <mesh key={i} position={[pipe[0] + 0.3 + ph * 2.0, pipe[1] + ph * 2.4 - ph * ph * 2.6, pipe[2] + Math.sin(i) * 0.4 * ph]} scale={spray}>
                <IcoG args={[0.12, 0]} />
                <meshLambertMaterial color="#9CC8F0" transparent opacity={0.8} />
              </mesh>
            );
          })
        : null}
      <Hero pose={pose} position={hero} yaw={-Math.PI / 2 - 0.3} />
      <Sky t={c.t} tint="overcast" />
    </Shot>
  );
};

// ================================================================ 13 THE LAST CHAPTER

const HILL: V3 = [-40, 12, -60];
const HillFire: React.FC<{ t: number; lit?: number }> = ({ t, lit = 0.5 }) => (
  <>
    <Countryside t={t} growth={YEAR} lit={lit} panels={2} />
    <mesh position={[HILL[0], 0, HILL[2]]} scale={[1.4, 0.55, 1.2]} castShadow receiveShadow>
      <IcoG args={[22, 2]} />
      <Flat color="#3E5A3A" />
    </mesh>
    <Campfire position={HILL} t={t} size={1.2} />
  </>
);

/** Sitting by the campfire on the hill under the stars. */
const sitGround = (over: Partial<Pose> = {}): Pose => mergePose(REST, { lHip: [1.8, 0.2], rHip: [1.8, 0.2], lKnee: 2.0, rKnee: 2.0, bob: -1.6, lShoulder: [0.9, 0.2], rShoulder: [0.9, 0.2], lElbow: 1.6, rElbow: 1.6, ...over });
const FIRE_HERO: V3 = [HILL[0] + 3.4, HILL[1], HILL[2] + 1.6];

const c13Fire: ShotFn = (c) => {
  const cam = move({ position: [HILL[0] + 13, HILL[1] + 7, HILL[2] + 6], target: [HILL[0] + 1.5, HILL[1] + 1.8, HILL[2] + 0.5] }, { position: [HILL[0] + 11, HILL[1] + 6.4, HILL[2] + 5], target: [HILL[0] + 1.5, HILL[1] + 1.8, HILL[2] + 0.5] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 40 }} fog={[150, 900]} shadowSize={30} light={0.3}>
      <HillFire t={c.t} />
      <Hero pose={sitGround({ expression: "worried", headPitch: -0.1 })} position={FIRE_HERO} yaw={-1.9} />
    </Shot>
  );
};

/** An empty playground at night, a swing moving in the wind. */
const c13Playground: ShotFn = (c) => {
  const swing = Math.sin(c.t * 1.6) * 0.35;
  const cam = move({ position: [-12, 5, 16], target: [0, 4, 0] }, { position: [-9, 4.6, 13], target: [0, 4, 0] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 40 }} fog={[60, 500]} shadowSize={30} light={0.4}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <Flat color="#3A5A3A" />
      </mesh>
      {/* swing frame */}
      {[-4, 4].map((x) => (
        <group key={x}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[x, 3.6, s * 1.2]} rotation={[s * 0.3, 0, 0]} castShadow>
              <CylG args={[0.15, 0.15, 7.6, 6]} />
              <Flat color="#C8372D" />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 7.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <CylG args={[0.18, 0.18, 8.6, 6]} />
        <Flat color="#C8372D" />
      </mesh>
      {[-1.6, 1.6].map((x, i) => (
        <group key={x} position={[x, 7.2, 0]} rotation={[i === 0 ? swing : swing * 0.3, 0, 0]}>
          {[-0.5, 0.5].map((dx) => (
            <mesh key={dx} position={[dx, -2.6, 0]}>
              <CylG args={[0.03, 0.03, 5.2, 4]} />
              <Flat color="#B8BEC8" />
            </mesh>
          ))}
          <mesh position={[0, -5.2, 0]} castShadow>
            <BoxG args={[1.3, 0.12, 0.6]} />
            <Flat color="#2A2A30" />
          </mesh>
        </group>
      ))}
      {/* slide */}
      <group position={[8, 0, -4]}>
        <mesh position={[0, 2.5, 0]} castShadow>
          <BoxG args={[1.6, 5, 1.6]} />
          <Flat color="#24748F" />
        </mesh>
        <mesh position={[0, 2.5, 3.2]} rotation={[0.85, 0, 0]} castShadow>
          <BoxG args={[1.4, 0.15, 7]} />
          <Flat color="#E0B04E" />
        </mesh>
      </group>
      <GrassTufts area={[-14, 14, -10, 10]} count={80} growth={YEAR} height={1.6} seed="play" />
      <CityRing power={0} radius={80} />
    </Shot>
  );
};

/** The camera rises from the fire into the stars (non-graphic). */
const c13Rise: ShotFn = (c) => {
  const k = k01(c.lt, 0, Math.min(c.dur, 3.2));
  const cam = { position: [HILL[0] + lerp(8, 30, k), HILL[1] + lerp(4, 120, k * k), HILL[2] + lerp(8, 40, k)] as V3, target: [HILL[0], HILL[1] + lerp(2, 60, k), HILL[2] - lerp(0, 60, k)] as V3, fov: 42 };
  return (
    <Shot mood="night" camera={cam} fog={[300, 1600]} shadowSize={40} light={0.3}>
      <HillFire t={c.t} lit={0.3} />
      <Hero pose={sitGround({ expression: "neutral", headPitch: 0.5 })} position={FIRE_HERO} yaw={-1.9} />
    </Shot>
  );
};

const c13Cities: ShotFn = (c) => {
  const cam = move({ position: [0, 40, 140], target: [0, 30, -60] }, { position: [0, 38, 120], target: [0, 32, -60] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 40 }} fog={[150, 900]} shadowSize={80} light={0.35}>
      <BigStreet seed="avenue" cars={false} power={0} lamps={false} modify={() => ({ decay: YEAR })} />
      <CityRing power={0} />
    </Shot>
  );
};

/** A piano in an abandoned room, dust on the keys, a vine at the window. */
const c13Music: ShotFn = (c) => {
  const cam = move({ position: [6, 5, 7], target: [0, 2.6, 0] }, { position: [5, 4.6, 6], target: [0, 2.6, 0] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.3} shadowSize={10}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[20, 0.1, 20]} />
        <Flat color="#4A3A2E" />
      </mesh>
      <mesh position={[0, 5, -3]}>
        <BoxG args={[20, 10, 0.2]} />
        <Flat color="#5A4A5A" />
      </mesh>
      {/* upright piano */}
      <mesh position={[0, 2.4, -2.2]} castShadow>
        <BoxG args={[5.2, 4.8, 1.4]} />
        <Flat color="#1A1614" />
      </mesh>
      <mesh position={[0, 2.0, -1.2]} castShadow>
        <BoxG args={[5.0, 0.3, 1.0]} />
        <Flat color="#F2EEE6" />
      </mesh>
      {Array.from({ length: 18 }, (_, i) => (
        <mesh key={i} position={[-2.3 + i * 0.27, 2.2, -1.25]}>
          <BoxG args={[0.12, 0.12, 0.55]} />
          <Flat color="#141414" />
        </mesh>
      ))}
      <mesh position={[-4, 6, -2.85]}>
        <planeGeometry args={[3, 3]} />
        <Glow color="#2A3458" />
      </mesh>
      <GrassTufts area={[-5.5, -2.5, -2.8, -2.4]} count={14} growth={0.6} height={2.4} seed="vine" />
      <pointLight position={[-4, 6, 0]} color="#9AB0E0" intensity={8} distance={14} decay={2} />
    </Shot>
  );
};

/** A plane parked on the apron, grass growing up around its wheels. */
const c13Inventions: ShotFn = (c) => {
  const cam = move({ position: [-40, 10, 50], target: [0, 6, 0] }, { position: [-34, 9, 44], target: [0, 6, 0] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 40 }} fog={[100, 700]} shadowSize={60} light={0.4}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[1200, 1200]} />
        <Flat color="#4A5A4A" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[120, 80]} />
        <Flat color="#4A4E58" />
      </mesh>
      <Plane position={[0, 4, 0]} rotation={[0, 0.6, 0]} scale={S * 2.2} />
      <GrassTufts area={[-40, 40, -30, 30]} count={160} growth={YEAR} height={1.8} seed="apron" />
    </Shot>
  );
};

const c13History: ShotFn = (c) => {
  const cam = move({ position: [6, 6, -16], target: [0, 5.4, -26] }, { position: [4.6, 5.8, -18.5], target: [0, 5.6, -26] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.35} shadowSize={20}>
      <Museum t={c.t} ivy={0.5} dust={0.4} />
    </Shot>
  );
};

/** Without people to keep them: dust thickens, paintings fade, ivy climbs. */
const c13Fade: ShotFn = (c) => {
  const k = prog(c);
  const cam = move({ position: [8, 8, 22], target: [0, 6, -20] }, { position: [3, 7, 10], target: [0, 6, -26] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 42 }} fog={false} stars={false} light={0.3 - k * 0.12} shadowSize={30}>
      <Museum t={c.t} ivy={0.4 + k * 0.5} dust={0.4 + k * 0.5} />
      <GrassTufts area={[-14, 14, -50, 10]} count={160} growth={0.2 + k * 0.4} height={2.2} seed="musg" />
    </Shot>
  );
};

/** Close on his face in the firelight. */
const c13Face: ShotFn = (c) => {
  const face: V3 = [FIRE_HERO[0], FIRE_HERO[1] + 2.0, FIRE_HERO[2]];
  const cam = move({ position: [face[0] - 3.6, face[1] + 0.4, face[2] - 1.4], target: face }, { position: [face[0] - 3.0, face[1] + 0.35, face[2] - 1.1], target: face }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 34 }} fog={[150, 900]} shadowSize={20} light={0.25}>
      <HillFire t={c.t} />
      <Hero pose={sitGround({ expression: "worried", headPitch: 0.05, blink: c.lt > 2 && c.lt < 2.15 ? 1 : 0 })} position={FIRE_HERO} yaw={-1.9} />
    </Shot>
  );
};

/** A painting fading under dust and creeping ivy. */
const c13Painting: ShotFn = (c) => {
  const k = prog(c);
  const cam = move({ position: [9, 7.5, -20], target: [16.7, 7.5, -20] }, { position: [11, 7.5, -20], target: [16.7, 7.5, -20] }, c);
  return (
    <Shot mood="night" camera={{ ...cam, fov: 38 }} fog={false} stars={false} light={0.25} shadowSize={20}>
      <Museum t={c.t} ivy={0.9} dust={0.85 + k * 0.15} />
      <GrassTufts area={[13, 16.5, -24, -16]} count={40} growth={0.5 + k * 0.4} height={3} seed="paintivy" />
    </Shot>
  );
};

// ================================================================ 14 EARTH GOES ON

const c14Sunrise: ShotFn = (c) => {
  const cam = move({ position: [-160, 60, 220], target: [200, 20, -300] }, { position: [-140, 58, 200], target: [220, 24, -320] }, c);
  return (
    <Shot mood="dawn" camera={{ ...cam, fov: 44 }} fog={[150, 1400]} shadowSize={150} keyDir={[0.75, 0.25, -0.55]}>
      <Countryside t={c.t} growth={YEAR} lit={0.2} panels={2} />
      <Halo position={[600, 60, -900]} size={260} color="#FFD8A0" opacity={0.6} />
      <Sky t={c.t} tint="dawn" y={70} />
    </Shot>
  );
};

/** Forest spreading over a hillside (time-lapse feel). */
const c14Forest: ShotFn = (c) => {
  const g = 0.35 + prog(c) * 0.65;
  const cam = move({ position: [0, 30, 120], target: [0, 10, -40] }, { position: [0, 28, 100], target: [0, 12, -40] }, c);
  return (
    <Shot mood="dawn" camera={{ ...cam, fov: 42 }} fog={[150, 900]} shadowSize={120} keyDir={[0.75, 0.3, -0.55]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[2400, 2400]} />
        <Flat color="#5E8A4A" />
      </mesh>
      <mesh position={[0, -30, -120]} scale={[3, 1, 1.4]} receiveShadow>
        <IcoG args={[70, 2]} />
        <Flat color="#4E7A44" />
      </mesh>
      <Forest area={[-200, 200, -260, 40]} count={500} seed="earthF" growth={g} />
      <Sky t={c.t} tint="dawn" />
    </Shot>
  );
};

const c14Ocean: ShotFn = (c) => {
  const cam = move({ position: [0, 10, 40], target: [0, 2, -40] }, { position: [0, 9, 34], target: [0, 2, -40] }, c);
  return (
    <Shot mood="dawn" camera={{ ...cam, fov: 42 }} fog={[100, 900]} shadowSize={60} keyDir={[0.75, 0.2, -0.55]}>
      <Sea t={c.t} color="#2A5A7A" />
      <Waves t={c.t} rows={12} z0={10} spacing={8} color="#3A6A8A" />
      {/* rocks in the surf */}
      {[-20, 14, 28].map((x, i) => (
        <mesh key={i} position={[x, 1, 10 - i * 6]} castShadow>
          <IcoG args={[4 + i, 0]} />
          <Flat color="#5A5A60" />
        </mesh>
      ))}
      <Halo position={[300, 40, -800]} size={200} color="#FFD8A0" opacity={0.55} />
      <Sky t={c.t} tint="dawn" />
    </Shot>
  );
};

const c14Animals: ShotFn = (c) => {
  const cam = move({ position: [-30, 8, 34], target: [10, 3, -10] }, { position: [-26, 7.5, 30], target: [12, 3, -10] }, c);
  return (
    <Shot mood="dawn" camera={{ ...cam, fov: 40 }} fog={[100, 900]} shadowSize={60} keyDir={[0.75, 0.3, -0.55]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[2400, 2400]} />
        <Flat color="#7A8A4A" />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <Animal key={i} kind="deer" position={[-10 + (i % 6) * 6 + c.lt * 1.6, 0, -6 - Math.floor(i / 6) * 7 + (random(`ad${i}`) - 0.5) * 4]} yaw={Math.PI / 2} scale={1.5 + (i % 3) * 0.15} walk={c.lt * 0.8 + i * 0.25} />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-30 + i * 6 + c.lt * 6, 26 + Math.sin(c.t * 3 + i) * 1.2, -40 - i * 2]} rotation={[0, 0, Math.sin(c.t * 9 + i) * 0.6]}>
          <BoxG args={[1.6, 0.1, 0.5]} />
          <Flat color="#2A2A30" />
        </mesh>
      ))}
      <Forest area={[-300, 300, -400, -60]} count={200} seed="plainF" />
      <Sky t={c.t} tint="dawn" />
    </Shot>
  );
};

/** Earth turning in space, the terminator sweeping, no city lights on the night side. */
const c14Earth: ShotFn = (c) => (
  <Shot mood="space" camera={{ position: [0, 0.6, 22], target: [0, -0.4, 0], fov: 32 }} fog={false} shadows={false} light={0.9}>
    <FacetedEarth radius={3.4} position={[0, -0.4, 0]} rotation={[0.3, 1.6 + c.t * 0.12, 0]} cityLights={0} />
    <Halo position={[9, 3, -20]} size={18} color="#FFF2D8" opacity={0.6} />
  </Shot>
);

/** On the hill at sunrise, looking out; the valley, and the city far off. */
const c14Needs: ShotFn = (c) => {
  const hero: V3 = [HILL[0] + 2, HILL[1], HILL[2] + 4];
  const k = prog(c);
  const cam = { position: [hero[0] - lerp(8, 12, k), hero[1] + lerp(4, 6, k), hero[2] + lerp(10, 16, k)] as V3, target: [hero[0] + 30, hero[1] + 1, hero[2] - 30] as V3, fov: 44 };
  return (
    <Shot mood="dawn" camera={cam} fog={[150, 1400]} shadowSize={40} keyDir={[0.75, 0.25, -0.55]}>
      <Countryside t={c.t} growth={YEAR} panels={2} />
      <mesh position={[HILL[0], 0, HILL[2]]} scale={[1.4, 0.55, 1.2]} castShadow receiveShadow>
        <IcoG args={[22, 2]} />
        <Flat color="#4E6A3A" />
      </mesh>
      <Hero pose={standing({ expression: "neutral", headYaw: 0.1 })} position={hero} yaw={Math.PI * 0.75} />
      <Halo position={[600, 60, -900]} size={260} color="#FFD8A0" opacity={0.6} />
      <Sky t={c.t} tint="dawn" />
    </Shot>
  );
};

/** Close on his face in the sunrise light. */
const c14Others: ShotFn = (c) => {
  const hero: V3 = [HILL[0] + 2, HILL[1], HILL[2] + 4];
  const yaw = Math.PI * 0.75;
  const face: V3 = [hero[0], hero[1] + 3.6, hero[2]];
  const fwd: V3 = [Math.sin(yaw), 0, Math.cos(yaw)];
  const cam = move({ position: [face[0] + fwd[0] * 4.6 + 1.2, face[1] + 0.2, face[2] + fwd[2] * 4.6], target: face }, { position: [face[0] + fwd[0] * 3.8 + 0.9, face[1] + 0.15, face[2] + fwd[2] * 3.8], target: face }, c);
  return (
    <Shot mood="dawn" camera={{ ...cam, fov: 32 }} fog={[150, 1400]} shadowSize={20} keyDir={[0.75, 0.25, -0.55]}>
      <Countryside t={c.t} growth={YEAR} panels={2} forest={false} />
      <Hero pose={standing({ expression: "worried", headPitch: 0.05, blink: c.lt > 1.2 && c.lt < 1.35 ? 1 : 0 })} position={hero} yaw={yaw} />
      <Sky t={c.t} tint="dawn" />
    </Shot>
  );
};

/** Bookend: the apartment bedroom, the bed empty, the clock reading 7:00. */
const CLOCK_POS: V3 = [0.5, 1.1, -3.05];
const CLOCK_YAW = 0.5;
const CLOCK_FACE: V3 = [CLOCK_POS[0] + Math.sin(CLOCK_YAW) * 0.205, CLOCK_POS[1] + 0.25, CLOCK_POS[2] + Math.cos(CLOCK_YAW) * 0.205];
const c14Bookend: ShotFn = (c) => {
  const cam = move({ position: [9.5, 5.6, 7.8], target: [1.2, 1.8, -1.6] }, { position: [5.2, 3.2, 2.6], target: CLOCK_FACE }, c);
  return (
    <Shot
      mood="day"
      camera={{ ...cam, fov: 36 }}
      fog={false}
      stars={false}
      keyDir={[-1, 0.7, 0.3]}
      light={0.8}
      shadowSize={12}
      overlay={
        <ScreenHtml c={CLOCK_FACE} w={CLOCK.w} h={CLOCK.h} yaw={CLOCK_YAW} cam={{ ...cam, fov: 36 }} width={c.width} height={c.height}>
          {(w, h) => (
            <div style={{ width: w, height: h, background: "#140404", color: "#FF3A2A", fontFamily: FONT, fontWeight: 700, fontSize: h * 0.56, display: "flex", alignItems: "center", justifyContent: "center", textShadow: "0 0 12px #FF3A2A" }}>7:00</div>
          )}
        </ScreenHtml>
      }
    >
      <Bedroom lampOn={false} dawn />
      <pointLight position={[WIN.x + 1.2, WIN.y + 0.4, WIN.z]} color="#FFD8A0" intensity={34} distance={20} decay={2} />
      <pointLight position={[4, 6.5, 5]} color="#FFF0DC" intensity={22} distance={22} decay={2} />
      <mesh position={[WIN.x + 0.05, WIN.y, WIN.z]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[WIN.w, WIN.h]} />
        <Glow color="#FFF0D0" opacity={0.55} />
      </mesh>
      <mesh position={[BED.x, BED.mattressTop + 0.25, -0.3]} castShadow receiveShadow>
        <BoxG args={[BED.w - 0.1, 0.5, 3.2]} />
        <Flat color="#5A6EA0" />
      </mesh>
      <AlarmClock position={CLOCK_POS} yaw={CLOCK_YAW} />
    </Shot>
  );
};

/** The last shot: alone in the middle of the empty avenue at sunrise; the camera cranes up and away. */
const c14Last: ShotFn = (c) => {
  const k = k01(c.lt, 0, Math.min(c.dur, 5));
  const hero: V3 = [0, 0, -20];
  const cam = { position: [lerp(2, 8, k), lerp(4.4, 70, k * k), lerp(-10, 50, k)] as V3, target: [0, lerp(3.4, 0, k), lerp(-20, -40, k)] as V3, fov: lerp(36, 44, k) };
  return (
    <Shot mood="dawn" camera={cam} fog={[150, 900]} shadowSize={60} keyDir={[0.75, 0.25, -0.55]}>
      <YearAvenue />
      <Hero pose={standing({ expression: "neutral", headPitch: 0.15, headYaw: -0.2 })} position={hero} yaw={Math.PI} />
      <Halo position={[0, 40, -700]} size={260} color="#FFD8A0" opacity={0.55} />
      <Sky t={c.t} tint="dawn" />
    </Shot>
  );
};

// ================================================================ cues

export const ACT5: Record<string, CuedShot<ShotFn>[]> = {
  c12: [
    { cue: null, fn: c12Aerial },
    { cue: "Many roads", fn: c12Roads },
    { cue: "Buildings have suffered", fn: c12Storm },
    { cue: "Some areas", fn: c12Fires },
    { cue: "or flooding", fn: c12Flood },
    { cue: "And the technologies", fn: c12Tech },
    { cue: "increasingly difficult", fn: c12Car },
    { cue: "You might still generate", fn: c12Snow },
    { cue: "provided the equipment", fn: c12Battery },
    { cue: "You might grow", fn: c12Garden },
    { cue: "But everything takes", fn: c12Effort },
    { cue: "Every repair", fn: c12Repair },
    { cue: "Every mistake", fn: c12Mistake },
  ],
  c13: [
    { cue: null, fn: c13Fire },
    { cue: "If you truly", fn: c13Face },
    { cue: "humanity has no future", fn: c13Playground },
    { cue: "When you die", fn: c13Rise },
    { cue: "Our cities", fn: c13Cities },
    { cue: "our music", fn: c13Music },
    { cue: "our inventions", fn: c13Inventions },
    { cue: "and our history", fn: c13History },
    { cue: "But without people", fn: c13Fade },
    { cue: "slowly disappear", fn: c13Painting },
  ],
  c14: [
    { cue: null, fn: c14Sunrise },
    { cue: "Forests would grow", fn: c14Forest },
    { cue: "Oceans would move", fn: c14Ocean },
    { cue: "Animals would evolve", fn: c14Animals },
    { cue: "The planet doesn't", fn: c14Earth },
    { cue: "But humanity needs", fn: c14Needs },
    { cue: "Other humans", fn: c14Others },
    { cue: "So if you woke", fn: c14Bookend },
    { cue: "How long", fn: c14Last },
  ],
};

export { clamp01, Building };
export type { ShotCtx };
