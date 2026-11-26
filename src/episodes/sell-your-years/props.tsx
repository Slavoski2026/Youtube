/**
 * Sets and props for "What If You Could Sell Years of Your Life?" (ep. 8).
 * Years are drawn as glowing amber hourglass sand. "LIFEBANK" is our own invented brand (an hourglass
 * logo): no real bank, no real logos. Everything rests on y = 0 using its real extents.
 */
import React from "react";
import { random } from "remotion";
import { Building, Car, Road } from "../../slavoski/city";
import { BoxG, CircleG, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { FONT } from "../../slavoski/fonts";
import { crowdLook, suitLook, type HeroLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { clamp01, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { CANVAS_FONT, CanvasPanel, fitText } from "../../slavoski/screens";
import { CITY, PHONE } from "../ww3-countdown/props";

export { CITY, PHONE };

// ================================================================ colours and looks

export const SAND = "#FFC45C";
export const GOLD = "#D9AE3A";
export const LB_TEAL = "#2FC4B2";
export const LB_NAVY = "#0E1A3A";
export const OK_GREEN = "#3FBF7F";
export const LOSS_RED = "#FF5A4A";

/** The billionaire: a dark suit with a gold zip line, silver-grey hair. Same rig as Slavoski. */
export const RICH: HeroLook = { ...suitLook(3), skin: "#E0AC84", skinShade: "#C48E68", hair: "#C9C4BA", zipper: GOLD };
/** Generic people (never orange jackets). */
export const folk = (seed: number): HeroLook => crowdLook(seed);
/** Children are the hero rig at this scale (≈ 2.5 tall). */
export const KID = 0.6;

const money = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;
export const fmtMoney = money;

// ================================================================ hourglass

/**
 * An hourglass standing on y = 0, 1 unit tall at scale 1 (use `scale`). `fill` = share of the sand still in
 * the top bulb (1 = a full life ahead, 0 = run out). The sand glows: it is the years themselves.
 */
export const Hourglass: React.FC<{ position?: V3; scale?: number; fill?: number; flowing?: boolean; frame?: string; simple?: boolean; halo?: number; rotation?: V3 }> = ({
  position = [0, 0, 0],
  scale = 1,
  fill = 0.6,
  flowing = true,
  frame = GOLD,
  simple = false,
  halo = 0,
  rotation = [0, 0, 0],
}) => {
  const f = clamp01(fill);
  const topH = 0.38 * Math.cbrt(f);
  const botH = 0.36 * Math.cbrt(1 - f);
  return (
    <group position={position} scale={scale} rotation={rotation}>
      {[0.04, 0.96].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <CylG args={[0.4, 0.4, 0.08, 10]} />
          <Flat color={frame} />
        </mesh>
      ))}
      {!simple
        ? [0, 1, 2].map((i) => {
            const a = (i / 3) * Math.PI * 2 + 0.4;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.34, 0.5, Math.sin(a) * 0.34]} castShadow>
                <CylG args={[0.028, 0.028, 0.84, 6]} />
                <Flat color={frame} />
              </mesh>
            );
          })
        : null}
      {/* sand: a heap in the bottom bulb, an inverted cone in the top bulb, a thin stream between */}
      {botH > 0.01 ? (
        <mesh position={[0, 0.08 + botH / 2, 0]}>
          <ConeG args={[0.27, botH, 10]} />
          <Glow color={SAND} />
        </mesh>
      ) : null}
      {topH > 0.01 ? (
        <mesh position={[0, 0.5 + topH / 2, 0]} rotation={[Math.PI, 0, 0]}>
          <ConeG args={[0.28 * (topH / 0.38) + 0.02, topH, 10]} />
          <Glow color={SAND} />
        </mesh>
      ) : null}
      {flowing && f > 0.005 && !simple ? (
        <mesh position={[0, 0.08 + botH + (0.42 - botH) / 2, 0]}>
          <CylG args={[0.012, 0.012, Math.max(0.01, 0.42 - botH), 4]} />
          <Glow color={SAND} />
        </mesh>
      ) : null}
      {/* glass: two cones meeting at the neck */}
      <mesh position={[0, 0.29, 0]}>
        <ConeG args={[0.3, 0.42, 10, 1, true]} />
        <Flat color="#CFE8FF" opacity={0.22} />
      </mesh>
      <mesh position={[0, 0.71, 0]} rotation={[Math.PI, 0, 0]}>
        <ConeG args={[0.3, 0.42, 10, 1, true]} />
        <Flat color="#CFE8FF" opacity={0.22} />
      </mesh>
      {halo > 0 ? <Halo position={[0, 0.5, 0]} size={2.2} color={SAND} opacity={halo} /> : null}
    </group>
  );
};

/** The hourglass as a flat icon on a 2D canvas (the LIFEBANK logo). */
export const drawHourglassIcon = (ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string, fill = 0.55) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = s * 0.09;
  ctx.lineJoin = "round";
  const w = s * 0.42;
  const h = s * 0.5;
  ctx.fillRect(cx - w - s * 0.06, cy - h - s * 0.06, (w + s * 0.06) * 2, s * 0.08);
  ctx.fillRect(cx - w - s * 0.06, cy + h - s * 0.02, (w + s * 0.06) * 2, s * 0.08);
  ctx.beginPath();
  ctx.moveTo(cx - w, cy - h);
  ctx.lineTo(cx + w, cy - h);
  ctx.lineTo(cx + s * 0.05, cy);
  ctx.lineTo(cx + w, cy + h);
  ctx.lineTo(cx - w, cy + h);
  ctx.lineTo(cx - s * 0.05, cy);
  ctx.closePath();
  ctx.stroke();
  // sand: top triangle shrinks with fill, bottom heap grows
  const tf = Math.sqrt(clamp01(fill));
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.78 * tf, cy - h * 0.86 * tf);
  ctx.lineTo(cx + w * 0.78 * tf, cy - h * 0.86 * tf);
  ctx.lineTo(cx, cy - h * 0.06);
  ctx.closePath();
  ctx.fill();
  const bf = Math.sqrt(1 - clamp01(fill));
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.85, cy + h * 0.92);
  ctx.lineTo(cx + w * 0.85, cy + h * 0.92);
  ctx.lineTo(cx, cy + h * (0.92 - 0.8 * bf));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

