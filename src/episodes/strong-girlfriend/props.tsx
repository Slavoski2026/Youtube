/**
 * Sets and props for "What If Your Girlfriend Was Stronger Than You?" (ep. 9).
 * Comedy, non-graphic: the rib crack is a cartoon CRACK! burst, nothing is shown hurt.
 * She is a new character on Slavoski's rig (teal sports jacket, auburn ponytail), never an orange jacket.
 * Everything rests on y = 0 using its real extents and follows the kit detail level.
 */
import React from "react";
import { random } from "remotion";
import * as THREE from "three";
import { Building, Car } from "../../slavoski/city";
import { BoxG, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { FONT } from "../../slavoski/fonts";
import { crowdLook, type HeroLook } from "../../slavoski/hero";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { clamp01, type V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { headPosition, Hero, walkPose, type Pose } from "../../slavoski/rig/Hero";
import { CanvasPanel, fitText } from "../../slavoski/screens";

// ================================================================ characters

/** The girlfriend: teal sports zip jacket, dark leggings, white trainers, auburn hair with a ponytail. */
export const GF_LOOK: HeroLook = {
  skin: "#E0AC84",
  skinShade: "#C48E68",
  hair: "#6A2E1E",
  jacket: "#1F8A8A",
  jacketShade: "#176E6E",
  zipper: "#F2EEE6",
  jeans: "#2A2A3A",
  shoe: "#F2EEE6",
};
export const LABCOAT = (base: HeroLook): HeroLook => ({ ...base, jacket: "#F2F2EE", jacketShade: "#D8D8D2", zipper: "#C9D2DE" });
export const OLIVE = (base: HeroLook): HeroLook => ({ ...base, jacket: "#4E5A34", jacketShade: "#3E4828", zipper: "#D8B04A", jeans: "#3E4828", shoe: "#1A1A1E" });

/** Her ponytail, scrunchie and side locks, following the head (yaw, pitch, roll) of `pose`. */
export const GfHair: React.FC<{ pose: Pose; position: V3; yaw?: number; color?: string }> = ({ pose, position, yaw = 0, color = GF_LOOK.hair }) => {
  const h = headPosition(pose, position, yaw);
  const e = new THREE.Euler(-pose.headPitch, yaw + pose.headYaw, pose.headRoll, "YXZ");
  return (
    <group position={h} rotation={e}>
      <group position={[0, 0.3, -0.7]}>
        <mesh rotation={[Math.PI / 2 - 0.3, 0, 0]}>
          <torusGeometry args={[0.16, 0.07, 5, 10]} />
          <Flat color="#E8475A" />
        </mesh>
        <mesh position={[0, -0.6, -0.22]} rotation={[Math.PI + 0.35, 0, 0]} castShadow>
          <ConeG args={[0.3, 1.4, 8]} />
          <Flat color={color} />
        </mesh>
      </group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.64, -0.2, -0.22]} castShadow>
          <BoxG args={[0.16, 1.0, 0.62]} />
          <Flat color={color} />
        </mesh>
      ))}
    </group>
  );
};

/** The girlfriend: rig + hair. */
export const Gf: React.FC<{ pose: Pose; position: V3; yaw?: number }> = ({ pose, position, yaw = 0 }) => (
  <>
    <Hero pose={pose} position={position} yaw={yaw} look={GF_LOOK} />
    <GfHair pose={pose} position={position} yaw={yaw} />
  </>
);

// ================================================================ HUD and comic bits (HTML)

/** A centred stamp ("DAY 3"), in for ~1.5 s. */
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

/** A comic burst ("CRACK!", "POP!") at a screen point, popping in at lt = 0. */
export const Burst: React.FC<{ x: number; y: number; text: string; lt: number; color?: string; rot?: number; size?: number }> = ({ x, y, text, lt, color = "#FFE07A", rot = -8, size = 1 }) => {
  if (lt < 0 || lt > 1.2) return null;
  const k = clamp01(lt / 0.1);
  const out = clamp01((lt - 0.9) / 0.3);
  const s = (0.6 + 0.55 * k - 0.15 * clamp01((lt - 0.1) / 0.15)) * size;
  const pts = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const r = i % 2 ? 36 : 50;
    return `${50 + Math.cos(a) * r}% ${50 + Math.sin(a) * r}%`;
  }).join(", ");
  return (
    <div style={{ position: "absolute", left: x - 170, top: y - 110, width: 340, height: 220, transform: `scale(${s}) rotate(${rot}deg)`, opacity: 1 - out, pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, background: "#15161C", clipPath: `polygon(${pts})`, transform: "scale(1.08)" }} />
      <div style={{ position: "absolute", inset: 0, background: color, clipPath: `polygon(${pts})` }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 700, fontSize: 62, color: "#C8372D", letterSpacing: "0.02em" }}>{text}</div>
    </div>
  );
};

