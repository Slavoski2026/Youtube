/**
 * Props for "What If Nobody Could Feel Fear?" (ep. 10). Post-processed (withFx): Glow parts bloom.
 * Nobody gets hurt on screen: the heights stay calm, the lion only roars, the car-free danger beats are gags.
 */
import React, { useMemo } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { Building, CityGrid, Ground } from "../../slavoski/city";
import { BoxG, CircleG, ConeG, CylG, IcoG } from "../../slavoski/detail";
import type { HeroLook } from "../../slavoski/hero";
import { crowdLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { Clouds, GrassTufts } from "../../slavoski/nature";
import { clamp01, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { CANVAS_FONT, CanvasPanel, fitText } from "../../slavoski/screens";
import { CITY } from "../ww3-countdown/props";
import { HillRing, Strut } from "../no-work-2036/props";
import { LightShaft } from "../no-voices/props";

// ================================================================ a canvas panel with transparency

/** Like CanvasPanel, but the canvas alpha is kept (for decals and thought bubbles). Drawn once per texture key. */
export const AlphaPanel: React.FC<{ position: V3; rotation?: V3; w: number; h: number; px?: number; draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => void; opacity?: number }> = ({
  position,
  rotation = [0, 0, 0],
  w,
  h,
  px = 512,
  draw,
  opacity = 1,
}) => {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = px;
    c.height = Math.max(8, Math.round((px * h) / w));
    const ctx = c.getContext("2d")!;
    draw(ctx, c.width, c.height);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [px, w, h]);
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
};

// ================================================================ the skyscraper

/** Slavoski's skyscraper at hero scale: kit building ×3.5, roof deck top at ROOF.y, deck edges at ±ROOF.edge. */
export const ROOF = { y: 308.6, edge: 16.1, kitH: 88, kitW: 9 };

export const SkyTower: React.FC<{ seed?: string; power?: number; helipad?: boolean }> = ({ seed = "tower", power = 0.3, helipad = true }) => (
  <group>
    <group scale={CITY}>
      <Building position={[0, 0, 0]} w={ROOF.kitW} d={ROOF.kitW} h={ROOF.kitH} color={P.bldgSlate} seed={seed} litRatio={0.4} power={power} bare />
    </group>
    {/* roof deck covering the kit roof slab and cornice */}
    <mesh position={[0, ROOF.y - 0.3, 0]} castShadow receiveShadow>
      <BoxG args={[ROOF.edge * 2, 0.6, ROOF.edge * 2]} />
      <Flat color="#4A5260" />
    </mesh>
    {/* edge trim, flush with the deck so feet can stand right at the edge */}
    {[-1, 1].map((s) => (
      <React.Fragment key={s}>
        <mesh position={[s * (ROOF.edge - 0.15), ROOF.y + 0.02, 0]}>
          <BoxG args={[0.3, 0.04, ROOF.edge * 2]} />
          <Flat color="#E0B04E" />
        </mesh>
        <mesh position={[0, ROOF.y + 0.02, s * (ROOF.edge - 0.15)]}>
          <BoxG args={[ROOF.edge * 2, 0.04, 0.3]} />
          <Flat color="#E0B04E" />
        </mesh>
      </React.Fragment>
    ))}
    {helipad ? (
      <group position={[-4, ROOF.y + 0.03, -3]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <CircleG args={[7.5, 24]} />
          <Flat color="#2E3440" />
        </mesh>
        <AlphaPanel position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} w={11} h={11} px={512} draw={drawHelipad} />
      </group>
    ) : null}
    {/* antenna mast with a red beacon */}
    <group position={[-11, ROOF.y, 10]}>
      <Strut a={[0, 0, 0]} b={[0, 26, 0]} w={0.45} color="#8A909E" />
      {[6, 12, 18].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <BoxG args={[2.4, 0.2, 0.2]} />
          <Flat color="#8A909E" />
        </mesh>
      ))}
      <mesh position={[0, 26.4, 0]}>
        <IcoG args={[0.5, 1]} />
        <Glow color="#FF3A3A" />
      </mesh>
      <Halo position={[0, 26.4, 0]} size={5} color="#FF3A3A" opacity={0.6} />
    </group>
    {/* stair and lift housing in the far corner, clear of the helipad */}
    <mesh position={[9.5, ROOF.y + 2.6, -10.5]} castShadow receiveShadow>
      <BoxG args={[8, 5.2, 7]} />
      <Flat color="#5A6270" />
    </mesh>
    <mesh position={[9.5, ROOF.y + 5.35, -10.5]} castShadow>
      <BoxG args={[8.6, 0.3, 7.6]} />
      <Flat color="#4A5260" />
    </mesh>
    <mesh position={[9.5, ROOF.y + 1.6, -6.98]}>
      <planeGeometry args={[1.8, 3.2]} />
      <Flat color="#2A2E36" />
    </mesh>
    {/* AC units */}
    {[[2, 0, -12.5], [-1.4, 0, -13.2], [12.5, 0, -2]].map((p, i) => (
      <mesh key={i} position={[p[0], ROOF.y + 1.1, p[2]]} castShadow>
        <BoxG args={[2.6, 2.2, 2.8]} />
        <Flat color="#9AA1B0" />
      </mesh>
    ))}
  </group>
);

