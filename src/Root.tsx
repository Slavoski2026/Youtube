import React from "react";
import { Composition } from "remotion";
import { StyleCheck, type StyleCheckProps } from "./StyleCheck";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const RemotionRoot: React.FC = () => (
  <>
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
