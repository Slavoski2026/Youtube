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

export type TagKind = "REAL PHYSICS" | "DRAMATISED" | "HYPOTHESIS";
const TAG_DOT: Record<TagKind, string> = { "REAL PHYSICS": "#6FB8FF", DRAMATISED: P.amber, HYPOTHESIS: "#B58CFF" };

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