/** "LIFEBANK" wordmark with the hourglass, on a dark panel. */
export const drawLifebankSign = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = LB_NAVY;
  ctx.fillRect(0, 0, W, H);
  drawHourglassIcon(ctx, W * 0.14, H / 2, H * 0.62, SAND, 0.6);
  ctx.font = CANVAS_FONT(H * 0.52);
  fitText(ctx, "LIFEBANK", W * 0.58, H / 2 + H * 0.03, W * 0.7, H * 0.56, "#FFFFFF");
};

// ================================================================ screens (canvas)

export type KioskScreen =
  | { mode: "off" }
  | { mode: "idle"; t: number }
  | { mode: "offer"; years: number; amount: number; k: number; t: number; buttons?: boolean; hover?: number }
  | { mode: "transfer"; years: number; k: number; t: number; to: string };

/** The LIFEBANK kiosk screen. */
export const drawKiosk = (s: KioskScreen) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  if (s.mode === "off") {
    ctx.fillStyle = "#0B0E18";
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#14244C");
  g.addColorStop(1, "#070D22");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // header
  drawHourglassIcon(ctx, W * 0.07, H * 0.1, H * 0.1, SAND, 0.6);
  ctx.font = CANVAS_FONT(H * 0.065);
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("LIFEBANK", W * 0.12, H * 0.105);
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(W * 0.04, H * 0.18, W * 0.92, 3);
  if (s.mode === "idle") {
    const pulse = 0.7 + 0.3 * Math.sin(s.t * 5);
    fitText(ctx, "SELL YOUR TIME", W / 2, H * 0.46, W * 0.86, H * 0.15, "#FFFFFF");
    ctx.globalAlpha = pulse;
    fitText(ctx, "CASH IN MINUTES", W / 2, H * 0.66, W * 0.7, H * 0.08, SAND);
    ctx.globalAlpha = 1;
    return;
  }
  if (s.mode === "transfer") {
    fitText(ctx, `SELLING ${s.years} YEARS`, W / 2, H * 0.36, W * 0.86, H * 0.12, "#FFFFFF");
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(W * 0.1, H * 0.52, W * 0.8, H * 0.07);
    ctx.fillStyle = SAND;
    ctx.fillRect(W * 0.1, H * 0.52, W * 0.8 * clamp01(s.k), H * 0.07);
    fitText(ctx, s.to, W / 2, H * 0.74, W * 0.84, H * 0.075, LB_TEAL);
    return;
  }
  // offer
  fitText(ctx, `SELL ${s.years} YEARS OF YOUR LIFE`, W / 2, H * (s.buttons ? 0.3 : 0.34), W * 0.88, H * 0.085, "#FFFFFF");
  fitText(ctx, "YOU RECEIVE", W / 2, H * (s.buttons ? 0.42 : 0.47), W * 0.5, H * 0.05, "rgba(255,255,255,0.6)");
  const amount = s.k >= 1 ? s.amount : Math.round((s.amount * s.k) / 1000) * 1000;
  // k < 0: the amount is still hidden, blinking question marks
  const shown = s.k < 0 ? (Math.sin(s.t * 9) > 0 ? "£ ? ? ?" : "£ ? ? ? ") : money(amount);
  fitText(ctx, shown, W / 2, H * (s.buttons ? 0.56 : 0.64), W * 0.9, H * 0.2, SAND);
  if (s.buttons) {
    const hover = s.hover ?? 0;
    const bw = W * 0.38;
    const bh = H * 0.15;
    const by = H * 0.74;
    ctx.fillStyle = OK_GREEN;
    ctx.globalAlpha = 0.75 + 0.25 * hover;
    ctx.fillRect(W * 0.08, by, bw, bh);
    ctx.globalAlpha = 1;
    if (hover > 0) {
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 6 * hover;
      ctx.strokeRect(W * 0.08 - 4, by - 4, bw + 8, bh + 8);
    }
    fitText(ctx, "ACCEPT", W * 0.08 + bw / 2, by + bh / 2 + 2, bw * 0.8, bh * 0.5, "#FFFFFF");
    ctx.fillStyle = "#3A3F55";
    ctx.fillRect(W * 0.54, by, bw, bh);
    fitText(ctx, "DECLINE", W * 0.54 + bw / 2, by + bh / 2 + 2, bw * 0.8, bh * 0.5, "rgba(255,255,255,0.8)");
  }
};

/** The ATM screen: account balance £10.00 (a generic bank UI, no real brand). */
export const drawAtm = (t: number, flicker = 0) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#1C4C6E");
  g.addColorStop(1, "#0C2238");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1 - flicker * 0.4;
  fitText(ctx, "ACCOUNT BALANCE", W / 2, H * 0.22, W * 0.7, H * 0.08, "rgba(255,255,255,0.7)");
  fitText(ctx, "£10.00", W / 2, H * 0.5, W * 0.8, H * 0.3, "#FFFFFF");
  ctx.fillStyle = LOSS_RED;
  ctx.globalAlpha = 0.6 + 0.4 * Math.abs(Math.sin(t * 3));
  fitText(ctx, "LOW BALANCE", W / 2, H * 0.78, W * 0.5, H * 0.07, LOSS_RED);
  ctx.globalAlpha = 1;
};

