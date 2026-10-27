# MZTV · BIT FIELD 033 · MZ WORLD · SRUTHÁN

A stream at the back of a field in Inverin, filmed through a macro lens and printed. *Sruthán* is Irish for a little stream. It runs on HEADLAND's engine: the linocut-through-OBAS print pass, the observational crew, the dub engine, and the memory and rupture logic. This piece adds a printed depth of field, and here the sun never sets.

**Live:** https://matchzimmerman.com/MZTV/sources/bit-field-033-sruthan/
**OBS:** Browser Source → that URL · 1920×1080 · enable "Control audio via OBS"
**Params:** `?info=0` · `?fresh=1` · `?audio=0` · `?seed=N` · `?rate=N` · `?lines=N` (internal resolution, default 720) · `?ff=MIN` · `?hour=H` · `?cam=N` (hold one camera) · `?live=0` (simulated weather) · `?capture=1` (no rAF; drive with `MZ.tick(dt)` / `MZ.advance(sec)`)
**Keys:** **I** info · **M** mute · **R** a hand in the stream (pushes toward rupture; logged as human intervention)
**Console:** `MZ.force('reverse' | 'breath' | 'rupture')` · `MZ.rain(mm)`

## Versions
- `index.html` is **v4** (current, 2026-10-27), collisions:
  - **Leaves stay on the water.** Floating leaves now steer around every stone at the waterline, not only the ones in the main flow, and are pushed back toward the channel wherever the bank comes within a few millimetres of the surface. They also ride just above the ripple, so they stay visible from a distance. Measured over 10 simulated minutes, 21% of floating-leaf positions in v3 were inside a stone; in v4 none were.
  - **The lens stays out of the bank.** Low cameras are held over the water instead of entering the bank and its grass, and they rise smoothly over any bank lip between the lens and what it is following. Over 400 frames of the LEAF operator, v3 was inside the bank or grass for 97 frames and v4 for none.
- `v3.html` is **v3** (2026-10-23):
  - **Still things keep still patterns.** The linocut hatching is carved into each surface rather than laid over the screen. When the lens drifts past a stone, wall or trunk, the lines move with the surface (perspective, parallax) and never slide across it. Line spacing follows distance in octaves, so the print keeps its density on screen. Moving things (grass, canopy, floating leaves, the wagtail) carry their pattern with them, and the water's lines are bent by its own advected flow. The print pass no longer computes lines from screen position. The paper grain and ordered dither stay fixed to the print, like paper.
  - **A new tree.** The ash has an old, fluted, buttressed trunk that leans from low down and forks at about 1.7 m into two leaders. There are thirteen flat, half-buried roots leaving the buttress lobes, and burls and ridges in the bark. The ROOTS operator now looks along the roots to the water instead of up the trunk.
  - Tested headless: a 4 cm sideways camera move matches best at the parallax shift in v3 and at zero shift in v2 (screen-anchored). All cameras render with no errors.
- `v2.html` is **v2**, the macro pass (moss cushions, pebbles, falling sheets, recomposed close cameras).
- v2 (now `v2.html`), the macro pass:
  - **Moss cushions** are real geometry, found by dropping rays onto every stone that stands clear of the water and placed along the bank toe and the wall copes. Hair-fine sporophyte stalks with capsules rise from some of them.
  - **Pebbles and grit** cover the gravel bar and the edges, about 6,500 of them.
  - **The bed shows through shallow water** as pebbles refracted by the ripples, streaked by the current.
  - **The falls are sheets:** water leaves each lip, arcs out further as the flow rises, and drops as ragged ropes into the pool.
  - **The close cameras are recomposed:** a FALL operator low in the plunge pool, a new PEBBLES operator looking into the riffle, MOSS working off real cushions, ROOTS working from the water, and EDDY looking down into the pool.
  - **Operators are already framed** when the mixer cuts to them, and a guard keeps every lens out of the stones.
  - **Leaves** fall mostly from the part of the crown over the water, so they land and float.
  - The ash now leans out over the stream rather than past it.
- `v1.html` is v1, the first sketch: the same world without macro detail. Its stones are faceted and its falls are only a steep surface.

## World
- **Place:**
  - About 18 m of stream crossing the back corner of a field above Inverin.
  - It enters through a hole at the foot of one drystone wall and leaves through a hole in another; a third wall closes the corner.
  - On the way it drops down a cascade into an upper pool, then over a slab fall into a wide pool with eddies, then runs along a gravel-bar riffle.
  - An old ash grows from the bank, its roots gripping the bank, and its crown hangs over the water.
  - Connemara's hills sit on the horizon.
