/**
 * Sets and props for "What If Every Fish Learned to Walk?" (ep. 8).
 * Kitchen + goldfish bowl + oven clock, river, supermarket front, beach dressing, harbour with
 * fishing boats and an empty fish market, country road sign, shop window that shatters,
 * barricade with riot shields, fish & chips, a seafood menu board.
 * Generic world (no real brands, flags or places).
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { BoxG, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import type { V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { CANVAS_FONT, CanvasPanel, fitText } from "../../slavoski/screens";

// ================================================================ kitchen

/** Kitchen layout (hero scale: counter top at 2.1 ≈ 90 cm). Back wall at z = -4, window over the sink. */
export const KITCHEN = { counterY: 2.1, counterZ: -3.2, backZ: -4, bowl: [0.4, 2.1, -3.15] as V3, clock: [2.35, 2.1, -3.4] as V3 };

/** Big digital clock on a microwave (`text` e.g. "7:59"), drawn on a canvas panel. */
const drawClock = (text: string, flash: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0A0E0C";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = `rgba(80,255,150,${0.06 + flash * 0.2})`;
  ctx.fillRect(0, 0, W, H);
  fitText(ctx, text, W / 2, H / 2 + H * 0.04, W * 0.86, H * 0.78, flash > 0.5 ? "#C8FFD8" : "#5CF08E");
};

export const Microwave: React.FC<{ position: V3; text: string; flash?: number }> = ({ position, text, flash = 0 }) => (
  <group position={position}>
    <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
      <BoxG args={[1.9, 1.1, 1.2]} />
      <Flat color="#D8DCE2" />
    </mesh>
    <mesh position={[-0.28, 0.55, 0.61]}>
      <boxGeometry args={[1.15, 0.8, 0.02]} />
      <Flat color="#1E2430" />
    </mesh>
    <mesh position={[0.66, 0.55, 0.61]}>
      <boxGeometry args={[0.5, 0.9, 0.02]} />
      <Flat color="#2A303C" />
    </mesh>
    <CanvasPanel position={[0.66, 0.78, 0.625]} w={0.42} h={0.2} px={256} draw={drawClock(text, flash)} />
    {[0.5, 0.4, 0.3].map((y, i) => (
      <mesh key={i} position={[0.66, y, 0.63]}>
        <boxGeometry args={[0.3, 0.05, 0.02]} />
        <Flat color="#8A92A0" />
      </mesh>
    ))}
    <Halo position={[0.66, 0.78, 0.7]} size={0.9} color="#5CF08E" opacity={0.25 + flash * 0.4} />
  </group>
);