/** A portrait market board where one year of life climbs to the top: the most valuable thing you can trade. */
export const drawExchange = (k: number, t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0A0F22";
  ctx.fillRect(0, 0, W, H);
  fitText(ctx, "WORLD EXCHANGE", W / 2, H * 0.07, W * 0.8, H * 0.045, "rgba(255,255,255,0.65)");
  const rows: { name: string; price: string }[] = [
    { name: "GOLD  ·  1 KG", price: "£61,240" },
    { name: "HOUSE", price: "£289,000" },
    { name: "OIL  ·  1 BARREL", price: "£64" },
  ];
  const rowH = H * 0.19;
  const top = H * 0.13;
  const yearSlot = 3 - 3 * k; // 3 = bottom … 0 = top
  const small = Math.min(rowH * 0.24, W * 0.07);
  const big = Math.min(rowH * 0.4, W * 0.12);
  const row = (y: number, name: string, price: string, color: string, arrow: string, nameColor: string, icon: boolean) => {
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const x0 = icon ? W * 0.2 : W * 0.08;
    if (icon) drawHourglassIcon(ctx, W * 0.1, y + rowH / 2, rowH * 0.5, SAND, 0.5 + 0.1 * Math.sin(t * 2));
    ctx.font = CANVAS_FONT(small);
    ctx.fillStyle = nameColor;
    ctx.fillText(name, x0, y + rowH * 0.3);
    ctx.font = CANVAS_FONT(big);
    ctx.fillStyle = color;
    ctx.fillText(price, x0, y + rowH * 0.66);
    ctx.textAlign = "right";
    ctx.fillText(arrow, W * 0.93, y + rowH * 0.66);
  };
  rows.forEach((r, i) => {
    const y = top + (i + clamp01(i + 1 - yearSlot)) * rowH;
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(W * 0.04, y + 6, W * 0.92, rowH - 12);
    row(y, r.name, r.price, LOSS_RED, "▼", "rgba(255,255,255,0.8)", false);
  });
  const yy = top + yearSlot * rowH;
  ctx.fillStyle = "#2A2412";
  ctx.fillRect(W * 0.03, yy + 4, W * 0.94, rowH - 8);
  ctx.strokeStyle = SAND;
  ctx.lineWidth = 6;
  ctx.strokeRect(W * 0.03, yy + 4, W * 0.94, rowH - 8);
  row(yy, "1 YEAR OF LIFE", `£${Math.round(100000 + Math.sin(t * 3) * 900).toLocaleString("en-GB")}`, OK_GREEN, "▲", SAND, true);
  if (k > 0.95) fitText(ctx, "MOST VALUABLE ASSET ON EARTH", W / 2, H * 0.93, W * 0.9, H * 0.04, SAND);
};

/** A debt letter on a table, stamped PAID when `stamp` > 0. */
export const drawBill = (stamp: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#F2EEE4";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#C8372D";
  ctx.fillRect(0, 0, W, H * 0.12);
  fitText(ctx, "FINAL NOTICE", W / 2, H * 0.065, W * 0.7, H * 0.07, "#FFFFFF");
  ctx.fillStyle = "#3A3F55";
  for (let i = 0; i < 6; i++) ctx.fillRect(W * 0.1, H * (0.2 + i * 0.06), W * (0.5 + 0.3 * random(`bl${i}`)), H * 0.022);
  fitText(ctx, "AMOUNT OWED", W / 2, H * 0.62, W * 0.6, H * 0.05, "#3A3F55");
  fitText(ctx, "£38,450", W / 2, H * 0.73, W * 0.7, H * 0.12, "#1A1A22");
  if (stamp > 0) {
    ctx.save();
    ctx.translate(W / 2, H * 0.5);
    ctx.rotate(-0.22);
    const sc = 1 + (1 - clamp01(stamp)) * 0.8;
    ctx.scale(sc, sc);
    ctx.globalAlpha = clamp01(stamp * 1.4);
    ctx.strokeStyle = "#2E9A5E";
    ctx.lineWidth = W * 0.02;
    ctx.strokeRect(-W * 0.36, -H * 0.11, W * 0.72, H * 0.22);
    fitText(ctx, "PAID", 0, 0, W * 0.6, H * 0.17, "#2E9A5E");
    ctx.restore();
  }
};

/** A simple label panel (signs). */
export const drawPanel = (text: string, bg: string, color: string, size = 0.6) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  fitText(ctx, text, W / 2, H / 2 + H * 0.04, W * 0.88, H * size, color);
};

// ================================================================ the LIFEBANK kiosk

/** Freestanding kiosk facing +Z, base on y = 0. Screen at eye height for Slavoski (eyes ≈ 3.55). */
export const KIOSK = { w: 2.2, h: 5.4, d: 1.0, screenY: 3.75, screenW: 1.6, screenH: 1.18, padY: 2.45, padZ: 0.78 };

/** World point of the kiosk scan pad's top centre, for a kiosk at `at`. */
export const kioskPad = (at: V3): V3 => [at[0], at[1] + KIOSK.padY + 0.07, at[2] + KIOSK.padZ];
export const kioskScreen = (at: V3): V3 => [at[0], at[1] + KIOSK.screenY, at[2] + KIOSK.d / 2 + 0.006];

