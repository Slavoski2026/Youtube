/**
 * Town pieces at hero scale (Slavoski 4.2 tall; kit buildings ×3.5): storefronts, the apartment entrance,
 * a café interior, hospital, police station, a suburb, traffic lights, a rooftop, a museum hall, a library,
 * a petrol station, a mansion with a pool. Signs that anything can pass in front of are CanvasPanels.
 */
import React, { useMemo } from "react";
import { random } from "remotion";
import { Building, BUILDING_COLORS, Car, Lamp } from "../../../slavoski/city";
import { BoxG, CylG, IcoG, ConeG } from "../../../slavoski/detail";
import { Flat, Glow, Halo } from "../../../slavoski/materials";
import { Bush, GrassTufts, LeafyTree } from "../../../slavoski/nature";
import type { V3 } from "../../../slavoski/noise";
import { P } from "../../../slavoski/palette";
import { CanvasPanel, fitText, CANVAS_FONT } from "../../../slavoski/screens";
import { House } from "../../no-work-2036/props";
import { drawLabel } from "../../ww3-countdown/props";

export const S = 3.5;

/** A sign drawn in the house font: text centred on a coloured panel. */
export const sign = (text: string, bg: string, color = "#FFFFFF", size = 0.62) => drawLabel(text, bg, color, size);

/** Glass pane. */
export const Glass: React.FC<{ position: V3; w: number; h: number; rotation?: V3; opacity?: number; tint?: string }> = ({ position, w, h, rotation = [0, 0, 0], opacity = 0.28, tint = "#BFD8F0" }) => (
  <mesh position={position} rotation={rotation}>
    <planeGeometry args={[w, h]} />
    <meshLambertMaterial color={tint} transparent opacity={opacity} depthWrite={false} />
  </mesh>
);

/** A kit building at hero scale (×3.5). Position in world units. */
export const BigBuilding: React.FC<React.ComponentProps<typeof Building>> = ({ position, ...props }) => (
  <group position={position} scale={S}>
    <Building position={[0, 0, 0]} {...props} />
  </group>
);

// ================================================================ storefronts

/**
 * A storefront in a facade plane at z = 0 facing +Z: big lit window with shelves behind it, a door
 * (opened by `door` 0..1, swinging in), an awning and a sign. Width `w`, ground-floor height 9.
 */
