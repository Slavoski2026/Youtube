/**
 * Ep. 8 worlds and creatures: the places doors lead to (dunes, Antarctic ice, a tropical beach, a jungle,
 * a neon night city, open ocean, alternate Earths) plus the penguin, a gull, the drone and the visitor.
 *
 * Every world is built around an anchor (the back of a door at `at`, facing `yaw`): the ground is at
 * y = at.y and the world extends toward -Z of that frame, so it can sit inside a <Portal>.
 * Scale: Slavoski is 4.2 tall (1 m ≈ 2.2 units); a door is 2.2 × 4.7.
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { Building } from "../../slavoski/city";
import { BoxG, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { ToonEyes, type Face } from "../../slavoski/critters";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { fbm3, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { Snow } from "../../slavoski/nature";
import { faceColors, RimMaterial } from "../../slavoski/space";
import { SkyDome } from "../../slavoski/portal";
import { Stars } from "../../slavoski/Stage";
import { PalmTree } from "../gta-24h/props";

export type Anchor = { at?: V3; yaw?: number };
/** Rotate a direction about +Y. */
export const rotY = (v: V3, yaw: number): V3 => [v[0] * Math.cos(yaw) + v[2] * Math.sin(yaw), v[1], -v[0] * Math.sin(yaw) + v[2] * Math.cos(yaw)];
const Anchored: React.FC<Anchor & { children: React.ReactNode }> = ({ at = [0, 0, 0], yaw = 0, children }) => (
  <group position={at} rotation={[0, yaw, 0]}>
    {children}
  </group>
);

// ---------------------------------------------------------------- heightfields