/** A round goldfish bowl (glass shell + water + gravel), base on y = 0 at `position`. Radius ~0.6. */
export const BOWL_R = 0.62;
export const FishBowl: React.FC<{ position: V3; water?: number }> = ({ position, water = 0.72 }) => (
  <group position={position}>
    <mesh position={[0, 0.06, 0]} receiveShadow>
      <CylG args={[BOWL_R * 0.55, BOWL_R * 0.55, 0.12, 12]} />
      <Flat color="#C9A86A" />
    </mesh>
    <mesh position={[0, BOWL_R * 0.92, 0]} renderOrder={4}>
      <icosahedronGeometry args={[BOWL_R * 0.94, 2]} />
      <meshBasicMaterial color="#3A9AD0" transparent opacity={0.2} depthWrite={false} />
    </mesh>
    {/* water surface */}
    <mesh position={[0, BOWL_R * (0.3 + water), 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={5}>
      <circleGeometry args={[BOWL_R * 0.86, 14]} />
      <meshBasicMaterial color="#7FD0F0" transparent opacity={0.35} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
    {/* glass shell + rim */}
    <mesh position={[0, BOWL_R * 0.92, 0]} renderOrder={6}>
      <icosahedronGeometry args={[BOWL_R, 2]} />
      <meshLambertMaterial color="#CFEFFF" transparent opacity={0.16} depthWrite={false} flatShading side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, BOWL_R * 1.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[BOWL_R * 0.62, 0.025, 4, 18]} />
      <meshLambertMaterial color="#E8F6FF" transparent opacity={0.7} />
    </mesh>
    <mesh position={[0.15, 0.22, -0.1]}>
      <IcoG args={[0.12, 0]} />
      <Flat color="#7A8090" />
    </mesh>
    <mesh position={[-0.2, 0.36, 0.05]} rotation={[0, 0, 0.15]}>
      <ConeG args={[0.05, 0.4, 4]} />
      <Flat color="#2F7A5A" />
    </mesh>
  </group>
);

/** Kitchen: counter with cabinets along the back wall, a window with the morning sky, fridge, table. */
export const Kitchen: React.FC<{ t: number; sun?: number }> = ({ t, sun = 1 }) => {
  const { counterY, backZ } = KITCHEN;
  const wall = "#E8DCC4";
  const cab = "#2E5A6A";
  return (
    <group>
      {/* floor + back wall + side wall */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[30, 0.1, 20]} />
        <Flat color="#B89A72" />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[-13.5 + i * 3, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[0.05, 20]} />
          <Flat color="#9A7E5A" />
        </mesh>
      ))}
      {/* back wall with a window hole (left of the sink) */}
      <mesh position={[-8.2, 4, backZ - 0.1]} receiveShadow>
        <BoxG args={[11, 8, 0.2]} />
        <Flat color={wall} />
      </mesh>
      <mesh position={[6.6, 4, backZ - 0.1]} receiveShadow>
        <BoxG args={[12.8, 8, 0.2]} />
        <Flat color={wall} />
      </mesh>
      <mesh position={[-1.6, 1.8, backZ - 0.1]} receiveShadow>
        <BoxG args={[1.6 + 0.0 + 1.4, 3.6, 0.2]} />
        <Flat color={wall} />
      </mesh>
      <mesh position={[-1.6, 7.0, backZ - 0.1]} receiveShadow>
        <BoxG args={[3.0, 2.0, 0.2]} />
        <Flat color={wall} />
      </mesh>
      {/* the window (3 wide, 2.4 tall) with a sky + sun behind it */}
      <mesh position={[-1.6, 4.8, backZ - 3]}>
        <planeGeometry args={[14, 10]} />
        <meshBasicMaterial color="#9CCBF0" toneMapped={false} />
      </mesh>
      <mesh position={[-0.4, 5.6, backZ - 2.9]}>
        <circleGeometry args={[0.55, 12]} />
        <Glow color="#FFF3D0" />
      </mesh>
      <Halo position={[-0.4, 5.6, backZ - 2.8]} size={4} color="#FFE2A0" opacity={0.6 * sun} />
      {[-2.4, 0.2].map((x, i) => (
        <mesh key={i} position={[x - 0.6 + i * 0.6, 4.2 + i * 0.6, backZ - 2.85]} scale={[1.6, 0.5, 0.5]}>
          <IcoG args={[0.6, 0]} />
          <Flat color="#F4F6FA" />
        </mesh>
      ))}
      {[
        [-1.6, 3.6, 3.2, 0.12],
        [-1.6, 6.0, 3.2, 0.12],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, backZ + 0.02]}>
          <BoxG args={[w, h, 0.16]} />
          <Flat color="#F6F2EA" />
        </mesh>
      ))}
      {[-3.1, -1.6, -0.1].map((x) => (
        <mesh key={x} position={[x, 4.8, backZ + 0.02]}>
          <BoxG args={[0.12, 2.5, 0.16]} />
          <Flat color="#F6F2EA" />
        </mesh>
      ))}
      {/* sunbeam on the floor */}
      <mesh position={[-0.6, 0.02, -0.8]} rotation={[-Math.PI / 2, 0, 0.2]}>
        <planeGeometry args={[2.6, 3.4]} />
        <meshBasicMaterial color="#FFE7B0" transparent opacity={0.18 * sun} depthWrite={false} />
      </mesh>
      {/* counter: cabinets + top + splashback tiles */}
      <mesh position={[-1, counterY / 2 - 0.08, -3.25]} castShadow receiveShadow>
        <BoxG args={[12, counterY - 0.16, 1.5]} />
        <Flat color={cab} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[-6 + i * 2 + 1, 1.1, -2.48]}>
          <boxGeometry args={[0.6, 0.06, 0.06]} />
          <Flat color="#C9CED6" />
        </mesh>
      ))}
      <mesh position={[-1, counterY - 0.08, -3.2]} castShadow receiveShadow>
        <BoxG args={[12.2, 0.16, 1.7]} />
        <Flat color="#ECE8E0" />
      </mesh>
      {/* sink */}
      <mesh position={[-1.6, counterY + 0.005, -3.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.4, 0.9]} />
        <Flat color="#9AA1B0" />
      </mesh>
      <mesh position={[-1.6, counterY + 0.5, -3.85]}>
        <CylG args={[0.05, 0.05, 1.0, 6]} />
        <Flat color="#C9CED6" />
      </mesh>
      <mesh position={[-1.6, counterY + 0.98, -3.6]} rotation={[Math.PI / 2, 0, 0]}>
        <CylG args={[0.05, 0.05, 0.6, 6]} />
        <Flat color="#C9CED6" />
      </mesh>
      {/* upper cabinets right of the window */}
      <mesh position={[3.4, 6.2, -3.6]} castShadow>
        <BoxG args={[5, 2.2, 0.8]} />
        <Flat color={cab} />
      </mesh>
      {/* tiles */}
      {Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 6 }, (_, c) => (
          <mesh key={`${r}${c}`} position={[0.6 + c * 0.8, counterY + 0.45 + r * 0.8, backZ + 0.01]}>
            <planeGeometry args={[0.74, 0.74]} />
            <Flat color={(r + c) % 2 ? "#F4F0E6" : "#E2EEF0"} />
          </mesh>
        )),
      )}
      {/* fridge */}
      <mesh position={[6.6, 3.6, -3.1]} castShadow receiveShadow>
        <BoxG args={[2.2, 7.2, 1.8]} />
        <Flat color="#E4E8EE" />
      </mesh>
      <mesh position={[5.7, 4.2, -2.18]}>
        <boxGeometry args={[0.08, 1.4, 0.1]} />
        <Flat color="#9AA1B0" />
      </mesh>
      {/* plant on the sill, kettle */}
      <mesh position={[-2.6, counterY + 0.3, -3.6]}>
        <CylG args={[0.2, 0.16, 0.5, 8]} />
        <Flat color="#C8372D" />
      </mesh>
      <mesh position={[-2.6, counterY + 0.8, -3.6]}>
        <IcoG args={[0.38, 1]} />
        <Flat color={P.leaf} />
      </mesh>
      <mesh position={[-4.4, counterY + 0.4, -3.3]} castShadow>
        <CylG args={[0.32, 0.38, 0.8, 8]} />
        <Flat color="#24748F" />
      </mesh>
      {/* steam from the kettle (seeded puffs) */}
      {[0, 1, 2].map((i) => {
        const k = ((t * 0.5 + i / 3) % 1 + 1) % 1;
        return (
          <mesh key={i} position={[-4.4 + Math.sin(k * 6 + i) * 0.1, counterY + 1.0 + k * 1.4, -3.3]} scale={0.12 + k * 0.25}>
            <IcoG args={[1, 0]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.35 * (1 - k)} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Kitchen table (top at y = 2.6, centre at position) with a cereal bowl and spoon. */
export const TABLE_TOP = 1.9;
export const KitchenTable: React.FC<{ position: V3 }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, TABLE_TOP - 0.08, 0]} castShadow receiveShadow>
      <BoxG args={[4.4, 0.16, 2.4]} />
      <Flat color="#C9A06A" />
    </mesh>
    {[
      [-1.9, -0.9],
      [1.9, -0.9],
      [-1.9, 0.9],
      [1.9, 0.9],
    ].map(([x, z], i) => (
      <mesh key={i} position={[x, (TABLE_TOP - 0.16) / 2, z]} castShadow>
        <BoxG args={[0.18, TABLE_TOP - 0.16, 0.18]} />
        <Flat color="#8A6A44" />
      </mesh>
    ))}
    {/* cereal bowl */}
    <mesh position={[-0.2, TABLE_TOP + 0.18, -0.25]} castShadow>
      <CylG args={[0.42, 0.26, 0.36, 10]} />
      <Flat color="#F4F0E6" />
    </mesh>
    <mesh position={[-0.2, TABLE_TOP + 0.33, -0.25]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.38, 10]} />
      <Flat color="#E8C070" />
    </mesh>
    <mesh position={[1.7, TABLE_TOP + 0.4, 0.4]} castShadow>
      <BoxG args={[0.5, 0.8, 0.2]} />
      <Flat color="#C8372D" />
    </mesh>
  </group>
);

