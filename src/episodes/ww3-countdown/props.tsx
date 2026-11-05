/**
 * Sets and props for "What If WW3 Started in 7 Days?" (ep. 5).
 * Generic world only: no real countries, flags, leaders, logos or weapons imagery beyond jets in the sky.
 * Everything rests on y = 0 using its real extents and follows the kit detail level.
 */
import React from "react";
import { random } from "remotion";
import * as THREE from "three";
import { Car, Lamp } from "../../slavoski/city";
import { BoxG, CylG, IcoG } from "../../slavoski/detail";
import { FONT } from "../../slavoski/fonts";
import { Flat, Glow } from "../../slavoski/materials";
import { clamp01, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { project, type CameraSpec } from "../../slavoski/Stage";

// ================================================================ screens (HTML on a 3D rectangle)

/**
 * Projected bounding box + clip polygon of a w×h rectangle centred at `c`: upright facing +Z rotated by
 * `yaw`, or lying flat facing +Y (`flat`, top edge toward −Z, like a phone face-up on a bed).
 */
export const screenRect = (c: V3, w: number, h: number, cam: CameraSpec, width: number, height: number, yaw = 0, flat = false) => {
  const cs = Math.cos(yaw);
  const sn = Math.sin(yaw);
  const corner = (dx: number, dy: number): V3 => (flat ? [c[0] + dx, c[1], c[2] - dy] : [c[0] + dx * cs, c[1] + dy, c[2] - dx * sn]);
  const pts = [corner(-w / 2, h / 2), corner(w / 2, h / 2), corner(w / 2, -h / 2), corner(-w / 2, -h / 2)].map((p) => project(p, cam, width, height));
  const x0 = Math.min(...pts.map((p) => p.x));
  const x1 = Math.max(...pts.map((p) => p.x));
  const y0 = Math.min(...pts.map((p) => p.y));
  const y1 = Math.max(...pts.map((p) => p.y));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, poly: pts.map((p) => `${p.x - x0}px ${p.y - y0}px`).join(", ") };
};

/** Renders `children(w, h)` clipped onto a projected 3D screen rectangle. */
export const OnScreen: React.FC<{
  c: V3;
  w: number;
  h: number;
  yaw?: number;
  flat?: boolean;
  cam: CameraSpec;
  width: number;
  height: number;
  children: (w: number, h: number) => React.ReactNode;
}> = ({ c, w, h, yaw = 0, flat = false, cam, width, height, children }) => {
  const r = screenRect(c, w, h, cam, width, height, yaw, flat);
  if (r.w < 8 || r.h < 8) return null;
  return (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, clipPath: `polygon(${r.poly})`, overflow: "hidden", pointerEvents: "none" }}>
      {children(r.w, r.h)}
    </div>
  );
};

// ================================================================ phone

/** A phone lying in or held by a hand: face toward +Z, centre at the origin. Screen 0.36 × 0.74. */
export const PHONE = { w: 0.42, h: 0.84, d: 0.05, screenW: 0.36, screenH: 0.74 };