export const ShopFront: React.FC<{
  position: V3;
  yaw?: number;
  w?: number;
  color?: string;
  awning?: string;
  name: string;
  open?: boolean;
  door?: number;
  lit?: number;
  /** Sliding doors (supermarket entrance) instead of a hinged door: 0..1 open. */
  sliding?: number;
  seed?: string;
  /** Wall above the shop (storeys of the building). */
  upper?: number;
}> = ({ position, yaw = 0, w = 18, color = "#5A4A78", awning = "#C8372D", name, open = true, door = 0.35, lit = 1, sliding, seed = "shop", upper = 18 }) => {
  const H = 9;
  const winW = w - 7;
  const items = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        x: -w / 2 + 1.2 + (i % 12) * ((winW - 1) / 12),
        y: 1.6 + Math.floor(i / 12) * 1.7,
        h: 0.5 + random(`${seed}h${i}`) * 0.6,
        c: ["#C8372D", "#E0B04E", "#24748F", "#2F7A5A", "#F2EEE6", "#E8862A"][Math.floor(random(`${seed}c${i}`) * 6)],
      })),
    [w, winW, seed],
  );
  const doorX = w / 2 - 3.2;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {/* facade: piers around the window and door, lintel, upper wall */}
      <mesh position={[-w / 2 + 0.4, H / 2, -0.4]} castShadow receiveShadow>
        <BoxG args={[0.8, H, 0.8]} />
        <Flat color={color} />
      </mesh>
      <mesh position={[w / 2 - 6.2 + 0.4, H / 2, -0.4]} castShadow receiveShadow>
        <BoxG args={[0.8, H, 0.8]} />
        <Flat color={color} />
      </mesh>
      <mesh position={[w / 2 - 0.4, H / 2, -0.4]} castShadow receiveShadow>
        <BoxG args={[0.8, H, 0.8]} />
        <Flat color={color} />
      </mesh>
      <mesh position={[0, H + upper / 2, -0.4]} castShadow receiveShadow>
        <BoxG args={[w, upper, 0.8]} />
        <Flat color={color} />
      </mesh>
      <mesh position={[0, 7.6 + 0.7, -0.4]} castShadow>
        <BoxG args={[w, 1.4, 0.9]} />
        <Flat color={color} />
      </mesh>
      {/* upper windows */}
      {Array.from({ length: Math.floor(upper / 5) }, (_, r) =>
        Array.from({ length: Math.floor(w / 4) }, (_, cIdx) => (
          <mesh key={`${r}:${cIdx}`} position={[-w / 2 + 2.2 + cIdx * 4, H + 2.6 + r * 5, 0.02]}>
            <planeGeometry args={[1.6, 2.4]} />
            {random(`${seed}uw${r}${cIdx}`) < 0.3 * lit ? <Glow color={P.windowLit} /> : <Flat color="#41557A" />}
          </mesh>
        )),
      )}
      {/* interior box behind the window */}
      <mesh position={[-3.1 - (w - 18) / 2 + (w - 18) / 2, H / 2 - 0.4, -5]}>
        <BoxG args={[w - 1, H - 1, 0.2]} />
        {lit > 0.2 ? <Glow color="#F4E6C4" /> : <Flat color="#2A2C34" />}
      </mesh>
      <mesh position={[0, 0.02, -2.7]} receiveShadow>
        <BoxG args={[w - 1, 0.05, 5]} />
        <Flat color="#C8C0B0" />
      </mesh>
      {[1.0, 2.7, 4.4].map((y) => (
        <mesh key={y} position={[-3.1, y, -3.8]} castShadow>
          <BoxG args={[winW - 0.5, 0.12, 1.2]} />
          <Flat color="#B8B0A0" />
        </mesh>
      ))}
      {items.map((it, i) => (
        <mesh key={i} position={[it.x, it.y - 0.6 + it.h / 2, -3.8]}>
          <BoxG args={[0.55, it.h, 0.55]} />
          <Flat color={it.c} />
        </mesh>
      ))}
      {/* window glass */}
      <Glass position={[-3.1, 4.0, 0.05]} w={winW} h={7.2} opacity={0.18} />
      {/* door */}
      {sliding !== undefined ? (
        [-1, 1].map((s) => (
          <Glass key={s} position={[doorX + s * (1.2 + sliding * 2.0), 3.4, 0.08 + (s > 0 ? 0.05 : 0)]} w={2.4} h={6.6} opacity={0.3} />
        ))
      ) : (
        <group position={[doorX - 1.3, 0, 0]} rotation={[0, -door * 1.3, 0]}>
          <mesh position={[1.3, 3.4, 0]} castShadow>
            <BoxG args={[2.6, 6.8, 0.12]} />
            <meshLambertMaterial color="#BFD8F0" transparent opacity={0.35} />
          </mesh>
          <mesh position={[2.3, 3.4, 0.12]}>
            <BoxG args={[0.1, 0.9, 0.1]} />
            <Flat color="#C8CCD4" />
          </mesh>
        </group>
      )}
      {/* awning */}
      <mesh position={[-3.1, 7.4, 1.6]} rotation={[0.45, 0, 0]} castShadow>
        <BoxG args={[winW + 0.6, 0.12, 3.6]} />
        <Flat color={awning} />
      </mesh>
      {/* name sign above the awning */}
      <CanvasPanel position={[-3.1, 8.6, 0.12]} w={winW - 1} h={1.1} draw={sign(name, "#1A1E2C", "#F6EBC4", 0.66)} />
      {/* OPEN sign in the window */}
      {open ? <CanvasPanel position={[2.0 - (w - 18) / 2, 5.6, 0.0]} w={2.6} h={1.0} draw={sign("OPEN", "#14303A", "#7CFFB0", 0.7)} /> : null}
      {lit > 0.2 ? <pointLight position={[-3, 5, 2]} color="#FFE8C0" intensity={30 * lit} distance={20} decay={2} /> : null}
    </group>
  );
};

