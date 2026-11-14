/**
 * Props for "What If Earth Lost Its Shield?" (ep. 8: Earth's magnetic field gone for 24 hours).
 * Space diagrams are laid out vertically for 9:16: the Sun is up (+y), Earth sits at the origin and the
 * solar wind flows down (−y). The magnetic axis is horizontal (x), so the field loops reach up toward
 * the Sun (squashed) and down away from it (stretched into a tail).
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { BoxG, chamferBox, CylG, IcoG } from "../../slavoski/detail";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { clamp01, noise1, type V3 } from "../../slavoski/noise";
import { CANVAS_FONT, CanvasPanel } from "../../slavoski/screens";

// ================================================================ helpers

const smooth = (t: number) => {
  const k = clamp01(t);
  return k * k * (3 - 2 * k);
};

/** A faceted icosphere with one colour per face (non-indexed, vertex colours). */
const facetSphere = (radius: number, detail: number, colorOf: (n: THREE.Vector3, i: number) => THREE.Color) => {
  const g = new THREE.IcosahedronGeometry(radius, detail);
  const pos = g.getAttribute("position");
  const colors = new Float32Array(pos.count * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let f = 0; f < pos.count / 3; f++) {
    a.fromBufferAttribute(pos, f * 3);
    b.fromBufferAttribute(pos, f * 3 + 1);
    c.fromBufferAttribute(pos, f * 3 + 2);
    const n = a.clone().add(b).add(c).normalize();
    const col = colorOf(n, f);
    for (let k = 0; k < 3; k++) colors.set([col.r, col.g, col.b], (f * 3 + k) * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return g;
};

// ================================================================ the compass (the hook and the ending)

export const COMPASS = { r: 0.34, h: 0.13 };

/**
 * Needle heading in radians (0 = north). Steady with a tiny tremor until `loose`, then it wanders
 * aimlessly round the dial; from `back` it swings home and settles on north.
 */
export const needleHeading = (t: number, loose = Infinity, back = Infinity) => {
  const tremor = 0.035 * Math.sin(t * 3.1) + 0.02 * Math.sin(t * 7.3);
  if (t < loose) return tremor;
  const wander = (u: number) => {
    const ramp = Math.min(u, 0.5);
    return 0.9 * ramp * ramp * 4 + 2.1 * Math.max(0, u - 0.5) + 0.9 * Math.sin(u * 1.6) * smooth(u) + noise1("needle", u * 1.4) * 0.6 * smooth(u);
  };
  if (t < back) return wander(t - loose) + tremor;
  // swing home from wherever it was (taking the short way round), with a damped overshoot
  const from = wander(back - loose);
  const wrapped = ((from + Math.PI) % (Math.PI * 2)) - Math.PI;
  const u = t - back;
  return wrapped * Math.exp(-3.2 * u) * Math.cos(7.5 * u) + tremor;
};

const drawDial = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  const cx = W / 2, cy = H / 2, R = W / 2;
  ctx.fillStyle = "#F2EAD3";
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.98, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#3A3328";
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const long = i % 9 === 0;
    ctx.lineWidth = long ? W * 0.012 : W * 0.005;
    const r0 = R * (long ? 0.72 : 0.8);
    ctx.beginPath();
    ctx.moveTo(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0);
    ctx.lineTo(cx + Math.sin(a) * R * 0.88, cy - Math.cos(a) * R * 0.88);
    ctx.stroke();
  }
  const letters: [string, number, string][] = [
    ["N", 0, "#C8372D"],
    ["E", Math.PI / 2, "#2A2620"],
    ["S", Math.PI, "#2A2620"],
    ["W", -Math.PI / 2, "#2A2620"],
  ];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  letters.forEach(([s, a, col]) => {
    ctx.fillStyle = col;
    ctx.font = CANVAS_FONT(W * 0.13);
    ctx.fillText(s, cx + Math.sin(a) * R * 0.55, cy - Math.cos(a) * R * 0.55);
  });
  ctx.lineWidth = W * 0.008;
  ctx.strokeStyle = "#B89A5A";
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.36, 0, Math.PI * 2);
  ctx.stroke();
};