/** Phone UI: a video of her going viral, the view count racing up. */
export const ViralScreen: React.FC<{ w: number; h: number; t: number; k: number }> = ({ w, h, t, k }) => {
  const views = Math.round(1200 + k ** 2 * 48_000_000);
  const fmt = views > 1e6 ? `${(views / 1e6).toFixed(1)}M` : views > 1e3 ? `${Math.round(views / 1e3)}K` : String(views);
  return (
    <div style={{ width: w, height: h, background: "#0E1018", fontFamily: FONT, color: "#FFF", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.08, height: h * 0.52, background: "linear-gradient(180deg, #7FC8F0 0%, #CDEBF7 70%, #6AA85A 70%)" }}>
        {/* a tiny teal figure holding a plane over her head */}
        <div style={{ position: "absolute", left: w * 0.44, top: h * 0.27, width: w * 0.12, height: h * 0.17, background: "#1F8A8A", borderRadius: w * 0.02 }} />
        <div style={{ position: "absolute", left: w * 0.455, top: h * 0.2, width: w * 0.09, height: w * 0.09, background: "#E0AC84", borderRadius: "50%" }} />
        <div style={{ position: "absolute", left: w * 0.14 + Math.sin(t * 3) * 2, top: h * 0.06, width: w * 0.72, height: h * 0.07, background: "#E8E4DA", borderRadius: h * 0.04 }} />
        <div style={{ position: "absolute", left: w * 0.42, top: h * 0.02, width: w * 0.16, height: h * 0.15, background: "#D9DEE8", borderRadius: w * 0.02 }} />
      </div>
      <div style={{ position: "absolute", left: w * 0.06, right: w * 0.06, top: h * 0.63, fontWeight: 700, fontSize: w * 0.075, lineHeight: 1.15 }}>STRONGEST GIRLFRIEND EVER?!</div>
      <div style={{ position: "absolute", left: w * 0.06, top: h * 0.76, fontSize: w * 0.06, color: P.amber, fontWeight: 700 }}>{fmt} views</div>
      <div style={{ position: "absolute", right: w * 0.06, top: h * 0.74, fontSize: w * 0.11, color: "#FF4A6A" }}>♥</div>
      {Array.from({ length: 6 }, (_, i) => {
        const life = ((t * 0.9 + i / 6) % 1 + 1) % 1;
        return <div key={i} style={{ position: "absolute", right: w * (0.08 + (i % 3) * 0.05), top: h * (0.7 - life * 0.5), fontSize: w * 0.07, color: "#FF4A6A", opacity: 1 - life }}>♥</div>;
      })}
    </div>
  );
};

// ================================================================ small props

/** A glass jar of pickles with a red lid. Centre of the jar body at the origin, lid on +Y. `burst` 0..1 shatters it. */
export const JAR = { r: 0.26, h: 0.62 };
export const Jar: React.FC<{ position: V3; rotation?: V3; lidOff?: number; burst?: number }> = ({ position, rotation = [0, 0, 0], lidOff = 0, burst = 0 }) => {
  if (burst > 0) {
    return (
      <group position={position}>
        {Array.from({ length: 22 }, (_, i) => {
          const a = random(`ja${i}`) * Math.PI * 2;
          const up = random(`ju${i}`) * 1.4 - 0.2;
          const v = 1.2 + random(`jv${i}`) * 1.6;
          const k = Math.min(burst, 1) * 0.45;
          return (
            <mesh key={i} position={[Math.cos(a) * v * k, up * v * k - k * k * 2, Math.sin(a) * v * k]} rotation={[i, i * 2, i * 3]}>
              <IcoG args={[0.05 + random(`js${i}`) * 0.05, 0]} />
              <meshBasicMaterial color={i % 4 === 0 ? "#6A9A3A" : "#CFEFFF"} transparent opacity={0.85 * (1 - clamp01((burst - 0.7) / 0.3))} toneMapped={false} />
            </mesh>
          );
        })}
        <Halo size={1.2 * (1 - clamp01(burst * 2))} color="#FFFFFF" opacity={0.7} />
      </group>
    );
  }
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <CylG args={[JAR.r, JAR.r, JAR.h, 12]} />
        <meshBasicMaterial color="#CFEFFF" transparent opacity={0.35} depthWrite={false} toneMapped={false} />
      </mesh>
      {[-0.12, 0.05, 0.16].map((y, i) => (
        <mesh key={i} position={[(i - 1) * 0.08, y, (i % 2) * 0.06]} rotation={[0, 0, 0.2 * i]}>
          <CylG args={[0.07, 0.07, 0.36, 6]} />
          <Flat color="#5A8A2E" />
        </mesh>
      ))}
      <group position={[0, JAR.h / 2 + 0.05 + lidOff * 0.4, 0]} rotation={[0, lidOff * 2, lidOff * 0.6]}>
        <mesh>
          <CylG args={[JAR.r + 0.02, JAR.r + 0.02, 0.1, 12]} />
          <Flat color="#C8372D" />
        </mesh>
      </group>
    </group>
  );
};

/** A spoon (handle along +Y from the grip), bent by `bend` 0..1 at its neck. */
export const Spoon: React.FC<{ position: V3; rotation?: V3; bend?: number }> = ({ position, rotation = [0, 0, 0], bend = 0 }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 0.28, 0]}>
      <BoxG args={[0.07, 0.56, 0.03]} />
      <Flat color="#C9D2DE" />
    </mesh>
    <group position={[0, 0.56, 0]} rotation={[0, 0, -bend * 1.6]}>
      <mesh position={[0, 0.2, 0]}>
        <BoxG args={[0.06, 0.4, 0.03]} />
        <Flat color="#C9D2DE" />
      </mesh>
      <mesh position={[0, 0.48, 0]} scale={[1, 1.4, 0.4]}>
        <IcoG args={[0.12, 1]} />
        <Flat color="#DDE3EC" />
      </mesh>
    </group>
  </group>
);

/** A paper shopping bag (bottom at the origin, handles up). */
export const Bag: React.FC<{ position: V3; color?: string; yaw?: number }> = ({ position, color = "#C9A46A", yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.42, 0]} castShadow>
      <BoxG args={[0.62, 0.84, 0.36]} />
      <Flat color={color} />
    </mesh>
    <mesh position={[0, 0.98, 0]}>
      <torusGeometry args={[0.14, 0.025, 4, 8, Math.PI]} />
      <Flat color="#5A3E2E" />
    </mesh>
    <mesh position={[0.08, 0.95, 0]} rotation={[0.2, 0, 0.3]}>
      <BoxG args={[0.12, 0.3, 0.12]} />
      <Flat color="#5A9A3A" />
    </mesh>
  </group>
);

