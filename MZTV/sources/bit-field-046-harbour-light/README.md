# MZTV · BIT FIELD 046 · HARBOUR LIGHT (after J.M.W. Turner)

A harbour under a low sun, in six inks of dithered pixels. It's built for commercial spaces (a hotel lobby, a wall or a room wrapped in screens) as a calm, living painting that runs for days.

**Live:** https://matchzimmerman.github.io/MZTV/sources/bit-field-046-harbour-light/

**v2 (2026-11-12): local sky and a focus pull.** v1 (weather at Turner's own three places, always sharp) is kept at `v1.html`.

## What it is
- **Three of Turner's harbours as scenery**, four hours each: **Margate** (a stone pier with its light, luggers and smacks), **the Thames at Rotherhithe** (wharves, cranes, the city, barges, tugs) and **Venice from the Giudecca** (domes and campanile, gondolas, mooring poles, trabaccoli). The move from one to the next goes through a 15-minute veil.
- **The sky belongs to wherever the screen is.** The piece finds its place (see "Where it is" below) and uses that place's real sun height, clock and live weather:
  - sun height → the mood: low-sun morning, high haze, low-sun evening (fire), moonlight;
  - wind → cloud drift and how full the sails are;
  - cloud cover and low cloud → veils over the sun and grey in the middle inks;
  - humidity and visibility → haze, so far ships dissolve into the glow;
  - rain → curtains of streak;
  - swell from the nearest sea point (height and period) → water bands, boat roll, the sea wash and the bell buoy. Inland, the local wind makes the water instead.
- **Focus drifts.** Every 3.5 minutes the picture begins a 2–3 minute pull to a new focus, then holds:
  - **sharp**: everything crisp;
  - **soft**: the whole picture melts into glow, hard to make anything out;
  - **near** / **far**: depth of field, with the near boats or the horizon sharp and the rest dissolved;
  - **tilt**: a tilt-shift band of sharpness across the frame;
  - **patch**: soft, glowing sections drift across an otherwise sharp picture.
  Haze and the VEIL era push it softer; GLASS pulls it sharper. Soft sections bloom. The sound loses its edges as the picture does (the master lowpass closes and the echo lengthens).
- **Boats come and go.** Moorings fill and empty on 50-minute tides of occupancy; crossers pass slowly through two lanes.
- **Eras:** GLOW (default), VEIL (fog or haze; a far ship sounds its horn), GLASS (calm, near-still water), VORTEX (the rupture: after gusty pressure the clouds turn round the sun for 20–35 minutes, then the inks lean warm or cool for half a day).
- **Memory** (saved every 60 s, so reloads resume): steam tugs and steamers after about 45 minutes, lanterns at dusk after 2 hours, GLASS after calm, VORTEX after a storm or 10 hours, and a pale ghost ship on the Thames once a vortex has happened.

## Where it is
In order: `?lat=..&lon=..` (with an optional `?place=NAME` label) → the place saved from the last run (kept 7 days; `?fresh=1` clears it) → a city-level lookup from the network address → the device's time zone city → the device clock's meridian. No location prompt is shown. For a permanent install, set `?lat` and `?lon` in the URL so it never depends on a lookup.

## Sound (low, slow, quiet enough for a lobby)
- A sea wash and sub that breathe with the swell the boats are riding.
- A held chord: the root follows the place (D / C / E♭) and the voicing follows the light.
- The bell buoy you can see strikes at the end of its swing.
- Hull creaks on the near boats as they reverse their roll.
- A tug's engine when one is in view, and a foghorn in the veil.
- Wind and rain beds.
- A bounded dub delay.
- Highs are rolled off. Hardened per the MZTV protocol: watchdog, rebuild, 3-hour refresh, no looped buffers.

## Installations
- **One wide window:** any aspect works. On a browser spanning three displays (e.g. 5760×1080) the panorama widens and fills with more boats; there's one sun.
- **Separate machines per wall:** `?walls=3&wall=0`, `&wall=1`, `&wall=2`. Every motion is derived from the clock, so independent screens stay in step and the image continues across the seams. Use the same resolution and the same `?lat&lon` on each; memory is off in this mode, and unlocks come from the calendar. Each slice renders a hidden margin so soft focus meets across the seams.
- **For a lobby:** `?info=0`; `?held=evening` to keep a permanent sunset (real local time means a moonlit harbour every night); `?site=margate` to stay in one place; `?audio=0` for silence.

## Params
`?info=0 ?fresh=1 ?audio=0 ?seed=N ?rate=N ?lines=N ?ff=H ?capture=1 ?live=0 ?lat=N&lon=N ?place=NAME ?focus=off|sharp|soft|near|far|tilt|patch ?site=margate|thames|venice ?hour=H ?held=evening|dawn|day|night ?sun=0..1 ?walls=N&wall=i ?fps=N` · key `i` hides the info box · click or any key starts the sound (OBS autoplays).

Test handles: `MZ.force('vortex'|'glass'|'veil'|'glow'|'storm'|'calm'|'unlock'|'poison'|'site:venice'|'focus:soft')`, `MZ.state`, `MZ.step(sec,n)`.

## Tested (2026-11-12)
- Headless Chromium: all three places at morning, noon, evening and night; vortex and veil forced; 3840×720 panorama; wall slices 0 and 1 meet at the seam.
- No console errors.
- Audio recorded:
  - band energy mostly below 1 kHz; 3–6 kHz at −49 dB; no clicks.
  - Recovers from suspend, graph rebuild and context close.
- Save and reload resumes.
- A NaN-poisoned state regrows.
- `?ff=6` runs clean.

## Tested, v2 (2026-11-12)
- Each focus kind forced and screenshotted; the natural schedule sampled over 2 hours; soft-focus wall slices meet at the seam; render cost under 1 ms a frame at 320×180.
- `?lat&lon&place` drives the sun and clock (Baltimore at 20:43 gave moonlight).
- Audio re-recorded: no errors, no clicks.
- Not tested here: the network location lookup and live weather inside a real browser (the test sandbox blocks those requests). The endpoints were checked by hand for their response shape.