let dialTex: THREE.CanvasTexture | null = null;
const dialTexture = () => {
  if (dialTex) return dialTex;
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  drawDial(c.getContext("2d")!, 512, 512);
  dialTex = new THREE.CanvasTexture(c);
  dialTex.colorSpace = THREE.SRGBColorSpace;
  dialTex.anisotropy = 8;
  return dialTex;
};

/** A flat diamond half-needle pointing along −z (north) in the compass plane. */
const halfNeedle = (len: number, w: number) => {
  const s = new THREE.Shape();
  s.moveTo(0, len);
  s.lineTo(w, 0);
  s.lineTo(-w, 0);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false });
  g.rotateX(-Math.PI / 2); // shape +y → −z, extrusion → +y
  return g;
};

/** A brass pocket compass lying flat (dial facing +y). `heading` turns the needle (0 = north, −z). */
export const Compass: React.FC<{ position?: V3; rotation?: V3; scale?: number; heading: number }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, heading }) => {
  const { r, h } = COMPASS;
  const north = useMemo(() => halfNeedle(r * 0.78, r * 0.13), [r]);
  const south = useMemo(() => {
    const g = halfNeedle(r * 0.78, r * 0.13);
    g.rotateY(Math.PI);
    return g;
  }, [r]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh castShadow receiveShadow>
        <CylG args={[r, r * 1.05, h, 28]} />
        <Flat color="#B8862E" />
      </mesh>
      <mesh position={[0, h / 2 + 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r * 0.96, r * 0.07, 4, 28]} />
        <Flat color="#E0B355" />
      </mesh>
      {/* the hinge loop at north */}
      <mesh position={[0, 0, -r * 1.12]} rotation={[0, 0, 0]}>
        <torusGeometry args={[r * 0.16, r * 0.045, 4, 12]} />
        <Flat color="#E0B355" />
      </mesh>
      <mesh position={[0, h / 2 + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[r * 0.92, 32]} />
        <meshBasicMaterial map={dialTexture()} toneMapped={false} />
      </mesh>
      <group position={[0, h / 2 + 0.02, 0]} rotation={[0, -heading, 0]}>
        <mesh geometry={north}>
          <Flat color="#D8342A" />
        </mesh>
        <mesh geometry={south}>
          <Flat color="#EDEFF2" />
        </mesh>
        <mesh position={[0, 0.012, 0]}>
          <CylG args={[r * 0.07, r * 0.07, 0.03, 10]} />
          <Flat color="#E0B355" />
        </mesh>
      </group>
      <mesh position={[0, h / 2 + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[r * 0.93, 28]} />
        <meshLambertMaterial color="#DDEEFF" transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  );
};

// ================================================================ the magnetic shield

export const SHIELD_CYAN = "#5FD4FF";

/** Dipole field lines (axis along x) of an Earth of radius R, squashed on the Sun side and stretched downwind. */
const fieldLoops = (R: number, Ls: number[], nPhi: number) => {
  const out: { pts: THREE.Vector3[]; k: number }[] = [];
  const Lmax = Math.max(...Ls);
  Ls.forEach((L) => {
    const k = (L - 1) / Math.max(0.001, Lmax - 1);
    const lmax = Math.acos(Math.sqrt(1 / L));
    for (let j = 0; j < nPhi; j++) {
      const phi = (j / nPhi) * Math.PI * 2 + 0.2;
      const pts: THREE.Vector3[] = [];
      for (let s = 0; s <= 40; s++) {
        const lam = -lmax + (2 * lmax * s) / 40;
        const r = L * R * Math.cos(lam) ** 2;
        const a = r * Math.sin(lam);
        const rho = r * Math.cos(lam);
        let y = rho * Math.cos(phi);
        const z = rho * Math.sin(phi);
        y = y > 0 ? y * (1 - 0.28 * k) : y * (1 + 1.1 * k);
        pts.push(new THREE.Vector3(a, y, z));
      }
      out.push({ pts, k });
    }
  });
  return out;
};

/**
 * Earth's magnetic field as glowing faceted loops. `on` 0..1 switches it (loops flicker out one by one,
 * outer ones first); `ghost` draws a faint memory of it instead (where the shield used to be).
 */
export const FieldLines: React.FC<{ R?: number; on?: number; t: number; ghost?: boolean; color?: string; position?: V3; rotation?: V3; seed?: string }> = ({
  R = 3,
  on = 1,
  t,
  ghost = false,
  color = SHIELD_CYAN,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  seed = "field",
}) => {
  const loops = useMemo(
    () =>
      fieldLoops(R, [1.55, 2.1, 2.8, 3.6], 8).map((l) => ({
        geom: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(l.pts), 56, R * 0.014 * (1.2 - l.k * 0.4), 5, false),
        k: l.k,
      })),
    [R],
  );
  return (
    <group position={position} rotation={rotation}>
      {loops.map((l, i) => {
        const order = (1 - l.k) * 0.55 + random(`${seed}o${i}`) * 0.45; // outer loops die first
        const life = clamp01(on * 1.6 - (1 - order) * 0.6);
        const flick = life > 0 && life < 1 ? (noise1(`${seed}f${i}`, t * 18) > -0.1 ? 1 : 0.15) : 1;
        const o = ghost ? 0.13 : life * flick * (0.85 - l.k * 0.25);
        if (o <= 0.01) return null;
        return (
          <mesh key={i} geometry={l.geom}>
            <Glow color={ghost ? "#C9D8F0" : color} opacity={o} additive fog={false} />
          </mesh>
        );
      })}
    </group>
  );
};

/** The shield's outer boundary (a paraboloid opening downwind): radius at height y, or 0 above the nose. */
export const shieldRadius = (y: number, R: number) => {
  const nose = 3.3 * R;
  if (y >= nose) return 0;
  return Math.sqrt(2.05 * R * (nose - y));
};

/**
 * The "invisible shield": a faint faceted bubble (triangle edges glowing) wrapped around Earth's day side.
 * `shatter` 0..1 breaks it into shards that fly apart and fade, blown downwind.
 */
export const ShieldBubble: React.FC<{ R?: number; on?: number; shatter?: number; t?: number; color?: string; seed?: string }> = ({
  R = 3,
  on = 1,
  shatter = 0,
  color = SHIELD_CYAN,
  seed = "bubble",
}) => {
  const base = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 9; i++) {
      const y = 3.3 * R - (i / 9) ** 1.6 * 10.5 * R;
      pts.push(new THREE.Vector2(Math.max(0.001, shieldRadius(y, R)), y));
    }
    return new THREE.LatheGeometry(pts, 18).toNonIndexed();
  }, [R]);
  const k = Math.round(clamp01(shatter) * 90) / 90;
  const geom = useMemo(() => {
    if (k <= 0) return base;
    const g = base.clone();
    const pos = g.getAttribute("position");
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (let f = 0; f < pos.count / 3; f++) {
      a.fromBufferAttribute(pos, f * 3);
      b.fromBufferAttribute(pos, f * 3 + 1);
      c.fromBufferAttribute(pos, f * 3 + 2);
      const cen = a.clone().add(b).add(c).divideScalar(3);
      const out = cen.clone().setY(cen.y * 0.3).normalize();
      const r = random(`${seed}${f}`);
      const d = out.multiplyScalar(k * R * (0.6 + r * 1.4)).add(new THREE.Vector3(0, -k * k * R * (2 + r * 3), 0));
      const spin = k * (r - 0.5) * 3;
      for (let v = 0; v < 3; v++) {
        const p = new THREE.Vector3().fromBufferAttribute(pos, f * 3 + v).sub(cen);
        p.applyAxisAngle(new THREE.Vector3(r - 0.5, 1, 0.5 - r).normalize(), spin).multiplyScalar(1 - k * 0.5);
        p.add(cen).add(d);
        pos.setXYZ(f * 3 + v, p.x, p.y, p.z);
      }
    }
    pos.needsUpdate = true;
    return g;
  }, [base, k, R, seed]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geom, 1), [geom]);
  const o = clamp01(on) * (1 - k);
  if (o <= 0.01) return null;
  return (
    <group>
      <mesh geometry={geom}>
        <meshBasicMaterial color={color} transparent opacity={0.07 * o} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} fog={false} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={color} transparent opacity={0.4 * o} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
      </lineSegments>
    </group>
  );
};

