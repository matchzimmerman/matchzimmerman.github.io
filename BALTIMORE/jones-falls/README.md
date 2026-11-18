# MZGS Field · Jones Falls

Live: https://www.matchzimmerman.com/BALTIMORE/jones-falls/ (open, no password, as of 2026-11-18; pages carry noindex)

`index.html` is the Jones Falls Field page from `matchzimmerman/haril-studio`
(`ground-survey/sites/jones-falls/field/index.html`, branch `claude/mzgs-jones-falls-field`), copied as built.
`shot-tower/index.html` is the Shot Tower model viewer (`ground-survey/sites/jones-falls/landmarks/shot-tower/viewer.html`).

To update: rebuild the Field page and copy it here. To put a password back on, use
`JF_PASSWORD=... python3 tools/build_gate.py --page field/index.html --out <this folder>/index.html`
(AES-256-GCM, PBKDF2-SHA256 600,000 iterations); only ciphertext would then be stored.
