/**
 * Shots for "What If Work Ended in 2036?" (ep. 6). Generic world: no real companies, logos or people.
 * Each shot is a cue phrase (or null = the chapter start) plus a function of local time `lt`.
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { StreetSet, streetLayout } from "../../slavoski/city";
import { Quadruped } from "../../slavoski/critters";
import { BoxG, ConeG, IcoG } from "../../slavoski/detail";
import { crowdLook } from "../../slavoski/hero";
import { Flat, Glow } from "../../slavoski/materials";
import { LeafyTree } from "../../slavoski/nature";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { CardLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import { Hero, mergePose, reach, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { CanvasPanel, fitText, ScreenHtml } from "../../slavoski/screens";
import { FacetedEarth } from "../../slavoski/space";
import { lerpCam, Stage, type CameraSpec } from "../../slavoski/Stage";
import { type CuedShot } from "../../slavoski/timeline";
import { BED, Bedroom, Chair, WIN } from "../smart-animals/props";
import { PalmTree } from "../gta-24h/props";
import { CITY, CLOCK, PHONE, Phone3D } from "../ww3-countdown/props";
import { Drones, FutureCity, FutureSkyline, MegaTower } from "./future";
import {
  AiCore,
  Balance,
  Beach,
  BENCH,
  Blanket,
  Clinic,
  ClosedFactory,
  CoinFlow,
  CoinPile,
  Crane,
  DESK,
  Factory,
  HillRing,
  House,
  LockScreen,
  Office,
  PayScreen,
  QueueScreen,
  Robot,
  robotHand,
  ScanHoop,
  ScanReadout,
  SkyscraperSite,
  slabTop,
  Stall,
  Suitcase,
  Truck,
  type RobotProps,
} from "./props";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- helpers

const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 2.5, 4);
const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
/** The frame a shot started on (for HTML overlays that animate from an absolute frame). */
const startFrame = (c: ShotCtx) => Math.round((c.t - c.lt) * 30);

/** StreetSet ×3.5 so floors, cars and lamps match Slavoski (road |x| < 12.25, pavements to 21.35). */
const BigStreet: React.FC<React.ComponentProps<typeof StreetSet> & { t?: number; future?: "bright" | "corp" | false }> = ({ t = 0, future = "bright", ...props }) => (
  <>
    <group scale={CITY}>
      <StreetSet {...props} />
      {future ? <StreetFuture seed={props.seed ?? "street"} style={future} /> : null}
    </group>
    {future ? (
      <>
        <FutureSkyline radius={240} count={26} seed={`${props.seed ?? "st"}sky`} arc={[Math.PI * 0.72, Math.PI * 1.28]} style={future} t={t} scale={1.25} />
        <group position={[0, 0, -60]}>
          <Drones count={12} t={t} style={future} radius={16} y={[24, 42]} seed={`${props.seed ?? "st"}dr`} />
        </group>
      </>
    ) : null}
  </>
);

/**
 * 2036 touches on a kit street (kit units, inside the ×3.5 group): neon blade signs on the facades and one
 * glass sky bridge between two buildings that face each other (its height below the lower roof).
 */
