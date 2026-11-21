/**
 * Portals: a door opening that shows a different 3D world, with true parallax (ep. 8 "doors-portals").
 *
 * How it works (WebGL stencil, no extra render passes):
 *  1. The outer scene draws as usual (renderOrder 0).
 *  2. The opening's MASK quad draws next (depth-tested against the outer scene, so a door leaf, a hand
 *     or a character in front of the opening keeps it covered) and writes the portal's stencil `id`.
 *  3. A FILL quad paints the portal's sky colour where the stencil matches and pushes the depth there to
 *     the far plane, so the inner world can draw over whatever outer geometry sits behind the door.
 *  4. Every mesh inside `<Portal>` is stencil-tested (drawn only inside the opening) and clipped by the
 *     door plane (so nothing of the inner world shows in front of the door).
 *
 * The inner world is placed in the same coordinates, physically behind the door (the -Z side of the
 * portal's local frame): it may overlap outer geometry freely. Inner objects don't cast or receive
 * shadows by default (shadow maps ignore the stencil). Give an inner world a `SkyDome` for its sky.
 *
 * A character stepping through: draw it outside AND inside the portal. The outside copy is erased where
 * it passes behind the door plane, the inside copy appears there, so the step reads seamless.
 *
 * The canvas needs a stencil buffer (`Stage` asks for one) and local clipping (`<Portal>` enables it).
 */
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { isBloom } from "./quality";
import { BoxG, CylG, IcoG } from "./detail";
import { Flat, Glow, Halo } from "./materials";
import type { V3 } from "./noise";

const ORDER_MASK = 20;
const ORDER_FILL = 21;
const ORDER_INNER = 22;


const FILL_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    p.z = p.w * 0.999999;
    gl_Position = p;
  }
`;
const FILL_FRAG = /* glsl */ `
  uniform vec3 top;
  uniform vec3 bottom;
  uniform float flash;
  varying vec2 vUv;
  void main() {
    vec3 c = mix(bottom, top, smoothstep(0.0, 1.0, vUv.y));
    gl_FragColor = vec4(mix(c, vec3(1.0), flash), 1.0);
    #include <colorspace_fragment>
  }
