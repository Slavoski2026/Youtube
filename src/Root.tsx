import React from "react";
import { Composition, Still } from "remotion";
import { BlackHoleEpisode, estimatedBlackHole, type BlackHoleProps } from "./episodes/black-hole/BlackHoleEpisode";
import { NoHumansEpisode, estimatedNoHumans, type NoHumansProps } from "./episodes/no-humans/NoHumansEpisode";
import { GtaEpisode, estimatedGta, type GtaProps } from "./episodes/gta-24h/GtaEpisode";
import { SmartAnimalsEpisode, estimatedSmartAnimals, type SmartAnimalsProps } from "./episodes/smart-animals/SmartAnimalsEpisode";
import { Ww3Episode, estimatedWw3, type Ww3Props } from "./episodes/ww3-countdown/Ww3Episode";
import { NoWork2036Episode, estimatedNoWork2036, type NoWork2036Props } from "./episodes/no-work-2036/NoWork2036Episode";
import { SatellitesDarkEpisode, estimatedSatellitesDark, type SatellitesDarkProps } from "./episodes/satellites-dark/SatellitesDarkEpisode";
import { NoSweatEpisode, estimatedNoSweat, type NoSweatProps } from "./episodes/no-sweat/NoSweatEpisode";
import { voiceoverMetadata } from "./lib/voiceover";
import { withDetail } from "./slavoski/detail";
import { withLook } from "./slavoski/postfx";

// Ep. 1–3 were published at the original "low" detail; ep. 4 onward use the "mid" default.
// Ep. 1–7 were published before the cinematic look (post-processing, ep. 8 onward): keep them "classic".
const BlackHoleLow = withLook("classic", withDetail("low", BlackHoleEpisode));
const NoHumansLow = withLook("classic", withDetail("low", NoHumansEpisode));
const GtaLow = withLook("classic", withDetail("low", GtaEpisode));
const SmartAnimalsClassic = withLook("classic", SmartAnimalsEpisode);
const Ww3Classic = withLook("classic", Ww3Episode);
const NoWork2036Classic = withLook("classic", NoWork2036Episode);
const SatellitesDarkClassic = withLook("classic", SatellitesDarkEpisode);
import { StyleCheck, type StyleCheckProps } from "./StyleCheck";
import { Thumbnail, type ThumbProps } from "./Thumbnails";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="BlackHole"
      component={BlackHoleLow}
      durationInFrames={FPS * 90}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ voiceover: "black-hole" } as BlackHoleProps}
      calculateMetadata={voiceoverMetadata<BlackHoleProps>(FPS, { tailSeconds: 2.5, fallback: estimatedBlackHole })}
    />
    <Composition
      id="NoHumans"
      component={NoHumansLow}
      durationInFrames={FPS * 90}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ voiceover: "no-humans" } as NoHumansProps}
      calculateMetadata={voiceoverMetadata<NoHumansProps>(FPS, { tailSeconds: 2.6, fallback: estimatedNoHumans })}
    />
    <Composition
      id="Gta24h"
      component={GtaLow}
      durationInFrames={FPS * 80}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ voiceover: "gta-24h" } as GtaProps}
      calculateMetadata={voiceoverMetadata<GtaProps>(FPS, { tailSeconds: 2.6, fallback: estimatedGta })}
    />
    {([
      ["black-hole", "BlackHole"],
      ["no-humans", "NoHumans"],
      ["gta-24h", "Gta24h"],
      ["smart-animals", "SmartAnimals"],
      ["ww3-countdown", "Ww3Countdown"],
      ["no-work-2036", "NoWork2036"],
      ["satellites-dark", "SatellitesDark"],
      ["no-sweat", "NoSweat"],
    ] as const).map(([ep, id]) => (
      <Still
        key={ep}
        id={`Thumb-${id}`}
        component={Thumbnail}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ episode: ep } as ThumbProps}
      />
    ))}
    <Composition
      id="SmartAnimals"
      component={SmartAnimalsClassic}
      durationInFrames={FPS * 60}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ voiceover: "smart-animals" } as SmartAnimalsProps}
      calculateMetadata={voiceoverMetadata<SmartAnimalsProps>(FPS, { tailSeconds: 2.2, fallback: estimatedSmartAnimals })}
    />
    <Composition
      id="Ww3Countdown"
      component={Ww3Classic}
      durationInFrames={FPS * 60}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ voiceover: "ww3-countdown" } as Ww3Props}
      calculateMetadata={voiceoverMetadata<Ww3Props>(FPS, { tailSeconds: 2.2, fallback: estimatedWw3 })}
    />
    <Composition
      id="NoWork2036"
      component={NoWork2036Classic}
      durationInFrames={FPS * 66}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ voiceover: "no-work-2036" } as NoWork2036Props}
      calculateMetadata={voiceoverMetadata<NoWork2036Props>(FPS, { tailSeconds: 2.2, fallback: estimatedNoWork2036 })}
    />
    <Composition
      id="SatellitesDark"
      component={SatellitesDarkClassic}
      durationInFrames={FPS * 74}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ voiceover: "satellites-dark" } as SatellitesDarkProps}
      calculateMetadata={voiceoverMetadata<SatellitesDarkProps>(FPS, { tailSeconds: 2.2, fallback: estimatedSatellitesDark })}
    />
    <Composition
      id="NoSweat"
      component={NoSweatEpisode}
      durationInFrames={FPS * 66}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ voiceover: "no-sweat" } as NoSweatProps}
      calculateMetadata={voiceoverMetadata<NoSweatProps>(FPS, { tailSeconds: 2.2, fallback: estimatedNoSweat })}
    />
    <Composition
      id="StyleCheck"
      component={StyleCheck}
      durationInFrames={90}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ shot: "street" } as StyleCheckProps}
    />
  </>
);
