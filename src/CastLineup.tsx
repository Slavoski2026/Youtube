/**
 * A cast check: men, women and a girl from the look generators in `slavoski/hero.ts`, front row facing the
 * camera, back row seated, with Slavoski in the middle for scale.
 *   npx remotion still build CastLineup out/cast.png --gl=swangle
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { Ground } from "./slavoski/city";
import { girlLook, manLook, suitFor, womanLook, type HeroLook } from "./slavoski/hero";
import { Hero, mergePose, REST } from "./slavoski/rig/Hero";
import { sittingPose } from "./slavoski/room";
import { Stage } from "./slavoski/Stage";

export type CastLineupProps = { seed?: number; close?: boolean };

export const CastLineup: React.FC<CastLineupProps> = ({ seed = 0, close = false }) => {
  const front: { look?: HeroLook; scale?: number; expr?: "smile" | "neutral" | "deadpan" }[] = [
    { look: womanLook(seed + 1), expr: "smile" },
    { look: manLook(seed + 2) },
    { look: womanLook(seed + 3) },
    {},
    { look: manLook(seed + 4), expr: "smile" },
    { look: womanLook(seed + 5), expr: "deadpan" },
    { look: girlLook(seed + 6), scale: 0.62, expr: "smile" },
  ];
  const back: HeroLook[] = [manLook(seed + 7), womanLook(seed + 9), suitFor(seed + 10, "f"), suitFor(seed + 11, "m"), womanLook(seed + 13), manLook(seed + 14)];
  return (
    <AbsoluteFill>
      <Stage mood="day" camera={close ? { position: [-1.8, 3.7, 9], target: [-1.8, 3.4, 1] } : { position: [0, 6, 26], target: [0, 3.2, -2], fov: 46 }} fog={false} shadowSize={20}>
        <Ground color="#8E96A6" />
        {front.map((f, i) => (
          <Hero key={i} pose={mergePose(REST, { expression: f.expr ?? "neutral", headYaw: (i - 3) * -0.06 })} position={[(i - 3) * 1.8, 0, 2 - Math.abs(i - 3) * 0.6]} scale={f.scale} look={f.look} />
        ))}
        {back.map((l, i) => (
          <Hero key={i} pose={sittingPose({ lShoulder: [0.4, 0.1], rShoulder: [0.4, 0.1], lElbow: 1.0, rElbow: 1.0 })} position={[(i - 2.5) * 2.2, 3.2, -5]} look={l} />
        ))}
        {/* a bench for the back row (seat 0.7 above its base) */}
        <mesh position={[0, 3.2 + 0.35, -5.1]}>
          <boxGeometry args={[14, 0.7, 1.0]} />
          <meshLambertMaterial color="#7A4A34" flatShading />
        </mesh>
        <mesh position={[0, 1.6, -4.6]}>
          <boxGeometry args={[14, 3.2, 3.0]} />
          <meshLambertMaterial color="#566270" flatShading />
        </mesh>
      </Stage>
    </AbsoluteFill>
  );
};
