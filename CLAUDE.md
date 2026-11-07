# SLAVOSKI — 3D animation studio

This repo makes **SLAVOSKI** videos: vertical (9:16) narrated shorts in the series **"A Cosmic What If"** — one hypothetical per episode ("What if the Moon fell?"), told in numbered chapters, in a low-poly, night-lit, faceted 3D style with one recurring hero.

**Every animation in this project uses this exact stack.** Do not swap in other tools (Blender, Babylon.js, Motion Canvas, raw ffmpeg pipelines, other TTS/music providers, other caption libraries) unless the user explicitly asks for it.

| Job | Tool |
|---|---|
| 3D scenes, models, lighting, motion | **Three.js** through React Three Fiber, rendered inside Remotion's `<ThreeCanvas>` (`@remotion/three`) |
| Timeline, captions, audio mixing, rendering to video | **Remotion** (`remotion`, `@remotion/captions`, `@remotion/media`) |
| Voiceover, sound effects, music, transcription | **ElevenLabs MCP**: the hosted "ElevenLabs" connector (`creative_*` tools). There is no SDK and no API key in this project. |

> **Repo status:** the Remotion project and the shared kit in `src/slavoski/` exist (see "Shared kit" below). Still **to build** when first needed: `scripts/pacing.ts`, `scripts/shorts.ts`, `scripts/export-srt.ts` and the `{"clipCheck":true}` logging mode. Never claim a helper exists without checking; update this file when a name or API changes.

## Starting a new session (read first)

Everything that defines the channel lives in this repo: this file, the kit in `src/slavoski/`, every episode in `src/episodes/`, and the voiceovers and sound effects in `public/`. Rendered videos in `out/` are **not** in git; the user has downloaded them.

1. `npm ci` (a fresh container has no `node_modules`).
2. Read this file, then skim the newest episode folder (currently `src/episodes/satellites-dark/`) as the template for the next one: `narration.ts` → `shots.tsx` → `<Name>Episode.tsx`, registered in `src/Root.tsx` and in `scripts/shot-frames.ts`.
3. Follow the workflow below: script and chapter split → price with `estimate_only` → user OK → 1 take with Mark → Scribe → import → shots → contact sheets → half-res preview → full render on "render it".
4. Open items: ep. 1 and ep. 2 were rendered before the hair fix (Slavoski's hair now covers his crown). Re-render them if the user asks; it needs no credits.
5. Ep. 7 `satellites-dark` is built and in preview (see Episodes); the HQ final waits for the user's "render it". Ep. 6 `no-work-2036` is finished: HQ final delivered (`out/no-work-2036-final.mp4`, 67.1 s, not in git), thumbnail in `thumbnails/ep6-no-work-2036.png`. Ep. 5 `ww3-countdown` is finished too. Ep. 4 `smart-animals` is finished: final render delivered (`out/smart-animals-final.mp4`, 59.9 s, not in git). It introduced the **"mid" detail level**, which the user approved as the new standard. Total ElevenLabs spend for ep. 4: ≈ 1,510 credits (voiceover 944, Scribe 345, 13 sound effects ≈ 217). The user wants Shorts of **60 s or less**.
6. Thumbnails (Shorts covers, 1080×1920) are `Thumb-<Episode>` stills in `src/Thumbnails.tsx` (a key shot plus a big hook). Render with `npx remotion still build Thumb-<Id> out/thumbs/<id>.png --gl=swangle` and **commit the PNGs to `thumbnails/`** so they're never lost. Make one for every new episode. **Grid-safe layout** (the user saw titles touching between tiles on the channel's Shorts shelf): text stays inside a 780 px centre column (150 px side margins, auto-fitted by `fit()`), starts below y ≈ 300 (the shelf crops the top and puts "⋯" top-right) and ends above ~70% (view count bottom-left).

Working preferences the user has shown: cost-conscious (always quote credits first, offer a trim when a script runs past ~90 s or ~1,400 characters), short replies, previews before finals, our own visual style for anything copyrighted (e.g. games).

---

## The SLAVOSKI look (house style — hard rules)

Reference frames: ep. "What if the Moon fell?" — title card, `02 / A CHANGING SKY`, `04 / EARTH UNDER STRESS`, `07 / THE SKY FALLS`.

### Format
- **1080×1920, 30 fps**, vertical. Keep everything important inside the centre safe area (side margins ~7%, top ~12%, bottom ~15%) — platform UI covers the edges.
- Length follows the voiceover (see workflow). Typical episode: 60–90 s, 6–9 chapters.

