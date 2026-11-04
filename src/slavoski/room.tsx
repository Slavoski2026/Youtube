/**
 * Gaming room kit: Slavoski's room with a couch, a TV (its screen can show a live game feed),
 * a wall clock, a window whose sky follows the time of day, a side table with cans piling up.
 *
 * Layout (world units): TV on the back wall at z = -5 facing +Z; couch at z ≈ 2 facing the TV;
 * window in the left wall (x = -6). The hero sits at SEAT (yaw π) with SITTING / HOLD_CONTROLLER poses.
 */
import React from "react";
import { random } from "remotion";
import * as THREE from "three";
import { Flat, Glow } from "./materials";
import type { V3 } from "./noise";
import { P } from "./palette";
import { groundedBob, handPosition, mergePose, REST, type Pose } from "./rig/Hero";
import type { CameraSpec } from "./Stage";
import { project } from "./Stage";
import { BoxG, CircleG, ConeG, CylG } from "./detail";

/** Slavoski sits on the right of the couch, so a camera behind-left sees the TV beside him, not behind his head. */
export const SEAT: V3 = [1.4, 0, 2.0];
export const SEAT_YAW = Math.PI;
const SEAT_TOP = 0.7;

/** Seated on the couch, holding a controller in front of the chest. `lean` > 0 leans in (hooked). */
export const sittingPose = (over: Partial<Pose> = {}): Pose => {
  const p = mergePose(REST, {
    lHip: [1.5, 0.08],
    rHip: [1.5, 0.08],
    lKnee: 1.45,
    rKnee: 1.45,
    lShoulder: [0.5, -0.25],
    rShoulder: [0.5, -0.25],
    lElbow: 1.4,
    rElbow: 1.4,
    ...over,
  });
  return { ...p, bob: groundedBob(p) };
};

/** Where the controller goes for a given seated pose (between the fists). */
export const controllerAt = (pose: Pose): V3 => {
  const l = handPosition(pose, "l", SEAT, SEAT_YAW);
  const r = handPosition(pose, "r", SEAT, SEAT_YAW);
  return [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2, (l[2] + r[2]) / 2];
};

/** A chunky gamepad, width sized to touch both fists (hands sit ±0.84 from the body centre). */
export const Controller: React.FC<{ position: V3; yaw?: number; pitch?: number; lit?: boolean }> = ({ position, yaw = SEAT_YAW, pitch = 0.2, lit = true }) => (
  <group position={position} rotation={[pitch, yaw, 0]}>
    <mesh castShadow>
      <BoxG args={[1.24, 0.18, 0.45]} />
      <Flat color="#22242E" />
    </mesh>
    {[-0.45, 0.45].map((x) => (
      <mesh key={x} position={[x, -0.05, -0.05]} castShadow>
        <BoxG args={[0.3, 0.22, 0.5]} />
        <Flat color="#22242E" />
      </mesh>
    ))}
    <mesh position={[0, 0.1, 0.05]}>
      <BoxG args={[0.24, 0.02, 0.08]} />
      {lit ? <Glow color="#6FB8FF" /> : <Flat color="#303440" />}
    </mesh>
  </group>
);

/** Sky colour outside the window for hours since noon (0 = 12:00). */
export const skyAt = (hours: number): { top: string; bottom: string; night: number } => {
  const clock = (12 + hours) % 24;
  if (clock >= 7 && clock < 18) return { top: "#5FA8E8", bottom: "#BFE0F5", night: 0 };
  if (clock >= 18 && clock < 21) return { top: "#3A3F7A", bottom: "#F09A60", night: 0.4 };
  if (clock >= 21 || clock < 4) return { top: "#070B20", bottom: "#1A2148", night: 1 };
  return { top: "#2A3A6A", bottom: "#F2A2A8", night: 0.5 }; // 4–7 am dawn
};

/** TV screen (16:9) centre and size, facing +Z. */
export const TV = { center: [0, 2.7, -4.48] as V3, w: 4.0, h: 2.25 };

/** Projected TV screen rectangle (pixels) for a camera: used to place a live game feed over the screen. */
export const tvScreenRect = (cam: CameraSpec, width: number, height: number) => {
  const { center: c, w, h } = TV;
  const corners: V3[] = [
    [c[0] - w / 2, c[1] + h / 2, c[2]],
    [c[0] + w / 2, c[1] + h / 2, c[2]],
    [c[0] + w / 2, c[1] - h / 2, c[2]],
    [c[0] - w / 2, c[1] - h / 2, c[2]],
  ];
  const pts = corners.map((p) => project(p, cam, width, height));
  const x0 = Math.min(...pts.map((p) => p.x));
  const x1 = Math.max(...pts.map((p) => p.x));
  const y0 = Math.min(...pts.map((p) => p.y));
  const y1 = Math.max(...pts.map((p) => p.y));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, poly: pts.map((p) => `${p.x - x0}px ${p.y - y0}px`).join(", ") };
};

