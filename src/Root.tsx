import React from "react";
import { Composition } from "remotion";
import { BlackHoleEpisode, estimatedBlackHole, type BlackHoleProps } from "./episodes/black-hole/BlackHoleEpisode";
import { NoHumansEpisode, estimatedNoHumans, type NoHumansProps } from "./episodes/no-humans/NoHumansEpisode";
import { GtaEpisode, estimatedGta, type GtaProps } from "./episodes/gta-24h/GtaEpisode";
import { voiceoverMetadata } from "./lib/voiceover";
import { StyleCheck, type StyleCheckProps } from "./StyleCheck";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="BlackHole"
      component={BlackHoleEpisode}
      durationInFrames={FPS * 90}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ voiceover: "black-hole" } as BlackHoleProps}
      calculateMetadata={voiceoverMetadata<BlackHoleProps>(FPS, { tailSeconds: 2.5, fallback: estimatedBlackHole })}
    />
    <Composition
      id="NoHumans"
      component={NoHumansEpisode}
      durationInFrames={FPS * 90}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ voiceover: "no-humans" } as NoHumansProps}
      calculateMetadata={voiceoverMetadata<NoHumansProps>(FPS, { tailSeconds: 2.6, fallback: estimatedNoHumans })}
    />
    <Composition
      id="Gta24h"
      component={GtaEpisode}
      durationInFrames={FPS * 80}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ voiceover: "gta-24h" } as GtaProps}
      calculateMetadata={voiceoverMetadata<GtaProps>(FPS, { tailSeconds: 2.6, fallback: estimatedGta })}
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
