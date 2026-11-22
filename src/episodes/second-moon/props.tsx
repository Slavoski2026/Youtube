/**
 * Sets and props for "What If Earth Suddenly Had a Second Moon?" (ep. 8).
 * The second Moon is a warmer rust-tan rock (P.moon2) so it never reads as a copy of ours.
 * Everything is seeded and driven by explicit time/progress props (never its own clock).
 * Hero scale: Slavoski is 4.2 tall (≈ 1.8 m, so 1 unit ≈ 0.43 m).
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { BoxG, IcoG } from "../../slavoski/detail";
import type { HeroLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { clamp01, ease, fbm3, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { CANVAS_FONT, CanvasPanel, fitText } from "../../slavoski/screens";

const v3 = (p: V3) => new THREE.Vector3(...p);

// ================================================================ moons

export type MoonKind = "moon" | "moon2";
const MOON_COLORS: Record<MoonKind, { base: string; dark: string; emissive: string }> = {
  moon: { base: P.moon, dark: P.moonDark, emissive: "#3A3F4C" },
  moon2: { base: P.moon2, dark: P.moon2Dark, emissive: "#4A3A30" },
};

/** Per-face colour of a moon (same recipe as the kit's FacetedMoon: maria clusters plus grey jitter). */
const moonFace = (kind: MoonKind, seed: string, n: THREE.Vector3, i: number) => {
  const { base, dark } = MOON_COLORS[kind];
  const maria = fbm3(seed, n.x * 1.8 + 3, n.y * 1.8, n.z * 1.8, 3);
  const jitter = (random(`${seed}f${i}`) - 0.5) * 0.16;
  const t = maria < 0.42 ? 0.75 : maria < 0.47 ? 0.35 : 0;
  return new THREE.Color(base).lerp(new THREE.Color(dark), t).multiplyScalar(1 + jitter);
};

const crackValue = (seed: string, n: THREE.Vector3) => Math.abs(fbm3(`${seed}crack`, n.x * 2.2 + 7, n.y * 2.2, n.z * 2.2, 3) - 0.5);

/**
 * A faceted moon (ours or the second one) with optional tidal `stretch` along `stretchDir` and glowing
 * lava `crack`s (0..1) opening between facets as it is torn apart.
 */
