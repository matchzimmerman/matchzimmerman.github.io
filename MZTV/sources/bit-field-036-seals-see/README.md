# MZTV · BIT FIELD 036 · MZ WORLD · TO SEE WHAT SEALS SEE

A world made from the opening poem of Match Zimmerman's chapbook *To See What Seals See*. The Inverin shore of Galway Bay, seen from the water: damp sand and seaweed-draped rocks, the farm's fields rising behind with haystacks, drystone walls, the house and the green hay barn, and an Irish Naval patrol ship at anchor in the bay. A plastic bottle with a rolled sheet of ship's stationery drifts on the wind, the swell and the tide. Two of us come down at low water to turn stones, find the bottle, leave a cairn and put it back to sea; later there is a call, and an inflatable comes in to take us out to tea on the ship, to see what seals see daily: a view of our home from the bay. It is printed on HEADLAND's linocut-through-OBAS pass with SRUTHÁN v3's surface-carved hatching, filmed by an observational crew, and it remembers.

**Live:** https://matchzimmerman.com/MZTV/sources/bit-field-036-seals-see/
**OBS:** Browser Source → that URL · 1920×1080 · enable "Control audio via OBS"
**Params:** `?info=0` · `?fresh=1` · `?audio=0` · `?seed=N` · `?rate=N` · `?lines=N` (internal resolution, default 720; 420–540 for phones or weak GPUs) · `?ff=MIN` · `?hour=H` (start at Galway hour H) · `?cam=N` (hold one camera) · `?live=0` (simulated weather and tide) · `?capture=1` (no rAF; drive with `MZ.tick(dt)` / `MZ.advance(sec)`)
**Keys:** **I** info · **M** mute · **R** a hand in the bay (pushes toward rupture; logged as human intervention)
**Console:** `MZ.force('seals' | 'call' | 'bow' | 'adrift' | 'hush' | 'rupture')` · `MZ.tide(h | null)` (hold the tide, testing) · `MZ.bottleTo(x, z, state)` · `MZ.invite()`

## The poem → the world
| Line | In the world |
|---|---|
| a raft adrift / navigating white horses | the bottle, adrift on live wind, swell and tide; whitecaps break on the crests as the wind rises past ~5 m/s |
| damp sand and salt-soaked rocks | the sand darkens and holds the sky below the last high water; rock wears a dark wet band and wrack between the tides |
| seals spying atop seaweed-draped stone | six seals haul out on three reef rocks when the tide uncovers them, look about, and spy (bottle) in the water |
| rocks turned to see hidden crabs and eels | at low water we turn cobbles; a crab or an eel sometimes runs from under one; the sea turns them back on the flood |
| a protected place to bury thoughts for future strangers | every find leaves a small cairn of turned stones above the tide; cairns stand for two days |
| a captain's attempt to connect sea to land | the bottle; its sheet is never readable — no coordinates, number or ship's name are invented |
| a call / a conversation / a captain's invitation | after a find, a call (off-screen, in the house); the inflatable comes in to the slip |
| inflated vessels quickly clipping peaks and skipping troughs | the inflatable runs at ~11 m/s, hopping the crests, spray off the bow |
| tea on an Irish Naval ship | we go aboard for 25–45 minutes; the DECK operator is favoured while we're there |
| a view of our home from the bay / counting haystacks from the deck | DECK: the farm across ~430 m of water, eleven haystacks in the coastal fields |
| bowing in reverence | the uncanny event BOWING |
| memories adrift, lost in the infinite expanse | the uncanny event ADRIFT; the bottle can go out past the ship, out of sight, and come back |

## World
- **Place:** the Inverin shore of Galway Bay, 53.236°N 9.48°W. A rocky point to the south-west with the seals' reef off it, a sandy cove, a concrete slip, a storm ridge of shingle, the farm's fields rising behind (a shore wall with a painted green gate between concrete pillars, field walls, eleven haystacks), the house, the green hay barn with hay on a raised floor, wind-bent trees, the townland's field walls running up the slope, the neighbours' houses along the shore. Connemara's uplands behind, the hills across the bay to the south, low islands to the west-south-west. **Sculpted to suggest the place, not surveyed from it**; the farm's layout is interpretive. Axes: +x north (inland), +z east, −x the bay.
- **The ship:** an offshore patrol vessel (unnamed, no hull number), riding to her anchor ~430 m off: she lies head to wind, swings with the tide, pitches and rolls with the swell; anchor lights at night.
- **Time:** real Galway time. Sun and moon computed for the place; the moon carries its real phase.
- **Weather:** Open-Meteo for Galway Bay (current weather + marine), polled every 15 min, slewed over minutes. Simulated fallback when unreachable (shown on screen).
  - swell height, period, direction → Gerstner sea, shoaling in the shallows, breakers, thumps on the rocks, bar length
  - wind speed, direction → chop, white horses, the bottle's drift, cloud drift, gulls, the ship's heading, the wind bed
  - cloud → light, sky; humidity, rain → haze, echo feedback, rain streaks, drops on the seal's lens
