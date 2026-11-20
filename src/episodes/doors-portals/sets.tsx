/**
 * Ep. 8 sets, all at hero scale (Slavoski 4.2 tall, a door 2.2 × 4.7, 1 m ≈ 2.2 units).
 * Real places are named only in the narration: every building, room and sign here is generic.
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { Building, Car, Lamp } from "../../slavoski/city";
import { BoxG, ConeG, CylG, IcoG } from "../../slavoski/detail";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import type { V3 } from "../../slavoski/noise";
import { P } from "../../slavoski/palette";
import { DOOR, DoorFrame, DoorLeaf, LightPool, PortalRim, WallWithDoor } from "../../slavoski/portal";
import { CANVAS_FONT, CanvasPanel, fitText } from "../../slavoski/screens";
import { Rain } from "../../slavoski/nature";

const box = (pos: V3, size: V3, color: string, opts: { cast?: boolean; key?: string | number; rot?: V3 } = {}) => (
  <mesh key={opts.key} position={pos} rotation={opts.rot} castShadow={opts.cast ?? true} receiveShadow>
    <BoxG args={size} />
    <Flat color={color} />
  </mesh>
);
const glowBox = (pos: V3, size: V3, color: string, key?: string | number) => (
  <mesh key={key} position={pos}>
    <boxGeometry args={size} />
    <Glow color={color} />
  </mesh>
);

/** Two door poses back to back: maps the `from` world so its door lines up behind the `to` door. */
export const Linked: React.FC<{ to: { pos: V3; yaw?: number }; from: { pos: V3; yaw?: number }; children: React.ReactNode }> = ({ to, from, children }) => (
  <group position={to.pos} rotation={[0, (to.yaw ?? 0) + Math.PI, 0]}>
    <group rotation={[0, -(from.yaw ?? 0), 0]}>
      <group position={[-from.pos[0], -from.pos[1], -from.pos[2]]}>{children}</group>
    </group>
  </group>
);

/** Snow and mist blowing out of an opening toward +Z (local), looping with t. */
export const Blizzard: React.FC<{ position: V3; yaw?: number; w: number; h: number; t: number; count?: number; reach?: number; color?: string; seed?: string; mist?: boolean }> = ({
  position,
  yaw = 0,
  w,
  h,
  t,
  count = 160,
  reach = 9,
  color = "#F4F8FF",
  seed = "bliz",
  mist = true,
}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const flakes = useMemo(
    () => Array.from({ length: count }, (_, i) => ({ x: random(`${seed}x${i}`) - 0.5, y: random(`${seed}y${i}`), o: random(`${seed}o${i}`), sp: 0.5 + random(`${seed}s${i}`) * 0.9, sz: 0.05 + random(`${seed}z${i}`) * 0.07 })),
    [count, seed],
  );
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    flakes.forEach((f, i) => {
      const k = (f.o + t * f.sp * 0.55) % 1;
      o.position.set(f.x * w * (1 + k * 1.6) + Math.sin(t * 3 + i) * 0.2, f.y * h - h / 2 - k * h * 0.25, k * reach);
      o.scale.setScalar(f.sz / 0.1);
      o.rotation.set(t * 2 + i, t, 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <instancedMesh ref={ref} args={[undefined, undefined, flakes.length]} key={flakes.length}>
        <IcoG args={[0.1, 0]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </instancedMesh>
      {mist
        ? Array.from({ length: 7 }, (_, i) => {
            const k = ((random(`${seed}m${i}`) + t * 0.35) % 1 + 1) % 1;
            return (
              <mesh key={i} position={[(random(`${seed}mx${i}`) - 0.5) * w * (1 + k), -h / 2 + 0.4 + k * 0.3, 0.4 + k * reach * 0.6]} scale={[1.6 + k * 2, 0.7 + k * 0.6, 1.4 + k]}>
                <IcoG args={[0.9, 1]} />
                <meshLambertMaterial color="#EEF4FA" transparent opacity={0.28 * (1 - k)} depthWrite={false} flatShading />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

/** Sand blowing in through an opening (toward +Z local): warm grains and a dust plume. */
export const SandGust: React.FC<{ position: V3; yaw?: number; w: number; h: number; t: number; count?: number; reach?: number }> = ({ position, yaw = 0, w, h, t, count = 140, reach = 8 }) => (
  <group>
    <Blizzard position={position} yaw={yaw} w={w} h={h} t={t} count={count} reach={reach} color="#E8C890" seed="sand" mist={false} />
    <group position={position} rotation={[0, yaw, 0]}>
      {Array.from({ length: 6 }, (_, i) => {
        const k = ((random(`sg${i}`) + t * 0.4) % 1 + 1) % 1;
        return (
          <mesh key={i} position={[(random(`sgx${i}`) - 0.5) * w * (1 + k), -h / 2 + 0.3 + k * 0.4, 0.3 + k * reach * 0.6]} scale={[1.4 + k * 2, 0.5 + k * 0.5, 1.2 + k]}>
            <IcoG args={[0.8, 1]} />
            <meshLambertMaterial color="#E2C08A" transparent opacity={0.3 * (1 - k)} depthWrite={false} flatShading />
          </mesh>
        );
      })}
    </group>
  </group>
);

// ================================================================ London hallway

/** The London hallway: back wall at z = 0 with the bathroom door (x = 0), runs to z = 16, width 7, height 6. */
export const HALL = { w: 7, h: 6, len: 16, door: [0, DOOR.h / 2, 0] as V3, clock: [2.15, 3.62, 0.42] as V3, win: { z: 7.5, y: 3.5, w: 3.2, h: 2.6 } };

export const DigitalClock: React.FC<{ position: V3; yaw?: number; text: string; flash?: boolean }> = ({ position, yaw = 0, text, flash = false }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    {box([0, 0, 0], [1.3, 0.62, 0.42], "#1A1C24")}
    <CanvasPanel
      position={[0, 0.01, 0.215]}
      w={1.16}
      h={0.48}
      px={512}
      draw={(ctx, W, H) => {
        ctx.fillStyle = "#0A0A0E";
        ctx.fillRect(0, 0, W, H);
        ctx.font = CANVAS_FONT(H * 0.78);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255,70,50,0.12)";
        ctx.fillText("88:88", W / 2, H * 0.54);
        ctx.shadowColor = "#FF3A2A";
        ctx.shadowBlur = flash ? 40 : 22;
        ctx.fillStyle = flash ? "#FFD0C8" : "#FF4A3A";
        ctx.fillText(text, W / 2, H * 0.54);
      }}
    />
    <Halo position={[0, 0, 0.3]} size={1.6} color="#FF4A3A" opacity={flash ? 0.45 : 0.25} />
  </group>
);

const Frame2D: React.FC<{ position: V3; yaw?: number; w: number; h: number; seed: string }> = ({ position, yaw = 0, w, h, seed }) => (
  <group position={position} rotation={[0, yaw, 0]}>
    {box([0, 0, 0], [w + 0.2, h + 0.2, 0.08], "#C9A44A", { cast: false })}
    <CanvasPanel
      position={[0, 0, 0.05]}
      w={w}
      h={h}
      px={256}
      draw={(ctx, W, H) => {
        ctx.fillStyle = "#E8DFC8";
        ctx.fillRect(0, 0, W, H);
        const cols = ["#2E5A6A", "#C8372D", "#FFBA58", "#5A4A78", "#2F7A5A"];
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = cols[(i + seed.length) % cols.length];
          const r = random(`${seed}${i}`);
          if (i % 2) ctx.fillRect(W * r * 0.6, H * random(`${seed}y${i}`) * 0.6, W * 0.35, H * 0.3);
          else {
            ctx.beginPath();
            ctx.arc(W * (0.2 + r * 0.6), H * (0.2 + random(`${seed}c${i}`) * 0.6), W * 0.16, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }}
    />
  </group>
);

/** A row of London-style terraced houses (fronts at local z = 0, facing +Z) with rain, for window views. */
export const Hallway: React.FC<{ t: number; seams?: number; doorOpen?: number; doorColor?: string; clockText?: string; clockFlash?: boolean; lampOn?: boolean; handle?: number; wall?: string }> = ({
  t,
  seams = 0,
  doorOpen = 0,
  doorColor = "#F2EEE4",
  clockText = "8:59",
  clockFlash = false,
  lampOn = true,
  handle = 0,
  wall = "#7E9478",
}) => {
  const { w, h, len, win } = HALL;
  const lower = "#E8E2D4";
  const z0 = win.z - win.w / 2;
  const z1 = win.z + win.w / 2;
  const y0 = win.y - win.h / 2;
  const y1 = win.y + win.h / 2;
  return (
    <group>
      {/* floor: oak planks + runner */}
      {box([0, -0.1, len / 2], [w, 0.2, len], "#8A5E3C", { cast: false })}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={`pl${i}`} position={[-w / 2 + 0.39 + i * 0.78, 0.004, len / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[0.72, len]} />
          <Flat color={i % 2 ? "#946644" : "#80563A"} />
        </mesh>
      ))}
      <mesh position={[0, 0.012, len / 2 + 0.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.6, len - 2.4]} />
        <Flat color="#8A2E2E" />
      </mesh>
      <mesh position={[0, 0.016, len / 2 + 0.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.1, len - 2.9]} />
        <Flat color="#A84A3A" />
      </mesh>
      {/* back wall with the bathroom door */}
      <WallWithDoor position={[0, 0, 0]} width={w} height={h} color={wall} skirting="#F2EEE4" />
      <DoorFrame position={HALL.door} />
      <DoorLeaf position={[0, DOOR.h / 2, 0.1]} open={doorOpen} toward color={doorColor} handle={handle} />
      {seams > 0 ? (
        <group>
          {[
            [0, -DOOR.h / 2 + 0.03, DOOR.w, 0.07],
            [-DOOR.w / 2 + 0.03, 0, 0.06, DOOR.h],
            [DOOR.w / 2 - 0.03, 0, 0.06, DOOR.h],
            [0, DOOR.h / 2 - 0.03, DOOR.w, 0.06],
          ].map(([x, y, sw, sh], i) => (
            <mesh key={i} position={[x, DOOR.h / 2 + y, 0.2]}>
              <planeGeometry args={[sw, sh]} />
              <Glow color="#FFE4A8" opacity={seams} additive />
            </mesh>
          ))}
          <LightPool position={[0, 0.03, 1.9]} w={2.4} d={3.4} color="#FFD890" opacity={0.42 * seams} />
          <Halo position={[0, 0.3, 0.4]} size={4} color="#FFD890" opacity={0.35 * seams} />
          <pointLight position={[0.9, 2.6, 0.9]} color="#FFD890" intensity={7 * seams} distance={7} decay={2} />
        </group>
      ) : null}
      {/* clock shelf beside the door */}
      {box([2.15, 3.2, 0.45], [1.6, 0.12, 0.6], "#5A3E2E")}
      <DigitalClock position={HALL.clock} text={clockText} flash={clockFlash} />
      {box([2.8, 3.55, 0.4], [0.3, 0.6, 0.3], "#3E7D45")}
      {/* side walls: right solid, left with the window */}
      {box([w / 2 + 0.15, h / 2, len / 2], [0.3, h, len], wall, { cast: false })}
      {box([-w / 2 - 0.15, h / 2, z0 / 2], [0.3, h, z0], wall, { cast: false })}
      {box([-w / 2 - 0.15, h / 2, (z1 + len) / 2], [0.3, h, len - z1], wall, { cast: false })}
      {box([-w / 2 - 0.15, y0 / 2, win.z], [0.3, y0, win.w], wall, { cast: false })}
      {box([-w / 2 - 0.15, (h + y1) / 2, win.z], [0.3, h - y1, win.w], wall, { cast: false })}
      {/* lower panelling + dado rails on both side walls */}
      {[-1, 1].map((s) => (
        <group key={s}>
          {box([s * (w / 2 - 0.02), 1.0, len / 2], [0.06, 2.0, len], lower, { cast: false })}
          {box([s * (w / 2 - 0.06), 2.02, len / 2], [0.1, 0.1, len], "#F2EEE4", { cast: false })}
        </group>
      ))}
      {/* window frame, glass and rain streaks */}
      {[
        [y1, win.z, 0.14, win.w + 0.24],
        [y0, win.z, 0.18, win.w + 0.3],
        [win.y, z0, win.h, 0.14],
        [win.y, z1, win.h, 0.14],
        [win.y, win.z, win.h, 0.08],
        [win.y, win.z, 0.08, win.w],
      ].map(([y, z, hh, ww], i) => box([-w / 2 - 0.05, y, z], [0.22, hh, ww], "#F2EEE4", { key: `wf${i}`, cast: false }))}
      <mesh position={[-w / 2 - 0.1, win.y, win.z]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[win.w, win.h]} />
        <meshLambertMaterial color="#9FB8CC" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const k = ((random(`wr${i}`) + t * 0.6) % 1 + 1) % 1;
        return (
          <mesh key={`wr${i}`} position={[-w / 2 - 0.06, y1 - 0.1 - k * (win.h - 0.2), z0 + 0.15 + random(`wrz${i}`) * (win.w - 0.3)]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.025, 0.28]} />
            <Glow color="#DCE8F4" opacity={0.6} />
          </mesh>
        );
      })}
      {/* radiator under the window */}
      <group position={[-w / 2 + 0.3, 1.0, win.z]}>
        {Array.from({ length: 9 }, (_, i) => box([0, 0, -1.2 + i * 0.3], [0.22, 1.2, 0.2], "#F2EEE4", { key: i, cast: false }))}
      </group>
      {/* right wall: pictures, coat hooks with coats and an umbrella */}
      <Frame2D position={[w / 2 - 0.05, 3.7, 5]} yaw={-Math.PI / 2} w={1.5} h={1.1} seed="artA" />
      <Frame2D position={[w / 2 - 0.05, 3.9, 8.2]} yaw={-Math.PI / 2} w={1.0} h={1.4} seed="artB" />
      {box([w / 2 - 0.1, 4.3, 11.5], [0.12, 0.14, 2.4], "#5A3E2E")}
      {box([w / 2 - 0.42, 3.1, 11.0], [0.6, 2.3, 0.9], "#2E3E5A")}
      {box([w / 2 - 0.42, 3.3, 12.1], [0.6, 1.9, 0.8], "#8A6A3A")}
      <mesh position={[w / 2 - 0.4, 1.0, 13.2]} rotation={[0, 0, 0.12]} castShadow>
        <CylG args={[0.05, 0.05, 2.0, 6]} />
        <Flat color="#1A1A22" />
      </mesh>
      {/* ceiling + pendant */}
      {box([0, h + 0.1, len / 2], [w + 0.6, 0.2, len], "#F2EEE4", { cast: false })}
      {/* flush ceiling light (a pendant would hang in front of the over-shoulder cameras) */}
      <mesh position={[0, h - 0.04, 7]}>
        <CylG args={[0.7, 0.8, 0.12, 16]} />
        <Flat color="#F2EEE4" />
      </mesh>
      {lampOn ? (
        <>
          <mesh position={[0, h - 0.11, 7]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.6, 16]} />
            <Glow color="#FFE8B0" />
          </mesh>
          <Halo position={[0, h - 0.3, 7]} size={2.6} color="#FFD890" opacity={0.45} />
          <pointLight position={[0, h - 0.8, 7]} color="#FFD0A0" intensity={10} distance={16} decay={1.6} />
        </>
      ) : null}
      {/* the view: terraces across the street, in the rain */}
      <group position={[-26, 0, 8]} rotation={[0, Math.PI / 2, 0]}>
        <TerraceRow count={5} seed="hallview" x0={-27} />
      </group>
      <Rain center={[-12, 6, 8]} size={[10, 14, 18]} t={t} count={260} seed="hallrain" thickness={0.025} opacity={0.5} />
    </group>
  );
};

// ================================================================ terraced street

const BRICKS = ["#8A4A3A", "#A0614A", "#7A3E34", "#E6DCC4", "#9A5A44", "#D8CDB2"];
const DOOR_COLS = ["#C8372D", "#24508F", "#2F6A4A", "#1A1A22", "#E0B04E", "#5A2A6A", "#2E7A8A"];
export const TERRACE = { w: 11, h: 21, door: { x: 3.0, y: 0.6 } };

/** One terraced house, front at z = 0 facing +Z; the front door's opening centre at (3.0, 0.6 + 2.35, 0). */
export const TerraceHouse: React.FC<{ position: V3; yaw?: number; seed: string; glow?: number; glowColor?: string; open?: number; t?: number; lit?: boolean }> = ({
  position,
  yaw = 0,
  seed,
  glow = 0,
  glowColor = "#FFD08A",
  open = 0,
  t = 0,
  lit = true,
}) => {
  const brick = BRICKS[Math.floor(random(`${seed}b`) * BRICKS.length)];
  const doorC = DOOR_COLS[Math.floor(random(`${seed}d`) * DOOR_COLS.length)];
  const trim = "#F2EEE4";
  const { w, h } = TERRACE;
  const dx = TERRACE.door.x;
  const dy = TERRACE.door.y + DOOR.h / 2;
  const win = (x: number, y: number, ww: number, hh: number, k: string) => {
    const on = lit && random(`${seed}${k}`) < 0.45;
    return (
      <group key={k} position={[x, y, 0.06]}>
        {box([0, 0, 0], [ww + 0.36, hh + 0.36, 0.14], trim, { cast: false })}
        <mesh position={[0, 0, 0.08]}>
          <planeGeometry args={[ww, hh]} />
          {on ? <Glow color="#F2C47A" /> : <Flat color="#3A4A5E" />}
        </mesh>
        {box([0, 0, 0.1], [0.08, hh, 0.06], trim, { cast: false })}
        {box([0, hh * 0.1, 0.1], [ww, 0.08, 0.06], trim, { cast: false })}
        {box([0, -hh / 2 - 0.22, 0.18], [ww + 0.6, 0.16, 0.36], trim, { cast: false })}
      </group>
    );
  };
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {box([0, h / 2, -7], [w, h, 14], brick)}
      {/* ground floor: stucco band, bay window, steps, door */}
      {box([0, 4.4, 0.04], [w, 8.8, 0.1], trim, { cast: false })}
      <group position={[-2.4, 0, 0]}>
        {box([0, 3.4, 0.9], [4.6, 5.4, 1.8], trim)}
        {[-1.4, 0, 1.4].map((x, i) => (
          <mesh key={i} position={[x, 3.6, 1.82]}>
            <planeGeometry args={[1.1, 3.0]} />
            {lit && random(`${seed}bay${i}`) < 0.6 ? <Glow color="#F2C47A" /> : <Flat color="#3A4A5E" />}
          </mesh>
        ))}
        {box([0, 6.2, 0.95], [4.9, 0.3, 2.0], trim)}
      </group>
      {box([dx, 0.15, 1.1], [3.4, 0.3, 2.2], "#C9C2B4")}
      {box([dx, 0.45, 0.7], [3.0, 0.3, 1.4], "#C9C2B4")}
      {/* door: recess, frame, fanlight */}
      <DoorFrame position={[dx, dy, 0.1]} color={trim} depth={0.4} />
      <mesh position={[dx, dy + DOOR.h / 2 + 0.55, 0.12]}>
        <circleGeometry args={[DOOR.w / 2, 16, 0, Math.PI]} />
        {lit ? <Glow color="#F2C47A" /> : <Flat color="#3A4A5E" />}
      </mesh>
      {open < 0.02 ? <DoorLeaf position={[dx, dy, 0.05]} color={doorC} knob="#C9A44A" /> : <DoorLeaf position={[dx, dy, 0.12]} color={doorC} open={open} toward />}
      {glow > 0 ? (
        <group>
          {open < 0.02
            ? [
                [0, -DOOR.h / 2 + 0.04, DOOR.w, 0.08],
                [-DOOR.w / 2 + 0.04, 0, 0.08, DOOR.h],
                [DOOR.w / 2 - 0.04, 0, 0.08, DOOR.h],
                [0, DOOR.h / 2 - 0.04, DOOR.w, 0.08],
              ].map(([x, y, sw, sh], i) => (
                <mesh key={i} position={[dx + x, dy + y, 0.14]}>
                  <planeGeometry args={[sw, sh]} />
                  <Glow color={glowColor} opacity={glow} additive />
                </mesh>
              ))
            : (
              <>
                <mesh position={[dx, dy, 0.02]}>
                  <planeGeometry args={[DOOR.w, DOOR.h]} />
                  <Glow color={glowColor} opacity={glow} />
                </mesh>
                <PortalRim position={[dx, dy, 0.04]} w={DOOR.w} h={DOOR.h} t={t} color={glowColor} k={glow} sparks={14} seed={seed} />
              </>
            )}
          <LightPool position={[dx, 0.62, 2.6]} w={3} d={4.4} color={glowColor} opacity={0.5 * glow} />
          <Halo position={[dx, dy, 0.6]} size={8} color={glowColor} opacity={0.4 * glow} />
        </group>
      ) : null}
      {/* upper floors */}
      {[10.6, 16.0].map((y, f) => (
        <React.Fragment key={f}>
          {win(-2.4, y, 1.6, 3.0, `u${f}a`)}
          {win(2.6, y, 1.6, 3.0, `u${f}b`)}
        </React.Fragment>
      ))}
      {box([0, h - 0.2, 0.25], [w + 0.2, 0.5, 0.6], trim)}
      {box([0, h + 0.7, -0.3], [w, 1.4, 0.4], brick)}
      {/* chimney stack + pots */}
      {box([w / 2 - 1.2, h + 2.6, -5], [2.4, 4.4, 1.6], brick)}
      {[-0.6, 0.0, 0.6].map((x) => (
        <mesh key={x} position={[w / 2 - 1.2 + x, h + 5.2, -5]} castShadow>
          <CylG args={[0.2, 0.24, 0.8, 6]} />
          <Flat color="#A8603A" />
        </mesh>
      ))}
      {/* railings */}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={`r${i}`} position={[-w / 2 + 0.4 + i * 0.5, 1.0, 3.0]} castShadow>
          <CylG args={[0.04, 0.04, 2.0, 4]} />
          <Flat color="#1A1A22" />
        </mesh>
      ))}
    </group>
  );
};

