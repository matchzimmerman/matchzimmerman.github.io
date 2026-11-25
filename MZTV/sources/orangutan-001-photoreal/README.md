# ORANGUTAN 001 · PHOTOREAL fork

Same animal as the 48PLANT fork, with no limit on the graphics: aiming at photorealism, in the browser, streamable in OBS.
HARIL STUDIO [#64](https://github.com/matchzimmerman/haril-studio/issues/64) (sub of #62; research #63 and the MZ.GPT addendum on #64).

**Open:** `studio.html` (same controls as the 48PLANT studio, plus `[ ]` aperture and `- =` focal length; `P` now toggles depth of field).

## MZ.Human's decisions (2026-11-22)
| | |
|---|---|
| Asset rule | the **animal is source-built** (no premade models, rigs, clips, templates); **lighting may be prebuilt** |
| Runtime | **browser, realtime** |
| Stage / crew | **keep** the white cyclorama and the MZCAM crew |
| Frame-rate floor | **24 fps** |

## Files
| file | what it is |
|---|---|
| `brain.js` | the life engine split out of the 48PLANT `creature.js` (G1.3, `8f08852`). Identical to the original at P1. **P1.1 change (MZ.Human 2026-11-23):** sitting down is now a drop. The rump falls on a cubic from rest, so it falls ever faster, lands at about 0.6 m/s and is caught by a stiff, critically damped spring (about 2 mm of soft-tissue give). Before, the pelvis height went through a slow spring, which made the descent read as linear. Visuals removed; the joint hierarchy stays as the skeleton. Exposes `skeleton`, `signals` (breath, blink, eye pitch, wind) and `bindPose()`. |
| `body.js` | everything you see (P1, below). Follows the brain's joints, never writes to them. |
| `studio.html` | the 48PLANT studio with the print pass replaced by a photographic pipeline. Generated: `python3 tools/make_studio.py ../orangutan-001/studio.html studio.html` |
| `tools/life-test.mjs` | the brain guard (unchanged checks): `npm i three@0.170.0`, then `node MZTV/sources/orangutan-001-photoreal/tools/life-test.mjs 300 1,2,3,4,5,6,7,8,9,10` |

## Body P1: what's built
- **Skin:** one continuous surface per region (torso and limbs, head, each hand and foot). Each is sculpted as a signed-distance field from the anatomy on the brain's #63 limb lengths, and meshed with naive surface nets at 5 mm on the torso and 1.9–2.3 mm on the face, hands and feet. Normals come from the field's gradient. Skin weights come from the same field: each joint owns the shapes it carries, so the joints fold without segment seams. The regions overlap under the coat at the neck, wrists and ankles. About 0.4 M triangles, built in about 3 s at load.
- **Skin shading:** physically based, with a scattering wrap that reddens past the terminator, procedural pores and creases (palms, soles, lids, face) and per-region colour and roughness. Under a dense coat the skin takes on the root colour.
- **Face:** eye sockets, deep-set eyes, light upper lids, a dark eye ring, prognathic muzzle, lips, a flat nose with small nostrils and small ears, all in the field. The eyeballs have a code-painted iris and a wet clear coat. The lids blink and follow the eyes' pitch.
- **Coat:** 120 k GPU strands, each skinned with its root. They're combed by region, bent by gravity, wind and the body's own motion (per-bone follow-through), and clumped toward their tips. Shading is a two-lobe Kajiya-Kay model with backlit transmission. The coat casts and receives the key light's shadow, and is shuffled so a quality cut thins it evenly.
- **Studio:** AgX tone mapping and a prebuilt image-based light (three's generated RoomEnvironment; `?hdri=<url>` swaps in a licensed HDRI for light and reflections only). It also has a 4096² key-light shadow that follows the animal, GTAO, thin-lens depth of field (focal length in mm, f-stop, and focus on the orbit target or the crew's aim), grain and a light vignette. The cyclorama and MZCAM are kept; the crew's monitors are straight renders with no post.
- **24 fps governor:** if the rolling frame rate drops under 27, the coat thins (down to 25 %), then the pixel ratio. When there's headroom it comes back. Off with `?auto=0`; the log is in `MZ.perf().governor`.

## P1.2: city skin, Baltimore (MZ.Human 2026-11-24)
**What it is:** the skin is the map of Baltimore. The buildings of two MZ GROUND SURVEY fields grow out of the body, each where it stands on the map, at true relative height. The coat grows only from the streets, and the face, head, hands and feet are unchanged. `?city=0` gives the plain animal.

**Data (`city.json`, built by `tools/build_city_skin.py`):**
- **Harborplace field** (haril-studio `claude/mzgs-harborplace-now-future` @ `80d8d60`): today's buildings (City outlines with 2024 USGS lidar tiers), the **new Harborplace** (2024 design on the Jan 2026 permit footprints, proposed; the 4 City buildings on those sites are dropped), streets, and harbour water WT-1.
- **Jones Falls field** (`claude/mzgs-jones-falls-field` @ `9d25779`): today's buildings and streets north of the Harborplace frame.
- In total: 954 buildings and 1,242 streets.

**The pattern** (`city.js`, one scale 1:1500, so 1 m of city is 0.67 mm of skin and a 161 m tower stands 10.7 cm):
| piece | map window |
|---|---|
| trunk, small of the back to shoulders | the Pratt St shore and the new Harborplace, up through downtown (centred E 361230; unrolled around the trunk, seam down the belly, read from behind with north up and east right) |
| arms, shoulder to wrist | the Jones Falls valley, north to south (left arm the west half, right arm the east half) |
| thighs, hip to knee | either side of the harbour (west: Camden Yards / Ridgely's Delight; east: Harbor East) |
| rump, head, face, hands, feet | no city: the ordinary coat and skin |

- **Buildings:** each is ray-marched onto the skin's own distance field, stands along the skin normal at its centroid and rides its nearest joints rigidly. Facades show floors and window bays drawn in real metres. About 500 buildings land on the body per build; the rest fall outside the pattern pieces or off curved edges.
- **Coat:** grows from the streets only, as short fur (1.5–4.5 cm) so the city stands clear. Open land and plazas are bare skin, and the harbour is wet skin.
- **Provenance:** Ground Survey data was private research. This build puts the derived city file on this repo's branch (public sources only: City GIS outlines, USGS lidar, the public permit plan).

## What's evidence and what's art (#64 addendum)
- **Measured:** none of the coat, skin or eye numbers are measurements of an adult female *P. pygmaeus*. None exist for this animal yet.
- **Evidence-shaped:**
  - coat length varies widely by region (Hartmann 1886: 2–23.5 cm; Carlitz 2014: > 40 cm in some captive *Pongo*)
  - forearm hair runs toward the elbow, and crown hair lies flat from a parting at the brow
  - chest and belly hair is sparse; face, ears and hand backs are short-haired or bare
  - the sclera is brownish and lighter than the iris, with a darker ring and a fine grey edge (Caspar 2021)
  - periocular and perioral skin is dark, with lighter lids kept (Kuze 2005)
  - palms and soles are bare and creased; there are no ischial callosities
- **Artistic:** every other number. Colours were judged by eye against Batang (Smithsonian NZP, CC0, used as a link and reference only, never imported). Bonnie is a hybrid and is no longer used.

## URL parameters
`seed` · `t` (fast-forward seconds) · `hair` (strand count, default 120000) · `skin` (skin resolution multiplier) · `pr` (pixel ratio) · `ao=0` · `dof=0` · `f` (f-stop, default 2.8) · `exposure` · `env` (environment intensity) · `hdri` · `grain` · `msaa` · `auto=0` · `crew=1` · `bay=0` · `wind=0` · `capture=1` · `subject=test`

## Open (P2 and on)
- Real-GPU frame timing on MZ.Human's streaming machine. P1 was checked only on a software renderer, which can't measure GPU fps.
- Coat: collisions against other body parts (it only keeps off its own skin), a few long locks with more irregular kinks, and wet/dry variation.
- Face: lip and mouth shape (a little "slot"-like up close), lid thickness, a tear line, and expression.
- Skin: a measured scattering profile if one exists. The wrap is an approximation.
- Region seams at the neck, wrists and ankles are hidden by the coat, not removed.
- Gait timing is still unmeasured (#63); the walk is unchanged from the 48PLANT fork.