const WallClock: React.FC<{ hours: number; position: V3 }> = ({ hours, position }) => {
  const clock = 12 + hours;
  const hourA = -((clock % 12) / 12) * Math.PI * 2;
  const minA = -((clock % 1) * Math.PI * 2);
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <CylG args={[0.55, 0.55, 0.08, 16]} />
        <Flat color="#F2EEE6" />
      </mesh>
      <mesh position={[0, 0, -0.01]} rotation={[Math.PI / 2, 0, 0]}>
        <CylG args={[0.62, 0.62, 0.06, 16]} />
        <Flat color="#2A2A34" />
      </mesh>
      <group position={[0, 0, 0.06]} rotation={[0, 0, hourA]}>
        <mesh position={[0, 0.16, 0]}>
          <BoxG args={[0.06, 0.32, 0.02]} />
          <Flat color="#1A1A22" />
        </mesh>
      </group>
      <group position={[0, 0, 0.07]} rotation={[0, 0, minA]}>
        <mesh position={[0, 0.22, 0]}>
          <BoxG args={[0.04, 0.44, 0.02]} />
          <Flat color="#C8372D" />
        </mesh>
      </group>
    </group>
  );
};

const Can: React.FC<{ position: V3; tipped?: boolean; color: string }> = ({ position, tipped, color }) => (
  <mesh position={tipped ? [position[0], position[1] + 0.12, position[2]] : [position[0], position[1] + 0.22, position[2]]} rotation={tipped ? [0, 0.7, Math.PI / 2] : [0, 0, 0]} castShadow>
    <CylG args={[0.12, 0.12, 0.44, 8]} />
    <Flat color={color} />
  </mesh>
);