/** A row of terraces along +X starting at x0, fronts at z = 0. */
export const TerraceRow: React.FC<{ count: number; seed: string; x0?: number; glow?: (i: number) => number; open?: (i: number) => number; glowColor?: (i: number) => string; t?: number; lit?: boolean }> = ({
  count,
  seed,
  x0 = 0,
  glow,
  open,
  glowColor,
  t = 0,
  lit = true,
}) => (
  <group>
    {Array.from({ length: count }, (_, i) => (
      <TerraceHouse key={i} position={[x0 + i * TERRACE.w, 0, 0]} seed={`${seed}${i}`} glow={glow?.(i) ?? 0} open={open?.(i) ?? 0} glowColor={glowColor?.(i)} t={t} lit={lit} />
    ))}
  </group>
);

/** A London street: terraces both sides of a road along X, parked cars, lamps, rain. Row A fronts at z = -12 (facing +Z), row B at z = +12 (facing -Z). */
export const TerraceStreet: React.FC<{ t: number; glow?: (row: number, i: number) => number; open?: (row: number, i: number) => number; color?: (row: number, i: number) => string; rain?: boolean; count?: number }> = ({
  t,
  glow,
  open,
  color,
  rain = true,
  count = 8,
}) => {
  const x0 = -((count - 1) * TERRACE.w) / 2;
  return (
    <group>
      {box([0, -0.1, 0], [count * TERRACE.w + 80, 0.2, 140], "#3A3F4A", { cast: false })}
      {box([0, -0.02, 0], [count * TERRACE.w + 80, 0.1, 12], P.road, { cast: false })}
      {[-1, 1].map((s) => box([0, 0.12, s * 9], [count * TERRACE.w + 80, 0.24, 6], "#6A6E78", { key: s, cast: false }))}
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={`lm${i}`} position={[-60 + i * 9, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3, 0.25]} />
          <Flat color={P.laneMark} />
        </mesh>
      ))}
      <group position={[0, 0, -12]}>
        <TerraceRow count={count} seed="rowA" x0={x0} glow={(i) => glow?.(0, i) ?? 0} open={(i) => open?.(0, i) ?? 0} glowColor={(i) => color?.(0, i) ?? "#FFD08A"} t={t} />
      </group>
      <group position={[0, 0, 12]} rotation={[0, Math.PI, 0]}>
        <TerraceRow count={count} seed="rowB" x0={x0} glow={(i) => glow?.(1, i) ?? 0} open={(i) => open?.(1, i) ?? 0} glowColor={(i) => color?.(1, i) ?? "#FFD08A"} t={t} />
      </group>
      <group scale={3.2}>
        {[-14, -5, 6, 15].map((x, i) => (
          <Car key={i} position={[x, 0, i % 2 ? 1.25 : -1.25]} yaw={i % 2 ? Math.PI / 2 : -Math.PI / 2} color={[P.carRed, "#2E3E5A", "#E8E4DA", P.carTeal][i]} />
        ))}
        {[-18, -6, 6, 18].map((x, i) => (
          <Lamp key={`l${i}`} position={[x, 0, i % 2 ? 2.6 : -2.6]} yaw={i % 2 ? Math.PI : 0} on />
        ))}
      </group>
      {rain ? <Rain center={[0, 14, 0]} size={[90, 30, 40]} t={t} count={1400} seed="strain" thickness={0.06} opacity={0.45} /> : null}
    </group>
  );
};

// ================================================================ hotel corridor

export const CORR = { w: 8, h: 6.4, z0: 6, z1: -64, doorEvery: 8.5 };
export const corrDoors = Array.from({ length: 7 }, (_, i) => ({ side: i % 2 ? 1 : -1, z: -6 - i * CORR.doorEvery }));
const CORR_COLS = ["#7FD8FF", "#FFB25A", "#7FFFA0", "#FF6AC0", "#B88AFF", "#FFE07A", "#6AE0D0"];

