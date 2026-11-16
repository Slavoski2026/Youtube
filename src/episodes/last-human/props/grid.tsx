/**
 * Infrastructure for "Lights out": an empty grid control room with a wall map, substations (a safe
 * shutdown and a fault), a region of towns whose lights fail at staggered seeded times, a water
 * treatment plant, fuel tankers, a flashlight. Hero scale.
 */
import React, { useMemo } from "react";
import { random } from "remotion";
import { BoxG, CylG, IcoG, ConeG } from "../../../slavoski/detail";
import { Flat, Glow, Halo } from "../../../slavoski/materials";
import type { V3 } from "../../../slavoski/noise";
import { P } from "../../../slavoski/palette";
import { CanvasPanel, CANVAS_FONT } from "../../../slavoski/screens";
import { SmokeCluster } from "../../../slavoski/fx";

// ================================================================ control room

/**
 * The grid operator's wall map (invented region, no real places): districts as polygons whose fill
 * goes from lit amber to dark as `lost` (0..1) grows, warnings blinking. Returns a CanvasPanel draw fn.
 */
export const drawGridMap = (lost: number, t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0A1020";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#1E2C48";
  ctx.lineWidth = 2;
  for (let x = 0; x < W; x += W / 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += H / 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  // districts on a hex-ish grid
  const cols = 9;
  const rows = 4;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const k = `gm${r}:${c}`;
      const cx = W * (0.08 + (c / (cols - 1)) * 0.84) + (r % 2 ? W * 0.04 : 0);
      const cy = H * (0.2 + (r / (rows - 1)) * 0.6);
      const rad = Math.min(W / cols, H / rows) * 0.42;
      const failAt = random(`${k}f`);
      const dark = lost > failAt;
      const warn = !dark && lost > failAt - 0.25 && Math.floor(t * 3 + c) % 2 === 0;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        const rr = rad * (0.82 + random(`${k}r${i}`) * 0.3);
        ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fillStyle = dark ? "#151A26" : warn ? "#FF6A3A" : "#E0B04E";
      ctx.globalAlpha = dark ? 1 : 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#2E3C58";
      ctx.stroke();
    }
  ctx.fillStyle = "#8FB3D9";
  ctx.font = CANVAS_FONT(H * 0.06);
  ctx.textAlign = "left";
  ctx.fillText("REGIONAL GRID  ·  LOAD STATUS", W * 0.02, H * 0.08);
  ctx.textAlign = "right";
  ctx.fillStyle = lost > 0.05 ? "#FF6A3A" : "#7CFFB0";
  ctx.fillText(lost > 0.05 ? `${Math.round(lost * 100)}% OFFLINE` : "STABLE", W * 0.98, H * 0.08);
};