/** A flat-shaded heightfield (non-indexed so every facet reads), coloured per face. */
const useTerrain = (size: number, segs: number, height: (x: number, z: number) => number, color: (h: number, slope: number, i: number) => THREE.Color, key: string) =>
  useMemo(() => {
    const g = new THREE.PlaneGeometry(size, size, segs, segs);
    g.rotateX(-Math.PI / 2);
    const pos = g.getAttribute("position");
    for (let i = 0; i < pos.count; i++) pos.setY(i, height(pos.getX(i), pos.getZ(i)));
    const ng = g.toNonIndexed();
    ng.computeVertexNormals();
    const p = ng.getAttribute("position");
    const cols = new Float32Array(p.count * 3);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (let f = 0; f < p.count / 3; f++) {
      a.fromBufferAttribute(p, f * 3);
      b.fromBufferAttribute(p, f * 3 + 1);
      c.fromBufferAttribute(p, f * 3 + 2);
      const n = new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
      const col = color((a.y + b.y + c.y) / 3, 1 - Math.abs(n.y), f);
      for (let k = 0; k < 3; k++) cols.set([col.r, col.g, col.b], (f * 3 + k) * 3);
    }
    ng.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    return ng;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

/** Distance-based ramp: 0 within `r0` of the anchor (a flat spot for the door), 1 beyond `r1`. */
const ramp = (x: number, z: number, r0: number, r1: number) => {
  const d = Math.hypot(x, z);
  const k = Math.max(0, Math.min(1, (d - r0) / (r1 - r0)));
  return k * k * (3 - 2 * k);
};

// ---------------------------------------------------------------- the Sahara

const SAND = [new THREE.Color("#E0B070"), new THREE.Color("#D09A56"), new THREE.Color("#B47A40"), new THREE.Color("#EAC084")];
export const duneHeight = (x: number, z: number, seed = "dune") => {
  const n = fbm3(seed, x * 0.011 + 40, 0, z * 0.011, 3);
  const ridge = 1 - Math.abs(Math.sin(x * 0.034 + z * 0.018 + n * 5));
  return (ridge * ridge * 9 + n * 14 - 7) * ramp(x, z, 7, 46);
};

/** Faceted sand dunes, flat near the anchor, rising to big ridges. */
export const Dunes: React.FC<Anchor & { size?: number; seed?: string; segs?: number }> = ({ at, yaw, size = 520, seed = "dune", segs = 110 }) => {
  const geom = useTerrain(
    size,
    segs,
    (x, z) => duneHeight(x, z, seed),
    (h, slope, i) => {
      const j = 1 + (random(`${seed}j${i}`) - 0.5) * 0.06;
      const base = slope > 0.35 ? SAND[2] : h > 4 ? SAND[3] : slope > 0.18 ? SAND[1] : SAND[0];
      return base.clone().multiplyScalar(j);
    },
    `${seed}${size}${segs}`,
  );
  return (
    <Anchored at={at} yaw={yaw}>
      <mesh geometry={geom} receiveShadow castShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
    </Anchored>
  );
};

/** Low dry shrubs and a few stones scattered on the sand. */
export const DesertScatter: React.FC<Anchor & { seed?: string; count?: number; spread?: number }> = ({ at, yaw, seed = "scat", count = 14, spread = 60 }) => (
  <Anchored at={at} yaw={yaw}>
    {Array.from({ length: count }, (_, i) => {
      const x = (random(`${seed}x${i}`) - 0.5) * spread;
      const z = -6 - random(`${seed}z${i}`) * spread;
      const y = duneHeight(x, z) - 0.1;
      const shrub = i % 3 !== 0;
      return (
        <mesh key={i} position={[x, y + (shrub ? 0.3 : 0.15), z]} scale={shrub ? [1, 0.6, 1] : [1.2, 0.5, 0.9]} castShadow>
          <IcoG args={[shrub ? 0.55 + random(`${seed}s${i}`) * 0.4 : 0.4, shrub ? 1 : 0]} />
          <Flat color={shrub ? "#8A7A3E" : "#A8865A"} />
        </mesh>
      );
    })}
  </Anchored>
);

/** The whole desert for an inner world (dunes, scatter, blazing sky with a white sun). */
export const DesertWorld: React.FC<Anchor & { sky?: boolean }> = ({ at = [0, 0, 0], yaw = 0, sky = true }) => (
  <>
    {sky ? <SkyDome position={at} radius={420} zenith="#2F7FD8" horizon="#F6DDAE" ground="#E2B878" sun={{ dir: rotY([-0.25, 0.55, -1], yaw), color: "#FFF7E0", size: 1.2 }} /> : null}
    <Dunes at={at} yaw={yaw} />
    <DesertScatter at={at} yaw={yaw} />
  </>
);

// ---------------------------------------------------------------- Antarctica

const ICE = [new THREE.Color("#EEF3F9"), new THREE.Color("#DCE7F2"), new THREE.Color("#C6DAEC"), new THREE.Color("#F7FAFD")];
export const iceHeight = (x: number, z: number, seed = "ice") => (fbm3(seed, x * 0.02, 3, z * 0.02, 3) - 0.5) * 6 * ramp(x, z, 8, 40);

export const IceField: React.FC<Anchor & { size?: number; seed?: string }> = ({ at, yaw, size = 480, seed = "ice" }) => {
  const geom = useTerrain(
    size,
    80,
    (x, z) => iceHeight(x, z, seed),
    (_h, slope, i) => (slope > 0.2 ? ICE[2] : ICE[(i * 7) % 2 === 0 ? 0 : 1]).clone().multiplyScalar(1 + (random(`${seed}j${i}`) - 0.5) * 0.04),
    `${seed}${size}`,
  );
  return (
    <Anchored at={at} yaw={yaw}>
      <mesh geometry={geom} receiveShadow castShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
    </Anchored>
  );
};

/** A faceted iceberg / ice ridge (blue-white, glinting). */
export const Iceberg: React.FC<{ position: V3; scale?: V3; seed?: string }> = ({ position, scale = [10, 8, 8], seed = "berg" }) => (
  <group position={position} rotation={[0, random(seed) * Math.PI, 0]}>
    <mesh scale={scale} castShadow receiveShadow>
      <IcoG args={[1, 1]} />
      <Flat color="#D8E8F4" />
    </mesh>
    <mesh position={[scale[0] * 0.3, scale[1] * 0.35, scale[2] * 0.2]} scale={[scale[0] * 0.5, scale[1] * 0.6, scale[2] * 0.5]} castShadow>
      <IcoG args={[1, 0]} />
      <Flat color="#B8D4EA" />
    </mesh>
  </group>
);

/** Ice field, bergs on the horizon, pale sky and drifting snow. */
export const SnowWorld: React.FC<Anchor & { t: number; sky?: boolean; snow?: boolean }> = ({ at = [0, 0, 0], yaw = 0, t, sky = true, snow = true }) => (
  <>
    {sky ? <SkyDome position={at} radius={420} zenith="#8FA6C4" horizon="#E6EDF5" ground="#E4EAF2" /> : null}
    <IceField at={at} yaw={yaw} />
    <Anchored at={at} yaw={yaw}>
      {[
        [-40, -70, 18, 12, 14],
        [30, -95, 26, 16, 18],
        [70, -60, 14, 9, 12],
        [-80, -120, 30, 20, 20],
        [5, -150, 40, 22, 24],
      ].map(([x, z, sx, sy, sz], i) => (
        <Iceberg key={i} position={[x, 0, z]} scale={[sx, sy, sz]} seed={`berg${i}`} />
      ))}
      {snow ? <Snow center={[0, 6, -10]} size={[30, 14, 30]} t={t} count={260} seed="antsnow" speed={2.6} /> : null}
    </Anchored>
  </>
);

// ---------------------------------------------------------------- penguin

/** Emperor-ish penguin, ≈ 2.4 tall at scale 1 (Slavoski 4.2). Faces +Z. */
export const Penguin: React.FC<{ position: V3; yaw?: number; scale?: number; t?: number; tilt?: number; flap?: number; waddle?: number; face?: Face; headYaw?: number }> = ({
  position,
  yaw = 0,
  scale = 1,
  t = 0,
  tilt = 0,
  flap = 0,
  waddle = 0,
  face = {},
  headYaw = 0,
}) => {
  const roll = Math.sin(waddle * Math.PI * 2) * 0.12;
  const blink = (t * 0.7) % 1 > 0.94 ? 1 : 0;
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      <group rotation={[0, 0, roll]}>
        <mesh position={[0, 1.15, 0]} scale={[0.78, 1.18, 0.7]} castShadow>
          <IcoG args={[0.92, 2]} />
          <Flat color="#1E2230" />
        </mesh>
        <mesh position={[0, 1.02, 0.24]} scale={[0.66, 1.02, 0.5]}>
          <IcoG args={[0.92, 2]} />
          <Flat color="#F4F3EE" />
        </mesh>
        <mesh position={[0, 1.8, 0.2]} scale={[0.5, 0.34, 0.3]}>
          <IcoG args={[0.92, 1]} />
          <Flat color="#F6E2A0" />
        </mesh>
        {/* flippers */}
        {[1, -1].map((s) => (
          <group key={s} position={[s * 0.68, 1.5, 0]} rotation={[0, 0, s * (0.18 + flap * 0.9 + Math.sin(t * 9 + s) * flap * 0.25)]}>
            <mesh position={[s * 0.06, -0.5, 0]}>
              <BoxG args={[0.14, 1.05, 0.42]} />
              <Flat color="#232838" />
            </mesh>
          </group>
        ))}
        {/* head */}
        <group position={[0, 2.22, 0.02]} rotation={[0, headYaw, tilt]}>
          <mesh scale={[0.95, 0.9, 0.95]} castShadow>
            <IcoG args={[0.48, 2]} />
            <Flat color="#1A1E2A" />
          </mesh>
          {[1, -1].map((s) => (
            <mesh key={s} position={[s * 0.4, -0.16, 0.02]} rotation={[0, 0, s * 0.3]}>
              <BoxG args={[0.12, 0.3, 0.26]} />
              <Flat color="#F2B33D" />
            </mesh>
          ))}
          <group position={[0, 0.06, 0.4]}>
            <ToonEyes face={{ blink, ...face }} size={0.15} spacing={0.16} />
          </group>
          <mesh position={[0, -0.1, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
            <ConeG args={[0.1, 0.42, 6]} />
            <Flat color="#E8852A" />
          </mesh>
        </group>
        {/* feet */}
        {[1, -1].map((s) => (
          <mesh key={s} position={[s * 0.26, 0.05, 0.22]}>
            <BoxG args={[0.3, 0.1, 0.42]} />
            <Flat color="#E8852A" />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- beach & ocean

/** Sand, turquoise shallows, deep sea to the horizon, palms; a tropical inner or outer world. */
export const BeachWorld: React.FC<Anchor & { t: number; sky?: [string, string] | false; sun?: V3; palms?: boolean; sunColor?: string }> = ({
  at = [0, 0, 0],
  yaw = 0,
  t,
  sky = ["#2E86D8", "#BFE6F4"],
  sun = [0.4, 0.5, -1],
  palms = true,
  sunColor = "#FFF6DA",
}) => (
  <>
    {sky ? <SkyDome position={at} radius={420} zenith={sky[0]} horizon={sky[1]} ground="#1E7FB8" sun={{ dir: rotY(sun, yaw), color: sunColor, size: 1.1 }} /> : null}
    <Anchored at={at} yaw={yaw}>
      <mesh position={[0, -0.06, -8]} receiveShadow>
        <BoxG args={[300, 0.12, 60]} />
        <Flat color="#EAD7A4" />
      </mesh>
      <mesh position={[0, -0.16, -50]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[600, 30]} />
        <Flat color="#3FC2C4" />
      </mesh>
      <mesh position={[0, -0.2, -230]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[900, 340]} />
        <Flat color="#1E6FB0" />
      </mesh>
      {[0, 1, 2].map((i) => {
        const z = -37.5 - i * 4 + Math.sin(t * 0.9 + i) * 0.8;
        return (
          <mesh key={i} position={[0, -0.08 + i * 0.005, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[600, 0.7 - i * 0.18]} />
            <Glow color={P.waterFoam} opacity={0.9 - i * 0.25} />
          </mesh>
        );
      })}
      {palms
        ? [
            [-14, -12, 9, "p1"],
            [-20, -22, 11, "p2"],
            [16, -16, 10, "p3"],
            [24, -28, 12, "p4"],
            [-34, -6, 10, "p5"],
          ].map(([x, z, h, s]) => <PalmTree key={s as string} position={[x as number, 0, z as number]} height={h as number} seed={s as string} sway={Math.sin(t * 1.2 + (x as number)) * 0.6} />)
        : null}
    </Anchored>
  </>
);

/** Open ocean to the horizon (the unlucky man's destination), gentle swell. */
export const OceanWorld: React.FC<Anchor & { t: number; sky?: boolean; color?: string }> = ({ at = [0, 0, 0], yaw = 0, t, sky = true, color = "#1F6AA8" }) => (
  <>
    {sky ? <SkyDome position={at} radius={420} zenith="#3A8CDC" horizon="#D6ECF8" ground="#1F6AA8" sun={{ dir: rotY([-0.5, 0.6, -1], yaw), color: "#FFF8E4" }} /> : null}
    <Anchored at={at} yaw={yaw}>
      <Swell t={t} color={color} />
    </Anchored>
  </>
);

/** A faceted sea surface that moves (vertex heights from t). */
export const Swell: React.FC<{ t: number; size?: number; segs?: number; color?: string; amp?: number }> = ({ t, size = 260, segs = 70, color = "#1F6AA8", amp = 0.45 }) => {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(size, size, segs, segs);
    g.rotateX(-Math.PI / 2);
    return g.toNonIndexed();
  }, [size, segs]);
  const pos = geom.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, Math.sin(x * 0.18 + t * 1.3) * amp + Math.sin(z * 0.23 - t * 1.1 + x * 0.05) * amp * 0.8);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return (
    <group>
      <mesh geometry={geom} receiveShadow>
        <meshLambertMaterial color={color} flatShading />
      </mesh>
      <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1600, 1600]} />
        <Flat color={color} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------- jungle

export const JungleWorld: React.FC<Anchor & { t: number; sky?: boolean }> = ({ at = [0, 0, 0], yaw = 0, t, sky = true }) => (
  <>
    {sky ? <SkyDome position={at} radius={420} zenith="#5FA0C8" horizon="#D8EED0" ground="#2E5A30" /> : null}
    <Anchored at={at} yaw={yaw}>
      <mesh position={[0, -0.06, -40]} receiveShadow>
        <BoxG args={[200, 0.12, 100]} />
        <Flat color="#3E6A34" />
      </mesh>
      {Array.from({ length: 34 }, (_, i) => {
        const x = (random(`jx${i}`) - 0.5) * 70;
        const z = -8 - random(`jz${i}`) * 60;
        if (Math.abs(x) < 3 && z > -16) return null;
        const h = 8 + random(`jh${i}`) * 12;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, h / 2, 0]} castShadow>
              <CylG args={[0.35, 0.55, h, 6]} />
              <Flat color="#5A4030" />
            </mesh>
            {[0, 1, 2].map((k) => (
              <mesh key={k} position={[(random(`jcx${i}${k}`) - 0.5) * 3, h + k * 1.2 - 1, (random(`jcz${i}${k}`) - 0.5) * 3]} scale={[1, 0.7, 1]} castShadow>
                <IcoG args={[2.4 + random(`jcs${i}${k}`) * 1.6, 1]} />
                <Flat color={k % 2 ? "#2F7E45" : "#3E9A52"} />
              </mesh>
            ))}
          </group>
        );
      })}
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={`f${i}`} position={[(random(`fx${i}`) - 0.5) * 40, 0.6, -4 - random(`fz${i}`) * 30]} scale={[1, 0.7, 1]}>
          <IcoG args={[0.9 + random(`fs${i}`) * 0.7, 1]} />
          <Flat color={i % 3 ? "#4FA05A" : "#6AB85E"} />
        </mesh>
      ))}
      {/* two parrots: red and blue */}
      {[
        ["#D8342A", -3, 6],
        ["#2A6AD8", 4, 7.5],
      ].map(([c, x, y], i) => (
        <group key={`p${i}`} position={[x as number, (y as number) + Math.sin(t * 2 + i) * 0.15, -14]}>
          <mesh scale={[0.5, 0.7, 0.5]}>
            <IcoG args={[0.6, 1]} />
            <Flat color={c as string} />
          </mesh>
          <mesh position={[0, 0.5, 0.15]}>
            <ConeG args={[0.12, 0.3, 5]} />
            <Flat color="#F2C43D" />
          </mesh>
        </group>
      ))}
    </Anchored>
  </>
);