export const Moon: React.FC<{
  kind?: MoonKind;
  radius?: number;
  position?: V3;
  rotation?: V3;
  seed?: string;
  stretch?: number;
  stretchDir?: V3;
  crack?: number;
  detail?: number;
  /** Extra self-glow so it reads light from the ground at night (0..1). */
  glow?: number;
}> = ({ kind = "moon", radius = 1, position = [0, 0, 0], rotation = [0, 0, 0], seed, stretch = 0, stretchDir = [1, 0, 0], crack = 0, detail = 3, glow = 0.5 }) => {
  const sd = seed ?? kind;
  const { geom, crackVals } = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(radius, detail);
    const pos = g.getAttribute("position");
    const colors = new Float32Array(pos.count * 3);
    const cv: number[] = [];
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (let f = 0; f < pos.count / 3; f++) {
      a.fromBufferAttribute(pos, f * 3);
      b.fromBufferAttribute(pos, f * 3 + 1);
      c.fromBufferAttribute(pos, f * 3 + 2);
      const n = a.clone().add(b).add(c).normalize();
      const col = moonFace(kind, sd, n, f);
      for (let k = 0; k < 3; k++) colors.set([col.r, col.g, col.b], (f * 3 + k) * 3);
      cv.push(crackValue(sd, n));
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return { geom: g, crackVals: cv };
  }, [radius, detail, kind, sd]);
  const cq = Math.round(clamp01(crack) * 24) / 24;
  const crackGeom = useMemo(() => {
    if (cq <= 0) return null;
    const pos = geom.getAttribute("position");
    const keep: number[] = [];
    const w = 0.002 + cq * 0.011;
    crackVals.forEach((val, f) => {
      if (val < w) for (let k = 0; k < 3; k++) keep.push(pos.getX(f * 3 + k) * 1.006, pos.getY(f * 3 + k) * 1.006, pos.getZ(f * 3 + k) * 1.006);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(keep, 3));
    return g;
  }, [geom, crackVals, cq]);
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v3(stretchDir).normalize()), [stretchDir]);
  const sy = 1 + stretch;
  const sxz = 1 / Math.sqrt(sy);
  const emissive = new THREE.Color(MOON_COLORS[kind].emissive).multiplyScalar(0.4 + glow * 1.2).getStyle();
  return (
    <group position={position}>
      <group quaternion={q}>
        <group scale={[sxz, sy, sxz]}>
          <group quaternion={q.clone().invert()}>
            <group rotation={rotation}>
              <mesh geometry={geom} castShadow receiveShadow>
                <meshLambertMaterial color="#ffffff" vertexColors flatShading fog={false} emissive={emissive} />
              </mesh>
              {crackGeom ? (
                <mesh geometry={crackGeom}>
                  <meshBasicMaterial color={P.lava} toneMapped={false} fog={false} />
                </mesh>
              ) : null}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

/** A moon in the sky seen from the ground: the body plus a soft halo (the house bloom) just behind it. */
export const SkyMoon: React.FC<{ kind?: MoonKind; radius: number; position: V3; haloAt?: V3; rotation?: V3; halo?: number; seed?: string; crack?: number }> = ({
  kind = "moon",
  radius,
  position,
  haloAt,
  rotation = [0.2, 0.6, 0],
  halo = 0.4,
  seed,
  crack = 0,
}) => (
  <group>
    <Moon kind={kind} radius={radius} position={position} rotation={rotation} seed={seed} detail={4} glow={0.8} crack={crack} />
    {halo > 0 ? <Halo position={haloAt ?? [position[0], position[1], position[2] - radius * 1.2]} size={radius * 5.2} color={kind === "moon" ? "#C9D6FF" : "#FFD9B0"} opacity={halo} /> : null}
  </group>
);

type Chunk = { outer: THREE.BufferGeometry; inner: THREE.BufferGeometry; c: THREE.Vector3; n: THREE.Vector3; r: number; i: number };

/**
 * A moon breaking into faceted Voronoi chunks. `progress` 0 = whole, 1 = fully scattered over `spread`
 * radii. With `axis`, chunks fly mostly along it in both directions (a tidal tear); otherwise they burst
 * radially. `push` drifts the whole cloud (e.g. away from an impact). The torn faces glow with lava.
 */
export const MoonBreakup: React.FC<{
  kind?: MoonKind;
  radius?: number;
  position: V3;
  progress: number;
  spread?: number;
  axis?: V3;
  push?: V3;
  pieces?: number;
  seed?: string;
  t?: number;
  stretch?: number;
  /** Glow of the torn faces (0 = cold rubble). */
  lava?: number;
  /** Tumble amount (lower for distant rubble, so the outer faces keep facing us). */
  spin?: number;
}> = ({ kind = "moon2", radius = 1, position, progress, spread = 4, axis, push = [0, 0, 0], pieces = 28, seed, t = 0, stretch = 0, lava = 0.5, spin = 1 }) => {
  const sd = seed ?? `${kind}brk`;
  const chunks = useMemo<Chunk[]>(() => {
    const centers = Array.from({ length: pieces }, (_, i) => {
      const u = random(`${sd}u${i}`) * 2 - 1;
      const th = random(`${sd}t${i}`) * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      return new THREE.Vector3(Math.cos(th) * s, u, Math.sin(th) * s);
    });
    const g = new THREE.IcosahedronGeometry(radius, 3);
    const pos = g.getAttribute("position");
    const buckets: { tris: THREE.Vector3[][]; faces: number[] }[] = centers.map(() => ({ tris: [], faces: [] }));
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (let f = 0; f < pos.count / 3; f++) {
      a.fromBufferAttribute(pos, f * 3);
      b.fromBufferAttribute(pos, f * 3 + 1);
      c.fromBufferAttribute(pos, f * 3 + 2);
      const n = a.clone().add(b).add(c).normalize();
      let best = 0, bd = -2;
      centers.forEach((cc, k) => {
        const d = cc.dot(n) + (random(`${sd}j${f}${k}`) - 0.5) * 0.02;
        if (d > bd) { bd = d; best = k; }
      });
      buckets[best].tris.push([a.clone(), b.clone(), c.clone()]);
      buckets[best].faces.push(f);
    }
    return buckets
      .map((bk, i) => {
        if (!bk.tris.length) return null;
        const sum = new THREE.Vector3();
        bk.tris.forEach((tr) => tr.forEach((p) => sum.add(p)));
        const n = sum.clone().normalize();
        const apex = n.clone().multiplyScalar(radius * 0.25);
        const cen = sum.clone().divideScalar(bk.tris.length * 3).lerp(apex, 0.5);
        const ov: number[] = [], oc: number[] = [], iv: number[] = [];
        bk.tris.forEach((tr, k) => {
          const fn = tr[0].clone().add(tr[1]).add(tr[2]).normalize();
          const col = moonFace(kind, sd.replace("brk", ""), fn, bk.faces[k]);
          tr.forEach((p) => {
            ov.push(p.x - cen.x, p.y - cen.y, p.z - cen.z);
            oc.push(col.r, col.g, col.b);
          });
          for (let e = 0; e < 3; e++) {
            const p = tr[e], q = tr[(e + 1) % 3];
            [q, p, apex].forEach((x) => iv.push(x.x - cen.x, x.y - cen.y, x.z - cen.z));
          }
        });
        const outer = new THREE.BufferGeometry();
        outer.setAttribute("position", new THREE.Float32BufferAttribute(ov, 3));
        outer.setAttribute("color", new THREE.Float32BufferAttribute(oc, 3));
        outer.computeVertexNormals();
        const inner = new THREE.BufferGeometry();
        inner.setAttribute("position", new THREE.Float32BufferAttribute(iv, 3));
        inner.computeVertexNormals();
        return { outer, inner, c: cen, n, r: random(`${sd}r${i}`), i } as Chunk;
      })
      .filter((x): x is Chunk => x !== null);
  }, [radius, pieces, sd, kind]);
  const ax = axis ? v3(axis).normalize() : null;
  const p = clamp01(progress);
  const e = ease(p);
  const emissive = new THREE.Color(MOON_COLORS[kind].emissive).multiplyScalar(1.1).getStyle();
  const lavaFade = 1 - ease(clamp01((p - 0.35) / 0.65));
  const sq = 1 / Math.sqrt(1 + stretch);
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis ? v3(axis).normalize() : new THREE.Vector3(0, 1, 0)), [axis]);
  return (
    <group position={position}>
     <group quaternion={q}>
      <group scale={[sq, 1 + stretch, sq]}>
       <group quaternion={q.clone().invert()}>
      {chunks.map((ch) => {
        const speed = (0.55 + ch.r * 0.8) * spread * radius;
        let dir = ch.n.clone();
        if (ax) {
          const along = ch.n.dot(ax);
          dir = ax.clone().multiplyScalar(Math.sign(along) * (0.6 + Math.abs(along))).addScaledVector(ch.n, 0.35);
        }
        const at = ch.c.clone().addScaledVector(dir, e * speed).addScaledVector(v3(push), e);
        const rot = p * (2 + ch.r * 3) * spin;
        return (
          <group key={ch.i} position={at.toArray() as V3} rotation={[rot + t * 0.05, rot * 0.7, rot * 0.4]}>
            <mesh geometry={ch.outer} castShadow>
              <meshLambertMaterial color="#ffffff" vertexColors flatShading fog={false} emissive={emissive} />
            </mesh>
            <mesh geometry={ch.inner}>
              <meshLambertMaterial color="#2E2522" flatShading fog={false} emissive={P.lava} emissiveIntensity={lavaFade * 0.22 * lava} />
            </mesh>
          </group>
        );
      })}
       </group>
      </group>
     </group>
    </group>
  );
};

