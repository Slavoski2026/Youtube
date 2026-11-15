/**
 * Shots for "What If Everyone Skipped Work for GTA 6?" (ep. 9: release day, Thursday 19 November).
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 * Hook: 7:00 on the alarm clock, Slavoski bolts up, the game boots, he fake-coughs down the phone.
 * Day arc (a drizzly November): dark dawn bedroom → grey rainy office → overcast city → stormy neon dusk
 * at the game store → evening in → a rainy night city glowing with game screens.
 * The game is only ever our own neon art: never GTA footage, logos, box art, map or HUD.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Car, Ground, StreetSet } from "../../slavoski/city";
import { BoxG, chamferBox, CylG, IcoG } from "../../slavoski/detail";
import { FONT } from "../../slavoski/fonts";
import { crowdLook, suitLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Clouds, Rain } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { CardLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import { handPosition, headPosition, Hero, mergePose, reach, REST, type Pose } from "../../slavoski/rig/Hero";
import { Controller, SEAT, SEAT_YAW, sittingPose } from "../../slavoski/room";
import { CanvasPanel, ScreenHtml } from "../../slavoski/screens";
import { FacetedEarth } from "../../slavoski/space";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import { type CuedShot } from "../../slavoski/timeline";
import { driveFeed, FACE, FACE_CLOSE, RoomShot } from "../gta-24h/shots";
import { Balance, CoinFlow, CoinPile, Crane, House, HillRing, SkyscraperSite } from "../no-work-2036/props";
import { BED, Bedroom } from "../smart-animals/props";
import { CITY, drawLabel, PHONE, Phone3D } from "../ww3-countdown/props";
import {
  BarChart,
  BedsideClock,
  CashRegister,
  DeskPhone,
  drawAppointments,
  drawCalendar,
  drawGameArt,
  drawRota,
  drawSign,
  GameBox,
  Handset,
  Headset,
  NEON_PINK,
  NEON_TEAL,
  OfficeChair,
  OpenOffice,
  PaperStack,
  PawnGrid,
  RubberStamp,
  ScreenCity,
  seatedWorker,
  ShopFront,
  StreamerDesk,
  TrafficLight,
  UmbrellaWalker,
  WallClock,
} from "./props";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
const startFrame = (c: ShotCtx) => Math.round((c.t - c.lt) * 30);
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const Shot: React.FC<{ children: React.ReactNode; overlay?: React.ReactNode } & React.ComponentProps<typeof Stage>> = ({ children, overlay, ...stage }) => (
  <AbsoluteFill>
    <Stage {...stage}>{children}</Stage>
    {overlay}
  </AbsoluteFill>
);

/** Kit street ×3.5 so it matches Slavoski (road |x| < 12.25, pavements to 21.35). */
const BigStreet: React.FC<React.ComponentProps<typeof StreetSet> & { day?: boolean }> = ({ day = false, ...props }) => (
  <group scale={CITY}>
    <StreetSet {...props} lampsOn={day ? false : props.lampsOn} modify={day ? (sp, i) => ({ power: 0.35, ...(props.modify?.(sp, i) ?? {}) }) : props.modify} />
  </group>
);

const GREY = "#AEB6C2";
const STORM_CLOUD = "#3E4656";

/** Drizzle around a point (keeps the box near the camera so the streaks read). */
const Drizzle: React.FC<{ t: number; at: V3; size?: [number, number, number]; count?: number; opacity?: number }> = ({ t, at, size = [40, 26, 40], count = 700, opacity = 0.4 }) => (
  <Rain center={at} size={size} t={t} count={count} thickness={0.025} opacity={opacity} speed={26} />
);

/** Room clock: hours since noon for the gaming room (7:00 → 19). */
const roomHours = (clock: number) => (clock - 12 + 24) % 24;

/** "PRESS START" over the game's own boulevard feed. */
const titleFeed = (lt: number) => (size: { width: number; height: number }) => (
  <AbsoluteFill>
    {driveFeed(lt, false, 6)(size)}
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: size.height * 0.62,
        textAlign: "center",
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: size.height * 0.11,
        letterSpacing: "0.2em",
        color: Math.floor(lt * 2.5) % 2 ? "#FFFFFF" : "#FFE27A",
        textShadow: `0 0 ${size.height * 0.04}px ${NEON_PINK}`,
      }}
    >
      PRESS START
    </div>
  </AbsoluteFill>
);

/** A phone close-up in front of a backdrop, its screen an HTML overlay pinned to the 3D phone. */
const PhoneCU: React.FC<{ c: ShotCtx; at: V3; glow: string; screen: (w: number, h: number) => React.ReactNode; children: React.ReactNode; stage?: Partial<React.ComponentProps<typeof Stage>> }> = ({
  c,
  at,
  glow,
  screen,
  children,
  stage,
}) => {
  const cam = move({ position: [at[0] + 0.05, at[1], at[2] + 2.1], target: [at[0], at[1] - 0.02, at[2]] }, { position: [at[0] + 0.03, at[1], at[2] + 1.8], target: at }, c);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      stars={false}
      shadowSize={10}
      {...stage}
      overlay={
        <ScreenHtml c={[at[0], at[1], at[2] + PHONE.d / 2 + 0.003]} w={PHONE.screenW} h={PHONE.screenH} cam={cam} width={c.width} height={c.height}>
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
      <pointLight position={[at[0], at[1], at[2] + 1]} color={glow} intensity={4} distance={4} decay={2} />
    </Shot>
  );
};

/** A seated pose on the couch with the right hand at the ear (phone) and the left fist at the mouth (a fake cough). */
const coughPose = (lt: number) => {
  const cough = Math.max(0, Math.sin(lt * 9)) ** 3;
  const base = sittingPose({ expression: "worried", blink: 0.35, lean: 0.08 + cough * 0.12, headPitch: -0.05 - cough * 0.12, headYaw: 0.1 });
  const head = headPosition(base, SEAT, SEAT_YAW);
  const toWorld = (l: V3): V3 => [head[0] + l[0] * Math.cos(SEAT_YAW) + l[2] * Math.sin(SEAT_YAW), head[1] + l[1], head[2] - l[0] * Math.sin(SEAT_YAW) + l[2] * Math.cos(SEAT_YAW)];
  const withPhone = reach(base, "r", toWorld([-0.9, -0.08, 0.22]), { position: SEAT, yaw: SEAT_YAW }).pose;
  const pose = reach(withPhone, "l", toWorld([0.1, -0.42, 0.88]), { position: SEAT, yaw: SEAT_YAW }).pose;
  const phone = toWorld([-0.72, 0.02, 0.1]);
  return { pose, phone };
};

/** Sitting up in bed (ep. 4/5 rig placement). */
const BED_HERO: V3 = [BED.x, BED.mattressTop - (1.55 + 0.02 - 0.18), -2.55];
const bedPose = (over: Partial<Pose> = {}): Pose =>
  mergePose(REST, { lHip: [1.47, 0.06], rHip: [1.47, 0.06], lKnee: 0.04, rKnee: 0.04, lShoulder: [0.25, 0.25], rShoulder: [0.25, 0.25], lElbow: 0.5, rElbow: 0.5, ...over });