export const LifeKiosk: React.FC<{ position: V3; yaw?: number; on?: number; screen: KioskScreen; t: number; padGlow?: number }> = ({ position, yaw = 0, on = 1, screen, t, padGlow = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, KIOSK.h / 2, 0]} castShadow receiveShadow>
      <BoxG args={[KIOSK.w, KIOSK.h, KIOSK.d]} />
      <Flat color="#E4E8EE" />
    </mesh>
    {/* teal side strips */}
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * (KIOSK.w / 2 + 0.005), KIOSK.h / 2, 0.2]} rotation={[0, s * Math.PI / 2, 0]}>
        <planeGeometry args={[0.18, KIOSK.h * 0.9]} />
        {on > 0.5 ? <Glow color={LB_TEAL} /> : <Flat color="#5A6A70" />}
      </mesh>
    ))}
    {/* screen bezel + screen */}
    <mesh position={[0, KIOSK.screenY, KIOSK.d / 2 - 0.01]}>
      <BoxG args={[KIOSK.screenW + 0.16, KIOSK.screenH + 0.16, 0.06]} />
      <Flat color="#1A1C26" />
    </mesh>
    <CanvasPanel position={[0, KIOSK.screenY, KIOSK.d / 2 + 0.026]} w={KIOSK.screenW} h={KIOSK.screenH} draw={drawKiosk(on > 0.5 ? screen : { mode: "off" })} />
    {/* scan pad: a shelf with a glowing palm plate */}
    <mesh position={[0, KIOSK.padY, KIOSK.padZ - 0.1]} castShadow>
      <BoxG args={[0.8, 0.12, 0.56]} />
      <Flat color="#3A3E48" />
    </mesh>
    <mesh position={[0, KIOSK.padY + 0.065, KIOSK.padZ - 0.08]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.6, 0.4]} />
      <Glow color={on > 0.5 ? (padGlow > 0 ? "#7CFFB8" : "#2E9A5E") : "#2A2E38"} />
    </mesh>
    {/* LIFEBANK sign and the glowing hourglass on top */}
    <CanvasPanel position={[0, KIOSK.h - 0.42, KIOSK.d / 2 + 0.006]} w={KIOSK.w - 0.2} h={0.5} draw={drawLifebankSign} />
    <Hourglass position={[0, KIOSK.h, 0]} scale={1.1} fill={0.55 + 0.05 * Math.sin(t)} halo={on > 0.5 ? 0.55 * on : 0} />
    {on > 0.5 ? <pointLight position={[0, KIOSK.screenY, KIOSK.d / 2 + 1.6]} color="#9FD8FF" intensity={6 * on} distance={9} decay={2} /> : null}
    {on > 0.5 ? <Halo position={[0, KIOSK.screenY, KIOSK.d / 2 + 0.1]} size={4.2} color="#6FB8FF" opacity={0.28 * on} /> : null}
  </group>
);

// ================================================================ the cash street (hook + ending)

/** The ATM (housing ×1.5 so its screen sits at eye height) in a bank wall whose face is at z = -0.4. */
export const ATM = { c: [0, 3.9, 0.405] as V3, w: 1.2, h: 0.93 };
export const KIOSK_AT: V3 = [5.4, 0, 0.6];

const Puddle: React.FC<{ position: V3; r: number; sky: string }> = ({ position, r, sky }) => (
  <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.55, 1]}>
    <CircleG args={[r, 14]} />
    <Flat color={sky} opacity={0.55} />
  </mesh>
);

/**
 * The street of the hook and the ending: a bank wall (face at z = -0.4) with the ATM at x = 0 and the
 * LIFEBANK kiosk at `KIOSK_AT`, pavement to z ≈ 5, the road beyond, a row of buildings across the street.
 */
export const CashStreet: React.FC<{ t: number; kioskOn?: number; kiosk?: KioskScreen; atmFlicker?: number; puddleSky?: string; power?: number; padGlow?: number }> = ({
  t,
  kioskOn = 1,
  kiosk = { mode: "idle", t: 0 },
  atmFlicker = 0,
  puddleSky = "#8A94A6",
  power = 0.6,
  padGlow = 0,
}) => (
  <group>
    <mesh position={[0, -0.05, 2]} receiveShadow>
      <boxGeometry args={[160, 0.1, 6]} />
      <meshLambertMaterial color={P.pavement} flatShading />
    </mesh>
    <mesh position={[0, 0.06, 4.9]} receiveShadow>
      <BoxG args={[160, 0.12, 0.3]} />
      <Flat color="#4A4F65" />
    </mesh>
    <group scale={CITY}>
      <Building position={[0, 0, -0.114 - 2]} w={4.6} d={4} h={13} color={P.bldgSlate} seed="bank" litRatio={0.25} power={power} />
      <Building position={[-5.1, 0, -0.2 - 2]} w={4.4} d={4} h={9} color={P.bldgPurple} seed="bank2" litRatio={0.3} power={power} />
      <Building position={[5.2, 0, -0.2 - 2]} w={4.8} d={4} h={16} color={P.bldgNavy} seed="bank3" litRatio={0.3} power={power} />
      <Building position={[-10.4, 0, -0.2 - 2]} w={5} d={4} h={12} color={P.bldgTeal} seed="bank4" litRatio={0.3} power={power} />
      <Building position={[10.6, 0, -0.2 - 2]} w={4.6} d={4} h={10} color={P.bldgIndigo} seed="bank5" litRatio={0.3} power={power} />
      <Road position={[0, 0.002, 4.5]} width={7} length={60} yaw={Math.PI / 2} />
      <Car position={[-5.2, 0, 2.8]} yaw={Math.PI / 2} color={P.carTeal} />
      <Car position={[4.2, 0, 6.2]} yaw={-Math.PI / 2} color={P.carRed} />
      {/* across the street */}
      {[-12, -6.5, -1.2, 4.4, 10.2].map((x, i) => (
        <Building key={x} position={[x, 0, 11.5]} w={4.6} d={4} h={8 + ((i * 7) % 9)} color={[P.bldgPurple, P.bldgNavy, P.bldgTeal, P.bldgSlate, P.bldgIndigo][i]} seed={`across${i}`} yaw={Math.PI} power={power} />
      ))}
    </group>
    {/* ATM housing */}
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
    <CanvasPanel position={[ATM.c[0], ATM.c[1], ATM.c[2] + 0.004]} w={ATM.w} h={ATM.h} px={768} draw={drawAtm(t, atmFlicker)} />
    <mesh position={[-3.4, 0.6, 1.0]} castShadow>
      <CylG args={[0.4, 0.34, 1.2, 8]} />
      <Flat color="#2E5A6A" />
    </mesh>
    <LifeKiosk position={KIOSK_AT} on={kioskOn} screen={kiosk} t={t} padGlow={padGlow} />
    <Puddle position={[1.6, 0.012, 2.6]} r={1.1} sky={puddleSky} />
    <Puddle position={[-2.2, 0.012, 3.6]} r={0.8} sky={puddleSky} />
    <Puddle position={[7.6, 0.012, 3.2]} r={1.3} sky={puddleSky} />
  </group>
);

