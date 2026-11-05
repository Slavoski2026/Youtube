/**
 * Sets and props for "What If WW3 Started in 7 Days?" (ep. 5).
 * Generic world only: no real countries, flags, leaders, logos or weapons imagery beyond jets in the sky.
 * Everything rests on y = 0 using its real extents and follows the kit detail level.
 */
import React from "react";
import { random } from "remotion";
import * as THREE from "three";
import { Building, Car, Lamp, PineTree, Road, BUILDING_COLORS } from "../../slavoski/city";
import { BoxG, CylG, IcoG } from "../../slavoski/detail";
import { FONT } from "../../slavoski/fonts";
import { Flat, Glow } from "../../slavoski/materials";
import { clamp01, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { CANVAS_FONT, CanvasPanel, fitText, ScreenHtml } from "../../slavoski/screens";
import type { CameraSpec } from "../../slavoski/Stage";

// ================================================================ screens (HTML on a 3D rectangle)

/**
 * Renders `children(W, H)` onto a 3D screen rectangle, laid out once at a fixed design size and
 * perspective-mapped (see kit `screens.tsx`): steady, crisp text however the camera moves.
 */
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
}> = (props) => <ScreenHtml {...props} />;

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

/**
 * Fuel station canopy over two pumps beside the road at x = 6.5, z = +6, and a long queue of cars in the
 * right lane (x = 1.7) facing it (+Z). Pair with a StreetSet (cars off) for the town around it, sinking the
 * right-hand buildings near the station (see `fuelStreetModify`).
 */
export const FUEL_Z = 6;
export const FuelQueue: React.FC<{ cars?: number; t: number }> = ({ cars = 24, t }) => (
  <group>
    <group position={[6.5, 0, FUEL_Z]}>
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
      {/* price sign on a pylon */}
      <mesh position={[3.9, 3.0, 3.4]} castShadow>
        <BoxG args={[0.3, 6, 0.3]} />
        <Flat color="#2A2A30" />
      </mesh>
      <mesh position={[3.9, 6.2, 3.4]} castShadow>
        <BoxG args={[1.6, 1.4, 0.3]} />
        <Flat color="#C8372D" />
      </mesh>
      <mesh position={[3.9, 6.0, 3.56]}>
        <planeGeometry args={[1.2, 0.5]} />
        <Glow color="#E0B04E" />
      </mesh>
      <pointLight position={[0, 3.8, 0]} color="#FFF2D8" intensity={25} distance={12} decay={2} />
    </group>
    {Array.from({ length: cars }, (_, i) => (
      <Car key={i} position={[1.7, 0, FUEL_Z - 4 - i * 3.6]} yaw={0} color={[P.carRed, P.carTeal, "#E8E4DA", "#566270", "#2A2A30"][i % 5]} lights={Math.floor(t * 2 + i) % 7 !== 0} />
    ))}
  </group>
);

/** StreetSet modifier for the fuel shot: sink the right-hand buildings that would stand in the station. */
export const fuelStreetModify = (spec: { position: V3 }) => (spec.position[0] > 0 && spec.position[2] > -2 ? { sink: 1 } : {});

// ================================================================ city billboard (stock crash)

/** A giant screen on a pole in a plaza, facing +Z. Screen centre/size exported for OnScreen. */
export const BILLBOARD = { c: [0, 8.6, -2] as V3, w: 4.6, h: 3.2 };