/** Rows of operator desks with monitors facing a wall map (on the back wall at z = -12). Nobody there. */
export const ControlRoom: React.FC<{ t: number; lost?: number; power?: number }> = ({ t, lost = 0, power = 1 }) => {
  const desks = useMemo(() => {
    const out: { x: number; z: number; i: number }[] = [];
    [0, 1, 2].forEach((row) => [-8, -3, 3, 8].forEach((x, i) => out.push({ x: x + (row % 2) * 0.6, z: -2 + row * 6, i: row * 4 + i })));
    return out;
  }, []);
  return (
    <group>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[40, 0.1, 40]} />
        <Flat color="#2A303E" />
      </mesh>
      <mesh position={[0, 7, -12.2]} receiveShadow>
        <BoxG args={[40, 14, 0.3]} />
        <Flat color="#1C2230" />
      </mesh>
      {[-20, 20].map((x) => (
        <mesh key={x} position={[x, 7, 2]}>
          <BoxG args={[0.3, 14, 30]} />
          <Flat color="#232A38" />
        </mesh>
      ))}
      <mesh position={[0, 14, 2]}>
        <BoxG args={[40, 0.3, 30]} />
        <Flat color="#1A1E28" />
      </mesh>
      {power > 0.2 ? <CanvasPanel position={[0, 7.2, -11.95]} w={26} h={9} px={1400} draw={drawGridMap(lost, t)} /> : (
        <mesh position={[0, 7.2, -11.95]}>
          <planeGeometry args={[26, 9]} />
          <Flat color="#0A0C12" />
        </mesh>
      )}
      {desks.map((d) => (
        <group key={d.i} position={[d.x, 0, d.z]}>
          <mesh position={[0, 1.75, 0]} castShadow receiveShadow>
            <BoxG args={[4.2, 0.12, 2.0]} />
            <Flat color="#4A5468" />
          </mesh>
          <mesh position={[0, 0.85, -0.6]} castShadow>
            <BoxG args={[4.0, 1.7, 0.12]} />
            <Flat color="#3A4254" />
          </mesh>
          {[-0.9, 0.9].map((mx, k) => (
            <group key={mx} position={[mx, 2.55, -0.4]} rotation={[-0.1, -mx * 0.15, 0]}>
              <mesh castShadow>
                <BoxG args={[1.5, 1.0, 0.08]} />
                <Flat color="#15181F" />
              </mesh>
              <mesh position={[0, 0, 0.045]}>
                <planeGeometry args={[1.38, 0.88]} />
                {power > 0.2 ? <Glow color={random(`mon${d.i}${k}`) < lost ? (Math.floor(t * 2 + d.i) % 2 ? "#FF6A3A" : "#5A2018") : "#4A8AC8"} /> : <Flat color="#0E1016" />}
              </mesh>
            </group>
          ))}
          {/* empty chair, pushed back */}
          <group position={[0.4 * (random(`ch${d.i}`) - 0.5), 0, 1.6 + random(`chz${d.i}`) * 0.6]} rotation={[0, (random(`chy${d.i}`) - 0.5) * 0.9, 0]}>
            <mesh position={[0, 1.3, 0]} castShadow>
              <BoxG args={[1.2, 0.18, 1.2]} />
              <Flat color="#20242E" />
            </mesh>
            <mesh position={[0, 2.1, 0.55]} castShadow>
              <BoxG args={[1.2, 1.4, 0.16]} />
              <Flat color="#20242E" />
            </mesh>
            <mesh position={[0, 0.65, 0]}>
              <CylG args={[0.08, 0.08, 1.3, 6]} />
              <Flat color="#5A5E68" />
            </mesh>
          </group>
          {random(`mug${d.i}`) < 0.5 ? (
            <mesh position={[1.5, 2.0, 0.3]} castShadow>
              <CylG args={[0.17, 0.15, 0.36, 8]} />
              <Flat color={["#E8862A", "#F2EEE6", "#24748F"][d.i % 3]} />
            </mesh>
          ) : null}
        </group>
      ))}
      {power > 0.2 ? <pointLight position={[0, 11, 0]} color="#BFD0F0" intensity={26 * power} distance={30} decay={2} /> : null}
      <pointLight position={[0, 7, -8]} color={lost > 0.3 ? "#FF7A4A" : "#6A9AE0"} intensity={12 * power} distance={20} decay={2} />
    </group>
  );
};

// ================================================================ substation

/**
 * A fenced substation yard: transformers, insulator stacks, busbars. `state`: "on" (humming, green),
 * "safe" (shut down cleanly: lights green → off as `k` 0..1), "fault" (arcing sparks and smoke at `k`).
 */
