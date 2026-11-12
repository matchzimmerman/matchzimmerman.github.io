# MZTV · MZ WORLD · INVERLAND

*INVERLAND is the canonical name for the whole territory (MZ.Human, 2026-11-09). The folder, URL and saved-state key keep the old working title `mz-world-inverin` until a migration is approved.*

The shared, walkable MZ WORLD. HEADLAND is the ground, with TWISTED TREE planted inland and SRUTHÁN running from the wood down to the sea, all in one scene, one sky, one print and one sound system. The original pieces are untouched.

**You walk as the keeper.** The camera follows her from behind. Leave the controls alone for 75 seconds and she goes back to her own errands with the camera still following; touch a key and she is yours again where she stands. Indoors, and with V, the camera crew has the picture. In the wreck's hold the view moves to her eyes.

**Keys:** WASD walk · click to look · Shift run · C kneel · V hand back to the crew · 1–6 house, pier, tree, stream, wreck, farm · I info · M mute · R rupture
**Touch:** left side moves, right side looks
**Params:** HEADLAND's, plus `?walk=0` for the crew-only version and `?idle=SEC` for how long before the keeper takes her walk back

## What is in here
- **HEADLAND:** coast, house, pier, keeper, boat, seal, gulls, events, memory and rupture, from its own source.
- **TWISTED TREE:** the tree, mound, roots and a smaller wood rebuilt from its geometry code and printed in HEADLAND's inks.
- **SRUTHÁN:** one stream carved into the terrain, ending in a cascade over the cliff. Rain raises it and it drains over hours (SRUTHÁN's rain store). Its macro water, leaf and midges are not ported yet.
- A walked path joins the keeper's route to the clearing. Sea, stream and wind in the mix change with where you stand.

- **THE WRECK:** a heeled wooden coaster on a shingle cove east of the pier, modelled from Match's reference photos. Walk around it, enter by the breach on the landward side, climb the companion stair to the deck, go into the wheelhouse, and leave by the fallen gangway. The hold darkens and the sea goes muffled. The print dissolves into a scratched black-and-white pinhole negative as you approach, fully by about 19 m and whenever you are aboard.

- **THE FARM (BIT FIELD 045):** Bernard's farm, planted inland east of the wreck (key 6). Farmhouse, byre, hay barn, fold, three walled fields, five gates and the farmer's unfinished lace wall; twenty blackface ewes grazing the fields down; the farmer's day (the flock to fresh grass at first light and into the fold at dusk, laying stone, off down the lane, in at night); Bernard working the flock or lying down watching, asleep in the byre at night. It keeps its own memory inside INVERIN's (`S.farm`: grass, paths, the wall, Bernard's experience). Its walls and buildings are solid to a visitor; gateways let you through. Nine farm operators join the crew and are weighted up when there's a move on, when the farmer is at the wall, and when Bernard is asleep. Built in the farm's own frame and placed by one group (`FARM_O`), printed in INVERIN's inks with the farm's field ground, fleece, stone, iron and whitewash added to the shader. Source and world model: `MZTV/sources/bit-field-045-farm/` (branch `mz-world/farm-045`). The farm's four events, its flock-paced bar and Bernard-zone bass are not ported; INVERIN keeps its own.

## One sky for three cities
- **Relay sun.** Each of Baltimore, Galway and London has its own real sun. INVERLAND's sun is the highest of the three, handed from one city to the next over about an hour, so it is light while any of them has daylight and night only when all three are dark (about 9.5 hours in early November, against 15 in Galway alone). The info box shows which city is carrying the sun. The moon and the clock stay Galway's.
- **INVERLAND weather.** Live Open-Meteo readings from the three cities, averaged equally (wind direction as a speed-weighted vector mean). The sea state is the mean of three marine points: Galway Bay, the mouth of the Chesapeake and the Thames estuary. A point that doesn't answer drops out, and the info box names the ones that did. If none answer, the weather is simulated and says so. The original standalone pieces keep their own weather.

## Deliberate breaks of the MZ WORLD standard (v1.2)
- **Rule 1 (one real place, its own sun and weather):** INVERLAND is a territory made of several places, so its sun and weather are honest composites of three real cities, labelled as such, not one location's.
- **Rule 4 (no player):** the visitor walks as the keeper. She still keeps her own errands whenever nobody is walking.

## Print contract v2
The data target's green channel now carries `domain × 16 + material` as an exact byte, so worlds that carve their lines on the surface (SRUTHÁN, TWISTED TREE, FARM) can share the print with HEADLAND's screen-space lines. Everything is still domain 0, so the picture is unchanged.

## Next
HEN on the land, the farm's events, BREAKWATER on the shore, HAMBURGER CAVE hidden, then the Bryson district.

## Known limits
Tested in headless software rendering only, not on a real GPU or phone. Starts in daylight when it is night in Galway. Collision is circles and slope limits. The tree's birds, footbridges, leaves and its own events and sound are not ported.