export const Billboard: React.FC = () => (
  <group>
    <mesh position={[0, 3.5, -2.4]} castShadow>
      <BoxG args={[0.6, 7.0, 0.6]} />
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

// ================================================================ airport

/** A terminal wall with a departures board (centre/size exported), benches and a luggage trolley. */
export const BOARD = { c: [0, 6.3, -4] as V3, w: 4.8, h: 3.4 };

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
    {/* pillars, ceiling light strips, floor stripes, a gate sign */}
    {[-3.3, 3.3].map((x) => (
      <mesh key={x} position={[x, 4.5, -2.6]} castShadow>
        <BoxG args={[0.7, 9, 0.7]} />
        <Flat color="#C9C2B4" />
      </mesh>
    ))}
    {[-1.5, 1.5].map((x) => (
      <mesh key={x} position={[x, 8.6, 2]}>
        <boxGeometry args={[0.3, 0.06, 16]} />
        <Glow color="#E8F0FF" />
      </mesh>
    ))}
    {[-0.9, 0.9].map((x) => (
      <mesh key={x} position={[x, 0.006, 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.18, 16]} />
        <Flat color="#E0B04E" />
      </mesh>
    ))}
    {[-6.5, 6.5].map((x) => (
      <mesh key={x} position={[x, 4.2, -4.12]}>
        <planeGeometry args={[3.2, 6]} />
        <Glow color="#141C34" />
      </mesh>
    ))}
    <pointLight position={[0, 7, 2]} color="#F0F4FF" intensity={26} distance={20} decay={2} />
  </group>
);

// ================================================================ border checkpoint

/** A checkpoint across a road along Z: booth on the right, a boom barrier that lowers with `down` 0..1. */
export const Checkpoint: React.FC<{ down: number; t: number }> = ({ down, t }) => {
  const red = Math.floor(t * 3) % 2 === 0;
  return (
    <group>
      <mesh position={[0, -0.05, -40]} receiveShadow>
        <boxGeometry args={[200, 0.1, 200]} />
        <meshLambertMaterial color="#2F5A44" flatShading />
      </mesh>
      <Road position={[0, 0.005, -30]} width={8} length={160} />
      <BorderLand t={t} />
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
      {/* stopped cars queued back toward the camera */}
      <Car position={[-1.7, 0, 5.5]} yaw={Math.PI} color={P.carTeal} />
      <Car position={[-1.7, 0, 9.7]} yaw={Math.PI} color="#E8E4DA" />
      <Car position={[1.7, 0, 4.2]} yaw={Math.PI} color={P.carRed} />
      <Car position={[1.7, 0, 8.4]} yaw={Math.PI} color="#566270" />
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

/**
 * Everything past (and along) the border: a wire fence across the land on both sides of the road
 * (clear of the booth and gantry), floodlights, the far side's closed booth, a pine forest, rolling hills,
 * a sleeping town and mountains on the horizon. Seeded, so it is identical every frame.
 */
const BorderLand: React.FC<{ t: number }> = () => {
  const fence: React.ReactNode[] = [];
  const runs: [number, number][] = [
    [-4.6, -44],
    [6.6, 44],
  ];
  runs.forEach(([from, to], ri) => {
    const dir = Math.sign(to - from);
    const n = Math.floor(Math.abs(to - from) / 2.5);
    for (let i = 0; i <= n; i++) {
      fence.push(
        <mesh key={`p${ri}${i}`} position={[from + dir * i * 2.5, 1.3, -0.6]} castShadow>
          <BoxG args={[0.14, 2.6, 0.14]} />
          <Flat color="#4A4E58" />
        </mesh>,
      );
    }
    [0.6, 1.3, 2.0, 2.5].forEach((y) =>
      fence.push(
        <mesh key={`w${ri}${y}`} position={[(from + to) / 2, y, -0.6]}>
          <boxGeometry args={[Math.abs(to - from), 0.03, 0.03]} />
          <Flat color="#7A808E" />
        </mesh>,
      ),
    );
  });
  const trees: React.ReactNode[] = [];
  for (let i = 0; i < 70; i++) {
    const k = `bt${i}`;
    const side = random(`${k}s`) < 0.5 ? -1 : 1;
    const x = side * (9 + random(`${k}x`) * 30);
    const z = -14 - random(`${k}z`) * 34;
    trees.push(<PineTree key={k} position={[x, 0, z]} scale={1.2 + random(`${k}c`) * 0.9} />);
  }
  const town = Array.from({ length: 9 }, (_, i) => {
    const k = `tw${i}`;
    const side = i % 2 ? 1 : -1;
    return (
      <Building
        key={k}
        position={[side * (12 + random(`${k}x`) * 22), 0, -62 - random(`${k}z`) * 10]}
        w={4 + random(`${k}w`) * 3}
        d={4}
        h={6 + random(`${k}h`) * 10}
        color={BUILDING_COLORS[i % BUILDING_COLORS.length]}
        seed={k}
        litRatio={0.35}
      />
    );
  });
  return (
    <group>
      {fence}
      {/* floodlights along the fence */}
      {[-9, -22, 9.5, 22].map((x) => (
        <Lamp key={x} position={[x, 0, -1.6]} height={7} />
      ))}
      {/* the far side: a second, closed booth and its lowered barrier */}
      <group position={[-5.2, 0, -16]}>
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <BoxG args={[2.2, 3, 2.2]} />
          <Flat color="#C9C2B4" />
        </mesh>
        <mesh position={[0, 3.15, 0]} castShadow>
          <BoxG args={[2.6, 0.3, 2.6]} />
          <Flat color="#566270" />
        </mesh>
        <mesh position={[1.115, 1.9, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.6, 0.9]} />
          <Glow color="#E0B04E" />
        </mesh>
      </group>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={`fb${i}`} position={[-3.6 + i * 0.9 + 0.45, 1.15, -14.6]} castShadow>
          <BoxG args={[0.9, 0.18, 0.18]} />
          <Flat color={i % 2 ? "#C8372D" : "#F2EEE6"} />
        </mesh>
      ))}
      {trees}
      {/* rolling hills */}
      {[
        [-28, -52, 16],
        [24, -56, 18],
        [-6, -70, 22],
        [40, -78, 20],
        [-44, -74, 20],
      ].map(([x, z, r], i) => (
        <mesh key={`h${i}`} position={[x, -r * 0.62, z]} scale={[1.4, 1, 1]} receiveShadow>
          <icosahedronGeometry args={[r, 2]} />
          <meshLambertMaterial color={i % 2 ? "#24453A" : "#2A4E40"} flatShading />
        </mesh>
      ))}
      {town}
      {/* mountains */}
      {[
        [-40, 34, 24],
        [-6, 42, 30],
        [30, 36, 26],
      ].map(([x, h, r], i) => (
        <mesh key={`m${i}`} position={[x, h / 2 - 1, -120]}>
          <coneGeometry args={[r, h, 7]} />
          <meshLambertMaterial color="#2A3346" flatShading />
        </mesh>
      ))}
    </group>
  );
};