// ================================================================ the solar wind

/**
 * Streaks of charged particles pouring down from the Sun. With `shield` 1 they slide round the bubble;
 * with 0 they fly straight in and stop at the top of the atmosphere (pair with AtmoHits).
 */
export const SolarWind: React.FC<{
  t: number;
  R?: number;
  shield?: number;
  count?: number;
  width?: number;
  top?: number;
  bottom?: number;
  speed?: number;
  length?: number;
  color?: string;
  opacity?: number;
  seed?: string;
  /** Particles start this far in front of/behind Earth (z spread). */
  depth?: number;
}> = ({ t, R = 3, shield = 1, count = 420, width = 14, top = 34, bottom = -30, speed = 16, length = 1.1, color = "#FFE3A0", opacity = 0.85, seed = "wind", depth }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        rho: Math.sqrt(random(`${seed}r${i}`)) * width,
        phi: random(`${seed}p${i}`) * Math.PI * 2,
        phase: random(`${seed}ph${i}`),
        v: 0.75 + random(`${seed}v${i}`) * 0.5,
        w: 0.6 + random(`${seed}w${i}`) * 0.8,
      })),
    [count, width, seed],
  );
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const span = top - bottom;
    const Ra = R * 1.06;
    const at = (it: (typeof items)[number], y: number): THREE.Vector3 => {
      const rs = shieldRadius(y, R);
      const rho = Math.sqrt(it.rho * it.rho + shield * rs * rs);
      const zs = depth !== undefined ? depth / width : 1;
      return new THREE.Vector3(Math.cos(it.phi) * rho, y, Math.sin(it.phi) * rho * zs);
    };
    const mat = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    items.forEach((it, i) => {
      const y = top - ((t * speed * it.v + it.phase * span) % span);
      const p = at(it, y);
      const p2 = at(it, y + 0.4);
      const dir = p2.clone().sub(p).normalize();
      // stopped by the atmosphere (no shield): hide once it reaches the sphere
      const hit = p.length() < Ra || (p.y < 0 && Math.hypot(p.x, p.z) < Ra && shield < 0.5);
      const s = hit ? 0.0001 : 1;
      q.setFromUnitVectors(up, dir);
      mat.compose(p.clone().addScaledVector(dir, length * 0.5), q, new THREE.Vector3(0.05 * it.w * s, length * it.w * s, 0.05 * it.w * s));
      m.setMatrixAt(i, mat);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
    </instancedMesh>
  );
};

