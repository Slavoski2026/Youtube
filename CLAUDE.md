# SLAVOSKI — 3D animation studio

This repo makes **SLAVOSKI** videos: vertical (9:16) narrated shorts in the series **"A Cosmic What If"** — one hypothetical per episode ("What if the Moon fell?"), told in numbered chapters, in a low-poly, night-lit, faceted 3D style with one recurring hero.

**Every animation in this project uses this exact stack.** Do not swap in other tools (Blender, Babylon.js, Motion Canvas, raw ffmpeg pipelines, other TTS/music providers, other caption libraries) unless the user explicitly asks for it.

| Job | Tool |
|---|---|
| 3D scenes, models, lighting, motion | **Three.js** through React Three Fiber, rendered inside Remotion's `<ThreeCanvas>` (`@remotion/three`) |
| Timeline, captions, audio mixing, rendering to video | **Remotion** (`remotion`, `@remotion/captions`, `@remotion/media`) |
| Voiceover, sound effects, music, transcription | **ElevenLabs MCP**: the hosted "ElevenLabs" connector (`creative_*` tools). There is no SDK and no API key in this project. |

> **Repo status:** the repo started empty. Paths below under `src/slavoski/`, `scripts/` and `public/` are the **planned layout**. When a section names a file that doesn't exist yet, build it there the first time it's needed (and update this file if the name or API changes). Never claim a helper exists without checking.

---

## The SLAVOSKI look (house style — hard rules)

Reference frames: ep. "What if the Moon fell?" — title card, `02 / A CHANGING SKY`, `04 / EARTH UNDER STRESS`, `07 / THE SKY FALLS`.

### Format
- **1080×1920, 30 fps**, vertical. Keep everything important inside the centre safe area (side margins ~7%, top ~12%, bottom ~15%) — platform UI covers the edges.
- Length follows the voiceover (see workflow). Typical episode: 60–90 s, 6–9 chapters.

### Geometry: low-poly, faceted, toy-like
- **Flat shading everywhere** (`flatShading` on every material). Facets must be visible: that is the look.
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

Mood arc: start cool and clean (deep navy, crisp stars), and as the scenario escalates shift toward dusty purple-brown skies, orange fire light and haze. Put the palette in `src/slavoski/palette.ts` and use only those tokens.

### Lighting
- Moonlit night: cool hemisphere light plus a soft directional "moon" key; warm practicals (windows, lamps, headlights) as emissive materials, not real lights.
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
Use one bold geometric sans (e.g. Montserrat/Poppins 800 from `public/fonts/`, loaded via `staticFile()`).
- **Brand lockup, top-left, every shot:** `SLAVOSKI` in white, bold, tracked wide (~0.3em), ~34 px. Under it, the chapter label `07  /  THE SKY FALLS` in grey-white (≈60% opacity), regular weight, tracked ~0.12em, ~26 px. Chapter number is two digits.
- **Title card (opens the episode, over the space shot):**
  - `SLAVOSKI`
  - `A COSMIC WHAT IF`
  - `HYPOTHETICAL SCENARIO  /  NOT TO SCALE` (small, dim)
  - Big two-line title, ~100 px heavy caps: line 1 white (`WHAT IF THE`), line 2 **brand amber** (`MOON FELL?`).
