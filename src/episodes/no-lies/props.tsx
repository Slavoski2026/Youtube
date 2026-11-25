/**
 * Sets and props for "What If Humans Couldn't Lie?" (ep. 8).
 * Generic world: no real people, parties, flags, brands or logos. Non-graphic: the "affair" is two
 * people caught in a spotlight at a motel door. Everything rests on y = 0 using its real extents and
 * follows the kit detail level. Toy scale: Slavoski is 4.2 tall, chair seats 0.7, table tops 1.45.
 */
import React from "react";
import { random } from "remotion";
import * as THREE from "three";
import { Building } from "../../slavoski/city";
import { BoxG, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { FONT } from "../../slavoski/fonts";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { clamp01, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { CANVAS_FONT, CanvasPanel, fitText } from "../../slavoski/screens";
import { project, type CameraSpec } from "../../slavoski/Stage";

// ================================================================ speech bubbles

/**
 * A comic speech bubble pinned to a 3D point (its tail tip). With `lie`, the lie shows first, a red
 * strike crosses it as `swap` goes 0 → 0.5, then the truth replaces it. `dots` draws a silent "…".
 */
export const TruthBubble: React.FC<{
  at: V3;
  cam: CameraSpec;
  width: number;
  height: number;
  truth: string;
  lie?: string;
  swap?: number;
  appear?: number;
  offset?: [number, number];
  size?: number;
  /** Colour of the truth text (ink by default). */
  tone?: string;
}> = ({ at, cam, width, height, truth, lie, swap = 1, appear = 1, offset = [0, -140], size = 42, tone = "#14121C" }) => {
  const k = clamp01(appear);
  if (k <= 0) return null;
  const p = project(at, cam, width, height);
  const pop = 0.6 + 0.4 * (1 - Math.pow(1 - k, 3));
  // keep the bubble inside the 780 px centre column
  const bx = Math.max(330, Math.min(width - 330, p.x + offset[0]));
  const by = p.y + offset[1];
  const showLie = !!lie && swap < 0.55;
  const strike = clamp01(swap / 0.45);
  const jolt = lie && swap > 0.5 && swap < 0.62 ? Math.sin(swap * 160) * 6 : 0;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width, height, pointerEvents: "none", opacity: Math.min(1, k * 2) }}>
      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        <polygon points={`${p.x},${p.y} ${bx - 22},${by} ${bx + 22},${by}`} fill="#F6EBC4" stroke="#14121C" strokeWidth={5} strokeLinejoin="round" />
      </svg>
      <div
        style={{
          position: "absolute",
          left: bx + jolt,
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
          color: showLie ? "#14121C" : tone,
          whiteSpace: "pre",
          textAlign: "center",
          lineHeight: 1.12,
          boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
          maxWidth: 700,
        }}
      >
        <span style={{ position: "relative", display: "inline-block" }}>
          {showLie ? lie : truth}
          {showLie && swap > 0 ? (
            <span style={{ position: "absolute", left: -6, top: "48%", height: 7, width: `calc(${strike * 100}% + 12px)`, background: "#D8352A", borderRadius: 4 }} />
          ) : null}
        </span>
      </div>
    </div>
  );
};

/** Mouth flapping while someone speaks: 0..1, seeded so every frame is identical on re-render. */
export const chatter = (t: number, seed = 1) => 0.5 + 0.5 * Math.sin(t * 17 + seed * 2.1) * Math.sin(t * 6.3 + seed);

// ================================================================ light and signs

/** A searchlight beam from `from` down to `to`: an additive cone plus a bright pool where it lands. */
export const Spotlight: React.FC<{ from: V3; to: V3; r?: number; on?: number; color?: string; pool?: boolean; strength?: number }> = ({ from, to, r = 2.2, on = 1, color = "#FFF4D6", pool = true, strength = 1 }) => {
  if (on <= 0) return null;
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const dir = b.clone().sub(a);
  const len = dir.length();
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize());
  return (
    <group>
      <mesh position={mid.toArray()} quaternion={q}>
        <cylinderGeometry args={[r * 0.12, r, len, 20, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.16 * on * strength} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {pool ? (
        <mesh position={[to[0], to[1] + 0.03, to[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[r * 1.02, 28]} />
          <meshBasicMaterial color={color} transparent opacity={0.34 * on} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ) : null}
      <pointLight position={[to[0], to[1] + 5, to[2] + 1.5]} color={color} intensity={60 * on} distance={14} decay={2} />
    </group>
  );
};

/** Canvas drawer: glowing neon words on a dark board. */
export const drawNeon = (text: string, color: string, size = 0.62, bg = "#120E1C") => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = H * 0.18;
  ctx.font = CANVAS_FONT(H * size);
  fitText(ctx, text, W / 2, H / 2 + H * 0.04, W * 0.88, H * size, color);
  ctx.shadowBlur = H * 0.06;
  fitText(ctx, text, W / 2, H / 2 + H * 0.04, W * 0.88, H * size, "#FFFFFF");
  ctx.restore();
};

/** A neon sign board on a dark box (face toward +Z), with a halo. */
export const NeonSign: React.FC<{ position: V3; w: number; h: number; text: string; color: string; yaw?: number; on?: number }> = ({ position, w, h, text, color, yaw = 0, on = 1 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0, -0.12]} castShadow>
      <BoxG args={[w + 0.2, h + 0.2, 0.2]} />
      <Flat color="#15161C" />
    </mesh>
    <CanvasPanel position={[0, 0, 0.005]} w={w} h={h} draw={on > 0.5 ? drawNeon(text, color) : drawNeon(text, "#3A3444", 0.62, "#120E1C")} />
    {on > 0.5 ? <Halo position={[0, 0, 0.3]} size={Math.max(w, h) * 1.6} color={color} opacity={0.35} /> : null}
  </group>
);

/** A neon heart (two lobes and a point), glowing. Faces +Z. */
export const NeonHeart: React.FC<{ position: V3; size?: number; color?: string; on?: number }> = ({ position, size = 1, color = "#FF5A9A", on = 1 }) => {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.9);
  shape.bezierCurveTo(-0.2, -0.6, -1.0, -0.2, -1.0, 0.25);
  shape.bezierCurveTo(-1.0, 0.75, -0.35, 0.95, 0, 0.5);
  shape.bezierCurveTo(0.35, 0.95, 1.0, 0.75, 1.0, 0.25);
  shape.bezierCurveTo(1.0, -0.2, 0.2, -0.6, 0, -0.9);
  return (
    <group position={position} scale={size}>
      <mesh>
        <shapeGeometry args={[shape, 10]} />
        <Glow color={on > 0.5 ? color : "#3A2A34"} />
      </mesh>
      {on > 0.5 ? <Halo position={[0, 0, 0.2]} size={4.2} color={color} opacity={0.4} /> : null}
    </group>
  );
};