// ---------------------------------------------------------------- night city

/** A neon night skyline seen from a street-level door (used as a random destination). */
export const NightCityWorld: React.FC<Anchor & { sky?: boolean }> = ({ at = [0, 0, 0], yaw = 0, sky = true }) => (
  <>
    {sky ? <SkyDome position={at} radius={420} zenith="#0B0E2A" horizon="#5A2E6A" ground="#1A1A2A" /> : null}
    <Anchored at={at} yaw={yaw}>
      <mesh position={[0, -0.06, -40]} receiveShadow>
        <BoxG args={[160, 0.12, 100]} />
        <Flat color="#23263A" />
      </mesh>
      <group scale={4.2}>
        {Array.from({ length: 18 }, (_, i) => {
          const side = i % 2 ? 1 : -1;
          const k = Math.floor(i / 2);
          return <Building key={i} position={[side * (5 + random(`nb${i}`) * 3), 0, -4 - k * 4.5]} w={3.2} d={3.2} h={6 + random(`nh${i}`) * 10} color={[P.bldgNavy, P.bldgPurple, P.bldgIndigo][i % 3]} seed={`nc${i}`} power={1} />;
        })}
      </group>
      {Array.from({ length: 10 }, (_, i) => (
        <group key={`n${i}`} position={[(i % 2 ? 1 : -1) * 16, 10 + (i % 3) * 6, -16 - i * 9]}>
          <mesh>
            <BoxG args={[1.2, 7, 0.3]} />
            <Glow color={["#FF4FA0", "#3FE0FF", "#FFD34F", "#8A5BFF"][i % 4]} />
          </mesh>
          <Halo size={9} color={["#FF4FA0", "#3FE0FF", "#FFD34F", "#8A5BFF"][i % 4]} opacity={0.45} />
        </group>
      ))}
    </Anchored>
  </>
);

