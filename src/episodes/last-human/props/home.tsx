/**
 * Interiors and screens for "Last Human": phone UIs (generic, no real OS), the kitchen (tap, fridge,
 * laptop, router), a candle, a dinner table, a laptop playing old videos.
 * Hero scale: Slavoski is 4.2 tall, so a kitchen counter top sits at ~2.1 and a door is ~5 tall.
 */
import React from "react";
import { random } from "remotion";
import { BoxG, CylG, IcoG, ConeG } from "../../../slavoski/detail";
import { FONT } from "../../../slavoski/fonts";
import { Flat, Glow, Halo } from "../../../slavoski/materials";
import type { V3 } from "../../../slavoski/noise";
import { P } from "../../../slavoski/palette";

// ================================================================ phone UIs (HTML on the 3D phone)

const screenBase = (w: number, h: number, bg = "linear-gradient(180deg, #1B2240 0%, #0D1020 100%)"): React.CSSProperties => ({
  width: w,
  height: h,
  background: bg,
  fontFamily: FONT,
  color: "#FFF",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  boxSizing: "border-box",
  padding: `${h * 0.06}px ${w * 0.08}px`,
  position: "relative",
  overflow: "hidden",
});

const StatusBar: React.FC<{ w: number; h: number; time?: string; signal?: number; battery?: number }> = ({ w, h, time = "7:02", signal = 4, battery = 0.82 }) => (
  <div style={{ position: "absolute", top: h * 0.018, left: w * 0.07, right: w * 0.07, display: "flex", justifyContent: "space-between", fontSize: w * 0.05, opacity: 0.9 }}>
    <span style={{ fontWeight: 700 }}>{time}</span>
    <span style={{ display: "flex", gap: w * 0.03, alignItems: "center" }}>
      {signal > 0 ? (
        <span style={{ display: "flex", gap: w * 0.008, alignItems: "flex-end" }}>
          {[1, 2, 3, 4].map((i) => (
            <span key={i} style={{ width: w * 0.014, height: w * 0.012 * i + w * 0.006, background: i <= signal ? "#FFF" : "rgba(255,255,255,0.3)", borderRadius: 1 }} />
          ))}
        </span>
      ) : (
        <span style={{ fontSize: w * 0.04, letterSpacing: "0.05em" }}>NO SERVICE</span>
      )}
      <span style={{ width: w * 0.08, height: w * 0.038, border: `${w * 0.005}px solid rgba(255,255,255,0.85)`, borderRadius: w * 0.008, position: "relative" }}>
        <span style={{ position: "absolute", left: 1, top: 1, bottom: 1, width: `${Math.max(4, battery * 100 - 6)}%`, background: battery < 0.2 ? "#FF4A3A" : "#FFF", borderRadius: 1 }} />
      </span>
    </span>
  </div>
);

/** Lock screen with no notifications. */
export const LockEmpty: React.FC<{ w: number; h: number; time?: string; date?: string }> = ({ w, h, time = "7:02", date = "Tuesday" }) => (
  <div style={screenBase(w, h, "linear-gradient(180deg, #2A3A6A 0%, #5A4A78 60%, #E8A66A 100%)")}>
    <StatusBar w={w} h={h} time={time} />
    <div style={{ marginTop: h * 0.1, fontSize: w * 0.06, opacity: 0.85 }}>{date}</div>
    <div style={{ fontWeight: 700, fontSize: w * 0.26, lineHeight: 1 }}>{time}</div>
    <div style={{ marginTop: h * 0.22, fontSize: w * 0.065, opacity: 0.75, padding: `${h * 0.02}px ${w * 0.06}px`, borderRadius: w * 0.05, background: "rgba(10,12,24,0.35)" }}>No notifications</div>
  </div>
);

