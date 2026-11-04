import React from "react";
import { Composition, Still } from "remotion";
import { BlackHoleEpisode, estimatedBlackHole, type BlackHoleProps } from "./episodes/black-hole/BlackHoleEpisode";
import { NoHumansEpisode, estimatedNoHumans, type NoHumansProps } from "./episodes/no-humans/NoHumansEpisode";
import { GtaEpisode, estimatedGta, type GtaProps } from "./episodes/gta-24h/GtaEpisode";
import { SmartAnimalsEpisode, estimatedSmartAnimals, type SmartAnimalsProps } from "./episodes/smart-animals/SmartAnimalsEpisode";
import { voiceoverMetadata } from "./lib/voiceover";
import { withDetail } from "./slavoski/detail";

// Ep. 1–3 were published at the original "low" detail; ep. 4 onward use the "mid" default.
const BlackHoleLow = withDetail("low", BlackHoleEpisode);
const NoHumansLow = withDetail("low", NoHumansEpisode);
const GtaLow = withDetail("low", GtaEpisode);
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
      component={SmartAnimalsEpisode}
      durationInFrames={FPS * 60}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ voiceover: "smart-animals" } as SmartAnimalsProps}
      calculateMetadata={voiceoverMetadata<SmartAnimalsProps>(FPS, { tailSeconds: 2.2, fallback: estimatedSmartAnimals })}
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