/** A simple chair facing +Z, seat top at seatY. */
export const KitchenChair: React.FC<{ position: V3; yaw?: number; seatY?: number }> = ({ position, yaw = 0, seatY = 1.3 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, seatY - 0.08, 0]} castShadow receiveShadow>
      <BoxG args={[1.5, 0.16, 1.4]} />
      <Flat color="#8A6A44" />
    </mesh>
    <mesh position={[0, seatY + 1.1, -0.66]} castShadow>
      <BoxG args={[1.5, 2.0, 0.14]} />
      <Flat color="#8A6A44" />
    </mesh>
    {[
      [-0.6, -0.55],
      [0.6, -0.55],
      [-0.6, 0.55],
      [0.6, 0.55],
    ].map(([x, z], i) => (
      <mesh key={i} position={[x, (seatY - 0.16) / 2, z]} castShadow>
        <BoxG args={[0.12, seatY - 0.16, 0.12]} />
        <Flat color="#6A4E32" />
      </mesh>
    ))}
  </group>
);

// ================================================================ river (morning)

/** A river running along X at z ∈ [z0 - w, z0], banks of grass, trees and hills beyond. Water at y = -0.6. */
export const RIVER = { z0: -2, w: 26, water: -0.6 };
export const River: React.FC<{ t: number; seed?: string }> = ({ t, seed = "river" }) => {
  const { z0, w, water } = RIVER;
  return (
    <group>
      {/* near bank (sloping to the water) */}
      <mesh position={[0, -0.05, z0 + 60]} receiveShadow>
        <BoxG args={[400, 0.1, 120]} />
        <Flat color="#4F8F4A" />
      </mesh>
      <mesh position={[0, -0.35, z0 + 0.2]} rotation={[0.5, 0, 0]} receiveShadow>
        <BoxG args={[400, 0.1, 1.4]} />
        <Flat color="#6B5A45" />
      </mesh>
      {/* far bank */}
      <mesh position={[0, -0.05, z0 - w - 80]} receiveShadow>
        <BoxG args={[400, 0.1, 160]} />
        <Flat color="#4A8645" />
      </mesh>
      {/* water + ripples */}
      <mesh position={[0, water, z0 - w / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, w + 2]} />
        <Flat color="#2E6E96" />
      </mesh>
      {Array.from({ length: 36 }, (_, i) => (
        <mesh key={i} position={[((random(`${seed}rx${i}`) - 0.5) * 200 + t * 1.6) % 100, water + 0.03, z0 - 1 - random(`${seed}rz${i}`) * (w - 2)]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2 + random(`${seed}rw${i}`) * 3, 0.14]} />
          <Flat color="#7FB4D4" />
        </mesh>
      ))}
      {/* reeds along the near bank */}
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={i} position={[-60 + i * 4 + random(`${seed}re${i}`) * 2, 0.4, z0 + 0.6 + random(`${seed}rr${i}`) * 0.8]} rotation={[0, 0, Math.sin(t * 1.2 + i) * 0.08]}>
          <ConeG args={[0.08, 1.2, 4]} />
          <Flat color="#5E8A4C" />
        </mesh>
      ))}
    </group>
  );
};

/** A fishing rod held at the hand: a thin pole from `hand` along `dir`, with a line drooping to `bob`. */
export const FishingRod: React.FC<{ hand: V3; tip: V3; bob: V3 }> = ({ hand, tip, bob }) => {
  const mid: V3 = [(hand[0] + tip[0]) / 2, (hand[1] + tip[1]) / 2, (hand[2] + tip[2]) / 2];
  const len = Math.hypot(tip[0] - hand[0], tip[1] - hand[1], tip[2] - hand[2]);
  const dir = new THREE.Vector3(tip[0] - hand[0], tip[1] - hand[1], tip[2] - hand[2]).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  const lineMid: V3 = [(tip[0] + bob[0]) / 2, (tip[1] + bob[1]) / 2, (tip[2] + bob[2]) / 2];
  const lLen = Math.hypot(tip[0] - bob[0], tip[1] - bob[1], tip[2] - bob[2]);
  const ld = new THREE.Vector3(bob[0] - tip[0], bob[1] - tip[1], bob[2] - tip[2]).normalize();
  const lq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), ld);
  return (
    <group>
      <mesh position={mid} quaternion={q} castShadow>
        <cylinderGeometry args={[0.03, 0.06, len, 5]} />
        <Flat color="#3A2A1E" />
      </mesh>
      <mesh position={lineMid} quaternion={lq}>
        <cylinderGeometry args={[0.008, 0.008, lLen, 3]} />
        <meshBasicMaterial color="#E8E8E8" />
      </mesh>
      <mesh position={bob}>
        <IcoG args={[0.1, 0]} />
        <Flat color="#C8372D" />
      </mesh>
    </group>
  );
};

