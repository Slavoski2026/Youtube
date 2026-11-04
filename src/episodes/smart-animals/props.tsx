/**
 * Sets and props for "What If Every Animal Got As Smart As Us?" (ep. 4).
 * Everything rests on y=0 with its real extents and follows the kit detail level.
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { Building } from "../../slavoski/city";
import { BoxG, chamferBox, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { FONT } from "../../slavoski/fonts";
import { Flat, Glow } from "../../slavoski/materials";
import { clamp01, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { project, type CameraSpec } from "../../slavoski/Stage";

// ================================================================ bedroom

/** Bed against the back wall (z = -4); x is the bed's centre line. */
export const BED = { x: 2.3, w: 3.0, headZ: -3.95, footZ: 1.2, mattressTop: 1.05, blanketTop: 1.5, blanketFrom: -2.0 };
/** Window in the left wall (x = -6). The outside sill top is at `sillY`. */
export const WIN = { x: -6, z: -0.6, y: 3.3, w: 2.4, h: 2.2, sillY: 2.2 };

export const Bedroom: React.FC<{ lampOn?: boolean; dawn?: boolean }> = ({ lampOn = true, dawn = false }) => {
  const wall = "#3A3550";
  const side = "#433D5C";
  const z0 = WIN.z - WIN.w / 2;
  const z1 = WIN.z + WIN.w / 2;
  const y0 = WIN.y - WIN.h / 2;
  const y1 = WIN.y + WIN.h / 2;
  return (
    <group>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[13, 0.1, 13]} />
        <Flat color="#4A3A34" />
      </mesh>
      <mesh position={[0.6, 0.006, -0.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.4, 3.6]} />
        <Flat color="#5A4A78" />
      </mesh>
      {/* back wall */}
      <mesh position={[0, 3, -4.1]} receiveShadow>
        <BoxG args={[13, 6, 0.2]} />
        <Flat color={wall} />
      </mesh>
      {/* left wall with the window opening */}
      <mesh position={[WIN.x, 3, (-6.5 + z0) / 2]} receiveShadow>
        <BoxG args={[0.2, 6, z0 + 6.5]} />
        <Flat color={side} />
      </mesh>
      <mesh position={[WIN.x, 3, (6.5 + z1) / 2]} receiveShadow>
        <BoxG args={[0.2, 6, 6.5 - z1]} />
        <Flat color={side} />
      </mesh>
      <mesh position={[WIN.x, y0 / 2, WIN.z]} receiveShadow>
        <BoxG args={[0.2, y0, WIN.w]} />
        <Flat color={side} />
      </mesh>
      <mesh position={[WIN.x, (6 + y1) / 2, WIN.z]} receiveShadow>
        <BoxG args={[0.2, 6 - y1, WIN.w]} />
        <Flat color={side} />
      </mesh>
      {/* frame (one mullion, off to the side so the sill stays clear) */}
      {[
        [0, y1 + 0.05, WIN.z, 0.16, 0.12, WIN.w + 0.2],
        [0, y0 - 0.05, WIN.z, 0.16, 0.12, WIN.w + 0.2],
        [0, WIN.y, z0 - 0.05, 0.16, WIN.h + 0.2, 0.12],
        [0, WIN.y, z1 + 0.05, 0.16, WIN.h + 0.2, 0.12],
        [0, WIN.y, WIN.z + 0.75, 0.08, WIN.h, 0.06],
      ].map(([, y, z, w, h, d], i) => (
        <mesh key={i} position={[WIN.x + 0.06, y, z]}>
          <BoxG args={[w, h, d]} />
          <Flat color="#E6E0D4" />
        </mesh>
      ))}
      {/* outside sill (the pigeon's perch) */}
      <mesh position={[WIN.x - 0.4, WIN.sillY - 0.09, WIN.z]} castShadow receiveShadow>
        <BoxG args={[0.75, 0.18, WIN.w + 0.5]} />
        <Flat color="#9AA1B0" />
      </mesh>
      {/* curtains */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[WIN.x + 0.2, WIN.y + 0.3, WIN.z + s * (WIN.w / 2 + 0.35)]} castShadow>
          <BoxG args={[0.14, WIN.h + 1.2, 0.7]} />
          <Flat color="#7A3A4A" />
        </mesh>
      ))}
      {/* the view: a few buildings across the street */}
      <Building position={[-16, 0, -4]} w={4} d={5} h={14} color={P.bldgNavy} seed="bv1" />
      <Building position={[-17, 0, 3]} w={4} d={5} h={10} color={P.bldgPurple} seed="bv2" />
      <Building position={[-15, 0, 9]} w={4} d={4} h={12} color={P.bldgTeal} seed="bv3" />
      <mesh position={[-11, -0.5, 0]}>
        <BoxG args={[8, 1, 40]} />
        <Flat color="#2A2E3C" />
      </mesh>
      {/* bed */}
      <group position={[BED.x, 0, 0]}>
        <mesh position={[0, 0.45, (BED.headZ + BED.footZ) / 2]} castShadow receiveShadow>
          <BoxG args={[BED.w, 0.5, BED.footZ - BED.headZ]} />
          <Flat color="#5A3E2E" />
        </mesh>
        <mesh position={[0, 0.875, (BED.headZ + BED.footZ) / 2]} castShadow receiveShadow>
          <BoxG args={[BED.w - 0.12, 0.35, BED.footZ - BED.headZ - 0.12]} />
          <Flat color="#E9E4DA" />
        </mesh>
        <mesh position={[0, 1.1, BED.headZ - 0.05]} castShadow>
          <BoxG args={[BED.w + 0.1, 2.2, 0.2]} />
          <Flat color="#5A3E2E" />
        </mesh>
        <mesh position={[0, 1.22, BED.headZ + 0.45]} rotation={[0.35, 0, 0]} castShadow>
          <BoxG args={[1.7, 0.32, 0.7]} />
          <Flat color="#F2EEE6" />
        </mesh>
        {/* blanket over the legs (top at BED.blanketTop) */}
        <mesh position={[0, (BED.blanketTop + 0.95) / 2, (BED.blanketFrom + BED.footZ + 0.08) / 2]} castShadow receiveShadow>
          <BoxG args={[BED.w + 0.06, BED.blanketTop - 0.95, BED.footZ + 0.08 - BED.blanketFrom]} />
          <Flat color={P.bldgTeal} />
        </mesh>
      </group>
      {/* nightstand + lamp */}
      <group position={[0.1, 0, -3.3]}>
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <BoxG args={[1.0, 1.1, 0.9]} />
          <Flat color="#5A4A3A" />
        </mesh>
        <mesh position={[0, 1.35, 0]} castShadow>
          <CylG args={[0.06, 0.12, 0.5, 6]} />
          <Flat color={P.pole} />
        </mesh>
        <mesh position={[0, 1.75, 0]}>
          <ConeG args={[0.38, 0.45, 8, 1, true]} />
          {lampOn ? <Glow color={P.lampGlow} opacity={0.92} /> : <Flat color="#6A5A4A" />}
        </mesh>
      </group>
      {lampOn ? <pointLight position={[0.3, 2.3, -2.6]} color="#FFC890" intensity={dawn ? 6 : 14} distance={14} decay={2} /> : null}
      {/* poster */}
      <mesh position={[-2.6, 3.6, -3.99]}>
        <planeGeometry args={[1.6, 2.1]} />
        <Flat color="#2E5A6A" />
      </mesh>
      <mesh position={[-2.6, 3.8, -3.98]}>
        <circleGeometry args={[0.5, 10]} />
        <Flat color={P.amber} />
      </mesh>
    </group>
  );
};

