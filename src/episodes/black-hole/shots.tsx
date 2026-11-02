/**
 * Shots for "What If a Black Hole Appeared Next to Earth?".
 * Each shot is a full frame (Stage + shot-specific overlays). `lt` = seconds since the shot started.
 */
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { Car, CityGrid, Ground, Lamp, PineTree, StreetSet, Building, BUILDING_COLORS } from "../../slavoski/city";
import { FONT } from "../../slavoski/fonts";
import { Debris, FloodWater, Fireball, LavaCrack, SmokeCluster, Volcano } from "../../slavoski/fx";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { CardLine } from "../../slavoski/Overlays";
import { P } from "../../slavoski/palette";
import { groundedBob, handPosition, Hero, headPosition, lerpPose, mergePose, REST, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { AccretionDisk, BlackHole, FacetedEarth, FacetedMoon, OrbitPath } from "../../slavoski/space";
import { lerpCam, project, Stage, Stars, type CameraSpec } from "../../slavoski/Stage";
import { formatCountdown, R0_KM, separationKm, T_FALL_DAYS, formatTides } from "./physics";
import { Arrow, Binoculars, CoastSet, DashedLine, EarthBreakup, LensStars, Marble, Observatory } from "./props";
import { random } from "remotion";

export type ShotCtx = { lt: number; dur: number; t: number; days: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

// ---------------------------------------------------------------- shared bits

const HERO_AT: V3 = [0.2, 0, 1.2];
const STREET_WIDE: CameraSpec = { position: [0.6, 2.6, 22], target: [0, 6.2, -10] };

const lookUp = (amt = 1): Pose => mergePose(REST, { headPitch: 0.42 * amt });
const ALARM_BALANCE: Pose = mergePose(REST, {
  lShoulder: [0.15, 1.3],
  rShoulder: [0.15, 1.3],
  lElbow: 0.3,
  rElbow: 0.3,
  lHip: [0, 0.22],
  rHip: [0, 0.22],
  lKnee: 0.25,
  rKnee: 0.25,
  expression: "alarm",
});
const BINOCULARS: Pose = mergePose(REST, { headPitch: 0.25, lShoulder: [2.25, 0.662], rShoulder: [2.25, 0.662], lElbow: 0.35, rElbow: 0.35 });
const PALM_UP: Pose = mergePose(REST, { headPitch: -0.32, rShoulder: [0.62, 0.12], rElbow: 1.15, expression: "awe" });

const grounded = (p: Pose): Pose => ({ ...p, bob: groundedBob(p) });

/** Vertical space diagram: Earth below, black hole above, separation from the story clock. */
const DIAGRAM_MID = 0.5;
const diagram = (days: number) => {
  const ratio = separationKm(days) / R0_KM;
  const sep = 3.6 + 7.4 * ratio;
  return { earth: [0, DIAGRAM_MID - sep / 2 - 0.5, 0] as V3, bh: [0, DIAGRAM_MID + sep / 2 + 0.5, 0] as V3, sep };
};
const DIAGRAM_CAM: CameraSpec = { position: [0, 0.6, 27], target: [0, 0.6, 0] };

const Label: React.FC<{ x: number; y: number; text: string; sub?: string; color?: string; align?: "center" | "left" }> = ({
  x,
  y,
  text,
  sub,
  color = P.cream,
  align = "center",
}) => (
  <div
    style={{
      position: "absolute",
      left: align === "center" ? x - 300 : x,
      width: align === "center" ? 600 : undefined,
      top: y,
      textAlign: align,
      fontFamily: FONT,
      color,
      fontWeight: 700,
      fontSize: 30,
      letterSpacing: "0.1em",
      textShadow: "0 3px 10px rgba(0,0,0,0.6)",
      transform: "translateY(-50%)",
    }}
  >
    {text}
    {sub ? <div style={{ fontWeight: 400, fontSize: 18, letterSpacing: "0.16em", opacity: 0.75, marginTop: 6 }}>{sub}</div> : null}
  </div>
);

const useLabelAt = (p: V3, cam: CameraSpec) => {
  const { width, height } = useVideoConfig();
  return project(p, cam, width, height);
};

const PinnedLabel: React.FC<{ at: V3; cam: CameraSpec; text: string; sub?: string; dx?: number; dy?: number; align?: "center" | "left"; color?: string }> = ({
  at,
  cam,
  text,
  sub,
  dx = 0,
  dy = 0,
  align,
  color,
}) => {
  const s = useLabelAt(at, cam);
  return <Label x={s.x + dx} y={s.y + dy} text={text} sub={sub} align={align} color={color} />;
};

const Street: React.FC<{ dust?: number; children?: React.ReactNode }> = ({ children }) => (
  <>
    <StreetSet seed="bh" cars={false} />
    {children}
  </>
);

// ---------------------------------------------------------------- COLD OPEN

const coldWide: ShotFn = ({ lt, t }) => {
  const cam = lerpCam({ position: [0, 0.4, 29], target: [0, 0.4, 0] }, { position: [0, 0.6, 26], target: [0, 0.6, 0] }, lt / 3);
  return (
    <Stage mood="space" camera={cam} fog={false} shadows={false}>
      <FacetedEarth radius={3} position={[0, -5.2, 0]} rotation={[0.35, 1.1 + t * 0.08, 0]} />
      <FacetedMoon radius={0.7} position={[-3.1, 0.6, -2]} rotation={[0, t * 0.1, 0]} />
      <BlackHole position={[2.2, 1.8, 0]} facing={cam.position} markerRadius={0.75} markerProgress={ease((lt - 0.6) / 0.8)} spin={t * 0.3} />
    </Stage>
  );
};

const coldClose: ShotFn = ({ lt, t }) => {
  const cam = lerpCam({ position: [1.4, 1.2, 12], target: [1.8, 1.0, 0] }, { position: [1.8, 1.4, 9.5], target: [2.0, 1.2, 0] }, lt / 3);
  return (
    <Stage mood="space" camera={cam} fog={false} shadows={false}>
      <FacetedEarth radius={3} position={[0, -5.2, 0]} rotation={[0.35, 1.1 + t * 0.08, 0]} />
      <BlackHole position={[2.2, 1.8, 0]} facing={cam.position} markerRadius={0.75} spin={t * 0.3} />
    </Stage>
  );
};

// ---------------------------------------------------------------- 01 OUT OF NOWHERE

const c1Street: ShotFn = ({ lt }) => {
  const look = ease(lt / 1.2);
  const shrug = ease((lt - 1.5) / 0.5) * (1 - ease((lt - 2.6) / 0.4));
  const pose = lerpPose(lookUp(look), mergePose(lookUp(1), { lShoulder: [0.35, 0.55], rShoulder: [0.35, 0.55], lElbow: 1.45, rElbow: 1.45 }), shrug);
  const cam = lerpCam(STREET_WIDE, { position: [0.5, 2.6, 18.5], target: [0, 6.0, -10] }, lt / 3);
  return (
    <Stage mood="night" camera={cam} fog={[40, 200]}>
      <Street />
      <Car position={[-1.7, 0, -16]} color={P.carTeal} />
      <Hero pose={grounded(pose)} position={HERO_AT} />
    </Stage>
  );
};

const c1Appear: ShotFn = ({ lt, t }) => {
  const cam = lerpCam({ position: [0, 0.4, 13], target: [0, 0.3, 0] }, { position: [0, 0.4, 10.5], target: [0, 0.3, 0] }, lt / 3);
  return (
    <AbsoluteFill>
      <Stage mood="space" camera={cam} fog={false} shadows={false}>
        <BlackHole position={[0, 1.6, 0]} facing={cam.position} markerRadius={1.1} markerProgress={ease(lt / 0.7)} spin={t * 0.3} coreRadius={0.08} />
        <FacetedEarth radius={3} position={[0, -7.4, -2]} rotation={[0.35, 1.3 + t * 0.08, 0]} />
      </Stage>
      <CardLine text="MASS = 1 EARTH" sub="SQUEEZED INTO A BLACK HOLE" y={1100} appearFrame={-9999} />
    </AbsoluteFill>
  );
};

const c1Marble: ShotFn = ({ lt }) => {
  const pose = grounded(PALM_UP);
  const hand = handPosition(pose, "r", HERO_AT);
  const marbleR = 0.13;
  const marble: V3 = [hand[0], hand[1] + 0.21 + marbleR, hand[2]];
  const head = headPosition(pose, HERO_AT);
  const cam = lerpCam(
    { position: [-1.6, 3.4, 8.4], target: [(marble[0] + head[0]) / 2, (marble[1] + head[1]) / 2 - 0.4, 1.4] },
    { position: [-1.4, 3.3, 7.4], target: [(marble[0] + head[0]) / 2, (marble[1] + head[1]) / 2 - 0.4, 1.4] },
    lt / 2.5,
  );
  return (
    <AbsoluteFill>
      <Stage mood="night" camera={cam} fog={[30, 160]}>
        <Street />
        <Hero pose={pose} position={HERO_AT} />
        <Marble position={marble} radius={marbleR} />
      </Stage>
      <CardLine text="≈ 1.8 CM WIDE" sub="THE SIZE OF A MARBLE" y={1200} appearFrame={-9999} />
    </AbsoluteFill>
  );
};

const c1Diagram: ShotFn = ({ lt, t }) => {
  const d = diagram(0);
  const cam = lerpCam(DIAGRAM_CAM, { position: [0, 0.6, 25.5], target: [0, 0.6, 0] }, lt / 3);
  const top: V3 = [0, d.bh[1] - 0.9, 0];
  const bottom: V3 = [0, d.earth[1] + 3.2, 0];
  return (
    <AbsoluteFill>
      <Stage mood="space" camera={cam} fog={false} shadows={false}>
        <FacetedEarth radius={3} position={d.earth} rotation={[0.35, 1.3 + t * 0.08, 0]} />
        <BlackHole position={d.bh} facing={cam.position} markerRadius={0.7} spin={t * 0.3} />
        <FacetedMoon radius={0.55} position={[-3.3, d.earth[1] + 7.5, -1]} />
        <OrbitPath points={[[-3.6, d.earth[1] + 7.2, -1], [-3.9, d.earth[1] + 4.5, -0.5], [-3.2, d.earth[1] + 1.8, 0]]} dotRadius={0.04} spacing={0.18} />
        <DashedLine from={bottom} to={top} progress={ease(lt / 0.8)} />
      </Stage>
      <PinnedLabel at={[0, (top[1] + bottom[1]) / 2, 0]} cam={cam} text="384,400 KM" sub="AS FAR AS THE MOON" dx={190} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 02 THE INVISIBLE GUEST

const c2Binoculars: ShotFn = ({ lt }) => {
  const raise = ease(lt / 0.6);
  const pose = grounded(lerpPose(lookUp(0.6), BINOCULARS, raise));
  const l = handPosition(pose, "l", HERO_AT);
  const r = handPosition(pose, "r", HERO_AT);
  const bino: V3 = [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2 + 0.2 + 0.13, (l[2] + r[2]) / 2];
  const cam = lerpCam({ position: [1.2, 2.2, 8.5], target: [0.2, 3.6, 0] }, { position: [1.0, 2.3, 7.5], target: [0.2, 3.6, 0] }, lt / 2.5);
  return (
    <Stage mood="night" camera={cam} fog={[40, 200]}>
      <Street />
      <Hero pose={pose} position={HERO_AT} />
      {raise > 0.95 ? <Binoculars position={bino} pitch={0.25} /> : null}
    </Stage>
  );
};

const c2Pov: ShotFn = ({ t }) => {
  const mask =
    "radial-gradient(circle at 30% 46%, #000 0 26%, transparent 26.3%), radial-gradient(circle at 70% 46%, #000 0 26%, transparent 26.3%)";
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ WebkitMaskImage: mask, maskImage: mask }}>
        <Stage mood="space" camera={{ position: [Math.sin(t * 1.3) * 0.15, 0.3 + Math.sin(t * 2.1) * 0.1, 0], target: [0, 30, -60], fov: 30 }} fog={false} shadows={false}>
          <Stars count={1400} size={2.6} opacity={0.9} />
        </Stage>
      </AbsoluteFill>
      <div style={{ position: "absolute", top: 860, width: "100%", textAlign: "center", fontFamily: FONT, color: P.cream, fontSize: 24, letterSpacing: "0.2em", opacity: 0.8 }}>
        NOTHING TO SEE
      </div>
    </AbsoluteFill>
  );
};

const c2Dome: ShotFn = ({ lt }) => {
  const cam = lerpCam({ position: [7, 2.4, 17], target: [0, 3.2, 0] }, { position: [5.5, 2.6, 13.5], target: [0, 3.4, 0] }, lt / 2.5);
  return (
    <Stage mood="night" camera={cam} fog={[40, 200]} shadowSize={20}>
      <Ground color="#1E2440" />
      <Observatory slitOpen={0.4 + 0.6 * ease(lt / 1.2)} />
      <PineTree position={[-5, -0.3, 2]} scale={1.2} />
      <PineTree position={[5.5, -0.4, -2]} scale={1.4} />
    </Stage>
  );
};

const c2Lens: ShotFn = ({ lt, t }) => {
  const mask = "radial-gradient(circle at 50% 46%, #000 0 40%, transparent 40.3%)";
  const thetaE = 0.15 + 0.85 * ease(lt / 1.6);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ WebkitMaskImage: mask, maskImage: mask }}>
        <Stage mood="space" camera={{ position: [0, 0, 14], target: [0, 0, 0], fov: 30 }} fog={false} shadows={false} stars={false}>
          <group position={[0, 0.6, 0]}>
            <LensStars thetaE={thetaE} t={t} />
          </group>
        </Stage>
      </AbsoluteFill>
      <div style={{ position: "absolute", top: 1240, width: "100%", textAlign: "center", fontFamily: FONT, color: P.cream, fontSize: 22, letterSpacing: "0.18em", opacity: 0.75 }}>
        TELESCOPE VIEW · EXAGGERATED
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 03 FREE FALL

