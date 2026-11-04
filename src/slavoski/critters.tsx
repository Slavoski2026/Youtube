/**
 * Expressive low-poly animals (ep. 4 onward): cartoon faces with Slavoski-style square eyes,
 * brows and a mouth, so animals can look smug, angry, alarmed or "talk".
 *
 * - `Quadruped`: dog, cat, cow, pig, rat. Can walk, rear up on its hind legs (`rear`, front legs
 *   become arms), sit, wag, and turn its head.
 * - `Bird`: pigeon, crow, chicken. Walks, pecks, flaps, can hold a pebble in its beak.
 *
 * Everything faces +Z with its feet on y=0 at scale 1, and follows the kit detail level
 * (`BoxG`/`IcoG`/… from detail.tsx). `animals.tsx` (ep. 2's simple rig) is unchanged.
 */
import React from "react";
import type { V3 } from "./noise";
import { Flat } from "./materials";
import { BoxG, ConeG, CylG, IcoG } from "./detail";
import { P } from "./palette";

// ---------- Face ----------
export type Brow = "none" | "flat" | "angry" | "worried" | "smug";
export type Face = {
  /** Pupil offset in eye widths, [-0.3..0.3]. */
  look?: [number, number];
  brow?: Brow;
  /** Eye height multiplier (1 normal, 1.3 wide, 0.4 squint/smug). */
  eyeOpen?: number;
  blink?: number;
  /** 0 closed … 1 wide open (talking, shouting). */
  mouth?: number;
};

/** Two square eyes with pupils and optional brows, centred at the origin on a face plane facing +Z. */
export const ToonEyes: React.FC<{ face?: Face; size: number; spacing: number; browColor?: string }> = ({
  face = {},
  size,
  spacing,
  browColor = "#1E1A22",
}) => {
  const { look = [0, 0], brow = "none", eyeOpen = 1, blink = 0 } = face;
  const h = size * 1.15 * eyeOpen * (1 - blink * 0.88);
  const browAngle = { none: 0, flat: 0, angry: 0.42, worried: -0.38, smug: 0.12 }[brow];
  return (
    <group>
      {[1, -1].map((sx) => (
        <group key={sx} position={[sx * spacing, 0, 0]}>
          <mesh>
            <BoxG args={[size, Math.max(0.004, h), size * 0.3]} />
            <Flat color={P.eyeWhite} />
          </mesh>
          {blink < 0.6 ? (
            <mesh position={[look[0] * size, look[1] * size * eyeOpen, size * 0.16]}>
              <BoxG args={[size * 0.46, Math.max(0.004, size * 0.52 * Math.min(1, eyeOpen) * (1 - blink)), size * 0.06]} />
              <Flat color={P.pupil} />
            </mesh>
          ) : null}
          {brow !== "none" ? (
            <mesh
              position={[sx * size * 0.05, h / 2 + size * 0.24 - (brow === "smug" ? size * 0.12 : 0), size * 0.12]}
              rotation={[0, 0, sx * browAngle * (brow === "smug" && sx < 0 ? -0.5 : 1)]}
            >
              <BoxG args={[size * 1.15, size * 0.2, size * 0.18]} />
              <Flat color={browColor} />
            </mesh>
          ) : null}
        </group>
      ))}
    </group>
  );
};

// ---------- Quadrupeds ----------
export type QuadKind = "dog" | "cat" | "cow" | "pig" | "rat";

type QuadSpec = {
  body: V3;
  /** Hip height (leg length). */
  leg: number;
  legW: number;
  head: V3;
  neck: number;
  snout: V3;
  fur: string;
  belly: string;
  snoutColor: string;
  nose: string;
  paw: string;
  ears: "floppy" | "pointy" | "round" | "cow" | "pig";
  tail: "wag" | "up" | "curl" | "long" | "tuft";
  tailLen: number;
  eye: number;
  /** Eye height on the face, as a share of head height (default 0.16). */
  eyeY?: number;
  spots?: string;
  stripes?: string;
};

