# MZTV · BIT FIELD 034 · MZ WORLD · LOCH RAVEN

A lone, unnamed **imaginary dam keeper** at Loch Raven Dam north of Baltimore, observed across a sculpted wooded gorge, concrete dam, road, gauges, reservoir and spillway. A six-ink world built from HEADLAND's engine, with SRUTHÁN v3-style surface-anchored engraved hatching and animated water marks.

**Status (2026-10-23):** GitHub review branch `mz-world/loch-raven-034`. **Not deployed, not published, not approved for broadcast.**
**Planned live URL after approval/deployment:** `https://matchzimmerman.com/MZTV/sources/bit-field-034-loch-raven/` (NOT LIVE).
**OBS after deployment:** Browser Source → URL above · 1920×1080 · enable “Control audio via OBS”.
**Params:** `?info=0` · `?fresh=1` · `?audio=0` · `?seed=N` · `?rate=N` · `?lines=N` (720 desktop; 480 default on small screens; 420–540 for weaker GPUs) · `?ff=MIN` · `?hour=H` · `?cam=N` · `?live=0` (simulated weather) · `?capture=1` (drive with `MZ.tick(dt)` / `MZ.advance(sec)`).
**Keys:** **I** info · **M** mute · **R** human intervention toward rupture.
**Console:** `MZ.force('warren' | 'rupture')` · `MZ.cam(0..8)` · `MZ.look([x,y,z],[x,y,z],fov)` · `MZ.rain(mm)` · `MZ.seekHour(h)` · `MZ.ink(i)` · `MZ.grammar({...})`.

## World
- **Place:** Loch Raven Dam and spillway, Baltimore County, Maryland · **39.43038° N, 76.54358° W**.
- **Time:** local Eastern time with DST, astronomically calculated sun, moon position and moon phase at the coordinates.
- **Weather:** Open-Meteo current conditions every 15 min. Wind, cloud, humidity, temperature, precipitation. Values slew over about 90–120 seconds. Fallback to simulated weather is labelled on screen.
- **Sculptural geography:** a stylized gravity-dam profile, concrete apron and spillway, wooded flanking slopes and reservoir upstream. This is **NOT** a surveyed DEM, verified engineering section, official map, or a safe walking route. Site geometry and individual gauge housings are an artist's abstraction.
- **Water:** rainfall enters an eight-hour store. A deliberate slow synthetic cycle and that store together determine a **modelled**, **dimensionless** reservoir datum and *flow index* (0–42); there is no direct reservoir-gauge or gate-operation API in this prototype. These numbers are never presented as real elevation or cubic metres per second. Flow controls visual spill sheets, engraved flowlines and the music. Reservoir level controls waterline and Warren's low-water threshold.
- **Rendering idea — hydraulic engraving:** still materials retain world-anchored etched lines with distance-scaled octaves. The reservoir and spillwater instead advect their etched marks along the moving current; real ink palette quantization applies to every pixel. October-oriented deciduous woodland is abstract geometry, not mapped tree species.

## Inhabitants
- **Keeper:** a nameless, fictional and silent work figure, not a historical identification. Walks the symbolic crest between west access, west gauge, spillway overlook, east gauge and east access. Counts each gauge check; rain and strong wind discourage rounds. Off duty late at night. The keeper's target sets bass degree.
- **Waterbirds:** three simple self-moving bird forms circulate over the reservoir.
- No quests, dialogue or user-directed story.

## Memory
- Rainfall store persists with weather-influenced flow; inspection counts and individual gauge checks persist across reloads.
- The lone uncanny event stores local hour, modelled water level and wind, recalls similar conditions and habituates with repetition.
- Rupture tension, epochs, ink visit counts, current ink, printed grammar and a 40-entry log persist to `localStorage` (`mzworld-loch-raven-v1`, or with the `-sN` suffix for a seed).
- Saves at least every simulated 60 s and on unload; `?fresh=1` clears memory.

## Cameras (observational)
**SPILLWAY · WEST WORKS · CREST ROAD · KEEPER · TAILWATER · EAST GAUGE · UPSTREAM · LONG LENS · WATERLINE.**

Operators independently hold and drift, and the director selects weighted shots every 8–19 s on a 16th note. It is not scripted to frame the apparition, even if it occurs. `?cam=N` holds one camera for technical inspection.

## The uncanny
| Event | Conditions | What happens |
|---|---|---|
| **WARREN BELOW** | Modelled level below **20.5**, precipitation under 0.3 mm/h and wind under 10 m/s; 48-minute event cooldown | For 60–115 seconds, a few sparse unlabelled straight lines and rectangular fragments seem to occupy the low-water surface farther upstream. They dither into visibility, then vanish. A ♭II chord, reversed swell, quiet high fifth and sub resonance. |