const c3Tug: ShotFn = ({ lt, t }) => {
  const d = diagram(0);
  const cam = lerpCam(DIAGRAM_CAM, { position: [0, 0.6, 25], target: [0, 0.6, 0] }, lt / 3);
  const pulse = 0.5 + 0.5 * Math.sin(t * 6);
  return (
    <Stage mood="space" camera={cam} fog={false} shadows={false}>
      <FacetedEarth radius={3} position={d.earth} rotation={[0.35, 1.3 + t * 0.08, 0]} />
      <BlackHole position={d.bh} facing={cam.position} markerRadius={0.7} spin={t * 0.3} />
      <DashedLine from={[0, d.earth[1] + 3.3, 0]} to={[0, d.bh[1] - 0.9, 0]} color={pulse > 0.5 ? P.amber : P.cream} />
    </Stage>
  );
};

const c3Arrows: ShotFn = ({ lt, t }) => {
  const d = diagram(0);
  const cam = { position: [0, 0.6, 25] as V3, target: [0, 0.6, 0] as V3 };
  const g = ease(lt / 0.7);
  return (
    <AbsoluteFill>
      <Stage mood="space" camera={cam} fog={false} shadows={false}>
        <FacetedEarth radius={3} position={d.earth} rotation={[0.35, 1.3 + t * 0.08, 0]} />
        <BlackHole position={d.bh} facing={cam.position} markerRadius={0.7} spin={t * 0.3} />
        <Arrow from={[0.9, d.earth[1] + 3.4, 0]} to={[0.9, d.earth[1] + 6.4, 0]} progress={g} width={0.24} />
        <Arrow from={[-0.9, d.bh[1] - 1.0, 0]} to={[-0.9, d.bh[1] - 4.0, 0]} progress={g} width={0.24} />
      </Stage>
      <PinnedLabel at={[0.9, d.earth[1] + 5, 0]} cam={cam} text="SAME PULL" align="left" dx={60} />
    </AbsoluteFill>
  );
};

