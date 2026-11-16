/**
 * HTML overlays in the SLAVOSKI house style (1080×1920 coordinates):
 * BrandLockup, TitleCard, EndCard, Tag (REAL PHYSICS / DRAMATISED / HYPOTHESIS), Readout, CardLine.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "./fonts";
import { P } from "./palette";

const LEFT = 87;

export const BrandLockup: React.FC<{
  chapter?: { n: number; title: string } | null;
  /** Lines under SLAVOSKI when there is no chapter (title card). */
  sub?: string[];
  opacity?: number;
}> = ({ chapter, sub, opacity = 1 }) => (
  <div style={{ position: "absolute", left: LEFT, top: 86, fontFamily: FONT, opacity, color: P.white }}>
    <div style={{ fontWeight: 700, fontSize: 28, letterSpacing: "0.32em", lineHeight: 1 }}>SLAVOSKI</div>
    {chapter ? (
      <div style={{ marginTop: 24, fontSize: 21, letterSpacing: "0.12em", opacity: 0.62, whiteSpace: "pre" }}>
        {String(chapter.n).padStart(2, "0")}
        {"  /  "}
        {chapter.title}
      </div>
    ) : null}
    {sub?.map((s, i) => (
      <div key={i} style={{ marginTop: i === 0 ? 24 : 16, fontSize: i === 0 ? 21 : 18, letterSpacing: "0.12em", opacity: i === 0 ? 0.62 : 0.5, whiteSpace: "pre" }}>
        {s}
      </div>
    ))}
  </div>
);

export type TitleLine = { text: string; color?: string; size?: number };