/** Messages app: empty inbox. `k` 0..1 fades the "no new messages" line in. */
export const MessagesEmpty: React.FC<{ w: number; h: number; k?: number }> = ({ w, h, k = 1 }) => (
  <div style={{ ...screenBase(w, h, "#F2F0EA"), color: "#1A1E2C" }}>
    <StatusBar w={w} h={h} />
    <div style={{ alignSelf: "flex-start", marginTop: h * 0.05, fontWeight: 700, fontSize: w * 0.09 }}>Messages</div>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{ alignSelf: "stretch", display: "flex", gap: w * 0.04, alignItems: "center", marginTop: h * 0.03, opacity: 0.45 }}>
        <div style={{ width: w * 0.13, height: w * 0.13, borderRadius: "50%", background: ["#9AA1B0", "#B39A62", "#24748F"][i] }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: w * 0.03, width: "55%", background: "#B8B4AA", borderRadius: 4 }} />
          <div style={{ height: w * 0.025, width: "80%", background: "#D4D0C6", borderRadius: 4, marginTop: w * 0.02 }} />
        </div>
        <div style={{ fontSize: w * 0.04, color: "#8A8E98" }}>Yesterday</div>
      </div>
    ))}
    <div style={{ marginTop: h * 0.12, opacity: k, textAlign: "center" }}>
      <div style={{ fontSize: w * 0.16, opacity: 0.3 }}>✉</div>
      <div style={{ fontWeight: 700, fontSize: w * 0.075 }}>No new messages</div>
      <div style={{ fontSize: w * 0.05, color: "#7A7E88", marginTop: h * 0.01 }}>No missed calls</div>
    </div>
  </div>
);

/** A social feed with nothing new since yesterday. */
export const FeedEmpty: React.FC<{ w: number; h: number; pull?: number }> = ({ w, h, pull = 0 }) => (
  <div style={{ ...screenBase(w, h, "#0E1220") }}>
    <StatusBar w={w} h={h} />
    <div style={{ alignSelf: "flex-start", marginTop: h * 0.05, fontWeight: 700, fontSize: w * 0.085 }}>Feed</div>
    <div style={{ marginTop: h * 0.03 + pull * h * 0.06, width: w * 0.08, height: w * 0.08, borderRadius: "50%", border: `${w * 0.012}px solid rgba(255,255,255,0.6)`, borderTopColor: "transparent", transform: `rotate(${pull * 540}deg)`, opacity: pull > 0 ? 1 : 0 }} />
    <div style={{ marginTop: h * 0.08, textAlign: "center" }}>
      <div style={{ fontWeight: 700, fontSize: w * 0.075 }}>Nothing new</div>
      <div style={{ fontSize: w * 0.05, opacity: 0.6, marginTop: h * 0.012 }}>Last post: yesterday, 11:48 PM</div>
    </div>
    <div style={{ marginTop: h * 0.06, alignSelf: "stretch", height: h * 0.28, borderRadius: w * 0.04, background: "rgba(255,255,255,0.06)", opacity: 0.6 }} />
  </div>
);