### Geometry: low-poly, faceted, toy-like
- **Flat shading everywhere** (`flatShading` on every material). Facets must be visible: that is the look.
- **Detail level** (`src/slavoski/detail.tsx`): **`"mid"` is the house standard** (the user approved it on ep. 4: "the higher quality poly looks good") and the default. It keeps flat shading but gives every box a two-facet bevel at its real size and round parts more facets (hero head icosphere detail 4, cylinders ×2 segments). `"low"` is the ep. 1–3 look; those compositions are pinned to it in `Root.tsx` with `withDetail("low", …)` so re-renders match what was published (re-rendering them at "mid" costs no credits if the user asks). `Stage` passes the level into the canvas. In kit code use `BoxG`/`CylG`/`ConeG`/`IcoG`/`CircleG` instead of `<boxGeometry>` etc. so shapes follow the level; for a box drawn with `scale`, use `chamferBox(w, h, d)` at the real size instead (a scaled bevel distorts).
- Spheres are **icospheres** with visible triangles: Moon `IcosahedronGeometry(r, 3–4)` with per-face grey jitter (light grey to mid-grey, a few darker "maria" clusters); Earth `detail 4–5`, with per-face colours for ocean / green / tan land / white ice, plus a thin translucent atmosphere shell.
- Buildings are **boxes**: a body, a slightly inset roof slab plus a small rooftop box, and window grids as small inset quads (mix of warm amber lit and pale-blue unlit windows, seeded with `random()`).
- Trees are **stacked low-poly cones** (teal) on a brown box/cylinder trunk. Street lamps: thin dark pole plus a flat warm-glowing box head. Cars: boxy body plus cabin box, four cylinder wheels, warm headlight quads.
- Smoke/dust: clusters of brown-grey low-poly icospheres that grow and drift. Fire: orange-to-yellow icospheres with emissive glow.
- Roads: dark slate slabs with short cream dashed lane marks.
- **No ink outlines** in this style (unlike older cartoon kits). Shapes read by flat shading and value contrast.

### Palette (sampled from the reference frames — starting values, tune by eye)
| Role | Hex |
|---|---|
| Night sky (calm acts) | `#090E26` |
| Space background | `#0D0B1E` |
| Disaster sky (late acts — dusty, purple-brown) | `#44383F` |
| Buildings: navy / slate-blue / purple / teal | `#1D274B` / `#566270` / `#5A4A78` / `#2E5A6A` |
| Windows: lit / unlit | `#E0B04E` / `#8FB3D9` |
| Lamp glow | `#DDC284` |
| Pine trees | `#1F6E6A` |
| Car red / car teal | `#C8372D` / `#24748F` |
| Moon (mid face) | `#9AA1B0` |
| Ocean / land green / land tan | `#0D3F86` / `#2F7A5A` / `#B39A62` |
| Fire / meteor glow | `#FAA628` → `#F18E1C` |
| Lava cracks | `#FE5A0E` (emissive) |
| **Brand amber** (title accent, caption keywords) | `#FFBA58` |
| Caption highlight cream | `#F6EBC4` |

Mood arc: start cool and clean (deep navy, crisp stars), and as the scenario escalates shift toward dusty purple-brown skies, orange fire light and haze. Put the palette in `src/slavoski/palette.ts` and use only those tokens. Daylight skies (`daySky`/`dayGlow`, `sunsetSky`/`sunsetGlow`, `overcastSky`/`overcastGlow`, `snowSky`/`snowGlow`) and `cloud` are in the palette too.

### Time of day and weather: vary them (standing rule since ep. 6)
The user noticed "it's always night in my videos". **Night is no longer the default.** Give every episode a time-of-day and weather arc that serves the story, and make each episode's arc different from the last ones:
- `Stage` moods: `night`, `dawn`, `day`, `sunset`, `overcast`, `storm`, `snow`, plus `dust` (disaster) and `space`. Daylight moods draw a top-to-horizon gradient sky. Stars show only at night, at dawn and faintly at sunset.
- Weather in `nature.tsx`: `Rain` (scale its group up for big sets; place the box near the camera so streaks read), `Snow`, `Clouds` (faceted puffs on a ring: keep them low, y ≈ 20–55, or ground cameras never see them; tint white by day, peach at sunset/dawn, grey for overcast/storm) and `LightningBolt` (with a short white overlay flash).
- By day, dim the practicals: `power` ≈ 0.3 on buildings and future towers, street lamps off (`BigStreet day` in ep. 6). Let the mood follow the story (ep. 6: sunrise rush hour → bright midday city → golden beach → a storm over the corporate HQ → an overcast queue in the rain → sunny good future vs rainy night bad future → sunset on the rooftop).

### Lighting
- Per mood (see "Time of day and weather" above). At night: a cool hemisphere light plus a soft directional "moon" key; warm practicals (windows, lamps, headlights) as emissive materials, not real lights.
- Disaster acts: add an orange point/directional fill from the fire/lava side, and a light distance fog in the sky colour.
- A subtle **radial vignette** over every shot, and a faint star field (seeded small points) in every sky.
- Soft shadows on (`shadows="percentage"`).

### The hero
- The recurring hero is **Slavoski**, named after the channel. Define the look once in `src/slavoski/hero.ts` (export `SLAVOSKI`):
  - **Head:** faceted low-poly head (warm tan skin), dark-brown blocky hair cap, big white square eyes with dark pupils, a block nose, a small dark rectangular mouth that changes shape.
  - **Body:** box torso in an **orange zip jacket** (`#E8862A` lit) with a thin cream zipper strip, box arms with faceted fists, **dark-blue jeans** (box legs), white/light-grey block sneakers.
- Proportions: a large head (~⅓ of body height), chunky limbs. Expressions do the comedy: wide eyes plus an open mouth for alarm, arms out to balance during quakes, looking up at the sky.
- The hero is our POV anchor: show the scenario from street level through them, then cut to wide/aerial/space shots for scale.