/** A big billboard on two posts (board centre at `c`, facing +Z), its face drawn on a canvas. */
export const AdBoard: React.FC<{ c: V3; w: number; h: number; draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => void; yaw?: number; lit?: boolean }> = ({ c, w, h, draw, yaw = 0, lit = true }) => (
  <group position={c} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0, -0.25]} castShadow>
      <BoxG args={[w + 0.5, h + 0.5, 0.4]} />
      <Flat color="#22242E" />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * w * 0.3, -(c[1] + h / 2) / 2, -0.3]} castShadow>
        <BoxG args={[0.5, c[1] - h / 2 + 0.2, 0.5]} />
        <Flat color="#2B2F3E" />
      </mesh>
    ))}
    <CanvasPanel position={[0, 0, 0.0]} w={w} h={h} draw={draw} />
    {lit ? (
      <mesh position={[0, h / 2 + 0.25, 0.4]}>
        <BoxG args={[w * 0.9, 0.15, 0.3]} />
        <Glow color="#FFF2CC" />
      </mesh>
    ) : null}
  </group>
);

// ================================================================ the cold open

const MANILA = "#D8B878";
/** A manila folder with a red stamp (lies flat in its local XZ, ~0.9 × 1.2). */
export const Folder: React.FC<{ position: V3; rotation?: V3; scale?: number }> = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh castShadow>
      <boxGeometry args={[0.9, 0.05, 1.2]} />
      <Flat color={MANILA} />
    </mesh>
    <mesh position={[0, 0.03, 0.05]} rotation={[-Math.PI / 2, 0, 0.25]}>
      <planeGeometry args={[0.7, 0.2]} />
      <Glow color="#C8372D" />
    </mesh>
  </group>
);

/** Folders blown out of a window, tumbling down and away. `t` seconds since they burst. */
export const FolderBurst: React.FC<{ origin: V3; t: number; count?: number; seed?: string; spread?: number; scale?: number }> = ({ origin, t, count = 14, seed = "fold", spread = 1, scale = 1.6 }) => (
  <group>
    {Array.from({ length: count }, (_, i) => {
      const r = (k: string) => random(`${seed}${i}${k}`);
      const tt = Math.max(0, t - r("d") * 0.6);
      const vx = (r("x") - 0.5) * 7 * spread;
      const vz = 3 + r("z") * 5;
      const vy = 2.5 + r("y") * 3;
      const p: V3 = [origin[0] + vx * tt, origin[1] + vy * tt - 1.6 * tt * tt, origin[2] + vz * tt];
      if (tt <= 0) return null;
      return <Folder key={i} position={p} rotation={[tt * (2 + r("a") * 3), tt * (1 + r("b")), tt * (1.5 + r("c") * 2)]} scale={scale} />;
    })}
  </group>
);

/** The motel: a low facade with numbered doors, a neon MOTEL sign and a heart. Doors face +Z; door 0 is at x = 0. */
export const MOTEL = { doorW: 2.2, doorH: 4.6, h: 7, d: 8, front: 0 };
export const Motel: React.FC<{ position?: V3; doorOpen?: number }> = ({ position = [0, 0, 0], doorOpen = 1 }) => (
  <group position={position}>
    <mesh position={[0, MOTEL.h / 2, -MOTEL.d / 2]} castShadow receiveShadow>
      <BoxG args={[34, MOTEL.h, MOTEL.d]} />
      <Flat color="#7A5A6A" />
    </mesh>
    {[-12, -6, 0, 6, 12].map((x, i) => (
      <group key={x} position={[x, 0, 0.02]}>
        {/* door: open one shows a warm room */}
        <mesh position={[0, MOTEL.doorH / 2, 0]}>
          <planeGeometry args={[MOTEL.doorW, MOTEL.doorH]} />
          {x === 0 && doorOpen > 0 ? <Glow color="#E8A060" /> : <Flat color={i % 2 ? "#2E5A6A" : "#5A4A78"} />}
        </mesh>
        <CanvasPanel position={[0, MOTEL.doorH + 0.5, 0.01]} w={0.7} h={0.45} draw={(ctx, W, H) => {
          ctx.fillStyle = "#E6E0D4";
          ctx.fillRect(0, 0, W, H);
          ctx.font = CANVAS_FONT(H * 0.7);
          fitText(ctx, String(10 + i), W / 2, H / 2 + H * 0.05, W * 0.8, H * 0.7, "#2A2A30");
        }} />
        {/* window beside each door */}
        <mesh position={[3, 3.0, 0]}>
          <planeGeometry args={[2.2, 1.6]} />
          <Glow color={random(`mw${i}`) > 0.4 ? "#E0B04E" : "#3A3550"} />
        </mesh>
      </group>
    ))}
    <NeonSign position={[-0.8, MOTEL.h + 1.4, 0.4]} w={6} h={2} text="MOTEL" color="#FF5A9A" />
    <NeonHeart position={[3.6, MOTEL.h + 1.4, 0.4]} size={0.9} />
  </group>
);

// ================================================================ the apartment (dinner party, couch, kitchen)

export const APT = { backZ: -6, leftX: -10, rightX: 10, h: 7.5, win: { x: -3.6, y: 3.8, w: 5, h: 3.2 } };
export const TABLE = { x: 4, z: -0.8, w: 6, d: 2.4, top: 1.45 };
export const COUCH = { x: -3.6, z: -4.6, w: 5.2, seat: 0.7 };
export const FRIDGE = { x: 8.4, z: -5.2, w: 2.0, h: 4.6, d: 1.4 };

/** A dining chair (seat top at `seatY`), back on its -Z side. */
export const Chair: React.FC<{ position: V3; yaw?: number; seatY?: number; color?: string }> = ({ position, yaw = 0, seatY = 0.7, color = "#7A4A34" }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, seatY - 0.06, 0]} castShadow receiveShadow>
      <BoxG args={[0.95, 0.12, 0.95]} />
      <Flat color={color} />
    </mesh>
    <mesh position={[0, seatY + 0.7, -0.44]} castShadow>
      <BoxG args={[0.95, 1.4, 0.1]} />
      <Flat color={color} />
    </mesh>
    {[-1, 1].flatMap((sx) =>
      [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * 0.38, (seatY - 0.12) / 2, sz * 0.38]} castShadow>
          <BoxG args={[0.1, seatY - 0.12, 0.1]} />
          <Flat color="#4A2E22" />
        </mesh>
      )),
    )}
  </group>
);