/** A brief white-hot flash at a point (impact): an additive glow ball that swells and fades, plus a halo. */
export const Flash: React.FC<{ position: V3; progress: number; radius?: number; color?: string }> = ({ position, progress, radius = 3, color = "#FFF4D8" }) => {
  if (progress <= 0 || progress >= 1) return null;
  const s = radius * (0.25 + ease(clamp01(progress / 0.3)) * 0.55);
  const o = 1 - ease(clamp01((progress - 0.15) / 0.85));
  return (
    <group position={position}>
      <mesh scale={s}>
        <IcoG args={[1, 2]} />
        <Glow color={color} opacity={o} fog={false} additive />
      </mesh>
      <Halo position={[0, 0, 0]} size={radius * 4} color="#FFE2B0" opacity={o * 0.8} />
    </group>
  );
};

/** A ring-shaped shockwave in an arbitrary plane (facing `normal`). */
export const RingWave: React.FC<{ position: V3; progress: number; radius?: number; normal?: V3; color?: string }> = ({ position, progress, radius = 8, normal = [0, 0, 1], color = P.cream }) => {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), v3(normal).normalize()), [normal]);
  if (progress <= 0 || progress >= 1) return null;
  const r = radius * ease(progress);
  return (
    <mesh position={position} quaternion={q}>
      <ringGeometry args={[Math.max(0.01, r * 0.86), r, 64]} />
      <meshBasicMaterial color={color} transparent opacity={(1 - progress) * 0.75} toneMapped={false} side={THREE.DoubleSide} depthWrite={false} fog={false} />
    </mesh>
  );
};

