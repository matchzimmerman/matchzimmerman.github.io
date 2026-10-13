# WARREN / LOCH RAVEN — Historical GIS v0.3

**Status: research prototype. Not yet a georeferenced village.** Prepared 12 October 2026 under the HARIL STUDIO Warren project charter.

## Launch on your computer

1. Use the [GitHub Pages viewer](https://www.matchzimmerman.com/WARREN/) or download the repository. **Keep `index.html` and its `data/` directory together.**
2. Open `index.html` in Chrome or Firefox. The 1915 atlas scan, Leaflet map engine and GIS imagery are served from external sites and therefore require internet access. We do **not** request OpenStreetMap public tiles.
3. If local-browser security prevents a resource from loading, open a terminal inside the unpacked directory and run `python3 -m http.server 8000`, then browse to `http://localhost:8000`.
4. If the atlas image fails, save a copy of [the MSA 1915 Bromley scan](https://msa.maryland.gov/megafile/msa/speccol/sc5300/sc5339/000062/000000/000066/unrestricted/warren_1915_bromley.jpg) and use the image picker above the right-hand panel. The selected bitmap is not uploaded anywhere; the viewer holds it only in that tab.
5. Switch basemaps to **Offline coordinate grid** if a GIS image server is unavailable. The fallback grid uses locally rendered WGS84 lines but Leaflet's JavaScript is still loaded from a CDN. If the map libraries cannot be loaded at all, map pairing is unavailable until they can load.

## First hands-on experiment

The goal is to test geographic correspondence, **not** pick three random points and declare the old town found.

1. In the right-hand panel, magnify the atlas and click a feature recognizable in a primary 1915/1918 source and a *geographically continuous* modern feature: durable road junction, documented crossing, fixed survey mark. Reservoir shoreline and modern bridge are not automatically stable across 1915–2026.
2. In the left-hand modern map, click the **same** place (or enter exact lat/lon from an independently referenced survey). Complete landmark description, evidence citation, role, and quality before saving. Source and location are paired in a local session.
3. **Corroborated / registration fit** controls count in the mathematical fit. Tentative hypotheses do not. At least 3 non-collinear corroborated controls with citations are needed to construct an initial affine transform.
4. Reserve at least one **corroborated / independent check** (holdout) that was **not** used in the fit. Its residual measures out-of-sample error. Prefer multiple well-distributed check points. Current provisional investigation threshold is 25 metres; this is NOT a statement that 25m accuracy is adequate for individual buildings.
5. The map may show a **predicted 1915 raster overlay**, as well as approximate traced routes/cluster regions, when a numerical fit exists. **Neither is proof** of exact old building locations. If data are thin or contradictory, leave the map unregistered.
6. Save the session to a JSON file and export the control-point CSV. Imported sessions may be used to resume work. Browsers with localStorage enabled also autosave GCP sessions on the current origin; don't rely on autosave as the only provenance copy.
7. Registered GeoJSON is exportable only when a mathematical affine model exists. It includes explicit uncertainty/status warnings and never relabels cluster selections as surveyed structures.

## Current evidence boundaries

- Source annotations: 89 features total in recovered 2026 extraction: 5 **broad cluster-selection regions**, 3 rough road alignments, 1 rough river trace, 1 village label, 1 candidate control and 78 unvetted detected dark symbols. No source annotation here is a georeferenced individual house.
- Source atlas extraction remains exactly its original 1125×704 image pixel space; **do not open it in QGIS as WGS84 geographic data**. The `1915_bromley_pixel_annotations.geojson` is not geographic and includes its own warning.
- One approximate present-day Warren Road Bridge coordinate is used as the **map start center and tangent-plane reference only**. It does **not** assert the 1915 original bridge location.
- 1918 Water Department property/flow-line map A has been visually inspected at coarse sheet scale and shows Warren in a larger property network. Its exact locations are not automatically matched to the 1915 atlas.
- The larger 28-sheet 1915 Loch Raven survey set is a promising independent source but requires focused page inspection; no false landmark citations were seeded.
- `Orthos1938` is **post-inundation imagery**. Modern LiDAR is above-water terrain. Bathymetry is newer surveyed reservoir bottom, not automatically the original valley floor.
- The project's first real deliverable is a traceable *map coordinate reconstruction with measured independent residuals*, not a 3-D town blockout.

## Method and limitations

Current browser prototype fits a **first-order 2-D affine transformation** from image X/Y pixels into a **local equirectangular metric tangent approximation** centered at ~39.4886N, -76.6094W. That is reasonably localized for this research instrument, but is not a rigorous survey-grade datum conversion. It converts into WGS84 lon/lat for Leaflet overlays; different 1915 projection, skew, stretching, and local original-map distortion may not be captured by one affine transform. The overlay's displayed transform is computed in Leaflet layer pixels and should be used as a spatial **preview**, not resampled raster GIS ground truth.

For actual GIS release, fit in a proper projected coordinate reference system (e.g., Maryland StatePlane EPSG:26985 after reviewing the source datum), record GCPs and holdout distribution, analyze residual spatial patterns, rectify raster with GDAL/QGIS, and have MZ.Codex independently audit transformations. No historical position is automatically accepted on the strength of three fitted points.

### Files

- `index.html` — actual map and registration workbench, CSS/JS. Internet for libraries and archived scan.
- `data/historical_features.js` — loaded pixel-space features (embedded as JS so `file://` is supported without `fetch`).
- `data/1915_bromley_pixel_annotations.geojson` — unaltered source annotations, not WGS84.
- `data/source_register.csv` — vetted/candidate sources with URLs, dates and research notes.
- `data/modern_bridge_reference.geojson` — approximate modern bridge reference.
- `rectify_from_gcps.py` — inherited GIS reprojection *example* requiring numpy/pyproj and a different original CSV schema; do not assume direct compatibility with v0.3 session CSV. Use it for method reference only until upgraded.
- `tests/test_affine.mjs` — synthetic numerical tests that extract and exercise the browser's actual affine functions.

## Verification performed

- JS syntax compiled via Node.js v22.
- `node tests/test_affine.mjs` passes 2-D affine recovery, independent accurate holdout, intentionally wrong holdout, collinearity, and fewer-than-three controls.
- Source pixel-feature count and kinds verified against recovered JSON.
- Actual web browser GIS service rendering and interaction **not independently confirmed here** because external network rendering is unavailable in this environment. Initial browser testing on the user's Mac remains necessary.

## Archive references

- [MSA 1915 Bromley Warren detail](https://msa.maryland.gov/megafile/msa/speccol/sc5300/sc5339/000062/000000/000066/unrestricted/warren_1915_bromley.jpg)
- [1918 City of Baltimore Water Department flood line, road and property map A](https://msa.maryland.gov/megafile/msa/brg/brg1/brg12/000000/000021/000000/000001/pdf/mdsa_brg12_21_1-0001.pdf)
- [1915 Property Sheets archive](https://msa.maryland.gov/megafile/msa/brg/brg1/brg47/000000/000043/000000/000020/000000/000009/pdf/mdsa_brg47_43_20_9.pdf)
- [Warren-specific archive drawing collection](https://speccol.msa.maryland.gov/pages/speccol/series.aspx?series=4&speccol=5869)

Follow archive reproduction terms; no third-party archival scans are rehosted in the ZIP.