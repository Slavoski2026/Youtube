/**
 * Effects kit: Meteor (tapered trail), Fireball, SmokeCluster, LavaCrack, Shockwave, Debris,
 * FloodWater, Volcano. All driven by explicit progress / time props (never their own clock).
 */
import React, { useMemo } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { clamp01, ease, type V3 } from "./noise";
import { P } from "./palette";
import { Flat, Glow } from "./materials";
import { BoxG, CircleG, CylG, IcoG } from "./detail";

const v = (p: V3) => new THREE.Vector3(...p);

/** Tapered trail cone with an alpha gradient (base opaque at the head, transparent tip). */
const trailGeometry = (radius: number, length: number, color: string, alpha = 1) => {
  const g = new THREE.ConeGeometry(radius, length, 10, 6, true);
  const pos = g.getAttribute("position");
  const cols = new Float32Array(pos.count * 4);
  const c = new THREE.Color(color);
  for (let i = 0; i < pos.count; i++) {
    const k = (pos.getY(i) + length / 2) / length; // 0 at base, 1 at tip
    cols.set([c.r, c.g, c.b, Math.pow(1 - k, 1.4) * alpha], i * 4);
  }
  g.setAttribute("color", new THREE.BufferAttribute(cols, 4));
  return g;
};

export const Meteor: React.FC<{
  from: V3;
  to: V3;
  /** 0..1 along the path; at 1 the rock reaches `to` (use an impact there). */
  progress: number;
  size?: number;
  trail?: number;
  seed?: string;
}> = ({ from, to, progress, size = 0.5, trail = 5, seed = "m" }) => {
  const dir = useMemo(() => v(to).sub(v(from)).normalize(), [from, to]);
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate()), [dir]);
  const outer = useMemo(() => trailGeometry(size * 1.05, trail, P.meteor, 0.95), [size, trail]);
  const inner = useMemo(() => trailGeometry(size * 0.6, trail * 0.7, P.fireCore, 0.9), [size, trail]);
  if (progress <= 0 || progress >= 1) return null;
  const pos = v(from).lerp(v(to), progress);
  const grow = clamp01(progress * 4);
  return (
    <group position={pos.toArray() as V3}>
      <group quaternion={quat} scale={[1, grow, 1]}>
        <mesh geometry={outer} position={[0, trail / 2, 0]}>
          <meshBasicMaterial vertexColors transparent depthWrite={false} toneMapped={false} fog={false} />
        </mesh>
        <mesh geometry={inner} position={[0, (trail * 0.7) / 2, 0]}>
          <meshBasicMaterial vertexColors transparent depthWrite={false} toneMapped={false} fog={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
      <mesh rotation={[progress * 7, progress * 5, 0]}>
        <dodecahedronGeometry args={[size * 0.85, 0]} />
        <Flat color="#3A2620" />
      </mesh>
      <mesh>
        <IcoG args={[size * 1.05, 1]} />
        <Glow color={P.meteor} opacity={0.55} fog={false} additive />
      </mesh>
      <mesh rotation={[0, random(seed) * 6, 0]}>
        <IcoG args={[size * 0.2, 0]} />
        <Glow color={P.fireCore} fog={false} />
      </mesh>
    </group>
  );
};

export const Fireball: React.FC<{ position: V3; progress: number; radius?: number; seed?: string }> = ({
  position,
  progress,
  radius = 2,
  seed = "fb",
}) => {
  if (progress <= 0 || progress >= 1) return null;
  const grow = ease(progress / 0.35);
  const fade = 1 - ease((progress - 0.55) / 0.45);
  const balls = 7;
  return (
    <group position={position}>
      {Array.from({ length: balls }, (_, i) => {
        const a = (i / balls) * Math.PI * 2 + random(`${seed}${i}`) * 0.8;
        const r = radius * 0.55 * grow;
        const s = radius * (0.45 + random(`${seed}s${i}`) * 0.3) * grow;
        return (
          <mesh key={i} position={[Math.cos(a) * r, s * 0.6 + random(`${seed}y${i}`) * r * 0.5, Math.sin(a) * r]}>
            <IcoG args={[s, 1]} />
            <Glow color={i % 2 ? P.fire : P.meteor} opacity={fade} />
          </mesh>
        );
      })}
      <mesh position={[0, radius * 0.5 * grow, 0]}>
        <IcoG args={[radius * 0.6 * grow, 1]} />
        <Glow color={P.fireCore} opacity={fade} />
      </mesh>
    </group>
  );
};