// ================================================================ ATM

/**
 * A bank on a street with an ATM in its wall, at human scale (the ATM screen is at Slavoski's eye
 * height). The buildings, road, car and lamp are kit pieces scaled ×3.5 (`CITY`) so a 4.2-tall hero
 * doesn't tower over three floors of windows. Screen centre/size exported for OnScreen.
 */
export const CITY = 3.5;
export const ATM = { c: [0, 3.9, 0.405] as V3, w: 1.2, h: 0.93 };

export const AtmWall: React.FC = () => (
  <group>
    <mesh position={[0, -0.05, 2]} receiveShadow>
      <boxGeometry args={[120, 0.1, 6]} />
      <meshLambertMaterial color={P.pavement} flatShading />
    </mesh>
    <group scale={CITY}>
      {/* bank front face at world z = -0.4, just behind the ATM housing */}
      <Building position={[0, 0, -0.114 - 2]} w={4.6} d={4} h={13} color={P.bldgSlate} seed="bank" litRatio={0.25} />
      <Building position={[-5.1, 0, -0.2 - 2]} w={4.4} d={4} h={9} color={P.bldgPurple} seed="bank2" litRatio={0.3} />
      <Building position={[5.2, 0, -0.2 - 2]} w={4.8} d={4} h={16} color={P.bldgNavy} seed="bank3" litRatio={0.3} />
      <Road position={[0, 0.002, 4.5]} width={7} length={40} yaw={Math.PI / 2} />
      <Car position={[-2.2, 0, 2.8]} yaw={Math.PI / 2} color={P.carTeal} />
      <Lamp position={[0.9, 0, 0.55]} />
    </group>
    {/* ATM housing, scaled ×1.5 so its screen sits at eye height */}
    <group scale={1.5}>
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
    </group>
    <mesh position={[-3.2, 0.6, 1.0]} castShadow>
      <CylG args={[0.4, 0.34, 1.2, 8]} />
      <Flat color="#2E5A6A" />
    </mesh>
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
export const BoardedShop: React.FC<{ position: V3; w?: number; color?: string; seed?: string; h?: number }> = ({ position, w = 5, color = P.bldgPurple, seed = "shop", h = 10 }) => (
  <group position={position}>
    {/* the building itself, front face at z = 0, power almost all out */}
    <Building position={[0, 0, -2]} w={w} d={4} h={h} color={color} seed={seed} power={0.1} />
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
    {/* colonnade and tall night windows around the hall */}
    {Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2;
      return (
        <React.Fragment key={i}>
          <mesh position={[Math.sin(a) * 12.5, 5, Math.cos(a) * 12.5]} castShadow>
            <CylG args={[0.45, 0.5, 10, 8]} />
            <Flat color="#C9C2B4" />
          </mesh>
          <mesh position={[Math.sin(a + Math.PI / 16) * 13.6, 5.5, Math.cos(a + Math.PI / 16) * 13.6]} rotation={[0, a + Math.PI / 16 + Math.PI, 0]}>
            <planeGeometry args={[3.6, 8]} />
            <Glow color="#141C38" />
          </mesh>
        </React.Fragment>
      );
    })}
    <mesh position={[0, 5.5, 0]}>
      <cylinderGeometry args={[14, 14, 11, 32, 1, true]} />
      <meshLambertMaterial color="#1D274B" flatShading side={THREE.BackSide} />
    </mesh>
    <mesh position={[0, 10.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[5, 5.3, 48]} />
      <Glow color="#FFE2B8" />
    </mesh>
    {/* microphones and name cards in front of every seat */}
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2 + 0.2;
      const r = 3.55;
      return (
        <group key={i} position={[Math.sin(a) * r, 1.2, Math.cos(a) * r]} rotation={[0, a, 0]}>
          <mesh position={[0.35, 0.25, 0]}>
            <CylG args={[0.025, 0.04, 0.5, 6]} />
            <Flat color="#2A2A30" />
          </mesh>
          <mesh position={[0.35, 0.52, -0.05]}>
            <IcoG args={[0.06, 1]} />
            <Flat color="#15161C" />
          </mesh>
          <mesh position={[-0.3, 0.1, 0.05]} rotation={[-0.3, 0, 0]}>
            <BoxG args={[0.6, 0.2, 0.04]} />
            <Flat color="#F2EEE6" />
          </mesh>
        </group>
      );
    })}
    {/* TV camera rigs at the edge of the floor */}
    {[
      [8.5, 6.5],
      [-8.5, 6.5],
    ].map(([x, z], i) => (
      <group key={i} position={[x, 0, z]} rotation={[0, Math.atan2(-x, -z), 0]}>
        {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((a) => (
          <mesh key={a} position={[Math.sin(a) * 0.35, 0.8, Math.cos(a) * 0.35]} rotation={[Math.cos(a) * 0.4, 0, -Math.sin(a) * 0.4]} castShadow>
            <CylG args={[0.04, 0.04, 1.7, 5]} />
            <Flat color="#2A2A30" />
          </mesh>
        ))}
        <mesh position={[0, 1.85, 0]} castShadow>
          <BoxG args={[0.6, 0.5, 1.0]} />
          <Flat color="#22242E" />
        </mesh>
        <mesh position={[0.2, 2.05, -0.3]}>
          <IcoG args={[0.05, 0]} />
          <Glow color="#FF3030" />
        </mesh>
      </group>
    ))}
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