export const Phone3D: React.FC<{ position: V3; rotation?: V3; glow?: string; scale?: number }> = ({ position, rotation = [0, 0, 0], glow = "#C8372D", scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh castShadow>
      <BoxG args={[PHONE.w, PHONE.h, PHONE.d]} />
      <Flat color="#15161C" />
    </mesh>
    <mesh position={[0, 0, PHONE.d / 2 + 0.002]}>
      <planeGeometry args={[PHONE.screenW, PHONE.screenH]} />
      <Glow color={glow} />
    </mesh>
  </group>
);

/** Generic emergency alert UI (not any real phone OS). */
export const AlertScreen: React.FC<{ w: number; h: number; title: string; body: string; t: number; tone?: "red" | "amber" }> = ({ w, h, title, body, t, tone = "red" }) => {
  const pulse = 0.75 + 0.25 * Math.abs(Math.sin(t * 6));
  const base = tone === "red" ? "#B3261E" : "#C77A10";
  return (
    <div style={{ width: w, height: h, background: `linear-gradient(180deg, ${base} 0%, #3A0E0C 100%)`, fontFamily: FONT, color: "#FFF", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: w * 0.08, boxSizing: "border-box" }}>
      <div style={{ width: w * 0.3, height: w * 0.3, borderRadius: "50%", border: `${w * 0.03}px solid rgba(255,255,255,${pulse})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: w * 0.2, marginBottom: h * 0.04 }}>!</div>
      <div style={{ fontSize: w * 0.065, letterSpacing: "0.18em", opacity: 0.85, marginBottom: h * 0.03 }}>{title}</div>
      <div style={{ fontWeight: 700, fontSize: w * 0.11, lineHeight: 1.12, whiteSpace: "pre-wrap" }}>{body}</div>
    </div>
  );
};

/** "No connection" / "call failed" style screen. */
export const DeadScreen: React.FC<{ w: number; h: number; label: string; sub?: string }> = ({ w, h, label, sub }) => (
  <div style={{ width: w, height: h, background: "#0E1018", fontFamily: FONT, color: "#E8E4DA", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
    <div style={{ fontSize: w * 0.22, fontWeight: 700, color: "#C8372D", lineHeight: 1 }}>✕</div>
    <div style={{ marginTop: h * 0.03, fontSize: w * 0.09, fontWeight: 700, whiteSpace: "pre-wrap" }}>{label}</div>
    {sub ? <div style={{ marginTop: h * 0.02, fontSize: w * 0.055, opacity: 0.6, whiteSpace: "pre-wrap" }}>{sub}</div> : null}
  </div>
);

// ================================================================ supermarket

/** Supermarket aisles along Z (x = -3, 0, 3), almost empty shelves. Fluorescent light strips overhead. */
export const Supermarket: React.FC<{ stock?: number; seed?: string }> = ({ stock = 0.12, seed = "mart" }) => {
  const shelfColor = "#C9C2B4";
  const items: React.ReactNode[] = [];
  [-3.6, 0, 3.6].forEach((x, ai) => {
    for (let level = 0; level < 4; level++)
      for (let i = 0; i < 18; i++) {
        const k = `${seed}${ai}:${level}:${i}`;
        if (random(k) > stock) continue;
        const side = random(`${k}s`) < 0.5 ? -1 : 1;
        const h = 0.3 + random(`${k}h`) * 0.25;
        items.push(
          <mesh key={k} position={[x + side * 0.45, 0.35 + level * 0.75 + h / 2 + 0.03, -12 + i * 0.75 + (random(`${k}z`) - 0.5) * 0.3]} castShadow>
            <BoxG args={[0.3, h, 0.3]} />
            <Flat color={["#C8372D", "#E0B04E", "#24748F", "#2F7A5A", "#F2EEE6"][Math.floor(random(`${k}c`) * 5)]} />
          </mesh>,
        );
      }
  });
  return (
    <group>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[16, 0.1, 40]} />
        <Flat color="#D8D2C4" />
      </mesh>
      <mesh position={[0, 3.5, -14]} receiveShadow>
        <BoxG args={[16, 7, 0.2]} />
        <Flat color="#566270" />
      </mesh>
      {[-3.6, 0, 3.6].map((x) => (
        <group key={x} position={[x, 0, -5]}>
          <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
            <BoxG args={[0.2, 3.2, 14]} />
            <Flat color="#A8A090" />
          </mesh>
          {[0.35, 1.1, 1.85, 2.6].map((y) => (
            <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
              <BoxG args={[1.2, 0.06, 14]} />
              <Flat color={shelfColor} />
            </mesh>
          ))}
        </group>
      ))}
      {items}
      {[-1.8, 1.8].map((x) => (
        <mesh key={x} position={[x, 6.4, -5]}>
          <boxGeometry args={[0.3, 0.06, 26]} />
          <Glow color="#E8F0FF" />
        </mesh>
      ))}
      <pointLight position={[0, 6, -2]} color="#F0F4FF" intensity={30} distance={22} decay={2} />
    </group>
  );
};

/** A shopping trolley (front faces +Z), basket top at y ≈ 1.25. */
export const Trolley: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.95, 0]} castShadow>
      <BoxG args={[0.8, 0.6, 1.1]} />
      <meshLambertMaterial color="#9AA1B0" flatShading transparent opacity={0.55} />
    </mesh>
    <mesh position={[0, 1.25, -0.6]} castShadow>
      <BoxG args={[0.9, 0.06, 0.06]} />
      <Flat color="#C8372D" />
    </mesh>
    {[-0.32, 0.32].map((x) =>
      [-0.45, 0.45].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.1, z]} rotation={[0, 0, Math.PI / 2]}>
          <CylG args={[0.1, 0.1, 0.06, 8]} />
          <Flat color="#22242E" />
        </mesh>
      )),
    )}
    <mesh position={[0, 0.4, 0]}>
      <BoxG args={[0.7, 0.04, 1.0]} />
      <Flat color="#7A808E" />
    </mesh>
  </group>
);

// ================================================================ fuel station + queue

/** Fuel station canopy over two pumps, by the road at x = 4.5. A long queue of cars on the road (x = 1.7). */
export const FuelQueue: React.FC<{ cars?: number; t: number }> = ({ cars = 24, t }) => (
  <group>
    <group position={[6.5, 0, 0]}>
      <mesh position={[0, 4.4, 0]} castShadow>
        <BoxG args={[7, 0.5, 5]} />
        <Flat color="#E8E4DA" />
      </mesh>
      <mesh position={[0, 4.2, 2.52]}>
        <boxGeometry args={[7, 0.2, 0.04]} />
        <Glow color="#C8372D" />
      </mesh>
      {[-2.6, 2.6].map((x) =>
        [-1.8, 1.8].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 2.1, z]} castShadow>
            <BoxG args={[0.3, 4.2, 0.3]} />
            <Flat color="#D8D2C4" />
          </mesh>
        )),
      )}
      {[-1.2, 1.2].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.8, 0]} castShadow>
            <BoxG args={[0.6, 1.6, 0.5]} />
            <Flat color="#C8372D" />
          </mesh>
          <mesh position={[0, 1.2, 0.26]}>
            <planeGeometry args={[0.4, 0.3]} />
            <Glow color="#E0B04E" />
          </mesh>
        </group>
      ))}
      <pointLight position={[0, 3.8, 0]} color="#FFF2D8" intensity={25} distance={12} decay={2} />
    </group>
    {Array.from({ length: cars }, (_, i) => (
      <Car key={i} position={[1.7, 0, 3 - i * 3.6]} yaw={Math.PI} color={[P.carRed, P.carTeal, "#E8E4DA", "#566270", "#2A2A30"][i % 5]} lights={Math.floor(t * 2 + i) % 7 !== 0} />
    ))}
  </group>
);

// ================================================================ city billboard (stock crash)

/** A giant screen on a pole in a plaza, facing +Z. Screen centre/size exported for OnScreen. */
export const BILLBOARD = { c: [0, 6.0, -2] as V3, w: 4.6, h: 3.2 };

export const Billboard: React.FC = () => (
  <group>
    <mesh position={[0, 2.1, -2.4]} castShadow>
      <BoxG args={[0.6, 4.2, 0.6]} />
      <Flat color="#2A2A30" />
    </mesh>
    <mesh position={[BILLBOARD.c[0], BILLBOARD.c[1], BILLBOARD.c[2] - 0.2]} castShadow>
      <BoxG args={[BILLBOARD.w + 0.4, BILLBOARD.h + 0.4, 0.3]} />
      <Flat color="#15161C" />
    </mesh>
    <mesh position={[BILLBOARD.c[0], BILLBOARD.c[1], BILLBOARD.c[2] - 0.04]}>
      <planeGeometry args={[BILLBOARD.w, BILLBOARD.h]} />
      <Glow color="#0E1220" />
    </mesh>
    <pointLight position={[0, 5, 1]} color="#FF5040" intensity={22} distance={14} decay={2} />
  </group>
);

/** A market chart that plunges: red line + falling percentage. `k` 0..1 = how far the crash has gone. */
export const CrashChart: React.FC<{ w: number; h: number; k: number }> = ({ w, h, k }) => {
  const pts = Array.from({ length: 40 }, (_, i) => {
    const u = i / 39;
    const wiggle = Math.sin(i * 1.7) * 0.03 + Math.sin(i * 0.6) * 0.04;
    const drop = u < 0.55 ? 0 : Math.min(1, (u - 0.55) / 0.45) ** 1.6 * 0.72;
    return [u, 0.3 + wiggle + drop] as const;
  });
  const shown = Math.max(2, Math.floor(pts.length * (0.5 + 0.5 * k)));
  const path = pts.slice(0, shown).map(([u, v], i) => `${i ? "L" : "M"}${(0.06 + u * 0.88) * w},${v * h * 0.75 + h * 0.18}`).join(" ");
  const pct = (k * 34).toFixed(1);
  return (
    <div style={{ width: w, height: h, background: "#0B0E18", fontFamily: FONT, position: "relative" }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        {[0.3, 0.5, 0.7].map((v) => (
          <line key={v} x1={w * 0.06} x2={w * 0.94} y1={h * v} y2={h * v} stroke="#2A3248" strokeWidth={2} />
        ))}
        <path d={path} stroke="#E8473A" strokeWidth={Math.max(3, w * 0.012)} fill="none" strokeLinejoin="round" />
      </svg>
      <div style={{ position: "absolute", left: w * 0.06, top: h * 0.05, color: "#E8E4DA", fontWeight: 700, fontSize: h * 0.085, letterSpacing: "0.08em" }}>GLOBAL MARKETS</div>
      <div style={{ position: "absolute", right: w * 0.06, bottom: h * 0.05, color: "#FF5A4A", fontWeight: 700, fontSize: h * 0.2 }}>▼ {pct}%</div>
    </div>
  );
};

// ================================================================ airport

/** A terminal wall with a departures board (centre/size exported), benches and a luggage trolley. */
export const BOARD = { c: [0, 5.0, -4] as V3, w: 4.8, h: 3.4 };

export const Terminal: React.FC = () => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[30, 0.1, 30]} />
      <Flat color="#B8B2A4" />
    </mesh>
    <mesh position={[0, 4.5, -4.3]} receiveShadow>
      <BoxG args={[30, 9, 0.3]} />
      <Flat color="#566270" />
    </mesh>
    <mesh position={[BOARD.c[0], BOARD.c[1], BOARD.c[2] - 0.08]} castShadow>
      <BoxG args={[BOARD.w + 0.3, BOARD.h + 0.3, 0.2]} />
      <Flat color="#15161C" />
    </mesh>
    {[-4.5, 4.5].map((x) => (
      <mesh key={x} position={[x, 0.45, 0.5]} castShadow receiveShadow>
        <BoxG args={[3, 0.9, 0.8]} />
        <Flat color="#24748F" />
      </mesh>
    ))}
    <pointLight position={[0, 7, 2]} color="#F0F4FF" intensity={26} distance={20} decay={2} />
  </group>
);

const FLIGHTS = [
  ["SK 101", "LONDON"],
  ["SK 214", "NEW YORK"],
  ["SK 330", "TOKYO"],
  ["SK 412", "DUBAI"],
  ["SK 508", "SYDNEY"],
  ["SK 617", "PARIS"],
];

/** Departures rows flipping to CANCELLED one by one as `k` goes 0..1. */
export const Departures: React.FC<{ w: number; h: number; k: number }> = ({ w, h, k }) => (
  <div style={{ width: w, height: h, background: "#0B0E18", fontFamily: FONT, color: "#E8D27A", padding: `${h * 0.05}px ${w * 0.04}px`, boxSizing: "border-box" }}>
    <div style={{ fontWeight: 700, fontSize: h * 0.09, letterSpacing: "0.12em", color: "#E8E4DA", marginBottom: h * 0.03 }}>DEPARTURES</div>
    {FLIGHTS.map(([code, city], i) => {
      const gone = k * FLIGHTS.length > i + 0.2;
      return (
        <div key={code} style={{ display: "flex", justifyContent: "space-between", fontSize: h * 0.075, lineHeight: 1.45, fontWeight: 700 }}>
          <span style={{ width: "24%" }}>{code}</span>
          <span style={{ width: "40%" }}>{city}</span>
          <span style={{ width: "36%", textAlign: "right", color: gone ? "#FF5A4A" : "#7FE08A" }}>{gone ? "CANCELLED" : "ON TIME"}</span>
        </div>
      );
    })}
  </div>
);

// ================================================================ border checkpoint

/** A checkpoint across a road along Z: booth on the right, a boom barrier that lowers with `down` 0..1. */
export const Checkpoint: React.FC<{ down: number; t: number }> = ({ down, t }) => {
  const red = Math.floor(t * 3) % 2 === 0;
  return (
    <group>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[60, 0.1, 80]} />
        <Flat color="#2F5A44" />
      </mesh>
      <mesh position={[0, 0.0, -10]} receiveShadow>
        <BoxG args={[8, 0.06, 60]} />
        <Flat color={P.road} />
      </mesh>
      {/* booth */}
      <group position={[5.2, 0, 0]}>
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <BoxG args={[2.2, 3, 2.2]} />
          <Flat color="#E8E4DA" />
        </mesh>
        <mesh position={[0, 3.15, 0]} castShadow>
          <BoxG args={[2.6, 0.3, 2.6]} />
          <Flat color="#566270" />
        </mesh>
        <mesh position={[-1.11, 1.8, 0]}>
          <planeGeometry args={[0.02, 0.02]} />
          <Flat color="#000" />
        </mesh>
        <mesh position={[-1.115, 1.9, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[1.6, 0.9]} />
          <Glow color="#E0B04E" />
        </mesh>
        {/* warning light */}
        <mesh position={[0, 3.5, 0]}>
          <IcoG args={[0.22, 1]} />
          <Glow color={red ? "#FF3030" : "#401010"} />
        </mesh>
        {red ? <pointLight position={[0, 3.6, 0]} color="#FF3030" intensity={14} distance={10} decay={2} /> : null}
      </group>
      {/* barrier post + arm (hinged at the post, swings down from vertical) */}
      <group position={[4.0, 1.0, 1.4]}>
        <mesh position={[0, -0.5, 0]} castShadow>
          <BoxG args={[0.5, 1.0, 0.5]} />
          <Flat color="#C8372D" />
        </mesh>
        <group rotation={[0, 0, Math.PI / 2 - down * (Math.PI / 2)]}>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} position={[-0.45 - i * 0.9, 0.15, 0]} castShadow>
              <BoxG args={[0.9, 0.18, 0.18]} />
              <Flat color={i % 2 ? "#C8372D" : "#F2EEE6"} />
            </mesh>
          ))}
        </group>
      </group>
      {/* stopped cars */}
      <Car position={[-1.7, 0, 7]} yaw={Math.PI} color={P.carTeal} />
      <Car position={[-1.7, 0, 11.2]} yaw={Math.PI} color="#E8E4DA" />
      <Car position={[1.7, 0, 8.5]} yaw={Math.PI} color={P.carRed} />
      {/* sign gantry */}
      {[-4.6, 4.6].map((x) => (
        <mesh key={x} position={[x, 3.4, -4]} castShadow>
          <BoxG args={[0.3, 6.8, 0.3]} />
          <Flat color="#2A2A30" />
        </mesh>
      ))}
      <mesh position={[0, 6.4, -4]} castShadow>
        <BoxG args={[9.6, 1.4, 0.3]} />
        <Flat color="#15161C" />
      </mesh>
    </group>
  );
};
export const GANTRY = { c: [0, 6.4, -3.83] as V3, w: 5.6, h: 1.1 };

// ================================================================ ATM

/** A wall with an ATM (screen centre/size exported), facing +Z. */
export const ATM = { c: [0, 2.6, 0.27] as V3, w: 0.8, h: 0.62 };

export const AtmWall: React.FC = () => (
  <group>
    <mesh position={[0, -0.05, 4]} receiveShadow>
      <BoxG args={[20, 0.1, 16]} />
      <Flat color={P.pavement} />
    </mesh>
    <mesh position={[0, 4, -0.3]} receiveShadow>
      <BoxG args={[20, 8, 0.6]} />
      <Flat color={P.bldgSlate} />
    </mesh>
    <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
      <BoxG args={[1.6, 2.4, 0.5]} />
      <Flat color="#3A3E48" />
    </mesh>
    <mesh position={[0, 1.6, 0.26]}>
      <boxGeometry args={[0.7, 0.5, 0.03]} />
      <Flat color="#22242E" />
    </mesh>
    <mesh position={[0, 3.3, 0.26]}>
      <boxGeometry args={[1.2, 0.3, 0.03]} />
      <Glow color="#24748F" />
    </mesh>
    <Lamp position={[3.2, 0, 1.6]} />
  </group>
);

// ================================================================ fighter jet + contrail

/** Generic low-poly jet (nose toward +Z), ≈ 3 long. */
export const Jet: React.FC<{ position: V3; rotation?: V3; scale?: number; trail?: number }> = ({ position, rotation = [0, 0, 0], scale = 1, trail = 14 }) => {
  const grey = "#7A808E";
  const dark = "#4A4E58";
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <CylG args={[0.08, 0.24, 2.6, 6]} />
        <Flat color={grey} />
      </mesh>
      <mesh position={[0, 0, 1.55]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.08, 0.6, 6]} />
        <Flat color={dark} />
      </mesh>
      <mesh position={[0, 0.12, 0.55]}>
        <BoxG args={[0.16, 0.12, 0.5]} />
        <Glow color="#3A4A6A" />
      </mesh>
      {/* delta wings */}
      <mesh position={[0, -0.02, -0.25]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <shapeGeometry args={[new THREE.Shape([new THREE.Vector2(-1.4, -0.8), new THREE.Vector2(1.4, -0.8), new THREE.Vector2(0, 0.9)])]} />
        <meshLambertMaterial color={grey} flatShading side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.35, -1.0]} castShadow>
        <BoxG args={[0.05, 0.6, 0.6]} />
        <Flat color={dark} />
      </mesh>
      {/* engine glow + tapered contrail */}
      <mesh position={[0, 0, -1.35]}>
        <IcoG args={[0.14, 1]} />
        <Glow color="#FFBA58" />
      </mesh>
      {trail > 0 ? (
        <mesh position={[0, 0, -1.4 - trail / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.32, trail, 8, 1, true]} />
          <meshBasicMaterial color="#E8ECF5" transparent opacity={0.35} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
};

// ================================================================ shelter entrance, sirens, boarded shops

/** Steps down into a shelter, opening toward +Z, with rails and a green SHELTER sign (sign centre exported). */
export const SHELTER_SIGN = { c: [0, 3.3, -1.56] as V3, w: 2.6, h: 0.7 };

export const ShelterEntrance: React.FC<{ position: V3 }> = ({ position }) => (
  <group position={position}>
    {/* dark stairwell opening: a pit rendered as a black box sunk below the pavement */}
    <mesh position={[0, -0.04, 0]}>
      <boxGeometry args={[2.4, 0.1, 3]} />
      <Flat color="#050608" />
    </mesh>
    {Array.from({ length: 4 }, (_, i) => (
      <mesh key={i} position={[0, -0.02 - i * 0.001, 1.2 - i * 0.55]}>
        <boxGeometry args={[2.3, 0.02, 0.12]} />
        <Flat color="#3A3E48" />
      </mesh>
    ))}
    {[-1.3, 1.3].map((x) => (
      <React.Fragment key={x}>
        <mesh position={[x, 0.55, 0]} castShadow>
          <BoxG args={[0.2, 1.1, 3.2]} />
          <Flat color="#566270" />
        </mesh>
        <mesh position={[x, 1.6, -1.5]} castShadow>
          <BoxG args={[0.16, 3.2, 0.16]} />
          <Flat color="#2A2A30" />
        </mesh>
      </React.Fragment>
    ))}
    <mesh position={[0, 3.3, -1.6]} castShadow>
      <BoxG args={[2.9, 0.9, 0.1]} />
      <Flat color="#15161C" />
    </mesh>
    <mesh position={[0, 3.3, -1.54]}>
      <planeGeometry args={[2.6, 0.7]} />
      <Glow color="#2FA05A" />
    </mesh>
    <pointLight position={[0, 2.6, 0]} color="#7FE08A" intensity={8} distance={7} decay={2} />
  </group>
);

/** A siren pole with a rotating red light. */
export const Siren: React.FC<{ position: V3; t: number }> = ({ position, t }) => {
  const on = Math.sin(t * 9) > 0;
  return (
    <group position={position}>
      <mesh position={[0, 3, 0]} castShadow>
        <CylG args={[0.08, 0.1, 6, 6]} />
        <Flat color="#2A2A30" />
      </mesh>
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a) => (
        <mesh key={a} position={[Math.sin(a) * 0.35, 5.6, Math.cos(a) * 0.35]} rotation={[Math.PI / 2, 0, -a]} castShadow>
          <coneGeometry args={[0.22, 0.45, 8, 1, true]} />
          <meshLambertMaterial color="#9AA1B0" flatShading side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh position={[0, 6.15, 0]}>
        <IcoG args={[0.2, 1]} />
        <Glow color={on ? "#FF3030" : "#401010"} />
      </mesh>
      {on ? <pointLight position={[0, 6.2, 0]} color="#FF3030" intensity={30} distance={18} decay={2} /> : null}
    </group>
  );
};

/** A shopfront (facing +Z) with its windows and door boarded up with planks. Width w, ground floor h 3.4. */
export const BoardedShop: React.FC<{ position: V3; w?: number; color?: string; seed?: string }> = ({ position, w = 5, color = P.bldgPurple, seed = "shop" }) => (
  <group position={position}>
    <mesh position={[0, 4, -0.5]} castShadow receiveShadow>
      <BoxG args={[w, 8, 1]} />
      <Flat color={color} />
    </mesh>
    <mesh position={[0, 3.7, 0.05]}>
      <boxGeometry args={[w - 0.4, 0.5, 0.1]} />
      <Flat color="#2A2A30" />
    </mesh>
    {/* two windows + a door, each covered by crossed planks */}
    {[
      [-w / 2 + 1.3, 1.6, 1.8, 2.0],
      [w / 2 - 1.3, 1.6, 1.8, 2.0],
      [0, 1.35, 1.1, 2.7],
    ].map(([x, y, bw, bh], i) => (
      <group key={i} position={[x, y, 0.03]}>
        <mesh>
          <boxGeometry args={[bw, bh, 0.02]} />
          <Flat color="#15161C" />
        </mesh>
        {[-0.5, 0, 0.5].map((f, j) => (
          <mesh key={j} position={[0, f * bh * 0.6, 0.05 + j * 0.012]} rotation={[0, 0, (random(`${seed}${i}${j}`) - 0.5) * 0.5]} castShadow>
            <BoxG args={[bw + 0.3, 0.26, 0.05]} />
            <Flat color={j % 2 ? "#A88040" : "#C8A060"} />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.12]} rotation={[0, 0, Math.atan2(bh, bw)]} castShadow>
          <BoxG args={[Math.hypot(bw, bh), 0.24, 0.05]} />
          <Flat color="#9A7A48" />
        </mesh>
      </group>
    ))}
  </group>
);

// ================================================================ summit

/** A round summit table (top at y = 1.2) under a dome of light, with a big plain screen behind. */
export const SUMMIT_SCREEN = { c: [0, 6, -9.8] as V3, w: 9, h: 3.6 };

export const SummitHall: React.FC = () => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[40, 0.1, 40]} />
      <Flat color="#2A2430" />
    </mesh>
    <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[7.5, 32]} />
      <Flat color="#5A3E4A" />
    </mesh>
    <mesh position={[0, 6, -10]} receiveShadow>
      <BoxG args={[40, 12, 0.3]} />
      <Flat color="#1D274B" />
    </mesh>
    <mesh position={[SUMMIT_SCREEN.c[0], SUMMIT_SCREEN.c[1], SUMMIT_SCREEN.c[2] - 0.05]}>
      <boxGeometry args={[SUMMIT_SCREEN.w + 0.3, SUMMIT_SCREEN.h + 0.3, 0.1]} />
      <Flat color="#15161C" />
    </mesh>
    <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
      <CylG args={[4.2, 4.2, 0.2, 24]} />
      <Flat color="#E8E4DA" />
    </mesh>
    <mesh position={[0, 0.5, 0]} castShadow>
      <CylG args={[3.6, 3.6, 1.0, 24, 1, true]} />
      <Flat color="#5A3E2E" />
    </mesh>
    <pointLight position={[0, 9, 0]} color="#FFE2B8" intensity={40} distance={20} decay={2} />
  </group>
);

/** Simple TV news graphic for the summit broadcast. */
export const NewsGraphic: React.FC<{ w: number; h: number; t: number; black?: number }> = ({ w, h, t, black = 0 }) => (
  <div style={{ width: w, height: h, position: "relative", background: "linear-gradient(180deg,#1D274B,#0B0E18)", fontFamily: FONT, overflow: "hidden" }}>
    {/* table silhouette with seated figures */}
    <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
      <ellipse cx={w / 2} cy={h * 0.68} rx={w * 0.34} ry={h * 0.1} fill="#E8E4DA" />
      {Array.from({ length: 7 }, (_, i) => {
        const x = w * (0.22 + i * 0.093);
        return <circle key={i} cx={x} cy={h * 0.5} r={h * 0.05} fill="#3A3E48" />;
      })}
    </svg>
    <div style={{ position: "absolute", left: w * 0.04, top: h * 0.05, background: "#C8372D", color: "#FFF", fontWeight: 700, fontSize: h * 0.075, padding: `${h * 0.01}px ${w * 0.015}px`, opacity: 0.6 + 0.4 * Math.abs(Math.sin(t * 3)) }}>● LIVE</div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: h * 0.06, background: "rgba(200,55,45,0.92)", color: "#FFF", fontWeight: 700, fontSize: h * 0.085, padding: `${h * 0.02}px ${w * 0.04}px` }}>EMERGENCY SUMMIT: FINAL TALKS</div>
    {black > 0 ? <div style={{ position: "absolute", inset: 0, background: "#000", opacity: clamp01(black) }} /> : null}
  </div>
);

// ================================================================ alarm clock

/** Bedside digital clock (face toward +Z): box + glowing face (face centre/size exported). */
export const CLOCK = { w: 0.9, h: 0.42 };

export const AlarmClock: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.25, 0]} castShadow>
      <BoxG args={[1.0, 0.5, 0.4]} />
      <Flat color="#15161C" />
    </mesh>
    <mesh position={[0, 0.25, 0.205]}>
      <planeGeometry args={[CLOCK.w, CLOCK.h]} />
      <Glow color="#200808" />
    </mesh>
    <pointLight position={[0, 0.3, 0.6]} color="#FF3030" intensity={2.5} distance={3} decay={2} />
  </group>
);

/** Big "DAY N" stamp that slams in at a chapter start. */
export const DayStamp: React.FC<{ n: number; lt: number }> = ({ n, lt }) => {
  if (lt > 1.15) return null;
  const inK = clamp01(lt / 0.12);
  const out = clamp01((lt - 0.85) / 0.3);
  const scale = 1.25 - 0.25 * inK;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontFamily: FONT, opacity: inK * (1 - out), transform: `scale(${scale})`, transformOrigin: "50% 0", pointerEvents: "none" }}>
      <div style={{ display: "inline-block", padding: "8px 40px 10px", background: "rgba(8,8,14,0.72)", border: `4px solid ${P.amber}` }}>
        <div style={{ fontSize: 24, letterSpacing: "0.4em", color: "rgba(255,255,255,0.75)" }}>DAY</div>
        <div style={{ fontWeight: 700, fontSize: 110, lineHeight: 1, color: P.amber }}>{n}</div>
      </div>
    </div>
  );
};