// ================================================================ supermarket front

const drawShopSign = (text: string, bg: string, color: string) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  fitText(ctx, text, W / 2, H / 2 + H * 0.04, W * 0.9, H * 0.66, color);
};

/** Supermarket front facing +Z at z = 0: glass frontage, sliding doors (open 0..1) at x = 0, a big sign. */
export const SUPERMARKET = { doorW: 4.4, doorH: 4.8, w: 44, h: 12 };
export const SupermarketFront: React.FC<{ open: number }> = ({ open }) => {
  const { doorW, doorH, w, h } = SUPERMARKET;
  return (
    <group>
      <mesh position={[0, h / 2, -12]} castShadow receiveShadow>
        <BoxG args={[w, h, 24]} />
        <Flat color="#E6E0D4" />
      </mesh>
      <mesh position={[0, h + 0.3, -11.8]} castShadow>
        <BoxG args={[w + 0.6, 0.6, 24.6]} />
        <Flat color="#C8372D" />
      </mesh>
      <mesh position={[0, 7.8, 0.9]} castShadow>
        <BoxG args={[w, 0.4, 1.8]} />
        <Flat color="#C8372D" />
      </mesh>
      <mesh position={[0, 6.35, 0.04]} castShadow>
        <BoxG args={[7.0, 1.8, 0.2]} />
        <Flat color="#A82A22" />
      </mesh>
      <CanvasPanel position={[0, 6.35, 0.16]} w={6.6} h={1.45} px={1024} draw={drawShopSign("FRESH MART", "#C8372D", "#FFFFFF")} />
      {/* glass frontage left/right of the doors (lit interior behind) */}
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <mesh position={[sd * (doorW / 2 + 7), 3.4, -0.4]}>
            <planeGeometry args={[13, 6.4]} />
            <meshBasicMaterial color="#F4E6C0" toneMapped={false} />
          </mesh>
          {Array.from({ length: 4 }, (_, i) => (
            <mesh key={i} position={[sd * (doorW / 2 + 1.5 + i * 3.4), 3.4, 0.02]}>
              <BoxG args={[0.18, 6.6, 0.18]} />
              <Flat color="#4A5060" />
            </mesh>
          ))}
          {/* shelves seen through the glass */}
          {Array.from({ length: 3 }, (_, i) => (
            <mesh key={`s${i}`} position={[sd * (doorW / 2 + 3.5 + i * 3.6), 1.6, -1.8]}>
              <BoxG args={[2.6, 3.2, 0.8]} />
              <Flat color={[P.carRed, "#E0B04E", P.carTeal][i]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* door opening: lit floor inside + two sliding glass panes */}
      <mesh position={[0, doorH / 2, -1.2]}>
        <planeGeometry args={[doorW, doorH]} />
        <meshBasicMaterial color="#F8EED2" toneMapped={false} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[sd * (doorW / 4 + open * doorW * 0.48), doorH / 2, 0.05]} renderOrder={3}>
          <boxGeometry args={[doorW / 2, doorH, 0.08]} />
          <meshLambertMaterial color="#BFE3FF" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      ))}
      <mesh position={[0, doorH + 0.15, 0.05]}>
        <BoxG args={[doorW + 0.4, 0.3, 0.3]} />
        <Flat color="#4A5060" />
      </mesh>
      {/* car park */}
      <mesh position={[0, 0.005, 20]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 40]} />
        <Flat color="#4A5066" />
      </mesh>
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[-26 + i * 4, 0.012, 16]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.15, 5]} />
          <Flat color={P.laneMark} />
        </mesh>
      ))}
      {/* entrance mat */}
      <mesh position={[0, 0.02, 1.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[doorW, 2]} />
        <Flat color="#2A303C" />
      </mesh>
    </group>
  );
};

// ================================================================ beach dressing