/** Flashes where particles strike the top of an unshielded atmosphere (Sun side), plus a faint glowing cap. */
export const AtmoHits: React.FC<{ R?: number; t: number; amount?: number; count?: number; color?: string; seed?: string }> = ({ R = 3, t, amount = 1, count = 160, color = "#9CFFC0", seed = "hits" }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const sites = useMemo(() => {
    const out: { p: THREE.Vector3; rate: number; ph: number }[] = [];
    let i = 0;
    while (out.length < count && i < count * 6) {
      const u = random(`${seed}u${i}`) * 2 - 1;
      const th = random(`${seed}t${i}`) * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const n = new THREE.Vector3(s * Math.cos(th), u, s * Math.sin(th));
      if (n.y > 0.05 + random(`${seed}y${i}`) * 0.25) out.push({ p: n.multiplyScalar(R * 1.05), rate: 1.5 + random(`${seed}r${i}`) * 3, ph: random(`${seed}p${i}`) * 10 });
      i++;
    }
    return out;
  }, [R, count, seed]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const mat = new THREE.Matrix4();
    sites.forEach((s, i) => {
      const f = Math.max(0, Math.sin(t * s.rate * 3 + s.ph)) ** 6 * amount;
      const sc = R * 0.026 * f + 0.0001;
      mat.makeScale(sc, sc, sc).setPosition(s.p);
      m.setMatrixAt(i, mat);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, sites.length]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
      </instancedMesh>
      {amount > 0.02 ? (
        <mesh scale={[1, 1, 1]}>
          <sphereGeometry args={[R * 1.09, 24, 8, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
          <meshBasicMaterial color={color} transparent opacity={0.08 * amount} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} fog={false} />
        </mesh>
      ) : null}
    </group>
  );
};

// ================================================================ the Sun

/** A faceted glowing Sun with prominence arcs; `flare` 0..1 erupts a burst (a mass ejection) toward −y. */
export const Sun: React.FC<{ position?: V3; radius?: number; t: number; flare?: number; seed?: string; halo?: number }> = ({ position = [0, 0, 0], radius = 4, t, flare = 0, seed = "sun", halo = 1 }) => {
  const geom = useMemo(() => {
    const cols = ["#FFD65C", "#FFC145", "#FFAE34", "#FF9426", "#FFE27A"].map((c) => new THREE.Color(c));
    return facetSphere(radius, 2, (_n, i) => cols[Math.floor(random(`${seed}${i}`) * cols.length)]);
  }, [radius, seed]);
  const arcs = [
    { rot: [0.1, 0.3, -1.25] as V3, r: 0.3, ph: 0 },
    { rot: [-0.2, -0.4, 1.15] as V3, r: 0.24, ph: 1.7 },
    { rot: [0.3, 0.2, 2.3] as V3, r: 0.27, ph: 3.1 },
  ];
  const burst = smooth(flare);
  return (
    <group position={position}>
      <mesh geometry={geom} rotation={[0.3, t * 0.08, 0.1]}>
        <meshBasicMaterial vertexColors toneMapped={false} fog={false} />
      </mesh>
      {arcs.map((a, i) => {
        const rise = 1 + 0.12 * Math.sin(t * 1.3 + a.ph) + burst * (i === 0 ? 1.8 : 0.4);
        return (
          <group key={i} rotation={a.rot}>
            <mesh position={[0, radius * 0.96, 0]} scale={[1, rise, 1]}>
              <torusGeometry args={[radius * a.r, radius * 0.035, 5, 18, Math.PI]} />
              <Glow color="#FF6A1A" fog={false} />
            </mesh>
          </group>
        );
      })}
      <Halo size={radius * 7 * halo} color="#FFA040" opacity={0.75} />
      <Halo size={radius * 3.2 * halo} color="#FFF0C0" opacity={0.6} />
      {flare > 0 && flare < 1 ? (
        <group rotation={[Math.PI, 0, 0]}>
          {/* the ejection: a glowing faceted cap racing downward and fading */}
          <mesh position={[0, radius * (1 + burst * 7), 0]} scale={1 + burst * 5}>
            <sphereGeometry args={[radius * 0.9, 16, 4, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
            <meshBasicMaterial color="#FFB050" transparent opacity={0.55 * (1 - burst)} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} fog={false} />
          </mesh>
          <Halo position={[0, radius * 1.4, 0]} size={radius * 10 * (1 - burst * 0.6)} color="#FFE0A0" opacity={0.9 * (1 - burst)} />
        </group>
      ) : null}
    </group>
  );
};

// ================================================================ the space station

const PanelWing: React.FC<{ position: V3; len?: number }> = ({ position, len = 6 }) => (
  <group position={position}>
    <mesh castShadow>
      <boxGeometry args={[1.7, len, 0.06]} />
      <meshLambertMaterial color="#20407A" flatShading emissive="#0A1830" />
    </mesh>
    {Array.from({ length: 5 }, (_, i) => (
      <mesh key={i} position={[0, -len / 2 + ((i + 1) * len) / 6, 0.04]}>
        <boxGeometry args={[1.72, 0.05, 0.02]} />
        <Flat color="#C9A24A" />
      </mesh>
    ))}
    <mesh position={[0, 0, 0.04]}>
      <boxGeometry args={[0.05, len, 0.02]} />
      <Flat color="#C9A24A" />
    </mesh>
  </group>
);

/** Our own low-poly space station: a long truss, four pairs of solar wings, white modules, radiators. */
export const SpaceStation: React.FC<{ position?: V3; rotation?: V3; scale?: number; t: number; alarm?: number }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, t, alarm = 0 }) => {
  const blink = Math.floor(t * 2) % 2 === 0;
  const red = alarm > 0 && Math.floor(t * 4) % 2 === 0;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={chamferBox(17, 0.55, 0.55)} castShadow receiveShadow>
        <Flat color="#B8C0CC" />
      </mesh>
      {[-7.6, -5.4, 5.4, 7.6].map((x) => (
        <group key={x}>
          <PanelWing position={[x, 3.5, 0]} />
          <PanelWing position={[x, -3.5, 0]} />
          <mesh position={[x, 0, 0]}>
            <BoxG args={[0.7, 0.8, 0.7]} />
            <Flat color="#8E96A6" />
          </mesh>
        </group>
      ))}
      {/* pressurised modules along z */}
      {[-2.6, 0, 2.6].map((z, i) => (
        <mesh key={z} position={[0, -0.9, z]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <CylG args={[0.62, 0.62, i === 1 ? 1.6 : 2.4, 12]} />
          <Flat color="#E6EAF0" />
        </mesh>
      ))}
      <mesh position={[0, -0.9, 0]} castShadow>
        <BoxG args={[1.5, 1.5, 1.5]} />
        <Flat color="#D6DCE6" />
      </mesh>
      {[-2.6, 2.6].map((x) => (
        <mesh key={x} position={[x, -0.2, -1.6]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[1.4, 0.05, 2.6]} />
          <Flat color="#F4F6FA" />
        </mesh>
      ))}
      <mesh position={[0, -0.9, 3.95]}>
        <IcoG args={[0.12, 1]} />
        <Glow color={red ? "#FF3A2A" : blink ? "#45E08A" : "#1A3A24"} fog={false} />
      </mesh>
      {red ? <Halo position={[0, -0.9, 4.0]} size={2.2} color="#FF3A2A" opacity={0.8} /> : null}
    </group>
  );
};

// ================================================================ Mars

/** A faceted red planet; `strip` 0..1 shows its thin air being blown away downwind by the solar wind. */
export const RedPlanet: React.FC<{ radius?: number; position?: V3; rotation?: V3; t: number; strip?: number; seed?: string }> = ({ radius = 2, position = [0, 0, 0], rotation = [0, 0, 0], t, strip = 1, seed = "mars" }) => {
  const geom = useMemo(() => {
    const cols = [new THREE.Color("#B5502E"), new THREE.Color("#9A4026"), new THREE.Color("#C8724A"), new THREE.Color("#7E3320")];
    return facetSphere(radius, 3, (n, i) => {
      if (Math.abs(n.y) > 0.9) return new THREE.Color("#EDE4DA");
      const r = random(`${seed}${i}`);
      return cols[r < 0.45 ? 0 : r < 0.7 ? 1 : r < 0.92 ? 2 : 3];
    });
  }, [radius, seed]);
  const wisps = 46;
  return (
    <group position={position}>
      {/* the planet's thin air trailing off downwind like a faint comet tail */}
      <mesh position={[0, -radius * 2.6, 0]}>
        <cylinderGeometry args={[radius * 1.15, radius * 1.9, radius * 4.6, 14, 1, true]} />
        <meshBasicMaterial color="#F0A880" transparent opacity={0.07 * strip} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} fog={false} />
      </mesh>
      <mesh>
        <IcoG args={[radius * 1.07, 2]} />
        <meshBasicMaterial color="#F0A880" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
      </mesh>
      <mesh geometry={geom} rotation={rotation} castShadow>
        <meshLambertMaterial vertexColors flatShading color="#ffffff" fog={false} />
      </mesh>
      {Array.from({ length: wisps }, (_, i) => {
        // each wisp leaves the Sun-side limb, slides round the planet and trails off downwind, fading
        const ph = random(`${seed}w${i}`);
        const u = (t * 0.35 + ph) % 1;
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const lat = 0.25 + u * 1.2;
        const r = radius * (1.08 + u * 0.4);
        const y = Math.cos(Math.min(lat, Math.PI / 2)) * r - Math.max(0, u - 0.3) * radius * 5;
        const rho = Math.sin(Math.min(lat, Math.PI / 2)) * r + u * radius * 0.6;
        const o = strip * (1 - u) * Math.min(1, u * 6) * 0.9;
        return (
          <mesh key={i} position={[Math.cos(a) * rho, y, Math.sin(a) * rho]} scale={[radius * 0.04, radius * (0.15 + u * 0.4), radius * 0.04]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#F0B090" transparent opacity={o} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} fog={false} />
          </mesh>
        );
      })}
    </group>
  );
};

// ================================================================ the night sky

/**
 * Aurora curtains: a faceted ribbon hanging in the sky, waving slowly, green at the foot fading to purple.
 * Additive, so dark colours vanish into the sky.
 */
export const Aurora: React.FC<{ t: number; position?: V3; width?: number; height?: number; bend?: number; opacity?: number; seed?: string; yaw?: number }> = ({
  t,
  position = [0, 40, -160],
  width = 320,
  height = 70,
  bend = 60,
  opacity = 0.8,
  seed = "aurora",
  yaw = 0,
}) => {
  const SX = 90, SY = 6;
  const tq = Math.round(t * 30) / 30;
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1, SX, SY).toNonIndexed();
    return g;
  }, []);
  const shaped = useMemo(() => {
    const g = geom.clone();
    const pos = g.getAttribute("position");
    const colors = new Float32Array(pos.count * 3);
    const foot = new THREE.Color("#5DFFA0");
    const mid = new THREE.Color("#2FC8A0");
    const crown = new THREE.Color("#8A4CFF");
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i) + 0.5;
      const v = pos.getY(i) + 0.5;
      const wave = noise1(`${seed}w`, u * 5 + tq * 0.25) * 0.5 + noise1(`${seed}w2`, u * 13 - tq * 0.4) * 0.18;
      const x = (u - 0.5) * width;
      const z = -Math.sin(u * Math.PI) * bend + wave * bend * 0.6 + v * height * 0.15;
      const y = v * height * (0.75 + 0.35 * (noise1(`${seed}h`, u * 7 + tq * 0.2) * 0.5 + 0.5));
      pos.setXYZ(i, x, y, z);
      const rays = 0.55 + 0.45 * Math.abs(noise1(`${seed}r`, u * 24 + tq * 0.6));
      const edge = Math.min(1, u * 3.5, (1 - u) * 3.5) ** 1.6;
      const c = v < 0.35 ? foot.clone().lerp(mid, v / 0.35) : mid.clone().lerp(crown, (v - 0.35) / 0.65);
      c.multiplyScalar(rays * edge * (1 - v) ** 1.3);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    pos.needsUpdate = true;
    return g;
  }, [geom, tq, width, height, bend, seed]);
  return (
    <mesh geometry={shaped} position={position} rotation={[0, yaw, 0]}>
      <meshBasicMaterial vertexColors transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} fog={false} />
    </mesh>
  );
};

