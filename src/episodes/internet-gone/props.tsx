/**
 * Sets and props for "What If the Internet Disappeared?" (ep. 8).
 * Fictional scenario about a real public figure: he is named in the narration only. On screen he is an
 * anonymous low-poly man in a black leather jacket, seen from behind, as hands, or as a silhouette.
 * No real logos (no chip maker, no video/search/social apps): every brand, app and chip is invented.
 * Everything rests on y = 0 using its real extents and follows the kit detail level.
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { Building } from "../../slavoski/city";
import { BoxG, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { FONT } from "../../slavoski/fonts";
import type { HeroLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { clamp01, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { CANVAS_FONT, CanvasPanel, fitText } from "../../slavoski/screens";

// ================================================================ the man in the leather jacket

/** The CEO: black leather jacket, black trousers and shoes, dark hair. Never framed face-on. */
export const CEO_LOOK: HeroLook = {
  skin: "#C99A74",
  skinShade: "#AD805C",
  hair: "#22232A",
  jacket: "#1B1B20",
  jacketShade: "#111115",
  zipper: "#A6A8B2",
  jeans: "#18181C",
  shoe: "#101014",
};

/** Hi-vis engineers. */
export const HIVIS = (base: HeroLook): HeroLook => ({ ...base, jacket: "#E8D23A", jacketShade: "#C8B42A", zipper: "#D8D8D8" });

/** A big centred stamp ("THE NIGHT BEFORE", "DAY 2"), in for ~1.5 s. */
export const Stamp: React.FC<{ label: string; value: string; lt: number; hold?: number }> = ({ label, value, lt, hold = 1.3 }) => {
  if (lt < 0 || lt > hold + 0.3) return null;
  const inK = clamp01(lt / 0.12);
  const out = clamp01((lt - hold) / 0.3);
  const scale = 1.25 - 0.25 * inK;
  const size = Math.min(110, Math.floor(760 / (0.72 * value.length)));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 260, textAlign: "center", fontFamily: FONT, opacity: inK * (1 - out), transform: `scale(${scale})`, transformOrigin: "50% 0", pointerEvents: "none" }}>
      <div style={{ display: "inline-block", padding: "10px 40px 12px", background: "rgba(8,8,14,0.72)", border: `4px solid ${P.amber}` }}>
        <div style={{ fontSize: 24, letterSpacing: "0.34em", color: "rgba(255,255,255,0.75)" }}>{label}</div>
        <div style={{ fontWeight: 700, fontSize: size, lineHeight: 1.05, color: P.amber, whiteSpace: "nowrap" }}>{value}</div>
      </div>
    </div>
  );
};

// ================================================================ phone and laptop UIs (HTML)

const WifiIcon: React.FC<{ s: number; dead: boolean }> = ({ s, dead }) => (
  <div style={{ position: "relative", width: s, height: s * 0.8 }}>
    {[1, 0.68, 0.36].map((k, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: (s * (1 - k)) / 2,
          top: s * 0.8 * (1 - k),
          width: s * k,
          height: s * k,
          borderRadius: "50%",
          border: `${s * 0.08}px solid ${dead ? "#5A5F6E" : "#8FD0FF"}`,
          borderBottomColor: "transparent",
          borderLeftColor: "transparent",
          transform: "rotate(-45deg)",
          boxSizing: "border-box",
        }}
      />
    ))}
    {dead ? <div style={{ position: "absolute", left: s * 0.55, top: s * 0.4, color: "#FF5A4A", fontWeight: 700, fontSize: s * 0.5, lineHeight: 1 }}>✕</div> : null}
  </div>
);

/** Phone: a morning feed that won't load, then "No internet connection". k 0..1 = how far it has failed. */
export const NoInternetScreen: React.FC<{ w: number; h: number; t: number; k: number }> = ({ w, h, t, k }) => {
  const dead = k > 0.5;
  return (
    <div style={{ width: w, height: h, background: dead ? "#0E1018" : "#12162A", fontFamily: FONT, color: "#E8E4DA", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: w * 0.06, right: w * 0.06, top: h * 0.025, display: "flex", justifyContent: "space-between", fontSize: w * 0.05, opacity: 0.8 }}>
        <span>7:02</span>
        <span>{dead ? "NO SIGNAL" : "▮▮▮"}</span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.3, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {dead ? (
          <>
            <WifiIcon s={w * 0.36} dead />
            <div style={{ marginTop: h * 0.05, fontWeight: 700, fontSize: w * 0.095, textAlign: "center", lineHeight: 1.15 }}>
              NO INTERNET
              <br />
              CONNECTION
            </div>
            <div style={{ marginTop: h * 0.025, fontSize: w * 0.05, opacity: 0.55 }}>Retrying…</div>
          </>
        ) : (
          <>
            <div style={{ width: w * 0.2, height: w * 0.2, borderRadius: "50%", border: `${w * 0.025}px solid rgba(143,208,255,0.25)`, borderTopColor: "#8FD0FF", transform: `rotate(${t * 540}deg)` }} />
            <div style={{ marginTop: h * 0.04, fontSize: w * 0.06, opacity: 0.7 }}>Loading your feed…</div>
          </>
        )}
      </div>
    </div>
  );
};

