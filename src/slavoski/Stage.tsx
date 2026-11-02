import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { shake, type V3 } from "./noise";
import { P } from "./palette";

export type Mood = "night" | "dust" | "space";

export type CameraSpec = {
  position: V3;
  target: V3;
  /** Optional up vector to roll the camera. */
  up?: V3;
  fov?: number;
};

const SKY: Record<Mood, { sky: string; glow: string }> = {
  night: { sky: P.nightSky, glow: P.nightSkyGlow },
  dust: { sky: P.dustSky, glow: P.dustSkyGlow },
  space: { sky: P.space, glow: P.spaceGlow },
};

const CameraRig: React.FC<CameraSpec & { offset: V3 }> = ({ position, target, up, fov, offset }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(position[0] + offset[0], position[1] + offset[1], position[2] + offset[2]);
    camera.up.set(...(up ?? [0, 1, 0]));
    camera.lookAt(target[0] + offset[0] * 0.5, target[1] + offset[1] * 0.5, target[2]);
    camera.fov = fov ?? 40;
    camera.updateProjectionMatrix();
  });
  return null;
};

/** Faint seeded star field on a big sphere (not affected by fog). */
export const Stars: React.FC<{ count?: number; radius?: number; seed?: string; size?: number; opacity?: number }> = ({
  count = 900,
  radius = 900,
  seed = "stars",
  size = 2.2,
  opacity = 0.7,
}) => {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    let h = 0;
    for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const rnd = () => {
      h = (Math.imul(h ^ (h >>> 15), 2246822519) + 0x6d2b79f5) >>> 0;
      return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
    };
    for (let i = 0; i < count; i++) {
      const u = rnd() * 2 - 1;
      const th = rnd() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      pos.set([r * Math.cos(th) * radius, u * radius, r * Math.sin(th) * radius], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count, radius, seed]);
  return (
    <points geometry={geom}>
      <pointsMaterial color={P.star} size={size} sizeAttenuation={false} transparent opacity={opacity} fog={false} />
    </points>
  );
};

const Lights: React.FC<{ mood: Mood; keyDir?: V3; shadowSize?: number; shadows: boolean }> = ({
  mood,
  keyDir,
  shadowSize = 40,
  shadows,
}) => {
  const cfg = {
    night: { hs: "#C4CCFF", hg: "#2E2840", hi: 2.4, dc: "#D6DCFF", di: 1.4, dir: [-0.5, 1, 0.45] as V3 },
    dust: { hs: "#E6C2C4", hg: "#3A2A30", hi: 2.2, dc: "#FFC59A", di: 1.15, dir: [0.6, 0.8, 0.4] as V3 },
    space: { hs: "#D6E0FF", hg: "#1C1830", hi: 1.4, dc: "#FFFFFF", di: 2.2, dir: [-0.7, 0.5, 0.6] as V3 },
  }[mood];
  const d = keyDir ?? cfg.dir;
  const len = Math.hypot(...d);
  const dist = 60;
  return (
    <>
      <hemisphereLight args={[cfg.hs, cfg.hg, cfg.hi]} />
      <directionalLight
        color={cfg.dc}
        intensity={cfg.di}
        position={[(d[0] / len) * dist, (d[1] / len) * dist, (d[2] / len) * dist]}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-shadowSize}
        shadow-camera-right={shadowSize}
        shadow-camera-top={shadowSize}
        shadow-camera-bottom={-shadowSize}
        shadow-camera-near={1}
        shadow-camera-far={160}
      />
    </>
  );
};

export type StageProps = {
  camera: CameraSpec;
  mood?: Mood;
  /** Camera shake amplitude in world units. */
  shake?: number;
  shakeSeed?: string;
  stars?: boolean;
  /** [near, far] fog distances in the sky colour, or false. */
  fog?: [number, number] | false;
  /** Override key light direction. */
  keyDir?: V3;
  shadows?: boolean;
  shadowSize?: number;
  /** 0..1 blend of the sky toward the dusty disaster sky. */
  dust?: number;
  children: React.ReactNode;
  /** HTML overlays drawn above the canvas but under the vignette. */
  overlay?: React.ReactNode;
};

const mixHex = (a: string, b: string, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), t).getStyle();

/** A shot: sky gradient, 3D canvas with house lighting and camera, vignette. */
export const Stage: React.FC<StageProps> = ({
  camera,
  mood = "night",
  shake: shakeAmp = 0,
  shakeSeed = "cam",
  stars = true,
  fog = [40, 220],
  keyDir,
  shadows = true,
  shadowSize,
  dust = 0,
  children,
  overlay,
}) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const base = SKY[mood];
  const sky = dust > 0 ? mixHex(base.sky, P.dustSky, dust) : base.sky;
  const glow = dust > 0 ? mixHex(base.glow, P.dustSkyGlow, dust) : base.glow;
  const offset = shake(shakeSeed, frame / fps, shakeAmp);
  const lightMood: Mood = mood === "night" && dust > 0.5 ? "dust" : mood;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 60% at 50% 42%, ${glow} 0%, ${sky} 70%)` }}>
      <ThreeCanvas
        width={width}
        height={height}
        flat
        shadows={shadows ? "percentage" : false}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        camera={{ fov: camera.fov ?? 40, near: 0.1, far: 3000, position: camera.position }}
      >
        <CameraRig {...camera} offset={offset} />
        {fog ? <fog attach="fog" args={[sky, fog[0], fog[1]]} /> : null}
        <Lights mood={lightMood} keyDir={keyDir} shadows={shadows} shadowSize={shadowSize} />
        {stars ? <Stars opacity={mood === "space" ? 0.8 : 0.55 * (1 - dust * 0.6)} /> : null}
        {children}
      </ThreeCanvas>
      {overlay}
      <Vignette />
    </AbsoluteFill>
  );
};

/** Project a world point to pixel coordinates for a given camera (to pin HTML labels to 3D points). */
export const project = (p: V3, cam: CameraSpec, width: number, height: number): { x: number; y: number } => {
  const c = new THREE.PerspectiveCamera(cam.fov ?? 40, width / height, 0.1, 3000);
  c.position.set(...cam.position);
  c.up.set(...(cam.up ?? [0, 1, 0]));
  c.lookAt(...cam.target);
  c.updateMatrixWorld();
  const v = new THREE.Vector3(...p).project(c);
  return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height };
};

/** Ease between two camera specs. */
export const lerpCam = (a: CameraSpec, b: CameraSpec, t: number): CameraSpec => {
  const k = Math.max(0, Math.min(1, t));
  const s = k * k * (3 - 2 * k);
  const L = (x: V3, y: V3): V3 => [x[0] + (y[0] - x[0]) * s, x[1] + (y[1] - x[1]) * s, x[2] + (y[2] - x[2]) * s];
  return { position: L(a.position, b.position), target: L(a.target, b.target), fov: (a.fov ?? 40) + ((b.fov ?? 40) - (a.fov ?? 40)) * s, up: a.up };
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.55 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse 75% 65% at 50% 48%, rgba(0,0,0,0) 55%, rgba(4,4,12,${strength}) 100%)`,
    }}
  />
);