/** A row of three shops on a wet pavement (z = 0 facades, road in front), towers behind. */
const ShopRow: React.FC<{ t: number; main: React.ReactNode; night?: boolean; seed?: string }> = ({ t, main, night = false, seed = "row" }) => (
  <group>
    <Ground color="#3A3F55" />
    <mesh position={[0, 0.01, 12]} receiveShadow>
      <BoxG args={[120, 0.04, 16]} />
      <Flat color={night ? "#1E2232" : "#2C3247"} />
    </mesh>
    {[-30, -15, 0, 15, 30].map((x) => (
      <mesh key={x} position={[x, 0.05, 12]}>
        <boxGeometry args={[4, 0.02, 0.35]} />
        <Flat color={P.laneMark} />
      </mesh>
    ))}
    {main}
    <ShopFront position={[-15, 0, 0]} w={14} color="#2E5A6A" awning={["#24748F", "#F4F2EA"]} sign={drawSign("BAKERY", "#F4F2EA", "#2E5A6A")} glow="#F2D8A0" />
    <ShopFront position={[15, 0, 0]} w={14} color="#566270" awning={["#2B2F3E", "#E8C04A"]} sign={drawSign("BOOKS", "#2B2F3E", "#E8C04A")} glow="#E8D0A0" />
    {[-40, -24, -8, 8, 24, 40].map((x, i) => (
      <mesh key={x} position={[x, 18, -14]} castShadow>
        <BoxG args={[15, 36, 16]} />
        <Flat color={[P.bldgNavy, P.bldgSlate, P.bldgPurple, P.bldgTeal][i % 4]} />
      </mesh>
    ))}
    <Clouds t={t} color={night ? STORM_CLOUD : GREY} y={46} radius={120} count={18} seed={`${seed}cl`} />
  </group>
);

// ---------------------------------------------------------------- cold open: release morning

const CLOCK_AT: V3 = [0.1, 1.1, -2.98];

/** 0 s: the bedside clock flips from 06:59 to 07:00 (and starts flashing); a controller waits on the pillow. */
const coldClock: ShotFn = (c) => {
  const cam = move({ position: add(CLOCK_AT, [0.35, 0.9, 3.4]), target: add(CLOCK_AT, [0.12, 0.22, 0]) }, { position: add(CLOCK_AT, [0.3, 0.8, 2.9]), target: add(CLOCK_AT, [0.12, 0.22, 0]) }, c);
  const seven = c.lt > 0.5;
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.4} shadowSize={6}>
      <Bedroom lampOn={false} dawn />
      <group scale={0.8} position={CLOCK_AT}>
        <BedsideClock position={[0, 0, 0]} text={seven ? "07:00" : "06:59"} blink={seven && Math.floor(c.lt * 4) % 2 === 1} />
      </group>
      <Controller position={[0.98, 1.2, -2.45]} yaw={0.5} pitch={0} lit />
      <pointLight position={[CLOCK_AT[0], CLOCK_AT[1] + 0.4, CLOCK_AT[2] + 0.8]} color="#FF3030" intensity={seven ? 5 : 2} distance={4} decay={2} />
    </Shot>
  );
};

/** He bolts upright in bed with a huge grin, arms up. */
const coldWake: ShotFn = (c) => {
  const cam = move({ position: [BED.x + 2.6, 3.6, 6.8], target: [BED.x - 0.3, 3.4, -2.0] }, { position: [BED.x + 2.2, 3.5, 6.0], target: [BED.x - 0.3, 3.4, -2.0] }, c);
  const up = k01(c.lt, 0.05, 0.4);
  const pose = bedPose({ lean: -0.4 * (1 - up), expression: c.lt > 0.25 ? "smile" : "awe", lShoulder: [0.1, 0.25 + 2.1 * up], rShoulder: [0.1, 0.25 + 2.1 * up], lElbow: 0.3, rElbow: 0.3 });
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={0.5} shadowSize={10}>
      <Bedroom lampOn={false} dawn />
      <group scale={0.8} position={CLOCK_AT}>
        <BedsideClock position={[0, 0, 0]} text="07:00" blink={Math.floor(c.t * 4) % 2 === 1} />
      </group>
      <Hero pose={pose} position={BED_HERO} />
    </Shot>
  );
};

/** On the couch already: the TV boots the game ("PRESS START"). */
const coldTV: ShotFn = (c) => (
  <RoomShot cam={lerpCam({ position: [1.0, 6.0, 9.4], target: [0.8, 3.4, -3] }, { position: [1.0, 5.8, 8.6], target: [0.8, 3.4, -3] }, c.lt / 3)} hours={roomHours(7.05)} pose={sittingPose({ lean: 0.3, expression: "smile" })} feed={titleFeed(c.lt)} cans={0} />
);

/** "…stay home": the fake cough down the phone to the boss. */
const coldCough: ShotFn = (c) => {
  const { pose, phone } = coughPose(c.lt);
  return (
    <RoomShot cam={lerpCam(FACE, FACE_CLOSE, c.lt / 3)} hours={roomHours(7.1)} pose={pose} controller={null} cans={0}>
      <Phone3D position={phone} rotation={[0, SEAT_YAW + Math.PI / 2, 0]} glow="#9FC4E8" />
      <Controller position={[SEAT[0] - 1.4, 0.95, SEAT[2] + 0.1]} yaw={0.4} pitch={0} />
    </RoomShot>
  );
};