/** The front entrance of Slavoski's apartment building: glass double door, steps, canopy. Facade at z = 0. */
export const ApartmentEntrance: React.FC<{ open?: number; lit?: boolean }> = ({ open = 0, lit = true }) => (
  <group>
    {/* facade band */}
    <mesh position={[0, 6, -0.6]} castShadow receiveShadow>
      <BoxG args={[34, 12, 1.2]} />
      <Flat color="#566270" />
    </mesh>
    {/* door recess */}
    <mesh position={[0, 3.6, -1.2]}>
      <BoxG args={[6.4, 7.2, 0.2]} />
      {lit ? <Glow color="#E8D6B0" /> : <Flat color="#2A2E38" />}
    </mesh>
    {[-1, 1].map((s) => (
      <group key={s} position={[s * 3.0, 0.8, 0.05]} rotation={[0, s * open * 1.4, 0]}>
        <mesh position={[-s * 1.45, 3.1, 0]} castShadow>
          <BoxG args={[2.9, 6.2, 0.1]} />
          <meshLambertMaterial color="#9CC0E0" transparent opacity={0.45} />
        </mesh>
        <mesh position={[-s * 2.6, 3.1, 0.12]}>
          <BoxG args={[0.12, 1.4, 0.12]} />
          <Flat color="#C8CCD4" />
        </mesh>
      </group>
    ))}
    {/* steps */}
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[0, 0.13 + i * 0.26, 2.2 - i * 0.9]} castShadow receiveShadow>
        <BoxG args={[9, 0.26, 1.0 + (2 - i) * 0.9]} />
        <Flat color="#B8B4AA" />
      </mesh>
    ))}
    {/* canopy */}
    <mesh position={[0, 8.2, 1.6]} castShadow>
      <BoxG args={[10, 0.4, 4.4]} />
      <Flat color="#1D274B" />
    </mesh>
    <CanvasPanel position={[0, 8.2, 3.82]} w={8} h={0.34} draw={sign("No. 14", "#1D274B", "#F6EBC4", 0.7)} />
    {[-4.6, 4.6].map((x) => (
      <Lamp key={x} position={[x, 0, 1.4]} height={6.5} on={false} />
    ))}
  </group>
);