/** A water bottle (bottom at the origin). */
export const Bottle: React.FC<{ position: V3; rotation?: V3 }> = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 0.3, 0]} castShadow>
      <CylG args={[0.13, 0.13, 0.6, 8]} />
      <meshLambertMaterial color="#7FD0FF" flatShading transparent opacity={0.8} />
    </mesh>
    <mesh position={[0, 0.66, 0]}>
      <CylG args={[0.08, 0.1, 0.12, 8]} />
      <Flat color="#E8475A" />
    </mesh>
  </group>
);

/** A gold crown (bottom at the origin). */
export const Crown: React.FC<{ position: V3; scale?: number; rotation?: V3 }> = ({ position, scale = 1, rotation = [0, 0, 0] }) => (
  <group position={position} scale={scale} rotation={rotation}>
    <mesh position={[0, 0.16, 0]}>
      <CylG args={[0.5, 0.46, 0.32, 10, 1, true]} />
      <meshLambertMaterial color="#F2C23A" flatShading side={THREE.DoubleSide} emissive="#5A4000" />
    </mesh>
    {Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2;
      return (
        <group key={i} position={[Math.sin(a) * 0.47, 0.42, Math.cos(a) * 0.47]}>
          <mesh>
            <ConeG args={[0.12, 0.3, 4]} />
            <meshLambertMaterial color="#F2C23A" flatShading emissive="#5A4000" />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <IcoG args={[0.06, 0]} />
            <Glow color={i % 2 ? "#E8475A" : "#7FD0FF"} />
          </mesh>
        </group>
      );
    })}
  </group>
);

// ================================================================ the home kitchen (sunrise / sunset)