// ================================================================ canvas drawings for 3D signs (occludable)

/** A flat coloured sign with one line of text, shrunk to fit. */
export const drawLabel = (text: string, bg: string, color = "#FFFFFF", size = 0.62) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  fitText(ctx, text, W / 2, H / 2 + H * 0.03, W * 0.9, H * size, color);
};

/** The market crash chart (k 0..1 = how far the crash has gone). */
export const drawCrashChart = (k: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0B0E18";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#2A3248";
  ctx.lineWidth = Math.max(2, H * 0.006);
  for (const v of [0.35, 0.55, 0.75]) {
    ctx.beginPath();
    ctx.moveTo(W * 0.06, H * v);
    ctx.lineTo(W * 0.94, H * v);
    ctx.stroke();
  }
  const pts = Array.from({ length: 40 }, (_, i) => {
    const u = i / 39;
    const wiggle = Math.sin(i * 1.7) * 0.03 + Math.sin(i * 0.6) * 0.04;
    const drop = u < 0.55 ? 0 : Math.min(1, (u - 0.55) / 0.45) ** 1.6 * 0.62;
    return [W * (0.06 + u * 0.88), H * (0.36 + wiggle + drop)] as const;
  });
  const shown = Math.max(2, Math.floor(pts.length * (0.5 + 0.5 * k)));
  ctx.strokeStyle = "#E8473A";
  ctx.lineWidth = Math.max(4, W * 0.012);
  ctx.lineJoin = "round";
  ctx.beginPath();
  pts.slice(0, shown).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = CANVAS_FONT(H * 0.085);
  ctx.fillStyle = "#E8E4DA";
  ctx.fillText("GLOBAL MARKETS", W * 0.06, H * 0.06);
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.font = CANVAS_FONT(H * 0.2);
  ctx.fillStyle = "#FF5A4A";
  ctx.fillText(`▼ ${(k * 34).toFixed(1)}%`, W * 0.94, H * 0.96);
};

