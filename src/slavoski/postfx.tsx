/**
 * Cinematic post-processing for a Stage (opt-in per episode, ep. 9 onward; the user asked for "shaders,
 * lights, depth of field"): ambient occlusion (N8AO), bloom on emissive practicals, depth of field that
 * focuses on the shot's subject, and SMAA. Deterministic: Remotion advances the R3F loop once per frame
 * and none of these effects depend on time.
 *
 * Episodes turn it on by wrapping their shots in <PostFxProvider value>. The sky, normally a CSS
 * gradient behind a transparent canvas, is drawn into the scene background in this mode so the
 * effects see it.
 */
import { useThree } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, SMAA } from "@react-three/postprocessing";
// n8ao 2.x (the copy bundled with @react-three/postprocessing 3.0 is 1.x and breaks on three r187).
import { N8AOPostPass } from "n8ao";
import React, { createContext, useContext, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import type { V3 } from "./noise";

const PostFxContext = createContext(false);
export const PostFxProvider = PostFxContext.Provider;
export const usePostFx = () => useContext(PostFxContext);

/** The Stage sky as a texture: a top-to-horizon linear gradient (daylight moods) or the radial night glow. */
export const skyTexture = (sky: string, glow: string, mid: string, gradient: boolean): THREE.Texture => {
  const c = document.createElement("canvas");
  c.width = gradient ? 8 : 270;
  c.height = gradient ? 512 : 480;
  const ctx = c.getContext("2d")!;
  if (gradient) {
    const g = ctx.createLinearGradient(0, 0, 0, c.height);
    g.addColorStop(0, sky);
    g.addColorStop(0.22, sky);
    g.addColorStop(0.52, mid);
    g.addColorStop(0.78, glow);
    g.addColorStop(1, glow);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
  } else {
    // radial-gradient(ellipse 85% 60% at 50% 42%, glow 0%, sky 70%)
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.translate(c.width * 0.5, c.height * 0.42);
    ctx.scale(0.85 * c.width, 0.6 * c.height);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, glow);
    g.addColorStop(0.7, sky);
    g.addColorStop(1, sky);
    ctx.fillStyle = g;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const SceneBackground: React.FC<{ tex: THREE.Texture }> = ({ tex }) => {
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    scene.background = tex;
    return () => {
      scene.background = null;
    };
  }, [scene, tex]);
  return null;
};

/** Ambient occlusion pass (n8ao 2.x), configured once. */
const AmbientOcclusion: React.FC<{ intensity: number; radius: number }> = ({ intensity, radius }) => {
  const { scene, camera, size } = useThree();
  const pass = useMemo(() => new N8AOPostPass(scene, camera, size.width, size.height), [scene, camera, size.width, size.height]);
  useLayoutEffect(() => {
    const cfg = pass.configuration as Record<string, unknown>;
    cfg.aoRadius = radius;
    cfg.distanceFalloff = 0.8;
    cfg.intensity = intensity;
    cfg.halfRes = true;
    cfg.depthAwareUpsampling = true;
    cfg.color = new THREE.Color("#000000");
    pass.setQualityMode("Medium");
  }, [pass, intensity, radius]);
  return <primitive object={pass} />;
};

export type PostFxSettings = {
  /** World point the lens focuses on (defaults to the camera target). */
  focus: V3;
  /** Distance from the camera to the focus point (sets how much stays sharp). */
  distance: number;
  /** 0 = no depth of field. */
  dof?: number;
  bloom?: number;
  ao?: number;
};

/** The effect chain. Rendered inside the canvas, after the scene. */
export const PostFx: React.FC<PostFxSettings & { sky: THREE.Texture }> = ({ focus, distance, dof = 1, bloom = 1, ao = 1, sky }) => {
  const target = useMemo(() => new THREE.Vector3(...focus), [focus[0], focus[1], focus[2]]); // eslint-disable-line react-hooks/exhaustive-deps
  // Keep about a third of the camera distance sharp; close-ups get a shallower field.
  const range = Math.max(1.6, distance * 0.42);
  return (
    <>
      <SceneBackground tex={sky} />
      <EffectComposer multisampling={0} frameBufferType={THREE.HalfFloatType} renderPriority={1}>
        {ao > 0 ? <AmbientOcclusion intensity={2.4 * ao} radius={1.4} /> : <></>}
        <Bloom luminanceThreshold={0.78} luminanceSmoothing={0.18} intensity={0.75 * bloom} mipmapBlur radius={0.7} />
        {dof > 0 ? <DepthOfField target={target} worldFocusRange={range} bokehScale={3.2 * dof} resolutionScale={0.6} /> : <></>}
        <SMAA />
      </EffectComposer>
    </>
  );
};