/** A long hotel corridor along -Z; side doors burst open (open(i) 0..1) spilling coloured portal light. */
export const Corridor: React.FC<{ t: number; open?: (i: number) => number; endOpen?: number }> = ({ t, open, endOpen = 0 }) => {
  const { w, h, z0, z1 } = CORR;
  const len = z0 - z1;
  const zc = (z0 + z1) / 2;
  return (
    <group>
      {box([0, -0.1, zc], [w, 0.2, len], "#4A1E24", { cast: false })}
      <CanvasPanel
        position={[0, 0.01, zc]}
        rotation={[-Math.PI / 2, 0, 0]}
        w={w - 1.2}
        h={len}
        px={256}
        draw={(ctx, W, H) => {
          ctx.fillStyle = "#6A1E2A";
          ctx.fillRect(0, 0, W, H);
          ctx.strokeStyle = "#C9A44A";
          ctx.lineWidth = 3;
          ctx.strokeRect(10, 0, W - 20, H);
          const step = W / 4;
          for (let y = 0; y < H; y += step) {
            for (let x = step / 2; x < W; x += step) {
              ctx.fillStyle = "#8A3A3A";
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x + step * 0.3, y + step / 2);
              ctx.lineTo(x, y + step);
              ctx.lineTo(x - step * 0.3, y + step / 2);
              ctx.closePath();
              ctx.fill();
            }
          }
        }}
      />
      {box([0, h + 0.1, zc], [w + 0.6, 0.2, len], "#F2EEE4", { cast: false })}
      {Array.from({ length: 9 }, (_, i) => (
        <group key={`cl${i}`}>
          <mesh position={[0, h - 0.02, z0 - 4 - i * 8]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.45, 16]} />
            <Glow color="#FFF0D0" />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((s) => {
        const x = (s * w) / 2;
        const doors = corrDoors.filter((d) => d.side === s);
        // wall segments between the doors
        const edges = [z0, ...doors.flatMap((d) => [d.z + DOOR.w / 2, d.z - DOOR.w / 2]), z1];
        const segs: [number, number][] = [];
        for (let k = 0; k < edges.length; k += 2) segs.push([edges[k], edges[k + 1]]);
        return (
          <group key={s}>
            {segs.map(([a, b], k) => (
              <group key={k}>
                {box([x + s * 0.15, h / 2, (a + b) / 2], [0.3, h, a - b], "#24505A", { cast: false })}
                {box([x - s * 0.02, 1.3, (a + b) / 2], [0.06, 2.6, a - b], "#E8E2D4", { cast: false })}
                {box([x - s * 0.06, 2.62, (a + b) / 2], [0.1, 0.12, a - b], "#C9A44A", { cast: false })}
              </group>
            ))}
            {doors.map((d) => (
              <group key={d.z}>
                {box([x + s * 0.15, DOOR.h + (h - DOOR.h) / 2, d.z], [0.3, h - DOOR.h, DOOR.w], "#24505A", { cast: false })}
              </group>
            ))}
            {/* sconces between doors */}
            {Array.from({ length: 8 }, (_, i) => {
              const z = z0 - 2 - i * CORR.doorEvery;
              return (
                <group key={`sc${i}`} position={[x - s * 0.15, 4.0, z]}>
                  <mesh>
                    <BoxG args={[0.2, 0.5, 0.3]} />
                    <Glow color="#FFE0A8" />
                  </mesh>
                  <Halo size={1.8} color="#FFD08A" opacity={0.45} />
                </group>
              );
            })}
          </group>
        );
      })}
      {corrDoors.map((d, i) => {
        const k = open?.(i) ?? 0;
        const yaw = d.side < 0 ? Math.PI / 2 : -Math.PI / 2;
        const x = (d.side * w) / 2;
        const c = CORR_COLS[i % CORR_COLS.length];
        return (
          <group key={i}>
            <DoorFrame position={[x, DOOR.h / 2, d.z]} yaw={yaw} color="#F2EEE4" depth={0.4} />
            <DoorLeaf position={[x + d.side * 0.1, DOOR.h / 2, d.z]} yaw={yaw} open={k} color="#3A2A22" knob="#C9A44A" />
            {/* room number plate */}
            <mesh position={[x - d.side * 0.05, DOOR.h + 0.5, d.z]} rotation={[0, yaw, 0]}>
              <planeGeometry args={[0.6, 0.3]} />
              <Glow color="#C9A44A" />
            </mesh>
            {k > 0 ? (
              <>
                <mesh position={[x + d.side * 0.02, DOOR.h / 2, d.z]} rotation={[0, yaw, 0]}>
                  <planeGeometry args={[DOOR.w, DOOR.h]} />
                  <Glow color={c} />
                </mesh>
                <PortalRim position={[x - d.side * 0.02, DOOR.h / 2, d.z]} yaw={yaw} w={DOOR.w} h={DOOR.h} t={t} color={c} k={Math.min(1, k * 2)} sparks={18} seed={`cd${i}`} />
                <LightPool position={[x - d.side * 2.1, 0.03, d.z]} yaw={yaw} w={2.6} d={4.2} color={c} opacity={0.5 * Math.min(1, k * 2)} />
              </>
            ) : null}
          </group>
        );
      })}
      {/* end wall with the far door */}
      <WallWithDoor position={[0, 0, z1]} width={w} height={h} color="#24505A" />
      <DoorFrame position={[0, DOOR.h / 2, z1]} color="#F2EEE4" depth={0.4} />
      <DoorLeaf position={[0, DOOR.h / 2, z1 + 0.12]} open={endOpen} toward color="#3A2A22" />
      <pointLight position={[0, 5, -10]} color="#FFE0B0" intensity={14} distance={26} decay={1.5} />
      <pointLight position={[0, 5, -36]} color="#FFE0B0" intensity={14} distance={26} decay={1.5} />
    </group>
  );
};

// ================================================================ New York kitchen (4 AM)

export const FRIDGE = { x: 2.6, w: 2.0, h: 4.3, d: 1.7, opening: { w: 1.7, h: 3.9 } };
/** Fridge opening centre (the portal) and the hinge side. Front face at z = 0.15 + d. */
export const fridgeFront = (): V3 => [FRIDGE.x, 0.3 + FRIDGE.opening.h / 2, 0.15 + FRIDGE.d + 0.01];

export const Fridge: React.FC<{ position: V3; yaw?: number; open?: number; light?: string }> = ({ position, yaw = 0, open = 0, light }) => {
  const { w, h, d, opening } = FRIDGE;
  const body = "#E6EAEE";
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {/* shell around the opening */}
      {box([0, h / 2, -d / 2], [w, h, 0.1], body)}
      {box([-w / 2 + 0.075, h / 2, 0], [0.15, h, d], body, { cast: true })}
      {box([w / 2 - 0.075, h / 2, 0], [0.15, h, d], body, { cast: true })}
      {box([0, 0.15, 0], [w, 0.3, d], body)}
      {box([0, h - 0.1, 0], [w, 0.4, d], body)}
      {box([0, h * 0.5, d / 2 - 0.02], [w - 0.06, 0.06, 0.04], "#C9D0D8", { cast: false })}
      <DoorLeaf position={[0, 0.3 + opening.h / 2, d / 2 + 0.07]} w={w} h={h - 0.1} open={open} toward color={body} kind="fridge" />
      {light ? <Halo position={[0, h / 2, d / 2 + 0.4]} size={5} color={light} opacity={0.35 * Math.min(1, open * 2)} /> : null}
    </group>
  );
};