// ================================================================ LIFEBANK branch (queue)

/** A LIFEBANK branch whose front faces -X at x = `x`, centred on z = `z` (16 wide, 11 tall). */
export const LifeBankFront: React.FC<{ x: number; z: number; t: number }> = ({ x, z, t }) => (
  <group>
    <mesh position={[x + 4, 5.5, z]} castShadow receiveShadow>
      <BoxG args={[8, 11, 16]} />
      <Flat color="#E4E8EE" />
    </mesh>
    <mesh position={[x - 0.01, 2.6, z]} rotation={[0, -Math.PI / 2, 0]}>
      <planeGeometry args={[3.4, 5.2]} />
      <Glow color="#BFE3FF" />
    </mesh>
    {[-5, 5].map((dz) => (
      <mesh key={dz} position={[x - 0.01, 3.4, z + dz]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[4, 4.2]} />
        <Glow color="#8FD0E8" />
      </mesh>
    ))}
    <mesh position={[x - 0.02, 0.6, z]} rotation={[0, -Math.PI / 2, 0]}>
      <planeGeometry args={[15.6, 0.3]} />
      <Glow color={LB_TEAL} />
    </mesh>
    <CanvasPanel position={[x - 0.03, 8.4, z]} rotation={[0, -Math.PI / 2, 0]} w={11} h={2.2} draw={drawLifebankSign} />
    <CanvasPanel position={[x - 0.03, 3.4, z + 5]} rotation={[0, -Math.PI / 2, 0]} w={3.6} h={1.4} draw={drawPanel("1 YEAR = £100,000", LB_NAVY, SAND, 0.5)} />
    <Hourglass position={[x - 1.2, 11, z]} scale={3} fill={0.55 + 0.04 * Math.sin(t)} halo={0.5} />
  </group>
);

// ================================================================ light beams from LIFEBANK roofs (aerial)

export const Beacon: React.FC<{ position: V3; h?: number; r?: number; color?: string; k?: number }> = ({ position, h = 60, r = 1.2, color = SAND, k = 1 }) =>
  k <= 0 ? null : (
    <group position={position}>
      <mesh position={[0, (h * k) / 2, 0]}>
        <CylG args={[r * 0.6, r, h * k, 8, 1, true]} />
        <Glow color={color} opacity={0.35} additive />
      </mesh>
      <Halo position={[0, 0.8, 0]} size={r * 9} color={color} opacity={0.6} />
    </group>
  );

// ================================================================ showroom (supercar)

export const Showroom: React.FC<{ spin: number }> = ({ spin }) => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <boxGeometry args={[80, 0.1, 60]} />
      <Flat color="#23252F" />
    </mesh>
    {/* glass wall with the sunset behind, mullions */}
    <mesh position={[0, 9, -14]}>
      <planeGeometry args={[80, 18]} />
      <Glow color="#F2A06A" />
    </mesh>
    <mesh position={[0, 3.2, -13.9]}>
      <planeGeometry args={[80, 6.4]} />
      <Glow color="#C46A58" />
    </mesh>
    {Array.from({ length: 11 }, (_, i) => (
      <mesh key={i} position={[-30 + i * 6, 9, -13.8]}>
        <BoxG args={[0.35, 18, 0.35]} />
        <Flat color="#1A1C26" />
      </mesh>
    ))}
    <mesh position={[0, 18, -6]}>
      <BoxG args={[80, 0.6, 18]} />
      <Flat color="#2A2D3A" />
    </mesh>
    {/* turntable */}
    <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
      <CylG args={[6.6, 6.8, 0.3, 24]} />
      <Flat color="#4A4F65" />
    </mesh>
    <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[6.3, 6.5, 40]} />
      <Glow color={SAND} />
    </mesh>
    <group position={[0, 0.3, 0]} rotation={[0, spin, 0]} scale={2.6}>
      <Car position={[0, 0, 0]} yaw={0} color="#D9AE3A" sporty />
    </group>
    {/* price stand */}
    <mesh position={[7.6, 1.1, 3.2]} castShadow>
      <CylG args={[0.08, 0.08, 2.2, 6]} />
      <Flat color="#1A1C26" />
    </mesh>
    <CanvasPanel position={[7.6, 2.5, 3.2]} rotation={[0, -0.4, 0]} w={2.4} h={0.9} draw={drawPanel("£2,400,000", "#1A1C26", SAND, 0.5)} />
    <Halo position={[-4, 14, 0]} size={10} color="#FFE9C0" opacity={0.25} />
    <Halo position={[4, 14, 0]} size={10} color="#FFE9C0" opacity={0.25} />
  </group>
);

