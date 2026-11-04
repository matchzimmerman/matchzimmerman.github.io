# Foxleigh AR — iPhone app (geo-anchored)
MZ WORLDS / McDonogh · Reconstruction 002 · MZ.Claude for MZ.Human · 2026-11-04

This app places Reconstruction 002 on its site using Google's **ARCore Geospatial API**:
- **Localising.** The phone matches its camera against Google's Street View / Earth data (VPS).
- **Anchoring.** The house sits on a **terrain anchor** at the mansion's latitude/longitude, facing 165°.
- **Result.** It stays fixed to the ground as you walk around it. This is the hard anchor the web page can't do.

Built from Google's official GeospatialExample (Apache 2.0) with the ARCore iOS SDK 1.57 via Swift Package Manager.
**Untested build:** written without a Mac, so the first compile may need small fixes. Send MZ.Claude any Xcode errors.

## One-time setup (≈ 15 min)
1. **Google key.** Google Cloud project → enable **ARCore API** → create an API key → restrict it to iOS bundle
   `com.matchzimmerman.foxleigh` and the ARCore API.
2. **Get the project onto your Mac.** `git clone https://github.com/matchzimmerman/matchzimmerman.github.io`
   (or download `FoxleighAR.zip`) and open `MCDONOGH/foxleigh/reconstruction/ios/FoxleighAR/FoxleighAR.xcodeproj`.
3. **Wait for the ARCore package.** Xcode fetches it automatically (`google-ar/arcore-ios-sdk`, product
   `ARCoreGeospatial`). It is ~150 MB, so give it a few minutes.
4. **Signing.** Select the FoxleighAR target → Signing & Capabilities → Team: your Apple ID (a free "Personal Team"
   works). If Xcode says the bundle ID is taken, change it, and update the key restriction to match.
5. **Run on the phone.** Plug in the iPhone, choose it as the run destination, press ▶.
   - First time only: on the iPhone, Settings → General → VPN & Device Management → trust your developer certificate.
   - With a free account the app expires after 7 days; just run it from Xcode again.
6. **First launch.** In the app: accept Google's camera notice → paste the API key → allow Camera and
   **Precise** Location.

## Using it
- **Check coverage.** The header shows **VPS at Foxleigh** immediately, wherever you are. AVAILABLE means
  sub-metre anchoring should work on site. "Not available" means the app falls back to GPS + compass (±5–10 m).
- **Localise.** On site, point the camera at buildings (Rollins Hall, the dorms, Keelty) until the accuracy line
  reads under ±3 m and ±5°. The house then places itself.
- **Fallbacks.** If accuracy stalls, tap **Place anyway**.
- **Fine-tune.** Moves the house in 0.5 m / 0.5° / 0.1 m steps. Steps are relative to the ground (east/north), not
  your view, and are saved on the phone. **If you correct it on site, send MZ.Claude the four numbers** so
  `placement.json` (and the web page) can be updated.

## How placement works
- **Site values** are in `FoxleighAR/FoxleighSite.swift` (copied from `../placement.json`):
  - origin 39.3955909, −76.7762687 (centre of the brick house at grade);
  - porch faces 165°.
- **Anchor.** One terrain anchor at the origin with East-Up-South axes.
- **Model on the anchor.** The model is turned 15° about vertical so its long axis runs 75°, plus your fine-tune
  offsets.
- **Height.** Google's terrain model supplies the ground height, so the house sits on the grass, not at the lidar
  elevation.
- **Model file.** `Foxleigh.usdz` (8.9 MB) is the same model as `../foxleigh_reconstruction_002.glb`, converted for
  RealityKit (metres, Y-up, same origin).
