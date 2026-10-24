# MZ WORLDS · ONE EDIT · EXPERIMENT 001

**Live:** https://matchzimmerman.com/MZTV/sources/one-edit/

Browser-native living-systems art grounded in a real yeast ADE2 CRISPR editing phenotype. Two initially matched populations evolve side by side. The visitor may apply one modeled edit to a locally selected lineage, change external adenine supply, observe inheritance, and compare genotype with appearance. The simulation is qualitative and artistic, **not** a validated laboratory or biomedical simulator.

**Docs:** [Concept brief](BRIEF.md) · [Model/limits](MODEL.md) · [Six-stage build plan](PLAN.md)

**Controls:** tap either field to inspect; select a cell in B to aim the edit; choose Disrupt or Restore ADE2 (resets both baselines); select external adenine and contact-field size; make one edit; run/pause, speed, sonic field, show lineages, export run data.

**Build:** standalone HTML, Canvas2D, WebAudio, no dependencies or external services. Works on mobile and desktop.


## v0.2 — Field guidance

- A plain-language orientation identifies budding yeast, ADE2, adenine, and pigment before any intervention.
- Contextual field notes invite observation and comparison; a latest-observation strip and scrollable ledger report detected model events rather than timed lesson phases.
- Both populations support tapping for cell inspection. The right field also uses the selected cell to center an editing attempt. Inspection includes a stylized budding-cell silhouette, not microscopy.
- Labels explain each edit mode and environmental control in ordinary language. The disrupted-gene meter is separate from average modeled pigment intensity.
- Expandable definitions cover CRISPR, DNA/genome, ADE2+/ADE2−, adenine, cells, inheritance, and simulation limitations.
- Editing-pulse rates, growth, geometry, and color values remain fictional qualitative choices, not laboratory predictions.


## v0.2 — Observation and inheritance release

- Inspect either population by pointer, touch, or keyboard (arrows / Enter / Space). Mother, daughter and sister navigation follows stored ancestry. Gold family rings and optional edit-history diamonds distinguish kinship, editing and red pigment.
- Open biology context and individual control explanations when needed. The cells continue evolving while information is open. Mode changes reset both fields; adenine changes affect both together.
- Timestamped observations detect inherited gene states, changed-but-pale cells, delayed pigmentation, restoration, count divergence, same-cell environmental response, no-change pulses and display saturation. Find buttons locate the evidence cell. An observation describes its recorded beat, not necessarily the cell's current appearance.
- Exports include cell ancestry, observation evidence, initial adenine, environmental changes, pulse and history. These are artistic model records, not laboratory data.
- `?seed=42` repeats a starting world. Following HEADLAND's capture convention, `?seed=42&capture=1` disables animation and exposes `MZ.advance(beats)` and a copied `MZ.snapshot()` for reproducible inspection. Replay the same choices at the same beats, starting with the exported initial adenine and scenario. There is no import UI.

### Verification

`node tests/browser.cjs` requires Playwright and Chromium (`CHROMIUM_PATH` can select the browser). No dependencies are loaded by the artwork itself. Tests cover matched pre-edit worlds, disruption/restoration, inheritance, cell-specific nutrient evidence, scarce adenine, failed pulses, display capacity, deterministic replay, export, keyboard/touch, live pause/resume, sound toggle and widths 320/390/768/1440. Chromium passed on 2026-10-24; visual desktop/mobile screenshots reviewed. Sound synthesis initialization was checked, not perceptual audio quality. Safari/iOS, physical-device, assistive-technology and novice visitor sessions remain follow-up checks.

### Publication

Edit the canonical `MZTV/sources/one-edit/` files on `main`; the existing **pages build and deployment** workflow publishes the repository to its custom domain. This release changes no other world or deployment configuration.
