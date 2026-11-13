/**
 * Post-processing for the "crazy graphics" look (ep. 9 onward). Opt in per composition with `withFx(...)`
 * in Root.tsx; older episodes stay exactly as published. Override per render with `--props='{"fx":false}'`.
 *
 * Inside the canvas, `PostFX` takes over rendering (a useFrame at priority 1):
 *   1. the scene (sky drawn as the scene background, so the canvas is opaque) into a half-float target
 *      with a depth texture, 4× MSAA;
 *   2. bloom (UnrealBloomPass) on HDR highlights only: `Glow` materials are boosted above 1.0 by
 *      `GlowBoost`, so windows, lamps, fire, neon and screens bloom while lit surfaces don't;
 *   3. one finishing shader: depth of field (auto-focused on the camera target, thin-lens circle of
 *      confusion, near samples rejected so sharp subjects never bleed), chromatic aberration at the edges,
 *      hue-preserving highlight roll-off, saturation, contrast, split toning, vignette and seeded film grain.
 *
 * Everything is a pure function of the frame: grain is seeded by the frame number, nothing reads a clock.
 */
import { useFrame, useThree } from "@react-three/fiber";
import React, { createContext, useContext, useEffect, useMemo } from "react";
import { getInputProps } from "remotion";
import * as THREE from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

// ---------------------------------------------------------------- opt-in

const FxContext = createContext(false);
export const FxProvider = FxContext.Provider;

/** True when the current composition renders with post-processing (input prop `fx` overrides). */
export const useFxEnabled = (): boolean => {
  const ctx = useContext(FxContext);
  try {
    const p = getInputProps() as { fx?: boolean };
    if (typeof p.fx === "boolean") return p.fx;
  } catch {
    /* not rendering */
  }
  return ctx;
};

/** Turns post-processing on for a composition. Call at module level. */
export const withFx = <P extends object>(Component: React.ComponentType<P>): React.FC<P> => {
  const Wrapped: React.FC<P> = (props) => (
    <FxProvider value>
      <Component {...props} />
    </FxProvider>
  );
  Wrapped.displayName = `fx(${Component.displayName ?? Component.name})`;
  return Wrapped;
};

/** Multiplier for `Glow` colours inside the canvas: 1 without FX, >1 with FX so emissives bloom. */
export const GlowBoost = createContext(1);
export const GLOW_BOOST = 2.3;

// ---------------------------------------------------------------- grade

export type Grade = {
  exposure: number;
  /** Bloom strength (0 = off), radius 0..1 and threshold (linear HDR). */
  bloom: number;
  bloomRadius: number;
  bloomThreshold: number;
  saturation: number;
  /** 0 = linear, 1 = a strong S-curve. */
  contrast: number;
  /** Added to the shadows / highlights (perceptual space), e.g. cool shadows, warm highlights. */
  shadowTint: [number, number, number];
  highlightTint: [number, number, number];
  vignette: number;
  grain: number;
  /** Chromatic aberration at the frame edges (fraction of the frame). */
  aberration: number;
  /** Depth of field strength (0 = off). Circle of confusion ≈ dof × 0.06 / focus × |1 − focus/z| of the frame height. */
  dof: number;
  /** Focus distance in world units (default: camera → target). */
  focus?: number;
};