// ================================================================ debris

const ROCK_COLORS = ["#8E8A86", "#6E6660", "#A89C90", "#5E5852", "#B49884", "#7A6352"];

/**
 * Instanced rock fragments. `mode = "burst"`: flying out of `origin` over `progress` (0..1) to `reach`.
 * Seeded per index so every frame agrees.
 */
export const RockBurst: React.FC<{ origin: V3; progress: number; reach?: number; count?: number; size?: number; seed?: string; flatten?: number; push?: V3 }> = ({
  origin,
  progress,
  reach = 10,
  count = 300,
  size = 0.12,
  seed = "burst",
  flatten = 0,
  push = [0, 0, 0],
}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const u = random(`${seed}u${i}`) * 2 - 1;
        const th = random(`${seed}t${i}`) * Math.PI * 2;
        const s = Math.sqrt(1 - u * u);
        return { d: new THREE.Vector3(Math.cos(th) * s, u * (1 - flatten), Math.sin(th) * s), sp: 0.25 + random(`${seed}s${i}`) ** 0.6 * 0.75, sz: size * (0.4 + random(`${seed}z${i}`) * 1.2), c: ROCK_COLORS[i % ROCK_COLORS.length] };
      }),
    [count, seed, size, flatten],
  );
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    const e = 1 - (1 - clamp01(progress)) ** 2.2;
    items.forEach((it, i) => {
      o.position.set(origin[0] + it.d.x * it.sp * reach * e + push[0] * e, origin[1] + it.d.y * it.sp * reach * e + push[1] * e, origin[2] + it.d.z * it.sp * reach * e + push[2] * e);
      o.rotation.set(i + progress * 6, i * 2 + progress * 4, 0);
      o.scale.setScalar(progress <= 0 ? 0.0001 : it.sz);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, col.set(it.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} key={items.length}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshLambertMaterial flatShading fog={false} emissive="#2A2420" />
    </instancedMesh>
  );
};

/**
 * A ring of debris around a planet (radius `r`): instanced rocks in an annulus, tilted, drifting with t.
 * `form` 0..1 grows it from a clump at angle `a0` into the full ring (the collision cloud spreading out).
 */
export const DebrisRing: React.FC<{ r: number; inner?: number; outer?: number; count?: number; t: number; form?: number; a0?: number; tilt?: V3; seed?: string; size?: number; band?: number }> = ({
  r,
  inner = 1.6,
  outer = 2.7,
  count = 2200,
  t,
  form = 1,
  a0 = 0.6,
  tilt = [0.32, 0, 0.12],
  seed = "ring",
  size = 0.035,
  band = 0.35,
}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const k = random(`${seed}k${i}`);
        // denser near the middle of the band
        const rr = r * (inner + (outer - inner) * (0.5 + (k - 0.5) * (0.6 + random(`${seed}q${i}`) * 0.4)));
        return { a: random(`${seed}a${i}`) * Math.PI * 2, rr, y: (random(`${seed}y${i}`) - 0.5) * r * 0.08, s: r * size * (0.35 + random(`${seed}s${i}`) ** 2 * 1.6), c: ROCK_COLORS[i % ROCK_COLORS.length], w: 0.08 / Math.sqrt(rr / r) };
      }),
    [count, r, inner, outer, seed, size],
  );
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    const f = ease(clamp01(form));
    items.forEach((it, i) => {
      // clump: every rock starts near a0 at the middle radius, then spreads along the orbit
      const da = ((it.a - a0 + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      const a = a0 + da * (0.04 + 0.96 * f) + t * it.w;
      const rr = r * ((inner + outer) / 2) + (it.rr - r * ((inner + outer) / 2)) * (0.3 + 0.7 * f);
      o.position.set(Math.cos(a) * rr, it.y * (0.4 + 0.6 * f) + (1 - f) * (random(`${seed}cy${i}`) - 0.5) * r * 0.5, Math.sin(a) * rr);
      o.rotation.set(i, i * 1.7 + t * 0.3, 0);
      o.scale.setScalar(it.s);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, col.set(it.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  const f = ease(clamp01(form));
  return (
    <group rotation={tilt}>
      <instancedMesh ref={ref} args={[undefined, undefined, items.length]} key={items.length} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshLambertMaterial flatShading fog={false} emissive="#2A2420" />
      </instancedMesh>
      {band > 0 && f > 0.5 ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r * inner, r * outer, 96, 1]} />
          <meshBasicMaterial color="#C8B8A6" transparent opacity={band * ease((f - 0.5) / 0.5)} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} fog={false} />
        </mesh>
      ) : null}
    </group>
  );
};