/** A distant town on the horizon at night: a band of warm window dots. */
export const TownLights: React.FC<{ position: V3; width?: number; count?: number; seed?: string; yaw?: number }> = ({ position, width = 120, count = 140, seed = "town", yaw = 0 }) => {
  const geom = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < count; i++) pts.push((random(`${seed}x${i}`) - 0.5) * width, random(`${seed}y${i}`) ** 2 * 6, (random(`${seed}z${i}`) - 0.5) * 12);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [count, width, seed]);
  return (
    <points geometry={geom} position={position} rotation={[0, yaw, 0]}>
      <pointsMaterial color="#F2C46A" size={3} sizeAttenuation={false} fog={false} toneMapped={false} />
    </points>
  );
};

// ================================================================ hand props

/** A takeaway coffee cup (height 0.46), centred at its middle. */
export const CoffeeCup: React.FC<{ position: V3; rotation?: V3 }> = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation}>
    <mesh castShadow>
      <CylG args={[0.17, 0.13, 0.46, 10]} />
      <Flat color="#F2EEE6" />
    </mesh>
    <mesh position={[0, 0.02, 0]}>
      <CylG args={[0.165, 0.15, 0.16, 10]} />
      <Flat color="#8A5A3A" />
    </mesh>
    <mesh position={[0, 0.25, 0]}>
      <CylG args={[0.18, 0.18, 0.05, 10]} />
      <Flat color="#2A2A30" />
    </mesh>
  </group>
);