export const DEFAULT_GRADE: Grade = {
  exposure: 1.0,
  bloom: 0.9,
  bloomRadius: 0.55,
  bloomThreshold: 1.2,
  saturation: 1.14,
  contrast: 0.32,
  shadowTint: [-0.012, 0.004, 0.03],
  highlightTint: [0.025, 0.01, -0.02],
  vignette: 0.42,
  grain: 0.035,
  aberration: 0.0018,
  dof: 1,
};

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const frag = /* glsl */ `
#include <packing>
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform float cameraNear;
uniform float cameraFar;
uniform float logDepth;
uniform float focus;
uniform float cocScale;
uniform float maxCoc;
uniform vec2 resolution;
uniform float seed;
uniform float exposure;
uniform float saturation;
uniform float contrast;
uniform vec3 shadowTint;
uniform vec3 highlightTint;
uniform float vignette;
uniform float grain;
uniform float aberration;
varying vec2 vUv;

float viewDist(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  // log depth: d = log2(1 + w) / log2(far + 1)  =>  w = (far + 1)^d - 1
  if (logDepth > 0.5) return pow(cameraFar + 1.0, d) - 1.0;
  return -perspectiveDepthToViewZ(d, cameraNear, cameraFar);
}
// signed circle of confusion, in uv-height units (negative = in front of the focus plane)
float coc(float z) { return clamp(cocScale * (1.0 - focus / max(z, 0.001)), -maxCoc, maxCoc); }

vec3 srgbToLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 linearToSrgb(vec3 c) { c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
float hash(vec2 p) { p = fract(p * vec2(443.897, 441.423) + seed); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }

const int TAPS = 28;
const float GOLDEN = 2.39996323;

void main() {
  vec2 uv = vUv;
  vec3 sharp = texture2D(tColor, uv).rgb;
  vec3 col = sharp;

  // ---- depth of field (gather, near-sample rejection so in-focus edges never bleed)
  if (cocScale > 0.0) {
    float zc = viewDist(uv);
    float cc = abs(coc(zc));
    float px = 1.0 / resolution.y;
    if (cc > 0.8 * px) {
      vec3 acc = sharp;
      float wsum = 1.0;
      vec2 aspect = vec2(resolution.y / resolution.x, 1.0);
      for (int i = 1; i < TAPS; i++) {
        float fi = float(i);
        float r = sqrt(fi / float(TAPS)) * cc;
        float a = fi * GOLDEN;
        vec2 suv = uv + vec2(cos(a), sin(a)) * r * aspect;
        float zs = viewDist(suv);
        float cs = abs(coc(zs));
        // a nearer sample only spreads here if it is itself blurred that far
        float w = zs < zc - 0.05 ? smoothstep(r - px, r + px, cs) : 1.0;
        acc += texture2D(tColor, suv).rgb * w;
        wsum += w;
      }
      col = acc / wsum;
    }
  }

  // ---- chromatic aberration (radial, edges only)
  vec2 d = uv - 0.5;
  vec2 off = d * dot(d, d) * aberration * 8.0;
  col.r += texture2D(tColor, uv + off).r - sharp.r;
  col.b += texture2D(tColor, uv - off).b - sharp.b;

  // ---- exposure and hue-preserving highlight roll-off (hot stuff whitens a little)
  col = max(col * exposure, 0.0);
  float m = max(col.r, max(col.g, col.b));
  if (m > 0.75) {
    float k = 0.75 + 0.25 * (1.0 - exp(-(m - 0.75) / 0.25));
    vec3 c2 = col * (k / m);
    col = mix(c2, vec3(k), clamp((m - 1.0) * 0.22, 0.0, 0.55));
  }

  // ---- saturation
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(mix(vec3(l), col, saturation), 0.0);

  // ---- perceptual space: contrast S-curve, split toning, vignette, grain
  vec3 p = linearToSrgb(col);
  vec3 s = p * p * (3.0 - 2.0 * p);
  p = mix(p, s, contrast);
  float lp = dot(p, vec3(0.299, 0.587, 0.114));
  p += shadowTint * (1.0 - lp) * (1.0 - lp) + highlightTint * lp * lp;
  float v = smoothstep(0.95, 0.25, length(d * vec2(1.0, 1.25)));
  p *= mix(1.0, v, vignette);
  float n = hash(uv * resolution) - 0.5;
  p += n * grain * (0.6 + 0.4 * (1.0 - lp));
  gl_FragColor = vec4(clamp(p, 0.0, 1.0), 1.0);
}
`;

// ---------------------------------------------------------------- sky as a background texture