/** Noon beach: sand from z = -20 toward +Z, sea beyond, foam lines at the waterline (no low sun). */
export const NoonBeach: React.FC = () => (
  <group>
    <mesh position={[0, -0.05, 20]} receiveShadow>
      <BoxG args={[400, 0.1, 80]} />
      <Flat color="#E2C890" />
    </mesh>
    <mesh position={[0, -0.12, -140]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[600, 240]} />
      <Flat color="#1E78B0" />
    </mesh>
    {[-20.2, -24, -30].map((z, i) => (
      <mesh key={z} position={[0, -0.03 - i * 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[400, 0.6 - i * 0.15]} />
        <Glow color={P.waterFoam} opacity={0.85 - i * 0.2} />
      </mesh>
    ))}
  </group>
);

/** A beach umbrella (pole + faceted canopy) with a towel underneath. */
export const Umbrella: React.FC<{ position: V3; color: string; towel?: string; tilt?: number }> = ({ position, color, towel = "#F6EBC4", tilt = 0.08 }) => (
  <group position={position}>
    <mesh position={[0, 0.02, 1.4]} rotation={[-Math.PI / 2, 0, 0.3]} receiveShadow>
      <planeGeometry args={[2.2, 4.2]} />
      <Flat color={towel} />
    </mesh>
    <group rotation={[0, 0, tilt]}>
      <mesh position={[0, 2.6, 0]} castShadow>
        <CylG args={[0.06, 0.06, 5.2, 5]} />
        <Flat color="#E8E4DA" />
      </mesh>
      <mesh position={[0, 5.0, 0]} castShadow>
        <ConeG args={[2.8, 1.1, 8]} />
        <Flat color={color} />
      </mesh>
    </group>
  </group>
);

/** Lifeguard tower: stilts, cabin, red flag. */
export const LifeguardTower: React.FC<{ position: V3; yaw?: number; t: number }> = ({ position, yaw = 0, t }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    {[
      [-1.2, -1.2],
      [1.2, -1.2],
      [-1.2, 1.2],
      [1.2, 1.2],
    ].map(([x, z], i) => (
      <mesh key={i} position={[x, 2.2, z]} castShadow>
        <BoxG args={[0.24, 4.4, 0.24]} />
        <Flat color="#E8E4DA" />
      </mesh>
    ))}
    <mesh position={[0, 4.6, 0]} castShadow receiveShadow>
      <BoxG args={[3.2, 0.3, 3.2]} />
      <Flat color="#C9C2B4" />
    </mesh>
    <mesh position={[0, 6.0, -0.4]} castShadow>
      <BoxG args={[3.0, 2.4, 2.4]} />
      <Flat color="#C8372D" />
    </mesh>
    <mesh position={[0, 7.4, -0.4]} castShadow>
      <BoxG args={[3.6, 0.3, 3.0]} />
      <Flat color="#E8E4DA" />
    </mesh>
    <mesh position={[1.6, 8.6, -1.6]} castShadow>
      <CylG args={[0.04, 0.04, 2.6, 4]} />
      <Flat color="#2A2A30" />
    </mesh>
    <mesh position={[2.1, 9.4, -1.6]} rotation={[0, 0, Math.sin(t * 6) * 0.08]}>
      <boxGeometry args={[1.0, 0.6, 0.03]} />
      <Flat color="#E8372D" />
    </mesh>
  </group>
);

// ================================================================ harbour (day two)

/** A small fishing trawler facing +Z, waterline at y = 0: hull, wheelhouse, mast + boom. */
export const FishingBoat: React.FC<{ position: V3; yaw?: number; t: number; color?: string; roll?: number }> = ({ position, yaw = 0, t, color = "#C8372D", roll = 1 }) => {
  const rk = Math.sin(t * 1.3 + position[0]) * 0.04 * roll;
  return (
    <group position={[position[0], position[1] + Math.sin(t * 1.1 + position[2]) * 0.12, position[2]]} rotation={[rk * 0.5, yaw, rk]}>
      {/* hull: body + tapered bow */}
      <mesh position={[0, 0.5, -0.6]} castShadow receiveShadow>
        <BoxG args={[4.2, 2.2, 9]} />
        <Flat color={color} />
      </mesh>
      <mesh position={[0, 0.5, 4.4]} rotation={[Math.PI / 2, Math.PI / 4, 0]} scale={[1, 1, 0.75]} castShadow>
        <ConeG args={[2.95, 2.6, 4]} />
        <Flat color={color} />
      </mesh>
      <mesh position={[0, 1.65, -0.4]} castShadow>
        <BoxG args={[4.3, 0.2, 9.6]} />
        <Flat color="#E8E4DA" />
      </mesh>
      {/* wheelhouse */}
      <mesh position={[0, 3.0, -2.2]} castShadow>
        <BoxG args={[2.8, 2.6, 2.8]} />
        <Flat color="#E8E4DA" />
      </mesh>
      <mesh position={[0, 3.5, -0.79]}>
        <boxGeometry args={[2.2, 0.8, 0.04]} />
        <Flat color="#2A3A5A" />
      </mesh>
      <mesh position={[0, 4.45, -2.2]} castShadow>
        <BoxG args={[3.2, 0.3, 3.2]} />
        <Flat color={P.bldgNavy} />
      </mesh>
      {/* mast + boom */}
      <mesh position={[0, 6.0, 0.8]} castShadow>
        <CylG args={[0.1, 0.12, 8.6, 6]} />
        <Flat color="#2B2F3E" />
      </mesh>
      <mesh position={[0, 5.4, -2.4]} rotation={[-0.9, 0, 0]} castShadow>
        <CylG args={[0.07, 0.07, 6.5, 5]} />
        <Flat color="#2B2F3E" />
      </mesh>
      {/* buoys */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 2.2, 1.2, 1]}>
          <IcoG args={[0.3, 0]} />
          <Flat color="#F18E1C" />
        </mesh>
      ))}
    </group>
  );
};

/** A hanging fishing net (a faceted green bag) — empty except for an old boot. `lift` 0..1 raises it. */
export const EmptyNet: React.FC<{ top: V3; lift: number; t: number }> = ({ top, lift, t }) => {
  const y = top[1] - 4 + lift * 3.4;
  const sway = Math.sin(t * 2) * 0.08;
  return (
    <group position={[top[0], y, top[2]]} rotation={[sway, 0, sway * 0.6]}>
      <mesh position={[0, 4 - lift * 3.4 + 0.0, 0]}>
        <CylG args={[0.02, 0.02, Math.max(0.1, 8 - lift * 6.8), 3]} />
        <meshBasicMaterial color="#2A2A30" />
      </mesh>
      <mesh position={[0, -0.4, 0]} scale={[1, 1.5, 1]}>
        <icosahedronGeometry args={[1.0, 1]} />
        <meshLambertMaterial color="#3E8A5A" wireframe />
      </mesh>
      {/* the boot */}
      <group position={[0.1, -1.55, 0.1]} rotation={[0, 0.5, 0.2]}>
        <mesh position={[0, 0.25, 0]}>
          <BoxG args={[0.32, 0.6, 0.32]} />
          <Flat color="#3A2A1E" />
        </mesh>
        <mesh position={[0, 0.0, 0.2]}>
          <BoxG args={[0.34, 0.2, 0.62]} />
          <Flat color="#3A2A1E" />
        </mesh>
      </group>
    </group>
  );
};