const BLADES = ["#7FE8FF", "#FF6FB0", "#FFBA58", "#B58CFF"];
const StreetFuture: React.FC<{ seed: string; style: "bright" | "corp" }> = ({ seed, style }) => {
  const specs = streetLayout(seed);
  const face = 3.5 + 2.6;
  const left = specs.filter((b) => b.position[0] < 0);
  const right = specs.filter((b) => b.position[0] > 0);
  let bridge: { z: number; y: number } | null = null;
  for (const a of left) {
    if (a.position[2] > -6 || a.position[2] < -34) continue;
    const b = right.find((r) => Math.abs(r.position[2] - a.position[2]) < Math.min(a.d ?? 3, r.d ?? 3) / 2 - 0.6);
    if (b) {
      bridge = { z: (a.position[2] + b.position[2]) / 2, y: Math.min(a.h ?? 6, b.h ?? 6) * 0.62 };
      break;
    }
  }
  return (
    <group>
      {specs
        .filter((b, i) => i % 3 === 1 && b.position[2] > -60)
        .map((b, i) => {
          const sx = b.position[0] > 0 ? 1 : -1;
          const color = style === "corp" ? (i % 2 ? "#E8344A" : "#FF5A6A") : BLADES[i % BLADES.length];
          return (
            <group key={b.key} position={[sx * (face - 0.28), 3.6 + random(`${b.key}by`) * 1.5, b.position[2]]}>
              <mesh>
                <BoxG args={[0.5, 2.4, 0.16]} />
                <Flat color="#15161C" />
              </mesh>
              {[-1, 1].map((s2) => (
                <mesh key={s2} position={[0, 0, s2 * 0.085]} rotation={[0, s2 > 0 ? 0 : Math.PI, 0]}>
                  <planeGeometry args={[0.36, 2.2]} />
                  <Glow color={color} />
                </mesh>
              ))}
            </group>
          );
        })}
      {bridge ? (
        <group position={[0, bridge.y, bridge.z]}>
          <mesh castShadow>
            <BoxG args={[face * 2, 0.7, 1.4]} />
            <Flat color={style === "corp" ? "#2A2F48" : "#C9D2DE"} opacity={0.95} />
          </mesh>
          <mesh position={[0, 0.05, 0.71]}>
            <planeGeometry args={[face * 2 - 0.4, 0.3]} />
            <Glow color={style === "corp" ? "#E8344A" : "#7FE8FF"} />
          </mesh>
          <mesh position={[0, -0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[face * 2 - 0.4, 0.4]} />
            <Glow color={style === "corp" ? "#E8344A" : "#7FE8FF"} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

const Shot: React.FC<{ children: React.ReactNode; overlay?: React.ReactNode } & React.ComponentProps<typeof Stage>> = ({ children, overlay, ...stage }) => (
  <AbsoluteFill>
    <Stage {...stage}>{children}</Stage>
    {overlay}
  </AbsoluteFill>
);

/** A robot carrying a box in both hands (the box sits between the fists). */
const CarryBot: React.FC<RobotProps & { box?: number; color?: string }> = ({ box = 1.1, color = "#B89060", ...r }) => {
  const props: RobotProps = { ...r, l: [1.25, 0.05, 0.35], r: [1.25, 0.05, 0.35] };
  const a = robotHand("l", props);
  const b = robotHand("r", props);
  const mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.05, (a[2] + b[2]) / 2];
  const gap = Math.hypot(a[0] - b[0], a[2] - b[2]) - 0.3;
  return (
    <>
      <Robot {...props} />
      <mesh position={mid} rotation={[0, r.yaw ?? 0, 0]} castShadow>
        <BoxG args={[gap, box * 0.8, box]} />
        <Flat color={color} />
      </mesh>
    </>
  );
};

// ---------------------------------------------------------------- bedroom helpers (ep. 4/5 bed rig)

const BED_HERO: V3 = [BED.x, BED.mattressTop - (1.55 + 0.02 - 0.18), -2.55];
const bedPose = (over: Partial<Pose> = {}): Pose =>
  mergePose(REST, { lHip: [1.47, 0.06], rHip: [1.47, 0.06], lKnee: 0.04, rKnee: 0.04, lShoulder: [0.25, 0.25], rShoulder: [0.25, 0.25], lElbow: 0.5, rElbow: 0.5, ...over });
const PHONE_BED: V3 = [BED.x + 0.35, BED.blanketTop + PHONE.d / 2, -0.2];

/** A big phone close-up in front of any backdrop, its screen an HTML overlay pinned to the 3D phone. */
const PhoneCU: React.FC<{
  c: ShotCtx;
  at: V3;
  glow: string;
  screen: (w: number, h: number) => React.ReactNode;
  shake?: number;
  children: React.ReactNode;
  stage?: Partial<React.ComponentProps<typeof Stage>>;
}> = ({ c, at, glow, screen, shake = 0, children, stage }) => {
  const P0 = at;
  const cam = move({ position: [P0[0] + 0.05, P0[1], P0[2] + 2.1], target: [P0[0], P0[1] - 0.02, P0[2]] }, { position: [P0[0] + 0.03, P0[1], P0[2] + 1.75], target: [P0[0], P0[1], P0[2]] }, c);
  const jitter = shake ? Math.sin(c.t * 80) * 0.012 * shake : 0;
  const pos: V3 = [P0[0] + jitter, P0[1], P0[2]];
  return (
    <Shot
      mood="night"
      camera={cam}
      fog={false}
      stars={false}
      shadowSize={10}
      {...stage}
      overlay={
        <ScreenHtml c={[pos[0], pos[1], pos[2] + PHONE.d / 2 + 0.003]} w={PHONE.screenW} h={PHONE.screenH} cam={cam} width={c.width} height={c.height}>
          {screen}
        </ScreenHtml>
      }
    >
      {children}
      <Phone3D position={pos} glow={glow} />
      <mesh position={[pos[0] + 0.04, pos[1] - PHONE.h / 2 - 0.06, pos[2] + 0.02]} scale={[1.1, 0.8, 0.9]}>
        <IcoG args={[0.22, 2]} />
        <Flat color="#D9A27A" />
      </mesh>
      <pointLight position={[pos[0], pos[1], pos[2] + 1]} color={glow} intensity={4} distance={4} decay={2} />
    </Shot>
  );
};

// ---------------------------------------------------------------- cold open

const coldEarth: ShotFn = (c) => {
  const cam = move({ position: [0, 0.3, 18], target: [0, -0.9, 0] }, { position: [0, 0.2, 16.4], target: [0, -1.0, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.6}>
      <group position={[0, -2.6, 0]}>
        <FacetedEarth radius={3} rotation={[0.35, 1.6 + c.t * 0.06, 0]} cityLights={0.8} />
      </group>
    </Shot>
  );
};

/** Morning rush hour: commuters (and a tired Slavoski) on the pavement. */
const coldCommute: ShotFn = (c) => {
  const cam = move({ position: [17.2, 5.6, 26], target: [17.2, 3.4, 0] }, { position: [17.0, 5.4, 23.5], target: [17.0, 3.4, 0] }, c);
  const walker = (seed: number, x: number, z0: number) => (
    <Hero key={seed} pose={mergePose(walkPose(c.lt * 1.6 + seed * 0.37, 0.95), { expression: "neutral" })} position={[x, 0, z0 + c.lt * 2.0]} look={crowdLook(seed)} />
  );
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 260]} shadowSize={40} light={0.9}>
      <BigStreet seed="commute" t={c.t} />
      {walker(5, 15.4, 1)}
      {walker(9, 19.8, 3.5)}
      {walker(12, 15.6, -6)}
      {walker(21, 19.6, -7)}
      {walker(33, 17.4, -13)}
      <Hero pose={mergePose(walkPose(c.lt * 1.4 + 0.2, 0.8), { expression: "worried", blink: 0.45, headPitch: -0.15 })} position={[17.5, 0, 6 + c.lt * 1.75]} />
    </Shot>
  );
};

/** At the desk under the "9 TO 5" sign, which gets crossed out. */
const OFFICE_HERO: V3 = [0, 0, -0.45];
const deskBase = (() => {
  const p = mergePose(REST, { lHip: [1.5, 0.08], rHip: [1.5, 0.08], lKnee: 1.45, rKnee: 1.45 });
  return p;
})();
const DESK_POSE = (() => {
  // Rest both fists on the desk top (fist radius 0.22), each side of the papers and the monitor.
  const top = DESK.top + 0.22;
  let p = reach(deskBase, "l", [0.55, top, 1.0], { position: OFFICE_HERO }).pose;
  p = reach(p, "r", [-0.55, top, 1.0], { position: OFFICE_HERO }).pose;
  return p;
})();
const coldOffice: ShotFn = (c) => {
  const cam = move({ position: [0.9, 4.3, 11.5], target: [0, 4.0, -1] }, { position: [0.7, 4.3, 10.4], target: [0, 4.05, -1] }, c);
  const cross = k01(c.lt, 0.35, 1.0);
  const bob = -0.66;
  const pose: Pose = { ...DESK_POSE, bob, expression: cross > 0.9 ? "smile" : "neutral", headPitch: cross > 0.5 ? 0.35 : -0.1, blink: cross > 0.5 ? 0 : 0.35 };
  return (
    <Shot mood="night" camera={cam} fog={false} stars={false} light={1.0} shadowSize={12}>
      <Office cross={cross} t={c.t} />
      <Chair position={[OFFICE_HERO[0], 0, OFFICE_HERO[2]]} seatY={0.72} />
      <Hero pose={pose} position={OFFICE_HERO} />
    </Shot>
  );
};

/** The 06:00 alarm flashing, then a fist slams it off. */
const CLOCK_POS: V3 = [0.5, 1.1, -3.05];
const CLOCK_YAW = 0.5;
const coldAlarm: ShotFn = (c) => {
  const cam = move({ position: [2.4, 2.0, -0.2], target: [0.6, 1.5, -3.0] }, { position: [2.15, 1.95, -0.65], target: [0.6, 1.5, -3.0] }, c);
  const slam = k01(c.lt, 0.75, 0.95) * (1 - k01(c.lt, 1.35, 1.7));
  const off = c.lt > 0.95;
  const top = CLOCK_POS[1] + 0.5;
  const fist: V3 = [CLOCK_POS[0], top + 0.2 + (1 - slam) * 1.8, CLOCK_POS[2]];
  const face: V3 = [CLOCK_POS[0] + Math.sin(CLOCK_YAW) * 0.207, CLOCK_POS[1] + 0.25, CLOCK_POS[2] + Math.cos(CLOCK_YAW) * 0.207];
  const blink = Math.floor(c.lt * 4) % 2 === 0;
  return (
    <Shot mood="dawn" camera={cam} fog={false} stars={false} light={0.55} shadowSize={8} shake={c.lt > 0.92 && c.lt < 1.1 ? 0.03 : 0}>
      <Bedroom lampOn={false} dawn />
      {/* the bedside clock (ep. 5's AlarmClock body, with a dimmer red glow that dies when it's switched off) */}
      <group position={CLOCK_POS} rotation={[0, CLOCK_YAW, 0]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <BoxG args={[1.0, 0.5, 0.4]} />
          <Flat color="#15161C" />
        </mesh>
      </group>
      {!off ? <pointLight position={[face[0] + 0.3, face[1] + 0.05, face[2] + 0.5]} color="#FF3030" intensity={1.2} distance={2.5} decay={2} /> : null}
      <CanvasPanel
        position={face}
        rotation={[0, CLOCK_YAW, 0]}
        w={CLOCK.w}
        h={CLOCK.h}
        px={512}
        draw={(ctx, w, h) => {
          ctx.fillStyle = "#140404";
          ctx.fillRect(0, 0, w, h);
          if (off) fitText(ctx, "OFF", w / 2, h / 2 + h * 0.04, w * 0.6, h * 0.5, "#5A2020");
          else if (blink) fitText(ctx, "06:00", w / 2, h / 2 + h * 0.04, w * 0.84, h * 0.66, "#FF3A2A");
        }}
      />
      {/* Slavoski's arm comes down from above the frame */}
      <mesh position={[fist[0] - 0.15, fist[1] + 1.1, fist[2] - 0.15]} rotation={[0.15, 0, 0.12]} castShadow>
        <BoxG args={[0.36, 1.9, 0.38]} />
        <Flat color={P.jacket} />
      </mesh>
      <mesh position={fist} castShadow>
        <IcoG args={[0.24, 2]} />
        <Flat color={P.skin} />
      </mesh>
    </Shot>
  );
};

/** A humanoid robot steps into the spotlight (the "Elon Musk predicts" line: no likeness, just the tech). */
const coldRobot: ShotFn = (c) => {
  const cam = move({ position: [1.2, 3.4, 13], target: [0, 3.3, 0] }, { position: [0.9, 3.3, 11.2], target: [0, 3.35, 0] }, c);
  const step = k01(c.lt, 0.1, 1.0);
  const wave = Math.sin(c.lt * 9) * 0.35;
  return (
    <Shot mood="night" camera={cam} fog={[30, 90]} stars={false} light={0.45} shadowSize={10} keyDir={[0.2, 1, 0.5]}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[60, 0.1, 60]} />
        <Flat color="#1A1F33" />
      </mesh>
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <CylinderStage />
        <Flat color="#3A4260" />
      </mesh>
      {/* back wall with faint vertical light bars */}
      <mesh position={[0, 10, -9]}>
        <BoxG args={[60, 20, 0.3]} />
        <Flat color="#121628" />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-16 + i * 4, 7, -8.8]}>
          <planeGeometry args={[0.3, 12]} />
          <Glow color={i % 2 ? "#2A4C7A" : "#3FA7B5"} opacity={0.8} />
        </mesh>
      ))}
      {/* spotlight cone */}
      <mesh position={[0, 9, 0.3]}>
        <ConeG args={[3.4, 18, 16, 1, true]} />
        <meshBasicMaterial color="#BFEFFF" transparent opacity={0.08} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 9, 2]} color="#E8F6FF" intensity={30} distance={16} decay={2} />
      <Robot position={[0, 0.3, -1.6 + step * 1.6]} walk={step < 1 ? c.lt * 1.2 : 0} walkAmount={1 - step * 0.9} r={[0.15, 2.45, 0.45 + wave]} headYaw={0.15} />
    </Shot>
  );
};

