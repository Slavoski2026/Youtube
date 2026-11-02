import { continueRender, delayRender, staticFile } from "remotion";

/** House typeface: DejaVu Sans (bundled in public/fonts, so renders never depend on system fonts). */
export const FONT = "'Slavoski Sans', 'DejaVu Sans', sans-serif";

let loaded = false;
export const loadHouseFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const handle = delayRender("Loading house fonts");
  const faces = [
    new FontFace("Slavoski Sans", `url(${staticFile("fonts/DejaVuSans.ttf")})`, { weight: "400" }),
    new FontFace("Slavoski Sans", `url(${staticFile("fonts/DejaVuSans-Bold.ttf")})`, { weight: "700" }),
  ];
  Promise.all(faces.map((f) => f.load()))
    .then((fs) => {
      fs.forEach((f) => (document.fonts as unknown as Set<FontFace>).add(f));
      continueRender(handle);
    })
    .catch((e) => {
      console.error("Font load failed", e);
      continueRender(handle);
    });
};
