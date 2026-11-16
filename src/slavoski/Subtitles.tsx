/**
 * Clean documentary subtitles (long-form, 16:9): sentence cues of at most two lines, bottom-centred,
 * no word pop or highlight. The same cues feed scripts/export-srt.ts, so the burned-in subtitles and
 * the .srt always match.
 */
import type { Caption } from "@remotion/captions";
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "./fonts";

export type SubtitleCue = { start: number; end: number; lines: string[]; text: string };

export type CueOptions = {
  /** Characters per line. */
  maxChars?: number;
  maxLines?: number;
  /** A pause longer than this (ms) always starts a new cue. */
  gapMs?: number;
  /** Break after a comma once the cue is at least this long. */
  softBreak?: number;
  /** Seconds a cue stays up after its last word (unless the next cue starts first). */
  tail?: number;
  /** Seconds a cue appears before its first word. */
  lead?: number;
};

/** Splits a cue into at most two lines, breaking at the space closest to the middle. */
const wrap = (text: string, maxChars: number): string[] => {
  if (text.length <= maxChars) return [text];
  const mid = text.length / 2;
  let best = -1;
  for (let i = 0; i < text.length; i++) if (text[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best < 0 ? [text] : [text.slice(0, best), text.slice(best + 1)];
};

export const subtitleCues = (words: Caption[], opts: CueOptions = {}): SubtitleCue[] => {
  const maxChars = opts.maxChars ?? 42;
  const maxTotal = maxChars * (opts.maxLines ?? 2);
  const gapMs = opts.gapMs ?? 700;
  const softBreak = opts.softBreak ?? 46;
  const tail = opts.tail ?? 0.5;
  const lead = opts.lead ?? 0.08;
  const groups: Caption[][] = [];
  let cur: Caption[] = [];
  const len = (ws: Caption[]) => ws.map((w) => w.text.trim()).join(" ").length;
  words.forEach((w, i) => {
    const t = w.text.trim();
    if (cur.length) {
      const prev = cur[cur.length - 1];
      if (w.startMs - prev.endMs > gapMs || len(cur) + 1 + t.length > maxTotal) {
        groups.push(cur);
        cur = [];
      }
    }
    cur.push(w);
    const sentenceEnd = /[.?!…]["”]?$/.test(t) || t.endsWith("...");
    const clauseEnd = /[,;:]$/.test(t) && len(cur) >= softBreak;
    if ((sentenceEnd || clauseEnd) && i < words.length) {
      groups.push(cur);
      cur = [];
    }
  });
  if (cur.length) groups.push(cur);
  return groups.map((g, i) => {
    const text = g.map((w) => w.text.trim()).join(" ");
    const start = Math.max(0, g[0].startMs / 1000 - lead);
    const nextStart = i + 1 < groups.length ? groups[i + 1][0].startMs / 1000 - lead : Infinity;
    let end = g[g.length - 1].endMs / 1000 + tail;
    // Bridge tiny gaps so subtitles don't flicker off and on between sentences.
    if (nextStart - end < 0.3) end = nextStart - 0.02;
    end = Math.min(end, nextStart - 0.02);
    return { start, end, text, lines: wrap(text, maxChars) };
  });
};

const SHADOW = (() => {
  const out: string[] = [];
  for (let a = 0; a < 12; a++) {
    const t = (a / 12) * Math.PI * 2;
    out.push(`${(Math.cos(t) * 2.4).toFixed(1)}px ${(Math.sin(t) * 2.4).toFixed(1)}px 0 rgba(6,8,18,0.92)`);
  }
  out.push("0 4px 14px rgba(0,0,0,0.6)");
  return out.join(", ");
})();

export const Subtitles: React.FC<{ words: Caption[]; options?: CueOptions; fontSize?: number; bottom?: number }> = ({
  words,
  options,
  fontSize = 44,
  bottom = 0.075,
}) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const t = frame / fps;
  const cues = useMemo(() => subtitleCues(words, options), [words, options]);
  const cue = cues.find((c) => t >= c.start && t < c.end);
  if (!cue) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          bottom: height * bottom,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 700,
          fontSize,
          lineHeight: 1.22,
          color: "#FFFFFF",
          textShadow: SHADOW,
          letterSpacing: "0.005em",
        }}
      >
        {cue.lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** SRT timestamp. */
export const srtTime = (s: number) => {
  const ms = Math.max(0, Math.round(s * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(sec)},${p(r, 3)}`;
};

export const toSrt = (cues: SubtitleCue[]) =>
  cues.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.lines.join("\n")}\n`).join("\n");