/** Round stage geometry (kept as a tiny component so the mesh above reads clearly). */
const CylinderStage: React.FC = () => <cylinderGeometry args={[4.2, 4.4, 0.3, 24]} />;

/** Robots doing the jobs while Slavoski stretches: "work optional". */
const coldOptional: ShotFn = (c) => {
  const cam = move({ position: [12.5, 5.0, 29], target: [16.6, 3.8, 2] }, { position: [12.9, 4.9, 27], target: [16.6, 3.8, 2] }, c);
  return (
    <Shot
      mood="dawn"
      camera={cam}
      fog={[60, 260]}
      shadowSize={40}
      overlay={<CardLine text="WORK: OPTIONAL" sub="PREDICTED WITHIN 10–20 YEARS" y={470} appearFrame={startFrame(c) + 8} />}
    >
      <BigStreet seed="optional" t={c.t} />
      <CarryBot position={[19.4, 0, -6 + c.lt * 1.9]} walk={c.lt * 1.3} walkAmount={0.8} />
      <CarryBot position={[14.6, 0, 4.5 - c.lt * 1.8]} yaw={Math.PI} walk={c.lt * 1.3 + 0.5} walkAmount={0.8} color="#A88052" />
      <Robot position={[8, 0, -14]} walk={c.lt * 1.2} yaw={0.5} />
      <Hero pose={mergePose(REST, { lShoulder: [0.2, 2.45], rShoulder: [0.2, 2.45], lElbow: 0.25, rElbow: 0.25, expression: "relief", headPitch: 0.15 })} position={[16.8, 0, 9]} yaw={-0.25} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 01 fully automated

const c1Welcome: ShotFn = (c) => {
  const cam = move({ position: [BED.x + 2.2, 4.8, 6.4], target: [BED.x - 0.4, 2.8, -2.0] }, { position: [BED.x + 1.9, 4.6, 5.6], target: [BED.x - 0.4, 2.8, -2.0] }, c);
  const up = k01(c.lt, 0.1, 0.7);
  const pose = bedPose({
    lShoulder: [0.25 - up * 0.05, 0.25 + up * 2.2],
    rShoulder: [0.25 - up * 0.05, 0.25 + up * 2.2],
    lElbow: 0.5 - up * 0.25,
    rElbow: 0.5 - up * 0.25,
    expression: up > 0.5 ? "relief" : "neutral",
    headPitch: up * 0.2,
  });
  return (
    <Shot mood="dawn" camera={cam} fog={false} stars={false} light={0.7} shadowSize={10}>
      <Bedroom lampOn={false} dawn />
      <Hero pose={pose} position={BED_HERO} />
      <Phone3D position={PHONE_BED} rotation={[-Math.PI / 2, 0, 0.4]} glow="#2A3550" />
    </Shot>
  );
};

const c1Buzz: ShotFn = (c) => {
  const cam = move({ position: [BED.x + 1.9, 3.7, 5.6], target: [BED.x + 0.2, 2.5, -1.4] }, { position: [BED.x + 1.7, 3.6, 4.9], target: [BED.x + 0.2, 2.5, -1.4] }, c);
  // A calm notification: the screen fades up and he glances down at it. No vibrating, no rings.
  const on = k01(c.lt, 0.05, 0.4);
  const look = k01(c.lt, 0.35, 0.8);
  const pose = bedPose({ headPitch: -0.1 - look * 0.35, headYaw: -0.2 * look, expression: "neutral" });
  return (
    <Shot mood="dawn" camera={cam} fog={false} stars={false} light={0.6} shadowSize={8}>
      <Bedroom lampOn={false} dawn />
      <Hero pose={pose} position={BED_HERO} />
      <Phone3D position={PHONE_BED} rotation={[-Math.PI / 2, 0, 0.4]} glow={on > 0.5 ? "#DCE6F5" : "#2A3550"} />
      <pointLight position={[PHONE_BED[0], PHONE_BED[1] + 0.6, PHONE_BED[2]]} color="#DCE6FF" intensity={3 * on} distance={3} decay={2} />
    </Shot>
  );
};

const c1Alert: ShotFn = (c) => (
  <PhoneCU c={c} at={[BED.x - 0.2, 3.0, 0.9]} glow="#3A3550" screen={(w, h) => <LockScreen w={w} h={h} k={k01(c.lt, 0.05, 0.45)} title="Employment update" body="Your job has been fully automated." />} stage={{ mood: "dawn", light: 0.5 }}>
    <Bedroom lampOn={false} dawn />
  </PhoneCU>
);

const c1Panic: ShotFn = (c) => {
  const cam = move({ position: [BED.x + 0.6, 3.6, 3.2], target: [BED.x, 3.1, -2.4] }, { position: [BED.x + 0.5, 3.55, 2.6], target: [BED.x, 3.15, -2.4] }, c);
  const pose = bedPose({ lShoulder: [0.9, 0.85], rShoulder: [0.9, 0.85], lElbow: 1.9, rElbow: 1.9, expression: "alarm", headPitch: 0.05, headRoll: Math.sin(c.lt * 18) * 0.06 });
  return (
    <Shot mood="dawn" camera={cam} fog={false} stars={false} light={0.6} shadowSize={8} shake={0.04}>
      <Bedroom lampOn={false} dawn />
      <Hero pose={pose} position={BED_HERO} />
    </Shot>
  );
};

/** Slavoski at the window; outside, a robot-built tower and a crane. */
const c1Window: ShotFn = (c) => {
  const hero: V3 = [WIN.x + 1.15, 0, WIN.z - 0.1];
  const cam = move({ position: [WIN.x - 5.2, 3.9, WIN.z + 0.9], target: [WIN.x + 1, 3.4, WIN.z - 0.1] }, { position: [WIN.x - 4.4, 3.85, WIN.z + 0.7], target: [WIN.x + 1, 3.45, WIN.z - 0.1] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[40, 260]} stars={false} light={0.75} shadowSize={10}>
      <Bedroom lampOn={false} dawn />
      <Hero pose={mergePose(REST, { expression: "awe", headPitch: 0.18, headYaw: 0.15 * Math.sin(c.lt * 2), lShoulder: [0.2, 0.2], rShoulder: [0.2, 0.2] })} position={hero} yaw={-Math.PI / 2 + 0.12} />
      {/* the morning light outside falls on his face */}
      <pointLight position={[WIN.x - 2.5, 4.2, WIN.z + 0.6]} color="#FFD2A8" intensity={14} distance={9} decay={2} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 02 the machines

const BEAM_A: RobotProps = { position: [-3.2, slabTop(3), -0.4], yaw: Math.PI / 2, l: [1.3, 0.1, 0.35], r: [1.3, 0.1, 0.35] };
const BEAM_B: RobotProps = { position: [3.2, slabTop(3), -0.4], yaw: -Math.PI / 2, l: [1.3, 0.1, 0.35], r: [1.3, 0.1, 0.35] };
const c2Build: ShotFn = (c) => {
  const cam = move({ position: [9.5, 31.5, 17], target: [-0.5, 26.4, -2] }, { position: [8.6, 31.2, 15.5], target: [-0.5, 26.6, -2] }, c);
  const lift = Math.sin(c.lt * 2.2) * 0.12;
  const a = { ...BEAM_A, position: [BEAM_A.position[0], BEAM_A.position[1], BEAM_A.position[2]] as V3 };
  const b = { ...BEAM_B };
  const ha = robotHand("l", a);
  const hb = robotHand("r", b);
  const mid: V3 = [(ha[0] + hb[0]) / 2, (ha[1] + hb[1]) / 2 + 0.25 + lift, (ha[2] + hb[2]) / 2];
  return (
    <Shot mood="dawn" camera={cam} fog={[80, 420]} shadowSize={50} light={0.95}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[400, 0.1, 400]} />
        <Flat color="#5A5048" />
      </mesh>
      <SkyscraperSite />
      <Crane position={[26, 0, -6]} swing={c.t * 1.2} />
      <Robot {...a} />
      <Robot {...b} />
      <mesh position={mid} castShadow>
        <BoxG args={[6.4, 0.55, 0.5]} />
        <Flat color="#A2493A" />
      </mesh>
      {/* a welder on the second storey, sparks at the column */}
      <Robot position={[-10.2, slabTop(2), -0.2]} yaw={-Math.PI / 2 + 0.3} r={[1.5, -0.1, 0.4]} l={[0.4, 0.2, 0.6]} />
      {Array.from({ length: 6 }, (_, i) => {
        const k = ((c.t * 3 + i / 6) % 1 + 1) % 1;
        return (
          <mesh key={i} position={[-11.4 - k * 0.8 * Math.cos(i), slabTop(2) + 2.6 - k * 1.2, 0.2 + k * 0.6 * Math.sin(i * 2)]}>
            <IcoG args={[0.08, 0]} />
            <Glow color={i % 2 ? "#FFE07A" : "#FFFFFF"} />
          </mesh>
        );
      })}
      <Robot position={[8, slabTop(1), 0.0]} walk={c.lt * 1.2} yaw={-Math.PI / 2} />
      <FutureSkyline radius={190} seed="site" t={c.t} />
    </Shot>
  );
};

const c2Truck: ShotFn = (c) => {
  const cam = move({ position: [9, 4.2, 34], target: [-6, 4.6, 4] }, { position: [8.5, 4.0, 32], target: [-6, 4.6, 7] }, c);
  const z = -6 + c.lt * 9;
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 320]} shadowSize={50}>
      <BigStreet seed="trucks" cars={false} t={c.t} />
      <Truck position={[-6.1, 0, z]} t={c.t} label="left" />
      <Truck position={[6.1, 0, -95 - c.lt * 9]} yaw={Math.PI} t={c.t} label="none" color="#C8CFDA" />
    </Shot>
  );
};

