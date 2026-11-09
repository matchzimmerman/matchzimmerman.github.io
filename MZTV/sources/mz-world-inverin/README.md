# MZTV · MZ WORLD · INVERIN (working title)

The shared, walkable MZ WORLD. HEADLAND is the ground, with TWISTED TREE planted inland and SRUTHÁN running from the wood down to the sea, all in one scene, one sky, one print and one sound system. The original pieces are untouched.

**Keys:** WASD walk · click to look · Shift run · C kneel · V hand back to the crew · 1–6 house, pier, tree, stream, wreck, farm · I info · M mute · R rupture
**Touch:** left side moves, right side looks
**Params:** HEADLAND's, plus `?walk=0` for the crew-only version

## What is in here
- **HEADLAND:** coast, house, pier, keeper, boat, seal, gulls, events, memory and rupture, from its own source.
- **TWISTED TREE:** the tree, mound, roots and a smaller wood rebuilt from its geometry code and printed in HEADLAND's inks.
- **SRUTHÁN:** one stream carved into the terrain, ending in a cascade over the cliff. Rain raises it and it drains over hours (SRUTHÁN's rain store). Its macro water, leaf and midges are not ported yet.
- A walked path joins the keeper's route to the clearing. Sea, stream and wind in the mix change with where you stand.

- **THE WRECK:** a heeled wooden coaster on a shingle cove east of the pier, modelled from Match's reference photos. Walk around it, enter by the breach on the landward side, climb the companion stair to the deck, go into the wheelhouse, and leave by the fallen gangway. The hold darkens and the sea goes muffled. The print dissolves into a scratched black-and-white pinhole negative as you approach, fully by about 19 m and whenever you are aboard.

- **THE FARM (BIT FIELD 045):** Bernard's farm, planted inland east of the wreck (key 6). Farmhouse, byre, hay barn, fold, three walled fields, five gates and the farmer's unfinished lace wall; twenty blackface ewes grazing the fields down; the farmer's day (the flock to fresh grass at first light and into the fold at dusk, laying stone, off down the lane, in at night); Bernard working the flock or lying down watching, asleep in the byre at night. It keeps its own memory inside INVERIN's (`S.farm`: grass, paths, the wall, Bernard's experience). Its walls and buildings are solid to a visitor; gateways let you through. Nine farm operators join the crew and are weighted up when there's a move on, when the farmer is at the wall, and when Bernard is asleep. Built in the farm's own frame and placed by one group (`FARM_O`), printed in INVERIN's inks with the farm's field ground, fleece, stone, iron and whitewash added to the shader. Source and world model: `MZTV/sources/bit-field-045-farm/` (branch `mz-world/farm-045`). The farm's four events, its flock-paced bar and Bernard-zone bass are not ported; INVERIN keeps its own.

## Next
HEN on the land, the farm's events, BREAKWATER on the shore, HAMBURGER CAVE hidden, then the Bryson district.

## Known limits
Tested in headless software rendering only, not on a real GPU or phone. Starts in daylight when it is night in Galway. Collision is circles and slope limits. The tree's birds, footbridges, leaves and its own events and sound are not ported.