/** Outgoing call: "Calling…" then, from `k` = 1, "No answer". */
export const CallScreen: React.FC<{ w: number; h: number; name: string; k: number; t: number; color?: string }> = ({ w, h, name, k, t, color = "#24748F" }) => {
  const ended = k >= 1;
  const dots = ".".repeat(1 + (Math.floor(t * 2.5) % 3));
  return (
    <div style={screenBase(w, h, "linear-gradient(180deg, #23304E 0%, #10141F 100%)")}>
      <StatusBar w={w} h={h} />
      <div style={{ marginTop: h * 0.12, width: w * 0.32, height: w * 0.32, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: w * 0.15 }}>
        {name[0]}
      </div>
      <div style={{ marginTop: h * 0.04, fontWeight: 700, fontSize: w * 0.09 }}>{name}</div>
      <div style={{ marginTop: h * 0.015, fontSize: w * 0.06, color: ended ? "#FF8A7A" : "rgba(255,255,255,0.7)" }}>{ended ? "No answer" : `Calling${dots}`}</div>
      <div style={{ position: "absolute", bottom: h * 0.08, width: w * 0.2, height: w * 0.2, borderRadius: "50%", background: "#D83A2E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: w * 0.09, opacity: ended ? 0.4 : 1 }}>✕</div>
    </div>
  );
};

/** No signal, low battery: the phone after the networks fail. */
export const NoSignalScreen: React.FC<{ w: number; h: number; battery?: number; time?: string }> = ({ w, h, battery = 0.14, time = "9:41" }) => (
  <div style={screenBase(w, h, "linear-gradient(180deg, #151A2C 0%, #07080E 100%)")}>
    <StatusBar w={w} h={h} time={time} signal={0} battery={battery} />
    <div style={{ marginTop: h * 0.2, fontSize: w * 0.14, opacity: 0.5 }}>⌀</div>
    <div style={{ marginTop: h * 0.02, fontWeight: 700, fontSize: w * 0.075 }}>No Service</div>
    <div style={{ marginTop: h * 0.012, fontSize: w * 0.05, opacity: 0.6, textAlign: "center" }}>Calls and messages unavailable</div>
    <div style={{ marginTop: h * 0.08, fontSize: w * 0.05, color: "#FF8A7A" }}>Battery {Math.round(battery * 100)}%</div>
  </div>
);

/** A voice recorder with a red REC dot and a moving waveform. */
export const RecScreen: React.FC<{ w: number; h: number; t: number; day?: number }> = ({ w, h, t, day = 30 }) => (
  <div style={screenBase(w, h, "#0B0D14")}>
    <StatusBar w={w} h={h} signal={0} />
    <div style={{ marginTop: h * 0.08, fontSize: w * 0.06, opacity: 0.7 }}>Message for anyone · Day {day}</div>
    <div style={{ marginTop: h * 0.03, display: "flex", alignItems: "center", gap: w * 0.03 }}>
      <span style={{ width: w * 0.06, height: w * 0.06, borderRadius: "50%", background: "#FF3A2E", opacity: Math.floor(t * 2) % 2 ? 1 : 0.35 }} />
      <span style={{ fontWeight: 700, fontSize: w * 0.09 }}>REC</span>
      <span style={{ fontSize: w * 0.07, opacity: 0.8 }}>{`0:${String(Math.floor(t * 1 + 12) % 60).padStart(2, "0")}`}</span>
    </div>
    <div style={{ marginTop: h * 0.12, display: "flex", alignItems: "center", gap: w * 0.012, height: h * 0.2 }}>
      {Array.from({ length: 22 }, (_, i) => {
        const a = 0.25 + 0.75 * Math.abs(Math.sin(t * 7 + i * 1.7) * Math.sin(t * 3.1 + i * 0.6));
        return <span key={i} style={{ width: w * 0.022, height: `${a * 100}%`, background: "#FF6A5A", borderRadius: 3 }} />;
      })}
    </div>
  </div>
);

// ================================================================ kitchen

/** Kitchen: counter along the back wall (z ≈ -2.4), sink + tap at x = 0, fridge at x = 5.2, table at x = -4.5. */
export const KITCHEN = { counterTop: 2.1, tap: [0, 2.95, -2.55] as V3, spout: [0, 2.78, -2.08] as V3, sink: [0, 2.0, -2.0] as V3, fridge: [5.4, 0, -2.2] as V3, table: [-4.6, 0, 0.8] as V3, tableTop: 1.8 };

export const Kitchen: React.FC<{
  t: number;
  /** 0..1 tap flow (0 = off). */
  flow?: number;
  /** Water colour/quality: 0 clean … 1 brown. */
  murky?: number;
  /** Sputtering flow (failing pumps). */
  sputter?: boolean;
  /** Fridge door open 0..1 and whether its light works. */
  fridgeOpen?: number;
  fridgeLight?: boolean;
  /** Ceiling lamp on. */
  lamp?: boolean;
  /** Window light colour (sky outside). */
  sky?: string;
  /** Spoiled food in the open fridge (0..1). */
  spoil?: number;
  laptop?: boolean;
  candle?: boolean;
}> = ({ t, flow = 0, murky = 0, sputter = false, fridgeOpen = 0, fridgeLight = true, lamp = true, sky = "#BFD8F0", spoil = 0, laptop = false, candle = false }) => {
  const wall = "#D8CDB8";
  const cab = "#3E5A6A";
  const top = "#E6E0D4";
  const f = sputter ? flow * (0.5 + 0.5 * Math.sin(t * 19) * Math.sin(t * 7.3) > 0.1 ? 1 : 0.15) : flow;
  const water = murky > 0 ? `rgb(${Math.round(140 + murky * 30)}, ${Math.round(190 - murky * 70)}, ${Math.round(230 - murky * 140)})` : "#9CC8F0";
  const S = KITCHEN.spout;
  return (
    <group>
      {/* floor, back wall, side wall */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[22, 0.1, 14]} />
        <Flat color="#8A7A66" />
      </mesh>
      <mesh position={[0, 4.5, -3.2]} receiveShadow>
        <BoxG args={[22, 9, 0.2]} />
        <Flat color={wall} />
      </mesh>
      <mesh position={[-10.5, 4.5, 2]} receiveShadow>
        <BoxG args={[0.2, 9, 12]} />
        <Flat color="#CFC2AA" />
      </mesh>
      <mesh position={[10.5, 4.5, 2]} receiveShadow>
        <BoxG args={[0.2, 9, 12]} />
        <Flat color="#CFC2AA" />
      </mesh>
      {/* window above the sink */}
      <mesh position={[0, 5.0, -3.09]}>
        <planeGeometry args={[3.6, 2.4]} />
        <Glow color={sky} />
      </mesh>
      {[
        [0, 6.25, 3.9, 0.14],
        [0, 3.75, 3.9, 0.14],
      ].map(([x, y, w, hh], i) => (
        <mesh key={i} position={[x, y, -3.0]}>
          <BoxG args={[w, hh, 0.2]} />
          <Flat color="#F2EEE6" />
        </mesh>
      ))}
      {[-1.9, 0, 1.9].map((x) => (
        <mesh key={x} position={[x, 5.0, -3.0]}>
          <BoxG args={[0.14, 2.6, 0.2]} />
          <Flat color="#F2EEE6" />
        </mesh>
      ))}
      {/* counter run */}
      <mesh position={[-1.2, 1.0, -2.45]} castShadow receiveShadow>
        <BoxG args={[11, 2.0, 1.4]} />
        <Flat color={cab} />
      </mesh>
      <mesh position={[-1.2, 2.05, -2.4]} castShadow receiveShadow>
        <BoxG args={[11.2, 0.12, 1.55]} />
        <Flat color={top} />
      </mesh>
      {/* sink basin (dark inset) and tap */}
      <mesh position={[0, 2.08, -2.25]}>
        <BoxG args={[1.6, 0.04, 0.9]} />
        <Flat color="#7A8290" />
      </mesh>
      <mesh position={[0, 2.5, -2.85]} castShadow>
        <CylG args={[0.07, 0.09, 0.85, 8]} />
        <Flat color="#C8CCD4" />
      </mesh>
      <mesh position={[0, 2.92, -2.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <CylG args={[0.06, 0.06, 0.8, 8]} />
        <Flat color="#C8CCD4" />
      </mesh>
      <mesh position={[0, 2.84, -2.1]} castShadow>
        <CylG args={[0.065, 0.065, 0.16, 8]} />
        <Flat color="#C8CCD4" />
      </mesh>
      {/* tap handle */}
      <mesh position={[0.3, 2.95, -2.85]} rotation={[0, 0, flow > 0 ? -0.6 : 0]} castShadow>
        <BoxG args={[0.32, 0.07, 0.07]} />
        <Flat color="#C8CCD4" />
      </mesh>
      {/* water stream */}
      {f > 0.02 ? (
        <group>
          <mesh position={[S[0] + Math.sin(t * 23) * 0.005, (S[1] + 2.1) / 2, S[2]]}>
            <CylG args={[0.035 * f + 0.01, 0.05 * f + 0.012, S[1] - 2.1, 8]} />
            <meshLambertMaterial color={water} transparent opacity={0.75} flatShading />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => {
            const a = t * 9 + i * 1.3;
            return (
              <mesh key={i} position={[S[0] + Math.cos(a) * 0.18, 2.13 + Math.abs(Math.sin(a * 1.7)) * 0.06, S[2] + Math.sin(a) * 0.18]}>
                <IcoG args={[0.035, 0]} />
                <meshLambertMaterial color={water} transparent opacity={0.7} />
              </mesh>
            );
          })}
        </group>
      ) : null}
      {/* upper cabinets */}
      {[-4.6, -2.6, 2.6].map((x) => (
        <mesh key={x} position={[x, 6.0, -2.75]} castShadow>
          <BoxG args={[1.9, 2.0, 0.8]} />
          <Flat color={cab} />
        </mesh>
      ))}
      {/* fridge */}
      <Fridge position={KITCHEN.fridge} open={fridgeOpen} light={fridgeLight} spoil={spoil} />
      {/* table + chairs */}
      <group position={KITCHEN.table}>
        <mesh position={[0, KITCHEN.tableTop - 0.07, 0]} castShadow receiveShadow>
          <BoxG args={[3.6, 0.14, 2.4]} />
          <Flat color="#7A5A3E" />
        </mesh>
        {[
          [-1.6, -1.0],
          [1.6, -1.0],
          [-1.6, 1.0],
          [1.6, 1.0],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, (KITCHEN.tableTop - 0.14) / 2, z]} castShadow>
            <BoxG args={[0.14, KITCHEN.tableTop - 0.14, 0.14]} />
            <Flat color="#5A402C" />
          </mesh>
        ))}
        {laptop ? <Laptop position={[0.3, KITCHEN.tableTop, 0.1]} yaw={0.3} /> : null}
        {laptop ? <Router position={[-1.2, KITCHEN.tableTop, -0.7]} t={t} /> : null}
        {candle ? <Candle position={[-0.6, KITCHEN.tableTop, 0.3]} t={t} /> : null}
      </group>
      {/* ceiling pendant */}
      <mesh position={[-1, 7.6, 0]}>
        <ConeG args={[0.6, 0.5, 8, 1, true]} />
        {lamp ? <Glow color={P.lampGlow} /> : <Flat color="#4A4A50" />}
      </mesh>
      {lamp ? <pointLight position={[-1, 7, 0.4]} color="#FFE2B0" intensity={22} distance={18} decay={2} /> : null}
    </group>
  );
};