const drawHelipad = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = "#E8E4DA";
  ctx.lineWidth = W * 0.035;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, W * 0.42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = CANVAS_FONT(H * 0.5);
  fitText(ctx, "H", W / 2, H * 0.54, W * 0.5, H * 0.5, "#E8E4DA");
};

/** The city 300 m below plus a ring of other towers and cloud layers, so the view down is dizzying. */
export const Downtown: React.FC<{ t: number; cloudTint?: string; power?: number; skip?: (bx: number, bz: number) => boolean }> = ({
  t,
  cloudTint = "#F4F6FA",
  power = 0.3,
  skip = (bx, bz) => bx === 4 && bz === 4,
}) => (
  <group>
    <group scale={CITY}>
      <CityGrid seed="dt" blocks={9} block={14} skip={skip} modify={() => ({ power })} />
    </group>
    {Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2 + 0.3;
      const r = 150 + random(`tw${i}`) * 120;
      const h = 34 + random(`th${i}`) * 40;
      return (
        <group key={i} scale={CITY} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
          <Building position={[0, 0, 0]} w={7} d={7} h={h} color={[P.bldgNavy, P.bldgTeal, P.bldgPurple, P.bldgSlate][i % 4]} seed={`tw${i}`} power={power} />
        </group>
      );
    })}
    <Clouds t={t} y={210} radius={260} count={18} scale={3.2} color={cloudTint} seed="lowcloud" />
    <Clouds t={t} y={150} radius={420} count={22} scale={4} color={cloudTint} seed="lowcloud2" />
    <HillRing radius={900} count={24} y={-10} color="#5E7A8A" />
  </group>
);

/** A plank bridge between two rooftops (hero scale). Plank top at PLANK.y, along X from x0 to x1, centred on z = 0. */
export const PLANK = { y: 240.6, x0: -18, x1: 18, w: 1.4 };
export const PlankTowers: React.FC = () => (
  <group>
    {[-1, 1].map((s) => (
      <group key={s}>
        <group scale={CITY} position={[s * 34, 0, 0]}>
          <Building position={[0, 0, 0]} w={9} d={9} h={240 / CITY} color={s > 0 ? P.bldgTeal : P.bldgPurple} seed={`pk${s}`} power={0.3} bare />
        </group>
        <mesh position={[s * 34, 240.3, 0]} receiveShadow>
          <BoxG args={[32.4, 0.6, 32.4]} />
          <Flat color="#4A5260" />
        </mesh>
      </group>
    ))}
    <mesh position={[0, PLANK.y - 0.2, 0]} castShadow receiveShadow>
      <BoxG args={[PLANK.x1 - PLANK.x0 + 4, 0.4, PLANK.w]} />
      <Flat color="#8A6A4A" />
    </mesh>
  </group>
);