/** A café interior seen from inside: tables with abandoned cups, a laptop, the street through the window. */
export const Cafe: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[30, 0.1, 22]} />
      <Flat color="#7A5A44" />
    </mesh>
    <mesh position={[0, 5, -8]} receiveShadow>
      <BoxG args={[30, 10, 0.3]} />
      <Flat color="#3E5A6A" />
    </mesh>
    {[-15, 15].map((x) => (
      <mesh key={x} position={[x, 5, 1.5]} receiveShadow>
        <BoxG args={[0.3, 10, 19]} />
        <Flat color="#46606E" />
      </mesh>
    ))}
    <mesh position={[0, 10, 1.5]}>
      <BoxG args={[30.4, 0.3, 19.4]} />
      <Flat color="#5A4A44" />
    </mesh>
    {[-6, 6].map((x) => (
      <mesh key={x} position={[x, 8.8, 0]}>
        <CylG args={[0.7, 0.5, 0.6, 10]} />
        <Glow color="#FFE2B0" />
      </mesh>
    ))}
    {/* counter */}
    <mesh position={[-6, 1.9, -5.5]} castShadow receiveShadow>
      <BoxG args={[12, 3.8, 2.4]} />
      <Flat color="#5A402C" />
    </mesh>
    <mesh position={[-6, 3.85, -5.5]} castShadow>
      <BoxG args={[12.4, 0.14, 2.6]} />
      <Flat color="#E6E0D4" />
    </mesh>
    <mesh position={[-9, 4.6, -5.7]} castShadow>
      <BoxG args={[1.6, 1.4, 1.2]} />
      <Flat color="#C8CCD4" />
    </mesh>
    <CanvasPanel position={[-6, 7.6, -7.8]} w={9} h={2.4} draw={menuBoard} />
    {/* tables */}
    {[
      [2, 0, -2],
      [7, 0, 2.5],
      [-1, 0, 4.5],
    ].map(([x, y, z], i) => (
      <group key={i} position={[x, y, z]}>
        <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
          <CylG args={[1.5, 1.5, 0.12, 14]} />
          <Flat color="#E8E2D4" />
        </mesh>
        <mesh position={[0, 1.25, 0]} castShadow>
          <CylG args={[0.12, 0.3, 2.5, 8]} />
          <Flat color="#2A2A30" />
        </mesh>
        {[0, 1].map((k) => (
          <mesh key={k} position={[(k ? 1 : -1) * 2.2, 1.6, 0.3]} castShadow>
            <BoxG args={[1.3, 0.14, 1.3]} />
            <Flat color="#3A2E28" />
          </mesh>
        ))}
        {/* cups */}
        <mesh position={[0.4, 2.78, 0.2]} castShadow>
          <CylG args={[0.2, 0.16, 0.4, 10]} />
          <Flat color="#F2EEE6" />
        </mesh>
        {i === 1 ? (
          <mesh position={[-0.5, 2.6, -0.1]} rotation={[0, 0.4, 0]} castShadow>
            <BoxG args={[1.0, 0.04, 0.7]} />
            <Flat color="#F2EEE6" />
          </mesh>
        ) : null}
      </group>
    ))}
    {/* front window with the bright street */}
    <mesh position={[0, 5, 11]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[30, 10]} />
      <Glow color="#DDEBFF" />
    </mesh>
    <pointLight position={[0, 8, 3]} color="#FFE6C0" intensity={30} distance={26} decay={2} />
    {/* dust motes in the light */}
    {Array.from({ length: 24 }, (_, i) => (
      <mesh key={i} position={[(random(`m${i}`) - 0.5) * 16, 2 + random(`my${i}`) * 6 + Math.sin(t * 0.5 + i) * 0.2, (random(`mz${i}`) - 0.5) * 10]}>
        <IcoG args={[0.03, 0]} />
        <Glow color="#FFF2D0" opacity={0.6} />
      </mesh>
    ))}
  </group>
);

const menuBoard = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#1A1E1C";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#F6EBC4";
  ctx.font = CANVAS_FONT(H * 0.16);
  ctx.textAlign = "left";
  ["COFFEE", "TEA", "CAKE", "SOUP OF THE DAY"].forEach((s, i) => ctx.fillText(s, W * 0.06, H * (0.24 + i * 0.2)));
  ctx.textAlign = "right";
  ["2.50", "2.00", "3.20", "4.80"].forEach((s, i) => ctx.fillText(s, W * 0.94, H * (0.24 + i * 0.2)));
};

// ================================================================ civic buildings