export const Fridge: React.FC<{ position: V3; open?: number; light?: boolean; spoil?: number }> = ({ position, open = 0, light = true, spoil = 0 }) => {
  const W = 2.6;
  const H = 4.6;
  const D = 1.7;
  return (
    <group position={position}>
      {/* body (open at the front) */}
      <mesh position={[0, H / 2, -0.1]} castShadow receiveShadow>
        <BoxG args={[W, H, D - 0.2]} />
        <Flat color="#E8E8EC" />
      </mesh>
      {/* inside (visible when open) */}
      <mesh position={[0, H / 2, D / 2 - 0.19]}>
        <planeGeometry args={[W - 0.3, H - 0.3]} />
        {light && open > 0 ? <Glow color="#F4F8FF" /> : <Flat color="#5A6070" />}
      </mesh>
      {[1.2, 2.3, 3.4].map((y) => (
        <mesh key={y} position={[0, y, D / 2 - 0.4]}>
          <BoxG args={[W - 0.35, 0.05, 0.4]} />
          <Flat color="#C8D0DC" />
        </mesh>
      ))}
      {open > 0
        ? [0, 1, 2, 3, 4, 5].map((i) => {
            const y = [1.2, 2.3, 3.4][i % 3] + 0.22;
            const x = -0.8 + (i % 2) * 1.0 + random(`fr${i}`) * 0.3;
            const fresh = ["#C8372D", "#2F7A5A", "#E0B04E", "#F2EEE6", "#24748F", "#E8862A"][i];
            return (
              <mesh key={i} position={[x, y, D / 2 - 0.45]} scale={[1, 1 - spoil * 0.25, 1]}>
                <BoxG args={[0.45, 0.4, 0.35]} />
                <Flat color={spoil > 0 ? mixHex(fresh, "#5A6A3A", spoil * 0.7) : fresh} />
              </mesh>
            );
          })
        : null}
      {/* door, hinged on the right edge */}
      <group position={[W / 2, 0, D / 2 - 0.15]} rotation={[0, open * 1.9, 0]}>
        <mesh position={[-W / 2, H / 2, 0.08]} castShadow>
          <BoxG args={[W, H, 0.16]} />
          <Flat color="#F2F2F4" />
        </mesh>
        <mesh position={[-W + 0.25, H * 0.62, 0.2]}>
          <BoxG args={[0.08, 1.2, 0.1]} />
          <Flat color="#9AA1B0" />
        </mesh>
      </group>
      {light && open > 0.2 ? <pointLight position={[0, H * 0.6, D / 2 + 0.6]} color="#EAF2FF" intensity={8 * open} distance={7} decay={2} /> : null}
    </group>
  );
};

