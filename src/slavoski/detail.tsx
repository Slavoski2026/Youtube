/**
 * Geometry detail level for the whole kit.
 *
 * - "mid" (the house standard from ep. 4, approved by the user): flat-shaded and faceted, but boxes
 *   get a two-facet bevel on every edge and round things (heads, fists, cylinders, cones,
 *   icospheres) get more facets. This is the default.
 * - "low": the original look of ep. 1–3 (sharp boxes, few facets). Those compositions are pinned
 *   to it in Root.tsx with `withDetail("low", …)` so re-renders match what was published.
 *
 * `Stage` re-provides the level inside the canvas, so
 * every kit component reads it with `useDetail()`. Use the `BoxG` / `CylG` / `ConeG` / `IcoG` /
 * `CircleG` geometry elements in place of R3F's `<boxGeometry>` etc. so they follow the level.
 */
import React, { createContext, useContext } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type DetailLevel = "low" | "mid";

const DetailContext = createContext<DetailLevel>("mid");
export const DetailProvider = DetailContext.Provider;

export type Detail = {
  level: DetailLevel;
  mid: boolean;
  /** Radial segments for cylinders, cones and circles. */
  seg: (n: number) => number;
  /** Icosphere subdivision. Big planets (detail ≥ 3) already have enough facets. */
  ico: (n: number) => number;
};

export const detailFor = (level: DetailLevel): Detail => {
  const mid = level === "mid";
  return {
    level,
    mid,
    seg: (n) => (mid ? Math.max(n + 4, n * 2) : n),
    ico: (n) => (mid && n <= 2 ? n + 1 : n),
  };
};

export const useDetail = (): Detail => detailFor(useContext(DetailContext));

/** Pins a composition to a detail level (ep. 1–3 keep "low"). Call at module level, not in render. */
export const withDetail = <P extends object>(level: DetailLevel, Component: React.ComponentType<P>): React.FC<P> => {
  const Wrapped: React.FC<P> = (props) => (
    <DetailProvider value={level}>
      <Component {...props} />
    </DetailProvider>
  );
  Wrapped.displayName = `${level}(${Component.displayName ?? Component.name})`;
  return Wrapped;
};
export const useDetailLevel = () => useContext(DetailContext);

// ---------- Chamfered boxes ----------
const boxCache = new Map<string, THREE.BufferGeometry>();
const UNIT = new THREE.BoxGeometry(1, 1, 1);

/**
 * A w×h×d box with a two-facet bevel on every edge (flat shading shows it as a rounded edge that
 * catches the light). Tiny boxes (window quads) stay sharp. Cached by size.
 */
export const chamferBox = (w: number, h: number, d: number): THREE.BufferGeometry => {
  const m = Math.min(w, h, d);
  const key = `${w.toFixed(3)},${h.toFixed(3)},${d.toFixed(3)}`;
  let g = boxCache.get(key);
  if (!g) {
    if (m < 0.05) {
      g = new THREE.BoxGeometry(w, h, d);
    } else {
      // Two bevel facets per edge: reads as a rounded toy edge while staying faceted.
      g = new RoundedBoxGeometry(w, h, d, 2, Math.min(0.16, m * 0.24));
    }
    boxCache.set(key, g);
  }
  return g;
};

/** Unit box for "low", or the chamfered box of this exact size for "mid" (use without scale). */
export const boxFor = (mid: boolean, w: number, h: number, d: number) => (mid ? chamferBox(w, h, d) : UNIT);

type BoxArgs = [number, number, number, ...number[]];

/** Drop-in for `<boxGeometry args={[w, h, d]} />`. */
export const BoxG: React.FC<{ args: BoxArgs }> = ({ args }) => {
  const { mid } = useDetail();
  if (!mid || args.length > 3) return <boxGeometry args={args as unknown as [number, number, number]} />;
  return <primitive object={chamferBox(args[0], args[1], args[2])} attach="geometry" dispose={null} />;
};

/** Drop-in for `<cylinderGeometry args={[rt, rb, h, radial, ...]} />`. */
export const CylG: React.FC<{ args: [number, number, number, number?, number?, boolean?] }> = ({ args }) => {
  const { seg } = useDetail();
  const [rt, rb, h, radial = 8, ...rest] = args;
  return <cylinderGeometry args={[rt, rb, h, seg(radial), ...(rest as [number?, boolean?])]} />;
};

/** Drop-in for `<coneGeometry args={[r, h, radial, ...]} />`. */
export const ConeG: React.FC<{ args: [number, number, number?, number?, boolean?] }> = ({ args }) => {
  const { seg } = useDetail();
  const [r, h, radial = 8, ...rest] = args;
  return <coneGeometry args={[r, h, seg(radial), ...(rest as [number?, boolean?])]} />;
};

/** Drop-in for `<icosahedronGeometry args={[r, detail]} />`. */
export const IcoG: React.FC<{ args: [number, number?] }> = ({ args }) => {
  const { ico } = useDetail();
  return <icosahedronGeometry args={[args[0], ico(args[1] ?? 0)]} />;
};

/** Drop-in for `<circleGeometry args={[r, segments]} />`. */
export const CircleG: React.FC<{ args: [number, number?] }> = ({ args }) => {
  const { seg } = useDetail();
  return <circleGeometry args={[args[0], seg(args[1] ?? 8)]} />;
};
