# Foxleigh AR Field Study 002 — MZ WORLDS
**Research tool — not an MZTV WORLD or HEADLAND renderer.**

## Live
- https://www.matchzimmerman.com/MCDONOGH/foxleigh/ar/
- Main geolocation experiment: https://www.matchzimmerman.com/MCDONOGH/foxleigh/
- Map alignment: https://www.matchzimmerman.com/MCDONOGH/foxleigh/align/

## Purpose
A practical iPhone test of visually tracked, user-placed AR using Apple AR Quick Look without downloading a USDZ attachment through ChatGPT. The page renders the existing speculative `../align/foxleigh_massing.glb` with Google model-viewer v4.3.1. On supported iOS browsers the AR button creates a USDZ client-side and launches Quick Look. It does not need an `ios-src` binary asset. This is **not GPS-anchored**.

## Sources and confidence
- McDonogh 150-story sources document original Foxleigh Mansion c.1850–1914 and its former position near modern Rollins/Jane Bay.
- The model's dimensions (25 × 16 × 12 m), geometry, windows and roof are **invented placeholders**. Do not treat them as measured historic architecture.
- The online 1873 floor plan was retrospectively reconstructed by alumni and is not a surveyed historic site plan.
- The 2024 Foxleigh monument site is school-documented; no exact footprint, center coordinate, floor elevation, or rotation validated.

## User test
1. Open the AR page directly in iPhone Safari.
2. Confirm the 3D model loads and orbit controls work.
3. Tap PLACE IN AR ON iPHONE. If Quick Look starts in Object, choose AR.
4. Outdoors at the expected site, scan a textured, level ground area.
5. Place, scale and orient manually. Monitor motion tracking and model stability.
6. Report if AR button is absent or Quick Look fails to open. Include iOS version and Safari vs in-app browser.

## Known limits / experiments
- iOS AR Quick Look conversion of the speculative GLB is not yet verified on a physical iPhone.
- Some in-app browsers fail to transition to Quick Look; use Safari as fallback.
- Quick Look allows local manual placement, but it does **not** automatically bring the hypothetical GPS location into native AR.
- A mansion-sized model may auto-resize for placement. Verify scale manually.
- The old compass/GPS overlay is only a 2D video + Three.js sensor projection, not ARKit world tracking. Its earlier distance display of 271 m was consistent with a remote reference position; never interpret a projection over the camera as a physically anchored object.
- The old overlay now hides distant geometry when >120 m away and negates compass heading to match its ENU axis convention.
- Apple ARKit geo-anchoring or visual marker localization requires a different architecture; coordinates alone in USDZ or GLB do not create a persistent location anchor.
- This is a utilitarian archival study, *not a broadcast MZ WORLD*. It intentionally doesn't use the HEADLAND ink, inhabitants, sound, weather, memory or rupture systems. No MZTV broadcast source was changed.
- This test hasn't yet been validated on iPhone hardware.

## Technical
- No live analytics or tracking. model-viewer and rendering libraries are loaded via third-party CDN.
- Existing map alignment remains in localStorage on the same browser; this AR test does not load or overwrite it.
- Scene geometry and app state contain no private archival photographs; public GitHub Pages pilot only.