- **Tide:** Open-Meteo's modelled sea level for the bay (`sea_level_height_msl`, hourly, interpolated) when it answers — labelled **BAY MODEL**; otherwise two harmonics (M2 + S2) labelled **MODELLED**. Neither is a tide prediction. The tide moves the whole bay up and down the foreshore, sets the current that carries the bottle, wets the sand, uncovers the reef for the seals, and decides when we go down to the shore.

## Life
- **The bottle** (the central thread): wind drift (~2.6% of wind), the tide's current (flood onshore and east, ebb off), the swell's push in the surf, and a wander. It strands where the water runs out from under it, knocks on stones, refloats on the flood, goes out of sight past the ship and comes back. **Where it is picks the bass.**
- **Two of us** come down from the house at low water in daylight (or when the bottle is ashore in the cove): turn stones, find the bottle if it's there, build a cairn, put it back to sea, go home. Indoors at night, in heavy rain, and late.
- **The inflatable** belongs to the ship: it lies alongside until a call, runs in to the slip, takes us out, waits through tea, brings us back.
- **Seals** haul out on the reef when the tide is low enough, slip off when it rises or when the inflatable or we come close (and **remember** which rock was disturbed); in the water they swim the reef, spy, and look at us, the inflatable, the lens or the home. Hauled seals sometimes moan.
- **Gulls** soar, follow the inflatable, perch on the reef, the ship's mast and gun, and the walls.

## Memory
- Each event remembers the **hour, swell and tide** it happened in and recurs more readily under similar ones; repeats habituate.
- **Cairns** of turned stones from every find stand above the tide for 48 hours of real time (also across reloads), then the weather takes them (logged on resume).
- The bottle's **position, state and voyage count**, the number of finds and trips, the seals' haul-out preference, the log (40 lines) and colourway visits persist in `localStorage` (`mzworld-seals-see-v1`, or `-s<seed>`), saved every 60 s and on unload; `?fresh=1` clears it.

## Cameras (observational)
DECK (from the ship's rail: the home from the bay) · SEAL (the seal's eye on the waterline by the reef) · BOTTLE (follows it: on the waterline when it floats, low on the sand when it's ashore) · TIDELINE · ROCKS (the turned stones when we're there, the reef otherwise) · US (follows us; when we're in, the house from the storm ridge) · HAYSTACKS · INFLATABLE · LONG LENS (from the house: the ship, the reef, the bottle) · GULL. Operators hold and drift; the mixer cuts every 8–19 s on the 16th note, weighted by what is moving and lightly by what the current event touches. It never cuts to the story.

**New rendering idea — the seal's eye:** SEAL and BOTTLE sit with the lens on the water surface. A wavy meniscus crosses the frame where the still water plane through the lens meets it; below it everything is printed under the water (caustics, murk that closes in with depth and distance, kelp, the seals' bodies, light shafts from the surface), with a bright band where the surface is seen from below and drops running down the dome above. The sound goes under too (a 520 Hz lowpass ahead of the master chain while the lens is submerged).

## The uncanny
Global gap 14–34 min; each has its own cooldown.
| Event | Conditions | What happens |
|---|---|---|
| SEALS SEE | ≥3 seals hauled or at the reef, light (sun or moon up), swell < 2.8 m, the inflatable not running | every seal turns, together, to look at the home; the ones in the water rise to spy; a ♭II chord and a reverse swell |
| THE CALL | twilight or night, dry, clear enough, the ship at anchor, nobody on the shore | a lamp on the ship's bridge wing and a lamp in the house speak across the bay in phrases of flashes, answered; a high fifth in the room, soft tones on each flash |
| BOWING | sun up, wind < 9.5 m/s, and we're at tea on the ship, or on the shore, or the swell is low | the haystacks bow toward the bay one after another, as if counted; the ship dips her bow; a sub swells with a breath |
| ADRIFT | the tide falling and the bottle out in the bay or lost | the bay fills with bottles adrift, from the surf out past the ship, drifting out and going under; tuned knocks in the echo |