/**
 * The debris ring seen from the ground: a broad dusty arc across the sky, speckled with rocks. It is a
 * huge annulus far away, tilted so it arches over the scene; place it with `position`/`rotation`.
 */
export const SkyRing: React.FC<{ position: V3; rotation?: V3; radius?: number; width?: number; count?: number; t?: number; seed?: string; opacity?: number }> = ({
  position,
  rotation = [-0.3, 0, 0.25],
  radius = 520,
  width = 70,
  count = 900,
  t = 0,
  seed = "skyring",
  opacity = 0.42,
}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        a: random(`${seed}a${i}`) * Math.PI * 2,
        rr: radius - width / 2 + random(`${seed}r${i}`) * width,
        z: (random(`${seed}z${i}`) - 0.5) * 6,
        s: 0.9 + random(`${seed}s${i}`) ** 3 * 4.5,
        c: ["#E4DACE", "#C8BCB0", "#F2E8DA", "#B8A898"][i % 4],
      })),
    [count, radius, width, seed],
  );
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    items.forEach((it, i) => {
      const a = it.a + t * 0.004;
      o.position.set(Math.cos(a) * it.rr, Math.sin(a) * it.rr, it.z);
      o.rotation.set(i, i * 2, 0);
      o.scale.setScalar(it.s);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, col.set(it.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <ringGeometry args={[radius - width / 2, radius + width / 2, 160, 1]} />
        <meshBasicMaterial color="#D8C6B2" transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} fog={false} />
      </mesh>
      <mesh>
        <ringGeometry args={[radius - width * 0.12, radius + width * 0.05, 160, 1]} />
        <meshBasicMaterial color="#F4E6D2" transparent opacity={opacity * 0.9} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} fog={false} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, items.length]} key={items.length}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial toneMapped={false} fog={false} />
      </instancedMesh>
    </group>
  );
};

// ================================================================ ocean

/** A translucent ocean shell around Earth, stretched into tidal bulges along `dir` (amount 0..). */
export const TideBulge: React.FC<{ r: number; position?: V3; amount: number; dir?: V3; opacity?: number }> = ({ r, position = [0, 0, 0], amount, dir = [0, 1, 0], opacity = 0.35 }) => {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v3(dir).normalize()), [dir]);
  return (
    <group position={position} quaternion={q}>
      <mesh scale={[1.02, 1.02 + amount, 1.02]}>
        <IcoG args={[r, 3]} />
        <meshLambertMaterial color="#3E8FE0" flatShading transparent opacity={opacity} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
};