/** The kitchen: back wall at z = 0 (facing +Z), x from -7 to 7, height 6.2; fridge on the right, sink window on the left. */
export const Kitchen: React.FC<{ t: number; fridgeOpen?: number; lightOn?: boolean }> = ({ t, fridgeOpen = 0, lightOn = true }) => {
  const W = 14;
  const H = 6.2;
  const wx = -3.8;
  const wy = 3.9;
  return (
    <group>
      <CanvasPanel
        position={[0, 0.005, 6]}
        rotation={[-Math.PI / 2, 0, 0]}
        w={W}
        h={12}
        px={256}
        draw={(ctx, Wp, Hp) => {
          const n = 12;
          const s = Wp / n;
          for (let y = 0; y < Hp / s; y++) for (let x = 0; x < n; x++) {
            ctx.fillStyle = (x + y) % 2 ? "#2A2A32" : "#D8D4CA";
            ctx.fillRect(x * s, y * s, s, s);
          }
        }}
        fog={false}
      />
      {box([0, -0.1, 6], [W, 0.2, 12], "#2A2A32", { cast: false })}
      {/* back wall with window */}
      {box([(-W / 2 + (wx - 1.4)) / 2, H / 2, -0.15], [wx - 1.4 + W / 2, H, 0.3], "#E2D6BE", { cast: false })}
      {box([(W / 2 + (wx + 1.4)) / 2, H / 2, -0.15], [W / 2 - wx - 1.4, H, 0.3], "#E2D6BE", { cast: false })}
      {box([wx, (wy - 1.0) / 2, -0.15], [2.8, wy - 1.0, 0.3], "#E2D6BE", { cast: false })}
      {box([wx, (H + wy + 1.0) / 2, -0.15], [2.8, H - wy - 1.0, 0.3], "#E2D6BE", { cast: false })}
      {[
        [wx, wy + 1.0, 3.0, 0.14],
        [wx, wy - 1.0, 3.0, 0.14],
        [wx - 1.4, wy, 0.14, 2.0],
        [wx + 1.4, wy, 0.14, 2.0],
        [wx, wy, 0.08, 2.0],
      ].map(([x, y, ww, hh], i) => box([x, y, 0.02], [ww, hh, 0.14], "#F2EEE4", { key: `kw${i}`, cast: false }))}
      {/* backsplash tiles */}
      <mesh position={[-3.7, 2.7, 0.02]}>
        <planeGeometry args={[6.4, 1.3]} />
        <Flat color="#8FB3C8" />
      </mesh>
      {/* lower cabinets + counter (left run) */}
      {box([-3.75, 1.0, 0.85], [6.4, 2.0, 1.4], "#2E5A6A")}
      {box([-3.75, 2.06, 0.9], [6.6, 0.14, 1.55], "#E8E4DA")}
      {Array.from({ length: 4 }, (_, i) => box([-6.2 + i * 1.62, 1.0, 1.56], [1.5, 1.8, 0.04], "#356A7A", { key: `cd${i}`, cast: false }))}
      {/* upper cabinets either side of the window */}
      {[-6.0, -1.5].map((x) => box([x, 4.6, 0.45], [1.6, 2.0, 0.8], "#2E5A6A", { key: x }))}
      {/* under-cabinet strip light: the only light at 4 AM */}
      {lightOn ? (
        <>
          {glowBox([-6.0, 3.55, 0.6], [1.4, 0.05, 0.1], "#FFE0A8", "ul1")}
          {glowBox([-1.5, 3.55, 0.6], [1.4, 0.05, 0.1], "#FFE0A8", "ul2")}
          <pointLight position={[-3.7, 3.3, 1.6]} color="#FFD0A0" intensity={9} distance={12} decay={1.6} />
        </>
      ) : null}
      {/* sink + tap, kettle, a plant on the sill */}
      {box([wx, 2.08, 0.9], [1.6, 0.06, 1.0], "#9AA1B0", { cast: false })}
      <mesh position={[wx, 2.5, 0.42]} castShadow>
        <CylG args={[0.05, 0.05, 0.8, 6]} />
        <Flat color="#C9D0D8" />
      </mesh>
      <mesh position={[-5.6, 2.45, 0.9]} castShadow>
        <CylG args={[0.3, 0.34, 0.6, 8]} />
        <Flat color="#C8372D" />
      </mesh>
      <mesh position={[wx + 0.9, 3.15, 0.2]} castShadow>
        <IcoG args={[0.3, 1]} />
        <Flat color="#3E7D45" />
      </mesh>
      {/* fridge */}
      <Fridge position={[FRIDGE.x, 0, 0.15 + FRIDGE.d / 2]} open={fridgeOpen} light="#CFE8FF" />
      {/* right wall + calendar */}
      {box([W / 2 + 0.15, H / 2, 6], [0.3, H, 12], "#D8CCB2", { cast: false })}
      {box([-W / 2 - 0.15, H / 2, 6], [0.3, H, 12], "#D8CCB2", { cast: false })}
      <mesh position={[5.4, 3.6, 0.02]}>
        <planeGeometry args={[1.0, 1.4]} />
        <Flat color="#F2EEE4" />
      </mesh>
      {box([0, H + 0.1, 6], [W + 0.6, 0.2, 12], "#EDE6D6", { cast: false })}
      {/* small table */}
      {box([5.0, 1.6, 4.6], [2.4, 0.14, 1.8], "#8A5E3C")}
      {[-1, 1].map((sx) => [-1, 1].map((sz) => box([5.0 + sx * 1.05, 0.8, 4.6 + sz * 0.75], [0.12, 1.6, 0.12], "#6A4A30", { key: `tl${sx}${sz}` })))}
      {/* night city through the window: brick block with a water tower, lit windows */}
      <group position={[-4, 0, -18]} scale={3.2}>
        <Building position={[-2, 0, -1]} w={6} d={4} h={9} color="#6A3A30" seed="nyk1" power={0.9} />
        <Building position={[4, 0, -2]} w={4} d={4} h={12} color={P.bldgNavy} seed="nyk2" power={0.9} />
        <Building position={[-8, 0, -3]} w={4} d={4} h={14} color={P.bldgPurple} seed="nyk3" power={0.8} />
        <group position={[-1, 9, -1]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <CylG args={[0.7, 0.7, 1.2, 10]} />
            <Flat color="#6A4A34" />
          </mesh>
          <mesh position={[0, 2.1, 0]}>
            <ConeG args={[0.8, 0.6, 10]} />
            <Flat color="#4A3424" />
          </mesh>
          {[-0.4, 0.4].map((x) => (
            <mesh key={x} position={[x, 0.3, 0]}>
              <CylG args={[0.04, 0.04, 0.6, 4]} />
              <Flat color="#2A2A30" />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
};

// ================================================================ Tokyo street (evening) + market

const NEON = ["#FF4FA0", "#3FE0FF", "#FFD34F", "#8A5BFF", "#FF6A3A", "#4FFFA0"];
/** Abstract sign glyphs (blocky strokes that read as lettering at a distance, no real text). */
export const drawGlyphSign = (seed: string, bg: string, fg: string, vertical = true, chars = 4) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = fg;
  ctx.lineWidth = Math.min(W, H) * 0.06;
  ctx.lineCap = "square";
  ctx.shadowColor = fg;
  ctx.shadowBlur = 14;
  for (let c = 0; c < chars; c++) {
    const cx = vertical ? W / 2 : (W * (c + 0.5)) / chars;
    const cy = vertical ? (H * (c + 0.5)) / chars : H / 2;
    const s = (vertical ? W : H) * 0.32;
    const strokes = 2 + Math.floor(random(`${seed}n${c}`) * 3);
    for (let k = 0; k < strokes; k++) {
      const r = (q: string) => random(`${seed}${c}${k}${q}`) - 0.5;
      ctx.beginPath();
      const horiz = random(`${seed}${c}${k}h`) > 0.5;
      const x0 = cx + r("x") * s;
      const y0 = cy + r("y") * s;
      ctx.moveTo(horiz ? cx - s * 0.8 : x0, horiz ? y0 : cy - s * 0.8);
      ctx.lineTo(horiz ? cx + s * 0.8 : x0 + r("t") * s * 0.4, horiz ? y0 + r("t") * s * 0.2 : cy + s * 0.8);
      ctx.stroke();
    }
  }
};

/** A shopfront block with lit upper windows and signs; front at local z = 0 facing +Z. */
const TokyoBlock: React.FC<{ position: V3; yaw?: number; w: number; h: number; seed: string; t: number }> = ({ position, yaw = 0, w, h, seed, t }) => {
  const c = ["#3A3F55", "#4A3A4E", "#2E3E4A", "#5A5560", "#3E4A42"][Math.floor(random(`${seed}c`) * 5)];
  const floors = Math.floor((h - 7) / 5.2);
  const neon = NEON[Math.floor(random(`${seed}n`) * NEON.length)];
  const neon2 = NEON[Math.floor(random(`${seed}n2`) * NEON.length)];
  const flick = 0.85 + Math.sin(t * 11 + random(seed) * 9) * 0.15;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {box([0, h / 2, -6], [w, h, 12], c)}
      {/* ground floor shop glow */}
      <mesh position={[0, 3, 0.02]}>
        <planeGeometry args={[w - 1, 5]} />
        <Glow color={random(`${seed}g`) < 0.5 ? "#F4E6C8" : "#E8D4F0"} />
      </mesh>
      {box([0, 6.0, 0.6], [w, 0.4, 1.2], "#22242E")}
      <CanvasPanel position={[0, 6.9, 0.9]} w={w * 0.8} h={1.3} px={512} draw={drawGlyphSign(`${seed}h`, "#14141C", neon2, false, 5)} />
      {/* upper windows */}
      {Array.from({ length: floors }, (_, f) =>
        Array.from({ length: Math.max(1, Math.floor(w / 4)) }, (_, k) => {
          const on = random(`${seed}w${f}${k}`) < 0.6;
          const x = -w / 2 + 2 + k * ((w - 4) / Math.max(1, Math.floor(w / 4) - 1 || 1));
          return (
            <mesh key={`${f}${k}`} position={[Math.floor(w / 4) > 1 ? x : 0, 9.6 + f * 5.2, 0.02]}>
              <planeGeometry args={[2.4, 2.6]} />
              {on ? <Glow color={random(`${seed}wc${f}${k}`) < 0.5 ? "#F2D49A" : "#BFE0FF"} /> : <Flat color="#22283A" />}
            </mesh>
          );
        }),
      )}
      {/* vertical blade sign sticking out over the street */}
      <group position={[w / 2 - 1.2, 8 + h * 0.25, 1.8]} rotation={[0, Math.PI / 2, 0]}>
        {box([0, 0, 0], [3.4, Math.min(16, h * 0.55), 0.4], "#101018")}
        <CanvasPanel position={[0, 0, 0.21]} w={3} h={Math.min(16, h * 0.55) - 0.4} px={256} draw={drawGlyphSign(`${seed}v`, "#101018", neon, true, 4)} />
        <CanvasPanel position={[0, 0, -0.21]} rotation={[0, Math.PI, 0]} w={3} h={Math.min(16, h * 0.55) - 0.4} px={256} draw={drawGlyphSign(`${seed}v`, "#101018", neon, true, 4)} />
        <Halo position={[0, 0, 1.2]} size={9} color={neon} opacity={0.4 * flick} />
      </group>
      {/* AC units */}
      {Array.from({ length: Math.max(1, floors - 1) }, (_, f) => box([-w / 2 + 1.5, 11 + f * 5.2, 0.5], [1.4, 1.0, 1.0], "#C9CCD4", { key: `ac${f}` }))}
    </group>
  );
};

/** The market: bright glass front, a teal/amber stripe band, glass sliding doors (opening centre x = 0). Front at z = 0 facing +Z. */
export const MARKET = { w: 16, h: 8, doorW: 4.4, doorH: 5.2 };
export const Market: React.FC<{ position: V3; yaw?: number; slide?: number }> = ({ position, yaw = 0, slide = 0 }) => {
  const { w, h, doorW, doorH } = MARKET;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {box([0, h / 2, -8], [w, h, 16], "#E8E8EC")}
      {box([0, h + 6, -8], [w, 12, 16], "#4A4A58")}
      {/* interior: white glow behind glass with shelf silhouettes */}
      <mesh position={[0, 3, -0.3]}>
        <planeGeometry args={[w - 0.6, 6]} />
        <Glow color="#F8FAFF" />
      </mesh>
      {[-5.5, -2.5, 2.5, 5.5].map((x) => box([x, 2.0, -1.0], [1.8, 3.6, 0.5], ["#E86A5A", "#5AA0E8", "#F2C43D", "#6AC87A"][Math.abs(x) % 4 > 2 ? 0 : 1], { key: x, cast: false }))}
      {/* stripes and the sign */}
      {box([0, 6.4, 0.15], [w, 0.5, 0.3], "#2AA6A0")}
      {box([0, 6.95, 0.15], [w, 0.5, 0.3], "#F2B33D")}
      {box([0, 7.5, 0.15], [w, 0.4, 0.3], "#E8862A")}
      <CanvasPanel
        position={[0, 9.4, 0.12]}
        w={9}
        h={2.4}
        px={768}
        draw={(ctx, W, H) => {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, W, H);
          fitText(ctx, "MARKET 24", W / 2, H / 2 + H * 0.04, W * 0.9, H * 0.62, "#1E7A76");
        }}
      />
      <Halo position={[0, 9.4, 1]} size={14} color="#FFFFFF" opacity={0.25} />
      {/* glass panels + the sliding doors */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (doorW / 2 + (w / 2 - doorW / 2) / 2), 3, 0.05]}>
          <boxGeometry args={[w / 2 - doorW / 2, 6, 0.08]} />
          <meshLambertMaterial color="#CFE6F4" transparent opacity={0.25} depthWrite={false} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`d${s}`} position={[s * (doorW / 4 + slide * doorW * 0.5), doorH / 2, 0.15]}>
          <boxGeometry args={[doorW / 2, doorH, 0.08]} />
          <meshLambertMaterial color="#CFE6F4" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
      {box([0, doorH + 0.2, 0.15], [doorW + 0.4, 0.4, 0.3], "#9AA1B0")}
      {/* light spill on the pavement */}
      <LightPool position={[0, 0.27, 3]} w={w} d={6} color="#F0F6FF" opacity={0.3} />
    </group>
  );
};

/** A narrow evening street in a Japanese-style city: road along -Z, blocks both sides, lanterns, wires. */
export const NeonStreet: React.FC<{ t: number; marketSlide?: number }> = ({ t, marketSlide = 0 }) => (
  <group>
    {box([0, -0.1, -20], [80, 0.2, 140], "#2A2C38", { cast: false })}
    {box([0, 0.02, -20], [12, 0.1, 140], "#30323E", { cast: false })}
    {[-1, 1].map((s) => box([s * 8.5, 0.12, -20], [5, 0.24, 140], "#4A4C58", { key: s, cast: false }))}
    {Array.from({ length: 12 }, (_, i) => (
      <mesh key={i} position={[0, 0.08, 20 - i * 9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.25, 3]} />
        <Flat color="#E8E4DA" />
      </mesh>
    ))}
    {/* left side blocks (fronts face +X) */}
    {[
      [20, 14, 26],
      [6, 12, 34],
      [-8, 16, 22],
      [-24, 14, 38],
      [-40, 18, 28],
      [-58, 16, 44],
    ].map(([z, w, h], i) => (
      <TokyoBlock key={`L${i}`} position={[-11, 0, z]} yaw={Math.PI / 2} w={w} h={h} seed={`tkL${i}`} t={t} />
    ))}
    {/* right side: market + blocks (fronts face -X) */}
    <Market position={[11, 0, -8]} yaw={-Math.PI / 2} slide={marketSlide} />
    {[
      [14, 12, 30],
      [-26, 18, 24],
      [-44, 14, 36],
      [-62, 16, 30],
    ].map(([z, w, h], i) => (
      <TokyoBlock key={`R${i}`} position={[11, 0, z]} yaw={-Math.PI / 2} w={w} h={h} seed={`tkR${i}`} t={t} />
    ))}
    {/* vending machines by the market */}
    {[4.5, 6.6].map((z, i) => (
      <group key={z} position={[9.6, 0, z]}>
        {box([0, 2.0, 0], [1.4, 4.0, 1.9], i ? "#C8372D" : "#2E6AB8")}
        <mesh position={[-0.72, 2.4, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[1.6, 2.2]} />
          <Glow color="#E8F4FF" />
        </mesh>
        <Halo position={[-1.2, 2.4, 0]} size={3.5} color="#E8F4FF" opacity={0.3} />
      </group>
    ))}
    {/* lantern strings across the street */}
    {[-2, -18, -34].map((z, j) => (
      <group key={z}>
        <mesh position={[0, 12.5, z]} rotation={[0, 0, Math.PI / 2]}>
          <CylG args={[0.03, 0.03, 22, 4]} />
          <Flat color="#1A1A22" />
        </mesh>
        {Array.from({ length: 7 }, (_, i) => (
          <group key={i} position={[-9 + i * 3, 11.6 + Math.sin(i * 0.9 + j) * 0.2, z]}>
            <mesh scale={[1, 1.3, 1]}>
              <IcoG args={[0.5, 1]} />
              <Glow color={i % 2 ? "#FF5A3A" : "#FFB04A"} />
            </mesh>
            <Halo size={2.2} color="#FF7A3A" opacity={0.5} />
          </group>
        ))}
      </group>
    ))}
    {/* utility poles + wires */}
    {[-1, 1].map((s) =>
      [10, -14, -38].map((z) => (
        <group key={`${s}${z}`}>
          <mesh position={[s * 9.6, 9, z]} castShadow>
            <CylG args={[0.22, 0.28, 18, 6]} />
            <Flat color="#5A5E68" />
          </mesh>
          {box([s * 9.6, 16.5, z], [0.3, 0.3, 2.4], "#3A3E48")}
        </group>
      )),
    )}
    {[15.6, 16.8].map((y) => (
      <React.Fragment key={y}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 9.6, y, -14]} rotation={[Math.PI / 2, 0, 0]}>
            <CylG args={[0.03, 0.03, 48, 3]} />
            <Flat color="#15151C" />
          </mesh>
        ))}
      </React.Fragment>
    ))}
    <pointLight position={[0, 8, -6]} color="#FF8AC0" intensity={18} distance={30} decay={1.4} />
    <pointLight position={[0, 8, -30]} color="#7AD8FF" intensity={18} distance={30} decay={1.4} />
  </group>
);

/** Supermarket aisles (bright, white), the inner world behind the oval-room door. Aisles run along -Z from the anchor. */
export const Aisles: React.FC<{ at: V3; yaw?: number }> = ({ at, yaw = 0 }) => {
  const prodCols = ["#E86A5A", "#5AA0E8", "#F2C43D", "#6AC87A", "#E8862A", "#B88AE8", "#F2EEE4"];
  return (
    <group position={at} rotation={[0, yaw, 0]}>
      {box([0, -0.1, -20], [40, 0.2, 44], "#E4E6EA", { cast: false })}
      {box([0, 9.5, -20], [40, 0.3, 44], "#F4F6F8", { cast: false })}
      {Array.from({ length: 6 }, (_, i) => glowBox([0, 9.3, -4 - i * 6], [8, 0.08, 0.6], "#FFFFFF", `al${i}`))}
      {[-5, 5, -13, 13].map((x) => (
        <group key={x}>
          {box([x, 2.6, -18], [1.6, 5.2, 28], "#D8DCE2")}
          {[0.9, 2.1, 3.3, 4.5].map((y, r) =>
            Array.from({ length: 12 }, (_, k) => (
              <mesh key={`${r}${k}`} position={[x + (x < 0 ? 0.9 : -0.9), y, -6 - k * 2.2]}>
                <BoxG args={[0.3, 0.8, 1.8]} />
                <Flat color={prodCols[Math.floor(random(`pr${x}${r}${k}`) * prodCols.length)]} />
              </mesh>
            )),
          )}
        </group>
      ))}
      {box([0, 5, -40], [40, 10, 0.3], "#F4F6F8", { cast: false })}
    </group>
  );
};

// ================================================================ oval room + white mansion (generic)

export const OVAL = { a: 11, b: 8, h: 7.6, doorTheta: (-150 * Math.PI) / 180 };
export const ovalPoint = (theta: number, inset = 0): V3 => [(OVAL.a - inset) * Math.cos(theta), 0, (OVAL.b - inset) * Math.sin(theta)];
/** Door pose in the oval wall (centre of the opening, yaw facing the room centre). */
export const ovalDoor = (): { pos: V3; yaw: number } => {
  const th = OVAL.doorTheta;
  const p = ovalPoint(th, 0.05);
  // inward normal of the ellipse at theta
  const nx = -Math.cos(th) / OVAL.a;
  const nz = -Math.sin(th) / OVAL.b;
  return { pos: [p[0], DOOR.h / 2, p[2]], yaw: Math.atan2(nx, nz) };
};

