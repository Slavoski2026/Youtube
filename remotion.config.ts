import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// WebGL renders need ANGLE.
Config.setChromiumOpenGlRenderer("angle");
Config.setConcurrency(2);
