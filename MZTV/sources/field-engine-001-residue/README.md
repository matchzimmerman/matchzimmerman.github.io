# MZTV · FIELD ENGINE 001 · RESIDUE

A first standalone piece built explicitly under the **FIELD ENGINE** branch of MZTV.

One moving source presses into a heterogeneous material field. The same pressure event has four linked consequences:

1. **Motion** — pressure propagates through the field according to each cell's stiffness and absorption.
2. **Light / color** — active energy and accumulated exposure are rendered as a four-color, dithered field.
3. **Sound** — local material properties determine the resonance, filter, duration and stereo position of each excitation.
4. **Memory** — repeated exposure leaves residue. Well-used paths harden slightly; rupture scars soften them. Later forces therefore travel through a materially different field.

The point is not audiovisual synchronization as decoration. Image and sound are readings of the same underlying event and the event changes the substrate that receives the next one.

## Behavior

The source wanders autonomously and periodically injects pressure into the field. Sustained pressure leaves stronger residue. The piece persists residue and scars in browser storage with a long decay, allowing an OBS source to develop a history across sessions.

Human interaction temporarily takes over the source:

- move pointer / touch — move the source
- click / tap — inject pressure
- `SPACE` — rupture the material locally
- `A` — return source to autonomous motion / take it back
- `I` — toggle explanation
- `R` — clear field memory

## Rendering

FIELD ENGINE is the behavioral system. This piece borrows an OBAS-adjacent rendering grammar — low resolution, hard quantization, four-color palette and Bayer dithering — without treating FIELD ENGINE as a replacement for the OBAS lineage.

## Audio

The sonic field uses Web Audio. Material stiffness, reflectivity, absorption, residue and scar state determine local resonant events. Global field energy and accumulated residue continuously reshape the low noise bed and drone.

Click once in a normal browser to unlock audio.

## Runtime

https://www.matchzimmerman.com/MZTV/sources/field-engine-001-residue/

Params: `?fresh=1` `?audio=0` `?info=0` `?rate=N` `?seed=N` `?capture=1`