/** A child's crayon drawing: Slavoski in his orange jacket, a kid, a house, a sun and a big heart. */
export const drawKidArt = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#FBF8F0";
  ctx.fillRect(0, 0, W, H);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const line = (pts: [number, number][], color: string, wpx: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = wpx;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * W, y * H) : ctx.moveTo(x * W, y * H)));
    ctx.stroke();
  };
  // sun with wobbly rays
  ctx.fillStyle = "#FFC83A";
  ctx.beginPath();
  ctx.arc(W * 0.84, H * 0.16, W * 0.08, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    line([[0.84 + Math.cos(a) * 0.1, 0.16 + Math.sin(a) * 0.13], [0.84 + Math.cos(a) * 0.15, 0.16 + Math.sin(a) * 0.2]], "#FFB020", W * 0.012);
  }
  // grass
  line([[0.02, 0.9], [0.2, 0.88], [0.45, 0.91], [0.7, 0.88], [0.98, 0.9]], "#3FA040", W * 0.03);
  // house
  line([[0.06, 0.88], [0.06, 0.55], [0.3, 0.55], [0.3, 0.88]], "#7A4A9A", W * 0.014);
  line([[0.03, 0.57], [0.18, 0.36], [0.33, 0.57]], "#C8372D", W * 0.016);
  // big figure (orange jacket, blue legs) and a small figure holding hands
  ctx.fillStyle = "#E8862A";
  ctx.fillRect(W * 0.43, H * 0.48, W * 0.14, H * 0.2);
  ctx.fillStyle = "#C58B62";
  ctx.beginPath();
  ctx.arc(W * 0.5, H * 0.38, W * 0.07, 0, Math.PI * 2);
  ctx.fill();
  line([[0.46, 0.68], [0.44, 0.86]], "#1F3558", W * 0.022);
  line([[0.54, 0.68], [0.56, 0.86]], "#1F3558", W * 0.022);
  line([[0.57, 0.52], [0.66, 0.64]], "#E8862A", W * 0.02);
  ctx.fillStyle = "#24748F";
  ctx.fillRect(W * 0.66, H * 0.6, W * 0.09, H * 0.13);
  ctx.fillStyle = "#E0AC84";
  ctx.beginPath();
  ctx.arc(W * 0.705, H * 0.54, W * 0.05, 0, Math.PI * 2);
  ctx.fill();
  line([[0.68, 0.73], [0.67, 0.86]], "#2A2A30", W * 0.016);
  line([[0.73, 0.73], [0.74, 0.86]], "#2A2A30", W * 0.016);
  // eyes and smiles
  ctx.fillStyle = "#14121C";
  [[0.48, 0.37], [0.52, 0.37], [0.69, 0.53], [0.72, 0.53]].forEach(([x, y]) => ctx.fillRect(W * x - W * 0.008, H * y - H * 0.012, W * 0.016, H * 0.024));
  line([[0.47, 0.41], [0.5, 0.43], [0.53, 0.41]], "#14121C", W * 0.008);
  // heart
  ctx.fillStyle = "#E83A5A";
  ctx.beginPath();
  const hx = W * 0.2;
  const hy = H * 0.2;
  const s = W * 0.06;
  ctx.moveTo(hx, hy + s * 1.1);
  ctx.bezierCurveTo(hx - s * 1.6, hy, hx - s * 0.9, hy - s * 1.1, hx, hy - s * 0.3);
  ctx.bezierCurveTo(hx + s * 0.9, hy - s * 1.1, hx + s * 1.6, hy, hx, hy + s * 1.1);
  ctx.fill();
};
export const DRAWING = { w: 1.5, h: 1.1 };