/** Invented apps (no real logos): VIDEOS, CLIPS, SEARCH first, then the rest. `dead` 0..3+ crosses them out. */
const APPS: { name: string; color: string; glyph: "film" | "stack" | "lens" | "mail" | "pin" | "chat" | "note" | "news" | "cart" }[] = [
  { name: "Videos", color: "#6B4FD8", glyph: "film" },
  { name: "Clips", color: "#E0457A", glyph: "stack" },
  { name: "Search", color: "#2E86DE", glyph: "lens" },
  { name: "Mail", color: "#24748F", glyph: "mail" },
  { name: "Maps", color: "#2F9A5A", glyph: "pin" },
  { name: "Chat", color: "#E8862A", glyph: "chat" },
  { name: "Music", color: "#C8372D", glyph: "note" },
  { name: "News", color: "#566270", glyph: "news" },
  { name: "Shop", color: "#B38A2E", glyph: "cart" },
];
const Glyph: React.FC<{ g: (typeof APPS)[number]["glyph"]; s: number }> = ({ g, s }) => {
  const c = "rgba(255,255,255,0.92)";
  const box = (l: number, tp: number, w: number, h: number, r = 0.08, extra: React.CSSProperties = {}) => (
    <div style={{ position: "absolute", left: s * l, top: s * tp, width: s * w, height: s * h, borderRadius: s * r, background: c, ...extra }} />
  );
  switch (g) {
    case "film":
      return (
        <>
          {box(0.18, 0.28, 0.64, 0.44, 0.06)}
          {[0.24, 0.42, 0.6].map((x) => box(x, 0.32, 0.1, 0.06, 0.02, { background: "rgba(0,0,0,0.35)" }))}
          {[0.24, 0.42, 0.6].map((x) => box(x, 0.62, 0.1, 0.06, 0.02, { background: "rgba(0,0,0,0.35)" }))}
        </>
      );
    case "stack":
      return (
        <>
          {box(0.3, 0.2, 0.4, 0.5, 0.06, { opacity: 0.45 })}
          {box(0.24, 0.28, 0.4, 0.5, 0.06, { opacity: 0.7 })}
          {box(0.18, 0.36, 0.4, 0.5, 0.06)}
        </>
      );
    case "lens":
      return (
        <>
          <div style={{ position: "absolute", left: s * 0.2, top: s * 0.18, width: s * 0.42, height: s * 0.42, borderRadius: "50%", border: `${s * 0.08}px solid ${c}`, boxSizing: "border-box" }} />
          {box(0.52, 0.6, 0.3, 0.1, 0.04, { transform: "rotate(45deg)", transformOrigin: "0 50%" })}
        </>
      );
    case "mail":
      return box(0.2, 0.3, 0.6, 0.4, 0.04);
    case "pin":
      return <div style={{ position: "absolute", left: s * 0.32, top: s * 0.2, width: s * 0.36, height: s * 0.36, borderRadius: "50% 50% 50% 0", background: c, transform: "rotate(-45deg)" }} />;
    case "chat":
      return box(0.2, 0.25, 0.6, 0.42, 0.18);
    case "note":
      return (
        <>
          {box(0.5, 0.2, 0.08, 0.45, 0.02)}
          <div style={{ position: "absolute", left: s * 0.3, top: s * 0.55, width: s * 0.26, height: s * 0.2, borderRadius: "50%", background: c }} />
        </>
      );
    case "news":
      return (
        <>
          {box(0.2, 0.24, 0.6, 0.12)}
          {box(0.2, 0.44, 0.6, 0.06)}
          {box(0.2, 0.56, 0.45, 0.06)}
        </>
      );
    default:
      return (
        <>
          {box(0.2, 0.3, 0.6, 0.3, 0.04)}
          <div style={{ position: "absolute", left: s * 0.28, top: s * 0.66, width: s * 0.12, height: s * 0.12, borderRadius: "50%", background: c }} />
          <div style={{ position: "absolute", left: s * 0.6, top: s * 0.66, width: s * 0.12, height: s * 0.12, borderRadius: "50%", background: c }} />
        </>
      );
  }
};
export const AppGrid: React.FC<{ w: number; h: number; dead: number; t: number }> = ({ w, h, dead, t }) => {
  const s = w * 0.24;
  const gap = (w - s * 3) / 4;
  return (
    <div style={{ width: w, height: h, background: "linear-gradient(180deg, #1B2240 0%, #0E1020 100%)", fontFamily: FONT, color: "#E8E4DA", position: "relative" }}>
      <div style={{ position: "absolute", left: w * 0.06, right: w * 0.06, top: h * 0.025, display: "flex", justifyContent: "space-between", fontSize: w * 0.05, opacity: 0.8 }}>
        <span>7:03</span>
        <span style={{ color: "#FF5A4A" }}>OFFLINE</span>
      </div>
      {APPS.map((a, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        // The first three die one per "No", the rest all go grey with the last one.
        const k = i < 3 ? clamp01(dead - i) : clamp01(dead - 2);
        const shake = i < 3 && k > 0 && k < 1 ? Math.sin(t * 90) * s * 0.03 : 0;
        return (
          <div key={a.name} style={{ position: "absolute", left: gap + col * (s + gap) + shake, top: h * 0.12 + row * (s * 1.42), width: s, textAlign: "center" }}>
            <div style={{ position: "relative", width: s, height: s, borderRadius: s * 0.22, background: k > 0.5 ? "#3A3D48" : a.color, filter: k > 0.5 ? "grayscale(1)" : undefined, opacity: k > 0.5 ? 0.6 : 1 }}>
              <Glyph g={a.glyph} s={s} />
              {k > 0.5 && i < 3 ? (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#FF5A4A", fontWeight: 700, fontSize: s * 0.8, transform: `scale(${1 + (1 - Math.min(1, (k - 0.5) * 4)) * 0.6})` }}>✕</div>
              ) : null}
            </div>
            <div style={{ marginTop: s * 0.08, fontSize: s * 0.2, opacity: k > 0.5 ? 0.45 : 0.9 }}>{a.name}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Laptop: a chatbot conversation; bubbles pop away as `gone` goes 0..1, then CONNECTION LOST. */
export const ChatScreen: React.FC<{ w: number; h: number; gone: number }> = ({ w, h, gone }) => {
  const lines: { me: boolean; text: string }[] = [
    { me: true, text: "Write my essay" },
    { me: false, text: "Sure! Here's a draft…" },
    { me: true, text: "Now make it funnier" },
    { me: false, text: "Of course! How about…" },
  ];
  return (
    <div style={{ width: w, height: h, background: "#F2F0EA", fontFamily: FONT, position: "relative", overflow: "hidden" }}>
      <div style={{ height: h * 0.12, background: "#24748F", color: "#FFF", display: "flex", alignItems: "center", paddingLeft: w * 0.04, fontWeight: 700, fontSize: h * 0.06 }}>
        <span style={{ display: "inline-block", width: h * 0.06, height: h * 0.06, borderRadius: "50%", background: gone > 0.6 ? "#FF5A4A" : "#7FE0A0", marginRight: w * 0.02 }} />
        HELPER BOT
      </div>
      {lines.map((l, i) => {
        const k = clamp01(gone * 5 - (lines.length - 1 - i) * 0.9);
        return (
          <div key={i} style={{ display: "flex", justifyContent: l.me ? "flex-end" : "flex-start", padding: `${h * 0.02}px ${w * 0.04}px`, opacity: 1 - k, transform: `scale(${1 - k * 0.4}) translateY(${-k * h * 0.05}px)` }}>
            <div style={{ maxWidth: w * 0.6, padding: `${h * 0.025}px ${w * 0.03}px`, borderRadius: h * 0.04, background: l.me ? "#2E86DE" : "#FFFFFF", color: l.me ? "#FFF" : "#22242E", fontSize: h * 0.055, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>{l.text}</div>
          </div>
        );
      })}
      {gone > 0.75 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.4, textAlign: "center" }}>
          <div style={{ display: "inline-block", padding: `${h * 0.03}px ${w * 0.05}px`, borderRadius: h * 0.03, background: "#22242E", color: "#FF7A6A", fontWeight: 700, fontSize: h * 0.075 }}>CONNECTION LOST</div>
        </div>
      ) : null}
    </div>
  );
};

// ================================================================ canvas drawings (occludable 3D screens)

const bg = (ctx: CanvasRenderingContext2D, W: number, H: number, c = "#0B0E18") => {
  ctx.fillStyle = c;
  ctx.fillRect(0, 0, W, H);
};

/** CEO monitors: endless chatbot windows and AI images. */
export const drawAiWall = (t: number, seed: number, dead = 0) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  bg(ctx, W, H, "#0E1222");
  if (dead > 0.5) {
    fitText(ctx, "OFFLINE", W / 2, H / 2, W * 0.8, H * 0.3, "#FF5A4A");
    return;
  }
  for (let i = 0; i < 7; i++) {
    const y = ((i * 0.16 + t * 0.12 + seed * 0.07) % 1.1) - 0.1;
    const me = (i + seed) % 2 === 0;
    const w = W * (0.35 + random(`aw${seed}${i}`) * 0.3);
    ctx.fillStyle = me ? "#2E86DE" : "#E8E4DA";
    ctx.beginPath();
    ctx.roundRect(me ? W * 0.94 - w : W * 0.06, H * y, w, H * 0.1, H * 0.04);
    ctx.fill();
  }
  ctx.fillStyle = "#6B4FD8";
  ctx.fillRect(W * 0.06, H * 0.84, W * 0.88, H * 0.1);
  ctx.font = CANVAS_FONT(H * 0.06);
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("AI  •  AI  •  AI  •  AI", W * 0.09, H * 0.89);
};

/** A street screen playing a colourful AI video (a dancing robot at sunset), then frozen + unavailable. */
export const drawAiVideo = (t: number, k: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  const tt = k > 0.3 ? 0.9 : t; // freezes
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#5A2E8A");
  g.addColorStop(0.6, "#F18E5C");
  g.addColorStop(1, "#FFD07A");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#FFF4D0";
  ctx.beginPath();
  ctx.arc(W * 0.7, H * 0.45, H * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2A1E3A";
  ctx.fillRect(0, H * 0.78, W, H * 0.22);
  // the robot: boxes, arms waving
  const cx = W * 0.4 + Math.sin(tt * 3) * W * 0.03;
  const by = H * 0.78;
  ctx.fillStyle = "#3A3E5A";
  ctx.fillRect(cx - W * 0.05, by - H * 0.36, W * 0.1, H * 0.22);
  ctx.fillRect(cx - W * 0.04, by - H * 0.52, W * 0.08, H * 0.14);
  ctx.fillStyle = "#7FE8FF";
  ctx.fillRect(cx - W * 0.03, by - H * 0.48, W * 0.06, H * 0.03);
  ctx.save();
  ctx.translate(cx - W * 0.05, by - H * 0.33);
  ctx.rotate(-1.2 + Math.sin(tt * 6) * 0.6);
  ctx.fillStyle = "#3A3E5A";
  ctx.fillRect(-W * 0.012, 0, W * 0.024, H * 0.16);
  ctx.restore();
  ctx.save();
  ctx.translate(cx + W * 0.05, by - H * 0.33);
  ctx.rotate(1.2 - Math.sin(tt * 6 + 1) * 0.6);
  ctx.fillStyle = "#3A3E5A";
  ctx.fillRect(-W * 0.012, 0, W * 0.024, H * 0.16);
  ctx.restore();
  ctx.fillRect(cx - W * 0.04, by - H * 0.14, W * 0.025, H * 0.14);
  ctx.fillRect(cx + W * 0.015, by - H * 0.14, W * 0.025, H * 0.14);
  ctx.font = CANVAS_FONT(H * 0.07);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("AI VIDEO", W * 0.04, H * 0.05);
  if (k > 0.3) {
    ctx.fillStyle = `rgba(20,22,30,${Math.min(0.85, (k - 0.3) * 3)})`;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.05 + random(`st${i}${Math.floor(t * 20)}`) * 0.12})`;
      ctx.fillRect(0, random(`sy${i}${Math.floor(t * 20)}`) * H, W, H * 0.01);
    }
  }
  if (k > 0.55) {
    fitText(ctx, "VIDEO UNAVAILABLE", W / 2, H * 0.46, W * 0.84, H * 0.14, "#FFFFFF");
    fitText(ctx, "AI SERVICE OFFLINE", W / 2, H * 0.62, W * 0.7, H * 0.08, "#FF7A6A");
  }
};

/** A big office wall screen: AI COMPUTE → ACCESS DENIED. */
export const drawCompute = (k: number, t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  bg(ctx, W, H, k > 0.5 ? "#2A0A0C" : "#0B1A2A");
  if (k > 0.5) {
    const blink = Math.floor(t * 4) % 2 === 0;
    fitText(ctx, "ACCESS DENIED", W / 2, H * 0.42, W * 0.86, H * 0.28, blink ? "#FF5A4A" : "#B83A30");
    fitText(ctx, "AI COMPUTE UNAVAILABLE", W / 2, H * 0.72, W * 0.8, H * 0.11, "#E8C8C0");
  } else {
    fitText(ctx, "AI COMPUTE", W / 2, H * 0.3, W * 0.8, H * 0.2, "#7FE8FF");
    ctx.fillStyle = "#1E3A52";
    ctx.fillRect(W * 0.1, H * 0.55, W * 0.8, H * 0.12);
    ctx.fillStyle = "#7FE8FF";
    ctx.fillRect(W * 0.1, H * 0.55, W * 0.8 * (0.6 + 0.3 * Math.sin(t * 2) ** 2), H * 0.12);
    fitText(ctx, "ONLINE", W / 2, H * 0.82, W * 0.5, H * 0.1, "#7FE0A0");
  }
};

/** The departures board: rows flip to SYSTEM OFFLINE one by one as k goes 0..1. */
export const drawBoard = (k: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  bg(ctx, W, H);
  ctx.font = CANVAS_FONT(H * 0.075);
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = "#E0B04E";
  ctx.fillText("DEPARTURES", W * 0.05, H * 0.09);
  const rows = ["NORTHPORT", "SANTA VERA", "KALMAR BAY", "ORIENTE", "VALDEMAR", "PORT ALBA"];
  rows.forEach((r, i) => {
    const y = H * (0.24 + i * 0.125);
    const off = k * (rows.length + 1) > i + 0.5;
    ctx.fillStyle = "#E8E4DA";
    ctx.font = CANVAS_FONT(H * 0.065, false);
    ctx.textAlign = "left";
    ctx.fillText(`${String(7 + i).padStart(2, "0")}:${(i * 17) % 60 < 10 ? "0" : ""}${(i * 17) % 60}  ${r}`, W * 0.05, y);
    ctx.textAlign = "right";
    ctx.fillStyle = off ? "#FF5A4A" : "#7FE0A0";
    ctx.font = CANVAS_FONT(H * 0.065);
    ctx.fillText(off ? "SYSTEM OFFLINE" : "ON TIME", W * 0.95, y);
  });
};

/** Card terminal screen: PROCESSING… → DECLINED / NO CONNECTION. */
export const drawCardScreen = (k: number, t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  bg(ctx, W, H, k > 0.5 ? "#2A0A0C" : "#0E1A26");
  if (k > 0.5) {
    fitText(ctx, "DECLINED", W / 2, H * 0.36, W * 0.86, H * 0.3, "#FF5A4A");
    fitText(ctx, "NO CONNECTION", W / 2, H * 0.72, W * 0.86, H * 0.18, "#E8C8C0");
  } else {
    fitText(ctx, "PROCESSING", W / 2, H * 0.36, W * 0.86, H * 0.22, "#E8E4DA");
    const dots = ".".repeat(1 + (Math.floor(t * 4) % 3));
    fitText(ctx, dots, W / 2, H * 0.68, W * 0.5, H * 0.3, "#7FE8FF");
  }
};

/** The kitchen TV: breaking news about the outage, a queue picture and a ticker. */
export const drawNews = (t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#4A5A78");
  g.addColorStop(1, "#8A96AA");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // the picture: a queue of little people outside a cash machine in the rain
  ctx.fillStyle = "#3A3E48";
  ctx.fillRect(W * 0.62, H * 0.2, W * 0.16, H * 0.42);
  ctx.fillStyle = "#24748F";
  ctx.fillRect(W * 0.65, H * 0.26, W * 0.1, H * 0.06);
  for (let i = 0; i < 9; i++) {
    const x = W * (0.56 - i * 0.055);
    const bob = Math.sin(t * 3 + i) * H * 0.004;
    ctx.fillStyle = ["#2E5A6A", "#5A4A78", "#8A3A3A", "#566270", "#3A6A4A"][i % 5];
    ctx.fillRect(x - W * 0.018, H * 0.42 + bob, W * 0.036, H * 0.16);
    ctx.fillStyle = "#C58B62";
    ctx.beginPath();
    ctx.arc(x, H * 0.38 + bob, W * 0.02, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(220,230,255,0.35)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    const x = random(`rx${i}`) * W;
    const y = ((random(`ry${i}`) + t * 1.4) % 1) * H * 0.62;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 4, y + H * 0.04);
    ctx.stroke();
  }
  // lower third
  ctx.fillStyle = "#C8372D";
  ctx.fillRect(0, H * 0.64, W * 0.34, H * 0.1);
  fitText(ctx, "BREAKING", W * 0.17, H * 0.69, W * 0.3, H * 0.07, "#FFFFFF");
  ctx.fillStyle = "#F2F0EA";
  ctx.fillRect(0, H * 0.74, W, H * 0.14);
  fitText(ctx, "INTERNET DOWN WORLDWIDE: DAY 2", W / 2, H * 0.81, W * 0.94, H * 0.085, "#15161C");
  ctx.fillStyle = "#15161C";
  ctx.fillRect(0, H * 0.88, W, H * 0.12);
  ctx.font = CANVAS_FONT(H * 0.06);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#E0B04E";
  const ticker = "CASH ONLY AT SHOPS  •  FLIGHTS GROUNDED  •  BANKS CLOSED  •  GOVERNMENTS MEET  •  ";
  const off = (t * W * 0.25) % (W * 2.2);
  ctx.fillText(ticker + ticker, W - off, H * 0.94);
};

// ================================================================ the CEO's office at the top of a tower (night)

/** The button console: a lectern with a sloped top, a big red dome and a TURN OFF AI plate. */
export const CONSOLE = { w: 1.7, d: 1.2, h: 2.0, slope: 0.45, top: [0, 2.1, 0] as V3 };
/** A point in the sloped top's own space → world (console at the origin). */
export const slopePoint = (p: V3): V3 => {
  const c = Math.cos(CONSOLE.slope);
  const s = Math.sin(CONSOLE.slope);
  return [p[0], CONSOLE.top[1] + p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
/** The dome sits on the near half of the slope (toward him), the TURN OFF AI plate on the far half. */
const DOME_Z = 0.25;
const PLATE_Z = -0.48;
export const DOME_TOP: V3 = slopePoint([0, 0.57, DOME_Z]);
/** Fist centre on the pressed dome (dome sunk 0.1, fist radius 0.22). */
export const PRESS_TARGET: V3 = slopePoint([0, 0.47 + 0.22, DOME_Z]);
/** Centre of the TURN OFF AI plate (world). */
export const PLATE: V3 = slopePoint([0, 0.081, PLATE_Z]);

const drawPlate = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  // hazard stripes border + label
  ctx.fillStyle = "#15161C";
  ctx.fillRect(0, 0, W, H);
  const s = H * 0.14;
  for (let x = -H; x < W + H; x += s * 2) {
    ctx.fillStyle = "#E0B04E";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + s, 0);
    ctx.lineTo(x + s - H, H);
    ctx.lineTo(x - H, H);
    ctx.fill();
  }
  ctx.fillStyle = "#15161C";
  ctx.fillRect(W * 0.04, H * 0.14, W * 0.92, H * 0.72);
  fitText(ctx, "TURN OFF AI", W / 2, H * 0.52, W * 0.86, H * 0.56, "#FFFFFF");
};

export const ButtonConsole: React.FC<{ position?: V3; press?: number; cover?: number; armed?: boolean }> = ({ position = [0, 0, 0], press = 0, cover = 1, armed = true }) => (
  <group position={position}>
    <mesh position={[0, CONSOLE.h / 2, 0]} castShadow receiveShadow>
      <BoxG args={[CONSOLE.w, CONSOLE.h, CONSOLE.d]} />
      <Flat color="#2A2D38" />
    </mesh>
    <mesh position={[0, 0.06, 0]} receiveShadow>
      <BoxG args={[CONSOLE.w + 0.3, 0.12, CONSOLE.d + 0.3]} />
      <Flat color="#1A1C24" />
    </mesh>
    <group position={CONSOLE.top} rotation={[CONSOLE.slope, 0, 0]}>
      <mesh castShadow receiveShadow>
        <BoxG args={[CONSOLE.w + 0.1, 0.16, CONSOLE.d + 0.3]} />
        <Flat color="#3A3E4C" />
      </mesh>
      {/* dome on a black collar */}
      <mesh position={[0, 0.12, DOME_Z]}>
        <CylG args={[0.48, 0.52, 0.1, 16]} />
        <Flat color="#15161C" />
      </mesh>
      <mesh position={[0, 0.17 - press * 0.1, DOME_Z]} castShadow>
        <sphereGeometry args={[0.4, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color={armed ? "#E0281E" : "#7A1A16"} flatShading emissive={armed ? "#5A0A06" : "#000000"} />
      </mesh>
      {/* the hinged safety cover over the dome (hinge along its left edge, flips over to the left) */}
      <group position={[-0.5, 0.17, DOME_Z]} rotation={[0, 0, cover * 1.9]}>
        <mesh position={[0.5, 0.24, 0]}>
          <boxGeometry args={[1.0, 0.48, 0.94]} />
          <meshBasicMaterial color="#BFE3FF" transparent opacity={0.22} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      <CanvasPanel position={[0, 0.081, PLATE_Z]} rotation={[-Math.PI / 2, 0, 0]} w={1.5} h={0.42} px={512} draw={drawPlate} />
    </group>
  </group>
);

/** Night skyline outside the office window (towers rising from far below). */
const OutsideCity: React.FC<{ power?: number }> = ({ power = 1 }) => (
  <group>
    {Array.from({ length: 22 }, (_, i) => {
      const a = -1.25 + (i / 21) * 2.5;
      const r = 70 + random(`oc${i}`) * 120;
      const h = 70 + random(`och${i}`) * 80;
      return (
        <Building
          key={i}
          position={[Math.sin(a) * r, -90, -Math.cos(a) * r - 10]}
          w={10 + random(`ocw${i}`) * 10}
          d={10}
          h={h}
          color={[P.bldgNavy, P.bldgSlate, P.bldgPurple, P.bldgTeal][i % 4]}
          seed={`oc${i}`}
          litRatio={0.55}
          power={power}
        />
      );
    })}
  </group>
);

export const OFFICE = { winZ: -9, desk: [7, 0, -4] as V3, console: [0, 0, 0] as V3 };

export const CeoOffice: React.FC<{ t: number; dead?: number; spot?: number; cityPower?: number }> = ({ t, dead = 0, spot = 1, cityPower = 1 }) => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[40, 0.1, 30]} />
      <Flat color="#17181E" />
    </mesh>
    {/* window wall: mullions and beams only (open glass) */}
    {Array.from({ length: 11 }, (_, i) => (
      <mesh key={i} position={[-20 + i * 4, 5, OFFICE.winZ]} castShadow>
        <BoxG args={[0.25, 10, 0.25]} />
        <Flat color="#0E0F14" />
      </mesh>
    ))}
    <mesh position={[0, 10.2, OFFICE.winZ]}>
      <BoxG args={[42, 0.5, 0.5]} />
      <Flat color="#0E0F14" />
    </mesh>
    <mesh position={[0, 0.2, OFFICE.winZ]}>
      <BoxG args={[42, 0.4, 0.4]} />
      <Flat color="#0E0F14" />
    </mesh>
    <mesh position={[0, 10.5, 0]}>
      <BoxG args={[42, 0.2, 30]} />
      <Flat color="#101116" />
    </mesh>
    {[-20, 20].map((x) => (
      <mesh key={x} position={[x, 5, 4]} receiveShadow>
        <BoxG args={[0.3, 10.5, 26]} />
        <Flat color="#2A221E" />
      </mesh>
    ))}
    <OutsideCity power={cityPower} />
    {/* desk with three monitors */}
    <group position={OFFICE.desk}>
      <mesh position={[0, 1.95, 0]} castShadow receiveShadow>
        <BoxG args={[5.4, 0.15, 2.2]} />
        <Flat color="#2E2622" />
      </mesh>
      {[-2.5, 2.5].map((x) => (
        <mesh key={x} position={[x, 0.95, 0]} castShadow>
          <BoxG args={[0.15, 1.9, 2.0]} />
          <Flat color="#2E2622" />
        </mesh>
      ))}
      {[-1.8, 0, 1.8].map((x, i) => (
        <group key={x} position={[x, 2.95, -0.5]} rotation={[0, -x * 0.12, 0]}>
          <mesh>
            <BoxG args={[1.75, 1.05, 0.08]} />
            <Flat color="#0A0B10" />
          </mesh>
          <CanvasPanel position={[0, 0, 0.045]} w={1.62} h={0.92} px={384} draw={drawAiWall(t, i, dead)} />
          <mesh position={[0, -0.75, 0]}>
            <BoxG args={[0.12, 0.5, 0.12]} />
            <Flat color="#0A0B10" />
          </mesh>
        </group>
      ))}
      <pointLight position={[0, 3, 1]} color={dead > 0.5 ? "#FF5A4A" : "#8FB3FF"} intensity={6} distance={7} decay={2} />
    </group>
    {/* the spotlight on the console */}
    <pointLight position={[0, 8, 1.5]} color="#FFD8A8" intensity={40 * spot} distance={16} decay={2} castShadow={false} />
    <mesh position={[0, 5.5, 0]}>
      <ConeG args={[2.4, 9, 16, 1, true]} />
      <meshBasicMaterial color="#FFE2B8" transparent opacity={0.05 * spot} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 10.35, 0]}>
      <CylG args={[0.5, 0.6, 0.3, 10]} />
      <Glow color="#FFE2B8" />
    </mesh>
    <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[2.4, 24]} />
      <meshBasicMaterial color="#FFD8A8" transparent opacity={0.12 * spot} depthWrite={false} toneMapped={false} />
    </mesh>
  </group>
);

/** The CEO's tower from outside: dark glass, one lit floor near the top. */
export const HqTower: React.FC<{ position: V3; h?: number; litTop?: number }> = ({ position, h = 120, litTop = 1 }) => (
  <group position={position}>
    <mesh position={[0, h / 2, 0]} castShadow>
      <BoxG args={[18, h, 18]} />
      <Flat color="#141A2E" />
    </mesh>
    {Array.from({ length: Math.floor(h / 4) }, (_, i) => (
      <mesh key={i} position={[0, 2 + i * 4, 9.02]}>
        <planeGeometry args={[17, 0.2]} />
        <Flat color="#2A3354" />
      </mesh>
    ))}
    <mesh position={[0, h - 6, 9.04]}>
      <planeGeometry args={[16, 2.6]} />
      <Glow color="#FFD08A" opacity={litTop} />
    </mesh>
    <Halo position={[0, h - 6, 10]} size={30} color="#FFC070" opacity={0.35 * litTop} />
    <mesh position={[0, h + 4, 0]}>
      <CylG args={[0.3, 0.5, 8, 6]} />
      <Flat color="#2A2D38" />
    </mesh>
    <mesh position={[0, h + 8.2, 0]}>
      <IcoG args={[0.5, 1]} />
      <Glow color="#FF3A2A" />
    </mesh>
  </group>
);

// ================================================================ data centres

/** Server racks along an aisle (z from 0 to -L); LEDs die in a wave from the far end when `wave` > 0. */
export const HALL = { L: 64, x: 2.6, rackW: 1.5, rackH: 4.6, rackD: 1.6 };
export const ServerHall: React.FC<{ t: number; wave: number; color?: string }> = ({ t, wave, color = "#3AE08A" }) => {
  const n = Math.floor(HALL.L / HALL.rackW);
  const ref = useRef<THREE.InstancedMesh>(null);
  const leds = useMemo(() => {
    const out: { p: V3; rack: number; seed: number; blue: boolean }[] = [];
    for (const side of [-1, 1])
      for (let r = 0; r < n; r++)
        for (let c = 0; c < 3; c++)
          for (let k = 0; k < 12; k++) {
            const z = -r * HALL.rackW - 0.35 - c * 0.38;
            out.push({ p: [side * (HALL.x - HALL.rackD / 2 - 0.01), 0.7 + k * 0.3, z], rack: r, seed: out.length, blue: random(`lb${out.length}`) < 0.3 });
          }
    return out;
  }, [n]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    leds.forEach((l, i) => {
      o.position.set(...l.p);
      o.rotation.set(0, Math.PI / 2, 0);
      o.scale.set(1, 1, 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      // racks die from the far end (r = n-1) toward the camera
      const dieAt = (n - 1 - l.rack) / n;
      const alive = wave <= 0 || wave < dieAt;
      const blink = Math.sin(t * (6 + (l.seed % 7)) + l.seed) > -0.3;
      m.setColorAt(i, c.set(!alive ? "#1A1C24" : blink ? (l.blue ? "#5AB8FF" : color) : "#22402E"));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  const lightsOn = wave < 0.98;
  return (
    <group>
      <mesh position={[0, -0.05, -HALL.L / 2]} receiveShadow>
        <BoxG args={[16, 0.1, HALL.L + 20]} />
        <Flat color="#2A2E3A" />
      </mesh>
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={i} position={[0, 0.004, 4 - i * 2.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.2, 0.06]} />
          <Flat color="#3A3F4E" />
        </mesh>
      ))}
      {[-1, 1].map((side) =>
        Array.from({ length: n }, (_, r) => (
          <mesh key={`${side}${r}`} position={[side * HALL.x, HALL.rackH / 2, -r * HALL.rackW - HALL.rackW / 2]} castShadow receiveShadow>
            <BoxG args={[HALL.rackD, HALL.rackH, HALL.rackW - 0.08]} />
            <Flat color="#15161C" />
          </mesh>
        )),
      )}
      <instancedMesh ref={ref} args={[undefined, undefined, leds.length]} key={leds.length}>
        <planeGeometry args={[0.12, 0.05]} />
        <meshBasicMaterial toneMapped={false} side={THREE.DoubleSide} />
      </instancedMesh>
      {/* ceiling, cable trays and light strips (off once the wave reaches us) */}
      <mesh position={[0, 6.6, -HALL.L / 2]}>
        <BoxG args={[16, 0.2, HALL.L + 20]} />
        <Flat color="#1A1C24" />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * HALL.x, 5.2, -HALL.L / 2]}>
          <BoxG args={[1.0, 0.25, HALL.L]} />
          <Flat color="#C9A43A" />
        </mesh>
      ))}
      <mesh position={[0, 6.45, -HALL.L / 2]}>
        <boxGeometry args={[0.3, 0.06, HALL.L]} />
        <Glow color={lightsOn ? "#DDEBFF" : "#2A2E3A"} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`w${side}`} position={[side * 7.5, 3.3, -HALL.L / 2]}>
          <BoxG args={[0.2, 6.8, HALL.L + 20]} />
          <Flat color="#1E2230" />
        </mesh>
      ))}
      {lightsOn ? <pointLight position={[0, 5.6, -6]} color="#CFE4FF" intensity={18} distance={30} decay={2} /> : null}
    </group>
  );
};

/** An aerial data-centre campus: long sheds with rooftop fans and edge light; each shed goes dark at `offAt[i]`. */
export const Campus: React.FC<{ t: number; off: number }> = ({ t, off }) => (
  <group>
    <mesh position={[0, -0.12, 0]} receiveShadow>
      <BoxG args={[600, 0.1, 600]} />
      <Flat color="#1E2A26" />
    </mesh>
    {[-36, 36].map((x) => (
      <mesh key={x} position={[x, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 220]} />
        <Flat color={P.road} />
      </mesh>
    ))}
    {Array.from({ length: 8 }, (_, i) => {
      const x = (i % 2 ? 1 : -1) * 15;
      const z = 40 - Math.floor(i / 2) * 26;
      const dead = off * 9 > 8 - i;
      return (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
            <BoxG args={[22, 7, 18]} />
            <Flat color="#3A4050" />
          </mesh>
          {Array.from({ length: 8 }, (_, k) => (
            <group key={k} position={[-8.4 + (k % 4) * 5.6, 7.3, k < 4 ? -4 : 4]}>
              <mesh>
                <CylG args={[1.5, 1.5, 0.6, 12]} />
                <Flat color="#252A36" />
              </mesh>
              <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, (dead ? 0.3 : t * 6) + k]}>
                <planeGeometry args={[2.6, 0.35]} />
                <Flat color="#5A6070" />
              </mesh>
            </group>
          ))}
          {/* light bands on every side and a glowing roof edge */}
          {[-9.02, 9.02].map((zz) => (
            <React.Fragment key={zz}>
              {[1.6, 3.4, 5.2].map((y) => (
                <mesh key={y} position={[0, y, zz]} rotation={[0, zz < 0 ? Math.PI : 0, 0]}>
                  <planeGeometry args={[21, 0.45]} />
                  <Glow color={dead ? "#22262E" : y === 5.2 ? "#7FD0FF" : "#3A8AE0"} />
                </mesh>
              ))}
            </React.Fragment>
          ))}
          {[-11.02, 11.02].map((xx) => (
            <mesh key={xx} position={[xx, 3.4, 0]} rotation={[0, xx < 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
              <planeGeometry args={[17, 0.45]} />
              <Glow color={dead ? "#22262E" : "#3A8AE0"} />
            </mesh>
          ))}
          <mesh position={[0, 7.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[9.6, 10.4, 4, 1, Math.PI / 4]} />
            <Glow color={dead ? "#22262E" : "#9FE0FF"} />
          </mesh>
          {!dead ? <Halo position={[0, 6, 10]} size={22} color="#5AB8FF" opacity={0.35} /> : null}
        </group>
      );
    })}
    {/* substation + perimeter lamps */}
    <group position={[48, 0, -10]}>
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[0, 2.5, k * 6]} castShadow>
          <BoxG args={[4, 5, 3]} />
          <Flat color="#6A707E" />
        </mesh>
      ))}
    </group>
  </group>
);

/** Tall black cabinets of the company's "most powerful" cluster behind glass; blue light → red OFFLINE. */
export const ClusterRoom: React.FC<{ t: number; k: number }> = ({ t, k }) => {
  const dead = k > 0.5;
  return (
    <group>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[40, 0.1, 30]} />
        <Flat color="#20232E" />
      </mesh>
      <mesh position={[0, 5, -8]} receiveShadow>
        <BoxG args={[40, 10, 0.3]} />
        <Flat color="#181B26" />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <group key={i} position={[-9 + i * 3, 0, -5]}>
          <mesh position={[0, 3.6, 0]} castShadow>
            <BoxG args={[2.4, 7.2, 2.2]} />
            <Flat color="#0E0F14" />
          </mesh>
          {[0.6, 1.8, 3.0, 4.2, 5.4, 6.6].map((y) => (
            <mesh key={y} position={[0, y, 1.11]}>
              <planeGeometry args={[2.0, 0.12]} />
              <Glow color={dead ? (Math.floor(t * 3 + i) % 2 ? "#5A1414" : "#FF3A2A") : "#4AA8FF"} />
            </mesh>
          ))}
        </group>
      ))}
      {/* glass wall with frame between us and the cluster */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-12 + i * 3, 4, -1.6]}>
          <BoxG args={[0.12, 8, 0.12]} />
          <Flat color="#3A3F4E" />
        </mesh>
      ))}
      <mesh position={[0, 4, -1.6]}>
        <planeGeometry args={[24, 8]} />
        <meshBasicMaterial color="#9FD0FF" transparent opacity={0.07} depthWrite={false} toneMapped={false} />
      </mesh>
      <CanvasPanel position={[0, 6.6, -1.5]} w={5.6} h={1.0} px={768} draw={dead ? drawSignRed("CLUSTER OFFLINE") : drawSignBlue("AI CLUSTER")} />
      <pointLight position={[0, 6, -3]} color={dead ? "#FF3A2A" : "#4AA8FF"} intensity={30} distance={22} decay={2} />
    </group>
  );
};
export const drawSignRed = (text: string) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  bg(ctx, W, H, "#2A0A0C");
  fitText(ctx, text, W / 2, H / 2, W * 0.9, H * 0.62, "#FF5A4A");
};
export const drawSignBlue = (text: string) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  bg(ctx, W, H, "#0B1A2A");
  fitText(ctx, text, W / 2, H / 2, W * 0.9, H * 0.62, "#7FE8FF");
};
export const drawSign = (text: string, back: string, color: string, size = 0.6) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  bg(ctx, W, H, back);
  fitText(ctx, text, W / 2, H / 2 + H * 0.03, W * 0.9, H * size, color);
};

/** Office desks (top 1.5) with monitors facing −Z, rows at z = 0, −5, −10. Screen colour per row. */
export const DESK_TOP = 1.5;
export const OpenOffice: React.FC<{ t: number; denied: number }> = ({ t, denied }) => (
  <group>
    <mesh position={[0, -0.05, -4]} receiveShadow>
      <BoxG args={[40, 0.1, 40]} />
      <Flat color="#3A3A44" />
    </mesh>
    <mesh position={[0, 5, -16]} receiveShadow>
      <BoxG args={[40, 10, 0.3]} />
      <Flat color="#2A2E3A" />
    </mesh>
    {/* night windows in the back wall */}
    {Array.from({ length: 8 }, (_, i) => (
      <mesh key={i} position={[-14 + i * 4, 5.5, -15.84]}>
        <planeGeometry args={[3.2, 5]} />
        <Glow color="#141C34" />
      </mesh>
    ))}
    <CanvasPanel position={[0, 6.2, -15.8]} w={9} h={4} px={768} draw={drawCompute(denied, t)} />
    {[0, -5, -10].flatMap((z, row) =>
      [-6, -2, 2, 6].map((x, i) => {
        const dead = denied * 14 > row * 4 + i + 1;
        return (
          <group key={`${row}${i}`} position={[x, 0, z - 1.0]}>
            <mesh position={[0, DESK_TOP - 0.06, -0.8]} castShadow receiveShadow>
              <BoxG args={[3.4, 0.12, 1.6]} />
              <Flat color="#C9C2B4" />
            </mesh>
            {[-1.55, 1.55].map((dx) => (
              <mesh key={dx} position={[dx, (DESK_TOP - 0.12) / 2, -0.8]} castShadow>
                <BoxG args={[0.12, DESK_TOP - 0.12, 1.4]} />
                <Flat color="#8A8E98" />
              </mesh>
            ))}
            <mesh position={[0, DESK_TOP + 0.75, -1.3]} castShadow>
              <BoxG args={[1.9, 1.15, 0.1]} />
              <Flat color="#15161C" />
            </mesh>
            <mesh position={[0, DESK_TOP + 0.75, -1.24]}>
              <planeGeometry args={[1.75, 1.0]} />
              <Glow color={dead ? (Math.floor(t * 3 + i) % 2 ? "#B3261E" : "#7A1A16") : "#3A7AC8"} />
            </mesh>
          </group>
        );
      }),
    )}
    <pointLight position={[0, 8, -4]} color="#E8F0FF" intensity={22} distance={30} decay={2} />
  </group>
);

/** An office chair matching a seated hero (seat top 0.72); back on −Z of its own space. */
export const OfficeChair: React.FC<{ position: V3; yaw?: number; color?: string }> = ({ position, yaw = 0, color = "#2A2D38" }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.66, 0]} castShadow receiveShadow>
      <BoxG args={[1.3, 0.12, 1.1]} />
      <Flat color={color} />
    </mesh>
    <mesh position={[0, 1.6, -0.5]} castShadow>
      <BoxG args={[1.2, 1.6, 0.1]} />
      <Flat color={color} />
    </mesh>
    <mesh position={[0, 0.3, 0]} castShadow>
      <CylG args={[0.07, 0.07, 0.6, 6]} />
      <Flat color="#15161C" />
    </mesh>
  </group>
);

// ================================================================ the network: Earth with cables, chips and routers

/** Undersea-cable arcs between seeded points on a sphere; each cable dims to dark at `cut[i]` 0..1. */
export const CableNet: React.FC<{ r: number; count?: number; seed?: string; dead?: number; aiDark?: number; t: number }> = ({ r, count = 26, seed = "net", dead = 0, aiDark = 0, t }) => {
  const cables = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const pt = (k: string) => {
          const u = random(`${seed}u${k}${i}`) * 1.6 - 0.8;
          const th = random(`${seed}t${k}${i}`) * Math.PI * 2;
          const s = Math.sqrt(1 - u * u);
          return new THREE.Vector3(Math.cos(th) * s, u, Math.sin(th) * s);
        };
        const a = pt("a");
        const b0 = pt("b");
        const b = a.clone().lerp(b0, 0.55).normalize();
        const pts = Array.from({ length: 13 }, (_, k) => {
          const f = k / 12;
          const p = a.clone().lerp(b, f).normalize();
          return p.multiplyScalar(r * (1.015 + Math.sin(f * Math.PI) * 0.09));
        });
        return { curve: new THREE.CatmullRomCurve3(pts), a: a.clone().multiplyScalar(r * 1.02), b: b.clone().multiplyScalar(r * 1.02), order: random(`${seed}o${i}`) };
      }),
    [count, r, seed],
  );
  return (
    <group>
      {cables.map((c, i) => {
        const off = dead > 0 && c.order < dead;
        const pulse = 0.7 + 0.3 * Math.sin(t * 4 + i);
        return (
          <group key={i}>
            <mesh>
              <tubeGeometry args={[c.curve, 24, r * 0.006, 4, false]} />
              <meshBasicMaterial color={off ? "#3A2020" : "#7FE8FF"} transparent opacity={off ? 0.6 : pulse} toneMapped={false} />
            </mesh>
            {[c.a, c.b].map((p, k) => {
              const ai = k === 0 && i % 4 === 0;
              const col = off ? "#5A1414" : ai ? (aiDark > 0.5 ? "#2A2A30" : "#FFBA58") : "#BFF4FF";
              return (
                <mesh key={k} position={[p.x, p.y, p.z]}>
                  <IcoG args={[r * (ai ? 0.03 : 0.018), 1]} />
                  <meshBasicMaterial color={col} toneMapped={false} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
};

/** A generic AI chip: dark package, gold pins, a die with "AI" on it (no maker's mark). Lies flat, top +Y. */
export const Chip: React.FC<{ position: V3; rotation?: V3; scale?: number; glow?: number }> = ({ position, rotation = [0, 0, 0], scale = 1, glow = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh castShadow receiveShadow>
      <BoxG args={[2, 0.22, 2]} />
      <Flat color="#1E2028" />
    </mesh>
    {Array.from({ length: 4 }, (_, side) =>
      Array.from({ length: 9 }, (_, k) => {
        const off = -0.8 + k * 0.2;
        const pos: V3 = side === 0 ? [off, -0.05, 1.08] : side === 1 ? [off, -0.05, -1.08] : side === 2 ? [1.08, -0.05, off] : [-1.08, -0.05, off];
        return (
          <mesh key={`${side}${k}`} position={pos}>
            <boxGeometry args={side < 2 ? [0.08, 0.06, 0.2] : [0.2, 0.06, 0.08]} />
            <Flat color="#D8B04A" />
          </mesh>
        );
      }),
    )}
    <mesh position={[0, 0.13, 0]}>
      <BoxG args={[1.1, 0.06, 1.1]} />
      <Flat color="#3A3E4C" />
    </mesh>
    <CanvasPanel position={[0, 0.165, 0]} rotation={[-Math.PI / 2, 0, 0]} w={1.0} h={1.0} px={256} draw={drawSign("AI", "#2A2E3A", glow > 0.5 ? "#FFBA58" : "#5A5E6A", 0.6)} />
    {glow > 0 ? <Halo position={[0, 0.4, 0]} size={3.4} color="#FFBA58" opacity={0.35 * glow} /> : null}
  </group>
);

/** A router rack with blinking green LEDs and a bundle of cables: the rest of the internet. */
export const RouterRack: React.FC<{ position: V3; t: number; on?: number; seed?: string }> = ({ position, t, on = 1, seed = "rr" }) => (
  <group position={position}>
    <mesh position={[0, 2.2, 0]} castShadow>
      <BoxG args={[2.2, 4.4, 1.4]} />
      <Flat color="#22252E" />
    </mesh>
    {Array.from({ length: 6 }, (_, row) => (
      <group key={row} position={[0, 0.7 + row * 0.62, 0.71]}>
        <mesh>
          <planeGeometry args={[1.9, 0.42]} />
          <Flat color="#3A3E4C" />
        </mesh>
        {Array.from({ length: 8 }, (_, k) => {
          const blink = on > 0.5 && Math.sin(t * (5 + ((row * 8 + k) % 6)) + row * 3 + k * 1.7 + random(`${seed}${row}${k}`) * 6) > 0;
          return (
            <mesh key={k} position={[-0.78 + k * 0.22, 0.08, 0.01]}>
              <planeGeometry args={[0.08, 0.06]} />
              <Glow color={on <= 0.5 ? "#2A2A30" : blink ? "#5AF08A" : "#1E4A2E"} />
            </mesh>
          );
        })}
      </group>
    ))}
    {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
      <mesh key={x} position={[x, 4.9 + i * 0.05, -0.2]} rotation={[0.3, 0, 0]}>
        <CylG args={[0.05, 0.05, 1.4, 5]} />
        <Flat color={["#2E86DE", "#E8D23A", "#2E86DE", "#C8372D"][i]} />
      </mesh>
    ))}
  </group>
);

/** An internet exchange: a windowless block with rooftop dishes and masts. `fail` 0..1: lights out, sparks. */
export const Exchange: React.FC<{ position: V3; t: number; fail: number }> = ({ position, t, fail }) => (
  <group position={position}>
    <mesh position={[0, 7, 0]} castShadow receiveShadow>
      <BoxG args={[30, 14, 20]} />
      <Flat color="#7A808E" />
    </mesh>
    {Array.from({ length: 6 }, (_, i) => (
      <mesh key={i} position={[-12.5 + i * 5, 3, 10.02]}>
        <planeGeometry args={[3.4, 0.4]} />
        <Glow color={fail > 0.3 ? "#2A2A30" : "#7FE0A0"} />
      </mesh>
    ))}
    <CanvasPanel position={[0, 11.2, 10.03]} w={16} h={2.2} px={1024} draw={drawSign("INTERNET EXCHANGE", "#2A2E3A", fail > 0.5 ? "#8A8E98" : "#E8E4DA", 0.56)} />
    {[-9, 0, 9].map((x, i) => (
      <group key={x} position={[x, 14, -3 + (i % 2) * 4]}>
        <mesh position={[0, 1.2, 0]}>
          <BoxG args={[1.2, 2.4, 1.2]} />
          <Flat color="#C9D2DE" />
        </mesh>
        <group position={[0, 3.2, 0]} rotation={[-0.8, i * 0.6, 0]}>
          <mesh>
            <sphereGeometry args={[2.4, 14, 4, 0, Math.PI * 2, 0, 0.7]} />
            <meshLambertMaterial color="#F2F6FA" flatShading side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
    ))}
    <mesh position={[12, 22, 6]}>
      <CylG args={[0.25, 0.45, 16, 6]} />
      <Flat color="#8E96A6" />
    </mesh>
    <mesh position={[12, 30.3, 6]}>
      <IcoG args={[0.45, 1]} />
      <Glow color={fail > 0.3 ? "#3A1414" : "#FF3A2A"} />
    </mesh>
    {/* sparks bursting from a junction box on the front wall */}
    {fail > 0
      ? Array.from({ length: 16 }, (_, i) => {
          const life = ((t * 2.2 + random(`sp${i}`)) % 1 + 1) % 1;
          const a = random(`spa${i}`) * Math.PI * 2;
          const v = 2 + random(`spv${i}`) * 4;
          return (
            <mesh key={i} position={[8 + Math.cos(a) * v * life, 4 + v * life * 0.8 - 6 * life * life, 10.6 + Math.abs(Math.sin(a)) * v * life * 0.6]}>
              <IcoG args={[0.26 * (1 - life), 0]} />
              <Glow color={i % 3 ? "#FFE07A" : "#FAA628"} />
            </mesh>
          );
        })
      : null}
    {fail > 0 ? <Halo position={[8, 4, 10.6]} size={12} color="#FFD07A" opacity={0.5 + 0.3 * Math.sin(t * 30)} /> : null}
    {fail > 0 ? <pointLight position={[8, 4, 12]} color="#FFB040" intensity={60 * (0.6 + 0.4 * Math.sin(t * 30))} distance={20} decay={2} /> : null}
    <mesh position={[8, 4, 10.1]}>
      <BoxG args={[1.6, 2, 0.3]} />
      <Flat color="#4A505E" />
    </mesh>
  </group>
);

/** Government wall screen: invented continents with dead network nodes, and a restore bar. */
export const drawNetStatus = (t: number, restore: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  bg(ctx, W, H, "#0A0E1C");
  const blobs: [number, number, number, number][] = [
    [0.2, 0.42, 0.13, 0.2],
    [0.42, 0.62, 0.09, 0.16],
    [0.58, 0.38, 0.15, 0.18],
    [0.8, 0.55, 0.1, 0.14],
  ];
  ctx.fillStyle = "#1E2A44";
  blobs.forEach(([x, y, rx, ry]) => {
    ctx.beginPath();
    ctx.ellipse(W * x, H * y, W * rx, H * ry, 0.3, 0, Math.PI * 2);
    ctx.fill();
  });
  for (let i = 0; i < 26; i++) {
    const x = W * (0.08 + random(`nx${i}`) * 0.84);
    const y = H * (0.22 + random(`ny${i}`) * 0.6);
    const on = random(`no${i}`) < restore;
    ctx.strokeStyle = on ? "#7FE0A0" : Math.floor(t * 3 + i) % 2 ? "#FF3A2A" : "#8A1E18";
    ctx.lineWidth = W * 0.004;
    ctx.beginPath();
    ctx.moveTo(x - W * 0.01, y - W * 0.01);
    ctx.lineTo(x + W * 0.01, y + W * 0.01);
    ctx.moveTo(x + W * 0.01, y - W * 0.01);
    ctx.lineTo(x - W * 0.01, y + W * 0.01);
    ctx.stroke();
  }
  ctx.fillStyle = "#B3261E";
  ctx.fillRect(W * 0.3, H * 0.04, W * 0.4, H * 0.13);
  fitText(ctx, "NETWORKS OFFLINE", W / 2, H * 0.105, W * 0.38, H * 0.09, "#FFFFFF");
  fitText(ctx, "RESTORING COMMUNICATIONS", W * 0.5, H * 0.87, W * 0.5, H * 0.05, "#E8E4DA");
  ctx.fillStyle = "#22283A";
  ctx.fillRect(W * 0.3, H * 0.91, W * 0.4, H * 0.04);
  ctx.fillStyle = P.amber;
  ctx.fillRect(W * 0.3, H * 0.91, W * 0.4 * Math.max(0.03, restore), H * 0.04);
};

/** The factory's status board, replaced: LINE STOPPED / NO NETWORK. */
export const drawLineStopped = (t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  bg(ctx, W, H, "#0E1018");
  fitText(ctx, "LINE STOPPED", W / 2, H * 0.32, W * 0.86, H * 0.26, Math.floor(t * 3) % 2 ? "#FF5A4A" : "#B83A30");
  fitText(ctx, "NO NETWORK", W / 2, H * 0.72, W * 0.6, H * 0.2, "#E8E4DA");
};

// ================================================================ street props

/** A countertop card terminal (screen 0.5 × 0.36 at SCREEN, facing +Z, tilted up). */
export const READER = { screen: [0, 0.56, 0.06] as V3, w: 0.5, h: 0.34, tilt: -0.5 };
export const CardReader: React.FC<{ position: V3; k: number; t: number }> = ({ position, k, t }) => (
  <group position={position}>
    <group rotation={[READER.tilt, 0, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <BoxG args={[0.7, 0.9, 0.16]} />
        <Flat color="#2A2D38" />
      </mesh>
      <CanvasPanel position={[0, 0.56, 0.085]} w={READER.w} h={READER.h} px={384} draw={drawCardScreen(k, t)} />
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-0.16 + (i % 3) * 0.16, 0.26 - Math.floor(i / 3) * 0.09, 0.085]}>
          <planeGeometry args={[0.12, 0.06]} />
          <Flat color="#8A8E98" />
        </mesh>
      ))}
    </group>
  </group>
);

/** A bank card (lies in the hand, faces +Z). */
export const BankCard: React.FC<{ position: V3; rotation?: V3 }> = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation}>
    <mesh castShadow>
      <boxGeometry args={[0.6, 0.38, 0.02]} />
      <Flat color="#24748F" />
    </mesh>
    <mesh position={[-0.15, 0.03, 0.011]}>
      <planeGeometry args={[0.12, 0.09]} />
      <Flat color="#D8B04A" />
    </mesh>
  </group>
);

/** An umbrella: pole from `hand` straight up, canopy above. */
export const Umbrella: React.FC<{ hand: V3; color?: string; top?: number }> = ({ hand, color = "#24748F", top = 5.2 }) => {
  const len = top - hand[1];
  return (
    <group position={hand}>
      <mesh position={[0, len / 2, 0]} castShadow>
        <CylG args={[0.04, 0.04, len + 0.3, 5]} />
        <Flat color="#2A2A30" />
      </mesh>
      <mesh position={[0, len + 0.35, 0]} castShadow>
        <ConeG args={[1.6, 0.7, 8, 1, true]} />
        <meshLambertMaterial color={color} flatShading side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

/** A desk telephone with a coiled-cord handset (handset at `handset` when lifted). */
export const DeskPhone: React.FC<{ position: V3; yaw?: number; handset?: V3 | null }> = ({ position, yaw = 0, handset = null }) => (
  <group>
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <BoxG args={[0.7, 0.24, 0.6]} />
        <Flat color="#C8372D" />
      </mesh>
      {!handset ? (
        <mesh position={[0, 0.3, 0]} castShadow>
          <BoxG args={[0.8, 0.14, 0.2]} />
          <Flat color="#C8372D" />
        </mesh>
      ) : null}
    </group>
    {handset ? (
      <mesh position={handset} castShadow>
        <BoxG args={[0.18, 0.7, 0.16]} />
        <Flat color="#C8372D" />
      </mesh>
    ) : null}
  </group>
);

/** A bucket truck by a cell tower: cab, bed, boom raised to `bucket` (world, relative to position). */
export const BucketTruck: React.FC<{ position: V3; bucket: V3 }> = ({ position, bucket }) => {
  const base: V3 = [0, 3.2, -2.5];
  const mid: V3 = [(base[0] + bucket[0]) / 2, (base[1] + bucket[1]) / 2, (base[2] + bucket[2]) / 2];
  const d = new THREE.Vector3(bucket[0] - base[0], bucket[1] - base[1], bucket[2] - base[2]);
  const len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  const e = new THREE.Euler().setFromQuaternion(q);
  return (
    <group position={position}>
      <mesh position={[0, 1.6, 3.2]} castShadow>
        <BoxG args={[3.2, 3.2, 3]} />
        <Flat color="#E8E4DA" />
      </mesh>
      <mesh position={[0, 1.4, -2.2]} castShadow>
        <BoxG args={[3.2, 1.8, 7]} />
        <Flat color="#E8D23A" />
      </mesh>
      {[-1.6, 1.6].flatMap((x) =>
        [3, -3.5].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.55, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <CylG args={[0.55, 0.55, 0.4, 10]} />
            <Flat color="#1A1A1E" />
          </mesh>
        )),
      )}
      <mesh position={mid} rotation={e} castShadow>
        <BoxG args={[0.45, len, 0.45]} />
        <Flat color="#E8E4DA" />
      </mesh>
      <mesh position={[bucket[0], bucket[1] - 0.6, bucket[2]]} castShadow>
        <BoxG args={[1.6, 1.4, 1.6]} />
        <Flat color="#E8D23A" />
      </mesh>
      <mesh position={[0, 3.5, 4.75]}>
        <boxGeometry args={[1.8, 0.25, 0.1]} />
        <Glow color="#FFA040" />
      </mesh>
    </group>
  );
};

/** A phone box (glass sides, teal frame). Inside is 2.2 wide; the front (door) faces +Z. */
export const PhoneBox: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 6.1, 0]} castShadow>
      <BoxG args={[2.8, 0.4, 2.8]} />
      <Flat color="#1F6E6A" />
    </mesh>
    <CanvasPanel position={[0, 5.6, 1.41]} w={2.4} h={0.5} px={512} draw={drawSign("TELEPHONE", "#15161C", "#F6EBC4", 0.6)} />
    {[-1, 1].flatMap((sx) =>
      [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * 1.3, 2.95, sz * 1.3]} castShadow>
          <BoxG args={[0.2, 5.9, 0.2]} />
          <Flat color="#1F6E6A" />
        </mesh>
      )),
    )}
    <mesh position={[0, 3, -1.3]}>
      <BoxG args={[2.4, 5.6, 0.08]} />
      <Flat color="#2A5A58" />
    </mesh>
    {[-1.3, 1.3].map((x) => (
      <mesh key={x} position={[x, 3, 0]}>
        <boxGeometry args={[0.04, 5.4, 2.4]} />
        <meshBasicMaterial color="#BFE3FF" transparent opacity={0.16} depthWrite={false} toneMapped={false} />
      </mesh>
    ))}
    <mesh position={[0.6, 3.3, -1.15]} castShadow>
      <BoxG args={[0.7, 1.0, 0.25]} />
      <Flat color="#2A2D38" />
    </mesh>
  </group>
);

/** An unfolded paper map held in front of the chest between two hand points (faces the holder). */
export const PaperMap: React.FC<{ l: V3; r: V3; h?: number }> = ({ l, r, h = 1.6 }) => {
  const c: V3 = [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2 + h * 0.12, (l[2] + r[2]) / 2];
  const w = Math.hypot(r[0] - l[0], r[2] - l[2]) + 0.5;
  const yaw = Math.atan2(-(r[2] - l[2]), r[0] - l[0]);
  return (
    <group position={c} rotation={[0, yaw, 0]}>
      {[-1, 0, 1].map((k) => (
        <mesh key={k} position={[(k * w) / 3, 0, k === 0 ? 0.04 : 0]} rotation={[0, k * 0.18, 0]} castShadow>
          <boxGeometry args={[w / 3 + 0.01, h, 0.02]} />
          <Flat color={k === 0 ? "#E8DDBA" : "#DCD0AA"} />
        </mesh>
      ))}
    </group>
  );
};

// ================================================================ the kitchen (sunny morning, day 2)

/** He sits at CHAIR facing −Z (the TV wall). Table top 1.45, front edge at z = 1.0 (1 unit in front of him). */
export const KITCHEN = { chair: [0, 0, 2] as V3, tableTop: 1.45, table: { x: 0, z: -0.1, w: 3.6, d: 2.2 }, tv: { c: [0, 4.4, -4.85] as V3, w: 3.6, h: 2.0 }, win: { x: -5.9, z: 0.5, y: 3.6, w: 3.4, h: 3.0 } };

export const Kitchen: React.FC<{ t: number; trophyGlow?: number }> = ({ t, trophyGlow = 1 }) => {
  const K = KITCHEN;
  const wall = "#E8DCC4";
  const z0 = K.win.z - K.win.w / 2;
  const z1 = K.win.z + K.win.w / 2;
  const y0 = K.win.y - K.win.h / 2;
  const y1 = K.win.y + K.win.h / 2;
  return (
    <group>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[12, 0.1, 14]} />
        <Flat color="#B8946A" />
      </mesh>
      {/* back (TV) wall */}
      <mesh position={[0, 3.25, -5.1]} receiveShadow>
        <BoxG args={[12, 6.5, 0.2]} />
        <Flat color={wall} />
      </mesh>
      {/* right wall + counter */}
      <mesh position={[6, 3.25, 0]} receiveShadow>
        <BoxG args={[0.2, 6.5, 14]} />
        <Flat color="#DCCFB4" />
      </mesh>
      <mesh position={[5.1, 1.0, -1]} castShadow receiveShadow>
        <BoxG args={[1.6, 2.0, 7]} />
        <Flat color="#2E5A6A" />
      </mesh>
      <mesh position={[5.05, 2.06, -1]} castShadow receiveShadow>
        <BoxG args={[1.75, 0.12, 7.1]} />
        <Flat color="#F2EEE6" />
      </mesh>
      {/* left wall with the sunny window */}
      <mesh position={[K.win.x, 3.25, (-7 + z0) / 2]} receiveShadow>
        <BoxG args={[0.2, 6.5, z0 + 7]} />
        <Flat color="#DCCFB4" />
      </mesh>
      <mesh position={[K.win.x, 3.25, (7 + z1) / 2]} receiveShadow>
        <BoxG args={[0.2, 6.5, 7 - z1]} />
        <Flat color="#DCCFB4" />
      </mesh>
      <mesh position={[K.win.x, y0 / 2, K.win.z]} receiveShadow>
        <BoxG args={[0.2, y0, K.win.w]} />
        <Flat color="#DCCFB4" />
      </mesh>
      <mesh position={[K.win.x, (6.5 + y1) / 2, K.win.z]} receiveShadow>
        <BoxG args={[0.2, 6.5 - y1, K.win.w]} />
        <Flat color="#DCCFB4" />
      </mesh>
      <mesh position={[K.win.x + 0.08, K.win.y, K.win.z]}>
        <BoxG args={[0.1, 0.1, K.win.w]} />
        <Flat color="#FFFFFF" />
      </mesh>
      {/* the garden outside */}
      <mesh position={[-14, -0.1, 0]}>
        <BoxG args={[16, 0.1, 40]} />
        <Flat color="#5A9A4A" />
      </mesh>
      {[-4, 3, 9].map((z, i) => (
        <group key={z} position={[-12 - i * 2, 0, z]}>
          <mesh position={[0, 1.5, 0]}>
            <CylG args={[0.3, 0.4, 3, 6]} />
            <Flat color={P.bark} />
          </mesh>
          <mesh position={[0, 4.2, 0]}>
            <IcoG args={[2.2, 1]} />
            <Flat color={i % 2 ? P.leaf : "#4E9A4A"} />
          </mesh>
        </group>
      ))}
      <Halo position={[-30, 14, 6]} size={30} color="#FFF4D8" opacity={0.6} />
      {/* table + chairs */}
      <mesh position={[K.table.x, K.tableTop - 0.06, K.table.z]} castShadow receiveShadow>
        <BoxG args={[K.table.w, 0.12, K.table.d]} />
        <Flat color="#8A5A3A" />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[K.table.x + sx * (K.table.w / 2 - 0.15), (K.tableTop - 0.12) / 2, K.table.z + sz * (K.table.d / 2 - 0.15)]} castShadow>
            <BoxG args={[0.16, K.tableTop - 0.12, 0.16]} />
            <Flat color="#6A4A30" />
          </mesh>
        )),
      )}
      <OfficeChair position={K.chair} yaw={Math.PI} color="#6A4A30" />
      <OfficeChair position={[2.4, 0, -0.1]} yaw={-Math.PI / 2} color="#6A4A30" />
      {/* the TV on the back wall, with an old rabbit-ear antenna on top */}
      <mesh position={[K.tv.c[0], K.tv.c[1], K.tv.c[2] - 0.08]} castShadow>
        <BoxG args={[K.tv.w + 0.25, K.tv.h + 0.25, 0.14]} />
        <Flat color="#15161C" />
      </mesh>
      <CanvasPanel position={[K.tv.c[0], K.tv.c[1], K.tv.c[2]]} w={K.tv.w} h={K.tv.h} px={768} draw={drawNews(t)} />
      <group position={[K.tv.c[0] + 0.9, K.tv.c[1] + K.tv.h / 2 + 0.12, K.tv.c[2] - 0.05]}>
        <mesh>
          <BoxG args={[0.5, 0.2, 0.3]} />
          <Flat color="#3A3E48" />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.35, 0.65, 0]} rotation={[0, 0, -s * 0.5]}>
            <CylG args={[0.025, 0.025, 1.4, 4]} />
            <Flat color="#C9D2DE" />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={`t${s}`} position={[s * 0.68, 1.25, 0]}>
            <IcoG args={[0.05, 0]} />
            <Flat color="#C9D2DE" />
          </mesh>
        ))}
      </group>
      {/* counter things: toaster, kettle, and the chip trophy in a glass case */}
      <mesh position={[5.0, 2.45, 1.6]} castShadow>
        <BoxG args={[0.8, 0.6, 1.0]} />
        <Flat color="#C9D2DE" />
      </mesh>
      <mesh position={[5.0, 2.5, -3.4]} castShadow>
        <CylG args={[0.32, 0.4, 0.7, 10]} />
        <Flat color="#C8372D" />
      </mesh>
      <group position={TROPHY}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <BoxG args={[1.2, 0.3, 1.2]} />
          <Flat color="#2A2220" />
        </mesh>
        <group position={[0, 0.75, 0]} rotation={[0, -0.95, 0]}>
          <Chip position={[0, 0, 0]} rotation={[Math.PI / 2 - 0.25, 0, 0]} scale={0.38} glow={trophyGlow} />
        </group>
        <mesh position={[0, 0.85, 0]}>
          <boxGeometry args={[1.1, 1.1, 1.1]} />
          <meshBasicMaterial color="#DDF0FF" transparent opacity={0.12} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
};
/** Glass case with the chip trophy, on the counter. */
export const TROPHY: V3 = [5.0, 2.12, -1.0];

/** Breakfast on the table in front of CHAIR: cereal bowl, mug, plate of toast, juice. */
export const BOWL: V3 = [0.15, KITCHEN.tableTop, 0.35];
export const MUG: V3 = [0.95, KITCHEN.tableTop, 0.55];
export const Breakfast: React.FC<{ mugAt?: V3 | null }> = ({ mugAt = null }) => (
  <group>
    <group position={BOWL}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <CylG args={[0.42, 0.3, 0.32, 12]} />
        <Flat color="#F2EEE6" />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.38, 12]} />
        <Flat color="#E0B04E" />
      </mesh>
    </group>
    <group position={mugAt ?? MUG}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <CylG args={[0.2, 0.18, 0.44, 10]} />
        <Flat color="#24748F" />
      </mesh>
      <mesh position={[0.22, 0.24, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.1, 0.035, 4, 8]} />
        <Flat color="#24748F" />
      </mesh>
    </group>
    <group position={[-0.85, KITCHEN.tableTop, 0.2]}>
      <mesh position={[0, 0.03, 0]} castShadow>
        <CylG args={[0.45, 0.45, 0.06, 12]} />
        <Flat color="#F2EEE6" />
      </mesh>
      {[-0.12, 0.12].map((x, i) => (
        <mesh key={x} position={[x, 0.14, 0]} rotation={[0, i * 0.4, 0.1]} castShadow>
          <BoxG args={[0.36, 0.08, 0.36]} />
          <Flat color="#D89A4A" />
        </mesh>
      ))}
    </group>
    <mesh position={[-0.2, KITCHEN.tableTop + 0.25, -0.45]} castShadow>
      <CylG args={[0.14, 0.12, 0.5, 8]} />
      <meshBasicMaterial color="#F7A63A" transparent opacity={0.85} toneMapped={false} />
    </mesh>
  </group>
);