const drawMarketSign = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#24748F";
  ctx.fillRect(0, 0, W, H);
  fitText(ctx, "FRESH FISH", W / 2, H / 2 + H * 0.04, W * 0.88, H * 0.62, "#FFFFFF");
};
const drawSoldOut = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#F6EBC4";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#C8372D";
  ctx.lineWidth = H * 0.06;
  ctx.strokeRect(H * 0.05, H * 0.05, W - H * 0.1, H - H * 0.1);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-0.08);
  fitText(ctx, "NO FISH", 0, H * 0.04, W * 0.84, H * 0.56, "#C8372D");
  ctx.restore();
};

/** A fish market stall facing +Z: awning, sign, empty ice trays and a "NO FISH" board. */
export const FishStall: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
      <BoxG args={[8, 2.4, 2.4]} />
      <Flat color="#E8E4DA" />
    </mesh>
    {/* ice trays: white crushed ice, nothing on it */}
    {[-2.6, 0, 2.6].map((x) => (
      <mesh key={x} position={[x, 2.48, 0.1]} rotation={[-0.25, 0, 0]}>
        <BoxG args={[2.4, 0.16, 2.0]} />
        <Flat color="#F4FAFF" />
      </mesh>
    ))}
    {[-3.8, 3.8].map((x) => (
      <mesh key={x} position={[x, 3.6, -0.9]} castShadow>
        <BoxG args={[0.16, 4.8, 0.16]} />
        <Flat color="#2B2F3E" />
      </mesh>
    ))}
    <mesh position={[0, 6.1, 0.2]} rotation={[0.3, 0, 0]} castShadow>
      <BoxG args={[8.6, 0.16, 3.4]} />
      <Flat color="#24748F" />
    </mesh>
    <CanvasPanel position={[0, 5.35, -0.82]} w={6.4} h={1.1} px={768} draw={drawMarketSign} />
    <group position={[2.0, 3.1, 1.25]} rotation={[-0.1, -0.2, 0.06]}>
      <CanvasPanel position={[0, 0, 0]} w={2.4} h={1.2} px={512} draw={drawSoldOut} />
    </group>
  </group>
);

// ================================================================ sonar / road sign / menu

/** A fish-finder screen (HTML), sweeping over an empty sea floor: "NO FISH DETECTED". */
export const SonarScreen: React.FC<{ w: number; h: number; t: number }> = ({ w, h, t }) => (
  <div style={{ width: w, height: h, background: "#04121C", position: "relative", overflow: "hidden", fontFamily: "Slavoski Sans, DejaVu Sans, sans-serif" }}>
    {Array.from({ length: 40 }, (_, i) => {
      const x = (i / 40) * w;
      const depth = h * (0.72 + Math.sin(i * 0.5 + t * 0.4) * 0.05 + Math.sin(i * 1.7) * 0.02);
      return <div key={i} style={{ position: "absolute", left: x, top: depth, width: w / 40 + 1, height: h - depth, background: i % 2 ? "#C88A3A" : "#B87A2E" }} />;
    })}
    <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.12, textAlign: "center", color: "#7FD6A0", fontSize: h * 0.075, letterSpacing: "0.1em", fontWeight: 700 }}>DEPTH 42 m</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.38, textAlign: "center", color: "#FF5A4A", fontSize: h * 0.11, fontWeight: 700, letterSpacing: "0.06em" }}>NO FISH</div>
    <div style={{ position: "absolute", top: 0, bottom: 0, left: ((t * 0.35) % 1) * w, width: 3, background: "rgba(127,214,160,0.6)" }} />
  </div>
);

const drawRoadSign = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#1F6E4A";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = H * 0.04;
  ctx.strokeRect(H * 0.05, H * 0.05, W - H * 0.1, H - H * 0.1);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = CANVAS_FONT(H * 0.36);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("CITY", W * 0.1, H * 0.5);
  ctx.textAlign = "right";
  ctx.fillText("12", W * 0.68, H * 0.5);
  // arrow
  ctx.beginPath();
  ctx.moveTo(W * 0.74, H * 0.36);
  ctx.lineTo(W * 0.84, H * 0.36);
  ctx.lineTo(W * 0.84, H * 0.24);
  ctx.lineTo(W * 0.94, H * 0.5);
  ctx.lineTo(W * 0.84, H * 0.76);
  ctx.lineTo(W * 0.84, H * 0.64);
  ctx.lineTo(W * 0.74, H * 0.64);
  ctx.closePath();
  ctx.fill();
};

/** A green road sign on two posts facing +Z, board centre at height 6. */
export const RoadSign: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    {[-2.2, 2.2].map((x) => (
      <mesh key={x} position={[x, 3.5, -0.1]} castShadow>
        <CylG args={[0.12, 0.12, 7, 6]} />
        <Flat color="#8E96A6" />
      </mesh>
    ))}
    <mesh position={[0, 6, -0.08]} castShadow>
      <BoxG args={[6.4, 2.6, 0.1]} />
      <Flat color="#174E36" />
    </mesh>
    <CanvasPanel position={[0, 6, 0]} w={6.2} h={2.4} px={768} draw={drawRoadSign} />
  </group>
);

const drawMenu = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#14161E";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#FFBA58";
  ctx.lineWidth = W * 0.012;
  ctx.strokeRect(W * 0.03, W * 0.03, W - W * 0.06, H - W * 0.06);
  fitText(ctx, "MENU", W / 2, H * 0.12, W * 0.5, H * 0.08, "#FFBA58");
  const items: [string, string][] = [
    ["FISH & CHIPS", "8.50"],
    ["SALMON ROLL", "6.00"],
    ["TUNA MELT", "5.50"],
    ["FISH FINGERS", "4.00"],
    ["COD BITES", "3.50"],
  ];
  items.forEach(([name, price], i) => {
    const y = H * (0.27 + i * 0.145);
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    let px = H * 0.052;
    ctx.font = CANVAS_FONT(px);
    while (ctx.measureText(name).width > W * 0.6 && px > 8) {
      px -= 1;
      ctx.font = CANVAS_FONT(px);
    }
    ctx.fillStyle = i === 1 ? "#FF7A6A" : "#F6EBC4";
    ctx.fillText(name, W * 0.09, y);
    ctx.font = CANVAS_FONT(H * 0.045, false);
    ctx.textAlign = "right";
    ctx.fillStyle = "#FFBA58";
    ctx.fillText(price, W * 0.91, y);
  });
};