/** An oval reception room at night (generic: no seal, no flags). */
export const OvalRoom: React.FC<{ t: number; doorOpen?: number }> = ({ t, doorOpen = 0 }) => {
  const N = 44;
  const windows = [-70, -90, -110].map((d) => (d * Math.PI) / 180);
  const door = ovalDoor();
  return (
    <group>
      {box([0, -0.1, 0], [30, 0.2, 24], "#7A5232", { cast: false })}
      {/* rug: navy oval with a gold ring */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[OVAL.a * 0.72, OVAL.b * 0.72, 1]} receiveShadow>
        <circleGeometry args={[1, 48]} />
        <Flat color="#1E2A5A" />
      </mesh>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[OVAL.a * 0.66, OVAL.b * 0.66, 1]}>
        <ringGeometry args={[0.92, 1, 48]} />
        <Flat color="#C9A44A" />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.2, 2.2, 1]}>
        <ringGeometry args={[0.8, 1, 32]} />
        <Flat color="#C9A44A" />
      </mesh>
      {/* curved wall segments (skipping the door and windows) */}
      {Array.from({ length: N }, (_, i) => {
        const th = (i / N) * Math.PI * 2 - Math.PI;
        const th2 = ((i + 1) / N) * Math.PI * 2 - Math.PI;
        const mid = (th + th2) / 2;
        const near = (a: number) => Math.abs(Math.atan2(Math.sin(mid - a), Math.cos(mid - a))) < Math.PI / N + 0.05;
        const isDoor = near(OVAL.doorTheta);
        const isWin = windows.some(near);
        const p1 = ovalPoint(th);
        const p2 = ovalPoint(th2);
        const len = Math.hypot(p2[0] - p1[0], p2[2] - p1[2]) + 0.05;
        const ang = Math.atan2(p2[2] - p1[2], p2[0] - p1[0]);
        const c: V3 = [(p1[0] + p2[0]) / 2, 0, (p1[2] + p2[2]) / 2];
        if (isDoor) return null;
        return (
          <group key={i} position={c} rotation={[0, -ang, 0]}>
            {isWin ? (
              <>
                {box([0, 0.9, 0], [len, 1.8, 0.4], "#EDE4CF", { cast: false })}
                {box([0, OVAL.h - 0.6, 0], [len, 1.2, 0.4], "#EDE4CF", { cast: false })}
                <mesh position={[0, 4.0, 0]}>
                  <planeGeometry args={[len - 0.1, 4.4]} />
                  <Glow color="#101A36" />
                </mesh>
              </>
            ) : (
              box([0, OVAL.h / 2, 0], [len, OVAL.h, 0.4], "#EDE4CF", { cast: false })
            )}
            {box([0, 0.2, 0], [len, 0.4, 0.5], "#F6F0E0", { cast: false })}
            {box([0, OVAL.h - 0.25, 0], [len, 0.5, 0.55], "#F6F0E0", { cast: false })}
          </group>
        );
      })}
      {/* door in the curved wall */}
      <DoorFrame position={door.pos} yaw={door.yaw} color="#F6F0E0" depth={0.5} />
      <mesh position={[door.pos[0], DOOR.h + (OVAL.h - DOOR.h) / 2, door.pos[2]]} rotation={[0, door.yaw, 0]}>
        <BoxG args={[DOOR.w + 0.5, OVAL.h - DOOR.h, 0.42]} />
        <Flat color="#EDE4CF" />
      </mesh>
      <DoorLeaf position={door.pos} yaw={door.yaw} open={doorOpen} toward color="#EDE4CF" knob="#C9A44A" />
      {/* curtains by the windows */}
      {windows.flatMap((w, i) =>
        [-0.07, 0.07].map((d) => {
          const p = ovalPoint(w + d * 1.4, 0.4);
          return box([p[0], 4.0, p[2]], [0.9, 5.2, 0.3], "#B8923A", { key: `cu${i}${d}` });
        }),
      )}
      {/* desk + chair */}
      <group position={[0, 0, -4.6]}>
        {box([0, 1.45, 0], [6.4, 0.24, 2.8], "#5A3A22")}
        {box([0, 0.7, 1.2], [6.2, 1.4, 0.3], "#6A4428")}
        {[-2.2, 2.2].map((x) => box([x, 0.7, 0], [1.7, 1.4, 2.6], "#6A4428", { key: x }))}
        {[-2.2, 0, 2.2].map((x) => box([x, 0.7, 1.37], [1.2, 0.9, 0.06], "#7A5232", { key: `p${x}`, cast: false }))}
        {box([0, 1.9, -2.0], [1.6, 2.6, 0.4], "#3A2A22")}
        {box([0, 1.0, -1.6], [1.6, 0.3, 1.2], "#3A2A22")}
        <mesh position={[1.8, 1.7, 0.4]}>
          <CylG args={[0.12, 0.16, 0.3, 8]} />
          <Flat color="#C9A44A" />
        </mesh>
      </group>
      {/* sofas facing each other + coffee table */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 3.8, 0, 1.6]} rotation={[0, (-s * Math.PI) / 2, 0]}>
          {box([0, 0.7, 0], [4.4, 1.2, 1.6], "#E8DCC0")}
          {box([0, 1.6, -0.65], [4.4, 1.4, 0.4], "#E8DCC0")}
          {[-1, 1].map((a) => box([a * 2.1, 1.25, 0], [0.4, 0.9, 1.6], "#DCCFB0", { key: a }))}
        </group>
      ))}
      {box([0, 0.8, 1.6], [2.6, 0.16, 1.6], "#5A3A22")}
      {[-1, 1].map((sx) => [-1, 1].map((sz) => box([sx * 1.1, 0.36, 1.6 + sz * 0.6], [0.14, 0.72, 0.14], "#4A2E1A", { key: `ct${sx}${sz}` })))}
      {/* lamps + a ceiling glow */}
      {[-1, 1].map((s) => (
        <group key={`lmp${s}`} position={[s * 6.2, 0, -3.2]}>
          {box([0, 1.0, 0], [0.8, 2.0, 0.8], "#5A3A22")}
          <mesh position={[0, 2.7, 0]}>
            <ConeG args={[0.6, 0.8, 10, 1, true]} />
            <Glow color="#FFE6B8" opacity={0.95} />
          </mesh>
          <Halo position={[0, 2.7, 0]} size={3.6} color="#FFD890" opacity={0.5} />
          <pointLight position={[0, 3.2, 0.6]} color="#FFD8A0" intensity={9} distance={14} decay={1.6} />
        </group>
      ))}
      <mesh position={[0, OVAL.h + 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[OVAL.a, OVAL.b, 1]}>
        <circleGeometry args={[1, 48]} />
        <Flat color="#F6F0E0" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, OVAL.h - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[3, 2.2, 1]}>
        <circleGeometry args={[1, 32]} />
        <Glow color="#FFF2D8" opacity={0.6} />
      </mesh>
      <pointLight position={[0, OVAL.h - 1, 0]} color="#FFE8C0" intensity={12} distance={20} decay={1.4} />
    </group>
  );
};

