# MZTV · BIT FIELD 046 · HARBOUR LIGHT (after J.M.W. Turner)

A harbour under a low sun, in six inks of dithered pixels. It's built for commercial spaces (a hotel lobby, a wall or a room wrapped in screens) as a calm, living painting that runs for days.

**Live:** https://matchzimmerman.github.io/MZTV/sources/bit-field-046-harbour-light/

## What it is
- **Three of Turner's places**, four hours each: **Margate** (the "Thanet skies", a stone pier with its light, luggers and smacks), **the Thames at Rotherhithe** (the Temeraire reach: wharves, cranes, the city, barges, tugs) and **Venice from the Giudecca** (domes and campanile, gondolas, mooring poles, trabaccoli). The move from one place to the next goes through a 15-minute veil: the boats dissolve into the light and new ones come out of it.
- **The light is real.** The sun's true height at that place sets the mood: low-sun morning (Norham-pale), high haze (Venice gold), low-sun evening (fire), moonlight. Evenings are stretched, so the glow lasts about an hour past sunset before the moon takes over.
- **The weather is live** at each place:
  - wind → cloud drift and how full the sails are;
  - cloud cover and low cloud → veils over the sun and grey in the middle inks;
  - humidity and visibility → haze, so far ships dissolve into the glow;
  - rain → curtains of streak;
  - the marine swell (height and period) → water bands, how far boats roll, the sea wash and the bell buoy.
- **Boats come and go.** Moorings fill and empty on 50-minute tides of occupancy; vessels sail off into the light and others arrive. Crossers pass slowly through two lanes.
- **Eras:**
  - **GLOW** is the default.
  - **VEIL** (fog or haze) dissolves the far ships, and a far ship sounds its horn.
  - **GLASS** (calm) is near-still water with a perfect reflection.
  - **VORTEX** is the rupture: after a build-up of gusty pressure, the clouds turn round the sun for 20–35 minutes (Snow Storm). When it's spent, the inks lean warm or cool for half a day.
- **Memory** (saved every 60 s, so reloads resume): hours watched, storm, rain, calm and fog hours, vortices, inks.
  - Steam tugs and steamers (with smoke) arrive after about 45 minutes.
  - Lanterns, with long reflections, appear at dusk after 2 hours.
  - GLASS needs calm in memory.
  - VORTEX needs a storm in memory, or 10 hours.
  - A pale ghost ship (the Temeraire) can appear on the Thames once a vortex has happened.

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
- **Separate machines per wall:** `?walls=3&wall=0`, `&wall=1`, `&wall=2`. Every motion is derived from the clock, so independent screens stay in step and the image continues across the seams. Use the same resolution on each; memory is off in this mode, and unlocks come from the calendar.
- **For a lobby:** `?info=0`; `?held=evening` to keep a permanent sunset; `?site=margate` to stay in one place; `?audio=0` for silence.

## Params
`?info=0 ?fresh=1 ?audio=0 ?seed=N ?rate=N ?lines=N ?ff=H ?capture=1 ?live=0 ?site=margate|thames|venice ?hour=H ?held=evening|dawn|day|night ?sun=0..1 ?walls=N&wall=i ?fps=N` · key `i` hides the info box · click or any key starts the sound (OBS autoplays).

Test handles: `MZ.force('vortex'|'glass'|'veil'|'glow'|'storm'|'calm'|'unlock'|'poison'|'site:venice')`, `MZ.state`, `MZ.step(sec,n)`.

## Tested (2026-11-12)
- Headless Chromium: all three places at morning, noon, evening and night; vortex and veil forced; 3840×720 panorama; wall slices 0 and 1 meet at the seam.
- No console errors.
- Audio recorded:
  - band energy mostly below 1 kHz; 3–6 kHz at −49 dB; no clicks.
  - Recovers from suspend, graph rebuild and context close.
- Save and reload resumes.
- A NaN-poisoned state regrows.
- `?ff=6` runs clean.