export const Substation: React.FC<{ t: number; state?: "on" | "safe" | "fault"; k?: number; dusk?: boolean }> = ({ t, state = "on", k = 0, dusk = true }) => {
  const live = state === "on" || (state === "safe" && k < 0.5) || state === "fault";
  return (
    <group>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <BoxG args={[60, 0.1, 44]} />
        <Flat color="#6A6A66" />
      </mesh>
      {/* fence */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 2.5, s * 22]}>
          <BoxG args={[60, 5, 0.08]} />
          <meshLambertMaterial color="#9AA1B0" transparent opacity={0.35} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 30, 2.5, 0]}>
          <BoxG args={[0.08, 5, 44]} />
          <meshLambertMaterial color="#9AA1B0" transparent opacity={0.35} />
        </mesh>
      ))}
      {[-14, 0, 14].map((x, i) => (
        <group key={x} position={[x, 0, -4]}>
          {/* transformer tank with radiator fins */}
          <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
            <BoxG args={[7, 6.4, 5]} />
            <Flat color="#7A8290" />
          </mesh>
          {Array.from({ length: 6 }, (_, f) => (
            <mesh key={f} position={[-3.0 + f * 1.2, 3.0, 2.9]} castShadow>
              <BoxG args={[0.18, 5.0, 0.8]} />
              <Flat color="#6A7280" />
            </mesh>
          ))}
          {/* bushings */}
          {[-2, 0, 2].map((bx) => (
            <group key={bx} position={[bx, 6.4, 0]}>
              {[0, 1, 2, 3].map((d) => (
                <mesh key={d} position={[0, 0.35 + d * 0.5, 0]}>
                  <CylG args={[0.32 - d * 0.03, 0.32 - d * 0.03, 0.3, 8]} />
                  <Flat color="#A8643A" />
                </mesh>
              ))}
            </group>
          ))}
          {/* status lamp */}
          <mesh position={[3.6, 5.5, 2.55]}>
            <BoxG args={[0.5, 0.5, 0.1]} />
            {live && !(state === "fault" && i === 1 && k > 0.3) ? <Glow color={state === "fault" && i === 1 ? "#FF3A2E" : "#3AE07A"} /> : <Flat color="#2A2E38" />}
          </mesh>
          {state === "fault" && i === 1 && k > 0.15 ? (
            <>
              <SmokeCluster position={[0, 7.5, 0]} progress={Math.min(1, (k - 0.15) * 1.6)} radius={3.5} rise={10} color="#3A3436" seed="subsmoke" />
              {Math.sin(t * 31) > 0.2 ? (
                <>
                  <Halo position={[0, 8.2, 0.5]} size={9} color="#9AD8FF" opacity={0.9} />
                  <pointLight position={[0, 8.2, 1.5]} color="#BFE6FF" intensity={60} distance={30} decay={2} />
                </>
              ) : null}
              {Array.from({ length: 10 }, (_, s) => {
                const ph = (t * 1.7 + random(`sp${s}`)) % 1;
                const a = random(`spa${s}`) * Math.PI * 2;
                return (
                  <mesh key={s} position={[Math.cos(a) * ph * 4, 8.2 + ph * 3 - ph * ph * 7, 0.5 + Math.sin(a) * ph * 4]}>
                    <IcoG args={[0.09, 0]} />
                    <Glow color="#FFE08A" />
                  </mesh>
                );
              })}
            </>
          ) : null}
        </group>
      ))}
      {/* gantry with busbars */}
      {[-24, 24].map((x) => (
        <mesh key={x} position={[x, 7, -4]} castShadow>
          <BoxG args={[0.6, 14, 0.6]} />
          <Flat color="#8A909C" />
        </mesh>
      ))}
      <mesh position={[0, 13.6, -4]} castShadow>
        <BoxG args={[48.6, 0.5, 0.5]} />
        <Flat color="#8A909C" />
      </mesh>
      {[-1.5, 0, 1.5].map((z) => (
        <mesh key={z} position={[0, 11.5, -4 + z]} rotation={[0, 0, Math.PI / 2]}>
          <CylG args={[0.06, 0.06, 48, 4]} />
          <Flat color="#C8CCD4" />
        </mesh>
      ))}
      {dusk && live ? <pointLight position={[0, 10, 8]} color="#E8EEF8" intensity={20} distance={40} decay={2} /> : null}
    </group>
  );
};