const c2Factory: ShotFn = (c) => {
  const cam = move({ position: [12, 8.5, 24], target: [-3, 6.6, -4] }, { position: [10.8, 8.3, 22], target: [-3.5, 6.7, -4] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[40, 140]} stars={false} light={1.15} shadowSize={30}>
      <Factory t={c.t} boardX={-5} />
      <Robot position={[-4 - c.lt * 1.6, 0, 6.8]} walk={c.lt * 1.2} yaw={-Math.PI / 2} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 03 freedom

/** The four central blocks of a 6×6 FutureCity are a plaza under the AI core. */
const PLAZA = (bx: number, bz: number) => (bx === 2 || bx === 3) && (bz === 2 || bz === 3);
const Plaza: React.FC = () => (
  <group>
    <mesh position={[0, 0.08, 0]} receiveShadow>
      <cylinderGeometry args={[14, 14.5, 0.16, 32]} />
      <Flat color="#C9D2DE" />
    </mesh>
    <mesh position={[0, 0.17, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[10.5, 11.2, 48]} />
      <Glow color={R_VISOR_C} />
    </mesh>
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return (
        <group key={i} position={[Math.cos(a) * 12.8, 0, Math.sin(a) * 12.8]}>
          <mesh position={[0, 0.6, 0]}>
            <CylinderTrunk />
            <Flat color={P.trunk} />
          </mesh>
          <mesh position={[0, 2.0, 0]} castShadow>
            <IcoG args={[1.1, 1]} />
            <Flat color={i % 2 ? P.leaf : P.leafDark} />
          </mesh>
        </group>
      );
    })}
  </group>
);
const CylinderTrunk: React.FC = () => <cylinderGeometry args={[0.15, 0.2, 1.2, 6]} />;
const R_VISOR_C = "#7FE8FF";

const c3Core: ShotFn = (c) => {
  const cam = move({ position: [0, 74, 112], target: [0, 20, 0] }, { position: [0, 71, 104], target: [0, 21, 0] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[70, 340]} shadowSize={70}>
      <FutureCity seed="free" blocks={6} t={c.t} skip={PLAZA} />
      <Plaza />
      <AiCore position={[0, 34, 0]} t={c.t} scale={3.4} light={6} />
      <CoinFlow from={[0, 30, 0]} to={[0, 0.5, 6]} t={c.t} count={80} spread={40} arc={6} speed={0.5} size={1.0} seed="rain" />
    </Shot>
  );
};

