#!/bin/sh
# assemble index.html from parts/, then inject the world model (run from the repo root or anywhere)
D="$(cd "$(dirname "$0")/.." && pwd)"
cat "$D"/parts/p1.html "$D"/parts/p2.html "$D"/parts/p3.html "$D"/parts/p4.html "$D"/parts/p5.html "$D"/parts/p6.html > "$D/index.html"
python3 "$D/tools/build_model.py"
