# MZTV · BIT FIELD 022 · WATER STUDIES · GALWAY BAY

Galway Bay off Inverin, at water level. The only subject is light on moving water, and the bay's live conditions drive it.

- **Sun and moon** are computed for Inverin (53.23°N 9.48°W) from the real time: their true height and bearing, and the moon's real phase. The clock in the info box is Irish time. The camera starts facing south across the bay and turns once every 45 minutes.
- **The bay's conditions** come from Open-Meteo: the marine model's nearest open-water cell in the bay (tried from 53.19N 9.48W outward) and the weather at Inverin. They refresh every 15 minutes and ease in over about a minute.
  - swell height, period, direction → the three long wave trains: their height, their length (L = 1.56·T²) and the direction they travel
  - wind-wave height and wind → the four short trains of chop, which run with the wind
  - wind speed → whitecaps above about 5 m/s, how fast the surface texture moves, cloud drift, flare drift, and a wind hiss in the sound
  - cloud cover, rain, visibility → cloud layer, dimmed sun, haze in the sky
  - sea surface temperature → water colour (colder is greener and darker)
- **Flares.** At night, parachute flares go up in ones and volleys: red, white, magenta, green. Each one rises, ignites, drifts downwind on the real wind and burns out. It throws its own glitter path across the swell and lights the cloud base above it, and the camera eases round to frame it.
- **Lens.** Bright sources catch dust on the glass, with no ghost streaks.
- **Sound.** The sea bed breathes at the swell's period and rises with wave height and wind. A drone's colour follows the sky. Each flare gets a thump, a hiss, a low boom and a soft burn.

The marine values are a model's nearest-cell estimate for the bay, not a buoy reading. The info box shows which cell was used and when it last updated. If a request fails, the piece keeps the last reading (cached up to 3 h) or falls back to typical bay values, and says so.

- **Stream:** https://www.matchzimmerman.com/MZTV/sources/bit-field-022-water-studies/

Params: `?info=0` `?audio=0` `?seed=N` `?rate=N` (clock speed) `?hour=H` (Inverin start hour, today) `?utc=ISO` `?data={json}` (override readings) `?sea=0..1` (ignore data, fix sea state) `?cover=0..1` `?flares=N` (per hour at night) `?face=sun|moon` `?yaw=RAD` `?q=0..2` `?capture=1`
Keys: `i` info · `f` fire a flare now
