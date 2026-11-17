# MZGS Field · Jones Falls (password-protected)

Live: https://www.matchzimmerman.com/BALTIMORE/jones-falls/

`index.html` is the Jones Falls Field page from `matchzimmerman/haril-studio`
(`ground-survey/sites/jones-falls/field/index.html`, branch `claude/mzgs-jones-falls-field`),
encrypted with AES-256-GCM under a password (PBKDF2-SHA256, 600,000 iterations) by
`ground-survey/sites/jones-falls/tools/build_gate.py`. Only ciphertext is stored here; the password
is not in either repo. Ask MZ.Human for it.

To update: rebuild the Field page, then
`JF_PASSWORD=... python3 tools/build_gate.py --page field/index.html --out <this folder>/index.html`.
Each rebuild makes a new salt, so a device that ticked "remember" will be asked once more.

`shot-tower/index.html` is the Shot Tower model viewer (haril-studio `ground-survey/sites/jones-falls/landmarks/shot-tower/viewer.html`), gated with the same password.