export const Apartment: React.FC<{ lamp?: number; warm?: boolean; snow?: boolean; t?: number; art?: boolean; table?: boolean }> = ({ lamp = 1, warm = false, snow = false, t = 0, art = false, table = true }) => {
  const wall = warm ? "#6A4A3E" : "#3A3550";
  const side = warm ? "#74523F" : "#433D5C";
  const { x: wx, y: wy, w: ww, h: wh } = APT.win;
  const x0 = wx - ww / 2;
  const x1 = wx + ww / 2;
  const y0 = wy - wh / 2;
  const y1 = wy + wh / 2;
  const W = APT.rightX - APT.leftX;
  const cx = (APT.rightX + APT.leftX) / 2;
  return (
    <group>
      <mesh position={[cx, -0.05, 2]} receiveShadow>
        <BoxG args={[W, 0.1, 18]} />
        <Flat color="#5A3E2E" />
      </mesh>
      <mesh position={[TABLE.x, 0.006, TABLE.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TABLE.w + 3, TABLE.d + 3]} />
        <Flat color={warm ? "#9A5A4A" : "#5A4A78"} />
      </mesh>
      {/* back wall around the window */}
      <mesh position={[(APT.leftX + x0) / 2, APT.h / 2, APT.backZ]} receiveShadow>
        <BoxG args={[x0 - APT.leftX, APT.h, 0.3]} />
        <Flat color={wall} />
      </mesh>
      <mesh position={[(APT.rightX + x1) / 2, APT.h / 2, APT.backZ]} receiveShadow>
        <BoxG args={[APT.rightX - x1, APT.h, 0.3]} />
        <Flat color={wall} />
      </mesh>
      <mesh position={[wx, y0 / 2, APT.backZ]} receiveShadow>
        <BoxG args={[ww, y0, 0.3]} />
        <Flat color={wall} />
      </mesh>
      <mesh position={[wx, (APT.h + y1) / 2, APT.backZ]} receiveShadow>
        <BoxG args={[ww, APT.h - y1, 0.3]} />
        <Flat color={wall} />
      </mesh>
      {/* window frame and cross bar */}
      {[
        [wx, y1 + 0.06, ww + 0.24, 0.14],
        [wx, y0 - 0.06, ww + 0.24, 0.14],
        [x0 - 0.06, wy, 0.14, wh + 0.24],
        [x1 + 0.06, wy, 0.14, wh + 0.24],
        [wx, wy, 0.1, wh],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, APT.backZ + 0.18]}>
          <BoxG args={[w, h, 0.12]} />
          <Flat color="#E6E0D4" />
        </mesh>
      ))}
      {/* side walls */}
      {[APT.leftX, APT.rightX].map((x) => (
        <mesh key={x} position={[x, APT.h / 2, 2]} receiveShadow>
          <BoxG args={[0.3, APT.h, 18]} />
          <Flat color={side} />
        </mesh>
      ))}
      {/* the view: the city across the street */}
      <mesh position={[wx, 1, APT.backZ - 30]}>
        <planeGeometry args={[120, 80]} />
        <Glow color={snow ? "#2A3048" : "#0E1430"} />
      </mesh>
      {[-14, -6, 2, 9].map((x, i) => (
        <Building key={x} position={[wx + x, -6, APT.backZ - 16 - (i % 2) * 6]} w={6} d={5} h={18 + (i % 3) * 5} color={[P.bldgNavy, P.bldgPurple, P.bldgTeal, P.bldgSlate][i]} seed={`apv${i}`} />
      ))}
      {snow
        ? Array.from({ length: 40 }, (_, i) => {
            const fx = random(`sn${i}x`);
            const fy = (((random(`sn${i}y`) - t * (0.12 + random(`sn${i}s`) * 0.1)) % 1) + 1) % 1;
            return (
              <mesh key={i} position={[x0 + 0.2 + fx * (ww - 0.4), y0 + 0.1 + fy * (wh - 0.2), APT.backZ - 0.6]}>
                <circleGeometry args={[0.04, 5]} />
                <Glow color="#F4F6FA" />
              </mesh>
            );
          })
        : null}
      {/* couch under the window */}
      <group position={[COUCH.x, 0, COUCH.z]}>
        <mesh position={[0, COUCH.seat / 2, 0.15]} castShadow receiveShadow>
          <BoxG args={[COUCH.w, COUCH.seat, 1.5]} />
          <Flat color="#2E5A6A" />
        </mesh>
        <mesh position={[0, 1.35, -0.6]} castShadow>
          <BoxG args={[COUCH.w, 1.5, 0.45]} />
          <Flat color="#2E5A6A" />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (COUCH.w / 2 + 0.2), 0.75, 0.05]} castShadow>
            <BoxG args={[0.45, 1.5, 1.7]} />
            <Flat color="#244A58" />
          </mesh>
        ))}
      </group>
      {/* dining table, plates and a candle (hidden for the kitchen scenes) */}
      {table ? (
        <>
      <mesh position={[TABLE.x, TABLE.top - 0.07, TABLE.z]} castShadow receiveShadow>
        <BoxG args={[TABLE.w, 0.14, TABLE.d]} />
        <Flat color="#8A5A3A" />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[TABLE.x + sx * (TABLE.w / 2 - 0.3), (TABLE.top - 0.14) / 2, TABLE.z + sz * (TABLE.d / 2 - 0.3)]} castShadow>
            <BoxG args={[0.18, TABLE.top - 0.14, 0.18]} />
            <Flat color="#5A3A28" />
          </mesh>
        )),
      )}
      {/* plates, glasses and a candle */}
      {[-2, 0, 2].map((dx) => (
        <React.Fragment key={dx}>
          <mesh position={[TABLE.x + dx, TABLE.top + 0.02, TABLE.z - 0.6]}>
            <CylG args={[0.42, 0.42, 0.04, 14]} />
            <Flat color="#F2EEE6" />
          </mesh>
          <mesh position={[TABLE.x + dx + 0.6, TABLE.top + 0.25, TABLE.z - 0.3]}>
            <CylG args={[0.1, 0.08, 0.5, 8]} />
            <Flat color="#C9E0EE" opacity={0.7} />
          </mesh>
        </React.Fragment>
      ))}
      <mesh position={[TABLE.x - 1, TABLE.top + 0.3, TABLE.z + 0.3]}>
        <CylG args={[0.07, 0.07, 0.6, 8]} />
        <Flat color="#F2EEE6" />
      </mesh>
      <mesh position={[TABLE.x - 1, TABLE.top + 0.66, TABLE.z + 0.3]}>
        <IcoG args={[0.07, 1]} />
        <Glow color={P.fireCore} />
      </mesh>
        </>
      ) : null}
      <mesh position={[TABLE.x, 6.4, TABLE.z]}>
        <CylG args={[0.03, 0.03, 2.2, 4]} />
        <Flat color={P.pole} />
      </mesh>
      <mesh position={[TABLE.x, 5.1, TABLE.z]}>
        <ConeG args={[0.9, 0.7, 10, 1, true]} />
        {lamp > 0 ? <Glow color={P.lampGlow} /> : <Flat color="#6A5A4A" />}
      </mesh>
      {lamp > 0 ? (
        <>
          <pointLight position={[TABLE.x, 4.6, TABLE.z]} color="#FFC890" intensity={45 * lamp} distance={18} decay={2} />
          <Halo position={[TABLE.x, 4.9, TABLE.z]} size={3.2} color="#FFD8A0" opacity={0.35 * lamp} />
        </>
      ) : null}
      {/* fridge with a heart magnet (and the drawing, when it's pinned up) */}
      <group position={[FRIDGE.x, 0, FRIDGE.z]}>
        <mesh position={[0, FRIDGE.h / 2, 0]} castShadow receiveShadow>
          <BoxG args={[FRIDGE.w, FRIDGE.h, FRIDGE.d]} />
          <Flat color="#E6E8EC" />
        </mesh>
        <mesh position={[0, 3.05, FRIDGE.d / 2 + 0.01]}>
          <boxGeometry args={[FRIDGE.w - 0.1, 0.04, 0.02]} />
          <Flat color="#9AA1B0" />
        </mesh>
        <mesh position={[-0.75, 2.4, FRIDGE.d / 2 + 0.05]}>
          <BoxG args={[0.08, 0.9, 0.08]} />
          <Flat color="#9AA1B0" />
        </mesh>
        {art ? (
          <>
            <CanvasPanel position={[0.1, 3.85, FRIDGE.d / 2 + 0.02]} w={DRAWING.w} h={DRAWING.h} draw={drawKidArt} />
            <NeonHeart position={[0.1, 4.42, FRIDGE.d / 2 + 0.05]} size={0.11} color="#E83A5A" />
          </>
        ) : null}
      </group>
      {/* kitchen counter beside the fridge */}
      <mesh position={[FRIDGE.x - 3.2, 0.9, FRIDGE.z + 0.1]} castShadow receiveShadow>
        <BoxG args={[4.2, 1.8, 1.2]} />
        <Flat color="#5A6478" />
      </mesh>
      <mesh position={[FRIDGE.x - 3.2, 1.85, FRIDGE.z + 0.1]} castShadow>
        <BoxG args={[4.4, 0.1, 1.3]} />
        <Flat color="#E6E0D4" />
      </mesh>
      {/* a plant and a framed picture */}
      <mesh position={[-8.6, 0.6, -4.8]} castShadow>
        <CylG args={[0.5, 0.4, 1.2, 8]} />
        <Flat color="#B8AE98" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-8.6 + (i - 1) * 0.3, 1.8 + i * 0.4, -4.8]} castShadow>
          <IcoG args={[0.7 - i * 0.15, 1]} />
          <Flat color={P.leaf} />
        </mesh>
      ))}
      <mesh position={[4, 4.2, APT.backZ + 0.17]}>
        <planeGeometry args={[2.2, 1.5]} />
        <Flat color="#2E5A6A" />
      </mesh>
      <mesh position={[4, 4.2, APT.backZ + 0.18]}>
        <circleGeometry args={[0.45, 8]} />
        <Flat color={P.amber} />
      </mesh>
      {/* floor lamp by the couch */}
      <mesh position={[-7.4, 2.2, -4.6]} castShadow>
        <CylG args={[0.06, 0.08, 4.4, 6]} />
        <Flat color={P.pole} />
      </mesh>
      <mesh position={[-7.4, 4.5, -4.6]}>
        <ConeG args={[0.6, 0.7, 8, 1, true]} />
        <Glow color={P.lampGlow} opacity={0.9} />
      </mesh>
      <pointLight position={[-7.0, 4.0, -3.8]} color="#FFC890" intensity={18} distance={12} decay={2} />
    </group>
  );
};