/** A steel I-beam hanging from a crane hook on two cables. Beam top at BEAM.y, along X, centred at the origin. */
export const BEAM = { y: 260, len: 16, w: 1.1, h: 0.9 };
export const IBeam: React.FC<{ sway?: number }> = ({ sway = 0 }) => (
  <group rotation={[0, 0, sway]}>
    <mesh position={[0, BEAM.y - 0.08, 0]} castShadow receiveShadow>
      <BoxG args={[BEAM.len, 0.16, BEAM.w]} />
      <Flat color="#C8372D" />
    </mesh>
    <mesh position={[0, BEAM.y - BEAM.h / 2, 0]} castShadow>
      <BoxG args={[BEAM.len, BEAM.h - 0.32, 0.18]} />
      <Flat color="#A82E26" />
    </mesh>
    <mesh position={[0, BEAM.y - BEAM.h + 0.08, 0]} castShadow>
      <BoxG args={[BEAM.len, 0.16, BEAM.w]} />
      <Flat color="#C8372D" />
    </mesh>
    {[-5, 5].map((x) => (
      <Strut key={x} a={[x, BEAM.y, 0]} b={[0, BEAM.y + 9, 0]} w={0.08} color="#2A2E36" />
    ))}
    <Strut a={[0, BEAM.y + 9, 0]} b={[0, BEAM.y + 60, 0]} w={0.12} color="#2A2E36" />
    <mesh position={[0, BEAM.y + 9.4, 0]}>
      <BoxG args={[0.9, 1.0, 0.6]} />
      <Flat color="#E0B04E" />
    </mesh>
  </group>
);

// ================================================================ savanna

const Acacia: React.FC<{ position: V3; scale?: number; seed?: string }> = ({ position, scale = 1, seed = "ac" }) => (
  <group position={position} scale={scale}>
    <Strut a={[0, 0, 0]} b={[0.4, 4.2, 0]} w={0.45} color="#5A3E2E" />
    <Strut a={[0.4, 4.2, 0]} b={[-1.6, 5.6, 0.3]} w={0.25} color="#5A3E2E" />
    <Strut a={[0.4, 4.2, 0]} b={[2.2, 5.5, -0.2]} w={0.25} color="#5A3E2E" />
    {[[-1.6, 5.9, 0.3, 2.4], [2.2, 5.8, -0.2, 2.6], [0.4, 6.2, 0, 2.9]].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]} scale={[1, 0.32, 1]} castShadow>
        <IcoG args={[r + random(`${seed}${i}`) * 0.4, 1]} />
        <Flat color={i % 2 ? "#4E7A3A" : "#5E8A42"} />
      </mesh>
    ))}
  </group>
);

/** Golden savanna: tan ground, grass, flat-topped acacias, distant hills. The lion stands near the origin. */
export const Savanna: React.FC = () => (
  <group>
    <Ground color="#C9A86A" />
    <GrassTufts area={[-40, 40, -60, 20]} growth={1} count={260} seed="sav" />
    <Acacia position={[-14, 0, -26]} scale={2.2} seed="a1" />
    <Acacia position={[18, 0, -40]} scale={2.6} seed="a2" />
    <Acacia position={[-30, 0, -70]} scale={3} seed="a3" />
    <Acacia position={[34, 0, -90]} scale={3.2} seed="a4" />
    <HillRing radius={220} count={18} color="#B08A5A" />
  </group>
);

// ================================================================ bodies and brains

/** A faceted glowing heart that beats (scale pulse); `rate` in beats per second. */
export const HoloHeart: React.FC<{ position: V3; t: number; rate?: number; size?: number; color?: string }> = ({ position, t, rate = 1, size = 0.3, color = "#FF3A5A" }) => {
  const ph = (t * rate) % 1;
  const beat = 1 + (ph < 0.12 ? Math.sin((ph / 0.12) * Math.PI) * 0.18 : 0) + (ph > 0.2 && ph < 0.3 ? Math.sin(((ph - 0.2) / 0.1) * Math.PI) * 0.08 : 0);
  return (
    <group position={position} scale={size * beat}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.42, 0.25, 0]}>
          <IcoG args={[0.55, 1]} />
          <Glow color={color} />
        </mesh>
      ))}
      <mesh position={[0, -0.42, 0]} rotation={[Math.PI, 0, 0]}>
        <ConeG args={[0.86, 1.2, 6]} />
        <Glow color={color} />
      </mesh>
      <Halo position={[0, 0, 0.4]} size={4} color={color} opacity={0.4 * beat} />
    </group>
  );
};

