/**
 * Shared helpers for the long-form (16:9) shots of "What If You Were the Last Human on Earth?".
 * Long-form pacing: shots run up to ~6 s, so camera moves use the shot's real length (capped at 7 s).
 */
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill } from "remotion";
import { StreetSet } from "../../../slavoski/city";
import { clamp01, ease, type V3 } from "../../../slavoski/noise";
import { mergePose, REST, walkPose, type Pose } from "../../../slavoski/rig/Hero";
import { lerpCam, Stage, type CameraSpec } from "../../../slavoski/Stage";
import { Clouds } from "../../../slavoski/nature";

export type ShotCtx = { lt: number; dur: number; t: number; words: Caption[]; width: number; height: number };
export type ShotFn = (c: ShotCtx) => React.ReactNode;

export const span = (dur: number) => Math.min(Number.isFinite(dur) ? dur : 4, 7);
/** Camera from a to b over the whole shot. */
export const move = (a: CameraSpec, b: CameraSpec, c: ShotCtx) => lerpCam(a, b, c.lt / span(c.dur));
/** Linear 0..1 over the whole shot. */
export const prog = (c: ShotCtx) => clamp01(c.lt / span(c.dur));
/** Eased 0..1 between local times a and b. */
export const k01 = (lt: number, a: number, b: number) => ease(clamp01((lt - a) / (b - a)));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Kit street ×3.5 so it matches Slavoski (road |x| < 12.25, pavements to 21.35). `day` dims practicals. */
export const CITY = 3.5;
export const BigStreet: React.FC<React.ComponentProps<typeof StreetSet> & { day?: boolean; power?: number }> = ({ day = false, power, ...props }) => (
  <group scale={CITY}>
    <StreetSet
      {...props}
      lampsOn={day ? false : props.lampsOn}
      modify={(sp, i) => ({ ...(day ? { power: 0.3 } : {}), ...(power !== undefined ? { power } : {}), ...(props.modify?.(sp, i) ?? {}) })}
    />
  </group>
);

export const Shot: React.FC<{ children: React.ReactNode; overlay?: React.ReactNode } & React.ComponentProps<typeof Stage>> = ({ children, overlay, ...stage }) => (
  <AbsoluteFill>
    <Stage {...stage}>{children}</Stage>
    {overlay}
  </AbsoluteFill>
);

export const CLOUD = { day: "#F4F6FA", dawn: "#D9C3D6", sunset: "#F7C0A0", storm: "#3E4656", overcast: "#AEB6C2", snow: "#DCE3EC", night: "#3A4060" } as const;
export const Sky: React.FC<{ t: number; tint: keyof typeof CLOUD; y?: number; radius?: number; count?: number; seed?: string; scale?: number }> = ({
  t,
  tint,
  y = 45,
  radius = 220,
  count = 18,
  seed = "sky",
  scale,
}) => <Clouds t={t} color={CLOUD[tint]} y={y} radius={radius} count={count} seed={seed} scale={scale} />;

/** Slavoski walking along +Z (yaw rotates it), feet on the ground; phase advances with distance. */
export const walking = (lt: number, speed = 1.7, over: Partial<Pose> = {}): { pose: Pose; dist: number } => {
  const dist = lt * speed;
  return { pose: mergePose(walkPose(dist / 2.2), over), dist };
};

export const standing = (over: Partial<Pose> = {}): Pose => mergePose(REST, over);
