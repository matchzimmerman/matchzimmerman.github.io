# MZTV · BIT FIELD 043 · MZ WORLD · ROOST

TWISTED TREE's world, unchanged, with flat black and white creatures from Match Zimmerman's linocut spread through it. Woods, twisted tree, bridges, dry stream beds, wooden birds, eleven-camera crew, inks, events, memory and sound are BIT FIELD 035 Study 003. BIT FIELD 035 itself is untouched.

**Status:** on the branch `mz-world/roost-043`, not published to `main`. Awaiting MZ.Human's review.
**Live (once merged):** https://matchzimmerman.com/MZTV/sources/bit-field-043-roost/
**Params, keys, console:** as BIT FIELD 035, plus `MZ.figs` and `MZ.setInfo(v)`. Default `?lines` is 1080 (720 on phones). **Tap the info card** to remove it; tap the world to bring it back.

## The figures
Twelve creatures, five chicks, a nest and an egg, cut from the print into jointed flat parts (`creatures.png`: red = marks, green = silhouette). Always pure black and white whatever the colourway, with a paper keyline so they leave the woods. They turn to whichever lens is live. Each keeps its own stretch of the world:

| Figure | Where |
|---|---|
| GRIFFIN · MASK | either edge of the clearing |
| EGG | alone at the south of the clearing |
| CYCLOPS | the first dry stream bed |
| ANTLER | rails of the first bridge |
| BANDAGE | rails of the second bridge |
| FLAME | the trail near the fork |
| SHIELD | the trail at the wood edge |
| TARGET | beside the trail between the bridges |
| NEST + CHICKS | the verge south of the bridges |
| SHADES | in the air over the fork |
| BAT | in the air over the south trail |
| GRILLE | in the air over the north trail |
| BRAIN | in the air behind the clearing |

Walkers and flyers move between a few stations in their own stretch, rest for 25–130 s, and stop during the hush. A figure closer than 3.2 m to the live lens is hidden, so none fills or blocks a shot.

## Scale for screens
Pixel density follows the device (up to 2×). On narrow screens the lens widens so the sideways view holds, and line spacing scales with the frame.

## Credit
This piece carries no credit to *The Day I Found the Beauty of Nature*, and uses none of its words on screen, because the creatures are not part of that story.

## Tested (2026-11-08, headless Chromium + SwiftShader)
All 11 cameras at 1280×720, one camera at 390×844, forced events and rupture, one simulated hour, tap card off and on: no console or page errors, no NaN. Longer runs were not repeated: the engine is 035's, tested for 6 h. Sound unchanged from 035, so not re-measured. GPU load not measured on real hardware.