/** Hospital front: a long white block, blue H sign, entrance canopy, ambulance bay. Facade at z = 0. */
export const Hospital: React.FC<{ lit?: number }> = ({ lit = 1 }) => (
  <group>
    <BigBuilding position={[0, 0, -14]} w={18} d={7} h={7} color="#D8D8D4" seed="hosp" litRatio={0.5} power={lit} />
    <mesh position={[0, 4, 0.2]} castShadow>
      <BoxG args={[16, 0.5, 6]} />
      <Flat color="#F2F2EE" />
    </mesh>
    {[-7, 7].map((x) => (
      <mesh key={x} position={[x, 2, 2.8]} castShadow>
        <BoxG args={[0.4, 4, 0.4]} />
        <Flat color="#D8D8D4" />
      </mesh>
    ))}
    <CanvasPanel position={[0, 4.6, 3.25]} w={10} h={1.2} draw={sign("HOSPITAL", "#2A62B8", "#FFFFFF", 0.62)} />
    <CanvasPanel position={[0, 22, -1.6]} w={6} h={6} draw={drawH} />
    {[-1, 1].map((s) => (
      <Glass key={s} position={[s * 2.4, 3.2, -1.6]} w={3.6} h={6} opacity={0.35} />
    ))}
  </group>
);

const drawH = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#2A62B8";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(W * 0.25, H * 0.2, W * 0.14, H * 0.6);
  ctx.fillRect(W * 0.61, H * 0.2, W * 0.14, H * 0.6);
  ctx.fillRect(W * 0.25, H * 0.43, W * 0.5, H * 0.14);
};

/** Police station: slate block with a POLICE sign, blue lamp, a parked police car. Facade at z = 0. */
export const PoliceStation: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <BigBuilding position={[0, 0, -9]} w={12} d={5} h={5} color="#566270" seed="pol" litRatio={0.4} />
    <CanvasPanel position={[0, 9.5, 0.08]} w={12} h={1.8} draw={sign("POLICE", "#1D274B", "#FFFFFF", 0.66)} />
    <mesh position={[0, 7.4, 0.5]}>
      <BoxG args={[0.9, 1.0, 0.9]} />
      <Glow color="#4A8AFF" />
    </mesh>
    <Halo position={[0, 7.4, 1]} size={3} color="#4A8AFF" opacity={0.4} />
    <mesh position={[0, 3.2, -0.2]}>
      <BoxG args={[5, 6.4, 0.2]} />
      <Flat color="#2A2E38" />
    </mesh>
    <group position={[-9, 0, 9]} scale={S}>
      <Car position={[0, 0, 0]} yaw={Math.PI / 2} police color="#1D274B" t={t} lights={false} />
    </group>
  </group>
);

// ================================================================ suburb

/**
 * A suburban street along Z (road |x| < 7), houses both sides set back on lawns with fences, trees and
 * parked cars. `growth` 0..1 is how overgrown lawns and verges are; `power` 0..1 lit windows.
 */