export const QUAD: Record<QuadKind, QuadSpec> = {
  dog: {
    body: [0.52, 0.46, 1.0], leg: 0.46, legW: 0.15, head: [0.46, 0.42, 0.42], neck: 0.16, snout: [0.28, 0.2, 0.24],
    fur: "#B07A45", belly: "#E3C9A0", snoutColor: "#E3C9A0", nose: "#1A1414", paw: "#E3C9A0",
    ears: "floppy", tail: "wag", tailLen: 0.42, eye: 0.11,
  },
  cat: {
    body: [0.36, 0.34, 0.78], leg: 0.34, legW: 0.11, head: [0.44, 0.36, 0.34], neck: 0.08, snout: [0.18, 0.1, 0.07],
    fur: "#8E95A3", belly: "#ECE6DA", snoutColor: "#ECE6DA", nose: "#D88A96", paw: "#ECE6DA",
    ears: "pointy", tail: "up", tailLen: 0.62, eye: 0.11, stripes: "#5F6573",
  },
  cow: {
    body: [0.95, 0.85, 1.7], leg: 0.78, legW: 0.22, head: [0.56, 0.54, 0.62], neck: 0.18, snout: [0.46, 0.3, 0.2],
    fur: "#EDEAE4", belly: "#E6DCD6", snoutColor: "#E9A3A8", nose: "#3A2A2C", paw: "#2A2628",
    ears: "cow", tail: "tuft", tailLen: 0.8, eye: 0.13, eyeY: 0.25, spots: "#2A2628",
  },
  pig: {
    body: [0.72, 0.62, 1.1], leg: 0.36, legW: 0.17, head: [0.54, 0.5, 0.44], neck: 0.06, snout: [0.3, 0.22, 0.12],
    fur: "#E9A3A8", belly: "#F3C4C4", snoutColor: "#D98890", nose: "#9A4E58", paw: "#9A4E58",
    ears: "pig", tail: "curl", tailLen: 0.2, eye: 0.11, eyeY: 0.27,
  },
  rat: {
    body: [0.24, 0.22, 0.46], leg: 0.11, legW: 0.06, head: [0.2, 0.18, 0.24], neck: 0.02, snout: [0.1, 0.08, 0.12],
    fur: "#6E6A72", belly: "#B9B2B8", snoutColor: "#8C8690", nose: "#E89AA8", paw: "#E89AA8",
    ears: "round", tail: "long", tailLen: 0.6, eye: 0.05,
  },
};

export type QuadProps = {
  kind: QuadKind;
  position: V3;
  yaw?: number;
  scale?: number;
  /** Gait phase in cycles (0 = standing still). */
  walk?: number;
  /** 0..1: rear up onto the hind legs (front legs become arms). */
  rear?: number;
  /** Arm pitch when reared [left, right], radians forward/up from hanging. */
  arms?: [number, number];
  sit?: boolean;
  headYaw?: number;
  /** + looks up. */
  headPitch?: number;
  headRoll?: number;
  face?: Face;
  /** Tail wag phase (cycles). */
  wag?: number;
  /** Override fur colour (e.g. a second dog). */
  fur?: string;
};

const Leg: React.FC<{ at: V3; angle: number; len: number; w: number; color: string; paw: string }> = ({
  at,
  angle,
  len,
  w,
  color,
  paw,
}) => (
  <group position={at} rotation={[angle, 0, 0]}>
    <mesh position={[0, -len / 2 + 0.02, 0]} castShadow>
      <BoxG args={[w, len - 0.04, w]} />
      <Flat color={color} />
    </mesh>
    <mesh position={[0, -len + Math.min(0.05, w * 0.4), w * 0.12]} castShadow>
      <BoxG args={[w * 1.12, Math.min(0.1, w * 0.8), w * 1.3]} />
      <Flat color={paw} />
    </mesh>
  </group>
);

/** Rotate (y, z) around the origin by `a` (rotation about +X; negative = nose up). */
const rotX = (y: number, z: number, a: number): [number, number] => [y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];

