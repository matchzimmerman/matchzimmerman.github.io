# HEADLAND — Developer Mode / 3D Builder Study 001

Entry: https://matchzimmerman.com/MZTV/sources/bit-field-031-headland/walk/dev/

## What this is

A separate *human-directed* editor for the existing MZTV HEADLAND landscape. It imports the original procedural terrain, coastline, weather, characters and six-ink renderer via an isolated `srcdoc` world. The original HEADLAND broadcast source is **never modified**. It uses the current SEALS world locations as a starting point, with stable, individually addressable geometry groups.

The browser hosts three related modes:

- **Keeper / WALK** (`../`): third-person embodiment as the black-veiled keeper.
- **Developer / FLY**: WASD camera translation, mouse look (not inverted), Space ascend, C descend, Shift speed boost, mouse wheel speed, P screenshot.
- **3D Builder**: selection by actual 3D mesh raycast, list of asset IDs, ground-plane drag, X/Z numeric inputs, Y rotation in degrees, nudge buttons, undo/redo, and reset.

The original autonomous MZTV stream uses none of these editor overrides.

## Architecture / current asset boundaries

`../editable-scenes.js` is the builder-safe companion to the original `../seals-scenes.js`. It mirrors the original geometry but batches the meshes **within each movable group** instead of batching every scene prop into one large material mesh. Geometry is stored in local group coordinates with the original world-space position restored by the group pivot. A coordinate change therefore moves actual shapes and maintains the original materials.

Initial groups include:

- 9 independently movable stretches of dry-stone wall (`wall-01` through `wall-09`)
- `apple`, `bicycle`, `gate`, `barn`
- 6 independent haystacks (`hay-01` through `hay-06`)
- `turf` (the bog turf stack ensemble)
- `gravesite` (the entire three-sided stone enclosure and all headstones)

Total: **21 movable groups**. The original gravesite's first-pass anchor is X -136 / Z -124 on the western promontory. The input's world coordinate system is identical to the engine: X/Z horizontal world coordinates, Y up. The new group Y position is adjusted by the local heightfield difference when relocated. This is useful for site-layout studies but **not full terrain conforming** for long relocated wall runs. Refining individual stones or conforming long walls to new slopes remains future work.

Only the above SEALS geometries are builder-editable in Study 001. HEADLAND's generated ground, coastline, pier, original cottage, autonomous keeper, camera crew, sea stacks, boat, gulls and weather are not yet editable as independent assets.

## Saving, sharing and publishing

The editor is a public **static GitHub Pages application**; it does *not* expose a GitHub token or directly commit to the repository. This is an intentional trust boundary.

There are three layers of layout state in priority order:

1. **Share-link override:** `?layout=...` URL contains compact versioned ID / X / Z / radians data for review in another browser.
2. **Private browser draft:** `localStorage["mz-headland-builder-v1"]` stores current ID / X / Z / radians. Reload or return to WALK on the same browser to see the positions.
3. **Approved shared layout:** `../layouts/published.json` (the source-controlled JSON). The public Keeper world and developer page read it if there is no private draft or share URL. MZ agents can update this file **after human review** to publish a common landscape.

Use **DOWNLOAD REVIEW ZIP** for a practical handoff. It includes:
- `HEADLAND_LAYOUT.json` with the current full asset list, camera image references and comments
- A `photos/` folder of original WebGL-framebuffer PNGs captured by the developer camera
- A brief readme describing the world coordinate frame and publication boundary

Export/import the layout JSON separately, or copy a share URL for quick layout comparison. No screenshots are uploaded to any remote server by the page; they remain in the browser session until you download them.

An MZ agent should:
1. Open the attached review ZIP, inspect all photo references / comments / IDs, and validate the JSON.
2. Reconcile any uncertain placements or conflicts with an existing published layout.
3. Commit a revised `../layouts/published.json` using the `mz.headland.layout.v1` schema.
4. Review both `../` (Keeper) and `./` (Developer) in the browser; verify the original broadcast is unchanged.

## Format example

```json
{
  "schema": "mz.headland.layout.v1",
  "revision": 1,
  "publishedAt": "2026-10-23T00:00:00Z",
  "approvedBy": "MZ.Human",
  "assets": [
    {"id": "gravesite", "x": -136, "z": -124, "r": 0},
    {"id": "hay-01", "x": -54, "z": 41, "r": 0}
  ]
}
```

Rotations (`r`) are **radians about world Y**. The inspector accepts degrees and converts them to radians on export. Both the public WALK and the developer build apply ID-keyed overrides; omitted assets remain in their source locations. All inputs are checked for finite numbers and IDs; X range -400…400, Z range -450…450, rotation -2π…2π. JSON imported into the Developer Mode can be reviewed before the approved manifest is committed.

## Camera/reference limitations

Photos capture the original WebGL renderer's pixels, not the HTML control overlay. Captures include camera coordinates, yaw, pitch and note metadata in the companion JSON. Local screenshots are currently session-only until exported, so download the ZIP before refreshing to preserve them.

The editor's scene is a separate seeded simulation, not frame-synchronized with a live Twitch/MZTV broadcast. Builder drags intersect an approximate horizontal ground plane at the *selected object's* height; terrain follow is updated for each placement. Complex terrain reshaping, geometric deformation, free-form mesh editing, asset cloning and authenticated direct publishing are outside Study 001.

## Test checklist

- Load DEV on a desktop Chrome or Edge and enter; WASD and free mouse look should move without inversion.
- Switch to BUILDER, select `gravesite` from the asset list or by clicking its stones, move X 5 units; observe the same three-sided enclosure move as a group.
- Nudge a single `hay-01`; verify the other five haystacks stay still.
- Undo, redo, save, then reload developer mode. The browser draft should persist.
- Open the Keeper WALK on the **same browser**; it should load the draft locations.
- Take a screenshot with a note and download REVIEW ZIP. Inspect `HEADLAND_LAYOUT.json` and the PNG.
- Test importing exported JSON and opening a share layout URL in another browser.
- Clear browser draft / open an unmodified browser to confirm approved manifest state.
- Confirm `MZTV/sources/bit-field-031-headland/index.html` is untouched.

**Validation status (2026-10-23):** JavaScript parsed at the level of standalone UI, bridge API, and whole dynamically injected HEADLAND ES module. Full on-device WebGL, ZIP download and asset-drag interaction remain unverified in an interactive browser runner and require an experiential smoke test.