const mixHex = (a: string, b: string, k: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
};

/** An open laptop (screen faces +Z before yaw). Screen centre at SCREEN_C relative to its base. */
export const LAPTOP = { w: 1.5, h: 0.95, screenC: [0, 0.55, -0.42] as V3, tilt: -0.28 };
export const Laptop: React.FC<{ position: V3; yaw?: number; glow?: string; on?: boolean }> = ({ position, yaw = 0, glow = "#CFE2FF", on = true }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.03, 0]} castShadow>
      <BoxG args={[1.6, 0.06, 1.05]} />
      <Flat color="#4A5060" />
    </mesh>
    <group position={[0, 0.06, -0.5]} rotation={[LAPTOP.tilt, 0, 0]}>
      <mesh position={[0, 0.52, -0.02]} castShadow>
        <BoxG args={[1.6, 1.04, 0.05]} />
        <Flat color="#4A5060" />
      </mesh>
      <mesh position={[0, 0.52, 0.006]}>
        <planeGeometry args={[LAPTOP.w, LAPTOP.h]} />
        {on ? <Glow color={glow} /> : <Flat color="#121418" />}
      </mesh>
    </group>
    {on ? <pointLight position={[0, 0.7, 0.4]} color={glow} intensity={3} distance={4} decay={2} /> : null}
  </group>
);

