/**
 * Low-poly animals: one quadruped rig with presets (dog, deer, fox, wolf).
 * Faces +Z; feet on y=0. `walk` is the gait phase in cycles (0 = standing).
 */
import React from "react";
import type { V3 } from "./noise";
import { Flat } from "./materials";

export type AnimalKind = "dog" | "deer" | "fox" | "wolf";

const PRESET: Record<
  AnimalKind,
  { body: [number, number, number]; leg: number; legW: number; head: [number, number, number]; neck: number; color: string; belly: string; ears: "pointy" | "floppy" | "none"; antlers?: boolean; tail: number }
> = {
  dog: { body: [0.5, 0.45, 1.0], leg: 0.45, legW: 0.14, head: [0.36, 0.34, 0.42], neck: 0.18, color: "#B07A45", belly: "#E3C9A0", ears: "floppy", tail: 0.4 },
  deer: { body: [0.55, 0.6, 1.3], leg: 0.95, legW: 0.11, head: [0.3, 0.32, 0.5], neck: 0.55, color: "#9A6A42", belly: "#E8D6B8", ears: "pointy", antlers: true, tail: 0.15 },
  fox: { body: [0.36, 0.34, 0.85], leg: 0.32, legW: 0.1, head: [0.3, 0.26, 0.38], neck: 0.12, color: "#D46A2A", belly: "#F2E6D8", ears: "pointy", tail: 0.6 },
  wolf: { body: [0.55, 0.5, 1.2], leg: 0.6, legW: 0.15, head: [0.36, 0.34, 0.5], neck: 0.2, color: "#7E7A78", belly: "#C9C4BE", ears: "pointy", tail: 0.55 },
};

export const Animal: React.FC<{
  kind: AnimalKind;
  position: V3;
  yaw?: number;
  scale?: number;
  walk?: number;
  /** + looks up, − looks down (grazing). */
  headPitch?: number;
  /** Sitting (dog at a window). */
  sit?: boolean;
}> = ({ kind, position, yaw = 0, scale = 1, walk = 0, headPitch = 0, sit = false }) => {
  const k = PRESET[kind];
  const [bw, bh, bl] = k.body;
  const s = Math.sin(walk * Math.PI * 2);
  const legSwing = walk ? 0.45 * s : 0;
  const bob = walk ? Math.abs(s) * 0.03 : 0;
  const hipY = k.leg;
  const bodyPitch = sit ? -0.55 : 0;
  const legs: [number, number, number][] = [
    [bw / 2 - k.legW / 2, bl / 2 - 0.12, legSwing],
    [-(bw / 2 - k.legW / 2), bl / 2 - 0.12, -legSwing],
    [bw / 2 - k.legW / 2, -bl / 2 + 0.12, -legSwing],
    [-(bw / 2 - k.legW / 2), -bl / 2 + 0.12, legSwing],
  ];
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      <group position={[0, (sit ? hipY * 0.55 : hipY) + bob, 0]} rotation={[bodyPitch, 0, 0]}>
        <mesh position={[0, bh / 2, 0]} castShadow>
          <boxGeometry args={[bw, bh, bl]} />
          <Flat color={k.color} />
        </mesh>
        <mesh position={[0, bh * 0.12, 0]} castShadow>
          <boxGeometry args={[bw * 0.85, bh * 0.25, bl * 0.8]} />
          <Flat color={k.belly} />
        </mesh>
        {/* tail */}
        <mesh position={[0, bh * 0.8, -bl / 2 - k.tail * 0.4]} rotation={[0.9, 0, 0]} castShadow>
          <boxGeometry args={[0.1, 0.1, k.tail]} />
          <Flat color={kind === "fox" ? "#F2E6D8" : k.color} />
        </mesh>
        {/* neck + head */}
        <group position={[0, bh * 0.75, bl / 2 - 0.05]} rotation={[-0.6 + (sit ? 0.55 : 0), 0, 0]}>
          <mesh position={[0, k.neck / 2, 0]} castShadow>
            <boxGeometry args={[k.head[0] * 0.7, k.neck + 0.1, k.head[0] * 0.7]} />
            <Flat color={k.color} />
          </mesh>
          <group position={[0, k.neck, 0]} rotation={[0.6 - headPitch, 0, 0]}>
            <mesh position={[0, 0, k.head[2] / 2 - 0.05]} castShadow>
              <boxGeometry args={k.head} />
              <Flat color={k.color} />
            </mesh>
            <mesh position={[0, -k.head[1] * 0.15, k.head[2] - 0.02]} castShadow>
              <boxGeometry args={[k.head[0] * 0.55, k.head[1] * 0.5, k.head[2] * 0.4]} />
              <Flat color={k.belly} />
            </mesh>
            <mesh position={[0, -k.head[1] * 0.05, k.head[2] + 0.07]}>
              <boxGeometry args={[0.07, 0.06, 0.04]} />
              <Flat color="#1A1414" />
            </mesh>
            {[1, -1].map((sx) => (
              <React.Fragment key={sx}>
                <mesh position={[sx * k.head[0] * 0.3, k.head[1] * 0.18, k.head[2] * 0.6]}>
                  <boxGeometry args={[0.05, 0.05, 0.03]} />
                  <Flat color="#141018" />
                </mesh>
                {k.ears !== "none" ? (
                  <mesh
                    position={[sx * k.head[0] * 0.35, k.head[1] / 2 + (k.ears === "pointy" ? 0.08 : -0.02), k.head[2] * 0.15]}
                    rotation={[0, 0, k.ears === "floppy" ? sx * 0.9 : sx * -0.15]}
                  >
                    {k.ears === "pointy" ? <coneGeometry args={[0.07, 0.18, 4]} /> : <boxGeometry args={[0.08, 0.2, 0.14]} />}
                    <Flat color={k.color} />
                  </mesh>
                ) : null}
                {k.antlers ? (
                  <group position={[sx * 0.1, k.head[1] / 2, 0]} rotation={[0, 0, sx * -0.35]}>
                    <mesh position={[0, 0.25, 0]}>
                      <boxGeometry args={[0.04, 0.5, 0.04]} />
                      <Flat color="#D8C8A8" />
                    </mesh>
                    <mesh position={[sx * 0.1, 0.38, 0.06]} rotation={[0, 0, sx * -0.8]}>
                      <boxGeometry args={[0.035, 0.25, 0.035]} />
                      <Flat color="#D8C8A8" />
                    </mesh>
                  </group>
                ) : null}
              </React.Fragment>
            ))}
          </group>
        </group>
      </group>
      {/* legs: pivot at the hip, feet on the ground */}
      {legs.map(([x, z, swing], i) => {
        const front = i < 2;
        const sitting = sit && !front;
        return (
          <group key={i} position={[x, sit ? (front ? hipY : hipY * 0.35) : hipY + bob, z * (sit && !front ? 0.6 : 1)]} rotation={[sitting ? -1.4 : swing, 0, 0]}>
            <mesh position={[0, -(sitting ? hipY * 0.35 : hipY) / 2, 0]} castShadow>
              <boxGeometry args={[k.legW, sitting ? hipY * 0.35 : hipY, k.legW]} />
              <Flat color={k.color} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