// ================================================================ speech bubbles (HTML, pinned to 3D)

/** A comic speech bubble whose tail points at a 3D point (projected with the shot's camera). */
export const Bubble: React.FC<{
  text: string;
  at: V3;
  cam: CameraSpec;
  width: number;
  height: number;
  /** Bubble offset from the tail tip, in pixels. */
  offset?: [number, number];
  appear?: number;
  size?: number;
  think?: boolean;
  accent?: string;
}> = ({ text, at, cam, width, height, offset = [0, -150], appear = 1, size = 40, think = false, accent }) => {
  const p = project(at, cam, width, height);
  const k = clamp01(appear);
  if (k <= 0) return null;
  const pop = 0.6 + 0.4 * (1 - Math.pow(1 - k, 3));
  const bx = p.x + offset[0];
  const by = p.y + offset[1];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width, height, pointerEvents: "none", opacity: Math.min(1, k * 2) }}>
      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        {think ? (
          [0.25, 0.5, 0.75].map((f) => (
            <circle key={f} cx={p.x + offset[0] * f} cy={p.y + offset[1] * f * 0.8} r={6 + f * 10} fill="#F6EBC4" stroke="#14121C" strokeWidth={4} />
          ))
        ) : (
          <polygon
            points={`${p.x},${p.y} ${bx - 22},${by} ${bx + 22},${by}`}
            fill="#F6EBC4"
            stroke="#14121C"
            strokeWidth={5}
            strokeLinejoin="round"
          />
        )}
      </svg>
      <div
        style={{
          position: "absolute",
          left: bx,
          top: by,
          transform: `translate(-50%, -88%) scale(${pop})`,
          transformOrigin: "50% 100%",
          background: "#F6EBC4",
          border: "5px solid #14121C",
          borderRadius: 28,
          padding: "14px 26px",
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: size,
          color: accent ?? "#14121C",
          whiteSpace: "pre",
          textAlign: "center",
          lineHeight: 1.1,
          boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** A flat label pinned to a 3D point (signs, the tank label). */
export const Pinned: React.FC<{ at: V3; cam: CameraSpec; width: number; height: number; children: React.ReactNode; scale?: number; rotate?: number }> = ({
  at,
  cam,
  width,
  height,
  children,
  scale = 1,
  rotate = 0,
}) => {
  const p = project(at, cam, width, height);
  return (
    <div style={{ position: "absolute", left: p.x, top: p.y, transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`, pointerEvents: "none" }}>
      {children}
    </div>
  );
};

// ================================================================ pavement writing (stroke letters)

/** Strokes for a few capitals in a 1 × 1.4 box (origin bottom-left), as [x0, y0, x1, y1]. */
const GLYPHS: Record<string, [number, number, number, number][]> = {
  W: [
    [0, 1.4, 0.25, 0],
    [0.25, 0, 0.5, 0.9],
    [0.5, 0.9, 0.75, 0],
    [0.75, 0, 1, 1.4],
  ],
  E: [
    [0.1, 1.4, 0.1, 0],
    [0.1, 1.4, 0.9, 1.4],
    [0.1, 0.72, 0.7, 0.72],
    [0.1, 0, 0.9, 0],
  ],
  K: [
    [0.1, 1.4, 0.1, 0],
    [0.9, 1.4, 0.1, 0.6],
    [0.38, 0.85, 0.9, 0],
  ],
  N: [
    [0.1, 0, 0.1, 1.4],
    [0.1, 1.4, 0.9, 0],
    [0.9, 0, 0.9, 1.4],
  ],
  O: [
    [0.15, 0.2, 0.15, 1.2],
    [0.15, 1.2, 0.5, 1.4],
    [0.5, 1.4, 0.85, 1.2],
    [0.85, 1.2, 0.85, 0.2],
    [0.85, 0.2, 0.5, 0],
    [0.5, 0, 0.15, 0.2],
  ],
  ".": [[0.3, 0, 0.42, 0.1]],
};

/**
 * Text scratched onto the ground (lying flat, reading toward -Z → +Z from a camera at +Z).
 * `progress` 0..1 draws the strokes in order.
 */
const writingStrokes = (text: string) => {
  const strokes: { a: [number, number]; b: [number, number] }[] = [];
  let cx = 0;
  for (const ch of text) {
    if (ch === " ") {
      cx += 0.7;
      continue;
    }
    for (const [x0, y0, x1, y1] of GLYPHS[ch] ?? []) strokes.push({ a: [cx + x0, y0], b: [cx + x1, y1] });
    cx += ch === "." ? 0.6 : 1.25;
  }
  return { strokes, width: cx };
};

/** Where the "pen" is (local x, z of the stroke being drawn) for GroundWriting at `progress`. */
export const penAt = (text: string, size: number, progress: number): [number, number] => {
  const { strokes, width } = writingStrokes(text);
  const shown = clamp01(progress) * strokes.length;
  const i = Math.min(strokes.length - 1, Math.floor(shown));
  const k = Math.min(1, shown - i);
  const s = strokes[i];
  const x = (s.a[0] + (s.b[0] - s.a[0]) * k) * size - (width * size) / 2;
  const z = -(s.a[1] + (s.b[1] - s.a[1]) * k) * size;
  return [x, z];
};

export const GroundWriting: React.FC<{ text: string; position: V3; size?: number; progress: number; color?: string; yaw?: number }> = ({
  text,
  position,
  size = 0.6,
  progress,
  color = "#EDE6D2",
  yaw = 0,
}) => {
  const { strokes, width: cx } = writingStrokes(text);
  const total = strokes.length;
  const shown = progress * total;
  const width = cx * size;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {strokes.map((s, i) => {
        const k = clamp01(shown - i);
        if (k <= 0) return null;
        const ax = s.a[0] * size - width / 2;
        const az = -s.a[1] * size;
        const bx = ax + (s.b[0] - s.a[0]) * size * k;
        const bz = az - (s.b[1] - s.a[1]) * size * k;
        const len = Math.hypot(bx - ax, bz - az);
        return (
          <mesh key={i} position={[(ax + bx) / 2, 0.012, (az + bz) / 2]} rotation={[0, Math.atan2(bx - ax, bz - az), 0]}>
            <boxGeometry args={[size * 0.11, 0.012, Math.max(0.01, len + size * 0.08)]} />
            <Glow color={color} />
          </mesh>
        );
      })}
    </group>
  );
};

// ================================================================ aquarium

export const TANK = { x: 0, z: 0, w: 3.6, d: 2.0, h: 2.2, standH: 1.4 };

/** A lit glass tank on a stand in a dark aquarium hall. `lid` 0..1 slides the lid open. */
export const Aquarium: React.FC<{ lid?: number; t: number }> = ({ lid = 0, t }) => {
  const top = TANK.standH + TANK.h;
  const glass = "#9FD3E8";
  return (
    <group position={[TANK.x, 0, TANK.z]}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[30, 0.1, 30]} />
        <Flat color="#1A1E2C" />
      </mesh>
      <mesh position={[0, 4, -4]} receiveShadow>
        <BoxG args={[30, 8, 0.2]} />
        <Flat color="#141A2A" />
      </mesh>
      {/* stand */}
      <mesh position={[0, TANK.standH / 2, 0]} castShadow receiveShadow>
        <BoxG args={[TANK.w + 0.2, TANK.standH, TANK.d + 0.2]} />
        <Flat color="#232A3A" />
      </mesh>
      {/* gravel, rocks, weeds */}
      <mesh position={[0, TANK.standH + 0.12, 0]} receiveShadow>
        <BoxG args={[TANK.w - 0.1, 0.24, TANK.d - 0.1]} />
        <Flat color="#B39A62" />
      </mesh>
      <mesh position={[1.1, TANK.standH + 0.45, -0.4]} castShadow>
        <IcoG args={[0.42, 0]} />
        <Flat color="#566270" />
      </mesh>
      {[-1.3, -0.9, 1.4].map((x, i) => (
        <group key={i} position={[x, TANK.standH + 0.24, -0.6 + i * 0.3]} rotation={[0, 0, Math.sin(t * 1.5 + i) * 0.12]}>
          <mesh position={[0, 0.45, 0]}>
            <ConeG args={[0.1, 0.9 + i * 0.2, 4]} />
            <Flat color="#2F7A5A" />
          </mesh>
        </group>
      ))}
      {/* water (inside, slightly below the rim) */}
      <mesh position={[0, TANK.standH + (TANK.h - 0.2) / 2, 0]} renderOrder={5}>
        <boxGeometry args={[TANK.w - 0.06, TANK.h - 0.2, TANK.d - 0.06]} />
        <meshBasicMaterial color="#2E7FB0" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      {/* glass panes (front/back/sides) + frame edges */}
      {[
        [0, TANK.d / 2, TANK.w, 0.03],
        [0, -TANK.d / 2, TANK.w, 0.03],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, TANK.standH + TANK.h / 2, z]} renderOrder={6}>
          <boxGeometry args={[w, TANK.h, d]} />
          <meshBasicMaterial color={glass} transparent opacity={0.08} depthWrite={false} />
        </mesh>
      ))}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[(sx * TANK.w) / 2, TANK.standH + TANK.h / 2, (sz * TANK.d) / 2]}>
            <boxGeometry args={[0.08, TANK.h, 0.08]} />
            <Flat color="#1A1E26" />
          </mesh>
        )),
      )}
      {[-1, 1].map((sz) => (
        <mesh key={sz} position={[0, top, (sz * TANK.d) / 2]}>
          <boxGeometry args={[TANK.w + 0.08, 0.08, 0.08]} />
          <Flat color="#1A1E26" />
        </mesh>
      ))}
      {/* lid hinged at the back edge; `lid` 0..1 tips it up and back */}
      <group position={[0, top + 0.06, -TANK.d / 2 - 0.05]} rotation={[-lid * 1.15, 0, 0]}>
        <mesh position={[0, 0, TANK.d / 2 + 0.05]} castShadow>
          <BoxG args={[TANK.w + 0.1, 0.1, TANK.d + 0.1]} />
          <Flat color="#6A7488" />
        </mesh>
      </group>
      {/* tank light */}
      <pointLight position={[0, top + 0.8, 0.6]} color="#7FD0FF" intensity={18} distance={9} decay={2} />
      <mesh position={[0, top + 0.13, 0]}>
        <boxGeometry args={[1.6, 0.04, 0.3]} />
        <Glow color="#BFE8FF" />
      </mesh>
    </group>
  );
};

// ================================================================ zoo yard (chimps)

/** A grassy enclosure: rocks, a dead tree, a back fence, and a crate with the escape map. */
export const ZooYard: React.FC = () => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[60, 0.1, 60]} />
      <Flat color="#2F5A44" />
    </mesh>
    {[
      [-3.5, 0, -3, 1.1],
      [3.8, 0, -2.4, 0.9],
      [-1.2, 0, -5, 1.4],
    ].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y + r * 0.5, z]} scale={[1, 0.7, 1]} castShadow receiveShadow>
        <IcoG args={[r, 1]} />
        <Flat color="#6A6E7A" />
      </mesh>
    ))}
    <group position={[4.2, 0, -5]}>
      <mesh position={[0, 2, 0]} castShadow>
        <CylG args={[0.22, 0.35, 4, 6]} />
        <Flat color="#5A3E2E" />
      </mesh>
      <mesh position={[0.8, 3.4, 0]} rotation={[0, 0, -1.0]} castShadow>
        <CylG args={[0.1, 0.16, 1.8, 6]} />
        <Flat color="#5A3E2E" />
      </mesh>
    </group>
    {/* back fence */}
    {Array.from({ length: 13 }, (_, i) => (
      <mesh key={i} position={[-12 + i * 2, 1.6, -8]} castShadow>
        <BoxG args={[0.16, 3.2, 0.16]} />
        <Flat color="#3A3E48" />
      </mesh>
    ))}
    {[1.0, 2.2, 3.0].map((y) => (
      <mesh key={y} position={[0, y, -8]}>
        <BoxG args={[24, 0.06, 0.06]} />
        <Flat color="#4A4E58" />
      </mesh>
    ))}
  </group>
);

/** Wooden crate with the escape plan (a cream map with a red route) on top. Top at y = 1.0. */
export const MapCrate: React.FC<{ position: V3; yaw?: number; route?: number }> = ({ position, yaw = 0, route = 1 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
      <BoxG args={[1.6, 1.0, 1.1]} />
      <Flat color="#8A6A44" />
    </mesh>
    <mesh position={[0, 1.005, 0]} rotation={[-Math.PI / 2, 0, 0.05]} receiveShadow>
      <planeGeometry args={[1.4, 0.95]} />
      <Flat color="#EDE6D2" />
    </mesh>
    {/* zoo outline + paths */}
    {[
      [0, 0.3, 1.2, 0.03],
      [0, -0.3, 1.2, 0.03],
      [-0.6, 0, 0.03, 0.6],
      [0.6, 0, 0.03, 0.6],
      [-0.1, 0.05, 0.4, 0.25],
    ].map(([x, z, w, d], i) => (
      <mesh key={i} position={[x, 1.012, z]}>
        <boxGeometry args={[w, 0.004, d]} />
        <Flat color={i === 4 ? "#7FB36A" : "#566270"} />
      </mesh>
    ))}
    {/* the red route, drawn in */}
    {[
      [-0.45, -0.15, 0.3, 0],
      [-0.25, -0.05, 0.03, 0.22],
      [0.05, 0.08, 0.6, 0],
      [0.45, 0.24, 0.03, 0.3],
    ].map(([x, z, w, d], i) => {
      const k = clamp01(route * 4 - i);
      return k > 0 ? (
        <mesh key={i} position={[x, 1.018, z]} scale={[w ? k : 1, 1, d ? k : 1]}>
          <boxGeometry args={[Math.max(w, 0.035), 0.006, Math.max(d, 0.035)]} />
          <Glow color="#E8473A" />
        </mesh>
      ) : null;
    })}
    {route > 0.95 ? (
      <mesh position={[0.45, 1.03, 0.42]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.12, 0.012, 0.12]} />
        <Glow color="#E8473A" />
      </mesh>
    ) : null}
  </group>
);

// ================================================================ power line (crows)

/** Two poles with three sagging wires between x = -span/2 and +span/2. Returns wire heights via WIRE_Y. */
export const WIRE = { span: 16, top: 7.2, ys: [7.0, 6.4], sag: 0.45 };
export const wireY = (x: number, row: number) => {
  const u = x / (WIRE.span / 2);
  return WIRE.ys[row] - WIRE.sag * (1 - u * u);
};

export const PowerLine: React.FC = () => (
  <group>
    {[-1, 1].map((s) => (
      <group key={s} position={[(s * WIRE.span) / 2, 0, 0]}>
        <mesh position={[0, WIRE.top / 2, 0]} castShadow>
          <CylG args={[0.12, 0.16, WIRE.top + 0.4, 6]} />
          <Flat color="#4A3A2E" />
        </mesh>
        {WIRE.ys.map((y) => (
          <mesh key={y} position={[0, y + 0.08, 0]} castShadow>
            <BoxG args={[0.18, 0.16, 1.6]} />
            <Flat color="#4A3A2E" />
          </mesh>
        ))}
      </group>
    ))}
    {WIRE.ys.map((_, row) =>
      [-0.25, 0.25].map((z) =>
        Array.from({ length: 16 }, (_, i) => {
          const x0 = -WIRE.span / 2 + (i * WIRE.span) / 16;
          const x1 = x0 + WIRE.span / 16;
          const y0 = wireY(x0, row);
          const y1 = wireY(x1, row);
          const len = Math.hypot(x1 - x0, y1 - y0);
          return (
            <mesh key={`${row}${z}${i}`} position={[(x0 + x1) / 2, (y0 + y1) / 2, z]} rotation={[0, 0, Math.atan2(y1 - y0, x1 - x0)]}>
              <boxGeometry args={[len + 0.02, 0.035, 0.035]} />
              <Flat color="#15151C" />
            </mesh>
          );
        }),
      ),
    )}
  </group>
);

// ================================================================ farm

/** Red gable barn, door facing +Z. Footprint w × d, eaves at h. */
export const Barn: React.FC<{ position: V3; yaw?: number; w?: number; d?: number; h?: number; doorOpen?: number }> = ({
  position,
  yaw = 0,
  w = 7,
  d = 9,
  h = 4.2,
  doorOpen = 0,
}) => {
  const roofH = w * 0.38;
  const slope = Math.hypot(w / 2, roofH);
  const ang = Math.atan2(roofH, w / 2);
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <BoxG args={[w, h, d]} />
        <Flat color="#A8322C" />
      </mesh>
      {/* gable ends */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, h, (s * d) / 2]} scale={[1, 1, 1]} castShadow>
          <shapeGeometry args={[new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, roofH)])]} />
          <meshLambertMaterial color="#A8322C" flatShading side={THREE.DoubleSide} />
        </mesh>
      ))}
      {[1, -1].map((s) => (
        <mesh key={s} position={[(s * w) / 4, h + roofH / 2, 0]} rotation={[0, 0, -s * ang]} castShadow receiveShadow>
          <BoxG args={[slope + 0.5, 0.18, d + 0.5]} />
          <Flat color="#3A2E34" />
        </mesh>
      ))}
      {/* white trim + doors */}
      <mesh position={[0, h * 0.42, d / 2 + 0.02]}>
        <BoxG args={[w * 0.5 + 0.24, h * 0.84 + 0.12, 0.06]} />
        <Flat color="#EDE6D2" />
      </mesh>
      {[1, -1].map((s) => (
        <group key={s} position={[(s * w) / 4 + 0.0, 0, d / 2 + 0.08]}>
          <mesh position={[0, h * 0.42, 0]} castShadow>
            <BoxG args={[w * 0.25, h * 0.82, 0.08]} />
            <Flat color="#8A2620" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, h * 0.42, d / 2 + 0.13]} rotation={[0, 0, Math.atan2(h * 0.8, w * 0.5)]}>
        <boxGeometry args={[Math.hypot(w * 0.5, h * 0.8), 0.1, 0.03]} />
        <Flat color="#EDE6D2" />
      </mesh>
      {doorOpen > 0 ? (
        <mesh position={[0, h * 0.42, d / 2 + 0.03]}>
          <boxGeometry args={[w * 0.5 * doorOpen, h * 0.82, 0.02]} />
          <Glow color="#E0B04E" />
        </mesh>
      ) : null}
      <mesh position={[0, h + roofH * 0.45, d / 2 + 0.03]}>
        <boxGeometry args={[0.7, 0.7, 0.04]} />
        <Glow color="#E0B04E" />
      </mesh>
    </group>
  );
};

export const Silo: React.FC<{ position: V3; h?: number }> = ({ position, h = 7 }) => (
  <group position={position}>
    <mesh position={[0, h / 2, 0]} castShadow>
      <CylG args={[1.3, 1.3, h, 10]} />
      <Flat color="#9AA1B0" />
    </mesh>
    <mesh position={[0, h, 0]} scale={[1, 0.6, 1]} castShadow>
      <IcoG args={[1.32, 1]} />
      <Flat color="#7A808E" />
    </mesh>
  </group>
);

/**
 * Post-and-rail fence along X from x0 to x1 at z. `breakAt` (x) + `burst` 0..1 knocks a gap out:
 * boards near the break fly off forward (+Z) and fall flat on the ground (never through it).
 */
export const Fence: React.FC<{ x0: number; x1: number; z: number; breakAt?: number; burst?: number; color?: string }> = ({
  x0,
  x1,
  z,
  breakAt,
  burst = 0,
  color = "#D8C8A8",
}) => {
  const posts = Math.round((x1 - x0) / 2) + 1;
  const step = (x1 - x0) / (posts - 1);
  return (
    <group>
      {Array.from({ length: posts }, (_, i) => (
        <mesh key={`p${i}`} position={[x0 + i * step, 0.7, z]} castShadow>
          <BoxG args={[0.18, 1.4, 0.18]} />
          <Flat color={color} />
        </mesh>
      ))}
      {Array.from({ length: posts - 1 }, (_, i) =>
        [0.55, 1.1].map((y, r) => {
          const cx = x0 + (i + 0.5) * step;
          const broken = breakAt !== undefined && Math.abs(cx - breakAt) < step * 0.6;
          if (!broken || burst <= 0) {
            return (
              <mesh key={`r${i}${r}`} position={[cx, y, z + 0.1]} castShadow>
                <BoxG args={[step, 0.16, 0.06]} />
                <Flat color={color} />
              </mesh>
            );
          }
          // Flying board: forward arc, spinning, lands flat at y = 0.03.
          const k = clamp01(burst);
          const dz = 2.8 * k + r * 0.6;
          const lift = Math.sin(k * Math.PI) * (1.4 + r * 0.5);
          const yy = Math.max(0.03, y * (1 - k) + lift);
          const flat = k > 0.95;
          const side = (r ? 1 : -1) * (cx >= breakAt ? 1 : -1) * (i % 2 ? 1 : -1);
          return (
            <mesh key={`r${i}${r}`} position={[cx + side * k * 2.0, yy, z + 0.1 + dz]} rotation={[flat ? Math.PI / 2 : k * 4, k * (r ? 1.5 : -1.2), flat ? 0.3 : k * 2]} castShadow>
              <BoxG args={[step, 0.16, 0.06]} />
              <Flat color={color} />
            </mesh>
          );
        }),
      )}
    </group>
  );
};

/** A farm gate hinged at its left post (x = position.x - 1.5); `open` 0..1 swings it 100° toward +Z. */
export const Gate: React.FC<{ position: V3; open?: number; latch?: number }> = ({ position, open = 0, latch = 0 }) => (
  <group position={position}>
    {[-1.6, 1.6].map((x) => (
      <mesh key={x} position={[x, 0.85, 0]} castShadow>
        <BoxG args={[0.24, 1.7, 0.24]} />
        <Flat color="#7A5A3A" />
      </mesh>
    ))}
    <group position={[-1.48, 0, 0]} rotation={[0, -open * 1.75, 0]}>
      {[0.35, 0.75, 1.15].map((y) => (
        <mesh key={y} position={[1.5, y, 0]} castShadow>
          <BoxG args={[2.9, 0.12, 0.08]} />
          <Flat color="#B8A27E" />
        </mesh>
      ))}
      <mesh position={[1.5, 0.75, 0]} rotation={[0, 0, Math.atan2(0.8, 2.8)]} castShadow>
        <boxGeometry args={[2.9, 0.1, 0.07]} />
        <Flat color="#B8A27E" />
      </mesh>
      {[0.08, 2.92].map((x) => (
        <mesh key={x} position={[x, 0.75, 0]} castShadow>
          <BoxG args={[0.12, 0.95, 0.1]} />
          <Flat color="#B8A27E" />
        </mesh>
      ))}
      {/* latch bar slides up out of its keeper */}
      <mesh position={[2.85, 0.9 + latch * 0.22, 0.1]} castShadow>
        <BoxG args={[0.32, 0.08, 0.06]} />
        <Flat color="#4A4E58" />
      </mesh>
    </group>
  </group>
);

/** A chicken coop on legs with a ramp; the hatch (facing +Z) opens with `hatch` 0..1. */
export const Coop: React.FC<{ position: V3; yaw?: number; hatch?: number }> = ({ position, yaw = 0, hatch = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    {[-1, 1].map((sx) =>
      [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * 1.2, 0.5, sz * 0.9]} castShadow>
          <BoxG args={[0.16, 1.0, 0.16]} />
          <Flat color="#5A3E2E" />
        </mesh>
      )),
    )}
    <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
      <BoxG args={[2.8, 1.5, 2.2]} />
      <Flat color="#C8A060" />
    </mesh>
    {[1, -1].map((s) => (
      <mesh key={s} position={[s * 0.75, 2.75, 0]} rotation={[0, 0, -s * 0.55]} castShadow>
        <BoxG args={[1.9, 0.14, 2.6]} />
        <Flat color="#7A3A34" />
      </mesh>
    ))}
    {/* hatch opening (dark) and its door flap hinged at the bottom */}
    <mesh position={[0, 1.45, 1.105]}>
      <boxGeometry args={[0.9, 0.9, 0.02]} />
      <Flat color="#1A1414" />
    </mesh>
    <group position={[0, 1.0, 1.12]} rotation={[hatch * 1.5, 0, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <BoxG args={[0.96, 0.92, 0.06]} />
        <Flat color="#A88040" />
      </mesh>
    </group>
    {/* ramp from the hatch sill (y = 1.0) down to the ground at z = +2.4 */}
    <mesh position={[0, 0.5, 1.75]} rotation={[Math.atan2(1.0, 1.3), 0, 0]} castShadow receiveShadow>
      <BoxG args={[0.8, 0.06, Math.hypot(1.0, 1.3)]} />
      <Flat color="#8A6A44" />
    </mesh>
  </group>
);

/** Blueprint sheet lying flat (blue with white lines); centre at `position`, top surface at its y. */
export const Blueprint: React.FC<{ position: V3; yaw?: number; draw?: number }> = ({ position, yaw = 0, draw = 1 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, -0.01, 0]} receiveShadow>
      <boxGeometry args={[1.8, 0.02, 1.2]} />
      <Flat color="#2A5AA8" />
    </mesh>
    {[
      [0, -0.35, 1.3, 0.025],
      [0, 0.35, 1.3, 0.025],
      [-0.65, 0, 0.025, 0.7],
      [0.65, 0, 0.025, 0.7],
      [-0.2, -0.1, 0.4, 0.3],
    ].map(([x, z, w, d], i) => (
      <mesh key={i} position={[x, 0.004, z]}>
        <boxGeometry args={[w, 0.004, d]} />
        <Glow color="#DCEBFF" opacity={i === 4 ? 0.5 : 1} />
      </mesh>
    ))}
    {[0, 1, 2].map((i) => {
      const k = clamp01(draw * 3 - i);
      return k > 0 ? (
        <mesh key={`a${i}`} position={[-0.1 + i * 0.32, 0.008, 0.05 + (i % 2) * 0.12]} rotation={[0, -0.6, 0]} scale={[k, 1, 1]}>
          <boxGeometry args={[0.34, 0.006, 0.04]} />
          <Glow color="#FFBA58" />
        </mesh>
      ) : null;
    })}
  </group>
);

// ================================================================ the sea of farm animals (instanced)

const tmp = new THREE.Object3D();
const tmpC = new THREE.Color();
const UNIT = new THREE.BoxGeometry(1, 1, 1);

/** Thousands of tiny low-poly farm animals in pens, for the "billions" aerial. Bodies + heads, instanced. */
export const AnimalSea: React.FC<{ rows?: number; cols?: number; spacing?: number; seed?: string; t?: number }> = ({
  rows = 60,
  cols = 40,
  spacing = 1.5,
  seed = "sea",
  t = 0,
}) => {
  const items = useMemo(() => {
    const out: { x: number; z: number; kind: number; yaw: number }[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const k = `${seed}${r}:${c}`;
        const pen = Math.floor(c / 8) % 3; // cows | pigs | chickens in bands
        out.push({
          x: (c - cols / 2) * spacing + (Math.floor(c / 8) * 1.4) + (random(`${k}x`) - 0.5) * 0.5,
          z: -r * spacing + (random(`${k}z`) - 0.5) * 0.5,
          kind: pen,
          yaw: (random(`${k}y`) - 0.5) * 1.2,
        });
      }
    return out;
  }, [rows, cols, spacing, seed]);
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);
  const SIZE = [
    { body: [0.7, 0.6, 1.2], head: [0.4, 0.4, 0.4], color: "#EDEAE4", y: 0.75 },
    { body: [0.6, 0.5, 0.9], head: [0.4, 0.38, 0.34], color: "#E9A3A8", y: 0.45 },
    { body: [0.36, 0.34, 0.4], head: [0.2, 0.2, 0.2], color: "#F1EEE6", y: 0.3 },
  ];
  const bob = Math.round(t * 6) / 6;
  useLayoutEffect(() => {
    const b = bodyRef.current;
    const h = headRef.current;
    if (!b || !h) return;
    items.forEach((it, i) => {
      const s = SIZE[it.kind];
      const nod = Math.sin(bob * 3 + i * 1.7) * 0.05;
      tmp.position.set(it.x, s.y, it.z);
      tmp.rotation.set(0, it.yaw, 0);
      tmp.scale.set(s.body[0], s.body[1], s.body[2]);
      tmp.updateMatrix();
      b.setMatrixAt(i, tmp.matrix);
      b.setColorAt(i, tmpC.set(it.kind === 0 && i % 3 === 0 ? "#2A2628" : s.color));
      const fx = Math.sin(it.yaw) * (s.body[2] / 2 + s.head[2] * 0.3);
      const fz = Math.cos(it.yaw) * (s.body[2] / 2 + s.head[2] * 0.3);
      tmp.position.set(it.x + fx, s.y + s.body[1] * 0.35 + nod, it.z + fz);
      tmp.scale.set(s.head[0], s.head[1], s.head[2]);
      tmp.updateMatrix();
      h.setMatrixAt(i, tmp.matrix);
      h.setColorAt(i, tmpC.set(s.color));
    });
    b.instanceMatrix.needsUpdate = true;
    h.instanceMatrix.needsUpdate = true;
    if (b.instanceColor) b.instanceColor.needsUpdate = true;
    if (h.instanceColor) h.instanceColor.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={bodyRef} args={[UNIT, undefined, items.length]} castShadow receiveShadow>
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[UNIT, undefined, items.length]} castShadow>
        <meshLambertMaterial flatShading />
      </instancedMesh>
      {/* pen rails between the bands */}
      {Array.from({ length: Math.ceil(cols / 8) + 1 }, (_, i) => (
        <mesh key={i} position={[(i * 8 - cols / 2) * spacing + i * 1.4 - 0.9, 0.4, (-rows * spacing) / 2]}>
          <boxGeometry args={[0.12, 0.8, rows * spacing]} />
          <Flat color="#8A7A5A" />
        </mesh>
      ))}
    </group>
  );
};

// ================================================================ sewer + electricity

/** A drain in the road: a dark hole (top at y = 0.1) and its grate, hinged at the back edge; `lift` 0..1 tips it open. */
export const SewerGrate: React.FC<{ position: V3; lift?: number }> = ({ position, lift = 0 }) => (
  <group position={position}>
    <mesh position={[0, 0.075, 0]}>
      <boxGeometry args={[1.6, 0.06, 1.0]} />
      <Flat color="#050608" />
    </mesh>
    <group position={[0, 0.1, -0.55]} rotation={[-lift * 1.1, 0, 0]}>
      <group position={[0, 0.015, 0.55]}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[-0.65 + i * 0.26, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.03, 1.1]} />
            <Flat color="#4A4E58" />
          </mesh>
        ))}
        {[-0.53, 0.53].map((z) => (
          <mesh key={z} position={[0, 0, z]} castShadow>
            <boxGeometry args={[1.7, 0.03, 0.06]} />
            <Flat color="#4A4E58" />
          </mesh>
        ))}
      </group>
    </group>
  </group>
);

/** A brick sewer tunnel along Z (floor at y = 0, centre channel of water). */
export const Tunnel: React.FC<{ length?: number; lamps?: number }> = ({ length = 40, lamps = 1 }) => (
  <group>
    <mesh position={[0, 2.2, -length / 2 + 4]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
      <cylinderGeometry args={[3.4, 3.4, length, 14, 1, true]} />
      <meshLambertMaterial color="#4A3E3A" flatShading side={THREE.BackSide} />
    </mesh>
    <mesh position={[0, 0, -length / 2 + 4]} receiveShadow>
      <boxGeometry args={[6.4, 0.2, length]} />
      <Flat color="#3A322E" />
    </mesh>
    <mesh position={[0, 0.06, -length / 2 + 4]}>
      <boxGeometry args={[1.6, 0.1, length]} />
      <meshLambertMaterial color="#2A4A3A" transparent opacity={0.85} />
    </mesh>
    {/* pipes and cables along the right wall */}
    {[
      [2.6, 2.4, 0.22, "#5A6270"],
      [2.75, 3.1, 0.12, "#2A2A30"],
      [2.8, 3.4, 0.08, "#C8372D"],
    ].map(([x, y, r, c], i) => (
      <mesh key={i} position={[x as number, y as number, -length / 2 + 4]} rotation={[Math.PI / 2, 0, 0]}>
        <CylG args={[r as number, r as number, length, 6]} />
        <Flat color={c as string} />
      </mesh>
    ))}
    {Array.from({ length: 5 }, (_, i) => (
      <group key={i} position={[0, 4.6, 2 - i * 8]}>
        <mesh>
          <IcoG args={[0.14, 1]} />
          <Glow color={lamps > 0.5 ? "#FFD08A" : "#3A3428"} />
        </mesh>
        {lamps > 0.5 ? <pointLight color="#FFB868" intensity={4} distance={9} decay={2} /> : null}
      </group>
    ))}
  </group>
);

/** Eyes in the dark: pairs of small glowing squares (rats), instanced. */
export const EyesInDark: React.FC<{ count?: number; seed?: string; area: [number, number, number, number, number, number]; t: number; open?: number }> = ({
  count = 160,
  seed = "eyes",
  area,
  t,
  open = 1,
}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const pts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: area[0] + random(`${seed}x${i}`) * (area[1] - area[0]),
        y: area[2] + random(`${seed}y${i}`) * (area[3] - area[2]),
        z: area[4] + random(`${seed}z${i}`) * (area[5] - area[4]),
        delay: random(`${seed}d${i}`),
        blink: random(`${seed}b${i}`) * 10,
      })),
    [count, seed, area],
  );
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    let n = 0;
    for (const p of pts) {
      const on = clamp01((open - p.delay * 0.8) * 5);
      const blink = Math.sin(t * 2 + p.blink) > 0.97 ? 0.15 : 1;
      for (const sx of [-1, 1]) {
        tmp.position.set(p.x + sx * 0.07, p.y, p.z);
        tmp.rotation.set(0, 0, 0);
        tmp.scale.set(0.09 * on, 0.09 * on * blink, 0.01);
        tmp.updateMatrix();
        m.setMatrixAt(n++, tmp.matrix);
      }
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[UNIT, undefined, pts.length * 2]}>
      <meshBasicMaterial color="#F2E6B0" toneMapped={false} fog={false} />
    </instancedMesh>
  );
};

// ---------------------------------------------------------------- the rat swarm (instanced)

/** One swarm rat in its own space (feet on y = 0, facing +Z), as [part, x, y, z, sx, sy, sz, rotX, rotZ]. */
type RatPart = "body" | "head" | "snout" | "pink" | "white" | "dark";
const RAT_PARTS: [RatPart, number, number, number, number, number, number, number, number][] = [
  ["body", 0, 0.18, 0, 1, 1, 1, 0, 0],
  ["head", 0, 0.24, 0.3, 1, 1, 1, 0, 0],
  ["snout", 0, 0.2, 0.46, 0.1, 0.08, 0.1, 0, 0],
  ["pink", 0, 0.2, 0.515, 0.05, 0.04, 0.02, 0, 0], // nose
  ["pink", 0.07, 0.34, 0.27, 0.075, 0.08, 0.02, 0, -0.35], // ears
  ["pink", -0.07, 0.34, 0.27, 0.075, 0.08, 0.02, 0, 0.35],
  ["white", 0.045, 0.27, 0.42, 0.055, 0.06, 0.02, 0, 0], // eyes
  ["white", -0.045, 0.27, 0.42, 0.055, 0.06, 0.02, 0, 0],
  ["dark", 0.045, 0.265, 0.432, 0.026, 0.03, 0.01, 0, 0], // pupils
  ["dark", -0.045, 0.265, 0.432, 0.026, 0.03, 0.01, 0, 0],
  ["dark", 0.05, 0.315, 0.43, 0.065, 0.014, 0.012, 0, 0.42], // angry brows
  ["dark", -0.05, 0.315, 0.43, 0.065, 0.014, 0.012, 0, -0.42],
];
const RAT_LEGS: [number, number][] = [
  [0.09, 0.15],
  [-0.09, 0.15],
  [0.09, -0.15],
  [-0.09, -0.15],
];
const RAT_FUR = ["#6E6A72", "#5E5A62", "#7A6A5E", "#64605E", "#6A5E56", "#76727C"];

const ratGeoms = {
  body: chamferBox(0.24, 0.2, 0.46),
  head: chamferBox(0.19, 0.17, 0.22),
};

const m4 = new THREE.Matrix4();
const part4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const e = new THREE.Euler();
const v = new THREE.Vector3();
const sc = new THREE.Vector3();

/**
 * Hundreds of rats pouring along the sewer toward +Z. Rats run in lanes at one speed per lane,
 * spaced more than a rat length apart, so they never overlap; each wraps from `zMax` back to `zMin`
 * (hide the far end in fog, keep the near end behind the camera).
 */
export const RatSwarm: React.FC<{
  t: number;
  lanes?: number[];
  zMin?: number;
  zMax?: number;
  scale?: number;
  seed?: string;
  y?: number;
}> = ({ t, lanes = [-1.6, -1.15, -0.7, -0.25, 0.2, 0.65, 1.1, 1.55, 2.0], zMin = -30, zMax = 6, scale = 1.55, seed = "swarm", y = 0.1 }) => {
  const rats = useMemo(() => {
    const out: { x: number; z0: number; speed: number; phase: number; fur: string; s: number }[] = [];
    const spacing = 0.95 * scale; // > body + head + tail-root length (≈ 0.75 × scale)
    const len = zMax - zMin;
    lanes.forEach((x, li) => {
      const speed = 2.2 + random(`${seed}v${li}`) * 1.6;
      const n = Math.floor(len / spacing);
      for (let i = 0; i < n; i++) {
        const k = `${seed}${li}:${i}`;
        out.push({
          x: x + (random(`${k}x`) - 0.5) * 0.08,
          z0: i * spacing + (random(`${k}z`) - 0.5) * spacing * 0.2,
          speed,
          phase: random(`${k}p`) * 10,
          fur: RAT_FUR[Math.floor(random(`${k}c`) * RAT_FUR.length)],
          s: scale * (0.92 + random(`${k}s`) * 0.14),
        });
      }
    });
    return out;
  }, [lanes, zMin, zMax, scale, seed]);
  const refs = {
    body: useRef<THREE.InstancedMesh>(null),
    head: useRef<THREE.InstancedMesh>(null),
    snout: useRef<THREE.InstancedMesh>(null),
    pink: useRef<THREE.InstancedMesh>(null),
    white: useRef<THREE.InstancedMesh>(null),
    dark: useRef<THREE.InstancedMesh>(null),
  };
  const per = { body: 1, head: 1, snout: 1, pink: 3 + 4 + 1, white: 2, dark: 4 };
  useLayoutEffect(() => {
    const idx: Record<RatPart, number> = { body: 0, head: 0, snout: 0, pink: 0, white: 0, dark: 0 };
    const put = (kind: RatPart, base: THREE.Matrix4, px: number, py: number, pz: number, sx: number, sy: number, sz: number, rx: number, rz: number, color?: string) => {
      const mesh = refs[kind].current;
      if (!mesh) return;
      e.set(rx, 0, rz);
      q.setFromEuler(e);
      part4.compose(v.set(px, py, pz), q, sc.set(sx, sy, sz));
      mesh.setMatrixAt(idx[kind], m4.copy(base).multiply(part4));
      if (color) mesh.setColorAt(idx[kind], tmpC.set(color));
      idx[kind]++;
    };
    const len = zMax - zMin;
    const base = new THREE.Matrix4();
    for (const r of rats) {
      const z = zMin + ((((r.z0 + t * r.speed) % len) + len) % len);
      const step = (t * r.speed) / (0.32 * r.s) + r.phase;
      const bob = Math.abs(Math.sin(step * Math.PI)) * 0.025;
      const wiggle = Math.sin(step * 0.5) * 0.12;
      e.set(0, wiggle, 0);
      q.setFromEuler(e);
      base.compose(v.set(r.x, y + bob * r.s, z), q, sc.set(r.s, r.s, r.s));
      for (const [kind, px, py, pz, sx, sy, sz, rx, rz] of RAT_PARTS) {
        const fur = kind === "body" || kind === "head" ? r.fur : kind === "snout" ? "#8C8690" : undefined;
        put(kind, base, px, py, pz, sx, sy, sz, rx, rz, fur);
      }
      // tail: a long thin pink box trailing behind, swishing
      put("pink", base, Math.sin(step * 0.7) * 0.06, 0.13, -0.5, 0.035, 0.035, 0.6, 0.12, 0);
      // legs scurry in diagonal pairs
      RAT_LEGS.forEach(([lx, lz], i) => {
        const swing = Math.sin(step * Math.PI + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.06;
        put("pink", base, lx, 0.05, lz + swing, 0.05, 0.1, 0.06, 0, 0);
      });
    }
    for (const k of Object.keys(refs) as RatPart[]) {
      const mesh = refs[k].current;
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });
  const n = rats.length;
  return (
    <group>
      <instancedMesh ref={refs.body} args={[ratGeoms.body, undefined, n * per.body]} castShadow>
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={refs.head} args={[ratGeoms.head, undefined, n * per.head]} castShadow>
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={refs.snout} args={[UNIT, undefined, n * per.snout]}>
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={refs.pink} args={[UNIT, undefined, n * per.pink]}>
        <meshLambertMaterial color="#D9A0AA" flatShading />
      </instancedMesh>
      <instancedMesh ref={refs.white} args={[UNIT, undefined, n * per.white]}>
        <meshBasicMaterial color="#F4F0E6" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={refs.dark} args={[UNIT, undefined, n * per.dark]}>
        <meshBasicMaterial color="#141018" toneMapped={false} />
      </instancedMesh>
    </group>
  );
};

/** A wall-mounted breaker panel with a big lever. `lever` 0 = up (on) … 1 = down (off); sparks while it moves. */
export const BreakerPanel: React.FC<{ position: V3; yaw?: number; lever: number; t: number }> = ({ position, yaw = 0, lever, t }) => {
  const sparking = lever > 0.4 && lever < 1.0;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <BoxG args={[1.6, 2.0, 0.4]} />
        <Flat color="#5A6270" />
      </mesh>
      <mesh position={[0, 0.55, 0.21]}>
        <boxGeometry args={[1.2, 0.3, 0.02]} />
        <Glow color="#E8C040" />
      </mesh>
      {[-0.4, 0, 0.4].map((x) => (
        <mesh key={x} position={[x, -0.4, 0.22]}>
          <boxGeometry args={[0.16, 0.16, 0.04]} />
          <Glow color={lever < 0.5 ? "#7FE08A" : "#E8473A"} />
        </mesh>
      ))}
      {/* lever pivots at the right side */}
      <group position={[0.9, 0.1, 0.1]} rotation={[0, 0, 0.9 - lever * 1.8]}>
        <mesh position={[0.4, 0, 0]} castShadow>
          <BoxG args={[0.8, 0.1, 0.1]} />
          <Flat color="#2A2A30" />
        </mesh>
        <mesh position={[0.8, 0, 0]} castShadow>
          <BoxG args={[0.18, 0.22, 0.18]} />
          <Flat color="#C8372D" />
        </mesh>
      </group>
      {sparking
        ? Array.from({ length: 8 }, (_, i) => {
            const a = random(`sp${i}${Math.floor(t * 12)}`) * Math.PI * 2;
            const r = 0.2 + random(`sr${i}${Math.floor(t * 12)}`) * 0.5;
            return (
              <mesh key={i} position={[0.9 + Math.cos(a) * r, 0.1 + Math.sin(a) * r, 0.3]}>
                <boxGeometry args={[0.06, 0.06, 0.06]} />
                <Glow color={i % 2 ? "#FFF4C0" : "#FFBA58"} />
              </mesh>
            );
          })
        : null}
      {sparking ? <pointLight position={[1, 0.2, 0.8]} color="#FFD890" intensity={10} distance={6} decay={2} /> : null}
    </group>
  );
};

// ================================================================ government

/** A domed capitol: steps, a colonnade and a dome. Front faces +Z, front steps start at z = +d/2. */
export const Capitol: React.FC<{ position: V3; scale?: number }> = ({ position, scale = 1 }) => {
  const stone = "#C9C2B4";
  const shade = "#A8A090";
  return (
    <group position={position} scale={scale}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.2 + i * 0.4, 4 - i * 0.6]} castShadow receiveShadow>
          <BoxG args={[16 - i * 0.6, 0.4, 2 + i * 0.0]} />
          <Flat color={shade} />
        </mesh>
      ))}
      <mesh position={[0, 3.6, -1]} castShadow receiveShadow>
        <BoxG args={[18, 5.6, 7]} />
        <Flat color={stone} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[-5.6 + i * 1.6, 3.6, 2.9]} castShadow>
          <CylG args={[0.32, 0.36, 4.6, 8]} />
          <Flat color="#E6E0D4" />
        </mesh>
      ))}
      <mesh position={[0, 6.2, 2.9]} castShadow>
        <BoxG args={[13.6, 0.6, 1.2]} />
        <Flat color="#E6E0D4" />
      </mesh>
      {/* pediment: a low triangle over the colonnade */}
      <mesh position={[0, 6.5, 2.4]} castShadow>
        <extrudeGeometry args={[new THREE.Shape([new THREE.Vector2(-7, 0), new THREE.Vector2(7, 0), new THREE.Vector2(0, 2.0)]), { depth: 1.1, bevelEnabled: false }]} />
        <meshLambertMaterial color="#E6E0D4" flatShading />
      </mesh>
      {/* drum + dome + lantern */}
      <mesh position={[0, 7.6, -1.2]} castShadow>
        <CylG args={[3.2, 3.4, 2.4, 12]} />
        <Flat color={stone} />
      </mesh>
      <mesh position={[0, 8.8, -1.2]} scale={[1, 0.85, 1]} castShadow>
        <sphereGeometry args={[3.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Flat color="#DCD6C8" />
      </mesh>
      <mesh position={[0, 11.8, -1.2]} castShadow>
        <CylG args={[0.4, 0.5, 1.0, 8]} />
        <Flat color={stone} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[-7.8 + (i % 3) * 1.2 + (i > 2 ? 12.6 : 0), 3.6, 2.56]}>
          <boxGeometry args={[0.5, 0.9, 0.04]} />
          <Glow color="#E0B04E" />
        </mesh>
      ))}
    </group>
  );
};

/** A placard on a pole held up by a protester; board centre at `position`, facing +Z. */
export const Placard: React.FC<{ position: V3; yaw?: number; tilt?: number; color?: string }> = ({ position, yaw = 0, tilt = 0, color = "#F6EBC4" }) => (
  <group position={position} rotation={[0, yaw, tilt]}>
    <mesh position={[0, -1.0, -0.05]} castShadow>
      <CylG args={[0.04, 0.04, 1.6, 5]} />
      <Flat color="#8A6A44" />
    </mesh>
    <mesh castShadow>
      <BoxG args={[1.5, 0.9, 0.06]} />
      <Flat color={color} />
    </mesh>
  </group>
);

/** A white flag on a short pole (pole bottom at the origin, pole along +Y). */
export const WhiteFlag: React.FC<{ position: V3; rotation?: V3; t: number }> = ({ position, rotation = [0, 0, 0], t }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 0.6, 0]} castShadow>
      <CylG args={[0.03, 0.03, 1.2, 5]} />
      <Flat color="#8A6A44" />
    </mesh>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[0.12 + i * 0.22, 1.0 + Math.sin(t * 6 + i) * 0.03 * i, 0]} rotation={[0, Math.sin(t * 6 + i * 0.8) * 0.25, 0]} castShadow>
        <BoxG args={[0.24, 0.42, 0.02]} />
        <Flat color="#F6F2EA" />
      </mesh>
    ))}
  </group>
);

/** Debate chamber: a podium (top at y = 1.3) facing +Z, a big seal on the back wall, curved benches. */
export const Chamber: React.FC = () => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[30, 0.1, 30]} />
      <Flat color="#3A2E34" />
    </mesh>
    <mesh position={[0, 4, -3]} receiveShadow>
      <BoxG args={[30, 8, 0.2]} />
      <Flat color="#3A3550" />
    </mesh>
    <mesh position={[-3.6, 5.6, -2.88]}>
      <circleGeometry args={[1.0, 16]} />
      <Flat color={P.amber} />
    </mesh>
    <mesh position={[-3.6, 5.6, -2.87]}>
      <circleGeometry args={[0.72, 16]} />
      <Flat color="#5A4A78" />
    </mesh>
    {/* raised platform + podium */}
    <mesh position={[0, 0.2, -1.5]} castShadow receiveShadow>
      <BoxG args={[7, 0.4, 3]} />
      <Flat color="#5A3E2E" />
    </mesh>
    <mesh position={[0, 0.4 + 0.65, -0.8]} castShadow>
      <BoxG args={[1.6, 1.3, 0.8]} />
      <Flat color="#6A4A34" />
    </mesh>
    {/* benches (rows facing -Z, toward the podium) */}
    {[0, 1, 2].map((r) => (
      <mesh key={r} position={[0, 0.35 + r * 0.25, 2.6 + r * 1.9]} castShadow receiveShadow>
        <BoxG args={[12, 0.7 + r * 0.5, 0.9]} />
        <Flat color="#4A3A44" />
      </mesh>
    ))}
  </group>
);

/** Meeting room: a long table along Z (top at y = 1.5), a whiteboard on the back wall at z = -6. */
export const MeetingRoom: React.FC = () => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[20, 0.1, 20]} />
      <Flat color="#3A3E48" />
    </mesh>
    <mesh position={[0, 4, -6.1]} receiveShadow>
      <BoxG args={[20, 8, 0.2]} />
      <Flat color="#2E3A50" />
    </mesh>
    <mesh position={[0, 3.6, -5.98]}>
      <boxGeometry args={[6, 2.6, 0.04]} />
      <Flat color="#F2EEE6" />
    </mesh>
    <mesh position={[0, 0.75, -1]} castShadow receiveShadow>
      <BoxG args={[2.6, 0.12, 7]} />
      <Flat color="#5A3E2E" />
    </mesh>
    {[-1, 1].map((sx) =>
      [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * 1.1, 0.35, -1 + sz * 3.2]} castShadow>
          <BoxG args={[0.14, 0.7, 0.14]} />
          <Flat color="#4A3428" />
        </mesh>
      )),
    )}
    <pointLight position={[0, 6, 0]} color="#FFE2B8" intensity={20} distance={18} decay={2} />
  </group>
);

/** A chair seat (top at `seatY`) with a back, facing `yaw`. */
export const Chair: React.FC<{ position: V3; yaw?: number; seatY?: number }> = ({ position, yaw = 0, seatY = 0.5 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, seatY - 0.06, 0]} castShadow receiveShadow>
      <BoxG args={[0.9, 0.12, 0.9]} />
      <Flat color="#24748F" />
    </mesh>
    <mesh position={[0, seatY + 0.55, -0.42]} castShadow>
      <BoxG args={[0.9, 1.1, 0.1]} />
      <Flat color="#24748F" />
    </mesh>
    <mesh position={[0, (seatY - 0.12) / 2, 0]} castShadow>
      <CylG args={[0.06, 0.06, seatY - 0.12, 6]} />
      <Flat color="#2A2A30" />
    </mesh>
  </group>
);

/** A food bowl (heaped kibble). */
export const Bowl: React.FC<{ position: V3; full?: number }> = ({ position, full = 1 }) => (
  <group position={position}>
    <mesh position={[0, 0.12, 0]} castShadow>
      <CylG args={[0.36, 0.28, 0.24, 10]} />
      <Flat color="#C8372D" />
    </mesh>
    {full > 0 ? (
      <mesh position={[0, 0.2 + full * 0.06, 0]} scale={[1, 0.45 * full, 1]} castShadow>
        <IcoG args={[0.3, 1]} />
        <Flat color="#9A6A42" />
      </mesh>
    ) : null}
  </group>
);

/** Amber scan ring sweeping over a sphere (the moment of "the change" in the title shot). */
export const ScanRing: React.FC<{ radius: number; lat: number; opacity?: number }> = ({ radius, lat, opacity = 1 }) => {
  const r = radius * Math.cos(lat) * 1.012;
  return (
    <mesh position={[0, radius * Math.sin(lat), 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[Math.max(0.01, r), radius * 0.018, 4, 64]} />
      <meshBasicMaterial color="#FFBA58" transparent opacity={opacity} toneMapped={false} fog={false} />
    </mesh>
  );
};
