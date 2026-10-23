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

## Keeper / SEALS integration — Study 002 (2026-10-23)

**Status:** implemented in HEADLAND / WALK, browser playtest pending.

- The player **is the original black-veiled keeper**, not an extra character. The existing keeper mesh and original wind-responsive veil/dress shaders remain intact. Its normal autonomous walking routine is replaced only in this private WALK instance by movement sent from the player.
- Third-person camera floats about 7.4 world units behind the keeper with damped following and a slightly raised view. Non-inverted camera orbit on touch and desktop stays in place. The keeper rotates in the actual travel direction; forward control remains camera-relative.
- Regular pace is 2.85 world units per second, Shift increases it to 5.4. Camera orbit can continue while standing still.
- HEADLAND's boat, gulls, seal, wind, waves, live weather, audio, rare events and print palette continue independently. Observe restores the original seven-camera director while the same keeper remains in the world.
- WALK fetches the unchanged canonical `../index.html` at runtime and inserts two carefully anchored keeper API extensions into its in-memory source; the iframe uses `srcdoc`. Nothing is committed to the broadcast engine itself. The source transform fails with a clear message if an upstream anchor changes.
- `seals-scenes.js` adds eight linked memory locations inspired by **TO SEE WHAT SEALS SEE**:
  1. Gravesite on the hill (no invented gravestone inscriptions)
  2. Old apple tree
  3. Dry-stone farm walls
  4. Painted green gate with concrete pillars
  5. Turf stacked to dry on the bog
  6. Haystacks in the coastal fields by the beach
  7. Green hay barn with raised hay floor
  8. Old black bicycle leaning against a tree
- Memory places are navigable in the world, listed under PLACES, and marked on the field survey. Materials use HEADLAND's existing six OBAS inks and share its light and atmosphere. No new generated images or borrowed external assets.
- The original GPS-based SEALS world manifest describes distinct real sites separated by up to kilometers. **This first integration is intentionally a condensed, interpretive arrangement within HEADLAND's existing terrain**—not an assertion of accurate coordinate reconstruction or a replacement for that manifest.
- Scene geometry batches by material into a small number of static meshes to avoid hundreds of extra per-frame draw calls on phones.

### Verification still required
Inline WALK JavaScript and the standalone SEALS geometry injection were syntax checked, the GitHub commit verified and GitHub Pages workflow checked. A graphical mobile playtest is still needed for correct source transformation, HEADLAND module startup, camera follow, live audio, movement, keeper mesh visibility, and cross-device frame rate. If scene boot fails, inspect browser console and the WORLD COULD NOT LOAD overlay.

### Original stream protection
`MZTV/sources/bit-field-031-headland/index.html` remains unchanged. The WALK instance stores its own seeded headland state, separate from the broadcast; it is neither the same clock frame nor a multiplayer-linked counterpart.