**Historical boundary:** Warren was a real town in the Gunpowder Valley dismantled as part of Loch Raven Reservoir's expansion. Its former site was farther upstream near Warren Road Bridge, **not on the dam apron or spillway**. The rectangular lines are **NOT surveyed foundations, actual mapped street positions, archaeological claims, or reconstructed buildings**; the event is an imaginative displacement/memory, not a depiction of submerged buildings under the actual spillway. This is the *only* place-based uncanny event.

**Intentional rule exception:** HEADLAND standard v1.0 normally requires 2–5 uncanny events; this piece deliberately has exactly **one**, as requested. Its event can only naturally happen during the rare modelled low-water window; the 14–34-minute gap is counted *after* an event, while eligibility checks may wait longer. The separate `hush` is the shared technical rupture transition, not a second apparition.

## Rupture
Stability adds tension through epochs around 50–95 minutes. On the threshold the visual flow hushes and the musical bed drops back for 22–34 seconds. The world returns in a new colourway (weighted toward less-used inks), new line grammar and harmonic centre. Key **R** pushes tension toward rupture and logs a human intervention.

**Colourways (six inks each):** **LOCH RAVEN SLATE** (home) · SPILLWAY LIMESTONE · WARREN WATERLINE · OCTOBER CANOPY · SIGNAL FLARE · PISTACHIO NIGHT · ULTRAMARINE · GUNPOWDER FOG.

Home inks in INK / DEEP / SEA / HOT / GLOW / PAPER order: `#1c2b36` · `#3c5162` · `#477b76` · `#b87454` · `#cbbf96` · `#ece4cd`.

## Sound (the lens is the microphone)
- D Phrygian family; centre changes at rupture.
- **Bar length follows spillway modelled flow index** (not real measured discharge): 6.6 s at flow 0 → 4.15 s at flow index 42. Lookahead scheduler quantizes the director and hydraulic knocks to the 16th.
- Keeper target maps the bass degree as inspections happen. The flow index drives the spatialized lowpassed reservoir/spillway bed, while wind and rain create separate beds.
- Drone, four-bar chord changes, Euclidean kick, dub echo with unity-gain tanh feedback loop (humidity-linked), convolution room. Warren introduces ♭II, reverse swell, high fifth and a restrained low resonance.
- Master: high-pass 26 Hz → tanh saturation → high shelf −10 dB at 2 kHz → low-pass 6.8 kHz → glue compressor.

## Hardening
The fork retains HEADLAND's AudioWorklet with blob/long-buffer fallback, envelope-and-disconnect one-shots, 40 ms scheduler that skips missed time, audio watchdog (closed/suspended context, stalled clock, nonfinite samples, silence and periodic rebuilding), finite-state safeguards, WebGL context hooks, and autosaved state. Sound starts immediately when allowed by browser/OBS, otherwise on user gesture; no splash screen. Browser/OBS behaviour still requires practical verification.

## Tested (2026-10-23)
- **Complete JavaScript module static parse: PASS**, after removing ES module imports for syntax-only checking.
- Scene construction and its camera/event/audio APIs have **NOT** yet been run in a WebGL-enabled browser in this build session.
- All nine cameras at day/dusk/night, forced WARREN BELOW and rupture, six simulated hours, reload persistence, GPU frame rate and 12–20 s audio capture/spectrum have **NOT** been verified. This is an honest untested prototype, not a claim of successful burn-in.

## Known limits / fidelity gates
- The modelled reservoir datum and 0–42 hydraulic flow index are *aesthetic control variables*, not operational USGS/municipal telemetry or a water forecast. Real hydrological integration requires a documented source, units, station datum, temporal coverage and separate provenance.
- Dam geometry, crest route, gauge housings, upstream ghost lines, tree species and vegetation placement are interpretive, not official survey data. No claims about safe public access or permission to walk the dam.
- A crest walk crossing and simplified concrete surfaces are artistic rather than structurally or historically verified.
- Autumn foliage is a visual interpretation for the October 23, 2026 premiere, not a per-tree phenology model.
- Browser mobile/WebGL performance and OBS audio balance are not yet measured. `?lines=540` or `?lines=420` reduces GPU load.
- No WALK/FLY/BUILDER interface has been added. Such future tools belong in a separate folder and cannot mutate this broadcast source.

## Grounding sources
- [Maryland State Archives · Baltimore County chronology](https://msa.maryland.gov/msa/mdmanual/36loc/bco/chron/html/bcochron.html) — historic Warren and reservoir chronology.
- [The Baltimore Banner · Warren and Loch Raven](https://www.thebanner.com/community/local-news/loch-raven-ghost-town-warren-BN6IQXROPRGMXE4QFEKFIIIRDY/) — contextual history of Warren's former site upstream.
- [Association of State Dam Safety Officials · Loch Raven Dam improvements](https://damsafety.org/reference/designing-and-constructing-spillway-and-stability-improvements-loch-raven-dam) — dam and spillway engineering context.

**Build standard:** MZ WORLD — HEADLAND style v1.0 (2026-10-23), private canonical protocol not included in public source.