/** Grey drizzly dawn over the city: window after window lights up with a game. */
const coldCity: ShotFn = (c) => {
  const cam = move({ position: [150, 120, 175], target: [0, 4, 0] }, { position: [138, 112, 162], target: [0, 4, 0] }, c);
  return (
    <Shot mood="storm" camera={cam} fog={[170, 480]} shadowSize={100} light={0.8}>
      <Ground color="#2C3247" />
      <ScreenCity t={c.t} games={0.18 + k01(c.lt, 0.1, 1.1) * 0.32} lit={0.25} />
      <Clouds t={c.t} color={STORM_CLOUD} y={50} radius={300} count={30} seed="dawncl" />
      <Drizzle t={c.t} at={[110, 90, 130]} size={[60, 50, 60]} count={900} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 empty desks (grey rainy morning)

const c1Office: ShotFn = (c) => {
  const cam = move({ position: [15, 7.5, 9], target: [-3, 2.2, -12] }, { position: [12, 7, 7], target: [-3, 2.2, -12] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={false} stars={false} shadowSize={30} light={0.9}>
      <OpenOffice t={c.t} seats={(r, col) => (r === 1 && col === 3) || (r === 3 && col === 1)} />
      <WallClock position={[-21.8, 6.4, -6]} r={1.2} hours={9 + c.lt * 0.02} yaw={Math.PI / 2} />
    </Shot>
  );
};

/** A manager drowning in sick calls: handset at his ear, hand on his head, the phone lit up. */
const MGR: V3 = [0, 0, 6];
const c1Manager: ShotFn = (c) => {
  const calls = Math.min(9, 3 + Math.floor(c.lt * 3.2));
  const base = seatedWorker({ expression: "worried", headYaw: 0.15, lShoulder: [2.55, 0.35], lElbow: 1.7 });
  const head = headPosition(base, MGR, 0);
  const pose = reach(base, "r", [head[0] - 0.9, head[1] - 0.1, head[2] + 0.2], { position: MGR, yaw: 0 }).pose;
  const cam = move({ position: add(MGR, [1.6, 3.6, 10.5]), target: add(MGR, [0, 2.6, 0]) }, { position: add(MGR, [1.3, 3.5, 9.2]), target: add(MGR, [0, 2.65, 0]) }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={false} stars={false} shadowSize={14} light={0.9} overlay={<CardLine text={`${calls} SICK CALLS`} y={330} appearFrame={startFrame(c) + 4} accent="#FF6A4A" />}>
      <OpenOffice t={c.t} seats={() => false} />
      <OfficeChair position={MGR} yaw={Math.PI} color="#17181E" />
      <Hero pose={pose} position={MGR} look={suitLook(9)} />
      <Handset position={[head[0] - 0.74, head[1] - 0.02, head[2] + 0.12]} rotation={[0.2, 0, 0.15]} />
      <mesh position={[0, 1.44, MGR[2] + 1.55]} geometry={chamferBox(4.2, 0.12, 1.6)} castShadow receiveShadow>
        <Flat color="#5A4A3A" />
      </mesh>
      <mesh position={[0, 0.72, MGR[2] + 2.25]}>
        <BoxG args={[4.0, 1.4, 0.1]} />
        <Flat color="#4A3A2E" />
      </mesh>
      <DeskPhone position={[1.0, 1.5, MGR[2] + 1.6]} yaw={0.3} calls={calls} t={c.t} handset={false} />
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-1.2 + i * 0.32, 1.51, MGR[2] + 1.5 + (i % 2) * 0.2]} rotation={[-Math.PI / 2, 0, (random(`sn${i}`) - 0.5) * 0.6]}>
          <planeGeometry args={[0.3, 0.3]} />
          <Flat color="#F2D84A" />
        </mesh>
      ))}
    </Shot>
  );
};

/** A café in the rain with a SHORT STAFFED sign and a queue under umbrellas. */
const drawShortStaffed = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#F2D8A0";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(W * 0.25, H * 0.18, W * 0.5, H * 0.56);
  ctx.strokeStyle = "#C8372D";
  ctx.lineWidth = W * 0.012;
  ctx.strokeRect(W * 0.25, H * 0.18, W * 0.5, H * 0.56);
  ctx.textAlign = "center";
  ctx.fillStyle = "#C8372D";
  ctx.font = `700 ${Math.round(H * 0.12)}px "Slavoski Sans", "DejaVu Sans", sans-serif`;
  ctx.fillText("SHORT", W / 2, H * 0.36);
  ctx.fillText("STAFFED", W / 2, H * 0.5);
  ctx.fillStyle = "#2B2F3E";
  ctx.font = `400 ${Math.round(H * 0.06)}px "Slavoski Sans", "DejaVu Sans", sans-serif`;
  ctx.fillText("please be patient", W / 2, H * 0.64);
};
const c1Cafe: ShotFn = (c) => {
  const cam = move({ position: [-8, 4.2, 30], target: [2, 4.5, 0] }, { position: [-6.5, 4.1, 27.5], target: [2, 4.6, 0] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[30, 180]} shadowSize={30} light={0.85}>
      <ShopRow t={c.t} main={<ShopFront position={[0, 0, 0]} w={14} color="#5A4A78" sign={drawSign("CAFÉ", "#2B2F3E", "#F2C46A")} window={drawShortStaffed} />} />
      {[0, 1, 2, 3, 4].map((i) => (
        <UmbrellaWalker key={i} position={[4.5 + i * 0.4, 0, 3 + i * 2.8]} yaw={Math.PI + 0.1} seed={30 + i} />
      ))}
      <Hero pose={mergePose(REST, { lShoulder: [0.9, 0.2], lElbow: 1.2, rShoulder: [1.1, -0.1], rElbow: 1.0, expression: "worried", headYaw: 0.4 })} position={[-1.8, 0, -1.5]} look={crowdLook(77)} />
      <Drizzle t={c.t} at={[-2, 12, 18]} size={[30, 26, 22]} count={600} />
    </Shot>
  );
};

