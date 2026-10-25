# MZTV · BIT FIELD 035 · MZ WORLD · TWISTED TREE

## Edition and human release boundary

**Candidate edition: Study 002, nonfigurative / HEADLAND style v1.2. NOT VISUALLY APPROVED. NOT MERGED.**
Previous public Study 001 remains published and unmodified at https://matchzimmerman.com/MZTV/sources/bit-field-035-twisted-tree/ until MZ.Human approves a revised visual frame and merge.

**Origin:** *The Day I Found the Beauty of Nature*, a fourth-grader's original written story with illustrated cover and photographed contorted tree. These were supplied to MZ.GPT by MZ.Human. **No original child's photos, name, identifiable school/trail/teacher information, or handwritten sources are stored in this public repository.** The story's metaphors—the lemon snowball, black licorice tree, giant ice-cream-cone crowns and discovery of value in smallness—inform the composition.

**Canonical rulebook:** [MZ WORLD · HEADLAND style v1.2](https://github.com/matchzimmerman/haril-studio/blob/main/docs/standards/mz-world-headland.md) in the private haril-studio repository. HEADLAND and SRUTHÁN are the approved print/behavior references; EARHART is also an approved look/feel reference. CROSSING and KAATERSKILL FALLS are not references.

## Six-line working plan

1. **Geography:** sculpted, provisional woodland trail with a dry creek and two footbridges, painted wooden bird markers, wet grass, a path fork, and a woodland clearing. No confirmed coordinates and no claim of geographic registration.
2. **Central subject:** **the actual contorted tree form and the surrounding canopy**. **There is no hiker, keeper, human figure, humanoid proxy, or actor routine anywhere in the autonomous world.** Only the environment, leaves and wildlife exist.
3. **Inputs:** simulated morning light alignment, breeze, canopy stillness, prior moisture, fallen leaves, and a dry creek. Tree stillness and changing light shape the sound/pace; former hiker-based bass mapping is deleted.
4. **Events:** conditional LEMON SNOWBALL / WOODEN BIRDS TURN / DRY RIVER REMEMBERS / TWISTED TREE HOLD; no supernatural history or forced narrative explanation.
5. **Memory:** local rain store, leaf litter, moments of canopy stillness, light traces, event-context memory and logging, under new isolated `mzworld-twisted-tree-v2` keys (and separate walk key).
6. **Print:** child-memory six-ink carving grammar: darkest twisted bark against the lemon clearing, blue/teal canopies against russet floor and GLOW-grass, clearly separated materials, surface-anchored lines and signed sculptural lighting.

## Relational colour and approved visual north-star candidate

**Human-supplied north star** (not yet visually approved as *our rendered frame*): cover pencil drawing and actual tree photograph from the initiating ChatGPT conversation. The photograph informs asymmetrical low-rooted structure and far-reaching right branch; the drawing informs large crown masses, open pale floor, strong wood contours and a single sunlit focal subject. Neither is embedded as texture or public asset; exact pixels and full story reproduction do not belong to the public repo.

**Key authored frame:** camera 1 / CLEARING WIDE; secondary camera 3 / BRANCH PROFILE; camera 2 / TREE ROOTS. The **tree** is the focal mass and strongest dark-light boundary, with broken dark bark in the center/right; the lemon clearing is the warm focal negative space, cool canopies build side/depth planes, russet ground and printed grass bridge foreground and middle distance. Wide/mid/close must remain legible, not become a muddy middle-green cloud. Local camera `?cam=N` chooses an operator; cameras 0, 1 and 2 cover wide/root/profile for comparison.

**Home colourway: AUTUMN CLEARING** (INK / DEEP / SEA / HOT / GLOW / PAPER):
- INK #252840 — cool deepest tree fissures and silhouette.
- DEEP #3a5274 — cobalt-violet canopy underside and branch shadow.
- SEA #518e89 — restrained turquoise canopy middle and grass body.
- HOT #c77350 — russet earth/trail and occasional bark/wood edges.
- GLOW #f2c85f — **lemon sunlit vegetation**, intentional focal accent.
- PAPER #efe5c9 — pale openings, dry river stones and distant negative space.

**Material identities:** GROUND [INK,HOT,PAPER] with horizontally terraced contour carve; CANOPY [INK,DEEP,SEA] with clustered leaf-shadow marks; GRASS [INK,SEA,GLOW] with upright incisions; twisted TREE [INK,DEEP,HOT] with discontinuous knot grain and signed light; dry creek STONE [INK,DEEP,PAPER] with chipped granular flecks; bridge timber [INK,HOT,GLOW] with longitudinal grain; leaves [INK,HOT,GLOW] as sparse movement and punctuations. No dominant ground/canopy shared [DEEP,SEA,PAPER] mapping remains. Focal lemon vegetation is forced to resolve to GLOW, not washed into PAPER.

**Shared colourways retain exact HEADLAND values**:
SIGNAL FLARE: #24123a #5b3fd1 #6fd3c1 #ff7a8a #ffd24a #fbf3e4;
PISTACHIO NIGHT: #10202b #1f4a6e #b6d97a #ff5a7a #f9e7b0 #eef4ea;
ULTRAMARINE: #0c1440 #1f3bb3 #44b8e8 #ff6a1a #ffd0a1 #fff7ec.

Five other palettes named AUTUMN CLEARING, LEMON SNOWBALL, WET GRASS / RUSSET, BLACK LICORICE / TWILIGHT and FIRST FROST / COPPER are new; no existing shared palette name was reused with changed values.

**Required gate still OPEN:** Real WebGL screenshots of same framing from HEADLAND, SRUTHÁN, and TWISTED TREE at wide/mid/close, contact sheets across eight real rendered palette frames, role-coverage percentages for the printed image (crossfade and grain separated), inspection of tree silhouette and foreground material separations, and MZ.Human's first-person review. **These tests are not satisfied by code inspections or mock graphics. No human visual approval has been given.**

## The revised autonomous subject and behavior

All former hiker meshes and code/metadata references, hiker-path state, memory of visits/pauses, hiker-driven bass-note mapping, and hiker camera are deleted. The eighth operator is now WOODLAND / FAR. The tree is stationary and asymmetrical; changes originate in grass/light, leaves, atmosphere and painterly rupture. `MZ.tree` exposes tree position, simulated stillness, light instead of an implied human figure; there is no `MZ.keeper` getter.

A separate browser `walk.html` remains accessible as an optional **human visitor camera**, but its iframe only observes the same nonfigurative forest in walk mode. No body avatar or recorded player-tracking is introduced. The autonomous piece remains no-quest and no-dialogue.

## Interfaces and controls

**Candidate HTML:** `index.html`. **Optional walk camera:** `walk.html`. Mobile portrait and landscape CSS use `100dvh`, safe-area insets, ResizeObserver, visual viewport and orientation-change resizes. In hosted mode, scripts and WebGL2 must initialize; startup/runtime failures display an error rather than a silent blank screen.

Parameters: `?info`, `?fresh=1`, `?audio=0`, `?seed=N`, `?rate`, `?lines=420|540|720`, `?ff=MIN`, `?hour`, `?cam=N`, `?live=0`, `?capture=1`. Active `window.MZ` functions: `tick`, `advance`, `force`, `cam`, `look`, `ink`, `state`, `setWx`, `analyser`, `h`, `grammar`, `tree`, `geo`. `grammar({period,wob,hatch,dith,outline})` now modifies live shader uniform relationships rather than only logging a placeholder.

**Honest known exceptions to the full HEADLAND standard:**
- Exact coordinates, authoritative landscape, live weather, sun/moon astronomy unavailable because real trail site is unverified; labelled simulated, not measured.
- Synthetic audio remains a limited ambient proof, not the HEADLAND hardened spatial mix, convolution room, full harmonic/rupture system or measured spectral QA.
- Print shading and engraving have been rebuilt to honor v1.2 direction, but real GPU render/visual appearance has **not** been validated. Graphic qualities are authored hypotheses pending review.
- Autonomous crew switch 8–16 simulated seconds; has not been verified to the complete approved 16th-note musical-cut criterion.

## Tests / reproducibility (2026-10-25)

PASS: JavaScript source parses. PASS: zero remaining hiker/keeper/PAUSES tokens in revised HTML. PASS: eight distinct palette definitions, three existing names exactly match original HEADLAND inks. PASS: normalized form shading does not contain prior `abs(dot(...))`. PASS: shader data values still pack shade/material/line/alpha and post print maps to six ink roles. PASS: `grammar()` modifies all five print parameters.

PASS: **Mocked WebGL API** initialized; at fixed seed 15, the world advanced through 21,320 simulated seconds (5.9 h), retained finite tree stillness and simulated weather, re-inked across nine epochs (including an explicit force), accumulated leaf litter / light traces, recorded environmental events and accepted forced tree and rupture commands; no JS exceptions. The actual GPU and shaders are **not** validated by this test. The bootstrap/resize/mobile shell previously passed CSS tests in Study 001; after this edition, mobile layout needs another real-device pass.

**NOT YET TESTED**: true WebGL compilation / visual frames, palette comparison/contact sheet, per-pixel ink coverage, sound spectral QA, actual Safari rendering/performance, correct world/time evidence, user acceptance. This branch is a code-complete **review candidate**, not a visually accepted/production-authorized replacement.
