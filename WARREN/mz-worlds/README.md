# MZ WORLDS × Town of Warren — collaboration bridge v0.1

**MZ-owned original:** `matchzimmerman/matchzimmerman.github.io/WARREN/mz-worlds/`

**Mick's reviewable integration:** `ItsMick/town-of-warren/integrations/mz-worlds/`

This first runnable bridge places the human-directed, procedural **Warren Field Study 002** next to Mick's independent historical-research viewers. It is **not a unified georeferenced scene**, and it does **not** import or alter Mick's historical geometry, coordinates, records, or photos.

## Run

- MZ publication: `https://www.matchzimmerman.com/WARREN/mz-worlds/` once GitHub Pages publishes the committed files.
- Mick checkout (after merge): from repository root run `python3 -m http.server 8000`, then open `http://localhost:8000/integrations/mz-worlds/`.
- `01 / FIELD` runs a walkable MZ WebGL scene. `02 / RESEARCH` opens Mick's local foundations map, 3D town, or 1908 plan. `03 / COMPARE` shows both without claiming spatial alignment.
- In Mick's mirror, `engine/index.html` and `engine/map.js` are **byte-for-byte copies** of the MZ source at `WARREN/experience/` at initial integration. They exist so the scene can run from Mick's own checkout. On the MZ website, this interface loads the still-canonical `../experience/index.html`.
- On the public MZ site, the private Mick research viewers are deliberately *not* embedded or republished; an authorized collaborator can open the research repository separately.


### Source-custody check

The original WebGL `index.html` and `map.js` are pinned by their exact Git blob hashes in `source-pin.json`. Run `node integrations/mz-worlds/verify-mirror.cjs` in Mick's repository, or `node WARREN/mz-worlds/verify-mirror.cjs` in the MZ repository. This verifies that the local engine copy still matches the initial source pin. It does not establish runtime compatibility or historical accuracy. Changes to the scene need an explicit source-pin update and reviewer-visible diff.

## Handoff contract

`EXPORT HANDOFF` downloads a `mz-warren-observation/v1` JSON file with the human's typed observation and the evidence view under inspection. The export is **unverified**; `historicalLocation` and `sourceReference` are explicitly null. It does not issue a pull request, push files, claim a foundation, or open a private data connection.

For local validation: `node integrations/mz-worlds/verify-handoff.cjs path/to/observation.json` inside Mick's checkout, or `node WARREN/mz-worlds/verify-handoff.cjs path/to/observation.json` inside MZ's checkout. Passing validates **shape and custody flags only**, not historical truth. Mick's agents can use the packet as a proposed investigation input to the isolated verification workflow, with independent source review and approval.

## Ownership and integration rules

- **MZ authority:** the embodied world, appearance, interaction, MZCAM direction, field observations and creative decisions; source lives in the MZ-only directory (and existing `WARREN/experience/`).
- **Mick authority:** archival evidence, LiDAR observations, source registrations, correspondence, research catalog and historical claims; source lives outside `integrations/mz-worlds/` in Mick's project.
- `integrations/mz-worlds/` is a reviewable, namespaced **mirror** of MZ-authored code. A GitHub directory is not a permission boundary. Updates require an explicit authored patch and review; do not let an agent silently resync or overwrite either side.
- Do not use a modeled architectural shape as a location claim. In particular the original 1915/1908 plan frames have not been accepted as registered to WGS84 or to measured modern LiDAR.
- Do not copy private evidence, family data or source media to the public MZ site without separate rights and source review.
- Canonical main-branch changes to Mick's evidence system follow his existing `AGENTS.md`, source custody, and validation gates.
- Human review is needed to promote any interpretation into a documentary or archaeological research conclusion.

## Initial source pin

Mick research baseline: `ItsMick/town-of-warren@44c26271a4799cf54b5f61ef9232c23f89d2d680` (Oct 17, 2026 ET).

The mirrored MZ scene is a **snapshot**; no automatic bidirectional sync or agent-to-agent execution is installed. Future sync should have an explicit source commit, hashes, diff, and approval receipt.