/** ECG screen: a calm trace at `bpm`; flat-ish and slow when fearless. */
export const drawEcg = (t: number, bpm: number, label = "HEART RATE", color = "#3AFF8A") => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#04100C";
  ctx.fillRect(0, 0, W, H);
  ctx.font = CANVAS_FONT(H * 0.11);
  fitText(ctx, label, W * 0.3, H * 0.14, W * 0.5, H * 0.11, "#9FB3D9");
  ctx.font = CANVAS_FONT(H * 0.2);
  fitText(ctx, `${Math.round(bpm)} BPM`, W * 0.75, H * 0.16, W * 0.45, H * 0.2, color);
  ctx.strokeStyle = color;
  ctx.lineWidth = H * 0.025;
  ctx.beginPath();
  const per = 60 / bpm;
  for (let x = 0; x <= 160; x++) {
    const u = x / 160;
    const tt = t - (1 - u) * 3;
    const ph = (((tt / per) % 1) + 1) % 1;
    const spike = ph < 0.05 ? Math.sin((ph / 0.05) * Math.PI) : ph < 0.08 ? -0.3 * Math.sin(((ph - 0.05) / 0.03) * Math.PI) : 0;
    const py = H * 0.62 - spike * H * 0.3;
    if (x === 0) ctx.moveTo(u * W, py);
    else ctx.lineTo(u * W, py);
  }
  ctx.stroke();
};

/** The two amygdalae: small almonds deep in the brain (brain-local coordinates, Brain at scale 1). */
export const AMYG: V3[] = [
  [0.42, -0.42, 0.25],
  [-0.42, -0.42, 0.25],
];
export const Amygdala: React.FC<{ glow: number; color?: string; dim?: boolean; size?: number }> = ({ glow, color = "#FF3A3A", dim = false, size = 1 }) => (
  <group>
    {AMYG.map((p, i) => (
      <group key={i} position={p} scale={size}>
        <mesh scale={[0.13, 0.12, 0.2]}>
          <IcoG args={[1, 2]} />
          {dim ? <Flat color="#3A3440" /> : <Glow color={new THREE.Color("#5A1A1A").lerp(new THREE.Color(color), clamp01(glow)).getStyle()} />}
        </mesh>
        {!dim && glow > 0.05 ? <Halo position={[0, 0, 0]} size={1.4 * glow + 0.2} color={color} opacity={0.7 * glow} /> : null}
      </group>
    ))}
  </group>
);

/** A green snake draped round the shoulders of a hero at `at` (facing +Z): behind the neck, down the chest. */
export const Snake: React.FC<{ at: V3; t: number; color?: string }> = ({ at, t, color = "#3A9A4A" }) => {
  const geom = useMemo(() => {
    const pts = [
      [-1.15, 2.1, 0.55],
      [-1.05, 2.75, 0.2],
      [-0.6, 3.0, -0.55],
      [0, 3.0, -0.62],
      [0.6, 3.0, -0.55],
      [1.05, 2.75, 0.2],
      [1.0, 2.2, 0.6],
      [0.75, 1.6, 0.7],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 48, 0.13, 6, false);
  }, []);
  const sway = Math.sin(t * 2.4) * 0.08;
  return (
    <group position={at}>
      <mesh geometry={geom} castShadow>
        <meshLambertMaterial color={color} flatShading />
      </mesh>
      {/* head at the left end, looking forward, tongue flicking */}
      <group position={[-1.15, 2.05 + sway, 0.62]} rotation={[0.3, 0, 0]}>
        <mesh scale={[0.2, 0.13, 0.28]}>
          <IcoG args={[1, 1]} />
          <Flat color={color} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.1, 0.07, 0.12]}>
            <BoxG args={[0.05, 0.05, 0.04]} />
            <Flat color="#141418" />
          </mesh>
        ))}
        {Math.sin(t * 9) > 0.3 ? (
          <mesh position={[0, -0.02, 0.36]}>
            <BoxG args={[0.03, 0.02, 0.14]} />
            <Flat color="#E8344A" />
          </mesh>
        ) : null}
      </group>
    </group>
  );
};