/** A generic white neoclassical mansion at night: portico with six columns, lit windows, lawn, fountain. Front faces +Z. */
export const WhiteMansion: React.FC<{ t: number; flash?: number }> = ({ t, flash = 0 }) => {
  const white = "#EEEAE0";
  const shade = "#D8D2C4";
  return (
    <group>
      {box([0, -0.2, 40], [400, 0.4, 260], "#2E5A3A", { cast: false })}
      {/* main block + wings */}
      {box([0, 13, -15], [64, 26, 30], white)}
      {[-1, 1].map((s) => box([s * 50, 8, -10], [36, 16, 22], shade, { key: s }))}
      {/* windows */}
      {[5, 12.5, 20].map((y, f) =>
        Array.from({ length: 8 }, (_, i) => {
          const x = -28 + i * 8;
          if (Math.abs(x) < 13 && f < 2) return null;
          const lit = random(`wm${f}${i}`) < 0.55;
          const isFlash = f === 0 && i === 6;
          return (
            <group key={`${f}${i}`} position={[x, y, 0.05]}>
              {box([0, 0, 0], [2.8, 4.4, 0.2], "#F6F2E8", { cast: false })}
              <mesh position={[0, 0, 0.12]}>
                <planeGeometry args={[2.2, 3.8]} />
                {isFlash && flash > 0 ? <Glow color={new THREE.Color("#F2D49A").lerp(new THREE.Color("#E8D8FF"), flash).getStyle()} /> : lit ? <Glow color="#F2D49A" /> : <Flat color="#2A3450" />}
              </mesh>
              {isFlash && flash > 0 ? <Halo position={[0, 0, 1]} size={10 + flash * 14} color="#C8A8FF" opacity={0.7 * flash} /> : null}
            </group>
          );
        }),
      )}
      {[-1, 1].map((s) =>
        Array.from({ length: 4 }, (_, i) => (
          <group key={`ww${s}${i}`} position={[s * (38 + i * 7.5), 7, 1.05]}>
            <mesh>
              <planeGeometry args={[2.2, 4]} />
              {random(`wwl${s}${i}`) < 0.5 ? <Glow color="#F2D49A" /> : <Flat color="#2A3450" />}
            </mesh>
          </group>
        )),
      )}
      {/* portico */}
      {box([0, 0.6, 7], [30, 1.2, 14], shade)}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={`col${i}`} position={[-12.5 + i * 5, 10.2, 12]} castShadow>
          <CylG args={[1.0, 1.15, 18, 12]} />
          <Flat color={white} />
        </mesh>
      ))}
      {box([0, 19.8, 7], [32, 1.6, 14], white)}
      <mesh position={[0, 23.2, 13.6]} rotation={[0, 0, 0]} castShadow>
        <shapeGeometry args={[new THREE.Shape([new THREE.Vector2(-16, 0), new THREE.Vector2(16, 0), new THREE.Vector2(0, 5.2)])]} />
        <Flat color={white} side={THREE.DoubleSide} />
      </mesh>
      {box([0, 22.6, 7], [32, 0.4, 13], shade)}
      {/* roof balustrade */}
      {Array.from({ length: 30 }, (_, i) => box([-31 + i * 2.15, 26.8, 0.2], [0.5, 1.6, 0.5], white, { key: `bal${i}` }))}
      {box([0, 27.7, 0.2], [64, 0.3, 0.8], white)}
      {/* lit doorway under the portico */}
      <mesh position={[0, 4, 0.1]}>
        <planeGeometry args={[4, 6.4]} />
        <Glow color="#F8DCA0" />
      </mesh>
      {/* floodlights washing the facade */}
      {[-24, -12, 12, 24].map((x) => (
        <group key={`fl${x}`}>
          <Halo position={[x, 2, 8]} size={22} color="#FFF0D0" opacity={0.28} />
        </group>
      ))}
      <pointLight position={[0, 6, 30]} color="#FFF0D8" intensity={60} distance={90} decay={1.2} />
      {/* driveway, fountain, hedges, fence */}
      <mesh position={[0, 0.02, 34]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[14, 19, 48]} />
        <Flat color="#C9C2B4" />
      </mesh>
      <mesh position={[0, 0.8, 34]}>
        <CylG args={[6, 6.4, 1.6, 24]} />
        <Flat color="#D8D2C4" />
      </mesh>
      <mesh position={[0, 1.62, 34]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.6, 24]} />
        <Glow color="#4A8AC8" />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const k = ((t * 0.8 + i / 5) % 1);
        return (
          <mesh key={`jet${i}`} position={[0, 2 + k * 4, 34]}>
            <IcoG args={[0.4 + k * 0.6, 1]} />
            <meshBasicMaterial color="#DCEEFF" transparent opacity={0.6 * (1 - k)} depthWrite={false} />
          </mesh>
        );
      })}
      <Halo position={[0, 3, 34]} size={14} color="#8FC8FF" opacity={0.3} />
      {[-1, 1].map((s) => box([s * 24, 1.0, 16], [14, 2, 2.4], "#2A5A34", { key: `hd${s}` }))}
      {Array.from({ length: 60 }, (_, i) => (
        <mesh key={`fn${i}`} position={[-90 + i * 3, 2.6, 80]} castShadow>
          <CylG args={[0.08, 0.08, 5.2, 4]} />
          <Flat color="#1A1A22" />
        </mesh>
      ))}
      {box([0, 5.2, 80], [180, 0.2, 0.2], "#1A1A22")}
      {/* trees framing the lawn */}
      {[-60, -44, 44, 60].map((x, i) => (
        <group key={`tr${x}`} position={[x, 0, 30 + (i % 2) * 14]}>
          <mesh position={[0, 4, 0]} castShadow>
            <CylG args={[0.6, 0.8, 8, 6]} />
            <Flat color={P.bark} />
          </mesh>
          <mesh position={[0, 11, 0]} castShadow>
            <IcoG args={[6, 1]} />
            <Flat color="#1F4A30" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// ================================================================ midday broadcast

export const drawStopOrder = (t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0B0E18";
  ctx.fillRect(0, 0, W, H);
  const blink = Math.floor(t * 2.5) % 2 === 0;
  ctx.fillStyle = blink ? "#D8342A" : "#A8261E";
  ctx.fillRect(0, 0, W, H * 0.2);
  fitText(ctx, "EMERGENCY ORDER", W / 2, H * 0.105, W * 0.86, H * 0.12, "#FFFFFF");
  // the crossed-out door
  const dw = H * 0.26;
  const dh = H * 0.42;
  const cx = W * 0.22;
  const cy = H * 0.58;
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = H * 0.02;
  ctx.strokeRect(cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(cx + dw * 0.28, cy, H * 0.018, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#FF4A3A";
  ctx.lineWidth = H * 0.035;
  ctx.beginPath();
  ctx.arc(cx, cy, H * 0.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - H * 0.21, cy - H * 0.21);
  ctx.lineTo(cx + H * 0.21, cy + H * 0.21);
  ctx.stroke();
  ctx.textAlign = "left";
  fitText(ctx, "STOP OPENING", W * 0.69, H * 0.47, W * 0.56, H * 0.14, "#FFFFFF");
  fitText(ctx, "DOORS", W * 0.69, H * 0.66, W * 0.56, H * 0.17, "#FFBA58");
  fitText(ctx, "STAY WHERE YOU ARE", W * 0.69, H * 0.82, W * 0.56, H * 0.06, "#C9D2DE", false);
};

/** A plaza at midday: a big public screen on a building (centre BIGSCREEN.c), towers around. */
export const BIGSCREEN = { c: [0, 22, -29.6] as V3, w: 27, h: 15.2 };
export const Plaza: React.FC<{ t: number }> = ({ t }) => (
  <group>
    {box([0, -0.1, 0], [300, 0.2, 300], "#B8B2A4", { cast: false })}
    {Array.from({ length: 10 }, (_, i) => (
      <mesh key={i} position={[0, 0.01, 30 - i * 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 0.2]} />
        <Flat color="#9A9488" />
      </mesh>
    ))}
    {box([0, 22, -46], [48, 44, 32], P.bldgSlate)}
    {box([BIGSCREEN.c[0], BIGSCREEN.c[1], -29.9], [BIGSCREEN.w + 1.6, BIGSCREEN.h + 1.6, 0.6], "#15161C")}
    <CanvasPanel position={BIGSCREEN.c} w={BIGSCREEN.w} h={BIGSCREEN.h} px={1024} draw={drawStopOrder(t)} />
    <Halo position={[BIGSCREEN.c[0], BIGSCREEN.c[1], BIGSCREEN.c[2] + 3]} size={50} color="#FF6A5A" opacity={0.18} />
    <group scale={5}>
      <Building position={[-11, 0, -6]} w={5} d={5} h={12} color={P.bldgNavy} seed="pz1" power={0.3} />
      <Building position={[11, 0, -7]} w={5} d={5} h={14} color={P.bldgTeal} seed="pz2" power={0.3} />
      <Building position={[-14, 0, 3]} w={4} d={5} h={8} color={P.bldgPurple} seed="pz3" power={0.3} />
      <Building position={[14, 0, 2]} w={4} d={5} h={9} color={P.bldgSlate} seed="pz4" power={0.3} />
    </group>
    {/* trees in planters */}
    {[-14, 14].map((x) => (
      <group key={x} position={[x, 0, 6]}>
        {box([0, 0.6, 0], [3, 1.2, 3], "#8A8478")}
        <mesh position={[0, 3, 0]} castShadow>
          <CylG args={[0.25, 0.3, 4, 6]} />
          <Flat color={P.bark} />
        </mesh>
        <mesh position={[0, 6, 0]} castShadow>
          <IcoG args={[2.6, 1]} />
          <Flat color={P.leaf} />
        </mesh>
      </group>
    ))}
  </group>
);

// ================================================================ hospital

export const HOSP = { w: 10, h: 6.6, endZ: -22, doorW: DOOR.w * 2, doorH: 5.0 };
export const Hospital: React.FC<{ open?: number; glow?: number; t: number }> = ({ open = 0, glow = 0, t }) => {
  const { w, h, endZ, doorW, doorH } = HOSP;
  return (
    <group>
      {box([0, -0.1, -4], [w, 0.2, 40], "#C9D4DC", { cast: false })}
      <mesh position={[-1.5, 0.01, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.35, 36]} />
        <Flat color="#2AA6A0" />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          {box([(s * w) / 2 + s * 0.15, h / 2, -4], [0.3, h, 40], "#DCEAE4", { cast: false })}
          {box([(s * w) / 2 - s * 0.02, 0.6, -4], [0.06, 1.2, 40], "#3E8E8A", { cast: false })}
          {box([(s * w) / 2 - s * 0.18, 2.1, -4], [0.12, 0.12, 40], "#C9D0D8", { cast: false })}
        </group>
      ))}
      {box([0, h + 0.1, -4], [w + 0.6, 0.2, 40], "#F2F4F6", { cast: false })}
      {Array.from({ length: 5 }, (_, i) => glowBox([0, h - 0.02, 10 - i * 7], [3.4, 0.06, 0.7], "#F4FAFF", `hl${i}`))}
      {/* end wall + double doors */}
      <WallWithDoor position={[0, 0, endZ]} width={w} height={h} holeW={doorW} holeH={doorH} color="#DCEAE4" />
      {box([0, doorH + 0.15, endZ + 0.2], [doorW + 0.4, 0.3, 0.5], "#C9D0D8")}
      {[-1, 1].map((s) => box([s * (doorW / 2 + 0.15), doorH / 2, endZ + 0.2], [0.3, doorH, 0.5], "#C9D0D8", { key: `dj${s}` }))}
      <DoorLeaf position={[-doorW / 4, doorH / 2, endZ + 0.2]} w={doorW / 2} h={doorH} open={open} toward color="#E8EEF2" kind="flat" window={glow > 0 ? "#DCEEFF" : "#5A6A7A"} />
      <group position={[doorW / 4, doorH / 2, endZ + 0.2]} rotation={[0, Math.PI, 0]}>
        <DoorLeaf position={[0, 0, 0]} w={doorW / 2} h={doorH} open={open} color="#E8EEF2" kind="flat" window={glow > 0 ? "#DCEEFF" : "#5A6A7A"} />
      </group>
      <CanvasPanel
        position={[0, doorH + 0.95, endZ + 0.16]}
        w={6.4}
        h={1.0}
        px={768}
        draw={(ctx, W, H) => {
          ctx.fillStyle = "#1E4A6A";
          ctx.fillRect(0, 0, W, H);
          fitText(ctx, "OPERATING THEATRE", W / 2, H / 2 + H * 0.03, W * 0.92, H * 0.6, "#FFFFFF");
        }}
      />
      {/* gurney */}
      <group position={[3.0, 0, -8]}>
        {box([0, 1.7, 0], [2.0, 0.3, 5.0], "#C9D0D8")}
        {box([0, 2.0, 0.3], [1.9, 0.3, 4.2], "#F2F4F6")}
        {[-1, 1].map((sx) => [-1, 1].map((sz) => box([sx * 0.85, 0.85, sz * 2.2], [0.1, 1.7, 0.1], "#9AA1B0", { key: `g${sx}${sz}` })))}
      </group>
      {glow > 0 ? <LightPool position={[0, 0.02, endZ + 3]} w={doorW + 0.6} d={5} color="#DCEEFF" opacity={0.4 * glow} /> : null}
      <pointLight position={[0, 5.4, -6]} color="#F0F8FF" intensity={16} distance={30} decay={1.4} />
    </group>
  );
};

// ================================================================ prison

export const CELL = { x: 3.2, doorZ: -6, w: 7, depth: 7, h: 6 };
/** A cell block corridor along -Z; barred cell fronts on the right (x = 3.2). The cell door at z = -6 (opening facing -X). */
export const CellBlock: React.FC<{ open?: number; t: number }> = ({ open = 0, t }) => {
  const { x, h } = CELL;
  return (
    <group>
      {box([0, -0.1, -8], [24, 0.2, 40], "#6A6E74", { cast: false })}
      {box([-4.6, h / 2, -8], [0.3, h, 40], "#8E9298", { cast: false })}
      {box([0, h + 0.1, -8], [24, 0.2, 40], "#5A5E66", { cast: false })}
      {Array.from({ length: 4 }, (_, i) => glowBox([0, h - 0.04, 6 - i * 8], [0.5, 0.06, 3.4], "#E8F4FF", `pl${i}`))}
      {/* barred fronts with the cell door gap */}
      {Array.from({ length: 34 }, (_, i) => {
        const z = 10 - i * 0.75;
        if (Math.abs(z - CELL.doorZ) < DOOR.w / 2 + 0.1) return null;
        return (
          <mesh key={`b${i}`} position={[x, h / 2, z]} castShadow>
            <CylG args={[0.06, 0.06, h, 6]} />
            <Flat color="#4A4E58" />
          </mesh>
        );
      })}
      {box([x, h - 0.2, -8], [0.2, 0.4, 40], "#4A4E58")}
      {box([x, 0.2, -8], [0.2, 0.4, 40], "#4A4E58")}
      {/* cell walls dividing */}
      {[-2.5, -9.5, 3.5].map((z) => box([x + 3.5, h / 2, z], [7, h, 0.3], "#8E9298", { key: z, cast: false }))}
      {box([x + 7, h / 2, -8], [0.3, h, 40], "#8E9298", { cast: false })}
      {/* bunk + sink inside the door's cell */}
      {box([x + 5.4, 1.2, -6], [2.4, 0.3, 5.2], "#5A6A7A")}
      {box([x + 5.4, 1.45, -6], [2.2, 0.2, 5.0], "#C9C2B4")}
      <DoorLeaf position={[x, DOOR.h / 2, CELL.doorZ]} yaw={-Math.PI / 2} open={open} toward kind="bars" color="#4A4E58" />
      <pointLight position={[0, 5, -6]} color="#DDE8FF" intensity={12} distance={24} decay={1.5} />
    </group>
  );
};

/** The cell seen from the beach side (a barred door frame + the grey cell behind, for a Portal inner world). */
export const CellInterior: React.FC = () => (
  <group>
    {box([0, -0.1, -3.5], [8, 0.2, 8], "#6A6E74", { cast: false })}
    {box([0, 3, -7.5], [8, 6, 0.3], "#8E9298", { cast: false })}
    {[-1, 1].map((s) => box([s * 3.6, 3, -3.5], [0.3, 6, 8], "#8E9298", { key: s, cast: false }))}
    {box([0, 6.1, -3.5], [8, 0.2, 8], "#5A5E66", { cast: false })}
    {box([2.0, 1.2, -5.6], [3.0, 0.3, 2.6], "#5A6A7A")}
    {box([2.0, 1.45, -5.6], [2.8, 0.2, 2.4], "#C9C2B4")}
    {box([-2.6, 4.2, -7.3], [1.4, 1.0, 0.1], "#BFE3FF")}
    {Array.from({ length: 4 }, (_, i) => box([-3.0 + i * 0.28, 4.2, -7.25], [0.06, 1.0, 0.06], "#4A4E58", { key: i }))}
    {glowBox([0, 6.0, -3.5], [0.5, 0.06, 2.4], "#E8F4FF")}
    <pointLight position={[0, 5, -3]} color="#DDE8FF" intensity={10} distance={12} decay={1.5} />
  </group>
);

// ================================================================ the day-two lab

export const RIG = { door: [0, 1.0 + DOOR.h / 2, -2] as V3 };
export const DoorLab: React.FC<{ t: number; open?: number }> = ({ t, open = 0 }) => (
  <group>
    {box([0, -0.1, 0], [40, 0.2, 34], "#D8DCE2", { cast: false })}
    {box([0, 6, -14], [40, 12, 0.3], "#EEF0F2", { cast: false })}
    {Array.from({ length: 6 }, (_, i) => (
      <mesh key={i} position={[-15 + i * 6, 7.2, -13.8]}>
        <planeGeometry args={[5.4, 5]} />
        <Glow color="#CFE4F4" />
      </mesh>
    ))}
    {[-1, 1].map((s) => box([s * 20, 6, 0], [0.3, 12, 34], "#EEF0F2", { key: s, cast: false }))}
    {box([0, 12.1, 0], [40, 0.2, 34], "#F4F6F8", { cast: false })}
    {Array.from({ length: 4 }, (_, i) => glowBox([-9 + i * 6, 11.95, 0], [0.6, 0.06, 20], "#F4FAFF", `ll${i}`))}
    {/* rig: platform with hazard edges, the door, sensors and cables */}
    {box([0, 0.5, -2], [7, 1.0, 5], "#5A6270")}
    {[-1, 1].map((s) => (
      <mesh key={s} position={[0, 1.01, -2 + s * 2.45]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 0.2]} />
        <Flat color="#F2C43D" />
      </mesh>
    ))}
    <DoorFrame position={RIG.door} color="#C9D0D8" depth={0.5} />
    <DoorLeaf position={[RIG.door[0], RIG.door[1], RIG.door[2] + 0.16]} open={open} toward color="#E8862A" kind="flat" />
    {[
      [-1.35, 2.2],
      [1.35, 2.2],
      [-1.35, 4.6],
      [1.35, 4.6],
      [0, 6.0],
    ].map(([x, y], i) => (
      <group key={`sn${i}`} position={[x, 1.0 + y, -1.7]}>
        {box([0, 0, 0], [0.34, 0.34, 0.3], "#2A2E3A")}
        <mesh position={[0, 0, 0.16]}>
          <circleGeometry args={[0.07, 8]} />
          <Glow color={Math.floor(t * 3 + i) % 2 ? "#4FFF8A" : "#2A8A4A"} />
        </mesh>
      </group>
    ))}
    {[-1, 1].map((s) => (
      <mesh key={`cab${s}`}>
        <tubeGeometry args={[new THREE.CatmullRomCurve3([new THREE.Vector3(s * 1.4, 2.2, -1.8), new THREE.Vector3(s * 3.4, 0.15, -1), new THREE.Vector3(s * 7, 0.12, 0.6), new THREE.Vector3(s * 9.5, 1.5, 1)]), 24, 0.1, 6]} />
        <Flat color="#1A1A22" />
      </mesh>
    ))}
    {/* desks with monitors */}
    {[-1, 1].map((s) => (
      <group key={`dk${s}`} position={[s * 10, 0, 1]} rotation={[0, (-s * Math.PI) / 5, 0]}>
        {box([0, 1.9, 0], [5, 0.16, 2.2], "#E8E4DA")}
        {[-1, 1].map((sx) => box([sx * 2.3, 0.95, 0], [0.14, 1.9, 2], "#9AA1B0", { key: sx }))}
        {[-1.2, 1.2].map((x, i) => (
          <group key={x} position={[x, 3.1, -0.5]}>
            {box([0, 0, -0.06], [2.0, 1.3, 0.1], "#1A1A22")}
            <CanvasPanel
              position={[0, 0, 0.0]}
              w={1.84}
              h={1.14}
              px={256}
              draw={(ctx, W, H) => {
                ctx.fillStyle = "#0B1420";
                ctx.fillRect(0, 0, W, H);
                ctx.strokeStyle = i ? "#4FE0FF" : "#FFBA58";
                ctx.lineWidth = 3;
                ctx.beginPath();
                for (let k = 0; k <= 40; k++) {
                  const x2 = (k / 40) * W;
                  const y2 = H * (0.5 + Math.sin(k * 0.6 + t * 4 + i * 2) * 0.25 * Math.sin(k * 0.13 + t));
                  if (k) ctx.lineTo(x2, y2);
                  else ctx.moveTo(x2, y2);
                }
                ctx.stroke();
              }}
            />
          </group>
        ))}
      </group>
    ))}
    {/* whiteboard */}
    <CanvasPanel
      position={[-12, 5.4, -13.7]}
      w={8}
      h={4}
      px={512}
      draw={(ctx, W, H) => {
        ctx.fillStyle = "#F8F8F4";
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = "#2A4A8A";
        ctx.lineWidth = 4;
        ctx.strokeRect(W * 0.1, H * 0.2, W * 0.12, H * 0.5);
        ctx.beginPath();
        ctx.moveTo(W * 0.25, H * 0.45);
        ctx.bezierCurveTo(W * 0.45, H * 0.1, W * 0.6, H * 0.8, W * 0.85, H * 0.4);
        ctx.stroke();
        ctx.fillStyle = "#C8372D";
        ctx.font = CANVAS_FONT(H * 0.12);
        ctx.fillText("? ? ?", W * 0.62, H * 0.85);
      }}
    />
    <pointLight position={[0, 9, 4]} color="#F4F8FF" intensity={30} distance={40} decay={1.3} />
  </group>
);

// ================================================================ airport (hero scale)

export const DEPBOARD = { c: [-1.2, 11.0, -11.6] as V3, w: 13, h: 7.4 };
const FLIGHTS = [
  ["SK 101", "LONDON"],
  ["SK 214", "NEW YORK"],
  ["SK 330", "TOKYO"],
  ["SK 412", "DUBAI"],
  ["SK 508", "SYDNEY"],
  ["SK 617", "PARIS"],
  ["SK 720", "CAIRO"],
];
export const drawCancelled = (t: number) => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#0B0E18";
  ctx.fillRect(0, 0, W, H);
  const pad = W * 0.05;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = CANVAS_FONT(H * 0.085);
  ctx.fillStyle = "#E8E4DA";
  ctx.fillText("DEPARTURES", pad, H * 0.1);
  const blink = Math.floor(t * 2) % 2 === 0;
  FLIGHTS.forEach(([code, city], i) => {
    const y = H * 0.24 + i * H * 0.108;
    ctx.font = CANVAS_FONT(H * 0.062);
    ctx.textAlign = "left";
    ctx.fillStyle = "#E8D27A";
    ctx.fillText(code, pad, y);
    ctx.fillText(city, W * 0.27, y);
    ctx.textAlign = "right";
    ctx.fillStyle = blink || i % 2 ? "#FF5A4A" : "#A8322A";
    ctx.fillText("CANCELLED", W - pad, y);
  });
};
export const Airport: React.FC<{ t: number }> = ({ t }) => (
  <group>
    {box([0, -0.1, 0], [80, 0.2, 60], "#B8B2A4", { cast: false })}
    {/* glass wall with mullions, the apron beyond */}
    {Array.from({ length: 11 }, (_, i) => box([-30 + i * 6, 8, -12], [0.4, 16, 0.4], "#3A3F4A", { key: i }))}
    {box([0, 16.2, -12], [64, 0.6, 0.6], "#3A3F4A")}
    {box([0, 0.4, -12], [64, 0.8, 0.6], "#3A3F4A")}
    <mesh position={[0, 8, -12]}>
      <planeGeometry args={[64, 16]} />
      <meshLambertMaterial color="#C9D8E4" transparent opacity={0.16} depthWrite={false} />
    </mesh>
    {box([0, 18, 0], [80, 3, 30], "#D8D4CA", { cast: false })}
    {box([0, -0.12, -60], [300, 0.2, 90], "#6A6E78", { cast: false })}
    {[-26, 8, 40].map((x, i) => (
      <group key={x} position={[x, 0, -40 - i * 6]} rotation={[0, 0.5 + i * 0.3, 0]} scale={7}>
        <PlaneModel />
      </group>
    ))}
    {/* the board */}
    {box([DEPBOARD.c[0], DEPBOARD.c[1], DEPBOARD.c[2] - 0.15], [DEPBOARD.w + 0.6, DEPBOARD.h + 0.6, 0.3], "#15161C")}
    <CanvasPanel position={DEPBOARD.c} w={DEPBOARD.w} h={DEPBOARD.h} px={1024} draw={drawCancelled(t)} />
    {[-6, 3.6].map((x) => (
      <mesh key={x} position={[x, 16.4, DEPBOARD.c[2]]}>
        <CylG args={[0.05, 0.05, 2.5, 4]} />
        <Flat color="#2A2A30" />
      </mesh>
    ))}
    {/* rows of empty seats */}
    {[2, 6, 10].map((z) =>
      Array.from({ length: 8 }, (_, i) => (
        <group key={`${z}${i}`} position={[-11 + i * 1.9 + (i > 3 ? 3 : 0), 0, z]}>
          {box([0, 1.15, 0], [1.6, 0.25, 1.5], "#24748F")}
          {box([0, 2.1, -0.7], [1.6, 1.7, 0.2], "#24748F")}
          {box([0, 0.5, 0], [0.2, 1.0, 0.2], "#5A5E68")}
        </group>
      )),
    )}
    <pointLight position={[0, 14, 6]} color="#F4F8FF" intensity={30} distance={50} decay={1.3} />
  </group>
);