/** Table along X (top 1.45), she sits at x = −2 facing +X, he at x = +2 facing −X. Window in the back wall. */
export const HOME = { tableTop: 1.45, gf: [-2.0, 0, 0] as V3, me: [2.0, 0, 0] as V3, win: { c: [0, 4.2, -4.95] as V3, w: 5, h: 3 } };
/** Room interior: x ±10, z from −5.1 (window wall) to 15 (behind the cameras), ceiling at 7. */
export const ROOM = { x: 10, zBack: -5.1, zFront: 15, h: 7 };
export const HomeKitchen: React.FC<{ evening?: boolean }> = ({ evening = false }) => {
  const W = HOME.win;
  const wall = evening ? "#E8C9A8" : "#E8DCC4";
  const side = evening ? "#DDBB98" : "#DCCFB4";
  const lamp = evening ? "#FFC27A" : "#FFE2B8";
  const zMid = (ROOM.zBack + ROOM.zFront) / 2;
  const depth = ROOM.zFront - ROOM.zBack;
  const sideW = ROOM.x - W.w / 2;
  return (
    <group>
      <mesh position={[0, -0.05, zMid]} receiveShadow>
        <BoxG args={[ROOM.x * 2, 0.1, depth]} />
        <Flat color="#B8946A" />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[-ROOM.x + 0.8 + i * 1.65, 0.004, zMid]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.03, depth]} />
          <Flat color="#9A7652" />
        </mesh>
      ))}
      {/* rug under the table */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7.4, 4.6]} />
        <Flat color={evening ? "#7A3A4A" : "#2E5A6A"} />
      </mesh>
      {/* back wall with a big window (pieces around the opening) */}
      <mesh position={[0, (W.c[1] - W.h / 2) / 2, ROOM.zBack]} receiveShadow>
        <BoxG args={[ROOM.x * 2, W.c[1] - W.h / 2, 0.2]} />
        <Flat color={wall} />
      </mesh>
      <mesh position={[0, (ROOM.h + W.c[1] + W.h / 2) / 2, ROOM.zBack]} receiveShadow>
        <BoxG args={[ROOM.x * 2, ROOM.h - (W.c[1] + W.h / 2), 0.2]} />
        <Flat color={wall} />
      </mesh>
      {[-1, 1].map((s2) => (
        <mesh key={s2} position={[s2 * (W.w / 2 + sideW / 2), W.c[1], ROOM.zBack]} receiveShadow>
          <BoxG args={[sideW, W.h, 0.2]} />
          <Flat color={wall} />
        </mesh>
      ))}
      {/* window frame + mullion + sill */}
      <mesh position={[W.c[0], W.c[1], ROOM.zBack + 0.1]}>
        <BoxG args={[0.12, W.h, 0.12]} />
        <Flat color="#FFFFFF" />
      </mesh>
      <mesh position={[W.c[0], W.c[1] - W.h / 2 - 0.06, ROOM.zBack + 0.25]} castShadow>
        <BoxG args={[W.w + 0.4, 0.12, 0.5]} />
        <Flat color="#FFFFFF" />
      </mesh>
      {[-1, 1].map((s2) => (
        <mesh key={`c${s2}`} position={[W.c[0] + s2 * (W.w / 2 + 0.45), W.c[1] + 0.2, ROOM.zBack + 0.2]} castShadow>
          <BoxG args={[0.7, W.h + 1.0, 0.14]} />
          <Flat color={evening ? "#A0503A" : "#C8B48A"} />
        </mesh>
      ))}
      {/* side walls, front wall (behind the cameras), ceiling */}
      {[-1, 1].map((s2) => (
        <mesh key={`s${s2}`} position={[s2 * ROOM.x, ROOM.h / 2, zMid]} receiveShadow>
          <BoxG args={[0.2, ROOM.h, depth]} />
          <Flat color={side} />
        </mesh>
      ))}
      <mesh position={[0, ROOM.h / 2, ROOM.zFront]} receiveShadow>
        <BoxG args={[ROOM.x * 2, ROOM.h, 0.2]} />
        <Flat color={side} />
      </mesh>
      <mesh position={[0, ROOM.h + 0.1, zMid]} receiveShadow>
        <BoxG args={[ROOM.x * 2, 0.2, depth]} />
        <Flat color="#F2EADA" />
      </mesh>
      {/* skirting */}
      {[-1, 1].map((s2) => (
        <mesh key={`k${s2}`} position={[s2 * (ROOM.x - 0.12), 0.18, zMid]}>
          <BoxG args={[0.06, 0.36, depth]} />
          <Flat color="#F2EEE6" />
        </mesh>
      ))}
      {/* pendant lamps over the table: cord, shade, glowing bulb, warm light */}
      {[-0.7, 0.7].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, (ROOM.h + 5.6) / 2, 0]}>
            <CylG args={[0.02, 0.02, ROOM.h - 5.6, 4]} />
            <Flat color="#2A2A30" />
          </mesh>
          <mesh position={[0, 5.45, 0]}>
            <ConeG args={[0.5, 0.45, 12, 1, true]} />
            <meshLambertMaterial color="#2E5A6A" flatShading side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 5.22, 0]}>
            <IcoG args={[0.14, 1]} />
            <Glow color="#FFF4D8" />
          </mesh>
          <Halo position={[0, 5.15, 0]} size={1.6} color={lamp} opacity={0.6} />
          <pointLight position={[0, 5.0, 0]} color={lamp} intensity={evening ? 9 : 4} distance={9} decay={2} />
        </group>
      ))}
      {/* ceiling downlights */}
      {[-6, 6].flatMap((x) =>
        [-2, 5, 11].map((z) => (
          <mesh key={`d${x}${z}`} position={[x, ROOM.h - 0.01, z]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.28, 12]} />
            <Glow color="#FFF6E4" />
          </mesh>
        )),
      )}
      <pointLight position={[0, 6.2, 8]} color={lamp} intensity={evening ? 10 : 6} distance={16} decay={2} />
      {/* the street outside */}
      {[-14, -4, 7, 16].map((x, i) => (
        <Building key={x} position={[x, -2, -26 - (i % 2) * 8]} w={8} d={6} h={18 + i * 4} color={[P.bldgSlate, P.bldgTeal, P.bldgPurple, P.bldgNavy][i]} seed={`hk${i}`} power={evening ? 0.6 : 0.2} />
      ))}
      {/* counter + cupboards along the back wall, a fridge on the right */}
      <mesh position={[-5.5, 1.0, -4.2]} castShadow receiveShadow>
        <BoxG args={[4.6, 2.0, 1.4]} />
        <Flat color="#2E5A6A" />
      </mesh>
      <mesh position={[-5.5, 2.06, -4.2]} receiveShadow>
        <BoxG args={[4.7, 0.12, 1.5]} />
        <Flat color="#F2EEE6" />
      </mesh>
      <mesh position={[-5.5, 5.0, -4.6]} castShadow>
        <BoxG args={[4.6, 1.6, 0.8]} />
        <Flat color="#2E5A6A" />
      </mesh>
      <mesh position={[-5.5, 4.05, -4.85]}>
        <boxGeometry args={[4.4, 0.08, 0.3]} />
        <Glow color="#FFF0D0" />
      </mesh>
      <Fridge position={[5.6, 0, -4.1]} />
      {/* a plant in the corner, a framed picture on the left wall, a shelf with jars */}
      <group position={[-8.6, 0, -3.6]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <CylG args={[0.55, 0.42, 1.0, 10]} />
          <Flat color="#C8372D" />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[Math.sin(i * 1.6) * 0.3, 1.6 + i * 0.35, Math.cos(i * 1.6) * 0.3]} castShadow>
            <IcoG args={[0.55 - i * 0.08, 1]} />
            <Flat color={i % 2 ? P.leaf : "#4E9A4A"} />
          </mesh>
        ))}
      </group>
      <group position={[-ROOM.x + 0.12, 4.0, 3]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <BoxG args={[3.0, 2.0, 0.1]} />
          <Flat color="#5A3E2E" />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[2.6, 1.6]} />
          <Flat color={evening ? "#E89A6A" : "#7FC8F0"} />
        </mesh>
        <mesh position={[0.3, -0.3, 0.07]}>
          <planeGeometry args={[1.6, 0.8]} />
          <Flat color="#2F7A5A" />
        </mesh>
      </group>
      <group position={[ROOM.x - 0.4, 3.6, 2]}>
        <mesh>
          <BoxG args={[0.6, 0.1, 3.2]} />
          <Flat color="#8A5A3A" />
        </mesh>
        {[-1, 0, 1].map((i) => (
          <mesh key={i} position={[0, 0.35, i * 0.9]}>
            <CylG args={[0.2, 0.2, 0.6, 8]} />
            <meshBasicMaterial color="#CFEFFF" transparent opacity={0.5} toneMapped={false} />
          </mesh>
        ))}
      </group>
      {/* table */}
      <mesh position={[0, HOME.tableTop - 0.06, 0]} castShadow receiveShadow>
        <BoxG args={[2.4, 0.12, 2.2]} />
        <Flat color="#8A5A3A" />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 1.05, (HOME.tableTop - 0.12) / 2, sz * 0.95]} castShadow>
            <BoxG args={[0.14, HOME.tableTop - 0.12, 0.14]} />
            <Flat color="#6A4A30" />
          </mesh>
        )),
      )}
      <KitchenChair position={HOME.gf} yaw={Math.PI / 2} />
      <KitchenChair position={HOME.me} yaw={-Math.PI / 2} />
    </group>
  );
};

/** A wooden chair matching a seated hero (seat top 0.72); its back on −Z of its own space. */
export const KitchenChair: React.FC<{ position: V3; yaw?: number }> = ({ position, yaw = 0 }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.66, 0]} castShadow receiveShadow>
      <BoxG args={[1.3, 0.12, 1.1]} />
      <Flat color="#6A4A30" />
    </mesh>
    <mesh position={[0, 1.6, -0.5]} castShadow>
      <BoxG args={[1.2, 1.6, 0.1]} />
      <Flat color="#6A4A30" />
    </mesh>
    {[-1, 1].flatMap((sx) =>
      [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * 0.55, 0.3, sz * 0.45]} castShadow>
          <BoxG args={[0.1, 0.6, 0.1]} />
          <Flat color="#5A3E2E" />
        </mesh>
      )),
    )}
  </group>
);