// ================================================================ region at night

/**
 * A landscape of towns at night seen from high up. Each town fails at its own seeded time in [0, 1]
 * of `k`; a few never fail within the shot. Towns are clusters of glowing dots on dark ground.
 */
export const RegionAtNight: React.FC<{ k: number; seed?: string; towns?: number; size?: number }> = ({ k, seed = "region", towns = 34, size = 900 }) => {
  const data = useMemo(
    () =>
      Array.from({ length: towns }, (_, i) => {
        const x = (random(`${seed}x${i}`) - 0.5) * size;
        const z = -random(`${seed}z${i}`) * size * 0.9 + 60;
        const n = 8 + Math.floor(random(`${seed}n${i}`) * 40);
        const r = 6 + random(`${seed}r${i}`) * 26;
        const fail = random(`${seed}f${i}`) * 1.25;
        const lights = Array.from({ length: n }, (_, j) => {
          const a = random(`${seed}${i}a${j}`) * Math.PI * 2;
          const d = Math.sqrt(random(`${seed}${i}d${j}`)) * r;
          return [x + Math.cos(a) * d, 0.6, z + Math.sin(a) * d] as V3;
        });
        return { lights, fail, x, z, r, i };
      }),
    [seed, towns, size],
  );
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -size / 2]} receiveShadow>
        <planeGeometry args={[size * 3, size * 3]} />
        <Flat color="#141A22" />
      </mesh>
      {data.map((d) => {
        const flick = k > d.fail - 0.04 && k < d.fail && Math.sin(k * 300 + d.i) > 0;
        const on = k < d.fail && !flick;
        return (
          <group key={d.i}>
            {on
              ? d.lights.map((p, j) => (
                  <mesh key={j} position={p}>
                    <BoxG args={[1.6, 0.8, 1.6]} />
                    <Glow color={j % 5 === 0 ? "#FFF0C8" : P.windowLit} />
                  </mesh>
                ))
              : null}
            {on ? <Halo position={[d.x, 3, d.z]} size={d.r * 3} color="#FFB060" opacity={0.25} /> : null}
          </group>
        );
      })}
      {/* roads between towns: faint lines */}
      {data.slice(0, towns - 1).map((d, i) => {
        const e = data[i + 1];
        const len = Math.hypot(e.x - d.x, e.z - d.z);
        return (
          <mesh key={i} position={[(d.x + e.x) / 2, 0.05, (d.z + e.z) / 2]} rotation={[0, -Math.atan2(e.z - d.z, e.x - d.x), 0]}>
            <BoxG args={[len, 0.05, 0.8]} />
            <Flat color="#2A3040" />
          </mesh>
        );
      })}
    </group>
  );
};

// ================================================================ water