/** A simple airliner (kit-scale units ×1: ≈ 6 long), nose +Z. */
const PlaneModel: React.FC = () => (
  <group>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <CylG args={[0.4, 0.4, 6, 10]} />
      <Flat color="#F2F4F6" />
    </mesh>
    <mesh position={[0, 0, 3.3]} rotation={[Math.PI / 2, 0, 0]}>
      <ConeG args={[0.4, 0.8, 10]} />
      <Flat color="#F2F4F6" />
    </mesh>
    {box([0, -0.1, 0.2], [6.4, 0.1, 1.2], "#DCE0E6")}
    {box([0, 0.7, -2.7], [0.1, 1.2, 0.8], "#24748F")}
    {box([0, 0.1, -2.7], [2.2, 0.08, 0.6], "#DCE0E6")}
    {[-1.6, 1.6].map((x) => (
      <mesh key={x} position={[x, -0.4, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <CylG args={[0.22, 0.22, 0.9, 8]} />
        <Flat color="#9AA1B0" />
      </mesh>
    ))}
    {box([0, -0.62, 0], [0.12, 0.5, 0.12], "#2A2A30")}
  </group>
);

// ================================================================ military base

export const HUT = { pos: [0, 0, 0] as V3, door: [0, DOOR.h / 2, 3.01] as V3 };
export const MilitaryBase: React.FC<{ t: number; hutOpen?: number }> = ({ t, hutOpen = 0 }) => (
  <group>
    {box([0, -0.1, 0], [500, 0.2, 500], "#B8A47A", { cast: false })}
    {box([10, 0.0, -30], [140, 0.1, 22], "#6A6A66", { cast: false })}
    {/* hangar */}
    <group position={[-36, 0, -60]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[16, 16, 40, 18, 1, true, -Math.PI / 2, Math.PI]} />
        <meshLambertMaterial color="#6A7058" flatShading side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 7, 19]}>
        <planeGeometry args={[28, 14]} />
        <Flat color="#2A2E2A" />
      </mesh>
    </group>
    {/* jets on the apron */}
    {[
      [6, -28, 0.5],
      [28, -32, 0.9],
    ].map(([x, z, r], i) => (
      <group key={i} position={[x, 1.6, z]} rotation={[0, r, 0]} scale={6}>
        <JetModel />
      </group>
    ))}
    {/* radar + control tower */}
    <group position={[52, 0, -70]}>
      {box([0, 9, 0], [6, 18, 6], "#C9C2B4")}
      {box([0, 20, 0], [9, 4, 9], "#3A4A5A")}
      <mesh position={[0, 20, 0]}>
        <boxGeometry args={[9.2, 3, 9.2]} />
        <meshLambertMaterial color="#9FC8E4" transparent opacity={0.6} />
      </mesh>
    </group>
    <group position={[70, 0, -40]} rotation={[0, t * 0.9, 0]}>
      {box([0, 4, 0], [1.6, 8, 1.6], "#8E96A6")}
      {box([0, 8.6, 0], [10, 2.2, 0.4], "#E8E4DA")}
    </group>
    {/* sandbags */}
    {Array.from({ length: 16 }, (_, i) =>
      [0, 1, 2].map((r) => (
        <mesh key={`sb${i}${r}`} position={[-20 + i * 1.5 + (r % 2) * 0.7, 0.4 + r * 0.72, 10]} scale={[1, 0.55, 0.7]} castShadow>
          <IcoG args={[0.8, 1]} />
          <Flat color={r % 2 ? "#A8946A" : "#9A865E"} />
        </mesh>
      )),
    )}
    {/* the guard hut (door faces +Z) */}
    <group position={HUT.pos}>
      <WallWithDoor position={[0, 0, 3]} width={7} height={6.4} color="#7A7E64" />
      {box([0, 3.2, -3], [7, 6.4, 0.3], "#7A7E64")}
      {[-1, 1].map((s) => box([s * 3.5, 3.2, 0], [0.3, 6.4, 6], "#7A7E64", { key: s }))}
      {box([0, 6.6, 0], [7.8, 0.4, 6.8], "#5A5E48")}
      <DoorFrame position={HUT.door} color="#5A5E48" />
      <DoorLeaf position={[HUT.door[0], HUT.door[1], 3.15]} open={hutOpen} toward color="#4A5038" />
      <CanvasPanel
        position={[0, 5.6, 3.17]}
        w={4}
        h={0.7}
        px={512}
        draw={(ctx, W, H) => {
          ctx.fillStyle = "#F2C43D";
          ctx.fillRect(0, 0, W, H);
          fitText(ctx, "RESTRICTED AREA", W / 2, H / 2 + H * 0.04, W * 0.92, H * 0.62, "#1A1A22");
        }}
      />
    </group>
    {/* fence */}
    {Array.from({ length: 40 }, (_, i) => (
      <mesh key={`f${i}`} position={[-80 + i * 4, 2.5, -95]}>
        <CylG args={[0.1, 0.1, 5, 4]} />
        <Flat color="#5A5E68" />
      </mesh>
    ))}
  </group>
);

