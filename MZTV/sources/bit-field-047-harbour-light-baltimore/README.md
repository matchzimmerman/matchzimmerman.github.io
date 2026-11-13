# MZTV · BIT FIELD 047 · HARBOUR LIGHT · BALTIMORE 1957

The immersive branch of HARBOUR LIGHT (BIT FIELD 046). One harbour, one era: Baltimore's working port around 1957. It's built as a 3D place in real metres and filmed by slow crane cameras that all face into one 120° arc, across the water to the Domino Sugars sign. At night the sign lies in the water.

**Live:** https://matchzimmerman.github.io/MZTV/sources/bit-field-047-harbour-light-baltimore/

## Why 1957
These are the last peak years of the working Inner Harbor:
- The **Domino Sugars** neon (Artkraft Strauss, maintained by Triangle Sign) had been lit since 25 April 1951. It is 120 × 70 ft, red-orange, and reads "Domino" over "Sugars". It sits on the 1922 refinery on Key Highway.
- Grain through the **B&O Locust Point elevator** (concrete, 1922, about 230 ft) peaked in 1956.
- The **Old Bay Line** night steamers still sailed for Norfolk every evening. They had sailed from a Pratt Street pier since the Light Street terminal was sold in 1950, and the service ended in April 1962.
- The **Bethlehem Steel Key Highway yard** under Federal Hill had its floating drydocks and whirley cranes.
- Pratt Street's **Pier 1** still took banana boats.
- Baker-Whiteley and Curtis Bay tugs worked the harbour, and B&O car floats crossed to Canton.

By the mid-60s the Pratt Street piers were derelict.

## What you see
- **Crane cameras.** Five stations, all on the north side:
  - Pier 5 · Pratt Street
  - Pier 1 · the banana pier
  - Pier 6 · President Street
  - Broadway Pier · Fells Point (goes up after 45 min)
  - a crane barge in the Northwest Branch (after 2.5 h)
- **The arc.** Every view points between 125° and 245° (SE → SW), never behind.
- **Shots.** Each shot is 45–115 s and one of five kinds:
  - static
  - orbit: the arm swings round its base while the camera holds the subject, so near pilings and workboats slide past
  - boom: rise or fall
  - slow pan
  - push in
- **Subjects:** the sign, the sign in the water, the refinery, Key Highway yard, Federal Hill, the grain elevator, Fort McHenry, the channel, or a vessel under way.
- **Camera sway.** The live wind sways every crane arm.
- **The place.**
  - The south shore: the Domino refinery (main house, char house, sugar sheds, two stacks, the wharf) with the sign on its roof, on its steel lattice.
  - Key Highway yard: shops, two floating drydocks with ships lifted in them, three whirley cranes slewing.
  - Federal Hill with trees and rowhouses.
  - Locust Point: the grain elevator, its pier and conveyor gallery, the B&O piers and sheds, rowhouses.
  - Fort McHenry at the point, its flag blowing with the live wind.
  - The far shore beyond: Fairfield and Curtis Bay tanks and stacks, and the Sparrows Point mill low on the left. Its furnaces glow at night.
- **Smoke.** Smoke and steam from every stack (refinery, ships, far industry) drift in the real wind direction.
- **Light.**
  - Baltimore's real sun position and clock (America/New_York) set the light. A winter sunset sits inside the arc on the right.
  - Lit windows and street lamps come on at night along Key Highway.
  - The sign lights from dusk to dawn. By day its letters show dark red.
- **The water.** It reflects the whole harbour through a true mirror camera. The wind chop breaks the neon's reflection into horizontal shimmer. When the water goes calm (GLASS) the sign lies whole.

## The working harbour (from Baltimore's clock)
- **Old Bay Line** (CITY OF NORFOLK and CITY OF RICHMOND, alternating days):
  - She sails at **18:30**, backs out of her slip, turns and steams down the Branch past Domino toward Fort McHenry, with a whistle.
  - The other boat comes in at **07:00** and lies at Pratt Street through the day.
- **Banana boat** at Pier 1 about 2–3 days a week.
- **Raw-sugar ship** at the Domino wharf on about half of days, lying under the sign.
- **Locust Point:** five berths with cargo ships (Liberty or Victory types, sometimes a reefer) on 26–46 hour cycles. They arrive and leave along the channel with two tugs and a horn.
- **Grain ship** under the elevator spouts most days.
- **Drydocks:** ships change weekly.
- **Tugs:** four harbour tugs run errands on 20-minute slots between Recreation Pier, the berths, the wharf and the yard.
- **B&O car float:** crosses on a tug's hip every 90 minutes.
- **Bay workboats** moored by the camera piers: deadrises and buy boats, plus skipjacks in oyster season (Nov–Apr).