export const Quadruped: React.FC<QuadProps> = ({
  kind,
  position,
  yaw = 0,
  scale = 1,
  walk = 0,
  rear = 0,
  arms = [0.5, 0.5],
  sit = false,
  headYaw = 0,
  headPitch = 0,
  headRoll = 0,
  face,
  wag = 0,
  fur,
}) => {
  const k = QUAD[kind];
  const furC = fur ?? k.fur;
  const [bw, bh, bl] = k.body;
  const zf = bl / 2 - k.legW * 0.9; // front hip
  const zr = -bl / 2 + k.legW * 0.9; // rear hip
  const s = Math.sin(walk * Math.PI * 2);
  const swing = walk ? 0.5 * s : 0;
  const bob = walk ? Math.abs(Math.cos(walk * Math.PI * 2)) * 0.03 * k.leg : 0;

  // Body pitch around the rear hip. Rear: up to ~80°. Sit: just enough for the front legs to reach the floor.
  const haunch = Math.max(k.legW * 0.9, 0.06);
  // Sitting: body up ~43°, front legs stretch straight to the floor, hind legs fold forward as haunches.
  const sitPitch = -0.75;
  const pitch = sit ? sitPitch : -rear * 1.38;
  const pivotY = sit ? haunch : k.leg + bob;
  const hip = (zb: number): V3 => {
    const [y, z] = rotX(0, zb - zr, pitch);
    return [0, pivotY + y, zr + z];
  };
  const fh = hip(zf);
  const rh = hip(zr);
  const legX = bw / 2 - k.legW / 2;

  // Legs (world-aligned groups at the hips). Reared: hind legs walk, front legs are arms.
  const reared = rear > 0.5;
  const frontAngle = (side: number) =>
    sit ? 0 : reared ? -(side > 0 ? arms[0] : arms[1]) * rear + (walk ? 0.25 * s * side : 0) : swing * side;
  const rearAngle = (side: number) => (sit ? -Math.PI / 2 + 0.05 : walk ? -swing * side : 0);
  const frontLen = sit ? fh[1] : reared ? k.leg * 0.9 : k.leg;

  // Head counter-rotates so the face stays level when the body pitches up.
  const headCounter = -pitch * (sit ? 0.9 : 0.95);
  const neckBase: V3 = [0, bh * 0.72, bl / 2 - 0.04];
  const [hw, hh, hl] = k.head;
  const [sw, sh, sl] = k.snout;
  const mouthOpen = face?.mouth ?? 0;

  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      {/* body, pitched around the rear hip */}
      <group position={[0, pivotY, zr]} rotation={[pitch, 0, 0]}>
        <group position={[0, 0, -zr]}>
          <mesh position={[0, bh / 2 - 0.04, 0]} castShadow receiveShadow>
            <BoxG args={[bw, bh, bl]} />
            <Flat color={furC} />
          </mesh>
          <mesh position={[0, 0.0, 0.02]} castShadow>
            <BoxG args={[bw * 0.84, bh * 0.22, bl * 0.82]} />
            <Flat color={k.belly} />
          </mesh>
          {k.spots
            ? [
                [0.5, 0.62, 0.25, 0.32, 0.3],
                [-0.5, 0.5, -0.3, 0.36, 0.28],
                [0.5, 0.42, -0.22, 0.26, 0.24],
                [0, 1.0, 0.1, 0.4, 0.36],
              ].map(([sx, sy, sz, a, b], i) => (
                <mesh key={i} position={[sx * (bw / 2 + 0.005) * (sy === 1 ? 0 : 1), sy === 1 ? bh - 0.035 : bh * sy, sz * bl]}>
                  <BoxG args={sy === 1 ? [a * bw, 0.02, b * bl] : [0.02, a * bh * 1.3, b * bl]} />
                  <Flat color={k.spots!} />
                </mesh>
              ))
            : null}
          {k.stripes
            ? [-0.28, -0.08, 0.12].map((z, i) => (
                <mesh key={i} position={[0, bh - 0.035, z * bl]}>
                  <BoxG args={[bw * 0.7, 0.03, 0.07]} />
                  <Flat color={k.stripes!} />
                </mesh>
              ))
            : null}
          {kind === "cow" ? (
            <mesh position={[0, -0.02, -bl * 0.25]} castShadow>
              <BoxG args={[0.3, 0.16, 0.3]} />
              <Flat color="#E9A3A8" />
            </mesh>
          ) : null}
          <Tail k={k} kind={kind} bh={bh} bl={bl} wag={wag} fur={furC} />

          {/* neck + head */}
          <group position={neckBase} rotation={[headCounter, 0, 0]}>
            <mesh position={[0, k.neck / 2, -0.02]} castShadow>
              <BoxG args={[hw * 0.62, k.neck + hh * 0.3, hw * 0.62]} />
              <Flat color={furC} />
            </mesh>
            <group position={[0, k.neck + hh * 0.3, 0.02]} rotation={[-headPitch, headYaw, headRoll, "YXZ"]}>
              <mesh position={[0, 0, hl / 2 - 0.04]} castShadow>
                <BoxG args={[hw, hh, hl]} />
                <Flat color={furC} />
              </mesh>
              {/* snout, nose, mouth */}
              <group position={[0, -hh * 0.22, hl - 0.04]}>
                {kind === "pig" ? (
                  <mesh position={[0, 0.02, sl / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <CylG args={[sw / 2, sw / 2, sl, 8]} />
                    <Flat color={k.snoutColor} />
                  </mesh>
                ) : (
                  <mesh position={[0, 0, sl / 2]} castShadow>
                    <BoxG args={[sw, sh, sl]} />
                    <Flat color={k.snoutColor} />
                  </mesh>
                )}
                {kind === "pig" || kind === "cow"
                  ? [1, -1].map((sx) => (
                      <mesh key={sx} position={[sx * sw * 0.2, 0.02, sl + 0.006]}>
                        <BoxG args={[sw * 0.12, sh * 0.26, 0.02]} />
                        <Flat color={k.nose} />
                      </mesh>
                    ))
                  : (
                    <mesh position={[0, sh / 2 - 0.02, sl + 0.01]}>
                      <BoxG args={[sw * 0.42, sh * 0.32, 0.05]} />
                      <Flat color={k.nose} />
                    </mesh>
                  )}
                {/* mouth: dark slot under the snout that opens to talk */}
                <mesh position={[0, -sh / 2 - 0.012 - mouthOpen * sh * 0.25, sl * 0.6]}>
                  <BoxG args={[sw * 0.6, 0.02 + mouthOpen * sh * 0.5, sl * 0.6]} />
                  <Flat color={P.mouth} />
                </mesh>
              </group>
              {/* eyes on the front of the head, above the snout */}
              <group position={[0, hh * (k.eyeY ?? 0.16), hl - 0.035]}>
                <ToonEyes face={face} size={k.eye} spacing={hw * 0.24} />
              </group>
              <Ears k={k} kind={kind} />
            </group>
          </group>
        </group>
      </group>

      {/* legs */}
      {[1, -1].map((side) => (
        <React.Fragment key={side}>
          <Leg at={[side * legX, fh[1], fh[2]]} angle={frontAngle(side)} len={frontLen} w={k.legW} color={furC} paw={k.paw} />
          <Leg
            at={[side * legX, rh[1], rh[2]]}
            angle={rearAngle(side)}
            len={sit ? k.leg * 0.62 : k.leg}
            w={sit ? k.legW * 1.3 : k.legW}
            color={furC}
            paw={k.paw}
          />
        </React.Fragment>
      ))}
    </group>
  );
};

/**
 * World position of a front paw (the paw box centre) for a standing or reared quadruped,
 * using the same rig maths as `Quadruped` (no walk). `side` 1 = left (+x), -1 = right.
 * Use it to put held props (a flag, a lever, a gate latch) exactly in the paw.
 */
export const quadPaw = (
  kind: QuadKind,
  opts: { rear?: number; arms?: [number, number]; position?: V3; yaw?: number; scale?: number },
  side: 1 | -1,
): V3 => {
  const k = QUAD[kind];
  const { rear = 0, arms = [0.5, 0.5], position = [0, 0, 0], yaw = 0, scale = 1 } = opts;
  const [bw, , bl] = k.body;
  const zf = bl / 2 - k.legW * 0.9;
  const zr = -bl / 2 + k.legW * 0.9;
  const pitch = -rear * 1.38;
  const [hy, hz] = rotX(0, zf - zr, pitch);
  const fy = k.leg + hy;
  const fz = zr + hz;
  const reared = rear > 0.5;
  const angle = reared ? -(side > 0 ? arms[0] : arms[1]) * rear : 0;
  const len = reared ? k.leg * 0.9 : k.leg;
  const reach = len - Math.min(0.05, k.legW * 0.4);
  const [py, pz] = rotX(-reach, 0, angle);
  const lx = side * (bw / 2 - k.legW / 2);
  const ly = fy + py;
  const lz = fz + pz + k.legW * 0.12;
  const c = Math.cos(yaw);
  const sn = Math.sin(yaw);
  return [position[0] + scale * (lx * c + lz * sn), position[1] + scale * ly, position[2] + scale * (-lx * sn + lz * c)];
};

const Ears: React.FC<{ k: QuadSpec; kind: QuadKind }> = ({ k, kind }) => {
  const [hw, hh, hl] = k.head;
  return (
    <>
      {[1, -1].map((sx) => {
        switch (k.ears) {
          case "floppy":
            return (
              <mesh key={sx} position={[sx * (hw / 2 + 0.03), hh * 0.12, hl * 0.35]} rotation={[0, 0, sx * 0.25]} castShadow>
                <BoxG args={[0.07, hh * 0.8, hl * 0.42]} />
                <Flat color="#7E5530" />
              </mesh>
            );
          case "pointy":
            return (
              <mesh key={sx} position={[sx * hw * 0.3, hh / 2 + 0.07, hl * 0.4]} rotation={[0, sx * 0.785, sx * -0.18]} castShadow>
                <ConeG args={[0.1, 0.2, 4]} />
                <Flat color={kind === "cat" ? k.fur : k.fur} />
              </mesh>
            );
          case "round":
            return (
              <mesh key={sx} position={[sx * hw * 0.42, hh / 2 + 0.05, hl * 0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <CylG args={[0.07, 0.07, 0.02, 8]} />
                <Flat color="#E89AA8" />
              </mesh>
            );
          case "pig":
            return (
              <mesh key={sx} position={[sx * hw * 0.32, hh / 2 + 0.04, hl * 0.62]} rotation={[0.9, sx * 0.785, sx * -0.3]} castShadow>
                <ConeG args={[0.11, 0.2, 4]} />
                <Flat color={k.fur} />
              </mesh>
            );
          case "cow":
            return (
              <React.Fragment key={sx}>
                <mesh position={[sx * (hw / 2 + 0.12), hh * 0.2, hl * 0.3]} rotation={[0, 0, sx * -0.3]} castShadow>
                  <BoxG args={[0.26, 0.08, 0.16]} />
                  <Flat color={k.fur} />
                </mesh>
                <mesh position={[sx * hw * 0.32, hh / 2 + 0.1, hl * 0.3]} rotation={[0, 0, sx * -0.5]} castShadow>
                  <ConeG args={[0.05, 0.22, 6]} />
                  <Flat color="#E8DCC0" />
                </mesh>
              </React.Fragment>
            );
        }
      })}
    </>
  );
};

const Tail: React.FC<{ k: QuadSpec; kind: QuadKind; bh: number; bl: number; wag: number; fur: string }> = ({ k, bh, bl, wag, fur }) => {
  const w = Math.sin(wag * Math.PI * 2);
  const base: V3 = [0, bh * 0.8, -bl / 2 + 0.02];
  switch (k.tail) {
    case "wag":
      return (
        <group position={base} rotation={[-0.75, w * 0.6, 0]}>
          <mesh position={[0, 0, -k.tailLen / 2]} castShadow>
            <BoxG args={[0.09, 0.09, k.tailLen]} />
            <Flat color={fur} />
          </mesh>
        </group>
      );
    case "up": {
      // Three segments curling up and over.
      const seg = k.tailLen / 3;
      return (
        <group position={base} rotation={[-0.3, w * 0.25, 0]}>
          <mesh position={[0, 0, -seg / 2]} castShadow>
            <BoxG args={[0.08, 0.08, seg]} />
            <Flat color={fur} />
          </mesh>
          <group position={[0, 0, -seg]} rotation={[-0.9, 0, 0]}>
            <mesh position={[0, 0, -seg / 2]} castShadow>
              <BoxG args={[0.075, 0.075, seg]} />
              <Flat color={k.stripes ?? fur} />
            </mesh>
            <group position={[0, 0, -seg]} rotation={[-0.7, 0, 0]}>
              <mesh position={[0, 0, -seg / 2]} castShadow>
                <BoxG args={[0.07, 0.07, seg]} />
                <Flat color={fur} />
              </mesh>
            </group>
          </group>
        </group>
      );
    }
    case "curl":
      return (
        <group position={[0, bh * 0.7, -bl / 2 - 0.05]} rotation={[0, Math.PI / 2, w * 0.3]}>
          <mesh castShadow>
            <torusGeometry args={[0.07, 0.025, 4, 10, Math.PI * 1.6]} />
            <Flat color={fur} />
          </mesh>
        </group>
      );
    case "long": {
      // Droops to the floor and trails behind, swaying.
      const n = 5;
      const seg = k.tailLen / n;
      let node: React.ReactNode = null;
      for (let i = n - 1; i >= 0; i--) {
        const th = 0.035 * (1 - i / (n + 1)) + 0.01;
        node = (
          <group position={[0, 0, i === 0 ? 0 : -seg]} rotation={[i === 0 ? 0.5 : -0.12, w * 0.15, 0]}>
            <mesh position={[0, 0, -seg / 2]} castShadow>
              <BoxG args={[th, th, seg]} />
              <Flat color="#D9A0AA" />
            </mesh>
            {node}
          </group>
        );
      }
      return <group position={[0, bh * 0.35, -bl / 2]}>{node}</group>;
    }
    case "tuft":
      return (
        <group position={base} rotation={[0.25 + w * 0.1, 0, w * 0.2]}>
          <mesh position={[0, -k.tailLen / 2, -0.04]} castShadow>
            <BoxG args={[0.05, k.tailLen, 0.05]} />
            <Flat color={fur} />
          </mesh>
          <mesh position={[0, -k.tailLen, -0.04]} castShadow>
            <BoxG args={[0.11, 0.18, 0.11]} />
            <Flat color={k.spots ?? "#2A2628"} />
          </mesh>
        </group>
      );
  }
};

// ---------- Birds ----------
export type BirdKind = "pigeon" | "crow" | "chicken";

type BirdSpec = {
  body: string;
  wing: string;
  head: string;
  neck?: string;
  beak: string;
  feet: string;
  bars?: string;
  bodyScale: V3;
};

export const BIRD: Record<BirdKind, BirdSpec> = {
  pigeon: { body: "#8C93A6", wing: "#A3AABB", head: "#6E7590", neck: "#4F8C7C", beak: "#3A3A44", feet: "#D9858A", bars: "#3E4252", bodyScale: [0.3, 0.3, 0.46] },
  crow: { body: "#24252E", wing: "#2E3242", head: "#1E1F27", beak: "#30303A", feet: "#26262E", bodyScale: [0.3, 0.3, 0.5] },
  chicken: { body: "#F1EEE6", wing: "#E2DDD2", head: "#F4F1EA", beak: "#F2B33D", feet: "#F2B33D", bodyScale: [0.42, 0.42, 0.5] },
};

export type BirdProps = {
  kind: BirdKind;
  position: V3;
  yaw?: number;
  scale?: number;
  walk?: number;
  /** 0..1 head down to the ground. */
  peck?: number;
  /** 0..1 wings spread; `flapT` (seconds) beats them. */
  flap?: number;
  flapT?: number;
  headYaw?: number;
  headPitch?: number;
  face?: Face;
  /** A pebble held in the beak. */
  pebble?: boolean;
};

/** Standing height ≈ 1.0 at scale 1 (pigeon/crow), chicken ≈ 1.25. */
export const Bird: React.FC<BirdProps> = ({
  kind,
  position,
  yaw = 0,
  scale = 1,
  walk = 0,
  peck = 0,
  flap = 0,
  flapT = 0,
  headYaw = 0,
  headPitch = 0,
  face,
  pebble = false,
}) => {
  const b = BIRD[kind];
  const [bx, by, bz] = b.bodyScale;
  const legLen = kind === "chicken" ? 0.32 : 0.24;
  const s = Math.sin(walk * Math.PI * 2);
  const bob = walk ? Math.abs(s) * 0.025 : 0;
  const bodyY = legLen + by * 0.8 + bob;
  const wingOpen = flap * (0.9 + 0.5 * Math.sin(flapT * Math.PI * 2 * 6));
  const headR = kind === "chicken" ? 0.22 : 0.2;
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      {/* legs */}
      {[1, -1].map((sx) => (
        <group key={sx} position={[sx * 0.09, legLen, 0.02]} rotation={[walk ? 0.4 * s * sx : 0, 0, 0]}>
          <mesh position={[0, -legLen / 2, 0]} castShadow>
            <CylG args={[0.018, 0.018, legLen, 5]} />
            <Flat color={b.feet} />
          </mesh>
          {[-0.5, 0, 0.5].map((a) => (
            <mesh key={a} position={[Math.sin(a) * 0.05, -legLen + 0.012, Math.cos(a) * 0.05]} rotation={[0, a, 0]}>
              <BoxG args={[0.022, 0.02, 0.1]} />
              <Flat color={b.feet} />
            </mesh>
          ))}
        </group>
      ))}
      <group position={[0, bodyY, 0]} rotation={[0.18 + peck * 0.35, 0, 0]}>
        {/* body */}
        <mesh scale={[bx, by, bz]} castShadow receiveShadow>
          <IcoG args={[1, 1]} />
          <Flat color={b.body} />
        </mesh>
        {/* tail */}
        <mesh position={[0, by * 0.25, -bz * 1.05]} rotation={[kind === "chicken" ? -0.9 : 0.25, 0, 0]} castShadow>
          <BoxG args={[bx * 0.9, 0.05, bz * 0.7]} />
          <Flat color={kind === "chicken" ? b.wing : b.head} />
        </mesh>
        {/* wings: flattened ellipsoids hugging the body sides; spread rotates them out */}
        {[1, -1].map((sx) => (
          <group key={sx} position={[sx * bx * 0.78, by * 0.3, -bz * 0.05]} rotation={[0.08, 0, sx * (0.06 + wingOpen * 1.3)]}>
            <mesh position={[sx * 0.03, -by * 0.3, -bz * 0.2]} scale={[0.07, by * 0.62, bz * 0.82]} castShadow>
              <IcoG args={[1, 1]} />
              <Flat color={b.wing} />
            </mesh>
            {b.bars
              ? [0, 1].map((i) => (
                  <mesh key={i} position={[sx * 0.085, -by * 0.42 + i * 0.09, -bz * 0.42]} rotation={[0.15, 0, 0]}>
                    <BoxG args={[0.02, 0.04, bz * 0.42]} />
                    <Flat color={b.bars!} />
                  </mesh>
                ))
              : null}
          </group>
        ))}
        {/* neck band + head */}
        <group position={[0, by * 0.7, bz * 0.62]} rotation={[-0.18 - peck * 0.35 + peck * 1.25 - headPitch, headYaw, 0, "YXZ"]}>
          {b.neck ? (
            <mesh position={[0, 0.02, 0]} castShadow>
              <IcoG args={[headR * 1.05, 1]} />
              <Flat color={b.neck} />
            </mesh>
          ) : null}
          <group position={[0, headR * 0.9, headR * 0.35]}>
            <mesh castShadow>
              <IcoG args={[headR, 1]} />
              <Flat color={b.head} />
            </mesh>
            {/* beak (pointing +Z) */}
            <mesh position={[0, -headR * 0.15, headR * 1.15]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <ConeG args={[headR * 0.32, headR * 0.8, 4]} />
              <Flat color={b.beak} />
            </mesh>
            {pebble ? (
              <mesh position={[0, -headR * 0.42, headR * 1.38]} castShadow>
                <IcoG args={[0.045, 0]} />
                <Flat color="#C9C2B4" />
              </mesh>
            ) : null}
            {kind === "chicken" ? (
              <>
                {[-0.08, 0, 0.08].map((z, i) => (
                  <mesh key={z} position={[0, headR * 0.95 + (i === 1 ? 0.03 : 0), z]} castShadow>
                    <BoxG args={[0.05, 0.12, 0.08]} />
                    <Flat color="#D63A30" />
                  </mesh>
                ))}
                <mesh position={[0, -headR * 0.6, headR * 0.85]} castShadow>
                  <BoxG args={[0.06, 0.12, 0.06]} />
                  <Flat color="#D63A30" />
                </mesh>
              </>
            ) : null}
            <group position={[0, headR * 0.3, headR * 0.92]}>
              <ToonEyes face={face} size={headR * 0.5} spacing={headR * 0.4} browColor={kind === "crow" ? "#5A5E70" : "#1E1A22"} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

// ---------- Chimp ----------
export type ChimpProps = {
  position: V3;
  yaw?: number;
  scale?: number;
  /** Arm pitch forward/up from hanging [left, right] (radians). */
  arms?: [number, number];
  /** Arm roll outward [left, right]. */
  armRoll?: [number, number];
  elbows?: [number, number];
  walk?: number;
  /** Forward lean of the body (radians); 0.5 ≈ knuckle-walking hunch. */
  lean?: number;
  headYaw?: number;
  headPitch?: number;
  face?: Face;
};

const CHIMP = { fur: "#3B2A22", furLight: "#56402F", skin: "#C9A27E", skinShade: "#A9825F" };

/** Standing chimp, ≈ 2.5 tall at scale 1 (Slavoski is 4.2). Long arms, big ears, cartoon eyes. */
export const Chimp: React.FC<ChimpProps> = ({
  position,
  yaw = 0,
  scale = 1,
  arms = [0.1, 0.1],
  armRoll = [0.12, 0.12],
  elbows = [0.2, 0.2],
  walk = 0,
  lean = 0.12,
  headYaw = 0,
  headPitch = 0,
  face,
}) => {
  const s = Math.sin(walk * Math.PI * 2);
  const hipY = 0.78 + (walk ? Math.abs(s) * 0.03 : 0);
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      {/* legs */}
      {[1, -1].map((sx) => (
        <group key={sx} position={[sx * 0.22, hipY, 0]} rotation={[walk ? 0.45 * s * sx : 0, 0, 0]}>
          <mesh position={[0, -0.36, 0]} castShadow>
            <BoxG args={[0.28, 0.74, 0.32]} />
            <Flat color={CHIMP.fur} />
          </mesh>
          <mesh position={[0, -hipY + 0.06, 0.1]} castShadow>
            <BoxG args={[0.3, 0.12, 0.46]} />
            <Flat color={CHIMP.skinShade} />
          </mesh>
        </group>
      ))}
      {/* body leans from the hips */}
      <group position={[0, hipY - 0.05, 0]} rotation={[lean, 0, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <BoxG args={[0.92, 1.0, 0.62]} />
          <Flat color={CHIMP.fur} />
        </mesh>
        <mesh position={[0, 0.42, 0.29]} castShadow>
          <BoxG args={[0.56, 0.62, 0.08]} />
          <Flat color={CHIMP.furLight} />
        </mesh>
        {/* arms */}
        {[1, -1].map((sx, i) => (
          <group key={sx} position={[sx * 0.56, 0.86, 0]} rotation={[-arms[i], 0, sx * armRoll[i]]}>
            <mesh position={[0, -0.3, 0]} castShadow>
              <BoxG args={[0.24, 0.66, 0.26]} />
              <Flat color={CHIMP.fur} />
            </mesh>
            <group position={[0, -0.6, 0]} rotation={[-elbows[i], 0, 0]}>
              <mesh position={[0, -0.3, 0]} castShadow>
                <BoxG args={[0.22, 0.62, 0.24]} />
                <Flat color={CHIMP.fur} />
              </mesh>
              <mesh position={[0, -0.66, 0.02]} castShadow>
                <BoxG args={[0.24, 0.22, 0.26]} />
                <Flat color={CHIMP.skin} />
              </mesh>
            </group>
          </group>
        ))}
        {/* head */}
        <group position={[0, 1.3, 0.04]} rotation={[-headPitch - lean * 0.8, headYaw, 0, "YXZ"]}>
          <mesh castShadow>
            <IcoG args={[0.42, 2]} />
            <Flat color={CHIMP.fur} />
          </mesh>
          <mesh position={[0, -0.02, 0.27]} scale={[0.32, 0.3, 0.16]} castShadow>
            <IcoG args={[1, 2]} />
            <Flat color={CHIMP.skin} />
          </mesh>
          <mesh position={[0, -0.18, 0.36]} castShadow>
            <BoxG args={[0.36, 0.22, 0.2]} />
            <Flat color={CHIMP.skin} />
          </mesh>
          <mesh position={[0, -0.12, 0.465]}>
            <BoxG args={[0.12, 0.04, 0.02]} />
            <Flat color={CHIMP.skinShade} />
          </mesh>
          <mesh position={[0, -0.27 - (face?.mouth ?? 0) * 0.04, 0.44]}>
            <BoxG args={[0.2, 0.025 + (face?.mouth ?? 0) * 0.08, 0.06]} />
            <Flat color={P.mouth} />
          </mesh>
          <mesh position={[0, 0.16, 0.33]} castShadow>
            <BoxG args={[0.56, 0.1, 0.16]} />
            <Flat color={CHIMP.fur} />
          </mesh>
          {[1, -1].map((sx) => (
            <mesh key={sx} position={[sx * 0.43, 0.02, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <CylG args={[0.13, 0.13, 0.06, 8]} />
              <Flat color={CHIMP.skin} />
            </mesh>
          ))}
          <group position={[0, 0.04, 0.42]}>
            <ToonEyes face={face} size={0.11} spacing={0.11} />
          </group>
        </group>
      </group>
    </group>
  );
};

// ---------- Octopus ----------
export type OctopusProps = {
  position: V3;
  yaw?: number;
  scale?: number;
  /** Seconds, drives the idle tentacle wave. */
  t: number;
  face?: Face;
  /** Tentacle i reaches up toward +Y (0..1), e.g. to push a tank lid. */
  reach?: Partial<Record<number, number>>;
  color?: string;
};

const Tentacle: React.FC<{ angle: number; t: number; seed: number; reach: number; color: string; under: string }> = ({ angle, t, seed, reach, color, under }) => {
  const n = 7;
  const len = 0.16;
  let node: React.ReactNode = null;
  for (let i = n - 1; i >= 0; i--) {
    const r0 = 0.09 * (1 - i / n) + 0.018;
    const r1 = 0.09 * (1 - (i + 1) / n) + 0.014;
    const wave = Math.sin(t * 2.2 + seed * 1.7 + i * 0.7) * 0.22;
    // Idle: arms go out and down from the mantle, then curl up at the tips. Reach: a straight arm
    // angled out and up past the mantle (toward a tank lid).
    const curl = i === 0 ? 1.85 : -0.1 - i * 0.04 + wave;
    const bend = curl + ((i === 0 ? 0.8 : -0.03) - curl) * reach;
    node = (
      <group position={[0, i === 0 ? 0 : len, 0]} rotation={[bend, 0, 0]}>
        <mesh position={[0, len / 2, 0]} castShadow>
          <CylG args={[r1, r0, len + 0.01, 6]} />
          <Flat color={i % 2 ? under : color} />
        </mesh>
        {node}
      </group>
    );
  }
  return <group rotation={[0, angle, 0]}>{node}</group>;
};

/** Octopus ≈ 1.3 tall at scale 1: a big mantle with cartoon eyes and eight waving arms. */
export const Octopus: React.FC<OctopusProps> = ({ position, yaw = 0, scale = 1, t, face, reach = {}, color = "#C4506A" }) => {
  const under = "#D9788C";
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      <group position={[0, 0.32, 0]}>
        {Array.from({ length: 8 }, (_, i) => (
          <Tentacle key={i} angle={(i / 8) * Math.PI * 2 + 0.2} t={t} seed={i} reach={reach[i] ?? 0} color={color} under={under} />
        ))}
      </group>
      <mesh position={[0, 0.42, 0.04]} scale={[0.36, 0.22, 0.36]} castShadow>
        <IcoG args={[1, 2]} />
        <Flat color={color} />
      </mesh>
      <group position={[0, 0.78, -0.06]} rotation={[-0.25 + Math.sin(t * 1.3) * 0.04, 0, 0]}>
        <mesh scale={[0.42, 0.5, 0.46]} castShadow receiveShadow>
          <IcoG args={[1, 2]} />
          <Flat color={color} />
        </mesh>
        {[
          [0.2, 0.25, 0.32],
          [-0.24, 0.12, 0.3],
          [0.05, 0.4, 0.24],
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]}>
            <IcoG args={[0.05, 0]} />
            <Flat color={under} />
          </mesh>
        ))}
      </group>
      <group position={[0, 0.56, 0.4]}>
        <ToonEyes face={face} size={0.13} spacing={0.15} />
      </group>
    </group>
  );
};