// ================================================================ private island

export const Island: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <mesh position={[0, 0, 0]} receiveShadow>
      <CylG args={[17, 21, 2, 18]} />
      <Flat color="#E2C892" />
    </mesh>
    <mesh position={[0, 1.15, -1]} receiveShadow>
      <CylG args={[11, 13, 0.4, 16]} />
      <Flat color="#4F8F4A" />
    </mesh>
    {/* the villa: white walls, teal roof */}
    <group position={[0, 1.3, -3]}>
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <BoxG args={[10, 5, 6]} />
        <Flat color="#F2EEE6" />
      </mesh>
      <mesh position={[2.5, 6, 0]} castShadow>
        <BoxG args={[5, 2, 5]} />
        <Flat color="#F2EEE6" />
      </mesh>
      {[-3, 0, 3].map((x) => (
        <mesh key={x} position={[x, 2.4, 3.01]}>
          <planeGeometry args={[1.8, 2.2]} />
          <Glow color={P.windowLit} />
        </mesh>
      ))}
      <mesh position={[0, 0.1, 5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 3]} />
        <Glow color="#4FC3C8" />
      </mesh>
    </group>
    {[
      [-9, 1.3, 4],
      [8, 1.3, 5],
      [-11, 1.3, -6],
      [10, 1.3, -5],
      [-5, 1.3, 9],
      [12, 1.3, 2],
    ].map((p, i) => (
      <PalmLite key={i} position={p as V3} height={6 + (i % 3)} seed={`isl${i}`} sway={Math.sin(t * 1.3 + i) * 0.4} />
    ))}
    {/* FOR SALE sign on the beach */}
    {[-1.6, 1.6].map((x) => (
      <mesh key={x} position={[x, 2.4, 14]} castShadow>
        <BoxG args={[0.18, 3, 0.18]} />
        <Flat color="#5A3A28" />
      </mesh>
    ))}
    <CanvasPanel position={[0, 3.4, 14.1]} w={4.4} h={1.5} draw={drawPanel("FOR SALE", "#F2EEE6", "#C8372D", 0.62)} />
  </group>
);

/** A light palm (trunk segments + fronds) for the island. */
const PalmLite: React.FC<{ position: V3; height?: number; seed?: string; sway?: number }> = ({ position, height = 6, seed = "palm", sway = 0 }) => {
  const lean = 0.12 + random(`${seed}l`) * 0.15 + sway * 0.04;
  const yaw = random(`${seed}y`) * Math.PI * 2;
  const top: V3 = [Math.sin(lean) * height, Math.cos(lean) * height, 0];
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[top[0] / 2, top[1] / 2, 0]} rotation={[0, 0, -lean]} castShadow>
        <CylG args={[0.18, 0.3, height, 6]} />
        <Flat color="#8A6A4A" />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[top[0] + Math.cos(a) * 1.3, top[1] - 0.3, Math.sin(a) * 1.3]} rotation={[Math.sin(a) * 0.5, -a, -Math.cos(a) * 0.5]} castShadow>
            <BoxG args={[2.8, 0.08, 0.7]} />
            <Flat color="#3E8A4A" />
          </mesh>
        );
      })}
    </group>
  );
};

// ================================================================ the vault of years

/** A billionaire's vault: back wall at z = -7, side walls at x = ±10, four shelves of glowing hourglasses. */
export const VAULT = { shelfY: [1.4, 4.0, 6.6, 9.2], backZ: -7, sideX: 10 };
export const Vault: React.FC<{ t: number; lit?: number }> = ({ t, lit = 1 }) => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <boxGeometry args={[40, 0.1, 40]} />
      <Flat color="#2A2D3A" />
    </mesh>
    <mesh position={[0, 7, VAULT.backZ - 0.5]} receiveShadow>
      <BoxG args={[22, 14, 1]} />
      <Flat color="#3A3E4A" />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * (VAULT.sideX + 0.5), 7, 2]} receiveShadow>
        <BoxG args={[1, 14, 18]} />
        <Flat color="#343844" />
      </mesh>
    ))}
    <mesh position={[0, 14, 0]}>
      <BoxG args={[22, 0.6, 20]} />
      <Flat color="#2A2D3A" />
    </mesh>
    {VAULT.shelfY.map((y) => (
      <React.Fragment key={y}>
        <mesh position={[0, y - 0.1, VAULT.backZ + 0.7]} castShadow receiveShadow>
          <BoxG args={[19.6, 0.2, 1.4]} />
          <Flat color={GOLD} />
        </mesh>
        {Array.from({ length: 11 }, (_, i) => (
          <Hourglass key={i} position={[-8.6 + i * 1.72, y, VAULT.backZ + 0.7]} scale={1.5} fill={0.55 + 0.4 * random(`v${y}${i}`)} simple />
        ))}
        {[-1, 1].map((s) => (
          <React.Fragment key={s}>
            <mesh position={[s * (VAULT.sideX - 0.7), y - 0.1, 1]} castShadow receiveShadow>
              <BoxG args={[1.4, 0.2, 14]} />
              <Flat color={GOLD} />
            </mesh>
            {Array.from({ length: 7 }, (_, i) => (
              <Hourglass key={i} position={[s * (VAULT.sideX - 0.7), y, -5 + i * 1.9]} scale={1.5} fill={0.5 + 0.45 * random(`w${s}${y}${i}`)} simple />
            ))}
          </React.Fragment>
        ))}
      </React.Fragment>
    ))}
    {/* the open round vault door on the right wall */}
    <group position={[VAULT.sideX - 0.2, 4.2, 8.6]} rotation={[0, -1.9, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <CylG args={[3.6, 3.6, 0.9, 20]} />
        <Flat color="#8A8E98" />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[0, 0, 0.5]} rotation={[0, 0, (i / 6) * Math.PI]}>
          <BoxG args={[4.4, 0.25, 0.12]} />
          <Flat color="#B8BCC6" />
        </mesh>
      ))}
    </group>
    {[-6, 0, 6].map((x) => (
      <Halo key={x} position={[x, 7, VAULT.backZ + 1.6]} size={11} color={SAND} opacity={0.22 * lit + 0.04 * Math.sin(t * 2 + x)} />
    ))}
  </group>
);

