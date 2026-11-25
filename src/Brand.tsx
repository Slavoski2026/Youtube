/**
 * Channel branding, rendered from the real Slavoski rig (no redraws):
 *   - Brand-Profile: YouTube profile picture, 1080×1080 (head and shoulders, golden-orange rim light).
 *   - Brand-Banner:  YouTube channel banner, 2560×1440 (all text and his face inside the
 *                    1546×423 centre safe area; the rest is a low-poly "what if" universe).
 *
 *   npx remotion bundle src/index.ts --out-dir=build
 *   npx remotion still build Brand-Profile branding/SLAVOSKI_Profile_Picture.png --gl=swangle
 *   npx remotion still build Brand-Banner branding/SLAVOSKI_Channel_Banner.png --gl=swangle
 *
 * Canvases are always 2× supersampled here (these are stills, so the cost is one frame).
 */
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, random, useVideoConfig } from "remotion";
import * as THREE from "three";
import { FutureTower, type TowerKind } from "./episodes/no-work-2036/future";
import { DetailProvider, useDetailLevel } from "./slavoski/detail";
import { FONT, loadHouseFonts } from "./slavoski/fonts";
import { Halo } from "./slavoski/materials";
import type { V3 } from "./slavoski/noise";
import { P } from "./slavoski/palette";
import { Hero, mergePose, REST, type Pose } from "./slavoski/rig/Hero";
import { CanvasPanel, CANVAS_FONT } from "./slavoski/screens";
import { FacetedMoon } from "./slavoski/space";
import { Stars, type CameraSpec } from "./slavoski/Stage";

loadHouseFonts();

export const BANNER = { width: 2560, height: 1440, safe: { w: 1546, h: 423 } };
export const PROFILE = { width: 1080, height: 1080 };

// ------------------------------------------------------------------ shared canvas

const CameraRig: React.FC<{ cam: CameraSpec }> = ({ cam }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...cam.position);
    camera.up.set(0, 1, 0);
    camera.lookAt(...cam.target);
    camera.fov = cam.fov ?? 40;
    camera.updateProjectionMatrix();
  });
  return null;
};

const BrandCanvas: React.FC<{ cam: CameraSpec; fog?: [string, number, number]; children: React.ReactNode }> = ({ cam, fog, children }) => {
  const { width, height } = useVideoConfig();
  const detail = useDetailLevel();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      flat
      shadows="percentage"
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      dpr={2}
      camera={{ fov: cam.fov ?? 40, near: 0.1, far: 6000, position: cam.position }}
    >
      <CameraRig cam={cam} />
      {fog ? <fog attach="fog" args={fog} /> : null}
      <DetailProvider value={detail}>{children}</DetailProvider>
    </ThreeCanvas>
  );
};

/** World point that lands on pixel (px, py) at `dist` units in front of the camera. Lays out the backdrop in pixels. */
const atPixel = (cam: CameraSpec, W: number, H: number, px: number, py: number, dist: number): V3 => {
  const c = new THREE.PerspectiveCamera(cam.fov ?? 40, W / H, 0.1, 6000);
  c.position.set(...cam.position);
  c.lookAt(...cam.target);
  c.updateMatrixWorld();
  const fwd = new THREE.Vector3();
  c.getWorldDirection(fwd);
  const dir = new THREE.Vector3((px / W) * 2 - 1, 1 - (py / H) * 2, 0.5).unproject(c).sub(c.position).normalize();
  const p = c.position.clone().add(dir.multiplyScalar(dist / dir.dot(fwd)));
  return [p.x, p.y, p.z];
};

/** World units per pixel at `dist` in front of the camera. */
const unitsPerPx = (cam: CameraSpec, H: number, dist: number) => (2 * dist * Math.tan(((cam.fov ?? 40) * Math.PI) / 360)) / H;

const RimLight: React.FC<{ color: string; intensity: number; from: V3 }> = ({ color, intensity, from }) => (
  <directionalLight color={color} intensity={intensity} position={from} />
);

