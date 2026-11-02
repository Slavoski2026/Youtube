/**
 * Style check: four reference-style shots rendered as stills, to compare against the
 * reference frames (title card, street + hero + big Moon, aerial city + meteor, disaster city).
 *   npm run still -- StyleCheck out/style-a.png --props='{"shot":"title"}'
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CityGrid, StreetSet } from "./slavoski/city";
import { loadHouseFonts } from "./slavoski/fonts";
import { Fireball, LavaCrack, Meteor, SmokeCluster } from "./slavoski/fx";
import { BrandLockup, TitleCard } from "./slavoski/Overlays";
import { P } from "./slavoski/palette";
import { Hero, mergePose, REST } from "./slavoski/rig/Hero";
import { FacetedEarth, FacetedMoon, OrbitPath } from "./slavoski/space";
import { Stage } from "./slavoski/Stage";
import { WordCaptions } from "./slavoski/WordCaptions";

loadHouseFonts();

export type StyleCheckProps = { shot: "title" | "street" | "aerial" | "disaster" | "hero" };

const cap = (text: string, kw: string[] = []) => {
  const toks = text.split(" ");
  return {
    words: toks.map((t, i) => ({ text: (i ? " " : "") + t, startMs: i * 300, endMs: i * 300 + 280, timestampMs: null, confidence: null })),
    kw,
  };
};

export const StyleCheck: React.FC<StyleCheckProps> = ({ shot }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  if (shot === "title") {
    const c = cap("suddenly started");
    return (
      <AbsoluteFill>
        <Stage mood="space" camera={{ position: [0, 0, 17], target: [0, 0, 0] }} fog={false} shadows={false}>
          <FacetedEarth radius={3} position={[0, -2.1, 0]} rotation={[0.3, t * 0.1 + 1.2, 0]} />
          <FacetedMoon radius={0.75} position={[-0.55, 3.55, -1]} rotation={[0, 0.5, 0]} />
          <OrbitPath points={[[-0.2, 3.1, -0.6], [0.0, 2.6, -0.2], [0.15, 2.1, 0]]} dotRadius={0.03} spacing={0.09} />
        </Stage>
        <TitleCard lines={[{ text: "WHAT IF THE" }, { text: "MOON FELL?", color: P.amber }]} startFrame={-30} />
        <WordCaptions words={c.words} />
      </AbsoluteFill>
    );
  }

  if (shot === "street" || shot === "hero") {
    const c = cap("the sky.");
    const pose = mergePose(REST, { headPitch: 0.12, expression: "worried" });
    const close = shot === "hero";
    return (
      <AbsoluteFill>
        <Stage
          mood="night"
          camera={
            close
              ? { position: [2.2, 3.4, 6.6], target: [0, 3.0, 0], fov: 40 }
              : { position: [0.6, 2.6, 22], target: [0, 6.2, -10], fov: 40 }
          }
          fog={[40, 200]}
        >
          <StreetSet seed="ref" />
          <Hero pose={pose} position={[0.2, 0, 1.2]} yaw={0} />
          <FacetedMoon radius={13} position={[-1, 21, -80]} rotation={[0.2, 0.8, 0]} />
        </Stage>
        <BrandLockup chapter={{ n: 2, title: "A CHANGING SKY" }} />
        <WordCaptions words={c.words} />
      </AbsoluteFill>
    );
  }

  if (shot === "aerial") {
    const c = cap("the atmosphere.", ["atmosphere."]);
    return (
      <AbsoluteFill>
        <Stage mood="night" camera={{ position: [10, 26, 26], target: [0, 4, -4], fov: 40 }} fog={[60, 160]} shadowSize={50}>
          <CityGrid seed="aerial" blocks={5} />
          <Meteor from={[-8, 30, -10]} to={[2, 2, 2]} progress={0.72} size={1.1} trail={10} />
        </Stage>
        <BrandLockup chapter={{ n: 7, title: "THE SKY FALLS" }} />
        <WordCaptions words={c.words} keywords={["atmosphere."]} />
      </AbsoluteFill>
    );
  }

  // disaster
  const c = cap("as enormous impacts", ["impacts"]);
  return (
    <AbsoluteFill>
      <Stage mood="night" dust={1} camera={{ position: [2, 30, 62], target: [-5, 3, 0], fov: 40 }} fog={[60, 180]} shake={0}>
        <CityGrid
          seed="dis"
          blocks={5}
          modify={(s, i) => {
            const near = Math.hypot(s.position[0] + 6, s.position[2]) < 14;
            if (!near || i % 2) return {};
            return { tilt: [0, (s.position[0] + 6 > 0 ? 1 : -1) * 0.22] };
          }}
        />
        <SmokeCluster position={[-7, 2, -2]} progress={0.7} radius={4} count={10} />
        <Fireball position={[-6, 0, 2]} progress={0.35} radius={2.5} />
        <LavaCrack points={[[-20, 0, 6], [-8, 0, 7], [2, 0, 8.5], [14, 0, 7]]} width={0.7} />
        <Meteor from={[-14, 40, -20]} to={[-6, 0, -2]} progress={0.5} size={0.6} trail={6} seed="a" />
        <Meteor from={[6, 44, -30]} to={[10, 0, -10]} progress={0.3} size={0.5} trail={5} seed="b" />
      </Stage>
      <BrandLockup chapter={{ n: 7, title: "THE SKY FALLS" }} />
      <WordCaptions words={c.words} keywords={["impacts"]} />
    </AbsoluteFill>
  );
};
