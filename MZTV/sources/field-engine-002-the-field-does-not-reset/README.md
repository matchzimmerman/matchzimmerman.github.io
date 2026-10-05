# MZTV · FIELD ENGINE 002 · THE FIELD DOES NOT RESET

A data-driven FIELD ENGINE work.

Public incident records flagged as shootings are replayed in chronological order across one continuous material field. Each event enters at its recorded geographic position with the same initial force. There is no severity scaling, no iconography, and no attempt to turn an individual incident into a visual climax.

The field tries to settle after each event, but it does not fully return to its earlier state.

## Behavior

- A rolling year of shooting-flagged public incident data is fetched from the official NIBRS Group A ArcGIS dataset.
- Events are sorted by occurrence time and replayed proportionally across the performance.
- Geographic coordinates determine position only. The piece does not draw a street map or display addresses, neighborhoods, victim demographics, or place names.
- Each event injects the same pressure pulse.
- Pressure decays.
- A smaller residue remains.
- A still smaller absence layer remains and changes later propagation.
- At the end of the year, the field is held without new events before the performance can loop.

The point is accumulation rather than spectacle: the data acts on the material system, and the altered system becomes the record.

## Visual system

FIELD ENGINE supplies the behavior. The rendering borrows the established MZTV four-color / low-resolution / ordered-dither grammar:

- paper — unaltered field
- hot — current disturbance
- cyan — accumulated residue
- ink — persistent absence / structural loss

No event is enlarged based on outcome.

## Audio

Web Audio uses the same events that disturb the visual field. Each event creates a brief low resonant excitation at a stereo position derived from its field position. Accumulated residue and absence gradually alter the noise bed, drone level and filtering.

Click once to enable sound in a normal browser.

## Controls

- `I` — toggle the explanatory text
- `SPACE` — pause / continue the timeline
- `R` — restart the year

## Runtime parameters

- `?minutes=12` — compressed duration of the year
- `?hold=30` — seconds to hold the altered field after the last event
- `?days=365` — data window
- `?loop=0` — stop after the final hold instead of looping
- `?audio=0` — disable audio
- `?info=0` — hide explanatory text
- `?speed=N` — timeline speed multiplier
- `?capture=1` — capture / OBS mode

Path:

`sources/field-engine-002-the-field-does-not-reset/index.html`

Live:

`https://matchzimmerman.github.io/MZTV/sources/field-engine-002-the-field-does-not-reset/`