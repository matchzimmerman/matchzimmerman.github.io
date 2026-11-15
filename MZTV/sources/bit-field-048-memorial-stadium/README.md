# MZ WORLD · MEMORIAL STADIUM · BIT FIELD 048 · Phase 01 (provisional)

Baltimore's Memorial Stadium on **27 December 1959**, NFL Championship, Giants at Colts (31–16, 57,545 in attendance), held at one moment: **16:06, early in the 4th quarter, a second after Johnny Unitas's 4-yard touchdown run put the Colts ahead 14–9**. The sound holds the same second: a stretched crowd roar that breathes, second waves, the band's bass drum, drizzle and a far PA (all synthesised). Fixed cameras in the upper deck (cam0–2) and outside (cam3–6: 33rd Street, the Ellerslie corner, an overview, the north lawn by 36th Street), including the 116 ft memorial façade with its 1954 dedication. Three prints of the same frame:

- **ink**: HARBOUR LIGHT v3 language: six inks, 4×4 Bayer, 320×180, pixel-sharp
- **neutral**: plain colour at 960×540, the baseline to judge the print against
- **evidence**: every surface coloured documented / approximation / creative; unfinished geometry hatched

**Status:** provisional, unpublished, on branch `mz-world/048-memorial-stadium-phase-01`, awaiting MZ.Human review (handoff: issue #22). Not linked from `MZTV/README.md`.

## Run

Serve the folder (ES modules need http), e.g. `python3 -m http.server` here, then open `index.html`.
Keys `1` `2` `3` switch prints, `c` cycles cameras, `w` toggles weather, `i` hides the info box. Sound starts on the first click or key (at once in OBS); `?audio=0` silences it.
Params: `?view=ink|neutral|evidence&cam=0…6&wx=drizzle|clear&t=12&seed=48&capture=1` (cam3 = the memorial façade) (full list in `docs/ARCHITECTURE.md`).

## Files

| path | what |
|---|---|
| `index.html` | page, params, layout, info box, loop |
| `js/evidence.js` | sources and claims (single source of truth) |
| `js/geometry.js` | the stadium in metres, a claim id on every triangle, camera stations |
| `js/raster.js` | z-buffered rasterizer and sun shadow map |
| `js/shade.js` | lighting and the three printers |
| `js/sound.js` | THE HELD SECOND: hardened generative sound (crowd, second waves, band drum, bowl, drizzle, PA) |
| `docs/EVIDENCE-REGISTER.md` | sources, claims, discrepancies (generated); the façade and shell now rest on the HABS MD-1111 survey |
| `docs/GEOMETRY.md` · `plan.svg` · `section.svg` | dimensions, fits, assumptions, diagrams (generated) |
| `docs/ARCHITECTURE.md` | reuse audit and the route to a navigable world |
| `docs/TEST-REPORT.md` | QA results |
| `docs/BUILD-LOG.md` | question → evidence → approximation → build → comparison → revision |
| `docs/REVIEW-QUEUE.md` | decisions for MZ.Human |
| `docs/PUBLICATION-DRAFT.md` | draft captions and alt text (not approved) |
| `captures/` | review stills, `contact-sheet.png` (stands), `contact-sheet-exterior.png`, `report.json` |
| `tests/` | `capture.py` (QA), `audio_test.py` (records and analyses the sound, forces failures), `contact_sheet.py`, `plan.mjs`, `register.mjs` |

Regenerate: `node tests/register.mjs && node tests/plan.mjs && python3 -I tests/capture.py && python3 -I tests/contact_sheet.py captures interior && python3 -I tests/contact_sheet.py captures exterior`