/** Big title under the lockup. `startFrame` = when it begins animating in. */
export const TitleCard: React.FC<{
  series?: string;
  disclaimer?: string;
  lines: TitleLine[];
  startFrame?: number;
  /** Frame at which it fades out (optional). */
  outFrame?: number;
}> = ({ series = "A COSMIC WHAT IF", disclaimer = "HYPOTHETICAL SCENARIO  /  NOT TO SCALE", lines, startFrame = 0, outFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = outFrame !== undefined ? interpolate(frame, [outFrame, outFrame + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return (
    <AbsoluteFill style={{ fontFamily: FONT, opacity: out }}>
      <BrandLockup sub={[series, disclaimer]} />
      <div style={{ position: "absolute", left: LEFT - 4, top: 218 }}>
        {lines.map((l, i) => {
          const s = spring({ frame: frame - startFrame - i * 4, fps, config: { damping: 14, stiffness: 160 } });
          return (
            <div
              key={i}
              style={{
                fontWeight: 700,
                fontSize: l.size ?? 76,
                lineHeight: 1.08,
                color: l.color ?? P.white,
                letterSpacing: "0.01em",
                transform: `translateY(${(1 - s) * 30}px)`,
                opacity: s,
                textShadow: "0 4px 18px rgba(0,0,0,0.35)",
                whiteSpace: "pre",
              }}
            >
              {l.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export type TagKind = "REAL PHYSICS" | "DRAMATISED" | "HYPOTHESIS" | "EXPERT ESTIMATE" | "REAL SCIENCE" | "REAL PREDICTION";
const TAG_DOT: Record<TagKind, string> = {
  "REAL PHYSICS": "#6FB8FF",
  DRAMATISED: P.amber,
  HYPOTHESIS: "#B58CFF",
  "EXPERT ESTIMATE": "#7FD6A0",
  "REAL SCIENCE": "#6FB8FF",
  "REAL PREDICTION": "#7FD6A0",
};

/** Small honesty tag under the lockup. */
export const Tag: React.FC<{ kind: TagKind; appearFrame?: number }> = ({ kind, appearFrame = 0 }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame - appearFrame, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: LEFT,
        top: 176,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 14px 7px 12px",
        borderRadius: 999,
        background: "rgba(8,10,24,0.55)",
        border: "1px solid rgba(255,255,255,0.14)",
        fontFamily: FONT,
        fontSize: 16,
        letterSpacing: "0.14em",
        color: "rgba(255,255,255,0.82)",
        opacity: o,
      }}
    >
      <span style={{ width: 9, height: 9, borderRadius: 9, background: TAG_DOT[kind] }} />
      {kind}
    </div>
  );
};

/** A HUD readout (label over a big value), right-aligned top-right by default. */
export const Readout: React.FC<{
  label: string;
  value: string;
  accent?: string;
  top?: number;
  align?: "left" | "right";
  pulse?: number;
}> = ({ label, value, accent = P.amber, top = 86, align = "right", pulse = 0 }) => (
  <div
    style={{
      position: "absolute",
      top,
      [align === "right" ? "right" : "left"]: LEFT,
      textAlign: align,
      fontFamily: FONT,
      color: P.white,
    }}
  >
    <div style={{ fontSize: 17, letterSpacing: "0.16em", opacity: 0.6 }}>{label}</div>
    <div
      style={{
        marginTop: 8,
        fontWeight: 700,
        fontSize: 40,
        letterSpacing: "0.04em",
        color: accent,
        fontVariantNumeric: "tabular-nums",
        textShadow: `0 0 ${12 + pulse * 20}px ${accent}55`,
      }}
    >
      {value}
    </div>
  </div>
);

/** A one-line info card (e.g. "≈ 1.8 CM WIDE"), centred at a given y. */
export const CardLine: React.FC<{ text: string; sub?: string; y: number; appearFrame?: number; accent?: string }> = ({
  text,
  sub,
  y,
  appearFrame = 0,
  accent = P.amber,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - appearFrame, fps, config: { damping: 15, stiffness: 180 } });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", fontFamily: FONT, opacity: s, transform: `scale(${0.9 + 0.1 * s})` }}>
      <div
        style={{
          display: "inline-block",
          padding: "14px 26px",
          borderRadius: 14,
          background: "rgba(8,10,24,0.6)",
          border: `2px solid ${accent}`,
          color: P.white,
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: "0.08em",
        }}
      >
        {text}
        {sub ? <div style={{ fontWeight: 400, fontSize: 19, letterSpacing: "0.14em", opacity: 0.7, marginTop: 6 }}>{sub}</div> : null}
      </div>
    </div>
  );
};

export const EndCard: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame - startFrame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: `rgba(9,14,38,${0.82 * o})`, justifyContent: "center", alignItems: "center", fontFamily: FONT, color: P.white }}>
      <div style={{ opacity: o, textAlign: "center", transform: `translateY(${(1 - o) * 20}px)` }}>
        <div style={{ fontWeight: 700, fontSize: 64, letterSpacing: "0.32em", marginRight: "-0.32em" }}>SLAVOSKI</div>
        <div style={{ marginTop: 26, fontSize: 26, letterSpacing: "0.2em", opacity: 0.7, color: P.amber }}>A COSMIC WHAT IF</div>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================ long-form (16:9) overlays

/**
 * Long-form chapter label: SLAVOSKI plus "05  /  LIGHTS OUT", top-left, shown for `hold` seconds after
 * `startFrame` and then faded out (the long-form frame stays clean between chapter starts).
 */
export const ChapterLabel: React.FC<{ chapter: { n: number; title: string }; startFrame: number; hold?: number; left?: number; top?: number }> = ({
  chapter,
  startFrame,
  hold = 4.2,
  left = 84,
  top = 66,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lt = (frame - startFrame) / fps;
  if (lt < 0 || lt > hold + 0.6) return null;
  const o = Math.min(1, lt / 0.45) * (1 - Math.max(0, Math.min(1, (lt - hold) / 0.6)));
  const slide = (1 - Math.min(1, lt / 0.45)) * 14;
  return (
    <div style={{ position: "absolute", left, top, fontFamily: FONT, color: P.white, opacity: o, transform: `translateX(${-slide}px)` }}>
      <div style={{ fontWeight: 700, fontSize: 24, letterSpacing: "0.32em", lineHeight: 1, textShadow: "0 2px 10px rgba(0,0,0,0.45)" }}>SLAVOSKI</div>
      <div style={{ marginTop: 16, fontSize: 21, letterSpacing: "0.14em", whiteSpace: "pre", textShadow: "0 2px 10px rgba(0,0,0,0.55)" }}>
        <span style={{ color: P.amber, fontWeight: 700 }}>{String(chapter.n).padStart(2, "0")}</span>
        <span style={{ opacity: 0.75 }}>{"  /  "}{chapter.title}</span>
      </div>
    </div>
  );
};

/** A brief time stamp at a time jump ("DAY 7", "ONE YEAR LATER"), centred near the top. */
export const TimeStamp: React.FC<{ text: string; startFrame: number; hold?: number; top?: number }> = ({ text, startFrame, hold = 2.4, top = 120 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lt = (frame - startFrame) / fps;
  if (lt < 0 || lt > hold + 0.5) return null;
  const inK = Math.min(1, lt / 0.3);
  const o = inK * (1 - Math.max(0, Math.min(1, (lt - hold) / 0.5)));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontFamily: FONT, opacity: o, pointerEvents: "none" }}>
      <div
        style={{
          display: "inline-block",
          padding: "12px 34px 13px",
          background: "rgba(8,9,18,0.62)",
          border: `3px solid ${P.amber}`,
          color: P.amber,
          fontWeight: 700,
          fontSize: 46,
          letterSpacing: "0.22em",
          marginRight: "-0.22em",
          transform: `scale(${1.08 - 0.08 * inK})`,
        }}
      >
        {text}
      </div>
    </div>
  );
};