export const LABCOAT: HeroLook = { ...crowdLook(12), jacket: "#ECEAE4", jacketShade: "#CFCBC2", zipper: "#9FB3D9", jeans: "#2A2E3A" };
export const PATIENT: HeroLook = { ...crowdLook(17), jacket: "#5A8AB8", jacketShade: "#4A7498", zipper: "#E8E4DA" };
export const FUR: HeroLook = { ...crowdLook(3), jacket: "#7A5232", jacketShade: "#5E3E26", zipper: "#7A5232", jeans: "#5E3E26", shoe: "#5E3E26", hair: "#2A1E18" };

/** A brain-scan lightbox (two slices, one with the dark spot where the amygdala should glow). */
export const drawScan = (t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0A1018";
  ctx.fillRect(0, 0, W, H);
  [0.27, 0.73].forEach((cx, i) => {
    const x = W * cx;
    const y = H * 0.48;
    ctx.fillStyle = "#3A4A5E";
    ctx.beginPath();
    ctx.ellipse(x, y, W * 0.19, H * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#6A7E96";
    ctx.lineWidth = W * 0.004;
    for (let k = 0; k < 7; k++) {
      ctx.beginPath();
      ctx.ellipse(x, y, W * (0.04 + k * 0.022), H * (0.08 + k * 0.042), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    const glow = i === 0 ? 0.6 + Math.sin(t * 4) * 0.3 : 0;
    [-1, 1].forEach((s) => {
      ctx.fillStyle = i === 0 ? `rgba(255,70,70,${glow})` : "#05070A";
      ctx.beginPath();
      ctx.ellipse(x + s * W * 0.05, y + H * 0.07, W * 0.022, H * 0.035, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.font = CANVAS_FONT(H * 0.07);
    fitText(ctx, i === 0 ? "TYPICAL" : "RARE PATIENT", x, H * 0.92, W * 0.4, H * 0.07, i === 0 ? "#9FB3D9" : "#FFBA58");
  });
};

/** A lab room: a lightbox on the back wall (z = −6), a desk, shelves. */
export const Lab: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[30, 0.1, 24]} />
      <Flat color="#C9CED8" />
    </mesh>
    <mesh position={[0, 6, -6.2]} receiveShadow>
      <BoxG args={[30, 12, 0.3]} />
      <Flat color="#E4E8EE" />
    </mesh>
    {[-12, 12].map((x) => (
      <mesh key={x} position={[x, 6, 2]} receiveShadow>
        <BoxG args={[0.3, 12, 18]} />
        <Flat color="#D4DAE2" />
      </mesh>
    ))}
    <mesh position={[0, 5.4, -6.0]}>
      <BoxG args={[9.4, 5.4, 0.2]} />
      <Flat color="#22262E" />
    </mesh>
    <CanvasPanel position={[0, 5.4, -5.88]} w={9} h={5} px={900} glow draw={drawScan(t)} />
    <mesh position={[5.5, 1.3, -3.6]} castShadow receiveShadow>
      <BoxG args={[5, 0.2, 2.2]} />
      <Flat color="#7A6A5A" />
    </mesh>
    {[[3.3, -4.5], [7.7, -4.5], [3.3, -2.7], [7.7, -2.7]].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.6, z]}>
        <BoxG args={[0.2, 1.2, 0.2]} />
        <Flat color="#5A4A3A" />
      </mesh>
    ))}
    {[-9.5, -7].map((x) =>
      [2.5, 4.5, 6.5].map((y) => (
        <mesh key={`${x}${y}`} position={[x, y, -5.6]}>
          <BoxG args={[2.2, 0.15, 1]} />
          <Flat color="#8A7A6A" />
        </mesh>
      )),
    )}
    {Array.from({ length: 9 }, (_, i) => (
      <mesh key={i} position={[-10 + (i % 3) * 0.6 + Math.floor(i / 3) * 0.05, 2.9 + Math.floor(i / 3) * 2, -5.5]}>
        <CylG args={[0.18, 0.18, 0.6, 6]} />
        <Glow color={["#5AE0A0", "#5AD8FF", "#FF9AD8"][i % 3]} opacity={0.85} />
      </mesh>
    ))}
    <pointLight position={[0, 9, 3]} color="#F4F8FF" intensity={70} distance={26} decay={2} />
  </group>
);

