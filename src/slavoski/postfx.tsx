/**
 * The "cinematic" look (ep. 8 onward): post-processing inside every Stage canvas.
 *
 *   ambient occlusion (N8AO) → depth of field → god rays (optional, from the sun) → bloom → grade
 *
 * plus, outside the canvas, a seeded film grain. Everything is deterministic: no effect here uses
 * Math.random or a clock (N8AO's temporal accumulation stays off, the composer gets a fixed delta), so
 * frames rendered out of order in parallel tabs match.
 *
 * Episodes published before the upgrade are pinned to "classic" in Root.tsx with `withLook("classic", …)`
 * so their re-renders match what was published. New episodes get "cinematic" by default.
 *
 * The composer renders from R3F's frame loop (`useFrame` with priority 1), which Remotion's ThreeCanvas
 * drives with `advance()` once per video frame. That is the one allowed use of useFrame: rendering,
 * never motion.
 */
import { useFrame, useThree } from "@react-three/fiber";
import { N8AOPostPass } from "n8ao";
import {
  BlendFunction,
  Effect,
  BloomEffect,
  BrightnessContrastEffect,
  DepthOfFieldEffect,
  EffectComposer,
  EffectPass,
  GodRaysEffect,
  HueSaturationEffect,
  KernelSize,
  RenderPass,
} from "postprocessing";
import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo } from "react";
import { getInputProps, random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import type { V3 } from "./noise";

// ---------------------------------------------------------------- look level

export type Look = "classic" | "cinematic";
const LookContext = createContext<Look>("cinematic");
export const LookProvider = LookContext.Provider;
export const useLook = () => useContext(LookContext);

/** Pins a composition to a look (ep. 1–7 keep "classic"). Call at module level, not in render. */
export const withLook = <P extends object>(look: Look, Component: React.ComponentType<P>): React.FC<P> => {
  const Wrapped: React.FC<P> = (props) => (
    <LookProvider value={look}>
      <Component {...props} />
    </LookProvider>
  );
  Wrapped.displayName = `${look}(${Component.displayName ?? Component.name})`;
  return Wrapped;
};

// ---------------------------------------------------------------- settings

export type DofSettings = {
  /** Focus: a world point, or a distance from the camera. Default: the camera target. */
  focus?: V3 | number;
  /** Distance (world units) from the focus over which blur ramps to full. Default: half the focus distance (≥ 2). */
  range?: number;
  /** Blur size in pixels at 1080 wide (scaled for HQ). Default: 5 for close-ups down to 2.5 for wide shots. */
  bokeh?: number;
};

export type Fx = {
  /** Depth of field, or false for none (space diagrams, screens). */
  dof?: DofSettings | false;
  /** Bloom intensity (0 = off). Lit windows, lamps, neon, the sun and fire glow. */
  bloom?: number;
  /** Ambient occlusion intensity (0 = off): contact shadows in corners, under cars, between buildings. */
  ao?: number;
  /** AO radius in world units (hero scale: ~2; aerials: larger). */
  aoRadius?: number;
  /** Light shafts from a sun or bright light in frame. Only when it is in front of the camera. */
  godRays?: { position: V3; r?: number; color?: string; strength?: number };
  /** Colour grade: extra contrast and saturation (small values, e.g. 0.08). */
  contrast?: number;
  saturation?: number;
};

export const FX_DEFAULTS: Required<Omit<Fx, "godRays" | "dof">> & { dof: DofSettings } = {
  dof: {},
  bloom: 0.9,
  // AO costs the most on the GPU-less renderer (+1.7 s a frame, +4.7 s in HQ) and shows the least: off by
  // default; turn it on per shot for close interiors.
  ao: 0,
  aoRadius: 2.2,
  contrast: 0.07,
  saturation: 0.1,
};

// ---------------------------------------------------------------- sky inside the scene

/**
 * In cinematic mode the sky is drawn as the scene background (a canvas texture with the same gradient
 * the HTML sky uses), so the frame is opaque and bloom, god rays and depth of field behave.
 */
export const SceneSky: React.FC<{ sky: string; glow: string; gradient: boolean }> = ({ sky, glow, gradient }) => {
  const scene = useThree((s) => s.scene);
  const tex = useMemo(() => {
    const W = 270;
    const H = 480;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    if (gradient) {
      const mixC = (a: string, b: string, t: number) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, sky);
      g.addColorStop(0.22, sky);
      g.addColorStop(0.52, mixC(sky, glow, 0.55));
      g.addColorStop(0.78, glow);
      g.addColorStop(1, glow);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    } else {
      // radial-gradient(ellipse 85% 60% at 50% 42%, glow 0%, sky 70%)
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.translate(W * 0.5, H * 0.42);
      ctx.scale((W * 0.85) / (H * 0.6), 1);
      const r = H * 0.6;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, glow);
      g.addColorStop(0.7, sky);
      g.addColorStop(1, sky);
      ctx.fillStyle = g;
      ctx.fillRect(-r * 2, -r * 2, r * 4, r * 4);
      ctx.restore();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [sky, glow, gradient]);
  useLayoutEffect(() => {
    const prev = scene.background;
    scene.background = tex;
    return () => {
      scene.background = prev;
    };
  }, [scene, tex]);
  useEffect(() => () => tex.dispose(), [tex]);
  return null;
};

// ---------------------------------------------------------------- the composer

/**
 * Replaces NaN/Inf pixels with black. A single bad pixel (a reflector's edge, a degenerate normal) would
 * otherwise be spread by the bloom blur into a white sheet over the frame.
 */
class SanitizeEffect extends Effect {
  constructor() {
    super(
      "SanitizeEffect",
      `void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec4 c = inputColor;
        bool bad = any(isnan(c)) || any(isinf(c)) || c.r > 64.0 || c.g > 64.0 || c.b > 64.0;
        outputColor = bad ? vec4(0.0, 0.0, 0.0, 1.0) : c;
      }`,
      { blendFunction: BlendFunction.NORMAL },
    );
  }
}

/** Test switch: `--props='{"fxOff":["ao","dof","bloom","msaa","grade"]}'` turns parts off to time them. */
const fxOff = (): string[] => {
  try {
    return ((getInputProps() as { fxOff?: string[] }).fxOff ?? []) as string[];
  } catch {
    return [];
  }
};

export const PostFX: React.FC<{ fx: Fx; hq: boolean; focusDistance: number }> = ({ fx: fxIn, hq, focusDistance }) => {
  const off = fxOff();
  const fx: Fx = { ...fxIn, ...(off.includes("ao") ? { ao: 0 } : {}), ...(off.includes("dof") ? { dof: false } : {}), ...(off.includes("bloom") ? { bloom: 0 } : {}) };
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const dpr = hq ? 2 : 1;
  const dof = fx.dof === false ? null : { ...FX_DEFAULTS.dof, ...(fx.dof ?? {}) };
  const bloom = fx.bloom ?? FX_DEFAULTS.bloom;
  const ao = fx.ao ?? FX_DEFAULTS.ao;
  const aoRadius = fx.aoRadius ?? FX_DEFAULTS.aoRadius;
  const contrast = fx.contrast ?? FX_DEFAULTS.contrast;
  const saturation = fx.saturation ?? FX_DEFAULTS.saturation;
  const hasGod = Boolean(fx.godRays);

  const sun = useMemo(() => {
    if (!hasGod) return null;
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: "#FFF4D8", fog: false, toneMapped: false }));
    m.frustumCulled = false;
    return m;
  }, [hasGod]);

  const fxObjects = useMemo(() => {
    const composer = new EffectComposer(gl, { frameBufferType: THREE.HalfFloatType, multisampling: hq || off.includes("msaa") ? 0 : 2 });
    composer.addPass(new RenderPass(scene, camera));
    let aoPass: N8AOPostPass | null = null;
    if (ao > 0) {
      aoPass = new N8AOPostPass(scene, camera, size.width * dpr, size.height * dpr);
      aoPass.configuration.aoSamples = 8;
      aoPass.configuration.denoiseSamples = 4;
      aoPass.configuration.denoiseRadius = 8;
      aoPass.configuration.halfRes = true;
      aoPass.configuration.accumulate = false;
      aoPass.configuration.gammaCorrection = false;
      composer.addPass(aoPass);
    }
    composer.addPass(new EffectPass(camera, new SanitizeEffect()));
    let dofEffect: DepthOfFieldEffect | null = null;
    if (dof) {
      dofEffect = new DepthOfFieldEffect(camera, { focusDistance: 10, focusRange: 5, bokehScale: 3, resolutionScale: hq ? 0.25 : 0.5 });
      composer.addPass(new EffectPass(camera, dofEffect));
    }
    const effects = [];
    let god: GodRaysEffect | null = null;
    if (sun) {
      god = new GodRaysEffect(camera, sun, {
        blendFunction: BlendFunction.SCREEN,
        samples: 60,
        density: 0.96,
        decay: 0.93,
        weight: 0.35,
        exposure: 0.5,
        clampMax: 1,
        resolutionScale: 0.5,
        kernelSize: KernelSize.SMALL,
        blur: true,
      });
      effects.push(god);
    }
    let bloomEffect: BloomEffect | null = null;
    if (bloom > 0) {
      bloomEffect = new BloomEffect({ mipmapBlur: true, luminanceThreshold: 0.72, luminanceSmoothing: 0.25, intensity: bloom, radius: 0.75 });
      effects.push(bloomEffect);
    }
    effects.push(new BrightnessContrastEffect({ contrast }), new HueSaturationEffect({ saturation }));
    composer.addPass(new EffectPass(camera, ...effects));
    return { composer, aoPass, dofEffect, god, bloomEffect };
    // Structural changes rebuild the chain; values below are updated every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera, hq, ao > 0, Boolean(dof), sun, bloom > 0]);

  useLayoutEffect(() => {
    fxObjects.composer.setSize(size.width, size.height);
  }, [fxObjects, size.width, size.height]);
  useEffect(() => () => fxObjects.composer.dispose(), [fxObjects]);

  // Per-frame values.
  useLayoutEffect(() => {
    const { aoPass, dofEffect, god, bloomEffect } = fxObjects;
    if (aoPass) {
      aoPass.configuration.intensity = ao;
      aoPass.configuration.aoRadius = aoRadius;
      aoPass.configuration.distanceFalloff = 1;
    }
    if (dofEffect && dof) {
      const f = dof.focus;
      const dist =
        f === undefined ? focusDistance : typeof f === "number" ? f : new THREE.Vector3(...f).distanceTo(camera.position);
      dofEffect.cocMaterial.focusDistance = dist;
      dofEffect.cocMaterial.focusRange = dof.range ?? Math.max(2, dist * 0.5);
      dofEffect.bokehScale = (dof.bokeh ?? Math.min(5, Math.max(2.5, 6 - dist * 0.15))) * dpr;
    }
    if (bloomEffect) bloomEffect.intensity = bloom;
    if (god && sun && fx.godRays) {
      const g = fx.godRays;
      sun.position.set(...g.position);
      sun.scale.setScalar(g.r ?? 6);
      (sun.material as THREE.MeshBasicMaterial).color.set(g.color ?? "#FFF4D8");
      god.godRaysMaterial.exposure = 0.5 * (g.strength ?? 1);
    }
  });

  useFrame(() => {
    fxObjects.composer.render(0);
  }, 1);

  return sun ? <primitive object={sun} /> : null;
};

// ---------------------------------------------------------------- film grain (HTML, seeded)

let grainUrl: string | null = null;
const grainTile = () => {
  if (grainUrl) return grainUrl;
  const S = 192;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(S, S);
  let h = 2166136261;
  for (let i = 0; i < S * S; i++) {
    h = Math.imul(h ^ (i + 0x9e3779b9), 16777619) >>> 0;
    h ^= h >>> 13;
    const v = h & 255;
    img.data.set([v, v, v, 255], i * 4);
  }
  ctx.putImageData(img, 0, 0);
  grainUrl = c.toDataURL("image/png");
  return grainUrl;
};

/** A faint, seeded film grain that moves every frame (identical on every render of that frame). */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => {
  const frame = useCurrentFrame();
  const x = Math.floor(random(`gx${frame}`) * 192);
  const y = Math.floor(random(`gy${frame}`) * 192);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundImage: `url(${grainTile()})`,
        backgroundPosition: `${x}px ${y}px`,
        opacity,
        mixBlendMode: "overlay",
      }}
    />
  );
};
