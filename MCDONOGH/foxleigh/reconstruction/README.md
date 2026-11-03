# Foxleigh Mansion — Reconstruction 002
MZ WORLDS / McDonogh historical reconstruction · MZ.Claude for MZ.Human · 2026-11-03

**Live viewer:** https://www.matchzimmerman.com/MCDONOGH/foxleigh/reconstruction/
**Model file:** `foxleigh_reconstruction_002.glb` (5.5 MB, metres, Y-up, 49k triangles, 93 meshes)
**Builds on:** MZ.GPT's [Fidelity Study 001](../fidelity/), [image index](../images/), [alignment lab](../align/), [AR study](../ar/)

A plan-scaled, photo-proportioned 3D model of the Foxleigh "Old House" as it stood c.1873–1914: the c.1850 brick
mansion, the c.1860s frame addition, the 1873 Trustees' Extension and the rear service range. It is the realism pass
that comes before geolocated AR. It is **not** a survey and it is **not yet placed on the ground**.

## What changed from Study 001
Study 001 was a hip-roofed box with invented dimensions. The two school photographs show a different building:

- **Gothic Revival brick villa.** Steep (~57°) side-gabled slate roof; projecting centre bay rising into a wall gable;
  a second wall-dormer gable at the west end; a steep roof dormer east of centre. Cusped, pierced bargeboards and
  finials on every gable; five tall chimney stacks.
- **Elements read off the photographs.** Painted brick; 2-over-2 sashes with louvred shutters; a canted bay window
  with a flat cornice roof; a front veranda with chamfered posts and an arched valance; an iron escape ladder between
  the 2nd and 3rd storeys.
- **Long clapboard range.** Two storeys with eaves visibly lower than the brick plate, a front cross-gable with a
  round-headed attic window, a side porch with turned posts and railing, and the seven-bay Trustees' front.
- **Rear service range from the plan.** Washroom, bakery, stone annex (kitchen and laundry), and the frame coal and
  wood shed.

## Method
1. **Footprint.** Digitised from the alumni-reconstructed *Foxleigh Mansion or "Old House" in 1873* first-floor plan
   (150 Stories #38).
   - The plan has no scale bar. It is scaled from its own two stairs (≈ 250 mm treads), which gives **0.093 m per pixel**
     of the 640 px web copy.
   - At that scale the brick block is 15.7 × 9.8 m (≈ 51 × 32 ft) and the whole range 47 m. Every footprint coordinate
     in `foxleigh-model.js` cites its plan pixel.
2. **Elevations.** Storey heights, roof pitches, openings and trim are proportioned from the photographs.
3. **Camera solve.** The photo-1 camera was solved from 19 landmark correspondences (least squares over position,
   orientation and focal length).
   - Result: **7.5 px RMS on a 1584 px image**.
   - Solved camera: ~55 m out, ~4 m below porch level, 30° vertical FOV. This confirms the plan scale and the
     brick-house storey heights.
   - The residuals drove two corrections: the frame range's 2nd-floor windows were lowered by 0.5 m, and its
     cross-gable was steepened to 50°.
4. **Photo 2.** The winter view from the 1883 Main Building tower only reaches an approximate fit (18 px RMS), so it
   is used to check composition, not to measure.
5. **Materials.** All textures are generated procedurally in the browser. No archival imagery is embedded in the model
   or stored in this repo; the viewer hot-links the two photographs from McDonogh's site only for the overlay.

## Evidence and confidence
Each mesh is tagged (`userData.confidence`, also written to glTF `extras`). The viewer's *Colour by source* mode
shows this.

| Tag | Meaning | Examples |
|---|---|---|
| documented | Stated in McDonogh's written history | 3 storeys + attic + basement in brick; frame addition east; Trustees' Extension 1873 with dining hall below; service rooms; fire of 30 July 1914 |
| photo | Seen in one of the two photographs | roof form, gables, dormers, bargeboards, chimney stacks, bay window, veranda, ladder, frame cross-gable, Trustees' bays, side porch |
| plan | Placed from the alumni plan | footprints, rear octagonal room and NE bay, service range, fireplaces / chimney positions, door and window positions not visible in photos |
| inferred | Period practice or symmetry | rear dormers, colours, slate vs. shingle, interior heights of unseen parts |

## Where the sources disagree
- **The canted bay window.** The plan draws it on the west side wall. Both photographs show it on the **front** of
  the west room, with the veranda starting east of it. The model follows the photographs, and the veranda therefore
  covers the centre and east of the front rather than the full width shown in the plan.
- **The plan's west-end steps** are dropped. With the bay on the front they would collide with it.

## Open questions (for Wilson | Young Archives)
1. **Rear and east elevations.** Are there any photographs of the rear or east side? The octagonal NW room, the NE bay
   and the whole service range are plan-only.
2. **Higher-resolution scans of both photographs.** These would allow a full photogrammetric solve, especially of
   photo 2 and the roof pitch.
3. **Wall finish.** Was the brick painted, whitewashed or stuccoed? What colour were the shutters and the roofs?
4. **The 1873 plan's sources.** Did the plan rest on any measured drawings or insurance surveys (e.g. Sanborn), or on
   memory and these photographs?
5. **Basement.** Footprint and depth of the documented full basement; this matters for any ground-truth search with
   the lidar.

## Next pass: geolocated AR
- **Placement.** Set position and heading on the 2024 USGS 0.5 m lidar used by the
  [Ground Survey](../../ground-survey/). The memorial is documented as standing between Finney Quad and the dorms.
  Ground Survey candidate **C03** (a 17 × 30 m sunken rectangle about 36 m NW of Study 001's provisional centre) is
  worth checking against this footprint.
- **Delivery.**
  - iPhone: AR Quick Look with a USDZ export.
  - Android: WebXR with geospatial anchoring, or a marker/ground-plane workflow.
  - Both need the model's origin (centre of the brick block at grade, +x along the long axis) tied to a surveyed
    coordinate and bearing.

## Files
- `foxleigh-model.js` — the procedural builder; every dimension and its source
- `textures.js` — procedural PBR surfaces (painted brick, clapboard, slate, shingle, rubble, chimney brick, boards, louvres)
- `index.html` — viewer: orbit, phase toggles, evidence colouring, photo overlays with solved cameras, sun, GLB export
- `foxleigh_reconstruction_002.glb` — exported model for AR / other tools

Sources: [150 Stories #38](https://150.mcdonogh.org/not-forgotten/foxleigh-estate-becomes-mcdonogh-school/) ·
[Foxleigh Mansion memorialized (2024)](https://www.mcdonogh.org/about/news-photos/news/photo-essays/2024/foxleigh-mansion-memorialized)