/** The shift rota: Thursday's column fills with red OFF cells. */
const c1Rota: ShotFn = (c) => {
  const cam = move({ position: [2.4, 4.6, 9.5], target: [1.5, 4.4, 0] }, { position: [2.2, 4.5, 8.4], target: [1.7, 4.4, 0] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={false} stars={false} shadowSize={10} light={0.9}>
      <mesh position={[0, 5, -0.4]} receiveShadow>
        <BoxG args={[24, 12, 0.4]} />
        <Flat color="#7A8294" />
      </mesh>
      <mesh position={[0, 4.4, -0.12]}>
        <BoxG args={[8.6, 5.0, 0.2]} />
        <Flat color="#C9CED8" />
      </mesh>
      <CanvasPanel position={[0, 4.4, 0.0]} w={8.2} h={4.6} px={900} draw={drawRota(k01(c.lt, 0.1, 1.2))} />
      <mesh position={[0, 0, 4]} receiveShadow>
        <BoxG args={[24, 0.1, 10]} />
        <Flat color="#3E4658" />
      </mesh>
      <mesh position={[4.6, 1.9, 0]} rotation={[0, 0, 0.3]}>
        <CylG args={[0.07, 0.07, 0.9]} />
        <Flat color="#C8372D" />
      </mesh>
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 the real numbers

/** "Sounds exaggerated?": he looks straight at us, one sly grin. */
const c2Look: ShotFn = (c) => (
  <RoomShot cam={lerpCam(FACE, FACE_CLOSE, c.lt / 2.5)} hours={roomHours(10)} pose={sittingPose({ lean: 0.1, expression: "smile", headYaw: 0.55 * k01(c.lt, 0.1, 0.5), headRoll: -0.12 * k01(c.lt, 0.1, 0.5) })} cans={1} />
);

/** A survey on a phone: Taking Nov 19 off? The YES bar fills to 18%. */
const SurveyScreen: React.FC<{ w: number; h: number; k: number }> = ({ w, h, k }) => (
  <div style={{ width: w, height: h, background: "#F4F2EE", fontFamily: FONT, padding: w * 0.08, boxSizing: "border-box", color: "#1A1A22" }}>
    <div style={{ fontSize: w * 0.06, letterSpacing: "0.12em", color: "#5A6478" }}>WORKPLACE SURVEY</div>
    <div style={{ fontSize: w * 0.05, color: "#8A92A2", marginTop: h * 0.01 }}>1,530 U.S. full-time workers</div>
    <div style={{ fontWeight: 700, fontSize: w * 0.095, lineHeight: 1.15, marginTop: h * 0.05 }}>Taking Nov 19 off for the launch?</div>
    {[
      { l: "YES", v: 18, c: P.amber },
      { l: "NO", v: 82, c: "#9AA4B4" },
    ].map((b) => (
      <div key={b.l} style={{ marginTop: h * 0.06 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: w * 0.08 }}>
          <span>{b.l}</span>
          <span>{Math.round(b.v * k)}%</span>
        </div>
        <div style={{ marginTop: h * 0.015, height: h * 0.05, background: "#DCDFE6", borderRadius: h * 0.025, overflow: "hidden" }}>
          <div style={{ width: `${b.v * k}%`, height: "100%", background: b.c }} />
        </div>
      </div>
    ))}
  </div>
);
const c2Survey: ShotFn = (c) => (
  <PhoneCU c={c} at={[1.6, 3.4, 4.4]} glow="#F4F2EE" stage={{ mood: "overcast", light: 0.8 }} screen={(w, h) => <SurveyScreen w={w} h={h} k={k01(c.lt, 0.15, 1.1)} />}>
    <OpenOffice t={c.t} seats={() => false} />
  </PhoneCU>
);

/** 100 workers; 18 of them light up amber, one by one. */
const c2Pawns: ShotFn = (c) => {
  const cam = move({ position: [0, 30, 14], target: [0, 0, -1] }, { position: [0.8, 28, 12.5], target: [0, 0, -1] }, c);
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      stars={false}
      shadowSize={14}
      light={0.85}
      overlay={<CardLine text="18% PLANNED A DAY OFF" sub="SOURCE: BAMBOOHR SURVEY, 2026" y={330} appearFrame={startFrame(c) + 8} />}
    >
      <PawnGrid k={k01(c.lt, 0.15, 1.7)} t={c.t} />
      <pointLight position={[0, 14, 6]} color="#FFE8C0" intensity={60} distance={40} decay={1.6} />
    </Shot>
  );
};

/** The desk calendar for Thu 19 Nov gets a DAY OFF stamp. */
const STAMP_DOWN = 0.75;
const c2Stamp: ShotFn = (c) => {
  const cam = move({ position: [0.6, 6.8, 4.2], target: [0, 0, -0.2] }, { position: [0.5, 6.1, 3.7], target: [0, 0, -0.2] }, c);
  const down = c.lt < STAMP_DOWN ? 1 - ease(c.lt / STAMP_DOWN) : c.lt < STAMP_DOWN + 0.2 ? 0 : ease(clamp01((c.lt - STAMP_DOWN - 0.2) / 0.4));
  const pageTop = 0.11;
  const stamped = c.lt >= STAMP_DOWN;
  return (
    <Shot mood="overcast" camera={cam} fog={false} stars={false} shadowSize={6} light={0.9} shake={stamped && c.lt < STAMP_DOWN + 0.15 ? 0.05 : 0}>
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <BoxG args={[14, 0.2, 10]} />
        <Flat color="#7A5A3E" />
      </mesh>
      <mesh position={[0, 0.05, 0]} geometry={chamferBox(3.0, 0.1, 3.4)} receiveShadow>
        <Flat color="#2B2F3E" />
      </mesh>
      <CanvasPanel position={[0, pageTop, 0]} rotation={[-Math.PI / 2, 0, 0]} w={2.6} h={3.1} px={420} draw={drawCalendar(stamped)} />
      <RubberStamp position={[0, 0, 0.05]} y={pageTop + down * 3.2} />
      <Controller position={[2.6, 0.12, 0.8]} yaw={-0.4} pitch={0} />
      <GameBox position={[-2.7, 0.08, 0.6]} rotation={[-Math.PI / 2, 0, 0.3]} />
    </Shot>
  );
};

/** Leave requests: a typical Thursday (100) vs 19 November (+13%). Honest bars from zero. */
const c2Bars: ShotFn = (c) => {
  const cam = move({ position: [1.0, 9.0, 29], target: [0, 5.6, 0] }, { position: [0.7, 8.8, 27], target: [0, 5.7, 0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={12} light={0.85} overlay={<CardLine text="LEAVE REQUESTS, NOV 19" sub="SOURCE: BAMBOOHR PTO DATA, 2026" y={330} appearFrame={startFrame(c) + 6} />}>
      <BarChart k={k01(c.lt, 0.1, 1.6)} t={c.t} />
      <pointLight position={[0, 12, 8]} color="#FFE8C0" intensity={50} distance={40} decay={1.6} />
    </Shot>
  );
};

/** An HR inbox filling up with "Leave request: Thu 19 Nov". */
const InboxScreen: React.FC<{ w: number; h: number; n: number }> = ({ w, h, n }) => {
  const names = ["J. Ortiz", "M. Chen", "A. Patel", "S. Okafor", "L. Novak", "R. Silva", "K. Berg", "D. Moreau", "T. Kim", "E. Rossi"];
  return (
    <div style={{ width: w, height: h, background: "#F4F6FA", fontFamily: FONT, overflow: "hidden" }}>
      <div style={{ height: h * 0.13, background: "#2B4A6A", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${w * 0.04}px`, fontWeight: 700, fontSize: h * 0.06 }}>
        <span>HR · INBOX</span>
        <span style={{ background: "#C8372D", borderRadius: h * 0.04, padding: `0 ${w * 0.015}px` }}>{n}</span>
      </div>
      {Array.from({ length: Math.min(n, 8) }, (_, i) => (
        <div key={i} style={{ height: h * 0.105, borderBottom: "1px solid #D6DCE6", display: "flex", alignItems: "center", padding: `0 ${w * 0.04}px`, fontSize: h * 0.045, color: "#1A1A22", background: i === 0 ? "#FFF6D8" : "transparent" }}>
          <b style={{ width: w * 0.24 }}>{names[(n - 1 - i + 100) % names.length]}</b>
          <span>Leave request: Thu 19 Nov</span>
        </div>
      ))}
    </div>
  );
};
const LAPTOP: V3 = [0, 1.5, 0];
const c2Inbox: ShotFn = (c) => {
  const scr: V3 = [LAPTOP[0], LAPTOP[1] + 0.95, LAPTOP[2] - 0.45];
  const cam = move({ position: add(scr, [0.6, 0.5, 7.6]), target: add(scr, [0, -0.2, 0]) }, { position: add(scr, [0.5, 0.45, 6.8]), target: add(scr, [0, -0.2, 0]) }, c);
  const n = 3 + Math.floor(c.lt * 4);
  return (
    <Shot
      mood="overcast"
      camera={cam}
      fog={false}
      stars={false}
      shadowSize={6}
      light={0.85}
      overlay={
        <ScreenHtml c={[scr[0], scr[1], scr[2] + 0.04]} w={3.0} h={1.8} cam={cam} width={c.width} height={c.height}>
          {(w, h) => <InboxScreen w={w} h={h} n={n} />}
        </ScreenHtml>
      }
    >
      <OpenOffice t={c.t} seats={() => false} />
      <mesh position={[LAPTOP[0], LAPTOP[1] + 0.95, LAPTOP[2] - 0.5]} castShadow>
        <BoxG args={[3.2, 2.0, 0.08]} />
        <Flat color="#2B2F3E" />
      </mesh>
      <mesh position={[LAPTOP[0], LAPTOP[1] - 0.06, LAPTOP[2] + 2]} geometry={chamferBox(6, 0.12, 5)} receiveShadow>
        <Flat color="#C9C2B4" />
      </mesh>
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 lost hours (overcast, rain)

const c3City: ShotFn = (c) => {
  const cam = move({ position: [-150, 95, 170], target: [0, 8, 0] }, { position: [-138, 90, 158], target: [0, 8, 0] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[170, 480]} shadowSize={100} light={0.85}>
      <Ground color="#3A3F55" />
      <ScreenCity t={c.t} games={0.28} lit={0.12} day seed="noon" />
      <Clouds t={c.t} color={GREY} y={50} radius={300} count={30} seed="noon" />
      <Drizzle t={c.t} at={[-110, 70, 125]} size={[60, 50, 60]} count={900} />
    </Shot>
  );
};

/** The office wall clock races over rows of empty chairs. */
const c3Clock: ShotFn = (c) => {
  const cam = move({ position: [-11.5, 3.0, 3.5], target: [-21.5, 5.0, -6] }, { position: [-12.2, 2.9, 2.4], target: [-21.5, 5.1, -6] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={false} stars={false} shadowSize={20} light={0.85}>
      <OpenOffice t={c.t} seats={() => false} />
      <WallClock position={[-21.8, 6.4, -6]} r={1.6} hours={12 + c.lt * 3.5} yaw={Math.PI / 2} />
    </Shot>
  );
};

/** Overtime: one worker left at a desk behind stacks of paper, under a desk lamp. */
const OT: V3 = [0, 0, 5.5];
const c3Overtime: ShotFn = (c) => {
  const cam = move({ position: add(OT, [2.4, 3.6, 9.5]), target: add(OT, [0, 2.6, 0.5]) }, { position: add(OT, [2.0, 3.5, 8.4]), target: add(OT, [0, 2.65, 0.5]) }, c);
  const type = Math.sin(c.t * 14) * 0.08;
  const pose = seatedWorker({ expression: "worried", blink: 0.45, lShoulder: [0.95 + type, -0.1], rShoulder: [0.95 - type, -0.1], headPitch: -0.12 });
  const desk = OT[2] + 1.55;
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={14} light={0.45}>
      <OpenOffice t={c.t} seats={() => false} dusk />
      <OfficeChair position={OT} yaw={Math.PI} color="#17181E" />
      <Hero pose={pose} position={OT} />
      <mesh position={[0, 1.44, desk]} geometry={chamferBox(4.6, 0.12, 1.6)} castShadow receiveShadow>
        <Flat color="#C9C2B4" />
      </mesh>
      <mesh position={[0, 0.72, desk + 0.7]}>
        <BoxG args={[4.4, 1.4, 0.1]} />
        <Flat color="#8E96A6" />
      </mesh>
      <PaperStack position={[-1.55, 1.5, desk]} h={1.2} seed="ot1" />
      <PaperStack position={[1.55, 1.5, desk + 0.1]} h={0.9} seed="ot2" />
      <PaperStack position={[1.6, 2.42, desk + 0.05]} h={0.5} seed="ot3" />
      <pointLight position={[0, 4.4, desk + 0.4]} color="#FFE0A8" intensity={16} distance={9} decay={1.6} />
      <WallClock position={[-21.8, 6.4, -6]} r={1.2} hours={19.5 + c.lt * 0.3} yaw={Math.PI / 2} />
    </Shot>
  );
};

/** A clinic waiting room: the appointments board flips to DELAYED / RESCHEDULED. */
const c3Appointments: ShotFn = (c) => {
  const cam = move({ position: [2.5, 4.4, 18.5], target: [0, 4.8, 0] }, { position: [2.2, 4.4, 17], target: [0, 4.9, 0] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={false} stars={false} shadowSize={14} light={0.95}>
      <mesh position={[0, 6, -0.3]} receiveShadow>
        <BoxG args={[30, 12, 0.4]} />
        <Flat color="#B8C8C8" />
      </mesh>
      <mesh position={[0, -0.05, 6]} receiveShadow>
        <BoxG args={[30, 0.1, 14]} />
        <Flat color="#8A9AA6" />
      </mesh>
      <mesh position={[0, 6.2, -0.05]}>
        <BoxG args={[7.4, 4.4, 0.2]} />
        <Flat color="#17181E" />
      </mesh>
      <CanvasPanel position={[0, 6.2, 0.07]} w={7.0} h={4.0} px={800} draw={drawAppointments(k01(c.lt, 0.15, 1.1))} />
      {[-4, -1.5, 1.5, 4].map((x, i) => (
        <OfficeChair key={x} position={[x, 0, 3.2]} yaw={0} color="#2E5A6A" />
      ))}
      <Hero pose={sittingPose({ expression: "worried", headPitch: 0.35 })} position={[-1.5, 0, 3.2]} yaw={Math.PI} look={crowdLook(51)} />
      <Hero pose={sittingPose({ expression: "neutral", headPitch: 0.3, headYaw: 0.3 })} position={[4, 0, 3.2]} yaw={Math.PI} look={crowdLook(52)} />
    </Shot>
  );
};

/** A building site in the drizzle: crane idle, PROJECT POSTPONED on the fence. */
const c3Site: ShotFn = (c) => {
  const cam = move({ position: [14, 7, 62], target: [0, 9, -4] }, { position: [12, 6.8, 57], target: [0, 9.4, -4] }, c);
  return (
    <Shot mood="overcast" camera={cam} fog={[50, 260]} shadowSize={50} light={0.85}>
      <Ground color="#5A5048" />
      <HillRing color="#4A5A50" radius={240} />
      <group position={[-4, 0, -18]} scale={0.8}>
        <SkyscraperSite />
      </group>
      <Crane position={[14, 0, -20]} height={64} jib={30} load={10} swing={0.4} />
      {[-14, -7, 0, 7, 14].map((x) => (
        <mesh key={x} position={[x, 2.2, 8]} castShadow>
          <BoxG args={[6.8, 4.4, 0.2]} />
          <Flat color="#C9CED8" />
        </mesh>
      ))}
      <CanvasPanel position={[0, 2.6, 8.15]} w={12} h={2.6} px={900} draw={drawLabel("PROJECT POSTPONED", "#C8372D", "#FFFFFF", 0.6)} />
      <Clouds t={c.t} color={GREY} y={52} radius={170} count={20} seed="site" />
      <Drizzle t={c.t} at={[16, 14, 30]} size={[40, 30, 40]} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 the winners (stormy dusk)

const GAMES_SIGN = drawSign("GAMES", "#14081E", NEON_PINK, "LAUNCH DAY · OPEN LATE");
const c4Store: ShotFn = (c) => {
  const cam = move({ position: [-12, 4.2, 38], target: [0, 5.4, 0] }, { position: [-10.5, 4.1, 35], target: [0, 5.5, 0] }, c);
  return (
    <Shot mood="storm" camera={cam} fog={[30, 200]} shadowSize={30} light={0.7}>
      <ShopRow t={c.t} night main={<ShopFront position={[0, 0, 0]} w={14} color="#2A1A3A" awning={[NEON_PINK, "#14081E"]} sign={GAMES_SIGN} window={drawGameArt(c.t)} glow="#FFB0E0" neon={NEON_PINK} />} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <UmbrellaWalker key={i} position={[-5 + i * 0.3, 0, 3.2 + i * 2.6]} yaw={Math.PI - 0.05} seed={60 + i} />
      ))}
      {/* a happy customer leaving with a box */}
      <UmbrellaWalker position={[6 + c.lt * 1.2, 0, 4]} yaw={Math.PI / 2} walk={c.lt * 1.5} seed={70} />
      <GameBox position={[6 + c.lt * 1.2 + 0.2, 1.6, 4 - 1.0]} rotation={[0, Math.PI / 2, 0]} scale={0.8} />
      <Drizzle t={c.t} at={[-2, 12, 18]} size={[30, 26, 22]} count={700} />
    </Shot>
  );
};

/** A streamer live with the game: ring light, headset, chat flying, viewers climbing. */
const STREAMER: V3 = [-0.6, 0, 2.2];
const c4Streamer: ShotFn = (c) => {
  const cam = move({ position: [5.4, 4.2, 5.6], target: [-0.7, 2.9, 0.6] }, { position: [4.9, 4.1, 5.0], target: [-0.7, 2.95, 0.6] }, c);
  const viewers = Math.round(48210 + c.lt * 9137);
  const pose = sittingPose({ lean: 0.25, expression: "smile", headYaw: 0.5 + Math.sin(c.t * 2) * 0.08, lShoulder: [0.95, -0.1], rShoulder: [0.95, -0.1], lElbow: 0.6, rElbow: 0.6 });
  const head = headPosition(pose, STREAMER, Math.PI);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={10} light={0.45}>
      <mesh position={[0, -0.05, 2]} receiveShadow>
        <BoxG args={[16, 0.1, 12]} />
        <Flat color="#241E30" />
      </mesh>
      <mesh position={[0, 5, -1.8]} receiveShadow>
        <BoxG args={[16, 10, 0.3]} />
        <Flat color="#2A2340" />
      </mesh>
      {/* acoustic foam squares */}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[-5 + (i % 6) * 2, 5.4 + Math.floor(i / 6) * 1.6, -1.6]}>
          <BoxG args={[1.3, 1.3, 0.2]} />
          <Flat color={i % 2 ? "#3A2E52" : "#33294A"} />
        </mesh>
      ))}
      <StreamerDesk t={c.t} viewers={viewers} />
      <OfficeChair position={STREAMER} yaw={0} color="#C8372D" />
      <Hero pose={pose} position={STREAMER} yaw={Math.PI} look={crowdLook(88)} />
      <Headset head={head} yaw={Math.PI} />
    </Shot>
  );
};

/** Ka-ching: the till prints a long receipt, coins pour in. */
const TILL: V3 = [0, 3.0, 0];
const c4Till: ShotFn = (c) => {
  const cam = move({ position: add(TILL, [2.8, 2.2, 8.2]), target: add(TILL, [-0.4, 1.0, 0]) }, { position: add(TILL, [2.4, 2.1, 7.4]), target: add(TILL, [-0.4, 1.05, 0]) }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={10} light={0.7}>
      <mesh position={[0, 1.5, 0]} geometry={chamferBox(10, 3.0, 2.6)} castShadow receiveShadow>
        <Flat color="#2A1A3A" />
      </mesh>
      <mesh position={[0, -0.05, 2]} receiveShadow>
        <BoxG args={[20, 0.1, 14]} />
        <Flat color="#3A3048" />
      </mesh>
      <mesh position={[0, 6, -4]}>
        <BoxG args={[20, 12, 0.3]} />
        <Flat color="#2A2340" />
      </mesh>
      {/* shelves of (our own) game boxes */}
      {Array.from({ length: 18 }, (_, i) => (
        <GameBox key={i} position={[-6 + (i % 9) * 1.5, 5 + Math.floor(i / 9) * 1.8, -3.7]} scale={1.1} />
      ))}
      <CashRegister position={TILL} yaw={0.2} receipt={k01(c.lt, 0.1, 2.0)} total="THANK YOU" />
      <CoinFlow from={add(TILL, [3.5, 3.5, 3])} to={add(TILL, [0, 1.0, 0])} t={c.t} count={22} arc={1.2} spread={0.3} size={0.22} speed={0.9} seed="till" />
      <CoinPile position={add(TILL, [-2.6, 0, 0.3])} r={0.6} h={0.4} />
      <Hero pose={mergePose(REST, { expression: "smile", lShoulder: [0.4, 0.2], lElbow: 0.8 })} position={[-1.8, 0, -1.6]} look={crowdLook(91)} />
      <pointLight position={[0, 6, 3]} color="#FFB0E0" intensity={30} distance={18} decay={1.6} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 05 the catch (evening)

/** He pauses the game and thinks (fist to chin). */
const c5Think: ShotFn = (c) => {
  const base = sittingPose({ lean: 0.05, expression: "neutral", headYaw: 0.25, headPitch: 0.1 });
  const head = headPosition(base, SEAT, SEAT_YAW);
  const chin: V3 = [head[0] - 0.05, head[1] - 0.7, head[2] - 0.55];
  const pose = reach(base, "r", chin, { position: SEAT, yaw: SEAT_YAW }).pose;
  return <RoomShot cam={lerpCam(FACE, FACE_CLOSE, c.lt / 3)} hours={roomHours(18.5)} pose={pose} controller={null} cans={2} />;
};

/** The balance: a day off on one pan, the work on the other — it comes level. */
const c5Balance: ShotFn = (c) => {
  const cam = move({ position: [20, 10, 27], target: [0, 7.5, 0] }, { position: [18, 9.6, 24.5], target: [0, 7.6, 0] }, c);
  const tilt = 0.28 * (1 - k01(c.lt, 0.3, 1.4));
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={14} light={0.85}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[30, 0.1, 20]} />
        <Flat color="#232A40" />
      </mesh>
      <Balance
        tilt={tilt}
        left={
          <group scale={2.6}>
            <Controller position={[0, 0.12, 0]} yaw={0.6} pitch={0} />
          </group>
        }
        right={
          <group scale={2.2}>
            <PaperStack position={[0, 0, 0]} h={0.9} seed="bal" />
          </group>
        }
      />
      <pointLight position={[0, 14, 8]} color="#FFE8C0" intensity={50} distance={40} decay={1.6} />
    </Shot>
  );
};

/** NOV 20: back at the desk, typing like mad to catch up (the office full again). */
const LATER: V3 = [6, 0, -4.55];
const c5Later: ShotFn = (c) => {
  const cam = move({ position: add(LATER, [4.4, 3.5, -2.1]), target: add(LATER, [-0.3, 2.7, -0.5]) }, { position: add(LATER, [4.0, 3.45, -1.9]), target: add(LATER, [-0.3, 2.75, -0.5]) }, c);
  const type = Math.sin(c.t * 18) * 0.1;
  const pose = seatedWorker({ expression: "smile", lShoulder: [0.95 + type, -0.1], rShoulder: [0.95 - type, -0.1], headPitch: -0.1 });
  return (
    <Shot mood="day" camera={cam} fog={false} stars={false} shadowSize={20} light={1.0} keyDir={[-0.4, 0.5, 0.8]} overlay={<CardLine text="FRIDAY, NOV 20" y={330} appearFrame={startFrame(c) + 2} />}>
      <OpenOffice t={c.t} seats={(r, col) => !(r === 1 && col === 3) && random(`full${r}${col}`) < 0.8} />
      <Hero pose={pose} position={LATER} yaw={Math.PI} />
    </Shot>
  );
};

/** Back at the game store till: Slavoski pays, and the money moves on. */
const c5Spend: ShotFn = (c) => {
  const cam = move({ position: [10, 4.4, 6.5], target: [0.8, 3.0, 1.4] }, { position: [9, 4.3, 6.0], target: [0.8, 3.05, 1.4] }, c);
  const hero: V3 = [2.2, 0, 3.6];
  const pose = reach(mergePose(REST, { expression: "smile", headPitch: -0.2 }), "r", [1.2, 4.3, 2.6], { position: hero, yaw: -2.6 }).pose;
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={10} light={0.7}>
      <mesh position={[0, 1.5, 0]} geometry={chamferBox(10, 3.0, 2.6)} castShadow receiveShadow>
        <Flat color="#2A1A3A" />
      </mesh>
      <mesh position={[0, -0.05, 2]} receiveShadow>
        <BoxG args={[20, 0.1, 14]} />
        <Flat color="#3A3048" />
      </mesh>
      <mesh position={[0, 6, -4]}>
        <BoxG args={[20, 12, 0.3]} />
        <Flat color="#2A2340" />
      </mesh>
      {Array.from({ length: 18 }, (_, i) => (
        <GameBox key={i} position={[-6 + (i % 9) * 1.5, 5 + Math.floor(i / 9) * 1.8, -3.7]} scale={1.1} />
      ))}
      <CashRegister position={TILL} yaw={0.2} receipt={0.4} total="THANK YOU" />
      <CoinFlow from={handPosition(pose, "r", hero, -2.6)} to={add(TILL, [0, 1.0, 0])} t={c.t} count={14} arc={0.8} spread={0.2} size={0.2} speed={1.0} seed="spend" />
      <Hero pose={pose} position={hero} yaw={-2.6} />
      <Hero pose={mergePose(REST, { expression: "smile" })} position={[-1.8, 0, -1.6]} look={crowdLook(91)} />
      <pointLight position={[0, 6, 3]} color="#FFB0E0" intensity={30} distance={18} decay={1.6} />
    </Shot>
  );
};

/** The money goes round: home → game store → the shop's staff and suppliers → home again. */
const LOOP: V3[] = [
  [-9, 3, 5],
  [9, 3, 5],
  [0, 3, -9],
];
const c5Loop: ShotFn = (c) => {
  const cam = move({ position: [0, 46, 50], target: [0, 1, -1] }, { position: [7, 44, 48], target: [0, 1, -1] }, c);
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} shadowSize={30} light={0.85}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <CylG args={[18, 18, 0.1]} />
        <Flat color="#2F5A4A" />
      </mesh>
      <House position={[-9, 0, 5]} scale={0.9} roof="#C8372D" />
      <ShopFront position={[9, 0, 4.5]} yaw={-0.6} w={8} color="#2A1A3A" awning={[NEON_PINK, "#14081E"]} sign={GAMES_SIGN} glow="#FFB0E0" />
      <mesh position={[0, 7, -9]} castShadow>
        <BoxG args={[7, 14, 7]} />
        <Flat color={P.bldgSlate} />
      </mesh>
      {LOOP.map((a, i) => (
        <CoinFlow key={i} from={a} to={LOOP[(i + 1) % LOOP.length]} t={c.t} count={14} arc={4} spread={0.6} size={0.5} speed={0.55} seed={`loop${i}`} />
      ))}
    </Shot>
  );
};

// ---------------------------------------------------------------- 06 one game (rainy night)

/** A rainy night street: traffic flowing, umbrellas, shops lit — nothing has stopped. */
const c6Traffic: ShotFn = (c) => {
  const cam = move({ position: [16, 4.2, 34], target: [4, 5, -10] }, { position: [15, 4.1, 31], target: [4, 5.2, -10] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[40, 260]} shadowSize={30} light={0.7}>
      <BigStreet seed="night9" lampsOn cars={false} />
      {[
        [1.7, -40, 9, P.carRed],
        [1.7, -8, 9, "#E8E4DA"],
        [-1.7, 20, -8, P.carTeal],
        [-1.7, -14, -8, "#5A4A78"],
      ].map(([lane, z0, sp, col], i) => (
        <group key={i} scale={CITY}>
          <Car position={[lane as number, 0, (z0 as number) + (sp as number) * c.lt]} yaw={(sp as number) > 0 ? 0 : Math.PI} color={col as string} lights />
        </group>
      ))}
      {[0, 1, 2].map((i) => (
        <UmbrellaWalker key={i} position={[16 + (i % 2) * 2.5, 0, 10 - i * 7 + c.lt * (i % 2 ? 1.6 : -1.6)]} yaw={i % 2 ? 0 : Math.PI} walk={c.lt * 1.5 + i} seed={100 + i} />
      ))}
      <Drizzle t={c.t} at={[12, 12, 20]} size={[30, 26, 26]} count={800} opacity={0.5} />
    </Shot>
  );
};

/** Green light, the traffic keeps rolling past. */
const c6Light: ShotFn = (c) => {
  const cam = move({ position: [19, 7.5, 22], target: [15, 9.3, 12] }, { position: [18.6, 7.6, 21], target: [15, 9.4, 12] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[40, 220]} shadowSize={20} light={0.7}>
      <BigStreet seed="night9" lampsOn cars={false} />
      <TrafficLight position={[15, 0, 12]} yaw={0.38} state={2} />
      <group scale={CITY}>
        <Car position={[-1.7, 0, 30 - c.lt * 30]} yaw={Math.PI} color={P.carRed} lights />
        <Car position={[1.7, 0, -20 + c.lt * 26]} yaw={0} color="#E8E4DA" lights />
      </group>
      <Drizzle t={c.t} at={[16, 10, 18]} size={[16, 16, 14]} count={500} opacity={0.5} />
    </Shot>
  );
};

/** The night skyline, window after window glowing with the game. */
const c6Skyline: ShotFn = (c) => {
  const cam = move({ position: [150, 46, 175], target: [0, 26, 0] }, { position: [140, 44, 164], target: [0, 27, 0] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[170, 480]} shadowSize={100} light={0.6}>
      <Ground color="#1A1E2C" />
      <ScreenCity t={c.t} games={0.55} lit={0.2} seed="night" />
      <Drizzle t={c.t} at={[125, 40, 145]} size={[50, 40, 50]} count={800} opacity={0.35} />
    </Shot>
  );
};

/** From his window out: Slavoski on the couch in the TV glow, then the whole facade of glowing windows. */
const FACADE_Z = 7.2;
const Facade: React.FC<{ t: number }> = ({ t }) => {
  const winX = [-13.6, -6.8, 0, 6.8, 13.6];
  const floors = [-6.2, 0, 6.2, 12.4, 18.6];
  return (
    <group>
      {floors.flatMap((fy) =>
        winX.map((wx) => {
          const mine = fy === 0 && wx === 0;
          const r = random(`fac${fx(fy)}${wx}`);
          const col = r < 0.6 ? [NEON_PINK, NEON_TEAL, "#6F8CFF"][Math.floor(r * 5) % 3] : P.windowLit;
          const flick = 0.75 + 0.25 * Math.sin(t * (3 + r * 4) + r * 9);
          return (
            <group key={`${fy}${wx}`} position={[wx, fy + 2.8, FACADE_Z]}>
              {/* wall pieces around a 5 × 3.6 window */}
              <mesh position={[0, 2.4, 0]}>
                <BoxG args={[6.8, 1.2, 0.4]} />
                <Flat color="#3A3550" />
              </mesh>
              <mesh position={[0, -2.4, 0]}>
                <BoxG args={[6.8, 1.2, 0.4]} />
                <Flat color="#3A3550" />
              </mesh>
              {[-3.0, 3.0].map((x) => (
                <mesh key={x} position={[x, 0, 0]}>
                  <BoxG args={[0.8, 3.6, 0.4]} />
                  <Flat color="#3A3550" />
                </mesh>
              ))}
              {mine ? null : (
                <mesh position={[0, 0, -0.1]}>
                  <planeGeometry args={[5.2, 3.6]} />
                  <Glow color={dim(col, flick)} />
                </mesh>
              )}
            </group>
          );
        }),
      )}
    </group>
  );
};
const fx = (y: number) => Math.round(y * 10);
/** Scale a hex colour's brightness. */
const dim = (c: string, k: number) => {
  const n = parseInt(c.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};
const c6Window: ShotFn = (c) => {
  const k = k01(c.lt, 0.2, span(c.dur));
  const cam: CameraSpec = lerpCam({ position: [1.0, 3.2, 11], target: [0.8, 2.6, -2] }, { position: [4, 8, 52], target: [0.5, 7, 0] }, k);
  return (
    <RoomShot cam={cam} hours={roomHours(21.5)} pose={sittingPose({ lean: 0.32, expression: "smile" })} feed={driveFeed(c.lt + 3, true)} cans={3} pizza>
      <Facade t={c.t} />
      <Drizzle t={c.t} at={[1, 4, 16]} size={[24, 20, 14]} count={600} opacity={0.45} />
    </RoomShot>
  );
};

/** The whole planet at night, its cities lit, a soft pink pulse of a billion screens. */
const c6Earth: ShotFn = (c) => {
  const cam = move({ position: [0, 3, 22], target: [0, -0.4, 0] }, { position: [2, 3, 19], target: [0, -0.4, 0] }, c);
  const pulse = 0.5 + 0.5 * Math.sin(c.t * 3);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.35} keyDir={[-1, 0.2, -0.6]}>
      <FacetedEarth radius={3.4} rotation={[0.4, 2.4 + c.t * 0.05, 0]} cityLights={1} />
      <Halo size={13} color={NEON_PINK} opacity={0.12 + pulse * 0.1} />
      <Halo size={9} color={NEON_TEAL} opacity={0.06 + (1 - pulse) * 0.06} />
    </Shot>
  );
};

/** Late night on the couch: a glance and a grin at us, then back to the game. */
const c6End: ShotFn = (c) => {
  const look = k01(c.lt, 0.3, 0.7) * (1 - k01(c.lt, 1.8, 2.2));
  return (
    <RoomShot cam={lerpCam(FACE, FACE_CLOSE, c.lt / 4)} hours={roomHours(23.6)} pose={sittingPose({ lean: 0.3 - look * 0.2, expression: "smile", headYaw: 0.55 * look })} cans={4} pizza />
  );
};

// ---------------------------------------------------------------- thumbnail

/** Shorts cover: Slavoski on the couch, controller up, game on the TV, a "SICK" note stuck to it. */
export const thumbShot: ShotFn = () => <RoomShot cam={{ position: [1.0, 6.4, 8.2], target: [0.8, 2.0, -1.5] }} hours={roomHours(9)} pose={sittingPose({ lean: 0.3, expression: "smile" })} feed={driveFeed(1.2, false)} cans={2} />;

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldClock },
    { cue: "twenty", fn: coldWake },
    { cue: "GTA", fn: coldTV },
    { cue: "But what if", fn: coldCough },
    { cue: "stay home", fn: coldCity },
  ],
  c1: [
    { cue: null, fn: c1Office },
    { cue: "managers", fn: c1Manager },
    { cue: "and some", fn: c1Cafe },
    { cue: "cover their", fn: c1Rota },
  ],
  c2: [
    { cue: null, fn: c2Look },
    { cue: "A real survey", fn: c2Survey },
    { cue: "eighteen", fn: c2Pawns },
    { cue: "plan to take", fn: c2Stamp },
    { cue: "and leave requests", fn: c2Bars },
    { cue: "thirteen", fn: c2Inbox },
  ],
  c3: [
    { cue: null, fn: c3City },
    { cue: "Millions", fn: c3Clock },
    { cue: "Businesses", fn: c3Overtime },
    { cue: "delay", fn: c3Appointments },
    { cue: "postpone", fn: c3Site },
  ],
  c4: [
    { cue: null, fn: c4Store },
    { cue: "streamers", fn: c4Streamer },
    { cue: "could benefit", fn: c4Till },
  ],
  c5: [
    { cue: null, fn: c5Think },
    { cue: "lost economic", fn: c5Balance },
    { cue: "Some work", fn: c5Later },
    { cue: "and the money", fn: c5Spend },
    { cue: "circulates", fn: c5Loop },
  ],
  c6: [
    { cue: null, fn: c6Traffic },
    { cue: "to a standstill", fn: c6Light },
    { cue: "But November", fn: c6Skyline },
    { cue: "could reveal", fn: c6Window },
    { cue: "just how much", fn: c6Earth },
    { cue: "video game", fn: c6End },
  ],
};