/** The departures board; rows flip to CANCELLED one by one as k goes 0..1. */
export const drawDepartures = (k: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0B0E18";
  ctx.fillRect(0, 0, W, H);
  const pad = W * 0.05;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = CANVAS_FONT(H * 0.09);
  ctx.fillStyle = "#E8E4DA";
  ctx.fillText("DEPARTURES", pad, H * 0.11);
  const rowH = H * 0.125;
  FLIGHT_ROWS.forEach(([code, city], i) => {
    const y = H * 0.27 + i * rowH;
    const gone = k * FLIGHT_ROWS.length > i + 0.2;
    ctx.font = CANVAS_FONT(H * 0.07);
    ctx.textAlign = "left";
    ctx.fillStyle = "#E8D27A";
    ctx.fillText(code, pad, y);
    ctx.fillText(city, W * 0.29, y);
    ctx.textAlign = "right";
    ctx.fillStyle = gone ? "#FF5A4A" : "#7FE08A";
    ctx.fillText(gone ? "CANCELLED" : "ON TIME", W - pad, y);
  });
};

const FLIGHT_ROWS = [
  ["SK 101", "LONDON"],
  ["SK 214", "NEW YORK"],
  ["SK 330", "TOKYO"],
  ["SK 412", "DUBAI"],
  ["SK 508", "SYDNEY"],
  ["SK 617", "PARIS"],
];

// ================================================================ the shelter

/**
 * A civil-defence shelter at human scale (Slavoski is 4.2 tall): a concrete block with a lit doorway
 * (4.4 wide × 5.6 tall), the steel blast door swung open, hazard stripes, sandbag walls and a big green
 * SHELTER sign above the door. Front faces +Z at local z = 0; the block runs back to z = -7.
 */
export const SHELTER = { doorW: 4.4, doorH: 5.6, w: 12, d: 7, h: 8 };