// ================================================================ heavy things (bottom at the origin unless said)

/** A fridge (2.0 wide, 4.6 tall, 1.6 deep), door on +Z. */
export const FRIDGE = { w: 2.0, h: 4.6, d: 1.6 };
export const Fridge: React.FC<{ position: V3; rotation?: V3 }> = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, FRIDGE.h / 2, 0]} castShadow receiveShadow>
      <BoxG args={[FRIDGE.w, FRIDGE.h, FRIDGE.d]} />
      <Flat color="#E8ECF2" />
    </mesh>
    <mesh position={[0, FRIDGE.h * 0.68, FRIDGE.d / 2 + 0.01]}>
      <planeGeometry args={[FRIDGE.w - 0.1, 0.04]} />
      <Flat color="#9AA1B0" />
    </mesh>
    <mesh position={[FRIDGE.w / 2 - 0.25, FRIDGE.h * 0.5, FRIDGE.d / 2 + 0.06]} castShadow>
      <BoxG args={[0.1, 1.2, 0.1]} />
      <Flat color="#8A8E98" />
    </mesh>
    <mesh position={[0.3, FRIDGE.h * 0.4, FRIDGE.d / 2 + 0.012]} rotation={[0, 0, 0.1]}>
      <planeGeometry args={[0.4, 0.5]} />
      <Flat color={P.amber} />
    </mesh>
  </group>
);

/** A sofa (4.4 long along X, seat top 0.75, back toward −Z). */
export const SOFA = { w: 4.4, d: 1.8, h: 2.0 };
export const Sofa: React.FC<{ position: V3; rotation?: V3; color?: string }> = ({ position, rotation = [0, 0, 0], color = "#5A4A78" }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
      <BoxG args={[SOFA.w, 0.5, SOFA.d]} />
      <Flat color={color} />
    </mesh>
    <mesh position={[0, 0.72, 0.12]} castShadow>
      <BoxG args={[SOFA.w - 0.8, 0.22, SOFA.d - 0.4]} />
      <Flat color="#6E5C90" />
    </mesh>
    <mesh position={[0, 1.3, -SOFA.d / 2 + 0.25]} castShadow>
      <BoxG args={[SOFA.w, 1.4, 0.5]} />
      <Flat color={color} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * (SOFA.w / 2 - 0.2), 0.85, 0]} castShadow>
        <BoxG args={[0.4, 0.9, SOFA.d]} />
        <Flat color={color} />
      </mesh>
    ))}
    {[-1, 1].flatMap((sx) =>
      [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * (SOFA.w / 2 - 0.3), 0.08, sz * (SOFA.d / 2 - 0.2)]}>
          <BoxG args={[0.14, 0.16, 0.14]} />
          <Flat color="#2A2220" />
        </mesh>
      )),
    )}
  </group>
);

/** His car at hero scale (kit car ×3.5: 10.85 long, ≈ 4.4 tall), bottom at the origin, length along +Z. */
export const BigCar: React.FC<{ position: V3; rotation?: V3; color?: string }> = ({ position, rotation = [0, 0, 0], color = P.carRed }) => (
  <group position={position} rotation={rotation} scale={3.5}>
    <Car position={[0, 0, 0]} color={color} />
  </group>
);

// ================================================================ the gym

/** The bench (seat top at the origin, length along X from −1.48 to 1.6), with Slavoski lying on it holding the bar. */
export const BENCH = { x0: -1.48, x1: 1.6, w: 1.2, seat: 0.2, legs: 1.35 };
/** Slavoski's root on the bench (bench space): head toward −X, back on the seat. */
export const LIE_ROOT: V3 = [1.3, 0.36, 0];
/** Hero space → bench space for the lying pose (Rx(−π/2) then Ry(π/2)): (x, y, z) → (−y, z, −x). */
export const lie = (p: V3): V3 => [LIE_ROOT[0] - p[1], LIE_ROOT[1] + p[2], LIE_ROOT[2] - p[0]];
export const BenchRig: React.FC<{ pose: Pose; bar: V3; legs?: boolean }> = ({ pose, bar, legs = true }) => (
  <group>
    <mesh position={[(BENCH.x0 + BENCH.x1) / 2, -BENCH.seat / 2, 0]} castShadow receiveShadow>
      <BoxG args={[BENCH.x1 - BENCH.x0, BENCH.seat, BENCH.w]} />
      <Flat color="#22242E" />
    </mesh>
    {legs
      ? [BENCH.x0 + 0.3, BENCH.x1 - 0.3].map((x) => (
          <mesh key={x} position={[x, -BENCH.seat - (BENCH.legs - BENCH.seat) / 2, 0]} castShadow>
            <BoxG args={[0.2, BENCH.legs - BENCH.seat, BENCH.w - 0.2]} />
            <Flat color="#8A8E98" />
          </mesh>
        ))
      : null}
    <group position={LIE_ROOT} rotation={[0, Math.PI / 2, 0]}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <Hero pose={pose} />
      </group>
    </group>
    <Barbell position={bar} />
  </group>
);

