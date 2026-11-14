# MZ WORLD · MEMORIAL STADIUM · BIT FIELD 048 · Phase 01 (provisional)

Baltimore's Memorial Stadium on **27 December 1959**, NFL Championship, Giants at Colts (31–16, 57,545 in attendance). One fixed camera in the upper deck. Three prints of the same frame:

- **ink**: HARBOUR LIGHT v3 language: six inks, 4×4 Bayer, 320×180, pixel-sharp
- **neutral**: plain colour at 960×540, the baseline to judge the print against
- **evidence**: every surface coloured documented / approximation / creative; unfinished geometry hatched

**Status:** provisional, unpublished, on branch `mz-world/048-memorial-stadium-phase-01`, awaiting MZ.Human review (handoff: issue #22). Not linked from `MZTV/README.md`.

## Run

Serve the folder (ES modules need http), e.g. `python3 -m http.server` here, then open `index.html`.
Keys `1` `2` `3` switch prints, `c` cycles cameras, `w` toggles weather, `i` hides the info box.
Params: `?view=ink|neutral|evidence&cam=0|1|2&wx=drizzle|clear&t=12&seed=48&capture=1` (full list in `docs/ARCHITECTURE.md`).

## Files

| path | what |
|---|---|
| `index.html` | page, params, layout, info box, loop |
| `js/evidence.js` | sources and claims (single source of truth) |
| `js/geometry.js` | the stadium in metres, a claim id on every triangle, camera stations |
| `js/raster.js` | z-buffered rasterizer and sun shadow map |
| `js/shade.js` | lighting and the three printers |
| `docs/EVIDENCE-REGISTER.md` | sources, claims, discrepancies (generated) |
| `docs/GEOMETRY.md` · `plan.svg` · `section.svg` | dimensions, fits, assumptions, diagrams (generated) |
| `docs/ARCHITECTURE.md` | reuse audit and the route to a navigable world |
| `docs/TEST-REPORT.md` | QA results |
| `docs/BUILD-LOG.md` | question → evidence → approximation → build → comparison → revision |
| `docs/REVIEW-QUEUE.md` | decisions for MZ.Human |
| `docs/PUBLICATION-DRAFT.md` | draft captions and alt text (not approved) |
| `captures/` | review stills, contact sheet, `report.json` |
| `tests/` | `capture.py` (QA), `contact_sheet.py`, `plan.mjs`, `register.mjs` |

Regenerate: `node tests/register.mjs && node tests/plan.mjs && python3 -I tests/capture.py && python3 -I tests/contact_sheet.py`
