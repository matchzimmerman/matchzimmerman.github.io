# Build log · BIT FIELD 048 · Phase 01

Question → Evidence → Approximation → Build → Comparison → Revision.

**Question.** Can a fixed view from the upper deck of Memorial Stadium on 27 Dec 1959 be built from documented evidence, printed in HARBOUR LIGHT's six inks, with every approximation visible?

**Evidence.** The core configuration is well constrained: horseshoe open to the north, diamond at the south (S02, S05, S10), roofless upper deck added 1953–54 and extended in 1964 (S01, S02), 1954 Gunther scoreboard in centre field (S01). The geometry is sparse: three dated measurements (72 ft backstop in 1957, 309 ft foul poles, 445/446 ft CF and alleys) and lifetime row counts. The game record gives kickoff at 14:05 EST and attendance of 57,545, but the weather conflicts: drizzle and 49 °F (S07) against "cool and crisp" (S09). HABS (S11) and the 1963 media guide (S13) could not be reached from the build environment and are logged as unread.

**Approximation.** I fitted one circle through the backstop and the poles for the lower-deck front, and stepped rows in at assumed rakes. The upper deck is set 11 m out over the lower deck and stops 50 ft short of the poles. Independent check: that deck end meets the far 40 within 1 m when the gridiron sits 14 m north of the backstop, matching S03's football description, and the rim height lands within 1.4 m of the 116 ft façade.

**Build.** Pure-data geometry with a claim id on every triangle → z-buffered CPU rasterizer → three printers (six-ink, neutral, evidence) from one G-buffer. Bayer table and ink rule are reused from 046/047.

**Comparison.** See `captures/contact-sheet.png`. The neutral render shows the model is coherent. The six-ink print holds the structure (stands, field paint, scoreboard lamps), but under drizzle it compresses into two blue inks under a cream sky. The clear-sky alternate, with the 14° south-west sun throwing the west stand's shadow across the field, sits closer to HARBOUR LIGHT.

**Revisions made in Phase 01.**
1. *Evidence misattribution.* The first evidence view showed all stands as creative because the crowd texture carried the claim. Fixed: structure carries the structural claim, the crowd is logged as a texture claim, and the playing surface is split per pixel into lines / gridiron / infield / turf.
2. *Framing.* The first cam0 frame looked over the near stands and missed the west arm. Re-aimed (yaw 20°, pitch −15°, FOV 74°) so the foreground rows, west arm, open end and scoreboard are all in frame.
3. *Print legibility.* 4-in lines vanished at 320 px. Added pixel-footprint coverage (×2.4, logged as a print choice). Faces were clamped into the crowd's tone, depth haze added for drizzle (visibility 1.4 km), and a gentle S-curve applied before quantising.

**Next (pending review).** See `REVIEW-QUEUE.md`.
