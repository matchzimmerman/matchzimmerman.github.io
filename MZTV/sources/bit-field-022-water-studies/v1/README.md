# MZTV · BIT FIELD 022 · WATER STUDIES

Open sea at water level. The only subject is light on moving water.

- **Sun and moon** follow the real Baltimore clock (late-September rise and set): dawn glitter over the sea, hard noon speculars, dusk colour, and a moon glade at night.
- **Flares.** At night, parachute flares go up in ones and volleys: red, white, magenta, green. Each one rises on a trail, ignites, drifts down on the wind, flickers and burns out. It throws its own glitter path across the swell, lights the cloud base above it, and trails a lit smoke column. When a flare burns, the camera eases round to frame the flare and its path together.
- **Swell** is real displaced wave geometry: seven wave trains with whitecaps when the sea is up. Sea state drifts over hours.
- **Camera** sits 1.6–4 m above the water. It drifts and bobs with the swell, turns once every 45 minutes, and slowly racks focus between near water and the horizon.
- **Lens.** Bright sources catch dust and moisture on the lens glass, with no ghost streaks.
- **Sound.** A brown-noise sea bed breathes with the swell, over a low drone whose colour follows the sky (its fifth drops a semitone at night). Each flare gets a thump when fired, a rising hiss, a low boom at ignition and a soft burn while it hangs, panned to where it is.

**What controls what**
- clock → sun + moon → glitter path, sky, drone colour
- sea state → swell height, whitecaps, sea-bed level
- each flare → its light path on the water, cloud glow, its sounds

- **Stream:** https://www.matchzimmerman.com/MZTV/sources/bit-field-022-water-studies/

Params: `?info=0` `?audio=0` `?seed=N` `?rate=N` (clock speed) `?hour=H` (start hour) `?sea=0..1` (fix sea state) `?flares=N` (per hour at night, default 26) `?face=sun|moon` `?yaw=RAD` `?q=0..2` `?capture=1` (`MZ.seek(t)`, `MZ.audioWav(t0, secs)`)
Keys: `i` info · `f` fire a flare now

three.js r170 loads from jsDelivr. The piece needs a GPU; it renders in real time on the studio machine.
