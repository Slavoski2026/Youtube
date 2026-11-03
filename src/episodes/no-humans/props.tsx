/** Props for "What If Every Human on Earth Suddenly Disappeared?". */
import React, { useMemo } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { FloodWater } from "../../slavoski/fx";
import { Flat, Glow } from "../../slavoski/materials";
import { clamp01, ease, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { Animal } from "../../slavoski/animals";

/** Phone: 0.4 × 0.06 × 0.8 slab with a lit screen. Rests on the ground at y = 0.03. */
export const Phone: React.FC<{ position: V3; rotation?: V3; screenOn?: boolean }> = ({ position, rotation = [0, 0, 0], screenOn = true }) => (
  <group position={position} rotation={rotation}>
    <mesh castShadow>
      <boxGeometry args={[0.4, 0.06, 0.8]} />
      <Flat color="#15161C" />
    </mesh>
    <mesh position={[0, 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.34, 0.7]} />
      {screenOn ? <Glow color="#8FD0FF" /> : <Flat color="#0A0B10" />}
    </mesh>
  </group>
);

/** Burst of pale-blue cubes where Slavoski vanished. progress 0..1. */
export const VanishPuff: React.FC<{ center: V3; progress: number; seed?: string }> = ({ center, progress, seed = "puff" }) => {
  if (progress <= 0 || progress >= 1) return null;
  const k = ease(progress);
  return (
    <group position={center}>
      {Array.from({ length: 26 }, (_, i) => {
        const th = random(`${seed}t${i}`) * Math.PI * 2;
        const ph = Math.acos(random(`${seed}p${i}`) * 2 - 1);
        const r = (0.6 + random(`${seed}r${i}`) * 1.6) * k;
        const s = 0.16 * (1 - k) + 0.02;
        return (
          <mesh key={i} position={[Math.sin(ph) * Math.cos(th) * r, Math.max(-center[1] + 0.1, Math.cos(ph) * r * 1.4), Math.sin(ph) * Math.sin(th) * r]} rotation={[k * 4 + i, k * 3, 0]}>
            <boxGeometry args={[s, s, s]} />
            <Glow color={i % 3 ? P.ghost : "#FFFFFF"} opacity={1 - k} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Subway tunnel along -Z: arched walls, rails, sleepers, wall lights (`lights` 0..1) and rising `water`. */
export const SubwayTunnel: React.FC<{ length?: number; water: number; lights: number; t: number }> = ({ length = 80, water, lights, t }) => {
  const arch = useMemo(() => {
    const g = new THREE.CylinderGeometry(3.4, 3.4, length, 10, 1, true, -Math.PI / 2, Math.PI);
    g.rotateX(Math.PI / 2);
    g.rotateZ(Math.PI / 2);
    return g;
  }, [length]);
  return (
    <group>
      <mesh geometry={arch} position={[0, 0, -length / 2]} receiveShadow>
        <meshLambertMaterial color="#3E4250" flatShading side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, -0.05, -length / 2]} receiveShadow>
        <boxGeometry args={[6.8, 0.1, length]} />
        <Flat color="#2A2C34" />
      </mesh>
      {[-0.75, 0.75].map((x) => (
        <mesh key={x} position={[x, 0.08, -length / 2]}>
          <boxGeometry args={[0.1, 0.12, length]} />
          <Flat color="#8A8E98" />
        </mesh>
      ))}
      {Array.from({ length: Math.floor(length / 1.2) }, (_, i) => (
        <mesh key={i} position={[0, 0.02, -i * 1.2]}>
          <boxGeometry args={[2.2, 0.06, 0.25]} />
          <Flat color="#4A3A30" />
        </mesh>
      ))}
      {Array.from({ length: Math.floor(length / 8) }, (_, i) => {
        const on = random(`tl${i}`) < lights;
        return (
          <mesh key={i} position={[i % 2 ? 3.0 : -3.0, 2.3, -4 - i * 8]}>
            <boxGeometry args={[0.15, 0.25, 0.9]} />
            {on ? <Glow color="#FFE3A0" /> : <Flat color="#2A2A30" />}
          </mesh>
        );
      })}
      <FloodWater level={water} t={t} size={[6.6, length]} position={[0, 0, -length / 2]} flow={1.5} />
    </group>
  );
};

/** A small house front (wall at z = 0, facing +Z) with a window; a dog sits inside looking out. */
export const HouseWithDog: React.FC<{ position?: V3; t: number; lit?: boolean }> = ({ position = [0, 0, 0], t, lit = false }) => {
  const wallC = "#6A5A72";
  const W = 7, H = 4.4, winW = 1.8, winH = 1.5, sill = 1.25;
  const side = (W - winW) / 2;
  return (
    <group position={position}>
      {/* front wall around the window opening */}
      <mesh position={[-(winW / 2 + side / 2), H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[side, H, 0.3]} />
        <Flat color={wallC} />
      </mesh>
      <mesh position={[winW / 2 + side / 2, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[side, H, 0.3]} />
        <Flat color={wallC} />
      </mesh>
      <mesh position={[0, sill / 2, 0]} receiveShadow>
        <boxGeometry args={[winW, sill, 0.3]} />
        <Flat color={wallC} />
      </mesh>
      <mesh position={[0, (sill + winH + H) / 2, 0]} receiveShadow>
        <boxGeometry args={[winW, H - sill - winH, 0.3]} />
        <Flat color={wallC} />
      </mesh>
      {/* window frame */}
      <mesh position={[0, sill + winH / 2, 0.16]}>
        <boxGeometry args={[0.08, winH, 0.04]} />
        <Flat color="#E6E0D4" />
      </mesh>
      <mesh position={[0, sill - 0.04, 0.2]}>
        <boxGeometry args={[winW + 0.3, 0.1, 0.25]} />
        <Flat color="#E6E0D4" />
      </mesh>
      {/* roof */}
      <mesh position={[0, H + 1.1, -2]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[5.3, 2.2, 4]} />
        <Flat color="#3A2E3A" />
      </mesh>
      {/* interior: dark room, back wall and a sofa the dog sits on */}
      <mesh position={[0, H / 2, -4]}>
        <boxGeometry args={[W - 0.2, H, 0.2]} />
        <Flat color={lit ? "#5A4A3A" : "#1A1824"} />
      </mesh>
      <mesh position={[0, 0.3, -1.2]}>
        <boxGeometry args={[2.6, 0.6, 1.2]} />
        <Flat color="#3A4A6A" />
      </mesh>
      <Animal kind="dog" position={[0, 0.6, -1.25]} sit headPitch={0.15 + Math.sin(t * 0.8) * 0.08} />
    </group>
  );
};

/** Weathered stone pyramid, partly buried (`bury` 0..1) and covered by vines (`vines` 0..1). */
export const Pyramid: React.FC<{ position: V3; size?: number; bury?: number; vines?: number }> = ({ position, size = 10, bury = 0.15, vines = 0.4 }) => (
  <group position={[position[0], position[1] - bury * size * 0.7, position[2]]}>
    <mesh position={[0, size * 0.35, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
      <coneGeometry args={[size * 0.75, size * 0.7, 4, 3]} />
      <Flat color={P.stone} />
    </mesh>
    {Array.from({ length: Math.round(vines * 14) }, (_, i) => {
      const a = (i / 14) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * size * 0.45, size * 0.12, Math.sin(a) * size * 0.45]} rotation={[0, -a, 0]} castShadow>
          <icosahedronGeometry args={[size * 0.12, 0]} />
          <Flat color={i % 2 ? P.leaf : P.moss} />
        </mesh>
      );
    })}
  </group>
);

export const Obelisk: React.FC<{ position: V3; height?: number; lean?: number }> = ({ position, height = 9, lean = 0.08 }) => (
  <group position={position} rotation={[0, 0.3, lean]}>
    <mesh position={[0, height / 2, 0]} castShadow>
      <cylinderGeometry args={[0.45, 0.75, height, 4]} />
      <Flat color={P.stoneDark} />
    </mesh>
    <mesh position={[0, height + 0.45, 0]} castShadow>
      <coneGeometry args={[0.5, 0.9, 4]} />
      <Flat color={P.stoneDark} />
    </mesh>
  </group>
);

/** A plastic bottle half-buried in a sediment layer (sediment top at y = 0). */
export const BuriedBottle: React.FC<{ position: V3; rotation?: V3 }> = ({ position, rotation = [0.3, 0.4, 1.2] }) => (
  <group position={position} rotation={rotation}>
    <mesh>
      <cylinderGeometry args={[0.32, 0.32, 1.6, 10]} />
      <meshLambertMaterial color="#7FC8E8" transparent opacity={0.75} flatShading />
    </mesh>
    <mesh position={[0, 1.0, 0]}>
      <cylinderGeometry args={[0.13, 0.32, 0.45, 10]} />
      <meshLambertMaterial color="#7FC8E8" transparent opacity={0.75} flatShading />
    </mesh>
    <mesh position={[0, 1.3, 0]}>
      <cylinderGeometry args={[0.15, 0.15, 0.18, 10]} />
      <Flat color="#2A7FD0" />
    </mesh>
    <mesh position={[0, 0.1, 0]}>
      <cylinderGeometry args={[0.33, 0.33, 0.5, 10]} />
      <Flat color="#E8483A" />
    </mesh>
  </group>
);

/** Rolling low-poly hills covering where a city was. */
export const Hills: React.FC<{ seed?: string; count?: number; spread?: number }> = ({ seed = "hills", count = 14, spread = 60 }) => (
  <group>
    {Array.from({ length: count }, (_, i) => {
      const x = (random(`${seed}x${i}`) - 0.5) * spread;
      const z = -random(`${seed}z${i}`) * spread;
      const r = 4 + random(`${seed}r${i}`) * 7;
      return (
        <mesh key={i} position={[x, -r * 0.55, z]} scale={[1.4, 0.75, 1.2]} receiveShadow castShadow>
          <icosahedronGeometry args={[r, 1]} />
          <Flat color={i % 3 ? P.grass : P.leafDark} />
        </mesh>
      );
    })}
  </group>
);

/** Layered ground cross-section (sediment over old rubble) for the "buried by time" insert. */
export const SedimentLayers: React.FC<{ width?: number; depth?: number }> = ({ width = 14, depth = 6 }) => {
  const layers = [
    { h: 0.5, c: P.grass },
    { h: 1.2, c: P.sediment },
    { h: 0.8, c: "#594A3A" },
    { h: 1.0, c: "#4A3E33" },
  ];
  let y = 0;
  return (
    <group>
      {layers.map((l, i) => {
        const top = y;
        y -= l.h;
        return (
          <mesh key={i} position={[0, top - l.h / 2, 0]} receiveShadow>
            <boxGeometry args={[width, l.h, depth]} />
            <Flat color={l.c} />
          </mesh>
        );
      })}
    </group>
  );
};

export { clamp01 };