- **Always day:** the sun circles the sky once a day. It's at its real height at noon (Galway time) and low in the north at midnight, so the light is never gone. The canopy throws moving dapple onto everything below.
- **Weather (live, Galway):**
  - wind → leaf fall, grass and canopy sway, dapple drift, the wind bed
  - cloud → light, dapple strength
  - humidity and rain → haze, echo feedback, rain rings on the pools, rain streaks
- **The stream remembers rain.** Rainfall soaks into a store that drains with an 8 h time constant, and that store sets the flow. The level and width of the water, the current, the foam, how far the falls arc, the roar and the tempo all follow it. The store survives reloads and drains by the time the source was dark.

## Life
- **Leaves** fall from the crown in the wind (more in autumn). They float with the current, spin with the eddies and catch on stones and edges. Some go over the falls and some stay on the banks as litter. The litter is kept across reloads for up to 36 h, and high water lifts it back into the stream.
- **A grey wagtail** bobs its tail on emergent stones, flits between them, and sometimes leaves the field for a few minutes.
- **Midges** hang in the still air under the tree.
- **Spray** comes off the foot of each fall.

## Cameras (macro, observational)
WALL HOLE · CASCADE · FALL · PEBBLES · EDDY · LEAF (follows a floating leaf downstream) · MOSS · ROOTS · FIELD (establishing) · WAGTAIL · UNDER THE TREE.

Each operator has its own aperture and racks focus slowly between foreground and background. The mixer cuts every 9–20 s on the 16th note, weighted by what's happening (a leaf afloat, a leaf in the eddy, an event).

**Printed depth of field:** every surface writes its circle of confusion into the data target. Out-of-focus areas print as gathered shade with wider, softer, lower-contrast lines and no outlines.

## The uncanny
| Event | Conditions | What happens |
|---|---|---|
| Reverse | low water, wind < 7 m/s, no rain | the stream runs backwards: leaves drift upstream and foam spirals the other way; a ♭II chord and a reverse swell |
| Breath | no heavy rain | the stones and the moss breathe in and out; a sub and a stone grind swell with them |

Each event remembers the hour, flow and wind it happened in, and recurs more readily under similar conditions. Repeated events habituate.

## Rupture
Tension builds with stability (epochs of about 50–95 min) and with each event. At 1 the stream holds still: the current stops, the falls freeze, and the band drops out. Then the print re-inks with a new colourway (weighted toward the least visited), a new line grammar and a new harmonic centre.

**Colourways:** Atlantic Print (home), Kelp & Salmon, Lichen, Pistachio Night, Signal Flare, Ultramarine, Bruise, Bog Cotton.

## Sound (the live lens is the microphone)
D phrygian family; the centre moves at rupture.
- **The water:** every feature is its own voice, placed where it sits in frame: the hole in the wall, the cascade, the fall (plus a low rumble), the eddy, the riffle and the outflow hole. Each is band-passed noise, lowpassed under about 1.1 kHz, and its level follows the lens distance and the flow.
- **Drips** from the lintels, leaves landing and rain on the pools make tuned plinks quantised to the 16th.
- **A leaf going over the fall** makes a thump thrown into the echo.
- **Bass:** the section of stream the lens follows (or the followed leaf) picks the bass degree.
- **Tempo:** set by the flow. Low water is slow (6.6 s bars) and a spate is faster (down to 4.2 s).
- **The wagtail** makes a soft, lowpassed chirp.
- **Harmony:** drone, pad chords every 4 bars, a dub echo with a unity-gain tanh loop, and a convolution room.
- **Master:** HP 26 Hz → tanh → high shelf −10 dB @ 2 kHz → LP 6.8 kHz → glue compressor.

## Tested (2026-10-21, headless Chromium / swiftshader)
- All eleven cameras render with no console errors, and events and rupture run.
- 12 s recording with events forced: −15.7 dB RMS, −8.6 dBFS peak. 60–120 Hz is loudest, 1–2 kHz −36 dB, 2–5 kHz −51 dB, above 5 kHz −63 dB.
- **Load:** heavy. There are about 20k grass blades, about 2,700 wall stones, about 6,500 pebbles, thousands of moss cushions, and a 12-tap depth-of-field gather in the print pass. It's built for a real GPU; software rendering managed only about 3 fps at 540 lines. If the studio machine struggles, `?lines=540` is the first lever.

## Known limits
- Water is opaque. The visible bed is printed into the surface, so you can't see deep pools through.
- Banks are smooth ground with grass; there are no ferns or ivy yet.
- The wagtail sometimes leaves, and its camera then frames the empty field.
