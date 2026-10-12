# MZCMG site — visual-first V3 revision

**Status:** preview for editorial testing; production homepage untouched.

**Preview:** https://www.matchzimmerman.com/site-inquiry-preview/  
**Previous V2:** https://www.matchzimmerman.com/site-v2-preview/

## Design decisions

- Lead with actual work: embedded MZTV broadcast, FIELD STATION: MAGPIE exhibition thumbnail/tour, real 48 PLANT specimen images.
- Minimal project descriptions, plain titles, straightforward navigation.
- Put project context on project pages, not in a giant homepage explanation.
- Keep studio research language short and optional, beneath the work.
- Preserve the relationship between projects and their source archives.
- Load TRACKSIDE and SHEEPDOG browser simulations on click, not automatically, to avoid competing CPU load.
- Link out to actual source builds, 3D specimens, MAGPIE archive and moving-image archive.

## Pages

- `index.html` — MZTV, MAGPIE, MZTV projects, archive, about.
- `mztv.html` — Twitch, projects, source records and a short research note.
- `magpie.html` — Tuttle tour, world, story, exhibition and archive.
- `48-plant.html` — specimens, simulations, 3D studio and records.

## Grounded assets

- 48 PLANT images: `MZTV/sources/48-plant-002/archive/final.png`, `MZTV/sources/48-plant-001/stills/v2-final-frame.jpg`
- MAGPIE video: https://youtu.be/nrq2BpCMCMk
- MZTV stream: https://www.twitch.tv/matchzimmerman
- MZCam origin and reuse: `MZTV/lib/README.md`

The published preview includes no generated images, no separate archival backend and no fabricated clip catalog. Preview pages are marked `noindex,nofollow` but remain publicly accessible by URL. Work on the live root homepage is out of scope until approved.