`;

/** Turns on local clipping for the canvas (needed by portals). */
const EnableClipping: React.FC = () => {
  const gl = useThree((s) => s.gl);
  gl.localClippingEnabled = true;
  return null;
};

type Mat = THREE.Material & { emissive?: THREE.Color; color?: THREE.Color };

/** Applies stencil test, clipping and render order to everything under `group`, every render. */
const useInner = (
  group: React.RefObject<THREE.Group | null>,
  id: number,
  plane: THREE.Plane,
  shadows: boolean,
  brighten: number,
  order: number,
) => {
  useLayoutEffect(() => {
    const g = group.current;
    if (!g) return;
    g.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.material) return;
      o.renderOrder = order;
      if (!shadows) {
        o.castShadow = false;
        o.receiveShadow = false;
      }
      const mats = (Array.isArray(m.material) ? m.material : [m.material]) as Mat[];
      for (const mat of mats) {
        mat.stencilWrite = true;
        mat.stencilRef = id;
        mat.stencilFunc = THREE.EqualStencilFunc;
        mat.stencilFail = THREE.KeepStencilOp;
        mat.stencilZFail = THREE.KeepStencilOp;
        mat.stencilZPass = THREE.KeepStencilOp;
        mat.clippingPlanes = [plane];
        if (brighten > 0 && mat.emissive && mat.color) mat.emissive.copy(mat.color).multiplyScalar(brighten);
      }
    });
  });
};

export type PortalProps = {
  /** Stencil id 1..255, unique per portal in a shot. */
  id: number;
  /** Centre of the opening. The opening faces +Z of its local frame (rotate with `yaw`/`rotation`). */
  position: V3;
  yaw?: number;
  rotation?: V3;
  w: number;
  h: number;
  /** 0..1: the opening grows from a vertical slit (with a white flash) to the full door. */
  open?: number;
  /** Sky colours behind the inner world (top → bottom of the opening). */
  sky?: [string, string];
  /** Inner meshes cast/receive shadows (only when nothing outside overlaps the inner world). */
  shadows?: boolean;
  /** Emissive boost on the inner world's Lambert materials (a brighter "other side": desert sun, snow glare). */
  brighten?: number;
  /** Visible from behind too (default: the back of the door shows the outer world, like a real frame). */
  doubleSided?: boolean;
  children?: React.ReactNode;
};

/** A door-shaped window into another world. Children are the inner world, in world coordinates. */
export const Portal: React.FC<PortalProps> = ({
  id,
  position,
  yaw = 0,
  rotation,
  w,
  h,
  open = 1,
  sky = ["#4A8FD6", "#C4E0F6"],
  shadows = false,
  brighten = 0,
  doubleSided = false,
  children,
}) => {
  const rot: V3 = rotation ?? [0, yaw, 0];
  const plane = useMemo(() => new THREE.Plane(), []);
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot));
  const n = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
  plane.setFromNormalAndCoplanarPoint(n, new THREE.Vector3(...position));
  const inner = useRef<THREE.Group>(null);
  // Under bloom, a strong emissive boost pushes a bright inner world over the bloom threshold: keep it subtle.
  useInner(inner, id, plane, shadows, isBloom() ? brighten * 0.3 : brighten, ORDER_INNER + id * 0.001);
  const k = Math.max(0, Math.min(1, open));
  const sx = Math.max(0.0001, k < 1 ? 0.04 + 0.96 * (1 - (1 - k) ** 3) : 1);
  const flash = k < 1 ? Math.max(0, 1 - k * 1.25) * 0.9 : 0;
  const uniforms = useMemo(() => ({ top: { value: new THREE.Color(sky[0]) }, bottom: { value: new THREE.Color(sky[1]) }, flash: { value: 0 } }), [sky[0], sky[1]]);
  uniforms.flash.value = flash;
  const side = doubleSided ? THREE.DoubleSide : THREE.FrontSide;
  if (k <= 0) return null;
  return (
    <>
      <EnableClipping />
      <group position={position} rotation={rot}>
        <mesh renderOrder={ORDER_MASK} scale={[sx, 1, 1]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial
            colorWrite={false}
            depthWrite
            side={side}
            stencilWrite
            stencilRef={id}
            stencilFunc={THREE.AlwaysStencilFunc}
            stencilZPass={THREE.ReplaceStencilOp}
          />
        </mesh>
        <mesh renderOrder={ORDER_FILL + id * 0.001} scale={[sx, 1, 1]}>
          <planeGeometry args={[w, h]} />
          <shaderMaterial
            vertexShader={FILL_VERT}
            fragmentShader={FILL_FRAG}
            uniforms={uniforms}
            depthFunc={THREE.AlwaysDepth}
            depthWrite
            side={side}
            stencilWrite
            stencilRef={id}
            stencilFunc={THREE.EqualStencilFunc}
          />
        </mesh>
      </group>
      <group ref={inner}>{children}</group>
    </>
  );
};

/** A big sky sphere for an inner world: zenith → horizon → ground, unlit, no fog. */
export const SkyDome: React.FC<{ position?: V3; radius?: number; zenith: string; horizon: string; ground?: string; sun?: { dir: V3; color: string; size?: number } }> = ({
  position = [0, 0, 0],
  radius = 400,
  zenith,
  horizon,
  ground,
  sun,
}) => {
  const geom = useMemo(() => {
    const g = new THREE.SphereGeometry(radius, 32, 20);
    const pos = g.getAttribute("position");
    const cols = new Float32Array(pos.count * 3);
    const z = new THREE.Color(zenith);
    const hz = new THREE.Color(horizon);
    const gr = new THREE.Color(ground ?? horizon);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / radius;
      if (y >= 0) c.copy(hz).lerp(z, Math.pow(y, 0.6));
      else c.copy(hz).lerp(gr, Math.min(1, -y * 4));
      cols.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    return g;
  }, [radius, zenith, horizon, ground]);
  const sd = sun ? new THREE.Vector3(...sun.dir).normalize().multiplyScalar(radius * 0.9) : null;
  return (
    <group position={position}>
      <mesh geometry={geom}>
        <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} toneMapped={false} depthWrite={false} />
      </mesh>
      {sun && sd ? (
        <>
          <mesh position={[sd.x, sd.y, sd.z]} onUpdate={(m) => m.lookAt(position[0], position[1], position[2])}>
            <circleGeometry args={[(sun.size ?? 1) * radius * 0.035, 24]} />
            <meshBasicMaterial color={isBloom() ? new THREE.Color(sun.color).multiplyScalar(3) : sun.color} fog={false} toneMapped={false} depthWrite={false} />
          </mesh>
          <Halo position={[sd.x * 0.98, sd.y * 0.98, sd.z * 0.98]} size={(sun.size ?? 1) * radius * 0.5} color={sun.color} opacity={0.55} />
        </>
      ) : null}
    </group>
  );
};

/** The swirl around a live opening: a bright inner edge, drifting sparks and a soft halo. */
export const PortalRim: React.FC<{
  position: V3;
  yaw?: number;
  w: number;
  h: number;
  t: number;
  color: string;
  /** 0..1 strength (fade in on opening). */
  k?: number;
  sparks?: number;
  seed?: string;
}> = ({ position, yaw = 0, w, h, t, color, k = 1, sparks = 26, seed = "rim" }) => {
  if (k <= 0) return null;
  const edge = 0.07;
  const pulse = 0.85 + Math.sin(t * 7.3) * 0.08 + Math.sin(t * 13.1) * 0.05;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {/* edge strips */}
      {[
        [0, h / 2 - edge / 2, w, edge],
        [0, -h / 2 + edge / 2, w, edge],
        [-w / 2 + edge / 2, 0, edge, h],
        [w / 2 - edge / 2, 0, edge, h],
      ].map(([x, y, sw, sh], i) => (
        <mesh key={i} position={[x, y, 0.012]}>
          <planeGeometry args={[sw, sh]} />
          <Glow color={color} opacity={0.9 * k * pulse} additive />
        </mesh>
      ))}
      {/* sparks drifting out of the opening */}
      {Array.from({ length: sparks }, (_, i) => {
        const life = (((t * (0.5 + random(`${seed}s${i}`) * 0.6) + random(`${seed}o${i}`)) % 1) + 1) % 1;
        const x = (random(`${seed}x${i}`) - 0.5) * w * 0.95;
        const y = (random(`${seed}y${i}`) - 0.5) * h * 0.95 + life * 0.6;
        const z = 0.05 + life * (0.6 + random(`${seed}z${i}`) * 1.2);
        const s = (0.03 + random(`${seed}r${i}`) * 0.05) * (1 - life);
        return (
          <mesh key={`s${i}`} position={[x * (1 + life * 0.3), y, z]}>
            <planeGeometry args={[s, s]} />
            <Glow color={i % 3 ? color : "#FFFFFF"} opacity={k * (1 - life) * 0.95} additive />
          </mesh>
        );
      })}
      <Halo position={[0, 0, 0.1]} size={Math.max(w, h) * 1.9} color={color} opacity={0.32 * k * pulse} />
    </group>
  );
};

/** A floor light pool in front of an opening (additive), the portal light spilling into the room. */
export const LightPool: React.FC<{ position: V3; yaw?: number; w: number; d: number; color: string; opacity?: number }> = ({ position, yaw = 0, w, d, color, opacity = 0.35 }) => {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(54, 0);
    ctx.lineTo(64, 128);
    ctx.lineTo(0, 128);
    ctx.closePath();
    ctx.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, yaw]}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial map={tex} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

/** Standard interior door: 1.0 × 2.1 in kit units ×2.2 to match Slavoski (4.2 tall). */
export const DOOR = { w: 2.2, h: 4.7, frame: 0.22, depth: 0.36, leaf: 0.12 };

/**
 * A door leaf hinged on its left edge (local x = -w/2), opening toward -Z (into the far side) for
 * positive `open` (0..1 → 0..~100°), or toward +Z with `toward`. Raised panels and a round handle.
 */
export const DoorLeaf: React.FC<{
  position: V3;
  yaw?: number;
  w?: number;
  h?: number;
  open?: number;
  toward?: boolean;
  color?: string;
  panel?: string;
  knob?: string;
  /** Handle turn (0..1) for a rattling handle. */
  handle?: number;
  window?: string;
  kind?: "panel" | "flat" | "bars" | "fridge" | "glass";
}> = ({ position, yaw = 0, w = DOOR.w, h = DOOR.h, open = 0, toward = false, color = "#E8E2D4", panel, knob = "#C9A44A", handle = 0, window, kind = "panel" }) => {
  const a = Math.max(0, Math.min(1, open)) * 1.75 * (toward ? 1 : -1);
  const t = DOOR.leaf;
  const pc = panel ?? new THREE.Color(color).multiplyScalar(0.9).getStyle();
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <group position={[-w / 2, 0, 0]} rotation={[0, -a, 0]}>
        <group position={[w / 2, 0, 0]}>
          {kind === "bars" ? (
            <>
              {[-1, 1].map((s) => (
                <mesh key={s} position={[0, (s * h) / 2 - s * 0.08, 0]} castShadow>
                  <BoxG args={[w, 0.16, 0.12]} />
                  <Flat color={color} />
                </mesh>
              ))}
              <mesh position={[0, 0.2, 0]} castShadow>
                <BoxG args={[w, 0.12, 0.12]} />
                <Flat color={color} />
              </mesh>
              {Array.from({ length: 7 }, (_, i) => (
                <mesh key={i} position={[-w / 2 + 0.12 + (i * (w - 0.24)) / 6, 0, 0]} castShadow>
                  <CylG args={[0.045, 0.045, h, 6]} />
                  <Flat color={color} />
                </mesh>
              ))}
            </>
          ) : (
            <mesh castShadow receiveShadow>
              <BoxG args={[w, h, t]} />
              <Flat color={color} />
            </mesh>
          )}
          {kind === "panel"
            ? [
                [0, h * 0.24, w * 0.66, h * 0.36],
                [0, -h * 0.22, w * 0.66, h * 0.38],
              ].map(([x, y, pw, ph], i) => (
                <React.Fragment key={i}>
                  {[1, -1].map((s) => (
                    <mesh key={s} position={[x, y, (s * t) / 2 + s * 0.012]}>
                      <BoxG args={[pw, ph, 0.03]} />
                      <Flat color={pc} />
                    </mesh>
                  ))}
                </React.Fragment>
              ))
            : null}
          {kind === "glass" ? (
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[w * 0.82, h * 0.82, t + 0.01]} />
              <meshLambertMaterial color="#BFE3FF" transparent opacity={0.35} />
            </mesh>
          ) : null}
          {window ? (
            <mesh position={[0, h * 0.28, 0]}>
              <circleGeometry args={[w * 0.17, 20]} />
              <Glow color={window} />
            </mesh>
          ) : null}
          {kind === "fridge" ? (
            <mesh position={[w / 2 - 0.16, 0, t / 2 + 0.07]} castShadow>
              <BoxG args={[0.1, h * 0.55, 0.12]} />
              <Flat color="#B8BEC8" />
            </mesh>
          ) : kind !== "bars" ? (
            [1, -1].map((s) => (
              <group key={s} position={[w / 2 - 0.24, -0.05, s * (t / 2 + 0.06)]} rotation={[0, 0, -handle * 0.6 * s]}>
                <mesh>
                  <IcoG args={[0.1, 1]} />
                  <Flat color={knob} />
                </mesh>
                <mesh position={[-0.12, 0, 0]}>
                  <BoxG args={[0.26, 0.06, 0.06]} />
                  <Flat color={knob} />
                </mesh>
              </group>
            ))
          ) : null}
        </group>
      </group>
    </group>
  );
};

/** A door frame (casing) around an opening of w × h, base at y = position.y - h/2. */
export const DoorFrame: React.FC<{ position: V3; yaw?: number; w?: number; h?: number; color?: string; depth?: number; frame?: number; sill?: boolean }> = ({
  position,
  yaw = 0,
  w = DOOR.w,
  h = DOOR.h,
  color = "#F2EEE4",
  depth = DOOR.depth,
  frame = DOOR.frame,
  sill = true,
}) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[-w / 2 - frame / 2, frame / 2, 0]} castShadow receiveShadow>
      <BoxG args={[frame, h + frame, depth]} />
      <Flat color={color} />
    </mesh>
    <mesh position={[w / 2 + frame / 2, frame / 2, 0]} castShadow receiveShadow>
      <BoxG args={[frame, h + frame, depth]} />
      <Flat color={color} />
    </mesh>
    <mesh position={[0, h / 2 + frame / 2, 0]} castShadow receiveShadow>
      <BoxG args={[w + frame * 2, frame, depth]} />
      <Flat color={color} />
    </mesh>
    {sill ? (
      <mesh position={[0, -h / 2 + 0.03, 0]} receiveShadow>
        <BoxG args={[w, 0.06, depth]} />
        <Flat color={new THREE.Color(color).multiplyScalar(0.8).getStyle()} />
      </mesh>
    ) : null}
  </group>
);

/** A wall (in the local XY plane, thickness along Z) with a door-sized hole at `holeX`. */
export const WallWithDoor: React.FC<{
  position: V3;
  yaw?: number;
  width: number;
  height: number;
  thick?: number;
  holeX?: number;
  holeW?: number;
  holeH?: number;
  color: string;
  skirting?: string;
}> = ({ position, yaw = 0, width, height, thick = 0.3, holeX = 0, holeW = DOOR.w, holeH = DOOR.h, color, skirting }) => {
  const left = holeX - holeW / 2 + width / 2;
  const right = width / 2 - (holeX + holeW / 2);
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[-width / 2 + left / 2, height / 2, 0]} receiveShadow castShadow>
        <BoxG args={[left, height, thick]} />
        <Flat color={color} />
      </mesh>
      <mesh position={[width / 2 - right / 2, height / 2, 0]} receiveShadow castShadow>
        <BoxG args={[right, height, thick]} />
        <Flat color={color} />
      </mesh>
      <mesh position={[holeX, holeH + (height - holeH) / 2, 0]} receiveShadow castShadow>
        <BoxG args={[holeW, height - holeH, thick]} />
        <Flat color={color} />
      </mesh>
      {skirting
        ? [
            [-width / 2 + left / 2, left],
            [width / 2 - right / 2, right],
          ].map(([x, sw], i) => (
            <mesh key={i} position={[x, 0.14, thick / 2 + 0.02]}>
              <BoxG args={[sw, 0.28, 0.05]} />
              <Flat color={skirting} />
            </mesh>
          ))
        : null}
    </group>
  );
};