/** Moonlight glitter on water: short glowing strips from `near` [x, z] out to `far` [x, z], widening toward the camera. */
export const MoonGlints: React.FC<{ near: [number, number]; far: [number, number]; t: number; y?: number; color?: string; seed?: string; width?: number; count?: number }> = ({
  near,
  far,
  t,
  y = 0.06,
  color = "#DCE4FF",
  seed = "gl",
  width = 1,
  count = 46,
}) => (
  <group>
    {Array.from({ length: count }, (_, i) => {
      const k = i / (count - 1);
      const f = k ** 1.8; // denser toward the horizon
      const x = far[0] + (near[0] - far[0]) * f;
      const z = far[1] + (near[1] - far[1]) * f;
      const spread = (1.5 + f * 9) * width;
      const flick = 0.5 + 0.5 * Math.sin(t * (2 + random(`${seed}f${i}`) * 3) + i * 1.7);
      return (
        <mesh key={i} position={[x + (random(`${seed}x${i}`) - 0.5) * spread, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[(1.2 + f * 6) * width * (0.6 + random(`${seed}w${i}`) * 0.8), 0.25 + f * 0.9]} />
          <meshBasicMaterial color={color} transparent opacity={0.25 + 0.55 * flick} toneMapped={false} depthWrite={false} fog={false} />
        </mesh>
      );
    })}
  </group>
);

/** A harbour tide gauge: a post with red/white metre bands and numbers (base y = 0). Faces +Z. */
export const TIDE_GAUGE = { w: 0.9, h: 7 };
const drawGauge = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  const n = 7;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? "#F2EEE6" : "#C8372D";
    ctx.fillRect(0, H - ((i + 1) * H) / n, W, H / n);
    fitText(ctx, `${i}`, W / 2, H - ((i + 0.5) * H) / n, W * 0.8, W * 0.62, i % 2 ? "#1A1A22" : "#FFFFFF");
  }
};
export const TideGauge: React.FC<{ position: V3 }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, TIDE_GAUGE.h / 2, -0.3]} castShadow>
      <BoxG args={[TIDE_GAUGE.w + 0.3, TIDE_GAUGE.h + 0.3, 0.5]} />
      <Flat color="#2B2F3E" />
    </mesh>
    <CanvasPanel position={[0, TIDE_GAUGE.h / 2, -0.04]} w={TIDE_GAUGE.w} h={TIDE_GAUGE.h} px={128} draw={drawGauge} />
  </group>
);