/** A chalkboard on a classroom wall (z = −6) with glowing equations. */
export const drawBoard = (k: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#1E3A30";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#8A6A4A";
  ctx.lineWidth = W * 0.02;
  ctx.strokeRect(0, 0, W, H);
  const lines = ["E = mc²", "∫ x² dx = x³/3", "a² + b² = c²", "F = ma", "π ≈ 3.14159"];
  lines.forEach((l, i) => {
    const show = clamp01(k * lines.length - i);
    if (show <= 0) return;
    ctx.globalAlpha = show;
    ctx.font = `700 ${Math.round(H * 0.11)}px "Slavoski Sans", "DejaVu Sans", sans-serif`;
    fitText(ctx, l, W * (i % 2 ? 0.62 : 0.36), H * (0.16 + i * 0.17), W * 0.6, H * 0.11, i === 0 ? "#FFBA58" : "#E8E4DA");
    ctx.globalAlpha = 1;
  });
};

export const Classroom: React.FC<{ k: number }> = ({ k }) => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[30, 0.1, 24]} />
      <Flat color="#8A6A4A" />
    </mesh>
    <mesh position={[0, 6, -6.2]} receiveShadow>
      <BoxG args={[30, 12, 0.3]} />
      <Flat color="#C9B89A" />
    </mesh>
    <mesh position={[0, 5, -6.0]}>
      <BoxG args={[12.4, 5.4, 0.2]} />
      <Flat color="#5A3E2E" />
    </mesh>
    <CanvasPanel position={[0, 5, -5.88]} w={12} h={5} px={1000} glow draw={drawBoard(k)} />
    {[-11, 11].map((x) => (
      <mesh key={x} position={[x, 6, 2]} receiveShadow>
        <BoxG args={[0.3, 12, 18]} />
        <Flat color="#BDAA8C" />
      </mesh>
    ))}
    <pointLight position={[0, 9, 4]} color="#FFE8C8" intensity={80} distance={26} decay={2} />
  </group>
);

/** Desert canyon edge at dusk: the rim runs along z = 0, the drop is toward −Z. A DANGER sign on the rim. */
export const Canyon: React.FC = () => (
  <group>
    <mesh position={[0, -0.5, 40]} receiveShadow>
      <BoxG args={[300, 1, 80]} />
      <Flat color="#B8744A" />
    </mesh>
    {Array.from({ length: 16 }, (_, i) => {
      const x = -60 + i * 8;
      const h = 30 + random(`cy${i}`) * 40;
      return (
        <mesh key={i} position={[x + random(`cx${i}`) * 4, -h / 2 - 1, -1.5 - random(`cz${i}`) * 3]} castShadow>
          <BoxG args={[8.5, h, 3 + random(`cd${i}`) * 3]} />
          <Flat color={i % 2 ? "#A8603A" : "#9A5432"} />
        </mesh>
      );
    })}
    {/* the far wall across the canyon, mesas */}
    {Array.from({ length: 8 }, (_, i) => (
      <mesh key={`f${i}`} position={[-70 + i * 22, -10 + random(`fh${i}`) * 6, -90 - random(`fz${i}`) * 30]} castShadow>
        <BoxG args={[20, 40 + random(`fy${i}`) * 20, 20]} />
        <Flat color={i % 2 ? "#B8744A" : "#C88A5A"} />
      </mesh>
    ))}
    <mesh position={[0, -70, -60]}>
      <BoxG args={[300, 2, 100]} />
      <Flat color="#5A3A2A" />
    </mesh>
    <HillRing radius={260} count={16} color="#8A5A42" y={-20} />
  </group>
);

export const drawSign = (lines: string[], bg = "#E0B04E", ink = "#141418") => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = ink;
  ctx.lineWidth = W * 0.03;
  ctx.strokeRect(W * 0.04, H * 0.06, W * 0.92, H * 0.88);
  lines.forEach((l, i) => {
    ctx.font = CANVAS_FONT(H * (i === 0 ? 0.3 : 0.18));
    fitText(ctx, l, W / 2, H * (i === 0 ? 0.36 : 0.72), W * 0.84, H * (i === 0 ? 0.3 : 0.18), ink);
  });
};