// ================================================================ the burger counter (night shift)

export const COUNTER = { top: 1.75, z: 0, d: 1.2, w: 10 };
const drawMenu = (title: string, items: string[], color: string) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#15161C";
  ctx.fillRect(0, 0, W, H);
  ctx.font = CANVAS_FONT(H * 0.16);
  fitText(ctx, title, W / 2, H * 0.17, W * 0.85, H * 0.16, color);
  items.forEach((it, i) => {
    ctx.font = CANVAS_FONT(H * 0.1, false);
    fitText(ctx, it, W / 2, H * (0.42 + i * 0.17), W * 0.85, H * 0.1, "#F2EEE6", false);
  });
};
export const BurgerBar: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <mesh position={[0, -0.05, 2]} receiveShadow>
      <BoxG args={[30, 0.1, 20]} />
      <Flat color="#8A8F9A" />
    </mesh>
    {Array.from({ length: 10 }, (_, i) => (
      <mesh key={i} position={[-13.5 + i * 3, 0.006, 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.5, 16]} />
        <Flat color="#7A808C" />
      </mesh>
    ))}
    <mesh position={[0, 4.5, -4.2]} receiveShadow>
      <BoxG args={[30, 9, 0.3]} />
      <Flat color="#C8372D" />
    </mesh>
    <mesh position={[0, 1.2, -4.0]} receiveShadow>
      <BoxG args={[30, 2.4, 0.2]} />
      <Flat color="#E6E0D4" />
    </mesh>
    {/* menu boards */}
    {[
      [-4.4, "BURGERS", ["CLASSIC 4.99", "DOUBLE 6.49", "VEGGIE 5.49"]],
      [0, "MEALS", ["MEAL #1 8.99", "MEAL #2 9.49", "KIDS 4.49"]],
      [4.4, "DRINKS", ["SODA 1.99", "SHAKE 3.49", "COFFEE 1.49"]],
    ].map(([x, title, items]) => (
      <CanvasPanel key={x as number} position={[x as number, 5.6, -4.0]} w={4} h={2.4} draw={drawMenu(title as string, items as string[], P.amber)} />
    ))}
    {/* fryer glow and steel */}
    <mesh position={[-3.4, 1.4, -3.3]} castShadow>
      <BoxG args={[2.6, 2.8, 1.2]} />
      <Flat color="#A2A8B4" />
    </mesh>
    <mesh position={[-3.4, 2.82, -3.3]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2.2, 0.9]} />
      <Glow color="#E0A040" />
    </mesh>
    <mesh position={[3.2, 1.5, -3.3]} castShadow>
      <BoxG args={[2.4, 3, 1.2]} />
      <Flat color="#A2A8B4" />
    </mesh>
    {/* the counter, till and a tray */}
    <mesh position={[0, COUNTER.top / 2, COUNTER.z]} castShadow receiveShadow>
      <BoxG args={[COUNTER.w, COUNTER.top, COUNTER.d]} />
      <Flat color="#E6E0D4" />
    </mesh>
    <mesh position={[0, COUNTER.top + 0.04, COUNTER.z]} castShadow>
      <BoxG args={[COUNTER.w + 0.2, 0.08, COUNTER.d + 0.2]} />
      <Flat color="#C8372D" />
    </mesh>
    <mesh position={[-2.6, COUNTER.top + 0.4, COUNTER.z - 0.2]} castShadow>
      <BoxG args={[0.9, 0.7, 0.6]} />
      <Flat color="#2B2F3E" />
    </mesh>
    <mesh position={[-2.6, COUNTER.top + 0.55, COUNTER.z + 0.11]}>
      <planeGeometry args={[0.7, 0.36]} />
      <Glow color="#7FD6A0" />
    </mesh>
    <mesh position={[1.2, COUNTER.top + 0.11, COUNTER.z + 0.1]} castShadow>
      <BoxG args={[1.4, 0.06, 1.0]} />
      <Flat color="#C8372D" />
    </mesh>
    <mesh position={[1.0, COUNTER.top + 0.34, COUNTER.z + 0.1]} castShadow>
      <CylG args={[0.32, 0.3, 0.4, 10]} />
      <Flat color="#D89A4A" />
    </mesh>
    {/* ceiling light strips */}
    {[-4, 0, 4].map((x) => (
      <mesh key={x} position={[x, 8.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.6, 0.5]} />
        <Glow color="#F4F6FA" />
      </mesh>
    ))}
    <pointLight position={[0, 7, 2]} color="#FFF4E0" intensity={60} distance={22} decay={2} />
    {/* the night outside the front windows, behind the camera side */}
    <mesh position={[0, 4, 12]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[30, 9]} />
      <Glow color="#0E1430" />
    </mesh>
    <mesh position={[-3.4, 3.4, -3.3]}>
      <IcoG args={[0.2, 0]} />
      <Glow color="#FFD08A" opacity={0.6 + 0.4 * Math.abs(Math.sin(t * 2))} />
    </mesh>
  </group>
);

/** The burger bar's cap (a red box with a peak), sat on a head centre. */
export const Cap: React.FC<{ head: V3; yaw?: number; color?: string }> = ({ head, yaw = 0, color = "#C8372D" }) => (
  <group position={head} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.66, -0.04]} castShadow>
      <BoxG args={[1.42, 0.42, 1.4]} />
      <Flat color={color} />
    </mesh>
    <mesh position={[0, 0.5, 0.82]} castShadow>
      <BoxG args={[1.1, 0.08, 0.5]} />
      <Flat color={color} />
    </mesh>
  </group>
);

// ================================================================ the press briefing