const KeyLight: React.FC<{ color: string; intensity: number; from: V3; size?: number; target?: V3 }> = ({ color, intensity, from, size = 6, target = [0, 2.5, 0] }) => {
  const light = useMemo(() => new THREE.DirectionalLight(), []);
  useLayoutEffect(() => {
    light.target.position.set(...target);
    light.target.updateMatrixWorld();
  });
  return (
    <primitive
      object={light}
      color={color}
      intensity={intensity}
      position={[target[0] + from[0], target[1] + from[1], target[2] + from[2]]}
      castShadow
      shadow-mapSize={[4096, 4096]}
      shadow-bias={-0.0004}
      shadow-normalBias={0.02}
      shadow-camera-left={-size}
      shadow-camera-right={size}
      shadow-camera-top={size}
      shadow-camera-bottom={-size}
      shadow-camera-near={0.5}
      shadow-camera-far={80}
    />
  );
};

// ------------------------------------------------------------------ props

/** A faceted shard: a low-poly solid stretched along one axis, dark slate that catches the rim light. */
const Shard: React.FC<{ position: V3; size: number; seed: string; color?: string; glow?: boolean }> = ({ position, size, seed, color = "#48507E", glow }) => {
  const geom = useMemo(() => {
    const k = Math.floor(random(`${seed}k`) * 3);
    const g = k === 0 ? new THREE.OctahedronGeometry(1, 0) : k === 1 ? new THREE.TetrahedronGeometry(1.2, 0) : new THREE.IcosahedronGeometry(1, 0);
    // jitter vertices so no two shards are the same solid (shared corners move together)
    const pos = g.getAttribute("position");
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const key = `${seed}${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
      v.multiplyScalar(0.8 + random(key) * 0.4);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, [seed]);
  const stretch = 1.3 + random(`${seed}s`) * 0.9;
  const rot: V3 = [random(`${seed}rx`) * Math.PI, random(`${seed}ry`) * Math.PI, random(`${seed}rz`) * Math.PI];
  return (
    <group position={position} rotation={rot} scale={[size, size * stretch, size]}>
      <mesh geometry={geom} castShadow>
        <meshLambertMaterial color={color} flatShading emissive={glow ? P.brandOrange : "#1A1E36"} emissiveIntensity={glow ? 0.75 : 1} />
      </mesh>
    </group>
  );
};

/** The floating rock island Slavoski stands on (top face at y = 0). */
const FloatingIsland: React.FC<{ radius?: number; seed?: string }> = ({ radius = 2.1, seed = "isle" }) => {
  const under = useMemo(() => {
    const g = new THREE.ConeGeometry(radius, radius * 1.7, 9, 3);
    g.rotateX(Math.PI);
    const pos = g.getAttribute("position");
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      if (v.y < radius * 0.84) {
        const key = `${seed}${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
        v.x *= 0.85 + random(key) * 0.3;
        v.z *= 0.85 + random(`${key}z`) * 0.3;
        v.y += (random(`${key}y`) - 0.5) * 0.25;
      }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, [radius, seed]);
  return (
    <group>
      {/* top slab */}
      <mesh position={[0, -0.18, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[radius, radius * 0.97, 0.36, 9]} />
        <meshLambertMaterial color="#3A3F5E" flatShading />
      </mesh>
      {/* rocky underside */}
      <mesh geometry={under} position={[0, -0.36 - radius * 0.85, 0]} castShadow>
        <meshLambertMaterial color="#2A2C44" flatShading />
      </mesh>
      {/* a glowing seam under the lip, the "other reality" leaking through */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[radius * 0.98, radius * 0.9, 0.06, 9, 1, true]} />
        <meshBasicMaterial color={P.brandOrange} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

/** The faceted sun: per-face orange-to-gold, unlit, with a big soft glow. */
const BigSun: React.FC<{ position: V3; radius: number }> = ({ position, radius }) => {
  const geom = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(radius, 3).toNonIndexed();
    const pos = g.getAttribute("position");
    const colors = new Float32Array(pos.count * 3);
    const a = new THREE.Color(P.brandOrange);
    const b = new THREE.Color(P.brandGold);
    const c = new THREE.Color("#B23A16");
    const n = new THREE.Vector3();
    for (let f = 0; f < pos.count / 3; f++) {
      n.fromBufferAttribute(pos, f * 3);
      // brighter toward the top-left limb (facing the scene), deeper orange at the bottom
      const up = THREE.MathUtils.clamp(0.5 + n.y / radius * 0.5 - n.x / radius * 0.15, 0, 1);
      const r = random(`sun${f}`);
      const col = c.clone().lerp(new THREE.Color("#E06A1C"), Math.min(1, up * 1.3)).lerp(a, Math.max(0, up - 0.55) * 1.8).lerp(b, Math.max(0, up - 0.88) * 2.5).multiplyScalar(0.84 + r * 0.24);
      for (let k = 0; k < 3; k++) colors.set([col.r, col.g, col.b], (f * 3 + k) * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [radius]);
  return (
    <group position={position}>
      <mesh geometry={geom}>
        <meshBasicMaterial vertexColors toneMapped={false} fog={false} />
      </mesh>
      <Halo size={radius * 4.2} color={P.brandOrange} opacity={0.42} />
      <Halo size={radius * 2.6} color="#F27A1A" opacity={0.22} />
    </group>
  );
};

/** Red countdown display: digits on dark glass in a faceted bezel. */
const drawCountdown = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  ctx.fillStyle = "#14070C";
  ctx.fillRect(0, 0, W, H);
  // scanlines
  ctx.fillStyle = "rgba(255,60,60,0.05)";
  for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = CANVAS_FONT(H * 0.13);
  ctx.fillStyle = "rgba(255,90,90,0.75)";
  ctx.fillText("T  M I N U S", W / 2, H * 0.2);
  ctx.font = CANVAS_FONT(H * 0.46);
  ctx.shadowColor = "#FF2A2A";
  ctx.shadowBlur = H * 0.12;
  ctx.fillStyle = "#FF4A3A";
  ctx.fillText("00:00:07", W / 2, H * 0.6);
  ctx.shadowBlur = H * 0.04;
  ctx.fillStyle = "#FFB0A0";
  ctx.fillText("00:00:07", W / 2, H * 0.6);
  ctx.shadowBlur = 0;
};

const Countdown: React.FC<{ position: V3; yaw: number; w: number }> = ({ position, yaw, w }) => {
  const h = w * 0.42;
  return (
    <group position={position} rotation={[0.04, yaw, -0.05]}>
      <mesh position={[0, 0, -0.12]} castShadow>
        <boxGeometry args={[w + 0.36, h + 0.36, 0.2]} />
        <meshLambertMaterial color="#1A1C2C" flatShading />
      </mesh>
      <CanvasPanel position={[0, 0, 0]} w={w} h={h} px={1024} draw={drawCountdown} fog={false} />
      <Halo position={[0, 0, 0.3]} size={w * 2.4} color="#FF2A2A" opacity={0.22} />
    </group>
  );
};

// ------------------------------------------------------------------ profile picture

const PROFILE_CAM: CameraSpec = { position: [0, 3.8, 9.06], target: [0, 3.33, 0], fov: 18.5 };

export const ProfilePicture: React.FC = () => {
  const pose: Pose = mergePose(REST, {
    expression: "curious",
    headRoll: 0.07,
    headPitch: -0.035,
    lShoulder: [0.02, 0.1],
    rShoulder: [0.02, 0.1],
  });
  return (
    <AbsoluteFill style={{ background: P.brandNavy }}>
      {/* ambient glow behind the head: warm core, golden falloff, deep navy edge */}
      <AbsoluteFill
        style={{
          background: [
            "radial-gradient(circle at 50% 40%, rgba(255,189,73,0.72) 0%, rgba(232,149,36,0.5) 22%, rgba(232,149,36,0.2) 38%, rgba(11,18,36,0) 56%)",
            "radial-gradient(circle at 50% 50%, #142046 0%, #0B1224 60%, #070B18 100%)",
          ].join(", "),
        }}
      />
      <BrandCanvas cam={PROFILE_CAM}>
        <hemisphereLight args={["#AEB8E8", "#2A1A14", 1.1]} />
        <KeyLight color="#FFF0DE" intensity={2.25} from={[-5.5, 4.5, 7.5]} target={[0, 3, 0]} size={4} />
        <RimLight color={P.brandGold} intensity={26} from={[-6, 1.2, -6.5]} />
        <RimLight color={P.brandOrange} intensity={30} from={[6, 1.0, -6.5]} />
        <Hero pose={pose} />
      </BrandCanvas>
      {/* the body sinks into shadow so the face carries the image */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(11,18,36,0) 66%, rgba(11,18,36,0.5) 88%, rgba(11,18,36,0.72) 100%)" }} />
      {/* corners only (they fall outside the circular crop anyway) */}
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 62%, rgba(4,6,14,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ banner

/** Character and text sit inside the safe area: x 507..2053, y 508.5..931.5. */
const BANNER_CAM: CameraSpec = { position: [2.89, 3.36, 22.7], target: [2.89, 3.36, 0], fov: 20 };
const SAFE = {
  left: (BANNER.width - BANNER.safe.w) / 2,
  top: (BANNER.height - BANNER.safe.h) / 2,
  right: (BANNER.width + BANNER.safe.w) / 2,
  bottom: (BANNER.height + BANNER.safe.h) / 2,
};
/** Left edge of the headline block (Slavoski stands just left of it). */
const TEXT_LEFT = 1000;

/** Backdrop fragments, placed in pixels (kept clear of the headline block and his face). */
const FRAGMENTS: { px: number; py: number; dist: number; size: number; glow?: boolean }[] = [
  { px: 90, py: 560, dist: 50, size: 0.55 },
  { px: 160, py: 1250, dist: 60, size: 0.9 },
  { px: 540, py: 1090, dist: 30, size: 0.3, glow: true },
  { px: 790, py: 250, dist: 90, size: 0.75 },
  { px: 1010, py: 1180, dist: 32, size: 0.28 },
  { px: 1060, py: 400, dist: 46, size: 0.3, glow: true },
  { px: 1330, py: 1290, dist: 42, size: 0.45 },
  { px: 1460, py: 290, dist: 80, size: 0.85 },
  { px: 1690, py: 130, dist: 120, size: 1.3 },
  { px: 1890, py: 410, dist: 50, size: 0.42, glow: true },
  { px: 2210, py: 320, dist: 70, size: 1.0 },
  { px: 2470, py: 610, dist: 45, size: 0.45 },
  { px: 2090, py: 1330, dist: 30, size: 0.55 },
];

/** The skyline, in pixels: each tower's x and the y its roof reaches (low under the type, taller at the edges). */
type TowerPick = { px: number; top: number; dist: number; w: number; kind: TowerKind; color: string; seed: string };
const CITY: TowerPick[] = (() => {
  const out: TowerPick[] = [];
  const kinds: TowerKind[] = ["glass", "stepped", "twist", "round", "spire", "glass"];
  const bodies = [P.bldgNavy, P.bldgIndigo, P.bldgPurple, P.bldgTeal, "#262C4A"];
  const n = 44;
  for (let i = 0; i < n; i++) {
    const px = -40 + (i / (n - 1)) * 2640 + (random(`cx${i}`) - 0.5) * 36;
    const r = random(`ch${i}`);
    let top: number;
    if (px < 470) top = 900 + r * 160; // left edge (desktop strip), under the countdown
    else if (px < 1950) top = 1080 + r * 130; // under Slavoski and the headline
    else top = 880 + r * 180; // right edge, in front of the sun
    out.push({
      px,
      top,
      dist: 880 + random(`cd${i}`) * 220,
      w: 9 + random(`cw${i}`) * 9,
      kind: kinds[Math.floor(random(`ck${i}`) * kinds.length)],
      color: bodies[Math.floor(random(`cc${i}`) * bodies.length)],
      seed: `bt${i}`,
    });
  }
  // two needle spires crossing the sun's disc
  out.push({ px: 2215, top: 700, dist: 900, w: 10, kind: "spire", color: "#262C4A", seed: "needle-a" });
  out.push({ px: 2440, top: 760, dist: 950, w: 12, kind: "round", color: P.bldgIndigo, seed: "needle-b" });
  return out;
})();

export const ChannelBanner: React.FC = () => {
  const { width: W, height: H } = useVideoConfig();
  const cam = BANNER_CAM;
  const at = (px: number, py: number, dist: number) => atPixel(cam, W, H, px, py, dist);
  const upp = (dist: number) => unitsPerPx(cam, H, dist);

  // Relaxed stance, body angled toward the headline, face back to the viewer, a small open gesture at the type.
  const pose: Pose = mergePose(REST, {
    expression: "curious",
    headYaw: -0.26,
    headRoll: 0.05,
    headPitch: -0.02,
    lShoulder: [0.42, 0.3],
    lElbow: 0.95,
    rShoulder: [0.04, 0.14],
    rElbow: 0.22,
    lHip: [0, 0.06],
    rHip: [0, 0.06],
  });

  const cityBase = 1500; // tower bases sit just below the frame
  const sunDist = 1700;
  const sun = at(2450, 1320, sunDist);
  const sunR = 640 * upp(sunDist);
  const moonBig = at(330, 300, 520);
  const moonSmall = at(640, 150, 700);

  return (
    <AbsoluteFill style={{ background: P.brandNavy, overflow: "hidden" }}>
      {/* sky: navy centre, warm orange light gathering at both edges and along the horizon */}
      <AbsoluteFill
        style={{
          background: [
            "radial-gradient(ellipse 40% 55% at 96% 88%, rgba(255,189,73,0.5) 0%, rgba(232,149,36,0.34) 32%, rgba(232,149,36,0) 100%)",
            "radial-gradient(ellipse 26% 62% at 0% 78%, rgba(232,149,36,0.38) 0%, rgba(190,84,40,0.16) 48%, rgba(11,18,36,0) 100%)",
            "radial-gradient(ellipse 70% 24% at 50% 100%, rgba(232,149,36,0.34) 0%, rgba(11,18,36,0) 100%)",
            // the same warm glow that sits behind him in the profile picture
            "radial-gradient(circle 430px at 760px 690px, rgba(255,189,73,0.34) 0%, rgba(232,149,36,0.2) 38%, rgba(232,149,36,0) 100%)",
            "radial-gradient(ellipse 55% 55% at 52% 42%, #142250 0%, #0B1224 60%, #080D1C 100%)",
          ].join(", "),
        }}
      />
      <BrandCanvas cam={cam} fog={["#2A2036", 500, 1500]}>
        <Stars count={1600} radius={3000} seed="banner" size={2.6} opacity={0.6} />
        <hemisphereLight args={["#A6B2E6", "#2A1A16", 1.1]} />
        <KeyLight color="#EEF0FF" intensity={1.9} from={[-5, 4.5, 8]} target={[0, 2.4, 0]} size={5} />
        <RimLight color={P.brandOrange} intensity={26} from={[7, 1.2, -6]} />
        <RimLight color={P.brandGold} intensity={18} from={[-7, 1.6, -6]} />

        {/* the enormous sun, low on the right, behind the city */}
        <BigSun position={sun} radius={sunR} />

        {/* two moons, high on the left */}
        <FacetedMoon position={moonBig} radius={150 * upp(520)} detail={4} seed="banner-moon-a" rotation={[0.3, 1.1, 0]} />
        <FacetedMoon position={moonSmall} radius={56 * upp(700)} detail={3} seed="banner-moon-b" rotation={[1.2, 0.2, 0.4]} />
        <Halo position={moonBig} size={150 * upp(520) * 4} color="#9FB0E0" opacity={0.16} />

        {/* the mysterious future city: far off, hazy, silhouetted against the sun */}
        {CITY.map((t) => {
          const base = at(t.px, cityBase, t.dist);
          const h = (cityBase - t.top) * upp(t.dist);
          return (
            <FutureTower
              key={t.seed}
              kind={t.kind}
              position={base}
              w={t.w}
              d={t.w}
              h={h}
              seed={t.seed}
              color={t.color}
              style="dusk"
              t={0.3}
              power={0.85}
            />
          );
        })}

        {/* the countdown, floating on the left */}
        <Countdown position={at(285, 730, 46)} yaw={0.4} w={300 * upp(46)} />

        {/* floating fragments */}
        {FRAGMENTS.map((f, i) => (
          <Shard key={i} position={at(f.px, f.py, f.dist)} size={f.size} seed={`frag${i}`} glow={f.glow} />
        ))}

        {/* Slavoski on his floating island */}
        <group rotation={[0, 0.28, 0]}>
          <FloatingIsland />
          <Hero pose={pose} />
        </group>
        <Shard position={[-1.2, -4.2, 0.6]} size={0.32} seed="isle-rock-a" />
        <Shard position={[1.5, -3.4, -0.4]} size={0.24} seed="isle-rock-b" />
      </BrandCanvas>

      {/* the city's feet dissolve into a warm haze */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,16,34,0) 78%, rgba(30,20,34,0.55) 100%)" }} />

      {/* headline lockup, right of Slavoski, inside the safe area */}
      <div
        style={{
          position: "absolute",
          left: TEXT_LEFT,
          top: SAFE.top,
          height: BANNER.safe.h,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          fontFamily: FONT,
          fontWeight: 700,
          color: P.white,
        }}
      >
        <div style={{ fontSize: 162, lineHeight: 0.9, letterSpacing: "0.05em", marginLeft: -8, textShadow: "0 8px 40px rgba(0,0,0,0.55)" }}>SLAVOSKI</div>
        <div style={{ fontSize: 60, lineHeight: 1, letterSpacing: "0.098em", color: P.brandGold, marginTop: 34, textShadow: "0 4px 24px rgba(0,0,0,0.6)" }}>
          QUESTION EVERYTHING.
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 30, gap: 20 }}>
          <div style={{ width: 50, height: 5, background: P.brandOrange, borderRadius: 3 }} />
          <div style={{ fontSize: 40, lineHeight: 1, letterSpacing: "0.2em", textShadow: "0 3px 18px rgba(0,0,0,0.6)" }}>NEW WHAT IF VIDEOS DAILY</div>
        </div>
      </div>
      {/* soft edge vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,0) 62%, rgba(5,6,14,0.4) 100%)" }} />
    </AbsoluteFill>
  );
};

/** Review overlay: draws the safe area and the circle crop (never in the exports). */
export const SafeGuides: React.FC<{ kind: "banner" | "profile" }> = ({ kind }) =>
  kind === "banner" ? (
    <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top, width: BANNER.safe.w, height: BANNER.safe.h, outline: "3px dashed #00FF88" }} />
  ) : (
    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", outline: "3px dashed #00FF88" }} />
  );

export type BrandProps = { guides?: boolean };
export const BrandProfile: React.FC<BrandProps> = ({ guides }) => (
  <>
    <ProfilePicture />
    {guides ? <SafeGuides kind="profile" /> : null}
  </>
);
export const BrandBanner: React.FC<BrandProps> = ({ guides }) => (
  <>
    <ChannelBanner />
    {guides ? <SafeGuides kind="banner" /> : null}
  </>
);