export const GamingRoom: React.FC<{
  /** Hours since noon (drives the wall clock and the window sky). */
  hours: number;
  cans?: number;
  waterBottle?: boolean;
  pizza?: boolean;
  phoneGlow?: boolean;
  tvOn?: boolean;
}> = ({ hours, cans = 1, waterBottle = false, pizza = false, phoneGlow = false, tvOn = true }) => {
  const sky = skyAt(hours);
  const wall = "#3A3550";
  const winZ = 0.5, winW = 2.6, winH = 1.9, winY = 2.6;
  return (
    <group>
      {/* floor + rug */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[12, 0.1, 14]} />
        <Flat color="#4A3A34" />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 5]} />
        <Flat color="#2E5A6A" />
      </mesh>
      {/* back (TV) wall and right wall */}
      <mesh position={[0, 3, -5.1]} receiveShadow>
        <BoxG args={[12, 6, 0.2]} />
        <Flat color={wall} />
      </mesh>
      <mesh position={[6, 3, 0]} receiveShadow>
        <BoxG args={[0.2, 6, 14]} />
        <Flat color="#433D5C" />
      </mesh>
      {/* left wall with a window opening */}
      {[
        { y: 3, z: (-7 + (winZ - winW / 2)) / 2, h: 6, d: winZ - winW / 2 + 7 },
        { y: 3, z: (7 + (winZ + winW / 2)) / 2, h: 6, d: 7 - (winZ + winW / 2) },
      ].map((b, i) => (
        <mesh key={i} position={[-6, b.y, b.z]} receiveShadow>
          <BoxG args={[0.2, b.h, b.d]} />
          <Flat color="#433D5C" />
        </mesh>
      ))}
      <mesh position={[-6, (winY - winH / 2) / 2, winZ]} receiveShadow>
        <BoxG args={[0.2, winY - winH / 2, winW]} />
        <Flat color="#433D5C" />
      </mesh>
      <mesh position={[-6, (6 + winY + winH / 2) / 2, winZ]} receiveShadow>
        <BoxG args={[0.2, 6 - (winY + winH / 2), winW]} />
        <Flat color="#433D5C" />
      </mesh>
      {/* the view: gradient sky + city silhouettes */}
      <mesh position={[-9, winY, winZ]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[10, 8]} />
        <shaderMaterial
          uniforms={{ top: { value: new THREE.Color(sky.top) }, bottom: { value: new THREE.Color(sky.bottom) } }}
          vertexShader="varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }"
          fragmentShader="uniform vec3 top; uniform vec3 bottom; varying vec2 vUv; void main(){ gl_FragColor = vec4(mix(bottom, top, smoothstep(0.35, 0.8, vUv.y)), 1.0); }"
        />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[-8.6, 0.6 + random(`sil${i}`) * 1.4, winZ - 1.8 + i * 0.75]}>
          <BoxG args={[0.1, 2 + random(`silh${i}`) * 2.4, 0.6]} />
          <Flat color={sky.night > 0.5 ? "#0E1226" : "#56607A"} />
        </mesh>
      ))}
      {sky.night > 0.7 ? (
        <mesh position={[-8.7, 3.2, winZ + 0.6]} rotation={[0, Math.PI / 2, 0]}>
          <CircleG args={[0.25, 12]} />
          <Glow color="#E8ECF5" fog={false} />
        </mesh>
      ) : null}
      {/* window frame + curtains */}
      <mesh position={[-5.88, winY, winZ]}>
        <BoxG args={[0.06, winH, 0.06]} />
        <Flat color="#E6E0D4" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-5.8, winY + 0.2, winZ + s * (winW / 2 + 0.25)]} castShadow>
          <BoxG args={[0.12, winH + 1, 0.6]} />
          <Flat color="#7A3A4A" />
        </mesh>
      ))}
      {/* TV + stand */}
      <mesh position={[0, 0.5, -4.5]} castShadow receiveShadow>
        <BoxG args={[5, 1, 1]} />
        <Flat color="#2A2430" />
      </mesh>
      <mesh position={[TV.center[0], TV.center[1], TV.center[2] - 0.12]} castShadow>
        <BoxG args={[TV.w + 0.2, TV.h + 0.2, 0.2]} />
        <Flat color="#121218" />
      </mesh>
      <mesh position={TV.center}>
        <planeGeometry args={[TV.w, TV.h]} />
        {tvOn ? <Glow color="#2A3A6A" /> : <Flat color="#08080C" />}
      </mesh>
      {tvOn ? <pointLight position={[TV.center[0], TV.center[1], TV.center[2] + 1.2]} color="#8FB8FF" intensity={22} distance={16} decay={2} /> : null}
      <WallClock hours={hours} position={[3.6, 4.4, -4.98]} />
      {/* posters */}
      <mesh position={[-3.6, 3.6, -4.99]}>
        <planeGeometry args={[1.4, 2]} />
        <Flat color="#C85A8A" />
      </mesh>
      <mesh position={[-3.6, 3.9, -4.98]}>
        <CircleG args={[0.45, 6]} />
        <Flat color="#FFBA58" />
      </mesh>
      {/* couch: seat front at z = 1.55 keeps clear of the shins */}
      <mesh position={[0, SEAT_TOP / 2, 2.0]} castShadow receiveShadow>
        <BoxG args={[4.2, SEAT_TOP, 0.9]} />
        <Flat color="#3E5A8A" />
      </mesh>
      <mesh position={[0, 1.25, 2.72]} castShadow receiveShadow>
        <BoxG args={[4.2, 2.5, 0.5]} />
        <Flat color="#35507E" />
      </mesh>
      {[-2.25, 2.25].map((x) => (
        <mesh key={x} position={[x, 0.75, 2.1]} castShadow>
          <BoxG args={[0.4, 1.5, 1.4]} />
          <Flat color="#35507E" />
        </mesh>
      ))}
      {/* side table with cans piling up */}
      <mesh position={[3.4, 0.55, 1.4]} castShadow receiveShadow>
        <BoxG args={[1.6, 1.1, 1.2]} />
        <Flat color="#5A4A3A" />
      </mesh>
      {Array.from({ length: cans }, (_, i) => {
        const tipped = i > 5 && random(`can${i}`) < 0.4;
        const onTable = i < 9;
        const x = onTable ? 3.15 + (i % 3) * 0.4 : 3.2 + (random(`cx${i}`) - 0.5) * 2.2;
        const z = onTable ? 1.0 + Math.floor(i / 3) * 0.4 : 0.2 + random(`cz${i}`) * 0.8;
        const y = onTable ? 1.1 : 0;
        return <Can key={i} position={[x, y, z]} tipped={tipped} color={i % 2 ? "#3FC06A" : "#E83A5A"} />;
      })}
      {waterBottle ? (
        <group position={[2.85, 1.1, 1.05]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <CylG args={[0.16, 0.16, 0.9, 8]} />
            <meshLambertMaterial color="#8FD0F0" transparent opacity={0.9} flatShading />
          </mesh>
          <mesh position={[0, 0.98, 0]}>
            <CylG args={[0.08, 0.08, 0.14, 8]} />
            <Flat color="#2A7FD0" />
          </mesh>
        </group>
      ) : null}
      {pizza ? (
        <mesh position={[-1.6, 0.06, 0.4]} rotation={[0, 0.3, 0]} castShadow>
          <BoxG args={[1.3, 0.12, 1.3]} />
          <Flat color="#D8B07A" />
        </mesh>
      ) : null}
      {/* phone on the table */}
      <group position={[2.8, 1.13, 1.75]} rotation={[0, -0.4, 0]}>
        <mesh>
          <BoxG args={[0.26, 0.04, 0.5]} />
          <Flat color="#15161C" />
        </mesh>
        <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.22, 0.44]} />
          {phoneGlow ? <Glow color="#8FD0FF" /> : <Flat color="#0A0B10" />}
        </mesh>
      </group>
      {/* floor lamp */}
      <group position={[-4.6, 0, -3.6]}>
        <mesh position={[0, 1.8, 0]}>
          <CylG args={[0.05, 0.08, 3.6, 6]} />
          <Flat color={P.pole} />
        </mesh>
        <mesh position={[0, 3.7, 0]}>
          <ConeG args={[0.5, 0.6, 8, 1, true]} />
          <Glow color={P.lampGlow} opacity={0.9} />
        </mesh>
      </group>
    </group>
  );
};
