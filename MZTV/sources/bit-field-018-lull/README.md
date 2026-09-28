# MZTV · BIT FIELD 018 · LULL

A night field for falling asleep. Tones from an A = 432 Hz just-intoned pentatonic drift in and out over a low A drone, a breathing pad and a brown-noise bed. Every tone drops a lantern into a slow, dithered membrane. Over the evening the whole field slows, falls in register, flattens into steady sound, dims, and loses its blue.

- **Stream** (OBS / Twitch): `index.html`. The arc follows the local clock: day field 07–19, dusk descent 19–22:30, deep 22:30–05:30, dawn 05:30–07.
- **Bedside**: `bedtime.html`. The arc starts when you press play and reaches deep after about 45 min (`?arc=MIN`), then stays deep and keeps evolving. It keeps its own memory, separate from the stream's.

## What it is built on (and how solid each piece is)

| Choice | Why | Evidence |
|---|---|---|
| Breath pacer, inhale 40% / exhale 60%, slowing 8 → 5 breaths/min | Slow breathing with a longer exhale raises vagal (parasympathetic) tone. The pad swell and lantern size are a pacer you can breathe with. | Good (slow-breathing / HRV literature, e.g. Zaccaro et al. 2018 review) |
| Nothing sudden: ≥2 s tone attacks, no percussion, everything lowpassed (tones ≤ ~1.8 kHz, master 3.2 kHz) | Abrupt onsets and bright transients trigger orienting/startle responses and micro-arousals in sleep | Good (sleep noise-arousal research, e.g. Basner) |
| Slow tempo, low register, predictable structure | Slow, low, predictable music is what the sleep-music trials used | Moderate (Cochrane review: music improves self-reported sleep quality in insomnia, Jespersen et al. 2022) |
| Melody learns its own transitions, so it becomes more familiar with each night | Predictability lowers arousal; recurrence without exact repetition | Plausible (predictive processing), not directly tested |
| Brown noise bed, lowpassed under 250–520 Hz, rising through the arc | Masks household sounds; steady broadband noise shortened sleep onset in some studies | Mixed but positive (e.g. Spencer et al. 1990, newborns; Zhou et al. 2012, pink noise) |
| Breath modulation flattens once deep | Once asleep, steady sound disturbs least | Follows from the arousal research above |
| Light dims and loses blue (plum, mulberry, coral, apricot) | Melanopsin, peak ~480 nm, drives melatonin suppression; dim, warm light suppresses least | Strong (Brainard 2001; Gooley 2011) |
| A = 432 Hz tuning | A tradition and a sound. Keeps the "432" character | Weak. One small study (Calamassi & Pomponi 2019) found slightly lower heart rate vs 440 Hz. Most claims about 432 are not supported. |
| Optional binaural pair (`?binaural=1`, headphones, Δ 6 → 2 Hz) | Theta → delta entrainment is the claim | Weak/mixed for sleep; off by default |

For children: keep the volume low. Pediatric researchers recommend infant sound machines stay under 50 dBA, placed away from the crib (Hugh et al., *Pediatrics* 2014).

## System

- **Breath**: a continuous phase accumulator, so rate changes never jump. It drives the pad gain and filter, the lantern radius, and the whole field's swell. Tones are planned only inside the exhale.
- **Tones**: pool A3 216 → F#5 720 Hz (A B D E F#), with 432 in the middle. The window falls to A3–A4 in deep. Density goes from 8 to under 1 per minute. Pitch sets a lantern's height and pan sets its x position.
- **Harmony**: pad banks crossfade over 40 s at breath boundaries: HOME A · OPEN Asus4 · WARM D/A · SIX A6/9 (unlocked). The harmonic centre also shifts the palette's hue.
- **Memory** (persists across reloads): lanterns leave sediment (half-life 3 days) that holds the note heard there, and new lanterns prefer moderately worn ground. A 10×10 transition table learns the lullaby and relaxes back toward its prior (half-life 4 days). As familiarity grows, choices sharpen.
- **Unlocks**: echo from worn ground (~1.5 h) · low A bell in deep (3 h) · A6/9 chord (7 h, needs familiarity) · tide: the noise bed moves across the stereo field (16 h).
- **Visual grammar**: LATTICE (bayer) · PEARL (round clustered dots) · GRAIN (interleaved gradient). The grammar shifts under pressure from wear and familiarity, crossfading over 3 min.

## Params
`?info=0|1|2 ?fresh=1 ?audio=0 ?seed=N ?rate=N ?lines=N ?ff=H ?capture=1 ?arc=MIN ?end=MIN ?binaural=1 ?vol=0..1.5 ?dim=0.1..1.5 ?t0=MIN` · key `i` cycles info.
On the bedside version the info box recedes after 90 s. `?end=60` fades the sound fully out at 60 min.