## Rupture
Tension builds with stability (epochs ~50–95 min) and with each event (+0.08). At 1 the bay holds its breath (the sea goes to a mirror, the bottle and the seals still, the band drops out); then the print re-inks: new colourway (weighted toward the least visited), new line grammar (period, dither, wobble, outlines, hatch), new harmonic centre.
**Colourways:** Atlantic Print (home) · Wrack · Stationery · Signal Flare · Pistachio Night · Ultramarine · Lichen · Haystack. Wrack, Stationery and Haystack are new, named from the poem.

## Print
The scene renders to a nearest-filtered data target (shade, material id ÷32, carved line, accent + circle of confusion); the print pass carves lines by tone, adds ordered dither and speckle, outlines between materials, prints the depth of field and the meniscus, and resolves to six inks (INK, DEEP, SEA, HOT, GLOW, PAPER). Lines are carved into each surface (SRUTHÁN v3): wrack hangs down the stone, sand ripples run along the shore, grass is combed one way, hay runs down the stack, steel runs along the hull, the sea's lines run along the swell. **New here:** line spacing is chosen from the surface's screen-space rate of change (foreshortening included) and snapped to octaves, so fields seen at a grazing angle from the bay keep clean lines instead of aliasing; the sky's lines are spaced by angle and run level, like HEADLAND's.

## Sound (the live lens is the microphone)
D phrygian family; centre moves at rupture. The bay (brown noise per side following the water's edge near the lens) · swell thumping on the shore and the reef, panned where it is in frame (spray at the rocky ones) · Euclidean kick · bass whose degree is the bottle's place (ashore in the cove or in our hands → I, in the surf or ashore elsewhere → IV, in the bay → ♭II, far out → V, by the ship → ♭VII, out of sight → ♭VI), folded under 120 Hz · drone · pad (chord every 4 bars) · wind and rain beds · the inflatable's outboard and the ship's generators, placed by the lens · seal moans and gull calls from what is in frame · knocks of the bottle on stone · dub echo with a unity-gain tanh loop, feedback from humidity · convolution room. **Bar length = 0.55 × swell period, stretched up to 8% at slack water (4.0–6.6 s).**
Master: (seal's-eye lowpass, open unless submerged) → HP 26 Hz → tanh → high shelf −10 dB @ 2 kHz → LP 6.8 kHz → glue compressor.

## Hardening
Noise from an AudioWorklet (data: URL, blob fallback, long buffers last). One-shots enveloped and self-disconnecting. Lookahead scheduler skips after stalls. Watchdog every 1 s: resume when suspended; rebuild on close, clock stall > 6 s, NaN or 20 s silence; refresh every 3 h (the old context's close can't throw). The bottle, us, the inflatable, the seals and the gulls self-heal from non-finite state. WebGL context loss handled. Pre-warmed 10 s so it is moving on the first frame.

## Tested (2026-10-28, headless Chromium/swiftshader)
- All ten cameras at noon, mid-afternoon (high water), dusk and night; every event forced and rendered; rupture re-inks; no console errors.
- 3 simulated hours (seed 7, from 06:00): 8 events (seals 4, call 2, bow 2) ≈ every 22 min, 3 ruptures ≈ hourly; the whole thread ran once on its own (down to the shore, crabs and an eel under stones, the bottle came ashore, found, cairn, back to sea, a call, invitation, tea on the ship); no NaN; reload resumed the same epoch.
- 18 s recordings: −12 dB RMS, −5 dBFS peak; relative to 60–120 Hz: 20–60 −9 dB, 120–250 −12 dB, 2–5 kHz −61 dB, above 5 kHz −84 dB (HEADLAND measured the same way: −9, −11, −58, −82); per-second RMS flat; no clicks. Seal's eye: 2–5 kHz −68 dB.
- AudioContext suspend and close both recover; WebGL context loss/restore recovers; a poisoned (NaN) bottle regrows.
- GPU: headless swiftshader only; not yet measured on real hardware. Use `?lines=540` (or 420) on phones and weak GPUs.

## Known limits
- The farm, the shore and the reef are interpretive; the ship is a generic patrol vessel, not a particular one.
- The tide is a model (Open-Meteo's sea-level model, or two harmonics), not a prediction for the slip.
- The ADRIFT bottles are small; from the GULL and DECK operators they are hard to see, so the director favours the close lenses during it.
- Walls far up the slope are low, long boxes rather than single stones (to keep the draw count down).
- Visitor WALK / builder layers are not built; `h(x, z)` and `grammar(g)` are exposed for them.
