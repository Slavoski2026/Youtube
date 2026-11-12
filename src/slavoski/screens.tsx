/**
 * HTML on 3D screens (TVs, phones, billboards, ATMs, signs), crisp and steady.
 *
 * The content is laid out ONCE at a fixed design size (e.g. 1000 px wide) and mapped onto the
 * screen's four projected corners with a CSS perspective transform (a homography as `matrix3d`).
 * Text never re-flows as the camera moves, so it doesn't shimmer or jitter frame to frame, and the
 * perspective matches the 3D screen exactly. (Sizing the HTML to the projected bounding box every
 * frame, as `tvScreenRect` does, makes text wobble: avoid it for new work.)
 */
import React, { useContext, useMemo } from "react";
import * as THREE from "three";
import type { V3 } from "./noise";
import { GlowBoost } from "./postfx";
import { project, type CameraSpec } from "./Stage";

type Pt = { x: number; y: number };

/** CSS matrix3d mapping a W×H box onto a quad (corners: top-left, top-right, bottom-right, bottom-left). */
export const quadMatrix = (W: number, H: number, q: [Pt, Pt, Pt, Pt]): string => {
  const [p0, p1, p2, p3] = q;
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const dy3 = p0.y - p1.y + p2.y - p3.y;
  let g = 0;
  let h = 0;
  const det = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(det) > 1e-9 && (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9)) {
    g = (dx3 * dy2 - dx2 * dy3) / det;
    h = (dx1 * dy3 - dx3 * dy1) / det;
  }
  const a = p1.x - p0.x + g * p1.x;
  const b = p3.x - p0.x + h * p3.x;
  const c = p0.x;
  const d = p1.y - p0.y + g * p1.y;
  const e = p3.y - p0.y + h * p3.y;
  const f = p0.y;
  // Unit square → W×H box: divide the u (x) column by W and the v (y) column by H.
  const m = [a / W, d / W, 0, g / W, b / H, e / H, 0, h / H, 0, 0, 1, 0, c, f, 0, 1];
  return `matrix3d(${m.join(",")})`;
};

/**
 * World corners of a w×h screen centred at `c`: upright facing +Z rotated by `yaw`, or lying flat
 * facing +Y (`flat`, top edge toward −Z).
 */
export const screenCorners = (c: V3, w: number, h: number, yaw = 0, flat = false): [V3, V3, V3, V3] => {
  const cs = Math.cos(yaw);
  const sn = Math.sin(yaw);
  const at = (dx: number, dy: number): V3 => (flat ? [c[0] + dx, c[1], c[2] - dy] : [c[0] + dx * cs, c[1] + dy, c[2] - dx * sn]);
  return [at(-w / 2, h / 2), at(w / 2, h / 2), at(w / 2, -h / 2), at(-w / 2, -h / 2)];
};

/** Design width of screen content in CSS px; the height follows the screen's aspect ratio. */
export const SCREEN_DESIGN_W = 1000;

/**
 * Pins `children(W, H)` (laid out at a fixed W×H) onto a 3D screen for this camera. Use the same
 * camera spec the shot's Stage uses (without shake, or the overlay will drift from the screen).
 */
export const ScreenHtml: React.FC<{
  c: V3;
  w: number;
  h: number;
  yaw?: number;
  flat?: boolean;
  cam: CameraSpec;
  width: number;
  height: number;
  designW?: number;
  children: (W: number, H: number) => React.ReactNode;
}> = ({ c, w, h, yaw = 0, flat = false, cam, width, height, designW = SCREEN_DESIGN_W, children }) => {
  const W = designW;
  const H = Math.round((designW * h) / w);
  const q = screenCorners(c, w, h, yaw, flat).map((p) => project(p, cam, width, height)) as [Pt, Pt, Pt, Pt];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, overflow: "hidden", transformOrigin: "0 0", transform: quadMatrix(W, H, q) }}>
        {children(W, H)}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- 3D signs (occludable)


/** House font for canvas drawing (loaded by loadHouseFonts before any frame renders). */
export const CANVAS_FONT = (px: number, bold = true) => `${bold ? 700 : 400} ${Math.round(px)}px "Slavoski Sans", "DejaVu Sans", sans-serif`;

/** Draws `text` centred in a box, shrinking the font until it fits the box width. */
export const fitText = (ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, maxW: number, size: number, color: string, bold = true) => {
  let px = size;
  ctx.font = CANVAS_FONT(px, bold);
  while (px > 8 && ctx.measureText(text).width > maxW) {
    px *= 0.94;
    ctx.font = CANVAS_FONT(px, bold);
  }
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy);
};

/**
 * A real 3D panel (plane facing +Z) textured from a 2D canvas you draw on. Unlike HTML overlays it is
 * part of the scene: characters in front of it hide it, and it never shimmers. `draw` runs every
 * render, so it can animate (flashing, counting, a chart drawing in). Unlit, so it reads as a lit sign.
 */
export const CanvasPanel: React.FC<{
  position: V3;
  rotation?: V3;
  w: number;
  h: number;
  /** Canvas width in px (height follows the aspect ratio). */
  px?: number;
  draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => void;
  fog?: boolean;
  /** A lit screen: slightly over-bright under post-processing so it blooms (no effect without FX). */
  glow?: boolean;
}> = ({ position, rotation = [0, 0, 0], w, h, px = 1024, draw, fog = true, glow = false }) => {
  const boost = useContext(GlowBoost);
  const tint = useMemo(() => new THREE.Color(1, 1, 1).multiplyScalar(glow && boost > 1 ? 1.18 : 1), [glow, boost]);
  const W = px;
  const H = Math.max(8, Math.round((px * h) / w));
  const { canvas, tex } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return { canvas, tex };
  }, [W, H]);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, W, H);
    draw(ctx, W, H);
    tex.needsUpdate = true;
  }
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} color={tint} toneMapped={false} fog={fog} />
    </mesh>
  );
};
