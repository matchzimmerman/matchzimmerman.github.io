# MZ WORLDS — MADLIB ENGINE 001: The Inverted Fairground

**Status:** Public experimental browser prototype (2026-10-26). Not yet a template-driven MADLIB generator.

- **Live target:** https://www.matchzimmerman.com/MZTV/sources/madlib-001-inverted-fairground/
- **Alternate GitHub Pages target:** https://matchzimmerman.github.io/MZTV/sources/madlib-001-inverted-fairground/
- **Entry:** [index.html](./index.html). Self-contained WebGL, inline shaders, no external JS/assets.
- **Canonical private tracking:** HARIL MULTI-AGENT HUB → MZ WORLDS → MADLIB ENGINE.
- **Do not duplicate private HARIL standards into this public repository.**

## Narrative variables (frozen demonstration)
1. Location: abandoned amusement park
2. Atmosphere: mysterious
3. Character: mechanical bird
4. Discovery: glowing key
5. Unexpected event: gravity reverses

## Experiential controls
- Explore using WASD and pointer drag; touch joystick on touch devices.
- Find the ticket booth key and examine it using E/button, or jump to the key for test purposes.
- Run the pre-scripted MZCAM cinematic tour.
- Export a PNG still from the canvas.
- Try scene-linked voice recordings and browser-native film capture (container/codec support varies by browser; WebM fallback).
- Reset to restore normal gravity.

## Constraints, provenance, testing
- **Verified:** source committed to GitHub; JS syntax parse; local user tested a previous downloadable build and reported it as a successful first experience.
- **Not yet independently verified:** live GitHub Pages rendering, browser-to-browser media/voice export, full mobile visual QA, and actual encoded MP4 availability.
- **Not implemented:** student-editable Mad Lib world compilation, persistent recipes/voiceover storage, full physics simulation, export pipeline guaranteed to produce MP4, accessibility pass, and automated class publication.
- This is a deliberately constrained procedural visual proof-of-concept, not historical reconstruction or a finished world builder.
- No generated imagery/assets have been incorporated.

## Next build gate
1. Verify site serving 200 OK and actual WebGL display in target browsers.
2. Test E/gravity, pointer and mobile controls, PNG download, recording permissions, WebM/MP4 fallbacks.
3. Build the **Mad Lib → validated typed controls → deterministic World Recipe → renderer** bridge.
4. Separate student authoring from world playback; add accessibility/reduced-motion and student privacy/storage policy.
5. After human review, consider integration back into MZ WORLDS SDK / MZCAM / Documentary Engine.