const drawSpf = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#FFF4D8";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#F2B21C";
  ctx.beginPath();
  ctx.arc(W / 2, H * 0.3, W * 0.17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#C8372D";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = CANVAS_FONT(W * 0.27);
  ctx.fillText("SPF", W / 2, H * 0.62);
  ctx.fillText("50", W / 2, H * 0.84);
};

/** A squeezy sunscreen bottle (height 0.62), centred at its middle. */
export const Sunscreen: React.FC<{ position: V3; rotation?: V3 }> = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation}>
    <mesh geometry={chamferBox(0.34, 0.52, 0.17)} castShadow>
      <Flat color="#F08A24" />
    </mesh>
    <CanvasPanel position={[0, 0.0, 0.087]} w={0.28} h={0.3} px={256} draw={drawSpf} />
    <mesh position={[0, 0.3, 0]}>
      <CylG args={[0.07, 0.09, 0.1, 8]} />
      <Flat color="#F4F6FA" />
    </mesh>
  </group>
);

/** A garden fence along x (pickets 1.9 tall), from x0 to x1 at depth z. */
export const Fence: React.FC<{ x0: number; x1: number; z: number; color?: string }> = ({ x0, x1, z, color = "#D8CBB0" }) => {
  const n = Math.max(2, Math.round((x1 - x0) / 0.7));
  return (
    <group>
      {Array.from({ length: n + 1 }, (_, i) => (
        <mesh key={i} position={[x0 + ((x1 - x0) * i) / n, 0.95, z]} castShadow>
          <BoxG args={[0.32, 1.9, 0.12]} />
          <Flat color={color} />
        </mesh>
      ))}
      {[0.5, 1.4].map((y) => (
        <mesh key={y} position={[(x0 + x1) / 2, y, z - 0.1]}>
          <BoxG args={[x1 - x0, 0.16, 0.08]} />
          <Flat color={color} />
        </mesh>
      ))}
    </group>
  );
};