export const SmokeCluster: React.FC<{
  position: V3;
  progress: number;
  radius?: number;
  count?: number;
  seed?: string;
  rise?: number;
  color?: string;
}> = ({ position, progress, radius = 2.5, count = 9, seed = "smoke", rise = 3, color = P.smoke }) => {
  if (progress <= 0) return null;
  const g = ease(progress / 0.5);
  return (
    <group position={position}>
      {Array.from({ length: count }, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const d = random(`${seed}d${i}`) * radius * 0.8;
        const s = radius * (0.35 + random(`${seed}s${i}`) * 0.35) * (0.4 + 0.6 * g);
        const y = s + random(`${seed}y${i}`) * radius * 0.8 + progress * rise * (0.6 + random(`${seed}r${i}`) * 0.6);
        return (
          <mesh key={i} position={[Math.cos(a) * d * (0.5 + g * 0.6), y, Math.sin(a) * d * (0.5 + g * 0.6)]} rotation={[i, i * 2, 0]} castShadow>
            <IcoG args={[s, 1]} />
            <Flat color={i % 3 === 0 ? P.smokeDark : color} />
          </mesh>
        );
      })}
    </group>
  );
};

/** A glowing lava crack on the ground through `points` (y ignored → sits at y=0.02). */
export const LavaCrack: React.FC<{ points: V3[]; width?: number; progress?: number; glow?: number }> = ({
  points,
  width = 0.6,
  progress = 1,
  glow = 1,
}) => {
  const geoms = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], 0, p[2])));
    const n = 60;
    const build = (wd: number) => {
      const verts: number[] = [];
      const pts = curve.getSpacedPoints(n);
      for (let i = 0; i < pts.length; i++) {
        const tan = curve.getTangentAt(i / n);
        const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
        const jag = wd * (0.7 + 0.3 * Math.sin(i * 2.7)) * (1 - Math.pow(Math.abs(i / n - 0.5) * 2, 6) * 0.6);
        const a = pts[i].clone().addScaledVector(side, jag / 2);
        const b = pts[i].clone().addScaledVector(side, -jag / 2);
        verts.push(a.x, 0, a.z, b.x, 0, b.z);
      }
      const idx: number[] = [];
      for (let i = 0; i < n; i++) {
        const k = i * 2;
        idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
      g.setIndex(idx);
      return g;
    };
    return { core: build(width), halo: build(width * 3.2) };
  }, [points, width]);
  const count = Math.floor(clamp01(progress) * 60) * 6;
  geoms.core.setDrawRange(0, count);
  geoms.halo.setDrawRange(0, count);
  return (
    <group position={[0, 0.03, 0]}>
      <mesh geometry={geoms.halo} position={[0, -0.005, 0]}>
        <meshBasicMaterial color={P.lava} transparent opacity={0.28 * glow} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geoms.core}>
        <meshBasicMaterial color={P.lava} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export const Shockwave: React.FC<{ position: V3; progress: number; radius?: number; color?: string }> = ({
  position,
  progress,
  radius = 12,
  color = P.cream,
}) => {
  if (progress <= 0 || progress >= 1) return null;
  const r = radius * ease(progress);
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[Math.max(0.01, r * 0.9), r, 48]} />
      <meshBasicMaterial color={color} transparent opacity={(1 - progress) * 0.7} toneMapped={false} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
};