### On-screen typography (overlays in HTML over the canvas)
The house typeface is **DejaVu Sans** (Bold for titles and captions), bundled in `public/fonts/` and loaded by `loadHouseFonts()` (`src/slavoski/fonts.ts`); the reference frames use it. Sizes below are measured from the references, in 1080×1920 pixels.
- **Brand lockup, top-left, every shot:** `SLAVOSKI` in white, bold, tracked wide (0.32em), 28 px, top-left at (87, 86). Under it, the chapter label `07  /  THE SKY FALLS` in grey-white (≈60% opacity), regular weight, tracked 0.12em, 21 px. Chapter number is two digits.
- **Title card (opens the episode, over the space shot):**
  - `SLAVOSKI`
  - `A COSMIC WHAT IF`
  - `HYPOTHETICAL SCENARIO  /  NOT TO SCALE` (small, dim)
  - Big title, 76 px bold caps, starting at y ≈ 218: line 1 white (`WHAT IF THE`), line 2 **brand amber** (`MOON FELL?`). A long title can add a smaller third line (~46 px).
- **Captions:** one to three words per page, centred, 54 px DejaVu Sans Bold, white with a dark outline plus a soft drop shadow. The **currently spoken word turns cream** (`#F6EBC4`); **key words** (the scenario's nouns and verbs: *impacts*, *Moon*, *tides*…) are set in **brand amber**. Caption band centre at **~74% of frame height**.
- Keep heads and faces **above ~62%** of the frame so captions never cover a face; captions may cross torsos and legs.

### Episode structure
1. **Cold open / title card** (0–4 s): title lockup plus the narration hook ("What if the Moon suddenly started…"). **The user wants a strong, unique hook and not Earth from space every time** (asked on ep. 7): open mid-action on something personal and concrete (ep. 7: Slavoski's phone map losing GPS in the first half-second, then the sky as satellites blink out, then one satellite dying in close-up, with a counter racing to 0). Bring the title in on the second shot so the first frame is clean, and keep the first cut under ~1.5 s.
2. **Numbered chapters** `01 … NN`, each with a short ALL-CAPS name (`A CHANGING SKY`, `EARTH UNDER STRESS`, `THE SKY FALLS`). The chapter label in the lockup updates on the cut into each chapter.
3. Escalation: each chapter is worse than the last; alternate street-level hero shots with wide city/aerial shots and space diagrams.
4. **Ending:** the resolution, then an end card (`SLAVOSKI` plus `A COSMIC WHAT IF`). **No next-episode teaser** unless the user asks for one.

Store chapters in the episode's `timeline.ts` as `{ n, title, at }` keyed to narration word times.

---

## Workflow for a new episode

1. **Script:** write the narration split into chapters (number plus title per chapter) and get the user's OK before spending credits.
2. **Voiceover** (on one flow per episode):
   1. `creative_create_flow` named `slavoski - <episode slug>`, then pass its `flow_id` to every call below.
   2. **Channel narrator voice: "Mark - Natural Conversations", voice ID `UgBBYS2sOqTuMpoF3BR0`**, model `eleven_v4`. Use it for every episode unless the user asks for a different one. The user prefers **1 take** (`generations_count: 1`) to save credits.
   3. `creative_generate_speech` with the narration. The user picks a take in the speech view; if they don't, use the first completed one. If they switch voice in the view, that starts new takes; read their `session_ids` with `read_widget_context` instead of generating again.
   4. `creative_get_flow_run_status` with the take's `session_ids` returns each take's `content_url` (a signed link, valid about 2 hours).
   5. Transcribe that exact take: `creative_attach_reference_file` with the `content_url`, then `creative_transcribe_audio` with `connect_from` set to the returned node. When it finishes, `creative_get_flow_run_status` returns `transcripts[0].words` and `transcripts[0].words_download_url`.
   6. Import both before the links expire: `npm run import-voiceover -- --name <slug> --audio "<content_url>" --words "<words_download_url>"`. This writes `public/voiceover/<slug>.mp3` and `public/voiceover/<slug>.json` (a `VoiceoverManifest` with word captions).
3. **Sound effects and music** only if the piece needs them (rumbles, impacts, whooshes, a low cinematic bed): `creative_generate_in_flow` with `node_type` `sfx` or `music` (check `creative_get_flow_node_types` for current models). Get the `content_url` from `creative_get_flow_run_status`, then `npm run import-audio -- --audio "<url>" --out sfx/<slug>.mp3` (or `music/<slug>.mp3`).
4. Create `src/episodes/<slug>/` (`<Name>.tsx`, `timeline.ts`, `props.tsx`), built on the shared kit in `src/slavoski/`. Register it in `src/Root.tsx` with `calculateMetadata={voiceoverMetadata<Props>(FPS)}` so its length follows the voiceover.
5. Check the work with `npm run typecheck`, then review stills before any full render. Always check the title card plus every shot:
   - `npx remotion bundle src/index.ts --out-dir=build`
   - `npx tsx scripts/shot-frames.ts <slug>` lists every shot with its length (flags shots over ~4 s); `--frames` prints mid-shot frames.
   - `npx tsx scripts/contact-sheet.ts <Id> "<frames>" 0.3 out/sheet.png` renders them in one browser session and tiles them with frame numbers.
6. Render the video: `npm run render -- <Id> out/<name>.mp4`. The user can preview interactively with `npm run dev` (Remotion Studio). **Finals always use the HQ mode** (the user asked for "better graphics" on ep. 6): `npm run render -- <Id> out/<name>-final.mp4 --gl=swangle --props='{"hq":true}' --concurrency=4 --crf=15 --jpeg-quality=95` (2× supersampled canvases, 4096 px shadows, ≈ 2 s per frame here; render the thumbnail with the same `--props`). Previews and contact sheets stay at normal quality.
7. Export subtitles: `npx tsx scripts/export-srt.ts <slug>`.

## Pacing (standing rules)

Shorts must never sit still:

- **No more than ~2 s with neither narration nor a cut.** In silent stretches, cut every 1.5–2.5 s: a new angle on the same action, an insert (a close-up of the Moon, a cracking road, a window), a hero reaction close-up, or a quick gag beat. Re-framing the same set is cheap and counts.
- **Shots under narration stay under ~4 s.**
- **Keep narration gaps short.** Place lines with J-cuts (start a line just before its chapter's cut) and fill any remaining gap with cuts. Never leave a long silent hold.
- **Duck the music under the voice and lift it in the gaps** (a `duck()` helper and `MUSIC_LIFT` constant in `src/slavoski/Soundtrack.tsx`), so the quiet stretches never sound empty.
- **Camera always moves:** every shot has a slow push, drift, orbit or tilt (driven by frame), plus camera shake on impacts and quakes (seeded noise, never `Math.random()`).
- **Check before delivering:** after rendering, run `npx tsx scripts/pacing.ts <slug>`. It finds the cuts in the rendered video and lines them up with the word timings. Fix every "dead stretch" it reports, then re-render. Register new episodes in `scripts/shorts.ts`.

## No clipping (standing rules)

Objects must never pass into each other on screen. This applies to disaster scenes especially: **tilting or collapsing buildings must not slice through neighbouring buildings**. Tilt them away from each other, give them space in the layout, or let one visibly crumble before contact.

- **Resting contact:** place things on surfaces using their real extents (centre = surface + half height). Cars sit on the road with their wheels touching it; trees and lamps sit on the pavement; the hero's sneakers sit on the ground.
- **Hands and held props:** compute the hand position from the rig and offset props by their own half-thickness, so they touch the hand rather than sitting inside the arm or face.
- **Contact gags** (something near the face): offset by the head radius plus the prop's thickness along the camera axis.
- **Moving objects** (meteors, debris, smoke, sliding cars, falling buildings) must not cross buildings, characters or each other partway through their path. Space their lanes in depth or time them apart. Meteors stop at the ground and become an impact (fireball plus smoke), never sinking through.
- **Check before delivering:** for every contact moment (a landing, an impact, a building hitting the ground, the hero grabbing something), render a still at the contact frame and one mid-motion, and zoom on the contact. If depth is unclear, render the same frame from a side camera. Fix every overlap before the full render.
- **Rig tools to build in `src/slavoski/rig/Hero.tsx`:** `reach(pose, side, target, { obstacles })` (an IK arm that avoids head/torso/obstacles), `groundedBob(pose)` (the lowest foot on the floor), `armJoints` / `legJoints` / `headPosition`, and `selfClipping(pose)`. Add a `{"clipCheck":true}` props mode that logs `[clip] t=…s …` per self-clipping frame, wired through a `ClipCheckContext` in each composition.

## Three.js inside Remotion

- Drive all motion from `useCurrentFrame()` with `interpolate()` / `spring()`. Never use R3F's `useFrame`, `THREE.Clock`, `Date.now()`, `performance.now()` or `Math.random()`. Remotion renders frames out of order across parallel tabs. For randomness use `random(seed)` from `remotion`. This matters doubly here: window patterns, facet colour jitter, star fields, debris and smoke must all be seeded so they are identical every frame.
- `@react-three/drei` static helpers are fine (`RoundedBox`, `Text3D`, `Center`, `useGLTF`, …). Avoid helpers that animate on their own clock (`Float`, `Sparkles`, `Trail`, `useFrame`-based effects); recreate that motion from the frame number.
- **Trails** (meteors, the falling Moon's path): build a **tapered cone or ribbon mesh** with an emissive gradient. Don't use a row of spheres: the bead joins show near the tail.
- Put models, textures, HDRIs and fonts in `public/` and load them with `staticFile()`. Don't fetch from the network at render time (drei `<Environment preset>` downloads from a CDN, so use `files={staticFile(...)}`).
- Keep `Config.setChromiumOpenGlRenderer("angle")` in `remotion.config.ts`. WebGL renders need it.
- `<ThreeCanvas>` needs explicit `width`/`height` from `useVideoConfig()`. Use `shadows="percentage"`; three r187 removed the soft shadow type R3F picks for plain `shadows`.
- Lambert lighting divides by π. With `flat` (no tone mapping), hemisphere ≈ 2.6 plus directional ≈ 1.2 give true colours. Start there, then dim for night.
- In 9:16 the horizontal field of view is only ~23° at fov 40. **Lay space diagrams out vertically** (Moon above, Earth below, like the title card) and keep Earth (radius 3) at 20+ units from the camera.
- Aim wide street shots low so the hero's head stays above the caption band; aerial city shots look down at ~35–50°.

## Shared kit (`src/slavoski/`): built, reuse every episode

| File | Contents |
|---|---|
| `palette.ts` | The colour tokens above |
| `Stage.tsx` | A shot: sky gradient, canvas (2× supersampled with 4096 px shadows when the render's input props carry `hq: true`, see `isHq()`) with the house lighting per mood (`night`/`dawn`/`day`/`sunset`/`overcast`/`storm`/`snow`/`dust`/`space`, plus a `dust` blend and a `light` multiplier, e.g. 0.3 to see a planet's night side), fog, stars, vignette, declarative camera (position, target, `up`, `fov`) with seeded `shake`; also `project()` (pin HTML labels to 3D points) and `lerpCam()` |
| `rig/Hero.tsx`, `hero.ts` | Slavoski, the posable low-poly hero: `REST`, `walkPose`, `mergePose`, `lerpPose`, expressions (neutral, alarm, smile, worried, awe, relief), `handPosition()`, `headPosition()`, `armJoints`/`legJoints`, `reach()` (numeric IK), `groundedBob()`, `selfClipping()`; `ghost` (see-through observer) and `vanish` (flash and shrink to nothing) modes. Head radius 0.68, torso half-depth 0.36, height ≈ 4.2. |
| `city.tsx` | `Building` (seeded windows, `tilt`, `sink`, `power` blackout, `decay` with broken windows, ivy and roof plants), `StreetSet` (`lampsOn`, `modify`) and `CityGrid` (roads every `block`; with an even `blocks` count a road runs through x = 0, otherwise block centres sit there), `Road`, `Lamp` (`on`, `lean`), `PineTree`, `Car` (`rust`, `crumple`, `tilt`, `moss`; `CAR_HALF_LENGTH` for contact points), `Plane`, `PowerStation` |
| `nature.tsx` | `GrassTufts` (growth 0..1, over an area or along points), `Bush`, `LeafyTree`, `GroundCover`, `Rain` (`thickness`/`opacity`: thin it near the camera), `Snow`, `Clouds`, `LightningBolt` |
| `animals.tsx` | `Animal` (dog, deer, fox, wolf): ep. 2's simple quadruped rig with `walk` phase, `headPitch` (graze) and `sit` |
| `critters.tsx` | Expressive animals with Slavoski-style square eyes, brows (`flat`/`angry`/`worried`/`smug`) and a talking `mouth`: `Quadruped` (dog, cat, cow, pig, rat; `walk`, `rear` onto hind legs with `arms`, `sit`, `wag`), `Bird` (pigeon, crow, chicken; `peck`, `flap`, `pebble`), `Chimp`, `Octopus` (waving arms, `reach`), `ToonEyes`; `quadPaw()` gives a front paw's world position for held props |
| `detail.tsx` | `DetailProvider` / `useDetail()` and the detail-aware geometry elements (see "Detail level") |
| `screens.tsx` | `ScreenHtml` (HTML on a 3D screen: laid out once at a fixed design size, then perspective-mapped with `matrix3d`; upright with `yaw`, or `flat`), `screenCorners()`, `quadMatrix()`; and `CanvasPanel` (text/graphics drawn on a 2D canvas used as the texture of a real 3D plane) with `fitText()`/`CANVAS_FONT()`. **HTML overlays always draw on top of the 3D scene**, so a head passing in front of a sign gets covered by the label: use `CanvasPanel` for any sign something can pass in front of (street signs, billboards, boards people stand under), and `ScreenHtml` only for screens nothing occludes (a phone close-up, a TV seen over the couch). Never size HTML to the projected bounding box each frame (`tvScreenRect`): the text wobbles. |
| `room.tsx` | `GamingRoom` (couch, TV, wall clock and window sky that follow `hours` since noon, side table with cans, water bottle, phone), `SEAT`/`SEAT_YAW`, `sittingPose()`, `controllerAt()`, `Controller`, `tvScreenRect()` (projected TV screen, used to overlay a live game feed rendered by a second `Stage` with `size`) |
| `space.tsx` | `FacetedMoon`, `FacetedEarth` (atmosphere rim, clouds, tidal `stretch`, `heat`, `cityLights` 0..1), `OrbitPath` (dotted), `BlackHole` (core plus dashed marker ring), `AccretionDisk` |
| `fx.tsx` | `Meteor` (tapered trail plus rock), `Fireball`, `SmokeCluster`, `LavaCrack`, `Shockwave`, `Debris` (comes to rest on the ground), `FloodWater`, `Volcano` |
| `materials.tsx`, `noise.ts` | `Flat` (flat-shaded Lambert), `Glow` (unlit emissive) and `Halo` (a soft additive glow sprite: the house "bloom" for neon, lamps, beacons, cores and the sun; put one on every important light); seeded `noise1`/`noise3`/`fbm3`, `shake`, `ease` |
| `Overlays.tsx` | `BrandLockup` (SLAVOSKI plus chapter label), `TitleCard`, `EndCard` (no teaser), `Tag` ("REAL PHYSICS" / "DRAMATISED" / "HYPOTHESIS" / "EXPERT ESTIMATE" / "REAL SCIENCE" / "REAL PREDICTION"), `Readout` (HUD value), `CardLine` (info card) |
| `WordCaptions.tsx` | Captions in the house style (cream active word, amber keywords from a per-episode `KEYWORDS` list) |
| `timeline.ts` | `NarrationBlock`s (one per chapter), `estimateManifest()` (script-based timing until the voiceover exists), `blockTimes()`, `wordAt()`, `shotAt()`, `scheduleShots()` (cued shots → flat time-sorted list; use it for new episodes), `useTime()` |
| `Soundtrack.tsx` | Voice, music cues per act with `duck()`, SFX hits |

Episodes:
- `src/episodes/black-hole/` ("What If a Black Hole Appeared Next to Earth?", `BlackHole` composition, ep. 1). Approved script in `script.md`, narration blocks in `narration.ts`, real free-fall numbers in `physics.ts`, 35 shots in `shots.tsx` (each shot is a cue phrase plus a function of local time), episode props in `props.tsx` (`Marble`, `Binoculars`, `Arrow`, `DashedLine`, `Observatory`, `LensStars`, `EarthBreakup`, `CoastSet`). Until `public/voiceover/black-hole.json` exists it renders with estimated timing and a red "ANIMATIC" badge; importing the voiceover re-times every shot automatically.

- `src/episodes/no-humans/` ("What If Every Human on Earth Suddenly Disappeared?", `NoHumans` composition, ep. 2). Trimmed script (the user asked for a trim after pricing). Slavoski vanishes in the cold open and returns as a see-through ghost observer. A "TIME WITHOUT HUMANS" clock jumps per chapter (seconds → 24 hours → … → 10,000 years). Moods move from night to dawn as nature takes over. 35 shots; sound effects reused from ep. 1 at no cost.
- `src/episodes/gta-24h/` ("What If You Played GTA 6 for 24 Hours Straight?", `Gta24h` composition, ep. 3). Trimmed script. Slavoski in his gaming room; the game on his TV and in full-frame cutaways is **our own** neon low-poly city (palms, pink supercar, police cars, a cop on a bicycle) with our own HUD. **Never real GTA footage, logos, map or HUD** (Rockstar's copyright); the game is named only in the narration and title. HOURS PLAYED readout plus a draining SKILL bar.
- `src/episodes/smart-animals/` ("What If Every Animal Got Smart?", `SmartAnimals` composition, ep. 4). 60 s cut of the user's script (they asked for ≤ 60 s). First "mid" detail episode. A "TIME SINCE THE CHANGE" readout (1 MIN → 1 WEEK). Comic `Bubble`s and a `Pinned` label helper (HTML pinned to 3D points), stroke-drawn `GroundWriting`, instanced `AnimalSea`, `RatSwarm` (hundreds of rats in non-overlapping lanes) and `EyesInDark`. 13 new animal sound effects in `public/sfx/` (pigeon-coo, pebble-scratch, dog-grumble, cat-purr, tank-lid, chimp-hoots, crow-caws, cow-moo, fence-smash, gate-creak, chicken-flurry, rat-swarm, power-down), reusable in later episodes.
- `src/episodes/ww3-countdown/` ("What If WW3 Started in 7 Days?", `Ww3Countdown` composition, ep. 5). 60 s cut (take 66.3 s, tightened to 57.1 s keeping the countdown beats). One chapter per day with a `DayStamp`; a "WAR BEGINS IN" readout becomes a live "MIDNIGHT IN" countdown on day seven. **Generic world and non-graphic** (no real countries, flags or leaders; the end is a white sky fading to black, then an empty bed). Props: `OnScreen`/`screenRect` (HTML on an upright or `flat` 3D screen), `Phone3D` + `AlertScreen`/`DeadScreen`, `Supermarket`, `FuelQueue`, `Billboard` + `CrashChart`, `Terminal` + `Departures`, `Checkpoint`, `AtmWall`, `Jet`, `Siren`, `ShelterEntrance`, `BoardedShop`, `SummitHall` + `NewsGraphic`, `AlarmClock`. Reuses ep. 4's `Bedroom`/`BED`/`WIN`/`Chair` from `smart-animals/props.tsx` (move them into the kit if a third episode needs them). Extra sound effects for ep. 5: `phone-alert`, `air-raid-siren`, `jet-flyover`, `tv-static`. Status: **finished**: final delivered (`out/ww3-final.mp4`, 59.3 s, not in git), thumbnail in `thumbnails/ep5-ww3-countdown.png`. ElevenLabs spend ≈ 1,310 credits (voiceover 875, Scribe 365, 4 sound effects ≈ 67).
- `src/episodes/no-work-2036/` ("What If Work Ended in 2036?", `NoWork2036` composition, ep. 6). 60 s cut of the user's revised script; the user accepted the take running over 60 s (64.7 s, no tightening) as long as the spend stayed ≤ 1,350 credits: voiceover 960 + Scribe 356 = 1,316; later the user asked for a subtler phone moment and approved one new effect, `notify-chime` (17), so ≈ 1,333 in all. **The user dislikes buzzing/vibrating phones**: notifications are a soft chime, a still phone and a calm `LockScreen` card, no shake. Elon Musk is named in the narration only (a "REAL PREDICTION" tag, never a likeness); companies are generic (a hexagon logo, no text). A "THE YEAR" readout (2026 → 2036 → rolls to 2046 on "In ten years") and a "WELCOME TO 2036" `YearStamp`. Props worth reusing: `Robot` (our humanoid robot: `walk`, arms as `[pitch, roll, elbow]`, `robotHand()` for held props, `CarryBot` in the shots), `SkyscraperSite` + `slabTop(k)`, `Crane`, `Truck` (self-driving), `Factory` + `IndustrialArm` (two-bone `ik2`), `AiCore`, `CoinFlow`/`CoinPile`, `MegaTower`, `House`, `Stall`, `Beach`, `Blanket`, `Suitcase`, `HillRing`, `Skyline` (a ring of buildings so no background is empty), `ClosedFactory` (fence, CLOSED / NO HIRING signs), `Clinic` + `ScanHoop`, `Balance`, `Office` (the crossable "9 TO 5" sign), `PayScreen`/`QueueScreen`/`ScanReadout` phone and hologram UIs, `Strut` (a box between two points). **`future.tsx`: the 2036 city** the user asked for ("more advanced, with character, not a squared copy-paste"): `FutureCity` (bright or `corp` style; varied `FutureTower`s: glass with ribbon-window canvas facades, stepped with terrace gardens, twisted plates, round with light rings, needle spires; sky bridges, parks, `Monorail`, `Drones`; corp adds haze, searchlights, logo screens and `hq` towers), `FutureSkyline` (a ring of those towers for backdrops) and the redesigned `MegaTower` (podium, lit facade, sky lobby, logo crown, red halo, spire). Street shots wrap the kit street in `BigStreet` with neon blade signs, a sky bridge and drones. Reuse these for any future-city episode. Thumbnail: `thumbShot` in its shots, saved as `thumbnails/ep6-no-work-2036.png`.
- `src/episodes/satellites-dark/` ("What If Every Satellite Stopped Working?", `SatellitesDark` composition, ep. 7). The user's full script, unchanged; they accepted it running over a minute (take 71.2 s, no tightening). Spend: voiceover 1,175 + Scribe 392 + `ship-foghorn` 17 = 1,584 credits. A hook that does not start on Earth (see Episode structure) and an "ACTIVE SATELLITES" readout racing from 12,000 to 0. Arc: blue-hour dawn → foggy harbour → clear midday → afternoon living room → snowy village at dusk → hurricane storm → night command room → sunrise in orbit. Props: `Satellite` (gps/comms/weather/warning, `on` life 0..1, gold-foil bus, solar wings), `SkyTrain` (a line of satellites crossing the sky that blink out in a chain), `OrbitShell` (thousands of instanced satellites around Earth), `MapPin`, `MapScreen` (phone map: ok / lost / unknown), `CellTower`, `Sea`/`Quay`/`GantryCrane`/`ContainerShip`/`Lighthouse`, `Pylon`, `drawTicker` (market board, HALTED), `TrafficLight` (in the shots; flashing amber on failure), `SnowGround`/`Mountain`/`SnowPine`/`Cabin` (snowy village), `StormWall` + `Waves` (hurricane coast), `CommandRoom` + `drawWarRoomMap` (invented continents, no real countries) + `drawScope` (radar scope), `GroundDish`, `SPACESUIT` + `Helmet` (astronaut Slavoski), `NoSignalTV`, `NoService`, `drawWeather`. Thumbnail: `thumbShot`, saved as `thumbnails/ep7-satellites-dark.png`.
- `crowdLook(seed)` / `suitLook(seed)` in `hero.ts`: generic townsfolk and officials on Slavoski's rig (never orange jackets).
- Reuse the sound effects in `public/sfx/` across episodes before generating new ones.
- `scripts/shot-frames.ts` needs each new episode added to its `EPISODES` map.

Lessons (carry forward):
- **Scale streets to the hero.** Kit buildings have ~1-unit floors, cars are 3.1 long and lamps 4.6 tall, but Slavoski is 4.2 tall: at kit scale he stands four floors high and looks like a giant whenever his feet and the building bases share the ground. In shots with people, wrap the street in a ×3.5 group (`BigStreet` in the ww3 shots: road |x| < 12.25, pavements to 21.35) and keep human props (signs, shelters, ATMs) at human scale. Medium shots that hide the feet also avoid it.
- **Never leave an empty background** (the user noticed "past the border you can see nothing" and a car queue on bare ground). Every exterior needs something behind the action: a `StreetSet`/`CityGrid`, or trees, fences, hills, a distant town and mountains for countryside; every interior needs walls, pillars, windows and props. Check the far background in contact sheets, not just the subject.
- `StreetSet` has `trees` and `lamps` switches: when a prop must be seen clearly, turn them off and place your own lamps and trees out of the camera's line of sight (check with a still; a lamp head or pole in front of a sign is easy to miss).
- When adding props to a `StreetSet`, keep them clear of its own trees (left x = -5.0, z = -1 - 16i; right x = 5.1, z = -9 - 16i), lamps (x = ±4.0, z = 2 - 11i on the right, -3.5 - 11i on the left) and the road (|x| < 3.5); put signs and poles on the pavement.
- Size sign text to the sign: roughly fontSize ≤ 0.9 × height × (width/height) / (characters × 0.7), or it is clipped at both ends.
- This cloud container has no GPU: render with `--gl=swangle` (`angle` fails to create a WebGL context here). On a machine with a GPU, `angle` from `remotion.config.ts` is right.
- Pass `fog={false}` for sky objects (the Moon) so they don't fade into the sky colour. Give the Moon a little emissive so it reads light grey, not blue.
- In a 9:16 street shot, put the camera ~20 units from the hero (hero ≈ 25% of the frame height, as in the references). Closer than ~12 units crops him.
- The 9:16 frame is only ~23° wide: to get two things in one shot (the TV and Slavoski), stack them vertically, e.g. a high camera behind the couch with the TV above his head. Never let an HTML overlay (the TV feed) cross a character.
- In `CityGrid`, keep game and street cameras inside the road corridors (|x| or |z| within 2 of a road line): a camera a few units off a road is inside a building.
- Scribe writes numbers as digits ("300", "12", "VI"). `blockTimes()` now copes with word-count differences, but add digit forms to `KEYWORDS`.
- Keep tilted buildings safe by capping the lean by height (`tiltAway()` in the black-hole shots) and leaning neighbours in a block away from each other.
- To fit a take that ran long, shorten the pauses between sentences rather than speeding up the voice, then remap the word times: `npx tsx scripts/tighten-pauses.ts --in <take.mp3> --out public/voiceover/<slug>.mp3 --cap 0.22 --keep "<pause start>:<s>,…"` (keep comic beats longer), transcribe the original take, then import with `--audio public/voiceover/<slug>.mp3 --cuts public/voiceover/<slug>.mp3.cuts.json`.
- Use one continuous narration take from 0:00, with one scene per chapter and shots keyed to word times inside it.
- At true scale, sky objects look flat and dull from the ground. Exaggerate the size (the Moon fills the sky behind the hero) and keep facets and value contrast strong. We are "NOT TO SCALE" by design.
- Review loop: `npx remotion bundle --out-dir=build`, then `npx remotion still build <Id> out/x.png --frame=N` per frame; tile stills into contact sheets.
- Shot functions are called as plain functions inside the episode component: never call hooks (`useVideoConfig`, …) in them directly. Pass what they need through the shot context (`width`, `height`, `words`), or call hooks inside a real component.
- Animals at hero scale read best a little bigger than life (dog ×1.35, cat ×1.2–1.5) and with the camera 5–10 units away; closer than ~4 units crops heads in 9:16.
- Scribe transcription costs about 345 credits per minute of take (estimate_only said ~19, which was wrong).
- The 9:16 frame is only ~23° wide: anything long and horizontal (a balance beam, a row of houses, a queue, a stall with a customer) gets cropped head-on. Look along it at an angle so it recedes in depth (the queue is shot from the gate end, the suburb diagonally, the balance from ~50° off-axis), and check that the hero is not hidden behind the nearest extra.
- Hero arms up: raise them with the shoulder **roll** (second value, ~2.3–2.5) for a V or a wave. A big **pitch** (first value, ~2.6) swings the fists in front of the face and reads as "hands on head". The same holds for `Robot` arms.
- When a hand or prop passes in front of a display (a fist slamming an alarm clock), draw the display with `CanvasPanel`, not an HTML overlay.

## Audio and captions

- Use `<Audio>` from `@remotion/media` (not from `remotion`), with `src={staticFile(...)}`. Mix levels with `volume`, which can be a function of the frame for fades.
- Captions come from the ElevenLabs transcription of the final audio, so they always match what is spoken. Build pages with `createTikTokStyleCaptions` (short pages, 1–3 words). Every caption after the first carries a leading space, so keep `white-space: pre-wrap`.
- `scripts/import-audio.ts` reads ElevenLabs Scribe word lists (`{ text, type, start, end }` in seconds, as a bare list, `{ words }` or `{ transcripts: [{ words }] }`) and skips spacing and audio events, matching the connector's `words_download_url`.

## ElevenLabs credits

- **The user is cost-conscious.** Always price with `estimate_only` first and offer the cheap option. Measured costs: narration about 15 credits per second of speech per take (81 s ≈ 1,257); Scribe transcription ≈ 450 per 80 s; a sound effect ≈ 17 credits each (estimates say 50); a full-length music bed ≈ 1,500 (estimate). Default to **1 variation** for everything.
- Sound effects through `creative_generate_in_flow` ignore a duration written in the prompt and come back 1–3 s long (occasionally much longer: power-down came back 16 s; cut it with the `duration`/`fade` fields of an `Sfx` cue). They cost 16.7 credits each (estimate says 50). Starting many at once can hit a concurrency limit; the server queues and retries them itself, so don't call again. For a longer bed (a quake rumble), chain overlapping copies in `Soundtrack` rather than paying to regenerate.
- An audio-only check render (`--codec=mp3`) still renders every frame: add `--scale=0.1` so it's fast.

- Every generation and transcription spends the user's ElevenLabs credits. Don't regenerate audio that already exists unless its text or prompt changed. Use `estimate_only` and confirm with the user before long or bulk generations.
- Never call a generation tool twice to retry: each call is charged. On failure, read the error with `creative_get_flow_run_status` and report it.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Remotion Studio (live preview, props editor) |
| `npm run render -- <Id> out/<file>.mp4` | Render a composition to video (add `--gl=swangle` in the GPU-less cloud container; `--scale=0.5` for quick previews) |
| `npm run still -- <Id> out/<file>.png --frame=<n>` | Render a single frame |
| `npm run typecheck` | `tsc --noEmit` |
| `npx tsx scripts/shot-frames.ts <slug> [--frames]` | Shot list with lengths / mid-shot frames |
| `npx tsx scripts/contact-sheet.ts <Id> "<frames>" [scale] [out]` | Render many frames into one tiled contact sheet (needs `build/` from `npx remotion bundle`) |
| `npm run import-voiceover` / `import-audio` | Save ElevenLabs MCP output into `public/` (see `scripts/import-audio.ts`; `--cuts` remaps word times after `tighten-pauses`) |
| `npx tsx scripts/tighten-pauses.ts --in … --out … [--cap] [--keep]` | Shorten the pauses in a take (free) and write a `.cuts.json` for the import |

All `@remotion/*` packages must stay on the exact same version as `remotion`. Upgrade them together with `npx remotion upgrade`.
