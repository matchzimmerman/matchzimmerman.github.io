# MZTV / THE MILL — SIGNAL PRESS v0.2

**Status:** Public projector-test prototype, published on MZTV, October 26, 2026. **Not a finished venue installation.**

## Live
- Interactive operator page: https://www.matchzimmerman.com/MZTV/sources/mill-signal-press/
- Projection starting point (INFO box hidden): https://www.matchzimmerman.com/MZTV/sources/mill-signal-press/?info=0
- Hero rainbow burst demo: https://www.matchzimmerman.com/MZTV/sources/mill-signal-press/?mode=burst&info=0
- Sticker field: https://www.matchzimmerman.com/MZTV/sources/mill-signal-press/?mode=wall&info=0
- Tunnel: https://www.matchzimmerman.com/MZTV/sources/mill-signal-press/?mode=tunnel&info=0

## Projection setup
1. Open the link in Chrome on the computer connected to The Mill's projector.
2. Hide CONTROLS with the X button; if needed press **I** to hide the technical readout.
3. Use **F** (or your browser's fullscreen control) for fullscreen.
4. Select AUTO for ongoing motion, or WALL/BURST/TUNNEL to hold a composition.
5. Keep RAINBOW SCOPE on **ONE MAIN ASSET**, **ALL ASSETS**, or **OFF / NONE**. For an incremental fade, select **INCREMENTAL / FAR FADE** and adjust TRAIL OPACITY, TRAIL LENGTH, FAR-POINT SWIRL.
6. PNG saves a single frame. RECORD WEBM saves video in supporting browsers; recorded export has no soundtrack.
7. Use **MIC** for audio reactivity after permission is granted. This may require HTTPS and an appropriate audio input/routing configuration.

## Technical
Single self-contained HTML embeds 13 logo extracts (original vector-derived assets). Responsive real-time Canvas 2D, no external fonts or image CDN and no IMG/GEN. Original Illustrator master remains in its original Drive folder; this public demonstration contains the logo cutouts, so share only with the venue's approval.

This is a **graphic identity / MZTV procedural animation exception** to the geographic HEADLAND build canon: there is no real-place physical terrain, simulated weather, inhabitants, or ambient world simulation. Its camera and effect grammar are graphic-performance concepts rather than natural-history controls.

## User controls
SPACE pause/resume · 1 AUTO · 2 WALL · 3 BURST · 4 TUNNEL · I info · R colorway rupture · F fullscreen · M microphone.

Console interface: `window.MZ`, including `grammar({ rainbowScope:'hero'|'all'|'none', trailOpacity:0.7, incrementalTrail:true, swirl:0.72, depth:1, trails:0.8 })`.

## Current limitations
- 2.5D repetition and perspective, not true polygonal 3D extrusion.
- Browser/operating-system graphics performance varies by projector computer.
- Has not yet been verified on The Mill's actual projector/audio rig.
- The current WebM recording is silent.
- No server-side video renderer or synchronized camera switching is included.
- Avoid flashing/strobe-heavy high-intensity presets during public shows, and always provide operator override and a projector blackout option.