const c3Pay: ShotFn = (c) => (
  <PhoneCU c={c} at={[16.5, 6.4, 14]} glow="#145A3A" screen={(w, h) => <PayScreen w={w} h={h} k={k01(c.lt, 0.2, 1.4)} />} stage={{ mood: "dawn", fog: [40, 240], light: 0.9 }}>
    <BigStreet seed="pay" t={c.t} />
    <CoinFlow from={[16.5, 18, -6]} to={[16.5, 0.4, -6]} t={c.t} count={30} spread={6} arc={0} speed={0.6} size={0.35} seed="paycoins" />
  </PhoneCU>
);

const c3Travel: ShotFn = (c) => {
  const cam = move({ position: [1.8, 3.6, 15.5], target: [0, 4.4, -10] }, { position: [1.4, 3.5, 14], target: [0, 4.5, -10] }, c);
  const jump = Math.max(0, Math.sin(Math.min(1, c.lt / 0.55) * Math.PI)) * 0.5;
  const pose = mergePose(REST, { lShoulder: [0.2, 2.4], rShoulder: [0.2, 2.4], lElbow: 0.25, rElbow: 0.25, expression: "smile", headPitch: 0.15, bob: jump });
  return (
    <Shot mood="dawn" camera={cam} fog={[80, 500]} shadowSize={20} light={1.05}>
      <Beach />
      <PalmTree position={[-7, 0, -5]} height={9} seed="p1" />
      <PalmTree position={[8.5, 0, -8]} height={10} seed="p2" />
      <PalmTree position={[-14, 0, -14]} height={8} seed="p3" />
      <Hero pose={pose} position={[0, 0, 0]} />
      <Suitcase position={[2.3, 0, 0.4]} yaw={-0.3} />
      <group position={[-34 + c.lt * 26, 24, -50]} rotation={[0, Math.PI / 2, 0.1]}>
        <PlaneLite />
      </group>
    </Shot>
  );
};

/** The kit plane at a size that reads in a beach sky. */
const PlaneLite: React.FC = () => {
  const white = "#D9DEE8";
  return (
    <group scale={1.6}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.55, 0.5, 7, 10]} />
        <Flat color={white} />
      </mesh>
      <mesh position={[0, 0, 3.9]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.55, 1.0, 10]} />
        <Flat color={white} />
      </mesh>
      <mesh position={[0, -0.1, 0.3]}>
        <boxGeometry args={[9, 0.14, 1.5]} />
        <Flat color="#C3C9D6" />
      </mesh>
      <mesh position={[0, 0.2, -3.4]}>
        <boxGeometry args={[3.2, 0.1, 0.9]} />
        <Flat color="#C3C9D6" />
      </mesh>
      <mesh position={[0, 1.0, -3.5]}>
        <boxGeometry args={[0.12, 1.6, 1.1]} />
        <Flat color={P.carTeal} />
      </mesh>
    </group>
  );
};

/** Slavoski behind the counter of his own stall, a first customer. */
const STALL_AT: V3 = [16.6, 0, -2];
const c3Business: ShotFn = (c) => {
  const cam = move({ position: [3.5, 4.6, 4.5], target: [17.2, 4.0, -2.3] }, { position: [4.6, 4.55, 4.0], target: [17.2, 4.0, -2.3] }, c);
  const wave = Math.sin(c.lt * 10) * 0.3;
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 260]} shadowSize={30}>
      <BigStreet seed="biz" lamps={false} t={c.t} />
      <group position={STALL_AT} rotation={[0, -Math.PI / 2, 0]}>
        <Stall position={[0, 0, 0]} />
        <Hero pose={mergePose(REST, { rShoulder: [0.2, 2.3], rElbow: 0.4 + wave, lShoulder: [0.5, 0.1], lElbow: 0.8, expression: "smile", headPitch: 0.05 })} position={[0.3, 0, -0.55]} />
      </group>
    </Shot>
  );
};

/** Back with the family in the park, arms wide. */
const c3Family: ShotFn = (c) => {
  const cam = move({ position: [0.4, 4.8, 20.5], target: [0, 2.9, 0] }, { position: [0.3, 4.7, 19], target: [0, 2.95, 0] }, c);
  const open = k01(c.lt, 0, 0.5);
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 300]} shadowSize={20} light={1.05}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[400, 0.1, 400]} />
        <Flat color={P.grass} />
      </mesh>
      <HillRing />
      <FutureSkyline radius={150} count={16} seed="park" arc={[Math.PI * 0.75, Math.PI * 1.25]} t={c.t} />
      <LeafyTree position={[-9, 0, -6]} scale={2.2} seed="pk1" />
      <LeafyTree position={[10, 0, -9]} scale={2.6} seed="pk2" />
      <LeafyTree position={[-3, 0, -16]} scale={2.4} seed="pk3" />
      <Blanket position={[1.5, 0, -2.5]} w={5} d={3.6} yaw={0.15} />
      <Hero pose={mergePose(REST, { lShoulder: [0.5, 0.12 + 1.1 * open], rShoulder: [0.5, 0.12 + 1.1 * open], lElbow: 0.3, rElbow: 0.3, expression: "smile", headPitch: 0.05 })} position={[-2.4, 0, 0.6]} yaw={Math.PI / 2 - 0.7} />
      <Hero pose={mergePose(REST, { expression: "smile", lShoulder: [0.5, 0.9], rShoulder: [0.5, 0.9], lElbow: 0.4, rElbow: 0.4 })} position={[2.5, 0, -0.4]} yaw={-Math.PI / 2 + 0.6} look={crowdLook(26)} />
      <Hero pose={mergePose(REST, { expression: "smile", lShoulder: [0.2, 2.4], rShoulder: [0.2, 2.4], lElbow: 0.2, rElbow: 0.2, bob: Math.abs(Math.sin(c.lt * 7)) * 0.25 })} position={[0.3, 0, 1.2]} yaw={-Math.PI / 2 + 0.6} scale={0.62} look={crowdLook(8)} />
      <Quadruped kind="dog" position={[1.1, 0, 3.6]} yaw={-Math.PI / 2 + 0.5} scale={1.2} wag={c.lt * 3} face={{ mouth: 0.5 }} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 04 the catch

/** Looking up at the HQ crown: the hex logo, the red halo, drones. */
const c4Crown: ShotFn = (c) => {
  const cam = move({ position: [34, 66, 64], target: [0, 98, -6] }, { position: [31, 67, 59], target: [0, 99, -6] }, c);
  return (
    <Shot mood="night" dust={0.35} camera={cam} fog={[90, 520]} shadowSize={70}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[500, 0.1, 500]} />
        <Flat color="#2A2E3C" />
      </mesh>
      <MegaTower position={[0, 0, -6]} h={110} w={18} t={c.t} />
      <FutureSkyline radius={150} seed="corp" arc={[Math.PI * 0.3, Math.PI * 1.7]} style="corp" t={c.t} />
      <group position={[0, 0, -6]}>
        <Drones count={12} t={c.t} style="corp" radius={26} y={[80, 120]} seed="crown" />
      </group>
    </Shot>
  );
};