export const Suburb: React.FC<{
  seed?: string;
  length?: number;
  growth?: number;
  power?: number;
  lit?: boolean;
  cars?: boolean;
  trees?: boolean;
  lamps?: boolean;
  lampsOn?: boolean;
  decay?: number;
}> = ({ seed = "sub", length = 260, growth = 0.05, lit = false, cars = true, trees = true, lamps = true, lampsOn = false, decay = 0 }) => {
  const lots = useMemo(() => {
    const out: { x: number; z: number; side: number; color: string; roof: string; i: number }[] = [];
    for (const side of [-1, 1])
      for (let i = 0; i < Math.floor(length / 24); i++)
        out.push({
          x: side * 26,
          z: 20 - i * 24 - (side > 0 ? 8 : 0),
          side,
          i,
          color: ["#E8DCC4", "#C9D6DF", "#E2C9B0", "#D6E2C8", "#E8D0D0", "#CFC6E0"][Math.floor(random(`${seed}c${side}${i}`) * 6)],
          roof: ["#C8372D", "#5A4A78", "#3E5A6A", "#7A4A3A", "#2A3A5A"][Math.floor(random(`${seed}r${side}${i}`) * 5)],
        });
    return out;
  }, [seed, length]);
  const grass = mixGreen(growth);
  return (
    <group>
      {/* ground: lawns */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -length / 2 + 20]} receiveShadow>
        <planeGeometry args={[600, length + 400]} />
        <Flat color={grass} />
      </mesh>
      {/* road and pavements */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -length / 2 + 20]} receiveShadow>
        <planeGeometry args={[14, length + 400]} />
        <Flat color={P.road} />
      </mesh>
      {Array.from({ length: Math.floor((length + 200) / 9) }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 60 - i * 9]}>
          <planeGeometry args={[0.35, 3.6]} />
          <Flat color={P.laneMark} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 9.2, 0.12, -length / 2 + 20]} receiveShadow>
          <BoxG args={[4.4, 0.24, length + 400]} />
          <Flat color={P.pavement} />
        </mesh>
      ))}
      {lots.map((l) => (
        <group key={`${l.side}${l.i}`}>
          <House position={[l.x, 0, l.z]} yaw={l.side > 0 ? -Math.PI / 2 : Math.PI / 2} color={l.color} roof={l.roof} lit={lit && random(`${seed}l${l.side}${l.i}`) < 0.6} scale={1.45} />
          {/* front door and path */}
          <mesh position={[l.x - l.side * 5.15, 2.6, l.z]} rotation={[0, l.side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
            <planeGeometry args={[2.4, 5.2]} />
            <Flat color="#5A3A2A" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(l.x + l.side * 11.4) / 2 - l.side * 3, 0.02, l.z]}>
            <planeGeometry args={[Math.abs(l.x) - 16, 2.2]} />
            <Flat color="#B8B4AA" />
          </mesh>
          {/* picket fence along the pavement */}
          {[-1, 1].map((k) => (
            <mesh key={k} position={[l.side * 11.8, 0.9, l.z + k * 6.8]} castShadow>
              <BoxG args={[0.2, 1.8, 9]} />
              <Flat color={decay > 0.3 ? "#B8B0A0" : "#F2EEE6"} />
            </mesh>
          ))}
          {trees && random(`${seed}t${l.side}${l.i}`) < 0.7 ? (
            <LeafyTree position={[l.side * 15.5, 0, l.z + 8]} scale={2.4 + random(`${seed}ts${l.side}${l.i}`) * 0.8} seed={`${seed}tr${l.side}${l.i}`} />
          ) : null}
          {cars && random(`${seed}car${l.side}${l.i}`) < 0.45 ? (
            <group position={[l.side * 16.5, 0, l.z - 7]} scale={S}>
              <Car position={[0, 0, 0]} yaw={random(`${seed}cy${l.side}${l.i}`) < 0.5 ? 0 : Math.PI} color={BUILDING_COLORS[Math.floor(random(`${seed}cc${l.i}`) * 3)] ?? P.carRed} lights={false} rust={decay * 0.6} moss={decay > 0.4 ? decay - 0.3 : 0} />
            </group>
          ) : null}
          {growth > 0.02 ? <GrassTufts area={[l.side * 12, l.side * 20, l.z - 10, l.z + 10].sort((a, b) => a - b) as [number, number, number, number]} count={18} growth={growth} height={1.4} seed={`${seed}g${l.side}${l.i}`} /> : null}
          {growth > 0.2 ? <Bush position={[l.side * 19, 0, l.z + 6]} size={1.5 + growth * 2} growth={growth} seed={`${seed}b${l.i}${l.side}`} /> : null}
        </group>
      ))}
      {lamps
        ? Array.from({ length: Math.floor(length / 30) }, (_, i) => <Lamp key={i} position={[(i % 2 ? 1 : -1) * 8.2, 0.24, 10 - i * 30]} height={14} on={lampsOn} />)
        : null}
    </group>
  );
};

