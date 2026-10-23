# HEADLAND / WALK — Interactive Study 001

Live visitor entry: https://matchzimmerman.com/MZTV/sources/bit-field-031-headland/walk/

## Purpose
Let a visitor physically navigate the existing procedural HEADLAND environment while the autonomous simulation continues. This is **not a scene remake**, new art asset, new world, stream replacement, or Godot conversion.

## Implementation
- `walk/index.html` is a parent control layer. It loads the canonical adjacent `../` HEADLAND broadcast in a same-origin iframe.
- The original source already exposes `window.MZ.look(position, target, fov)`, `MZ.h(x,z)`, `MZ.coast(x)`, `MZ.geo`, `MZ.state`, and `MZ.audio`. No original source code is modified.
- The visitor camera is updated via `MZ.look` each animation frame; selecting **OBSERVE** releases this override so HEADLAND's original seven observational cameras resume control.
- Lightweight first-person movement follows HEADLAND's own heightfield. Pier and cliff boundaries are approximate, not rigid-body collision. Quick-jump landmarks provide convenient access to the cottage, cliff path, stair, and pier.
- Its iframe uses `seed=31081` to namespace persistent world state apart from the ordinary streaming browser source (`mzworld-headland-v1-s31081`), while retaining local memory and rare events in this experience.
- Original 3D geometry, six-ink print, swells, inhabitants, weather, music, event cooldowns, and rupture are owned by HEADLAND itself; not copied or reconstructed.
- Sound only unmutes on an explicit visitor action. Origin must match for camera integration.

## Interaction
Desktop: WASD/arrows to walk, mouse to look (click to lock, Esc to release), Shift to move faster; keys 1–4 jump to fixed places; V switches WALK/OBSERVE; M controls sound; H or ? shows help.
Touch: left drag to move, right drag to look; UI controls provide view and sound actions.

## Source / runtime requirements
Uses the live public HEADLAND source at `../`. The parent must be hosted under the same protocol, host, and port. The underlying HEADLAND engine requires WebGL 2, JavaScript modules and access to its Three.js imports from jsDelivr; it is not an offline standalone port.
The original HEADLAND world may change independently, so changes to the `window.MZ` interface should be regression-tested here.

## Validation
- 2026-10-23: Inline control JavaScript passed syntax compilation; committed to `main`.
- Confirmed original code exposes camera, terrain, coast, geometry and audio controls used by visitor interface.
- GitHub Pages pipeline triggered. **Manual visual / movement / sound validation is still required.**
- Source is intentionally non-invasive: no changes to HEADLAND's original `index.html` or existing broadcast state.

## Next test
Open the entry in desktop Chrome or Edge. Enter with sound; traverse the cottage path and pier; switch to Observe and back; confirm live weather, keeper and gulls continue; repeat with touchscreen if needed.

## Mobile and wayfinding pass — 2026-10-23

- **Non-inverted horizontal look:** a rightward mouse movement or rightward touch drag pans the camera right; left drags pan left. Pitch remains conventional.
- **Mobile performance:** 420 print-pass lines in portrait / 440 in landscape, instead of 720 on desktop. The original WebGL renderer and artwork remain unchanged. Lines are selected once at load, not continuously rebuilt during rotation.
- **Floating left thumbstick:** touch starts a joystick at the point of contact; the right half remains a look zone. Multi-touch pointers are tracked separately, and control state is reset when focus is lost.
- **Walking print clarity:** HEADLAND's original `MZ.grammar` API softens hatch amplitude, dither, and line wobble for WALK while retaining material edges and six-ink palettes. OBSERVE restores the current epoch's original print grammar. An **INK LIGHT / INK ORIGINAL** control compares the two; the original stream URL and source have not changed.
- **Visible movement:** the new field survey draws the actual coast from `MZ.coast`, the world’s existing major route, and the walker’s actual world coordinate and facing. Speed is based on successful displacement, not merely pressed controls; blocked movement is indicated as `EDGE · REPOSITION`.
- **Layout:** compact controls and map for phone portraits and short-height phone landscapes, respecting mobile safe-area insets.

### Test status
- GitHub contents read/write confirmed and updated control script parses successfully as JavaScript.
- Same-origin wiring and available simulation API verified against the current HEADLAND source.
- **Pending hands-on check:** iOS Safari and Android Chrome visual texture readability, forward movement, left/right panning, thumbstick placement, safe-area clearance, and restore-after-OBSERVE; WebGL visual browser validation was not available within the automated runner.

### Suggested mobile smoke test
1. Open in a phone browser and enter the world. Move a finger to the right in the look zone; the view must pan right.
2. Touch the left half and drag upward; the orange triangle on FIELD SURVEY must travel and its speed should become nonzero.
3. Stop walking: speed goes to zero, independent of movement in the sea and the print. Walk toward a coastline boundary and look for EDGE · REPOSITION.
4. Toggle INK LIGHT / INK ORIGINAL and compare moving over featureless ground; switch to OBSERVE and back to confirm the six-ink camera view persists without modifying the stream.
5. Rotate portrait/landscape and verify controls and survey do not obscure the main scene.