/** The Stage's CSS sky, drawn into a texture so the canvas is opaque under post-processing. */
export const skyTexture = (gradient: boolean, sky: string, glow: string, mid: string): THREE.CanvasTexture => {
  const W = 540;
  const H = 960;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  if (gradient) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, sky);
    g.addColorStop(0.22, sky);
    g.addColorStop(0.52, mid);
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
    ctx.scale(W * 0.85, H * 0.6);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, glow);
    g.addColorStop(0.7, sky);
    g.addColorStop(1, sky);
    ctx.fillStyle = g;
    ctx.fillRect(-2, -2, 4, 4);
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

// ---------------------------------------------------------------- the pipeline

export const PostFX: React.FC<{ frame: number; grade: Grade; target: [number, number, number] }> = ({ frame, grade, target }) => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const dpr = gl.getPixelRatio();
  const W = Math.max(1, Math.round(size.width * dpr));
  const H = Math.max(1, Math.round(size.height * dpr));

  const pipe = useMemo(() => {
    const depthTexture = new THREE.DepthTexture(W, H);
    depthTexture.type = THREE.UnsignedIntType;
    const sceneRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4, depthTexture });
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), grade.bloom, grade.bloomRadius, grade.bloomThreshold);
    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tColor: { value: sceneRT.texture },
        tDepth: { value: depthTexture },
        cameraNear: { value: 0.1 },
        cameraFar: { value: 3000 },
        logDepth: { value: 0 },
        focus: { value: 10 },
        cocScale: { value: 0 },
        maxCoc: { value: 0.016 },
        resolution: { value: new THREE.Vector2(W, H) },
        seed: { value: 0 },
        exposure: { value: 1 },
        saturation: { value: 1 },
        contrast: { value: 0 },
        shadowTint: { value: new THREE.Vector3() },
        highlightTint: { value: new THREE.Vector3() },
        vignette: { value: 0 },
        grain: { value: 0 },
        aberration: { value: 0 },
      },
    });
    const quad = new FullScreenQuad(material);
    return { sceneRT, depthTexture, bloom, material, quad };
    // the pipeline is rebuilt only when the canvas size changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W, H]);

  useEffect(
    () => () => {
      pipe.sceneRT.dispose();
      pipe.depthTexture.dispose();
      pipe.bloom.dispose();
      pipe.material.dispose();
      pipe.quad.dispose();
    },
    [pipe],
  );

  useFrame(() => {
    const { sceneRT, bloom, material, quad } = pipe;
    const u = material.uniforms;
    const focus = grade.focus ?? Math.max(0.5, camera.position.distanceTo(new THREE.Vector3(...target)));
    u.cameraNear.value = camera.near;
    u.cameraFar.value = camera.far;
    u.logDepth.value = gl.capabilities.logarithmicDepthBuffer ? 1 : 0;
    u.focus.value = focus;
    u.cocScale.value = grade.dof > 0 ? (grade.dof * 0.06) / focus : 0;
    u.seed.value = (frame * 0.618034) % 1;
    u.exposure.value = grade.exposure;
    u.saturation.value = grade.saturation;
    u.contrast.value = grade.contrast;
    u.shadowTint.value.set(...grade.shadowTint);
    u.highlightTint.value.set(...grade.highlightTint);
    u.vignette.value = grade.vignette;
    u.grain.value = grade.grain;
    u.aberration.value = grade.aberration;

    const oldAutoClear = gl.autoClear;
    gl.autoClear = true;
    gl.setRenderTarget(sceneRT);
    gl.clear();
    gl.render(scene, camera);
    if (grade.bloom > 0) {
      bloom.strength = grade.bloom;
      bloom.radius = grade.bloomRadius;
      bloom.threshold = grade.bloomThreshold;
      bloom.render(gl, sceneRT, sceneRT, 0, false);
    }
    gl.setRenderTarget(null);
    quad.render(gl);
    gl.autoClear = oldAutoClear;
  }, 1);

  return null;
};
