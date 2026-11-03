/**
 * Shots for "What If You Played GTA 6 for 24 Hours Straight?".
 * Real world: Slavoski's gaming room. Game world: our own neon low-poly city (not GTA's art).
 * `lt` = seconds since the shot started.
 */
import React from "react";
import { AbsoluteFill, random, useVideoConfig } from "remotion";
import { Building, Car, CAR_HALF_LENGTH, CityGrid, StreetSet, type BuildingSpec } from "../../slavoski/city";
import { FONT } from "../../slavoski/fonts";
import { Fireball, SmokeCluster } from "../../slavoski/fx";
import { SLAVOSKI, SLAVOSKI_TIRED } from "../../slavoski/hero";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { CardLine } from "../../slavoski/Overlays";
import { Hero, headPosition, type Pose } from "../../slavoski/rig/Hero";
import { Controller, controllerAt, GamingRoom, SEAT, SEAT_YAW, sittingPose, tvScreenRect } from "../../slavoski/room";
import { lerpCam, project, Stage, type CameraSpec, type Mood } from "../../slavoski/Stage";
import type { CuedShot } from "../../slavoski/timeline";
import { CopOnBike, GAME_COLORS, GAME_PINK, GameHud, PalmTree } from "./props";

export type ShotCtx = { lt: number; dur: number; t: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- room helpers

/** High behind the couch: the TV sits above Slavoski's head in frame, so the live feed never covers him. */
const TVVIEW: CameraSpec = { position: [1.0, 7.5, 9.0], target: [0.8, 1.4, -1.5] };
/** From the TV side, looking at Slavoski's face (the TV is behind the camera). */
const FACE: CameraSpec = { position: [3.0, 3.3, -4.2], target: [1.4, 2.6, 1.8] };
const FACE_CLOSE: CameraSpec = { position: [2.4, 3.1, -2.4], target: [1.4, 2.8, 1.8] };
const SIDE: CameraSpec = { position: [-5.4, 3.0, 0.2], target: [1.2, 2.3, 2.0] };
const WIDE: CameraSpec = { position: [5.0, 6.5, 10.5], target: [-0.4, 2.0, -1.5] };

const roomMood = (hours: number): Mood => {
  const clock = (12 + hours) % 24;
  return clock >= 7 && clock < 19 ? "dawn" : "night";
};
const roomLight = (hours: number) => {
  const clock = (12 + hours) % 24;
  return clock >= 7 && clock < 18 ? 0.9 : clock >= 18 && clock < 21 ? 0.6 : 0.35;
};

type RoomProps = {
  cam: CameraSpec;
  hours: number;
  pose: Pose;
  cans?: number;
  waterBottle?: boolean;
  pizza?: boolean;
  phoneGlow?: boolean;
  tired?: boolean;
  controller?: V3 | null;
  feed?: (size: { width: number; height: number }) => React.ReactNode;
  children?: React.ReactNode;
  overlay?: React.ReactNode;
};

/** A room shot: the set, Slavoski on the couch, the controller in his hands, and an optional live TV feed. */
const RoomShot: React.FC<RoomProps> = ({ cam, hours, pose, cans = 1, waterBottle, pizza, phoneGlow, tired, controller, feed, children, overlay }) => {
  const { width, height } = useVideoConfig();
  const rect = feed ? tvScreenRect(cam, width, height) : null;
  const ctrl = controller === undefined ? controllerAt(pose) : controller;
  return (
    <AbsoluteFill>
      <Stage mood={roomMood(hours)} camera={cam} fog={false} stars={false} light={roomLight(hours)} shadowSize={14}>
        <GamingRoom hours={hours} cans={cans} waterBottle={waterBottle} pizza={pizza} phoneGlow={phoneGlow} />
        <Hero pose={pose} position={SEAT} yaw={SEAT_YAW} look={tired ? SLAVOSKI_TIRED : SLAVOSKI} />
        {ctrl ? <Controller position={ctrl} /> : null}
        {children}
      </Stage>
      {rect && feed && rect.w > 20 ? (
        <div style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, clipPath: `polygon(${rect.poly})`, overflow: "hidden" }}>
          {feed({ width: Math.max(32, Math.round(rect.w)), height: Math.max(18, Math.round(rect.h)) })}
        </div>
      ) : null}
      {overlay}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- game world

const pastel = (s: BuildingSpec) => ({ color: GAME_COLORS[Math.floor(random(`${s.seed}gc`) * GAME_COLORS.length)] });

/** Palms along both sides of the roads of a 4-block grid (roads at x, z ∈ {−28, −14, 0, 14, 28}). */
const PALMS: { p: V3; h: number; seed: string }[] = (() => {
  const out: { p: V3; h: number; seed: string }[] = [];
  for (const road of [-14, 0, 14]) {
    for (let k = -24; k <= 24; k += 7) {
      out.push({ p: [road + 2.9, 0, k + 1.5], h: 5.5 + random(`pa${road}${k}`) * 2, seed: `pa${road}${k}` });
      // keep the main x = 0 road (where the chases run) clear of cross-street palms
      if (Math.abs(k + 3) > 5) out.push({ p: [k + 3, 0, road - 2.9], h: 5.5 + random(`pb${road}${k}`) * 2, seed: `pb${road}${k}` });
    }
  }
  return out;
})();

const GameWorld: React.FC<{ palms?: boolean }> = ({ palms = true }) => (
  <>
    <CityGrid seed="vice" blocks={6} modify={pastel} />
    {palms ? PALMS.map((pl) => <PalmTree key={pl.seed} position={pl.p} height={pl.h} seed={pl.seed} />) : null}
  </>
);

/** A game Stage: sunset by default, neon night for the late chapters. */
const GameStage: React.FC<{ cam: CameraSpec; night?: boolean; size?: { width: number; height: number }; shake?: number; children: React.ReactNode }> = ({
  cam,
  night,
  size,
  shake = 0,
  children,
}) => (
  <Stage mood={night ? "night" : "dawn"} camera={cam} fog={[60, 220]} shadowSize={50} size={size} vignette={!size} shake={shake} shakeSeed="game" stars={night}>
    {children}
  </Stage>
);

/**
 * A long palm-lined boulevard (road along Z, 260 units of buildings) for every driving shot, so the
 * end of the map never comes into view. Palms are only built near the camera (`nearZ`) to keep it light.
 */
const BLVD_LENGTH = 260;
const GameBoulevard: React.FC<{ nearZ: number; night?: boolean }> = ({ nearZ, night }) => {
  const palms: { p: V3; h: number; seed: string }[] = [];
  for (let i = 0; i < BLVD_LENGTH / 11; i++) {
    for (const side of [1, -1]) {
      const z = (side > 0 ? -3.5 : 2) - i * 11; // between the street lamps
      if (z > nearZ + 30 || z < nearZ - 140) continue;
      palms.push({ p: [side * 4.8, 0.12, z], h: 5.8 + random(`bp${side}${i}`) * 1.8, seed: `bp${side}${i}` });
    }
  }
  return (
    <>
      <StreetSet seed="viceblvd" length={BLVD_LENGTH} cars={false} trees={false} modify={pastel} lampsOn={night ?? true} />
      {palms.map((pl) => (
        <PalmTree key={pl.seed} position={pl.p} height={pl.h} seed={pl.seed} />
      ))}
    </>
  );
};

/** The player's pink supercar driving down the boulevard's right lane toward −Z. */
const chaseCam = (z: number): CameraSpec => ({ position: [0.5, 4.4, z + 12], target: [1.2, 1.0, z - 6] });

/** A driving feed for the TV (16:9), from the shot's own clock so the car never jumps back. */
const driveFeed = (lt: number, night = false, speed = 14) => (size: { width: number; height: number }) => {
  const z = 4 - lt * speed;
  return (
    <GameStage cam={{ ...chaseCam(z), fov: 30 }} night={night} size={size}>
      <GameBoulevard nearZ={z} night={night} />
      <Car position={[1.75, 0, z]} yaw={Math.PI} color={GAME_PINK} sporty />
    </GameStage>
  );
};

// ---------------------------------------------------------------- poses

const HYPED = sittingPose({ lean: 0.3, expression: "smile", headPitch: 0.05 });
const FOCUS = (blink = 0) => sittingPose({ lean: 0.38, expression: "neutral", headPitch: 0.02, blink });
const TIRED = (blink = 0.45) => sittingPose({ lean: 0.15, expression: "worried", headPitch: -0.08, blink });

// ---------------------------------------------------------------- COLD OPEN

const coldRoom: ShotFn = ({ lt }) => (
  <RoomShot cam={lerpCam(TVVIEW, { position: [1.0, 7.2, 8.2], target: [0.8, 1.4, -1.5] }, lt / 5)} hours={0} pose={HYPED} feed={driveFeed(lt)} />
);

const coldFace: ShotFn = ({ lt }) => (
  <RoomShot cam={lerpCam(FACE, FACE_CLOSE, lt / 4)} hours={0} pose={sittingPose({ lean: 0.4, expression: "smile", headYaw: Math.sin(lt * 6) * 0.1 })} />
);

const coldUnstoppable: ShotFn = ({ lt }) => {
  const z = 4 - lt * 18;
  const drift = Math.sin(lt * 3) * 0.35;
  return (
    <AbsoluteFill>
      <GameStage cam={chaseCam(z)}>
        <GameBoulevard nearZ={z} />
        <Car position={[1.75 + drift * 0.6, 0, z]} yaw={Math.PI + drift} color={GAME_PINK} sporty />
        <Car position={[1.75, 0, z + 24]} yaw={Math.PI} color="#FFFFFF" police t={lt} />
      </GameStage>
      <GameHud stars={2} banner={lt > 0.4 ? "UNSTOPPABLE" : undefined} bannerColor="#2FE0D0" />
    </AbsoluteFill>
  );
};

/**
 * The player's car has spun out and stalled (smoking bonnet); one police car pulls up in the other lane.
 * Spun 0.35 rad, the pink car spans x ≈ 0.7–3.1: clear of the kerb (3.5) and of the police lane (≤ −0.95).
 */
const coldBeat: ShotFn = ({ lt }) => {
  const carZ = -6;
  const copZ = Math.max(carZ + 0.3, carZ + 14 - lt * 10);
  const cam = lerpCam({ position: [0.2, 4.6, carZ + 11], target: [1.0, 1, carZ] }, { position: [0.2, 4.4, carZ + 9.5], target: [1.0, 1, carZ] }, lt / 3);
  return (
    <AbsoluteFill>
      <GameStage cam={cam}>
        <GameBoulevard nearZ={carZ} />
        <Car position={[1.9, 0, carZ]} yaw={Math.PI + 0.35} color={GAME_PINK} sporty crumple={0.3} lights={false} />
        <SmokeCluster position={[1.4, 0.7, carZ - 1.3]} progress={0.4 + lt * 0.15} radius={0.7} count={5} rise={1.2} seed="cb" />
        <Car position={[-1.75, 0, copZ]} yaw={Math.PI} color="#FFFFFF" police t={lt} />
      </GameStage>
      <GameHud stars={1} banner={lt > 1.6 ? "MISSION FAILED" : undefined} bannerColor="#FF4A4A" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 01 HOOKED

const c1Hooked: ShotFn = ({ lt }) => (
  <RoomShot cam={lerpCam(FACE, FACE_CLOSE, lt / 4)} hours={1} pose={sittingPose({ lean: 0.35, expression: "smile", headYaw: Math.sin(lt * 5) * 0.12 })} />
);

const c1Explore: ShotFn = ({ lt }) => {
  const a = 0.6 + lt * 0.12;
  const z = 24 - lt * 12;
  return (
    <AbsoluteFill>
      <GameStage cam={{ position: [Math.sin(a) * 34, 26, Math.cos(a) * 34], target: [0, 2, 0] }}>
        <GameWorld />
        <Car position={[1.7, 0, z]} yaw={Math.PI} color={GAME_PINK} sporty />
        <Car position={[14 - 1.7, 0, -z]} color="#4FC3C8" />
      </GameStage>
      <GameHud stars={0} mission="EXPLORE THE CITY" />
    </AbsoluteFill>
  );
};

const c1Steal: ShotFn = ({ lt }) => {
  const go = Math.max(0, lt - 0.5);
  const z = 4 - go * go * 6;
  const blink = Math.floor(lt * 6) % 2 === 0;
  return (
    <AbsoluteFill>
      <GameStage cam={lerpCam({ position: [0.6, 2.8, 11], target: [1.7, 1, 2] }, { position: [0.6, 2.7, 10], target: [1.7, 1, 1] }, lt / 2)}>
        <GameWorld />
        <Car position={[1.7, 0, z]} yaw={Math.PI} color={GAME_PINK} sporty lights={blink || go > 0} />
      </GameStage>
      <GameHud stars={go > 0.3 ? 1 : 0} mission="STEAL A SUPERCAR" />
    </AbsoluteFill>
  );
};

/** A T-bone at the x = 0 / z = 0 intersection (as in ep. 2): contact distances keep the cars from overlapping. */
const tbone = (lt: number, ti: number, colorA: string, colorB: string, police = false) => {
  const sp = 12;
  const hit = lt >= ti;
  const k = clamp01((lt - ti) / 0.3);
  const ax = hit ? -0.75 - CAR_HALF_LENGTH : -0.75 - CAR_HALF_LENGTH - sp * (ti - lt);
  const bz = hit ? 0 : sp * (ti - lt);
  return (
    <>
      <Car position={[ax, 0, 0]} yaw={Math.PI / 2} color={colorA} sporty crumple={k} />
      <Car position={[0.5 * k, 0, bz]} yaw={Math.PI + 0.4 * k} color={colorB} police={police} t={lt} />
      <SmokeCluster position={[-0.8, 0.3, 0]} progress={k * 0.8} radius={1.1} count={6} rise={1.2} seed="tb" />
    </>
  );
};

const c1Chaos: ShotFn = ({ lt }) => (
  <AbsoluteFill>
    <GameStage cam={lerpCam({ position: [0.6, 14, 14], target: [0, 0, -0.5] }, { position: [0.6, 13, 12.5], target: [0, 0, -0.5] }, lt / 2)} shake={lt > 0.45 && lt < 0.9 ? 0.15 : 0}>
      <GameWorld />
      {tbone(lt, 0.45, GAME_PINK, "#FFFFFF", true)}
      <Fireball position={[-6, 0, -9]} progress={clamp01(lt / 1.6)} radius={2.2} seed="cf" />
    </GameStage>
    <GameHud stars={3} />
  </AbsoluteFill>
);

const c1Flies: ShotFn = ({ lt, dur }) => {
  const h = 1 + 3 * ease(lt / Math.max(0.8, dur));
  return <RoomShot cam={lerpCam(WIDE, { position: [4.6, 6.2, 9.6], target: [-0.4, 2.2, -2] }, lt / 2)} hours={h} pose={FOCUS()} cans={1 + Math.floor(h - 1)} />;
};

// ---------------------------------------------------------------- 02 SCREEN EYES

const c2Eyes: ShotFn = ({ lt }) => (
  <RoomShot cam={lerpCam(FACE_CLOSE, { position: [2.1, 3.1, -1.6], target: [1.4, 2.9, 1.8] }, lt / 2.5)} hours={4} pose={FOCUS(0.35)} cans={3} />
);

const c2Blink: ShotFn = ({ lt }) => {
  const head = headPosition(FOCUS(), SEAT, SEAT_YAW);
  const cam: CameraSpec = { position: [head[0] - 0.1, head[1] + 0.12, head[2] - 2.3 + lt * 0.15], target: [head[0], head[1] + 0.05, head[2]] };
  const blink = lt > 1.2 && lt < 1.32 ? 1 : 0.25;
  return (
    <RoomShot
      cam={cam}
      hours={4}
      pose={FOCUS(blink)}
      cans={3}
      overlay={<CardLine text="BLINKS: 15 → 5 PER MINUTE" sub="WHILE STARING AT A SCREEN" y={1160} appearFrame={-9999} />}
    />
  );
};

const c2Neck: ShotFn = ({ lt }) => {
  const pose = sittingPose({ lean: 0.5, headPitch: 0.25, expression: "worried", blink: 0.3 });
  const head = headPosition(pose, SEAT, SEAT_YAW);
  const pulse = 0.5 + 0.5 * Math.sin(lt * 9);
  return (
    <RoomShot cam={lerpCam(SIDE, { position: [-4.8, 3.0, 0.5], target: [1.2, 2.5, 2.0] }, lt / 2)} hours={4} pose={pose} cans={3}>
      <mesh position={[head[0], head[1] - 0.85, head[2] + 0.25]}>
        <icosahedronGeometry args={[0.38 + pulse * 0.08, 1]} />
        <meshBasicMaterial color="#FF3A3A" transparent opacity={0.35 + pulse * 0.25} depthWrite={false} toneMapped={false} />
      </mesh>
    </RoomShot>
  );
};

const c2Outside: ShotFn = ({ lt }) => (
  <RoomShot cam={lerpCam({ position: [5.6, 4.8, 2.7], target: [-6, 0.5, 0.5] }, { position: [5.3, 4.7, 2.6], target: [-6, 0.6, 0.5] }, lt / 2)} hours={4} pose={FOCUS(0.3)} cans={3} />
);

// ---------------------------------------------------------------- 03 BODY ALARM

const c3Back: ShotFn = ({ lt }) => {
  const stretch = ease(lt / 0.8);
  const pose = sittingPose({
    lean: 0.1,
    expression: "worried",
    headPitch: 0.2,
    lShoulder: [0.5 - 0.3 * stretch, -0.25 + 2.85 * stretch],
    rShoulder: [0.5 - 0.3 * stretch, -0.25 + 2.85 * stretch],
    lElbow: 1.4 - 1.1 * stretch,
    rElbow: 1.4 - 1.1 * stretch,
  });
  const pulse = 0.5 + 0.5 * Math.sin(lt * 9);
  return (
    <RoomShot cam={lerpCam(SIDE, { position: [-4.9, 3.1, 0.6], target: [1.2, 2.6, 2.0] }, lt / 2.5)} hours={8} pose={pose} cans={5} waterBottle controller={stretch > 0.2 ? [0.5, 0.79, 1.9] : undefined}>
      <mesh position={[SEAT[0], 1.35, SEAT[2] + 0.4]}>
        <icosahedronGeometry args={[0.42 + pulse * 0.08, 1]} />
        <meshBasicMaterial color="#FF3A3A" transparent opacity={0.3 + pulse * 0.25} depthWrite={false} toneMapped={false} />
      </mesh>
    </RoomShot>
  );
};

const c3Reaction: ShotFn = ({ lt }) => (
  <AbsoluteFill>
    <GameStage cam={lerpCam({ position: [-13, 5, 0.6], target: [0, 0.6, 0] }, { position: [-12, 4.8, 0.6], target: [0, 0.6, 0] }, lt / 2)} shake={lt > 0.9 && lt < 1.3 ? 0.15 : 0}>
      <GameWorld />
      {tbone(lt, 0.9, GAME_PINK, "#4FC3C8")}
    </GameStage>
    <GameHud stars={1} banner={lt < 0.85 ? "BRAKE!" : undefined} bannerColor="#FFBA58" />
  </AbsoluteFill>
);

const c3Water: ShotFn = ({ lt }) => (
  <RoomShot
    cam={lerpCam({ position: [4.6, 2.6, 4.6], target: [3.3, 1.3, 1.4] }, { position: [4.4, 2.5, 4.1], target: [3.3, 1.3, 1.4] }, lt / 2)}
    hours={8}
    pose={FOCUS()}
    cans={6}
    waterBottle
    overlay={<CardLine text="WATER: UNTOUCHED" sub="ENERGY DRINKS: 6" y={1160} appearFrame={-9999} />}
  />
);

/** A street full of wrecks on a grid (2.6 × 4.2 spacing) so no two cars overlap. */
const c3Crashed: ShotFn = ({ lt }) => {
  const count = Math.round(300 * ease(lt / 1.6));
  const wrecks = Array.from({ length: 14 }, (_, i) => ({
    p: [(i % 2 ? 1.7 : -1.7) + (random(`wx${i}`) - 0.5) * 0.3, 0, 10 - Math.floor(i / 2) * 4.2] as V3,
    yaw: Math.PI + (random(`wy${i}`) - 0.5) * 0.5,
    c: GAME_COLORS[i % GAME_COLORS.length],
  }));
  return (
    <AbsoluteFill>
      <GameStage cam={lerpCam({ position: [0.6, 11, 19], target: [0, 0, 1] }, { position: [0.6, 10.5, 17], target: [0, 0, 0] }, lt / 2)}>
        <GameWorld palms={false} />
        {wrecks.map((w, i) => (
          <Car key={i} position={w.p} yaw={w.yaw} color={w.c} crumple={0.8} lights={false} tilt={[0, (random(`wt${i}`) - 0.5) * 0.12]} />
        ))}
        <SmokeCluster position={[-1.7, 0.4, -10]} progress={0.5} radius={1.4} count={6} rise={1.6} seed="wr" />
      </GameStage>
      <GameHud stars={0} />
      <CardLine text={`CARS CRASHED: ${count}`} y={1160} appearFrame={-9999} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 04 MIDNIGHT MISTAKES

const c4Night: ShotFn = ({ lt, t }) => (
  <RoomShot cam={lerpCam(TVVIEW, { position: [1.0, 7.2, 8.3], target: [0.8, 1.4, -1.5] }, lt / 2.5)} hours={12} pose={TIRED(0.4)} cans={8} waterBottle pizza feed={driveFeed(lt, true, 10)} />
);

const c4Walls: ShotFn = ({ lt }) => {
  const faceZ = -18;
  const ti = 0.8;
  const crumple = clamp01((lt - ti) / 0.15);
  const shift = (3.1 - 3.1 * (1 - 0.18 * crumple)) / 2;
  const contactZ = faceZ + CAR_HALF_LENGTH;
  const carZ = lt < ti ? contactZ + 11 * (ti - lt) : contactZ - 2 * shift;
  return (
    <AbsoluteFill>
      <GameStage night cam={lerpCam({ position: [0.6, 3.8, -5], target: [1.6, 1.4, -16] }, { position: [0.6, 3.6, -6.5], target: [1.6, 1.4, -16.5] }, lt / 2)} shake={lt > ti && lt < ti + 0.4 ? 0.16 : 0}>
        <GameWorld palms={false} />
        <Building position={[0, 0, faceZ - 2.5]} w={5.8} d={5} h={9} color="#E86FA8" seed="wall" />
        <Car position={[1.7, 0, carZ]} yaw={Math.PI} color={GAME_PINK} sporty crumple={crumple} />
        <SmokeCluster position={[1.7, 0.3, faceZ + 0.6]} progress={clamp01((lt - ti) / 1.2)} radius={1.1} count={6} rise={1.4} seed="cw" />
      </GameStage>
      <GameHud stars={1} />
    </AbsoluteFill>
  );
};

/** The car sails past a glowing turn arrow and skids to a stop on the empty road beyond it. */
const c4Turns: ShotFn = ({ lt }) => {
  const v0 = 14;
  const stopT = 1.8;
  const tt = Math.min(lt, stopT);
  const z = 10 - (v0 * tt - (v0 / (2 * stopT)) * tt * tt);
  const spin = lt > 1.0 ? Math.min(0.9, (lt - 1.0) * 0.9) : 0;
  return (
    <AbsoluteFill>
      <GameStage night cam={lerpCam({ position: [0.5, 16, 12], target: [0, 0, -6] }, { position: [0.5, 15, 10], target: [0, 0, -7] }, lt / 2)}>
        <GameWorld />
        <group position={[2.2, 0.03, 0.2]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
          <mesh>
            <coneGeometry args={[1.1, 1.6, 3]} />
            <meshBasicMaterial color="#2FE0D0" toneMapped={false} />
          </mesh>
        </group>
        <Car position={[1.7, 0, z]} yaw={Math.PI + spin} color={GAME_PINK} sporty />
      </GameStage>
      <GameHud stars={1} mission="TURN RIGHT" banner={lt > 1.2 ? "WRONG WAY" : undefined} bannerColor="#FFBA58" />
    </AbsoluteFill>
  );
};

/**
 * The cop on a bicycle (real scale: a bit taller than the car) rolls up beside the stalled supercar.
 * Separate lanes: the bike at x = 0.15 (about ±0.5 wide), the car at x = 1.75 (0.95–2.55).
 */
const c4Bike: ShotFn = ({ lt }) => {
  const carZ = -4;
  const stopZ = carZ + 0.4;
  const bz = Math.min(stopZ, -14 + lt * 5.5);
  const pedal = bz < stopZ ? lt * 1.6 : 1.6 * ((stopZ + 14) / 5.5);
  return (
    <AbsoluteFill>
      <GameStage night cam={lerpCam({ position: [-1.4, 2.3, carZ + 8], target: [0.9, 0.9, carZ - 1.5] }, { position: [-1.3, 2.2, carZ + 7], target: [0.9, 0.9, carZ - 1] }, lt / 2.5)}>
        <GameBoulevard nearZ={carZ} night />
        <Car position={[1.75, 0, carZ]} yaw={Math.PI} color={GAME_PINK} sporty crumple={0.5} lights={false} />
        <SmokeCluster position={[1.75, 0.6, carZ - 1.2]} progress={0.5} radius={0.6} count={4} rise={0.9} seed="bk" />
        <CopOnBike position={[0.15, 0, bz]} pedal={pedal} />
      </GameStage>
      <GameHud stars={1} banner={bz >= stopZ ? "CAUGHT BY A BICYCLE" : undefined} bannerY={430} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 05 RUNNING ON EMPTY

const c5Burning: ShotFn = ({ lt }) => (
  <RoomShot cam={lerpCam(FACE, FACE_CLOSE, lt / 3)} hours={18} pose={TIRED(0.5)} tired cans={12} waterBottle pizza />
);

const c5Focus: ShotFn = ({ lt }) => {
  const blur = 1 + 6 * ease(lt / 1.8);
  const z = 4 - lt * 8;
  const wobble = Math.sin(lt * 2.5) * 0.25;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: `blur(${blur}px)` }}>
        <GameStage night cam={chaseCam(z)}>
          <GameBoulevard nearZ={z} night />
          <Car position={[1.75 + wobble, 0, z]} yaw={Math.PI + wobble * 0.3} color={GAME_PINK} sporty />
        </GameStage>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 45% at 50% 48%, rgba(0,0,0,0) 40%, rgba(0,0,0,${0.3 + 0.4 * ease(lt / 1.8)}) 100%)` }} />
      <GameHud stars={0} />
    </AbsoluteFill>
  );
};

const c5Easy: ShotFn = ({ lt }) => {
  const k = ease(lt / 1.6);
  const spot: V3 = [-1.7, 0, -2];
  return (
    <AbsoluteFill>
      <GameStage night cam={lerpCam({ position: [-1.0, 8.5, 8], target: [-1.7, 0, -2] }, { position: [-1.0, 8.0, 7], target: [-1.7, 0, -2] }, lt / 2)}>
        <GameWorld />
        <mesh position={[spot[0], 0.03, spot[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.7, 1.85, 4, 1, Math.PI / 4]} />
          <meshBasicMaterial color="#2FE0D0" toneMapped={false} />
        </mesh>
        <Car position={[-1.7 + 1.2 * k, 0, 6 - 6.5 * k]} yaw={Math.PI + 0.7 * k} color={GAME_PINK} sporty />
      </GameStage>
      <GameHud stars={0} mission="PARK THE CAR" banner={lt > 1.5 ? "MISSION FAILED" : undefined} bannerColor="#FF4A4A" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 06 GAME OVER

const c6Day: ShotFn = ({ lt, t }) => (
  <RoomShot cam={lerpCam(TVVIEW, { position: [1.0, 7.2, 8.3], target: [0.8, 1.4, -1.5] }, lt / 2.5)} hours={24} pose={TIRED(0.6)} tired cans={15} waterBottle pizza feed={driveFeed(lt, false, 5)} />
);

const c6Sleep: ShotFn = ({ lt }) => {
  const nod = Math.max(0, Math.sin(lt * 2.2)) * 0.55;
  return (
    <RoomShot
      cam={lerpCam(FACE, FACE_CLOSE, lt / 2.5)}
      hours={24}
      pose={TIRED(0.55 + nod * 0.6)}
      tired
      cans={15}
      waterBottle
      pizza
      overlay={<CardLine text="24 H AWAKE ≈ 0.10% BLOOD ALCOHOL" sub="SAME IMPAIRMENT · DAWSON & REID, NATURE 1997" y={1160} appearFrame={-9999} />}
    />
  );
};

const ZzzOverlay: React.FC<{ at: V3; cam: CameraSpec; lt: number }> = ({ at, cam, lt }) => {
  const { width, height } = useVideoConfig();
  const p = project(at, cam, width, height);
  return (
    <>
      {[0, 1, 2].map((i) => {
        const k = ((lt * 0.7 + i / 3) % 1);
        return (
          <div key={i} style={{ position: "absolute", left: p.x + 40 + k * 60, top: p.y - 60 - k * 140, fontFamily: FONT, fontWeight: 700, fontSize: 40 + i * 10, color: "#F6EBC4", opacity: 1 - k, textShadow: "0 3px 8px rgba(0,0,0,0.6)" }}>
            Z
          </div>
        );
      })}
    </>
  );
};

const c6Rest: ShotFn = ({ lt }) => {
  const droop = ease(lt / 1.2);
  const pose = sittingPose({ lean: 0.2 + 0.25 * droop, headPitch: -0.7 * droop, blink: 1, expression: "neutral", lElbow: 1.4 - 0.9 * droop, rElbow: 1.4 - 0.9 * droop, lShoulder: [0.5 - 0.3 * droop, -0.25], rShoulder: [0.5 - 0.3 * droop, -0.25] });
  const cam = lerpCam(SIDE, { position: [-4.8, 3.0, 0.6], target: [1.2, 2.3, 2.0] }, lt / 2.5);
  const head = headPosition(pose, SEAT, SEAT_YAW);
  return (
    <RoomShot cam={cam} hours={24} pose={pose} tired cans={15} waterBottle pizza controller={[0.4, 0.79, 1.9]} overlay={<ZzzOverlay at={head} cam={cam} lt={lt} />} />
  );
};

// ---------------------------------------------------------------- 07 THE TWIST

const c7Wake: ShotFn = ({ lt }) => {
  const jolt = lt > 0.3 ? 1 : 0;
  const pose = sittingPose({ lean: 0.1, headPitch: 0.1 * jolt, blink: jolt ? 0 : 1, expression: jolt ? "alarm" : "neutral" });
  return <RoomShot cam={lerpCam(WIDE, { position: [4.6, 6.2, 9.6], target: [-0.4, 2.0, -1.5] }, lt / 2)} hours={24} pose={pose} tired cans={15} waterBottle pizza />;
};

/** SKILL over 24 hours: up fast in the first hours, then down below where it started. */
const skillCurve = (h: number) => (h < 3 ? 0.35 + 0.6 * ease(h / 3) : 0.95 - 0.8 * ease((h - 3) / 21));

const SkillGraph: React.FC<{ upTo: number; label?: string }> = ({ upTo, label }) => {
  const W = 860, H = 560, x0 = 110, y0 = 650;
  const pts: string[] = [];
  for (let i = 0; i <= 96; i++) {
    const h = (i / 96) * 24;
    if (h > upTo) break;
    pts.push(`${x0 + (h / 24) * W},${y0 + H - skillCurve(h) * H}`);
  }
  const lastH = Math.min(upTo, 24);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 60% at 50% 45%, #1A2148 0%, #090E26 70%)", fontFamily: FONT }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={x0} y1={y0 + H} x2={x0 + W} y2={y0 + H} stroke="rgba(255,255,255,0.35)" strokeWidth={3} />
        <line x1={x0} y1={y0} x2={x0} y2={y0 + H} stroke="rgba(255,255,255,0.35)" strokeWidth={3} />
        <line x1={x0} y1={y0 + H - skillCurve(0) * H} x2={x0 + W} y2={y0 + H - skillCurve(0) * H} stroke="rgba(246,235,196,0.35)" strokeWidth={2} strokeDasharray="10 10" />
        {[0, 6, 12, 18, 24].map((h) => (
          <text key={h} x={x0 + (h / 24) * W} y={y0 + H + 48} fill="rgba(255,255,255,0.7)" fontSize={26} textAnchor="middle" fontFamily="inherit">
            {h}H
          </text>
        ))}
        <text x={x0 - 20} y={y0 - 24} fill="rgba(255,255,255,0.7)" fontSize={24} fontFamily="inherit" letterSpacing="4">
          SKILL
        </text>
        <polyline points={pts.join(" ")} fill="none" stroke="#FFBA58" strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" />
        {pts.length ? (
          <circle cx={x0 + (lastH / 24) * W} cy={y0 + H - skillCurve(lastH) * H} r={16} fill="#FFBA58" />
        ) : null}
      </svg>
      {label ? (
        <div style={{ position: "absolute", top: 520, width: "100%", textAlign: "center", color: "#FF6A6A", fontWeight: 700, fontSize: 40, letterSpacing: "0.08em" }}>{label}</div>
      ) : null}
    </AbsoluteFill>
  );
};

const c7Graph: ShotFn = ({ lt, dur }) => <SkillGraph upTo={4 * ease(lt / Math.max(0.8, dur * 0.8))} />;
const c7Worse: ShotFn = ({ lt, dur }) => <SkillGraph upTo={4 + 20 * ease(lt / Math.max(0.8, dur * 0.85))} label={lt > dur * 0.8 ? "WORSE THAN HOUR 0" : undefined} />;

const c7Down: ShotFn = ({ lt }) => {
  const k = ease(lt / 1.0);
  const pose = sittingPose({ lean: 0.1 - 0.1 * k, expression: k > 0.8 ? "relief" : "neutral", lElbow: 1.4 - 1.1 * k, rElbow: 1.4 - 1.1 * k, lShoulder: [0.5 - 0.45 * k, -0.25 + 0.35 * k], rShoulder: [0.5 - 0.45 * k, -0.25 + 0.35 * k], blink: 0.3 });
  const inHands = controllerAt(sittingPose());
  const onSeat: V3 = [0.35, 0.79, 1.9];
  const ctrl: V3 = [inHands[0] + (onSeat[0] - inHands[0]) * k, inHands[1] + (onSeat[1] - inHands[1]) * k, inHands[2] + (onSeat[2] - inHands[2]) * k];
  return <RoomShot cam={lerpCam(FACE, { position: [2.6, 3.0, -3.0], target: [1.2, 2.2, 1.9] }, lt / 2)} hours={24} pose={pose} tired cans={15} waterBottle pizza controller={ctrl} />;
};

const c7Text: ShotFn = ({ lt }) => {
  const buzz = Math.sin(lt * 70) * 0.03;
  return (
    <RoomShot
      cam={{ position: [2.45 + buzz, 2.7, 3.1], target: [2.8, 1.13, 1.75] }}
      hours={24}
      pose={sittingPose({ lean: 0.05, expression: "relief", blink: 0.3 })}
      tired
      cans={15}
      waterBottle
      pizza
      phoneGlow
      controller={[0.35, 0.79, 1.9]}
    />
  );
};

const c7Bro: ShotFn = ({ lt }) => {
  const pop = ease(lt / 0.25);
  return (
    <AbsoluteFill style={{ background: "#0B0D16", fontFamily: FONT }}>
      <div style={{ position: "absolute", left: 140, right: 140, top: 360, bottom: 360, borderRadius: 60, background: "#141826", border: "6px solid #2A2F44" }}>
        <div style={{ marginTop: 70, textAlign: "center", color: "rgba(255,255,255,0.75)", fontSize: 30, letterSpacing: "0.1em" }}>MATE</div>
        <div style={{ marginTop: 8, textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 20 }}>now</div>
        <div
          style={{
            margin: "70px 60px 0 60px",
            padding: "34px 40px",
            borderRadius: "40px 40px 40px 10px",
            background: "#2E3550",
            color: "#FFFFFF",
            fontSize: 54,
            fontWeight: 700,
            lineHeight: 1.2,
            transform: `scale(${0.85 + 0.15 * pop})`,
            transformOrigin: "left bottom",
            opacity: pop,
          }}
        >
          Bro, you getting on GTA?
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- shot list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldFace },
    { cue: "destroying your", fn: coldRoom },
    { cue: "At first", fn: coldUnstoppable },
    { cue: "By the end", fn: coldBeat },
  ],
  c1: [
    { cue: null, fn: c1Hooked },
    { cue: "Exploring", fn: c1Explore },
    { cue: "stealing", fn: c1Steal },
    { cue: "causing", fn: c1Chaos },
    { cue: "Time flies", fn: c1Flies },
  ],
  c2: [
    { cue: null, fn: c2Eyes },
    { cue: "You've been blinking", fn: c2Blink },
    { cue: "your neck", fn: c2Neck },
    { cue: "and the outside", fn: c2Outside },
  ],
  c3: [
    { cue: null, fn: c3Back },
    { cue: "your reactions", fn: c3Reaction },
    { cue: "and you forgot", fn: c3Water },
    { cue: "You've also", fn: c3Crashed },
  ],
  c4: [
    { cue: null, fn: c4Night },
    { cue: "You crash", fn: c4Walls },
    { cue: "miss obvious", fn: c4Turns },
    { cue: "and somehow", fn: c4Bike },
  ],
  c5: [
    { cue: null, fn: c5Burning },
    { cue: "and your focus", fn: c5Focus },
    { cue: "Even the easiest", fn: c5Easy },
  ],
  c6: [
    { cue: null, fn: c6Day },
    { cue: "Your sleep", fn: c6Sleep },
    { cue: "and your body", fn: c6Rest },
  ],
  c7: [
    { cue: null, fn: c7Wake },
    { cue: "You spent a whole", fn: c7Graph },
    { cue: "and got worse", fn: c7Worse },
    { cue: "And just as", fn: c7Down },
    { cue: "your friend texts", fn: c7Text },
    { cue: "Bro", fn: c7Bro },
  ],
};