/** Ballistic chunks from `origin`. They come to rest on the ground (y=0) instead of sinking. */
export const Debris: React.FC<{ origin: V3; t: number; count?: number; speed?: number; seed?: string; color?: string }> = ({
  origin,
  t,
  count = 16,
  speed = 7,
  seed = "debris",
  color = P.bldgSlate,
}) => {
  if (t <= 0) return null;
  const g = 9.8;
  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const up = 0.4 + random(`${seed}u${i}`) * 0.8;
        const sp = speed * (0.5 + random(`${seed}s${i}`) * 0.7);
        const s = 0.15 + random(`${seed}z${i}`) * 0.35;
        const vx = Math.cos(a) * sp, vz = Math.sin(a) * sp, vy = up * sp;
        // time of landing (y = s/2)
        const tl = (vy + Math.sqrt(vy * vy + 2 * g * Math.max(0, origin[1] - s / 2))) / g;
        const tt = Math.min(t, tl);
        const y = Math.max(s / 2, origin[1] + vy * tt - 0.5 * g * tt * tt);
        return (
          <mesh key={i} position={[origin[0] + vx * tt, y, origin[2] + vz * tt]} rotation={[tt * 5 + i, tt * 3, 0]} castShadow>
            <BoxG args={[s, s * 0.8, s * 1.1]} />
            <Flat color={color} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Faceted flood water slab with gentle frame-driven waves. */
export const FloodWater: React.FC<{
  level: number;
  t: number;
  size?: [number, number];
  position?: V3;
  /** Flow speed along -Z (water rushing down a street). */
  flow?: number;
}> = ({ level, t, size = [40, 140], position = [0, 0, 0], flow = 2 }) => {
  const geom = useMemo(() => new THREE.PlaneGeometry(size[0], size[1], Math.round(size[0] / 1.5), Math.round(size[1] / 1.5)).toNonIndexed(), [size]);
  const base = useMemo(() => Float32Array.from(geom.getAttribute("position").array), [geom]);
  const pos = geom.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3], y = base[i * 3 + 1];
    pos.setZ(i, Math.sin(x * 0.7 + t * 2.1) * 0.12 + Math.sin((y + t * flow) * 0.9) * 0.18);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  if (level <= 0) return null;
  return (
    <mesh geometry={geom} position={[position[0], position[1] + level, position[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshLambertMaterial color={P.water} flatShading transparent opacity={0.92} />
    </mesh>
  );
};

export const Volcano: React.FC<{ position: V3; scale?: number; eruption: number; t: number; seed?: string }> = ({
  position,
  scale = 1,
  eruption,
  t,
  seed = "volc",
}) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 3, 0]} castShadow receiveShadow>
      <CylG args={[1.4, 6, 6, 9, 2]} />
      <Flat color="#3B3036" />
    </mesh>
    <mesh position={[0, 6.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <CircleG args={[1.3, 9]} />
      <Glow color={P.lava} />
    </mesh>
    {eruption > 0
      ? Array.from({ length: 10 }, (_, i) => {
          const life = 1.6;
          const off = random(`${seed}o${i}`) * life;
          const k = ((t + off) % life) / life;
          const a = random(`${seed}a${i}`) * Math.PI * 2;
          const sp = 2 + random(`${seed}s${i}`) * 2.5;
          const h = 6 + (k * 10 - k * k * 9) * eruption * 1.4;
          return (
            <mesh key={i} position={[Math.cos(a) * k * sp, h, Math.sin(a) * k * sp]}>
              <IcoG args={[0.35 * (1 - k * 0.5), 0]} />
              <Glow color={i % 2 ? P.lava : P.fire} />
            </mesh>
          );
        })
      : null}
    {eruption > 0 ? <SmokeCluster position={[0, 6.5, 0]} progress={eruption} radius={3.2} count={8} rise={6} seed={`${seed}sm`} color={P.smokeDark} /> : null}
  </group>
);