/** The robot army at the HQ's doors: "...that own the robots". */
const c4Tower: ShotFn = (c) => {
  const cam = move({ position: [5, 9, 56], target: [0, 9, 0] }, { position: [4.4, 9, 53], target: [0, 10, 0] }, c);
  return (
    <Shot mood="night" dust={0.35} camera={cam} fog={[90, 420]} shadowSize={70}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[500, 0.1, 500]} />
        <Flat color="#2A2E3C" />
      </mesh>
      <MegaTower position={[0, 0, -6]} h={110} w={18} t={c.t} />
      <FutureSkyline radius={150} seed="corp" arc={[Math.PI * 0.55, Math.PI * 1.45]} style="corp" t={c.t} />
      {/* ranks of robots in front of the doors, all standing to attention */}
      {Array.from({ length: 6 }, (_, row) =>
        Array.from({ length: 9 }, (_, col) => (
          <Robot key={`${row}${col}`} position={[-12 + col * 3, 0, 14 + row * 3.2]} yaw={Math.PI} visor="#FF5A6A" />
        )),
      )}
    </Shot>
  );
};

const c4Money: ShotFn = (c) => {
  const cam = move({ position: [70, 46, 130], target: [0, 50, 0] }, { position: [64, 47, 120], target: [0, 52, 0] }, c);
  return (
    <Shot mood="night" dust={0.35} camera={cam} fog={[90, 420]} shadowSize={70}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[500, 0.1, 500]} />
        <Flat color="#2A2E3C" />
      </mesh>
      <FutureCity seed="corpcity" blocks={7} style="corp" t={c.t} skip={(bx, bz) => bx === 3 && bz === 3} hq={[[0, 0, 110, 10]]} />
      <CoinFlow from={[0, 4, 0]} fromSpread={44} to={[0, 102, 0]} spread={1.5} arc={18} t={c.t} count={110} speed={0.55} size={1.8} seed="up" />
    </Shot>
  );
};

/** Millions out of work: a queue along the fence of a factory that no longer needs anyone. */
const QUEUE = Array.from({ length: 24 }, (_, i) => ({ x: -36 + i * 2.15, z: 2.4 + (i % 2) * 0.25, seed: 50 + i }));
const c4Queue: ShotFn = (c) => {
  const cam = move({ position: [12, 5.5, 6.6], target: [-18, 3.0, 0.6] }, { position: [11, 5.4, 6.3], target: [-18, 3.0, 0.6] }, c);
  return (
    <Shot mood="night" dust={0.3} camera={cam} fog={[40, 220]} shadowSize={40}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[400, 0.1, 400]} />
        <Flat color="#2C3247" />
      </mesh>
      <ClosedFactory t={c.t} />
      <FutureSkyline radius={150} seed="queue" arc={[Math.PI * 0.6, Math.PI * 1.4]} t={c.t} power={0.7} />
      <FutureSkyline radius={110} count={16} seed="queue2" arc={[Math.PI * 1.15, Math.PI * 1.75]} t={c.t} power={0.7} />
      {QUEUE.map((q, i) =>
        q.x > -1.5 ? null : i === 16 ? (
          <Hero key={i} pose={mergePose(REST, { expression: "worried", headYaw: 0.35, headPitch: -0.05 })} position={[q.x, 0, q.z]} yaw={Math.PI / 2} />
        ) : (
          <Hero key={i} pose={mergePose(REST, { expression: random(`qe${i}`) < 0.5 ? "worried" : "neutral", headYaw: (random(`qy${i}`) - 0.5) * 0.8, headPitch: -0.1 })} position={[q.x, 0, q.z]} yaw={Math.PI / 2} look={crowdLook(q.seed)} />
        ),
      )}
    </Shot>
  );
};

const c4Wait: ShotFn = (c) => (
  <PhoneCU c={c} at={[-6.5, 4.4, 9]} glow="#0E1018" screen={(w, h) => <QueueScreen w={w} h={h} t={c.lt} />} stage={{ mood: "night", dust: 0.3, fog: [30, 200], light: 0.8 }}>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[400, 0.1, 400]} />
      <Flat color="#2C3247" />
    </mesh>
    <ClosedFactory t={c.t} />
    {QUEUE.slice(10, 17).map((q, i) => (
      <Hero key={i} pose={mergePose(REST, { expression: "worried" })} position={[q.x, 0, q.z]} yaw={Math.PI / 2} look={crowdLook(q.seed)} />
    ))}
  </PhoneCU>
);

// ---------------------------------------------------------------- 05 two futures

const c5Grow: ShotFn = (c) => {
  const cam = move({ position: [56, 76, 104], target: [0, 10, 0] }, { position: [52, 72, 96], target: [0, 11, 0] }, c);
  const g = k01(c.lt, 0.05, 1.0);
  return (
    <Shot mood="dawn" camera={cam} fog={[70, 300]} shadowSize={60}>
      <FutureCity seed="grow" blocks={6} t={c.t} grow={0.55 + g * 0.6} skip={PLAZA} />
      <Plaza />
      <AiCore position={[0, 30 + g * 6, 0]} t={c.t} scale={2.4} light={3} />
    </Shot>
  );
};

/** Robots building neat, cheap new homes. */
const HOMES: { x: number; color: string; roof: string; build?: number }[] = [
  { x: -24, color: "#E8DCC4", roof: "#C8372D" },
  { x: -12, color: "#BFD7E0", roof: "#2E5A6A" },
  { x: 0, color: "#F2E2B0", roof: "#5A4A78", build: 0.6 },
  { x: 12, color: "#E8C8C0", roof: "#2F7A5A" },
  { x: 24, color: "#D8E0C8", roof: "#C8372D" },
];
const Suburb: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[400, 0.1, 400]} />
      <Flat color={P.grass} />
    </mesh>
    <mesh position={[0, 0.005, 9]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 7]} />
      <Flat color={P.road} />
    </mesh>
    <HillRing />
    <FutureSkyline radius={200} count={14} seed="burb" arc={[Math.PI * 0.8, Math.PI * 1.2]} t={t} scale={0.9} />
    {HOMES.map((h) => (
      <House key={h.x} position={[h.x, 0, -2]} color={h.color} roof={h.roof} build={h.build} />
    ))}
    {HOMES.map((h, i) => (i % 2 ? <LeafyTree key={`t${i}`} position={[h.x + 6, 0, 3]} scale={1.3} seed={`sb${i}`} /> : null))}
    {/* robots finishing the unfinished house: one on the top slab, one bringing materials */}
    <Robot position={[1.2, 6.2, -2.6]} yaw={0.5} l={[0.3, 1.9, 0.5 + Math.sin(t * 9) * 0.3]} r={[1.2, 0.1, 0.4]} headPitch={-0.2} />
    <CarryBot position={[8 - Math.min(t, 3) * 1.6, 0, 6.5]} yaw={-Math.PI / 2} walk={t * 1.3} walkAmount={0.8} />
    <CanvasPanel
      position={[-15.5, 3.4, 6.2]}
      w={5}
      h={2.2}
      draw={(ctx, w, h) => {
        ctx.fillStyle = "#F2EEE6";
        ctx.fillRect(0, 0, w, h);
        fitText(ctx, "NEW HOMES", w / 2, h * 0.32, w * 0.86, h * 0.3, "#1D274B");
        fitText(ctx, "AFFORDABLE", w / 2, h * 0.72, w * 0.8, h * 0.28, "#2F7A5A");
      }}
    />
    <mesh position={[-15.5, 1.15, 6.15]}>
      <BoxG args={[0.2, 2.3, 0.2]} />
      <Flat color="#5A3E2E" />
    </mesh>
  </group>
);

const c5Homes: ShotFn = (c) => {
  const cam = move({ position: [30, 8.5, 24], target: [-4, 4.2, -2] }, { position: [27.5, 8.2, 22], target: [-4, 4.2, -2] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 300]} shadowSize={30} light={1.05}>
      <Suburb t={c.lt} />
    </Shot>
  );
};

