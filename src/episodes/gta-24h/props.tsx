/** Props for the 24-hour gaming episode: our own neon open-world "game" (not GTA's art). */
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Flat } from "../../slavoski/materials";
import type { V3 } from "../../slavoski/noise";
import { FONT } from "../../slavoski/fonts";
import { POLICE_OFFICER } from "../../slavoski/hero";
import { groundedBob, headPosition, Hero, mergePose, REST } from "../../slavoski/rig/Hero";

/** Pastel art-deco building colours for the game city. */
export const GAME_COLORS = ["#E86FA8", "#4FC3C8", "#F2D8C8", "#9A7AD8", "#FF9F6A", "#E8E2F2"];
export const GAME_PINK = "#FF4FA0";
export const GAME_TEAL = "#2FE0D0";

/** Palm tree: a curved segmented trunk and drooping fronds. */
export const PalmTree: React.FC<{ position: V3; height?: number; seed?: string; sway?: number }> = ({ position, height = 6, seed = "palm", sway = 0 }) => {
  const segs = 7;
  const bend = 0.12 + random(`${seed}b`) * 0.1;
  const yaw = random(`${seed}y`) * Math.PI * 2;
  let x = 0, y = 0;
  const pieces: { x: number; y: number; a: number }[] = [];
  for (let i = 0; i < segs; i++) {
    const a = bend * i * 0.35 + sway * 0.05 * i;
    pieces.push({ x, y, a });
    x += Math.sin(a) * (height / segs);
    y += Math.cos(a) * (height / segs);
  }
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {pieces.map((p, i) => (
        <mesh key={i} position={[p.x, p.y + height / segs / 2, 0]} rotation={[0, 0, -p.a]} castShadow>
          <cylinderGeometry args={[0.16 - i * 0.008, 0.2 - i * 0.008, height / segs + 0.05, 6]} />
          <Flat color={i % 2 ? "#8A6A4A" : "#7A5A3E"} />
        </mesh>
      ))}
      <group position={[x, y, 0]}>
        {Array.from({ length: 7 }, (_, i) => {
          const a = (i / 7) * Math.PI * 2;
          return (
            <group key={i} rotation={[0, a, 0]}>
              <mesh position={[0.9, -0.25, 0]} rotation={[0, 0, -0.55 - sway * 0.05]} castShadow>
                <boxGeometry args={[2.0, 0.06, 0.45]} />
                <Flat color={i % 2 ? "#3E9A52" : "#2F7E45"} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
};

/** Bicycle facing +Z, wheels on the ground. Wheel radius 0.85, saddle ≈ 1.75 high. */
export const BIKE = { wheelR: 0.85, saddleY: 1.75, saddleZ: -0.25, barsY: 2.05, barsZ: 0.95 };
export const Bicycle: React.FC<{ position: V3; yaw?: number; spin?: number }> = ({ position, yaw = 0, spin = 0 }) => {
  const r = BIKE.wheelR;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {[-1.15, 1.15].map((z) => (
        <group key={z} position={[0, r, z]} rotation={[spin, 0, 0]}>
          <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[r, 0.06, 6, 16]} />
            <Flat color="#1A1A20" />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 1.6, 4]} />
            <Flat color="#8E96A6" />
          </mesh>
        </group>
      ))}
      {/* frame */}
      <mesh position={[0, r + 0.35, 0]} rotation={[Math.PI / 2 - 0.15, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 2.1, 6]} />
        <Flat color="#2F6FD0" />
      </mesh>
      <mesh position={[0, r + 0.45, BIKE.saddleZ]} rotation={[0.15, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1.0, 6]} />
        <Flat color="#2F6FD0" />
      </mesh>
      <mesh position={[0, BIKE.saddleY, BIKE.saddleZ]} castShadow>
        <boxGeometry args={[0.3, 0.1, 0.55]} />
        <Flat color="#111116" />
      </mesh>
      <mesh position={[0, (r + BIKE.barsY) / 2, BIKE.barsZ + 0.1]} rotation={[-0.25, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, BIKE.barsY - r + 0.2, 6]} />
        <Flat color="#2F6FD0" />
      </mesh>
      <mesh position={[0, BIKE.barsY, BIKE.barsZ]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.5, 6]} />
        <Flat color="#1A1A20" />
      </mesh>
    </group>
  );
};