const mixGreen = (growth: number) => {
  const a = [0x4E, 0x8A, 0x4A];
  const b = [0x5E, 0x7A, 0x3A];
  const k = Math.min(1, growth);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(",")})`;
};

// ================================================================ street furniture

/** A traffic light (hero scale, ~11 tall) that cycles green → amber → red with t. Faces +Z. */
export const TrafficLight: React.FC<{ position: V3; yaw?: number; t: number; phase?: number; on?: boolean; flashAmber?: boolean }> = ({ position, yaw = 0, t, phase = 0, on = true, flashAmber = false }) => {
  const cyc = (t + phase) % 10;
  const state = !on ? -1 : flashAmber ? (Math.floor(t * 2) % 2 ? 1 : -1) : cyc < 4.5 ? 2 : cyc < 5.5 ? 1 : 0;
  const cols = ["#FF3A2E", "#FFB02E", "#3AE07A"];
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, 5, 0]} castShadow>
        <CylG args={[0.22, 0.28, 10, 8]} />
        <Flat color="#2A2E38" />
      </mesh>
      <mesh position={[0, 9.4, 0.4]} castShadow>
        <BoxG args={[1.3, 3.6, 0.9]} />
        <Flat color="#1A1C22" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, 10.5 - i * 1.1, 0.87]}>
          <mesh>
            <circleGeometry args={[0.38, 12]} />
            {state === i ? <Glow color={cols[i]} /> : <Flat color="#2E3038" />}
          </mesh>
          {state === i ? <Halo position={[0, 0, 0.2]} size={3.2} color={cols[i]} opacity={0.55} /> : null}
        </group>
      ))}
    </group>
  );
};

/** A flat roof with a parapet, water tank and vents; the roof top is at y = 0 (place it at the building height). */
export const Rooftop: React.FC<{ w?: number; d?: number }> = ({ w = 40, d = 30 }) => (
  <group>
    <mesh position={[0, -0.5, 0]} receiveShadow>
      <BoxG args={[w, 1, d]} />
      <Flat color="#5A5E68" />
    </mesh>
    {[
      [0, d / 2, w, 0.4],
      [0, -d / 2, w, 0.4],
    ].map(([x, z, ww, dd], i) => (
      <mesh key={i} position={[x, 1.1, z]} castShadow>
        <BoxG args={[ww, 2.2, dd]} />
        <Flat color="#6A6E78" />
      </mesh>
    ))}
    {[-1, 1].map((s) => (
      <mesh key={s} position={[(s * w) / 2, 1.1, 0]} castShadow>
        <BoxG args={[0.4, 2.2, d]} />
        <Flat color="#6A6E78" />
      </mesh>
    ))}
    <group position={[-w / 2 + 7, 0, -d / 2 + 6]}>
      <mesh position={[0, 6.5, 0]} castShadow>
        <CylG args={[2.6, 2.6, 5, 10]} />
        <Flat color="#7A5A44" />
      </mesh>
      <mesh position={[0, 9.6, 0]} castShadow>
        <ConeG args={[2.8, 1.4, 10]} />
        <Flat color="#5A402C" />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 1.7, 2, sz * 1.7]} castShadow>
            <BoxG args={[0.25, 4, 0.25]} />
            <Flat color="#3A3A40" />
          </mesh>
        )),
      )}
    </group>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[6 + i * 4, 0.9, -d / 2 + 4]} castShadow>
        <BoxG args={[2.6, 1.8, 2.2]} />
        <Flat color="#9AA1B0" />
      </mesh>
    ))}
  </group>
);

/** A drifting plastic bag (crumpled, light). */
export const PlasticBag: React.FC<{ position: V3; t: number }> = ({ position, t }) => (
  <mesh position={[position[0], position[1] + Math.abs(Math.sin(t * 2.3)) * 0.8, position[2]]} rotation={[t * 1.3, t * 2.1, t * 0.7]} scale={[1, 0.7, 1.2]}>
    <IcoG args={[0.5, 1]} />
    <meshLambertMaterial color="#F2F0EA" transparent opacity={0.85} flatShading />
  </mesh>
);

export { fitText };