const JetModel: React.FC = () => (
  <group>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <CylG args={[0.08, 0.24, 2.6, 6]} />
      <Flat color="#6A7078" />
    </mesh>
    <mesh position={[0, 0, 1.55]} rotation={[Math.PI / 2, 0, 0]}>
      <ConeG args={[0.08, 0.6, 6]} />
      <Flat color="#4A4E58" />
    </mesh>
    <mesh position={[0, -0.02, -0.25]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
      <shapeGeometry args={[new THREE.Shape([new THREE.Vector2(-1.4, -0.8), new THREE.Vector2(1.4, -0.8), new THREE.Vector2(0, 0.9)])]} />
      <meshLambertMaterial color="#6A7078" flatShading side={THREE.DoubleSide} />
    </mesh>
    {box([0, 0.35, -1.0], [0.05, 0.6, 0.6], "#4A4E58")}
    {box([0, 0.12, 0.55], [0.16, 0.12, 0.5], "#2A3A5A", { cast: false })}
    {box([0, -0.25, 0.4], [0.05, 0.25, 0.05], "#2A2A30")}
  </group>
);

// ================================================================ the unlucky man's bedroom

export const BEDROOM = { door: [0, DOOR.h / 2, 0] as V3 };
/** Back wall at z = 0 with the bedroom door; bed on the left, tally marks on the right wall. */
export const UnluckyBedroom: React.FC<{ tally: number; doorOpen?: number; t: number; wet?: number }> = ({ tally, doorOpen = 0, t, wet = 1 }) => (
  <group>
    {box([0, -0.1, 6], [14, 0.2, 14], "#8A6A4A", { cast: false })}
    <mesh position={[1, 0.01, 5]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[6, 5]} />
      <Flat color="#5A6A8A" />
    </mesh>
    <WallWithDoor position={[0, 0, 0]} width={14} height={6.2} color="#C9B89A" skirting="#F2EEE4" />
    <DoorFrame position={BEDROOM.door} color="#F2EEE4" />
    <DoorLeaf position={[0, DOOR.h / 2, 0.12]} open={doorOpen} toward color="#F2EEE4" />
    {[-1, 1].map((s) => box([s * 7.15, 3.1, 6], [0.3, 6.2, 14], "#BFAE90", { key: s, cast: false }))}
    {box([0, 6.3, 6], [14.6, 0.2, 14], "#F2EEE4", { cast: false })}
    {/* bed */}
    <group position={[-4.4, 0, 5.5]}>
      {box([0, 0.6, 0], [3.6, 0.8, 6], "#6A4A30")}
      {box([0, 1.15, 0.2], [3.4, 0.4, 5.4], "#E8E4DA")}
      {box([0, 1.35, 1.2], [3.5, 0.3, 3.6], "#3E6A8A")}
      {box([0, 1.45, -2.2], [2.2, 0.4, 0.9], "#F2EEE4")}
      {box([0, 1.6, -3.0], [3.6, 2.4, 0.3], "#6A4A30")}
    </group>
    {/* tally marks on the right wall */}
    <CanvasPanel
      position={[6.98, 3.6, 5]}
      rotation={[0, -Math.PI / 2, 0]}
      w={6}
      h={2.6}
      px={768}
      draw={(ctx, W, H) => {
        ctx.fillStyle = "#BFAE90";
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = "#2A2A30";
        ctx.lineWidth = W * 0.012;
        ctx.lineCap = "round";
        const n = Math.floor(tally);
        for (let i = 0; i < n; i++) {
          const g = Math.floor(i / 5);
          const k = i % 5;
          const gx = W * 0.06 + g * W * 0.25;
          if (k < 4) {
            const x = gx + k * W * 0.04;
            ctx.beginPath();
            ctx.moveTo(x, H * 0.2 + (random(`tm${i}`) - 0.5) * 6);
            ctx.lineTo(x + (random(`tn${i}`) - 0.5) * 8, H * 0.8);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(gx - W * 0.02, H * 0.7);
            ctx.lineTo(gx + W * 0.15, H * 0.3);
            ctx.stroke();
          }
        }
      }}
    />
    {/* puddles + drips */}
    {wet > 0 ? (
      <>
        {[
          [1.2, 3.4, 1.8],
          [-0.6, 6.2, 1.2],
          [2.6, 7.6, 0.9],
        ].map(([x, z, r], i) => (
          <mesh key={i} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.7, 1]}>
            <circleGeometry args={[r * wet, 16]} />
            <meshLambertMaterial color="#6A9AC8" transparent opacity={0.55} />
          </mesh>
        ))}
      </>
    ) : null}
    {/* window with morning light */}
    <mesh position={[-6.98, 3.6, 10]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[2.6, 2.2]} />
      <Glow color="#CFE4F4" />
    </mesh>
    <pointLight position={[0, 5, 6]} color="#FFF0D8" intensity={14} distance={20} decay={1.5} />
  </group>
);

// ================================================================ the Alps lab + corridor

/** A modern research campus at dusk: a long glass block, a dome, mountains behind. Front faces +Z. */
export const AlpineLab: React.FC<{ t: number }> = ({ t }) => (
  <group>
    {box([0, -0.1, 0], [600, 0.2, 600], "#E4EAF2", { cast: false })}
    {box([0, 6, -10], [70, 12, 22], "#3A4250")}
    {[2.8, 7.6].map((y) => (
      <mesh key={y} position={[0, y, 1.02]}>
        <planeGeometry args={[66, 3.2]} />
        <Glow color="#F2D49A" />
      </mesh>
    ))}
    {Array.from({ length: 12 }, (_, i) => box([-33 + i * 6, 6, 1.1], [0.3, 12, 0.3], "#2A2E38", { key: i }))}
    <mesh position={[42, 0, -12]}>
      <sphereGeometry args={[14, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshLambertMaterial color="#C9D0D8" flatShading />
    </mesh>
    <mesh position={[42, 14.4, -12]}>
      <CylG args={[0.2, 0.2, 6, 4]} />
      <Flat color="#5A5E68" />
    </mesh>
    <mesh position={[42, 17.6, -12]}>
      <IcoG args={[0.4, 1]} />
      <Glow color={Math.floor(t * 1.5) % 2 ? "#FF3A3A" : "#7A2A2A"} />
    </mesh>
    <Halo position={[0, 6, 4]} size={60} color="#F2C47A" opacity={0.22} />
    <pointLight position={[0, 8, 14]} color="#FFD8A0" intensity={30} distance={50} decay={1.3} />
  </group>
);

const HazardStrip: React.FC<{ position: V3; w: number; h: number }> = ({ position, w, h }) => (
  <CanvasPanel
    position={position}
    w={w}
    h={h}
    px={Math.max(64, Math.round(256 * Math.min(1, w / h)))}
    draw={(ctx, W, H) => {
      const band = Math.min(W, H) * 0.7;
      for (let k = -Math.ceil(H / band) - 2; k < Math.ceil((W + H) / band) + 2; k++) {
        ctx.fillStyle = k % 2 ? "#F2C43D" : "#1A1A22";
        ctx.beginPath();
        ctx.moveTo(k * band, 0);
        ctx.lineTo(k * band + band, 0);
        ctx.lineTo(k * band + band - H, H);
        ctx.lineTo(k * band - H, H);
        ctx.closePath();
        ctx.fill();
      }
    }}
  />
);

export const LABDOOR = { pos: [0, DOOR.h / 2, 0] as V3, w: DOOR.w * 1.2, h: DOOR.h * 1.06 };
/** A clean lab corridor; the heavy LAB 3 door at the end (z = 0, facing +Z). */
export const LabCorridor: React.FC<{ open?: number; t: number }> = ({ open = 0, t }) => {
  const dw = LABDOOR.w;
  const dh = LABDOOR.h;
  return (
    <group>
      {box([0, -0.1, 10], [10, 0.2, 22], "#C9CED6", { cast: false })}
      <WallWithDoor position={[0, 0, 0]} width={10} height={6.6} holeW={dw} holeH={dh} color="#E4E8EE" />
      {[-1, 1].map((s) => box([s * 5.15, 3.3, 10], [0.3, 6.6, 22], "#E4E8EE", { key: s, cast: false }))}
      {box([0, 6.7, 10], [10.6, 0.2, 22], "#F4F6F8", { cast: false })}
      {Array.from({ length: 3 }, (_, i) => glowBox([0, 6.58, 4 + i * 7], [3, 0.06, 0.7], "#F4FAFF", `lc${i}`))}
      {/* hazard-striped frame */}
      <HazardStrip position={[-dw / 2 - 0.35, dh / 2, 0.17]} w={0.7} h={dh + 0.2} />
      <HazardStrip position={[dw / 2 + 0.35, dh / 2, 0.17]} w={0.7} h={dh + 0.2} />
      <HazardStrip position={[0, dh + 0.35, 0.17]} w={dw + 1.4} h={0.7} />
      <DoorLeaf position={[0, dh / 2, 0.24]} w={dw} h={dh} open={open} toward color="#8E96A6" kind="flat" knob="#2A2A30" />
      <CanvasPanel
        position={[0, dh + 0.75, 0.18]}
        w={2.6}
        h={0.8}
        px={512}
        draw={(ctx, W, H) => {
          ctx.fillStyle = "#1E2A3A";
          ctx.fillRect(0, 0, W, H);
          fitText(ctx, "LAB 3", W / 2, H / 2 + H * 0.04, W * 0.8, H * 0.62, "#FFFFFF");
        }}
      />
      <mesh position={[3.4, 4.0, 0.17]}>
        <circleGeometry args={[0.18, 12]} />
        <Glow color={Math.floor(t * 2) % 2 ? "#FF3A3A" : "#6A1A1A"} />
      </mesh>
      <pointLight position={[0, 5.6, 6]} color="#F0F6FF" intensity={14} distance={22} decay={1.4} />
    </group>
  );
};

// ================================================================ the void: thousands of doors

/** Instanced floating doors (frame, ajar leaf, glowing gap), drifting and turning slowly. */
export const DoorSwarm: React.FC<{ t: number; count?: number; rMin?: number; rMax?: number; seed?: string; center?: V3; avoid?: { p: V3; r: number }[] }> = ({
  t,
  count = 1400,
  rMin = 14,
  rMax = 320,
  seed = "swarm",
  center = [0, 0, 0],
  avoid = [],
}) => {
  const frameRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);
  const frameGeom = useMemo(() => {
    const parts = [
      new THREE.BoxGeometry(0.22, 4.92, 0.36).translate(-1.21, 0.11, 0),
      new THREE.BoxGeometry(0.22, 4.92, 0.36).translate(1.21, 0.11, 0),
      new THREE.BoxGeometry(2.64, 0.22, 0.36).translate(0, 2.46, 0),
      new THREE.BoxGeometry(2.2, 0.08, 0.36).translate(0, -2.31, 0),
    ];
    const g = new THREE.BufferGeometry();
    const pos: number[] = [];
    const nor: number[] = [];
    parts.forEach((p) => {
      const q = p.toNonIndexed();
      pos.push(...(q.getAttribute("position").array as Float32Array));
      nor.push(...(q.getAttribute("normal").array as Float32Array));
    });
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    return g;
  }, []);
  const doors = useMemo(() => {
    const out: { p: THREE.Vector3; rot: THREE.Euler; spin: V3; open: number; col: THREE.Color; s: number }[] = [];
    const cols = ["#FFD08A", "#7FD8FF", "#B88AFF", "#7FFFA0", "#FF8AC0", "#FFFFFF", "#FFB25A"].map((c) => new THREE.Color(c));
    let i = 0;
    while (out.length < count && i < count * 4) {
      i++;
      const u = random(`${seed}u${i}`) * 2 - 1;
      const th = random(`${seed}t${i}`) * Math.PI * 2;
      const r = rMin + Math.pow(random(`${seed}r${i}`), 0.6) * (rMax - rMin);
      const rr = Math.sqrt(1 - u * u);
      const p = new THREE.Vector3(rr * Math.cos(th) * r, u * r * 0.6, rr * Math.sin(th) * r).add(new THREE.Vector3(...center));
      if (avoid.some((a) => p.distanceTo(new THREE.Vector3(...a.p)) < a.r)) continue;
      out.push({
        p,
        rot: new THREE.Euler((random(`${seed}a${i}`) - 0.5) * 1.2, random(`${seed}b${i}`) * Math.PI * 2, (random(`${seed}c${i}`) - 0.5) * 1.0),
        spin: [(random(`${seed}sa${i}`) - 0.5) * 0.08, (random(`${seed}sb${i}`) - 0.5) * 0.12, (random(`${seed}sc${i}`) - 0.5) * 0.06],
        open: 0.1 + random(`${seed}o${i}`) * 0.5,
        col: cols[Math.floor(random(`${seed}k${i}`) * cols.length)],
        s: 0.8 + random(`${seed}s${i}`) * 0.6,
      });
    }
    return out;
  }, [count, rMin, rMax, seed, center[0], center[1], center[2]]);
  useLayoutEffect(() => {
    const f = frameRef.current;
    const l = leafRef.current;
    const g = glowRef.current;
    if (!f || !l || !g) return;
    const o = new THREE.Object3D();
    const leaf = new THREE.Object3D();
    const m = new THREE.Matrix4();
    doors.forEach((d, i) => {
      o.position.copy(d.p);
      o.position.y += Math.sin(t * 0.4 + i) * 0.4;
      o.rotation.set(d.rot.x + d.spin[0] * t, d.rot.y + d.spin[1] * t, d.rot.z + d.spin[2] * t);
      o.scale.setScalar(d.s);
      o.updateMatrix();
      f.setMatrixAt(i, o.matrix);
      g.setMatrixAt(i, o.matrix);
      // leaf hinged at the left edge, swung toward +Z
      leaf.position.set(-1.1, 0, 0.05);
      leaf.rotation.set(0, -d.open * 1.4, 0);
      leaf.updateMatrix();
      m.copy(o.matrix).multiply(leaf.matrix).multiply(new THREE.Matrix4().makeTranslation(1.1, 0, 0));
      l.setMatrixAt(i, m);
      g.setColorAt(i, d.col);
    });
    f.instanceMatrix.needsUpdate = true;
    l.instanceMatrix.needsUpdate = true;
    g.instanceMatrix.needsUpdate = true;
    if (g.instanceColor) g.instanceColor.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={frameRef} args={[frameGeom, undefined, doors.length]} key={`f${doors.length}`}>
        <meshLambertMaterial color="#D8D2C4" flatShading />
      </instancedMesh>
      <instancedMesh ref={leafRef} args={[undefined, undefined, doors.length]} key={`l${doors.length}`}>
        <boxGeometry args={[2.2, 4.7, 0.12]} />
        <meshLambertMaterial color="#8A6A4A" flatShading />
      </instancedMesh>
      <instancedMesh ref={glowRef} args={[undefined, undefined, doors.length]} key={`g${doors.length}`}>
        <planeGeometry args={[2.2, 4.7]} />
        <meshBasicMaterial color="#FFFFFF" side={THREE.DoubleSide} toneMapped={false} fog={false} />
      </instancedMesh>
    </group>
  );
};