/** A takeaway front at night (facing +Z): lit window, neon "FISH BAR" sign, a menu board on an A-frame. */
export const FishBar: React.FC<{ position: V3; t: number }> = ({ position, t }) => (
  <group position={position}>
    <mesh position={[0, 6, -3]} castShadow receiveShadow>
      <BoxG args={[16, 12, 6]} />
      <Flat color={P.bldgPurple} />
    </mesh>
    <mesh position={[0, 3.0, 0.02]}>
      <planeGeometry args={[11, 4.4]} />
      <meshBasicMaterial color="#F2D79A" toneMapped={false} />
    </mesh>
    <mesh position={[0, 5.6, 0.4]} castShadow>
      <BoxG args={[12, 0.4, 1]} />
      <Flat color="#1D274B" />
    </mesh>
    <CanvasPanel position={[0, 7.4, 0.08]} w={10} h={2.2} px={1024} draw={drawShopSign("FISH BAR", "#1A1020", Math.sin(t * 7) > -0.7 ? "#FF6AA8" : "#6A2A48")} />
    <Halo position={[0, 7.4, 0.6]} size={12} color="#FF6AA8" opacity={0.35} />
    {/* menu board on an A-frame on the pavement */}
    <group position={[3.2, 0, 3.4]} rotation={[0, -0.25, 0]}>
      <mesh position={[0, 2.1, -0.2]} rotation={[-0.14, 0, 0]} castShadow>
        <BoxG args={[3.0, 4.2, 0.12]} />
        <Flat color="#3A2A1E" />
      </mesh>
      <group position={[0, 2.2, -0.12]} rotation={[-0.14, 0, 0]}>
        <CanvasPanel position={[0, 0, 0]} w={2.7} h={3.8} px={512} draw={drawMenu} />
      </group>
    </group>
  </group>
);

/** A paper cone of fish & chips, centred at `position`, opening toward +Y. */
export const FishAndChips: React.FC<{ position: V3; rotation?: V3; bite?: number }> = ({ position, rotation = [0, 0, 0], bite = 0 }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, -0.05, 0]} rotation={[Math.PI, 0, 0]} castShadow>
      <ConeG args={[0.36, 0.8, 6]} />
      <Flat color="#F4F0E6" />
    </mesh>
    {Array.from({ length: 7 }, (_, i) => (
      <mesh key={i} position={[Math.sin(i * 2.3) * 0.15, 0.36 + (i % 3) * 0.05, Math.cos(i * 2.3) * 0.12]} rotation={[0.3 * Math.sin(i), 0, 0.4 * Math.cos(i * 1.7)]}>
        <boxGeometry args={[0.07, 0.42, 0.07]} />
        <Flat color="#E8C060" />
      </mesh>
    ))}
    {/* a battered fish fillet poking out (bitten) */}
    <mesh position={[0.08, 0.5, 0.02]} rotation={[0, 0, -0.35]} scale={[0.5 * (1 - bite * 0.3), 0.26, 0.12]} castShadow>
      <IcoG args={[1, 1]} />
      <Flat color="#C8902E" />
    </mesh>
  </group>
);

// ================================================================ shop window that shatters

/**
 * A shopfront facing +Z (ground floor, w wide) with a big glass window. `smash` 0..1 time since the glass
 * broke, in seconds: shards fly forward (+Z) and fall to the pavement, coming to rest (never through it).
 */