/** A barbell along Z with two big 50 kg plates (centre at the origin). */
export const Barbell: React.FC<{ position: V3 }> = ({ position }) => (
  <group position={position}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <CylG args={[0.06, 0.06, 4.2, 6]} />
      <Flat color="#C9D2DE" />
    </mesh>
    {[-1, 1].map((s) => (
      <group key={s} position={[0, 0, s * 1.68]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <CylG args={[0.7, 0.7, 0.22, 14]} />
          <Flat color="#15161C" />
        </mesh>
        <CanvasPanel position={[0, 0, s * 0.115]} rotation={[0, s > 0 ? 0 : Math.PI, 0]} w={0.7} h={0.36} px={256} draw={plateLabel} />
      </group>
    ))}
  </group>
);
const plateLabel = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#15161C";
  ctx.fillRect(0, 0, W, H);
  fitText(ctx, "50 KG", W / 2, H / 2, W * 0.9, H * 0.7, "#E0B04E");
};

/** Rack uprights for the bench (on the floor, bench space without lift). */
export const Rack: React.FC<{ top: number }> = ({ top }) => (
  <group>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[-1.45, top / 2, s * 1.3]} castShadow>
        <BoxG args={[0.16, top, 0.16]} />
        <Flat color="#8A8E98" />
      </mesh>
    ))}
  </group>
);

/** Gym interior: rubber floor, mirror wall, dumbbell racks, neon GYM sign, windows at dusk. */
export const Gym: React.FC = () => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[40, 0.1, 30]} />
      <Flat color="#262A34" />
    </mesh>
    <mesh position={[0, 5, -8]} receiveShadow>
      <BoxG args={[40, 10, 0.3]} />
      <Flat color="#2E3240" />
    </mesh>
    {/* mirrors */}
    {[-9, -3, 3, 9].map((x) => (
      <mesh key={x} position={[x, 3.6, -7.84]}>
        <planeGeometry args={[5.4, 4.2]} />
        <meshBasicMaterial color="#5A6A80" toneMapped={false} />
      </mesh>
    ))}
    {/* windows above the mirrors, dusk outside */}
    {[-9, -3, 3, 9].map((x) => (
      <mesh key={`w${x}`} position={[x, 7.8, -7.84]}>
        <planeGeometry args={[5.4, 1.6]} />
        <Glow color="#E89A6A" />
      </mesh>
    ))}
    <CanvasPanel position={[0, 8.9, -7.8]} w={6} h={1.2} px={768} draw={neonGym} />
    <Halo position={[0, 8.9, -7.4]} size={9} color="#FF4A8A" opacity={0.35} />
    {/* dumbbell racks */}
    {[-11, 9].map((x) => (
      <group key={x} position={[x, 0, -6.2]}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <BoxG args={[5, 0.2, 1.2]} />
          <Flat color="#5A5E6A" />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[-2 + i * 0.8, 1.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <CylG args={[0.22 + i * 0.03, 0.22 + i * 0.03, 0.7, 8]} />
            <Flat color="#15161C" />
          </mesh>
        ))}
        {[-2.2, 2.2].map((dx) => (
          <mesh key={dx} position={[dx, 0.6, 0]} castShadow>
            <BoxG args={[0.2, 1.2, 1.0]} />
            <Flat color="#5A5E6A" />
          </mesh>
        ))}
      </group>
    ))}
    {/* ceiling with light panels, side walls */}
    <mesh position={[0, 11.1, 4]}>
      <BoxG args={[40, 0.2, 30]} />
      <Flat color="#1E2028" />
    </mesh>
    {[-12, -4, 4, 12].flatMap((x) =>
      [-4, 2, 8].map((z) => (
        <mesh key={`p${x}${z}`} position={[x, 10.98, z]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.6, 0.8]} />
          <Glow color="#F4F8FF" />
        </mesh>
      )),
    )}
    {[-20, 20].map((x) => (
      <mesh key={x} position={[x, 5.5, 4]} receiveShadow>
        <BoxG args={[0.3, 11, 30]} />
        <Flat color="#2A2E3A" />
      </mesh>
    ))}
    {/* pink neon strip along the mirror wall */}
    <mesh position={[0, 1.2, -7.82]}>
      <planeGeometry args={[30, 0.12]} />
      <Glow color="#FF6AA0" />
    </mesh>
    <pointLight position={[0, 9, 2]} color="#E8F0FF" intensity={30} distance={30} decay={2} />
    <pointLight position={[-8, 9.5, 4]} color="#E8F0FF" intensity={14} distance={18} decay={2} />
    <pointLight position={[8, 9.5, 4]} color="#E8F0FF" intensity={14} distance={18} decay={2} />
    <pointLight position={[0, 7, -6]} color="#FF4A8A" intensity={10} distance={16} decay={2} />
  </group>
);
const neonGym = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#15161C";
  ctx.fillRect(0, 0, W, H);
  ctx.shadowColor = "#FF4A8A";
  ctx.shadowBlur = H * 0.25;
  fitText(ctx, "IRON TEMPLE GYM", W / 2, H / 2, W * 0.9, H * 0.6, "#FF8AB0");
};

/** The gym from outside at dusk: a low charcoal block with a full glass front (lit interior with
 * treadmills), an entrance canopy with an LED strip, a giant glowing dumbbell on the roof and the pink
 * IRON TEMPLE GYM neon. The flats around it sit far back and darker so it stands out. */