- **Captions:** one to three words per page, centred, ~70 px heavy rounded sans, white with a dark outline plus a soft drop shadow. The **currently spoken word turns cream** (`#F6EBC4`); **key words** (the scenario's nouns and verbs: *impacts*, *Moon*, *tides*…) are set in **brand amber**. Caption band centre at **~74% of frame height**.
- Keep heads and faces **above ~62%** of the frame so captions never cover a face; captions may cross torsos and legs.

### Episode structure
1. **Cold open / title card** (0–4 s): a space shot of Earth plus the scenario object, title lockup, narration hook ("What if the Moon suddenly started…").
2. **Numbered chapters** `01 … NN`, each with a short ALL-CAPS name (`A CHANGING SKY`, `EARTH UNDER STRESS`, `THE SKY FALLS`). The chapter label in the lockup updates on the cut into each chapter.
3. Escalation: each chapter is worse than the last; alternate street-level hero shots with wide city/aerial shots and space diagrams.
4. **Ending:** the resolution, then an end card (`SLAVOSKI` plus `A COSMIC WHAT IF`). **No next-episode teaser** unless the user asks for one.

Store chapters in the episode's `timeline.ts` as `{ n, title, at }` keyed to narration word times.

---

## Workflow for a new episode

1. **Script:** write the narration split into chapters (number plus title per chapter) and get the user's OK before spending credits.
2. **Voiceover** (on one flow per episode):
   1. `creative_create_flow` named `slavoski - <episode slug>`, then pass its `flow_id` to every call below.
   2. **Channel narrator voice: "Mark - Natural Conversations".** Use it for every episode unless the user asks for a different one. Find it with `creative_list_voices`. The first time it's used, write its voice ID here so later episodes can skip the lookup.
   3. `creative_generate_speech` with the narration. The user picks a take in the speech view; if they don't, use the first completed one. If they switch voice in the view, that starts new takes; read their `session_ids` with `read_widget_context` instead of generating again.
   4. `creative_get_flow_run_status` with the take's `session_ids` returns each take's `content_url` (a signed link, valid about 2 hours).
   5. Transcribe that exact take: `creative_attach_reference_file` with the `content_url`, then `creative_transcribe_audio` with `connect_from` set to the returned node. When it finishes, `creative_get_flow_run_status` returns `transcripts[0].words` and `transcripts[0].words_download_url`.
   6. Import both before the links expire: `npm run import-voiceover -- --name <slug> --audio "<content_url>" --words "<words_download_url>"`. This writes `public/voiceover/<slug>.mp3` and `public/voiceover/<slug>.json` (a `VoiceoverManifest` with word captions).
3. **Sound effects and music** only if the piece needs them (rumbles, impacts, whooshes, a low cinematic bed): `creative_generate_in_flow` with `node_type` `sfx` or `music` (check `creative_get_flow_node_types` for current models). Get the `content_url` from `creative_get_flow_run_status`, then `npm run import-audio -- --audio "<url>" --out sfx/<slug>.mp3` (or `music/<slug>.mp3`).
4. Create `src/episodes/<slug>/` (`<Name>.tsx`, `timeline.ts`, `props.tsx`), built on the shared kit in `src/slavoski/`. Register it in `src/Root.tsx` with `calculateMetadata={voiceoverMetadata<Props>(FPS)}` so its length follows the voiceover.
5. Check the work with `npm run typecheck`, then render stills of key frames: `npm run still -- <Id> out/<name>.png --frame=<n>`. Look at them before doing a full render. Always check the title card plus one frame per chapter.
6. Render the video: `npm run render -- <Id> out/<name>.mp4`. The user can preview interactively with `npm run dev` (Remotion Studio).
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

## Shared kit (`src/slavoski/`): build once, reuse every episode

| File | Contents |
|---|---|
| `palette.ts` | The colour tokens above |
| `Stage.tsx` | A canvas with the night lighting rig, fog, stars, vignette, and a declarative camera (position, look-at, optional `up` roll, `shake`) |
| `rig/Hero.tsx`, `hero.ts` | Slavoski, the posable low-poly hero (`walkPose`, `mergePose`, expressions, `handPosition()`), plus the IK and clipping tools above |
| `city.tsx` | `Building` (seeded windows, a `tilt`/`collapse` amount), `CityBlock` (a seeded layout with clear lanes), `Road`, `Lamp`, `PineTree`, `Car` |
| `space.tsx` | `FacetedMoon`, `FacetedEarth` (with atmosphere), `Stars`, `OrbitPath` (dotted line) |
| `fx.tsx` | `Meteor` (tapered emissive trail plus rock), `Fireball`, `SmokeCluster`, `LavaCrack` (glowing ribbon), `Debris`, `Shockwave`, screen shake |
| `Overlays.tsx` | `BrandLockup` (SLAVOSKI plus chapter label), `TitleCard`, `EndCard` (no teaser), optional "REAL PHYSICS" / "DRAMATISED" / "HYPOTHESIS" tags |
| `WordCaptions.tsx` | Captions in the house style (cream active word, amber keywords from a per-episode `KEYWORDS` list) |
| `timeline.ts` | Chapters `{ n, title, at }`, a `useTime()`/`shotAt()` helper to key shots to word times, and remapping of captions when pauses are trimmed |
| `Soundtrack.tsx` | Voice, music cues per act with `duck()`, SFX hits |

Lessons (carry forward):
- To fit a take that ran long, shorten the pauses between sentences rather than speeding up the voice, then remap the word times.
- Use one continuous narration take from 0:00, with one scene per chapter and shots keyed to word times inside it.
- At true scale, sky objects look flat and dull from the ground. Exaggerate the size (the Moon fills the sky behind the hero) and keep facets and value contrast strong. We are "NOT TO SCALE" by design.
- Review loop: `npx remotion bundle --out-dir=build`, then `npx remotion still build <Id> out/x.png --frame=N` per frame; tile stills into contact sheets.

## Audio and captions

- Use `<Audio>` from `@remotion/media` (not from `remotion`), with `src={staticFile(...)}`. Mix levels with `volume`, which can be a function of the frame for fades.
- Captions come from the ElevenLabs transcription of the final audio, so they always match what is spoken. Build pages with `createTikTokStyleCaptions` (short pages, 1–3 words). Every caption after the first carries a leading space, so keep `white-space: pre-wrap`.
- `scripts/import-audio.ts` reads ElevenLabs Scribe word lists (`{ text, type, start, end }` in seconds, as a bare list, `{ words }` or `{ transcripts: [{ words }] }`) and skips spacing and audio events, matching the connector's `words_download_url`.

## ElevenLabs credits

- Every generation and transcription spends the user's ElevenLabs credits. Don't regenerate audio that already exists unless its text or prompt changed. Use `estimate_only` and confirm with the user before long or bulk generations.
- Never call a generation tool twice to retry: each call is charged. On failure, read the error with `creative_get_flow_run_status` and report it.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Remotion Studio (live preview, props editor) |
| `npm run render -- <Id> out/<file>.mp4` | Render a composition to video |
| `npm run still -- <Id> out/<file>.png --frame=<n>` | Render a single frame |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run import-voiceover` / `import-audio` | Save ElevenLabs MCP output into `public/` (see `scripts/import-audio.ts`) |

All `@remotion/*` packages must stay on the exact same version as `remotion`. Upgrade them together with `npx remotion upgrade`.