const c3Fall: ShotFn = ({ lt, dur, t }) => {
  const k = ease(lt / Math.max(1, dur));
  const sep = 11 - 3.2 * k;
  const earth: V3 = [0, DIAGRAM_MID - sep / 2, 0];
  const bh: V3 = [0, DIAGRAM_MID + sep / 2 + 1, 0];
  const mid: V3 = [0, (earth[1] + 3 + bh[1]) / 2, 0];
  const cam = { position: [0, 0.6, 25] as V3, target: [0, 0.6, 0] as V3 };
  return (
    <AbsoluteFill>
      <Stage mood="space" camera={cam} fog={false} shadows={false}>
        <FacetedEarth radius={3} position={earth} rotation={[0.35, 1.3 + t * 0.08, 0]} />
        <BlackHole position={bh} facing={cam.position} markerRadius={0.7} spin={t * 0.3} />
        <DashedLine from={[-2.6, mid[1], 0]} to={[2.6, mid[1], 0]} color={P.amber} dash={0.2} gap={0.15} />
      </Stage>
      <PinnedLabel at={[2.7, mid[1], 0]} cam={cam} text="MEET" sub="HALFWAY" align="left" dx={14} />
    </AbsoluteFill>
  );
};

const c3Impact: ShotFn = ({ lt }) => {
  const cam = lerpCam({ position: [0.6, 2.8, 15], target: [0, 4.6, -6] }, { position: [0.5, 2.8, 13], target: [0, 4.4, -6] }, lt / 3);
  const slam = ease(lt / 0.25);
  return (
    <AbsoluteFill>
      <Stage mood="night" camera={cam} fog={[40, 200]}>
        <Street />
        <Car position={[-1.7, 0, -16]} color={P.carTeal} />
        <Hero pose={grounded(mergePose(REST, { expression: "neutral" }))} position={HERO_AT} />
      </Stage>
      <div
        style={{
          position: "absolute",
          top: 520,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          color: P.white,
          opacity: slam,
          transform: `scale(${1.25 - 0.25 * slam})`,
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: "0.24em", opacity: 0.75 }}>IMPACT IN</div>
        <div style={{ marginTop: 10, fontSize: 92, fontWeight: 700, color: P.amber, letterSpacing: "0.03em", textShadow: `0 0 30px ${P.amber}66` }}>
          {formatCountdown(0)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 04 THE STRETCH

const c4Walk: ShotFn = ({ lt }) => {
  const speed = 1.4;
  const z = 3 - lt * speed;
  const pose = grounded(mergePose(walkPose(lt * 0.9), { expression: "smile" }));
  const cam: CameraSpec = { position: [4.8, 3.4, z + 15], target: [1.2, 3.6, z - 2] };
  return (
    <Stage mood="night" camera={cam} fog={[40, 200]}>
      <Street />
      <Car position={[-1.7, 0, -16]} color={P.carTeal} />
      <Hero pose={pose} position={[1.6, 0, z]} yaw={Math.PI} />
    </Stage>
  );
};

const c4Bulge: ShotFn = ({ lt, t }) => {
  const d = diagram(0.4);
  const cam = lerpCam({ position: [0, 0.6, 25], target: [0, 0.6, 0] }, { position: [0, -1.4, 19], target: [0, -1.0, 0] }, lt / 3);
  return (
    <Stage mood="space" camera={cam} fog={false} shadows={false}>
      <FacetedEarth radius={3} position={d.earth} rotation={[0.35, 1.3 + t * 0.08, 0]} stretch={0.22 * ease(lt / 1.5)} stretchDir={[0, 1, 0]} />
      <BlackHole position={d.bh} facing={cam.position} markerRadius={0.7} spin={t * 0.3} />
    </Stage>
  );
};

const c4Coast: ShotFn = ({ lt, t }) => {
  const surge = ease(lt / 2.2);
  const level = -0.35 + surge * 1.9;
  const edge = 4 - surge * 9;
  const cam = lerpCam({ position: [-6, 4.2, 22], target: [0, 3.2, -4] }, { position: [-5, 4.0, 19], target: [0, 3.0, -4] }, lt / 3);
  return (
    <AbsoluteFill>
      <Stage mood="night" camera={cam} fog={[40, 200]} shadowSize={35}>
        <CoastSet />
        {Array.from({ length: 9 }, (_, i) => (
          <Building
            key={i}
            position={[-24 + i * 6, 0.3, -10]}
            w={4.6}
            d={4.4}
            h={6 + random(`coast${i}`) * 9}
            color={BUILDING_COLORS[i % BUILDING_COLORS.length]}
            seed={`coast${i}`}
          />
        ))}
        {[-15, -3, 9].map((x) => (
          <Lamp key={x} position={[x, 0.3, -2.2]} />
        ))}
        <FloodWater level={level} t={t} size={[120, 60]} position={[0, 0, edge + 30]} flow={-3} />
      </Stage>
      <CardLine text={`TIDES ${formatTides(81)}`} sub="STRONGER THAN THE MOON'S" y={1080} appearFrame={-9999} />
    </AbsoluteFill>
  );
};

const c4Flood: ShotFn = ({ lt, t }) => {
  const level = 0.15 + ease(lt / 2.8) * 0.9;
  const carTop = 0.32 + 0.86 + 0.25;
  const pose = grounded(mergePose(ALARM_BALANCE, { lShoulder: [0.2, 1.2 + Math.sin(t * 7) * 0.12], rShoulder: [0.2, 1.2 - Math.sin(t * 7) * 0.12] }));
  const heroAt: V3 = [1.7, carTop, 2.8];
  const floatY = Math.max(0, level - 0.55) + Math.sin(t * 2.5) * 0.05;
  const cam = lerpCam({ position: [-5.5, 4.6, 18], target: [1.4, 3.4, 0] }, { position: [-5.0, 4.4, 16.5], target: [1.4, 3.4, 0] }, lt / 3);
  return (
    <Stage mood="night" camera={cam} fog={[40, 200]}>
      <Street />
      <Car position={[1.7, 0, 3]} color={P.carRed} />
      <Hero pose={pose} position={heroAt} />
      <Car position={[-1.7, floatY, -6 - lt * 1.2]} yaw={0.15 + Math.sin(t) * 0.05} color={P.carTeal} />
      <FloodWater level={level} t={t} size={[30, 140]} position={[0, 0, -40]} flow={4} />
    </Stage>
  );
};

// ---------------------------------------------------------------- 05 A RUNAWAY MOON

const c5Swing: ShotFn = ({ lt, t }) => {
  const d = diagram(1.2);
  const cam = { position: [0, 0.6, 25] as V3, target: [0, 0.6, 0] as V3 };
  const a = -1.2 + lt * 1.4;
  const mr = 3.4;
  const moon: V3 = [d.bh[0] + Math.cos(a) * mr, d.bh[1] - 2.0 + Math.sin(a) * mr * 0.6, 0];
  const path: V3[] = Array.from({ length: 8 }, (_, i) => {
    const aa = a - i * 0.18;
    return [d.bh[0] + Math.cos(aa) * mr, d.bh[1] - 2.0 + Math.sin(aa) * mr * 0.6, 0];
  });
  return (
    <Stage mood="space" camera={cam} fog={false} shadows={false}>
      <FacetedEarth radius={3} position={d.earth} rotation={[0.35, 1.3 + t * 0.08, 0]} stretch={0.08} />
      <BlackHole position={d.bh} facing={cam.position} markerRadius={0.7} spin={t * 0.3} />
      <FacetedMoon radius={0.6} position={moon} rotation={[0, t * 0.2, 0]} />
      <OrbitPath points={path} dotRadius={0.05} spacing={0.2} />
    </Stage>
  );
};

const c5Wave: ShotFn = ({ lt, t }) => {
  const wave = Math.sin(t * 9) * 0.35;
  const pose = grounded(mergePose(lookUp(0.9), { rShoulder: [0.2, 2.45 + wave], rElbow: 0.5, expression: "worried" }));
  const moonZ = -80 - lt * 90;
  const moonX = -3 + lt * 7;
  return (
    <Stage mood="night" camera={lerpCam(STREET_WIDE, { position: [0.5, 2.6, 19], target: [0, 6.4, -10] }, lt / 3)} fog={[40, 200]}>
      <Street />
      <Hero pose={pose} position={HERO_AT} yaw={0} />
      <FacetedMoon radius={11} position={[moonX, 22 + lt * 6, moonZ]} rotation={[0.2, t * 0.3, 0]} />
    </Stage>
  );
};

// ---------------------------------------------------------------- 06 THE GROUND BENDS

const tiltAway = (amount: number) => (s: { position: V3; h?: number; w?: number; seed?: string }) => {
  // Tilt toward ±x away from the block centre; capped by height so tops never reach across a road.
  const block = 14;
  const local = ((s.position[0] % block) + block * 1.5) % block - block / 2;
  const dir = local >= 0 ? 1 : -1;
  const h = s.h ?? 9;
  return { tilt: [0, dir * amount * Math.min(1, 9 / h) * (0.6 + random(`${s.seed}tl`) * 0.4)] as [number, number] };
};

const c6Aerial: ShotFn = ({ lt, t }) => {
  const cam = lerpCam({ position: [10, 26, 26], target: [0, 3, -4] }, { position: [9, 24, 23], target: [0, 3, -4] }, lt / 3);
  return (
    <AbsoluteFill>
      <Stage mood="night" dust={0.35} camera={cam} fog={[60, 170]} shake={0.12} shakeSeed="c6a" shadowSize={50}>
        <CityGrid seed="aerial" blocks={5} modify={tiltAway(0.05 * ease(lt / 2))} />
        <Debris origin={[2, 6, -6]} t={t % 2} count={10} seed={`d${Math.floor(t / 2)}`} />
      </Stage>
      <CardLine text={`TIDES ${formatTides(1240).replace("1,240", "1,000+")}`} sub="BY DAY THREE" y={1080} appearFrame={-9999} />
    </AbsoluteFill>
  );
};

const c6Crack: ShotFn = ({ lt, t }) => {
  const pose = grounded(mergePose(ALARM_BALANCE, { lShoulder: [0.15, 1.3 + Math.sin(t * 8) * 0.15], rShoulder: [0.15, 1.3 - Math.sin(t * 8) * 0.15] }));
  const cam = lerpCam({ position: [-4.0, 3.6, 15.5], target: [0.9, 3.0, -1] }, { position: [-3.6, 3.5, 14], target: [0.9, 3.0, -1] }, lt / 2.5);
  return (
    <Stage mood="night" dust={0.45} camera={cam} fog={[40, 180]} shake={0.1} shakeSeed="c6b">
      <Street />
      <Hero pose={pose} position={[2.0, 0, 1.5]} yaw={-0.5} />
      <LavaCrack points={[[-0.4, 0, 9], [0.3, 0, 4], [-0.5, 0, -2], [0.4, 0, -10], [-0.3, 0, -30]]} width={0.45} progress={ease(lt / 1.0)} />
    </Stage>
  );
};

const c6Quake: ShotFn = ({ lt, t }) => {
  const cam = lerpCam({ position: [4, 28, 54], target: [-4, 3, 0] }, { position: [3, 27, 50], target: [-4, 3, 0] }, lt / 3);
  return (
    <Stage mood="night" dust={0.65} camera={cam} fog={[50, 170]} shake={0.35} shakeSeed="c6c" shadowSize={50}>
      <CityGrid seed="dis" blocks={5} modify={tiltAway(0.2 * ease(lt / 1.2))} />
      <SmokeCluster position={[-7, 1, -2]} progress={0.3 + lt * 0.3} radius={4} count={10} />
      <Fireball position={[-6, 0, 3]} progress={clamp01(lt / 2.2)} radius={2.4} />
      <LavaCrack points={[[-30, 0, 7], [-10, 0, 7.2], [5, 0, 6.6], [30, 0, 7]]} width={0.7} progress={ease(lt / 0.8)} />
      <Debris origin={[-6, 3, 2]} t={lt} count={18} speed={9} seed="q" />
    </Stage>
  );
};

const c6Volcano: ShotFn = ({ lt, t }) => {
  const cam = lerpCam({ position: [0, 9, 34], target: [0, 9, -40] }, { position: [0, 9.5, 30], target: [0, 10, -40] }, lt / 3);
  return (
    <Stage mood="night" dust={0.85} camera={cam} fog={[60, 260]} shake={0.18} shakeSeed="c6d" shadowSize={60}>
      <CityGrid seed="skyline" blocks={4} block={13} />
      <Volcano position={[-8, 0, -95]} scale={3.2} eruption={ease(lt / 0.6)} t={t} />
      <Volcano position={[30, 0, -130]} scale={2.4} eruption={ease((lt - 0.6) / 0.6)} t={t + 0.7} seed="v2" />
    </Stage>
  );
};

// ---------------------------------------------------------------- 07 THE LAST HOURS

const HalfPath: React.FC<{ k1: number; k2: number; cam: CameraSpec; days: number; t: number }> = ({ k1, k2, cam, days, t }) => {
  const d0 = diagram(0);
  const d = diagram(days);
  const startY = d0.bh[1];
  const meetY = DIAGRAM_MID + 0.5 + 1.8;
  const halfY = (startY + meetY) / 2;
  return (
    <>
      <Stage mood="space" camera={cam} fog={false} shadows={false} dust={0.2}>
        <FacetedEarth radius={3} position={d.earth} rotation={[0.35, 1.3 + t * 0.08, 0]} stretch={0.12} heat={0.3} />
        <BlackHole position={d.bh} facing={cam.position} markerRadius={0.7} spin={t * 0.3} />
        <DashedLine from={[1.4, startY, 0]} to={[1.4, halfY, 0]} color={P.cream} progress={k1} dash={0.18} gap={0.12} />
        <DashedLine from={[1.4, halfY, 0]} to={[1.4, meetY, 0]} color={P.amber} progress={k2} dash={0.18} gap={0.12} />
      </Stage>
      {k1 > 0.3 ? <PinnedLabel at={[1.5, (startY + halfY) / 2, 0]} cam={cam} text="≈ 3 DAYS" sub="FIRST HALF" align="left" dx={24} /> : null}
      {k2 > 0.3 ? <PinnedLabel at={[1.5, (halfY + meetY) / 2, 0]} cam={cam} text="15 HOURS" sub="SECOND HALF" align="left" dx={24} color={P.amber} /> : null}
    </>
  );
};

const c7First: ShotFn = ({ lt, t }) => {
  const cam = { position: [0, 0.6, 25] as V3, target: [0, 0.6, 0] as V3 };
  return (
    <AbsoluteFill>
      <HalfPath k1={ease(lt / 1.6)} k2={0} cam={cam} days={2.81 * ease(lt / 2)} t={t} />
    </AbsoluteFill>
  );
};

const c7Second: ShotFn = ({ lt, t }) => {
  const cam = { position: [0, 0.6, 25] as V3, target: [0, 0.6, 0] as V3 };
  return (
    <AbsoluteFill>
      <HalfPath k1={1} k2={ease(lt / 0.5)} cam={cam} days={2.81 + (3.38 - 2.81) * ease(lt / 0.7)} t={t} />
    </AbsoluteFill>
  );
};

const c7Street: ShotFn = ({ lt, t }) => {
  const pose = grounded(mergePose(lookUp(1), { expression: "alarm", lShoulder: [0.1, 0.3], rShoulder: [0.1, 0.3] }));
  return (
    <Stage mood="night" dust={0.95} camera={lerpCam(STREET_WIDE, { position: [0.5, 2.4, 17], target: [0, 6.4, -10] }, lt / 2)} fog={[30, 150]} shake={0.25} shakeSeed="c7">
      <Street />
      <Hero pose={pose} position={HERO_AT} />
      <SmokeCluster position={[-9, 0, -30]} progress={0.8} radius={5} count={9} seed="s7" />
      <Fireball position={[8, 0, -40]} progress={0.4 + ((t * 0.3) % 0.4)} radius={3} seed="f7" />
    </Stage>
  );
};

// ---------------------------------------------------------------- 08 TORN APART

const c8Lift: ShotFn = ({ lt, t }) => {
  const lift = ease(lt / 2.5) * 0.9;
  const flail = Math.sin(t * 10);
  const pose = mergePose(REST, {
    headPitch: 0.3,
    expression: "alarm",
    lShoulder: [0.4, 2.0 + flail * 0.3],
    rShoulder: [0.4, 2.0 - flail * 0.3],
    lElbow: 0.6,
    rElbow: 0.6,
    lHip: [0.3 * flail, 0.1],
    rHip: [-0.3 * flail, 0.1],
    lKnee: 0.4,
    rKnee: 0.4,
  });
  const base = groundedBob(pose);
  const cam = lerpCam({ position: [1.4, 2.6, 16], target: [0, 4.4, -4] }, { position: [1.2, 2.4, 14.5], target: [0, 4.8, -4] }, lt / 2.5);
  return (
    <Stage mood="night" dust={1} camera={cam} fog={[25, 120]} shake={0.3} shakeSeed="c8">
      <Street />
      <Hero pose={{ ...pose, bob: base + lift }} position={HERO_AT} />
      {Array.from({ length: 14 }, (_, i) => {
        const x = (random(`lx${i}`) - 0.5) * 9;
        const z = -2 - random(`lz${i}`) * 14;
        const s = 0.15 + random(`ls${i}`) * 0.3;
        const y = s / 2 + Math.max(0, lt - random(`lt${i}`) * 1.2) * (1.5 + random(`lv${i}`) * 2.5);
        return (
          <mesh key={i} position={[x, y, z]} rotation={[t * 2 + i, t + i, 0]} castShadow>
            <boxGeometry args={[s, s * 0.7, s * 1.2]} />
            <meshLambertMaterial color={P.bldgSlate} flatShading />
          </mesh>
        );
      })}
    </Stage>
  );
};

const c8Break: ShotFn = ({ lt, dur, t }) => {
  const earth: V3 = [0, -3.4, 0];
  const bh: V3 = [0, 2.6, 0];
  const cam = lerpCam({ position: [0, -0.2, 21], target: [0, -0.4, 0] }, { position: [0, 0, 18], target: [0, -0.2, 0] }, lt / 3);
  return (
    <Stage mood="space" camera={cam} fog={false} shadows={false} dust={0.15}>
      <EarthBreakup position={earth} target={bh} progress={ease(lt / Math.max(1.5, dur + 0.5))} t={t} />
      <BlackHole position={bh} facing={cam.position} marker={false} coreRadius={0.12} />
      <AccretionDisk position={bh} t={t} inner={0.3} outer={1.6 * ease(lt / 2)} chunks={60} brightness={0.8} />
    </Stage>
  );
};

// ---------------------------------------------------------------- 09 WHAT'S LEFT

const c9Wide: ShotFn = ({ lt, t }) => {
  const a = 0.4 + lt * 0.12;
  const cam: CameraSpec = { position: [Math.sin(a) * 16, 4.5, Math.cos(a) * 16], target: [0, 0.2, 0] };
  return (
    <Stage mood="space" camera={cam} fog={false} shadows={false}>
      <AccretionDisk t={t} inner={0.55} outer={4.2} chunks={320} rotation={[0.1, 0, 0.08]} />
    </Stage>
  );
};

const c9Core: ShotFn = ({ lt, t }) => {
  const cam = lerpCam({ position: [0.6, 2.6, 9], target: [0, 0.2, 0] }, { position: [0.5, 2.2, 7.6], target: [0, 0.2, 0] }, lt / 2.5);
  return (
    <AbsoluteFill>
      <Stage mood="space" camera={cam} fog={false} shadows={false}>
        <AccretionDisk t={t} inner={0.55} outer={4.2} chunks={320} rotation={[0.1, 0, 0.08]} />
        <BlackHole position={[0, 0, 0]} facing={cam.position} coreRadius={0.01} markerRadius={0.42} spin={t * 0.4} />
      </Stage>
      <CardLine text="STILL ONLY 1.8 CM" sub="THE BLACK HOLE ITSELF" y={1090} appearFrame={-9999} />
    </AbsoluteFill>
  );
};

const c9Slow: ShotFn = ({ lt, t }) => {
  const a = 1.1 + lt * 0.1;
  const cam: CameraSpec = { position: [Math.sin(a) * 22, 9, Math.cos(a) * 22], target: [0, -0.5, 0] };
  return (
    <AbsoluteFill>
      <Stage mood="space" camera={cam} fog={false} shadows={false}>
        <AccretionDisk t={t} inner={0.55} outer={4.2} chunks={320} rotation={[0.1, 0, 0.08]} />
      </Stage>
      <CardLine text="MILLIONS OF YEARS" sub="TO SWALLOW IT ALL" y={1090} appearFrame={-9999} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- OUTRO

const outroRelief: ShotFn = ({ lt }) => {
  const pose = grounded(lerpPose(mergePose(REST, { expression: "alarm" }), mergePose(REST, { expression: "relief", lShoulder: [0, 0.05], rShoulder: [0, 0.05], lElbow: 0.05, rElbow: 0.05, headPitch: -0.08 }), ease(lt / 0.8)));
  const cam = lerpCam({ position: [1.0, 3.2, 12.5], target: [0.2, 3.0, 0] }, { position: [0.9, 3.2, 11], target: [0.2, 3.0, 0] }, lt / 2.5);
  return (
    <Stage mood="night" camera={cam} fog={[40, 200]}>
      <Street />
      <Car position={[-1.7, 0, -16]} color={P.carTeal} />
      <Hero pose={pose} position={HERO_AT} />
    </Stage>
  );
};

const outroFar: ShotFn = ({ lt, t }) => {
  const cam = { position: [0, 0, 30] as V3, target: [0, 0, 0] as V3 };
  const g = ease(lt / 1.4);
  const from: V3 = [-2.6, -6.5, 0];
  const to: V3 = [2.4, 7.5, 0];
  const end: V3 = [from[0] + (to[0] - from[0]) * g, from[1] + (to[1] - from[1]) * g, 0];
  return (
    <AbsoluteFill>
      <Stage mood="space" camera={cam} fog={false} shadows={false}>
        <FacetedEarth radius={1.4} position={from} rotation={[0.35, 1.3 + t * 0.08, 0]} />
        <DashedLine from={[from[0] + 0.5, from[1] + 1.5, 0]} to={end} color={P.amber} dash={0.25} gap={0.18} />
        {g > 0.95 ? <BlackHole position={to} facing={cam.position} markerRadius={0.6} spin={t * 0.3} /> : null}
      </Stage>
      {g > 0.95 ? <PinnedLabel at={to} cam={cam} text="GAIA BH1" sub="~1,560 LIGHT-YEARS" dx={-250} dy={10} /> : null}
    </AbsoluteFill>
  );
};

const outroMoon: ShotFn = ({ lt, t }) => {
  const pose = grounded(mergePose(lookUp(1), { expression: "smile" }));
  return (
    <Stage mood="night" camera={lerpCam(STREET_WIDE, { position: [0.5, 2.6, 19.5], target: [0, 6.6, -10] }, lt / 4)} fog={[40, 200]}>
      <Street />
      <Car position={[-1.7, 0, -16]} color={P.carTeal} />
      <Hero pose={pose} position={HERO_AT} />
      <FacetedMoon radius={13} position={[-1, 21, -80]} rotation={[0.2, 0.8 + t * 0.02, 0]} />
    </Stage>
  );
};

// ---------------------------------------------------------------- shot list

/** Shots per narration block. `cue` = phrase (searched within the block) where the shot starts; null = block start. */
export const SHOTS: Record<string, { cue: string | null; fn: ShotFn }[]> = {
  cold: [
    { cue: null, fn: coldWide },
    { cue: "suddenly appeared", fn: coldClose },
  ],
  c1: [
    { cue: null, fn: c1Street },
    { cue: "Just a", fn: c1Appear },
    { cue: "crushed", fn: c1Marble },
    { cue: "about as", fn: c1Diagram },
  ],
  c2: [
    { cue: null, fn: c2Binoculars },
    { cue: "It gives", fn: c2Pov },
    { cue: "Only giant", fn: c2Dome },
    { cue: "behind it", fn: c2Lens },
  ],
  c3: [
    { cue: null, fn: c3Tug },
    { cue: "It pulls", fn: c3Arrows },
    { cue: "so we", fn: c3Fall },
    { cue: "Impact:", fn: c3Impact },
  ],
  c4: [
    { cue: null, fn: c4Walk },
    { cue: "You'd feel", fn: c4Bulge },
    { cue: "Its tides", fn: c4Coast },
    { cue: "and twice", fn: c4Flood },
  ],
  c5: [
    { cue: null, fn: c5Swing },
    { cue: "gets flung", fn: c5Wave },
  ],
  c6: [
    { cue: null, fn: c6Aerial },
    { cue: "The ground", fn: c6Crack },
    { cue: "Earthquakes", fn: c6Quake },
    { cue: "Volcanoes", fn: c6Volcano },
  ],
  c7: [
    { cue: null, fn: c7First },
    { cue: "The second", fn: c7Second },
    { cue: "fifteen hours", fn: c7Street },
  ],
  c8: [
    { cue: null, fn: c8Lift },
    { cue: "and our planet", fn: c8Break },
  ],
  c9: [
    { cue: null, fn: c9Wide },
    { cue: "swirling", fn: c9Core },
    { cue: "Swallowing", fn: c9Slow },
  ],
  outro: [
    { cue: null, fn: outroRelief },
    { cue: "The closest", fn: outroFar },
    { cue: "For now", fn: outroMoon },
  ],
};

export { T_FALL_DAYS };