// ---------------------------------------------------------------- alternate Earths

export type AltKind = "ocean" | "ice" | "red" | "jungle" | "purple" | "lava" | "city" | "ringed" | "twin" | "earth";
const ALT: Record<AltKind, { sea: string; land: string[]; atm: string; thr: number }> = {
  earth: { sea: P.ocean, land: [P.landGreen, P.landTan], atm: P.atmosphere, thr: 0.53 },
  ocean: { sea: "#0E5AA8", land: ["#E8EEF5"], atm: "#6FB6FF", thr: 0.66 },
  ice: { sea: "#9EC4E4", land: ["#F4F8FC", "#DCE8F4"], atm: "#BFE0FF", thr: 0.4 },
  red: { sea: "#7A3A26", land: ["#C8643A", "#E09050"], atm: "#FF9A6A", thr: 0.42 },
  jungle: { sea: "#1E5A6A", land: ["#2E8A3E", "#1F6A2E", "#4FAA4A"], atm: "#7FFFB0", thr: 0.38 },
  purple: { sea: "#4A2A8A", land: ["#D86AB0", "#F2A2D0"], atm: "#C08AFF", thr: 0.52 },
  lava: { sea: "#2A1A1E", land: ["#4A3434", "#FE5A0E"], atm: "#FF6A2A", thr: 0.5 },
  city: { sea: "#0A1838", land: ["#2A2E44", "#3A3A52"], atm: "#4F9BFF", thr: 0.5 },
  ringed: { sea: P.ocean, land: [P.landGreen, P.landTan], atm: P.atmosphere, thr: 0.55 },
  twin: { sea: "#0D4F96", land: ["#3A8A5A", "#B39A62"], atm: P.atmosphere, thr: 0.5 },
};

