/**
 * Hero-scale vehicles (Slavoski is 4.2 tall; a car is ~11 long): a convertible he drives (open top, so
 * he can be seen shouting) and an ambulance. Kit cars (`Car`) are kit-scale: scale them by CITY (3.5).
 */
import React from "react";
import { BoxG, CylG } from "../../../slavoski/detail";
import { Flat, Glow, Halo } from "../../../slavoski/materials";
import type { V3 } from "../../../slavoski/noise";
import { P } from "../../../slavoski/palette";
import { Hero, type Pose } from "../../../slavoski/rig/Hero";
import { sittingPose } from "../../../slavoski/room";

/** Convertible layout (front faces +Z). The driver sits on the left (x = -1.15) at floor height FLOOR. */
export const CONV = { len: 11, wid: 4.8, wheel: 1.0, floor: 0.95, driver: [-1.15, 0.95, -0.6] as V3 };

export const Convertible: React.FC<{
  position: V3;
  yaw?: number;
  color?: string;
  /** Wheel spin angle (radians). */
  spin?: number;
  /** Seated driver pose (omit for an empty car). */
  driver?: Pose | null;
  lights?: boolean;
  /** 0..1 dust and grime. */
  dirt?: number;
}> = ({ position, yaw = 0, color = "#24748F", spin = 0, driver, lights = false, dirt = 0 }) => {
  const { len, wid, wheel } = CONV;
  const body = dirt > 0 ? mix(color, "#6A6050", dirt * 0.5) : color;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {/* lower body */}
      <mesh position={[0, wheel + 0.55, 0]} castShadow receiveShadow>
        <BoxG args={[wid, 1.3, len]} />
        <Flat color={body} />
      </mesh>
      {/* bonnet and boot (slightly higher) */}
      <mesh position={[0, wheel + 1.32, len / 2 - 1.9]} castShadow>
        <BoxG args={[wid - 0.1, 0.3, 3.6]} />
        <Flat color={body} />
      </mesh>
      <mesh position={[0, wheel + 1.32, -len / 2 + 1.6]} castShadow>
        <BoxG args={[wid - 0.1, 0.3, 3.0]} />
        <Flat color={body} />
      </mesh>
      {/* cabin sides */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (wid / 2 - 0.12), wheel + 1.35, -0.4]} castShadow>
          <BoxG args={[0.24, 0.35, 4.4]} />
          <Flat color={body} />
        </mesh>
      ))}
      {/* interior floor and seats */}
      <mesh position={[0, wheel + 1.05, -0.4]}>
        <BoxG args={[wid - 0.5, 0.1, 4.2]} />
        <Flat color="#2A2420" />
      </mesh>
      {[-1.15, 1.15].map((x) => (
        <group key={x} position={[x, 0, -0.9]}>
          <mesh position={[0, wheel + 1.3, 0]} castShadow>
            <BoxG args={[1.6, 0.4, 1.5]} />
            <Flat color="#3A2E28" />
          </mesh>
          <mesh position={[0, wheel + 2.2, -0.8]} rotation={[-0.15, 0, 0]} castShadow>
            <BoxG args={[1.6, 1.8, 0.35]} />
            <Flat color="#3A2E28" />
          </mesh>
        </group>
      ))}
      {/* windscreen frame + glass */}
      <group position={[0, wheel + 1.45, 1.75]} rotation={[-0.45, 0, 0]}>
        <mesh position={[0, 0.65, 0]}>
          <planeGeometry args={[wid - 0.4, 1.3]} />
          <meshLambertMaterial color="#BFD8F0" transparent opacity={0.22} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (wid / 2 - 0.2), 0.65, 0]}>
            <BoxG args={[0.12, 1.4, 0.12]} />
            <Flat color="#20232C" />
          </mesh>
        ))}
        <mesh position={[0, 1.33, 0]}>
          <BoxG args={[wid - 0.3, 0.12, 0.12]} />
          <Flat color="#20232C" />
        </mesh>
      </group>
      {/* steering wheel */}
      <mesh position={[CONV.driver[0], wheel + 1.95, 0.85]} rotation={[Math.PI / 2 - 0.5, 0, 0]}>
        <torusGeometry args={[0.42, 0.06, 6, 14]} />
        <Flat color="#1A1A1E" />
      </mesh>
      {/* wheels */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`} position={[sx * (wid / 2 - 0.15), wheel, sz * (len / 2 - 2.0)]} rotation={[spin, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <CylG args={[wheel, wheel, 0.75, 12]} />
              <Flat color="#1A1A1E" />
            </mesh>
            <mesh position={[sx * 0.39, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <CylG args={[wheel * 0.55, wheel * 0.55, 0.04, 6]} />
              <Flat color="#B8BEC8" />
            </mesh>
          </group>
        )),
      )}
      {/* lights */}
      {[-1, 1].map((s) => (
        <React.Fragment key={s}>
          <mesh position={[s * 1.6, wheel + 0.95, len / 2 + 0.01]}>
            <planeGeometry args={[0.9, 0.35]} />
            {lights ? <Glow color="#FFF2C8" /> : <Flat color="#D8DCE4" />}
          </mesh>
          <mesh position={[s * 1.6, wheel + 0.95, -len / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.8, 0.3]} />
            <Glow color={lights ? "#FF3A2E" : "#8A2A24"} />
          </mesh>
        </React.Fragment>
      ))}
      {driver ? <Hero pose={driver} position={[CONV.driver[0], wheel + 1.05, CONV.driver[2]]} /> : null}
    </group>
  );
};

/** A driving pose: seated, hands on the wheel (or one arm up waving and shouting with `shout` 0..1). */
export const drivingPose = (over: Partial<Pose> = {}, shout = 0): Pose =>
  sittingPose({
    lShoulder: [1.0, -0.1],
    rShoulder: [1.0 - shout * 0.2, -0.1 + shout * 1.9],
    lElbow: 0.5,
    rElbow: 0.5 + shout * 0.6,
    headYaw: shout * 0.7,
    expression: shout > 0.3 ? "alarm" : "neutral",
    ...over,
  });

/** Ambulance (front faces +Z), hero scale: ~13 long, box body. */
export const Ambulance: React.FC<{ position: V3; yaw?: number; t?: number; lights?: boolean; doorsOpen?: number }> = ({ position, yaw = 0, t = 0, lights = false, doorsOpen = 0 }) => {
  const flash = lights && Math.sin(t * 14) > 0;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, 3.4, -1.2]} castShadow receiveShadow>
        <BoxG args={[5.0, 5.2, 8.6]} />
        <Flat color="#F2F2EE" />
      </mesh>
      <mesh position={[0, 2.4, 4.6]} castShadow receiveShadow>
        <BoxG args={[4.8, 3.2, 3.2]} />
        <Flat color="#F2F2EE" />
      </mesh>
      <mesh position={[0, 3.3, 6.21]}>
        <planeGeometry args={[4.2, 1.4]} />
        <Flat color="#3A4A60" />
      </mesh>
      {/* chequered band */}
      {Array.from({ length: 12 }, (_, i) => (
        <React.Fragment key={i}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 2.51, 2.2, -5.1 + i * 0.95]} rotation={[0, (s * Math.PI) / 2, 0]}>
              <planeGeometry args={[0.95, 0.7]} />
              <Flat color={i % 2 ? "#E8C82A" : "#2A62B8"} />
            </mesh>
          ))}
        </React.Fragment>
      ))}
      {/* light bar */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.2, 6.15, 2.6]}>
          <BoxG args={[1.3, 0.35, 0.6]} />
          {lights ? <Glow color={(s > 0) === flash ? "#4A8AFF" : "#1A2A50"} /> : <Flat color="#5A78B8" />}
        </mesh>
      ))}
      {/* rear doors */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 2.5, 0, -5.5]} rotation={[0, s * doorsOpen * 1.6, 0]}>
          <mesh position={[-s * 1.25, 3.4, -0.05]} castShadow>
            <BoxG args={[2.4, 4.6, 0.12]} />
            <Flat color="#E8E8E4" />
          </mesh>
        </group>
      ))}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 2.2, 0.95, sz * 3.6 + 0.4]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <CylG args={[0.95, 0.95, 0.7, 12]} />
            <Flat color="#1A1A1E" />
          </mesh>
        )),
      )}
      {flash ? <Halo position={[1.2, 6.3, 2.6]} size={4} color="#4A8AFF" opacity={0.6} /> : null}
    </group>
  );
};

const mix = (a: string, b: string, k: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
};

/** Kit-scale car colours for abandoned cars. */
export const CAR_COLORS = [P.carRed, P.carTeal, "#E8E4DA", "#2A2A30", "#5A4A78", "#B39A62"];
