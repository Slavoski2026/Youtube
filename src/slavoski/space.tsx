/**
 * Space kit: FacetedMoon, FacetedEarth (atmosphere rim, clouds, tidal stretch), OrbitPath (dotted),
 * BlackHole (dark core + dashed marker ring), AccretionDisk.
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { fbm3, type V3 } from "./noise";
import { P } from "./palette";
import { Flat, Glow } from "./materials";

const faceColors = (geom: THREE.BufferGeometry, colorOf: (n: THREE.Vector3, i: number) => THREE.Color) => {
  const pos = geom.getAttribute("position");
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
  geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geom;
};

export const FacetedMoon: React.FC<{
  radius?: number;
  position?: V3;
  rotation?: V3;
  detail?: number;
  seed?: string;
  /** Sky objects shouldn't fade into the fog. */
  fog?: boolean;
}> = ({ radius = 1, position = [0, 0, 0], rotation = [0, 0, 0], detail = 3, seed = "moon", fog = false }) => {
  const geom = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(radius, detail);
    const base = new THREE.Color(P.moon);
    const dark = new THREE.Color(P.moonDark);
    return faceColors(g, (n, i) => {
      const maria = fbm3(seed, n.x * 1.8 + 3, n.y * 1.8, n.z * 1.8, 3);
      const jitter = (random(`${seed}f${i}`) - 0.5) * 0.16;
      const t = maria < 0.42 ? 0.75 : maria < 0.47 ? 0.35 : 0;
      return base.clone().lerp(dark, t).multiplyScalar(1 + jitter);
    });
  }, [radius, detail, seed]);
  return (
    <mesh geometry={geom} position={position} rotation={rotation} castShadow receiveShadow>
      <meshLambertMaterial color="#ffffff" vertexColors flatShading fog={fog} emissive="#3A3F4C" />
    </mesh>
  );
};

/** Fresnel rim glow shell for atmospheres. */
const RimMaterial: React.FC<{ color: string; power?: number; intensity?: number }> = ({ color, power = 2.6, intensity = 1.1 }) => {
  const uniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color(color) }, uPower: { value: power }, uIntensity: { value: intensity } }),
    [color, power, intensity],
  );
  return (
    <shaderMaterial
      uniforms={uniforms}
      transparent
      depthWrite={false}
      blending={THREE.AdditiveBlending}
      vertexShader={`
        varying vec3 vN; varying vec3 vV;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position,1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`}
      fragmentShader={`
        uniform vec3 uColor; uniform float uPower; uniform float uIntensity;
        varying vec3 vN; varying vec3 vV;
        void main(){
          float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPower);
          gl_FragColor = vec4(uColor * f * uIntensity, f);
        }`}
    />
  );
};

export type EarthProps = {
  radius?: number;
  position?: V3;
  rotation?: V3;
  detail?: number;
  seed?: string;
  clouds?: boolean;
  /** Tidal stretch: 0 = sphere. Stretches along `stretchDir` and squashes the other axes (volume-ish). */
  stretch?: number;
  stretchDir?: V3;
  /** 0..1 cracks glowing (lava lines between facets): rendered as a darkening + emissive shell. */
  heat?: number;
  /** 0..1 share of city lights on (amber dots on land). Light the planet from behind to see them. */
  cityLights?: number;
};

