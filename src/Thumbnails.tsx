/**
 * Thumbnails (Shorts covers, 1080×1920): a key shot from each episode, rendered without captions or HUD,
 * plus a big hook in the house typography.
 *   npx remotion still build Thumb-BlackHole out/thumbs/black-hole.png --gl=swangle
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { SHOTS as GTA } from "./episodes/gta-24h/shots";
import { SHOTS as NH } from "./episodes/no-humans/shots";
import { SHOTS as SA } from "./episodes/smart-animals/shots";
import { FONT, loadHouseFonts } from "./slavoski/fonts";
import { P } from "./slavoski/palette";
import { AccretionDisk, FacetedEarth } from "./slavoski/space";
import { Stage } from "./slavoski/Stage";

loadHouseFonts();

export type ThumbProps = { episode: "black-hole" | "no-humans" | "gta-24h" | "smart-animals" };

type Line = { text: string; color?: string; size?: number };
const THUMBS: Record<ThumbProps["episode"], { shot: React.ReactNode; lines: Line[]; chip: string; top: number }> = {
  "black-hole": {
    shot: (
      <Stage mood="space" camera={{ position: [0, -0.6, 16], target: [0, -0.8, 0] }} fog={false} shadows={false}>
        <AccretionDisk position={[0, -0.6, 0]} t={3} inner={0.5} outer={2.6} chunks={260} rotation={[0.32, 0, 0.1]} />
        <FacetedEarth radius={3.2} position={[0, -7.2, -1]} rotation={[0.4, 1.3, 0]} stretch={0.16} stretchDir={[0, 1, 0]} />
      </Stage>
    ),
    lines: [{ text: "A BLACK HOLE" }, { text: "NEXT TO", size: 96 }, { text: "EARTH", color: P.amber, size: 170 }],
    chip: "3.5 DAYS UNTIL IMPACT",
    top: 250,
  },
  "no-humans": {
    shot: NH.c6[2].fn({ lt: 1.8, dur: 3.2, t: 56.6 }),
    lines: [{ text: "EVERY HUMAN" }, { text: "VANISHED", color: P.amber, size: 150 }],
    chip: "100 YEARS LATER",
    top: 250,
  },
  "smart-animals": {
    shot: SA.c4[3].fn({ lt: 0.8, dur: 1.4, t: 30.6, words: [], width: 1080, height: 1920 }),
    lines: [{ text: "EVERY ANIMAL" }, { text: "GOT SMART", color: P.amber, size: 150 }],
    chip: "AND THEY'RE NOT HAPPY",
    top: 230,
  },
  "gta-24h": {
    shot: GTA.c5[0].fn({ lt: 2.2, dur: 2.6, t: 48.2 }),
    lines: [{ text: "24 HOURS", color: P.amber, size: 170 }, { text: "OF GTA 6", size: 120 }],
    chip: "IT DESTROYED ME",
    top: 230,
  },
};

const OUTLINE = (() => {
  const out: string[] = [];
  for (let a = 0; a < 24; a++) {
    const t = (a / 24) * Math.PI * 2;
    out.push(`${(Math.cos(t) * 7).toFixed(1)}px ${(Math.sin(t) * 7).toFixed(1)}px 0 ${P.ink}`);
  }
  out.push("0 14px 30px rgba(0,0,0,0.6)");
  return out.join(", ");
})();

export const Thumbnail: React.FC<ThumbProps> = ({ episode }) => {
  const th = THUMBS[episode];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {th.shot}
      {/* darken the top so the hook reads on any shot */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,6,18,0.72) 0%, rgba(5,6,18,0.35) 34%, rgba(5,6,18,0) 52%)" }} />
      <div style={{ position: "absolute", left: 87, top: 86, fontFamily: FONT, fontWeight: 700, fontSize: 34, letterSpacing: "0.32em", color: P.white }}>SLAVOSKI</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: th.top, textAlign: "center", fontFamily: FONT, fontWeight: 700 }}>
        {th.lines.map((l, i) => (
          <div key={i} style={{ fontSize: l.size ?? 118, lineHeight: 1.02, color: l.color ?? P.white, textShadow: OUTLINE, letterSpacing: "0.01em" }}>
            {l.text}
          </div>
        ))}
        <div
          style={{
            display: "inline-block",
            marginTop: 34,
            padding: "14px 30px",
            borderRadius: 14,
            background: P.amber,
            color: P.ink,
            fontSize: 44,
            letterSpacing: "0.06em",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          {th.chip}
        </div>
      </div>
    </AbsoluteFill>
  );
};