// ================================================================ storm cloud (slum side)

export const StormCloud: React.FC<{ position: V3; scale?: number; seed?: string; color?: string }> = ({ position, scale = 1, seed = "sc", color = "#2E3442" }) => (
  <group position={position} scale={scale}>
    {Array.from({ length: 14 }, (_, i) => (
      <mesh key={i} position={[(random(`${seed}x${i}`) - 0.5) * 30, (random(`${seed}y${i}`) - 0.5) * 4, (random(`${seed}z${i}`) - 0.5) * 22]}>
        <IcoG args={[4 + random(`${seed}r${i}`) * 4, 0]} />
        <Flat color={color} />
      </mesh>
    ))}
  </group>
);

// ================================================================ terrace (the rich)

/** A sky terrace: floor top at y = 0, glass rail along z = 6, planters. */
export const Terrace: React.FC = () => (
  <group>
    <mesh position={[0, -0.5, 0]} receiveShadow>
      <BoxG args={[30, 1, 14]} />
      <Flat color="#D8D2C4" />
    </mesh>
    <mesh position={[0, 1.2, 6.2]}>
      <boxGeometry args={[30, 2.4, 0.12]} />
      <Flat color="#BFE3FF" opacity={0.3} />
    </mesh>
    <mesh position={[0, 2.45, 6.2]}>
      <BoxG args={[30, 0.12, 0.3]} />
      <Flat color={GOLD} />
    </mesh>
    {[-9, 9].map((x) => (
      <group key={x} position={[x, 0, 2]}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <BoxG args={[2.4, 1.6, 2.4]} />
          <Flat color="#2A2D3A" />
        </mesh>
        <mesh position={[0, 2.6, 0]} castShadow>
          <IcoG args={[1.6, 0]} />
          <Flat color={P.leaf} />
        </mesh>
      </group>
    ))}
    {/* the tower wall behind */}
    <mesh position={[0, 8, -7.5]} receiveShadow>
      <BoxG args={[30, 16, 1]} />
      <Flat color="#A9C4D8" />
    </mesh>
    {Array.from({ length: 8 }, (_, i) => (
      <mesh key={i} position={[-12.25 + i * 3.5, 6, -6.98]}>
        <planeGeometry args={[3, 9]} />
        <Glow color="#CFE8FF" />
      </mesh>
    ))}
  </group>
);

// ================================================================ kitchen (night)

/** Kitchen: floor, back wall at z = -4 with a night window, table (top 1.9) centred at the origin. */
export const TABLE = { top: 1.9, w: 5.4, d: 2.4 };
export const Kitchen: React.FC = () => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <boxGeometry args={[30, 0.1, 20]} />
      <Flat color="#6A5040" />
    </mesh>
    <mesh position={[0, 6, -4.5]} receiveShadow>
      <BoxG args={[30, 12, 1]} />
      <Flat color="#C9B89A" />
    </mesh>
    <mesh position={[-11, 6, 2]} receiveShadow>
      <BoxG args={[1, 12, 14]} />
      <Flat color="#BBA98A" />
    </mesh>
    <mesh position={[4.5, 5.2, -3.98]}>
      <planeGeometry args={[3.6, 3]} />
      <Glow color="#1A2148" />
    </mesh>
    <mesh position={[4.5, 5.2, -3.97]}>
      <planeGeometry args={[0.12, 3]} />
      <Flat color="#E8E4DA" />
    </mesh>
    {/* cupboards */}
    <mesh position={[-6, 1.6, -3.4]} castShadow receiveShadow>
      <BoxG args={[6, 3.2, 1.4]} />
      <Flat color="#5A7A8A" />
    </mesh>
    <mesh position={[-6, 6.8, -3.6]} castShadow>
      <BoxG args={[6, 2.2, 1]} />
      <Flat color="#5A7A8A" />
    </mesh>
    {/* table */}
    <mesh position={[0, TABLE.top - 0.1, 0]} castShadow receiveShadow>
      <BoxG args={[TABLE.w, 0.2, TABLE.d]} />
      <Flat color="#8A5A3A" />
    </mesh>
    {[-1, 1].flatMap((sx) =>
      [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * (TABLE.w / 2 - 0.3), (TABLE.top - 0.2) / 2, sz * (TABLE.d / 2 - 0.3)]} castShadow>
          <BoxG args={[0.2, TABLE.top - 0.2, 0.2]} />
          <Flat color="#6A4430" />
        </mesh>
      )),
    )}
    {/* ceiling lamp */}
    <mesh position={[0, 8.2, 0]}>
      <ConeG args={[0.9, 0.6, 8, 1, true]} />
      <Flat color="#E8E4DA" />
    </mesh>
    <Halo position={[0, 7.8, 0]} size={6} color="#FFD9A0" opacity={0.5} />
    <pointLight position={[0, 7.4, 0.5]} color="#FFD9A0" intensity={30} distance={18} decay={2} />
  </group>
);