export const FacetedEarth: React.FC<EarthProps> = ({
  radius = 3,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  detail = 5,
  seed = "earth",
  clouds = true,
  stretch = 0,
  stretchDir = [0, 1, 0],
  heat = 0,
  cityLights = 0,
}) => {
  const lightSites = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(radius * 1.004, detail);
    const pos = g.getAttribute("position");
    const out: { p: THREE.Vector3; thr: number }[] = [];
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (let f = 0; f < pos.count / 3; f++) {
      a.fromBufferAttribute(pos, f * 3);
      b.fromBufferAttribute(pos, f * 3 + 1);
      c.fromBufferAttribute(pos, f * 3 + 2);
      const cen = a.clone().add(b).add(c).divideScalar(3);
      const n = cen.clone().normalize();
      const land = fbm3(seed, n.x * 1.5 + 10, n.y * 1.5, n.z * 1.5, 4);
      if (land > 0.53 && Math.abs(n.y) < 0.85 && random(`${seed}city${f}`) < 0.45) out.push({ p: cen, thr: random(`${seed}cthr${f}`) });
    }
    return out;
  }, [radius, detail, seed]);
  const lq = Math.round(cityLights * 40) / 40;
  const lightGeom = useMemo(() => {
    if (lq <= 0) return null;
    const on = lightSites.filter((l) => l.thr < lq);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(on.flatMap((l) => [l.p.x, l.p.y, l.p.z]), 3));
    return g;
  }, [lightSites, lq]);
  const geom = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(radius, detail);
    const ocean = new THREE.Color(P.ocean);
    const green = new THREE.Color(P.landGreen);
    const tan = new THREE.Color(P.landTan);
    const ice = new THREE.Color(P.ice);
    return faceColors(g, (n, i) => {
      const land = fbm3(seed, n.x * 1.5 + 10, n.y * 1.5, n.z * 1.5, 4);
      const dry = fbm3(`${seed}dry`, n.x * 2.4, n.y * 2.4 + 5, n.z * 2.4, 3);
      const j = 1 + (random(`${seed}j${i}`) - 0.5) * 0.12;
      if (Math.abs(n.y) > 0.93) return ice.clone().multiplyScalar(j);
      if (land > 0.53) {
        const lat = Math.abs(n.y);
        const isDry = dry > 0.5 && lat < 0.55;
        return (isDry ? tan : green).clone().multiplyScalar(j);
      }
      return ocean.clone().multiplyScalar(j * (land > 0.5 ? 1.15 : 1));
    });
  }, [radius, detail, seed]);

  const cloudGeom = useMemo(() => {
    if (!clouds) return null;
    const src = new THREE.IcosahedronGeometry(radius * 1.025, Math.max(2, detail - 1));
    const pos = src.getAttribute("position");
    const keep: number[] = [];
    for (let f = 0; f < pos.count / 3; f++) {
      if (random(`${seed}cloud${f}`) < 0.035) {
        for (let k = 0; k < 3; k++) keep.push(pos.getX(f * 3 + k), pos.getY(f * 3 + k), pos.getZ(f * 3 + k));
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(keep, 3));
    g.computeVertexNormals();
    return g;
  }, [clouds, radius, detail, seed]);

  // Tidal stretch: scale along the direction, squash perpendicular.
  const stretchQuat = useMemo(() => {
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...stretchDir).normalize());
    return q;
  }, [stretchDir]);
  const sy = 1 + stretch;
  const sxz = 1 / Math.sqrt(sy);

  return (
    <group position={position}>
      <group quaternion={stretchQuat}>
        <group scale={[sxz, sy, sxz]}>
          <group quaternion={stretchQuat.clone().invert()}>
            <group rotation={rotation}>
              <mesh geometry={geom} castShadow receiveShadow>
                <Flat color={heat > 0 ? new THREE.Color("#ffffff").lerp(new THREE.Color("#7a4a3a"), heat * 0.6).getStyle() : "#ffffff"} vertexColors />
              </mesh>
              {lightGeom ? (
                <points geometry={lightGeom}>
                  <pointsMaterial color={P.windowLit} size={4.5} sizeAttenuation={false} fog={false} toneMapped={false} />
                </points>
              ) : null}
              {cloudGeom ? (
                <mesh geometry={cloudGeom}>
                  <Flat color={P.ice} opacity={0.92} side={THREE.DoubleSide} />
                </mesh>
              ) : null}
            </group>
            <mesh scale={1.04}>
              <icosahedronGeometry args={[radius, 4]} />
              <RimMaterial color={heat > 0.3 ? "#FF7A2A" : P.atmosphere} power={3.2} intensity={0.75} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

/** Dotted path through points (like the title card's orbit trail). */
export const OrbitPath: React.FC<{ points: V3[]; color?: string; dotRadius?: number; spacing?: number; fade?: boolean }> = ({
  points,
  color = P.orbitDots,
  dotRadius = 0.05,
  spacing = 0.25,
  fade = true,
}) => {
  const dots = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const n = Math.max(2, Math.floor(curve.getLength() / spacing));
    return curve.getSpacedPoints(n).map((v, i) => ({ p: [v.x, v.y, v.z] as V3, t: i / n }));
  }, [points, spacing]);
  return (
    <group>
      {dots.map((d, i) => (
        <mesh key={i} position={d.p}>
          <sphereGeometry args={[dotRadius, 6, 4]} />
          <Glow color={color} opacity={fade ? 1 - d.t * 0.75 : 1} fog={false} />
        </mesh>
      ))}
    </group>
  );
};