/** A sign on a post, face toward +Z, board centre at height `y`. */
export const PostSign: React.FC<{ position: V3; yaw?: number; lines: string[]; w?: number; h?: number; y?: number; bg?: string; ink?: string }> = ({
  position,
  yaw = 0,
  lines,
  w = 3.2,
  h = 2,
  y = 4.4,
  bg,
  ink,
}) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, y / 2, -0.12]} castShadow>
      <BoxG args={[0.22, y, 0.22]} />
      <Flat color="#4A4E58" />
    </mesh>
    <mesh position={[0, y, 0]} castShadow>
      <BoxG args={[w + 0.15, h + 0.15, 0.1]} />
      <Flat color="#2A2E36" />
    </mesh>
    <CanvasPanel position={[0, y, 0.06]} w={w} h={h} px={512} draw={drawSign(lines, bg, ink)} />
  </group>
);

/** A red toy brick with studs (the "feel pain" gag), base on the ground. */
export const ToyBrick: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.2, 0]} castShadow>
      <BoxG args={[0.9, 0.4, 0.45]} />
      <Flat color="#D8342A" />
    </mesh>
    {[-0.3, -0.1, 0.1, 0.3].flatMap((x) =>
      [-0.1, 0.1].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.44, z]}>
          <CylG args={[0.07, 0.07, 0.08, 8]} />
          <Flat color="#D8342A" />
        </mesh>
      )),
    )}
  </group>
);

/** Cartoon pain stars circling a point. */
export const PainStars: React.FC<{ at: V3; t: number; k: number }> = ({ at, t, k }) =>
  k <= 0 ? null : (
    <group position={at}>
      {Array.from({ length: 5 }, (_, i) => {
        const a = t * 5 + (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.9, 0.3 + Math.sin(a * 2) * 0.15, Math.sin(a) * 0.9]} rotation={[0, 0, a]} scale={k}>
            <octahedronGeometry args={[0.16, 0]} />
            <Glow color={i % 2 ? "#FFE07A" : "#FFBA58"} />
          </mesh>
        );
      })}
    </group>
  );

/** An electric fence with a HIGH VOLTAGE sign and crackling sparks along the top wire. Along X at z = 0. */
export const ElectricFence: React.FC<{ t: number }> = ({ t }) => (
  <group>
    {[-12, -6, 0, 6, 12].map((x) => (
      <mesh key={x} position={[x, 2.2, 0]} castShadow>
        <BoxG args={[0.25, 4.4, 0.25]} />
        <Flat color="#5A606E" />
      </mesh>
    ))}
    {[1.2, 2.2, 3.2, 4.2].map((y) => (
      <mesh key={y} position={[0, y, 0]}>
        <BoxG args={[24, 0.04, 0.04]} />
        <Glow color={y === 4.2 ? "#9FD8FF" : "#5A606E"} opacity={y === 4.2 ? 0.9 : 1} />
      </mesh>
    ))}
    {Array.from({ length: 6 }, (_, i) => {
      const on = random(`sp${i}${Math.floor(t * 12)}`) > 0.55;
      const x = -10 + i * 4 + random(`spx${i}${Math.floor(t * 6)}`) * 2;
      return on ? (
        <React.Fragment key={i}>
          <mesh position={[x, 4.2, 0]}>
            <octahedronGeometry args={[0.12, 0]} />
            <Glow color="#E8F4FF" />
          </mesh>
          <Halo position={[x, 4.2, 0.2]} size={1.6} color="#9FD8FF" opacity={0.7} />
        </React.Fragment>
      ) : null;
    })}
    <group position={[3, 0, 0.2]}>
      <mesh position={[0, 2.6, 0]}>
        <BoxG args={[3.2, 2.2, 0.08]} />
        <Flat color="#2A2E36" />
      </mesh>
      <CanvasPanel position={[0, 2.6, 0.05]} w={3} h={2} px={512} draw={drawSign(["⚡ DANGER", "HIGH VOLTAGE"], "#E0B04E")} />
    </group>
  </group>
);