export const PODIUM = { top: 2.5, z: 0, w: 1.8, d: 1.0 };
const drawEmblem = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#1D274B";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = P.amber;
  ctx.lineWidth = W * 0.03;
  ctx.beginPath();
  ctx.arc(W / 2, H * 0.4, H * 0.26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = P.amber;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    const r = i % 2 ? H * 0.07 : H * 0.16;
    ctx.lineTo(W / 2 + Math.cos(a) * r, H * 0.4 + Math.sin(a) * r);
  }
  ctx.fill();
  ctx.font = CANVAS_FONT(H * 0.11);
  fitText(ctx, "PRESS BRIEFING", W / 2, H * 0.86, W * 0.9, H * 0.11, "#F2EEE6");
};
export const PressRoom: React.FC<{ t: number; flashes?: number }> = ({ t, flashes = 1 }) => (
  <group>
    <mesh position={[0, -0.05, 4]} receiveShadow>
      <BoxG args={[34, 0.1, 30]} />
      <Flat color="#2A2430" />
    </mesh>
    <mesh position={[0, 0.2, -1]} receiveShadow>
      <BoxG args={[14, 0.4, 5]} />
      <Flat color="#3A3048" />
    </mesh>
    <mesh position={[0, 5, -3.6]} receiveShadow>
      <BoxG args={[34, 10, 0.3]} />
      <Flat color="#22284A" />
    </mesh>
    {/* curtains either side (deep blue, no flags) */}
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 5.6, 4.5, -3.2]} castShadow>
        <BoxG args={[2.4, 9, 0.4]} />
        <Flat color="#2E3A7A" />
      </mesh>
    ))}
    <CanvasPanel position={[0, 5.4, -3.42]} w={4.4} h={3.4} draw={drawEmblem} />
    {/* lectern */}
    <mesh position={[0, 0.4 + (PODIUM.top - 0.4) / 2, PODIUM.z]} castShadow receiveShadow>
      <BoxG args={[PODIUM.w, PODIUM.top - 0.4, PODIUM.d]} />
      <Flat color="#5A3E2E" />
    </mesh>
    <mesh position={[0, PODIUM.top, PODIUM.z + 0.05]} rotation={[0.25, 0, 0]} castShadow>
      <BoxG args={[PODIUM.w + 0.2, 0.12, PODIUM.d + 0.2]} />
      <Flat color="#6A4A34" />
    </mesh>
    <CanvasPanel position={[0, 1.7, PODIUM.z + PODIUM.d / 2 + 0.01]} w={0.9} h={0.7} draw={(ctx, W, H) => {
      ctx.fillStyle = "#5A3E2E";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = P.amber;
      ctx.lineWidth = W * 0.05;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, H * 0.34, 0, Math.PI * 2);
      ctx.stroke();
    }} />
    {/* microphones bending up toward the speaker */}
    {[-0.35, 0, 0.35].map((x, i) => (
      <group key={x} position={[x, PODIUM.top + 0.08, PODIUM.z + 0.2]} rotation={[-0.5, x * 0.6, 0]}>
        <mesh position={[0, 0.35, 0]}>
          <CylG args={[0.025, 0.035, 0.7, 6]} />
          <Flat color="#2A2A30" />
        </mesh>
        <mesh position={[0, 0.75, 0]}>
          <IcoG args={[0.08, 1]} />
          <Flat color={["#15161C", "#C8372D", "#24748F"][i]} />
        </mesh>
      </group>
    ))}
    {/* camera flashes from the press pack */}
    {flashes > 0
      ? Array.from({ length: 7 }, (_, i) => {
          const period = 0.55 + random(`fl${i}p`) * 0.5;
          const ph = (((t + random(`fl${i}o`) * 3) % period) + period) % period;
          const on = ph < 0.07;
          if (!on) return null;
          const p: V3 = [-6 + random(`fl${i}x`) * 12, 4 + random(`fl${i}y`) * 1.6, 5 + random(`fl${i}z`) * 4];
          return (
            <React.Fragment key={i}>
              <Halo position={p} size={3.4} color="#FFFFFF" opacity={0.95} />
              <pointLight position={p} color="#FFFFFF" intensity={40} distance={14} decay={2} />
            </React.Fragment>
          );
        })
      : null}
    <pointLight position={[0, 7, 4]} color="#FFE8C8" intensity={70} distance={20} decay={2} />
  </group>
);

/** A press camera held up at head height (a box with a lens), at `position`, lens toward -Z. */
export const PressCamera: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh castShadow>
      <BoxG args={[0.7, 0.5, 0.4]} />
      <Flat color="#17181E" />
    </mesh>
    <mesh position={[0, 0, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
      <CylG args={[0.17, 0.17, 0.35, 10]} />
      <Flat color="#2A2A30" />
    </mesh>
    <mesh position={[0.2, 0.33, 0]}>
      <BoxG args={[0.25, 0.15, 0.2]} />
      <Flat color="#E6E0D4" />
    </mesh>
  </group>
);

/** A drop of sweat (cool blue, with a glint), for a nervous forehead. */
export const Sweat: React.FC<{ position: V3; scale?: number }> = ({ position, scale = 1 }) => (
  <group position={position} scale={scale}>
    <mesh scale={[1, 1.4, 0.6]}>
      <IcoG args={[0.09, 1]} />
      <Glow color="#9AD6FF" />
    </mesh>
  </group>
);

// ================================================================ the interrogation room (grey morning)

export const ITABLE = { top: 1.45, w: 3.6, d: 2.0 };
export const Interrogation: React.FC = () => (
  <group>
    <mesh position={[0, -0.05, 2]} receiveShadow>
      <BoxG args={[20, 0.1, 18]} />
      <Flat color="#4A4E58" />
    </mesh>
    <mesh position={[0, 4, -4.5]} receiveShadow>
      <BoxG args={[20, 8, 0.3]} />
      <Flat color="#6A707C" />
    </mesh>
    {/* one-way mirror */}
    <mesh position={[3.8, 4.2, -4.33]}>
      <BoxG args={[5.2, 2.8, 0.06]} />
      <Flat color="#1E2430" />
    </mesh>
    <mesh position={[3.4, 4.6, -4.29]} rotation={[0, 0, 0.6]}>
      <planeGeometry args={[0.25, 2.6]} />
      <Glow color="#3A4252" opacity={0.6} />
    </mesh>
    {/* grey-morning window high on the left wall */}
    <mesh position={[-7, 4, 2]} receiveShadow>
      <BoxG args={[0.3, 8, 18]} />
      <Flat color="#5E646F" />
    </mesh>
    <mesh position={[-6.83, 5.6, -1.5]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[3, 1.2]} />
      <Glow color="#B8C0CC" />
    </mesh>
    {[-2.4, -1.5, -0.6].map((z) => (
      <mesh key={z} position={[-6.8, 5.6, z]}>
        <BoxG args={[0.1, 1.2, 0.08]} />
        <Flat color="#2A2E38" />
      </mesh>
    ))}
    {/* table */}
    <mesh position={[0, ITABLE.top - 0.06, 0]} castShadow receiveShadow>
      <BoxG args={[ITABLE.w, 0.12, ITABLE.d]} />
      <Flat color="#9AA1B0" />
    </mesh>
    {[-1, 1].flatMap((sx) =>
      [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * (ITABLE.w / 2 - 0.2), (ITABLE.top - 0.12) / 2, sz * (ITABLE.d / 2 - 0.2)]} castShadow>
          <BoxG args={[0.12, ITABLE.top - 0.12, 0.12]} />
          <Flat color="#2B2F3E" />
        </mesh>
      )),
    )}
    {/* cup and a file */}
    <mesh position={[1.1, ITABLE.top + 0.22, 0.4]} castShadow>
      <CylG args={[0.17, 0.14, 0.44, 10]} />
      <Flat color="#F2EEE6" />
    </mesh>
    <Folder position={[-0.6, ITABLE.top + 0.03, 0.4]} rotation={[0, 0.3, 0]} />
    {/* hanging lamp */}
    <mesh position={[0, 6.6, 0]}>
      <CylG args={[0.02, 0.02, 2.8, 4]} />
      <Flat color={P.pole} />
    </mesh>
    <mesh position={[0, 5.1, 0]}>
      <ConeG args={[0.8, 0.6, 10, 1, true]} />
      <Flat color="#2B2F3E" side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 4.85, 0]}>
      <IcoG args={[0.2, 1]} />
      <Glow color="#FFF4D6" />
    </mesh>
    <pointLight position={[0, 4.6, 0]} color="#FFF0D0" intensity={55} distance={14} decay={2} castShadow />
  </group>
);