/** A different version of Earth: same faceted planet, other oceans, land, rings, moons or city glow. */
export const AltEarth: React.FC<{ kind: AltKind; position?: V3; radius?: number; t?: number; seed?: string }> = ({ kind, position = [0, 0, 0], radius = 3, t = 0, seed }) => {
  const spec = ALT[kind];
  const sd = seed ?? `alt${kind}`;
  const geom = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(radius, 4);
    const sea = new THREE.Color(spec.sea);
    const lands = spec.land.map((c) => new THREE.Color(c));
    return faceColors(g, (n, i) => {
      const land = fbm3(sd, n.x * 1.6 + 10, n.y * 1.6, n.z * 1.6, 4);
      const j = 1 + (random(`${sd}j${i}`) - 0.5) * 0.12;
      if (kind !== "lava" && kind !== "red" && Math.abs(n.y) > 0.93) return new THREE.Color(P.ice).multiplyScalar(j);
      if (land > spec.thr) {
        const pick = fbm3(`${sd}b`, n.x * 3, n.y * 3, n.z * 3, 2);
        const idx = Math.min(lands.length - 1, Math.floor(pick * lands.length * 1.2));
        if (kind === "lava") return (pick > 0.62 ? lands[1] : lands[0]).clone().multiplyScalar(j);
        return lands[idx].clone().multiplyScalar(j);
      }
      return sea.clone().multiplyScalar(j);
    });
  }, [kind, radius, sd]);
  const lights = useMemo(() => {
    if (kind !== "city" && kind !== "lava") return null;
    const src = new THREE.IcosahedronGeometry(radius * 1.004, 4);
    const pos = src.getAttribute("position");
    const out: number[] = [];
    for (let f = 0; f < pos.count / 3; f++) {
      const c = new THREE.Vector3().fromBufferAttribute(pos, f * 3).add(new THREE.Vector3().fromBufferAttribute(pos, f * 3 + 1)).add(new THREE.Vector3().fromBufferAttribute(pos, f * 3 + 2)).divideScalar(3);
      const n = c.clone().normalize();
      const land = fbm3(sd, n.x * 1.6 + 10, n.y * 1.6, n.z * 1.6, 4);
      if (land > spec.thr && random(`${sd}l${f}`) < (kind === "city" ? 0.85 : 0.25)) out.push(c.x, c.y, c.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
    return g;
  }, [kind, radius, sd]);
  const spin = t * 0.15;
  return (
    <group position={position}>
      <group rotation={[0.35, spin, 0.12]}>
        <mesh geometry={geom}>
          <meshLambertMaterial vertexColors flatShading />
        </mesh>
        {lights ? (
          <points geometry={lights}>
            <pointsMaterial color={kind === "city" ? P.windowLit : "#FFB040"} size={3.2} sizeAttenuation={false} toneMapped={false} fog={false} />
          </points>
        ) : null}
      </group>
      <mesh scale={1.05}>
        <IcoG args={[radius, 4]} />
        <RimMaterial color={spec.atm} power={3.0} intensity={0.85} />
      </mesh>
      {kind === "ringed" ? (
        <group rotation={[1.2, 0, 0.35]}>
          {[1.45, 1.7, 1.95].map((r, i) => (
            <mesh key={r}>
              <ringGeometry args={[radius * r, radius * (r + 0.2), 72]} />
              <meshBasicMaterial color={["#E8D8B8", "#C8B898", "#F2E6CC"][i]} side={THREE.DoubleSide} transparent opacity={0.8 - i * 0.15} toneMapped={false} fog={false} />
            </mesh>
          ))}
        </group>
      ) : null}
      {kind === "twin"
        ? [0, 1].map((i) => {
            const a = t * (0.35 + i * 0.2) + i * 2.4;
            const r = radius * (1.55 + i * 0.4);
            return (
              <mesh key={i} position={[Math.cos(a) * r, Math.sin(a * 0.7) * radius * 0.4, Math.sin(a) * r]}>
                <IcoG args={[radius * (0.24 + i * 0.08), 2]} />
                <Flat color={i ? "#B8AE98" : "#9AA1B0"} />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

/** Space seen through a door: dark sky with stars and one alternate Earth floating ahead. */
export const SpaceWorld: React.FC<Anchor & { kind: AltKind; t: number; dist?: number; radius?: number; zenith?: string; horizon?: string }> = ({
  at = [0, 0, 0],
  yaw = 0,
  kind,
  t,
  dist = 26,
  radius = 6,
  zenith = "#05040C",
  horizon = "#140F2A",
}) => {
  const dir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  return (
    <>
      <SkyDome position={at} radius={300} zenith={zenith} horizon={horizon} ground={zenith} />
      <group position={at}>
        <Stars count={500} radius={250} seed={`st${kind}`} size={2} opacity={0.8} />
      </group>
      <AltEarth kind={kind} position={[at[0] + dir.x * dist, at[1] + 0.4, at[2] + dir.z * dist]} radius={radius} t={t} />
    </>
  );
};

// ---------------------------------------------------------------- gull, drone, visitor

/** A seagull, wings flapping with t (faces +Z). */
export const Gull: React.FC<{ position: V3; yaw?: number; t: number; scale?: number }> = ({ position, yaw = 0, t, scale = 1 }) => {
  const f = Math.sin(t * 7) * 0.5;
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      <mesh scale={[0.32, 0.3, 0.8]}>
        <IcoG args={[1, 1]} />
        <Flat color="#F4F4F0" />
      </mesh>
      <mesh position={[0, 0.2, 0.7]}>
        <IcoG args={[0.24, 1]} />
        <Flat color="#F4F4F0" />
      </mesh>
      <mesh position={[0, 0.16, 0.98]} rotation={[Math.PI / 2, 0, 0]}>
        <ConeG args={[0.06, 0.26, 4]} />
        <Flat color="#F2B33D" />
      </mesh>
      {[1, -1].map((s) => (
        <group key={s} position={[s * 0.25, 0.1, 0]} rotation={[0, 0, s * f]}>
          <mesh position={[s * 0.75, 0, 0]}>
            <BoxG args={[1.5, 0.05, 0.42]} />
            <Flat color="#A8AEB8" />
          </mesh>
          <mesh position={[s * 1.45, 0, -0.05]}>
            <BoxG args={[0.2, 0.06, 0.32]} />
            <Flat color="#2A2A30" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** A small camera drone with a red REC light (faces +Z; ≈ 1.6 wide). */
export const Drone: React.FC<{ position: V3; yaw?: number; pitch?: number; t: number; scale?: number }> = ({ position, yaw = 0, pitch = 0, t, scale = 1 }) => (
  <group position={position} rotation={[pitch, yaw, 0]} scale={scale}>
    <mesh castShadow>
      <BoxG args={[0.5, 0.2, 0.7]} />
      <Flat color="#E8E8EC" />
    </mesh>
    {[
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].map(([sx, sz], i) => (
      <group key={i}>
        <mesh position={[sx * 0.4, 0.04, sz * 0.4]} rotation={[0, Math.atan2(sx, sz), 0]}>
          <BoxG args={[0.08, 0.06, 0.6]} />
          <Flat color="#2A2E3A" />
        </mesh>
        <mesh position={[sx * 0.62, 0.14, sz * 0.62]} rotation={[0, t * 40 + i, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.01, 16]} />
          <meshBasicMaterial color="#C9D2DE" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      </group>
    ))}
    <mesh position={[0, -0.18, 0.28]}>
      <IcoG args={[0.12, 1]} />
      <Flat color="#1A1A22" />
    </mesh>
    <mesh position={[0, 0.12, -0.36]}>
      <IcoG args={[0.05, 1]} />
      <Glow color="#FF3030" />
    </mesh>
    <Halo position={[0, 0.12, -0.38]} size={0.9} color="#FF3030" opacity={(Math.floor(t * 2) % 2 ? 0.25 : 0.7)} />
  </group>
);

/**
 * The visitor: a tall slender silhouette (≈ 6.6 tall), long three-fingered hands, a narrow head with
 * four glowing eyes. Faces +Z. `step` 0..1 brings the right leg forward; `reach` lifts the right hand.
 */
export const Visitor: React.FC<{ position: V3; yaw?: number; t: number; step?: number; reach?: number; eyes?: string; scale?: number; eyeOpen?: number }> = ({
  position,
  yaw = 0,
  t,
  step = 0,
  reach = 0,
  eyes = "#7CF7FF",
  scale = 1,
  eyeOpen = 1,
}) => {
  const body = "#120E1A";
  const rim = "#2A2140";
  const sway = Math.sin(t * 1.3) * 0.04;
  const leg = (s: number, k: number) => (
    <group position={[s * 0.32, 3.2, 0]} rotation={[-k * 0.6, 0, 0]}>
      <mesh position={[0, -0.85, 0]}>
        <BoxG args={[0.26, 1.8, 0.28]} />
        <Flat color={body} />
      </mesh>
      <group position={[0, -1.7, 0]} rotation={[k * 0.8, 0, 0]}>
        <mesh position={[0, -0.75, 0]}>
          <BoxG args={[0.22, 1.55, 0.24]} />
          <Flat color={body} />
        </mesh>
        <mesh position={[0, -1.52, 0.18]}>
          <BoxG args={[0.3, 0.12, 0.7]} />
          <Flat color={rim} />
        </mesh>
      </group>
    </group>
  );
  const arm = (s: number, lift: number) => (
    <group position={[s * 0.62, 5.0, 0]} rotation={[-lift * 1.3, 0, s * (0.08 + lift * 0.2)]}>
      <mesh position={[0, -0.9, 0]}>
        <BoxG args={[0.2, 1.8, 0.2]} />
        <Flat color={body} />
      </mesh>
      <group position={[0, -1.8, 0]} rotation={[-lift * 0.5, 0, 0]}>
        <mesh position={[0, -0.75, 0]}>
          <BoxG args={[0.17, 1.5, 0.17]} />
          <Flat color={body} />
        </mesh>
        {[-1, 0, 1].map((f) => (
          <mesh key={f} position={[f * 0.09, -1.75, 0.02]} rotation={[0, 0, f * 0.18]}>
            <BoxG args={[0.05, 0.62, 0.06]} />
            <Flat color={rim} />
          </mesh>
        ))}
      </group>
    </group>
  );
  return (
    <group position={position} rotation={[0, yaw, sway]} scale={scale}>
      {leg(1, 0)}
      {leg(-1, step)}
      <mesh position={[0, 4.1, 0]}>
        <BoxG args={[0.9, 2.0, 0.42]} />
        <Flat color={body} />
      </mesh>
      <mesh position={[0, 5.05, 0]}>
        <BoxG args={[1.3, 0.3, 0.46]} />
        <Flat color={rim} />
      </mesh>
      {arm(1, 0)}
      {arm(-1, reach)}
      <group position={[0, 5.9, 0.05]}>
        <mesh scale={[0.62, 1.15, 0.7]}>
          <IcoG args={[0.62, 2]} />
          <Flat color={body} />
        </mesh>
        {[
          [-0.16, 0.12],
          [0.16, 0.12],
          [-0.11, -0.12],
          [0.11, -0.12],
        ].map(([x, y], i) => (
          <group key={i} position={[x, y, 0.42]}>
            <mesh scale={[1, Math.max(0.05, eyeOpen), 1]}>
              <BoxG args={[0.12, 0.07, 0.04]} />
              <Glow color={eyes} />
            </mesh>
            <Halo size={0.9} color={eyes} opacity={0.55 * eyeOpen} />
          </group>
        ))}
      </group>
    </group>
  );
};

/** Pairs of glowing eyes in a dark doorway (other civilisations peeking through). */
export const PeekingEyes: React.FC<{ position: V3; yaw?: number; color: string; t: number; seed?: string; open?: number; size?: number }> = ({ position, yaw = 0, color, t, seed = "pk", open = 1, size = 1 }) => {
  const blink = (t * 0.5 + random(seed)) % 1 > 0.92 ? 0.1 : 1;
  const k = open * blink;
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={size}>
      {[1, -1].map((s) => (
        <group key={s} position={[s * 0.22, 0, 0]}>
          <mesh scale={[1, Math.max(0.05, k), 1]}>
            <BoxG args={[0.22, 0.13, 0.04]} />
            <Glow color={color} />
          </mesh>
          <Halo size={1.1} color={color} opacity={0.6 * k} />
        </group>
      ))}
    </group>
  );
};

/** A few hundred floating dust motes (void ambience), additive, drifting with t. */
export const Motes: React.FC<{ t: number; count?: number; radius?: number; color?: string; seed?: string; center?: V3 }> = ({ t, count = 300, radius = 60, color = "#B8A8FF", seed = "mote", center = [0, 0, 0] }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const pts = useMemo(
    () => Array.from({ length: count }, (_, i) => ({ p: new THREE.Vector3((random(`${seed}x${i}`) - 0.5) * 2, (random(`${seed}y${i}`) - 0.5) * 2, (random(`${seed}z${i}`) - 0.5) * 2).multiplyScalar(radius), s: 0.04 + random(`${seed}s${i}`) * 0.1, w: random(`${seed}w${i}`) * 6 })),
    [count, radius, seed],
  );
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    pts.forEach((d, i) => {
      o.position.set(center[0] + d.p.x + Math.sin(t * 0.3 + d.w) * 0.8, center[1] + d.p.y + Math.cos(t * 0.25 + d.w) * 0.6, center[2] + d.p.z);
      o.scale.setScalar(d.s);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, pts.length]} key={pts.length}>
      <IcoG args={[1, 0]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
    </instancedMesh>
  );
};
