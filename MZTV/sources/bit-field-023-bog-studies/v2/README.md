# MZTV · BIT FIELD 023 · BOG STUDIES · INVERIN

Standing in the bog above Inverin, a sister piece to WATER STUDIES. The only subject is wind moving through grass: purple moor grass (molinia) tussocks, heather, short sedge, scattered rhododendrons, granite erratics and black bog pools. The live weather at Inverin drives it.

- **The wind is one field.** Gusts are frozen turbulence carried across the bog at the real wind speed, in two sizes: patches of about 64 m and puffs of about 13 m, moving at slightly different speeds so the pattern keeps changing shape. Every blade, leaf, pool surface and sound reads that same field, so a gust you see running toward you is the gust you hear arrive. Each blade bends by how hard the wind blows where it stands, and taller blades answer a moment later. Far off, bent grass shows paler, so gusts run across the bog as light patches.
- **Live weather** from Open-Meteo for Inverin (53.25N 9.47W), refreshed every 15 minutes and eased in over about a minute:
  - wind speed + gusts → how far everything bends, how gusty the field is, and the loudness of the grass
  - wind direction → which way everything leans, runs and drifts, clouds and rain included
  - cloud cover → the cloud layer and the cloud shadows moving over the bog. The shadows come from the same clouds you see in the sky.
  - rain → streaks slanted by the wind, darker wet grass, glossier leaves and rocks, pools stippled, patter in the sound
  - humidity + dew point in still air → mist lying in the hollows
  - visibility → haze
- **Sun and moon** are computed for Inverin from the real time. Low sun backlights the grass. The clock in the info box is Irish time. The camera stands at eye height, drifts a few metres and turns once every 45 minutes.
- **The date** sets the bog's colour through the year: bleached straw in winter, new green in spring, heather in flower in late summer, molinia going russet in autumn.
- **Memory: the lay of the grass.** Molinia stays combed the way the wind has pushed it. The piece keeps a slow average of the last ~6 hours of wind and leans the tall grass that way, even after the wind drops. It is saved in the browser every minute, so an OBS reload picks up where it was. `?fresh=1` starts over.
- **Sound.** Everything you can see has a voice, all read from the wind field:
  - the grass on your left and on your right, each hearing the gusts on its own side, so a gust front crosses the stereo field as it crosses the frame
  - a low roar of the whole bog that follows the mean wind
  - a sub-bass buffet when a gust reaches you
  - the stems singing: six narrow resonances in D Phrygian (D2 F2 A2 D3 E♭3 A3). Each wakes in its own band of wind speed at your feet, so a rising gust walks up the scale.
  - a leathery rustle for the two nearest rhododendrons, heard where they stand
  - rain, and a drone that follows the sun. The drone opens and adds a minor third when the sun breaks through the cloud. At night the fifth rises to the flat sixth.
  - The whole mix is dark: nearly everything sits below 1 kHz, with a soft ceiling instead of a hard clip.

If the weather request fails, the piece keeps the last reading (cached up to 3 h) or falls back to typical values, and the info box says so.

- **This version (v2):** https://www.matchzimmerman.com/MZTV/sources/bit-field-023-bog-studies/v2/

## Versions
Each iteration lives in its own folder and is never overwritten. The root URL always serves the latest version.
- **v1** · the bog above Inverin, from a photo of tussocks, heather, a rhododendron and a pale erratic under an overcast sky. Live Inverin wind, gusts, cloud, rain, humidity and visibility; real sun and moon; seasonal colour; the lay of the grass as memory. https://www.matchzimmerman.com/MZTV/sources/bit-field-023-bog-studies/v1/
- **v2** · the rhododendron in the front right is gone, and the other rhododendrons lose the dark block at their centre. Each whorl of leaves now sits on a thin woody stem rising from the ground and bending stiffly in the wind, so the bushes stay rooted in the bog. https://www.matchzimmerman.com/MZTV/sources/bit-field-023-bog-studies/v2/

Params: `?info=0` `?audio=0` `?seed=N` `?rate=N` (clock speed) `?hour=H` (Inverin start hour, today) `?utc=ISO` `?data={json}` (override readings: wind, gust, windDir, cloud, precip, vis, temp, rh, dew) `?wind=M/S` `?gust=M/S` `?dir=DEG` `?rain=MM` `?cover=0..1` `?face=wind|across` `?yaw=RAD` `?pitch=RAD` `?fov=DEG` `?height=M` `?q=0..2` (quality; 1 or 0 for slower machines) `?fresh=1` `?capture=1`
Keys: `i` info