/** Stone steps at a doorway (top at y = h), for standing above a flooded street. Footprint w × d. */
export const Stoop: React.FC<{ position: V3; w?: number; d?: number; h?: number; yaw?: number }> = ({ position, w = 8, d = 6, h = 3, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    {[0, 1, 2].map((k) => (
      <mesh key={k} position={[0, (h * (k + 1)) / 6, -k * (d / 6)]} castShadow receiveShadow>
        <BoxG args={[w, (h * (k + 1)) / 3, d - (k * d) / 3]} />
        <Flat color={k % 2 ? "#8E8678" : "#A39A8A"} />
      </mesh>
    ))}
  </group>
);

// ================================================================ lab

export const LAB_COAT: HeroLook = { skin: "#E0AC84", skinShade: "#C48E68", hair: "#3A2A1E", jacket: "#E6EAF0", jacketShade: "#C4CAD4", zipper: "#AAB4C4", jeans: "#2A3A5A", shoe: "#2A2A30" };
export const labCoat = (skin: [string, string], hair: string): HeroLook => ({ ...LAB_COAT, skin: skin[0], skinShade: skin[1], hair });

/** The lab's wall screen: Earth, the Moon's orbit and the new Moon's orbit crossing it, a red alarm. */
export const drawOrbitAlert = (t: number, alarm: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0A0F22";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(143,179,217,0.12)";
  ctx.lineWidth = 2;
  for (let x = 0; x < W; x += W / 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += W / 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  const cx = W * 0.4, cy = H * 0.55, R = H * 0.32;
  // our Moon's orbit (dotted circle)
  ctx.setLineDash([10, 12]);
  ctx.strokeStyle = "#8FB3D9";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  // the new Moon's orbit (red ellipse crossing it)
  ctx.strokeStyle = "#FF5A4A";
  ctx.beginPath();
  ctx.ellipse(cx + R * 0.35, cy - R * 0.05, R * 1.25, R * 0.62, -0.35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // Earth
  ctx.fillStyle = "#2C6FB0";
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2F7A5A";
  ctx.beginPath();
  ctx.arc(cx - R * 0.04, cy - R * 0.03, R * 0.07, 0, Math.PI * 2);
  ctx.fill();
  // moons
  const a1 = t * 0.5;
  ctx.fillStyle = "#C9CED9";
  ctx.beginPath();
  ctx.arc(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R, R * 0.08, 0, Math.PI * 2);
  ctx.fill();
  const a2 = t * 0.7 + 2;
  const ex = Math.cos(a2) * R * 1.25, ey = Math.sin(a2) * R * 0.62;
  const rot = -0.35;
  ctx.fillStyle = "#D9B89A";
  ctx.beginPath();
  ctx.arc(cx + R * 0.35 + ex * Math.cos(rot) - ey * Math.sin(rot), cy - R * 0.05 + ex * Math.sin(rot) + ey * Math.cos(rot), R * 0.1, 0, Math.PI * 2);
  ctx.fill();
  // side panel
  const blink = alarm > 0 && Math.floor(t * 4) % 2 === 0;
  ctx.fillStyle = blink ? "#C8372D" : "#3A1418";
  ctx.fillRect(W * 0.7, H * 0.12, W * 0.26, H * 0.2);
  fitText(ctx, "WARNING", W * 0.83, H * 0.22, W * 0.22, H * 0.09, "#FFFFFF");
  ctx.font = CANVAS_FONT(H * 0.045, false);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "left";
  ctx.fillText("TIDAL FORCE", W * 0.7, H * 0.43);
  fitText(ctx, alarm > 0 ? `+${Math.round(120 + alarm * 280)}%` : "+0%", W * 0.83, H * 0.52, W * 0.26, H * 0.1, "#FF5A4A");
  ctx.font = CANVAS_FONT(H * 0.045, false);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "left";
  ctx.fillText("ORBITS", W * 0.7, H * 0.66);
  fitText(ctx, "CROSSING", W * 0.83, H * 0.75, W * 0.26, H * 0.08, P.amber);
};

/** A desk monitor graph (sea level spiking). */
export const drawTideChart = (k: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0A0F22";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#45E08A";
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const x = (i / 60) * W;
    const base = Math.sin(i * 0.45) * H * 0.1;
    const spike = i > 34 ? ((i - 34) / 26) ** 2 * H * 0.55 * k : 0;
    const y = H * 0.62 - base - spike;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  fitText(ctx, "SEA LEVEL", W * 0.28, H * 0.14, W * 0.5, H * 0.13, "rgba(255,255,255,0.75)");
};

/** A small research lab: back wall with a big screen, desks with monitors, a window band. */
export const LAB_SCREEN = { c: [0, 7.4, -9.6] as V3, w: 17, h: 8 };
export const Lab: React.FC<{ t: number; alarm: number }> = ({ t, alarm }) => (
  <group>
    <mesh position={[0, -0.1, 0]} receiveShadow>
      <BoxG args={[60, 0.2, 40]} />
      <Flat color="#2A3046" />
    </mesh>
    <mesh position={[0, 8, -10.2]} receiveShadow>
      <BoxG args={[60, 16, 0.6]} />
      <Flat color="#232A40" />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 18, 8, 0]} receiveShadow>
        <BoxG args={[0.6, 16, 40]} />
        <Flat color="#1E2438" />
      </mesh>
    ))}
    <mesh position={[LAB_SCREEN.c[0], LAB_SCREEN.c[1], LAB_SCREEN.c[2] - 0.12]}>
      <BoxG args={[LAB_SCREEN.w + 0.8, LAB_SCREEN.h + 0.8, 0.3]} />
      <Flat color="#0B0D16" />
    </mesh>
    <CanvasPanel position={[LAB_SCREEN.c[0], LAB_SCREEN.c[1], LAB_SCREEN.c[2] + 0.06]} w={LAB_SCREEN.w} h={LAB_SCREEN.h} draw={drawOrbitAlert(t, alarm)} />
    {alarm > 0 ? <pointLight position={[0, 9, -6]} color="#FF4A3A" intensity={(Math.floor(t * 4) % 2 === 0 ? 30 : 8) * clamp01(alarm * 3)} distance={30} decay={2} /> : null}
    {[-5.2, 5.2].map((x, i) => (
      <group key={x} position={[x, 0, -3.2]}>
        <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
          <BoxG args={[7, 0.3, 3]} />
          <Flat color="#5A6272" />
        </mesh>
        {[-2.6, 2.6].map((lx) => (
          <mesh key={lx} position={[lx, 0.75, 0]} castShadow>
            <BoxG args={[0.3, 1.5, 2.6]} />
            <Flat color="#3A4050" />
          </mesh>
        ))}
        <mesh position={[0, 2.7, -0.7]} castShadow>
          <BoxG args={[3.2, 1.9, 0.2]} />
          <Flat color="#15161C" />
        </mesh>
        <CanvasPanel position={[0, 2.75, -0.58]} w={2.9} h={1.6} px={512} draw={drawTideChart(clamp01(alarm * 1.5 + i * 0.1))} />
      </group>
    ))}
    {[-12, 0, 12].map((x) => (
      <mesh key={x} position={[x, 14.6, -9.8]}>
        <BoxG args={[6, 0.3, 0.3]} />
        <Glow color="#DCE6FF" />
      </mesh>
    ))}
  </group>
);