export const ShopFront: React.FC<{ position: V3; w?: number; color?: string; smash?: number; lit?: boolean; seed?: string; sign?: string; signBg?: string }> = ({
  position,
  w = 10,
  color = P.bldgTeal,
  smash = -1,
  lit = true,
  seed = "shop",
  sign = "BOUTIQUE",
  signBg = "#2A1A30",
}) => {
  const winW = w * 0.62;
  const winH = 4.2;
  const shards = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        x: (random(`${seed}x${i}`) - 0.5) * winW,
        y: 0.9 + random(`${seed}y${i}`) * winH,
        vx: (random(`${seed}vx${i}`) - 0.5) * 6,
        vz: 2 + random(`${seed}vz${i}`) * 7,
        vy: random(`${seed}vy${i}`) * 3,
        s: 0.2 + random(`${seed}s${i}`) * 0.4,
        r: random(`${seed}r${i}`) * 6,
      })),
    [seed, winW],
  );
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    shards.forEach((sh, i) => {
      if (smash < 0) {
        o.scale.setScalar(0.0001);
      } else {
        const tt = smash;
        // ballistic until it reaches the pavement (y = 0.04), then rests
        const yRaw = sh.y + sh.vy * tt - 9.8 * tt * tt * 0.5;
        const tLand = (sh.vy + Math.sqrt(sh.vy * sh.vy + 2 * 9.8 * (sh.y - 0.04))) / 9.8;
        const tc = Math.min(tt, tLand);
        o.position.set(sh.x + sh.vx * tc, Math.max(0.04, yRaw), 0.3 + sh.vz * tc);
        o.rotation.set(tt < tLand ? sh.r + tt * 9 : Math.PI / 2, sh.r, tt < tLand ? tt * 7 : 0);
        o.scale.set(sh.s, sh.s * 0.9, 0.03);
      }
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  const top = 0.9 + winH + 0.4;
  return (
    <group position={position}>
      {/* body behind the shop floor, facade above and beside the window */}
      <mesh position={[0, 7, -4]} castShadow receiveShadow>
        <BoxG args={[w, 14, 4]} />
        <Flat color={color} />
      </mesh>
      <mesh position={[0, top + (14 - top) / 2, -1]} castShadow receiveShadow>
        <BoxG args={[w, 14 - top, 2]} />
        <Flat color={color} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[sd * (winW / 2 + (w - winW) / 4 + 0.15), top / 2, -1]} castShadow receiveShadow>
          <BoxG args={[(w - winW) / 2 - 0.3, top, 2]} />
          <Flat color={color} />
        </mesh>
      ))}
      <mesh position={[0, 0.06, -1]} receiveShadow>
        <BoxG args={[winW, 0.12, 2]} />
        <Flat color="#3A3030" />
      </mesh>
      {/* interior glow + mannequin-ish shapes */}
      <mesh position={[0, 0.9 + winH / 2, -1.95]}>
        <planeGeometry args={[winW, winH + 1]} />
        <meshBasicMaterial color={lit ? "#F4E2B0" : "#30384A"} toneMapped={false} />
      </mesh>
      {lit ? <pointLight position={[0, 3, -0.6]} color="#FFE2A0" intensity={14} distance={9} decay={2} /> : null}
      {[-1.6, 0, 1.6].map((x, i) => (
        <mesh key={i} position={[x, 2.4, -1.6]}>
          <BoxG args={[0.7, 2.6, 0.3]} />
          <Flat color={[P.carRed, "#5A4A78", P.carTeal][i]} />
        </mesh>
      ))}
      {/* frame */}
      <mesh position={[0, 0.45, 0.05]}>
        <BoxG args={[winW + 0.6, 0.9, 0.5]} />
        <Flat color="#2A2A30" />
      </mesh>
      <mesh position={[0, 0.9 + winH + 0.2, 0.05]}>
        <BoxG args={[winW + 0.6, 0.4, 0.5]} />
        <Flat color="#2A2A30" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (winW / 2 + 0.15), 0.9 + winH / 2, 0.05]}>
          <BoxG args={[0.3, winH, 0.5]} />
          <Flat color="#2A2A30" />
        </mesh>
      ))}
      {/* glass (whole until smash) */}
      {smash < 0 ? (
        <mesh position={[0, 0.9 + winH / 2, 0.12]} renderOrder={3}>
          <boxGeometry args={[winW, winH, 0.05]} />
          <meshLambertMaterial color="#CFEFFF" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ) : null}
      <instancedMesh ref={ref} args={[undefined, undefined, shards.length]} frustumCulled={false}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshLambertMaterial color="#DFF4FF" transparent opacity={0.75} flatShading />
      </instancedMesh>
      <CanvasPanel position={[0, 0.9 + winH + 1.3, 0.06]} w={winW * 0.9} h={1.3} px={768} draw={drawShopSign(sign, signBg, "#FFE7B0")} />
    </group>
  );
};

// ================================================================ barricade + police

/** A sandbag wall along X (centre at position), height ~1.6, plus a few planks. */
export const Sandbags: React.FC<{ position: V3; length: number; seed?: string }> = ({ position, length, seed = "sand" }) => {
  const n = Math.floor(length / 1.3);
  return (
    <group position={position}>
      {[0, 1, 2].map((row) =>
        Array.from({ length: n - (row % 2) }, (_, i) => (
          <mesh key={`${row}:${i}`} position={[-length / 2 + 0.65 + i * 1.3 + (row % 2) * 0.65, 0.3 + row * 0.5, (random(`${seed}${row}${i}`) - 0.5) * 0.1]} scale={[0.7, 0.3, 0.45]} castShadow receiveShadow>
            <IcoG args={[1, 1]} />
            <Flat color={random(`${seed}c${row}${i}`) > 0.5 ? "#B8A47A" : "#A8946A"} />
          </mesh>
        )),
      )}
    </group>
  );
};

/** A riot shield held at the hand (facing +Z of the holder), clear with a dark frame. */
export const RiotShield: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh renderOrder={3}>
      <boxGeometry args={[1.5, 2.4, 0.06]} />
      <meshLambertMaterial color="#BFD8EE" transparent opacity={0.45} depthWrite={false} />
    </mesh>
    <mesh position={[0, 0.95, 0.03]}>
      <boxGeometry args={[1.2, 0.18, 0.02]} />
      <meshBasicMaterial color="#1A1A22" />
    </mesh>
  </group>
);

/** A cooking pot worn as a helmet on Slavoski's head (head centre at `head`). */
export const PotHelmet: React.FC<{ head: V3; tilt?: number }> = ({ head, tilt = 0.1 }) => (
  <group position={[head[0], head[1] + 0.5, head[2]]} rotation={[0, 0, tilt]}>
    <mesh castShadow>
      <CylG args={[0.74, 0.7, 0.6, 12]} />
      <Flat color="#9AA1B0" />
    </mesh>
    <mesh position={[0.95, 0.05, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <CylG args={[0.06, 0.06, 0.6, 5]} />
      <Flat color="#2A2A30" />
    </mesh>
  </group>
);

/** A frying pan held at the hand: handle along local -Y from the grip, pan disc at the end. */
export const FryingPan: React.FC<{ hand: V3; rotation?: V3 }> = ({ hand, rotation = [0, 0, 0] }) => (
  <group position={hand} rotation={rotation}>
    <mesh position={[0, 0.5, 0]} castShadow>
      <CylG args={[0.06, 0.06, 0.9, 5]} />
      <Flat color="#2A2A30" />
    </mesh>
    <mesh position={[0, 1.45, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <CylG args={[0.62, 0.55, 0.14, 12]} />
      <Flat color="#3A3E48" />
    </mesh>
  </group>
);
