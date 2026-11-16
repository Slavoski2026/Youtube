/**
 * YouTube thumbnail for ep. 8 (1280×720 landscape): Slavoski alone in the middle of the empty avenue,
 * a big hook on the left. Render with the same HQ props as the final:
 *   npx remotion still build Thumb-LastHuman out/thumbs/last-human.png --gl=swangle --props='{"hq":true}'
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT, loadHouseFonts } from "../../slavoski/fonts";
import { P } from "../../slavoski/palette";
import { Hero } from "../../slavoski/rig/Hero";
import { Avenue } from "./shots/act1";
import { Shot, Sky, standing } from "./shots/common";

loadHouseFonts();

const OUTLINE = (() => {
  const out: string[] = [];
  for (let a = 0; a < 20; a++) {
    const t = (a / 20) * Math.PI * 2;
    out.push(`${(Math.cos(t) * 5).toFixed(1)}px ${(Math.sin(t) * 5).toFixed(1)}px 0 ${P.ink}`);
  }
  out.push("0 10px 24px rgba(0,0,0,0.55)");
  return out.join(", ");
})();

export const LastHumanThumb: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Shot mood="dawn" camera={{ position: [-5.2, 4.2, -4], target: [-1.6, 3.6, -20], fov: 34 }} fog={[150, 700]} shadowSize={40} keyDir={[0.75, 0.3, -0.55]}>
      <Avenue />
      <Hero pose={standing({ expression: "alarm", headYaw: 0.35, headPitch: 0.05 })} position={[-1.2, 0, -20]} yaw={0.55} />
      <Sky t={3} tint="dawn" />
    </Shot>
    <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(8,10,24,0.72) 0%, rgba(8,10,24,0.35) 42%, rgba(8,10,24,0) 62%)" }} />
    <div style={{ position: "absolute", left: 56, top: 120, fontFamily: FONT, fontWeight: 700, lineHeight: 0.98, textShadow: OUTLINE }}>
      <div style={{ fontSize: 66, color: P.white, letterSpacing: "0.02em" }}>THE LAST</div>
      <div style={{ fontSize: 128, color: P.amber, letterSpacing: "0.01em" }}>HUMAN</div>
      <div style={{ fontSize: 66, color: P.white, letterSpacing: "0.02em" }}>ON EARTH?</div>
      <div style={{ marginTop: 26, display: "inline-block", fontSize: 28, padding: "10px 18px", background: "rgba(8,9,18,0.7)", border: `3px solid ${P.amber}`, color: P.cream, letterSpacing: "0.12em", textShadow: "none" }}>
        HOW LONG WOULD YOU LAST?
      </div>
    </div>
    <div style={{ position: "absolute", left: 58, top: 52, fontFamily: FONT, fontWeight: 700, fontSize: 24, letterSpacing: "0.32em", color: P.white, opacity: 0.9, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>SLAVOSKI</div>
  </AbsoluteFill>
);