/** A paper grocery bag (base on y = 0) with bread and a few apples. */
export const Groceries: React.FC<{ position: V3 }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 0.5, 0]} castShadow>
      <BoxG args={[0.9, 1.0, 0.6]} />
      <Flat color="#C9A06A" />
    </mesh>
    <mesh position={[0.1, 1.15, 0]} rotation={[0, 0, 0.3]} castShadow>
      <CylG args={[0.16, 0.16, 0.8, 6]} />
      <Flat color="#D9A050" />
    </mesh>
    {[
      [0.8, 0.18, 0.2],
      [1.15, 0.18, -0.1],
      [-0.75, 0.18, 0.15],
    ].map((p, i) => (
      <mesh key={i} position={p as V3} castShadow>
        <IcoG args={[0.18, 1]} />
        <Flat color={i === 1 ? "#7FB34A" : "#C8372D"} />
      </mesh>
    ))}
    <mesh position={[-1.2, 0.12, -0.1]} castShadow>
      <BoxG args={[0.7, 0.24, 0.4]} />
      <Flat color="#F2EEE6" />
    </mesh>
  </group>
);

// ================================================================ school (a better future)

export const School: React.FC<{ position: V3 }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 5, 0]} castShadow receiveShadow>
      <BoxG args={[26, 10, 10]} />
      <Flat color="#E8D8B8" />
    </mesh>
    <mesh position={[0, 10.4, 0]} castShadow>
      <BoxG args={[27, 0.8, 11]} />
      <Flat color="#C8372D" />
    </mesh>
    {[-9, -5, 5, 9].flatMap((x) =>
      [3, 7].map((y) => (
        <mesh key={`${x}${y}`} position={[x, y, 5.01]}>
          <planeGeometry args={[2.4, 2]} />
          <Glow color="#CFE8FF" />
        </mesh>
      )),
    )}
    <mesh position={[0, 2.3, 5.01]}>
      <planeGeometry args={[3.4, 4.6]} />
      <Flat color="#5A3E2E" />
    </mesh>
    <CanvasPanel position={[0, 6.6, 5.02]} w={8} h={1.6} draw={drawPanel("SCHOOL", "#1D274B", "#FFFFFF", 0.6)} />
  </group>
);

/** A small backpack worn on the child's back (local to the kid rig at scale KID). */
export const Backpack: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh castShadow>
      <BoxG args={[0.75, 0.85, 0.36]} />
      <Flat color="#24748F" />
    </mesh>
  </group>
);

// ================================================================ HTML labels (pinned over people)

/** An hourglass life label: icon, small caption, big value. */
export const LifeLabel: React.FC<{ caption: string; value: string; color?: string; scale?: number; fill?: number }> = ({ caption, value, color = SAND, scale = 1, fill = 0.6 }) => {
  const s = 30 * scale;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12 * scale,
        padding: `${10 * scale}px ${18 * scale}px`,
        borderRadius: 14 * scale,
        background: "rgba(8,10,24,0.72)",
        border: `${2 * scale}px solid ${color}`,
        fontFamily: FONT,
        color: "#FFFFFF",
        whiteSpace: "nowrap",
        boxShadow: `0 0 ${18 * scale}px ${color}55`,
      }}
    >
      <svg width={s} height={s * 1.25} viewBox="0 0 24 30">
        <rect x="2" y="1" width="20" height="3" fill={color} />
        <rect x="2" y="26" width="20" height="3" fill={color} />
        <path d="M4 4 L20 4 L13 15 L20 26 L4 26 L11 15 Z" fill="none" stroke={color} strokeWidth="2" />
        <path d={`M${12 - 6 * fill} ${14 - 9 * fill} L${12 + 6 * fill} ${14 - 9 * fill} L12 14 Z`} fill={color} />
        <path d={`M5.5 25 L18.5 25 L12 ${25 - 9 * (1 - fill)} Z`} fill={color} />
      </svg>
      <div>
        <div style={{ fontSize: 15 * scale, letterSpacing: "0.14em", opacity: 0.7 }}>{caption}</div>
        <div style={{ fontWeight: 700, fontSize: 34 * scale, color, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{value}</div>
      </div>
    </div>
  );
};

/** Glowing years (small amber icospheres) streaming from one point to another. */
export const YearStream: React.FC<{ from: V3; to: V3; t: number; count?: number; arc?: number; size?: number; seed?: string; speed?: number }> = ({
  from,
  to,
  t,
  count = 26,
  arc = 1.2,
  size = 0.09,
  seed = "ys",
  speed = 0.9,
}) => (
  <group>
    {Array.from({ length: count }, (_, i) => {
      const p = (((t * speed + random(`${seed}${i}`)) % 1) + 1) % 1;
      const j = (random(`${seed}j${i}`) - 0.5) * 0.25;
      const pos: V3 = [from[0] + (to[0] - from[0]) * p + j, from[1] + (to[1] - from[1]) * p + arc * 4 * p * (1 - p), from[2] + (to[2] - from[2]) * p + j];
      const s = size * Math.min(1, p * 6, (1 - p) * 6);
      return (
        <mesh key={i} position={pos} scale={Math.max(0.001, s / 0.1)}>
          <IcoG args={[0.1, 0]} />
          <Glow color={SAND} />
        </mesh>
      );
    })}
  </group>
);