/** Water treatment: round settling tanks with rotating bridges that slow and stop as `run` → 0. */
export const WaterPlant: React.FC<{ t: number; run?: number; night?: boolean }> = ({ t, run = 1, night = true }) => (
  <group>
    <mesh position={[0, -0.05, 0]} receiveShadow>
      <BoxG args={[200, 0.1, 200]} />
      <Flat color="#5A5E58" />
    </mesh>
    {[
      [-16, -10],
      [16, -10],
      [0, 18],
    ].map(([x, z], i) => {
      const ang = (t * 0.25 + i) * run + i;
      return (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
            <CylG args={[12, 12, 2.8, 28, 1, true]} />
            <Flat color="#9A9E98" side={2} />
          </mesh>
          <mesh position={[0, 2.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[11.8, 28]} />
            <Flat color={night ? "#1E3A44" : "#3A6A72"} />
          </mesh>
          <group rotation={[0, ang, 0]}>
            <mesh position={[6, 3.4, 0]} castShadow>
              <BoxG args={[12, 0.6, 1.4]} />
              <Flat color="#C8CCD4" />
            </mesh>
            <mesh position={[11.5, 3.0, 0]}>
              <BoxG args={[1, 1.4, 1.6]} />
              <Flat color="#E0B04E" />
            </mesh>
          </group>
          <mesh position={[0, 3.2, 0]} castShadow>
            <CylG args={[0.9, 0.9, 2.4, 10]} />
            <Flat color="#8A909C" />
          </mesh>
          {night ? (
            <mesh position={[0, 4.6, 0]}>
              <BoxG args={[0.4, 0.4, 0.4]} />
              {run > 0.05 ? <Glow color="#3AE07A" /> : <Glow color="#FF3A2E" />}
            </mesh>
          ) : null}
        </group>
      );
    })}
    {/* pipe runs */}
    {[0, 1].map((i) => (
      <mesh key={i} position={[0, 1.0, -10 + i * 14]} rotation={[0, 0, Math.PI / 2]}>
        <CylG args={[0.6, 0.6, 60, 8]} />
        <Flat color="#4A6A8A" />
      </mesh>
    ))}
  </group>
);

/** A fuel tanker truck (hero scale, ~16 long), front facing +Z. */
export const FuelTanker: React.FC<{ position: V3; yaw?: number; color?: string }> = ({ position, yaw = 0, color = "#E8E4DA" }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    <mesh position={[0, 3.0, 6.0]} castShadow>
      <BoxG args={[4.6, 4.2, 3.6]} />
      <Flat color="#C8372D" />
    </mesh>
    <mesh position={[0, 3.6, 7.85]}>
      <planeGeometry args={[4.0, 1.4]} />
      <Flat color="#2A3A50" />
    </mesh>
    <mesh position={[0, 3.6, -2.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <CylG args={[2.3, 2.3, 11, 12]} />
      <Flat color={color} />
    </mesh>
    <mesh position={[0, 1.3, -1.5]} castShadow>
      <BoxG args={[3.6, 0.5, 16]} />
      <Flat color="#2A2A30" />
    </mesh>
    {[-1, 1].flatMap((sx) =>
      [6.0, -2.5, -6.0].map((z) => (
        <mesh key={`${sx}${z}`} position={[sx * 2.1, 0.9, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <CylG args={[0.9, 0.9, 0.7, 10]} />
          <Flat color="#1A1A1E" />
        </mesh>
      )),
    )}
    <mesh position={[0, 3.6, -2.2]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[6, 0.8]} />
      <Flat color="#E0B04E" />
    </mesh>
  </group>
);

/** A handheld flashlight beam: a soft cone from `from` toward `to`, plus a spot light. */
export const FlashBeam: React.FC<{ from: V3; to: V3; strength?: number }> = ({ from, to, strength = 1 }) => {
  // The cone's apex (+Y) points back at the lamp, so its wide end lands on the target.
  const dir: V3 = [from[0] - to[0], from[1] - to[1], from[2] - to[2]];
  const len = Math.hypot(...dir);
  const mid: V3 = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
  const yaw = Math.atan2(dir[0], dir[2]);
  const pitch = Math.atan2(Math.hypot(dir[0], dir[2]), dir[1]);
  return (
    <group>
      <group position={mid} rotation={[0, yaw, 0]}>
        <mesh rotation={[pitch, 0, 0]}>
          <ConeG args={[len * 0.28, len, 16, 1, true]} />
          <meshBasicMaterial color="#FFF2D0" transparent opacity={0.08 * strength} depthWrite={false} blending={2} side={2} toneMapped={false} />
        </mesh>
      </group>
      <pointLight position={[from[0] - dir[0] * 0.7, from[1] - dir[1] * 0.7, from[2] - dir[2] * 0.7]} color="#FFF2D0" intensity={14 * strength} distance={len * 1.2} decay={2} />
      <Halo position={from} size={1.4} color="#FFF2D0" opacity={0.7 * strength} />
    </group>
  );
};