## Weather (live, Baltimore)
- **Wind** sets the smoke direction, the cloud drift, the crane sway, the chop that breaks the reflection, and the flag.
- **Cloud and low cloud** veil the sun.
- **Humidity and visibility** set the haze. The air starts smoky, because a 1950s coal city had soft-coal haze, and fog closes in on top of that.
- **Rain** draws streaks.

## Eras, memory, rupture
- **WORKING** (default).
- **VEIL:** fog or haze off the water. The neon blooms wide and a far horn sounds.
- **GLASS:** wind under about 2.5 m/s. The branch goes to a mirror and the sign lies whole.
- **LONG TAKE** (the rupture): pressure builds over calm hours and nights. After 3 hours of memory, one crane stops cutting and makes a single continuous 18–30 minute move (orbit, boom and slow zoom). Then the cutting resumes.
- **Memory** (saved every 60 s, so reloads resume):
  - New crane stations go up over hours.
  - Stations where things happened get chosen more (attention that fades over hours).
  - Once a crane has seen the Old Bay Line sail, the cameras **learn the timetable**: every evening from about 18:20 they wait for her.

## Sound (low; the whole harbour hums at 60 Hz)
- **The held chord** is built on harmonics of American mains, 60 Hz. The voicing darkens at night.
- **The neon** has a transformer hum at 120 Hz, with 60 and 180, through a soft saturator. It is as loud as the sign is large in frame, and only while it's lit.
- **Water** laps and breathes with the chop; a sub sits under everything.
- **Industrial rumble** rises nearer the refinery.
- **The nearest working tug** is heard, panned by where it is.
- **Whistles and horns** are heard **at their distance**: sound travels at 343 m/s, so the steamer's whistle reaches the crane seconds after its steam puff.
- **Also:** workboat creaks, wind and rain beds, and a bounded dub delay.
- **Mix:** highs rolled off. Recorded test: energy mostly below 150 Hz; 3–6 kHz at −52 dB; no clicks.
- **Hardened** per the MZTV protocol: watchdog, rebuild, 3-hour refresh, continuously synthesised sources and no looped buffers.

## Params
`?info=0 ?fresh=1 ?audio=0 ?seed=N ?rate=N ?lines=N (216) ?ff=H ?capture=1 ?live=0 ?fps=N ?hour=H (Baltimore local) ?held=evening|night|dawn|day ?focus=off|sharp|soft|near|far|tilt|patch ?cam=0..4 ?shot=sign|water|refinery|yard|hill|elevator|fort|channel|v:bayline`
- Key `i` hides the info box.
- Click or any key starts the sound (OBS autoplays).
- Test-only: `?ships=1` lines up one of each vessel type in front of the barge.

Handles: `MZ.force('take'|'glass'|'veil'|'working'|'storm'|'calm'|'fog'|'unlock'|'poison'|'next'|'cam:N'|'shot:NAME'|'focus:KIND')`, `MZ.state`, `MZ.step(sec,n)`, `MZ.lock={x,y,z,yaw,pitch,fov}`.

## Accuracy and limits
- Positions come from real coordinates (metres from the sign), for:
  - the Pratt Street piers
  - the Domino refinery
  - Key Highway
  - Federal Hill
  - the B&O elevator
  - Fort McHenry
  - Sparrows Point
- The 1957 shoreline is approximated to about 25 m. The buildings are massing, not surveyed footprints.
- Vessels are two crossed profiles drawn from type (rig, house, stack and kingposts), not from plans.
- Steamer departure and arrival times follow the line's evening and morning pattern. The other schedules are plausible patterns, not records.
- The sign's letterforms use an italic display serif fitted to its two lines. They are close in spirit, not traced.

## Tested (2026-11-12)
- Headless Chromium:
  - night, evening, dawn and day from every station
  - fog/VEIL, storm, GLASS and LONG TAKE forced
  - each focus kind
  - the vessel lineup by day
  - the 18:30 departure
- No console errors.
- Audio recorded 40 s:
  - band balance as above, no clicks
  - recovers from suspend, rebuild and close
- Save and reload resume memory.
- A NaN-poisoned state regrows.
- `?ff=1` and `?ff=6` run clean; stations unlock at 0.75 h and 2.5 h.
- Render cost about 27 ms a frame at 384×216 in the CPU-only test sandbox (the v3 piece measures 17 ms there). On a real GPU machine it should sit well inside 30 fps.
- Not tested here: live weather inside a real browser (the sandbox blocks the request). The endpoint is the same one HARBOUR LIGHT uses.
