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
import { SHOTS as WW3 } from "./episodes/ww3-countdown/shots";
import { thumbShot as NW } from "./episodes/no-work-2036/shots";
import { thumbShot as SD } from "./episodes/satellites-dark/shots";
import { thumbShot as MM } from "./episodes/minecraft-mobs/shots";
import { FONT, loadHouseFonts } from "./slavoski/fonts";
import { P } from "./slavoski/palette";
import { AccretionDisk, FacetedEarth } from "./slavoski/space";
import { Stage } from "./slavoski/Stage";

loadHouseFonts();

export type ThumbProps = { episode: "black-hole" | "no-humans" | "gta-24h" | "smart-animals" | "ww3-countdown" | "no-work-2036" | "satellites-dark" | "minecraft-mobs" };

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
  "ww3-countdown": {
    // Everyone running for the shelter: green SHELTER sign, lit doorway, the warden waving them in.
    shot: WW3.c4[2].fn({ lt: 1.1, dur: 1.8, t: 28.8, words: [], width: 1080, height: 1920 }),
    lines: [{ text: "WW3 STARTS" }, { text: "IN 7 DAYS", color: P.amber, size: 150 }],
    chip: "DAY BY DAY",
    top: 230,
  },
  "no-work-2036": {
    // Slavoski panicking in front of a city that robots are building.
    shot: NW({ lt: 0, dur: 2, t: 0, words: [], width: 1080, height: 1920 }),
    lines: [{ text: "WORK ENDS" }, { text: "IN 2036", color: P.amber, size: 150 }],
    chip: "ROBOTS DO EVERYTHING",
    top: 230,
  },
  "satellites-dark": {
    // Slavoski on a dawn street, phone in hand, looking up as the satellites go dark.
    shot: SD({ lt: 0, dur: 2, t: 0, words: [], width: 1080, height: 1920 }),
    lines: [{ text: "EVERY SATELLITE" }, { text: "JUST DIED", color: P.amber, size: 150 }],
    chip: "WHAT HAPPENS NEXT?",
    top: 230,
  },
  "minecraft-mobs": {
    // Slavoski mid-scream on his street at sunset, the hisser flashing right behind him.
    shot: MM({ lt: 0, dur: 2, t: 0, words: [], width: 1080, height: 1920 }),
    lines: [{ text: "MINECRAFT MOBS" }, { text: "IN REAL LIFE", color: P.amber, size: 150 }],
    chip: "DON'T LOOK BEHIND YOU",
    top: 300,
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

/**
 * Grid-safe layout. On the channel's Shorts shelf the tiles sit edge to edge, are cropped slightly
 * top and bottom, and carry a "⋯" menu top-right and a view count bottom-left. So every line of text
 * stays inside a 780 px column (150 px side margins), starts below y ≈ 300 and ends above ~70%.
 */
const COLUMN = 780;
/** DejaVu Sans Bold caps average about 0.75 em per character (spaces included); 0.8 keeps a margin. */
const fit = (text: string, max: number) => Math.min(max, Math.floor(COLUMN / (0.8 * text.length)));

export const Thumbnail: React.FC<ThumbProps> = ({ episode }) => {
  const th = THUMBS[episode];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {th.shot}
      {/* darken the top so the hook reads on any shot, even as a small tile */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,6,18,0.78) 0%, rgba(5,6,18,0.5) 32%, rgba(5,6,18,0) 55%)" }} />
      <div style={{ position: "absolute", left: 150, right: 150, top: Math.max(300, th.top + 60), textAlign: "center", fontFamily: FONT, fontWeight: 700 }}>
        <div style={{ fontSize: 30, letterSpacing: "0.32em", marginRight: "-0.32em", color: "rgba(255,255,255,0.85)", marginBottom: 22 }}>SLAVOSKI</div>
        {th.lines.map((l, i) => (
          <div key={i} style={{ fontSize: fit(l.text, l.size ?? 112), lineHeight: 1.05, color: l.color ?? P.white, textShadow: OUTLINE, whiteSpace: "nowrap" }}>
            {l.text}
          </div>
        ))}
        <div
          style={{
            display: "inline-block",
            marginTop: 30,
            padding: "12px 26px",
            borderRadius: 14,
            background: P.amber,
            color: P.ink,
            fontSize: Math.min(40, Math.floor((COLUMN - 60) / (0.72 * th.chip.length))),
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          {th.chip}
        </div>
      </div>
    </AbsoluteFill>
  );
};