/** Robot doctor scanning a patient: "incredible medicine". */
const c5Med: ShotFn = (c) => {
  const cam = move({ position: [2.2, 5.0, 15.5], target: [0.5, 4.5, 0] }, { position: [2.0, 4.95, 14.2], target: [0.5, 4.55, 0] }, c);
  const scan = k01(c.lt, 0.05, 1.2);
  const patientPose = mergePose(REST, { lHip: [1.5, 0.1], rHip: [1.5, 0.1], lKnee: 1.35, rKnee: 1.35, lShoulder: [0.2, 0.15], rShoulder: [0.2, 0.15], expression: scan >= 1 ? "smile" : "neutral" });
  const patientPos: V3 = [-0.6, BENCH.top - 0.62 - 0.1, BENCH.z - 0.25];
  const hoopY = patientPos[1] + 4.2 - scan * 3.2;
  const panel: V3 = [-0.2, 7.0, -2.6];
  return (
    <Shot
      mood="dawn"
      camera={cam}
      fog={false}
      stars={false}
      light={1.05}
      shadowSize={12}
      overlay={
        <ScreenHtml c={panel} w={3.2} h={2.0} cam={cam} width={c.width} height={c.height}>
          {(w, h) => <ScanReadout w={w} h={h} k={scan} />}
        </ScreenHtml>
      }
    >
      <Clinic />
      <Hero pose={patientPose} position={patientPos} look={crowdLook(64)} />
      <ScanHoop position={[patientPos[0], hoopY, patientPos[2] + 0.35]} r={1.35} />
      <Robot position={[2.1, 0, 0.6]} yaw={-Math.PI / 2 + 0.35} l={[1.35, -0.1, 0.4]} r={[0.3, 0.2, 0.6]} headPitch={-0.1} body="#F2F6FA" accent="#45C77A" visor="#7FFFB0" />
    </Shot>
  );
};

/** The corporate future: the same kind of city, dark and hazy, three HQ towers with the hex logo over it. */
const HQ_BLOCKS = (bx: number, bz: number) => (bx === 1 && bz === 2) || (bx === 4 && bz === 3) || (bx === 3 && bz === 5);
const DarkCity: React.FC<{ t: number }> = ({ t }) => (
  <FutureCity
    seed="dark"
    blocks={7}
    style="corp"
    t={t}
    skip={HQ_BLOCKS}
    drones={30}
    hq={[
      [-36, -18, 100, 10],
      [18, 0, 125, 10],
      [0, 36, 85, 9.5],
    ]}
  />
);

const c5Corp: ShotFn = (c) => {
  const cam = move({ position: [96, 118, 160], target: [0, 18, 0] }, { position: [90, 112, 150], target: [0, 20, 0] }, c);
  return (
    <Shot mood="night" dust={0.75} camera={cam} fog={[120, 520]} shadowSize={90}>
      <DarkCity t={c.t} />
    </Shot>
  );
};

/** At street level: a tower watching over a dark street, drones overhead. */
const c5Control: ShotFn = (c) => {
  const cam = move({ position: [3, 3.2, 30], target: [0, 18, -60] }, { position: [2.6, 3.0, 26], target: [0, 20, -60] }, c);
  return (
    <Shot mood="night" dust={0.8} camera={cam} fog={[80, 420]} shadowSize={40}>
      <BigStreet seed="ctrl" lampsOn={false} cars={false} modify={() => ({ power: 0.2 })} t={c.t} future="corp" />
      <MegaTower position={[0, 0, -150]} h={200} w={30} t={c.t} seed="end" />
      <Hero pose={mergePose(REST, { headPitch: 0.5, expression: "worried" })} position={[1.5, 0, 12]} yaw={Math.PI} />
      {Array.from({ length: 5 }, (_, i) => {
        const x = -16 + i * 8 + Math.sin(c.t * 0.8 + i) * 2;
        const y = 22 + (i % 2) * 6 + Math.sin(c.t * 1.3 + i) * 0.6;
        const z = -20 - i * 14;
        return (
          <group key={i} position={[x, y, z]}>
            <mesh>
              <BoxG args={[1.6, 0.4, 1.6]} />
              <Flat color="#1B2030" />
            </mesh>
            <mesh position={[0, -0.3, 0.6]}>
              <IcoG args={[0.18, 1]} />
              <Glow color="#FF3A4A" fog={false} />
            </mesh>
          </group>
        );
      })}
    </Shot>
  );
};

const c5Same: ShotFn = (c) => {
  const cam = move({ position: [Math.sin(c.lt * 0.25) * 4, 1.0, 17], target: [0, 0.6, 0] }, { position: [Math.sin(c.lt * 0.25) * 4, 0.8, 15], target: [0, 0.6, 0] }, c);
  return (
    <Shot mood="space" camera={cam} fog={false} shadows={false} light={0.35}>
      <AiCore position={[0, 0.6, 0]} t={c.t} scale={1.25} split color="#F6EBC4" light={1.6} />
    </Shot>
  );
};

// ---------------------------------------------------------------- 06 who benefits?

/** Rooftop at dusk over the city (the roof is y = 0, the streets far below). */
const Rooftop: React.FC = () => (
  <group>
    <mesh position={[0, -0.25, 0]} receiveShadow>
      <BoxG args={[24, 0.5, 24]} />
      <Flat color="#4A4F60" />
    </mesh>
    <mesh position={[0, 0.6, -12]} castShadow receiveShadow>
      <BoxG args={[24, 1.2, 0.4]} />
      <Flat color="#5A6070" />
    </mesh>
    <mesh position={[-7, 1.6, 4]} castShadow>
      <BoxG args={[3, 3.2, 3]} />
      <Flat color="#3A3F55" />
    </mesh>
    <group position={[0, -24, -78]}>
      <FutureCity seed="roof" blocks={6} t={0} monorail drones={16} />
    </group>
    <group position={[0, -24, 0]}>
      <FutureSkyline radius={150} count={30} seed="roofsky" arc={[0, Math.PI * 2]} t={0} />
    </group>
  </group>
);

const c6Roof: ShotFn = (c) => {
  const cam = move({ position: [1.4, 6.4, 2.5], target: [-1.5, -3.5, -40] }, { position: [1.2, 6.3, 1.6], target: [-1.5, -3.5, -40] }, c);
  return (
    <Shot mood="night" camera={cam} fog={[60, 260]} shadowSize={20}>
      <Rooftop />
      <Hero pose={mergePose(REST, { headPitch: 0.1, headYaw: -0.2, expression: "worried" })} position={[0, 0, -8.5]} yaw={Math.PI + 0.25} />
      <AiCore position={[-22, 8, -110]} t={c.t} scale={3} light={4} />
      <Robot position={[6, 0, -9.5]} yaw={Math.PI - 0.3} />
    </Shot>
  );
};