/** World centre of a Laptop's screen and its pitch, for ScreenHtml (`flat` false, yaw = laptop yaw). */
export const laptopScreen = (position: V3, yaw = 0): { c: V3; yaw: number } => {
  const local: V3 = [0, 0.06 + Math.cos(LAPTOP.tilt) * 0.52, -0.5 + Math.sin(-LAPTOP.tilt) * 0.52 + 0.03];
  const cs = Math.cos(yaw);
  const sn = Math.sin(yaw);
  return { c: [position[0] + local[0] * cs + local[2] * sn, position[1] + local[1], position[2] - local[0] * sn + local[2] * cs], yaw };
};

/** Wi-fi router with blinking LEDs and two antennas. */
export const Router: React.FC<{ position: V3; t: number; on?: boolean }> = ({ position, t, on = true }) => (
  <group position={position}>
    <mesh position={[0, 0.12, 0]} castShadow>
      <BoxG args={[0.9, 0.24, 0.6]} />
      <Flat color="#20232C" />
    </mesh>
    {[-0.3, 0.3].map((x) => (
      <mesh key={x} position={[x, 0.5, -0.22]} rotation={[0, 0, x * 0.4]}>
        <CylG args={[0.03, 0.04, 0.6, 6]} />
        <Flat color="#20232C" />
      </mesh>
    ))}
    {[0, 1, 2, 3].map((i) => (
      <mesh key={i} position={[-0.27 + i * 0.18, 0.15, 0.305]}>
        <planeGeometry args={[0.07, 0.04]} />
        {on && (i === 0 || Math.sin(t * (9 + i * 3) + i) > -0.2) ? <Glow color={i === 0 ? "#6CFF8A" : "#7AD4FF"} /> : <Flat color="#2A2E38" />}
      </mesh>
    ))}
  </group>
);

/** A candle with a flickering flame and warm light. */
export const Candle: React.FC<{ position: V3; t: number; size?: number; light?: number }> = ({ position, t, size = 1, light = 1 }) => {
  const fl = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 5.3 + 1);
  return (
    <group position={position} scale={size}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <CylG args={[0.11, 0.12, 0.5, 8]} />
        <Flat color="#F2EEE0" />
      </mesh>
      <mesh position={[0, 0.62 + fl * 0.02, 0]} scale={[1, 1.6 * fl, 1]}>
        <IcoG args={[0.07, 1]} />
        <Glow color="#FFC060" />
      </mesh>
      <Halo position={[0, 0.65, 0]} size={1.4} color="#FFB050" opacity={0.35 * fl} />
      <pointLight position={[0, 0.9, 0]} color="#FFB060" intensity={5 * fl * light} distance={9} decay={2} />
    </group>
  );
};
