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
- **Sound (v4).** Everything you can see has a voice. The water at the boat's hull comes from the drawn wave sum: it swashes up and drains off the hull continuously, drifting toward the side the waves come from (v5). The open-sea wash is weighted by swell and wind-sea height and swells as each swell passes under. Whitecaps break out on the bay, the wind gusts, rain patters, and a drone follows the sun and darkens with cloud. Each flare gets a thump, a hiss, a low boom and a soft burn, heard where it sits in the frame.

The marine values are a model's nearest-cell estimate for the bay, not a buoy reading. The info box shows which cell was used and when it last updated. If a request fails, the piece keeps the last reading (cached up to 3 h) or falls back to typical bay values, and says so.

- **Stream (latest):** https://www.matchzimmerman.com/MZTV/sources/bit-field-022-water-studies/

## Versions
Each iteration lives in its own folder and is never overwritten. The root URL always serves the latest version.
- **v1** · open water, no data: the sun and moon on the Baltimore clock, sea state drifting on its own, night flares. https://www.matchzimmerman.com/MZTV/sources/bit-field-022-water-studies/v1/
- **v2** · Galway Bay off Inverin: the real sun and moon over Inverin, with the bay's swell, wind, cloud and sea temperature from Open-Meteo. https://www.matchzimmerman.com/MZTV/sources/bit-field-022-water-studies/v2/
- **v3** · wider and higher: same Galway Bay data, with a 54° lens (was 34°), the camera 5–7.5 m above the water (was 1.6–3.8 m) and tilted slightly up so the horizon sits below centre. There is more sky and more of its reflection on the water. Short waves fade with distance so the wide view doesn't alias into a dashed grid. https://www.matchzimmerman.com/MZTV/sources/bit-field-022-water-studies/v3/
- **v4** · the sound follows what you see: the listening point is the deck of a boat riding the swell. The water level at the hull is computed from the same wave sum the screen draws, so each wave that reaches the boat is heard: bigger ones slap the planks with a thunk through the hull and a run-off, and small chop laps at the waterline. The open-sea wash is weighted by the real swell and wind-sea height and rises as each swell lifts the boat, whitecaps break out on the bay as often as they appear, wind gusts, rain patters when it's raining, cloud darkens the drone, and flares are heard where they are in the frame and follow it as they drift. Calm to storm now spans about 12 dB. https://www.matchzimmerman.com/MZTV/sources/bit-field-022-water-studies/v4/
- **v5** · the hull without the drum kit: v4's wave hits (noise bursts, a pitched thunk, a rising blup, hard random panning) read as a ping-pong snare and tom. In v5 the hull is continuous: a dark swash that rises as the water climbs the hull and a low drain as it falls away, driven every 20 ms by the drawn waves felt through the boat's inertia. It sits near centre and drifts slowly toward the side the waves come from. Only the biggest waves add a dull, unpitched body of water. No tones, no bright transients. https://www.matchzimmerman.com/MZTV/sources/bit-field-022-water-studies/v5/

Params: `?info=0` `?audio=0` `?seed=N` `?rate=N` (clock speed) `?hour=H` (Inverin start hour, today) `?utc=ISO` `?data={json}` (override readings) `?sea=0..1` (ignore data, fix sea state) `?cover=0..1` `?flares=N` (per hour at night) `?face=sun|moon` `?yaw=RAD` `?q=0..2` `?capture=1` · v3: `?fov=DEG` `?height=M` `?pitch=RAD`
Keys: `i` info · `f` fire a flare now