/**
 * The black hole: a matte-black core and (optionally) a dashed amber marker ring that faces `facing`
 * (the camera position). Real size is invisible; the marker shows where it is.
 */
export const BlackHole: React.FC<{
  position?: V3;
  coreRadius?: number;
  marker?: boolean;
  markerRadius?: number;
  facing: V3;
  /** 0..1 marker draw-on. */
  markerProgress?: number;
  spin?: number;
}> = ({ position = [0, 0, 0], coreRadius = 0.12, marker = true, markerRadius = 0.9, facing, markerProgress = 1, spin = 0 }) => {
  const ring = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    ring.current?.lookAt(new THREE.Vector3(...facing));
  });
  const dashes = 28;
  return (
    <group position={position}>
      <mesh>
        <icosahedronGeometry args={[coreRadius, 1]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>
      {marker ? (
        <group ref={ring}>
          <group rotation={[0, 0, spin]}>
            {Array.from({ length: dashes }, (_, i) => {
              if (i / dashes > markerProgress) return null;
              const a = (i / dashes) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(a) * markerRadius, Math.sin(a) * markerRadius, 0]} rotation={[0, 0, a + Math.PI / 2]}>
                  <planeGeometry args={[(Math.PI * 2 * markerRadius) / dashes / 1.9, markerRadius * 0.05]} />
                  <Glow color={P.amber} fog={false} />
                </mesh>
              );
            })}
          </group>
        </group>
      ) : null}
    </group>
  );
};

/** Glowing disk of rubble around a black hole. `t` in seconds drives the orbit. */
export const AccretionDisk: React.FC<{
  position?: V3;
  rotation?: V3;
  inner?: number;
  outer?: number;
  t: number;
  chunks?: number;
  brightness?: number;
  seed?: string;
}> = ({ position = [0, 0, 0], rotation = [0.35, 0, 0.12], inner = 0.6, outer = 3.2, t, chunks = 220, brightness = 1, seed = "disk" }) => {
  const ringGeom = useMemo(() => {
    const g = new THREE.RingGeometry(inner, outer, 64, 6);
    const pos = g.getAttribute("position");
    const cols = new Float32Array(pos.count * 4);
    const hot = new THREE.Color(P.fireCore), mid = new THREE.Color(P.fire), cool = new THREE.Color(P.lava);
    for (let i = 0; i < pos.count; i++) {
      const r = Math.hypot(pos.getX(i), pos.getY(i));
      const k = (r - inner) / (outer - inner);
      const c = k < 0.4 ? hot.clone().lerp(mid, k / 0.4) : mid.clone().lerp(cool, (k - 0.4) / 0.6);
      cols.set([c.r, c.g, c.b, (1 - k) * 0.9], i * 4);
    }
    g.setAttribute("color", new THREE.BufferAttribute(cols, 4));
    return g;
  }, [inner, outer]);
  const pieces = useMemo(
    () =>
      Array.from({ length: chunks }, (_, i) => {
        const r = inner + Math.pow(random(`${seed}r${i}`), 0.8) * (outer - inner) * 1.05;
        return {
          r,
          a0: random(`${seed}a${i}`) * Math.PI * 2,
          y: (random(`${seed}y${i}`) - 0.5) * 0.12 * r,
          s: 0.03 + random(`${seed}s${i}`) * 0.09,
          hot: r < inner + (outer - inner) * 0.35,
        };
      }),
    [chunks, inner, outer, seed],
  );
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <icosahedronGeometry args={[inner * 0.35, 1]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>
      <mesh geometry={ringGeom} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial vertexColors transparent opacity={brightness} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
      </mesh>
      {pieces.map((p, i) => {
        const w = 1.6 / Math.pow(p.r, 1.5); // Kepler-ish: inner orbits faster
        const a = p.a0 + t * w;
        return (
          <mesh key={i} position={[Math.cos(a) * p.r, p.y, Math.sin(a) * p.r]} rotation={[a, a * 0.7, 0]}>
            <icosahedronGeometry args={[p.s, 0]} />
            {p.hot ? <Glow color={P.fire} fog={false} /> : <Flat color={i % 3 === 0 ? P.smoke : "#7A5A48"} />}
          </mesh>
        );
      })}
    </group>
  );
};