/**
 * A police officer pedalling a bicycle. Legs stay at x = ±0.3, beside the wheel plane (x = 0),
 * so they never pass through the wheels; the pelvis sits on the saddle.
 */
export const CopOnBike: React.FC<{ position: V3; yaw?: number; pedal: number }> = ({ position, yaw = 0, pedal }) => {
  const s = Math.sin(pedal * Math.PI * 2);
  const pose = mergePose(REST, {
    lean: 0.45,
    lHip: [1.05 + 0.35 * s, 0.08],
    rHip: [1.05 - 0.35 * s, 0.08],
    lKnee: 1.1 - 0.45 * s,
    rKnee: 1.1 + 0.45 * s,
    lShoulder: [1.25, 0.12],
    rShoulder: [1.25, 0.12],
    lElbow: 0.35,
    rElbow: 0.35,
    headPitch: -0.25,
    expression: "smile",
  });
  // Pelvis bottom (hips − 0.18) on the saddle top.
  const bob = BIKE.saddleY + 0.05 + 0.18 - 1.55;
  const seated = { ...pose, bob };
  const head = headPosition(seated, [0, 0, BIKE.saddleZ]);
  const tiltX = pose.lean - pose.headPitch; // head's total forward pitch
  const cap: V3 = [head[0], head[1] + Math.cos(tiltX) * 0.62, head[2] + Math.sin(tiltX) * 0.62];
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <Bicycle position={[0, 0, 0]} spin={pedal * 4} />
      <Hero pose={seated} position={[0, 0, BIKE.saddleZ]} look={POLICE_OFFICER} />
      <mesh position={cap} rotation={[tiltX, 0, 0]} castShadow>
        <boxGeometry args={[1.35, 0.2, 1.32]} />
        <Flat color="#14244A" />
      </mesh>
    </group>
  );
};

/** In-game HUD (our own design): wanted stars, mission line, and big status banners. */
export const GameHud: React.FC<{ stars?: number; mission?: string; banner?: string; bannerColor?: string; scanlines?: boolean }> = ({
  stars = 0,
  mission,
  banner,
  bannerColor = "#FF4FA0",
  scanlines = true,
}) => (
  <AbsoluteFill style={{ pointerEvents: "none", fontFamily: FONT }}>
    {scanlines ? (
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 2px, transparent 2px, transparent 5px)" }} />
    ) : null}
    <div style={{ position: "absolute", right: 87, top: 300, display: "flex", gap: 10 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          style={{
            fontSize: 46,
            color: i < stars ? "#FFFFFF" : "rgba(255,255,255,0.22)",
            textShadow: i < stars ? `0 0 14px ${GAME_PINK}, 0 3px 0 #000` : "0 3px 0 rgba(0,0,0,0.5)",
          }}
        >
          ★
        </span>
      ))}
    </div>
    {mission ? (
      <div style={{ position: "absolute", left: 87, top: 300, fontSize: 26, fontWeight: 700, color: GAME_TEAL, letterSpacing: "0.12em", textShadow: "0 3px 0 #000" }}>
        {mission}
      </div>
    ) : null}
    {banner ? (
      <div style={{ position: "absolute", top: 820, width: "100%", textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            padding: "16px 40px",
            background: "rgba(0,0,0,0.55)",
            color: bannerColor,
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textShadow: `0 0 24px ${bannerColor}`,
            transform: "skewX(-8deg)",
          }}
        >
          {banner}
        </span>
      </div>
    ) : null}
  </AbsoluteFill>
);

/** HUD bar (SKILL), styled like the house Readout. */
export const SkillBar: React.FC<{ value: number; top?: number }> = ({ value, top = 196 }) => {
  const v = Math.max(0, Math.min(1, value));
  const color = v > 0.6 ? "#6FE08A" : v > 0.3 ? "#FFBA58" : "#FF5A5A";
  return (
    <div style={{ position: "absolute", right: 87, top, width: 260, fontFamily: FONT, color: "#fff", textAlign: "right" }}>
      <div style={{ fontSize: 17, letterSpacing: "0.16em", opacity: 0.6 }}>SKILL</div>
      <div style={{ marginTop: 10, height: 18, borderRadius: 9, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
        <div style={{ width: `${v * 100}%`, height: "100%", background: color, borderRadius: 9, marginLeft: "auto", boxShadow: `0 0 12px ${color}` }} />
      </div>
    </div>
  );
};

export { groundedBob };
