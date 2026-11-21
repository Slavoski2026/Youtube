import { getInputProps } from "remotion";

const props = (): { hq?: boolean; bloom?: boolean } => {
  try {
    return getInputProps() as { hq?: boolean; bloom?: boolean };
  } catch {
    return {};
  }
};

/**
 * Final-render quality switch. Render with `--props='{"hq":true}'` to supersample every canvas 2× (smoother
 * edges, steadier thin lines and distant windows) and double the shadow-map resolution. Off by default so
 * contact sheets and previews stay fast.
 */
export const isHq = (): boolean => Boolean(props().hq);

/**
 * Post-processing switch (ep. 8 "crazy graphics"): `--props='{"hq":true,"bloom":true}'` renders every Stage
 * through an HDR composer with a bloom pass, and `Glow` materials, sun discs and lit sign panels are
 * pushed above 1.0 so only they bloom. Opt-in: earlier episodes re-render exactly as published.
 */
export const isBloom = (): boolean => Boolean(props().bloom);

/** HDR multiplier for emissive (Glow) colours when bloom is on. */
export const GLOW_HDR = 2.1;