export const GymFront: React.FC<{ t: number }> = ({ t }) => (
  <group>
    {/* paved forecourt */}
    <mesh position={[0, 0.005, 1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[40, 12]} />
      <Flat color="#6A6E7A" />
    </mesh>
    {/* the building: front face at z = -5 */}
    <mesh position={[0, 5.5, -13]} castShadow receiveShadow>
      <BoxG args={[32, 11, 16]} />
      <Flat color="#23252E" />
    </mesh>
    <mesh position={[0, 10.8, -4.9]}>
      <planeGeometry args={[32, 0.25]} />
      <Glow color="#FF6AA0" />
    </mesh>
    {/* the interior seen through the glass */}
    <mesh position={[0, 3.5, -9]}>
      <planeGeometry args={[26, 7]} />
      <Glow color="#F6E8D4" />
    </mesh>
    {Array.from({ length: 6 }, (_, i) => (
      <group key={i} position={[-10 + i * 4, 0, -7]}>
        <mesh position={[0, 0.5, 0]}>
          <BoxG args={[1.4, 0.5, 2.6]} />
          <Flat color="#2A2D38" />
        </mesh>
        <mesh position={[0, 1.9, -1.1]} rotation={[0.3, 0, 0]}>
          <BoxG args={[1.2, 0.8, 0.2]} />
          <Flat color="#15161C" />
        </mesh>
      </group>
    ))}
    {[-6, 2, 10].map((x, i) => (
      <Hero key={x} pose={walkPose(t * 2.2 + i * 0.3, 1)} position={[x, 0.75, -7]} yaw={Math.PI} look={crowdLook(400 + i)} />
    ))}
    {/* glass + mullions */}
    <mesh position={[0, 3.5, -5.0]}>
      <planeGeometry args={[28, 7]} />
      <meshBasicMaterial color="#BFE3FF" transparent opacity={0.12} depthWrite={false} toneMapped={false} />
    </mesh>
    {Array.from({ length: 8 }, (_, i) => (
      <mesh key={i} position={[-14 + i * 4, 3.5, -4.95]}>
        <BoxG args={[0.2, 7, 0.2]} />
        <Flat color="#15161C" />
      </mesh>
    ))}
    {/* entrance canopy with an LED strip underneath, doors */}
    <mesh position={[4, 7.2, -3.4]} castShadow>
      <BoxG args={[8, 0.35, 3.2]} />
      <Flat color="#15161C" />
    </mesh>
    <mesh position={[4, 7.0, -3.4]} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[7.6, 0.25]} />
      <Glow color="#FFFFFF" />
    </mesh>
    <pointLight position={[4, 6.5, -2]} color="#FFF0E0" intensity={14} distance={10} decay={2} />
    {/* the pink neon name on the upper wall */}
    <CanvasPanel position={[4, 9.0, -4.88]} w={14} h={2.4} px={1024} draw={neonGym} />
    <Halo position={[4, 9.0, -4.4]} size={18} color="#FF4A8A" opacity={0.35} />
    {/* a giant dumbbell on the roof */}
    <group position={[4, 13.2, -8]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <CylG args={[0.35, 0.35, 9, 10]} />
        <Flat color="#C9D2DE" />
      </mesh>
      {[-1, 1].map((s2) => (
        <group key={s2} position={[s2 * 3.6, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <CylG args={[1.8, 1.8, 1.0, 16]} />
            <Flat color="#15161C" />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0, 0.0]}>
            <torusGeometry args={[1.8, 0.09, 6, 32]} />
            <Glow color="#FF6AA0" />
          </mesh>
        </group>
      ))}
      <Halo size={12} color="#FF4A8A" opacity={0.3} />
    </group>
    <mesh position={[4, 11.6, -8]}>
      <BoxG args={[0.5, 1.6, 0.5]} />
      <Flat color="#2A2D38" />
    </mesh>
    {/* OPEN 24/7 */}
    <CanvasPanel position={[11, 5.8, -4.85]} w={4} h={1.1} px={512} draw={(ctx, W, H) => {
      ctx.fillStyle = "#15161C";
      ctx.fillRect(0, 0, W, H);
      ctx.shadowColor = "#5AF08A";
      ctx.shadowBlur = H * 0.3;
      fitText(ctx, "OPEN 24/7", W / 2, H / 2, W * 0.86, H * 0.6, "#8AFFB0");
    }} />
    {/* planters with trees either side of the entrance */}
    {[-1.6, 9.6].map((x) => (
      <group key={x} position={[x, 0, -2.6]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <BoxG args={[1.4, 1.0, 1.4]} />
          <Flat color="#3A3E48" />
        </mesh>
        <mesh position={[0, 2.6, 0]} castShadow>
          <ConeG args={[1.0, 3.2, 7]} />
          <Flat color={P.pine} />
        </mesh>
      </group>
    ))}
    {/* the flats: far back, darker, lower than the sky gap above the gym */}
    {[-34, -24, 26, 36].map((x, i) => (
      <Building key={x} position={[x, 0, -22 - (i % 2) * 6]} w={10} d={10} h={16 + i * 3} color={[P.bldgSlate, P.bldgPurple, P.bldgNavy, P.bldgTeal][i]} seed={`gyn${i}`} power={0.45} />
    ))}
    {[-12, 0, 14].map((x, i) => (
      <Building key={`b${x}`} position={[x, 0, -48]} w={12} d={10} h={20 + i * 4} color={P.bldgNavy} seed={`gyb${i}`} power={0.35} />
    ))}
  </group>
);

/** A generic high-wing light aircraft at hero scale (≈ 20 long, 26 wingspan), nose toward +Z.
 * Origin = the belly under the wing (where she holds it); wheels reach 2.95 below. */
export const LightAircraft: React.FC<{ position?: V3; rotation?: V3; t?: number }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], t = 0 }) => {
  const white = "#F2F4F8";
  const red = "#C8372D";
  return (
    <group position={position} rotation={rotation}>
      {/* fuselage: cabin, cowling, tapering tail boom */}
      <mesh position={[0, 1.7, 1.0]} castShadow>
        <BoxG args={[3.0, 3.4, 5.0]} />
        <Flat color={white} />
      </mesh>
      <mesh position={[0, 1.6, 4.4]} castShadow>
        <BoxG args={[2.6, 2.8, 2.0]} />
        <Flat color={white} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 1.85 + i * 0.08, -2.4 - i * 2.0]} castShadow>
          <BoxG args={[2.6 - i * 0.55, 2.8 - i * 0.55, 2.1]} />
          <Flat color={white} />
        </mesh>
      ))}
      {/* red stripe both sides + registration */}
      {[-1, 1].map((s2) => (
        <mesh key={s2} position={[s2 * 1.52, 1.3, 0.5]} rotation={[0, s2 * Math.PI / 2, 0]}>
          <planeGeometry args={[9, 0.35]} />
          <Flat color={red} />
        </mesh>
      ))}
      <CanvasPanel position={[1.53, 2.1, -3.0]} rotation={[0, Math.PI / 2, 0]} w={3.6} h={0.9} px={512} draw={(ctx, W, H) => {
        ctx.fillStyle = white;
        ctx.fillRect(0, 0, W, H);
        fitText(ctx, "SL-VSK", W / 2, H / 2, W * 0.9, H * 0.8, "#1D274B");
      }} />
      {/* windows + windshield */}
      {[-1, 1].map((s2) => (
        <mesh key={`w${s2}`} position={[s2 * 1.51, 2.5, 1.2]} rotation={[0, s2 * Math.PI / 2, 0]}>
          <planeGeometry args={[3.2, 1.1]} />
          <Flat color="#2A3A5A" />
        </mesh>
      ))}
      <mesh position={[0, 2.7, 3.45]} rotation={[-0.5, 0, 0]}>
        <planeGeometry args={[2.6, 1.3]} />
        <Flat color="#2A3A5A" />
      </mesh>
      {/* spinner + propeller (turning) */}
      <mesh position={[0, 1.6, 5.75]} rotation={[Math.PI / 2, 0, 0]}>
        <ConeG args={[0.55, 0.9, 10]} />
        <Flat color={red} />
      </mesh>
      <group position={[0, 1.6, 5.75]} rotation={[0, 0, t * 25]}>
        {[0, 1].map((i) => (
          <mesh key={i} rotation={[0, 0, i * Math.PI]} position={[0, 0, 0]}>
            <boxGeometry args={[0.35, 7, 0.12]} />
            <Flat color="#2A2D38" />
          </mesh>
        ))}
      </group>
      {/* high wing + struts */}
      <mesh position={[0, 3.55, 0.8]} castShadow>
        <BoxG args={[26, 0.35, 3.6]} />
        <Flat color={white} />
      </mesh>
      {[-1, 1].map((s2) => (
        <mesh key={`t${s2}`} position={[s2 * 12.6, 3.56, 0.8]}>
          <boxGeometry args={[0.8, 0.37, 3.62]} />
          <Flat color={red} />
        </mesh>
      ))}
      {[-1, 1].map((s2) => (
        <mesh key={`s${s2}`} position={[s2 * 3.6, 2.2, 0.8]} rotation={[0, 0, s2 * 1.05]}>
          <BoxG args={[0.18, 5.0, 0.3]} />
          <Flat color="#C9D2DE" />
        </mesh>
      ))}
      {/* tail: stabiliser + fin */}
      <mesh position={[0, 2.3, -9.0]} castShadow>
        <BoxG args={[9, 0.25, 2.4]} />
        <Flat color={white} />
      </mesh>
      <mesh position={[0, 4.2, -9.4]} rotation={[0.35, 0, 0]} castShadow>
        <BoxG args={[0.3, 3.6, 2.6]} />
        <Flat color={red} />
      </mesh>
      {/* landing gear: two mains splayed out, a nose wheel */}
      {[-1, 1].map((s2) => (
        <group key={`g${s2}`}>
          <mesh position={[s2 * 2.3, -1.0, 0.6]} rotation={[0, 0, s2 * 0.8]}>
            <BoxG args={[0.2, 2.6, 0.3]} />
            <Flat color="#C9D2DE" />
          </mesh>
          <mesh position={[s2 * 3.3, -2.2, 0.6]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <CylG args={[0.75, 0.75, 0.5, 12]} />
            <Flat color="#1A1A1E" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.9, 4.6]}>
        <BoxG args={[0.2, 2.2, 0.2]} />
        <Flat color="#C9D2DE" />
      </mesh>
      <mesh position={[0, -2.2, 4.6]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <CylG args={[0.65, 0.65, 0.4, 12]} />
        <Flat color="#1A1A1E" />
      </mesh>
    </group>
  );
};

// ================================================================ the airfield (day 3, sunny)

/** Grass, a runway, a hangar with an arched roof, a windsock. */
export const Airfield: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <mesh position={[0, -0.12, 0]} receiveShadow>
      <BoxG args={[600, 0.1, 600]} />
      <Flat color="#6AA85A" />
    </mesh>
    <mesh position={[0, 0.01, -14]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[300, 16]} />
      <Flat color="#4A505E" />
    </mesh>
    {Array.from({ length: 16 }, (_, i) => (
      <mesh key={i} position={[-150 + i * 20, 0.02, -14]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 0.5]} />
        <Flat color="#F2EEE6" />
      </mesh>
    ))}
    <group position={[34, 0, -46]}>
      <mesh position={[0, 6, 0]} castShadow>
        <BoxG args={[34, 12, 24]} />
        <Flat color="#8A96AA" />
      </mesh>
      <mesh position={[0, 12, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[12, 12, 34, 12, 1, false, 0, Math.PI]} />
        <meshLambertMaterial color="#A6B0C2" flatShading side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 5, 12.02]}>
        <planeGeometry args={[24, 10]} />
        <Flat color="#3A3F4E" />
      </mesh>
    </group>
    <group position={[-30, 0, -30]}>
      <mesh position={[0, 4, 0]}>
        <CylG args={[0.1, 0.12, 8, 5]} />
        <Flat color="#C9D2DE" />
      </mesh>
      <mesh position={[1.4, 7.6, 0]} rotation={[0, Math.sin(t) * 0.2, Math.PI / 2 + 0.1]}>
        <ConeG args={[0.5, 2.6, 8, 1, true]} />
        <meshLambertMaterial color="#E8862A" flatShading side={THREE.DoubleSide} />
      </mesh>
    </group>
  </group>
);