const c6Scale: ShotFn = (c) => {
  const cam = move({ position: [22, 11, 26], target: [0.6, 7.6, 0] }, { position: [20, 10.8, 23.5], target: [0.6, 7.6, 0] }, c);
  const tilt = Math.sin(c.lt * 2.4) * 0.22;
  return (
    <Shot mood="night" camera={cam} fog={[40, 140]} shadowSize={20} light={0.7}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[200, 0.1, 200]} />
        <Flat color="#1A1F33" />
      </mesh>
      <AiCore position={[0, 22, -18]} t={c.t} scale={2.0} light={3} />
      <Balance
        tilt={tilt}
        left={
          <>
            <group scale={0.055}>
              <MegaTower position={[0, 0, 0]} h={90} w={16} t={c.t} seed="mini" />
            </group>
            <CoinPile position={[1.3, 0, 0.9]} r={0.65} h={0.55} />
          </>
        }
        right={
          <>
            {Array.from({ length: 7 }, (_, i) => {
              const a = (i / 7) * Math.PI * 2;
              const r = i === 0 ? 0 : 1.65;
              return (
                <Hero key={i} pose={mergePose(REST, { expression: "worried", headPitch: 0.3 })} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} yaw={Math.PI * 0.1 * i} scale={0.32} look={i === 0 ? undefined : crowdLook(70 + i)} />
              );
            })}
          </>
        }
      />
      <pointLight position={[0, 18, 10]} color="#FFE0A0" intensity={60} distance={40} decay={2} />
    </Shot>
  );
};

const c6Ask: ShotFn = (c) => {
  const cam = move({ position: [0.4, 4.0, 9.5], target: [0, 3.4, 0] }, { position: [0.3, 3.95, 8.4], target: [0, 3.45, 0] }, c);
  const shrug = k01(c.lt, 0.05, 0.35);
  const pose = mergePose(REST, {
    lShoulder: [0.35 * shrug, 0.12 + 0.5 * shrug],
    rShoulder: [0.35 * shrug, 0.12 + 0.5 * shrug],
    lElbow: 0.15 + 1.4 * shrug,
    rElbow: 0.15 + 1.4 * shrug,
    headRoll: 0.14 * shrug,
    expression: "worried",
  });
  return (
    <Shot mood="night" camera={cam} fog={[60, 260]} shadowSize={14}>
      <Rooftop />
      <Hero pose={pose} position={[0, 0, 0]} />
    </Shot>
  );
};

const c6Good: ShotFn = (c) => {
  const cam = move({ position: [-30, 14, 30], target: [6, 3, 0] }, { position: [-27, 13.4, 27.5], target: [6, 3, 0] }, c);
  return (
    <Shot mood="dawn" camera={cam} fog={[60, 300]} shadowSize={40} light={1.05}>
      <Suburb t={1 + c.lt} />
      <Blanket position={[14, 0, 6]} w={5} d={3.4} />
      <Hero pose={mergePose(REST, { lShoulder: [2.6, 0.5], rShoulder: [2.6, 0.5], lElbow: 0.3, rElbow: 0.3, expression: "smile" })} position={[9, 0, 7]} yaw={0.3} />
      <Hero pose={mergePose(REST, { expression: "smile" })} position={[17.5, 0, 5.5]} yaw={-0.6} look={crowdLook(81)} />
      <Robot position={[-14, 0, 6.5]} walk={c.lt * 1.2} yaw={Math.PI / 2} />
    </Shot>
  );
};

const c6Bad: ShotFn = (c) => {
  const cam = move({ position: [-110, 70, 150], target: [0, 26, 0] }, { position: [-102, 66, 140], target: [0, 28, 0] }, c);
  return (
    <Shot mood="night" dust={0.85} camera={cam} fog={[120, 520]} shadowSize={90}>
      <DarkCity t={c.t} />
    </Shot>
  );
};

// ---------------------------------------------------------------- the list

export const SHOTS: Record<string, CuedShot<ShotFn>[]> = {
  cold: [
    { cue: null, fn: coldEarth },
    { cue: "never has to", fn: coldCommute },
    { cue: "No more nine", fn: coldOffice },
    { cue: "No more 6:00", fn: coldAlarm },
    { cue: "Elon Musk", fn: coldRobot },
    { cue: "make work optional", fn: coldOptional },
  ],
  c1: [
    { cue: null, fn: c1Welcome },
    { cue: "Your phone buzzes", fn: c1Buzz },
    { cue: "Your job", fn: c1Alert },
    { cue: "You panic", fn: c1Panic },
    { cue: "Then you look", fn: c1Window },
  ],
  c2: [
    { cue: null, fn: c2Build },
    { cue: "Trucks drive", fn: c2Truck },
    { cue: "Whole factories", fn: c2Factory },
  ],
  c3: [
    { cue: null, fn: c3Core },
    { cue: "pay everyone", fn: c3Pay },
    { cue: "Travel the world", fn: c3Travel },
    { cue: "start a business", fn: c3Business },
    { cue: "finally see", fn: c3Family },
  ],
  c4: [
    { cue: null, fn: c4Crown },
    { cue: "own the robots", fn: c4Tower },
    { cue: "keep the money", fn: c4Money },
    { cue: "What if millions", fn: c4Queue },
    { cue: "before help", fn: c4Wait },
  ],
  c5: [
    { cue: null, fn: c5Grow },
    { cue: "cheap homes", fn: c5Homes },
    { cue: "incredible medicine", fn: c5Med },
    { cue: "or a handful", fn: c5Corp },
    { cue: "controlling", fn: c5Control },
    { cue: "Both start", fn: c5Same },
  ],
  c6: [
    { cue: null, fn: c6Roof },
    { cue: "it's who benefits", fn: c6Scale },
    { cue: "What do you think", fn: c6Ask },
    { cue: "Humanity's greatest", fn: c6Good },
    { cue: "or its biggest", fn: c6Bad },
  ],
};

// ---------------------------------------------------------------- thumbnail

/** Shorts cover: Slavoski in the foreground (lower half, alarmed), robots building the city behind him. */
export const thumbShot: ShotFn = () => {
  const cam: CameraSpec = { position: [0.4, 3.4, 31], target: [0, 6.8, 0] };
  const carry: RobotProps = { position: [-4.3, 0, 5.0], yaw: Math.PI / 2 - 0.35, walk: 0.3, walkAmount: 0.8 };
  const site: V3 = [1, 0, -22];
  return (
    <Shot mood="dawn" camera={cam} fog={[80, 420]} shadowSize={40} light={1.0}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[400, 0.1, 400]} />
        <Flat color="#5A5048" />
      </mesh>
      <group position={site}>
        <SkyscraperSite />
        <Robot position={[-3.2, slabTop(2), -0.4]} yaw={Math.PI / 2} l={[1.3, 0.1, 0.35]} r={[1.3, 0.1, 0.35]} />
        <Robot position={[3.2, slabTop(2), -0.4]} yaw={-Math.PI / 2} l={[1.3, 0.1, 0.35]} r={[1.3, 0.1, 0.35]} />
        <mesh position={[0, slabTop(2) + 2.75, -0.4]} castShadow>
          <BoxG args={[6.4, 0.55, 0.5]} />
          <Flat color="#A2493A" />
        </mesh>
        <Robot position={[7, slabTop(1), 0]} yaw={-0.3} walk={0.2} walkAmount={0.7} />
      </group>
      <Crane position={[30, 0, -30]} swing={0.4} />
      <FutureSkyline radius={190} seed="thumb" t={0} />
      <CarryBot {...carry} />
      <Robot position={[3.7, 0, 4.2]} yaw={-Math.PI / 2 + 0.45} walk={0.65} walkAmount={0.7} />
      <Hero pose={mergePose(REST, { expression: "alarm", lShoulder: [0.9, 0.85], rShoulder: [0.9, 0.85], lElbow: 1.9, rElbow: 1.9, headPitch: 0.05 })} position={[0, 0, 9.5]} yaw={0.08} />
    </Shot>
  );
};