// ================================================================ rain and haircuts

/** An umbrella held at `hand` (pole from the fist up to the canopy). */
export const Umbrella: React.FC<{ hand: V3; color?: string; tilt?: number }> = ({ hand, color = "#24748F", tilt = 0 }) => (
  <group position={hand} rotation={[0, 0, tilt]}>
    <mesh position={[0, 1.0, 0]}>
      <CylG args={[0.035, 0.035, 2.0, 5]} />
      <Flat color="#2A2A30" />
    </mesh>
    <mesh position={[0, 2.25, 0]} castShadow>
      <ConeG args={[1.9, 0.7, 8, 1, true]} />
      <Flat color={color} side={THREE.DoubleSide} />
    </mesh>
  </group>
);

/** A terrible haircut: a lime-green crest of spikes on top of a head (head centre `head`, facing +Z). */
export const BadHair: React.FC<{ head: V3; yaw?: number }> = ({ head, yaw = 0 }) => (
  <group position={head} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.62, 0]} castShadow>
      <BoxG args={[1.34, 0.3, 1.32]} />
      <Flat color="#8AD630" />
    </mesh>
    {[-0.45, -0.15, 0.15, 0.45].map((z, i) => (
      <mesh key={z} position={[0, 1.0 + (i % 2) * 0.12, z]} rotation={[z * 0.5, 0, 0]} castShadow>
        <ConeG args={[0.26, 0.9 + (i % 2) * 0.3, 5]} />
        <Flat color={i % 2 ? "#B8F040" : "#8AD630"} />
      </mesh>
    ))}
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.55, 0.85, -0.1]} rotation={[0, 0, -s * 0.9]} castShadow>
        <ConeG args={[0.18, 0.6, 5]} />
        <Flat color="#B8F040" />
      </mesh>
    ))}
  </group>
);

/** Canvas drawer for the cream ad (lie) and its honest version. */
export const drawCreamAd = (honest: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#F7C6D8");
  g.addColorStop(1, "#E890B8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // the jar
  ctx.fillStyle = "#FBF8F0";
  ctx.fillRect(W * 0.07, H * 0.35, W * 0.24, H * 0.5);
  ctx.fillStyle = "#C83A7A";
  ctx.fillRect(W * 0.06, H * 0.28, W * 0.26, H * 0.11);
  ctx.font = CANVAS_FONT(H * 0.1);
  fitText(ctx, "CREAM", W * 0.19, H * 0.62, W * 0.2, H * 0.1, "#C83A7A");
  // sparkles
  ctx.fillStyle = "#FFFFFF";
  [[0.36, 0.3], [0.04, 0.22], [0.33, 0.85]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(W * x, H * y, H * 0.03, 0, Math.PI * 2);
    ctx.fill();
  });
  const k = clamp01(honest);
  if (k < 0.5) {
    ctx.font = CANVAS_FONT(H * 0.2);
    fitText(ctx, "LOOK 20 YEARS", W * 0.67, H * 0.36, W * 0.6, H * 0.2, "#7A1240");
    fitText(ctx, "YOUNGER!", W * 0.67, H * 0.62, W * 0.6, H * 0.24, "#7A1240");
    if (k > 0) {
      ctx.strokeStyle = "#D8352A";
      ctx.lineWidth = H * 0.06;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(W * 0.38, H * 0.26);
      ctx.lineTo(W * 0.38 + W * 0.58 * (k / 0.5), H * 0.26 + H * 0.46 * (k / 0.5));
      ctx.stroke();
    }
  } else {
    ctx.font = CANVAS_FONT(H * 0.2);
    fitText(ctx, "IT'S JUST", W * 0.67, H * 0.36, W * 0.6, H * 0.2, "#14121C");
    fitText(ctx, "LOTION.", W * 0.67, H * 0.64, W * 0.6, H * 0.26, "#14121C");
    ctx.font = CANVAS_FONT(H * 0.08, false);
    fitText(ctx, "YOU WILL LOOK THE SAME", W * 0.67, H * 0.86, W * 0.6, H * 0.08, "#3A2030", false);
  }
};

