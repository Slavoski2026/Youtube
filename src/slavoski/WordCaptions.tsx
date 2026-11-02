import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import React, { useMemo } from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "./fonts";
import { P } from "./palette";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, "");

const OUTLINE = (() => {
  const r = 4;
  const out: string[] = [];
  for (let a = 0; a < 16; a++) {
    const t = (a / 16) * Math.PI * 2;
    out.push(`${(Math.cos(t) * r).toFixed(1)}px ${(Math.sin(t) * r).toFixed(1)}px 0 ${P.ink}`);
  }
  out.push(`0 7px 14px rgba(0,0,0,0.55)`);
  return out.join(", ");
})();

/**
 * House-style captions: 1–3 word pages centred at ~74% of the frame height.
 * The spoken word turns cream; keywords are always amber.
 */
export const WordCaptions: React.FC<{
  words: Caption[];
  keywords?: string[];
  /** Max gap (ms) to merge words onto one page. */
  combineMs?: number;
  centerY?: number;
}> = ({ words, keywords = [], combineMs = 650, centerY = 0.74 }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const kw = useMemo(() => new Set(keywords.map(norm)), [keywords]);
  const pages = useMemo(() => {
    const { pages } = createTikTokStyleCaptions({ captions: words, combineTokensWithinMilliseconds: combineMs });
    // Split long pages into chunks of at most 3 words.
    return pages.flatMap((p) => {
      if (p.tokens.length <= 3) return [p];
      const out = [];
      for (let i = 0; i < p.tokens.length; i += 3) {
        const tokens = p.tokens.slice(i, i + 3);
        out.push({ ...p, tokens, startMs: tokens[0].fromMs, text: tokens.map((t) => t.text).join("") });
      }
      return out;
    });
  }, [words, combineMs]);
  const idx = pages.findIndex((p, i) => ms >= p.startMs && (i === pages.length - 1 || ms < pages[i + 1].startMs));
  const page = idx >= 0 ? pages[idx] : null;
  if (!page) return null;
  const last = page.tokens[page.tokens.length - 1];
  if (ms > last.toMs + 700) return null; // hide during long pauses
  const pop = spring({ frame: frame - Math.round((page.startMs / 1000) * fps), fps, config: { damping: 13, stiffness: 260 } });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: height * centerY,
          transform: `translateY(-50%) scale(${0.9 + 0.1 * pop})`,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 54,
          lineHeight: 1.15,
          whiteSpace: "pre-wrap",
          textShadow: OUTLINE,
        }}
      >
        {page.tokens.map((t, i) => {
          const active = ms >= t.fromMs && ms < t.toMs + 120;
          const isKw = kw.has(norm(t.text));
          return (
            <span key={i} style={{ color: isKw ? P.amber : active ? P.cream : P.white }}>
              {t.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
