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