/** A thought bubble with a little skull, drawn on a canvas (face +Z). */
export const drawSkullThought = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#F4F2EC";
  ctx.beginPath();
  ctx.ellipse(W * 0.5, H * 0.42, W * 0.46, H * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();
  [[0.22, 0.86, 0.07], [0.12, 0.95, 0.04]].forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(W * x, H * y, W * r, 0, Math.PI * 2);
    ctx.fill();
  });
  // skull
  const cx = W * 0.5;
  const cy = H * 0.4;
  ctx.fillStyle = "#2A2E36";
  ctx.beginPath();
  ctx.arc(cx, cy, W * 0.17, Math.PI, 0);
  ctx.lineTo(cx + W * 0.12, cy + H * 0.15);
  ctx.lineTo(cx - W * 0.12, cy + H * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#F4F2EC";
  [-1, 1].forEach((s) => {
    ctx.beginPath();
    ctx.arc(cx + s * W * 0.07, cy + H * 0.01, W * 0.045, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillRect(cx - W * 0.012, cy + H * 0.07, W * 0.024, H * 0.04);
  for (let i = -2; i <= 2; i++) ctx.fillRect(cx + i * W * 0.04 - W * 0.006, cy + H * 0.12, W * 0.012, H * 0.05);
};

/** The fear alarm: a red beacon dome on a base with a label. `on` 0..1 lights it and spins its beams. */
export const FearAlarm: React.FC<{ position: V3; t: number; on: number; scale?: number }> = ({ position, t, on, scale = 1 }) => {
  const a = t * 6;
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <CylG args={[1.5, 1.7, 1, 16]} />
        <Flat color="#2A2E36" />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <sphereGeometry args={[1.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {on > 0.05 ? <Glow color={new THREE.Color("#4A1A1A").lerp(new THREE.Color("#FF2A2A"), on).getStyle()} /> : <meshLambertMaterial color="#5A4A50" flatShading />}
      </mesh>
      {on > 0.05 ? (
        <>
          <Halo position={[0, 1.5, 0]} size={8 * on} color="#FF3A3A" opacity={0.7 * on} />
          {[0, Math.PI].map((o, i) => (
            <LightShaft key={i} from={[0, 1.6, 0]} to={[Math.cos(a + o) * 14, 0.2, Math.sin(a + o) * 14]} r0={0.3} r1={3} color="#FF4A4A" opacity={0.35 * on} />
          ))}
          <pointLight position={[0, 2.2, 0]} color="#FF3A3A" intensity={60 * on} distance={20} decay={2} />
        </>
      ) : null}
      <CanvasPanel
        position={[0, 0.5, 1.72]}
        w={2.6}
        h={0.6}
        px={384}
        glow
        draw={(ctx, W, H) => {
          ctx.fillStyle = "#14181F";
          ctx.fillRect(0, 0, W, H);
          ctx.font = CANVAS_FONT(H * 0.5);
          fitText(ctx, on > 0.5 ? "FEAR: ON" : "FEAR: OFF", W / 2, H * 0.56, W * 0.9, H * 0.5, on > 0.5 ? "#FF5A5A" : "#6A7080");
        }}
      />
    </group>
  );
};

/** A water column on a plinth with a little fish swimming in it (the first rung of the evolution line). */
export const FishTank: React.FC<{ position: V3; t: number }> = ({ position, t }) => (
  <group position={position}>
    <mesh position={[0, 2.1, 0]}>
      <CylG args={[1.0, 1.0, 2.6, 16]} />
      <meshBasicMaterial color="#3A8AD8" transparent opacity={0.28} depthWrite={false} toneMapped={false} />
    </mesh>
    <group position={[Math.sin(t * 1.5) * 0.4, 2.2 + Math.sin(t * 2.2) * 0.15, Math.cos(t * 1.5) * 0.3]} rotation={[0, Math.cos(t * 1.5) > 0 ? 0 : Math.PI, 0]}>
      <mesh rotation={[0, 0, -Math.PI / 2]} scale={[0.6, 1, 0.5]}>
        <ConeG args={[0.35, 1.0, 6]} />
        <Flat color="#E0904E" />
      </mesh>
      <mesh position={[-0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.6, 0.2]}>
        <ConeG args={[0.3, 0.4, 4]} />
        <Flat color="#C87A3A" />
      </mesh>
      <mesh position={[0.32, 0.06, 0]}>
        <IcoG args={[0.03, 0]} />
        <Glow color="#FF3A3A" />
      </mesh>
    </group>
  </group>
);