/** Canvas drawer for the diet billboard ("false promises"). */
export const drawPromiseAd = (honest: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = honest > 0.5 ? "#2A2A30" : "#24748F";
  ctx.fillRect(0, 0, W, H);
  const k = clamp01(honest);
  ctx.font = CANVAS_FONT(H * 0.2);
  if (k < 0.5) {
    fitText(ctx, "GET RICH", W / 2, H * 0.32, W * 0.86, H * 0.24, "#FFFFFF");
    fitText(ctx, "IN 7 DAYS!", W / 2, H * 0.62, W * 0.86, H * 0.24, P.amber);
    ctx.font = CANVAS_FONT(H * 0.08, false);
    fitText(ctx, "GUARANTEED*", W / 2, H * 0.86, W * 0.6, H * 0.08, "#F2EEE6", false);
    if (k > 0) {
      ctx.strokeStyle = "#D8352A";
      ctx.lineWidth = H * 0.07;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(W * 0.1, H * 0.2);
      ctx.lineTo(W * 0.1 + W * 0.8 * (k / 0.5), H * 0.2 + H * 0.6 * (k / 0.5));
      ctx.stroke();
    }
  } else {
    fitText(ctx, "YOU WON'T.", W / 2, H * 0.42, W * 0.86, H * 0.28, "#FFFFFF");
    ctx.font = CANVAS_FONT(H * 0.1, false);
    fitText(ctx, "NOBODY DOES.", W / 2, H * 0.72, W * 0.6, H * 0.1, "#C9C2B4", false);
  }
};

// ================================================================ the silent café (snow)

export const CAFE = { w: 16, d: 9, h: 9, glassH: 5.4 };
export const Cafe: React.FC<{ position: V3 }> = ({ position }) => (
  <group position={position}>
    {/* shell: back, sides and roof; the front is glass */}
    <mesh position={[0, CAFE.h / 2, -CAFE.d]} receiveShadow>
      <BoxG args={[CAFE.w, CAFE.h, 0.3]} />
      <Flat color="#7A4A34" />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * CAFE.w / 2, CAFE.h / 2, -CAFE.d / 2]} castShadow receiveShadow>
        <BoxG args={[0.4, CAFE.h, CAFE.d]} />
        <Flat color="#4A2E22" />
      </mesh>
    ))}
    <mesh position={[0, CAFE.h + 0.2, -CAFE.d / 2]} castShadow>
      <BoxG args={[CAFE.w + 0.6, 0.4, CAFE.d + 0.6]} />
      <Flat color="#E8EEF5" />
    </mesh>
    <mesh position={[0, (CAFE.h + CAFE.glassH + 0.4) / 2, 0]} castShadow>
      <BoxG args={[CAFE.w, CAFE.h - CAFE.glassH - 0.4, 0.4]} />
      <Flat color="#4A2E22" />
    </mesh>
    <mesh position={[0, 0.2, 0]} castShadow>
      <BoxG args={[CAFE.w, 0.4, 0.4]} />
      <Flat color="#4A2E22" />
    </mesh>
    {[-CAFE.w / 4, 0, CAFE.w / 4].map((x) => (
      <mesh key={x} position={[x, (CAFE.glassH + 0.4) / 2 + 0.2, 0]}>
        <BoxG args={[0.18, CAFE.glassH, 0.2]} />
        <Flat color="#4A2E22" />
      </mesh>
    ))}
    <mesh position={[0, CAFE.glassH / 2 + 0.4, 0.02]}>
      <planeGeometry args={[CAFE.w - 0.4, CAFE.glassH]} />
      <meshBasicMaterial color="#FFE2B8" transparent opacity={0.08} depthWrite={false} />
    </mesh>
    <NeonSign position={[0, CAFE.glassH + 1.6, 0.4]} w={5} h={1.4} text="CAFÉ" color="#FFBA58" />
    {/* inside: floor, warm lights */}
    <mesh position={[0, 0.02, -CAFE.d / 2]} receiveShadow>
      <BoxG args={[CAFE.w - 0.5, 0.04, CAFE.d - 0.2]} />
      <Flat color="#8A5A3A" />
    </mesh>
    {[-4, 4].map((x) => (
      <React.Fragment key={x}>
        <mesh position={[x, 6.6, -3.6]}>
          <ConeG args={[0.6, 0.5, 8, 1, true]} />
          <Glow color={P.lampGlow} />
        </mesh>
        <pointLight position={[x, 6, -3.2]} color="#FFC890" intensity={30} distance={12} decay={2} />
      </React.Fragment>
    ))}
    {/* two café tables (top 1.45) */}
    {[-4, 4].map((x) => (
      <group key={x} position={[x, 0, -3.6]}>
        <mesh position={[0, 1.39, 0]} castShadow receiveShadow>
          <CylG args={[1.1, 1.1, 0.12, 14]} />
          <Flat color="#E6E0D4" />
        </mesh>
        <mesh position={[0, 0.7, 0]} castShadow>
          <CylG args={[0.1, 0.14, 1.4, 6]} />
          <Flat color="#2A2A30" />
        </mesh>
        {[-0.45, 0.45].map((dx) => (
          <mesh key={dx} position={[dx, 1.6, 0]} castShadow>
            <CylG args={[0.17, 0.14, 0.32, 10]} />
            <Flat color="#F2EEE6" />
          </mesh>
        ))}
      </group>
    ))}
  </group>
);

// ================================================================ the rooftop (dawn)

export const Rooftop: React.FC = () => (
  <group>
    <mesh position={[0, -0.25, 0]} receiveShadow>
      <BoxG args={[22, 0.5, 18]} />
      <Flat color="#6A6E78" />
    </mesh>
    {/* parapet along the front edge (z = 6) and the sides */}
    <mesh position={[0, 0.5, 6]} castShadow receiveShadow>
      <BoxG args={[22, 1.0, 0.5]} />
      <Flat color="#7A808C" />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 11, 0.5, -3]} castShadow receiveShadow>
        <BoxG args={[0.5, 1.0, 18]} />
        <Flat color="#7A808C" />
      </mesh>
    ))}
    {/* water tank on legs, AC units, an antenna */}
    <group position={[-7, 0, -5]}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 1.2, 1.5, sz * 1.2]} castShadow>
            <BoxG args={[0.2, 3, 0.2]} />
            <Flat color="#3A3020" />
          </mesh>
        )),
      )}
      <mesh position={[0, 4.6, 0]} castShadow>
        <CylG args={[1.8, 1.8, 3.2, 12]} />
        <Flat color="#7A5A3A" />
      </mesh>
      <mesh position={[0, 6.6, 0]} castShadow>
        <ConeG args={[1.9, 0.9, 12]} />
        <Flat color="#5A3E2E" />
      </mesh>
    </group>
    {[3, 6.5].map((x) => (
      <mesh key={x} position={[x, 0.7, -5]} castShadow>
        <BoxG args={[2.4, 1.4, 1.8]} />
        <Flat color="#A2A8B4" />
      </mesh>
    ))}
    <mesh position={[8.5, 4, -7]} castShadow>
      <CylG args={[0.06, 0.08, 8, 5]} />
      <Flat color={P.pole} />
    </mesh>
    <mesh position={[8.5, 8.1, -7]}>
      <IcoG args={[0.15, 1]} />
      <Glow color="#FF4A3A" />
    </mesh>
  </group>
);