export const ShelterBunker: React.FC<{ position: V3; yaw?: number; t: number }> = ({ position, yaw = 0, t }) => {
  const flick = 0.85 + 0.15 * Math.sin(t * 13);
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, SHELTER.h / 2, -SHELTER.d / 2]} castShadow receiveShadow>
        <BoxG args={[SHELTER.w, SHELTER.h, SHELTER.d]} />
        <Flat color="#8A8F99" />
      </mesh>
      <mesh position={[0, SHELTER.h + 0.3, -SHELTER.d / 2]} castShadow>
        <BoxG args={[SHELTER.w + 0.6, 0.6, SHELTER.d + 0.6]} />
        <Flat color="#6A707C" />
      </mesh>
      {/* lit doorway with the top of a stairwell going down */}
      <mesh position={[0, SHELTER.doorH / 2, 0.02]}>
        <planeGeometry args={[SHELTER.doorW, SHELTER.doorH]} />
        <Glow color="#3A2A18" />
      </mesh>
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={i} position={[0, 0.3 + i * 0.35, 0.03]}>
          <planeGeometry args={[SHELTER.doorW - 0.4, 0.12]} />
          <Glow color="#E0B04E" opacity={0.55 - i * 0.1} />
        </mesh>
      ))}
      <pointLight position={[0, 3.2, 1.2]} color="#FFC890" intensity={18 * flick} distance={12} decay={2} />
      {/* hazard-striped door frame */}
      {[-1, 1].map((sx) =>
        Array.from({ length: 7 }, (_, i) => (
          <mesh key={`${sx}${i}`} position={[sx * (SHELTER.doorW / 2 + 0.25), 0.4 + i * 0.8, 0.12]} castShadow>
            <BoxG args={[0.5, 0.8, 0.24]} />
            <Flat color={i % 2 ? "#15161C" : "#E0B04E"} />
          </mesh>
        )),
      )}
      <mesh position={[0, SHELTER.doorH + 0.3, 0.12]} castShadow>
        <BoxG args={[SHELTER.doorW + 1.0, 0.6, 0.24]} />
        <Flat color="#E0B04E" />
      </mesh>
      {/* open blast door, hinged on the right of the frame, swung out flat against the facade */}
      <group position={[SHELTER.doorW / 2 + 0.5, 0, 0.25]} rotation={[0, -0.35, 0]}>
        <mesh position={[SHELTER.doorW / 2, SHELTER.doorH / 2, 0.25]} castShadow>
          <BoxG args={[SHELTER.doorW, SHELTER.doorH, 0.5]} />
          <Flat color="#566270" />
        </mesh>
        <mesh position={[SHELTER.doorW / 2, SHELTER.doorH / 2, 0.52]}>
          <CylG args={[0.5, 0.5, 0.08, 10]} />
          <Flat color="#C8372D" />
        </mesh>
      </group>
      {/* the big green sign above the door (a real 3D sign: people in front of it hide it) */}
      <mesh position={[0, 7.15, 0.08]} castShadow>
        <BoxG args={[7.4, 1.7, 0.16]} />
        <Flat color="#15161C" />
      </mesh>
      <CanvasPanel position={[0, 7.15, 0.17]} w={7} h={1.4} draw={drawLabel("SHELTER  ↓", "#2FA05A", "#FFFFFF", 0.7)} />
      {/* sandbag walls either side of the entrance */}
      {[-1, 1].map((sx) =>
        [0, 1, 2].map((row) =>
          [0, 1, 2].map((i) => (
            <mesh key={`${sx}${row}${i}`} position={[sx * (SHELTER.doorW / 2 + 1.2 + i * 1.0 + (row % 2) * 0.5), 0.25 + row * 0.48, 1.4]} castShadow>
              <BoxG args={[0.95, 0.46, 0.7]} />
              <Flat color={(row + i) % 2 ? "#A8956A" : "#B8A47A"} />
            </mesh>
          )),
        ),
      )}
      {/* roof floodlights */}
      {[-4.5, 4.5].map((x) => (
        <group key={x} position={[x, SHELTER.h + 0.9, 0.2]}>
          <mesh>
            <BoxG args={[0.8, 0.5, 0.5]} />
            <Flat color="#2A2A30" />
          </mesh>
          <mesh position={[0, -0.05, 0.26]}>
            <planeGeometry args={[0.6, 0.3]} />
            <Glow color="#F2EEE6" />
          </mesh>
          <pointLight position={[0, -0.6, 1.5]} color="#E8F0FF" intensity={16} distance={14} decay={2} />
        </group>
      ))}
    </group>
  );
};
